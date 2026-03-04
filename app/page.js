'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Character data (client-side mirror) ───
const CHARACTERS = {
  narrator: { id: 'narrator', name: 'The Storyteller', emoji: '📖', color: '#C9A96E' },
  cricket:  { id: 'cricket',  name: 'The Conscience',  emoji: '🦗', color: '#4ECDC4' },
  godmother:{ id: 'godmother', name: 'The Fairy Godmother', emoji: '✨', color: '#9B59B6' },
  explorer: { id: 'explorer', name: 'The Wayfinder',  emoji: '🧭', color: '#E67E22' },
};

// ─── Helper drawing functions (used by sprites) ───
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

// ─── Character Sprite (inlined to avoid import issues) ───
class CharacterSprite {
  constructor(canvas, characterId, spriteConfig = null) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.characterId = characterId;
    const cfg = spriteConfig || { scale: 1.5, position: { x: 0.5, y: 0.4 }, bobSpeed: 0.03, bobAmount: 8 };
    this.x = canvas.width * (cfg.position?.x || 0.5);
    this.y = canvas.height * (cfg.position?.y || 0.4);
    this.targetX = this.x;
    this.targetY = this.y;
    this.scale = cfg.scale || 1.5;
    this.opacity = 0;
    this.phase = 0;
    this.speaking = false;
    this.visible = false;
    this.bobSpeed = cfg.bobSpeed || 0.03;
    this.bobAmount = cfg.bobAmount || 8;
    this.glowPulse = 0;
    this.entryProgress = 0;
    this.particles = [];
    this.spriteConfig = cfg;
  }

  show() {
    this.visible = true;
    this.entryProgress = 0;
    this.opacity = 0.1;
    const pos = this.spriteConfig?.position || { x: 0.5, y: 0.4 };
    this.targetX = pos.x * this.canvas.width;
    this.targetY = pos.y * this.canvas.height;
    this.x = this.targetX;
    this.y = this.targetY + 50;
    console.log(`[Sprite] Showing ${this.characterId} at (${this.targetX}, ${this.targetY}), scale: ${this.scale}, canvas: ${this.canvas.width}x${this.canvas.height}`);
  }

  hide() { this.visible = false; }
  setSpeaking(s) { this.speaking = s; }

  update() {
    if (!this.visible) {
      this.opacity = Math.max(0, this.opacity - 0.03);
      return;
    }
    this.phase += this.bobSpeed;
    this.glowPulse += 0.04;
    if (this.entryProgress < 1) {
      this.entryProgress = Math.min(1, this.entryProgress + 0.02);
    }
    this.opacity = Math.min(1, this.opacity + 0.02);
    this.x += (this.targetX - this.x) * 0.05;
    this.y += (this.targetY - this.y) * 0.05;
    if (Math.random() < 0.15 && this.opacity > 0.2) this.spawnParticle();
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx; p.y += p.vy; p.life -= p.decay;
      p.opacity = p.life * 0.6;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  spawnParticle() {
    const colors = { narrator: '#FFD700', cricket: '#4ECDC4', godmother: '#DDA0DD', explorer: '#00CED1' };
    this.particles.push({
      x: this.x + (Math.random() - 0.5) * 50,
      y: this.y + (Math.random() - 0.5) * 50,
      vx: (Math.random() - 0.5) * 0.8, vy: -0.3 - Math.random() * 0.8,
      size: 1.5 + Math.random() * 2.5, color: colors[this.characterId] || '#FFD700',
      life: 1.0, decay: 0.01 + Math.random() * 0.02, opacity: 0.6,
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

    switch (this.characterId) {
      case 'narrator': this.drawNarrator(ctx, drawX, drawY, scale); break;
      case 'cricket': this.drawCricket(ctx, drawX, drawY, scale); break;
      case 'godmother': this.drawGodmother(ctx, drawX, drawY, scale); break;
      case 'explorer': this.drawExplorer(ctx, drawX, drawY, scale); break;
    }

    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.opacity) * this.opacity;
      ctx.shadowColor = p.color; ctx.shadowBlur = 6;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color; ctx.fill();
    }
    ctx.restore();
  }

  drawNarrator(ctx, x, y, scale) {
    const s = scale;
    const glowSize = 45 * s + Math.sin(this.glowPulse) * 5;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
    gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
    gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath(); ctx.arc(x, y, glowSize, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8B4513'; ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 15;
    roundRect(ctx, x - 20 * s, y - 14 * s, 40 * s, 28 * s, 3 * s); ctx.fill();
    ctx.fillStyle = '#FFF8DC'; ctx.shadowBlur = 0;
    roundRect(ctx, x - 17 * s, y - 11 * s, 34 * s, 22 * s, 2 * s); ctx.fill();
    ctx.strokeStyle = '#8B4513'; ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.moveTo(x, y - 14 * s); ctx.lineTo(x, y + 14 * s); ctx.stroke();
    ctx.strokeStyle = 'rgba(139, 69, 19, 0.4)'; ctx.lineWidth = 1.5 * s;
    for (let i = 0; i < 3; i++) {
      const lineY = y - 5 * s + i * 6 * s;
      const wiggle = this.speaking ? Math.sin(this.phase * 3 + i) * 2 : 0;
      ctx.beginPath(); ctx.moveTo(x - 14 * s + wiggle, lineY); ctx.lineTo(x - 4 * s + wiggle, lineY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 4 * s - wiggle, lineY); ctx.lineTo(x + 14 * s - wiggle, lineY); ctx.stroke();
    }
    const starPhase = this.phase * 2;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + starPhase;
      const dist = 30 * s + Math.sin(this.glowPulse + i) * 5;
      drawStar(ctx, x + Math.cos(angle) * dist, y + Math.sin(angle) * dist,
        (2 + Math.sin(this.glowPulse * 2 + i) * 1.5) * s, '#FFD700');
    }
  }

  drawCricket(ctx, x, y, scale) {
    const s = scale;
    const legPhase = Math.sin(this.phase * 2);
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 35 * s);
    gradient.addColorStop(0, 'rgba(78, 205, 196, 0.2)');
    gradient.addColorStop(1, 'rgba(78, 205, 196, 0)');
    ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(x, y, 35 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2ECC71'; ctx.shadowColor = '#4ECDC4'; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.ellipse(x, y, 10 * s, 14 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#27AE60'; ctx.beginPath(); ctx.arc(x, y - 18 * s, 9 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1a2e';
    roundRect(ctx, x - 10 * s, y - 32 * s, 20 * s, 12 * s, 2 * s); ctx.fill();
    roundRect(ctx, x - 13 * s, y - 21 * s, 26 * s, 4 * s, 1 * s); ctx.fill();
    ctx.fillStyle = 'white'; ctx.beginPath();
    ctx.arc(x - 4 * s, y - 19 * s, 3 * s, 0, Math.PI * 2);
    ctx.arc(x + 4 * s, y - 19 * s, 3 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1a2e'; ctx.beginPath();
    ctx.arc(x - 3.5 * s, y - 19 * s, 1.5 * s, 0, Math.PI * 2);
    ctx.arc(x + 4.5 * s, y - 19 * s, 1.5 * s, 0, Math.PI * 2); ctx.fill();
    const smileWidth = this.speaking ? 6 : 4;
    ctx.strokeStyle = '#1a1a2e'; ctx.lineWidth = 1.5 * s;
    ctx.beginPath(); ctx.arc(x, y - 14 * s, smileWidth * s, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
    ctx.strokeStyle = '#2ECC71'; ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.moveTo(x - 6 * s, y + 10 * s); ctx.lineTo(x - 12 * s, y + 22 * s + legPhase * 3);
    ctx.lineTo(x - 8 * s, y + 28 * s + legPhase * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 6 * s, y + 10 * s); ctx.lineTo(x + 12 * s, y + 22 * s - legPhase * 3);
    ctx.lineTo(x + 8 * s, y + 28 * s - legPhase * 2); ctx.stroke();
    ctx.strokeStyle = '#E74C3C'; ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.moveTo(x + 14 * s, y - 10 * s); ctx.lineTo(x + 14 * s, y + 15 * s); ctx.stroke();
    ctx.fillStyle = '#E74C3C'; ctx.beginPath(); ctx.arc(x + 14 * s, y - 12 * s, 10 * s, Math.PI, 0); ctx.fill();
  }

  drawGodmother(ctx, x, y, scale) {
    const s = scale;
    const wandPhase = Math.sin(this.phase * 1.5);
    const auraSize = 55 * s + Math.sin(this.glowPulse) * 8;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, auraSize);
    gradient.addColorStop(0, 'rgba(155, 89, 182, 0.25)');
    gradient.addColorStop(0.5, 'rgba(221, 160, 221, 0.1)');
    gradient.addColorStop(1, 'rgba(155, 89, 182, 0)');
    ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(x, y, auraSize, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9B59B6'; ctx.shadowColor = '#DDA0DD'; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.moveTo(x, y - 8 * s); ctx.lineTo(x - 22 * s, y + 28 * s);
    ctx.lineTo(x + 22 * s, y + 28 * s); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)'; ctx.lineWidth = 1.5 * s;
    ctx.beginPath(); ctx.moveTo(x - 14 * s, y + 14 * s);
    ctx.quadraticCurveTo(x, y + 10 * s, x + 14 * s, y + 14 * s); ctx.stroke();
    ctx.fillStyle = '#FFDAB9'; ctx.beginPath(); ctx.arc(x, y - 14 * s, 9 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#C0C0C0'; ctx.beginPath(); ctx.arc(x, y - 24 * s, 7 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6C3483'; ctx.beginPath();
    ctx.arc(x - 3.5 * s, y - 15 * s, 2 * s, 0, Math.PI * 2);
    ctx.arc(x + 3.5 * s, y - 15 * s, 2 * s, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#C0392B'; ctx.lineWidth = 1.5 * s;
    ctx.beginPath(); ctx.arc(x, y - 10 * s, 4 * s, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
    if (this.speaking) {
      ctx.fillStyle = '#C0392B'; ctx.beginPath();
      ctx.ellipse(x, y - 8 * s, 3 * s, 3 * s, 0, 0, Math.PI * 2); ctx.fill();
    }
    const wandAngle = -0.3 + wandPhase * 0.15;
    const wandX = x + 24 * s, wandY = y - 5 * s;
    const wandTipX = wandX + Math.cos(wandAngle) * 22 * s;
    const wandTipY = wandY + Math.sin(wandAngle) * -22 * s;
    ctx.strokeStyle = '#DAA520'; ctx.lineWidth = 2.5 * s;
    ctx.beginPath(); ctx.moveTo(wandX, wandY); ctx.lineTo(wandTipX, wandTipY); ctx.stroke();
    drawStar(ctx, wandTipX, wandTipY, (4 + Math.sin(this.glowPulse * 3) * 2) * s, '#FFD700');
    if (this.speaking || Math.sin(this.phase) > 0.5) {
      for (let i = 0; i < 3; i++) {
        const t = (this.phase * 2 + i * 2) % (Math.PI * 2);
        ctx.globalAlpha = (0.8 - i * 0.2) * this.opacity;
        drawStar(ctx, wandTipX + Math.cos(t) * (8 + i * 5) * s,
          wandTipY + Math.sin(t) * (8 + i * 5) * s, (1.5 - i * 0.3) * s, '#FFF8DC');
      }
      ctx.globalAlpha = this.opacity;
    }
  }

  drawExplorer(ctx, x, y, scale) {
    const s = scale;
    const compassSpin = this.phase * 0.5;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 45 * s);
    gradient.addColorStop(0, 'rgba(0, 206, 209, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 206, 209, 0)');
    ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(x, y, 45 * s, 0, Math.PI * 2); ctx.fill();
    ctx.shadowColor = '#E67E22'; ctx.shadowBlur = 10;
    ctx.strokeStyle = '#DAA520'; ctx.lineWidth = 2.5 * s;
    ctx.beginPath(); ctx.arc(x, y, 20 * s, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(10, 10, 30, 0.7)'; ctx.beginPath(); ctx.arc(x, y, 19 * s, 0, Math.PI * 2); ctx.fill();
    const directions = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
    const pointColors = ['#E74C3C', '#DAA520', '#ECF0F1', '#DAA520'];
    directions.forEach((angle, i) => {
      const a = angle + compassSpin;
      ctx.fillStyle = pointColors[i]; ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * 16 * s, y + Math.sin(a) * 16 * s);
      ctx.lineTo(x + Math.cos(a + 0.3) * 6 * s, y + Math.sin(a + 0.3) * 6 * s);
      ctx.lineTo(x + Math.cos(a - 0.3) * 6 * s, y + Math.sin(a - 0.3) * 6 * s);
      ctx.closePath(); ctx.fill();
    });
    ctx.fillStyle = '#00CED1'; ctx.beginPath(); ctx.arc(x, y, 3 * s, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#DAA520'; ctx.font = `bold ${8 * s}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ['N', 'E', 'S', 'W'].forEach((label, i) => {
      const a = directions[i] + compassSpin;
      ctx.fillText(label, x + Math.cos(a) * 26 * s, y + Math.sin(a) * 26 * s);
    });
    if (this.speaking) {
      const pulseSize = 22 * s + Math.sin(this.phase * 3) * 4 * s;
      ctx.strokeStyle = 'rgba(0, 206, 209, 0.4)'; ctx.lineWidth = 1.5 * s;
      ctx.beginPath(); ctx.arc(x, y, pulseSize, 0, Math.PI * 2); ctx.stroke();
    }
  }
}

// ─── Particle Effects Engine ───
class ParticleEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.running = false;
    this.characterId = 'narrator';
    this.sprite = null;
    this.resize();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    if (this.sprite && this.sprite.visible) {
      this.sprite.show();
    }
  }

  setCharacter(id, spriteConfig = null) {
    this.characterId = id;
    this.sprite = new CharacterSprite(this.canvas, id, spriteConfig);
    this.sprite.show();
    console.log(`[Engine] Character set to ${id}, sprite created, scale: ${this.sprite.scale}`);
  }

  setSpeaking(speaking) {
    if (this.sprite) this.sprite.setSpeaking(speaking);
  }

  getConfig() {
    const configs = {
      narrator: { colors: ['#FFD700', '#FFF8DC', '#FFFACD'], count: 20, sizeRange: [2, 5], behavior: 'firefly' },
      cricket: { colors: ['#87CEEB', '#B0E0E6', '#ADD8E6'], count: 10, sizeRange: [5, 12], behavior: 'bubble' },
      godmother: { colors: ['#FFD700', '#FFF8DC', '#DDA0DD', '#FFFFFF'], count: 35, sizeRange: [2, 5], behavior: 'sparkle' },
      explorer: { colors: ['#00CED1', '#20B2AA', '#48D1CC'], count: 18, sizeRange: [2, 5], behavior: 'directional' },
    };
    return configs[this.characterId] || configs.narrator;
  }

  spawnParticle() {
    const config = this.getConfig();
    const w = this.canvas.width, h = this.canvas.height;
    return {
      x: Math.random() * w,
      y: config.behavior === 'sparkle' ? h + 10 : Math.random() * h,
      size: config.sizeRange[0] + Math.random() * (config.sizeRange[1] - config.sizeRange[0]),
      color: config.colors[Math.floor(Math.random() * config.colors.length)],
      opacity: 0.2 + Math.random() * 0.6,
      vx: (Math.random() - 0.5) * 0.8,
      vy: config.behavior === 'sparkle' ? -(0.4 + Math.random() * 1.0)
         : config.behavior === 'bubble' ? -(0.1 + Math.random() * 0.4)
         : config.behavior === 'directional' ? (0.3 + Math.random() * 0.8)
         : (Math.random() - 0.5) * 0.4,
      life: 1.0, decay: 0.002 + Math.random() * 0.005,
      phase: Math.random() * Math.PI * 2, pulseSpeed: 0.02 + Math.random() * 0.03,
      behavior: config.behavior,
    };
  }

  update() {
    const config = this.getConfig();
    while (this.particles.length < config.count) this.particles.push(this.spawnParticle());
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.phase += p.pulseSpeed; p.life -= p.decay;
      if (p.behavior === 'firefly') {
        p.x += p.vx + Math.sin(p.phase) * 0.5; p.y += p.vy + Math.cos(p.phase * 0.7) * 0.3;
        p.opacity = (0.3 + Math.sin(p.phase) * 0.4) * p.life;
      } else if (p.behavior === 'sparkle') {
        p.x += p.vx + Math.sin(p.phase) * 0.3; p.y += p.vy;
        p.opacity = p.life * (0.5 + Math.sin(p.phase * 2) * 0.3);
      } else if (p.behavior === 'bubble') {
        p.x += Math.sin(p.phase) * 0.3; p.y += p.vy; p.size += 0.01; p.opacity = p.life * 0.4;
      } else if (p.behavior === 'directional') {
        p.x += p.vx; p.y += Math.sin(p.phase) * 0.4; p.opacity = p.life * 0.7;
      }
      if (p.life <= 0 || p.x < -20 || p.x > this.canvas.width + 20 || p.y < -20 || p.y > this.canvas.height + 20) {
        this.particles.splice(i, 1);
      }
    }
    if (this.sprite) this.sprite.update();
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const p of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.opacity);
      if (p.behavior === 'bubble') {
        this.ctx.beginPath(); this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.strokeStyle = p.color; this.ctx.lineWidth = 1; this.ctx.stroke();
        this.ctx.beginPath(); this.ctx.arc(p.x - p.size * 0.3, p.y - p.size * 0.3, p.size * 0.2, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255,255,255,0.4)'; this.ctx.fill();
      } else {
        this.ctx.shadowColor = p.color; this.ctx.shadowBlur = p.size * 3;
        this.ctx.beginPath(); this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color; this.ctx.fill();
      }
      this.ctx.restore();
    }
    if (this.sprite) this.sprite.draw();
  }

  loop = () => {
    if (!this.running) return;
    this.update(); this.draw();
    requestAnimationFrame(this.loop);
  };

  start() { this.running = true; this.loop(); }
  stop() { this.running = false; this.particles = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); }
}

