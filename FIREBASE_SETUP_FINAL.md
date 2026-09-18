# Sri Tabemashou POS — FINAL Firebase-only setup

## Login
Username: `admin`
Password: `admin123`

## Required one-time Firebase Console setting
Enable Anonymous Authentication:

Firebase Console → Authentication → Sign-in method → Anonymous → Enable → Save.

A browser application cannot enable a Firebase Authentication provider in your project for you.

## Firestore Rules
`firestore.rules` is included. Deploy these rules in Firebase Console → Firestore Database → Rules.

They allow authenticated Firebase sessions to use only the new:
`sriTabemashouPOS_v2_2026_*`
collections and deny other collections.

## Test
Open `firebase-setup.html`.

It checks:
1. Firebase project connection
2. Anonymous Authentication
3. Firestore read/write

Then open `login.html`.

## Data
The application uses the new Firebase collection namespace and does not read old POS collections.
No localStorage, sessionStorage, or IndexedDB is used.
