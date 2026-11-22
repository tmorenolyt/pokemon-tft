// ============================================================
// SISTEMA DE BOCADILLOS ESTILO CÓMIC
// v4 - Efecto typing (letra a letra) + cursor parpadeante
// ============================================================

let _comicBubbleTimeout = null;
let _comicBubbleElement = null;
let _comicBubbleElementPadre = null;

// ============================================================
// 🆕 CONFIGURACIÓN DEL TYPING
// ============================================================
const COMIC_TYPING_VELOCIDAD = 15;        // ms por letra
const COMIC_TYPING_CURSOR = '▌';          // carácter del cursor
const COMIC_TYPING_PAUSA_FINAL = 300;     // ms extra tras terminar de escribir

// ===== FRASES GENÉRICAS POR DEFECTO =====
const COMIC_BUBBLE_FRASES_DEFAULT = {
    lose: [
        "¡Imposible!",
        "¡Esto no ha acabado!",
        "¡Me las pagarás!",
        "¡No me lo puedo creer!",
        "¡Buena pelea!"
    ],
    win: [
        "¡Ja! ¿Eso es todo?",
        "¡Fácil!",
        "¡Aún te falta mucho!",
        "¡Entrena más!",
        "¡Así se juega!"
    ],
    lowHp: [
        "¡Por los pelos!",
        "¡Casi me tienes!",
        "¡Uf! Eso ha estado cerca..."
    ],
    lastStand: [
        "¡Esta es mi última oportunidad!",
        "¡Lo daré todo!",
        "¡No pienso rendirme!"
    ],
    start: [
        "¡Prepárate!",
        "¡Allá voy!",
        "¡Vamos!",
        "¡Que empiece!"
    ],
    thinking: [
        "🤔 ...",
        "Hmm...",
        "Interesante...",
        "¿Y ahora qué?",
        "Déjame pensar..."
    ]
};

// ===== OBTENER FRASE =====
function obtenerFraseComic(situacion, contexto = {}) {
    // 🆕 FIX: usar el rival capturado en el contexto si existe.
    // Así el bocadillo usa las frases del rival que se acaba de
    // combatir, no las del siguiente rival.
    const rival = contexto.rival || window.rivalActual;

    let frases = null;

    if (rival && rival.frases) {
        if (rival.frases[situacion] && rival.frases[situacion].length > 0) {
            frases = rival.frases[situacion];
        } else {
            if (situacion === 'thinking' && rival.frases.lose) {
                frases = rival.frases.lose;
            } else if (situacion === 'lowHp' && rival.frases.lose) {
                frases = rival.frases.lose;
            } else if (situacion === 'lastStand' && rival.frases.lose) {
                frases = rival.frases.lose;
            } else if (situacion === 'start' && rival.frases.win) {
                frases = rival.frases.win;
            }
        }
    }

    if (!frases || frases.length === 0) {
        frases = COMIC_BUBBLE_FRASES_DEFAULT[situacion] || COMIC_BUBBLE_FRASES_DEFAULT.lose;
    }

    return frases[Math.floor(Math.random() * frases.length)];
}

// ===== CALCULAR SITUACIÓN =====
function calcularSituacionComic(victoriaJugador) {
    const hpEnemigo = (typeof enemyHealth !== 'undefined') ? enemyHealth : 100;
    const hpMaxEnemigo = 100;
    const porcentajeHP = hpEnemigo / hpMaxEnemigo;

    if (victoriaJugador && hpEnemigo <= 15 && hpEnemigo > 0) {
        return 'lastStand';
    }

    if (!victoriaJugador && porcentajeHP < 0.20 && porcentajeHP > 0) {
        return 'lowHp';
    }

    return victoriaJugador ? 'lose' : 'win';
}

// ============================================================
// ===== MOSTRAR BOCADILLO - v4 con TYPING =====
// ============================================================

