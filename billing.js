/* Sri Tabemashou POS - billing.js */

/* =====================================================
   BILLING STATE
   These variables were originally in the monolithic script.
   They must remain available on the standalone Billing page.
===================================================== */
let cart = [];
let selectedCategory = "All";
let selectedPayment = "Cash";
let billCounter =
    parseInt(
        firebaseStore.getItem("sriTabemashouBillCounter") || "1",
        10
    ) || 1;

/* =====================================================
   TABLE-WISE PENDING ORDERS
   Each table keeps its own in-progress cart and customer
   details until the bill is completed.
===================================================== */
const TABLE_ORDERS_STORAGE_KEY = "sriTabemashouTableOrders";
const ACTIVE_TABLE_STORAGE_KEY = "sriTabemashouActiveTable";
const BILLING_TABLES = Array.from({ length: 8 }, (_, index) => ({
    key: `TABLE_${index + 1}`,
    label: `Table ${index + 1}`
}));

let currentTableKey = "NORMAL";

let isLoadingTableDraft = false;
let suppressTableDraftPersistence = false;

function getTableOrders() {
    try {
        const saved = JSON.parse(
            firebaseStore.getItem(TABLE_ORDERS_STORAGE_KEY) || "{}"
        );
        return saved && typeof saved === "object" ? saved : {};
    } catch (error) {
        console.warn("Unable to load table orders:", error);
        return {};
    }
}

function saveTableOrders(tableOrders) {
    firebaseStore.setItem(
        TABLE_ORDERS_STORAGE_KEY,
        JSON.stringify(tableOrders)
    );
}

function getTableLabel(tableKey) {
    const match = BILLING_TABLES.find(table => table.key === tableKey);
    if (match) return match.label;

    if (tableKey === "TAKEAWAY") return "Take Away";
    if (tableKey === "DELIVERY") return "Delivery";
    if (tableKey === "NORMAL") return "Normal Order";
    if (tableKey === "UNASSIGNED") return "No Table";

    if (String(tableKey).startsWith("CUSTOM:")) {
        return String(tableKey).slice(7) || "Custom";
    }

    return "No Table Selected";
}

function getTableKeyFromLabel(tableLabel) {
    const value = String(tableLabel || "").trim().toLowerCase();
    const match = BILLING_TABLES.find(
        table => table.label.toLowerCase() === value
    );
    return match ? match.key : "";
}

function getCurrentFieldsContextKey() {
    const orderType =
        document.getElementById("orderType")?.value || "Dine In";

    if (orderType === "Take Away") return "TAKEAWAY";
    if (orderType === "Delivery") return "DELIVERY";

    const tableValue =
        document.getElementById("tableNumber")?.value?.trim() || "";

    if (!tableValue) return "NORMAL";

    return (
        getTableKeyFromLabel(tableValue) ||
        `CUSTOM:${tableValue}`
    );
}

function syncActiveTableUI() {
    const label = document.getElementById("activeTableLabel");
    const currentLabel = getTableLabel(currentTableKey);

    if (label) {
        label.textContent =
            currentTableKey === "NORMAL"
                ? "Normal Order"
                : `Active: ${currentLabel}`;
    }

    document.querySelectorAll(".table-select-btn").forEach(button => {
        const key = button.dataset.tableKey;
        const tableOrders = getTableOrders();
        const draft = tableOrders[key];

        button.classList.toggle(
            "active",
            key === currentTableKey
        );

        button.classList.toggle(
            "has-items",
            Array.isArray(draft?.cart) && draft.cart.length > 0
        );

        let count = button.querySelector(".table-count");
        const itemCount = Array.isArray(draft?.cart)
            ? draft.cart.reduce(
                (sum, item) => sum + (Number(item.quantity) || 0),
                0
            )
            : 0;

        if (itemCount > 0) {
            if (!count) {
                count = document.createElement("span");
                count.className = "table-count";
                button.appendChild(count);
            }
            count.textContent = String(itemCount);
        } else if (count) {
            count.remove();
        }
    });
}

