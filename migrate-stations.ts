import { db } from './db';
import { normalizeLocation } from './constants';

/**
 * Script di migrazione per normalizzare i nomi delle stazioni
 * Converte i nomi duplicati (es. "Centrale", "Milano Centrale") in nomi standard ("Stazione Centrale")
 */
export async function migrateStationNames(): Promise<number> {
    console.log('[Migrazione] Avvio normalizzazione nomi stazioni...');
    
    const trips = await db.getTrips();
    let updatedCount = 0;
    
    for (const trip of trips) {
        const normalizedFrom = normalizeLocation(trip.from);
        const normalizedTo = normalizeLocation(trip.to);
        
        // Aggiorna solo se necessario
        if (normalizedFrom !== trip.from || normalizedTo !== trip.to) {
            await db.updateTrip(trip.id, {
                from: normalizedFrom,
                to: normalizedTo
            });
            console.log(`[Migrazione] Aggiornato viaggio ${trip.id}: "${trip.from}" → "${normalizedFrom}", "${trip.to}" → "${normalizedTo}"`);
            updatedCount++;
        }
    }
    
    console.log(`[Migrazione] Completata! ${updatedCount} viaggi aggiornati.`);
    return updatedCount;
}

/**
 * Verifica se la migrazione è già stata eseguita
 */
export function isMigrationDone(): boolean {
    return localStorage.getItem('ecoshift_migration_v1') === 'true';
}

/**
 * Marca la migrazione come completata
 */
export function markMigrationDone(): void {
    localStorage.setItem('ecoshift_migration_v1', 'true');
}