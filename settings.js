/* Sri Tabemashou POS - settings.js */
const defaultPOSSettings = {

    restaurant: {

        name: "Sri Tabemashou",

        phone: "",

        email: "",

        address: "",

        gstin: "",

        fssai: "",

        logo: ""

    },


    billing: {

        billPrefix: "ST",

        startingBill: 1,

        defaultOrderType: "Dine In",

        defaultPayment: "Cash",

        autoPrint: false,

        showCustomer: true,

        showTable: true

    },


    tax: {

        gstEnabled: "yes",

        cgst: 2.5,

        sgst: 2.5,

        igst: 5

    },


    receipt: {
        header: "Welcome to Sri Tabemashou",
        footer: "Thank you! Visit again.",
        paperWidth: "80"
    },

    expenses: {
        rent: 0,
        electricity: 0,
        gas: 0,
        water: 0,
        internet: 0,
        other: 0
    }

};


/* ---------------------------------------------------------
   GET SETTINGS
--------------------------------------------------------- */

function getPOSSettings() {

    try {

        const saved =
            firebaseStore.getItem(
                "sriTabemashouSettings"
            );


        if (!saved) {

            return defaultPOSSettings;

        }


        const parsed =
            JSON.parse(saved);


        return {

            ...defaultPOSSettings,

            ...parsed,

            restaurant: {
                ...defaultPOSSettings.restaurant,
                ...(parsed.restaurant || {})
            },

            billing: {
                ...defaultPOSSettings.billing,
                ...(parsed.billing || {})
            },

            tax: {
                ...defaultPOSSettings.tax,
                ...(parsed.tax || {})
            },

            receipt: {
                ...defaultPOSSettings.receipt,
                ...(parsed.receipt || {})
            },

            expenses: {
                ...defaultPOSSettings.expenses,
                ...(parsed.expenses || {})
            }

        };

    }

    catch (error) {

        console.error(
            "Unable to load settings:",
            error
        );

        return defaultPOSSettings;

    }

}


/* ---------------------------------------------------------
   SAVE SETTINGS
--------------------------------------------------------- */

function savePOSSettings(settings) {

    firebaseStore.setItem(
        "sriTabemashouSettings",
        JSON.stringify(settings)
    );

    if (typeof window.syncSettingsToFirebase === "function") {
        window.syncSettingsToFirebase(settings);
    }

}


/* ---------------------------------------------------------
   OPEN SETTINGS TAB
--------------------------------------------------------- */

function openSettingsTab(tab, button) {

    document
        .querySelectorAll(".settings-tab")
        .forEach(item => {

            item.classList.remove("active");

        });


    document
        .querySelectorAll(".settings-section")
        .forEach(section => {

            section.classList.remove("active");

        });


    if (button) {

        button.classList.add("active");

    }


    const section =
        document.getElementById(
            "settings" +
            tab.charAt(0).toUpperCase() +
            tab.slice(1)
        );


    if (section) {

        section.classList.add("active");

    }


    loadSettingsIntoForm();

}


/* ---------------------------------------------------------
   LOAD SETTINGS INTO FORM
--------------------------------------------------------- */