function updateActiveTableKeyFromFields() {
    const newKey = getCurrentFieldsContextKey();

    if (newKey === currentTableKey) {
        syncActiveTableUI();
        return;
    }

    currentTableKey = newKey;
    firebaseStore.setItem(
        ACTIVE_TABLE_STORAGE_KEY,
        currentTableKey
    );

    syncActiveTableUI();
}

function saveCurrentTableDraft() {
    if (isLoadingTableDraft || suppressTableDraftPersistence) return;

    const tableOrders = getTableOrders();

    const draft = {
        tableKey: currentTableKey,
        billNumber:
            document.getElementById("billNumber")?.textContent || "",
        customerName:
            document.getElementById("customerName")?.value || "",
        customerPhone:
            document.getElementById("customerPhone")?.value || "",
        orderType:
            document.getElementById("orderType")?.value || "Dine In",
        tableNumber:
            document.getElementById("tableNumber")?.value || "",
        discount:
            document.getElementById("discount")?.value || "0",
        amountReceived:
            document.getElementById("amountReceived")?.value || "",
        selectedPayment,
        cart: JSON.parse(JSON.stringify(cart))
    };

    const shouldStore =
        draft.cart.length > 0 ||
        draft.customerName ||
        draft.customerPhone ||
        Number(draft.discount) > 0 ||
        draft.amountReceived;

    // Only numbered tables have persistent pending orders.
    // A normal order is intentionally not tied to any table.
    if (currentTableKey !== "NORMAL") {
        if (shouldStore) {
            tableOrders[currentTableKey] = draft;
        } else {
            delete tableOrders[currentTableKey];
        }
        saveTableOrders(tableOrders);
    }

    saveTableOrders(tableOrders);
    syncActiveTableUI();
}

function clearCurrentTableDraft() {
    /*
     * A numbered table is AVAILABLE immediately after a completed bill.
     * Capture the key first so the deletion always targets the table that
     * was actually billed, even if the UI changes immediately afterwards.
     */
    const completedTableKey = currentTableKey;

    if (!BILLING_TABLES.some(table => table.key === completedTableKey)) {
        syncActiveTableUI();
        return;
    }

    const tableOrders = getTableOrders();

    // Remove the completed table draft completely.
    if (Object.prototype.hasOwnProperty.call(tableOrders, completedTableKey)) {
        delete tableOrders[completedTableKey];
    }

    saveTableOrders(tableOrders);

    // The completed table must no longer be the active table.
    currentTableKey = "NORMAL";
    firebaseStore.setItem(ACTIVE_TABLE_STORAGE_KEY, "NORMAL");

    // Refresh this page immediately.
    syncActiveTableUI();

    // Prevent beforeunload/input handlers from immediately recreating the
    // just-completed table draft. The next normal table selection clears it.
    suppressTableDraftPersistence = true;

    // Notify any POS UI running in the same page context.
    window.dispatchEvent(new CustomEvent("sriTabemashouTableOrdersChanged", {
        detail: { tableKey: completedTableKey, status: "FREE" }
    }));
}

function resetBillingFieldsForEmptyTable(tableKey, generateNumber = true) {
    document.getElementById("customerName").value = "";
    document.getElementById("customerPhone").value = "";
    document.getElementById("discount").value = "0";
    document.getElementById("amountReceived").value = "";

    const orderType = document.getElementById("orderType");
    const tableNumber = document.getElementById("tableNumber");

    if (orderType) {
        orderType.value =
            tableKey === "TAKEAWAY"
                ? "Take Away"
                : tableKey === "DELIVERY"
                    ? "Delivery"
                    : "Dine In";
    }

    if (tableNumber) {
        tableNumber.value =
            tableKey.startsWith("TABLE_")
                ? getTableLabel(tableKey)
                : "";
    }

    selectedPayment = "Cash";

    document.querySelectorAll(".payment-btn").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.method === "Cash"
        );
    });

    const cashDetails = document.getElementById("cashDetails");
    if (cashDetails) cashDetails.style.display = "grid";

    if (generateNumber) {
        setText("billNumber", generateBillNumber());
    }

    updateOrderType();
}

