-- ─── 1. Precio de costo en productos ─────────────────────────────────────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price float DEFAULT 0;

-- ─── 2. Snapshot de precio de costo en órdenes ────────────────────────────────
ALTER TABLE work_order_products ADD COLUMN IF NOT EXISTS cost_price float DEFAULT 0;

-- ─── 3. Tabla de entradas de inventario (compras al proveedor) ────────────────
CREATE TABLE IF NOT EXISTS stock_entries (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid        REFERENCES products(id) ON DELETE SET NULL,
  product_name text        NOT NULL,
  quantity    integer     NOT NULL CHECK (quantity > 0),
  unit_cost   float       NOT NULL DEFAULT 0,
  total_cost  float       NOT NULL DEFAULT 0,
  supplier    text,
  notes       text,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE stock_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owners_all_stock_entries" ON stock_entries
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ─── 4. RPC para incrementar stock (par de decrement_product_stock) ───────────
CREATE OR REPLACE FUNCTION increment_product_stock(p_product_id uuid, p_quantity integer)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE products SET stock = stock + p_quantity WHERE id = p_product_id;
$$;
