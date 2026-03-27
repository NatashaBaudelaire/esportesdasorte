import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, BadgeCheck, FileCheck, AlertTriangle } from 'lucide-react';
import { PageTransition } from '@/components/animations';
import { supabase } from '@/integrations/supabase/client';

type ComplianceInfo = {
  provider_name: string;
  regulator: string;
  license_code: string;
  license_status: string;
  valid_from: string | null;
  valid_until: string | null;
  responsible_gaming_policy_url: string | null;
  anti_money_laundering_policy_url: string | null;
  evidence_url: string | null;
  notes: string | null;
  updated_at: string;
};

const formatDate = (value: string | null) => {
  if (!value) return 'Não informado';
  return new Date(value).toLocaleDateString('pt-BR');
};

const CompliancePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [compliance, setCompliance] = useState<ComplianceInfo | null>(null);

  useEffect(() => {
    const loadCompliance = async () => {
      setLoading(true);
      setError('');

      const { data, error: fnError } = await supabase.functions.invoke('compliance-status');
      if (fnError || !data?.ok) {
        setError('Não foi possível carregar os dados de conformidade agora.');
        setLoading(false);
        return;
      }

      setCompliance(data.compliance ?? null);
      setLoading(false);
    };

    loadCompliance();
  }, []);

  return (
    <PageTransition>
      <div className="pb-20 px-4 pt-2 space-y-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Voltar"
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground/70 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded"
          >
            <ArrowLeft size={22} aria-hidden="true" />
          </button>
          <div>
            <h1 className="font-display text-xl font-extrabold text-foreground">Conformidade SPA/MF</h1>
            <p className="text-xs text-muted-foreground font-body mt-1">Transparência regulatória, política de jogo responsável e controles de segurança.</p>
          </div>
        </div>

        <div className="bg-primary/10 border border-primary rounded-xl p-4 flex items-start gap-3" role="status">
          <BadgeCheck size={20} className="text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-body font-semibold text-foreground">Selo de conformidade ativa</p>
            <p className="text-xs font-body text-muted-foreground mt-1">
              Esta área exibe dados regulatórios vindos do backend para auditoria interna e conferência pública.
            </p>
          </div>
        </div>

        {loading && (
          <div className="bg-surface-card rounded-xl p-4 text-xs font-body text-muted-foreground">Carregando conformidade...</div>
        )}

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 flex items-start gap-2" role="alert">
            <AlertTriangle size={16} className="text-destructive mt-0.5 shrink-0" />
            <p className="text-xs font-body text-foreground">{error}</p>
          </div>
        )}

        {!loading && !error && compliance && (
          <div className="bg-surface-card rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-secondary" />
              <p className="text-sm font-body font-semibold text-foreground">{compliance.provider_name}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-body">
              <div className="bg-surface-interactive rounded-lg p-3">
                <p className="text-muted-foreground">Regulador</p>
                <p className="font-semibold text-foreground">{compliance.regulator}</p>
              </div>
              <div className="bg-surface-interactive rounded-lg p-3">
                <p className="text-muted-foreground">Licença</p>
                <p className="font-semibold text-foreground">{compliance.license_code}</p>
              </div>
              <div className="bg-surface-interactive rounded-lg p-3">
                <p className="text-muted-foreground">Status</p>
                <p className="font-semibold text-secondary capitalize">{compliance.license_status}</p>
              </div>
              <div className="bg-surface-interactive rounded-lg p-3">
                <p className="text-muted-foreground">Validade</p>
                <p className="font-semibold text-foreground">{formatDate(compliance.valid_from)} - {formatDate(compliance.valid_until)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-body font-semibold text-foreground flex items-center gap-2">
                <FileCheck size={14} className="text-primary" /> Políticas destacadas
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href={compliance.responsible_gaming_policy_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] rounded-lg bg-surface-interactive text-foreground text-xs font-body font-semibold flex items-center justify-center hover:bg-surface-interactive/80 transition-colors"
                >
                  Política de Jogo Responsável
                </a>
                <a
                  href={compliance.anti_money_laundering_policy_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] rounded-lg bg-surface-interactive text-foreground text-xs font-body font-semibold flex items-center justify-center hover:bg-surface-interactive/80 transition-colors"
                >
                  Política PLD/AML
                </a>
              </div>
            </div>

            <button
              onClick={() => navigate('/jogo-responsavel')}
              className="w-full min-h-[44px] rounded-lg bg-primary text-primary-foreground text-sm font-display font-bold hover:brightness-110 transition-all"
            >
              Abrir Jogo Responsável
            </button>
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default CompliancePage;
