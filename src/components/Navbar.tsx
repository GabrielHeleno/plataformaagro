import React from 'react';
import { Calendar, Users, UserPlus, Bell, PlusCircle, Tractor } from 'lucide-react';
import { PermissionStatus } from '../utils/notifications';

interface NavbarProps {
  activeTab: 'calendario' | 'produtores' | 'novo-produtor';
  setActiveTab: (tab: 'calendario' | 'produtores' | 'novo-produtor') => void;
  servicosHojeCount: number;
  pendenciasCount: number;
  onOpenReminders: () => void;
  onOpenNewService: () => void;
  pushStatus: PermissionStatus;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  servicosHojeCount,
  pendenciasCount,
  onOpenReminders,
  onOpenNewService,
  pushStatus,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-emerald-900 text-white shadow-md border-b border-emerald-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Marca */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('calendario')}>
            <div className="w-10 h-10 rounded-lg bg-emerald-700/80 border border-emerald-500/40 flex items-center justify-center text-emerald-100 shadow-inner">
              <Tractor className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">AgroGestão</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-800 border border-emerald-600 text-emerald-200 font-medium">
                  Produtores Rurais
                </span>
              </div>
              <p className="text-xs text-emerald-300/80 hidden sm:block">
                Controle de cadastros, serviços e agendamentos agrícolas
              </p>
            </div>
          </div>

          {/* Navegação Principal */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              id="nav-tab-calendario"
              onClick={() => setActiveTab('calendario')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'calendario'
                  ? 'bg-emerald-800 text-white shadow-sm border border-emerald-600'
                  : 'text-emerald-100/90 hover:bg-emerald-800/50 hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4 text-emerald-300" />
              <span className="hidden md:inline">Calendário de Serviços</span>
              <span className="md:hidden">Calendário</span>
            </button>

            <button
              id="nav-tab-produtores"
              onClick={() => setActiveTab('produtores')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                activeTab === 'produtores'
                  ? 'bg-emerald-800 text-white shadow-sm border border-emerald-600'
                  : 'text-emerald-100/90 hover:bg-emerald-800/50 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-300" />
              <span>Produtores & Busca</span>
              {pendenciasCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full" title={`${pendenciasCount} produtor(es) com pendências`}>
                  {pendenciasCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-novo-produtor"
              onClick={() => setActiveTab('novo-produtor')}
              className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'novo-produtor'
                  ? 'bg-emerald-800 text-white shadow-sm border border-emerald-600'
                  : 'text-emerald-100/90 hover:bg-emerald-800/50 hover:text-white'
              }`}
            >
              <UserPlus className="w-4 h-4 text-emerald-300" />
              <span>Cadastrar Produtor</span>
            </button>
          </nav>

          {/* Ações Rápidas & Notificações Push */}
          <div className="flex items-center gap-2">
            <button
              id="btn-lembretes-diarios"
              onClick={onOpenReminders}
              className="relative p-2 rounded-lg text-emerald-100 hover:bg-emerald-800 transition-colors flex items-center gap-1.5 border border-emerald-700/60 bg-emerald-800/40"
              title="Lembretes Diários e Notificações Push"
            >
              <Bell className="w-5 h-5 text-amber-300" />
              {servicosHojeCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-zinc-950 shadow">
                  {servicosHojeCount}
                </span>
              )}
              <span className="text-xs font-medium hidden lg:inline text-emerald-200">
                Hoje ({servicosHojeCount})
              </span>
            </button>

            <button
              id="btn-novo-servico-topo"
              onClick={onOpenNewService}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm shadow-sm transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Serviço</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
