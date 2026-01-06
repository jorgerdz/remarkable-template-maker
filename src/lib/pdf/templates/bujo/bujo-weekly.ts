import { rgb } from 'pdf-lib';
import type { PDFPage, PDFFont, Color } from 'pdf-lib';
import { format, endOfWeek } from 'date-fns';
import type { BujoGeneratorContext, PageRef } from './types';
import { drawTopNavigation, drawPageTitle, drawDarkModeBackground, getNavLabels } from './page-utils';
import { getWeekNumber, formatYearMonth } from './navigation';

export function generateWeeklyReview(
  ctx: BujoGeneratorContext,
  weekStartDate: Date
): PageRef {
  const { pdfDoc, font, fontBold, dims, density, nav, colors } = ctx;
  const { WIDTH, HEIGHT, padding } = dims;

  const page = pdfDoc.addPage([WIDTH, HEIGHT]);
  const pageIndex = pdfDoc.getPageCount() - 1;

  // Draw dark mode background if needed
  drawDarkModeBackground(page, dims, colors);

  // Pre-compute colors
  const mutedColor = rgb(colors.textMuted.r, colors.textMuted.g, colors.textMuted.b);
  const accentColor = rgb(colors.accent.r, colors.accent.g, colors.accent.b);
  const lineColor = rgb(colors.line.r, colors.line.g, colors.line.b);
  const lineFaintColor = rgb(colors.lineFaint.r, colors.lineFaint.g, colors.lineFaint.b);
  const dotColor = rgb(colors.dot.r, colors.dot.g, colors.dot.b);

  const weekNum = getWeekNumber(weekStartDate);
  const weekEnd = endOfWeek(weekStartDate, { weekStartsOn: 0 });

  // Top navigation with context-aware items
  const navLabels = getNavLabels('weekly', nav);
  const navY = drawTopNavigation(page, font, dims, colors, navLabels);

  // Title with date range
  const title = `Week ${weekNum}`;
  let contentTop = drawPageTitle(page, title, fontBold, dims, colors, navY, 11);

  // Date range subtitle
  const dateRange = `${format(weekStartDate, 'MMM d')} - ${format(weekEnd, 'MMM d')}`;
  page.drawText(dateRange, {
    x: padding.left,
    y: contentTop + 2,
    size: 7,
    font,
    color: mutedColor,
  });
  contentTop -= 8;

  // Calculate section heights
  const availableHeight = contentTop - padding.bottom;
  const sectionHeight = availableHeight / 3;
  const lineHeight = density.lineHeight;

  // Section 1: What Went Well
  drawSection(page, 'What went well', contentTop, sectionHeight, padding.left, padding.right, WIDTH, font, fontBold, lineHeight, accentColor, lineColor, lineFaintColor, dotColor);

  // Section 2: What to Improve
  const section2Y = contentTop - sectionHeight;
  drawSection(page, 'What to improve', section2Y, sectionHeight, padding.left, padding.right, WIDTH, font, fontBold, lineHeight, accentColor, lineColor, lineFaintColor, dotColor);

  // Section 3: Goals for Next Week
  const section3Y = section2Y - sectionHeight;
  drawSection(page, 'Goals for next week', section3Y, sectionHeight, padding.left, padding.right, WIDTH, font, fontBold, lineHeight, accentColor, lineColor, lineFaintColor, dotColor);

  return {
    label: `Week ${weekNum}`,
    pageIndex,
    type: 'weekly',
    date: weekStartDate,
    weekIndex: weekNum,
    monthIndex: weekStartDate.getMonth(),
    yearMonth: formatYearMonth(weekStartDate),
  };
}

function drawSection(
  page: PDFPage,
  title: string,
  topY: number,
  height: number,
  leftMargin: number,
  rightMargin: number,
  width: number,
  _font: PDFFont,
  fontBold: PDFFont,
  lineHeight: number,
  accentColor: Color,
  lineColor: Color,
  lineFaintColor: Color,
  dotColor: Color
): void {
  // Section header
  page.drawText(title, {
    x: leftMargin,
    y: topY - 2,
    size: 8,
    font: fontBold,
    color: accentColor,
  });

  // Section separator
  page.drawLine({
    start: { x: leftMargin, y: topY - 10 },
    end: { x: width - rightMargin, y: topY - 10 },
    thickness: 0.5,
    color: lineColor,
  });

  // Bullet lines for notes
  const startY = topY - 20;
  const numLines = Math.floor((height - 30) / lineHeight);

  for (let i = 0; i < numLines; i++) {
    const lineY = startY - i * lineHeight;

    // Bullet point
    page.drawCircle({
      x: leftMargin + 4,
      y: lineY + 3,
      size: 1.5,
      color: dotColor,
    });

    // Line
    page.drawLine({
      start: { x: leftMargin + 12, y: lineY + 3 },
      end: { x: width - rightMargin, y: lineY + 3 },
      thickness: 0.25,
      color: lineFaintColor,
    });
  }
}
