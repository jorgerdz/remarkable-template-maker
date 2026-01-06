import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import type { PlannerConfig, ColorScheme } from '../types/planner';
import type { NavigationConfig } from './pdf/hyperlinks';
import { DEVICE_CONFIGS, DENSITY_CONFIGS, getColorScheme } from '../types/planner';
import { addTocEntryLink, addNavigationLinks } from './pdf/hyperlinks';
import { generateBujoPages, addBujoIndex } from './pdf/templates/bujo';
import { addComprehensiveNavigation, buildPageRegistry, addMonthlyDateLinks } from './pdf/templates/bujo/navigation';

// Helper to get device dimensions with padding config
function getDeviceDimensions(config: PlannerConfig): Dimensions {
  const device = DEVICE_CONFIGS[config.device];
  const { padding } = config;
  return {
    WIDTH: device.pdfPoints.width,
    HEIGHT: device.pdfPoints.height,
    // Use left padding as MARGIN for legacy code (most content uses MARGIN for left/right)
    MARGIN: padding.left,
    // Use top padding as TOOLBAR_HEIGHT for legacy code
    TOOLBAR_HEIGHT: padding.top,
    padding,
    toolbarPosition: config.toolbarPosition,
  };
}

// Helper to draw page background for dark mode
function drawPageBackground(page: PDFPage, dims: Dimensions, colors: ColorScheme): void {
  const { WIDTH, HEIGHT } = dims;
  const { background } = colors;

  // Only draw background if not white (dark mode)
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

// Get planner type display name
function getPlannerTypeName(type: PlannerConfig['type']): string {
  const names: Record<PlannerConfig['type'], string> = {
    bujo: 'Bullet Journal',
    daily: 'Daily Planner',
    weekly: 'Weekly Planner',
    monthly: 'Monthly Planner',
    dotgrid: 'Dot Grid Notebook',
    lined: 'Lined Notebook',
    blank: 'Notebook',
  };
  return names[type];
}

// Generate an elegant cover page
function generateCoverPage(
  pdfDoc: PDFDocument,
  config: PlannerConfig,
  font: PDFFont,
  fontBold: PDFFont,
  dims: Dimensions,
  colors: ColorScheme
): void {
  const { WIDTH, HEIGHT, MARGIN } = dims;
  const page = pdfDoc.addPage([WIDTH, HEIGHT]);

  // Draw background for dark mode
  drawPageBackground(page, dims, colors);

  const centerX = WIDTH / 2;
  const centerY = HEIGHT / 2;

  const textColor = rgb(colors.text.r, colors.text.g, colors.text.b);
  const mutedColor = rgb(colors.textMuted.r, colors.textMuted.g, colors.textMuted.b);
  const accentColor = rgb(colors.accent.r, colors.accent.g, colors.accent.b);

  // Decorative top border line
  const borderY = HEIGHT - MARGIN * 2;
  page.drawLine({
    start: { x: MARGIN * 2, y: borderY },
    end: { x: WIDTH - MARGIN * 2, y: borderY },
    thickness: 1,
    color: accentColor,
  });

  // Small decorative element above title
  const ornamentY = centerY + 60;
  const ornamentWidth = 40;
  page.drawLine({
    start: { x: centerX - ornamentWidth, y: ornamentY },
    end: { x: centerX - 8, y: ornamentY },
    thickness: 0.5,
    color: mutedColor,
  });
  page.drawCircle({
    x: centerX,
    y: ornamentY,
    size: 3,
    color: accentColor,
  });
  page.drawLine({
    start: { x: centerX + 8, y: ornamentY },
    end: { x: centerX + ornamentWidth, y: ornamentY },
    thickness: 0.5,
    color: mutedColor,
  });

  // Main title
  const title = config.title || getPlannerTypeName(config.type);
  const titleSize = Math.min(24, WIDTH / 12); // Scale for smaller devices
  const titleWidth = fontBold.widthOfTextAtSize(title, titleSize);
  page.drawText(title, {
    x: centerX - titleWidth / 2,
    y: centerY + 20,
    size: titleSize,
    font: fontBold,
    color: textColor,
  });

  // Subtitle with date range
  const dateRangeText = `${format(config.startDate, 'MMMM d, yyyy')} - ${format(config.endDate, 'MMMM d, yyyy')}`;
  const subtitleSize = Math.min(10, WIDTH / 30);
  const subtitleWidth = font.widthOfTextAtSize(dateRangeText, subtitleSize);
  page.drawText(dateRangeText, {
    x: centerX - subtitleWidth / 2,
    y: centerY - 10,
    size: subtitleSize,
    font,
    color: mutedColor,
  });

  // Decorative element below subtitle
  const lowerOrnamentY = centerY - 40;
  page.drawLine({
    start: { x: centerX - ornamentWidth, y: lowerOrnamentY },
    end: { x: centerX + ornamentWidth, y: lowerOrnamentY },
    thickness: 0.5,
    color: mutedColor,
  });

  // Bottom decorative border
  const bottomBorderY = MARGIN * 2;
  page.drawLine({
    start: { x: MARGIN * 2, y: bottomBorderY },
    end: { x: WIDTH - MARGIN * 2, y: bottomBorderY },
    thickness: 1,
    color: accentColor,
  });

  // Corner accents (subtle L-shaped corners)
  const cornerSize = 15;
  const cornerThickness = 0.75;

  // Top-left corner
  page.drawLine({
    start: { x: MARGIN, y: HEIGHT - MARGIN },
    end: { x: MARGIN, y: HEIGHT - MARGIN - cornerSize },
    thickness: cornerThickness,
    color: accentColor,
  });
  page.drawLine({
    start: { x: MARGIN, y: HEIGHT - MARGIN },
    end: { x: MARGIN + cornerSize, y: HEIGHT - MARGIN },
    thickness: cornerThickness,
    color: accentColor,
  });

  // Top-right corner
  page.drawLine({
    start: { x: WIDTH - MARGIN, y: HEIGHT - MARGIN },
    end: { x: WIDTH - MARGIN, y: HEIGHT - MARGIN - cornerSize },
    thickness: cornerThickness,
    color: accentColor,
  });
  page.drawLine({
    start: { x: WIDTH - MARGIN, y: HEIGHT - MARGIN },
    end: { x: WIDTH - MARGIN - cornerSize, y: HEIGHT - MARGIN },
    thickness: cornerThickness,
    color: accentColor,
  });

  // Bottom-left corner
  page.drawLine({
    start: { x: MARGIN, y: MARGIN },
    end: { x: MARGIN, y: MARGIN + cornerSize },
    thickness: cornerThickness,
    color: accentColor,
  });
  page.drawLine({
    start: { x: MARGIN, y: MARGIN },
    end: { x: MARGIN + cornerSize, y: MARGIN },
    thickness: cornerThickness,
    color: accentColor,
  });

  // Bottom-right corner
  page.drawLine({
    start: { x: WIDTH - MARGIN, y: MARGIN },
    end: { x: WIDTH - MARGIN, y: MARGIN + cornerSize },
    thickness: cornerThickness,
    color: accentColor,
  });
  page.drawLine({
    start: { x: WIDTH - MARGIN, y: MARGIN },
    end: { x: WIDTH - MARGIN - cornerSize, y: MARGIN },
    thickness: cornerThickness,
    color: accentColor,
  });
}

export async function generatePlannerPDF(config: PlannerConfig): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const dims = getDeviceDimensions(config);
  const colors = getColorScheme(config.darkMode);

  // Generate cover page first
  generateCoverPage(pdfDoc, config, font, fontBold, dims, colors);

  const pageRefs: { label: string; pageIndex: number }[] = [];

  // Store BuJo refs separately for the index
  let bujoPageRefs: ReturnType<typeof generateBujoPages> | null = null;

  switch (config.type) {
    case 'bujo': {
      bujoPageRefs = generateBujoPages(pdfDoc, config, font, fontBold, dims, colors);
      pageRefs.push(...bujoPageRefs.map((ref) => ({ label: ref.label, pageIndex: ref.pageIndex })));
      break;
    }
    case 'daily':
      generateDailyPages(pdfDoc, config, font, fontBold, pageRefs, dims, colors);
      break;
    case 'weekly':
      generateWeeklyPages(pdfDoc, config, font, fontBold, pageRefs, dims, colors);
      break;
    case 'monthly':
      generateMonthlyPages(pdfDoc, config, font, fontBold, pageRefs, dims, colors);
      break;
    case 'dotgrid':
      generateDotGridPages(pdfDoc, 50, dims, colors);
      break;
    case 'lined':
      generateLinedPages(pdfDoc, 50, dims, colors);
      break;
    case 'blank':
      generateBlankPages(pdfDoc, 50, dims, colors);
      break;
  }

  // Add table of contents / index if requested
  // Cover page is at index 0, so TOC/Index goes at index 1
  let tocPageIndex = -1;
  let indexPageCount = 0;
  if (config.includeIndex && pageRefs.length > 0) {
    tocPageIndex = 1; // TOC/Index is inserted after the cover page
    if (bujoPageRefs) {
      // Use BuJo-specific index with typed refs
      const indexResult = addBujoIndex(pdfDoc, bujoPageRefs, font, fontBold, dims, 1, colors);
      indexPageCount = indexResult.pageCount;

      // Update page refs to account for inserted index pages
      for (const ref of bujoPageRefs) {
        ref.pageIndex += indexPageCount;
      }

      // Build registry with all pages including index
      const allRefs = [...indexResult.indexRefs, ...bujoPageRefs];
      const registry = buildPageRegistry(allRefs, tocPageIndex);

      // Add comprehensive navigation to all pages
      addComprehensiveNavigation(pdfDoc, font, dims, allRefs, registry, colors);

      // Add links from monthly calendar dates to daily pages
      const densityLevel = config.bujoConfig?.density || 'normal';
      const density = DENSITY_CONFIGS[densityLevel];
      addMonthlyDateLinks(pdfDoc, font, dims, allRefs, registry, density);
    } else {
      addTableOfContents(pdfDoc, pageRefs, font, fontBold, dims, colors);
      indexPageCount = 1; // Standard TOC is always 1 page
    }
  }

  // Add navigation links to non-bujo pages
  if (pageRefs.length > 0) {
    if (bujoPageRefs && config.includeIndex) {
      // Navigation already added above
    } else {
      // Use basic navigation for other planner types
      const totalPages = pdfDoc.getPageCount();
      const navConfig: NavigationConfig = {
        tocPageIndex,
        showPrevNext: true,
        navHeight: 20,
        navWidth: 40,
      };

      for (let i = 0; i < totalPages; i++) {
        const page = pdfDoc.getPage(i);
        addNavigationLinks(pdfDoc, page, i, totalPages, navConfig, dims.WIDTH, dims.MARGIN);
      }
    }
  }

  return pdfDoc.save();
}

