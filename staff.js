/* Sri Tabemashou POS - staff.js */

const STAFF_ATTENDANCE_STORAGE_KEY = "sriTabemashouStaffAttendance";
let staffAttendanceList = JSON.parse(firebaseStore.getItem(STAFF_ATTENDANCE_STORAGE_KEY)) || [];
let currentAttendanceDate = "";
let staffList = JSON.parse(
    firebaseStore.getItem("sriTabemashouStaff")
) || [];

const STAFF_SALARY_PAYMENTS_STORAGE_KEY = "sriTabemashouSalaryPayments";
let salaryPaymentsList = JSON.parse(
    firebaseStore.getItem(STAFF_SALARY_PAYMENTS_STORAGE_KEY)
) || [];
if (!Array.isArray(salaryPaymentsList)) salaryPaymentsList = [];

// Expose live getters for optional Firebase sync without changing existing code flow.
try {
    Object.defineProperty(window, "staffList", { configurable: true, get: () => staffList });
    Object.defineProperty(window, "staffAttendanceList", { configurable: true, get: () => staffAttendanceList });
    Object.defineProperty(window, "salaryPaymentsList", { configurable: true, get: () => salaryPaymentsList });
} catch (_) {}


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

function openStaffModal(staff = null) {
    if (typeof hasPermission === "function" && !hasPermission("staff.manage")) {
        alert("You do not have permission to manage staff.");
        return;
    }


    if (!staffModal || !staffForm) {
        console.error("Staff modal or form not found.");
        return;
    }

    /* Show modal */
    staffModal.classList.add("active");

    /* Force modal to display */
    staffModal.style.display = "flex";

    /* EDIT STAFF */
    if (staff) {

        document.getElementById(
            "staffModalTitle"
        ).textContent = "Edit Staff";

        document.getElementById(
            "staffId"
        ).value = staff.id || "";

        document.getElementById(
            "staffName"
        ).value = staff.name || "";

        document.getElementById(
            "staffPhone"
        ).value = staff.phone || "";

        document.getElementById(
            "staffRole"
        ).value = staff.role || "";

        document.getElementById(
            "staffShift"
        ).value = staff.shift || "Morning";

        document.getElementById(
            "staffJoiningDate"
        ).value = staff.joiningDate || "";

        document.getElementById(
            "staffStatus"
        ).value = staff.status || "Active";

        document.getElementById(
            "staffAddress"
        ).value = staff.address || "";

        const salaryInput = document.getElementById("staffSalary");
        if (salaryInput) {
            salaryInput.value = staff.salary !== undefined && staff.salary !== null
                ? staff.salary
                : "";
        }

    }

    /* ADD NEW STAFF */
    else {

        document.getElementById(
            "staffModalTitle"
        ).textContent = "Add Staff";

        staffForm.reset();

        document.getElementById(
            "staffId"
        ).value = "";

        document.getElementById(
            "staffStatus"
        ).value = "Active";
    }

    /* Put cursor in name field */
    setTimeout(() => {

        const nameInput =
            document.getElementById("staffName");

        if (nameInput) {
            nameInput.focus();
        }

    }, 100);
}


/* =====================================================
   CLOSE STAFF FORM
===================================================== */

function closeStaffModalFunction() {

    if (!staffModal) return;

    staffModal.classList.remove("active");

    /* Hide modal */
    staffModal.style.display = "none";

    if (staffForm) {
        staffForm.reset();
    }
}


/* =====================================================
   ADD STAFF BUTTON
===================================================== */

if (addStaffBtn) {

    addStaffBtn.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            openStaffModal();

        }
    );

}


/* =====================================================
   CLOSE BUTTON
===================================================== */

if (closeStaffModal) {

    closeStaffModal.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            closeStaffModalFunction();

        }
    );

}


/* =====================================================
   CANCEL BUTTON
===================================================== */

if (cancelStaffBtn) {

    cancelStaffBtn.addEventListener(
        "click",
        function(event) {

            event.preventDefault();

            closeStaffModalFunction();

        }
    );

}


/* =====================================================
   CLOSE WHEN CLICKING OUTSIDE
===================================================== */

if (staffModal) {

    staffModal.addEventListener(
        "click",
        function(event) {

            if (event.target === staffModal) {

                closeStaffModalFunction();

            }

        }
    );

}


/* =====================================================
   SAVE STAFF
===================================================== */

