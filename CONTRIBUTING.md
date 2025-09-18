# Contribuție

## Flux Git

- Lucrează pe ramuri din main. Un feature per ramură.
- Deschide PR mic. Cere review înainte de merge.
- Rebase peste main dacă e nevoie. Fără merge commits inutile.

## Conventional Commits

- feat: pentru funcții noi
- fix: pentru buguri
- docs: pentru documentație
- chore: pentru întreținere
- ci: pentru workflow-uri

### Exemple

- feat(home): adaugă filtre accesibilitate
- fix(generator): corectează calcul durata pentru OSRM down

## Calitate

- Lint fără avertismente. Rulează npm run lint.
- Typecheck fără erori. Rulează npm run typecheck.
- Fără console.log în producție.
- Linii până la 100 caractere. Importuri ordonate. Fără variabile nefolosite.

## PR

- Descriere clară. Ce schimbă și de ce.
- Include pași de test.
- Leagă issue-urile relevante.
- CI trebuie să fie verde.

## Testare

- Adaugă teste la generator. Acoperă buget, durată, orar, accesibilitate, diversitate.

## Permisiuni și date

- Nu adăuga chei secrete. .env rămâne local.
- Nu urca date personale.

## Cum rulezi local

- npm install
- npm start
