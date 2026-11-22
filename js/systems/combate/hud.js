// ============================================================
// COMBATE · HUD
// Extraído de js/systems/combate.js (sin cambios de lógica).
// ============================================================

function actualizarCopiaEstadisticas(unidad, statKey, valor) {
    if (!unidad) return;
    
    // 🆕 FIX CRÍTICO: Evitar que el contador se desborde.
    // Si el valor es mayor a 5000 de golpe, es un bug de DoT (quemadura/veneno).
    // Lo ignoramos para que no sume 37 millones al panel.
    if (typeof valor !== 'number' || isNaN(valor) || valor > 5000) {
        return;
    }

    for (let copia of equipoCompletoJugador) {
        if (copia && copia.pokemon && unidad.pokemon && copia.pokemon.id === unidad.pokemon.id && copia.baseId === unidad.baseId) {
            if (statKey === 'damageDealt') copia.damageDealt = (copia.damageDealt || 0) + valor;
            else if (statKey === 'damageTaken') copia.damageTaken = (copia.damageTaken || 0) + valor;
            else if (statKey === 'healingDone') copia.healingDone = (copia.healingDone || 0) + valor;
            else if (statKey === 'damageBlocked') copia.damageBlocked = (copia.damageBlocked || 0) + valor;
            copia.hp = unidad.hp;
            copia.muerto = unidad.muerto || false;
            return;
        }
    }
    for (let copia of equipoCompletoEnemigo) {
        if (copia && copia.pokemon && unidad.pokemon && copia.pokemon.id === unidad.pokemon.id && copia.baseId === unidad.baseId) {
            if (statKey === 'damageDealt') copia.damageDealt = (copia.damageDealt || 0) + valor;
            else if (statKey === 'damageTaken') copia.damageTaken = (copia.damageTaken || 0) + valor;
            else if (statKey === 'healingDone') copia.healingDone = (copia.healingDone || 0) + valor;
            else if (statKey === 'damageBlocked') copia.damageBlocked = (copia.damageBlocked || 0) + valor;
            copia.hp = unidad.hp;
            copia.muerto = unidad.muerto || false;
            return;
        }
    }
}

function actualizarBarraVidaPokemon(elemento, hp, maxHp, dañoRecibido = 0, unidad = null) {
    if (!elemento || typeof elemento.querySelector !== 'function') return;
    try {
        const hpBar = elemento.querySelector('.hp-fill');
        if (!hpBar) return;
        const percent = Math.max(0, Math.min(100, (hp / maxHp) * 100));
        if (unidad && unidad._reviviendo) {
            hpBar.style.transition = 'none';
            hpBar.style.width = percent + '%';
            void hpBar.offsetWidth;
            requestAnimationFrame(() => {
                if (hpBar && hpBar.style) hpBar.style.transition = '';
            });
        } else {
            hpBar.style.width = percent + '%';
        }
        hpBar.className = 'hp-fill';
        if (percent > 50) hpBar.className = 'hp-fill';
        else if (percent > 25) hpBar.className = 'hp-fill medium';
        else if (percent > 10) hpBar.className = 'hp-fill low';
        else hpBar.className = 'hp-fill critical';
        if (dañoRecibido > 0) {
            hpBar.classList.add('damage-flash');
            setTimeout(() => {
                if (hpBar && hpBar.classList) hpBar.classList.remove('damage-flash');
            }, 300);
        }
        if (unidad) {
            const barraHP = elemento.querySelector('.unit-hp-bar');
            if (barraHP) {
                const escudoExistente = barraHP.querySelector('.hp-shield');
                let escudoActualizado = false;
                if (unidad.escudoActual && unidad.escudoActual > 0 && maxHp > 0) {
                    const escudoPercent = Math.min(100 - percent, (unidad.escudoActual / maxHp) * 100);
                    if (escudoPercent > 0) {
                        if (escudoExistente) {
                            escudoExistente.style.left = percent + '%';
                            escudoExistente.style.width = escudoPercent + '%';
                        } else {
                            const nuevoEscudo = document.createElement('div');
                            nuevoEscudo.className = 'hp-shield';
                            nuevoEscudo.style.left = percent + '%';
                            nuevoEscudo.style.width = escudoPercent + '%';
                            const segments = barraHP.querySelector('.hp-segments');
                            if (segments) barraHP.insertBefore(nuevoEscudo, segments);
                            else barraHP.appendChild(nuevoEscudo);
                        }
                        escudoActualizado = true;
                    }
                }
                if (!escudoActualizado && escudoExistente) escudoExistente.remove();
                if (unidad.poisonStacks && unidad.poisonStacks.length > 0) elemento.classList.add('casilla-veneno');
                else elemento.classList.remove('casilla-veneno');
            }
            const sprite = elemento.querySelector('.unit-sprite');
            if (sprite) {
                if (unidad.frozen) sprite.classList.add('frozen');
                else sprite.classList.remove('frozen');
                if (unidad._quemado || unidad.burnDamage > 0) sprite.classList.add('burn');
                else sprite.classList.remove('burn');
            }
            if (unidad._quemado || unidad.burnDamage > 0) elemento.classList.add('casilla-quemadura');
            else elemento.classList.remove('casilla-quemadura');
        }
    } catch (e) {
        console.warn('⚠️ actualizarBarraVidaPokemon: elemento ya no existe en el DOM');
    }
}

