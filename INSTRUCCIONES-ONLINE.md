# Jugar online con amigos de cualquier lugar

El juego es estático + un servidor Node (`servidor-online.js`, sin dependencias, usa `process.env.PORT`).
Todos deben entrar al **mismo servidor/URL**, con el **mismo código de sala** y **pid distinto** por jugador.

---

## Opción A — RÁPIDA, sin cuentas (túnel temporal, tu PC encendida)

Sirve para probar YA con amigos de otras ciudades/países. Tu PC hace de servidor.

1) Arranca el servidor:
```bash
node servidor-online.js
```
2) En otra terminal, publica el puerto con Cloudflare Tunnel (gratis, sin cuenta):
```bash
winget install --id Cloudflare.cloudflared
cloudflared tunnel --url http://localhost:8000
```
3) Te dará una URL tipo `https://algo-random.trycloudflare.com`. Compártela; cada uno entra:
```
https://algo-random.trycloudflare.com/?pid=ana
https://algo-random.trycloudflare.com/?pid=beto
```
- ✅ Funciona desde cualquier país. ⚠️ Tu PC debe estar encendida y la URL cambia cada vez.

---

## Opción B — PERMANENTE, gratis (hosting Render)

Juegan cuando quieran, sin tu PC. Necesitas cuenta de GitHub y de Render (las creas tú; yo no puedo).

1) **Sube el proyecto a GitHub**
   - Crea un repo vacío en https://github.com/new (privado o público).
   - En la carpeta del juego:
     ```bash
     git add -A
     git commit -m "Online 1v1"
     git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
     git push -u origin main
     ```
   (o usa GitHub Desktop si prefieres interfaz gráfica).

2) **Despliega en Render**
   - https://render.com → New → **Web Service** → conecta tu repo.
   - Language: **Node**
   - Build Command: (vacío o `echo ok`) · Start Command: `node servidor-online.js`
   - Plan: **Free** → Create.
   - Te da una URL fija: `https://tu-app.onrender.com`

3) Cada jugador entra con:
```
https://tu-app.onrender.com/?pid=ana
https://tu-app.onrender.com/?pid=beto
```
Mismo **código de sala** en todos.

Alternativas equivalentes: Railway, Fly.io, Koyeb, Glitch.

---

## Notas importantes

- **Peso**: el proyecto pesa ~170 MB (108 MB son fondos PNG). Render Free y la carga inicial lo aguantan, pero **conviene comprimir** los fondos para que cargue rápido (se puede bajar a ~10-20 MB sin perder apenas calidad).
- **Render Free duerme** tras inactividad: la primera visita del día tarda unos segundos en despertar.
- **Mismo servidor + mismo código de sala + `pid` distinto** por jugador (el `?pid=` en la URL).
- El juego es por turnos (SSE): la latencia entre países no molesta.

---

## 🔒 Hacer la web privada (solo tus amigos)

La web desplegada en Render es **pública**: cualquiera con la URL puede abrirla.
Para cerrarla:

1. En Render → tu servicio → **Environment** → **Add Environment Variable**:
   - `ACCESS_KEY` = una clave larga, p. ej. `tmoreno-amigos-2026`
   - Save (Render redespliega solo).
2. Comparte con tus amigos el enlace con la clave **una sola vez**:
   ```
   https://tu-app.onrender.com/?clave=tmoreno-amigos-2026
   ```
   Al entrar se guarda una cookie 30 días y la clave desaparece de la URL.
   Sin la clave (o sin cookie) solo se ve una pantalla de "Acceso privado".
3. Si quieres cambiar la clave, edita `ACCESS_KEY` en Render: las cookies viejas
   dejan de valer y hay que repartir el enlace nuevo.

👉 Si **no** defines `ACCESS_KEY`, el servidor sigue abierto como antes (útil en local).

### Repositorio privado en GitHub
- GitHub → repo → **Settings** → **General** → *Danger Zone* →
  **Change repository visibility** → **Private**.
- Si Render deja de desplegar, en Render → Settings → **GitHub** hay que dar
  permiso a la app de Render para ver ese repositorio privado.

⚠️ Importante: el código del **cliente** (HTML/JS/CSS) siempre es visible para
quien juega (el navegador lo descarga). Lo que queda privado es el repositorio y
la lógica del servidor. La clave + repo privado es el límite práctico.

---

## 📱 Jugar en el móvil

El juego detecta pantallas pequeñas y cambia solo:

- **Solo horizontal**: en móvil táctil el juego se bloquea en vertical con un
  aviso **“Gira el móvil”** (también en el menú). Incluye botón de **pantalla
  completa horizontal** para Android/Chrome; en iPhone hay que girar el móvil a
  mano (Safari no permite bloquear la orientación).
- **Menú inicial**: los 4 modos se colocan en **2×2** para que se vean todos sin
  hacer scroll (perfil y versión incluidos).
- **Selección (1 Jugador / 2 Jugadores)**: cabe en una pantalla. En 1 Jugador se
  mantiene la **ilustración del personaje** a la izquierda y una tarjeta compacta
  con el **nombre arriba**, la **rejilla de avatares** en medio (el elegido se
  marca con ✓, sin recuadro duplicado) y los **colores debajo**; los botones
  (VOLVER / JUGAR / TUTORIAL) van abajo, separados del panel. En 2 Jugadores se
  muestran dos tarjetas gemelas lado a lado (sin ilustración) con el VS en medio.
- **Paisaje**: todo cabe en una pantalla. Cabecera y barra de acciones compactas,
  los dos tableros lado a lado con **casillas cuadradas** y el banco reducido.
  La **barra de acciones** se ajusta a su contenido (desde el bloque de NIVEL
  hasta el botón COMBATIR) y va centrada en la pantalla.
  El **baúl de objetos** ya no son dos tiras laterales: se abre con el botón
  **📦** de la cabecera como panel flotante en forma de **tira vertical**: una sola
  columna de huecos de 32 px, sin título ni emoji (solo se ven los iconos),
  con scroll si hay muchos objetos; pegada a la
  izquierda para no tapar el tablero; si el rival también tiene objetos, su baúl
  sale como otra tira a la derecha. Al tocar un objeto el panel se cierra solo y
  ya puedes tocar el Pokémon para equiparlo.
  La tira se **abre sola** cada vez que **entra un objeto en el baúl** (al
  comprarlo, al vender un Pokémon con objetos o al mover uno con objetos al
  banco), para que veas lo que tienes (solo en móvil).
- **Ranking**: oculto; se abre con el botón **🏆** de la cabecera en **dos
  columnas**, así se ven los 8 rivales sin hacer scroll. Cada fila lleva su
  **posición** (1, 2, 3…) a la izquierda y el **nivel** como mini insignia en la
  esquina superior derecha del avatar, para que no se confundan.
  Las **sinergias** van fijas **debajo del panel de cada jugador** (como en
  escritorio) en miniatura: icono, contador y circulitos del nivel; si hay
  muchas, se desplazan con el dedo dentro del panel. Ya no hace falta el botón
  **⚔️** (se ha quitado de la cabecera).
  La barra de acciones va centrada y mantiene visible la barra de XP.
