// ============================================================
// SERVIDOR ONLINE (prototipo) - sin dependencias
// Sirve el juego + gestiona salas (2 jugadores) por SSE + POST.
// Uso:  node servidor-online.js   (PORT=xxxx opcional)
// ============================================================
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = __dirname;

// Nombre de jugador: sin caracteres de control y con tope de longitud
function nombreSeguro(v) {
    var limpio = String(v == null ? '' : v).split('').filter(function (c) { var n = c.charCodeAt(0); return n >= 32 && n !== 127; }).join('');
    return limpio.trim().slice(0, 24) || 'Jugador';
}
const PORT = process.env.PORT || 8000;
// 🔒 Acceso privado opcional: si defines ACCESS_KEY en el entorno (Render),
//    solo entra quien tenga el enlace con ?clave=...
//    Si NO está definida, el servidor queda abierto como siempre.
const ACCESS_KEY = String(process.env.ACCESS_KEY || '').trim();
// 🕵️ Panel de administración (quién está jugando / tiempo jugado).
//    Si defines ADMIN_KEY, solo se entra con /admin?admin=CLAVE.
//    Si no, /admin queda detrás de ACCESS_KEY (o abierto en local).
const ADMIN_KEY = String(process.env.ADMIN_KEY || '').trim();
const ONLINE_MS = 8000; // se considera "jugando ahora" si ha sincronizado en los últimos 8 s

// 🏷️ Versión desplegada (para ver si Render se ha actualizado)
const APP_VERSION = (() => { try { return require('./package.json').version || '0.0.0'; } catch (e) { return '0.0.0'; } })();
const BOOT_AT = Date.now();
const COMMIT = (() => {
    const env = String(process.env.RENDER_GIT_COMMIT || '').trim();
    if (env) return env.slice(0, 7);
    try {
        const head = fs.readFileSync(path.join(ROOT, '.git', 'HEAD'), 'utf8').trim();
        if (head.startsWith('ref:')) {
            const sha = fs.readFileSync(path.join(ROOT, '.git', head.replace('ref:', '').trim()), 'utf8').trim();
            return sha.slice(0, 7);
        }
        return head.slice(0, 7);
    } catch (e) { return 'dev'; }
})();
const BRANCH = String(process.env.RENDER_GIT_BRANCH || '').trim();

const MIME = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.json': 'application/json',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
    '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon',
    '.webmanifest': 'application/manifest+json',
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
        started: room.started, seed: room.seed, results: room.results,
        torneo: room.torneo || null
    };
}

// ============================================================
// 🏆 TORNEO ONLINE (2 humanos + 6 IA)
// ============================================================
const IA_TORNEO = [
    { nombre: 'Misty', avatar: 'misty' },
    { nombre: 'Rojo', avatar: 'rojo' },
    { nombre: 'Lorelei', avatar: 'lorelei' },
    { nombre: 'Lance', avatar: 'lance' },
    { nombre: 'Erika', avatar: 'erika' },
    { nombre: 'Bruno', avatar: 'bruno' }
];

function _esRondaPvETorneo(r) {
    return (r === 1) || (r >= 6 && (r - 6) % 6 === 0);
}

function _danoBaseTorneo(r) {
    if (r >= 21) return 7;
    if (r >= 20) return 5;
    if (r >= 13) return 4;
    if (r >= 10) return 3;
    return 2;
}

function crearTorneoOnline(room) {
    const partes = [];
    Object.entries(room.players).forEach(([pid, p]) => {
        partes.push({
            id: pid, tipo: 'humano',
            nombre: p.name || 'Jugador', avatar: p.avatar || 'rojo',
            hp: (typeof p.hp === 'number' ? p.hp : 50),
            nivel: (typeof p.nivel === 'number' ? p.nivel : 1),
            victorias: 0, derrotas: 0, eliminado: false
        });
    });
    IA_TORNEO.forEach((ia, i) => {
        partes.push({
            id: 'ia' + (i + 1), tipo: 'ia',
            nombre: ia.nombre, avatar: ia.avatar,
            hp: 50, nivel: 2, victorias: 0, derrotas: 0, eliminado: false,
            seed: Math.floor(Math.random() * 1e9) + 1   // equipo estable de esta IA
        });
    });
    room.torneo = {
        ronda: room.round || 1,
        maxHp: 50,
        participantes: partes,
        parejas: [],
        resultados: []
    };
    emparejarTorneoOnline(room);
    return room.torneo;
}

