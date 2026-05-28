// =====================================================================
// SERVIDOR EXPRESS — Empaques Guardian Landing
// =====================================================================

require('dotenv').config({ path: '.env.local' });

const express   = require('express');
const path      = require('path');
const multer    = require('multer');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');

const app    = express();
const PORT   = process.env.PORT || 3000;

// ── Seguridad: headers HTTP ──
app.use(helmet({
  contentSecurityPolicy: false, // EJS + CDNs externos requieren CSP manual — desactivado por ahora
}));

// ── Rate limiting: máx 10 envíos de formulario por IP cada 15 min ──
const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { ok: false, error: 'Demasiadas solicitudes. Intenta en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Multer: solo imágenes y PDF, máx 10 MB ──
const ALLOWED_TYPES = ['image/jpeg','image/png','image/webp','image/gif','application/pdf'];
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Tipo de archivo no permitido'));
  },
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// =====================================================================
// DATOS DEL SITIO
// =====================================================================

const brand = {
  name:     'Guardian Packaging',
  tagline:  'Empaques premium a medida',
  whatsapp: '',
  logoText: 'Guardian Packaging'
};

const products = [
  {
    num:       '01',
    slug:      'bolsas-personalizadas',
    name:      'Bolsas Personalizadas',
    short:     'Stand-up, spout bags, fondo plano y más',
    desc:      'Bolsas flexibles de grado alimenticio en cualquier estilo: stand-up doypack, spout bag con boquilla, sellada por detrás, fondo plano o forma especial. Laminación matte, brillante o soft touch. Barrera multicapa contra humedad, luz y oxígeno.',
    highlight: 'Más popular',
    stats: [
      { val: 'desde 1,000', lbl: 'Piezas mínimo' },
      { val: '100%',        lbl: 'Grado alimenticio' },
      { val: '10 tintas',   lbl: 'Impresión full color' },
      { val: '3–5 sem.',    lbl: 'Tiempo de entrega' },
    ],
    features: [
      'Stand-up doypack, spout bag, fondo plano, back seal y formas especiales a diseño',
      'Cierre ziplock estándar (4 mm), child-resistant o easy-open según aplicación',
      'Barrera activa: aluminio laminado, metálico, kraft o film transparente',
      'Laminación matte, brillante o soft touch con efectos foil, UV y relieve',
      'Impresión rotograbado full color hasta 10 tintas + Pantone y tintas especiales',
      'Materiales certificados FDA / LFGB para contacto directo con alimento',
    ],
    specs: {
      'Materiales':    'PET/PE · OPP/PE · NYLON/PE · Kraft/PE · PET metalizado · Mylar',
      'Grosor':        'Desde 65 µm hasta 200 µm según barrera requerida',
      'Impresión':     'Rotograbado / Flexografía — hasta 10 tintas + Pantone',
      'Cierre':        'Ziplock 4 mm · Child-resistant · Easy-open · Sin cierre',
      'Certificación': 'FDA (EE.UU.) · LFGB (Europa) · Grado alimenticio México',
      'Mínimo':        'Desde 1,000 piezas por estilo',
      'Entrega':       '3 a 5 semanas desde aprobación de arte',
    },
    applications: ['Snacks y botanas', 'Café y té', 'Suplementos y gomitas', 'Condimentos', 'Cosméticos en polvo', 'Proteínas deportivas', 'Hierbas y especias'],
    examples: [
      { img: 'bolsa-standup.jpg',    label: 'Stand Up Pouch' },
      { img: 'bolsa-spout.png',      label: 'Spout Bag' },
      { img: 'bolsa-fondoplano.png', label: 'Fondo Plano' },
      { img: 'bolsa-backseal.png',   label: 'Back Seal' },
    ],
    variants: [
      { label: 'Stand Up',       img: 'bolsa-standup.jpg' },
      { label: 'Spout Bag',      img: 'bolsa-spout.png' },
      { label: 'Fondo Plano',    img: 'bolsa-fondoplano.png' },
      { label: 'Back Seal',      img: 'bolsa-backseal.png' },
      { label: 'Forma Especial', img: 'bolsa-especial.jpg' },
      { label: '3 Sellos',       img: 'bolsa-3sellos.png' },
    ],
    finishes: [
      { label: 'Matte',          img: 'lam-matte.jpg' },
      { label: 'Brillante',      img: 'lam-brillante.jpg' },
      { label: 'Soft Touch',     img: 'lam-softtouch.jpg' },
      { label: 'Foil Stamping',  img: 'efecto-foil.jpg' },
      { label: 'Barniz UV',      img: 'efecto-uv.jpg' },
      { label: 'Barniz Relieve', img: 'efecto-relieve.jpg' },
      { label: 'Metálico',       img: 'efecto-metalico.jpg' },
      { label: 'Kraft',          img: 'mat-kraft.jpg' },
      { label: 'Mylar PET',      img: 'mat-pet.png' },
      { label: 'Holográfico',    img: 'mat-holograma.jpg' },
    ],
  },
  {
    num:       '02',
    slug:      'sachets-3-sellos',
    name:      'Sachets / 3 Sellos',
    short:     'Porciones individuales selladas por tres lados',
    desc:      'Sachets planos sellados herméticamente por tres lados, fabricados a la medida exacta en milímetros. Ideales para porciones individuales de alimentos, suplementos, cosméticos o muestras de producto. Tear notch de fácil apertura y material certificado.',
    highlight: null,
    stats: [
      { val: 'desde 5,000', lbl: 'Piezas mínimo' },
      { val: '100%',        lbl: 'Grado alimenticio' },
      { val: 'a la medida', lbl: 'Dimensiones en mm' },
      { val: '3–4 sem.',    lbl: 'Tiempo de entrega' },
    ],
    features: [
      'Sellado hermético por tres lados con control de temperatura y presión',
      'Dimensiones completamente a la medida: ancho y alto en milímetros exactos',
      'Tear notch de fácil apertura en esquina o lateral',
      'Capacidad desde 5 ml hasta 500 ml según producto',
      'Material grado alimenticio o cosmético — certificado FDA/LFGB',
      'Impresión full color en exterior e interior con tintas aptas para contacto',
    ],
    specs: {
      'Materiales':    'PET/PE · OPP/PE · NYLON/PE · Kraft/PE · Foil/PE',
      'Grosor':        'Desde 70 µm hasta 160 µm',
      'Capacidad':     'Desde 5 ml hasta 500 ml',
      'Apertura':      'Tear notch recto o en ángulo · Opcional con resello',
      'Impresión':     'Rotograbado hasta 8 tintas + Pantone',
      'Certificación': 'FDA · LFGB · Grado alimenticio y cosmético',
      'Mínimo':        'Desde 5,000 piezas',
      'Entrega':       '3 a 4 semanas desde aprobación de arte',
    },
    applications: ['Salsas y condimentos', 'Suplementos y proteínas', 'Cremas y mascarillas', 'Muestras de producto', 'Alimentos procesados', 'Aceites y aderezos', 'Shampoo monodosis'],
    examples: [
      { img: 'cotizador/sachet-te.png',     label: 'Sachet individual' },
      { img: 'sachets-3-sellos.jpg',        label: '3 sellos estándar' },
      { img: 'cotizador/sachet-energy.png', label: 'Suplementos' },
      { img: 'cotizador/sachet-detox.png',  label: 'Alimentos' },
    ],
    variants: [
      { label: 'Sachet Plano',   img: 'sachets-main.png' },
    ],
    finishes: [
      { label: 'Matte',          img: 'lam-matte.jpg' },
      { label: 'Brillante',      img: 'lam-brillante.jpg' },
      { label: 'Soft Touch',     img: 'lam-softtouch.jpg' },
      { label: 'Foil Stamping',  img: 'efecto-foil.jpg' },
      { label: 'Barniz UV',      img: 'efecto-uv.jpg' },
      { label: 'Kraft',          img: 'mat-kraft.jpg' },
    ],
  },
  {
    num:       '03',
    slug:      'cajas-carton',
    name:      'Cajas de Cartón',
    short:     'Cajas personalizadas con acabados premium',
    desc:      'Cajas de cartón folding o rígido con medidas completamente a la medida. Desde una caja tincture sencilla hasta una caja display con ventana troquelada y foil stamping. Impresión CMYK + Pantone y acabados de lujo.',
    highlight: null,
    stats: [
      { val: 'desde 1,000', lbl: 'Piezas mínimo' },
      { val: 'CMYK+Pantone',lbl: 'Impresión' },
      { val: '8+ acabados',  lbl: 'Opciones de finish' },
      { val: '4–6 sem.',    lbl: 'Tiempo de entrega' },
    ],
    features: [
      'Medidas personalizadas ancho × alto × profundidad en milímetros exactos',
      'Cartón SBS blanco (GD2 / GC2), kraft natural o lámina doble pared',
      'Troquelado de precisión: perforaciones, ventanas, lengüetas y ensamble automático',
      'Impresión offset CMYK + hasta 2 Pantone o full Pantone para fidelidad de color',
      'Acabados: laminación matte / brillante / soft touch + UV localizado, foil y gofrado',
      'Opciones de display: hang tab, euroslot, ventana PET, inserto interior',
    ],
    specs: {
      'Sustratos':     'SBS (GD2/GC2) · Kraft · Kraft doble pared · Cartoncillo blanco',
      'Gramaje':       'Desde 250 g/m² hasta 450 g/m²',
      'Impresión':     'Offset 4 colores + Pantone · Barniz acuoso de protección',
      'Acabados':      'Lam. matte/brillante/soft touch · UV · Foil · Relieve · Gofrado',
      'Armado':        'Automático (glue flap) · Manual · Lock-bottom · Magnético',
      'Troquelado':    'Ventana PET · Hang tab · Euroslot · Perforación · Troquel especial',
      'Mínimo':        'Desde 1,000 piezas',
      'Entrega':       '4 a 6 semanas desde aprobación de arte',
    },
    applications: ['Cremas y suplementos', 'Artículos de regalo', 'Cosméticos premium', 'Alimentos envasados', 'E-commerce y retail', 'Farmacéuticos OTC', 'Electrónicos y accesorios'],
    examples: [
      { img: 'cajas-carton.jpg',    label: 'Caja personalizada' },
      { img: 'caja-tincture.png',   label: 'Tincture Box' },
      { img: 'caja-lockbottom.png', label: 'Lock Bottom' },
      { img: 'caja-hangtab.png',    label: 'Hang Tab' },
    ],
    variants: [
      { label: 'Tincture Box',   img: 'caja-tincture.png' },
      { label: 'Lock Bottom',    img: 'caja-lockbottom.png' },
      { label: 'Hang Tab',       img: 'caja-hangtab.png' },
    ],
    finishes: [
      { label: 'Lam. Matte',     img: 'acabado-matte.png' },
      { label: 'Lam. Brillante', img: 'acabado-brillante.png' },
      { label: 'Lam. Metálica',  img: 'acabado-metalico.png' },
      { label: 'Soft Touch',     img: 'acabado-softtouch.jpg' },
      { label: 'Foil Stamping',  img: 'efecto-foil-caja.jpg' },
      { label: 'Barniz UV',      img: 'efecto-uv-caja.jpg' },
      { label: 'Barniz Relieve', img: 'efecto-relieve-caja.jpg' },
      { label: 'Gofrado',        img: 'efecto-gofrado.jpg' },
    ],
  },
  {
    num:       '04',
    slug:      'tubos-carton',
    name:      'Tubos de Cartón',
    short:     'Tubos cilíndricos premium con tapa a medida',
    desc:      'Tubos de cartón multicapa en diámetro y altura completamente personalizables. Estructura rígida con tapa ajustada, laminación exterior y efectos especiales. El empaque de lujo ideal para cosméticos, suplementos y productos de edición especial.',
    highlight: null,
    stats: [
      { val: 'desde 500',  lbl: 'Piezas mínimo' },
      { val: '360°',       lbl: 'Impresión exterior' },
      { val: 'a medida',   lbl: 'Diámetro y altura' },
      { val: '4–6 sem.',   lbl: 'Tiempo de entrega' },
    ],
    features: [
      'Diámetro desde 30 mm hasta 150 mm y altura totalmente personalizable',
      'Estructura multicapa: cartón kraft + papel interior blanco o kraft',
      'Tapa con ajuste preciso: slip-lid (deslizante) o tapa a presión',
      'Impresión 360° exterior en offset o serigrafía full color',
      'Laminación matte, brillante o soft touch con foil y UV localizado',
      'Base opcional: metal, plástico reciclado o cartón reforzado',
    ],
    specs: {
      'Diámetro':      'Desde Ø30 mm hasta Ø150 mm',
      'Altura':        'A medida — desde 50 mm hasta 400 mm',
      'Capas':         'De 3 a 7 capas de cartón kraft según rigidez requerida',
      'Tapa':          'Slip-lid · Tapa a presión · Tapa con bisagra',
      'Impresión':     'Offset / Serigrafía 360° — full color + Pantone',
      'Acabados':      'Lam. matte/brillante/soft touch · Foil · UV · Gofrado',
      'Base':          'Cartón · Metal · Plástico reciclado PCR',
      'Mínimo':        'Desde 500 piezas',
      'Entrega':       '4 a 6 semanas desde aprobación de arte',
    },
    applications: ['Cremas y sueros', 'Suplementos en polvo', 'Artículos de regalo', 'Cosméticos premium', 'Edición especial', 'Velas aromáticas', 'Té y café gourmet'],
    examples: [
      { img: 'tubos-main.png',    label: 'Tubo de cartón' },
      { img: 'tubo-matte.jpg',    label: 'Acabado matte' },
      { img: 'tubo-foil.png',     label: 'Foil stamping' },
      { img: 'tubo-relieve.jpg',  label: 'Relieve UV' },
    ],
    variants: [
      { label: 'Tubo de Cartón', img: 'tubos-main.png' },
    ],
    finishes: [
      { label: 'Lam. Matte',     img: 'tubo-matte.jpg' },
      { label: 'Foil',           img: 'tubo-foil.png' },
      { label: 'Barniz UV',      img: 'tubo-uv.png' },
      { label: 'Barniz Relieve', img: 'tubo-relieve.jpg' },
    ],
  },
];

