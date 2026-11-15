// ============================================================
// REGISTRO DE ULTIS - PARTE 1
// ============================================================
// La clave del objeto es el `id` de la ulti.
//
// ⚠️ TODAS las descripciones y comentarios en español.
//
// Estructura de cada ulti:
//   "id": {
//       nombre: "Nombre visible",
//       ejecutar: function(atacante, objetivo, contexto) { ... }
//   }
//
// El contexto incluye:
//   - enemigos: array de enemigos vivos
//   - aliados: array de aliados vivos
//   - esJugador: true/false
// ============================================================

const ULTIS_REGISTRO = {

    // ============================================================
    // ===== COSTE 1 =====
    // ============================================================

    // ===== BULBASAUR / IVYSAUR / VENUSAUR =====
    "rayo-solar": {
        nombre: "Rayo Solar",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`☀️ ${atacante.pokemon.nombre} desata RAYO SOLAR!`);

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) {
                log(`   ⚠️ No hay enemigos vivos para apuntar`);
                return false;
            }

            let objetivoFinal = objetivo;
            if (!objetivoFinal || objetivoFinal.hp <= 0 || objetivoFinal.muerto) {
                if (typeof movEncontrarObjetivo === 'function') {
                    objetivoFinal = movEncontrarObjetivo(atacante, enemigosVivos, 'masCercano', 8);
                }
                if (!objetivoFinal) objetivoFinal = enemigosVivos[0];
            }
            if (!objetivoFinal) return false;

            if (typeof movObtenerPosicionGlobal !== 'function') return false;

            const posAtacante = movObtenerPosicionGlobal(atacante);
            const posObjetivo = movObtenerPosicionGlobal(objetivoFinal);
            if (!posAtacante || !posObjetivo) return false;

            const df = posObjetivo.fila - posAtacante.fila;
            const dc = posObjetivo.col - posAtacante.col;

            let direccion = null;
            if (Math.abs(df) >= Math.abs(dc)) {
                direccion = df < 0 ? 'arriba' : 'abajo';
            } else {
                direccion = dc < 0 ? 'izquierda' : 'derecha';
            }

            const casillasTrayectoria = movCasillasEnLinea(posAtacante, direccion, 8);
            const enemigosGolpeados = [];

            for (let casilla of casillasTrayectoria) {
                const enemigoEnCasilla = movUnidadEnPosicion(casilla, enemigosVivos);
                if (enemigoEnCasilla && !enemigosGolpeados.includes(enemigoEnCasilla)) {
                    enemigosGolpeados.push(enemigoEnCasilla);
                }
            }

            if (enemigosGolpeados.length === 0) {
                enemigosGolpeados.push(objetivoFinal);
            }

            const dañoBase = (atacante.ataqueEspecial || 0) * 4.60;
            const dañoFinal = Math.max(1, Math.floor(dañoBase));

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Rayo Solar', 0.2);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                setTimeout(() => {
                    movMostrarEfectoVisual(atacante, {
                        color: MOV_COLOR.GREEN,
                        icono: 'mov:Rayo Solar',
                        intensidad: 'strong',
                        sizeIcono: 'large',
                        duracionMs: 900
                    });
                }, 100);
            }

            const ultimoEnemigo = enemigosGolpeados[enemigosGolpeados.length - 1];
            if (typeof movMostrarLineaProyectil === 'function') {
                movMostrarLineaProyectil(atacante, ultimoEnemigo, 'rgba(74, 222, 128, 0.95)', 500);
            }

            enemigosGolpeados.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;

                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(enemigo, {
                            color: MOV_COLOR.GREEN,
                            icono: 'mov:Rayo Solar',
                            intensidad: 'strong',
                            sizeIcono: 'large',
                            duracionMs: 900
                        });
                    }

                    if (typeof movAplicarDaño === 'function') {
                        movAplicarDaño(atacante, enemigo, dañoFinal, false);
                    }
                }, idx * 120);
            });

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ===== CHARMANDER / CHARMELEON / CHARIZARD =====
    "llamarada-charmander": {
        nombre: "Llamarada",

                ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`🔥 ${atacante.pokemon.nombre} desata LLAMARADA!`);

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;

            let objetivoFinal = objetivo;
            if (!objetivoFinal || objetivoFinal.hp <= 0 || objetivoFinal.muerto) {
                if (typeof movEncontrarObjetivo === 'function') {
                    objetivoFinal = movEncontrarObjetivo(atacante, enemigosVivos, 'masCercano', 1);
                }
                if (!objetivoFinal) objetivoFinal = enemigosVivos[0];
            }
            if (!objetivoFinal) return false;

            if (typeof movObtenerPosicionGlobal !== 'function') return false;
            const posObjetivo = movObtenerPosicionGlobal(objetivoFinal);
            if (!posObjetivo) return false;

            // ============================================================
            // 🆕 ÁREA 3x3 ALREDEDOR DEL OBJETIVO
            // ============================================================
            const enemigosEnArea = [objetivoFinal];

            if (typeof movCasillasEnArea === 'function' && typeof movUnidadEnPosicion === 'function') {
                const casillasArea = movCasillasEnArea(posObjetivo, 1);
                for (let c of casillasArea) {
                    const u = movUnidadEnPosicion(c, enemigosVivos);
                    if (u && !enemigosEnArea.includes(u)) {
                        enemigosEnArea.push(u);
                    }
                }
            }

            // Daño: 200% del Ataque del atacante
            const dañoBase = (atacante.ataque || 0) * 2.00;
            const dañoFinal = Math.max(1, Math.floor(dañoBase));

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Llamarada', 0.5);
            }

            // Efecto visual en el atacante
            if (typeof movMostrarEfectoVisual === 'function') {
                setTimeout(() => {
                    movMostrarEfectoVisual(atacante, {
                        color: MOV_COLOR.ORANGE,
                        icono: 'mov:Llamarada',
                        intensidad: 'strong',
                        sizeIcono: 'large',
                        duracionMs: 900
                    });
                }, 100);
            }

            // Línea de proyectil hacia el objetivo principal
            if (typeof movMostrarLineaProyectil === 'function') {
                movMostrarLineaProyectil(atacante, objetivoFinal, 'rgba(251, 146, 60, 0.95)', 500);
            }

            // ============================================================
            // 🆕 MARCAR TODAS LAS CASILLAS DEL ÁREA CON FUEGO (4s)
            // ============================================================
            if (typeof movMarcarCasillaConTipo === 'function') {
                movMarcarCasillaConTipo(posObjetivo.fila, posObjetivo.col, 'Fuego', 4000);
                const casillasArea = movCasillasEnArea(posObjetivo, 1);
                for (let c of casillasArea) {
                    movMarcarCasillaConTipo(c.fila, c.col, 'Fuego', 4000);
                }
            }

            // ============================================================
            // 🆕 APLICAR DAÑO + ESCUDO ROTO A TODOS LOS ENEMIGOS DEL ÁREA
            // ============================================================
                           enemigosEnArea.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;

                                        // 🆕 FIX: marcar el estado en la unidad para que
                    // renderIconoLlamarada (render.js) pinte el icono
                    // en cada render durante 4s (sobrevive a renderizarCombate).
                    enemigo._iconoLlamaradaFin = performance.now() + 4000;

                    // Efecto visual de impacto inmediato (900ms)
                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(enemigo, {
                            color: MOV_COLOR.ORANGE,
                            icono: 'mov:Llamarada',
                            intensidad: 'strong',
                            sizeIcono: 'large',
                            duracionMs: 900
                        });
                    }

                    // Daño
                    if (typeof movAplicarDaño === 'function') {
                        movAplicarDaño(atacante, enemigo, dañoFinal, false);
                    }

                    // 🆕 ESCUDO ROTO: -30% Def y -30% Def.Esp durante 4s
                    if (enemigo.hp > 0 && !enemigo.muerto) {
                        if (typeof movAplicarReduccionDefensas === 'function') {
                            movAplicarReduccionDefensas(enemigo, 0.30, 4);
                        }

                        // Marcar flags para renderEscudoRoto
                        const duracionMs = 4000;
                        const ahora = performance.now();

                        enemigo._debuffDefFisica = true;
                        enemigo._debuffDefFisicaFin = ahora + duracionMs;
                        enemigo._debuffDefFisicaOriginal = enemigo.defensa || 0;

                        enemigo._debuffDefEsp = true;
                        enemigo._debuffDefEspFin = ahora + duracionMs;
                        enemigo._debuffDefEspOriginal = enemigo.defensaEspecial || 0;

                        enemigo._debuffDefensasFin = ahora + duracionMs;
                        enemigo._debuffDefensasPct = 0.30;
                        enemigo._debuffDefensasOriginal = {
                            def: enemigo.defensa || 0,
                            spDef: enemigo.defensaEspecial || 0
                        };

                        // Mostrar icono de escudo roto
                        if (typeof mostrarIconoEscudoRoto === 'function') {
                            mostrarIconoEscudoRoto(enemigo, 4, 'fisica');
                            mostrarIconoEscudoRoto(enemigo, 4, 'especial');
                        }
                    }
                }, idx * 100);
            });

                        // 🆕 Repintar para que se vean los iconos de escudo roto + Llamarada
            if (typeof renderizarCombate === 'function') {
                renderizarCombate();
            }

            // 🆕 Limpiar el icono de Llamarada a los 4s y repintar
            setTimeout(() => {
                enemigosEnArea.forEach(enemigo => {
                    if (!enemigo) return;
                    enemigo._iconoLlamaradaFin = 0;
                });
                if (typeof renderizarCombate === 'function') {
                    renderizarCombate();
                }
            }, 4000);

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ===== CRAMORANT =====
        "tragamisil": {
        nombre: "Tragamisil",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`🐦 ${atacante.pokemon.nombre} desata TRAGAMISIL!`);
            log(`   🍽️ Durante 4s: +175% daño Ataque Esp, rebote, +30% Vel. Ataque, +rango`);

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.CYAN,
                    icono: 'mov:Tragamisil',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 900
                });
            }

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Tragamisil', 0.5);
            }

            // ============================================================
            // 🎯 ÚNICA FASE: BUFF DE 4 SEGUNDOS
            // ============================================================
            // NO hay disparos automáticos. El buff hace que los ataques
            // básicos de Cramorant, durante 4 segundos:
            //   - Inflijan 175% de daño de Ataque Especial.
            //   - Reboten una vez a otro enemigo cercano.
            //   - Tengan +30% de Velocidad de Ataque.
            //   - Tengan alcance 8.
            // ============================================================
            const DURACION_MS = 4000;
            const bonusAttackSpeedOriginal = atacante.bonusAttackSpeed || 1;
            const tipoAtaqueOriginal = atacante.tipoAtaque || 'fisico';

            atacante.bonusAttackSpeed = bonusAttackSpeedOriginal * 1.30;
            atacante.tipoAtaque = 'especial';
            atacante.ultiTragamisilActiva = true;
            atacante.ultiTragamisilFin = performance.now() + DURACION_MS;
            atacante.ultiTragamisilDaño = 1.75;
            atacante.ultiTragamisilRango = 8;
            atacante.ultiTragamisilRebote = true;

            atacante.actualizarStats();

            // Restaurar el buff después de 4 segundos
            setTimeout(() => {
                if (!atacante) return;
                log(`🐦 Tragamisil de ${atacante.pokemon.nombre} termina`);
                atacante.bonusAttackSpeed = bonusAttackSpeedOriginal;
                atacante.tipoAtaque = tipoAtaqueOriginal;
                atacante.ultiTragamisilActiva = false;
                atacante.ultiTragamisilFin = 0;
                atacante.ultiTragamisilDaño = 1;
                atacante.ultiTragamisilRango = 0;
                atacante.ultiTragamisilRebote = false;
                atacante.actualizarStats();

                if (typeof movMostrarEfectoVisual === 'function') {
                    movMostrarEfectoVisual(atacante, {
                        color: MOV_COLOR.GRAY,
                        icono: 'mov:Tragamisil',
                        intensidad: 'soft',
                        sizeIcono: 'small',
                        duracionMs: 800
                    });
                }
            }, DURACION_MS);

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ===== DWEBLE / CRUSTLE =====
    "remolino-petreo": {
        nombre: "Remolino Pétreo",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`🪨 ${atacante.pokemon.nombre} desata REMOLINO PÉTREO!`);

            const bonusDefensaOriginal = atacante.bonusDefense || 0;
            const bonusDefEspOriginal = atacante.bonusSpDefense || 0;

            atacante.bonusDefense = bonusDefensaOriginal + 1500;
            atacante.bonusSpDefense = bonusDefEspOriginal + 1500;
            atacante.actualizarStats();

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.GRAY,
                    icono: 'mov:Remolino Pétreo',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 900
                });
            }

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Remolino Pétreo', 0.5);
            }

            if (typeof movObtenerPosicionGlobal !== 'function') return false;
            const posAtacante = movObtenerPosicionGlobal(atacante);
            if (!posAtacante) return false;

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            const enemigosEnArea = [];

            if (typeof movCasillasEnArea === 'function' && typeof movUnidadEnPosicion === 'function') {
                const casillasArea = movCasillasEnArea(posAtacante, 1);
                for (let c of casillasArea) {
                    const u = movUnidadEnPosicion(c, enemigosVivos);
                    if (u && !enemigosEnArea.includes(u)) {
                        enemigosEnArea.push(u);
                    }
                }
            }

            const dañoBase = (atacante.ataque || 0) * 0.36;
            const dañoFinal = Math.max(1, Math.floor(dañoBase));

            enemigosEnArea.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;

                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(enemigo, {
                            color: MOV_COLOR.GRAY,
                            icono: 'mov:Remolino Pétreo',
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

            setTimeout(() => {
                if (!atacante) return;
                if (atacante.hp > 0 && !atacante.muerto) {
                    atacante.bonusDefense = bonusDefensaOriginal;
                    atacante.bonusSpDefense = bonusDefEspOriginal;
                    atacante.actualizarStats();
                }
            }, 4000);

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ===== MACHOP / MACHOKE / MACHAMP =====
    "somanta-epica": {
        nombre: "Somanta Épica",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`👊 ${atacante.pokemon.nombre} desata SOMANTA ÉPICA!`);

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;

            let objetivoFinal = objetivo;
            if (!objetivoFinal || objetivoFinal.hp <= 0 || objetivoFinal.muerto) {
                if (typeof movEncontrarObjetivo === 'function') {
                    objetivoFinal = movEncontrarObjetivo(atacante, enemigosVivos, 'masCercano', 1);
                }
                if (!objetivoFinal) objetivoFinal = enemigosVivos[0];
            }
            if (!objetivoFinal) return false;

            const dañoBase = (atacante.ataque || 0) * 2.60;
            const dañoFinal = Math.max(1, Math.floor(dañoBase));

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Somanta Épica', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.RED,
                    icono: 'mov:Somanta Épica',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 900
                });
            }

            if (typeof movMostrarLineaProyectil === 'function') {
                movMostrarLineaProyectil(atacante, objetivoFinal, 'rgba(239, 68, 68, 0.95)', 400);
            }

            setTimeout(() => {
                if (objetivoFinal.hp <= 0 || objetivoFinal.muerto) return;

                if (typeof movMostrarEfectoVisual === 'function') {
                    movMostrarEfectoVisual(objetivoFinal, {
                        color: MOV_COLOR.RED,
                        icono: 'mov:Somanta Épica',
                        intensidad: 'strong',
                        sizeIcono: 'large',
                        duracionMs: 900
                    });
                }

                if (typeof movAplicarDaño === 'function') {
                    movAplicarDaño(atacante, objetivoFinal, dañoFinal, false);
                }

                if (objetivoFinal.hp > 0 && !objetivoFinal.muerto) {
                    if (typeof movAplicarSlow === 'function') {
                        movAplicarSlow(objetivoFinal, 0.95, 2, '(Somanta Épica)');
                    }
                }
            }, 100);

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ===== MARILL / AZUMARILL =====
    "acua-cola": {
        nombre: "Acua Cola",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`💧 ${atacante.pokemon.nombre} usa ACUA COLA!`);

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;

            let objetivoFinal = objetivo;
            if (!objetivoFinal || objetivoFinal.hp <= 0 || objetivoFinal.muerto) {
                if (typeof movEncontrarObjetivo === 'function') {
                    objetivoFinal = movEncontrarObjetivo(atacante, enemigosVivos, 'masCercano', 1);
                }
                if (!objetivoFinal) objetivoFinal = enemigosVivos[0];
            }
            if (!objetivoFinal) return false;

            const dañoGolpe = Math.max(1, Math.floor((atacante.ataque || 0) * 1.20));
            const curacionGolpe = Math.max(1, Math.floor((atacante.ataque || 0) * 0.75));

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Acua Cola', 0.5);
            }

            if (typeof movMostrarLineaProyectil === 'function') {
                movMostrarLineaProyectil(atacante, objetivoFinal, 'rgba(59, 130, 246, 0.95)', 400);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.BLUE,
                    icono: 'mov:Acua Cola',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 900
                });
            }

            const NUM_GOLPES = 3;
            let curacionTotal = 0;

            for (let i = 0; i < NUM_GOLPES; i++) {
                setTimeout(() => {
                    if (objetivoFinal.hp <= 0 || objetivoFinal.muerto) return;

                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(objetivoFinal, {
                            color: MOV_COLOR.BLUE,
                            icono: 'mov:Acua Cola',
                            intensidad: i === 0 ? 'strong' : 'soft',
                            sizeIcono: i === 0 ? 'large' : 'small',
                            duracionMs: 600
                        });
                    }

                    if (typeof movAplicarDaño === 'function') {
                        movAplicarDaño(atacante, objetivoFinal, dañoGolpe, false);
                    }

                    if (atacante.hp > 0 && !atacante.muerto) {
                        atacante.hp = Math.min(atacante.maxHp, atacante.hp + curacionGolpe);
                        atacante.healingDone = (atacante.healingDone || 0) + curacionGolpe;
                        curacionTotal += curacionGolpe;
                        if (typeof actualizarCopiaEstadisticas === 'function') {
                            actualizarCopiaEstadisticas(atacante, 'healingDone', curacionGolpe);
                        }
                        const posAtk = obtenerPosicionUnidadActual(atacante);
                        if (posAtk && posAtk.elemento && typeof actualizarBarraVidaPokemon === 'function') {
                            actualizarBarraVidaPokemon(posAtk.elemento, atacante.hp, atacante.maxHp);
                        }
                    }
                }, i * 200);
            }

            setTimeout(() => {
                log(`   💚 Curación total: ${curacionTotal} HP`);
            }, NUM_GOLPES * 200 + 50);

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ===== PHANTUMP / TREVENANT =====
    "bosquridad-espectral": {
        nombre: "Bosquridad Espectral",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`👻 ${atacante.pokemon.nombre} desata BOSQURIDAD ESPECTRAL!`);

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;

            let objetivoFinal = objetivo;
            if (!objetivoFinal || objetivoFinal.hp <= 0 || objetivoFinal.muerto) {
                if (typeof movEncontrarObjetivo === 'function') {
                    objetivoFinal = movEncontrarObjetivo(atacante, enemigosVivos, 'masCercano', 1);
                }
                if (!objetivoFinal) objetivoFinal = enemigosVivos[0];
            }
            if (!objetivoFinal) return false;

            if (typeof movObtenerPosicionGlobal !== 'function') return false;
            const posObjetivo = movObtenerPosicionGlobal(objetivoFinal);
            if (!posObjetivo) return false;

            const enemigosEnArea = [objetivoFinal];
            if (typeof movCasillasEnArea === 'function' && typeof movUnidadEnPosicion === 'function') {
                const casillas = movCasillasEnArea(posObjetivo, 1);
                for (let c of casillas) {
                    const u = movUnidadEnPosicion(c, enemigosVivos);
                    if (u && !enemigosEnArea.includes(u)) enemigosEnArea.push(u);
                }
            }

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Bosquridad Espectral', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.PURPLE,
                    icono: 'mov:Bosquridad Espectral',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 900
                });
            }

            const enemigosGolpeados = enemigosEnArea.length;