interface Dimensions {
  WIDTH: number;
  HEIGHT: number;
  MARGIN: number;
  TOOLBAR_HEIGHT: number;
  padding: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  toolbarPosition: 'top' | 'bottom' | 'left' | 'right';
}

function generateDailyPages(
  pdfDoc: PDFDocument,
  config: PlannerConfig,
  font: PDFFont,
  fontBold: PDFFont,
  pageRefs: { label: string; pageIndex: number }[],
  dims: Dimensions,
  colors: ColorScheme
) {
  const { WIDTH, HEIGHT, MARGIN, TOOLBAR_HEIGHT } = dims;
  const days = eachDayOfInterval({ start: config.startDate, end: config.endDate });
  const topY = HEIGHT - MARGIN - TOOLBAR_HEIGHT;

  const textColor = rgb(colors.text.r, colors.text.g, colors.text.b);
  const mutedColor = rgb(colors.textMuted.r, colors.textMuted.g, colors.textMuted.b);
  const lineColor = rgb(colors.line.r, colors.line.g, colors.line.b);
  const lineFaintColor = rgb(colors.lineFaint.r, colors.lineFaint.g, colors.lineFaint.b);

  for (const day of days) {
    const dayOfWeek = day.getDay();
    if (!config.includeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
      continue;
    }

    const page = pdfDoc.addPage([WIDTH, HEIGHT]);
    drawPageBackground(page, dims, colors);
    const pageIndex = pdfDoc.getPageCount() - 1;
    pageRefs.push({ label: format(day, 'EEE, MMM d'), pageIndex });

    // Draw header
    const dateText = format(day, 'EEEE, MMMM d, yyyy');
    page.drawText(dateText, {
      x: MARGIN,
      y: topY - 16,
      size: 14,
      font: fontBold,
      color: textColor,
    });

    // Draw time slots
    const slotHeight = 24;
    let y = topY - 50;

    for (let hour = config.timeStart; hour <= config.timeEnd; hour++) {
      const timeText = format(new Date(2000, 0, 1, hour), 'h:mm a');

      page.drawText(timeText, {
        x: MARGIN,
        y: y,
        size: 10,
        font,
        color: mutedColor,
      });

      // Draw line
      page.drawLine({
        start: { x: MARGIN + 60, y: y + 4 },
        end: { x: WIDTH - MARGIN, y: y + 4 },
        thickness: 0.5,
        color: lineColor,
      });

      y -= slotHeight;

      if (config.timeInterval === 30 && hour < config.timeEnd) {
        page.drawLine({
          start: { x: MARGIN + 60, y: y + 4 },
          end: { x: WIDTH - MARGIN, y: y + 4 },
          thickness: 0.25,
          color: lineFaintColor,
          dashArray: [2, 2],
        });
        y -= slotHeight;
      }
    }

    // Page number
    if (config.pageNumbers) {
      page.drawText(`${pageIndex + 1}`, {
        x: WIDTH - MARGIN - 20,
        y: MARGIN / 2,
        size: 8,
        font,
        color: mutedColor,
      });
    }
  }
}

