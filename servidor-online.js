// ============================================================
// SERVIDOR ONLINE (prototipo) - sin dependencias
// Sirve el juego + gestiona salas (2 jugadores) por SSE + POST.
// Uso:  node servidor-online.js   (PORT=xxxx opcional)
// ============================================================
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 8000;

const MIME = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.json': 'application/json',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
    '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
    '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf'
};

const rooms = new Map();
function getRoom(code) {
    code = String(code || '').toUpperCase();
    if (!rooms.has(code)) rooms.set(code, { players: {}, clients: new Set(), seed: null, started: false, results: {}, round: 1, phase: 'prep', done: {} });
    return rooms.get(code);
}
function roomState(room) {
    return {
        players: Object.entries(room.players).map(([pid, p]) => ({
            pid, name: p.name, avatar: p.avatar || null,
            hp: (typeof p.hp === 'number' ? p.hp : null),
            nivel: (typeof p.nivel === 'number' ? p.nivel : null),
            racha: (typeof p.racha === 'number' ? p.racha : null),
            oro: (typeof p.oro === 'number' ? p.oro : null),
            ready: !!p.ready, board: p.board || null
        })),
        started: room.started, seed: room.seed, results: room.results
    };
}
function send(res, obj, code) {
    try { res.writeHead(code || 200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); res.end(JSON.stringify(obj)); }
    catch (e) { try { res.end(); } catch (_) { } }
}
function broadcast(room, obj) {
    const payload = `data: ${JSON.stringify(obj)}\n\n`;
    for (const client of room.clients) { try { client.write(payload); } catch (e) { } }
}
function readBody(req, cb) {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 2e6) req.destroy(); });
    req.on('end', () => { try { cb(JSON.parse(data || '{}')); } catch (e) { cb({}); } });
}
function serveStatic(req, res, pathname) {
    let rel = decodeURIComponent(pathname);
    if (rel === '/') rel = '/index.html';
    if (rel === '/online' || rel === '/online/') rel = '/online.html';
    const fp = path.normalize(path.join(ROOT, rel));
    if (!fp.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
    fs.readFile(fp, (err, buf) => {
        if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('404'); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store, no-cache, must-revalidate' });
        res.end(buf);
    });
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    const p = url.pathname;

    // -------- SSE: canal de eventos de la sala --------
    if (p === '/api/events') {
        const code = url.searchParams.get('room');
        const pid = url.searchParams.get('pid');
        if (!code || !pid) { res.writeHead(400); res.end('room/pid required'); return; }
        const room = getRoom(code);
        res.writeHead(200, {
            'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache',
            'Connection': 'keep-alive', 'Access-Control-Allow-Origin': '*'
        });
        res.write(': connected\n\n');
        room.clients.add(res);
        res.write(`data: ${JSON.stringify({ type: 'state', ...roomState(room) })}\n\n`);
        const ping = setInterval(() => { try { res.write(': ping\n\n'); } catch (e) { } }, 15000);
        req.on('close', () => { clearInterval(ping); room.clients.delete(res); });
        return;
    }

    // -------- POST: unirse --------
    if (p === '/api/join' && req.method === 'POST') {
        readBody(req, body => {
            const room = getRoom(body.room);
            const pid = String(body.pid || '');
            if (!pid) { send(res, { ok: false, error: 'pid' }, 400); return; }
            if (!room.players[pid] && Object.keys(room.players).length >= 2) {
                send(res, { ok: false, error: 'sala llena (2 jugadores)' }, 409);
                return;
            }
            // 🆕 Al entrar (si no hay combate en curso) reiniciar el marcador de la partida
            if (room.phase !== 'combat') {
                room.round = 1;
                room.phase = 'prep';
                room.done = {};
                room.matchHp = {};
                room._won = {};
                Object.values(room.players).forEach(pl => { pl.ready = false; });
            }
            if (!room.players[pid]) room.players[pid] = { name: body.name || 'Jugador', ready: false, team: null };
            else if (body.name) room.players[pid].name = body.name;
            broadcast(room, { type: 'state', ...roomState(room) });
            send(res, { ok: true, room: String(body.room || '').toUpperCase(), ...roomState(room) });
        });
        return;
    }

    // -------- POST: listo (ambos listos -> resolver ronda) --------
    if (p === '/api/ready' && req.method === 'POST') {
        readBody(req, body => {
            const room = getRoom(body.room);
            const pid = String(body.pid || '');
            if (!room.players[pid]) { send(res, { ok: false, error: 'no join' }, 400); return; }
            if (Array.isArray(body.team)) room.players[pid].board = body.team;
            room.players[pid].ready = true;
            broadcast(room, { type: 'state', ...roomState(room) });
            const pids = Object.keys(room.players);
            if (pids.length >= 2 && pids.every(x => room.players[x].ready) && room.phase === 'prep') {
                room.phase = 'combat';
                const r = room.round || 1;
                const pve = (r === 1 || (r >= 6 && (r - 6) % 6 === 0));
                room._roundType = pve ? 'pve' : 'pvp';
                const boards = {}; pids.forEach(x => boards[x] = room.players[x].board || []);
                broadcast(room, { type: 'resolve', round: r, roundType: pve ? 'pve' : 'pvp', boards, players: pids });
            }
            send(res, { ok: true });
        });
        return;
    }

    // -------- POST: fin de ronda (ambos reportan -> siguiente ronda o fin) --------
    if (p === '/api/roundEnd' && req.method === 'POST') {
        readBody(req, body => {
            const room = getRoom(body.room);
            const pid = String(body.pid || '');
            if (!room.players[pid]) { send(res, { ok: false }, 400); return; }
            if (typeof body.hp === 'number') room.players[pid].hp = body.hp;
            room.done = room.done || {}; room.done[pid] = true;
            room._won = room._won || {}; room._won[pid] = (body.won === true);
            const pids = Object.keys(room.players);
            if (pids.length >= 2 && pids.every(x => room.done[x]) && room.phase === 'combat') {
                room.done = {};
                room.matchHp = room.matchHp || {};
                // HP = la que reporta cada cliente (el juego YA aplicó el daño; no restar otra vez)
                pids.forEach(x => {
                    const rep = (typeof room.players[x].hp === 'number') ? room.players[x].hp : room.matchHp[x];
                    room.matchHp[x] = (typeof rep === 'number') ? rep : 50;
                });
                room._won = {};
                const hpArr = pids.map(x => ({ pid: x, hp: room.matchHp[x] }));
                const dead = pids.filter(x => room.matchHp[x] <= 0);
                if (dead.length >= 1) {
                    room.phase = 'ended';
                    const win = (dead.length === 1) ? pids.find(x => x !== dead[0]) : null;
                    broadcast(room, { type: 'matchEnd', winner: win, players: pids, hp: hpArr });
                } else {
                    room.round = (room.round || 1) + 1;
                    room.phase = 'prep';
                    pids.forEach(x => { room.players[x].ready = false; room.players[x].hp = room.matchHp[x]; });
                    broadcast(room, { type: 'nextRound', round: room.round, hp: hpArr });
                }
            }
            send(res, { ok: true });
        });
        return;
    }

    // -------- POST: sincronizar tablero/HP/identidad --------
    if (p === '/api/board' && req.method === 'POST') {
        readBody(req, body => {
            const room = getRoom(body.room);
            const pid = String(body.pid || '');
            if (!pid) { send(res, { ok: false, error: 'pid' }, 400); return; }
            if (!room.players[pid]) room.players[pid] = { name: body.name || 'Jugador', ready: false, team: null };
            const pl = room.players[pid];
            if (body.name) pl.name = body.name;
            if (body.avatar) pl.avatar = body.avatar;
            if (typeof body.hp === 'number') pl.hp = body.hp;
            if (typeof body.nivel === 'number') pl.nivel = body.nivel;
            if (typeof body.racha === 'number') pl.racha = body.racha;
            if (typeof body.oro === 'number') pl.oro = body.oro;
            if (Array.isArray(body.board)) pl.board = body.board;
            broadcast(room, { type: 'state', ...roomState(room) });
            send(res, { ok: true });
        });
        return;
    }

    // -------- POST: resultado --------
    if (p === '/api/result' && req.method === 'POST') {
        readBody(req, body => {
            const room = getRoom(body.room);
            const pid = String(body.pid || '');
            room.results[pid] = body.result || null;
            broadcast(room, { type: 'result', pid, result: body.result, results: room.results });
            send(res, { ok: true });
        });
        return;
    }

    // -------- POST: reiniciar ronda --------
    if (p === '/api/reset' && req.method === 'POST') {
        readBody(req, body => {
            const room = getRoom(body.room);
            room.started = false; room.seed = null; room.results = {};
            Object.values(room.players).forEach(pl => { pl.ready = false; pl.team = null; });
            broadcast(room, { type: 'state', ...roomState(room) });
            send(res, { ok: true });
        });
        return;
    }

    if (p === '/api/state') {
        const room = getRoom(url.searchParams.get('room'));
        send(res, roomState(room));
        return;
    }

    // -------- estáticos --------
    serveStatic(req, res, p);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('============================================================');
    console.log('  Pokémon TFT - servidor ONLINE (prototipo)');
    console.log(`  Local:  http://localhost:${PORT}/online`);
    console.log('  Comparte la URL pública (túnel) con tu amigo para jugar.');
    console.log('============================================================');
});
