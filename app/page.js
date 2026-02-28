'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// ─── Character data (client-side mirror) ───
const CHARACTERS = {
  narrator: { id: 'narrator', name: 'The Storyteller', emoji: '📖', color: '#C9A96E' },
  cricket:  { id: 'cricket',  name: 'The Conscience',  emoji: '🦗', color: '#4ECDC4' },
  godmother:{ id: 'godmother', name: 'The Fairy Godmother', emoji: '✨', color: '#9B59B6' },
  explorer: { id: 'explorer', name: 'The Wayfinder',  emoji: '🧭', color: '#E67E22' },
};

// ─── Particle Effects Engine ───
class ParticleEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.running = false;
    this.characterId = 'narrator';
    this.resize();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  setCharacter(id) {
    this.characterId = id;
    // Transition: fade out old particles gradually
  }

  getConfig() {
    const configs = {
      narrator: {
        colors: ['#FFD700', '#FFF8DC', '#FFFACD'],
        count: 20, sizeRange: [2, 5], behavior: 'firefly',
        glowColor: 'rgba(255, 215, 0, 0.3)',
      },
      cricket: {
        colors: ['#87CEEB', '#B0E0E6', '#ADD8E6'],
        count: 10, sizeRange: [5, 12], behavior: 'bubble',
        glowColor: 'rgba(78, 205, 196, 0.2)',
      },
      godmother: {
        colors: ['#FFD700', '#FFF8DC', '#DDA0DD', '#FFFFFF'],
        count: 35, sizeRange: [2, 5], behavior: 'sparkle',
        glowColor: 'rgba(155, 89, 182, 0.3)',
      },
      explorer: {
        colors: ['#00CED1', '#20B2AA', '#48D1CC'],
        count: 18, sizeRange: [2, 5], behavior: 'directional',
        glowColor: 'rgba(230, 126, 34, 0.3)',
      },
    };
    return configs[this.characterId] || configs.narrator;
  }

  spawnParticle() {
    const config = this.getConfig();
    const w = this.canvas.width;
    const h = this.canvas.height;

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
      life: 1.0,
      decay: 0.002 + Math.random() * 0.005,
      phase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.03,
      behavior: config.behavior,
    };
  }

  update() {
    const config = this.getConfig();

    // Spawn new particles to maintain count
    while (this.particles.length < config.count) {
      this.particles.push(this.spawnParticle());
    }

    // Update existing
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.phase += p.pulseSpeed;
      p.life -= p.decay;

      // Behavior-specific movement
      if (p.behavior === 'firefly') {
        p.x += p.vx + Math.sin(p.phase) * 0.5;
        p.y += p.vy + Math.cos(p.phase * 0.7) * 0.3;
        p.opacity = (0.3 + Math.sin(p.phase) * 0.4) * p.life;
      } else if (p.behavior === 'sparkle') {
        p.x += p.vx + Math.sin(p.phase) * 0.3;
        p.y += p.vy;
        p.opacity = p.life * (0.5 + Math.sin(p.phase * 2) * 0.3);
      } else if (p.behavior === 'bubble') {
        p.x += Math.sin(p.phase) * 0.3;
        p.y += p.vy;
        p.size += 0.01;
        p.opacity = p.life * 0.4;
      } else if (p.behavior === 'directional') {
        p.x += p.vx;
        p.y += Math.sin(p.phase) * 0.4;
        p.opacity = p.life * 0.7;
      }

      // Remove dead particles
      if (p.life <= 0 || p.x < -20 || p.x > this.canvas.width + 20
          || p.y < -20 || p.y > this.canvas.height + 20) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (const p of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.opacity);

      if (p.behavior === 'bubble') {
        // Draw as circle outline
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.strokeStyle = p.color;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        // Inner shine
        this.ctx.beginPath();
        this.ctx.arc(p.x - p.size * 0.3, p.y - p.size * 0.3, p.size * 0.2, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255,255,255,0.4)';
        this.ctx.fill();
      } else {
        // Glow
        this.ctx.shadowColor = p.color;
        this.ctx.shadowBlur = p.size * 3;
        // Dot
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.fill();
      }

      this.ctx.restore();
    }
  }

  loop = () => {
    if (!this.running) return;
    this.update();
    this.draw();
    requestAnimationFrame(this.loop);
  };

  start() {
    this.running = true;
    this.loop();
  }

  stop() {
    this.running = false;
    this.particles = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

// ─── Main App ───
export default function DisneyLens() {
  const [started, setStarted] = useState(false);
  const [narration, setNarration] = useState('');
  const [character, setCharacter] = useState(CHARACTERS.narrator);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoScan, setAutoScan] = useState(false);
  const [forceCharacter, setForceCharacter] = useState(null); // null = auto
  const [toast, setToast] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const captureCanvasRef = useRef(null);
  const engineRef = useRef(null);
  const autoScanRef = useRef(null);
  const audioRef = useRef(null);
  const recognitionRef = useRef(null);

  // Show toast notification
  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera error:', err);
      showToast('Camera access needed — check permissions');
    }
  }, [showToast]);

  // Capture a frame from the camera as base64
  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return null;

    canvas.width = 640; // Downscale for API efficiency
    canvas.height = Math.round(640 * (video.videoHeight / video.videoWidth));
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.7);
  }, []);

  // Analyze current frame
  const analyzeScene = useCallback(async (userMessage = null) => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);

    try {
      const imageBase64 = captureFrame();
      if (!imageBase64) {
        showToast('No camera feed yet');
        setIsAnalyzing(false);
        return;
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          sessionHistory,
          userMessage,
          forceCharacter,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.details || 'Analysis failed');
      }

      const data = await response.json();

      // Update character
      const newChar = CHARACTERS[data.character] || CHARACTERS.narrator;
      setCharacter(newChar);
      if (engineRef.current) {
        engineRef.current.setCharacter(data.character);
      }

      // Update narration with typewriter-ish effect
      setNarration(data.narration);

      // Add to session history
      setSessionHistory(prev => [...prev.slice(-9), data.narration]);

      // Speak the narration
      speakNarration(data.narration, data.character);

    } catch (err) {
      console.error('Analysis error:', err);
      showToast('Analysis failed — ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAnalyzing, captureFrame, sessionHistory, forceCharacter, showToast]);

  // Text-to-Speech via ElevenLabs
  const speakNarration = useCallback(async (text, characterId) => {
    try {
      setIsSpeaking(true);

      const response = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, characterId }),
      });

      if (!response.ok) {
        // Fall back to browser TTS
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.onend = () => setIsSpeaking(false);
        speechSynthesis.speak(utterance);
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        await audioRef.current.play();
      }
    } catch (err) {
      console.error('TTS error:', err);
      setIsSpeaking(false);
    }
  }, []);

  // Voice input via Web Speech API
  const toggleListening = useCallback(() => {
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e) => {
      console.error('Speech error:', e);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      showToast(`You said: "${transcript}"`);
      analyzeScene(transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isListening, analyzeScene, showToast]);

  // Auto-scan timer
  useEffect(() => {
    if (autoScan && started) {
      autoScanRef.current = setInterval(() => {
        analyzeScene();
      }, 12000); // Every 12 seconds
    }
    return () => {
      if (autoScanRef.current) clearInterval(autoScanRef.current);
    };
  }, [autoScan, started, analyzeScene]);

  // Initialize
  const handleStart = async () => {
    setStarted(true);
    await startCamera();

    // Start particle engine
    if (canvasRef.current) {
      const engine = new ParticleEngine(canvasRef.current);
      engineRef.current = engine;
      engine.start();

      const handleResize = () => engine.resize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  };

  // Get edge glow style for current character
  const edgeGlowStyle = {
    boxShadow: `inset 0 0 60px 20px ${character.color}33,
                inset 0 0 120px 40px ${character.color}15`,
  };

  // ─── Render ───

  if (!started) {
    return (
      <div className="app-container">
        <div className="welcome-overlay">
          <WelcomeParticles />
          <h1>Disney Lens</h1>
          <p className="subtitle">AI Immersive Experience</p>
          <p className="tagline">
            See your world through the eyes of enchanted characters.
            Point your camera anywhere — and let the magic begin.
          </p>
          <button className="start-btn" onClick={handleStart}>
            Enter the Story
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Camera feed */}
      <div className="camera-layer">
        <video ref={videoRef} playsInline muted autoPlay />
      </div>

      {/* Particle effects canvas */}
      <canvas ref={canvasRef} className="effects-layer" />

      {/* Hidden canvas for frame capture */}
      <canvas ref={captureCanvasRef} style={{ display: 'none' }} />

      {/* Audio element for TTS */}
      <audio ref={audioRef} />

      {/* Edge glow */}
      <div className="edge-glow" style={edgeGlowStyle} />

      {/* UI layer */}
      <div className="ui-layer">
        {/* Top bar */}
        <div className="top-bar" style={{ gap: 12 }}>
          <div className="character-badge" style={{ borderColor: character.color + '55' }}>
            <span className="emoji">{character.emoji}</span>
            <span className="name" style={{ color: character.color }}>{character.name}</span>
            {isAnalyzing && <div className="status-dot analyzing" />}
            {!isAnalyzing && isSpeaking && <div className="status-dot" style={{ background: character.color }} />}
          </div>

          <button
            className={`auto-scan-toggle ${autoScan ? 'active' : ''}`}
            onClick={() => setAutoScan(!autoScan)}
          >
            <span>{autoScan ? '⏸' : '▶'}</span>
            Auto
          </button>
        </div>

        {/* Middle spacer */}
        <div style={{ flex: 1 }} />

        {/* Narration */}
        {narration && (
          <div className="narration-area">
            <div className="narration-bubble" style={{ borderColor: character.color + '33' }}>
              <p className="narration-text appearing" key={narration}>
                {narration}
              </p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div style={{ padding: '0 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <div className="character-selector">
              <button
                className={`char-option auto-mode ${forceCharacter === null ? 'active' : ''}`}
                style={{ color: forceCharacter === null ? '#4ECDC4' : undefined }}
                onClick={() => setForceCharacter(null)}
                title="Auto-detect character"
              >
                AI
              </button>
              {Object.values(CHARACTERS).map(c => (
                <button
                  key={c.id}
                  className={`char-option ${forceCharacter === c.id ? 'active' : ''}`}
                  style={{ color: c.color }}
                  onClick={() => {
                    setForceCharacter(c.id);
                    showToast(`Switched to ${c.name}`);
                  }}
                  title={c.name}
                >
                  {c.emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="controls-bar">
            {/* Voice input */}
            <button
              className={`control-btn ${isListening ? 'active' : ''}`}
              style={{ color: isListening ? '#ff4444' : 'white' }}
              onClick={toggleListening}
              title="Speak to the character"
            >
              🎤
            </button>

            {/* Main capture button */}
            <button
              className={`capture-btn ${isAnalyzing ? 'analyzing' : isListening ? 'listening' : ''}`}
              onClick={() => analyzeScene()}
              disabled={isAnalyzing}
              title="Analyze scene"
            >
              {isAnalyzing ? '⏳' : '👁'}
            </button>

            {/* Mute/unmute TTS */}
            <button
              className="control-btn"
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.muted = !audioRef.current.muted;
                  showToast(audioRef.current.muted ? 'Voice muted' : 'Voice unmuted');
                }
              }}
              title="Toggle voice"
            >
              🔊
            </button>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

// ─── Welcome screen ambient particles ───
function WelcomeParticles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: 1 + Math.random() * 2,
      opacity: Math.random() * 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.1 - Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
    }));

    let running = true;
    const animate = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.phase += 0.02;
        p.x += p.vx + Math.sin(p.phase) * 0.2;
        p.y += p.vy;
        p.opacity = 0.2 + Math.sin(p.phase) * 0.3;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = '#FFD700';
        ctx.fill();
        ctx.restore();
      }
      requestAnimationFrame(animate);
    };
    animate();

    return () => { running = false; };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}