function generateWeeklyPages(
  pdfDoc: PDFDocument,
  config: PlannerConfig,
  font: PDFFont,
  fontBold: PDFFont,
  pageRefs: { label: string; pageIndex: number }[],
  dims: Dimensions,
  colors: ColorScheme
) {
  const { WIDTH, HEIGHT, MARGIN, TOOLBAR_HEIGHT } = dims;
  const weeks = eachWeekOfInterval({ start: config.startDate, end: config.endDate });
  const topY = HEIGHT - MARGIN - TOOLBAR_HEIGHT;

  const textColor = rgb(colors.text.r, colors.text.g, colors.text.b);
  const mutedColor = rgb(colors.textMuted.r, colors.textMuted.g, colors.textMuted.b);
  const lineColor = rgb(colors.line.r, colors.line.g, colors.line.b);

  for (const weekStart of weeks) {
    const page = pdfDoc.addPage([WIDTH, HEIGHT]);
    drawPageBackground(page, dims, colors);
    const pageIndex = pdfDoc.getPageCount() - 1;
    pageRefs.push({ label: `Week of ${format(weekStart, 'MMM d')}`, pageIndex });

    // Header
    page.drawText(`Week of ${format(weekStart, 'MMMM d, yyyy')}`, {
      x: MARGIN,
      y: topY - 16,
      size: 14,
      font: fontBold,
      color: textColor,
    });

    // Draw 7 columns
    const daysToShow = config.includeWeekends ? 7 : 5;
    const colWidth = (WIDTH - 2 * MARGIN) / daysToShow;
    const dayNames = config.includeWeekends
      ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

    for (let i = 0; i < daysToShow; i++) {
      const x = MARGIN + i * colWidth;

      // Day header
      page.drawText(dayNames[i], {
        x: x + 4,
        y: topY - 40,
        size: 10,
        font: fontBold,
        color: textColor,
      });

      // Column border
      page.drawLine({
        start: { x, y: topY - 50 },
        end: { x, y: MARGIN + 40 },
        thickness: 0.5,
        color: lineColor,
      });
    }

    // Horizontal line under headers
    page.drawLine({
      start: { x: MARGIN, y: topY - 50 },
      end: { x: WIDTH - MARGIN, y: topY - 50 },
      thickness: 0.5,
      color: lineColor,
    });

    // Notes section
    page.drawText('Notes', {
      x: MARGIN,
      y: MARGIN + 30,
      size: 10,
      font: fontBold,
      color: mutedColor,
    });

    page.drawLine({
      start: { x: MARGIN, y: MARGIN + 40 },
      end: { x: WIDTH - MARGIN, y: MARGIN + 40 },
      thickness: 0.5,
      color: lineColor,
    });

    if (config.pageNumbers) {
      page.drawText(`${pageIndex + 1}`, {
        x: WIDTH - MARGIN - 20,
        y: MARGIN / 2,
        size: 8,
        font,
        color: mutedColor,
      });
    }
  }
}

