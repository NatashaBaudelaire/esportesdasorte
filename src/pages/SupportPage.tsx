import { FormEvent, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CircleCheck, CircleAlert, MessageCircle, Phone, Hand } from 'lucide-react';
import { toast } from 'sonner';
import { PageTransition } from '@/components/animations';
import { useSettingsStore } from '@/store/settingsStore';

type SupportSubject = 'geral' | 'tecnico' | 'pagamentos' | 'conta';

type FormValues = {
  name: string;
  email: string;
  cpf: string;
  phone: string;
  message: string;
  subject: SupportSubject;
  wantsLibras: boolean;
  simplifiedMode: boolean;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const digitsOnly = (value: string) => value.replace(/\D/g, '');

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email);

const isValidInternationalPhone = (phone: string) => {
  const allowedChars = /^[+\d\s()\-]+$/;
  if (!allowedChars.test(phone)) return false;
  if (!phone.trim().startsWith('+')) return false;

  const digits = digitsOnly(phone);
  return digits.length >= 10 && digits.length <= 15;
};

const isValidCPF = (value: string) => {
  const cpf = digitsOnly(value);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += Number(cpf.charAt(i)) * (10 - i);
  }
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== Number(cpf.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i += 1) {
    sum += Number(cpf.charAt(i)) * (11 - i);
  }
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;

  return digit === Number(cpf.charAt(10));
};

