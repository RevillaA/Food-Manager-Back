# Sale Identifier Implementation - Resumen de Cambios

## Objetivo
Generar un ID legible y significativo para cada venta que incluye:
- **Fecha de la jornada** (YYYYMMDD)
- **Número del pedido** (4 dígitos paddeados)
- **Inicial del usuario** que creó el pedido (primera letra del apellido)

**Formato:** `YYYYMMDD_ORDERNUMBER_USERINITIAL`

**Ejemplo:** `20260408_0001_G` 
- 2026-04-08: Fecha de la jornada
- 0001: Número del pedido
- G: Inicial del usuario (García, Gómez, etc.)

---

## Cambios Implementados

### 1. Base de Datos

#### Archivo: `database/init/01-init.sql`
- **Cambio:** Agregada columna `sale_identifier VARCHAR(20)` a tabla `sales`
- **Línea:** 348 (dentro de CREATE TABLE sales)
- **Constraint:** Agregado `UNIQUE (daily_session_id, sale_identifier)` para garantizar unicidad por jornada
- **Datos iniciales:** Actualizados seeds con valores ejemplo (20260328_0001_I, 20260328_0002_I)

#### Archivo: `database/migrations/20260408_add_sale_identifier.sql`
- **Propósito:** Migración para BD existentes
- **Acciones:**
  1. ADD COLUMN sale_identifier VARCHAR(20)
  2. CREATE UNIQUE CONSTRAINT por daily_session_id
  3. UPDATE registros existentes con placeholder: `YYYYMMDD_sale_number_MIGR`

**Para ejecutar en BD existente:**
```bash
psql -U username -d database_name -f database/migrations/20260408_add_sale_identifier.sql
```

---

### 2. Backend

#### Archivo: `src/modules/sales/sales.util.js` (NUEVO)
- **Función:** `generateSaleIdentifier(sessionDate, orderNumber, userName)`
- **Parámetros:**
  - `sessionDate`: Fecha de la jornada (formato "YYYY-MM-DD" o Date object)
  - `orderNumber`: Número secuencial del pedido
  - `userName`: Nombre completo del usuario (ej: "Juan García")
- **Lógica:**
  - Convierte fecha a formato YYYYMMDD
  - Padea order_number a 4 dígitos (1 → 0001)
  - Extrae inicial del último nombre (apellido)
  - Concatena con formato: `YYYYMMDD_ORDERNUMBER_INITIAL`

**Ejemplo de uso:**
```javascript
const { generateSaleIdentifier } = require('./sales.util');

const identifier = generateSaleIdentifier('2026-04-08', 5, 'Juan García');
// Resultado: '20260408_0005_G'
```

#### Archivo: `src/modules/sales/sales.repository.js`
- **Cambios en SALES_SELECT_FIELDS:**
  - Agregado `s.sale_identifier` a la selección de campos
- **Cambios en createSale():**
  - Agregado parámetro `sale_identifier` en destructuring
  - Agregada columna `sale_identifier` en INSERT
  - Actualizado VALUES a $1-$11 (desde $1-$10)

#### Archivo: `src/modules/sales/sales.service.js`
- **Importaciones:**
  - `const { generateSaleIdentifier } = require('./sales.util')`
  - `const dailySessionsRepository = require('../daily-sessions/daily-sessions.repository')`
- **Cambios en createSale():**
  1. Obtiene `dailySession` usando `findDailySessionById()` para obtener `session_date`
  2. Calcula `sale_identifier` usando:
     - `dailySession.session_date`: fecha de la jornada
     - `order.order_number`: número del pedido
     - `order.created_by_full_name`: nombre del usuario que creó el pedido
  3. Pasa `sale_identifier` a `salesRepository.createSale()`

---

## Flujo de Creación de Venta

```
POST /api/sales (con order_id)
  ↓
Service: createSale()
  ├─ Valida que la orden existe y está CLOSED
  ├─ Obtiene datos de la orden (order_number, created_by_full_name)
  ├─ Obtiene daily_session para obtener session_date
  ├─ Genera sale_number (secuencial por jornada)
  ├─ Genera sale_identifier usando generateSaleIdentifier()
  │   └─ sale_identifier = "YYYYMMDD_ORDERNUMBER_INITIAL"
  ├─ Inserta venta con sale_number y sale_identifier
  ├─ Inserta items de la venta
  └─ Retorna venta con sale_identifier
```

