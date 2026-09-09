# Laboratorio Numerico — SuperEnalotto + VinciCasa

Web app statica, non ufficiale, per monitorare due esperimenti statistici in parallelo:
un gruppo di controllo (SuperEnalotto, combinazione sempre fissa) e un gruppo
sperimentale (VinciCasa, combinazione fissa + modello ricalcolato a ogni estrazione).

## SuperEnalotto — gruppo di controllo
- Sestina fissa: **06 · 38 · 43 · 53 · 61 · 83**
- Jolly abbinato: **80**
- La sestina resta fissa per costruzione e viene solo confrontata con le nuove estrazioni.

## VinciCasa — gruppo sperimentale
- Cinquina fissa: **11 · 13 · 19 · 28 · 32**
- Cinquina dinamica: ricalcolata automaticamente dopo l'aggiornamento dello storico.
- Il programma valuta tutte le **658.008** combinazioni possibili con un ensemble
  deterministico di frequenza storica, frequenza recente, co-occorrenze e struttura.
- La cinquina dinamica è un ranking sperimentale e non implica una probabilità
  matematica superiore: ogni cinquina resta equiprobabile.

## Aggiornamento automatico
GitHub Actions esegue `update_draws.py` ogni 3 ore e può essere avviato manualmente
in qualsiasi momento dal tab **Actions** del repository, oppure dal pulsante
**"Ricalcola ora"** in alto nell'app (visibile quando la pagina è pubblicata su
GitHub Pages: apre direttamente la pagina del workflow, pronta per l'avvio manuale).

Il programma:
1. aggiorna lo storico SuperEnalotto, fondendo i nuovi dati con quelli esistenti
   per **data di estrazione** (chiave stabile: il numero di concorso da solo non
   basta, perché riparte da 1 ogni anno ed è assente in gran parte dello storico);
2. ricostruisce/aggiorna lo storico VinciCasa — il bootstrap completo degli anni
   passati avviene una sola volta e resta memorizzato (`historyComplete`), così
   dopo il primo completamento ogni run interroga solo l'anno corrente, il
   precedente e la fonte ufficiale, invece di riscaricare tredici anni ogni volta;
3. salva l'ultima estrazione di entrambe le lotterie;
4. ricalcola la proposta dinamica VinciCasa;
5. aggiorna i JSON letti dall'app, registrando anche l'esito del tentativo
   (`lastAttemptAt`, `lastError`): se una fonte non risponde, l'archivio
   precedente non viene mai sovrascritto con dati vuoti o incompleti, e l'app
   mostra un avviso invece di dati silenziosamente non aggiornati;
6. committa solo se i dati sono effettivamente cambiati.

Per VinciCasa il bootstrap usa gli archivi annuali pubblici per ricostruire lo
storico; l'archivio ufficiale Sisal viene usato per l'aggiornamento/correzione
delle estrazioni recenti.

## GitHub Pages
1. crea un repository GitHub;
2. carica tutti i file nella root;
3. Settings → Pages → Source: **GitHub Actions**;
4. il workflow `pages.yml` pubblica la root del repository dopo ogni push su
   `main` **e** al termine di ogni esecuzione del workflow di aggiornamento
   (i push fatti dalle Actions con il token di default non riattivano da soli
   un trigger `push` su un altro workflow: senza questo secondo trigger la
   pagina pubblicata resterebbe ferma ai dati del primo deploy).

## Nota
Il progetto è indipendente e non affiliato a Sisal. Le estrazioni regolamentari
mantengono le loro probabilità matematiche; il modello serve solo per un
esperimento statistico.
