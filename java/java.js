/* =========================================================
   3W VENTURES HONEY
   Shopping Cart & Website Functionality
   ========================================================= */

"use strict";

const HoneyShop = (() => {
    const PRICE_PER_LITRE = 10000;
    const CART_KEY = "3w_honey_cart";
    const ORDER_KEY = "3w_honey_pending_order";

    let initialized = false;

    /* HONEY SIZES */

    const SIZES = [
        { label: "⅛ Litre", litres: 0.125 },
        { label: "¼ Litre", litres: 0.25 },
        { label: "½ Litre", litres: 0.5 },

        ...Array.from({ length: 25 }, (_, index) => ({
            label: `${index + 1} ${
                index === 0 ? "Litre" : "Litres"
            }`,
            litres: index + 1
        }))
    ];

    /* PRICE FORMATTING */

    const formatMoney = amount =>
        new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            maximumFractionDigits: 0
        }).format(Number(amount) || 0);

    const priceForSize = litres =>
        Math.round(Number(litres) * PRICE_PER_LITRE);

    /* GET SAVED CART */

    function getCart() {
        try {
            const parsed = JSON.parse(
                localStorage.getItem(CART_KEY) || "[]"
            );

            if (!Array.isArray(parsed)) {
                return [];
            }

            return parsed
                .filter(item =>
                    item &&
                    typeof item.id === "string" &&
                    Number.isFinite(Number(item.litres)) &&
                    Number(item.litres) > 0 &&
                    Number.isInteger(Number(item.quantity)) &&
                    Number(item.quantity) > 0
                )
                .map(item => ({
                    ...item,
                    litres: Number(item.litres),
                    quantity: Number(item.quantity),
                    price: priceForSize(item.litres)
                }));

        } catch (error) {
            console.warn(
                "Unable to read the saved honey cart.",
                error
            );

            return [];
        }
    }

    /* SAVE CART */

    function saveCart(cart) {
        try {
            localStorage.setItem(
                CART_KEY,
                JSON.stringify(cart)
            );

            updateCartDisplay();

        } catch (error) {
            console.error(
                "Unable to save the honey cart.",
                error
            );

            showToast(
                "Unable to save your cart. Check your browser storage."
            );
        }
    }

    /* CART COUNT */

    function getCartCount() {
        return getCart().reduce(
            (total, item) => total + item.quantity,
            0
        );
    }

    /* CART SUBTOTAL */

    function getSubtotal() {
        return getCart().reduce(
            (total, item) =>
                total + item.price * item.quantity,
            0
        );
    }

    /* TOAST NOTIFICATIONS */

    function showToast(message) {
        let toast = document.querySelector("#honey-toast");

        if (!toast) {
            toast = document.createElement("div");

            toast.id = "honey-toast";

            toast.setAttribute("role", "status");
            toast.setAttribute("aria-live", "polite");

            Object.assign(toast.style, {
                position: "fixed",
                bottom: "24px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "#392619",
                color: "#ffffff",
                padding: "14px 22px",
                borderRadius: "10px",
                zIndex: "99999",
                maxWidth: "90%",
                textAlign: "center",
                boxShadow: "0 5px 20px rgba(0,0,0,.18)",
                fontFamily: "inherit"
            });

            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.style.display = "block";

        clearTimeout(showToast.timer);

        showToast.timer = setTimeout(() => {
            toast.style.display = "none";
        }, 2500);
    }

    /* ADD PRODUCT TO CART */

    function addToCart(product) {
        const litres = Number(product.litres);
        const quantity = Number(product.quantity || 1);

        if (
            !Number.isFinite(litres) ||
            litres <= 0 ||
            !Number.isInteger(quantity) ||
            quantity < 1 ||
            quantity > 99
        ) {
            showToast(
                "Please select a valid honey size and quantity."
            );

            return false;
        }

        const cart = getCart();

        const id = String(
            product.id || `${litres}-litre`
        );

        const existing = cart.find(
            item => item.id === id
        );

        if (existing) {
            existing.quantity = Math.min(
                99,
                existing.quantity + quantity
            );

        } else {
            cart.push({
                id,
                name: product.name || "3W Ventures Honey",
                litres,
                size: product.size || `${litres} Litre`,
                price: priceForSize(litres),
                quantity
            });
        }

        saveCart(cart);

        showToast(
            `${product.size || `${litres} Litre`} added to your cart.`
        );

        return true;
    }

    /* SET A PRODUCT QUANTITY DIRECTLY */

    function setProductQuantity(id, quantity) {
        const cart = getCart();

        const item = cart.find(
            product => product.id === String(id)
        );

        if (!item) {
            return;
        }

        const parsedQuantity = Number(quantity);

        if (
            !Number.isInteger(parsedQuantity) ||
            parsedQuantity < 1
        ) {
            return;
        }

        item.quantity = Math.min(99, parsedQuantity);

        saveCart(cart);
    }

    /* CHANGE QUANTITY ON CART PAGE */

    function changeQuantity(id, change) {
        const cart = getCart();
        const item = cart.find(
            product => product.id === String(id)
        );
        

        if (!item) {
            return;
        }

        const nextQuantity =
            item.quantity + Number(change);

       if (nextQuantity <= 0) {
    saveCart(
        cart.filter(product => product.id !== String(id))
    );

    updateCartDisplay();

    showToast("Item removed from your cart.");

    return;
}

        item.quantity = Math.min(99, nextQuantity);

        saveCart(cart);
    }

    /* REMOVE PRODUCT */

    function removeItem(id) {
        const cart = getCart().filter(
            item => item.id !== String(id)
        );

        saveCart(cart);

        showToast("Item removed from your cart.");
    }

    /* CLEAR CART */

    function clearCart() {
        try {
            localStorage.removeItem(CART_KEY);

            updateCartDisplay();

            showToast("Your cart has been cleared.");

        } catch (error) {
            console.error(error);
        }
    }

    /* ESCAPE HTML */

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    /* DISPLAY CART ITEMS */

    function renderCart(container, cart) {
        if (!cart.length) {
            container.innerHTML = `
                <div class="empty-cart-message">
                    <h3>Your cart is waiting for some honey.</h3>

                    <p>
                        Choose your preferred honey size to get started.
                    </p>

                    <a class="button" href="shop.html">
                        Shop Honey
                    </a>
                </div>
            `;

            return;
        }

        container.innerHTML = cart.map(item => `
            <article
                class="cart-item"
                data-item-id="${escapeHTML(item.id)}"
            >

                <div class="cart-item-info">
                    <h3>${escapeHTML(item.name)}</h3>

                    <p>${escapeHTML(item.size)}</p>

                    <p>
                        ${formatMoney(item.price)} each
                    </p>
                </div>

                <div class="cart-item-quantity">

                    <button
                        type="button"
                        data-quantity-change="-1"
                        data-item-id="${escapeHTML(item.id)}"
                        aria-label="Decrease quantity"
                    >
                        −
                    </button>

                    <span>${item.quantity}</span>

                    <button
                        type="button"
                        data-quantity-change="1"
                        data-item-id="${escapeHTML(item.id)}"
                        aria-label="Increase quantity"
                    >
                        +
                    </button>

                </div>

                <strong class="cart-item-total">
                    ${formatMoney(item.price * item.quantity)}
                </strong>

                <button
                    type="button"
                    class="remove-cart-item"
                    data-remove-item="${escapeHTML(item.id)}"
                >
                    Remove
                </button>

            </article>
        `).join("");
    }

    /* SYNCHRONISE PRODUCT CARDS WITH CART */

    function syncProductCards(cart) {
        document.querySelectorAll(
            "[data-product-card]"
        ).forEach(card => {
            const addButton = card.querySelector(
                "[data-add-to-cart], button[data-product-id]"
            );

            if (!addButton) {
                return;
            }

            const id = String(
                addButton.dataset.productId ||
                `${Number(addButton.dataset.litres || card.dataset.litres)}-litre`
            );

            const item = cart.find(
                product => product.id === id
            );

            const quantityInput = card.querySelector(
                "[data-product-quantity]"
            );

            const quantityWrap = card.querySelector(
                "[data-quantity-wrap], .product-quantity"
            );

            if (item) {
                if (quantityInput) {
                    quantityInput.value = item.quantity;
                }

                addButton.hidden = true;

                if (quantityWrap) {
                    quantityWrap.hidden = false;
                }

            } else {
                if (quantityInput) {
                    quantityInput.value = 1;
                }

                addButton.hidden = false;

                if (quantityWrap) {
                    quantityWrap.hidden = true;
                }
            }
        });
    }

    /* SHOP CART SUMMARY BAR */

    function createShopCartBar() {
        const productCards = document.querySelector(
            "[data-product-card]"
        );

        if (!productCards) {
            return;
        }

        if (document.querySelector("[data-shop-cart-bar]")) {
            return;
        }

        const bar = document.createElement("div");

        bar.className = "shop-cart-bar";
        bar.setAttribute("data-shop-cart-bar", "");
        bar.setAttribute("role", "region");
        bar.setAttribute("aria-label", "Shopping cart summary");
        bar.hidden = true;

        bar.innerHTML = `
            <div>
                <span>
                    <span data-shop-cart-count>0</span>
                    item(s) in your cart
                </span>

                <strong data-shop-cart-total>
                    ${formatMoney(0)}
                </strong>
            </div>

            <a href="cart.html">
                View Cart →
            </a>
        `;

        document.body.appendChild(bar);
    }

    function updateShopCartBar(cart, subtotal) {
        const bar = document.querySelector(
            "[data-shop-cart-bar]"
        );

        if (!bar) {
            return;
        }
                const count = cart.reduce(
            (total, item) => total + item.quantity,
            0
        );

        bar.hidden = count === 0;

        const countElement = bar.querySelector(
            "[data-shop-cart-count]"
        );

        const totalElement = bar.querySelector(
            "[data-shop-cart-total]"
        );

        if (countElement) {
            countElement.textContent = count;
        }

        if (totalElement) {
            totalElement.textContent = formatMoney(subtotal);
        }
    }

    /* UPDATE CART DISPLAY EVERYWHERE */

    function updateCartDisplay() {
        const cart = getCart();

        const count = cart.reduce(
            (total, item) => total + item.quantity,
            0
        );

        const subtotal = cart.reduce(
            (total, item) =>
                total + item.price * item.quantity,
            0
        );

        /* HEADER CART COUNT */

        document.querySelectorAll(
            "[data-cart-count]"
        ).forEach(element => {
            element.textContent = count;
        });

        /* SUBTOTAL */

        document.querySelectorAll(
            "[data-cart-subtotal], [data-checkout-subtotal]"
        ).forEach(element => {
            element.textContent = formatMoney(subtotal);
        });

        /* TOTAL */

        document.querySelectorAll(
            "[data-cart-total], [data-checkout-total]"
        ).forEach(element => {
            element.textContent = formatMoney(subtotal);
        });

        /* CART ITEMS */

        document.querySelectorAll(
            "[data-cart-items]"
        ).forEach(container => {
            renderCart(container, cart);
        });

        /* EMPTY CART MESSAGE */

        document.querySelectorAll(
            "[data-cart-empty]"
        ).forEach(element => {
            element.hidden = cart.length > 0;
        });

        /* CART CONTENT */

        document.querySelectorAll(
            "[data-cart-filled]"
        ).forEach(element => {
            element.hidden = cart.length === 0;
        });

        /* CHECKOUT BUTTON */

        document.querySelectorAll(
            "[data-checkout-button]"
        ).forEach(button => {
            button.disabled = cart.length === 0;
        });

        /* PRODUCT CARD CONTROLS */

        syncProductCards(cart);

        /* SHOP CART BAR */

        updateShopCartBar(cart, subtotal);
    }

    /* READ PRODUCT DETAILS */

    function readProductButton(button) {
        const card = button.closest(
            "[data-product-card]"
        );

        const litres = Number(
            button.dataset.litres ||
            (card && card.dataset.litres)
        );

        const quantityInput = card
            ? card.querySelector("[data-product-quantity]")
            : null;

        const quantity = quantityInput
            ? Number(quantityInput.value || 1)
            : 1;

        const size =
            button.dataset.productSize ||
            (card && card.dataset.productSize) ||
            (Number.isFinite(litres) ? `${litres} Litre` : "");

        return {
            id: button.dataset.productId ||
                `${litres}-litre`,

            name: button.dataset.productName ||
                (card && card.dataset.productName) ||
                "3W Ventures Honey",

            size,
            litres,
            quantity
        };
    }

    /* CHECKOUT */

    function prepareCheckout() {
        const cart = getCart();

        if (!cart.length) {
            showToast(
                "Your cart is empty. Please add honey first."
            );

            return;
        }

        const order = {
            items: cart,
            subtotal: getSubtotal(),
            currency: "NGN",

            /* Delivery fee must be confirmed separately. */
            deliveryFee: null,
            deliveryFeeConfirmed: false,

            paymentStatus: "pending",
            createdAt: new Date().toISOString()
        };

        try {
            localStorage.setItem(
                ORDER_KEY,
                JSON.stringify(order)
            );

            window.location.href = "checkout.html";

        } catch (error) {
            console.error(
                "Unable to prepare checkout.",
                error
            );

            showToast(
                "Unable to continue to checkout. Please try again."
            );
        }
    }

    /* GET PENDING ORDER */

    function getPendingOrder() {
        try {
            return JSON.parse(
                localStorage.getItem(ORDER_KEY) || "null"
            );

        } catch {
            return null;
        }
    }

    /* INITIALISE CHECKOUT DISPLAY */

    function initialiseCheckout() {
        document.querySelectorAll(
            "[data-checkout-button]"
        ).forEach(button => {
            button.disabled = getCart().length === 0;
        });

        const order = getPendingOrder();

        if (!order) {
            return;
        }

        const subtotal = document.querySelector(
            "[data-checkout-subtotal]"
        );

        const total = document.querySelector(
            "[data-checkout-total]"
        );

        const deliveryFee = document.querySelector(
            "[data-delivery-fee]"
        );

        if (subtotal) {
            subtotal.textContent = formatMoney(
                order.subtotal
            );
        }

        if (deliveryFee) {
            const feeText = order.deliveryFeeConfirmed
                ? formatMoney(order.deliveryFee)
                : "Awaiting confirmation";

            if ("value" in deliveryFee) {
                deliveryFee.value = feeText;
            } else {
                deliveryFee.textContent = feeText;
            }
        }

        if (total) {            const confirmedFee =
                order.deliveryFeeConfirmed
                    ? Number(order.deliveryFee || 0)
                    : 0;

            total.textContent = formatMoney(
                Number(order.subtotal || 0) + confirmedFee
            );
        }
    }

    /* MOBILE NAVIGATION */

    function initialiseMobileNavigation() {
        const nav = document.querySelector(".main-nav");

        if (!nav) {
            return;
        }

        const headerContainer = nav.parentElement;

        if (!headerContainer) {
            return;
        }

        let toggle = headerContainer.querySelector(
            ".mobile-nav-toggle"
        );

        /* Create the menu button if it doesn't exist. */

        if (!toggle) {
            toggle = document.createElement("button");

            toggle.type = "button";
            toggle.className = "mobile-nav-toggle";

            toggle.innerHTML = `
                <span aria-hidden="true">☰</span>
                <span>Menu</span>
            `;

            toggle.setAttribute(
                "aria-label",
                "Open navigation menu"
            );

            toggle.setAttribute(
                "aria-expanded",
                "false"
            );

            Object.assign(toggle.style, {
                display: "none",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "10px 14px",
                border: "1px solid #d4af37",
                borderRadius: "8px",
                background: "#ffffff",
                color: "#392619",
                font: "inherit",
                fontWeight: "600",
                cursor: "pointer"
            });

            nav.parentElement.insertBefore(toggle, nav);
        }

        if (!nav.id) {
            nav.id = "main-navigation";
        }

        toggle.setAttribute("aria-controls", nav.id);

        /* Add responsive navigation styles. */

        if (!document.querySelector("#honey-mobile-nav-styles")) {
            const style = document.createElement("style");

            style.id = "honey-mobile-nav-styles";

            style.textContent = `
                @media (max-width: 768px) {
                    .mobile-nav-toggle {
                        display: inline-flex !important;
                    }

                    .site-header > .container {
                        position: relative;
                    }

                    .main-nav {
                        display: none;
                        width: 100%;
                    }

                    .main-nav.is-open {
                        display: block !important;
                    }

                    .site-header > .container {
                        flex-wrap: wrap;
                    }

                    .main-nav ul {
                        display: flex;
                        flex-direction: column;
                        gap: 0;
                        width: 100%;
                    }

                    .main-nav li {
                        width: 100%;
                    }

                    .main-nav a {
                        display: block;
                        padding: 12px 8px;
                    }
                }

                @media (min-width: 769px) {
                    .mobile-nav-toggle {
                        display: none !important;
                    }

                    .main-nav {
                        display: block !important;
                    }
                }
            `;

            document.head.appendChild(style);
        }

        toggle.addEventListener("click", () => {
            const isOpen = nav.classList.toggle("is-open");

            toggle.setAttribute(
                "aria-expanded",
                String(isOpen)
            );

            toggle.setAttribute(
                "aria-label",
                isOpen
                    ? "Close navigation menu"
                    : "Open navigation menu"
            );

            toggle.querySelector(
                '[aria-hidden="true"]'
            ).textContent = isOpen ? "✕" : "☰";
        });

        /* Close the mobile menu after a navigation link is clicked. */

        nav.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                nav.classList.remove("is-open");

                toggle.setAttribute(
                    "aria-expanded",
                    "false"
                );

                toggle.setAttribute(
                    "aria-label",
                    "Open navigation menu"
                );

                const icon = toggle.querySelector(
                    '[aria-hidden="true"]'
                );

                if (icon) {
                    icon.textContent = "☰";
                }
            });
        });
    }

    /* HANDLE WEBSITE CLICKS */

    function initialiseEvents() {
        if (initialized) {
            return;
        }

        initialized = true;

        document.addEventListener("click", event => {

            /* ADD TO CART */

            const addButton = event.target.closest(
                "[data-add-to-cart], button[data-product-id]"
            );

            if (addButton) {
                event.preventDefault();

                const product = readProductButton(addButton);

                const added = addToCart(product);

                if (added) {
                    updateCartDisplay();
                }

                return;
            }

            /* INCREASE OR DECREASE PRODUCT QUANTITY */

            const minusButton = event.target.closest(
                "[data-product-minus]"
            );

            const plusButton = event.target.closest(
                "[data-product-plus]"
            );
            if (minusButton || plusButton) {
    event.preventDefault();

    const button = minusButton || plusButton;

    const card = button.closest("[data-product-card]");

    const input = card
        ? card.querySelector("[data-product-quantity]")
        : null;

    if (!input || !card) {
        return;
    }

    const current = Number(input.value || 1);

    const next = plusButton
        ? current + 1
        : current - 1;

    const productButton = card.querySelector(
        "[data-add-to-cart], button[data-product-id]"
    );

    if (!productButton) {
        return;
    }

    const product = readProductButton(productButton);

    // Remove the product when minus is pressed at quantity 1.
    if (next <= 0) {
        removeItem(product.id);
        updateCartDisplay();
        return;
    }

    // Otherwise, update the quantity normally.
    input.value = Math.min(99, next);

    setProductQuantity(
        product.id,
        Number(input.value)
    );

    updateCartDisplay();

    return;
}

            /* CART PAGE QUANTITY BUTTONS */

            const cartQuantityButton = event.target.closest(
                "[data-quantity-change]"
            );

            if (cartQuantityButton) {
                event.preventDefault();

                const id = cartQuantityButton.dataset.itemId;

                const change = Number(
                    cartQuantityButton.dataset.quantityChange
                );

                if (id && Number.isFinite(change)) {
                    changeQuantity(id, change);
                }

                return;
            }

            /* REMOVE ITEM */

            const removeButton = event.target.closest(
                "[data-remove-item]"
            );

            if (removeButton) {
                event.preventDefault();

                removeItem(
                    removeButton.dataset.removeItem
                );

                return;
            }

            /* CHECKOUT */

            const checkoutButton = event.target.closest(
                "[data-checkout-button]"
            );

            if (checkoutButton) {
                event.preventDefault();

                prepareCheckout();
            }
        });

        /* HANDLE MANUAL QUANTITY CHANGES */

        document.addEventListener("change", event => {
            const input = event.target.closest(
                "[data-product-quantity]"
            );

            if (!input) {
                return;
            }

            const quantity = Number(input.value);

            input.value = String(
                Number.isInteger(quantity)
                    ? Math.max(1, Math.min(99, quantity))
                    : 1
            );

            const card = input.closest(
                "[data-product-card]"
            );

            if (!card) {
                return;
            }

            const addButton = card.querySelector(
                "[data-add-to-cart], button[data-product-id]"
            );

            if (!addButton) {
                return;
            }

            const product = readProductButton(addButton);

            const cart = getCart();

            const existing = cart.find(
                item => item.id === String(product.id)
            );

            if (existing) {
                setProductQuantity(
                    product.id,
                    Number(input.value)
                );
            }
        });

        /* SYNCHRONISE CART BETWEEN TABS */

        window.addEventListener("storage", event => {
            if (event.key === CART_KEY) {
                updateCartDisplay();
            }
        });
    }

    /* START WEBSITE */

    function init() {
        initialiseEvents();

        initialiseMobileNavigation();

        createShopCartBar();

        updateCartDisplay();

        initialiseCheckout();

        const year = document.querySelector(
            "#copyright-year"
        );

        if (year) {
            year.textContent = new Date().getFullYear();
        }
    }

    /* PUBLIC FUNCTIONS */

    return {
        init,
        addToCart,
        changeQuantity,
        removeItem,
        clearCart,
        getCart,
        getCartCount,
        getSubtotal,

        getSizes: () => SIZES.map(size => ({
            ...size,
            price: priceForSize(size.litres)
        })),

        formatMoney,
        prepareCheckout,
        getPendingOrder,
        updateCartDisplay
    };
})();

/* RUN AFTER HTML HAS LOADED */
window.HoneyShop = HoneyShop;

document.addEventListener(
    "DOMContentLoaded",
    HoneyShop.init
);