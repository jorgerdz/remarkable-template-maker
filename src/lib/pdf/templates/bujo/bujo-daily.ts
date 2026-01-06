import { format } from 'date-fns';
import type { BujoGeneratorContext, PageRef } from './types';
import { drawTopNavigation, drawPageTitle, drawPageBackground, drawDarkModeBackground, getNavLabels } from './page-utils';
import { formatYearMonth, getWeekNumber } from './navigation';

export function generateDailyLog(
  ctx: BujoGeneratorContext,
  date: Date
): PageRef {
  const { pdfDoc, font, fontBold, dims, density, dailyPageStyle, dotSpacing, nav, colors } = ctx;
  const { WIDTH, HEIGHT, padding } = dims;

  const page = pdfDoc.addPage([WIDTH, HEIGHT]);
  const pageIndex = pdfDoc.getPageCount() - 1;

  // Draw dark mode background if needed
  drawDarkModeBackground(page, dims, colors);

  // Top navigation with context-aware items
  const navLabels = getNavLabels('daily', nav);
  const navY = drawTopNavigation(page, font, dims, colors, navLabels);

  // Date title with full day name and month (e.g., "Monday January 5th")
  const dateStr = format(date, 'EEEE MMMM do');
  const contentStartY = drawPageTitle(page, dateStr, fontBold, dims, colors, navY, 10);

  // Content area with background - use bottom padding
  const contentEndY = padding.bottom;
  drawPageBackground(page, dailyPageStyle, contentStartY, contentEndY, dims, colors, density.lineHeight, dotSpacing);

  return {
    label: format(date, 'EEE, MMM d'),
    pageIndex,
    type: 'daily',
    date,
    monthIndex: date.getMonth(),
    yearMonth: formatYearMonth(date),
    weekIndex: getWeekNumber(date),
  };
}
