import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IMaskInput } from 'react-imask';
import {
  Plus,
  Search,
  Scissors,
  Clock,
  DollarSign,
  Edit2,
  Trash2,
  X,
  Check,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { crudService, Service } from '@/services/crudService';
import { useTenant } from '@/hooks/useTenant';

export default function ServicesPage() {
  const { tenantId, loading: tenantLoading } = useTenant();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (tenantId) fetchServices();
  }, [tenantId]);

  const fetchServices = async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const data = await crudService.getServices(tenantId);
      setServices(data);
    } catch (error: unknown) {
      console.error('Erro ao buscar serviços:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setName(service.name);
      setPrice(service.price.toString());
      setDuration(service.duration_minutes.toString());
      setDescription(service.description || '');
    } else {
      setEditingService(null);
      setName('');
      setPrice('');
      setDuration('');
      setDescription('');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId) return;
    setIsSaving(true);
    try {
      const cleanPrice = parseFloat(price.replace(/[^\d.,]/g, '').replace(',', '.'));
      const serviceData = {
        name,
        price: cleanPrice,
        duration_minutes: parseInt(duration),
        description,
        tenant_id: tenantId,
      };
      if (editingService?.id) {
        await crudService.updateService(editingService.id, serviceData);
      } else {
        await crudService.createService(serviceData);
      }
      setIsModalOpen(false);
      fetchServices();
    } catch (error: unknown) {
      console.error('Erro ao salvar serviço:', error);
      alert('Erro ao salvar serviço. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;
    try {
      await crudService.deleteService(id);
      fetchServices();
    } catch (error: unknown) {
      console.error('Erro ao excluir serviço:', error);
    }
  };

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (tenantLoading) return null;

  return (
    <div className="p-6 lg:p-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <p className="text-xs text-muted font-semibold mb-1 uppercase tracking-wider">Catálogo</p>
          <h1 className="text-3xl font-heading font-bold text-primary italic heading-underline">Serviços</h1>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" size={15} />
            <input
              type="text"
              placeholder="Buscar serviço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-dark pl-10"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="btn-gold flex items-center gap-2 shrink-0"
          >
            <Plus size={16} /> Novo Serviço
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-gold" size={36} />
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mb-4">
            <Scissors size={28} className="text-gold/60" />
          </div>
          <p className="text-muted font-medium">Nenhum serviço encontrado</p>
          <p className="text-faint text-sm mt-1">Adicione seu primeiro serviço clicando em "Novo Serviço"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((service, i) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-6 group hover:border-gold/20 hover:shadow-[0_4px_24px_rgba(201,168,76,0.08)] transition-all duration-300"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-gold/10 border border-gold/20 text-gold rounded-xl">
                  <Scissors size={22} />
                </div>
                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenModal(service)}
                    className="p-2 hover:bg-surface rounded-lg transition-colors text-muted hover:text-primary"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => service.id && handleDelete(service.id)}
                    className="p-2 hover:bg-surface rounded-lg transition-colors text-muted hover:text-error"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <h3 className="font-heading font-bold text-xl text-primary italic mb-1">{service.name}</h3>
              <p className="text-xs text-muted mb-4 line-clamp-2">{service.description || 'Sem descrição.'}</p>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-muted">
                  <Clock size={13} /> {service.duration_minutes} min
                </div>
                <div className="text-lg font-mono font-bold text-gold">
                  R$ {Number(service.price).toFixed(2)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              className="bg-bg border border-border2 w-full max-w-md rounded-2xl shadow-[0_16px_60px_rgba(0,0,0,0.6)] overflow-hidden"
            >
              {/* Modal header */}
              <div className="h-0.5 w-full bg-gradient-to-r from-gold/0 via-gold to-gold/0" />
              <div className="bg-sidebar border-b border-border px-6 py-5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/25 flex items-center justify-center">
                    <Scissors size={15} className="text-gold" />
                  </div>
                  <h3 className="font-heading font-bold text-lg text-primary italic">
                    {editingService ? 'Editar Serviço' : 'Novo Serviço'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-muted hover:text-primary transition-colors p-1"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-5">
                <div className="space-y-1">
                  <label className="label-xs">Nome do Serviço</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-dark"
                    placeholder="ex: Corte Degradê"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="label-xs"><DollarSign size={11} /> Preço (R$)</label>
                    <IMaskInput
                      mask="R$ num"
                      blocks={{
                        num: {
                          mask: Number,
                          thousandsSeparator: '.',
                          padFractionalZeros: true,
                          normalizeZeros: true,
                          radix: ',',
                          mapToRadix: ['.'],
                          scale: 2
                        }
                      }}
                      value={price}
                      onAccept={(value: string) => setPrice(value)}
                      className="input-dark font-mono"
                      placeholder="R$ 0,00"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="label-xs"><Clock size={11} /> Duração (min)</label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="input-dark font-mono"
                      placeholder="30"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="label-xs">Descrição (Opcional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input-dark resize-none h-24"
                    placeholder="Detalhes sobre o serviço..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-gold w-full py-3.5 flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : (
                    <><Check size={16} /> {editingService ? 'Salvar Alterações' : 'Criar Serviço'}</>
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
