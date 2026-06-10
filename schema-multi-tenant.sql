-- ============================================================================
-- ORKA MEXICO - MULTI-TENANT SCHEMA
-- ============================================================================
-- Crear estructura para 2 empresas: ORKA_MX (México) y ORKA_OLEO (USA)
-- RLS Policy: cada usuario solo ve datos de su(s) empresa(s)
-- ============================================================================

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

CREATE TYPE company_type AS ENUM ('ORKA_MX', 'ORKA_OLEO');
CREATE TYPE user_role AS ENUM ('ADMIN', 'VENTAS', 'CREDITO', 'OPERACIONES');
CREATE TYPE partner_type AS ENUM ('Client', 'Supplier', 'Carrier');
CREATE TYPE sale_status AS ENUM ('INTENTION', 'APPROVED', 'LOADING', 'BOL_UPDATED', 'ON_TRACK', 'POD_PENDING', 'DONE');
CREATE TYPE payment_status AS ENUM ('PAID', 'PARTIAL', 'PENDING');
CREATE TYPE fiscal_regime AS ENUM ('PF', 'PMRN', 'PSM', 'PNA', 'PM', 'PP', 'SM', 'OTRO');

-- ============================================================================
-- 2. COMPANIES (Tenants)
-- ============================================================================

CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    type company_type NOT NULL UNIQUE,
    country TEXT NOT NULL,
    timezone TEXT DEFAULT 'America/Mexico_City',
    currency TEXT DEFAULT 'USD',
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO companies (name, type, country) VALUES
    ('ORKA MEXICO', 'ORKA_MX', 'Mexico'),
    ('ORKA OLEO GROUP', 'ORKA_OLEO', 'USA');

-- ============================================================================
-- 3. USERS (con relación multi-empresa)
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL,
    company_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],
    active_company_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_active_company FOREIGN KEY (active_company_id) REFERENCES companies(id)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_company_ids ON users USING GIN(company_ids);

-- ============================================================================
-- 4. PRODUCTS
-- ============================================================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, code)
);

CREATE INDEX idx_products_company ON products(company_id);
CREATE INDEX idx_products_code ON products(code);

INSERT INTO products (name, code, company_id)
SELECT 'ULSD', 'ULSD', id FROM companies WHERE type = 'ORKA_MX'
UNION ALL
SELECT 'ETHANOL', 'ETHANOL', id FROM companies WHERE type = 'ORKA_MX'
UNION ALL
SELECT 'NAPHTHA', 'NAPHTHA', id FROM companies WHERE type = 'ORKA_MX'
UNION ALL
SELECT 'GASOLINE', 'GASOLINE', id FROM companies WHERE type = 'ORKA_MX'
UNION ALL
SELECT 'ULSD', 'ULSD', id FROM companies WHERE type = 'ORKA_OLEO'
UNION ALL
SELECT 'ETHANOL', 'ETHANOL', id FROM companies WHERE type = 'ORKA_OLEO'
UNION ALL
SELECT 'NAPHTHA', 'NAPHTHA', id FROM companies WHERE type = 'ORKA_OLEO'
UNION ALL
SELECT 'GASOLINE', 'GASOLINE', id FROM companies WHERE type = 'ORKA_OLEO';

-- ============================================================================
-- 5. TERMINALS
-- ============================================================================

CREATE TABLE terminals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    location TEXT,
    country TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, code)
);

CREATE INDEX idx_terminals_company ON terminals(company_id);

-- Terminales ORKA MX
INSERT INTO terminals (name, code, company_id, location, country)
SELECT 'Blue Wing', 'BLUEWING', id, 'USA', 'USA' FROM companies WHERE type = 'ORKA_MX'
UNION ALL
SELECT 'Sunoco', 'SUNOCO', id, 'USA', 'USA' FROM companies WHERE type = 'ORKA_MX'
UNION ALL
SELECT 'Motus', 'MOTUS', id, 'USA', 'USA' FROM companies WHERE type = 'ORKA_MX'
UNION ALL
SELECT 'Titan', 'TITAN', id, 'USA', 'USA' FROM companies WHERE type = 'ORKA_MX';

