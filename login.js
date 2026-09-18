/* Sri Tabemashou POS — Firebase login + secure password recovery */
const loginForm=document.getElementById("loginForm");
const adminSetupForm=document.getElementById("adminSetupForm");
const loginError=document.getElementById("loginError");
const setupNotice=document.getElementById("setupNotice");
const loginTitle=document.getElementById("loginTitle");
const loginSubtitle=document.getElementById("loginSubtitle");
const forgotForm=document.getElementById("forgotPasswordForm");
const forgotButton=document.getElementById("forgotPasswordButton");
const backButton=document.getElementById("backToLoginButton");
const recoveryMethod=document.getElementById("recoveryMethod");
const recoveryIdentifier=document.getElementById("recoveryIdentifier");
const recoveryEmailButton=document.getElementById("recoveryEmailButton");
const recoveryOtpButton=document.getElementById("recoveryOtpButton");
const recoveryOtpStep=document.getElementById("recoveryOtpStep");
const recoveryOtp=document.getElementById("recoveryOtp");
const recoveryNewPassword=document.getElementById("recoveryNewPassword");
const recoveryConfirmPassword=document.getElementById("recoveryConfirmPassword");

function err(m){loginError.textContent=m;loginError.hidden=false;loginError.style.background="";loginError.style.color="";loginError.style.borderColor="";}
function success(m){loginError.textContent=m;loginError.hidden=false;loginError.style.background="#ecfdf5";loginError.style.color="#047857";loginError.style.borderColor="#a7f3d0";}
function clearErr(){loginError.textContent="";loginError.hidden=true;}
function showLogin(){loginTitle.textContent="Sign in";loginSubtitle.textContent="Sri Tabemashou — Restaurant POS";loginForm.hidden=false;adminSetupForm.hidden=true;forgotForm.hidden=true;setupNotice.hidden=true;}
function showSignup(){loginTitle.textContent="Create Admin Account";loginSubtitle.textContent="First-time setup for Sri Tabemashou";loginForm.hidden=true;adminSetupForm.hidden=false;forgotForm.hidden=true;setupNotice.hidden=false;setupNotice.textContent="Create the first Admin account. Add email and mobile so recovery is available.";}
function showRecovery(){clearErr();loginTitle.textContent="Forgot Password";loginSubtitle.textContent="Recover your Admin account securely.";loginForm.hidden=true;adminSetupForm.hidden=true;forgotForm.hidden=false;setupNotice.hidden=false;setupNotice.textContent="Email sends a Firebase one-time reset link. Mobile sends an SMS OTP.";recoveryOtpStep.hidden=true;recoveryEmailButton.hidden=recoveryMethod.value!=="email";recoveryOtpButton.hidden=recoveryMethod.value!=="mobile";}

async function loginUser(e){
    e.preventDefault();clearErr();
    const username=document.getElementById("username").value.trim().toLowerCase();
    const password=document.getElementById("password").value;
    if(!username||!password){err("Enter your User ID and password.");return;}
    try{await signInFirebaseUser(username,password);await navigateAfterLogin();}
    catch(e){
        console.error(e);const c=String(e?.code||"");
        if(c==="auth/configuration-not-found"){err("Firebase Authentication is not configured. Enable Email/Password in Firebase Console → Authentication → Sign-in method.");return;}
        if(c==="auth/operation-not-allowed"){err("Email/Password sign-in is disabled. Enable it in Firebase Console.");return;}
        if(c==="auth/user-disabled"){err("This account is disabled. Contact the Admin.");return;}
        if(c==="auth/wrong-password"||c==="auth/invalid-credential"){err("Invalid User ID or password.");return;}
        if(c==="auth/network-request-failed"){err("Network error. Check your internet connection.");return;}
        err(e?.message||"Unable to sign in.");
    }
}