const steps = [
  {
    num:   '001',
    title: 'Cuéntanos',
    desc:  'Compártenos tu producto, volúmenes estimados y cualquier requerimiento especial. Sin compromisos — solo una conversación.'
  },
  {
    num:   '002',
    title: 'Diseñamos',
    desc:  'Proponemos materiales, acabados y arte de etiqueta pensados para tu categoría. Muestra física disponible antes de producción.'
  },
  {
    num:   '003',
    title: 'Entregamos',
    desc:  'Producción nacional en 3–5 semanas. Inventario en almacén en 3–7 días. Entregamos directo a tu almacén o punto de uso.'
  }
];

const gallery = [
  { name: 'Bolsas Personalizadas', img: 'bolsa-de-chile.png',       link: '/producto/bolsas-personalizadas#ejemplos' },
  { name: 'Tubos de Cartón',       img: 'semillas-de-calabaza.png', link: '/producto/tubos-carton#ejemplos' },
  { name: 'Sachets de 3 Sellos',   img: 'te.png',                   link: '/producto/sachets-3-sellos#ejemplos' },
  { name: 'Cajas Personalizadas',  img: 'serum-con-gotero.png',     link: '/producto/cajas-carton#ejemplos' },
  { name: 'Foil Stamping',         img: 'foil-laminado.png' },
  { name: 'Bolsa Spout Bag',       img: 'bolsa-spout.png' },
  { name: 'Laminación Matte',      img: 'lam-matte.png' },
  { name: 'Mylar PET',             img: 'mylar-pet.png' },
  { name: 'Soft Touch',            img: 'soft-touch.png' },
  { name: 'Bolsa Fondo Plano',     img: 'bolsa-fondo-plano.png' },
];

