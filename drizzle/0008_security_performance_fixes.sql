-- Migration: Security & Performance Fixes
-- Adiciona índices em FKs, constraints UNIQUE e CHECK

-- ============================================
-- 1. ÍNDICES EM FOREIGN KEYS AUSENTES
-- ============================================

-- inspections
CREATE INDEX IF NOT EXISTS idx_inspections_service_id ON inspections (service_id);
CREATE INDEX IF NOT EXISTS idx_inspections_location_id ON inspections (location_id);
CREATE INDEX IF NOT EXISTS idx_inspections_supervisor_id ON inspections (supervisor_id);
CREATE INDEX IF NOT EXISTS idx_inspections_project_month ON inspections (project_id, reference_month);
CREATE INDEX IF NOT EXISTS idx_inspections_project_status ON inspections (project_id, status);

-- inspection_items
CREATE INDEX IF NOT EXISTS idx_inspection_items_criterion_id ON inspection_items (criterion_id);

-- measurement_items
CREATE INDEX IF NOT EXISTS idx_measurement_items_contract_item_id ON measurement_items (contract_item_id);

-- measurement_approvals
CREATE INDEX IF NOT EXISTS idx_measurement_approvals_user_id ON measurement_approvals (user_id);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (user_id, read);

-- contracts
CREATE INDEX IF NOT EXISTS idx_contracts_tenant_project ON contracts (tenant_id, project_id);
CREATE INDEX IF NOT EXISTS idx_contracts_tenant_active ON contracts (tenant_id, active);

-- planning_items
CREATE INDEX IF NOT EXISTS idx_planning_items_service_id ON planning_items (service_id);
CREATE INDEX IF NOT EXISTS idx_planning_items_location_id ON planning_items (location_id);
CREATE INDEX IF NOT EXISTS idx_planning_items_project_month ON planning_items (project_id, reference_month);

-- site_diaries
CREATE INDEX IF NOT EXISTS idx_site_diaries_project_date ON site_diaries (project_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_site_diaries_project_status ON site_diaries (project_id, status);

-- contractors
CREATE INDEX IF NOT EXISTS idx_contractors_tenant_active ON contractors (tenant_id, active);

-- users
CREATE INDEX IF NOT EXISTS idx_users_tenant_active ON users (tenant_id, active);

-- issues
CREATE INDEX IF NOT EXISTS idx_issues_inspection_status ON issues (inspection_id, status);

-- subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions (plan_id);

-- invoices
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices (status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices (due_date);

-- diary sub-tables
CREATE INDEX IF NOT EXISTS idx_diary_observations_created_by ON diary_observations (created_by);
CREATE INDEX IF NOT EXISTS idx_diary_service_releases_signed_by ON diary_service_releases (signed_by);
CREATE INDEX IF NOT EXISTS idx_diary_services_executed_service_id ON diary_services_executed (service_id);

-- ============================================
-- 2. UNIQUE CONSTRAINTS
-- ============================================

-- Número de contrato único por tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_contracts_tenant_number ON contracts (tenant_id, contract_number);

-- BM number único por contrato
CREATE UNIQUE INDEX IF NOT EXISTS uq_bulletins_contract_bm ON measurement_bulletins (contract_id, bm_number);

-- Critério aparece uma vez por inspeção
CREATE UNIQUE INDEX IF NOT EXISTS uq_inspection_items_criterion ON inspection_items (inspection_id, criterion_id);

-- Email único por tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_tenant_email ON users (tenant_id, email);

-- CNPJ único por tenant (quando fornecido)
CREATE UNIQUE INDEX IF NOT EXISTS uq_contractors_tenant_cnpj ON contractors (tenant_id, cnpj) WHERE cnpj IS NOT NULL;

-- ============================================
-- 3. CHECK CONSTRAINTS
-- ============================================

-- Validar ranges numéricos
ALTER TABLE contract_items ADD CONSTRAINT chk_unit_price_positive CHECK (unit_price >= 0);
ALTER TABLE contract_items ADD CONSTRAINT chk_contracted_qty_positive CHECK (contracted_quantity > 0);
ALTER TABLE measurement_items ADD CONSTRAINT chk_qty_this_period_positive CHECK (quantity_this_period >= 0);
ALTER TABLE measurement_bulletins ADD CONSTRAINT chk_discount_positive CHECK (discount_value >= 0);
ALTER TABLE measurement_bulletins ADD CONSTRAINT chk_bm_number_positive CHECK (bm_number > 0);

-- Validar datas de contrato
ALTER TABLE contracts ADD CONSTRAINT chk_contract_dates CHECK (end_date IS NULL OR start_date <= end_date);

-- Validar retenção técnica
ALTER TABLE contracts ADD CONSTRAINT chk_retention_pct CHECK (technical_retention_pct >= 0 AND technical_retention_pct <= 100);
