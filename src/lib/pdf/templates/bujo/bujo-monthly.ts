import { rgb } from 'pdf-lib';
import { format, getDaysInMonth, getDay } from 'date-fns';
import type { BujoGeneratorContext, PageRef } from './types';
import { drawTopNavigation, drawPageTitle, drawPageBackground, drawDarkModeBackground, getNavLabels } from './page-utils';
import { formatYearMonth } from './navigation';

const DAY_ABBREVS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function generateMonthlyLog(
  ctx: BujoGeneratorContext,
  monthDate: Date
): PageRef[] {
  const { pdfDoc, font, fontBold, dims, density, dailyPageStyle, dotSpacing, nav, colors } = ctx;
  const { WIDTH, HEIGHT, padding } = dims;

  const pageRefs: PageRef[] = [];
  const daysInMonth = getDaysInMonth(monthDate);
  const minLineHeight = Math.round(density.lineHeight * 0.7);
  const preferredLineHeight = density.lineHeight;
  const yearMonth = formatYearMonth(monthDate);

  // Calculate available height (with top nav, no bottom nav)
  const navHeight = 20; // Top nav space
  const headerHeight = 25;
  const availableHeight = HEIGHT - padding.top - padding.bottom - navHeight - headerHeight - 10;

  // Calculate how many days can fit per page
  const daysPerPage = Math.floor(availableHeight / minLineHeight);

  // Determine if we need to split calendar across multiple pages
  const calendarPages = Math.ceil(daysInMonth / daysPerPage);
  const needsSplit = calendarPages > 1 || (daysInMonth * preferredLineHeight > availableHeight);

  // Get nav labels for monthly calendar
  const calNavLabels = getNavLabels('monthly', nav);

  // Pre-compute colors
  const textColor = rgb(colors.text.r, colors.text.g, colors.text.b);
  const mutedColor = rgb(colors.textMuted.r, colors.textMuted.g, colors.textMuted.b);
  const accentColor = rgb(colors.accent.r, colors.accent.g, colors.accent.b);
  const lineFaintColor = rgb(colors.lineFaint.r, colors.lineFaint.g, colors.lineFaint.b);
  const lineColor = rgb(colors.line.r, colors.line.g, colors.line.b);
  const dotColor = rgb(colors.dot.r, colors.dot.g, colors.dot.b);

  if (needsSplit) {
    // Generate calendar pages (may be 1 or more)
    let dayIndex = 1;
    let calendarPageNum = 0;

    while (dayIndex <= daysInMonth) {
      const page = pdfDoc.addPage([WIDTH, HEIGHT]);
      const pageIndex = pdfDoc.getPageCount() - 1;

      // Draw dark mode background if needed
      drawDarkModeBackground(page, dims, colors);

      // Top navigation
      const navY = drawTopNavigation(page, font, dims, colors, calNavLabels);

      // Title
      const suffix = calendarPages > 1 ? ` (${calendarPageNum + 1}/${calendarPages})` : '';
      const title = format(monthDate, 'MMMM yyyy') + suffix;
      const contentTop = drawPageTitle(page, title, fontBold, dims, colors, navY, 11);

      // Calculate days for this page
      const daysOnThisPage = Math.min(daysPerPage, daysInMonth - dayIndex + 1);
      const lineHeight = Math.max(minLineHeight, availableHeight / daysOnThisPage);
      let y = contentTop;

      for (let i = 0; i < daysOnThisPage && dayIndex <= daysInMonth; i++, dayIndex++) {
        const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), dayIndex);
        const dayOfWeek = getDay(date);
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        page.drawText(dayIndex.toString().padStart(2, ' '), {
          x: padding.left,
          y,
          size: density.fontSize,
          font,
          color: isWeekend ? mutedColor : textColor,
        });

        page.drawText(DAY_ABBREVS[dayOfWeek], {
          x: padding.left + 18,
          y,
          size: density.fontSize,
          font,
          color: isWeekend ? mutedColor : accentColor,
        });

        // Draw separator line at top of this row (just above the text cap height)
        const separatorY = y + density.fontSize;
        page.drawLine({
          start: { x: padding.left + 30, y: separatorY },
          end: { x: WIDTH - padding.right, y: separatorY },
          thickness: 0.25,
          color: lineFaintColor,
        });

        y -= lineHeight;
      }

      const label = calendarPages > 1
        ? `${format(monthDate, 'MMMM')} Cal ${calendarPageNum + 1}`
        : `${format(monthDate, 'MMMM')} (Calendar)`;

      pageRefs.push({
        label,
        pageIndex,
        type: 'monthly',
        date: monthDate,
        monthIndex: monthDate.getMonth(),
        yearMonth,
      });

      calendarPageNum++;
    }

    // Tasks page
    const taskPage = pdfDoc.addPage([WIDTH, HEIGHT]);
    const taskPageIndex = pdfDoc.getPageCount() - 1;

    // Draw dark mode background if needed
    drawDarkModeBackground(taskPage, dims, colors);

    // Get nav labels for monthly-tasks
    const taskNavLabels = getNavLabels('monthly-tasks', nav);
    const taskNavY = drawTopNavigation(taskPage, font, dims, colors, taskNavLabels);
    const taskTitle = format(monthDate, 'MMMM') + ' - Tasks';
    const taskContentTop = drawPageTitle(taskPage, taskTitle, fontBold, dims, colors, taskNavY, 11);

    // Draw background (dotted pattern like daily pages)
    drawPageBackground(taskPage, dailyPageStyle, taskContentTop, padding.bottom, dims, colors, density.lineHeight, dotSpacing);

    pageRefs.push({
      label: format(monthDate, 'MMMM') + ' (Tasks)',
      pageIndex: taskPageIndex,
      type: 'monthly-tasks',
      date: monthDate,
      monthIndex: monthDate.getMonth(),
      yearMonth,
    });
  } else {
    // Single page: side-by-side layout (calendar on left, tasks on right)
    // This is a combined page - we'll register it as 'monthly' for the calendar
    // and also add a 'monthly-tasks' entry pointing to the same page
    const page = pdfDoc.addPage([WIDTH, HEIGHT]);
    const pageIndex = pdfDoc.getPageCount() - 1;

    // Draw dark mode background if needed
    drawDarkModeBackground(page, dims, colors);

    const navY = drawTopNavigation(page, font, dims, colors, calNavLabels);
    const title = format(monthDate, 'MMMM yyyy');
    const contentTop = drawPageTitle(page, title, fontBold, dims, colors, navY, 11);

    const dividerX = padding.left + (WIDTH - padding.left - padding.right) * 0.4;

    page.drawLine({
      start: { x: dividerX, y: contentTop },
      end: { x: dividerX, y: padding.bottom },
      thickness: 0.5,
      color: lineColor,
    });

    const lineHeight = Math.min(preferredLineHeight, (contentTop - padding.bottom - 10) / daysInMonth);
    let y = contentTop;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
      const dayOfWeek = getDay(date);
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      page.drawText(day.toString().padStart(2, ' '), {
        x: padding.left,
        y,
        size: density.fontSize,
        font,
        color: isWeekend ? mutedColor : textColor,
      });

      page.drawText(DAY_ABBREVS[dayOfWeek], {
        x: padding.left + 18,
        y,
        size: density.fontSize,
        font,
        color: isWeekend ? mutedColor : accentColor,
      });

      // Draw separator line at top of this row (just above the text cap height)
      const separatorY = y + density.fontSize;
      page.drawLine({
        start: { x: padding.left + 30, y: separatorY },
        end: { x: dividerX - 5, y: separatorY },
        thickness: 0.25,
        color: lineFaintColor,
      });

      y -= lineHeight;
    }

    // Tasks section header
    page.drawText('Tasks', {
      x: dividerX + 8,
      y: contentTop,
      size: density.fontSize,
      font: fontBold,
      color: accentColor,
    });

    // Draw dotted background for tasks area
    const taskStartY = contentTop - 12;
    if (dailyPageStyle === 'dotgrid') {
      for (let ty = taskStartY; ty >= padding.bottom; ty -= dotSpacing) {
        for (let tx = dividerX + 8; tx <= WIDTH - padding.right; tx += dotSpacing) {
          page.drawCircle({
            x: tx,
            y: ty,
            size: 0.5,
            color: dotColor,
          });
        }
      }
    } else if (dailyPageStyle === 'lined') {
      for (let ty = taskStartY; ty >= padding.bottom; ty -= density.lineHeight) {
        page.drawLine({
          start: { x: dividerX + 8, y: ty },
          end: { x: WIDTH - padding.right, y: ty },
          thickness: 0.25,
          color: lineColor,
        });
      }
    }

    // Register as monthly calendar page
    pageRefs.push({
      label: format(monthDate, 'MMMM'),
      pageIndex,
      type: 'monthly',
      date: monthDate,
      monthIndex: monthDate.getMonth(),
      yearMonth,
    });

    // Also register as monthly-tasks (points to same page for combined layout)
    pageRefs.push({
      label: format(monthDate, 'MMMM') + ' (Tasks)',
      pageIndex,
      type: 'monthly-tasks',
      date: monthDate,
      monthIndex: monthDate.getMonth(),
      yearMonth,
    });
  }

  return pageRefs;
}