function loadTableDraft(tableKey) {
    suppressTableDraftPersistence = false;
    isLoadingTableDraft = true;

    const tableOrders = getTableOrders();
    const draft = tableOrders[tableKey];

    cart = [];
    selectedPayment = "Cash";

    if (draft) {
        cart = Array.isArray(draft.cart)
            ? JSON.parse(JSON.stringify(draft.cart))
            : [];

        document.getElementById("customerName").value =
            draft.customerName || "";
        document.getElementById("customerPhone").value =
            draft.customerPhone || "";
        document.getElementById("orderType").value =
            draft.orderType || "Dine In";
        document.getElementById("tableNumber").value =
            draft.tableNumber ||
            (tableKey.startsWith("TABLE_")
                ? getTableLabel(tableKey)
                : "");
        document.getElementById("discount").value =
            draft.discount ?? "0";
        document.getElementById("amountReceived").value =
            draft.amountReceived ?? "";
        selectedPayment =
            draft.selectedPayment || "Cash";

        if (draft.billNumber) {
            setText("billNumber", draft.billNumber);
        } else {
            setText("billNumber", generateBillNumber());
        }
    } else {
        resetBillingFieldsForEmptyTable(tableKey, true);
    }

    currentTableKey = tableKey;

    firebaseStore.setItem(
        ACTIVE_TABLE_STORAGE_KEY,
        currentTableKey
    );

    selectPayment(selectedPayment);
    updateOrderType();

    isLoadingTableDraft = false;

    renderCart();
    syncActiveTableUI();
}

function switchBillingTable(tableKey) {
    // Only an explicit table-button click creates a table-specific order.
    if (!BILLING_TABLES.some(table => table.key === tableKey)) {
        return;
    }

    // Save the currently selected table before switching. Normal orders are
    // never stored as a table order.
    if (currentTableKey !== "NORMAL") {
        saveCurrentTableDraft();
    }

    loadTableDraft(tableKey);
}

function initializeTableSwitcher() {
    // Pending table orders must survive page reloads. A table remains Pending
    // until its bill is actually printed/completed.
    const savedActiveTable = firebaseStore.getItem(ACTIVE_TABLE_STORAGE_KEY) || "NORMAL";
    const tableOrders = getTableOrders();

    currentTableKey = BILLING_TABLES.some(table => table.key === savedActiveTable)
        ? savedActiveTable
        : "NORMAL";

    firebaseStore.setItem(ACTIVE_TABLE_STORAGE_KEY, currentTableKey);

    if (currentTableKey !== "NORMAL" && tableOrders[currentTableKey]) {
        loadTableDraft(currentTableKey);
    } else {
        currentTableKey = "NORMAL";
        firebaseStore.setItem(ACTIVE_TABLE_STORAGE_KEY, "NORMAL");
        resetBillingFieldsForEmptyTable("NORMAL", false);
        renderCart();
        syncActiveTableUI();
    }

    const watchedInputs = [
        "customerName",
        "customerPhone",
        "tableNumber",
        "discount",
        "amountReceived"
    ];

    watchedInputs.forEach(id => {
        const input = document.getElementById(id);
        if (!input) return;

        input.addEventListener("input", () => {
            // Typing in the Table No. field must not silently create a table
            // order. Table association happens only through the table buttons.
            saveCurrentTableDraft();
        });

        input.addEventListener("change", () => {
            saveCurrentTableDraft();
        });
    });

    const orderType = document.getElementById("orderType");
    if (orderType) {
        orderType.addEventListener("change", () => {
            // Order type changes do not select a table.
            saveCurrentTableDraft();
        });
    }

    window.addEventListener("beforeunload", saveCurrentTableDraft);
    syncActiveTableUI();
}


function generateBillNumber() {

    const settings =
        getPOSSettings();

    let counter =
        Number(
            firebaseStore.getItem(
                "sriTabemashouBillCounter"
            ) || 0
        );


    if (
        counter <
        Number(settings.billing.startingBill)
    ) {

        counter =
            Number(
                settings.billing.startingBill
            ) - 1;

    }


    counter++;


    firebaseStore.setItem(
        "sriTabemashouBillCounter",
        String(counter)
    );


    return (
        settings.billing.billPrefix +
        "-" +
        String(counter).padStart(5, "0")
    );

}


