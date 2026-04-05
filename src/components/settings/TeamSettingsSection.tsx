import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, UserPlus, Edit, Trash2, X, Check, Loader2, AlertTriangle, UserCheck, UserX, Calendar } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';
import { getBarbers, createBarber, updateBarber, deleteBarber, toggleBarberActive } from '@/services/teamService';
import type { Barber } from '@/types/settings';
import { IMaskInput } from 'react-imask';

const INPUT_CLS = "w-full px-4 py-3 bg-bg border border-primary/8 rounded-xl outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10 transition-all text-sm font-medium";
const LABEL_CLS = "text-[10px] font-bold text-primary/40 uppercase tracking-wider block mb-2";

export default function TeamSettingsSection() {
  const { tenantId } = useTenant();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Barber | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [role, setRole] = useState('barbeiro');
  const [phone, setPhone] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [notes, setNotes] = useState('');
  const [googleCalendarId, setGoogleCalendarId] = useState('');

  useEffect(() => {
    if (tenantId) fetchBarbers();
  }, [tenantId]);

  const fetchBarbers = async () => {
    setLoading(true);
    try {
      const data = await getBarbers(tenantId!);
      setBarbers(data);
    } catch (err) {
      console.error('Erro ao carregar equipe:', err);
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setEditing(null);
    setName(''); setRole('barbeiro'); setPhone(''); setSpecialties(''); setNotes(''); setGoogleCalendarId('');
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (barber: Barber) => {
    setEditing(barber);
    setName(barber.name);
    setRole(barber.role);
    setPhone(barber.phone ?? '');
    setSpecialties(barber.specialties ?? '');
    setNotes(barber.notes ?? '');
    setGoogleCalendarId(barber.google_calendar_id ?? '');
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !tenantId) return;
    setSubmitting(true);
    setError(null);
    try {
      if (editing?.id) {
        await updateBarber(editing.id, { name, role, phone: phone || null, specialties: specialties || null, notes: notes || null, google_calendar_id: googleCalendarId || null });
      } else {
        await createBarber({ tenant_id: tenantId, name, role, phone: phone || null, specialties: specialties || null, notes: notes || null, google_calendar_id: googleCalendarId || null, is_active: true });
      }
      setModalOpen(false);
      fetchBarbers();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar barbeiro.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este barbeiro?')) return;
    try {
      await deleteBarber(id);
      fetchBarbers();
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    try {
      await toggleBarberActive(id, !currentActive);
      fetchBarbers();
    } catch (err) {
      console.error('Erro ao alterar status:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-primary/[0.06] pb-4">
        <h2 className="text-lg font-heading font-medium tracking-tight text-primary">
          Gestão da Equipe
        </h2>
        <button
          onClick={openNew}
          className="btn-gold flex items-center gap-2"
        >
          <UserPlus size={16} />
          Novo Barbeiro
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-secondary" size={32} /></div>
      ) : barbers.length === 0 ? (
        <div className="p-8 bg-bg text-center rounded-xl border border-dashed border-primary/10">
          <Users className="mx-auto mb-3 text-primary/20" size={32} />
          <p className="text-sm font-medium text-primary/50">Nenhum barbeiro cadastrado.</p>
          <p className="text-xs text-primary/30 mt-1">Cadastre sua equipe para preparar a agenda por barbeiro.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {barbers.map(barber => (
            <div
              key={barber.id}
              className={`flex items-center justify-between p-4 bg-bg/60 rounded-xl border transition-colors ${barber.is_active ? 'border-primary/[0.06] hover:border-primary/10' : 'border-red-100 bg-red-50/30 opacity-60'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${barber.is_active ? 'bg-secondary/15 text-secondary' : 'bg-primary/10 text-primary/30'}`}>
                  {barber.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm text-primary">{barber.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-primary/35 uppercase tracking-wider">{barber.role}</span>
                    {barber.specialties && (
                      <span className="text-[10px] text-secondary/60">• {barber.specialties}</span>
                    )}
                    {barber.google_calendar_id && (
                      <span className="text-[10px] text-green-500/70 flex items-center gap-0.5"><Calendar size={9} /> Calendar</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleToggle(barber.id!, barber.is_active)}
                  className={`p-2 rounded-lg transition-all ${barber.is_active ? 'text-green-400 hover:text-green-600 hover:bg-green-50' : 'text-red-300 hover:text-green-600 hover:bg-green-50'}`}
                  title={barber.is_active ? 'Inativar' : 'Ativar'}
                >
                  {barber.is_active ? <UserCheck size={15} /> : <UserX size={15} />}
                </button>
                <button onClick={() => openEdit(barber)} className="p-2 text-primary/30 hover:text-primary hover:bg-white/10 rounded-lg transition-all">
                  <Edit size={15} />
                </button>
                <button onClick={() => handleDelete(barber.id!)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="bg-surface border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative z-10">
              <div className="p-6 border-b border-primary/[0.06] flex justify-between items-center">
                <h3 className="font-heading font-medium tracking-tight text-lg text-primary">{editing ? 'Editar Barbeiro' : 'Novo Barbeiro'}</h3>
                <button onClick={() => setModalOpen(false)} className="p-1.5 text-primary/30 hover:text-primary hover:bg-bg rounded-lg transition-all"><X size={18} /></button>
              </div>

              <div className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <AlertTriangle size={16} /> {error}
                  </div>
                )}

                <div>
                  <label className={LABEL_CLS}>Nome</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Nome do barbeiro" className={INPUT_CLS} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL_CLS}>Cargo / Função</label>
                    <select value={role} onChange={e => setRole(e.target.value)} className={INPUT_CLS}>
                      <option value="barbeiro">Barbeiro</option>
                      <option value="barbeiro_senior">Barbeiro Sênior</option>
                      <option value="aprendiz">Aprendiz</option>
                      <option value="gerente">Gerente</option>
                    </select>
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Telefone</label>
                    <IMaskInput 
                      mask="(00) 00000-0000"
                      value={phone} 
                      onAccept={(value: string) => setPhone(value)} 
                      placeholder="(11) 99999-9999" 
                      className={INPUT_CLS} 
                    />
                  </div>
                </div>
                <div>
                  <label className={LABEL_CLS}>Especialidades</label>
                  <input type="text" value={specialties} onChange={e => setSpecialties(e.target.value)} placeholder="Degradê, barba, platinado..." className={INPUT_CLS} />
                </div>
                <div>
                  <label className={LABEL_CLS}>Google Calendar ID</label>
                  <input type="text" value={googleCalendarId} onChange={e => setGoogleCalendarId(e.target.value)} placeholder="xxxx@group.calendar.google.com" className={INPUT_CLS} />
                  <p className="text-[10px] text-primary/30 mt-1">ID do Google Calendar do barbeiro para controlar a agenda.</p>
                </div>
                <div>
                  <label className={LABEL_CLS}>Observações</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas internas sobre o barbeiro" className={`${INPUT_CLS} resize-none`} rows={2} />
                </div>

                <div className="pt-2 flex gap-3">
                  <button onClick={() => setModalOpen(false)} className="flex-1 py-3 border border-primary/10 text-primary rounded-xl font-semibold text-sm flex items-center justify-center hover:bg-bg transition-all">
                    Cancelar
                  </button>
                  <button onClick={handleSave} disabled={submitting || !name.trim()} className="btn-gold flex-[2] flex items-center justify-center gap-2">
                    {submitting ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                    {editing ? 'Salvar' : 'Criar Barbeiro'}
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
