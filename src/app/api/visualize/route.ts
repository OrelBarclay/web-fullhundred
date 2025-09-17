import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, stylePrompt, width, height } = await request.json();
    if (!stylePrompt && !imageBase64) {
      return NextResponse.json({ error: 'Missing input' }, { status: 400 });
    }

    // Use Replicate image-to-image as a simple, elegant backend
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'Missing REPLICATE_API_TOKEN' }, { status: 500 });
    }

    const clampTo64 = (n: number, min = 64, max = 1024) => {
      const clamped = Math.max(min, Math.min(max, Math.round(n / 64) * 64));
      return clamped;
    };
    const targetW = clampTo64(typeof width === 'number' ? width : 768);
    const targetH = clampTo64(typeof height === 'number' ? height : 768);

    const body: { input: { prompt: string; text?: string; strength: number; image?: string; num_inference_steps?: number; guidance_scale?: number; width?: number; height?: number } } = {
      input: {
        prompt: stylePrompt || 'high-end bathroom renovation, professional interior render',
        text: stylePrompt || 'high-end bathroom renovation, professional interior render',
        // Guidance to preserve layout
        strength: 0.5,
        num_inference_steps: 28,
        guidance_scale: 7,
        width: targetW,
        height: targetH,
      },
    };
    if (imageBase64) {
      body.input.image = imageBase64;
    }

    // Replicate requires a version. Do not send `model` here.
    const modelVersion = process.env.REPLICATE_MODEL_VERSION; // e.g. "<version-hash>"
    if (!modelVersion) {
      return NextResponse.json({ error: 'Missing REPLICATE_MODEL_VERSION (Replicate requires `version`)' }, { status: 500 });
    }

    // Replicate standard v1 predictions API
    const resp = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${token}`,
      },
      body: JSON.stringify({ version: modelVersion, ...body }),
    });

    const pred = await resp.json();
    if (!resp.ok) {
      const detail = (pred && (pred.detail || pred.message || pred.title)) || 'AI generation failed';
      return NextResponse.json({ error: detail }, { status: 500 });
    }

    // Poll for completion
    let status = pred.status;
    let outputUrl: string | null = null;
    const pollUrl: string | undefined = pred.urls?.get;
    const maxAttempts = 40;
    let attempts = 0;
    while (status !== 'succeeded' && status !== 'failed' && attempts < maxAttempts && pollUrl) {
      await new Promise((r) => setTimeout(r, 1500));
      const pr = await fetch(pollUrl, {
        headers: { Authorization: `Token ${token}` },
      });
      const pj = await pr.json();
      status = pj.status;
      if (status === 'succeeded') {
        const out = pj.output;
        const isImage = (u: unknown): string | null => {
          if (typeof u !== 'string') return null;
          try {
            const url = new URL(u);
            const p = url.pathname.toLowerCase();
            if (/(\.png|\.jpg|\.jpeg|\.webp|\.gif)$/.test(p)) return u;
            return null;
          } catch {
            return /^data:image\//i.test(u) ? u : null;
          }
        };
        if (Array.isArray(out) && out.length > 0) {
          const firstImg = out.map(isImage).find(Boolean);
          if (firstImg) outputUrl = firstImg;
        } else if (typeof out === 'string') {
          const maybe = isImage(out);
          if (maybe) outputUrl = maybe;
        }
        break;
      } else if (status === 'failed') {
        const err = pj?.error || pj?.detail || pj?.message || 'AI generation failed';
        const logs = pj?.logs;
        return NextResponse.json({ error: err, logs }, { status: 500 });
      }
      attempts++;
    }

    if (!outputUrl) {
      return NextResponse.json({ error: 'No output from AI' }, { status: 500 });
    }

    return NextResponse.json({ imageUrl: outputUrl });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


