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

// 4. Sezione Divisioni, come la pila di griffin.com (studiata dal vivo il 13/11):
//    - all'inizio la pila è compatta, centrata e tutta colorata; a sinistra c'è l'introduzione
//      e l'elenco delle divisioni in fondo;
//    - scorrendo la pila si apre (i piani sotto scendono e diventano neutri) e la "telecamera" scende di piano
//      in piano: il piano attivo sta al centro, colorato, ed escono le sue descrizioni; quelli già visti salgono in alto, i prossimi restano sotto;
//    - a sinistra le divisioni viste salgono in alto, l'attiva sta al centro col titolo grande, le prossime in basso,
//      e una linea si riempie col colore della divisione.
//    La pila segue lo scroll (scrub, va anche all'indietro); il testo a sinistra si sposta con un'animazione morbida.
function animaDivisioni() {
  const sezione = document.querySelector('[data-divisioni]');
  if (!sezione) return;
  const testo = sezione.querySelector('.divisioni__testo');
  const intro = sezione.querySelector('.divisioni__intestazione');
  const elenco = sezione.querySelector('.passi');
  const avanzamento = sezione.querySelector('[data-avanzamento]');
  const passi = [...sezione.querySelectorAll('[data-passo]')];
  const lastre = [...sezione.querySelectorAll('[data-lastra]')].sort((a, b) => a.dataset.lastra - b.dataset.lastra);
  const corpi = lastre.map((l) => l.querySelector('.lastra__corpo'));
  const note = lastre.map((l) => l.querySelector('.note'));
  const yDisegno = lastre.map((l) => Number(l.dataset.y));
  const n = lastre.length;

  // ---- Pila (unità del disegno 720×740; y = angolo alto del piano) ----
  const SCHIACCIATA = 106;  // pila iniziale: centrata nel pannello, tutta colorata
  const PASSO_STRETTO = 74;
  const CENTRO = 236;       // dove sta il piano attivo
  const APERTA = 250;       // distanza tra i piani quando la pila è aperta
  const aperta = (i, k) => CENTRO + (i - k) * APERTA;

  // Tempi in "vh di scroll": 100 per entrare, 70 di introduzione ferma (descrizione + pila schiacciata),
  // 80 per divisione, 20 di coda. Deve tornare con l'altezza della sezione in Divisioni.astro.
  const ENTRATA = 100;
  const INTRO = 70;
  const PER_DIVISIONE = 80;
  const TOTALE = ENTRATA + INTRO + n * PER_DIVISIONE + 20;
  const inizio = (k) => ENTRATA + INTRO + k * PER_DIVISIONE;
  const MOSSA = 45; // durata del movimento tra un piano e l'altro

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
  tl.set({}, {}, TOTALE);
  corpi.forEach((c, i) => tl.fromTo(c, { y: 0 }, { y: SCHIACCIATA + i * PASSO_STRETTO - yDisegno[i], duration: 90 }, 0));
  for (let k = 0; k < n; k++) {
    const t = inizio(k);
    corpi.forEach((c, i) => tl.to(c, { y: aperta(i, k) - yDisegno[i], duration: MOSSA }, t));
    if (k > 0) tl.to(note[k - 1], { opacity: 0, duration: 10 }, t);
    tl.fromTo(note[k], { opacity: 0 }, { opacity: 1, duration: 14, ease: 'none' }, t + MOSSA - 12);
  }

  // ---- Colonna testo ----
  const desktop = window.matchMedia('(min-width: 769px)');
  if (desktop.matches) testo.setAttribute('data-pronto', '');
  const RIGA = 28; // altezza di una voce chiusa
  const posiziona = (k, subito) => {
    if (!desktop.matches) return;
    const alto = elenco.clientHeight;
    const d = subito || riduci ? 0 : 0.7;
    passi.forEach((p, i) => {
      let y;
      if (k < 0) y = alto - (n - i) * RIGA;            // introduzione: tutte in fondo
      else if (i < k) y = i * RIGA;                     // già viste: in alto
      else if (i === k) y = alto * 0.36;                // attiva: al centro
      else y = alto - (n - i) * RIGA;                   // prossime: in fondo
      gsap.to(p, { y, duration: d, ease: 'power3.inOut', overwrite: 'auto' });
    });
    gsap.to(intro, { autoAlpha: k < 0 ? 1 : 0, yPercent: k < 0 ? -60 : -90, duration: d, ease: 'power2.out', overwrite: 'auto' });
    if (avanzamento) {
      gsap.to(avanzamento, {
        scaleY: k < 0 ? 0 : (k * RIGA + alto * 0.36 + 10) / alto,
        backgroundColor: k < 0 ? '#4f8fcc' : passi[k].dataset.colore,
        duration: d, ease: 'power3.inOut', overwrite: 'auto',
      });
    }
  };

  let attivo = null;
  const attiva = (i) => {
    if (i === attivo) return;
    attivo = i;
    passi.forEach((p, k) => {
      const si = desktop.matches ? k === i : k === Math.max(i, 0);
      p.classList.toggle('is-attivo', si);
      p.querySelector('[data-vai]')?.setAttribute('aria-expanded', String(si));
    });
    // Nell'introduzione tutti i piani hanno i loro colori; poi solo quello attivo, gli altri neutri.
    lastre.forEach((l, k) => l.classList.toggle('is-attiva', i < 0 || k === i));
    sezione.toggleAttribute('data-in-corso', i >= 0);
    posiziona(i);
  };
  const indiceDa = (tempo) => (tempo < inizio(0) + MOSSA / 2 ? -1 : Math.min(n - 1, Math.floor((tempo - inizio(0) - MOSSA / 2) / PER_DIVISIONE)));

  ScrollTrigger.create({
    trigger: sezione,
    start: 'top bottom',
    end: 'bottom bottom',
    scrub: riduci ? true : 0.8,
    animation: tl,
  });
  tl.eventCallback('onUpdate', () => attiva(indiceDa(tl.time())));
  attiva(-1);
  posiziona(-1, true);
  window.addEventListener('resize', () => posiziona(attivo, true));

  // Clic su una divisione: scorre fino al momento in cui è al centro con le descrizioni.
  passi.forEach((p, i) => {
    p.querySelector('[data-vai]')?.addEventListener('click', () => {
      const partenza = sezione.getBoundingClientRect().top + window.scrollY - window.innerHeight;
      const tempo = inizio(i) + MOSSA + 15;
      window.scrollTo({ top: partenza + (tempo / TOTALE) * sezione.offsetHeight, behavior: riduci ? 'auto' : 'smooth' });
    });
  });
}

animaHero();
avviaStriscia();
ingrandisciImmagine();
animaDivisioni();
