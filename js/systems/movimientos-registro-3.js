// ============================================================
// MOVIMIENTOS - REGISTRO PARTE 3
// ============================================================

Object.assign(MOVIMIENTOS_REGISTRO, {
    "azote-torrencial": {
        nombre: "Azote Torrencial",
        tipo: MOV_TIPO.LINEAL,
        alcance: 1,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Azote Torrencial",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.BLUE, shape: null, icono: 'mov:Azote Torrencial', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.CYAN, icono: 'mov:Azote Torrencial', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🌊 ${atacante.pokemon.nombre} usa AZOTE TORRENCIAL!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 1);
            if (candidatos.length === 0) return false;
            candidatos.sort((a, b) => movDistanciaManhattan(atacante, a) - movDistanciaManhattan(atacante, b));
            const objetivoPrincipal = candidatos[0];
            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 1.30));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Azote Torrencial', 0.4);
            setTimeout(() => {
                if (objetivoPrincipal.hp <= 0 || objetivoPrincipal.muerto) return;
                if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(59, 130, 246, 0.95)', 350);
                if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.BLUE, icono: 'mov:Azote Torrencial', intensidad: 'strong', sizeIcono: 'large', duracionMs: 500 });
                movAplicarDaño(atacante, objetivoPrincipal, dañoFinal, false);
            }, 0);
            setTimeout(() => {
                if (objetivoPrincipal.hp <= 0 || objetivoPrincipal.muerto) return;
                if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(59, 130, 246, 0.95)', 350);
                if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.BLUE, icono: 'mov:Azote Torrencial', intensidad: 'strong', sizeIcono: 'large', duracionMs: 500 });
                movAplicarDaño(atacante, objetivoPrincipal, dañoFinal, false);
            }, 200);
            setTimeout(() => {
                if (objetivoPrincipal.hp <= 0 || objetivoPrincipal.muerto) return;
                const dañoCritico = Math.floor(dañoFinal * 1);
                if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(34, 211, 238, 0.95)', 400);
                if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.CYAN, icono: 'mov:Azote Torrencial', intensidad: 'strong', sizeIcono: 'large', duracionMs: 700 });
                movAplicarDaño(atacante, objetivoPrincipal, dañoCritico, true);
                if (objetivoPrincipal.hp > 0 && !objetivoPrincipal.muerto) {
                    const origenObj = movObtenerPosicionGlobal(objetivoPrincipal);
                    const origenAtk = movObtenerPosicionGlobal(atacante);
                    if (origenObj && origenAtk) {
                        const dFila = Math.sign(origenObj.fila - origenAtk.fila);
                        const dCol = Math.sign(origenObj.col - origenAtk.col);
                        let nuevaFila = origenObj.fila;
                        let nuevaCol = origenObj.col;
                        if (Math.abs(origenObj.fila - origenAtk.fila) >= Math.abs(origenObj.col - origenAtk.col)) nuevaFila = origenObj.fila + dFila;
                        else nuevaCol = origenObj.col + dCol;
                        if (nuevaFila >= 0 && nuevaFila < FILAS_ARENA && nuevaCol >= 0 && nuevaCol < COLUMNAS_GLOBALES) {
                            const ocupadaPorEnemigo = contexto.enemigos.some(e => { if (e === objetivoPrincipal || !e || e.hp <= 0 || e.muerto) return false; const pe = movObtenerPosicionGlobal(e); return pe && pe.fila === nuevaFila && pe.col === nuevaCol; });
                            const ocupadaPorAliado = (contexto.aliados || []).some(a => { if (!a || a.hp <= 0 || a.muerto) return false; const pa = movObtenerPosicionGlobal(a); return pa && pa.fila === nuevaFila && pa.col === nuevaCol; });
                            if (!ocupadaPorEnemigo && !ocupadaPorAliado) {
                                movSetPosicionGlobal(objetivoPrincipal, nuevaFila, nuevaCol);
                                if (typeof renderizarCombate === 'function') renderizarCombate();
                            }
                        }
                    }
                }
            }, 400);
            return true;
        }
    },

    "hidropulso": {
        nombre: "Hidropulso",
        tipo: MOV_TIPO.AREA,
        alcance: 1,
        area: 1,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Hidropulso",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.BLUE, shape: null, icono: 'mov:Hidropulso', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.CYAN, icono: 'mov:Hidropulso', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🌊 ${atacante.pokemon.nombre} usa HIDROPULSO!`);
            const origen = movObtenerPosicionGlobal(atacante);
            if (!origen) return false;
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            const enemigosCercanos = [];
            const casillasArea = movCasillasEnArea(origen, 1);
            for (let c of casillasArea) {
                const u = movUnidadEnPosicion(c, enemigosVivos);
                if (u && !enemigosCercanos.includes(u)) enemigosCercanos.push(u);
            }
            const aliadosVivos = (contexto.aliados || []).filter(a => a && a.hp > 0 && !a.muerto);
            const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 1.00));
            const curacionFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 3.60));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Hidropulso', 0.4);
            const NUM_OLAS = 3;
            for (let i = 0; i < NUM_OLAS; i++) {
                setTimeout(() => {
                    for (let enemigo of enemigosCercanos) {
                        if (enemigo.hp <= 0 || enemigo.muerto) continue;
                        if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, enemigo, 'rgba(59, 130, 246, 0.95)', 300);
                        if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.BLUE, icono: 'mov:Hidropulso', intensidad: i === 0 ? 'strong' : 'soft', sizeIcono: i === 0 ? 'large' : 'small', duracionMs: 400 });
                        movAplicarDaño(atacante, enemigo, dañoFinal, false);
                    }
                    for (let aliado of aliadosVivos) {
                        if (aliado.hp <= 0 || aliado.muerto) continue;
                        if (typeof movCurar === 'function') movCurar(aliado, curacionFinal);
                        else { const curado = Math.min(curacionFinal, aliado.maxHp - aliado.hp); aliado.hp += curado; }
                    }
                    if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.BLUE, icono: 'mov:Hidropulso', intensidad: 'soft', sizeIcono: 'small', duracionMs: 500 });
                }, i * 300);
            }
            return true;
        }
    },

    "pistola-agua": {
        nombre: "Pistola Agua",
        tipo: MOV_TIPO.PROYECTIL,
        alcance: 8,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_LEJANO,
        sonido: "Pistola Agua",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.BLUE, shape: null, icono: 'mov:Pistola Agua', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.CYAN, icono: 'mov:Pistola Agua', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`💧 ${atacante.pokemon.nombre} usa PISTOLA AGUA!`);
            
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            
            // 1. Buscar el enemigo MÁS LEJANO dentro del alcance
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 8);
            if (candidatos.length === 0) return false;
            candidatos.sort((a, b) => movDistanciaChebyshev(atacante, b) - movDistanciaChebyshev(atacante, a));
            const objetivoPrincipal = candidatos[0];
            
            // 2. Detectar la dirección desde Sobble hacia el objetivo
            const posAtacante = movObtenerPosicionGlobal(atacante);
            const posObjetivo = movObtenerPosicionGlobal(objetivoPrincipal);
            if (!posAtacante || !posObjetivo) return false;
            
            const df = posObjetivo.fila - posAtacante.fila;
            const dc = posObjetivo.col - posAtacante.col;
            
            // 3. Determinar la dirección principal (horizontal o vertical)
            let dir = null;
            if (Math.abs(df) >= Math.abs(dc)) {
                // Prioridad vertical
                if (df < 0) dir = 'arriba';
                else if (df > 0) dir = 'abajo';
                else dir = dc < 0 ? 'izquierda' : 'derecha';
            } else {
                // Prioridad horizontal
                if (dc < 0) dir = 'izquierda';
                else dir = 'derecha';
            }
            
            log(`   📍 Origen: (${posAtacante.fila},${posAtacante.col}) | Objetivo: (${posObjetivo.fila},${posObjetivo.col}) | Dirección: ${dir}`);
            
            // 4. Recorrer casillas en esa dirección desde Sobble
            const casillasTrayectoria = movCasillasEnLinea(posAtacante, dir, 8);
            log(`   📏 Trayectoria: ${casillasTrayectoria.length} casillas`);
            
            // 5. Recoger enemigos en trayectoria
            const enemigosEnTrayectoria = [];
            for (let c of casillasTrayectoria) {
                const u = movUnidadEnPosicion(c, enemigosVivos);
                if (u && !enemigosEnTrayectoria.includes(u)) {
                    log(`   🎯 ${u.pokemon.nombre} en (${c.fila},${c.col}) - GOLPEADO`);
                    enemigosEnTrayectoria.push(u);
                }
            }
            
            // Si no hay enemigos en trayectoria (raro), al menos golpear al objetivo principal
            if (enemigosEnTrayectoria.length === 0) {
                enemigosEnTrayectoria.push(objetivoPrincipal);
            }
            
            // 6. Calcular daño: repartido entre los enemigos golpeados
            const dañoTotalFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 5.30));
            const dañoPorEnemigo = Math.max(1, Math.floor(dañoTotalFinal / enemigosEnTrayectoria.length));
            
            log(`   💥 Daño total: ${dañoTotalFinal} | Daño por enemigo: ${dañoPorEnemigo}`);
            
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Pistola Agua', 0.4);
            
            // 7. Proyectil visual desde Sobble hasta el último enemigo golpeado
            const ultimoEnemigo = enemigosEnTrayectoria[enemigosEnTrayectoria.length - 1];
            if (typeof movMostrarLineaProyectil === 'function') {
                movMostrarLineaProyectil(atacante, ultimoEnemigo, 'rgba(59, 130, 246, 0.95)', 450);
            }
            
            // 8. Aplicar daño secuencialmente
            enemigosEnTrayectoria.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;
                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(enemigo, {
                            color: MOV_COLOR.BLUE,
                            icono: 'mov:Pistola Agua',
                            intensidad: 'strong',
                            sizeIcono: 'large',
                            duracionMs: 700
                        });
                    }
                    movAplicarDaño(atacante, enemigo, dañoPorEnemigo, false);
                }, idx * 100);
            });
            
            return true;
        }
    },

    "danza-dragon": {
        nombre: "Danza Dragón",
        tipo: MOV_TIPO.GLOBAL,
        alcance: 3,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Danza Dragón",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.PURPLE, shape: null, icono: 'mov:Danza Dragón', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.PURPLE, icono: 'mov:Danza Dragón', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🐉 ${atacante.pokemon.nombre} usa DANZA DRAGÓN!`);
            const DURACION = 5;
            const velOriginal = atacante.bonusAttackSpeed || 1;
            atacante.bonusAttackSpeed = velOriginal * 1.40;
            atacante.actualizarStats();
            const dañoExtraOriginal = atacante.dañoPorcentajeMaxHPObjetivo || 0;
            atacante.dañoPorcentajeMaxHPObjetivo = dañoExtraOriginal + 0.05;
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.PURPLE, icono: 'mov:Danza Dragón', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 100);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.PURPLE, icono: 'mov:Danza Dragón', intensidad: 'soft', sizeIcono: 'small', duracionMs: DURACION * 1000, persistente: true, pulso: true, claseExtra: 'icon-dragon' }); }, 400);
            setTimeout(() => { if (atacante.hp <= 0 || atacante.muerto) return; atacante.bonusAttackSpeed = velOriginal; atacante.actualizarStats(); atacante.dañoPorcentajeMaxHPObjetivo = dañoExtraOriginal; }, DURACION * 1000);
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Danza Dragón', 0.4);
            return true;
        }
    },

    "bote": {
        nombre: "Bote",
        tipo: MOV_TIPO.PROYECTIL,
        alcance: 3,
        area: 1,
        prioridad: MOV_PRIORIDAD.ALEATORIO,
        sonido: "Bote",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.CYAN, shape: null, icono: 'mov:Bote', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.CYAN, icono: 'mov:Bote', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🌊 ${atacante.pokemon.nombre} usa BOTE!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 3);
            if (candidatos.length === 0) return false;
            const objetivoPrincipal = candidatos[Math.floor(Math.random() * candidatos.length)];
            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 3.80));
            // "salta hacia un oponente al azar": Gyarados salta a una casilla adyacente libre junto al objetivo
            const posObjBote = movObtenerPosicionGlobal(objetivoPrincipal);
            const posAtkBote = movObtenerPosicionGlobal(atacante);
            if (posObjBote && posAtkBote) {
                const vecinosBote = [
                    { fila: posObjBote.fila - 1, col: posObjBote.col - 1 },
                    { fila: posObjBote.fila - 1, col: posObjBote.col     },
                    { fila: posObjBote.fila - 1, col: posObjBote.col + 1 },
                    { fila: posObjBote.fila,     col: posObjBote.col - 1 },
                    { fila: posObjBote.fila,     col: posObjBote.col + 1 },
                    { fila: posObjBote.fila + 1, col: posObjBote.col - 1 },
                    { fila: posObjBote.fila + 1, col: posObjBote.col     },
                    { fila: posObjBote.fila + 1, col: posObjBote.col + 1 }
                ].filter(c => c.fila >= 0 && c.fila < FILAS_ARENA && c.col >= 0 && c.col < COLUMNAS_GLOBALES);
                function libreBote(f, c) {
                    for (let e of contexto.enemigos) { if (!e || e === objetivoPrincipal || e.hp <= 0 || e.muerto) continue; const pe = movObtenerPosicionGlobal(e); if (pe && pe.fila === f && pe.col === c) return false; }
                    for (let a of (contexto.aliados || [])) { if (!a || a === atacante || a.hp <= 0 || a.muerto) continue; const pa = movObtenerPosicionGlobal(a); if (pa && pa.fila === f && pa.col === c) return false; }
                    return true;
                }
                vecinosBote.sort((a, b) => (Math.abs(a.fila - posAtkBote.fila) + Math.abs(a.col - posAtkBote.col)) - (Math.abs(b.fila - posAtkBote.fila) + Math.abs(b.col - posAtkBote.col)));
                let destinoBote = null;
                for (let c of vecinosBote) { if (libreBote(c.fila, c.col)) { destinoBote = c; break; } }
                if (destinoBote) {
                    movSetPosicionGlobal(atacante, destinoBote.fila, destinoBote.col);
                    if (typeof animarTambaleoKnockback === 'function') animarTambaleoKnockback(atacante);
                    if (typeof renderizarCombate === 'function') renderizarCombate();
                }
            }
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Bote', 0.4);
            setTimeout(() => {
                if (atacante.hp <= 0 || atacante.muerto) return;
                if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(34, 211, 238, 0.95)', 500);
                if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.CYAN, icono: 'mov:Bote', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 });
                setTimeout(() => {
                    if (objetivoPrincipal.hp <= 0 || objetivoPrincipal.muerto) return;
                    const posObjetivo = movObtenerPosicionGlobal(objetivoPrincipal);
                    const enemigosEnArea = [objetivoPrincipal];
                    if (posObjetivo) {
                        const casillasArea = movCasillasEnArea(posObjetivo, 1);
                        for (let c of casillasArea) {
                            const u = movUnidadEnPosicion(c, enemigosVivos);
                            if (u && !enemigosEnArea.includes(u)) enemigosEnArea.push(u);
                        }
                    }
                    enemigosEnArea.forEach((enemigo, idx) => {
                        setTimeout(() => {
                            if (enemigo.hp <= 0 || enemigo.muerto) return;
                            if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.CYAN, icono: 'mov:Bote', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 });
                            movAplicarDaño(atacante, enemigo, dañoFinal, false);
                            if (enemigo.hp > 0 && !enemigo.muerto) {
                                if (!enemigo.inmuneImpedimentos) {
                                    movKnockup(enemigo, 0.75);
                                    setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.CYAN, icono: 'mov:Bote', intensidad: 'soft', sizeIcono: 'small', duracionMs: 1000, persistente: true, pulso: true, claseExtra: 'icon-airborne' }); }, 300);
                                }
                            }
                        }, idx * 100);
                    });
                }, 400);
            }, 300);
            return true;
        }
    },

    "truco": {
        nombre: "Truco",
        tipo: MOV_TIPO.GLOBAL,
        alcance: 3,
        area: 0,
        prioridad: MOV_PRIORIDAD.ALEATORIO,
        sonido: "Truco",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.PURPLE, shape: null, icono: 'mov:Truco', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.PURPLE, icono: 'mov:Truco', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🔮 ${atacante.pokemon.nombre} usa TRUCO!`);
            const DURACION = 5;
            const aliadosVivos = (contexto.aliados || []).filter(a => a && a.hp > 0 && !a.muerto && a !== atacante);
            const aliadoElegido = aliadosVivos.length > 0 ? aliadosVivos[Math.floor(Math.random() * aliadosVivos.length)] : null;
            const escudo = Math.floor((atacante.ataqueEspecial || 0) * 6.50);
            if (aliadoElegido && escudo > 0) {
                aliadoElegido.escudoActual = (aliadoElegido.escudoActual || 0) + escudo;
                if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, aliadoElegido, 'rgba(168, 85, 247, 0.95)', 500);
                setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(aliadoElegido, { color: MOV_COLOR.PURPLE, icono: 'mov:Truco', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 200);
                actualizarEscudoVisual(aliadoElegido);
                setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(aliadoElegido, { color: MOV_COLOR.PURPLE, icono: 'mov:Truco', intensidad: 'soft', sizeIcono: 'small', duracionMs: DURACION * 1000, persistente: true, pulso: true, claseExtra: 'icon-portal' }); }, 400);
                const extraEnergiaAnterior = aliadoElegido.extraMoveGauge || 0;
                aliadoElegido.extraMoveGauge = extraEnergiaAnterior + 4;
                setTimeout(() => { if (aliadoElegido.hp <= 0 || aliadoElegido.muerto) return; aliadoElegido.extraMoveGauge = extraEnergiaAnterior; }, DURACION * 1000);
            }
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.PURPLE, icono: 'mov:Truco', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 100);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.PURPLE, icono: 'mov:Truco', intensidad: 'soft', sizeIcono: 'small', duracionMs: DURACION * 1000, persistente: true, pulso: true, claseExtra: 'icon-portal' }); }, 400);
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Truco', 0.4);
            return true;
        }
    },

    "descanso": {
        nombre: "Descanso",
        tipo: MOV_TIPO.GLOBAL,
        alcance: 1,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Descanso",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.PURPLE, shape: null, icono: 'mov:Descanso', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.PURPLE, icono: 'mov:Descanso', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`💤 ${atacante.pokemon.nombre} usa DESCANSO!`);
            const DURACION = 4;
            const curacionBase = Math.floor((atacante.ataque || 0) * 1.90);
            if (curacionBase > 0 && atacante.hp > 0 && !atacante.muerto) {
                if (typeof movCurar === 'function') movCurar(atacante, curacionBase);
                else { const curado = Math.min(curacionBase, atacante.maxHp - atacante.hp); atacante.hp += curado; }
            }
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.GREEN, icono: '💚', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 100);
            const defOriginal = atacante.bonusDefense || 0;
            const spDefOriginal = atacante.bonusSpDefense || 0;
            atacante.bonusDefense = defOriginal + 2200;
            atacante.bonusSpDefense = spDefOriginal + 2200;
            atacante.actualizarStats();
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.PURPLE, icono: 'mov:Descanso', intensidad: 'soft', sizeIcono: 'small', duracionMs: DURACION * 1000, persistente: true, pulso: true, claseExtra: 'icon-shield' }); }, 400);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.PURPLE, icono: 'mov:Descanso', intensidad: 'strong', sizeIcono: 'large', duracionMs: 1500 }); }, 200);
            setTimeout(() => { if (atacante.hp <= 0 || atacante.muerto) return; atacante.bonusDefense = defOriginal; atacante.bonusSpDefense = spDefOriginal; atacante.actualizarStats(); }, DURACION * 1000);
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Descanso', 0.4);
            return true;
        }
    },

    "llama-embrujada": {
        nombre: "Llama Embrujada",
        tipo: MOV_TIPO.PROYECTIL,
        alcance: 3,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Llama Embrujada",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.ORANGE, shape: null, icono: 'mov:Llama Embrujada', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.RED, icono: 'mov:Llama Embrujada', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🔥 ${atacante.pokemon.nombre} usa LLAMA EMBRUJADA!`);
            if (typeof atacante.bolasLlamaEmbrujada !== 'number') atacante.bolasLlamaEmbrujada = 0;
            const bolasAntes = atacante.bolasLlamaEmbrujada;
            if (bolasAntes === 0) atacante.bolasLlamaEmbrujada = 4;
            else atacante.bolasLlamaEmbrujada = Math.min(bolasAntes + 2, 8);
            const bolasAhora = atacante.bolasLlamaEmbrujada;
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 3);
            if (candidatos.length === 0) return false;
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Llama Embrujada', 0.4);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.ORANGE, icono: 'mov:Llama Embrujada', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 100);
            const NUM_BOLAS = bolasAhora;
            for (let i = 0; i < NUM_BOLAS; i++) {
                setTimeout(() => {
                    const enemigosActuales = enemigosVivos.filter(e => e.hp > 0 && !e.muerto);
                    if (enemigosActuales.length === 0) return;
                    const objetivoBola = enemigosActuales[i % enemigosActuales.length];
                    const dañoBase = Math.floor((atacante.ataqueEspecial || 0) * 0.45);
                    const dañoHP = Math.floor((objetivoBola.hp || 0) * 0.03);
                    const dañoBola = Math.max(1, dañoBase + dañoHP);
                    if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoBola, 'rgba(251, 146, 60, 0.95)', 350);
                    if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoBola, { color: MOV_COLOR.ORANGE, icono: 'mov:Llama Embrujada', intensidad: i === 0 ? 'strong' : 'soft', sizeIcono: i === 0 ? 'large' : 'small', duracionMs: 400 });
                    movAplicarDaño(atacante, objetivoBola, dañoBola, false);
                }, i * 150);
            }
            return true;
        }
    },

    "roca-afilada": {
        nombre: "Roca Afilada",
        tipo: MOV_TIPO.AREA,
        alcance: 1,
        area: 1,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Roca Afilada",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.GRAY, shape: null, icono: 'mov:Roca Afilada', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.GRAY, icono: 'mov:Roca Afilada', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🪨 ${atacante.pokemon.nombre} usa ROCA AFILADA!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const origen = movObtenerPosicionGlobal(atacante);
            if (!origen) return false;
            // "área frontal": cono hacia el enemigo (eje de columnas globales)
            const alcanceAleatorio = [1, 2, 3][Math.floor(Math.random() * 3)];
            const esJugador = atacante.equipo === 'player';
            const deltaCol = esJugador ? 1 : -1;
            const casillasCono = [];
            for (let distancia = 1; distancia <= alcanceAleatorio; distancia++) {
                const colDestino = origen.col + (deltaCol * distancia);
                casillasCono.push({ fila: origen.fila,     col: colDestino });
                casillasCono.push({ fila: origen.fila - 1, col: colDestino });
                casillasCono.push({ fila: origen.fila + 1, col: colDestino });
            }
            const casillasValidas = casillasCono.filter(c => c.fila >= 0 && c.fila < FILAS_ARENA && c.col >= 0 && c.col < COLUMNAS_GLOBALES);
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
            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 1.50));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Roca Afilada', 0.4);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.GRAY, icono: 'mov:Roca Afilada', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 100);
            enemigosEnCono.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;
                    if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, enemigo, 'rgba(107, 114, 128, 0.95)', 400);
                    if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.GRAY, icono: 'mov:Roca Afilada', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 });
                    movAplicarDaño(atacante, enemigo, dañoFinal, false);
                    if (enemigo.hp > 0 && !enemigo.muerto) {
                        if (!enemigo.inmuneImpedimentos) {
                            movKnockup(enemigo, 0.60);
                            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.GRAY, icono: 'mov:Roca Afilada', intensidad: 'soft', sizeIcono: 'small', duracionMs: 1000, persistente: true, pulso: true, claseExtra: 'icon-airborne' }); }, 300);
                        }
                    }
                }, idx * 100);
            });
            return true;
        }
    },

    "llama-reavivadora": {
        nombre: "Llama Reavivadora",
        tipo: MOV_TIPO.GLOBAL,
        alcance: 8,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Llama Reavivadora",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.ORANGE, shape: null, icono: 'mov:Llama Reavivadora', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.RED, icono: 'mov:Llama Reavivadora', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🔥 ${atacante.pokemon.nombre} usa LLAMA REAVIVADORA!`);
            const esJugador = atacante.equipo === 'player';
            const arrayAliados = esJugador ? window.jugadores : window.rivales;
            let porcentajeCuracion = 0.45;
            if (atacante.nivel >= 3) porcentajeCuracion = 1.00;
            const aliadosMuertos = (arrayAliados || []).filter(a => a && a !== atacante && (a.muerto === true || a.hp <= 0));
            if (aliadosMuertos.length > 0) {
                aliadosMuertos.sort((a, b) => (b.maxHp || 0) - (a.maxHp || 0));
                // "Regresa a 1/1/5 Pokémon aliados": 1 (1★/2★) o 5 (3★) resucitados
                const cantidadResucitar = (atacante.nivel >= 3) ? 5 : 1;
                const aRevivir = aliadosMuertos.slice(0, cantidadResucitar);
                for (let rI = 0; rI < aRevivir.length; rI++) {
                const aliadoRevivido = aRevivir[rI];
                aliadoRevivido.hp = aliadoRevivido.maxHp;
                aliadoRevivido.muerto = false;
                // 🔧 FIX v3.6: resetear flag de muerte + activar flag de reviviendo
                aliadoRevivido._deathLogged = false;
                aliadoRevivido._reviviendo = true;
                
                // 🔧 FIX v3.6: desactivar el flag _reviviendo tras 800ms
                setTimeout(() => {
                    if (aliadoRevivido) aliadoRevivido._reviviendo = false;
                }, 800);
                
                log(`   💚 ¡${aliadoRevivido.pokemon.nombre} REVIVE!`);
                if (typeof actualizarCopiaEstadisticas === 'function') {
                    actualizarCopiaEstadisticas(aliadoRevivido, 'healingDone', aliadoRevivido.maxHp);
                }
                if (typeof movMostrarLineaProyectil === 'function') {
                    movMostrarLineaProyectil(atacante, aliadoRevivido, 'rgba(251, 146, 60, 0.95)', 600);
                }
                setTimeout(() => {
                    if (typeof obtenerPosicionUnidadActual === 'function') {
                        const pos = obtenerPosicionUnidadActual(aliadoRevivido);
                        if (pos && pos.elemento) {
                            pos.elemento.classList.remove('muerto');
                            pos.elemento.style.opacity = '1';
                            pos.elemento.style.transform = 'scale(1)';
                            pos.elemento.style.filter = 'grayscale(0)';
                            pos.elemento.style.pointerEvents = '';
                            pos.elemento.style.transition = 'opacity 0.5s ease, transform 0.5s ease, filter 0.5s ease';
                            const hpBar = pos.elemento.querySelector('.unit-hp-bar');
                            if (hpBar) hpBar.style.opacity = '1';
                            const energyBar = pos.elemento.querySelector('.energy-bar');
                            if (energyBar) energyBar.style.opacity = '1';
                            const nameEl = pos.elemento.querySelector('.unit-name');
                            if (nameEl) nameEl.style.opacity = '1';
                            const traitsEl = pos.elemento.querySelector('.unit-traits-left');
                            if (traitsEl) traitsEl.style.opacity = '1';
                            const sprite = pos.elemento.querySelector('.unit-sprite');
                            if (sprite) {
                                sprite.style.filter = 'grayscale(0) brightness(1)';
                                sprite.style.opacity = '1';
                            }
                            if (typeof actualizarBarraVidaPokemon === 'function') {
                                actualizarBarraVidaPokemon(pos.elemento, aliadoRevivido.hp, aliadoRevivido.maxHp);
                            }
                            if (typeof movMostrarEfectoVisual === 'function') {
                                movMostrarEfectoVisual(aliadoRevivido, { color: MOV_COLOR.ORANGE, icono: 'mov:Llama Reavivadora', intensidad: 'strong', sizeIcono: 'large', duracionMs: 1500, persistente: false });
                            }
                        }
                    }
                    if (typeof renderizarCombate === 'function') {
                        renderizarCombate();
                    }
                }, 200 + rI * 100);
                }
                setTimeout(() => {
                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(atacante, { color: MOV_COLOR.ORANGE, icono: 'mov:Llama Reavivadora', intensidad: 'strong', sizeIcono: 'large', duracionMs: 1200, persistente: false });
                    }
                }, 100);
            } else {
                const aliadosVivos = (arrayAliados || []).filter(a => a && a.hp > 0 && !a.muerto);
                if (aliadosVivos.length === 0) {
                    log(`   ⚠️ No hay aliados vivos para curar.`);
                    return false;
                }
                aliadosVivos.sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp));
                const aliadoCurado = aliadosVivos[0];
                const curacionBase = Math.floor(aliadoCurado.maxHp * porcentajeCuracion);
                log(`   💚 No hay aliados muertos. Curando a ${aliadoCurado.pokemon.nombre} (el más debilitado) por ${curacionBase} HP (${porcentajeCuracion * 100}%)`);
                if (typeof movCurar === 'function') {
                    movCurar(aliadoCurado, curacionBase);
                } else {
                    const curado = Math.min(curacionBase, aliadoCurado.maxHp - aliadoCurado.hp);
                    aliadoCurado.hp += curado;
                }
                if (typeof movMostrarLineaProyectil === 'function') {
                    movMostrarLineaProyectil(atacante, aliadoCurado, 'rgba(251, 146, 60, 0.95)', 500);
                }
                setTimeout(() => {
                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(aliadoCurado, { color: MOV_COLOR.GREEN, icono: '💚', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900, persistente: false });
                    }
                }, 200);
                setTimeout(() => {
                    if (typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(atacante, { color: MOV_COLOR.ORANGE, icono: 'mov:Llama Reavivadora', intensidad: 'soft', sizeIcono: 'small', duracionMs: 900, persistente: false });
                    }
                }, 100);
            }
            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Llama Reavivadora', 0.4);
            }
            return true;
        }
    },

    "teletransporte": {
        nombre: "Teletransporte",
        tipo: MOV_TIPO.GLOBAL,
        alcance: 8,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_LEJANO,
        sonido: "Teletransporte",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.PURPLE, shape: null, icono: 'mov:Teletransporte', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.PINK, icono: 'mov:Teletransporte', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => {
                if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle');
                else console.log(msg);
            };
            log(`🌌 ${atacante.pokemon.nombre} usa TELETRANSPORTE!`);
            const enemigosVivos = (contexto.enemigos || []).filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) {
                log(`   ⚠️ No hay enemigos vivos, no se puede teletransportar`);
                return false;
            }
            movAsegurarPosicionGlobal(atacante);
            enemigosVivos.forEach(movAsegurarPosicionGlobal);
            enemigosVivos.sort((a, b) => movDistanciaChebyshev(atacante, b) - movDistanciaChebyshev(atacante, a));
            const objetivoLejano = enemigosVivos[0];
            log(`   🎯 Enemigo más lejano: ${objetivoLejano.pokemon.nombre} (fila ${objetivoLejano._filaGlobal}, col ${objetivoLejano._colGlobal})`);
            if (typeof movMostrarEfectoVisual === 'function') {
                movMostrarEfectoVisual(atacante, { color: MOV_COLOR.PURPLE, icono: 'mov:Teletransporte', intensidad: 'strong', sizeIcono: 'large', duracionMs: 600, persistente: false });
            }
            atacante._teletransporteAtkBonus = 1.30;
            atacante._teletransporteSpAtkBonus = 1.30;
            atacante._teletransporteVelBonus = 2.00;
            atacante._teletransporteDefBonus = 400;
            atacante._teletransporteSpDefBonus = 400;
                        atacante.spriteIdAlternativo = "mega-mewtwo-x";
            atacante.actualizarStats();
            log(`   🌟 ¡MEGA-EVOLUCIÓN a Mega-Mewtwo X!`);
            log(`      💪 +30% Ataque`);
            log(`      💨 +100% Vel. Ataque`);
            log(`      🛡️ +400 Def y Def.Esp`);

            // 🆕 Forzar repintado inmediato del sprite mega-evolucionado
            if (typeof window.repintarCombateCompleto === 'function') {
                window.repintarCombateCompleto();
            } else if (typeof renderizarCombate === 'function') {
                renderizarCombate();
            }
            const posObjetivo = movObtenerPosicionGlobal(objetivoLejano);
            if (!posObjetivo) {
                log(`   ⚠️ No se pudo obtener posición del objetivo`);
            } else {
                const candidatas = [
                    { fila: posObjetivo.fila - 1, col: posObjetivo.col - 1 },
                    { fila: posObjetivo.fila - 1, col: posObjetivo.col     },
                    { fila: posObjetivo.fila - 1, col: posObjetivo.col + 1 },
                    { fila: posObjetivo.fila,     col: posObjetivo.col - 1 },
                    { fila: posObjetivo.fila,     col: posObjetivo.col + 1 },
                    { fila: posObjetivo.fila + 1, col: posObjetivo.col - 1 },
                    { fila: posObjetivo.fila + 1, col: posObjetivo.col     },
                    { fila: posObjetivo.fila + 1, col: posObjetivo.col + 1 }
                ].filter(c => c.fila >= 0 && c.fila <= 3 && c.col >= 0 && c.col <= 3);
                const aliados = contexto.aliados || [];
                const enemigos = contexto.enemigos || [];
                aliados.forEach(movAsegurarPosicionGlobal);
                enemigos.forEach(movAsegurarPosicionGlobal);
                                function casillaLibre(fila, col) {
                    // 🆕 Excluir la casilla donde YA está Mewtwo (fuerza movimiento)
                    const posActual = movObtenerPosicionGlobal(atacante);
                    if (posActual && posActual.fila === fila && posActual.col === col) return false;

                    for (let u of aliados) {
                        if (u === atacante || !u || u.hp <= 0 || u.muerto) continue;
                        if (u._filaGlobal === fila && u._colGlobal === col) return false;
                    }
                    for (let u of enemigos) {
                        if (!u || u.hp <= 0 || u.muerto) continue;
                        if (u._filaGlobal === fila && u._colGlobal === col) return false;
                    }
                    return true;
                }
                                candidatas.sort((a, b) => {
                    // 🆕 Priorizar casillas cercanas al OBJETIVO (más lejano),
                    // no a la posición actual de Mewtwo
                    const dA = Math.abs(a.fila - posObjetivo.fila) + Math.abs(a.col - posObjetivo.col);
                    const dB = Math.abs(b.fila - posObjetivo.fila) + Math.abs(b.col - posObjetivo.col);
                    return dA - dB;
                });
                let destinoElegido = null;
                for (let c of candidatas) {
                    if (casillaLibre(c.fila, c.col)) {
                        destinoElegido = c;
                        break;
                    }
                }
                if (!destinoElegido) {
                    log(`   ⚠️ Todas las adyacentes ocupadas, buscando más lejos`);
                    for (let r = 2; r <= 3 && !destinoElegido; r++) {
                        for (let df = -r; df <= r && !destinoElegido; df++) {
                            for (let dc = -r; dc <= r && !destinoElegido; dc++) {
                                if (Math.max(Math.abs(df), Math.abs(dc)) !== r) continue;
                                const f = posObjetivo.fila + df;
                                const c = posObjetivo.col + dc;
                                if (f < 0 || f > 3 || c < 0 || c > 3) continue;
                                if (casillaLibre(f, c)) {
                                    destinoElegido = { fila: f, col: c };
                                }
                            }
                        }
                    }
                }
                if (destinoElegido) {
                    movSetPosicionGlobal(atacante, destinoElegido.fila, destinoElegido.col);
                    log(`   ✨ Mewtwo se teletransporta a (fila ${destinoElegido.fila}, col ${destinoElegido.col})`);
                    if (typeof window.repintarCombateCompleto === 'function') {
                        window.repintarCombateCompleto();
                    }
                    setTimeout(() => {
                        if (typeof movMostrarEfectoVisual === 'function') {
                            movMostrarEfectoVisual(atacante, { color: MOV_COLOR.PURPLE, icono: 'mov:Teletransporte', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900, persistente: false });
                        }
                    }, 250);
                } else {
                    log(`   ❌ No hay ninguna casilla libre cerca de ${objetivoLejano.pokemon.nombre}`);
                }
            }
            const critGuaranteedOriginal = atacante.critGuaranteed || false;
            atacante.critGuaranteed = true;
            log(`   ⚡ Ataques CRÍTICOS GARANTIZADOS durante 5s`);
            setTimeout(() => {
                if (typeof movMostrarEfectoVisual === 'function') {
                    movMostrarEfectoVisual(atacante, { color: MOV_COLOR.PURPLE, icono: 'mov:Teletransporte', intensidad: 'soft', sizeIcono: 'small', duracionMs: 5000, persistente: true, pulso: true, claseExtra: 'icon-mega' });
                }
            }, 400);
            setTimeout(() => {
                if (atacante.hp <= 0 || atacante.muerto) return;
                atacante.critGuaranteed = critGuaranteedOriginal;
            }, 5000);
            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Teletransporte', 0.4);
            }
            return true;
        }
    },

    "cometa-draco": {
        nombre: "Cometa Draco",
        tipo: MOV_TIPO.PROYECTIL,
        alcance: 8,
        area: 1,
        prioridad: MOV_PRIORIDAD.ALEATORIO,
        sonido: "Cometa Draco",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.PURPLE, shape: null, icono: 'mov:Cometa Draco', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.PURPLE, icono: 'mov:Cometa Draco', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`☄️ ${atacante.pokemon.nombre} usa COMETA DRACO!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 8);
            if (candidatos.length === 0) return false;
            const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 1.70));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Cometa Draco', 0.4);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.PURPLE, icono: 'mov:Cometa Draco', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 100);
            const NUM_METEOROS = 5;
            for (let i = 0; i < NUM_METEOROS; i++) {
                setTimeout(() => {
                    const enemigosActuales = enemigosVivos.filter(e => e.hp > 0 && !e.muerto);
                    if (enemigosActuales.length === 0) return;
                    const objetivoMeteoro = enemigosActuales[Math.floor(Math.random() * enemigosActuales.length)];
                    if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoMeteoro, 'rgba(168, 85, 247, 0.95)', 400);
                    if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoMeteoro, { color: MOV_COLOR.PURPLE, icono: 'mov:Cometa Draco', intensidad: i === 0 ? 'strong' : 'soft', sizeIcono: i === 0 ? 'large' : 'small', duracionMs: 500 });
                    movAplicarDaño(atacante, objetivoMeteoro, dañoFinal, false);
                    if (objetivoMeteoro.hp > 0 && !objetivoMeteoro.muerto) {
                        if (!objetivoMeteoro.inmuneImpedimentos) movAplicarSlow(objetivoMeteoro, 1.00, 1, '(Inmovilizado por Cometa Draco)');
                    }
                    const posObjetivo = movObtenerPosicionGlobal(objetivoMeteoro);
                    if (posObjetivo) {
                        const casillasArea = movCasillasEnArea(posObjetivo, 1);
                        const enemigosEnArea = [];
                        for (let c of casillasArea) {
                            const u = movUnidadEnPosicion(c, enemigosActuales);
                            if (u && u !== objetivoMeteoro && !enemigosEnArea.includes(u)) enemigosEnArea.push(u);
                        }
                        for (let enemigoArea of enemigosEnArea) {
                            movAplicarDaño(atacante, enemigoArea, dañoFinal, false);
                            if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigoArea, { color: MOV_COLOR.PURPLE, icono: 'mov:Cometa Draco', intensidad: 'soft', sizeIcono: 'small', duracionMs: 400 });
                            if (enemigoArea.hp > 0 && !enemigoArea.muerto) {
                                if (!enemigoArea.inmuneImpedimentos) movAplicarSlow(enemigoArea, 1.00, 1, '(Inmovilizado por Cometa Draco)');
                            }
                        }
                    }
                }, i * 250);
            }
            return true;
        }
    },

    "garra-metal": {
        nombre: "Garra Metal",
        tipo: MOV_TIPO.LINEAL,
        alcance: 2,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO_EN_LINEA,
        sonido: "Garra Metal",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.WHITE, shape: null, icono: 'mov:Garra Metal', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.WHITE, icono: 'mov:Garra Metal', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`⚔️ ${atacante.pokemon.nombre} usa GARRA METAL!`);
            
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 2);
            if (candidatos.length === 0) return false;
            candidatos.sort((a, b) => movDistanciaManhattan(atacante, a) - movDistanciaManhattan(atacante, b));
            const objetivoPrincipal = candidatos[0];
            
            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 3.65));
            
            if (typeof playSonidoMovimiento === 'function') {
                playSonidoMovimiento('Garra Metal', 0.4);
            }
            
            if (typeof movMostrarLineaProyectil === 'function') {
                movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(255, 255, 255, 0.95)', 450);
            }
            
            setTimeout(() => {
                if (typeof movMostrarEfectoVisual === 'function') {
                    movMostrarEfectoVisual(objetivoPrincipal, {
                        color: MOV_COLOR.WHITE,
                        icono: 'mov:Garra Metal',
                        intensidad: 'strong',
                        sizeIcono: 'large',
                        duracionMs: 900
                    });
                }
            }, 250);
            
            movAplicarDaño(atacante, objetivoPrincipal, dañoFinal, false);
            
            // Daño extra contra escudos
            if (objetivoPrincipal.escudoActual > 0) {
                const dañoExtra = Math.floor(dañoFinal * 0.5);
                movAplicarDaño(atacante, objetivoPrincipal, dañoExtra, false);
                log(`   🛡️ ¡Daño extra contra escudo! (+${dañoExtra})`);
            }
            
            return true;
        }
    },

"tajo-supremo": {
    nombre: "Tajo Supremo",
    tipo: MOV_TIPO.GLOBAL,
    alcance: 99,
    area: 0,
    prioridad: MOV_PRIORIDAD.MAS_CERCANO,
    sonido: "Tajo Supremo",
    volumenSonido: 0.4,
    efecto: { color: MOV_COLOR.WHITE, shape: null, icono: 'mov:Tajo Supremo', intensidad: 'strong', sizeIcono: 'large' },
    efectoSecundario: { color: MOV_COLOR.WHITE, icono: 'mov:Tajo Supremo', intensidad: 'soft', sizeIcono: 'small' },
    ejecutar: function(atacante, objetivo, contexto) {
        const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
        log(`⚔️ ${atacante.pokemon.nombre} desata TAJO SUPREMO!`);

        // ============================================================
        // Opción 3: golpea a TODOS los enemigos vivos (sin filtro de distancia)
        // ============================================================
        const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);

        if (enemigosVivos.length === 0) {
            log(`   ⚠️ No hay enemigos vivos`);
            return false;
        }

        log(`   🎯 ¡Golpeando a TODOS los ${enemigosVivos.length} enemigos!`);

        // ============================================================
        // Daño masivo: 550% del Ataque
        // ============================================================
        const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 5.50));

        if (typeof playSonidoMovimiento === 'function') {
            playSonidoMovimiento('Tajo Supremo', 0.4);
        }

        // Efecto visual en Zacian (el "charge" del tajo)
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

        // ============================================================
        // Aplicar daño secuencialmente a cada enemigo vivo
        // ============================================================
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

                movAplicarDaño(atacante, enemigo, dañoFinal, false);

                // Daño extra contra escudos (según efecto original de Zacian)
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

// ============================================================
// MOVIMIENTOS COSTE 3 - VARIANTES Y SECUNDARIOS
// ============================================================

// --- Bomba Lodo (Haunter / Gengar): 400% esp área 3 + veneno 40/s ---
const MOV_BOMBA_LODO_COSTE3 = {
    nombre: "Bomba Lodo",
    tipo: MOV_TIPO.PROYECTIL,
    alcance: 8,
    area: 3,
    prioridad: MOV_PRIORIDAD.MAS_CERCANO,
    sonido: "Bomba Lodo",
    volumenSonido: 0.4,
    efecto: { color: MOV_COLOR.VENOM, shape: null, icono: 'mov:Bomba Lodo', intensidad: 'strong', sizeIcono: 'large' },
    efectoSecundario: { color: MOV_COLOR.VENOM, icono: 'mov:Bomba Lodo', intensidad: 'soft', sizeIcono: 'small' },
    ejecutar: function(atacante, objetivo, contexto) {
        const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
        log(`☠️ ${atacante.pokemon.nombre} usa BOMBA LODO!`);
        const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
        if (enemigosVivos.length === 0) return false;
        const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 8);
        if (candidatos.length === 0) return false;
        let objetivoPrincipal = null;
        if (objetivo && candidatos.includes(objetivo)) objetivoPrincipal = objetivo;
        else { candidatos.sort((a, b) => movDistanciaChebyshev(atacante, a) - movDistanciaChebyshev(atacante, b)); objetivoPrincipal = candidatos[0]; }
        const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 4.00));
        if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Bomba Lodo', 0.4);
        if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(126, 34, 206, 0.95)', 500);
        const origenObjetivo = movObtenerPosicionGlobal(objetivoPrincipal);
        const enemigosEnArea = [objetivoPrincipal];
        if (origenObjetivo) {
            const casillasArea = movCasillasEnArea(origenObjetivo, 3);
            for (let c of casillasArea) {
                const u = movUnidadEnPosicion(c, enemigosVivos);
                if (u && !enemigosEnArea.includes(u)) enemigosEnArea.push(u);
            }
        }
        enemigosEnArea.forEach((enemigo, idx) => {
            setTimeout(() => {
                if (enemigo.hp <= 0 || enemigo.muerto) return;
                if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.VENOM, icono: 'mov:Bomba Lodo', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 });
                movAplicarDaño(atacante, enemigo, dañoFinal, false);
                if (enemigo.hp > 0 && !enemigo.muerto && !enemigo.inmuneImpedimentos) {
                    if (typeof movAplicarVeneno === 'function') movAplicarVeneno(enemigo, 40, 5, atacante);
                    setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.VENOM, icono: 'mov:Bomba Lodo', intensidad: 'soft', sizeIcono: 'small', duracionMs: 5000, persistente: true, pulso: true, claseExtra: 'icon-poison' }); }, 300);
                }
            }, idx * 100);
        });
        return true;
    }
};

// --- Hidroariete (Sobble / Drizzile / Inteleon): 8 proyectiles 40% + 2.5% HP máx ---
const MOV_HIDROARIETE_SOBBLE = {
    nombre: "Hidroariete",
    tipo: MOV_TIPO.PROYECTIL,
    alcance: 5,
    area: 0,
    prioridad: MOV_PRIORIDAD.MAS_FUERTE,
    sonido: "Hidroariete",
    volumenSonido: 0.4,
    efecto: { color: MOV_COLOR.BLUE, shape: null, icono: 'mov:Hidroariete', intensidad: 'strong', sizeIcono: 'large' },
    efectoSecundario: { color: MOV_COLOR.CYAN, icono: 'mov:Hidroariete', intensidad: 'soft', sizeIcono: 'small' },
    ejecutar: function(atacante, objetivo, contexto) {
        const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
        log(`🌊 ${atacante.pokemon.nombre} usa HIDROARIETE!`);
        const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
        if (enemigosVivos.length === 0) return false;
        const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 5);
        if (candidatos.length === 0) return false;
        candidatos.sort((a, b) => (b.hp || 0) - (a.hp || 0));
        const objetivoPrincipal = candidatos[0];
        const dañoBase = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 0.40));
        const dañoMaxHP = Math.max(1, Math.floor((objetivoPrincipal.maxHp || 0) * 0.025));
        if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Hidroariete', 0.4);
        const NUM_PROYECTILES = 8;
        for (let i = 0; i < NUM_PROYECTILES; i++) {
            setTimeout(() => {
                if (objetivoPrincipal.hp <= 0 || objetivoPrincipal.muerto) return;
                if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(59, 130, 246, 0.95)', 300);
                if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.CYAN, icono: 'mov:Hidroariete', intensidad: i === 0 ? 'strong' : 'soft', sizeIcono: i === 0 ? 'large' : 'small', duracionMs: 400 });
                movAplicarDaño(atacante, objetivoPrincipal, dañoBase + dañoMaxHP, false);
            }, i * 100);
        }
        return true;
    }
};

Object.assign(MOVIMIENTOS_REGISTRO, {
    "bomba-lodo-gengar": MOV_BOMBA_LODO_COSTE3,
    "bomba-lodo-haunter": MOV_BOMBA_LODO_COSTE3,
    "hidroariete-sobble": MOV_HIDROARIETE_SOBBLE,
    "hidroariete-drizzile": MOV_HIDROARIETE_SOBBLE,
    "hidroariete-inteleon": MOV_HIDROARIETE_SOBBLE,

    "ciclon-de-hojas": {
        nombre: "Ciclón de Hojas",
        tipo: MOV_TIPO.LINEAL,
        alcance: 8,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Ciclón de Hojas",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.GREEN, shape: null, icono: 'mov:Ciclón de Hojas', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.GREEN, icono: 'mov:Ciclón de Hojas', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🍃 ${atacante.pokemon.nombre} usa CICLÓN DE HOJAS!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const esJugador = atacante.equipo === 'player';
            const dir = esJugador ? 'derecha' : 'izquierda';
            const origen = movObtenerPosicionGlobal(atacante);
            if (!origen) return false;
            const casillasLinea = movCasillasEnLinea(origen, dir, 8);
            const enemigosEnLinea = [];
            for (let c of casillasLinea) {
                const u = movUnidadEnPosicion(c, enemigosVivos);
                if (u && !enemigosEnLinea.includes(u)) enemigosEnLinea.push(u);
            }
            const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 3.00));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Ciclón de Hojas', 0.4);
            const dCol = esJugador ? 1 : -1;
            enemigosEnLinea.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;
                    if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, enemigo, 'rgba(74, 222, 128, 0.95)', 350);
                    if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.GREEN, icono: 'mov:Ciclón de Hojas', intensidad: 'strong', sizeIcono: 'large', duracionMs: 700 });
                    movAplicarDaño(atacante, enemigo, dañoFinal, false);
                    // Empujar 1 casilla en la dirección
                    if (enemigo.hp > 0 && !enemigo.muerto) {
                        const pos = movObtenerPosicionGlobal(enemigo);
                        if (pos) {
                            const nuevaCol = pos.col + dCol;
                            if (nuevaCol >= 0 && nuevaCol < COLUMNAS_GLOBALES) {
                                const ocupada = contexto.enemigos.some(e2 => { if (e2 === enemigo || !e2 || e2.hp <= 0 || e2.muerto) return false; const pe = movObtenerPosicionGlobal(e2); return pe && pe.fila === pos.fila && pe.col === nuevaCol; });
                                if (!ocupada) {
                                    movSetPosicionGlobal(enemigo, pos.fila, nuevaCol);
                                    enemigo._knockbackUntil = performance.now() + 1500;
                                    if (typeof animarTambaleoKnockback === 'function') animarTambaleoKnockback(enemigo);
                                }
                            }
                        }
                    }
                }, idx * 120);
            });
            // +30% Vel. Ataque a aliados en la trayectoria durante 3s
            const aliadosVivos = (contexto.aliados || []).filter(a => a && a.hp > 0 && !a.muerto);
            const aliadosEnLinea = [];
            for (let c of casillasLinea) {
                const u = movUnidadEnPosicion(c, aliadosVivos);
                if (u && !aliadosEnLinea.includes(u)) aliadosEnLinea.push(u);
            }
            aliadosEnLinea.forEach((aliado) => {
                const base = aliado.bonusAttackSpeed || 1;
                aliado.bonusAttackSpeed = base * 1.30;
                aliado.actualizarStats();
                setTimeout(() => { if (aliado.hp <= 0 || aliado.muerto) return; aliado.bonusAttackSpeed = base; aliado.actualizarStats(); }, 3000);
            });
            if (typeof renderizarCombate === 'function') renderizarCombate();
            return true;
        }
    },

    "golpe-bajo": {
        nombre: "Golpe Bajo",
        tipo: MOV_TIPO.GLOBAL,
        alcance: 8,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_DEBIL,
        sonido: "Golpe Bajo",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.GRAY, shape: null, icono: 'mov:Golpe Bajo', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.GRAY, icono: 'mov:Golpe Bajo', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🌑 ${atacante.pokemon.nombre} adopta postura defensiva con GOLPE BAJO!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 8);
            if (candidatos.length === 0) return false;
            candidatos.sort((a, b) => (a.hp || 0) - (b.hp || 0));
            const objetivoFijado = candidatos[0];
            // 50% reducción de daño recibido durante la postura
            const drOriginal = atacante.bonusDamageReduction;
            atacante.bonusDamageReduction = Math.min(atacante.bonusDamageReduction || 1, 1) * 0.50;
            atacante.actualizarStats();
            atacante._golpeBajo = { activo: true, golpeado: false, objetivo: objetivoFijado };
            if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.GRAY, icono: 'mov:Golpe Bajo', intensidad: 'strong', sizeIcono: 'large', duracionMs: 3000, persistente: true, pulso: true, claseExtra: 'icon-taunt' });
            setTimeout(() => {
                if (atacante.hp <= 0 || atacante.muerto) { atacante.bonusDamageReduction = drOriginal; atacante.actualizarStats(); atacante._golpeBajo = null; return; }
                const fueGolpeado = atacante._golpeBajo && atacante._golpeBajo.golpeado;
                const tgt = objetivoFijado;
                atacante._golpeBajo = null;
                atacante.bonusDamageReduction = drOriginal;
                atacante.actualizarStats();
                if (!tgt || tgt.hp <= 0 || tgt.muerto) return;
                const mult = fueGolpeado ? 5.50 : 4.50;
                const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * mult));
                // "se desplaza hacia el objetivo fijado": se mueve una casilla hacia el rival
                if (fueGolpeado) {
                    const posAtk = movObtenerPosicionGlobal(atacante);
                    const posTgt = movObtenerPosicionGlobal(tgt);
                    if (posAtk && posTgt) {
                        const df = Math.sign(posTgt.fila - posAtk.fila);
                        const dc = Math.sign(posTgt.col - posAtk.col);
                        let nf = posAtk.fila;
                        let nc = posAtk.col;
                        if (Math.abs(posTgt.fila - posAtk.fila) >= Math.abs(posTgt.col - posAtk.col)) nf = posAtk.fila + df;
                        else nc = posAtk.col + dc;
                        if (nf >= 0 && nf < FILAS_ARENA && nc >= 0 && nc < COLUMNAS_GLOBALES) {
                            const ocupadaE = contexto.enemigos.some(e => { if (!e || e === tgt || e.hp <= 0 || e.muerto) return false; const pe = movObtenerPosicionGlobal(e); return pe && pe.fila === nf && pe.col === nc; });
                            const ocupadaA = (contexto.aliados || []).some(a => { if (!a || a === atacante || a.hp <= 0 || a.muerto) return false; const pa = movObtenerPosicionGlobal(a); return pa && pa.fila === nf && pa.col === nc; });
                            if (!ocupadaE && !ocupadaA) {
                                movSetPosicionGlobal(atacante, nf, nc);
                                if (typeof animarTambaleoKnockback === 'function') animarTambaleoKnockback(atacante);
                                if (typeof renderizarCombate === 'function') renderizarCombate();
                            }
                        }
                    }
                }
                if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, tgt, 'rgba(75, 85, 99, 0.95)', 400);
                if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(tgt, { color: MOV_COLOR.GRAY, icono: 'mov:Golpe Bajo', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 });
                movAplicarDaño(atacante, tgt, dañoFinal, fueGolpeado);
                if (fueGolpeado && tgt.hp > 0 && !tgt.muerto) {
                    movAplicarSlow(tgt, 1.00, 1, '(Inmovilizado por Golpe Bajo)');
                    setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(tgt, { color: MOV_COLOR.GRAY, icono: 'mov:Golpe Bajo', intensidad: 'soft', sizeIcono: 'small', duracionMs: 1500, persistente: true, pulso: true }); }, 300);
                }
            }, 3000);
            return true;
        }
    },

    "premonicion-espeon": {
        nombre: "Premonición",
        tipo: MOV_TIPO.AREA,
        alcance: 3,
        area: 2,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Premonición",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.PURPLE, shape: null, icono: 'mov:Premonición', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.PURPLE, icono: 'mov:Premonición', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🔮 ${atacante.pokemon.nombre} usa PREMONICIÓN!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 3);
            if (candidatos.length === 0) return false;
            let objetivoPrincipal = null;
            if (objetivo && candidatos.includes(objetivo)) objetivoPrincipal = objetivo;
            else { candidatos.sort((a, b) => movDistanciaChebyshev(atacante, a) - movDistanciaChebyshev(atacante, b)); objetivoPrincipal = candidatos[0]; }
            const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 2.10));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Premonición', 0.4);
            const posObj = movObtenerPosicionGlobal(objetivoPrincipal);
            if (posObj && typeof movMarcarCasillaGlobal === 'function') movMarcarCasillaGlobal(posObj.fila, posObj.col, { duracionMs: 800 });
            setTimeout(() => {
                const origenObj = movObtenerPosicionGlobal(objetivoPrincipal);
                const enemigosEnArea = (objetivoPrincipal.hp > 0 && !objetivoPrincipal.muerto) ? [objetivoPrincipal] : [];
                if (origenObj) {
                    const casillasArea = movCasillasEnArea(origenObj, 2);
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
                        if (enemigo.hp > 0 && !enemigo.muerto) {
                            movAplicarSlow(enemigo, 0.10, 1.5, '(Premonición de Espeon)');
                        }
                    }, idx * 100);
                });
            }, 500);
            return true;
        }
    },

    "carambano": {
        nombre: "Carámbano",
        tipo: MOV_TIPO.PROYECTIL,
        alcance: 4,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Carámbano",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.CYAN, shape: null, icono: 'mov:Carámbano', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.CYAN, icono: 'mov:Carámbano', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`❄️ ${atacante.pokemon.nombre} usa CARÁMBANO!`);
            if (typeof atacante.esquirlasHielo !== 'number') atacante.esquirlasHielo = 0;
            atacante.esquirlasHielo = Math.min(atacante.esquirlasHielo + 2, 8);
            const esquirlasAhora = atacante.esquirlasHielo;
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.CYAN, icono: 'mov:Carámbano', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 100);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 4);
            if (candidatos.length === 0) return false;
            let objetivoPrincipal = null;
            if (objetivo && candidatos.includes(objetivo)) objetivoPrincipal = objetivo;
            else { candidatos.sort((a, b) => movDistanciaChebyshev(atacante, a) - movDistanciaChebyshev(atacante, b)); objetivoPrincipal = candidatos[0]; }
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Carámbano', 0.4);
            const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 1.50));
            // Las esquirlas atraviesan a los rivales en dirección al oponente actual
            const posAtk = movObtenerPosicionGlobal(atacante);
            const posObj = movObtenerPosicionGlobal(objetivoPrincipal);
            let dir = 'derecha';
            if (posAtk && posObj) {
                const df = posObj.fila - posAtk.fila;
                const dc = posObj.col - posAtk.col;
                if (Math.abs(df) >= Math.abs(dc)) dir = df < 0 ? 'arriba' : 'abajo';
                else dir = dc < 0 ? 'izquierda' : 'derecha';
            }
            const enemigosEnLinea = [];
            if (posAtk) {
                const casillasLinea = movCasillasEnLinea(posAtk, dir, 8);
                for (let c of casillasLinea) {
                    const u = movUnidadEnPosicion(c, enemigosVivos);
                    if (u && !enemigosEnLinea.includes(u)) enemigosEnLinea.push(u);
                }
            }
            if (enemigosEnLinea.length === 0) enemigosEnLinea.push(objetivoPrincipal);
            for (let i = 0; i < esquirlasAhora; i++) {
                setTimeout(() => {
                    enemigosEnLinea.forEach((enemigo, j) => {
                        setTimeout(() => {
                            if (enemigo.hp <= 0 || enemigo.muerto) return;
                            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, enemigo, 'rgba(34, 211, 238, 0.95)', 350);
                            if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.CYAN, icono: 'mov:Carámbano', intensidad: (i === 0 && j === 0) ? 'strong' : 'soft', sizeIcono: (i === 0 && j === 0) ? 'large' : 'small', duracionMs: 400 });
                            movAplicarDaño(atacante, enemigo, dañoFinal, false);
                        }, j * 80);
                    });
                }, i * 120);
            }
            setTimeout(() => { atacante.esquirlasHielo = 0; }, esquirlasAhora * 120 + 200);
            return true;
        }
    },

    "comesuenos": {
        nombre: "Comesueños",
        tipo: MOV_TIPO.PROYECTIL,
        alcance: 8,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Comesueños",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.PURPLE, shape: null, icono: 'mov:Comesueños', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.PURPLE, icono: 'mov:Comesueños', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`💤 ${atacante.pokemon.nombre} usa COMESUEÑOS!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 8);
            if (candidatos.length === 0) return false;
            let objetivoPrincipal = null;
            if (objetivo && candidatos.includes(objetivo)) objetivoPrincipal = objetivo;
            else { candidatos.sort((a, b) => movDistanciaChebyshev(atacante, a) - movDistanciaChebyshev(atacante, b)); objetivoPrincipal = candidatos[0]; }
            const dañoBase = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 2.00));
            const dañoHPRestante = Math.max(1, Math.floor((objetivoPrincipal.hp || 0) * 0.40));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Comesueños', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(168, 85, 247, 0.95)', 450);
            setTimeout(() => {
                if (objetivoPrincipal.hp <= 0 || objetivoPrincipal.muerto) return;
                // "Gengar aparece de inmediato cerca del rival": se teletransporta a una casilla adyacente libre
                const posObjCS = movObtenerPosicionGlobal(objetivoPrincipal);
                const posAtkCS = movObtenerPosicionGlobal(atacante);
                if (posObjCS && posAtkCS && atacante.hp > 0 && !atacante.muerto) {
                    const candidatas = [
                        { fila: posObjCS.fila - 1, col: posObjCS.col - 1 },
                        { fila: posObjCS.fila - 1, col: posObjCS.col     },
                        { fila: posObjCS.fila - 1, col: posObjCS.col + 1 },
                        { fila: posObjCS.fila,     col: posObjCS.col - 1 },
                        { fila: posObjCS.fila,     col: posObjCS.col + 1 },
                        { fila: posObjCS.fila + 1, col: posObjCS.col - 1 },
                        { fila: posObjCS.fila + 1, col: posObjCS.col     },
                        { fila: posObjCS.fila + 1, col: posObjCS.col + 1 }
                    ].filter(c => c.fila >= 0 && c.fila < FILAS_ARENA && c.col >= 0 && c.col < COLUMNAS_GLOBALES);
                    function casillaLibreCS(f, c) {
                        for (let e of contexto.enemigos) { if (!e || e === objetivoPrincipal || e.hp <= 0 || e.muerto) continue; const pe = movObtenerPosicionGlobal(e); if (pe && pe.fila === f && pe.col === c) return false; }
                        for (let a of (contexto.aliados || [])) { if (!a || a === atacante || a.hp <= 0 || a.muerto) continue; const pa = movObtenerPosicionGlobal(a); if (pa && pa.fila === f && pa.col === c) return false; }
                        return true;
                    }
                    candidatas.sort((a, b) => (Math.abs(a.fila - posAtkCS.fila) + Math.abs(a.col - posAtkCS.col)) - (Math.abs(b.fila - posAtkCS.fila) + Math.abs(b.col - posAtkCS.col)));
                    let destinoCS = null;
                    for (let c of candidatas) { if (casillaLibreCS(c.fila, c.col)) { destinoCS = c; break; } }
                    if (destinoCS) {
                        movSetPosicionGlobal(atacante, destinoCS.fila, destinoCS.col);
                        if (typeof animarTambaleoKnockback === 'function') animarTambaleoKnockback(atacante);
                        if (typeof renderizarCombate === 'function') renderizarCombate();
                    }
                }
                if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.PURPLE, icono: 'mov:Comesueños', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 });
                movAplicarDaño(atacante, objetivoPrincipal, dañoBase + dañoHPRestante, false);
                if (objetivoPrincipal.hp > 0 && !objetivoPrincipal.muerto && !objetivoPrincipal.inmuneImpedimentos) {
                    movAplicarSlow(objetivoPrincipal, 1.00, 1, '(Dormido por Comesueños)');
                    setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.PURPLE, icono: 'mov:Comesueños', intensidad: 'soft', sizeIcono: 'small', duracionMs: 1500, persistente: true, pulso: true }); }, 300);
                }
            }, 250);
            return true;
        }
    },

        "hidroariete-kubfu": {
        nombre: "Hidroariete",
        tipo: MOV_TIPO.AREA,
        alcance: 1,
        area: 1,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Hidroariete",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.BLUE, shape: null, icono: 'mov:Hidroariete', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.CYAN, icono: 'mov:Hidroariete', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🌊 ${atacante.pokemon.nombre} usa HIDROARIETE!`);
            const escudo = Math.floor((atacante.ataque || 0) * 4.50);
            if (escudo > 0) {
                atacante.escudoActual = (atacante.escudoActual || 0) + escudo;
                setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.BLUE, icono: 'mov:Hidroariete', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 100);
                actualizarEscudoVisual(atacante);
            }
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            const origen = movObtenerPosicionGlobal(atacante);
            const enemigosCercanos = [];
            if (origen) {
                const casillasArea = movCasillasEnArea(origen, 1);
                for (let c of casillasArea) {
                    const u = movUnidadEnPosicion(c, enemigosVivos);
                    if (u && !enemigosCercanos.includes(u)) enemigosCercanos.push(u);
                }
            }
            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 2.10));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Hidroariete', 0.4);
            enemigosCercanos.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;
                    if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.BLUE, icono: 'mov:Hidroariete', intensidad: 'strong', sizeIcono: 'large', duracionMs: 700 });
                    movAplicarDaño(atacante, enemigo, dañoFinal, false);
                }, idx * 100);
            });
            return true;
        }
    },

    "luz-lunar": {
        nombre: "Luz Lunar",
        tipo: MOV_TIPO.AREA,
        alcance: 1,
        area: 1,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Luz Lunar",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.PINK, shape: null, icono: 'mov:Luz Lunar', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.PINK, icono: 'mov:Luz Lunar', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🌙 ${atacante.pokemon.nombre} usa LUZ LUNAR!`);
            const aliadosVivos = (contexto.aliados || []).filter(a => a && a.hp > 0 && !a.muerto);
            const origen = movObtenerPosicionGlobal(atacante);
            const curacionTotal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 0.80));
            const aliadosCercanos = [];
            if (origen) {
                const casillasArea = movCasillasEnArea(origen, 1);
                for (let c of casillasArea) {
                    const u = movUnidadEnPosicion(c, aliadosVivos);
                    if (u && !aliadosCercanos.includes(u)) aliadosCercanos.push(u);
                }
            }
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Luz Lunar', 0.4);
            const objetivos = [...aliadosCercanos];
            if (!objetivos.includes(atacante)) objetivos.push(atacante);
            const NUM_TICKS = 3;
            const curaPorTick = Math.max(1, Math.floor(curacionTotal / NUM_TICKS));
            for (let i = 0; i < NUM_TICKS; i++) {
                setTimeout(() => {
                    for (let u of objetivos) {
                        if (u.hp <= 0 || u.muerto) continue;
                        if (typeof movCurar === 'function') movCurar(u, curaPorTick);
                        else u.hp = Math.min(u.maxHp, u.hp + curaPorTick);
                    }
                    if (i === 0 && typeof movMostrarEfectoVisual === 'function') {
                        movMostrarEfectoVisual(atacante, { color: MOV_COLOR.PINK, icono: 'mov:Luz Lunar', intensidad: 'soft', sizeIcono: 'small', duracionMs: 1500 });
                    }
                }, i * 1000);
            }
            return true;
        }
    },

    "canto-mortal": {
        nombre: "Canto Mortal",
        tipo: MOV_TIPO.AREA,
        alcance: 1,
        area: 1,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Canto Mortal",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.BLUE, shape: null, icono: 'mov:Canto Mortal', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.CYAN, icono: 'mov:Canto Mortal', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🎵 ${atacante.pokemon.nombre} usa CANTO MORTAL!`);
            // Aumenta Defensa y Def. Esp. en 2200
            const defBase = atacante.defensa || 0;
            const spDefBase = atacante.defensaEspecial || 0;
            atacante.defensa = defBase + 2200;
            atacante.defensaEspecial = spDefBase + 2200;
            atacante.actualizarStats();
            setTimeout(() => { if (atacante.hp <= 0 || atacante.muerto) return; atacante.defensa = defBase; atacante.defensaEspecial = spDefBase; atacante.actualizarStats(); }, 6000);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            const origen = movObtenerPosicionGlobal(atacante);
            const enemigosCercanos = [];
            if (origen) {
                const casillasArea = movCasillasEnArea(origen, 1);
                for (let c of casillasArea) {
                    const u = movUnidadEnPosicion(c, enemigosVivos);
                    if (u && !enemigosCercanos.includes(u)) enemigosCercanos.push(u);
                }
            }
            const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 0.60));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Canto Mortal', 0.4);
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    for (let enemigo of enemigosCercanos) {
                        if (enemigo.hp <= 0 || enemigo.muerto) continue;
                        if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.BLUE, icono: 'mov:Canto Mortal', intensidad: i === 0 ? 'strong' : 'soft', sizeIcono: i === 0 ? 'large' : 'small', duracionMs: 400 });
                        movAplicarDaño(atacante, enemigo, dañoFinal, false);
                    }
                }, i * 300);
            }
            // Los enemigos alcanzados no pueden usar movimientos durante 4s
            enemigosCercanos.forEach((enemigo) => {
                if (enemigo.hp <= 0 || enemigo.muerto) return;
                enemigo._silenciadoHasta = performance.now() + 4000;
                setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.CYAN, icono: 'mov:Canto Mortal', intensidad: 'soft', sizeIcono: 'small', duracionMs: 4000, persistente: true, pulso: true, claseExtra: 'icon-poison' }); }, 300);
            });
            return true;
        }
    },

    "rayo-carga-zapdos": {
        nombre: "Rayo Carga",
        tipo: MOV_TIPO.AREA,
        alcance: 3,
        area: 1,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Rayo Carga",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.YELLOW, shape: null, icono: 'mov:Rayo Carga', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.YELLOW, icono: 'mov:Rayo Carga', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`⚡ ${atacante.pokemon.nombre} usa RAYO CARGA!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            // "Barre un área de 120° al frente": solo alcanza a los rivales de delante
            const esJugador = atacante.equipo === 'player';
            const posAtk = movObtenerPosicionGlobal(atacante);
            const candidatos = enemigosVivos.filter(e => {
                if (movDistanciaChebyshev(atacante, e) > 3) return false;
                if (!posAtk) return true;
                const pe = movObtenerPosicionGlobal(e);
                if (!pe) return false;
                const dCol = esJugador ? (pe.col - posAtk.col) : (posAtk.col - pe.col);
                return dCol >= 0;
            });
            if (candidatos.length === 0) return false;
            const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 2.20));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Rayo Carga', 0.4);
            candidatos.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto) return;
                    if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, enemigo, 'rgba(250, 204, 21, 0.95)', 350);
                    if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.YELLOW, icono: 'mov:Rayo Carga', intensidad: 'strong', sizeIcono: 'large', duracionMs: 700 });
                    movAplicarDaño(atacante, enemigo, dañoFinal, false);
                    // Reduce Def. Esp. 20%, acumulándose hasta 4 veces
                    if (enemigo.hp > 0 && !enemigo.muerto) {
                        if (enemigo._spDefBaseRayo === undefined) enemigo._spDefBaseRayo = enemigo.defensaEspecial || 0;
                        enemigo._rayoCargaStacks = Math.min(4, (enemigo._rayoCargaStacks || 0) + 1);
                        enemigo.defensaEspecial = Math.max(0, Math.floor(enemigo._spDefBaseRayo * (1 - 0.20 * enemigo._rayoCargaStacks)));
                        enemigo.actualizarStats();
                        if (enemigo._rayoCargaResetTimer) clearTimeout(enemigo._rayoCargaResetTimer);
                        enemigo._rayoCargaResetTimer = setTimeout(() => {
                            if (enemigo.hp <= 0 || enemigo.muerto) return;
                            enemigo.defensaEspecial = enemigo._spDefBaseRayo;
                            enemigo._rayoCargaStacks = 0;
                            delete enemigo._spDefBaseRayo;
                            enemigo.actualizarStats();
                        }, 5000);
                    }
                }, idx * 100);
            });
            return true;
        }
    },

    // ============================================================
    // MOVIMIENTOS COSTE 4 - SECUNDARIOS
    // ============================================================

    "enfado": {
        nombre: "Enfado",
        tipo: MOV_TIPO.GLOBAL,
        alcance: 3,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Enfado",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.PURPLE, shape: null, icono: 'mov:Enfado', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.RED, icono: 'mov:Enfado', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🐉 ${atacante.pokemon.nombre} usa ENFADO!`);
            const DURACION = 8;
            const velOriginal = atacante.bonusAttackSpeed || 1;
            atacante.bonusAttackSpeed = velOriginal * 1.40;
            const atkOriginal = atacante.bonusAttack || 1;
            atacante.bonusAttack = atkOriginal * 1.80;
            atacante.actualizarStats();
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Enfado', 0.4);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.PURPLE, icono: 'mov:Enfado', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 100);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.RED, icono: 'mov:Enfado', intensidad: 'soft', sizeIcono: 'small', duracionMs: DURACION * 1000, persistente: true, pulso: true }); }, 400);
            setTimeout(() => { if (atacante.hp <= 0 || atacante.muerto) return; atacante.bonusAttackSpeed = velOriginal; atacante.bonusAttack = atkOriginal; atacante.actualizarStats(); }, DURACION * 1000);
            return true;
        }
    },

    "acua-cola": {
        nombre: "Acua Cola",
        tipo: MOV_TIPO.LINEAL,
        alcance: 3,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Acua Cola",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.BLUE, shape: null, icono: 'mov:Acua Cola', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.CYAN, icono: 'mov:Acua Cola', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`💧 ${atacante.pokemon.nombre} usa ACUA COLA!`);
            const esJugador = atacante.equipo === 'player';
            const dir = esJugador ? 'derecha' : 'izquierda';
            const origen = movObtenerPosicionGlobal(atacante);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            const enemigosEnCamino = [];
            if (origen) {
                const casillasLinea = movCasillasEnLinea(origen, dir, 8);
                for (const c of casillasLinea) {
                    const u = movUnidadEnPosicion(c, enemigosVivos);
                    if (u && !enemigosEnCamino.includes(u)) enemigosEnCamino.push(u);
                }
            }
            if (enemigosEnCamino.length === 0) {
                const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 3);
                if (candidatos.length > 0) {
                    candidatos.sort((a, b) => movDistanciaManhattan(atacante, a) - movDistanciaManhattan(atacante, b));
                    enemigosEnCamino.push(candidatos[0]);
                }
            }
            if (enemigosEnCamino.length === 0) return false;
            const dañoGolpe = Math.max(1, Math.floor((atacante.ataque || 0) * 1.60));
            const curacion = Math.max(1, Math.floor((atacante.ataque || 0) * 1.80));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Acua Cola', 0.4);
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    if (atacante.hp <= 0 || atacante.muerto) return;
                    for (const enemigo of enemigosEnCamino) {
                        if (enemigo.hp <= 0 || enemigo.muerto) continue;
                        if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.BLUE, icono: 'mov:Acua Cola', intensidad: i === 0 ? 'strong' : 'soft', sizeIcono: i === 0 ? 'large' : 'small', duracionMs: 500 });
                        movAplicarDaño(atacante, enemigo, dañoGolpe, false);
                    }
                    if (typeof movCurar === 'function') movCurar(atacante, curacion);
                }, i * 250);
            }
            return true;
        }
    },

    "bola-sombra": {
        nombre: "Bola Sombra",
        tipo: MOV_TIPO.PROYECTIL,
        alcance: 3,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Bola Sombra",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.PURPLE, shape: null, icono: 'mov:Bola Sombra', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.PURPLE, icono: 'mov:Bola Sombra', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🌑 ${atacante.pokemon.nombre} usa BOLA SOMBRA!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 3);
            if (candidatos.length === 0) return false;
            let obj = null;
            if (objetivo && candidatos.includes(objetivo)) obj = objetivo;
            else { candidatos.sort((a, b) => movDistanciaChebyshev(atacante, a) - movDistanciaChebyshev(atacante, b)); obj = candidatos[0]; }
            const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 1.00));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Bola Sombra', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, obj, 'rgba(126, 34, 206, 0.95)', 400);
            setTimeout(() => {
                if (obj.hp <= 0 || obj.muerto) return;
                if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(obj, { color: MOV_COLOR.PURPLE, icono: 'mov:Bola Sombra', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 });
                movAplicarDaño(atacante, obj, dañoFinal, false);
                if (obj.hp > 0 && !obj.muerto) {
                    const now = performance.now();
                    obj._curacionBloqueadaHasta = now + 4000;
                    obj._dañoAmplificadoHasta = now + 4000;
                    setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(obj, { color: MOV_COLOR.PURPLE, icono: 'mov:Bola Sombra', intensidad: 'soft', sizeIcono: 'small', duracionMs: 4000, persistente: true, pulso: true }); }, 300);
                }
            }, 250);
            return true;
        }
    },

    "bostezo": {
        nombre: "Bostezo",
        tipo: MOV_TIPO.AREA,
        alcance: 2,
        area: 2,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Bostezo",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.PINK, shape: null, icono: 'mov:Bostezo', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.PINK, icono: 'mov:Bostezo', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`💤 ${atacante.pokemon.nombre} usa BOSTEZO!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const origen = movObtenerPosicionGlobal(atacante);
            const enemigosCercanos = [];
            if (origen) {
                for (const c of movCasillasEnArea(origen, 2)) {
                    const u = movUnidadEnPosicion(c, enemigosVivos);
                    if (u && !enemigosCercanos.includes(u)) enemigosCercanos.push(u);
                }
            }
            if (enemigosCercanos.length === 0) {
                const candidatos = enemigosVivos.filter(e => movDistanciaChebyshev(atacante, e) <= 2);
                if (candidatos.length > 0) {
                    candidatos.sort((a, b) => movDistanciaManhattan(atacante, a) - movDistanciaManhattan(atacante, b));
                    enemigosCercanos.push(candidatos[0]);
                } else return false;
            }
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Bostezo', 0.4);
            enemigosCercanos.forEach((enemigo, idx) => {
                setTimeout(() => {
                    if (enemigo.hp <= 0 || enemigo.muerto || enemigo.inmuneImpedimentos) return;
                    movAplicarSlow(enemigo, 1.00, 3.5, '(Dormido por Bostezo)');
                    setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.PINK, icono: 'mov:Bostezo', intensidad: 'soft', sizeIcono: 'small', duracionMs: 3500, persistente: true, pulso: true }); }, 300);
                }, idx * 100);
            });
            return true;
        }
    },

    "vozarron": {
        nombre: "Vozarrón",
        tipo: MOV_TIPO.AREA,
        alcance: 3,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Vozarrón",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.PINK, shape: null, icono: 'mov:Vozarrón', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.PINK, icono: 'mov:Vozarrón', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`📢 ${atacante.pokemon.nombre} usa VOZARRÓN!`);
            if (typeof atacante._vozarronUsos !== 'number') atacante._vozarronUsos = 0;
            atacante._vozarronUsos += 1;
            const duracion = Math.min(1.5 + (atacante._vozarronUsos - 1) * 0.5, 2.5);
            const esJugador = atacante.equipo === 'player';
            const deltaCol = esJugador ? 1 : -1;
            const origen = movObtenerPosicionGlobal(atacante);
            const dañoFinal = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 0.25));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Vozarrón', 0.4);
            function enemigosEnCono() {
                const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
                const res = [];
                if (!origen) return res;
                for (let d = 1; d <= 3; d++) {
                    const col = origen.col + deltaCol * d;
                    for (const fila of [origen.fila - 1, origen.fila, origen.fila + 1]) {
                        const u = movUnidadEnPosicion({ fila, col }, enemigosVivos);
                        if (u && !res.includes(u)) res.push(u);
                    }
                }
                return res;
            }
            const numTicks = Math.max(1, Math.round(duracion / 0.5));
            for (let i = 0; i < numTicks; i++) {
                setTimeout(() => {
                    if (atacante.hp <= 0 || atacante.muerto) return;
                    for (const enemigo of enemigosEnCono()) {
                        if (enemigo.hp <= 0 || enemigo.muerto) continue;
                        if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.PINK, icono: 'mov:Vozarrón', intensidad: i === 0 ? 'strong' : 'soft', sizeIcono: i === 0 ? 'large' : 'small', duracionMs: 400 });
                        movAplicarDaño(atacante, enemigo, dañoFinal, false);
                    }
                }, i * 500);
            }
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.PINK, icono: 'mov:Vozarrón', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 100);
            return true;
        }
    },

    "tormenta-de-arena": {
        nombre: "Tormenta de Arena",
        tipo: MOV_TIPO.AREA,
        alcance: 1,
        area: 1,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Tormenta de Arena",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.GRAY, shape: null, icono: 'mov:Tormenta de Arena', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.GRAY, icono: 'mov:Tormenta de Arena', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🏜️ ${atacante.pokemon.nombre} usa TORMENTA DE ARENA!`);
            const DURACION = 3;
            const lsOriginal = atacante.lifesteal || 0;
            atacante.lifesteal = lsOriginal + 0.50;
            setTimeout(() => { if (atacante) atacante.lifesteal = lsOriginal; }, DURACION * 1000);
            const dañoTotal = Math.max(1, Math.floor((atacante.ataque || 0) * 0.65));
            const dañoPorTick = Math.max(1, Math.floor(dañoTotal / DURACION));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Tormenta de Arena', 0.4);
            for (let i = 0; i < DURACION; i++) {
                setTimeout(() => {
                    if (atacante.hp <= 0 || atacante.muerto) return;
                    const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
                    const enemigosCercanos = [];
                    const or = movObtenerPosicionGlobal(atacante);
                    if (or) {
                        for (const c of movCasillasEnArea(or, 1)) {
                            const u = movUnidadEnPosicion(c, enemigosVivos);
                            if (u && !enemigosCercanos.includes(u)) enemigosCercanos.push(u);
                        }
                    }
                    for (const enemigo of enemigosCercanos) {
                        if (enemigo.hp <= 0 || enemigo.muerto) continue;
                        if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.GRAY, icono: 'mov:Tormenta de Arena', intensidad: i === 0 ? 'strong' : 'soft', sizeIcono: i === 0 ? 'large' : 'small', duracionMs: 400 });
                        movAplicarDaño(atacante, enemigo, dañoPorTick, false);
                    }
                }, i * 1000);
            }
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.GRAY, icono: 'mov:Tormenta de Arena', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 }); }, 100);
            return true;
        }
    },

    // ============================================================
    // MOVIMIENTOS COSTE 5 - SECUNDARIOS
    // ============================================================

    "giro-fuego-ho-oh": {
        nombre: "Giro Fuego Ho-Oh",
        tipo: MOV_TIPO.AREA,
        alcance: 1,
        area: 1,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Giro Fuego Ho-Oh",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.ORANGE, shape: null, icono: 'mov:Giro Fuego Ho-Oh', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.ORANGE, icono: 'mov:Giro Fuego Ho-Oh', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🔥 ${atacante.pokemon.nombre} usa GIRO FUEGO HO-OH!`);
            // "gran escudo" = 100% de HP máx
            const escudo = Math.floor(atacante.maxHp * 1.00);
            if (escudo > 0) {
                atacante.escudoActual = (atacante.escudoActual || 0) + escudo;
                if (typeof actualizarEscudoVisual === 'function') actualizarEscudoVisual(atacante);
            }
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Giro Fuego Ho-Oh', 0.4);
            // daño continuo: total 225% de Ataque repartido en 3 ticks (1/seg)
            const DURACION = 3;
            const dañoTotal = Math.max(1, Math.floor((atacante.ataque || 0) * 2.25));
            const dañoPorTick = Math.max(1, Math.floor(dañoTotal / DURACION));
            for (let i = 0; i < DURACION; i++) {
                setTimeout(() => {
                    if (atacante.hp <= 0 || atacante.muerto) return;
                    const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
                    const or = movObtenerPosicionGlobal(atacante);
                    const enemigosCercanos = [];
                    if (or) {
                        for (const c of movCasillasEnArea(or, 1)) {
                            const u = movUnidadEnPosicion(c, enemigosVivos);
                            if (u && !enemigosCercanos.includes(u)) enemigosCercanos.push(u);
                        }
                    }
                    for (const enemigo of enemigosCercanos) {
                        if (enemigo.hp <= 0 || enemigo.muerto) continue;
                        if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.ORANGE, icono: 'mov:Giro Fuego Ho-Oh', intensidad: i === 0 ? 'strong' : 'soft', sizeIcono: i === 0 ? 'large' : 'small', duracionMs: 400 });
                        movAplicarDaño(atacante, enemigo, dañoPorTick, false);
                    }
                }, i * 1000);
            }
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.ORANGE, icono: 'mov:Giro Fuego Ho-Oh', intensidad: 'strong', sizeIcono: 'large', duracionMs: 1200 }); }, 100);
            return true;
        }
    },

    "psicoonda": {
        nombre: "Psicoonda",
        tipo: MOV_TIPO.PROYECTIL,
        alcance: 8,
        area: 0,
        prioridad: MOV_PRIORIDAD.ALEATORIO,
        sonido: "Psicoonda",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.PURPLE, shape: null, icono: 'mov:Psicoonda', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.PURPLE, icono: 'mov:Psicoonda', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`🔮 ${atacante.pokemon.nombre} usa PSICOONDA!`);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            if (enemigosVivos.length === 0) return false;
            const objetivoPrincipal = enemigosVivos[Math.floor(Math.random() * enemigosVivos.length)];
            const dañoFinal = Math.max(1, Math.floor((atacante.ataque || 0) * 2.50));
            // reducir el daño del rival un 20% hasta el final de la ronda
            const dmgOrig = objetivoPrincipal.bonusDamage || 1;
            objetivoPrincipal.bonusDamage = dmgOrig * 0.80;
            objetivoPrincipal.actualizarStats();
            // 60% de reducción de daño para Mewtwo (hasta el final de la ronda)
            atacante.bonusDamageReduction = (atacante.bonusDamageReduction || 1) * 0.40;
            // megaevolución a Mega-Mewtwo X (hasta el final de la ronda)
            atacante.spriteIdAlternativo = "mega-mewtwo-x";
            atacante._teletransporteAtkBonus = 1.30;
            atacante._teletransporteSpAtkBonus = 1.30;
            atacante._teletransporteVelBonus = 2.00;
            atacante._teletransporteDefBonus = 400;
            atacante._teletransporteSpDefBonus = 400;
            atacante.actualizarStats();
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Psicoonda', 0.4);
            if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, objetivoPrincipal, 'rgba(168, 85, 247, 0.95)', 450);
            setTimeout(() => {
                if (objetivoPrincipal.hp <= 0 || objetivoPrincipal.muerto) return;
                if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(objetivoPrincipal, { color: MOV_COLOR.PURPLE, icono: 'mov:Psicoonda', intensidad: 'strong', sizeIcono: 'large', duracionMs: 900 });
                movAplicarDaño(atacante, objetivoPrincipal, dañoFinal, false);
            }, 250);
            setTimeout(() => { if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(atacante, { color: MOV_COLOR.PURPLE, icono: 'mov:Psicoonda', intensidad: 'strong', sizeIcono: 'large', duracionMs: 1200, persistente: false }); }, 100);
            return true;
        }
    },

    "rayo-carga-miraidon": {
        nombre: "Rayo Carga",
        tipo: MOV_TIPO.LINEAL,
        alcance: 4,
        area: 0,
        prioridad: MOV_PRIORIDAD.MAS_CERCANO,
        sonido: "Rayo Carga",
        volumenSonido: 0.4,
        efecto: { color: MOV_COLOR.YELLOW, shape: null, icono: 'mov:Rayo Carga', intensidad: 'strong', sizeIcono: 'large' },
        efectoSecundario: { color: MOV_COLOR.YELLOW, icono: 'mov:Rayo Carga', intensidad: 'soft', sizeIcono: 'small' },
        ejecutar: function(atacante, objetivo, contexto) {
            const log = (msg) => { if (typeof addConsoleMessage === 'function') addConsoleMessage(msg, 'battle'); else console.log(msg); };
            log(`⚡ ${atacante.pokemon.nombre} usa RAYO CARGA!`);
            const esJugador = atacante.equipo === 'player';
            const dir = esJugador ? 'derecha' : 'izquierda';
            const origen = movObtenerPosicionGlobal(atacante);
            const enemigosVivos = contexto.enemigos.filter(e => e && e.hp > 0 && !e.muerto);
            const enemigosEnLinea = [];
            if (origen) {
                for (const c of movCasillasEnLinea(origen, dir, 4)) {
                    const u = movUnidadEnPosicion(c, enemigosVivos);
                    if (u && !enemigosEnLinea.includes(u)) enemigosEnLinea.push(u);
                }
            }
            if (enemigosEnLinea.length === 0) return false;
            enemigosEnLinea.sort((a, b) => movDistanciaManhattan(atacante, a) - movDistanciaManhattan(atacante, b));
            const objetivoActual = enemigosEnLinea[0];
            const dañoGolpe = Math.max(1, Math.floor((atacante.ataqueEspecial || 0) * 0.35));
            if (typeof playSonidoMovimiento === 'function') playSonidoMovimiento('Rayo Carga', 0.4);
            // "Usa continuamente hasta que el objetivo sea eliminado"
            function disparar() {
                if (atacante.hp <= 0 || atacante.muerto) return;
                if (objetivoActual.hp <= 0 || objetivoActual.muerto) return;
                for (const enemigo of enemigosEnLinea) {
                    if (enemigo.hp <= 0 || enemigo.muerto) continue;
                    if (typeof movMostrarLineaProyectil === 'function') movMostrarLineaProyectil(atacante, enemigo, 'rgba(250, 204, 21, 0.95)', 300);
                    if (typeof movMostrarEfectoVisual === 'function') movMostrarEfectoVisual(enemigo, { color: MOV_COLOR.YELLOW, icono: 'mov:Rayo Carga', intensidad: 'soft', sizeIcono: 'small', duracionMs: 400 });
                    movAplicarDaño(atacante, enemigo, dañoGolpe, false);
                }
                setTimeout(disparar, 400);
            }
            disparar();
            return true;
        }
    }
});

console.log("✅ movimientos-registro-*.js cargados -", Object.keys(MOVIMIENTOS_REGISTRO).length, "movimientos registrados");
