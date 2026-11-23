// ============================================================
// UI - ANIMACIONES Y EFECTOS VISUALES (ESTILO POKÉMON)
// ============================================================
// v17.6: FIX números de daño FUERA de la carta
//        - mostrarNumeroDaño() y mostrarNumeroCuracion() SIEMPRE
//          se pintan en document.body con position:fixed.
//          Así no heredan el overflow:hidden de las celdas y
//          pueden salir libremente.
//        - z-index alto (99999) para que estén por encima de todo.
//        - Offset aleatorio más grande (±20px).
//        - playSonidoCritico() reemplazado por versión más grave.
// ============================================================

// ============================================================
// 🎨 COLORES DE DAÑO
// ============================================================

const COLOR_DANO_FISICO         = '#ff6600';
const COLOR_DANO_FISICO_CRIT    = '#ff6b00';
const COLOR_DANO_FISICO_TITULO  = '#ff3333';
const COLOR_DANO_ESPECIAL       = '#d657ff';
const COLOR_DANO_ESPECIAL_CLARO = '#e9b3ff';
const COLOR_DANO_ESCUDO         = '#ffffff';

// ============================================================
// 🎯 CONFIGURACIÓN DE PROYECTILES POR TIPO
// ============================================================

const CONFIGURACION_PROYECTILES = {
    'Fuego':     { color1: '#fff7d6', color2: '#fb923c', color3: '#dc2626', glow: 'rgba(251,146,60,0.9)' },
    'Agua':      { color1: '#e0f2fe', color2: '#38bdf8', color3: '#0369a1', glow: 'rgba(56,189,248,0.9)' },
    'Planta':    { color1: '#dcfce7', color2: '#4ade80', color3: '#15803d', glow: 'rgba(74,222,128,0.9)' },
    'Eléctrico': { color1: '#fefce8', color2: '#facc15', color3: '#a16207', glow: 'rgba(250,204,21,1.0)' },
    'Psíquico':  { color1: '#f3e8ff', color2: '#c084fc', color3: '#7e22ce', glow: 'rgba(192,132,252,0.9)' },
    'Siniestro': { color1: '#e2e8f0', color2: '#64748b', color3: '#1e293b', glow: 'rgba(100,116,139,0.9)' },
    'Hada':      { color1: '#fce7f3', color2: '#f472b6', color3: '#be185d', glow: 'rgba(244,114,182,0.9)' },
    'Fantasma':  { color1: '#ede9fe', color2: '#a78bfa', color3: '#5b21b6', glow: 'rgba(167,139,250,0.9)' },
    'Lucha':     { color1: '#fee2e2', color2: '#f87171', color3: '#991b1b', glow: 'rgba(248,113,113,0.9)' },
    'Veneno':    { color1: '#f3e8ff', color2: '#a855f7', color3: '#581c87', glow: 'rgba(168,85,247,0.9)' },
    'Hielo':     { color1: '#ecfeff', color2: '#67e8f9', color3: '#0e7490', glow: 'rgba(103,232,249,0.9)' },
    'Dragón':    { color1: '#e0e7ff', color2: '#818cf8', color3: '#3730a3', glow: 'rgba(129,140,248,0.9)' },
    'Roca':      { color1: '#fef3c7', color2: '#a16207', color3: '#422006', glow: 'rgba(161,98,7,0.9)' },
    'Normal':    { color1: '#f3f4f6', color2: '#9ca3af', color3: '#374151', glow: 'rgba(156,163,175,0.85)' },
    'Volador':   { color1: '#eff6ff', color2: '#93c5fd', color3: '#1e40af', glow: 'rgba(147,197,253,0.9)' },
    'Acero':     { color1: '#f1f5f9', color2: '#94a3b8', color3: '#334155', glow: 'rgba(148,163,184,0.9)' },
    'Eevee':     { color1: '#fff7ed', color2: '#fb923c', color3: '#9a3412', glow: 'rgba(251,146,60,0.9)' }
};

// ============================================================
// 🎯 SVGs DE PROYECTILES POR TIPO
// ============================================================

const SVG_PROYECTILES = {
    'Planta': (c) => `<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 2 C 8 8, 8 16, 12 22 C 16 16, 16 8, 12 2 Z" fill="${c.color2}" stroke="${c.color1}" stroke-width="0.8"/><line x1="12" y1="3" x2="12" y2="21" stroke="${c.color3}" stroke-width="0.6" opacity="0.75"/></svg>`,
    'Fuego': (c) => `<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 2 C 6 8, 8 14, 12 20 C 16 14, 18 8, 12 2 Z" fill="${c.color2}" stroke="${c.color3}" stroke-width="0.5"/><path d="M12 7 C 10 11, 11 15, 12 18 C 13 15, 14 11, 12 7 Z" fill="${c.color1}" opacity="0.7"/></svg>`,
    'Agua': (c) => `<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 2 C 12 2, 6 12, 6 16 A 6 6 0 0 0 18 16 C 18 12, 12 2, 12 2 Z" fill="${c.color2}" stroke="${c.color1}" stroke-width="0.8"/><ellipse cx="10" cy="15" rx="1.5" ry="2.5" fill="${c.color1}" opacity="0.55"/></svg>`,
    'Eléctrico': (c) => `<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="13,2 5,13 11,13 9,22 19,9 13,9 15,2" fill="${c.color2}" stroke="${c.color1}" stroke-width="0.9" stroke-linejoin="round"/></svg>`,
    'Hielo': (c) => `<svg viewBox="0 0 24 24" width="100%" height="100%"><g stroke="${c.color2}" stroke-width="1.4" stroke-linecap="round" fill="none"><line x1="12" y1="2" x2="12" y2="22"/><line x1="3" y1="7" x2="21" y2="17"/><line x1="3" y1="17" x2="21" y2="7"/></g><circle cx="12" cy="12" r="1.8" fill="${c.color1}"/></svg>`,
    'Psíquico': (c) => `<svg viewBox="0 0 24 24" width="100%" height="100%"><ellipse cx="12" cy="12" rx="9" ry="4" fill="none" stroke="${c.color2}" stroke-width="1.6"/><ellipse cx="12" cy="12" rx="4" ry="9" fill="none" stroke="${c.color1}" stroke-width="1.2" opacity="0.85"/><circle cx="12" cy="12" r="2.5" fill="${c.color2}"/></svg>`,
    'Hada': (c) => `<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="12,1 14,9 22,12 14,15 12,23 10,15 2,12 10,9" fill="${c.color2}" stroke="${c.color1}" stroke-width="0.6" stroke-linejoin="round"/><circle cx="12" cy="12" r="2" fill="${c.color1}" opacity="0.8"/></svg>`,
    'Fantasma': (c) => `<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M12 2 C 5 2, 4 8, 4 14 L 4 22 L 7 19 L 10 22 L 12 19 L 14 22 L 17 19 L 20 22 L 20 14 C 20 8, 19 2, 12 2 Z" fill="${c.color2}" stroke="${c.color1}" stroke-width="0.7" opacity="0.92"/><circle cx="10" cy="10" r="1" fill="${c.color1}"/><circle cx="14" cy="10" r="1" fill="${c.color1}"/></svg>`,
    'Siniestro': (c) => `<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M16 4 A 9 9 0 1 0 16 20 A 7 7 0 1 1 16 4 Z" fill="${c.color2}" stroke="${c.color1}" stroke-width="0.7"/></svg>`,
    'Lucha': (c) => `<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="9" fill="${c.color2}" stroke="${c.color1}" stroke-width="0.8"/><path d="M8 12 L 16 12 M 12 8 L 12 16" stroke="${c.color1}" stroke-width="1.6" stroke-linecap="round"/></svg>`,
    'Veneno': (c) => `<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="11" r="7" fill="${c.color2}" stroke="${c.color1}" stroke-width="0.7"/><path d="M12 18 L 12 22" stroke="${c.color2}" stroke-width="2" stroke-linecap="round"/><circle cx="10" cy="9" r="1.5" fill="${c.color1}" opacity="0.65"/></svg>`,
    'Dragón': (c) => `<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M4 4 L 12 12 L 20 4 L 12 12 L 20 20 L 12 12 L 4 20 L 12 12 Z" fill="none" stroke="${c.color2}" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="12" r="2" fill="${c.color1}"/></svg>`,
    'Volador': (c) => `<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M2 12 C 6 6, 12 4, 18 6 C 22 8, 22 16, 18 18 C 12 20, 6 18, 2 12 Z" fill="${c.color2}" stroke="${c.color1}" stroke-width="0.7"/><line x1="2" y1="12" x2="18" y2="12" stroke="${c.color1}" stroke-width="0.6" opacity="0.65"/></svg>`,
    'Acero': (c) => `<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="9" fill="${c.color2}" stroke="${c.color1}" stroke-width="1.2"/><circle cx="12" cy="12" r="3" fill="${c.color1}"/></svg>`,
    'Roca': (c) => `<svg viewBox="0 0 24 24" width="100%" height="100%"><polygon points="6,4 18,4 22,12 18,20 6,20 2,12" fill="${c.color2}" stroke="${c.color1}" stroke-width="1"/></svg>`,
    'Normal': (c) => `<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="9" fill="${c.color2}" stroke="${c.color1}" stroke-width="1.2"/><circle cx="9" cy="9" r="2.5" fill="${c.color1}" opacity="0.7"/></svg>`,
    'Eevee': (c) => `<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="9" fill="${c.color2}" stroke="${c.color1}" stroke-width="1.2"/><polygon points="12,4 15,9 21,10 16,14 18,20 12,17 6,20 8,14 3,10 9,9" fill="${c.color1}" opacity="0.6"/></svg>`
};

function obtenerPosicionUnidad(lado, indice) {
    let el = null;
    if (lado === 'player') {
        let g = document.getElementById("playerBoard");
        if (g && g.children[indice]) el = g.children[indice];
    } else {
        let g = document.getElementById("enemigoBoard");
        if (g && g.children[indice]) el = g.children[indice];
    }
    if (el) {
        let r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, elemento: el };
    }
    return { x: window.innerWidth / 2, y: window.innerHeight / 2, elemento: null };
}

// ============================================================
// 🛡️ BARRAS
// ============================================================

function actualizarBarraVida(elemento, hp, maxHp) {
    if (!elemento || typeof elemento.querySelector !== 'function') return;
    if (typeof hp !== 'number' || typeof maxHp !== 'number' || maxHp <= 0) return;
    try {
        let percent = (hp / maxHp) * 100;
        let barFill = elemento.querySelector('.hp-fill');
        if (barFill && barFill.style) {
            barFill.style.width = `${Math.min(100, percent)}%`;
            if (percent > 50) barFill.className = 'hp-fill';
            else if (percent > 25) barFill.className = 'hp-fill medium';
            else if (percent > 10) barFill.className = 'hp-fill low';
            else barFill.className = 'hp-fill critical';
        }
    } catch (e) {}
}

function actualizarBarraVidaConEfecto(elemento, hp, maxHp, efecto) {
    if (!elemento || typeof elemento.querySelector !== 'function') return;
    if (typeof hp !== 'number' || typeof maxHp !== 'number' || maxHp <= 0) return;
    try {
        let percent = (hp / maxHp) * 100;
        let barFill = elemento.querySelector('.hp-fill');
        if (barFill && barFill.style) {
            barFill.style.width = `${Math.min(100, percent)}%`;
            if (percent > 50) barFill.className = 'hp-fill';
            else if (percent > 25) barFill.className = 'hp-fill medium';
            else if (percent > 10) barFill.className = 'hp-fill low';
            else barFill.className = 'hp-fill critical';
            if (efecto === 'curacion') {
                barFill.style.background = 'linear-gradient(90deg, #22c55e, #4ade80)';
                setTimeout(() => { if (barFill && barFill.style) barFill.style.background = ''; }, 500);
            } else if (efecto === 'daño') {
                barFill.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
                setTimeout(() => { if (barFill && barFill.style) barFill.style.background = ''; }, 500);
            }
        }
    } catch (e) {}
}