function procesarVeneno(unidad, deltaTiempo) {
    if (!unidad || unidad.hp <= 0 || unidad.muerto) return;
    if (!unidad.poisonStacks || unidad.poisonStacks.length === 0) {
        unidad._venenoTickGlobal = 0;
        return;
    }

    // ============================================================
    // 1) Tick GLOBAL compartido por todos los stacks
    // ============================================================
    unidad._venenoTickGlobal = (unidad._venenoTickGlobal || 0) + deltaTiempo;

    let dañoBaseTotal = 0;
    let stacksQueCuentan = 0;
    const multiplicadoresEnJuego = new Set();

    if (unidad._venenoTickGlobal >= 1) {
        unidad._venenoTickGlobal -= 1;

        for (let i = unidad.poisonStacks.length - 1; i >= 0; i--) {
            const stack = unidad.poisonStacks[i];
            if (!stack) {
                unidad.poisonStacks.splice(i, 1);
                continue;
            }

            if (stacksQueCuentan < MAX_STACKS_VENENO_DANO) {
                const multStack = (typeof stack.multiplicador === 'number' && !isNaN(stack.multiplicador))
                    ? stack.multiplicador
                    : 1;

                dañoBaseTotal += (stack.daño || 0) * multStack;
                stacksQueCuentan++;
                multiplicadoresEnJuego.add(multStack);
            }
        }
    }

    // ============================================================
    // 2) Avanzar tiempo restante de cada stack (independiente del tick)
    // ============================================================
    for (let i = unidad.poisonStacks.length - 1; i >= 0; i--) {
        const stack = unidad.poisonStacks[i];
        if (!stack) continue;
        stack.tiempoRestante = (stack.tiempoRestante || 0) - deltaTiempo;
        if (stack.tiempoRestante <= 0) {
            unidad.poisonStacks.splice(i, 1);
        }
    }

    if (dañoBaseTotal <= 0) return;

    // ============================================================
    // 3) Aplicar daño
    // ============================================================
    const dañoTotal = Math.floor(dañoBaseTotal);
    if (typeof dañoTotal !== 'number' || isNaN(dañoTotal) || dañoTotal <= 0) return;

    unidad.hp = Math.max(0, unidad.hp - dañoTotal);
    unidad.damageTaken += dañoTotal;

    if (typeof actualizarCopiaEstadisticas === 'function') {
        actualizarCopiaEstadisticas(unidad, 'damageTaken', dañoTotal);
    }

    const pos = obtenerPosicionUnidadActual(unidad);

    if (pos) {
        if (typeof mostrarNumeroDaño === 'function') {
            mostrarNumeroDaño(pos.x, pos.y - 20, dañoTotal, false, false, false, pos.elemento || null);
        }
        if (pos.elemento && typeof actualizarBarraVidaPokemon === 'function') {
            actualizarBarraVidaPokemon(pos.elemento, unidad.hp, unidad.maxHp, dañoTotal, unidad);
        }
    }

    if (typeof addConsoleMessage === 'function') {
        const detalleMult = multiplicadoresEnJuego.size === 1
            ? ` × ${Array.from(multiplicadoresEnJuego)[0]}x`
            : '';
        addConsoleMessage(
            `☠️ ${unidad.pokemon.nombre} recibe ${dañoTotal} daño de veneno (${stacksQueCuentan} stack(s)${detalleMult})`,
            'battle'
        );
    }

    if (unidad.hp <= 0) {
        unidad.muerto = true;
        if (pos && pos.elemento && typeof ocultarUnidadMuerta === 'function') {
            ocultarUnidadMuerta(pos.elemento);
        }
    }
}

