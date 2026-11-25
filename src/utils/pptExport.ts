import html2canvas from 'html2canvas-pro';
import PptxGenJS from 'pptxgenjs';

export function formatReportPptFilename(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `Mancom AR Performance as of ${year}-${month}-${day} ${hours}-${minutes}.pptx`;
}

export interface PptPlacement {
  xIn: number;
  yIn: number;
  widthIn: number;
  heightIn: number;
}

/**
 * Computes aspect-ratio-preserving placement inside a 16:9 widescreen slide (13.333" x 7.5").
 */
export function computePptSlidePlacement(
  pixelWidth: number,
  pixelHeight: number,
  slideWidthIn = 13.333,
  slideHeightIn = 7.5,
  marginIn = 0.25
): PptPlacement {
  const safeW = Math.max(1, pixelWidth);
  const safeH = Math.max(1, pixelHeight);
  const maxW = slideWidthIn - marginIn * 2;
  const maxH = slideHeightIn - marginIn * 2;
  const scale = Math.min(maxW / safeW, maxH / safeH);
  const widthIn = safeW * scale;
  const heightIn = safeH * scale;
  return {
    xIn: (slideWidthIn - widthIn) / 2,
    yIn: (slideHeightIn - heightIn) / 2,
    widthIn,
    heightIn,
  };
}

function hidePptChromeControls(clonedDoc: Document): void {
  const root = clonedDoc.body;
  if (!root) return;

  const toHide = clonedDoc.querySelectorAll<HTMLElement>(
    'header, aside, footer, [data-pdf-hide="true"], .print\\:hidden'
  );
  toHide.forEach((el) => {
    el.style.display = 'none';
  });

  const slides = clonedDoc.querySelectorAll<HTMLElement>('.looker-slide-canvas');
  slides.forEach((slide) => {
    slide.style.boxShadow = 'none';
  });
}

export interface ExportPptOptions {
  slideElements: HTMLElement[];
  filename?: string;
}

export async function exportReportSlidesToPpt({
  slideElements,
  filename = formatReportPptFilename(),
}: ExportPptOptions): Promise<string> {
  if (slideElements.length === 0) {
    throw new Error('No report slides are currently visible to export.');
  }

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.title = filename.replace(/\.pptx$/i, '');
  pptx.subject = 'Mancom & Leadership Performance Update — Accounts Receivable';
  pptx.author = 'Asia Affinity Property Management, Inc.';

  const captureScale = slideElements.length > 3 ? 1.5 : 2;

  for (const slideEl of slideElements) {
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
        hidePptChromeControls(clonedDoc);
      },
    });

    const placement = computePptSlidePlacement(canvas.width, canvas.height);
    const imgData = canvas.toDataURL('image/jpeg', 0.94);

    const slide = pptx.addSlide();
    slide.background = { color: 'FFFFFF' };
    slide.addImage({
      data: imgData,
      x: placement.xIn,
      y: placement.yIn,
      w: placement.widthIn,
      h: placement.heightIn,
    });
  }

  await pptx.writeFile({ fileName: filename });
  return filename;
}
