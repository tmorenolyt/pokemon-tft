// ============================================================
// ⛶ PANTALLA COMPLETA EN MÓVIL
// ============================================================
// - En Android/Chrome se pide la Fullscreen API al pulsar JUGAR (gesto
//   de usuario) y se bloquea la orientación en horizontal.
// - En iPhone Safari la API no existe: se muestra un aviso para añadir
//   la web a la pantalla de inicio (ahí arranca sin barras del navegador).
// - Botón manual en Ajustes por si se sale con el gesto del sistema.
// ============================================================
(function () {
    const UA = navigator.userAgent || '';
    const esTactil = () =>
        (navigator.maxTouchPoints || 0) > 0 ||
        (window.matchMedia && matchMedia('(pointer: coarse)').matches) ||
        /Android|iPhone|iPad|iPod|Mobile/i.test(UA);

    const esiOS = /iPhone|iPad|iPod/i.test(UA) && !window.MSStream;
    const enApp = () =>
        (window.matchMedia && matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches) ||
        window.navigator.standalone === true;

    let avisoIOSMostrado = false;

    function toast(texto, ms) {
        try {
            const el = document.createElement('div');
            el.textContent = texto;
            el.style.cssText = [
                'position:fixed', 'left:50%', 'bottom:18px', 'transform:translateX(-50%)',
                'max-width:min(92vw,520px)', 'background:rgba(8,14,28,.96)',
                'border:1.5px solid rgba(77,212,247,.55)', 'color:#e6f6ff',
                'padding:10px 16px', 'border-radius:12px', 'font:600 13px/1.35 Inter,sans-serif',
                'z-index:100050', 'box-shadow:0 8px 30px rgba(0,0,0,.6)', 'text-align:center',
                'pointer-events:none'
            ].join(';');
            document.body.appendChild(el);
            setTimeout(() => { try { el.remove(); } catch (e) { } }, ms || 6500);
        } catch (e) { }
    }

    async function pedir() {
        window._fsIntentos = (window._fsIntentos || 0) + 1;
        if (document.fullscreenElement || enApp()) return true;

        const el = document.documentElement;
        const fn = el.requestFullscreen || el.webkitRequestFullscreen;

        if (!fn) {
            // iPhone/iPad antiguos: no hay API de pantalla completa para la web
            if (esiOS && !avisoIOSMostrado) {
                avisoIOSMostrado = true;
                toast('📱 Para jugar a pantalla completa en iPhone: Compartir → Añadir a pantalla de inicio', 8000);
            }
            return false;
        }

        try {
            const res = fn.call(el, { navigationUI: 'hide' });
            if (res && res.then) await res;
        } catch (e) {
            window._fsLastError = e && e.message ? e.message : String(e);
            return false;
        }

        // Bloquear horizontal (solo funciona tras fullscreen; Android/Chrome)
        try {
            if (screen.orientation && screen.orientation.lock) {
                await screen.orientation.lock('landscape');
            }
        } catch (e) { }

        return true;
    }

    function salir() {
        if (!document.fullscreenElement) return;
        try {
            const p = document.exitFullscreen && document.exitFullscreen();
            if (p && p.catch) p.catch(() => { });
        } catch (e) { }
    }

    function alternar() {
        if (document.fullscreenElement) salir();
        else pedir();
    }

    function actualizarBoton() {
        const b = document.getElementById('btnPantallaCompleta');
        if (!b) return;
        b.textContent = document.fullscreenElement
            ? '⛶ Salir de pantalla completa'
            : '⛶ Pantalla completa';
    }

    window.pantallaCompleta = { pedir, salir, alternar, esTactil, enApp };
    window.activarPantallaCompleta = function () {
        if (esTactil()) pedir();
    };

    document.addEventListener('fullscreenchange', actualizarBoton);
    document.addEventListener('webkitfullscreenchange', actualizarBoton);

    document.addEventListener('DOMContentLoaded', function () {
        const b = document.getElementById('btnPantallaCompleta');
        if (b) {
            b.addEventListener('click', function (e) {
                e.preventDefault();
                alternar();
            });
        }
        actualizarBoton();
    });

    // PWA: permite 'Instalar app' en Android (icono + pantalla completa).
    // El SW no cachea nada; solo habilita la instalación.
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
        window.addEventListener('load', function () {
            navigator.serviceWorker.register('sw.js').catch(function () { });
        });
    }

    // Modo online: no pasa por JUGAR, se activa con el primer toque dentro.
    document.addEventListener('pointerdown', function () {
        const juego = document.getElementById('juegoContainer');
        if (!juego || juego.offsetParent === null) return;
        if (!document.fullscreenElement && esTactil()) pedir();
    }, { passive: true });
})();
