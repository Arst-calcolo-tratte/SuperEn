# Laboratorio Numerico — SuperEnalotto + VinciCasa

Web app statica, non ufficiale, per monitorare due esperimenti statistici.

## SuperEnalotto
- Sestina fissa: **06 · 38 · 43 · 53 · 61 · 83**
- Jolly: **80**
- La sestina resta fissa e viene solo confrontata con le nuove estrazioni.

## VinciCasa
- Cinquina fissa: **11 · 13 · 19 · 28 · 32**
- Cinquina dinamica: ricalcolata automaticamente dopo l'aggiornamento dello storico.
- Il programma valuta tutte le **658.008** combinazioni possibili con un ensemble deterministico di frequenza storica, frequenza recente, co-occorrenze e struttura.
- La cinquina dinamica è un ranking sperimentale e non implica una probabilità matematica superiore.

## Aggiornamento automatico
GitHub Actions esegue `update_draws.py` ogni 30 minuti e può essere avviato manualmente dal tab **Actions**.

Il programma:
1. aggiorna lo storico SuperEnalotto;
2. ricostruisce/aggiorna lo storico VinciCasa;
3. salva l'ultima estrazione;
4. ricalcola la proposta dinamica VinciCasa;
5. aggiorna i JSON letti dall'app;
6. committa solo se i dati sono cambiati.

Per VinciCasa il bootstrap usa gli archivi annuali pubblici per ricostruire lo storico; l'archivio ufficiale Sisal viene usato per l'aggiornamento/correzione delle estrazioni recenti.

## GitHub Pages
1. crea un repository GitHub;
2. carica tutti i file nella root;
3. Settings → Pages → Source: **GitHub Actions**;
4. il workflow `pages.yml` pubblica automaticamente la root del repository dopo ogni push su `main`.

## Nota
Il progetto è indipendente e non affiliato a Sisal. Le estrazioni regolamentari mantengono le loro probabilità matematiche; il modello serve solo per un esperimento statistico.
