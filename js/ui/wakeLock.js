// ============================================================
// 🔆 MANTENER LA PANTALLA ENCENDIDA (móvil)
// ============================================================
// Una web no puede evitar el bloqueo de pantalla por sí sola: el sistema
// apaga la pantalla por inactividad. La Screen Wake Lock API sí lo permite
// (Chrome/Edge Android 84+, Safari iOS 16.4+, siempre en HTTPS).
//
// - Se activa al pulsar JUGAR (o al primer toque dentro de la partida).
// - Si el navegador la suelta (pestaña oculta, cambio de app), se vuelve a
//   pedir al volver a la página.
// - Al salir/recargar se libera sola (pagehide).
// ============================================================
(function () {
    let sentinel = null;
    let activo = false;
    let pidiendo = false;
    let avisoMostrado = false;

    function soportado() {
        return !!(navigator.wakeLock && typeof navigator.wakeLock.request === 'function');
    }

    async function pedir() {
        if (!activo || pidiendo) return;
        if (document.visibilityState !== 'visible') return;
        if (sentinel) return;
        if (!soportado()) {
            if (!avisoMostrado) {
                console.log('🔆 Este navegador no soporta Wake Lock: la pantalla puede apagarse sola.');
                avisoMostrado = true;
            }
            return;
        }
        pidiendo = true;
        try {
            sentinel = await navigator.wakeLock.request('screen');
            sentinel.addEventListener('release', function () { sentinel = null; });
            if (window.DEBUG) console.log('🔆 Pantalla siempre encendida (Wake Lock activo)');
        } catch (e) {
            if (!avisoMostrado) {
                console.log('🔆 No se pudo mantener la pantalla encendida: ' + (e && e.message ? e.message : e));
                avisoMostrado = true;
            }
        } finally {
            pidiendo = false;
        }
    }

    window.activarPantallaSiempre = function () {
        activo = true;
        pedir();
    };

    window.desactivarPantallaSiempre = function () {
        activo = false;
        if (sentinel) {
            try { sentinel.release(); } catch (e) { }
            sentinel = null;
        }
    };

    // Al volver a la pestaña, el navegador puede haber liberado el bloqueo.
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') pedir();
    });

    // Primer toque dentro del juego (cubre también el modo online, que no
    // pasa por el botón JUGAR).
    document.addEventListener('pointerdown', function () {
        var juego = document.getElementById('juegoContainer');
        if (!juego || juego.offsetParent === null) return;
        if (!activo) activo = true;
        if (!sentinel) pedir();
    }, { passive: true });

    // Al cerrar/recargar.
    window.addEventListener('pagehide', function () {
        if (sentinel) {
            try { sentinel.release(); } catch (e) { }
            sentinel = null;
        }
    });

    // Para depurar desde la consola
    window._wakeLockInfo = function () {
        return { soportado: soportado(), activo: activo, sentinel: !!sentinel };
    };
})();
