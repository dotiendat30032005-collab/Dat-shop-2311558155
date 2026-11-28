// ==========================================================================
// CHÚT NGỌT QUÊ – LOGIC ĐA TRANG, CHỌN GÓI (200G / 500G / 1KG) & FIRESTORE COD
// ==========================================================================

(function () {
  "use strict";

  const STORAGE_KEY = "chut_ngot_que_cart_v1";
  const STANDARD_SHIPPING_FEE = 25000;

  // Cấu hình Firebase Web App (gói Spark miễn phí, lưu đơn vào collection "donhang")
  const FIREBASE_SDK_VERSION = "11.1.0";
  const FIREBASE_APP_CDN =
    "https://www.gstatic.com/firebasejs/" + FIREBASE_SDK_VERSION + "/firebase-app.js";
  const FIREBASE_FIRESTORE_CDN =
    "https://www.gstatic.com/firebasejs/" + FIREBASE_SDK_VERSION + "/firebase-firestore.js";

  const firebaseConfig = {
    apiKey: "AIzaSyCkGSZ-Cv_SKTPQqHcXHOqM5oxo0XeNZvY",
    authDomain: "dat-shop-2311558155-7b435.firebaseapp.com",
    projectId: "dat-shop-2311558155-7b435",
    storageBucket: "dat-shop-2311558155-7b435.firebasestorage.app",
    messagingSenderId: "712003368651",
    appId: "1:712003368651:web:d3e006194d5a41daf28d4e"
  };

  let firestoreContextPromise = null;
  let isSubmittingOrder = false;

  const products = Array.isArray(window.PRODUCTS) ? window.PRODUCTS : [];
  const categories = Array.isArray(window.PRODUCT_CATEGORIES) ? window.PRODUCT_CATEGORIES : [];
  const packOptions = Array.isArray(window.PACK_OPTIONS) ? window.PACK_OPTIONS : [];

  let activeCategory = getInitialCategoryFromURL();
  let searchQuery = "";
  let cart = loadCartFromStorage();
  let toastTimer = null;

  // Trạng thái hộp thoại chọn gói (200g / 500g / 1kg)
  let packModalProductId = null;
  let selectedPackId = packOptions.length > 0 ? packOptions[0].id : "200g";
  let selectedPackQty = 1;
  let activeDetailProductId = null;

  function getInitialCategoryFromURL() {
    try {
      const params = new URLSearchParams(window.location.search);
      const nhom = params.get("nhom");
      if (nhom && categories.some(function (c) { return c.id === nhom; })) {
        return nhom;
      }
    } catch (err) {
      // Bỏ qua
    }
    return "all";
  }

  function getFirestoreContext() {
    if (!firestoreContextPromise) {
      firestoreContextPromise = Promise.all([
        import(FIREBASE_APP_CDN),
        import(FIREBASE_FIRESTORE_CDN)
      ])
        .then(function (modules) {
          const firebaseAppMod = modules[0];
          const firestoreMod = modules[1];
          const app =
            firebaseAppMod.getApps().length > 0
              ? firebaseAppMod.getApp()
              : firebaseAppMod.initializeApp(firebaseConfig);
          const db = firestoreMod.getFirestore(app);
          return { db: db, firestoreMod: firestoreMod };
        })
        .catch(function (err) {
          firestoreContextPromise = null;
          throw err;
        });
    }
    return firestoreContextPromise;
  }

  async function saveOrderToFirestore(orderCode, orderData) {
    const timeoutPromise = new Promise(function (_, reject) {
      window.setTimeout(function () {
        reject(new Error("Quá thời gian kết nối máy chủ cơ sở dữ liệu."));
      }, 15000);
    });

    const writePromise = (async function () {
      const ctx = await getFirestoreContext();
      const orderRef = ctx.firestoreMod.doc(ctx.db, "donhang", orderCode);
      const payload = Object.assign({}, orderData, {
        ngayTao: ctx.firestoreMod.serverTimestamp()
      });
      await ctx.firestoreMod.setDoc(orderRef, payload);
      return orderCode;
    })();

    return Promise.race([writePromise, timeoutPromise]);
  }

  // Định dạng tiền tệ tiếng Việt chuẩn dạng "122.000đ"
  function formatVND(amount) {
    const cleanNumber = Math.max(0, Math.round(Number(amount) || 0));
    return cleanNumber.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "đ";
  }

  function findProduct(productId) {
    return products.find(function (item) {
      return item.id === productId;
    });
  }

  function findPack(packId) {
    return packOptions.find(function (p) {
      return p.id === packId;
    });
  }

  function makeCartKey(productId, packId) {
    return productId + "__" + packId;
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
            typeof entry.packId === "string" &&
            Number.isInteger(entry.quantity) &&
            entry.quantity > 0 &&
            Boolean(findProduct(entry.productId)) &&
            Boolean(findPack(entry.packId))
          );
        })
        .map(function (entry) {
          return {
            cartKey: makeCartKey(entry.productId, entry.packId),
            productId: entry.productId,
            packId: entry.packId,
            quantity: entry.quantity
          };
        });
    } catch (err) {
      return [];
    }
  }

  function saveCartToStorage() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (err) {
      // Bỏ qua
    }
  }

  // ======================== DỰNG HÌNH ẢNH SẢN PHẨM (ĐƠN HOẶC GHÉP ĐÔI MIX) ========================
  function createProductVisualContent(product) {
    if (product.isSplitImage && Array.isArray(product.splitImages) && product.splitImages.length >= 2) {
      const splitWrap = document.createElement("div");
      splitWrap.className = "product-split-photos";

      const leftHalf = document.createElement("div");
      leftHalf.className = "split-half";
      const leftImg = document.createElement("img");
      leftImg.src = product.splitImages[0];
      leftImg.alt = "Mứt dừa sợi mỏng không màu";
      leftImg.loading = "lazy";
      const leftTag = document.createElement("span");
      leftTag.className = "split-label";
      leftTag.textContent = "Trắng không màu";
      leftHalf.appendChild(leftImg);
      leftHalf.appendChild(leftTag);

      const rightHalf = document.createElement("div");
      rightHalf.className = "split-half";
      const rightImg = document.createElement("img");
      rightImg.src = product.splitImages[1];
      rightImg.alt = "Mứt dừa sợi mỏng màu lá dứa";
      rightImg.loading = "lazy";
      const rightTag = document.createElement("span");
      rightTag.className = "split-label";
      rightTag.textContent = "Màu lá dứa";
      rightHalf.appendChild(rightImg);
      rightHalf.appendChild(rightTag);

      splitWrap.appendChild(leftHalf);
      splitWrap.appendChild(rightHalf);
      return splitWrap;
    }

    const img = document.createElement("img");
    img.className = "product-photo";
    img.src = product.image;
    img.alt = product.imageAlt || product.name;
    img.loading = "lazy";
    return img;
  }

  // ======================== DỰNG THẺ SẢN PHẨM ========================
  function createProductCardElement(product) {
    const card = document.createElement("article");
    card.className = "product-card";
    card.dataset.productId = product.id;

    const art = document.createElement("div");
    art.className = "product-art";
    art.title = "Bấm để xem chi tiết " + product.name;
    art.addEventListener("click", function () {
      openProductDetailModal(product.id);
    });

    const badge = document.createElement("span");
    badge.className = "product-badge";
    badge.style.color = product.accentColor;
    badge.textContent = product.badge;

    const visualNode = createProductVisualContent(product);

    const catTag = document.createElement("span");
    catTag.className = "product-category-tag";
    catTag.textContent = product.categoryLabel;

    art.appendChild(badge);
    art.appendChild(visualNode);
    art.appendChild(catTag);

    const body = document.createElement("div");
    body.className = "product-body";

    const title = document.createElement("h3");
    title.className = "product-title";
    title.textContent = product.name;
    title.addEventListener("click", function () {
      openProductDetailModal(product.id);
    });

    const desc = document.createElement("p");
    desc.className = "product-desc";
    desc.textContent = product.description;

    // 3 nút chọn nhanh mức gói (200g, 500g, 1kg)
    const packChips = document.createElement("div");
    packChips.className = "product-pack-chips";
    packOptions.forEach(function (pack) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "pack-chip-btn";
      chip.title = "Mua " + pack.label + " (" + formatVND(pack.price) + ")";
      chip.innerHTML =
        '<span class="pack-chip-weight">' +
        (pack.id === "200g" ? "200g thử" : pack.weightText) +
        "</span>" +
        '<span class="pack-chip-price">' +
        formatVND(pack.price) +
        "</span>";
      chip.addEventListener("click", function () {
        openPackSelectorModal(product.id, pack.id);
      });
      packChips.appendChild(chip);
    });

    const footer = document.createElement("div");
    footer.className = "product-footer";

    const priceBlock = document.createElement("div");
    priceBlock.className = "product-price-block";
    priceBlock.innerHTML =
      '<span class="product-price-from">Giá từ (200g – 1kg)</span>' +
      '<span class="product-price">' +
      formatVND(product.price) +
      " – " +
      formatVND(product.maxPrice || 122000) +
      "</span>";

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn btn-primary btn-add-cart";
    addBtn.dataset.addId = product.id;
    addBtn.textContent = "+ Thêm vào giỏ";
    addBtn.addEventListener("click", function () {
      openPackSelectorModal(product.id, "200g");
    });

    footer.appendChild(priceBlock);
    footer.appendChild(addBtn);

    body.appendChild(title);
    body.appendChild(desc);
    body.appendChild(packChips);
    body.appendChild(footer);

    card.appendChild(art);
    card.appendChild(body);
    return card;
  }

  // ======================== HIỂN THỊ TRANG CHỦ & TRANG SẢN PHẨM ========================
  function renderFeaturedProducts() {
    const featuredGrid = document.getElementById("featured-products-grid");
    if (!featuredGrid) return;

    featuredGrid.innerHTML = "";
    products.forEach(function (product) {
      featuredGrid.appendChild(createProductCardElement(product));
    });
  }

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

    let filtered =
      activeCategory === "all"
        ? products.slice()
        : products.filter(function (p) {
            return p.category === activeCategory;
          });

    if (searchQuery.trim() !== "") {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(function (p) {
        return (
          p.name.toLowerCase().indexOf(q) !== -1 ||
          p.description.toLowerCase().indexOf(q) !== -1 ||
          p.categoryLabel.toLowerCase().indexOf(q) !== -1
        );
      });
    }

    grid.innerHTML = "";

    if (filtered.length === 0) {
      const emptyBox = document.createElement("div");
      emptyBox.className = "empty-search-state";
      emptyBox.innerHTML =
        "<p><strong>Không tìm thấy sản phẩm phù hợp với từ khóa vừa nhập.</strong><br>Bạn hãy thử tìm <em>không màu, lá dứa</em> hoặc <em>mix</em> nhé!</p>";
      grid.appendChild(emptyBox);
      return;
    }

    filtered.forEach(function (product) {
      grid.appendChild(createProductCardElement(product));
    });
  }

  function setupCatalogToolbarEvents() {
    const searchInput = document.getElementById("product-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        searchQuery = searchInput.value || "";
        renderProductsGrid();
      });
    }
  }

  // ======================== HỘP THOẠI CHỌN CỠ GÓI (200G / 500G / 1KG) ========================
  function openPackSelectorModal(productId, initialPackId) {
    const modal = document.getElementById("pack-selector-modal");
    const product = findProduct(productId);
    if (!modal || !product) return;

    packModalProductId = product.id;
    selectedPackId = findPack(initialPackId) ? initialPackId : packOptions[0].id;
    selectedPackQty = 1;

    const thumbBox = document.getElementById("pack-modal-thumb");
    const badgeEl = document.getElementById("pack-modal-badge");
    const titleEl = document.getElementById("pack-modal-title");

    if (thumbBox) {
      thumbBox.innerHTML = "";
      const img = document.createElement("img");
      img.src = product.image;
      img.alt = product.name;
      thumbBox.appendChild(img);
    }
    if (badgeEl) badgeEl.textContent = product.badge + " • " + product.categoryLabel;
    if (titleEl) titleEl.textContent = product.name;

    renderPackModalState();
    modal.hidden = false;
  }

  function renderPackModalState() {
    const listEl = document.getElementById("pack-options-list");
    const qtyEl = document.getElementById("pack-qty-value");
    const confirmBtn = document.getElementById("confirm-add-pack-btn");

    if (listEl) {
      listEl.innerHTML = "";
      packOptions.forEach(function (pack) {
        const isSelected = pack.id === selectedPackId;
        const card = document.createElement("button");
        card.type = "button";
        card.className = "pack-option-card" + (isSelected ? " is-selected" : "");
        card.dataset.packId = pack.id;
        card.setAttribute("role", "radio");
        card.setAttribute("aria-checked", isSelected ? "true" : "false");

        card.innerHTML =
          '<span class="pack-opt-left">' +
          '<span class="pack-radio-dot" aria-hidden="true"></span>' +
          "<span>" +
          '<span class="pack-opt-title">' +
          pack.label +
          "</span>" +
          '<span class="pack-opt-desc">' +
          pack.desc +
          "</span>" +
          "</span>" +
          "</span>" +
          '<span class="pack-opt-price">' +
          formatVND(pack.price) +
          "</span>";

        card.addEventListener("click", function () {
          selectedPackId = pack.id;
          renderPackModalState();
        });

        listEl.appendChild(card);
      });
    }

    if (qtyEl) qtyEl.textContent = String(selectedPackQty);

    const chosenPack = findPack(selectedPackId);
    if (confirmBtn && chosenPack) {
      const lineTotal = chosenPack.price * selectedPackQty;
      confirmBtn.textContent =
        "Thêm " + selectedPackQty + " " + chosenPack.shortLabel + " vào giỏ (" + formatVND(lineTotal) + ")";
    }
  }

  function setupPackSelectorModal() {
    const modal = document.getElementById("pack-selector-modal");
    const closeBtn = document.getElementById("close-pack-modal");
    const minusBtn = document.getElementById("pack-qty-minus");
    const plusBtn = document.getElementById("pack-qty-plus");
    const confirmBtn = document.getElementById("confirm-add-pack-btn");

    if (!modal) return;

    function closePackModal() {
      modal.hidden = true;
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", closePackModal);
    }
    if (minusBtn) {
      minusBtn.addEventListener("click", function () {
        if (selectedPackQty > 1) {
          selectedPackQty -= 1;
          renderPackModalState();
        }
      });
    }
    if (plusBtn) {
      plusBtn.addEventListener("click", function () {
        selectedPackQty += 1;
        renderPackModalState();
      });
    }
    if (confirmBtn) {
      confirmBtn.addEventListener("click", function () {
        if (packModalProductId && selectedPackId) {
          addPackToCart(packModalProductId, selectedPackId, selectedPackQty);
          closePackModal();
        }
      });
    }

    modal.addEventListener("click", function (e) {
      if (e.target === modal) closePackModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) closePackModal();
    });
  }

  // ======================== MODAL CHI TIẾT SẢN PHẨM ========================
  function openProductDetailModal(productId) {
    const modal = document.getElementById("product-detail-modal");
    const product = findProduct(productId);
    if (!modal || !product) return;

    activeDetailProductId = product.id;

    const imgCol = document.getElementById("detail-img-col");
    const badgeEl = document.getElementById("detail-modal-badge");
    const titleEl = document.getElementById("detail-modal-title");
    const priceEl = document.getElementById("detail-modal-price");
    const descEl = document.getElementById("detail-modal-desc");
    const originEl = document.getElementById("detail-modal-origin");
    const storageEl = document.getElementById("detail-modal-storage");

    if (imgCol) {
      imgCol.innerHTML = "";
      imgCol.appendChild(createProductVisualContent(product));
    }
    if (badgeEl) badgeEl.textContent = product.badge + " • " + product.categoryLabel;
    if (titleEl) titleEl.textContent = product.name;
    if (priceEl) {
      priceEl.textContent = formatVND(product.price) + " – " + formatVND(product.maxPrice || 122000);
    }
    if (descEl) descEl.textContent = product.description;
    if (originEl) originEl.textContent = product.origin || "Châu Bình – Giồng Trôm, Bến Tre";
    if (storageEl) storageEl.textContent = product.storageTip || "Bảo quản nơi khô thoáng, mát mẻ.";

    modal.hidden = false;
  }

  function setupProductDetailModal() {
    const modal = document.getElementById("product-detail-modal");
    const closeBtn = document.getElementById("close-detail-modal");
    const addBtn = document.getElementById("detail-add-cart-btn");

    if (!modal) return;

    function closeDetail() {
      modal.hidden = true;
    }

    if (closeBtn) closeBtn.addEventListener("click", closeDetail);
    if (addBtn) {
      addBtn.addEventListener("click", function () {
        const pid = activeDetailProductId;
        closeDetail();
        if (pid) openPackSelectorModal(pid, "200g");
      });
    }
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeDetail();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) closeDetail();
    });
  }

  // ======================== THAO TÁC GIỎ HÀNG ========================
  function addPackToCart(productId, packId, qty) {
    const product = findProduct(productId);
    const pack = findPack(packId);
    if (!product || !pack) return;

    const addQty = Math.max(1, Number(qty) || 1);
    const key = makeCartKey(product.id, pack.id);
    const existing = cart.find(function (item) {
      return item.cartKey === key;
    });

    if (existing) {
      existing.quantity += addQty;
    } else {
      cart.push({
        cartKey: key,
        productId: product.id,
        packId: pack.id,
        quantity: addQty
      });
    }

    saveCartToStorage();
    renderCart();
    clearFormBannerIfCartAdded();
    showToast(
      "Đã thêm " + addQty + " " + pack.shortLabel + ' "' + product.name + '" vào giỏ!',
      true
    );
  }

  function updateCartQuantity(cartKey, delta) {
    const index = cart.findIndex(function (item) {
      return item.cartKey === cartKey;
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

  function removeFromCart(cartKey) {
    cart = cart.filter(function (item) {
      return item.cartKey !== cartKey;
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
      const pack = findPack(entry.packId);
      if (product && pack) {
        totalItems += entry.quantity;
        subtotal += pack.price * entry.quantity;
      }
    });

    const shippingFee = subtotal > 0 ? STANDARD_SHIPPING_FEE : 0;
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
    const submitBtn = document.getElementById("submit-order-btn");
    const mobileBar = document.getElementById("mobile-cart-bar");
    const mobileCount = document.getElementById("mobile-cart-count");
    const mobileTotal = document.getElementById("mobile-cart-total");

    if (badgeEl) badgeEl.textContent = String(totals.totalItems);
    if (totalItemsTextEl) totalItemsTextEl.textContent = String(totals.totalItems);
    if (clearBtn) clearBtn.hidden = cart.length === 0;

    if (listEl) {
      listEl.innerHTML = "";
      if (cart.length === 0) {
        const emptyDiv = document.createElement("div");
        emptyDiv.className = "cart-empty-state";
        emptyDiv.innerHTML =
          '<div class="cart-empty-icon" aria-hidden="true">🥥</div>' +
          '<p><strong>Giỏ hàng của bạn đang trống.</strong><br>Hãy ghé <a href="san-pham.html"><strong>Trang Sản phẩm</strong></a> chọn gói mứt dừa 200g, 500g hoặc 1kg nhé!</p>';
        listEl.appendChild(emptyDiv);
      } else {
        cart.forEach(function (entry) {
          const product = findProduct(entry.productId);
          const pack = findPack(entry.packId);
          if (!product || !pack) return;

          const row = document.createElement("div");
          row.className = "cart-item";
          row.dataset.cartKey = entry.cartKey;

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

          const packTag = document.createElement("span");
          packTag.className = "cart-item-pack-tag";
          packTag.textContent = "Quy cách: " + pack.label;

          const meta = document.createElement("div");
          meta.className = "cart-item-meta";
          const lineSubtotal = pack.price * entry.quantity;
          meta.innerHTML =
            formatVND(pack.price) +
            " × " +
            entry.quantity +
            ' = <span class="cart-item-subtotal">' +
            formatVND(lineSubtotal) +
            "</span>";

          info.appendChild(itemName);
          info.appendChild(packTag);
          info.appendChild(meta);

          const controls = document.createElement("div");
          controls.className = "cart-item-controls";

          const minusBtn = document.createElement("button");
          minusBtn.type = "button";
          minusBtn.className = "qty-btn";
          minusBtn.dataset.action = "decrease";
          minusBtn.setAttribute("aria-label", "Giảm số lượng " + product.name + " " + pack.label);
          minusBtn.textContent = "−";
          minusBtn.addEventListener("click", function () {
            updateCartQuantity(entry.cartKey, -1);
          });

          const qtySpan = document.createElement("span");
          qtySpan.className = "qty-value";
          qtySpan.textContent = String(entry.quantity);

          const plusBtn = document.createElement("button");
          plusBtn.type = "button";
          plusBtn.className = "qty-btn";
          plusBtn.dataset.action = "increase";
          plusBtn.setAttribute("aria-label", "Tăng số lượng " + product.name + " " + pack.label);
          plusBtn.textContent = "+";
          plusBtn.addEventListener("click", function () {
            updateCartQuantity(entry.cartKey, 1);
          });

          const removeBtn = document.createElement("button");
          removeBtn.type = "button";
          removeBtn.className = "remove-item-btn";
          removeBtn.dataset.action = "remove";
          removeBtn.setAttribute("aria-label", "Xóa " + product.name + " " + pack.label);
          removeBtn.title = "Xóa món này";
          removeBtn.textContent = "✕";
          removeBtn.addEventListener("click", function () {
            removeFromCart(entry.cartKey);
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
    if (shippingEl) shippingEl.textContent = formatVND(totals.shippingFee);
    if (totalEl) totalEl.textContent = formatVND(totals.total);

    if (submitBtn && !isSubmittingOrder) {
      submitBtn.innerHTML =
        'Xác nhận đặt hàng COD (<span id="btn-total-amount">' +
        formatVND(totals.total) +
        "</span>)";
    }

    if (mobileBar && mobileCount && mobileTotal) {
      if (totals.totalItems > 0) {
        mobileBar.hidden = false;
        mobileCount.textContent = totals.totalItems + " gói trong giỏ";
        mobileTotal.textContent = formatVND(totals.total);
      } else {
        mobileBar.hidden = true;
      }
    }
  }

  // ======================== KIỂM TRA HỢP LỆ & ĐẶT HÀNG COD ========================
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
    const rand = Math.floor(100000 + Math.random() * 900000);
    return "CNQ-" + yy + mm + dd + "-" + rand;
  }

  function buildOrderItemsSnapshot() {
    const items = [];
    cart.forEach(function (entry) {
      const product = findProduct(entry.productId);
      const pack = findPack(entry.packId);
      if (!product || !pack) return;
      items.push({
        id: product.id,
        tenSanPham: product.name,
        quyCachGoi: pack.label,
        trongLuong: pack.weightText,
        donGia: pack.price,
        soLuong: entry.quantity,
        thanhTien: pack.price * entry.quantity
      });
    });
    return items;
  }

  function translateFirestoreError(err) {
    const code = err && err.code ? String(err.code) : "";
    if (code === "permission-denied") {
      return "Hệ thống từ chối quyền ghi đơn hàng (permission-denied). Vui lòng báo cửa hàng kiểm tra lại cấu hình bảo mật.";
    }
    if (code === "unavailable" || code === "deadline-exceeded") {
      return "Không thể kết nối đến máy chủ lưu đơn hàng. Vui lòng kiểm tra kết nối mạng và thử lại.";
    }
    return "Không thể gửi đơn hàng lên hệ thống. Vui lòng kiểm tra kết nối mạng và thử lại sau ít phút.";
  }

  function setupCheckoutForm() {
    const form = document.getElementById("checkout-form");
    const nameInput = document.getElementById("customer-name");
    const phoneInput = document.getElementById("customer-phone");
    const addressInput = document.getElementById("customer-address");
    const noteInput = document.getElementById("customer-note");
    const consentInput = document.getElementById("consent-checkbox");
    const submitBtn = document.getElementById("submit-order-btn");

    const nameErr = document.getElementById("error-customer-name");
    const phoneErr = document.getElementById("error-customer-phone");
    const addressErr = document.getElementById("error-customer-address");
    const consentErr = document.getElementById("error-consent");
    const errorBanner = document.getElementById("form-error-banner");

    const clearCartBtn = document.getElementById("clear-cart-btn");
    if (clearCartBtn) {
      clearCartBtn.addEventListener("click", function () {
        clearCart();
        showToast("Đã xóa toàn bộ giỏ hàng.", false);
      });
    }

    if (!form) return;

    getFirestoreContext().catch(function () {});

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

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (isSubmittingOrder) return;

      const totals = calculateTotals();
      if (totals.totalItems === 0) {
        if (errorBanner) {
          errorBanner.dataset.reason = "empty-cart";
          errorBanner.textContent =
            "Giỏ hàng đang trống. Vui lòng chọn ít nhất 1 gói mứt dừa trước khi đặt hàng.";
          errorBanner.hidden = false;
        }
        return;
      }

      const nameVal = nameInput ? nameInput.value.trim() : "";
      const phoneVal = phoneInput ? phoneInput.value.trim() : "";
      const addressVal = addressInput ? addressInput.value.trim() : "";
      const noteVal = noteInput ? noteInput.value.trim() : "";
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
      const orderPayload = {
        cuaHang: "Chút Ngọt Quê",
        maDonHang: orderCode,
        hoTen: nameVal,
        soDienThoai: phoneVal,
        diaChi: addressVal,
        ghiChu: noteVal,
        phuongThucThanhToan: "COD",
        dongYSuDungThongTin: true,
        danhSachMon: buildOrderItemsSnapshot(),
        tongSoLuong: totals.totalItems,
        tamTinh: totals.subtotal,
        phiGiaoHang: totals.shippingFee,
        tongThanhToan: totals.total,
        trangThai: "cho_xac_nhan",
        thoiGianTaoISO: new Date().toISOString()
      };

      isSubmittingOrder = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "⏳ Đang lưu đơn hàng lên hệ thống...";
      }

      try {
        await saveOrderToFirestore(orderCode, orderPayload);
        isSubmittingOrder = false;
        if (submitBtn) submitBtn.disabled = false;
        clearCart();
        form.reset();
        openSuccessModal(orderCode, nameVal, phoneVal, finalTotal);
      } catch (err) {
        isSubmittingOrder = false;
        if (submitBtn) submitBtn.disabled = false;
        renderCart();
        if (errorBanner) {
          errorBanner.dataset.reason = "firestore-error";
          errorBanner.textContent = translateFirestoreError(err);
          errorBanner.hidden = false;
          errorBanner.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    });
  }

  // ======================== BIỂU MẪU TRANG LIÊN HỆ ========================
  function setupContactForm() {
    const contactForm = document.getElementById("contact-form");
    if (!contactForm) return;

    const nameInput = document.getElementById("contact-name");
    const phoneInput = document.getElementById("contact-phone");
    const msgInput = document.getElementById("contact-message");

    const nameErr = document.getElementById("error-contact-name");
    const phoneErr = document.getElementById("error-contact-phone");
    const msgErr = document.getElementById("error-contact-message");

    const successBanner = document.getElementById("contact-success-banner");
    const errorBanner = document.getElementById("contact-error-banner");

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
    if (msgInput) {
      msgInput.addEventListener("input", function () {
        if (msgInput.value.trim().length >= 5) setFieldError(msgInput, msgErr, "");
      });
    }

    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const nameVal = nameInput ? nameInput.value.trim() : "";
      const phoneVal = phoneInput ? phoneInput.value.trim() : "";
      const msgVal = msgInput ? msgInput.value.trim() : "";

      let errorCount = 0;
      let firstInvalid = null;

      if (!nameVal) {
        setFieldError(nameInput, nameErr, "Vui lòng nhập họ và tên của bạn.");
        firstInvalid = firstInvalid || nameInput;
        errorCount += 1;
      } else {
        setFieldError(nameInput, nameErr, "");
      }

      if (!phoneVal) {
        setFieldError(phoneInput, phoneErr, "Vui lòng nhập số điện thoại liên hệ.");
        firstInvalid = firstInvalid || phoneInput;
        errorCount += 1;
      } else if (!isValidVietnamPhone(phoneVal)) {
        setFieldError(phoneInput, phoneErr, "Số điện thoại không hợp lệ (cần đúng 10 chữ số).");
        firstInvalid = firstInvalid || phoneInput;
        errorCount += 1;
      } else {
        setFieldError(phoneInput, phoneErr, "");
      }

      if (!msgVal || msgVal.length < 5) {
        setFieldError(msgInput, msgErr, "Vui lòng nhập nội dung cần tư vấn (ít nhất 5 ký tự).");
        firstInvalid = firstInvalid || msgInput;
        errorCount += 1;
      } else {
        setFieldError(msgInput, msgErr, "");
      }

      if (errorCount > 0) {
        if (successBanner) successBanner.hidden = true;
        if (errorBanner) {
          errorBanner.textContent = "Vui lòng kiểm tra lại các mục thông tin được đánh dấu bên dưới.";
          errorBanner.hidden = false;
        }
        if (firstInvalid && typeof firstInvalid.focus === "function") firstInvalid.focus();
        return;
      }

      if (errorBanner) errorBanner.hidden = true;
      if (successBanner) {
        successBanner.textContent =
          "✅ Đã nhận lời nhắn của " +
          nameVal +
          "! Chút Ngọt Quê (0399 154 451) sẽ liên hệ lại với bạn qua số " +
          phoneVal +
          " trong khung giờ làm việc gần nhất.";
        successBanner.hidden = false;
      }
      contactForm.reset();
    });
  }

  // ======================== TOAST & MODAL ĐẶT HÀNG ========================
  function showToast(message, showCartLink) {
    const toast = document.getElementById("toast-notification");
    if (!toast) return;

    toast.innerHTML = "";
    const span = document.createElement("span");
    span.textContent = message;
    toast.appendChild(span);

    if (showCartLink && document.body.dataset.page !== "cart") {
      const link = document.createElement("a");
      link.href = "gio-hang.html";
      link.textContent = "Xem giỏ →";
      toast.appendChild(link);
    }

    toast.hidden = false;

    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.hidden = true;
    }, 3200);
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
        " đã đặt mứt dừa sên tay tại Chút Ngọt Quê! Đơn hàng COD của bạn đã được lưu vào hệ thống.";
    }

    if (modal) {
      modal.hidden = false;
      if (closeBtn) closeBtn.focus();
    }
  }

  function setupModalEvents() {
    const modal = document.getElementById("order-success-modal");
    if (!modal) return;

    modal.addEventListener("click", function (e) {
      if (e.target === modal) modal.hidden = true;
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) modal.hidden = true;
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderFeaturedProducts();
    renderCategoryFilters();
    renderProductsGrid();
    setupCatalogToolbarEvents();
    setupPackSelectorModal();
    setupProductDetailModal();
    renderCart();
    setupCheckoutForm();
    setupContactForm();
    setupModalEvents();
  });
})();
