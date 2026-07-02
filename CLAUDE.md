# Bike Store — Contexto del Proyecto

## Descripción

Aplicación web PWA para gestión de un pequeño taller de bicicletas en México.
Permite al dueño administrar clientes (con y sin cuenta), bicicletas, órdenes de
trabajo, catálogo de productos, inventario, proveedores, ventas directas, finanzas
y generar recibos en PDF. Los clientes registrados tienen un portal de solo lectura
para ver el historial de reparaciones de sus bicis.

## Stack tecnológico

- **Frontend**: React 18 + Vite 6
- **Estilos**: Tailwind CSS v3 (mobile-first)
- **Routing**: react-router-dom v6
- **Backend/Auth/DB**: Supabase
- **SDK**: @supabase/supabase-js
- **PWA**: vite-plugin-pwa
- **PDF**: @react-pdf/renderer
- **Íconos**: lucide-react
- **UI**: @headlessui/react

## Supabase — Esquema de datos

### Tablas

**profiles**

- `id`: uuid (FK a auth.users)
- `full_name`: text
- `phone`: text
- `email`: text
- `role`: enum ['owner', 'customer']

**contacts** (clientes sin cuenta)

- `id`: uuid
- `full_name`: text
- `phone`: text
- `email`: text
- `notes`: text
- `created_at`: timestamptz

**bicycles**

- `id`: uuid
- `customer_id`: uuid (FK a profiles, nullable)
- `contact_id`: uuid (FK a contacts, nullable)
- `brand`: text
- `model`: text
- `serial_number`: text
- `color`: text
- `notes`: text

**work_orders**

- `id`: uuid
- `bicycle_id`: uuid (FK a bicycles, nullable)
- `customer_id`: uuid (FK a profiles, nullable)
- `contact_id`: uuid (FK a contacts, nullable)
- `status`: enum ['received', 'in_progress', 'ready', 'delivered']
- `description`: text
- `diagnosis`: text
- `labor_cost`: float
- `paid_at`: timestamptz (nullable)
- `payment_method`: enum ['cash', 'transfer', 'card'] (nullable)
- `created_at`: timestamptz
- `updated_at`: timestamptz

**products**

- `id`: uuid
- `name`: text
- `description`: text
- `price`: float
- `stock`: integer
- `active`: boolean
- `cost_price`: float (precio de costo)
- `sku`: text
- `unit`: text (ej. 'pieza')
- `min_stock`: integer
- `category_id`: uuid (FK a product_categories)

**product_categories**

- `id`: uuid
- `name`: text
- `description`: text
- `sort_order`: integer

**work_order_products**

- `id`: uuid
- `work_order_id`: uuid
- `product_id`: uuid
- `product_name`: text (snapshot)
- `quantity`: integer
- `unit_price`: float (snapshot)
- `subtotal`: float
- `cost_price`: float (snapshot del precio de costo)

**sales** (ventas directas, sin orden de trabajo)

- `id`: uuid
- `customer_id`: uuid (FK a profiles, nullable)
- `payment_method`: text
- `total`: numeric
- `notes`: text
- `created_at`: timestamptz

**sale_items**

- `id`: uuid
- `sale_id`: uuid (FK a sales, CASCADE)
- `product_id`: uuid
- `product_name`: text
- `quantity`: integer
- `unit_price`: numeric
- `subtotal`: numeric

**stock_entries** (compras a proveedor)

- `id`: uuid
- `product_id`: uuid
- `product_name`: text
- `quantity`: integer
- `unit_cost`: float
- `total_cost`: float
- `supplier`: text
- `supplier_id`: uuid (FK a suppliers)
- `notes`: text
- `created_at`: timestamptz

**suppliers**

- `id`: uuid
- `name`: text
- `active`: boolean

### RPCs

