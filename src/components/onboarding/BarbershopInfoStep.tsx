import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'motion/react';
import { IMaskInput } from 'react-imask';
import { Store, User, Phone, Mail, MapPin, Camera } from 'lucide-react';

const barbershopSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  ownerName: z.string().min(2, 'Nome do dono deve ter pelo menos 2 caracteres'),
  phone: z.string().min(10, 'Telefone inválido'),
  email: z.string().email('E-mail inválido'),
  address: z.string().min(5, 'Endereço muito curto'),
  city: z.string().min(2, 'Cidade inválida'),
  state: z.string().length(2, 'Use a sigla do estado (ex: SP)'),
  instagram: z.string().optional(),
});

type BarbershopFormData = z.infer<typeof barbershopSchema>;

interface BarbershopInfoStepProps {
  onNext: (data: BarbershopFormData) => void;
  onBack: () => void;
}

export default function BarbershopInfoStep({ onNext, onBack }: BarbershopInfoStepProps) {
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<BarbershopFormData>({
    resolver: zodResolver(barbershopSchema),
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8 py-6"
    >
      <div className="space-y-2">
        <h2 className="text-3xl font-serif text-primary">Sobre sua barbearia</h2>
        <p className="text-primary/60">Essas informações serão usadas pela IA no atendimento aos seus clientes.</p>
      </div>

      <form onSubmit={handleSubmit(onNext)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nome da Barbearia */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-primary/50 flex items-center gap-2">
            <Store size={14} /> Nome da barbearia
          </label>
          <input
            {...register('name')}
            className="w-full bg-white border border-primary/10 rounded-lg p-3 focus:ring-2 focus:ring-secondary/40 outline-none transition-all"
            placeholder="Ex: O Barbeiro de Sevilha"
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        {/* Nome do Dono */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-primary/50 flex items-center gap-2">
            <User size={14} /> Seu nome (dono)
          </label>
          <input
            {...register('ownerName')}
            className="w-full bg-white border border-primary/10 rounded-lg p-3 focus:ring-2 focus:ring-secondary/40 outline-none transition-all"
            placeholder="Seu nome completo"
          />
          {errors.ownerName && <p className="text-xs text-red-500">{errors.ownerName.message}</p>}
        </div>

        {/* Telefone */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-primary/50 flex items-center gap-2">
            <Phone size={14} /> Telefone / WhatsApp
          </label>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <IMaskInput
                mask="(00) 00000-0000"
                value={field.value}
                onAccept={(value: string) => field.onChange(value)}
                className="w-full bg-white border border-primary/10 rounded-lg p-3 focus:ring-2 focus:ring-secondary/40 outline-none transition-all"
                placeholder="(11) 99999-9999"
              />
            )}
          />
          {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
        </div>

        {/* E-mail */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-primary/50 flex items-center gap-2">
            <Mail size={14} /> E-mail
          </label>
          <input
            {...register('email')}
            className="w-full bg-white border border-primary/10 rounded-lg p-3 focus:ring-2 focus:ring-secondary/40 outline-none transition-all"
            placeholder="contato@barbearia.com"
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        {/* Endereço */}
        <div className="md:col-span-2 space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-primary/50 flex items-center gap-2">
            <MapPin size={14} /> Endereço completo
          </label>
          <input
            {...register('address')}
            className="w-full bg-white border border-primary/10 rounded-lg p-3 focus:ring-2 focus:ring-secondary/40 outline-none transition-all"
            placeholder="Rua, número, bairro"
          />
          {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
        </div>

        {/* Cidade */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-primary/50">Cidade</label>
          <input
            {...register('city')}
            className="w-full bg-white border border-primary/10 rounded-lg p-3 focus:ring-2 focus:ring-secondary/40 outline-none transition-all"
            placeholder="Ex: São Paulo"
          />
          {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
        </div>

        {/* Estado */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-primary/50">Estado (UF)</label>
          <input
            {...register('state')}
            maxLength={2}
            className="w-full bg-white border border-primary/10 rounded-lg p-3 focus:ring-2 focus:ring-secondary/40 outline-none transition-all"
            placeholder="SP"
          />
          {errors.state && <p className="text-xs text-red-500">{errors.state.message}</p>}
        </div>

        {/* Instagram */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-primary/50 flex items-center gap-2">
            <Camera size={14} /> Instagram (opcional)
          </label>
          <input
            {...register('instagram')}
            className="w-full bg-white border border-primary/10 rounded-lg p-3 focus:ring-2 focus:ring-secondary/40 outline-none transition-all"
            placeholder="@suabarbearia"
          />
        </div>

        {/* Logo Placeholder */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-widest text-primary/50 flex items-center gap-2">
            <Camera size={14} /> Logo da barbearia
          </label>
          <div className="h-[50px] border-2 border-dashed border-primary/10 rounded-lg flex items-center justify-center bg-white/50 cursor-pointer hover:bg-white transition-colors">
            <span className="text-[10px] uppercase tracking-tighter text-primary/30">Clique para fazer upload</span>
          </div>
        </div>

        <div className="md:col-span-2 pt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="text-primary/50 font-bold hover:text-primary transition-colors"
          >
            Voltar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-secondary text-primary font-bold px-10 py-4 rounded-lg shadow-lg hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? 'Salvando...' : 'Continuar'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
