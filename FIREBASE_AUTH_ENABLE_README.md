# Fix: Firebase Authentication configuration-not-found

The POS is already coded to use Firebase Authentication with Email/Password.
The error `auth/configuration-not-found` means the Firebase backend has not enabled/configured the Email/Password provider for the `sri-tabemashou` project.

## Fastest fix

Open Firebase Console for the project `sri-tabemashou`:

1. Authentication
2. Get started (if shown)
3. Sign-in method
4. Email/Password
5. Enable
6. Save

Then reload the POS and create the first Admin.

## Automatic CLI fix included

This folder contains:

- `firebase.json` — enables `emailPassword: true`
- `.firebaserc` — points to `sri-tabemashou`
- `ENABLE_FIREBASE_AUTH.bat` — logs into Firebase CLI and deploys the Auth configuration

On Windows, double-click `ENABLE_FIREBASE_AUTH.bat`.

It requires Node.js. The script uses `npx firebase-tools`, so Firebase CLI does not need to be installed globally.

## Important

The browser application cannot enable a Firebase Authentication provider by itself. Provider configuration is a Firebase project setting. Once enabled, the existing POS login/signup code uses Firebase Auth correctly.

No localStorage, sessionStorage, or IndexedDB is used for POS persistence.