function emparejarTorneoOnline(room) {
    const t = room.torneo;
    if (!t) return;

    // 🎲 Fase 2: se emparejan TODOS los vivos (humanos e IA) al azar.
    //    Así a veces te toca tu amigo y otras una IA del torneo.
    const vivos = t.participantes.filter(p => !p.eliminado);
    for (let i = vivos.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [vivos[i], vivos[j]] = [vivos[j], vivos[i]];
    }

    const parejas = [];
    for (let i = 0; i + 1 < vivos.length; i += 2) {
        parejas.push([vivos[i].id, vivos[i + 1].id]);
    }

    const enPareja = new Set(parejas.flat());
    t.sueltos = vivos.filter(p => !enPareja.has(p.id)).map(p => p.id);
    t.parejas = parejas;

    // Semilla por pareja (equipo de IA determinista si hace falta)
    t.seeds = t.seeds || {};
    parejas.forEach(par => {
        const k = par.join('|');
        if (!t.seeds[k]) t.seeds[k] = Math.floor(Math.random() * 1e9) + 1;
    });

    // Rival de cada participante
    t.rivales = {};
    parejas.forEach(par => {
        t.rivales[par[0]] = par[1];
        t.rivales[par[1]] = par[0];
    });
}

function simularTorneoOnline(room, rondaJugada) {
    const t = room.torneo;
    if (!t) return;
    const r = (typeof rondaJugada === 'number') ? rondaJugada : t.ronda;
    const mapa = new Map(t.participantes.map(p => [p.id, p]));
    const pve = _esRondaPvETorneo(r);

    // HP de los humanos: la que ha reportado el cliente
    t.participantes.forEach(p => {
        if (p.tipo !== 'humano') return;
        const pl = room.players[p.id];
        if (pl && typeof pl.hp === 'number') p.hp = pl.hp;
        if (p.hp <= 0) marcarEliminadoTorneo(t, p);
    });

    // IA vs IA (en PvE no se pegan entre ellas)
    if (!pve) {
        t.parejas.forEach(par => {
            const a = mapa.get(par[0]), b = mapa.get(par[1]);
            if (!a || !b || a.eliminado || b.eliminado) return;
            if (a.tipo === 'humano' || b.tipo === 'humano') return;

            const pa = a.nivel * 100 + a.victorias * 50 + a.derrotas * 20;
            const pb = b.nivel * 100 + b.victorias * 50 + b.derrotas * 20;
            const ganaA = Math.random() < (pa / (pa + pb || 1));
            const gan = ganaA ? a : b;
            const per = ganaA ? b : a;
            const vivas = 1 + Math.floor(Math.random() * 4);
            const dano = Math.min(20, _danoBaseTorneo(r) + vivas);
            per.hp = Math.max(0, per.hp - dano);
            gan.victorias++;
            per.derrotas++;
            if (per.hp <= 0) marcarEliminadoTorneo(t, per);
            t.resultados.push({ ronda: r, ganador: gan.nombre, perdedor: per.nombre, dano });
        });
    } else {
        // PvE: todos se enfrentan al monstruo, no hay daño entre rivales
        t.resultados.push({ ronda: r, pve: true });
    }

    // Suben de nivel con las rondas
    t.participantes.forEach(p => {
        if (p.tipo !== 'ia' || p.eliminado) return;
        p.nivel = Math.min(8, 2 + Math.floor(r / 4));
    });

    t.ronda = r + 1;
    emparejarTorneoOnline(room);
}

// ¿Está eliminado este humano? (modo espectador)
function _humanoEliminado(room, pid) {
    const t = room.torneo;
    if (!t) return false;
    const p = (t.participantes || []).find(x => x.id === pid);
    return !!(p && p.eliminado);
}

