/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl text-center space-y-6"
      >
        <h1 className="text-6xl italic text-secondary">BarberFlow</h1>
        <p className="text-xl text-primary/80">
          Sua barbearia no piloto automático. Atendimento por IA, agendamento inteligente e CRM completo.
        </p>
        <div className="pt-8">
          <button className="bg-secondary text-primary font-bold px-8 py-4 rounded-lg shadow-lg hover:scale-[1.02] transition-transform active:scale-95">
            Começar Configuração
          </button>
        </div>
      </motion.div>
    </div>
  );
}
