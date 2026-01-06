import type { PDFDocument, PDFFont } from 'pdf-lib';
import { rgb } from 'pdf-lib';
import { eachDayOfInterval, eachMonthOfInterval, eachWeekOfInterval } from 'date-fns';
import type { PlannerConfig, ColorScheme } from '../../../../types/planner';
import { DENSITY_CONFIGS } from '../../../../types/planner';
import type { PageRef, Dimensions, BujoGeneratorContext, NavContext } from './types';
import { generateKeyPage } from './bujo-key';
import { generateFutureLog } from './bujo-future';
import { generateMonthlyLog } from './bujo-monthly';
import { generateDailyLog } from './bujo-daily';
import { generateWeeklyReview } from './bujo-weekly';
import { generateCollectionPages } from './bujo-collection';
import { createInternalLink } from '../../hyperlinks';

export function generateBujoPages(
  pdfDoc: PDFDocument,
  config: PlannerConfig,
  font: PDFFont,
  fontBold: PDFFont,
  dims: Dimensions,
  colors: ColorScheme
): PageRef[] {
  const bujoConfig = config.bujoConfig;
  if (!bujoConfig) {
    return [];
  }

  const density = DENSITY_CONFIGS[bujoConfig.density || 'normal'];
  const dailyPageStyle = bujoConfig.dailyPageStyle || 'dotgrid';
  const collectionPageStyle = bujoConfig.collectionPageStyle || 'dotgrid';
  const dotSpacing = bujoConfig.dotSpacing || 14;

  // Build nav context to tell page generators which sections exist
  const nav: NavContext = {
    hasFutureLog: bujoConfig.includeFutureLog,
    hasMonthlyLog: bujoConfig.includeMonthlyLog,
    hasWeeklyReview: bujoConfig.includeWeeklyReview,
    hasDailyLog: bujoConfig.includeDailyLog,
  };

  const ctx: BujoGeneratorContext = {
    pdfDoc, font, fontBold, dims, density,
    dailyPageStyle, collectionPageStyle, dotSpacing, nav, colors
  };
  const pageRefs: PageRef[] = [];

  // 1. Generate Key page
  if (bujoConfig.showBulletKey) {
    const keyRef = generateKeyPage(ctx);
    pageRefs.push(keyRef);
  }

  // 2. Generate Future Log
  if (bujoConfig.includeFutureLog) {
    const futureRefs = generateFutureLog(ctx, config.startDate, bujoConfig.futureLogMonths);
    pageRefs.push(...futureRefs);
  }

  // 3. Generate Monthly Logs
  if (bujoConfig.includeMonthlyLog) {
    const months = eachMonthOfInterval({
      start: config.startDate,
      end: config.endDate,
    });

    for (const monthDate of months) {
      const monthRefs = generateMonthlyLog(ctx, monthDate);
      pageRefs.push(...monthRefs);
    }
  }

  // 4. Generate Weekly Reviews (if enabled)
  if (bujoConfig.includeWeeklyReview) {
    const weeks = eachWeekOfInterval({
      start: config.startDate,
      end: config.endDate,
    }, { weekStartsOn: 0 });

    for (const weekStart of weeks) {
      const weekRef = generateWeeklyReview(ctx, weekStart);
      pageRefs.push(weekRef);
    }
  }

  // 5. Generate Daily Logs
  if (bujoConfig.includeDailyLog) {
    const days = eachDayOfInterval({
      start: config.startDate,
      end: config.endDate,
    });

    for (const day of days) {
      const dayOfWeek = day.getDay();
      // Skip weekends if not included
      if (!config.includeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
        continue;
      }

      const dailyRef = generateDailyLog(ctx, day);
      pageRefs.push(dailyRef);
    }
  }

  // 6. Generate Collection Pages
  if (bujoConfig.includeCollectionPages > 0) {
    const collectionRefs = generateCollectionPages(
      ctx,
      bujoConfig.includeCollectionPages
    );
    pageRefs.push(...collectionRefs);
  }

  return pageRefs;
}

interface IndexPageState {
  page: ReturnType<PDFDocument['insertPage']>;
  y: number;
  pageNumber: number;
}