- **Cartas del tablero**: se ven las barras de **vida**, **energía** y **definitiva**
  (esta última solo si el Pokémon lleva Disco Definitivo).
  Los **iconos de sinergia** (tipo y clase) y la **estrella de nivel** van
  reducidos (10 y 14 px) y pegados a las esquinas superior izquierda/derecha;
  en el banco todavía más pequeños (8 y 10 px).
  La **etiqueta de casilla** (`A3`, `D2`…) se oculta en las casillas que tienen
  Pokémon, para dejar libre la esquina inferior izquierda (las vacías la
  mantienen como referencia).
  Los **objetos equipados** se ven abajo a la izquierda, en una tira de iconos
  de 9 px como en escritorio (7 px si el Pokémon lleva Disco Definitivo, que
  añade la barra de ulti); en el banco, una tira de 7 px. Los huecos vacíos no
  se dibujan: para equipar se toca el objeto en el baúl y luego el Pokémon.
- **Escala de sprites**: se fija desde móvil (antes se colaban los tamaños de
  escritorio y algunos Pokémon se salían de la casilla): **30 px** en el tablero
  (máx. ~39 con su escala propia) y **26 px** en el banco, con los iconos de
  sinergia (7 px) y la estrella (8 px) en miniatura.
- **Banco**: se muestra el contador compacto (p. ej. `3/7`) en vez de las 6
  pokéballs, porque en la columna estrecha del móvil no caben los dos. El
  contador va **arriba a la derecha** y un poco **hacia abajo** dentro del panel;
  las cartas son **algo más altas** (29 px en vez de 23), con el sprite un poco
  más grande y **desplazado hacia abajo** dentro de la carta.
- **Tienda**: ocupa toda la pantalla y se puede desplazar con el dedo. Arriba a la
  izquierda se ve tu **oro actual** y arriba a la derecha hay una **✕** para cerrarla.
  Las **cartas** se adaptan a la pantalla (sin alto fijo ni proporción 4:5): se
  reparten en la fila, se centran y el sprite, la moneda y el nombre van
  compactos, así no quedan huecos raros.
  En la **tienda de OBJETOS** las 3 cartas van en una sola fila y **entran
  completas sin scroll** (antes eran 4:5 de 200 px y el botón ✅ GRATIS quedaba
  cortado); el cartel de la ronda también es compacto.
- **Atajos de teclado** (`C`, `E`, `B`, `R`, `1`-`4`, `D`…): se ocultan en móvil,
  porque en táctil no sirven.
- **Pokédex**: la lista va en rejilla compacta (4 filas completas, se desplaza con
  el dedo) y el **VOLVER** está arriba a la izquierda para no tapar las cartas. El
  **detalle** de cada Pokémon también cabe en una pantalla: sprite y datos en una
  fila, estrellas, stats, movimientos y ulti (con scroll interno).
- **Arrastrar**: los Pokémon y los objetos se pueden arrastrar con el dedo.
  Los objetos también se pueden **tocar** y luego **tocar el Pokémon**.
- El panel del amistoso online se coloca por encima de la barra de acciones.

Archivos: `css/mobile.css` y `js/ui/mobile.js` (se cargan al final).

---

## 🏷️ Versión desplegada (saber si se ha actualizado)

En el **menú principal**, justo debajo de la ficha de perfil, aparece:

```
v0.2.0 · 7e5f9d5
```

- `v0.2.0` = versión de `package.json` (súbela cuando quieras marcar un update).
- `7e5f9d5` = **commit** desplegado (Render lo da automáticamente).
- Si el commit cambia respecto a tu última visita, sale en verde con **🆕 ACTUALIZADO**.
- Pasa el ratón para ver versión, commit, rama, hora de arranque del servidor y entorno.
- Pulsa encima para volver a comprobarlo (útil tras un deploy).
- La web consulta `GET /api/version`.

Así sabes de un vistazo si Render está sirviendo la última versión que subiste.

---

## 🕵️ Panel de jugadores (quién juega y cuánto tiempo)

Con la variable de entorno **`ADMIN_KEY`** se activa un panel privado:

```
https://tu-app.onrender.com/admin?admin=TU_CLAVE_ADMIN
```

- Se guarda una cookie 30 días y la clave desaparece de la URL.
- Muestra, actualizándose cada 2,5 s: **sala, nick, ronda, nivel, HP, tiempo
  jugado** y última señal.
- Estado **🟢 Jugando** si el cliente ha sincronizado en los últimos 8 s;
  si no, **Desconectado** (se queda en la lista con su tiempo total).
- El *tiempo jugado* cuenta desde que el jugador entra en la sala.
- El nick es el que cada jugador escribe en la pantalla de selección.

👉 Usa una `ADMIN_KEY` **distinta** de `ACCESS_KEY`: los amigos tienen la clave de
jugador, pero no la de administración. Si no defines `ADMIN_KEY`, `/admin` queda
protegido solo por `ACCESS_KEY`.

> El juego ya muestra arriba el cronómetro de la partida (⏱️) en cada cliente.
> El panel `/admin` es para que TÚ veas a todos a la vez.

---

## Cambios recientes (online 1v1)

- **Moneda del juego en victoria y derrota**: el cartel ya no usa el emoji
  de bolsa de dinero (💰): muestra la **moneda del juego**
  (`assets/icons/moneda.png`) con un halo dorado, en «+6 🪙 · Racha +2».
  Además, en **derrota** ahora también indica el oro ganado (siempre se gana
  algo: 5 + interés + racha), p. ej. «-9 HP · +5 🪙 · Racha -2».
- **Tienda de objetos más variada**: antes salían siempre 2 chips + 1 objeto.
  Ahora el número de chips es aleatorio (**0, 1 o 2** por tienda, aprox. un
  tercio cada caso) y el resto son objetos normales. La única norma se mantiene:
  **nunca 3 chips** en la misma tienda.
- **Diálogo estilo Persona (PC y móvil)**: el bocadillo de los rivales
  (y la reacción del jugador) ya no es una nube: es una **barra de diálogo
  centrada**, **un poco más ancha que la barra de acciones** (1.060 px máx.) y
  apoyada sobre ella (**14 px de solapo**), con fondo casi
  negro, **línea roja degradada** arriba, el **nombre en verde** (el del rival
  cuando habla el rival y el tuyo cuando hablas tú), el texto en
  blanco (grande) y un pequeño **▼ rojo parpadeando** para indicar que puedes
  seguir. A la izquierda asoma el **retrato grande del rival** enmarcado con
  sombra roja, y el texto se coloca a su derecha. El color del nombre cambia
  según el estado (verde/amarillo/rojo/gris). En **móvil** es la misma barra
  pero compacta: **mismo ancho que la barra de acciones** y colocada **encima
  de ella** y **la tapa entera** mientras dura (solo asoman ~2 px de la barra
  abajo; se cierra al tocarla), con retrato de **90 px** y letra algo menor. Además el
  diálogo ya no se sale por el borde derecho: se recoloca con el ancho real del
  texto.
