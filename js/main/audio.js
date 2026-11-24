// ============================================================
// MAIN · AUDIO
// Extraído de js/main.js (sin cambios de lógica).
// ============================================================

function iniciarAudio() {
    if (audioContext) return;
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {}
}

function playPokemonCry(pokemonId) {
    if (!audioContext) iniciarAudio();
    if (!audioContext) return;

    // Si el grito no existe (monstruos PvE), sintetizar uno corto en vez de
    // provocar un 404 en cada aparición. Lista en js/data/criasDisponibles.js.
    // 🐾 Los gritos tienen su PROPIO volumen (slider "Sonidos Pokémon"),
    // independiente de efectos. 50% → 0.20 (antes 0.30).
    const volPokemon = (typeof window._volumenPokemonActual === 'number') ? window._volumenPokemonActual : 0.20;
    const crias = window.CRIAS_DISPONIBLES;
    if (crias && !crias.has(String(pokemonId))) {
        const n = parseInt(pokemonId, 10) || 300;
        playSound(300 + (n % 6) * 40, 0.12, Math.min(0.2, volPokemon * 0.4));
        return;
    }

    try {
        const volumenFinal = Math.max(0, Math.min(1, volPokemon));
        const cryUrl = CONFIG.CRY_BASE_URL + pokemonId + ".ogg";
        if (audioCache[cryUrl]) {
            const cachedAudio = audioCache[cryUrl];
            cachedAudio.currentTime = 0;
            cachedAudio.volume = volumenFinal;
            cachedAudio.play().catch(() => {});
            return;
        }
        const audio = new Audio(cryUrl);
        audio.volume = volumenFinal;
        audio.addEventListener('canplaythrough', function() { audioCache[cryUrl] = audio; });
        audio.play().catch(() => {});
    } catch (e) {}
}

function playSound(frecuencia, duracion, volumen = 0.08) {
    if (!audioContext) return;
    try {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.frequency.value = frecuencia;
        gain.gain.value = volumen;
        gain.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + duracion);
        osc.start();
        osc.stop(audioContext.currentTime + duracion);
    } catch (e) {}
}

function usarFallbackSonido(nombreArchivo) {
    const fallbacks = {
        'click.mp3': { freq: 880, dur: 0.08 },
        'sell.mp3': { freq: 659.25, dur: 0.08 },
        'levelup.mp3': { freq: 523, dur: 0.1 },
        'victoria-ronda.mp3': { freq: 1046, dur: 0.25 },
        'derrota-ronda.mp3': { freq: 220, dur: 0.4 },
        'combate.mp3': { freq: 392, dur: 0.6 }
    };
    const fallback = fallbacks[nombreArchivo];
    if (fallback) playSound(fallback.freq, fallback.dur, 0.08);
    else playSound(880, 0.1, 0.08);
}

function playUISound(nombreArchivo, volumen = 0.3) {
    if (typeof window._volumenEfectosActual === 'number') {
        volumen = volumen * (window._volumenEfectosActual / 0.5);
        if (volumen < 0) volumen = 0;
    }
    if (!audioContext) iniciarAudio();
    if (!audioContext) return;
    try {
        const url = CONFIG.UI_SOUND_URL + nombreArchivo;
        if (uiAudioCache[url]) {
            const audio = uiAudioCache[url];
            audio.currentTime = 0;
            audio.volume = volumen;
            audio.play().catch(() => usarFallbackSonido(nombreArchivo));
            return;
        }
        const audio = new Audio(url);
        audio.volume = volumen;
        audio.preload = 'auto';
        audio.addEventListener('canplaythrough', function() { uiAudioCache[url] = audio; }, { once: true });
        audio.addEventListener('error', function() { usarFallbackSonido(nombreArchivo); });
        audio.play().catch(() => usarFallbackSonido(nombreArchivo));
    } catch (e) {}
}

function playButtonSound() { playUISound('click.mp3', 0.5); }

function playBuySound() { playUISound('click.mp3', 0.3); }

function playSellSound() { playUISound('sell.mp3', 0.3); }