function actualizarBarraEnergia(elemento, energy, energyGauge) {
    if (!elemento || typeof elemento.querySelector !== 'function') return;
    if (typeof energy !== 'number' || typeof energyGauge !== 'number' || energyGauge <= 0) return;
    try {
        let energyFill = elemento.querySelector('.energy-fill');
        if (energyFill && energyFill.style) {
            let percent = (energy / energyGauge) * 100;
            energyFill.style.width = `${Math.min(100, percent)}%`;
            if (percent >= 90) energyFill.classList.add('full');
            else energyFill.classList.remove('full');
        }
    } catch (e) {}
}

// ============================================================
// 🎨 NÚMEROS DE DAÑO CÓMIC - v2
// ============================================================
// 🆕 FIX: los números SIEMPRE se pintan en document.body con
// position:fixed, centrados en la celda del objetivo. Así NO
// heredan el overflow:hidden de .board-cell / .bank-cell y
// pueden salir libremente de la carta sin recortarse.
// ============================================================

function mostrarNumeroDaño(x, y, cantidad, crit = false, escudo = false, esEspecial = false, elemento = null, tipo = null) {
    if (typeof cantidad !== 'number' || isNaN(cantidad)) return;
    try {
        const abs = Math.abs(cantidad);
        let tamano = 'dmg-normal';
        if (abs >= 500) tamano = 'dmg-huge';
        else if (abs >= 200) tamano = 'dmg-large';
        let claseColor = 'dmg-physical';
        if (escudo) claseColor = 'dmg-shield';
        else if (esEspecial) claseColor = 'dmg-special';
        else if (crit) claseColor = 'dmg-critical';
        const rotClases = ['', 'dmg-rot-a', 'dmg-rot-b', 'dmg-rot-c'];
        const rot = rotClases[Math.floor(Math.random() * rotClases.length)];
        const d = document.createElement('div');
        d.className = `dmg-number ${tamano} ${claseColor} ${rot}`.trim();
        if (crit) d.classList.add('dmg-critical');
        if (escudo) d.classList.add('dmg-shield');
        if (esEspecial) d.classList.add('dmg-special');
        const labelHtml = crit ? `<span class="dmg-label">💥</span>` : '';
        d.innerHTML = `${labelHtml}<span class="dmg-value">${Math.floor(cantidad)}</span>`;

        // 🆕 SIEMPRE en document.body (position:fixed) para que no se recorte
        d.style.position = 'fixed';
        d.style.zIndex = '99999';
        d.style.pointerEvents = 'none';
        d.style.left = `${x}px`;
        d.style.top = `${y}px`;
        d.style.transform = 'translate(-50%, -50%)';
        const offsetX = (Math.random() - 0.5) * 20;
        d.style.marginLeft = offsetX + 'px';
        document.body.appendChild(d);

        crearFlashImpacto(x, y, crit, escudo);
        // 🆕 FIX: números más lentos para que se lean bien
        const duracion = crit ? 1800 : 1600;
        setTimeout(() => { if (d.parentNode) d.remove(); }, duracion);
    } catch (e) {}
}

function crearFlashImpacto(x, y, crit = false, escudo = false) {
    if (typeof x !== 'number' || typeof y !== 'number') return;
    try {
        const flash = document.createElement('div');
        flash.className = 'dmg-flash';
        if (crit) flash.classList.add('flash-critical');
        if (escudo) flash.classList.add('flash-shield');
        flash.style.left = `${x}px`;
        flash.style.top = `${y}px`;
        flash.style.zIndex = '99998';
        document.body.appendChild(flash);
        const duracion = crit ? 500 : 350;
        setTimeout(() => { if (flash.parentNode) flash.remove(); }, duracion);
    } catch (e) {}
}

function mostrarNumeroCuracion(x, y, cantidad) {
    if (typeof x !== 'number' || typeof y !== 'number') return;
    if (typeof cantidad !== 'number' || isNaN(cantidad)) return;
    try {
        const d = document.createElement('div');
        const abs = Math.abs(cantidad);
        let tamano = 'dmg-normal';
        if (abs >= 500) tamano = 'dmg-huge';
        else if (abs >= 200) tamano = 'dmg-large';
        d.className = `dmg-number ${tamano} dmg-heal`;
        d.innerHTML = `<span class="dmg-value">+${Math.floor(cantidad)}</span>`;

        // 🆕 SIEMPRE en document.body (position:fixed) para que no se recorte
        d.style.position = 'fixed';
        d.style.zIndex = '99999';
        d.style.pointerEvents = 'none';
        d.style.left = `${x}px`;
        d.style.top = `${y}px`;
        d.style.transform = 'translate(-50%, -50%)';
        document.body.appendChild(d);

        const flash = document.createElement('div');
        flash.className = 'dmg-flash flash-heal';
        flash.style.left = `${x}px`;
        flash.style.top = `${y}px`;
        flash.style.zIndex = '99998';
        document.body.appendChild(flash);
        setTimeout(() => {
            if (d.parentNode) d.remove();
            if (flash.parentNode) flash.remove();
        }, 1600); // 🆕 FIX: curación más lenta para leerla
    } catch (e) {}
}

