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

// 4. Sezione Divisioni, come la pila di Griffin. Tutto segue lo scroll (scrub), quindi va avanti e indietro:
//    - arrivando, i cinque piani si schiacciano uno sull'altro e l'ultimo si nasconde un po' in basso;
//    - poi sale il primo piano (Tax), si colora ed escono le sue descrizioni;
//    - scorrendo, il piano attivo vola su e lascia vedere il successivo, con le sue descrizioni, fino a ETS.
//    La sezione resta ferma mentre succede tutto; a sinistra si apre il testo della divisione attiva.
function animaDivisioni() {
  const sezione = document.querySelector('[data-divisioni]');
  if (!sezione) return;
  const passi = [...sezione.querySelectorAll('[data-passo]')];
  const lastre = [...sezione.querySelectorAll('[data-lastra]')].sort((a, b) => a.dataset.lastra - b.dataset.lastra);
  const corpi = lastre.map((l) => l.querySelector('.lastra__corpo'));
  const note = lastre.map((l) => l.querySelector('.note'));
  const yDisegno = lastre.map((l) => Number(l.dataset.y));
  const n = lastre.length;

  // Posizioni (in unità del disegno, 720×740): y dell'angolo alto di ogni piano.
  const SCHIACCIATA = 430;   // dove sta la pila schiacciata
  const PASSO_STRETTO = 34;  // distanza tra i piani schiacciati
  const IN_ALTO = 110;       // dove sale il piano attivo
  const VIA = -420;          // dove vola il piano già visto
  const schiacciata = (i, primo) => SCHIACCIATA + (i - primo) * PASSO_STRETTO;

  // Tempi della timeline in "vh di scroll": 100 per entrare nello schermo, poi 70 per divisione.
  const ENTRATA = 100;
  const PER_DIVISIONE = 80;
  const TOTALE = ENTRATA + n * PER_DIVISIONE;
  const inizioDivisione = (k) => ENTRATA + k * PER_DIVISIONE;

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
  tl.set({}, {}, TOTALE); // la timeline dura quanto tutta la sezione

  // Arrivo: dalla pila aperta del disegno alla pila schiacciata.
  corpi.forEach((c, i) => tl.fromTo(c, { y: 0 }, { y: schiacciata(i, 0) - yDisegno[i], duration: 70 }, 0));

  for (let k = 0; k < n; k++) {
    const t = inizioDivisione(k);
    // Il piano attivo sale in alto...
    tl.to(corpi[k], { y: IN_ALTO - yDisegno[k], duration: 40 }, t);
    // ...quello prima vola via verso l'alto, e le sue descrizioni spariscono.
    if (k > 0) {
      tl.to(corpi[k - 1], { y: VIA - yDisegno[k - 1], opacity: 0, duration: 40, ease: 'power2.in' }, t);
      tl.to(note[k - 1], { opacity: 0, duration: 10 }, t);
    }
    // Gli altri sotto risalgono di un posto nella pila schiacciata.
    for (let j = k + 1; j < n; j++) tl.to(corpi[j], { y: schiacciata(j, k + 1) - yDisegno[j], duration: 40 }, t);
    // Escono le descrizioni del piano attivo.
    tl.fromTo(note[k], { opacity: 0 }, { opacity: 1, duration: 14, ease: 'none' }, t + 26);
  }

  // Divisione attiva (colori del piano e testo a sinistra) a metà della sua salita.
  let attivo = null;
  const attiva = (i) => {
    if (i === attivo) return;
    attivo = i;
    passi.forEach((p, k) => {
      const si = k === Math.max(i, 0);
      p.classList.toggle('is-attivo', si);
      p.querySelector('[data-vai]')?.setAttribute('aria-expanded', String(si));
    });
    lastre.forEach((l, k) => l.classList.toggle('is-attiva', k === i));
  };
  const indiceDa = (tempo) => Math.min(n - 1, Math.floor((tempo - ENTRATA - 20) / PER_DIVISIONE));

  ScrollTrigger.create({
    trigger: sezione,
    start: 'top bottom',
    end: 'bottom bottom',
    scrub: riduci ? true : 0.8, // un po' di ritardo rende il movimento più morbido
    animation: tl,
  });
  // Si legge il tempo della timeline (non dello scroll), così i colori seguono il movimento morbido.
  tl.eventCallback('onUpdate', () => {
    const tempo = tl.time();
    attiva(tempo < ENTRATA + 20 ? -1 : indiceDa(tempo));
  });

  // Clic su una divisione: scorre fino al momento in cui è in alto con le descrizioni.
  passi.forEach((p, i) => {
    p.querySelector('[data-vai]')?.addEventListener('click', () => {
      const inizio = sezione.getBoundingClientRect().top + window.scrollY - window.innerHeight;
      const tempo = inizioDivisione(i) + 60;
      window.scrollTo({ top: inizio + (tempo / TOTALE) * sezione.offsetHeight, behavior: riduci ? 'auto' : 'smooth' });
    });
  });
}

animaHero();
avviaStriscia();
ingrandisciImmagine();
animaDivisioni();
