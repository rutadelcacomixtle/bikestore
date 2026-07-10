CREATE OR REPLACE FUNCTION delete_contact(p_contact_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pending_count integer;
BEGIN
  SELECT COUNT(*) INTO pending_count
  FROM work_orders
  WHERE contact_id = p_contact_id AND status != 'delivered';

  IF pending_count > 0 THEN
    RAISE EXCEPTION 'No se puede eliminar el contacto porque tiene % órdenes de trabajo pendientes', pending_count;
  END IF;

  DELETE FROM contacts WHERE id = p_contact_id;
END;
$$;