function playSonidoEvolucion() { playUISound('levelup.mp3', 0.4); }

function playSonidoSubirNivel() { playUISound('levelup.mp3', 0.35); }

function playSonidoObjetos() { playUISound('click.mp3', 0.3); }

function playFusionSound() { playUISound('levelup.mp3', 0.35); }

function playSonidoEvolucionCompleta() {
    try {
        const url = CONFIG.UI_SOUND_URL + 'evolution.mp3';
        if (_evolucionAudioActual) {
            try { _evolucionAudioActual.pause(); _evolucionAudioActual.currentTime = 0; } catch (e) {}
            _evolucionAudioActual = null;
        }
        const audio = new Audio(url);
        audio.volume = 0.5;
        audio.preload = 'auto';
        audio.addEventListener('error', function() { playUISound('levelup.mp3', 0.4); });
        audio.play().catch(() => playUISound('levelup.mp3', 0.4));
        _evolucionAudioActual = audio;
        _evolucionMusicaFondoVolumenOriginal = 0.5;
        audio.addEventListener('ended', function() { if (_evolucionAudioActual === audio) _evolucionAudioActual = null; }, { once: true });
    } catch (e) { playUISound('levelup.mp3', 0.4); }
}

function playGritoEvolucion(pokemonId) {
    try {
        if (_evolucionAudioActual) { try { _evolucionAudioActual.volume = 0.15; } catch (e) {} }
        if (typeof playPokemonCry === 'function' && pokemonId) playPokemonCry(pokemonId);
        setTimeout(() => {
            if (_evolucionAudioActual) { try { _evolucionAudioActual.volume = _evolucionMusicaFondoVolumenOriginal; } catch (e) {} }
        }, 1800);
    } catch (e) {}
}

let _evolveCompletedAudio = null;

function playEvolveCompleted() {
    return new Promise((resolve) => {
        try {
            if (_evolveCompletedAudio) {
                try { _evolveCompletedAudio.pause(); _evolveCompletedAudio.currentTime = 0; } catch (e) { }
                _evolveCompletedAudio = null;
            }
            const url = CONFIG.UI_SOUND_URL + 'evolve-completed.mp3';
            const audio = new Audio(url);
            _evolveCompletedAudio = audio;
            audio.volume = 0.35;
            let yaResuelto = false;
            const resolver = () => {
                if (yaResuelto) return;
                yaResuelto = true;
                if (_evolveCompletedAudio === audio) _evolveCompletedAudio = null;
                resolve();
            };
            audio.addEventListener('ended', resolver);
            audio.addEventListener('error', () => { if (_evolveCompletedAudio === audio) _evolveCompletedAudio = null; playUISound('levelup.mp3', 0.4); setTimeout(resolver, 1500); });
            audio.play().then(() => {}).catch(() => { playUISound('levelup.mp3', 0.4); setTimeout(resolver, 1500); });
            setTimeout(resolver, 15000);
        } catch (e) { playUISound('levelup.mp3', 0.4); setTimeout(resolve, 1500); }
    });
}

function pararSonidoEvolucionCompleta() {
    if (!_evolucionAudioActual) return;
    try { _evolucionAudioActual.pause(); _evolucionAudioActual.currentTime = 0; } catch (e) {}
    _evolucionAudioActual = null;
}

function pararEvolveCompleted() {
    if (!_evolveCompletedAudio) return;
    try { _evolveCompletedAudio.pause(); _evolveCompletedAudio.currentTime = 0; } catch (e) {}
    _evolveCompletedAudio = null;
}

// Volumen de las músicas de resultado (victoria/derrota).
// Se basa en el slider de MÚSICA y se actualiza en tiempo real.
function _volumenResultadoActual() {
    const base = (typeof window._volumenMusicaActual === 'number') ? window._volumenMusicaActual : 0.15;
    return Math.max(0, Math.min(1, base * 1.5));
}

