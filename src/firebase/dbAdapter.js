import { 
  db, 
  forceDemoMode, 
  isConfigured,
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit, 
  writeBatch 
} from './config';

const STORAGE_KEY_PREFIX = 'libcredit_db_';

// Initial default settings
export const DEFAULT_SCORING_SETTINGS = {
  initialScore: 50,
  onTimeBonus: 10,
  earlyBonus: 10,
  latePenalty: 5,
  repeatedDefaultPenalty: 10,
  repeatedDefaultThreshold: 3,
  goodConditionBonus: 5,
  fairConditionBonus: 0,
  damagedConditionPenalty: 10,
  lostConditionPenalty: 20,
  tiers: {
    excellent: { minScore: 80, maxBooks: 5, loanDays: 21, label: 'Excellent', color: 'emerald', description: 'Priority borrowing' },
    good: { minScore: 60, maxBooks: 4, loanDays: 14, label: 'Good', color: 'blue', description: 'Normal borrowing' },
    fair: { minScore: 40, maxBooks: 3, loanDays: 14, label: 'Fair', color: 'amber', description: 'Normal with monitoring' },
    poor: { minScore: 20, maxBooks: 1, loanDays: 7, label: 'Poor', color: 'orange', description: 'Restricted borrowing' },
    veryPoor: { minScore: 0, maxBooks: 0, loanDays: 0, label: 'Very Poor', color: 'red', description: 'Borrowing blocked' }
  }
};

const memoryStore = {};

function getLocalStore(collectionName) {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${collectionName}`);
      return raw ? JSON.parse(raw) : {};
    }
    return memoryStore[collectionName] || {};
  } catch (e) {
    console.error('Error reading local store', e);
    return {};
  }
}

function setLocalStore(collectionName, data) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${collectionName}`, JSON.stringify(data));
    } else {
      memoryStore[collectionName] = data;
    }
  } catch (e) {
    console.error('Error saving local store', e);
  }
}

// Generate unique ID for demo mode
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export function purgeAllMockStorage() {
  try {
    if (typeof localStorage === 'undefined') return;
    const mockKeys = [
      'libcredit_db_borrowings',
      'libcredit_db_creditScores',
      'libcredit_db_defaults',
      'libcredit_db_disputes',
      'libcredit_db_scoreLogs'
    ];
    mockKeys.forEach(k => localStorage.removeItem(k));

    const rawUsers = localStorage.getItem('libcredit_db_users');
    if (rawUsers && (rawUsers.includes('patron_1') || rawUsers.includes('Zainab Aminu'))) {
      const users = JSON.parse(rawUsers);
      const cleaned = {};
      Object.keys(users).forEach(k => {
        if (!k.startsWith('patron_') && !k.startsWith('admin_1')) {
          cleaned[k] = users[k];
        }
      });
      localStorage.setItem('libcredit_db_users', JSON.stringify(cleaned));
    }
  } catch (e) {
    // ignore
  }
}

// Auto-purge any stale mock records whenever running with live Firebase
if (isConfigured && !forceDemoMode) {
  purgeAllMockStorage();
}

/**
 * Fetch a single document by ID
 */
export async function fetchDocument(collectionName, docId) {
  if (!docId) return null;

  if (isConfigured && !forceDemoMode && db) {
    try {
      const docRef = doc(db, collectionName, docId);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() };
      }
      if (collectionName === 'settings' && docId === 'scoring') {
        return DEFAULT_SCORING_SETTINGS;
      }
      if (collectionName === 'books') {
        const store = getLocalStore('books');
        return store[docId] || null;
      }
      return null;
    } catch (err) {
      console.warn(`Firestore read failed for ${collectionName}/${docId}:`, err.message);
      if (collectionName === 'settings' && docId === 'scoring') {
        return DEFAULT_SCORING_SETTINGS;
      }
      if (collectionName === 'books') {
        const store = getLocalStore('books');
        return store[docId] || null;
      }
      return null;
    }
  }

  // Local store fallback
  const store = getLocalStore(collectionName);
  return store[docId] || null;
}

/**
 * Set a document with a specific ID (or create if not existing)
 */
