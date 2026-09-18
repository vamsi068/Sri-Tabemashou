/* Sri Tabemashou POS - reports.js */
function getLocalDateString(date) {

    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/* ---------------------------------------------------------
   GET REPORT DATE RANGE
--------------------------------------------------------- */

function getReportDateRange() {

    const period =
        document.getElementById("reportPeriod")?.value || "month";

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    let startDate = new Date(today);

    let endDate = new Date(today);

    endDate.setHours(23, 59, 59, 999);


    if (period === "today") {

        startDate = new Date(today);

    }


    else if (period === "yesterday") {

        startDate = new Date(today);

        startDate.setDate(startDate.getDate() - 1);

        endDate = new Date(startDate);

        endDate.setHours(23, 59, 59, 999);

    }


    else if (period === "week") {

        startDate = new Date(today);

        const day = startDate.getDay();

        const difference = day === 0 ? 6 : day - 1;

        startDate.setDate(startDate.getDate() - difference);

    }


    else if (period === "month") {

        startDate = new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        );

    }


    else if (period === "all") {

        return {
            start: null,
            end: null
        };

    }


    else if (period === "custom") {

        const startInput =
            document.getElementById("reportStartDate")?.value;

        const endInput =
            document.getElementById("reportEndDate")?.value;


        if (!startInput || !endInput) {

            return {
                start: null,
                end: null
            };

        }


        startDate = new Date(startInput + "T00:00:00");

        endDate = new Date(endInput + "T23:59:59");

    }


    return {
        start: startDate,
        end: endDate
    };

}


/* ---------------------------------------------------------
   GET BILLS FOR REPORT
--------------------------------------------------------- */

function getReportBills() {

    const bills = getSavedBills();

    const range = getReportDateRange();


    if (!range.start || !range.end) {

        return bills;

    }


    return bills.filter(bill => {

        if ((bill.status || "completed") === "voided") return false;

        const billDate = new Date(
            bill.date || bill.createdAt || bill.timestamp
        );

        if (isNaN(billDate.getTime())) {

            return false;

        }

        return (
            billDate >= range.start &&
            billDate <= range.end
        );

    });

}


/* ---------------------------------------------------------
   HANDLE REPORT PERIOD
--------------------------------------------------------- */

function handleReportPeriodChange() {

    const period =
        document.getElementById("reportPeriod").value;

    const customFields =
        document.getElementById("customDateFields");


    if (period === "custom") {

        customFields.classList.remove("hidden");

        const today = new Date();

        const firstDay = new Date(
            today.getFullYear(),
            today.getMonth(),
            1
        );


        document.getElementById("reportStartDate").value =
            getLocalDateString(firstDay);

        document.getElementById("reportEndDate").value =
            getLocalDateString(today);

    }

    else {

        customFields.classList.add("hidden");

    }


    renderReports();

}


/* ---------------------------------------------------------
   FORMAT RUPEES
--------------------------------------------------------- */

function formatReportMoney(value) {

    return "₹" + Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

}


/* ---------------------------------------------------------
   GET BILL TOTAL
--------------------------------------------------------- */

function getBillTotal(bill) {

    return Number(
        bill.grandTotal ??
        bill.total ??
        bill.amount ??
        0
    );

}


/* ---------------------------------------------------------
   GET BILL DATE
--------------------------------------------------------- */

function getBillDate(bill) {

    return new Date(
        bill.date ||
        bill.createdAt ||
        bill.timestamp
    );

}


/* ---------------------------------------------------------
   CALCULATE REPORT DATA
--------------------------------------------------------- */

