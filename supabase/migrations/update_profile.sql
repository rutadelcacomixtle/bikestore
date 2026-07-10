-- ─── update_profile ─────────────────────────────────────────────────────────────
-- RPC que actualiza un perfil bypaseando RLS (SECURITY DEFINER).
-- Sigue el mismo patrón que create_profile.sql.

CREATE OR REPLACE FUNCTION update_profile(
  p_id        uuid,
  p_full_name text,
  p_phone     text,
  p_email     text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET full_name = p_full_name,
      phone     = p_phone,
      email     = p_email
  WHERE id = p_id;
END;
$$;
