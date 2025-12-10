import { useState } from 'react';
import { useProductionHistory } from '../lib/hooks';
import { Package, Calendar, Edit2 } from 'lucide-react';
import EditProductionModal from '../components/EditProductionModal';
import type { ProductionHistory } from '../lib/database.types';

export default function Production() {
  const { history, loading, refresh } = useProductionHistory();
  const [editingRecord, setEditingRecord] = useState<ProductionHistory | null>(null);

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const groupedByMonth = history.reduce((acc, record) => {
    const date = new Date(record.production_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[monthKey]) acc[monthKey] = [];
    acc[monthKey].push(record);
    return acc;
  }, {} as Record<string, typeof history>);

  const months = Object.keys(groupedByMonth).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Package className="w-8 h-8 text-orange-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Production History</h1>
          <p className="text-gray-600 mt-1">Track all production batches across all products</p>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-orange-100 p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No production history yet</p>
          <p className="text-gray-500 text-sm mt-2">Production batches will appear here when you make them from product detail pages</p>
        </div>
      ) : (
        <div className="space-y-6">
          {months.map(monthKey => {
            const records = groupedByMonth[monthKey];
            const [year, month] = monthKey.split('-');
            const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            const totalUnits = records.reduce((sum, r) => sum + r.quantity_made, 0);

            return (
              <div key={monthKey} className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4 border-b border-orange-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <h2 className="text-lg font-bold text-gray-900">{monthName}</h2>
                  </div>
                  <div className="text-sm text-gray-700">
                    <span className="font-semibold">{totalUnits}</span> units produced
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {records.map(record => {
                    const componentsUsed = record.components_used as Record<string, string>;
                    return (
                      <div key={record.id} className="p-6 hover:bg-orange-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{record.product_name}</h3>
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                +{record.quantity_made} units
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {new Date(record.production_date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>

                            {componentsUsed && Object.keys(componentsUsed).length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {Object.entries(componentsUsed).map(([category, value]) => (
                                  <div key={category} className="px-3 py-1 bg-gray-100 rounded-lg text-xs text-gray-700">
                                    <span className="font-medium capitalize">{category}:</span> {String(value)}
                                  </div>
                                ))}
                              </div>
                            )}

                            {record.notes && (
                              <p className="mt-3 text-sm text-gray-600 italic">{record.notes}</p>
                            )}
                          </div>

                          <button
                            onClick={() => setEditingRecord(record)}
                            className="ml-4 p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-100 rounded-lg transition-colors"
                            title="Edit production record"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingRecord && (
        <EditProductionModal
          isOpen={true}
          onClose={() => setEditingRecord(null)}
          record={editingRecord}
          onSuccess={() => {
            refresh();
            setEditingRecord(null);
          }}
        />
      )}
    </div>
  );
}
