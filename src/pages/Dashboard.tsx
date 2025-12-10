import { useEffect, useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { useProducts, useDashboardStats } from '../lib/hooks';
import { supabase } from '../lib/supabase';
import InventoryBox from '../components/InventoryBox';

interface DashboardProps {
  onProductClick: (productId: string) => void;
}

export default function Dashboard({ onProductClick }: DashboardProps) {
  const { products, loading: productsLoading } = useProducts();
  const { stats, loading: statsLoading } = useDashboardStats();
  const [notes, setNotes] = useState('');
  const [notesId, setNotesId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');

  useEffect(() => {
    loadNotes();
  }, []);

  async function loadNotes() {
    const { data } = await supabase.from('dashboard_notes').select('*').limit(1).maybeSingle();
    if (data) {
      setNotes(data.content);
      setNotesId(data.id);
    }
  }

  async function saveNotes() {
    setSaveStatus('saving');
    if (notesId) {
      await supabase.from('dashboard_notes').update({ content: notes, updated_at: new Date().toISOString() }).eq('id', notesId);
    } else {
      const { data } = await supabase.from('dashboard_notes').insert({ content: notes }).select().single();
      if (data) setNotesId(data.id);
    }
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('unsaved'), 2000);
  }

  if (productsLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Your business overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Revenue"
          value={`$${stats.totalRevenue >= 1000 ? `${(stats.totalRevenue / 1000).toFixed(1)}k` : stats.totalRevenue.toFixed(0)}`}
          icon="$"
          bgColor="bg-orange-100"
        />
        <StatCard
          label="Sales Events"
          value={stats.totalSales.toString()}
          icon="cart"
          bgColor="bg-amber-100"
        />
        <StatCard
          label="Low Stock"
          value={stats.lowStockItems.toString()}
          icon="alert"
          bgColor="bg-yellow-100"
          valueColor={stats.lowStockItems > 0 ? 'text-yellow-600' : undefined}
        />
        <StatCard
          label="Products"
          value={stats.totalProducts.toString()}
          icon="box"
          bgColor="bg-orange-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2">
          <div className="card p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Inventory</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
              {products.map(product => (
                <InventoryBox
                  key={product.id}
                  product={product}
                  onClick={() => onProductClick(product.id)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Notes</h2>
              <button
                onClick={saveNotes}
                disabled={saveStatus === 'saving'}
                className="flex items-center gap-2 btn-touch bg-orange-600 text-white active:bg-orange-700 px-3 py-2 text-sm disabled:opacity-50"
              >
                {saveStatus === 'saving' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save'}
                </span>
              </button>
            </div>

            <textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setSaveStatus('unsaved');
              }}
              placeholder="Enter your daily notes here..."
              className="input-touch h-48 sm:h-64 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: 'cart' | 'alert' | 'box' | '$';
  bgColor: string;
  valueColor?: string;
}

function StatCard({ label, value, icon, bgColor, valueColor = 'text-gray-900' }: StatCardProps) {
  const iconContent = {
    '$': '$',
    'cart': '🛒',
    'alert': '⚠️',
    'box': '📦'
  };

  return (
    <div className="card p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-gray-600 font-medium truncate">{label}</p>
          <p className={`text-xl sm:text-3xl font-bold mt-1 ${valueColor}`}>{value}</p>
        </div>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 ${bgColor} rounded-xl flex items-center justify-center flex-shrink-0 ml-2`}>
          <span className="text-lg sm:text-2xl">{iconContent[icon]}</span>
        </div>
      </div>
    </div>
  );
}
