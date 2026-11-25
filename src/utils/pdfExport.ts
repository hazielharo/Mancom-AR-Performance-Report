import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';

export function formatReportPdfFilename(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `Mancom AR Performance as of ${year}-${month}-${day} ${hours}-${minutes}.pdf`;
}

export interface PdfPlacement {
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
}

/**
 * Chooses the optimal A4 orientation (portrait vs landscape) for a single-slide PDF sheet
 * so tall dashboards/tables maximize legibility without multi-page splitting.
 */
export function selectOptimalPdfOrientation(
  pixelWidth: number,
  pixelHeight: number,
  marginMm = 6
): 'portrait' | 'landscape' {
  const safeW = Math.max(1, pixelWidth);
  const safeH = Math.max(1, pixelHeight);
  const landscapeW = 297 - marginMm * 2;
  const landscapeH = 210 - marginMm * 2;
  const portraitW = 210 - marginMm * 2;
  const portraitH = 297 - marginMm * 2;

  const landscapeScale = Math.min(landscapeW / safeW, landscapeH / safeH);
  const portraitScale = Math.min(portraitW / safeW, portraitH / safeH);

  return portraitScale > landscapeScale * 1.05 ? 'portrait' : 'landscape';
}

/**
 * Computes aspect-ratio-preserving placement within an A4 printable box.
 */
export function computePdfSlideFit(
  pixelWidth: number,
  pixelHeight: number,
  pageWidthMm = 297,
  pageHeightMm = 210,
  marginMm = 6
): PdfPlacement {
  const safeW = Math.max(1, pixelWidth);
  const safeH = Math.max(1, pixelHeight);
  const maxW = pageWidthMm - marginMm * 2;
  const maxH = pageHeightMm - marginMm * 2;
  const scale = Math.min(maxW / safeW, maxH / safeH);
  const widthMm = safeW * scale;
  const heightMm = safeH * scale;
  return {
    xMm: (pageWidthMm - widthMm) / 2,
    yMm: (pageHeightMm - heightMm) / 2,
    widthMm,
    heightMm,
  };
}

function hidePrintOnlyControls(clonedDoc: Document): void {
  const root = clonedDoc.body;
  if (!root) return;

  // Hide app chrome & interactive toolbar controls marked print:hidden or data-pdf-hide
  const toHide = clonedDoc.querySelectorAll<HTMLElement>(
    'header, aside, footer, [data-pdf-hide="true"], .print\\:hidden'
  );
  toHide.forEach((el) => {
    el.style.display = 'none';
  });

  // Remove outer drop shadows on slide canvases for clean print edges
  const slides = clonedDoc.querySelectorAll<HTMLElement>('.looker-slide-canvas');
  slides.forEach((slide) => {
    slide.style.boxShadow = 'none';
  });
}

export interface ExportPdfOptions {
  slideElements: HTMLElement[];
  filename?: string;
}

export async function exportReportSlidesToPdf({
  slideElements,
  filename = formatReportPdfFilename(),
}: ExportPdfOptions): Promise<string> {
  if (slideElements.length === 0) {
    throw new Error('No report slides are currently visible to export.');
  }

  const marginMm = 6;
  const captureScale = slideElements.length > 3 ? 1.5 : 2;
  let pdf: jsPDF | null = null;

  for (let i = 0; i < slideElements.length; i += 1) {
    const slideEl = slideElements[i];
    const canvas = await html2canvas(slideEl, {
      scale: captureScale,
      useCORS: true,
      backgroundColor: '#FFFFFF',
      logging: false,
      windowWidth: Math.max(slideEl.scrollWidth, 1280),
      ignoreElements: (el) => {
        if (el === slideEl || slideEl.contains(el)) return false;
        const tag = el.tagName;
        if (tag === 'HEADER' || tag === 'ASIDE' || tag === 'FOOTER') return true;
        if (el.classList?.contains('looker-slide-canvas')) return true;
        return false;
      },
      onclone: (clonedDoc) => {
        hidePrintOnlyControls(clonedDoc);
      },
    });

    const orientation = selectOptimalPdfOrientation(canvas.width, canvas.height, marginMm);
    const pageWidthMm = orientation === 'portrait' ? 210 : 297;
    const pageHeightMm = orientation === 'portrait' ? 297 : 210;

    if (!pdf) {
      pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4',
        compress: true,
      });
      pdf.setProperties({
        title: filename.replace(/\.pdf$/i, ''),
        subject: 'Mancom & Leadership Performance Update — Accounts Receivable',
        creator: 'Asia Affinity Mancom AR Report',
      });
    } else {
      pdf.addPage('a4', orientation);
    }

    const placement = computePdfSlideFit(
      canvas.width,
      canvas.height,
      pageWidthMm,
      pageHeightMm,
      marginMm
    );

    const imgData = canvas.toDataURL('image/jpeg', 0.94);
    pdf.addImage(
      imgData,
      'JPEG',
      placement.xMm,
      placement.yMm,
      placement.widthMm,
      placement.heightMm,
      undefined,
      'FAST'
    );
  }

  if (pdf) {
    pdf.save(filename);
  }
  return filename;
}
