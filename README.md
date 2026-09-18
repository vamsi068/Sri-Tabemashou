# Sri Tabemashou POS - Firebase-only version

This build uses **Firebase Firestore as the only persistent application data store**. No browser persistence API is used by the POS code.

## Firebase collections

- `bills`
- `inventory`
- `inventoryLedger`
- `purchases`
- `menu`
- `tableOrders`
- `billCounter`
- `kotCounter`
- `auditLogs`
- `settings`
- `staff`
- `attendance`
- `salaryPayments`
- `users`
- `passwordResets`
- `posSessions`
- `systemMeta`

## Billing table workflow

Tables 1-8 are stored in the Firestore `tableOrders/main` document.

1. Select a table and add items.
2. Press **New Bill** without printing.
3. The selected table remains **Pending** in Firestore.
4. Start another bill or work on another table.
5. Select the pending table later to load its saved order.
6. Press **Print Bill** after payment.
7. The completed bill is saved in `bills`.
8. Only that table's pending order is deleted from Firestore, so the table becomes available.
9. Reloading the page reads the table status from Firestore; old browser-stored table data is ignored.

### One-time migration

The Firebase-only migration uses `systemMeta/pos` with `storageVersion: 2`. On the first run it clears the old mirrored `tableOrders` collection once so stale pending tables from the previous implementation do not reappear. Bills, menu, inventory, staff, settings and other Firestore data are not deleted.

## Startup

Every POS page loads Firebase SDK + `firebase-config.js` + `firebase-sync.js` first. `app-loader.js` waits for Firestore hydration and then loads the page modules. This prevents an empty/default browser cache from overwriting Firestore data during page startup.

## Authentication session

The client uses Firebase Anonymous Authentication only to identify the current browser session and stores the session record in Firestore under `posSessions`. Enable **Anonymous** sign-in in Firebase Authentication for persistent login sessions across the POS pages.

The existing custom user records remain in Firestore under `users`. Passwords are stored as hashes; plaintext passwords are never displayed to administrators.

## Firebase security

Configure Firestore Security Rules so only authenticated users can access the POS collections and only administrators can modify users/settings or perform privileged operations. Do not use public read/write rules for a production restaurant system.