/* =====================================================
   CREATE BILLING CATEGORIES
===================================================== */

function createCategories() {

    const container =
        document.getElementById(
            "categories"
        );


    if (!container) return;


    const categories = [

        "All",

        ...new Set(

            menuItems
                .filter(
                    item =>
                        item.status ===
                        "Available"
                )
                .map(
                    item =>
                        item.category
                )

        )

    ];


    container.innerHTML = "";


    categories.forEach(
        category => {

            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "category-btn";


            if (
                category ===
                selectedCategory
            ) {

                button.classList.add(
                    "active"
                );

            }


            button.textContent =
                category;


            button.onclick =
                function () {

                    selectedCategory =
                        category;

                    createCategories();

                    displayMenu();

                };


            container.appendChild(
                button
            );

        }
    );

}


/* =====================================================
   DISPLAY BILLING MENU
===================================================== */

function displayMenu() {

    const grid =
        document.getElementById(
            "menuGrid"
        );


    if (!grid) return;


    const searchInput =
        document.getElementById(
            "searchMenu"
        );


    const search =
        searchInput
            ? searchInput.value
                .toLowerCase()
            : "";


    const filteredItems =
        menuItems.filter(
            item => {

                const categoryMatch =
                    selectedCategory ===
                    "All" ||
                    item.category ===
                    selectedCategory;


                const searchMatch =
                    item.name
                        .toLowerCase()
                        .includes(search);


                const available =
                    item.status ===
                    "Available";


                return (
                    categoryMatch &&
                    searchMatch &&
                    available
                );

            }
        );


    grid.innerHTML = "";


    if (
        filteredItems.length === 0
    ) {

        grid.innerHTML = `

            <div style="
                grid-column:1/-1;
                text-align:center;
                padding:50px;
                color:#999;
            ">

                No food items found.

            </div>

        `;

        return;

    }


    filteredItems.forEach(
        item => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "menu-card";


            const typeClass =
                item.type === "Veg"
                    ? "veg-dot"
                    : "nonveg-dot";


            card.innerHTML = `

                <div class="
                    food-type-dot
                    ${typeClass}
                "></div>


                ${item.image
                    ? `<div class="food-icon"><img class="food-image" src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}"></div>`
                    : `<div class="food-icon">${escapeHTML(item.icon || "🍽️")}</div>`}


                <h3>
                    ${escapeHTML(
                        item.name
                    )}
                </h3>


                <div class="category">

                    ${escapeHTML(
                        item.category
                    )}

                </div>


                <div class="menu-price">

                    ₹${Number(
                        item.price
                    ).toFixed(2)}

                </div>

            `;


            card.onclick =
                function () {

                    addToCart(item);

                };


            grid.appendChild(
                card
            );

        }
    );

}


/* =====================================================
   SEARCH
===================================================== */

function searchMenu() {

    displayMenu();

}


/* =====================================================
   ADD TO CART
===================================================== */

function addToCart(item) {

    const existing =
        cart.find(
            cartItem =>
                cartItem.id ===
                item.id
        );


    if (existing) {

        existing.quantity++;

    }

    else {

        cart.push({

            id: item.id,

            name: item.name,

            price: Number(
                item.price
            ),

            category:
                item.category,

            quantity: 1

        });

    }


    renderCart();
    saveCurrentTableDraft();

}


/* =====================================================
   RENDER CART
===================================================== */

function renderCart() {

    const container =
        document.getElementById(
            "cartItems"
        );


    if (!container) return;


    if (
        cart.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-cart">

                <div class="empty-icon">
                    🛒
                </div>

                <h3>
                    No items added
                </h3>

                <p>
                    Select food items
                    from the menu
                </p>

            </div>

        `;


        calculateTotal();

        return;

    }


    container.innerHTML = "";


    cart.forEach(
        item => {

            const total =
                item.price *
                item.quantity;


            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "cart-item";


            element.innerHTML = `

                <div class="
                    cart-item-info
                ">

                    <h4>
                        ${escapeHTML(
                            item.name
                        )}
                    </h4>

                    <small>
                        ₹${item.price.toFixed(2)}
                        each
                    </small>

                </div>


                <div class="
                    cart-item-right
                ">

                    <div class="item-total">

                        ₹${total.toFixed(2)}

                    </div>


                    <div class="
                        quantity-controls
                    ">

                        <button
                            onclick="
                                changeQuantity(
                                    ${item.id},
                                    -1
                                )
                            ">

                            −

                        </button>


                        <span>
                            ${item.quantity}
                        </span>


                        <button
                            onclick="
                                changeQuantity(
                                    ${item.id},
                                    1
                                )
                            ">

                            +

                        </button>

                    </div>

                </div>

            `;


            container.appendChild(
                element
            );

        }
    );


    calculateTotal();

}


