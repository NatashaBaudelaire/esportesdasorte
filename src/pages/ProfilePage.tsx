import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, TrendingUp, History, Shield, Settings, LogOut, ChevronRight,
  Award, Trophy, CreditCard, Star, UserPlus, LogIn, Pencil, Check, X,
  Mail, Phone, MapPin, Calendar, FileText, Camera, Image, Loader2, RotateCw, ZoomIn
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { PageTransition, staggerContainer, staggerItem } from '@/components/animations';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';

const createCroppedImage = async (imageSrc: string, pixelCrop: Area, rotation: number): Promise<Blob> => {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const radians = (rotation * Math.PI) / 180;

  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  const bBoxWidth = image.width * cos + image.height * sin;
  const bBoxHeight = image.width * sin + image.height * cos;

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(radians);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const data = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height);
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.putImageData(data, 0, 0);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9);
  });
};

const stats = [
  { label: 'Apostas', value: '142' },
  { label: 'Taxa de Acerto', value: '58%' },
  { label: 'ROI', value: '+12.4%' },
  { label: 'Nível', value: 'Ouro' },
];

const menuItems = [
  { icon: History, label: 'Histórico de Apostas', route: '/historico' },
  { icon: TrendingUp, label: 'Relatório de Desempenho', route: '/desempenho' },
  { icon: Trophy, label: 'Bolão', route: '/bolao' },
  { icon: Award, label: 'Plano Premium', route: '/planos' },
  { icon: CreditCard, label: 'Carteira', route: '/carteira' },
  { icon: Shield, label: 'Jogo Responsável', route: '/jogo-responsavel' },
  { icon: Settings, label: 'Configurações', route: '/configuracoes' },
  { icon: FileText, label: 'Verificação KYC', route: '/kyc' },
];