function calculateReportData(bills) {

    let totalSales = 0;

    let totalDiscount = 0;

    let totalCGST = 0;

    let totalSGST = 0;

    let cashSales = 0;

    let upiSales = 0;

    let cardSales = 0;

    let dineInSales = 0;

    let takeAwaySales = 0;

    let deliverySales = 0;


    const itemSales = {};

    const categorySales = {};

    const dailySales = {};


    bills.forEach(bill => {

        const total = getBillTotal(bill);

        totalSales += total;


        totalDiscount += Number(
            bill.discount || 0
        );


        totalCGST += Number(
            bill.cgst || 0
        );


        totalSGST += Number(
            bill.sgst || 0
        );


        /* PAYMENT */

        const payment =
            String(
                bill.paymentMethod ||
                bill.payment ||
                "Cash"
            ).toLowerCase();


        if (payment.includes("cash")) {

            cashSales += total;

        }

        else if (payment.includes("upi")) {

            upiSales += total;

        }

        else if (payment.includes("card")) {

            cardSales += total;

        }


        /* ORDER TYPE */

        const orderType =
            String(
                bill.orderType ||
                "Dine In"
            ).toLowerCase();


        if (
            orderType.includes("dine") ||
            orderType.includes("dine-in")
        ) {

            dineInSales += total;

        }

        else if (
            orderType.includes("take") ||
            orderType.includes("parcel")
        ) {

            takeAwaySales += total;

        }

        else if (
            orderType.includes("delivery")
        ) {

            deliverySales += total;

        }


        /* ITEMS */

        const items =
            bill.items ||
            bill.cart ||
            [];


        items.forEach(item => {

            const itemName =
                item.name || "Unknown Item";


            const quantity =
                Number(
                    item.quantity ||
                    item.qty ||
                    1
                );


            const itemTotal =
                Number(
                    item.total ??
                    (Number(item.price || 0) * quantity)
                );


            if (!itemSales[itemName]) {

                itemSales[itemName] = {
                    quantity: 0,
                    sales: 0
                };

            }


            itemSales[itemName].quantity += quantity;

            itemSales[itemName].sales += itemTotal;


            const category =
                item.category ||
                "Other";


            if (!categorySales[category]) {

                categorySales[category] = {
                    quantity: 0,
                    sales: 0
                };

            }


            categorySales[category].quantity += quantity;

            categorySales[category].sales += itemTotal;

        });


        /* DAILY SALES */

        const date = getBillDate(bill);

        if (!isNaN(date.getTime())) {

            const dayKey =
                getLocalDateString(date);


            if (!dailySales[dayKey]) {

                dailySales[dayKey] = 0;

            }


            dailySales[dayKey] += total;

        }

    });


    return {

        totalSales,

        totalDiscount,

        totalCGST,

        totalSGST,

        cashSales,

        upiSales,

        cardSales,

        dineInSales,

        takeAwaySales,

        deliverySales,

        itemSales,

        categorySales,

        dailySales

    };

}


/* ---------------------------------------------------------
   COST / PROFIT DATA
--------------------------------------------------------- */

function getFilteredRecordsByDate(records, dateGetter) {
    const range = getReportDateRange();
    const list = Array.isArray(records) ? records : [];

    if (!range.start || !range.end) return list;

    return list.filter(record => {
        const value = dateGetter(record);
        const date = new Date(value);
        if (isNaN(date.getTime())) return false;
        return date >= range.start && date <= range.end;
    });
}

function getReportCostData() {
    let salaryPayments = [];
    let purchases = [];

    try {
        salaryPayments = JSON.parse(
            firebaseStore.getItem("sriTabemashouSalaryPayments")
        ) || [];
    } catch (_) {
        salaryPayments = [];
    }

    try {
        purchases = JSON.parse(
            firebaseStore.getItem("purchases")
        ) || [];
    } catch (_) {
        purchases = [];
    }

    const filteredSalaryPayments = getFilteredRecordsByDate(
        salaryPayments,
        payment => payment.paidDate || payment.date
    );

    const filteredPurchases = getFilteredRecordsByDate(
        purchases,
        purchase => purchase.date || purchase.purchaseDate
    );

    const salaryExpenses = filteredSalaryPayments.reduce(
        (sum, payment) => sum + (Number(payment.amount) || 0),
        0
    );

    const purchaseExpenses = filteredPurchases.reduce((sum, purchase) => {
        if (purchase.total !== undefined) {
            return sum + (Number(purchase.total) || 0);
        }
        return sum +
            ((Number(purchase.qty ?? purchase.quantity ?? 0) || 0) *
             (Number(purchase.price ?? purchase.pricePerUnit ?? 0) || 0));
    }, 0);

    let settings = { expenses: {} };
    try {
        if (typeof getPOSSettings === "function") settings = getPOSSettings();
        else settings = JSON.parse(firebaseStore.getItem("sriTabemashouSettings") || "{}") || settings;
    } catch (_) {}
    const exp = settings.expenses || {};
    const fixedMonthly = Object.values(exp).reduce((sum,v)=>sum+(Number(v)||0),0);
    const range = getReportDateRange();
    let fixedExpense = fixedMonthly;
    if (range.start && range.end) {
        const days = Math.max(1, Math.round((range.end - range.start) / 86400000) + 1);
        const y = range.start.getFullYear(), m = range.start.getMonth();
        const daysInMonth = new Date(y, m + 1, 0).getDate();
        fixedExpense = fixedMonthly * Math.min(days / daysInMonth, 1);
    }
    const totalExpenses = salaryExpenses + purchaseExpenses + fixedExpense;

    let salaryEarned = salaryExpenses, salaryPending = 0;
    try {
        const staff = JSON.parse(firebaseStore.getItem("sriTabemashouStaff")||"[]") || [];
        const payments = filteredSalaryPayments;
        salaryEarned = staff.reduce((sum,st)=>{ const m=Number(st.salary)||0; return sum+m; },0);
        const paid = payments.reduce((sum,p)=>sum+(Number(p.amount)||0),0);
        salaryPending = Math.max(0, salaryEarned-paid);
    } catch(_) {}

    return { salaryExpenses, purchaseExpenses, fixedExpense, salaryPending, totalExpenses };
}

