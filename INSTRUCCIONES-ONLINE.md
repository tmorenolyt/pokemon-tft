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
