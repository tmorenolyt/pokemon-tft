// ============================================================
// SONIDOS SHINY - v1
// ============================================================
// playSonidoShinyAparece():
//   1) Intenta cargar assets/sounds/ui/shiny-appears.mp3
//   2) Si no existe, sintetiza un arpegio ascendente
//      con Web Audio API (do-mi-sol-do agudo)
//
// Solo se llama cuando aparece un shiny NUEVO en la tienda,
// no en cada render.
// ============================================================

let _shinySoundAudio = null;
let _shinySoundCache = {};

function playSonidoShinyAparece(volumen = 0.45) {
    // ============================================================
    // 1) INTENTO CON ARCHIVO MP3
    // ============================================================
    try {
        const url = CONFIG.UI_SOUND_URL + 'shiny-appears.mp3';

        if (_shinySoundCache[url]) {
            const audio = _shinySoundCache[url];
            audio.currentTime = 0;
            audio.volume = volumen;
            audio.play().catch(() => {
                _sintetizarShiny(volumen);
            });
            return;
        }

        const audio = new Audio(url);
        audio.volume = volumen;
        audio.preload = 'auto';

        audio.addEventListener('canplaythrough', function () {
            _shinySoundCache[url] = audio;
        }, { once: true });

        audio.addEventListener('error', function () {
            // El archivo no existe → sintetizar
            _sintetizarShiny(volumen);
        });

        audio.play().catch(() => {
            _sintetizarShiny(volumen);
        });

        _shinySoundAudio = audio;
    } catch (e) {
        _sintetizarShiny(volumen);
    }
}

// ============================================================
// 2) SÍNTESIS DE RESPALDO
// ============================================================
// Arpegio ascendente tipo "ding ding ding" + brillo agudo.
// Do mayor: C5 (523) → E5 (659) → G5 (784) → C6 (1046)
// ============================================================

function _sintetizarShiny(volumen = 0.35) {
    try {
        if (!window._audioCtxProyectil) {
            window._audioCtxProyectil = new (window.AudioContext || window.webkitAudioContext)();
        }
        const ctx = window._audioCtxProyectil;
        if (!ctx || ctx.state === 'suspended') return;

        const ahora = ctx.currentTime;

        // Arpegio: C5 E5 G5 C6
        const notas = [523.25, 659.25, 783.99, 1046.50];
        const duracionNota = 0.11;
        const separacion = 0.09;

        notas.forEach((freq, i) => {
            const inicio = ahora + i * separacion;

            // Onda triangular (brillante pero no estridente)
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, inicio);
            gain.gain.setValueAtTime(0.0001, inicio);
            gain.gain.exponentialRampToValueAtTime(volumen, inicio + 0.008);
            gain.gain.exponentialRampToValueAtTime(0.00001, inicio + duracionNota);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(inicio);
            osc.stop(inicio + duracionNota + 0.02);

            // Armónico agudo (brillo tipo campanilla)
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(freq * 2, inicio);
            gain2.gain.setValueAtTime(0.0001, inicio);
            gain2.gain.exponentialRampToValueAtTime(volumen * 0.35, inicio + 0.006);
            gain2.gain.exponentialRampToValueAtTime(0.00001, inicio + duracionNota * 0.8);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(inicio);
            osc2.stop(inicio + duracionNota + 0.02);
        });

        // "Chispa" final: ruido corto de alta frecuencia
        const finChispa = ahora + notas.length * separacion + 0.02;
        const bs = Math.floor(ctx.sampleRate * 0.12);
        const buf = ctx.createBuffer(1, bs, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < bs; i++) {
            const t = i / bs;
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 3) * 0.5;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buf;
        const biquad = ctx.createBiquadFilter();
        biquad.type = 'highpass';
        biquad.frequency.setValueAtTime(3000, finChispa);
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(volumen * 0.6, finChispa);
        ng.gain.exponentialRampToValueAtTime(0.00001, finChispa + 0.12);
        noise.connect(biquad);
        biquad.connect(ng);
        ng.connect(ctx.destination);
        noise.start(finChispa);

    } catch (e) {
        console.warn('⚠️ No se pudo sintetizar sonido shiny:', e);
    }
}

window.playSonidoShinyAparece = playSonidoShinyAparece;

console.log('✅ sonidosShiny.js cargado - playSonidoShinyAparece() disponible');