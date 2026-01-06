import { rgb } from 'pdf-lib';
import type { PDFPage } from 'pdf-lib';
import type { BujoGeneratorContext, PageRef } from './types';
import type { ColorScheme } from '../../../../types/planner';
import { drawTopNavigation, drawPageTitle, drawDarkModeBackground, getNavLabels } from './page-utils';

const BULLET_KEY = [
  { symbol: 'dot', label: 'Task', description: 'Something to be done' },
  { symbol: 'x', label: 'Complete', description: 'Accomplished task' },
  { symbol: '>', label: 'Migrated', description: 'Moved to future log' },
  { symbol: '<', label: 'Scheduled', description: 'Moved to specific date' },
  { symbol: 'circle', label: 'Event', description: 'Date-related entry' },
  { symbol: '-', label: 'Note', description: 'Facts, ideas, thoughts' },
  { symbol: '*', label: 'Priority', description: 'Important signifier' },
  { symbol: '!', label: 'Inspiration', description: 'Great ideas to revisit' },
];

function drawBulletSymbol(page: PDFPage, symbol: string, x: number, y: number, size: number, colors: ColorScheme) {
  const textColor = rgb(colors.text.r, colors.text.g, colors.text.b);
  const bgColor = rgb(colors.background.r, colors.background.g, colors.background.b);

  switch (symbol) {
    case 'dot':
      page.drawCircle({
        x: x + size / 2,
        y: y + size / 2,
        size: size / 2,
        color: textColor,
      });
      return true;
    case 'circle':
      page.drawCircle({
        x: x + size / 2,
        y: y + size / 2,
        size: size / 2,
        borderColor: textColor,
        borderWidth: 1,
        color: bgColor,
      });
      return true;
    case 'x':
      page.drawLine({
        start: { x, y },
        end: { x: x + size, y: y + size },
        thickness: 1.5,
        color: textColor,
      });
      page.drawLine({
        start: { x: x + size, y },
        end: { x, y: y + size },
        thickness: 1.5,
        color: textColor,
      });
      return true;
    default:
      return false;
  }
}

export function generateKeyPage(ctx: BujoGeneratorContext): PageRef {
  const { pdfDoc, font, fontBold, dims, density, nav, colors } = ctx;
  const { WIDTH, HEIGHT, padding } = dims;

  const page = pdfDoc.addPage([WIDTH, HEIGHT]);
  const pageIndex = pdfDoc.getPageCount() - 1;

  // Draw dark mode background if needed
  drawDarkModeBackground(page, dims, colors);

  const textColor = rgb(colors.text.r, colors.text.g, colors.text.b);
  const mutedColor = rgb(colors.textMuted.r, colors.textMuted.g, colors.textMuted.b);

  // Top navigation with context-aware items
  const navLabels = getNavLabels('key', nav);
  const navY = drawTopNavigation(page, font, dims, colors, navLabels);

  // Title
  const contentTop = drawPageTitle(page, 'Key', fontBold, dims, colors, navY, 11);

  // Subtitle
  page.drawText('Rapid Logging Signifiers', {
    x: padding.left,
    y: contentTop + 2,
    size: 7,
    font,
    color: mutedColor,
  });

  // Key entries
  const availableHeight = contentTop - padding.bottom - 10;
  const lineHeight = Math.min(availableHeight / BULLET_KEY.length, density.lineHeight * 2);
  let y = contentTop - 15;

  for (const entry of BULLET_KEY) {
    // Symbol
    const symbolSize = 6;
    const drewShape = drawBulletSymbol(page, entry.symbol, padding.left, y - 2, symbolSize, colors);
    if (!drewShape) {
      page.drawText(entry.symbol, {
        x: padding.left,
        y: y,
        size: 10,
        font: fontBold,
        color: textColor,
      });
    }

    // Label
    page.drawText(entry.label, {
      x: padding.left + 20,
      y: y,
      size: density.fontSize,
      font: fontBold,
      color: textColor,
    });

    // Description
    page.drawText(entry.description, {
      x: padding.left + 20,
      y: y - 10,
      size: density.fontSize - 1,
      font,
      color: mutedColor,
    });

    y -= lineHeight;
  }

  return {
    label: 'Key',
    pageIndex,
    type: 'key',
  };
}