const escudo = Math.floor((atacante.ataque || 0) * 1.80 * Math.max(1, enemigosGolpeados));
if (escudo > 0) {
    aplicarEscudoConFade(atacante, escudo);
}

            const posAtk = obtenerPosicionUnidadActual(atacante);
            if (posAtk && posAtk.elemento && typeof actualizarBarraVidaPokemon === 'function') {
                actualizarBarraVidaPokemon(posAtk.elemento, atacante.hp, atacante.maxHp);
            }

            const dañoBase = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 0.80));

            enemigosEnArea.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;

                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(enemigo, {
                            color: MOV_COLOR.PURPLE,
                            icono: 'mov:Bosquridad Espectral',
                            intensidad: 'strong',
                            sizeIcono: 'large',
                            duracionMs: 900
                        });
                    }

                    if (typeof movAplicarDaño === 'function') {
                        movAplicarDaño(atacante, enemigo, dañoBase, false);
                    }

                    if (enemigo.hp > 0 && !enemigo.muerto) {
                        enemigo.bonusDefense = (enemigo.bonusDefense || 0) - 100;
                        enemigo.bonusSpDefense = (enemigo.bonusSpDefense || 0) - 100;
                        enemigo.actualizarStats();
                        setTimeout(() => {
                            if (enemigo.hp <= 0 || enemigo.muerto) return;
                            enemigo.bonusDefense = (enemigo.bonusDefense || 0) + 100;
                            enemigo.bonusSpDefense = (enemigo.bonusSpDefense || 0) + 100;
                            enemigo.actualizarStats();
                        }, 4000);
                    }
                }, idx * 100);
            });

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ===== PIKACHU =====
    "trueno": {
        nombre: "Trueno",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`⚡ ${atacante.pokemon.nombre} desata TRUENO!`);

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

            if (typeof movObtenerPosicionGlobal !== 'function') return false;
            const posObjetivo = movObtenerPosicionGlobal(objetivoFinal);
            if (!posObjetivo) return false;

            const enemigosEnArea = [objetivoFinal];
            if (typeof movCasillasEnArea === 'function' && typeof movUnidadEnPosicion === 'function') {
                const casillas = movCasillasEnArea(posObjetivo, 1);
                for (let c of casillas) {
                    const u = movUnidadEnPosicion(c, enemigosVivos);
                    if (u && !enemigosEnArea.includes(u)) enemigosEnArea.push(u);
                }
            }

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Trueno', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.YELLOW,
                    icono: 'mov:Trueno',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 900
                });
            }

            if (typeof movMostrarLineaProyectil === 'function') {
                movMostrarLineaProyectil(atacante, objetivoFinal, 'rgba(250, 204, 21, 0.95)', 500);
            }

            const dañoBase = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 1.10));
            const NUM_GOLPES = 4;

            for (let i = 0; i < NUM_GOLPES; i++) {
                setTimeout(() => {
                    enemigosEnArea.forEach((enemigo, idx) => {
                        if (enemigo.hp <= 0 || enemigo.muerto) return;
                        setTimeout(() => {
                            if (enemigo.hp <= 0 || enemigo.muerto) return;

                            if (typeof movMostrarEfectoVisual === 'function') {
                                movMostrarEfectoVisual(enemigo, {
                                    color: MOV_COLOR.YELLOW,
                                    icono: 'mov:Trueno',
                                    intensidad: i === 0 ? 'strong' : 'soft',
                                    sizeIcono: i === 0 ? 'large' : 'small',
                                    duracionMs: 600
                                });
                            }

                            if (typeof movAplicarDaño === 'function') {
                                movAplicarDaño(atacante, enemigo, dañoBase, false);
                            }
                        }, idx * 80);
                    });
                }, i * 200);
            }

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ===== RALTS / KIRLIA / GARDEVOIR =====
    "psicocarga": {
        nombre: "Psicocarga",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`🔮 ${atacante.pokemon.nombre} usa PSICOCARGA!`);

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Psicocarga', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.PURPLE,
                    icono: 'mov:Psicocarga',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 900
                });
            }

            const dañoBase = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 2.35));
            const NUM_BOMBAS = 3;

            for (let i = 0; i < NUM_BOMBAS; i++) {
                setTimeout(() => {
                    const enemigosActuales = enemigosVivos.filter(e => e.hp > 0 && !e.muerto);
                    if (enemigosActuales.length === 0) return;

                    const objetivoBomba = enemigosActuales[Math.floor(Math.random() * enemigosActuales.length)];

                    if (typeof movMostrarLineaProyectil === 'function') {
                        movMostrarLineaProyectil(atacante, objetivoBomba, 'rgba(168, 85, 247, 0.95)', 400);
                    }

                    const posBomba = movObtenerPosicionGlobal(objetivoBomba);
                    const enemigosEnArea = [objetivoBomba];
                    if (posBomba && typeof movCasillasEnArea === 'function' && typeof movUnidadEnPosicion === 'function') {
                        const casillas = movCasillasEnArea(posBomba, 1);
                        for (let c of casillas) {
                            const u = movUnidadEnPosicion(c, enemigosActuales);
                            if (u && !enemigosEnArea.includes(u)) enemigosEnArea.push(u);
                        }
                    }

                    enemigosEnArea.forEach((enemigo, idx) => {
                        setTimeout(() => {
                            if (enemigo.hp <= 0 || enemigo.muerto) return;

                            if (typeof movMostrarEfectoVisual === 'function') {
                                movMostrarEfectoVisual(enemigo, {
                                    color: MOV_COLOR.PURPLE,
                                    icono: 'mov:Psicocarga',
                                    intensidad: 'strong',
                                    sizeIcono: 'large',
                                    duracionMs: 700
                                });
                            }

                            if (typeof movAplicarDaño === 'function') {
                                movAplicarDaño(atacante, enemigo, dañoBase, false);
                            }

                            if (enemigo.hp > 0 && !enemigo.muerto) {
                                enemigo.energy = Math.max(0, (enemigo.energy || 0) - 4);
                            }
                        }, idx * 80);
                    });
                }, i * 300);
            }

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ===== SWINUB / PILOSWINE / MAMOSWINE =====
        "planca-corpulenta": {
        nombre: "Planca Corpulenta",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`❄️ ${atacante.pokemon.nombre} usa PLACA CORPULENTA!`);

            if (typeof movObtenerPosicionGlobal !== 'function') return false;
            const posAtacante = movObtenerPosicionGlobal(atacante);
            if (!posAtacante) return false;

            const escudo = Math.floor((atacante.maxHp || 0) * 0.36);
