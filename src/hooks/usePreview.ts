import { useState, useEffect, useRef, useCallback } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { PlannerConfig } from '../types/planner';
import { generatePlannerPDF } from '../lib/pdf-generator';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import PdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set up the worker using Vite's ?url import
GlobalWorkerOptions.workerSrc = PdfjsWorker;

export interface PreviewLink {
  rect: { x: number; y: number; width: number; height: number }; // Percentages
  targetPage: number;
}

export interface PreviewState {
  pages: string[]; // Data URLs of rendered pages
  pageLinks: PreviewLink[][]; // Links for each page
  currentPage: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
}

export interface UsePreviewReturn extends PreviewState {
  goToPage: (page: number) => void;
  goNext: () => void;
  goPrev: () => void;
}

const SCALE = 1.5;

async function renderPage(
  pdf: PDFDocumentProxy,
  pageNum: number
): Promise<{ imageUrl: string; links: PreviewLink[] }> {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale: SCALE });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    return { imageUrl: '', links: [] };
  }

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: context,
    viewport,
    canvas,
  }).promise;

  const imageUrl = canvas.toDataURL('image/png');

  // Extract link annotations
  const links: PreviewLink[] = [];
  try {
    const annotations = await page.getAnnotations();
    const pageWidth = viewport.width / SCALE;
    const pageHeight = viewport.height / SCALE;

    for (const annot of annotations) {
      if (annot.subtype === 'Link' && annot.dest) {
        let targetPage = 0;
        if (Array.isArray(annot.dest) && annot.dest.length > 0) {
          const destRef = annot.dest[0];
          if (destRef && typeof destRef === 'object' && 'num' in destRef) {
            for (let p = 1; p <= pdf.numPages; p++) {
              const destPage = await pdf.getPage(p);
              if (destPage.ref?.num === destRef.num) {
                targetPage = p - 1;
                break;
              }
            }
          }
        }

        const rect = annot.rect;
        if (rect && rect.length === 4) {
          links.push({
            rect: {
              x: (rect[0] / pageWidth) * 100,
              y: ((pageHeight - rect[3]) / pageHeight) * 100,
              width: ((rect[2] - rect[0]) / pageWidth) * 100,
              height: ((rect[3] - rect[1]) / pageHeight) * 100,
            },
            targetPage,
          });
        }
      }
    }
  } catch {
    // Ignore annotation extraction errors
  }

  return { imageUrl, links };
}

export function usePreview(config: PlannerConfig): UsePreviewReturn {
  const [state, setState] = useState<PreviewState>({
    pages: [],
    pageLinks: [],
    currentPage: 0,
    totalPages: 0,
    isLoading: false,
    error: null,
  });

  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortController = useRef<AbortController | null>(null);
  const pdfRef = useRef<PDFDocumentProxy | null>(null);
  const renderingPage = useRef<number | null>(null);
  const previousPageRef = useRef<number>(0); // Remember page across regenerations

  // Lazy load a page when needed
  const loadPage = useCallback(async (pageIndex: number) => {
    if (!pdfRef.current) return;
    if (renderingPage.current === pageIndex) return;

    renderingPage.current = pageIndex;

    try {
      const { imageUrl, links } = await renderPage(pdfRef.current, pageIndex + 1);

      setState((prev) => {
        const newPages = [...prev.pages];
        const newLinks = [...prev.pageLinks];
        newPages[pageIndex] = imageUrl;
        newLinks[pageIndex] = links;
        return { ...prev, pages: newPages, pageLinks: newLinks };
      });
    } finally {
      renderingPage.current = null;
    }
  }, []);

  const generatePreview = useCallback(async (currentConfig: PlannerConfig) => {
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    // Remember current page before regenerating
    setState((prev) => {
      previousPageRef.current = prev.currentPage;
      return { ...prev, isLoading: true, error: null };
    });

    try {
      const pdfBytes = await generatePlannerPDF(currentConfig);
      if (abortController.current?.signal.aborted) return;

      const pdf = await getDocument({ data: pdfBytes }).promise;
      if (abortController.current?.signal.aborted) return;

      pdfRef.current = pdf;
      const totalPages = pdf.numPages;

      // Restore previous page, clamped to new total
      const restoredPage = Math.min(previousPageRef.current, totalPages - 1);

      // Render the restored page (or first page if restored is 0)
      const initialPage = restoredPage + 1;
      const { imageUrl, links } = await renderPage(pdf, initialPage);
      if (abortController.current?.signal.aborted) return;

      // Initialize arrays with placeholders
      const pages = new Array(totalPages).fill('');
      const pageLinks: PreviewLink[][] = new Array(totalPages).fill(null).map(() => []);

      pages[restoredPage] = imageUrl;
      pageLinks[restoredPage] = links;

      setState({
        pages,
        pageLinks,
        currentPage: restoredPage,
        totalPages,
        isLoading: false,
        error: null,
      });

      // Pre-render adjacent pages in background
      const adjacentPages = [restoredPage - 1, restoredPage + 1, 0].filter(
        (p) => p >= 0 && p < totalPages && p !== restoredPage
      );

      for (const pageIndex of adjacentPages) {
        if (abortController.current?.signal.aborted) break;
        const result = await renderPage(pdf, pageIndex + 1);
        setState((prev) => {
          const newPages = [...prev.pages];
          const newLinks = [...prev.pageLinks];
          newPages[pageIndex] = result.imageUrl;
          newLinks[pageIndex] = result.links;
          return { ...prev, pages: newPages, pageLinks: newLinks };
        });
      }
    } catch (err) {
      if (!abortController.current?.signal.aborted) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : 'Failed to generate preview',
        }));
      }
    }
  }, []);

  // Store latest config in ref to avoid stale closures
  const configRef = useRef(config);
  configRef.current = config;

  // Create a stable key from all config values for deep comparison
  const configKey = JSON.stringify({
    ...config,
    startDate: config.startDate.getTime(),
    endDate: config.endDate.getTime(),
  });

  // Debounced effect for config changes
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      generatePreview(configRef.current);
    }, 500);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [configKey, generatePreview]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  const goToPage = useCallback((page: number) => {
    setState((prev) => {
      const newPage = Math.max(0, Math.min(page, prev.totalPages - 1));
      // Trigger lazy load if page not rendered
      if (!prev.pages[newPage] && pdfRef.current) {
        loadPage(newPage);
      }
      return { ...prev, currentPage: newPage };
    });
  }, [loadPage]);

  const goNext = useCallback(() => {
    setState((prev) => {
      const newPage = Math.min(prev.currentPage + 1, prev.totalPages - 1);
      if (!prev.pages[newPage] && pdfRef.current) {
        loadPage(newPage);
      }
      return { ...prev, currentPage: newPage };
    });
  }, [loadPage]);

  const goPrev = useCallback(() => {
    setState((prev) => {
      const newPage = Math.max(0, prev.currentPage - 1);
      if (!prev.pages[newPage] && pdfRef.current) {
        loadPage(newPage);
      }
      return { ...prev, currentPage: newPage };
    });
  }, [loadPage]);

  return {
    ...state,
    goToPage,
    goNext,
    goPrev,
  };
}