function loadSettingsIntoForm() {

    const settings =
        getPOSSettings();


    /* RESTAURANT */

    setInputValue(
        "settingRestaurantName",
        settings.restaurant.name
    );

    setInputValue(
        "settingRestaurantPhone",
        settings.restaurant.phone
    );

    setInputValue(
        "settingRestaurantEmail",
        settings.restaurant.email
    );

    setInputValue(
        "settingRestaurantAddress",
        settings.restaurant.address
    );

    setInputValue(
        "settingGSTIN",
        settings.restaurant.gstin
    );

    setInputValue(
        "settingFSSAI",
        settings.restaurant.fssai
    );

    pendingRestaurantLogo = settings.restaurant.logo || "";
    updateLogoPreview(pendingRestaurantLogo);


    /* BILLING */

    setInputValue(
        "settingBillPrefix",
        settings.billing.billPrefix
    );

    setInputValue(
        "settingStartingBill",
        settings.billing.startingBill
    );

    setInputValue(
        "settingDefaultOrderType",
        settings.billing.defaultOrderType
    );

    setInputValue(
        "settingDefaultPayment",
        settings.billing.defaultPayment
    );


    setCheckboxValue(
        "settingAutoPrint",
        settings.billing.autoPrint
    );

    setCheckboxValue(
        "settingShowCustomer",
        settings.billing.showCustomer
    );

    setCheckboxValue(
        "settingShowTable",
        settings.billing.showTable
    );


    /* TAX */

    setInputValue(
        "settingGSTEnabled",
        settings.tax.gstEnabled
    );

    setInputValue(
        "settingCGST",
        settings.tax.cgst
    );

    setInputValue(
        "settingSGST",
        settings.tax.sgst
    );

    setInputValue(
        "settingIGST",
        settings.tax.igst
    );


    /* RECEIPT */

    setInputValue(
        "settingReceiptHeader",
        settings.receipt.header
    );

    setInputValue(
        "settingReceiptFooter",
        settings.receipt.footer
    );

    setInputValue(
        "settingPaperWidth",
        settings.receipt.paperWidth
    );

    loadExpenseSettings();

}


/* ---------------------------------------------------------
   INPUT HELPERS
--------------------------------------------------------- */

function setInputValue(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.value =
            value ?? "";

    }

}

function setCheckboxValue(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.checked =
            Boolean(value);

    }

}


let pendingRestaurantLogo = "";

function updateLogoPreview(src) {
    const box = document.getElementById("restaurantLogoPreview");
    if (!box) return;
    box.innerHTML = src
        ? `<img src="${escapeHTML(src)}" alt="Restaurant Logo Preview">`
        : "श्री";
}

function handleLogoFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
        alert("Please select an image file.");
        event.target.value = "";
        return;
    }
    compressImageToDataURL(file).then(dataUrl => {
        pendingRestaurantLogo = dataUrl;
        updateLogoPreview(dataUrl);
    }).catch(() => alert("Could not process that image."));
}

