CREATE OR REPLACE FUNCTION delete_profile(p_profile_id uuid)
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
  WHERE customer_id = p_profile_id AND status != 'delivered';

  IF pending_count > 0 THEN
    RAISE EXCEPTION 'No se puede eliminar el cliente porque tiene % órdenes de trabajo pendientes', pending_count;
  END IF;

  UPDATE work_orders SET customer_id = NULL, bicycle_id = NULL WHERE customer_id = p_profile_id;
  UPDATE bicycles SET customer_id = NULL WHERE customer_id = p_profile_id;
  DELETE FROM profiles WHERE id = p_profile_id;
END;
$$;