function playVictoriaSound() {
    try {
        const url = CONFIG.UI_SOUND_URL + 'victoria-ronda.mp3';
        if (_victoriaAudioActual) { try { _victoriaAudioActual.pause(); _victoriaAudioActual.currentTime = 0; } catch (e) {} _victoriaAudioActual = null; }
        const audio = new Audio(url);
        audio.volume = _volumenResultadoActual();
        audio.loop = true; // 🆕 loop para que no se corte si el MP3 dura < 8.5s
        audio.addEventListener('error', function() { usarFallbackSonido('victoria-ronda.mp3'); });
        audio.play().catch(() => usarFallbackSonido('victoria-ronda.mp3'));
        _victoriaAudioActual = audio;
        // 🆕 Duración total: 8.5s (antes 7.5s). Con loop, el MP3 se
        //    repite hasta que salte este timeout.
                // 🆕 Fade out antes de cortar la música (suave, ~1.2s)
        const FADE_DURACION_MS = 1200;
        const FADE_PASOS = 24;
        const FADE_INTERVALO_MS = FADE_DURACION_MS / FADE_PASOS;

        setTimeout(() => {
            if (_victoriaAudioActual !== audio) return;
            try { audio.loop = false; } catch (e) {}

            let paso = 0;
            const fadeInterval = setInterval(() => {
                if (_victoriaAudioActual !== audio) {
                    clearInterval(fadeInterval);
                    return;
                }
                paso++;
                const volBase = _volumenResultadoActual();
                const nuevoVol = Math.max(0, volBase * (1 - paso / FADE_PASOS));
                try { audio.volume = nuevoVol; } catch (e) {}

                if (paso >= FADE_PASOS) {
                    clearInterval(fadeInterval);
                    try { audio.pause(); audio.currentTime = 0; audio.volume = _volumenResultadoActual(); } catch (e) {}
                    _victoriaAudioActual = null;
                    audio.dispatchEvent(new Event('ended'));
                }
            }, FADE_INTERVALO_MS);
        }, 7500);
        return audio;
    } catch (e) { usarFallbackSonido('victoria-ronda.mp3'); return null; }
}

function playDerrotaSound() {
    const url = CONFIG.UI_SOUND_URL + 'derrota-ronda.mp3';
    try {
        if (_derrotaAudioActual) {
            try { _derrotaAudioActual.pause(); _derrotaAudioActual.currentTime = 0; } catch (e) {}
            _derrotaAudioActual = null;
        }
        const audio = new Audio(url);
        audio.volume = _volumenResultadoActual();
        audio.loop = true;
        audio.addEventListener('error', function() { usarFallbackSonido('derrota-ronda.mp3'); });
        audio.play().catch(() => usarFallbackSonido('derrota-ronda.mp3'));
        _derrotaAudioActual = audio;
                // 🆕 Fade out antes de cortar la música (suave, ~1.2s)
        const FADE_DURACION_MS = 1200;
        const FADE_PASOS = 24;
        const FADE_INTERVALO_MS = FADE_DURACION_MS / FADE_PASOS;

        setTimeout(() => {
            if (_derrotaAudioActual !== audio) return;
            try { audio.loop = false; } catch (e) {}

            let paso = 0;
            const fadeInterval = setInterval(() => {
                if (_derrotaAudioActual !== audio) {
                    clearInterval(fadeInterval);
                    return;
                }
                paso++;
                const volBase = _volumenResultadoActual();
                const nuevoVol = Math.max(0, volBase * (1 - paso / FADE_PASOS));
                try { audio.volume = nuevoVol; } catch (e) {}

                if (paso >= FADE_PASOS) {
                    clearInterval(fadeInterval);
                    try { audio.pause(); audio.currentTime = 0; audio.volume = _volumenResultadoActual(); } catch (e) {}
                    _derrotaAudioActual = null;
                    audio.dispatchEvent(new Event('ended'));
                }
            }, FADE_INTERVALO_MS);
        }, 7500);
        return audio;
    } catch (e) { usarFallbackSonido('derrota-ronda.mp3'); return null; }
}

