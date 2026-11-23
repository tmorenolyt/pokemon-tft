// ============================================================
// ICONOS DE MOVIMIENTOS - VERSIÓN SIMPLIFICADA
// ============================================================
// Un nombre = un PNG. Sin variantes, sin @pokemon, sin slugs.
//
// Para nombres duplicados (ej. dos "Bomba Lodo"), se usa el
// sufijo numérico en la clave del icono:
//   "Bomba Lodo"     → bomba-lodo.png
//   "Bomba Lodo 2"   → bomba-lodo2.png
//
// El nombre visible del movimiento sigue siendo "Bomba Lodo";
// el `iconoKey` del Pokémon es lo que apunta al sufijo.
//
// 🆕 FIX TRAGAMISIL: onerror del <img> ahora reemplaza por ⚔️
//    si el PNG no existe, para que el icono nunca quede invisible.
// ============================================================

const MOVIMIENTO_ICONS = {
    // ============================================================
    // COSTE 1
    // ============================================================
    "Látigo Cepa": "latigo-cepa.png",
    "Bomba Lodo": "bomba-lodo.png",
    "Lanzallamas": "lanzallamas.png",
    "Puño Fuego": "puno-fuego.png",
    "Vendaval": "vendaval.png",
    "Tajo Aéreo": "tajo-aereo.png",
    "Trampa Rocas": "trampa-rocas.png",
    "Tijera X": "tijera-x.png",
    "Tajo Cruzado": "tajo-cruzado.png",
    "Sumisión": "sumision.png",
    "Torbellino": "torbellino.png",
    "Carantoña": "carantona.png",
    "Divide Dolor": "divide-dolor.png",
    "Asta Drenaje": "asta-drenaje.png",
    "Bola Voltio": "bola-voltio.png",
    "Placaje Eléctrico": "placaje-electrico.png",
    "Fuerza Lunar": "fuerza-lunar.png",
    "Premonición": "premonicion.png",
    "Colmillo Hielo": "colmillo-hielo.png",
    "Terremoto": "terremoto.png",
    "Finta": "finta.png",
    "Garra Umbría": "garra-umbria.png",
    "Ataque Rápido": "ataque-rapido.png",
    "Refuerzo": "refuerzo.png",
    "Meteoros": "meteoros.png",

    // ============================================================
    // COSTE 2
    // ============================================================
    "Bomba Ácida": "bomba-acida.png",
    "Picotazo Veneno": "picotazo-veneno.png",
    "Espada Lamento": "espada-lamento.png",
    "Psicocorte": "psicocorte.png",
    "Nieve Polvo": "nieve-polvo.png",
    "Chuzos": "chuzos.png",
    "Giro Fuego": "giro-fuego.png",
    "Nitrocarga": "nitrocarga.png",
    "Hoja Afilada": "hoja-afilada.png",
    "Hoja Aguda": "hoja-aguda.png",
    "Velocidad Extrema": "velocidad-extrema.png",
    "A Bocajarro": "a-bocajarro.png",
    "Cambiafuerza": "cambiafuerza.png",
    "Psíquico": "psiquico.png",
    "Sombra Vil": "sombra-vil.png",
    "Lluevehojas": "lluevehojas.png",
    "Ascuas": "ascuas.png",
    "Patada Ígnea": "patada-ignea.png",
    "Hidrobomba": "hidrobomba.png",
    "Giro Rápido": "giro-rapido.png",
    "Martillo Hielo": "martillo-hielo.png",
    "Martillo Colosal": "martillo-colosal.png",
    "Alarido": "alarido.png",
    "Mal de Ojo": "mal-de-ojo.png",
    "Ventisca": "ventisca.png",
    "Alud": "alud.png",
    "Voltiocambio": "voltiocambio.png",
    "Voltio Cruel": "voltio-cruel.png",

    // ============================================================
    // COSTE 3
    // ============================================================
    "Tajo Umbrío": "tajo-umbrio.png",
    "Golpe Bajo": "golpe-bajo.png",
    "Señuelo": "senuelo.png",
    "Luz Lunar": "luz-lunar.png",
    "Psicocarga": "psicocarga.png",
    "Viento Hielo": "viento-hielo.png",
    "Carámbano": "carambano.png",
    "Rizo Algodón": "rizo-algodon.png",
    "Ciclón de Hojas": "ciclon-de-hojas.png",
    "Comesueños": "comesuenos.png",
    "Azote Torrencial": "azote-torrencial.png",
    "Hidroariete": "hidroariete.png",
    "Hidropulso": "hidropulso.png",
    "Canto Mortal": "canto-mortal.png",
    "Pistola Agua": "pistola-agua.png",
    "Rayo Carga": "rayo-carga.png",

    // ============================================================
    // COSTE 4
    // ============================================================
    "Danza Dragón": "danza-dragon.png",
    "Enfado": "enfado.png",
    "Bote": "bote.png",
    "Acua Cola": "acua-cola.png",
    "Truco": "truco.png",
    "Bola Sombra": "bola-sombra.png",
    "Descanso": "descanso.png",
    "Bostezo": "bostezo.png",
    "Llama Embrujada": "llama-embrujada.png",
    "Vozarrón": "vozarron.png",
    "Roca Afilada": "roca-afilada.png",
    "Tormenta de Arena": "tormenta-de-arena.png",

    // ============================================================
    // COSTE 5
    // ============================================================
    "Llama Reavivadora": "llama-reavivadora.png",
    "Giro Fuego Ho-Oh": "giro-fuego2.png",
    "Teletransporte": "teletransporte.png",
    "Psicoonda": "psicoonda.png",
    "Cometa Draco": "cometa-draco.png",

    // ============================================================
    // ESPECIALES
    // ============================================================
    "Garra Metal": "garra-metal.png",
    "Tajo Supremo": "tajo-supremo.png",

    // ============================================================
    // ULTIS - COSTE 1 y 2
    // ============================================================
    "Rayo Solar": "rayo-solar.png",
    "Tragamisil": "tragamisil.png",
    "Remolino Pétreo": "remolino-petreo.png",
    "Somanta Épica": "somanta-epica.png",
    "Bosquridad Espectral": "bosquridad-espectral.png",
    "Trueno": "trueno.png",
    "Planca Corpulenta": "planca-corpulenta.png",
    "Pulso Medianoche": "pulso-medianoche.png",
    "Deslumbrar": "deslumbrar.png",
    "Espadazo Espectral": "espadazo-espectral.png",
    "Paisaje Nevado": "paisaje-nevado.png",
    "Cuchilla Solar": "cuchilla-solar.png",
    "Ataque Óseo": "ataque-oseo.png",
    "Pasen y Vean": "pasen-y-vean.png",
    "Amago": "amago.png",
    "Salpicar": "salpicar.png",
    "Besito y a Mimir": "besito-y-a-mimir.png",
    "Pirueta del Eclipse": "pirueta-del-eclipse.png",
    "Velo Aurora": "velo-aurora.png",
    "Chispazo": "chispazo.png",

    // ============================================================
    // ULTIS - COSTE 3
    // ============================================================
    "Cercenador Umbrío": "cercenador-umbrio.png",
    "Beso Drenaje": "beso-drenaje.png",
    "Poder Reserva": "poder-reserva.png",
    "Campo Glacial": "campo-glacial.png",
    "Danza Pelusa": "danza-pelusa.png",
    "Sobresalto": "sobresalto.png",
    "Torrente Furioso": "torrente-furioso.png",
    "A Todo Lapras": "a-todo-lapras.png",
    "Aguijón Letal": "aguijon-letal.png",
    "Rayo": "rayo.png",

    // ============================================================
    // ULTIS - COSTE 4 (🆕 NUEVAS)
    // ============================================================
    "Salto Sideral": "salto-sideral.png",
    "Chapuzón del Dragón": "chapuzon-del-dragon.png",
    "Portal Desatado": "portal-desatado.png",
    "Remolón sin Parangón": "remolon-sin-parangon.png",
    "Donaire Feérico": "donaire-feerico.png",
    "Cólera Titánica": "colera-titanica.png",

    // ============================================================
    // ULTIS - COSTE 5 (🆕 NUEVAS)
    // ============================================================
    "Viento Afín": "viento-afin.png",
    "Espacio Raro": "espacio-raro.png",
    "Motor Hadrónico": "motor-hadronico.png",

    // ============================================================
    // VARIANTES NUMÉRICAS (iconos específicos por Pokémon)
    // ============================================================
    "Bola Voltio 2": "bola-voltio2.png",
    "Bomba Lodo 2": "bomba-lodo2.png",
    "Premonición 2": "premonicion2.png",
    "Rayo Carga 2": "rayo-carga2.png",
    "Hidroariete 2": "hidroariete2.png",
    "Llamarada": "llamarada.png",
    "Llamarada 2": "llamarada2.png",
    "Hoja Afilada 2": "hoja-afilada2.png",
};