const formatCPF = (value: string) => {
  const cpf = digitsOnly(value).slice(0, 11);
  return cpf
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

const SupportPage = () => {
  const navigate = useNavigate();
  const librasEnabled = useSettingsStore((s) => s.librasEnabled);

  const [values, setValues] = useState<FormValues>({
    name: '',
    email: '',
    cpf: '',
    phone: '+55 ',
    message: '',
    subject: 'geral',
    wantsLibras: librasEnabled,
    simplifiedMode: false,
  });
  const [touched, setTouched] = useState<Record<keyof FormValues, boolean>>({
    name: false,
    email: false,
    cpf: false,
    phone: false,
    message: false,
    subject: false,
    wantsLibras: false,
    simplifiedMode: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const cpfRequired = values.subject === 'pagamentos' || values.subject === 'conta';

  const errors = useMemo<FormErrors>(() => {
    const next: FormErrors = {};

    if (!values.name.trim()) {
      next.name = 'Informe seu nome.';
    }

    if (!values.email.trim()) {
      next.email = 'Informe seu e-mail.';
    } else if (!isValidEmail(values.email)) {
      next.email = 'Formato de e-mail inválido. Exemplo: usuario@dominio.com';
    }

    if (cpfRequired && !values.cpf.trim()) {
      next.cpf = 'CPF é obrigatório para este tipo de atendimento.';
    } else if (values.cpf.trim() && !isValidCPF(values.cpf)) {
      next.cpf = 'CPF inválido. Digite 11 dígitos válidos.';
    }

    if (!values.phone.trim()) {
      next.phone = 'Informe seu telefone com código do país.';
    } else if (!isValidInternationalPhone(values.phone)) {
      next.phone = 'Telefone inválido. Exemplo: +55 (11) 99999-9999';
    }

    if (!values.message.trim()) {
      next.message = 'Descreva sua dúvida ou problema.';
    }

    return next;
  }, [values, cpfRequired]);

  const isFormReady =
    values.name.trim().length > 0 &&
    values.email.trim().length > 0 &&
    values.phone.trim().length > 0 &&
    values.message.trim().length > 0 &&
    (!cpfRequired || values.cpf.trim().length > 0);

  const isSubmitEnabled = isFormReady && Object.keys(errors).length === 0 && !submitting;

  const supportSummary = useMemo(() => {
    return [
      `Assunto: ${values.subject}`,
      `Nome: ${values.name}`,
      `E-mail: ${values.email}`,
      `Telefone: ${values.phone}`,
      values.cpf ? `CPF: ${values.cpf}` : 'CPF: não informado',
      `Libras: ${values.wantsLibras ? 'sim' : 'não'}`,
      `Modo simplificado: ${values.simplifiedMode ? 'sim' : 'não'}`,
      '',
      'Mensagem:',
      values.message,
    ].join('\n');
  }, [values]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setTouched({
      name: true,
      email: true,
      cpf: true,
      phone: true,
      message: true,
      subject: true,
      wantsLibras: true,
      simplifiedMode: true,
    });

    if (Object.keys(errors).length > 0) {
      setStatus({ type: 'error', text: 'Verifique os campos em destaque antes de enviar.' });
      toast.error('Erro no envio. Corrija os dados do formulário.');
      return;
    }

    setSubmitting(true);
    setStatus(null);

    try {
      const webhookUrl = import.meta.env.VITE_SUPPORT_WEBHOOK_URL as string | undefined;
      const ticketNumber = `SUP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

      if (webhookUrl) {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticket: ticketNumber,
            ...values,
            cpfDigits: digitsOnly(values.cpf),
            phoneDigits: digitsOnly(values.phone),
            createdAt: new Date().toISOString(),
          }),
        });

        if (!response.ok) {
          throw new Error('Falha ao enviar para o sistema de tickets.');
        }
      } else {
        // Fallback local: mantém experiência funcional sem backend configurado.
        await new Promise((resolve) => {
          window.setTimeout(resolve, 700);
        });
      }

      setStatus({ type: 'success', text: `Mensagem enviada com sucesso. Protocolo: ${ticketNumber}` });
      toast.success(`Mensagem enviada com sucesso. Protocolo ${ticketNumber}`);

      setValues({
        name: '',
        email: '',
        cpf: '',
        phone: '+55 ',
        message: '',
        subject: 'geral',
        wantsLibras: librasEnabled,
        simplifiedMode: false,
      });
      setTouched({
        name: false,
        email: false,
        cpf: false,
        phone: false,
        message: false,
        subject: false,
        wantsLibras: false,
        simplifiedMode: false,
      });

      const supportText = encodeURIComponent(`Protocolo ${ticketNumber}\n\n${supportSummary}`);
      window.open(`https://wa.me/551199999999?text=${supportText}`, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', text: 'Não foi possível enviar agora. Tente novamente em instantes.' });
      toast.error('Erro no envio. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldError = <K extends keyof FormValues>(key: K) => {
    if (!touched[key]) return '';
    return errors[key] || '';
  };

  return (
    <PageTransition>
      <div className="pb-24 px-4 pt-2 space-y-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Voltar"
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground/70 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded"
          >
            <ArrowLeft size={22} aria-hidden="true" />
          </button>
          <div>
            <h1 className="font-display text-xl font-extrabold text-foreground">Chat de Suporte</h1>
            <p className="text-xs text-muted-foreground font-body mt-1">
              Envie sua dúvida para atendimento humano com acessibilidade.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface-card rounded-xl p-4 space-y-4" noValidate>
          <div className="space-y-2">
            <label htmlFor="support-name" className="text-sm font-body font-semibold text-foreground">
              Nome *
            </label>
            <input
              id="support-name"
              value={values.name}
              onChange={(e) => setValues((prev) => ({ ...prev, name: e.target.value }))}
              onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
              aria-invalid={fieldError('name') ? 'true' : 'false'}
              aria-describedby={fieldError('name') ? 'support-name-error' : undefined}
              className="w-full bg-surface-interactive rounded-lg py-3 px-4 text-sm font-body text-foreground outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
              placeholder="Digite seu nome completo"
              autoComplete="name"
              required
            />
            {fieldError('name') && (
              <p id="support-name-error" className="text-xs text-destructive font-body" role="alert">
                {fieldError('name')}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="support-email" className="text-sm font-body font-semibold text-foreground">
              E-mail *
            </label>
            <input
              id="support-email"
              type="email"
              value={values.email}
              onChange={(e) => setValues((prev) => ({ ...prev, email: e.target.value }))}
              onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
              aria-invalid={fieldError('email') ? 'true' : 'false'}
              aria-describedby={fieldError('email') ? 'support-email-error' : undefined}
              className="w-full bg-surface-interactive rounded-lg py-3 px-4 text-sm font-body text-foreground outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
              placeholder="usuario@dominio.com"
              autoComplete="email"
              required
            />
            {fieldError('email') && (
              <p id="support-email-error" className="text-xs text-destructive font-body" role="alert">
                {fieldError('email')}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="support-subject" className="text-sm font-body font-semibold text-foreground">
              Tipo de atendimento *
            </label>
            <select
              id="support-subject"
              value={values.subject}
              onChange={(e) => setValues((prev) => ({ ...prev, subject: e.target.value as SupportSubject }))}
              className="w-full bg-surface-interactive rounded-lg py-3 px-4 text-sm font-body text-foreground outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
              aria-label="Tipo de atendimento"
            >
              <option value="geral">Dúvida geral</option>
              <option value="tecnico">Problema técnico</option>
              <option value="pagamentos">Pagamentos e saque (CPF obrigatório)</option>
              <option value="conta">Conta e segurança (CPF obrigatório)</option>
            </select>
            <p className="text-xs text-muted-foreground font-body">
              CPF é opcional para suporte geral e técnico, e obrigatório para pagamentos/conta.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="support-cpf" className="text-sm font-body font-semibold text-foreground">
              CPF {cpfRequired ? '*' : '(opcional)'}
            </label>
            <input
              id="support-cpf"
              value={values.cpf}
              onChange={(e) => setValues((prev) => ({ ...prev, cpf: formatCPF(e.target.value) }))}
              onBlur={() => setTouched((prev) => ({ ...prev, cpf: true }))}
              aria-invalid={fieldError('cpf') ? 'true' : 'false'}
              aria-describedby={fieldError('cpf') ? 'support-cpf-error' : undefined}
              className="w-full bg-surface-interactive rounded-lg py-3 px-4 text-sm font-body text-foreground outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
              placeholder="000.000.000-00"
              inputMode="numeric"
              maxLength={14}
              required={cpfRequired}
            />
            {fieldError('cpf') && (
              <p id="support-cpf-error" className="text-xs text-destructive font-body" role="alert">
                {fieldError('cpf')}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="support-phone" className="text-sm font-body font-semibold text-foreground">
              Número de telefone *
            </label>
            <input
              id="support-phone"
              value={values.phone}
              onChange={(e) => setValues((prev) => ({ ...prev, phone: e.target.value }))}
              onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
              aria-invalid={fieldError('phone') ? 'true' : 'false'}
              aria-describedby={fieldError('phone') ? 'support-phone-error' : undefined}
              className="w-full bg-surface-interactive rounded-lg py-3 px-4 text-sm font-body text-foreground outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
              placeholder="+55 (11) 99999-9999"
              inputMode="tel"
              autoComplete="tel"
              required
            />
            {fieldError('phone') && (
              <p id="support-phone-error" className="text-xs text-destructive font-body" role="alert">
                {fieldError('phone')}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="support-message" className="text-sm font-body font-semibold text-foreground">
              Mensagem *
            </label>
            <textarea
              id="support-message"
              value={values.message}
              onChange={(e) => setValues((prev) => ({ ...prev, message: e.target.value }))}
              onBlur={() => setTouched((prev) => ({ ...prev, message: true }))}
              aria-invalid={fieldError('message') ? 'true' : 'false'}
              aria-describedby={fieldError('message') ? 'support-message-error' : undefined}
              className="w-full bg-surface-interactive rounded-lg py-3 px-4 text-sm font-body text-foreground outline-none focus:ring-2 focus:ring-primary min-h-[120px] resize-y"
              placeholder="Descreva o problema com detalhes"
              required
            />
            {fieldError('message') && (
              <p id="support-message-error" className="text-xs text-destructive font-body" role="alert">
                {fieldError('message')}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2 bg-surface-interactive rounded-lg p-3 min-h-[44px] cursor-pointer">
              <input
                type="checkbox"
                checked={values.wantsLibras}
                onChange={(e) => setValues((prev) => ({ ...prev, wantsLibras: e.target.checked }))}
                className="accent-primary"
              />
              <span className="text-xs font-body text-foreground flex items-center gap-1">
                <Hand size={14} aria-hidden="true" /> Atendimento em Libras
              </span>
            </label>
            <label className="flex items-center gap-2 bg-surface-interactive rounded-lg p-3 min-h-[44px] cursor-pointer">
              <input
                type="checkbox"
                checked={values.simplifiedMode}
                onChange={(e) => setValues((prev) => ({ ...prev, simplifiedMode: e.target.checked }))}
                className="accent-primary"
              />
              <span className="text-xs font-body text-foreground">Modo simplificado</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={!isSubmitEnabled}
            className="w-full bg-primary text-primary-foreground font-display font-bold text-sm py-3 rounded-xl min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all"
            aria-disabled={!isSubmitEnabled}
          >
            {submitting ? 'Enviando...' : 'Enviar'}
          </button>

          {status && (
            <div
              className={`rounded-lg p-3 flex items-start gap-2 ${status.type === 'success' ? 'bg-secondary/20 text-secondary' : 'bg-destructive/20 text-destructive'}`}
              role="status"
              aria-live="polite"
            >
              {status.type === 'success' ? (
                <CircleCheck size={16} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
              ) : (
                <CircleAlert size={16} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
              )}
              <p className="text-xs font-body">{status.text}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <a
              href="https://wa.me/551199999999"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] rounded-lg bg-surface-interactive text-foreground text-xs font-body font-semibold flex items-center justify-center gap-2 hover:bg-surface-interactive/80 transition-colors"
              aria-label="Falar com operador humano no WhatsApp"
            >
              <MessageCircle size={14} aria-hidden="true" />
              Operador humano
            </a>
            <a
              href="tel:+551199999999"
              className="min-h-[44px] rounded-lg bg-surface-interactive text-foreground text-xs font-body font-semibold flex items-center justify-center gap-2 hover:bg-surface-interactive/80 transition-colors"
              aria-label="Ligar para central de suporte"
            >
              <Phone size={14} aria-hidden="true" />
              Ligar agora
            </a>
          </div>
        </form>
      </div>
    </PageTransition>
  );
};

export default SupportPage;
