import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarCheck,
  CalendarPlus,
  Check,
  Edit3,
  ExternalLink,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { ARLineItem, OpenInvoiceItem } from '../types/arReport';
import { formatNumber, formatPeso, round2 } from '../utils/arCalculations';
import {
  buildClientOpenInvoices,
  CommittedPaymentsConfig,
  CommitmentSyncStatus,
  formatCommittedDateLabel,
  isValidIsoDate,
  normalizeBiKey,
  PaymentCommitmentRecord,
  UpsertCommitmentInput,
} from '../utils/paymentCommitments';

interface ClientInvoicesModalProps {
  isOpen: boolean;
  clientName: string | null;
  openInvoices: OpenInvoiceItem[] | undefined;
  fallbackLineItems?: ARLineItem[];
  commitmentsByBi: Record<string, PaymentCommitmentRecord>;
  committedPaymentsConfig: CommittedPaymentsConfig;
  syncStatus: CommitmentSyncStatus;
  syncWarning: string | null;
  onUpsertCommitment: (input: UpsertCommitmentInput) => Promise<void>;
  onDeleteCommitment: (biNumber: string) => Promise<void>;
  onSyncCommitments: () => Promise<void>;
  onOpenSyncSetup: () => void;
  isAdminAuthorized?: boolean;
  onClose: () => void;
}

function getTodayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const ClientInvoicesModal: React.FC<ClientInvoicesModalProps> = ({
  isOpen,
  clientName,
  openInvoices,
  fallbackLineItems,
  commitmentsByBi,
  committedPaymentsConfig,
  syncStatus,
  syncWarning,
  onUpsertCommitment,
  onDeleteCommitment,
  onSyncCommitments,
  onOpenSyncSetup,
  isAdminAuthorized = false,
  onClose,
}) => {
  const [editingBiKey, setEditingBiKey] = useState<string | null>(null);
  const [draftDate, setDraftDate] = useState<string>(getTodayIsoDate());
  const [savingBiKey, setSavingBiKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setEditingBiKey(null);
      setDraftDate(getTodayIsoDate());
      setSavingBiKey(null);
      setActionError(null);
    }
  }, [isOpen, clientName]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingBiKey) {
          setEditingBiKey(null);
          setActionError(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, editingBiKey, onClose]);

  const clientInvoices = useMemo(() => {
    if (!clientName) return [];
    return buildClientOpenInvoices(openInvoices, clientName, fallbackLineItems);
  }, [openInvoices, clientName, fallbackLineItems]);

  const totalRemaining = useMemo(
    () => round2(clientInvoices.reduce((s, inv) => s + inv.remainingBalance, 0)),
    [clientInvoices]
  );

  const scheduledCount = useMemo(
    () =>
      clientInvoices.filter((inv) => Boolean(commitmentsByBi[normalizeBiKey(inv.biNumber)])).length,
    [clientInvoices, commitmentsByBi]
  );

  if (!isOpen || !clientName) return null;

  const isWebhookConnected = Boolean(committedPaymentsConfig.webhookUrl);

  const handleStartCommit = (inv: OpenInvoiceItem) => {
    const key = normalizeBiKey(inv.biNumber);
    const existing = commitmentsByBi[key];
    setEditingBiKey(key);
    setDraftDate(existing?.committedPaymentDate || getTodayIsoDate());
    setActionError(null);
  };

  const handleConfirmCommit = async (inv: OpenInvoiceItem) => {
    const key = normalizeBiKey(inv.biNumber);
    if (!isValidIsoDate(draftDate)) {
      setActionError('Select a valid Committed Payment Date before confirming.');
      return;
    }
    setSavingBiKey(key);
    setActionError(null);
    try {
      await onUpsertCommitment({
        accountManager: inv.areaManager || 'Unspecified',
        clientName: inv.client || clientName,
        biNumber: inv.biNumber,
        serviceType: inv.serviceType || 'Unspecified',
        particulars: inv.particulars || '—',
        aging: inv.aging || 'Unspecified',
        remainingBalance: inv.remainingBalance,
        committedPaymentDate: draftDate,
      });
      setEditingBiKey(null);
    } catch (err: any) {
      setActionError(err?.message || 'Unable to save payment commitment.');
    } finally {
      setSavingBiKey(null);
    }
  };

  const handleClearCommitment = async (inv: OpenInvoiceItem) => {
    const key = normalizeBiKey(inv.biNumber);
    setSavingBiKey(key);
    setActionError(null);
    try {
      await onDeleteCommitment(inv.biNumber);
      if (editingBiKey === key) setEditingBiKey(null);
    } catch (err: any) {
      setActionError(err?.message || 'Unable to remove payment commitment.');
    } finally {
      setSavingBiKey(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6 backdrop-blur-[1px] print:hidden"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-invoices-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 bg-[#FAF6DD] px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#9E8418]">
                Client AR Breakdown · Open Billing Invoices
              </p>
              <span
                className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10.5px] font-semibold ${
                  isWebhookConnected && syncStatus === 'synced'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : isWebhookConnected && syncStatus === 'error'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-slate-100 text-slate-700 border border-slate-300'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isWebhookConnected && syncStatus === 'synced'
                      ? 'bg-emerald-600'
                      : isWebhookConnected
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                  }`}
                  aria-hidden="true"
                />
                {isWebhookConnected
                  ? syncStatus === 'syncing'
                    ? 'Syncing COMMITTED_PAYMENTS...'
                    : 'Connected to COMMITTED_PAYMENTS Sheet'
                  : 'Saved Locally · Sheet Sync Not Linked'}
              </span>
            </div>

            <h3
              id="client-invoices-modal-title"
              className="mt-1 font-display text-lg sm:text-xl font-bold text-slate-950 break-words"
            >
              {clientName}
            </h3>

            <p className="mt-1 text-xs text-slate-600 tabular-nums">
              <span className="font-semibold text-slate-900">{clientInvoices.length}</span> open{' '}
              {clientInvoices.length === 1 ? 'invoice' : 'invoices'} with remaining balance totaling{' '}
              <span className="font-semibold text-slate-950">{formatPeso(totalRemaining)}</span>
              {scheduledCount > 0 && (
                <span className="ml-2 font-semibold text-emerald-800">
                  · {scheduledCount} payment {scheduledCount === 1 ? 'date' : 'dates'} committed
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void onSyncCommitments()}
              disabled={syncStatus === 'syncing'}
              title="Refresh & clean paid commitments against AR Monitoring"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              <span>Refresh</span>
            </button>
            {isAdminAuthorized && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSyncSetup();
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-[#C7AC2D] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#8E740B] hover:bg-[#FCF6D6] cursor-pointer"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{isWebhookConnected ? 'Sync Settings' : 'Connect Google Sheet'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close client open invoices modal"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-950 cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Alerts */}
        {(actionError || syncWarning) && (
          <div className="border-b border-amber-200 bg-amber-50 px-5 py-2.5 text-xs text-amber-900 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-700 shrink-0" aria-hidden="true" />
              <span>{actionError || syncWarning}</span>
            </div>
            {actionError && (
              <button
                type="button"
                onClick={() => setActionError(null)}
                className="font-semibold underline cursor-pointer"
              >
                Dismiss
              </button>
            )}
          </div>
        )}

        {/* Invoice Table */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {clientInvoices.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center">
              <p className="text-sm font-semibold text-slate-800">
                No Open Billing Invoices with Positive Balance
              </p>
              <p className="mt-1 text-xs text-slate-500">
                All billing invoices for {clientName} are settled or have a credit/overpayment
                balance.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full border-collapse text-xs tabular-nums">
                <thead className="sticky top-0 z-10 bg-[#D8C136] text-[11px] font-bold text-slate-950 border-b border-[#B9A324]">
                  <tr>
                    <th className="py-2.5 px-3 text-left whitespace-nowrap">
                      Action (Commit Payment)
                    </th>
                    <th className="py-2.5 px-3 text-left whitespace-nowrap">BI/SOA</th>
                    <th className="py-2.5 px-3 text-left whitespace-nowrap">SERVICE TYPE</th>
                    <th className="py-2.5 px-3 text-left">PARTICULARS</th>
                    <th className="py-2.5 px-3 text-left whitespace-nowrap">AGING</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">REMAINING BALANCE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 bg-white">
                  {clientInvoices.map((inv, idx) => {
                    const key = normalizeBiKey(inv.biNumber);
                    const commitment = commitmentsByBi[key];
                    const isEditing = editingBiKey === key;
                    const isSaving = savingBiKey === key;

                    return (
                      <tr
                        key={`${inv.biNumber}-${idx}`}
                        className={`align-top transition-colors ${
                          commitment ? 'bg-emerald-50/35 hover:bg-emerald-50/60' : 'hover:bg-[#FCF9E8]/70'
                        }`}
                      >
                        {/* Col 1: Action (Commit Payment) */}
                        <td className="py-2 px-3 whitespace-nowrap min-w-[235px]">
                          {isEditing ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <input
                                type="date"
                                value={draftDate}
                                onChange={(e) => setDraftDate(e.target.value)}
                                aria-label={`Committed Payment Date for ${inv.biNumber}`}
                                className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-900 focus:border-[#9E8418] focus:outline-none focus:ring-1 focus:ring-[#9E8418]"
                              />
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => void handleConfirmCommit(inv)}
                                aria-label={`Confirm commitment for ${inv.biNumber}`}
                                className="inline-flex items-center gap-1 rounded bg-emerald-700 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 cursor-pointer"
                              >
                                <Check className="h-3 w-3" aria-hidden="true" />
                                <span>{isSaving ? 'Saving...' : 'Confirm'}</span>
                              </button>
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => {
                                  setEditingBiKey(null);
                                  setActionError(null);
                                }}
                                aria-label={`Cancel commitment edit for ${inv.biNumber}`}
                                className="inline-flex items-center justify-center rounded border border-slate-300 bg-white p-1 text-slate-600 hover:bg-slate-100 cursor-pointer"
                              >
                                <X className="h-3 w-3" aria-hidden="true" />
                              </button>
                            </div>
                          ) : commitment ? (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-900">
                                <CalendarCheck
                                  className="h-3.5 w-3.5 text-emerald-700 shrink-0"
                                  aria-hidden="true"
                                />
                                <span>
                                  {formatCommittedDateLabel(commitment.committedPaymentDate)}
                                </span>
                              </span>
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => handleStartCommit(inv)}
                                title="Edit committed payment date"
                                aria-label={`Edit committed payment date for ${inv.biNumber}`}
                                className="rounded p-1 text-slate-500 hover:bg-slate-200/70 hover:text-slate-900 disabled:opacity-50 cursor-pointer"
                              >
                                <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => void handleClearCommitment(inv)}
                                title="Remove payment commitment"
                                aria-label={`Remove commitment for ${inv.biNumber}`}
                                className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStartCommit(inv)}
                              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-800 hover:border-[#9E8418] hover:bg-[#FCF6D6] cursor-pointer"
                            >
                              <CalendarPlus
                                className="h-3.5 w-3.5 text-[#9E8418]"
                                aria-hidden="true"
                              />
                              <span>Commit Payment</span>
                            </button>
                          )}
                        </td>

                        {/* Col 2: BI/SOA */}
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 whitespace-nowrap">
                          {inv.biNumber}
                        </td>

                        {/* Col 3: SERVICE TYPE */}
                        <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                          {inv.serviceType}
                        </td>

                        {/* Col 4: PARTICULARS */}
                        <td className="py-2.5 px-3 text-slate-600 min-w-[220px] leading-snug">
                          {inv.particulars}
                        </td>

                        {/* Col 5: AGING */}
                        <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                          {inv.aging}
                        </td>

                        {/* Col 6: REMAINING BALANCE */}
                        <td className="py-2.5 px-3 text-right font-bold text-slate-950 whitespace-nowrap">
                          {formatNumber(inv.remainingBalance)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-300 bg-[#141A21] px-5 py-3 text-white tabular-nums">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-slate-100">
              Total Open Remaining Balance ({clientInvoices.length}{' '}
              {clientInvoices.length === 1 ? 'BI/SOA' : 'BIs/SOAs'})
            </span>
            <span className="text-[11px] text-slate-300">
              {scheduledCount > 0
                ? `${scheduledCount} commitment${scheduledCount === 1 ? '' : 's'} scheduled · Paid invoices are auto-removed upon AR refresh`
                : 'Click "Commit Payment" on any row to schedule a payment date'}
            </span>
          </div>
          <div className="font-display text-lg font-bold text-[#F3DA64]">
            {formatPeso(totalRemaining)}
          </div>
        </div>
      </div>
    </div>
  );
};
