/* =========================================================
   CONFIGURACIÓN GENERAL
   ========================================================= */
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const DPR = Math.min(window.devicePixelRatio || 1, 2);

function isLowPower(){
  // Reduce carga de partículas en pantallas pequeñas / gama baja
  return window.innerWidth < 420 || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
}

function resizeCanvas(canvas){
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = Math.max(1, rect.width * DPR);
  canvas.height = Math.max(1, rect.height * DPR);
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';
  return { w: rect.width, h: rect.height };
}

/* =========================================================
   1. PARTÍCULAS AMBIENTALES DE FONDO (bokeh + brillos)
   ========================================================= */
(function backgroundParticles(){
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let w, h, particles = [];

  function setup(){
    canvas.width = window.innerWidth * DPR;
    canvas.height = window.innerHeight * DPR;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    w = window.innerWidth; h = window.innerHeight;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    const count = REDUCED_MOTION ? 0 : (isLowPower() ? 28 : 55);
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 2 + 0.4,
      baseAlpha: Math.random() * 0.5 + 0.15,
      speed: Math.random() * 0.15 + 0.03,
      drift: (Math.random() - 0.5) * 0.15,
      hue: Math.random() > 0.6 ? '255,143,214' : '200,150,255',
      twinkle: Math.random() * Math.PI * 2
    }));
  }

  function tick(t){
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => {
      p.y -= p.speed;
      p.x += p.drift;
      p.twinkle += 0.02;
      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      const alpha = p.baseAlpha * (0.6 + 0.4 * Math.sin(p.twinkle));
      ctx.beginPath();
      ctx.fillStyle = `rgba(${p.hue},${alpha})`;
      ctx.shadowColor = `rgba(${p.hue},0.8)`;
      ctx.shadowBlur = 6;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    if (!REDUCED_MOTION) requestAnimationFrame(tick);
  }

  setup();
  window.addEventListener('resize', setup);
  requestAnimationFrame(tick);
})();

/* =========================================================
   2. CORAZONES FLOTANTES DISCRETOS
   ========================================================= */
(function floatingHearts(){
  if (REDUCED_MOTION) return;
  const container = document.getElementById('floating-hearts');
  const symbols = ['❤', '♥'];

  function spawn(){
    const heart = document.createElement('span');
    heart.className = 'floating-heart';
    heart.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    const startX = Math.random() * window.innerWidth;
    const drift = (Math.random() - 0.5) * 120;
    const duration = 9 + Math.random() * 6;
    const size = 10 + Math.random() * 12;
    heart.style.left = startX + 'px';
    heart.style.fontSize = size + 'px';
    heart.style.setProperty('--drift', drift + 'px');
    heart.style.animationDuration = duration + 's';
    container.appendChild(heart);
    setTimeout(() => heart.remove(), duration * 1000 + 200);
  }

  setInterval(spawn, 2600);
  setTimeout(spawn, 800);
})();

/* =========================================================
   3. INTERACCIÓN TÁCTIL (destello + onda + mini corazones)
   ========================================================= */
(function touchInteraction(){
  const canvas = document.getElementById('touch-canvas');
  const ctx = canvas.getContext('2d');
  let ripples = [];
  let bursts = [];

  function setup(){
    canvas.width = window.innerWidth * DPR;
    canvas.height = window.innerHeight * DPR;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  setup();
  window.addEventListener('resize', setup);

  function triggerAt(x, y){
    ripples.push({ x, y, r: 0, alpha: 0.5 });
    const n = REDUCED_MOTION ? 5 : 12;
    for (let i = 0; i < n; i++){
      const angle = (Math.PI * 2 * i) / n + Math.random() * 0.3;
      const speed = 1 + Math.random() * 2;
      bursts.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        isHeart: Math.random() > 0.65
      });
    }
  }

  function loop(){
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    ripples.forEach(r => {
      r.r += 3.2;
      r.alpha *= 0.94;
      ctx.beginPath();
      ctx.strokeStyle = `rgba(255,143,214,${r.alpha})`;
      ctx.lineWidth = 1.5;
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
    });
    ripples = ripples.filter(r => r.alpha > 0.02);

    bursts.forEach(b => {
      b.x += b.vx;
      b.y += b.vy;
      b.vy += 0.02;
      b.life -= 0.02;
      ctx.globalAlpha = Math.max(b.life, 0);
      if (b.isHeart){
        ctx.font = '12px serif';
        ctx.fillStyle = '#ff8fd6';
        ctx.fillText('❤', b.x, b.y);
      } else {
        ctx.beginPath();
        ctx.fillStyle = '#fff3f9';
        ctx.shadowColor = 'rgba(255,63,180,0.9)';
        ctx.shadowBlur = 8;
        ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
    bursts = bursts.filter(b => b.life > 0);

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  window.addEventListener('pointerdown', (e) => triggerAt(e.clientX, e.clientY));
})();

/* =========================================================
   4. REVELADO PROGRESIVO DE TEXTO AL HACER SCROLL
   ========================================================= */
(function scrollReveal(){
  const targets = document.querySelectorAll(
    '.reveal-line, .photo-frame, .gallery-title, .album-item, .special-line, .final-line'
  );

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        const delay = entry.target.dataset.reveal ? (parseInt(entry.target.dataset.reveal, 10) - 1) * 500 : 0;
        setTimeout(() => entry.target.classList.add('is-visible'), delay);
      }
    });
  }, { threshold: 0.4 });

  targets.forEach(t => observer.observe(t));

  // Corazón final visible cuando se llega a esa escena
  const finalHeartCanvas = document.getElementById('final-heart-canvas');
  const finalObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) finalHeartCanvas.classList.add('is-visible');
    });
  }, { threshold: 0.3 });
  finalObserver.observe(document.getElementById('scene-final'));
})();

