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
- **Paisaje**: todo cabe en una pantalla. Cabecera y barra de acciones compactas,
  los dos tableros lado a lado con **casillas cuadradas**, banco y baúl visibles
  y reducidos, y el ranking oculto (se abre con el botón **🏆** de la cabecera).
  Las sinergias se abren con el botón **⚔️** de la cabecera (panel desplegable).
  La barra de acciones va centrada y mantiene visible la barra de XP.
- **Cartas del tablero**: se ven las barras de **vida**, **energía** y **definitiva**
  (esta última solo si el Pokémon lleva Disco Definitivo). Para que quepan, en
  móvil no se dibujan los iconos de objetos equipados dentro de la carta.
- **Banco**: se muestra el contador compacto (p. ej. `3/7`) en vez de las 6
  pokéballs, porque en la columna estrecha del móvil no caben los dos.
- **Tienda**: ocupa toda la pantalla y se puede desplazar con el dedo.
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
