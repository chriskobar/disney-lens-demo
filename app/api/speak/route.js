import { CHARACTERS } from '@/lib/characters';

export async function POST(request) {
  try {
    const { text, characterId } = await request.json();

    if (!text) {
      return Response.json({ error: 'No text provided' }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'ElevenLabs API key not configured' }, { status: 500 });
    }

    const character = CHARACTERS[characterId] || CHARACTERS.narrator;

    // Voice ID: env override → character config → fallback
    const voiceId = process.env.ELEVENLABS_VOICE_ID
      || character.elevenLabsVoiceId
      || 'pNInz6obpgDQGcFmaJgB';

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: character.voiceSettings?.stability ?? 0.7,
            similarity_boost: character.voiceSettings?.similarity_boost ?? 0.8,
            style: character.voiceSettings?.style ?? 0.4,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs error:', errorText);
      return Response.json(
        { error: 'TTS failed', details: errorText },
        { status: response.status }
      );
    }

    // Stream the audio back
    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('TTS error:', error);
    return Response.json(
      { error: 'TTS failed', details: error.message },
      { status: 500 }
    );
  }
}
