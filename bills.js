/* Sri Tabemashou POS - bills.js */
function getSavedBills() {

    return JSON.parse(
        firebaseStore.getItem(
            "sriTabemashouBills"
        )
    ) || [];

}


/* =====================================================
   RENDER BILL HISTORY
===================================================== */

function renderBillHistory() {

    const table =
        document.getElementById(
            "billHistoryTable"
        );


    if (!table) return;


    let bills =
        getSavedBills();


    const search =
        (
            document.getElementById(
                "billSearch"
            )?.value || ""
        )
        .trim()
        .toLowerCase();


    const dateFilter =
        document.getElementById(
            "billDateFilter"
        )?.value || "";


    const paymentFilter =
        document.getElementById(
            "billPaymentFilter"
        )?.value || "All";


    const orderFilter =
        document.getElementById(
            "billOrderFilter"
        )?.value || "All";

    const statusFilter =
        document.getElementById("billStatusFilter")?.value || "All";


    bills =
        bills.filter(
            bill => {

                const statusMatch = statusFilter === "All" || (statusFilter === "Completed" ? (bill.status || "completed") === "completed" : bill.status === "voided");

                /* SEARCH */

                const searchMatch =
                    !search ||

                    String(
                        bill.billNumber
                    )
                    .toLowerCase()
                    .includes(search)

                    ||

                    String(
                        bill.customerName ||
                        ""
                    )
                    .toLowerCase()
                    .includes(search)

                    ||

                    String(
                        bill.customerPhone ||
                        ""
                    )
                    .toLowerCase()
                    .includes(search);


                /* DATE */

                let dateMatch = true;


                if (dateFilter) {

                    const billDate =
                        new Date(
                            bill.date
                        );


                    const localDate =
                        billDate
                            .toLocaleDateString(
                                "en-CA"
                            );


                    dateMatch =
                        localDate ===
                        dateFilter;

                }


                /* PAYMENT */

                const paymentMatch =
                    paymentFilter ===
                    "All" ||

                    bill.paymentMethod ===
                    paymentFilter;


                /* ORDER */

                const orderMatch =
                    orderFilter ===
                    "All" ||

                    bill.orderType ===
                    orderFilter;


                return (
                    searchMatch &&
                    dateMatch &&
                    paymentMatch &&
                    orderMatch &&
                    statusMatch
                );

            }
        );


    /* NEWEST FIRST */

    bills.sort(
        (a,b) =>
            new Date(b.date) -
            new Date(a.date)
    );


    table.innerHTML = "";


    if (
        bills.length === 0
    ) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="8"
                    style="
                        text-align:center;
                        padding:60px;
                        color:#999;
                    "
                >

                    <div style="
                        font-size:40px;
                        margin-bottom:10px;
                    ">
                        🧾
                    </div>

                    <strong>
                        No bills found
                    </strong>

                    <div style="
                        margin-top:5px;
                        font-size:11px;
                    ">
                        Saved bills will appear here.
                    </div>

                </td>

            </tr>

        `;


        updateBillStatistics(
            bills
        );

        return;

    }


    bills.forEach(
        bill => {

            const row =
                document.createElement(
                    "tr"
                );


            const date =
                new Date(
                    bill.date
                );


            const formattedDate =
                date.toLocaleDateString(
                    "en-IN",
                    {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                    }
                );


            const formattedTime =
                date.toLocaleTimeString(
                    "en-IN",
                    {
                        hour: "2-digit",
                        minute: "2-digit"
                    }
                );


            const customer =
                bill.customerName ||
                "Walk-in Customer";


            const phone =
                bill.customerPhone ||
                "";


            const itemCount =
                bill.items
                    ?.reduce(
                        (
                            total,
                            item
                        ) =>
                            total +
                            Number(
                                item.quantity
                            ),
                        0
                    ) || 0;


            let paymentClass =
                "payment-cash";


            if (
                bill.paymentMethod ===
                "UPI"
            ) {

                paymentClass =
                    "payment-upi";

            }


            if (
                bill.paymentMethod ===
                "Card"
            ) {

                paymentClass =
                    "payment-card";

            }


            row.innerHTML = `

                <td>

                    <span class="
                        bill-number-cell
                    ">

                        ${escapeHTML(
                            bill.billNumber
                        )}

                    </span>

                </td>


                <td>

                    <div class="bill-date">

                        ${formattedDate}

                        <br>

                        ${formattedTime}

                    </div>

                </td>


                <td>

                    <div class="
                        customer-cell
                    ">

                        <strong>

                            ${escapeHTML(
                                customer
                            )}

                        </strong>


                        ${
                            phone
                                ? `
                                    <small>
                                        ${escapeHTML(
                                            phone
                                        )}
                                    </small>
                                  `
                                : ""
                        }

                    </div>

                </td>


                <td>

                    <span class="
                        order-badge
                    ">

                        ${escapeHTML(
                            bill.orderType ||
                            "-"
                        )}

                    </span>

                </td>


                <td>

                    <span class="
                        items-count
                    ">

                        ${itemCount}
                        item${itemCount !== 1
                            ? "s"
                            : ""}

                    </span>

                </td>


                <td>

                    <span class="
                        payment-badge
                        ${paymentClass}
                    ">

                        ${escapeHTML(
                            bill.paymentMethod ||
                            "-"
                        )}

                    </span>

                </td>


                <td>

                    <span class="
                        bill-total
                    ">

                        ₹${Number(
                            bill.grandTotal || 0
                        ).toFixed(2)}

                    </span>

                </td>


                <td>

                    <div class="
                        history-actions
                    ">


                        <button
                            class="
                                history-action
                                view-bill-action
                            "
                            title="View Bill"
                            onclick="
                                viewBill(
                                    '${escapeJS(
                                        bill.billNumber
                                    )}'
                                )
                            ">

                            👁️

                        </button>


                        <button
                            class="
                                history-action
                                print-bill-action
                            "
                            title="Print Bill"
                            onclick="
                                reprintBill(
                                    '${escapeJS(
                                        bill.billNumber
                                    )}'
                                )
                            ">

                            🖨️

                        </button>


                        ${typeof hasPermission === "function" && hasPermission("bills.void") ? `
                        <button
                            class="history-action"
                            title="Void Bill"
                            onclick="voidBill('${escapeJS(bill.billNumber)}')">
                            ↩️
                        </button>` : ""}

                        <button
                            class="
                                history-action
                                delete-bill-action
                            "
                            title="Delete Bill"
                            onclick="
                                deleteBill(
                                    '${escapeJS(
                                        bill.billNumber
                                    )}'
                                )
                            ">

                            🗑️

                        </button>

                    </div>

                </td>

            `;


            table.appendChild(
                row
            );

        }
    );


    updateBillStatistics(
        bills
    );

}


/* =====================================================
   BILL STATISTICS
===================================================== */

function updateBillStatistics(
    bills
) {

    const allBills =
        getSavedBills();


    const totalSales =
        bills.reduce(
            (
                total,
                bill
            ) =>
                total +
                Number(
                    bill.grandTotal || 0
                ),
            0
        );


    const cashSales =
        bills
            .filter(
                bill =>
                    bill.paymentMethod ===
                    "Cash"
            )
            .reduce(
                (
                    total,
                    bill
                ) =>
                    total +
                    Number(
                        bill.grandTotal || 0
                    ),
                0
            );


    const upiSales =
        bills
            .filter(
                bill =>
                    bill.paymentMethod ===
                    "UPI"
            )
            .reduce(
                (
                    total,
                    bill
                ) =>
                    total +
                    Number(
                        bill.grandTotal || 0
                    ),
                0
            );


    const cardSales =
        bills
            .filter(
                bill =>
                    bill.paymentMethod ===
                    "Card"
            )
            .reduce(
                (
                    total,
                    bill
                ) =>
                    total +
                    Number(
                        bill.grandTotal || 0
                    ),
                0
            );


    const average =
        bills.length
            ? totalSales /
              bills.length
            : 0;


    setText(
        "historyBillCount",
        bills.length
    );


    setText(
        "historyTotalSales",
        totalSales.toFixed(2)
    );


    setText(
        "historyAverageBill",
        average.toFixed(2)
    );


    setText(
        "historyCashSales",
        cashSales.toFixed(2)
    );


    setText(
        "historyUPISales",
        upiSales.toFixed(2)
    );


    setText(
        "historyCardSales",
        cardSales.toFixed(2)
    );

}


/* =====================================================
   VIEW BILL
===================================================== */

function viewBill(
    billNumber
) {

    const bills =
        getSavedBills();


    const bill =
        bills.find(
            item =>
                item.billNumber ===
                billNumber
        );


    if (!bill) {

        alert(
            "Bill could not be found."
        );

        return;

    }


    const container =
        document.getElementById(
            "billViewContent"
        );


    const date =
        new Date(
            bill.date
        );


    const formattedDate =
        date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );


    const formattedTime =
        date.toLocaleTimeString(
            "en-IN",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );


    let itemsHTML = "";


    bill.items.forEach(
        item => {

            const itemTotal =
                Number(item.price) *
                Number(item.quantity);


            itemsHTML += `

                <tr>

                    <td>

                        ${escapeHTML(
                            item.name
                        )}

                    </td>

                    <td>
                        ${item.quantity}
                    </td>

                    <td>
                        ₹${Number(
                            item.price
                        ).toFixed(2)}
                    </td>

                    <td>
                        ₹${itemTotal.toFixed(2)}
                    </td>

                </tr>

            `;

        }
    );


    container.innerHTML = `

        <div style="padding:20px;">


            <div class="
                bill-view-header
            ">

                <h2>
                    Sri Tabemashou
                </h2>

                <p>
                    Restaurant & Family Dining
                </p>

            </div>


            <div class="
                bill-view-info
            ">


                <div>

                    <span>
                        Bill Number
                    </span>

                    <strong>
                        ${escapeHTML(
                            bill.billNumber
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Date
                    </span>

                    <strong>
                        ${formattedDate}
                    </strong>

                </div>


                <div>

                    <span>
                        Time
                    </span>

                    <strong>
                        ${formattedTime}
                    </strong>

                </div>


                <div>

                    <span>
                        Customer
                    </span>

                    <strong>
                        ${escapeHTML(
                            bill.customerName ||
                            "Walk-in Customer"
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Order Type
                    </span>

                    <strong>
                        ${escapeHTML(
                            bill.orderType ||
                            "-"
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Table
                    </span>

                    <strong>
                        ${escapeHTML(
                            bill.tableNumber ||
                            "-"
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Payment
                    </span>

                    <strong>
                        ${escapeHTML(
                            bill.paymentMethod ||
                            "-"
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Phone
                    </span>

                    <strong>
                        ${escapeHTML(
                            bill.customerPhone ||
                            "-"
                        )}
                    </strong>

                </div>

            </div>



            <table class="
                bill-view-items
            ">

                <thead>

                    <tr>

                        <th>
                            Item
                        </th>

                        <th>
                            Qty
                        </th>

                        <th>
                            Price
                        </th>

                        <th>
                            Total
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${itemsHTML}

                </tbody>

            </table>



            <div class="
                bill-view-total
            ">

                <div>

                    <span>
                        Subtotal
                    </span>

                    <strong>
                        ₹${Number(
                            bill.subtotal || 0
                        ).toFixed(2)}
                    </strong>

                </div>


                <div>

                    <span>
                        Discount
                    </span>

                    <strong>
                        ₹${Number(
                            bill.discount || 0
                        ).toFixed(2)}
                    </strong>

                </div>


                <div>

                    <span>
                        CGST
                    </span>

                    <strong>
                        ₹${Number(
                            bill.cgst || 0
                        ).toFixed(2)}
                    </strong>

                </div>


                <div>

                    <span>
                        SGST
                    </span>

                    <strong>
                        ₹${Number(
                            bill.sgst || 0
                        ).toFixed(2)}
                    </strong>

                </div>


                <div class="grand">

                    <span>
                        Grand Total
                    </span>

                    <strong>
                        ₹${Number(
                            bill.grandTotal || 0
                        ).toFixed(2)}
                    </strong>

                </div>

            </div>

        </div>

    `;


    const printButton =
        document.getElementById(
            "modalPrintButton"
        );


    printButton.onclick =
        function () {

            closeBillView();

            reprintBill(
                billNumber
            );

        };


    document.getElementById(
        "billViewModal"
    ).classList.add(
        "show"
    );

}


/* =====================================================
   CLOSE BILL VIEW
===================================================== */

function closeBillView() {

    document.getElementById(
        "billViewModal"
    ).classList.remove(
        "show"
    );

}


/* =====================================================
   REPRINT BILL
===================================================== */

function reprintBill(
    billNumber
) {

    const bills =
        getSavedBills();


    const bill =
        bills.find(
            item =>
                item.billNumber ===
                billNumber
        );


    if (!bill) {

        alert(
            "Bill could not be found."
        );

        return;

    }


    /*
       Temporarily populate the
       existing print template.
    */


    setText(
        "printBillNumber",
        bill.billNumber
    );


    setText(
        "printDate",
        new Date(
            bill.date
        ).toLocaleString(
            "en-IN"
        )
    );


    setText(
        "printCustomer",
        bill.customerName ||
        "Walk-in Customer"
    );


    setText(
        "printOrderType",
        bill.orderType ||
        "-"
    );


    setText(
        "printTable",
        bill.tableNumber ||
        "-"
    );


    setText(
        "printSubtotal",
        Number(
            bill.subtotal || 0
        ).toFixed(2)
    );


    setText(
        "printDiscount",
        Number(
            bill.discount || 0
        ).toFixed(2)
    );


    setText(
        "printCGST",
        Number(
            bill.cgst || 0
        ).toFixed(2)
    );


    setText(
        "printSGST",
        Number(
            bill.sgst || 0
        ).toFixed(2)
    );


    setText(
        "printGrandTotal",
        Number(
            bill.grandTotal || 0
        ).toFixed(2)
    );


    setText(
        "printPayment",
        bill.paymentMethod ||
        "-"
    );


    const printItems =
        document.getElementById(
            "printItems"
        );


    printItems.innerHTML = "";


    bill.items.forEach(
        item => {

            const row =
                document.createElement(
                    "tr"
                );


            const total =
                Number(item.price) *
                Number(item.quantity);


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
                    ₹${Number(
                        item.price
                    ).toFixed(2)}
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


    window.print();

}


/* =====================================================
   DELETE BILL
===================================================== */

function deleteBill(
    billNumber
) {
    if (typeof hasPermission === "function" && !hasPermission("bills.delete")) {
        alert("You do not have permission to delete bills.");
        return;
    }


    const bills =
        getSavedBills();


    const bill =
        bills.find(
            item =>
                item.billNumber ===
                billNumber
        );


    if (!bill) return;


    const confirmed =
        confirm(
            `Delete bill ${billNumber}?\n\nThis action cannot be undone.`
        );


    if (!confirmed) {

        return;

    }


    const updatedBills =
        bills.filter(
            item =>
                item.billNumber !==
                billNumber
        );


    firebaseStore.setItem(
        "sriTabemashouBills",
        JSON.stringify(
            updatedBills
        )
    );


    renderBillHistory();


    alert(
        `Bill ${billNumber} deleted.`
    );

}


/* =====================================================
   RESET FILTERS
===================================================== */

function resetBillFilters() {

    const search =
        document.getElementById(
            "billSearch"
        );


    const date =
        document.getElementById(
            "billDateFilter"
        );


    const payment =
        document.getElementById(
            "billPaymentFilter"
        );


    const order =
        document.getElementById(
            "billOrderFilter"
        );

    const status = document.getElementById("billStatusFilter");


    if (search)
        search.value = "";


    if (date)
        date.value = "";


    if (payment)
        payment.value = "All";


    if (order)
        order.value = "All";


    renderBillHistory();

}


/* =====================================================
   UPDATE PAGE NAVIGATION
===================================================== */

const originalShowPageWithBills = showPage;

showPage = function(page, clickedButton) {

    originalShowPageWithBills(
        page,
        clickedButton
    );


    if (page === "bills") {

        renderBillHistory();

    }


    if (page === "reports") {

        renderReports();

    }

};


/* =====================================================
   ESCAPE JAVASCRIPT STRING
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    renderBillHistory();
    updateBillStatistics();
});


function voidBill(billNumber) {
    if (typeof hasPermission === "function" && !hasPermission("bills.void")) { alert("You do not have permission to void bills."); return; }
    const bills = getSavedBills(); const index = bills.findIndex(b => String(b.billNumber) === String(billNumber));
    if (index < 0) return; const bill = bills[index];
    if ((bill.status || "completed") === "voided") { alert("This bill is already voided."); return; }
    const reason = prompt(`Void bill ${billNumber}. Enter reason:`, "Customer cancellation"); if (reason === null) return;
    if (typeof window.reverseInventoryForBill === "function") window.reverseInventoryForBill(bill, "void");
    bill.status = "voided"; bill.voidReason = reason.trim() || "No reason provided"; bill.voidedAt = new Date().toISOString();
    const user = typeof getCurrentUser === "function" ? getCurrentUser() : null; bill.voidedBy = user?.name || user?.username || "Unknown";
    firebaseStore.setItem("sriTabemashouBills", JSON.stringify(bills));
    if (typeof addAuditLog === "function") addAuditLog("Bill Voided", `${billNumber} • ${bill.voidReason}`);
    renderBillHistory(); alert(`Bill ${billNumber} was voided.`);
}