function mostrarComicBubble(elementoPadre, frase, duracionMs = 4000, situacion = null, nombre = null) {
    if (!elementoPadre || !frase) return;

    // Si ya había uno, lo cerramos inmediatamente
    if (_comicBubbleElement) {
        cerrarComicBubble(true);
    }

    // Verificar que el elemento padre es visible
    let rectPadre = null;
    let usarBodyComoFallback = false;

    try {
        rectPadre = elementoPadre.getBoundingClientRect();
        if (!rectPadre || rectPadre.width === 0 || rectPadre.height === 0) {
            console.warn(`⚠️ mostrarComicBubble: elemento padre no visible (w=${rectPadre ? rectPadre.width : '?'}, h=${rectPadre ? rectPadre.height : '?'}), usando body como fallback`);
            usarBodyComoFallback = true;
        }
    } catch (e) {
        console.warn(`⚠️ mostrarComicBubble: error obteniendo rect del padre`, e);
        usarBodyComoFallback = true;
    }

    // Crear el bocadillo
    const bubble = document.createElement('div');
    bubble.className = 'comic-bubble';

    if (nombre) {
        const nameEl = document.createElement('span');
        nameEl.className = 'comic-bubble-name';
        nameEl.textContent = nombre;
        bubble.appendChild(nameEl);
    }

    const textEl = document.createElement('span');
    textEl.className = 'comic-bubble-text';
    // 🆕 Empezamos con un espacio NO separador para que el bubble tenga altura desde el principio
    // (así no "salta" cuando empieza a escribir)
    textEl.textContent = '\u00A0';
    bubble.appendChild(textEl);

    // 🆕 Cursor parpadeante (span que el typing controla)
    const cursorEl = document.createElement('span');
    cursorEl.className = 'comic-bubble-cursor';
    cursorEl.textContent = COMIC_TYPING_CURSOR;
    bubble.appendChild(cursorEl);

    // 🖼️ Retrato grande del rival (en PC; en móvil el CSS lo oculta).
    // Usamos el avatar del panel del rival, así cada rival muestra su cara.
    const avatarEl = elementoPadre ? elementoPadre.querySelector('.player-info-avatar img') : null;
    const srcAvatar = avatarEl ? avatarEl.getAttribute('src') : null;
    if (srcAvatar) {
        const retrato = document.createElement('div');
        retrato.className = 'comic-portrait';
        const imgRetrato = document.createElement('img');
        imgRetrato.src = srcAvatar;
        imgRetrato.alt = nombre || 'Rival';
        imgRetrato.draggable = false;
        retrato.appendChild(imgRetrato);
        bubble.appendChild(retrato);
        bubble.classList.add('con-retrato');
    }

    if (situacion === 'win') bubble.classList.add('bubble-victory');
    else if (situacion === 'lowHp') bubble.classList.add('bubble-low-hp');
    else if (situacion === 'lastStand') bubble.classList.add('bubble-last-stand');
    else if (situacion === 'thinking') bubble.classList.add('bubble-thinking');

    bubble.addEventListener('click', (e) => {
        e.stopPropagation();
        // 🆕 Si están escribiendo, al hacer click se completa el texto y se cierra
        if (bubble._typingInterval) {
            clearInterval(bubble._typingInterval);
            bubble._typingInterval = null;
            textEl.textContent = frase;
            if (cursorEl) cursorEl.style.display = 'none';
        }
        cerrarComicBubble();
    });

    // Anclar al body
    document.body.appendChild(bubble);

    // Calcular posición
    let top, left;

    if (usarBodyComoFallback || !rectPadre) {
        top = 20;
        left = window.innerWidth - 320 - 20;
        if (left < 10) left = 10;
    } else {
        top = rectPadre.bottom + 20;
        left = rectPadre.left - 10;

        if (left < 10) left = 10;

        const anchoBubble = 320;
        if (left + anchoBubble > window.innerWidth - 10) {
            left = window.innerWidth - anchoBubble - 10;
        }

        const altoBubble = 100;
        if (top + altoBubble > window.innerHeight - 10) {
            top = rectPadre.top - altoBubble - 20;
        }
    }

    bubble.style.top = top + 'px';
    bubble.style.left = left + 'px';
    bubble.style.zIndex = '99999';

    // 🆕 El ancho real cambia mientras escribe el texto (y en PC el estilo
    // Persona inclina la caja, que la ensancha). En vez de dar por hecho los
    // 320 px del cálculo, recolocamos con el ancho medido de verdad.
    const MARGEN_DERECHA_BURBUJA = 20;
    const recolocarBocadillo = () => {
        const ancho = bubble.offsetWidth;
        const izq = parseFloat(bubble.style.left) || 0;
        if (izq + ancho + MARGEN_DERECHA_BURBUJA > window.innerWidth) {
            bubble.style.left = Math.max(10, window.innerWidth - ancho - MARGEN_DERECHA_BURBUJA) + 'px';
        }
    };
    recolocarBocadillo();

    // 📐 Pegarla justo encima de la barra de acciones (PC y móvil), con un
    //    margen mínimo de 4 px. Así queda centrada con ella y sin huecos raros.
    try {
        const barraAcciones = document.querySelector('.action-bar');
        if (barraAcciones) {
            const rb = barraAcciones.getBoundingClientRect();
            if (rb.height > 0) {
                bubble.style.top = 'auto';
                bubble.style.bottom = Math.max(8, Math.round(window.innerHeight - rb.top + 4)) + 'px';
            }
        }
    } catch (e) { /* sin barra de acciones */ }

    _comicBubbleElement = bubble;
    _comicBubbleElementPadre = document.body;

    if (typeof playUISound === 'function') {
        playUISound('click.mp3', 0.08);
    }

    // ============================================================
    // 🆕 EFECTO TYPING
    // ============================================================
    let i = 0;
    const velocidad = COMIC_TYPING_VELOCIDAD;
    // 🆕 Empezamos con el texto vacío (sin el espacio inicial)
    textEl.textContent = '';

    const typingInterval = setInterval(() => {
        if (i < frase.length) {
            textEl.textContent += frase[i];
            i++;
        } else {
            clearInterval(typingInterval);
            bubble._typingInterval = null;
            if (cursorEl) {
                cursorEl.style.display = 'none';
            }
            // Ya está todo el texto: el bocadillo es más ancho, reajustamos.
            recolocarBocadillo();
            if (typeof playUISound === 'function') {
                playUISound('click.mp3', 0.05);
            }
        }
    }, velocidad);

    bubble._typingInterval = typingInterval;

    // ============================================================
    // 🆕 TIEMPO TOTAL = duración + typing + pausa final
    // ============================================================
    const tiempoTyping = (frase.length * velocidad);
    const duracionTotal = duracionMs + tiempoTyping + COMIC_TYPING_PAUSA_FINAL;

    if (_comicBubbleTimeout) clearTimeout(_comicBubbleTimeout);
    _comicBubbleTimeout = setTimeout(() => {
        cerrarComicBubble();
    }, duracionTotal);
}

