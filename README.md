# Guardian Packaging — Sitio Web + Cotizador

Landing page premium + configurador de cotización multi-paso para Guardian Packaging.
Construido con **Node.js + Express + EJS + Bootstrap 5** (landing) y **Next.js 16 + Tailwind v4 + Framer Motion** (cotizador).

---

## Estructura

```
/                     ← Landing page (puerto 3000)
└── configurator/     ← Cotizador Next.js (puerto 3001)
```

## Correr en local

**Landing:**
```bash
npm install && npm start
```

**Cotizador (en otra terminal):**
```bash
cd configurator && npm install && npm run dev
```

Abre **http://localhost:3000** — el cotizador aparece embebido al final de la página.

## Variables de entorno del cotizador

Crea `configurator/.env.local`:
```
MONDAY_API_KEY=tu_api_key
MONDAY_BOARD_ID=18412418108
MONDAY_GROUP_ID=topics
MONDAY_COL_EMAIL=lead_email
MONDAY_COL_PHONE=lead_phone
MONDAY_COL_COMPANY=lead_company
MONDAY_COL_PACKAGING_TYPE=text_mm35cd7m
MONDAY_COL_QUANTITY=text_mm35j3qn
MONDAY_COL_MESSAGE=long_text_mm35x7ww
MONDAY_COL_ATTACHMENT=file_mm35mvqv
```

---

## Detalle técnico original

---

## 🚀 Cómo correr

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar el servidor
npm start

# 3. Abrir
http://localhost:3000
```

Con `nodemon` (auto-reload mientras editas):
```bash
npm install -D nodemon
npm run dev
```

---

## 📁 Estructura

```
ultrapac-clone/
├── server.js              ← Express + datos del sitio (EDITA AQUÍ EL CONTENIDO)
├── package.json
├── views/
│   ├── index.ejs          ← Layout principal
│   └── partials/          ← Cada sección por separado (más fácil de editar)
│       ├── navbar.ejs
│       ├── hero.ejs
│       ├── features.ejs
│       ├── products.ejs
│       ├── three-section.ejs   ← Sección 3D scroll-driven
│       ├── steps.ejs
│       ├── gallery.ejs
│       ├── materials.ejs
│       ├── finishes.ejs
│       ├── faq.ejs
│       ├── contact.ejs
│       └── footer.ejs
└── public/
    ├── css/styles.css     ← Estilos (paleta, tipografía, animaciones)
    ├── js/
    │   ├── main.js        ← Navbar, mobile menu, gallery, smooth scroll
    │   ├── animations.js  ← GSAP + IntersectionObserver reveals
    │   └── three-scene.js ← Escena 3D scroll-driven (Three.js)
    └── img/               ← Pon aquí tus imágenes
```

---

## ✏️ Cómo rellenar tu información

### 1) Texto y datos
Abre **`server.js`** y edita el objeto `data` dentro de `app.get('/')`. Ahí están todos los textos, productos, pasos, materiales, FAQs, etc.

### 2) Imágenes
Pon tus imágenes en `public/img/` y reemplaza los placeholders en los partials. Busca los comentarios `[ /img/... ]` en cada `.ejs`.

Sugerido:
- `hero-product.png` — imagen principal del hero (PNG transparente)
- `products-hero.jpg` — imagen full-width de productos
- `gallery-1.jpg` ... `gallery-5.jpg` — items de la galería
- `material-1.png` ... — materiales
- `finish-1.png` ... — acabados
- `video-mask.webm` — video que se enmascara con el texto grande

### 3) Sección 3D
En `public/js/three-scene.js`:
- Ahora usa una bolsa procedural creada con geometría básica (placeholder).
- Cuando tengas tu modelo `.glb` real, descomenta el `GLTFLoader` y carga `/models/tu-producto.glb`.

### 4) Paleta de colores
En `public/css/styles.css`, top del archivo, modifica las variables CSS:
```css
:root {
  --bg-cream:     #f5f1ea;   /* fondo principal */
  --accent:       #4d5c3a;   /* color de acento */
  --accent-2:     #c9a66b;   /* color secundario */
  ...
}
```

### 5) Tipografía
Por defecto usa **Inter** (sans) + **Instrument Serif** (italic decorativo). Si quieres cambiar, edita la línea de `<link href="https://fonts.googleapis.com/...">` en `views/index.ejs` y la variable `--font-sans` / `--font-serif` en `styles.css`.

### 6) Formulario de contacto
El formulario hace POST a `/contacto`. Está apuntando a un handler simple en `server.js` que solo logea. Conéctalo a tu servicio favorito:
- **Resend / SendGrid / Mailgun** — enviar email
- **Slack webhook** — notificar al canal de ventas
- **Sheets API** — guardar en Google Sheets
- **Tu CRM**

---

## 🎨 Animaciones incluidas

- **Page loader** inicial con barra de progreso
- **Hero reveal** con líneas de texto que suben en cascada
- **Reveal-on-scroll** para cualquier elemento con clase `.reveal-up` o `.reveal-scale`
- **Parallax suave** del producto del hero
- **3D Scroll-driven** — la bolsa rota y la cámara hace dolly-zoom mientras scrolleas la sección oscura
- **Barra de progreso de frames** estilo Ultrapac
- **Hover lift** en cards de productos, pasos, materiales
- **Smooth scroll** para todos los anchors

---

## 🔧 Tecnologías

- **Express 4** — servidor
- **EJS** — templates con partials
- **Bootstrap 5.3** — grid + utilidades
- **Bootstrap Icons** — iconos
- **GSAP + ScrollTrigger** — animaciones de scroll
- **Three.js 0.160** — escena 3D
- **Inter + Instrument Serif** — tipografías

---

## 📦 Deploy

Para producción, cualquiera de estas funciona:
- **Vercel** / **Netlify** (con un wrapper o `serverless-http`)
- **Railway** / **Render** / **Fly.io** (Node.js directo)
- **VPS** propio con `pm2` + `nginx`

Variables de entorno útiles:
- `PORT` — puerto (default 3000)

---

## 📝 TODOs comunes

- [ ] Reemplazar todos los `[PLACEHOLDER]` en `server.js`
- [ ] Subir imágenes reales a `public/img/`
- [ ] Conectar el formulario a tu backend real
- [ ] Cambiar el WhatsApp en `server.js > brand.whatsapp`
- [ ] Cambiar favicon en `views/index.ejs`
- [ ] Añadir Google Analytics / Meta Pixel si aplica
- [ ] Configurar OG image para redes sociales
- [ ] Cargar modelo 3D real en `three-scene.js`

¡Listo para rellenar! 🚀