/* ---------------------------------------------------------
   RENDER REPORTS
--------------------------------------------------------- */

function renderReports() {

    const bills = getReportBills();

    const data = calculateReportData(bills);


    const billCount = bills.length;


    const averageBill =
        billCount > 0
            ? data.totalSales / billCount
            : 0;


    /* MAIN CARDS */

    setReportText(
        "reportTotalSales",
        formatReportMoney(data.totalSales)
    );


    setReportText(
        "reportBillCount",
        billCount
    );


    setReportText(
        "reportAverageBill",
        formatReportMoney(averageBill)
    );


    setReportText(
        "reportDiscount",
        formatReportMoney(data.totalDiscount)
    );


    setReportText(
        "reportCGST",
        formatReportMoney(data.totalCGST)
    );


    setReportText(
        "reportSGST",
        formatReportMoney(data.totalSGST)
    );


    setReportText(
        "reportNetSales",
        formatReportMoney(data.totalSales)
    );

    const costData = getReportCostData();
    const netProfit = data.totalSales - costData.totalExpenses;

    setReportText(
        "reportSalaryExpenses",
        formatReportMoney(costData.salaryExpenses)
    );

    setReportText(
        "reportPurchaseExpenses",
        formatReportMoney(costData.purchaseExpenses)
    );

    setReportText("reportSalaryPending", formatReportMoney(costData.salaryPending));
    setReportText(
        "reportTotalExpenses",
        formatReportMoney(costData.totalExpenses)
    );

    setReportText(
        "reportProfitSales",
        formatReportMoney(data.totalSales)
    );

    setReportText(
        "reportNetProfit",
        formatReportMoney(netProfit)
    );


    /* PAYMENT */

    setReportText(
        "reportCashSales",
        formatReportMoney(data.cashSales)
    );


    setReportText(
        "reportUPISales",
        formatReportMoney(data.upiSales)
    );


    setReportText(
        "reportCardSales",
        formatReportMoney(data.cardSales)
    );


    const totalPayment =
        data.cashSales +
        data.upiSales +
        data.cardSales;


    const cashPercent =
        totalPayment > 0
            ? (data.cashSales / totalPayment) * 100
            : 0;


    const upiPercent =
        totalPayment > 0
            ? (data.upiSales / totalPayment) * 100
            : 0;


    const cardPercent =
        totalPayment > 0
            ? (data.cardSales / totalPayment) * 100
            : 0;


    setReportText(
        "reportCashPercent",
        cashPercent.toFixed(1) + "%"
    );


    setReportText(
        "reportUPIPercent",
        upiPercent.toFixed(1) + "%"
    );


    setReportText(
        "reportCardPercent",
        cardPercent.toFixed(1) + "%"
    );


    setReportWidth(
        "cashProgress",
        cashPercent
    );


    setReportWidth(
        "upiProgress",
        upiPercent
    );


    setReportWidth(
        "cardProgress",
        cardPercent
    );


    /* ORDER TYPES */

    setReportText(
        "reportDineIn",
        formatReportMoney(data.dineInSales)
    );


    setReportText(
        "reportTakeAway",
        formatReportMoney(data.takeAwaySales)
    );


    setReportText(
        "reportDelivery",
        formatReportMoney(data.deliverySales)
    );


    /* OTHER REPORTS */

    renderTopItems(data.itemSales);

    renderCategorySales(data.categorySales);

    renderDailySales(data.dailySales);

}


/* ---------------------------------------------------------
   SAFE TEXT SETTER
--------------------------------------------------------- */

function setReportText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent = value;

    }

}


