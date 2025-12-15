import { LayoutDashboard, Package, DollarSign, Factory, Plus } from 'lucide-react';

type Page = 'dashboard' | 'inventory' | 'sales' | 'production';

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: Page) => void;
  onAddAction?: () => void;
}

const leftNavItems: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory', icon: Package }
];

const rightNavItems: { id: Page; label: string; icon: typeof DollarSign }[] = [
  { id: 'sales', label: 'Sales', icon: DollarSign },
  { id: 'production', label: 'Production', icon: Factory }
];

export default function BottomNav({ currentPage, onNavigate, onAddAction }: BottomNavProps) {
  function handleTap(page: Page) {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onNavigate(page);
  }

  function handleAddAction() {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    if (onAddAction) {
      onAddAction();
    }
  }

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 safe-bottom">
      <div className="relative">
        <div className="absolute left-1/2 -translate-x-1/2 -top-3">
          <button
            onClick={handleAddAction}
            className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Add"
          >
            <Plus className="w-7 h-7 text-white stroke-[3]" />
          </button>
        </div>

        <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200/50 shadow-lg">
          <div className="flex items-center justify-between h-16 px-2">
            <div className="flex items-center justify-around flex-1">
              {leftNavItems.map(item => {
                const isActive = currentPage === item.id || (currentPage === 'product-detail' && item.id === 'inventory');
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleTap(item.id)}
                    className={`flex items-center justify-center w-12 h-12 rounded-xl transition-colors ${
                      isActive
                        ? 'text-red-500'
                        : 'text-gray-500 active:text-gray-700'
                    }`}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : ''}`} />
                  </button>
                );
              })}
            </div>

            <div className="w-16"></div>

            <div className="flex items-center justify-around flex-1">
              {rightNavItems.map(item => {
                const isActive = currentPage === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleTap(item.id)}
                    className={`flex items-center justify-center w-12 h-12 rounded-xl transition-colors ${
                      isActive
                        ? 'text-red-500'
                        : 'text-gray-500 active:text-gray-700'
                    }`}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : ''}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
