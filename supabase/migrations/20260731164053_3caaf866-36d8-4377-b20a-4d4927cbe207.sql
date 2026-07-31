
DROP INDEX IF EXISTS public.idx_customers_name_trgm;
DROP INDEX IF EXISTS public.idx_customers_phone_trgm;
DROP INDEX IF EXISTS public.idx_customers_code_trgm;
DROP INDEX IF EXISTS public.idx_loans_number_trgm;

CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION pg_trgm SET SCHEMA extensions;
GRANT USAGE ON SCHEMA extensions TO authenticated, service_role;

CREATE INDEX idx_customers_name_trgm ON public.customers USING gin (full_name extensions.gin_trgm_ops);
CREATE INDEX idx_customers_phone_trgm ON public.customers USING gin (phone extensions.gin_trgm_ops);
CREATE INDEX idx_customers_code_trgm ON public.customers USING gin (customer_code extensions.gin_trgm_ops);
CREATE INDEX idx_loans_number_trgm ON public.loans USING gin (loan_number extensions.gin_trgm_ops);
