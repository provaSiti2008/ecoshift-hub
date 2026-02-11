# Configurazione Supabase per EcoShift Hub

Segui questi passaggi per collegare l'applicazione al tuo database Supabase.

## 1. Crea il Database su Supabase

1.  Accedi a [Supabase](https://supabase.com).
2.  Crea un nuovo progetto ("New Project").
3.  Imposta una **Password del Database** sicura (conservala, ti servirà tra poco).
4.  Attendi che il progetto sia pronto (qualche minuto).

## 2. Inizializza le Tabelle (SQL Editor)

Anche se l'app prova a creare le tabelle da sola, è meglio farlo manualmente per sicurezza.

1.  Nel menu a sinistra di Supabase, clicca su **SQL Editor**.
2.  Clicca su **New query**.
3.  Incolla tutto il contenuto del file `supabase_schema.sql` che trovi nella cartella principale del progetto.
4.  Clicca su **Run** (in basso a destra).
5.  Dovresti vedere "Success" nei risultati.

## 3. Ottieni la stringa di connessione (URI)

Supabase ha aggiornato la sua interfaccia. Il modo più veloce per trovare l'URI è:

1.  In alto a destra nella dashboard del progetto, clicca sul pulsante verde **Connect**.
2.  Si aprirà una finestra: clicca su **ORM** (o seleziona **Node.js**).
3.  Cerca la voce **Connection string** e assicurati che sia selezionato **URI**.
4.  Copia la stringa (inizia con `postgresql://`).

**Oppure (Metodo classico):**
1.  Vai su **Settings** (icona ingranaggio in basso a sinistra) -> **Database**.
2.  Scorri fino a **Connection string** e scegli **URI**.*

## 4. Configura l'Applicazione

1.  Apri la cartella `server` del progetto.
2.  Crea un file chiamato `.env` (se non esiste già).
3.  Aggiungi questa riga, incollando il tuo URL:

    ```env
    # Sostituisci [YOUR-PASSWORD] con la password scelta al passo 1
    SUPABASE_DATABASE_URL=postgresql://postgres.xxxx:laTuaPassword@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
    ```

4.  Assicurati di aver sostituito `[YOUR-PASSWORD]` con la tua password reale!

## 5. Avvia il Server

1.  Riavvia il server backend:
    ```bash
    npm stop  # se è in esecuzione
    npm start # dalla cartella principale
    ```
2.  Controlla il terminale. Dovresti vedere scritto:
    `Connected to PostgreSQL database.`

**Fatto!** Ora tutti i dati (utenti, viaggi, chat) verranno salvati su Supabase invece che nel file locale `ecoshift.db`.
