/* Sri Tabemashou POS — Firebase Authentication + access control + recovery */

const PAGE_PERMISSIONS = {
    dashboard:"dashboard.view", billing:"billing.view", bills:"bills.view",
    menu:"menu.view", reports:"reports.view", staff:"staff.view",
    settings:"settings.view", inventory:"inventory.view"
};

const DEFAULT_ROLE_PERMISSIONS = {
    Admin:["dashboard.view","inventory.view","inventory.manage","billing.view","bills.view",
        "bills.delete","bills.void","menu.view","menu.manage","reports.view","staff.view",
        "staff.manage","settings.view","users.manage"],
    Manager:["dashboard.view","inventory.view","inventory.manage","billing.view","bills.view",
        "bills.delete","bills.void","menu.view","menu.manage","reports.view","staff.view",
        "staff.manage","settings.view"],
    Cashier:["dashboard.view","billing.view","bills.view"],
    Chef:["dashboard.view","billing.view","bills.view","menu.view","inventory.view"],
    Staff:["dashboard.view","billing.view","bills.view"]
};

const APP_PREFIX = "sriTabemashouPOS_v2_2026_";
const USERS_COLLECTION = APP_PREFIX + "users";
const LOGIN_INDEX_COLLECTION = APP_PREFIX + "loginIndex";
const SESSION_COLLECTION = APP_PREFIX + "posSessions";
const ADMIN_ID = "default-admin";
let usersCache=[];
let sessionCache=null;

function getDB(){ return window.firebaseDB || window.firebase?.firestore?.() || null; }
function getAuth(){ return window.firebaseAuth || window.firebase?.auth?.() || null; }
function clone(v){ return JSON.parse(JSON.stringify(v??null)); }
function normalizeUsername(v){ return String(v||"").trim().toLowerCase().replace(/[^a-z0-9._-]/g,""); }
function normalizeMobile(v){
    const raw=String(v||"").trim();
    if(raw.startsWith("+")) return "+"+raw.slice(1).replace(/\D/g,"");
    const digits=raw.replace(/\D/g,"");
    if(digits.length===10) return "+91"+digits;
    if(digits.length>=11) return "+"+digits;
    return "";
}

async function loadUsers(){
    const db=getDB(), auth=getAuth();
    if(!db || !auth?.currentUser) throw new Error("Firebase Authentication is not ready.");
    const snap=await db.collection(USERS_COLLECTION).get();
    usersCache=snap.docs.map(d=>({id:d.id,...(d.data()||{})}));
    return usersCache;
}

async function loadOwnUser(uid){
    const db=getDB();
    if(!db) return null;
    const d=await db.collection(USERS_COLLECTION).doc(uid).get();
    return d.exists?{id:d.id,...(d.data()||{})}:null;
}

async function saveUser(user){
    const db=getDB();
    if(!db) throw new Error("Firebase Firestore is not ready.");
    const clean={...clone(user),updatedAt:new Date().toISOString()};
    await db.collection(USERS_COLLECTION).doc(user.id).set(clean,{merge:true});
    await db.collection(LOGIN_INDEX_COLLECTION).doc(normalizeUsername(user.username)).set({
        username:normalizeUsername(user.username), email:user.email||"", firebaseUid:user.firebaseUid||user.id,
        userId:user.id, active:user.active!==false, updatedAt:firebase.firestore.FieldValue.serverTimestamp()
    },{merge:true});
    usersCache=usersCache.filter(u=>String(u.id)!==String(user.id));
    usersCache.push({...clean,id:user.id});
    return user;
}

async function deleteUserProfile(user){
    const db=getDB(); if(!db) return;
    await db.collection(USERS_COLLECTION).doc(user.id).delete();
    await db.collection(LOGIN_INDEX_COLLECTION).doc(normalizeUsername(user.username)).delete().catch(()=>{});
    usersCache=usersCache.filter(u=>String(u.id)!==String(user.id));
}

async function getSession(){
    const db=getDB(), auth=getAuth();
    if(!db || !auth?.currentUser) return sessionCache;
    try{
        const d=await db.collection(SESSION_COLLECTION).doc(auth.currentUser.uid).get();
        sessionCache=d.exists?(d.data()?.session||null):null;
    }catch(e){ console.error("Session read failed:",e); }
    return sessionCache;
}

