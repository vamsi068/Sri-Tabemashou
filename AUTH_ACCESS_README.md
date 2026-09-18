# Sri Tabemashou POS - Firebase-only authentication

The POS no longer uses browser local storage for login accounts, passwords, sessions or application data.

- User accounts: Firestore `users`
- Password-reset records: Firestore `passwordResets`
- Current browser session: Firestore `posSessions`, identified by Firebase Anonymous Authentication
- Page permissions: stored with each Firestore user record

Enable **Authentication -> Sign-in method -> Anonymous** in Firebase for the session layer used by this static web application.

For production, enforce all access with Firestore Security Rules and Firebase Authentication. Client-side page hiding is only a UI convenience and is not a security boundary.
