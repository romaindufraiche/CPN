# Cergy Pontoise Natation — refonte du site

Site vitrine statique (HTML / CSS / JS), sans étape de build.

- `index.html` — page d'accueil (intro animée, club, activités, parcours, meeting, piscines, inscriptions, bénévolat, partenaires)
- `charte.html` — charte graphique (couleurs, typographie, logo, composants, mouvement)
- `assets/css/style.css` — styles et tokens de la charte
- `assets/js/main.js` — motion design : GSAP + ScrollTrigger, scroll fluide Lenis

## Lancer en local

```bash
python3 -m http.server 8000
```

Puis ouvrir http://localhost:8000.

Les animations sont désactivées automatiquement si l'utilisateur a choisi « réduire les animations » ou si les bibliothèques ne se chargent pas : le contenu reste entièrement lisible.