/* ---------------------------------------------------------
   SET PROGRESS WIDTH
--------------------------------------------------------- */

function setReportWidth(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.style.width =
            Math.min(100, Math.max(0, value)) + "%";

    }

}


/* ---------------------------------------------------------
   TOP SELLING ITEMS
--------------------------------------------------------- */

function renderTopItems(itemSales) {

    const container =
        document.getElementById("topItemsReport");


    if (!container) return;


    const items =
        Object.entries(itemSales)
        .sort((a, b) =>
            b[1].quantity - a[1].quantity
        )
        .slice(0, 10);


    if (items.length === 0) {

        container.innerHTML = `
            <div class="empty-report">
                No sales data available
            </div>
        `;

        return;

    }


    const maxQuantity =
        Math.max(
            ...items.map(item => item[1].quantity)
        );


    container.innerHTML =
        items.map(([name, data]) => {

            const percentage =
                maxQuantity > 0
                    ? (data.quantity / maxQuantity) * 100
                    : 0;


            return `

                <div class="report-item">

                    <div class="report-item-header">

                        <span class="report-item-name">
                            ${escapeHTML(name)}
                        </span>

                        <span class="report-item-value">
                            ${data.quantity} sold
                            · ${formatReportMoney(data.sales)}
                        </span>

                    </div>

                    <div class="report-item-bar-container">

                        <div
                            class="report-item-bar"
                            style="width:${percentage}%"
                        ></div>

                    </div>

                </div>

            `;

        }).join("");

}


/* ---------------------------------------------------------
   CATEGORY SALES
--------------------------------------------------------- */

function renderCategorySales(categorySales) {

    const container =
        document.getElementById("categorySalesReport");


    if (!container) return;


    const categories =
        Object.entries(categorySales)
        .sort((a, b) =>
            b[1].sales - a[1].sales
        );


    if (categories.length === 0) {

        container.innerHTML = `
            <div class="empty-report">
                No sales data available
            </div>
        `;

        return;

    }


    const maxSales =
        Math.max(
            ...categories.map(item => item[1].sales)
        );


    container.innerHTML =
        categories.map(([name, data]) => {

            const percentage =
                maxSales > 0
                    ? (data.sales / maxSales) * 100
                    : 0;


            return `

                <div class="report-item">

                    <div class="report-item-header">

                        <span class="report-item-name">
                            ${escapeHTML(name)}
                        </span>

                        <span class="report-item-value">
                            ${formatReportMoney(data.sales)}
                        </span>

                    </div>

                    <div class="report-item-bar-container">

                        <div
                            class="report-item-bar"
                            style="width:${percentage}%"
                        ></div>

                    </div>

                </div>

            `;

        }).join("");

}


/* ---------------------------------------------------------
   DAILY SALES
--------------------------------------------------------- */

function renderDailySales(dailySales) {

    const container =
        document.getElementById("dailySalesReport");


    if (!container) return;


    const days =
        Object.entries(dailySales)
        .sort((a, b) =>
            a[0].localeCompare(b[0])
        );


    if (days.length === 0) {

        container.innerHTML = `
            <div class="empty-report">
                No sales data available
            </div>
        `;

        return;

    }


    const maxSales =
        Math.max(
            ...days.map(item => item[1])
        );


    container.innerHTML =
        days.map(([date, sales]) => {

            const percentage =
                maxSales > 0
                    ? (sales / maxSales) * 100
                    : 0;


            const formattedDate =
                new Date(
                    date + "T00:00:00"
                ).toLocaleDateString(
                    "en-IN",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                    }
                );


            return `

                <div class="daily-sale-row">

                    <div class="daily-sale-date">
                        ${formattedDate}
                    </div>

                    <div class="daily-sale-bar-container">

                        <div
                            class="daily-sale-bar"
                            style="width:${percentage}%"
                        ></div>

                    </div>

                    <div class="daily-sale-value">
                        ${formatReportMoney(sales)}
                    </div>

                </div>

            `;

        }).join("");

}


/* ---------------------------------------------------------
   EXPORT CSV
--------------------------------------------------------- */

