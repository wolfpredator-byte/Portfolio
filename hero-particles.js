/**
 * SubD_Zero — Hero Particle Grid
 * Lightweight animated neon particle mesh replacing the heavy Spline 3D scene.
 * Zero dependencies. ~4KB unminified.
 */
(function () {
  const canvas = document.getElementById('canvas3d');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height, particles, mouse, animId;
  let scrollY = 0;

  // ── Config ────────────────────────────────────────────────────
  const CFG = {
    particleCount: 90,
    maxLinkDist: 160,
    particleRadius: 1.8,
    mouseRadius: 200,
    mouseForce: 0.04,
    baseSpeed: 0.35,
    colors: {
      particle: '#00FFC2',
      link: 'rgba(0, 255, 194, ',      // alpha appended dynamically
      glowParticle: 'rgba(170, 255, 220, 0.6)',
      glowLine: 'rgba(0, 255, 194, 0.15)',
    },
    // Accent dots — larger, brighter, fewer
    accentCount: 6,
    accentRadius: 3.2,
    accentGlow: 18,
  };

  // ── Mouse tracking ────────────────────────────────────────────
  mouse = { x: -9999, y: -9999 };

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  canvas.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  // Touch support
  canvas.addEventListener('touchmove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.touches[0].clientX - rect.left;
    mouse.y = e.touches[0].clientY - rect.top;
  }, { passive: true });
  canvas.addEventListener('touchend', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  window.addEventListener('scroll', () => {
    scrollY = window.pageYOffset || document.documentElement.scrollTop;
  }, { passive: true });

  // ── Particle class ────────────────────────────────────────────
  class Particle {
    constructor(isAccent) {
      this.isAccent = isAccent;
      this.reset();
    }

    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.vx = (Math.random() - 0.5) * CFG.baseSpeed;
      this.vy = (Math.random() - 0.5) * CFG.baseSpeed;
      this.radius = this.isAccent ? CFG.accentRadius : CFG.particleRadius;
      this.baseAlpha = this.isAccent ? 0.9 : 0.4 + Math.random() * 0.4;
      this.alpha = this.baseAlpha;
      this.pulse = Math.random() * Math.PI * 2; // phase offset for pulsing
    }

    update(dt) {
      // Gentle pulse
      this.pulse += 0.015;
      this.alpha = this.baseAlpha + Math.sin(this.pulse) * 0.15;

      // Scroll parallax — particles drift down slightly
      const scrollFactor = this.isAccent ? 0.08 : 0.03;
      const scrollOffset = scrollY * scrollFactor;

      // Mouse repulsion
      const dx = this.x - mouse.x;
      const dy = this.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CFG.mouseRadius && dist > 0) {
        const force = (1 - dist / CFG.mouseRadius) * CFG.mouseForce;
        this.vx += (dx / dist) * force;
        this.vy += (dy / dist) * force;
      }

      // Friction
      this.vx *= 0.995;
      this.vy *= 0.995;

      this.x += this.vx;
      this.y += this.vy;

      // Wrap around edges
      if (this.x < -20) this.x = width + 20;
      if (this.x > width + 20) this.x = -20;
      if (this.y < -20) this.y = height + 20;
      if (this.y > height + 20) this.y = -20;

      // Store rendered y with parallax
      this._ry = this.y + scrollOffset;
    }

    draw() {
      const r = this.radius;
      const ry = this._ry;

      // Glow halo
      if (this.isAccent) {
        ctx.beginPath();
        ctx.arc(this.x, ry, r + CFG.accentGlow, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(this.x, ry, r, this.x, ry, r + CFG.accentGlow);
        grad.addColorStop(0, `rgba(0, 255, 194, ${this.alpha * 0.35})`);
        grad.addColorStop(1, 'rgba(0, 255, 194, 0)');
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Core dot
      ctx.beginPath();
      ctx.arc(this.x, ry, r, 0, Math.PI * 2);
      ctx.fillStyle = this.isAccent
        ? `rgba(170, 255, 220, ${this.alpha})`
        : `rgba(0, 255, 194, ${this.alpha})`;
      ctx.fill();
    }
  }

  // ── Drawing helpers ───────────────────────────────────────────
  function drawLinks() {
    const maxD2 = CFG.maxLinkDist * CFG.maxLinkDist;

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a._ry - b._ry;
        const d2 = dx * dx + dy * dy;

        if (d2 < maxD2) {
          const alpha = (1 - d2 / maxD2) * 0.25;
          ctx.beginPath();
          ctx.moveTo(a.x, a._ry);
          ctx.lineTo(b.x, b._ry);
          ctx.strokeStyle = CFG.colors.link + alpha.toFixed(3) + ')';
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }
  }

  // ── Resize handler ────────────────────────────────────────────
  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ── Init ──────────────────────────────────────────────────────
  function init() {
    resize();
    particles = [];

    // Accent particles
    for (let i = 0; i < CFG.accentCount; i++) {
      particles.push(new Particle(true));
    }
    // Regular particles
    const count = Math.min(CFG.particleCount, Math.floor((width * height) / 12000));
    for (let i = 0; i < count; i++) {
      particles.push(new Particle(false));
    }
  }

  // ── Main loop ─────────────────────────────────────────────────
  function loop() {
    ctx.clearRect(0, 0, width, height);

    for (const p of particles) p.update();
    drawLinks();
    for (const p of particles) p.draw();

    animId = requestAnimationFrame(loop);
  }

  // ── Start ─────────────────────────────────────────────────────
  init();
  loop();

  // Debounced resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      init();
    }, 150);
  });

  // Pause when hero section is out of view
  const heroSection = document.getElementById('hero-scene');
  if (heroSection && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          cancelAnimationFrame(animId);
        } else {
          cancelAnimationFrame(animId);
          loop();
        }
      });
    }, { threshold: 0.05 });
    observer.observe(heroSection);
  }
})();
