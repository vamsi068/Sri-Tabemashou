# Sri Tabemashou POS — NEW APPLICATION

This build is a fresh Firebase namespace.

## Login
Username: `admin`
Password: `admin123`

## New Firebase collections
All normal POS data uses the prefix:

`sriTabemashouPOS_v2_2026_`

The application does not read the old collections (`bills`, `menu`, `inventory`, etc.).

## Clear Firebase data
Open:

`firebase-factory-reset.html`

Click **DELETE ALL POS DATA** and confirm twice.

The reset page deletes both the old known POS collections and the new application collections. It uses Firebase directly and does not use localStorage/sessionStorage/IndexedDB.

If deletion is denied, update Firestore Rules or perform the cleanup from Firebase Console. A web app cannot bypass Firebase Security Rules.

## Required Firebase
Enable Authentication → Sign-in method → Anonymous.

## Important
The browser app cannot itself change the Firebase project ID. To use a completely separate Firebase project, create a new Firebase project and replace `firebase-config.js` with the new project's web configuration.
