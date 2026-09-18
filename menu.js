/* Sri Tabemashou POS - menu.js */
function renderMenuManagement() {

    const table =
        document.getElementById(
            "menuManagementTable"
        );


    if (!table) return;


    const search =
        document.getElementById(
            "menuManagementSearch"
        )?.value
        .toLowerCase() || "";


    const category =
        document.getElementById(
            "menuManagementCategory"
        )?.value ||
        "All";


    const status =
        document.getElementById(
            "menuManagementStatus"
        )?.value ||
        "All";


    const filtered =
        menuItems.filter(
            item => {

                const searchMatch =
                    item.name
                        .toLowerCase()
                        .includes(search);


                const categoryMatch =
                    category === "All" ||
                    item.category ===
                    category;


                const statusMatch =
                    status === "All" ||
                    item.status ===
                    status;


                return (
                    searchMatch &&
                    categoryMatch &&
                    statusMatch
                );

            }
        );


    table.innerHTML = "";


    if (
        filtered.length === 0
    ) {

        table.innerHTML = `

            <tr>

                <td
                    colspan="6"
                    style="
                        text-align:center;
                        padding:50px;
                        color:#999;
                    "
                >

                    No menu items found.

                </td>

            </tr>

        `;

        return;

    }


    filtered.forEach(
        item => {

            const row =
                document.createElement(
                    "tr"
                );


            const typeClass =
                item.type === "Veg"
                    ? "type-veg"
                    : "type-nonveg";


            const statusClass =
                item.status ===
                "Available"
                    ? "status-available"
                    : "status-unavailable";


            row.innerHTML = `

                <td>

                    <div class="table-food">

                        <div class="table-food-icon">
                            ${item.image
                                ? `<img class="table-food-image" src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}">`
                                : escapeHTML(item.icon || "🍽️")}
                        </div>


                        <div>

                            <div class="
                                food-name
                            ">

                                ${escapeHTML(
                                    item.name
                                )}

                            </div>


                            <div class="
                                food-category
                            ">

                                ID:
                                ${item.id}

                            </div>

                        </div>

                    </div>

                </td>


                <td>
                    ${escapeHTML(
                        item.category
                    )}
                </td>


                <td>

                    <span class="
                        type-badge
                        ${typeClass}
                    ">

                        ${item.type}

                    </span>

                </td>


                <td>

                    <strong>
                        ₹${Number(
                            item.price
                        ).toFixed(2)}
                    </strong>

                </td>


                <td>

                    <span class="
                        status-badge
                        ${statusClass}
                    ">

                        ${item.status}

                    </span>

                </td>


                <td>

                    <div class="
                        table-actions
                    ">


                        <button
                            class="
                                table-action
                                edit-action
                            "
                            title="Edit"
                            onclick="
                                editMenuItem(
                                    ${item.id}
                                )
                            ">

                            ✏️

                        </button>


                        <button
                            class="
                                table-action
                                toggle-action
                            "
                            title="Toggle Status"
                            onclick="
                                toggleMenuItem(
                                    ${item.id}
                                )
                            ">

                            ${item.status ===
                            "Available"
                                ? "⏸️"
                                : "▶️"}

                        </button>


                        <button
                            class="
                                table-action
                                delete-action
                            "
                            title="Delete"
                            onclick="
                                deleteMenuItem(
                                    ${item.id}
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

}


/* =====================================================
   UPDATE CATEGORY DROPDOWN
===================================================== */

function updateCategoryDropdown() {

    const select =
        document.getElementById(
            "menuManagementCategory"
        );


    if (!select) return;


    const current =
        select.value || "All";


    const categories =
        [
            ...new Set(
                menuItems.map(
                    item =>
                        item.category
                )
            )
        ];


    select.innerHTML = `

        <option value="All">
            All Categories
        </option>

    `;


    categories.forEach(
        category => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                category;


            option.textContent =
                category;


            select.appendChild(
                option
            );

        }
    );


    if (
        categories.includes(current)
    ) {

        select.value =
            current;

    }

    else {

        select.value =
            "All";

    }

}


let pendingItemImage = "";

function updateItemImagePreview(src) {
    const box = document.getElementById("itemImagePreview");
    if (!box) return;
    box.innerHTML = src
        ? `<img src="${escapeHTML(src)}" alt="Food Image Preview">`
        : "No Image";
}

function handleItemImageFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
        alert("Please select an image file.");
        event.target.value = "";
        return;
    }
    if (file.size > 2 * 1024 * 1024) {
        alert("Please choose an image smaller than 2 MB.");
        event.target.value = "";
        return;
    }
    const reader = new FileReader();
    reader.onload = () => {
        pendingItemImage = reader.result;
        updateItemImagePreview(pendingItemImage);
    };
    reader.readAsDataURL(file);
}

function removeItemImage() {
    pendingItemImage = "";
    const input = document.getElementById("itemImage");
    if (input) input.value = "";
    updateItemImagePreview("");
}

/* =====================================================
   OPEN ADD ITEM MODAL
===================================================== */

function openAddItemModal() {
    if (typeof hasPermission === "function" && !hasPermission("menu.manage")) {
        alert("You do not have permission to manage the menu.");
        return;
    }


    document.getElementById(
        "itemModal"
    ).classList.add(
        "show"
    );


    document.getElementById(
        "modalTitle"
    ).textContent =
        "Add Food Item";


    document.getElementById(
        "itemForm"
    ).reset();


    document.getElementById(
        "editItemId"
    ).value = "";


    document.getElementById(
        "itemIcon"
    ).value =
        "🍽️";

    pendingItemImage = "";
    const imageInput = document.getElementById("itemImage");
    if (imageInput) imageInput.value = "";
    updateItemImagePreview("");

    document.getElementById(
        "itemStatus"
    ).value =
        "Available";

}