// Marca a alguien como eliminado guardando el orden de caída
function marcarEliminadoTorneo(t, p) {
    if (!t || !p || p.eliminado) return;
    p.eliminado = true;
    t._contadorElim = (t._contadorElim || 0) + 1;
    p.orden = t._contadorElim;
}

// Si los dos humanos han caído → fin del torneo (opción A)
function finalizarTorneoSiProcede(room) {
    const t = room.torneo;
    if (!t || t.finalizado) return;
    const vivosHumanos = (t.participantes || []).filter(p => p.tipo === 'humano' && !p.eliminado);
    if (vivosHumanos.length > 0) return;

    t.finalizado = true;
    const vivos = (t.participantes || []).filter(p => !p.eliminado).sort((a, b) => b.hp - a.hp);
    const caidos = (t.participantes || []).filter(p => p.eliminado).sort((a, b) => (b.orden || 0) - (a.orden || 0));
    const orden = vivos.concat(caidos);
    t.posiciones = orden.map((p, i) => {
        const pl = room.players[p.id] || null;
        return {
            pos: i + 1, id: p.id, nombre: p.nombre, tipo: p.tipo, avatar: p.avatar,
            hp: Math.max(0, p.hp),
            nivel: p.nivel || 1,
            seed: p.seed || 0,                 // semilla estable del equipo de IA
            board: (p.tipo === 'humano' && pl && Array.isArray(pl.board)) ? pl.board : null
        };
    });

    broadcast(room, { type: 'torneoFin', torneo: t, posiciones: t.posiciones });
}

