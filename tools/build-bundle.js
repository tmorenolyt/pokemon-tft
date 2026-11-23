// ============================================================
// EMPAQUETADOR (sin dependencias)
// ------------------------------------------------------------
// Une todos los JS/CSS listados en tools/bundle-manifest.json en
// dos archivos (js/bundle.js y css/bundle.css) respetando el orden,
// y actualiza el hash ?v=... de index.html para que el navegador
// no sirva una versión antigua desde caché.
//
// Uso:  node tools/build-bundle.js
// Cuando añadas o quites un archivo, actualiza bundle-manifest.json.
// ============================================================
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const manifestPath = path.join(__dirname, 'bundle-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

function read(rel) {
    return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

// JS: separador con salto de línea + `;` para que un comentario `//`
// sin salto final no se coma el archivo siguiente.
let js = '';
for (const rel of manifest.js) {
    js += `\n/* ==================== ${rel} ==================== */\n`;
    js += read(rel);
    js += '\n;\n';
}
fs.writeFileSync(path.join(ROOT, 'js', 'bundle.js'), js);

let css = '';
for (const rel of manifest.css) {
    css += `\n/* ==================== ${rel} ==================== */\n`;
    css += read(rel);
    css += '\n';
}
fs.writeFileSync(path.join(ROOT, 'css', 'bundle.css'), css);

const hash = crypto.createHash('sha1').update(js).update(css).digest('hex').slice(0, 10);

const indexPath = path.join(ROOT, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
const antes = html;
html = html.replace(/(href="css\/bundle\.css)\?v=[a-f0-9]*(")/, `$1?v=${hash}$2`);
html = html.replace(/(src="js\/bundle\.js)\?v=[a-f0-9]*(")/, `$1?v=${hash}$2`);
if (indexPath && html !== antes) fs.writeFileSync(indexPath, html);

const kb = n => (n / 1024).toFixed(0) + ' KB';
console.log(`✅ Bundle generado (v=${hash})`);
console.log(`   js/bundle.js  ${kb(Buffer.byteLength(js))}  (${manifest.js.length} archivos)`);
console.log(`   css/bundle.css ${kb(Buffer.byteLength(css))}  (${manifest.css.length} archivos)`);