- **FIX: derrota en rondas 24/30/36 sin quitar HP**: esas rondas se daban
  por "PvE" por la fórmula (1, 6, 12, 18, 24, 30…), pero **no existe monstruo
  configurado** para ellas (solo 1, 6, 12 y 18), así que se peleaba sin
  monstruo y con el **daño PvE = 0**: perdías y no te quitaban vida.
  Ahora una ronda solo cuenta como PvE si hay monstruo configurado; si no, se
  juega como ronda PvP normal (con daño normal al perder).
- **Rival sin pareja → combate real**: cuando queda un solo rival vivo (no hay
  con quién emparejarlo) ya **no pierde HP "por inanición"**: disputa un
  combate simulado contra un **equipo fantasma** formado por otro rival que
  **siga vivo** (los eliminados nunca, aunque conserven su equipo) o, si no
  queda ninguno, contra **tu propio equipo**. Si gana, gana oro y racha; si
  pierde, **pierde HP** y racha, igual que cualquier combate.
- **Objetos equipados en el resumen final**: cada Pokémon del "EQUIPO FINAL"
  muestra ahora sus **objetos equipados** como mini-iconos bajo la carta
  (jugador y rivales), con su nombre al pasar el ratón.
- **Diálogo de ronda solo cuando toca**: el bocadillo del jugador con la
  descripción del monstruo ("Dos Aipom salvajes bloquean el camino…") ya **no
  aparece en el menú antes de darle a JUGAR**, ni en online antes de que empiece
  la primera ronda. Se muestra **1 segundo después de darle a jugar**: en 1J al
  empezar la partida (≈1,1 s desde que aparece el monstruo) y en online 1 s
  después de entrar en la sala/partida.
- **🏆 Torneo ONLINE (fase 3): modo espectador + fin de torneo (opción A)**: si
  te eliminan (0 HP) **no se corta la partida**: aparece el cartel **"💀
  Eliminado · modo espectador"**, se te desactiva COMBATIR y sigues viendo
  **el ranking de los 8 en vivo** y **el tablero de tu amigo** durante la
  preparación. Las rondas ya **no esperan al eliminado** para avanzar. Si caen
  los dos humanos, el torneo termina y **ambos ven la pantalla final con las 8
  posiciones** (1º la IA que quede con más HP, y el resto por orden de caída).
  Esa pantalla final usa **el mismo formato que el torneo 1J**: rango con
  medallas, entrenador, **equipo con sprites, estrellas y objetos equipados** y
  **sinergias** de cada participante (los humanos con su tablero real; las IA
  con su equipo generado por semilla). En **móvil horizontal** ese resumen se
  compacta para que entren las **8 posiciones** de una vez (sin etiquetas de
  columna, sprites de 32 px con estrellas y objetos, sinergias de 12 px), y el
  **modo espectador** abre solo el ranking desplegable para poder seguir la
  partida desde el móvil. Además hay un botón **🔄 REVANCHA** en ese resumen:
  pide al servidor `/api/reset`, se reinicia el torneo **en la misma sala** y
  **los dos clientes vuelven solos** a la preparación (se recargan).
- **🏆 Torneo ONLINE (fase 3) · correcciones de la partida real**:
  - **Nicks**: el nombre del amigo se actualiza en el torneo aunque lo cambie
    después de entrar (antes se quedaba en "Entrenador").
  - **Fin con un humano vivo**: si cae uno, el torneo **continúa** con el otro
    (el caído pasa a espectador). Antes el servidor mandaba `matchEnd` y el
    resumen mostraba solo 2 jugadores; ahora el resumen final tiene **las 8
    posiciones** con sus equipos, objetos y sinergias.
  - **Rival real por ronda**: el panel enemigo muestra **el nombre, avatar y HP
    del rival de esa ronda** (IA o humano), no siempre el del amigo. En la
    preparación se ve el equipo del **próximo** rival (IA incluida).
  - **Banco y baúl del amigo**: el cliente sincroniza `bench` y `baul`; se ven
    sus Pokémon en el banquillo y sus objetos en el baúl enemigo.
  - **Shiny del amigo**: se envía el flag `shiny` y se aplica al crear la
    unidad enemiga (tablero, banco y resumen final).
  - **Daño por ronda**: el servidor calcula el daño real de humanos e IA y el
    ranking muestra el clásico **`-7` en rojo**.
  - **Ranking estable**: el pintor local de torneo 1J ya **no sobrescribe** el
    ranking online al comprar/rerenderizar (antes mostraba a todos los rivales
    IA locales como vivos).
  - **Espectador útil**: el botón COMBATIR queda desactivado, el ranking sigue
    en vivo y **se puede espiar** a cualquier participante haciendo clic en su
    fila (humano o IA) para cargar su equipo en el tablero enemigo.
  - **Listo del amigo**: el panel online muestra en todo momento
    `TÚ: ✅/⏳ · AMIGO: ✅/⏳`.
  - **Nivel del amigo sincronizado**: el servidor actualiza nivel/HP/racha
    del humano en el torneo en cada sincronización. El contador del banco ya
    no muestra `3/1` con nivel 3: sale `3/3`.
  - **Equipos IA como en 1J**: se colocan con `_PATRONES_COLOCACION.enemy`
    (melees en E/F/G, backline en H/G/F) y no se espejan. La semilla de la
    pareja es la misma en preparación y en combate, así **no cambian los
    Pokémon** al pulsar COMBATIR. La composición usa la estrategia real de
    cada rival (tipos/clases/prioridad de `RIVALES_INFO`), no una elección
    aleatoria, y equipa chips/objetos acordes. Usa los mismos slots por nivel
    que el 1J (`TABLA_MAX_UNIDADES`) y a 2★/3★ muestra sus evoluciones.
    Los objetos son **del equipo**, no uno por Pokémon: **1** en nivel 3-4,
    **2** en nivel 5-6 y **3** en nivel 7-8 (máximo 1 por unidad).
  - **Oro y racha de las IA**: economía como el torneo de 1J. Las IA empiezan
    con **nivel 1, 1 unidad y 10💰**. La ronda 1 (PvE de arranque) no da oro,
    pero **en la primera tienda ya compran**: el nivel 2 es gratis y compran
    1 Pokémon; si es de **coste 1** se quedan con **9💰** y si es de **coste 2**
    con **8💰** (el coste se deriva de la semilla del rival y coincide con el
    Pokémon que genera el cliente). A partir de ahí: ingreso `5 base + interés (máx. 3) +
    racha + remontada por nivel + 1 al ganar`. Pagan las subidas de nivel con la
    tabla real (`4/8/20/24/36/48/60`), pagan las **unidades de los slots nuevos**
    y gastan en compras/rerolls; tope **65**. El panel del rival muestra oro y
    racha. Las rachas encadenan negativas al perder.
  - **Sin revanchas consecutivas**: el emparejamiento usa backtracking y no
    repite rival de una ronda a la siguiente si existe otra combinación
    (como el torneo de 1J). Con 2 vivos al final la revancha es inevitable.
  - **Costes por nivel (odds de tienda)**: la IA usa las mismas
    probabilidades que la tienda (`SHOP_ODDS[nivel]`), no límites por ronda.
    Nivel 2 → 73% coste 1 / 27% coste 2; nivel 4 → 3% coste 3; nivel 6 → 3%
    coste 4; nivel 8 → 26% coste 4 / 4% coste 5. Las estrellas también van por
    nivel (2★ desde nivel 4, 3★ desde nivel 7).
  - **Objetos por rondas de objetos**: igual que el jugador (rondas 3, 7, 9,
    13, 15, 19…): ronda 3 → 1 objeto, ronda 7 → 2, ronda 9 → 3, ronda 13
    → 4… siempre máximo 1 por Pokémon.
  - **Ranking idéntico al 1J**: ✔ verde al ganar, ✖ rojo al perder, `-X` de
    daño, 🔥 de racha y ocultación de marcas a los 5 s. Además solo se repinta
    cuando cambian los datos, así el `-7` ya **no parpadea**.
  - **Mewtwo centrado**: el offset de sprite se multiplica por el flip, así el
    GIF no se descentra al mostrarse en el lado enemigo.
