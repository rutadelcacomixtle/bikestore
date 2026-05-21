-- ─── 1. Tabla de ventas ───────────────────────────────────────────────────────

CREATE TABLE sales (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id    uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  payment_method text        NOT NULL,
  total          numeric     NOT NULL,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ─── 2. Tabla de ítems de venta ───────────────────────────────────────────────

CREATE TABLE sale_items (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id      uuid    NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id   uuid    REFERENCES products(id) ON DELETE SET NULL,
  product_name text    NOT NULL,
  quantity     integer NOT NULL,
  unit_price   numeric NOT NULL,
  subtotal     numeric NOT NULL
);

-- ─── 3. RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE sales      ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON sales      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON sale_items TO authenticated;

CREATE POLICY "owners_all" ON sales
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'owner')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'owner')
  );

CREATE POLICY "owners_all" ON sale_items
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'owner')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'owner')
  );

-- ─── 4. Función para descontar stock de forma atómica ────────────────────────

CREATE OR REPLACE FUNCTION decrement_product_stock(p_product_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_stock integer;
BEGIN
  SELECT stock INTO current_stock FROM products WHERE id = p_product_id FOR UPDATE;

  IF current_stock IS NULL THEN
    RAISE EXCEPTION 'Producto no encontrado';
  END IF;

  IF current_stock < p_quantity THEN
    RAISE EXCEPTION 'Stock insuficiente: disponible %, solicitado %', current_stock, p_quantity;
  END IF;

  UPDATE products SET stock = stock - p_quantity WHERE id = p_product_id;
END;
$$;