const data = { brand, products, hero: {
  title:   'Empaques que elevan tu marca.',
  subtitle: 'Soluciones de packaging personalizadas, certificadas y listas para escalar tu negocio. Desde la idea hasta tu almacén.',
  ctaText: 'Cotiza tu empaque'
}, steps, gallery };

// =====================================================================
// MONDAY.COM HELPERS
// =====================================================================

// Carga el mapa de columnas generado por scripts/setup-monday.js
let MONDAY_COLS = {};
try {
  MONDAY_COLS = JSON.parse(require('fs').readFileSync('./monday-columns.json', 'utf8'));
} catch {
  // Sin configuración — se usarán sólo las columnas hardcodeadas originales
}

const PRODUCT_LABELS_SRV = {
  bolsas: 'Bolsas Personalizadas', sachets: 'Sachets / 3 Sellos',
  cajas:  'Cajas de Cartón',       tubos:   'Tubos de Cartón',
  envases: 'Envases (Vidrio / Plástico)',
};
const CONFIG_LABELS_SRV = {
  estilo:'Estilo', tipo:'Tipo', tamano:'Tamaño', medidas:'Medidas',
  specs:'Especificaciones', material:'Material', laminacion:'Laminación',
  efectos:'Efectos especiales', acabado:'Acabado', especiales:'Acabados especiales',
  skus:'SKUs', cantidad:'Cantidad', referencia:'Descripción',
};

