-- Migrations for BarberFlow

-- 1. Tenants (Barbershops)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  instagram TEXT,
  business_hours JSONB DEFAULT '[]'::jsonb,
  user_id UUID -- Link to Supabase Auth User
);

-- 2. Services
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  description TEXT
);

-- 3. Customers
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  notes TEXT,
  last_visit TIMESTAMP WITH TIME ZONE
);

-- 4. Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'scheduled', -- scheduled, confirmed, cancelled, finished
  notes TEXT,
  source TEXT DEFAULT 'manual' -- manual, whatsapp_ia, web
);

-- Enable RLS (Row Level Security)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Insert Default Dev Tenant
INSERT INTO tenants (id, name, owner_name, phone, email, address, city, state)
VALUES ('00000000-0000-0000-0000-000000000000', 'Barbearia Dev', 'Admin Dev', '11999999999', 'admin@dev.com', 'Rua Dev, 123', 'São Paulo', 'SP')
ON CONFLICT (id) DO NOTHING;

-- Basic Policies (Simplified for dev, should be hardened later)
CREATE POLICY "Users can manage their own tenant" ON tenants
  FOR ALL USING (auth.uid() = user_id OR id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Users can manage services of their tenant" ON services
  FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid() OR id = '00000000-0000-0000-0000-000000000000'));

CREATE POLICY "Users can manage customers of their tenant" ON customers
  FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid() OR id = '00000000-0000-0000-0000-000000000000'));

CREATE POLICY "Users can manage appointments of their tenant" ON appointments
  FOR ALL USING (tenant_id IN (SELECT id FROM tenants WHERE user_id = auth.uid() OR id = '00000000-0000-0000-0000-000000000000'));