export async function saveDocument(collectionName, docId, data, merge = true) {
  const cleanData = { ...data, updatedAt: new Date().toISOString() };
  if (!cleanData.createdAt) {
    cleanData.createdAt = new Date().toISOString();
  }

  if (isConfigured && !forceDemoMode && db) {
    try {
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, cleanData, { merge });
      return { id: docId, ...cleanData };
    } catch (err) {
      console.warn(`Firestore write failed for ${collectionName}/${docId}, falling back to local store:`, err.message);
    }
  }

  const store = getLocalStore(collectionName);
  const existing = store[docId] || {};
  store[docId] = merge ? { ...existing, ...cleanData, id: docId } : { ...cleanData, id: docId };
  setLocalStore(collectionName, store);
  return store[docId];
}

/**
 * Insert a new document with auto-generated ID (uses setDoc with explicit doc ID to avoid ID mismatch)
 */
export async function insertDocument(collectionName, data) {
  const newId = data.id || generateId(collectionName.slice(0, 3));
  const docData = {
    ...data,
    id: newId,
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (isConfigured && !forceDemoMode && db) {
    try {
      const docRef = doc(db, collectionName, newId);
      await setDoc(docRef, docData);
      return docData;
    } catch (err) {
      console.warn(`Firestore insert failed for ${collectionName}/${newId}, saving to local store:`, err.message);
    }
  }

  const store = getLocalStore(collectionName);
  store[newId] = docData;
  setLocalStore(collectionName, store);
  return docData;
}

/**
 * Update an existing document (uses setDoc with merge:true to avoid NOT_FOUND errors)
 */
export async function modifyDocument(collectionName, docId, data) {
  const updateData = { ...data, updatedAt: new Date().toISOString() };

  if (isConfigured && !forceDemoMode && db) {
    try {
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, updateData, { merge: true });
      return { id: docId, ...updateData };
    } catch (err) {
      console.warn(`Firestore update failed for ${collectionName}/${docId}, saving to local store:`, err.message);
    }
  }

  const store = getLocalStore(collectionName);
  if (store[docId]) {
    store[docId] = { ...store[docId], ...updateData };
    setLocalStore(collectionName, store);
    return store[docId];
  }
  return null;
}

/**
 * Delete a document
 */
export async function removeDocument(collectionName, docId) {
  if (isConfigured && !forceDemoMode && db) {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      return true;
    } catch (err) {
      console.warn(`Firestore delete failed for ${collectionName}/${docId}:`, err.message);
    }
  }

  const store = getLocalStore(collectionName);
  if (store[docId]) {
    delete store[docId];
    setLocalStore(collectionName, store);
    return true;
  }
  return false;
}

/**
 * Fetch all documents in a collection with optional filters and sorting
 * filters: [{ field, op: '==' | '!=' | '>' | '<' | 'in' | 'array-contains', value }]
 * sort: { field, direction: 'asc' | 'desc' }
 * 
 * Note: Firestore requires a composite index if where() and orderBy() on different fields are combined.
 * To guarantee 100% reliability without manual index setup, filtering is pushed to Firestore,
 * and sorting is handled safely in JavaScript in memory.
 */
