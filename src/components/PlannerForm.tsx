import { useState } from 'react';
import { Calendar, Download, FileText, Tablet } from 'lucide-react';
import { format } from 'date-fns';
import type { PlannerConfig, PlannerType, DeviceType, DensityLevel, ToolbarPosition } from '../types/planner';
import { generatePlannerPDF } from '../lib/pdf-generator';

const DENSITY_OPTIONS: { value: DensityLevel; label: string; description: string }[] = [
  { value: 'compact', label: 'Compact', description: 'More content, smaller text' },
  { value: 'normal', label: 'Normal', description: 'Balanced spacing' },
  { value: 'comfortable', label: 'Comfortable', description: 'Larger text, more space' },
];

const PLANNER_TYPES: { value: PlannerType; label: string; description: string }[] = [
  { value: 'bujo', label: 'Bullet Journal', description: 'Rapid logging with future & monthly logs' },
  { value: 'daily', label: 'Daily Planner', description: 'Hourly time slots for each day' },
  { value: 'weekly', label: 'Weekly Planner', description: '7-day grid with notes section' },
  { value: 'monthly', label: 'Monthly Calendar', description: 'Traditional calendar grid' },
  { value: 'dotgrid', label: 'Dot Grid', description: '50 pages of dot grid paper' },
  { value: 'lined', label: 'Lined Paper', description: '50 pages of college-ruled lines' },
  { value: 'blank', label: 'Blank Pages', description: '50 blank pages' },
];

const DEVICE_OPTIONS: { value: DeviceType; label: string; size: string }[] = [
  { value: 'remarkable2', label: 'reMarkable 2', size: '10.3"' },
  { value: 'paperPro', label: 'Paper Pro', size: '11.8"' },
  { value: 'move', label: 'Paper Pro Move', size: '7.3"' },
];

const TOOLBAR_POSITIONS: { value: ToolbarPosition; label: string }[] = [
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
];

interface PlannerFormProps {
  config: PlannerConfig;
  onConfigChange: (config: PlannerConfig) => void;
}

