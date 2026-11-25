// ==========================================================================
// ĐẠT XỨ DỪA – LOGIC GIỎ HÀNG LOCALSTORAGE, BỘ LỌC & ĐẶT HÀNG COD
// ==========================================================================

(function () {
  "use strict";

  const STORAGE_KEY = "dat_xu_dua_cart_v1";
  const FREE_SHIPPING_THRESHOLD = 300000;
  const STANDARD_SHIPPING_FEE = 25000;

  const products = Array.isArray(window.PRODUCTS) ? window.PRODUCTS : [];
  const categories = Array.isArray(window.PRODUCT_CATEGORIES) ? window.PRODUCT_CATEGORIES : [];

  let activeCategory = "all";
  let cart = loadCartFromStorage();
  let toastTimer = null;

  // Định dạng tiền tệ tiếng Việt chuẩn dạng "120.000đ"
  function formatVND(amount) {
    const cleanNumber = Math.max(0, Math.round(Number(amount) || 0));
    return cleanNumber.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "đ";
  }

  function findProduct(productId) {
    return products.find(function (item) {
      return item.id === productId;
    });
  }

  function loadCartFromStorage() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(function (entry) {
          return (
            entry &&
            typeof entry.productId === "string" &&
            Number.isInteger(entry.quantity) &&
            entry.quantity > 0 &&
            Boolean(findProduct(entry.productId))
          );
        })
        .map(function (entry) {
          return { productId: entry.productId, quantity: entry.quantity };
        });
    } catch (err) {
      return [];
    }
  }

  function saveCartToStorage() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (err) {
      // Bỏ qua nếu trình duyệt chặn bộ nhớ cục bộ
    }
  }

  // ======================== HIỂN THỊ BỘ LỌC & SẢN PHẨM ========================
  function renderCategoryFilters() {
    const filterContainer = document.getElementById("category-filters");
    if (!filterContainer) return;

    filterContainer.innerHTML = "";

    categories.forEach(function (cat) {
      const count =
        cat.id === "all"
          ? products.length
          : products.filter(function (p) {
              return p.category === cat.id;
            }).length;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "filter-btn" + (cat.id === activeCategory ? " is-active" : "");
      btn.dataset.category = cat.id;
      btn.setAttribute("aria-pressed", cat.id === activeCategory ? "true" : "false");
      btn.textContent = cat.icon + " " + cat.name + " (" + count + ")";

      btn.addEventListener("click", function () {
        activeCategory = cat.id;
        renderCategoryFilters();
        renderProductsGrid();
      });

      filterContainer.appendChild(btn);
    });
  }

  function renderProductsGrid() {
    const grid = document.getElementById("products-grid");
    if (!grid) return;

    const filtered =
      activeCategory === "all"
        ? products
        : products.filter(function (p) {
            return p.category === activeCategory;
          });

    grid.innerHTML = "";

    filtered.forEach(function (product) {
      const card = document.createElement("article");
      card.className = "product-card";
      card.dataset.productId = product.id;

      const art = document.createElement("div");
      art.className = "product-art";

      const badge = document.createElement("span");
      badge.className = "product-badge";
      badge.style.color = product.accentColor;
      badge.textContent = product.badge;

      const img = document.createElement("img");
      img.className = "product-photo";
      img.src = product.image;
      img.alt = product.imageAlt || product.name;
      img.loading = "lazy";

      const catTag = document.createElement("span");
      catTag.className = "product-category-tag";
      catTag.textContent = product.categoryLabel;

      art.appendChild(badge);
      art.appendChild(img);
      art.appendChild(catTag);

      const body = document.createElement("div");
      body.className = "product-body";

      const title = document.createElement("h3");
      title.className = "product-title";
      title.textContent = product.name;

      const desc = document.createElement("p");
      desc.className = "product-desc";
      desc.textContent = product.description;

      const unit = document.createElement("div");
      unit.className = "product-unit";
      unit.textContent = "Quy cách: " + product.unit;

      const footer = document.createElement("div");
      footer.className = "product-footer";

      const price = document.createElement("span");
      price.className = "product-price";
      price.textContent = formatVND(product.price);

      const addBtn = document.createElement("button");
      addBtn.type = "button";
      addBtn.className = "btn btn-primary btn-add-cart";
      addBtn.dataset.addId = product.id;
      addBtn.textContent = "+ Thêm vào giỏ";
      addBtn.addEventListener("click", function () {
        addToCart(product.id);
      });

      footer.appendChild(price);
      footer.appendChild(addBtn);

      body.appendChild(title);
      body.appendChild(desc);
      body.appendChild(unit);
      body.appendChild(footer);

      card.appendChild(art);
      card.appendChild(body);
      grid.appendChild(card);
    });
  }

  // ======================== THAO TÁC GIỎ HÀNG ========================
  function addToCart(productId) {
    const product = findProduct(productId);
    if (!product) return;

    const existing = cart.find(function (item) {
      return item.productId === productId;
    });

    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ productId: productId, quantity: 1 });
    }

    saveCartToStorage();
    renderCart();
    clearFormBannerIfCartAdded();
    showToast('Đã thêm "' + product.name + '" vào giỏ hàng!');
  }

  function updateCartQuantity(productId, delta) {
    const index = cart.findIndex(function (item) {
      return item.productId === productId;
    });
    if (index === -1) return;

    const newQty = cart[index].quantity + delta;
    if (newQty <= 0) {
      cart.splice(index, 1);
    } else {
      cart[index].quantity = newQty;
    }

    saveCartToStorage();
    renderCart();
  }

  function removeFromCart(productId) {
    cart = cart.filter(function (item) {
      return item.productId !== productId;
    });
    saveCartToStorage();
    renderCart();
  }

  function clearCart() {
    cart = [];
    saveCartToStorage();
    renderCart();
  }

  function calculateTotals() {
    let totalItems = 0;
    let subtotal = 0;

    cart.forEach(function (entry) {
      const product = findProduct(entry.productId);
      if (product) {
        totalItems += entry.quantity;
        subtotal += product.price * entry.quantity;
      }
    });

    let shippingFee = 0;
    if (subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD) {
      shippingFee = STANDARD_SHIPPING_FEE;
    }

    const total = subtotal + shippingFee;
    return {
      totalItems: totalItems,
      subtotal: subtotal,
      shippingFee: shippingFee,
      total: total
    };
  }

  function renderCart() {
    const totals = calculateTotals();

    const badgeEl = document.getElementById("cart-count-badge");
    const totalItemsTextEl = document.getElementById("cart-total-items-text");
    const clearBtn = document.getElementById("clear-cart-btn");
    const listEl = document.getElementById("cart-items-list");
    const subtotalEl = document.getElementById("subtotal-amount");
    const shippingEl = document.getElementById("shipping-amount");
    const totalEl = document.getElementById("total-amount");
    const btnTotalEl = document.getElementById("btn-total-amount");
    const freeshipTextEl = document.getElementById("freeship-text");
    const freeshipFillEl = document.getElementById("freeship-bar-fill");
    const mobileBar = document.getElementById("mobile-cart-bar");
    const mobileCount = document.getElementById("mobile-cart-count");
    const mobileTotal = document.getElementById("mobile-cart-total");

    if (badgeEl) badgeEl.textContent = String(totals.totalItems);
    if (totalItemsTextEl) totalItemsTextEl.textContent = String(totals.totalItems);
    if (clearBtn) clearBtn.hidden = cart.length === 0;

    if (freeshipTextEl && freeshipFillEl) {
      if (totals.subtotal === 0) {
        freeshipTextEl.innerHTML =
          "Mua đơn từ <strong>300.000đ</strong> để được <strong>Miễn phí giao hàng (0đ)</strong>!";
        freeshipFillEl.style.width = "0%";
      } else if (totals.subtotal < FREE_SHIPPING_THRESHOLD) {
        const remaining = FREE_SHIPPING_THRESHOLD - totals.subtotal;
        const pct = Math.min(98, Math.round((totals.subtotal / FREE_SHIPPING_THRESHOLD) * 100));
        freeshipTextEl.innerHTML =
          "Mua thêm <strong>" +
          formatVND(remaining) +
          "</strong> nữa để được <strong>Miễn phí giao hàng (0đ)</strong>!";
        freeshipFillEl.style.width = pct + "%";
      } else {
        freeshipTextEl.innerHTML =
          "🎉 Tuyệt vời! Đơn hàng từ 300.000đ đã được <strong>Miễn phí giao hàng (0đ)</strong>!";
        freeshipFillEl.style.width = "100%";
      }
    }

    if (listEl) {
      listEl.innerHTML = "";
      if (cart.length === 0) {
        const emptyDiv = document.createElement("div");
        emptyDiv.className = "cart-empty-state";
        emptyDiv.innerHTML =
          '<div class="cart-empty-icon" aria-hidden="true">🥥</div>' +
          "<p><strong>Giỏ hàng của bạn đang trống.</strong><br>Hãy chọn mứt dừa non hoặc dừa xiêm tươi Châu Bình – Giồng Trôm ở phía trên nhé!</p>";
        listEl.appendChild(emptyDiv);
      } else {
        cart.forEach(function (entry) {
          const product = findProduct(entry.productId);
          if (!product) return;

          const row = document.createElement("div");
          row.className = "cart-item";
          row.dataset.cartProductId = product.id;

          const thumb = document.createElement("div");
          thumb.className = "cart-item-thumb";

          const thumbImg = document.createElement("img");
          thumbImg.className = "cart-thumb-img";
          thumbImg.src = product.image;
          thumbImg.alt = "";
          thumb.appendChild(thumbImg);

          const info = document.createElement("div");
          info.className = "cart-item-info";

          const itemName = document.createElement("p");
          itemName.className = "cart-item-name";
          itemName.textContent = product.name;

          const meta = document.createElement("div");
          meta.className = "cart-item-meta";
          const lineSubtotal = product.price * entry.quantity;
          meta.innerHTML =
            formatVND(product.price) +
            " × " +
            entry.quantity +
            ' = <span class="cart-item-subtotal">' +
            formatVND(lineSubtotal) +
            "</span>";

          info.appendChild(itemName);
          info.appendChild(meta);

          const controls = document.createElement("div");
          controls.className = "cart-item-controls";

          const minusBtn = document.createElement("button");
          minusBtn.type = "button";
          minusBtn.className = "qty-btn";
          minusBtn.dataset.action = "decrease";
          minusBtn.setAttribute("aria-label", "Giảm số lượng " + product.name);
          minusBtn.textContent = "−";
          minusBtn.addEventListener("click", function () {
            updateCartQuantity(product.id, -1);
          });

          const qtySpan = document.createElement("span");
          qtySpan.className = "qty-value";
          qtySpan.textContent = String(entry.quantity);

          const plusBtn = document.createElement("button");
          plusBtn.type = "button";
          plusBtn.className = "qty-btn";
          plusBtn.dataset.action = "increase";
          plusBtn.setAttribute("aria-label", "Tăng số lượng " + product.name);
          plusBtn.textContent = "+";
          plusBtn.addEventListener("click", function () {
            updateCartQuantity(product.id, 1);
          });

          const removeBtn = document.createElement("button");
          removeBtn.type = "button";
          removeBtn.className = "remove-item-btn";
          removeBtn.dataset.action = "remove";
          removeBtn.setAttribute("aria-label", "Xóa " + product.name + " khỏi giỏ hàng");
          removeBtn.title = "Xóa món này";
          removeBtn.textContent = "✕";
          removeBtn.addEventListener("click", function () {
            removeFromCart(product.id);
          });

          controls.appendChild(minusBtn);
          controls.appendChild(qtySpan);
          controls.appendChild(plusBtn);
          controls.appendChild(removeBtn);

          row.appendChild(thumb);
          row.appendChild(info);
          row.appendChild(controls);
          listEl.appendChild(row);
        });
      }
    }

    if (subtotalEl) subtotalEl.textContent = formatVND(totals.subtotal);
    if (shippingEl) {
      if (totals.subtotal === 0) {
        shippingEl.textContent = "0đ";
      } else if (totals.shippingFee === 0) {
        shippingEl.textContent = "0đ (Miễn phí)";
      } else {
        shippingEl.textContent = formatVND(totals.shippingFee);
      }
    }
    if (totalEl) totalEl.textContent = formatVND(totals.total);
    if (btnTotalEl) btnTotalEl.textContent = formatVND(totals.total);

    if (mobileBar && mobileCount && mobileTotal) {
      if (totals.totalItems > 0) {
        mobileBar.hidden = false;
        mobileCount.textContent = totals.totalItems + " món trong giỏ";
        mobileTotal.textContent = formatVND(totals.total);
      } else {
        mobileBar.hidden = true;
      }
    }
  }

  // ======================== KIỂM TRA HỢP LỆ & ĐẶT HÀNG ========================
  function isValidVietnamPhone(rawPhone) {
    const digits = rawPhone.replace(/[\s.\-()]/g, "");
    return /^(0[35789]\d{8}|02\d{8,9})$/.test(digits);
  }

  function setFieldError(inputEl, errorEl, message) {
    if (message) {
      if (inputEl) {
        inputEl.classList.add("is-invalid");
        inputEl.setAttribute("aria-invalid", "true");
      }
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.hidden = false;
      }
    } else {
      if (inputEl) {
        inputEl.classList.remove("is-invalid");
        inputEl.removeAttribute("aria-invalid");
      }
      if (errorEl) {
        errorEl.textContent = "";
        errorEl.hidden = true;
      }
    }
  }

  function clearFormBannerIfCartAdded() {
    const banner = document.getElementById("form-error-banner");
    if (banner && !banner.hidden && cart.length > 0 && banner.dataset.reason === "empty-cart") {
      banner.hidden = true;
      banner.textContent = "";
    }
  }

  function generateOrderCode() {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const rand = Math.floor(1000 + Math.random() * 9000);
    return "DXD-" + yy + mm + dd + "-" + rand;
  }

  function setupCheckoutForm() {
    const form = document.getElementById("checkout-form");
    const nameInput = document.getElementById("customer-name");
    const phoneInput = document.getElementById("customer-phone");
    const addressInput = document.getElementById("customer-address");
    const consentInput = document.getElementById("consent-checkbox");

    const nameErr = document.getElementById("error-customer-name");
    const phoneErr = document.getElementById("error-customer-phone");
    const addressErr = document.getElementById("error-customer-address");
    const consentErr = document.getElementById("error-consent");
    const errorBanner = document.getElementById("form-error-banner");

    const clearCartBtn = document.getElementById("clear-cart-btn");
    if (clearCartBtn) {
      clearCartBtn.addEventListener("click", function () {
        clearCart();
        showToast("Đã xóa toàn bộ giỏ hàng.");
      });
    }

    if (!form) return;

    if (nameInput) {
      nameInput.addEventListener("input", function () {
        if (nameInput.value.trim().length > 0) setFieldError(nameInput, nameErr, "");
      });
    }
    if (phoneInput) {
      phoneInput.addEventListener("input", function () {
        if (isValidVietnamPhone(phoneInput.value.trim())) setFieldError(phoneInput, phoneErr, "");
      });
    }
    if (addressInput) {
      addressInput.addEventListener("input", function () {
        if (addressInput.value.trim().length >= 5) setFieldError(addressInput, addressErr, "");
      });
    }
    if (consentInput) {
      consentInput.addEventListener("change", function () {
        if (consentInput.checked) setFieldError(consentInput, consentErr, "");
      });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      const totals = calculateTotals();
      if (totals.totalItems === 0) {
        if (errorBanner) {
          errorBanner.dataset.reason = "empty-cart";
          errorBanner.textContent =
            "Giỏ hàng đang trống. Vui lòng chọn ít nhất 1 sản phẩm trước khi đặt hàng.";
          errorBanner.hidden = false;
        }
        return;
      }

      const nameVal = nameInput ? nameInput.value.trim() : "";
      const phoneVal = phoneInput ? phoneInput.value.trim() : "";
      const addressVal = addressInput ? addressInput.value.trim() : "";
      const consentChecked = consentInput ? consentInput.checked : false;

      let firstInvalidEl = null;
      let errorCount = 0;

      if (!nameVal) {
        setFieldError(nameInput, nameErr, "Vui lòng nhập họ và tên người nhận hàng.");
        firstInvalidEl = firstInvalidEl || nameInput;
        errorCount += 1;
      } else {
        setFieldError(nameInput, nameErr, "");
      }

      if (!phoneVal) {
        setFieldError(phoneInput, phoneErr, "Vui lòng nhập số điện thoại liên hệ.");
        firstInvalidEl = firstInvalidEl || phoneInput;
        errorCount += 1;
      } else if (!isValidVietnamPhone(phoneVal)) {
        setFieldError(
          phoneInput,
          phoneErr,
          "Số điện thoại không hợp lệ. Vui lòng nhập đúng 10 chữ số (ví dụ: 0912345678)."
        );
        firstInvalidEl = firstInvalidEl || phoneInput;
        errorCount += 1;
      } else {
        setFieldError(phoneInput, phoneErr, "");
      }

      if (!addressVal) {
        setFieldError(addressInput, addressErr, "Vui lòng nhập địa chỉ giao hàng chi tiết.");
        firstInvalidEl = firstInvalidEl || addressInput;
        errorCount += 1;
      } else if (addressVal.length < 5) {
        setFieldError(
          addressInput,
          addressErr,
          "Địa chỉ quá ngắn. Vui lòng ghi rõ số nhà, đường, phường/xã, quận/huyện, tỉnh/thành."
        );
        firstInvalidEl = firstInvalidEl || addressInput;
        errorCount += 1;
      } else {
        setFieldError(addressInput, addressErr, "");
      }

      if (!consentChecked) {
        setFieldError(
          consentInput,
          consentErr,
          "Vui lòng đánh dấu đồng ý cho cửa hàng dùng thông tin này để giao hàng."
        );
        firstInvalidEl = firstInvalidEl || consentInput;
        errorCount += 1;
      } else {
        setFieldError(consentInput, consentErr, "");
      }

      if (errorCount > 0) {
        if (errorBanner) {
          errorBanner.dataset.reason = "validation";
          errorBanner.textContent =
            "Chưa thể đặt hàng: Vui lòng kiểm tra và điền đúng " +
            errorCount +
            " mục thông tin bên dưới.";
          errorBanner.hidden = false;
        }
        if (firstInvalidEl && typeof firstInvalidEl.focus === "function") {
          firstInvalidEl.focus();
        }
        return;
      }

      if (errorBanner) {
        errorBanner.hidden = true;
        errorBanner.textContent = "";
      }

      const orderCode = generateOrderCode();
      const finalTotal = formatVND(totals.total);

      clearCart();
      form.reset();

      openSuccessModal(orderCode, nameVal, phoneVal, finalTotal);
    });
  }

  // ======================== THÔNG BÁO & HỘP THOẠI THÀNH CÔNG ========================
  function showToast(message) {
    const toast = document.getElementById("toast-notification");
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;

    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.hidden = true;
    }, 2600);
  }

  function openSuccessModal(orderCode, receiverName, receiverPhone, formattedTotal) {
    const modal = document.getElementById("order-success-modal");
    const codeEl = document.getElementById("modal-order-code");
    const receiverEl = document.getElementById("modal-order-receiver");
    const totalEl = document.getElementById("modal-order-total");
    const thankEl = document.getElementById("modal-thankyou-text");
    const closeBtn = document.getElementById("close-modal-btn");

    if (codeEl) codeEl.textContent = orderCode;
    if (receiverEl) receiverEl.textContent = receiverName + " (" + receiverPhone + ")";
    if (totalEl) totalEl.textContent = formattedTotal;
    if (thankEl) {
      thankEl.textContent =
        "Cảm ơn " +
        receiverName +
        " đã đặt đặc sản tại Đạt Xứ Dừa! Đơn hàng thanh toán khi nhận hàng (COD) của bạn đã được ghi nhận.";
    }

    if (modal) {
      modal.hidden = false;
      if (closeBtn) closeBtn.focus();
    }
  }

  function setupModalEvents() {
    const modal = document.getElementById("order-success-modal");
    const closeBtn = document.getElementById("close-modal-btn");

    function closeModal() {
      if (modal) modal.hidden = true;
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", closeModal);
    }
    if (modal) {
      modal.addEventListener("click", function (e) {
        if (e.target === modal) closeModal();
      });
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal && !modal.hidden) {
        closeModal();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderCategoryFilters();
    renderProductsGrid();
    renderCart();
    setupCheckoutForm();
    setupModalEvents();
  });
})();