- **🏆 Torneo ONLINE (fase 2)**: el emparejamiento ya **mezcla a todos los
  vivos** (2 humanos + IA), así que hay rondas en las que **te toca una IA**.
  Cuando eso pasa, el servidor te manda el rival, su nivel y una semilla, y tu
  cliente **genera su equipo** (determinista con la semilla) y lo carga en el
  tablero enemigo: el combate se juega **en vivo**, igual que en el modo 1J.
  Si ganas, la IA **pierde HP** (tabla por rondas + tus unidades vivas); si
  pierdes, lo pierdes tú. Las IA vs IA se siguen simulando en el servidor y en
  las rondas **PvE** los rivales no se pegan entre ellos.
- **🏆 Torneo ONLINE (fase 1)**: el modo online ya no es solo un 1v1: el
  servidor crea un **torneo de 8** por sala con **los 2 jugadores humanos y 6
  rivales IA** (Misty, Rojo, Lorelei, Lance, Erika y Bruno, 50 HP cada uno).
  Cada ronda empareja a los participantes, las **IA pelean entre sí** (simulado
  en el servidor con la tabla de daño por rondas) y los dos jugadores ven el
  **ranking de los 8** en su pantalla, con tu rival marcado y las IA con 🤖.
  Las rondas **PvE (1, 6, 12, 18…)** también están contempladas (nadie se pega
  entre sí en esas rondas). De momento los dos humanos siguen jugando su 1v1
  como antes; los combates **contra las IA** llegan en la fase 2, y después las
  eliminaciones y la pantalla final de 8.
- **Móvil: carta de datos y carta de sinergia mejoradas**: la ficha del
  Pokémon en horizontal queda **centrada** (600 px máx., con margen a los
  lados, ya no pegada a los bordes), con **cabecera fija**, **X para cerrar**
  siempre visible, stats en **4 columnas × 2 filas** compactas, tipos y objetos
  más pequeños y movimientos con letra legible. La carta de sinergia también es
  más compacta: descripción completa sin cortes, rejilla de Pokémon y niveles
  más pequeños. El escritorio no cambia (solo gana el botón X).
- **Todas las sinergias en el resumen final**: antes solo salían **3** (se
  cortaba con `slice(0,3)`), así que sinergias como **Normal** desaparecían.
  Ahora aparecen **todas**, tanto tipos como clases, con salto de línea si no
  caben (también en el resumen del online 1v1).
- **Posiciones finales por orden de eliminación**: el resumen final ya no
  ordena por HP. Ahora se ordena como en TFT: **1º el que queda vivo** y
  después **el último en caer es 2º**, luego 3º, etc. (cada rival eliminado
  guarda su número de orden, y el jugador también). Así, si caes al final,
  sales 2º y no por debajo de un rival que murió antes.
- **Tienda: marca de fusión correcta**: la carta ya **solo se marca como
  "¡Evoluciona!/¡Mejora!"** cuando de verdad vas a fusionar, es decir, cuando
  tienes **2 copias de nivel 1★** de ese Pokémon. Antes contaba copias por
  nombre sin mirar el nivel, así que con dos Leafeon **2★** (tablero + banco)
  la tienda marcaba un Leafeon como fusión y no era cierto.
- **Ranking sin solapes (100 % de zoom)**: en pantallas de **≤2000 px de ancho**
  el ranking se coloca **debajo del panel del jugador** y se hace **más estrecho
  (166 px, filas compactas)** para que **no pise ni el baúl ni el banco**. A
  **2133 px** (1920×1080 al **90 % de zoom**) se queda como estaba: arriba a la
  izquierda y a 240 px.
- **Ranking siempre por posición**: la lista del ranking ya **no se reordena
  por emparejamientos**; va siempre de 1º a último (vivos primero, luego por
  vida) y el rival de la ronda aparece **con el recuadro marcado** (marco
  dorado + ⚔️, con un pulso suave). En las rondas PvE no se marca a nadie.
- **Resumen final sin HP y con sinergias**: en la pantalla de resultados
  finales ya **no se muestra el HP ni el corazón** en ninguna fila (ni en
  victoria ni en derrota), ni en el torneo 1J ni en el online 1v1. Además las
  **sinergias ya se ven**: antes el jugador solo mostraba sinergias de *tipo*
  (las de *clase* se perdían); ahora salen tipos **y** clases, igual que en
  las filas de los rivales, con su icono y nivel.
- **El rival se queda 2 s antes de las rondas PvE**: al entrar en una ronda
  PvE el panel del rival anterior (nombre, vida y sus Pokémon en el tablero)
  **aguanta 2 s más en pantalla** y después aparece el monstruo con su panel
  (∞ HP). Evita el cambio brusco al terminar la ronda. Ajustable con
  `spawnearMonstruoPvEConRetraso(fase, 2000)` en `js/systems/combate.js`.
- **Diálogos del rival un segundo más largos**: las frases del rival duran
  ahora **1 s más** cada una (al empezar el combate 3 s, al ganar/perder 3,5 s,
  al pensar y al sustituir unidad 2,5 s), además del tiempo de escritura. Tú
  puedes cerrarlos antes tocándolos o haciendo clic.
- **Diálogo del jugador en rondas PvE**: al empezar cada ronda PvE (1, 6,
  12, 18…) tu **propio personaje** (tu avatar y tu nombre) aparece en la barra
  de diálogo estilo Persona y dice **literalmente la descripción del monstruo**
  de esa ronda, p. ej. «Dos Aipom salvajes bloquean el camino.». Sale **una vez
  por ronda** y **al cerrar la tienda** de esa ronda (antes en las rondas 6, 12
  y 18 aparecía debajo del overlay de la tienda); en la ronda 1, que no tiene
  tienda, sale casi en seguida (a los **~1,6 s** de aparecer el monstruo). Nunca
  durante un combate ni en 2 jugadores. Las frases se editan en
  `js/data/monstruosPvE.js`, campo **`descripcion`** de cada ronda.
- **Baúl automático en móvil**: cada vez que un objeto entra en el baúl (compra
  en la tienda, venta de un Pokémon con objetos, paso de un Pokémon con objetos
  al banco o al conseguir el **Disco Definitivo** de nivel 5 y 8) la tira (📦) se
  abre sola para enseñarlo; no se abre durante un combate ni encima de la tienda.
  Además, al cerrarse la tienda desde la compra ya se quita la clase
  `tienda-abierta`.
