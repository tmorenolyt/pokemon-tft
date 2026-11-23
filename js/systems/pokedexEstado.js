// ============================================================
// POKÉDEX · ESTADO (REGISTRADO / VISTO / NO VISTO)
// ------------------------------------------------------------
// - Se guarda en localStorage por navegador.
// - "Registrado" = lo has comprado/obtenido en una partida.
// - "Visto" = ha aparecido en el equipo rival (sin datos).
// - Se agrupa por FAMILIA EVOLUTIVA: si ves un Ivysaur, la ficha
//   base (Bulbasaur) queda como vista. Así la Pokédex mantiene las
//   fichas base y su detalle por estrellas.
// - "Shiny": si compras/obtienes una unidad shiny, la familia queda
//   marcada como shiny y la Pokédex usa su sprite shiny.
// ============================================================
(function () {
    'use strict';

    const CLAVE = 'pktft_pokedex_v1';

    let estado = { v: 2, comprados: {}, vistos: {}, shinies: {} };

    function cargar() {
        try {
            const raw = localStorage.getItem(CLAVE);
            if (!raw) return;
            const data = JSON.parse(raw);
            if (!data || typeof data !== 'object') return;
            estado.v = 2;
            estado.comprados = (data.comprados && typeof data.comprados === 'object') ? data.comprados : {};
            estado.vistos = (data.vistos && typeof data.vistos === 'object') ? data.vistos : {};
            estado.shinies = (data.shinies && typeof data.shinies === 'object') ? data.shinies : {};
        } catch (e) { }
    }

    function guardar() {
        try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (e) { }
        avisarLogros();
    }

    // Los logros de la categoría 📖 Pokédex leen el progreso directamente
    // de aquí, así que basta con avisar al sistema de logros tras cada
    // cambio (compra o avistamiento).
    function avisarLogros() {
        try {
            if (window.Logros && typeof window.Logros.comprobar === 'function') {
                window.Logros.comprobar();
            }
        } catch (e) { }
    }

    cargar();

    // Devuelve el nombre de la forma base de una familia.
    // Ivysaur → Bulbasaur, Venusaur → Bulbasaur, Bulbasaur → Bulbasaur.
    function nombreBase(nombre) {
        if (!nombre) return null;
        var p = (typeof getPokemonPorNombre === 'function') ? getPokemonPorNombre(nombre) : null;
        if (!p) return null;

        let actual = p;
        let iter = 0;
        while (actual && iter < 12) {
            iter++;
            const padre = (typeof TODOS_POKEMONS !== 'undefined')
                ? TODOS_POKEMONS.find(x => x.evolucion === actual.nombre)
                : null;
            if (!padre) break;
            actual = padre;
        }
        return actual ? actual.nombre : null;
    }

    function registrarVisto(nombre) {
        if (window.modoCreativo === true) return false;
        const base = nombreBase(nombre);
        if (!base || estado.vistos[base]) return false;
        estado.vistos[base] = true;
        guardar();
        return true;
    }

    function registrarCompra(nombre, esShiny) {
        if (window.modoCreativo === true) return false;
        const base = nombreBase(nombre);
        if (!base) return false;

        let cambiado = false;
        if (!estado.comprados[base]) { estado.comprados[base] = true; cambiado = true; }
        if (!estado.vistos[base]) { estado.vistos[base] = true; cambiado = true; }
        if (esShiny === true && !estado.shinies[base]) {
            estado.shinies[base] = true;
            cambiado = true;
        }
        if (cambiado) guardar();
        return true;
    }

    function estaComprado(nombre) {
        const base = nombreBase(nombre);
        return !!(base && estado.comprados[base]);
    }

    function estaVisto(nombre) {
        const base = nombreBase(nombre);
        return !!(base && estado.vistos[base]);
    }

    function tieneShiny(nombre) {
        const base = nombreBase(nombre);
        return !!(base && estado.shinies[base]);
    }

    function estadoDe(nombre) {
        const base = nombreBase(nombre);
        if (!base) return 'no-visto';
        if (estado.comprados[base]) return 'comprado';
        if (estado.vistos[base]) return 'visto';
        return 'no-visto';
    }

    function registrarEquipoVisto(unidades) {
        if (window.modoCreativo === true) return;
        let cambiado = false;
        for (const u of (unidades || [])) {
            if (!u || !u.pokemon || !u.pokemon.nombre) continue;
            const base = nombreBase(u.pokemon.nombre);
            if (!base || estado.vistos[base]) continue;
            estado.vistos[base] = true;
            cambiado = true;
        }
        if (cambiado) guardar();
    }

    function sincronizarEquipoJugador() {
        if (window.modoCreativo === true) return;
        let cambiado = false;
        const unidades = [
            ...(typeof tablero !== 'undefined' ? tablero : []),
            ...(typeof banquillo !== 'undefined' ? banquillo : [])
        ];
        for (const u of unidades) {
            if (!u || !u.pokemon || !u.pokemon.nombre) continue;
            const base = nombreBase(u.pokemon.nombre);
            if (!base) continue;
            if (!estado.comprados[base]) { estado.comprados[base] = true; cambiado = true; }
            if (!estado.vistos[base]) { estado.vistos[base] = true; cambiado = true; }
            const esShinyUnidad = (u.esShiny === true) || (u.pokemon && u.pokemon.shiny === true);
            if (esShinyUnidad && !estado.shinies[base]) {
                estado.shinies[base] = true;
                cambiado = true;
            }
        }
        if (cambiado) guardar();
    }

    function contar() {
        const lista = (typeof POKEMONS !== 'undefined') ? POKEMONS : [];
        let comprados = 0, vistos = 0, vistosTotal = 0, shinies = 0;
        for (const p of lista) {
            const comprado = !!estado.comprados[p.nombre];
            const visto = !!estado.vistos[p.nombre];
            if (comprado) comprados++;
            if (visto) vistosTotal++;
            if (visto && !comprado) vistos++;
            if (estado.shinies[p.nombre]) shinies++;
        }
        return { total: lista.length, comprados, vistos, vistosTotal, shinies };
    }

    function reiniciar() {
        estado = { v: 2, comprados: {}, vistos: {}, shinies: {} };
        guardar();
    }

    window.Pokedex = {
        registrarVisto,
        registrarCompra,
        estaComprado,
        estaVisto,
        tieneShiny,
        estadoDe,
        registrarEquipoVisto,
        sincronizarEquipoJugador,
        contar,
        reiniciar,
        nombreBase
    };
})();
