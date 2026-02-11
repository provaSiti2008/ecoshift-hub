import https from 'https';

const projectRef = 'rhvwwgfyrzlrxtlvemsf';
const url = `https://${projectRef}.supabase.co/rest/v1/`;

console.log(`Checking project status: ${url}`);

const req = https.request(url, { method: 'HEAD' }, (res) => {
    console.log(`Status Code: ${res.statusCode}`);
    if (res.statusCode === 200 || res.statusCode === 401) {
        console.log("PROJECT IS ACTIVE.");
    } else if (res.statusCode === 503) {
        console.log("PROJECT IS PAUSED.");
    } else {
        console.log(`PROJECT STATUS UNKNOWN (Code: ${res.statusCode}).`);
    }
});

req.on('error', (e) => {
    console.error(`ERROR: ${e.message}`);
});

req.end();
