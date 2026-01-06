import { rgb } from 'pdf-lib';
import type { PDFPage, PDFFont } from 'pdf-lib';
import type { Dimensions, NavContext, PageType } from './types';
import type { PageStyle, ColorScheme } from '../../../../types/planner';

/**
 * Get nav labels for a page type based on what sections exist.
 * These must match what getNavItemsForPage() returns in navigation.ts.
 * Using full names instead of abbreviations for better readability.
 */
export function getNavLabels(pageType: PageType, nav: NavContext): string[] {
  const labels: string[] = [];

  switch (pageType) {
    case 'daily':
      // Daily: Index | Future Log | Monthly | Tasks | Weekly
      labels.push('Index');
      if (nav.hasFutureLog) labels.push('Future Log');
      if (nav.hasMonthlyLog) {
        labels.push('Monthly');
        labels.push('Tasks');
      }
      if (nav.hasWeeklyReview) labels.push('Weekly');
      break;

    case 'weekly':
      // Weekly: < | Index | Future Log | Monthly | Tasks | >
      labels.push('<');
      labels.push('Index');
      if (nav.hasFutureLog) labels.push('Future Log');
      if (nav.hasMonthlyLog) {
        labels.push('Monthly');
        labels.push('Tasks');
      }
      labels.push('>');
      break;

    case 'monthly':
      // Monthly Calendar: < | Index | Future Log | Tasks | >
      labels.push('<');
      labels.push('Index');
      if (nav.hasFutureLog) labels.push('Future Log');
      labels.push('Tasks');
      labels.push('>');
      break;

    case 'monthly-tasks':
      // Monthly Tasks: < | Index | Future Log | Calendar | >
      labels.push('<');
      labels.push('Index');
      if (nav.hasFutureLog) labels.push('Future Log');
      labels.push('Calendar');
      labels.push('>');
      break;

    case 'future':
      // Future Log: Index (arrows added by nav system if multi-page)
      labels.push('Index');
      break;

    case 'key':
      // Key: Index | Future Log
      labels.push('Index');
      if (nav.hasFutureLog) labels.push('Future Log');
      break;

    case 'collection':
      // Collection: < | Index | >
      labels.push('<');
      labels.push('Index');
      labels.push('>');
      break;

    case 'index':
      // Index: Future Log (if exists)
      if (nav.hasFutureLog) labels.push('Future Log');
      break;
  }

  return labels;
}

/**
 * Draw top navigation bar with text links.
 * Returns the Y position below the navigation.
 * Accounts for reMarkable toolbar by using padding.top.
 */
export function drawTopNavigation(
  page: PDFPage,
  font: PDFFont,
  dims: Dimensions,
  colors: ColorScheme,
  navItems: string[] = ['Index']
): number {
  const { HEIGHT, padding } = dims;
  const navFontSize = 7;
  // Position below the top padding area (where toolbar would be)
  const navY = HEIGHT - padding.top - navFontSize - 2;
  const navColor = rgb(colors.textMuted.r, colors.textMuted.g, colors.textMuted.b);
  const separatorColor = rgb(colors.line.r, colors.line.g, colors.line.b);

  let navX = padding.left;

  for (let i = 0; i < navItems.length; i++) {
    page.drawText(navItems[i], {
      x: navX,
      y: navY,
      size: navFontSize,
      font,
      color: navColor,
    });
    navX += font.widthOfTextAtSize(navItems[i], navFontSize);

    if (i < navItems.length - 1) {
      page.drawText('  |  ', {
        x: navX,
        y: navY,
        size: navFontSize,
        font,
        color: separatorColor,
      });
      navX += font.widthOfTextAtSize('  |  ', navFontSize);
    }
  }

  return navY - navFontSize - 6;
}

/**
 * Draw a compact page title.
 * Returns the Y position below the title.
 */
export function drawPageTitle(
  page: PDFPage,
  title: string,
  font: PDFFont,
  dims: Dimensions,
  colors: ColorScheme,
  startY: number,
  fontSize: number = 10
): number {
  const { padding } = dims;
  const textColor = rgb(colors.text.r, colors.text.g, colors.text.b);

  page.drawText(title, {
    x: padding.left,
    y: startY,
    size: fontSize,
    font,
    color: textColor,
  });

  return startY - fontSize - 8;
}

/**
 * Draw dotgrid background.
 */
export function drawDotGrid(
  page: PDFPage,
  startY: number,
  endY: number,
  dims: Dimensions,
  colors: ColorScheme,
  spacing: number
): void {
  const { WIDTH, padding } = dims;
  const leftMargin = padding.left;
  const rightMargin = padding.right;
  const dotSize = 0.5;
  const dotColor = rgb(colors.dot.r, colors.dot.g, colors.dot.b);

  for (let y = startY; y >= endY; y -= spacing) {
    for (let x = leftMargin; x <= WIDTH - rightMargin; x += spacing) {
      page.drawCircle({
        x,
        y,
        size: dotSize,
        color: dotColor,
      });
    }
  }
}

/**
 * Draw lined background.
 */
export function drawLined(
  page: PDFPage,
  startY: number,
  endY: number,
  dims: Dimensions,
  colors: ColorScheme,
  lineHeight: number
): void {
  const { WIDTH, padding } = dims;
  const leftMargin = padding.left;
  const rightMargin = padding.right;
  const lineColor = rgb(colors.line.r, colors.line.g, colors.line.b);

  for (let y = startY; y >= endY; y -= lineHeight) {
    page.drawLine({
      start: { x: leftMargin, y },
      end: { x: WIDTH - rightMargin, y },
      thickness: 0.25,
      color: lineColor,
    });
  }
}

/**
 * Draw page background based on style.
 * @param dotSpacing - Spacing for dot grid (optional, defaults to lineHeight)
 */
export function drawPageBackground(
  page: PDFPage,
  style: PageStyle,
  startY: number,
  endY: number,
  dims: Dimensions,
  colors: ColorScheme,
  lineHeight: number,
  dotSpacing?: number
): void {
  switch (style) {
    case 'dotgrid':
      drawDotGrid(page, startY, endY, dims, colors, dotSpacing ?? lineHeight);
      break;
    case 'lined':
      drawLined(page, startY, endY, dims, colors, lineHeight);
      break;
    case 'blank':
      // No background
      break;
  }
}

/**
 * Draw dark mode background if needed.
 */
export function drawDarkModeBackground(
  page: PDFPage,
  dims: Dimensions,
  colors: ColorScheme
): void {
  const { WIDTH, HEIGHT } = dims;
  const { background } = colors;

  if (background.r < 1 || background.g < 1 || background.b < 1) {
    page.drawRectangle({
      x: 0,
      y: 0,
      width: WIDTH,
      height: HEIGHT,
      color: rgb(background.r, background.g, background.b),
    });
  }
}
