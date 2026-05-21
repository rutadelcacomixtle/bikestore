-- Función atómica para vincular un contacto con un perfil registrado.
-- Transfiere bicicletas y órdenes, luego elimina el contacto.

CREATE OR REPLACE FUNCTION merge_contact_into_profile(
  p_contact_id uuid,
  p_profile_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE bicycles
    SET customer_id = p_profile_id, contact_id = NULL
    WHERE contact_id = p_contact_id;

  UPDATE work_orders
    SET customer_id = p_profile_id, contact_id = NULL
    WHERE contact_id = p_contact_id;

  DELETE FROM contacts WHERE id = p_contact_id;
END;
$$;
