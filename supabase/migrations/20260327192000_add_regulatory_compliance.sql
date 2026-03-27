-- Regulatory compliance registry (SPA/MF)
CREATE TABLE IF NOT EXISTS public.regulatory_compliance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name text NOT NULL,
  regulator text NOT NULL DEFAULT 'SPA/MF',
  license_code text NOT NULL,
  license_status text NOT NULL DEFAULT 'active',
  valid_from date,
  valid_until date,
  responsible_gaming_policy_url text,
  anti_money_laundering_policy_url text,
  evidence_url text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.regulatory_compliance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Regulatory compliance is viewable by everyone" ON public.regulatory_compliance;
CREATE POLICY "Regulatory compliance is viewable by everyone"
  ON public.regulatory_compliance
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service role manages regulatory compliance" ON public.regulatory_compliance;
CREATE POLICY "Service role manages regulatory compliance"
  ON public.regulatory_compliance
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.update_regulatory_compliance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_regulatory_compliance_updated_at ON public.regulatory_compliance;
CREATE TRIGGER trg_regulatory_compliance_updated_at
  BEFORE UPDATE ON public.regulatory_compliance
  FOR EACH ROW
  EXECUTE FUNCTION public.update_regulatory_compliance_updated_at();

INSERT INTO public.regulatory_compliance (
  provider_name,
  regulator,
  license_code,
  license_status,
  valid_from,
  valid_until,
  responsible_gaming_policy_url,
  anti_money_laundering_policy_url,
  evidence_url,
  notes
)
VALUES (
  'Esportes da Sorte',
  'SPA/MF',
  'SPA-MF-DEMO-2026-0001',
  'active',
  CURRENT_DATE,
  (CURRENT_DATE + INTERVAL '12 months')::date,
  'https://www.gov.br/fazenda/pt-br/acesso-a-informacao/acoes-e-programas/spa',
  'https://www.gov.br/fazenda/pt-br/acesso-a-informacao/acoes-e-programas/spa',
  'https://www.gov.br/fazenda/pt-br/acesso-a-informacao/acoes-e-programas/spa',
  'Registro interno para transparência regulatória e auditoria do app.'
)
ON CONFLICT DO NOTHING;