const ProfilePage = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user, profile, logout, updateProfile, fetchProfile } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    phone: '',
    cpf: '',
    dob: '',
    country: '',
    state: '',
    city: '',
  });
  const [newEmail, setNewEmail] = useState('');
  const [emailEditing, setEmailEditing] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleFileSelected = (file: File) => {
    setShowPhotoMenu(false);
    const reader = new FileReader();
    reader.onload = () => setCropImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCropConfirm = async () => {
    if (!cropImage || !croppedAreaPixels || !user) return;
    setUploadingPhoto(true);
    try {
      const croppedBlob = await createCroppedImage(cropImage, croppedAreaPixels, rotation);
      const path = `${user.id}/avatar.jpg`;

      await supabase.storage.from('avatars').remove([path]);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, croppedBlob, { upsert: true, contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      await updateProfile({ avatar_url: avatarUrl } as any);
      if (user) await fetchProfile(user.id);
      toast.success('Foto atualizada!');
      setCropImage(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao enviar foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    handleFileSelected(file);
  };

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        username: profile.username || '',
        phone: profile.phone || '',
        cpf: profile.cpf || '',
        dob: profile.dob || '',
        country: profile.country || 'Brasil',
        state: profile.state || '',
        city: profile.city || '',
      });
    }
    if (user?.email) {
      setNewEmail(user.email);
    }
  }, [profile, user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile(form);
      toast.success('Perfil atualizado com sucesso!');
      setEditing(false);
    } catch {
      toast.error('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail || newEmail === user?.email) {
      setEmailEditing(false);
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast.success('Email de confirmação enviado para o novo endereço');
      setEmailEditing(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao alterar email');
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success('Email de redefinição de senha enviado!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao enviar email');
    }
  };

  if (!isLoggedIn) {
    return (
      <PageTransition>
        <div className="flex flex-col items-center justify-center px-6 pt-12 pb-20 space-y-6 text-center">
          <div className="w-20 h-20 rounded-full bg-surface-card flex items-center justify-center">
            <User size={36} className="text-muted-foreground" />
          </div>
          <div>
            <h2 className="font-display text-xl font-extrabold">Visitante</h2>
            <p className="text-sm font-body text-muted-foreground mt-1">
              Você está navegando como visitante
            </p>
          </div>
          <div className="w-full bg-surface-card rounded-2xl p-5 space-y-3">
            <p className="text-sm font-body text-foreground/80">
              Uma experiência única em apostas te espera. Mas antes, precisamos te conhecer!
            </p>
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/auth')}
                className="flex-1 bg-primary text-primary-foreground font-display font-bold text-sm py-3 rounded-xl min-h-[44px] flex items-center justify-center gap-1.5">
                <UserPlus size={16} /> Criar Conta
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/auth')}
                className="flex-1 bg-surface-interactive text-foreground font-display font-bold text-sm py-3 rounded-xl min-h-[44px] flex items-center justify-center gap-1.5">
                <LogIn size={16} /> Login
              </motion.button>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  const fieldRows = [
    { key: 'full_name', label: 'Nome Completo', icon: User, type: 'text', placeholder: 'Seu nome completo' },
    { key: 'username', label: 'Usuário', icon: User, type: 'text', placeholder: '@usuario' },
    { key: 'phone', label: 'Telefone', icon: Phone, type: 'tel', placeholder: '(11) 99999-9999' },
    { key: 'cpf', label: 'CPF', icon: FileText, type: 'text', placeholder: '000.000.000-00' },
    { key: 'dob', label: 'Data de Nascimento', icon: Calendar, type: 'date', placeholder: '' },
    { key: 'state', label: 'Estado', icon: MapPin, type: 'text', placeholder: 'SP' },
    { key: 'city', label: 'Cidade', icon: MapPin, type: 'text', placeholder: 'São Paulo' },
  ];

  return (
    <PageTransition>
      <div className="space-y-5 pb-24 px-4 pt-2">
        {/* Profile Header */}
        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="relative">
            <div className="w-[72px] h-[72px] rounded-full bg-accent flex items-center justify-center overflow-hidden">
              {uploadingPhoto ? (
                <Loader2 size={24} className="text-primary animate-spin" />
              ) : profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <User size={30} className="text-primary" />
              )}
            </div>
            <button
              onClick={() => setShowPhotoMenu(!showPhotoMenu)}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
            >
              <Camera size={14} />
            </button>

            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePhotoUpload(file);
                e.target.value = '';
              }}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="user"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePhotoUpload(file);
                e.target.value = '';
              }}
            />

            {/* Photo menu popup */}
            <AnimatePresence>
              {showPhotoMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -5 }}
                  className="absolute top-full left-0 mt-2 bg-surface-card rounded-xl shadow-lg z-20 overflow-hidden w-48"
                >
                  <button
                    onClick={() => { cameraInputRef.current?.click(); setShowPhotoMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-body text-foreground hover:bg-surface-interactive transition-colors min-h-[44px]"
                  >
                    <Camera size={18} className="text-primary" />
                    Tirar Foto
                  </button>
                  <button
                    onClick={() => { fileInputRef.current?.click(); setShowPhotoMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-body text-foreground hover:bg-surface-interactive transition-colors min-h-[44px]"
                  >
                    <Image size={18} className="text-primary" />
                    Escolher da Galeria
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="flex-1">
            <h2 className="font-display text-xl font-bold">{profile?.full_name || 'Usuário'}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="bg-primary/20 text-primary text-[0.65rem] font-display font-bold px-2 py-0.5 rounded-full">
                <Star size={12} className="inline mr-0.5" /> {profile?.level || 'Bronze'}
              </span>
              <span className="text-xs text-muted-foreground font-body">@{profile?.username || 'usuario'}</span>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setEditing(!editing)}
            className="w-10 h-10 rounded-xl bg-surface-card flex items-center justify-center"
          >
            {editing ? <X size={18} className="text-destructive" /> : <Pencil size={18} className="text-muted-foreground" />}
          </motion.button>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-4 gap-2"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          {stats.map((stat) => (
            <motion.div key={stat.label} variants={staggerItem} className="bg-surface-card rounded-xl p-3 text-center">
              <p className="font-display text-lg font-bold text-primary">{stat.value}</p>
              <p className="text-[0.6rem] text-muted-foreground font-body mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
        {/* KYC Status Section */}
        {profile?.kyc_status && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`rounded-xl p-4 flex items-center justify-between ${
              profile.kyc_status === 'verified'
                ? 'bg-green-50 border border-green-200'
                : profile.kyc_status === 'rejected'
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-amber-50 border border-amber-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <Shield size={20} className={profile.kyc_status === 'verified' ? 'text-green-600' : profile.kyc_status === 'rejected' ?  'text-red-600' : 'text-amber-600'} />
              <div>
                <p className="font-display text-sm font-bold">{profile.kyc_status === 'verified' ? 'Verificação Completa' : profile.kyc_status === 'rejected' ?'Verificação Rejeitada' : 'Verificação Pendente'}</p>
                <p className="text-xs font-body text-muted-foreground">{profile.kyc_status === 'verified' ? 'Sua identidade foi verificada com sucesso' : profile.kyc_status === 'rejected' ? 'Sua verificação foi rejeitada' : 'Complete sua verificação'}</p>
              </div>
            </div>
            {profile.kyc_status !== 'verified' && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/kyc')}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-semibold"
              >
                {profile.kyc_status === 'pending' ? 'Continuar' : 'Tentar'}
              </motion.button>
            )}
          </motion.div>
        )}

        {!profile?.kyc_status && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/kyc')}
            className="w-full bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-blue-600" />
              <div className="text-left">
                <p className="font-display text-sm font-bold text-blue-900">Verificação KYC</p>
                <p className="text-xs font-body text-blue-700">Necessário para acesso</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-blue-600" />
          </motion.button>
        )}

        {/* Editable Profile Fields */}
        <AnimatePresence>
          {editing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="bg-surface-card rounded-2xl p-4 space-y-4">
                <h3 className="font-display text-sm font-bold text-foreground">Editar Perfil</h3>

                {/* Email field (separate - uses auth) */}
                <div className="space-y-1.5">
                  <label className="text-[0.65rem] font-body text-muted-foreground flex items-center gap-1.5">
                    <Mail size={12} /> Email
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      disabled={!emailEditing}
                      className="flex-1 bg-surface-interactive rounded-xl px-3 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 min-h-[44px]"
                    />
                    {emailEditing ? (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleEmailChange}
                        className="w-11 h-11 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center"
                      >
                        <Check size={16} />
                      </motion.button>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setEmailEditing(true)}
                        className="w-11 h-11 rounded-xl bg-surface-interactive flex items-center justify-center"
                      >
                        <Pencil size={14} className="text-muted-foreground" />
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* Profile fields */}
                {fieldRows.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <label className="text-[0.65rem] font-body text-muted-foreground flex items-center gap-1.5">
                      <field.icon size={12} /> {field.label}
                    </label>
                    <input
                      type={field.type}
                      value={(form as any)[field.key]}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      placeholder={field.placeholder}
                      className="w-full bg-surface-interactive rounded-xl px-3 py-2.5 text-sm font-body text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary min-h-[44px]"
                    />
                  </div>
                ))}

                {/* Password reset */}
                <button
                  onClick={handlePasswordReset}
                  className="w-full text-sm font-body text-primary font-semibold py-2.5 min-h-[44px]"
                >
                  Redefinir Senha
                </button>

                {/* Save button */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-primary text-primary-foreground font-display font-bold text-sm py-3.5 rounded-xl min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving ? (
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check size={16} /> Salvar Alterações
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Menu */}
        <motion.div className="space-y-1" variants={staggerContainer} initial="hidden" animate="show">
          {menuItems.map((item) => (
            <motion.button
              key={item.label}
              variants={staggerItem}
              whileTap={{ scale: 0.97 }}
              onClick={() => item.route && navigate(item.route)}
              className="w-full flex items-center justify-between bg-surface-card rounded-xl p-4 min-h-[44px] hover:bg-surface-interactive transition-colors"
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} className="text-muted-foreground" />
                <span className="text-sm font-body font-medium">{item.label}</span>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </motion.button>
          ))}
        </motion.div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { logout(); navigate('/'); }}
          className="w-full flex items-center justify-center gap-2 bg-destructive/10 text-destructive rounded-xl p-4 min-h-[44px] font-body font-medium text-sm"
        >
          <LogOut size={18} />
          Sair da Conta
        </motion.button>
      </div>

      {/* Crop Modal */}
      <AnimatePresence>
        {cropImage && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-background/90 backdrop-blur-sm">
                <button
                  onClick={() => { setCropImage(null); setRotation(0); setZoom(1); }}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <X size={22} className="text-foreground" />
                </button>
                <span className="font-display font-bold text-sm">Ajustar Foto</span>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCropConfirm}
                  disabled={uploadingPhoto}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  {uploadingPhoto ? (
                    <Loader2 size={20} className="text-primary animate-spin" />
                  ) : (
                    <Check size={22} className="text-primary" />
                  )}
                </motion.button>
              </div>

              {/* Cropper area */}
              <div className="flex-1 relative">
                <Cropper
                  image={cropImage}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onRotationChange={setRotation}
                  onCropComplete={onCropComplete}
                />
              </div>

              {/* Controls */}
              <div className="bg-background/90 backdrop-blur-sm px-6 py-4 space-y-3">
                <div className="flex items-center gap-3">
                  <ZoomIn size={16} className="text-muted-foreground" />
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1 accent-primary h-1"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <RotateCw size={16} className="text-muted-foreground" />
                  <input
                    type="range"
                    min={0}
                    max={360}
                    step={1}
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="flex-1 accent-primary h-1"
                  />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PageTransition>
  );
};

export default ProfilePage;
