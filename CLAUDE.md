# Taller de Bicis — Contexto del Proyecto

## Descripción

Aplicación web PWA para gestión de un pequeño taller de bicicletas en México.
Permite al dueño administrar clientes, bicicletas, órdenes de trabajo, catálogo
de productos y generar recibos en PDF. Los clientes tienen un portal de solo
lectura para ver el historial de reparaciones de sus bicis.

## Stack tecnológico

- **Frontend**: React 18 + Vite 5
- **Estilos**: Tailwind CSS v3 (mobile-first)
- **Routing**: react-router-dom v6
- **Backend/Auth/DB**: Appwrite Cloud (appwrite.io)
- **SDK**: appwrite (npm package)
- **PWA**: vite-plugin-pwa
- **PDF**: @react-pdf/renderer
- **Íconos**: lucide-react

## Appwrite — Estructura de datos

### Colecciones (Database ID: `taller-db`)

**profiles** (Collection ID: `profiles`)

- userId: string (ID del usuario en Appwrite Auth)
- fullName: string
- phone: string
- email: string
- role: enum ['owner', 'customer']

**bicycles** (Collection ID: `bicycles`)

- customerId: string (userId del cliente)
- brand: string
- model: string
- serialNumber: string
- color: string
- notes: string

**work_orders** (Collection ID: `work_orders`)

- bicycleId: string
- customerId: string
- status: enum ['received', 'in_progress', 'ready', 'delivered']
- description: string
- diagnosis: string
- laborCost: float
- paidAt: datetime (nullable)
- paymentMethod: enum ['cash', 'transfer', 'card'] (nullable)
- createdAt: datetime
- updatedAt: datetime

**products** (Collection ID: `products`)

- name: string
- description: string
- price: float
- stock: integer
- category: string
- active: boolean

**work_order_products** (Collection ID: `work_order_products`)

- workOrderId: string
- productId: string
- productName: string (snapshot del nombre)
- quantity: integer
- unitPrice: float (snapshot del precio)
- subtotal: float

## Appwrite — Permisos

- El dueño usa un Team llamado "owners" (Team ID: `owners`)
- Todas las colecciones dan acceso completo al team "owners"
- Los documentos de cada cliente llevan permiso de lectura para su userId
- Los clientes NUNCA pueden escribir directamente, solo leer sus propios datos

## Variables de entorno (.env)

```
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=
VITE_APPWRITE_DATABASE_ID=taller-db
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
│   │   ├── WorkOrders.jsx
│   │   ├── WorkOrderDetail.jsx
│   │   └── Products.jsx
│   └── customer/
│       └── MyBikes.jsx
├── lib/
│   ├── appwrite.js      ← cliente Appwrite + servicios
│   └── permissions.js   ← helpers de permisos Appwrite
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
- `/owner/work-orders` → solo owner
- `/owner/work-orders/:id` → solo owner
- `/owner/products` → solo owner
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
- Appwrite SDK importado siempre desde `@/lib/appwrite.js`

## Comandos frecuentes

```bash
npm run dev        # desarrollo local
npm run build      # build de producción
npm run preview    # preview del build
```

## Notas importantes

- La app es mobile-first: diseñada principalmente para celular
- El owner navega con una barra inferior en móvil
- Los clientes se registran ellos mismos en /login
- El dueño se agrega manualmente al team "owners" desde la consola de Appwrite
- Al hacer login, la app verifica si existe un perfil; si no, lo crea con role='customer'
- El dueño puede promover clientes a owner desde la consola de Appwrite (por ahora)
- Los recibos PDF se generan en el navegador con @react-pdf/renderer
- PWA instalable en Android e iOS desde el navegador