if (staffForm) {

    staffForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();

            const id =
                document.getElementById(
                    "staffId"
                ).value.trim();


            const name =
                document.getElementById(
                    "staffName"
                ).value.trim();


            const phone =
                document.getElementById(
                    "staffPhone"
                ).value.trim();


            const role =
                document.getElementById(
                    "staffRole"
                ).value;


            const shift =
                document.getElementById(
                    "staffShift"
                ).value;


            const joiningDate =
                document.getElementById(
                    "staffJoiningDate"
                ).value;


            const status =
                document.getElementById(
                    "staffStatus"
                ).value;


            const address =
                document.getElementById(
                    "staffAddress"
                ).value.trim();


            const salaryInput = document.getElementById("staffSalary");
            const salary = salaryInput ? Number(salaryInput.value) || 0 : 0;


            /* REQUIRED FIELD */
            if (!name) {

                alert(
                    "Please enter staff name."
                );

                document.getElementById(
                    "staffName"
                ).focus();

                return;
            }


            if (!phone) {

                alert(
                    "Please enter staff phone number."
                );

                document.getElementById(
                    "staffPhone"
                ).focus();

                return;
            }


            if (!role) {

                alert(
                    "Please select staff role."
                );

                document.getElementById(
                    "staffRole"
                ).focus();

                return;
            }


            if (salary < 0) {

                alert("Please enter a valid monthly salary.");

                if (salaryInput) salaryInput.focus();

                return;
            }


            const staffData = {

                id:
                    id ||
                    Date.now().toString(),

                name: name,

                phone: phone,

                role: role,

                shift:
                    shift || "Morning",

                joiningDate:
                    joiningDate,

                status:
                    status || "Active",

                address:
                    address,

                salary:
                    salary

            };


            /* EDIT */
            if (id) {

                const index =
                    staffList.findIndex(
                        staff =>
                            staff.id === id
                    );

                if (index !== -1) {

                    staffList[index] =
                        staffData;

                }

            }

            /* ADD */
            else {

                staffList.push(
                    staffData
                );

            }


            saveStaffData();

            renderStaff();

            closeStaffModalFunction();


            alert(
                id
                    ? "Staff details updated successfully!"
                    : "Staff member added successfully!"
            );

        }
    );

}


/* =====================================================
   SAVE STAFF DATA
===================================================== */

function saveStaffData() {

    firebaseStore.setItem(
        "sriTabemashouStaff",
        JSON.stringify(staffList)
    );

    if (typeof window.syncStaffToFirebase === "function") {
        window.syncStaffToFirebase(staffList);
    }

}


/* =====================================================
   RENDER STAFF
===================================================== */

function renderStaff() {

    if (!staffTableBody) return;

    const searchValue =
        staffSearch
            ? staffSearch.value
                .toLowerCase()
                .trim()
            : "";


    const roleValue =
        staffRoleFilter
            ? staffRoleFilter.value
            : "all";


    const statusValue =
        staffStatusFilter
            ? staffStatusFilter.value
            : "all";


    const filteredStaff =
        staffList.filter(
            staff => {

                const name =
                    String(
                        staff.name || ""
                    ).toLowerCase();


                const phone =
                    String(
                        staff.phone || ""
                    ).toLowerCase();


                const matchesSearch =
                    name.includes(
                        searchValue
                    ) ||
                    phone.includes(
                        searchValue
                    );


                const matchesRole =
                    roleValue === "all" ||
                    staff.role ===
                        roleValue;


                const matchesStatus =
                    statusValue === "all" ||
                    staff.status ===
                        statusValue;


                return (
                    matchesSearch &&
                    matchesRole &&
                    matchesStatus
                );

            }
        );


    staffTableBody.innerHTML = "";


    if (
        filteredStaff.length === 0
    ) {

        if (noStaffMessage) {

            noStaffMessage.style.display =
                "block";

        }

    }

    else {

        if (noStaffMessage) {

            noStaffMessage.style.display =
                "none";

        }


        filteredStaff.forEach(
            staff => {

                const row =
                    document.createElement(
                        "tr"
                    );


                const initial =
                    staff.name
                        ? staff.name
                            .charAt(0)
                            .toUpperCase()
                        : "?";


                row.innerHTML = `

                    <td>

                        <div class="staff-profile">

                            <div class="staff-avatar">
                                ${initial}
                            </div>

                            <div>

                                <div class="staff-name">
                                    ${escapeStaffHTML(
                                        staff.name
                                    )}
                                </div>

                                <div class="staff-role-text">
                                    ${escapeStaffHTML(
                                        staff.role
                                    )}
                                </div>

                            </div>

                        </div>

                    </td>

                    <td>
                        ${escapeStaffHTML(
                            staff.phone
                        )}
                    </td>

                    <td>

                        <span class="staff-role-badge">
                            ${escapeStaffHTML(
                                staff.role
                            )}
                        </span>

                    </td>

                    <td>
                        ${escapeStaffHTML(
                            staff.shift || "-"
                        )}
                    </td>

                    <td>
                        ${formatStaffDate(
                            staff.joiningDate
                        )}
                    </td>

                    <td>

                        <span class="staff-status ${
                            staff.status ===
                            "Active"
                                ? "active"
                                : "inactive"
                        }">

                            ${
                                staff.status ===
                                "Active"
                                    ? "● Active"
                                    : "● Inactive"
                            }

                        </span>

                    </td>

                    <td>

                        <div class="staff-actions">

                            <button
                                type="button"
                                class="staff-action-btn"
                                title="Edit"
                                onclick="editStaff('${staff.id}')"
                            >
                                ✏️
                            </button>

                            <button
                                type="button"
                                class="staff-action-btn delete"
                                title="Delete"
                                onclick="deleteStaff('${staff.id}')"
                            >
                                🗑️
                            </button>

                        </div>

                    </td>

                `;


                staffTableBody.appendChild(
                    row
                );

            }
        );

    }


    updateStaffStatistics();

}


