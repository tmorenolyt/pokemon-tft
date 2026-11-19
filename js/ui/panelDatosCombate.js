// ============================================================
// PANEL DE DATOS DE COMBATE - MODAL CENTRADO
// v4.1 - FIX: Ignorar valores de daño absurdos (>100.000) para
//        que las barras del jugador se vean correctamente.
//        FIX: Mínimo visual del 2% para que las barras no
//        desaparezcan cuando la diferencia de daño es enorme.
// ============================================================
// - Lee stats EN VIVO (window.statsCombateEnVivo) durante el combate.
// - Fallback a stats FINALES (window.postCombateData) al terminar.
// - Auto-refresh cada 500ms mientras el panel está abierto.
// - Cierra tienda y carta si están abiertas al abrir panel.
// ============================================================

let panelDatosCombateAbierto = false;
let panelDatosCombateFiltro = 'damage';
let panelDatosIntervalId = null;

// ============================================================
// ABRIR / CERRAR
// ============================================================

function abrirPanelDatosCombate() {
    const panel = document.getElementById('panelDatosCombate');
    if (!panel) {
        console.error('❌ #panelDatosCombate no existe en el DOM');
        return;
    }

    // Cerrar tienda si está abierta
    try {
        if (typeof tiendaAbierta !== 'undefined' && tiendaAbierta) {
            if (typeof cerrarTienda === 'function') {
                cerrarTienda();
            }
        }
    } catch (e) {}

    // Cerrar carta si está abierta
    try {
        if (typeof cartaAbierta !== 'undefined' && cartaAbierta) {
            if (typeof cerrarCarta === 'function') {
                cerrarCarta();
            }
        }
    } catch (e) {}

    panelDatosCombateAbierto = true;
    window.panelDatosCombateAbierto = true;

    // 🆕 Modal centrado: click fuera cierra
    panel.onclick = function(e) {
        if (e.target === panel) {
            cerrarPanelDatosCombate();
        }
    };

    panel.style.display = 'flex';
    panel.style.animation = 'none';
    void panel.offsetWidth;

    renderizarPanelDatosCombate();
    iniciarAutoRefreshPanelDatos();

    if (typeof playButtonSound === 'function') playButtonSound();
}

function cerrarPanelDatosCombate() {
    const panel = document.getElementById('panelDatosCombate');
    if (!panel) return;

    panelDatosCombateAbierto = false;
    window.panelDatosCombateAbierto = false;
    panel.style.display = 'none';
    panel.onclick = null;

    detenerAutoRefreshPanelDatos();
}

function togglePanelDatosCombate() {
    if (panelDatosCombateAbierto) {
        cerrarPanelDatosCombate();
    } else {
        abrirPanelDatosCombate();
    }
}

// ============================================================
// AUTO-REFRESH
// ============================================================

function iniciarAutoRefreshPanelDatos() {
    if (panelDatosIntervalId) return;
    panelDatosIntervalId = setInterval(() => {
        if (panelDatosCombateAbierto) {
            renderizarPanelDatosCombate();
        } else {
            clearInterval(panelDatosIntervalId);
            panelDatosIntervalId = null;
        }
    }, 500);
}

function detenerAutoRefreshPanelDatos() {
    if (panelDatosIntervalId) {
        clearInterval(panelDatosIntervalId);
        panelDatosIntervalId = null;
    }
}

// ============================================================
// RENDERIZAR
// ============================================================