async function createFirstAdmin(e){
    e.preventDefault();clearErr();
    const name=document.getElementById("adminName").value.trim();
    const username=document.getElementById("adminUsername").value.trim().toLowerCase();
    const email=document.getElementById("adminEmail").value.trim().toLowerCase();
    const mobile=document.getElementById("adminMobile").value.trim();
    const password=document.getElementById("adminPassword").value;
    const confirm=document.getElementById("adminPasswordConfirm").value;
    if(!name||!username||!email||!mobile||!password){err("Fill all Admin fields including email and mobile number.");return;}
    if(!/^[a-z0-9._-]+$/.test(username)){err("User ID can contain only letters, numbers, dot, dash and underscore.");return;}
    if(!/^\+?[0-9\s()-]{10,15}$/.test(mobile)){err("Enter a valid mobile number.");return;}
    if(password.length<6){err("Password must contain at least 6 characters.");return;}
    if(password!==confirm){err("Passwords do not match.");return;}
    try{
        const users=await authLoadUsers();
        if(users.length){showLogin();err("Admin already exists. Please sign in.");return;}
        await createFirebaseUser({name,username,email,mobile,password,role:"Admin"});
        await navigateAfterLogin();
    }catch(e){
        console.error(e);const c=String(e?.code||"");
        if(c==="auth/email-already-in-use"){err("This email is already registered in Firebase Authentication.");return;}
        if(c==="auth/configuration-not-found"||c==="auth/operation-not-allowed"){err("Enable Firebase Authentication → Email/Password in your Firebase Console.");return;}
        err(e?.message||"Unable to create Admin account.");
    }
}

async function sendRecoveryEmail(){
    clearErr();const value=recoveryIdentifier.value.trim();
    if(!value){err("Enter the Admin recovery email.");return;}
    try{await sendAdminPasswordReset(value);success("Password reset email sent. Open the email and use the one-time reset link to create a new password.");}
    catch(e){err(e?.message||"Unable to send the password reset email.");}
}

async function sendRecoveryOtp(){
    clearErr();const value=recoveryIdentifier.value.trim();
    if(!value){err("Enter the Admin mobile number.");return;}
    try{await recoverAdminByPhoneStart(value);recoveryOtpStep.hidden=false;recoveryOtpButton.disabled=true;success("OTP sent to the registered Admin mobile number.");}
    catch(e){err(e?.message||"Unable to send the OTP.");}
}

async function verifyRecoveryOtp(e){
    e.preventDefault();clearErr();
    const code=recoveryOtp.value.trim();const next=recoveryNewPassword.value;const confirm=recoveryConfirmPassword.value;
    if(!/^\d{6}$/.test(code)){err("Enter the 6-digit OTP.");return;}
    if(next.length<6){err("New password must contain at least 6 characters.");return;}
    if(next!==confirm){err("New passwords do not match.");return;}
    try{await recoverAdminByPhoneVerify(code,next);forgotForm.reset();showLogin();success("Admin password reset successfully. You can now sign in with your User ID and new password.");}
    catch(e){err(e?.message||"OTP verification failed.");}
}

forgotButton?.addEventListener("click",showRecovery);
backButton?.addEventListener("click",()=>{showLogin();clearErr();});
recoveryMethod?.addEventListener("change",()=>{recoveryOtpStep.hidden=true;recoveryEmailButton.hidden=recoveryMethod.value!=="email";recoveryOtpButton.hidden=recoveryMethod.value!=="mobile";});
recoveryEmailButton?.addEventListener("click",sendRecoveryEmail);
recoveryOtpButton?.addEventListener("click",sendRecoveryOtp);
forgotForm?.addEventListener("submit",verifyRecoveryOtp);
loginForm?.addEventListener("submit",loginUser);
adminSetupForm?.addEventListener("submit",createFirstAdmin);

(async function start(){
    try{
        if(window.firebasePOSReadyPromise) await window.firebasePOSReadyPromise;
        const users=await authLoadUsers();
        if(users.length===0) showSignup(); else showLogin();
    }catch(e){console.error(e);showLogin();err("Firebase connection failed. Check Authentication and Firestore configuration.");}
})();
