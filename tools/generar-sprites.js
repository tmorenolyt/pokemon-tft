// Regenera js/data/spritesDisponibles.js a partir de assets/sprites/pokemon.
// Uso: node tools/generar-sprites.js
// Evita que el juego descargue TODOS los sprites al arrancar solo para
// averiguar si cada uno es .gif o .png.
const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, '..', 'assets', 'sprites', 'pokemon');

function escanear(dir) {
    const out = {};
    if (!fs.existsSync(dir)) return out;
    for (const f of fs.readdirSync(dir)) {
        const m = f.match(/^(.+)\.(gif|png)$/i);
        if (!m) continue;
        const id = m[1];
        const ext = m[2].toLowerCase();
        // Si existe el GIF, se prefiere (igual que antes).
        if (!out[id] || ext === 'gif') out[id] = ext;
    }
    return out;
}

const normal = escanear(base);
const shiny = escanear(path.join(base, 'shiny'));

const orden = (o) => Object.keys(o).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }))
    .map(k => `        ${JSON.stringify(k)}: ${JSON.stringify(o[k])}`).join(',\n');

const out = '// ⚠️ Archivo generado: no editar a mano.\n' +
    '// Formato real (gif|png) de cada sprite. Evita descargar todos los sprites\n' +
    '// al arrancar para descubrir cuáles existen. Regenerar con:\n' +
    '//   node tools/generar-sprites.js\n' +
    'window.SPRITE_FORMATOS = {\n' +
    '    normal: {\n' + orden(normal) + '\n    },\n' +
    '    shiny: {\n' + orden(shiny) + '\n    }\n' +
    '};\n';

fs.writeFileSync(path.join(__dirname, '..', 'js', 'data', 'spritesDisponibles.js'), out);
console.log('normal:', Object.keys(normal).length, '| shiny:', Object.keys(shiny).length, '| bytes:', out.length);
