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
    <div className="px-4 py-6 sm:px-6 lg:px-8 lg:py-7 pb-24 md:pb-8 max-w-[1600px] mx-auto">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">Catálogo</p>
          <h1 className="page-title">Serviços</h1>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" size={16} />
            <input
              type="text"
              placeholder="Buscar serviço…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <button onClick={() => handleOpenModal()} className="btn-primary hidden md:inline-flex shrink-0">
            <Plus size={16} /> Novo serviço
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-gold" size={32} />
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#F7F6F4] flex items-center justify-center mb-4">
            <Scissors size={24} className="text-ink-soft" />
          </div>
          <p className="text-ink font-semibold">Nenhum serviço encontrado</p>
          <p className="text-ink-soft text-sm mt-1">Cadastre o primeiro serviço do catálogo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {filteredServices.map((service, i) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="card-hover p-6 flex flex-col group"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="w-11 h-11 rounded-xl bg-[#F7F6F4] flex items-center justify-center text-[#12100D]">
                  <Scissors size={20} />
                </div>
                <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenModal(service)}
                    aria-label="Editar serviço"
                    className="btn-icon"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => service.id && handleDelete(service.id)}
                    aria-label="Excluir serviço"
                    className="btn-icon hover:text-[#D84A4A]"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-ink mb-1.5">{service.name}</h3>
              <p className="text-[13px] text-ink-soft mb-6 line-clamp-2 flex-1">
                {service.description || 'Sem descrição.'}
              </p>

              <div className="flex items-end justify-between pt-4 border-t border-line">
                <div className="flex items-center gap-1.5 text-[13px] text-ink-soft">
                  <Clock size={14} /> {service.duration_minutes} min
                </div>
                <div className="text-lg font-bold text-ink">
                  R$ {Number(service.price).toFixed(2)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <button
        onClick={() => handleOpenModal()}
        aria-label="Novo serviço"
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
                  {editingService ? 'Editar serviço' : 'Novo serviço'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Fechar"
                  className="btn-icon"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="label">Nome do serviço</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input"
                    placeholder="ex: Corte Degradê"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label"><DollarSign size={13} /> Preço</label>
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
                      className="input"
                      placeholder="R$ 0,00"
                      required
                    />
                  </div>
                  <div>
                    <label className="label"><Clock size={13} /> Duração (min)</label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="input"
                      placeholder="30"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Descrição</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input-textarea"
                    placeholder="Detalhes sobre o serviço…"
                  />
                </div>

                <button type="submit" disabled={isSaving} className="btn-primary w-full h-12">
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : (
                    <><Check size={16} /> {editingService ? 'Salvar alterações' : 'Criar serviço'}</>
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
