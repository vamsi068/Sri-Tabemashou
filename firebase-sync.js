/* Sri Tabemashou POS - Firebase-only data layer
   Firestore is the only persistent application data store. A small in-memory
   object is used only while the current page is open.
*/
(function () {
  "use strict";

  // NEW APPLICATION NAMESPACE.
  // This app intentionally does NOT read the old POS collections.
  const APP_PREFIX = "sriTabemashouPOS_v2_2026_";
  const MAP = {
    "sriTabemashouBills": { c: APP_PREFIX + "bills", type: "array", id: x => x.id || x.billNumber },
    "inventory": { c: APP_PREFIX + "inventory", type: "object" },
    "sriTabemashouInventoryLedger": { c: APP_PREFIX + "inventoryLedger", type: "array", id: x => x.id || x.movementId },
    "sriTabemashouPurchases": { c: APP_PREFIX + "purchases", type: "array", id: x => x.id },
    "sriTabemashouMenu": { c: APP_PREFIX + "menu", type: "array", id: x => x.id },
    "sriTabemashouTableOrders": { c: APP_PREFIX + "tableOrders", type: "single", doc: "main" },
    "sriTabemashouBillCounter": { c: APP_PREFIX + "billCounter", type: "single", doc: "main" },
    "sriTabemashouKOTCounter": { c: APP_PREFIX + "kotCounter", type: "single", doc: "main" },
    "sriTabemashouAuditLog": { c: APP_PREFIX + "auditLogs", type: "array", id: x => x.id },
    "sriTabemashouSettings": { c: APP_PREFIX + "settings", type: "single", doc: "main" },
    "sriTabemashouStaff": { c: APP_PREFIX + "staff", type: "array", id: x => x.id },
    "sriTabemashouStaffAttendance": { c: APP_PREFIX + "attendance", type: "array", id: x => x.id },
    "sriTabemashouSalaryPayments": { c: APP_PREFIX + "salaryPayments", type: "array", id: x => x.id },
    "sriTabemashouUsers": { c: APP_PREFIX + "users", type: "array", id: x => x.id },
    "sriTabemashouPasswordResets": { c: APP_PREFIX + "passwordResets", type: "array", id: x => x.id || `${x.userId}-${x.expiresAt}` },
    "sriTabemashouExpenses": { c: APP_PREFIX + "expenses", type: "array", id: x => x.id },
    "sriTabemashouCustomers": { c: APP_PREFIX + "customers", type: "array", id: x => x.id }
  };

  // UI state only; intentionally not persisted to Firestore.
  const MEMORY_ONLY = new Set(["sriTabemashouActiveTable", "sriTabemashouSession"]);
  const memory = Object.create(null);
  let db = null;
  let auth = null;
  let ready = false;
  let hydrating = true;
  const queued = new Set();
  // Serialize writes per key so an older table draft can never overwrite a
  // newer "table cleared" write when both Firebase requests are in flight.
  const syncChains = new Map();

  function getConfig() { return window.firebaseConfig || window.FIREBASE_CONFIG || null; }

  async function init() {
    try {
      if (!window.firebase || !window.firebase.firestore) throw new Error("Firebase SDK not loaded");
      if (!firebase.apps.length) {
        const cfg = getConfig();
        if (!cfg) throw new Error("Firebase config missing");
        firebase.initializeApp(cfg);
      }
      db = firebase.firestore();
      window.firebaseDB = db;
      if (firebase.auth) {
        auth = firebase.auth();
        try {
          if (!auth.currentUser) await auth.signInAnonymously();
        } catch (e) {
          console.error("Anonymous Firebase Auth failed:", e);
          throw new Error("Firebase Anonymous Authentication is disabled or unavailable. Enable Authentication → Sign-in method → Anonymous.");
        }
      }
      ready = true;
      return true;
    } catch (e) {
      console.error("Firebase initialization failed:", e);
      ready = false;
      return false;
    }
  }

  function safeId(id, fallback) {
    const value = String(id ?? fallback ?? "").trim();
    return value ? encodeURIComponent(value).slice(0, 1500) : null;
  }
  function clean(data) { return JSON.parse(JSON.stringify(data ?? null)); }

  function setMemory(key, value) {
    if (value === null || value === undefined) delete memory[key];
    else memory[key] = String(value);
  }
  function getMemory(key) { return Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null; }

  // Compatibility data API backed by Firestore. The cache exists only in page memory.
  window.firebaseStore = {
    getItem(key) { return getMemory(String(key)); },
    setItem(key, value) {
      key = String(key); value = String(value ?? "");
      setMemory(key, value);
      if (hydrating) { queued.add(key); return; }
      if (MAP[key]) void syncKey(key);
    },
    removeItem(key) {
      key = String(key);
      setMemory(key, null);
      if (hydrating) { queued.add(key); return; }
      if (MAP[key]) void syncKey(key);
    },
    clear() {
      Object.keys(memory).forEach(k => {
        delete memory[k];
        if (MAP[k]) queued.add(k);
      });
      if (!hydrating) void window.syncPOSDataToFirebase();
    },
    key(index) { return Object.keys(memory)[Number(index)] ?? null; },
    get length() { return Object.keys(memory).length; }
  };

  async function writeArray(key, records) {
    if (!ready) return;
    const spec = MAP[key];
    const arr = Array.isArray(records) ? records : [];
    const ref = db.collection(spec.c);
    const snap = await ref.get();
    const keep = new Set();
    let batch = db.batch(), count = 0, commits = [];
    for (let i = 0; i < arr.length; i++) {
      const rec = clean(arr[i]);
      const id = safeId(spec.id(rec), `${i}`);
      if (!id) continue;
      keep.add(id);
      batch.set(ref.doc(id), { ...rec, _updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      if (++count >= 450) { commits.push(batch.commit()); batch = db.batch(); count = 0; }
    }
    snap.forEach(doc => {
      if (!keep.has(doc.id)) {
        batch.delete(doc.ref);
        if (++count >= 450) { commits.push(batch.commit()); batch = db.batch(); count = 0; }
      }
    });
    if (count) commits.push(batch.commit());
    await Promise.all(commits);
  }

  async function readArray(key) {
    const snap = await db.collection(MAP[key].c).get();
    return snap.docs.map(d => { const x = { ...d.data() }; delete x._updatedAt; return x; });
  }

  async function writeObject(key, value) {
    const spec = MAP[key];
    const ref = db.collection(spec.c);
    const existing = await ref.get();
    const keep = new Set();
    let batch = db.batch(), count = 0, commits = [];
    for (const [name, data] of Object.entries(value && typeof value === "object" ? value : {})) {
      const id = safeId(name); if (!id) continue;
      keep.add(id);
      batch.set(ref.doc(id), { key: name, data: clean(data), _updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      if (++count >= 450) { commits.push(batch.commit()); batch = db.batch(); count = 0; }
    }
    existing.forEach(d => {
      if (!keep.has(d.id)) { batch.delete(d.ref); if (++count >= 450) { commits.push(batch.commit()); batch = db.batch(); count = 0; } }
    });
    if (count) commits.push(batch.commit());
    await Promise.all(commits);
  }

  async function readObject(key) {
    const snap = await db.collection(MAP[key].c).get();
    const out = {};
    snap.forEach(d => { const x = d.data() || {}; if (x.key != null) out[x.key] = x.data || {}; });
    return out;
  }

  async function writeSingle(key, value) {
    const spec = MAP[key];
    await db.collection(spec.c).doc(spec.doc).set({ value: clean(value), _updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
  }
  async function readSingle(key) {
    const d = await db.collection(MAP[key].c).doc(MAP[key].doc).get();
    if (!d.exists) return null;
    const x = d.data() || {}; return x.value ?? null;
  }

  async function syncKey(key) {
    const spec = MAP[key]; if (!ready || !spec) return;

    const previous = syncChains.get(key) || Promise.resolve();
    const current = previous.catch(() => {}).then(async () => {
      try {
        const raw = getMemory(key);
        if (spec.type === "single") await writeSingle(key, raw == null ? null : JSON.parse(raw));
        else if (spec.type === "object") await writeObject(key, raw ? JSON.parse(raw) : {});
        else await writeArray(key, raw ? JSON.parse(raw) : []);
      } catch (e) {
        console.warn(`Firebase save failed for ${key}:`, e);
      }
    });

    syncChains.set(key, current);
    try { await current; } finally {
      if (syncChains.get(key) === current) syncChains.delete(key);
    }
  }

  async function hydrateKey(key) {
    const spec = MAP[key]; if (!ready || !spec) return false;
    try {
      if (spec.type === "single") {
        const remote = await readSingle(key);
        if (remote !== null && remote !== undefined) setMemory(key, JSON.stringify(remote));
        return remote !== null && remote !== undefined;
      }
      if (spec.type === "object") {
        const remote = await readObject(key);
        setMemory(key, JSON.stringify(remote));
        return Object.keys(remote).length > 0;
      }
      const remote = await readArray(key);
      setMemory(key, JSON.stringify(remote));
      return remote.length > 0;
    } catch (e) { console.warn(`Firebase load failed for ${key}:`, e); return false; }
  }

  async function clearCollection(name) {
    const snap = await db.collection(name).get();
    let batch = db.batch(), count = 0, commits = [];
    snap.forEach(d => { batch.delete(d.ref); if (++count >= 450) { commits.push(batch.commit()); batch = db.batch(); count = 0; } });
    if (count) commits.push(batch.commit());
    await Promise.all(commits);
  }

  async function runOneTimeFirebaseOnlyMigration() {
    const ref = db.collection("systemMeta").doc("pos");
    await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (snap.exists && Number(snap.data()?.storageVersion || 0) >= 2) return;
      // The previous build persisted table drafts in browser storage and also
      // mirrored them. Clear only that stale table-draft cache once. Bills,
      // menu, inventory, staff and settings are left untouched.
      tx.set(ref, { storageVersion: 2, storageMode: "firebase-only", migratedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    });
    const meta = await ref.get();
    if (Number(meta.data()?.storageVersion || 0) === 2) {
      // A marker alone cannot tell whether this process won the race, so only
      // clear when this deployment has not recorded a completed table cleanup.
      if (!meta.data()?.tableOrdersCleaned) {
        await clearCollection("tableOrders");
        await ref.set({ tableOrdersCleaned: true, tableOrdersCleanedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      }
    }
  }

  async function hydrateSession() {
    try {
      if (!auth?.currentUser) return;
      const ref = db.collection("posSessions").doc(auth.currentUser.uid);
      const snap = await ref.get();
      if (snap.exists) memory.sriTabemashouSession = JSON.stringify(snap.data().session || null);
    } catch (e) { console.warn("Firebase session load failed:", e); }
  }

  window.firebaseSessionStore = {
    async save(session) {
      if (!ready || !auth?.currentUser) return;
      await db.collection("posSessions").doc(auth.currentUser.uid).set({ session: clean(session), updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
      setMemory("sriTabemashouSession", JSON.stringify(session));
    },
    async clear() {
      setMemory("sriTabemashouSession", null);
      if (ready && auth?.currentUser) await db.collection("posSessions").doc(auth.currentUser.uid).delete().catch(() => {});
    },
    get() {
      const raw = getMemory("sriTabemashouSession");
      try { return raw ? JSON.parse(raw) : null; } catch { return null; }
    }
  };

  async function cleanupCompletedTableOrders() {
    try {
      const raw = getMemory("sriTabemashouTableOrders");
      if (!raw) return;

      const tableOrders = JSON.parse(raw) || {};
      const bills = await readArray("sriTabemashouBills");
      const completedBillNumbers = new Set(
        bills
          .filter(b => String(b?.status || "completed").toLowerCase() !== "voided")
          .map(b => String(b?.billNumber || "").trim())
          .filter(Boolean)
      );

      let changed = false;
      for (const [tableKey, draft] of Object.entries(tableOrders)) {
        const items = Array.isArray(draft?.cart) ? draft.cart : [];
        const billNumber = String(draft?.billNumber || "").trim();

        // A draft with no items is not a pending table.
        if (items.length === 0 || (billNumber && completedBillNumbers.has(billNumber))) {
          delete tableOrders[tableKey];
          changed = true;
        }
      }

      if (changed) {
        setMemory("sriTabemashouTableOrders", JSON.stringify(tableOrders));
        await writeSingle("sriTabemashouTableOrders", tableOrders);
      }
    } catch (e) {
      console.warn("Completed table cleanup skipped:", e);
    }
  }

  async function hydrateAll() {
    if (!(await init())) {
      hydrating = false;
      window.__sriTabemashouSyncDone = true;
      window.dispatchEvent(new CustomEvent("sriTabemashouSyncReady"));
      return;
    }

    try { await runOneTimeFirebaseOnlyMigration(); } catch (e) { console.warn("Firebase-only migration skipped:", e); }
    await hydrateSession();

    for (const key of Object.keys(MAP)) await hydrateKey(key);
    // Release any table draft that already has a completed bill. This also
    // cleans stale drafts left by older versions of the POS.
    await cleanupCompletedTableOrders();
    // Active table is UI state, never shared between devices.
    setMemory("sriTabemashouActiveTable", "NORMAL");

    hydrating = false;
    queued.clear();
    window.__sriTabemashouSyncDone = true;
    window.__sriTabemashouFirebaseReady = true;
    window.dispatchEvent(new CustomEvent("sriTabemashouSyncReady"));
    window.dispatchEvent(new CustomEvent("sriTabemashouFirebaseReady"));
  }

  window.syncStaffToFirebase = () => syncKey("sriTabemashouStaff");
  window.syncStaffAttendanceToFirebase = () => syncKey("sriTabemashouStaffAttendance");
  window.syncSalaryPaymentsToFirebase = () => syncKey("sriTabemashouSalaryPayments");
  window.syncUsersToFirebase = () => syncKey("sriTabemashouUsers");
  window.syncSettingsToFirebase = () => syncKey("sriTabemashouSettings");
  window.SRI_TABEMASHOU_FIREBASE_APP_PREFIX = APP_PREFIX;

  window.syncPOSDataToFirebase = async function () { if (!ready) return; for (const key of Object.keys(MAP)) await syncKey(key); };
  window.hydratePOSDataFromFirebase = hydrateAll;
  window.firebasePOSReady = () => ready;
  window.firebasePOSDB = () => db;
  window.firebasePOSReadyPromise = hydrateAll();
})();