-- ============================================================================
-- 6. PARTNERS (Clientes, Proveedores, Transportistas)
-- ============================================================================

CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type partner_type NOT NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Datos fiscales
    rfc TEXT NOT NULL,
    legal_name TEXT,
    fiscal_address TEXT,
    zip_code TEXT,
    fiscal_regime fiscal_regime,

    -- Contacto
    contact_person TEXT,
    contact_email TEXT,
    contact_phone TEXT,

    -- Crédito (solo para clientes)
    credit_limit NUMERIC(12, 2) DEFAULT 0,
    credit_available NUMERIC(12, 2) DEFAULT 0,

    -- Estatus
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(company_id, rfc)
);

CREATE INDEX idx_partners_company ON partners(company_id);
CREATE INDEX idx_partners_type ON partners(type);
CREATE INDEX idx_partners_name ON partners(name);
CREATE INDEX idx_partners_rfc ON partners(rfc);

-- Insert ALPHA (cliente ORKA MX) - placeholder RFC para demo
INSERT INTO partners (name, type, company_id, rfc, legal_name, credit_limit, is_active)
SELECT
    'ALPHA',
    'Client'::partner_type,
    id,
    'ALPHA000000000',
    'ALPHA INC',
    1500000,
    TRUE
FROM companies WHERE type = 'ORKA_MX';

-- ============================================================================
-- 7. SALES (Ventas/Pipas)
-- ============================================================================

CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    -- Operación
    sale_date DATE NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id),
    customer_id UUID NOT NULL REFERENCES partners(id),
    carrier_id UUID REFERENCES partners(id),
    terminal_id UUID REFERENCES terminals(id),

    -- Detalles de carga
    truck_number TEXT,
    trailer_number TEXT,
    bol_number TEXT UNIQUE,
    pod_number TEXT,

    -- Volumen
    net_barrels NUMERIC(10, 2),
    gallons NUMERIC(12, 2) NOT NULL,

    -- Pricing
    rate NUMERIC(10, 4) NOT NULL,
    unit_cost NUMERIC(10, 4),
    total_sale NUMERIC(14, 2) NOT NULL,

    -- Estado
    status sale_status DEFAULT 'INTENTION',
    is_invoiced BOOLEAN DEFAULT FALSE,

    -- Trazabilidad
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_total_sale_positive CHECK (total_sale >= 0)
);

CREATE INDEX idx_sales_company ON sales(company_id);
CREATE INDEX idx_sales_customer ON sales(customer_id);
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_bol ON sales(bol_number);

-- ============================================================================
-- 8. PAYMENTS (Pagos de clientes)
-- ============================================================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    customer_id UUID NOT NULL REFERENCES partners(id),
    payment_date DATE NOT NULL,
    amount NUMERIC(14, 2) NOT NULL,

    -- Referencia bancaria
    bank_reference TEXT,
    notes TEXT,

    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_payments_company ON payments(company_id);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- ============================================================================
-- 9. PAYMENT_APPLICATIONS (Aplicación de pagos a facturas específicas)
-- ============================================================================

CREATE TABLE payment_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    sale_id UUID NOT NULL REFERENCES sales(id),
    amount_applied NUMERIC(14, 2) NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_amount_applied_positive CHECK (amount_applied >= 0),
    UNIQUE(payment_id, sale_id)
);

CREATE INDEX idx_payment_apps_company ON payment_applications(company_id);
CREATE INDEX idx_payment_apps_payment ON payment_applications(payment_id);
CREATE INDEX idx_payment_apps_sale ON payment_applications(sale_id);

-- ============================================================================
-- 10. PAYMENT_TERMS (Términos de pago por cliente/producto)
-- ============================================================================

CREATE TABLE payment_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    customer_id UUID REFERENCES partners(id),
    product_id UUID REFERENCES products(id),

    days_due INTEGER DEFAULT 7,
    notes TEXT,

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Si customer_id y product_id son null, es el default
    UNIQUE(company_id, customer_id, product_id)
);

CREATE INDEX idx_payment_terms_company ON payment_terms(company_id);

