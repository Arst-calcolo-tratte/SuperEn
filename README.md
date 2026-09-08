# Sestina Fissa — SuperEnalotto

Web app statica, non ufficiale, per monitorare una combinazione fissa scelta tramite il progetto statistico sperimentale.

## Sestina in osservazione

**06 · 38 · 43 · 53 · 61 · 83**  
**Jolly: 80**

La combinazione è intenzionalmente hard-coded nell'interfaccia e non viene modificata dall'aggiornamento automatico dell'archivio.

## Aggiornamento automatico

GitHub Actions esegue `update_draws.py` ogni 30 minuti e aggiorna `data/draws.json` leggendo l'archivio pubblico ufficiale. È anche disponibile l'avvio manuale dal tab **Actions**.

Per pubblicare con GitHub Pages:

1. crea un repository GitHub;
2. carica tutti i file di questa cartella nella root;
3. vai in **Settings → Pages**;
4. scegli **Deploy from a branch**, branch `main`, cartella `/ (root)`;
5. salva.

Non serve backend: la pagina legge `data/draws.json` direttamente dal repository.

## Nota metodologica

Il ranking è sperimentale e non dimostra che la combinazione abbia una probabilità matematica superiore alle altre. L'app serve a monitorare in modo trasparente l'esperimento e non è affiliata ufficialmente a SuperEnalotto.
