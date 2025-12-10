import { AlertTriangle, CheckCircle } from 'lucide-react';
import type { Product } from '../lib/database.types';

interface InventoryBoxProps {
  product: Product;
  onClick: () => void;
}

export default function InventoryBox({ product, onClick }: InventoryBoxProps) {
  const isLowStock = product.current_stock < 15;

  return (
    <button
      onClick={onClick}
      className="card-interactive p-3 sm:p-4 flex flex-col items-center justify-between min-h-[130px] sm:min-h-[160px]"
    >
      <div className="flex items-center gap-1.5">
        {isLowStock ? (
          <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500" />
        ) : (
          <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500" />
        )}
        <span className={`text-[10px] sm:text-xs font-medium ${isLowStock ? 'text-yellow-600' : 'text-green-600'}`}>
          {isLowStock ? 'Low' : 'Good'}
        </span>
      </div>

      <div className="text-center">
        <div className="text-2xl sm:text-4xl font-bold text-gray-900">
          {product.current_stock}
        </div>
        <p className="text-[10px] text-gray-400">units</p>
      </div>

      <div className="text-center w-full">
        {product.size !== 'Regular' && (
          <p className="text-[9px] font-semibold text-orange-600 uppercase tracking-wide mb-0.5">
            {product.size}
          </p>
        )}
        <p className="text-[11px] sm:text-sm font-semibold text-gray-700 leading-tight truncate px-1">
          {product.name}
        </p>
      </div>
    </button>
  );
}
