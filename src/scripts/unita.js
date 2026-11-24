// Valore in px dell'unità fluida --u (tokens.css): 1 fino a 1440 px di larghezza, poi cresce con lo schermo.
// Le misure scritte nel JS (es. 380 px) vanno moltiplicate per questo valore.
export function unita() {
  const sonda = document.createElement('div');
  sonda.style.cssText = 'position:absolute;visibility:hidden;width:calc(1000 * var(--u))';
  document.body.appendChild(sonda);
  const u = sonda.getBoundingClientRect().width / 1000;
  sonda.remove();
  return u || 1;
}