function exportReportCSV() {

    const bills = getReportBills();

    if (bills.length === 0) {

        alert("No bills available for this report.");

        return;

    }


    const rows = [

        [
            "Bill No",
            "Date",
            "Customer",
            "Phone",
            "Order Type",
            "Payment",
            "Subtotal",
            "Discount",
            "CGST",
            "SGST",
            "Grand Total"
        ]

    ];


    bills.forEach(bill => {

        const date =
            getBillDate(bill);


        const items =
            bill.items ||
            bill.cart ||
            [];


        const subtotal =
            Number(
                bill.subtotal ||
                items.reduce(
                    (sum, item) =>
                        sum +
                        Number(item.price || 0) *
                        Number(item.quantity || item.qty || 1),
                    0
                )
            );


        rows.push([

            bill.billNo ||
            bill.billNumber ||
            "",

            isNaN(date.getTime())
                ? ""
                : date.toLocaleString("en-IN"),

            bill.customerName ||
            bill.customer ||
            "Walk-in Customer",

            bill.phone ||
            "",

            bill.orderType ||
            "Dine In",

            bill.paymentMethod ||
            bill.payment ||
            "Cash",

            subtotal.toFixed(2),

            Number(
                bill.discount || 0
            ).toFixed(2),

            Number(
                bill.cgst || 0
            ).toFixed(2),

            Number(
                bill.sgst || 0
            ).toFixed(2),

            getBillTotal(bill).toFixed(2)

        ]);

    });


    const costData = getReportCostData();
    rows.push([]);
    rows.push(["Cost Summary"]);
    rows.push(["Salary Paid", costData.salaryExpenses.toFixed(2)]);
    rows.push(["Purchases", costData.purchaseExpenses.toFixed(2)]);
    rows.push(["Fixed Operating Expenses", costData.fixedExpense.toFixed(2)]);
    rows.push(["Salary Pending", costData.salaryPending.toFixed(2)]);
    rows.push(["Total Expenses", costData.totalExpenses.toFixed(2)]);
    rows.push(["Net Profit", (calculateReportData(bills).totalSales - costData.totalExpenses).toFixed(2)]);

    const csv = rows
        .map(row =>
            row.map(csvEscape).join(",")
        )
        .join("\n");


    const blob =
        new Blob(
            [csv],
            {
                type: "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;

    link.download =
        `Sri-Tabemashou-Report-${getLocalDateString(new Date())}.csv`;


    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);


    URL.revokeObjectURL(url);

}


/* ---------------------------------------------------------
   CSV ESCAPE
--------------------------------------------------------- */

function csvEscape(value) {

    const text =
        String(value ?? "");


    if (
        text.includes(",") ||
        text.includes('"') ||
        text.includes("\n")
    ) {

        return `"${text.replace(/"/g, '""')}"`;

    }


    return text;

}


/* ---------------------------------------------------------
   PRINT REPORT
--------------------------------------------------------- */

function printReport() {

    const bills =
        getReportBills();


    const data =
        calculateReportData(bills);


    const period =
        document.getElementById("reportPeriod")
        ?.selectedOptions[0]
        ?.textContent ||
        "Report";


    const reportArea =
        document.getElementById("reportPrintArea");


    if (!reportArea) return;


    const topItems =
        Object.entries(data.itemSales)
        .sort((a, b) =>
            b[1].quantity - a[1].quantity
        )
        .slice(0, 10);


    const categories =
        Object.entries(data.categorySales)
        .sort((a, b) =>
            b[1].sales - a[1].sales
        );


    const days =
        Object.entries(data.dailySales)
        .sort((a, b) =>
            a[0].localeCompare(b[0])
        );


    let html = `

        <div class="report-print-title">

            <h1>Sri Tabemashou</h1>

            <p>Sales Report - ${period}</p>

            <p>
                Generated:
                ${new Date().toLocaleString("en-IN")}
            </p>

        </div>


        <div class="report-print-section">

            <h2>Sales Summary</h2>

            <table class="report-print-table">

                <tr>
                    <th>Total Sales</th>
                    <td>${formatReportMoney(data.totalSales)}</td>
                </tr>

                <tr>
                    <th>Total Bills</th>
                    <td>${bills.length}</td>
                </tr>

                <tr>
                    <th>Average Bill</th>
                    <td>
                        ${formatReportMoney(
                            bills.length
                                ? data.totalSales / bills.length
                                : 0
                        )}
                    </td>
                </tr>

                <tr>
                    <th>Total Discount</th>
                    <td>${formatReportMoney(data.totalDiscount)}</td>
                </tr>

                <tr>
                    <th>CGST</th>
                    <td>${formatReportMoney(data.totalCGST)}</td>
                </tr>

                <tr>
                    <th>SGST</th>
                    <td>${formatReportMoney(data.totalSGST)}</td>
                </tr>

            </table>

        </div>


        <div class="report-print-section">

            <h2>Payment Breakdown</h2>

            <table class="report-print-table">

                <tr>
                    <th>Cash</th>
                    <td>${formatReportMoney(data.cashSales)}</td>
                </tr>

                <tr>
                    <th>UPI</th>
                    <td>${formatReportMoney(data.upiSales)}</td>
                </tr>

                <tr>
                    <th>Card</th>
                    <td>${formatReportMoney(data.cardSales)}</td>
                </tr>

            </table>

        </div>


        <div class="report-print-section">

            <h2>Order Type</h2>

            <table class="report-print-table">

                <tr>
                    <th>Dine In</th>
                    <td>${formatReportMoney(data.dineInSales)}</td>
                </tr>

                <tr>
                    <th>Take Away</th>
                    <td>${formatReportMoney(data.takeAwaySales)}</td>
                </tr>

                <tr>
                    <th>Delivery</th>
                    <td>${formatReportMoney(data.deliverySales)}</td>
                </tr>

            </table>

        </div>


        <div class="report-print-section">

            <h2>Top Selling Items</h2>

            <table class="report-print-table">

                <tr>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Sales</th>
                </tr>

                ${topItems.map(([name, item]) => `

                    <tr>

                        <td>${escapeHTML(name)}</td>

                        <td>${item.quantity}</td>

                        <td>
                            ${formatReportMoney(item.sales)}
                        </td>

                    </tr>

                `).join("")}

            </table>

        </div>


        <div class="report-print-section">

            <h2>Category Sales</h2>

            <table class="report-print-table">

                <tr>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Sales</th>
                </tr>

                ${categories.map(([name, category]) => `

                    <tr>

                        <td>${escapeHTML(name)}</td>

                        <td>${category.quantity}</td>

                        <td>
                            ${formatReportMoney(category.sales)}
                        </td>

                    </tr>

                `).join("")}

            </table>

        </div>


        <div class="report-print-section">

            <h2>Cost Summary &amp; Profit / Loss</h2>

            <table class="report-print-table">
                <tr><th>Salary Paid</th><td>${formatReportMoney(getReportCostData().salaryExpenses)}</td></tr>
                <tr><th>Purchases</th><td>${formatReportMoney(getReportCostData().purchaseExpenses)}</td></tr>
                <tr><th>Total Expenses</th><td>${formatReportMoney(getReportCostData().totalExpenses)}</td></tr>
                <tr><th>Net Profit</th><td>${formatReportMoney(data.totalSales - getReportCostData().totalExpenses)}</td></tr>
            </table>

        </div>

        <div class="report-print-section">

            <h2>Daily Sales</h2>

            <table class="report-print-table">

                <tr>
                    <th>Date</th>
                    <th>Sales</th>
                </tr>

                ${days.map(([date, sales]) => `

                    <tr>

                        <td>${date}</td>

                        <td>
                            ${formatReportMoney(sales)}
                        </td>

                    </tr>

                `).join("")}

            </table>

        </div>

    `;


    reportArea.innerHTML = html;


    document.body.classList.add("report-print-mode");


    setTimeout(() => {

        window.print();

    }, 200);


    setTimeout(() => {

        document.body.classList.remove("report-print-mode");

    }, 1000);

}


/* ---------------------------------------------------------
   LOAD REPORTS WHEN REPORT PAGE OPENS
--------------------------------------------------------- */

const previousShowPageForReports = showPage;

showPage = function(page, clickedButton) {

    previousShowPageForReports(
        page,
        clickedButton
    );

    if (page === "reports") {
        renderReports();
    }

};


/* ---------------------------------------------------------
   INITIALIZE REPORT DATE
--------------------------------------------------------- */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const customFields =
            document.getElementById(
                "customDateFields"
            );


        if (customFields) {

            customFields.classList.add("hidden");

        }


        renderReports();

    }
);



/* =========================================================
   STEP 5 - SETTINGS
========================================================= */


/* ---------------------------------------------------------
   DEFAULT SETTINGS
--------------------------------------------------------- */

const defaultPOSSettings = {

    restaurant: {

        name: "Sri Tabemashou",

        phone: "",

        email: "",

        address: "",

        gstin: "",

        fssai: ""

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

    }

};


/* ---------------------------------------------------------
   GET SETTINGS
--------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    const reportPeriod = document.getElementById("reportPeriod");
    if (reportPeriod) reportPeriod.value = reportPeriod.value || "month";
    renderReports();
});