function mostrarEfectoImpacto(x, y, crit = false, area = false) {
    if (typeof x !== 'number' || typeof y !== 'number') return;
    try {
        let d = document.createElement('div');
        if (crit) {
            d.style.cssText = `position:fixed;pointer-events:none;z-index:1999;border-radius:50%;${area ? `width:70px;height:70px;left:${x-35}px;top:${y-35}px;background:radial-gradient(circle,rgba(255,200,50,0.6) 0%,rgba(255,150,0,0.3) 50%,transparent 100%);` : `width:35px;height:35px;left:${x-17}px;top:${y-17}px;background:radial-gradient(circle,rgba(255,255,255,0.8) 0%,rgba(255,200,50,0.4) 50%,transparent 100%);`}animation:hitPulseCritico 0.4s ease-out forwards;`;
        } else {
            d.style.cssText = `position:fixed;pointer-events:none;z-index:1999;border-radius:50%;${area ? `width:50px;height:50px;left:${x-25}px;top:${y-25}px;background:radial-gradient(circle,rgba(255,200,0,0.5),rgba(255,100,0,0.2));` : `width:22px;height:22px;left:${x-11}px;top:${y-11}px;background:radial-gradient(circle,rgba(255,255,255,0.6),rgba(255,200,0,0.2));`}animation:hitPulse 0.25s ease-out forwards;`;
        }
        document.body.appendChild(d);
        const duracion = crit ? 400 : 300;
        setTimeout(() => { if (d.parentNode) d.remove(); }, duracion);

        // 🆕 Onda de choque expansiva para hits de área / definitivas
        if (area) {
            let aro = document.createElement('div');
            aro.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:80px;height:80px;border-radius:50%;border:3px solid rgba(255,220,120,0.8);box-shadow:0 0 14px rgba(255,180,60,0.6) inset, 0 0 14px rgba(255,180,60,0.6);pointer-events:none;z-index:1998;animation:shockwaveRing 0.42s ease-out forwards;`;
            document.body.appendChild(aro);
            setTimeout(() => { if (aro.parentNode) aro.remove(); }, 440);
        }
    } catch (e) {}
}

// ============================================================
// 🎵 SONIDOS
// ============================================================

// ============================================================
// 🆕 SONIDO DE GOLPE MELEE - MP3 (reemplaza el sintetizado)
// ============================================================

let _meleeAudioCache = {};

function playSonidoGolpeMelee(tipo, esCritico = false) {
    // 🆕 Volumen según crítico
    let volumen = esCritico ? 0.55 : 0.4;

    // 🆕 Aplicar volumen global de efectos (ajustes)
    if (typeof window._volumenEfectosActual === 'number') {
        volumen = volumen * (window._volumenEfectosActual / 0.5);
        if (volumen < 0) volumen = 0;
        if (volumen > 1) volumen = 1;
    }

    // 🆕 Elegir archivo (normal vs crítico)
    const archivo = esCritico ? 'golpe-melee-critico.mp3' : 'golpe-melee.mp3';
    const url = CONFIG.SOUND_BASE_URL + 'movimientos/' + archivo;

    // 🆕 Reproducir (con cache)
    if (_meleeAudioCache[url]) {
        const audio = _meleeAudioCache[url];
        audio.currentTime = 0;
        audio.volume = volumen;
        audio.play().catch(() => {});
        return;
    }

    const audio = new Audio(url);
    audio.volume = volumen;
    audio.preload = 'auto';

    audio.addEventListener('canplaythrough', function() {
        _meleeAudioCache[url] = audio;
    }, { once: true });

    audio.addEventListener('error', function() {
        console.warn(`⚠️ No se encontró ${archivo}, usando fallback sintetizado`);
        _playSonidoGolpeMeleeSintetizado(tipo, esCritico);
    }, { once: true });

    audio.play().catch(() => {
        _playSonidoGolpeMeleeSintetizado(tipo, esCritico);
    });
}

// ============================================================
// 🆕 FALLBACK: si el MP3 no existe, usar el sintetizado original
// ============================================================
function _playSonidoGolpeMeleeSintetizado(tipo, esCritico = false) {
    const CONFIG = {
        'Eléctrico': { f1: 1400, f2: 400,  d: 0.10, t: 'square',   v: 0.08, r: true  },
        'Agua':      { f1: 600,  f2: 200,  d: 0.14, t: 'sine',     v: 0.07, r: false },
        'Fuego':     { f1: 500,  f2: 150,  d: 0.12, t: 'triangle', v: 0.08, r: false },
        'Planta':    { f1: 700,  f2: 250,  d: 0.12, t: 'triangle', v: 0.07, r: false },
        'Hielo':     { f1: 1800, f2: 600,  d: 0.10, t: 'sine',     v: 0.07, r: true  },
        'Psíquico':  { f1: 900,  f2: 300,  d: 0.14, t: 'sine',     v: 0.07, r: false },
        'Siniestro': { f1: 350,  f2: 100,  d: 0.16, t: 'sawtooth', v: 0.08, r: false },
        'Hada':      { f1: 1100, f2: 500,  d: 0.10, t: 'sine',     v: 0.07, r: false },
        'Fantasma':  { f1: 450,  f2: 120,  d: 0.18, t: 'sine',     v: 0.07, r: false },
        'Lucha':     { f1: 400,  f2: 120,  d: 0.10, t: 'square',   v: 0.09, r: true  },
        'Veneno':    { f1: 550,  f2: 180,  d: 0.14, t: 'sawtooth', v: 0.07, r: false },
        'Dragón':    { f1: 800,  f2: 200,  d: 0.16, t: 'sawtooth', v: 0.08, r: false },
        'Roca':      { f1: 250,  f2: 80,   d: 0.14, t: 'square',   v: 0.09, r: true  },
        'Normal':    { f1: 550,  f2: 200,  d: 0.10, t: 'square',   v: 0.07, r: true  },
        'Volador':   { f1: 1000, f2: 400,  d: 0.12, t: 'sine',     v: 0.07, r: false },
        'Acero':     { f1: 1600, f2: 600,  d: 0.10, t: 'square',   v: 0.08, r: true  },
        'Eevee':     { f1: 800,  f2: 300,  d: 0.12, t: 'triangle', v: 0.07, r: false }
    };
    const cfg = CONFIG[tipo] || CONFIG['Normal'];
    let vol = esCritico ? cfg.v * 1.4 : cfg.v;
    if (typeof window._volumenEfectosActual === 'number') {
        vol = vol * (window._volumenEfectosActual / 0.5);
        if (vol < 0) vol = 0;
        if (vol > 1) vol = 1;
    }
    const dur = esCritico ? cfg.d * 1.2 : cfg.d;
    if (!window._audioCtxProyectil) {
        try { window._audioCtxProyectil = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    }
    const ctx = window._audioCtxProyectil;
    if (!ctx || ctx.state === 'suspended') return;
    try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = cfg.t;
        osc.frequency.setValueAtTime(cfg.f1, now);
        osc.frequency.exponentialRampToValueAtTime(cfg.f2, now + dur);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(vol, now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.00001, now + dur);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + dur + 0.02);
        if (cfg.r) {
            const bs = Math.floor(ctx.sampleRate * 0.03);
            const buf = ctx.createBuffer(1, bs, ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < bs; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bs);
            const noise = ctx.createBufferSource(); noise.buffer = buf;
            const ng = ctx.createGain();
            ng.gain.setValueAtTime(vol * 0.6, now);
            ng.gain.exponentialRampToValueAtTime(0.00001, now + 0.03);
            noise.connect(ng); ng.connect(ctx.destination);
            noise.start(now);
        }
    } catch (e) {}
}

function playSonidoProyectilBasico(tipo) {
    const CONFIG = {
        'Eléctrico': { f1: 1200, f2: 800,  d: 0.14, t: 'square',   v: 0.05 },
        'Agua':      { f1: 400,  f2: 600,  d: 0.18, t: 'sine',     v: 0.06 },
        'Fuego':     { f1: 300,  f2: 500,  d: 0.16, t: 'triangle', v: 0.06 },
        'Planta':    { f1: 500,  f2: 700,  d: 0.15, t: 'triangle', v: 0.05 },
        'Hielo':     { f1: 1400, f2: 1000, d: 0.16, t: 'sine',     v: 0.05 },
        'Psíquico':  { f1: 600,  f2: 1200, d: 0.18, t: 'sine',     v: 0.05 },
        'Siniestro': { f1: 200,  f2: 300,  d: 0.20, t: 'sawtooth', v: 0.05 },
        'Hada':      { f1: 900,  f2: 1400, d: 0.14, t: 'sine',     v: 0.05 },
        'Fantasma':  { f1: 350,  f2: 250,  d: 0.22, t: 'sine',     v: 0.05 },
        'Lucha':     { f1: 250,  f2: 180,  d: 0.14, t: 'square',   v: 0.06 },
        'Veneno':    { f1: 450,  f2: 300,  d: 0.18, t: 'sawtooth', v: 0.05 },
        'Dragón':    { f1: 700,  f2: 400,  d: 0.20, t: 'sawtooth', v: 0.05 },
        'Roca':      { f1: 150,  f2: 200,  d: 0.16, t: 'square',   v: 0.06 },
        'Normal':    { f1: 500,  f2: 350,  d: 0.14, t: 'square',   v: 0.05 },
        'Volador':   { f1: 800,  f2: 1100, d: 0.15, t: 'sine',     v: 0.05 },
        'Acero':     { f1: 1000, f2: 700,  d: 0.14, t: 'square',   v: 0.05 },
        'Eevee':     { f1: 700,  f2: 900,  d: 0.15, t: 'triangle', v: 0.05 }
    };
    const cfg = CONFIG[tipo] || CONFIG['Normal'];
    // 🆕 Aplicar volumen global de efectos
    let volFinal = cfg.v;
    if (typeof window._volumenEfectosActual === 'number') {
        volFinal = volFinal * (window._volumenEfectosActual / 0.5);
        if (volFinal < 0) volFinal = 0;
        if (volFinal > 1) volFinal = 1;
    }
    if (!window._audioCtxProyectil) {
        try { window._audioCtxProyectil = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    }
    const ctx = window._audioCtxProyectil;
    if (!ctx || ctx.state === 'suspended') return;
    try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = cfg.t;
        osc.frequency.setValueAtTime(cfg.f1, now);
        osc.frequency.exponentialRampToValueAtTime(cfg.f2, now + cfg.d);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(volFinal, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.00001, now + cfg.d);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + cfg.d + 0.02);
    } catch (e) {}
}

// ============================================================
// 🎯 SONIDO DE CRÍTICO - v2 (más grave y contundente)
// ============================================================
// Antes: ding agudo tipo "triángulo" a 1800-2400 Hz → muy agudo.
// Ahora: golpe grave con cuerpo (square 180 Hz) + "thump" seco
// (sine 90 Hz) + un toque metálico suave (sine 600 Hz) que da
// carácter sin resultar estridente.
// ============================================================

function playSonidoCritico() {
    if (!window._audioCtxProyectil) {
        try {
            window._audioCtxProyectil = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) { return; }
    }
    const ctx = window._audioCtxProyectil;
    if (!ctx || ctx.state === 'suspended') return;

    // 🆕 Aplicar volumen global de efectos
    let multEfectos = 1;
    if (typeof window._volumenEfectosActual === 'number') {
        multEfectos = window._volumenEfectosActual / 0.5;
        if (multEfectos < 0) multEfectos = 0;
        if (multEfectos > 1) multEfectos = 1;
    }

    try {
        const now = ctx.currentTime;

        // ---- 1) Golpe principal: grave y contundente (square 180 → 90 Hz) ----
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(180, now);
        osc1.frequency.exponentialRampToValueAtTime(90, now + 0.12);
        gain1.gain.setValueAtTime(0.0001, now);
        gain1.gain.exponentialRampToValueAtTime(0.16 * multEfectos, now + 0.008);
        gain1.gain.exponentialRampToValueAtTime(0.00001, now + 0.18);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.2);

        // ---- 2) "Thump" seco: sine 90 → 45 Hz (el golpe de impacto) ----
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(90, now);
        osc2.frequency.exponentialRampToValueAtTime(45, now + 0.1);
        gain2.gain.setValueAtTime(0.0001, now);
        gain2.gain.exponentialRampToValueAtTime(0.22 * multEfectos, now + 0.005);
        gain2.gain.exponentialRampToValueAtTime(0.00001, now + 0.22);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now);
        osc2.stop(now + 0.25);

        // ---- 3) Toque metálico suave: sine 600 → 450 Hz (carácter de crítico) ----
        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(600, now + 0.01);
        osc3.frequency.exponentialRampToValueAtTime(450, now + 0.2);
        gain3.gain.setValueAtTime(0.0001, now + 0.01);
        gain3.gain.exponentialRampToValueAtTime(0.07 * multEfectos, now + 0.02);
        gain3.gain.exponentialRampToValueAtTime(0.00001, now + 0.22);
        osc3.connect(gain3);
        gain3.connect(ctx.destination);
        osc3.start(now + 0.01);
        osc3.stop(now + 0.25);

        // ---- 4) Ruido corto de impacto (snare grave, sin agudos) ----
        const bs = Math.floor(ctx.sampleRate * 0.06);
        const buf = ctx.createBuffer(1, bs, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bs; i++) {
            const t = i / bs;
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2) * 0.6;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const biquad = ctx.createBiquadFilter();
        biquad.type = 'lowpass';
        biquad.frequency.setValueAtTime(800, now);
        biquad.frequency.exponentialRampToValueAtTime(200, now + 0.06);
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0.10 * multEfectos, now);
        ng.gain.exponentialRampToValueAtTime(0.00001, now + 0.06);
        noise.connect(biquad);
        biquad.connect(ng);
        ng.connect(ctx.destination);
        noise.start(now);

    } catch (e) {
        console.warn('⚠️ playSonidoCritico falló:', e);
    }
}

function mostrarProyectilBasico(atacante, objetivo, elementoOrigen, elementoDestino) {
    if (!atacante || !objetivo) return;
    if (!elementoOrigen || !elementoDestino) return;
    try {
        const rO = elementoOrigen.getBoundingClientRect();
        const rD = elementoDestino.getBoundingClientRect();
        const x1 = rO.left + rO.width / 2, y1 = rO.top + rO.height / 2;
        const x2 = rD.left + rD.width / 2, y2 = rD.top + rD.height / 2;
        let tipoP = 'Normal';
        if (atacante.pokemon && atacante.pokemon.tipos && atacante.pokemon.tipos.length > 0) tipoP = atacante.pokemon.tipos[0];
        const cfg = CONFIGURACION_PROYECTILES[tipoP] || CONFIGURACION_PROYECTILES['Normal'];
        const proy = document.createElement('div');
        proy.style.cssText = `position:fixed;left:${x1}px;top:${y1}px;width:22px;height:22px;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);filter:drop-shadow(0 0 8px ${cfg.glow}) drop-shadow(0 0 16px ${cfg.glow});`;
        const svgFn = SVG_PROYECTILES[tipoP] || SVG_PROYECTILES['Normal'];
        proy.innerHTML = svgFn(cfg);
        document.body.appendChild(proy);
        playSonidoProyectilBasico(tipoP);
        const dx = x2 - x1, dy = y2 - y1;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const dur = Math.max(180, Math.min(450, dist * 0.6));
        const angulo = Math.atan2(dy, dx) * 180 / Math.PI;
        const gira = ['Planta','Volador','Fuego','Hada','Fantasma','Dragón'].includes(tipoP);
        const kf = gira
            ? [{ transform: `translate(-50%,-50%) scale(0.4) rotate(0deg)`, opacity: 0 }, { transform: `translate(-50%,-50%) scale(1.15) rotate(${angulo + 90}deg)`, opacity: 1, offset: 0.15 }, { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1) rotate(${angulo + 720}deg)`, opacity: 1, offset: 1 }]
            : [{ transform: 'translate(-50%,-50%) scale(0.4)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1.15)', opacity: 1, offset: 0.12 }, { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1)`, opacity: 1, offset: 1 }];
        const anim = proy.animate(kf, { duration: dur, easing: 'cubic-bezier(0.3, 0, 0.7, 1)', fill: 'forwards' });
        anim.onfinish = () => {
            if (proy.parentNode) proy.remove();
            // 🆕 Flash de impacto con el color del tipo
            try {
                const impact = document.createElement('div');
                impact.style.cssText = `position:fixed;left:${x2}px;top:${y2}px;width:44px;height:44px;border-radius:50%;background:radial-gradient(circle,${cfg.color1} 0%,${cfg.color2} 45%,transparent 75%);pointer-events:none;z-index:9998;animation:typeImpactFlash 0.32s ease-out forwards;`;
                document.body.appendChild(impact);
                setTimeout(() => { if (impact.parentNode) impact.remove(); }, 320);
            } catch (e2) {}
        };
    } catch (e) {}
}

function mostrarRayoShock(x, y, elemento = null) {
    if (typeof x !== 'number' || typeof y !== 'number') return;
    try {
        if (elemento && elemento.style) {
            elemento.style.animation = 'shockFlash 0.45s ease';
            setTimeout(() => { if (elemento && elemento.style) elemento.style.animation = ''; }, 450);
        }
        const rayo = document.createElement('div');
        rayo.className = 'shock-rayo';
        rayo.style.left = `${x}px`; rayo.style.top = `${y}px`;
        rayo.innerHTML = '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M13 2 L4.5 13.5 H11 L10 22 L19.5 9.5 H13 L13 2 Z" fill="#ffd54f" stroke="#fff7cc" stroke-width="1" stroke-linejoin="round"/></svg>';
        document.body.appendChild(rayo);
        setTimeout(() => { if (rayo.parentNode) rayo.remove(); }, 750);
    } catch (e) {}
}

function mostrarNevadaHielo(x, y, elemento = null) {
    if (typeof x !== 'number' || typeof y !== 'number') return;
    try {
        if (elemento && elemento.style) {
            elemento.style.animation = 'frostFlash 0.5s ease';
            setTimeout(() => { if (elemento && elemento.style) elemento.style.animation = ''; }, 500);
        }
        const copo = document.createElement('div');
        copo.className = 'frost-copo';
        copo.style.left = `${x}px`; copo.style.top = `${y}px`;
        copo.innerHTML = '<svg viewBox="0 0 24 24" width="100%" height="100%"><g stroke="#cfefff" stroke-width="1.5" stroke-linecap="round" fill="none"><line x1="12" y1="1" x2="12" y2="23"/><line x1="2.5" y1="6.5" x2="21.5" y2="17.5"/><line x1="2.5" y1="17.5" x2="21.5" y2="6.5"/></g></svg>';
        document.body.appendChild(copo);
        setTimeout(() => { if (copo.parentNode) copo.remove(); }, 800);
    } catch (e) {}
}

function animarUnidadDaño(el) {
    if (!el || !el.style) return;
    try {
        el.style.animation = 'damageShake 0.25s';
        setTimeout(() => { if (el && el.style) el.style.animation = ''; }, 250);
    } catch (e) {}
}

function animarSpriteCritico(elemento) {
    if (!elemento || typeof elemento.querySelector !== 'function') return;
    try {
        const sprite = elemento.querySelector('.unit-sprite');
        if (sprite && sprite.style) {
            sprite.style.transition = 'filter 0.1s ease, transform 0.15s ease';
            sprite.style.filter = 'brightness(2) saturate(0)';
            sprite.style.transform = 'scale(1.05)';
            setTimeout(() => {
                if (sprite && sprite.style) {
                    sprite.style.filter = 'brightness(1) saturate(1)';
                    sprite.style.transform = 'scale(1)';
                    sprite.style.transition = 'filter 0.3s ease, transform 0.3s ease';
                }
            }, 150);
        }
    } catch (e) {}
}

function animarUnidadRecibeDaño(elemento, crit = false) {
    if (!elemento || !elemento.style) return;
    try {
        elemento.style.animation = crit ? 'damageShakeCritico 0.3s ease' : 'damageShake 0.25s ease';
        setTimeout(() => { if (elemento && elemento.style) elemento.style.animation = ''; }, crit ? 300 : 250);
        const sprite = elemento.querySelector('.unit-sprite');
        if (sprite && sprite.style) {
            if (crit) {
                sprite.style.transition = 'filter 0.08s ease';
                sprite.style.filter = 'brightness(2) saturate(0)';
                setTimeout(() => {
                    if (sprite && sprite.style) {
                        sprite.style.filter = 'brightness(1) saturate(1)';
                        sprite.style.transition = 'filter 0.3s ease';
                    }
                }, 120);
            } else {
                sprite.style.transition = 'filter 0.08s ease';
                sprite.style.filter = 'brightness(1.4)';
                setTimeout(() => {
                    if (sprite && sprite.style) {
                        sprite.style.filter = 'brightness(1)';
                        sprite.style.transition = 'filter 0.3s ease';
                    }
                }, 80);
            }
        }
    } catch (e) {}
}

// ============================================================
// 🎯 PESO DEL IMPACTO: knockback direccional + screen shake + faint
// ============================================================
function animarKnockbackGolpe(elemento, dirX, dirY, intensidad = 12, crit = false) {
    if (!elemento) return;
    try {
        const sprite = elemento.querySelector('.unit-sprite');
        if (!sprite || !sprite.animate) return;
        const len = Math.sqrt(dirX * dirX + dirY * dirY);
        if (len < 1) return;
        const ux = dirX / len, uy = dirY / len;
        const kb = crit ? intensidad * 1.6 : intensidad;
        sprite.animate([
            { transform: 'translate(0px,0px) scaleX(var(--sprite-flip,1)) scale(var(--sprite-scale,1))' },
            { transform: `translate(${ux * kb}px,${uy * kb}px) scaleX(var(--sprite-flip,1)) scale(calc(var(--sprite-scale,1) * 0.96))`, offset: 0.35 },
            { transform: `translate(${ux * kb * 0.3}px,${uy * kb * 0.3}px) scaleX(var(--sprite-flip,1)) scale(var(--sprite-scale,1))`, offset: 1 }
        ], { duration: crit ? 320 : 240, easing: 'cubic-bezier(0.22, 0.9, 0.36, 1)', fill: 'none' });
    } catch (e) {}
}

let _ultimoShake = 0;
function screenShake(intensidad = 3, duracion = 160) {
    // 🛑 DESACTIVADO: movía todo el .arena-row (paneles, bancos y tablero)
    // y mareaba. El impacto ya se transmite con el knockback del sprite.
    return;
}

function efectoFaintDesaparicion(elemento) {
    if (!elemento || typeof elemento.getBoundingClientRect !== 'function') return;
    try {
        const r = elemento.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const colores = ['#ffffff', '#cbd5e1', '#aab8cc', '#8b9bb0'];
        for (let i = 0; i < 10; i++) {
            const p = document.createElement('div');
            const size = 3 + Math.random() * 5;
            const ang = Math.random() * Math.PI * 2;
            const horizontal = Math.cos(ang) * (20 + Math.random() * 30);
            const vertical = -Math.abs(Math.sin(ang)) * (30 + Math.random() * 20) - (10 + Math.random() * 20);
            const color = colores[Math.floor(Math.random() * colores.length)];
            p.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:${size}px;height:${size}px;margin-left:${-size / 2}px;margin-top:${-size / 2}px;background:${color};border-radius:50%;pointer-events:none;z-index:5000;--dx:${horizontal}px;--dy:${vertical}px;box-shadow:0 0 6px ${color};animation:sparkleBurst 0.7s ease-out forwards;`;
            document.body.appendChild(p);
            setTimeout(() => { if (p.parentNode) p.remove(); }, 700);
        }
    } catch (e) {}
}

