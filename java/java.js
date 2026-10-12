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

    const SIZES = [
        { label: "⅛ Litre", litres: 0.125 },
        { label: "¼ Litre", litres: 0.25 },
        { label: "½ Litre", litres: 0.5 },
        ...Array.from({ length: 25 }, (_, i) => ({
            label: `${i + 1} ${i === 0 ? "Litre" : "Litres"}`,
            litres: i + 1
        }))
    ];

    const formatMoney = amount =>
        new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            maximumFractionDigits: 0
        }).format(Number(amount) || 0);

    const priceForSize = litres =>
        Math.round(Number(litres) * PRICE_PER_LITRE);

    function getCart() {
        try {
            const parsed = JSON.parse(
                localStorage.getItem(CART_KEY) || "[]"
            );

            if (!Array.isArray(parsed)) return [];

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
                    price: priceForSize(Number(item.litres))
                }));
        } catch (error) {
            console.warn("Unable to read the saved honey cart.", error);
            return [];
        }
    }

    function saveCart(cart) {
        try {
            localStorage.setItem(CART_KEY, JSON.stringify(cart));
            updateCartDisplay();
        } catch (error) {
            console.error("Unable to save the honey cart.", error);
            showToast("Unable to save your cart. Please check your browser settings.");
        }
    }

    function getCartCount() {
        return getCart().reduce(
            (total, item) => total + item.quantity,
            0
        );
    }

    function getSubtotal() {
        return getCart().reduce(
            (total, item) => total + item.price * item.quantity,
            0
        );
    }

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

    /* ADD TO CART */

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
            showToast("Please select a valid honey size and quantity.");
            return;
        }

        const cart = getCart();
        const id = String(product.id || `${litres}-litre`);

        const existing = cart.find(item => item.id === id);

        if (existing) {
            existing.quantity = Math.min(
                999,
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
    }

    /* CHANGE QUANTITY INSIDE CART */

    function changeQuantity(id, change) {
        const cart = getCart();
        const item = cart.find(product => product.id === id);

        if (!item) return;

        item.quantity += Number(change);

        if (item.quantity <= 0) {
            saveCart(cart.filter(product => product.id !== id));
            return;
        }

        item.quantity = Math.min(999, item.quantity);

        saveCart(cart);
    }

    /* REMOVE ITEM */

    function removeItem(id) {
        saveCart(getCart().filter(item => item.id !== id));
        showToast("Item removed from your cart.");
    }

    function clearCart() {
        localStorage.removeItem(CART_KEY);
        updateCartDisplay();
    }

    /* PROTECT HTML OUTPUT */

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
                    <p>Choose your preferred size to get started.</p>
                    <a class="button" href="shop.html">Shop Honey</a>
                </div>
            `;
            return;
        }

        container.innerHTML = cart.map(item => `
            <article class="cart-item"
                data-item-id="${escapeHTML(item.id)}">

                <div class="cart-item-info">
                    <h3>${escapeHTML(item.name)}</h3>
                    <p>${escapeHTML(item.size)}</p>
                    <p>${formatMoney(item.price)} each</p>
                </div>

                <div class="cart-item-quantity">
                    <button
                        type="button"
                        data-quantity-change="-1"
                        data-item-id="${escapeHTML(item.id)}"
                        aria-label="Decrease quantity">−</button>

                    <span>${item.quantity}</span>

                    <button
                        type="button"
                        data-quantity-change="1"
                        data-item-id="${escapeHTML(item.id)}"
                        aria-label="Increase quantity">+</button>
                </div>

                <strong class="cart-item-total">
                    ${formatMoney(item.price * item.quantity)}
                </strong>

                <button
                    type="button"
                    class="remove-cart-item"
                    data-remove-item="${escapeHTML(item.id)}">
                    Remove
                </button>

            </article>
        `).join("");
    }

    /* UPDATE CART COUNT AND TOTALS */

    function updateCartDisplay() {
        const cart = getCart();

        const count = cart.reduce(
            (sum, item) => sum + item.quantity,
            0
        );

        const subtotal = cart.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );

        document.querySelectorAll("[data-cart-count]").forEach(element => {
            element.textContent = count;
        });

        document.querySelectorAll(
            "[data-cart-subtotal], [data-checkout-subtotal]"
        ).forEach(element => {
            element.textContent = formatMoney(subtotal);
        });

        document.querySelectorAll(
            "[data-cart-total], [data-checkout-total]"
        ).forEach(element => {
            element.textContent = formatMoney(subtotal);
        });

        document.querySelectorAll("[data-cart-items]").forEach(container => {
            renderCart(container, cart);
        });

        document.querySelectorAll("[data-cart-empty]").forEach(element => {
            element.hidden = cart.length > 0;
        });

        document.querySelectorAll("[data-cart-filled]").forEach(element => {
            element.hidden = cart.length === 0;
        });

        document.querySelectorAll("[data-checkout-button]").forEach(button => {
            button.disabled = cart.length === 0;
        });
    }

    /* READ PRODUCT DETAILS */

    function readProductButton(button) {
        const card = button.closest("[data-product-card]");

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
            id: button.dataset.productId || `${litres}-litre`,
            name: button.dataset.productName || "3W Ventures Honey",
            size,
            litres,
            quantity
        };
    }

    /* CHECKOUT */

    function prepareCheckout() {
        const cart = getCart();

        if (!cart.length) {
            showToast("Your cart is empty. Please add honey first.");
            return;
        }

        const order = {
            items: cart,
            subtotal: getSubtotal(),
            currency: "NGN",
            deliveryFee: null,
            deliveryFeeConfirmed: false,
            paymentStatus: "pending",
            createdAt: new Date().toISOString()
        };

        localStorage.setItem(ORDER_KEY, JSON.stringify(order));

        window.location.href = "checkout.html";
    }

    function getPendingOrder() {
        try {
            return JSON.parse(
                localStorage.getItem(ORDER_KEY) || "null"
            );
        } catch {
            return null;
        }
    }

    function initialiseCheckout() {
        document.querySelectorAll("[data-checkout-button]").forEach(button => {
            button.disabled = getCart().length === 0;
        });

        const order = getPendingOrder();

        if (!order) return;

        const subtotal = document.querySelector("[data-checkout-subtotal]");
        const total = document.querySelector("[data-checkout-total]");
        const deliveryFee = document.querySelector("[data-delivery-fee]");

        if (subtotal) {
            subtotal.textContent = formatMoney(order.subtotal);
        }

        if (deliveryFee) {
            deliveryFee.value = order.deliveryFeeConfirmed
                ? formatMoney(order.deliveryFee)
                : "Awaiting confirmation";
        }

        if (total) {
            total.textContent = formatMoney(
                Number(order.subtotal || 0) +
                (
                    order.deliveryFeeConfirmed
                        ? Number(order.deliveryFee || 0)
                        : 0
                )
            );
        }
    }

    /* ALL CLICK EVENTS ARE HANDLED ONCE */

    function initialiseEvents() {
        if (initialized) return;

        initialized = true;

        document.addEventListener("click", event => {

            /* ADD TO CART */
            const addButton = event.target.closest(
                "[data-product-id]"
            );

            if (addButton) {
                event.preventDefault();
                addToCart(readProductButton(addButton));
                return;
            }

            /* PRODUCT QUANTITY BUTTONS */
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

                if (!input) return;

                const current = Number(input.value || 1);

                const next = plusButton
                    ? current + 1
                    : current - 1;

                input.value = Math.max(
                    1,
                    Math.min(99, Number.isFinite(next) ? next : 1)
                );

                input.dispatchEvent(
                    new Event("change", { bubbles: true })
                );

                return;
            }

            /* QUANTITY BUTTONS ON CART PAGE */
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

            /* REMOVE FROM CART */
            const removeButton = event.target.closest(
                "[data-remove-item]"
            );

            if (removeButton) {
                event.preventDefault();
                removeItem(removeButton.dataset.removeItem);
                return;
            }

            /* PROCEED TO CHECKOUT */
            const checkoutButton = event.target.closest(
                "[data-checkout-button]"
            );

            if (checkoutButton) {
                event.preventDefault();
                prepareCheckout();
            }
        });

        /* VALIDATE MANUALLY ENTERED QUANTITY */
        document.addEventListener("change", event => {
            const input = event.target.closest(
                "[data-product-quantity]"
            );

            if (!input) return;

            const quantity = Number(input.value);

            input.value = String(
                Number.isInteger(quantity)
                    ? Math.max(1, Math.min(99, quantity))
                    : 1
            );
        });

        /* UPDATE IF ANOTHER TAB CHANGES THE CART */
        window.addEventListener("storage", event => {
            if (event.key === CART_KEY) {
                updateCartDisplay();
            }
        });
    }

    /* START WEBSITE FUNCTIONALITY */

    function init() {
        initialiseEvents();
        updateCartDisplay();
        initialiseCheckout();

        const year = document.querySelector("#copyright-year");

        if (year) {
            year.textContent = new Date().getFullYear();
        }
    }

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

document.addEventListener("DOMContentLoaded", HoneyShop.init);