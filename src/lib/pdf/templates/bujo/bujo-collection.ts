import type { BujoGeneratorContext, PageRef } from './types';
import { drawTopNavigation, drawPageTitle, drawPageBackground, drawDarkModeBackground, getNavLabels } from './page-utils';

export function generateCollectionPages(
  ctx: BujoGeneratorContext,
  count: number
): PageRef[] {
  const { pdfDoc, font, fontBold, dims, density, collectionPageStyle, dotSpacing, nav, colors } = ctx;
  const { WIDTH, HEIGHT, padding } = dims;

  const pageRefs: PageRef[] = [];

  // Get nav labels for collection pages
  const navLabels = getNavLabels('collection', nav);

  for (let i = 0; i < count; i++) {
    const page = pdfDoc.addPage([WIDTH, HEIGHT]);
    const pageIndex = pdfDoc.getPageCount() - 1;

    // Draw dark mode background if needed
    drawDarkModeBackground(page, dims, colors);

    // Top navigation
    const navY = drawTopNavigation(page, font, dims, colors, navLabels);

    // Title placeholder
    const contentTop = drawPageTitle(page, `Collection ${i + 1}`, fontBold, dims, colors, navY, 10);

    // Draw background based on style
    drawPageBackground(page, collectionPageStyle, contentTop, padding.bottom, dims, colors, density.lineHeight, dotSpacing);

    pageRefs.push({
      label: `Collection ${i + 1}`,
      pageIndex,
      type: 'collection',
    });
  }

  return pageRefs;
}
