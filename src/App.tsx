import { useState } from 'react';
import { startOfYear, endOfYear } from 'date-fns';
import type { PlannerConfig } from './types/planner';
import { PlannerForm } from './components/PlannerForm';
import { PreviewPanel } from './components/preview/PreviewPanel';

function App() {
  const [config, setConfig] = useState<PlannerConfig>({
    type: 'bujo',
    device: 'move',
    startDate: startOfYear(new Date()),
    endDate: endOfYear(new Date()),
    includeWeekends: true,
    timeStart: 6,
    timeEnd: 22,
    timeInterval: 60,
    includeIndex: true,
    pageNumbers: true,
    darkMode: false,
    bujoConfig: {
      includeFutureLog: true,
      futureLogMonths: 6,
      includeMonthlyLog: true,
      includeWeeklyReview: true,
      includeDailyLog: true,
      includeCollectionPages: 10,
      showBulletKey: true,
      density: 'normal',
      dailyPageStyle: 'dotgrid',
      collectionPageStyle: 'dotgrid',
      dotSpacing: 14,
    },
    toolbarPosition: 'top',
    padding: {
      top: 40,
      bottom: 24,
      left: 24,
      right: 24,
    },
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Form Panel - scrollable */}
        <div className="lg:w-1/2 lg:max-w-xl overflow-y-auto p-4 lg:p-8">
          <PlannerForm config={config} onConfigChange={setConfig} />
        </div>

        {/* Preview Panel - sticky */}
        <div className="hidden lg:flex lg:w-1/2 lg:flex-1 items-center justify-center p-8 bg-gray-50 border-l border-gray-200 sticky top-0 h-screen">
          <PreviewPanel config={config} />
        </div>
      </div>
    </div>
  );
}

export default App;
