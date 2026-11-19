// ============================================================
// Servidor estático para probar el juego en el móvil (misma WiFi)
// Uso:  node servidor.js
// Luego abre en el móvil la URL que imprime (p.ej. http://192.168.1.35:8000)
// ============================================================
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = __dirname;
const PORT = process.env.PORT || 8000;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
};

function listarIPs() {
    const ifs = os.networkInterfaces();
    const ips = [];
    for (const nombre of Object.keys(ifs)) {
        for (const i of ifs[nombre]) {
            if (i.family === 'IPv4' && !i.internal) ips.push(i.address);
        }
    }
    return ips;
}

const server = http.createServer((req, res) => {
    let url = decodeURIComponent(req.url.split('?')[0]);
    if (url === '/') url = '/index.html';

    // Evitar path traversal
    const filePath = path.normalize(path.join(ROOT, url));
    if (!filePath.startsWith(ROOT)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 - No encontrado');
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('============================================================');
    console.log('  Pokémon TFT - servidor local activo');
    console.log('  Abre esta URL en el MÓVIL (misma WiFi):');
    for (const ip of listarIPs()) {
        console.log(`    → http://${ip}:${PORT}`);
    }
    console.log(`  En este PC: http://localhost:${PORT}`);
    console.log('============================================================');
    console.log('  Para parar: Ctrl + C');
});
