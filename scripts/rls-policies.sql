-- =============================================================================
-- RLS (Row Level Security) — Quallisy FVS
-- =============================================================================
--
-- INSTRUÇÕES:
-- 1. Abra o SQL Editor no Supabase Dashboard
-- 2. Cole este script inteiro e execute
-- 3. Verifique em Authentication → Policies que as políticas aparecem
--
-- IMPORTANTE: A aplicação usa o service_role via Drizzle no servidor.
-- Isso significa que o Drizzle IGNORA RLS por padrão (service_role bypassa RLS).
-- O RLS protege acessos diretos via Supabase client (browser/PostgREST).
--
-- A função auxiliar get_user_tenant_id() retorna o tenant_id do usuário
-- autenticado, permitindo políticas de isolamento simples.
-- =============================================================================
-- ---------------------------------------------------------------------------
-- Função auxiliar: retorna o tenant_id do usuário autenticado
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_tenant_id() RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
SELECT tenant_id
FROM users
WHERE auth_id = auth.uid()
LIMIT 1;
$$;
-- ---------------------------------------------------------------------------
-- Função auxiliar: verifica se o usuário é system_user
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_system_user() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
SELECT EXISTS (
        SELECT 1
        FROM system_users
        WHERE auth_id = auth.uid()
            AND active = true
    );
$$;
-- =============================================================================
-- 1. TENANTS
-- =============================================================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
-- Membros podem ver apenas seu próprio tenant
CREATE POLICY "tenants_select_own" ON tenants FOR
SELECT USING (id = get_user_tenant_id());
-- System users podem ver todos os tenants
CREATE POLICY "tenants_select_system" ON tenants FOR
SELECT USING (is_system_user());
-- Apenas system users podem inserir/atualizar/deletar
CREATE POLICY "tenants_all_system" ON tenants FOR ALL USING (is_system_user()) WITH CHECK (is_system_user());
-- =============================================================================
-- 2. USERS
-- =============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- Membros podem ver outros membros do mesmo tenant
CREATE POLICY "users_select_same_tenant" ON users FOR
SELECT USING (tenant_id = get_user_tenant_id());
-- Usuário pode atualizar seus próprios dados
CREATE POLICY "users_update_self" ON users FOR
UPDATE USING (auth_id = auth.uid()) WITH CHECK (auth_id = auth.uid());
-- System users podem gerenciar todos os users
CREATE POLICY "users_all_system" ON users FOR ALL USING (is_system_user()) WITH CHECK (is_system_user());
-- =============================================================================
-- 3. SYSTEM_USERS
-- =============================================================================
ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;
-- System users podem ver outros system users
CREATE POLICY "system_users_select" ON system_users FOR
SELECT USING (is_system_user());
-- Só service_role pode inserir/atualizar/deletar
-- (gerenciado pelo backend com service_role key)
-- =============================================================================
-- 4. PLANS
-- =============================================================================
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
-- Qualquer usuário autenticado pode ver os planos
CREATE POLICY "plans_select_authenticated" ON plans FOR
SELECT USING (auth.uid() IS NOT NULL);
-- Apenas system users podem gerenciar planos
CREATE POLICY "plans_all_system" ON plans FOR ALL USING (is_system_user()) WITH CHECK (is_system_user());
-- =============================================================================
-- 5. SUBSCRIPTIONS
-- =============================================================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
-- Membros podem ver a assinatura do seu tenant
CREATE POLICY "subscriptions_select_own" ON subscriptions FOR
SELECT USING (tenant_id = get_user_tenant_id());
-- System users podem gerenciar todas as assinaturas
CREATE POLICY "subscriptions_all_system" ON subscriptions FOR ALL USING (is_system_user()) WITH CHECK (is_system_user());
-- =============================================================================
-- 6. INVOICES
-- =============================================================================
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
-- Membros podem ver faturas da assinatura do seu tenant
CREATE POLICY "invoices_select_own" ON invoices FOR
SELECT USING (
        subscription_id IN (
            SELECT id
            FROM subscriptions
            WHERE tenant_id = get_user_tenant_id()
        )
    );