function saveRestaurantLogoOnly() {
    const input = document.getElementById("settingRestaurantLogo");
    if (!input || !input.files?.[0]) {
        alert("Please select a logo image first.");
        return;
    }
    compressImageToDataURL(input.files[0]).then(dataUrl => {
        const settings = getPOSSettings();
        settings.restaurant.logo = dataUrl;
        pendingRestaurantLogo = dataUrl;
        savePOSSettings(settings);
        updateLogoPreview(dataUrl);
        if (typeof applyRestaurantBranding === "function") applyRestaurantBranding();
        alert("Restaurant logo saved successfully.");
    }).catch(() => alert("Could not process that image."));
}
function compressImageToDataURL(file, maxDim = 300, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        reader.onload = () => {
            img.onload = () => {
                let { width, height } = img;
                if (width > maxDim || height > maxDim) {
                    const scale = maxDim / Math.max(width, height);
                    width = Math.round(width * scale);
                    height = Math.round(height * scale);
                }
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                canvas.getContext("2d").drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL("image/jpeg", quality)); // ~10-60KB typically
            };
            img.onerror = reject;
            img.src = reader.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
function removeRestaurantLogo() {
    const settings = getPOSSettings();
    settings.restaurant.logo = "";
    pendingRestaurantLogo = "";
    savePOSSettings(settings);
    const input = document.getElementById("settingRestaurantLogo");
    if (input) input.value = "";
    updateLogoPreview("");
    if (typeof applyRestaurantBranding === "function") applyRestaurantBranding();
    alert("Restaurant logo removed.");
}

// function saveRestaurantLogoOnly() {
//     const input = document.getElementById("settingRestaurantLogo");
//     if (!input || !input.files?.[0]) {
//         alert("Please select a logo image first.");
//         return;
//     }
//     const file = input.files[0];
//     const reader = new FileReader();
//     reader.onload = () => {
//         const settings = getPOSSettings();
//         settings.restaurant.logo = reader.result;
//         pendingRestaurantLogo = reader.result;
//         savePOSSettings(settings);
//         updateLogoPreview(reader.result);
//         if (typeof applyRestaurantBranding === "function") applyRestaurantBranding();
//         alert("Restaurant logo saved successfully.");
//     };
//     reader.readAsDataURL(file);
// }

/* ---------------------------------------------------------
   SAVE RESTAURANT SETTINGS
--------------------------------------------------------- */

function saveRestaurantSettings() {

    const settings =
        getPOSSettings();


    settings.restaurant = {

        name:
            getInputValue(
                "settingRestaurantName"
            ) || "Sri Tabemashou",

        phone:
            getInputValue(
                "settingRestaurantPhone"
            ),

        email:
            getInputValue(
                "settingRestaurantEmail"
            ),

        address:
            getInputValue(
                "settingRestaurantAddress"
            ),

        gstin:
            getInputValue(
                "settingGSTIN"
            ),

        fssai:
            getInputValue(
                "settingFSSAI"
            ),

        logo: pendingRestaurantLogo || settings.restaurant.logo || ""

    };


    savePOSSettings(settings);


    alert(
        "Restaurant settings saved successfully."
    );

}


/* ---------------------------------------------------------
   SAVE BILLING SETTINGS
--------------------------------------------------------- */

function saveBillingSettings() {

    const settings =
        getPOSSettings();


    settings.billing = {

        billPrefix:
            getInputValue(
                "settingBillPrefix"
            ) || "ST",

        startingBill:
            Number(
                getInputValue(
                    "settingStartingBill"
                )
            ) || 1,

        defaultOrderType:
            getInputValue(
                "settingDefaultOrderType"
            ) || "Dine In",

        defaultPayment:
            getInputValue(
                "settingDefaultPayment"
            ) || "Cash",

        autoPrint:
            getCheckboxValue(
                "settingAutoPrint"
            ),

        showCustomer:
            getCheckboxValue(
                "settingShowCustomer"
            ),

        showTable:
            getCheckboxValue(
                "settingShowTable"
            )

    };


    savePOSSettings(settings);


    alert(
        "Billing settings saved successfully."
    );

}


/* ---------------------------------------------------------
   SAVE TAX SETTINGS
--------------------------------------------------------- */

function saveTaxSettings() {

    const settings =
        getPOSSettings();


    settings.tax = {

        gstEnabled:
            getInputValue(
                "settingGSTEnabled"
            ),

        cgst:
            Number(
                getInputValue(
                    "settingCGST"
                )
            ) || 0,

        sgst:
            Number(
                getInputValue(
                    "settingSGST"
                )
            ) || 0,

        igst:
            Number(
                getInputValue(
                    "settingIGST"
                )
            ) || 0

    };


    savePOSSettings(settings);


    alert(
        "Tax settings saved successfully."
    );

}


/* ---------------------------------------------------------
   SAVE RECEIPT SETTINGS
--------------------------------------------------------- */

function saveReceiptSettings() {

    const settings =
        getPOSSettings();


    settings.receipt = {

        header:
            getInputValue(
                "settingReceiptHeader"
            ),

        footer:
            getInputValue(
                "settingReceiptFooter"
            ),

        paperWidth:
            getInputValue(
                "settingPaperWidth"
            ) || "80"

    };


    savePOSSettings(settings);


    alert(
        "Receipt settings saved successfully."
    );

}


/* ---------------------------------------------------------
   INPUT GETTERS
--------------------------------------------------------- */

function getInputValue(id) {

    const element =
        document.getElementById(id);


    return element
        ? element.value
        : "";

}

function getCheckboxValue(id) {

    const element =
        document.getElementById(id);


    return element
        ? element.checked
        : false;

}


/* =========================================================
   BACKUP
========================================================= */


/* ---------------------------------------------------------
   CREATE COMPLETE BACKUP
--------------------------------------------------------- */

function createPOSBackup() {

    return {

        app: "Sri Tabemashou POS",

        version: "1.0",

        backupDate:
            new Date().toISOString(),


        menu:
            JSON.parse(
                firebaseStore.getItem(
                    "sriTabemashouMenu"
                ) || "[]"
            ),


        bills:
            JSON.parse(
                firebaseStore.getItem(
                    "sriTabemashouBills"
                ) || "[]"
            ),


        billCounter:
            firebaseStore.getItem(
                "sriTabemashouBillCounter"
            ) || "0",


        settings: getPOSSettings(),
        inventory: JSON.parse(firebaseStore.getItem("inventory") || "{}"),
        inventoryLedger: JSON.parse(firebaseStore.getItem("sriTabemashouInventoryLedger") || "[]"),
        purchases: JSON.parse(firebaseStore.getItem("sriTabemashouPurchases") || "[]"),
        staff: JSON.parse(firebaseStore.getItem("sriTabemashouStaff") || "[]"),
        staffAttendance: JSON.parse(firebaseStore.getItem("sriTabemashouStaffAttendance") || "[]"),
        salaryPayments: JSON.parse(firebaseStore.getItem("sriTabemashouStaffSalaryPayments") || "[]"),
        users: JSON.parse(firebaseStore.getItem("sriTabemashouUsers") || "[]"),
        auditLog: JSON.parse(firebaseStore.getItem("sriTabemashouAuditLog") || "[]")

    };

}


/* ---------------------------------------------------------
   DOWNLOAD BACKUP
--------------------------------------------------------- */

function backupPOSData() {

    const backup =
        createPOSBackup();


    const json =
        JSON.stringify(
            backup,
            null,
            2
        );


    const blob =
        new Blob(
            [json],
            {
                type:
                    "application/json;charset=utf-8"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    const date =
        getLocalDateString(
            new Date()
        );


    link.href = url;


    link.download =
        `Sri-Tabemashou-POS-Backup-${date}.json`;


    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);


    URL.revokeObjectURL(url);


    alert(
        "Backup downloaded successfully."
    );

}


/* =========================================================
   RESTORE
========================================================= */


/* ---------------------------------------------------------
   RESTORE POS DATA
--------------------------------------------------------- */

function restorePOSData(event) {

    const file =
        event.target.files[0];


    if (!file) {

        return;

    }


    const reader =
        new FileReader();


    reader.onload =
        function(e) {

            try {

                const backup =
                    JSON.parse(
                        e.target.result
                    );


                if (
                    !backup ||
                    backup.app !==
                    "Sri Tabemashou POS"
                ) {

                    alert(
                        "This is not a valid Sri Tabemashou POS backup."
                    );

                    return;

                }


                const confirmed =
                    confirm(
                        "Restoring this backup will replace the current POS data. Continue?"
                    );


                if (!confirmed) {

                    return;

                }


                /* MENU */

                if (
                    Array.isArray(
                        backup.menu
                    )
                ) {

                    firebaseStore.setItem(
                        "sriTabemashouMenu",
                        JSON.stringify(
                            backup.menu
                        )
                    );

                }


                /* BILLS */

                if (
                    Array.isArray(
                        backup.bills
                    )
                ) {

                    firebaseStore.setItem(
                        "sriTabemashouBills",
                        JSON.stringify(
                            backup.bills
                        )
                    );

                }


                /* BILL COUNTER */

                if (
                    backup.billCounter !==
                    undefined
                ) {

                    firebaseStore.setItem(
                        "sriTabemashouBillCounter",
                        String(
                            backup.billCounter
                        )
                    );

                }


                /* INVENTORY / PURCHASES / STAFF / USERS */
                const restoreMap = {
                    inventory: "inventory",
                    inventoryLedger: "sriTabemashouInventoryLedger",
                    purchases: "sriTabemashouPurchases",
                    staff: "sriTabemashouStaff",
                    staffAttendance: "sriTabemashouStaffAttendance",
                    salaryPayments: "sriTabemashouStaffSalaryPayments",
                    users: "sriTabemashouUsers",
                    auditLog: "sriTabemashouAuditLog"
                };
                Object.entries(restoreMap).forEach(([source, key]) => {
                    if (backup[source] !== undefined) firebaseStore.setItem(key, JSON.stringify(backup[source]));
                });


                /* SETTINGS */

                if (
                    backup.settings
                ) {

                    savePOSSettings(
                        backup.settings
                    );

                }


                alert(
                    "Backup restored successfully. The page will now reload."
                );


                window.location.reload();

            }

            catch(error) {

                console.error(error);


                alert(
                    "Unable to restore backup. The file may be damaged or invalid."
                );

            }

        };


    reader.readAsText(file);


    event.target.value = "";

}


/* =========================================================
   RESET POS
========================================================= */

function resetPOSData() {

    const firstConfirm =
        confirm(
            "WARNING: This will delete all bills, menu data and settings. Continue?"
        );


    if (!firstConfirm) {

        return;

    }


    const secondConfirm =
        confirm(
            "Are you absolutely sure? This action cannot be undone unless you have a backup."
        );


    if (!secondConfirm) {

        return;

    }


    firebaseStore.removeItem(
        "sriTabemashouMenu"
    );


    firebaseStore.removeItem(
        "sriTabemashouBills"
    );


    firebaseStore.removeItem(
        "sriTabemashouBillCounter"
    );


    firebaseStore.removeItem(
        "sriTabemashouSettings"
    );

    [
        "inventory",
        "sriTabemashouInventoryLedger",
        "sriTabemashouPurchases",
        "sriTabemashouStaff",
        "sriTabemashouStaffAttendance",
        "sriTabemashouStaffSalaryPayments",
        "sriTabemashouAuditLog"
    ].forEach(key => firebaseStore.removeItem(key));


    alert(
        "POS data has been reset."
    );


    window.location.reload();

}


/* =========================================================
   LOAD SETTINGS WHEN PAGE OPENS
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        loadSettingsIntoForm();

    }
);   



/* =====================================================
   STAFF MANAGEMENT
===================================================== */

let staffList = JSON.parse(
    firebaseStore.getItem("sriTabemashouStaff")
) || [];


/* =====================================================
   STAFF ELEMENTS
===================================================== */

const staffModal =
    document.getElementById("staffModal");

const staffForm =
    document.getElementById("staffForm");

const addStaffBtn =
    document.getElementById("addStaffBtn");

const closeStaffModal =
    document.getElementById("closeStaffModal");

const cancelStaffBtn =
    document.getElementById("cancelStaffBtn");

const staffTableBody =
    document.getElementById("staffTableBody");

const noStaffMessage =
    document.getElementById("noStaffMessage");

const staffSearch =
    document.getElementById("staffSearch");

const staffRoleFilter =
    document.getElementById("staffRoleFilter");

const staffStatusFilter =
    document.getElementById("staffStatusFilter");


/* =====================================================
   OPEN STAFF FORM
===================================================== */



document.addEventListener("DOMContentLoaded", () => { loadSettingsIntoForm(); });



function saveExpenseSettings(){
    const settings=getPOSSettings();
    settings.expenses={
        rent:Number(document.getElementById("settingMonthlyRent")?.value)||0,
        electricity:Number(document.getElementById("settingMonthlyElectricity")?.value)||0,
        gas:Number(document.getElementById("settingMonthlyGas")?.value)||0,
        water:Number(document.getElementById("settingMonthlyWater")?.value)||0,
        internet:Number(document.getElementById("settingMonthlyInternet")?.value)||0,
        other:Number(document.getElementById("settingMonthlyOther")?.value)||0
    };
    savePOSSettings(settings);
    if(typeof addAuditLog==='function') addAuditLog("Expense Settings Updated", "Monthly fixed expenses updated");
    alert("Expense settings saved successfully!");
}

function loadExpenseSettings(){
    const e=getPOSSettings().expenses||{};
    setInputValue("settingMonthlyRent",e.rent);setInputValue("settingMonthlyElectricity",e.electricity);setInputValue("settingMonthlyGas",e.gas);setInputValue("settingMonthlyWater",e.water);setInputValue("settingMonthlyInternet",e.internet);setInputValue("settingMonthlyOther",e.other);
}

/* =====================================================
   USERS & ACCESS MANAGEMENT
===================================================== */

async function renderAccessUsers() {
    const table = document.getElementById("accessUsersTable");
    if (!table || typeof authGetUsers !== "function") return;
    const users = authGetUsers();
    table.innerHTML = "";
    if (!users.length) {
        table.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:25px;color:#9ca3af;">No login accounts found.</td></tr>`;
        return;
    }
    users.forEach(user => {
        const pageAccess=[["Billing","billing.view"],["Bills","bills.view"],["Menu","menu.view"],["Reports","reports.view"],["Staff","staff.view"],["Settings","settings.view"]]
            .filter(([,p])=>user.role==="Admin"||(user.permissions||[]).includes(p)).map(([label])=>label).join(", ");
        const row=document.createElement("tr");
        row.innerHTML=`
            <td><strong>${escapeHTML(user.name||"")}</strong></td>
            <td>${escapeHTML(user.username||"")}</td>
            <td>${escapeHTML(user.email||user.mobile||"")}</td>
            <td>${escapeHTML(user.role||"Staff")}</td>
            <td>${escapeHTML(pageAccess||"None")}</td>
            <td><span class="staff-status ${user.active===false?"inactive":"active"}">${user.active===false?"● Inactive":"● Active"}</span></td>
            <td><div class="table-actions">
                <button class="table-action" title="Edit" onclick="editAccessUser('${escapeJS(user.id)}')">✏️</button>
                <button class="table-action" title="Reset Password" onclick="resetStaffPassword('${escapeJS(user.id)}')">🔑</button>
                <button class="table-action toggle-action" title="Enable / Disable" onclick="toggleAccessUser('${escapeJS(user.id)}')">${user.active===false?"▶️":"⏸️"}</button>
                <button class="table-action delete-action" title="Remove profile" onclick="deleteAccessUser('${escapeJS(user.id)}')">🗑️</button>
            </div></td>`;
        table.appendChild(row);
    });
}

async function openAccessUserModal(user=null) {
    if (!(await hasPermission("users.manage"))) { alert("Only the Admin can manage user access."); return; }
    const modal=document.getElementById("accessUserModal"),form=document.getElementById("accessUserForm"); if(!modal||!form)return;
    form.reset(); document.getElementById("accessUserId").value="";
    document.getElementById("accessUserModalTitle").textContent=user?"Edit Staff Login":"Add Staff Login";
    document.getElementById("accessRole").value=user?.role||"Staff";
    document.getElementById("accessStatus").value=user?.active===false?"Inactive":"Active";
    document.querySelectorAll(".access-permission").forEach(cb=>cb.checked=false);
    const permissions=user?.permissions||getDefaultPermissions("Staff");
    document.querySelectorAll(".access-permission").forEach(cb=>cb.checked=permissions.includes(cb.value)||user?.role==="Admin");
    if(user){
        document.getElementById("accessUserId").value=user.id;
        document.getElementById("accessName").value=user.name||"";
        document.getElementById("accessUsername").value=user.username||"";
        document.getElementById("accessEmail").value=user.email||"";
        document.getElementById("accessMobile").value=user.mobile||"";
        document.getElementById("accessRole").value=user.role||"Staff";
    }
    modal.classList.add("show"); modal.setAttribute("aria-hidden","false");
}

function closeAccessUserModal(){const modal=document.getElementById("accessUserModal");if(!modal)return;modal.classList.remove("show");modal.setAttribute("aria-hidden","true");}

async function saveAccessUser(event){
    event.preventDefault();
    if(!(await hasPermission("users.manage"))){alert("Only the Admin can manage user access.");return;}
    const id=document.getElementById("accessUserId").value.trim();
    const name=document.getElementById("accessName").value.trim();
    const username=document.getElementById("accessUsername").value.trim().toLowerCase();
    const email=document.getElementById("accessEmail").value.trim().toLowerCase();
    const mobile=document.getElementById("accessMobile").value.trim();
    const role=document.getElementById("accessRole").value;
    const status=document.getElementById("accessStatus").value;
    const password=document.getElementById("accessPassword").value;
    const permissions=Array.from(document.querySelectorAll(".access-permission:checked")).map(cb=>cb.value);
    if(!name||!username||!email){alert("Name, User ID and email are required for Firebase login and password recovery.");return;}
    if(!id&&password.length<6){alert("New staff password must contain at least 6 characters.");return;}
    const users=authGetUsers();
    if(users.some(u=>u.username===username&&String(u.id)!==String(id))){alert("That username is already in use.");return;}
    if(users.some(u=>String(u.email||"").toLowerCase()===email&&String(u.id)!==String(id))){alert("That email is already linked to another account.");return;}
    const normalizedMobile=normalizeMobile(mobile);
    if(normalizedMobile&&users.some(u=>String(u.mobile||"")===normalizedMobile&&String(u.id)!==String(id))){alert("That mobile number is already linked to another account.");return;}

    if(id){
        const target=users.find(u=>String(u.id)===String(id)); if(!target)return;
        const current=await getCurrentUser();
        if(String(target.id)===String(current?.id)){
            target.name=name;target.email=email;target.mobile=normalizedMobile;target.active=true;target.role="Admin";target.permissions=getDefaultPermissions("Admin");
        }else{
            target.name=name;target.username=username;target.email=email;target.mobile=normalizedMobile;target.role=role;target.active=status==="Active";target.permissions=role==="Admin"?getDefaultPermissions("Admin"):[...new Set(permissions)];
        }
        await authSaveUsers([target]);
        if(password && String(target.id)!==String(current?.id)) await adminResetStaffPassword(target.id,password);
        if(password && String(target.id)===String(current?.id)) await updatePassword(password);
        await renderAccessUsers();closeAccessUserModal();alert("User access updated successfully.");
    }else{
        try{
            const target=await createStaffFirebaseUser({name,username,email,mobile,password,role,permissions:role==="Admin"?getDefaultPermissions("Admin"):[...new Set(permissions)]});
            target.active=status==="Active";
            await authSaveUsers([target]);
            await renderAccessUsers();closeAccessUserModal();alert("Staff login created successfully. The account can use the User ID and password now.");
        }catch(e){console.error(e);alert(e?.message||"Unable to create the Firebase staff account.");}
    }
}

function editAccessUser(id){const user=authGetUsers().find(item=>String(item.id)===String(id));if(user)openAccessUserModal(user);}

async function toggleAccessUser(id){
    if(!(await hasPermission("users.manage")))return;
    const users=authGetUsers(),current=await getCurrentUser(),user=users.find(item=>String(item.id)===String(id));if(!user)return;
    if(String(user.id)===String(current?.id)){alert("You cannot disable your current Admin account.");return;}
    user.active=user.active===false;user.updatedAt=new Date().toISOString();await authSaveUsers([user]);await renderAccessUsers();
}

async function deleteAccessUser(id){
    if(!(await hasPermission("users.manage")))return;
    const current=await getCurrentUser();if(String(id)===String(current?.id)){alert("You cannot remove your current Admin account.");return;}
    const user=authGetUsers().find(item=>String(item.id)===String(id));if(!user)return;
    if(!confirm(`Remove login profile for ${user.name}? The Firebase Auth account is not deleted from the browser.`))return;
    await authSaveUsers([{...user,active:false}]);await renderAccessUsers();
}

async function resetStaffPassword(id){
    if(!(await hasPermission("users.manage"))){alert("Only the Admin can reset staff passwords.");return;}
    const user=authGetUsers().find(u=>String(u.id)===String(id));if(!user)return;
    const newPassword=prompt(`Enter a temporary password for ${user.name}:\n\nMinimum 6 characters.`);
    if(newPassword===null)return;
    if(newPassword.length<6){alert("Password must contain at least 6 characters.");return;}
    try{
        await adminResetStaffPassword(user.id,newPassword);
        alert(`Password reset successfully for ${user.name}. Give the temporary password directly to the staff member and ask them to change it after signing in.`);
    }catch(e){alert(e?.message||"Unable to reset the staff password. Deploy the Firebase Functions included with this project.");}
}

async function handleChangePassword(event) {
    event.preventDefault();
    const current = document.getElementById("currentPassword").value;
    const next = document.getElementById("newPassword").value;
    const confirm = document.getElementById("confirmNewPassword").value;
    if (next !== confirm) {
        alert("New passwords do not match.");
        return;
    }
    const result = await changeCurrentUserPassword(current, next);
    if (!result.ok) {
        alert(result.message);
        return;
    }
    document.getElementById("changePasswordForm").reset();
    if (typeof addAuditLog === "function") addAuditLog("Password Changed", "Current user's password was changed");
    alert("Password changed successfully.");
}

document.addEventListener("DOMContentLoaded", async () => {
    if (document.body?.dataset?.page === "settings" && typeof authLoadUsers === "function") {
        try { await authLoadUsers(); } catch (e) { console.error("Unable to load Firebase users:", e); }
    }
    const accessForm = document.getElementById("accessUserForm");
    if (accessForm) accessForm.addEventListener("submit", saveAccessUser);

    const changePasswordForm = document.getElementById("changePasswordForm");
    if (changePasswordForm) changePasswordForm.addEventListener("submit", handleChangePassword);

    const roleSelect = document.getElementById("accessRole");
    if (roleSelect) {
        roleSelect.addEventListener("change", () => {
            const role = roleSelect.value;
            if (role === "Admin") {
                document.querySelectorAll(".access-permission").forEach(cb => cb.checked = true);
                return;
            }
            const defaults = getDefaultPermissions(role);
            document.querySelectorAll(".access-permission").forEach(cb => {
                cb.checked = defaults.includes(cb.value);
            });
        });
    }

    if (document.body?.dataset?.page === "settings") {
        if (await hasPermission("users.manage")) await renderAccessUsers();
    }
});


function renderAuditLog(){
    const table=document.getElementById("auditLogTable");
    if(!table||typeof getAuditLogs!=="function")return;
    const logs=getAuditLogs().slice().reverse();
    table.innerHTML=logs.length?logs.slice(0,250).map(l=>`<tr><td>${new Date(l.date).toLocaleString("en-IN")}</td><td>${escapeHTML(l.user||"")}</td><td>${escapeHTML(l.role||"")}</td><td>${escapeHTML(l.action||"")}</td><td>${escapeHTML(l.details||"")}</td></tr>`).join(""):"<tr><td colspan=5 style=\"text-align:center;padding:30px;color:#999\">No audit records.</td></tr>";
}
const _openSettingsTab=openSettingsTab; openSettingsTab=function(tab,button){_openSettingsTab(tab,button); if(tab==="audit") renderAuditLog();}; window.openSettingsTab=openSettingsTab;
document.addEventListener("DOMContentLoaded",()=>setTimeout(renderAuditLog,0));
