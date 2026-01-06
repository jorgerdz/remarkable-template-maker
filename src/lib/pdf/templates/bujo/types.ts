import type { PDFDocument, PDFFont } from 'pdf-lib';
import type { DensityConfig, PageStyle, ColorScheme } from '../../../../types/planner';

export type PageType = 'key' | 'future' | 'monthly' | 'monthly-tasks' | 'weekly' | 'daily' | 'collection' | 'index';

export interface PageRef {
  label: string;
  pageIndex: number;
  type: PageType;
  // Relationship fields for navigation
  date?: Date;              // For daily/weekly pages - the date they represent
  monthIndex?: number;      // Which month (0-11) this page belongs to
  weekIndex?: number;       // Which week of the year this page belongs to
  yearMonth?: string;       // 'YYYY-MM' key for monthly lookups
}

/**
 * Navigation item for top nav bar.
 * label: display text (e.g., 'Idx', 'FL', 'Mon')
 * targetType: what page type to link to (resolved via registry)
 * targetKey: optional key for looking up specific page (e.g., month key)
 */
export interface NavItem {
  label: string;
  targetType: 'index' | 'future' | 'monthly' | 'monthly-tasks' | 'weekly' | 'prev' | 'next';
  targetKey?: string; // For month-specific or week-specific lookups
}

/**
 * Registry of all pages for navigation resolution.
 * Built after all pages are generated.
 */
export interface PageRegistry {
  indexPage: number;
  futureLogPages: number[];     // All future log pages
  monthlyCalPages: Map<string, number>;  // 'YYYY-MM' → calendar page index
  monthlyTasksPages: Map<string, number>; // 'YYYY-MM' → tasks page index
  weeklyPages: Map<number, number>;      // weekIndex → page index
  dailyPages: Map<string, number>;       // 'YYYY-MM-DD' → page index
  collectionPages: number[];    // All collection page indices
  keyPage?: number;             // Key page if exists

  // For prev/next navigation
  pagesByType: Map<PageType, number[]>; // Ordered page indices by type
}

export interface Dimensions {
  WIDTH: number;
  HEIGHT: number;
  MARGIN: number;
  TOOLBAR_HEIGHT: number; // Extra top margin for reMarkable toolbar (legacy)
  // New padding system - padding on each side
  padding: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  toolbarPosition: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Tells page generators which sections will exist (for nav rendering).
 */
export interface NavContext {
  hasFutureLog: boolean;
  hasMonthlyLog: boolean;
  hasWeeklyReview: boolean;
  hasDailyLog: boolean;
}

export interface BujoGeneratorContext {
  pdfDoc: PDFDocument;
  font: PDFFont;
  fontBold: PDFFont;
  dims: Dimensions;
  density: DensityConfig;
  dailyPageStyle: PageStyle;
  collectionPageStyle: PageStyle;
  dotSpacing: number;
  nav: NavContext;
  colors: ColorScheme;
}
