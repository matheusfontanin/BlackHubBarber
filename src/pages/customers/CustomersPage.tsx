import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IMaskInput } from 'react-imask';
import {
  Plus,
  Search,
  Users,
  Phone,
  Mail,
  Edit2,
  Trash2,
  X,
  Check,
  Loader2
} from 'lucide-react';
import { crudService, Customer } from '@/services/crudService';
import { useTenant } from '@/hooks/useTenant';

export default function CustomersPage() {
  const { tenantId, loading: tenantLoading } = useTenant();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (tenantId) fetchCustomers();
  }, [tenantId]);

  const fetchCustomers = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const data = await crudService.getCustomers(tenantId);
      setCustomers(data);
    } catch (error: unknown) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setName(customer.name);
      setPhone(customer.phone);
      setEmail(customer.email || '');
      setNotes(customer.notes || '');
    } else {
      setEditingCustomer(null);
      setName('');
      setPhone('');
      setEmail('');
      setNotes('');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setIsSaving(true);
    try {
      const customerData = { name, phone, email, notes, tenant_id: tenantId };
      if (editingCustomer?.id) {
        await crudService.updateCustomer(editingCustomer.id, customerData);
      } else {
        await crudService.createCustomer(customerData);
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (error: unknown) {
      console.error('Erro ao salvar cliente:', error);
      alert('Erro ao salvar cliente. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    try {
      await crudService.deleteCustomer(id);
      fetchCustomers();
    } catch (error: unknown) {
      console.error('Erro ao excluir cliente:', error);
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  if (tenantLoading) return null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-24 md:pb-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 md:mb-8">
        <div>
          <p className="text-[11px] sm:text-xs text-muted font-semibold mb-1 uppercase tracking-wider">Gestão</p>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-primary italic heading-underline">Clientes</h1>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" size={15} />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-dark pl-10"
            />
          </div>
          {/* Desktop: inline button; Mobile: floating FAB (see below) */}
          <button
            onClick={() => handleOpenModal()}
            className="btn-gold hidden md:flex items-center gap-2 shrink-0"
          >
            <Plus size={16} /> Novo Cliente
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-gold" size={36} />
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
            <Users size={28} className="text-gold/60" />
          </div>
          <p className="text-muted font-medium">Nenhum cliente encontrado</p>
          <p className="text-faint text-sm mt-1">Adicione seu primeiro cliente para começar</p>
        </div>
      ) : (
        <>
          {/* ── Mobile: card list ── */}
          <div className="md:hidden grid grid-cols-1 gap-3">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="card p-4 flex items-start gap-3"
              >
                <div className="w-11 h-11 rounded-xl bg-gold/10 border border-gold/20 text-gold flex items-center justify-center font-bold text-base shrink-0">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-primary truncate">{customer.name}</p>
                  <div className="mt-1 space-y-0.5">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-muted">
                      <Phone size={10} className="text-faint shrink-0" /> <span className="truncate">{customer.phone}</span>
                    </div>
                    {customer.email && (
                      <div className="flex items-center gap-2 text-[11px] font-mono text-faint">
                        <Mail size={10} className="text-faint shrink-0" /> <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                  </div>
                  {customer.notes && (
                    <p className="mt-2 text-[11px] text-muted line-clamp-2">{customer.notes}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={() => handleOpenModal(customer)}
                    aria-label="Editar cliente"
                    className="p-2 bg-surface/60 border border-border rounded-lg text-muted active:text-primary"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => customer.id && handleDelete(customer.id)}
                    aria-label="Excluir cliente"
                    className="p-2 bg-surface/60 border border-border rounded-lg text-muted active:text-error"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Desktop: table ── */}
          <div className="hidden md:block card overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-faint">Nome</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-faint">Contato</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-faint hidden md:table-cell">Notas</th>
                  <th className="px-6 py-4 text-right text-[10px] uppercase tracking-widest font-bold text-faint">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-surface/40 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/20 text-gold flex items-center justify-center font-bold text-sm">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-sm text-primary">{customer.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-mono text-muted">
                          <Phone size={11} className="text-faint" /> {customer.phone}
                        </div>
                        {customer.email && (
                          <div className="flex items-center gap-2 text-xs font-mono text-faint">
                            <Mail size={11} className="text-faint" /> {customer.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted max-w-xs truncate hidden md:table-cell">
                      {customer.notes || <span className="text-faint italic">—</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenModal(customer)}
                          className="p-2 hover:bg-surface rounded-lg transition-colors text-muted hover:text-primary"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => customer.id && handleDelete(customer.id)}
                          className="p-2 hover:bg-surface rounded-lg transition-colors text-muted hover:text-error"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Mobile floating action button */}
      <button
        onClick={() => handleOpenModal()}
        aria-label="Novo cliente"
        className="md:hidden fixed bottom-5 right-5 z-30 w-14 h-14 rounded-2xl bg-gradient-to-br from-gold to-gold-light text-sidebar shadow-[0_6px_24px_rgba(201,168,76,0.4)] flex items-center justify-center active:scale-95 transition-transform"
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              className="bg-bg border-t sm:border border-border2 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-[0_16px_60px_rgba(0,0,0,0.6)] overflow-hidden max-h-[92vh] flex flex-col"
            >
              <div className="h-0.5 w-full bg-gradient-to-r from-gold/0 via-gold to-gold/0" />
              <div className="bg-sidebar border-b border-border px-6 py-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/25 flex items-center justify-center">
                    <Users size={15} className="text-gold" />
                  </div>
                  <h3 className="font-heading font-bold text-lg text-primary italic">
                    {editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}
                  </h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-primary transition-colors p-1">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5 overflow-y-auto">
                <div className="space-y-1">
                  <label className="label-xs">Nome Completo</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-dark"
                    placeholder="ex: João Silva"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="label-xs"><Phone size={11} /> WhatsApp</label>
                    <IMaskInput
                      mask="(00) 00000-0000"
                      value={phone}
                      onAccept={(value: string) => setPhone(value)}
                      className="input-dark font-mono"
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="label-xs"><Mail size={11} /> Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-dark font-mono"
                      placeholder="ex@email.com"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="label-xs">Observações</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input-dark resize-none h-24"
                    placeholder="Preferências, alergias, etc..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-gold w-full py-3.5 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : (
                    <><Check size={16} /> {editingCustomer ? 'Salvar Alterações' : 'Cadastrar Cliente'}</>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
