// Native fetch is available in Node 18+
// IDs to test
const stations = [
    { name: 'Milano Centrale (Control)', id: 'S01700' },
    { name: 'Milano Cadorna (N00001)', id: 'N00001' },
    { name: 'Milano Cadorna (S00057)', id: 'S00057' },
];

const now = new Date();
const timeParam = encodeURIComponent(now.toString());

async function test() {
    console.log(`Testing ViaggiaTreno API at ${now.toString()}...`);
    for (const s of stations) {
        const url = `http://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/partenze/${s.id}/${timeParam}`;
        try {
            const res = await fetch(url);
            if (res.ok) {
                const text = await res.text();
                try {
                    const json = JSON.parse(text);
                    console.log(`[${s.name}] Status: ${res.status}. Items: ${Array.isArray(json) ? json.length : 'Not Array'}`);
                } catch (e) {
                    console.log(`[${s.name}] Status: ${res.status}. Invalid JSON (Preview: ${text.substring(0, 30)}...)`);
                }
            } else {
                console.log(`[${s.name}] Failed. Status: ${res.status}`);
            }
        } catch (e) {
            console.log(`[${s.name}] Network Error: ${e.message}`);
        }
    }
}

test();
