/* ============================================
   LIGHTHOUSE BEAM
   The lighthouse sits fixed in the bottom-right.
   The lamp position is calculated in viewport coords.
   As the user scrolls through sections, the beam
   sweeps from upper-left (hero) to lower-left (contact).
   ============================================ */

// Angle presets per section (degrees, standard math: 0=right, 180=left)
// All angles in the upper-left to lower-left quadrant
const BEAM_ANGLES = {
  hero:    -148,   // sweeping upper-left toward top content
  about:   -163,   // slightly above horizontal-left
  cases:   -175,   // nearly horizontal-left
  contact: -193,   // below horizontal-left, toward footer
};

const SECTIONS = ['hero', 'about', 'cases', 'contact'];

// Lighthouse SVG layout constants (relative to its viewBox 0 0 120 300)
const LH_SVG_W    = 100;  // rendered width  (px)
const LH_SVG_H    = 250;  // rendered height (px)
const LH_RIGHT    = 32;   // right offset from window edge (px)
const LH_LAMP_X   = 60 / 120; // lamp cx ratio in viewBox
const LH_LAMP_Y   = 89 / 300; // lamp cy ratio in viewBox
const BEAM_SPREAD = 22;   // half-angle of the beam cone (degrees)

let currentAngle = BEAM_ANGLES.hero;
let targetAngle  = BEAM_ANGLES.hero;
let rafId        = null;

// Get lamp position in viewport pixels
function lampPos() {
  return {
    x: window.innerWidth  - LH_RIGHT - LH_SVG_W + LH_LAMP_X * LH_SVG_W,
    y: window.innerHeight - LH_SVG_H  + LH_LAMP_Y * LH_SVG_H,
  };
}

// Draw the beam on the canvas
function drawBeam(angle) {
  const canvas = document.getElementById('beam-canvas');
  if (!canvas) return;

  const W = window.innerWidth;
  const H = window.innerHeight;
  canvas.width  = W;
  canvas.height = H;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const lp  = lampPos();
  const rad = (angle * Math.PI) / 180;
  const sp  = (BEAM_SPREAD * Math.PI) / 180;
  const len = Math.sqrt(W * W + H * H) * 1.1; // reach beyond viewport

  const cx  = lp.x + Math.cos(rad)      * len;
  const cy  = lp.y + Math.sin(rad)      * len;
  const t1x = lp.x + Math.cos(rad - sp) * len;
  const t1y = lp.y + Math.sin(rad - sp) * len;
  const t2x = lp.x + Math.cos(rad + sp) * len;
  const t2y = lp.y + Math.sin(rad + sp) * len;

  // Radial gradient from lamp outward
  const grad = ctx.createRadialGradient(lp.x, lp.y, 0, lp.x, lp.y, len * 0.7);
  grad.addColorStop(0,    'rgba(245, 215, 110, 0.22)');
  grad.addColorStop(0.35, 'rgba(245, 215, 110, 0.08)');
  grad.addColorStop(1,    'rgba(245, 215, 110, 0)');

  // Beam cone
  ctx.beginPath();
  ctx.moveTo(lp.x, lp.y);
  ctx.lineTo(t1x, t1y);
  ctx.lineTo(t2x, t2y);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Center line (subtle)
  ctx.beginPath();
  ctx.moveTo(lp.x, lp.y);
  ctx.lineTo(cx, cy);
  ctx.strokeStyle = 'rgba(245, 215, 110, 0.18)';
  ctx.lineWidth = 1;
  ctx.stroke();
}

// Smooth angle animation
function animateBeam() {
  const diff = targetAngle - currentAngle;
  if (Math.abs(diff) > 0.08) {
    currentAngle += diff * 0.055;
    drawBeam(currentAngle);
    rafId = requestAnimationFrame(animateBeam);
  } else {
    currentAngle = targetAngle;
    drawBeam(currentAngle);
    rafId = null;
  }
}

function setBeamAngle(angle) {
  targetAngle = angle;
  if (rafId) cancelAnimationFrame(rafId);
  animateBeam();
}

/* ============================================
   SECTION OBSERVER — updates beam + nav
   ============================================ */
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const id = entry.target.id;

    // Beam
    if (BEAM_ANGLES[id] !== undefined) {
      setBeamAngle(BEAM_ANGLES[id]);
    }

    // Nav active link
    document.querySelectorAll('.nav-links a').forEach((a) => {
      a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
    });
  });
}, { threshold: 0.3 });

SECTIONS.forEach((id) => {
  const el = document.getElementById(id);
  if (el) sectionObserver.observe(el);
});

/* ============================================
   SCROLL REVEAL
   ============================================ */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('vis');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

/* ============================================
   NAV SCROLL STATE
   ============================================ */
const nav = document.getElementById('main-nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 56);
}, { passive: true });

/* ============================================
   CASE CARD EXPAND / COLLAPSE
   ============================================ */
document.querySelectorAll('.case-toggle').forEach((btn) => {
  btn.addEventListener('click', () => {
    const card     = btn.closest('.case-card');
    const isOpen   = card.classList.contains('open');

    // Close all
    document.querySelectorAll('.case-card.open').forEach((c) => {
      c.classList.remove('open');
      c.querySelector('.case-toggle').setAttribute('aria-expanded', 'false');
    });

    // Open clicked (if it wasn't already open)
    if (!isOpen) {
      card.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      setTimeout(() => {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 80);
    }
  });
});

/* ============================================
   RESIZE — redraw beam & canvas size
   ============================================ */
window.addEventListener('resize', () => {
  drawBeam(currentAngle);
}, { passive: true });

/* ============================================
   INIT
   ============================================ */
function init() {
  drawBeam(currentAngle);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