if (escudo > 0) {
    aplicarEscudoConFade(atacante, escudo);
}

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Planca Corpulenta', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.GRAY,
                    icono: 'mov:Planca Corpulenta',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 900
                });
            }

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;

            // 🆕 Buscar el enemigo MÁS CERCANO al atacante
            let enemigoCercano = null;
            let distMin = Infinity;
            for (let e of enemigosVivos) {
                const pe = movObtenerPosicionGlobal(e);
                if (!pe) continue;
                const d = Math.max(Math.abs(pe.fila - posAtacante.fila), Math.abs(pe.col - posAtacante.col));
                if (d < distMin) { distMin = d; enemigoCercano = e; }
            }
            if (!enemigoCercano) return false;

            const posObjetivo = movObtenerPosicionGlobal(enemigoCercano);

            // 🆕 Área 2 alrededor del OBJETIVO (no del atacante)
            const enemigosEnArea = [enemigoCercano];
            if (posObjetivo && typeof movCasillasEnArea === 'function' && typeof movUnidadEnPosicion === 'function') {
                const casillas = movCasillasEnArea(posObjetivo, 2);
                for (let c of casillas) {
                    const u = movUnidadEnPosicion(c, enemigosVivos);
                    if (u && !enemigosEnArea.includes(u)) enemigosEnArea.push(u);
                }
            }

            // 🆕 Daño basado en HP máximo del ATACANTE (más relevante que el ataque)
            const dañoBase = Math.max(1, Math.floor((atacante.maxHp || 0) * 0.08));

            log(`   🎯 Enemigos afectados: ${enemigosEnArea.length} | Daño: ${dañoBase}`);

            enemigosEnArea.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;

                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(enemigo, {
                            color: MOV_COLOR.GRAY,
                            icono: 'mov:Planca Corpulenta',
                            intensidad: 'strong',
                            sizeIcono: 'large',
                            duracionMs: 900
                        });
                    }

                    if (typeof movAplicarDaño === 'function') {
                        movAplicarDaño(atacante, enemigo, dañoBase, false);
                    }

                    if (enemigo.hp > 0 && !enemigo.muerto) {
                        if (!enemigo.inmuneImpedimentos && typeof movKnockup === 'function') {
                            movKnockup(enemigo, 1.5);
                        }
                    }
                }, idx * 100);
            });

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ===== ZORUA / ZOROARK =====
    "pulso-medianoche": {
        nombre: "Pulso Medianoche",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`🌙 ${atacante.pokemon.nombre} usa PULSO MEDIANOCHE!`);

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

            if (enemigosEnArea.length === 0) {
                let objetivoFinal = objetivo;
                if (!objetivoFinal || objetivoFinal.hp <= 0 || objetivoFinal.muerto) {
                    if (typeof movEncontrarObjetivo === 'function') {
                        objetivoFinal = movEncontrarObjetivo(atacante, enemigosVivos, 'masCercano', 1);
                    }
                    if (!objetivoFinal) objetivoFinal = enemigosVivos[0];
                }
                if (objetivoFinal) enemigosEnArea.push(objetivoFinal);
            }

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Pulso Medianoche', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.GRAY,
                    icono: 'mov:Pulso Medianoche',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 900
                });
            }

            const dañoBase = Math.max(1, Math.floor((atacante.ataque || 0) * 1.45));
            const NUM_GOLPES = 3;

            for (let i = 0; i < NUM_GOLPES; i++) {
                setTimeout(() => {
                    enemigosEnArea.forEach((enemigo, idx) => {
                        if (enemigo.hp <= 0 || enemigo.muerto) return;
                        setTimeout(() => {
                            if (enemigo.hp <= 0 || enemigo.muerto) return;

                            if (typeof movMostrarEfectoVisual === 'function') {
                                movMostrarEfectoVisual(enemigo, {
                                    color: MOV_COLOR.GRAY,
                                    icono: 'mov:Pulso Medianoche',
                                    intensidad: i === 0 ? 'strong' : 'soft',
                                    sizeIcono: i === 0 ? 'large' : 'small',
                                    duracionMs: 600
                                });
                            }

                            if (typeof movAplicarDaño === 'function') {
                                movAplicarDaño(atacante, enemigo, dañoBase, false);
                            }
                        }, idx * 80);
                    });
                }, i * 200);
            }

            const curacion = Math.floor((atacante.ataque || 0) * 6.50);
            setTimeout(() => {
                if (atacante.hp > 0 && !atacante.muerto) {
                    atacante.hp = Math.min(atacante.maxHp, atacante.hp + curacion);
                    atacante.healingDone = (atacante.healingDone || 0) + curacion;
                    if (typeof actualizarCopiaEstadisticas === 'function') {
                        actualizarCopiaEstadisticas(atacante, 'healingDone', curacion);
                    }
                    const posAtk2 = obtenerPosicionUnidadActual(atacante);
                    if (posAtk2 && posAtk2.elemento && typeof actualizarBarraVidaPokemon === 'function') {
                        actualizarBarraVidaPokemon(posAtk2.elemento, atacante.hp, atacante.maxHp);
                    }
                }
            }, NUM_GOLPES * 200 + 100);

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ============================================================
    // ===== COSTE 2 =====
    // ============================================================

    // ===== ARBOK - DESLUMBRAR =====
    "deslumbrar": {
        nombre: "Deslumbrar",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`🐍 ${atacante.pokemon.nombre} desata DESLUMBRAR!`);

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;

            const drOriginal = atacante.bonusDamageReduction || 1;
            atacante.bonusDamageReduction = drOriginal * 0.50;
            atacante.actualizarStats();
            log(`   🛡️ Reducción de daño +50% durante el uso`);

            if (typeof movObtenerPosicionGlobal !== 'function') return false;
            const posAtk = movObtenerPosicionGlobal(atacante);
            if (!posAtk) return false;

            const objetivos = [];
            for (let enemigo of enemigosVivos) {
                const posE = movObtenerPosicionGlobal(enemigo);
                if (!posE) continue;
                const dFila = posE.fila - posAtk.fila;
                const dCol = posE.col - posAtk.col;
                const dist = Math.abs(dFila) + Math.abs(dCol);
                if (dist > 3) continue;
                objetivos.push(enemigo);
            }

            if (objetivos.length === 0) {
                log(`   ⚠️ No hay enemigos en el cono frontal`);
                setTimeout(() => {
                    if (atacante.hp > 0 && !atacante.muerto) {
                        atacante.bonusDamageReduction = drOriginal;
                        atacante.actualizarStats();
                    }
                }, 1000);
                atacante.ultiCarga = 0;
                atacante.ultiLista = false;
                return true;
            }

            log(`   🎯 Enemigos afectados: ${objetivos.length}`);

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Deslumbrar', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.PURPLE,
                    icono: 'mov:Deslumbrar',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 900
                });
            }

            objetivos.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;

                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(enemigo, {
                            color: MOV_COLOR.PURPLE,
                            icono: 'mov:Deslumbrar',
                            intensidad: 'strong',
                            sizeIcono: 'large',
                            duracionMs: 900
                        });
                    }

                    if (typeof movAplicarSlow === 'function') {
                        movAplicarSlow(enemigo, 0.95, 1, '(Inmovilizado por Deslumbrar)');
                    }

                    const atkOrig = enemigo.bonusAttack || 1;
                    const spAtkOrig = enemigo.bonusSpAttack || 1;
                    enemigo.bonusAttack = atkOrig * 0.60;
                    enemigo.bonusSpAttack = spAtkOrig * 0.60;
                    enemigo.actualizarStats();
                    setTimeout(() => {
                        if (enemigo.hp <= 0 || enemigo.muerto) return;
                        enemigo.bonusAttack = atkOrig;
                        enemigo.bonusSpAttack = spAtkOrig;
                        enemigo.actualizarStats();
                    }, 5000);

                    log(`   🔻 ${enemigo.pokemon.nombre} inmovilizado y -40% Atk/AtkEsp durante 5s`);
                }, idx * 100);
            });

            setTimeout(() => {
                if (atacante.hp > 0 && !atacante.muerto) {
                    atacante.bonusDamageReduction = drOriginal;
                    atacante.actualizarStats();
                }
            }, 1000);

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ===== CERULEDGE - ESPADAZO ESPECTRAL =====
    "espadazo-espectral": {
        nombre: "Espadazo Espectral",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`⚔️ ${atacante.pokemon.nombre} desata ESPADAZO ESPECTRAL!`);

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;

            let objetivoFinal = objetivo;
            if (!objetivoFinal || objetivoFinal.hp <= 0 || objetivoFinal.muerto) {
                if (typeof movEncontrarObjetivo === 'function') {
                    objetivoFinal = movEncontrarObjetivo(atacante, enemigosVivos, 'masCercano', 3);
                }
                if (!objetivoFinal) objetivoFinal = enemigosVivos[0];
            }
            if (!objetivoFinal) return false;

            const dañoBase = (atacante.ataque || 0) * 3.00;
            const dañoFinal = Math.max(1, Math.floor(dañoBase));

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Espadazo Espectral', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.PURPLE,
                    icono: 'mov:Espadazo Espectral',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 900
                });
            }

            if (typeof movMostrarLineaProyectil === 'function') {
                movMostrarLineaProyectil(atacante, objetivoFinal, 'rgba(168, 85, 247, 0.95)', 450);
            }

            const posObjetivo = movObtenerPosicionGlobal(objetivoFinal);
            if (posObjetivo) {
                const candidatas = [
                    { fila: posObjetivo.fila - 1, col: posObjetivo.col },
                    { fila: posObjetivo.fila + 1, col: posObjetivo.col },
                    { fila: posObjetivo.fila, col: posObjetivo.col - 1 },
                    { fila: posObjetivo.fila, col: posObjetivo.col + 1 }
                ];
                for (let c of candidatas) {
                    if (c.fila < 0 || c.fila > 3 || c.col < 0 || c.col > 3) continue;
                    if (typeof movSetPosicionGlobal === 'function') {
                        movSetPosicionGlobal(atacante, c.fila, c.col);
                        if (typeof renderizarCombate === 'function') renderizarCombate();
                        break;
                    }
                }
            }

            setTimeout(() => {
                if (objetivoFinal.hp <= 0 || objetivoFinal.muerto) return;

                if (typeof movMostrarEfectoVisual === 'function') {
                    movMostrarEfectoVisual(objetivoFinal, {
                        color: MOV_COLOR.PURPLE,
                        icono: 'mov:Espadazo Espectral',
                        intensidad: 'strong',
                        sizeIcono: 'large',
                        duracionMs: 900
                    });
                }

                if (typeof movAplicarDaño === 'function') {
                    movAplicarDaño(atacante, objetivoFinal, dañoFinal, false);
                }

                if (objetivoFinal.hp > 0 && !objetivoFinal.muerto) {
                    if (typeof movAplicarSlow === 'function') {
                        movAplicarSlow(objetivoFinal, 0.95, 1, '(Inmovilizado por Espadazo Espectral)');
                    }
                }
            }, 300);

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ===== FAMILIA CUBCHOO - PAISAJE NEVADO =====
    "paisaje-nevado": {
        nombre: "Paisaje Nevado",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`❄️ ${atacante.pokemon.nombre} activa PAISAJE NEVADO!`);

            const aliadosVivos = (contexto.aliados || []).filter(a => a && a.hp > 0 && !a.muerto);

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Paisaje Nevado', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.CYAN,
                    icono: 'mov:Paisaje Nevado',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 1200
                });
            }

            const escudoBase = Math.floor((atacante.maxHp || 0) * 0.05);

            aliadosVivos.forEach((aliado, idx) => {
                setTimeout(() => {
                    if (aliado.hp <= 0 || aliado.muerto) return;

                    aliado.bonusDefense = (aliado.bonusDefense || 0) + 100;
aliado.bonusSpDefense = (aliado.bonusSpDefense || 0) + 100;
if (escudoBase > 0) {
    aplicarEscudoConFade(aliado, escudoBase);
}
aliado._paisajeNevadoActivo = true;
                    aliado._paisajeNevadoEscudoExtra = Math.floor((atacante.maxHp || 0) * 0.009);
                    aliado._paisajeNevadoFuente = atacante;
                    aliado.actualizarStats();

                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(aliado, {
                            color: MOV_COLOR.CYAN,
                            icono: 'mov:Paisaje Nevado',
                            intensidad: 'soft',
                            sizeIcono: 'small',
                            duracionMs: 900
                        });
                    }
                }, idx * 100);
            });

            log(`   🛡️ +100 Def/DefEsp y escudo a ${aliadosVivos.length} aliados`);

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ===== FAMILIA FENNEKIN - LLAMARADA FENNEKIN =====
    "llamarada-fennekin": {
        nombre: "Llamarada",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`🔥 ${atacante.pokemon.nombre} desata LLAMARADA!`);

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

            if (typeof movObtenerPosicionGlobal !== 'function') return false;
            const posAtk = movObtenerPosicionGlobal(atacante);
            const posObj = movObtenerPosicionGlobal(objetivoFinal);
            if (!posAtk || !posObj) return false;

            const dFila = posObj.fila - posAtk.fila;
            const dCol = posObj.col - posAtk.col;
            let dir = null;
            if (Math.abs(dFila) >= Math.abs(dCol)) {
                dir = dFila < 0 ? 'arriba' : 'abajo';
            } else {
                dir = dCol < 0 ? 'izquierda' : 'derecha';
            }

            const casillasTrayectoria = movCasillasEnLinea(posAtk, dir, 4);
            const enemigosGolpeados = [];

            for (let c of casillasTrayectoria) {
                const u = movUnidadEnPosicion(c, enemigosVivos);
                if (u && !enemigosGolpeados.includes(u)) enemigosGolpeados.push(u);
            }

            if (enemigosGolpeados.length === 0) {
                enemigosGolpeados.push(objetivoFinal);
            }

            const dañoBase = (atacante.ataqueEspecial || 0) * 2.46;
            const dañoFinal = Math.max(1, Math.floor(dañoBase));

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Llamarada', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.ORANGE,
                    icono: 'mov:Llamarada',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 900
                });
            }

            if (typeof movMostrarLineaProyectil === 'function') {
                movMostrarLineaProyectil(atacante, objetivoFinal, 'rgba(251, 146, 60, 0.95)', 500);
            }

            enemigosGolpeados.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;

                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(enemigo, {
                            color: MOV_COLOR.ORANGE,
                            icono: 'mov:Llamarada',
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

            setTimeout(() => {
                const posExplosion = movObtenerPosicionGlobal(objetivoFinal);
                if (!posExplosion) return;

                const enemigosEnArea = [objetivoFinal];
                if (typeof movCasillasEnArea === 'function' && typeof movUnidadEnPosicion === 'function') {
                    const casillas = movCasillasEnArea(posExplosion, 1);
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
                                color: MOV_COLOR.ORANGE,
                                icono: 'mov:Llamarada',
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
            }, enemigosGolpeados.length * 100 + 400);

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ===== LEAFEON - CUCHILLA SOLAR =====
    "cuchilla-solar": {
        nombre: "Cuchilla Solar",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`🍃 ${atacante.pokemon.nombre} desata CUCHILLA SOLAR!`);

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;

            let objetivoFinal = objetivo;
            if (!objetivoFinal || objetivoFinal.hp <= 0 || objetivoFinal.muerto) {
                if (typeof movEncontrarObjetivo === 'function') {
                    objetivoFinal = movEncontrarObjetivo(atacante, enemigosVivos, 'masCercano', 1);
                }
                if (!objetivoFinal) objetivoFinal = enemigosVivos[0];
            }
            if (!objetivoFinal) return false;

            const dañoBase = (atacante.ataque || 0) * 3.56;
            const dañoFinal = Math.max(1, Math.floor(dañoBase));

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Cuchilla Solar', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.GREEN,
                    icono: 'mov:Cuchilla Solar',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 900
                });
            }

            if (typeof movMostrarLineaProyectil === 'function') {
                movMostrarLineaProyectil(atacante, objetivoFinal, 'rgba(74, 222, 128, 0.95)', 450);
            }

            setTimeout(() => {
                if (objetivoFinal.hp <= 0 || objetivoFinal.muerto) return;

                if (typeof movMostrarEfectoVisual === 'function') {
                    movMostrarEfectoVisual(objetivoFinal, {
                        color: MOV_COLOR.GREEN,
                        icono: 'mov:Cuchilla Solar',
                        intensidad: 'strong',
                        sizeIcono: 'large',
                        duracionMs: 900
                    });
                }

                const hpAntes = objetivoFinal.hp;
                if (typeof movAplicarDaño === 'function') {
                    movAplicarDaño(atacante, objetivoFinal, dañoFinal, false);
                }

                const murio = (objetivoFinal.hp <= 0 && hpAntes > 0);
                if (murio && atacante.hp > 0 && !atacante.muerto) {
                    const curacion = Math.floor((atacante.maxHp || 0) * 0.552);
                    if (typeof movCurar === 'function') {
                        movCurar(atacante, curacion);
                    } else {
                        atacante.hp = Math.min(atacante.maxHp, atacante.hp + curacion);
                    }
                }
            }, 300);

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ===== LUCARIO - ATAQUE ÓSEO =====
    "ataque-oseo": {
        nombre: "Ataque Óseo",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`🦴 ${atacante.pokemon.nombre} desata ATAQUE ÓSEO!`);

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;

            let objetivoFinal = objetivo;
            if (!objetivoFinal || objetivoFinal.hp <= 0 || objetivoFinal.muerto) {
                if (typeof movEncontrarObjetivo === 'function') {
                    objetivoFinal = movEncontrarObjetivo(atacante, enemigosVivos, 'masCercano', 1);
                }
                if (!objetivoFinal) objetivoFinal = enemigosVivos[0];
            }
            if (!objetivoFinal) return false;

            const dañoBase = Math.max(1, Math.floor((atacante.ataque || 0) * 1.15));

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Ataque Óseo', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.WHITE,
                    icono: 'mov:Ataque Óseo',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 900
                });
            }

            const NUM_GOLPES = 4;
            for (let i = 0; i < NUM_GOLPES; i++) {
                setTimeout(() => {
                    if (objetivoFinal.hp <= 0 || objetivoFinal.muerto) return;

                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(objetivoFinal, {
                            color: MOV_COLOR.WHITE,
                            icono: 'mov:Ataque Óseo',
                            intensidad: i === 0 ? 'strong' : 'soft',
                            sizeIcono: i === 0 ? 'large' : 'small',
                            duracionMs: 500
                        });
                    }

                    if (typeof movAplicarDaño === 'function') {
                        movAplicarDaño(atacante, objetivoFinal, dañoBase, false);
                    }
                }, i * 200);
            }

            setTimeout(() => {
                if (objetivoFinal.hp <= 0 || objetivoFinal.muerto) return;

                const posObj = movObtenerPosicionGlobal(objetivoFinal);
                if (posObj) {
                    const candidatas = [
                        { fila: posObj.fila - 1, col: posObj.col },
                        { fila: posObj.fila + 1, col: posObj.col },
                        { fila: posObj.fila, col: posObj.col - 1 },
                        { fila: posObj.fila, col: posObj.col + 1 }
                    ];

                    // 🆕 Comprobar que la casilla esté LIBRE antes de teletransportar
                    function casillaLibreAtaqueOseo(f, c) {
                        // Fuera del tablero global (0..7 cols, 0..4 filas)
                        if (f < 0 || f > 4 || c < 0 || c > 7) return false;

                        // Comprobar contra aliados
                        const aliados = contexto.aliados || [];
                        for (let a of aliados) {
                            if (!a || a === atacante || a.hp <= 0 || a.muerto) continue;
                            const pa = movObtenerPosicionGlobal(a);
                            if (pa && pa.fila === f && pa.col === c) return false;
                        }

                        // Comprobar contra enemigos
                        const enemigos = contexto.enemigos || [];
                        for (let e of enemigos) {
                            if (!e || e === objetivoFinal || e.hp <= 0 || e.muerto) continue;
                            const pe = movObtenerPosicionGlobal(e);
                            if (pe && pe.fila === f && pe.col === c) return false;
                        }

                        return true;
                    }

                    let destinoAtaqueOseo = null;
                    for (let c of candidatas) {
                        if (casillaLibreAtaqueOseo(c.fila, c.col)) {
                            destinoAtaqueOseo = c;
                            break;
                        }
                    }

                    // Fallback: buscar en radio 2 si no hay adyacente libre
                    if (!destinoAtaqueOseo) {
                        for (let r = 2; r <= 3 && !destinoAtaqueOseo; r++) {
                            for (let df = -r; df <= r && !destinoAtaqueOseo; df++) {
                                for (let dc = -r; dc <= r && !destinoAtaqueOseo; dc++) {
                                    if (Math.max(Math.abs(df), Math.abs(dc)) !== r) continue;
                                    const f = posObj.fila + df;
                                    const c = posObj.col + dc;
                                    if (casillaLibreAtaqueOseo(f, c)) {
                                        destinoAtaqueOseo = { fila: f, col: c };
                                    }
                                }
                            }
                        }
                    }

                    if (destinoAtaqueOseo && typeof movSetPosicionGlobal === 'function') {
                        movSetPosicionGlobal(atacante, destinoAtaqueOseo.fila, destinoAtaqueOseo.col);
                        if (typeof renderizarCombate === 'function') renderizarCombate();
                    }
                    // Si no encuentra casilla, Lucario ataca desde donde está (no se mueve)

                    const enemigosCerca = [objetivoFinal];
                    if (typeof movCasillasEnArea === 'function' && typeof movUnidadEnPosicion === 'function') {
                        const casillas = movCasillasEnArea(posObj, 1);
                        for (let c of casillas) {
                            const u = movUnidadEnPosicion(c, enemigosVivos);
                            if (u && !enemigosCerca.includes(u)) enemigosCerca.push(u);
                        }
                    }

                    enemigosCerca.forEach((enemigo, idx) => {
                        setTimeout(() => {
                            if (enemigo.hp <= 0 || enemigo.muerto) return;

                            if (typeof movMostrarEfectoVisual === 'function') {
                                movMostrarEfectoVisual(enemigo, {
                                    color: MOV_COLOR.WHITE,
                                    icono: 'mov:Ataque Óseo',
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
                }
            }, NUM_GOLPES * 200 + 200);

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ===== MR. MIME - PASEN Y VEAN =====
    "pasen-y-vean": {
        nombre: "Pasen y Vean",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`🎭 ${atacante.pokemon.nombre} usa PASEN Y VEAN!`);

            if (typeof movObtenerPosicionGlobal !== 'function') return false;
            const posAtk = movObtenerPosicionGlobal(atacante);
            if (!posAtk) return false;

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            const enemigosEnArea = [];

            if (typeof movCasillasEnArea === 'function' && typeof movUnidadEnPosicion === 'function') {
                const casillas = movCasillasEnArea(posAtk, 1);
                for (let c of casillas) {
                    const u = movUnidadEnPosicion(c, enemigosVivos);
                    if (u && !enemigosEnArea.includes(u)) enemigosEnArea.push(u);
                }
            }

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Pasen y Vean', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.PURPLE,
                    icono: 'mov:Pasen y Vean',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 900
                });
            }

            const dañoBase = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 3.45));

            enemigosEnArea.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;

                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(enemigo, {
                            color: MOV_COLOR.PURPLE,
                            icono: 'mov:Pasen y Vean',
                            intensidad: 'strong',
                            sizeIcono: 'large',
                            duracionMs: 900
                        });
                    }

                    if (typeof movAplicarDaño === 'function') {
                        movAplicarDaño(atacante, enemigo, dañoBase, false);
                    }

                    if (enemigo.hp > 0 && !enemigo.muerto) {
                        if (typeof movAplicarSlow === 'function') {
                            movAplicarSlow(enemigo, 0.30, 3, '(Pasen y Vean)');
                        }
                        enemigo.taunt = { atacante: atacante, duracion: 3, timer: 0 };
                    }
                }, idx * 100);
            });

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ===== FAMILIA ROWLET - HOJA AFILADA (MODO METRALLETA) =====
    "hoja-afilada-rowlet": {
        nombre: "Hoja Afilada",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`🍃 ${atacante.pokemon.nombre} desata HOJA AFILADA!`);

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;

            const velOriginal = atacante.bonusAttackSpeed || 1;
            atacante.bonusAttackSpeed = velOriginal * 1.20;
            atacante.actualizarStats();

            log(`   ⚡ +20% Vel Ataque durante 8s`);

            const DURACION_MS = 8000;
            const INTERVALO_MS = 400;
            const DAÑO_POR_HOJA = 0.40;

            if (atacante._hojaAfiladaIntervalId) {
                clearInterval(atacante._hojaAfiladaIntervalId);
                atacante._hojaAfiladaIntervalId = null;
            }

            atacante._hojaAfiladaActiva = true;
            atacante._hojaAfiladaFin = performance.now() + DURACION_MS;

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Hoja Afilada', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.GREEN,
                    icono: 'mov:Hoja Afilada 2',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 900
                });
            }

            let hojasDisparadas = 0;

            const intervalId = setInterval(() => {
                if (!atacante || atacante.hp <= 0 || atacante.muerto) {
                    clearInterval(intervalId);
                    atacante._hojaAfiladaActiva = false;
                    return;
                }

                if (performance.now() >= atacante._hojaAfiladaFin) {
                    clearInterval(intervalId);
                    atacante._hojaAfiladaActiva = false;
                    atacante._hojaAfiladaFin = 0;
                    log(`🍃 Hoja Afilada termina (${hojasDisparadas} hojas disparadas)`);
                    return;
                }

                const enemigosActuales = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
                if (enemigosActuales.length === 0) return;

                const enemigoObjetivo = enemigosActuales[Math.floor(Math.random() * enemigosActuales.length)];
                if (!enemigoObjetivo) return;

                const dañoHoja = Math.max(1, Math.floor((atacante.ataque || 0) * DAÑO_POR_HOJA));

                if (typeof movMostrarLineaProyectil === 'function') {
                    movMostrarLineaProyectil(atacante, enemigoObjetivo, 'rgba(74, 222, 128, 0.9)', 300);
                }

                if (typeof movMostrarEfectoVisual === 'function') {
                    movMostrarEfectoVisual(enemigoObjetivo, {
                        color: MOV_COLOR.GREEN,
                        icono: 'mov:Hoja Afilada 2',
                        intensidad: 'soft',
                        sizeIcono: 'small',
                        duracionMs: 400
                    });
                }

                if (typeof movAplicarDaño === 'function') {
                    movAplicarDaño(atacante, enemigoObjetivo, dañoHoja, false);
                }

                hojasDisparadas++;

            }, INTERVALO_MS);

            atacante._hojaAfiladaIntervalId = intervalId;

            setTimeout(() => {
                if (!atacante) return;
                atacante.bonusAttackSpeed = velOriginal;
                atacante.actualizarStats();
                atacante._hojaAfiladaActiva = false;
                atacante._hojaAfiladaFin = 0;
            }, DURACION_MS);

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ===== FAMILIA SCORBUNNY - AMAGO =====
    "amago": {
        nombre: "Amago",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`🔥 ${atacante.pokemon.nombre} usa AMAGO!`);

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

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Amago', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.ORANGE,
                    icono: 'mov:Amago',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 900
                });
            }

            const velOriginal = atacante.bonusAttackSpeed || 1;
            atacante.bonusAttackSpeed = velOriginal * 1.30;
            atacante.actualizarStats();

            setTimeout(() => {
                if (atacante.hp <= 0 || atacante.muerto) return;
                atacante.bonusAttackSpeed = velOriginal;
                atacante.actualizarStats();
            }, 4000);

            const posObj = movObtenerPosicionGlobal(objetivoFinal);
            if (posObj) {
                const enemigosEnArea = [objetivoFinal];
                if (typeof movCasillasEnArea === 'function' && typeof movUnidadEnPosicion === 'function') {
                    const casillas = movCasillasEnArea(posObj, 1);
                    for (let c of casillas) {
                        const u = movUnidadEnPosicion(c, enemigosVivos);
                        if (u && !enemigosEnArea.includes(u)) enemigosEnArea.push(u);
                    }
                }

                enemigosEnArea.forEach((enemigo, idx) => {
                    setTimeout(() => {
                        if (enemigo.hp <= 0 || enemigo.muerto) return;

                        const hpPercent = enemigo.hp / enemigo.maxHp;
                        let multiplicador = 1.80;
                        if (hpPercent < 0.5) multiplicador += 0.5;
                        if (hpPercent < 0.25) multiplicador += 0.5;

                        const daño = Math.max(1, Math.floor((atacante.ataque || 0) * multiplicador));

                        if (typeof movMostrarLineaProyectil === 'function') {
                            movMostrarLineaProyectil(atacante, enemigo, 'rgba(251, 146, 60, 0.95)', 400);
                        }
                        if (typeof movMostrarEfectoVisual === 'function') {
                            movMostrarEfectoVisual(enemigo, {
                                color: MOV_COLOR.ORANGE,
                                icono: 'mov:Amago',
                                intensidad: 'strong',
                                sizeIcono: 'large',
                                duracionMs: 900
                            });
                        }

                        if (typeof movAplicarDaño === 'function') {
                            movAplicarDaño(atacante, enemigo, daño, false);
                        }
                    }, idx * 100);
                });
            }

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ===== FAMILIA SQUIRTLE - SALPICAR =====
    "salpicar": {
        nombre: "Salpicar",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`💧 ${atacante.pokemon.nombre} usa SALPICAR!`);

            if (typeof movObtenerPosicionGlobal !== 'function') return false;
            const posAtk = movObtenerPosicionGlobal(atacante);
            if (!posAtk) return false;

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Salpicar', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.BLUE,
                    icono: 'mov:Salpicar',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 900
                });
            }

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            const enemigosEnArea = [];
            if (typeof movCasillasEnArea === 'function' && typeof movUnidadEnPosicion === 'function') {
                const casillas = movCasillasEnArea(posAtk, 1);
                for (let c of casillas) {
                    const u = movUnidadEnPosicion(c, enemigosVivos);
                    if (u && !enemigosEnArea.includes(u)) enemigosEnArea.push(u);
                }
            }

            const dañoTotal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 1.44));
            const dañoPorEnemigo = enemigosEnArea.length > 0
                ? Math.max(1, Math.floor(dañoTotal / enemigosEnArea.length))
                : dañoTotal;

            const curacionPorcentaje = 0.42;

            if (atacante.hp > 0 && !atacante.muerto) {
                const curacion = Math.floor((atacante.maxHp || 0) * curacionPorcentaje);
                if (typeof movCurar === 'function') {
                    movCurar(atacante, curacion);
                } else {
                    atacante.hp = Math.min(atacante.maxHp, atacante.hp + curacion);
                }
            }

            const aliadosVivos = (contexto.aliados || []).filter(a => a && a.hp > 0 && !a.muerto && a !== atacante);
            const aliadosEnArea = [];
            if (typeof movCasillasEnArea === 'function' && typeof movUnidadEnPosicion === 'function') {
                const casillas = movCasillasEnArea(posAtk, 1);
                for (let c of casillas) {
                    const u = movUnidadEnPosicion(c, aliadosVivos);
                    if (u && !aliadosEnArea.includes(u)) aliadosEnArea.push(u);
                }
            }

            aliadosEnArea.forEach((aliado, idx) => {
                setTimeout(() => {
                    if (aliado.hp <= 0 || aliado.muerto) return;
                    const curacion = Math.floor((aliado.maxHp || 0) * curacionPorcentaje);
                    if (typeof movCurar === 'function') {
                        movCurar(aliado, curacion);
                    } else {
                        aliado.hp = Math.min(aliado.maxHp, aliado.hp + curacion);
                    }
                }, idx * 80);
            });

            enemigosEnArea.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;

                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(enemigo, {
                            color: MOV_COLOR.BLUE,
                            icono: 'mov:Salpicar',
                            intensidad: 'strong',
                            sizeIcono: 'large',
                            duracionMs: 900
                        });
                    }

                    if (typeof movAplicarDaño === 'function') {
                        movAplicarDaño(atacante, enemigo, dañoPorEnemigo, false);
                    }
                }, idx * 100);
            });

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ===== FAMILIA TINKATUFF - BESITO Y A MIMIR =====
    "besito-y-a-mimir": {
        nombre: "Besito y a Mimir",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`💕 ${atacante.pokemon.nombre} usa BESITO Y A MIMIR!`);

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;

            const objetivoFinal = enemigosVivos[Math.floor(Math.random() * enemigosVivos.length)];
            if (!objetivoFinal) return false;

            const dañoBase = Math.max(1, Math.floor((atacante.ataque || 0) * 3.20));

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Besito y a Mimir', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.PINK,
                    icono: 'mov:Besito y a Mimir',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 900
                });
            }

            // 🆕 Saltar SIEMPRE a una casilla cercana a algún enemigo.
            // 1º intenta adyacente (distancia Chebyshev 1)
            // 2º si no, distancia 2
            // 3º si no, distancia 3
            // NUNCA swap con aliados. NUNCA se queda quieto si hay hueco.
            {
                const aliados = contexto.aliados || [];
                const enemigos = contexto.enemigos || [];

                if (typeof movAsegurarPosicionGlobal === 'function') {
                    if (atacante) movAsegurarPosicionGlobal(atacante);
                    aliados.forEach(movAsegurarPosicionGlobal);
                    enemigos.forEach(movAsegurarPosicionGlobal);
                }

                const posAtk = movObtenerPosicionGlobal(atacante);

                // Helper: ¿la casilla está libre? (excluye a la propia Tinkaton)
                // 🆕 Si es la casilla donde YA está Tinkaton, NO cuenta como libre,
                //    así se ve obligada a moverse a otra adyacente al enemigo.
                function casillaLibre(fila, col) {
                    // Excluir la casilla actual de Tinkaton
                    if (posAtk && posAtk.fila === fila && posAtk.col === col) return false;

                    for (let u of aliados) {
                        if (!u || u === atacante || u.hp <= 0 || u.muerto) continue;
                        const pu = movObtenerPosicionGlobal(u);
                        if (pu && pu.fila === fila && pu.col === col) return false;
                    }
                    for (let u of enemigos) {
                        if (!u || u.hp <= 0 || u.muerto) continue;
                        const pu = movObtenerPosicionGlobal(u);
                        if (pu && pu.fila === fila && pu.col === col) return false;
                    }
                    return true;
                }

                // Devuelve casillas a distancia Chebyshev EXACTA = radio
                function casillasEnRadio(fila, col, radio) {
                    const lista = [];
                    for (let df = -radio; df <= radio; df++) {
                        for (let dc = -radio; dc <= radio; dc++) {
                            if (Math.max(Math.abs(df), Math.abs(dc)) !== radio) continue;
                            const f = fila + df;
                            const c = col + dc;
                            if (f < 0 || f > 3 || c < 0 || c > 3) continue;
                            lista.push({ fila: f, col: c });
                        }
                    }
                    return lista;
                }

                // Lista de enemigos ordenada: primero el objetivo aleatorio, luego el resto
                const enemigosOrdenados = [];
                if (objetivoFinal && objetivoFinal.hp > 0 && !objetivoFinal.muerto) {
                    enemigosOrdenados.push(objetivoFinal);
                }
                for (let e of enemigos) {
                    if (!e || e === objetivoFinal || e.hp <= 0 || e.muerto) continue;
                    enemigosOrdenados.push(e);
                }

                // Buscar la primera casilla LIBRE: radio 1 → radio 2 → radio 3
                let destinoElegido = null;
                let enemigoCerca = null;

                for (let radio = 1; radio <= 3 && !destinoElegido; radio++) {
                    for (let enemigo of enemigosOrdenados) {
                        const posE = movObtenerPosicionGlobal(enemigo);
                        if (!posE) continue;

                        const candidatas = casillasEnRadio(posE.fila, posE.col, radio);

                        // Ordenar por cercanía a la posición actual de Tinkaton
                        if (posAtk) {
                            candidatas.sort((a, b) => {
                                const dA = Math.abs(a.fila - posAtk.fila) + Math.abs(a.col - posAtk.col);
                                const dB = Math.abs(b.fila - posAtk.fila) + Math.abs(b.col - posAtk.col);
                                return dA - dB;
                            });
                        }

                        for (let c of candidatas) {
                            if (casillaLibre(c.fila, c.col)) {
                                destinoElegido = c;
                                enemigoCerca = enemigo;
                                break;
                            }
                        }
                        if (destinoElegido) break;
                    }
                }

                // Aplicar el salto (SIEMPRE sin swap)
                if (destinoElegido && typeof movSetPosicionGlobal === 'function') {
                    const posAntes = movObtenerPosicionGlobal(atacante);
                    movSetPosicionGlobal(atacante, destinoElegido.fila, destinoElegido.col);
                    const posDespues = movObtenerPosicionGlobal(atacante);

                    console.log(`🔍 ANTES: fila=${posAntes.fila}, col=${posAntes.col}, indiceActual=${atacante._indiceActual}, indiceTablero=${atacante._indiceTablero}`);
                    console.log(`🔍 DESPUÉS: fila=${posDespues.fila}, col=${posDespues.col}, indiceActual=${atacante._indiceActual}, indiceTablero=${atacante._indiceTablero}`);

                    if (typeof window.repintarCombateCompleto === 'function') {
                        window.repintarCombateCompleto();
                    } else if (typeof renderizarCombate === 'function') {
                        renderizarCombate();
                    }

                    console.log(`🔍 DOM después del repintado:`);
                    const gridPlayer = document.getElementById('playerBoard');
                    const gridEnemy = document.getElementById('enemigoBoard');
                    if (gridPlayer) {
                        for (let i = 0; i < gridPlayer.children.length; i++) {
                            const nombreEl = gridPlayer.children[i].querySelector('.unit-name');
                            if (nombreEl && nombreEl.textContent === 'Tinkaton') {
                                console.log(`   Encontrado en playerBoard índice ${i} (coord="${gridPlayer.children[i].dataset.coord}")`);
                                break;
                            }
                        }
                    }
                    if (gridEnemy) {
                        for (let i = 0; i < gridEnemy.children.length; i++) {
                            const nombreEl = gridEnemy.children[i].querySelector('.unit-name');
                            if (nombreEl && nombreEl.textContent === 'Tinkaton') {
                                console.log(`   Encontrado en enemigoBoard índice ${i} (coord="${gridEnemy.children[i].dataset.coord}")`);
                                break;
                            }
                        }
                    }

                    if (typeof addConsoleMessage === 'function') {
                        addConsoleMessage(
                            `💕 Tinkaton salta a (${destinoElegido.fila},${destinoElegido.col}) junto a ${enemigoCerca.pokemon.nombre}`,
                            'battle'
                        );
                    }
                } else {
                    if (typeof addConsoleMessage === 'function') {
                        addConsoleMessage(`💕 Tinkaton no encuentra ninguna casilla libre cerca de un enemigo, ataca desde su posición`, 'battle');
                    }
                }
            }

            setTimeout(() => {
                if (objetivoFinal.hp <= 0 || objetivoFinal.muerto) return;

                if (typeof movMostrarEfectoVisual === 'function') {
                    movMostrarEfectoVisual(objetivoFinal, {
                        color: MOV_COLOR.PINK,
                        icono: 'mov:Besito y a Mimir',
                        intensidad: 'strong',
                        sizeIcono: 'large',
                        duracionMs: 900
                    });
                }

                if (typeof movAplicarDaño === 'function') {
                    movAplicarDaño(atacante, objetivoFinal, dañoBase, false);
                }

                if (objetivoFinal.hp > 0 && !objetivoFinal.muerto) {
                    if (typeof movAplicarSlow === 'function') {
                        movAplicarSlow(objetivoFinal, 0.95, 2, '(Besito y a Mimir)');
                    }
                }
            }, 300);

            atacante._besitoMimirActivo = true;
            setTimeout(() => {
                if (!atacante) return;
                atacante._besitoMimirActivo = false;
            }, 8000);

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ===== UMBREON - PIRUETA DEL ECLIPSE =====
    "pirueta-del-eclipse": {
        nombre: "Pirueta del Eclipse",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`🌑 ${atacante.pokemon.nombre} usa PIRUETA DEL ECLIPSE!`);

            const escudo = Math.floor((atacante.ataque || 0) * 6.00);