// Daño que un humano hace a la IA contra la que ha ganado
function aplicarVictoriaHumanoSobreIA(room, pid, ronda, vivas) {
    const t = room.torneo;
    if (!t || !t.rivales) return;
    if (_esRondaPvETorneo(ronda)) return;   // en PvE los rivales no reciben daño
    const rid = t.rivales[pid];
    const rv = (t.participantes || []).find(p => p.id === rid);
    if (!rv || rv.tipo !== 'ia') return;
    const v = Math.max(1, parseInt(vivas, 10) || 1);
    const dano = Math.min(20, _danoBaseTorneo(ronda) + v);
    rv.hp = Math.max(0, rv.hp - dano);
    rv.derrotas = (rv.derrotas || 0) + 1;
    if (rv.hp <= 0) marcarEliminadoTorneo(t, rv);
    t.resultados.push({ ronda: ronda, ganador: 'humano', perdedor: rv.nombre, dano });
}
function send(res, obj, code) {
    try { res.writeHead(code || 200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(obj)); }
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
function cookieVal(req, name) {
    const raw = req.headers.cookie || '';
    for (const part of raw.split(';')) {
        const i = part.indexOf('=');
        if (i < 0) continue;
        if (part.slice(0, i).trim() === name) {
            const v = part.slice(i + 1).trim();
            try { return decodeURIComponent(v); } catch (e) { return v; }
        }
    }
    return '';
}

function adminAuthorized(req, url) {
    if (!ADMIN_KEY) return true;
    const clave = (url.searchParams.get('admin') || '').trim();
    return (clave === ADMIN_KEY) || (cookieVal(req, 'pktft_admin') === ADMIN_KEY);
}

function adminState() {
    const now = Date.now();
    const out = [];
    for (const [code, room] of rooms) {
        const players = Object.entries(room.players).map(([pid, pl]) => ({
            pid,
            name: pl.name || 'Jugador',
            avatar: pl.avatar || null,
            hp: (typeof pl.hp === 'number') ? pl.hp : null,
            nivel: (typeof pl.nivel === 'number') ? pl.nivel : null,
            round: (typeof pl.round === 'number') ? pl.round : null,
            ready: !!pl.ready,
            online: (now - (pl.lastSeen || 0)) < ONLINE_MS,
            segundos: Math.max(0, Math.floor((now - (pl.joinedAt || now)) / 1000)),
            vistoHace: Math.max(0, Math.round((now - (pl.lastSeen || 0)) / 1000))
        }));
        if (!players.length) continue;
        players.sort((a, b) => (b.online - a.online) || (b.segundos - a.segundos));
        const online = players.filter(p => p.online).length;
        out.push({ code, round: room.round || 1, phase: room.phase || 'prep', online, total: players.length, players });
    }
    out.sort((a, b) => (b.online - a.online) || (b.total - a.total));
    return { now, rooms: out, activos: out.reduce((n, r) => n + r.online, 0) };
}

function adminPage() {
    return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pokémon TFT — Jugadores</title>
<style>
  *{box-sizing:border-box} body{margin:0;padding:20px;background:#070c16;color:#e6eefc;font-family:Inter,system-ui,sans-serif}
  h1{font-size:1.2rem;margin:0 0 4px} .sub{color:#8fb0d6;font-size:.82rem;margin-bottom:16px}
  .room{background:#0f172a;border:1px solid #2a4066;border-radius:12px;padding:12px;margin-bottom:14px}
  .room h2{font-size:.9rem;margin:0 0 8px;color:#7fd4ff;display:flex;justify-content:space-between}
  table{width:100%;border-collapse:collapse;font-size:.82rem}
  th{text-align:left;color:#6b8aaa;font-weight:600;padding:6px 8px;border-bottom:1px solid #1d2c47}
  td{padding:7px 8px;border-bottom:1px solid #13203a}
  tr:last-child td{border-bottom:none}
  .on{color:#4ade80;font-weight:700} .off{color:#6b8aaa}
  .hp{color:#f87171} .r{color:#fbbf24;font-weight:700}
  .dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px}
</style></head><body>
  <h1>🕵️ Jugadores en vivo</h1>
  <div class="sub" id="sub">Cargando…</div>
  <div id="list"></div>
<script>
function fmt(s){var h=Math.floor(s/3600),m=Math.floor((s%3600)/60),x=s%60;return (h?h+'h ':'')+(m?m+'m ':'')+x+'s';}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c];});}
async function tick(){
  try{
    var r=await fetch('/api/admin',{cache:'no-store'});
    if(!r.ok) throw new Error('HTTP '+r.status);
    var d=await r.json();
    document.getElementById('sub').textContent=d.activos+' jugador(es) conectados ahora · actualizado '+new Date().toLocaleTimeString();
    var html='';
    if(!d.rooms.length) html='<div class="sub">Nadie conectado todavía.</div>';
    d.rooms.forEach(function(room){
      html+='<div class="room"><h2><span>Sala '+esc(room.code)+'</span><span>Ronda '+room.round+'</span></h2><table><thead><tr><th>Estado</th><th>Nick</th><th>Ronda</th><th>Nivel</th><th>HP</th><th>Tiempo jugado</th><th>Últ. señal</th></tr></thead><tbody>';
      room.players.forEach(function(p){
        var on=p.online;
        html+='<tr><td><span class="dot" style="background:'+(on?'#4ade80':'#4a5a72')+'"></span><span class="'+(on?'on':'off')+'">'+(on?'Jugando':'Desconectado')+'</span></td>'+
          '<td><b>'+esc(p.name)+'</b></td>'+
          '<td class="r">'+(p.round!=null?p.round:'—')+'</td>'+
          '<td>'+(p.nivel!=null?p.nivel:'—')+'</td>'+
          '<td class="hp">'+(p.hp!=null?p.hp:'—')+'</td>'+
          '<td>'+fmt(p.segundos)+'</td>'+
          '<td class="off">'+(on?'ahora':'hace '+p.vistoHace+'s')+'</td></tr>';
      });
      html+='</tbody></table></div>';
    });
    document.getElementById('list').innerHTML=html;
  }catch(e){
    document.getElementById('sub').textContent='Error cargando datos: '+e.message;
  }
}
tick(); setInterval(tick, 2500);
</script></body></html>`;
}

function loginPage(res, mensaje, modo) {
    const esAdmin = (modo === 'admin');
    const param = esAdmin ? 'admin' : 'clave';
    const titulo = esAdmin ? '🕵️ Administración' : '🔒 Pokémon TFT';
    const texto = esAdmin ? 'Introduce la clave de administrador.' : 'Acceso privado. Introduce la clave que te ha pasado el organizador.';
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pokémon TFT — Acceso privado</title>
<style>
  *{box-sizing:border-box} body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
  background:radial-gradient(circle at 50% 20%,#15315c,#070c16 70%);font-family:Inter,system-ui,sans-serif;color:#e6eefc}
  .card{width:92%;max-width:420px;background:#0f172a;border:1px solid #2a4066;border-radius:18px;padding:28px;text-align:center;
  box-shadow:0 20px 60px rgba(0,0,0,.55)}
  h1{font-size:1.25rem;margin:0 0 6px} p{color:#8fb0d6;font-size:.85rem;margin:0 0 18px}
  input{width:100%;padding:12px;border-radius:10px;border:1px solid #2a4066;background:#0b1626;color:#fff;font-size:1rem;margin-bottom:10px}
  button{width:100%;padding:12px;border:none;border-radius:10px;font-weight:800;cursor:pointer;
  background:linear-gradient(180deg,#2f6bd8,#1f4fa8);color:#fff}
  .err{color:#f87171;font-size:.82rem;margin-bottom:10px}
</style></head><body>
  <form class="card" onsubmit="event.preventDefault();var v=document.getElementById('k').value.trim();if(v)location.href='${esAdmin ? '/admin?admin=' : '/?clave='}'+encodeURIComponent(v);">
    <h1>${titulo}</h1>
    <p>${texto}</p>
    ${mensaje ? `<div class="err">${mensaje}</div>` : ''}
    <input id="k" type="password" placeholder="Clave de acceso" autofocus autocomplete="current-password">
    <button type="submit">Entrar</button>
  </form>
</body></html>`;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(html);
}

// ============================================================
// 📦 CACHÉ Y COMPRESIÓN DE ESTÁTICOS
// Antes todo iba con `no-store`: cada visita descargaba ~22 MB
// otra vez (fondos, sprites, JS...). Ahora:
//   · HTML  -> no-store y versiona las URLs de js/css con ?v=<commit>
//   · JS/CSS -> 7 días (la URL cambia en cada deploy, así no se queda viejo)
//   · imágenes/sonidos/fuentes -> 7 días
//   · JS/CSS/HTML/SVG/JSON -> gzip (2,1 MB de JS -> ~500 KB)
// ============================================================
const COMPRIMIBLES = new Set(['.html', '.css', '.js', '.json', '.svg', '.txt']);
const gzipCache = new Map(); // fp -> { mtimeMs, size, gz }

function cacheHeaderFor(ext, fp) {
    if (ext === '.html') return 'no-store';
    if (path.basename(fp || '').toLowerCase() === 'sw.js') return 'no-cache';
    if (ext === '.js' || ext === '.css') return 'public, max-age=604800';
    return 'public, max-age=604800'; // imágenes, audio, fuentes
}

function gzipDeCache(fp, buf) {
    let mtimeMs = 0;
    try { mtimeMs = fs.statSync(fp).mtimeMs; } catch (e) { }
    const hit = gzipCache.get(fp);
    if (hit && hit.mtimeMs === mtimeMs && hit.size === buf.length) return hit.gz;
    const gz = zlib.gzipSync(buf, { level: 6 });
    gzipCache.set(fp, { mtimeMs, size: buf.length, gz });
    return gz;
}

function serveStatic(req, res, pathname) {
    let rel = decodeURIComponent(pathname);
    if (rel === '/') rel = '/index.html';
    if (rel === '/online' || rel === '/online/') rel = '/online.html';
    const fp = path.normalize(path.join(ROOT, rel));
    if (fp !== ROOT && !fp.startsWith(ROOT + path.sep)) { res.writeHead(403); res.end('Forbidden'); return; }
    fs.readFile(fp, (err, buf) => {
        if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('404'); return; }
        const ext = path.extname(fp).toLowerCase();

        // 🔁 Cache-busting por commit: el HTML es no-store y sus <script>/<link>
        // llevan ?v=<commit>. Así un deploy nuevo cambia la URL y el navegador
        // no puede seguir usando el CSS/JS viejo (el banco de móvil se quedaba
        // con la versión anterior por la caché de 10 min).
        if (ext === '.html') {
            const s = buf.toString('utf8').replace(
                /(\b(?:src|href)=")((?:js|css)\/[^"#]+\.(?:js|css))(?:\?[^"]*)?(")/g,
                (m, pre, url, post) => pre + url + '?v=' + encodeURIComponent(COMMIT) + post
            );
            buf = Buffer.from(s, 'utf8');
        }
        const base = {
            'Content-Type': MIME[ext] || 'application/octet-stream',
            'Cache-Control': cacheHeaderFor(ext, fp),
            'Vary': 'Accept-Encoding',
            'X-Content-Type-Options': 'nosniff',
            'Referrer-Policy': 'no-referrer',
            'X-Frame-Options': 'SAMEORIGIN'
        };
        const aceptaGzip = /\bgzip\b/.test(String(req.headers['accept-encoding'] || ''));
        if (COMPRIMIBLES.has(ext) && aceptaGzip && buf.length > 1024) {
            const gz = gzipDeCache(fp, buf);
            res.writeHead(200, { ...base, 'Content-Encoding': 'gzip', 'Content-Length': gz.length });
            if (req.method === 'HEAD') { res.end(); return; }
            res.end(gz);
            return;
        }
        res.writeHead(200, { ...base, 'Content-Length': buf.length });
        if (req.method === 'HEAD') { res.end(); return; }
        res.end(buf);
    });
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    const p = url.pathname;

    // Panel de administración: si hay ADMIN_KEY, se entra con /admin?admin=CLAVE
    const adminOk = ADMIN_KEY && ((url.searchParams.get('admin') || '').trim() === ADMIN_KEY || cookieVal(req, 'pktft_admin') === ADMIN_KEY);

    // -------- 🔒 Puerta de acceso privada (solo si ACCESS_KEY está definida) --------
    const _esRutaAdmin = (p === '/admin' || p === '/admin/' || p === '/api/admin');
    if (ACCESS_KEY && !adminOk && !_esRutaAdmin) {
        const clave = (url.searchParams.get('clave') || url.searchParams.get('k') || '').trim();
        const okCookie = (cookieVal(req, 'pktft_key') === ACCESS_KEY);
        if (!okCookie) {
            if (clave && clave !== ACCESS_KEY) { loginPage(res, 'Clave incorrecta. Revísala e inténtalo otra vez.'); return; }
            if (!clave) { loginPage(res, ''); return; }
            // Clave correcta → guardar cookie 30 días y limpiar la clave de la URL
            const q = new URLSearchParams(url.search);
            q.delete('clave'); q.delete('k');
            const qs = q.toString();
            res.writeHead(302, {
                'Set-Cookie': `pktft_key=${encodeURIComponent(ACCESS_KEY)}; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax`,
                'Location': p + (qs ? ('?' + qs) : ''),
                'Cache-Control': 'no-store'
            });
            res.end();
            return;
        }
    }

    // -------- 🏷️ Versión desplegada --------
    if (p === '/api/version') {
        send(res, {
            ok: true,
            version: APP_VERSION,
            commit: COMMIT,
            branch: BRANCH,
            bootedAt: BOOT_AT,
            now: Date.now(),
            uptimeSeg: Math.floor((Date.now() - BOOT_AT) / 1000),
            env: process.env.RENDER ? 'render' : 'local'
        });
        return;
    }

    // -------- 🕵️ Admin: jugadores en vivo / tiempo jugado --------
    if (p === '/admin' || p === '/admin/') {
        if (!adminAuthorized(req, url)) { loginPage(res, '', 'admin'); return; }
        const claveAdmin = (url.searchParams.get('admin') || '').trim();
        if (ADMIN_KEY && claveAdmin === ADMIN_KEY && cookieVal(req, 'pktft_admin') !== ADMIN_KEY) {
            res.writeHead(302, {
                'Set-Cookie': `pktft_admin=${encodeURIComponent(ADMIN_KEY)}; Path=/; Max-Age=2592000; HttpOnly; SameSite=Lax`,
                'Location': '/admin', 'Cache-Control': 'no-store'
            });
            res.end(); return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(adminPage());
        return;
    }
    if (p === '/api/admin') {
        if (!adminAuthorized(req, url)) { send(res, { ok: false, error: 'no autorizado' }, 401); return; }
        send(res, { ok: true, ...adminState() });
        return;
    }

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
                // 🧹 Limpiar jugadores inactivos (pestaña cerrada / recarga antigua)
                const ahora = Date.now();
                Object.keys(room.players).forEach(k => {
                    const pl = room.players[k];
                    if (pl && pl.lastSeen && (ahora - pl.lastSeen) > 30000) delete room.players[k];
                });
                if (Object.keys(room.players).length >= 2) {
                    send(res, { ok: false, error: 'sala llena (2 jugadores)' }, 409);
                    return;
                }
            }
            // 🆕 Al entrar (si no hay combate en curso) reiniciar el marcador de la partida
            if (room.phase !== 'combat') {
                room.round = 1;
                room.phase = 'prep';
                room.done = {};
                room.matchHp = {};
                room._won = {};
                room.torneo = null;   // 🏆 partida nueva → torneo nuevo
                Object.values(room.players).forEach(pl => { pl.ready = false; });
            }
            if (!room.players[pid]) {
                const now = Date.now();
                room.players[pid] = { name: nombreSeguro(body.name), ready: false, team: null, joinedAt: now, lastSeen: now, round: null };
            } else {
                if (body.name) room.players[pid].name = nombreSeguro(body.name);
                room.players[pid].lastSeen = Date.now();
                if (!room.players[pid].joinedAt) room.players[pid].joinedAt = Date.now();
            }

            // 🏆 En cuanto están los 2 en la sala ya hay torneo (ranking visible
            //    durante la preparación, sin esperar al primer COMBATIR)
            if (Object.keys(room.players).length >= 2 && !room.torneo) {
                try { crearTorneoOnline(room); } catch (e) { }
            }

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
            room.players[pid].lastSeen = Date.now();

            // 🏆 Torneo online: crear si falta y refrescar emparejamiento de la ronda
            if (Object.keys(room.players).length >= 2) {
                if (!room.torneo) {
                    crearTorneoOnline(room);
                } else {
                    // (ya existe desde que entró el 2º jugador)
                    if (room.torneo.ronda !== (room.round || 1)) room.torneo.ronda = room.round || 1;
                    if (!room.torneo.parejas || room.torneo.parejas.length === 0) emparejarTorneoOnline(room);
                }
            }

            broadcast(room, { type: 'state', ...roomState(room) });
            const pids = Object.keys(room.players);
            // 👁️ Los eliminados ya no bloquean la ronda (modo espectador)
            const pidsActivos = pids.filter(x => !_humanoEliminado(room, x));
            if (pids.length >= 2 && pidsActivos.length > 0 && pidsActivos.every(x => room.players[x].ready) && room.phase === 'prep') {
                room.phase = 'combat';
                const r = room.round || 1;
                const pve = (r === 1 || (r >= 6 && (r - 6) % 6 === 0));
                room._roundType = pve ? 'pve' : 'pvp';
                const boards = {}; pids.forEach(x => boards[x] = room.players[x].board || []);

                // 🏆 ¿Contra quién juega cada humano? (rival del torneo)
                const asignaciones = {};
                try {
                    if (room.torneo && room.torneo.rivales) {
                        pids.forEach(hpid => {
                            const rid = room.torneo.rivales[hpid];
                            const rv = (room.torneo.participantes || []).find(p => p.id === rid);
                            if (!rv) return;
                            let seed = 1;
                            try {
                                const par = (room.torneo.parejas || []).find(x => x.includes(hpid) && x.includes(rid)) || [hpid, rid];
                                seed = (room.torneo.seeds || {})[par.join('|')] || 1;
                            } catch (e) { }
                            asignaciones[hpid] = {
                                tipo: rv.tipo, rivalId: rv.id, nombre: rv.nombre, avatar: rv.avatar,
                                nivel: rv.nivel || 2, seed
                            };
                        });
                    }
                } catch (e) { }

                broadcast(room, { type: 'resolve', round: r, roundType: pve ? 'pve' : 'pvp', boards, players: pids, asignaciones });
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
            room._vivas = room._vivas || {}; room._vivas[pid] = (typeof body.vivas === 'number') ? body.vivas : 1;
            const pids = Object.keys(room.players);
            const pidsActivos = pids.filter(x => !_humanoEliminado(room, x));
            if (pids.length >= 2 && pidsActivos.length > 0 && pidsActivos.every(x => room.done[x]) && room.phase === 'combat') {
                // 🏆 Daño de los humanos a las IA del torneo (si ganaron)
                try {
                    Object.keys(room.players).forEach(hpid => {
                        if (room._won[hpid] === true) {
                            aplicarVictoriaHumanoSobreIA(room, hpid, room.round || 1, room._vivas[hpid] || 1);
                        }
                    });
                } catch (e) { }

                // 🏆 Cerrar la ronda del torneo (IA vs IA, HP de los humanos)
                try { simularTorneoOnline(room, room.round || 1); } catch (e) { }

                // 🏆 ¿Se han quedado los dos humanos fuera? → fin (opción A)
                try { finalizarTorneoSiProcede(room); } catch (e) { }

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
                    broadcast(room, { type: 'matchEnd', winner: win, players: pids, hp: hpArr, round: room.round || 1 });
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
            if (!room.players[pid]) {
                const now = Date.now();
                room.players[pid] = { name: nombreSeguro(body.name), ready: false, team: null, joinedAt: now, lastSeen: now, round: null };
            }
            const pl = room.players[pid];
            pl.lastSeen = Date.now();
            if (!pl.joinedAt) pl.joinedAt = Date.now();
            if (body.name) pl.name = nombreSeguro(body.name);
            if (body.avatar) pl.avatar = body.avatar;
            if (typeof body.hp === 'number') pl.hp = body.hp;
            if (typeof body.nivel === 'number') pl.nivel = body.nivel;
            if (typeof body.racha === 'number') pl.racha = body.racha;
            if (typeof body.oro === 'number') pl.oro = body.oro;
            if (typeof body.round === 'number') pl.round = body.round;
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
            room.torneo = null;
            room.round = 1; room.phase = 'prep';
            room.done = {}; room.matchHp = {}; room._won = {}; room._vivas = {};
            Object.values(room.players).forEach(pl => { pl.ready = false; pl.team = null; pl.hp = null; pl.board = null; });
            broadcast(room, { type: 'torneoReset' });
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

// 🔄 Red de seguridad: regenerar js/bundle.js y css/bundle.css con el
// contenido actual de los archivos fuente. Así, aunque se olvide ejecutar
// `node tools/build-bundle.js`, el servidor sirve siempre la versión buena.
// Si el disco es de solo lectura, se avisa y se usa el bundle ya generado.
try {
    require('child_process').execFileSync(
        process.execPath,
        [path.join(__dirname, 'tools', 'build-bundle.js')],
        { stdio: 'ignore', timeout: 20000 }
    );
    console.log('🔄 Bundle JS/CSS regenerado al arrancar');
} catch (e) {
    console.warn('⚠️ No se pudo regenerar el bundle (se usa el existente):', e.message);
}

server.listen(PORT, '0.0.0.0', () => {
    console.log('============================================================');
    console.log('  Pokémon TFT - servidor ONLINE (prototipo)');
    console.log(`  Local:  http://localhost:${PORT}/online`);
    console.log('  Comparte la URL pública (túnel) con tu amigo para jugar.');
    console.log('============================================================');
});
