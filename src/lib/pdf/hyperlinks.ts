import { PDFDocument, PDFPage, PDFName, PDFArray } from 'pdf-lib';

export interface LinkRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Creates an internal link annotation that navigates to a target page.
 * Uses pdf-lib's low-level API to create Link annotations.
 */
export function createInternalLink(
  pdfDoc: PDFDocument,
  sourcePage: PDFPage,
  rect: LinkRect,
  targetPageIndex: number
): void {
  const targetPage = pdfDoc.getPage(targetPageIndex);
  const targetPageRef = pdfDoc.context.getObjectRef(targetPage.node);

  // Create the link annotation dictionary
  const linkAnnotation = pdfDoc.context.obj({
    Type: 'Annot',
    Subtype: 'Link',
    // Rect is [x1, y1, x2, y2] (bottom-left to top-right)
    Rect: [rect.x, rect.y, rect.x + rect.width, rect.y + rect.height],
    Border: [0, 0, 0], // No visible border
    // Destination: [page ref, /XYZ, left, top, zoom] - null means no change
    Dest: [targetPageRef, 'XYZ', null, null, null],
  });

  const linkRef = pdfDoc.context.register(linkAnnotation);

  // Get or create the Annots array on the source page
  const existingAnnots = sourcePage.node.lookup(PDFName.of('Annots'), PDFArray);
  if (existingAnnots) {
    existingAnnots.push(linkRef);
  } else {
    sourcePage.node.set(PDFName.of('Annots'), pdfDoc.context.obj([linkRef]));
  }
}

/**
 * Navigation link configuration
 */
export interface NavigationConfig {
  tocPageIndex: number;
  showPrevNext: boolean;
  navHeight: number;
  navWidth: number;
}

/**
 * Adds navigation links to a page (prev, next, and index/TOC).
 * Links are placed at the bottom of the page.
 */
export function addNavigationLinks(
  pdfDoc: PDFDocument,
  page: PDFPage,
  pageIndex: number,
  totalPages: number,
  config: NavigationConfig,
  pageWidth: number,
  margin: number
): void {
  const { tocPageIndex, showPrevNext, navHeight, navWidth } = config;
  const navY = margin / 2;

  // Previous page link (left side)
  if (showPrevNext && pageIndex > 0) {
    createInternalLink(pdfDoc, page, {
      x: margin,
      y: navY,
      width: navWidth,
      height: navHeight,
    }, pageIndex - 1);
  }

  // TOC/Index link (center)
  if (tocPageIndex >= 0) {
    createInternalLink(pdfDoc, page, {
      x: pageWidth / 2 - navWidth / 2,
      y: navY,
      width: navWidth,
      height: navHeight,
    }, tocPageIndex);
  }

  // Next page link (right side)
  if (showPrevNext && pageIndex < totalPages - 1) {
    createInternalLink(pdfDoc, page, {
      x: pageWidth - margin - navWidth,
      y: navY,
      width: navWidth,
      height: navHeight,
    }, pageIndex + 1);
  }
}

/**
 * Adds a link from a TOC entry to its target page.
 */
export function addTocEntryLink(
  pdfDoc: PDFDocument,
  tocPage: PDFPage,
  entryY: number,
  targetPageIndex: number,
  pageWidth: number,
  margin: number,
  lineHeight: number
): void {
  createInternalLink(pdfDoc, tocPage, {
    x: margin,
    y: entryY - lineHeight / 4,
    width: pageWidth - 2 * margin,
    height: lineHeight,
  }, targetPageIndex);
}
