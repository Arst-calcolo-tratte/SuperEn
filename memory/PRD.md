# PRD — Lotto Laboratorio (SuperEnalotto / VinciCasa / 10eLotto)

## Problem statement originale
App (originariamente sito statico su GitHub Pages + GitHub Actions) per i risultati del lotto italiano. Problema: l'aggiornamento automatico (`update.yml`) era disabilitato → dati fermi/errore. Richiesta: sistemare auto-update + restyling, mantenendo tutte le funzioni. Fonte: Sisal/scraping. Giochi: SuperEnalotto, VinciCasa e altri (10eLotto). Laboratorio con statistiche + generatore di schedine. Stile: a scelta dell'agente.

## Architettura (ricostruita)
- **Frontend**: React (CRA + Tailwind + shadcn), tema dark emerald. `src/App.js` + componenti in `src/components/lotto/`.
- **Backend**: FastAPI (`server.py`) + scraper (`scraper.py`) + APScheduler.
- **DB**: MongoDB (collezioni `draws`, `meta`).
- **Fonte dati**: estrazionedellotto.it (unica fonte stabile per tutti e 3 i giochi, struttura HTML prevedibile).
- **Auto-update**: scheduler cron (21:15/22:15/23:15) + trigger manuale `POST /api/update`. Scrape iniziale allo startup se DB vuoto. **Fallback**: se lo scraping fallisce, i dati buoni non vengono sovrascritti (stato `error` salvato in `meta`).

## Core requirements (statici)
- Selettore gioco (SuperEnalotto / VinciCasa / 10eLotto).
- Ultima estrazione con numeri come palline 3D + Jolly/SuperStar/Oro.
- Indicatore "Ultimo aggiornamento" + stato (ok/errore) + bottone Aggiorna con stati loading/ok/errore.
- Statistiche: numeri frequenti e ritardatari (grafici Recharts).
- Generatore schedine (strategie: casuale, frequenti, ritardatari, bilanciato).
- Archivio ultime estrazioni.

## Implementato (2026-06-11)
- ✅ Scraper 3 giochi da estrazionedellotto.it (parsing robusto).
- ✅ Endpoint: /games, /results/{game}, /stats/{game}, /status, /update, /generate.
- ✅ Scheduler + scrape iniziale + fallback anti-sovrascrittura.
- ✅ Frontend completo dark emerald, responsive, con tutti i widget e data-testid.

## Backlog / prossimi passi
- P1: Aumentare profondità storica (scrape archivi annuali) per statistiche più significative.
- P2: Export schedina come PNG/stampa coupon.
- P2: Statistiche avanzate (pari/dispari, decine, numeri gemelli).
- P2: Toggle tema chiaro/scuro.
