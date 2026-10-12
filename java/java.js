/* ==========================================
   3W VENTURES HONEY
   Shopping Cart & Website Functionality
   ========================================== */

"use strict";

const HoneyShop = (() => {
    const PRICE_PER_LITRE = 10000;
    const CART_KEY = "3w_honey_cart";
    const ORDER_KEY = "3w_honey_pending_order";

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
        }).format(amount);

    const priceForSize = litres =>
        Math.round(litres * PRICE_PER_LITRE);

    function getCart() {
        try {
            const cart = JSON.parse(localStorage.getItem(CART_KEY));
            return Array.isArray(cart) ? cart : [];
        } catch {
            return [];
        }
    }

    function saveCart(cart) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        updateCartDisplay();
    }

    function getCartCount() {
        return getCart().reduce((total, item) => total + item.quantity, 0);
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
                borderRadius: "8px",
                zIndex: "99999",
                maxWidth: "90%",
                textAlign: "center",
                boxShadow: "0 5px 20px rgba(0,0,0,.18)"
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

    function addToCart(product) {
        const litres = Number(product.litres);
        const quantity = Number(product.quantity || 1);

        if (!Number.isFinite(litres) || litres <= 0 ||
            !Number.isInteger(quantity) || quantity < 1) {
            showToast("Please select a valid honey size and quantity.");
            return;
        }

        const cart = getCart();
        const id = String(product.id || `${litres}-litre`);

        const existing = cart.find(item => item.id === id);

        if (existing) {
            existing.quantity += quantity;
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
        showToast("Honey added to your cart successfully!");
    }

    function changeQuantity(id, change) {
        const cart = getCart();
        const item = cart.find(product => product.id === id);

        if (!item) return;

        item.quantity += change;

        if (item.quantity <= 0) {
            const updatedCart = cart.filter(product => product.id !== id);
            saveCart(updatedCart);
            return;
        }

        saveCart(cart);
    }

    function removeItem(id) {
        saveCart(getCart().filter(item => item.id !== id));
        showToast("Item removed from your cart.");
    }

    function clearCart() {
        localStorage.removeItem(CART_KEY);
        updateCartDisplay();
    }

    function updateCartDisplay() {
        const cart = getCart();
        const count = getCartCount();
        const subtotal = getSubtotal();

        document.querySelectorAll("[data-cart-count]").forEach(element => {
            element.textContent = count;
        });

        document.querySelectorAll("[data-cart-subtotal]").forEach(element => {
            element.textContent = formatMoney(subtotal);
        });

        document.querySelectorAll("[data-cart-total]").forEach(element => {
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

    function renderCart(container, cart) {
        if (cart.length === 0) {
            container.innerHTML = `
                <div class="empty-cart-message">
                    <h3>Your cart is waiting for some honey.</h3>
                    <p>Choose your preferred size to get started.</p>
                    <a href="shop.html">Shop Honey</a>
                </div>
            `;
            return;
        }

        container.innerHTML = cart.map(item => `
            <article class="cart-item" data-item-id="${escapeHTML(item.id)}">
                <div class="cart-item-info">
                    <h3>${escapeHTML(item.name)}</h3>
                    <p>${escapeHTML(item.size)}</p>
                    <p>${formatMoney(item.price)} each</p>
                </div>

                <div class="cart-item-quantity">
                    <button type="button"
                        data-quantity-change="-1"
                        data-item-id="${escapeHTML(item.id)}"
                        aria-label="Decrease quantity">−</button>

                    <span>${item.quantity}</span>

                    <button type="button"
                        data-quantity-change="1"
                        data-item-id="${escapeHTML(item.id)}"
                        aria-label="Increase quantity">+</button>
                </div>

                <strong>${formatMoney(item.price * item.quantity)}</strong>

                <button type="button"
                    data-remove-item="${escapeHTML(item.id)}"
                    aria-label="Remove ${escapeHTML(item.name)}">
                    Remove
                </button>
            </article>
        `).join("");
    }

    function escapeHTML(value) {
        return String(value).replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[character]);
    }

    function prepareCheckout() {
        const cart = getCart();

        if (cart.length === 0) {
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
            return JSON.parse(localStorage.getItem(ORDER_KEY));
        } catch {
            return null;
        }
    }

    function initialiseProductButtons() {
    document.querySelectorAll("[data-product-id]").forEach(button => {
        if (button.dataset.honeyListener === "true") return;

        button.dataset.honeyListener = "true";

        button.addEventListener("click", () => {
            const card = button.closest("[data-product-card]");

            // Read the size from the button first, then the product card.
            let litres = Number(button.dataset.litres);

            if (!litres && card) {
                litres = Number(card.dataset.litres);
            }

            // Support sizes written as fractions.
            const sizeText = (
                button.dataset.productSize ||
                (card && card.dataset.productSize) ||
                (card && card.innerText) ||
                ""
            );

            if (!Number.isFinite(litres) || litres <= 0) {
                if (/⅛|1\/8/.test(sizeText)) {
                    litres = 0.125;
                } else if (/¼|1\/4/.test(sizeText)) {
                    litres = 0.25;
                } else if (/½|1\/2/.test(sizeText)) {
                    litres = 0.5;
                } else {
                    const match = sizeText.match(
                        /(\d+(?:\.\d+)?)\s*(?:litres?|liters?|L)\b/i
                    );

                    if (match) {
                        litres = Number(match[1]);
                    }
                }
            }

            const quantityInput = card
                ? card.querySelector("[data-product-quantity]")
                : null;

            const quantity = quantityInput
                ? Number(quantityInput.value || 1)
                : 1;

            if (!Number.isFinite(litres) || litres <= 0) {
                console.error("Could not identify honey size:", button);
                showToast("Please check the product size in your HTML.");
                return;
            }

            addToCart({
                id: button.dataset.productId || `${litres}-litre`,
                name: button.dataset.productName || "3W Ventures Honey",
                size: button.dataset.productSize || sizeText.trim().split("\n")[0],
                litres: litres,
                quantity: quantity
            });
        });
    });
}
    function initialiseQuantityButtons() {
        document.addEventListener("click", event => {
            const quantityButton = event.target.closest("[data-quantity-change]");

            if (quantityButton) {
                const id = quantityButton.dataset.itemId;
                const change = Number(quantityButton.dataset.quantityChange);

                if (id && Number.isFinite(change)) {
                    changeQuantity(id, change);
                }
                return;
            }

            const removeButton = event.target.closest("[data-remove-item]");

            if (removeButton) {
                removeItem(removeButton.dataset.removeItem);
            }
        });

        document.querySelectorAll("[data-product-card]").forEach(card => {
            const input = card.querySelector("[data-product-quantity]");
            const minus = card.querySelector("[data-product-minus]");
            const plus = card.querySelector("[data-product-plus]");

            if (!input) return;

            input.min = "1";

            if (!input.value || Number(input.value) < 1) {
                input.value = "1";
            }

            minus?.addEventListener("click", () => {
                input.value = Math.max(1, Number(input.value || 1) - 1);
            });

            plus?.addEventListener("click", () => {
                input.value = Math.max(1, Number(input.value || 1) + 1);
            });
        });
    }

    function initialiseCheckout() {
        document.querySelectorAll("[data-checkout-button]").forEach(button => {
            button.addEventListener("click", event => {
                event.preventDefault();
                prepareCheckout();
            });
        });

        const subtotal = document.querySelector("[data-checkout-subtotal]");
        const total = document.querySelector("[data-checkout-total]");
        const deliveryFee = document.querySelector("[data-delivery-fee]");

        const order = getPendingOrder();

        if (order) {
            if (subtotal) subtotal.textContent = formatMoney(order.subtotal);

            // Delivery fee must be confirmed by the business.
            if (deliveryFee) {
                deliveryFee.value = order.deliveryFeeConfirmed
                    ? formatMoney(order.deliveryFee)
                    : "Awaiting confirmation";
            }

            if (total) {
                total.textContent = formatMoney(
                    order.subtotal +
                    (order.deliveryFeeConfirmed ? order.deliveryFee : 0)
                );
            }
        }
    }

    function getSizes() {
        return SIZES.map(size => ({
            ...size,
            price: priceForSize(size.litres)
        }));
    }

    function init() {
        initialiseProductButtons();
        initialiseQuantityButtons();
        initialiseCheckout();
        updateCartDisplay();
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
        getSizes,
        formatMoney,
        prepareCheckout,
        getPendingOrder,
        updateCartDisplay
    };
})();

document.addEventListener("DOMContentLoaded", HoneyShop.init);