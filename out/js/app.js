// ============================================
// REPAIR ON - Premium Site Interactions
// ============================================

(function() {
  'use strict';

  // ============================================
  // UTILITIES
  // ============================================
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
  const lerp = (a, b, t) => a + (b - a) * t;

  // Reduced motion check
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ============================================
  // LOADER
  // ============================================
  function initLoader() {
    const loader = $('#loader');
    if (!loader) return;

    window.addEventListener('load', () => {
      setTimeout(() => {
        loader.classList.add('hidden');
        setTimeout(() => loader.remove(), 500);
      }, 800);
    });
  }

  // ============================================
  // CUSTOM CURSOR WITH TRAIL
  // ============================================
  function initCustomCursor() {
    if (prefersReducedMotion || window.innerWidth <= 1024) return;

    const cursorDot = $('#cursorDot');
    const cursorRing = $('#cursorRing');
    const trails = $$('.cursor-trail');
    
    if (!cursorDot || !cursorRing) return;

    let mouseX = 0, mouseY = 0;
    let dotX = 0, dotY = 0;
    let ringX = 0, ringY = 0;
    const trailPositions = trails.map(() => ({ x: 0, y: 0, delay: 0 }));

    // Magnetic elements
    const magneticElements = $$('[data-magnetic], a, button, .group');

    function animate() {
      if (prefersReducedMotion) return;

      // Smooth follow for dot
      dotX = lerp(dotX, mouseX, 0.3);
      dotY = lerp(dotY, mouseY, 0.3);
      cursorDot.style.transform = `translate(${dotX - 4}px, ${dotY - 4}px)`;

      // Smoother follow for ring
      ringX = lerp(ringX, mouseX, 0.15);
      ringY = lerp(ringY, mouseY, 0.15);
      cursorRing.style.transform = `translate(${ringX - 20}px, ${ringY - 20}px)`;

      // Trail effect
      trails.forEach((trail, i) => {
        const pos = trailPositions[i];
        const delay = 0.08 * (i + 1);
        pos.x = lerp(pos.x, mouseX, delay);
        pos.y = lerp(pos.y, mouseY, delay);
        trail.style.transform = `translate(${pos.x - 3}px, ${pos.y - 3}px)`;
        trail.style.opacity = 0.4 - i * 0.07;
      });

      requestAnimationFrame(animate);
    }

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    // Hover states for interactive elements
    magneticElements.forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursorDot.classList.add('hover');
        cursorRing.classList.add('hover');
        trails.forEach(t => t.style.width = '10px', t.style.height = '10px');
      });
      el.addEventListener('mouseleave', () => {
        cursorDot.classList.remove('hover');
        cursorRing.classList.remove('hover');
        trails.forEach(t => t.style.width = '6px', t.style.height = '6px');
      });
      el.addEventListener('mousedown', () => {
        cursorDot.classList.add('click');
        cursorRing.classList.add('click');
      });
      el.addEventListener('mouseup', () => {
        cursorDot.classList.remove('click');
        cursorRing.classList.remove('click');
      });
    });

    animate();
  }

  // ============================================
  // PARTICLE SYSTEM
  // ============================================
  function initParticles() {
    if (prefersReducedMotion) return;

    const canvas = $('#particle-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId = null;
    let width = 0, height = 0;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 1.5 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.3 + 0.1;
        this.color = Math.random() > 0.5 ? '#3b82f6' : '#facc15';
        this.life = 0;
        this.maxLife = Math.random() * 200 + 100;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life++;

        if (this.life > this.maxLife || 
            this.x < -10 || this.x > width + 10 || 
            this.y < -10 || this.y > height + 10) {
          this.reset();
          this.x = Math.random() * width;
          this.y = Math.random() * height;
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity * (1 - this.life / this.maxLife);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    function init() {
      resize();
      const count = Math.min(80, Math.floor((width * height) / 15000));
      particles = Array.from({ length: count }, () => new Particle());
    }

    function animate() {
      if (prefersReducedMotion) return;
      
      ctx.clearRect(0, 0, width, height);
      
      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = particles[i].color;
            ctx.globalAlpha = 0.08 * (1 - dist / 120);
            ctx.lineWidth = 0.5;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }

      particles.forEach(p => {
        p.update();
        p.draw();
      });

      animationId = requestAnimationFrame(animate);
    }

    window.addEventListener('resize', () => {
      resize();
      init();
    });

    init();
    animate();
  }

  // ============================================
  // SCROLL PROGRESS INDICATOR
  // ============================================
  function initScrollProgress() {
    const progress = $('#scrollProgress');
    if (!progress) return;

    function update() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progressPercent = scrollTop / docHeight;
      progress.style.transform = `scaleX(${progressPercent})`;
    }

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  // ============================================
  // SCROLL REVEAL ANIMATIONS (IntersectionObserver)
  // ============================================
  function initScrollReveal() {
    if (prefersReducedMotion) return;

    const revealElements = $$('.reveal, .reveal-left, .reveal-right, .reveal-scale, .text-reveal');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => observer.observe(el));
  }

  // ============================================
  // PARALLAX EFFECTS
  // ============================================
  function initParallax() {
    if (prefersReducedMotion) return;

    const parallaxElements = $$('[data-parallax]');
    if (parallaxElements.length === 0) return;

    let ticking = false;

    function update() {
      const scrollY = window.scrollY;

      parallaxElements.forEach(el => {
        const speed = parseFloat(el.dataset.parallax) || 0.1;
        const rect = el.getBoundingClientRect();
        const offset = rect.top + scrollY;
        const distance = scrollY - offset + window.innerHeight;
        
        if (distance > -rect.height && distance < window.innerHeight + rect.height) {
          const y = distance * speed;
          el.style.transform = `translate3d(0, ${y}px, 0)`;
        }
      });

      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    update();
  }

  // ============================================
  // MAGNETIC BUTTONS
  // ============================================
  function initMagneticButtons() {
    if (prefersReducedMotion) return;

    const magneticButtons = $$('[data-magnetic]');

    magneticButtons.forEach(btn => {
      let bounds = null;

      function updateBounds() {
        bounds = btn.getBoundingClientRect();
      }

      btn.addEventListener('mousemove', (e) => {
        if (!bounds) updateBounds();
        
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        const strength = 0.3;
        btn.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0, 0)';
      });

      btn.addEventListener('mousedown', () => {
        btn.style.transform = 'translate(0, 0) scale(0.96)';
      });

      btn.addEventListener('mouseup', () => {
        btn.style.transform = 'translate(0, 0) scale(1)';
      });

      window.addEventListener('resize', updateBounds);
    });
  }

  // ============================================
  // SMOOTH SCROLL FOR ANCHORS
  // ============================================
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  // ============================================
  // HEADER SCROLL EFFECT
  // ============================================
  function initHeaderScroll() {
    const header = $('header');
    if (!header) return;

    let lastScroll = 0;
    let ticking = false;

    function update() {
      const scrollY = window.scrollY;
      
      if (scrollY > 100) {
        header.classList.add('bg-[#060913]/90', 'backdrop-blur-md', 'shadow-[0_10px_40px_rgba(0,0,0,0.3)]');
        header.classList.remove('bg-transparent');
      } else {
        header.classList.remove('bg-[#060913]/90', 'backdrop-blur-md', 'shadow-[0_10px_40px_rgba(0,0,0,0.3)]');
        header.classList.add('bg-transparent');
      }

      lastScroll = scrollY;
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });
  }

  // ============================================
  // CARD HOVER EFFECTS (3D tilt)
  // ============================================
  function initCardTilt() {
    if (prefersReducedMotion) return;

    const cards = $$('.glass-premium, .glass');

    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
      });
    });
  }

  // ============================================
  // NAVIGATION ACTIVE STATE
  // ============================================
  function initNavActive() {
    const sections = $$('section[id]');
    const navLinks = $$('header a[href^="#"]');
    
    if (sections.length === 0 || navLinks.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            link.classList.toggle('text-yellow-400', link.getAttribute('href') === `#${id}`);
            link.classList.toggle('text-white', link.getAttribute('href') !== `#${id}`);
          });
        }
      });
    }, {
      threshold: 0.5,
      rootMargin: '-100px 0px -100px 0px'
    });

    sections.forEach(section => observer.observe(section));
  }

  // ============================================
  // FLOATING ANIMATION FOR BADGES
  // ============================================
  function initFloatingAnimations() {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float-slow {
        0%, 100% { transform: translate(0, 0) rotate(0deg); }
        25% { transform: translate(10px, -15px) rotate(2deg); }
        50% { transform: translate(-5px, 10px) rotate(-1deg); }
        75% { transform: translate(15px, 5px) rotate(1deg); }
      }
      .animate-float-slow {
        animation: float-slow 8s infinite ease-in-out;
      }
    `;
    document.head.appendChild(style);
  }

  // ============================================
  // PERFORMANCE: DEBOUNCE/THROTTLE HELPERS
  // ============================================
  function debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }

  function throttle(fn, limit) {
    let inThrottle;
    return (...args) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // ============================================
  // INITIALIZE ALL
  // ============================================
  function init() {
    // Core features
    initLoader();
    initCustomCursor();
    initParticles();
    initScrollProgress();
    initScrollReveal();
    initParallax();
    initMagneticButtons();
    initSmoothScroll();
    initHeaderScroll();
    initCardTilt();
    initNavActive();
    initFloatingAnimations();

    // Add loaded class to body for CSS transitions
    document.body.classList.add('loaded');
  }

  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for debugging
  window.RepairOn = {
    initCustomCursor,
    initParticles,
    initScrollReveal,
    initParallax,
    initMagneticButtons
  };
})();