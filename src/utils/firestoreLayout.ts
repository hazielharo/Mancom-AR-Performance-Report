import {
  doc,
  getDocFromServer,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import { auth, db } from './firebaseApp';
import { isAuthorizedAdminEmail } from './adminAuth';
import {
  DEFAULT_PAGE_ORDER,
  normalizePageLayout,
  ReportPageLayout,
} from './pageOrder';

const LAYOUT_COLLECTION = 'report_config';
const LAYOUT_DOC_ID = 'layout';
const LAYOUT_DOC_PATH = `${LAYOUT_COLLECTION}/${LAYOUT_DOC_ID}`;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testFirestoreConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

export function canWriteLayoutToFirestore(): boolean {
  const user = auth.currentUser;
  return Boolean(user?.emailVerified && isAuthorizedAdminEmail(user.email));
}

export function subscribeGlobalLayoutFromFirestore(
  onUpdate: (layout: ReportPageLayout) => void
): () => void {
  const ref = doc(db, LAYOUT_COLLECTION, LAYOUT_DOC_ID);
  return onSnapshot(
    ref,
    (snapshot) => {
      if (!snapshot.exists()) return;
      const raw = snapshot.data();
      const updatedAtRaw = raw?.updatedAt;
      const updatedAtMs =
        updatedAtRaw instanceof Timestamp
          ? updatedAtRaw.toMillis()
          : typeof updatedAtRaw === 'number'
            ? updatedAtRaw
            : 0;

      const normalized = normalizePageLayout(
        {
          pageOrder: raw?.pageOrder,
          deletedPages: raw?.deletedPages,
          hiddenPages: raw?.hiddenPages,
          updatedAtMs,
        },
        DEFAULT_PAGE_ORDER
      );
      onUpdate(normalized);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, LAYOUT_DOC_PATH);
    }
  );
}

export async function saveGlobalLayoutToFirestore(
  layout: ReportPageLayout
): Promise<void> {
  if (!canWriteLayoutToFirestore()) return;
  const normalized = normalizePageLayout(layout, DEFAULT_PAGE_ORDER);
  try {
    await setDoc(doc(db, LAYOUT_COLLECTION, LAYOUT_DOC_ID), {
      pageOrder: normalized.pageOrder,
      deletedPages: normalized.deletedPages,
      hiddenPages: normalized.hiddenPages,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, LAYOUT_DOC_PATH);
  }
}

export async function fetchServerReportLayout(): Promise<ReportPageLayout | null> {
  try {
    const res = await fetch('/api/report-layout', {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    return normalizePageLayout(json, DEFAULT_PAGE_ORDER);
  } catch {
    return null;
  }
}

export async function requestServerAdminToken(params: {
  email?: string;
  idToken?: string;
}): Promise<string | null> {
  try {
    const res = await fetch('/api/admin/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { token?: string };
    return typeof json.token === 'string' ? json.token : null;
  } catch {
    return null;
  }
}

export async function saveServerReportLayout(
  layout: ReportPageLayout,
  bearerToken: string
): Promise<ReportPageLayout | null> {
  const normalized = normalizePageLayout(layout, DEFAULT_PAGE_ORDER);
  const res = await fetch('/api/report-layout', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${bearerToken}`,
    },
    body: JSON.stringify({
      pageOrder: normalized.pageOrder,
      deletedPages: normalized.deletedPages,
      hiddenPages: normalized.hiddenPages,
    }),
  });
  if (!res.ok) {
    return null;
  }
  const saved = await res.json();
  return normalizePageLayout(saved, DEFAULT_PAGE_ORDER);
}
