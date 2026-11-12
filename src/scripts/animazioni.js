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

// 3. Immagine dell'evento: al passaggio del mouse si ingrandisce dall'angolo in alto a destra
//    fino a 380 px di larghezza (senza mai toccare i loghi). La scritta "Segui il prossimo evento"
//    segue il bordo sinistro dell'immagine e la freccia sparisce.
function ingrandisciImmagine() {
  const img = document.querySelector('[data-anima="immagine"]');
  const link = document.querySelector('.link-evento');
  const freccia = link?.querySelector('.link-evento__freccia');
  const loghi = document.querySelector('[data-striscia]');
  if (!img || !link || !freccia || !loghi) return;
  const conHover = window.matchMedia('(hover: hover) and (min-width: 769px)');
  const larghezzaFinale = 380; // px, scelta di Enrico
  const margine = 16; // spazio minimo che resta tra immagine e loghi

  const apri = () => {
    if (!conHover.matches) return;
    const top = img.getBoundingClientRect().top;
    const altezza = img.offsetHeight; // misure senza l'ingrandimento in corso
    const larghezza = img.offsetWidth;
    const limiteLoghi = (loghi.getBoundingClientRect().top - margine - top) / altezza;
    const scala = Math.max(1, Math.min(larghezzaFinale / larghezza, limiteLoghi));
    // La freccia sparisce: la scritta si sposta anche dello spazio che occupava.
    const spazioFreccia = freccia.offsetWidth + parseFloat(getComputedStyle(link).columnGap || '0');
    const d = riduci ? 0 : 0.7;
    gsap.to(img, { scale: scala, duration: d, ease: 'power3.out', overwrite: 'auto' });
    gsap.to(link, { x: -larghezza * (scala - 1) + spazioFreccia, duration: d, ease: 'power3.out', overwrite: 'auto' });
    gsap.to(freccia, { opacity: 0, x: 8, duration: d * 0.4, overwrite: 'auto' });
  };
  const chiudi = () => {
    const d = riduci ? 0 : 0.6;
    gsap.to(img, { scale: 1, duration: d, ease: 'power3.inOut', overwrite: 'auto' });
    gsap.to(link, { x: 0, duration: d, ease: 'power3.inOut', overwrite: 'auto' });
    gsap.to(freccia, { opacity: 1, x: 0, duration: d * 0.5, delay: d * 0.5, overwrite: 'auto' });
  };

  img.addEventListener('mouseenter', apri);
  img.addEventListener('mouseleave', chiudi);
}

animaHero();
avviaStriscia();
ingrandisciImmagine();
