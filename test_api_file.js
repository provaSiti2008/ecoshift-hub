const fs = require('fs');

const stations = [
    { name: 'Milano Centrale', id: 'S01700' },
    { name: 'Milano Cadorna (N00001)', id: 'N00001' },
    { name: 'Milano Cadorna (S00057)', id: 'S00057' },
];

const now = new Date();
const timeParam = encodeURIComponent(now.toString());

async function test() {
    let log = '';
    const logLine = (line) => { console.log(line); log += line + '\n'; };

    logLine(`Testing ViaggiaTreno API at ${now.toString()}...`);
    for (const s of stations) {
        const url = `http://www.viaggiatreno.it/infomobilita/resteasy/viaggiatreno/partenze/${s.id}/${timeParam}`;
        try {
            const res = await fetch(url);
            if (res.ok) {
                const text = await res.text();
                try {
                    const json = JSON.parse(text);
                    const count = Array.isArray(json) ? json.length : 'Not Array';
                    logLine(`[${s.name}] Status: ${res.status}. Items: ${count}`);
                    if (count === 0) logLine(`   -> Response was empty array []`);
                } catch (e) {
                    logLine(`[${s.name}] Status: ${res.status}. Invalid JSON. Preview: ${text.substring(0, 100)}`);
                }
            } else {
                logLine(`[${s.name}] Failed. Status: ${res.status}`);
            }
        } catch (e) {
            logLine(`[${s.name}] Network Error: ${e.message}`);
        }
    }
    fs.writeFileSync('debug_api.txt', log);
}

test();
