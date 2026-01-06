// Device types
export type DeviceType = 'remarkable2' | 'paperPro' | 'move';

export interface DeviceConfig {
  id: DeviceType;
  name: string;
  screenSize: string;
  pixels: { width: number; height: number };
  dpi: number;
  pdfPoints: { width: number; height: number };
  margin: number;
}

export const DEVICE_CONFIGS: Record<DeviceType, DeviceConfig> = {
  remarkable2: {
    id: 'remarkable2',
    name: 'reMarkable 2',
    screenSize: '10.3"',
    pixels: { width: 1404, height: 1872 },
    dpi: 226,
    pdfPoints: { width: 448, height: 597 },
    margin: 24,
  },
  paperPro: {
    id: 'paperPro',
    name: 'Paper Pro',
    screenSize: '11.8"',
    pixels: { width: 1620, height: 2160 },
    dpi: 229,
    pdfPoints: { width: 510, height: 679 },
    margin: 28,
  },
  move: {
    id: 'move',
    name: 'Paper Pro Move',
    screenSize: '7.3"',
    pixels: { width: 954, height: 1696 },
    dpi: 264,
    pdfPoints: { width: 260, height: 463 },
    margin: 18,
  },
};

// Template types - bujo is primary
export type PlannerType = 'bujo' | 'daily' | 'weekly' | 'monthly' | 'dotgrid' | 'lined' | 'blank';

// Density affects text size and spacing
export type DensityLevel = 'compact' | 'normal' | 'comfortable';

export interface DensityConfig {
  lineHeight: number;
  fontSize: number;
  headerSize: number;
  spacing: number;
}

export const DENSITY_CONFIGS: Record<DensityLevel, DensityConfig> = {
  compact: {
    lineHeight: 14,
    fontSize: 8,
    headerSize: 12,
    spacing: 0.8,
  },
  normal: {
    lineHeight: 18,
    fontSize: 9,
    headerSize: 14,
    spacing: 1.0,
  },
  comfortable: {
    lineHeight: 24,
    fontSize: 10,
    headerSize: 16,
    spacing: 1.2,
  },
};

// Page background styles
export type PageStyle = 'dotgrid' | 'lined' | 'blank';

// Toolbar position for navigation bar
export type ToolbarPosition = 'top' | 'bottom' | 'left' | 'right';

// Padding configuration for each side
export interface PaddingConfig {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

// Default toolbar height (in PDF points) matching reMarkable device toolbar
export const DEFAULT_TOOLBAR_SIZE = 40;

// Bullet journal specific config
export interface BujoConfig {
  includeFutureLog: boolean;
  futureLogMonths: 6 | 12;
  includeMonthlyLog: boolean;
  includeWeeklyReview: boolean;
  includeDailyLog: boolean;
  includeCollectionPages: number;
  showBulletKey: boolean;
  density: DensityLevel;
  dailyPageStyle: PageStyle;
  collectionPageStyle: PageStyle;
  dotSpacing: number; // Spacing between dots (8-24), default 14
}

export interface PlannerConfig {
  type: PlannerType;
  device: DeviceType;
  startDate: Date;
  endDate: Date;
  includeWeekends: boolean;
  timeStart: number; // Hour (0-23)
  timeEnd: number;   // Hour (0-23)
  timeInterval: 30 | 60; // minutes
  includeIndex: boolean;
  pageNumbers: boolean;
  darkMode: boolean; // Invert colors for dark background
  title?: string;
  bujoConfig?: BujoConfig;
  // Toolbar and padding settings
  toolbarPosition: ToolbarPosition;
  padding: PaddingConfig;
}

// Color scheme for PDF generation
export interface ColorScheme {
  background: { r: number; g: number; b: number };
  text: { r: number; g: number; b: number };
  textMuted: { r: number; g: number; b: number };
  line: { r: number; g: number; b: number };
  lineFaint: { r: number; g: number; b: number };
  dot: { r: number; g: number; b: number };
  accent: { r: number; g: number; b: number };
}

export const LIGHT_COLORS: ColorScheme = {
  background: { r: 1, g: 1, b: 1 },
  text: { r: 0, g: 0, b: 0 },
  textMuted: { r: 0.4, g: 0.4, b: 0.4 },
  line: { r: 0.8, g: 0.8, b: 0.8 },
  lineFaint: { r: 0.9, g: 0.9, b: 0.9 },
  dot: { r: 0.45, g: 0.45, b: 0.45 },
  accent: { r: 0.3, g: 0.3, b: 0.3 },
};

export const DARK_COLORS: ColorScheme = {
  background: { r: 0.1, g: 0.1, b: 0.1 },
  text: { r: 1, g: 1, b: 1 },
  textMuted: { r: 0.7, g: 0.7, b: 0.7 },
  line: { r: 0.3, g: 0.3, b: 0.3 },
  lineFaint: { r: 0.2, g: 0.2, b: 0.2 },
  dot: { r: 0.5, g: 0.5, b: 0.5 },
  accent: { r: 0.7, g: 0.7, b: 0.7 },
};

export function getColorScheme(darkMode: boolean): ColorScheme {
  return darkMode ? DARK_COLORS : LIGHT_COLORS;
}

// Legacy constant for backwards compatibility (will be removed)
// Use DEVICE_CONFIGS['remarkable2'].pdfPoints instead
export const REMARKABLE_PAGE = {
  WIDTH: 448,
  HEIGHT: 597,
  MARGIN: 24,
} as const;