function procesarRegeneracion(unidad, tickInterval) {
    if (!unidad || unidad.hp <= 0 || unidad.muerto) return;
    if (unidad.regenPorSegundo > 0) {
        const tieneRestosReal = unidad.objetos && unidad.objetos.some(o => {
            const obj = window.OBJETOS && window.OBJETOS[o];
            return obj && obj.efecto && obj.efecto.regenPorSegundo;
        });
        if (!tieneRestosReal) {
            unidad.regenPorSegundo = 0;
            unidad.regenTimer = 0;
        }
    }
    if (unidad.regenPerSecond > 0) {
        unidad._regenAccumulator = (unidad._regenAccumulator || 0) + tickInterval;
        if (unidad._regenAccumulator >= 1) {
            unidad._regenAccumulator -= 1;
            let curacion = Math.floor(unidad.maxHp * unidad.regenPerSecond);
            let curado = unidad.curar(curacion);
            if (curado > 0) {
                let pos = obtenerPosicionUnidadActual(unidad);
                if (pos && curado >= unidad.maxHp * COMBAT_CONFIG.UMBRAL_CURACION_VISIBLE) {
                    if (typeof mostrarNumeroCuracion === 'function') mostrarNumeroCuracion(pos.x, pos.y, curado);
                }
                unidad.healingDone += curado;
                if (typeof actualizarCopiaEstadisticas === 'function') actualizarCopiaEstadisticas(unidad, 'healingDone', curado);
                if (pos && pos.elemento) actualizarBarraVidaPokemon(pos.elemento, unidad.hp, unidad.maxHp, 0, unidad);
            }
        }
    }
    if (unidad.regenPorSegundo > 0) {
        unidad.regenTimer = (unidad.regenTimer || 0) + tickInterval;
        if (unidad.regenTimer >= unidad.regenIntervalo) {
            unidad.regenTimer = 0;
            let curacion = Math.floor(unidad.maxHp * unidad.regenPorSegundo);
            let curado = unidad.curar(curacion);
            if (curado > 0) {
                let pos = obtenerPosicionUnidadActual(unidad);
                if (pos && curado >= unidad.maxHp * COMBAT_CONFIG.UMBRAL_CURACION_VISIBLE) {
                    if (typeof mostrarNumeroCuracion === 'function') mostrarNumeroCuracion(pos.x, pos.y, curado);
                }
                unidad.healingDone += curado;
                if (typeof actualizarCopiaEstadisticas === 'function') actualizarCopiaEstadisticas(unidad, 'healingDone', curado);
                if (pos && pos.elemento) actualizarBarraVidaPokemon(pos.elemento, unidad.hp, unidad.maxHp, 0, unidad);
            }
        }
    }
}