- **Tienda de objetos fiable**: si al terminar la ronda quedaba abierta la tienda de
  Pokémon, ahora se cambia automáticamente a la tienda de OBJETOS cuando toca
  (antes se quedaba la de Pokémon y nunca aparecían los objetos). Además, al recibir
  `nextRound` el cliente fuerza la apertura de la tienda correcta y muestra un aviso
  "🎁 te falta comprar tu OBJETO gratis" si se cierra sin comprar.
- **Baúl de objetos**: se refresca automáticamente en ambos jugadores al comprar o
  equipar (antes podía quedarse desactualizado en el cliente del Jugador 2).
- **Pantalla de resultados finales**: al acabar la partida se muestra el resumen
  clásico con posiciones (🥇/🥈), avatar, equipo final, sinergias y HP de los dos
  jugadores reales (antes no salía o salía con los rivales IA).
- **Sin doble combate**: se ignora un segundo clic en COMBATIR mientras la ronda se
  está resolviendo (evita que un jugador avance dos rondas y se desincronice).
- `matchEnd` incluye el número de ronda para mostrarlo en el resumen.
- **Acceso privado opcional**: con la variable de entorno `ACCESS_KEY` la web pide
  una clave y guarda una cookie de 30 días (`?clave=...`). Sin ella, abierta.
- **Panel de administración** (`/admin?admin=...`, variable `ADMIN_KEY`): jugadores
  conectados, nick, ronda, nivel, HP y tiempo jugado, refrescado cada 2,5 s.
- **Versión visible** en el menú: `v0.2.0 · <commit>` debajo del perfil, con aviso
  `🆕 ACTUALIZADO` cuando cambia el commit desplegado.
- **Escritorio a 100 % de zoom**: la barra de acciones baja a 12 px del borde
  (antes 30) y el tablero se limita en ancho según el alto de la ventana, de modo
  que **nunca pisa las casillas** aunque la ventana sea baja (900-1000 px de alto).
  La separación queda en ~19 px. A 90 % de zoom (≥2001 px) no cambia nada.
- **Ranking más grande a 100 % (1920 px)**: en 1920 el panel del jugador empieza
  en x≈172, así que a la izquierda hay una columna libre. Allí el ranking sube a
  su altura normal (118 px en vez de 262) y crece: filas de 46 px (antes 32),
  avatar de 36 px (antes 24) y nombre a 12 px (antes 9). Sigue sin tocar el panel
  del jugador ni el baúl (18 px de margen). Por debajo de 1915 px se mantiene la
  versión compacta para no invadir el panel.
- **Sin barra horizontal en el ranking (100 %)**: el panel tenía `overflow-y: auto`,
  lo que activaba también el scroll horizontal cuando aparecían los ticks ✅/❌,
  el ⚔️ del rival, el 🔥 de racha o el daño flotante (que entra deslizándose).
  Ahora usa `overflow-x: clip` y el ⚔️/🔥 se dibujan dentro del panel.
- **Tienda de objetos ajustada a 100 %**: el panel usaba `56vh` fijo, y en
  ventanas de 900-950 px de alto el contenido no cabía: la fila del botón
  **Reroll** se salía por debajo del borde. Ahora el alto se calcula según el
  espacio real hasta la barra de acciones (`alto barra - 124 px`), así entra
  todo el contenido (panel de 564 px, igual que al 90 %). Probado a
  1920×1080/950/900, 1600×900, 1366×768 y 1280×720.

## ⚡ Rendimiento (P0)

- **Caché y compresión** (`servidor-online.js`): HTML `no-store`, JS/CSS e
  imágenes/audio/fuentes `max-age=604800`. Además gzip para HTML/CSS/JS/JSON/SVG
  (con caché en memoria). Antes todo iba con `no-store`: **cada visita
  descargaba 22 MB otra vez**. Ahora la segunda carga es **0 KB**.
- **Sin caché vieja tras un deploy**: el HTML (que sí es `no-store`) reescribe
  todas las URLs de `js/` y `css/` como `...?v=<commit>`. Al cambiar el commit
  cambia la URL, así que el navegador baja el CSS/JS nuevo **al recargar**, sin
  necesitar Ctrl+Shift+F5 y sin quedarse con el banco/tienda viejos.
- **Fondos en WebP**: los 5 fondos del menú pasan de **13,8 MB a 0,5 MB**
  (0,25 MB en móvil, con variantes de 900 px), y cada terreno de **~3,4 MB a
  ~0,18 MB**. Los PNG originales se quedan en `assets/` como respaldo.
- **Avatares en WebP**: los 37 avatares (8 jugador, 8 personajes y 21 rivales)
  pasan de **2,6 MB a 0,5 MB** (de 40-180 KB a 5-34 KB cada uno). El selector,
  el perfil y el ranking usan ya `.webp`; se mantiene `rojofull.png` como
  respaldo en el `onerror` del avatar de J2.
- **Sin precarga masiva de sprites**: `js/data/spritesDisponibles.js` guarda el
  formato real (gif/png) de cada sprite, así el juego ya no descarga los 83
  sprites (**5,2 MB**) al arrancar solo para averiguarlo. Regenerar al añadir
  sprites: `node tools/generar-sprites.js`.
- **Sin 404 de sonidos**: `js/data/sonidosMovimientos.js` lista los mp3 que
  existen; si una ULTIMATE no tiene archivo se usa el sonido sintetizado en vez
  de pedir `.mp3` y `.ogg` (dos 404 por lanzamiento). Regenerar al añadir
  sonidos: `node tools/generar-sonidos.js`.
- **Resultado medido (móvil 844×390)**: menú **22,4 MB / 163 peticiones →
  1,1 MB / 90 peticiones**; escritorio 1920×1080 → **1,36 MB**. Recarga: **0 KB**.
  De ese 1,1 MB, 572 KB son imágenes WebP, 424 KB JS (gzip) y el resto HTML/CSS.
- **Referencias rotas corregidas**: `terreno-normal.png` (no existía: ahora usa
  el terreno por defecto) y `arena.png` de la Pokédex (→ `arena2.webp`).
- **Consola limpia**: se evita el CORS de `/api/version` al abrir `index.html`
  con doble clic (`file://`) y el aviso de `audioGestor.js` en cada combate.
- **Bancos de móvil restaurados**: el bloque de “banco compacto” para escritorio
  a ≤2000px no tenía `min-width`, así que en móvil también forzaba
  `height: 72px` sobre las cartas de 27px y las dejaba estiradas (27×72).
  Ahora ese bloque solo aplica a **≥1101px**: en móvil vuelven a **27×29** con
  4 columnas, sprite e iconos. Verificado a 844×390, 1024×600, 1920×900 y
  2133×1200 (escritorio 100 % y 90 % sin cambios).
  Si tras actualizar aún se veían “en vertical”, era el CSS viejo en caché: con
  las URLs versionadas por commit ya no puede pasar (hace falta un último
  Ctrl+Shift+F5 para salir de la caché anterior).