function generateMonthlyPages(
  pdfDoc: PDFDocument,
  config: PlannerConfig,
  font: PDFFont,
  fontBold: PDFFont,
  pageRefs: { label: string; pageIndex: number }[],
  dims: Dimensions,
  colors: ColorScheme
) {
  const { WIDTH, HEIGHT, MARGIN, TOOLBAR_HEIGHT } = dims;
  const months = eachMonthOfInterval({ start: config.startDate, end: config.endDate });
  const topY = HEIGHT - MARGIN - TOOLBAR_HEIGHT;

  const textColor = rgb(colors.text.r, colors.text.g, colors.text.b);
  const mutedColor = rgb(colors.textMuted.r, colors.textMuted.g, colors.textMuted.b);
  const lineColor = rgb(colors.line.r, colors.line.g, colors.line.b);

  for (const monthStart of months) {
    const page = pdfDoc.addPage([WIDTH, HEIGHT]);
    drawPageBackground(page, dims, colors);
    const pageIndex = pdfDoc.getPageCount() - 1;
    pageRefs.push({ label: format(monthStart, 'MMMM yyyy'), pageIndex });

    // Header
    page.drawText(format(monthStart, 'MMMM yyyy'), {
      x: MARGIN,
      y: topY - 16,
      size: 16,
      font: fontBold,
      color: textColor,
    });

    // Calendar grid
    const colWidth = (WIDTH - 2 * MARGIN) / 7;
    const availableHeight = topY - MARGIN - 80;
    const rowHeight = Math.min(60, availableHeight / 6); // Scale for smaller devices
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Day headers
    for (let i = 0; i < 7; i++) {
      page.drawText(dayNames[i], {
        x: MARGIN + i * colWidth + colWidth / 2 - 10,
        y: topY - 45,
        size: 9,
        font: fontBold,
        color: mutedColor,
      });
    }

    // Get days in month
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let day = 1;
    for (let row = 0; row < 6 && day <= daysInMonth; row++) {
      const y = topY - 60 - row * rowHeight;

      // Draw horizontal line
      page.drawLine({
        start: { x: MARGIN, y },
        end: { x: WIDTH - MARGIN, y },
        thickness: 0.5,
        color: lineColor,
      });

      for (let col = 0; col < 7; col++) {
        const x = MARGIN + col * colWidth;

        // Draw vertical line
        if (row === 0) {
          page.drawLine({
            start: { x, y: topY - 55 },
            end: { x, y: topY - 60 - 6 * rowHeight },
            thickness: 0.5,
            color: lineColor,
          });
        }

        if ((row === 0 && col >= firstDay) || row > 0) {
          if (day <= daysInMonth) {
            page.drawText(`${day}`, {
              x: x + 4,
              y: y - 14,
              size: 10,
              font,
              color: textColor,
            });
            day++;
          }
        }
      }
    }

    if (config.pageNumbers) {
      page.drawText(`${pageIndex + 1}`, {
        x: WIDTH - MARGIN - 20,
        y: MARGIN / 2,
        size: 8,
        font,
        color: mutedColor,
      });
    }
  }
}

