import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Scissors, Lock, User, ArrowRight, Loader2, Eye, EyeOff, Mail, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useNavigate, Link } from 'react-router-dom';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: `${window.location.origin}/onboarding`,
        },
      });

      if (signUpError) throw signUpError;

      if (data.session) {
        navigate('/onboarding');
        return;
      }

      setSuccess(true);
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : String(err);
      let message = 'Ocorreu um erro ao criar sua conta. Tente novamente.';
      if (error.includes('already registered')) {
        message = 'Este e-mail já está cadastrado. Tente fazer login.';
      } else if (error.includes('Password should be')) {
        message = 'A senha deve ter pelo menos 6 caracteres.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-appbg flex items-center justify-center p-6 font-sans relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[400px] relative z-10"
        >
          <div className="bg-white rounded-2xl shadow-2xl shadow-black/25 p-8 text-center space-y-5">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle size={28} className="text-emerald-500" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold text-primary mb-2">Confirme seu e-mail</h1>
              <p className="text-primary/50 text-sm leading-relaxed">
                Enviamos um link de confirmação para <strong className="text-primary">{email}</strong>. Clique no link para ativar sua conta.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:underline"
            >
              Voltar para o login <ArrowRight size={14} />
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-appbg flex items-center justify-center p-6 font-sans relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[400px] relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="w-14 h-14 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <Scissors size={24} className="text-white" />
          </motion.div>
          <h1 className="text-2xl font-heading font-bold text-white mb-1">BlackHub</h1>
          <p className="text-xs text-white/40">Cadastre sua barbearia</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/25 overflow-hidden">
          <form onSubmit={handleRegister} className="p-6 space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-xl text-center"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-primary/40 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <User size={12} /> Seu Nome
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-bg border border-primary/8 focus:border-secondary focus:ring-2 focus:ring-secondary/10 rounded-xl outline-none transition-all text-sm font-medium"
                  placeholder="João Silva"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-primary/40 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Mail size={12} /> E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-bg border border-primary/8 focus:border-secondary focus:ring-2 focus:ring-secondary/10 rounded-xl outline-none transition-all text-sm font-medium"
                  placeholder="joao@barbearia.com"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-primary/40 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Lock size={12} /> Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-bg border border-primary/8 focus:border-secondary focus:ring-2 focus:ring-secondary/10 rounded-xl outline-none transition-all text-sm font-medium pr-12"
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/20 hover:text-secondary transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : (
                <>Criar conta gratuita <ArrowRight size={16} /></>
              )}
            </button>

            <p className="text-center text-xs text-primary/30 pt-1">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-secondary font-semibold hover:underline">
                Faça login
              </Link>
            </p>
          </form>
        </div>

        <p className="text-center text-[10px] text-white/20 mt-6 uppercase tracking-[0.15em] font-medium">
          BlackHub Barber &mdash; Powered by AI
        </p>
      </motion.div>
    </div>
  );
}
