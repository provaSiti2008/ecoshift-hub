/** ID dei driver dei viaggi demo: questi match non vengono mostrati (solo utenti reali). */
export const MOCK_DRIVER_IDS = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6'];

export const MILAN_COORDS: Record<string, [number, number]> = {
    'Campus Bovisa': [45.5031, 9.1558],
    'Bovisa': [45.5031, 9.1558],
    'Stazione Centrale': [45.4851, 9.2047],
    'Centrale': [45.4851, 9.2047],
    'Milano Centrale': [45.4851, 9.2047],
    'Piazza Leonardo': [45.4781, 9.2272],
    'Leonardo': [45.4781, 9.2272],
    'Città Studi': [45.4750, 9.2250],
    'Citta Studi': [45.4750, 9.2250],
    'Duomo': [45.4642, 9.1900],
    'Sesto San Giovanni': [45.5332, 9.2319],
    'Sesto': [45.5332, 9.2319],
    'Rho Fiera': [45.5186, 9.0494],
    'Rho': [45.5186, 9.0494],
    'San Donato': [45.4190, 9.2730],
    'Porta Genova': [45.4526, 9.1712],
    'Cadorna FN': [45.4685, 9.1764],
    'Cadorna': [45.4685, 9.1764],
    'Garibaldi FS': [45.4840, 9.1880],
    'Garibaldi': [45.4840, 9.1880],
    'Romolo': [45.4435, 9.1668],
    'Bicocca': [45.5140, 9.2120],
    'Lambrate': [45.4840, 9.2340],
    'Porta Venezia': [45.4720, 9.2040],
    'Repubblica': [45.4760, 9.2010],
    'Loreto': [45.4860, 9.2100],
    'Lampugnano': [45.5180, 9.1480],
    'Molino Dorino': [45.5080, 9.1280],
};

/** Mappa i nomi duplicati/sinonimi al nome standard */
export const LOCATION_SYNONYMS: Record<string, string> = {
    'Milano Centrale': 'Stazione Centrale',
    'Centrale': 'Stazione Centrale',
    'Cadorna FN': 'Cadorna',
    'Citta Studi': 'Città Studi',
    'Leonardo': 'Piazza Leonardo',
    'Sesto': 'Sesto San Giovanni',
    'Rho': 'Rho Fiera',
    'Bovisa': 'Campus Bovisa',
    'Garibaldi FS': 'Garibaldi',
};

/** Normalizza un nome di stazione al nome standard */
export function normalizeLocation(name: string): string {
    if (!name) return name;
    return LOCATION_SYNONYMS[name] || name;
}

/** Lista unica di stazioni per il dropdown (senza duplicati) */
export const KNOWN_LOCATIONS = Array.from(
    new Set([
        'Stazione Centrale',
        'Piazza Leonardo',
        'Città Studi',
        'Duomo',
        'Sesto San Giovanni',
        'Rho Fiera',
        'Campus Bovisa',
        'San Donato',
        'Porta Genova',
        'Cadorna',
        'Garibaldi',
        'Romolo',
        'Bicocca',
        'Lambrate',
        'Porta Venezia',
        'Repubblica',
        'Loreto',
        'Lampugnano',
        'Molino Dorino',
    ])
).sort();

/** Restituisce coordinate [lat, lng] per un luogo e un offset deterministico basato su id (per evitare sovrapposizioni). */
export function getCoordsWithOffset(locationName: string, uniqueId: string): { coords: [number, number]; label: string } {
    const fromLower = locationName.toLowerCase().trim();
    let bestMatch = 'Duomo';
    for (const k of Object.keys(MILAN_COORDS)) {
        if (k.toLowerCase() === fromLower || k.toLowerCase().includes(fromLower) || fromLower.includes(k.toLowerCase())) {
            bestMatch = k;
            break;
        }
    }
    const base = MILAN_COORDS[bestMatch] ?? [45.4642, 9.1900];
    const hash = uniqueId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const angle = (hash % 360) * (Math.PI / 180);
    // Offset leggermente aumentato per migliorare la visibilità di marker sovrapposti
    const radius = 0.00025 * (1 + (hash % 6)); 
    const offsetLat = radius * Math.cos(angle);
    const offsetLng = radius * Math.sin(angle);
    return { coords: [base[0] + offsetLat, base[1] + offsetLng], label: bestMatch };
}
