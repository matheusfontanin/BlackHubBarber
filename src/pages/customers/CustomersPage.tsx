import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
  Loader2,
} from 'lucide-react';
import type { Customer } from '@/services/crudService';
import { useTenant } from '@/hooks/useTenant';
import {
  useCustomers,
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from '@/hooks/queries/useCustomers';
import { customerFormSchema, type CustomerFormValues } from '@/schemas/customerSchema';
import { handleError, handleSuccess } from '@/lib/errors';

export default function CustomersPage() {
  const { tenantId, loading: tenantLoading } = useTenant();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: customers = [], isLoading } = useCustomers(tenantId);
  const createMutation = useCreateCustomer(tenantId);
  const updateMutation = useUpdateCustomer(tenantId);
  const deleteMutation = useDeleteCustomer(tenantId);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: { name: '', phone: '', email: '', notes: '' },
  });

  const phone = watch('phone');

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      reset({
        name: customer.name,
        phone: customer.phone,
        email: customer.email ?? '',
        notes: customer.notes ?? '',
      });
    } else {
      setEditingCustomer(null);
      reset({ name: '', phone: '', email: '', notes: '' });
    }
    setIsModalOpen(true);
  };

  const onSubmit = async (values: CustomerFormValues) => {
    if (!tenantId) return;
    const payload = {
      name: values.name,
      phone: values.phone,
      email: values.email,
      notes: values.notes,
      tenant_id: tenantId,
    };
    try {
      if (editingCustomer?.id) {
        await updateMutation.mutateAsync({ id: editingCustomer.id, data: payload });
        handleSuccess('Cliente atualizado');
      } else {
        await createMutation.mutateAsync(payload);
        handleSuccess('Cliente cadastrado');
      }
      setIsModalOpen(false);
    } catch (err) {
      handleError(err, 'Não foi possível salvar o cliente');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      handleSuccess('Cliente removido');
    } catch (err) {
      handleError(err, 'Não foi possível excluir o cliente');
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm),
  );

  if (tenantLoading) return null;

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-7 pb-24 md:pb-8 max-w-[1600px] mx-auto">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Gestão</p>
          <h1 className="page-title">Clientes</h1>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" size={16} />
            <input
              type="text"
              placeholder="Buscar cliente…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <button onClick={() => handleOpenModal()} className="btn-primary hidden md:inline-flex shrink-0">
            <Plus size={16} /> Novo cliente
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-gold" size={32} />
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F7F6F4] flex items-center justify-center mb-4">
            <Users size={24} className="text-ink-soft" />
          </div>
          <p className="text-ink font-semibold">Nenhum cliente encontrado</p>
          <p className="text-ink-soft text-sm mt-1">Adicione seu primeiro cliente para começar.</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden grid grid-cols-1 gap-3">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="card p-4 flex items-start gap-3">
                <div className="w-11 h-11 rounded-full bg-[#E9DEC9] text-[#9C7B47] flex items-center justify-center font-semibold text-base shrink-0">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-ink truncate">{customer.name}</p>
                  <div className="mt-1 space-y-0.5">
                    <div className="flex items-center gap-2 text-[12px] text-ink-soft">
                      <Phone size={11} className="text-ink-faint shrink-0" /> <span className="truncate">{customer.phone}</span>
                    </div>
                    {customer.email && (
                      <div className="flex items-center gap-2 text-[12px] text-ink-faint">
                        <Mail size={11} className="text-ink-faint shrink-0" /> <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                  </div>
                  {customer.notes && (
                    <p className="mt-2 text-[12px] text-ink-soft line-clamp-2">{customer.notes}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => handleOpenModal(customer)} aria-label="Editar" className="btn-icon">
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => customer.id && handleDelete(customer.id)}
                    aria-label="Excluir"
                    className="btn-icon hover:text-[#D84A4A]"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block table-wrap">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Contato</th>
                  <th className="hidden md:table-cell">Notas</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="group">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#E9DEC9] text-[#9C7B47] flex items-center justify-center font-semibold text-[13px]">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-ink">{customer.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 text-[13px] text-ink-soft">
                          <Phone size={12} className="text-ink-faint" /> {customer.phone}
                        </div>
                        {customer.email && (
                          <div className="flex items-center gap-2 text-[12px] text-ink-faint">
                            <Mail size={12} /> {customer.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="text-[13px] text-ink-soft max-w-xs truncate hidden md:table-cell">
                      {customer.notes || <span className="text-ink-faint">—</span>}
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenModal(customer)} className="btn-icon">
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => customer.id && handleDelete(customer.id)}
                          className="btn-icon hover:text-[#D84A4A]"
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

      <button
        onClick={() => handleOpenModal()}
        aria-label="Novo cliente"
        className="md:hidden fixed bottom-5 right-5 z-30 w-14 h-14 rounded-2xl bg-[#BE9B64] text-white shadow-floating flex items-center justify-center active:scale-95 transition-transform"
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-[#12100D]/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              className="bg-surface border border-line w-full sm:max-w-md rounded-t-[20px] sm:rounded-[20px] shadow-floating overflow-hidden max-h-[92vh] flex flex-col"
            >
              <div className="px-6 py-4 flex justify-between items-center border-b border-line">
                <h3 className="text-lg font-bold text-ink">
                  {editingCustomer ? 'Editar cliente' : 'Novo cliente'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} aria-label="Fechar" className="btn-icon">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="label">Nome completo</label>
                  <input
                    type="text"
                    {...register('name')}
                    className="input"
                    placeholder="ex: João Silva"
                  />
                  {errors.name && (
                    <p className="text-[12px] text-[#D84A4A] mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label"><Phone size={13} /> WhatsApp</label>
                    <IMaskInput
                      mask="(00) 00000-0000"
                      value={phone ?? ''}
                      onAccept={(value: string) =>
                        setValue('phone', value, { shouldValidate: true })
                      }
                      className="input"
                      placeholder="(00) 00000-0000"
                    />
                    {errors.phone && (
                      <p className="text-[12px] text-[#D84A4A] mt-1">{errors.phone.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="label"><Mail size={13} /> Email</label>
                    <input
                      type="email"
                      {...register('email')}
                      className="input"
                      placeholder="ex@email.com"
                    />
                    {errors.email && (
                      <p className="text-[12px] text-[#D84A4A] mt-1">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="label">Observações</label>
                  <textarea
                    {...register('notes')}
                    className="input-textarea"
                    placeholder="Preferências, alergias, etc…"
                  />
                  {errors.notes && (
                    <p className="text-[12px] text-[#D84A4A] mt-1">{errors.notes.message}</p>
                  )}
                </div>

                <button type="submit" disabled={isSubmitting} className="btn-primary w-full h-12">
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : (
                    <><Check size={16} /> {editingCustomer ? 'Salvar alterações' : 'Cadastrar cliente'}</>
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
