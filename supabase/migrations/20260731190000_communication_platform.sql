-- Communication Platform Schema

CREATE TABLE IF NOT EXISTS public.comm_providers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('sms', 'whatsapp', 'email', 'push', 'call')),
    provider_name text NOT NULL,
    config jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    priority int DEFAULT 1,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.comm_templates (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('sms', 'whatsapp', 'email', 'push', 'call')),
    name text NOT NULL,
    content text NOT NULL,
    variables jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.comm_campaigns (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
    name text NOT NULL,
    type text NOT NULL CHECK (type IN ('sms', 'whatsapp', 'email', 'push', 'call')),
    template_id uuid REFERENCES public.comm_templates(id) ON DELETE RESTRICT,
    target_audience jsonb DEFAULT '{}'::jsonb,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'completed', 'paused', 'cancelled')),
    scheduled_at timestamptz,
    stats jsonb DEFAULT '{"total": 0, "sent": 0, "delivered": 0, "failed": 0, "read": 0}'::jsonb,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.comm_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL,
    campaign_id uuid REFERENCES public.comm_campaigns(id) ON DELETE SET NULL,
    branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('sms', 'whatsapp', 'email', 'push', 'call')),
    provider_name text,
    recipient text NOT NULL,
    status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'failed', 'read')),
    error_reason text,
    idempotency_key text UNIQUE,
    sent_at timestamptz,
    delivered_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.comm_preferences (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    preferences jsonb DEFAULT '{"sms": true, "email": true, "whatsapp": true, "push": true}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Row Level Security
ALTER TABLE public.comm_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comm_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comm_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comm_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comm_preferences ENABLE ROW LEVEL SECURITY;

-- Provider Policies (Admin & Branch Manager)
CREATE POLICY "Super admin can do all on providers" ON public.comm_providers
    FOR ALL USING (public.is_admin());

CREATE POLICY "Branch managers can view their providers" ON public.comm_providers
    FOR SELECT USING (public.has_role(auth.uid(), 'branch_manager') AND public.can_access_branch(branch_id));

CREATE POLICY "Branch managers can manage their providers" ON public.comm_providers
    FOR ALL USING (public.has_role(auth.uid(), 'branch_manager') AND public.can_access_branch(branch_id));

-- Template Policies
CREATE POLICY "Super admin can do all on templates" ON public.comm_templates
    FOR ALL USING (public.is_admin());

CREATE POLICY "Users can view templates for their branch" ON public.comm_templates
    FOR SELECT USING (public.can_access_branch(branch_id));

CREATE POLICY "Branch managers can manage templates" ON public.comm_templates
    FOR ALL USING (public.has_role(auth.uid(), 'branch_manager') AND public.can_access_branch(branch_id));

-- Campaign Policies
CREATE POLICY "Super admin can do all on campaigns" ON public.comm_campaigns
    FOR ALL USING (public.is_admin());

CREATE POLICY "Users can view campaigns for their branch" ON public.comm_campaigns
    FOR SELECT USING (public.can_access_branch(branch_id));

CREATE POLICY "Branch managers can manage campaigns" ON public.comm_campaigns
    FOR ALL USING (public.has_role(auth.uid(), 'branch_manager') AND public.can_access_branch(branch_id));

-- History Policies
CREATE POLICY "Super admin can do all on history" ON public.comm_history
    FOR ALL USING (public.is_admin());

CREATE POLICY "Users can view history for their branch" ON public.comm_history
    FOR SELECT USING (public.can_access_branch(branch_id));

-- Preference Policies
CREATE POLICY "Users can manage their own preferences" ON public.comm_preferences
    FOR ALL USING (user_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_comm_providers_modtime BEFORE UPDATE ON public.comm_providers FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER update_comm_templates_modtime BEFORE UPDATE ON public.comm_templates FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER update_comm_campaigns_modtime BEFORE UPDATE ON public.comm_campaigns FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER update_comm_history_modtime BEFORE UPDATE ON public.comm_history FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER update_comm_preferences_modtime BEFORE UPDATE ON public.comm_preferences FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- Audit logging triggers
CREATE TRIGGER audit_comm_providers AFTER INSERT OR UPDATE OR DELETE ON public.comm_providers FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER audit_comm_templates AFTER INSERT OR UPDATE OR DELETE ON public.comm_templates FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
CREATE TRIGGER audit_comm_campaigns AFTER INSERT OR UPDATE OR DELETE ON public.comm_campaigns FOR EACH ROW EXECUTE FUNCTION public.audit_row_change();
