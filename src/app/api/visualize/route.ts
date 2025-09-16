import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, stylePrompt } = await request.json();
    if (!stylePrompt && !imageBase64) {
      return NextResponse.json({ error: 'Missing input' }, { status: 400 });
    }

    // Use Replicate image-to-image as a simple, elegant backend
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      return NextResponse.json({ error: 'Missing REPLICATE_API_TOKEN' }, { status: 500 });
    }

    const body: { input: { prompt: string; strength: number; image?: string } } = {
      input: {
        prompt: stylePrompt || 'high-end bathroom renovation, professional interior render',
        // Guidance to preserve layout
        strength: 0.6,
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
        if (Array.isArray(out) && out.length > 0) outputUrl = out[0];
        else if (typeof out === 'string') outputUrl = out;
        break;
      }
      attempts++;
    }

    if (!outputUrl) {
      return NextResponse.json({ error: 'No output from AI' }, { status: 500 });
    }

    return NextResponse.json({ imageUrl: outputUrl });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}


