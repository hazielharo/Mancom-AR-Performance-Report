export const PAGE_ORDER_STORAGE_KEY = 'mancom_ar_page_order_v2';

export const DEFAULT_PAGE_ORDER: readonly number[] = [
  1, 2, 3, 5, 7, 8, 9, 10, 11, 12, 13,
];

export interface ReportPageLayout {
  pageOrder: number[];
  deletedPages: number[];
  hiddenPages: number[];
  updatedAtMs: number;
}

export const DEFAULT_PAGE_LAYOUT: ReportPageLayout = {
  pageOrder: [...DEFAULT_PAGE_ORDER],
  deletedPages: [],
  hiddenPages: [],
  updatedAtMs: 0,
};

/**
 * Ensures any saved/custom page order is a clean permutation of valid page IDs.
 */
export function normalizePageOrder(
  rawOrder: unknown,
  defaultOrder: readonly number[] = DEFAULT_PAGE_ORDER
): number[] {
  const validSet = new Set(defaultOrder);
  const result: number[] = [];
  const seen = new Set<number>();

  if (Array.isArray(rawOrder)) {
    for (const item of rawOrder) {
      const id = typeof item === 'number' ? item : Number(item);
      if (Number.isInteger(id) && validSet.has(id) && !seen.has(id)) {
        seen.add(id);
        result.push(id);
      }
    }
  }

  for (const fallbackId of defaultOrder) {
    if (!seen.has(fallbackId)) {
      seen.add(fallbackId);
      result.push(fallbackId);
    }
  }

  return result;
}

/**
 * Normalizes deleted page IDs and prevents all pages from being removed at once.
 */
export function normalizeDeletedPages(
  rawDeleted: unknown,
  defaultOrder: readonly number[] = DEFAULT_PAGE_ORDER
): number[] {
  const validSet = new Set(defaultOrder);
  const deleted: number[] = [];
  const seen = new Set<number>();

  if (Array.isArray(rawDeleted)) {
    for (const item of rawDeleted) {
      const id = typeof item === 'number' ? item : Number(item);
      if (
        Number.isInteger(id) &&
        validSet.has(id) &&
        !seen.has(id) &&
        deleted.length < Math.max(0, defaultOrder.length - 1)
      ) {
        seen.add(id);
        deleted.push(id);
      }
    }
  }

  return deleted;
}

/**
 * Normalizes hidden page IDs, excluding deleted IDs and ensuring at least 1 public page stays visible.
 */
export function normalizeHiddenPages(
  rawHidden: unknown,
  defaultOrder: readonly number[] = DEFAULT_PAGE_ORDER,
  deletedPages: readonly number[] = []
): number[] {
  const validSet = new Set(defaultOrder);
  const deletedSet = new Set(normalizeDeletedPages(deletedPages, defaultOrder));
  const nonDeletedCount = defaultOrder.filter((id) => !deletedSet.has(id)).length;
  const maxHidden = Math.max(0, nonDeletedCount - 1);

  const hidden: number[] = [];
  const seen = new Set<number>();

  if (Array.isArray(rawHidden)) {
    for (const item of rawHidden) {
      const id = typeof item === 'number' ? item : Number(item);
      if (
        Number.isInteger(id) &&
        validSet.has(id) &&
        !deletedSet.has(id) &&
        !seen.has(id) &&
        hidden.length < maxHidden
      ) {
        seen.add(id);
        hidden.push(id);
      }
    }
  }

  return hidden;
}

export function normalizePageLayout(
  raw: unknown,
  defaultOrder: readonly number[] = DEFAULT_PAGE_ORDER
): ReportPageLayout {
  if (!raw || typeof raw !== 'object') {
    return {
      pageOrder: [...defaultOrder],
      deletedPages: [],
      hiddenPages: [],
      updatedAtMs: 0,
    };
  }
  const candidate = raw as Record<string, unknown>;
  const pageOrder = normalizePageOrder(candidate.pageOrder, defaultOrder);
  const deletedPages = normalizeDeletedPages(candidate.deletedPages, defaultOrder);
  const hiddenPages = normalizeHiddenPages(candidate.hiddenPages, defaultOrder, deletedPages);
  const rawTs = Number(candidate.updatedAtMs);
  const updatedAtMs = Number.isFinite(rawTs) && rawTs >= 0 ? rawTs : 0;

  return { pageOrder, deletedPages, hiddenPages, updatedAtMs };
}