function renderizarPanelDatosCombate() {
    let data = null;

    // Prioridad: stats en vivo durante el combate
    if (window.statsCombateEnVivo && window.statsCombateEnVivo.activo) {
        data = {
            statsJugadores: window.statsCombateEnVivo.jugadores || [],
            statsRivales: window.statsCombateEnVivo.rivales || []
        };
    }
    // Fallback: stats finales
    else if (window.postCombateData) {
        data = window.postCombateData;
    }

    if (!data) {
        const listaJ = document.getElementById('panelDatosListaJugador');
        const listaE = document.getElementById('panelDatosListaEnemigo');
        if (listaJ) listaJ.innerHTML = '<div style="text-align:center;color:#6b8aaa;font-size:0.7rem;padding:20px 0;">Sin datos todavía</div>';
        if (listaE) listaE.innerHTML = '<div style="text-align:center;color:#6b8aaa;font-size:0.7rem;padding:20px 0;">Sin datos todavía</div>';
        const totalJEl = document.getElementById('panelDatosTotalJugador');
        const totalEEl = document.getElementById('panelDatosTotalEnemigo');
        if (totalJEl) totalJEl.textContent = 'Total: 0';
        if (totalEEl) totalEEl.textContent = 'Total: 0';
        return;
    }

        // ===== Avatares + nombres =====
    // 🆕 FIX: si estamos en la SIGUIENTE ronda (ya hay postCombateData
    // pero el combate nuevo aún no ha empezado), mostramos el rival
    // ANTERIOR (el que acaba de pelear), no el nuevo.
    //
    // - Durante el combate: window.statsCombateEnVivo.activo === true
    //   → usar window.rivalActual (el rival en curso).
    // - Después del combate, antes del siguiente:
    //   → usar window.rivalAnterior (el rival que acaba de pelear).
    const enCombateActivo = !!(window.statsCombateEnVivo && window.statsCombateEnVivo.activo);
    const rivalActual = enCombateActivo
        ? window.rivalActual
        : (window.rivalAnterior || window.rivalActual);

    // 👥 En 2P se resuelven ambos lados (activo/inactivo) con nombre+avatar propios.
    let nombreMostrar = (typeof window.nombreJugador !== 'undefined' && window.nombreJugador)
        ? window.nombreJugador : "Entrenador";
    let avatarMostrar = (typeof window.avatarJugador !== 'undefined' && window.avatarJugador)
        ? window.avatarJugador : "rojo";
    let carpetaPlayer = 'jugador';

        let nombreEnemigo = rivalActual ? rivalActual.nombre : "Rival";
    let avatarEnemigo = rivalActual ? rivalActual.avatar : null;
    let carpetaEnemigo = 'rivales';

    // 🆕 Si es un monstruo PvE, no tiene avatar de rivales.
    if (rivalActual && rivalActual.esMonstruo) {
        avatarEnemigo = null;
        nombreEnemigo = rivalActual.nombre + ' (PvE)';
    }

    // 🌐 Online 1v1: el rival es el Jugador 2 (tu amigo), no la IA
    if (window._modoOnline && !(rivalActual && rivalActual.esMonstruo)) {
        nombreEnemigo = (window._amigo && window._amigo.name) ? window._amigo.name : 'Jugador 2';
        avatarEnemigo = (window._amigo && window._amigo.avatar) ? window._amigo.avatar : 'azul';
        carpetaEnemigo = 'jugador';
    }

    // 👥 2P: lados FIJOS — J1 siempre a la izquierda, J2 a la derecha
    // (independientemente de quién tenga el turno activo).
    let ladosFijos2P = false;
    if (window.modoDosJugadores) {
        const nombreJ1 = (window.nombreJugador || 'Jugador 1');
        const avatarJ1 = (window.avatarJugador || 'rojo');
        const nombreJ2 = (window.nombreJugador2 || 'Jugador 2');
        const avatarJ2 = (window.avatarJugador2 || 'azul');

        nombreMostrar = nombreJ1;
        avatarMostrar = avatarJ1;
        carpetaPlayer = 'jugador';

        nombreEnemigo = nombreJ2;
        avatarEnemigo = avatarJ2;
        carpetaEnemigo = 'jugador';

        // Los datos vienen de un combate concreto: si en ese combate el lado
        // "jugador" era J2 (quien abrió la ronda), los intercambiamos para que
        // J1 quede SIEMPRE a la izquierda y J2 a la derecha.
        ladosFijos2P = (window._ultimoCombateJugadorEsJ2 === true);
    }

    const nombreJugadorEl = document.getElementById('panelDatosNombreJugador');
    if (nombreJugadorEl) nombreJugadorEl.textContent = nombreMostrar;

    const nombreEnemigoEl = document.getElementById('panelDatosNombreEnemigo');
    if (nombreEnemigoEl) nombreEnemigoEl.textContent = nombreEnemigo;

    const avatarJugadorEl = document.getElementById('panelDatosAvatarJugador');
    if (avatarJugadorEl) {
        const srcJugador = `assets/avatars/${carpetaPlayer}/${avatarMostrar}.png`;
        if (!avatarJugadorEl.querySelector('img')) {
            avatarJugadorEl.innerHTML = '';
            const img = document.createElement('img');
            img.src = srcJugador;
            img.alt = nombreMostrar;
            img.onerror = function () {
                this.style.display = 'none';
                avatarJugadorEl.textContent = '🧢';
            };
            avatarJugadorEl.appendChild(img);
        } else {
            const imgActual = avatarJugadorEl.querySelector('img');
            if (imgActual && !imgActual.src.includes(avatarMostrar)) {
                imgActual.src = srcJugador;
            }
        }
    }

    const avatarEnemigoEl = document.getElementById('panelDatosAvatarEnemigo');
    if (avatarEnemigoEl) {
        if (avatarEnemigo) {
            const srcEnemigo = `assets/avatars/${carpetaEnemigo}/${avatarEnemigo}.png`;
            if (!avatarEnemigoEl.querySelector('img')) {
                avatarEnemigoEl.innerHTML = '';
                const img = document.createElement('img');
                img.src = srcEnemigo;
                img.alt = nombreEnemigo;
                img.onerror = function () {
                    this.style.display = 'none';
                    avatarEnemigoEl.textContent = '👤';
                };
                avatarEnemigoEl.appendChild(img);
            } else {
                const imgActual = avatarEnemigoEl.querySelector('img');
                if (imgActual && !imgActual.src.includes(avatarEnemigo)) {
                    imgActual.src = srcEnemigo;
                }
            }
        } else {
            avatarEnemigoEl.innerHTML = '';
            avatarEnemigoEl.textContent = '👤';
        }
    }

    // ===== Título del filtro =====
    const tituloEl = document.getElementById('panelDatosTituloFiltro');
    const titulos = {
        damage: 'Daño infligido',
        received: 'Daño recibido',
        heal: 'Curaciones'
    };
    if (tituloEl) tituloEl.textContent = titulos[panelDatosCombateFiltro] || '';

    // ===== Listas =====
    let statsJugadores = (data.statsJugadores || []).slice();
    let statsRivales = (data.statsRivales || []).slice();

    // 👥 2P con lados fijos: si J2 es el activo, espejamos los datos para que
    // coincidan con J1 (izquierda) / J2 (derecha).
    if (ladosFijos2P) {
        const tmp = statsJugadores;
        statsJugadores = statsRivales;
        statsRivales = tmp;
    }

    function ordenarPorFiltro(lista) {
        if (panelDatosCombateFiltro === 'damage') {
            lista.sort((a, b) => (b.damageDealt || 0) - (a.damageDealt || 0));
        } else if (panelDatosCombateFiltro === 'received') {
            lista.sort((a, b) => (b.damageTaken || 0) - (a.damageTaken || 0));
        } else if (panelDatosCombateFiltro === 'heal') {
            lista.sort((a, b) => (b.healingDone || 0) - (a.healingDone || 0));
        }
        return lista;
    }

    ordenarPorFiltro(statsJugadores);
    ordenarPorFiltro(statsRivales);

    const todos = [...statsJugadores, ...statsRivales];
    let maxValor = 1;
    
    // 🆕 FIX v4.1: Ignorar valores absurdos (>100.000) para calcular el máximo
    for (let s of todos) {
        let v = 0;
        if (panelDatosCombateFiltro === 'damage') v = s.damageDealt || 0;
        else if (panelDatosCombateFiltro === 'received') v = s.damageTaken || 0;
        else if (panelDatosCombateFiltro === 'heal') v = s.healingDone || 0;
        
        if (v > maxValor && v < 100000) {
            maxValor = v;
        }
    }

    renderizarListaPanel(statsJugadores, 'panelDatosListaJugador', maxValor);
    renderizarListaPanel(statsRivales, 'panelDatosListaEnemigo', maxValor);

    function sumaTotal(lista) {
        let total = 0;
        for (let s of lista) {
            if (panelDatosCombateFiltro === 'damage') total += (s.damageDealt || 0);
            else if (panelDatosCombateFiltro === 'received') total += (s.damageTaken || 0);
            else if (panelDatosCombateFiltro === 'heal') total += (s.healingDone || 0);
        }
        return Math.round(total);
    }

    const totalJEl = document.getElementById('panelDatosTotalJugador');
    const totalEEl = document.getElementById('panelDatosTotalEnemigo');
    if (totalJEl) totalJEl.textContent = `Total: ${sumaTotal(statsJugadores)}`;
    if (totalEEl) totalEEl.textContent = `Total: ${sumaTotal(statsRivales)}`;
}