export async function fetchCollection(collectionName, filters = [], sort = null, maxResults = null) {
  if (isConfigured && !forceDemoMode && db) {
    try {
      const colRef = collection(db, collectionName);
      const constraints = [];

      filters.forEach(f => {
        constraints.push(where(f.field, f.op, f.value));
      });

      // Only pass orderBy to Firestore if there are NO where filters (avoids composite index crash)
      if (sort && filters.length === 0) {
        constraints.push(orderBy(sort.field, sort.direction || 'asc'));
      }

      let snapshot;
      try {
        const q = constraints.length > 0 ? query(colRef, ...constraints) : colRef;
        snapshot = await getDocs(q);
      } catch (queryErr) {
        // Fallback: If filtered query failed (e.g. index/network/permission), fetch collection and filter client-side
        console.warn(`Filtered Firestore query failed for ${collectionName}, falling back to client-side filtering:`, queryErr.message);
        snapshot = await getDocs(colRef);
      }

      let docs = [];
      snapshot.forEach(docSnap => {
        docs.push({ id: docSnap.id, ...docSnap.data() });
      });

      // Client-side filtering check (guarantees accurate results even if fallback was used)
      if (filters && filters.length > 0) {
        docs = docs.filter(item => {
          return filters.every(f => {
            const val = item[f.field];
            switch (f.op) {
              case '==':
                return val === f.value;
              case '!=':
                return val !== f.value;
              case '>':
                return val > f.value;
              case '>=':
                return val >= f.value;
              case '<':
                return val < f.value;
              case '<=':
                return val <= f.value;
              case 'in':
                return Array.isArray(f.value) && f.value.includes(val);
              case 'array-contains':
                return Array.isArray(val) && val.includes(f.value);
              default:
                return true;
            }
          });
        });
      }

      // Client-side sorting (100% reliable, no index required)
      if (sort) {
        const { field, direction = 'asc' } = sort;
        docs.sort((a, b) => {
          const valA = a[field] ?? '';
          const valB = b[field] ?? '';
          if (valA < valB) return direction === 'asc' ? -1 : 1;
          if (valA > valB) return direction === 'asc' ? 1 : -1;
          return 0;
        });
      }

      if (maxResults && maxResults > 0) {
        docs = docs.slice(0, maxResults);
      }

      // If books collection in Firestore has not yet been populated via Admin sync, provide the 87 books
      if (collectionName === 'books' && docs.length === 0) {
        const store = getLocalStore('books');
        return Object.values(store);
      }

      return docs;
    } catch (err) {
      console.warn(`Firestore query failed for ${collectionName}:`, err.message);
      if (collectionName === 'books') {
        const store = getLocalStore('books');
        return Object.values(store);
      }
      // Check localStore fallback
      const store = getLocalStore(collectionName);
      let items = Object.values(store);
      if (filters && filters.length > 0) {
        items = items.filter(item => {
          return filters.every(f => {
            const val = item[f.field];
            switch (f.op) {
              case '==': return val === f.value;
              case '!=': return val !== f.value;
              case 'in': return Array.isArray(f.value) && f.value.includes(val);
              default: return true;
            }
          });
        });
      }
      return items;
    }
  }

  // Local store querying (offline mode)
  const store = getLocalStore(collectionName);
  let items = Object.values(store);

  if (filters && filters.length > 0) {
    items = items.filter(item => {
      return filters.every(f => {
        const val = item[f.field];
        switch (f.op) {
          case '==':
            return val === f.value;
          case '!=':
            return val !== f.value;
          case '>':
            return val > f.value;
          case '>=':
            return val >= f.value;
          case '<':
            return val < f.value;
          case '<=':
            return val <= f.value;
          case 'in':
            return Array.isArray(f.value) && f.value.includes(val);
          default:
            return true;
        }
      });
    });
  }

  if (sort) {
    items.sort((a, b) => {
      const valA = a[sort.field];
      const valB = b[sort.field];
      if (typeof valA === 'string') {
        return sort.direction === 'desc' 
          ? valB.localeCompare(valA) 
          : valA.localeCompare(valB);
      }
      return sort.direction === 'desc' ? valB - valA : valA - valB;
    });
  }

  if (maxResults && maxResults > 0) {
    items = items.slice(0, maxResults);
  }

  return items;
}

/**
 * Execute atomic batch write operations
 * Uses setDoc with merge:true for updates to prevent NOT_FOUND aborts
 */
export async function batchWrite(operations) {
  if (isConfigured && !forceDemoMode && db) {
    try {
      const batch = writeBatch(db);
      operations.forEach(op => {
        const docRef = doc(db, op.collection, op.id);
        if (op.type === 'set' || op.type === 'update') {
          batch.set(docRef, { ...op.data, updatedAt: new Date().toISOString() }, { merge: op.merge !== false });
        } else if (op.type === 'delete') {
          batch.delete(docRef);
        }
      });
      await batch.commit();
      return true;
    } catch (err) {
      console.warn('Firestore batch write failed, applying to local store:', err.message);
    }
  }

  // Apply to local store
  operations.forEach(op => {
    const store = getLocalStore(op.collection);
    const now = new Date().toISOString();
    if (op.type === 'set' || op.type === 'update') {
      const existing = store[op.id] || {};
      store[op.id] = op.merge !== false ? { ...existing, ...op.data, id: op.id, updatedAt: now } : { ...op.data, id: op.id, updatedAt: now };
    } else if (op.type === 'delete') {
      delete store[op.id];
    }
    setLocalStore(op.collection, store);
  });

  return true;
}

/**
 * Reset local collection with seeded data
 */
export function populateLocalCollection(collectionName, items) {
  const store = {};
  items.forEach(item => {
    const id = item.id || generateId(collectionName.slice(0, 3));
    store[id] = { ...item, id };
  });
  setLocalStore(collectionName, store);
  return store;
}
