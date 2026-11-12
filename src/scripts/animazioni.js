// Prime animazioni della homepage, con GSAP.
import { gsap } from 'gsap';

const riduci = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 1. Striscia loghi: scorre all'infinito, rallenta quando ci passi sopra col mouse.
function avviaStriscia() {
  const striscia = document.querySelector('[data-striscia]');
  const binario = document.querySelector('[data-binario]');
  const gruppo = binario?.querySelector('.striscia__gruppo');
  if (!striscia || !binario || !gruppo) return;

  const larghezza = gruppo.getBoundingClientRect().width;
  const velocita = 40; // pixel al secondo
  const giro = gsap.to(binario, {
    x: -larghezza,
    duration: larghezza / velocita,
    ease: 'none',
    repeat: -1,
  });

  if (riduci) { giro.pause(); return; }

  striscia.addEventListener('mouseenter', () => gsap.to(giro, { timeScale: 0.25, duration: 0.6 }));
  striscia.addEventListener('mouseleave', () => gsap.to(giro, { timeScale: 1, duration: 0.6 }));
}

// 2. Entrata della hero: il titolo sale riga per riga, poi testo, pulsanti e immagine.
function animaHero() {
  if (riduci) return;
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('[data-anima="titolo"] .riga > span', { yPercent: 110, duration: 1, stagger: 0.12 })
    .from('[data-anima="entra"]', { y: 24, opacity: 0, duration: 0.8, stagger: 0.12 }, '-=0.6')
    .from('[data-anima="immagine"]', { clipPath: 'inset(100% 0 0 0)', duration: 1.1, ease: 'power4.out' }, 0.2)
    .from('.clienti', { opacity: 0, duration: 0.8 }, '-=0.5');
}

animaHero();
avviaStriscia();
