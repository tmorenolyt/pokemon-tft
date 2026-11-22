// Regenera js/data/sonidosMovimientos.js a partir de los .mp3 reales.
// Uso: node tools/generar-sonidos.js
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'assets', 'sounds', 'movimientos');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.mp3')).map(f => f.slice(0, -4)).sort();
const out = '// ⚠️ Archivo generado: no editar a mano.\n' +
    '// Lista de sonidos de movimiento que existen en assets/sounds/movimientos/*.mp3\n' +
    '// Sirve para no intentar cargar un .mp3/.ogg inexistente (404 en consola).\n' +
    '// Regenerar con: node tools/generar-sonidos.js\n' +
    'window.SONIDOS_MOVIMIENTOS_DISPONIBLES = new Set([\n' +
    files.map(f => '    ' + JSON.stringify(f)).join(',\n') + '\n]);\n';
fs.writeFileSync(path.join(__dirname, '..', 'js', 'data', 'sonidosMovimientos.js'), out);
console.log('Generado js/data/sonidosMovimientos.js con', files.length, 'sonidos');