// 🆕 Animación de "recogida a Pokéball" al eliminar a un Pokémon.
// El sprite se encoge hacia el centro mientras aparece una Pokéball
// dibujada con CSS con un pequeño "pop" y destello rojo.
function efectoRecogidaPokeball(elemento) {
    if (!elemento || typeof elemento.getBoundingClientRect !== 'function') return;
    try {
        // Añade la animación de "succión" al sprite (si existe)
        const sprite = elemento.querySelector ? elemento.querySelector('.unit-sprite') : null;
        if (sprite && sprite.classList) sprite.classList.add('recall-suck');

        // Centrar la Pokéball sobre el sprite (o la celda si no hay sprite)
        const ref = (sprite && typeof sprite.getBoundingClientRect === 'function') ? sprite.getBoundingClientRect() : elemento.getBoundingClientRect();
        const cx = ref.left + ref.width / 2;
        const cy = ref.top + ref.height / 2;

        // Pokéball como overlay fijo (independiente de la opacidad de la celda)
        const ball = document.createElement('div');
        ball.className = 'pokeball-recall';
        ball.style.left = `${cx}px`;
        ball.style.top = `${cy}px`;
        document.body.appendChild(ball);
        setTimeout(() => { if (ball.parentNode) ball.remove(); }, 600);
    } catch (e) {}
}

function animarBarraVidaPokemon(elemento, hp, maxHp) {
    if (!elemento || typeof elemento.querySelector !== 'function') return;
    if (typeof hp !== 'number' || typeof maxHp !== 'number' || maxHp <= 0) return;
    try {
        let percent = (hp / maxHp) * 100;
        let barFill = elemento.querySelector('.hp-fill');
        if (!barFill || !barFill.style) return;
        barFill.style.transition = 'width 0.4s ease-out';
        barFill.style.width = `${Math.min(100, percent)}%`;
        let color, sc;
        if (percent > 50) { color = '#22c55e'; sc = 'rgba(34, 197, 94, 0.3)'; }
        else if (percent > 25) { color = '#eab308'; sc = 'rgba(234, 179, 8, 0.3)'; }
        else if (percent > 10) { color = '#f97316'; sc = 'rgba(249, 115, 22, 0.3)'; }
        else { color = '#ef4444'; sc = 'rgba(239, 68, 68, 0.3)'; }
        barFill.style.background = color;
        barFill.style.boxShadow = `0 0 16px ${sc}`;
    } catch (e) {}
}

// ============================================================
// ===== KEYFRAMES =====
// ============================================================