/* =====================================================
   CHANGE QUANTITY
===================================================== */

function changeQuantity(
    id,
    amount
) {

    const item =
        cart.find(
            cartItem =>
                cartItem.id === id
        );


    if (!item) return;


    item.quantity += amount;


    if (
        item.quantity <= 0
    ) {

        cart =
            cart.filter(
                cartItem =>
                    cartItem.id !== id
            );

    }


    renderCart();
    saveCurrentTableDraft();

}


/* =====================================================
   CLEAR CART
===================================================== */

function clearCart() {

    if (
        cart.length === 0
    ) return;


    if (
        !confirm(
            "Clear all items from this bill?"
        )
    ) {

        return;

    }


    cart = [];

    renderCart();
    saveCurrentTableDraft();

}


/* =====================================================
   CALCULATE TOTAL
===================================================== */

function calculateTotal() {

    let subtotal = 0;


    cart.forEach(
        item => {

            subtotal +=
                item.price *
                item.quantity;

        }
    );


    let discount =
        parseFloat(
            document.getElementById(
                "discount"
            )?.value
        ) || 0;


    if (
        discount > subtotal
    ) {

        discount =
            subtotal;


        document.getElementById(
            "discount"
        ).value =
            discount;

    }


    const taxable =
        subtotal -
        discount;


    /*
       Current demo GST:
       CGST = 2.5%
       SGST = 2.5%

       We will make GST configurable
       in the Settings step.
    */

    const taxSettings = typeof getPOSSettings === "function" ? getPOSSettings().tax : { gstEnabled: "yes", cgst: 2.5, sgst: 2.5 };
    const gstEnabled = String(taxSettings?.gstEnabled ?? "yes").toLowerCase() !== "no";
    const cgst = gstEnabled ? taxable * (Number(taxSettings?.cgst ?? 2.5) / 100) : 0;
    const sgst = gstEnabled ? taxable * (Number(taxSettings?.sgst ?? 2.5) / 100) : 0;


    const total =
        taxable +
        cgst +
        sgst;


    setText(
        "subtotal",
        subtotal.toFixed(2)
    );


    setText(
        "cgst",
        cgst.toFixed(2)
    );


    setText(
        "sgst",
        sgst.toFixed(2)
    );


    setText(
        "grandTotal",
        total.toFixed(2)
    );


    calculateChange();

}


/* =====================================================
   PAYMENT
===================================================== */

function selectPayment(
    method
) {

    selectedPayment =
        method;


    document
        .querySelectorAll(
            ".payment-btn"
        )
        .forEach(
            button => {

                button.classList.remove(
                    "active"
                );


                if (
                    button.dataset.method
                    === method
                ) {

                    button.classList.add(
                        "active"
                    );

                }

            }
        );


    const cashDetails =
        document.getElementById(
            "cashDetails"
        );


    if (
        method === "Cash"
    ) {

        cashDetails.style.display =
            "grid";

    }

    else {

        cashDetails.style.display =
            "none";

    }

    saveCurrentTableDraft();

}


/* =====================================================
   CHANGE
===================================================== */