// ===== CERRAR BOCADILLO =====
function cerrarComicBubble(inmediato = false) {
    if (!_comicBubbleElement) return;

    if (_comicBubbleTimeout) {
        clearTimeout(_comicBubbleTimeout);
        _comicBubbleTimeout = null;
    }

    const bubble = _comicBubbleElement;

    // 🆕 Cancelar typing si sigue corriendo
    if (bubble && bubble._typingInterval) {
        clearInterval(bubble._typingInterval);
        bubble._typingInterval = null;
    }

    _comicBubbleElement = null;
    _comicBubbleElementPadre = null;

    if (inmediato) {
        if (bubble.parentNode) bubble.remove();
        return;
    }

    bubble.classList.add('closing');
    setTimeout(() => {
        if (bubble.parentNode) bubble.remove();
    }, 300);
}

// ===== MOSTRAR REACCIÓN DEL ENEMIGO =====
function mostrarReaccionEnemigo(victoriaJugador, rivalParaFrase = null) {
    if (window.modoDosJugadores) return;

    const rivalCapturado = rivalParaFrase || window.rivalActual;

    const panel = document.getElementById('enemyInfoPanel');
    if (!panel) {
        console.warn('⚠️ mostrarReaccionEnemigo: no se encontró #enemyInfoPanel');
        return;
    }

    const ancla = panel.querySelector('.player-info-header') || panel;
    const situacion = calcularSituacionComic(victoriaJugador);
    const frase = obtenerFraseComic(situacion, { victoriaJugador, rival: rivalCapturado });

    mostrarComicBubble(ancla, frase, 2500, situacion, null);
}

