# Guida al Deployment su Vercel

Questa guida spiega come distribuire l'intero progetto EcoShift Hub su Vercel, inclusi il frontend Vite, il backend Express e il database.

## 1. Preparazione Repository
Assicurati che il tuo codice sia caricato su un repository GitHub (o GitLab/Bitbucket). Vercel si collegherà direttamente al repository per automatizzare i futuri aggiornamenti.

## 2. Creazione Progetto su Vercel
1. Vai su [Vercel Dashboard](https://vercel.com/dashboard).
2. Clicca su **Add New...** -> **Project**.
3. Importa il tuo repository `ecoshift-hub`.
4. Nelle impostazioni di Build & Development, Vercel dovrebbe rilevare automaticamente **Vite**.

## 3. Configurazione Variabili d'Ambiente
Prima di cliccare su "Deploy", vai nella sezione **Environment Variables** e aggiungi le seguenti:

- `GEMINI_API_KEY`: Inserisci la tua chiave API di Google Gemini (necessaria per il calcolo CO2 e suggerimenti AI).
- `POSTGRES_URL`: (Opzionale per il primo deploy) Vedi sezione Database sotto.

## 4. Configurazione Database (Postgres)
L'app è configurata per passare automaticamente da SQLite a Postgres quando rileva la variabile `POSTGRES_URL`.

1. Nel dashboard del progetto su Vercel, clicca sul tab **Storage**.
2. Clicca su **Connect Database** e scegli **Vercel Postgres**.
3. Segui i passaggi per creare il database.
4. Una volta creato, Vercel aggiungerà automaticamente `POSTGRES_URL` e altre variabili al tuo progetto.
5. **Riesegui il Deploy**: Se il primo deploy è fallito per mancanza di DB, vai su "Deployments", clicca sui puntini e scegli "Redeploy".

## 5. Come Funziona il Backend?
Il file `vercel.json` nella root del progetto gestisce il routing:
- Tutte le chiamate a `/api/*` vengono reindirizzate a `server/server.js`.
- Vercel esegue il backend come **Serverless Functions**.

## Pre-deployment Checklist
- [ ] Hai aggiunto `GEMINI_API_KEY` nelle Environment Variables?
- [ ] Hai creato lo Storage Postgres su Vercel?
- [ ] Tutti i file (incluso `vercel.json`) sono nel repository?

## Risoluzione Problemi
- **Mappa non visibile**: Assicurati di non avere errori 404/500 nelle chiamate API nel browser (F12 -> Network).
- **Errori Database**: Controlla i "Function Logs" nel dashboard di Vercel per errori relativi alla connessione Postgres.