function generateDotGridPages(pdfDoc: PDFDocument, count: number, dims: Dimensions, colors: ColorScheme) {
  const { WIDTH, HEIGHT, MARGIN, TOOLBAR_HEIGHT } = dims;
  const dotSpacing = 14; // ~5mm at 72 DPI
  const topY = HEIGHT - MARGIN - TOOLBAR_HEIGHT;
  const dotColor = rgb(colors.dot.r, colors.dot.g, colors.dot.b);

  for (let i = 0; i < count; i++) {
    const page = pdfDoc.addPage([WIDTH, HEIGHT]);
    drawPageBackground(page, dims, colors);

    for (let x = MARGIN; x <= WIDTH - MARGIN; x += dotSpacing) {
      for (let y = MARGIN; y <= topY; y += dotSpacing) {
        page.drawCircle({
          x,
          y,
          size: 0.5,
          color: dotColor,
        });
      }
    }
  }
}

function generateLinedPages(pdfDoc: PDFDocument, count: number, dims: Dimensions, colors: ColorScheme) {
  const { WIDTH, HEIGHT, MARGIN, TOOLBAR_HEIGHT } = dims;
  const lineSpacing = 24; // College ruled
  const topY = HEIGHT - MARGIN - TOOLBAR_HEIGHT;
  const lineColor = rgb(colors.line.r, colors.line.g, colors.line.b);

  for (let i = 0; i < count; i++) {
    const page = pdfDoc.addPage([WIDTH, HEIGHT]);
    drawPageBackground(page, dims, colors);

    for (let y = topY - lineSpacing; y >= MARGIN; y -= lineSpacing) {
      page.drawLine({
        start: { x: MARGIN, y },
        end: { x: WIDTH - MARGIN, y },
        thickness: 0.5,
        color: lineColor,
      });
    }
  }
}