function playSonidoMovimiento(nombreMovimiento, volumen = 0.4) {
    if (!nombreMovimiento) return;
    if (typeof window._volumenEfectosActual === 'number') {
        volumen = volumen * (window._volumenEfectosActual / 0.5);
        if (volumen < 0) volumen = 0;
        if (volumen > 1) volumen = 1;
    }
    const idSonido = nombreMovimiento.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-');
    if (!audioContext) iniciarAudio();
    if (!audioContext) return;

    // Sin archivo: sintetizar sin intentar cargar .mp3/.ogg (evita 404)
    if (SONIDOS_MOVIMIENTO_SIN_ARCHIVO.has(idSonido)) {
        usarFallbackSonidoMovimiento(idSonido, volumen);
        return;
    }

    // Lista real de archivos (js/data/sonidosMovimientos.js). Si el sonido no
    // existe —p. ej. el id de una ULTIMATE, que no tiene mp3— usamos el
    // sintetizado en vez de provocar dos 404 (mp3 + ogg) en cada lanzamiento.
    const sonidosReales = window.SONIDOS_MOVIMIENTOS_DISPONIBLES;
    if (sonidosReales && !sonidosReales.has(idSonido)) {
        usarFallbackSonidoMovimiento(idSonido, volumen);
        return;
    }

    const urlMp3 = CONFIG.SOUND_BASE_URL + 'movimientos/' + idSonido + '.mp3';
    const urlOgg = CONFIG.SOUND_BASE_URL + 'movimientos/' + idSonido + '.ogg';

    if (movimientoAudioCache[urlMp3]) {
        const audio = movimientoAudioCache[urlMp3];
        audio.currentTime = 0; audio.volume = volumen;
        audio.play().catch(() => usarFallbackSonidoMovimiento(idSonido, volumen));
        return;
    }
    if (movimientoAudioCache[urlOgg]) {
        const audio = movimientoAudioCache[urlOgg];
        audio.currentTime = 0; audio.volume = volumen;
        audio.play().catch(() => usarFallbackSonidoMovimiento(idSonido, volumen));
        return;
    }

    const audioMp3 = new Audio(urlMp3);
    audioMp3.volume = volumen;
    audioMp3.preload = 'auto';
    audioMp3.addEventListener('canplaythrough', function() { movimientoAudioCache[urlMp3] = audioMp3; }, { once: true });
    audioMp3.addEventListener('error', function() {
        const audioOgg = new Audio(urlOgg);
        audioOgg.volume = volumen;
        audioOgg.addEventListener('canplaythrough', function() { movimientoAudioCache[urlOgg] = audioOgg; }, { once: true });
        audioOgg.addEventListener('error', function() { usarFallbackSonidoMovimiento(idSonido, volumen); });
        audioOgg.play().catch(() => usarFallbackSonidoMovimiento(idSonido, volumen));
    });
    audioMp3.play().catch(() => {
        const audioOgg = new Audio(urlOgg);
        audioOgg.volume = volumen;
        audioOgg.play().catch(() => usarFallbackSonidoMovimiento(idSonido, volumen));
    });
}