// ============================================================
// RENDERIZAR LISTA
// ============================================================

function renderizarListaPanel(lista, contenedorId, maxValor) {
    const cont = document.getElementById(contenedorId);
    if (!cont) return;

    if (lista.length === 0) {
        cont.innerHTML = '<div style="text-align:center;color:#6b8aaa;font-size:0.6rem;padding:10px 0;">Sin datos</div>';
        return;
    }

    let html = '';
    for (let s of lista) {
        let valor = 0;
        let claseBarra = 'damage';

        if (panelDatosCombateFiltro === 'damage') {
            valor = s.damageDealt || 0;
            if (s.tipoAtaque === 'especial') {
                claseBarra = 'damage-especial';
            } else {
                claseBarra = 'damage';
            }
        } else if (panelDatosCombateFiltro === 'received') {
            valor = s.damageTaken || 0;
            claseBarra = 'received';
        } else if (panelDatosCombateFiltro === 'heal') {
            valor = s.healingDone || 0;
            claseBarra = 'heal';
        }

        let porcentaje = maxValor > 0 ? Math.min(100, (valor / maxValor) * 100) : 0;
        
        // 🆕 FIX v4.1: Mínimo visual del 2% si el valor es mayor que 0
        // para que las barras no desaparezcan en comparaciones extremas.
        if (valor > 0 && porcentaje < 2) {
            porcentaje = 2;
        }
        
        // Si el valor es mayor a 100.000, lo limitamos visualmente al 100%
        // (aunque el número de texto seguirá mostrando el valor real)
        if (porcentaje > 100) porcentaje = 100;

        const spriteUrl = typeof getSpriteUrl === 'function'
            ? getSpriteUrl(s.spriteId || s.id, s.nombre)
            : '';

        html += `
            <div class="panel-datos-item">
                <div class="sprite">
                    <img src="${spriteUrl}" alt="${s.nombre}" onerror="this.style.display='none'">
                </div>
                <div class="info">
                    <div class="fila-superior">
                        <span class="valor">${Math.round(valor)}</span>
                    </div>
                    <div class="barra-container">
                        <div class="barra-fill ${claseBarra}" style="width:${porcentaje}%;"></div>
                    </div>
                </div>
            </div>
        `;
    }

    cont.innerHTML = html;
}

