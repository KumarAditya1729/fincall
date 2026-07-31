-- Grant execute permissions back to authenticated and anon roles for functions used in RLS policies or triggers
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_access_branch(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.current_branch_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.set_updated_at() TO authenticated, anon;