/* =====================================================
   EDIT STAFF
===================================================== */

function editStaff(id) {
    if (typeof hasPermission === "function" && !hasPermission("staff.manage")) {
        alert("You do not have permission to manage staff.");
        return;
    }


    const staff =
        staffList.find(
            staff =>
                staff.id === id
        );


    if (!staff) return;


    openStaffModal(staff);

}


/* =====================================================
   DELETE STAFF
===================================================== */

function deleteStaff(id) {
    if (typeof hasPermission === "function" && !hasPermission("staff.manage")) {
        alert("You do not have permission to manage staff.");
        return;
    }


    const staff =
        staffList.find(
            staff =>
                String(staff.id) === String(id)
        );


    if (!staff) return;


    const confirmed =
        confirm(
            `Delete ${staff.name}?

This will permanently delete the staff member and ALL of their attendance/salary-related records.

This action cannot be undone.`
        );


    if (!confirmed) return;


    /* Remove the staff member from the main staff list. */
    staffList =
        staffList.filter(
            staff =>
                String(staff.id) !== String(id)
        );


    /* Remove every attendance record belonging to this staff member. */
    if (Array.isArray(staffAttendanceList)) {
        staffAttendanceList =
            staffAttendanceList.filter(
                record =>
                    String(record.staffId) !== String(id)
            );

        saveStaffAttendanceData();
    }


    /* Save the updated staff list immediately. */
    saveStaffData();

    if (typeof window.deleteStaffFromFirebase === "function") {
        window.deleteStaffFromFirebase(id);
    }

    deleteSalaryPaymentsForStaff(id);

    /* Refresh all staff-related screens/tables immediately. */
    renderStaff();

    if (typeof renderStaffAttendance === "function") {
        renderStaffAttendance();
    }

    if (typeof renderStaffMonthlySummary === "function") {
        renderStaffMonthlySummary();
    }

    if (typeof renderStaffSalaryDashboard === "function") {
        renderStaffSalaryDashboard();
    }

}


/* =====================================================
   STAFF SEARCH
===================================================== */

if (staffSearch) {

    staffSearch.addEventListener(
        "input",
        renderStaff
    );

}


if (staffRoleFilter) {

    staffRoleFilter.addEventListener(
        "change",
        renderStaff
    );

}


if (staffStatusFilter) {

    staffStatusFilter.addEventListener(
        "change",
        renderStaff
    );

}


/* =====================================================
   STAFF STATISTICS
===================================================== */

function updateStaffStatistics() {

    const total =
        staffList.length;


    const active =
        staffList.filter(
            staff =>
                staff.status ===
                "Active"
        ).length;


    const inactive =
        staffList.filter(
            staff =>
                staff.status ===
                "Inactive"
        ).length;


    const chefs =
        staffList.filter(
            staff =>
                staff.role ===
                "Chef"
        ).length;


    const totalElement =
        document.getElementById(
            "totalStaffCount"
        );

    const activeElement =
        document.getElementById(
            "activeStaffCount"
        );

    const inactiveElement =
        document.getElementById(
            "inactiveStaffCount"
        );

    const chefElement =
        document.getElementById(
            "chefCount"
        );


    if (totalElement)
        totalElement.textContent =
            total;


    if (activeElement)
        activeElement.textContent =
            active;


    if (inactiveElement)
        inactiveElement.textContent =
            inactive;


    if (chefElement)
        chefElement.textContent =
            chefs;

}


/* =====================================================
   STAFF DATE
===================================================== */

function formatStaffDate(date) {

    if (!date) return "-";


    const parsed =
        new Date(date);


    if (isNaN(parsed.getTime())) {

        return date;

    }


    return parsed.toLocaleDateString(
        "en-IN"
    );

}


/* =====================================================
   STAFF HTML ESCAPE
===================================================== */

function escapeStaffHTML(value) {

    return String(value || "")
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =====================================================
   INITIAL STAFF LOAD
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        renderStaff();

        updateStaffStatistics();

    }
);

/* =====================================================
   STAFF ATTENDANCE - ADDITIVE FEATURE
   Uses a separate firebaseStore key so existing POS/staff
   data and logic remain unchanged.
===================================================== */

function getAttendanceLocalDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function getAttendanceMonthString(date = new Date()) {
    return getAttendanceLocalDateString(date).slice(0, 7);
}

