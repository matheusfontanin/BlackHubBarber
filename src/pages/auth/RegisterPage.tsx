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
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'repeating-linear-gradient(60deg, #c9a84c 0px, #c9a84c 1px, transparent 1px, transparent 60px)' }}
        />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[400px] relative z-10"
        >
          <div className="bg-bg border border-border2 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.5)] p-8 text-center space-y-5">
            <div className="h-0.5 w-full bg-gradient-to-r from-gold/0 via-gold to-gold/0 -mt-8 mx-0 -mx-8 mb-8" />
            <div className="w-14 h-14 bg-emerald-950/60 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle size={28} className="text-success" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold text-primary mb-2">Confirme seu e-mail</h1>
              <p className="text-muted text-sm leading-relaxed">
                Enviamos um link de confirmação para{' '}
                <strong className="text-gold">{email}</strong>.
                Clique no link para ativar sua conta.
              </p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gold hover:text-gold-light transition-colors"
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
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'repeating-linear-gradient(60deg, #c9a84c 0px, #c9a84c 1px, transparent 1px, transparent 60px)' }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 100%, rgba(201,168,76,0.07) 0%, transparent 70%)' }}
      />

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
            className="w-16 h-16 bg-gold/10 border border-gold/25 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-[0_0_30px_rgba(201,168,76,0.15)]"
          >
            <Scissors size={26} className="text-gold" />
          </motion.div>
          <h1 className="text-3xl font-heading font-bold text-primary italic mb-1">BlackHub</h1>
          <p className="text-xs text-muted tracking-wider uppercase">Cadastre sua barbearia</p>
        </div>

        {/* Card */}
        <div className="bg-bg border border-border2 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="h-0.5 w-full bg-gradient-to-r from-gold/0 via-gold to-gold/0" />
          <form onSubmit={handleRegister} className="p-7 space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 bg-red-950/60 border border-red-500/20 text-error text-xs font-semibold rounded-xl text-center"
              >
                {error}
              </motion.div>
            )}

            <div className="space-y-4">
              <div>
                <label className="label-xs"><User size={11} /> Seu Nome</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-dark"
                  placeholder="João Silva"
                  required
                />
              </div>
              <div>
                <label className="label-xs"><Mail size={11} /> E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-dark"
                  placeholder="joao@barbearia.com"
                  required
                />
              </div>
              <div>
                <label className="label-xs"><Lock size={11} /> Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-dark pr-12"
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-gold transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full py-3.5 flex items-center justify-center gap-2 mt-2"
            >
              {loading
                ? <Loader2 className="animate-spin" size={18} />
                : <><span>Criar conta gratuita</span><ArrowRight size={16} /></>
              }
            </button>

            <p className="text-center text-xs text-faint pt-1">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-gold font-semibold hover:text-gold-light transition-colors">
                Faça login
              </Link>
            </p>
          </form>
        </div>

        <p className="text-center text-[10px] text-faint mt-6 uppercase tracking-[0.15em] font-medium">
          BlackHub Barber &mdash; Powered by AI
        </p>
      </motion.div>
    </div>
  );
}