function createIndexPage(
  pdfDoc: PDFDocument,
  insertIndex: number,
  dims: Dimensions,
  fontBold: PDFFont,
  pageNumber: number,
  colors: ColorScheme,
  title?: string
): IndexPageState {
  const { WIDTH, HEIGHT, MARGIN, TOOLBAR_HEIGHT } = dims;
  const page = pdfDoc.insertPage(insertIndex, [WIDTH, HEIGHT]);

  // Draw background for dark mode
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

  // Account for toolbar at top
  const topY = HEIGHT - MARGIN - TOOLBAR_HEIGHT;
  const textColor = rgb(colors.text.r, colors.text.g, colors.text.b);

  const pageTitle = title || (pageNumber === 1 ? 'INDEX' : `INDEX (${pageNumber})`);
  page.drawText(pageTitle, {
    x: MARGIN,
    y: topY - 5,
    size: 16,
    font: fontBold,
    color: textColor,
  });

  return {
    page,
    y: topY - 30,
    pageNumber,
  };
}

// Group daily refs by month for compact display
function groupDailyByMonth(dailyRefs: PageRef[]): Map<string, PageRef[]> {
  const grouped = new Map<string, PageRef[]>();
  for (const ref of dailyRefs) {
    if (!ref.date) continue;
    const monthKey = `${ref.date.getFullYear()}-${ref.date.getMonth()}`;
    if (!grouped.has(monthKey)) {
      grouped.set(monthKey, []);
    }
    grouped.get(monthKey)!.push(ref);
  }
  return grouped;
}

// Group weekly refs by month
function groupWeeklyByMonth(weeklyRefs: PageRef[]): Map<number, PageRef[]> {
  const grouped = new Map<number, PageRef[]>();
  for (const ref of weeklyRefs) {
    const monthIdx = ref.monthIndex ?? 0;
    if (!grouped.has(monthIdx)) {
      grouped.set(monthIdx, []);
    }
    grouped.get(monthIdx)!.push(ref);
  }
  return grouped;
}

export interface BujoIndexResult {
  pageCount: number;
  indexRefs: PageRef[];
}