function saveStaffAttendanceData() {
    firebaseStore.setItem(
        STAFF_ATTENDANCE_STORAGE_KEY,
        JSON.stringify(staffAttendanceList)
    );

    if (typeof window.syncStaffAttendanceToFirebase === "function") {
        window.syncStaffAttendanceToFirebase(staffAttendanceList);
    }
}

function getAttendanceRecord(date, staffId) {
    return staffAttendanceList.find(record =>
        record.date === date &&
        String(record.staffId) === String(staffId)
    );
}

function openStaffAttendance() {
    const staffSection = document.getElementById("staffPage");
    const attendanceSection = document.getElementById("staffAttendanceSection");

    if (!staffSection || !attendanceSection) return;

    staffSection.style.display = "none";
    attendanceSection.style.display = "block";

    const today = getAttendanceLocalDateString();
    const month = getAttendanceMonthString();

    const dateInput = document.getElementById("attendanceDate");
    const monthInput = document.getElementById("attendanceMonth");

    if (dateInput && !dateInput.value) dateInput.value = today;
    if (monthInput && !monthInput.value) monthInput.value = month;

    currentAttendanceDate = dateInput ? dateInput.value : today;

    renderStaffAttendance();
    renderStaffMonthlySummary();
}

function closeStaffAttendance() {
    const staffSection = document.getElementById("staffPage");
    const attendanceSection = document.getElementById("staffAttendanceSection");

    if (!staffSection || !attendanceSection) return;

    attendanceSection.style.display = "none";
    staffSection.style.display = "block";

    if (typeof renderStaff === "function") {
        renderStaff();
    }
}

function loadAttendanceForSelectedDate() {
    const dateInput = document.getElementById("attendanceDate");
    if (!dateInput || !dateInput.value) return;

    currentAttendanceDate = dateInput.value;
    renderStaffAttendance();
}

function markAllStaffPresent() {
    const dateInput = document.getElementById("attendanceDate");
    const date = dateInput && dateInput.value
        ? dateInput.value
        : getAttendanceLocalDateString();

    const activeStaff = Array.isArray(staffList)
        ? staffList.filter(staff => staff.status !== "Inactive")
        : [];

    if (activeStaff.length === 0) {
        alert("No active staff members found.");
        return;
    }

    activeStaff.forEach(staff => {
        const existing = getAttendanceRecord(date, staff.id);

        if (existing) {
            existing.status = "Present";
            existing.staffName = staff.name;
            existing.role = staff.role;
        } else {
            staffAttendanceList.push({
                id: `${date}_${staff.id}`,
                date: date,
                staffId: staff.id,
                staffName: staff.name,
                role: staff.role,
                status: "Present",
                checkIn: "",
                checkOut: "",
                remarks: ""
            });
        }
    });

    saveStaffAttendanceData();
    currentAttendanceDate = date;
    renderStaffAttendance();
    renderStaffMonthlySummary();
}

function renderStaffAttendance() {
    const body = document.getElementById("staffAttendanceTableBody");
    const noStaff = document.getElementById("noAttendanceStaffMessage");
    const dateInput = document.getElementById("attendanceDate");

    if (!body) return;

    const date = dateInput && dateInput.value
        ? dateInput.value
        : getAttendanceLocalDateString();

    currentAttendanceDate = date;
    body.innerHTML = "";

    const activeStaff = Array.isArray(staffList)
        ? staffList.filter(staff => staff.status !== "Inactive")
        : [];

    if (activeStaff.length === 0) {
        if (noStaff) noStaff.style.display = "block";
        updateAttendanceStats([]);
        return;
    }

    if (noStaff) noStaff.style.display = "none";

    activeStaff.forEach(staff => {
        const record = getAttendanceRecord(date, staff.id) || {
            status: "",
            checkIn: "",
            checkOut: "",
            remarks: ""
        };

        const row = document.createElement("tr");

        const name = typeof escapeStaffHTML === "function"
            ? escapeStaffHTML(staff.name || "")
            : String(staff.name || "");

        const role = typeof escapeStaffHTML === "function"
            ? escapeStaffHTML(staff.role || "")
            : String(staff.role || "");

        const safeId = String(staff.id).replace(/[^a-zA-Z0-9_-]/g, "_");

        row.innerHTML = `
            <td>
                <div class="staff-profile">
                    <div class="staff-avatar">
                        ${(staff.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div class="staff-name">${name}</div>
                    </div>
                </div>
            </td>
            <td>${role}</td>
            <td>
                <select
                    class="attendance-status-select"
                    data-staff-id="${safeId}"
                    aria-label="Attendance status for ${name}">
                    <option value="">Not Marked</option>
                    <option value="Present" ${record.status === "Present" ? "selected" : ""}>Present</option>
                    <option value="Absent" ${record.status === "Absent" ? "selected" : ""}>Absent</option>
                    <option value="Half Day" ${record.status === "Half Day" ? "selected" : ""}>Half Day</option>
                </select>
            </td>
            <td>
                <input
                    type="time"
                    class="attendance-time-input"
                    data-field="checkIn"
                    data-staff-id="${safeId}"
                    value="${record.checkIn || ""}">
            </td>
            <td>
                <input
                    type="time"
                    class="attendance-time-input"
                    data-field="checkOut"
                    data-staff-id="${safeId}"
                    value="${record.checkOut || ""}">
            </td>
            <td>
                <input
                    type="text"
                    class="attendance-remarks-input"
                    data-field="remarks"
                    data-staff-id="${safeId}"
                    value="${typeof escapeStaffHTML === "function" ? escapeStaffHTML(record.remarks || "") : String(record.remarks || "") }"
                    placeholder="Optional">
            </td>
        `;

        body.appendChild(row);
    });

    body.querySelectorAll(".attendance-status-select").forEach(select => {
        select.addEventListener("change", updateAttendanceStatsFromTable);
    });

    body.querySelectorAll(".attendance-time-input, .attendance-remarks-input").forEach(input => {
        input.addEventListener("input", updateAttendanceStatsFromTable);
    });

    updateAttendanceStatsFromTable();
}

