# Sri Tabemashou POS — First Admin Signup, Then Login

## First time
When the `sriTabemashouPOS_v2_2026_users` collection is empty, `login.html` shows:

**Create Admin Account**

Admin enters:
- Name
- User ID
- Password
- Confirm Password

The account is created in Firebase Authentication (Email/Password provider) and the Admin profile is created in Firestore.

## Every next time
Once the first Admin exists, the signup form is hidden.

The page shows only:

**User ID + Password → Sign In**

No automatic account is created.

## Required Firebase setting
Firebase Console → Authentication → Sign-in method → **Email/Password → Enable**.

Anonymous Authentication is NOT used for login in this version.

## Firestore Rules
Deploy `firestore.rules`.

## No browser storage
The POS does not use localStorage, sessionStorage or IndexedDB.