-- System users podem gerenciar todas as faturas
CREATE POLICY "invoices_all_system" ON invoices FOR ALL USING (is_system_user()) WITH CHECK (is_system_user());
-- =============================================================================
-- 7. PROJECTS
-- =============================================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- Membros podem ver/criar/editar projetos do seu tenant
CREATE POLICY "projects_select_own" ON projects FOR
SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "projects_insert_own" ON projects FOR
INSERT WITH CHECK (tenant_id = get_user_tenant_id());
CREATE POLICY "projects_update_own" ON projects FOR
UPDATE USING (tenant_id = get_user_tenant_id()) WITH CHECK (tenant_id = get_user_tenant_id());
CREATE POLICY "projects_delete_own" ON projects FOR DELETE USING (tenant_id = get_user_tenant_id());
-- =============================================================================
-- 8. LOCATIONS
-- =============================================================================
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
-- Membros podem ver/gerenciar locais de projetos do seu tenant
CREATE POLICY "locations_select_own" ON locations FOR
SELECT USING (
        project_id IN (
            SELECT id
            FROM projects
            WHERE tenant_id = get_user_tenant_id()
        )
    );
CREATE POLICY "locations_insert_own" ON locations FOR
INSERT WITH CHECK (
        project_id IN (
            SELECT id
            FROM projects
            WHERE tenant_id = get_user_tenant_id()
        )
    );
CREATE POLICY "locations_update_own" ON locations FOR
UPDATE USING (
        project_id IN (
            SELECT id
            FROM projects
            WHERE tenant_id = get_user_tenant_id()
        )
    );
CREATE POLICY "locations_delete_own" ON locations FOR DELETE USING (
    project_id IN (
        SELECT id
        FROM projects
        WHERE tenant_id = get_user_tenant_id()
    )
);
-- =============================================================================
-- 9. SERVICES
-- =============================================================================
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services_select_own" ON services FOR
SELECT USING (tenant_id = get_user_tenant_id());
CREATE POLICY "services_insert_own" ON services FOR
INSERT WITH CHECK (tenant_id = get_user_tenant_id());
CREATE POLICY "services_update_own" ON services FOR
UPDATE USING (tenant_id = get_user_tenant_id()) WITH CHECK (tenant_id = get_user_tenant_id());
CREATE POLICY "services_delete_own" ON services FOR DELETE USING (tenant_id = get_user_tenant_id());
-- =============================================================================
-- 10. CRITERIA
-- =============================================================================
ALTER TABLE criteria ENABLE ROW LEVEL SECURITY;
CREATE POLICY "criteria_select_own" ON criteria FOR
SELECT USING (
        service_id IN (
            SELECT id
            FROM services
            WHERE tenant_id = get_user_tenant_id()
        )
    );
CREATE POLICY "criteria_insert_own" ON criteria FOR
INSERT WITH CHECK (
        service_id IN (
            SELECT id
            FROM services
            WHERE tenant_id = get_user_tenant_id()
        )
    );
CREATE POLICY "criteria_update_own" ON criteria FOR
UPDATE USING (
        service_id IN (
            SELECT id
            FROM services
            WHERE tenant_id = get_user_tenant_id()
        )
    );
CREATE POLICY "criteria_delete_own" ON criteria FOR DELETE USING (
    service_id IN (
        SELECT id
        FROM services
        WHERE tenant_id = get_user_tenant_id()
    )
);
-- =============================================================================
-- 11. PLANNING_ITEMS
-- =============================================================================
ALTER TABLE planning_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "planning_select_own" ON planning_items FOR
SELECT USING (
        project_id IN (
            SELECT id
            FROM projects
            WHERE tenant_id = get_user_tenant_id()
        )
    );
CREATE POLICY "planning_insert_own" ON planning_items FOR
INSERT WITH CHECK (
        project_id IN (
            SELECT id
            FROM projects
            WHERE tenant_id = get_user_tenant_id()
        )
    );
CREATE POLICY "planning_update_own" ON planning_items FOR
UPDATE USING (
        project_id IN (
            SELECT id
            FROM projects
            WHERE tenant_id = get_user_tenant_id()
        )
    );
CREATE POLICY "planning_delete_own" ON planning_items FOR DELETE USING (
    project_id IN (
        SELECT id
        FROM projects
        WHERE tenant_id = get_user_tenant_id()
    )
);
-- =============================================================================
-- 12. INSPECTIONS
-- =============================================================================
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inspections_select_own" ON inspections FOR
SELECT USING (
        project_id IN (
            SELECT id
            FROM projects
            WHERE tenant_id = get_user_tenant_id()
        )
    );
CREATE POLICY "inspections_insert_own" ON inspections FOR
INSERT WITH CHECK (
        project_id IN (
            SELECT id
            FROM projects
            WHERE tenant_id = get_user_tenant_id()
        )
    );