function formatProductConfig(product) {
  const label = PRODUCT_LABELS_SRV[product.type] || product.type;
  const lines = [`${label}`];
  Object.entries(product.config || {}).forEach(([k, v]) => {
    const keyLabel = CONFIG_LABELS_SRV[k] || k;
    let vStr;
    if (typeof v === 'object' && !Array.isArray(v)) {
      vStr = Object.entries(v).filter(([, x]) => x).map(([mk, mv]) => `${mk}: ${mv}`).join(', ');
    } else if (Array.isArray(v)) {
      vStr = v.join(', ');
    } else {
      vStr = v;
    }
    if (vStr) lines.push(`  ${keyLabel}: ${vStr}`);
  });
  return lines.join('\n');
}

async function createMondayItem({ contact, productType, productLabel, quantity, productConfig, productNotes, address }) {
  const cols = {};
  const C = MONDAY_COLS; // columnas dinámicas del setup script

  // ── Contacto ──────────────────────────────────────────────
  if (contact.email) {
    cols['lead_email'] = { email: contact.email, text: contact.email };
    if (C.col_email) cols[C.col_email] = { email: contact.email, text: contact.email };
  }
  const digits = (contact.phone || '').replace(/\D/g, '');
  if (digits.length >= 7) {
    cols['lead_phone'] = { phone: contact.phone, countryShortName: 'MX' };
    if (C.col_phone) cols[C.col_phone] = { phone: contact.phone, countryShortName: 'MX' };
  }
  const empresa = contact.company || '';
  if (empresa) {
    cols['lead_company'] = empresa;
    if (C.col_empresa) cols[C.col_empresa] = empresa;
  }

  // ── Tipo y cantidad (columnas originales + nuevas) ────────
  if (C.col_tipo_empaque) cols[C.col_tipo_empaque] = productLabel || '';
  cols['text_mm35cd7m'] = productLabel || '';
  cols['text']          = productLabel || '';
  if (quantity) {
    if (C.col_cantidad) cols[C.col_cantidad] = quantity;
    cols['text_mm35j3qn'] = quantity;
  }

  // ── Configuración del producto (columnas dedicadas) ───────
  if (productConfig) {
    if (productConfig.estilo && C.col_estilo)       cols[C.col_estilo]   = productConfig.estilo;
    if (productConfig.tipo   && C.col_estilo)       cols[C.col_estilo]   = cols[C.col_estilo] || productConfig.tipo;
    if (productConfig.material && C.col_material)   cols[C.col_material] = productConfig.material;
    if (C.col_acabado) {
      const acabado = [productConfig.acabado, productConfig.laminacion].filter(Boolean).join(' / ');
      if (acabado) cols[C.col_acabado] = acabado;
    }
    if (C.col_efectos) {
      const efectos = [
        ...(Array.isArray(productConfig.efectos)   ? productConfig.efectos   : []),
        ...(Array.isArray(productConfig.especiales) ? productConfig.especiales : []),
      ].filter(v => v && v !== 'Ninguno' && v !== 'No requiere');
      if (efectos.length) cols[C.col_efectos] = efectos.join(', ');
    }
    if (productConfig.skus && C.col_skus)     cols[C.col_skus]  = productConfig.skus;
    if (C.col_specs && Array.isArray(productConfig.specs)) {
      const specs = productConfig.specs.filter(s => s !== 'Ninguna');
      if (specs.length) cols[C.col_specs] = specs.join(', ');
    }
  }

  // ── Dirección ─────────────────────────────────────────────
  if (address) {
    if (C.col_ciudad) cols[C.col_ciudad] = [address.city, address.colonia].filter(Boolean).join(', ');
    if (C.col_pais)   cols[C.col_pais]   = address.pais || '';
    if (C.col_direccion) {
      cols[C.col_direccion] = { text: [
        address.street,
        address.colonia ? `Col. ${address.colonia}` : '',
        `${address.city} C.P. ${address.cp}`,
        address.referencia || '',
        address.pais || '',
      ].filter(Boolean).join('\n') };
    }
  }

  // ── Estado inicial ─────────────────────────────────────────
  cols['lead_status']    = { index: 0 };
  cols['color_mm1gcy3t'] = { index: 5 };

  // ── Fecha de solicitud ────────────────────────────────────
  if (C.col_fecha) {
    const hoy = new Date().toISOString().split('T')[0];
    cols[C.col_fecha] = { date: hoy };
  }

  // ── Notas / detalle completo ──────────────────────────────
  const fecha = new Date().toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
  const notasTexto = [
    `📋 COTIZACIÓN — ${fecha}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    productNotes,
  ].join('\n');

  cols['long_text_mm35x7ww'] = { text: notasTexto };
  if (C.col_detalle) cols[C.col_detalle] = { text: notasTexto };

  // ── Crear item ────────────────────────────────────────────
  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(' ');
  const name = fullName + (productLabel ? ` — ${productLabel}` : '');

  const query = `
    mutation CreateItem($name: String!, $cols: JSON!) {
      create_item(
        board_id: ${process.env.MONDAY_BOARD_ID},
        group_id: "${process.env.MONDAY_GROUP_ID}",
        item_name: $name,
        column_values: $cols
      ) { id }
    }
  `;

  const resp = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': process.env.MONDAY_API_KEY,
      'API-Version':   '2024-01'
    },
    body: JSON.stringify({ query, variables: { name, cols: JSON.stringify(cols) } })
  });

  const json = await resp.json();
  if (json.errors) throw new Error(json.errors[0]?.message || 'Monday error');
  return json.data?.create_item?.id;
}

async function createMondayLeads(body) {
  const contact = {
    email: body.email, firstName: body.firstName, lastName: body.lastName,
    phone: body.phone, company: body.company,
  };

  let address = null;
  let addressBlock = '';
  try {
    address = body.address ? JSON.parse(body.address) : null;
    if (address) {
      addressBlock = [
        `\n📍 DIRECCIÓN DE ENVÍO`,
        `  Calle: ${address.street}`,
        address.colonia ? `  Colonia: ${address.colonia}` : '',
        `  Ciudad: ${address.city}  C.P.: ${address.cp}`,
        address.referencia ? `  Referencia: ${address.referencia}` : '',
        `  País: ${address.pais}`,
      ].filter(Boolean).join('\n');
    }
  } catch {}


  let products = [];
  try { products = JSON.parse(body.productsJson || '[]'); } catch {}

  if (products.length === 0) {
    // Fallback: create one item with the combined data
    const id = await createMondayItem({
      contact,
      productLabel:  body.packagingType || '',
      quantity:      body.quantity || '',
      productConfig: {},
      productNotes:  (body.message || '(Sin detalles)') + addressBlock,
      address,
    });
    return [id];
  }

  const extraMessage = body.message
    ? body.message.replace(/^PRODUCTO \d+:[\s\S]*?(?=\n\n---|$)/gm, '').trim()
    : '';

  const ids = [];
  for (const product of products) {
    const productLabel = PRODUCT_LABELS_SRV[product.type] || product.type;
    const configBlock  = formatProductConfig(product);
    const notes = [configBlock, extraMessage && `\nMensaje: ${extraMessage}`].filter(Boolean).join('\n');

    const id = await createMondayItem({
      contact,
      productLabel,
      quantity:      product.config?.cantidad || '',
      productConfig: product.config || {},
      productNotes:  notes + addressBlock,
      address,
    });
    ids.push(id);
  }
  return ids;
}

async function uploadFileToMonday(itemId, file) {
  const mutation = `mutation AddFile($file: File!) {
    add_file_to_column(
      item_id: ${itemId},
      column_id: "${process.env.MONDAY_COL_ATTACHMENT}",
      file: $file
    ) { id }
  }`;

  const form = new FormData();
  form.append('query', mutation);
  const blob = new Blob([file.buffer], { type: file.mimetype });
  form.append('variables[file]', blob, file.originalname);

  const resp = await fetch('https://api.monday.com/v2/file', {
    method: 'POST',
    headers: { 'Authorization': process.env.MONDAY_API_KEY },
    body: form
  });

  return await resp.json();
}

// =====================================================================
// RUTAS
// =====================================================================

app.get('/', (req, res) => {
  res.render('index', { data });
});

app.get(['/productos/:slug', '/producto/:slug'], (req, res) => {
  const product = products.find(p => p.slug === req.params.slug);
  if (!product) return res.status(404).redirect('/#productos');
  res.render('producto', { data, product });
});

app.post('/api/cotizacion', formLimiter, upload.single('archivo'), (req, res) => {
  // Respond immediately so the user always sees the success screen.
  // Monday integration runs in background and doesn't block UX.
  res.json({ ok: true });

  (async () => {
    try {
      console.log('=== COTIZACION RECIBIDA ===');
      console.log('productsJson:', req.body.productsJson);
      let parsed = [];
      try { parsed = JSON.parse(req.body.productsJson || '[]'); } catch(e) { console.log('JSON parse error:', e.message); }
      console.log('Productos parseados:', parsed.length, JSON.stringify(parsed, null, 2));

      const itemIds = await createMondayLeads(req.body);
      if (req.file && itemIds.length > 0) {
        for (const id of itemIds) {
          await uploadFileToMonday(id, req.file)
            .catch(err => console.warn('File upload (non-blocking):', err.message));
        }
      }
      console.log('Leads creados en Monday:', itemIds);
    } catch (err) {
      console.error('Monday (non-blocking):', err.message);
    }
  })();
});

app.post('/contacto', express.urlencoded({ extended: true }), (req, res) => {
  console.log('Contacto:', req.body);
  res.redirect('/?enviado=true');
});

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}\n`);
});
