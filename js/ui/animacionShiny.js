// ============================================================
// ANIMACIÓN DE SHINY EN LA TIENDA - v7 (sin emoji ✨)
// ============================================================
// Timing:
//   0.0s  overlay negro fade in
//   0.0s  🔊 PAUSAR música de preparación
//   0.3s  carta pop + silueta + 🔊 ARPEGIO SHINY
//   0.5s – 2.5s  SILUETA NEGRA con temblor (2s completos)
//   2.5s – 2.8s  flicker rápido silueta ↔ shiny (~4 parpadeos)
//   2.8s  revelación con flash radial
//   3.2s  sprite shiny + nombre + banner
//   3.35s 🔊 GRITO DEL POKÉMON
//   4.5s  overlay fade out
//   4.8s  🔊 REANUDAR música de preparación
// ============================================================

function animarShinyTienda(pokemon) {
    return new Promise((resolve) => {
        if (!pokemon || !pokemon.nombre) {
            resolve();
            return;
        }

        const nombre = pokemon.nombre;
        const spriteId = pokemon.spriteId || pokemon.id;
        let spriteUrl = '';
        try {
            if (typeof getSpriteUrl === 'function') {
                spriteUrl = getSpriteUrl(spriteId, nombre, true);
            } else {
                spriteUrl = `assets/sprites/pokemon/shiny/${spriteId}.gif`;
            }
        } catch (e) {
            spriteUrl = `assets/sprites/pokemon/shiny/${spriteId}.gif`;
        }

        // ============================================================
        // 0) 🔊 PAUSAR MÚSICA DE PREPARACIÓN
        // ============================================================
        if (typeof pausarMusicaPreparacion === 'function') {
    pausarMusicaPreparacion();
}

        // ============================================================
        // 1) OVERLAY NEGRO
        // ============================================================
        const overlay = document.createElement('div');
        overlay.id = 'shinyOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            width: 100vw; height: 100vh;
            z-index: 9999999;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #000000;
            opacity: 0;
            pointer-events: none;
            animation: shinyOverlayFadeIn 0.4s ease-out forwards;
            font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
            isolation: isolate;
        `;
        document.body.appendChild(overlay);

        // ============================================================
        // 2) CARTA CONTENEDORA
        // ============================================================
        const carta = document.createElement('div');
        carta.style.cssText = `
            position: relative;
            width: min(320px, 85vw);
            height: min(400px, 72vh);
            background: linear-gradient(145deg, #1a2236, #0f172a);
            border-radius: 24px;
            border: 3px solid rgba(251, 191, 36, 0.75);
            box-shadow:
                0 0 40px rgba(251, 191, 36, 0.6),
                0 0 80px rgba(139, 92, 246, 0.4),
                0 30px 80px rgba(0, 0, 0, 0.9),
                inset 0 0 60px rgba(0, 0, 0, 0.5);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 14px;
            padding: 24px;
            opacity: 0;
            transform: scale(0.3);
            animation: shinyCardPop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s forwards;
            overflow: visible;
        `;
        overlay.appendChild(carta);

        // Glow pulsante detrás de la carta
        const glowCarta = document.createElement('div');
        glowCarta.style.cssText = `
            position: absolute;
            inset: -20px;
            border-radius: 32px;
            background: radial-gradient(circle, rgba(251, 191, 36, 0.25) 0%, transparent 70%);
            box-shadow:
                0 0 60px rgba(251, 191, 36, 0.6),
                0 0 120px rgba(139, 92, 246, 0.4);
            animation: shinyGlowPulse 1.2s ease-in-out infinite;
            z-index: 0;
            pointer-events: none;
        `;
        carta.appendChild(glowCarta);

        // ============================================================
        // 3) SPRITE (silueta → shiny) - SIN emoji ✨
        // ============================================================
        const spriteWrap = document.createElement('div');
        spriteWrap.style.cssText = `
            position: relative;
            width: 200px;
            height: 200px;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
        `;

        const sprite = document.createElement('img');
        sprite.src = spriteUrl;
        sprite.alt = nombre;
        sprite.draggable = false;
        sprite.style.cssText = `
            width: 170px;
            height: 170px;
            object-fit: contain;
            image-rendering: pixelated;
            filter: brightness(0) drop-shadow(0 0 18px rgba(251, 191, 36, 1)) drop-shadow(0 0 35px rgba(251, 191, 36, 0.6));
            animation: shinySiluetaTemblor 0.35s ease-in-out infinite;
            transition: opacity 0.08s ease, filter 0.4s ease;
            z-index: 10;
            opacity: 1;
        `;
        sprite.onerror = function() {
            console.warn('⚠️ animarShinyTienda: no se pudo cargar el sprite shiny:', this.src);
            this.style.opacity = '0';
        };
        spriteWrap.appendChild(sprite);

        carta.appendChild(spriteWrap);

        // ============================================================
        // 4) TEXTO "¡SHINY!" + NOMBRE (ocultos hasta la revelación)
        // ============================================================
        const nombreEl = document.createElement('div');
        nombreEl.textContent = nombre;
        nombreEl.style.cssText = `
            font-size: 1.5rem;
            font-weight: 900;
            color: #ffffff;
            text-shadow:
                0 0 20px rgba(251, 191, 36, 0.9),
                0 2px 8px rgba(0, 0, 0, 0.9);
            letter-spacing: 1px;
            opacity: 0;
            transform: scale(0.5);
            transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            z-index: 20;
            text-align: center;
        `;
        carta.appendChild(nombreEl);

        const bannerEvol = document.createElement('div');
        bannerEvol.textContent = '✨ ¡SHINY! ✨';
        bannerEvol.style.cssText = `
            font-size: 1rem;
            font-weight: 900;
            color: #fbbf24;
            letter-spacing: 3px;
            text-shadow:
                0 0 15px rgba(251, 191, 36, 1),
                0 2px 6px rgba(0, 0, 0, 0.9);
            opacity: 0;
            transform: translateY(10px);
            transition: opacity 0.4s ease, transform 0.4s ease;
            z-index: 20;
        `;
        carta.appendChild(bannerEvol);

        // ============================================================
        // 5) 🔊 SONIDO SHINY AL INICIO (0.3s)
        // ============================================================
        setTimeout(() => {
            if (typeof playSonidoShinyAparece === 'function') {
                playSonidoShinyAparece(0.55);
            }
        }, 300);

        // ============================================================
        // 6) FASE 1: SILUETA NEGRA (0.5s → 2.5s) - SIN FLICKER
        // ============================================================

        // ============================================================
        // 7) FASE 2: FLICKER RÁPIDO (2.5s → 2.8s) - 4 parpadeos
        // ============================================================
        let flickerActivo = false;
        let mostrandoShiny = false;
        let flickerInterval = null;

        setTimeout(() => {
            flickerActivo = true;
            flickerInterval = setInterval(() => {
                if (!flickerActivo || !sprite || !sprite.parentNode) {
                    clearInterval(flickerInterval);
                    return;
                }
                mostrandoShiny = !mostrandoShiny;
                if (mostrandoShiny) {
                    sprite.style.filter = 'drop-shadow(0 0 30px rgba(251, 191, 36, 1)) drop-shadow(0 0 60px rgba(251, 191, 36, 0.8))';
                } else {
                    sprite.style.filter = 'brightness(0) drop-shadow(0 0 18px rgba(251, 191, 36, 1)) drop-shadow(0 0 35px rgba(251, 191, 36, 0.6))';
                }
            }, 80);
        }, 2500);

        // ============================================================
        // 8) FASE 3: REVELACIÓN (2.8s)
        // ============================================================
        setTimeout(() => {
            flickerActivo = false;
            if (flickerInterval) clearInterval(flickerInterval);

            sprite.style.marginLeft = '0px';
            sprite.style.marginTop = '0px';
            sprite.style.filter = 'brightness(3) saturate(0) drop-shadow(0 0 30px rgba(255, 255, 255, 1)) drop-shadow(0 0 60px rgba(255, 255, 255, 0.7))';
            sprite.style.animation = 'shinySiluetaTemblor 0.15s ease-in-out infinite';

            const flashRadial = document.createElement('div');
            flashRadial.style.cssText = `
                position: absolute;
                left: 50%;
                top: 50%;
                width: 400px;
                height: 400px;
                margin-left: -200px;
                margin-top: -200px;
                border-radius: 50%;
                background: radial-gradient(circle,
                    rgba(255, 255, 255, 1) 0%,
                    rgba(255, 255, 255, 0.9) 20%,
                    rgba(255, 220, 120, 0.7) 45%,
                    rgba(251, 191, 36, 0.4) 65%,
                    transparent 85%);
                pointer-events: none;
                z-index: 25;
                animation: shinyFlashRadial 1.4s ease-out forwards;
            `;
            carta.appendChild(flashRadial);
            setTimeout(() => { if (flashRadial.parentNode) flashRadial.remove(); }, 1400);
        }, 2800);

        // ============================================================
        // 9) FASE 4: SPRITE SHINY VISIBLE + TEXTO + GRITO (3.2s)
        // ============================================================
        setTimeout(() => {
            sprite.style.filter = 'drop-shadow(0 0 25px rgba(251, 191, 36, 1)) drop-shadow(0 0 50px rgba(251, 191, 36, 0.7))';
            sprite.style.animation = 'shinyRevealPop 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';

            nombreEl.style.opacity = '1';
            nombreEl.style.transform = 'scale(1)';

            bannerEvol.style.opacity = '1';
            bannerEvol.style.transform = 'translateY(0)';

            // 🔊 GRITO DEL POKÉMON (150ms después del flash)
            setTimeout(() => {
                if (typeof playPokemonCry === 'function' && spriteId) {
                    playPokemonCry(spriteId);
                }
            }, 150);
        }, 3200);

        // ============================================================
        // 10) CIERRE (4.5s) + 🔊 REANUDAR MÚSICA (4.8s)
        // ============================================================
        setTimeout(() => {
            overlay.style.animation = 'shinyOverlayFadeOut 0.3s ease-out forwards';
            setTimeout(() => {
                if (overlay.parentNode) overlay.remove();

                // 🔊 Reanudar música AHORA (grito ya terminado, tienda abriéndose)
                if (typeof reanudarMusicaPreparacion === 'function') {
    reanudarMusicaPreparacion();
}

                resolve();
            }, 300);
        }, 4500);
    });
}

// ============================================================
// KEYFRAMES DINÁMICOS (se inyectan una sola vez)
// ============================================================
(function _inyectarKeyframesShiny() {
    if (document.getElementById('shiny-keyframes')) return;
    const style = document.createElement('style');
    style.id = 'shiny-keyframes';
    style.textContent = `
        @keyframes shinyOverlayFadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
        }
        @keyframes shinyOverlayFadeOut {
            0% { opacity: 1; }
            100% { opacity: 0; }
        }
        @keyframes shinyCardPop {
            0% { opacity: 0; transform: scale(0.3) rotate(-8deg); }
            60% { opacity: 1; transform: scale(1.08) rotate(2deg); }
            80% { transform: scale(0.96) rotate(-1deg); }
            100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes shinyGlowPulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
        }
        @keyframes shinySiluetaTemblor {
            0%, 100% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(-3px, 2px) scale(1.01); }
            50% { transform: translate(3px, -2px) scale(1.01); }
            75% { transform: translate(-2px, -1px) scale(1.01); }
        }
        @keyframes shinyFlashRadial {
            0% { opacity: 0; transform: scale(0.2); }
            20% { opacity: 1; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.15); }
            100% { opacity: 0; transform: scale(1.6); }
        }
        @keyframes shinyRevealPop {
            0% { transform: scale(0.6) rotate(-8deg); opacity: 0.5; }
            50% { transform: scale(1.2) rotate(3deg); opacity: 1; }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
})();

window.animarShinyTienda = animarShinyTienda;