- **Banco de móvil más legible**: el hueco real del banco es **114×60 px**
  (4 columnas × 2 filas de 27×29; no cabe más sin invadir el tablero). Dentro de
  ese espacio ahora: sprite de **24 px centrado** (antes 18 px), **sin nombre**
  (a 4,8 px era ilegible y desplazaba el sprite), iconos de tipo/clase a 6 px y
  estrella a 7 px en las esquinas, y la Poké Ball de los huecos vacíos a 18 px.
  Aplica solo a móvil horizontal (≤1100 px de ancho y ≤560 px de alto), así que
  tablet y escritorio no cambian.
- **Pantalla siempre encendida en móvil** (`js/ui/wakeLock.js`): al pulsar JUGAR
  (o al primer toque dentro de la partida) se pide un **Screen Wake Lock**, así
  el móvil no apaga la pantalla por inactividad durante los combates. Si la
  pestaña se oculta o el navegador lo libera, se vuelve a pedir al volver; se
  suelta al cerrar/recargar. Requiere **HTTPS** (Render ya lo es) y navegador
  compatible (Chrome/Edge Android 84+, Safari iOS 16.4+). Si el móvil sigue
  bloqueándose, revisa **Ajustes → Pantalla → Tiempo de espera** y el **ahorro
  de energía** de Chrome; bloquear el teléfono a mano o cambiar de app sí pausa
  la partida (comportamiento normal del navegador).
- **Pantalla completa en móvil**: `manifest.webmanifest` con
  `display: fullscreen` y `orientation: landscape`, más los metas de iOS
  (`apple-mobile-web-app-capable`). Al pulsar JUGAR se pide la **Fullscreen
  API** (Android/Chrome) y se bloquea horizontal; si se sale, hay un botón
  **⛶ Pantalla completa** en Ajustes. En iPhone (sin API) se muestra un aviso
  para **Compartir → Añadir a pantalla de inicio**, que abre el juego sin
  barras. El `sw.js` es mínimo y **no cachea nada**: solo permite “Instalar
  app” en Android sin afectar a los deploys.
- **Lag en móvil (sprites GIF)**: la causa principal eran los **GIF animados**
  (10-14 decodificando a la vez). Medido con CPU 6× más lenta: tareas largas
  **18 → 14** por 8 s y el peor tirón **129 → 81 ms**; además cada PNG estático
  pesa **3-6 KB** frente a ~150 KB del GIF. Ahora, en móvil, durante el combate
  se usan **PNG estáticos** en tablero y banco (se restauran los GIF al acabar),
  y los paneles pierden el `backdrop-filter` mientras se pelea.
- **Modo rendimiento (Ajustes)**: desactiva blur, sombras y filtros y usa PNG
  estáticos también fuera del combate. Por defecto **OFF**; actívalo si tu móvil
  sigue dando tirones. Se guarda en `localStorage`.
- Los PNG estáticos están en `assets/sprites/pokemon/static/` (normal y shiny),
  generados a partir del primer frame de cada GIF. Si añades sprites nuevos, hay
  que regenerarlos (Pillow) para que el modo rendimiento los tenga.
- **IA enemiga modular**: `js/systems/enemigo.js` baja de 4.349 a ~886 líneas.
  Se ha dividido en `js/systems/enemigo/evaluacion.js` (estrategia, evaluación y
  ventas), `tablero.js` (movimiento y posicionamiento), `objetos.js` (equipar y
  comprar objetos) y `compras.js` (compras, fusiones y rerolls). Los módulos se
  cargan **antes** de `enemigo.js`; las 44 funciones se movieron sin cambiar una
  línea (verificado por comparación de AST) y el comportamiento en 8 rondas fue
  idéntico al de la versión anterior.
- **Combate modular**: `js/systems/combate.js` baja de 2.892 a ~190 líneas.
  Dividido en `combate/navegacion.js` (geometría, movimiento y objetivo),
  `combate/estado.js` (bloquear/restaurar), `combate/hud.js` (barras, stats,
  veneno/regeneración y pantalla final) y `combate/combatir.js` (bucle
  principal). Los 37 funciones se movieron sin cambios (verificado por AST) y
  una batalla real de 5v5 termina sin excepciones ni errores.
- **main.js modular**: baja de 2.778 a ~849 líneas. Dividido en
  `main/audio.js`, `main/ronda.js`, `main/rivales.js`, `main/carta.js` y
  `main/postcombate.js`. Los 71 funciones se movieron sin cambios (AST) y se
  probaron: abrir/cerrar carta, vender (oro 10→19), combate real y fin de ronda
  (fase 5→6, tienda abierta), sin excepciones.
- **Gritos sin 404**: `js/data/criasDisponibles.js` lista los 79 `.ogg` que
  existen; los monstruos PvE sin grito (190/752/834/895) usan un sonido
  sintetizado. Regenerar con `node tools/generar-crias.js`.
- **Articuno reaparece cada combate**: `_articunoYaUsoVentisca` se quedaba en
  `true` tras la primera Ventisca y bloqueaba todas las invocaciones siguientes.
  Ahora `resetArticunoAlTerminarCombate()` hace un reset completo y se llama al
  **empezar cada combate**, al **reiniciar** y al **iniciar partida**. También se
  resetea el Articuno del rival. Verificado: Hielo 6 + Chip Hielo → aparece,
  lanza Ventisca, y en el siguiente combate vuelve a aparecer.
- **Auditoría de movimientos y ultis**: 154 instancias de movimiento y 45 ultis,
  todas con implementación, descripción e icono (0 faltantes, 0 IDs duplicados).
  Se separaron las descripciones de las 5 variantes que compartían nombre
  (`Bola Voltio 2`, `Bomba Lodo 2`, `Premonición 2`, `Hidroariete 2`,
  `Rayo Carga 2`) y ahora se buscan por `iconoKey`; añadida la descripción de
  **Voltio Cruel**; corregida la clave de **Ho-Oh** (`giro-fuego-hooh`).
- **Escalado por descripción (X/X/3X)**: `js/systems/escaladoDescripcion.js`
  lee el daño de la descripción y `movAplicarDaño` aplica el factor de estrellas
  (1★/2★/3★) a movimientos y ultis. Ejemplos verificados: Bola Voltio 2 factor
  3 a 3★, Ho-Oh factor 10, daño 100 → 300 a 3★. Si la descripción tiene un solo
  valor, no escala.
- **Planca Corpulenta**: descripción restaurada a **48% de Ataque** y código
  ajustado a `atacante.ataque * 0.48` (antes usaba 8% de HP máximos).
- **Ho-Oh**: escudo del 100% de HP, daño 225/225/2250% (el 3★ lo aplica el
  factor) y **70% del daño de los aliados se redirige a Ho-Oh durante 3 s**
  (el aliado recibe el 30%). Verificado con 100 de daño → aliado -30, Ho-Oh -70.
  Los efectos secundarios (ralentizaciones, escudos, curas) siguen usando el
  valor base; escalarlos también sería una segunda pasada.
