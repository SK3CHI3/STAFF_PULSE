-- Enable RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Payment Methods RLS
CREATE POLICY "Org members can view their payment methods" ON payment_methods
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );
CREATE POLICY "Org members can manage their payment methods" ON payment_methods
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );

-- Invoices RLS
CREATE POLICY "Org members can view their invoices" ON invoices
    FOR SELECT USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );
CREATE POLICY "Org members can manage their invoices" ON invoices
    FOR ALL USING (
        organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    ); 