function updateAttendanceStatsFromTable() {
    const body = document.getElementById("staffAttendanceTableBody");
    if (!body) return;

    const statuses = Array.from(
        body.querySelectorAll(".attendance-status-select")
    ).map(select => select.value);

    updateAttendanceStats(statuses);
}

function updateAttendanceStats(statuses) {
    const present = statuses.filter(status => status === "Present").length;
    const absent = statuses.filter(status => status === "Absent").length;
    const halfDay = statuses.filter(status => status === "Half Day").length;
    const notMarked = statuses.filter(status => !status).length;

    const presentElement = document.getElementById("attendancePresentCount");
    const absentElement = document.getElementById("attendanceAbsentCount");
    const halfDayElement = document.getElementById("attendanceHalfDayCount");
    const notMarkedElement = document.getElementById("attendanceNotMarkedCount");

    if (presentElement) presentElement.textContent = present;
    if (absentElement) absentElement.textContent = absent;
    if (halfDayElement) halfDayElement.textContent = halfDay;
    if (notMarkedElement) notMarkedElement.textContent = notMarked;
}

function saveStaffAttendance() {
    const dateInput = document.getElementById("attendanceDate");
    const body = document.getElementById("staffAttendanceTableBody");

    const date = dateInput && dateInput.value ? dateInput.value : "";

    if (!date || !body) {
        alert("Please select an attendance date.");
        return;
    }

    const activeStaff = Array.isArray(staffList)
        ? staffList.filter(staff => staff.status !== "Inactive")
        : [];

    activeStaff.forEach(staff => {
        const safeId = String(staff.id).replace(/[^a-zA-Z0-9_-]/g, "_");
        const statusInput = body.querySelector(
            `.attendance-status-select[data-staff-id="${safeId}"]`
        );
        const checkInInput = body.querySelector(
            `.attendance-time-input[data-staff-id="${safeId}"][data-field="checkIn"]`
        );
        const checkOutInput = body.querySelector(
            `.attendance-time-input[data-staff-id="${safeId}"][data-field="checkOut"]`
        );
        const remarksInput = body.querySelector(
            `.attendance-remarks-input[data-staff-id="${safeId}"]`
        );

        const status = statusInput ? statusInput.value : "";
        const checkIn = checkInInput ? checkInInput.value : "";
        const checkOut = checkOutInput ? checkOutInput.value : "";
        const remarks = remarksInput ? remarksInput.value.trim() : "";

        const index = staffAttendanceList.findIndex(record =>
            record.date === date &&
            String(record.staffId) === String(staff.id)
        );

        if (!status && !checkIn && !checkOut && !remarks) {
            if (index !== -1) {
                staffAttendanceList.splice(index, 1);
            }
            return;
        }

        const record = {
            id: `${date}_${staff.id}`,
            date: date,
            staffId: staff.id,
            staffName: staff.name,
            role: staff.role,
            status: status,
            checkIn: checkIn,
            checkOut: checkOut,
            remarks: remarks
        };

        if (index !== -1) {
            staffAttendanceList[index] = record;
        } else {
            staffAttendanceList.push(record);
        }
    });

    saveStaffAttendanceData();
    currentAttendanceDate = date;
    renderStaffAttendance();
    renderStaffMonthlySummary();

    alert(`Attendance saved for ${formatAttendanceDisplayDate(date)}.`);
}

function formatAttendanceDisplayDate(dateString) {
    if (!dateString) return "";

    const parts = dateString.split("-");
    if (parts.length !== 3) return dateString;

    return `${parts[2]}-${parts[1]}-${parts[0]}`;
}