- **Eevee · Refuerzo (nueva definitiva de coste 1)**: basada en el movimiento
  real **Refuerzo / Helping Hand**. Carga 5, alcance 1, 120% de daño de Ataque a
  los enemigos adyacentes y refuerza a **un solo aliado** (el más fuerte por
  Ataque + Atq. Esp.; cualquier tipo): +25% Ataque, +25% Atq. Esp. y +10%
  Velocidad de Ataque durante 8 s. Si no hay otro aliado vivo, se refuerza a sí
  mismo. Icono propio (`assets/icons/movimientos/refuerzo.png`). Verificado:
  solo Lucario recibe 1.25/1.10, el resto queda a 1, 1 icono y restauración a
  los 8 s. Ahora hay 46 ultis.
- **Sonido de Refuerzo**: la definitiva de Eevee llama a
  `playSonidoMovimiento('Refuerzo', 0.4)` y usa
  `assets/sounds/movimientos/refuerzo.mp3`. Manifiesto regenerado
  (`node tools/generar-sonidos.js`, 109 sonidos) y fallback sintetizado
  (`refuerzo` → acorde ascendente) por si falta el archivo. Verificado:
  petición 200, 0 fallos y 0 excepciones.
- **Icono de Refuerzo en el aliado**: la ulti muestra el PNG (`mov:Refuerzo`)
  solo sobre el aliado reforzado, sea del tipo que sea, durante los 8 s del
  buff. Va arriba en el centro para no tapar nombre, HP ni objetos; al recastar
  no se duplica (se retira el icono del objetivo anterior). Verificado: 1 icono
  en Lucario, 0 a los 8 s y 0 excepciones.
- **Bug: el objetivo se volvía invisible (Lanzallamas y otros)**:
  `.board-cell.mov-zone-marcada` aplicaba la animación `movZonePop` a la propia
  casilla, y esa animación va de `opacity: 0` a `opacity: 0`. Cualquier
  movimiento que marque la casilla del objetivo con `movMarcarCasillaConTipo`
  durante menos de 1,5 s (Lanzallamas, 900 ms) desvanecía al Pokémon que había
  dentro durante todo el efecto. Ahora la casilla mantiene siempre
  `opacity: 1`/`transform: none` y el pop + glow se dibuja en `::after` (misma
  técnica que ya usaba la variante larga `mov-zone-parpadeo`). También se
  reactiva el `::after` de las zonas largas y de `casilla-nieve`, que
  `arena-horizontal.css` ocultaba con `display: none !important`. Solo cambia
  CSS (`css/efectos-movimientos.css`), sin tocar JS. Verificado en headless:
  durante los 900 ms la celda y su sprite siguen a `opacity: 1` y el overlay
  hace 0 → 1 → 0; al terminar se retira sin dejar estilos.
- **Carga inicial (móvil) — bundle de JS/CSS**: `index.html` cargaba 71
  `<script>` y 19 CSS en cascada. Ahora se empaquetan en `js/bundle.js` y
  `css/bundle.css` (1 petición cada uno, mismo orden que antes) y se cargan con
  `defer`. Medido con red emulada de 400 KB/s y 100 ms de latencia: la carga
  baja de ~4,6 s a ~3,9 s y de 108 a 23 recursos; el DOMContentLoaded pasa de
  ~4,53 s a ~3,55 s. El hash `?v=` se calcula solo para evitar caché vieja.
  - Regenerar tras editar cualquier JS/CSS: `node tools/build-bundle.js`.
  - La lista y el orden están en `tools/bundle-manifest.json`; al añadir un
    archivo nuevo, añadirlo ahí antes de regenerar.
  - El servidor también regenera el bundle al arrancar, como red de
    seguridad (si el disco es de solo lectura, avisa y usa el existente).
- **Barra de definitiva en móvil**: medía 3 px con borde de 1 px arriba/abajo,
  así que el relleno quedaba en **1 px** y casi no se veía cargar. Ahora mide
  4 px, sin borde, y el relleno ocupa los 4 px completos (verificado de 667×375
  a 926×428). El resto de barras (HP/energía) no cambia.
