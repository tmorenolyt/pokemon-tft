// ============================================================
// MOVIMIENTOS - REGISTRO PARTE 1
// ============================================================

Object.assign(MOVIMIENTOS_REGISTRO, {
        "latigo-cepa": {
        nombre: "Látigo Cepa",
        tipo: MOV_TIPO.LINEAL,
        alcance: 3,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO_EN_LINEA,
        sonido: "Látigo Cepa",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.GREEN, shape: null, icono: 'mov:Látigo Cepa', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.YELLOW, icono: '🐌', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };
            log(`🌿 ${atacante.pokemon.nombre} usa LÁTIGO CEPA!`);

            const origen = movObtenerPosicionGlobal(atacante);
            if (!origen) return false;

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;

            // ============================================================
            // 🆕 ELEGIR DIRECCIÓN HACIA EL ENEMIGO MÁS CERCANO
            // ============================================================
            const enemigosOrdenados = [...enemigosVivos].sort((a, b) => {
                const pa = movObtenerPosicionGlobal(a);
                const pb = movObtenerPosicionGlobal(b);
                if (!pa || !pb) return 0;
                const da = Math.abs(pa.fila - origen.fila) + Math.abs(pa.col - origen.col);
                const db = Math.abs(pb.fila - origen.fila) + Math.abs(pb.col - origen.col);
                return da - db;
            });

            let objetivoPrincipal = null;
            for (let e of enemigosOrdenados) {
                const pe = movObtenerPosicionGlobal(e);
                if (!pe) continue;
                const dist = Math.max(Math.abs(pe.fila - origen.fila), Math.abs(pe.col - origen.col));
                if (dist <= 3) {
                    objetivoPrincipal = e;
                    break;
                }
            }
            if (!objetivoPrincipal) {
                objetivoPrincipal = enemigosOrdenados[0];
            }
            if (!objetivoPrincipal) return false;

            const posObjetivo = movObtenerPosicionGlobal(objetivoPrincipal);
            if (!posObjetivo) return false;

            // ============================================================
            // 🆕 CALCULAR DIRECCIÓN HACIA EL OBJETIVO
            // ============================================================
            const dFila = posObjetivo.fila - origen.fila;
            const dCol  = posObjetivo.col  - origen.col;

            let direccion = null;
            if (dFila === 0) {
                direccion = (dCol >= 0) ? 'derecha' : 'izquierda';
            } else if (dCol === 0) {
                direccion = (dFila >= 0) ? 'abajo' : 'arriba';
            } else {
                if (Math.abs(dFila) >= Math.abs(dCol)) {
                    direccion = (dFila >= 0) ? 'abajo' : 'arriba';
                } else {
                    direccion = (dCol >= 0) ? 'derecha' : 'izquierda';
                }
            }

            log(`   🎯 Objetivo: ${objetivoPrincipal.pokemon.nombre} (fila ${posObjetivo.fila}, col ${posObjetivo.col})`);
            log(`   📏 Dirección elegida: ${direccion}`);

            // ============================================================
            // RECOGER ENEMIGOS EN LA LÍNEA (hasta 3 casillas)
            // ============================================================
            const casillasCamino = movCasillasEnLinea(origen, direccion, 3);
            const enemigosEnLinea = [];

            for (let c of casillasCamino) {
                const u = movUnidadEnPosicion(c, enemigosVivos);
                if (u && !enemigosEnLinea.includes(u)) {
                    enemigosEnLinea.push(u);
                }
            }

            if (enemigosEnLinea.length === 0) {
                enemigosEnLinea.push(objetivoPrincipal);
            }

            const principal = enemigosEnLinea[0];
            if (!principal) return false;

            const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 3.90));

            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Látigo Cepa', 0.4);
            }

            if (typeof movMostrarLineaProyectil === 'function') {
                movMostrarLineaProyectil(atacante, principal, 'rgba(74, 222, 128, 0.9)', 500);
            }

            // Marcar casillas del camino con color Planta
            for (let c of casillasCamino) {
                if (typeof movMarcarCasillaConTipo === 'function') {
                    movMarcarCasillaConTipo(c.fila, c.col, 'Planta', 900);
                }
            }

            setTimeout(() => {
                if (typeof movMostrarEfectoVisual === 'function') {
                    movMostrarEfectoVisual(principal, {
                        color: MOV_COLOR.GREEN,
                        icono: 'mov:Látigo Cepa',
                        intensidad: 'strong',
                        sizeIcono: 'large',
                        duracionMs: 900
                    });
                }
            }, 250);

            movAplicarDaño(atacante, principal, dañoFinal, false);

            // Slow a los enemigos intermedios
            const enemigosAfectadosPorSlow = [];
            for (let c of casillasCamino) {
                if (c.fila === posObjetivo.fila && c.col === posObjetivo.col) break;
                const u = movUnidadEnPosicion(c, enemigosVivos);
                if (u && u !== principal) {
                    enemigosAfectadosPorSlow.push(u);
                    movAplicarSlow(u, 0.30, 3, '(Látigo Cepa)');
                }
            }

            for (let i = 1; i < enemigosEnLinea.length; i++) {
                const extra = enemigosEnLinea[i];
                if (extra && extra !== principal && !enemigosAfectadosPorSlow.includes(extra)) {
                    enemigosAfectadosPorSlow.push(extra);
                    movAplicarSlow(extra, 0.30, 3, '(Látigo Cepa)');
                }
            }

            setTimeout(() => {
                if (typeof movMostrarEfectoVisual === 'function') {
                    for (let u of enemigosAfectadosPorSlow) {
                        movMostrarEfectoVisual(u, {
                            color: MOV_COLOR.YELLOW,
                            icono: '🐌',
                            intensidad: 'soft',
                            sizeIcono: 'small',
                            duracionMs: 3000,
                            persistente: true,
                            pulso: true,
                            claseExtra: 'icon-slow'
                        });
                    }
                }
            }, 400);

            return true;
        }
    },

    "lanzallamas": {
        nombre: "Lanzallamas",
        tipo: MOV_TIPO.LINEAL,
        alcance: 1,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO_EN_LINEA,
        sonido: "Lanzallamas",
        volumenSonido: 0.6,
        efecto: { color: MOV_COLOR.ORANGE, shape: null, icono: 'mov:Lanzallamas', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.ORANGE, icono: 'mov:Lanzallamas', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🔥 ${atacante.pokemon.nombre} usa LANZALLAMAS!`);
            const origen = movObtenerPosicionGlobal(atacante);
            if (!origen) return false;
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            let objetivoPrincipal = null;
            const casillaArriba = movCasillasEnLinea(origen, 'arriba', 1);
            if (casillaArriba.length > 0) {
                const uArriba = movUnidadEnPosicion(casillaArriba[0], enemigosVivos);
                if (uArriba) objetivoPrincipal = uArriba;
            }
            if (!objetivoPrincipal) {
                const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 1);
                if (candidatos.length > 0) {
                    candidatos.sort((a, b) => movDistanciaManhattan(atacante, a) - movDistanciaManhattan(atacante, b));
                    objetivoPrincipal = candidatos[0];
                }
            }
            if (!objetivoPrincipal) return false;
            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 2.70));

            // 🆕 Marcar la casilla del enemigo (NARANJA)
            if (typeof movMarcarCasillaConTipo === 'function') {
                const posObj = movObtenerPosicionGlobal(objetivoPrincipal);
                if (posObj) movMarcarCasillaConTipo(posObj.fila, posObj.col, 'Fuego', 900);
            }

            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Lanzallamas', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(251, 146, 60, 0.95)', 450);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.ORANGE, icono: 'mov:Lanzallamas', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 250);
                        movAplicarDaño(atacante, objetivoPrincipal, dañoFinal, false);
            if (objetivoPrincipal.hp > 0 && !objetivoPrincipal.muerto) {
                // Solo reducción de Def y Def.Esp (sin quemadura)
                movAplicarReduccionDefensas(objetivoPrincipal, 0.30, 4);
                setTimeout(() => {
                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.ORANGE, icono: 'mov:Lanzallamas', intensidad: 'soft', sizeIcono: 'small', duracionMs: 4000, persistente: true, pulso: true, claseExtra: 'icon-def-down' });
                    }
                }, 400);
            }
            return true;
        }
    },

    "vendaval": {
        nombre: "Vendaval",
        tipo: MOV_TIPO.LINEAL,
        alcance: 8,
        area: 0,
        prioridad: MOV_PRIORIDAD.ALEATORIO,
        sonido: "Vendaval",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.CYAN, shape: null, icono: 'mov:Vendaval', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.CYAN, icono: 'mov:Vendaval', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🌀 ${atacante.pokemon.nombre} usa VENDAVAL!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const objetivoPrincipal = enemigosVivos[Math.floor(Math.random() * enemigosVivos.length)];
            if (!objetivoPrincipal) return false;
            const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 2.00));

            // 🆕 Marcar la casilla del enemigo (CIAN)
            if (typeof movMarcarCasillaConTipo === 'function') {
                const posObj = movObtenerPosicionGlobal(objetivoPrincipal);
                if (posObj) movMarcarCasillaConTipo(posObj.fila, posObj.col, 'Volador', 900);
            }

            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Vendaval', 0.10);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(34, 211, 238, 0.95)', 500);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.CYAN, icono: 'mov:Vendaval', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 250);
            movAplicarDaño(atacante, objetivoPrincipal, dañoFinal, false);
            if (objetivoPrincipal.hp > 0 && !objetivoPrincipal.muerto) {
                movKnockup(objetivoPrincipal, 0.75);
                setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.CYAN, icono: 'mov:Vendaval', intensidad: 'soft', sizeIcono: 'small', duracionMs: 750, persistente: true, pulso: true, claseExtra: 'icon-wind' }); }, 400);
            }
            return true;
        }
    },

    "trampa-rocas": {
        nombre: "Trampa Rocas",
        tipo: MOV_TIPO.AREA,
        alcance: 1,
        area: 1,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Trampa Rocas",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.GRAY, shape: null, icono: 'mov:Trampa Rocas', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.GRAY, icono: 'mov:Trampa Rocas', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🪨 ${atacante.pokemon.nombre} usa TRAMPA ROCAS!`);
            const origen = movObtenerPosicionGlobal(atacante);
            if (!origen) return false;
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            const enemigosEnArea = [];
            const casillasArea = movCasillasEnArea(origen, 1);
            for (let c of casillasArea) {
                const u = movUnidadEnPosicion(c, enemigosVivos);
                if (u && !enemigosEnArea.includes(u)) enemigosEnArea.push(u);
            }
                        const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 1.24));

            // 🆕 Marcar el área del atacante (GRIS)
            if (typeof movMarcarCasillaConTipo === 'function') {
                movMarcarCasillaConTipo(origen.fila, origen.col, 'Roca', 900);
                for (let c of casillasArea) {
                    movMarcarCasillaConTipo(c.fila, c.col, 'Roca', 900);
                }
            }

            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Trampa Rocas', 0.4);
            if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.GRAY, icono: 'mov:Trampa Rocas', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 });
            for (let u of enemigosEnArea) {
                movAplicarDaño(atacante, u, dañoFinal, false);
                if (u.hp > 0 && !u.muerto) {
                    setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(u, { color: MOV_COLOR.GRAY, icono: 'mov:Trampa Rocas', intensidad: 'soft', sizeIcono: 'small', duracionMs: 3000, persistente: true, pulso: true, claseExtra: 'icon-rock' }); }, 250);
                }
            }
            const curacion = Math.floor(atacante.maxHp * 0.15);
            if (curacion > 0 && atacante.hp > 0 && !atacante.muerto) {
                if (typeof movCurar === 'function') movCurar(atacante, curacion);
                else atacante.hp = Math.min(atacante.maxHp, atacante.hp + curacion);
            }
            return true;
        }
    },

    "tajo-cruzado": {
        nombre: "Tajo Cruzado",
        tipo: MOV_TIPO.LINEAL,
        alcance: 1,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Tajo Cruzado",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.RED, shape: null, icono: 'mov:Tajo Cruzado', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.RED, icono: 'mov:Tajo Cruzado', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`👊 ${atacante.pokemon.nombre} usa TAJO CRUZADO!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 1);
            if (candidatos.length === 0) return false;
            candidatos.sort((a, b) => movDistanciaManhattan(atacante, a) - movDistanciaManhattan(atacante, b));
            const objetivoPrincipal = candidatos[0];
            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 1.44));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Tajo Cruzado', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(239, 68, 68, 0.95)', 450);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.RED, icono: 'mov:Tajo Cruzado', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 250);
            movAplicarDaño(atacante, objetivoPrincipal, dañoFinal, false);
            if (atacante.hp > 0 && !atacante.muerto) {
                const bonusVelOriginal = atacante.bonusAttackSpeed || 1;
                atacante.bonusAttackSpeed = bonusVelOriginal * 1.30;
                atacante.actualizarStats();
                setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.RED, icono: 'mov:Tajo Cruzado', intensidad: 'soft', sizeIcono: 'small', duracionMs: 4000, persistente: true, pulso: true, claseExtra: 'icon-fight' }); }, 400);
                setTimeout(() => { if (atacante.hp <= 0 || atacante.muerto) return; atacante.bonusAttackSpeed = bonusVelOriginal; atacante.actualizarStats(); }, 4000);
            }
            return true;
        }
    },

        "torbellino": {
        nombre: "Torbellino",
        tipo: MOV_TIPO.AREA,
        alcance: 1,
        area: 1,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Torbellino",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.BLUE, shape: null, icono: 'mov:Torbellino', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.BLUE, icono: 'mov:Torbellino', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };
            log(`🌀 ${atacante.pokemon.nombre} usa TORBELLINO!`);

            // ============================================================
            // 🆕 Duración configurable del área marcada
            // ============================================================
            const DURACION_AREA = 5000;   // 👈 5 segundos

            const origen = movObtenerPosicionGlobal(atacante);
            if (!origen) return false;

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            const enemigosEnArea = [];
            const casillasArea = movCasillasEnArea(origen, 1);

            for (let c of casillasArea) {
                const u = movUnidadEnPosicion(c, enemigosVivos);
                if (u && !enemigosEnArea.includes(u)) enemigosEnArea.push(u);
            }

            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 2.00));

            // ============================================================
            // Marcar las casillas ALREDEDOR de Marill (NO su propia casilla,
            // para no desvanecerlo) con el área de agua durante 5s.
            // ============================================================
            if (typeof movMarcarCasillaConTipo === 'function') {
                for (let c of casillasArea) {
                    movMarcarCasillaConTipo(c.fila, c.col, 'Agua', DURACION_AREA);
                }
            }

            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Torbellino', 0.4);

            // Efecto visual principal en el atacante
            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, {
                    color: MOV_COLOR.BLUE,
                    icono: 'mov:Torbellino',
                    intensidad: 'strong',
                    sizeIcono: 'large',
                    duracionMs: 900
                });
            }

            // Daño a los enemigos del área
            for (let u of enemigosEnArea) {
                movAplicarDaño(atacante, u, dañoFinal, false);
                if (u.hp > 0 && !u.muerto) {
                    setTimeout(() => {
                        if (typeof movMostrarEfectoVisual === 'function') {
                            movMostrarEfectoVisual(u, {
                                color: MOV_COLOR.BLUE,
                                icono: 'mov:Torbellino',
                                intensidad: 'soft',
                                sizeIcono: 'small',
                                duracionMs: DURACION_AREA,      // 👈 5s
                                persistente: true,
                                pulso: true,
                                claseExtra: 'icon-water'
                            });
                        }
                    }, 250);
                }
            }

            // Curación al atacante
            const curacion = Math.floor((atacante.ataque || 0) * 2.00);
            if (curacion > 0 && atacante.hp > 0 && !atacante.muerto) {
                if (typeof movCurar === 'function') movCurar(atacante, curacion);
                else atacante.hp = Math.min(atacante.maxHp, atacante.hp + curacion);
            }

            return true;
        }
    },

    "divide-dolor": {
        nombre: "Divide Dolor",
        tipo: MOV_TIPO.LINEAL,
        alcance: 1,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Divide Dolor",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.WHITE, shape: null, icono: 'mov:Divide Dolor', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.WHITE, icono: 'mov:Divide Dolor', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`💫 ${atacante.pokemon.nombre} usa DIVIDE DOLOR!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 1);
            if (candidatos.length === 0) return false;
            candidatos.sort((a, b) => movDistanciaManhattan(atacante, a) - movDistanciaManhattan(atacante, b));
            const objetivoPrincipal = candidatos[0];
            if (atacante.enlaceDolor && atacante.enlaceDolor.activo && atacante.enlaceDolor.objetivo === objetivoPrincipal) return true;
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Divide Dolor', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(255, 255, 255, 0.95)', 500);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.WHITE, icono: 'mov:Divide Dolor', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 250);
            atacante.enlaceDolor = { objetivo: objetivoPrincipal, porcentaje: 0.15, activo: true };
            if (typeof movMostrarEfectoVisual === 'function') {
                setTimeout(() => { movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.WHITE, icono: 'mov:Divide Dolor', intensidad: 'soft', sizeIcono: 'small', duracionMs: 999999, persistente: true, pulso: true, claseExtra: 'icon-pain' }); }, 400);
            }
            const hpMaxAnterior = atacante.maxHp;
            const bonusHp = Math.floor(atacante.maxHp * 0.18);
            if (atacante._maxHpOriginalEnlace === null || atacante._maxHpOriginalEnlace === undefined) atacante._maxHpOriginalEnlace = hpMaxAnterior;
            atacante.maxHp += bonusHp;
            atacante.hp += bonusHp;
            if (typeof obtenerPosicionUnidadActual === 'function') {
                const pos = obtenerPosicionUnidadActual(atacante);
                if (pos && pos.elemento && typeof actualizarBarraVidaPokemon === 'function') actualizarBarraVidaPokemon(pos.elemento, atacante.hp, atacante.maxHp);
            }
            if (typeof movMostrarEfectoVisual === 'function') {
                setTimeout(() => { movMostrarEfectoVisual(atacante, { color: MOV_COLOR.WHITE, icono: 'mov:Divide Dolor', intensidad: 'soft', sizeIcono: 'small', duracionMs: 999999, persistente: true, pulso: true, claseExtra: 'icon-pain' }); }, 500);
            }
            return true;
        }
    },

    "bola-voltio": {
        nombre: "Bola Voltio",
        tipo: MOV_TIPO.PROYECTIL,
        alcance: 4,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Bola Voltio",
        volumenSonido: 0.10,
        efecto: { color: MOV_COLOR.YELLOW, shape: null, icono: 'mov:Bola Voltio', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.YELLOW, icono: 'mov:Bola Voltio', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`⚡ ${atacante.pokemon.nombre} usa BOLA VOLTIO!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 4);
            if (candidatos.length === 0) return false;
            let objetivoPrincipal = null;
            if (objetivo && candidatos.includes(objetivo)) objetivoPrincipal = objetivo;
            else { candidatos.sort((a, b) => movDistanciaChebyshev(atacante, a) - movDistanciaChebyshev(atacante, b)); objetivoPrincipal = candidatos[0]; }
                        const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 6.20));

            // 🆕 Marcar la casilla del enemigo (AMARILLO)
            if (typeof movMarcarCasillaConTipo === 'function') {
                const posObj = movObtenerPosicionGlobal(objetivoPrincipal);
                if (posObj) movMarcarCasillaConTipo(posObj.fila, posObj.col, 'Eléctrico', 900);
            }

            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Bola Voltio', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(250, 204, 21, 0.95)', 450);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.YELLOW, icono: 'mov:Bola Voltio', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 250);
            movAplicarDaño(atacante, objetivoPrincipal, dañoFinal, false);
            if (objetivoPrincipal.hp > 0 && !objetivoPrincipal.muerto) {
                movAplicarSlow(objetivoPrincipal, 0.30, 3, '(Parálisis de Bola Voltio)');
                setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.YELLOW, icono: 'mov:Bola Voltio', intensidad: 'soft', sizeIcono: 'small', duracionMs: 3000, persistente: true, pulso: true, claseExtra: 'icon-paralyze' }); }, 400);
            }
            return true;
        }
    },

    "bola-voltio-zapdos": {
        nombre: "Bola Voltio (Zapdos)",
        tipo: MOV_TIPO.PROYECTIL,
        alcance: 4,
        area: 1,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Bola Voltio",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.YELLOW, shape: null, icono: 'mov:Bola Voltio', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.YELLOW, icono: 'mov:Bola Voltio', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`⚡ ${atacante.pokemon.nombre} usa BOLA VOLTIO (Zapdos)!`);

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 4);
            if (candidatos.length === 0) return false;

            let objetivoPrincipal = null;
            if (objetivo && candidatos.includes(objetivo)) objetivoPrincipal = objetivo;
            else {
                candidatos.sort((a, b) => movDistanciaChebyshev(atacante, a) - movDistanciaChebyshev(atacante, b));
                objetivoPrincipal = candidatos[0];
            }

            const dañoImpacto = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 1.20));
            const dañoExplosion = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 3.60));

            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Bola Voltio', 0.4);

            if (typeof movMostrarLineaProyectil === 'function') {
                movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(250, 204, 21, 0.95)', 450);
            }

            setTimeout(() => {
                if (objetivoPrincipal.hp <= 0 || objetivoPrincipal.muerto) return;

                if (typeof movMostrarEfectoVisual === 'function') {
                    movMostrarEfectoVisual(objetivoPrincipal, {
                        color: MOV_COLOR.YELLOW,
                        icono: 'mov:Bola Voltio',
                        intensidad: 'strong',
                        sizeIcono: 'large',
                        duracionMs: 700
                    });
                }

                movAplicarDaño(atacante, objetivoPrincipal, dañoImpacto, false);
            }, 250);

            setTimeout(() => {
                const posImpacto = movObtenerPosicionGlobal(objetivoPrincipal);
                if (!posImpacto) return;

                const enemigosEnExplosion = [];

                if (objetivoPrincipal.hp > 0 && !objetivoPrincipal.muerto) {
                    enemigosEnExplosion.push(objetivoPrincipal);
                }

                const casillasArea = movCasillasEnArea(posImpacto, 1);
                for (let c of casillasArea) {
                    const u = movUnidadEnPosicion(c, enemigosVivos);
                    if (u && !enemigosEnExplosion.includes(u) && u.hp > 0 && !u.muerto) {
                        enemigosEnExplosion.push(u);
                    }
                }

                enemigosEnExplosion.forEach((enemigo, idx) => {
                    setTimeout(() => {
                        if (enemigo.hp <= 0 || enemigo.muerto) return;

                        if (typeof movMostrarLineaProyectil === 'function') {
                            movMostrarLineaProyectil(atacante, enemigo, 'rgba(250, 204, 21, 0.85)', 350);
                        }
                        if (typeof movMostrarEfectoVisual === 'function') {
                            movMostrarEfectoVisual(enemigo, {
                                color: MOV_COLOR.YELLOW,
                                icono: 'mov:Bola Voltio',
                                intensidad: 'strong',
                                sizeIcono: 'large',
                                duracionMs: 900
                            });
                        }

                        movAplicarDaño(atacante, enemigo, dañoExplosion, false);
                    }, idx * 100);
                });
            }, 500);

            return true;
        }
    },

    "fuerza-lunar": {
        nombre: "Fuerza Lunar",
        tipo: MOV_TIPO.PROYECTIL,
        alcance: 4,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Fuerza Lunar",
        volumenSonido: 0.10,
        efecto: { color: MOV_COLOR.PINK, shape: null, icono: 'mov:Fuerza Lunar', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.PINK, icono: 'mov:Fuerza Lunar', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🌙 ${atacante.pokemon.nombre} usa FUERZA LUNAR!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 4);
            if (candidatos.length === 0) return false;
            let objetivoPrincipal = null;
            if (objetivo && candidatos.includes(objetivo)) objetivoPrincipal = objetivo;
            else { candidatos.sort((a, b) => movDistanciaChebyshev(atacante, a) - movDistanciaChebyshev(atacante, b)); objetivoPrincipal = candidatos[0]; }
                        const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 4.00));

            // 🆕 Marcar la casilla del enemigo (ROSA)
            if (typeof movMarcarCasillaConTipo === 'function') {
                const posObj = movObtenerPosicionGlobal(objetivoPrincipal);
                if (posObj) movMarcarCasillaConTipo(posObj.fila, posObj.col, 'Hada', 900);
            }

            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Fuerza Lunar', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(244, 114, 182, 0.95)', 500);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.PINK, icono: 'mov:Fuerza Lunar', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 250);
            movAplicarDaño(atacante, objetivoPrincipal, dañoFinal, false);
            if (objetivoPrincipal.hp > 0 && !objetivoPrincipal.muerto) {
                movAplicarSlow(objetivoPrincipal, 1.00, 1, '(Inmovilizado por Fuerza Lunar)');
                setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.PINK, icono: 'mov:Fuerza Lunar', intensidad: 'soft', sizeIcono: 'small', duracionMs: 1500, persistente: true, pulso: true, claseExtra: 'icon-fairy' }); }, 400);
                const spAtkOriginal = objetivoPrincipal.bonusSpAttack || 1;
                objetivoPrincipal.bonusSpAttack = spAtkOriginal * 0.70;
                objetivoPrincipal.actualizarStats();
                setTimeout(() => { if (objetivoPrincipal.hp <= 0 || objetivoPrincipal.muerto) return; objetivoPrincipal.bonusSpAttack = spAtkOriginal; objetivoPrincipal.actualizarStats(); }, 4000);
            }
            return true;
        }
    },

    "colmillo-hielo": {
        nombre: "Colmillo Hielo",
        tipo: MOV_TIPO.LINEAL,
        alcance: 1,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Colmillo Hielo",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.CYAN, shape: null, icono: 'mov:Colmillo Hielo', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.CYAN, icono: 'mov:Colmillo Hielo', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`❄️ ${atacante.pokemon.nombre} usa COLMILLO HIELO!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 1);
            if (candidatos.length === 0) return false;
            candidatos.sort((a, b) => movDistanciaManhattan(atacante, a) - movDistanciaManhattan(atacante, b));
            const objetivoPrincipal = candidatos[0];
            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 1.44));
            const defOriginal = atacante.bonusDefense || 0;
            const spDefOriginal = atacante.bonusSpDefense || 0;
            atacante.bonusDefense = defOriginal + 1500;
            atacante.bonusSpDefense = spDefOriginal + 1500;
            atacante.actualizarStats();
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.CYAN, icono: 'mov:Colmillo Hielo', intensidad: 'soft', sizeIcono: 'small', duracionMs: 3000, persistente: true, pulso: true, claseExtra: 'icon-shield' }); }, 150);
            setTimeout(() => { if (atacante.hp <= 0 || atacante.muerto) return; atacante.bonusDefense = defOriginal; atacante.bonusSpDefense = spDefOriginal; atacante.actualizarStats(); }, 3000);
                        // 🆕 Marcar la casilla del enemigo (CIAN)
            if (typeof movMarcarCasillaConTipo === 'function') {
                const posObj = movObtenerPosicionGlobal(objetivoPrincipal);
                if (posObj) movMarcarCasillaConTipo(posObj.fila, posObj.col, 'Hielo', 900);
            }

            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Colmillo Hielo', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(34, 211, 238, 0.95)', 450);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.CYAN, icono: 'mov:Colmillo Hielo', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 250);
            movAplicarDaño(atacante, objetivoPrincipal, dañoFinal, false);
            if (objetivoPrincipal.hp > 0 && !objetivoPrincipal.muerto) {
                 if (!objetivoPrincipal.inmuneImpedimentos) {
                    objetivoPrincipal.frozen = true;
                    objetivoPrincipal.frozenRealInicio = performance.now();
                    objetivoPrincipal.frozenDuracion = 0.6;   // 🔧 0.6s REALES
                    objetivoPrincipal.frozenTimer = 0.6;
                    setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.CYAN, icono: 'mov:Colmillo Hielo', intensidad: 'soft', sizeIcono: 'small', duracionMs: 600, persistente: true, pulso: true, claseExtra: 'icon-frozen' }); }, 400);
                }
                // Lo eleva y lo azota contra el suelo (knockup real)
                movKnockup(objetivoPrincipal, 0.6);
            }
            return true;
        }
    },

    "finta": {
        nombre: "Finta",
        tipo: MOV_TIPO.LINEAL,
        alcance: 1,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Finta",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.GRAY, shape: null, icono: 'mov:Finta', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.GRAY, icono: 'mov:Finta', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🌑 ${atacante.pokemon.nombre} usa FINTA!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 1);
            if (candidatos.length === 0) return false;
            candidatos.sort((a, b) => movDistanciaManhattan(atacante, a) - movDistanciaManhattan(atacante, b));
            const objetivoPrincipal = candidatos[0];
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Finta', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(107, 114, 128, 0.95)', 400);
            const defensaOriginal = objetivoPrincipal.defensa || 0;
            objetivoPrincipal.defensa = defensaOriginal * 0.50;
            const NUM_GOLPES = 4;
            const PORCENTAJE_GOLPE = 0.80;
            for (let i = 0; i < NUM_GOLPES; i++) {
                setTimeout(() => {
                    if (objetivoPrincipal.hp <= 0 || objetivoPrincipal.muerto) { if (i === 0) objetivoPrincipal.defensa = defensaOriginal; return; }
                    const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * PORCENTAJE_GOLPE));
                    if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.GRAY, icono: 'mov:Finta', intensidad: i === 0 ? 'strong' : 'soft', sizeIcono: i === 0 ? 'large' : 'small', duracionMs: 400 });
                    movAplicarDaño(atacante, objetivoPrincipal, dañoFinal, false);
                    if (i === NUM_GOLPES - 1 || objetivoPrincipal.hp <= 0) objetivoPrincipal.defensa = defensaOriginal;
                }, i * 250);
            }
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.GRAY, icono: 'mov:Finta', intensidad: 'soft', sizeIcono: 'small', duracionMs: 1200, persistente: true, pulso: true, claseExtra: 'icon-dark' }); }, 400);
            return true;
        }
    },

    "bomba-acida": {
        nombre: "Bomba Ácida",
        tipo: MOV_TIPO.PROYECTIL,
        alcance: 1,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Bomba Ácida",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.VENOM, shape: null, icono: 'mov:Bomba Ácida', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.VENOM, icono: 'mov:Bomba Ácida', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`☠️ ${atacante.pokemon.nombre} usa BOMBA ÁCIDA!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 1);
            if (candidatos.length === 0) return false;
            candidatos.sort((a, b) => movDistanciaManhattan(atacante, a) - movDistanciaManhattan(atacante, b));
            const objetivoPrincipal = candidatos[0];
            const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 0.80));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Bomba Ácida', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(168, 85, 247, 0.95)', 450);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.VENOM, icono: 'mov:Bomba Ácida', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 250);
            movAplicarDaño(atacante, objetivoPrincipal, dañoFinal, false);
            if (objetivoPrincipal.hp > 0 && !objetivoPrincipal.muerto) {
                if (!objetivoPrincipal.inmuneImpedimentos) {
                    if (typeof movAplicarVeneno === 'function') movAplicarVeneno(objetivoPrincipal, 30, 5, atacante);
                    setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.VENOM, icono: 'mov:Bomba Ácida', intensidad: 'soft', sizeIcono: 'small', duracionMs: 5000, persistente: true, pulso: true, claseExtra: 'icon-poison' }); }, 400);
                }
            }
            if (atacante.hp > 0 && !atacante.muerto) {
                const curacion = Math.floor(atacante.maxHp * 0.38);
                if (curacion > 0) {
                    if (typeof movCurar === 'function') movCurar(atacante, curacion);
                    else atacante.hp = Math.min(atacante.maxHp, atacante.hp + curacion);
                    setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.GREEN, icono: '💚', intensidad: 'soft', sizeIcono: 'small', duracionMs: 1000 }); }, 300);
                }
            }
            return true;
        }
    },

    "espada-lamento": {
        nombre: "Espada Lamento",
        tipo: MOV_TIPO.AREA,
        alcance: 1,
        area: 1,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Espada Lamento",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.ORANGE, shape: null, icono: 'mov:Espada Lamento', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.RED, icono: 'mov:Espada Lamento', intensidad: 'soft', sizeIcono: 'small' },
                ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🔥 ${atacante.pokemon.nombre} usa ESPADA LAMENTO!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const origen = movObtenerPosicionGlobal(atacante);
            if (!origen) return false;

            // ============================================================
            // 🆕 FIX: CONO FRONTAL HORIZONTAL (mira hacia el rival)
            // ============================================================
            // Modelo horizontal 4×5:
            //   Jugador (A-D) mira a la DERECHA (+col)
            //   Enemigo (E-H) mira a la IZQUIERDA (-col)
            //
            // Ejemplo con Ceruledge en D3 (fila 2, col 3 global):
            //   - Columna +1 (E): E2, E3, E4  → frente + diagonales
            //   - Columna +2 (F): F3          → 2 casillas al frente centrado
            //
            // Total: E2, E3, E4, F3  ✅
            // ============================================================
            const esJugador = atacante.equipo === 'player';
            const deltaCol = esJugador ? +1 : -1;

            const casillasCono = [];
            // Columna +1: frente + diagonales (E2, E3, E4)
            casillasCono.push({ fila: origen.fila - 1, col: origen.col + deltaCol });
            casillasCono.push({ fila: origen.fila,     col: origen.col + deltaCol });
            casillasCono.push({ fila: origen.fila + 1, col: origen.col + deltaCol });
            // Columna +2: solo la misma fila (F3)
            casillasCono.push({ fila: origen.fila,     col: origen.col + deltaCol * 2 });

            // Filtrar casillas fuera del tablero global (0..4 filas, 0..7 cols)
            const casillasValidas = casillasCono.filter(c =>
                c.fila >= 0 && c.fila <= 4 &&
                c.col  >= 0 && c.col  <= 7
            );

            if (casillasValidas.length === 0) return false;

            const enemigosEnCono = [];
            for (let c of casillasValidas) {
                const u = movUnidadEnPosicion(c, enemigosVivos);
                if (u && !enemigosEnCono.includes(u)) enemigosEnCono.push(u);
            }

            // Fallback: si el cono no pilla a nadie, golpea al enemigo más cercano en rango 1
            if (enemigosEnCono.length === 0) {
                const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 1);
                if (candidatos.length === 0) return false;
                candidatos.sort((a, b) => movDistanciaManhattan(atacante, a) - movDistanciaManhattan(atacante, b));
                enemigosEnCono.push(candidatos[0]);
            }

            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 2.20));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Espada Lamento', 0.4);

            // 🆕 Visual: marcar las 4 casillas del cono con el color Fuego
            if (typeof movMarcarCasillaConTipo === 'function') {
                for (const c of casillasValidas) {
                    movMarcarCasillaConTipo(c.fila, c.col, 'Fuego', 900);
                }
            }

            if (typeof movMostrarLineaProyectil === 'function' && enemigosEnCono.length > 0) {
                movMostrarLineaProyectil(atacante, enemigosEnCono[0], 'rgba(251, 146, 60, 0.95)', 450);
            }
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.ORANGE, icono: 'mov:Espada Lamento', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 150);

            let dañoTotalInfligido = 0;
            for (let u of enemigosEnCono) {
                const dañoIndividual = dañoFinal;
                setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(u, { color: MOV_COLOR.ORANGE, icono: 'mov:Espada Lamento', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 250);
                movAplicarDaño(atacante, u, dañoIndividual, false);
                dañoTotalInfligido += dañoIndividual;
            }

            if (atacante.hp > 0 && !atacante.muerto && dañoTotalInfligido > 0) {
                const curacion = Math.floor(dañoTotalInfligido * 0.50);
                if (curacion > 0) {
                    if (typeof movCurar === 'function') movCurar(atacante, curacion);
                    else atacante.hp = Math.min(atacante.maxHp, atacante.hp + curacion);
                    setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.GREEN, icono: '💚', intensidad: 'soft', sizeIcono: 'small', duracionMs: 1000 }); }, 300);
                }
            }
            return true;
        }
    },

    "nieve-polvo": {
        nombre: "Nieve Polvo",
        tipo: MOV_TIPO.AREA,
        alcance: 1,
        area: 1,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Nieve Polvo",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.CYAN, shape: null, icono: 'mov:Nieve Polvo', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.CYAN, icono: 'mov:Nieve Polvo', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`❄️ ${atacante.pokemon.nombre} usa NIEVE POLVO!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const origen = movObtenerPosicionGlobal(atacante);
            if (!origen) return false;
            const esJugador = atacante.equipo === 'player';
            const deltaFila = esJugador ? -1 : +1;
            const casillasCono = [
                { fila: origen.fila + deltaFila, col: origen.col },
                { fila: origen.fila + deltaFila, col: origen.col - 1 },
                { fila: origen.fila + deltaFila, col: origen.col + 1 }
            ];
            const casillasValidas = casillasCono.filter(c => c.fila >= 0 && c.fila <= 3 && c.col >= 0 && c.col <= 3);
            const enemigosEnCono = [];
            for (let c of casillasValidas) {
                const u = movUnidadEnPosicion(c, enemigosVivos);
                if (u && !enemigosEnCono.includes(u)) enemigosEnCono.push(u);
            }
            if (enemigosEnCono.length === 0) {
                const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 1);
                if (candidatos.length === 0) return false;
                candidatos.sort((a, b) => movDistanciaManhattan(atacante, a) - movDistanciaManhattan(atacante, b));
                enemigosEnCono.push(candidatos[0]);
            }
            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 0.80));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Nieve Polvo', 0.4);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.CYAN, icono: 'mov:Nieve Polvo', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 150);
            for (let u of enemigosEnCono) {
                if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, u, 'rgba(34, 211, 238, 0.85)', 400);
                setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(u, { color: MOV_COLOR.CYAN, icono: 'mov:Nieve Polvo', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 250);
                movAplicarDaño(atacante, u, dañoFinal, false);
            }
            if (atacante.hp > 0 && !atacante.muerto) {
                const reduccionOriginal = atacante.bonusDamageReduction || 1;
                atacante.bonusDamageReduction = reduccionOriginal * 0.40;
                atacante.actualizarStats();
                setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.CYAN, icono: 'mov:Nieve Polvo', intensidad: 'soft', sizeIcono: 'small', duracionMs: 4000, persistente: true, pulso: true, claseExtra: 'icon-shield-frost' }); }, 400);
                setTimeout(() => { if (atacante.hp <= 0 || atacante.muerto) return; atacante.bonusDamageReduction = reduccionOriginal; atacante.actualizarStats(); }, 4000);
            }
            return true;
        }
    },

    "giro-fuego": {
        nombre: "Giro Fuego",
        tipo: MOV_TIPO.PROYECTIL,
        alcance: 4,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Giro Fuego",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.ORANGE, shape: null, icono: 'mov:Giro Fuego', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.RED, icono: 'mov:Giro Fuego', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🔥 ${atacante.pokemon.nombre} usa GIRO FUEGO!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 4);
            if (candidatos.length === 0) return false;
            let objetivoPrincipal = null;
            if (objetivo && candidatos.includes(objetivo)) objetivoPrincipal = objetivo;
            else { candidatos.sort((a, b) => movDistanciaChebyshev(atacante, a) - movDistanciaChebyshev(atacante, b)); objetivoPrincipal = candidatos[0]; }
            const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 1.30));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Giro Fuego', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(251, 146, 60, 0.95)', 500);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.ORANGE, icono: 'mov:Giro Fuego', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 250);
            setTimeout(() => {
                if (objetivoPrincipal.hp <= 0 || objetivoPrincipal.muerto) return;
                movAplicarDaño(atacante, objetivoPrincipal, dañoFinal, false);
                if (objetivoPrincipal.hp > 0 && !objetivoPrincipal.muerto) {
                    if (!objetivoPrincipal.inmuneImpedimentos) {
                        movAplicarSlow(objetivoPrincipal, 1.00, 1.5, '(Inmovilizado por Giro Fuego)');
                        setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.ORANGE, icono: 'mov:Giro Fuego', intensidad: 'soft', sizeIcono: 'small', duracionMs: 1500, persistente: true, pulso: true, claseExtra: 'icon-burn' }); }, 300);
                    }
                }
            }, 350);
            return true;
        }
    },

    // ========================================================================
    // ===== MOVIMIENTOS SECUNDARIOS COSTE 1 =====
    // ========================================================================

    "puno-fuego": {
        nombre: "Puño Fuego",
        tipo: MOV_TIPO.LINEAL,
        alcance: 1,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Puño Fuego",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.ORANGE, shape: null, icono: 'mov:Puño Fuego', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.ORANGE, icono: 'mov:Puño Fuego', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🔥 ${atacante.pokemon.nombre} usa PUÑO FUEGO!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 1);
            if (candidatos.length === 0) return false;
            candidatos.sort((a, b) => movDistanciaManhattan(atacante, a) - movDistanciaManhattan(atacante, b));
            const objetivoPrincipal = candidatos[0];
            const escudo = Math.floor((atacante.ataque || 0) * 4.20);
if (escudo > 0) {
    aplicarEscudoConFade(atacante, escudo);
    if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.ORANGE, icono: '🛡️', intensidad: 'soft', sizeIcono: 'small', duracionMs: 1000 });
}
            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 2.25));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Puño Fuego', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(251, 146, 60, 0.95)', 400);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.ORANGE, icono: 'mov:Puño Fuego', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 200);
            movAplicarDaño(atacante, objetivoPrincipal, dañoFinal, false);
            return true;
        }
    },

    "placaje-electrico": {
        nombre: "Placaje Eléctrico",
        tipo: MOV_TIPO.PROYECTIL,
        alcance: 4,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Placaje Eléctrico",
        volumenSonido: 0.10,
        efecto: { color: MOV_COLOR.YELLOW, shape: null, icono: 'mov:Placaje Eléctrico', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.YELLOW, icono: 'mov:Placaje Eléctrico', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`⚡ ${atacante.pokemon.nombre} usa PLACAJE ELÉCTRICO!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 4);
            if (candidatos.length === 0) return false;
            let objetivoPrincipal = null;
            if (objetivo && candidatos.includes(objetivo)) objetivoPrincipal = objetivo;
            else { candidatos.sort((a, b) => movDistanciaChebyshev(atacante, a) - movDistanciaChebyshev(atacante, b)); objetivoPrincipal = candidatos[0]; }
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Placaje Eléctrico', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(250, 204, 21, 0.95)', 400);
            movKnockup(objetivoPrincipal, 0.6);
            const DAÑO_GOLPE = 0.80;
            const NUM_GOLPES = 5;
            for (let i = 0; i < NUM_GOLPES; i++) {
                setTimeout(() => {
                    if (objetivoPrincipal.hp <= 0 || objetivoPrincipal.muerto) return;
                    const dañoGolpe = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * DAÑO_GOLPE));
                    if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.YELLOW, icono: 'mov:Placaje Eléctrico', intensidad: i === 0 ? 'strong' : 'soft', sizeIcono: i === 0 ? 'large' : 'small', duracionMs: 400 });
                    movAplicarDaño(atacante, objetivoPrincipal, dañoGolpe, false);
                }, i * 200);
            }
            const tiempoAliados = NUM_GOLPES * 200 + 300;
            setTimeout(() => {
                const aliadosVivos = (contexto.aliados || []).filter(a => a && a.hp > 0 && !a.muerto);
                for (let a of aliadosVivos) {
                    const velOriginal = a.bonusAttackSpeed || 1;
                    a.bonusAttackSpeed = velOriginal * 1.20;
                    a.actualizarStats();
                    if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(a, { color: MOV_COLOR.YELLOW, icono: '⚡', intensidad: 'soft', sizeIcono: 'small', duracionMs: 3000, persistente: true, pulso: true, claseExtra: 'icon-haste' });
                    setTimeout(() => { if (a.hp <= 0 || a.muerto) return; a.bonusAttackSpeed = velOriginal; a.actualizarStats(); }, 3000);
                }
            }, tiempoAliados);
            return true;
        }
    },

    "tijera-x": {
        nombre: "Tijera X",
        tipo: MOV_TIPO.LINEAL,
        alcance: 1,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Tijera X",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.GRAY, shape: null, icono: 'mov:Tijera X', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.GRAY, icono: 'mov:Tijera X', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🪨 ${atacante.pokemon.nombre} usa TIJERA X!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const defOriginal = atacante.bonusDefense || 0;
            const spDefOriginal = atacante.bonusSpDefense || 0;
            atacante.bonusDefense = defOriginal + 1500;
            atacante.bonusSpDefense = spDefOriginal + 1500;
            atacante.actualizarStats();
            if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.GRAY, icono: '🛡️', intensidad: 'soft', sizeIcono: 'small', duracionMs: 5000, persistente: true, pulso: true, claseExtra: 'icon-shield' });
            setTimeout(() => { if (atacante.hp <= 0 || atacante.muerto) return; atacante.bonusDefense = defOriginal; atacante.bonusSpDefense = spDefOriginal; atacante.actualizarStats(); }, 5000);
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 1);
            if (candidatos.length === 0) return true;
            candidatos.sort((a, b) => movDistanciaManhattan(atacante, a) - movDistanciaManhattan(atacante, b));
            const objetivoPrincipal = candidatos[0];
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Tijera X', 0.4);
            const DAÑO_GOLPE = 0.40;
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    if (objetivoPrincipal.hp <= 0 || objetivoPrincipal.muerto) return;
                    const dañoGolpe = Math.max(1, Math.floor((atacante.ataque || 0) * DAÑO_GOLPE));
                    if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.GRAY, icono: 'mov:Tijera X', intensidad: i === 0 ? 'strong' : 'soft', sizeIcono: i === 0 ? 'large' : 'small', duracionMs: 400 });
                    movAplicarDaño(atacante, objetivoPrincipal, dañoGolpe, false);
                }, i * 250);
            }
            return true;
        }
    },

    "sumision": {
        nombre: "Sumisión",
        tipo: MOV_TIPO.AREA,
        alcance: 1,
        area: 1,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Sumisión",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.RED, shape: null, icono: 'mov:Sumisión', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.RED, icono: 'mov:Sumisión', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`👊 ${atacante.pokemon.nombre} usa SUMISIÓN!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 1);
            if (candidatos.length === 0) return false;
            candidatos.sort((a, b) => movDistanciaManhattan(atacante, a) - movDistanciaManhattan(atacante, b));
            const objetivoPrincipal = candidatos[0];
            const dañoGolpe = Math.max(1, Math.floor((atacante.ataque || 0) * 1.38));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Sumisión', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(239, 68, 68, 0.95)', 400);
            setTimeout(() => {
                if (objetivoPrincipal.hp <= 0 || objetivoPrincipal.muerto) return;
                if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.RED, icono: 'mov:Sumisión', intensidad: 'strong', sizeIcono: 'large', duracionMs: 600 });
                movAplicarDaño(atacante, objetivoPrincipal, dañoGolpe, false);
                movKnockup(objetivoPrincipal, 0.6);
            }, 200);
            setTimeout(() => {
                const origenObj = movObtenerPosicionGlobal(objetivoPrincipal);
                const enemigosEnArea = (objetivoPrincipal.hp > 0 && !objetivoPrincipal.muerto) ? [objetivoPrincipal] : [];
                if (origenObj) {
                    const casillasArea = movCasillasEnArea(origenObj, 1);
                    for (let c of casillasArea) {
                        const u = movUnidadEnPosicion(c, enemigosVivos);
                        if (u && !enemigosEnArea.includes(u) && u.hp > 0 && !u.muerto) enemigosEnArea.push(u);
                    }
                }
                enemigosEnArea.forEach((enemigo, idx) => {
                    setTimeout(() => {
                        if (enemigo.hp <= 0 || enemigo.muerto) return;
                        if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.RED, icono: 'mov:Sumisión', intensidad: 'strong', sizeIcono: 'large', duracionMs: 700 });
                        movAplicarDaño(atacante, enemigo, dañoGolpe, false);
                    }, idx * 100);
                });
            }, 600);
            return true;
        }
    },

    "garra-umbria": {
        nombre: "Garra Umbría",
        tipo: MOV_TIPO.LINEAL,
        alcance: 1,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Garra Umbría",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.PURPLE, shape: null, icono: 'mov:Garra Umbría', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.PURPLE, icono: 'mov:Garra Umbría', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🌑 ${atacante.pokemon.nombre} usa GARRA UMBRÍA!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 1);
            if (candidatos.length === 0) return false;
            candidatos.sort((a, b) => movDistanciaManhattan(atacante, a) - movDistanciaManhattan(atacante, b));
            const objetivoPrincipal = candidatos[0];
            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 2.80));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Garra Umbría', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(168, 85, 247, 0.95)', 400);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.PURPLE, icono: 'mov:Garra Umbría', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 200);
            movAplicarDaño(atacante, objetivoPrincipal, dañoFinal, false);
            if (objetivoPrincipal.hp > 0 && !objetivoPrincipal.muerto) {
                movKnockup(objetivoPrincipal, 0.6);
            }
            return true;
        }
    },

    "tajo-aereo": {
        nombre: "Tajo Aéreo",
        tipo: MOV_TIPO.PROYECTIL,
        alcance: 8,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Tajo Aéreo",
        volumenSonido: 0.10,
        efecto: { color: MOV_COLOR.CYAN, shape: null, icono: 'mov:Tajo Aéreo', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.CYAN, icono: 'mov:Tajo Aéreo', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🌀 ${atacante.pokemon.nombre} usa TAJO AÉREO!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 8);
            if (candidatos.length === 0) return false;
            let objetivoPrincipal = null;
            if (objetivo && candidatos.includes(objetivo)) objetivoPrincipal = objetivo;
            else { candidatos.sort((a, b) => movDistanciaChebyshev(atacante, a) - movDistanciaChebyshev(atacante, b)); objetivoPrincipal = candidatos[0]; }
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Tajo Aéreo', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(34, 211, 238, 0.95)', 400);
            const DAÑO_TAJO = 0.32;
            const NUM_TAJOS = 5;
            for (let i = 0; i < NUM_TAJOS; i++) {
                setTimeout(() => {
                    if (objetivoPrincipal.hp <= 0 || objetivoPrincipal.muerto) return;
                    const dañoTajo = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * DAÑO_TAJO));
                    if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.CYAN, icono: 'mov:Tajo Aéreo', intensidad: i === 0 ? 'strong' : 'soft', sizeIcono: i === 0 ? 'large' : 'small', duracionMs: 350 });
                    movAplicarDaño(atacante, objetivoPrincipal, dañoTajo, false);
                }, i * 180);
            }
            setTimeout(() => {
                if (objetivoPrincipal.hp <= 0 || objetivoPrincipal.muerto) return;
                movAplicarSlow(objetivoPrincipal, 0.30, 3, '(Tajo Aéreo)');
                const defOriginal = objetivoPrincipal.defensa || 0;
                const spDefOriginal = objetivoPrincipal.defensaEspecial || 0;
                objetivoPrincipal.defensa = Math.max(0, defOriginal - 100);
                objetivoPrincipal.defensaEspecial = Math.max(0, spDefOriginal - 100);
                setTimeout(() => { if (objetivoPrincipal.hp <= 0 || objetivoPrincipal.muerto) return; objetivoPrincipal.defensa = defOriginal; objetivoPrincipal.defensaEspecial = spDefOriginal; }, 3000);
                if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.CYAN, icono: 'mov:Tajo Aéreo', intensidad: 'soft', sizeIcono: 'small', duracionMs: 3000, persistente: true, pulso: true, claseExtra: 'icon-wind' });
            }, NUM_TAJOS * 180 + 150);
            return true;
        }
    },

    "carantona": {
        nombre: "Carantoña",
        tipo: MOV_TIPO.LINEAL,
        alcance: 1,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Carantoña",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.PINK, shape: null, icono: 'mov:Carantoña', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.PINK, icono: 'mov:Carantoña', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`✨ ${atacante.pokemon.nombre} usa CARANTOÑA!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 1);
            if (candidatos.length === 0) return false;
            candidatos.sort((a, b) => movDistanciaManhattan(atacante, a) - movDistanciaManhattan(atacante, b));
            const objetivoPrincipal = candidatos[0];
            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 2.40));
            const DURACION = 1.0;
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Carantoña', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(244, 114, 182, 0.95)', 400);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.PINK, icono: 'mov:Carantoña', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 200);
            movAplicarDaño(atacante, objetivoPrincipal, dañoFinal, false);
            if (objetivoPrincipal.hp > 0 && !objetivoPrincipal.muerto) {
                movAplicarSlow(objetivoPrincipal, 1.00, DURACION, '(Inmovilizado por Carantoña)');
                setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.PINK, icono: 'mov:Carantoña', intensidad: 'soft', sizeIcono: 'small', duracionMs: DURACION * 1000, persistente: true, pulso: true, claseExtra: 'icon-fairy' }); }, 400);
            }
            atacante.inmuneObjetivo = true;
            if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.PINK, icono: '✨', intensidad: 'soft', sizeIcono: 'small', duracionMs: DURACION * 1000, persistente: true, pulso: true, claseExtra: 'icon-fairy' });
            setTimeout(() => { atacante.inmuneObjetivo = false; }, DURACION * 1000);
            return true;
        }
    },

    "asta-drenaje": {
        nombre: "Asta Drenaje",
        tipo: MOV_TIPO.LINEAL,
        alcance: 1,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Asta Drenaje",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.GREEN, shape: null, icono: 'mov:Asta Drenaje', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.GREEN, icono: 'mov:Asta Drenaje', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🌿 ${atacante.pokemon.nombre} usa ASTA DRENAJE!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 1);
            if (candidatos.length === 0) return false;
            candidatos.sort((a, b) => movDistanciaManhattan(atacante, a) - movDistanciaManhattan(atacante, b));
            const objetivoPrincipal = candidatos[0];
            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 0.35));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Asta Drenaje', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(74, 222, 128, 0.95)', 400);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.GREEN, icono: 'mov:Asta Drenaje', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 200);
            movAplicarDaño(atacante, objetivoPrincipal, dañoFinal, false);
            if (objetivoPrincipal.hp > 0 && !objetivoPrincipal.muerto) {
                movKnockup(objetivoPrincipal, 0.6);
            }
            const esJugador = atacante.equipo === 'player';
            const dCol = esJugador ? 1 : -1;
            const atacanteOrig = movObtenerPosicionGlobal(atacante);
            let posActual = movObtenerPosicionGlobal(objetivoPrincipal);
            let pasos = 0;
            for (let paso = 0; paso < 2 && posActual; paso++) {
                const nuevaFila = posActual.fila;
                const nuevaCol = posActual.col + dCol;
                if (nuevaCol < 0 || nuevaCol >= COLUMNAS_GLOBALES) break;
                const ocupada = contexto.enemigos.some(e2 => { if (e2 === objetivoPrincipal || !e2 || e2.hp <= 0 || e2.muerto) return false; const pe = movObtenerPosicionGlobal(e2); return pe && pe.fila === nuevaFila && pe.col === nuevaCol; });
                const ocupadaAliado = (contexto.aliados || []).some(a2 => { if (a2 === atacante || !a2 || a2.hp <= 0 || a2.muerto) return false; const pa = movObtenerPosicionGlobal(a2); return pa && pa.fila === nuevaFila && pa.col === nuevaCol; });
                if (ocupada || ocupadaAliado) break;
                movSetPosicionGlobal(objetivoPrincipal, nuevaFila, nuevaCol);
                posActual = { fila: nuevaFila, col: nuevaCol };
                pasos++;
            }
            objetivoPrincipal._knockbackUntil = performance.now() + 1500;
            // ARRASTRE: el atacante se mueve el mismo número de casillas que el
            // rival empujado, quedando pegado a él como si lo arrastrara.
            if (pasos > 0 && atacanteOrig) {
                const nuevaColAtk = atacanteOrig.col + (dCol * pasos);
                const nuevaFilaAtk = atacanteOrig.fila;
                if (nuevaColAtk >= 0 && nuevaColAtk < COLUMNAS_GLOBALES) {
                    const ocupadaAtk = contexto.enemigos.some(e2 => { if (e2 === objetivoPrincipal || !e2 || e2.hp <= 0 || e2.muerto) return false; const pe = movObtenerPosicionGlobal(e2); return pe && pe.fila === nuevaFilaAtk && pe.col === nuevaColAtk; });
                    const ocupadaAliadoAtk = (contexto.aliados || []).some(a2 => { if (a2 === atacante || !a2 || a2.hp <= 0 || a2.muerto) return false; const pa = movObtenerPosicionGlobal(a2); return pa && pa.fila === nuevaFilaAtk && pa.col === nuevaColAtk; });
                    if (!ocupadaAtk && !ocupadaAliadoAtk) {
                        movSetPosicionGlobal(atacante, nuevaFilaAtk, nuevaColAtk);
                    }
                }
            }
            if (typeof renderizarCombate === 'function') renderizarCombate();
            if (typeof animarTambaleoKnockback === 'function') animarTambaleoKnockback(objetivoPrincipal);
            if (typeof animarTambaleoKnockback === 'function') animarTambaleoKnockback(atacante);
            const curacion = Math.floor(atacante.maxHp * 0.15);
            if (curacion > 0 && atacante.hp > 0 && !atacante.muerto) {
                if (typeof movCurar === 'function') movCurar(atacante, curacion);
                else atacante.hp = Math.min(atacante.maxHp, atacante.hp + curacion);
                if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.GREEN, icono: '💚', intensidad: 'soft', sizeIcono: 'small', duracionMs: 1000 });
            }
            return true;
        }
    },

    "premonicion": {
        nombre: "Premonición",
        tipo: MOV_TIPO.AREA,
        alcance: 8,
        area: 1,
        prioridad: MOV_PRIORIDAD.ALEATORIO,
        sonido: "Premonición",
        volumenSonido: 0.10,
        efecto: { color: MOV_COLOR.PURPLE, shape: null, icono: 'mov:Premonición', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.PURPLE, icono: 'mov:Premonición', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🔮 ${atacante.pokemon.nombre} usa PREMONICIÓN!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const objetivoPrincipal = enemigosVivos[Math.floor(Math.random() * enemigosVivos.length)];
            if (!objetivoPrincipal) return false;
            const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 3.50));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Premonición', 0.4);
            const posObj = movObtenerPosicionGlobal(objetivoPrincipal);
            if (posObj && typeof movMarcarCasillaGlobal === 'function') movMarcarCasillaGlobal(posObj.fila, posObj.col, { duracionMs: 800 });
            setTimeout(() => {
                const origenObj = movObtenerPosicionGlobal(objetivoPrincipal);
                const enemigosEnArea = (objetivoPrincipal.hp > 0 && !objetivoPrincipal.muerto) ? [objetivoPrincipal] : [];
                if (origenObj) {
                    const casillasArea = movCasillasEnArea(origenObj, 1);
                    for (let c of casillasArea) {
                        const u = movUnidadEnPosicion(c, enemigosVivos);
                        if (u && !enemigosEnArea.includes(u) && u.hp > 0 && !u.muerto) enemigosEnArea.push(u);
                    }
                }
                enemigosEnArea.forEach((enemigo, idx) => {
                    setTimeout(() => {
                        if (enemigo.hp <= 0 || enemigo.muerto) return;
                        if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.PURPLE, icono: 'mov:Premonición', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 });
                        movAplicarDaño(atacante, enemigo, dañoFinal, false);
                    }, idx * 100);
                });
            }, 500);
            return true;
        }
    },

    "terremoto": {
        nombre: "Terremoto",
        tipo: MOV_TIPO.AREA,
        alcance: 1,
        area: 1,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Terremoto",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.GRAY, shape: null, icono: 'mov:Terremoto', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.GRAY, icono: 'mov:Terremoto', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🌍 ${atacante.pokemon.nombre} usa TERREMOTO!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const origen = movObtenerPosicionGlobal(atacante);
            if (!origen) return false;
            const enemigosEnArea = [];
            const casillasArea = movCasillasEnArea(origen, 1);
            for (let c of casillasArea) {
                const u = movUnidadEnPosicion(c, enemigosVivos);
                if (u && !enemigosEnArea.includes(u) && u.hp > 0 && !u.muerto) enemigosEnArea.push(u);
            }
            if (enemigosEnArea.length === 0) return false;
            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 0.46));
                        // 🆕 Marcar el área del atacante (GRIS)
            if (typeof movMarcarCasillaConTipo === 'function') {
                movMarcarCasillaConTipo(origen.fila, origen.col, 'Roca', 900);
                for (let c of casillasArea) {
                    movMarcarCasillaConTipo(c.fila, c.col, 'Roca', 900);
                }
            }

            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Terremoto', 0.4);
            if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.GRAY, icono: 'mov:Terremoto', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 });
            for (let u of enemigosEnArea) {
                if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, u, 'rgba(107, 114, 128, 0.85)', 350);
                setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(u, { color: MOV_COLOR.GRAY, icono: 'mov:Terremoto', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 200);
                movAplicarDaño(atacante, u, dañoFinal, false);
                if (u.hp > 0 && !u.muerto) {
                    movKnockup(u, 1.5);
                }
            }
            return true;
        }
    },

    // ============================================================
    // ===== EEVEE - MOVIMIENTOS COSTE 1 (añadidos) =====
    // ============================================================

    "ataque-rapido": {
        nombre: "Ataque Rápido",
        tipo: MOV_TIPO.LINEAL,
        alcance: 1,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Ataque Rápido",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.WHITE, shape: null, icono: 'mov:Ataque Rápido', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.WHITE, icono: 'mov:Ataque Rápido', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`⚡ ${atacante.pokemon.nombre} usa ATAQUE RÁPIDO!`);

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;

            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 1);
            if (candidatos.length === 0) return false;
            candidatos.sort((a, b) => movDistanciaManhattan(atacante, a) - movDistanciaManhattan(atacante, b));
            const objetivoPrincipal = candidatos[0];

            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 1.00));

            if (typeof movMarcarCasillaConTipo === 'function') {
                const posObj = movObtenerPosicionGlobal(objetivoPrincipal);
                if (posObj) movMarcarCasillaConTipo(posObj.fila, posObj.col, 'Normal', 700);
            }

            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Ataque Rápido', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(255, 255, 255, 0.95)', 300);
            setTimeout(() => {
                if (typeof movMostrarEfectoVisual === 'function') {
                    movMostrarEfectoVisual(objetivoPrincipal, {
                        color: MOV_COLOR.WHITE,
                        icono: 'mov:Ataque Rápido',
                        intensidad: 'strong',
                        sizeIcono: 'large',
                        duracionMs: 600
                    });
                }
            }, 100);
            movAplicarDaño(atacante, objetivoPrincipal, dañoFinal, false);

            return true;
        }
    },

    "meteoros": {
        nombre: "Meteoros",
        tipo: MOV_TIPO.PROYECTIL,
        alcance: 4,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Meteoros",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.WHITE, shape: null, icono: 'mov:Meteoros', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.WHITE, icono: 'mov:Meteoros', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`⭐ ${atacante.pokemon.nombre} usa METEOROS!`);

            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;

            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 4);
            if (candidatos.length === 0) return false;

            let objetivoPrincipal = null;
            if (objetivo && candidatos.includes(objetivo)) {
                objetivoPrincipal = objetivo;
            } else {
                candidatos.sort((a, b) => movDistanciaChebyshev(atacante, a) - movDistanciaChebyshev(atacante, b));
                objetivoPrincipal = candidatos[0];
            }

            const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 1.50));

            if (typeof movMarcarCasillaConTipo === 'function') {
                const posObj = movObtenerPosicionGlobal(objetivoPrincipal);
                if (posObj) movMarcarCasillaConTipo(posObj.fila, posObj.col, 'Normal', 800);
            }

            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Meteoros', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(255, 255, 255, 0.95)', 400);

            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    if (objetivoPrincipal.hp <= 0 || objetivoPrincipal.muerto) return;
                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(objetivoPrincipal, {
                            color: MOV_COLOR.WHITE,
                            icono: 'mov:Meteoros',
                            intensidad: i === 0 ? 'strong' : 'soft',
                            sizeIcono: i === 0 ? 'large' : 'small',
                            duracionMs: 400
                        });
                    }
                    const dañoEstrella = Math.max(1, Math.floor(dañoFinal / 3));
                    movAplicarDaño(atacante, objetivoPrincipal, dañoEstrella, false);
                }, i * 150);
            }

            return true;
        }
    },

});


