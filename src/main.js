// ═══════════════════════════════════════
// STATE
// ═══════════════════════════════════════
const state = {
  step: 1,
  totalSteps: 26,
  answers: {},
  altura: 165,
  peso: 70,
  history: [1],
};

// Phase boundaries: steps 1-13 = phase1, 14-26 = phase2
const PHASE1_END = 13;
const PHASE2_START = 14;

// Steps where back button is hidden
const NO_BACK_STEPS = new Set([1, 12, 14, 24]);

// ═══════════════════════════════════════
// PROGRESS BAR
// ═══════════════════════════════════════
function updateProgressBar(stepN) {
  const fill1 = document.getElementById('fill1');
  const fill2 = document.getElementById('fill2');

  if (stepN <= PHASE1_END) {
    const pct = (stepN / PHASE1_END) * 100;
    fill1.style.width = pct + '%';
    fill2.style.width = '0%';
  } else {
    fill1.style.width = '100%';
    const pct = ((stepN - PHASE2_START + 1) / (state.totalSteps - PHASE2_START + 1)) * 100;
    fill2.style.width = Math.min(100, pct) + '%';
  }
}

// ═══════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════
let isAnimating = false;

function goToStep(n, direction) {
  if (isAnimating || n < 1 || n > state.totalSteps) return;
  if (direction === undefined) direction = n > state.step ? 'forward' : 'back';

  isAnimating = true;

  const current = document.querySelector('.step.active');
  const next = document.querySelector(`.step[data-step="${n}"]`);
  if (!next) { isAnimating = false; return; }

  // Animate out
  current.classList.add(direction === 'forward' ? 'leaving-left' : 'leaving-right');

  setTimeout(() => {
    current.classList.remove('active', 'leaving-left', 'leaving-right');
    // Reset entering classes
    next.classList.remove('entering-right', 'entering-left');
    next.classList.add('active', direction === 'forward' ? 'entering-right' : 'entering-left');

    // Force reflow
    void next.offsetHeight;

    setTimeout(() => {
      next.classList.remove('entering-right', 'entering-left');
      isAnimating = false;
    }, 350);

    state.step = n;
    updateProgressBar(n);
    updateBackButton(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Trigger loading if needed
    const loadingAttr = next.getAttribute('data-loading');
    if (loadingAttr === 'true') {
      const nextStep = parseInt(next.getAttribute('data-next'));
      const pctEl = next.querySelector('.loading-percent');
      const barEl = next.querySelector('.loading-bar-fill');
      const subEl = next.querySelector('.loading-subtitle');
      startLoading(n, pctEl, barEl, subEl, nextStep);
    }
  }, 300);
}

function updateBackButton(stepN) {
  const btn = document.getElementById('btn-back');
  if (NO_BACK_STEPS.has(stepN)) {
    btn.classList.add('hidden');
  } else {
    btn.classList.remove('hidden');
  }
}

document.getElementById('btn-back').addEventListener('click', () => {
  if (state.history.length > 1) {
    state.history.pop();
    const prev = state.history[state.history.length - 1];
    goToStep(prev, 'back');
  }
});

function advance(n) {
  state.history.push(n);
  goToStep(n, 'forward');
}

// ═══════════════════════════════════════
// LOADING ANIMATION
// ═══════════════════════════════════════
const loadingMessages = {
  12: [
    'Identificando a causa raiz do problema',
    'Analisando seu perfil hormonal',
    'Calculando seu potencial de emagrecimento',
  ],
  14: [
    'Identificando a solução para seu caso',
    'Montando seu protocolo personalizado',
    'Quase pronto...',
  ],
  24: [
    'PREPARANDO SEU PROTOCOLO',
    'Montando seu plano personalizado',
    'Finalizando seu diagnóstico...',
  ],
};

const loadingTestimonials = [
  { name: 'Lucia Ribeiro', role: 'Atendente em loja', text: '"Desde que comecei estou eliminando uma média de 1kg por semana, totalizando 10,5kg."' },
  { name: 'Maria Silva', role: 'Professora', text: '"Em apenas 6 semanas eu já perdi 7kg e me sinto completamente diferente. O pilates em casa mudou minha vida!"' },
  { name: 'Ana Costa', role: 'Dona de casa', text: '"Nunca imaginei que 10 minutos por dia fariam tanta diferença. Já eliminei 12kg e a barriga sumiu!"' },
];

function startLoading(stepN, pctEl, barEl, subEl, nextStep) {
  const duration = stepN === 24 ? 3000 : 2500;
  const interval = 50;
  const totalTicks = duration / interval;
  let tick = 0;
  const msgs = loadingMessages[stepN] || loadingMessages[12];
  let msgIndex = 0;

  // For step 24, also rotate testimonials
  let depoInterval = null;
  let depoIndex = 0;
  if (stepN === 24) {
    depoInterval = setInterval(() => {
      depoIndex = (depoIndex + 1) % loadingTestimonials.length;
      const d = loadingTestimonials[depoIndex];
      const nameEl = document.getElementById('depo24-name');
      const roleEl = document.getElementById('depo24-role');
      const textEl = document.getElementById('depo24-text');
      const card   = document.getElementById('depo24');
      if (nameEl) nameEl.textContent = d.name;
      if (roleEl) roleEl.textContent = d.role;
      if (textEl) textEl.textContent = d.text;
      if (card) { card.style.opacity = '0'; setTimeout(() => { card.style.opacity = '1'; }, 200); }
    }, 2000);
  }

  const msgInterval = setInterval(() => {
    msgIndex = (msgIndex + 1) % msgs.length;
    if (subEl) subEl.textContent = msgs[msgIndex];
  }, 700);

  const timer = setInterval(() => {
    tick++;
    const pct = Math.min(100, Math.round((tick / totalTicks) * 100));
    if (pctEl) pctEl.textContent = pct + '%';
    if (barEl) barEl.style.width = pct + '%';

    if (pct >= 100) {
      clearInterval(timer);
      clearInterval(msgInterval);
      if (depoInterval) clearInterval(depoInterval);
      setTimeout(() => advance(nextStep), 400);
    }
  }, interval);
}

// ═══════════════════════════════════════
// OPTION CARDS — SINGLE SELECT
// ═══════════════════════════════════════
function setupSingleSelect() {
  document.querySelectorAll('.option-card.single, .option-card.age-option, .silhouette-card').forEach(card => {
    card.addEventListener('click', function(e) {
      addRipple(this, e);
      const parent = this.closest('.options-list, .options-grid-2, .options-grid-3');
      if (parent) {
        parent.querySelectorAll('.option-card, .silhouette-card').forEach(c => c.classList.remove('selected'));
      }
      this.classList.add('selected');

      const stepEl = this.closest('.step');
      const stepN = parseInt(stepEl.getAttribute('data-step'));
      state.answers[stepN] = this.getAttribute('data-value');

      const nextMap = {
        1: 2, 2: 3, 3: 4, 4: 5, 5: 6,
        9: 10, 10: 11, 17: 18, 18: 19,
        21: 22, 22: 23, 23: 24,
      };

      if (nextMap[stepN] !== undefined) {
        setTimeout(() => advance(nextMap[stepN]), 300);
      }
    });
  });
}

// ═══════════════════════════════════════
// OPTION CARDS — MULTI SELECT
// ═══════════════════════════════════════
function setupMultiSelect() {
  document.querySelectorAll('.option-card.multi').forEach(card => {
    card.addEventListener('click', function(e) {
      addRipple(this, e);
      this.classList.toggle('selected');
    });
  });
}

// ═══════════════════════════════════════
// CONTINUE BUTTONS (multi-choice steps)
// ═══════════════════════════════════════
function setupContinueButtons() {
  document.querySelectorAll('.btn-primary[data-next]').forEach(btn => {
    btn.addEventListener('click', function() {
      const nextStep = parseInt(this.getAttribute('data-next'));
      advance(nextStep);
    });
  });
}

// ═══════════════════════════════════════
// RIPPLE EFFECT
// ═══════════════════════════════════════
function addRipple(el, e) {
  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;
  const ripple = document.createElement('span');
  ripple.classList.add('ripple');
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`;
  el.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}

// ═══════════════════════════════════════
// SLIDERS
// ═══════════════════════════════════════
function setupSliders() {
  // ALTURA
  const alturaSlider = document.getElementById('slider-altura');
  const alturaDisplay = document.getElementById('altura-display');
  const unitCm = document.getElementById('unit-cm');
  const unitPol = document.getElementById('unit-pol');
  let alturaUnit = 'cm';

  function updateAlturaDisplay() {
    const val = alturaSlider.value;
    state.altura = parseInt(val);
    alturaDisplay.innerHTML = val + '<span class="slider-unit">' + alturaUnit + '</span>';
  }
  alturaSlider.addEventListener('input', updateAlturaDisplay);
  updateAlturaDisplay();

  unitCm.addEventListener('click', () => {
    alturaUnit = 'cm';
    unitCm.classList.add('active');
    unitPol.classList.remove('active');
    updateAlturaDisplay();
  });
  unitPol.addEventListener('click', () => {
    alturaUnit = 'pol';
    unitPol.classList.add('active');
    unitCm.classList.remove('active');
    alturaDisplay.innerHTML = alturaSlider.value + '<span class="slider-unit">pol</span>';
  });

  // PESO
  const pesoSlider = document.getElementById('slider-peso');
  const pesoDisplay = document.getElementById('peso-display');
  const unitKg = document.getElementById('unit-kg');
  const unitLb = document.getElementById('unit-lb');
  let pesoUnit = 'kg';

  function updatePesoDisplay() {
    const val = pesoSlider.value;
    state.peso = parseInt(val);
    pesoDisplay.innerHTML = val + '<span class="slider-unit">' + pesoUnit + '</span>';
  }
  pesoSlider.addEventListener('input', updatePesoDisplay);
  updatePesoDisplay();

  unitKg.addEventListener('click', () => {
    pesoUnit = 'kg';
    unitKg.classList.add('active');
    unitLb.classList.remove('active');
    updatePesoDisplay();
  });
  unitLb.addEventListener('click', () => {
    pesoUnit = 'lb';
    unitLb.classList.add('active');
    unitKg.classList.remove('active');
    pesoDisplay.innerHTML = pesoSlider.value + '<span class="slider-unit">lb</span>';
  });
}

// ═══════════════════════════════════════
// VIDEO PLACEHOLDER
// ═══════════════════════════════════════
function setupVideo() {
  const vp = document.getElementById('video-placeholder');
  if (vp) {
    vp.addEventListener('click', () => advance(26));
  }
}

// ═══════════════════════════════════════
// CAROUSEL
// ═══════════════════════════════════════
function setupCarousel() {
  const track = document.getElementById('carousel-track');
  const dots = document.querySelectorAll('.carousel-dots .dot');
  let current = 0;
  const total = dots.length;

  function goSlide(n) {
    current = n;
    track.style.transform = `translateX(-${n * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === n));
  }

  dots.forEach(d => {
    d.addEventListener('click', () => goSlide(parseInt(d.getAttribute('data-slide'))));
  });

  // Auto-advance carousel
  let carouselTimer = null;
  function startCarousel() {
    carouselTimer = setInterval(() => goSlide((current + 1) % total), 3000);
  }

  // Observe when step 26 becomes active
  const observer = new MutationObserver(() => {
    const step26 = document.querySelector('.step[data-step="26"]');
    if (step26 && step26.classList.contains('active')) {
      if (!carouselTimer) startCarousel();
    } else {
      if (carouselTimer) { clearInterval(carouselTimer); carouselTimer = null; }
    }
  });
  const step26 = document.querySelector('.step[data-step="26"]');
  if (step26) observer.observe(step26, { attributes: true, attributeFilter: ['class'] });
}