function calculateChange() {

    const total =
        parseFloat(
            document.getElementById(
                "grandTotal"
            )?.textContent
        ) || 0;


    const received =
        parseFloat(
            document.getElementById(
                "amountReceived"
            )?.value
        ) || 0;


    const change =
        Math.max(
            received - total,
            0
        );


    setText(
        "changeAmount",
        change.toFixed(2)
    );

}


/* =====================================================
   ORDER TYPE
===================================================== */

document.addEventListener(
    "change",
    function(event) {

        if (
            event.target.id ===
            "orderType"
        ) {

            updateOrderType();

        }

    }
);

function updateOrderType() {

    const orderType =
        document.getElementById(
            "orderType"
        )?.value;


    if (!orderType) return;


    setText(
        "orderTypeDisplay",
        orderType
    );


    const table =
        document.getElementById(
            "tableNumber"
        );


    if (!table) return;


    if (
        orderType ===
        "Dine In"
    ) {

        table.disabled =
            false;

    }

    else {

        table.disabled =
            true;

        table.value =
            "";

    }

    syncActiveTableUI();

}


/* =====================================================
   BUILD + SAVE COMPLETED BILL
   A completed bill is always written to the Bills section.
   This is shared by Save Bill and Print Bill so printing can
   never create a bill that is missing from bill history.
===================================================== */
function persistCompletedBill() {
    if (!Array.isArray(cart) || cart.length === 0) {
        alert("Please add at least one item.");
        return null;
    }

    const total = parseFloat(
        document.getElementById("grandTotal")?.textContent || "0"
    ) || 0;

    if (selectedPayment === "Cash") {
        const received = parseFloat(
            document.getElementById("amountReceived")?.value || "0"
        ) || 0;

        if (received < total) {
            alert("Amount received is less than the bill total.");
            return null;
        }
    }

    const billNumber =
        document.getElementById("billNumber")?.textContent || generateBillNumber();

    let bills = [];
    try {
        bills = JSON.parse(
            firebaseStore.getItem("sriTabemashouBills") || "[]"
        ) || [];
    } catch {
        bills = [];
    }

    /* Prevent the same bill from being stored twice if Save Bill and
       Print Bill are pressed repeatedly for the same order. */
    const existingBill = bills.find(
        bill => String(bill.billNumber) === String(billNumber)
    );

    if (existingBill) {
        return existingBill;
    }

    const bill = {
        billNumber,
        date: new Date().toISOString(),
        customerName: document.getElementById("customerName")?.value || "",
        customerPhone: document.getElementById("customerPhone")?.value || "",
        orderType: document.getElementById("orderType")?.value || "Dine In",
        tableNumber: document.getElementById("tableNumber")?.value || "",
        tableKey: currentTableKey,
        paymentMethod: selectedPayment,
        items: JSON.parse(JSON.stringify(cart)),
        subtotal: parseFloat(document.getElementById("subtotal")?.textContent || "0") || 0,
        discount: parseFloat(document.getElementById("discount")?.value || "0") || 0,
        cgst: parseFloat(document.getElementById("cgst")?.textContent || "0") || 0,
        sgst: parseFloat(document.getElementById("sgst")?.textContent || "0") || 0,
        grandTotal: total,
        cashReceived: selectedPayment === "Cash"
            ? (parseFloat(document.getElementById("amountReceived")?.value || "0") || 0)
            : total,
        changeAmount: selectedPayment === "Cash"
            ? Math.max(0, (parseFloat(document.getElementById("amountReceived")?.value || "0") || 0) - total)
            : 0,
        status: "completed"
    };

    /* Deduct inventory exactly once, and retain the deduction ledger for
       later void/refund reversal. */
    try {
        if (typeof window.deductInventoryForBill === "function") {
            const result = window.deductInventoryForBill(bill);
            bill.inventoryDeductions = result?.deductions || [];
        }
    } catch (inventoryError) {
        console.warn("Inventory deduction skipped:", inventoryError);
        bill.inventoryDeductions = [];
    }

    bills.push(bill);
    firebaseStore.setItem("sriTabemashouBills", JSON.stringify(bills));

    if (typeof addAuditLog === "function") {
        addAuditLog(
            "Bill Created",
            `${bill.billNumber} • ${selectedPayment} • ₹${total.toFixed(2)}`
        );
    }

    /* A table becomes available again only after the completed bill is
       saved/printed. Normal takeaway orders simply have no table draft. */
    clearCurrentTableDraft();

    return bill;
}

