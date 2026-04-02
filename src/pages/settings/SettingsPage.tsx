import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Building, Link as LinkIcon, Check, Loader2, Edit, Trash2, X, AlertTriangle, UserPlus } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';

export default function SettingsPage() {
  const { tenantId, loading: tenantLoading } = useTenant();
  const [activeTab, setActiveTab] = useState<'barbershop' | 'team' | 'integrations'>('barbershop');
  const [isSaving, setIsSaving] = useState(false);

  const [shopName, setShopName] = useState('BlackHub Barber Master');
  const [shopAddress, setShopAddress] = useState('Rua Principal, 123');

  // Team State
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any | null>(null);
  
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('barber');
  const [isSubmittingMember, setIsSubmittingMember] = useState(false);
  const [errorObj, setErrorObj] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'team' && tenantId) {
      fetchTeam();
    }
  }, [activeTab, tenantId]);

  const fetchTeam = async () => {
    setLoadingTeam(true);
    const { data, error } = await supabase
      .from('tenant_members')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTeamMembers(data);
    }
    setLoadingTeam(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert('Configurações salvas (mock)');
    }, 1000);
  };

  const openNewMemberModal = () => {
    setEditingMember(null);
    setMemberName('');
    setMemberRole('barber');
    setErrorObj(null);
    setIsTeamModalOpen(true);
  };

  const openEditMemberModal = (member: any) => {
    setEditingMember(member);
    setMemberName(member.display_name || '');
    setMemberRole(member.role);
    setErrorObj(null);
    setIsTeamModalOpen(true);
  };

  const saveTeamMember = async () => {
    if (!memberName.trim() || !tenantId) return;
    
    setIsSubmittingMember(true);
    setErrorObj(null);
    
    const payload = {
      tenant_id: tenantId,
      display_name: memberName,
      role: memberRole,
      is_active: true
    };

    try {
      if (editingMember) {
        const { error } = await supabase
          .from('tenant_members')
          .update(payload)
          .eq('id', editingMember.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('tenant_members')
          .insert([payload]);
        if (error) throw error;
      }
      
      setIsTeamModalOpen(false);
      fetchTeam();
    } catch (err: any) {
      console.error(err);
      setErrorObj(err.message || 'Erro ao salvar membro da equipe.');
    } finally {
      setIsSubmittingMember(false);
    }
  };

  const deleteTeamMember = async (id: string) => {
    if (confirm('Tem certeza que deseja remover este membro da equipe?')) {
      await supabase.from('tenant_members').delete().eq('id', id);
      fetchTeam();
    }
  };

  if (tenantLoading) return null;

  const tabs = [
    { key: 'barbershop' as const, label: 'Barbearia', icon: Building },
    { key: 'team' as const, label: 'Equipe', icon: Users },
    { key: 'integrations' as const, label: 'Integrações', icon: LinkIcon },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <header className="mb-8">
        <p className="text-sm text-primary/40 font-medium mb-1">Painel</p>
        <h1 className="text-3xl font-heading font-medium tracking-tight text-primary">Configurações</h1>
      </header>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 shrink-0 lg:w-56">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all shrink-0 w-full text-left",
                activeTab === tab.key
                  ? "bg-primary text-white shadow-md shadow-primary/15"
                  : "text-primary/50 hover:text-primary hover:bg-white bg-transparent"
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl border border-primary/[0.06] shadow-sm p-6 lg:p-8"
          >
            {activeTab === 'barbershop' && (
              <form onSubmit={handleSave} className="space-y-6 max-w-xl">
                <h2 className="text-lg font-heading font-medium tracking-tight text-primary border-b border-primary/[0.06] pb-4">
                  Dados do Estabelecimento
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-primary/40 uppercase tracking-wider block mb-2">Nome da Barbearia</label>
                    <input
                      type="text"
                      value={shopName}
                      onChange={e => setShopName(e.target.value)}
                      className="w-full px-4 py-3 bg-bg border border-primary/8 rounded-xl outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-all text-sm font-medium"
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-bold text-primary/40 uppercase tracking-wider block mb-2">Endereço Completo</label>
                    <input
                      type="text"
                      value={shopAddress}
                      onChange={e => setShopAddress(e.target.value)}
                      className="w-full px-4 py-3 bg-bg border border-primary/8 rounded-xl outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-all text-sm font-medium"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-primary/[0.06]">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="py-3 px-6 bg-primary text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <><Check size={18} /> Salvar Alterações</>}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'team' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-primary/[0.06] pb-4">
                  <h2 className="text-lg font-heading font-medium tracking-tight text-primary">
                    Gestão da Equipe
                  </h2>
                  <button 
                    onClick={openNewMemberModal}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-all"
                  >
                    <UserPlus size={16} />
                    Novo Barbeiro
                  </button>
                </div>
                
                {loadingTeam ? (
                  <div className="flex justify-center p-12"><Loader2 className="animate-spin text-secondary" size={32} /></div>
                ) : teamMembers.length === 0 ? (
                  <div className="p-8 bg-bg text-center rounded-xl border border-dashed border-primary/10">
                    <Users className="mx-auto mb-3 text-primary/20" size={32} />
                    <p className="text-sm font-medium text-primary/50">Nenhum membro cadastrado nesta barbearia.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {teamMembers.map(member => (
                      <div key={member.id} className="flex items-center justify-between p-4 bg-bg/60 rounded-xl border border-primary/[0.06] hover:border-primary/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-secondary/15 rounded-xl flex items-center justify-center text-sm font-bold text-secondary">
                            {member.display_name?.charAt(0).toUpperCase() || 'M'}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-primary">{member.display_name || 'Sem Nome'}</p>
                            <p className="text-[10px] font-bold text-primary/35 uppercase tracking-wider">{member.role}</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={() => openEditMemberModal(member)} className="p-2 text-primary/30 hover:text-primary hover:bg-white rounded-lg transition-all">
                            <Edit size={15} />
                          </button>
                          <button onClick={() => deleteTeamMember(member.id)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <h2 className="text-lg font-heading font-medium tracking-tight text-primary border-b border-primary/[0.06] pb-4">
                  Integrações (WhatsApp & N8N)
                </h2>
                <div className="p-8 bg-bg text-center rounded-xl border border-dashed border-primary/10">
                  <LinkIcon className="mx-auto mb-3 text-primary/20" size={32} />
                  <p className="text-sm font-medium text-primary/50">Configurações de Webhook e Tokens em breve.</p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Team Member Modal */}
      <AnimatePresence>
        {isTeamModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setIsTeamModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative z-10"
            >
              <div className="p-6 border-b border-primary/[0.06] flex justify-between items-center">
                <h3 className="font-heading font-medium tracking-tight text-lg text-primary">{editingMember ? 'Editar Barbeiro' : 'Novo Barbeiro'}</h3>
                <button onClick={() => setIsTeamModalOpen(false)} className="p-1.5 text-primary/30 hover:text-primary hover:bg-bg rounded-lg transition-all">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {errorObj && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <AlertTriangle size={16} /> {errorObj}
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-primary/40 uppercase tracking-wider block mb-2">
                      Nome do Barbeiro
                    </label>
                    <input
                      type="text"
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                      placeholder="Ex: João Silva"
                      className="w-full px-4 py-3 bg-bg border border-primary/8 rounded-xl outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-all text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-primary/40 uppercase tracking-wider block mb-2">
                      Nível de Acesso
                    </label>
                    <select
                      value={memberRole}
                      onChange={(e) => setMemberRole(e.target.value)}
                      className="w-full px-4 py-3 bg-bg border border-primary/8 rounded-xl outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-all text-sm font-medium"
                    >
                      <option value="barber">Barbeiro</option>
                      <option value="admin">Administrador</option>
                      <option value="owner">Dono</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => setIsTeamModalOpen(false)}
                    className="flex-1 py-3 border border-primary/10 text-primary rounded-xl font-semibold text-sm flex items-center justify-center hover:bg-bg transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={saveTeamMember}
                    disabled={isSubmittingMember || !memberName.trim()}
                    className="flex-[2] py-3 bg-primary text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isSubmittingMember ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                    {editingMember ? 'Salvar' : 'Criar Barbeiro'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