// ═══════════════════════════════════════
// CTA FINAL
// ═══════════════════════════════════════
function setupCTAFinal() {
  document.querySelectorAll('[id^="btn-cta-final"], .step[data-step="26"] .btn-primary').forEach(btn => {
    btn.addEventListener('click', () => {
      window.location.href = 'https://pay.hotmart.com/seu-link'; // substitua pelo link real
    });
  });
}

// ═══════════════════════════════════════
// CAROUSEL (step 26 – alunas)
// ═══════════════════════════════════════
function setupCarousel26() {
  const track = document.getElementById('carousel-track26');
  if (!track) return;
  const dots = document.querySelectorAll('#carousel-dots26 .dot');
  let current = 0;
  const total = dots.length;

  function goSlide(n) {
    current = n;
    track.style.transform = `translateX(-${n * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === n));
  }

  dots.forEach(d => {
    d.addEventListener('click', () => goSlide(parseInt(d.getAttribute('data-slide26'))));
  });

  // Auto-advance
  const observer = new MutationObserver(() => {
    const step26 = document.querySelector('.step[data-step="26"]');
    if (step26 && step26.classList.contains('active')) {
      setInterval(() => goSlide((current + 1) % total), 3500);
    }
  });
  const step26 = document.querySelector('.step[data-step="26"]');
  if (step26) observer.observe(step26, { attributes: true, attributeFilter: ['class'] });
}

// ═══════════════════════════════════════
// FAQ ACCORDION
// ═══════════════════════════════════════
window.toggleFaq = function(btn) {
  const answer = btn.nextElementSibling;
  const isOpen = btn.classList.contains('open');
  // Close all
  document.querySelectorAll('.faq-q.open').forEach(b => {
    b.classList.remove('open');
    b.nextElementSibling.classList.remove('open');
  });
  if (!isOpen) {
    btn.classList.add('open');
    answer.classList.add('open');
  }
};

// ═══════════════════════════════════════
// INIT
// ═══════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Show step 1
  const step1 = document.querySelector('.step[data-step="1"]');
  step1.classList.add('active');
  updateProgressBar(1);
  updateBackButton(1);

  setupSingleSelect();
  setupMultiSelect();
  setupContinueButtons();
  setupSliders();
  setupVideo();
  setupCarousel();
  setupCarousel26();
  setupCTAFinal();
});
