// ============================================================
// REGISTRO DE ULTIS - PARTE 3 (COSTE 4 y 5)
// ============================================================
// La clave del objeto es el `id` de la ulti.
//
// ⚠️ TODAS las descripciones y comentarios en español.
//
// 🔧 v2 FIX: cada ulti llama a SU PROPIO sonido (slug propio).
// 🆕 v3: añadida ulti de Zacian (tajo-supremo-zacian) como
//        invocación especial.
// ============================================================

Object.assign(ULTIS_REGISTRO, {

    // ============================================================
    // ===== DRAGONITE - SALTO SIDERAL =====
    // ============================================================
    "salto-sideral": {
        nombre: "Salto Sideral",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`🐉 ${atacante.pokemon.nombre} desata SALTO SIDERAL!`);

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;

            const nivel = atacante.nivel || 1;

            const escudoPct = nivel === 3 ? 16.50 : 5.50;
const escudo = Math.floor((atacante.ataque || 0) * escudoPct);
if (escudo > 0) {
    aplicarEscudoConFade(atacante, escudo);
    log(`   🛡️ Escudo de ${escudo} HP (fade 3s)`);
}

            const objetivoSaltar = enemigosVivos[Math.floor(Math.random() * enemigosVivos.length)];
            if (!objetivoSaltar) return true;

            if (typeof movObtenerPosicionGlobal !== 'function' || typeof movSetPosicionGlobal !== 'function') return true;

            const posObjetivo = movObtenerPosicionGlobal(objetivoSaltar);
            if (!posObjetivo) return true;

            const candidatas = [
                { fila: posObjetivo.fila - 1, col: posObjetivo.col },
                { fila: posObjetivo.fila + 1, col: posObjetivo.col },
                { fila: posObjetivo.fila, col: posObjetivo.col - 1 },
                { fila: posObjetivo.fila, col: posObjetivo.col + 1 }
            ].filter(c => c.fila >= 0 && c.fila <= 3 && c.col >= 0 && c.col <= 3);

            let destino = null;
            for (let c of candidatas) {
                let ocupada = false;
                for (let e of enemigosVivos) {
                    const pe = movObtenerPosicionGlobal(e);
                    if (pe && pe.fila === c.fila && pe.col === c.col) { ocupada = true; break; }
                }
                if (!ocupada) { destino = c; break; }
            }

            if (destino) {
                movSetPosicionGlobal(atacante, destino.fila, destino.col);
                if (typeof renderizarCombate === 'function') renderizarCombate();
                log(`   ✈️ Salta junto a ${objetivoSaltar.pokemon.nombre}`);
            }

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Salto Sideral', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.CYAN,
                    icono: 'mov:Salto Sideral',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 900
                });
            }

            const dañoPct = nivel === 3 ? 10.00 : 2.80;
            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * dañoPct));

            setTimeout(() => {
                const posImpacto = movObtenerPosicionGlobal(objetivoSaltar);
                if (!posImpacto) return;

                const enemigosEnArea = [objetivoSaltar];
                if (typeof movCasillasEnArea === 'function' && typeof movUnidadEnPosicion === 'function') {
                    const casillas = movCasillasEnArea(posImpacto, 2);
                    for (let c of casillas) {
                        const u = movUnidadEnPosicion(c, enemigosVivos);
                        if (u && !enemigosEnArea.includes(u)) enemigosEnArea.push(u);
                    }
                }

                enemigosEnArea.forEach((enemigo, idx) => {
                    setTimeout(() => {
                        if (enemigo.hp <= 0 || enemigo.muerto) return;
                        if (typeof movMostrarEfectoVisual === 'function') {
                            movMostrarEfectoVisual(enemigo, {
                                color: MOV_COLOR.CYAN,
                                icono: 'mov:Salto Sideral',
                                intensidad: 'strong',
                                sizeIcono: 'large',
                                duracionMs: 900
                            });
                        }
                        if (typeof movAplicarDaño === 'function') {
                            movAplicarDaño(atacante, enemigo, dañoFinal, false);
                        }
                        if (enemigo.hp > 0 && !enemigo.muerto && !enemigo.inmuneImpedimentos) {
                            if (typeof movKnockup === 'function') {
                                movKnockup(enemigo, 1.0);
                                setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.CYAN, icono: 'mov:Salto Sideral', intensidad: 'soft', sizeIcono: 'small', duracionMs: 1000, persistente: true, pulso: true, claseExtra: 'icon-airborne' }); }, 300);
                            }
                        }
                    }, idx * 100);
                });

                if (nivel === 3) {
                    log(`   ☄️ ¡Meteoros continuos!`);
                    for (let i = 0; i < 5; i++) {
                        setTimeout(() => {
                            const enemigosActuales = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
                            if (enemigosActuales.length === 0) return;
                            const objetivoMeteoro = enemigosActuales[Math.floor(Math.random() * enemigosActuales.length)];
                            const dañoMeteoro = Math.max(1, Math.floor((atacante.ataque || 0) * 1.50));
                            if (typeof movMostrarLineaProyectil === 'function') {
                                movMostrarLineaProyectil(atacante, objetivoMeteoro, 'rgba(251, 146, 60, 0.95)', 400);
                            }
                            if (typeof movMostrarEfectoVisual === 'function') {
                                movMostrarEfectoVisual(objetivoMeteoro, {
                                    color: MOV_COLOR.ORANGE,
                                    icono: 'mov:Salto Sideral',
                                    intensidad: 'strong',
                                    sizeIcono: 'large',
                                    duracionMs: 700
                                });
                            }
                            if (typeof movAplicarDaño === 'function') {
                                movAplicarDaño(atacante, objetivoMeteoro, dañoMeteoro, false);
                            }
                        }, 200 + i * 200);
                    }
                }
            }, 400);

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ============================================================
    // ===== GYARADOS - CHAPUZÓN DEL DRAGÓN =====
    // ============================================================
    "chapuzon-del-dragon": {
        nombre: "Chapuzón del Dragón",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`🌊 ${atacante.pokemon.nombre} desata CHAPUZÓN DEL DRAGÓN!`);

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;

            const nivel = atacante.nivel || 1;

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Chapuzón del Dragón', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.BLUE,
                    icono: 'mov:Chapuzón del Dragón',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 900
                });
            }

            const objetivoSaltar = enemigosVivos[Math.floor(Math.random() * enemigosVivos.length)];
            if (!objetivoSaltar) return true;

            if (typeof movObtenerPosicionGlobal !== 'function' || typeof movSetPosicionGlobal !== 'function') return true;

            setTimeout(() => {
                const posObjetivo = movObtenerPosicionGlobal(objetivoSaltar);
                if (!posObjetivo) return;

                const candidatas = [
                    { fila: posObjetivo.fila - 1, col: posObjetivo.col },
                    { fila: posObjetivo.fila + 1, col: posObjetivo.col },
                    { fila: posObjetivo.fila, col: posObjetivo.col - 1 },
                    { fila: posObjetivo.fila, col: posObjetivo.col + 1 }
                ].filter(c => c.fila >= 0 && c.fila <= 3 && c.col >= 0 && c.col <= 3);

                let destino = null;
                for (let c of candidatas) {
                    let ocupada = false;
                    for (let e of enemigosVivos) {
                        const pe = movObtenerPosicionGlobal(e);
                        if (pe && pe.fila === c.fila && pe.col === c.col) { ocupada = true; break; }
                    }
                    if (!ocupada) { destino = c; break; }
                }

                if (destino) {
                    movSetPosicionGlobal(atacante, destino.fila, destino.col);
                    if (typeof renderizarCombate === 'function') renderizarCombate();
                }

                const dañoPct = nivel === 3 ? 48.00 : 4.80;
                const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * dañoPct));

                const enemigosEnArea = [objetivoSaltar];
                if (typeof movCasillasEnArea === 'function' && typeof movUnidadEnPosicion === 'function') {
                    const casillas = movCasillasEnArea(posObjetivo, 1);
                    for (let c of casillas) {
                        const u = movUnidadEnPosicion(c, enemigosVivos);
                        if (u && !enemigosEnArea.includes(u)) enemigosEnArea.push(u);
                    }
                }

                enemigosEnArea.forEach((enemigo, idx) => {
                    setTimeout(() => {
                        if (enemigo.hp <= 0 || enemigo.muerto) return;
                        if (typeof movMostrarEfectoVisual === 'function') {
                            movMostrarEfectoVisual(enemigo, {
                                color: MOV_COLOR.BLUE,
                                icono: 'mov:Chapuzón del Dragón',
                                intensidad: 'strong',
                                sizeIcono: 'large',
                                duracionMs: 900
                            });
                        }
                        if (typeof movAplicarDaño === 'function') {
                            movAplicarDaño(atacante, enemigo, dañoFinal, false);
                        }
                        if (enemigo.hp > 0 && !enemigo.muerto) {
                            if (!enemigo.inmuneImpedimentos && typeof movKnockup === 'function') {
                                movKnockup(enemigo, 1.0);
                                setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.BLUE, icono: 'mov:Chapuzón del Dragón', intensidad: 'soft', sizeIcono: 'small', duracionMs: 1000, persistente: true, pulso: true, claseExtra: 'icon-airborne' }); }, 300);
                            }
                            if (typeof movSetPosicionGlobal === 'function' && !enemigo.inmuneImpedimentos) {
                                const filaRand = Math.floor(Math.random() * 4);
                                const colRand = Math.floor(Math.random() * 4);
                                if (!(filaRand === posObjetivo.fila && colRand === posObjetivo.col)) {
                                    movSetPosicionGlobal(enemigo, filaRand, colRand);
                                }
                            }
                        }
                    }, idx * 100);
                });

                if (typeof renderizarCombate === 'function') renderizarCombate();
            }, 400);

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ============================================================
    // ===== HOOPA - PORTAL DESATADO =====
    // ============================================================
    "portal-desatado": {
        nombre: "Portal Desatado",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`🌀 ${atacante.pokemon.nombre} desata PORTAL DESATADO!`);

            const aliadosVivos = (contexto.aliados || []).filter(a => a && a.hp > 0 && !a.muerto);
            if (aliadosVivos.length === 0) return false;

            const nivel = atacante.nivel || 1;
            const curacionPct = nivel === 3 ? 1.00 : 0.15;
            const energia = nivel === 3 ? 100 : 15;
            const buffPct = nivel === 3 ? 2.50 : 0.25;

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Portal Desatado', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.PURPLE,
                    icono: 'mov:Portal Desatado',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 900
                });
            }

            aliadosVivos.forEach((aliado, idx) => {
                setTimeout(() => {
                    if (aliado.hp <= 0 || aliado.muerto) return;

                    const tipoEfecto = Math.floor(Math.random() * 3);

                    if (tipoEfecto === 0) {
                        const curacion = Math.floor((aliado.maxHp || 0) * curacionPct);
                        if (typeof movCurar === 'function') movCurar(aliado, curacion);
                        else aliado.hp = Math.min(aliado.maxHp, aliado.hp + curacion);
                        log(`   💚 ${aliado.pokemon.nombre}: +${curacion} HP`);
                    } else if (tipoEfecto === 1) {
                        aliado.energy = (aliado.energy || 0) + energia;
                        log(`   ⚡ ${aliado.pokemon.nombre}: +${energia} energía`);
                    } else {
                        aliado.bonusAttack = (aliado.bonusAttack || 1) * (1 + buffPct);
                        aliado.bonusSpAttack = (aliado.bonusSpAttack || 1) * (1 + buffPct);
                        aliado.actualizarStats();
                        log(`   ⬆️ ${aliado.pokemon.nombre}: +${Math.round(buffPct * 100)}% Atk/AtkEsp`);
                        setTimeout(() => {
                            if (aliado.hp <= 0 || aliado.muerto) return;
                            aliado.bonusAttack = (aliado.bonusAttack || 1) / (1 + buffPct);
                            aliado.bonusSpAttack = (aliado.bonusSpAttack || 1) / (1 + buffPct);
                            aliado.actualizarStats();
                        }, 4000);
                    }

                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(aliado, {
                            color: MOV_COLOR.PURPLE,
                            icono: 'mov:Portal Desatado',
                            intensidad: 'soft',
                            sizeIcono: 'small',
                            duracionMs: 800
                        });
                    }
                }, idx * 100);
            });

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ============================================================
    // ===== SNORLAX - REMOLÓN SIN PARANGÓN =====
    // ============================================================
    "remolon-sin-parangon": {
        nombre: "Remolón sin Parangón",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`💤 ${atacante.pokemon.nombre} usa REMOLÓN SIN PARANGÓN!`);

            const nivel = atacante.nivel || 1;

            const hpExtra = Math.floor((atacante.maxHp || 0) * 0.10);
            atacante.maxHp += hpExtra;
            atacante.hp += hpExtra;
            log(`   💪 +${hpExtra} HP máximos (total: ${atacante.maxHp})`);

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Remolón sin Parangón', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.PURPLE,
                    icono: 'mov:Remolón sin Parangón',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 1200
                });
            }

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            const posAtk = (typeof movObtenerPosicionGlobal === 'function') ? movObtenerPosicionGlobal(atacante) : null;

            if (posAtk && enemigosVivos.length > 0) {
                const dañoPct = nivel === 3 ? 25.00 : 5.00;
                const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * dañoPct));

                const enemigosEnArea = [];
                if (typeof movCasillasEnArea === 'function' && typeof movUnidadEnPosicion === 'function') {
                    const casillas = movCasillasEnArea(posAtk, 2);
                    for (let c of casillas) {
                        const u = movUnidadEnPosicion(c, enemigosVivos);
                        if (u && !enemigosEnArea.includes(u)) enemigosEnArea.push(u);
                    }
                }

                enemigosEnArea.forEach((enemigo, idx) => {
                    setTimeout(() => {
                        if (enemigo.hp <= 0 || enemigo.muerto) return;
                        if (typeof movMostrarEfectoVisual === 'function') {
                            movMostrarEfectoVisual(enemigo, {
                                color: MOV_COLOR.PURPLE,
                                icono: 'mov:Remolón sin Parangón',
                                intensidad: 'strong',
                                sizeIcono: 'large',
                                duracionMs: 900
                            });
                        }
                        if (typeof movAplicarDaño === 'function') {
                            movAplicarDaño(atacante, enemigo, dañoFinal, false);
                        }
                        if (enemigo.hp > 0 && !enemigo.muerto && !enemigo.inmuneImpedimentos) {
                            if (typeof movKnockup === 'function') {
                                movKnockup(enemigo, 1.0);
                                setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.PURPLE, icono: 'mov:Remolón sin Parangón', intensidad: 'soft', sizeIcono: 'small', duracionMs: 1000, persistente: true, pulso: true, claseExtra: 'icon-airborne' }); }, 300);
                            }
                        }
                    }, idx * 100);
                });
            }

            const regenPct = nivel === 3 ? 0.30 : 0.05;
            let ticksRestantes = 10;
            const regenInterval = setInterval(() => {
                if (atacante.hp <= 0 || atacante.muerto || ticksRestantes <= 0) {
                    clearInterval(regenInterval);
                    return;
                }
                const curacion = Math.floor((atacante.maxHp || 0) * regenPct);
                if (typeof movCurar === 'function') movCurar(atacante, curacion);
                else atacante.hp = Math.min(atacante.maxHp, atacante.hp + curacion);
                ticksRestantes--;
            }, 500);

            if (nivel === 3) {
                setTimeout(() => {
                    if (atacante.hp <= 0 || atacante.muerto) return;
                    log(`   🌀 ¡Rodada adicional!`);
                    const posAtk2 = movObtenerPosicionGlobal(atacante);
                    if (!posAtk2) return;
                    const enemigosActuales = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
                    const enemigosEnArea = [];
                    if (typeof movCasillasEnArea === 'function' && typeof movUnidadEnPosicion === 'function') {
                        const casillas = movCasillasEnArea(posAtk2, 2);
                        for (let c of casillas) {
                            const u = movUnidadEnPosicion(c, enemigosActuales);
                            if (u && !enemigosEnArea.includes(u)) enemigosEnArea.push(u);
                        }
                    }
                    const dañoRodada = Math.max(1, Math.floor((atacante.ataque || 0) * 8.00));
                    enemigosEnArea.forEach((enemigo, idx) => {
                        setTimeout(() => {
                            if (enemigo.hp <= 0 || enemigo.muerto) return;
                            if (typeof movAplicarDaño === 'function') {
                                movAplicarDaño(atacante, enemigo, dañoRodada, false);
                            }
                        }, idx * 100);
                    });
                }, 600);
            }

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ============================================================
    // ===== SYLVEON - DONAIRE FEÉRICO =====
    // ============================================================
    "donaire-feerico": {
        nombre: "Donaire Feérico",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`🌸 ${atacante.pokemon.nombre} usa DONAIRE FEÉRICO!`);

            const nivel = atacante.nivel || 1;

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Donaire Feérico', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.PINK,
                    icono: 'mov:Donaire Feérico',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 900
                });
            }

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);

            setTimeout(() => {
                const radio = (nivel === 3) ? 4 : 2;

                if (enemigosVivos.length === 0) return;

                const objetivoSaltar = enemigosVivos[Math.floor(Math.random() * enemigosVivos.length)];
                if (!objetivoSaltar) return;

                const posObjetivo = (typeof movObtenerPosicionGlobal === 'function') ? movObtenerPosicionGlobal(objetivoSaltar) : null;
                if (!posObjetivo) return;

                const enemigosEnArea = [objetivoSaltar];
                if (typeof movCasillasEnArea === 'function' && typeof movUnidadEnPosicion === 'function') {
                    const casillas = movCasillasEnArea(posObjetivo, radio);
                    for (let c of casillas) {
                        const u = movUnidadEnPosicion(c, enemigosVivos);
                        if (u && !enemigosEnArea.includes(u)) enemigosEnArea.push(u);
                    }
                }

                const dañoPct = nivel === 3 ? 16.50 : 1.65;
                const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * dañoPct));

                enemigosEnArea.forEach((enemigo, idx) => {
                    setTimeout(() => {
                        if (enemigo.hp <= 0 || enemigo.muerto) return;
                        if (typeof movMostrarEfectoVisual === 'function') {
                            movMostrarEfectoVisual(enemigo, {
                                color: MOV_COLOR.PINK,
                                icono: 'mov:Donaire Feérico',
                                intensidad: 'strong',
                                sizeIcono: 'large',
                                duracionMs: 900
                            });
                        }
                        if (typeof movAplicarDaño === 'function') {
                            movAplicarDaño(atacante, enemigo, dañoFinal, false);
                        }
                    }, idx * 100);
                });

                const curacionPct = nivel === 3 ? 1.00 : 0.25;
                const curacion = Math.floor((atacante.maxHp || 0) * curacionPct);
                if (typeof movCurar === 'function') movCurar(atacante, curacion);
                else atacante.hp = Math.min(atacante.maxHp, atacante.hp + curacion);
                log(`   💚 +${curacion} HP`);

                atacante.energy = 0;
                log(`   ⚡ Barra de movimiento refrescada`);
            }, 400);

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ============================================================
    // ===== TYRANITAR - CÓLERA TITÁNICA =====
    // ============================================================
    "colera-titanica": {
        nombre: "Cólera Titánica",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            if (atacante._tyranitarBerserkActivo) {
                log(`   ⚠️ ${atacante.pokemon.nombre}: Berserk ya activo, ignorando`);
                atacante.ultiCarga = 0;
                atacante.ultiLista = false;
                return false;
            }

            log(`🪨 ${atacante.pokemon.nombre} desata CÓLERA TITÁNICA!`);

            const nivel = atacante.nivel || 1;

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Cólera Titánica', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.GRAY,
                    icono: 'mov:Cólera Titánica',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 1200
                });
            }

            const velOriginal = atacante.bonusAttackSpeed || 1;
            const areaOriginal = atacante.areaDamage;
            const critOriginal = atacante.critGuaranteed;
            const inmuneOriginal = atacante.inmuneImpedimentos;

            const velocidadPct = nivel === 3 ? 2.50 : 0.80;
            atacante.bonusAttackSpeed = velOriginal * (1 + velocidadPct);
            atacante.areaDamage = true;
            atacante.critGuaranteed = true;
            atacante.inmuneImpedimentos = true;
            atacante.actualizarStats();

            atacante._tyranitarBerserkActivo = true;

            log(`   🔥 ¡Estado BERSERK!`);
            log(`   ⚡ +${Math.round(velocidadPct * 100)}% Vel. Ataque`);
            log(`   🎯 Ataques básicos en área + crítico garantizado`);
            log(`   🛡️ Inmune a inmovilización`);

            setTimeout(() => {
                if (typeof movMostrarEfectoVisual === 'function') {
                    movMostrarEfectoVisual(atacante, {
                        color: MOV_COLOR.RED,
                        icono: 'mov:Cólera Titánica',
                        intensidad: 'soft',
                        sizeIcono: 'small',
                        duracionMs: 6000,
                        persistente: true,
                        pulso: true,
                        claseExtra: 'icon-rage'
                    });
                }
            }, 400);

            setTimeout(() => {
                if (!atacante) return;

                atacante._tyranitarBerserkActivo = false;

                if (atacante.hp <= 0 || atacante.muerto) return;

                atacante.bonusAttackSpeed = velOriginal;
                atacante.areaDamage = areaOriginal;
                atacante.critGuaranteed = critOriginal;
                atacante.inmuneImpedimentos = inmuneOriginal;
                atacante.actualizarStats();
                log(`   💤 Berserk terminado`);
            }, 6000);

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ============================================================
    // ===== HO-OH - VIENTO AFÍN =====
    // ============================================================
    "viento-afin": {
        nombre: "Viento Afín",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`🌬️ ${atacante.pokemon.nombre} desata VIENTO AFÍN!`);

            const nivel = atacante.nivel || 1;
            const buffAliado = nivel === 3 ? 1.00 : 0.30;
            const debuffEnemigo = nivel === 3 ? 0.80 : 0.30;

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Viento Afín', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.CYAN,
                    icono: 'mov:Viento Afín',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 1200
                });
            }

            const aliadosVivos = (contexto.aliados || []).filter(a => a && a.hp > 0 && !a.muerto);
            const enemigosVivos = (contexto.enemigos || []).filter(e => e && e.hp > 0 && !e.muerto);

            aliadosVivos.forEach((aliado, idx) => {
                setTimeout(() => {
                    if (aliado.hp <= 0 || aliado.muerto) return;
                    aliado.bonusAttackSpeed = (aliado.bonusAttackSpeed || 1) * (1 + buffAliado);
                    aliado.actualizarStats();
                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(aliado, {
                            color: MOV_COLOR.CYAN,
                            icono: 'mov:Viento Afín',
                            intensidad: 'soft',
                            sizeIcono: 'small',
                            duracionMs: 800
                        });
                    }
                }, idx * 80);
            });

            enemigosVivos.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;
                    enemigo.bonusAttackSpeed = (enemigo.bonusAttackSpeed || 1) * (1 - debuffEnemigo);
                    enemigo.actualizarStats();
                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(enemigo, {
                            color: MOV_COLOR.GRAY,
                            icono: 'mov:Viento Afín',
                            intensidad: 'soft',
                            sizeIcono: 'small',
                            duracionMs: 800
                        });
                    }
                }, idx * 80);
            });

            log(`   🌬️ +${Math.round(buffAliado * 100)}% Vel. Ataque a ${aliadosVivos.length} aliados`);
            log(`   🐌 -${Math.round(debuffEnemigo * 100)}% Vel. Ataque a ${enemigosVivos.length} enemigos`);

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ============================================================
    // ===== MEWTWO - ESPACIO RARO =====
    // ============================================================
    "espacio-raro": {
        nombre: "Espacio Raro",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`🌌 ${atacante.pokemon.nombre} desata ESPACIO RARO!`);

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Espacio Raro', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.PURPLE,
                    icono: 'mov:Espacio Raro',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 1200
                });
            }

            enemigosVivos.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;
                    enemigo.energyGauge = (enemigo.energyGauge || 70) + 50;
                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(enemigo, {
                            color: MOV_COLOR.PURPLE,
                            icono: 'mov:Espacio Raro',
                            intensidad: 'soft',
                            sizeIcono: 'small',
                            duracionMs: 800
                        });
                    }
                }, idx * 80);
            });

            log(`   🌌 +50 energía máx a ${enemigosVivos.length} enemigos durante 5s`);

            setTimeout(() => {
                enemigosVivos.forEach(enemigo => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;
                    enemigo.energyGauge = Math.max(1, (enemigo.energyGauge || 70) - 50);
                });
                log(`   💤 Espacio Raro terminado`);
            }, 5000);

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ============================================================
    // ===== MIRAIDON - MOTOR HADRÓNICO =====
    // ============================================================
    "motor-hadronico": {
        nombre: "Motor Hadrónico",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`⚡ ${atacante.pokemon.nombre} desata MOTOR HADRÓNICO!`);

            const nivel = atacante.nivel || 1;
            const buffPct = nivel === 3 ? 1.50 : 0.15;

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Motor Hadrónico', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.YELLOW,
                    icono: 'mov:Motor Hadrónico',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 900
                });
            }

            const aliadosVivos = (contexto.aliados || []).filter(a => a && a.hp > 0 && !a.muerto);
            const enemigosVivos = (contexto.enemigos || []).filter(e => e && e.hp > 0 && !e.muerto);

            aliadosVivos.forEach((aliado, idx) => {
                setTimeout(() => {
                    if (aliado.hp <= 0 || aliado.muerto) return;
                    aliado.bonusMoveDamage = (aliado.bonusMoveDamage || 1) * (1 + buffPct);
                    aliado.actualizarStats();
                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(aliado, {
                            color: MOV_COLOR.YELLOW,
                            icono: 'mov:Motor Hadrónico',
                            intensidad: 'soft',
                            sizeIcono: 'small',
                            duracionMs: 800
                        });
                    }
                }, idx * 80);
            });

            enemigosVivos.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto || enemigo.inmuneImpedimentos) return;
                    if (typeof movAplicarSlow === 'function') {
                        movAplicarSlow(enemigo, 0.95, 1, '(Motor Hadrónico)');
                    }
                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(enemigo, {
                            color: MOV_COLOR.YELLOW,
                            icono: 'mov:Motor Hadrónico',
                            intensidad: 'strong',
                            sizeIcono: 'large',
                            duracionMs: 700
                        });
                    }
                }, idx * 80);
            });

            log(`   ⚡ +${Math.round(buffPct * 100)}% daño movimiento a aliados`);
            log(`   🌩️ Enemigos aturdidos periódicamente`);

            setTimeout(() => {
                aliadosVivos.forEach(aliado => {
                    if (aliado.hp <= 0 || aliado.muerto) return;
                    aliado.bonusMoveDamage = (aliado.bonusMoveDamage || 1) / (1 + buffPct);
                    aliado.actualizarStats();
                });
            }, 5000);

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ============================================================
    // ===== ZACIAN - TAJO SUPREMO =====
    // ============================================================
    // 🆕 v3: Zacian es una invocación especial. No equipa Disco
    //        Definitivo; usa `behemothBlade` (Hada nivel 6) como
    //        "disco virtual" para desbloquear esta ulti.
    //
    //        - Movimientos 1 y 2: Garra Metál (repetido)
    //        - Ulti: Tajo Supremo (esta entrada)
    //
    //        Tajo Supremo golpea a TODOS los enemigos vivos del
    //        tablero con 550% del Ataque. Daño extra +50%
    //        contra enemigos con escudo.
    // ============================================================
    "tajo-supremo-zacian": {
        nombre: "Tajo Supremo",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`⚔️ ${atacante.pokemon.nombre} desata TAJO SUPREMO!`);

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);

            if (enemigosVivos.length === 0) {
                log(`   ⚠️ No hay enemigos vivos`);
                return false;
            }

            log(`   🎯 ¡Golpeando a TODOS los ${enemigosVivos.length} enemigos!`);

            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 5.50));

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Tajo Supremo', 0.5);
            }

            setTimeout(() => {
                if (typeof movMostrarEfectoVisual === 'function') {
                    movMostrarEfectoVisual(atacante, {
                        color: MOV_COLOR.WHITE,
                        icono: 'mov:Tajo Supremo',
                        intensidad: 'strong',
                        sizeIcono: 'large',
                        duracionMs: 1200
                    });
                }
            }, 100);

            enemigosVivos.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;

                    if (typeof movMostrarLineaProyectil === 'function') {
                        movMostrarLineaProyectil(atacante, enemigo, 'rgba(255, 255, 255, 0.95)', 400);
                    }
                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(enemigo, {
                            color: MOV_COLOR.WHITE,
                            icono: 'mov:Tajo Supremo',
                            intensidad: 'strong',
                            sizeIcono: 'large',
                            duracionMs: 900
                        });
                    }
                    if (typeof movAplicarDaño === 'function') {
                        movAplicarDaño(atacante, enemigo, dañoFinal, false);
                    }

                    // Daño extra contra escudos
                    if (enemigo.escudoActual > 0) {
                        const dañoExtra = Math.floor(dañoFinal * 0.5);
                        movAplicarDaño(atacante, enemigo, dañoExtra, false);
                        log(`   🛡️ ¡Daño extra contra escudo de ${enemigo.pokemon.nombre}! (+${dañoExtra})`);
                    }
                }, idx * 100);
            });

            return true;
        }
    },

});

console.log("✅ ultis-registro-3.js cargado (v3 - con Tajo Supremo de Zacian) -", Object.keys(ULTIS_REGISTRO).length, "ulti(s) totales");