/**
 * Reorders page IDs by moving `fromPageId` into `toPageId`'s position.
 */
export function reorderPageIds(
  order: readonly number[],
  fromPageId: number,
  toPageId: number,
  defaultOrder: readonly number[] = DEFAULT_PAGE_ORDER
): number[] {
  const normalized = normalizePageOrder(order, defaultOrder);
  if (fromPageId === toPageId) return normalized;

  const fromIdx = normalized.indexOf(fromPageId);
  const toIdx = normalized.indexOf(toPageId);
  if (fromIdx === -1 || toIdx === -1) return normalized;

  const next = [...normalized];
  const [moved] = next.splice(fromIdx, 1);
  next.splice(toIdx, 0, moved);
  return next;
}

/**
 * Marks a page ID as removed while enforcing that at least 1 public page remains visible.
 */
export function deletePageFromLayout(
  layout: ReportPageLayout,
  pageIdToDelete: number,
  defaultOrder: readonly number[] = DEFAULT_PAGE_ORDER
): ReportPageLayout {
  const normalizedOrder = normalizePageOrder(layout.pageOrder, defaultOrder);
  const deletedSet = new Set(normalizeDeletedPages(layout.deletedPages, defaultOrder));
  const currentHidden = normalizeHiddenPages(
    layout.hiddenPages,
    defaultOrder,
    Array.from(deletedSet)
  );

  if (!normalizedOrder.includes(pageIdToDelete) || deletedSet.has(pageIdToDelete)) {
    return {
      pageOrder: normalizedOrder,
      deletedPages: Array.from(deletedSet),
      hiddenPages: currentHidden,
      updatedAtMs: layout.updatedAtMs,
    };
  }

  const remainingNonDeleted = normalizedOrder.filter(
    (id) => id !== pageIdToDelete && !deletedSet.has(id)
  );
  if (remainingNonDeleted.length < 1) {
    return {
      pageOrder: normalizedOrder,
      deletedPages: Array.from(deletedSet),
      hiddenPages: currentHidden,
      updatedAtMs: layout.updatedAtMs,
    };
  }

  deletedSet.add(pageIdToDelete);
  const nextDeleted = Array.from(deletedSet);
  const hiddenSet = new Set(currentHidden.filter((id) => id !== pageIdToDelete));
  const publicRemaining = remainingNonDeleted.filter((id) => !hiddenSet.has(id));
  if (publicRemaining.length === 0) {
    hiddenSet.delete(remainingNonDeleted[0]);
  }

  return {
    pageOrder: normalizedOrder,
    deletedPages: nextDeleted,
    hiddenPages: normalizeHiddenPages(Array.from(hiddenSet), defaultOrder, nextDeleted),
    updatedAtMs: Date.now(),
  };
}

/**
 * Toggles a page's hidden state while guaranteeing at least 1 non-deleted page stays visible to public viewers.
 */
export function togglePageHiddenInLayout(
  layout: ReportPageLayout,
  pageIdToToggle: number,
  defaultOrder: readonly number[] = DEFAULT_PAGE_ORDER
): ReportPageLayout {
  const normalizedOrder = normalizePageOrder(layout.pageOrder, defaultOrder);
  const deletedList = normalizeDeletedPages(layout.deletedPages, defaultOrder);
  const deletedSet = new Set(deletedList);
  const hiddenSet = new Set(normalizeHiddenPages(layout.hiddenPages, defaultOrder, deletedList));

  if (!normalizedOrder.includes(pageIdToToggle) || deletedSet.has(pageIdToToggle)) {
    return {
      pageOrder: normalizedOrder,
      deletedPages: deletedList,
      hiddenPages: Array.from(hiddenSet),
      updatedAtMs: layout.updatedAtMs,
    };
  }

  if (hiddenSet.has(pageIdToToggle)) {
    hiddenSet.delete(pageIdToToggle);
    return {
      pageOrder: normalizedOrder,
      deletedPages: deletedList,
      hiddenPages: Array.from(hiddenSet),
      updatedAtMs: Date.now(),
    };
  }

  const publicVisibleCount = normalizedOrder.filter(
    (id) => !deletedSet.has(id) && !hiddenSet.has(id)
  ).length;
  if (publicVisibleCount <= 1) {
    return {
      pageOrder: normalizedOrder,
      deletedPages: deletedList,
      hiddenPages: Array.from(hiddenSet),
      updatedAtMs: layout.updatedAtMs,
    };
  }

  hiddenSet.add(pageIdToToggle);
  return {
    pageOrder: normalizedOrder,
    deletedPages: deletedList,
    hiddenPages: normalizeHiddenPages(Array.from(hiddenSet), defaultOrder, deletedList),
    updatedAtMs: Date.now(),
  };
}

