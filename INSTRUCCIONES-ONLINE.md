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