-- Default: 15 días para ALPHA
INSERT INTO payment_terms (company_id, customer_id, days_due)
SELECT c.id, p.id, 15
FROM companies c
JOIN partners p ON p.company_id = c.id
WHERE c.type = 'ORKA_MX' AND p.name = 'ALPHA';

-- Default general: 7 días
INSERT INTO payment_terms (company_id, days_due)
SELECT id, 7 FROM companies;

-- ============================================================================
-- 11. COMPLIANCE_DOCUMENTS
-- ============================================================================

CREATE TABLE compliance_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,

    sale_id UUID NOT NULL REFERENCES sales(id),
    document_type TEXT NOT NULL, -- 'BOL', 'POD', 'CFDI', 'PERMIT', etc.
    storage_url TEXT,
    file_name TEXT,
    file_size INTEGER,

    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(sale_id, document_type)
);

CREATE INDEX idx_compliance_docs_company ON compliance_documents(company_id);
CREATE INDEX idx_compliance_docs_sale ON compliance_documents(sale_id);

-- ============================================================================
-- 12. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Usuarios pueden ver/editar solo sus empresas asignadas

-- Companies: Los admins de cada empresa ven la suya
CREATE POLICY companies_user_access ON companies
    FOR ALL
    USING (
        id = ANY(
            (SELECT company_ids FROM users WHERE id = auth.uid())
        )
    );

-- Products: Filtra por company_id del usuario
CREATE POLICY products_user_access ON products
    FOR ALL
    USING (
        company_id = ANY(
            (SELECT company_ids FROM users WHERE id = auth.uid())
        )
    );

-- Terminals: Filtra por company_id del usuario
CREATE POLICY terminals_user_access ON terminals
    FOR ALL
    USING (
        company_id = ANY(
            (SELECT company_ids FROM users WHERE id = auth.uid())
        )
    );

-- Partners: Filtra por company_id del usuario
CREATE POLICY partners_user_access ON partners
    FOR ALL
    USING (
        company_id = ANY(
            (SELECT company_ids FROM users WHERE id = auth.uid())
        )
    );

-- Sales: Filtra por company_id del usuario
CREATE POLICY sales_user_access ON sales
    FOR ALL
    USING (
        company_id = ANY(
            (SELECT company_ids FROM users WHERE id = auth.uid())
        )
    );

-- Payments: Filtra por company_id del usuario
CREATE POLICY payments_user_access ON payments
    FOR ALL
    USING (
        company_id = ANY(
            (SELECT company_ids FROM users WHERE id = auth.uid())
        )
    );

-- Payment Applications: Filtra por company_id del usuario
CREATE POLICY payment_applications_user_access ON payment_applications
    FOR ALL
    USING (
        company_id = ANY(
            (SELECT company_ids FROM users WHERE id = auth.uid())
        )
    );

-- Payment Terms: Filtra por company_id del usuario
CREATE POLICY payment_terms_user_access ON payment_terms
    FOR ALL
    USING (
        company_id = ANY(
            (SELECT company_ids FROM users WHERE id = auth.uid())
        )
    );

-- Compliance Documents: Filtra por company_id del usuario
CREATE POLICY compliance_documents_user_access ON compliance_documents
    FOR ALL
    USING (
        company_id = ANY(
            (SELECT company_ids FROM users WHERE id = auth.uid())
        )
    );

-- ============================================================================
-- 13. VIEWS ÚTILES PARA LA APP
-- ============================================================================

-- Vista: Balance de cliente por fecha
CREATE OR REPLACE VIEW v_client_balances AS
SELECT
    p.id as client_id,
    p.company_id,
    p.name as client_name,
    p.credit_limit,
    COALESCE(SUM(s.total_sale), 0) as total_billed,
    COALESCE(SUM(pa.amount_applied), 0) as total_paid,
    COALESCE(SUM(s.total_sale), 0) - COALESCE(SUM(pa.amount_applied), 0) as balance_due,
    MAX(s.sale_date) as last_sale_date
