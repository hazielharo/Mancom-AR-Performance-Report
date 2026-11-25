export type PortfolioSegment = 'all' | 'ytd_sep' | 'oct_ar';

export interface RecoveryFlowItem {
  id: 'oct_1_31_sep' | 'nov_1_9_sep' | 'oct_ar_collection';
  label: string;
  segment: 'ytd_sep' | 'oct_ar';
  period: string;
  amount: number;
}

export interface DimensionSummary {
  name: string;
  count: number;
  billed: number;
  collections: number;
  balance: number;
  efficiency: number;
}

export interface SegmentBreakdowns {
  byCategory: DimensionSummary[];
  byAging: DimensionSummary[];
  byAreaManager: DimensionSummary[];
}

export interface PortfolioBreakdowns {
  all: SegmentBreakdowns;
  ytd_sep: SegmentBreakdowns;
  oct_ar: SegmentBreakdowns;
}

export interface ManagerLedgerSummary {
  manager: string;
  mancom: string;
  // YTD Aug (prior to Sept)
  ytdAugBilled: number;
  ytdAugCollected: number;
  ytdAugOpen: number;
  // Sept AR
  sepBilled: number;
  sepCollected: number;
  sepOpen: number;
  // Pre-Oct open balance (YTD Aug + Sept open before Oct/Nov recoveries)
  ytdSepPreOctOpen: number;
  // Subsequent recoveries on YTD Sep AR (AR TAG < Oct)
  oct1To31SepColl: number;
  nov1To9SepColl: number;
  totalSepRecoveryColl: number;
  // Remaining YTD Sep AR open balance after Oct/Nov recoveries
  ytdSepRemainingOpen: number;
  // October AR (New AR)
  octBilled: number;
  octCollected: number;
  octOpen: number;
  // November AR (early Nov)
  novBilled: number;
  novCollected: number;
  novOpen: number;
  // Overall totals
  totalBilled: number;
  totalCollected: number;
  totalRemaining: number;
  // Aging breakdown of totalRemaining
  agingCurrent: number;
  aging1To30: number;
  aging31To60: number;
  aging61To90: number;
  aging91Above: number;
}

export interface CommitmentScheduleRow {
  manager: string;
  nov10To15: number;
  nov16To21: number;
  nov22To30: number;
  totalCommitted: number;
}

export interface CohortMatrixRow {
  arTag: string;
  billedTarget: number;
  monthlyCollections: Record<string, number>;
  totalCollection: number;
  remainingBalance: number;
  effPerTargetPct: number | null;
  ytdCumEffPct: number | null;
}

export interface CohortMatrixData {
  orMonthColumns: string[];
  rows: CohortMatrixRow[];
  columnTotals: Record<string, number>;
  grandTotalBilled: number;
  grandTotalCollected: number;
  grandTotalRemaining: number;
  grandTotalEffPct: number;
}

export interface ServiceBalanceSummary {
  serviceType: string;
  billed: number;
  collections: number;
  remainingBalance: number;
}

export interface ClientAgingRow {
  client: string;
  aging91Above: number;
  agingCurrent: number;
  aging1To30: number;
  aging31To60: number;
  aging61To90: number;
  grandTotal: number;
}

export interface ARLineItem {
  client: string;
  areaManager: string;
  serviceType: string;
  agingBucket: string;
  remainingBalance: number;
}

export interface OpenInvoiceItem {
  biNumber: string;
  serviceType: string;
  client: string;
  areaManager: string;
  aging: string;
  particulars: string;
  arTag: string;
  isPriorAr: boolean;
  billed: number;
  collected: number;
  remainingBalance: number;
}

export interface ARReportData {
  title: string;
  subtitle: string;
  lastUpdated: string;
  defaultTargetBenchmark: number;
  priorMonthEfficiency: number;
  ytdSepBilling: number;
  ytdSepCollections: number;
  octArBilling: number;
  octArCollections: number;
  baselineTargetBillingBasis?: number;
  recoveryFlows: {
    oct1To31SepAr: number;
    nov1To9SepAr: number;
    collectionOctAr: number;
  };
  sourceFormat?: 'appsheet' | 'manual';
  sourceRowCount?: number;
  sourceActiveRowCount?: number;
  focusMonthLabel?: string;
  breakdowns?: PortfolioBreakdowns;
  managerSummaries?: ManagerLedgerSummary[];
  commitmentSchedule?: CommitmentScheduleRow[];
  cohortMatrix?: CohortMatrixData;
  serviceBalances?: ServiceBalanceSummary[];
  clientAgingRows?: ClientAgingRow[];
  arLineItems?: ARLineItem[];
  openInvoices?: OpenInvoiceItem[];
}

export interface SegmentBreakdown {
  ytdSep: number;
  octAr: number;
}

export interface ComputedARMetrics {
  segment: PortfolioSegment;
  segmentLabel: string;
  totalBilling: number;
  totalCollections: number;
  arBalance: number;
  collectionEfficiency: number;
  priorMonthEfficiency: number;
  momDelta: number;
  targetBenchmark: number;
  targetAmount: number;
  varianceAgainstTarget: number;
  absoluteVariance: number;
  efficiencyGapToTarget: number;
  isAboveOrAtTarget: boolean;
  billingBreakdown: SegmentBreakdown;
  collectionsBreakdown: SegmentBreakdown;
  arBalanceBreakdown: SegmentBreakdown;
  recoveryItems: Array<RecoveryFlowItem & { sharePct: number }>;
  totalRecoveryImpact: number;
  recoveryYtdSepSubtotal: number;
  recoveryOctArSubtotal: number;
  recoveryShareOfCollectionsPct: number;
  novEndDay: number;
  activeBreakdown?: SegmentBreakdowns;
}

export interface CSVParseStats {
  totalRows: number;
  activeRows: number;
  totalBilling: number;
  totalCollections: number;
  arBalance: number;
  focusMonthLabel: string;
}

export interface CSVParseResult {
  ok: boolean;
  data?: ARReportData;
  errors: string[];
  format?: 'appsheet' | 'metric_summary';
  stats?: CSVParseStats;
}