function usarFallbackSonidoMovimiento(idSonido, volumen = 0.15) {
    if (!audioContext) return;
    const fallbacks = {
        'latigo-cepa': { frecuencias: [660, 990, 1320], duracion: 0.35, tipo: 'sawtooth' },
        'refuerzo': { frecuencias: [523, 659, 784, 1046], duracion: 0.4, tipo: 'triangle' },
        'lanzallamas': { frecuencias: [200, 400, 300, 500], duracion: 0.6, tipo: 'sawtooth' },
        'vendaval': { frecuencias: [900, 1200, 700, 1400], duracion: 0.55, tipo: 'triangle' },
        'trampa-rocas': { frecuencias: [120, 90, 140, 80], duracion: 0.5, tipo: 'square' },
        'tajo-cruzado': { frecuencias: [180, 220, 160, 240], duracion: 0.35, tipo: 'square' },
        'torbellino': { frecuencias: [500, 700, 400, 800], duracion: 0.6, tipo: 'sine' },
        'divide-dolor': { frecuencias: [400, 550, 300, 600], duracion: 0.7, tipo: 'triangle' },
        'bola-voltio': { frecuencias: [800, 1200, 1000, 1400], duracion: 0.4, tipo: 'square' },
        'fuerza-lunar': { frecuencias: [600, 800, 700, 900], duracion: 0.5, tipo: 'sine' },
        'colmillo-hielo': { frecuencias: [400, 300, 500, 200], duracion: 0.5, tipo: 'triangle' },
        'finta': { frecuencias: [300, 500, 350, 550], duracion: 0.3, tipo: 'square' },
        'bomba-acida': { frecuencias: [200, 300, 250, 400], duracion: 0.45, tipo: 'sawtooth' },
        'espada-lamento': { frecuencias: [500, 700, 900, 400], duracion: 0.5, tipo: 'sawtooth' },
        'giro-fuego-hooh': { frecuencias: [350, 550, 450, 750], duracion: 0.55, tipo: 'sawtooth' },
        'tajo-supremo': { frecuencias: [180, 260, 210, 320, 240], duracion: 0.5, tipo: 'square' },
        'nieve-polvo': { frecuencias: [500, 700, 400, 600], duracion: 0.5, tipo: 'triangle' },
        'giro-fuego': { frecuencias: [300, 500, 400, 700], duracion: 0.5, tipo: 'sawtooth' },
        'hoja-afilada': { frecuencias: [700, 900, 800, 1000], duracion: 0.4, tipo: 'sawtooth' },
        'velocidad-extrema': { frecuencias: [900, 1100, 800, 1200, 1000], duracion: 0.35, tipo: 'square' },
        'cambiafuerza': { frecuencias: [400, 500, 450, 550, 500, 600], duracion: 0.6, tipo: 'sine' },
        'sombra-vil': { frecuencias: [300, 200, 350, 250], duracion: 0.5, tipo: 'triangle' },
        'ascuas': { frecuencias: [500, 700, 600, 800], duracion: 0.25, tipo: 'square' },
        'hidrobomba': { frecuencias: [400, 600, 500, 700], duracion: 0.5, tipo: 'sine' },
        'martillo-hielo': { frecuencias: [200, 400, 300, 500], duracion: 0.5, tipo: 'square' },
        'alarido': { frecuencias: [150, 200, 180, 250, 200, 300], duracion: 0.7, tipo: 'sawtooth' },
        'ventisca': { frecuencias: [600, 800, 500, 900, 700, 1000], duracion: 0.6, tipo: 'triangle' },
        'voltiocambio': { frecuencias: [900, 1200, 1000, 1400, 1100], duracion: 0.35, tipo: 'square' },
        'tajo-umbrio': { frecuencias: [250, 350, 200, 400], duracion: 0.4, tipo: 'sawtooth' },
        'senuelo': { frecuencias: [600, 800, 700, 900, 800, 1000], duracion: 0.5, tipo: 'sine' },
        'psicocarga': { frecuencias: [500, 700, 900, 800, 1000], duracion: 0.35, tipo: 'sine' },
        'viento-hielo': { frecuencias: [700, 900, 800, 1000, 900], duracion: 0.4, tipo: 'triangle' },
        'rizo-algodon': { frecuencias: [400, 600, 500, 700], duracion: 0.5, tipo: 'sine' },
        'bomba-lodo': { frecuencias: [200, 250, 180, 300], duracion: 0.4, tipo: 'sawtooth' },
        'azote-torrencial': { frecuencias: [400, 500, 450, 600, 550, 700], duracion: 0.45, tipo: 'sine' },
        'hidropulso': { frecuencias: [400, 500, 450, 550, 500, 600], duracion: 0.6, tipo: 'sine' },
        'pistola-agua': { frecuencias: [400, 600, 500, 700], duracion: 0.35, tipo: 'sine' },
        'bola-voltio2': { frecuencias: [900, 1300, 1100, 1500], duracion: 0.4, tipo: 'square' },
        'danza-dragon': { frecuencias: [500, 700, 600, 800, 700, 900], duracion: 0.55, tipo: 'triangle' },
        'bote': { frecuencias: [400, 600, 500, 800], duracion: 0.5, tipo: 'sine' },
        'truco': { frecuencias: [600, 800, 700, 900, 800, 1000], duracion: 0.5, tipo: 'sine' },
        'descanso': { frecuencias: [300, 250, 300, 200], duracion: 0.7, tipo: 'sine' },
        'llama-embrujada': { frecuencias: [400, 600, 500, 700, 600, 800], duracion: 0.55, tipo: 'sine' },
        'roca-afilada': { frecuencias: [150, 250, 200, 300], duracion: 0.5, tipo: 'square' },
        'llama-reavivadora': { frecuencias: [500, 700, 900, 1100], duracion: 0.6, tipo: 'sine' },
        'teletransporte': { frecuencias: [800, 1200, 900, 1300, 1000], duracion: 0.5, tipo: 'sine' },
        'cometa-draco': { frecuencias: [300, 500, 700, 400, 600, 800], duracion: 0.6, tipo: 'sawtooth' },
        'puno-fuego': { frecuencias: [300, 500, 800], duracion: 0.25, tipo: 'square' }
    };
    const config = fallbacks[idSonido] || { frecuencias: [880], duracion: 0.3, tipo: 'sine' };
    try {
        const ahora = audioContext.currentTime;
        config.frecuencias.forEach((freq, idx) => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain); gain.connect(audioContext.destination);
            osc.type = config.tipo; osc.frequency.value = freq;
            const inicio = ahora + (idx * 0.08);
            const duracionNota = config.duracion / config.frecuencias.length;
            gain.gain.setValueAtTime(0.0001, inicio);
            gain.gain.exponentialRampToValueAtTime(volumen, inicio + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.00001, inicio + duracionNota);
            osc.start(inicio); osc.stop(inicio + duracionNota);
        });
    } catch (e) {}
}

