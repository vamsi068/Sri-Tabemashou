# Firebase auth/configuration-not-found fix

This error is returned by Firebase Authentication when the Auth service/provider is not configured for the Firebase project. The code now detects it and shows the exact setup instructions instead of a generic login error.

Required:
1. Firebase Console → Authentication → Get started.
2. Authentication → Sign-in method → Email/Password → Enable → Save.
3. Authentication → Settings → Authorized domains → add the domain used by the POS (add `localhost` for local development if it is not listed).
4. Open `firebase-setup.html` in this project to verify the Auth service.
5. Then use `login.html`.

The first-time Admin signup uses Firebase Email/Password Authentication. After the first Admin is created, the page switches to User ID + password login.

No localStorage/sessionStorage/IndexedDB is used.
