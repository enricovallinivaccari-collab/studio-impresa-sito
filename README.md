# Studio Impresa · nuovo sito

Prototipo dal vivo del nuovo sito di Studio Impresa, costruito dal file Figma
"Studio Impresa Website" (pagina **Homepage**).

**Anteprima:** https://enricovallinivaccari-collab.github.io/studio-impresa-sito/

Si aggiorna da sola a ogni modifica sul ramo `main` (GitHub Actions → GitHub Pages).

## Com'è fatto

- [Astro](https://astro.build): ogni pezzo del Figma è un componente in `src/components/`
  (`Header`, `Pulsante`, `Hero`, `StrisciaLoghi`, `Divisioni`).
- Colori, font e spaziature del Figma sono in `src/styles/tokens.css`.
- Font: DM Sans (titoli), Inter (testo), Atkinson Hyperlegible Mono (menu, pulsanti, occhielli).
- Animazioni con [GSAP](https://gsap.com) in `src/scripts/animazioni.js`.
- Icone, logo e loghi clienti (SVG esportati dal Figma) sono in `public/`.

## Lavorarci in locale

```sh
npm install
npm run dev      # apre il sito su http://localhost:4321/studio-impresa-sito/
npm run build    # crea la versione pubblicabile in dist/
```