function renderStaffMonthlySummary() {
    const monthInput = document.getElementById("attendanceMonth");
    const body = document.getElementById("staffMonthSummaryBody");
    const title = document.getElementById("attendanceMonthTitle");

    if (!body) return;

    const month = monthInput && monthInput.value
        ? monthInput.value
        : getAttendanceMonthString();

    body.innerHTML = "";

    if (title) {
        const date = new Date(`${month}-01T00:00:00`);
        const monthName = date.toLocaleDateString("en-IN", {
            month: "long",
            year: "numeric"
        });
        title.textContent = `${monthName} Attendance Summary`;
    }

    const summaryMap = {};

    staffList.forEach(staff => {
        summaryMap[String(staff.id)] = {
            name: staff.name || "",
            present: 0,
            absent: 0,
            halfDay: 0,
            notMarked: 0
        };
    });

    staffAttendanceList
        .filter(record => String(record.date || "").slice(0, 7) === month)
        .forEach(record => {
            const key = String(record.staffId);

            if (!summaryMap[key]) {
                summaryMap[key] = {
                    name: record.staffName || "Unknown Staff",
                    present: 0,
                    absent: 0,
                    halfDay: 0,
                    notMarked: 0
                };
            }

            if (record.status === "Present") summaryMap[key].present++;
            else if (record.status === "Absent") summaryMap[key].absent++;
            else if (record.status === "Half Day") summaryMap[key].halfDay++;
        });

    Object.entries(summaryMap).forEach(([staffId, item]) => {
        const staff = staffList.find(candidate => String(candidate.id) === String(staffId));
        if (staff) {
            const eligible = getStaffEligibleDaysForSalary(staff, month);
            item.notMarked = Math.max(0, eligible - item.present - item.absent - item.halfDay);
        }
    });

    const summaryRows = Object.values(summaryMap);

    if (summaryRows.length === 0) {
        body.innerHTML = `
            <tr>
                <td colspan="5" class="attendance-empty-cell">
                    No staff attendance data available for this month.
                </td>
            </tr>
        `;
        return;
    }

    summaryRows.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${typeof escapeStaffHTML === "function" ? escapeStaffHTML(item.name) : String(item.name)}</td>
            <td><span class="attendance-summary-number present">${item.present}</span></td>
            <td><span class="attendance-summary-number absent">${item.absent}</span></td>
            <td><span class="attendance-summary-number half-day">${item.halfDay}</span></td>
            <td><span class="attendance-summary-number not-marked">${item.notMarked}</span></td>
        `;
        body.appendChild(row);
    });
}

function downloadStaffAttendanceMonth() {
    const monthInput = document.getElementById("attendanceMonth");
    const month = monthInput && monthInput.value
        ? monthInput.value
        : getAttendanceMonthString();

    const activeAndHistoricalStaff = {};

    staffList.forEach(staff => {
        activeAndHistoricalStaff[String(staff.id)] = {
            id: staff.id,
            name: staff.name || "",
            role: staff.role || ""
        };
    });

    staffAttendanceList
        .filter(record => String(record.date || "").slice(0, 7) === month)
        .forEach(record => {
            const key = String(record.staffId);
            if (!activeAndHistoricalStaff[key]) {
                activeAndHistoricalStaff[key] = {
                    id: record.staffId,
                    name: record.staffName || "Unknown Staff",
                    role: record.role || ""
                };
            }
        });

    const staffForExport = Object.values(activeAndHistoricalStaff);

    if (staffForExport.length === 0) {
        alert("No staff members available to export.");
        return;
    }

    const daysInMonth = new Date(
        Number(month.slice(0, 4)),
        Number(month.slice(5, 7)),
        0
    ).getDate();

    const rows = [
        [
            "Date",
            "Staff Name",
            "Role",
            "Attendance Status",
            "Check In",
            "Check Out",
            "Remarks"
        ]
    ];

    for (let day = 1; day <= daysInMonth; day++) {
        const date = `${month}-${String(day).padStart(2, "0")}`;

        staffForExport.forEach(staff => {
            const record = getAttendanceRecord(date, staff.id);

            rows.push([
                formatAttendanceDisplayDate(date),
                staff.name,
                staff.role,
                record && record.status ? record.status : "Not Marked",
                record && record.checkIn ? record.checkIn : "",
                record && record.checkOut ? record.checkOut : "",
                record && record.remarks ? record.remarks : ""
            ]);
        });
    }

    const csv = rows.map(row =>
        row.map(value => {
            const text = String(value ?? "");
            return `"${text.replace(/"/g, '""')}"`;
        }).join(",")
    ).join("\r\n");

    const blob = new Blob(["\ufeff" + csv], {
        type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `Sri-Tabemashou-Staff-Attendance-${month}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    alert(`Attendance report downloaded for ${month}.`);
}


/* Refresh attendance when the user changes the month/date. */
const attendanceDateInput = document.getElementById("attendanceDate");
const attendanceMonthInput = document.getElementById("attendanceMonth");

if (attendanceDateInput) {
    attendanceDateInput.addEventListener("change", function() {
        currentAttendanceDate = this.value;
        renderStaffAttendance();
    });
}

if (attendanceMonthInput) {
    attendanceMonthInput.addEventListener("change", function() {
        renderStaffMonthlySummary();
    });
}


/* Initialize the additive attendance feature without changing the existing page logic. */
document.addEventListener("DOMContentLoaded", function() {
    const today = getAttendanceLocalDateString();
    const month = getAttendanceMonthString();

    const dateInput = document.getElementById("attendanceDate");
    const monthInput = document.getElementById("attendanceMonth");

    if (dateInput) dateInput.value = dateInput.value || today;
    if (monthInput) monthInput.value = monthInput.value || month;

    currentAttendanceDate = dateInput ? dateInput.value : today;
});


/* =====================================================
   STAFF SALARY DASHBOARD - ADDITIVE FEATURE
   Salary = Monthly Salary / Eligible Days in Month
             x (Present + Half Day x 0.5)
===================================================== */

function getStaffSalaryMonth() {
    const monthInput = document.getElementById("attendanceMonth");
    return monthInput && monthInput.value
        ? monthInput.value
        : getAttendanceMonthString();
}

function getDaysInSalaryMonth(month) {
    if (!month || !/^\d{4}-\d{2}$/.test(month)) return 0;
    return new Date(
        Number(month.slice(0, 4)),
        Number(month.slice(5, 7)),
        0
    ).getDate();
}

function getStaffEligibleDaysForSalary(staff, month) {
    const daysInMonth = getDaysInSalaryMonth(month);
    if (!daysInMonth) return 0;

    let startDay = 1;
    if (staff && staff.joiningDate) {
        const joiningMonth = staff.joiningDate.slice(0, 7);

        // Staff joining after the selected month has no eligible days.
        if (joiningMonth > month) {
            return 0;
        }

        if (joiningMonth === month) {
            startDay = Number(staff.joiningDate.slice(8, 10)) || 1;
        }
    }

    return Math.max(0, daysInMonth - startDay + 1);
}

function getStaffSalaryAttendanceSummary(staff, month) {
    const eligibleDays = getStaffEligibleDaysForSalary(staff, month);
    const summary = {
        present: 0,
        absent: 0,
        halfDay: 0,
        notMarked: 0,
        payableDays: 0,
        eligibleDays: eligibleDays
    };

    const staffId = String(staff.id);

    staffAttendanceList
        .filter(record =>
            String(record.date || "").slice(0, 7) === month &&
            String(record.staffId) === staffId
        )
        .forEach(record => {
            if (record.status === "Present") {
                summary.present++;
            } else if (record.status === "Absent") {
                summary.absent++;
            } else if (record.status === "Half Day") {
                summary.halfDay++;
            }
        });

    summary.notMarked = Math.max(
        0,
        eligibleDays - summary.present - summary.absent - summary.halfDay
    );

    summary.payableDays =
        summary.present + (summary.halfDay * 0.5);

    return summary;
}

function calculateStaffMonthlySalary(staff, month) {
    const monthlySalary = Number(staff.salary) || 0;
    const eligibleDays = getStaffEligibleDaysForSalary(staff, month);

    if (!monthlySalary || !eligibleDays) {
        return {
            monthlySalary,
            perDaySalary: 0,
            salaryToPay: 0,
            ...getStaffSalaryAttendanceSummary(staff, month)
        };
    }

    const attendance =
        getStaffSalaryAttendanceSummary(staff, month);

    const perDaySalary =
        monthlySalary / eligibleDays;

    const salaryToPay =
        perDaySalary * attendance.payableDays;

    return {
        monthlySalary,
        perDaySalary,
        salaryToPay,
        ...attendance
    };
}

function renderStaffSalaryDashboard() {
    const body = document.getElementById(
        "staffSalaryDashboardBody"
    );

    const totalElement = document.getElementById(
        "staffTotalSalaryToPay"
    );

    if (!body) return;

    const month = getStaffSalaryMonth();
    body.innerHTML = "";

    let totalSalary = 0;

    const salaryStaff = Array.isArray(staffList)
        ? staffList.slice()
        : [];

    if (salaryStaff.length === 0) {
        body.innerHTML = `
            <tr>
                <td colspan="9" class="staff-salary-empty-cell">
                    No staff members available.
                </td>
            </tr>
        `;

        if (totalElement) totalElement.textContent = "₹0.00";
        return;
    }

    salaryStaff.sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""))
    );

    salaryStaff.forEach(staff => {
        const calculation =
            calculateStaffMonthlySalary(staff, month);

        totalSalary += calculation.salaryToPay;

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                <div class="staff-salary-person">
                    <strong>${escapeStaffHTML(staff.name || "Unknown Staff")}</strong>
                    <small>${escapeStaffHTML(staff.role || "")}</small>
                </div>
            </td>
            <td>₹${calculation.monthlySalary.toFixed(2)}</td>
            <td>
                <span class="salary-count salary-present">
                    ${calculation.present}
                </span>
            </td>
            <td>
                <span class="salary-count salary-halfday">
                    ${calculation.halfDay}
                </span>
            </td>
            <td>
                <span class="salary-count salary-absent">
                    ${calculation.absent}
                </span>
            </td>
            <td>
                <strong>${calculation.payableDays.toFixed(1)}</strong>
            </td>
            <td>₹${calculation.perDaySalary.toFixed(2)}</td>
            <td>
                <strong class="salary-to-pay">
                    ₹${calculation.salaryToPay.toFixed(2)}
                </strong>
            </td>
            <td>
                ${getSalaryPaymentForStaff(staff.id, month)
                    ? `<button type="button" class="primary-btn" style="padding:6px 10px;font-size:11px;background:#166534;color:#fff;border:none;border-radius:6px;cursor:default;">✓ Paid</button>`
                    : `<button type="button" class="secondary-btn" style="padding:6px 10px;font-size:11px;cursor:pointer;" onclick="markSalaryPaid('${escapeStaffHTML(staff.id)}','${month}')">💵 Pay</button>`}
            </td>
        `;

        body.appendChild(row);
    });

    if (totalElement) {
        totalElement.textContent =
            `₹${totalSalary.toFixed(2)}`;
    }
}