// ─── SVG Icons for controls ───
const IconTranscript = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const IconVolume = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

const IconMic = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const IconEye = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconRefresh = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
    <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
  </svg>
);

const IconX = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ─── Main App ───
export default function DisneyLens() {
  const [started, setStarted] = useState(false);
  const [narration, setNarration] = useState('');
  const [character, setCharacter] = useState(CHARACTERS.narrator);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoScan, setAutoScan] = useState(false);
  const [forceCharacter, setForceCharacter] = useState(null);
  const [toast, setToast] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [showTranscript, setShowTranscript] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const captureCanvasRef = useRef(null);
  const engineRef = useRef(null);
  const autoScanRef = useRef(null);
  const audioRef = useRef(null);
  const recognitionRef = useRef(null);
  const abortRef = useRef(null);

  // ─── Interrupt: stop all audio and cancel pending work ───
  const stopAllAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.cancel();
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsSpeaking(false);
    if (engineRef.current) engineRef.current.setSpeaking(false);
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
    } catch (err) {
      console.error('Camera error:', err);
      showToast('Camera access needed — check permissions');
    }
  }, [showToast]);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return null;
    canvas.width = 640;
    canvas.height = Math.round(640 * (video.videoHeight / video.videoWidth));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.7);
  }, []);

  // Reliable browser TTS fallback for iOS Safari
  const browserSpeak = useCallback((text, voiceTuning) => {
    return new Promise((resolve) => {
      speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const tuning = voiceTuning || { rate: 1.0, pitch: 1.0 };
      utterance.rate = tuning.rate;
      utterance.pitch = tuning.pitch;
      utterance.volume = 1.0;
      const voices = speechSynthesis.getVoices();
      const preferred = voices.find(v => v.name.includes('Samantha'))
        || voices.find(v => v.lang.startsWith('en') && v.localService)
        || voices.find(v => v.lang.startsWith('en'));
      if (preferred) utterance.voice = preferred;
      utterance.onend = () => resolve('ended');
      utterance.onerror = (e) => { console.warn('Browser TTS error:', e); resolve('error'); };
      const safetyTimeout = setTimeout(() => resolve('timeout'), Math.max(8000, text.length * 80));
      const resolveOnce = (val) => { clearTimeout(safetyTimeout); resolve(val); };
      utterance.onend = () => resolveOnce('ended');
      utterance.onerror = () => resolveOnce('error');
      speechSynthesis.speak(utterance);
    });
  }, []);

  const speakNarration = useCallback(async (text, characterId, signal, browserVoice) => {
    try {
      setIsSpeaking(true);
      if (engineRef.current) engineRef.current.setSpeaking(true);
      if (signal?.aborted) return;

      let usedElevenLabs = false;

      try {
        const response = await fetch('/api/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, characterId }),
          signal,
        });
        if (signal?.aborted) return;
        if (response.ok) {
          const audioBlob = await response.blob();
          if (audioBlob.size > 1000) {
            const audioUrl = URL.createObjectURL(audioBlob);
            if (audioRef.current && !signal?.aborted) {
              audioRef.current.src = audioUrl;
              await new Promise((resolve, reject) => {
                audioRef.current.onended = () => { URL.revokeObjectURL(audioUrl); resolve(); };
                audioRef.current.onerror = (e) => { URL.revokeObjectURL(audioUrl); reject(e); };
                audioRef.current.play().catch(reject);
              });
              usedElevenLabs = true;
            } else {
              URL.revokeObjectURL(audioUrl);
            }
          }
        }
      } catch (elevenLabsErr) {
        if (elevenLabsErr.name === 'AbortError') return;
        console.warn('ElevenLabs failed, falling back to browser voice:', elevenLabsErr.message);
      }

      if (!usedElevenLabs && !signal?.aborted) {
        console.log('Using browser TTS fallback');
        await browserSpeak(text, browserVoice);
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('TTS error:', err);
    } finally {
      setIsSpeaking(false);
      if (engineRef.current) engineRef.current.setSpeaking(false);
    }
  }, [browserSpeak]);

  const analyzeScene = useCallback(async (userMessage = null) => {
    stopAllAudio();
    setIsAnalyzing(true);

    const controller = new AbortController();
    abortRef.current = controller;
    const signal = controller.signal;

    try {
      const imageBase64 = captureFrame();
      if (!imageBase64) { showToast('No camera feed yet'); setIsAnalyzing(false); return; }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, sessionHistory, userMessage, forceCharacter }),
        signal,
      });

      if (signal.aborted) return;
      if (!response.ok) { const err = await response.json(); throw new Error(err.details || 'Analysis failed'); }
      const data = await response.json();
      const newChar = CHARACTERS[data.character] || CHARACTERS.narrator;
      setCharacter(newChar);
      if (engineRef.current) engineRef.current.setCharacter(data.character, data.sprite);
      setNarration(data.narration);
      setSessionHistory(prev => [...prev.slice(-9), data.narration]);

      // Show the user's spoken prompt as toast if it was a voice message
      if (userMessage) {
        showToast(`You said: "${userMessage}"`);
      }

      speakNarration(data.narration, data.character, signal, data.browserVoice);
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Analysis error:', err);
      showToast('Analysis failed — ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [captureFrame, sessionHistory, forceCharacter, showToast, speakNarration, stopAllAudio]);

  const toggleListening = useCallback(() => {
    if (isListening && recognitionRef.current) { recognitionRef.current.stop(); setIsListening(false); return; }
    stopAllAudio();

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { showToast('Speech recognition not supported'); return; }
    const recognition = new SpeechRecognition();
    recognition.continuous = false; recognition.interimResults = false; recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      showToast(`You said: "${transcript}"`);
      analyzeScene(transcript);
    };
    recognitionRef.current = recognition;
    recognition.start();
  }, [isListening, analyzeScene, showToast, stopAllAudio]);

  // ─── Exit to welcome screen ───
  const handleExit = useCallback(() => {
    stopAllAudio();
    if (autoScanRef.current) clearInterval(autoScanRef.current);
    setAutoScan(false);
    if (engineRef.current) { engineRef.current.stop(); engineRef.current = null; }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch(e) {} }
    setIsListening(false);
    setNarration('');
    setCharacter(CHARACTERS.narrator);
    setSessionHistory([]);
    setForceCharacter(null);
    setShowTranscript(false);
    setStarted(false);
  }, [stopAllAudio]);

  // ─── Toggle mute ───
  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(audioRef.current.muted);
      showToast(audioRef.current.muted ? 'Voice muted' : 'Voice unmuted');
    }
  }, [showToast]);

  useEffect(() => {
    if (autoScan && started) {
      autoScanRef.current = setInterval(() => analyzeScene(), 12000);
    }
    return () => { if (autoScanRef.current) clearInterval(autoScanRef.current); };
  }, [autoScan, started, analyzeScene]);

  const handleStart = async () => {
    setStarted(true);
    await startCamera();
    if (canvasRef.current) {
      const engine = new ParticleEngine(canvasRef.current);
      engineRef.current = engine;
      engine.start();
      const handleResize = () => engine.resize();
      window.addEventListener('resize', handleResize);
    }
  };

  const edgeGlowStyle = {
    boxShadow: `inset 0 0 60px 20px ${character.color}33, inset 0 0 120px 40px ${character.color}15`,
  };

  // ─── Welcome screen ───
  if (!started) {
    return (
      <div className="app-container">
        <div className="welcome-overlay">
          <WelcomeParticles />
          <h1>Disney Lens</h1>
          <p className="subtitle">AI Immersive Experience</p>
          <p className="tagline">See your world through the eyes of enchanted characters. Point your camera anywhere — and let the magic begin.</p>
          <button className="start-btn" onClick={handleStart}>Enter the Story</button>
        </div>
      </div>
    );
  }

  // ─── Main experience ───
  return (
    <div className="app-container">
      <div className="camera-layer"><video ref={videoRef} playsInline muted autoPlay /></div>
      <canvas ref={canvasRef} className="effects-layer" />
      <canvas ref={captureCanvasRef} style={{ display: 'none' }} />
      <audio ref={audioRef} />
      <div className="edge-glow" style={edgeGlowStyle} />

      <div className="ui-layer">
        {/* Status indicator — minimal, top-center */}
        {(isAnalyzing || isSpeaking) && (
          <div style={{
            position: 'absolute', top: 48, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(10,10,30,0.6)', backdropFilter: 'blur(8px)',
            borderRadius: 20, padding: '4px 12px',
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: isAnalyzing ? '#FFD700' : character.color,
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
              {isAnalyzing ? 'Analyzing...' : 'Speaking'}
            </span>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Transcript area */}
        {narration && showTranscript && (
          <div className="narration-area">
            <div className="narration-bubble" style={{ borderColor: character.color + '33' }}>
              <p className="narration-text appearing" key={narration}>{narration}</p>
            </div>
          </div>
        )}

        {/* ─── Bottom controls bar ─── */}
        <div style={{ padding: '0 12px 16px', position: 'relative' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '8px 4px',
            background: 'rgba(10,10,30,0.65)',
            backdropFilter: 'blur(12px)',
            borderRadius: 40,
          }}>
            {/* Small button: Transcript */}
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              title="Toggle transcript"
              style={{
                width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: showTranscript ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                color: showTranscript ? '#fff' : 'rgba(255,255,255,0.5)',
                transition: 'all 0.2s ease',
              }}
            >
              <IconTranscript />
            </button>

            {/* Small button: Voice mute */}
            <button
              onClick={toggleMute}
              title="Toggle voice"
              style={{
                width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isMuted ? 'rgba(255,80,80,0.15)' : 'rgba(255,255,255,0.08)',
                color: isMuted ? '#ff5050' : 'rgba(255,255,255,0.5)',
                transition: 'all 0.2s ease',
              }}
            >
              <IconVolume />
            </button>

            {/* Large button: Mic */}
            <button
              onClick={toggleListening}
              title="Speak to the character"
              style={{
                width: 58, height: 58, borderRadius: '50%', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isListening ? 'rgba(255,120,50,0.25)' : 'rgba(255,255,255,0.1)',
                color: isListening ? '#ff6a2f' : '#ff8c42',
                boxShadow: isListening ? '0 0 20px rgba(255,120,50,0.3)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <IconMic />
            </button>

            {/* Large button: Capture/Analyze */}
            <button
              onClick={() => analyzeScene()}
              disabled={isAnalyzing}
              title="Analyze scene"
              style={{
                width: 58, height: 58, borderRadius: '50%', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isAnalyzing ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.1)',
                color: isAnalyzing ? '#FFD700' : '#4ecb71',
                border: isAnalyzing ? '2px solid rgba(255,215,0,0.4)' : '2px solid rgba(78,203,113,0.4)',
                animation: isAnalyzing ? 'pulse 1.5s ease-in-out infinite' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <IconEye />
            </button>

            {/* Small button: Auto-scan */}
            <button
              onClick={() => { setAutoScan(!autoScan); showToast(autoScan ? 'Auto-scan off' : 'Auto-scan on (12s)'); }}
              title="Toggle auto-scan"
              style={{
                width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: autoScan ? 'rgba(78,205,196,0.2)' : 'rgba(255,255,255,0.08)',
                color: autoScan ? '#4ECDC4' : 'rgba(255,255,255,0.5)',
                transition: 'all 0.2s ease',
              }}
            >
              <IconRefresh />
            </button>

            {/* Small button: Exit */}
            <button
              onClick={handleExit}
              title="Exit to welcome"
              style={{
                width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.5)',
                transition: 'all 0.2s ease',
              }}
              onPointerEnter={(e) => { e.currentTarget.style.background = 'rgba(255,60,60,0.2)'; e.currentTarget.style.color = '#ff5050'; }}
              onPointerLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
            >
              <IconX />
            </button>
          </div>
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}

      {/* Pulse animation for analyzing state */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

function WelcomeParticles() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      size: 1 + Math.random() * 2, opacity: Math.random() * 0.5,
      vx: (Math.random() - 0.5) * 0.3, vy: -0.1 - Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
    }));
    let running = true;
    const animate = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.phase += 0.02; p.x += p.vx + Math.sin(p.phase) * 0.2; p.y += p.vy;
        p.opacity = 0.2 + Math.sin(p.phase) * 0.3;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        ctx.save(); ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700'; ctx.fill(); ctx.restore();
      }
      requestAnimationFrame(animate);
    };
    animate();
    return () => { running = false; };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}