function actualizarStatsEnVivo(jugadores, rivales) {
    if (!window.statsCombateEnVivo) window.statsCombateEnVivo = { activo: true, jugadores: [], rivales: [] };
    if (!window.statsCombateEnVivo.activo) return;
    let statsJugadores = [], zacianVisto = false;
    for (let j of jugadores) {
        if (!j || !j.pokemon) continue;
        if (j.esZacian) { if (zacianVisto) continue; zacianVisto = true; }
        let tipoAtaque = 'fisico';
        if (j.ataqueEspecial > j.ataque * 1.2) tipoAtaque = 'especial';
        statsJugadores.push({
            nombre: j.pokemon.nombre, spriteId: j.pokemon.spriteId || j.pokemon.id,
            nivel: j.nivel || 1, damageDealt: j.damageDealt || 0, damageTaken: j.damageTaken || 0,
            healingDone: j.healingDone || 0, damageBlocked: j.damageBlocked || 0,
            hp: j.hp || 0, maxHp: j.maxHp || 0, muerto: j.muerto || false, equipo: 'jugador',
            tipoAtaque, esFrontline: esPokemonFrontline(j), esZacian: j.esZacian || false, esMelee: esPokemonMelee(j)
        });
    }
    let statsRivales = [], zacianEnemigoVisto = false;
    for (let r of rivales) {
        if (!r || !r.pokemon) continue;
        if (r.esZacian) { if (zacianEnemigoVisto) continue; zacianEnemigoVisto = true; }
        let tipoAtaque = 'fisico';
        if (r.ataqueEspecial > r.ataque * 1.2) tipoAtaque = 'especial';
        statsRivales.push({
            nombre: r.pokemon.nombre, spriteId: r.pokemon.spriteId || r.pokemon.id,
            nivel: r.nivel || 1, damageDealt: r.damageDealt || 0, damageTaken: r.damageTaken || 0,
            healingDone: r.healingDone || 0, damageBlocked: r.damageBlocked || 0,
            hp: r.hp || 0, maxHp: r.maxHp || 0, muerto: r.muerto || false, equipo: 'enemigo',
            tipoAtaque, esFrontline: esPokemonFrontline(r), esZacian: r.esZacian || false, esMelee: esPokemonMelee(r)
        });
    }
    window.statsCombateEnVivo.jugadores = statsJugadores;
    window.statsCombateEnVivo.rivales = statsRivales;
}

