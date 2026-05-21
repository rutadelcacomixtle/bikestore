-- ─── 1. Tabla de categorías de productos ─────────────────────────────────────

CREATE TABLE product_categories (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  description text        NOT NULL DEFAULT '',
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── 2. RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- Acceso de Data API al rol authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON product_categories TO authenticated;

-- Owners: acceso completo
CREATE POLICY "owners_all" ON product_categories
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'owner'
    )
  );

-- Authenticated: solo lectura (por si se usa en otros contextos)
CREATE POLICY "authenticated_read" ON product_categories
  FOR SELECT TO authenticated
  USING (true);

-- ─── 3. Categorías iniciales ──────────────────────────────────────────────────

INSERT INTO product_categories (name, description, sort_order) VALUES
  ('Transmisión',          'Cadena, platos, piñones, desviadores, cables y palancas de cambios', 1),
  ('Frenos',               'Pastillas, zapatas, cables, palancas, discos y calibradores',         2),
  ('Llantas y Ruedas',     'Llantas, cámaras, rines, rayos y válvulas',                           3),
  ('Manubrio y Dirección', 'Manubrio, potencia, grips, ahead set y dirección',                    4),
  ('Asiento y Tija',       'Sillín y tija de asiento',                                            5),
  ('Pedales y Bielas',     'Pedales, bielas y pedalier (bottom bracket)',                          6),
  ('Lubricantes y Limpieza','Aceite, grasa, desengrasante y limpiador',                           7),
  ('Accesorios',           'Luces, candados, espejos, portaequipajes y guardafangos',              8),
  ('Herramientas',         'Llaves, extractores y herramientas de taller',                        9),
  ('Ropa y Seguridad',     'Cascos, guantes y ropa ciclista',                                    10),
  ('Otros',                'Productos que no encajan en otras categorías',                        11);

-- ─── 4. Nuevas columnas en products ──────────────────────────────────────────

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sku         text,
  ADD COLUMN IF NOT EXISTS unit        text    NOT NULL DEFAULT 'pieza',
  ADD COLUMN IF NOT EXISTS min_stock   integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS category_id uuid    REFERENCES product_categories(id) ON DELETE SET NULL;

-- Eliminar columna category (texto libre) que ya no se usa
ALTER TABLE products DROP COLUMN IF EXISTS category;