/* =====================================================
   CLOSE MODAL
===================================================== */

function closeItemModal() {

    document.getElementById(
        "itemModal"
    ).classList.remove(
        "show"
    );

}


/* =====================================================
   SAVE MENU ITEM
===================================================== */

function saveMenuItem(event) {
    if (typeof hasPermission === "function" && !hasPermission("menu.manage")) {
        alert("You do not have permission to manage the menu.");
        return;
    }


    event.preventDefault();


    const id =
        document.getElementById(
            "editItemId"
        ).value;


    const name =
        document.getElementById(
            "itemName"
        ).value.trim();


    const category =
        document.getElementById(
            "itemCategory"
        ).value.trim();


    const price =
        parseFloat(
            document.getElementById(
                "itemPrice"
            ).value
        );


    const type =
        document.getElementById(
            "itemType"
        ).value;


    const icon =
        document.getElementById(
            "itemIcon"
        ).value.trim()
        || "🍽️";

    const image = pendingItemImage || "";


    const status =
        document.getElementById(
            "itemStatus"
        ).value;


    if (
        !name ||
        !category ||
        isNaN(price)
    ) {

        alert(
            "Please fill all required fields."
        );

        return;

    }


    if (id) {

        const item =
            menuItems.find(
                menuItem =>
                    menuItem.id ===
                    Number(id)
            );


        if (item) {

            item.name =
                name;

            item.category =
                category;

            item.price =
                price;

            item.type =
                type;

            item.icon =
                icon;

            item.image = image || item.image || "";

            item.status =
                status;

        }

    }

    else {

        const newId =
            menuItems.length
                ? Math.max(
                    ...menuItems.map(
                        item =>
                            item.id
                    )
                ) + 1
                : 1;


        menuItems.push({

            id: newId,

            name: name,

            category: category,

            price: price,

            type: type,

            icon: icon,

            image: image,

            status: status

        });

    }


    saveMenuToStorage();

    createCategories();

    displayMenu();

    updateCategoryDropdown();

    renderMenuManagement();

    closeItemModal();


    alert(
        id
            ? "Food item updated successfully."
            : "Food item added successfully."
    );

}


/* =====================================================
   EDIT MENU ITEM
===================================================== */

function editMenuItem(id) {
    if (typeof hasPermission === "function" && !hasPermission("menu.manage")) {
        alert("You do not have permission to manage the menu.");
        return;
    }


    const item =
        menuItems.find(
            menuItem =>
                String(menuItem.id) === String(id)
        );


    if (!item) return;


    document.getElementById(
        "itemModal"
    ).classList.add(
        "show"
    );


    document.getElementById(
        "modalTitle"
    ).textContent =
        "Edit Food Item";


    document.getElementById(
        "editItemId"
    ).value =
        item.id;


    document.getElementById(
        "itemName"
    ).value =
        item.name;


    document.getElementById(
        "itemCategory"
    ).value =
        item.category;


    document.getElementById(
        "itemPrice"
    ).value =
        item.price;


    document.getElementById(
        "itemType"
    ).value =
        item.type;


    document.getElementById(
        "itemIcon"
    ).value =
        item.icon || "🍽️";

    pendingItemImage = item.image || "";
    const imageInput = document.getElementById("itemImage");
    if (imageInput) imageInput.value = "";
    updateItemImagePreview(pendingItemImage);


    document.getElementById(
        "itemStatus"
    ).value =
        item.status;

}


/* =====================================================
   DELETE MENU ITEM
===================================================== */

function deleteMenuItem(id) {
    if (typeof hasPermission === "function" && !hasPermission("menu.manage")) {
        alert("You do not have permission to manage the menu.");
        return;
    }


    const item =
        menuItems.find(
            menuItem =>
                String(menuItem.id) === String(id)
        );


    if (!item) return;


    const confirmed =
        confirm(
            `Delete "${item.name}" from menu?`
        );


    if (!confirmed) return;


    menuItems =
        menuItems.filter(
            menuItem =>
                String(menuItem.id) !== String(id)
        );


    if (typeof cart !== "undefined" && Array.isArray(cart)) {
        cart = cart.filter(
            cartItem =>
                String(cartItem.id) !== String(id)
        );
    }


    saveMenuToStorage();

    createCategories();

    displayMenu();

    updateCategoryDropdown();

    renderMenuManagement();

    renderCart();

}


/* =====================================================
   TOGGLE MENU ITEM
===================================================== */

function toggleMenuItem(id) {
    if (typeof hasPermission === "function" && !hasPermission("menu.manage")) {
        alert("You do not have permission to manage the menu.");
        return;
    }


    const item =
        menuItems.find(
            menuItem =>
                String(menuItem.id) === String(id)
        );


    if (!item) return;


    item.status =
        item.status ===
        "Available"
            ? "Unavailable"
            : "Available";


    saveMenuToStorage();

    createCategories();

    displayMenu();

    renderMenuManagement();

}


/* =====================================================
   PRINT BILL
===================================================== */

document.addEventListener("DOMContentLoaded", () => {
    renderMenuManagement();
    updateCategoryDropdown();

    const modal = document.getElementById("itemModal");
    if (modal) {
        modal.addEventListener("click", event => {
            if (event.target === modal) closeItemModal();
        });
    }
});
