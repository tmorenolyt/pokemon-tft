// ============================================================
// SISTEMA DE LOGROS + MAPAS DESBLOQUEABLES
// ------------------------------------------------------------
// - Todo se guarda en localStorage (por navegador).
// - Los logros se comprueban solo cuando ocurre un evento
//   (fin de combate, fusión, objeto, sinergia, torneo, PvE,
//   online) para no afectar al rendimiento del bucle de combate.
// - Cada logro puede desbloquear un mapa.
// - El modo creativo/sandbox no cuenta.
// ============================================================
(function () {
    'use strict';

    const CLAVE = 'pktft_logros_v1';
    const CLAVE_MAPA = 'pktft_mapa_v1';

    // ------------------------------------------------------------
    // LOGROS
    // tipo:
    //   contador -> estado.contadores[clave]
    //   record   -> estado.records[clave]
    //   run      -> estado.run[clave]
    //   evento   -> se marca a mano (estado.eventos[id])
    // ------------------------------------------------------------
    const LOGROS = [
        // ---------- Progresión ----------
        { id: 'primer_torneo', cat: 'progresion', icono: '🏆', nombre: 'Primer paso', desc: 'Gana tu primer torneo.', tipo: 'contador', clave: 'torneos', objetivo: 1, xp: 100, mapa: 'fuego' },
        { id: 'campeon', cat: 'progresion', icono: '👑', nombre: 'Campeón', desc: 'Gana 5 torneos.', tipo: 'contador', clave: 'torneos', objetivo: 5, xp: 250, mapa: 'acero' },
        { id: 'leyenda', cat: 'progresion', icono: '🌟', nombre: 'Leyenda', desc: 'Gana 20 torneos.', tipo: 'contador', clave: 'torneos', objetivo: 20, xp: 500, mapa: 'salvaje' },
        { id: 'nivel_8', cat: 'progresion', icono: '⬆️', nombre: 'Nivel máximo', desc: 'Llega a nivel 8 en una partida.', tipo: 'record', clave: 'maxNivel', objetivo: 8, xp: 150, mapa: 'psiquico' },
        { id: 'racha_5', cat: 'progresion', icono: '🔥', nombre: 'Racha imparable', desc: 'Consigue 5 victorias seguidas en un torneo.', tipo: 'record', clave: 'maxRacha', objetivo: 5, xp: 200, mapa: 'electrico' },

        // ---------- Unidades ----------
        { id: 'primera_3estrellas', cat: 'unidades', icono: '⭐', nombre: 'Evolución total', desc: 'Consigue tu primera unidad 3★.', tipo: 'contador', clave: 'unidades3', objetivo: 1, xp: 80, mapa: 'planta' },
        { id: 'coleccionista', cat: 'unidades', icono: '🌈', nombre: 'Coleccionista', desc: 'Consigue 5 unidades 3★ en la misma partida.', tipo: 'record', clave: 'maxRunUnidades3', objetivo: 5, xp: 250, mapa: 'eevee' },
        { id: 'mitico', cat: 'unidades', icono: '💎', nombre: 'Mítico', desc: 'Consigue una unidad de coste 5 a 3★.', tipo: 'record', clave: 'maxCoste5Tres', objetivo: 1, xp: 200, mapa: 'dragon' },

        // ---------- Sinergias ----------
        { id: 'sinergia_6', cat: 'sinergias', icono: '🔗', nombre: 'Sinergia perfecta', desc: 'Activa un tipo a nivel 6.', tipo: 'record', clave: 'maxSinergia', objetivo: 6, xp: 250, mapa: 'agua' },
        { id: 'equipo_equilibrado', cat: 'sinergias', icono: '⚖️', nombre: 'Equipo equilibrado', desc: 'Activa 3 tipos distintos a nivel 3 o más.', tipo: 'record', clave: 'maxTipos3', objetivo: 3, xp: 150, mapa: 'hada' },
        { id: 'multiple_amenaza', cat: 'sinergias', icono: '🎭', nombre: 'Múltiple amenaza', desc: 'Activa 3 clases distintas a nivel 3 o más.', tipo: 'record', clave: 'maxClases3', objetivo: 3, xp: 150 },

        // ---------- Objetos ----------
        { id: 'disco', cat: 'objetos', icono: '💿', nombre: 'Disco definitivo', desc: 'Equipa tu primer Disco Definitivo.', tipo: 'contador', clave: 'discos', objetivo: 1, xp: 100 },
        { id: 'arsenal', cat: 'objetos', icono: '🎒', nombre: 'Arsenal', desc: 'Equipa 3 objetos a una misma unidad.', tipo: 'record', clave: 'maxObjetosUnidad', objetivo: 3, xp: 150, mapa: 'roca' },
        { id: 'baul_lleno', cat: 'objetos', icono: '📦', nombre: 'Baúl lleno', desc: 'Llena el baúl de objetos.', tipo: 'evento', xp: 80 },

        // ---------- Combate ----------
        { id: 'intocable', cat: 'combate', icono: '🛡️', nombre: 'Intocable', desc: 'Gana un combate sin perder ninguna unidad.', tipo: 'evento', xp: 200, mapa: 'fantasma' },
        { id: 'contra_las_cuerdas', cat: 'combate', icono: '💪', nombre: 'Contra las cuerdas', desc: 'Gana un combate con una sola unidad viva.', tipo: 'evento', xp: 200, mapa: 'siniestro' },
        { id: 'demoledor', cat: 'combate', icono: '💥', nombre: 'Demoledor', desc: 'Haz 10.000 de daño en un combate.', tipo: 'record', clave: 'maxDaño', objetivo: 10000, xp: 200, mapa: 'lucha' },
        { id: 'sanador', cat: 'combate', icono: '💚', nombre: 'Sanador', desc: 'Cura 5.000 en un combate.', tipo: 'record', clave: 'maxCuracion', objetivo: 5000, xp: 200 },

        // ---------- PvE / Online ----------
        { id: 'cazamonstruos', cat: 'pve', icono: '👾', nombre: 'Cazamonstruos', desc: 'Derrota 10 monstruos PvE.', tipo: 'contador', clave: 'pve', objetivo: 10, xp: 150, mapa: 'veneno' },
        { id: 'verdugo_jefes', cat: 'pve', icono: '🐲', nombre: 'Verdugo de jefes', desc: 'Derrota 25 monstruos PvE.', tipo: 'contador', clave: 'pve', objetivo: 25, xp: 250, mapa: 'hielo' },
        { id: 'rival_superado', cat: 'online', icono: '🌐', nombre: 'Rival superado', desc: 'Gana una partida online.', tipo: 'contador', clave: 'onlineVictorias', objetivo: 1, xp: 250, mapa: 'volador' }
    ];

    const CATEGORIAS = [
        { id: 'todos', nombre: 'Todos', icono: '🏆' },
        { id: 'progresion', nombre: 'Progresión', icono: '📈' },
        { id: 'unidades', nombre: 'Unidades', icono: '⭐' },
        { id: 'sinergias', nombre: 'Sinergias', icono: '🔗' },
        { id: 'objetos', nombre: 'Objetos', icono: '🎒' },
        { id: 'combate', nombre: 'Combate', icono: '⚔️' },
        { id: 'pve', nombre: 'PvE', icono: '👾' },
        { id: 'online', nombre: 'Online', icono: '🌐' }
    ];

    // ------------------------------------------------------------
    // MAPAS
    // archivo = null significa "Automático" (según el rival).
    // ------------------------------------------------------------
    const MAPAS = [
        { id: 'auto', nombre: 'Automático', icono: '🎲', archivo: 'terreno.webp', auto: true, siempreDesbloqueado: true, desc: 'Cambia según el rival' },
        { id: 'pradera', nombre: 'Pradera', icono: '🌿', archivo: 'terreno.webp', siempreDesbloqueado: true, desc: 'El escenario clásico' },
        { id: 'fuego', nombre: 'Volcán', icono: '🌋', archivo: 'terreno-fuego.webp', logro: 'primer_torneo' },
        { id: 'agua', nombre: 'Costa', icono: '🌊', archivo: 'terreno-agua.webp', logro: 'sinergia_6' },
        { id: 'planta', nombre: 'Bosque', icono: '🌲', archivo: 'terreno-planta.webp', logro: 'primera_3estrellas' },
        { id: 'electrico', nombre: 'Tormenta', icono: '⚡', archivo: 'terreno-electrico.webp', logro: 'racha_5' },
        { id: 'psiquico', nombre: 'Nebulosa', icono: '🔮', archivo: 'terreno-psiquico.webp', logro: 'nivel_8' },
        { id: 'siniestro', nombre: 'Abismo', icono: '🌑', archivo: 'terreno-siniestro.webp', logro: 'contra_las_cuerdas' },
        { id: 'hada', nombre: 'Jardín Feérico', icono: '🧚', archivo: 'terreno-hada.webp', logro: 'equipo_equilibrado' },
        { id: 'fantasma', nombre: 'Ruinas', icono: '👻', archivo: 'terreno-fantasma.webp', logro: 'intocable' },
        { id: 'lucha', nombre: 'Dojo', icono: '🥋', archivo: 'terreno-lucha.webp', logro: 'demoledor' },
        { id: 'veneno', nombre: 'Pantano', icono: '☠️', archivo: 'terreno-veneno.webp', logro: 'cazamonstruos' },
        { id: 'hielo', nombre: 'Glaciar', icono: '❄️', archivo: 'terreno-hielo.webp', logro: 'verdugo_jefes' },
        { id: 'dragon', nombre: 'Santuario', icono: '🐉', archivo: 'terreno-dragon.webp', logro: 'mitico' },
        { id: 'roca', nombre: 'Cañón', icono: '🪨', archivo: 'terreno-roca.webp', logro: 'arsenal' },
        { id: 'volador', nombre: 'Cielo', icono: '☁️', archivo: 'terreno-volador.webp', logro: 'rival_superado' },
        { id: 'acero', nombre: 'Forja', icono: '⚙️', archivo: 'terreno-acero.webp', logro: 'campeon' },
        { id: 'eevee', nombre: 'Valle Evolutivo', icono: '🦊', archivo: 'terreno-eevee.webp', logro: 'coleccionista' },
        { id: 'salvaje', nombre: 'Jungla', icono: '🌴', archivo: 'terreno-salvaje.webp', logro: 'leyenda' }
    ];

    const LOGRO_POR_ID = {};
    for (const l of LOGROS) LOGRO_POR_ID[l.id] = l;
    const MAPA_POR_ID = {};
    for (const m of MAPAS) MAPA_POR_ID[m.id] = m;

    function estadoInicial() {
        return {
            v: 1,
            xp: 0,
            desbloqueados: {},
            eventos: {},
            contadores: {
                torneos: 0, combates: 0, victorias: 0, pve: 0,
                unidades3: 0, discos: 0, objetos: 0,
                onlinePartidas: 0, onlineVictorias: 0
            },
            records: {
                maxNivel: 1, maxRacha: 0, maxRunUnidades3: 0,
                maxCoste5Tres: 0, maxSinergia: 0, maxTipos3: 0,
                maxClases3: 0, maxObjetosUnidad: 0,
                maxDaño: 0, maxCuracion: 0
            },
            run: { unidades3: 0, racha: 0 },
            ultimaOnline: null
        };
    }

    function normalizar(e) {
        const base = estadoInicial();
        if (!e || typeof e !== 'object') return base;
        e.v = 1;
        e.xp = Number(e.xp) || 0;
        for (const k of ['desbloqueados', 'eventos', 'contadores', 'records', 'run']) {
            if (!e[k] || typeof e[k] !== 'object') e[k] = base[k];
        }
        for (const k in base.contadores) if (typeof e.contadores[k] !== 'number') e.contadores[k] = base.contadores[k];
        for (const k in base.records) if (typeof e.records[k] !== 'number') e.records[k] = base.records[k];
        if (typeof e.run.unidades3 !== 'number') e.run.unidades3 = 0;
        if (typeof e.run.racha !== 'number') e.run.racha = 0;
        if (typeof e.ultimaOnline === 'undefined') e.ultimaOnline = null;
        return e;
    }

    function cargar() {
        try {
            const raw = localStorage.getItem(CLAVE);
            if (raw) return normalizar(JSON.parse(raw));
        } catch (e) { /* modo privado o JSON roto */ }
        return estadoInicial();
    }

    let estado = cargar();

    function guardar() {
        try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (e) { }
    }

    function cargarMapa() {
        try {
            const id = localStorage.getItem(CLAVE_MAPA) || 'auto';
            return MAPA_POR_ID[id] ? id : 'auto';
        } catch (e) { return 'auto'; }
    }

    let mapaSel = cargarMapa();

    function guardarMapa() {
        try { localStorage.setItem(CLAVE_MAPA, mapaSel); } catch (e) { }
    }

    // ------------------------------------------------------------
    // CONSULTAS
    // ------------------------------------------------------------
    function desbloqueado(id) {
        return !!(estado.desbloqueados && estado.desbloqueados[id]);
    }

    function valor(logro) {
        if (!logro) return 0;
        // `marcar(id)` fuerza el desbloqueo de cualquier logro,
        // sea de contador, récord o evento.
        if (estado.eventos[logro.id]) return Math.max(1, Number(logro.objetivo) || 1);
        switch (logro.tipo) {
            case 'contador': return Number(estado.contadores[logro.clave] || 0);
            case 'record':   return Number(estado.records[logro.clave] || 0);
            case 'run':      return Number(estado.run[logro.clave] || 0);
            case 'evento':   return estado.eventos[logro.id] ? 1 : 0;
            default:         return 0;
        }
    }

    function mapaDesbloqueado(id) {
        const m = MAPA_POR_ID[id];
        if (!m) return false;
        // Automático y Pradera son el mapa del menú principal: siempre disponibles.
        if (m.auto || m.siempreDesbloqueado || !m.logro) return true;
        return desbloqueado(m.logro);
    }

    function mapaActual() {
        if (mapaSel === 'auto') return null;
        const m = MAPA_POR_ID[mapaSel];
        if (!m || m.auto || !mapaDesbloqueado(m.id)) return null;
        return m;
    }

    function mapaSeleccionado() { return mapaSel; }

    function seleccionarMapa(id) {
        if (id !== 'auto' && !MAPA_POR_ID[id]) return false;
        if (id !== 'auto' && !mapaDesbloqueado(id)) return false;
        mapaSel = id;
        guardarMapa();
        if (window.LogrosUI && typeof window.LogrosUI.refrescar === 'function') window.LogrosUI.refrescar();
        return true;
    }

    function xpInfo() {
        const xp = Math.max(0, Number(estado.xp) || 0);
        const nivel = Math.floor(Math.sqrt(xp / 100)) + 1;
        const base = 100 * Math.pow(nivel - 1, 2);
        const next = 100 * Math.pow(nivel, 2);
        const necesario = Math.max(1, next - base);
        const enNivel = xp - base;
        return { xp, nivel, base, next, enNivel, necesario, pct: Math.min(100, (enNivel / necesario) * 100) };
    }

    function totalDesbloqueados() {
        return Object.keys(estado.desbloqueados || {}).length;
    }

    // ------------------------------------------------------------
    // DESBLOQUEO
    // ------------------------------------------------------------
    let _notificando = false;

    function notificar(nuevos) {
        if (!nuevos || nuevos.length === 0) return;
        if (window.LogrosUI && typeof window.LogrosUI.onDesbloqueo === 'function') {
            window.LogrosUI.onDesbloqueo(nuevos);
        }
    }

    function desbloquear(logro, acumulados) {
        if (!logro || desbloqueado(logro.id)) return false;
        estado.desbloqueados[logro.id] = Date.now();
        estado.xp = (Number(estado.xp) || 0) + (logro.xp || 0);
        acumulados.push(logro);
        return true;
    }

    function comprobar() {
        const nuevos = [];
        for (const logro of LOGROS) {
            if (desbloqueado(logro.id)) continue;
            const objetivo = Math.max(1, Number(logro.objetivo) || 1);
            if (valor(logro) >= objetivo) desbloquear(logro, nuevos);
        }
        if (nuevos.length > 0) {
            guardar();
            notificar(nuevos);
        }
        return nuevos;
    }

    function marcar(id) {
        const logro = LOGRO_POR_ID[id];
        if (!logro) return false;
        estado.eventos[id] = 1;
        const nuevos = comprobar();
        if (nuevos.length === 0) guardar();
        return nuevos.length > 0;
    }

    // ------------------------------------------------------------
    // EVENTOS
    // ------------------------------------------------------------
    function esUnidadEnemiga(u) {
        if (!u) return false;
        try {
            if (u.equipo === 'enemy') return true;
            if (typeof enemyBoard !== 'undefined' && Array.isArray(enemyBoard) && enemyBoard.includes(u)) return true;
            if (typeof enemyBanquillo !== 'undefined' && Array.isArray(enemyBanquillo) && enemyBanquillo.includes(u)) return true;
        } catch (e) { }
        return false;
    }

    function evento(tipo, datos) {
        datos = datos || {};

        // El modo creativo no debe farmear logros.
        if (window.modoCreativo === true && tipo !== 'run_inicio') return [];

        // Los objetos del rival no cuentan para los logros del jugador.
        if (tipo === 'objeto_equipado' && esUnidadEnemiga(datos.unidad)) return [];

        const c = estado.contadores;
        const r = estado.records;
        const run = estado.run;

        switch (tipo) {
            case 'run_inicio':
                run.unidades3 = 0;
                run.racha = 0;
                break;

            case 'torneo_ganado':
                c.torneos += 1;
                break;

            case 'nivel': {
                const n = Number(datos.nivel) || 0;
                if (n > r.maxNivel) r.maxNivel = n;
                break;
            }

            case 'fusion':
                if ((Number(datos.nivel) || 0) >= 3) {
                    c.unidades3 += 1;
                    run.unidades3 += 1;
                    if (run.unidades3 > r.maxRunUnidades3) r.maxRunUnidades3 = run.unidades3;
                    if ((Number(datos.coste) || 0) >= 5) r.maxCoste5Tres = 1;
                }
                break;

            case 'objeto_equipado': {
                c.objetos += 1;
                if (datos.esDisco) c.discos += 1;
                const n = (datos.unidad && Array.isArray(datos.unidad.objetos)) ? datos.unidad.objetos.length : 0;
                if (n > r.maxObjetosUnidad) r.maxObjetosUnidad = n;
                if (datos.esDisco) c.discos = Math.max(1, c.discos);
                break;
            }

            case 'sinergias': {
                const s = datos.sinergias || {};
                const types = Object.keys(s.types || {}).map(k => s.types[k]).filter(Boolean);
                const classes = Object.keys(s.classes || {}).map(k => s.classes[k]).filter(Boolean);
                const maxType = types.reduce((a, x) => Math.max(a, Number(x.nivel) || 0), 0);
                const tipos3 = types.filter(x => (Number(x.nivel) || 0) >= 3).length;
                const clases3 = classes.filter(x => (Number(x.nivel) || 0) >= 3).length;
                if (maxType > r.maxSinergia) r.maxSinergia = maxType;
                if (tipos3 > r.maxTipos3) r.maxTipos3 = tipos3;
                if (clases3 > r.maxClases3) r.maxClases3 = clases3;
                break;
            }

            case 'baul':
                if (datos.max > 0 && datos.cantidad >= datos.max) estado.eventos.baul_lleno = 1;
                break;

            case 'combate_fin': {
                c.combates += 1;
                const st = datos.estadisticas || window.statsCombateEnVivo || {};
                const js = Array.isArray(st.jugadores) ? st.jugadores : [];
                const daño = js.reduce((a, u) => a + (Number(u.damageDealt) || 0), 0);
                const curacion = js.reduce((a, u) => a + (Number(u.healingDone) || 0), 0);
                if (daño > r.maxDaño) r.maxDaño = daño;
                if (curacion > r.maxCuracion) r.maxCuracion = curacion;

                if (datos.victoria) {
                    c.victorias += 1;
                    if (datos.esPvE) {
                        c.pve += 1;
                    } else {
                        run.racha += 1;
                        if (run.racha > r.maxRacha) r.maxRacha = run.racha;
                    }
                    const total = js.length;
                    const vivos = js.filter(u => !u.muerto).length;
                    if (total > 0 && vivos === total) estado.eventos.intocable = 1;
                    if (total > 1 && vivos === 1) estado.eventos.contra_las_cuerdas = 1;
                } else if (!datos.esPvE) {
                    run.racha = 0;
                }
                break;
            }

            case 'online_fin': {
                const clave = datos.partida || null;
                if (clave && estado.ultimaOnline === clave) return [];
                estado.ultimaOnline = clave;
                c.onlinePartidas += 1;
                if (datos.gane) c.onlineVictorias += 1;
                break;
            }

            default:
                return [];
        }

        return comprobar();
    }

    // ------------------------------------------------------------
    // API PÚBLICA
    // ------------------------------------------------------------
    window.Logros = {
        LOGROS,
        CATEGORIAS,
        MAPAS,
        init: function () { return estado; },
        estado: function () { return estado; },
        evento,
        marcar,
        comprobar,
        desbloqueado,
        valor,
        totalDesbloqueados,
        xpInfo,
        getLogro: id => LOGRO_POR_ID[id] || null,
        getMapa: id => MAPA_POR_ID[id] || null,
        mapaDesbloqueado,
        mapaActual,
        mapaSeleccionado,
        seleccionarMapa
    };
})();