export function PlannerForm({ config, onConfigChange }: PlannerFormProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const setConfig = (updater: PlannerConfig | ((prev: PlannerConfig) => PlannerConfig)) => {
    if (typeof updater === 'function') {
      onConfigChange(updater(config));
    } else {
      onConfigChange(updater);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const pdfBytes = await generatePlannerPDF(config);
      const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `remarkable-planner-${config.type}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const isDateBased = ['bujo', 'daily', 'weekly', 'monthly'].includes(config.type);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <FileText className="w-8 h-8 text-gray-700" />
          <h1 className="text-2xl font-bold text-gray-900">reMarkable Planner Builder</h1>
        </div>
        <p className="text-gray-600">
          Create custom PDF planners optimized for your reMarkable tablet
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Device Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            <Tablet className="w-4 h-4 inline mr-1" />
            Target Device
          </label>
          <div className="flex gap-3">
            {DEVICE_OPTIONS.map((device) => (
              <button
                key={device.value}
                onClick={() => setConfig((c) => ({ ...c, device: device.value }))}
                className={`flex-1 p-3 text-center rounded-lg border-2 transition-colors ${
                  config.device === device.value
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{device.label}</div>
                <div className="text-sm text-gray-500">{device.size}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Planner Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Planner Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            {PLANNER_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setConfig((c) => ({ ...c, type: type.value }))}
                className={`p-3 text-left rounded-lg border-2 transition-colors ${
                  config.type === type.value
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-medium text-gray-900">{type.label}</div>
                <div className="text-sm text-gray-500">{type.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Date Range (for date-based planners) */}
        {isDateBased && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={format(config.startDate, 'yyyy-MM-dd')}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, startDate: new Date(e.target.value) }))
                  }
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={format(config.endDate, 'yyyy-MM-dd')}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, endDate: new Date(e.target.value) }))
                  }
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        )}

        {/* Daily planner options */}
        {config.type === 'daily' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Hour
                </label>
                <select
                  value={config.timeStart}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, timeStart: parseInt(e.target.value) }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {format(new Date(2000, 0, 1, i), 'h:mm a')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Hour
                </label>
                <select
                  value={config.timeEnd}
                  onChange={(e) =>
                    setConfig((c) => ({ ...c, timeEnd: parseInt(e.target.value) }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {format(new Date(2000, 0, 1, i), 'h:mm a')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Interval
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfig((c) => ({ ...c, timeInterval: 60 }))}
                  className={`flex-1 py-2 rounded-lg border-2 transition-colors ${
                    config.timeInterval === 60
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200'
                  }`}
                >
                  1 hour
                </button>
                <button
                  onClick={() => setConfig((c) => ({ ...c, timeInterval: 30 }))}
                  className={`flex-1 py-2 rounded-lg border-2 transition-colors ${
                    config.timeInterval === 30
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200'
                  }`}
                >
                  30 minutes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toggle options */}
        {isDateBased && (
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeWeekends}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, includeWeekends: e.target.checked }))
                }
                className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <span className="text-sm text-gray-700">Include weekends</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.includeIndex}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, includeIndex: e.target.checked }))
                }
                className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <span className="text-sm text-gray-700">Include table of contents</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.pageNumbers}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, pageNumbers: e.target.checked }))
                }
                className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <span className="text-sm text-gray-700">Show page numbers</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.darkMode}
                onChange={(e) =>
                  setConfig((c) => ({ ...c, darkMode: e.target.checked }))
                }
                className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
              />
              <span className="text-sm text-gray-700">Dark mode</span>
            </label>
          </div>
        )}

        {/* Layout Settings - Toolbar Position & Padding */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="font-medium text-gray-900">Layout Settings</h3>

          {/* Toolbar Position */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Toolbar Position
            </label>
            <div className="flex gap-2">
              {TOOLBAR_POSITIONS.map((pos) => (
                <button
                  key={pos.value}
                  onClick={() => setConfig((c) => ({ ...c, toolbarPosition: pos.value }))}
                  className={`flex-1 py-2 px-3 text-sm rounded-lg border-2 transition-colors ${
                    config.toolbarPosition === pos.value
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          {/* Padding Controls */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Padding (PDF points)
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* Top Padding */}
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Top</span>
                  <span>{config.padding.top}pt</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={80}
                  value={config.padding.top}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      padding: { ...c.padding, top: parseInt(e.target.value) },
                    }))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                />
              </div>

              {/* Bottom Padding */}
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Bottom</span>
                  <span>{config.padding.bottom}pt</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={80}
                  value={config.padding.bottom}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      padding: { ...c.padding, bottom: parseInt(e.target.value) },
                    }))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                />
              </div>

              {/* Left Padding */}
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Left</span>
                  <span>{config.padding.left}pt</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={80}
                  value={config.padding.left}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      padding: { ...c.padding, left: parseInt(e.target.value) },
                    }))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                />
              </div>

              {/* Right Padding */}
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Right</span>
                  <span>{config.padding.right}pt</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={80}
                  value={config.padding.right}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      padding: { ...c.padding, right: parseInt(e.target.value) },
                    }))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bullet Journal Options */}
        {config.type === 'bujo' && config.bujoConfig && (
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium text-gray-900">Bullet Journal Options</h3>

            {/* Density selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Density
              </label>
              <div className="flex gap-2">
                {DENSITY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      setConfig((c) => ({
                        ...c,
                        bujoConfig: { ...c.bujoConfig!, density: option.value },
                      }))
                    }
                    className={`flex-1 py-2 px-3 text-center rounded-lg border-2 transition-colors ${
                      config.bujoConfig?.density === option.value
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Section toggles */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.bujoConfig.showBulletKey}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      bujoConfig: { ...c.bujoConfig!, showBulletKey: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-sm text-gray-700">Include Key Page</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.bujoConfig.includeFutureLog}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      bujoConfig: { ...c.bujoConfig!, includeFutureLog: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-sm text-gray-700">Include Future Log</span>
              </label>

              {config.bujoConfig.includeFutureLog && (
                <div className="ml-7">
                  <label className="block text-sm text-gray-600 mb-1">Future Log Duration</label>
                  <select
                    value={config.bujoConfig.futureLogMonths}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        bujoConfig: {
                          ...c.bujoConfig!,
                          futureLogMonths: parseInt(e.target.value) as 6 | 12,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                  >
                    <option value={6}>6 Months</option>
                    <option value={12}>12 Months</option>
                  </select>
                </div>
              )}

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.bujoConfig.includeMonthlyLog}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      bujoConfig: { ...c.bujoConfig!, includeMonthlyLog: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-sm text-gray-700">Include Monthly Logs</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.bujoConfig.includeWeeklyReview}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      bujoConfig: { ...c.bujoConfig!, includeWeeklyReview: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-sm text-gray-700">Include Weekly Reviews</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.bujoConfig.includeDailyLog}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      bujoConfig: { ...c.bujoConfig!, includeDailyLog: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-sm text-gray-700">Include Daily Logs</span>
              </label>
            </div>

            {/* Daily page style */}
            {config.bujoConfig.includeDailyLog && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Page Style
                </label>
                <div className="flex gap-2">
                  {(['dotgrid', 'lined', 'blank'] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() =>
                        setConfig((c) => ({
                          ...c,
                          bujoConfig: { ...c.bujoConfig!, dailyPageStyle: style },
                        }))
                      }
                      className={`flex-1 py-2 px-3 text-sm rounded-lg border-2 transition-colors capitalize ${
                        config.bujoConfig?.dailyPageStyle === style
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {style === 'dotgrid' ? 'Dot Grid' : style}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Dot spacing slider - only show when dotgrid is selected */}
            {(config.bujoConfig.dailyPageStyle === 'dotgrid' || config.bujoConfig.collectionPageStyle === 'dotgrid') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dot Spacing: {config.bujoConfig.dotSpacing}px
                </label>
                <input
                  type="range"
                  min={8}
                  max={24}
                  value={config.bujoConfig.dotSpacing}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      bujoConfig: { ...c.bujoConfig!, dotSpacing: parseInt(e.target.value) },
                    }))
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Dense</span>
                  <span>Sparse</span>
                </div>
              </div>
            )}

            {/* Collection pages */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Collection Pages
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={config.bujoConfig.includeCollectionPages}
                  onChange={(e) =>
                    setConfig((c) => ({
                      ...c,
                      bujoConfig: {
                        ...c.bujoConfig!,
                        includeCollectionPages: Math.max(0, Math.min(50, parseInt(e.target.value) || 0)),
                      },
                    }))
                  }
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
                <span className="text-sm text-gray-600">blank pages for collections</span>
              </div>
            </div>

            {/* Collection page style */}
            {config.bujoConfig.includeCollectionPages > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Collection Page Style
                </label>
                <div className="flex gap-2">
                  {(['dotgrid', 'lined', 'blank'] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() =>
                        setConfig((c) => ({
                          ...c,
                          bujoConfig: { ...c.bujoConfig!, collectionPageStyle: style },
                        }))
                      }
                      className={`flex-1 py-2 px-3 text-sm rounded-lg border-2 transition-colors capitalize ${
                        config.bujoConfig?.collectionPageStyle === style
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {style === 'dotgrid' ? 'Dot Grid' : style}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Generate & Download PDF
            </>
          )}
        </button>
      </div>

      {/* Upload Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-medium text-gray-900 mb-2">Upload to reMarkable</h3>
        <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
          <li>Connect your reMarkable to your computer via USB-C</li>
          <li>On reMarkable: Settings → Storage → Enable USB web interface</li>
          <li>
            Open{' '}
            <code className="px-1 py-0.5 bg-gray-200 rounded text-gray-800">
              http://10.11.99.1
            </code>{' '}
            in your browser
          </li>
          <li>Drag and drop the downloaded PDF</li>
        </ol>
      </div>
    </div>
  );
}
