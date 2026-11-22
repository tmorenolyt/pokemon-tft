// Regenera js/data/criasDisponibles.js a partir de assets/sounds/cries/*.ogg
// Uso: node tools/generar-crias.js
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'assets', 'sounds', 'cries');
const ids = fs.readdirSync(dir).filter(f => f.endsWith('.ogg')).map(f => f.slice(0, -4)).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
const out = '// ⚠️ Archivo generado: no editar a mano.\n' +
    '// Gritos de Pokémon que existen en assets/sounds/cries/*.ogg\n' +
    '// Evita 404 en monstruos PvE sin archivo (se usa un sonido sintetizado).\n' +
    '// Regenerar con: node tools/generar-crias.js\n' +
    'window.CRIAS_DISPONIBLES = new Set([\n' +
    ids.map(id => '    ' + JSON.stringify(id)).join(',\n') + '\n]);\n';
fs.writeFileSync(path.join(__dirname, '..', 'js', 'data', 'criasDisponibles.js'), out);
console.log('Generado js/data/criasDisponibles.js con', ids.length, 'gritos');