(function agregarEstilosPokemon() {
    try {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes damageShake { 0%,100%{transform:scaleX(var(--sprite-flip,1)) translateX(0);} 25%{transform:scaleX(var(--sprite-flip,1)) translateX(-4px);} 75%{transform:scaleX(var(--sprite-flip,1)) translateX(4px);} }
            @keyframes damageShakeCritico { 0%,100%{transform:scaleX(var(--sprite-flip,1)) translateX(0);} 20%{transform:scaleX(var(--sprite-flip,1)) translateX(-6px);} 40%{transform:scaleX(var(--sprite-flip,1)) translateX(6px);} 60%{transform:scaleX(var(--sprite-flip,1)) translateX(-4px);} 80%{transform:scaleX(var(--sprite-flip,1)) translateX(4px);} }
            @keyframes attackSwing { 0%{transform:scaleX(var(--sprite-flip,1)) scale(var(--sprite-scale,1));} 40%{transform:scaleX(var(--sprite-flip,1)) scale(calc(var(--sprite-scale,1) * 1.08));} 100%{transform:scaleX(var(--sprite-flip,1)) scale(var(--sprite-scale,1));} }
            @keyframes attackSwingCritico { 0%{transform:scaleX(var(--sprite-flip,1)) scale(var(--sprite-scale,1));} 30%{transform:scaleX(var(--sprite-flip,1)) scale(calc(var(--sprite-scale,1) * 1.15));} 60%{transform:scaleX(var(--sprite-flip,1)) scale(calc(var(--sprite-scale,1) * 0.95));} 100%{transform:scaleX(var(--sprite-flip,1)) scale(var(--sprite-scale,1));} }
            @keyframes knockbackStagger { 0%{transform:rotate(0deg) scaleX(var(--sprite-flip,1)) scale(var(--sprite-scale,1));} 15%{transform:rotate(-10deg) scaleX(var(--sprite-flip,1)) scale(var(--sprite-scale,1));} 35%{transform:rotate(8deg) scaleX(var(--sprite-flip,1)) scale(var(--sprite-scale,1));} 55%{transform:rotate(-6deg) scaleX(var(--sprite-flip,1)) scale(var(--sprite-scale,1));} 75%{transform:rotate(4deg) scaleX(var(--sprite-flip,1)) scale(var(--sprite-scale,1));} 100%{transform:rotate(0deg) scaleX(var(--sprite-flip,1)) scale(var(--sprite-scale,1));} }
            @keyframes knockupAirborne { 0%{transform:translateY(0) scaleX(var(--sprite-flip,1)) scale(var(--sprite-scale,1));} 30%{transform:translateY(-14px) scaleX(var(--sprite-flip,1)) scale(var(--sprite-scale,1));} 60%{transform:translateY(-16px) scaleX(var(--sprite-flip,1)) scale(var(--sprite-scale,1));} 85%{transform:translateY(-6px) scaleX(var(--sprite-flip,1)) scale(var(--sprite-scale,1));} 100%{transform:translateY(0) scaleX(var(--sprite-flip,1)) scale(var(--sprite-scale,1));} }
            @keyframes hitPulse { 0%{transform:scale(0);opacity:0.8;} 100%{transform:scale(1.5);opacity:0;} }
            @keyframes hitPulseCritico { 0%{transform:scale(0);opacity:0.9;} 40%{transform:scale(1.8);opacity:0.6;} 100%{transform:scale(2.2);opacity:0;} }
            @keyframes shockFlash { 0%{filter:brightness(2.3) saturate(0.2);} 100%{filter:brightness(1) saturate(1);} }
            @keyframes frostFlash { 0%{filter:brightness(2) saturate(0.3) hue-rotate(180deg);} 100%{filter:brightness(1) saturate(1) hue-rotate(0deg);} }
            @keyframes dmgPop { 0%{opacity:0;transform:scale(0.3) translateY(0);} 25%{opacity:1;transform:scale(1.35) translateY(-12px);} 45%{transform:scale(1) translateY(-25px);} 100%{opacity:0;transform:scale(0.95) translateY(-90px);} }
            @keyframes dmgPopCritical { 0%{opacity:0;transform:scale(0.2) translateY(0) rotate(-12deg);} 20%{opacity:1;transform:scale(1.7) translateY(-15px) rotate(6deg);} 40%{transform:scale(1.15) translateY(-35px) rotate(-3deg);} 55%{transform:scale(1.25) translateY(-50px) rotate(2deg);} 100%{opacity:0;transform:scale(0.9) translateY(-120px) rotate(0deg);} }
            @keyframes dmgHeal { 0%{opacity:0;transform:scale(0.3) translateY(0);} 30%{opacity:1;transform:scale(1.25) translateY(-15px);} 100%{opacity:0;transform:scale(0.95) translateY(-85px);} }
            @keyframes dmgFlash { 0%{opacity:1;transform:scale(0.3);} 40%{opacity:0.9;transform:scale(1);} 100%{opacity:0;transform:scale(1.6);} }
            @keyframes dmgFlashCritical { 0%{opacity:1;transform:scale(0.2) rotate(0deg);} 30%{opacity:1;transform:scale(1.15) rotate(15deg);} 60%{opacity:0.9;transform:scale(1.3) rotate(-8deg);} 100%{opacity:0;transform:scale(1.7) rotate(0deg);} }
            @keyframes critLabelPop { 0%{opacity:0;transform:scale(0.3) rotate(-25deg);} 30%{opacity:1;transform:scale(1.6) rotate(10deg);} 55%{transform:scale(0.95) rotate(-5deg);} 100%{opacity:1;transform:scale(1) rotate(0deg);} }
            @keyframes proyectilImpacto { 0%{opacity:1;transform:translate(-50%,-50%) scale(1);} 50%{opacity:0.6;transform:translate(-50%,-50%) scale(1.8);} 100%{opacity:0;transform:translate(-50%,-50%) scale(2.5);} }
            @keyframes sparkleBurst { 0%{opacity:1;transform:translate(0,0) scale(1);} 100%{opacity:0;transform:translate(var(--dx,0),var(--dy,0)) scale(0.2);} }
            @keyframes evolOverlayFadeIn { 0%{opacity:0;} 100%{opacity:1;} }
            @keyframes evolOverlayFadeOut { 0%{opacity:1;} 100%{opacity:0;} }
            @keyframes evolCardPop { 0%{transform:scale(0.3) rotate(-8deg);opacity:0;} 60%{transform:scale(1.08) rotate(2deg);opacity:1;} 80%{transform:scale(0.96) rotate(-1deg);} 100%{transform:scale(1) rotate(0deg);opacity:1;} }
            @keyframes evolSiluetaTemblor { 0%,100%{transform:translate(0,0) scale(1);} 25%{transform:translate(-3px,2px) scale(1.01);} 50%{transform:translate(3px,-2px) scale(1.01);} 75%{transform:translate(-2px,-1px) scale(1.01);} }
            @keyframes evolGlowPulse { 0%,100%{opacity:0.6;} 50%{opacity:1;} }
            @keyframes evolRevealPop { 0%{transform:scale(0.6) rotate(-10deg);opacity:0;} 50%{transform:scale(1.15) rotate(3deg);opacity:1;} 100%{transform:scale(1) rotate(0deg);opacity:1;} }
            @keyframes evolStarPop { 0%{transform:scale(0) rotate(-180deg);opacity:0;} 60%{transform:scale(1.3) rotate(10deg);opacity:1;} 100%{transform:scale(1) rotate(0deg);opacity:1;} }
            @keyframes evolQuestion { 0%{opacity:0;transform:scale(0.3) rotate(-15deg);} 20%{opacity:1;transform:scale(1.3) rotate(5deg);} 40%{transform:scale(1) rotate(0deg);} 70%{opacity:1;transform:scale(1.05) rotate(-3deg);} 100%{opacity:0;transform:scale(1.4) rotate(0deg);} }
            @keyframes evolFlashRadial { 0%{opacity:0;transform:scale(0.2);} 20%{opacity:1;transform:scale(0.8);} 50%{opacity:1;transform:scale(1.15);} 100%{opacity:0;transform:scale(1.6);} }
            @keyframes shockwaveRing { 0%{opacity:0.85;transform:translate(-50%,-50%) scale(0.1);} 100%{opacity:0;transform:translate(-50%,-50%) scale(1);} }
            @keyframes typeImpactFlash { 0%{opacity:0.9;transform:translate(-50%,-50%) scale(0.2);} 60%{opacity:0.5;transform:translate(-50%,-50%) scale(1.4);} 100%{opacity:0;transform:translate(-50%,-50%) scale(2.2);} }
        `;
        document.head.appendChild(style);
    } catch (e) {}
})();

// ============================================================
// ===== ACTUALIZAR COPIA DE ESTADÍSTICAS =====
// ============================================================
// 🆕 FIX: implementación única en js/systems/combate.js. Esta copia
// (cargada después) pisaba la buena y perdía:
//   - el guard de NaN / valores > 5000 (DoT desbordando el panel)
//   - la sincronización de `copia.muerto`
// Se eliminó.



// ============================================================
// ===== ANIMAR ATAQUE =====
// ============================================================

function mostrarAnimacionAtaquePokemon(origen, destino, daño, crit = false, area = false, esEspecial = false, esMeleeForzado = null) {
    let esMeleeVisual = false, distX = 0, distY = 0;
    if (origen && origen.elemento && destino && destino.elemento) {
        try {
            const rO = origen.elemento.getBoundingClientRect();
            const rD = destino.elemento.getBoundingClientRect();
            distX = (rD.left + rD.width / 2) - (rO.left + rO.width / 2);
            distY = (rD.top + rD.height / 2) - (rO.top + rO.height / 2);
            const distancia = Math.sqrt(distX * distX + distY * distY);
            if (typeof esMeleeForzado === 'boolean') esMeleeVisual = esMeleeForzado;
            else esMeleeVisual = distancia < 150;
        } catch (e) {
            if (typeof esMeleeForzado === 'boolean') esMeleeVisual = esMeleeForzado;
        }
    } else if (typeof esMeleeForzado === 'boolean') esMeleeVisual = esMeleeForzado;

    if (origen && origen.elemento && origen.elemento.style) {
        try {
            if (esMeleeVisual) {
                const sprite = origen.elemento.querySelector('.unit-sprite');
                if (sprite && sprite.style) {
                    const transformOriginal = sprite.style.transform || '';
                    const offsetX = Math.max(-60, Math.min(60, distX * 0.4));
                    const offsetY = Math.max(-60, Math.min(60, distY * 0.4));
                    // 🆕 wind-up: el sprite retrocede un poco antes de embestir
                    const lenGolpe = Math.max(1, Math.sqrt(distX * distX + distY * distY));
                    const nx = distX / lenGolpe, ny = distY / lenGolpe;
                    const windup = 10;
                    const anim = sprite.animate([
                        { transform: `translate(0,0) scaleX(var(--sprite-flip,1)) scale(var(--sprite-scale,1))`, offset: 0 },
                        { transform: `translate(${-nx * windup}px,${-ny * windup}px) scaleX(var(--sprite-flip,1)) scale(calc(var(--sprite-scale,1) * 0.97))`, offset: 0.14 },
                        { transform: `translate(${offsetX * 0.6}px,${offsetY * 0.6}px) scaleX(var(--sprite-flip,1)) scale(calc(var(--sprite-scale,1) * 1.08))`, offset: 0.3 },
                        { transform: `translate(${offsetX}px,${offsetY}px) scaleX(var(--sprite-flip,1)) scale(calc(var(--sprite-scale,1) * 1.12))`, offset: 0.45 },
                        { transform: `translate(${offsetX}px,${offsetY}px) scaleX(var(--sprite-flip,1)) scale(calc(var(--sprite-scale,1) * 1.05))`, offset: 0.6 },
                        { transform: `translate(${offsetX * 0.5}px,${offsetY * 0.5}px) scaleX(var(--sprite-flip,1)) scale(calc(var(--sprite-scale,1) * 1.04))`, offset: 0.8 },
                        { transform: `translate(0,0) scaleX(var(--sprite-flip,1)) scale(var(--sprite-scale,1))`, offset: 1 }
                    ], { duration: crit ? 380 : 320, easing: 'cubic-bezier(0.34, 1.2, 0.64, 1)', fill: 'none' });
                    anim.onfinish = () => { if (sprite && sprite.style) sprite.style.transform = transformOriginal; };
                }
            } else {
                const sprite = origen.elemento.querySelector('.unit-sprite');
                if (sprite && sprite.style) {
                    sprite.style.animation = crit ? 'attackSwingCritico 0.2s ease' : 'attackSwing 0.12s ease';
                    setTimeout(() => { if (sprite && sprite.style) sprite.style.animation = ''; }, crit ? 200 : 120);
                }
            }
        } catch (e) {}
    }

    if (!destino) return;
    if (typeof destino.x !== 'number' || typeof destino.y !== 'number') return;

    if (esMeleeVisual) {
        let tipoSonido = 'Normal';
        const uo = origen && (origen.unidad || origen);
        if (uo && uo.pokemon && uo.pokemon.tipos) tipoSonido = uo.pokemon.tipos[0] || 'Normal';
        playSonidoGolpeMelee(tipoSonido, crit);

        // 🎯 Sonido extra de crítico (solo en melee)
        if (crit && typeof playSonidoCritico === 'function') {
            playSonidoCritico();
        }
    }

    mostrarEfectoImpacto(destino.x, destino.y, crit, area);

    // 🆕 PESO DEL IMPACTO: knockback direccional + screen shake en críticos
    if (destino.elemento && (esMeleeVisual || crit)) {
        animarKnockbackGolpe(destino.elemento, distX, distY, esMeleeVisual ? 12 : 8, crit);
    }

    const tieneEscudo = !!(destino.unidad && destino.unidad.escudoActual > 0);
    mostrarNumeroDaño(destino.x, destino.y - 10, daño, crit, tieneEscudo, esEspecial, destino.elemento || null);

    if (destino.elemento && destino.elemento.style) {
        try {
            animarUnidadRecibeDaño(destino.elemento, crit);
            if (destino.unidad && typeof destino.unidad.hp === 'number') {
                animarBarraVidaPokemon(destino.elemento, destino.unidad.hp, destino.unidad.maxHp);
            }
        } catch (e) {}
    }
}

function animarTambaleoKnockback(unidad) {
    if (!unidad) return;
    try {
        let elemento = null;
        if (typeof obtenerPosicionUnidadActual === 'function') {
            const pos = obtenerPosicionUnidadActual(unidad);
            elemento = pos && pos.elemento;
        }
        if (!elemento) return;
        const sprite = elemento.querySelector('.unit-sprite');
        if (sprite && sprite.style) {
            sprite.style.animation = 'knockbackStagger 0.6s ease';
            setTimeout(() => { if (sprite && sprite.style) sprite.style.animation = ''; }, 600);
        }
    } catch (e) {}
}

// ============================================================
// ===== SUBIDA DE ESTRELLA / MEJORA =====
// ============================================================

function mostrarAnimacionSubidaEstrella(cellElement, tipo) {
    if (!cellElement || typeof cellElement.getBoundingClientRect !== 'function') return;
    try {
        const rect = cellElement.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const flash = document.createElement('div');
        flash.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:90px;height:90px;margin-left:-45px;margin-top:-45px;border-radius:50%;background:radial-gradient(circle,#ffffff,rgba(220,230,245,0.95),transparent 72%);pointer-events:none;z-index:3000;animation:evolFlashRadial 0.9s ease-out forwards;`;
        document.body.appendChild(flash);
        setTimeout(() => { if (flash.parentNode) flash.remove(); }, 900);
        const sprite = cellElement.querySelector('.unit-sprite');
        if (sprite && sprite.style) {
            sprite.style.animation = 'evolRevealPop 0.9s ease';
            setTimeout(() => { if (sprite && sprite.style) sprite.style.animation = ''; }, 900);
        }
    } catch (e) {}
}

// ============================================================
// 🔧 HELPERS INTERNOS PARA LIMPIAR ESTILOS DE CELDAS
// ============================================================

function _limpiarEstilosCeldasTablero() {
    try {
        const celdas = document.querySelectorAll(
            '#playerBoard .board-cell, #enemigoBoard .board-cell, ' +
            '#banquilloGrid .bank-cell, #enemyBanquilloGrid .bank-cell'
        );
        celdas.forEach(cell => {
            cell.classList.remove(
                'muerto',
                'restaurando',
                'evolucionando',
                'mejora',
                'evolucion',
                'evolving',
                'evolving-gold',
                'drag-dropping',
                'drag-origen',
                'drag-over',
                'drag-over-valida',
                'drag-over-invalida',
                'selected',
                'casilla-veneno',
                'casilla-quemadura'
            );
            cell.style.opacity = '';
            cell.style.transform = '';
            cell.style.filter = '';
            cell.style.pointerEvents = '';
            cell.style.transition = '';
            cell.style.animationDelay = '';
            cell.style.animation = '';
            cell.style.visibility = '';
            cell.style.boxShadow = '';
            cell.style.background = '';
            cell.style.zIndex = '';
        });
    } catch (e) {
        console.warn('⚠️ _limpiarEstilosCeldasTablero:', e);
    }
}

function _restaurarContenedoresVisibles(containerVis, juegoVis, menuVis) {
    try {
        const contenedores = [
            { el: document.querySelector('.container'), vis: containerVis },
            { el: document.getElementById('juegoContainer'), vis: juegoVis },
            { el: document.getElementById('menuPrincipal'), vis: menuVis }
        ];
        contenedores.forEach(({ el, vis }) => {
            if (!el) return;
            const valorFinal = (vis === 'hidden') ? '' : (vis || '');
            if (el.style.visibility === 'hidden' || el.style.visibility !== valorFinal) {
                el.style.visibility = valorFinal;
            }
        });
    } catch (e) {
        console.warn('⚠️ _restaurarContenedoresVisibles:', e);
    }
}

// ============================================================
// 🎬 ANIMACIÓN DE EVOLUCIÓN - OVERLAY NEGRO + CARTA CENTRAL
// v17.6
// ============================================================

function animarEvolucionPokemon(datosPokemon) {
    return new Promise((resolve) => {
        const pokemon = datosPokemon && datosPokemon.pokemon ? datosPokemon.pokemon : null;
        const nivelFinal = (datosPokemon && typeof datosPokemon.nivel === 'number')
            ? datosPokemon.nivel
            : (pokemon && typeof pokemon.nivel === 'number' ? pokemon.nivel : 2);
        const spriteIdFinal = (datosPokemon && datosPokemon.spriteId)
            ? datosPokemon.spriteId
            : (pokemon && (pokemon.spriteId || pokemon.id) ? (pokemon.spriteId || pokemon.id) : 0);
        const nombreFinal = (pokemon && pokemon.nombre) ? pokemon.nombre : '???';

        let nombreOriginal = (datosPokemon && datosPokemon.nombreOriginal)
            ? datosPokemon.nombreOriginal
            : null;
        let spriteIdOriginal = (datosPokemon && datosPokemon.spriteIdOriginal)
            ? datosPokemon.spriteIdOriginal
            : null;

        if (!nombreOriginal || !spriteIdOriginal) {
            try {
                const todasLasUnidades = [
                    ...(typeof tablero !== 'undefined' ? tablero : []),
                    ...(typeof banquillo !== 'undefined' ? banquillo : []),
                    ...(typeof enemyBoard !== 'undefined' ? enemyBoard : []),
                    ...(typeof enemyBanquillo !== 'undefined' ? enemyBanquillo : [])
                ];
                for (let u of todasLasUnidades) {
                    if (!u || !u.pokemon) continue;
                    const uNombre = u.pokemon.nombre;
                    const uSprite = u.spriteIdAlternativo || u.pokemon.spriteId || u.pokemon.id;
                    if (uNombre === nombreFinal && uSprite === spriteIdFinal) continue;
                    let familia = null;
                    let familiaNueva = null;
                    try {
                        if (typeof getFamiliaEvolutiva === 'function') {
                            familia = getFamiliaEvolutiva(u.pokemon);
                            if (pokemon) familiaNueva = getFamiliaEvolutiva(pokemon);
                        }
                    } catch (_) {}
                    if (familia && familiaNueva && familia === familiaNueva) {
                        nombreOriginal = uNombre;
                        spriteIdOriginal = uSprite;
                        break;
                    }
                }
            } catch (e) {
                console.warn('🎬 No se pudo resolver sprite original:', e);
            }
        }

        if (!nombreOriginal) nombreOriginal = nombreFinal;
        if (!spriteIdOriginal) spriteIdOriginal = spriteIdFinal;

        try {
            if (typeof pausarFondoPreparacion === 'function') {
                pausarFondoPreparacion();
            }
        } catch (e) {}

        const juegoContainer = document.getElementById('juegoContainer');
        const containerEl = document.querySelector('.container');
        const menuPrincipalEl = document.getElementById('menuPrincipal');

        const containerDisplayAntes = containerEl ? (containerEl.style.visibility || '') : '';
        const juegoVisibilityAntes  = juegoContainer ? (juegoContainer.style.visibility || '') : '';
        const menuVisibilityAntes   = menuPrincipalEl ? (menuPrincipalEl.style.visibility || '') : '';

        _limpiarEstilosCeldasTablero();
        try {
            if (typeof renderizar === 'function') {
                renderizar();
            }
        } catch (e) {
            console.warn('⚠️ renderizar() pre-overlay falló:', e);
        }

                // ✨ SHINY: leer esShiny del datosPokemon
        const esShinyAnim = (datosPokemon && datosPokemon.esShiny === true);

        let spriteUrl = '';
        try {
            if (typeof getSpriteUrl === 'function') {
                spriteUrl = getSpriteUrl(spriteIdFinal, nombreFinal, esShinyAnim);
            } else {
                spriteUrl = `assets/sprites/pokemon/${esShinyAnim ? 'shiny/' : ''}${spriteIdFinal}.gif`;
            }
        } catch (e) {
            spriteUrl = `assets/sprites/pokemon/${esShinyAnim ? 'shiny/' : ''}${spriteIdFinal}.gif`;
        }

        let spriteUrlOriginal = null;
        if (spriteIdOriginal && spriteIdOriginal !== spriteIdFinal) {
            try {
                if (typeof getSpriteUrl === 'function') {
                    spriteUrlOriginal = getSpriteUrl(spriteIdOriginal, nombreOriginal, esShinyAnim);
                } else {
                    spriteUrlOriginal = `assets/sprites/pokemon/${esShinyAnim ? 'shiny/' : ''}${spriteIdOriginal}.gif`;
                }
            } catch (e) {
                spriteUrlOriginal = null;
            }
        }

        const tieneSpriteOriginalValido = !!spriteUrlOriginal;
        if (!tieneSpriteOriginalValido) {
            spriteUrlOriginal = spriteUrl;
            console.warn('⚠️ animarEvolucionPokemon: sin sprite original distinto, flicker no visible');
        }

        const esNivel3 = (nivelFinal >= 3);

        const COLOR_MARCO_SUAVE = esNivel3
            ? 'rgba(251, 191, 36, 0.75)'
            : 'rgba(200, 220, 245, 0.85)';
        const COLOR_GLOW_1 = esNivel3
            ? 'rgba(251, 191, 36, 0.9)'
            : 'rgba(220, 230, 245, 0.9)';
        const COLOR_GLOW_2 = esNivel3
            ? 'rgba(251, 191, 36, 0.5)'
            : 'rgba(180, 200, 235, 0.5)';
        const COLOR_GLOW_3 = esNivel3
            ? 'rgba(251, 191, 36, 0.35)'
            : 'rgba(200, 220, 245, 0.35)';
        const COLOR_GLOW_BOX_INICIAL = esNivel3
            ? 'rgba(251, 191, 36, 0.6)'
            : 'rgba(220, 230, 245, 0.6)';
        const COLOR_SPRITE_GLOW_1 = esNivel3
            ? 'rgba(251, 191, 36, 1)'
            : 'rgba(220, 230, 245, 1)';
        const COLOR_SPRITE_GLOW_2 = esNivel3
            ? 'rgba(251, 191, 36, 0.6)'
            : 'rgba(200, 220, 245, 0.6)';
        const COLOR_GLOW_HALO_FONDO = esNivel3
            ? 'rgba(251, 191, 36, 0.25)'
            : 'rgba(180, 200, 235, 0.25)';
        const COLOR_ESTRELLAS = esNivel3
            ? 'rgba(251, 191, 36, 1)'
            : 'rgba(220, 230, 245, 1)';

                try {
            if (typeof playSonidoEvolucionCompleta === 'function') {
                playSonidoEvolucionCompleta();
            }
        } catch (e) {}

        // 🆕 FIX: grito del Pokémon ORIGINAL al empezar la animación
        // (antes de la evolución). Suena una sola vez, junto con
        // evolution.mp3. El grito del Pokémon NUEVO suena más tarde,
        // cuando se revela (~5.6s).
        if (spriteIdOriginal && typeof playPokemonCry === 'function') {
            setTimeout(() => {
                try {
                    playPokemonCry(spriteIdOriginal);
                } catch (e) {
                    console.warn('⚠️ No se pudo reproducir grito original:', e);
                }
            }, 500);
        }

        const overlay = document.createElement('div');
        overlay.id = 'evolucionOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            width: 100vw;
            height: 100vh;
            z-index: 9999999;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #000000;
            opacity: 0;
            pointer-events: none;
            animation: evolOverlayFadeIn 0.5s ease-out forwards;
            font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
            isolation: isolate;
        `;
        document.body.appendChild(overlay);

        const carta = document.createElement('div');
        carta.style.cssText = `
            position: relative;
            width: min(340px, 85vw);
            height: min(440px, 75vh);
            background: linear-gradient(145deg, #1a2236, #0f172a);
            border-radius: 24px;
            border: 3px solid ${COLOR_MARCO_SUAVE};
            box-shadow:
                0 0 40px ${COLOR_GLOW_BOX_INICIAL},
                0 0 80px rgba(139, 92, 246, 0.4),
                0 30px 80px rgba(0, 0, 0, 0.9),
                inset 0 0 60px rgba(0, 0, 0, 0.5);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 14px;
            padding: 24px;
            opacity: 0;
            transform: scale(0.3);
            animation: evolCardPop 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s forwards;
            overflow: visible;
        `;
        overlay.appendChild(carta);

        const glowCarta = document.createElement('div');
        glowCarta.style.cssText = `
            position: absolute;
            inset: -20px;
            border-radius: 32px;
            background: radial-gradient(circle, ${COLOR_GLOW_HALO_FONDO} 0%, transparent 70%);
            box-shadow:
                0 0 60px ${COLOR_GLOW_1.replace('0.9', '0.8')},
                0 0 120px ${COLOR_GLOW_2};
            animation: evolGlowPulse 1.2s ease-in-out infinite;
            z-index: 0;
            pointer-events: none;
        `;
        carta.appendChild(glowCarta);

        const signo = document.createElement('div');
        signo.textContent = '?';
        signo.style.cssText = `
            position: absolute;
            bottom: -110px;
            left: 30%;
            transform: translateX(-50%);
            font-family: 'Inter', 'Segoe UI', 'Arial Black', sans-serif;
            font-weight: 900;
            font-size: 72px;
            line-height: 1;
            color: #ffffff;
            text-shadow:
                -3px -3px 0 #4a0d6b,
                 3px -3px 0 #4a0d6b,
                -3px  3px 0 #4a0d6b,
                 3px  3px 0 #4a0d6b,
                 0 0 30px rgba(167, 139, 250, 1),
                 0 0 60px rgba(139, 92, 246, 0.7);
            animation: evolQuestion 3s ease-in-out forwards;
            z-index: 20;
            pointer-events: none;
        `;

        const spriteWrap = document.createElement('div');
        spriteWrap.style.cssText = `
            position: relative;
            width: 200px;
            height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
            margin-top: 30px;
            transform: translateX(20px);
        `;

        const spriteOriginal = document.createElement('img');
        spriteOriginal.src = spriteUrlOriginal;
        spriteOriginal.alt = nombreOriginal || nombreFinal;
        spriteOriginal.draggable = false;
        spriteOriginal.style.cssText = `
            position: absolute;
            top: 0; left: 0;
            width: 180px;
            height: 180px;
            object-fit: contain;
            image-rendering: pixelated;
            filter: brightness(0) drop-shadow(0 0 18px rgba(167, 139, 250, 1)) drop-shadow(0 0 35px rgba(139, 92, 246, 0.7));
            animation: evolSiluetaTemblor 0.25s ease-in-out infinite;
            transition: opacity 0.05s ease, filter 0.4s ease;
            z-index: 10;
            opacity: 1;
        `;
        spriteOriginal.onerror = function() {
            console.warn('⚠️ No se pudo cargar sprite ORIGINAL:', this.src);
            this.style.opacity = '0';
        };
        spriteWrap.appendChild(spriteOriginal);

        const spriteNuevo = document.createElement('img');
        spriteNuevo.src = spriteUrl;
        spriteNuevo.alt = nombreFinal;
        spriteNuevo.draggable = false;
        spriteNuevo.style.cssText = `
            position: absolute;
            top: 0; left: 0;
            width: 180px;
            height: 180px;
            object-fit: contain;
            image-rendering: pixelated;
            filter: brightness(0) drop-shadow(0 0 18px rgba(167, 139, 250, 1)) drop-shadow(0 0 35px rgba(139, 92, 246, 0.7));
            animation: evolSiluetaTemblor 0.25s ease-in-out infinite;
            transition: opacity 0.05s ease, filter 0.4s ease;
            z-index: 10;
            opacity: 0;
        `;
        spriteNuevo.onerror = function() {
            console.warn('⚠️ No se pudo cargar sprite NUEVO:', this.src);
            this.style.opacity = '0';
        };
        spriteWrap.appendChild(spriteNuevo);

        spriteWrap.appendChild(signo);
        carta.appendChild(spriteWrap);

        let flickerActivo = true;
        let flickerInterval = null;
        let mostrandoOriginal = true;

        function aplicarFlicker() {
            if (!spriteOriginal || !spriteNuevo) return;
            if (mostrandoOriginal) {
                spriteOriginal.style.opacity = '1';
                spriteNuevo.style.opacity = '0';
            } else {
                spriteOriginal.style.opacity = '0';
                spriteNuevo.style.opacity = '1';
            }
            const offsetX = (Math.random() - 0.5) * 6;
            const offsetY = (Math.random() - 0.5) * 6;
            spriteOriginal.style.marginLeft = offsetX + 'px';
            spriteOriginal.style.marginTop = offsetY + 'px';
            spriteNuevo.style.marginLeft = offsetX + 'px';
            spriteNuevo.style.marginTop = offsetY + 'px';
        }

        mostrandoOriginal = true;
        aplicarFlicker();

        flickerInterval = setInterval(() => {
            if (!flickerActivo || !spriteOriginal || !spriteNuevo || !spriteOriginal.parentNode) {
                clearInterval(flickerInterval);
                return;
            }
            mostrandoOriginal = !mostrandoOriginal;
            aplicarFlicker();
        }, 250);

        const nombreEl = document.createElement('div');
        nombreEl.textContent = nombreFinal;
        nombreEl.style.cssText = `
            font-family: 'Inter', 'Segoe UI', 'Arial Black', sans-serif;
            font-size: 1.7rem;
            font-weight: 900;
            color: #ffffff;
            text-shadow:
                0 0 20px ${COLOR_ESTRELLAS.replace('1)', '0.9)')},
                0 2px 8px rgba(0, 0, 0, 0.9);
            letter-spacing: 1px;
            opacity: 0;
            transform: scale(0.5);
            transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            z-index: 20;
            text-align: center;
        `;
        carta.appendChild(nombreEl);

        const estrellasEl = document.createElement('div');
        estrellasEl.style.cssText = `
            display: flex;
            justify-content: center;
            align-items: center;
            opacity: 0;
            transform: scale(0.3);
            transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            z-index: 20;
            min-height: 36px;
        `;
        const estrellaImg = document.createElement('img');
        estrellaImg.src = typeof getEstrellasUrl === 'function' ? getEstrellasUrl(nivelFinal) : '';
        estrellaImg.alt = `${nivelFinal}★`;
        estrellaImg.draggable = false;
        estrellaImg.style.cssText = `
            height: 36px;
            width: auto;
            max-width: 120px;
            object-fit: contain;
            filter: drop-shadow(0 0 10px ${COLOR_ESTRELLAS});
            animation: evolStarPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        `;
        estrellaImg.onerror = function() { this.style.display = 'none'; };
        estrellasEl.appendChild(estrellaImg);
        carta.appendChild(estrellasEl);

        const bannerEvol = document.createElement('div');
        bannerEvol.textContent = '✨ ¡EVOLUCIÓN! ✨';
        bannerEvol.style.cssText = `
            font-family: 'Inter', 'Segoe UI', 'Arial Black', sans-serif;
            font-size: 1rem;
            font-weight: 900;
            color: #fbbf24;
            letter-spacing: 3px;
            text-shadow:
                0 0 15px rgba(251, 191, 36, 1),
                0 2px 6px rgba(0, 0, 0, 0.9);
            opacity: 0;
            transform: translateY(10px);
            transition: opacity 0.4s ease, transform 0.4s ease;
            z-index: 20;
        `;
        carta.appendChild(bannerEvol);

        setTimeout(() => {
            flickerActivo = false;
            clearInterval(flickerInterval);

            if (spriteOriginal) {
                spriteOriginal.style.opacity = '0';
                spriteOriginal.style.marginLeft = '0px';
                spriteOriginal.style.marginTop = '0px';
            }
            if (spriteNuevo) {
                spriteNuevo.style.opacity = '1';
                spriteNuevo.style.marginLeft = '0px';
                spriteNuevo.style.marginTop = '0px';
                spriteNuevo.style.filter = 'brightness(3) saturate(0) drop-shadow(0 0 30px rgba(255, 255, 255, 1)) drop-shadow(0 0 60px rgba(255, 255, 255, 0.7))';
                spriteNuevo.style.animation = 'evolSiluetaTemblor 0.15s ease-in-out infinite';
            }

            const flashRadial = document.createElement('div');
            flashRadial.style.cssText = `
                position: absolute;
                left: 50%;
                top: 50%;
                width: 400px;
                height: 400px;
                margin-left: -200px;
                margin-top: -200px;
                border-radius: 50%;
                background: radial-gradient(circle,
                    rgba(255, 255, 255, 1) 0%,
                    rgba(255, 255, 255, 0.9) 20%,
                    rgba(255, 220, 120, 0.7) 45%,
                    rgba(251, 191, 36, 0.4) 65%,
                    transparent 85%);
                pointer-events: none;
                z-index: 25;
                animation: evolFlashRadial 1.4s ease-out forwards;
            `;
            carta.appendChild(flashRadial);

            setTimeout(() => {
                if (flashRadial.parentNode) flashRadial.remove();
            }, 1400);
        }, 4200);

                setTimeout(() => {
            try {
                if (typeof pararSonidoEvolucionCompleta === 'function') {
                    pararSonidoEvolucionCompleta();
                }
            } catch (e) {}

            // 🆕 FIX doble grito: aquí suena el grito del Pokémon NUEVO
            // (el evolucionado). El grito del Pokémon ORIGINAL ya sonó
            // al principio de la animación (ver más abajo, ~1.5s).
            try {
                if (typeof playGritoEvolucion === 'function') {
                    playGritoEvolucion(spriteIdFinal);
                }
            } catch (e) {
                console.error('❌ Error al reproducir grito:', e);
            }

            setTimeout(() => {
                try {
                    if (typeof pararGritoPokemon === 'function') {
                        pararGritoPokemon();
                    }
                } catch (e) {}

                try {
                    if (typeof playEvolveCompleted === 'function') {
                        window._evolveCompletedPromise = playEvolveCompleted();
                    }
                } catch (e) {
                    console.error('❌ Error al reproducir evolve-completed:', e);
                }
            }, 1200);

            if (spriteNuevo) {
                spriteNuevo.style.filter = `drop-shadow(0 0 25px ${COLOR_SPRITE_GLOW_1}) drop-shadow(0 0 50px ${COLOR_SPRITE_GLOW_2})`;
                spriteNuevo.style.animation = 'evolRevealPop 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
            }

            nombreEl.style.opacity = '1';
            nombreEl.style.transform = 'scale(1)';

            estrellasEl.style.opacity = '1';
            estrellasEl.style.transform = 'scale(1)';

            bannerEvol.style.opacity = '1';
            bannerEvol.style.transform = 'translateY(0)';
        }, 5600);

        setTimeout(() => {
            carta.style.transition = 'box-shadow 0.8s ease';
            carta.style.boxShadow =
                `0 0 60px ${COLOR_GLOW_1}, ` +
                `0 0 120px rgba(139, 92, 246, 0.6), ` +
                `0 30px 80px rgba(0, 0, 0, 0.9), ` +
                `inset 0 0 80px ${COLOR_GLOW_3}`;

            if (glowCarta) {
                glowCarta.style.transition = 'opacity 0.6s ease';
                glowCarta.style.opacity = '1';
            }

            if (spriteNuevo) spriteNuevo.style.transition = 'transform 0.6s ease';
            let bounce = 0;
            const bounceInterval = setInterval(() => {
                if (!spriteNuevo || !spriteNuevo.parentNode) {
                    clearInterval(bounceInterval);
                    return;
                }
                bounce++;
                if (bounce % 2 === 1) {
                    spriteNuevo.style.transform = 'scale(1.06)';
                } else {
                    spriteNuevo.style.transform = 'scale(1)';
                }
                if (bounce >= 4) {
                    clearInterval(bounceInterval);
                    if (spriteNuevo) spriteNuevo.style.transform = 'scale(1)';
                }
            }, 1200);
        }, 6600);

        setTimeout(async () => {
            try {
                if (window._evolveCompletedPromise) {
                    await window._evolveCompletedPromise;
                    window._evolveCompletedPromise = null;
                }
            } catch (e) {
                console.warn('⚠️ Error esperando evolve-completed:', e);
            }

            flickerActivo = false;
            clearInterval(flickerInterval);

            _limpiarEstilosCeldasTablero();

            try {
                if (typeof renderizar === 'function') {
                    renderizar();
                }
            } catch (e) {
                console.warn('⚠️ renderizar() Fase A falló:', e);
            }

            _restaurarContenedoresVisibles('', '', '');

            overlay.style.animation = 'evolOverlayFadeOut 0.25s ease-out forwards';

            setTimeout(() => {
                if (overlay.parentNode) overlay.remove();

                _restaurarContenedoresVisibles('', '', '');

                try {
                    if (typeof reanudarFondoPreparacion === 'function') {
                        reanudarFondoPreparacion();
                    }
                } catch (e) {}

                resolve();
            }, 250);
        }, 8600);

    });
}

// ============================================================
// ===== ZACIAN =====
// ============================================================

function crearContenedoresEspeciales() {
    zacianContainer = document.getElementById('zacianContainer');
    articunoContainer = document.getElementById('articunoContainer');
}

function invocarZacian() {
    const sinergias = getSinergiasActivas();
    const hadaSinergia = sinergias.types["Hada"];
    if (!hadaSinergia) {
        zacianUnidad = null; zacianNivel = 0;
        if (zacianContainer) zacianContainer.style.display = 'none';
        return;
    }
    const bonus = hadaSinergia.bonus;
    const starLevel = bonus.zacianStar || 0;
    if (starLevel === 0) {
        zacianUnidad = null; zacianNivel = 0;
        if (zacianContainer) zacianContainer.style.display = 'none';
        return;
    }
    const ZACIAN_STATS = {
        1: { hp: 600, ataque: 80, spAttack: 30, defense: 225, spDefense: 220, attackSpeed: 0.7 },
        2: { hp: 1400, ataque: 115, spAttack: 45, defense: 225, spDefense: 220, attackSpeed: 0.85 },
        3: { hp: 3500, ataque: 185, spAttack: 70, defense: 280, spDefense: 280, attackSpeed: 1.0 }
    };
    const stats = ZACIAN_STATS[starLevel];
    const hadaCount = contarHadasEnTablero();
    const zacianPokemon = {
        id: 999, nombre: "Zacian", spriteId: 888, tipos: ["Hada"], clase: "Atacante",
        hp: stats.hp, ataque: stats.ataque, spAttack: stats.spAttack,
        defense: stats.defense, spDefense: stats.spDefense, attackSpeed: stats.attackSpeed,
        critRate: 0, critDamage: 2.0, startingEnergy: 0, energyGauge: 50, coste: 0, evolucion: null
    };
    zacianUnidad = new Unidad(zacianPokemon, starLevel, 999, 0);
    zacianUnidad.esZacian = true;
    zacianUnidad.metalClaw = bonus.metalClaw || false;
    zacianUnidad.crowned = bonus.crowned || false;
    zacianUnidad.drainCrown = bonus.drainCrown || false;
    zacianUnidad.behemothBlade = bonus.behemothBlade || false;
    zacianNivel = starLevel;
    zacianUnidad.energy = zacianUnidad.pokemon.startingEnergy || 0;
    const hadaBonus = 1 + (hadaCount * 0.05);
    zacianUnidad.bonusAttack *= hadaBonus;
    zacianUnidad.bonusSpAttack *= hadaBonus;
    zacianUnidad.bonusHp *= hadaBonus;
    zacianUnidad.actualizarStats();
    zacianUnidad.hp = zacianUnidad.maxHp;
    mostrarZacianUI();
    addConsoleMessage(`🎀 ¡Zacian ${starLevel}★ invocado!`, 'fusion');
    if (typeof playPokemonCry === 'function') playPokemonCry(888);
}

function mostrarZacianUI() {
    if (!zacianContainer || !zacianUnidad) return;
    zacianContainer.innerHTML = '';
    zacianContainer.style.display = 'none';
}

function actualizarBarrasZacian() {}

// ============================================================
// ===== ARTICUNO =====
// ============================================================

function initUnidadesVirtuales() {
    if (!window.unidadesVirtuales) window.unidadesVirtuales = [];
}

initUnidadesVirtuales();

let _articunoTiempoRealInicio = null;
let _articunoEsperandoCombate = true;
let _articunoYaUsoVentisca = false;

function debeAparecerArticuno() {
    const sinergias = getSinergiasActivas();
    const hieloSinergia = sinergias.types["Hielo"];
    return hieloSinergia && hieloSinergia.bonus && hieloSinergia.bonus.articunoBlizzard;
}

function quitarArticunoDelTablero() {
    if (!window.unidadesVirtuales) return;
    const idx = window.unidadesVirtuales.findIndex(u => u && u.esArticuno);
    if (idx !== -1) window.unidadesVirtuales.splice(idx, 1);
}

function invocarArticuno() {
    const sinergias = getSinergiasActivas();
    const hieloSinergia = sinergias.types["Hielo"];
    if (!hieloSinergia || !hieloSinergia.bonus.articunoBlizzard) {
        quitarArticunoDelTablero();
        articunoUnidad = null; articunoVisible = false;
        if (articunoContainer) articunoContainer.style.display = 'none';
        return;
    }
    if (articunoUnidad && articunoVisible) return;
    if (window.unidadesVirtuales && window.unidadesVirtuales.some(u => u && u.esArticuno)) return;
    if (_articunoYaUsoVentisca) return;
    const articunoPokemon = {
        id: 144, nombre: "Articuno", spriteId: 144, tipos: ["Hielo", "Volador"], clase: "At. Especial",
        rol: "backline", hp: 1, ataque: 1, spAttack: 1, defense: 1, spDefense: 1, attackSpeed: 0,
        critRate: 0, critDamage: 1.0, startingEnergy: 0, energyGauge: 100000, coste: 0, evolucion: null, esEspecial: true
    };
    articunoUnidad = new Unidad(articunoPokemon, 1, 144, 0);
    articunoUnidad.esArticuno = true;
    articunoUnidad.esVirtual = true;
    articunoUnidad.noRecibirDaño = true;
    articunoUnidad.noAtacar = true;
    articunoUnidad.equipo = 'player';
    articunoUnidad.hp = 1; articunoUnidad.maxHp = 1;
    if (!window.unidadesVirtuales) window.unidadesVirtuales = [];
    window.unidadesVirtuales.push(articunoUnidad);
    articunoVisible = true; articunoTimer = 0; articunoActivado = false;
    _articunoTiempoRealInicio = null; _articunoEsperandoCombate = true;
    addConsoleMessage(`❄️ ¡Articuno aparece!`, 'fusion');
    if (typeof playPokemonCry === 'function') playPokemonCry(144);
    if (typeof renderizar === 'function') renderizar();
    mostrarArticunoUI();
}

function mostrarArticunoUI() {
    if (!articunoContainer || !articunoUnidad) return;
    try {
        const tiempoRestante = Math.max(0, 10 - articunoTimer);
        const porcentaje = Math.min(100, Math.floor((articunoTimer / 10) * 100));
        let textoEstado = '', textoBadge = '';
        if (articunoActivado) { textoEstado = '✅ ¡VENTISCA LANZADA!'; textoBadge = '✅ LISTO'; }
        else if (_articunoEsperandoCombate) { textoEstado = '⚔️ Esperando al combate...'; textoBadge = '⏳ 0%'; }
        else { textoEstado = `⏳ Preparando... ${tiempoRestante.toFixed(1)}s`; textoBadge = `${porcentaje}%`; }
        articunoContainer.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;padding:4px 0;"><div style="text-align:left;"><strong style="color:#00ccff;font-size:0.75rem;">❄️ Articuno</strong><div style="font-size:0.55rem;color:#93c5fd;">${textoEstado}</div></div><div style="font-size:0.5rem;color:#00ccff;background:rgba(0,200,255,0.15);padding:2px 10px;border-radius:10px;border:1px solid rgba(0,200,255,0.2);">${textoBadge}</div></div>`;
        articunoContainer.style.display = 'block';
    } catch (e) {}
}

function iniciarTimerArticuno() {
    if (!articunoUnidad || !articunoVisible || articunoActivado) return;
    _articunoTiempoRealInicio = performance.now();
    _articunoEsperandoCombate = false;
    articunoTimer = 0; _articunoYaUsoVentisca = false;
}

function actualizarArticunoTimer() {
    if (!articunoUnidad || !articunoVisible || articunoActivado) return;
    if (_articunoEsperandoCombate || _articunoTiempoRealInicio === null) return;
    const ahora = performance.now();
    articunoTimer = (ahora - _articunoTiempoRealInicio) / 1000;
    mostrarArticunoUI();
    if (articunoTimer >= 10) lanzarVentisca();
}

function lanzarVentisca() {
    if (articunoActivado) return;
    articunoActivado = true; _articunoYaUsoVentisca = true;
    addConsoleMessage(`❄️ ¡ARTICUNO usa VENTISCA!`, 'battle');
    for (let i = 0; i < enemyBoard.length; i++) {
        const enemy = enemyBoard[i];
        if (enemy && !enemy.muerto && enemy.hp > 0) {
            let damage = Math.floor(enemy.maxHp * 0.25) + Math.floor(enemy.hp * 0.08);
            enemy.hp = Math.max(0, enemy.hp - damage);
            enemy.damageTaken = (enemy.damageTaken || 0) + damage;
            enemy.frozen = true;
            enemy.frozenRealInicio = performance.now();
            enemy.frozenDuracion = 3; enemy.frozenTimer = 3;
            if (typeof actualizarCopiaEstadisticas === 'function') actualizarCopiaEstadisticas(enemy, 'damageTaken', damage);
            let pos = obtenerPosicionUnidad('enemy', i);
            if (pos && pos.elemento) {
                mostrarEfectoImpacto(pos.x, pos.y, false, true);
                mostrarNumeroDaño(pos.x, pos.y, damage, false);
                actualizarBarraVida(pos.elemento, enemy.hp, enemy.maxHp);
            }
            if (enemy.hp <= 0) {
                enemy.muerto = true;
                if (pos && pos.elemento && typeof ocultarUnidadMuerta === 'function') ocultarUnidadMuerta(pos.elemento);
            }
        }
    }
    setTimeout(() => {
        quitarArticunoDelTablero();
        articunoUnidad = null; articunoVisible = false; articunoActivado = false;
        articunoTimer = 0; _articunoTiempoRealInicio = null; _articunoEsperandoCombate = true;
        if (articunoContainer) articunoContainer.style.display = 'none';
        if (typeof renderizar === 'function') renderizar();
    }, 2000);
}

function resetArticunoAlTerminarCombate() {
    // Reset COMPLETO: se llama al empezar cada combate y al reiniciar partida.
    // Antes solo limpiaba la unidad si no había lanzado Ventisca, pero
    // `_articunoYaUsoVentisca` se quedaba en true para siempre y Articuno
    // no volvía a aparecer en combates/partidas siguientes.
    quitarArticunoDelTablero();
    articunoUnidad = null;
    articunoVisible = false;
    articunoTimer = 0;
    articunoActivado = false;
    _articunoTiempoRealInicio = null;
    _articunoEsperandoCombate = true;
    _articunoYaUsoVentisca = false;
    if (articunoContainer) articunoContainer.style.display = 'none';
}

// ============================================================
// 🛡️ EXPONER GLOBALMENTE
// ============================================================

window.invocarArticuno = invocarArticuno;
window.quitarArticunoDelTablero = quitarArticunoDelTablero;
window.actualizarArticunoTimer = actualizarArticunoTimer;
window.lanzarVentisca = lanzarVentisca;
window.resetArticunoAlTerminarCombate = resetArticunoAlTerminarCombate;
window.iniciarTimerArticuno = iniciarTimerArticuno;
window.COLOR_DANO_FISICO = COLOR_DANO_FISICO;
window.COLOR_DANO_FISICO_CRIT = COLOR_DANO_FISICO_CRIT;
window.COLOR_DANO_FISICO_TITULO = COLOR_DANO_FISICO_TITULO;
window.COLOR_DANO_ESPECIAL = COLOR_DANO_ESPECIAL;
window.COLOR_DANO_ESPECIAL_CLARO = COLOR_DANO_ESPECIAL_CLARO;
window.COLOR_DANO_ESCUDO = COLOR_DANO_ESCUDO;
window.mostrarProyectilBasico = mostrarProyectilBasico;
window.CONFIGURACION_PROYECTILES = CONFIGURACION_PROYECTILES;
window.SVG_PROYECTILES = SVG_PROYECTILES;
window.playSonidoProyectilBasico = playSonidoProyectilBasico;
window.playSonidoGolpeMelee = playSonidoGolpeMelee;
window.mostrarNumeroDaño = mostrarNumeroDaño;
window.mostrarNumeroCuracion = mostrarNumeroCuracion;
window.crearFlashImpacto = crearFlashImpacto;
window.mostrarAnimacionSubidaEstrella = mostrarAnimacionSubidaEstrella;
window.animarEvolucionPokemon = animarEvolucionPokemon;
window.animarKnockbackGolpe = animarKnockbackGolpe;
window.screenShake = screenShake;
window.efectoFaintDesaparicion = efectoFaintDesaparicion;
window.efectoRecogidaPokeball = efectoRecogidaPokeball;
