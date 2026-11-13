// Prime animazioni della homepage, con GSAP.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

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

// 4. Sezione Divisioni (come la sezione a passi di Griffin): la sezione resta ferma mentre scorri,
//    la lista passa da 01 Tax a 05 ETS e nella pila si alza e si colora il piano della divisione attiva.
function animaDivisioni() {
  const sezione = document.querySelector('[data-divisioni]');
  if (!sezione) return;
  const fermo = sezione.querySelector('.divisioni__fermo');
  const passi = [...sezione.querySelectorAll('[data-passo]')];
  const lastre = [...sezione.querySelectorAll('[data-lastra]')];
  const n = passi.length;
  let attivo = 0;

  const attiva = (i) => {
    if (i === attivo) return;
    attivo = i;
    passi.forEach((p, k) => {
      p.classList.toggle('is-attivo', k === i);
      p.querySelector('[data-vai]')?.setAttribute('aria-expanded', String(k === i));
    });
    lastre.forEach((l) => l.classList.toggle('is-attiva', Number(l.dataset.lastra) === i));
  };

  const altoHeader = () => fermo.getBoundingClientRect().top <= 0 ? 0 : parseFloat(getComputedStyle(fermo).top) || 0;

  ScrollTrigger.create({
    trigger: sezione,
    start: () => `top top+=${altoHeader()}`,
    end: 'bottom bottom',
    invalidateOnRefresh: true,
    onUpdate: (self) => attiva(Math.min(n - 1, Math.floor(self.progress * n))),
  });

  // Clic su una divisione: scorre fino al suo tratto.
  passi.forEach((p, i) => {
    p.querySelector('[data-vai]')?.addEventListener('click', () => {
      const inizio = sezione.getBoundingClientRect().top + window.scrollY - altoHeader();
      const corsa = sezione.offsetHeight - fermo.offsetHeight;
      window.scrollTo({ top: inizio + ((i + 0.5) / n) * corsa, behavior: riduci ? 'auto' : 'smooth' });
    });
  });

  // Entrata: i piani arrivano dall'alto uno alla volta, dal basso verso l'alto, e si impilano.
  if (!riduci) {
    gsap.from(sezione.querySelectorAll('.lastra'), {
      y: -60,
      opacity: 0,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.12,
      scrollTrigger: { trigger: sezione, start: 'top 65%', once: true },
    });
  }
}

animaHero();
avviaStriscia();
ingrandisciImmagine();
animaDivisioni();
