import { useState, useCallback } from 'react';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import ProductDetail from './pages/ProductDetail';
import SalesTracking from './pages/SalesTracking';
import Production from './pages/Production';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import FloatingActionButton from './components/FloatingActionButton';
import QuickBatchModal from './components/QuickBatchModal';
import QuickComponentModal from './components/QuickComponentModal';
import AddSaleModal from './components/AddSaleModal';
import Toast, { ToastMessage, createToast, ToastType } from './components/Toast';

type Page = 'dashboard' | 'inventory' | 'sales' | 'production' | 'product-detail';
type QuickAction = 'batch' | 'components' | 'sale' | null;

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>();
  const [quickAction, setQuickAction] = useState<QuickAction>(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: ToastType, message: string) => {
    const toast = createToast(type, message);
    setToasts(prev => [...prev, toast]);
    if ('vibrate' in navigator) {
      navigator.vibrate(type === 'error' ? [50, 30, 50] : 10);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  function navigateToProduct(productId: string) {
    setSelectedProductId(productId);
    setCurrentPage('product-detail');
  }

  function handleQuickActionSuccess(message?: string) {
    setQuickAction(null);
    setShowQuickActions(false);
    setRefreshKey(prev => prev + 1);
    if (message) {
      showToast('success', message);
    }
  }

  function handleBottomNavAdd() {
    setShowQuickActions(true);
  }

  function renderPage() {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard key={refreshKey} onProductClick={navigateToProduct} />;
      case 'inventory':
        return <Inventory key={refreshKey} onProductClick={navigateToProduct} />;
      case 'product-detail':
        return (
          <ProductDetail
            key={refreshKey}
            productId={selectedProductId}
            onBack={() => setCurrentPage('inventory')}
            showToast={showToast}
          />
        );
      case 'sales':
        return <SalesTracking key={refreshKey} showToast={showToast} />;
      case 'production':
        return <Production key={refreshKey} />;
      default:
        return <Dashboard key={refreshKey} onProductClick={navigateToProduct} />;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="container mx-auto px-3 sm:px-4 pt-6 pb-24 md:py-6 md:pb-8 max-w-7xl">
        {renderPage()}
      </main>

      <BottomNav
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onAddAction={handleBottomNavAdd}
      />

      <div className="hidden md:block">
        <FloatingActionButton
          onMakeBatch={() => setQuickAction('batch')}
          onAddComponents={() => setQuickAction('components')}
          onAddSale={() => setQuickAction('sale')}
        />
      </div>

      {showQuickActions && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-40 animate-fade-in md:hidden"
            onClick={() => setShowQuickActions(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden animate-slide-up safe-bottom">
            <div className="bg-white rounded-t-3xl p-6 shadow-2xl">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setQuickAction('batch');
                    setShowQuickActions(false);
                  }}
                  className="w-full flex items-center gap-4 p-4 bg-green-50 hover:bg-green-100 active:bg-green-200 rounded-xl transition-colors"
                >
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">📦</span>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Make Batch</p>
                    <p className="text-sm text-gray-600">Create new product batch</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setQuickAction('components');
                    setShowQuickActions(false);
                  }}
                  className="w-full flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 rounded-xl transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">🛒</span>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Add Components</p>
                    <p className="text-sm text-gray-600">Purchase materials</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setQuickAction('sale');
                    setShowQuickActions(false);
                  }}
                  className="w-full flex items-center gap-4 p-4 bg-teal-50 hover:bg-teal-100 active:bg-teal-200 rounded-xl transition-colors"
                >
                  <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">💰</span>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">Add Sale</p>
                    <p className="text-sm text-gray-600">Record sales event</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {quickAction === 'batch' && (
        <QuickBatchModal
          onClose={() => setQuickAction(null)}
          onSuccess={(msg) => handleQuickActionSuccess(msg || 'Batch created successfully')}
        />
      )}

      {quickAction === 'components' && (
        <QuickComponentModal
          onClose={() => setQuickAction(null)}
          onSuccess={(msg) => handleQuickActionSuccess(msg || 'Purchase recorded successfully')}
        />
      )}

      {quickAction === 'sale' && (
        <AddSaleModal
          onClose={() => setQuickAction(null)}
          onSave={() => handleQuickActionSuccess('Sales event saved successfully')}
        />
      )}

      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;
