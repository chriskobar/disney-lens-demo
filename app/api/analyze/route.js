import { CHARACTERS, buildVisionPrompt, buildUnifiedPrompt } from '@/lib/characters';

export async function POST(request) {
  try {
    const { imageBase64, sessionHistory, userMessage, forceCharacter } = await request.json();

    if (!imageBase64) {
      return Response.json({ error: 'No image provided' }, { status: 400 });
    }

    // Strip data URL prefix if present
    let base64Data = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

    // Clean any whitespace/newlines that might have crept in
    base64Data = base64Data.replace(/\s/g, '');

    // Validate base64 format
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data)) {
      console.error('Invalid base64 data. Length:', base64Data.length, 'First 50 chars:', base64Data.substring(0, 50));
      return Response.json({
        error: 'Invalid image data',
        details: 'Image capture produced invalid base64 data'
      }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return Response.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });
    }

    // Detect media type from original data URL
    const mediaTypeMatch = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
    const mediaType = mediaTypeMatch ? mediaTypeMatch[1] : 'image/jpeg';

    // Helper: call Claude API directly via fetch
    async function callClaude(prompt, maxTokens = 300) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: maxTokens,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mediaType,
                    data: base64Data,
                  },
                },
                { type: 'text', text: prompt },
              ],
            },
          ],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error(`Claude API error ${res.status}:`, errText);
        // Try to extract a readable message from the API error
        try {
          const errJson = JSON.parse(errText);
          const msg = errJson?.error?.message || errText;
          throw new Error(`API error (${res.status}): ${msg}`);
        } catch (parseErr) {
          if (parseErr.message.startsWith('API error')) throw parseErr;
          throw new Error(`API error (${res.status}): ${errText}`);
        }
      }

      const data = await res.json();
      return data.content[0].text;
    }

    let character, narration;

    if (forceCharacter) {
      // User manually selected a character — use the focused prompt
      character = CHARACTERS[forceCharacter];
      const visionPrompt = buildVisionPrompt(character, sessionHistory, userMessage);
      narration = await callClaude(visionPrompt, 200);
    } else {
      // Single unified call: AI picks the character AND generates narration
      const unifiedPrompt = buildUnifiedPrompt(sessionHistory, userMessage);
      const rawResponse = await callClaude(unifiedPrompt, 300);

      // Parse the JSON response
      try {
        // Try to extract JSON from the response (handle markdown code blocks too)
        let jsonStr = rawResponse.trim();
        // Strip markdown code fences if present
        if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
        }
        const parsed = JSON.parse(jsonStr);
        const selectedId = parsed.character;
        character = CHARACTERS[selectedId] || CHARACTERS.narrator;
        narration = parsed.narration || '';
      } catch (parseErr) {
        // If JSON parsing fails, fall back to narrator with the raw text as narration
        console.warn('Failed to parse unified response as JSON, using raw text:', parseErr.message);
        character = CHARACTERS.narrator;
        // Clean up any JSON artifacts from the response
        narration = rawResponse.replace(/^\s*\{.*?"narration"\s*:\s*"/, '').replace(/"\s*\}\s*$/, '') || rawResponse;
      }
    }

    return Response.json({
      narration,
      character: character.id,
      characterName: character.name,
      characterEmoji: character.emoji,
      characterColor: character.color,
      browserVoice: character.browserVoice || { rate: 1.0, pitch: 1.0 },
      sprite: character.sprite || { scale: 1.5, position: { x: 0.5, y: 0.4 }, bobSpeed: 0.03, bobAmount: 8 },
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return Response.json(
      { error: 'Failed to analyze scene', details: error.message },
      { status: 500 }
    );
  }
}