function saveSalaryPayments() {
    firebaseStore.setItem(
        STAFF_SALARY_PAYMENTS_STORAGE_KEY,
        JSON.stringify(salaryPaymentsList)
    );

    if (typeof window.syncSalaryPaymentsToFirebase === "function") {
        window.syncSalaryPaymentsToFirebase(salaryPaymentsList);
    }
}

function getSalaryPaymentForStaff(staffId, month) {
    return salaryPaymentsList.find(payment =>
        String(payment.staffId) === String(staffId) &&
        payment.month === month
    ) || null;
}

function markSalaryPaid(staffId, month) {
    const staff = staffList.find(item => String(item.id) === String(staffId));
    if (!staff) return;

    const existing = getSalaryPaymentForStaff(staffId, month);
    if (existing) {
        alert(`Salary already marked paid for ${month}.`);
        return;
    }

    const calculation = calculateStaffMonthlySalary(staff, month);
    const amount = Number(calculation.salaryToPay || 0);

    if (amount <= 0) {
        alert("There is no salary amount to pay for this month yet.");
        return;
    }

    const paymentMethod =
        (prompt("Payment method (Cash / UPI / Bank):", "Cash") || "Cash").trim() || "Cash";

    salaryPaymentsList.push({
        id: `${staffId}_${month}`,
        staffId: staff.id,
        staffName: staff.name,
        month,
        amount,
        paymentMethod,
        paidDate: new Date().toISOString()
    });

    saveSalaryPayments();
    renderStaffSalaryDashboard();

    alert(`₹${amount.toFixed(2)} salary marked paid for ${staff.name}.`);
}

