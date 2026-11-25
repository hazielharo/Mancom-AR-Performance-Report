import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_PAGE_LAYOUT,
  DEFAULT_PAGE_ORDER,
  deletePageFromLayout,
  isDefaultPageLayout,
  isDefaultPageOrder,
  normalizeDeletedPages,
  normalizeHiddenPages,
  normalizePageLayout,
  normalizePageOrder,
  orderReportPages,
  reorderPageIds,
  togglePageHiddenInLayout,
} from './pageOrder';

test('normalizePageOrder deduplicates, removes invalid IDs, and fills missing pages', () => {
  assert.deepEqual(normalizePageOrder([12, 3, 3, 99, 4, 6, 'bad', 1]), [
    12, 3, 1, 2, 5, 7, 8, 9, 10, 11, 13,
  ]);
  assert.deepEqual(normalizePageOrder(null), [...DEFAULT_PAGE_ORDER]);
  assert.deepEqual([...DEFAULT_PAGE_ORDER], [1, 2, 3, 5, 7, 8, 9, 10, 11, 12, 13]);
});

test('reorderPageIds moves pages forward and backward cleanly', () => {
  const movedForward = reorderPageIds(DEFAULT_PAGE_ORDER, 2, 7);
  assert.deepEqual(movedForward.slice(0, 6), [1, 3, 5, 7, 2, 8]);

  const movedBackward = reorderPageIds(DEFAULT_PAGE_ORDER, 12, 2);
  assert.deepEqual(movedBackward.slice(0, 5), [1, 12, 2, 3, 5]);

  const sameSpot = reorderPageIds(DEFAULT_PAGE_ORDER, 5, 5);
  assert.deepEqual(sameSpot, [...DEFAULT_PAGE_ORDER]);
});

test('orderReportPages sorts by normalized order, omits deleted and hidden pages, and detects default layout', () => {
  const samplePages = [
    { page: 1, title: 'One' },
    { page: 2, title: 'Two' },
    { page: 3, title: 'Three' },
    { page: 5, title: 'Five' },
  ];
  const custom = [5, 1, 3, 2];
  const adminOrdered = orderReportPages(samplePages, custom, [3]);
  assert.deepEqual(
    adminOrdered.map((p) => p.page),
    [5, 1, 2]
  );

  const publicOrdered = orderReportPages(samplePages, custom, [3], [1]);
  assert.deepEqual(
    publicOrdered.map((p) => p.page),
    [5, 2]
  );

  assert.equal(isDefaultPageOrder([...DEFAULT_PAGE_ORDER]), true);
  assert.equal(isDefaultPageOrder([2, 1, 3, 5, 7, 8, 9, 10, 11, 12, 13]), false);
  assert.equal(isDefaultPageLayout(DEFAULT_PAGE_LAYOUT), true);
  assert.equal(
    isDefaultPageLayout({
      pageOrder: [...DEFAULT_PAGE_ORDER],
      deletedPages: [5],
      hiddenPages: [],
      updatedAtMs: 123,
    }),
    false
  );
  assert.equal(
    isDefaultPageLayout({
      pageOrder: [...DEFAULT_PAGE_ORDER],
      deletedPages: [],
      hiddenPages: [2],
      updatedAtMs: 123,
    }),
    false
  );
});

test('deletePageFromLayout removes target page while preventing deletion of final remaining page', () => {
  const afterDelete = deletePageFromLayout(DEFAULT_PAGE_LAYOUT, 5);
  assert.deepEqual(afterDelete.deletedPages, [5]);
  assert.ok(afterDelete.updatedAtMs > 0);

  let layout = normalizePageLayout(DEFAULT_PAGE_LAYOUT);
  for (const id of DEFAULT_PAGE_ORDER) {
    layout = deletePageFromLayout(layout, id);
  }
  const remaining = orderReportPages(
    DEFAULT_PAGE_ORDER.map((page) => ({ page })),
    layout.pageOrder,
    layout.deletedPages
  );
  assert.equal(remaining.length, 1);
  assert.deepEqual(
    normalizeDeletedPages(DEFAULT_PAGE_ORDER, DEFAULT_PAGE_ORDER).length,
    DEFAULT_PAGE_ORDER.length - 1
  );
});

test('togglePageHiddenInLayout hides and unhides pages while keeping at least one public page visible', () => {
  const hiddenStep = togglePageHiddenInLayout(DEFAULT_PAGE_LAYOUT, 2);
  assert.deepEqual(hiddenStep.hiddenPages, [2]);
  assert.ok(hiddenStep.updatedAtMs > 0);

  const unhiddenStep = togglePageHiddenInLayout(hiddenStep, 2);
  assert.deepEqual(unhiddenStep.hiddenPages, []);

  // Attempt to hide every page — must retain at least 1 public-visible page
  let layout = normalizePageLayout(DEFAULT_PAGE_LAYOUT);
  for (const id of DEFAULT_PAGE_ORDER) {
    layout = togglePageHiddenInLayout(layout, id);
  }
  const publicVisible = orderReportPages(
    DEFAULT_PAGE_ORDER.map((page) => ({ page })),
    layout.pageOrder,
    layout.deletedPages,
    layout.hiddenPages
  );
  assert.equal(publicVisible.length, 1);
  assert.equal(
    normalizeHiddenPages(DEFAULT_PAGE_ORDER, DEFAULT_PAGE_ORDER, []).length,
    DEFAULT_PAGE_ORDER.length - 1
  );

  // Deleting a hidden page also removes it from hiddenPages cleanly
  const withHidden = togglePageHiddenInLayout(DEFAULT_PAGE_LAYOUT, 7);
  const afterDeletingHidden = deletePageFromLayout(withHidden, 7);
  assert.deepEqual(afterDeletingHidden.deletedPages, [7]);
  assert.deepEqual(afterDeletingHidden.hiddenPages, []);
});