function generateBlankPages(pdfDoc: PDFDocument, count: number, dims: Dimensions, colors: ColorScheme) {
  const { WIDTH, HEIGHT } = dims;
  for (let i = 0; i < count; i++) {
    const page = pdfDoc.addPage([WIDTH, HEIGHT]);
    drawPageBackground(page, dims, colors);
  }
}

function addTableOfContents(
  pdfDoc: PDFDocument,
  pageRefs: { label: string; pageIndex: number }[],
  font: PDFFont,
  fontBold: PDFFont,
  dims: Dimensions,
  colors: ColorScheme
) {
  const { WIDTH, HEIGHT, MARGIN, TOOLBAR_HEIGHT } = dims;
  const topY = HEIGHT - MARGIN - TOOLBAR_HEIGHT;

  const textColor = rgb(colors.text.r, colors.text.g, colors.text.b);
  const mutedColor = rgb(colors.textMuted.r, colors.textMuted.g, colors.textMuted.b);

  // Insert TOC after the cover page (index 1)
  const tocPage = pdfDoc.insertPage(1, [WIDTH, HEIGHT]);
  drawPageBackground(tocPage, dims, colors);

  tocPage.drawText('Table of Contents', {
    x: MARGIN,
    y: topY - 5,
    size: 16,
    font: fontBold,
    color: textColor,
  });

  let y = topY - 35;
  const lineHeight = 18;

  for (const ref of pageRefs) {
    if (y < MARGIN + 20) {
      // Would need pagination for very long TOCs
      break;
    }

    tocPage.drawText(ref.label, {
      x: MARGIN,
      y,
      size: 10,
      font,
      color: textColor,
    });

    tocPage.drawText(`${ref.pageIndex + 2}`, { // +2: cover is page 1, TOC is page 2
      x: WIDTH - MARGIN - 20,
      y,
      size: 10,
      font,
      color: mutedColor,
    });

    // Add clickable link for this TOC entry
    // +1 because TOC is inserted at index 1, shifting content pages up by 1
    addTocEntryLink(pdfDoc, tocPage, y, ref.pageIndex + 1, WIDTH, MARGIN, lineHeight);

    y -= lineHeight;
  }
}
