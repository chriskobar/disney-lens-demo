import { CHARACTERS, selectCharacter, buildVisionPrompt, SCENE_CLASSIFIER_PROMPT } from '@/lib/characters';

export async function POST(request) {
  try {
    const { imageBase64, sessionHistory, userMessage, forceCharacter } = await request.json();

    if (!imageBase64) {
      return Response.json({ error: 'No image provided' }, { status: 400 });
    }

    // Strip data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return Response.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 });
    }

    // Helper: call Claude API directly via fetch
    async function callClaude(prompt, maxTokens = 150) {
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
                    media_type: 'image/jpeg',
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
        const err = await res.text();
        throw new Error(`Claude API error ${res.status}: ${err}`);
      }

      const data = await res.json();
      return data.content[0].text;
    }

    // Step 1: Classify the scene
    const sceneAnalysis = await callClaude(SCENE_CLASSIFIER_PROMPT, 150);

    // Step 2: Select character
    const character = forceCharacter
      ? CHARACTERS[forceCharacter]
      : selectCharacter(sceneAnalysis);

    // Step 3: Generate narration
    const visionPrompt = buildVisionPrompt(character, sessionHistory, userMessage);
    const narration = await callClaude(visionPrompt, 200);

    return Response.json({
      narration,
      character: character.id,
      characterName: character.name,
      characterEmoji: character.emoji,
      characterColor: character.color,
      sceneAnalysis,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    return Response.json(
      { error: 'Failed to analyze scene', details: error.message },
      { status: 500 }
    );
  }
}