- **Sistema de logros + mapas desbloqueables**: 27 logros en 9 categorías
  (progresión, unidades, Pokédex, sinergias, objetos, combate, PvE y online), con XP de
  perfil, toasts de desbloqueo y panel 🏆. El perfil del menú ya no es decorativo:
  la barra de XP sube con cada logro (`Nv.` calculado con `sqrt`).
  - Persistencia: `localStorage['pktft_logros_v1']` (logros, contadores,
    récords y XP) y `localStorage['pktft_mapa_v1']` (mapa elegido).
  - 21 de esos logros desbloquean 17 mapas (más `Automático` y `Pradera`). La selección
    de mapa está en la pantalla de selección de jugador (`MAPA … CAMBIAR ›`).
    `aplicarTerrenoActual()` respeta el mapa elegido en todas las rondas; con
    `Automático` se mantiene el comportamiento por rival/PvE.
  - Archivos nuevos: `js/systems/logros.js` (datos + estado + eventos),
    `js/ui/logrosPanel.js` (panel, selector de mapas, toasts y XP) y
    `css/logros.css`. Añadidos a `tools/bundle-manifest.json`; regenerar con
    `node tools/build-bundle.js`.
  - Eventos enganchados: `combate_fin` (victorias, PvE, daño/curación,
    intocable, contra las cuerdas), `torneo_ganado`, `fusion` (3★ y coste 5),
    `objeto_equipado` (solo unidades del jugador), `sinergias`, `nivel`,
    `baul` y `online_fin`.
  - **Logros de Pokédex** (categoría 📖): leen el progreso real de la Pokédex
    (`Pokedex.contar()`) en vez de llevar un contador aparte. `Primera ficha`
    (1 registrado), `Investigador` (10), `Biólogo de campo` (25), `Pokédex
    completa` (45), `Ojo entrenador` (10 vistos) y `Vigía de Kanto` (30
    vistos). Se comprueban al comprar/ver un Pokémon (hook en `guardar()` de
    `pokedexEstado.js`) y al arrancar de forma silenciosa, para recuperar los
    ya cumplidos sin toasts.
  - El modo creativo/sandbox no cuenta. Los objetos que equipa la IA tampoco.
  - Verificado en headless: desbloqueo por evento real, persistencia tras
    recargar, mapa aplicado al iniciar partida, mapa bloqueado no seleccionable,
    panel y selector en móvil (667×375–926×428) y escritorio (1366×768–2133×1200),
    0 excepciones JS.
  - **Fondo del menú principal**: `Automático` y `Pradera` están siempre
    desbloqueados, y el menú conserva SIEMPRE el fondo original de Pradera. El
    mapa elegido se aplica solo dentro de la partida. Al volver al menú se
    restaura Pradera (no queda el último terreno del rival).
  - **Cambiar de mapa en partida**: botón 🗺️ en la cabecera del juego (junto a
    ⚙️). Abre el selector y aplica el mapa al instante. `Automático` vuelve al
    terreno del rival. También se puede elegir antes de empezar en la pantalla
    de selección de jugador (`MAPA … CAMBIAR ›`). La elección se recuerda.
  - **🔁 Alternar mapa**: casilla en el selector de mapas. Con un mapa fijo
    elegido, usa el tuyo en las rondas **impares** y el del rival en las
    **pares** (en PvE, el del monstruo/salvaje). Con `Automático` está
    desactivada porque ya usa siempre el del rival. Se guarda en
    `localStorage['pktft_mapa_alternar']`.
  - **Terrenos de jefe PvE**: cada ronda de `MONSTRUOS_PVE` puede definir
    `terreno`. Ahora **Araquanid** usa `terreno-araquanid.webp`, **Drednaw**
    `terreno-pantano.webp` y **Regidrago** `terreno-regidrago.webp`; tienen
    prioridad sobre el mapa elegido y se aplican al spawnear el monstruo
    (también en el spawn retrasado de 2 s).
  - **Saltar animación de evolución**: botón `SALTAR ⏭` arriba a la derecha
    del overlay (`#btnSaltarEvolucion`). Cancela todos los timers/intervalos,
    para los sonidos de evolución y resuelve la promesa al momento; la fusión
    ya está hecha, solo se acelera la parte visual. La finalización normal usa
    el mismo limpiador (`_finalizarAnimacion`).
  - **Ranking: daño del rival al que te enfrentas**: `combatir.js` ahora
    escribe `_estadoRonda` (✖/✔) y `_danoRonda` (-X) también en el rival del
    combate del jugador. `simularCombatesRivales` ya no resetea ese rival, así
    que era el único que se quedaba sin el `-X` mientras los simulados sí lo
    tenían. Además, un HP inválido (`NaN`) ya no deja la fila sin número/barra:
    se usa el máximo del torneo como valor seguro.
  - **Último diálogo del rival eliminado**: si el rival cae eliminado en esa
    ronda (`rival.eliminado` o `vida <= 0`), `mostrarReaccionEnemigo` usa la
    situación `eliminado`: frase de despedida propia del rival desde
    `COMIC_FRASES_ELIMINADO_RIVAL` (en `comicBubble.js`) y estilo
    `bubble-eliminado` (borde dorado). Si no está eliminado, sigue usando el
    `lose` normal. El bocadillo de despedida dura 4,5 s en vez de 3,5 s.
  - **Manifest sin CORS en file://**: el `<link rel="manifest">` se inyecta
    solo por HTTP(S). Al abrir `index.html` con `file://` ya no se pide
    `manifest.webmanifest` ni aparece el error de CORS.
  - **Daño por derrota**: se mantiene la fórmula original `base + 1 por CADA
    unidad viva del ganador` (con cap global de 20). Se probó un tope de +3 y
    se revirtió: el usuario se refería al daño de los Pokémon en combate, no
    al HP que se pierde al final de ronda.
  - **Cupo de objetos por ronda**: el objetivo de cada participante es
    **1 objeto por ronda de tienda + los Discos Definitivos de su nivel**
    (1 desde nivel 5, 2 desde nivel 8). Las rondas de tienda son
    3, 7, 9, 13, 15, 19, 21, 25, 27... → 1, 2, 3, 4, 5, 6, 7, 8, 9...
    Al final de cada ronda, `igualarObjetosRivales()` deja a **todos los
    rivales** (también los eliminados, para el ranking final) exactamente en
    ese cupo: rellena si van por debajo y quita el exceso si van por encima.
    Los huecos reales son 2 normales por unidad + los discos que permite el
    nivel del equipo (no un disco por cada unidad 2★). Así un rival nunca
    queda por debajo ni por encima de lo que toca por ronda/nivel. El jugador
    conserva los objetos extra que gane por recompensas/ventas.
  - **Daño de Pokémon**: se auditó y se probaron recortes en Snorlax y Hoopa,
    pero el usuario pidió **restaurarlos**: se mantienen los valores originales
    (Snorlax 3★: 2500% + rodada extra de 800%; Hoopa 3★: 100% HP, 100 energía y
    +250% Atk/AtkEsp).
    - El panel de datos de combate vuelve a mostrar **“Daño infligido”** y
      **solo el número**, sin el texto “total acumulado” ni el **💥 mayor
      golpe** (se quitaron porque no gustaban). El filtro de estadísticas ya no
      descarta golpes legítimos >5000 (el umbral anti-bug pasa a 100.000). El
      seguimiento interno de `maxHitDealt`/`maxHitTaken` se mantiene, pero no se muestra.
  - **Victoria total inmediata**: si el último combate elimina al último
    rival, `ejecutarFinDeRonda` no hace la transición (no limpia el tablero ni
    asigna otro rival): snapshot final + igualar objetos + `comprobarFinTorneo`
    directo. La celebración baja a 400 ms y la pantalla de resultados aparece
    ~0,8 s después del combate (antes se veían varios segundos el rival y su
    baúl). También se evita el combate fantasma de `simularCombatesRivales`
    cuando ya no queda nadie vivo.
  - **Pokédex realista (registrado / visto / no visto)**:
    `js/systems/pokedexEstado.js` guarda en
    `localStorage['pktft_pokedex_v1']` los Pokémon **registrados** (comprados u
    obtenidos) y **vistos** (equipo rival o espiado), agrupados por **familia
    base** (Ivysaur cuenta como Bulbasaur).
    - Al comprar en la tienda se registra la familia.
    - Al empezar cada combate, los Pokémon del jugador se registran como
      comprados y los del rival como vistos; al espiar a un rival también.
    - La Pokédex muestra ✅ registrados, 👁 vistos (silueta, sin datos) y ❓ no
      vistos (???), con filtro por estado y contador de progreso. Al abrir una
      ficha no registrada se muestra un aviso sin stats/movimientos.
    - **Shiny**: al comprar una unidad shiny se guarda su familia en
      `shinies` (también al sincronizar el equipo, por si llega por fusión).
      La ficha y el detalle usan el sprite shiny (`assets/sprites/pokemon/shiny/`)
      con una insignia ✨, y el detalle incluye un botón para alternar entre la
      forma shiny y la normal. Las fichas shiny solo aparecen si la familia
      está registrada (no para simples avistamientos).
    - El modo creativo no cuenta. `Pokedex.reiniciar()` permite borrar el
      progreso por consola (aún no hay botón en Ajustes).
  - **Fix del fondo blanco**: `--terreno-actual` se usa dentro de `css/base.css`,
    así que las URLs inline deben ser `../assets/...`. Con `assets/...` el
    navegador las resolvía como `/css/assets/...` (404) y el menú salía blanco.
- **Tienda con hueco fijo**: al comprar una carta su slot se queda **vacío y
  oculto** en su sitio; las cartas de la derecha **no se mueven**. La tienda se
  rellena entera al empezar la siguiente ronda (o al hacer reroll). Reabrir la
  tienda ya **no genera cartas gratis**.
- **Sin seleccionar texto al arrastrar**: `#juegoContainer`, la ficha del
  Pokémon (`#cartaPanel`) y la tienda (`#tiendaOverlay`) llevan
  `user-select: none` (con `input/textarea` seleccionables). Se acabó el
  sombreado azul al arrastrar cartas o unidades.
- **Logros con cabecera fija**: el modal de logros tiene altura fija
  (`min(92vh, 780px)`, en móvil `100dvh - 12px`) y la rejilla hace scroll, así
  que el título y las pestañas **no se mueven** al cambiar de categoría
  (igual que la Pokédex).
