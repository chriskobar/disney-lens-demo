// Visual overlay effects mapped to characters and scene elements
// These drive the Canvas-based particle and animation system

export const EFFECTS = {
  sparkles: {
    id: 'sparkles',
    name: 'Fairy Dust',
    characters: ['godmother'],
    particleCount: 30,
    color: ['#FFD700', '#FFF8DC', '#FFFACD', '#F0E68C'],
    size: { min: 2, max: 6 },
    speed: { min: 0.3, max: 1.2 },
    lifetime: { min: 60, max: 120 },
    behavior: 'float', // float upward with gentle sway
    opacity: { min: 0.4, max: 1.0 },
    glow: true,
  },

  fireflies: {
    id: 'fireflies',
    name: 'Fireflies',
    characters: ['narrator', 'explorer'],
    particleCount: 15,
    color: ['#ADFF2F', '#7FFF00', '#FFFF00', '#FFD700'],
    size: { min: 3, max: 5 },
    speed: { min: 0.2, max: 0.8 },
    lifetime: { min: 90, max: 180 },
    behavior: 'wander', // gentle random movement
    opacity: { min: 0.3, max: 0.9 },
    glow: true,
    pulse: true, // blink on and off
  },

  stardust: {
    id: 'stardust',
    name: 'Stardust Trail',
    characters: ['narrator', 'godmother'],
    particleCount: 40,
    color: ['#E6E6FA', '#DDA0DD', '#DA70D6', '#FFFFFF'],
    size: { min: 1, max: 4 },
    speed: { min: 0.5, max: 2.0 },
    lifetime: { min: 40, max: 80 },
    behavior: 'cascade', // fall gently like snow
    opacity: { min: 0.3, max: 0.8 },
    glow: true,
  },

  compass: {
    id: 'compass',
    name: 'Wayfinding Motes',
    characters: ['explorer'],
    particleCount: 20,
    color: ['#00CED1', '#20B2AA', '#48D1CC', '#40E0D0'],
    size: { min: 2, max: 5 },
    speed: { min: 0.4, max: 1.5 },
    lifetime: { min: 50, max: 100 },
    behavior: 'directional', // flow in one direction like a current
    opacity: { min: 0.4, max: 0.9 },
    glow: true,
  },

  bubbles: {
    id: 'bubbles',
    name: 'Thought Bubbles',
    characters: ['cricket'],
    particleCount: 12,
    color: ['#87CEEB', '#B0E0E6', '#ADD8E6', '#E0FFFF'],
    size: { min: 4, max: 12 },
    speed: { min: 0.2, max: 0.6 },
    lifetime: { min: 80, max: 150 },
    behavior: 'float',
    opacity: { min: 0.2, max: 0.5 },
    glow: false,
    outline: true, // render as circles with outlines
  },

  // Edge glow effect — creates a magical border around the viewport
  edgeGlow: {
    id: 'edgeGlow',
    name: 'Portal Frame',
    characters: ['all'],
    type: 'border', // special non-particle effect
    colors: {
      narrator: ['#C9A96E', '#DAA520'],
      cricket: ['#4ECDC4', '#2ECC71'],
      godmother: ['#9B59B6', '#8E44AD'],
      explorer: ['#E67E22', '#D35400'],
    },
    opacity: 0.4,
    width: 20,
    animate: true,
  },
};

// Select effects based on active character
export function getEffectsForCharacter(characterId) {
  return Object.values(EFFECTS).filter(
    effect => effect.characters?.includes(characterId) || effect.characters?.includes('all')
  );
}

// Scene-specific effect overrides
export function getSceneEffects(sceneKeywords) {
  const extras = [];
  if (sceneKeywords.includes('dark') || sceneKeywords.includes('night') || sceneKeywords.includes('dim')) {
    extras.push('fireflies');
  }
  if (sceneKeywords.includes('nature') || sceneKeywords.includes('garden') || sceneKeywords.includes('trees')) {
    extras.push('fireflies');
  }
  if (sceneKeywords.includes('sky') || sceneKeywords.includes('stars') || sceneKeywords.includes('evening')) {
    extras.push('stardust');
  }
  return extras;
}