---

## Ejemplos de Sale Identifiers

Asumiendo estos datos:

| Fecha | Order# | Usuario | sale_identifier |
|-------|--------|---------|-----------------|
| 2026-04-08 | 1 | Ana García | 20260408_0001_G |
| 2026-04-08 | 2 | Juan López | 20260408_0002_L |
| 2026-04-08 | 3 | María Rodríguez | 20260408_0003_R |
| 2026-04-09 | 1 | Carlos Martín | 20260409_0001_M |
| 2026-04-09 | 2 | Pedro González | 20260409_0002_G |

**Ventajas:**
- ✅ Legible y fácil de recordar
- ✅ Identifica la jornada, orden y usuario en un solo código
- ✅ Utilizable para reportes, recibos, auditorías
- ✅ Único por jornada (si hay múltiples usuarios con misma inicial, mantiene el sale_number)
- ✅ No requiere generar/buscar UUID opaco

---

## API Response

### Antes (sin sale_identifier)
```json
{
  "sale": {
    "id": "f965291e-be3c-4522-ac48-212d3326ba48",
    "order_id": "6fa141a7-c26a-4d4d-abeb-19268aae659d",
    "sale_number": 1,
    "payment_status": "PAID",
    "total": 150.00
  }
}
```

### Después (con sale_identifier)
```json
{
  "sale": {
    "id": "f965291e-be3c-4522-ac48-212d3326ba48",
    "order_id": "6fa141a7-c26a-4d4d-abeb-19268aae659d",
    "sale_number": 1,
    "sale_identifier": "20260408_0001_G",
    "payment_status": "PAID",
    "total": 150.00
  }
}
```

---

## Validación

### Archivos modificados sin errores:
- ✅ `src/modules/sales/sales.util.js` (nuevo)
- ✅ `src/modules/sales/sales.repository.js`
- ✅ `src/modules/sales/sales.service.js`
- ✅ `database/init/01-init.sql`
- ✅ `database/migrations/20260408_add_sale_identifier.sql`

---

## Próximos Pasos

### Para ambiente NUEVO (fresh install):
1. El `01-init.sql` ya contiene la columna `sale_identifier`
2. Ejecutar: `npm run db:init` o comando que usan

### Para ambiente EXISTENTE:
1. Ejecutar migración: `psql -U user -d db -f database/migrations/20260408_add_sale_identifier.sql`
2. Actualizar código a esta versión
3. Las próximas ventas tendrán `sale_identifier` automático

### Testing:
```bash
# Crear una venta para verificar sale_identifier
POST /api/sales
{
  "order_id": "uuid-del-pedido",
  "payment_status": "PAID",
  "payment_method": "CASH"
}

# Verificar en respuesta:
{
  "sale_identifier": "20260408_0001_A"
}
```

---

## Notas Importantes

1. **Unicidad:** El `sale_identifier` es único por jornada (daily_session_id), no globalmente
   - Permite reutilizar identifiers en diferentes jornadas
   - Ejemplo: 20260408_0001_A y 20260409_0001_A pueden coexistir

2. **Inicial del usuario:** Se extrae del último nombre (apellido)
   - "Juan García" → 'G'
   - "María Rodríguez García" → 'G'
   - Fallback a 'X' si no hay nombre válido

3. **Número de orden:** Se formatea con ceros a la izquierda
   - 1 → "0001"
   - 25 → "0025"
   - 999 → "0999"

4. **Retrocompatibilidad:** Registros existentes migran a formato placeholder
   - Pueden ser actualizados manualmente si es necesario
   - Nuevas ventas siempre tendrán formato correcto

5. **Sale Number:** Se mantiene el `sale_number` original (1, 2, 3...)
   - No se elimina por retrocompatibilidad
   - `sale_identifier` es el nuevo ID legible
