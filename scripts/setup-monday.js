// =============================================================
// GUARDIAN PACKAGING — Setup de tablero Monday.com optimizado
// Uso: node scripts/setup-monday.js
// Crea columnas específicas para el workflow de ventas de empaques
// =============================================================

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const API_KEY  = process.env.MONDAY_API_KEY;
const BOARD_ID = process.env.MONDAY_BOARD_ID;
const GROUP_ID = process.env.MONDAY_GROUP_ID;

if (!API_KEY || !BOARD_ID) {
  console.error('❌ Falta MONDAY_API_KEY o MONDAY_BOARD_ID en .env.local');
  process.exit(1);
}

async function api(query, variables = {}) {
  const resp = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': API_KEY,
      'API-Version': '2024-01',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await resp.json();
  if (json.errors) throw new Error(json.errors[0]?.message || JSON.stringify(json.errors));
  return json.data;
}

// Columnas que necesita el vendedor — en orden de importancia visual
const COLUMNS_TO_CREATE = [
  { title: 'Tipo de Empaque',     type: 'text',      key: 'col_tipo_empaque' },
  { title: 'Cantidad',            type: 'text',      key: 'col_cantidad' },
  { title: 'Empresa / Marca',     type: 'text',      key: 'col_empresa' },
  { title: 'Estilo / Tipo',       type: 'text',      key: 'col_estilo' },
  { title: 'Material',            type: 'text',      key: 'col_material' },
  { title: 'Acabado / Laminación',type: 'text',      key: 'col_acabado' },
  { title: 'Efectos Especiales',  type: 'text',      key: 'col_efectos' },
  { title: 'SKUs / Variaciones',  type: 'text',      key: 'col_skus' },
  { title: 'Especificaciones',    type: 'text',      key: 'col_specs' },
  { title: 'Ciudad',              type: 'text',      key: 'col_ciudad' },
  { title: 'País',                type: 'text',      key: 'col_pais' },
  { title: 'Dirección de Envío',  type: 'long_text', key: 'col_direccion' },
  { title: 'Detalle Completo',    type: 'long_text', key: 'col_detalle' },
  { title: 'Fecha de Solicitud',  type: 'date',      key: 'col_fecha' },
];

async function getExistingColumns() {
  const data = await api(`
    query {
      boards(ids: [${BOARD_ID}]) {
        columns { id title type }
      }
    }
  `);
  return data.boards[0].columns;
}

async function createColumn(title, columnType) {
  const data = await api(`
    mutation($boardId: ID!, $title: String!, $columnType: ColumnType!) {
      create_column(board_id: $boardId, title: $title, column_type: $columnType) {
        id title type
      }
    }
  `, { boardId: BOARD_ID, title, columnType });
  return data.create_column;
}

async function main() {
  console.log('\n🛠  Guardian Packaging — Configurando tablero Monday.com\n');
  console.log(`📋 Board ID: ${BOARD_ID}\n`);

  // 1. Obtener columnas existentes
  console.log('🔍 Consultando columnas existentes...');
  const existing = await getExistingColumns();
  console.log(`   Encontradas ${existing.length} columnas:\n`);
  existing.forEach(c => console.log(`   • ${c.title.padEnd(30)} [${c.id}] (${c.type})`));

  // 2. Mapear columnas estándar ya existentes
  const colMap = {};
  for (const col of existing) {
    if (col.type === 'email')  colMap.col_email = col.id;
    if (col.type === 'phone')  colMap.col_phone = col.id;
    if (col.type === 'color' || col.type === 'status') {
      if (!colMap.col_status) colMap.col_status = col.id; // primera columna de estado
    }
    if (col.type === 'long_text' && !colMap.col_notas_sistema) {
      colMap.col_notas_sistema = col.id;
    }
  }

  // 3. Crear columnas que faltan
  console.log('\n➕ Creando columnas necesarias...\n');
  for (const col of COLUMNS_TO_CREATE) {
    const already = existing.find(
      e => e.title.toLowerCase().trim() === col.title.toLowerCase().trim()
    );
    if (already) {
      console.log(`   ✅ Ya existe: ${col.title.padEnd(30)} [${already.id}]`);
      colMap[col.key] = already.id;
    } else {
      try {
        const created = await createColumn(col.title, col.type);
        console.log(`   🆕 Creada:    ${col.title.padEnd(30)} [${created.id}]`);
        colMap[col.key] = created.id;
        await new Promise(r => setTimeout(r, 300)); // rate limit
      } catch (err) {
        console.warn(`   ⚠️  Error al crear ${col.title}: ${err.message}`);
      }
    }
  }

  // 4. Guardar mapa de columnas
  const output = {
    _comment: 'Generado por scripts/setup-monday.js — NO editar manualmente',
    boardId: BOARD_ID,
    groupId: GROUP_ID || '',
    ...colMap,
  };

  fs.writeFileSync(
    './monday-columns.json',
    JSON.stringify(output, null, 2)
  );

  console.log('\n✅ Configuración guardada en monday-columns.json\n');
  console.log('📊 Mapa de columnas:');
  console.log(JSON.stringify(output, null, 2));
  console.log('\n🎉 Listo. Ahora el servidor usará estas columnas automáticamente.\n');
  console.log('💡 En Monday.com puedes ocultar columnas secundarias:');
  console.log('   1. Haz clic en el ícono 👁 de la columna → "Ocultar columna"');
  console.log('   2. O usa el menú lateral "Columnas" para seleccionar cuáles mostrar\n');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
