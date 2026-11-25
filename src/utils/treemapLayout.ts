export interface TreemapInputItem {
  id: string;
  label: string;
  value: number;
}

export interface TreemapRect {
  id: string;
  label: string;
  value: number;
  x: number;
  y: number;
  width: number;
  height: number;
  sharePct: number;
}

function worstAspectRatio(row: number[], shortSide: number): number {
  if (row.length === 0 || shortSide <= 0) return Infinity;
  const sum = row.reduce((a, b) => a + b, 0);
  const maxVal = Math.max(...row);
  const minVal = Math.min(...row);
  if (minVal <= 0) return Infinity;
  const s2 = shortSide * shortSide;
  const sum2 = sum * sum;
  return Math.max((s2 * maxVal) / sum2, sum2 / (s2 * minVal));
}

/**
 * Computes a proportional squarified treemap layout within [0..width] x [0..height]
 * in percentage coordinates (default 100x100) for responsive rendering.
 */
export function computeSquarifiedTreemap(
  rawItems: TreemapInputItem[],
  width = 100,
  height = 100
): TreemapRect[] {
  const positiveItems = rawItems
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const totalValue = positiveItems.reduce((sum, item) => sum + item.value, 0);
  if (totalValue <= 0 || positiveItems.length === 0) return [];

  const totalArea = width * height;
  const normalized = positiveItems.map((item) => ({
    ...item,
    area: (item.value / totalValue) * totalArea,
    sharePct: (item.value / totalValue) * 100,
  }));

  const rects: TreemapRect[] = [];
  let x = 0;
  let y = 0;
  let w = width;
  let h = height;
  let remaining = normalized.slice();

  const layoutRow = (rowItems: typeof normalized) => {
    const rowArea = rowItems.reduce((s, it) => s + it.area, 0);
    if (w >= h) {
      const rowWidth = h > 0 ? rowArea / h : 0;
      let curY = y;
      for (const item of rowItems) {
        const itemHeight = rowWidth > 0 ? item.area / rowWidth : 0;
        rects.push({
          id: item.id,
          label: item.label,
          value: item.value,
          x,
          y: curY,
          width: rowWidth,
          height: itemHeight,
          sharePct: item.sharePct,
        });
        curY += itemHeight;
      }
      x += rowWidth;
      w = Math.max(0, w - rowWidth);
    } else {
      const rowHeight = w > 0 ? rowArea / w : 0;
      let curX = x;
      for (const item of rowItems) {
        const itemWidth = rowHeight > 0 ? item.area / rowHeight : 0;
        rects.push({
          id: item.id,
          label: item.label,
          value: item.value,
          x: curX,
          y,
          width: itemWidth,
          height: rowHeight,
          sharePct: item.sharePct,
        });
        curX += itemWidth;
      }
      y += rowHeight;
      h = Math.max(0, h - rowHeight);
    }
  };

  let currentRow: typeof normalized = [];
  while (remaining.length > 0) {
    const shortSide = Math.min(w, h);
    const nextItem = remaining[0];
    if (currentRow.length === 0) {
      currentRow.push(nextItem);
      remaining.shift();
      continue;
    }

    const currentAreas = currentRow.map((i) => i.area);
    const withNextAreas = [...currentAreas, nextItem.area];

    if (worstAspectRatio(withNextAreas, shortSide) <= worstAspectRatio(currentAreas, shortSide)) {
      currentRow.push(nextItem);
      remaining.shift();
    } else {
      layoutRow(currentRow);
      currentRow = [];
    }
  }

  if (currentRow.length > 0) {
    layoutRow(currentRow);
  }

  return rects;
}
