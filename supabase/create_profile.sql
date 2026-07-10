CREATE OR REPLACE FUNCTION create_profile(p_id uuid, p_email text, p_full_name text, p_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (p_id, p_email, p_full_name, p_role::profile_role);
END;
$$;
