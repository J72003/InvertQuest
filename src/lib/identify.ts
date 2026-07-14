import { supabase } from './supabase';
import type { AIPrediction, RoboflowPrediction, ClaudePrediction } from '../types/database';

const ROBOFLOW_MODEL_URL = process.env.EXPO_PUBLIC_ROBOFLOW_MODEL_URL;
const ROBOFLOW_API_KEY = process.env.EXPO_PUBLIC_ROBOFLOW_API_KEY;
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

// Roboflow response shape
interface RoboflowResponse {
  predictions: Array<{
    class: string;
    class_id: number;
    confidence: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  image: { width: number; height: number };
}

async function runRoboflow(base64: string): Promise<RoboflowPrediction | null> {
  if (!ROBOFLOW_MODEL_URL || !ROBOFLOW_API_KEY) return null;

  try {
    const response = await fetch(`${ROBOFLOW_MODEL_URL}?api_key=${ROBOFLOW_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: base64,
    });

    if (!response.ok) return null;

    const data: RoboflowResponse = await response.json();
    if (!data.predictions?.length) return null;

    // Take highest-confidence prediction
    const best = data.predictions.reduce((a, b) => (a.confidence > b.confidence ? a : b));

    return {
      class_name: best.class,
      class_index: best.class_id,
      confidence: best.confidence,
      bbox: { x: best.x, y: best.y, width: best.width, height: best.height },
    };
  } catch {
    return null;
  }
}

async function runClaude(base64: string): Promise<ClaudePrediction | null> {
  if (!SUPABASE_URL) return null;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const response = await fetch(`${SUPABASE_URL}/functions/v1/identify-specimen`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageBase64: base64 }),
    });

    if (!response.ok) return null;

    const { prediction } = await response.json();
    return prediction as ClaudePrediction;
  } catch {
    return null;
  }
}

export async function identifySpecimen(base64: string): Promise<AIPrediction> {
  const [roboflowResult, claudeResult] = await Promise.allSettled([
    runRoboflow(base64),
    runClaude(base64),
  ]);

  return {
    roboflow: roboflowResult.status === 'fulfilled' ? roboflowResult.value : null,
    claude: claudeResult.status === 'fulfilled' ? claudeResult.value : null,
  };
}

// Derive a single unified suggestion from both model outputs
export interface AISuggestion {
  classIndex: number;
  confidence: number;
  agreement: 'both' | 'roboflow-only' | 'claude-only' | 'disagree' | 'none';
  bbox: RoboflowPrediction['bbox'] | null;
}

export function deriveAISuggestion(prediction: AIPrediction): AISuggestion | null {
  const { roboflow, claude } = prediction;

  if (!roboflow && !claude) return null;

  if (roboflow && claude) {
    if (roboflow.class_index === claude.class_index) {
      return {
        classIndex: roboflow.class_index,
        confidence: Math.max(roboflow.confidence, claude.confidence),
        agreement: 'both',
        bbox: roboflow.bbox,
      };
    }
    // Disagree — pick the one with higher confidence
    const winner = roboflow.confidence >= claude.confidence ? roboflow : claude;
    return {
      classIndex: winner.class_index,
      confidence: winner.confidence,
      agreement: 'disagree',
      bbox: roboflow.bbox,
    };
  }

  if (roboflow) {
    return {
      classIndex: roboflow.class_index,
      confidence: roboflow.confidence,
      agreement: 'roboflow-only',
      bbox: roboflow.bbox,
    };
  }

  return {
    classIndex: claude!.class_index,
    confidence: claude!.confidence,
    agreement: 'claude-only',
    bbox: null,
  };
}