function registrarEstadisticasCombate(jugadores, rivales, victoria, duracion) {
    debugLogCombate("📊 REGISTRANDO ESTADÍSTICAS DEL COMBATE");
    let statsJugadores = [], zacianEncontrado = false;
    for (let j of jugadores) {
        if (j && j.pokemon) {
            if (j.esZacian) { if (zacianEncontrado) continue; zacianEncontrado = true; }
            let tipoAtaque = 'fisico';
            if (j.ataqueEspecial > j.ataque * 1.2) tipoAtaque = 'especial';
            let copiaActualizada = null;
            for (let c of equipoCompletoJugador) {
                if (c && c.pokemon && c.pokemon.id === j.pokemon.id && c.baseId === j.baseId) { copiaActualizada = c; break; }
            }
            statsJugadores.push({
                nombre: j.pokemon.nombre, spriteId: j.pokemon.spriteId || j.pokemon.id,
                nivel: j.nivel || 1,
                damageDealt: copiaActualizada ? copiaActualizada.damageDealt || 0 : j.damageDealt || 0,
                damageTaken: copiaActualizada ? copiaActualizada.damageTaken || 0 : j.damageTaken || 0,
                healingDone: copiaActualizada ? copiaActualizada.healingDone || 0 : j.healingDone || 0,
                damageBlocked: copiaActualizada ? copiaActualizada.damageBlocked || 0 : j.damageBlocked || 0,
                hp: j.hp || 0, maxHp: j.maxHp || 0, muerto: j.muerto || false, equipo: 'jugador',
                tipoAtaque, esFrontline: esPokemonFrontline(j), esZacian: j.esZacian || false, esMelee: esPokemonMelee(j)
            });
        }
    }
    let statsRivales = [], zacianEnemigoEncontrado = false;
    for (let r of rivales) {
        if (r && r.pokemon) {
            if (r.esZacian) { if (zacianEnemigoEncontrado) continue; zacianEnemigoEncontrado = true; }
            let tipoAtaque = 'fisico';
            if (r.ataqueEspecial > r.ataque * 1.2) tipoAtaque = 'especial';
            let copiaActualizada = null;
            for (let c of equipoCompletoEnemigo) {
                if (c && c.pokemon && c.pokemon.id === r.pokemon.id && c.baseId === r.baseId) { copiaActualizada = c; break; }
            }
            statsRivales.push({
                nombre: r.pokemon.nombre, spriteId: r.pokemon.spriteId || r.pokemon.id,
                nivel: r.nivel || 1,
                damageDealt: copiaActualizada ? copiaActualizada.damageDealt || 0 : r.damageDealt || 0,
                damageTaken: copiaActualizada ? copiaActualizada.damageTaken || 0 : r.damageTaken || 0,
                healingDone: copiaActualizada ? copiaActualizada.healingDone || 0 : r.healingDone || 0,
                damageBlocked: copiaActualizada ? copiaActualizada.damageBlocked || 0 : r.damageBlocked || 0,
                hp: r.hp || 0, maxHp: r.maxHp || 0, muerto: r.muerto || false, equipo: 'enemigo',
                tipoAtaque, esFrontline: esPokemonFrontline(r), esZacian: r.esZacian || false, esMelee: esPokemonMelee(r)
            });
        }
    }
    let totalDañoJugador = statsJugadores.reduce((sum, s) => sum + (s.damageDealt || 0), 0);
    let totalDañoRecibido = statsJugadores.reduce((sum, s) => sum + (s.damageTaken || 0), 0);
    let totalCuracion = statsJugadores.reduce((sum, s) => sum + (s.healingDone || 0), 0);
    window.postCombateData = {
        victoria, duracion, statsJugadores, statsRivales,
        totalDañoJugador: Math.round(totalDañoJugador),
        totalDañoRecibido: Math.round(totalDañoRecibido),
        totalCuracion: Math.round(totalCuracion)
    };
    postCombateData = window.postCombateData;
    const btnPost = document.getElementById('btnPostCombate');
    if (btnPost) {
        btnPost.style.display = 'flex';
        btnPost.style.visibility = 'visible';
        btnPost.style.opacity = '1';
        btnPost.disabled = false;
    }
    estadisticasGlobales.totalDaño += totalDañoJugador;
    estadisticasGlobales.totalRecibido += totalDañoRecibido;
    estadisticasGlobales.totalCuracion += totalCuracion;
    if (victoria) estadisticasGlobales.victorias++;
    estadisticasGlobales.rondas++;
    let mejorJugador = null, mejorPuntuacion = -1;
    for (let s of statsJugadores) {
        let puntuacion = (s.damageDealt || 0) + (s.healingDone || 0) * 0.5 + (s.damageBlocked || 0) * 0.3;
        if (puntuacion > mejorPuntuacion) { mejorPuntuacion = puntuacion; mejorJugador = s; }
    }
    if (mejorJugador) {
        estadisticasGlobales.mvp = mejorJugador.nombre;
        if ((mejorJugador.damageDealt || 0) > estadisticasGlobales.topDaño) estadisticasGlobales.topDaño = mejorJugador.damageDealt || 0;
        if ((mejorJugador.damageTaken || 0) > estadisticasGlobales.topRecibido) estadisticasGlobales.topRecibido = mejorJugador.damageTaken || 0;
    }
    if (!estadisticasGlobales.mejoresPokemon) estadisticasGlobales.mejoresPokemon = [];
    const todosStats = [...statsJugadores, ...statsRivales];
    for (let s of todosStats) {
        if (!s || !s.nombre) continue;
        let existente = null;
        for (let m of estadisticasGlobales.mejoresPokemon) {
            if (m.nombre === s.nombre && m.equipo === s.equipo) { existente = m; break; }
        }
        if (existente) {
            existente.damageDealt += s.damageDealt || 0;
            existente.damageTaken += s.damageTaken || 0;
            existente.damageBlocked += s.damageBlocked || 0;
            existente.healingDone += s.healingDone || 0;
            if ((s.nivel || 1) > (existente.nivel || 1)) existente.nivel = s.nivel || 1;
        } else {
            estadisticasGlobales.mejoresPokemon.push({
                nombre: s.nombre, spriteId: s.spriteId, equipo: s.equipo,
                nivel: s.nivel || 1, damageDealt: s.damageDealt || 0, damageTaken: s.damageTaken || 0,
                damageBlocked: s.damageBlocked || 0, healingDone: s.healingDone || 0, tipoAtaque: s.tipoAtaque || 'fisico'
            });
        }
    }
    return postCombateData;
}

