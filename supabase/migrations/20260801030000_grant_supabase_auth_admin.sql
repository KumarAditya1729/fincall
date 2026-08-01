-- Grant execute permissions to supabase_auth_admin for handle_new_user function to fix signup/signin database errors
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
