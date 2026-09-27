(() => {
  "use strict";

  /* =========================================================
     SAVOR CAFE — SINGLE FRONTEND APPLICATION
     - One app-data object for users + current session + orders
     - Cart remains separate because it is temporary shopping state
     - Order is saved BEFORE WhatsApp is opened
     - Delivery / Takeaway / Dine-in are explicit modes

     FIX APPLIED: page-detection was matching on the URL literally
     ending in "checkout.html" / "orders.html" etc. If the site is
     hosted with clean URLs (no .html in the address bar) or a
     trailing slash, those checks silently failed, so the checkout
     submit handler and the orders-page renderer never ran at all.
     That's why orders weren't saving AND WhatsApp wasn't opening —
     same root cause. Replaced with getPageName(), which normalizes
     the path before comparing.
  ========================================================= */

  const APP_DATA_KEY = "savor_app_data_v3";
  const LEGACY_APP_KEY = "savor_app_data_v2";
  const CART_KEY = "savor_cafe_cart_v3";
  const THEME_KEY = "savor_theme";
  const ADMIN_SESSION_KEY = "savor_admin_session_v2";
  const WHATSAPP_NUMBER = "919431025101";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // ---- FIX: robust page-name detection -----------------------------------
  // Works whether the URL is /checkout.html, /checkout, or /checkout/
  function getPageName() {
    let path = location.pathname;
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
    let page = path.split("/").pop() || "index.html";
    if (!page.includes(".")) page += ".html";
    return page.toLowerCase();
  }
  // --------------------------------------------------------------------------

  const products = (window.MENU_PRODUCTS || []).map(product => ({
    ...product,
    veg: !/(chicken|mutton|fish|egg|katla|rui|prawn|meat)/i.test(product.name)
  }));

  const categories = {
    starters: ["🍢", "Starters"], tandoor: ["🔥", "Tandoor"], noodles: ["🍜", "Noodles"],
    chinese: ["🥢", "Chinese"], soup: ["🥣", "Soups"], seafood: ["🐟", "Seafood"],
    combo: ["🍛", "Combos"], veg: ["🥦", "Vegetarian"], roti: ["🫓", "Breads"],
    biryani: ["🍚", "Biryani"], rice: ["🍚", "Rice & Mains"], salad: ["🥗", "Salads & Drinks"]
  };

  const categoryOrder = ["starters", "tandoor", "noodles", "chinese", "soup", "seafood", "combo", "veg", "roti", "biryani", "rice", "salad"];
  const popular = [30, 86, 24, 43, 20, 52, 88, 41, 84, 44];

  let cart = readJSON(CART_KEY, {});
  let activeCategory = "all";
  let currentMode = "delivery";
  let addressMethod = "manual";

  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  }

  function money(value) {
    return `₹${Number(value || 0).toLocaleString("en-IN")}`;
  }

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[char]));
  }

  function normalizePhone(value) {
    const digits = String(value || "").replace(/\D/g, "");
    return digits.length > 10 ? digits.slice(-10) : digits;
  }

  function emptyAppData() {
    return { version: 3, users: [], currentUser: null, orders: [], pendingOrder: null };
  }

  function normalizeOrder(order) {
    if (!order || typeof order !== "object") return null;
    const phone = normalizePhone(order.normalizedPhone || order.phone);
    const items = Array.isArray(order.items) ? order.items.map(item => ({
      name: String(item?.name || "Item"),
      qty: Number(item?.qty || 0),
      amount: Number(item?.amount || 0)
    })).filter(item => item.qty > 0) : [];
    return {
      ...order,
      orderNumber: String(order.orderNumber || order.id || ""),
      userId: String(order.userId || ""),
      name: String(order.name || "Customer"),
      phone,
      normalizedPhone: phone,
      type: ["Delivery", "Takeaway", "Dine-in"].includes(order.type) ? order.type : "Delivery",
      address: String(order.address || ""),
      gpsLocation: String(order.gpsLocation || ""),
      tableNumber: String(order.tableNumber || ""),
      notes: String(order.notes || ""),
      items,
      total: Number(order.total || items.reduce((sum, item) => sum + item.amount, 0)),
      status: String(order.status || "Placed"),
      createdAt: String(order.createdAt || new Date().toISOString()),
      orderDate: String(order.orderDate || order.date || ""),
      orderTime: String(order.orderTime || order.time || ""),
      isoDate: String(order.isoDate || "")
    };
  }

  function normalizeAppData(value) {
    const data = value && typeof value === "object" ? value : emptyAppData();
    const users = Array.isArray(data.users) ? data.users.map(user => ({
      id: String(user?.id || `U${Date.now()}`),
      name: String(user?.name || "Customer").trim(),
      phone: normalizePhone(user?.phone),
      createdAt: String(user?.createdAt || new Date().toISOString())
    })).filter(user => user.phone) : [];
    const seen = new Set();
    const orders = Array.isArray(data.orders) ? data.orders.map(normalizeOrder).filter(order => {
      if (!order?.orderNumber || seen.has(order.orderNumber)) return false;
      seen.add(order.orderNumber);
      return true;
    }) : [];
    const current = data.currentUser && typeof data.currentUser === "object" ? {
      id: String(data.currentUser.id || ""),
      name: String(data.currentUser.name || "Customer"),
      phone: normalizePhone(data.currentUser.phone),
      createdAt: String(data.currentUser.createdAt || "")
    } : null;
    return { version: 3, users, currentUser: current, orders, pendingOrder: data.pendingOrder || null };
  }

  function migrateStorage() {
    const current = readJSON(APP_DATA_KEY, null);
    if (current && Array.isArray(current.users) && Array.isArray(current.orders)) {
      const normalized = normalizeAppData(current);
      writeJSON(APP_DATA_KEY, normalized);
      [LEGACY_APP_KEY, "savor_auth_users_v1", "savor_auth_current_v1", "savor_orders_v1", "savor_cafe_orders_v1"].forEach(key => localStorage.removeItem(key));
      return normalized;
    }

    const oldV2 = readJSON(LEGACY_APP_KEY, null);
    const legacyUsers = oldV2?.users || readJSON("savor_auth_users_v1", []);
    const legacyCurrent = oldV2?.currentUser || readJSON("savor_auth_current_v1", null);
    const oldOrdersA = oldV2?.orders || readJSON("savor_orders_v1", []);
    const oldOrdersB = readJSON("savor_cafe_orders_v1", []);
    const merged = [];
    const seen = new Set();
    [...oldOrdersA, ...oldOrdersB].forEach(raw => {
      const order = normalizeOrder(raw);
      if (order?.orderNumber && !seen.has(order.orderNumber)) {
        seen.add(order.orderNumber);
        merged.push(order);
      }
    });
    const data = normalizeAppData({ version: 3, users: legacyUsers, currentUser: legacyCurrent, orders: merged, pendingOrder: null });
    writeJSON(APP_DATA_KEY, data);
    [LEGACY_APP_KEY, "savor_auth_users_v1", "savor_auth_current_v1", "savor_orders_v1", "savor_cafe_orders_v1"].forEach(key => localStorage.removeItem(key));
    return data;
  }

  let appData = migrateStorage();

  function saveAppData() {
    appData = normalizeAppData(appData);
    writeJSON(APP_DATA_KEY, appData);
  }

  function getCurrentUser() { return appData.currentUser; }
  function getUsers() { return appData.users; }
  function getOrders() { return appData.orders; }

  function setCurrentUser(user) {
    appData.currentUser = user ? {
      id: String(user.id), name: String(user.name), phone: normalizePhone(user.phone), createdAt: String(user.createdAt || "")
    } : null;
    saveAppData();
  }

  function saveCart() { writeJSON(CART_KEY, cart); }
  function cartCount() { return Object.values(cart).reduce((sum, qty) => sum + Number(qty || 0), 0); }
  function cartTotal() { return Object.entries(cart).reduce((sum, [id, qty]) => sum + (products.find(p => p.id == id)?.price || 0) * Number(qty || 0), 0); }

  function toast(message) {
    const element = $("#toast");
    if (!element) return;
    element.textContent = message;
    element.classList.add("show");
    clearTimeout(window.__savorToastTimer);
    window.__savorToastTimer = setTimeout(() => element.classList.remove("show"), 2200);
  }

  function addToCart(id) {
    cart[id] = Number(cart[id] || 0) + 1;
    saveCart();
    renderAll();
    const item = products.find(product => product.id === id);
    toast(`${item?.name || "Item"} added to cart ✓`);
  }

  function changeCart(id, delta) {
    const next = Math.max(0, Number(cart[id] || 0) + delta);
    if (next === 0) delete cart[id]; else cart[id] = next;
    saveCart();
    renderAll();
  }

  function renderNav() {
    const count = cartCount();
    ["#cartCount", "#navCartCount"].forEach(selector => {
      const element = $(selector);
      if (element) element.textContent = count;
    });
    const account = $("#accountNav");
    const user = getCurrentUser();
    if (account) {
      account.textContent = user ? `Hi, ${user.name.split(" ")[0]}` : "Login";
      account.href = user ? "/profile.html" : "/login.html";
    }
    const fab = $(".cart-fab");
    if (fab) {
      const hidden = document.body.classList.contains("cart-page") || document.body.classList.contains("checkout-page") || count === 0;
      fab.hidden = hidden;
    }
  }

  function stepper(id) {
    return `<div class="stepper"><button type="button" data-minus="${id}" aria-label="Decrease quantity">−</button><b>${Number(cart[id] || 0)}</b><button type="button" data-plus="${id}" aria-label="Increase quantity">+</button></div>`;
  }

  function foodEmoji(product) {
    if (!product) return "🍽️";
    if (/biryani|rice|khichuri|pulao/i.test(product.name)) return "🍚";
    if (/noodle|manchurian|chilli|fried rice/i.test(product.name)) return "🍜";
    if (/fish|katla|rui|prawn/i.test(product.name)) return "🐟";
    if (/paneer|veg|dal|aloo|mushroom|broccoli|rajma|roti|naan|paratha/i.test(product.name)) return "🥘";
    return "🍗";
  }

  function renderHome() {
    const categoriesMount = $("#homeCats");
    if (categoriesMount) {
      categoriesMount.innerHTML = categoryOrder.map(key => `<a class="category-card" href="/menu.html?category=${key}"><span class="emoji">${categories[key][0]}</span><h3>${categories[key][1]}</h3><p>${products.filter(p => p.category === key).length} dishes</p></a>`).join("");
    }
    const popularMount = $("#homePopular");
    if (popularMount) {
      popularMount.innerHTML = popular.map(id => {
        const item = products.find(product => product.id === id);
        return item ? `<article class="popular-card"><div class="food-art">${foodEmoji(item)}</div><h3>${esc(item.name)}</h3><div class="pc-bottom"><strong>${money(item.price)}</strong><button class="mini-add" type="button" data-add="${item.id}">+ Add</button></div></article>` : "";
      }).join("");
    }
  }

  function renderTabs() {
    const mount = $("#cats");
    if (!mount) return;
    mount.innerHTML = `<button class="category-tab ${activeCategory === "all" ? "active" : ""}" type="button" data-cat="all">All</button>` + categoryOrder.map(key => `<button class="category-tab ${activeCategory === key ? "active" : ""}" type="button" data-cat="${key}">${categories[key][0]} ${categories[key][1]}</button>`).join("");
  }

  function renderMenu() {
    const mount = $("#menuMount");
    if (!mount) return;
    const query = ($("#search")?.value || "").trim().toLowerCase();
    const groups = activeCategory === "all" ? categoryOrder : [activeCategory];
    let seen = 0;
    let html = "";
    groups.forEach(key => {
      const list = products.filter(product => product.category === key && (!query || product.name.toLowerCase().includes(query)));
      if (!list.length) return;
      seen += list.length;
      html += `<section class="menu-section" id="cat-${key}"><h2>${categories[key][0]} ${categories[key][1]} <span>${list.length} dishes</span></h2><div class="menu-grid">`;
      html += list.map(product => `<article class="menu-item"><div class="item-info"><i class="food-dot ${product.veg ? "" : "nonveg"}"></i><div><div class="item-name">${esc(product.name)}</div><div class="item-price">${money(product.price)}</div></div></div>${cart[product.id] ? stepper(product.id) : `<button class="add-button" type="button" data-add="${product.id}">+ Add</button>`}</article>`).join("");
      html += `</div></section>`;
    });
    mount.innerHTML = html;
    const empty = $("#emptyState");
    if (empty) empty.hidden = seen !== 0;
  }

  function renderCartPage() {
    const mount = $("#cartPageItems");
    if (!mount) return;
    const ids = Object.keys(cart);
    mount.innerHTML = ids.length ? ids.map(id => {
      const product = products.find(item => item.id == id);
      if (!product) return "";
      return `<div class="cart-page-line"><div><b>${esc(product.name)}</b><small>${money(product.price)} each</small></div><div><strong>${money(product.price * Number(cart[id]))}</strong>${stepper(id)}<button class="remove" type="button" data-remove="${id}">Remove</button></div></div>`;
    }).join("") : `<div class="cart-empty"><div>🛒</div><h2>Your cart is empty</h2><p>Add some dishes first.</p><a class="btn primary" href="/menu.html">Browse menu →</a></div>`;
    const totalElement = $("#cartPageTotal");
    if (totalElement) totalElement.textContent = money(cartTotal());
    const checkout = $("#checkoutBtn");
    if (checkout) checkout.classList.toggle("disabled", !ids.length);
  }

  function renderCheckoutSummary() {
    const mount = $("#checkoutItems");
    if (!mount) return;
    const ids = Object.keys(cart);
    if (!ids.length) {
      mount.innerHTML = `<div class="checkout-empty">Your cart is empty.<br><a href="/menu.html">Browse menu →</a></div>`;
    } else {
      mount.innerHTML = ids.map(id => {
        const product = products.find(item => item.id == id);
        return product ? `<div class="summary-line"><span>${esc(product.name)} <b>× ${Number(cart[id])}</b></span><strong>${money(product.price * Number(cart[id]))}</strong></div>` : "";
      }).join("");
    }
    const totalElement = $("#checkoutTotal");
    if (totalElement) totalElement.textContent = money(cartTotal());
  }

  function renderAll() {
    renderNav();
    renderHome();
    renderTabs();
    renderMenu();
    renderCartPage();
    renderCheckoutSummary();
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY) || "dark";
    document.documentElement.dataset.theme = saved;
    const button = $("#themeToggle");
    if (button) {
      button.textContent = saved === "dark" ? "☀️" : "🌙";
      button.title = saved === "dark" ? "Switch to light mode" : "Switch to dark mode";
    }
  }

  function initStatus() {
    const update = () => {
      const minutes = new Date().getHours() * 60 + new Date().getMinutes();
      const open = minutes >= 660 && minutes < 1380;
      const text = $("#statusText");
      const dot = $("#statusDot");
      if (text) text.textContent = open ? "Open now" : "Closed · Opens 11 AM";
      if (dot) dot.classList.toggle("closed", !open);
    };
    update();
    setInterval(update, 60000);
  }

  function initNavigation() {
    const toggle = $("#navToggle");
    const links = $("#navLinks");
    const scrim = $("#navScrim");
    if (!toggle || !links) return;

    const close = () => {
      links.classList.remove("open");
      scrim?.classList.remove("show");
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "☰";
      document.body.classList.remove("nav-lock");
    };
    const open = () => {
      links.classList.add("open");
      scrim?.classList.add("show");
      toggle.setAttribute("aria-expanded", "true");
      toggle.textContent = "✕";
      document.body.classList.add("nav-lock");
    };

    toggle.addEventListener("click", event => {
      event.preventDefault();
      links.classList.contains("open") ? close() : open();
    });
    scrim?.addEventListener("click", close);
    links.addEventListener("click", event => {
      const link = event.target.closest("a");
      if (link) close(); // Never cancel the anchor's normal navigation.
    });
    document.addEventListener("keydown", event => { if (event.key === "Escape") close(); });
    window.addEventListener("pageshow", close);

    // ---- FIX: use getPageName() instead of raw pathname parsing ----
    let page = getPageName().replace(".html", "");
    if (page === "index") page = "home";
    $$(".nav-links a[data-page]").forEach(link => link.classList.toggle("active", link.dataset.page === page));
  }

  function initGlobalEvents() {
    document.addEventListener("click", event => {
      const add = event.target.closest("[data-add]");
      const plus = event.target.closest("[data-plus]");
      const minus = event.target.closest("[data-minus]");
      const remove = event.target.closest("[data-remove]");
      const category = event.target.closest("[data-cat]");

      if (add) addToCart(Number(add.dataset.add));
      else if (plus) changeCart(Number(plus.dataset.plus), 1);
      else if (minus) changeCart(Number(minus.dataset.minus), -1);
      else if (remove) {
        delete cart[remove.dataset.remove];
        saveCart();
        renderAll();
      } else if (category) {
        activeCategory = category.dataset.cat || "all";
        renderTabs();
        renderMenu();
      }
    });

    $("#search")?.addEventListener("input", renderMenu);
    $("#clearSearch")?.addEventListener("click", () => {
      const search = $("#search");
      if (search) search.value = "";
      renderMenu();
    });
    $("#clearCart")?.addEventListener("click", () => {
      cart = {};
      saveCart();
      renderAll();
    });
    $("#themeToggle")?.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      localStorage.setItem(THEME_KEY, next);
      initTheme();
    });
  }

  function generateOrderDetails() {
    const now = new Date();
    const pad = value => String(value).padStart(2, "0");
    return {
      orderNumber: `${pad(now.getDate())}${pad(now.getMonth() + 1)}${now.getFullYear()}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`,
      date: `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`,
      time: `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
      iso: now.toISOString(),
      isoDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    };
  }

  function modeLabel(mode) {
    return mode === "takeaway" ? "Takeaway" : mode === "dinein" ? "Dine-in" : "Delivery";
  }

  function buildOrderFromForm(form, details) {
    const fd = new FormData(form);
    const user = getCurrentUser();
    const phone = normalizePhone(fd.get("phone"));
    const items = Object.entries(cart).map(([id, quantity]) => {
      const product = products.find(item => item.id == id);
      return product ? { name: product.name, qty: Number(quantity), amount: product.price * Number(quantity) } : null;
    }).filter(Boolean);
    return normalizeOrder({
      id: `O${Date.now()}`,
      orderNumber: details.orderNumber,
      userId: user?.id || "",
      name: String(fd.get("name") || "Customer").trim(),
      phone,
      normalizedPhone: phone,
      type: modeLabel(currentMode),
      address: currentMode === "delivery" ? String(fd.get("address") || "").trim() : "",
      gpsLocation: currentMode === "delivery" ? String(fd.get("gpsLocation") || "").trim() : "",
      tableNumber: currentMode === "dinein" ? String(fd.get("tableNumber") || "").trim() : "",
      notes: String(fd.get("notes") || "").trim(),
      items,
      total: items.reduce((sum, item) => sum + item.amount, 0),
      status: "WhatsApp Pending",
      orderDate: details.date,
      orderTime: details.time,
      isoDate: details.isoDate,
      createdAt: details.iso
    });
  }

  function saveNewOrder(order) {
    if (!order?.orderNumber) return false;
    const existing = appData.orders.find(item => item.orderNumber === order.orderNumber);
    if (!existing) appData.orders.push(order);
    else Object.assign(existing, order);
    saveAppData();
    return true;
  }

  function setOrderStatus(orderNumber, status) {
    const order = appData.orders.find(item => String(item.orderNumber) === String(orderNumber));
    if (!order) return false;
    order.status = status;
    order.updatedAt = new Date().toISOString();
    saveAppData();
    return true;
  }

  function checkoutMessage(order) {
    const lines = order.items.map(item => `• ${item.name} × ${item.qty} = ${money(item.amount)}`).join("\n");
    let message = `*SAVOR CAFE' — NEW ORDER*\n\n`;
    message += `*Order Number:* ${order.orderNumber}\n`;
    message += `*Order Date:* ${order.orderDate}\n`;
    message += `*Order Time:* ${order.orderTime}\n`;
    message += `*Order Type:* ${order.type}\n`;
    message += `*Name:* ${order.name}\n`;
    message += `*Phone:* ${order.phone}\n`;
    if (order.type === "Delivery") {
      message += `*Manual Address:* ${order.address}\n`;
      if (order.gpsLocation) message += `*GPS Location:* ${order.gpsLocation}\n`;
    }
    if (order.type === "Dine-in" && order.tableNumber) message += `*Table Number:* ${order.tableNumber}\n`;
    message += `\n*Items:*\n${lines}\n\n*Total:* ${money(order.total)}`;
    if (order.notes) message += `\n*Notes:* ${order.notes}`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }

  function openWhatsApp(url) {
    // Called directly from the submit click, so popup blockers are least likely here.
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) {
      // Fallback for browsers/PWAs that reject window.open.
      window.location.assign(url);
    }
    return Boolean(opened);
  }

  function showWhatsAppConfirmation(orderNumber) {
    let modal = $("#whatsappConfirm");
    if (modal) return;
    modal = document.createElement("div");
    modal.id = "whatsappConfirm";
    modal.className = "whatsapp-confirm-overlay";
    modal.innerHTML = `<div class="whatsapp-confirm-card" role="dialog" aria-modal="true" aria-labelledby="waConfirmTitle"><div class="auth-avatar">✓</div><h2 id="waConfirmTitle">WhatsApp order ready</h2><p>Your order <b>#${esc(orderNumber)}</b> has already been saved. Send the message on WhatsApp, then confirm below.</p><div class="whatsapp-confirm-actions"><button type="button" class="btn ghost" id="whatsappCancel">Keep as pending</button><button type="button" class="btn primary" id="whatsappSent">I’ve sent the order ✓</button></div></div>`;
    document.body.appendChild(modal);

    $("#whatsappCancel", modal)?.addEventListener("click", () => {
      modal.remove();
      toast("Order saved as WhatsApp Pending");
    });
    $("#whatsappSent", modal)?.addEventListener("click", () => {
      setOrderStatus(orderNumber, "Placed");
      appData.pendingOrder = null;
      saveAppData();
      cart = {};
      saveCart();
      modal.remove();
      toast("Order placed successfully ✓");
      setTimeout(() => { location.href = "/orders.html"; }, 250);
    });
  }

  function updateCheckoutModeUI() {
    const buttons = $$("#orderMode [data-mode]");
    buttons.forEach(button => button.classList.toggle("active", button.dataset.mode === currentMode));
    const addressWrap = $("#addressWrap");
    const address = $("#checkoutForm [name=address]");
    const dineWrap = $("#dineInWrap");
    const hint = $("#orderModeHint");
    const isDelivery = currentMode === "delivery";
    const isDineIn = currentMode === "dinein";

    if (addressWrap) addressWrap.hidden = !isDelivery;
    if (address) address.required = isDelivery;
    if (dineWrap) dineWrap.hidden = !isDineIn;
    if (hint) {
      hint.textContent = isDelivery
        ? "Delivery selected — complete manual address is compulsory."
        : isDineIn
          ? "Dine-in selected — no delivery address is required."
          : "Takeaway selected — no delivery address is required.";
    }
  }

  function initAddressControls() {
    const manualButton = $("#manualAddressBtn");
    const gpsButton = $("#gpsBtn");
    const address = $("#checkoutForm [name=address]");
    const gpsLocation = $("#gpsLocation");
    const gpsMessage = $("#gpsMsg");

    manualButton?.addEventListener("click", () => {
      addressMethod = "manual";
      manualButton.classList.add("active");
      gpsButton?.classList.remove("active");
      address?.focus();
    });

    gpsButton?.addEventListener("click", () => {
      if (currentMode !== "delivery") {
        toast("GPS address is only available for delivery");
        return;
      }
      if (!navigator.geolocation) {
        toast("Location is not supported by this browser");
        return;
      }
      addressMethod = "gps";
      manualButton?.classList.remove("active");
      gpsButton.classList.add("active");
      if (gpsMessage) gpsMessage.textContent = "Getting your live location…";
      navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        if (gpsLocation) gpsLocation.value = mapLink;
        if (gpsMessage) gpsMessage.textContent = "GPS captured. Please still enter the complete manual address above.";
        address?.focus();
      }, () => {
        if (gpsMessage) gpsMessage.textContent = "GPS permission was not granted. You can continue with the manual address.";
        toast("Could not access your location");
      }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    });
  }

  function initCheckout() {
    // ---- FIX: use getPageName() instead of raw pathname parsing ----
    if (getPageName() !== "checkout.html") return;
    const user = getCurrentUser();
    if (!user) {
      location.replace(`/login.html?next=${encodeURIComponent("/checkout.html")}`);
      return;
    }

    const form = $("#checkoutForm");
    if (!form) return;
    const nameInput = $("[name=name]", form);
    const phoneInput = $("[name=phone]", form);
    if (nameInput) { nameInput.value = user.name; nameInput.readOnly = true; }
    if (phoneInput) { phoneInput.value = user.phone; phoneInput.readOnly = true; }

    $$("#orderMode [data-mode]").forEach(button => {
      button.addEventListener("click", () => {
        currentMode = button.dataset.mode || "delivery";
        updateCheckoutModeUI();
      });
    });
    initAddressControls();
    updateCheckoutModeUI();

    form.addEventListener("submit", event => {
      event.preventDefault();
      if (!Object.keys(cart).length) { toast("Your cart is empty"); return; }

      const fd = new FormData(form);
      const name = String(fd.get("name") || "").trim();
      const phone = normalizePhone(fd.get("phone"));
      const address = String(fd.get("address") || "").trim();
      if (name.length < 2) { toast("Please enter your full name"); return; }
      if (phone.length !== 10) { toast("Please enter a valid 10-digit mobile number"); return; }
      if (currentMode === "delivery" && address.length < 8) { toast("Complete manual delivery address is compulsory"); return; }

      const details = generateOrderDetails();
      const order = buildOrderFromForm(form, details);
      if (!saveNewOrder(order)) { toast("Could not save the order. Please try again."); return; }

      appData.pendingOrder = { orderNumber: order.orderNumber, userId: user.id };
      saveAppData();

      const url = checkoutMessage(order);
      openWhatsApp(url);
      showWhatsAppConfirmation(order.orderNumber);
    });

    const showPending = () => {
      const pending = appData.pendingOrder;
      if (pending && pending.userId === user.id && appData.orders.some(order => order.orderNumber === pending.orderNumber)) {
        const pendingOrder = appData.orders.find(order => order.orderNumber === pending.orderNumber);
        if (pendingOrder?.status === "WhatsApp Pending" && !$("#whatsappConfirm")) showWhatsAppConfirmation(pending.orderNumber);
      }
    };
    showPending();
    window.addEventListener("pageshow", showPending);
  }

  function customerRequired(next) {
    if (getCurrentUser()) return true;
    location.href = `/login.html?next=${encodeURIComponent(next || location.pathname + location.search)}`;
    return false;
  }

  function initAuth() {
    // ---- FIX: use getPageName() instead of raw pathname parsing ----
    const page = getPageName();

    if (page === "signup.html") {
      const form = $("#signupForm");
      const message = $("#signupMsg");
      form?.addEventListener("submit", event => {
        event.preventDefault();
        const name = String(form.name.value || "").trim();
        const phone = normalizePhone(form.phone.value);
        if (name.length < 2) { if (message) message.textContent = "Please enter your full name."; return; }
        if (phone.length !== 10) { if (message) message.textContent = "Please enter a valid 10-digit mobile number."; return; }
        if (getUsers().some(user => normalizePhone(user.phone) === phone)) {
          const next = new URLSearchParams(location.search).get("next") || "/cart.html";
          location.href = `/login.html?next=${encodeURIComponent(next)}`;
          return;
        }
        const user = { id: `U${Date.now()}`, name, phone, createdAt: new Date().toISOString() };
        appData.users.push(user);
        setCurrentUser(user);
        const next = new URLSearchParams(location.search).get("next") || "/cart.html";
        location.href = next;
      });
    }

    if (page === "login.html") {
      const form = $("#loginForm");
      const message = $("#loginMsg");
      form?.addEventListener("submit", event => {
        event.preventDefault();
        const phone = normalizePhone(form.phone.value);
        const user = getUsers().find(item => normalizePhone(item.phone) === phone);
        if (!user) { if (message) message.textContent = "Mobile number not found. Please sign up first."; return; }
        setCurrentUser(user);
        const next = new URLSearchParams(location.search).get("next") || "/cart.html";
        location.href = next;
      });
    }

    if (page === "profile.html") {
      if (!customerRequired("/profile.html")) return;
      const user = getCurrentUser();
      $("#profileName") && ($("#profileName").textContent = user.name);
      $("#profilePhone") && ($("#profilePhone").textContent = `+91 ${user.phone}`);
      $("#profileInitial") && ($("#profileInitial").textContent = user.name.charAt(0).toUpperCase());
      $("#profileOrdersCount") && ($("#profileOrdersCount").textContent = getOrders().filter(order => order.userId === user.id || normalizePhone(order.phone) === normalizePhone(user.phone)).length);
      $("#logoutBtn")?.addEventListener("click", () => { setCurrentUser(null); location.href = "/index.html"; });
    }

    if (page === "orders.html") initOrdersPage();
    if (page === "admin.html") initAdminPage();
  }

  function initOrdersPage() {
    if (!customerRequired("/orders.html")) return;
    const user = getCurrentUser();
    const mount = $("#ordersList");
    if (!mount) return;
    $("#ordersPhone") && ($("#ordersPhone").textContent = `+91 ${user.phone}`);
    const mine = getOrders().filter(order => order.userId === user.id || normalizePhone(order.phone) === normalizePhone(user.phone)).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

    if (!mine.length) {
      mount.innerHTML = `<div class="empty-state"><div>📦</div><h3>No orders yet</h3><p>Your placed orders will appear here.</p><a class="btn primary" href="/menu.html">Order now →</a></div>`;
      return;
    }

    mount.innerHTML = mine.map(order => `<article class="order-card"><div class="order-card-top"><div><span class="eyebrow">ORDER</span><h3>#${esc(order.orderNumber)}</h3></div><span class="order-status">${esc(order.status)}</span></div><p>${esc(order.orderDate)} · ${esc(order.orderTime)} · ${esc(order.type)}</p><div class="order-items">${order.items.map(item => `<div><span>${esc(item.name)} × ${item.qty}</span><b>${money(item.amount)}</b></div>`).join("")}</div>${order.address ? `<p class="order-address">📍 ${esc(order.address)}</p>` : ""}${order.gpsLocation ? `<a class="order-map" target="_blank" rel="noopener" href="${esc(order.gpsLocation)}">Open GPS location →</a>` : ""}${order.type === "Dine-in" && order.tableNumber ? `<p>Table: <b>${esc(order.tableNumber)}</b></p>` : ""}${order.notes ? `<p class="order-notes">Note: ${esc(order.notes)}</p>` : ""}<div class="order-card-bottom"><span>Total</span><strong>${money(order.total)}</strong></div></article>`).join("");
  }

  function downloadExcel(filename, rows, columns) {
    const header = columns.map(column => `<th>${esc(column)}</th>`).join("");
    const body = rows.map(row => `<tr>${columns.map(column => `<td>${esc(row[column] ?? "")}</td>`).join("")}</tr>`).join("");
    const blob = new Blob([`<html><meta charset="UTF-8"><table><tr>${header}</tr>${body}</table></html>`], { type: "application/vnd.ms-excel;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  function initAdminPage() {
    const login = $("#adminLogin");
    const dashboard = $("#adminDashboard");
    const render = () => {
      const authenticated = localStorage.getItem(ADMIN_SESSION_KEY) === "1";
      if (login) login.hidden = authenticated;
      if (dashboard) dashboard.hidden = !authenticated;
      if (!authenticated) return;
      const orders = getOrders().slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
      const today = new Date().toLocaleDateString("en-CA");
      const todayOrders = orders.filter(order => order.isoDate === today);
      $("#adminTodayOrders") && ($("#adminTodayOrders").textContent = todayOrders.length);
      $("#adminTodaySales") && ($("#adminTodaySales").textContent = money(todayOrders.reduce((sum, order) => sum + Number(order.total || 0), 0)));
      $("#adminCustomers") && ($("#adminCustomers").textContent = getUsers().length);
      $("#adminAllOrders") && ($("#adminAllOrders").textContent = orders.length);
      const body = $("#adminOrdersBody");
      if (body) body.innerHTML = orders.length ? orders.map(order => `<tr><td>#${esc(order.orderNumber)}</td><td>${esc(order.name)}</td><td>${esc(order.phone)}</td><td>${esc(order.type)}</td><td>${money(order.total)}</td><td>${esc(order.orderDate)}<br><small>${esc(order.orderTime)}</small></td><td><select data-order-status="${esc(order.orderNumber)}"><option ${order.status === "WhatsApp Pending" ? "selected" : ""}>WhatsApp Pending</option><option ${order.status === "Placed" ? "selected" : ""}>Placed</option><option ${order.status === "Confirmed" ? "selected" : ""}>Confirmed</option><option ${order.status === "Preparing" ? "selected" : ""}>Preparing</option><option ${order.status === "Out for delivery" ? "selected" : ""}>Out for delivery</option><option ${order.status === "Completed" ? "selected" : ""}>Completed</option><option ${order.status === "Cancelled" ? "selected" : ""}>Cancelled</option></select></td></tr>`).join("") : `<tr><td colspan="7">No orders in this browser.</td></tr>`;
    };

    login?.querySelector("form")?.addEventListener("submit", event => {
      event.preventDefault();
      if (login.adminUser.value === "admin" && login.adminPass.value === "savoradmin") {
        localStorage.setItem(ADMIN_SESSION_KEY, "1");
        render();
      } else {
        const message = $("#adminMsg");
        if (message) message.textContent = "Invalid admin credentials.";
      }
    });
    $("#adminLogout")?.addEventListener("click", () => { localStorage.removeItem(ADMIN_SESSION_KEY); render(); });
    $("#exportUsers")?.addEventListener("click", () => downloadExcel("auth.xls", getUsers(), ["id", "name", "phone", "createdAt"]));
    $("#exportOrders")?.addEventListener("click", () => downloadExcel("orders.xls", getOrders(), ["orderNumber", "orderDate", "orderTime", "name", "phone", "type", "address", "total", "status"]));
    $("#adminOrdersBody")?.addEventListener("change", event => {
      const select = event.target.closest("[data-order-status]");
      if (!select) return;
      setOrderStatus(select.dataset.orderStatus, select.value);
    });
    render();
  }

  function hidePreloader() {
    const preloader = $("#preloader");
    if (!preloader) return;
    preloader.classList.add("hide");
    preloader.setAttribute("aria-hidden", "true");
    setTimeout(() => preloader.remove(), 600);
  }

  function init() {
    initTheme();
    initNavigation();
    initStatus();
    initGlobalEvents();

    const category = new URLSearchParams(location.search).get("category");
    if (category && categories[category]) activeCategory = category;

    renderAll();
    initAuth();
    initCheckout();
    hidePreloader();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