// ===== MOSTRAR REACCIÓN DEL JUGADOR =====
function mostrarReaccionJugador(victoriaJugador) {
    if (window.modoDosJugadores) return; // 👥 Sin bocadillos en 2 jugadores
    setTimeout(() => {
        const panel = document.getElementById('playerInfoPanel');
        if (!panel) return;

        const ancla = panel.querySelector('.player-info-header') || panel;

        const frases = victoriaJugador
            ? ["¡Sí!", "¡Vamos!", "¡Genial!", "¡Bien jugado!"]
            : ["¡No!", "¡Maldición!", "¡Otra vez no!", "¡Vuelvo a intentarlo!"];

        const frase = frases[Math.floor(Math.random() * frases.length)];

        const bubble = document.createElement('div');
        bubble.className = 'comic-bubble bubble-left';
        bubble.textContent = frase;
        bubble.addEventListener('click', (e) => {
            e.stopPropagation();
            if (bubble.parentNode) bubble.remove();
        });

        document.body.appendChild(bubble);

        const rect = ancla.getBoundingClientRect();
        bubble.style.top = (rect.bottom + 20) + 'px';
        bubble.style.left = Math.max(10, rect.left - 30) + 'px';
        bubble.style.zIndex = '99999';

        setTimeout(() => {
            if (bubble.parentNode) bubble.remove();
        }, 3500);
    }, 1500);
}

// ===== REACCIÓN AL INICIO DEL COMBATE =====
function mostrarReaccionInicioCombate() {
    if (window.modoDosJugadores) return; // 👥 Sin bocadillos en 2 jugadores
    const panel = document.getElementById('enemyInfoPanel');
    if (!panel) return;

    const ancla = panel.querySelector('.player-info-header') || panel;
    const frase = obtenerFraseComic('start');
    mostrarComicBubble(ancla, frase, 2000, 'start');
}

// ============================================================
// 🆕 MOSTRAR REACCIÓN "PENSANDO"
// ============================================================

function mostrarReaccionPensando(duracionMs = 1800) {
    if (window.modoCreativo) return;
    if (window.modoDosJugadores) return; // 👥 Sin bocadillos en 2 jugadores

    const panel = document.getElementById('enemyInfoPanel');
    if (!panel) return;

    const ancla = panel.querySelector('.player-info-header') || panel;
    const frase = obtenerFraseComic('thinking');

    mostrarComicBubble(ancla, frase, duracionMs, 'thinking');
}

// ===== EXPONER GLOBALMENTE =====
window.mostrarComicBubble = mostrarComicBubble;
window.cerrarComicBubble = cerrarComicBubble;
window.mostrarReaccionEnemigo = mostrarReaccionEnemigo;
window.mostrarReaccionJugador = mostrarReaccionJugador;
window.mostrarReaccionInicioCombate = mostrarReaccionInicioCombate;
window.mostrarReaccionPensando = mostrarReaccionPensando;
window.obtenerFraseComic = obtenerFraseComic;
