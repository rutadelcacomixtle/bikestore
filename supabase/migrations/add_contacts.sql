-- ─── 1. Tabla de contactos (clientes sin cuenta) ─────────────────────────────

CREATE TABLE contacts (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name  text        NOT NULL,
  phone      text,
  email      text,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── 2. RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON contacts TO authenticated;

CREATE POLICY "owners_all" ON contacts
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'owner')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'owner')
  );

-- ─── 3. FK contact_id en work_orders y bicycles ───────────────────────────────

ALTER TABLE work_orders
  ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL;

ALTER TABLE bicycles
  ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL;

-- ─── 4. Hacer opcionales los campos que lo requieren ─────────────────────────
-- Un trabajo puede ser de un contacto sin cuenta ni bici registrada

ALTER TABLE work_orders ALTER COLUMN customer_id DROP NOT NULL;
ALTER TABLE work_orders ALTER COLUMN bicycle_id  DROP NOT NULL;
ALTER TABLE bicycles    ALTER COLUMN customer_id DROP NOT NULL;