/* =========================================================
   5. DEDICATORIA — mensajes que aparecen y desaparecen uno a uno
   ========================================================= */
(function dedicationSequence(){
  const stage = document.querySelector('.dedication-stage');
  const lines = document.querySelectorAll('.dedication-line');
  const section = document.getElementById('scene-dedication');
  if (!lines.length) return;

  // Cada línea ocupa un tramo de scroll dentro de la sección alta (140svh)
  function update(){
    const rect = section.getBoundingClientRect();
    const sectionHeight = section.offsetHeight - window.innerHeight;
    const scrolled = Math.min(Math.max(-rect.top, 0), sectionHeight);
    const progress = sectionHeight > 0 ? scrolled / sectionHeight : 0;
    const step = 1 / lines.length;
    const activeIndex = Math.min(lines.length - 1, Math.floor(progress / step));

    lines.forEach((line, i) => {
      line.classList.toggle('is-visible', i === activeIndex);
    });
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

/* =========================================================
   6. CORAZÓN DE PARTÍCULAS (se construye progresivamente)
   ========================================================= */
(function particleHeart(){
  const canvas = document.getElementById('heart-canvas');
  const ctx = canvas.getContext('2d');
  const section = document.getElementById('scene-heart');
  const photoFrame = document.getElementById('photo-frame');
  let w, h, points = [], built = false;
  let progress = 0; // 0 -> 1 mientras se construye el corazón

  function heartPoint(t, scale){
    // Ecuación paramétrica de corazón
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
    return { x: x * scale, y: -y * scale };
  }

  function setup(){
    const dims = resizeCanvas(canvas);
    w = dims.w; h = dims.h;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    const count = isLowPower() ? 260 : 480;
    const scale = Math.min(w, h) / 34;
    points = Array.from({ length: count }, () => {
      const t = Math.random() * Math.PI * 2;
      const jitter = 0.85 + Math.random() * 0.3;
      const target = heartPoint(t, scale * jitter);
      return {
        tx: w / 2 + target.x,
        ty: h / 2 + target.y,
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.6 + 0.6,
        speed: 0.02 + Math.random() * 0.02,
        twinkle: Math.random() * Math.PI * 2,
        arrived: false
      };
    });
  }

  function draw(){
    ctx.clearRect(0, 0, w, h);
    let allArrived = true;

    points.forEach(p => {
      p.x += (p.tx - p.x) * p.speed;
      p.y += (p.ty - p.y) * p.speed;
      p.twinkle += 0.03;
      if (Math.abs(p.tx - p.x) > 0.6 || Math.abs(p.ty - p.y) > 0.6) allArrived = false;

      const alpha = 0.55 + 0.45 * Math.sin(p.twinkle);
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,143,214,${alpha})`;
      ctx.shadowColor = 'rgba(255,63,180,0.9)';
      ctx.shadowBlur = 8;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    if (allArrived && !built){
      built = true;
      photoFrame.classList.add('is-visible');
    }

    requestAnimationFrame(draw);
  }

  setup();
  window.addEventListener('resize', setup);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) requestAnimationFrame(draw); });
  }, { threshold: 0.2 });
  observer.observe(section);
})();

/* =========================================================
   7. MOMENTO ESPECIAL — partículas que se reúnen en un corazón
   ========================================================= */
(function specialMoment(){
  const canvas = document.getElementById('special-canvas');
  const ctx = canvas.getContext('2d');
  const section = document.getElementById('scene-special');
  let w, h, points = [], started = false;

  function heartPoint(t, scale){
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
    return { x: x * scale, y: -y * scale };
  }

  function setup(){
    const dims = resizeCanvas(canvas);
    w = dims.w; h = dims.h;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const count = isLowPower() ? 160 : 280;
    const scale = Math.min(w, h) / 40;
    points = Array.from({ length: count }, () => {
      const t = Math.random() * Math.PI * 2;
      const target = heartPoint(t, scale);
      return {
        tx: w / 2 + target.x,
        ty: h / 2 + target.y - h * 0.05,
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.4 + 0.5,
        speed: 0.012 + Math.random() * 0.015
      };
    });
  }

  function draw(){
    ctx.clearRect(0, 0, w, h);
    points.forEach(p => {
      p.x += (p.tx - p.x) * p.speed;
      p.y += (p.ty - p.y) * p.speed;
      ctx.beginPath();
      ctx.fillStyle = 'rgba(200,150,255,0.65)';
      ctx.shadowColor = 'rgba(255,63,180,0.7)';
      ctx.shadowBlur = 7;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  setup();
  window.addEventListener('resize', setup);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !started){
        started = true;
        requestAnimationFrame(draw);
      }
    });
  }, { threshold: 0.2 });
  observer.observe(section);
})();

/* =========================================================
   8. ESCENA FINAL — estrellas + gran corazón luminoso
   ========================================================= */
(function finalScene(){
  const starsCanvas = document.getElementById('stars-canvas');
  const heartCanvas = document.getElementById('final-heart-canvas');
  const starsCtx = starsCanvas.getContext('2d');
  const heartCtx = heartCanvas.getContext('2d');
  const section = document.getElementById('scene-final');
  let w, h, stars = [], heartPoints = [], started = false;

  function heartPoint(t, scale){
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
    return { x: x * scale, y: -y * scale };
  }

  function setup(){
    const dims = resizeCanvas(starsCanvas);
    w = dims.w; h = dims.h;
    resizeCanvas(heartCanvas);
    starsCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
    heartCtx.setTransform(DPR, 0, 0, DPR, 0, 0);

    stars = Array.from({ length: isLowPower() ? 60 : 110 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.2 + 0.3,
      twinkle: Math.random() * Math.PI * 2
    }));

    const scale = Math.min(w, h) / 30;
    heartPoints = Array.from({ length: isLowPower() ? 220 : 380 }, () => {
      const t = Math.random() * Math.PI * 2;
      const target = heartPoint(t, scale);
      return { x: w / 2 + target.x, y: h * 0.6 + target.y, r: Math.random() * 1.6 + 0.6, twinkle: Math.random() * Math.PI * 2 };
    });
  }

  function drawStars(){
    starsCtx.clearRect(0, 0, w, h);
    stars.forEach(s => {
      s.twinkle += 0.015;
      const alpha = 0.4 + 0.5 * Math.sin(s.twinkle);
      starsCtx.beginPath();
      starsCtx.fillStyle = `rgba(255,243,249,${alpha})`;
      starsCtx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      starsCtx.fill();
    });
    requestAnimationFrame(drawStars);
  }

  function drawHeart(){
    heartCtx.clearRect(0, 0, w, h);
    heartPoints.forEach(p => {
      p.twinkle += 0.025;
      const alpha = 0.55 + 0.45 * Math.sin(p.twinkle);
      heartCtx.beginPath();
      heartCtx.fillStyle = `rgba(255,143,214,${alpha})`;
      heartCtx.shadowColor = 'rgba(255,63,180,0.9)';
      heartCtx.shadowBlur = 10;
      heartCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      heartCtx.fill();
    });
    requestAnimationFrame(drawHeart);
  }

  setup();
  window.addEventListener('resize', setup);
  requestAnimationFrame(drawStars);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !started){
        started = true;
        requestAnimationFrame(drawHeart);
      }
    });
  }, { threshold: 0.2 });
  observer.observe(section);
})();

/* =========================================================
   9. REPRODUCTOR DE MÚSICA — "Brillas", León Larregui
   ========================================================= */
(function musicPlayer(){
  const audio = document.getElementById('song');
  const toggleBtn = document.getElementById('music-toggle');
  const playerWrap = document.getElementById('music-player');
  const fallbackBtn = document.getElementById('autoplay-fallback');
  let isPlaying = false;

  function setPlayingState(playing){
    isPlaying = playing;
    playerWrap.classList.toggle('playing', playing);
    toggleBtn.setAttribute('aria-label', playing ? 'Pausar música' : 'Reproducir música');
  }

  function play(){
    audio.play().then(() => {
      setPlayingState(true);
      fallbackBtn.classList.add('hidden');
    }).catch(() => {
      // Autoplay bloqueado por el navegador
      fallbackBtn.classList.remove('hidden');
    });
  }

  function pause(){
    audio.pause();
    setPlayingState(false);
  }

  toggleBtn.addEventListener('click', () => { isPlaying ? pause() : play(); });
  fallbackBtn.addEventListener('click', () => { play(); });

  // Intento suave de autoplay al primer gesto del usuario (política de navegadores)
  let attempted = false;
  function tryAutoplayOnFirstGesture(){
    if (attempted) return;
    attempted = true;
    play();
    window.removeEventListener('pointerdown', tryAutoplayOnFirstGesture);
  }
  window.addEventListener('pointerdown', tryAutoplayOnFirstGesture, { once: true });
})();
