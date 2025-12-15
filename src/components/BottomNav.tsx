import { LayoutDashboard, Package, DollarSign, BarChart3, Factory } from 'lucide-react';

type Page = 'dashboard' | 'inventory' | 'sales' | 'analytics' | 'production';

interface BottomNavProps {
  currentPage: string;
  onNavigate: (page: Page) => void;
}

const navItems: { id: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'sales', label: 'Sales', icon: DollarSign },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'production', label: 'Production', icon: Factory }
];

export default function BottomNav({ currentPage, onNavigate }: BottomNavProps) {
  function handleTap(page: Page) {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onNavigate(page);
  }

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-40 safe-bottom">
      <div className="flex items-stretch justify-around h-16">
        {navItems.map(item => {
          const isActive = currentPage === item.id || (currentPage === 'product-detail' && item.id === 'inventory');
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleTap(item.id)}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                isActive
                  ? 'text-orange-600'
                  : 'text-gray-500 active:text-gray-700'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
