import { useState, useEffect } from 'react';
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

  // Form State
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
      const customerData = {
        name,
        phone,
        email,
        notes,
        tenant_id: tenantId,
      };

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
    <div className="min-h-screen bg-bg text-primary font-sans p-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-serif italic mb-2">Clientes</h1>
          <p className="text-[10px] opacity-50 uppercase tracking-[0.2em] font-mono font-bold">Gerencie sua base de clientes</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={16} />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-primary/5 rounded-lg outline-none focus:border-secondary transition-all text-sm font-bold"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-primary text-bg px-6 py-3 rounded-lg text-sm font-bold flex items-center gap-2 hover:scale-105 transition-transform shrink-0"
          >
            <Plus size={18} /> Novo Cliente
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-secondary" size={40} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-primary/5 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-bg/30 text-[10px] uppercase tracking-widest font-bold text-primary/50">
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Contato</th>
                <th className="px-6 py-4">Notas</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-bg/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-bold text-xs">
                        {customer.name.charAt(0)}
                      </div>
                      <span className="font-bold text-sm">{customer.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <Phone size={12} className="opacity-30" /> {customer.phone}
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-2 text-xs font-mono opacity-50">
                          <Mail size={12} className="opacity-30" /> {customer.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs opacity-50 max-w-xs truncate">
                    {customer.notes || '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(customer)} className="p-2 hover:bg-bg/50 rounded transition-colors text-blue-600"><Edit2 size={16}/></button>
                      <button onClick={() => customer.id && handleDelete(customer.id)} className="p-2 hover:bg-bg/50 rounded transition-colors text-red-600"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Novo/Editar Cliente */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-primary/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="bg-primary p-6 text-bg flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Users className="text-secondary" size={20} />
                  <h3 className="font-serif italic text-xl">{editingCustomer ? 'Editar Cliente' : 'Novo Cliente'}</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="opacity-50 hover:opacity-100 transition-opacity">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-bold opacity-50 flex items-center gap-2">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 bg-bg/30 border border-transparent focus:border-secondary rounded-lg outline-none transition-all text-sm font-bold"
                      placeholder="ex: João Silva"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest font-bold opacity-50 flex items-center gap-2">
                        <Phone size={12} /> WhatsApp
                      </label>
                      <IMaskInput
                        mask="(00) 00000-0000"
                        value={phone}
                        onAccept={(value: string) => setPhone(value)}
                        className="w-full px-4 py-3 bg-bg/30 border border-transparent focus:border-secondary rounded-lg outline-none transition-all text-sm font-mono"
                        placeholder="(00) 00000-0000"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest font-bold opacity-50 flex items-center gap-2">
                        <Mail size={12} /> Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-bg/30 border border-transparent focus:border-secondary rounded-lg outline-none transition-all text-sm font-mono"
                        placeholder="ex@email.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-bold opacity-50 flex items-center gap-2">
                      Observações
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-4 py-3 bg-bg/30 border border-transparent focus:border-secondary rounded-lg outline-none transition-all text-sm font-bold resize-none h-24"
                      placeholder="Preferências, alergias, etc..."
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-4 bg-primary text-bg rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : (
                    <>
                      {editingCustomer ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                      <Check size={18} />
                    </>
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
