import type { DeviceType, ToolbarPosition, PaddingConfig } from '../../types/planner';
import { DEVICE_CONFIGS } from '../../types/planner';

// Fixed toolbar size in PDF points - this matches the actual reMarkable toolbar
const TOOLBAR_SIZE = 40;

interface DeviceFrameProps {
  device: DeviceType;
  children: React.ReactNode;
  toolbarPosition: ToolbarPosition;
  padding: PaddingConfig;
}

export function DeviceFrame({ device, children, toolbarPosition, padding }: DeviceFrameProps) {
  const config = DEVICE_CONFIGS[device];
  const aspectRatio = config.pixels.width / config.pixels.height;

  // Convert PDF points to percentage for the overlays
  const pdfWidth = config.pdfPoints.width;
  const pdfHeight = config.pdfPoints.height;

  // Fixed toolbar size as percentage
  const toolbarHeightPct = `${(TOOLBAR_SIZE / pdfHeight) * 100}%`;
  const toolbarWidthPct = `${(TOOLBAR_SIZE / pdfWidth) * 100}%`;

  const toolbarStyle: React.CSSProperties = {
    position: 'absolute',
    backgroundColor: 'rgba(80, 80, 80, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  };

  // Position toolbar overlay based on position setting (fixed size)
  if (toolbarPosition === 'top') {
    toolbarStyle.top = 0;
    toolbarStyle.left = 0;
    toolbarStyle.right = 0;
    toolbarStyle.height = toolbarHeightPct;
  } else if (toolbarPosition === 'bottom') {
    toolbarStyle.bottom = 0;
    toolbarStyle.left = 0;
    toolbarStyle.right = 0;
    toolbarStyle.height = toolbarHeightPct;
  } else if (toolbarPosition === 'left') {
    toolbarStyle.top = 0;
    toolbarStyle.bottom = 0;
    toolbarStyle.left = 0;
    toolbarStyle.width = toolbarWidthPct;
  } else if (toolbarPosition === 'right') {
    toolbarStyle.top = 0;
    toolbarStyle.bottom = 0;
    toolbarStyle.right = 0;
    toolbarStyle.width = toolbarWidthPct;
  }

  // Create padding guide lines to show content area
  const paddingGuideStyle: React.CSSProperties = {
    position: 'absolute',
    border: '1px dashed rgba(59, 130, 246, 0.5)',
    pointerEvents: 'none',
    zIndex: 5,
    top: `${(padding.top / pdfHeight) * 100}%`,
    bottom: `${(padding.bottom / pdfHeight) * 100}%`,
    left: `${(padding.left / pdfWidth) * 100}%`,
    right: `${(padding.right / pdfWidth) * 100}%`,
  };

  return (
    <div className="flex flex-col items-center">
      {/* Device name */}
      <div className="text-sm text-gray-500 mb-2">
        {config.name} ({config.screenSize})
      </div>

      {/* Device frame */}
      <div
        className="relative bg-gray-900 rounded-2xl p-3 shadow-xl"
        style={{
          // Max height to fit in viewport, maintain aspect ratio
          maxHeight: '70vh',
        }}
      >
        {/* Screen bezel */}
        <div
          className="relative bg-gray-100 rounded-lg overflow-hidden"
          style={{
            aspectRatio: aspectRatio.toString(),
            width: 'auto',
            height: '60vh',
            maxHeight: '500px',
          }}
        >
          {/* Toolbar simulation overlay (fixed size) */}
          <div style={toolbarStyle}>
            <span className="text-xs text-white font-medium opacity-70">
              Toolbar
            </span>
          </div>

          {/* Padding guide (dashed border showing content area) */}
          <div style={paddingGuideStyle} />

          {children}
        </div>

        {/* Device button (reMarkable style) */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-gray-700 rounded-full" />
      </div>
    </div>
  );
}