/**
 * Orders page metadata objects according to a custom page ID sequence and excludes deleted (and optionally hidden) pages.
 */
export function orderReportPages<T extends { page: number }>(
  pages: readonly T[],
  order: readonly number[],
  deletedPages: readonly number[] = [],
  hiddenPages: readonly number[] = []
): T[] {
  const pageIds = pages.map((p) => p.page);
  const normalizedOrder = normalizePageOrder(order, pageIds);
  const deletedSet = new Set(normalizeDeletedPages(deletedPages, pageIds));
  const hiddenSet = new Set(normalizeHiddenPages(hiddenPages, pageIds, Array.from(deletedSet)));
  const byId = new Map(pages.map((p) => [p.page, p]));
  const visible = normalizedOrder
    .filter((id) => !deletedSet.has(id) && !hiddenSet.has(id))
    .map((id) => byId.get(id))
    .filter((item): item is T => Boolean(item));

  if (visible.length > 0) return visible;
  return pages.length > 0 ? [pages[0]] : [];
}

export function isDefaultPageOrder(
  order: readonly number[],
  defaultOrder: readonly number[] = DEFAULT_PAGE_ORDER
): boolean {
  const normalized = normalizePageOrder(order, defaultOrder);
  if (normalized.length !== defaultOrder.length) return false;
  return normalized.every((id, idx) => id === defaultOrder[idx]);
}

export function isDefaultPageLayout(
  layout: Pick<ReportPageLayout, 'pageOrder' | 'deletedPages'> & {
    hiddenPages?: readonly number[];
    updatedAtMs?: number;
  },
  defaultOrder: readonly number[] = DEFAULT_PAGE_ORDER
): boolean {
  const deleted = normalizeDeletedPages(layout.deletedPages, defaultOrder);
  if (deleted.length > 0) return false;
  const hidden = normalizeHiddenPages(layout.hiddenPages, defaultOrder, deleted);
  if (hidden.length > 0) return false;
  return isDefaultPageOrder(layout.pageOrder, defaultOrder);
}

export function loadSavedPageLayout(): ReportPageLayout {
  try {
    const raw = localStorage.getItem(PAGE_ORDER_STORAGE_KEY);
    if (!raw) {
      return {
        pageOrder: [...DEFAULT_PAGE_ORDER],
        deletedPages: [],
        hiddenPages: [],
        updatedAtMs: 0,
      };
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return {
        pageOrder: normalizePageOrder(parsed, DEFAULT_PAGE_ORDER),
        deletedPages: [],
        hiddenPages: [],
        updatedAtMs: 0,
      };
    }
    return normalizePageLayout(parsed, DEFAULT_PAGE_ORDER);
  } catch {
    return {
      pageOrder: [...DEFAULT_PAGE_ORDER],
      deletedPages: [],
      hiddenPages: [],
      updatedAtMs: 0,
    };
  }
}

export function savePageLayout(layout: ReportPageLayout): void {
  try {
    const normalized = normalizePageLayout(layout, DEFAULT_PAGE_ORDER);
    localStorage.setItem(PAGE_ORDER_STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearSavedPageLayout(): void {
  try {
    localStorage.removeItem(PAGE_ORDER_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}