function crearConfeti() {
    const colores = ['#fbbf24', '#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#f97316', '#06b6d4'];
    const overlay = document.getElementById('combatOverlay');
    if (!overlay) return;
    overlay.querySelectorAll('.confeti-particle').forEach(el => el.remove());
    for (let i = 0; i < 60; i++) {
        const confeti = document.createElement('div');
        confeti.className = 'confeti-particle';
        const size = Math.random() * 8 + 4;
        const esCirculo = Math.random() > 0.5;
        const x = Math.random() * 100;
        const delay = Math.random() * 0.8;
        const duracion = Math.random() * 2 + 2;
        const color = colores[Math.floor(Math.random() * colores.length)];
        confeti.style.cssText = `
            position: absolute; width: ${size}px; height: ${esCirculo ? size : size * 0.4}px;
            background: ${color}; border-radius: ${esCirculo ? '50%' : '2px'}; top: -10px; left: ${x}%;
            opacity: 0; pointer-events: none; z-index: 10000;
            animation: confetiFall ${duracion}s ease-in forwards; animation-delay: ${delay}s;
            transform: rotate(${Math.random() * 360}deg); box-shadow: 0 0 6px rgba(255,255,255,0.1);
        `;
        overlay.appendChild(confeti);
        setTimeout(() => { if (confeti.parentNode) confeti.remove(); }, (duracion + delay) * 1000 + 100);
    }
}

function crearSparklesVictoria() {
    const colores = ['#fbbf24', '#fff7d6', '#ffd700', '#fde68a', '#ffffff'];
    const cx = window.innerWidth / 2, cy = 130;
    for (let i = 0; i < 26; i++) {
        const angle = (i / 26) * Math.PI * 2 + Math.random() * 0.3;
        const dist = 55 + Math.random() * 95;
        const dx = Math.cos(angle) * dist, dy = Math.sin(angle) * dist;
        const size = 4 + Math.random() * 7;
        const color = colores[Math.floor(Math.random() * colores.length)];
        const sparkle = document.createElement('div');
        sparkle.style.cssText = `
            position: fixed; left: ${cx}px; top: ${cy}px; width: ${size}px; height: ${size}px;
            margin-left: ${-size / 2}px; margin-top: ${-size / 2}px; background: ${color};
            border-radius: 50%; --dx: ${dx}px; --dy: ${dy}px; box-shadow: 0 0 8px ${color};
            pointer-events: none; z-index: 6000; animation: sparkleBurst 0.9s ease-out forwards;
        `;
        document.body.appendChild(sparkle);
        setTimeout(() => { if (sparkle.parentNode) sparkle.remove(); }, 900);
    }
}

function animarSaltoGanadoresDerrota() {
    try {
        const celdas = document.querySelectorAll(
            '#playerBoard .board-cell.has-unit.team-enemy:not(.muerto), ' +
            '#enemigoBoard .board-cell.has-unit.team-enemy:not(.muerto)'
        );
        celdas.forEach((cell, i) => {
            cell.classList.add('salto-victoria');
            cell.style.animationDelay = (i * 0.12) + 's';
        });
    } catch (e) {
        console.error('❌ animarSaltoGanadoresDerrota:', e);
    }
}

function animarSaltoGanadoresJugador() {
    try {
        const celdas = document.querySelectorAll(
            '#playerBoard .board-cell.has-unit.team-player:not(.muerto), ' +
            '#enemigoBoard .board-cell.has-unit.team-player:not(.muerto)'
        );
        celdas.forEach((cell, i) => {
            cell.classList.add('salto-victoria');
            cell.style.animationDelay = (i * 0.12) + 's';
        });
    } catch (e) {
        console.error('❌ animarSaltoGanadoresJugador:', e);
    }
}