FROM partners p
LEFT JOIN sales s ON s.customer_id = p.id AND s.company_id = p.company_id
LEFT JOIN payment_applications pa ON pa.sale_id = s.id
WHERE p.type = 'Client'::partner_type
GROUP BY p.id, p.company_id, p.name, p.credit_limit;

-- Vista: Facturas vencidas (overdue)
CREATE OR REPLACE VIEW v_overdue_sales AS
SELECT
    s.id,
    s.company_id,
    s.bol_number,
    p.name as customer_name,
    s.sale_date,
    COALESCE(pt.days_due, 7) as days_due,
    (s.sale_date + (COALESCE(pt.days_due, 7) || ' days')::INTERVAL)::DATE as due_date,
    s.total_sale,
    COALESCE(SUM(pa.amount_applied), 0) as amount_paid,
    s.total_sale - COALESCE(SUM(pa.amount_applied), 0) as amount_due,
    CURRENT_DATE - (s.sale_date + (COALESCE(pt.days_due, 7) || ' days')::INTERVAL)::DATE as days_overdue
FROM sales s
JOIN partners p ON p.id = s.customer_id
LEFT JOIN payment_terms pt ON pt.customer_id = p.id AND pt.company_id = s.company_id
LEFT JOIN payment_applications pa ON pa.sale_id = s.id
WHERE s.status != 'CANCELLED'
    AND (s.total_sale - COALESCE(SUM(pa.amount_applied), 0)) > 0
    AND (s.sale_date + (COALESCE(pt.days_due, 7) || ' days')::INTERVAL)::DATE < CURRENT_DATE
GROUP BY s.id, s.company_id, s.bol_number, p.name, s.sale_date, pt.days_due, s.total_sale;

-- Vista: P&L por fecha
CREATE OR REPLACE VIEW v_daily_pl AS
SELECT
    s.company_id,
    s.sale_date,
    COUNT(DISTINCT s.id) as sales_count,
    COALESCE(SUM(s.total_sale), 0) as revenue,
    COALESCE(SUM(s.unit_cost * s.gallons), 0) as cogs,
    COALESCE(SUM(s.total_sale), 0) - COALESCE(SUM(s.unit_cost * s.gallons), 0) as gross_profit,
    ROUND(
        100 * (COALESCE(SUM(s.total_sale), 0) - COALESCE(SUM(s.unit_cost * s.gallons), 0)) /
        NULLIF(COALESCE(SUM(s.total_sale), 0), 0)
    , 2) as gross_margin_pct
FROM sales s
WHERE s.status != 'INTENTION'
GROUP BY s.company_id, s.sale_date
ORDER BY s.sale_date DESC;

-- ============================================================================
-- 14. ÍNDICES ADICIONALES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX idx_sales_company_status_date ON sales(company_id, status, sale_date);
CREATE INDEX idx_payments_company_customer_date ON payments(company_id, customer_id, payment_date);
CREATE INDEX idx_partners_company_type_active ON partners(company_id, type, is_active);

-- ============================================================================
-- 15. COMENTARIOS DE DOCUMENTACIÓN
-- ============================================================================

COMMENT ON TABLE companies IS 'Tenants: ORKA_MX (México) y ORKA_OLEO (USA)';
COMMENT ON TABLE partners IS 'Clientes, Proveedores, Transportistas - con data fiscal para CFDI';
COMMENT ON TABLE sales IS 'Ventas/Pipas de combustible con estado de operación';
COMMENT ON TABLE payments IS 'Pagos recibidos de clientes';
COMMENT ON TABLE payment_applications IS 'Aplicación de pagos a facturas específicas (reconciliación)';
COMMENT ON COLUMN sales.status IS 'Estado de operación: INTENTION → APPROVED → LOADING → BOL_UPDATED → ON_TRACK → POD_PENDING → DONE';
COMMENT ON VIEW v_client_balances IS 'Balance actual de cada cliente (total facturado - pagado)';
COMMENT ON VIEW v_overdue_sales IS 'Facturas vencidas con días de mora';
COMMENT ON VIEW v_daily_pl IS 'P&L diario: ingresos - COGS = ganancia bruta';

-- ============================================================================
-- FIN DEL SCHEMA
-- ============================================================================
