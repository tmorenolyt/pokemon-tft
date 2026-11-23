// ============================================================
// ESCALADO POR ESTRELLAS SEGÚN LA DESCRIPCIÓN
// ============================================================
// Las descripciones son la fuente de verdad. Si dicen "120%/120%/360%",
// el multiplicador de daño debe ser 120% a 1★, 120% a 2★ y 360% a 3★.
// `movAplicarDaño` multiplica el daño del movimiento por este factor.
// ============================================================

(function () {
    const CACHE_ULTIS = {};

    function extraerSecuenciaDano(desc) {
        if (!desc) return null;
        const s = String(desc);
        // Busca secuencias A% / A% / 3A% seguidas de "de daño".
        // "del daño" (reparto/robo) se ignora; "de su Ataque" (escudo) también.
        const re = /((?:\d+(?:[.,]\d+)?\s*%\s*\/\s*)*)(\d+(?:[.,]\d+)?)\s*%\s*(de\s+daño|del\s+daño)?/gi;
        let candidato = null, primero = null;
        for (const m of s.matchAll(re)) {
            const vals = [...(m[1] || '').matchAll(/\d+(?:[.,]\d+)?/g)].map(x => Number(x[0].replace(',', '.')));
            vals.push(Number(String(m[2]).replace(',', '.')));
            if (!vals.length) continue;
            if (!primero) primero = vals;
            const suf = (m[3] || '').toLowerCase();
            if (suf === 'de daño' && !candidato) candidato = vals;
        }
        if (candidato) return candidato.slice(0, 3);
        // 40/40/120 de daño (sin % en cada valor)
        const trio = s.match(/(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)\s*(?:de\s+)?daño/i);
        if (trio) return [Number(trio[1]), Number(trio[2]), Number(trio[3])];
        return primero ? primero.slice(0, 3) : null;
    }

    function factorDesdeValores(vals, nivel) {
        if (!vals || vals.length < 2) return 1;
        const base = vals[0];
        if (!base || !isFinite(base)) return 1;
        const i = Math.max(0, Math.min(vals.length - 1, (Number(nivel) || 1) - 1));
        const v = (vals[i] != null ? vals[i] : vals[vals.length - 1]);
        const f = v / base;
        if (!isFinite(f) || f <= 0) return 1;
        return Math.max(0.1, Math.min(20, f));
    }

    function infoMovimiento(nombre, iconoKey) {
        if (typeof window.movimientosInfo === 'undefined' || !window.movimientosInfo) return null;
        return window.movimientosInfo[iconoKey] || window.movimientosInfo[nombre] || null;
    }

    function buscarUltiPorId(id) {
        if (!id) return null;
        if (CACHE_ULTIS[id]) return CACHE_ULTIS[id];
        try {
            if (typeof ULTIS_FAMILIAS !== 'undefined' && ULTIS_FAMILIAS) {
                for (const k in ULTIS_FAMILIAS) {
                    const u = ULTIS_FAMILIAS[k];
                    if (u && u.id === id) { CACHE_ULTIS[id] = u; return u; }
                }
            }
        } catch (e) { }
        return null;
    }

    function aplicarFactorDescripcion(atacante, nombre, iconoKey, nivel) {
        if (!atacante) return 1;
        const info = infoMovimiento(nombre, iconoKey);
        const f = info ? factorDesdeValores(extraerSecuenciaDano(info.descripcion), nivel != null ? nivel : atacante.nivel) : 1;
        atacante._factorEstrellas = f;
        atacante._factorHasta = performance.now() + 8000;
        return f;
    }

    function aplicarFactorUlti(atacante, id, nivel) {
        if (!atacante) return 1;
        const u = buscarUltiPorId(id);
        const f = u ? factorDesdeValores(extraerSecuenciaDano(u.descripcion), nivel != null ? nivel : atacante.nivel) : 1;
        atacante._factorEstrellas = f;
        atacante._factorHasta = performance.now() + 8000;
        return f;
    }

    window.extraerSecuenciaDano = extraerSecuenciaDano;
    window.aplicarFactorDescripcion = aplicarFactorDescripcion;
    window.aplicarFactorUlti = aplicarFactorUlti;
})();
