import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PageNavigationProps {
  currentPage: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onGoToPage: (page: number) => void;
}

export function PageNavigation({
  currentPage,
  totalPages,
  onPrev,
  onNext,
  onGoToPage,
}: PageNavigationProps) {
  const canGoPrev = currentPage > 0;
  const canGoNext = currentPage < totalPages - 1;

  return (
    <div className="flex items-center justify-center gap-4 mt-4">
      <button
        onClick={onPrev}
        disabled={!canGoPrev}
        className={`p-2 rounded-lg border transition-colors ${
          canGoPrev
            ? 'border-gray-300 hover:bg-gray-100 text-gray-700'
            : 'border-gray-200 text-gray-300 cursor-not-allowed'
        }`}
        aria-label="Previous page"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={totalPages}
          value={currentPage + 1}
          onChange={(e) => {
            const page = parseInt(e.target.value) - 1;
            if (!isNaN(page) && page >= 0 && page < totalPages) {
              onGoToPage(page);
            }
          }}
          className="w-12 px-2 py-1 text-center border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
        <span className="text-sm text-gray-500">of {totalPages}</span>
      </div>

      <button
        onClick={onNext}
        disabled={!canGoNext}
        className={`p-2 rounded-lg border transition-colors ${
          canGoNext
            ? 'border-gray-300 hover:bg-gray-100 text-gray-700'
            : 'border-gray-200 text-gray-300 cursor-not-allowed'
        }`}
        aria-label="Next page"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