async function setSession(user){
    const db=getDB(),auth=getAuth();
    if(!db || !auth?.currentUser) throw new Error("Firebase Authentication is not ready.");
    const session={userId:user.id,username:user.username,name:user.name,role:user.role,permissions:user.permissions||[],loginAt:new Date().toISOString()};
    await db.collection(SESSION_COLLECTION).doc(auth.currentUser.uid).set({session,updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
    sessionCache=session;
}

async function clearSession(){
    const db=getDB(),auth=getAuth();
    if(db&&auth?.currentUser) await db.collection(SESSION_COLLECTION).doc(auth.currentUser.uid).delete().catch(()=>{});
    sessionCache=null;
}

async function getCurrentUser(){
    const auth=getAuth();
    if(!auth?.currentUser || auth.currentUser.isAnonymous) return null;
    const session=await getSession();
    if(!session?.userId) return null;
    let user=usersCache.find(u=>String(u.id)===String(session.userId));
    if(!user) user=await loadOwnUser(auth.currentUser.uid);
    if(!user || user.active===false){ await clearSession(); return null; }
    return user;
}

async function hasPermission(p){const u=await getCurrentUser();return !!u&&(u.role==="Admin"||(u.permissions||[]).includes(p));}
async function canAccessPage(p){return !!PAGE_PERMISSIONS[p]&&await hasPermission(PAGE_PERMISSIONS[p]);}
function getDefaultPermissions(role){return [...(DEFAULT_ROLE_PERMISSIONS[role]||DEFAULT_ROLE_PERMISSIONS.Staff)];}

async function navigateAfterLogin(){
    const u=await getCurrentUser(); if(!u){location.href="login.html";return;}
    for(const p of ["dashboard","billing","bills","menu","inventory","reports","staff","settings"])
        if(await canAccessPage(p)){location.href=`${p}.html`;return;}
    location.href="billing.html";
}

async function logout(){await clearSession();try{await getAuth()?.signOut();}catch{}location.href="login.html";}

async function guardCurrentPage(){
    const page=document.body?.dataset?.page||""; if(!page||page==="login") return true;
    const u=await getCurrentUser();
    if(!u){location.href=`login.html?redirect=${encodeURIComponent(`${page}.html`)}`;return false;}
    if(!await canAccessPage(page)){alert("You do not have permission to access this page.");await navigateAfterLogin();return false;}
    return true;
}

async function applyAccessControl(){
    const u=await getCurrentUser(); if(!u)return;
    for(const b of document.querySelectorAll(".nav-item[data-page]")) b.style.display=await canAccessPage(b.dataset.page)?"flex":"none";
    for(const e of document.querySelectorAll("[data-permission]")) e.style.display=await hasPermission(e.dataset.permission)?"":"none";
    const n=document.getElementById("currentUserName"),r=document.getElementById("currentUserRole");
    if(n)n.textContent=u.name||u.username;if(r)r.textContent=u.role||"Staff";
}

function createUserRecord({id,name,username,email="",mobile="",role="Staff",permissions=[],firebaseUid}){
    return {id:id||`USR-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
        name:String(name||"").trim(),username:normalizeUsername(username),email:String(email||"").trim().toLowerCase(),
        mobile:normalizeMobile(mobile),role,permissions:[...new Set(permissions)],firebaseUid,active:true,
        createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
}

async function createFirebaseUser({name,username,email,mobile,password,role="Admin"}){
    const auth=getAuth(),db=getDB();
    if(!auth||!db)throw new Error("Firebase Authentication is not ready.");
    if(!email) throw new Error("A real email address is required for password recovery.");
    const credential=await auth.createUserWithEmailAndPassword(email,password);
    const user=createUserRecord({id:role==="Admin"?ADMIN_ID:`USR-${credential.user.uid}`,name,username,email,mobile,role,permissions:getDefaultPermissions(role),firebaseUid:credential.user.uid});
    await saveUser(user); await setSession(user); return user;
}

async function createStaffFirebaseUser({name,username,email,mobile,password,role,permissions}){
    if(!email) throw new Error("Staff login requires an email address so password recovery can work.");
    const cfg=window.firebaseConfig;
    const secondaryName="sriStaffCreator";
    let app=firebase.apps.find(a=>a.name===secondaryName);
    if(!app) app=firebase.initializeApp(cfg,secondaryName);
    const secondaryAuth=app.auth();
    try{
        const credential=await secondaryAuth.createUserWithEmailAndPassword(email,password);
        const user=createUserRecord({id:`USR-${credential.user.uid}`,name,username,email,mobile,role,permissions,firebaseUid:credential.user.uid});
        await saveUser(user);
        await secondaryAuth.signOut();
        return user;
    }catch(e){try{await secondaryAuth.signOut();}catch{} throw e;}
}

async function signInFirebaseUser(username,password){
    const auth=getAuth(),db=getDB(); if(!auth||!db)throw new Error("Firebase Authentication is not ready.");
    const key=normalizeUsername(username);
    const index=await db.collection(LOGIN_INDEX_COLLECTION).doc(key).get();
    if(!index.exists) throw Object.assign(new Error("Invalid User ID or password."),{code:"auth/invalid-credential"});
    const info=index.data()||{};
    if(info.active===false) throw Object.assign(new Error("This account is disabled."),{code:"auth/user-disabled"});
    const credential=await auth.signInWithEmailAndPassword(info.email,password);
    const user=await loadOwnUser(credential.user.uid);
    if(!user || user.active===false){await auth.signOut();throw new Error("Your Firebase account exists, but no active POS profile was found.");}
    usersCache=[...usersCache.filter(u=>String(u.id)!==String(user.id)),user];
    await setSession(user); return user;
}

async function sendPasswordResetForUser(user){
    const auth=getAuth();
    if(!auth||!user?.email) throw new Error("This account has no recovery email address.");
    await auth.sendPasswordResetEmail(user.email);
}

async function sendAdminPasswordReset(identifier){
    const users=await loadUsers();
    const raw=String(identifier||"").trim().toLowerCase();
    const mobile=normalizeMobile(raw);
    const user=users.find(u=>u.role==="Admin" && ((u.email||"").toLowerCase()===raw || (u.mobile||"")===mobile));
    if(!user) throw new Error("No Admin account was found for that email or mobile number.");
    if(!user.email) throw new Error("This Admin account does not have a recovery email.");
    await sendPasswordResetForUser(user);
    return user;
}

async function adminResetStaffPassword(userId,newPassword){
    if(!(await hasPermission("users.manage"))) throw new Error("Only an Admin can reset staff passwords.");
    if(String(newPassword||"").length<6) throw new Error("Password must contain at least 6 characters.");
    const functions=firebase.functions?.();
    if(!functions) throw new Error("Firebase Functions SDK is not loaded.");
    const call=functions.httpsCallable("adminResetStaffPassword");
    const result=await call({userId,newPassword});
    return result.data||{};
}

async function recoverAdminByPhoneStart(phone){
    const auth=getAuth(); if(!auth) throw new Error("Firebase Authentication is not ready.");
    const normalized=normalizeMobile(phone); if(!normalized) throw new Error("Enter a valid mobile number.");
    const users=await loadUsers();
    const admin=users.find(u=>u.role==="Admin" && u.mobile===normalized);
    if(!admin) throw new Error("No Admin account is registered with this mobile number.");
    if(!window.recaptchaVerifier){
        window.recaptchaVerifier=new firebase.auth.RecaptchaVerifier("recaptcha-container",{size:"invisible"});
    }
    window.phoneConfirmation=await auth.signInWithPhoneNumber(normalized,window.recaptchaVerifier);
    return admin;
}

async function recoverAdminByPhoneVerify(code,newPassword){
    if(!window.phoneConfirmation) throw new Error("Request the OTP first.");
    if(String(newPassword||"").length<6) throw new Error("Password must contain at least 6 characters.");
    const credential=await window.phoneConfirmation.confirm(String(code||"").trim());
    const functions=firebase.functions?.(); if(!functions) throw new Error("Firebase Functions SDK is not loaded.");
    const call=functions.httpsCallable("resetAdminPasswordByVerifiedPhone");
    const result=await call({newPassword});
    try{await getAuth()?.signOut();}catch{}
    window.phoneConfirmation=null;
    return result.data||{};
}

async function changeCurrentUserPassword(currentPassword,newPassword){
    const auth=getAuth(), current=auth?.currentUser;
    if(!current || current.isAnonymous) return {ok:false,message:"Sign in first."};
    if(String(newPassword||"").length<6) return {ok:false,message:"Password must contain at least 6 characters."};
    try{
        const credential=firebase.auth.EmailAuthProvider.credential(current.email,currentPassword);
        await current.reauthenticateWithCredential(credential);
        await current.updatePassword(newPassword);
        return {ok:true};
    }catch(e){return {ok:false,message:e?.code==="auth/wrong-password"?"Current password is incorrect.":(e?.message||"Unable to change password.")};}
}

async function updatePassword(newPassword){
    const current=getAuth()?.currentUser;
    if(!current || current.isAnonymous) throw new Error("Sign in first.");
    if(String(newPassword||"").length<6) throw new Error("Password must contain at least 6 characters.");
    await current.updatePassword(newPassword);
}

window.authGetUsers=()=>usersCache;
window.authLoadUsers=loadUsers;
window.authSaveUsers=async users=>{for(const u of users)await saveUser(u);};
window.authGetSession=getSession;window.authSetSession=setSession;window.authClearSession=clearSession;
window.getCurrentUser=getCurrentUser;window.hasPermission=hasPermission;window.canAccessPage=canAccessPage;
window.getDefaultPermissions=getDefaultPermissions;window.navigateAfterLogin=navigateAfterLogin;window.logout=logout;
window.guardCurrentPage=guardCurrentPage;window.applyAccessControl=applyAccessControl;
window.createUserRecord=createUserRecord;window.createFirebaseUser=createFirebaseUser;window.createStaffFirebaseUser=createStaffFirebaseUser;
window.signInFirebaseUser=signInFirebaseUser;window.updatePassword=updatePassword;window.changeCurrentUserPassword=changeCurrentUserPassword;window.sendAdminPasswordReset=sendAdminPasswordReset;
window.adminResetStaffPassword=adminResetStaffPassword;window.recoverAdminByPhoneStart=recoverAdminByPhoneStart;
window.recoverAdminByPhoneVerify=recoverAdminByPhoneVerify;window.normalizeMobile=normalizeMobile;
window.DEFAULT_ROLE_PERMISSIONS=DEFAULT_ROLE_PERMISSIONS;

document.addEventListener("DOMContentLoaded",async()=>{
    if(document.body?.dataset?.page!=="login") if(await guardCurrentPage()) await applyAccessControl();
});
