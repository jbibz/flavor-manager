interface UnitToggleProps {
  showGrams: boolean;
  onToggle: () => void;
}

export default function UnitToggle({ showGrams, onToggle }: UnitToggleProps) {
  return (
    <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
      <button
        onClick={onToggle}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
          !showGrams
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Lbs
      </button>
      <button
        onClick={onToggle}
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
          showGrams
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Gs
      </button>
    </div>
  );
}