function iniciarFondoPreparacion() {
    if (fondoPreparacionActivo) return;
    try {
        const url = CONFIG.UI_SOUND_URL + 'fondo-preparacion.mp3';
        if (!fondoPreparacionAudio) {
            fondoPreparacionAudio = new Audio(url);
            fondoPreparacionAudio.loop = true;
            const volGuardado = (typeof window._volumenMusicaActual === 'number') ? window._volumenMusicaActual : 0.15;
            fondoPreparacionAudio.volume = volGuardado;
            fondoPreparacionAudio.addEventListener('error', function () { fondoPreparacionAudio = null; });
        }
        fondoPreparacionAudio.play().then(() => { fondoPreparacionActivo = true; }).catch(() => { fondoPreparacionActivo = false; });
    } catch (e) {}
}

function pausarFondoPreparacion() {
    if (!fondoPreparacionAudio) return;
    try { fondoPreparacionAudio.pause(); fondoPreparacionAudio.currentTime = 0; fondoPreparacionActivo = false; } catch (e) {}
}

function reanudarFondoPreparacion() {
    if (!fondoPreparacionAudio) {
        iniciarFondoPreparacion();
    } else {
        try {
            fondoPreparacionAudio.play().then(() => {
                fondoPreparacionActivo = true;
                if (typeof actualizarContadorRondaVisual === 'function') {
                    actualizarContadorRondaVisual();
                }
            }).catch(() => {});
        } catch (e) {}
    }
}

// 🎵 Música de combate (combate.mp3): en bucle y con el volumen de MÚSICA.
//    Se inicia SIEMPRE (aunque la música esté al 0%) para que, si el jugador
//    sube el volumen durante el combate, se empiece a escuchar al momento.
function reproducirMusicaCombate() {
    if (!audioContext) iniciarAudio();
    if (!audioContext) return;
    try {
        const url = CONFIG.UI_SOUND_URL + 'combate.mp3';
        if (!combateAudioActual) {
            combateAudioActual = uiAudioCache[url] || new Audio(url);
        }
        combateAudioActual.loop = true;
        combateAudioActual.preload = 'auto';
        uiAudioCache[url] = combateAudioActual;

        combateAudioActual.volume = (typeof window._volumenMusicaActual === 'number')
            ? window._volumenMusicaActual * 0.9
            : 0.15;

        combateAudioActual.currentTime = 0;
        combateAudioActual.play().catch(() => {});
    } catch (e) {}
}
