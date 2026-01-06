import type { PreviewLink } from '../../hooks/usePreview';

interface PageCanvasProps {
  imageUrl: string;
  isLoading: boolean;
  pageNumber: number;
  links?: PreviewLink[];
  onNavigate?: (targetPage: number) => void;
}

export function PageCanvas({
  imageUrl,
  isLoading,
  pageNumber,
  links = [],
  onNavigate,
}: PageCanvasProps) {
  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Generating preview...</span>
        </div>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-white">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-2">📄</div>
          <div className="text-sm">Page {pageNumber + 1}</div>
          <div className="text-xs">(Preview loading...)</div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0">
      <img
        src={imageUrl}
        alt={`Page ${pageNumber + 1}`}
        className="w-full h-full object-contain bg-white"
      />

      {/* Clickable link overlays */}
      {links.length > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {links.map((link, idx) => (
            <button
              key={idx}
              onClick={() => onNavigate?.(link.targetPage)}
              className="absolute pointer-events-auto bg-blue-500/0 hover:bg-blue-500/20 border border-transparent hover:border-blue-400 rounded cursor-pointer transition-colors"
              style={{
                left: `${link.rect.x}%`,
                top: `${link.rect.y}%`,
                width: `${link.rect.width}%`,
                height: `${link.rect.height}%`,
              }}
              title={`Go to page ${link.targetPage + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
