// ============================================================
// REGISTRO DE ULTIS - PARTE 2 (COSTE 3)
// ============================================================
// La clave del objeto es el `id` de la ulti.
// Si la ulti no tiene `id`, se usa el nombre convertido a slug.
//
// ⚠️ TODAS las descripciones y comentarios en español.
//
// 🔧 v3 FIX:
//   - aguijon-letal: dispara desde su posición, luego cambia
//     de columna (zigzag entre columnas con enemigos).
//   - danza-pelusa: NO se mueve, daña y cura en su propia casilla.
//   - sonidos: cada ulti llama a SU PROPIO sonido (slug propio).
//   - rayozapdos usa rayo.mp3 existente.
// ============================================================

Object.assign(ULTIS_REGISTRO, {

    // ============================================================
    // ===== ABSOL - CERCENADOR UMBRÍO =====
    // ============================================================
    "cercenador-umbrio": {
        nombre: "Cercenador Umbrío",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`🌑 ${atacante.pokemon.nombre} desata CERCENADOR UMBRÍO!`);

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) {
                log(`   ⚠️ No hay enemigos vivos`);
                return false;
            }

            if (typeof movObtenerPosicionGlobal !== 'function') return false;
            const posAtk = movObtenerPosicionGlobal(atacante);
            if (!posAtk) return false;

            let objetivoFinal = objetivo;
            if (!objetivoFinal || objetivoFinal.hp <= 0 || objetivoFinal.muerto) {
                if (typeof movEncontrarObjetivo === 'function') {
                    objetivoFinal = movEncontrarObjetivo(atacante, enemigosVivos, 'masCercano', 1);
                }
                if (!objetivoFinal) objetivoFinal = enemigosVivos[0];
            }
            if (!objetivoFinal) return false;

            const posObjetivo = movObtenerPosicionGlobal(objetivoFinal);
            if (!posObjetivo) return false;

            const enemigosEnArea = [objetivoFinal];
            if (typeof movCasillasEnArea === 'function' && typeof movUnidadEnPosicion === 'function') {
                const casillas = movCasillasEnArea(posObjetivo, 2);
                for (let c of casillas) {
                    const u = movUnidadEnPosicion(c, enemigosVivos);
                    if (u && !enemigosEnArea.includes(u)) enemigosEnArea.push(u);
                }
            }

            const drOriginal = atacante.bonusDamageReduction || 1;
            atacante.bonusDamageReduction *= 0.01;
            atacante.actualizarStats();
            log(`   🛡️ ${atacante.pokemon.nombre} es inmune al daño durante el ataque`);

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Cercenador Umbrío', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.GRAY,
                    icono: 'mov:Tajo Umbrío',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 900
                });
            }

            const dañoGolpe = Math.max(1, Math.floor((atacante.ataque || 0) * 0.58));
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    enemigosEnArea.forEach((enemigo, idx) => {
                        if (enemigo.hp <= 0 || enemigo.muerto) return;
                        setTimeout(() => {
                            if (enemigo.hp <= 0 || enemigo.muerto) return;
                            if (typeof movMostrarEfectoVisual === 'function') {
                                movMostrarEfectoVisual(enemigo, {
                                    color: MOV_COLOR.GRAY,
                                    icono: 'mov:Tajo Umbrío',
                                    intensidad: i === 0 ? 'strong' : 'soft',
                                    sizeIcono: i === 0 ? 'large' : 'small',
                                    duracionMs: 500
                                });
                            }
                            if (typeof movAplicarDaño === 'function') {
                                movAplicarDaño(atacante, enemigo, dañoGolpe, false);
                            }
                        }, idx * 60);
                    });
                }, i * 120);
            }

            const tiempoCuchillas = 5 * 120 + 300;
            const dañoCuchilla = Math.max(1, Math.floor((atacante.ataque || 0) * ((atacante.nivel || 1) === 3 ? 3.60 : 1.20)));

            setTimeout(() => {
                enemigosVivos.forEach((enemigo, idx) => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;
                    setTimeout(() => {
                        if (enemigo.hp <= 0 || enemigo.muerto) return;
                        if (typeof movMostrarLineaProyectil === 'function') {
                            movMostrarLineaProyectil(atacante, enemigo, 'rgba(75, 85, 99, 0.95)', 400);
                        }
                        if (typeof movMostrarEfectoVisual === 'function') {
                            movMostrarEfectoVisual(enemigo, {
                                color: MOV_COLOR.GRAY,
                                icono: 'mov:Tajo Umbrío',
                                intensidad: 'strong',
                                sizeIcono: 'large',
                                duracionMs: 800
                            });
                        }
                        if (typeof movAplicarDaño === 'function') {
                            movAplicarDaño(atacante, enemigo, dañoCuchilla, false);
                        }
                    }, idx * 100);
                });
            }, tiempoCuchillas);

            const tiempoEjecucion = tiempoCuchillas + enemigosVivos.length * 100 + 200;
            setTimeout(() => {
                let ejecutados = 0;
                for (let enemigo of enemigosVivos) {
                    if (enemigo.hp <= 0 || enemigo.muerto) continue;
                    const porcentajeHP = enemigo.hp / enemigo.maxHp;
                    if (porcentajeHP < 0.30) {
                        if (typeof movMostrarEfectoVisual === 'function') {
                            movMostrarEfectoVisual(enemigo, {
                                color: MOV_COLOR.GRAY,
                                icono: 'mov:Tajo Umbrío',
                                intensidad: 'strong',
                                sizeIcono: 'large',
                                duracionMs: 1200
                            });
                        }
                        const dañoMortal = enemigo.hp;
                        enemigo.hp = 0;
                        enemigo.muerto = true;
                        enemigo.damageTaken = (enemigo.damageTaken || 0) + dañoMortal;
                        atacante.damageDealt = (atacante.damageDealt || 0) + dañoMortal;
                        if (typeof actualizarCopiaEstadisticas === 'function') {
                            actualizarCopiaEstadisticas(atacante, 'damageDealt', dañoMortal);
                            actualizarCopiaEstadisticas(enemigo, 'damageTaken', dañoMortal);
                        }
                        if (typeof obtenerPosicionUnidadActual === 'function') {
                            const pos = obtenerPosicionUnidadActual(enemigo);
                            if (pos && pos.elemento && typeof ocultarUnidadMuerta === 'function') {
                                ocultarUnidadMuerta(pos.elemento);
                            }
                        }
                        ejecutados++;
                        log(`   💀 ¡${enemigo.pokemon.nombre} EJECUTADO!`);
                    }
                }
                if (ejecutados > 0) {
                    log(`   💀 ${ejecutados} enemigo(s) eliminado(s) por ejecución`);
                }

                if (atacante.hp > 0 && !atacante.muerto) {
                    atacante.bonusDamageReduction = drOriginal;
                    atacante.actualizarStats();

                    const costeHP = Math.floor(atacante.maxHp * 0.10);
                    atacante.hp = Math.max(1, atacante.hp - costeHP);
                    if (typeof actualizarCopiaEstadisticas === 'function') {
                        actualizarCopiaEstadisticas(atacante, 'damageTaken', costeHP);
                    }
                    log(`   💔 ${atacante.pokemon.nombre} pierde ${costeHP} HP al terminar (10%)`);

                    if (typeof obtenerPosicionUnidadActual === 'function') {
                        const pos = obtenerPosicionUnidadActual(atacante);
                        if (pos && pos.elemento && typeof actualizarBarraVidaPokemon === 'function') {
                            actualizarBarraVidaPokemon(pos.elemento, atacante.hp, atacante.maxHp, costeHP, atacante);
                        }
                    }
                }
            }, tiempoEjecucion);

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ============================================================
    // ===== CLEFABLE - BESO DRENAJE =====
    // ============================================================
    "beso-drenaje": {
        nombre: "Beso Drenaje",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`💋 ${atacante.pokemon.nombre} usa BESO DRENAJE!`);

            if (typeof movObtenerPosicionGlobal !== 'function') return false;
            const posAtacante = movObtenerPosicionGlobal(atacante);
            if (!posAtacante) return false;

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            const enemigosEnArea = [];
            if (typeof movCasillasEnArea === 'function' && typeof movUnidadEnPosicion === 'function') {
                const casillas = movCasillasEnArea(posAtacante, 2);
                for (let c of casillas) {
                    const u = movUnidadEnPosicion(c, enemigosVivos);
                    if (u && !enemigosEnArea.includes(u)) enemigosEnArea.push(u);
                }
            }

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Beso Drenaje', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.PINK,
                    icono: 'mov:Beso Drenaje',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 900
                });
            }

            const dañoBase = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * ((atacante.nivel || 1) === 3 ? 2.40 : 0.80)));

            enemigosEnArea.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;
                    if (typeof movMostrarLineaProyectil === 'function') {
                        movMostrarLineaProyectil(atacante, enemigo, 'rgba(244, 114, 182, 0.95)', 400);
                    }
                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(enemigo, {
                            color: MOV_COLOR.PINK,
                            icono: 'mov:Beso Drenaje',
                            intensidad: 'strong',
                            sizeIcono: 'large',
                            duracionMs: 800
                        });
                    }
                    if (typeof movAplicarDaño === 'function') {
                        movAplicarDaño(atacante, enemigo, dañoBase, false);
                    }
                }, idx * 100);
            });

            setTimeout(() => {
                const aliadosVivos = (contexto.aliados || []).filter(a => a && a.hp > 0 && !a.muerto);
                if (aliadosVivos.length === 0) return;

                aliadosVivos.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));
                const objetivoCura = aliadosVivos[0];

                const curacion = Math.floor((atacante.ataqueEspecial || 0) * ((atacante.nivel || 1) === 3 ? 10.50 : 3.50));

                if (typeof movMostrarLineaProyectil === 'function') {
                    movMostrarLineaProyectil(atacante, objetivoCura, 'rgba(244, 114, 182, 0.95)', 600);
                }

                setTimeout(() => {
                    if (objetivoCura.hp <= 0 || objetivoCura.muerto) return;
                    if (typeof movCurar === 'function') {
                        movCurar(atacante, curacion, objetivoCura);
                    } else {
                        const curado = Math.min(curacion, objetivoCura.maxHp - objetivoCura.hp);
                        objetivoCura.hp += curado;
                        objetivoCura.healingDone = (objetivoCura.healingDone || 0) + curado;
                    }
                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(objetivoCura, {
                            color: MOV_COLOR.GREEN,
                            icono: '💚',
                            intensidad: 'strong',
                            sizeIcono: 'large',
                            duracionMs: 1200
                        });
                    }
                    log(`   💚 Corazón curativo → ${objetivoCura.pokemon.nombre} (+${curacion} HP)`);
                }, 300);
            }, enemigosEnArea.length * 100 + 200);

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ============================================================
    // ===== ESPEON - PODER RESERVA =====
    // ============================================================
    "poder-reserva": {
        nombre: "Poder Reserva",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`🔮 ${atacante.pokemon.nombre} usa PODER RESERVA!`);

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) {
                log(`   ⚠️ No hay enemigos vivos`);
                return false;
            }

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Poder Reserva', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.PURPLE,
                    icono: 'mov:Poder Reserva',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 900
                });
            }

            const dañoPorGolpe = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * ((atacante.nivel || 1) === 3 ? 1.35 : 0.45)));
            const NUM_GOLPES = 15;

            for (let i = 0; i < NUM_GOLPES; i++) {
                setTimeout(() => {
                    const enemigosActuales = enemigosVivos.filter(e => e.hp > 0 && !e.muerto);
                    if (enemigosActuales.length === 0) return;

                    const objetivoAleatorio = enemigosActuales[Math.floor(Math.random() * enemigosActuales.length)];

                    if (typeof movMostrarLineaProyectil === 'function') {
                        movMostrarLineaProyectil(atacante, objetivoAleatorio, 'rgba(168, 85, 247, 0.95)', 300);
                    }
                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(objetivoAleatorio, {
                            color: MOV_COLOR.PURPLE,
                            icono: 'mov:Poder Reserva',
                            intensidad: i === 0 ? 'strong' : 'soft',
                            sizeIcono: i === 0 ? 'large' : 'small',
                            duracionMs: 400
                        });
                    }
                    if (typeof movAplicarDaño === 'function') {
                        movAplicarDaño(atacante, objetivoAleatorio, dañoPorGolpe, false);
                    }
                }, i * 100);
            }

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ============================================================
    // ===== GLACEON - CAMPO GLACIAL =====
    // ============================================================
    "campo-glacial": {
        nombre: "Campo Glacial",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`❄️ ${atacante.pokemon.nombre} usa CAMPO GLACIAL!`);

            if (typeof movObtenerPosicionGlobal !== 'function') return false;
            const posAtacante = movObtenerPosicionGlobal(atacante);
            if (!posAtacante) return false;

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;

            let objetivoFinal = objetivo;
            if (!objetivoFinal || objetivoFinal.hp <= 0 || objetivoFinal.muerto) {
                if (typeof movEncontrarObjetivo === 'function') {
                    objetivoFinal = movEncontrarObjetivo(atacante, enemigosVivos, 'masCercano', 4);
                }
                if (!objetivoFinal) objetivoFinal = enemigosVivos[0];
            }
            if (!objetivoFinal) return false;

            const posObjetivo = movObtenerPosicionGlobal(objetivoFinal);
            if (!posObjetivo) return false;

            const enemigosEnRombo = [objetivoFinal];
            if (typeof movUnidadEnPosicion === 'function') {
                for (let df = -2; df <= 2; df++) {
                    for (let dc = -2; dc <= 2; dc++) {
                        if (Math.abs(df) + Math.abs(dc) > 2) continue;
                        const f = posObjetivo.fila + df;
                        const c = posObjetivo.col + dc;
                        if (f < 0 || f > 3 || c < 0 || c > 3) continue;
                        const u = movUnidadEnPosicion({ fila: f, col: c }, enemigosVivos);
                        if (u && !enemigosEnRombo.includes(u)) enemigosEnRombo.push(u);
                    }
                }
            }

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Campo Glacial', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.CYAN,
                    icono: 'mov:Campo Glacial',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 900
                });
            }

            const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * ((atacante.nivel || 1) === 3 ? 6.60 : 2.20)));

            enemigosEnRombo.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;

                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(enemigo, {
                            color: MOV_COLOR.CYAN,
                            icono: 'mov:Campo Glacial',
                            intensidad: 'strong',
                            sizeIcono: 'large',
                            duracionMs: 900
                        });
                    }

                    if (typeof movAplicarDaño === 'function') {
                        movAplicarDaño(atacante, enemigo, dañoFinal, false);
                    }

                    if (enemigo.hp > 0 && !enemigo.muerto) {
                        if (!enemigo.inmuneImpedimentos) {
                            enemigo.frozen = true;
                            enemigo.frozenRealInicio = performance.now();
                            enemigo.frozenDuracion = 1.5;
                            enemigo.frozenTimer = 1.5;

                            const drOriginal = enemigo.bonusDamageReduction || 1;
                            enemigo.bonusDamageReduction = drOriginal * ((atacante.nivel || 1) === 3 ? 0.70 : 0.90);
                            enemigo.actualizarStats();
                            setTimeout(() => {
                                if (enemigo.hp <= 0 || enemigo.muerto) return;
                                enemigo.bonusDamageReduction = drOriginal;
                                enemigo.actualizarStats();
                            }, 1500);

                            if (typeof movMostrarEfectoVisual === 'function') {
                                movMostrarEfectoVisual(enemigo, {
                                    color: MOV_COLOR.CYAN,
                                    icono: 'mov:Campo Glacial',
                                    intensidad: 'soft',
                                    sizeIcono: 'small',
                                    duracionMs: 1500,
                                    persistente: true,
                                    pulso: true,
                                    claseExtra: 'icon-frozen'
                                });
                            }
                        }
                    }
                }, idx * 100);
            });

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ============================================================
    // ===== GOSSIFLEUR / ELDEGOSS - DANZA PELUSA =====
    // ============================================================
    // 🔧 v2 FIX: NO se mueve. Daña y cura en su propia casilla.
    // ============================================================
    "danza-pelusa": {
        nombre: "Danza Pelusa",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`🌿 ${atacante.pokemon.nombre} usa DANZA PELUSA!`);

            if (typeof movObtenerPosicionGlobal !== 'function') return false;
            const posAtacante = movObtenerPosicionGlobal(atacante);
            if (!posAtacante) return false;

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Danza Pelusa', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.GREEN,
                    icono: 'mov:Danza Pelusa',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 900
                });
            }

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            const enemigosEnArea = [];

            if (typeof movCasillasEnArea === 'function' && typeof movUnidadEnPosicion === 'function') {
                const casillas = movCasillasEnArea(posAtacante, 1);
                for (let c of casillas) {
                    const u = movUnidadEnPosicion(c, enemigosVivos);
                    if (u && !enemigosEnArea.includes(u)) enemigosEnArea.push(u);
                }
            }

            log(`   📍 Daño en área alrededor de (${posAtacante.fila},${posAtacante.col}): ${enemigosEnArea.length} enemigo(s)`);

            const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * ((atacante.nivel || 1) === 3 ? 3.00 : 1.00)));

            enemigosEnArea.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;
                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(enemigo, {
                            color: MOV_COLOR.GREEN,
                            icono: 'mov:Danza Pelusa',
                            intensidad: 'strong',
                            sizeIcono: 'large',
                            duracionMs: 900
                        });
                    }
                    if (typeof movAplicarDaño === 'function') {
                        movAplicarDaño(atacante, enemigo, dañoFinal, false);
                    }
                    // Retroceder: empujar 1 casilla alejándolo del atacante
                    if (enemigo.hp > 0 && !enemigo.muerto && !enemigo.inmuneImpedimentos) {
                        const posE = movObtenerPosicionGlobal(enemigo);
                        if (posE) {
                            const dFila = Math.sign(posE.fila - posAtacante.fila);
                            const dCol = Math.sign(posE.col - posAtacante.col);
                            let nf = posE.fila;
                            let nc = posE.col;
                            if (Math.abs(posE.fila - posAtacante.fila) >= Math.abs(posE.col - posAtacante.col)) nf = posE.fila + dFila;
                            else nc = posE.col + dCol;
                            if (nf >= 0 && nf <= 3 && nc >= 0 && nc <= 3) {
                                if (typeof movSetPosicionGlobal === 'function') {
                                    movSetPosicionGlobal(enemigo, nf, nc);
                                    if (typeof renderizarCombate === 'function') renderizarCombate();
                                }
                            }
                        }
                    }
                }, idx * 100);
            });

            const aliadosVivos = (contexto.aliados || []).filter(a => a && a.hp > 0 && !a.muerto);
            const aliadosEnArea = [atacante];

            if (typeof movCasillasEnArea === 'function' && typeof movUnidadEnPosicion === 'function') {
                const casillas = movCasillasEnArea(posAtacante, 1);
                for (let c of casillas) {
                    const u = movUnidadEnPosicion(c, aliadosVivos);
                    if (u && !aliadosEnArea.includes(u)) aliadosEnArea.push(u);
                }
            }

            const curacion = Math.floor((atacante.ataqueEspecial || 0) * ((atacante.nivel || 1) === 3 ? 18.00 : 6.00));

            aliadosEnArea.forEach((aliado, idx) => {
                setTimeout(() => {
                    if (aliado.hp <= 0 || aliado.muerto) return;
                    if (typeof movCurar === 'function') {
                        movCurar(aliado, curacion);
                    } else {
                        const curado = Math.min(curacion, aliado.maxHp - aliado.hp);
                        aliado.hp += curado;
                        aliado.healingDone = (aliado.healingDone || 0) + curado;
                    }
                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(aliado, {
                            color: MOV_COLOR.GREEN,
                            icono: '💚',
                            intensidad: 'strong',
                            sizeIcono: 'large',
                            duracionMs: 900
                        });
                    }
                }, idx * 100);
            });

            log(`   💚 Curación de ${curacion} a ${aliadosEnArea.length} aliado(s) (incluido él mismo)`);

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ============================================================
    // ===== HAUNTER / GENGAR - SOBRESALTO =====
    // ============================================================
    "sobresalto": {
        nombre: "Sobresalto",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`👻 ${atacante.pokemon.nombre} usa SOBRESALTO!`);

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;

            if (typeof movObtenerPosicionGlobal !== 'function') return false;
            const posAtk = movObtenerPosicionGlobal(atacante);
            if (!posAtk) return false;

            let objetivoLejano = null;
            let maxDist = -1;
            for (let e of enemigosVivos) {
                const pe = movObtenerPosicionGlobal(e);
                if (!pe) continue;
                const d = Math.max(Math.abs(pe.fila - posAtk.fila), Math.abs(pe.col - posAtk.col));
                if (d > maxDist) {
                    maxDist = d;
                    objetivoLejano = e;
                }
            }
            if (!objetivoLejano) objetivoLejano = enemigosVivos[0];

            const posObj = movObtenerPosicionGlobal(objetivoLejano);
            if (!posObj) return false;

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Sobresalto', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.PURPLE,
                    icono: 'mov:Sobresalto',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 600
                });
            }

            const candidatas = [
                { fila: posObj.fila - 1, col: posObj.col },
                { fila: posObj.fila + 1, col: posObj.col },
                { fila: posObj.fila, col: posObj.col - 1 },
                { fila: posObj.fila, col: posObj.col + 1 }
            ].filter(c => c.fila >= 0 && c.fila <= 3 && c.col >= 0 && c.col <= 3);

            let destinoElegido = null;
            for (let c of candidatas) {
                let ocupada = false;
                for (let e of enemigosVivos) {
                    const pe = movObtenerPosicionGlobal(e);
                    if (pe && pe.fila === c.fila && pe.col === c.col) { ocupada = true; break; }
                }
                if (!ocupada) {
                    for (let a of (contexto.aliados || [])) {
                        if (a === atacante) continue;
                        const pa = movObtenerPosicionGlobal(a);
                        if (pa && pa.fila === c.fila && pa.col === c.col) { ocupada = true; break; }
                    }
                }
                if (!ocupada) { destinoElegido = c; break; }
            }

            if (destinoElegido && typeof movSetPosicionGlobal === 'function') {
                movSetPosicionGlobal(atacante, destinoElegido.fila, destinoElegido.col);
                if (typeof renderizarCombate === 'function') renderizarCombate();
            }

            setTimeout(() => {
                const enemigosCerca = [objetivoLejano];
                if (typeof movCasillasEnArea === 'function' && typeof movUnidadEnPosicion === 'function') {
                    const casillas = movCasillasEnArea(posObj, 1);
                    for (let c of casillas) {
                        const u = movUnidadEnPosicion(c, enemigosVivos);
                        if (u && !enemigosCerca.includes(u)) enemigosCerca.push(u);
                    }
                }

                const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * ((atacante.nivel || 1) === 3 ? 7.50 : 2.50)));

                enemigosCerca.forEach((enemigo, idx) => {
                    setTimeout(() => {
                        if (enemigo.hp <= 0 || enemigo.muerto) return;
                        if (typeof movMostrarEfectoVisual === 'function') {
                            movMostrarEfectoVisual(enemigo, {
                                color: MOV_COLOR.PURPLE,
                                icono: 'mov:Sobresalto',
                                intensidad: 'strong',
                                sizeIcono: 'large',
                                duracionMs: 900
                            });
                        }
                        if (typeof movAplicarDaño === 'function') {
                            movAplicarDaño(atacante, enemigo, dañoFinal, false);
                        }
                        if (enemigo.hp > 0 && !enemigo.muerto) {
                            if (!enemigo.inmuneImpedimentos) {
                                if (typeof movAplicarVeneno === 'function') {
                                    movAplicarVeneno(enemigo, ((atacante.nivel || 1) === 3 ? 120 : 40), 5);
                                }
                                setTimeout(() => {
                                    if (typeof movMostrarEfectoVisual === 'function') {
                                        movMostrarEfectoVisual(enemigo, {
                                            color: MOV_COLOR.VENOM,
                                            icono: 'mov:Sobresalto',
                                            intensidad: 'soft',
                                            sizeIcono: 'small',
                                            duracionMs: 5000,
                                            persistente: true,
                                            pulso: true,
                                            claseExtra: 'icon-poison'
                                        });
                                    }
                                }, 300);
                            }
                        }
                    }, idx * 100);
                });
            }, 300);

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ============================================================
    // ===== KUBFU / URSHIFU - TORRENTE FURIOSO =====
    // ============================================================
    "torrente-furioso": {
        nombre: "Torrente Furioso",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`🌊 ${atacante.pokemon.nombre} desata TORRENTE FURIOSO!`);

            atacante._torrenteFuriosoActivo = true;
            atacante._torrenteFuriosoContador = 0;

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Torrente Furioso', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.BLUE,
                    icono: 'mov:Torrente Furioso',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 1200
                });
            }

            setTimeout(() => {
                if (typeof movMostrarEfectoVisual === 'function') {
                    movMostrarEfectoVisual(atacante, {
                        color: MOV_COLOR.BLUE,
                        icono: 'mov:Torrente Furioso',
                        intensidad: 'soft',
                        sizeIcono: 'small',
                        duracionMs: 8000,
                        persistente: true,
                        pulso: true,
                        claseExtra: 'icon-torrent'
                    });
                }
            }, 400);

            const dañoBase = atacante.ataque || 1;

            setTimeout(() => {
                if (atacante.hp <= 0 || atacante.muerto) return;

                const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
                if (enemigosVivos.length === 0) return;

                let objetivoFinal = objetivo;
                if (!objetivoFinal || objetivoFinal.hp <= 0 || objetivoFinal.muerto) {
                    if (typeof movEncontrarObjetivo === 'function') {
                        objetivoFinal = movEncontrarObjetivo(atacante, enemigosVivos, 'masCercano', 1);
                    }
                    if (!objetivoFinal) objetivoFinal = enemigosVivos[0];
                }
                if (!objetivoFinal) return;

                const dañoPotenciado = Math.max(1, Math.floor(dañoBase * 1.80));

                if (typeof movMostrarLineaProyectil === 'function') {
                    movMostrarLineaProyectil(atacante, objetivoFinal, 'rgba(59, 130, 246, 0.95)', 400);
                }
                if (typeof movMostrarEfectoVisual === 'function') {
                    movMostrarEfectoVisual(objetivoFinal, {
                        color: MOV_COLOR.BLUE,
                        icono: 'mov:Torrente Furioso',
                        intensidad: 'strong',
                        sizeIcono: 'large',
                        duracionMs: 900
                    });
                }
                if (typeof movAplicarDaño === 'function') {
                    movAplicarDaño(atacante, objetivoFinal, dañoPotenciado, false);
                }
            }, 800);

            setTimeout(() => {
                if (atacante.hp <= 0 || atacante.muerto) return;

                const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
                if (enemigosVivos.length === 0) return;

                let objetivoFinal = objetivo;
                if (!objetivoFinal || objetivoFinal.hp <= 0 || objetivoFinal.muerto) {
                    if (typeof movEncontrarObjetivo === 'function') {
                        objetivoFinal = movEncontrarObjetivo(atacante, enemigosVivos, 'masCercano', 1);
                    }
                    if (!objetivoFinal) objetivoFinal = enemigosVivos[0];
                }
                if (!objetivoFinal) return;

                const posObj = movObtenerPosicionGlobal(objetivoFinal);
                if (!posObj) return;

                const enemigosEnArea = [objetivoFinal];
                if (typeof movCasillasEnArea === 'function' && typeof movUnidadEnPosicion === 'function') {
                    const casillas = movCasillasEnArea(posObj, 1);
                    for (let c of casillas) {
                        const u = movUnidadEnPosicion(c, enemigosVivos);
                        if (u && !enemigosEnArea.includes(u)) enemigosEnArea.push(u);
                    }
                }

                const dañoArea = Math.max(1, Math.floor(dañoBase * 1.30));

                enemigosEnArea.forEach((enemigo, idx) => {
                    setTimeout(() => {
                        if (enemigo.hp <= 0 || enemigo.muerto) return;
                        if (typeof movMostrarEfectoVisual === 'function') {
                            movMostrarEfectoVisual(enemigo, {
                                color: MOV_COLOR.BLUE,
                                icono: 'mov:Torrente Furioso',
                                intensidad: 'strong',
                                sizeIcono: 'large',
                                duracionMs: 900
                            });
                        }
                        if (typeof movAplicarDaño === 'function') {
                            movAplicarDaño(atacante, enemigo, dañoArea, false);
                        }
                    }, idx * 100);
                });

                atacante._torrenteFuriosoActivo = false;
            }, 1600);

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ============================================================
    // ===== LAPRAS - A TODO LAPRAS =====
    // ============================================================
    "a-todo-lapras": {
        nombre: "A Todo Lapras",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`🌊 ${atacante.pokemon.nombre} usa A TODO LAPRAS!`);

            if (typeof movObtenerPosicionGlobal !== 'function') return false;
            const posAtacante = movObtenerPosicionGlobal(atacante);
            if (!posAtacante) return false;

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            const enemigosEnArea = [];
            if (typeof movCasillasEnArea === 'function' && typeof movUnidadEnPosicion === 'function') {
                const casillas = movCasillasEnArea(posAtacante, 1);
                for (let c of casillas) {
                    const u = movUnidadEnPosicion(c, enemigosVivos);
                    if (u && !enemigosEnArea.includes(u)) enemigosEnArea.push(u);
                }
            }

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('A Todo Lapras', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.BLUE,
                    icono: 'mov:A Todo Lapras',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 900
                });
            }

            const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * ((atacante.nivel || 1) === 3 ? 2.70 : 0.90)));

            enemigosEnArea.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;

                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(enemigo, {
                            color: MOV_COLOR.BLUE,
                            icono: 'mov:A Todo Lapras',
                            intensidad: 'strong',
                            sizeIcono: 'large',
                            duracionMs: 900
                        });
                    }

                    if (typeof movAplicarDaño === 'function') {
                        movAplicarDaño(atacante, enemigo, dañoFinal, false);
                    }

                    if (enemigo.hp > 0 && !enemigo.muerto) {
                        const origenObj = movObtenerPosicionGlobal(enemigo);
                        if (origenObj && posAtacante) {
                            const dFila = Math.sign(origenObj.fila - posAtacante.fila);
                            const dCol = Math.sign(origenObj.col - posAtacante.col);
                            let nf = origenObj.fila, nc = origenObj.col;
                            if (Math.abs(origenObj.fila - posAtacante.fila) >= Math.abs(origenObj.col - posAtacante.col)) nf = origenObj.fila + dFila;
                            else nc = origenObj.col + dCol;
                            if (nf >= 0 && nf <= 3 && nc >= 0 && nc <= 3) {
                                if (typeof movSetPosicionGlobal === 'function') {
                                    movSetPosicionGlobal(enemigo, nf, nc);
                                    if (typeof renderizarCombate === 'function') renderizarCombate();
                                }
                            }
                        }
                    }
                }, idx * 100);
            });

            const escudo = Math.floor((atacante.maxHp || 0) * ((atacante.nivel || 1) === 3 ? 1.08 : 0.36));
            if (escudo > 0) {
                atacante.escudoActual = (atacante.escudoActual || 0) + escudo;
                if (typeof actualizarEscudoVisual === 'function') actualizarEscudoVisual(atacante);
                setTimeout(() => {
                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(atacante, {
                            color: MOV_COLOR.BLUE,
                            icono: 'mov:A Todo Lapras',
                            intensidad: 'soft',
                            sizeIcono: 'small',
                            duracionMs: 5000,
                            persistente: true,
                            pulso: true,
                            claseExtra: 'icon-shield'
                        });
                    }
                }, 300);
                log(`   🛡️ Escudo de ${escudo} HP a ${atacante.pokemon.nombre} durante 5s`);
            }

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ============================================================
    // ===== SOBBLE / DRIZZILE / INTELEON - AGUIJÓN LETAL =====
    // ============================================================
    // 🔧 v5 FIX:
    //   1. Elige la columna con MÁS enemigos.
    //   2. Si ya está en esa columna, elige la SIGUIENTE con más
    //      enemigos para forzar el cambio de posición.
    //   3. NUNCA usa la ulti dos veces seguidas desde la misma columna.
    // ============================================================
    "aguijon-letal": {
    nombre: "Aguijón Letal",

    ejecutar: function(atacante, objetivo, contexto) {
        const log = (msg) => {
            if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
            else console.log(msg);
        };

        log(`💧 ${atacante.pokemon.nombre} usa AGUIJÓN LETAL!`);

        if (typeof movObtenerPosicionGlobal !== 'function' || typeof movSetPosicionGlobal !== 'function') {
            return false;
        }

        const esJugador = atacante.equipo === 'player';

        const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);

        if (enemigosVivos.length === 0) {
            log(`   ⚠️ No hay enemigos vivos`);
            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }

        // ============================================================
        // 1) Contar enemigos por FILA (0..4)
        // ============================================================
        const enemigosPorFila = {};
        for (let e of enemigosVivos) {
            const pe = movObtenerPosicionGlobal(e);
            if (!pe) continue;
            if (!enemigosPorFila[pe.fila]) enemigosPorFila[pe.fila] = [];
            enemigosPorFila[pe.fila].push(e);
        }

        const filasConEnemigos = Object.keys(enemigosPorFila).map(Number);
        if (filasConEnemigos.length === 0) {
            log(`   ⚠️ No hay enemigos en ninguna fila`);
            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }

        // Elegir la fila con MÁS enemigos
        // Desempate: la más cercana a la fila del atacante
        const posAtacante = movObtenerPosicionGlobal(atacante);
        const filaAtacante = posAtacante ? posAtacante.fila : 2;

        filasConEnemigos.sort((fA, fB) => {
            const countA = enemigosPorFila[fA].length;
            const countB = enemigosPorFila[fB].length;
            if (countA !== countB) return countB - countA;
            return Math.abs(fA - filaAtacante) - Math.abs(fB - filaAtacante);
        });

        const filaElegida = filasConEnemigos[0];
        log(`   🎯 Fila elegida: ${filaElegida} (${enemigosPorFila[filaElegida].length} enemigo/s)`);

        // ============================================================
        // 2) Moverse a esa fila manteniendo la columna actual
        // ============================================================
        const columnaActual = posAtacante ? posAtacante.col : (esJugador ? 0 : 7);

        const yaEnFila = posAtacante && posAtacante.fila === filaElegida;

        if (!yaEnFila) {
            // Comprobar si la casilla destino está ocupada
            const ocupada = contexto.aliados && contexto.aliados.some(a => {
                if (!a || a === atacante || a.hp <= 0 || a.muerto) return false;
                const pa = movObtenerPosicionGlobal(a);
                return pa && pa.fila === filaElegida && pa.col === columnaActual;
            });

            // Comprobar también enemigos
            const ocupadaPorEnemigo = contexto.enemigos && contexto.enemigos.some(e => {
                if (!e || e.hp <= 0 || e.muerto) return false;
                const pe = movObtenerPosicionGlobal(e);
                return pe && pe.fila === filaElegida && pe.col === columnaActual;
            });

            if (!ocupada && !ocupadaPorEnemigo) {
                movSetPosicionGlobal(atacante, filaElegida, columnaActual);
                log(`   ✨ Se reposiciona a (${filaElegida},${columnaActual})`);
                if (typeof renderizarCombate === 'function') renderizarCombate();
            } else {
                log(`   ⚠️ Casilla (${filaElegida},${columnaActual}) ocupada, dispara desde donde está`);
            }
        }

        // ============================================================
        // 3) Sonido + efecto visual
        // ============================================================
        if (typeof playSonidoMovimiento === 'function') {
            playSonidoMovimiento('Aguijón Letal', 0.5);
        }

        if (typeof movMostrarEfectoVisual === 'function') {
            movMostrarEfectoVisual(atacante, {
                color: MOV_COLOR.BLUE,
                icono: 'mov:Aguijón Letal',
                intensidad: 'strong',
                sizeIcono: 'large',
                duracionMs: 900
            });
        }

        // ============================================================
        // 4) Disparar en dirección al enemigo
        // ============================================================
        const posNueva = movObtenerPosicionGlobal(atacante);
        if (!posNueva) return true;

        const direccion = esJugador ? 'derecha' : 'izquierda';
        const casillasTrayectoria = movCasillasEnLinea(posNueva, direccion, 8);
        log(`   📏 Disparando desde (${posNueva.fila},${posNueva.col}) hacia ${direccion}: ${casillasTrayectoria.length} casillas`);

        const enemigosGolpeados = [];
        for (let c of casillasTrayectoria) {
            const u = movUnidadEnPosicion(c, enemigosVivos);
            if (u && !enemigosGolpeados.includes(u)) {
                enemigosGolpeados.push(u);
                log(`   🎯 ${u.pokemon.nombre} en (${c.fila},${c.col})`);
            }
        }

        if (enemigosGolpeados.length === 0) {
            log(`   ⚠️ No hay enemigos en la trayectoria desde la fila ${posNueva.fila}`);
            // Fallback: golpear al enemigo más cercano
            let masCercano = null;
            let distMin = Infinity;
            for (let e of enemigosVivos) {
                const d = Math.abs(e._filaGlobal - atacante._filaGlobal) + Math.abs(e._colGlobal - atacante._colGlobal);
                if (d < distMin) { distMin = d; masCercano = e; }
            }
            if (masCercano) enemigosGolpeados.push(masCercano);
        }

        const dañoTotal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 5.30));
        const dañoPorEnemigo = enemigosGolpeados.length > 0
            ? Math.max(1, Math.floor(dañoTotal / enemigosGolpeados.length))
            : dañoTotal;

        log(`   💥 Daño total: ${dañoTotal} | Daño por enemigo: ${dañoPorEnemigo}`);

        if (enemigosGolpeados.length > 0) {
            const ultimo = enemigosGolpeados[enemigosGolpeados.length - 1];
            if (typeof movMostrarLineaProyectil === 'function') {
                movMostrarLineaProyectil(atacante, ultimo, 'rgba(59, 130, 246, 0.95)', 450);
            }
        }

        enemigosGolpeados.forEach((enemigo, idx) => {
            setTimeout(() => {
                if (enemigo.hp <= 0 || enemigo.muerto) return;
                if (typeof movMostrarEfectoVisual === 'function') {
                    movMostrarEfectoVisual(enemigo, {
                        color: MOV_COLOR.BLUE,
                        icono: 'mov:Aguijón Letal',
                        intensidad: 'strong',
                        sizeIcono: 'large',
                        duracionMs: 700
                    });
                }
                if (typeof movAplicarDaño === 'function') {
                    movAplicarDaño(atacante, enemigo, dañoPorEnemigo, false);
                }
            }, idx * 100);
        });

        // ============================================================
        // 5) Bonus: +50 energía y crítico garantizado
        // ============================================================
        atacante.energy = (atacante.energy || 0) + 50;
        log(`   ⚡ +50 energía de movimiento (total: ${atacante.energy})`);

        atacante.critGuaranteed = true;
        setTimeout(() => {
            if (atacante.hp <= 0 || atacante.muerto) return;
            atacante.critGuaranteed = false;
        }, 5000);

        atacante.ultiCarga = 0;
        atacante.ultiLista = false;
        return true;
    }
},

    // ============================================================
    // ===== ZAPDOS - RAYO =====
    // ============================================================
    "rayo-zapdos": {
        nombre: "Rayo",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`⚡ ${atacante.pokemon.nombre} desata RAYO!`);

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Rayo', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.YELLOW,
                    icono: 'mov:Rayo',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 900
                });
            }

            const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * ((atacante.nivel || 1) === 3 ? 1.95 : 0.65)));

            enemigosVivos.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;

                    const origen = idx === 0 ? atacante : enemigosVivos[idx - 1];
                    if (origen && typeof movMostrarLineaProyectil === 'function') {
                        movMostrarLineaProyectil(origen, enemigo, 'rgba(250, 204, 21, 0.95)', 300);
                    }

                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(enemigo, {
                            color: MOV_COLOR.YELLOW,
                            icono: 'mov:Rayo',
                            intensidad: 'strong',
                            sizeIcono: 'large',
                            duracionMs: 800
                        });
                    }

                    if (typeof movAplicarDaño === 'function') {
                        movAplicarDaño(atacante, enemigo, dañoFinal, false);
                    }
                }, idx * 80);
            });

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

});