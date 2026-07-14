import { useState, useEffect } from 'react';
import { identifySpecimen, deriveAISuggestion, type AISuggestion } from '../lib/identify';
import type { AIPrediction } from '../types/database';

interface UseAIIdentificationResult {
  aiPrediction: AIPrediction | null;
  suggestion: AISuggestion | null;
  isLoading: boolean;
}

export function useAIIdentification(base64: string | null): UseAIIdentificationResult {
  const [aiPrediction, setAIPrediction] = useState<AIPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(!!base64);

  useEffect(() => {
    if (!base64) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    identifySpecimen(base64)
      .then((result) => {
        if (!cancelled) {
          setAIPrediction(result);
        }
      })
      .catch(() => {
        // AI failure is non-fatal; proceed with no suggestion
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [base64]);

  const suggestion = aiPrediction ? deriveAISuggestion(aiPrediction) : null;

  return { aiPrediction, suggestion, isLoading };
}