// ============================================================
// FUNCIÓN: obtener URL del icono
// ============================================================

function getIconoMovimiento(nombreMovimiento) {
    if (!nombreMovimiento) return null;

    // Limpiar el nombre
    const nombreLimpio = String(nombreMovimiento).trim();

    // Buscar match exacto
    if (MOVIMIENTO_ICONS[nombreLimpio]) {
        return CONFIG.ICON_BASE_URL + 'movimientos/' + MOVIMIENTO_ICONS[nombreLimpio];
    }

    // Buscar sin acentos
    const sinAcentos = nombreLimpio.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const key in MOVIMIENTO_ICONS) {
        const keySinAcentos = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (keySinAcentos === sinAcentos) {
            return CONFIG.ICON_BASE_URL + 'movimientos/' + MOVIMIENTO_ICONS[key];
        }
    }

    return null;
}

// ============================================================
// FUNCIÓN: HTML del icono
// ============================================================
// 🆕 FIX: si el PNG falla al cargar, el onerror reemplaza
//    el contenido del padre por ⚔️ para que nunca quede invisible.
// ============================================================

function getIconoMovimientoHtml(nombreMovimiento, size = 20, idExplicito = null) {
    let nombreParaBuscar = nombreMovimiento;
    if (idExplicito) {
        nombreParaBuscar = idExplicito;
    }

    const iconoUrl = getIconoMovimiento(nombreParaBuscar);

    if (iconoUrl) {
        return `<img src="${iconoUrl}" 
                     alt="${nombreMovimiento}" 
                     draggable="false"
                     style="width:${size}px;height:${size}px;object-fit:contain;border-radius:4px;flex-shrink:0;display:inline-block;vertical-align:middle;"
                     onerror="this.style.display='none'; if(this.parentElement){ this.parentElement.textContent='⚔️'; this.parentElement.style.fontSize='${Math.round(size * 0.7)}px'; }">`;
    }

    return `<span style="font-size:${size * 0.7}px;">⚔️</span>`;
}

// ============================================================
// EXPONER
// ============================================================

window.MOVIMIENTO_ICONS = MOVIMIENTO_ICONS;
window.getIconoMovimiento = getIconoMovimiento;
window.getIconoMovimientoHtml = getIconoMovimientoHtml;
