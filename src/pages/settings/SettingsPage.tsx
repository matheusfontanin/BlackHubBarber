import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings as SettingsIcon, Users, Building, Link as LinkIcon, Check, Loader2 } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { tenantId, loading: tenantLoading } = useTenant();
  const [activeTab, setActiveTab] = useState<'barbershop' | 'team' | 'integrations'>('barbershop');
  const [isSaving, setIsSaving] = useState(false);

  // Mocks for now - would fetch these using a settings service
  const [shopName, setShopName] = useState('BlackHub Barber Master');
  const [shopAddress, setShopAddress] = useState('Rua Principal, 123');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // TODO: implement actual save using CRUD Service targeting settings table
    setTimeout(() => {
      setIsSaving(false);
      alert('Configurações salvas (mock)');
    }, 1000);
  };

  if (tenantLoading) return null;

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto min-h-screen">
      <header className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <SettingsIcon className="text-secondary" size={20} />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-medium tracking-tight text-primary">Configurações</h1>
            <p className="text-[10px] uppercase tracking-widest font-bold text-primary/40 mt-1">
              Gerencie opções do seu estabelecimento
            </p>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Nav */}
        <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 shrink-0 lg:w-64">
          <button
            onClick={() => setActiveTab('barbershop')}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all shrink-0",
              activeTab === 'barbershop'
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "text-primary/40 hover:text-primary hover:bg-primary/5 bg-white border border-primary/5"
            )}
          >
            <Building size={18} />
            Barbearia
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all shrink-0",
              activeTab === 'team'
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "text-primary/40 hover:text-primary hover:bg-primary/5 bg-white border border-primary/5"
            )}
          >
            <Users size={18} />
            Equipe
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all shrink-0",
              activeTab === 'integrations'
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "text-primary/40 hover:text-primary hover:bg-primary/5 bg-white border border-primary/5"
            )}
          >
            <LinkIcon size={18} />
            Integrações
          </button>
        </nav>

        {/* Content Area */}
        <div className="flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl border border-primary/5 shadow-sm p-6 lg:p-8"
          >
            {activeTab === 'barbershop' && (
              <form onSubmit={handleSave} className="space-y-6 max-w-xl">
                <h2 className="text-xl font-heading font-medium tracking-tight text-primary border-b border-primary/5 pb-4 mb-6">
                  Dados do Estabelecimento
                </h2>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-bold opacity-50 block">Nome da Barbearia</label>
                    <input
                      type="text"
                      value={shopName}
                      onChange={e => setShopName(e.target.value)}
                      className="w-full px-4 py-3 bg-bg/50 border border-primary/10 rounded-lg outline-none focus:border-secondary transition-all text-sm font-bold"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-bold opacity-50 block">Endereço Completo</label>
                    <input
                      type="text"
                      value={shopAddress}
                      onChange={e => setShopAddress(e.target.value)}
                      className="w-full px-4 py-3 bg-bg/50 border border-primary/10 rounded-lg outline-none focus:border-secondary transition-all text-sm font-bold"
                    />
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-primary/5">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="py-3 px-6 bg-primary text-bg rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <><Check size={18} /> Salvar Alterações</>}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'team' && (
              <div className="space-y-6">
                 <h2 className="text-xl font-heading font-medium tracking-tight text-primary border-b border-primary/5 pb-4 mb-6">
                  Gestão da Equipe
                </h2>
                <div className="p-6 bg-bg text-center rounded-xl border border-primary/5 border-dashed">
                  <p className="text-sm font-bold text-primary/60">Em breve você poderá adicionar seus barbeiros aqui.</p>
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-6">
                 <h2 className="text-xl font-heading font-medium tracking-tight text-primary border-b border-primary/5 pb-4 mb-6">
                  Integrações (WhatsApp & N8N)
                </h2>
                <div className="p-6 bg-bg text-center rounded-xl border border-primary/5 border-dashed">
                  <p className="text-sm font-bold text-primary/60">Configurações de Webhook e Tokens virão em atualizações futuras.</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