export function addBujoIndex(
  pdfDoc: PDFDocument,
  pageRefs: PageRef[],
  font: PDFFont,
  fontBold: PDFFont,
  dims: Dimensions,
  insertOffset: number = 1, // Default offset of 1 to account for cover page
  colors: ColorScheme
): BujoIndexResult {
  const { WIDTH, MARGIN } = dims;
  const minY = MARGIN + 30;

  const textColor = rgb(colors.text.r, colors.text.g, colors.text.b);
  const mutedColor = rgb(colors.textMuted.r, colors.textMuted.g, colors.textMuted.b);
  const lineColor = rgb(colors.line.r, colors.line.g, colors.line.b);
  const lineFaintColor = rgb(colors.lineFaint.r, colors.lineFaint.g, colors.lineFaint.b);

  // Separate refs by type
  const keyRefs = pageRefs.filter((r) => r.type === 'key');
  const futureRefs = pageRefs.filter((r) => r.type === 'future');
  const monthlyRefs = pageRefs.filter((r) => r.type === 'monthly');
  const weeklyRefs = pageRefs.filter((r) => r.type === 'weekly');
  const dailyRefs = pageRefs.filter((r) => r.type === 'daily');
  const collectionRefs = pageRefs.filter((r) => r.type === 'collection');

  const indexRefs: PageRef[] = [];
  let indexPageCount = 0;
  let state = createIndexPage(pdfDoc, insertOffset, dims, fontBold, 1, colors);
  indexRefs.push({ label: 'Index', pageIndex: insertOffset, type: 'index' });
  indexPageCount++;

  const contentWidth = WIDTH - 2 * MARGIN;
  const monthColWidth = Math.min(80, contentWidth * 0.25);
  const fontSize = 8;
  const smallFontSize = 7;
  const rowHeight = 28;

  // Helper to add a link
  const addLink = (x: number, y: number, w: number, h: number, targetIdx: number) => {
    createInternalLink(pdfDoc, state.page, {
      x,
      y: y - 2,
      width: w,
      height: h,
    }, targetIdx + indexPageCount);
  };

  // === PAGE 1: Monthly + Weekly Overview ===

  // Key & Future Log (compact, single line each)
  if (keyRefs.length > 0 || futureRefs.length > 0) {
    let x = MARGIN;
    if (keyRefs.length > 0) {
      state.page.drawText('Key', { x, y: state.y, size: fontSize, font, color: textColor });
      const keyWidth = font.widthOfTextAtSize('Key', fontSize);
      state.page.drawText(' >', { x: x + keyWidth, y: state.y, size: fontSize, font, color: mutedColor });
      addLink(x, state.y, keyWidth + 15, 12, keyRefs[0].pageIndex);
      x += keyWidth + 30;
    }
    if (futureRefs.length > 0) {
      state.page.drawText('Future Log', { x, y: state.y, size: fontSize, font, color: textColor });
      const flWidth = font.widthOfTextAtSize('Future Log', fontSize);
      state.page.drawText(' >', { x: x + flWidth, y: state.y, size: fontSize, font, color: mutedColor });
      addLink(x, state.y, flWidth + 15, 12, futureRefs[0].pageIndex);
    }
    state.y -= 20;
  }

  // Monthly + Weekly table header
  if (monthlyRefs.length > 0 || weeklyRefs.length > 0) {
    state.page.drawText('Monthly', {
      x: MARGIN,
      y: state.y,
      size: fontSize + 1,
      font: fontBold,
      color: textColor,
    });

    if (weeklyRefs.length > 0) {
      state.page.drawText('Weekly Reviews', {
        x: MARGIN + monthColWidth,
        y: state.y,
        size: fontSize + 1,
        font: fontBold,
        color: textColor,
      });
    }

    state.y -= 5;
    state.page.drawLine({
      start: { x: MARGIN, y: state.y },
      end: { x: WIDTH - MARGIN, y: state.y },
      thickness: 0.5,
      color: lineColor,
    });
    state.y -= 15;

    // Group weekly by month
    const weeklyByMonth = groupWeeklyByMonth(weeklyRefs);

    // Get unique months from monthly refs
    const months = monthlyRefs.filter((r) => r.date).map((r) => ({
      date: r.date!,
      ref: r,
    }));

    // Deduplicate months (in case of split calendar/tasks pages)
    const uniqueMonths = new Map<string, { date: Date; ref: PageRef }>();
    for (const m of months) {
      const key = `${m.date.getFullYear()}-${m.date.getMonth()}`;
      if (!uniqueMonths.has(key)) {
        uniqueMonths.set(key, m);
      }
    }

    for (const [, { date, ref }] of uniqueMonths) {
      if (state.y < minY) {
        state = createIndexPage(pdfDoc, insertOffset + indexPageCount, dims, fontBold, indexPageCount + 1, colors);
        indexRefs.push({ label: `Index (${indexPageCount + 1})`, pageIndex: insertOffset + indexPageCount, type: 'index' });
        indexPageCount++;
      }

      const monthName = date.toLocaleString('default', { month: 'long' });
      const monthIdx = date.getMonth();

      // Month name with arrow
      state.page.drawText(monthName, {
        x: MARGIN,
        y: state.y,
        size: fontSize,
        font,
        color: textColor,
      });
      const monthWidth = font.widthOfTextAtSize(monthName, fontSize);
      state.page.drawText(' >', {
        x: MARGIN + monthWidth,
        y: state.y,
        size: fontSize,
        font,
        color: mutedColor,
      });
      addLink(MARGIN, state.y, monthWidth + 15, 12, ref.pageIndex);

      // Weekly links for this month
      const monthWeeks = weeklyByMonth.get(monthIdx) || [];
      let wx = MARGIN + monthColWidth;
      for (const weekRef of monthWeeks) {
        const weekNum = weekRef.weekIndex?.toString() || '?';
        state.page.drawText(weekNum, {
          x: wx,
          y: state.y,
          size: smallFontSize,
          font,
          color: textColor,
        });
        const numWidth = font.widthOfTextAtSize(weekNum, smallFontSize);
        state.page.drawText('>', {
          x: wx + numWidth + 1,
          y: state.y,
          size: smallFontSize,
          font,
          color: mutedColor,
        });
        addLink(wx, state.y, numWidth + 10, 10, weekRef.pageIndex);
        wx += 28;
      }

      // Separator line
      state.y -= 4;
      state.page.drawLine({
        start: { x: MARGIN, y: state.y },
        end: { x: WIDTH - MARGIN, y: state.y },
        thickness: 0.25,
        color: lineFaintColor,
      });
      state.y -= rowHeight - 10;
    }
  }

  // === PAGE 2+: Daily Logs (compact grid by month) ===
  if (dailyRefs.length > 0) {
    state = createIndexPage(pdfDoc, insertOffset + indexPageCount, dims, fontBold, indexPageCount + 1, colors, 'INDEX - Daily');
    indexRefs.push({ label: 'Index - Daily', pageIndex: insertOffset + indexPageCount, type: 'index' });
    indexPageCount++;

    state.page.drawText('Daily Logs', {
      x: MARGIN,
      y: state.y,
      size: fontSize + 1,
      font: fontBold,
      color: textColor,
    });
    state.y -= 18;

    const dailyByMonth = groupDailyByMonth(dailyRefs);
    const dayNumWidth = 16; // Wider spacing between days
    const monthRowHeight = 42;

    for (const [, days] of dailyByMonth) {
      if (state.y < minY + monthRowHeight) {
        state = createIndexPage(pdfDoc, insertOffset + indexPageCount, dims, fontBold, indexPageCount + 1, colors, 'INDEX - Daily');
        indexRefs.push({ label: 'Index - Daily', pageIndex: insertOffset + indexPageCount, type: 'index' });
        indexPageCount++;
      }

      // Get month name from first day
      const firstDay = days[0].date!;
      const monthName = firstDay.toLocaleString('default', { month: 'long' });

      // Month header
      state.page.drawText(monthName, {
        x: MARGIN,
        y: state.y,
        size: fontSize,
        font,
        color: textColor,
      });
      state.y -= 14;

      // Day numbers in a row with consistent spacing
      const maxDaysPerRow = Math.floor(contentWidth / dayNumWidth);

      for (let i = 0; i < days.length; i++) {
        const dayRef = days[i];
        const dayNum = dayRef.date!.getDate().toString();
        const col = i % maxDaysPerRow;

        if (i > 0 && col === 0) {
          state.y -= 14; // Row spacing
        }

        // Fixed column position for consistent spacing
        const dx = MARGIN + col * dayNumWidth;

        state.page.drawText(dayNum, {
          x: dx,
          y: state.y,
          size: smallFontSize,
          font,
          color: textColor,
        });
        addLink(dx - 2, state.y - 2, dayNumWidth, 12, dayRef.pageIndex);
      }

      // Separator
      state.y -= 6;
      state.page.drawLine({
        start: { x: MARGIN, y: state.y },
        end: { x: WIDTH - MARGIN, y: state.y },
        thickness: 0.25,
        color: lineFaintColor,
      });
      state.y -= 14;
    }
  }

  // === Collections (if any) ===
  if (collectionRefs.length > 0) {
    if (state.y < minY + 50) {
      state = createIndexPage(pdfDoc, insertOffset + indexPageCount, dims, fontBold, indexPageCount + 1, colors);
      indexRefs.push({ label: `Index (${indexPageCount + 1})`, pageIndex: insertOffset + indexPageCount, type: 'index' });
      indexPageCount++;
    }

    state.page.drawText('Collections', {
      x: MARGIN,
      y: state.y,
      size: fontSize + 1,
      font: fontBold,
      color: textColor,
    });
    state.y -= 15;

    // Show collection page numbers in a row
    let cx = MARGIN;
    for (let i = 0; i < collectionRefs.length; i++) {
      const ref = collectionRefs[i];
      const num = (i + 1).toString();
      state.page.drawText(num, {
        x: cx,
        y: state.y,
        size: smallFontSize,
        font,
        color: textColor,
      });
      addLink(cx - 1, state.y, 12, 10, ref.pageIndex);
      cx += 14;

      if (cx > WIDTH - MARGIN - 20) {
        cx = MARGIN;
        state.y -= 12;
      }
    }
  }

  return { pageCount: indexPageCount, indexRefs };
}

export { type PageRef } from './types';
