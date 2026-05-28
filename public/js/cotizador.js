/* =====================================================================
   COTIZADOR — Configurador multi-paso con branching por producto
   Estado global → flow dinámico → render por paso
   ===================================================================== */

const cot = (function () {

  /* ─────────────────────────────────────────────────────────────
     ESTADO
  ───────────────────────────────────────────────────────────── */
  const state = {
    email: '', firstName: '', lastName: '', phone: '', company: '',
    address: null,
    currentProduct: null,   // { type: 'bolsas', config: {} }
    products: [],           // productos completados
    message: '', file: null,
  };

  let flow = [];
  let currentIndex = 0;

  /* ─────────────────────────────────────────────────────────────
     FLOW BUILDER
  ───────────────────────────────────────────────────────────── */
  const PRODUCT_STEPS = {
    bolsas:  ['bolsas-estilo','bolsas-tamano','bolsas-specs','bolsas-material','bolsas-laminacion','bolsas-efectos','design-upload','bolsas-skus','bolsas-cantidad'],
    sachets: ['sachets-tipo','sachets-medidas','sachets-material','sachets-laminacion','sachets-efectos','design-upload','sachets-skus','sachets-cantidad'],
    cajas:   ['cajas-estilo','cajas-medidas','cajas-material','cajas-acabado','cajas-especiales','design-upload','cajas-skus','cajas-cantidad'],
    tubos:   ['tubos-medidas','tubos-material','tubos-acabado','tubos-especiales','design-upload','tubos-cantidad'],
  };

  function rebuildFlow() {
    const base = ['email', 'personal', 'envio', 'productSelector'];
    if (state.currentProduct) {
      base.push(...(PRODUCT_STEPS[state.currentProduct.type] || []), 'addAnother');
    }
    base.push('upload', 'summary');
    flow = base;
  }

  /* ─────────────────────────────────────────────────────────────
     UTILIDADES
  ───────────────────────────────────────────────────────────── */
  const $id  = id => document.getElementById(id);
  const val  = id => $id(id)?.value?.trim() || '';
  const esc  = s  => String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');

  function showErr(id, msg) {
    const el = $id(id);
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  }
  function clearErrors() {
    document.querySelectorAll('.cot-ferr,.cot-field-error').forEach(e => {
      e.textContent = ''; e.style.display = 'none';
    });
  }
  function getVal(path) {
    return path.split('.').reduce((o, k) => o?.[k], state);
  }
  function setVal(path, value) {
    const keys = path.split('.');
    const last = keys.pop();
    const target = keys.reduce((o, k) => { if (!o[k]) o[k] = {}; return o[k]; }, state);
    target[last] = value;
  }

  /* ─────────────────────────────────────────────────────────────
     ETIQUETAS Y SVG DE PRODUCTOS
  ───────────────────────────────────────────────────────────── */
  const PRODUCT_LABELS = {
    bolsas:  'Bolsas Personalizadas',
    sachets: 'Sachets / 3 Sellos',
    cajas:   'Cajas de Cartón',
    tubos:   'Tubos de Cartón',
  };
  const PRODUCT_DESCS = {
    bolsas:  'Stand up, spout bags, fondo plano y más.',
    sachets: 'Bolsas individuales selladas por tres lados.',
    cajas:   'Cajas con medidas, material y acabados a elección.',
    tubos:   'Tubos por diámetro, altura, material y acabado.',
  };
  const PRODUCT_IMG = {
    bolsas:  '/img/hero-pouch.jpg',
    sachets: '/img/hero-sachet.jpg',
    cajas:   '/img/hero-caja.jpg',
    tubos:   '/img/hero-tubo.jpg',
  };

  /* ─────────────────────────────────────────────────────────────
     FACTORIES DE PASOS ESTÁNDAR
  ───────────────────────────────────────────────────────────── */
  function makeOptionStep({ id, title, subtitle='', stateKey, required=true, compact=false, options }) {
    const hasImgs = options.some(o => o.img);
    return {
      title, subtitle,
      render: () => {
        const cur = getVal(stateKey);
        if (hasImgs) {
          return `
            <div class="cot-img-grid">
              ${options.map(o=>`
                <label class="cot-img-card${cur===o.value?' selected':''}">
                  <input type="radio" name="${id}" value="${esc(o.value)}" hidden${cur===o.value?' checked':''}>
                  <div class="cot-img-thumb">
                    ${o.img
                      ? `<img src="${o.img}" alt="${o.label}" loading="lazy">`
                      : `<div class="cot-img-placeholder"><i class="bi bi-question-lg"></i></div>`}
                    <span class="cot-img-check"><i class="bi bi-check2"></i></span>
                  </div>
                  <div class="cot-img-info">
                    <span class="cot-img-label">${o.label}</span>
                    ${o.desc?`<span class="cot-img-desc">${o.desc}</span>`:''}
                  </div>
                </label>`).join('')}
            </div>
            <span class="cot-ferr" id="e_${id}" style="display:none"></span>`;
        }
        return `
          <div class="cot-opt-grid${compact?' cot-opt-compact':''}">
            ${options.map(o=>`
              <label class="cot-opt-card${cur===o.value?' selected':''}">
                <input type="radio" name="${id}" value="${esc(o.value)}" hidden${cur===o.value?' checked':''}>
                <span class="cot-opt-label">${o.label}</span>
                ${o.desc?`<span class="cot-opt-desc">${o.desc}</span>`:''}
                <span class="cot-opt-check"><i class="bi bi-check2"></i></span>
              </label>`).join('')}
          </div>
          <span class="cot-ferr" id="e_${id}" style="display:none"></span>`;
      },
      validate: () => {
        const sel = document.querySelector(`input[name="${id}"]:checked`);
        if (required && !sel) { showErr(`e_${id}`,'Selecciona una opción para continuar.'); return false; }
        if (sel) setVal(stateKey, sel.value);
        return true;
      }
    };
  }

  function makeCheckStep({ id, title, subtitle='', stateKey, options }) {
    const hasImgs = options.some(o => o.img !== undefined);
    return {
      title, subtitle,
      render: () => {
        const cur = getVal(stateKey) || [];
        if (hasImgs) {
          return `
            <div class="cot-img-grid">
              ${options.map(o=>`
                <label class="cot-img-card${cur.includes(o.label||o)?' selected':''}">
                  <input type="checkbox" name="${id}" value="${esc(o.label||o)}"${cur.includes(o.label||o)?' checked':''} hidden>
                  <div class="cot-img-thumb">
                    ${o.img
                      ? `<img src="${o.img}" alt="${o.label||o}" loading="lazy">`
                      : `<div class="cot-img-placeholder"><i class="bi bi-dash"></i></div>`}
                    <span class="cot-img-check"><i class="bi bi-check2"></i></span>
                  </div>
                  <div class="cot-img-info">
                    <span class="cot-img-label">${o.label||o}</span>
                  </div>
                </label>`).join('')}
            </div>`;
        }
        return `
          <div class="cot-cpills">
            ${options.map(o=>`
              <label class="cot-cpill${cur.includes(o)?' selected':''}">
                <input type="checkbox" name="${id}" value="${esc(o)}"${cur.includes(o)?' checked':''} hidden>${o}
              </label>`).join('')}
          </div>`;
      },
      validate: () => {
        const checked = [...document.querySelectorAll(`input[name="${id}"]:checked`)].map(i=>i.value);
        setVal(stateKey, checked.length ? checked : ['No especificado']);
        return true;
      }
    };
  }

  function makeCantidadStep(productId) {
    const QTY = ['10,000 piezas','15,000 piezas','20,000 piezas','25,000 piezas','30,000 piezas'];
    const SK  = 'currentProduct.config.cantidad';
    return {
      title: 'Cantidad de producción',
      subtitle: 'Mínimo de producción: 10,000 piezas.',
      render: () => {
        const cur = getVal(SK);
        const isPreset = QTY.includes(cur);
        return `
          <div class="cot-qty-grid">
            ${QTY.map(q=>`
              <label class="cot-qty-card${cur===q?' selected':''}">
                <input type="radio" name="${productId}_cantidad" value="${q}" hidden${cur===q?' checked':''}><span class="cot-qty-label">${q}</span>
              </label>`).join('')}
          </div>
          <div class="cot-field" style="margin-top:16px">
            <label class="cot-label">Cantidad personalizada</label>
            <input type="text" id="fQtyCustom" class="cot-input" placeholder="Ej. 50,000 piezas" value="${cur&&!isPreset?esc(cur):''}">
          </div>
          <span class="cot-ferr" id="e_${productId}_cantidad" style="display:none"></span>`;
      },
      validate: () => {
        const sel   = document.querySelector(`input[name="${productId}_cantidad"]:checked`);
        const custom = val('fQtyCustom');
        const value  = sel ? sel.value : (custom||'');
        if (!value) { showErr(`e_${productId}_cantidad`,'Indica la cantidad de producción.'); return false; }
        setVal(SK, value);
        return true;
      }
    };
  }

  /* ─────────────────────────────────────────────────────────────
     PASOS
  ───────────────────────────────────────────────────────────── */
  const STEPS = {

    email: {
      title:'Empecemos.', subtitle:'Te enviaremos la cotización a tu correo en menos de 24 h.',
      render:()=>`
        <div class="cot-field">
          <label class="cot-label">Correo electrónico *</label>
          <input type="email" id="fEmail" class="cot-input" placeholder="tu@empresa.com" value="${esc(state.email)}" autocomplete="email">
          <p class="cot-field-error" id="eEmail"></p>
        </div>
        <p class="cot-disclaimer">Sin spam. Solo tu cotización y casos similares.</p>`,
      validate:()=>{
        const v=val('fEmail');
        if(!v){showErr('eEmail','El correo es requerido.');return false;}
        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)){showErr('eEmail','Ingresa un correo válido.');return false;}
        state.email=v; return true;
      }
    },

    personal: {
      title:'¿Con quién hablamos?', subtitle:'Datos básicos para personalizar tu cotización.',
      render:()=>`
        <div class="cot-grid-2">
          <div class="cot-field"><label class="cot-label">Nombre *</label><input type="text" id="fFirstName" class="cot-input" placeholder="Juan" value="${esc(state.firstName)}" autocomplete="given-name"><p class="cot-field-error" id="eFirstName"></p></div>
          <div class="cot-field"><label class="cot-label">Apellido</label><input type="text" id="fLastName" class="cot-input" placeholder="García" value="${esc(state.lastName)}" autocomplete="family-name"></div>
          <div class="cot-field"><label class="cot-label">WhatsApp / Teléfono *</label><input type="tel" id="fPhone" class="cot-input" placeholder="+52 55 1234 5678" value="${esc(state.phone)}" autocomplete="tel"><p class="cot-field-error" id="ePhone"></p></div>
          <div class="cot-field"><label class="cot-label">Empresa / Marca</label><input type="text" id="fCompany" class="cot-input" placeholder="Nombre de tu empresa" value="${esc(state.company)}" autocomplete="organization"></div>
        </div>`,
      validate:()=>{
        let ok=true;
        if(!val('fFirstName')){showErr('eFirstName','El nombre es requerido.');ok=false;}
        if(val('fPhone').replace(/\D/g,'').length<8){showErr('ePhone','Ingresa un número válido (mín. 8 dígitos).');ok=false;}
        if(ok){state.firstName=val('fFirstName');state.lastName=val('fLastName');state.phone=val('fPhone');state.company=val('fCompany');}
        return ok;
      }
    },

    envio: {
      title:'Datos de envío', subtitle:'Para coordinar la entrega de tu pedido.',
      render:()=>{
        const a=state.address||{};
        const paises=['México','USA','Otro'];
        return `
          <div class="cot-grid-2">
            <div class="cot-field" style="grid-column:1/-1">
              <label class="cot-label">Calle y Número *</label>
              <input type="text" id="fStreet" class="cot-input" placeholder="Av. Insurgentes 123" value="${esc(a.street||'')}" autocomplete="street-address">
              <p class="cot-field-error" id="eStreet"></p>
            </div>
            <div class="cot-field">
              <label class="cot-label">Ciudad *</label>
              <input type="text" id="fCity" class="cot-input" placeholder="Ciudad de México" value="${esc(a.city||'')}" autocomplete="address-level2">
              <p class="cot-field-error" id="eCity"></p>
            </div>
            <div class="cot-field">
              <label class="cot-label">Colonia</label>
              <input type="text" id="fColonia" class="cot-input" placeholder="Col. Roma Norte" value="${esc(a.colonia||'')}" autocomplete="address-level3">
            </div>
            <div class="cot-field">
              <label class="cot-label">Código Postal *</label>
              <input type="text" id="fCP" class="cot-input" placeholder="06600" value="${esc(a.cp||'')}" autocomplete="postal-code">
              <p class="cot-field-error" id="eCP"></p>
            </div>
            <div class="cot-field">
              <label class="cot-label">Referencia</label>
              <input type="text" id="fRef" class="cot-input" placeholder="Entre calles..." value="${esc(a.referencia||'')}">
            </div>
          </div>
          <div class="cot-field" style="margin-top:8px">
            <label class="cot-label">País *</label>
            <div class="cot-opt-grid cot-opt-compact">
              ${paises.map(p=>`<label class="cot-opt-card${(a.pais||'México')===p?' selected':''}"><input type="radio" name="fPais" value="${p}" hidden${(a.pais||'México')===p?' checked':''}><span class="cot-opt-label">${p}</span><span class="cot-opt-check"><i class="bi bi-check2"></i></span></label>`).join('')}
            </div>
          </div>`;
      },
      validate:()=>{
        let ok=true;
        if(!val('fStreet')){showErr('eStreet','La calle es requerida.');ok=false;}
        if(!val('fCity'))  {showErr('eCity',  'La ciudad es requerida.');ok=false;}
        if(!val('fCP'))    {showErr('eCP',    'El código postal es requerido.');ok=false;}
        if(ok){
          const pais=document.querySelector('input[name="fPais"]:checked')?.value||'México';
          state.address={street:val('fStreet'),city:val('fCity'),colonia:val('fColonia'),cp:val('fCP'),referencia:val('fRef'),pais};
        }
        return ok;
      }
    },

    productSelector: {
      title:'¿Qué necesitas cotizar?', subtitle:'Selecciona el tipo de empaque que requieres.',
      render:()=>{
        const already=state.products.map(p=>p.type);
        return `
          <div class="cot-pkg-grid">
            ${['bolsas','sachets','cajas','tubos'].map(pid=>`
              <label class="cot-pkg-card${already.includes(pid)?' cot-pkg-done':''}">
                <input type="radio" name="productType" value="${pid}" hidden>
                <div class="cot-pkg-inner">
                  <div class="cot-pkg-img cot-pkg-img--${pid}">
                    ${PRODUCT_IMG[pid]
                      ? `<img class="cot-pkg-photo" src="${PRODUCT_IMG[pid]}" alt="${PRODUCT_LABELS[pid]}" loading="lazy">`
                      : `<div class="cot-pkg-svg-fallback"><i class="bi bi-box-seam"></i><span>Envases</span></div>`}
                    <div class="cot-pkg-check-dot"><i class="bi bi-check2"></i></div>
                    ${already.includes(pid)?'<div class="cot-pkg-done-badge">✓ Agregado — + otro</div>':''}
                  </div>
                  <div class="cot-pkg-info"><p class="cot-pkg-name">${PRODUCT_LABELS[pid]}</p><p class="cot-pkg-desc">${PRODUCT_DESCS[pid]}</p></div>
                </div>
              </label>`).join('')}
          </div>
          <p class="cot-field-error" id="eProduct"></p>`;
      },
      validate:()=>{
        const sel=document.querySelector('input[name="productType"]:checked');
        if(!sel){showErr('eProduct','Selecciona un tipo de empaque.');return false;}
        state.currentProduct={type:sel.value,config:{}};
        rebuildFlow(); return true;
      }
    },

    /* BOLSAS */
    'bolsas-estilo': (()=>{
      const ESTILOS = [
        { value:'Stand Up / Doypack',           label:'Stand Up',      desc:'Se sostiene sola en anaquel', img:'/img/cotizador/bolsa-stand-up.png', zoom:1.5 },
        { value:'Bolsa con Boquilla (Spout Bag)',label:'Spout Bag',     desc:'Con boquilla para líquidos',  img:'/img/cotizador/bolsa-spout.png' },
        { value:'Bolsa Sellada por Detrás',      label:'Sellada Detrás',desc:'Cierre trasero plano',        img:'/img/cotizador/bolsa-backseal.png' },
        { value:'Bolsa de Fondo Plano',          label:'Fondo Plano',   desc:'Base cuadrada estable',       img:'/img/cotizador/bolsa-fondo-plano.png' },
        { value:'Bolsa con Forma Especial',      label:'Forma Especial',desc:'Contorno personalizado',      img:'/img/cotizador/bolsa-forma-especial.jpg' },
        { value:'3 Sellos',                      label:'3 Sellos',      desc:'Sellada por tres lados',      img:'/img/cotizador/bolsa-3-sellos.png' },
        { value:'Otro / No sé',                  label:'Otro / Asesoría',desc:'El equipo te asesora',      img:null },
      ];
      const SK = 'currentProduct.config.estilo';
      return {
        title:'Estilo de bolsa', subtitle:'Elige el tipo que mejor se adapta a tu producto.',
        render:()=>{
          const cur=getVal(SK);
          return `<div class="cot-pkg-grid">${ESTILOS.map(e=>`
            <label class="cot-pkg-card${cur===e.value?' selected':''}">
              <input type="radio" name="bolsas_estilo" value="${esc(e.value)}" hidden${cur===e.value?' checked':''}>
              <div class="cot-pkg-inner">
                <div class="cot-pkg-img cot-pkg-img--bolsas">
                  ${e.img
                    ? `<img class="cot-pkg-photo" src="${e.img}" alt="${e.label}" loading="lazy"${e.zoom?` style="transform:scale(${e.zoom})"`:''}>`
                    : `<div class="cot-pkg-svg-fallback"><i class="bi bi-question-lg"></i><span>Asesoría</span></div>`}
                  <div class="cot-pkg-check-dot"><i class="bi bi-check2"></i></div>
                </div>
                <div class="cot-pkg-info"><p class="cot-pkg-name">${e.label}</p><p class="cot-pkg-desc">${e.desc}</p></div>
              </div>
            </label>`).join('')}</div>
            <span class="cot-ferr" id="e_bolsas_estilo" style="display:none"></span>`;
        },
        validate:()=>{
          const sel=document.querySelector('input[name="bolsas_estilo"]:checked');
          if(!sel){showErr('e_bolsas_estilo','Selecciona el estilo de bolsa.');return false;}
          setVal(SK,sel.value); return true;
        }
      };
    })(),

    'bolsas-tamano': {
      title:'Tamaño de bolsa', subtitle:'Selecciona un tamaño estándar o ingresa medidas en mm.',
      render:()=>{
        const cur=getVal('currentProduct.config.tamano');
        const SIZES=[{v:'70g — 11×17×5 cm',l:'70 gr',s:'11×17×5 cm'},{v:'150g — 13×21×6 cm',l:'150 gr',s:'13×21×6 cm'},{v:'250g — 15×23×7 cm',l:'250 gr',s:'15×23×7 cm'},{v:'500g — 19×26×8 cm',l:'500 gr',s:'19×26×8 cm'},{v:'1kg — 22×32×9 cm',l:'1 kg',s:'22×32×9 cm'}];
        const isCustom=cur&&!SIZES.find(s=>s.v===cur);
        return `<div class="cot-size-grid">${SIZES.map(s=>`<label class="cot-size-card${cur===s.v?' selected':''}"><input type="radio" name="bolsas_tamano" value="${s.v}" hidden${cur===s.v?' checked':''}><span class="cot-size-lbl">${s.l}</span><span class="cot-size-sub">${s.s}</span></label>`).join('')}</div>
          <div class="cot-field" style="margin-top:18px"><label class="cot-label">Medida personalizada — Ancho × Alto × Fuelle (mm)</label><input type="text" id="fTamanoCustom" class="cot-input" placeholder="Ej. 180 × 260 × 80" value="${isCustom?esc(cur):''}"></div>
          <span class="cot-ferr" id="e_bolsas_tamano" style="display:none"></span>`;
      },
      validate:()=>{
        const sel=document.querySelector('input[name="bolsas_tamano"]:checked');
        const custom=val('fTamanoCustom');
        const value=sel?sel.value:(custom?`Personalizado: ${custom}`:'');
        if(!value){showErr('e_bolsas_tamano','Selecciona un tamaño o ingresa medidas personalizadas.');return false;}
        setVal('currentProduct.config.tamano',value); return true;
      }
    },

    'bolsas-specs': makeCheckStep({ id:'bolsas_specs', title:'Especificaciones adicionales', subtitle:'Selecciona todo lo que aplique.', stateKey:'currentProduct.config.specs', options:[
      {label:'Ziplock resellable',     img:'/img/cotizador/spec-ziplock.png'},
      {label:'Ziplock child-resistant',img:'/img/cotizador/spec-ziplock2.png'},
      {label:'Ventana transparente',   img:'/img/cotizador/spec-ventana.png'},
      {label:'Línea de precorte',      img:'/img/cotizador/bolsa-3-sellos.png'},
      {label:'Válvula desgasificadora',img:'/img/cotizador/spec-valvula.png'},
      {label:'Boquilla (spout)',        img:'/img/cotizador/bolsa-spout.png'},
      {label:'Esquinas redondeadas',   img:'/img/cotizador/spec-esq-redondeadas.png'},
      {label:'Perforación circular',   img:'/img/cotizador/spec-perf-circular.png'},
      {label:'Perforación de Sombrero',img:'/img/cotizador/spec-perf-sombrero.png'},
      {label:'Tintie',                 img:'/img/cotizador/spec-tintie.png'},
      {label:'Ninguna',                img:null},
    ]}),

    'bolsas-material': makeOptionStep({ id:'bolsas_material', title:'Material', subtitle:'El material define la barrera y el aspecto final.', stateKey:'currentProduct.config.material', options:[
      {value:'Grado Alimenticio (Matte OPP / VMPET / PE)',label:'Grado Alimenticio',desc:'Matte OPP / VMPET / PE', img:'/img/cotizador/mat-grado-alimenticio.png'},
      {value:'PET / Mylar',label:'PET / Mylar',desc:'Alta barrera, aspecto premium', img:'/img/cotizador/mat-pet-mylar.png'},
      {value:'Kraft',label:'Kraft',desc:'Papel kraft, estética eco', img:'/img/cotizador/mat-kraft.png'},
      {value:'Holograma',label:'Holograma',desc:'PET holográfico llamativo', img:'/img/cotizador/mat-holograma.png'},
      {value:'NY/PE (Nylon)',label:'Nylon (NY/PE)',desc:'Alta resistencia', img:'/img/cotizador/mat-nylon.png'},
      {value:'Otro',label:'Otro',desc:'El equipo te asesora', img:null},
    ]}),

    'bolsas-laminacion': makeOptionStep({ id:'bolsas_laminacion', title:'Laminación', subtitle:'Acabado superficial del empaque.', stateKey:'currentProduct.config.laminacion', options:[
      {value:'Brillante',label:'Brillante',desc:'Lustroso y vivo', img:'/img/cotizador/lam-brillante.png'},
      {value:'Matte',label:'Matte',desc:'Opaco, premium', img:'/img/cotizador/lam-matte.png'},
      {value:'Soft Touch',label:'Soft Touch',desc:'Suave al tacto', img:'/img/cotizador/lam-soft-touch.png'},
      {value:'Sin laminación',label:'Sin laminación',desc:'Material base', img:null},
    ]}),

    'bolsas-efectos': makeCheckStep({ id:'bolsas_efectos', title:'Efectos especiales', subtitle:'Detalles que elevan el diseño. Puedes elegir varios.', stateKey:'currentProduct.config.efectos', options:[
      {label:'Barniz UV',       img:'/img/cotizador/ef-barniz-uv.png'},
      {label:'Foil Stamping',   img:'/img/cotizador/ef-foil.png'},
      {label:'Metálicos',       img:'/img/cotizador/ef-metalicos.png'},
      {label:'Barniz a relieve',img:'/img/cotizador/ef-barniz-relieve.png'},
      {label:'Ninguno',         img:null},
    ]}),

    'bolsas-skus': makeOptionStep({ id:'bolsas_skus', title:'Variaciones / SKUs', subtitle:'¿Cuántos diseños o sabores diferentes necesitas?', stateKey:'currentProduct.config.skus', compact:true, options:[
      {value:'1 SKU',label:'1',desc:''},{value:'2 SKUs',label:'2',desc:''},{value:'3 SKUs',label:'3',desc:''},{value:'4 SKUs',label:'4',desc:''},{value:'5+ SKUs',label:'5 o más',desc:''},
    ]}),

    'bolsas-cantidad': makeCantidadStep('bolsas'),

    /* SACHETS */
    'sachets-tipo': makeOptionStep({ id:'sachets_tipo', title:'Tipo de sachet', subtitle:'Elige la categoría de tu producto.', stateKey:'currentProduct.config.tipo', options:[
      {value:'Sachet individual / 3 sellos',label:'Individual',desc:'Porción única sellada',      img:'/img/cotizador/sachet-te.png'},
      {value:'Sachet para alimentos',       label:'Alimentos', desc:'Salsas, condimentos, cereales', img:'/img/cotizador/sachet-detox.png'},
      {value:'Sachet para suplementos',     label:'Suplementos',desc:'Proteínas, vitaminas',        img:'/img/cotizador/sachet-energy.png'},
      {value:'Sachet para cosméticos',      label:'Cosméticos', desc:'Cremas, sueros, mascarillas', img:'/img/cotizador/bolsa-backseal.png'},
    ]}),

    'sachets-medidas': {
      title:'Medidas del sachet', subtitle:'Dimensiones en milímetros.',
      render:()=>{
        const m=getVal('currentProduct.config.medidas')||{};
        return `<div class="cot-grid-2">
          <div class="cot-field"><label class="cot-label">Ancho (mm) *</label><input type="number" id="fSAncho" class="cot-input" placeholder="100" value="${m.ancho||''}"></div>
          <div class="cot-field"><label class="cot-label">Alto (mm) *</label><input type="number" id="fSAlto" class="cot-input" placeholder="150" value="${m.alto||''}"></div>
          <div class="cot-field"><label class="cot-label">Fuelle / Base (mm)</label><input type="number" id="fSFuelle" class="cot-input" placeholder="0" value="${m.fuelle||''}"></div>
          <div class="cot-field"><label class="cot-label">Gramaje / Capacidad estimada</label><input type="text" id="fSGramaje" class="cot-input" placeholder="Ej. 30 gr, 50 ml" value="${m.gramaje||''}"></div>
        </div><span class="cot-ferr" id="e_sachets_medidas" style="display:none"></span>`;
      },
      validate:()=>{
        if(!val('fSAncho')||!val('fSAlto')){showErr('e_sachets_medidas','Ingresa al menos ancho y alto.');return false;}
        setVal('currentProduct.config.medidas',{ancho:val('fSAncho'),alto:val('fSAlto'),fuelle:val('fSFuelle'),gramaje:val('fSGramaje')}); return true;
      }
    },

    'sachets-material': makeOptionStep({ id:'sachets_material', title:'Material', stateKey:'currentProduct.config.material', options:[
      {value:'Grado Alimenticio (Matte OPP / VMPET / PE)',label:'Grado Alimenticio',desc:'Matte OPP / VMPET / PE', img:'/img/cotizador/mat-grado-alimenticio.png'},
      {value:'PET / Mylar',label:'PET / Mylar',desc:'Alta barrera', img:'/img/cotizador/mat-pet-mylar.png'},
      {value:'Kraft',label:'Kraft',desc:'Estética eco', img:'/img/cotizador/mat-kraft.png'},
      {value:'Holograma',label:'Holograma',desc:'PET holográfico', img:'/img/cotizador/mat-holograma.png'},
      {value:'NY/PE (Nylon)',label:'Nylon (NY/PE)',desc:'Alta resistencia', img:'/img/cotizador/mat-nylon.png'},
      {value:'Otro',label:'Otro',desc:'El equipo te asesora', img:null},
    ]}),

    'sachets-laminacion': makeOptionStep({ id:'sachets_laminacion', title:'Laminación', stateKey:'currentProduct.config.laminacion', options:[
      {value:'Brillante',label:'Brillante',desc:'Lustroso y vivo', img:'/img/cotizador/lam-brillante.png'},
      {value:'Matte',label:'Matte',desc:'Opaco, premium', img:'/img/cotizador/lam-matte.png'},
      {value:'Soft Touch',label:'Soft Touch',desc:'Suave al tacto', img:'/img/cotizador/lam-soft-touch.png'},
      {value:'Sin laminación',label:'Sin laminación',desc:'Material base', img:null},
    ]}),

    'sachets-efectos': makeCheckStep({ id:'sachets_efectos', title:'Efectos especiales', stateKey:'currentProduct.config.efectos', options:[
      {label:'Barniz UV',       img:'/img/cotizador/ef-barniz-uv.png'},
      {label:'Foil Stamping',   img:'/img/cotizador/ef-foil.png'},
      {label:'Metálicos',       img:'/img/cotizador/ef-metalicos.png'},
      {label:'Barniz a relieve',img:'/img/cotizador/ef-barniz-relieve.png'},
      {label:'Ninguno',         img:null},
    ]}),

    'sachets-skus': makeOptionStep({ id:'sachets_skus', title:'Variaciones / SKUs', stateKey:'currentProduct.config.skus', compact:true, options:[
      {value:'1 SKU',label:'1',desc:''},{value:'2 SKUs',label:'2',desc:''},{value:'3 SKUs',label:'3',desc:''},{value:'4 SKUs',label:'4',desc:''},{value:'5+ SKUs',label:'5 o más',desc:''},
    ]}),

    'sachets-cantidad': makeCantidadStep('sachets'),

    /* CAJAS */
    'cajas-estilo': makeOptionStep({ id:'cajas_estilo', title:'Estilo de caja', subtitle:'Elige el tipo de caja que necesitas.', stateKey:'currentProduct.config.estilo', options:[
      {value:'Tincture Box',label:'Tincture Box',desc:'Codo, cierre superior',    img:'/img/cotizador/caja-tincture.png'},
      {value:'Lock Bottom',label:'Lock Bottom',desc:'Base bloqueable',             img:'/img/cotizador/caja-lock-bottom.png'},
      {value:'Hang Tab Box',label:'Hang Tab',desc:'Con gancho para exhibición',   img:'/img/cotizador/caja-hang-tab.png'},
      {value:'Otro / No sé',label:'Otro / No sé',desc:'El equipo te asesora',    img:null},
    ]}),

    'cajas-medidas': {
      title:'Medidas de la caja', subtitle:'Dimensiones en milímetros.',
      render:()=>{
        const m=getVal('currentProduct.config.medidas')||{};
        return `<div class="cot-grid-3">
          <div class="cot-field"><label class="cot-label">Frente / Largo (mm) *</label><input type="number" id="fCLargo" class="cot-input" placeholder="100" value="${m.largo||''}"></div>
          <div class="cot-field"><label class="cot-label">Ancho (mm) *</label><input type="number" id="fCAncho" class="cot-input" placeholder="60" value="${m.ancho||''}"></div>
          <div class="cot-field"><label class="cot-label">Alto (mm) *</label><input type="number" id="fCAlto" class="cot-input" placeholder="40" value="${m.alto||''}"></div>
        </div><span class="cot-ferr" id="e_cajas_medidas" style="display:none"></span>`;
      },
      validate:()=>{
        if(!val('fCLargo')||!val('fCAncho')||!val('fCAlto')){showErr('e_cajas_medidas','Ingresa las tres dimensiones.');return false;}
        setVal('currentProduct.config.medidas',{largo:val('fCLargo'),ancho:val('fCAncho'),alto:val('fCAlto')}); return true;
      }
    },

    'cajas-material': makeOptionStep({ id:'cajas_material', title:'Material', stateKey:'currentProduct.config.material', options:[
      {value:'Cartón Blanco',label:'Cartón Blanco',desc:'Estándar, impresión directa', img:'/img/cotizador/caja-mat-blanco.jpg'},
      {value:'Cartón Plateado',label:'Cartón Plateado',desc:'Acabado metalizado',       img:'/img/cotizador/caja-mat-plateado.jpg'},
      {value:'Cartón Corrugado',label:'Corrugado',desc:'Protección extra',              img:'/img/cotizador/caja-mat-corrugado.png'},
      {value:'Kraft',label:'Kraft',desc:'Estética eco natural',                         img:'/img/cotizador/caja-mat-kraft.jpg'},
      {value:'Grado Alimenticio',label:'Grado Alimenticio',desc:'Contacto con alimentos',img:'/img/cotizador/caja-mat-alimenticio.jpg'},
      {value:'Plástico',label:'Plástico',desc:'Resistente a la humedad',                img:null},
    ]}),

    'cajas-acabado': makeOptionStep({ id:'cajas_acabado', title:'Acabado superficial', stateKey:'currentProduct.config.acabado', options:[
      {value:'Laminación Matte',label:'Matte',desc:'Opaco, premium',         img:'/img/cotizador/caja-ac-mate.png'},
      {value:'Laminación Brillante',label:'Brillante',desc:'Lustroso y vivo',img:'/img/cotizador/caja-ac-brillante.png'},
      {value:'Laminación Metálica',label:'Metálico',desc:'Impacto visual',   img:'/img/cotizador/caja-ac-metalico.png'},
      {value:'Soft Touch',label:'Soft Touch',desc:'Suave al tacto',          img:'/img/cotizador/caja-ac-soft-touch.jpg'},
      {value:'Holograma',label:'Holograma',desc:'Efecto holográfico',        img:'/img/cotizador/caja-ac-holograma.avif'},
    ]}),

    'cajas-especiales': makeCheckStep({ id:'cajas_especiales', title:'Acabados especiales', subtitle:'Detalles adicionales del diseño.', stateKey:'currentProduct.config.especiales', options:[
      {label:'Barniz UV',        img:'/img/cotizador/caja-ef-barniz-uv.jpg'},
      {label:'Relieve',          img:'/img/cotizador/caja-ef-relieve.jpg'},
      {label:'Grabado',          img:'/img/cotizador/caja-ef-grabado.avif'},
      {label:'Foil Stamping',    img:'/img/cotizador/caja-ef-foil.jpg'},
      {label:'Barniz a relieve', img:'/img/cotizador/caja-ef-barniz-relieve.jpg'},
      {label:'No requiere',      img:null},
    ]}),

    'cajas-skus': makeOptionStep({ id:'cajas_skus', title:'Variaciones / SKUs', stateKey:'currentProduct.config.skus', compact:true, options:[
      {value:'1 SKU',label:'1',desc:''},{value:'2 SKUs',label:'2',desc:''},{value:'3 SKUs',label:'3',desc:''},{value:'4 SKUs',label:'4',desc:''},{value:'5+ SKUs',label:'5 o más',desc:''},
    ]}),

    'cajas-cantidad': makeCantidadStep('cajas'),

    /* TUBOS */
    'tubos-medidas': {
      title:'Medidas del tubo', subtitle:'Dimensiones en milímetros.',
      render:()=>{
        const m=getVal('currentProduct.config.medidas')||{};
        return `<div class="cot-grid-2">
          <div class="cot-field"><label class="cot-label">Diámetro (mm) *</label><input type="number" id="fTDiam" class="cot-input" placeholder="60" value="${m.diametro||''}"></div>
          <div class="cot-field"><label class="cot-label">Alto (mm) *</label><input type="number" id="fTAlto" class="cot-input" placeholder="120" value="${m.alto||''}"></div>
        </div><span class="cot-ferr" id="e_tubos_medidas" style="display:none"></span>`;
      },
      validate:()=>{
        if(!val('fTDiam')||!val('fTAlto')){showErr('e_tubos_medidas','Ingresa diámetro y alto.');return false;}
        setVal('currentProduct.config.medidas',{diametro:val('fTDiam'),alto:val('fTAlto')}); return true;
      }
    },

    'tubos-material': makeOptionStep({ id:'tubos_material', title:'Material', stateKey:'currentProduct.config.material', options:[
      {value:'Cartón Blanco',label:'Cartón Blanco',desc:'Impresión directa',         img:'/img/cotizador/tubo-mat-blanco.jpg'},
      {value:'Papel Kraft',label:'Kraft',desc:'Estética eco natural',                img:'/img/cotizador/tubo-mat-kraft.png'},
      {value:'Grado Alimenticio',label:'Alimenticio',desc:'Contacto con alimentos',  img:'/img/cotizador/tubo-mat-alimenticio.png'},
    ]}),

    'tubos-acabado': makeOptionStep({ id:'tubos_acabado', title:'Acabado', stateKey:'currentProduct.config.acabado', options:[
      {value:'Laminación Matte',label:'Matte',desc:'Opaco, premium',         img:'/img/cotizador/tubo-ac-mate.jpg'},
      {value:'Laminación Brillante',label:'Brillante',desc:'Lustroso y vivo',img:'/img/cotizador/tubo-ac-brillante.avif'},
      {value:'Soft Touch',label:'Soft Touch',desc:'Suave al tacto',          img:'/img/cotizador/tubo-ac-soft-touch.webp'},
    ]}),

    'tubos-especiales': makeCheckStep({ id:'tubos_especiales', title:'Acabados especiales', stateKey:'currentProduct.config.especiales', options:[
      {label:'Barniz UV',        img:'/img/cotizador/tubo-ef-barniz-uv.png'},
      {label:'Relieve',          img:'/img/cotizador/tubo-ef-relieve.jpg'},
      {label:'Grabado',          img:'/img/cotizador/tubo-ef-grabado.jpg'},
      {label:'Foil Stamping',    img:'/img/cotizador/tubo-ef-foil.png'},
      {label:'Barniz a registro',img:'/img/cotizador/tubo-ef-barniz-registro.png'},
      {label:'Ventana',          img:'/img/cotizador/tubo-ef-ventana.jpg'},
      {label:'No requiere',      img:null},
    ]}),

    'tubos-cantidad': makeCantidadStep('tubos'),

    /* BRANCHING */
    addAnother: {
      title:'¿Cotizas otro empaque?', subtitle:'Puedes agregar más productos a la misma solicitud.',
      render:()=>`
        <div class="cot-yn-grid">
          <label class="cot-yn-card"><input type="radio" name="addAnother" value="yes" hidden><span class="cot-yn-icon">+</span><span class="cot-yn-lbl">Sí, agregar otro</span><span class="cot-yn-desc">Volver al selector</span></label>
          <label class="cot-yn-card"><input type="radio" name="addAnother" value="no" hidden><span class="cot-yn-icon">→</span><span class="cot-yn-lbl">No, continuar</span><span class="cot-yn-desc">Ir al resumen final</span></label>
        </div>
        <span class="cot-ferr" id="e_addAnother" style="display:none"></span>`,
      validate:()=>{
        const sel=document.querySelector('input[name="addAnother"]:checked');
        if(!sel){showErr('e_addAnother','Selecciona una opción para continuar.');return false;}
        if(state.currentProduct){state.products.push(JSON.parse(JSON.stringify(state.currentProduct)));state.currentProduct=null;}
        if(sel.value==='yes'){
          rebuildFlow();
          currentIndex=flow.indexOf('productSelector');
          renderStep(true); return false;
        }
        return true;
      }
    },

    /* ADJUNTAR DISEÑO */
    'design-upload': {
      title:'Adjunta tu diseño', subtitle:'Sube tu logo, arte o referencia visual — completamente opcional.',
      render:()=>`
        <div class="cot-field">
          <label class="cot-label">Logo o archivo de diseño <span style="font-weight:400;text-transform:none;letter-spacing:0">(opcional)</span></label>
          <div class="cot-file-zone" id="cotFileZone">
            <input type="file" id="cotFileInput" accept=".pdf,.ai,.png,.jpg,.jpeg,.svg,.eps,.zip" style="display:none">
            <div class="cot-file-inner" id="cotFileTrigger">
              <i class="bi bi-cloud-upload" style="font-size:32px;color:var(--accent);display:block;margin-bottom:12px"></i>
              <p style="margin:0 0 6px;font-weight:500;color:var(--text-primary)">Haz clic para subir o arrastra tu archivo aquí</p>
              <span style="font-size:12px;color:var(--text-muted)">PDF, AI, PNG, JPG, SVG, EPS, ZIP · máx. 20 MB</span>
            </div>
            <div class="cot-file-selected" id="cotFileSelected" style="display:none">
              <i class="bi bi-file-earmark-check" style="font-size:22px;color:var(--accent)"></i>
              <span id="cotFileName" style="flex:1;font-size:14px;font-weight:500"></span>
              <button class="cot-file-remove" onclick="cot.removeFile(event)"><i class="bi bi-x"></i></button>
            </div>
          </div>
        </div>
        <p style="font-size:13px;color:var(--text-muted);margin-top:12px">Si aún no tienes arte finalizado, no te preocupes — nuestro equipo te ayuda a desarrollarlo.</p>`,
      validate:()=>true,
      onAfterRender:()=>initFileUpload(),
    },

    /* UPLOAD — solo mensaje adicional */
    upload: {
      title:'¿Algo más que debamos saber?', subtitle:'Cualquier detalle adicional para tu cotización.',
      render:()=>`
        <div class="cot-field"><label class="cot-label">Mensaje adicional <span style="font-weight:400;text-transform:none;letter-spacing:0">(opcional)</span></label><textarea id="fMessage" class="cot-input cot-textarea" placeholder="Cuéntanos sobre tu producto, packaging actual, plazos, referencias de marca...">${esc(state.message)}</textarea></div>`,
      validate:()=>{state.message=val('fMessage');return true;},
    },

    /* RESUMEN */
    summary: {
      title:'Todo listo. Revisemos.', subtitle:'Verifica que todo esté correcto antes de enviar.',
      render:()=>{
        const CL={estilo:'Estilo',tipo:'Tipo',tamano:'Tamaño',medidas:'Medidas',specs:'Especificaciones',material:'Material',laminacion:'Laminación',efectos:'Efectos especiales',acabado:'Acabado',especiales:'Acabados especiales',skus:'SKUs',cantidad:'Cantidad',referencia:'Descripción'};
        const addrBlock=state.address?`<div class="cot-sum-product"><p class="cot-sum-product-title">Dirección de Envío</p>
          <div class="cot-summary-row"><span class="cot-summary-label">Calle</span><span class="cot-summary-value">${esc(state.address.street)}</span></div>
          <div class="cot-summary-row"><span class="cot-summary-label">Ciudad</span><span class="cot-summary-value">${esc(state.address.city)}</span></div>
          ${state.address.colonia?`<div class="cot-summary-row"><span class="cot-summary-label">Colonia</span><span class="cot-summary-value">${esc(state.address.colonia)}</span></div>`:''}
          <div class="cot-summary-row"><span class="cot-summary-label">C.P.</span><span class="cot-summary-value">${esc(state.address.cp)}</span></div>
          ${state.address.referencia?`<div class="cot-summary-row"><span class="cot-summary-label">Referencia</span><span class="cot-summary-value">${esc(state.address.referencia)}</span></div>`:''}
          <div class="cot-summary-row"><span class="cot-summary-label">País</span><span class="cot-summary-value">${esc(state.address.pais)}</span></div>
        </div>`:'';
        const productBlocks=state.products.map((p,i)=>{
          const rows=Object.entries(p.config).map(([k,v])=>{
            const label=CL[k]||k;
            const vStr=typeof v==='object'&&!Array.isArray(v)?Object.entries(v).filter(([,x])=>x).map(([mk,mv])=>`${mk}: ${mv}`).join(', '):Array.isArray(v)?v.join(', '):v;
            return vStr?`<div class="cot-summary-row"><span class="cot-summary-label">${label}</span><span class="cot-summary-value">${esc(vStr)}</span></div>`:'';
          }).join('');
          return `<div class="cot-sum-product"><p class="cot-sum-product-title">Producto ${i+1}: ${PRODUCT_LABELS[p.type]||p.type}</p>${rows}</div>`;
        }).join('');
        return `
          <div class="cot-summary">
            <div class="cot-summary-row"><span class="cot-summary-label">Nombre</span><span class="cot-summary-value">${esc(state.firstName)} ${esc(state.lastName)}</span></div>
            <div class="cot-summary-row"><span class="cot-summary-label">Email</span><span class="cot-summary-value">${esc(state.email)}</span></div>
            <div class="cot-summary-row"><span class="cot-summary-label">Teléfono</span><span class="cot-summary-value">${esc(state.phone)}</span></div>
            ${state.company?`<div class="cot-summary-row"><span class="cot-summary-label">Empresa</span><span class="cot-summary-value">${esc(state.company)}</span></div>`:''}
          </div>
          ${addrBlock}
          ${productBlocks}
          ${state.message?`<p class="cot-lead" style="margin-top:14px;font-style:italic">"${esc(state.message)}"</p>`:''}
          <p class="cot-ferr" id="eSubmit" style="display:none;margin-top:12px"></p>`;
      },
      validate:()=>true,
    },
  };

  /* ─────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────── */
  function renderStep(skipAnim=false) {
    const def=STEPS[flow[currentIndex]];
    if(!def) return;
    const content=$id('cotContent');
    if(!content) return;

    const doRender=()=>{
      content.innerHTML=`<h3 class="cot-title">${def.title}</h3>${def.subtitle?`<p class="cot-lead">${def.subtitle}</p>`:''}${def.render()}`;
      content.style.transition='none';
      content.style.transform='translateX(18px)';
      content.style.opacity='0';
      content.offsetHeight;
      content.style.transition='transform 0.28s var(--ease-out),opacity 0.28s ease';
      content.style.transform='';
      content.style.opacity='';
      initInteractions();
      if(def.onAfterRender) def.onAfterRender();
      if(window.innerWidth>768) setTimeout(()=>content.querySelector('input[type="text"],input[type="email"],input[type="tel"],input[type="number"]')?.focus(),320);
    };

    if(skipAnim||!content.innerHTML.trim()){doRender();}
    else{
      content.style.transition='transform 0.18s ease,opacity 0.18s ease';
      content.style.transform='translateX(-18px)';
      content.style.opacity='0';
      setTimeout(doRender,180);
    }
    updateTopbar();
  }

  function updateTopbar() {
    const total=flow.length, num=currentIndex+1;
    $id('cotStepNum').textContent=String(num).padStart(2,'0');
    $id('cotStepTotal').textContent=String(total).padStart(2,'0');
    $id('cotProgress').style.width=`${(num/total)*100}%`;
    const bb=$id('cotBackBtn');
    if(bb) bb.style.visibility=currentIndex>0?'visible':'hidden';
    const nb=$id('cotNextBtn');
    if(nb) nb.innerHTML=currentIndex===flow.length-1?'Enviar solicitud <i class="bi bi-send"></i>':'Continuar <i class="bi bi-arrow-right"></i>';
  }

  /* ─────────────────────────────────────────────────────────────
     INTERACCIONES
  ───────────────────────────────────────────────────────────── */
  function initInteractions() {
    document.querySelectorAll('.cot-opt-card').forEach(card=>{
      card.addEventListener('click',()=>{
        const r=card.querySelector('input[type="radio"]');
        if(!r) return;
        document.querySelectorAll(`input[name="${r.name}"]`).forEach(x=>x.closest('.cot-opt-card')?.classList.remove('selected'));
        r.checked=true; card.classList.add('selected');
      });
    });
    document.querySelectorAll('.cot-cpill').forEach(pill=>{
      pill.addEventListener('click',()=>{
        const cb=pill.querySelector('input[type="checkbox"]');
        if(!cb) return;
        cb.checked=!cb.checked; pill.classList.toggle('selected',cb.checked);
      });
    });
    document.querySelectorAll('.cot-size-card').forEach(card=>{
      card.addEventListener('click',()=>{
        document.querySelectorAll('.cot-size-card').forEach(c=>c.classList.remove('selected'));
        card.classList.add('selected');
        const ci=$id('fTamanoCustom'); if(ci) ci.value='';
      });
    });
    document.querySelectorAll('.cot-qty-card').forEach(card=>{
      card.addEventListener('click',()=>{
        document.querySelectorAll('.cot-qty-card').forEach(c=>c.classList.remove('selected'));
        card.classList.add('selected');
        const ci=$id('fQtyCustom'); if(ci) ci.value='';
      });
    });
    document.querySelectorAll('.cot-yn-card').forEach(card=>{
      card.addEventListener('click',()=>{
        document.querySelectorAll('.cot-yn-card').forEach(c=>c.classList.remove('selected'));
        card.classList.add('selected');
        card.querySelector('input')?.click();
      });
    });
    document.querySelectorAll('.cot-pkg-card').forEach(card=>{
      card.addEventListener('click',()=>{
        document.querySelectorAll('.cot-pkg-card').forEach(c=>c.classList.remove('selected'));
        card.classList.add('selected');
      });
    });
    document.querySelectorAll('.cot-img-card').forEach(card=>{
      card.addEventListener('click',()=>{
        const inp=card.querySelector('input');
        if(!inp) return;
        if(inp.type==='radio'){
          document.querySelectorAll(`input[name="${inp.name}"]`).forEach(x=>x.closest('.cot-img-card')?.classList.remove('selected'));
          inp.checked=true; card.classList.add('selected');
        } else {
          inp.checked=!inp.checked; card.classList.toggle('selected',inp.checked);
        }
      });
    });
  }

  /* ─────────────────────────────────────────────────────────────
     FILE UPLOAD
  ───────────────────────────────────────────────────────────── */
  function initFileUpload() {
    const zone=$id('cotFileZone'), input=$id('cotFileInput');
    if(!zone||!input) return;
    $id('cotFileTrigger')?.addEventListener('click',()=>input.click());
    input.addEventListener('change',()=>handleFile(input.files[0]));
    zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('cot-file-drag');});
    zone.addEventListener('dragleave',()=>zone.classList.remove('cot-file-drag'));
    zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('cot-file-drag');handleFile(e.dataTransfer.files[0]);});
  }

  function handleFile(file) {
    if(!file) return;
    state.file=file;
    const n=$id('cotFileName'),s=$id('cotFileSelected'),t=$id('cotFileTrigger');
    if(n) n.textContent=file.name;
    if(s) s.style.display='flex';
    if(t) t.style.display='none';
  }

  /* ─────────────────────────────────────────────────────────────
     NAVEGACIÓN / SUBMIT
  ───────────────────────────────────────────────────────────── */
  function next() {
    clearErrors();
    const def=STEPS[flow[currentIndex]];
    if(!def||!def.validate()) return;
    if(currentIndex<flow.length-1){currentIndex++;renderStep();}
    else submitForm();
  }

  function back() {
    if(currentIndex>0){currentIndex--;renderStep();}
  }

  async function submitForm() {
    const nb=$id('cotNextBtn');
    if(nb){nb.disabled=true;nb.innerHTML='Enviando… <i class="bi bi-arrow-repeat cot-spin"></i>';}

    const CL={estilo:'Estilo',tipo:'Tipo',tamano:'Tamaño',medidas:'Medidas',specs:'Especificaciones',material:'Material',laminacion:'Laminación',efectos:'Efectos especiales',acabado:'Acabado',especiales:'Acabados especiales',skus:'SKUs',cantidad:'Cantidad'};
    const summary=state.products.map((p,i)=>{
      const lines=[`PRODUCTO ${i+1}: ${PRODUCT_LABELS[p.type]||p.type}`];
      Object.entries(p.config).forEach(([k,v])=>{
        const label=CL[k]||k;
        const vStr=typeof v==='object'&&!Array.isArray(v)?Object.entries(v).filter(([,x])=>x).map(([mk,mv])=>`${mk}: ${mv}`).join(', '):Array.isArray(v)?v.join(', '):v;
        if(vStr) lines.push(`  ${label}: ${vStr}`);
      });
      return lines.join('\n');
    }).join('\n\n---\n\n');

    const fullMsg=[summary,state.message&&`Mensaje: ${state.message}`].filter(Boolean).join('\n\n');
    const fd=new FormData();
    fd.append('email',state.email);fd.append('firstName',state.firstName);fd.append('lastName',state.lastName);
    fd.append('phone',state.phone);fd.append('company',state.company);
    fd.append('packagingType',state.products.map(p=>PRODUCT_LABELS[p.type]).join(', '));
    fd.append('quantity',state.products.map(p=>p.config.cantidad||'').join(', '));
    fd.append('message',fullMsg);
    fd.append('productsJson',JSON.stringify(state.products));
    if(state.address) fd.append('address',JSON.stringify(state.address));
    if(state.file) fd.append('archivo',state.file);

    try{
      const res=await fetch('/api/cotizacion',{method:'POST',body:fd});
      const json=await res.json();
      if(json.ok){showSuccess();}
      else{showErr('eSubmit','Hubo un problema al enviar. Inténtalo de nuevo.');if(nb){nb.disabled=false;nb.innerHTML='Enviar solicitud <i class="bi bi-send"></i>';}}
    }catch{
      showErr('eSubmit','Error de conexión. Verifica tu internet.');
      if(nb){nb.disabled=false;nb.innerHTML='Enviar solicitud <i class="bi bi-send"></i>';}
    }
  }

  /* ─────────────────────────────────────────────────────────────
     ÉXITO + PARTÍCULAS
  ───────────────────────────────────────────────────────────── */
  function showSuccess() {
    // Keep content in place so the card keeps its height — overlay covers it via position:absolute
    $id('cotSuccess').style.display='flex';
    $id('cotSuccessName').textContent=state.firstName;
    // Double rAF ensures the browser has painted display:flex before starting the SVG transition
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      $id('cotCheckmark')?.classList.add('animate');
      spawnParticles();
    }));
  }

  function spawnParticles() {
    const wrap=$id('cotParticles');
    if(!wrap) return;
    const colors=['#FFB703','#023047','#fff','#FFB703','#ffd166','#023047'];
    for(let i=0;i<32;i++){
      const p=document.createElement('div');
      p.className='cot-particle';
      const size=4+Math.random()*9;
      p.style.cssText=`left:${32+Math.random()*36}%;top:${28+Math.random()*28}%;width:${size}px;height:${size}px;background:${colors[i%colors.length]};border-radius:${Math.random()>.4?'50%':'3px'};animation-delay:${Math.random()*.5}s;--dx:${(Math.random()-.5)*340}px;--dy:${-(80+Math.random()*260)}px;--rot:${Math.random()*720}deg;`;
      wrap.appendChild(p);
    }
  }

  /* ─────────────────────────────────────────────────────────────
     RESET
  ───────────────────────────────────────────────────────────── */
  function reset() {
    Object.assign(state,{email:'',firstName:'',lastName:'',phone:'',company:'',address:null,currentProduct:null,products:[],message:'',file:null});
    currentIndex=0;
    $id('cotSuccess').style.display='none';
    $id('cotParticles').innerHTML='';
    $id('cotCheckmark')?.classList.remove('animate');
    rebuildFlow(); renderStep(true);
  }

  function removeFile(e) {
    e.stopPropagation(); state.file=null;
    $id('cotFileSelected').style.display='none';
    $id('cotFileTrigger').style.display='';
    const inp=$id('cotFileInput'); if(inp) inp.value='';
  }

  /* ─────────────────────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded',()=>{
    rebuildFlow(); renderStep(true);
    document.addEventListener('keydown',e=>{
      if(e.key!=='Enter') return;
      if(['TEXTAREA','BUTTON','A'].includes(document.activeElement?.tagName)) return;
      if(document.activeElement?.closest('#cotCard')) next();
    });
  });

  return {next,back,reset,removeFile};
})();
