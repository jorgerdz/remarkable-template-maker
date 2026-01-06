import type { PlannerConfig } from '../../types/planner';
import { usePreview } from '../../hooks/usePreview';
import { DeviceFrame } from './DeviceFrame';
import { PageCanvas } from './PageCanvas';
import { PageNavigation } from './PageNavigation';

interface PreviewPanelProps {
  config: PlannerConfig;
}

export function PreviewPanel({ config }: PreviewPanelProps) {
  const {
    pages,
    pageLinks,
    currentPage,
    totalPages,
    isLoading,
    error,
    goNext,
    goPrev,
    goToPage,
  } = usePreview(config);

  return (
    <div className="flex flex-col items-center h-full">
      <div className="text-sm font-medium text-gray-700 mb-3">Live Preview</div>

      {error ? (
        <div className="flex items-center justify-center h-64 text-red-500 text-sm">
          {error}
        </div>
      ) : (
        <>
          <DeviceFrame
            device={config.device}
            toolbarPosition={config.toolbarPosition}
            padding={config.padding}
          >
            <PageCanvas
              imageUrl={pages[currentPage] || ''}
              isLoading={isLoading && pages.length === 0}
              pageNumber={currentPage}
              links={pageLinks[currentPage]}
              onNavigate={goToPage}
            />
          </DeviceFrame>

          {totalPages > 0 && (
            <PageNavigation
              currentPage={currentPage}
              totalPages={totalPages}
              onPrev={goPrev}
              onNext={goNext}
              onGoToPage={goToPage}
            />
          )}
        </>
      )}
    </div>
  );
}
