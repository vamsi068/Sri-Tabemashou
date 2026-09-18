/* Sri Tabemashou POS - common.js */

const defaultMenu = [

    {
        id: 1,
        name: "Chicken 65",
        category: "Starters",
        price: 220,
        type: "Non-Veg",
        icon: "🍗",
        status: "Available"
    },

    {
        id: 2,
        name: "Chicken Manchurian",
        category: "Starters",
        price: 220,
        type: "Non-Veg",
        icon: "🍗",
        status: "Available"
    },

    {
        id: 3,
        name: "Chilli Chicken",
        category: "Starters",
        price: 220,
        type: "Non-Veg",
        icon: "🌶️",
        status: "Available"
    },

    {
        id: 4,
        name: "Chilli Paneer",
        category: "Starters",
        price: 190,
        type: "Veg",
        icon: "🥘",
        status: "Available"
    },

    {
        id: 5,
        name: "Veg Fried Rice",
        category: "Fried Rice",
        price: 130,
        type: "Veg",
        icon: "🍚",
        status: "Available"
    },

    {
        id: 6,
        name: "Chicken Fried Rice",
        category: "Fried Rice",
        price: 160,
        type: "Non-Veg",
        icon: "🍗",
        status: "Available"
    },

    {
        id: 7,
        name: "Paneer Fried Rice",
        category: "Fried Rice",
        price: 150,
        type: "Veg",
        icon: "🍚",
        status: "Available"
    },

    {
        id: 8,
        name: "Prawn Fried Rice",
        category: "Fried Rice",
        price: 200,
        type: "Non-Veg",
        icon: "🦐",
        status: "Available"
    },

    {
        id: 9,
        name: "Veg Noodles",
        category: "Noodles",
        price: 130,
        type: "Veg",
        icon: "🍜",
        status: "Available"
    },

    {
        id: 10,
        name: "Chicken Noodles",
        category: "Noodles",
        price: 160,
        type: "Non-Veg",
        icon: "🍜",
        status: "Available"
    },

    {
        id: 11,
        name: "Paneer Noodles",
        category: "Noodles",
        price: 150,
        type: "Veg",
        icon: "🍜",
        status: "Available"
    },

    {
        id: 12,
        name: "Chicken Biryani",
        category: "Biryani",
        price: 180,
        type: "Non-Veg",
        icon: "🍛",
        status: "Available"
    },

    {
        id: 13,
        name: "Mutton Biryani",
        category: "Biryani",
        price: 240,
        type: "Non-Veg",
        icon: "🍛",
        status: "Available"
    },

    {
        id: 14,
        name: "Veg Biryani",
        category: "Biryani",
        price: 150,
        type: "Veg",
        icon: "🍛",
        status: "Available"
    },

    {
        id: 15,
        name: "Veg Momos",
        category: "Momos",
        price: 120,
        type: "Veg",
        icon: "🥟",
        status: "Available"
    },

    {
        id: 16,
        name: "Chicken Momos",
        category: "Momos",
        price: 150,
        type: "Non-Veg",
        icon: "🥟",
        status: "Available"
    },

    {
        id: 17,
        name: "Mojito",
        category: "Beverages",
        price: 100,
        type: "Veg",
        icon: "🍹",
        status: "Available"
    },

    {
        id: 18,
        name: "Thick Shake",
        category: "Beverages",
        price: 150,
        type: "Veg",
        icon: "🥤",
        status: "Available"
    },

    {
        id: 19,
        name: "Fresh Lime Soda",
        category: "Beverages",
        price: 70,
        type: "Veg",
        icon: "🍋",
        status: "Available"
    },

    {
        id: 20,
        name: "Ice Cream",
        category: "Desserts",
        price: 80,
        type: "Veg",
        icon: "🍨",
        status: "Available"
    },

    {
        id: 21,
        name: "Falooda",
        category: "Desserts",
        price: 160,
        type: "Veg",
        icon: "🍧",
        status: "Available"
    }

];
let menuItems =
    JSON.parse(firebaseStore.getItem("sriTabemashouMenu"));

if (!menuItems || !Array.isArray(menuItems) || menuItems.length === 0) {
    menuItems = JSON.parse(JSON.stringify(defaultMenu));
} else {
    menuItems = menuItems.map((item, index) => ({
        ...item,
        id: Number.isFinite(Number(item.id)) ? Number(item.id) : index + 1
    }));
}

saveMenuToStorage();

function saveMenuToStorage() {
    // Keep menu IDs consistently numeric so Edit/Delete/Toggle actions work
    // after saving and restoring data.
    menuItems = menuItems.map((item, index) => ({
        ...item,
        id: Number.isFinite(Number(item.id)) ? Number(item.id) : index + 1
    }));
    firebaseStore.setItem("sriTabemashouMenu", JSON.stringify(menuItems));
}

function getRestaurantLogo() {
    try {
        const settings = JSON.parse(firebaseStore.getItem("sriTabemashouSettings") || "{}");
        return settings?.restaurant?.logo || "";
    } catch (error) {
        return "";
    }
}

