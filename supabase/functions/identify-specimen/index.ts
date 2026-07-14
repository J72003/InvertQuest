// Supabase Edge Function: identify-specimen
// Receives a base64-encoded image or a Supabase Storage path,
// calls the Anthropic Claude vision API, and returns a structured prediction.
//
// Deploy: supabase functions deploy identify-specimen
// Secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// The 13 classes the model is constrained to
const CLASS_NAMES = [
  'Baetidae',
  'Berosus',
  'Caenidae',
  'Cheumatopsyche',
  'Chimarra',
  'Crambidae',
  'Elmidae',
  'Hyalella',
  'Hydropsyche',
  'Hydroptila',
  'Leptohyphidae',
  'Petrophila',
  'Psephenus',
];

interface IdentifyRequest {
  // Either supply a base64 data URI or a Supabase Storage path
  imageBase64?: string;   // data:image/jpeg;base64,...
  imagePath?: string;     // storage path, e.g. "userId/filename.jpg"
}

interface ClaudePrediction {
  class_name: string;
  class_index: number;
  confidence: number;
  reasoning: string | null;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    // Verify caller is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const body: IdentifyRequest = await req.json();
    let imageData: string;
    let mediaType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg';

    if (body.imageBase64) {
      // Strip data URI prefix if present
      const match = body.imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        mediaType = match[1] as typeof mediaType;
        imageData = match[2];
      } else {
        imageData = body.imageBase64;
      }
    } else if (body.imagePath) {
      // Fetch from Supabase Storage using service role
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );
      const { data, error } = await supabaseAdmin.storage
        .from('specimens')
        .download(body.imagePath);

      if (error || !data) {
        return new Response(
          JSON.stringify({ error: 'Could not fetch image from storage' }),
          { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
        );
      }

      const buffer = await data.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      imageData = btoa(binary);
    } else {
      return new Response(
        JSON.stringify({ error: 'Provide imageBase64 or imagePath' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const prompt = `You are an expert freshwater macroinvertebrate taxonomist. Examine this specimen photograph and identify which of the following 13 taxa it most likely belongs to:

${CLASS_NAMES.map((name, i) => `${i}. ${name}`).join('\n')}

IMPORTANT:
- You MUST choose exactly one from the list above, even if uncertain.
- Reply ONLY with valid JSON — no prose before or after.
- Format: {"class_index": <0-12>, "class_name": "<name>", "confidence": <0.0-1.0>, "reasoning": "<one sentence>"}
- confidence 0.9+ = very certain; 0.7-0.89 = likely; 0.5-0.69 = possible; below 0.5 = uncertain guess`;

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001', // Fast and cost-efficient for identification
        max_tokens: 256,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: imageData },
              },
              { type: 'text', text: prompt },
            ],
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      const errText = await anthropicResponse.text();
      return new Response(
        JSON.stringify({ error: `Anthropic API error: ${errText}` }),
        { status: 502, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
      );
    }

    const anthropicData = await anthropicResponse.json();
    const rawText = anthropicData.content?.[0]?.text ?? '';

    let prediction: ClaudePrediction;
    try {
      prediction = JSON.parse(rawText);
      // Validate class_index bounds
      if (prediction.class_index < 0 || prediction.class_index > 12) {
        throw new Error('class_index out of range');
      }
    } catch {
      // Claude returned something malformed — return low-confidence fallback
      prediction = {
        class_index: 0,
        class_name: CLASS_NAMES[0],
        confidence: 0.1,
        reasoning: 'Could not parse model response',
      };
    }

    return new Response(JSON.stringify({ prediction }), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } },
    );
  }
});