/* =====================================================
   SAVE BILL
===================================================== */
function saveBill() {
    const bill = persistCompletedBill();
    if (!bill) return;

    alert(`Bill ${bill.billNumber} saved successfully!`);

    /* If automatic printing is enabled, the bill has already been saved.
       printBill({save:false}) only prints it and does not create a duplicate. */
    try {
        if (typeof getPOSSettings === "function" && getPOSSettings().billing.autoPrint) {
            printBill({ save: false, resetAfterPrint: true });
            return;
        }
    } catch (error) {
        console.warn("Automatic bill printing skipped:", error);
    }

    newBill(true);
}


/* =====================================================
   NEW BILL
===================================================== */

function newBill(skipConfirm = false) {

    suppressTableDraftPersistence = false;

    if (
        !skipConfirm &&
        Array.isArray(cart) &&
        cart.length > 0
    ) {
        const label = getTableLabel(currentTableKey);
        const confirmed = confirm(
            `Start a new bill? ${label} will remain Pending until you print its bill.`
        );
        if (!confirmed) return;
    }

    // If the current bill belongs to a numbered table, keep its draft in
    // TABLE_ORDERS_STORAGE_KEY. It must remain Pending until Print Bill is
    // completed. New Bill only starts a fresh billing screen; it does NOT
    // clear the table's pending order.
    if (currentTableKey !== "NORMAL" && cart.length > 0) {
        saveCurrentTableDraft();
    }

    currentTableKey = "NORMAL";
    firebaseStore.setItem(ACTIVE_TABLE_STORAGE_KEY, "NORMAL");
    cart = [];


    document.getElementById(
        "customerName"
    ).value = "";


    document.getElementById(
        "customerPhone"
    ).value = "";


    document.getElementById(
        "tableNumber"
    ).value = "";


    document.getElementById(
        "discount"
    ).value = "0";


    document.getElementById(
        "amountReceived"
    ).value = "";


    selectedPayment =
        "Cash";


    document
        .querySelectorAll(
            ".payment-btn"
        )
        .forEach(
            button => {

                button.classList.remove(
                    "active"
                );


                if (
                    button.dataset.method
                    === "Cash"
                ) {

                    button.classList.add(
                        "active"
                    );

                }

            }
        );


    document.getElementById(
        "cashDetails"
    ).style.display =
        "grid";


    generateBillNumber();

    renderCart();

}


/* =====================================================
   MENU MANAGEMENT
===================================================== */

function preparePrintBill() {

    const printLogo = document.getElementById("printRestaurantLogo");
    const printLogoImage = printLogo?.querySelector("img");
    const restaurantLogo = typeof getRestaurantLogo === "function" ? getRestaurantLogo() : "";
    if (printLogo && printLogoImage) {
        if (restaurantLogo) {
            printLogo.style.display = "block";
            printLogoImage.src = restaurantLogo;
        } else {
            printLogo.style.display = "none";
            printLogoImage.removeAttribute("src");
        }
    }

    setText(
        "printBillNumber",
        document.getElementById(
            "billNumber"
        ).textContent
    );


    setText(
        "printDate",
        new Date().toLocaleString(
            "en-IN"
        )
    );


    setText(
        "printCustomer",
        document.getElementById(
            "customerName"
        ).value ||
        "Walk-in Customer"
    );


    setText(
        "printOrderType",
        document.getElementById(
            "orderType"
        ).value
    );


    setText(
        "printTable",
        document.getElementById(
            "tableNumber"
        ).value ||
        "-"
    );


    setText(
        "printSubtotal",
        document.getElementById(
            "subtotal"
        ).textContent
    );


    setText(
        "printDiscount",
        document.getElementById(
            "discount"
        ).value
    );


    setText(
        "printCGST",
        document.getElementById(
            "cgst"
        ).textContent
    );


    setText(
        "printSGST",
        document.getElementById(
            "sgst"
        ).textContent
    );


    setText(
        "printGrandTotal",
        document.getElementById(
            "grandTotal"
        ).textContent
    );


    setText(
        "printPayment",
        selectedPayment
    );


    const printItems =
        document.getElementById(
            "printItems"
        );


    printItems.innerHTML = "";


    cart.forEach(
        item => {

            const row =
                document.createElement(
                    "tr"
                );


            const total =
                item.price *
                item.quantity;


            row.innerHTML = `

                <td>
                    ${escapeHTML(
                        item.name
                    )}
                </td>

                <td>
                    ${item.quantity}
                </td>

                <td>
                    ₹${item.price.toFixed(2)}
                </td>

                <td>
                    ₹${total.toFixed(2)}
                </td>

            `;


            printItems.appendChild(
                row
            );

        }
    );

}

