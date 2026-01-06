import { rgb } from 'pdf-lib';
import type { PDFDocument, PDFPage, PDFFont } from 'pdf-lib';
import { getWeek } from 'date-fns';
import { createInternalLink } from '../../hyperlinks';
import type { PageRef, PageType, PageRegistry, NavItem, Dimensions } from './types';
import type { ColorScheme } from '../../../../types/planner';

/**
 * Build a registry of all pages for navigation resolution.
 * Call this after all pages are generated and index is added.
 */
export function buildPageRegistry(
  pageRefs: PageRef[],
  indexPageIndex: number
): PageRegistry {
  const registry: PageRegistry = {
    indexPage: indexPageIndex,
    futureLogPages: [],
    monthlyCalPages: new Map(),
    monthlyTasksPages: new Map(),
    weeklyPages: new Map(),
    dailyPages: new Map(),
    collectionPages: [],
    pagesByType: new Map(),
  };

  // Initialize pagesByType for all types
  const types: PageType[] = ['key', 'future', 'monthly', 'monthly-tasks', 'weekly', 'daily', 'collection', 'index'];
  for (const t of types) {
    registry.pagesByType.set(t, []);
  }

  for (const ref of pageRefs) {
    // Add to type-based list (for prev/next)
    const typeList = registry.pagesByType.get(ref.type);
    if (typeList) {
      typeList.push(ref.pageIndex);
    }

    switch (ref.type) {
      case 'key':
        registry.keyPage = ref.pageIndex;
        break;

      case 'future':
        registry.futureLogPages.push(ref.pageIndex);
        break;

      case 'monthly':
        if (ref.yearMonth) {
          registry.monthlyCalPages.set(ref.yearMonth, ref.pageIndex);
        }
        break;

      case 'monthly-tasks':
        if (ref.yearMonth) {
          registry.monthlyTasksPages.set(ref.yearMonth, ref.pageIndex);
        }
        break;

      case 'weekly':
        if (ref.weekIndex !== undefined) {
          registry.weeklyPages.set(ref.weekIndex, ref.pageIndex);
        }
        break;

      case 'daily':
        if (ref.date) {
          const key = formatDateKey(ref.date);
          registry.dailyPages.set(key, ref.pageIndex);
        }
        break;

      case 'collection':
        registry.collectionPages.push(ref.pageIndex);
        break;
    }
  }

  return registry;
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatYearMonth(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Get navigation items for a specific page type.
 * Returns full readable labels for better usability.
 * MUST match getNavLabels() in page-utils.ts for correct link positioning.
 */
export function getNavItemsForPage(
  ref: PageRef,
  registry: PageRegistry
): NavItem[] {
  const items: NavItem[] = [];

  // Get yearMonth for context-aware navigation
  const yearMonth = ref.yearMonth || (ref.date ? formatYearMonth(ref.date) : undefined);
  const weekIndex = ref.weekIndex?.toString();

  // Check what sections exist (must match NavContext logic in page generators)
  const hasFutureLog = registry.futureLogPages.length > 0;
  const hasMonthlyLog = registry.monthlyCalPages.size > 0;
  const hasWeeklyReview = registry.weeklyPages.size > 0;

  switch (ref.type) {
    case 'daily':
      // Daily: Index | Future Log | Monthly | Tasks | Weekly
      items.push({ label: 'Index', targetType: 'index' });
      if (hasFutureLog) {
        items.push({ label: 'Future Log', targetType: 'future' });
      }
      if (hasMonthlyLog) {
        items.push({ label: 'Monthly', targetType: 'monthly', targetKey: yearMonth });
        items.push({ label: 'Tasks', targetType: 'monthly-tasks', targetKey: yearMonth });
      }
      if (hasWeeklyReview) {
        items.push({ label: 'Weekly', targetType: 'weekly', targetKey: weekIndex });
      }
      break;

    case 'weekly':
      // Weekly: < | Index | Future Log | Monthly | Tasks | >
      items.push({ label: '<', targetType: 'prev' });
      items.push({ label: 'Index', targetType: 'index' });
      if (hasFutureLog) {
        items.push({ label: 'Future Log', targetType: 'future' });
      }
      if (hasMonthlyLog) {
        items.push({ label: 'Monthly', targetType: 'monthly', targetKey: yearMonth });
        items.push({ label: 'Tasks', targetType: 'monthly-tasks', targetKey: yearMonth });
      }
      items.push({ label: '>', targetType: 'next' });
      break;

    case 'monthly':
      // Monthly Calendar: < | Index | Future Log | Tasks | >
      items.push({ label: '<', targetType: 'prev' });
      items.push({ label: 'Index', targetType: 'index' });
      if (hasFutureLog) {
        items.push({ label: 'Future Log', targetType: 'future' });
      }
      items.push({ label: 'Tasks', targetType: 'monthly-tasks', targetKey: yearMonth });
      items.push({ label: '>', targetType: 'next' });
      break;

    case 'monthly-tasks':
      // Monthly Tasks: < | Index | Future Log | Calendar | >
      items.push({ label: '<', targetType: 'prev' });
      items.push({ label: 'Index', targetType: 'index' });
      if (hasFutureLog) {
        items.push({ label: 'Future Log', targetType: 'future' });
      }
      items.push({ label: 'Calendar', targetType: 'monthly', targetKey: yearMonth });
      items.push({ label: '>', targetType: 'next' });
      break;

    case 'future':
      // Future Log: Index (arrows handled differently - not shown in text)
      items.push({ label: 'Index', targetType: 'index' });
      break;

    case 'key':
      // Key: Index | Future Log
      items.push({ label: 'Index', targetType: 'index' });
      if (hasFutureLog) {
        items.push({ label: 'Future Log', targetType: 'future' });
      }
      break;

    case 'collection':
      // Collection: < | Index | >
      items.push({ label: '<', targetType: 'prev' });
      items.push({ label: 'Index', targetType: 'index' });
      items.push({ label: '>', targetType: 'next' });
      break;

    case 'index':
      // Index: Future Log (if exists)
      if (hasFutureLog) {
        items.push({ label: 'Future Log', targetType: 'future' });
      }
      break;
  }

  return items;
}

/**
 * Resolve a nav item to a target page index.
 */
export function resolveNavTarget(
  item: NavItem,
  ref: PageRef,
  registry: PageRegistry
): number | undefined {
  switch (item.targetType) {
    case 'index':
      return registry.indexPage;

    case 'future':
      return registry.futureLogPages[0];

    case 'monthly':
      if (item.targetKey) {
        return registry.monthlyCalPages.get(item.targetKey);
      }
      break;

    case 'monthly-tasks':
      if (item.targetKey) {
        return registry.monthlyTasksPages.get(item.targetKey);
      }
      break;

    case 'weekly':
      if (item.targetKey) {
        return registry.weeklyPages.get(parseInt(item.targetKey));
      }
      break;

    case 'prev':
    case 'next': {
      const typePages = registry.pagesByType.get(ref.type);
      if (!typePages) return undefined;
      const idx = typePages.indexOf(ref.pageIndex);
      if (idx === -1) return undefined;
      if (item.targetType === 'prev' && idx > 0) {
        return typePages[idx - 1];
      }
      if (item.targetType === 'next' && idx < typePages.length - 1) {
        return typePages[idx + 1];
      }
      return undefined;
    }
  }

  return undefined;
}

/**
 * Draw navigation text and return positions for linking.
 * Returns array of { label, x, width } for each nav item.
 */
export function drawNavText(
  page: PDFPage,
  font: PDFFont,
  dims: Dimensions,
  items: NavItem[]
): Array<{ item: NavItem; x: number; width: number }> {
  const { HEIGHT, MARGIN } = dims;
  const navFontSize = 7;
  const navY = HEIGHT - MARGIN - 2;
  const navColor = rgb(0.45, 0.45, 0.45);
  const separatorColor = rgb(0.7, 0.7, 0.7);

  const positions: Array<{ item: NavItem; x: number; width: number }> = [];
  let navX = MARGIN;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const textWidth = font.widthOfTextAtSize(item.label, navFontSize);

    page.drawText(item.label, {
      x: navX,
      y: navY,
      size: navFontSize,
      font,
      color: navColor,
    });

    positions.push({ item, x: navX, width: textWidth });

    navX += textWidth;

    if (i < items.length - 1) {
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

  return positions;
}

/**
 * Add clickable links to already-drawn navigation text.
 */
export function addNavLinks(
  pdfDoc: PDFDocument,
  page: PDFPage,
  dims: Dimensions,
  positions: Array<{ item: NavItem; x: number; width: number }>,
  ref: PageRef,
  registry: PageRegistry
): void {
  const { HEIGHT, MARGIN } = dims;
  const navY = HEIGHT - MARGIN - 2;
  const linkHeight = 12;

  for (const pos of positions) {
    const targetPage = resolveNavTarget(pos.item, ref, registry);
    if (targetPage !== undefined) {
      createInternalLink(pdfDoc, page, {
        x: pos.x - 2,
        y: navY - 3,
        width: pos.width + 4,
        height: linkHeight,
      }, targetPage);
    }
  }
}

/**
 * Draw navigation bar with placeholder text (links added later).
 * Returns Y position below navigation for content to start.
 */
export function drawTopNavPlaceholder(
  page: PDFPage,
  font: PDFFont,
  dims: Dimensions,
  itemLabels: string[]
): number {
  const { HEIGHT, MARGIN } = dims;
  const navFontSize = 7;
  const navY = HEIGHT - MARGIN - 2;
  const navColor = rgb(0.45, 0.45, 0.45);
  const separatorColor = rgb(0.7, 0.7, 0.7);

  let navX = MARGIN;

  for (let i = 0; i < itemLabels.length; i++) {
    page.drawText(itemLabels[i], {
      x: navX,
      y: navY,
      size: navFontSize,
      font,
      color: navColor,
    });
    navX += font.widthOfTextAtSize(itemLabels[i], navFontSize);

    if (i < itemLabels.length - 1) {
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
 * Add comprehensive navigation to all BuJo pages after they've been generated.
 * This should be called after all pages are created, index is added, and page indices are final.
 */
export function addComprehensiveNavigation(
  pdfDoc: PDFDocument,
  font: PDFFont,
  dims: Dimensions,
  pageRefs: PageRef[],
  registry: PageRegistry,
  _colors: ColorScheme // Accepted for API consistency, links don't need colors
): void {
  const { HEIGHT, padding } = dims;
  const navFontSize = 7;
  // Must match drawTopNavigation positioning in page-utils.ts
  const navY = HEIGHT - padding.top - navFontSize - 2;
  const linkHeight = 12;

  for (const ref of pageRefs) {
    const page = pdfDoc.getPage(ref.pageIndex);
    const navItems = getNavItemsForPage(ref, registry);

    // Calculate positions (must match what was drawn by page generators)
    let navX = padding.left;
    for (let i = 0; i < navItems.length; i++) {
      const item = navItems[i];
      const textWidth = font.widthOfTextAtSize(item.label, navFontSize);

      const targetPage = resolveNavTarget(item, ref, registry);
      if (targetPage !== undefined) {
        createInternalLink(pdfDoc, page, {
          x: navX - 2,
          y: navY - 3,
          width: textWidth + 4,
          height: linkHeight,
        }, targetPage);
      }

      navX += textWidth;
      if (i < navItems.length - 1) {
        navX += font.widthOfTextAtSize('  |  ', navFontSize);
      }
    }
  }
}

/**
 * Gets the week number for a date, using Sunday as the first day of the week.
 * This must match how weeks are generated in index.ts (weekStartsOn: 0).
 */
export function getWeekNumber(date: Date): number {
  // Use date-fns getWeek with weekStartsOn: 0 (Sunday) to match week generation
  return getWeek(date, { weekStartsOn: 0 });
}

/**
 * Add links from monthly calendar dates to their corresponding daily pages.
 * This must be called after all pages are generated and the registry is built.
 */
export function addMonthlyDateLinks(
  pdfDoc: PDFDocument,
  _font: PDFFont,
  dims: Dimensions,
  pageRefs: PageRef[],
  registry: PageRegistry,
  density: { lineHeight: number; fontSize: number }
): void {
  const { HEIGHT, padding } = dims;

  // Get monthly page refs (calendar pages, not tasks pages)
  const monthlyRefs = pageRefs.filter(ref => ref.type === 'monthly');
  if (monthlyRefs.length === 0) return;

  // Calculate layout parameters (must match bujo-monthly.ts)
  const navHeight = 20;
  const headerHeight = 25;
  const navFontSize = 7;
  const titleFontSize = 11;
  const minLineHeight = Math.round(density.lineHeight * 0.7);
  const preferredLineHeight = density.lineHeight;
  const availableHeight = HEIGHT - padding.top - padding.bottom - navHeight - headerHeight - 10;

  // Group monthly refs by yearMonth to handle multi-page months
  const monthlyPagesByYearMonth = new Map<string, PageRef[]>();
  for (const ref of monthlyRefs) {
    if (!ref.yearMonth) continue;
    const pages = monthlyPagesByYearMonth.get(ref.yearMonth) || [];
    pages.push(ref);
    monthlyPagesByYearMonth.set(ref.yearMonth, pages);
  }

  for (const [yearMonth, monthPages] of monthlyPagesByYearMonth) {
    // Parse yearMonth to get the month info
    const [yearStr, monthStr] = yearMonth.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1; // 0-indexed
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Calculate layout (same logic as bujo-monthly.ts)
    const daysPerPage = Math.floor(availableHeight / minLineHeight);
    const isSplitLayout = monthPages.length > 1 || (daysInMonth * preferredLineHeight > availableHeight);

    if (isSplitLayout) {
      // Multi-page layout: dates listed vertically
      let dayIndex = 1;
      for (const pageRef of monthPages) {
        const page = pdfDoc.getPage(pageRef.pageIndex);

        // Calculate contentTop (same as bujo-monthly.ts)
        // drawTopNavigation returns: navY - navFontSize - 6
        const navY = HEIGHT - padding.top - navFontSize - 2;
        const navReturnY = navY - navFontSize - 6;
        // drawPageTitle returns: startY - fontSize - 8
        const contentTop = navReturnY - titleFontSize - 8;

        // Days on this page
        const daysOnThisPage = Math.min(daysPerPage, daysInMonth - dayIndex + 1);
        const lineHeight = Math.max(minLineHeight, availableHeight / daysOnThisPage);

        let y = contentTop;
        for (let i = 0; i < daysOnThisPage && dayIndex <= daysInMonth; i++, dayIndex++) {
          // Check if daily page exists for this date
          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayIndex).padStart(2, '0')}`;
          const dailyPageIndex = registry.dailyPages.get(dateKey);

          if (dailyPageIndex !== undefined) {
            // Create link over the date number area
            // Date is drawn at padding.left, day letter at padding.left + 18
            createInternalLink(pdfDoc, page, {
              x: padding.left - 2,
              y: y - 2,
              width: 28, // Covers date number and day letter
              height: density.fontSize + 4,
            }, dailyPageIndex);
          }

          y -= lineHeight;
        }
      }
    } else {
      // Single page side-by-side layout
      const pageRef = monthPages[0];
      const page = pdfDoc.getPage(pageRef.pageIndex);

      // Calculate contentTop (same as bujo-monthly.ts)
      const navY = HEIGHT - padding.top - navFontSize - 2;
      const navReturnY = navY - navFontSize - 6;
      const contentTop = navReturnY - titleFontSize - 8;

      const lineHeight = Math.min(preferredLineHeight, (contentTop - padding.bottom - 10) / daysInMonth);

      let y = contentTop;
      for (let day = 1; day <= daysInMonth; day++) {
        // Check if daily page exists for this date
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dailyPageIndex = registry.dailyPages.get(dateKey);

        if (dailyPageIndex !== undefined) {
          // Create link over the date number area
          createInternalLink(pdfDoc, page, {
            x: padding.left - 2,
            y: y - 2,
            width: 28,
            height: density.fontSize + 4,
          }, dailyPageIndex);
        }

        y -= lineHeight;
      }
    }
  }
}
