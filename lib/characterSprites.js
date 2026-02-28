// Animated character sprites drawn on the canvas overlay
// Each character has a simple but expressive animated form

export class CharacterSprite {
  constructor(canvas, characterId) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.characterId = characterId;
    this.x = canvas.width * 0.5;
    this.y = canvas.height * 0.6;
    this.targetX = this.x;
    this.targetY = this.y;
    this.scale = 1;
    this.opacity = 0;
    this.phase = 0;
    this.speaking = false;
    this.visible = false;
    this.bobSpeed = 0.03;
    this.bobAmount = 8;
    this.glowPulse = 0;
    this.entryProgress = 0;
    this.particles = [];
  }

  show(position = null) {
    this.visible = true;
    this.entryProgress = 0;
    if (position) {
      this.targetX = position.x * this.canvas.width;
      this.targetY = position.y * this.canvas.height;
    } else {
      // Default positions per character
      const positions = {
        narrator: { x: 0.5, y: 0.35 },
        cricket: { x: 0.2, y: 0.7 },
        godmother: { x: 0.65, y: 0.3 },
        explorer: { x: 0.75, y: 0.55 },
      };
      const pos = positions[this.characterId] || positions.narrator;
      this.targetX = pos.x * this.canvas.width;
      this.targetY = pos.y * this.canvas.height;
    }
    this.x = this.targetX;
    this.y = this.targetY + 40; // Start slightly below for float-in
  }

  hide() {
    this.visible = false;
  }

  setSpeaking(speaking) {
    this.speaking = speaking;
  }

  update() {
    if (!this.visible) {
      this.opacity = Math.max(0, this.opacity - 0.03);
      return;
    }

    this.phase += this.bobSpeed;
    this.glowPulse += 0.04;

    // Entry animation
    if (this.entryProgress < 1) {
      this.entryProgress = Math.min(1, this.entryProgress + 0.025);
    }

    // Ease in opacity
    const targetOpacity = this.entryProgress;
    this.opacity += (targetOpacity - this.opacity) * 0.08;

    // Float toward target with easing
    this.x += (this.targetX - this.x) * 0.05;
    this.y += (this.targetY - this.y) * 0.05;

    // Spawn ambient particles
    if (Math.random() < 0.15 && this.opacity > 0.3) {
      this.spawnParticle();
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      p.opacity = p.life * 0.6;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  spawnParticle() {
    const colors = {
      narrator: '#FFD700',
      cricket: '#4ECDC4',
      godmother: '#DDA0DD',
      explorer: '#00CED1',
    };
    this.particles.push({
      x: this.x + (Math.random() - 0.5) * 40,
      y: this.y + (Math.random() - 0.5) * 40,
      vx: (Math.random() - 0.5) * 0.8,
      vy: -0.3 - Math.random() * 0.8,
      size: 1.5 + Math.random() * 2.5,
      color: colors[this.characterId] || '#FFD700',
      life: 1.0,
      decay: 0.01 + Math.random() * 0.02,
      opacity: 0.6,
    });
  }

  draw() {
    if (this.opacity <= 0.01) return;

    const ctx = this.ctx;
    const bob = Math.sin(this.phase) * this.bobAmount;
    const sway = Math.sin(this.phase * 0.7) * 3;
    const drawX = this.x + sway;
    const drawY = this.y + bob;
    const scale = this.scale * (0.9 + this.entryProgress * 0.1);

    ctx.save();
    ctx.globalAlpha = this.opacity;

    // Draw character-specific sprite
    switch (this.characterId) {
      case 'narrator':
        this.drawNarrator(ctx, drawX, drawY, scale);
        break;
      case 'cricket':
        this.drawCricket(ctx, drawX, drawY, scale);
        break;
      case 'godmother':
        this.drawGodmother(ctx, drawX, drawY, scale);
        break;
      case 'explorer':
        this.drawExplorer(ctx, drawX, drawY, scale);
        break;
    }

    // Draw particles
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.opacity) * this.opacity;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }

    ctx.restore();
  }

  // ─── Character Drawings ───

  drawNarrator(ctx, x, y, scale) {
    const s = scale * 0.8;
    const speakPulse = this.speaking ? Math.sin(this.phase * 4) * 2 : 0;

    // Outer glow — magical orb
    const glowSize = 45 * s + Math.sin(this.glowPulse) * 5;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
    gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
    gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, glowSize, 0, Math.PI * 2);
    ctx.fill();

    // Book shape
    ctx.fillStyle = '#8B4513';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 15;
    roundRect(ctx, x - 20 * s, y - 14 * s, 40 * s, 28 * s, 3 * s);
    ctx.fill();

    // Book pages
    ctx.fillStyle = '#FFF8DC';
    ctx.shadowBlur = 0;
    roundRect(ctx, x - 17 * s, y - 11 * s, 34 * s, 22 * s, 2 * s);
    ctx.fill();

    // Book spine
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(x, y - 14 * s);
    ctx.lineTo(x, y + 14 * s);
    ctx.stroke();

    // Magical text lines (wiggle when speaking)
    ctx.strokeStyle = 'rgba(139, 69, 19, 0.4)';
    ctx.lineWidth = 1.5 * s;
    for (let i = 0; i < 3; i++) {
      const lineY = y - 5 * s + i * 6 * s;
      const wiggle = this.speaking ? Math.sin(this.phase * 3 + i) * 2 : 0;
      ctx.beginPath();
      ctx.moveTo(x - 14 * s + wiggle, lineY);
      ctx.lineTo(x - 4 * s + wiggle, lineY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + 4 * s - wiggle, lineY);
      ctx.lineTo(x + 14 * s - wiggle, lineY);
      ctx.stroke();
    }

    // Sparkle stars around the book
    const starPhase = this.phase * 2;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + starPhase;
      const dist = 30 * s + Math.sin(this.glowPulse + i) * 5;
      const sx = x + Math.cos(angle) * dist;
      const sy = y + Math.sin(angle) * dist;
      const starSize = (2 + Math.sin(this.glowPulse * 2 + i) * 1.5) * s;
      drawStar(ctx, sx, sy, starSize, '#FFD700');
    }
  }

  drawCricket(ctx, x, y, scale) {
    const s = scale * 0.8;
    const legPhase = Math.sin(this.phase * 2);

    // Glow
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 35 * s);
    gradient.addColorStop(0, 'rgba(78, 205, 196, 0.2)');
    gradient.addColorStop(1, 'rgba(78, 205, 196, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, 35 * s, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = '#2ECC71';
    ctx.shadowColor = '#4ECDC4';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(x, y, 10 * s, 14 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Head
    ctx.fillStyle = '#27AE60';
    ctx.beginPath();
    ctx.arc(x, y - 18 * s, 9 * s, 0, Math.PI * 2);
    ctx.fill();

    // Top hat
    ctx.fillStyle = '#1a1a2e';
    roundRect(ctx, x - 10 * s, y - 32 * s, 20 * s, 12 * s, 2 * s);
    ctx.fill();
    roundRect(ctx, x - 13 * s, y - 21 * s, 26 * s, 4 * s, 1 * s);
    ctx.fill();

    // Eyes
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(x - 4 * s, y - 19 * s, 3 * s, 0, Math.PI * 2);
    ctx.arc(x + 4 * s, y - 19 * s, 3 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(x - 3.5 * s, y - 19 * s, 1.5 * s, 0, Math.PI * 2);
    ctx.arc(x + 4.5 * s, y - 19 * s, 1.5 * s, 0, Math.PI * 2);
    ctx.fill();

    // Smile (wider when speaking)
    const smileWidth = this.speaking ? 6 : 4;
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    ctx.arc(x, y - 14 * s, smileWidth * s, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();

    // Legs (animated)
    ctx.strokeStyle = '#2ECC71';
    ctx.lineWidth = 2 * s;
    // Left leg
    ctx.beginPath();
    ctx.moveTo(x - 6 * s, y + 10 * s);
    ctx.lineTo(x - 12 * s, y + 22 * s + legPhase * 3);
    ctx.lineTo(x - 8 * s, y + 28 * s + legPhase * 2);
    ctx.stroke();
    // Right leg
    ctx.beginPath();
    ctx.moveTo(x + 6 * s, y + 10 * s);
    ctx.lineTo(x + 12 * s, y + 22 * s - legPhase * 3);
    ctx.lineTo(x + 8 * s, y + 28 * s - legPhase * 2);
    ctx.stroke();

    // Umbrella
    ctx.strokeStyle = '#E74C3C';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(x + 14 * s, y - 10 * s);
    ctx.lineTo(x + 14 * s, y + 15 * s);
    ctx.stroke();
    ctx.fillStyle = '#E74C3C';
    ctx.beginPath();
    ctx.arc(x + 14 * s, y - 12 * s, 10 * s, Math.PI, 0);
    ctx.fill();
  }

  drawGodmother(ctx, x, y, scale) {
    const s = scale * 0.8;
    const wandPhase = Math.sin(this.phase * 1.5);

    // Magical aura
    const auraSize = 55 * s + Math.sin(this.glowPulse) * 8;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, auraSize);
    gradient.addColorStop(0, 'rgba(155, 89, 182, 0.25)');
    gradient.addColorStop(0.5, 'rgba(221, 160, 221, 0.1)');
    gradient.addColorStop(1, 'rgba(155, 89, 182, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, auraSize, 0, Math.PI * 2);
    ctx.fill();

    // Dress (triangular)
    ctx.fillStyle = '#9B59B6';
    ctx.shadowColor = '#DDA0DD';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(x, y - 8 * s);
    ctx.lineTo(x - 22 * s, y + 28 * s);
    ctx.lineTo(x + 22 * s, y + 28 * s);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Dress detail — sparkle band
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    ctx.moveTo(x - 14 * s, y + 14 * s);
    ctx.quadraticCurveTo(x, y + 10 * s, x + 14 * s, y + 14 * s);
    ctx.stroke();

    // Head
    ctx.fillStyle = '#FFDAB9';
    ctx.beginPath();
    ctx.arc(x, y - 14 * s, 9 * s, 0, Math.PI * 2);
    ctx.fill();

    // Hair bun
    ctx.fillStyle = '#C0C0C0';
    ctx.beginPath();
    ctx.arc(x, y - 24 * s, 7 * s, 0, Math.PI * 2);
    ctx.fill();

    // Kind eyes
    ctx.fillStyle = '#6C3483';
    ctx.beginPath();
    ctx.arc(x - 3.5 * s, y - 15 * s, 2 * s, 0, Math.PI * 2);
    ctx.arc(x + 3.5 * s, y - 15 * s, 2 * s, 0, Math.PI * 2);
    ctx.fill();

    // Warm smile
    const smileOpen = this.speaking ? 3 : 0;
    ctx.strokeStyle = '#C0392B';
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    ctx.arc(x, y - 10 * s, 4 * s, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();
    if (this.speaking) {
      ctx.fillStyle = '#C0392B';
      ctx.beginPath();
      ctx.ellipse(x, y - 8 * s, 3 * s, smileOpen * s, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Wand
    const wandAngle = -0.3 + wandPhase * 0.15;
    const wandX = x + 24 * s;
    const wandY = y - 5 * s;
    const wandTipX = wandX + Math.cos(wandAngle) * 22 * s;
    const wandTipY = wandY + Math.sin(wandAngle) * -22 * s;

    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 2.5 * s;
    ctx.beginPath();
    ctx.moveTo(wandX, wandY);
    ctx.lineTo(wandTipX, wandTipY);
    ctx.stroke();

    // Wand star
    const starSize = (4 + Math.sin(this.glowPulse * 3) * 2) * s;
    drawStar(ctx, wandTipX, wandTipY, starSize, '#FFD700');

    // Wand sparkle trail
    if (this.speaking || Math.sin(this.phase) > 0.5) {
      for (let i = 0; i < 3; i++) {
        const t = (this.phase * 2 + i * 2) % (Math.PI * 2);
        const sparkX = wandTipX + Math.cos(t) * (8 + i * 5) * s;
        const sparkY = wandTipY + Math.sin(t) * (8 + i * 5) * s;
        const sparkSize = (1.5 - i * 0.3) * s;
        ctx.globalAlpha = (0.8 - i * 0.2) * this.opacity;
        drawStar(ctx, sparkX, sparkY, sparkSize, '#FFF8DC');
      }
      ctx.globalAlpha = this.opacity;
    }
  }

  drawExplorer(ctx, x, y, scale) {
    const s = scale * 0.8;
    const compassSpin = this.phase * 0.5;

    // Ocean-like glow
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 45 * s);
    gradient.addColorStop(0, 'rgba(0, 206, 209, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 206, 209, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, 45 * s, 0, Math.PI * 2);
    ctx.fill();

    // Compass rose (main element)
    ctx.shadowColor = '#E67E22';
    ctx.shadowBlur = 10;

    // Outer ring
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 2.5 * s;
    ctx.beginPath();
    ctx.arc(x, y, 20 * s, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Inner fill
    ctx.fillStyle = 'rgba(10, 10, 30, 0.7)';
    ctx.beginPath();
    ctx.arc(x, y, 19 * s, 0, Math.PI * 2);
    ctx.fill();

    // Compass points
    const directions = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
    const pointColors = ['#E74C3C', '#DAA520', '#ECF0F1', '#DAA520'];
    directions.forEach((angle, i) => {
      const a = angle + compassSpin;
      ctx.fillStyle = pointColors[i];
      ctx.beginPath();
      ctx.moveTo(
        x + Math.cos(a) * 16 * s,
        y + Math.sin(a) * 16 * s
      );
      ctx.lineTo(
        x + Math.cos(a + 0.3) * 6 * s,
        y + Math.sin(a + 0.3) * 6 * s
      );
      ctx.lineTo(
        x + Math.cos(a - 0.3) * 6 * s,
        y + Math.sin(a - 0.3) * 6 * s
      );
      ctx.closePath();
      ctx.fill();
    });

    // Center jewel
    ctx.fillStyle = '#00CED1';
    ctx.beginPath();
    ctx.arc(x, y, 3 * s, 0, Math.PI * 2);
    ctx.fill();

    // Cardinal letters
    ctx.fillStyle = '#DAA520';
    ctx.font = `bold ${8 * s}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const labels = ['N', 'E', 'S', 'W'];
    directions.forEach((angle, i) => {
      const a = angle + compassSpin;
      const lx = x + Math.cos(a) * 26 * s;
      const ly = y + Math.sin(a) * 26 * s;
      ctx.fillText(labels[i], lx, ly);
    });

    // Animated ring pulse when speaking
    if (this.speaking) {
      const pulseSize = 22 * s + Math.sin(this.phase * 3) * 4 * s;
      ctx.strokeStyle = 'rgba(0, 206, 209, 0.4)';
      ctx.lineWidth = 1.5 * s;
      ctx.beginPath();
      ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

// ─── Helpers ───

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawStar(ctx, x, y, size, color) {
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = size * 2;
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 - Math.PI / 2;
    const outerX = x + Math.cos(angle) * size;
    const outerY = y + Math.sin(angle) * size;
    const innerAngle = angle + Math.PI / 4;
    const innerX = x + Math.cos(innerAngle) * size * 0.3;
    const innerY = y + Math.sin(innerAngle) * size * 0.3;
    if (i === 0) ctx.moveTo(outerX, outerY);
    else ctx.lineTo(outerX, outerY);
    ctx.lineTo(innerX, innerY);
  }
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
}
