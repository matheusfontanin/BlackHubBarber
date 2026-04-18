import React from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Phone, Mail, AtSign, Star, Clock, Scissors, Brain, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CustomerMemory } from '@/services/chatService';

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  instagram_handle?: string;
  tags?: string[];
  total_visits?: number;
  total_spent?: number;
  loyalty_points?: number;
  last_visit_at?: string;
  preferences?: {
    corte_preferido?: string;
    barba?: string;
    barbeiro_favorito?: string;
    alergias?: string[];
    produtos?: string[];
    observacoes?: string;
  };
}

interface CustomerProfilePanelProps {
  customer: Customer | null;
  memories: CustomerMemory[];
}

export function CustomerProfilePanel({ customer, memories }: CustomerProfilePanelProps) {
  if (!customer) return null;

  const prefs = customer.preferences;

  return (
    <div className="w-full lg:w-[320px] lg:shrink-0 bg-sidebar border-l border-border flex flex-col">
      {/* Profile header */}
      <div className="px-5 py-6 border-b border-border text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-950/60 border border-blue-500/20 flex items-center justify-center text-2xl font-bold text-blue-400 mx-auto mb-3">
          {customer.name?.charAt(0).toUpperCase()}
        </div>
        <h3 className="text-base font-heading font-bold text-primary italic">{customer.name}</h3>
        <div className="flex justify-center gap-3 mt-2">
          {customer.phone && (
            <span className="flex items-center gap-1 text-[10px] text-muted font-mono">
              <Phone size={10} className="text-faint" /> {customer.phone}
            </span>
          )}
        </div>
        <div className="flex justify-center gap-2 mt-2">
          {customer.email && (
            <span className="flex items-center gap-1 text-[10px] text-faint font-mono">
              <Mail size={9} /> {customer.email}
            </span>
          )}
          {customer.instagram_handle && (
            <span className="flex items-center gap-1 text-[10px] text-faint font-mono">
              <AtSign size={9} /> @{customer.instagram_handle}
            </span>
          )}
        </div>

        {customer.tags && customer.tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mt-3">
            {customer.tags.map(tag => (
              <span key={tag} className="text-[9px] font-bold bg-gold/10 border border-gold/20 text-gold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="px-5 py-4 border-b border-border">
        <p className="text-[10px] font-bold uppercase tracking-wider text-faint mb-3 flex items-center gap-1.5">
          <Star size={10} /> Resumo
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-surface rounded-xl p-2.5 text-center">
            <p className="text-base font-mono font-bold text-primary">{customer.total_visits ?? 0}</p>
            <p className="text-[8px] text-faint uppercase tracking-wider font-bold">Visitas</p>
          </div>
          <div className="bg-surface rounded-xl p-2.5 text-center">
            <p className="text-base font-mono font-bold text-gold">
              R$ {Number(customer.total_spent ?? 0).toFixed(0)}
            </p>
            <p className="text-[8px] text-faint uppercase tracking-wider font-bold">Gasto</p>
          </div>
          <div className="bg-surface rounded-xl p-2.5 text-center">
            <p className="text-base font-mono font-bold text-emerald-400">{customer.loyalty_points ?? 0}</p>
            <p className="text-[8px] text-faint uppercase tracking-wider font-bold">Pontos</p>
          </div>
        </div>
        {customer.last_visit_at && (
          <p className="text-[10px] text-faint mt-2 flex items-center gap-1">
            <Clock size={9} /> Última visita: {format(parseISO(customer.last_visit_at), "d 'de' MMM", { locale: ptBR })}
          </p>
        )}
      </div>

      {/* Preferences */}
      {prefs && Object.keys(prefs).length > 0 && (
        <div className="px-5 py-4 border-b border-border">
          <p className="text-[10px] font-bold uppercase tracking-wider text-faint mb-3 flex items-center gap-1.5">
            <Scissors size={10} /> Preferências
          </p>
          <div className="space-y-2">
            {prefs.corte_preferido && (
              <div className="flex items-start gap-2">
                <span className="text-[10px] text-gold">💇</span>
                <div>
                  <p className="text-[9px] text-faint uppercase tracking-wider font-bold">Corte</p>
                  <p className="text-xs text-primary">{prefs.corte_preferido}</p>
                </div>
              </div>
            )}
            {prefs.barba && (
              <div className="flex items-start gap-2">
                <span className="text-[10px] text-gold">🧔</span>
                <div>
                  <p className="text-[9px] text-faint uppercase tracking-wider font-bold">Barba</p>
                  <p className="text-xs text-primary">{prefs.barba}</p>
                </div>
              </div>
            )}
            {prefs.barbeiro_favorito && (
              <div className="flex items-start gap-2">
                <span className="text-[10px] text-gold">⭐</span>
                <div>
                  <p className="text-[9px] text-faint uppercase tracking-wider font-bold">Barbeiro Favorito</p>
                  <p className="text-xs text-primary">{prefs.barbeiro_favorito}</p>
                </div>
              </div>
            )}
            {prefs.alergias && prefs.alergias.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-[10px] text-orange-400">⚠️</span>
                <div>
                  <p className="text-[9px] text-faint uppercase tracking-wider font-bold">Alergias</p>
                  <p className="text-xs text-orange-300">{prefs.alergias.join(', ')}</p>
                </div>
              </div>
            )}
            {prefs.produtos && prefs.produtos.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="text-[10px] text-gold">🧴</span>
                <div>
                  <p className="text-[9px] text-faint uppercase tracking-wider font-bold">Produtos</p>
                  <p className="text-xs text-primary">{prefs.produtos.join(', ')}</p>
                </div>
              </div>
            )}
            {prefs.observacoes && (
              <div className="flex items-start gap-2">
                <span className="text-[10px] text-gold">📝</span>
                <div>
                  <p className="text-[9px] text-faint uppercase tracking-wider font-bold">Observações</p>
                  <p className="text-xs text-muted">{prefs.observacoes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Memories */}
      {memories.length > 0 && (
        <div className="px-5 py-4 flex-1 overflow-y-auto">
          <p className="text-[10px] font-bold uppercase tracking-wider text-faint mb-3 flex items-center gap-1.5">
            <Brain size={10} /> Memórias da IA
          </p>
          <div className="space-y-2">
            {memories.slice(0, 8).map(mem => {
              const typeConfig: Record<string, { icon: string; color: string }> = {
                preference: { icon: '✂️', color: 'border-gold/20 bg-gold/5' },
                behavior:   { icon: '📊', color: 'border-blue-500/20 bg-blue-950/30' },
                note:       { icon: '📝', color: 'border-border bg-surface' },
                summary:    { icon: '📋', color: 'border-emerald-500/20 bg-emerald-950/30' },
              };
              const cfg = typeConfig[mem.memory_type] ?? typeConfig.note;

              return (
                <div
                  key={mem.id}
                  className={cn('rounded-lg border px-3 py-2', cfg.color)}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] mt-0.5">{cfg.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-primary leading-snug">{mem.content}</p>
                      <p className="text-[8px] text-faint font-mono mt-1">
                        {format(parseISO(mem.created_at), "d MMM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}