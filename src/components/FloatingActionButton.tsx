import { useState, useEffect } from 'react';
import { Plus, X, Package, ShoppingCart, DollarSign } from 'lucide-react';

interface FloatingActionButtonProps {
  onMakeBatch: () => void;
  onAddComponents: () => void;
  onAddSale: () => void;
}

export default function FloatingActionButton({ onMakeBatch, onAddComponents, onAddSale }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  function handleAction(action: () => void) {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    action();
    setIsOpen(false);
  }

  const actions = [
    {
      label: 'Make Batch',
      icon: Package,
      onClick: () => handleAction(onMakeBatch),
      color: 'bg-green-600 active:bg-green-700'
    },
    {
      label: 'Add Components',
      icon: ShoppingCart,
      onClick: () => handleAction(onAddComponents),
      color: 'bg-blue-600 active:bg-blue-700'
    },
    {
      label: 'Add Sale',
      icon: DollarSign,
      onClick: () => handleAction(onAddSale),
      color: 'bg-teal-600 active:bg-teal-700'
    }
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 safe-bottom">
        {isOpen && (
          <div className="absolute bottom-20 right-0 flex flex-col gap-3 mb-2">
            {actions.map((action, idx) => (
              <button
                key={idx}
                onClick={action.onClick}
                className={`flex items-center gap-3 ${action.color} text-white pl-4 pr-5 py-3.5 rounded-full shadow-lg transition-all duration-150 active:scale-95`}
                style={{
                  animation: `slideUp 0.2s ease-out ${idx * 0.05}s both`
                }}
                aria-label={action.label}
              >
                <action.icon className="w-5 h-5" />
                <span className="font-semibold whitespace-nowrap">{action.label}</span>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => {
            if ('vibrate' in navigator) {
              navigator.vibrate(10);
            }
            setIsOpen(!isOpen);
          }}
          className={`w-14 h-14 ${
            isOpen ? 'bg-gray-800 active:bg-gray-900' : 'bg-orange-600 active:bg-orange-700'
          } text-white rounded-full shadow-xl flex items-center justify-center transition-all duration-200 active:scale-95`}
          aria-label={isOpen ? 'Close menu' : 'Quick actions'}
          aria-expanded={isOpen}
        >
          <span className={`transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`}>
            {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
          </span>
        </button>

        <style>{`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </>
  );
}