- `decrement_product_stock(p_product_id, p_quantity)` — descuenta stock atómicamente (con validación de suficiente stock)
- `increment_product_stock(p_product_id, p_quantity)` — incrementa stock atómicamente
- `merge_contact_into_profile(p_contact_id, p_profile_id)` — migra bicis y órdenes de un contacto a un perfil y elimina el contacto

### RLS

- Todas las tablas usan Row Level Security
- Los owners tienen acceso completo mediante policy basada en `profiles.role = 'owner'`
- Los clientes solo pueden leer sus propios datos (vía policies específicas donde aplica)

## Variables de entorno (.env)

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Estructura de carpetas

```
src/
├── components/
│   ├── layout/
│   │   ├── OwnerLayout.jsx    ← sidebar/navbar para el dueño
│   │   ├── CustomerLayout.jsx ← layout simple para cliente
│   │   └── ProtectedRoute.jsx
│   ├── ui/
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Modal.jsx
│   │   ├── Badge.jsx
│   │   └── Card.jsx
│   └── pdf/
│       └── ReceiptPDF.jsx
├── pages/
│   ├── auth/
│   │   └── Login.jsx
│   ├── owner/
│   │   ├── Dashboard.jsx
│   │   ├── Customers.jsx
│   │   ├── CustomerDetail.jsx
│   │   ├── ContactDetail.jsx
│   │   ├── WorkOrders.jsx
│   │   ├── WorkOrderDetail.jsx
│   │   ├── Products.jsx
│   │   ├── Sales.jsx
│   │   ├── Finance.jsx
│   │   ├── Inventory.jsx
│   │   └── Suppliers.jsx
│   └── customer/
│       └── MyBikes.jsx
├── lib/
│   └── supabase.js         ← cliente Supabase + servicios por tabla
├── context/
│   └── AuthContext.jsx
├── hooks/
│   └── useAuth.js
├── App.jsx
└── main.jsx
```

## Rutas

- `/login` → público
- `/owner/dashboard` → solo owner
- `/owner/customers` → solo owner
- `/owner/customers/:id` → solo owner
- `/owner/contacts/:id` → solo owner
- `/owner/work-orders` → solo owner
- `/owner/work-orders/:id` → solo owner
- `/owner/products` → solo owner
- `/owner/sales` → solo owner
- `/owner/finance` → solo owner
- `/owner/inventory` → solo owner
- `/owner/suppliers` → solo owner
- `/my-bikes` → solo customer

## Estados de órden de trabajo (badges)

- received → gris
- in_progress → amarillo
- ready → verde
- delivered → azul

## Convenciones de código

- Todos los textos de la UI en español
- Componentes en PascalCase, archivos igual
- Hooks con prefijo `use`
- Funciones async/await, nunca .then()
- Manejo de errores con try/catch en todas las operaciones
- Loading states en toda operación asíncrona
- SDK importado desde `@/lib/supabase.js`

## Comandos frecuentes

```bash
npm run dev        # desarrollo local
npm run build      # build de producción
npm run preview    # preview del build
```

## Notas importantes

- La app es mobile-first: diseñada principalmente para celular
- El owner navega con barra superior en desktop y barra inferior en móvil
- Hay dos tipos de clientes: registrados (profiles) y ocasionales (contacts)
- Al hacer login con Supabase Auth, la app verifica el perfil y redirige según el rol
- Los recibos PDF se generan en el navegador con @react-pdf/renderer
- PWA instalable en Android e iOS desde el navegador

## Flujo de registro con OTP

El registro usa `supabase.auth.signInWithOtp()` en lugar de `signUp()`:

1. **Email** → se envía un código de 6 dígitos al correo
2. **Código** → se verifica con `supabase.auth.verifyOtp()`, se crea sesión
3. **Contraseña** → se asigna con `supabase.auth.updateUser()`, se guarda `full_name` en `profiles`

**Requisito en Supabase Dashboard:**
Ir a **Authentication → Email Templates → Magic Link** y cambiar el template para mostrar `{{ .Token }}` en vez del enlace de confirmación.
