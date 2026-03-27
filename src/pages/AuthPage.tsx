import { useState, useCallback, useEffect, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Eye, EyeOff, Upload, Gift, Check, X,
  ShieldCheck, Camera, FileText, Mail, Lock, User, UserCircle,
  AtSign, Calendar, CreditCard, Fingerprint, CheckCircle2,
  Smartphone, MapPin, Scan, Brain, AlertTriangle, RefreshCw
} from 'lucide-react';
import heroBanner from '@/assets/hero-banner.jpg';
import Logo from '@/components/Logo';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';

type AuthStep = 'welcome' | 'login' | 'signup' | 'recovery' | 'kyc' | 'otp' | 'success';
type KycSubStep = 'intro' | 'doc-front' | 'doc-back' | 'liveness' | 'validating' | 'done';

// CPF validation
const isValidCPF = (cpf: string): boolean => {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11 || /^(\d)\1+$/.test(cleaned)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
  let rem = (sum * 10) % 11;
  if (rem === 10) rem = 0;
  if (rem !== parseInt(cleaned[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
  rem = (sum * 10) % 11;
  if (rem === 10) rem = 0;
  return rem === parseInt(cleaned[10]);
};

// Password strength with mandatory requirements
const getPasswordStrength = (pw: string): { level: number; label: string; color: string; isStrong: boolean } => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length >= 12) score++;
  const isStrong = score >= 4; // Força mínima obrigatória: 8+ chars, maiúscula, número, símbolo
  if (score <= 1) return { level: score, label: 'Muito Fraca', color: 'bg-destructive', isStrong: false };
  if (score <= 2) return { level: score, label: 'Fraca', color: 'bg-destructive', isStrong: false };
  if (score <= 3) return { level: score, label: 'Média', color: 'bg-primary', isStrong: false };
  return { level: score, label: 'Forte', color: 'bg-secondary', isStrong: true };
};

// Password requirements helper
const getPasswordRequirements = (pw: string) => ({
  minLength: pw.length >= 8,
  hasUppercase: /[A-Z]/.test(pw),
  hasNumber: /[0-9]/.test(pw),
  hasSymbol: /[^A-Za-z0-9]/.test(pw),
});

// CPF mask
const maskCPF = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

// Date mask with real-time validation (blocks impossible values)
const maskDate = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 8);
  // Block impossible day values (>31)
  if (d.length >= 2) {
    const day = parseInt(d.slice(0, 2));
    if (day > 31 || day === 0) return d.slice(0, 1);
  }
  // Block impossible month values (>12)
  if (d.length >= 4) {
    const month = parseInt(d.slice(2, 4));
    if (month > 12 || month === 0) return `${d.slice(0, 2)}/${d.slice(2, 3)}`;
  }
  // Block impossible year values
  if (d.length >= 5) {
    const yearStart = parseInt(d.slice(4, 5));
    if (yearStart !== 1 && yearStart !== 2) return `${d.slice(0, 2)}/${d.slice(2, 4)}/`;
  }
  if (d.length >= 8) {
    const year = parseInt(d.slice(4, 8));
    if (year < 1900 || year > new Date().getFullYear()) return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4, 7)}`;
  }
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
};

type LocaleCode = 'pt-BR' | 'en-US' | 'ja-JP' | 'fr-FR';

interface CountryAddressConfig {
  code: string;
  locale: LocaleCode;
  countryLabel: string;
  stateLabel: string;
  cityLabel: string;
  districtLabel: string;
  streetLabel: string;
  line2Label: string;
  postalLabel: string;
  phoneLabel: string;
  stateRequired: boolean;
  stateOptions: string[];
  postalPlaceholder: string;
  phonePlaceholder: string;
}

const COUNTRY_ADDRESS_CONFIG: Record<string, CountryAddressConfig> = {
  BR: {
    code: 'BR',
    locale: 'pt-BR',
    countryLabel: 'Brasil',
    stateLabel: 'Estado',
    cityLabel: 'Cidade',
    districtLabel: 'Bairro / Distrito',
    streetLabel: 'Rua + Numero',
    line2Label: 'Complemento / Apartamento',
    postalLabel: 'CEP',
    phoneLabel: 'Telefone',
    stateRequired: true,
    stateOptions: ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'],
    postalPlaceholder: '00000-000',
    phonePlaceholder: '+55 (11) 99999-9999',
  },
  US: {
    code: 'US',
    locale: 'en-US',
    countryLabel: 'United States',
    stateLabel: 'State',
    cityLabel: 'City',
    districtLabel: 'District / Neighborhood',
    streetLabel: 'Street Address + Number',
    line2Label: 'Address Line 2 / Apartment / Suite',
    postalLabel: 'ZIP Code',
    phoneLabel: 'Phone Number',
    stateRequired: true,
    stateOptions: ['AL','AK','AZ','CA','CO','CT','FL','GA','IL','MA','MI','NC','NJ','NY','OH','PA','TX','VA','WA'],
    postalPlaceholder: '12345 or 12345-6789',
    phonePlaceholder: '+1 (555) 123-4567',
  },
  JP: {
    code: 'JP',
    locale: 'ja-JP',
    countryLabel: '日本',
    stateLabel: '都道府県',
    cityLabel: '市区町村',
    districtLabel: '地区 / 町名',
    streetLabel: '丁目・番地・号',
    line2Label: '建物名・部屋番号',
    postalLabel: '郵便番号',
    phoneLabel: '電話番号',
    stateRequired: true,
    stateOptions: ['北海道','東京都','神奈川県','愛知県','大阪府','京都府','福岡県','沖縄県'],
    postalPlaceholder: '123-4567',
    phonePlaceholder: '+81 90-1234-5678',
  },
  FR: {
    code: 'FR',
    locale: 'fr-FR',
    countryLabel: 'France',
    stateLabel: 'Region / Departement',
    cityLabel: 'Ville',
    districtLabel: 'Quartier',
    streetLabel: 'Adresse + Numero',
    line2Label: 'Appartement / Batiment',
    postalLabel: 'Code Postal',
    phoneLabel: 'Telephone',
    stateRequired: false,
    stateOptions: [],
    postalPlaceholder: '75001',
    phonePlaceholder: '+33 6 12 34 56 78',
  },
  DEFAULT: {
    code: 'DEFAULT',
    locale: 'en-US',
    countryLabel: 'International',
    stateLabel: 'State / Province / Region',
    cityLabel: 'City',
    districtLabel: 'District / Neighborhood',
    streetLabel: 'Street Address + Number',
    line2Label: 'Address Line 2 / Apartment / Suite',
    postalLabel: 'Postal Code / ZIP',
    phoneLabel: 'Phone Number',
    stateRequired: false,
    stateOptions: [],
    postalPlaceholder: 'Postal code',
    phonePlaceholder: '+00 000000000',
  },
};

const FORM_COPY: Record<LocaleCode, {
  country: string;
  optional: string;
  detect: string;
  detecting: string;
  examples: string;
}> = {
  'pt-BR': {
    country: 'Pais',
    optional: 'opcional',
    detect: 'Detectar pais automaticamente',
    detecting: 'Detectando localizacao...',
    examples: 'Exemplos de preenchimento',
  },
  'en-US': {
    country: 'Country',
    optional: 'optional',
    detect: 'Detect country automatically',
    detecting: 'Detecting location...',
    examples: 'Fill-in examples',
  },
  'ja-JP': {
    country: '国',
    optional: '任意',
    detect: '国を自動検出',
    detecting: '位置情報を検出中...',
    examples: '入力例',
  },
  'fr-FR': {
    country: 'Pays',
    optional: 'optionnel',
    detect: 'Detecter automatiquement le pays',
    detecting: 'Detection de la localisation...',
    examples: 'Exemples de saisie',
  },
};

const COUNTRY_OPTIONS = [
  { code: 'BR', label: 'Brasil' },
  { code: 'US', label: 'United States' },
  { code: 'JP', label: 'Japan' },
  { code: 'FR', label: 'France' },
];

const digitsOnly = (value: string) => value.replace(/\D/g, '');

const getCountryConfig = (countryCode: string): CountryAddressConfig => {
  return COUNTRY_ADDRESS_CONFIG[countryCode] || COUNTRY_ADDRESS_CONFIG.DEFAULT;
};

const formatPostalCode = (countryCode: string, value: string) => {
  if (countryCode === 'BR') {
    const digits = digitsOnly(value).slice(0, 8);
    return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
  }
  if (countryCode === 'US') {
    const digits = digitsOnly(value).slice(0, 9);
    return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
  }
  if (countryCode === 'JP') {
    const digits = digitsOnly(value).slice(0, 7);
    return digits.length > 3 ? `${digits.slice(0, 3)}-${digits.slice(3)}` : digits;
  }
  return value.toUpperCase().replace(/[^0-9A-Z\- ]/g, '').slice(0, 12);
};

const isPostalCodeValid = (countryCode: string, value: string) => {
  if (countryCode === 'BR') return /^\d{5}-\d{3}$/.test(value);
  if (countryCode === 'US') return /^\d{5}(-\d{4})?$/.test(value);
  if (countryCode === 'JP') return /^\d{3}-\d{4}$/.test(value);
  return value.trim().length >= 3;
};

const formatPhoneNumber = (countryCode: string, value: string) => {
  const digits = digitsOnly(value);

  if (countryCode === 'BR') {
    const local = (digits.startsWith('55') ? digits.slice(2) : digits).slice(0, 11);
    if (!local) return '';
    if (local.length <= 2) return `+55 (${local}`;
    if (local.length <= 7) return `+55 (${local.slice(0, 2)}) ${local.slice(2)}`;
    return `+55 (${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }

  if (countryCode === 'US') {
    const local = (digits.startsWith('1') ? digits.slice(1) : digits).slice(0, 10);
    if (!local) return '';
    if (local.length <= 3) return `+1 (${local}`;
    if (local.length <= 6) return `+1 (${local.slice(0, 3)}) ${local.slice(3)}`;
    return `+1 (${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
  }

  if (countryCode === 'JP') {
    const local = (digits.startsWith('81') ? digits.slice(2) : digits).slice(0, 10);
    if (!local) return '';
    if (local.length <= 2) return `+81 ${local}`;
    if (local.length <= 6) return `+81 ${local.slice(0, 2)}-${local.slice(2)}`;
    return `+81 ${local.slice(0, 2)}-${local.slice(2, 6)}-${local.slice(6)}`;
  }

  return digits ? `+${digits.slice(0, 15)}` : '';
};

const isPhoneValid = (countryCode: string, value: string) => {
  const digits = digitsOnly(value);
  if (countryCode === 'BR') {
    const local = digits.startsWith('55') ? digits.slice(2) : digits;
    return local.length >= 10 && local.length <= 11;
  }
  if (countryCode === 'US') {
    const local = digits.startsWith('1') ? digits.slice(1) : digits;
    return local.length === 10;
  }
  if (countryCode === 'JP') {
    const local = digits.startsWith('81') ? digits.slice(2) : digits;
    return local.length >= 9 && local.length <= 10;
  }
  return digits.length >= 8;
};

const detectCountryFromLanguage = () => {
  const lang = (navigator.language || '').toLowerCase();
  if (lang.startsWith('pt')) return 'BR';
  if (lang.startsWith('ja')) return 'JP';
  if (lang.startsWith('fr')) return 'FR';
  return 'US';
};

const AuthPage = () => {
  const [step, setStep] = useState<AuthStep>('welcome');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  // Signup form
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [cep, setCep] = useState('');
  const [cepLoading, setCepLoading] = useState(false);
  const [estado, setEstado] = useState('');
  const [cidade, setCidade] = useState('');
  const [bairro, setBairro] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [pais, setPais] = useState('BR');
  const [telefone, setTelefone] = useState('');
  const [detectingCountry, setDetectingCountry] = useState(false);
  const [dob, setDob] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [over18, setOver18] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [notExcluded, setNotExcluded] = useState(false);
  const [acceptRegulation, setAcceptRegulation] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [signupStep, setSignupStep] = useState(1);
  const totalSignupSteps = 5;

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginCpf, setLoginCpf] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const { signUp, signIn, isLoggedIn } = useAuthStore();

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  // Recovery
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [recoveryTargetLabel, setRecoveryTargetLabel] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);

  // KYC
  const [kycSubStep, setKycSubStep] = useState<KycSubStep>('intro');
  const [kycStatus, setKycStatus] = useState<'pending' | 'analyzing' | 'approved' | 'rejected'>('pending');
  const [docFront, setDocFront] = useState<string | null>(null);
  const [docBack, setDocBack] = useState<string | null>(null);
  const [selfie, setSelfie] = useState<string | null>(null);
  const [livenessStep, setLivenessStep] = useState(0);
  const [livenessProgress, setLivenessProgress] = useState(0);
  const [validationStep, setValidationStep] = useState(0);

  // OTP & 2FA
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(60);
  const [otpCanResend, setOtpCanResend] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<'email' | 'sms' | 'app'>('email');
  const [enableTwoFactor, setEnableTwoFactor] = useState(false);

  // Login rate limiting
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [loginBlockedUntil, setLoginBlockedUntil] = useState<number | null>(null);
  const maxLoginAttempts = 5;
  const loginBlockDuration = 15 * 60 * 1000; // 15 minutos

  // OTP countdown timer
  useEffect(() => {
    if (step !== 'otp') return;
    setOtpTimer(60);
    setOtpCanResend(false);
    const interval = setInterval(() => {
      setOtpTimer(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setOtpCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  // KYC validation pipeline auto-advance
  useEffect(() => {
    if (kycSubStep !== 'validating') return;
    setValidationStep(0);
    const timers = [
      setTimeout(() => setValidationStep(1), 1200),
      setTimeout(() => setValidationStep(2), 2400),
      setTimeout(() => setValidationStep(3), 3400),
      setTimeout(() => setValidationStep(4), 4400),
      setTimeout(() => setValidationStep(5), 5200),
      setTimeout(() => setValidationStep(6), 6000),
      setTimeout(() => setKycSubStep('done'), 6800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [kycSubStep]);

  // Reserved usernames that cannot be used by players
  const reservedUsernames = ['admin', 'usuario', 'test', 'bot', 'moderador', 'suporte'];
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  // Username availability check against reserved names and existing profiles
  const checkUsername = useCallback(async (name: string) => {
    const normalized = name.trim().toLowerCase();
    if (normalized.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setUsernameChecking(true);
    try {
      if (reservedUsernames.includes(normalized)) {
        setUsernameAvailable(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', normalized)
        .limit(1);

      if (error) {
        setUsernameAvailable(null);
        return;
      }

      setUsernameAvailable((data?.length ?? 0) === 0);
    } finally {
      setUsernameChecking(false);
    }
  }, []);

  useEffect(() => {
    if (username.trim().length < 3) {
      setUsernameAvailable(null);
      return;
    }

    const timer = setTimeout(() => {
      void checkUsername(username);
    }, 500);

    return () => clearTimeout(timer);
  }, [username, checkUsername]);

  const detectCountry = useCallback(async () => {
    setDetectingCountry(true);
    try {
      let countryCode: string | null = null;

      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, maximumAge: 120000 });
          });

          const reverseResponse = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
          );
          const reverseData = await reverseResponse.json();
          countryCode = typeof reverseData?.countryCode === 'string' ? reverseData.countryCode : null;
        } catch {
          // Geolocation can be denied on mobile; fallback to IP/language.
        }
      }

      if (!countryCode) {
        try {
          const ipResponse = await fetch('https://ipapi.co/json/');
          const ipData = await ipResponse.json();
          countryCode = typeof ipData?.country_code === 'string' ? ipData.country_code : null;
        } catch {
          // Ignore and use browser language fallback.
        }
      }

      const normalized = (countryCode || detectCountryFromLanguage()).toUpperCase();
      const nextCountry = COUNTRY_ADDRESS_CONFIG[normalized] ? normalized : detectCountryFromLanguage();
      setPais(nextCountry);
    } finally {
      setDetectingCountry(false);
    }
  }, []);

  useEffect(() => {
    void detectCountry();
  }, [detectCountry]);

  // Validation helpers
  const isEmailValid = (e: string) => /^[^\s@]+@[^\s@]{2,}\.[^\s@]{2,}$/.test(e);
  const emailError = email.length > 0 && !isEmailValid(email) ? (
    !email.includes('@') ? 'Falta o @ no e-mail' :
    email.endsWith('@') ? 'Falta o domínio' :
    !email.includes('.') ? 'Domínio inválido' :
    email.endsWith('.') ? 'Domínio incompleto' : 'E-mail inválido'
  ) : null;
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedConfirmEmail = confirmEmail.trim().toLowerCase();
  const confirmEmailError = confirmEmail.length > 0 && !isEmailValid(confirmEmail)
    ? 'E-mail de confirmação inválido'
    : null;
  const emailsMatch = normalizedEmail.length > 0 && normalizedEmail === normalizedConfirmEmail;
  const emailsDoNotMatch = confirmEmail.length > 0 && !confirmEmailError && !emailsMatch;

  const cpfClean = cpf.replace(/\D/g, '');
  const cpfValid = cpfClean.length === 11 && isValidCPF(cpf);

  // Date of birth validation (real date check)
  const dobClean = dob.replace(/\D/g, '');
  const isValidDate = (dateStr: string): boolean => {
    const digits = dateStr.replace(/\D/g, '');
    if (digits.length !== 8) return false;
    const day = parseInt(digits.slice(0, 2));
    const month = parseInt(digits.slice(2, 4));
    const year = parseInt(digits.slice(4, 8));
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > new Date().getFullYear()) return false;
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return false;
    // Must be at least 18 years old
    const today = new Date();
    const age = today.getFullYear() - year - (today.getMonth() < month - 1 || (today.getMonth() === month - 1 && today.getDate() < day) ? 1 : 0);
    if (age < 18) return false;
    return true;
  };
  const dobValid = isValidDate(dob);
  const dobError = dobClean.length === 8 && !dobValid ? (
    (() => {
      const d = parseInt(dobClean.slice(0, 2)), m = parseInt(dobClean.slice(2, 4)), y = parseInt(dobClean.slice(4, 8));
      if (m < 1 || m > 12) return 'Mês inválido';
      if (d < 1 || d > 31) return 'Dia inválido';
      if (y < 1900 || y > new Date().getFullYear()) return 'Ano inválido';
      const date = new Date(y, m - 1, d);
      if (date.getDate() !== d) return 'Data não existe';
      return 'Você deve ter pelo menos 18 anos para continuar!';
    })()
  ) : null;

  const pwStrength = getPasswordStrength(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  const recoveryTrimmed = recoveryIdentifier.trim();
  const recoveryEmailValid = isEmailValid(recoveryTrimmed);
  const recoveryIdentifierValid = recoveryEmailValid;

  const countryConfig = getCountryConfig(pais);
  const formCopy = FORM_COPY[countryConfig.locale];
  const postalValid = isPostalCodeValid(pais, cep);
  const phoneValid = isPhoneValid(pais, telefone);
  const stateRequired = countryConfig.stateRequired;
  const stateValid = !stateRequired || estado.trim().length > 0;
  const cityValid = cidade.trim().length > 0;
  const streetValid = streetAddress.trim().length > 0;

  const usernameValid = username.trim().length >= 3 && usernameAvailable === true;

  // Step validations
  const step1Valid = fullName.trim().length >= 3 && usernameValid && isEmailValid(email) && !confirmEmailError && emailsMatch && cpfValid && dobValid;
  const step2Valid = stateValid && cityValid && streetValid && postalValid && phoneValid;
  const step3Valid = passwordsMatch && getPasswordStrength(password).isStrong;
  const step4Valid = true; // Verificação opcional temporariamente
  const step5Valid = acceptTerms && notExcluded && acceptRegulation;
  const signupValid = step1Valid && step2Valid && step3Valid && step4Valid && step5Valid;
  const currentStepValid = signupStep === 1 ? step1Valid : signupStep === 2 ? step2Valid : signupStep === 3 ? step3Valid : signupStep === 4 ? step4Valid : step5Valid;

  const signupStepLabels = ['Dados Pessoais', 'Endereço', 'Segurança', 'Verificação', 'Termos'];

  const BackButton = forwardRef<HTMLButtonElement, { to: AuthStep }>(({ to }, ref) => (
    <button ref={ref} onClick={() => setStep(to)} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground/70 hover:text-foreground">
      <ArrowLeft size={22} />
    </button>
  ));
  BackButton.displayName = 'BackButton';

  const ValidationIcon = ({ valid }: { valid: boolean }) => (
    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${valid ? 'bg-secondary/20' : 'bg-surface-interactive'}`}>
      {valid ? <Check size={12} className="text-secondary" /> : <X size={12} className="text-muted-foreground/40" />}
    </div>
  );

  const handleOtpInput = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...otpCode];
    newCode[index] = value.slice(-1);
    setOtpCode(newCode);
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  }, [otpCode]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AnimatePresence mode="wait">
        {/* WELCOME */}
        {step === 'welcome' && (
          <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
            <div className="relative h-[45vh]">
              <img src={heroBanner} alt="Estádio" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
            </div>
            <div className="flex-1 px-6 pt-6 pb-8 flex flex-col justify-between">
              <div className="space-y-4">
                <Logo size="md" className="mb-2" />
                <h1 className="font-display text-2xl font-extrabold leading-tight">
                 É muito mais que bet!<br />
                </h1>
                <p className="text-sm font-body text-muted-foreground">
                </p>
              </div>
              <div className="space-y-3 mt-8">
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep('signup')}
                  className="w-full bg-primary text-primary-foreground font-display font-bold text-base py-3.5 rounded-xl min-h-[44px] hover:brightness-110 transition-all">
                  Criar Conta
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep('login')}
                  className="w-full bg-surface-interactive text-foreground font-display font-bold text-base py-3.5 rounded-xl min-h-[44px] hover:bg-muted transition-colors">
                  Login
                </motion.button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/')}
                  className="w-full text-muted-foreground font-body text-sm py-3 rounded-xl min-h-[44px] flex items-center justify-center gap-2 hover:text-foreground transition-colors">
                  <UserCircle size={18} />
                  Continuar como Visitante
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* LOGIN */}
        {step === 'login' && (
          <motion.div key="login" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="flex-1 px-6 pt-4 pb-8">
            <BackButton to="welcome" />
            <div className="mt-4 space-y-6">
              <div>
                <h2 className="font-display text-2xl font-extrabold">Entrar</h2>
                <p className="text-sm font-body text-muted-foreground mt-1">Bem-vindo de volta!</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-body font-medium text-muted-foreground">E-mail, usuário ou CPF</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type="text" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="E-mail, @usuario ou CPF"
                      className="w-full bg-surface-interactive rounded-xl py-3 pl-11 pr-4 text-sm font-body text-foreground outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground min-h-[44px]" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-body font-medium text-muted-foreground">Senha</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input type={showPassword ? 'text' : 'password'} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Sua senha"
                      className="w-full bg-surface-interactive rounded-xl py-3 pl-11 pr-12 text-sm font-body text-foreground outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground min-h-[44px]" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button onClick={() => setStep('recovery')} className="text-xs font-body text-primary font-semibold min-h-[44px]">
                  Esqueceu a senha?
                </button>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-body text-muted-foreground hover:text-foreground transition-colors">
                  <input type="checkbox" checked={enableTwoFactor} onChange={(e) => setEnableTwoFactor(e.target.checked)} className="w-4 h-4 rounded" />
                  Ativar 2FA
                </label>
              </div>

              {enableTwoFactor && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2 p-3 bg-surface-card rounded-xl">
                  <p className="text-xs font-body font-semibold text-foreground">Método de Verificação:</p>
                  <div className="flex gap-2">
                    {(['email', 'sms', 'app'] as const).map((method) => (
                      <button
                        key={method}
                        onClick={() => setTwoFactorMethod(method)}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-body font-semibold transition-colors ${
                          twoFactorMethod === method
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-surface-interactive text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {method === 'email' ? 'E-mail' : method === 'sms' ? 'SMS' : 'App'}
                      </button>
                    ))}
                  </div>
                  <p className="text-[0.7rem] text-muted-foreground">
                    {twoFactorMethod === 'email' && 'Código será enviado para seu e-mail'}
                    {twoFactorMethod === 'sms' && 'Código será enviado via SMS'}
                    {twoFactorMethod === 'app' && 'Use seu autenticador (Google Authenticator, Authy, etc.)'}
                  </p>
                </motion.div>
              )}

              {authError && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-[0.75rem] text-destructive font-body bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </motion.div>
              )}

              <motion.button whileTap={{ scale: 0.97 }} disabled={authLoading || (loginBlockedUntil !== null && loginBlockedUntil > Date.now())}
                onClick={async () => {
                  // Rate limiting check
                  if (loginBlockedUntil && loginBlockedUntil > Date.now()) {
                    const minutesLeft = Math.ceil((loginBlockedUntil - Date.now()) / 60000);
                    setAuthError(`Muitas tentativas. Tente novamente em ${minutesLeft} minuto(s).`);
                    return;
                  }

                  setAuthError(null);
                  setAuthLoading(true);
                  const { error } = await signIn(loginEmail, loginPassword);
                  setAuthLoading(false);
                  
                  if (error) {
                    // Increment login attempts
                    const newAttempts = loginAttempts + 1;
                    setLoginAttempts(newAttempts);
                    
                    // Apply temporary block after max attempts
                    if (newAttempts >= maxLoginAttempts) {
                      setLoginBlockedUntil(Date.now() + loginBlockDuration);
                      setAuthError(`Muitas tentativas de login falhadas. Tente novamente em 15 minutos por segurança.`);
                    } else {
                      const errMap: Record<string, string> = {
                        'Invalid login credentials': `E-mail ou senha incorretos. ${maxLoginAttempts - newAttempts} tentativa(s) restante(s).`,
                        'Email not confirmed': 'E-mail ainda não confirmado. Verifique sua caixa de entrada.',
                        'User already registered': 'Este e-mail já está cadastrado',
                        'Signup requires a valid password': 'A senha informada é inválida',
                        'Password should be at least 6 characters': 'A senha deve ter pelo menos 8 caracteres',
                        'For security purposes, you can only request this once every 60 seconds': 'Por segurança, aguarde 60 segundos antes de tentar novamente',
                        'Too many requests': 'Muitas tentativas. Aguarde um momento.',
                      };
                      setAuthError(errMap[error] || error);
                    }
                  } else {
                    setLoginAttempts(0);
                    setLoginBlockedUntil(null);
                    if (enableTwoFactor) {
                      setStep('otp');
                    } else {
                      navigate('/');
                    }
                  }
                }}
                className="w-full bg-primary text-primary-foreground font-display font-bold text-base py-3.5 rounded-xl min-h-[44px] hover:brightness-110 transition-all disabled:opacity-50">
                {authLoading ? 'Verificando...' : 'Entrar'}
              </motion.button>

              {/* Biometria */}
              <button className="w-full bg-surface-card text-foreground font-body font-semibold text-sm py-3 rounded-xl min-h-[44px] flex items-center justify-center gap-2 hover:bg-surface-interactive transition-colors">
                <Fingerprint size={20} className="text-primary" />
                Entrar com Face ID / Biometria
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full bg-surface-interactive h-px" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-background px-3 text-xs text-muted-foreground font-body">ou</span>
                </div>
              </div>

              <button
                onClick={async () => {
                  setAuthError(null);
                  setAuthLoading(true);
                  const result = await lovable.auth.signInWithOAuth('google', {
                    redirect_uri: window.location.origin,
                  });
                  if (result?.error) {
                    setAuthError('Erro ao entrar com Google. Tente novamente.');
                  }
                  setAuthLoading(false);
                }}
                className="w-full bg-surface-card text-foreground font-body font-semibold text-sm py-3 rounded-xl min-h-[44px] flex items-center justify-center gap-2 hover:bg-surface-interactive transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Entrar com Google
              </button>

              <div className="text-center pt-2">
                <p className="text-xs font-body text-muted-foreground">
                  Não tem conta?{' '}
                  <button
                    onClick={() => setStep('signup')}
                    className="text-primary font-semibold hover:text-primary/80 transition-colors"
                  >
                    Criar conta
                  </button>
                </p>
              </div>

            </div>
          </motion.div>
        )}

        {/* SIGNUP */}
        {step === 'signup' && (
          <motion.div key="signup" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="flex-1 px-6 pt-4 pb-8 overflow-y-auto">
            <button onClick={() => { if (signupStep > 1) setSignupStep(signupStep - 1); else setStep('welcome'); }} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground/70 hover:text-foreground">
              <ArrowLeft size={22} />
            </button>

            <div className="mt-4 space-y-5">
              <div>
                <h2 className="font-display text-2xl font-extrabold">Criar conta</h2>
                <p className="text-sm font-body text-muted-foreground mt-1">
                  Etapa {signupStep} de {totalSignupSteps} — {signupStepLabels[signupStep - 1]}
                </p>
              </div>

              {/* Progress Stepper */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalSignupSteps }, (_, i) => i + 1).map((s) => (
                  <div key={s} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="w-full flex items-center">
                      <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        s < signupStep ? 'bg-secondary' : s === signupStep ? 'bg-primary' : 'bg-surface-interactive'
                      }`} />
                    </div>
                    <span className={`text-[0.55rem] font-body font-medium transition-colors ${
                      s <= signupStep ? 'text-foreground' : 'text-muted-foreground/50'
                    }`}>
                      {signupStepLabels[s - 1]}
                    </span>
                  </div>
                ))}
              </div>

              {/* Google Sign Up */}
              <button
                onClick={async () => {
                  setAuthError(null);
                  setAuthLoading(true);
                  const result = await lovable.auth.signInWithOAuth('google', {
                    redirect_uri: window.location.origin,
                  });
                  if (result?.error) {
                    setAuthError('Erro ao entrar com Google. Tente novamente.');
                  }
                  setAuthLoading(false);
                }}
                className="w-full bg-surface-card text-foreground font-body font-semibold text-sm py-3 rounded-xl min-h-[44px] flex items-center justify-center gap-2 hover:bg-surface-interactive transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Registrar com Google
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full bg-surface-interactive h-px" /></div>
                <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground font-body">ou preencha manualmente</span></div>
              </div>

              <AnimatePresence mode="wait">
                {/* STEP 1: Dados Pessoais */}
                {signupStep === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-body font-medium text-muted-foreground">Nome completo</label>
                      <div className="relative">
                        <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="João da Silva"
                          className="w-full bg-surface-interactive rounded-xl py-3 pl-11 pr-10 text-sm font-body text-foreground outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground min-h-[44px]" />
                        {fullName.length > 0 && <div className="absolute right-3 top-1/2 -translate-y-1/2"><ValidationIcon valid={fullName.trim().length >= 3} /></div>}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-body font-medium text-muted-foreground">Nome de usuário</label>
                      <div className="relative">
                        <AtSign size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input type="text" value={username} onChange={(e) => { const v = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''); setUsername(v); }} placeholder="joaosilva"
                          className="w-full bg-surface-interactive rounded-xl py-3 pl-11 pr-10 text-sm font-body text-foreground outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground min-h-[44px]" />
                        {username.length >= 3 && <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {usernameChecking ? (
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <ValidationIcon valid={usernameAvailable === true} />
                          )}
                        </div>}
                      </div>
                      {username.length >= 3 && !usernameChecking && usernameAvailable === false && (
                        <p className="text-[0.65rem] text-destructive font-body">Nome de usuário já está em uso</p>
                      )}
                      {username.length >= 3 && !usernameChecking && usernameAvailable === true && (
                        <p className="text-[0.65rem] text-secondary font-body">Disponível</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-body font-medium text-muted-foreground">E-mail</label>
                      <div className="relative">
                        <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com"
                          className="w-full bg-surface-interactive rounded-xl py-3 pl-11 pr-10 text-sm font-body text-foreground outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground min-h-[44px]" />
                        {email.length > 0 && <div className="absolute right-3 top-1/2 -translate-y-1/2"><ValidationIcon valid={isEmailValid(email)} /></div>}
                      </div>
                      {emailError && <p className="text-[0.65rem] text-destructive font-body">{emailError}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-body font-medium text-muted-foreground">Confirmar e-mail</label>
                      <div className="relative">
                        <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input type="email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} placeholder="repita seu e-mail"
                          className="w-full bg-surface-interactive rounded-xl py-3 pl-11 pr-10 text-sm font-body text-foreground outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground min-h-[44px]" />
                        {confirmEmail.length > 0 && <div className="absolute right-3 top-1/2 -translate-y-1/2"><ValidationIcon valid={!confirmEmailError && emailsMatch} /></div>}
                      </div>
                      {confirmEmailError && <p className="text-[0.65rem] text-destructive font-body">{confirmEmailError}</p>}
                      {emailsDoNotMatch && <p className="text-[0.65rem] text-destructive font-body">Os e-mails não conferem</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-body font-medium text-muted-foreground">CPF</label>
                      <div className="relative">
                        <CreditCard size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input type="text" value={cpf} onChange={(e) => setCpf(maskCPF(e.target.value))} placeholder="000.000.000-00"
                          className="w-full bg-surface-interactive rounded-xl py-3 pl-11 pr-10 text-sm font-body text-foreground outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground min-h-[44px]" />
                        {cpfClean.length === 11 && <div className="absolute right-3 top-1/2 -translate-y-1/2"><ValidationIcon valid={cpfValid} /></div>}
                      </div>
              {cpfClean.length === 11 && !cpfValid && <p className="text-[0.65rem] text-destructive font-body">CPF inválido</p>}
                      {cpfValid && (
                        <div className="flex items-center gap-1.5 bg-secondary/10 rounded-lg px-3 py-1.5">
                          <ShieldCheck size={13} className="text-secondary" />
                          <span className="text-[0.65rem] text-secondary font-body font-semibold">CPF válido e regular</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-body font-medium text-muted-foreground">Data de nascimento</label>
                      <div className="relative">
                        <Calendar size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input type="text" value={dob} onChange={(e) => setDob(maskDate(e.target.value))} placeholder="DD/MM/AAAA"
                          className="w-full bg-surface-interactive rounded-xl py-3 pl-11 pr-10 text-sm font-body text-foreground outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground min-h-[44px]" />
                        {dobClean.length === 8 && <div className="absolute right-3 top-1/2 -translate-y-1/2"><ValidationIcon valid={dobValid} /></div>}
                      </div>
                      {dobError && <p className="text-[0.65rem] text-destructive font-body">{dobError}</p>}
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: Endereço e Contato */}
                {signupStep === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-xs font-body font-medium text-muted-foreground">{formCopy.country}</label>
                        <button
                          type="button"
                          onClick={() => void detectCountry()}
                          disabled={detectingCountry}
                          className="text-[0.7rem] font-body font-semibold text-primary min-h-[28px] flex items-center gap-1 disabled:opacity-60"
                        >
                          <RefreshCw size={12} className={detectingCountry ? 'animate-spin' : ''} />
                          {detectingCountry ? formCopy.detecting : formCopy.detect}
                        </button>
                      </div>
                      <div className="relative">
                        <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <select value={pais} onChange={(e) => setPais(e.target.value)}
                          className="w-full bg-surface-interactive rounded-xl py-3 pl-11 pr-4 text-sm font-body text-foreground outline-none focus:ring-1 focus:ring-primary min-h-[44px] appearance-none">
                          {COUNTRY_OPTIONS.map((country) => (
                            <option key={country.code} value={country.code}>{country.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-body font-medium text-muted-foreground">
                          {countryConfig.stateLabel}
                          {stateRequired ? '' : ` (${formCopy.optional})`}
                        </label>
                        {countryConfig.stateOptions.length > 0 ? (
                          <select value={estado} onChange={(e) => setEstado(e.target.value)}
                            className="w-full bg-surface-interactive rounded-xl py-3 px-4 text-sm font-body text-foreground outline-none focus:ring-1 focus:ring-primary min-h-[44px] appearance-none">
                            <option value="" className="bg-background">-</option>
                            {countryConfig.stateOptions.map((region) => (
                              <option key={region} value={region} className="bg-background">{region}</option>
                            ))}
                          </select>
                        ) : (
                          <input type="text" value={estado} onChange={(e) => setEstado(e.target.value)}
                            className="w-full bg-surface-interactive rounded-xl py-3 px-4 text-sm font-body text-foreground outline-none focus:ring-1 focus:ring-primary min-h-[44px]" />
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-body font-medium text-muted-foreground">{countryConfig.cityLabel}</label>
                        <input type="text" value={cidade} onChange={(e) => setCidade(e.target.value)}
                          className="w-full bg-surface-interactive rounded-xl py-3 px-4 text-sm font-body text-foreground outline-none focus:ring-1 focus:ring-primary min-h-[44px]" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-body font-medium text-muted-foreground">{countryConfig.districtLabel} ({formCopy.optional})</label>
                      <input type="text" value={bairro} onChange={(e) => setBairro(e.target.value)}
                        className="w-full bg-surface-interactive rounded-xl py-3 px-4 text-sm font-body text-foreground outline-none focus:ring-1 focus:ring-primary min-h-[44px]" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-body font-medium text-muted-foreground">{countryConfig.streetLabel}</label>
                      <input type="text" value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)}
                        className="w-full bg-surface-interactive rounded-xl py-3 px-4 text-sm font-body text-foreground outline-none focus:ring-1 focus:ring-primary min-h-[44px]" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-body font-medium text-muted-foreground">{countryConfig.line2Label} ({formCopy.optional})</label>
                      <input type="text" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)}
                        className="w-full bg-surface-interactive rounded-xl py-3 px-4 text-sm font-body text-foreground outline-none focus:ring-1 focus:ring-primary min-h-[44px]" />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-body font-medium text-muted-foreground">{countryConfig.postalLabel}</label>
                      <div className="relative">
                        <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input type="text" value={cep} onChange={(e) => {
                          const masked = formatPostalCode(pais, e.target.value);
                          setCep(masked);

                          if (pais === 'BR' && /^\d{5}-\d{3}$/.test(masked)) {
                            setCepLoading(true);
                            fetch(`https://viacep.com.br/ws/${masked.replace(/\D/g, '')}/json/`)
                              .then(r => r.json())
                              .then(data => {
                                if (!data.erro) {
                                  setEstado(data.uf || '');
                                  setCidade(data.localidade || '');
                                  setBairro(data.bairro || '');
                                  setStreetAddress(data.logradouro || streetAddress);
                                }
                              })
                              .catch(() => {})
                              .finally(() => setCepLoading(false));
                          }
                        }} placeholder={countryConfig.postalPlaceholder}
                          className="w-full bg-surface-interactive rounded-xl py-3 pl-11 pr-10 text-sm font-body text-foreground outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground min-h-[44px]" />
                        {cepLoading && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
                      </div>
                      {cep.length > 0 && !postalValid && (
                        <p className="text-[0.65rem] text-destructive font-body">{countryConfig.postalLabel} invalido</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-body font-medium text-muted-foreground">{countryConfig.phoneLabel}</label>
                      <div className="relative">
                        <Smartphone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input type="tel" value={telefone} onChange={(e) => {
                          setTelefone(formatPhoneNumber(pais, e.target.value));
                        }} placeholder={countryConfig.phonePlaceholder}
                          className="w-full bg-surface-interactive rounded-xl py-3 pl-11 pr-4 text-sm font-body text-foreground outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground min-h-[44px]" />
                      </div>
                      {telefone.length > 0 && !phoneValid && (
                        <p className="text-[0.65rem] text-destructive font-body">{countryConfig.phoneLabel} invalido</p>
                      )}
                    </div>

                    <div className="bg-surface-card rounded-xl p-3 space-y-2">
                      <p className="text-[0.72rem] font-body font-semibold text-primary">{formCopy.examples}</p>
                      <div className="space-y-2 text-[0.68rem] font-body text-muted-foreground">
                        <p><span className="text-foreground font-semibold">Brasil:</span> Rua: Av. Paulista 1578 | Bairro: Bela Vista | Cidade: Sao Paulo | Estado: SP | CEP: 01310-200 | Tel: +55 (11) 99876-5432</p>
                        <p><span className="text-foreground font-semibold">United States:</span> Street: 350 5th Ave | City: New York | State: NY | ZIP: 10118 | Phone: +1 (212) 736-3100</p>
                        <p><span className="text-foreground font-semibold">日本:</span> 住所: 渋谷2-24-12 | 市区町村: 渋谷区 | 都道府県: 東京都 | 郵便番号: 150-0002 | 電話: +81 90-1234-5678</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: Senha e Segurança */}
                {signupStep === 3 && (
                  <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-body font-medium text-muted-foreground">Senha</label>
                      <div className="relative">
                        <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres"
                          className="w-full bg-surface-interactive rounded-xl py-3 pl-11 pr-12 text-sm font-body text-foreground outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground min-h-[44px]" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground">
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {password.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= pwStrength.level ? pwStrength.color : 'bg-surface-interactive'}`} />
                            ))}
                          </div>
                          <p className={`text-[0.65rem] font-body font-semibold ${pwStrength.isStrong ? 'text-secondary' : 'text-destructive'}`}>
                            {pwStrength.isStrong ? <><Check size={14} className="inline" /> Senha Forte</> : `Senha ${pwStrength.label}`}
                          </p>
                          <div className="text-[0.6rem] font-body text-muted-foreground space-y-0.5">
                            <p className={getPasswordRequirements(password).minLength ? 'text-secondary' : 'text-destructive'}>
                              {getPasswordRequirements(password).minLength ? <Check size={14} className="inline text-secondary" /> : <X size={14} className="inline text-destructive" />} Mínimo 8 caracteres
                            </p>
                            <p className={getPasswordRequirements(password).hasUppercase ? 'text-secondary' : 'text-destructive'}>
                              {getPasswordRequirements(password).hasUppercase ? <Check size={14} className="inline text-secondary" /> : <X size={14} className="inline text-destructive" />} Uma letra maiúscula (A-Z)
                            </p>
                            <p className={getPasswordRequirements(password).hasNumber ? 'text-secondary' : 'text-destructive'}>
                              {getPasswordRequirements(password).hasNumber ? <Check size={14} className="inline text-secondary" /> : <X size={14} className="inline text-destructive" />} Um número (0-9)
                            </p>
                            <p className={getPasswordRequirements(password).hasSymbol ? 'text-secondary' : 'text-destructive'}>
                              {getPasswordRequirements(password).hasSymbol ? <Check size={14} className="inline text-secondary" /> : <X size={14} className="inline text-destructive" />} Um símbolo (!@#$%^&*)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-body font-medium text-muted-foreground">Confirmar senha</label>
                      <div className="relative">
                        <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a senha"
                          className="w-full bg-surface-interactive rounded-xl py-3 pl-11 pr-12 text-sm font-body text-foreground outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground min-h-[44px]" />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground">
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {confirmPassword.length > 0 && !passwordsMatch && (
                        <p className="text-[0.65rem] text-destructive font-body">As senhas não conferem</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-body font-medium text-muted-foreground">Código promocional (opcional)</label>
                      <div className="relative">
                        <Gift size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="Ex: SELECAO500"
                          className="w-full bg-surface-interactive rounded-xl py-3 pl-11 pr-4 text-sm font-body text-foreground outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground min-h-[44px]" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: Verificação (KYC) */}
                {signupStep === 4 && (
                  <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div className="bg-surface-card rounded-xl p-4 flex items-start gap-3">
                      <ShieldCheck size={24} className="text-primary flex-shrink-0" />
                      <div>
                        <p className="text-sm font-display font-bold text-primary">Verificação de Identidade</p>
                        <p className="text-xs font-body text-muted-foreground mt-0.5">
                          Realizamos KYC para garantir sua segurança e conformidade legal
                        </p>
                        <p className="text-[0.7rem] font-body text-primary mt-1">Você pode pular esta etapa por enquanto.</p>
                      </div>
                    </div>

                    {/* Document Upload */}
                    <div className="space-y-3">
                      <p className="text-xs font-body font-semibold text-foreground">1. Upload de Documento</p>
                      <div className="flex gap-2">
                        <label className="flex-1 relative cursor-pointer">
                          <input type="file" accept="image/*" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => setDocFront(event.target?.result as string);
                              reader.readAsDataURL(file);
                            }
                          }} className="hidden" />
                          <div className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-colors ${
                            docFront ? 'border-primary bg-primary/5' : 'border-surface-interactive hover:border-primary/50'
                          } min-h-[100px]`}>
                            {docFront ? (
                              <>
                                <Check size={24} className="text-primary" />
                                <p className="text-xs font-body font-semibold text-primary">Frente do RG/CNH</p>
                              </>
                            ) : (
                              <>
                                <Upload size={20} className="text-muted-foreground" />
                                <p className="text-xs font-body text-muted-foreground text-center">Frente do RG/CNH</p>
                              </>
                            )}
                          </div>
                        </label>
                        <label className="flex-1 relative cursor-pointer">
                          <input type="file" accept="image/*" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => setDocBack(event.target?.result as string);
                              reader.readAsDataURL(file);
                            }
                          }} className="hidden" />
                          <div className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-colors ${
                            docBack ? 'border-primary bg-primary/5' : 'border-surface-interactive hover:border-primary/50'
                          } min-h-[100px]`}>
                            {docBack ? (
                              <>
                                <Check size={24} className="text-primary" />
                                <p className="text-xs font-body font-semibold text-primary">Verso do RG/CNH</p>
                              </>
                            ) : (
                              <>
                                <Upload size={20} className="text-muted-foreground" />
                                <p className="text-xs font-body text-muted-foreground text-center">Verso do RG/CNH</p>
                              </>
                            )}
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Selfie Upload */}
                    <div className="space-y-3">
                      <p className="text-xs font-body font-semibold text-foreground">2. Validação Facial (Selfie)</p>
                      <label className="relative cursor-pointer block">
                        <input type="file" accept="image/*" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => setSelfie(event.target?.result as string);
                            reader.readAsDataURL(file);
                          }
                        }} className="hidden" />
                        <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-colors ${
                          selfie ? 'border-primary bg-primary/5' : 'border-surface-interactive hover:border-primary/50'
                        }`}>
                          {selfie ? (
                            <>
                              <Check size={28} className="text-primary" />
                              <p className="text-xs font-body font-semibold text-primary text-center">Selfie capturada</p>
                              <p className="text-[0.7rem] font-body text-muted-foreground">Validação facial confirmada</p>
                            </>
                          ) : (
                            <>
                              <Camera size={28} className="text-muted-foreground" />
                              <p className="text-xs font-body font-semibold text-foreground text-center">Tire uma Selfie</p>
                              <p className="text-[0.7rem] font-body text-muted-foreground">Garanta que seu rosto está visível</p>
                            </>
                          )}
                        </div>
                      </label>
                    </div>

                    {/* Age Confirmation */}
                    <div className="space-y-3 pt-2">
                      <button onClick={() => setOver18(!over18)} className="flex items-start gap-3 min-h-[44px] w-full text-left">
                        <div className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${over18 ? 'bg-primary' : 'bg-surface-interactive'}`}>
                          {over18 && <Check size={12} className="text-primary-foreground" />}
                        </div>
                        <span className="text-xs font-body text-foreground/80">
                          Confirmo que tenho 18 anos ou mais
                        </span>
                      </button>
                    </div>

                    {/* Skip Verification Option */}
                    <div className="flex justify-center pt-4">
                      <button
                        onClick={() => setSignupStep(signupStep + 1)}
                        className="text-xs font-body text-primary hover:text-primary/80 transition-colors underline">
                        Pular por enquanto
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 5: Termos e Condições */}
                {signupStep === 5 && (
                  <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                    <div className="bg-surface-card rounded-xl p-4 flex items-start gap-3">
                      <Gift size={24} className="text-primary flex-shrink-0" />
                      <div>
                        <p className="text-sm font-display font-bold text-primary">Bônus de Boas-Vindas</p>
                        <p className="text-xs font-body text-muted-foreground mt-0.5">
                          Ganhe até R$ 500 em bônus no seu primeiro depósito!
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">

                      <button onClick={() => setAcceptTerms(!acceptTerms)} className="flex items-start gap-3 min-h-[44px] w-full text-left">
                        <div className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${acceptTerms ? 'bg-primary' : 'bg-surface-interactive'}`}>
                          {acceptTerms && <Check size={12} className="text-primary-foreground" />}
                        </div>
                        <span className="text-xs font-body text-foreground/80">
                          Li e aceito os <span className="text-primary font-semibold">Termos e Condições de Uso</span>, a <span className="text-primary font-semibold">Política de Privacidade</span> e as <span className="text-primary font-semibold">Regras de Apostas</span> da Esportes da Sorte. Estou ciente de que esta plataforma é regulamentada e monitorada pela Secretaria de Prêmios e Apostas do Ministério da Fazenda (SPA/MF).
                        </span>
                      </button>

                      <button onClick={() => setNotExcluded(!notExcluded)} className="flex items-start gap-3 min-h-[44px] w-full text-left">
                        <div className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${notExcluded ? 'bg-primary' : 'bg-surface-interactive'}`}>
                          {notExcluded && <Check size={12} className="text-primary-foreground" />}
                        </div>
                        <span className="text-xs font-body text-foreground/80">
                          Confirmo e garanto que não estou incluído em nenhuma lista de autoexclusão, lista de sanções nacionais ou internacionais, e que meus recursos não são provenientes de atividades ilícitas, nos termos da Lei Nº 9.613/1998 (Lei de Lavagem de Dinheiro).
                        </span>
                      </button>

                      <button onClick={() => setAcceptRegulation(!acceptRegulation)} className="flex items-start gap-3 min-h-[44px] w-full text-left">
                        <div className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${acceptRegulation ? 'bg-primary' : 'bg-surface-interactive'}`}>
                          {acceptRegulation && <Check size={12} className="text-primary-foreground" />}
                        </div>
                        <span className="text-xs font-body text-foreground/80">
                          Autorizo a Esportes da Sorte a realizar a verificação de minha identidade (KYC) e a compartilhar meus dados cadastrais com a Secretaria de Prêmios e Apostas (SPA/MF) e demais órgãos reguladores, conforme exigido pela Lei Nº 14.790/2023 e regulamentações vigentes.
                        </span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {authError && (
                <p className="text-[0.75rem] text-destructive font-body bg-destructive/10 rounded-lg p-3">{authError}</p>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-2">
                {signupStep > 1 && (
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setSignupStep(signupStep - 1)}
                    className="flex-1 bg-surface-interactive text-foreground font-display font-bold text-sm py-3.5 rounded-xl min-h-[44px] hover:bg-muted transition-colors">
                    Voltar
                  </motion.button>
                )}
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={async () => {
                    if (signupStep < totalSignupSteps) {
                      setSignupStep(signupStep + 1);
                    } else {
                      if (!usernameValid) {
                        setAuthError('Nome de usuário indisponível. Escolha outro e tente novamente.');
                        return;
                      }

                      setAuthError(null);
                      setAuthLoading(true);
                      const { error } = await signUp(email, password, {
                        full_name: fullName,
                        username,
                        cpf: cpf.replace(/\D/g, ''),
                        phone: telefone,
                        country: pais,
                        state: estado,
                        city: cidade,
                        district: bairro,
                        street_address: streetAddress,
                        address_line_2: addressLine2,
                        postal_code: cep,
                      });
                      setAuthLoading(false);
                      if (error) {
                        const errMap: Record<string, string> = {
                          'User already registered': 'Este e-mail já está cadastrado',
                          'Signup requires a valid password': 'A senha informada é inválida',
                          'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
                          'Too many requests': 'Muitas tentativas. Aguarde um momento.',
                          'For security purposes, you can only request this once every 60 seconds': 'Por segurança, aguarde 60 segundos antes de tentar novamente',
                          'Database error saving new user': 'Nao foi possivel criar a conta agora. Se o nome de usuario ja existir, escolha outro e tente novamente.',
                        };
                        setAuthError(errMap[error] || error);
                      } else {
                        // Skip KYC during signup and go directly to success
                        setStep('success');
                      }
                    }
                  }}
                  disabled={!currentStepValid || authLoading}
                  className={`flex-1 font-display font-bold text-sm py-3.5 rounded-xl min-h-[44px] transition-all ${
                    currentStepValid && !authLoading
                      ? 'bg-primary text-primary-foreground hover:brightness-110'
                      : 'bg-surface-interactive text-muted-foreground cursor-not-allowed'
                  }`}>
                  {authLoading ? 'Cadastrando...' : signupStep < totalSignupSteps ? 'Próximo' : 'Cadastrar'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* KYC — Immersive Pipeline */}
        {step === 'kyc' && (
          <motion.div key="kyc" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="flex-1 flex flex-col pb-8 overflow-y-auto">
            <AnimatePresence mode="wait">

              {/* KYC INTRO */}
              {kycSubStep === 'intro' && (
                <motion.div key="kyc-intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -30 }} className="flex-1 px-6 pt-4">
                  <BackButton to="signup" />
                  <div className="mt-4 space-y-5">
                    <div className="flex items-start gap-3">
                      <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}>
                        <ShieldCheck size={32} className="text-primary" />
                      </motion.div>
                      <div>
                        <h2 className="font-display text-xl font-extrabold">Verificação de Segurança</h2>
                        <p className="text-xs font-body text-muted-foreground mt-1">
                          Protegemos seu dinheiro com 5 camadas de segurança. É rápido e seguro!
                        </p>
                      </div>
                    </div>

                    {/* Pipeline steps preview */}
                    <div className="space-y-2.5">
                      {[
                        { icon: CreditCard, title: 'Consulta CPF', desc: 'Cruzamento com a Receita Federal em tempo real', color: 'text-primary', bg: 'bg-primary/15', done: true },
                        { icon: FileText, title: 'Captura de Documento', desc: 'RG ou CNH com bordas inteligentes e OCR automático', color: 'text-primary', bg: 'bg-primary/15', done: false },
                        { icon: Camera, title: 'Liveness Check', desc: 'Prova de vida: mova o rosto para confirmar identidade', color: 'text-secondary', bg: 'bg-secondary/15', done: false },
                        { icon: Scan, title: 'Face Match & Anti-Deepfake', desc: 'Comparação biométrica e análise de manipulação por IA', color: 'text-secondary', bg: 'bg-secondary/15', done: false },
                        { icon: ShieldCheck, title: 'PLD Anti-Lavagem', desc: 'Só aceitamos depósitos de contas em seu nome', color: 'text-primary', bg: 'bg-primary/15', done: false },
                      ].map((item, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                          className="bg-surface-card rounded-xl p-3 flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${item.bg} flex items-center justify-center flex-shrink-0`}>
                            {item.done ? <Check size={16} className="text-secondary" /> : <item.icon size={16} className={item.color} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[0.72rem] font-body font-bold text-foreground">{item.title}</span>
                              {item.done && <span className="text-[0.55rem] font-body font-semibold text-secondary bg-secondary/10 px-1.5 py-0.5 rounded-full flex items-center gap-1"><Check size={10} /> Verificado</span>}
                            </div>
                            <p className="text-[0.6rem] font-body text-muted-foreground leading-tight mt-0.5">{item.desc}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="bg-secondary/10 rounded-xl p-3 flex items-start gap-2.5">
                      <ShieldCheck size={16} className="text-secondary flex-shrink-0 mt-0.5" />
                      <p className="text-[0.65rem] font-body text-secondary leading-snug">
                        <strong>Por sua segurança:</strong> esse rigor técnico garante que seu dinheiro e seus prêmios estejam sempre protegidos.
                      </p>
                    </div>

                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setKycSubStep('doc-front')}
                      className="w-full bg-primary text-primary-foreground font-display font-bold text-base py-3.5 rounded-xl min-h-[44px] hover:brightness-110 transition-all">
                      Iniciar Verificação
                    </motion.button>

                    <button onClick={() => setStep('success')} className="w-full text-center text-xs text-muted-foreground font-body min-h-[44px]">
                      Pular por agora
                    </button>
                  </div>
                </motion.div>
              )}

              {/* DOC FRONT — Smart Borders */}
              {kycSubStep === 'doc-front' && (
                <motion.div key="kyc-doc-front" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="flex-1 px-6 pt-4">
                  <button onClick={() => setKycSubStep('intro')} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground/70 hover:text-foreground">
                    <ArrowLeft size={22} />
                  </button>
                  <div className="mt-2 space-y-5">
                    <div className="text-center">
                      <h2 className="font-display text-lg font-extrabold">Frente do Documento</h2>
                      <p className="text-xs font-body text-muted-foreground mt-1">Posicione seu RG ou CNH dentro da área</p>
                    </div>

                    {/* Document capture area with smart borders */}
                    <div className="relative mx-auto w-full max-w-[320px] aspect-[1.6/1] bg-surface-card rounded-2xl overflow-hidden flex items-center justify-center">
                      {/* Animated corner borders */}
                      <motion.div className="absolute inset-3 pointer-events-none" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />
                      </motion.div>

                      {docFront ? (
                        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-2">
                          <div className="w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center">
                            <Check size={28} className="text-secondary" />
                          </div>
                          <span className="text-xs font-body font-semibold text-secondary">Documento capturado!</span>
                        </motion.div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <FileText size={32} className="text-primary/40" />
                          <span className="text-[0.65rem] font-body">Posicione aqui</span>
                        </div>
                      )}

                      {/* Scanning line animation */}
                      {!docFront && (
                        <motion.div className="absolute left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                          animate={{ top: ['15%', '85%', '15%'] }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      )}
                    </div>

                    <div className="flex gap-2">
                      <motion.button whileTap={{ scale: 0.97 }} onClick={() => setDocFront('doc-front.jpg')}
                        className="flex-1 bg-primary text-primary-foreground font-display font-bold text-sm py-3 rounded-xl min-h-[44px] flex items-center justify-center gap-2">
                        <Camera size={16} /> Tirar Foto
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={() => setDocFront('doc-front-upload.jpg')}
                        className="flex-1 bg-surface-interactive text-foreground font-display font-bold text-sm py-3 rounded-xl min-h-[44px] flex items-center justify-center gap-2">
                        <Upload size={16} /> Galeria
                      </motion.button>
                    </div>

                    {docFront && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-secondary/10 rounded-xl p-3 flex items-center gap-2">
                        <Scan size={14} className="text-secondary" />
                        <span className="text-[0.65rem] font-body text-secondary font-semibold flex items-center gap-1">OCR detectou dados automaticamente <Check size={12} /></span>
                      </motion.div>
                    )}

                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setKycSubStep('doc-back')} disabled={!docFront}
                      className={`w-full font-display font-bold text-sm py-3.5 rounded-xl min-h-[44px] transition-all ${
                        docFront ? 'bg-primary text-primary-foreground hover:brightness-110' : 'bg-surface-interactive text-muted-foreground cursor-not-allowed'
                      }`}>
                      Próximo — Verso do documento
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* DOC BACK */}
              {kycSubStep === 'doc-back' && (
                <motion.div key="kyc-doc-back" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="flex-1 px-6 pt-4">
                  <button onClick={() => setKycSubStep('doc-front')} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground/70 hover:text-foreground">
                    <ArrowLeft size={22} />
                  </button>
                  <div className="mt-2 space-y-5">
                    <div className="text-center">
                      <h2 className="font-display text-lg font-extrabold">Verso do Documento</h2>
                      <p className="text-xs font-body text-muted-foreground mt-1">Agora vire o documento e capture o verso</p>
                    </div>

                    <div className="relative mx-auto w-full max-w-[320px] aspect-[1.6/1] bg-surface-card rounded-2xl overflow-hidden flex items-center justify-center">
                      <motion.div className="absolute inset-3 pointer-events-none" animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />
                      </motion.div>

                      {docBack ? (
                        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-2">
                          <div className="w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center">
                            <Check size={28} className="text-secondary" />
                          </div>
                          <span className="text-xs font-body font-semibold text-secondary">Verso capturado!</span>
                        </motion.div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <FileText size={32} className="text-primary/40" />
                          <span className="text-[0.65rem] font-body">Posicione aqui</span>
                        </div>
                      )}

                      {!docBack && (
                        <motion.div className="absolute left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                          animate={{ top: ['15%', '85%', '15%'] }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      )}
                    </div>

                    <div className="flex gap-2">
                      <motion.button whileTap={{ scale: 0.97 }} onClick={() => setDocBack('doc-back.jpg')}
                        className="flex-1 bg-primary text-primary-foreground font-display font-bold text-sm py-3 rounded-xl min-h-[44px] flex items-center justify-center gap-2">
                        <Camera size={16} /> Tirar Foto
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={() => setDocBack('doc-back-upload.jpg')}
                        className="flex-1 bg-surface-interactive text-foreground font-display font-bold text-sm py-3 rounded-xl min-h-[44px] flex items-center justify-center gap-2">
                        <Upload size={16} /> Galeria
                      </motion.button>
                    </div>

                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setKycSubStep('liveness')} disabled={!docBack}
                      className={`w-full font-display font-bold text-sm py-3.5 rounded-xl min-h-[44px] transition-all ${
                        docBack ? 'bg-primary text-primary-foreground hover:brightness-110' : 'bg-surface-interactive text-muted-foreground cursor-not-allowed'
                      }`}>
                      Próximo — Prova de Vida
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* LIVENESS CHECK — Circular Guide */}
              {kycSubStep === 'liveness' && (
                <motion.div key="kyc-liveness" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="flex-1 px-6 pt-4">
                  <button onClick={() => setKycSubStep('doc-back')} className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground/70 hover:text-foreground">
                    <ArrowLeft size={22} />
                  </button>
                  <div className="mt-2 space-y-5">
                    <div className="text-center">
                      <h2 className="font-display text-lg font-extrabold">Prova de Vida</h2>
                      <p className="text-xs font-body text-muted-foreground mt-1">Siga as instruções na tela para confirmar que é você</p>
                    </div>

                    {/* Circular face guide */}
                    <div className="relative mx-auto w-56 h-56">
                      {/* Outer ring animated */}
                      <motion.div className="absolute inset-0 rounded-full border-[3px] border-dashed border-primary/30"
                        animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }} />
                      {/* Progress ring */}
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle cx="112" cy="112" r="106" fill="none" stroke="hsl(var(--surface-interactive))" strokeWidth="4" />
                        <motion.circle cx="112" cy="112" r="106" fill="none" stroke="hsl(var(--secondary))" strokeWidth="4"
                          strokeDasharray={666} strokeDashoffset={666 - (666 * livenessProgress / 100)} strokeLinecap="round"
                          transition={{ duration: 0.3 }}
                        />
                      </svg>
                      {/* Inner area */}
                      <div className="absolute inset-4 rounded-full bg-surface-card flex items-center justify-center overflow-hidden">
                        <motion.div animate={
                          livenessStep === 0 ? {} :
                          livenessStep === 1 ? { rotate: [0, 15, -15, 0] } :
                          livenessStep === 2 ? { scale: [1, 1.05, 1] } :
                          { y: [0, -3, 0] }
                        } transition={{ duration: 1.5, repeat: Infinity }}>
                          <UserCircle size={64} className="text-muted-foreground/30" />
                        </motion.div>
                      </div>
                    </div>

                    {/* Liveness instructions */}
                    {(() => {
                      const instructions = [
                        { text: 'Posicione seu rosto no centro', emoji: '👤' },
                        { text: 'Agora vire levemente a cabeça', emoji: '↔️' },
                        { text: 'Dê um leve sorriso', emoji: '😊' },
                        { text: 'Pisque os olhos', emoji: '😉' },
                      ];
                      const current = instructions[livenessStep] || instructions[0];
                      return (
                        <motion.div key={livenessStep} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          className="text-center space-y-1">
                          <span className="text-2xl">{current.emoji}</span>
                          <p className="text-sm font-body font-semibold text-foreground">{current.text}</p>
                        </motion.div>
                      );
                    })()}

                    <motion.button whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        if (livenessStep < 3) {
                          setLivenessStep(livenessStep + 1);
                          setLivenessProgress((livenessStep + 1) * 33);
                        } else {
                          setLivenessProgress(100);
                          setSelfie('liveness-selfie.jpg');
                          setTimeout(() => setKycSubStep('validating'), 600);
                        }
                      }}
                      className="w-full bg-primary text-primary-foreground font-display font-bold text-sm py-3.5 rounded-xl min-h-[44px] hover:brightness-110 transition-all">
                      {livenessStep < 3 ? 'Confirmar' : 'Finalizar Captura'}
                    </motion.button>

                    <p className="text-[0.6rem] font-body text-muted-foreground text-center leading-snug">
                      A câmera verifica que você é uma pessoa real, não uma foto ou deepfake. Seus dados biométricos não são armazenados.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* VALIDATING — Loading Pipeline */}
              {kycSubStep === 'validating' && (
                <motion.div key="kyc-validating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex-1 px-6 pt-4 flex flex-col items-center justify-center min-h-[70vh]">
                  <div className="w-full max-w-xs space-y-8">
                    <div className="text-center space-y-2">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        className="w-16 h-16 mx-auto rounded-full bg-primary/15 flex items-center justify-center">
                        <ShieldCheck size={32} className="text-primary" />
                      </motion.div>
                      <h2 className="font-display text-lg font-extrabold">Estamos validando seus dados</h2>
                      <p className="text-xs font-body text-muted-foreground">Para sua proteção, cada camada é verificada individualmente</p>
                    </div>

                    {/* Validation steps */}
                    <div className="space-y-3">
                      {[
                        { icon: CreditCard, label: 'Consulta CPF — Receita Federal', status: validationStep >= 0 ? (validationStep > 0 ? 'done' : 'loading') : 'pending' },
                        { icon: Scan, label: 'OCR — Extração de dados do documento', status: validationStep >= 1 ? (validationStep > 1 ? 'done' : 'loading') : 'pending' },
                        { icon: Camera, label: 'Liveness — Prova de vida confirmada', status: validationStep >= 2 ? (validationStep > 2 ? 'done' : 'loading') : 'pending' },
                        { icon: Brain, label: 'Face Match — Comparação biométrica', status: validationStep >= 3 ? (validationStep > 3 ? 'done' : 'loading') : 'pending' },
                        { icon: AlertTriangle, label: 'Anti-Deepfake — Análise de manipulação', status: validationStep >= 4 ? (validationStep > 4 ? 'done' : 'loading') : 'pending' },
                        { icon: ShieldCheck, label: 'PLD — Prevenção à Lavagem de Dinheiro', status: validationStep >= 5 ? (validationStep > 5 ? 'done' : 'loading') : 'pending' },
                      ].map((item, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }}
                          className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            item.status === 'done' ? 'bg-secondary/20' : item.status === 'loading' ? 'bg-primary/15' : 'bg-surface-interactive'
                          }`}>
                            {item.status === 'done' ? <Check size={14} className="text-secondary" /> :
                             item.status === 'loading' ? (
                              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                                <RefreshCw size={14} className="text-primary" />
                              </motion.div>
                             ) : <item.icon size={14} className="text-muted-foreground/40" />}
                          </div>
                          <span className={`text-[0.7rem] font-body font-medium ${
                            item.status === 'done' ? 'text-secondary' : item.status === 'loading' ? 'text-foreground' : 'text-muted-foreground/50'
                          }`}>{item.label}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* KYC DONE */}
              {kycSubStep === 'done' && (
                <motion.div key="kyc-done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="flex-1 px-6 pt-4 flex flex-col items-center justify-center min-h-[70vh]">
                  <div className="w-full max-w-xs space-y-6 text-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                      className="w-20 h-20 mx-auto rounded-full bg-secondary/20 flex items-center justify-center">
                      <CheckCircle2 size={44} className="text-secondary" />
                    </motion.div>
                    <div>
                      <h2 className="font-display text-xl font-extrabold">Identidade Verificada!</h2>
                      <p className="text-xs font-body text-muted-foreground mt-2">
                        Todas as 5 camadas de segurança foram aprovadas. Seu dinheiro e prêmios estão protegidos.
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { icon: CreditCard, label: 'CPF' },
                        { icon: FileText, label: 'OCR' },
                        { icon: Camera, label: 'Liveness' },
                        { icon: Brain, label: 'Face Match' },
                        { icon: AlertTriangle, label: 'Anti-Deepfake' },
                        { icon: ShieldCheck, label: 'PLD' },
                      ].map((item, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                          className="bg-secondary/10 rounded-lg p-2 flex flex-col items-center gap-1">
                          <item.icon size={14} className="text-secondary" />
                          <span className="text-[0.55rem] font-body font-semibold text-secondary">{item.label}</span>
                        </motion.div>
                      ))}
                    </div>

                    <div className="bg-primary/10 rounded-xl p-3">
                      <p className="text-[0.65rem] font-body text-primary leading-snug">
                        💰 <strong>Por sua segurança:</strong> só aceitamos depósitos de contas em seu nome. Isso garante que seu prêmio vá direto para você!
                      </p>
                    </div>

                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep('success')}
                      className="w-full bg-primary text-primary-foreground font-display font-bold text-base py-3.5 rounded-xl min-h-[44px] hover:brightness-110 transition-all">
                      Começar a Apostar 🎉
                    </motion.button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>
        )}

        {/* OTP */}
        {step === 'otp' && (
          <motion.div key="otp" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="flex-1 px-6 pt-4 pb-8">
            <BackButton to="login" />
            <div className="mt-4 space-y-6">
              <div className="flex items-start gap-3">
                <ShieldCheck size={28} className="text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="font-display text-2xl font-extrabold">Verificação</h2>
                  <p className="text-sm font-body text-muted-foreground mt-1">
                    Digite o código enviado para seu e-mail
                  </p>
                </div>
              </div>

              {/* Method selector */}
              <div className="flex gap-2">
                <button className="flex-1 bg-primary text-primary-foreground text-xs font-body font-semibold py-2.5 rounded-xl min-h-[44px] flex items-center justify-center gap-1.5">
                  <Mail size={14} /> E-mail
                </button>
                <button className="flex-1 bg-surface-interactive text-muted-foreground text-xs font-body font-semibold py-2.5 rounded-xl min-h-[44px] flex items-center justify-center gap-1.5">
                  <Smartphone size={14} /> SMS
                </button>
                <button className="flex-1 bg-surface-interactive text-muted-foreground text-xs font-body font-semibold py-2.5 rounded-xl min-h-[44px] flex items-center justify-center gap-1.5">
                  <Fingerprint size={14} /> Biometria
                </button>
              </div>

              {/* OTP input */}
              <div className="flex gap-2 justify-center">
                {otpCode.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpInput(i, e.target.value)}
                    className="w-12 h-14 bg-surface-interactive rounded-xl text-center text-xl font-display font-bold text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                ))}
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/')}
                className="w-full bg-primary text-primary-foreground font-display font-bold text-base py-3.5 rounded-xl min-h-[44px] hover:brightness-110 transition-all">
                Confirmar
              </motion.button>

              <button
                disabled={!otpCanResend}
                onClick={() => { setOtpTimer(60); setOtpCanResend(false); }}
                className={`w-full text-center text-xs font-body font-semibold min-h-[44px] ${otpCanResend ? 'text-primary' : 'text-muted-foreground'}`}>
                {otpCanResend ? 'Reenviar código' : `Reenviar código (${String(Math.floor(otpTimer / 60)).padStart(2, '0')}:${String(otpTimer % 60).padStart(2, '0')})`}
              </button>
            </div>
          </motion.div>
        )}

        {/* RECOVERY */}
        {step === 'recovery' && (
          <motion.div key="recovery" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="flex-1 px-6 pt-4 pb-8">
            <BackButton to="login" />
            <div className="mt-4 space-y-6">
              <div>
                <h2 className="font-display text-2xl font-extrabold">Recuperar Senha</h2>
                <p className="text-sm font-body text-muted-foreground mt-1">
                  {recoverySent
                    ? 'Link de recuperação enviado com sucesso! Verifique seu email.'
                    : 'Digite seu e-mail para receber um link de recuperação.'
                  }
                </p>
              </div>

              {!recoverySent ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-body font-medium text-muted-foreground">E-mail de Recuperação</label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input type="email" value={recoveryIdentifier} onChange={(e) => setRecoveryIdentifier(e.target.value)} placeholder="seu@email.com"
                        className="w-full bg-surface-interactive rounded-xl py-3 pl-11 pr-4 text-sm font-body text-foreground outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground min-h-[44px]" />
                    </div>
                    {recoveryTrimmed.length > 0 && !recoveryIdentifierValid && (
                      <p className="text-[0.7rem] text-destructive font-body">Informe um e-mail válido.</p>
                    )}
                  </div>

                  {/* Recovery Method Selection - Email only for now */}
                  <div className="bg-surface-card rounded-xl p-3 flex items-start gap-2">
                    <Mail size={16} className="text-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-body font-medium text-foreground">Método de Recuperação</p>
                      <p className="text-[0.7rem] font-body text-muted-foreground mt-1">
                        Enviaremos um link de recuperação para seu email registrado. Válido por 1 hora.
                      </p>
                    </div>
                  </div>

                  <motion.button whileTap={{ scale: 0.97 }} onClick={async () => {
                    setAuthError(null);
                    setAuthLoading(true);

                    try {
                      let emailToReset = '';

                      // If it's already an email, use it directly
                      if (recoveryEmailValid) {
                        emailToReset = recoveryTrimmed.toLowerCase();
                      }

                      if (!emailToReset) {
                        setAuthError('Por favor, use um e-mail válido para recuperar sua senha.');
                        setAuthLoading(false);
                        return;
                      }

                      // Call Supabase resetPasswordForEmail
                      const { error } = await supabase.auth.resetPasswordForEmail(emailToReset, {
                        redirectTo: `${window.location.origin}/reset-password`,
                      });

                      if (error) {
                        console.error('Recovery error:', error);
                        setAuthError(error.message || 'Erro ao iniciar recuperação. Tente novamente.');
                        setAuthLoading(false);
                        return;
                      }

                      setRecoveryTargetLabel(emailToReset);
                      setRecoverySent(true);
                    } catch (err) {
                      console.error('Recovery exception:', err);
                      setAuthError('Erro inesperado. Tente novamente em instantes.');
                    }
                    setAuthLoading(false);
                  }}
                    disabled={!recoveryIdentifierValid || authLoading}
                    className={`w-full font-display font-bold text-base py-3.5 rounded-xl min-h-[44px] transition-all ${
                      recoveryIdentifierValid && !authLoading
                        ? 'bg-primary text-primary-foreground hover:brightness-110'
                        : 'bg-surface-interactive text-muted-foreground cursor-not-allowed'
                    }`}>
                    {authLoading ? 'Enviando...' : 'Enviar Link de Recuperação'}
                  </motion.button>
                </>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4 pt-4">
                  <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center">
                    <Mail size={28} className="text-secondary" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm font-body font-semibold text-foreground">
                      E-mail enviado!
                    </p>
                    <p className="text-xs font-body text-muted-foreground">
                      Enviamos um link de recuperacao para <span className="font-semibold text-foreground">{recoveryTargetLabel}</span>
                    </p>
                    <div className="flex gap-2 text-[0.75rem] font-body text-muted-foreground bg-surface-card rounded-lg p-3 mt-3">
                      <Mail size={14} className="flex-shrink-0 mt-0.5" />
                      <span>Procure por um email intitulado "Redefinir sua senha" na sua caixa de entrada ou spam. O link expira em 1 hora.</span>
                    </div>
                  </div>
                  <button onClick={() => setStep('login')}
                    className="text-xs text-primary font-body font-semibold min-h-[44px] hover:text-primary/80 transition-colors">
                    ← Voltar ao Login
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}

        {/* SUCCESS */}
        {step === 'success' && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center px-6 pb-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
              className="w-24 h-24 rounded-full bg-secondary/20 flex items-center justify-center mb-6"
            >
              <CheckCircle2 size={48} className="text-secondary" />
            </motion.div>
            <h2 className="font-display text-2xl font-extrabold">Conta criada com sucesso!</h2>
            <p className="text-sm font-body text-muted-foreground mt-2 max-w-[280px]">
              Tudo pronto! Comece a explorar os melhores mercados e odds turbinadas.
            </p>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/')}
              className="mt-8 w-full bg-primary text-primary-foreground font-display font-bold text-base py-3.5 rounded-xl min-h-[44px] hover:brightness-110 transition-all">
              Começar a Apostar
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthPage;