CREATE POLICY "inspections_update_own" ON inspections FOR
UPDATE USING (
        project_id IN (
            SELECT id
            FROM projects
            WHERE tenant_id = get_user_tenant_id()
        )
    );
CREATE POLICY "inspections_delete_own" ON inspections FOR DELETE USING (
    project_id IN (
        SELECT id
        FROM projects
        WHERE tenant_id = get_user_tenant_id()
    )
);
-- =============================================================================
-- 13. INSPECTION_ITEMS
-- =============================================================================
ALTER TABLE inspection_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inspection_items_select_own" ON inspection_items FOR
SELECT USING (
        inspection_id IN (
            SELECT i.id
            FROM inspections i
                JOIN projects p ON i.project_id = p.id
            WHERE p.tenant_id = get_user_tenant_id()
        )
    );
CREATE POLICY "inspection_items_insert_own" ON inspection_items FOR
INSERT WITH CHECK (
        inspection_id IN (
            SELECT i.id
            FROM inspections i
                JOIN projects p ON i.project_id = p.id
            WHERE p.tenant_id = get_user_tenant_id()
        )
    );
CREATE POLICY "inspection_items_update_own" ON inspection_items FOR
UPDATE USING (
        inspection_id IN (
            SELECT i.id
            FROM inspections i
                JOIN projects p ON i.project_id = p.id
            WHERE p.tenant_id = get_user_tenant_id()
        )
    );
CREATE POLICY "inspection_items_delete_own" ON inspection_items FOR DELETE USING (
    inspection_id IN (
        SELECT i.id
        FROM inspections i
            JOIN projects p ON i.project_id = p.id
        WHERE p.tenant_id = get_user_tenant_id()
    )
);
-- =============================================================================
-- 14. ISSUES
-- =============================================================================
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "issues_select_own" ON issues FOR
SELECT USING (
        inspection_id IN (
            SELECT i.id
            FROM inspections i
                JOIN projects p ON i.project_id = p.id
            WHERE p.tenant_id = get_user_tenant_id()
        )
    );
CREATE POLICY "issues_insert_own" ON issues FOR
INSERT WITH CHECK (
        inspection_id IN (
            SELECT i.id
            FROM inspections i
                JOIN projects p ON i.project_id = p.id
            WHERE p.tenant_id = get_user_tenant_id()
        )
    );
CREATE POLICY "issues_update_own" ON issues FOR
UPDATE USING (
        inspection_id IN (
            SELECT i.id
            FROM inspections i
                JOIN projects p ON i.project_id = p.id
            WHERE p.tenant_id = get_user_tenant_id()
        )
    );
CREATE POLICY "issues_delete_own" ON issues FOR DELETE USING (
    inspection_id IN (
        SELECT i.id
        FROM inspections i
            JOIN projects p ON i.project_id = p.id
        WHERE p.tenant_id = get_user_tenant_id()
    )
);
-- =============================================================================
-- 15. NOTIFICATIONS
-- =============================================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
-- Usuário só pode ver suas próprias notificações
CREATE POLICY "notifications_select_own" ON notifications FOR
SELECT USING (
        user_id IN (
            SELECT id
            FROM users
            WHERE auth_id = auth.uid()
        )
    );
-- Usuário pode atualizar suas próprias notificações (marcar como lida)
CREATE POLICY "notifications_update_own" ON notifications FOR
UPDATE USING (
        user_id IN (
            SELECT id
            FROM users
            WHERE auth_id = auth.uid()
        )
    );
-- Inserção de notificações é feita pelo backend (service_role)
-- Não precisa de política de INSERT para usuários normais
-- =============================================================================
-- STORAGE: Política para bucket inspection-photos
-- =============================================================================
-- Executar APÓS criar o bucket no Dashboard:
--   Storage → New Bucket → nome: inspection-photos → público: sim
--
-- Permite upload/delete apenas para usuários autenticados
-- SELECT (leitura pública — bucket público)
CREATE POLICY "inspection_photos_public_read" ON storage.objects FOR
SELECT USING (bucket_id = 'inspection-photos');
-- INSERT (upload — apenas autenticado)
CREATE POLICY "inspection_photos_authenticated_upload" ON storage.objects FOR
INSERT WITH CHECK (
        bucket_id = 'inspection-photos'
        AND auth.uid() IS NOT NULL
    );
-- DELETE (remoção — apenas autenticado)
CREATE POLICY "inspection_photos_authenticated_delete" ON storage.objects FOR DELETE USING (
    bucket_id = 'inspection-photos'
    AND auth.uid() IS NOT NULL
);