function applyRestaurantBranding() {
    let settings = {};
    try {
        settings = JSON.parse(firebaseStore.getItem("sriTabemashouSettings") || "{}");
    } catch (error) {}

    const name = settings?.restaurant?.name || "Sri Tabemashou";
    const logo = settings?.restaurant?.logo || "";

    document.querySelectorAll(".brand-logo").forEach(el => {
        el.innerHTML = logo
            ? `<img src="${escapeHTML(logo)}" alt="Restaurant Logo">`
            : "श्री";
    });

    document.querySelectorAll(".brand h2").forEach(el => {
        el.textContent = name;
    });

    document.querySelectorAll("[data-restaurant-name]").forEach(el => {
        el.textContent = name;
    });
}

document.addEventListener("DOMContentLoaded", applyRestaurantBranding);

function updateDate() {
    const now = new Date();
    const date = now.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
    const element = document.getElementById("currentDate");
    if (element) element.textContent = date;
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeJS(value) {
    return String(value ?? "")
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, '\"')
        .replace(/\r/g, "\\r")
        .replace(/\n/g, "\\n");
}


function getSavedBills() {
    return JSON.parse(firebaseStore.getItem("sriTabemashouBills")) || [];
}

function navigateTo(page) {
    if (typeof canAccessPage === "function" && !canAccessPage(page)) {
        alert("You do not have permission to access this page.");
        return;
    }
    window.location.href = `${page}.html`;
}

function getLocalDateString(date = new Date()) {
    const d = date instanceof Date ? date : new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/* Backward-compatible page API used by the original single-page modules.
   On the split version it navigates to the requested page when needed. */
function showPage(page, clickedButton) {
    const currentPage = document.body?.dataset?.page || "";

    if (page !== currentPage) {
        navigateTo(page);
        return;
    }

    document.querySelectorAll(".page").forEach(p => p.classList.remove("active-page"));
    const selectedPage = document.getElementById(`${page}Page`);
    if (selectedPage) selectedPage.classList.add("active-page");

    document.querySelectorAll(".nav-item").forEach(button => button.classList.remove("active"));
    if (clickedButton) {
        clickedButton.classList.add("active");
    } else {
        const activeButton = document.querySelector(`.nav-item[data-page="${page}"]`);
        if (activeButton) activeButton.classList.add("active");
    }
}

/* Billing-only functions are not loaded on the Menu page, but the original
   menu module calls them after saving/deleting items. Safe no-op fallbacks
   keep the original module flow without duplicating billing code. */
function createCategories() {}
function displayMenu() {}
function renderCart() {}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".nav-item[data-page]").forEach(btn => {
        if (btn.dataset.page === document.body.dataset.page) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });

    updateDate();
    if (typeof applyAccessControl === "function") {
        applyAccessControl();
    }
});

/* =====================================================
   AUDIT LOG
===================================================== */
function addAuditLog(action, details = "") {
    try {
        const key = "sriTabemashouAuditLog";
        const logs = JSON.parse(firebaseStore.getItem(key) || "[]");
        const user = typeof getCurrentUser === "function" ? getCurrentUser() : null;
        logs.push({
            id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
            date: new Date().toISOString(),
            userId: user?.id || "",
            user: user?.name || user?.username || "System",
            role: user?.role || "System",
            action: String(action || ""),
            details: String(details || "")
        });
        firebaseStore.setItem(key, JSON.stringify(logs.slice(-2000)));
    } catch (e) {
        console.warn("Audit log could not be saved:", e);
    }
}
function getAuditLogs(){ try { const v=JSON.parse(firebaseStore.getItem("sriTabemashouAuditLog")||"[]"); return Array.isArray(v)?v:[]; } catch { return []; } }
window.addAuditLog = addAuditLog;
window.getAuditLogs = getAuditLogs;

/* =====================================================
   SMALL UX HELPERS
===================================================== */
function showPOSToast(message, type = "success") {
    let host = document.getElementById("posToastHost");
    if (!host) {
        host = document.createElement("div");
        host.id = "posToastHost";
        host.className = "pos-toast-host";
        document.body.appendChild(host);
    }
    const toast = document.createElement("div");
    toast.className = `pos-toast pos-toast-${type}`;
    toast.innerHTML = `<span>${type === "success" ? "✓" : type === "error" ? "!" : "i"}</span><strong>${escapeHTML(String(message))}</strong>`;
    host.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => { toast.classList.remove("show"); setTimeout(() => toast.remove(), 220); }, 2600);
}
window.showPOSToast = showPOSToast;

function updatePOSClock() {
    const now = new Date();
    const time = now.toLocaleTimeString("en-IN", {hour:"2-digit", minute:"2-digit"});
    const date = now.toLocaleDateString("en-IN", {day:"2-digit", month:"short", year:"numeric"});
    document.querySelectorAll(".pos-live-clock").forEach(el => el.textContent = `${date} • ${time}`);
}

document.addEventListener("DOMContentLoaded", () => {
    updatePOSClock();
    setInterval(updatePOSClock, 30000);
    document.querySelectorAll(".topbar").forEach(bar => {
        if (!bar.querySelector(".pos-live-clock")) {
            const clock = document.createElement("div");
            clock.className = "pos-live-clock";
            bar.appendChild(clock);
        }
    });
});