if (escudo > 0) {
    aplicarEscudoConFade(atacante, escudo);
}

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Pirueta del Eclipse', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.GRAY,
                    icono: 'mov:Pirueta del Eclipse',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 900
                });
            }

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            let escudosRobados = 0;

            for (let enemigo of enemigosVivos) {
                if (enemigo.escudoActual && enemigo.escudoActual > 0) {
                    escudosRobados += enemigo.escudoActual;
                    enemigo.escudoActual = 0;
                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(enemigo, {
                            color: MOV_COLOR.GRAY,
                            icono: 'mov:Pirueta del Eclipse',
                            intensidad: 'soft',
                            sizeIcono: 'small',
                            duracionMs: 700
                        });
                    }
                }
            }

            atacante.escudoActual += escudosRobados;

            const dañoBase = Math.max(1, Math.floor((atacante.ataque || 0) * 0.80));
            if (enemigosVivos.length > 0) {
                const objetivoDaño = enemigosVivos[0];
                if (typeof movAplicarDaño === 'function') {
                    movAplicarDaño(atacante, objetivoDaño, dañoBase, false);
                }
            }

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ===== FAMILIA VULPIX - VELO AURORA =====
    "velo-aurora": {
        nombre: "Velo Aurora",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`❄️ ${atacante.pokemon.nombre} activa VELO AURORA!`);

            const aliadosVivos = (contexto.aliados || []).filter(a => a && a.hp > 0 && !a.muerto);

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Velo Aurora', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.CYAN,
                    icono: 'mov:Velo Aurora',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 1200
                });
            }

            aliadosVivos.forEach((aliado, idx) => {
                setTimeout(() => {
                    if (aliado.hp <= 0 || aliado.muerto) return;

                    aliado.bonusDamageReduction = (aliado.bonusDamageReduction || 1) * 0.75;
                    aliado.bonusAttackSpeed = (aliado.bonusAttackSpeed || 1) * 1.25;
                    aliado.actualizarStats();

                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(aliado, {
                            color: MOV_COLOR.CYAN,
                            icono: 'mov:Velo Aurora',
                            intensidad: 'soft',
                            sizeIcono: 'small',
                            duracionMs: 900
                        });
                    }
                }, idx * 100);
            });

            log(`   ❄️ Velo Aurora aplicado a ${aliadosVivos.length} aliados`);

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

    // ===== ZERAORA - CHISPAZO =====
    "chispazo": {
        nombre: "Chispazo",

        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };

            log(`⚡ ${atacante.pokemon.nombre} desata CHISPAZO!`);

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Chispazo', 0.5);
            }

            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.YELLOW,
                    icono: 'mov:Chispazo',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 900
                });
            }

            const dañoBase = Math.max(1, Math.floor((atacante.ataque || 0) * 0.95));

            const posAtk = movObtenerPosicionGlobal(atacante);
            const enemigosEnArea = [];
            if (posAtk && typeof movCasillasEnArea === 'function' && typeof movUnidadEnPosicion === 'function') {
                const casillas = movCasillasEnArea(posAtk, 1);
                for (let c of casillas) {
                    const u = movUnidadEnPosicion(c, enemigosVivos);
                    if (u && !enemigosEnArea.includes(u)) enemigosEnArea.push(u);
                }
            }

            if (enemigosEnArea.length === 0) {
                let objetivoFinal = objetivo;
                if (!objetivoFinal || objetivoFinal.hp <= 0 || objetivoFinal.muerto) {
                    if (typeof movEncontrarObjetivo === 'function') {
                        objetivoFinal = movEncontrarObjetivo(atacante, enemigosVivos, 'masCercano', 1);
                    }
                    if (!objetivoFinal) objetivoFinal = enemigosVivos[0];
                }
                if (objetivoFinal) enemigosEnArea.push(objetivoFinal);
            }

            let dañoTotal = 0;

            enemigosEnArea.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;

                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(enemigo, {
                            color: MOV_COLOR.YELLOW,
                            icono: 'mov:Chispazo',
                            intensidad: 'strong',
                            sizeIcono: 'large',
                            duracionMs: 900
                        });
                    }

                    const hpAntes = enemigo.hp;
                    if (typeof movAplicarDaño === 'function') {
                        movAplicarDaño(atacante, enemigo, dañoBase, false);
                    }
                    dañoTotal += (hpAntes - enemigo.hp);
                }, idx * 100);
            });

            setTimeout(() => {
                if (atacante.hp > 0 && !atacante.muerto && dañoTotal > 0) {
                    const curacion = Math.floor(dañoTotal * 0.50);
                    if (typeof movCurar === 'function') {
                        movCurar(atacante, curacion);
                    } else {
                        atacante.hp = Math.min(atacante.maxHp, atacante.hp + curacion);
                    }
                }
            }, enemigosEnArea.length * 100 + 100);

            atacante.ultiCarga = 0;
            atacante.ultiLista = false;
            return true;
        }
    },

};

// ============================================================
// EXPONER GLOBALMENTE
// ============================================================

window.ULTIS_REGISTRO = ULTIS_REGISTRO;
