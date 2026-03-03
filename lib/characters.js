// Character system — reads personality from character-config.json
// and narrative context from story-config.json.

import { readFileSync } from 'fs';
import { join } from 'path';

// ─── Load configs at module init (server-side only) ───
function loadJSON(filename) {
  try {
    const raw = readFileSync(join(process.cwd(), filename), 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Could not load ${filename}:`, err.message);
    return null;
  }
}

const config = loadJSON('character-config.json');
const storyConfig = loadJSON('story-config.json');

// Build the CHARACTERS object from config
// Each entry gets: id, name, emoji, description, color, systemPrompt,
// customInstructions, triggers, voiceSettings, elevenLabsVoiceId, browserVoice, sprite
export const CHARACTERS = {};
for (const [id, entry] of Object.entries(config.characters)) {
  CHARACTERS[id] = {
    id,
    name: entry.name,
    emoji: entry.emoji,
    description: entry.description,
    color: entry.color,
    systemPrompt: entry.systemPrompt,
    customInstructions: entry.customInstructions || '',
    triggers: entry.triggers || [],
    voiceSettings: entry.voiceSettings || {},
    elevenLabsVoiceId: entry.elevenLabsVoiceId || '',
    browserVoice: entry.browserVoice || { rate: 1.0, pitch: 1.0 },
    sprite: entry.sprite || { scale: 1.5, position: { x: 0.5, y: 0.4 }, bobSpeed: 0.03, bobAmount: 8 },
  };
}

// ─── Story context builder ───
function getStoryContext(characterId = null) {
  if (!storyConfig || !storyConfig.enabled) return '';

  const parts = [];
  parts.push(`STORY CONTEXT:\n${storyConfig.premise}`);
  parts.push(`Tone: ${storyConfig.tone}`);

  if (storyConfig.beats && storyConfig.beats.length > 0) {
    parts.push(`Narrative threads to weave in subtly:\n${storyConfig.beats.map(b => `- ${b}`).join('\n')}`);
  }

  if (characterId && storyConfig.characterGuidance?.[characterId]) {
    parts.push(`Your role in this story: ${storyConfig.characterGuidance[characterId]}`);
  }

  return '\n\n' + parts.join('\n') + '\n\nIMPORTANT: Let the story context gently color your response — do NOT recite the premise or beats directly. The viewer should feel the narrative, not hear it explained.';
}

// ─── Effective prompt: base personality + custom instructions ───
function getEffectivePrompt(character) {
  if (character.customInstructions && character.customInstructions.trim()) {
    return `${character.systemPrompt}\n\nADDITIONAL INSTRUCTIONS:\n${character.customInstructions}`;
  }
  return character.systemPrompt;
}

// ─── Build prompt for forced-character mode ───
export function buildVisionPrompt(character, sessionHistory = [], userMessage = null) {
  const historyContext = sessionHistory.length > 0
    ? `\n\nPrevious observations in this session:\n${sessionHistory.slice(-5).map(h => `- ${h}`).join('\n')}`
    : '';

  const userContext = userMessage
    ? `\n\nThe viewer just said: "${userMessage}". Respond to what they said while staying in character and referencing what you see.`
    : '';

  const story = getStoryContext(character.id);

  return `${getEffectivePrompt(character)}${story}

IMPORTANT RULES:
- You are analyzing a real camera frame from the viewer's phone
- Describe what you ACTUALLY see — be specific about real details
- Stay in character at all times
- Keep your response to 1-3 short sentences (this will be spoken aloud)
- If you notice something new or different from before, call attention to it
- Reference time of day, lighting, mood when relevant
- NEVER mention that you're an AI or looking at a camera frame
- Speak as if you're RIGHT THERE with the person${historyContext}${userContext}

Now, look at this scene and respond in character:`;
}

// ─── Unified prompt: selects character AND generates narration ───
export function buildUnifiedPrompt(sessionHistory = [], userMessage = null) {
  const historyContext = sessionHistory.length > 0
    ? `\n\nPrevious observations in this session:\n${sessionHistory.slice(-5).map(h => `- ${h}`).join('\n')}`
    : '';

  const userContext = userMessage
    ? `\n\nThe viewer just said: "${userMessage}". Respond to what they said while staying in character and referencing what you see.`
    : '';

  const characterDescriptions = Object.values(CHARACTERS).map(c =>
    `- **${c.id}** ("${c.name}"): ${c.description}. Triggers: ${c.triggers.join(', ')}`
  ).join('\n');

  const story = getStoryContext();

  return `You are part of "Disney Lens," an AI-powered immersive experience. You will analyze a camera frame from the viewer's phone and respond as one of four Disney-inspired characters.${story}

AVAILABLE CHARACTERS:
${characterDescriptions}

CHARACTER PERSONALITIES:
${Object.values(CHARACTERS).map(c => {
  const guidance = storyConfig?.enabled && storyConfig?.characterGuidance?.[c.id]
    ? `\n[Story role: ${storyConfig.characterGuidance[c.id]}]`
    : '';
  return `[${c.id}]: ${getEffectivePrompt(c)}${guidance}`;
}).join('\n\n')}

YOUR TASK:
1. Look at the scene carefully — notice the setting, objects, lighting, mood, colors, spatial arrangement.
2. Choose the BEST character for this scene based on what you see. Match the environment to the character whose triggers and personality fit best. Default to "narrator" if no strong match.
3. Respond IN CHARACTER with 1-3 short sentences (this will be spoken aloud).

IMPORTANT RULES:
- Describe what you ACTUALLY see — be specific about real details
- Stay fully in character
- Keep your response to 1-3 short sentences for pacing
- If you notice something new or different from before, call attention to it
- Reference time of day, lighting, mood when relevant
- NEVER mention that you're an AI or looking at a camera frame
- Speak as if you're RIGHT THERE with the person
- Let the story context gently color your words — do NOT recite it directly${historyContext}${userContext}

RESPONSE FORMAT — you MUST respond with EXACTLY this JSON format and nothing else:
{"character": "<character_id>", "narration": "<your in-character response>"}

Where character_id is one of: ${Object.keys(CHARACTERS).join(', ')}

Now, look at this scene, choose your character, and respond:`;
}