// ============================================================
// FILTROS
// ============================================================

function conectarFiltrosPanelDatos() {
    document.querySelectorAll('.panel-datos-filtro').forEach(btn => {
        btn.addEventListener('click', function () {
            const filtro = this.dataset.filtro;
            if (!filtro) return;

            document.querySelectorAll('.panel-datos-filtro').forEach(b => b.classList.remove('activo'));
            this.classList.add('activo');

            panelDatosCombateFiltro = filtro;
            renderizarPanelDatosCombate();
        });
    });
}

// ============================================================
// INICIALIZAR
// ============================================================

function initPanelDatosCombate() {
    try {
        const btnCerrar = document.getElementById('btnCerrarPanelDatos');
        if (btnCerrar) {
            btnCerrar.addEventListener('click', cerrarPanelDatosCombate);
        }

        conectarFiltrosPanelDatos();

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && panelDatosCombateAbierto) {
                cerrarPanelDatosCombate();
            }
        });

        console.log('✅ panelDatosCombate.js inicializado correctamente');
    } catch (e) {
        console.error('❌ Error en initPanelDatosCombate:', e);
    }
}

// ============================================================
// 🔴 EXPONER GLOBALMENTE
// ============================================================

try {
    window.abrirPanelDatosCombate = abrirPanelDatosCombate;
    window.cerrarPanelDatosCombate = cerrarPanelDatosCombate;
    window.togglePanelDatosCombate = togglePanelDatosCombate;
    window.renderizarPanelDatosCombate = renderizarPanelDatosCombate;
    window.iniciarAutoRefreshPanelDatos = iniciarAutoRefreshPanelDatos;
    window.detenerAutoRefreshPanelDatos = detenerAutoRefreshPanelDatos;
    window.initPanelDatosCombate = initPanelDatosCombate;

    // Usar getters/setters para que panelDatosCombateAbierto esté sincronizado
    Object.defineProperty(window, 'panelDatosCombateAbierto', {
        get: function() { return panelDatosCombateAbierto; },
        set: function(v) { panelDatosCombateAbierto = v; },
        configurable: true
    });

    console.log('✅ panelDatosCombate.js: funciones expuestas globalmente');
} catch (e) {
    console.error('❌ Error al exponer funciones globalmente:', e);
}

// ============================================================
// INICIALIZACIÓN
// ============================================================

if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initPanelDatosCombate, 0);
} else {
    document.addEventListener('DOMContentLoaded', initPanelDatosCombate);
}