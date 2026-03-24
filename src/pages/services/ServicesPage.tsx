import { useState, useEffect } from 'react';
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

  // Form State
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
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans p-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-serif italic mb-2">Serviços</h1>
          <p className="text-[10px] opacity-50 uppercase tracking-[0.2em] font-mono font-bold">Gerencie seu catálogo de serviços</p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" size={16} />
            <input
              type="text"
              placeholder="Buscar serviço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-[#141414]/5 rounded-lg outline-none focus:border-secondary transition-all text-sm font-bold"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-[#141414] text-[#E4E3E0] px-6 py-3 rounded-lg text-sm font-bold flex items-center gap-2 hover:scale-105 transition-transform shrink-0"
          >
            <Plus size={18} /> Novo Serviço
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-secondary" size={40} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service, i) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white p-6 rounded-xl border border-[#141414]/5 shadow-sm group hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-secondary/10 text-secondary rounded-lg">
                  <Scissors size={24} />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(service)} className="p-2 hover:bg-[#E4E3E0]/50 rounded transition-colors text-blue-600"><Edit2 size={16}/></button>
                  <button onClick={() => service.id && handleDelete(service.id)} className="p-2 hover:bg-[#E4E3E0]/50 rounded transition-colors text-red-600"><Trash2 size={16}/></button>
                </div>
              </div>

              <h3 className="font-serif italic text-xl mb-1">{service.name}</h3>
              <p className="text-xs opacity-50 mb-4 line-clamp-2">{service.description || 'Sem descrição.'}</p>

              <div className="flex items-center justify-between pt-4 border-t border-[#141414]/5">
                <div className="flex items-center gap-2 text-xs font-mono font-bold opacity-60">
                  <Clock size={14} /> {service.duration_minutes} min
                </div>
                <div className="text-lg font-mono font-bold text-secondary">
                  R$ {Number(service.price).toFixed(2)}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal Novo/Editar Serviço */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-[#141414]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="bg-[#141414] p-6 text-[#E4E3E0] flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Scissors className="text-secondary" size={20} />
                  <h3 className="font-serif italic text-xl">{editingService ? 'Editar Serviço' : 'Novo Serviço'}</h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="opacity-50 hover:opacity-100 transition-opacity">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-bold opacity-50 flex items-center gap-2">
                      Nome do Serviço
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 bg-[#E4E3E0]/30 border border-transparent focus:border-secondary rounded-lg outline-none transition-all text-sm font-bold"
                      placeholder="ex: Corte Degradê"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest font-bold opacity-50 flex items-center gap-2">
                        <DollarSign size={12} /> Preço (R$)
                      </label>
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
                        className="w-full px-4 py-3 bg-[#E4E3E0]/30 border border-transparent focus:border-secondary rounded-lg outline-none transition-all text-sm font-mono"
                        placeholder="R$ 0,00"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-widest font-bold opacity-50 flex items-center gap-2">
                        <Clock size={12} /> Duração (min)
                      </label>
                      <input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full px-4 py-3 bg-[#E4E3E0]/30 border border-transparent focus:border-secondary rounded-lg outline-none transition-all text-sm font-mono"
                        placeholder="30"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-bold opacity-50 flex items-center gap-2">
                      Descrição (Opcional)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 bg-[#E4E3E0]/30 border border-transparent focus:border-secondary rounded-lg outline-none transition-all text-sm font-bold resize-none h-24"
                      placeholder="Detalhes sobre o serviço..."
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-4 bg-[#141414] text-[#E4E3E0] rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : (
                    <>
                      {editingService ? 'Salvar Alterações' : 'Criar Serviço'}
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