function mostrarResultadoCombate(victoria, ganancia, daño, racha, callback, esSandbox = false) {
    let ov = document.getElementById("combatOverlay");
    if (!ov) {
        console.error("❌ Elementos del overlay de combate no encontrados");
        if (callback) callback();
        return;
    }
    let ganadorNombre2P = null;
    if (window.modoDosJugadores) {
        const prim = window.primerTurnoJugador || 1;
        const numGanador = victoria ? prim : (prim === 1 ? 2 : 1);
        const nom = numGanador === 1
            ? (window.nombreJugador && String(window.nombreJugador).trim() ? window.nombreJugador : 'Jugador 1')
            : (window.nombreJugador2 && String(window.nombreJugador2).trim() ? window.nombreJugador2 : 'Jugador 2');
        ganadorNombre2P = nom;
    }
    ov.querySelectorAll('.confeti-particle').forEach(el => el.remove());
    ov.style.display = 'flex';
    ov.style.opacity = '1';
    ov.style.pointerEvents = 'none';
    const textoVictoria = ganadorNombre2P ? `¡VICTORIA de ${ganadorNombre2P}!` : "¡VICTORIA!";
    const textoDerrota = ganadorNombre2P ? `¡DERROTA! Gana ${ganadorNombre2P}` : "¡DERROTA!";
    let textoMonedasRacha = '', textoMonedasRachaDerrota = '';
    const rachaMostrar = victoria ? (racha > 0 ? racha + 1 : 1) : (racha < 0 ? racha - 1 : -1);
    // 🪙 La moneda del juego en vez del emoji de bolsa de dinero
    const monedaHtml = '<img class="coin-inline" src="assets/icons/moneda.png" alt="oro" draggable="false">';
    if (victoria) {
        const rachaTexto = `Racha +${rachaMostrar}`;
        textoMonedasRacha = ganancia > 0 ? `+${ganancia} ${monedaHtml} · ${rachaTexto}` : `Sin oro · ${rachaTexto}`;
    } else {
        // 🪙 En derrota también se gana oro (5 + interés + racha), así que se
        //    muestra igual que en victoria: daño recibido + monedas ganadas.
        textoMonedasRachaDerrota = ganancia > 0
            ? `-${daño} HP · +${ganancia} ${monedaHtml} · Racha ${rachaMostrar}`
            : `-${daño} HP · Sin oro · Racha ${rachaMostrar}`;
    }
    // 👥 En 2P SIEMPRE se muestra al GANADOR (nunca "DERROTA").
    const es2P = window.modoDosJugadores === true;
    const usarVictoria = es2P || victoria;
    const icono = esSandbox ? '🧪' : (usarVictoria ? '🏆' : '💀');
    const claseVictoria = usarVictoria ? 'victoria' : 'derrota';
    const texto = es2P ? textoVictoria : (victoria ? textoVictoria : textoDerrota);
    const textoMonedas = victoria ? textoMonedasRacha : textoMonedasRachaDerrota;

    if (esSandbox) {
        // 🧪 Cartel de sandbox: sin oro, sin HP, sin racha.
        ov.innerHTML = `
            <div class="combat-resultado-centrado">
                <div class="combat-resultado-icono">🧪</div>
                <div class="combat-resultado-texto ${claseVictoria}">SANDBOX</div>
                <div class="combat-resultado-monedas">${victoria ? 'Victoria' : 'Derrota'} · Sin recompensas</div>
            </div>
        `;
    } else {
        ov.innerHTML = `
            <div class="combat-resultado-centrado">
                <div class="combat-resultado-icono">${icono}</div>
                <div class="combat-resultado-texto ${claseVictoria}">${texto}</div>
                <div class="combat-resultado-monedas">${textoMonedas}</div>
            </div>
        `;
    }
    if (usarVictoria) {
        ov.className = "combat-overlay victoria active";
        crearConfeti();
        crearSparklesVictoria();
    } else {
        ov.className = "combat-overlay derrota active";
    }
    clearTimeout(ov._timeout);
        ov._timeout = setTimeout(() => {
        ov.classList.remove("active");
        setTimeout(() => {
            ov.className = "combat-overlay";
            ov.style.display = 'none';
            ov.style.opacity = '0';
            if (callback) callback();
        }, 350);
    }, 3800);
}
