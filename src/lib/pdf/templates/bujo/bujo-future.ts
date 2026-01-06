import { rgb } from 'pdf-lib';
import { format, addMonths } from 'date-fns';
import type { BujoGeneratorContext, PageRef } from './types';
import { drawTopNavigation, drawPageTitle, drawDarkModeBackground, getNavLabels } from './page-utils';

export function generateFutureLog(
  ctx: BujoGeneratorContext,
  startDate: Date,
  months: 6 | 12
): PageRef[] {
  const { pdfDoc, font, fontBold, dims, density, nav, colors } = ctx;
  const { WIDTH, HEIGHT, padding } = dims;

  const pageRefs: PageRef[] = [];

  // Calculate months per page based on available height
  const navHeight = 20;
  const headerHeight = 20;
  const minMonthHeight = Math.round(70 * density.spacing);
  const availableHeight = HEIGHT - padding.top - padding.bottom - navHeight - headerHeight;

  // Calculate optimal months per page (at least 2, at most 4)
  let monthsPerPage = Math.max(2, Math.floor(availableHeight / minMonthHeight));
  monthsPerPage = Math.min(monthsPerPage, 4);

  const numPages = Math.ceil(months / monthsPerPage);

  // Get nav labels for future log pages
  const navLabels = getNavLabels('future', nav);

  // Pre-compute colors
  const textColor = rgb(colors.text.r, colors.text.g, colors.text.b);
  const lineColor = rgb(colors.line.r, colors.line.g, colors.line.b);
  const lineFaintColor = rgb(colors.lineFaint.r, colors.lineFaint.g, colors.lineFaint.b);

  for (let pageNum = 0; pageNum < numPages; pageNum++) {
    const page = pdfDoc.addPage([WIDTH, HEIGHT]);
    const pageIndex = pdfDoc.getPageCount() - 1;

    // Draw dark mode background if needed
    drawDarkModeBackground(page, dims, colors);

    // Top navigation
    const navY = drawTopNavigation(page, font, dims, colors, navLabels);

    // Title
    const pageTitle = pageNum === 0 ? 'Future Log' : `Future Log (${pageNum + 1})`;
    const contentTop = drawPageTitle(page, pageTitle, fontBold, dims, colors, navY, 11);

    // Determine how many months on this page
    const startMonth = pageNum * monthsPerPage;
    const monthsOnThisPage = Math.min(monthsPerPage, months - startMonth);
    const actualMonthHeight = (contentTop - padding.bottom) / monthsOnThisPage;

    // Draw month sections
    for (let i = 0; i < monthsOnThisPage; i++) {
      const monthIndex = startMonth + i;
      const monthDate = addMonths(startDate, monthIndex);
      const monthY = contentTop - i * actualMonthHeight;

      // Month header
      page.drawText(format(monthDate, 'MMMM yyyy'), {
        x: padding.left,
        y: monthY - 2,
        size: density.fontSize,
        font: fontBold,
        color: textColor,
      });

      // Separator line under month name
      page.drawLine({
        start: { x: padding.left, y: monthY - 12 },
        end: { x: WIDTH - padding.right, y: monthY - 12 },
        thickness: 0.5,
        color: lineColor,
      });

      // Draw light horizontal lines for notes
      const notesStartY = monthY - 22;
      const lineSpacing = density.lineHeight;
      const numLines = Math.floor((actualMonthHeight - 30) / lineSpacing);

      for (let line = 0; line < numLines; line++) {
        const lineY = notesStartY - line * lineSpacing;
        if (lineY < monthY - actualMonthHeight + 10) break;

        page.drawLine({
          start: { x: padding.left, y: lineY },
          end: { x: WIDTH - padding.right, y: lineY },
          thickness: 0.25,
          color: lineFaintColor,
        });
      }
    }

    pageRefs.push({
      label: pageNum === 0 ? 'Future Log' : `Future Log (${pageNum + 1})`,
      pageIndex,
      type: 'future',
    });
  }

  return pageRefs;
}