function printBill(options = {}) {
    const { save = true, resetAfterPrint = true } = options;

    if (!Array.isArray(cart) || cart.length === 0) {
        alert("Please add items before printing.");
        return;
    }

    /* Print Bill also completes/saves the bill so it appears in Bills.
       Save Bill can call this with save:false after it has already saved. */
    if (save) {
        const bill = persistCompletedBill();
        if (!bill) return;
    }

    preparePrintBill();

    /* Complete the table transaction BEFORE opening the print dialog.
       Some browsers do not reliably fire `afterprint`, especially when
       printing to a system dialog/PDF.  Clearing only in `afterprint` can
       therefore leave the table stuck as Pending. */
    if (resetAfterPrint) {
        // Completing Print Bill releases the selected numbered table.
        // clearCurrentTableDraft() also switches the UI back to Normal Order.
        clearCurrentTableDraft();

        // Ensure all billing fields are reset without re-saving the old table.
        cart = [];
        resetBillingFieldsForEmptyTable("NORMAL", true);
        renderCart();
        syncActiveTableUI();
    }

    document.body.classList.remove("printing-kot");
    document.body.classList.add("printing-bill");

    const cleanup = () => {
        document.body.classList.remove("printing-bill");
        window.removeEventListener("afterprint", cleanup);
    };

    window.addEventListener("afterprint", cleanup);
    setTimeout(() => window.print(), 50);
}

function generateKOTNumber() {
    const key = "sriTabemashouKOTCounter";
    let counter = Number(firebaseStore.getItem(key) || 0);
    counter += 1;
    firebaseStore.setItem(key, String(counter));
    return `KOT-${String(counter).padStart(4, "0")}`;
}

function preparePrintKOT() {
    setText("printKOTNumber", generateKOTNumber());
    setText("printKOTDate", new Date().toLocaleString("en-IN"));
    setText("printKOTOrderType", document.getElementById("orderType")?.value || "Dine In");
    setText("printKOTTable", document.getElementById("tableNumber")?.value || "-");
    setText("printKOTCustomer", document.getElementById("customerName")?.value || "Walk-in Customer");

    const tbody = document.getElementById("printKOTItems");
    if (!tbody) return;
    tbody.innerHTML = "";

    cart.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${escapeHTML(item.name)}</td><td>${Number(item.quantity) || 0}</td>`;
        tbody.appendChild(row);
    });
}

function printKOT() {
    if (!Array.isArray(cart) || cart.length === 0) {
        alert("Please add items before printing KOT.");
        return;
    }

    preparePrintKOT();
    document.body.classList.remove("printing-bill");
    document.body.classList.add("printing-kot");

    const cleanup = () => {
        document.body.classList.remove("printing-kot");
        window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);

    setTimeout(() => window.print(), 50);
}


/* =====================================================
   UTILITY
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    generateBillNumber();
    createCategories();
    displayMenu();
    updateOrderType();
    renderCart();

    const defaultPayment = getPOSSettings().billing.defaultPayment || "Cash";
    selectPayment(defaultPayment);

    initializeTableSwitcher();
});
