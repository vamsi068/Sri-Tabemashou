# Sri Tabemashou POS — Password Recovery Setup

## Login branding
The login page now uses `logo.png` above the Sri Tabemashou name.

## First Admin
First-time setup requires:
- Admin name
- Admin User ID
- Real recovery email
- Recovery mobile number
- Password

The Firebase Authentication account uses the real recovery email. The User ID is stored in the Firebase `sriTabemashouPOS_v2_2026_loginIndex` collection so the POS can still log in using User ID + password.

## Staff accounts
Create staff login accounts from **Settings → Users & Access**.

For a Firebase login account, staff must have:
- User ID
- Email
- Initial password
- Optional mobile number
- Role and permissions

The Admin can use the 🔑 button beside a staff account to set a temporary password. This calls the Firebase callable function `adminResetStaffPassword` and does not store the password in Firestore.

## Admin forgotten password — email
Login → **Forgot Password?** → **Email reset link** → enter the registered Admin email.

Firebase sends a one-time password-reset email. The user completes the reset through Firebase's secure password-reset flow.

## Admin forgotten password — mobile OTP
Login → **Forgot Password?** → **Mobile OTP** → enter the registered Admin mobile → receive the Firebase SMS OTP → enter the OTP and new password.

The Cloud Function `resetAdminPasswordByVerifiedPhone` verifies the authenticated phone number and changes the password of the matching Admin Firebase Auth account.

## Firebase Console requirements
Enable:
1. Authentication → Email/Password
2. Authentication → Phone
3. Authentication → Anonymous (the existing Firebase sync layer uses an anonymous connection before login)
4. Authentication → Settings → Authorized domains: add your GitHub Pages domain and localhost if you use local development.

Phone authentication must be enabled in the Firebase Console; the Firebase CLI auth configuration file does not configure the Phone provider.

## Deploy
Install Firebase CLI:

`npm install -g firebase-tools`

Then run `DEPLOY_AUTH_RECOVERY.bat` from the project folder.

Or from the project folder:

`firebase login`

`firebase use sri-tabemashou`

`firebase deploy --only functions,firestore`

If your Firebase Console requires provider configuration manually, enable Email/Password, Phone and Anonymous in Authentication → Sign-in method.

## Important
The browser never receives a Firebase Admin SDK credential. Staff password changes and phone-based Admin password changes are performed by Firebase Cloud Functions using the Admin SDK on the server side.
