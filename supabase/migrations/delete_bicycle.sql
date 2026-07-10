CREATE OR REPLACE FUNCTION delete_bicycle(p_bicycle_id uuid)
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
  WHERE bicycle_id = p_bicycle_id AND status != 'delivered';

  IF pending_count > 0 THEN
    RAISE EXCEPTION 'No se puede eliminar la bicicleta porque tiene % órdenes de trabajo pendientes', pending_count;
  END IF;

  UPDATE work_orders SET bicycle_id = NULL WHERE bicycle_id = p_bicycle_id;

  DELETE FROM bicycles WHERE id = p_bicycle_id;
END;
$$;
