// ============================================================
// UI - SISTEMA DE CONSOLA
// ============================================================
// Los mensajes se imprimen SIEMPRE en la consola del navegador (F12).
// Si existe <div id="consoleMessages"> en el DOM, también se
// renderizan ahí (opcional, no obligatorio).
// ============================================================

function addConsoleMessage(text, type = 'info', showTime = true) {
    // ============================================================
    // 1) IMPRIMIR SIEMPRE EN LA CONSOLA DEL NAVEGADOR (F12)
    // ============================================================
    const time = showTime ? new Date().toLocaleTimeString() : '';
    const prefijo = time ? `[${time}] [${type}]` : `[${type}]`;
    
    // Elegir método de consola según el tipo
    switch (type) {
        case 'error':
            console.error(`${prefijo} ${text}`);
            break;
        case 'success':
            console.log(`%c${prefijo} ${text}`, 'color: #4ade80;');
            break;
        case 'enemy':
            console.log(`%c${prefijo} ${text}`, 'color: #f97316;');
            break;
        case 'battle':
            console.log(`%c${prefijo} ${text}`, 'color: #fbbf24;');
            break;
        case 'fusion':
            console.log(`%c${prefijo} ${text}`, 'color: #a855f7;');
            break;
        case 'sell':
            console.log(`%c${prefijo} ${text}`, 'color: #fb923c;');
            break;
        case 'buy':
            console.log(`%c${prefijo} ${text}`, 'color: #22d3ee;');
            break;
        case 'level':
            console.log(`%c${prefijo} ${text}`, 'color: #facc15;');
            break;
        case 'shop':
            console.log(`%c${prefijo} ${text}`, 'color: #4ade80;');
            break;
        case 'shop-objetos':
            console.log(`%c${prefijo} ${text}`, 'color: #fbbf24;');
            break;
        case 'move':
            console.log(`%c${prefijo} ${text}`, 'color: #a5b4fc;');
            break;
        case 'info':
        default:
            console.log(`${prefijo} ${text}`);
            break;
    }

    // ============================================================
    // 2) RENDERIZAR EN EL DOM (SI EXISTE EL CONTENEDOR)
    // ============================================================
    const container = document.getElementById('consoleMessages');
    if (!container) return;  // Si no existe, ya hemos impreso en F12 → salir
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `console-message ${type}`;
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'time';
    timeSpan.textContent = time;
    messageDiv.appendChild(timeSpan);
    
    const textSpan = document.createElement('span');
    textSpan.className = 'text';
    textSpan.textContent = text;
    messageDiv.appendChild(textSpan);
    
    container.appendChild(messageDiv);
    
    const consoleContainer = document.getElementById('consoleContainer');
    if (consoleContainer) {
        consoleContainer.scrollTop = consoleContainer.scrollHeight;
    }
}