import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Phone, Mail, AtSign, Star, Clock, Scissors, Brain } from 'lucide-react';
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
    <aside className="w-full lg:w-[300px] lg:shrink-0 bg-white border-l border-line flex flex-col overflow-y-auto">
      <div className="px-5 py-6 border-b border-line text-center">
        <div className="w-14 h-14 rounded-full bg-gold-soft text-gold-dark flex items-center justify-center text-xl font-semibold mx-auto mb-3">
          {customer.name?.charAt(0).toUpperCase()}
        </div>
        <h3 className="text-base font-bold text-ink">{customer.name}</h3>
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
          {customer.phone && (
            <span className="flex items-center gap-1 text-[12px] text-ink-soft">
              <Phone size={10} className="text-ink-faint" /> {customer.phone}
            </span>
          )}
          {customer.email && (
            <span className="flex items-center gap-1 text-[12px] text-ink-soft">
              <Mail size={10} className="text-ink-faint" /> {customer.email}
            </span>
          )}
          {customer.instagram_handle && (
            <span className="flex items-center gap-1 text-[12px] text-ink-soft">
              <AtSign size={10} className="text-ink-faint" /> @{customer.instagram_handle}
            </span>
          )}
        </div>
        {customer.tags && customer.tags.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mt-3">
            {customer.tags.map((tag) => (
              <span key={tag} className="badge-gold text-[10px]">{tag}</span>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 py-4 border-b border-line">
        <p className="label-muted flex items-center gap-1.5 mb-3"><Star size={10} /> Resumo</p>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-[#F7F6F4] rounded-xl p-2.5 text-center">
            <p className="text-base font-bold text-ink">{customer.total_visits ?? 0}</p>
            <p className="text-[10px] text-ink-faint font-semibold uppercase tracking-wide mt-0.5">Visitas</p>
          </div>
          <div className="bg-[#F7F6F4] rounded-xl p-2.5 text-center">
            <p className="text-base font-bold text-[#9C7B47]">R${Number(customer.total_spent ?? 0).toFixed(0)}</p>
            <p className="text-[10px] text-ink-faint font-semibold uppercase tracking-wide mt-0.5">Gasto</p>
          </div>
          <div className="bg-[#F7F6F4] rounded-xl p-2.5 text-center">
            <p className="text-base font-bold text-[#11895C]">{customer.loyalty_points ?? 0}</p>
            <p className="text-[10px] text-ink-faint font-semibold uppercase tracking-wide mt-0.5">Pontos</p>
          </div>
        </div>
        {customer.last_visit_at && (
          <p className="text-[12px] text-ink-soft mt-2.5 flex items-center gap-1">
            <Clock size={11} className="text-ink-faint" />
            Última visita: {format(parseISO(customer.last_visit_at), "d 'de' MMM", { locale: ptBR })}
          </p>
        )}
      </div>

      {prefs && Object.keys(prefs).length > 0 && (
        <div className="px-5 py-4 border-b border-line">
          <p className="label-muted flex items-center gap-1.5 mb-3"><Scissors size={10} /> Preferências</p>
          <div className="space-y-2.5">
            {prefs.corte_preferido && (
              <div>
                <p className="text-[10px] text-ink-faint font-semibold uppercase tracking-wide">Corte</p>
                <p className="text-sm text-ink mt-0.5">{prefs.corte_preferido}</p>
              </div>
            )}
            {prefs.barba && (
              <div>
                <p className="text-[10px] text-ink-faint font-semibold uppercase tracking-wide">Barba</p>
                <p className="text-sm text-ink mt-0.5">{prefs.barba}</p>
              </div>
            )}
            {prefs.barbeiro_favorito && (
              <div>
                <p className="text-[10px] text-ink-faint font-semibold uppercase tracking-wide">Barbeiro favorito</p>
                <p className="text-sm text-ink mt-0.5">{prefs.barbeiro_favorito}</p>
              </div>
            )}
            {prefs.alergias && prefs.alergias.length > 0 && (
              <div>
                <p className="text-[10px] text-[#D84A4A] font-semibold uppercase tracking-wide">Alergias</p>
                <p className="text-sm text-[#D84A4A] mt-0.5">{prefs.alergias.join(', ')}</p>
              </div>
            )}
            {prefs.produtos && prefs.produtos.length > 0 && (
              <div>
                <p className="text-[10px] text-ink-faint font-semibold uppercase tracking-wide">Produtos</p>
                <p className="text-sm text-ink mt-0.5">{prefs.produtos.join(', ')}</p>
              </div>
            )}
            {prefs.observacoes && (
              <div>
                <p className="text-[10px] text-ink-faint font-semibold uppercase tracking-wide">Observações</p>
                <p className="text-sm text-ink-soft mt-0.5">{prefs.observacoes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {memories.length > 0 && (
        <div className="px-5 py-4">
          <p className="label-muted flex items-center gap-1.5 mb-3"><Brain size={10} /> Memórias da IA</p>
          <div className="space-y-2">
            {memories.slice(0, 8).map((mem) => {
              const typeConfig: Record<string, { color: string }> = {
                preference: { color: 'border-[#E9DEC9] bg-[#E9DEC9]/30' },
                behavior:   { color: 'border-[#EAF1FF] bg-[#EAF1FF]' },
                note:       { color: 'border-line bg-[#F7F6F4]' },
                summary:    { color: 'border-[#E8F6F0] bg-[#E8F6F0]' },
              };
              const cfg = typeConfig[mem.memory_type] ?? typeConfig.note;
              return (
                <div key={mem.id} className={cn('rounded-xl border px-3 py-2.5', cfg.color)}>
                  <p className="text-[12px] text-ink leading-snug">{mem.content}</p>
                  <p className="text-[10px] text-ink-faint mt-1">
                    {format(parseISO(mem.created_at), "d MMM 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