function deleteSalaryPaymentsForStaff(staffId) {
    salaryPaymentsList = salaryPaymentsList.filter(
        payment => String(payment.staffId) !== String(staffId)
    );
    saveSalaryPayments();
}

/* Refresh salary dashboard whenever attendance/month changes. */
document.addEventListener("DOMContentLoaded", function() {
    renderStaffSalaryDashboard();
});

if (typeof attendanceMonthInput !== "undefined" && attendanceMonthInput) {
    attendanceMonthInput.addEventListener("change", function() {
        renderStaffSalaryDashboard();
    });
}

document.addEventListener("DOMContentLoaded", () => {
    renderStaff();
    updateStaffStatistics();
    renderStaffMonthlySummary();
    renderStaffSalaryDashboard();

    if (staffSearch) staffSearch.addEventListener("input", renderStaff);
    if (staffRoleFilter) staffRoleFilter.addEventListener("change", renderStaff);
    if (staffStatusFilter) staffStatusFilter.addEventListener("change", renderStaff);

    const dateInput = document.getElementById("attendanceDate");
    const monthInput = document.getElementById("attendanceMonth");

    if (dateInput && !dateInput.value) {
        dateInput.value = getAttendanceLocalDateString(new Date());
    }
    if (monthInput && !monthInput.value) {
        monthInput.value = getAttendanceMonthString(new Date());
    }

    currentAttendanceDate = dateInput?.value || getAttendanceLocalDateString(new Date());

    if (dateInput) {
        dateInput.addEventListener("change", function () {
            currentAttendanceDate = this.value;
            renderStaffAttendance();
        });
    }
    if (monthInput) {
        monthInput.addEventListener("change", function () {
            renderStaffMonthlySummary();
            renderStaffSalaryDashboard();
        });
    }
});
