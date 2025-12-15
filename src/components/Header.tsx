type Page = 'dashboard' | 'inventory' | 'sales' | 'analytics' | 'production';

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: Page) => void;
}

const navItems: { id: Page; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'sales', label: 'Sales' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'production', label: 'Production' }
];

export default function Header({ currentPage, onNavigate }: HeaderProps) {
  return (
    <header className="bg-[#1e3a5f] shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-14 md:h-16">
          <div className="flex items-center gap-3">
            <img
              src="/hand_logo_new.jpg"
              alt="Flavor Junkie Logo"
              className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover shadow-md"
            />
            <div>
              <h1 className="text-lg md:text-xl font-bold text-white">Flavor Junkie</h1>
              <p className="text-[10px] md:text-xs text-gray-300 hidden sm:block">Business Manager</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors touch-target ${
                  currentPage === item.id || (currentPage === 'product-detail' && item.id === 'inventory')
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-200 hover:bg-[#2a4d78] hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
