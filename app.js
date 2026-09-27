(() => {
"use strict";
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const products=(window.MENU_PRODUCTS||[]).map(p=>({...p,veg:!/(chicken|mutton|fish|egg|katla|rui|prawn|meat)/i.test(p.name)}));
const categories={starters:["🍢","Starters"],tandoor:["🔥","Tandoor"],noodles:["🍜","Noodles"],chinese:["🥢","Chinese"],soup:["🥣","Soups"],seafood:["🐟","Seafood"],combo:["🍛","Combos"],veg:["🥦","Vegetarian"],roti:["🫓","Breads"],biryani:["🍚","Biryani"],rice:["🍚","Rice & Mains"],salad:["🥗","Salads & Drinks"]};
const order=["starters","tandoor","noodles","chinese","soup","seafood","combo","veg","roti","biryani","rice","salad"],popular=[30,86,24,43,20,52,88,41,84,44];
const KEY="savor_cafe_cart_v2"; let cart=JSON.parse(localStorage.getItem(KEY)||"{}"),activeCategory="all",currentMode="delivery";
const money=n=>`₹${Number(n).toLocaleString("en-IN")}`;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const save=()=>localStorage.setItem(KEY,JSON.stringify(cart));
const count=()=>Object.values(cart).reduce((a,b)=>a+b,0);
const total=()=>Object.entries(cart).reduce((s,[id,q])=>s+(products.find(p=>p.id==id)?.price||0)*q,0);
function stepper(id){return `<div class="stepper"><button type="button" data-minus="${id}">−</button><b>${cart[id]||0}</b><button type="button" data-plus="${id}">+</button></div>`}
function add(id){cart[id]=(cart[id]||0)+1;save();renderAll();toast(`${products.find(p=>p.id===id)?.name||"Item"} added to cart ✓`)}
function change(id,d){cart[id]=Math.max(0,(cart[id]||0)+d);if(!cart[id])delete cart[id];save();renderAll()}
function toast(t){let e=$("#toast");if(!e)return;e.textContent=t;e.classList.add("show");clearTimeout(window.tt);window.tt=setTimeout(()=>e.classList.remove("show"),1800)}
function renderNav(){const n=count();["#cartCount","#navCartCount"].forEach(s=>{if($(s))$(s).textContent=n});const cartFab=$(".cart-fab");if(cartFab){const hideHere=document.body.classList.contains("cart-page")||document.body.classList.contains("checkout-page");cartFab.hidden=hideHere||n===0;cartFab.setAttribute("aria-label",n?`View Cart — ${n} ${n===1?"item":"items"}`:"View Cart")}}
function renderHome(){const c=$("#homeCats");if(c)c.innerHTML=order.map(k=>`<a class="category-card" href="/menu.html?category=${k}"><span class="emoji">${categories[k][0]}</span><h3>${categories[k][1]}</h3><p>${products.filter(p=>p.category===k).length} dishes</p></a>`).join("");const p=$("#homePopular");if(p)p.innerHTML=popular.map(id=>{let x=products.find(a=>a.id===id);return x?`<article class="popular-card"><div class="food-art">${emoji(x)}</div><h3>${esc(x.name)}</h3><div class="pc-bottom"><strong>${money(x.price)}</strong><button class="mini-add" data-add="${x.id}">+ Add</button></div></article>`:""}).join("")}
function emoji(p){if(!p)return"🍽️";if(/biryani|rice|khichuri|pulao/i.test(p.name))return"🍚";if(/noodle|manchurian|chilli|fried rice/i.test(p.name))return"🍜";if(/fish|katla|rui|prawn/i.test(p.name))return"🐟";if(/paneer|veg|dal|aloo|mushroom|broccoli|rajma|roti|naan|paratha/i.test(p.name))return"🥘";return"🍗"}
function renderMenu(){const mount=$("#menuMount");if(!mount)return;const q=($("#search")?.value||"").trim().toLowerCase(),groups=activeCategory==="all"?order:[activeCategory];let html="",seen=0;groups.forEach(k=>{let list=products.filter(p=>p.category===k&&(!q||p.name.toLowerCase().includes(q)));if(!list.length)return;seen+=list.length;html+=`<section class="menu-section" id="cat-${k}"><h2>${categories[k][0]} ${categories[k][1]} <span>${list.length} dishes</span></h2><div class="menu-grid">${list.map(p=>`<article class="menu-item"><div class="item-info"><i class="food-dot ${p.veg?"":"nonveg"}"></i><div><div class="item-name">${esc(p.name)}</div><div class="item-price">${money(p.price)}</div></div></div>${cart[p.id]?stepper(p.id):`<button class="add-button" data-add="${p.id}">+ Add</button>`}</article>`).join("")}</div></section>`});mount.innerHTML=html;if($("#emptyState"))$("#emptyState").hidden=seen!==0}
function renderTabs(){let e=$("#cats");if(!e)return;e.innerHTML=`<button class="category-tab ${activeCategory==="all"?"active":""}" data-cat="all">All</button>`+order.map(k=>`<button class="category-tab ${activeCategory===k?"active":""}" data-cat="${k}">${categories[k][0]} ${categories[k][1]}</button>`).join("")}
function renderCartPage(){let box=$("#cartPageItems");if(!box)return;let ids=Object.keys(cart).map(Number);box.innerHTML=ids.length?ids.map(id=>{let p=products.find(x=>x.id===id);return p?`<div class="cart-page-line"><div><b>${esc(p.name)}</b><small>${money(p.price)} each</small></div><div><strong>${money(p.price*(cart[id]||0))}</strong>${stepper(id)}<button class="remove" data-remove="${id}">Remove</button></div></div>`:""}).join(""):`<div class="cart-empty"><div>🛒</div><h2>Your cart is empty</h2><p>Add some dishes first.</p><a class="btn primary" href="/menu.html">Browse menu →</a></div>`;if($("#cartPageTotal"))$("#cartPageTotal").textContent=money(total());if($("#checkoutBtn")){ const b=$("#checkoutBtn"); b.classList.toggle("disabled",!ids.length); b.onclick=(e)=>{ if(!ids.length){e.preventDefault();return;} if(!getCurrentUser()){e.preventDefault();location.href="/login.html?next="+encodeURIComponent("/cart.html");} }; }}
function renderCheckout(){let box=$("#checkoutItems");if(!box)return;let ids=Object.keys(cart).map(Number);if(!ids.length){box.innerHTML=`<div class="checkout-empty">Your cart is empty.<br><a href="/menu.html">Browse menu →</a></div>`;$("#checkoutTotal").textContent="₹0";$("#checkoutForm")?.querySelector("button[type=submit]")?.setAttribute("disabled","");return}box.innerHTML=ids.map(id=>{let p=products.find(x=>x.id===id);return p?`<div class="summary-line"><span>${esc(p.name)} <b>× ${cart[id]}</b></span><strong>${money(p.price*cart[id])}</strong></div>`:""}).join("");$("#checkoutTotal").textContent=money(total())}
function renderAll(){renderNav();renderHome();renderTabs();renderMenu();renderCartPage();renderCheckout()}
function status(){let m=new Date().getHours()*60+new Date().getMinutes(),o=m>=660&&m<1380;if($("#statusText"))$("#statusText").textContent=o?"Open now":"Closed · Opens 11 AM";if($("#statusDot"))$("#statusDot").classList.toggle("closed",!o)}
function pad2(n){return String(n).padStart(2,"0")}
function generateOrderDetails(){
  const d=new Date();
  const orderNumber=`${pad2(d.getDate())}${pad2(d.getMonth()+1)}${d.getFullYear()}${pad2(d.getHours())}${pad2(d.getMinutes())}${pad2(d.getSeconds())}`;
  const date=`${pad2(d.getDate())}/${pad2(d.getMonth()+1)}/${d.getFullYear()}`;
  const time=`${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
  return {orderNumber,date,time,timestamp:d.toISOString()};
}
function checkoutUrl(fd,details){
  let items=Object.entries(cart).map(([id,q])=>{let p=products.find(x=>x.id==id);return`• ${p.name} × ${q} = ${money(p.price*q)}`}).join("\n"),mode=currentMode==="delivery"?"Delivery":currentMode==="takeaway"?"Takeaway":"Dine-in";
  let text=`*SAVOR CAFE' — NEW ORDER*\n\n*Order Number:* ${details.orderNumber}\n*Order Date:* ${details.date}\n*Order Time:* ${details.time}\n*Order type:* ${mode}\n*Name:* ${fd.get("name")}\n*Phone:* ${fd.get("phone")}\n`;
  if(currentMode==="delivery"){text+=`*Manual Address:* ${fd.get("address")}\n`;if(fd.get("gpsLocation"))text+=`*GPS Location:* ${fd.get("gpsLocation")}\n`;}
  text+=`\n*Items:*\n${items}\n\n*Total:* ${money(total())}`;
  if(fd.get("notes"))text+=`\n*Notes:* ${fd.get("notes")}`;
  return`https://wa.me/919431025101?text=${encodeURIComponent(text)}`
}
function showWhatsAppConfirmation(){
  let modal=$("#whatsappConfirm");
  if(!modal){
    modal=document.createElement("div");
    modal.id="whatsappConfirm";
    modal.className="whatsapp-confirm-overlay";
    modal.innerHTML=`<div class="whatsapp-confirm-card"><div class="auth-avatar">✓</div><h2>WhatsApp opened</h2><p>Send the order message to Savor Cafe' on WhatsApp, then come back here.</p><div class="whatsapp-confirm-actions"><button type="button" class="btn ghost" id="whatsappCancel">Cancel</button><button type="button" class="btn primary" id="whatsappSent">I’ve sent the order ✓</button></div></div>`;
    document.body.appendChild(modal);
    $("#whatsappCancel",modal)?.addEventListener("click",()=>modal.remove());
    $("#whatsappSent",modal)?.addEventListener("click",()=>{
      const pending=readJSON("savor_cafe_pending_order_v2",readJSON("savor_cafe_pending_order",null));
      if(!pending){toast("No pending order found");modal.remove();return}
      const fd=new FormData();Object.entries(pending.form||{}).forEach(([k,v])=>fd.append(k,v));
      currentMode=pending.mode||"delivery";cart=pending.cart||{};const saved=recordLocalOrder(fd,pending.details);if(!saved){return;}
      localStorage.setItem("savor_cafe_last_order",JSON.stringify(pending.details));
      localStorage.removeItem("savor_cafe_pending_order_v2"); localStorage.removeItem("savor_cafe_pending_order");
      cart={};save();modal.remove();location.href="/orders.html";
    });
  }
}

function themeInit(){let saved=localStorage.getItem("savor_theme")||"dark";document.documentElement.dataset.theme=saved;let b=$("#themeToggle");if(b){b.textContent=saved==="dark"?"☀️":"🌙";b.title=saved==="dark"?"Switch to light mode":"Switch to dark mode";b.setAttribute("aria-label",b.title)}}
function setup(){
  themeInit();
  const toggle=$("#navToggle"), links=$("#navLinks"), scrim=$("#navScrim");
  const close=()=>{
    links?.classList.remove("open");
    scrim?.classList.remove("show");
    toggle?.setAttribute("aria-expanded","false");
    if(toggle) toggle.textContent="☰";
    document.body.classList.remove("nav-lock");
  };
  const open=()=>{
    links?.classList.add("open");
    scrim?.classList.add("show");
    toggle?.setAttribute("aria-expanded","true");
    if(toggle) toggle.textContent="✕";
    document.body.classList.add("nav-lock");
  };
  toggle?.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();links?.classList.contains("open")?close():open();});
  scrim?.addEventListener("click",close);
  links?.addEventListener("click",e=>{
    const a=e.target.closest("a");
    if(!a) return;
    close();
    // Do not prevent default: normal browser navigation is intentional.
  });
  let page=location.pathname.split("/").pop().replace(".html","")||"index";
  page=page==="index"?"home":page;
  $$(".nav-links a").forEach(a=>a.classList.toggle("active",a.dataset.page===page));
  if($("#statusText")) status();
  setInterval(status,60000);
  const params=new URLSearchParams(location.search);
  if(params.get("category")) activeCategory=params.get("category");
  renderAll();
  $("#themeToggle")?.addEventListener("click",()=>{
    let next=document.documentElement.dataset.theme==="dark"?"light":"dark";
    document.documentElement.dataset.theme=next;
    localStorage.setItem("savor_theme",next);
    let b=$("#themeToggle");
    if(b){b.textContent=next==="dark"?"☀️":"🌙";b.title=next==="dark"?"Switch to light mode":"Switch to dark mode";b.setAttribute("aria-label",b.title)}
  });
  document.addEventListener("click",e=>{
    let a=e.target.closest("[data-add]"),pl=e.target.closest("[data-plus]"),mi=e.target.closest("[data-minus]"),rm=e.target.closest("[data-remove]"),cat=e.target.closest("[data-cat]");
    if(a)add(+a.dataset.add); else if(pl)change(+pl.dataset.plus,1); else if(mi)change(+mi.dataset.minus,-1); else if(rm){delete cart[rm.dataset.remove];save();renderAll()} else if(cat){activeCategory=cat.dataset.cat;renderTabs();renderMenu()}
  });
  $("#search")?.addEventListener("input",renderMenu);
  $("#clearSearch")?.addEventListener("click",()=>{$("#search").value="";renderMenu()});
  $("#clearCart")?.addEventListener("click",()=>{cart={};save();renderAll()});
  document.addEventListener("keydown",e=>{if(e.key==="Escape")close()});
  window.addEventListener("pageshow",close);
}

const oldSetup=setup;
const hidePreloader=()=>{
  const preloader=document.getElementById("preloader");
  if(preloader){
    preloader.classList.add("hide");
    preloader.setAttribute("aria-hidden","true");
    window.setTimeout(()=>preloader.remove(),550);
  }
};
const wrappedSetup=()=>{
  try {
    oldSetup();
    if(typeof initGallery === "function") initGallery();
    if(typeof initReviews === "function") initReviews();
  } catch(err) {
    console.error("Savor Cafe initialization error:", err);
  } finally {
    hidePreloader();
  }
};
document.addEventListener("DOMContentLoaded",wrappedSetup,{once:true});

/* =========================================================
   STATIC CUSTOMER AUTH + LOCAL ORDER BOOK
========================================================= */
const APP_DATA_KEY = "savor_app_data_v2";
const ADMIN_SESSION_KEY = "savor_admin_session_v1";

function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
function writeJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function normalizePhone(v) { return String(v || "").replace(/\D/g, "").slice(-10); }
function getAppData() {
  const d = readJSON(APP_DATA_KEY, null);
  if (d && typeof d === "object" && Array.isArray(d.users) && Array.isArray(d.orders)) return d;
  const legacyUsers = readJSON("savor_auth_users_v1", []);
  const legacyCurrent = readJSON("savor_auth_current_v1", null);
  const legacyOrdersA = readJSON("savor_orders_v1", []);
  const legacyOrdersB = readJSON("savor_cafe_orders_v1", []);
  const orders = [];
  const seen = new Set();
  [...legacyOrdersA, ...legacyOrdersB].forEach(o => {
    const key = String(o?.orderNumber || o?.id || "");
    if (key && !seen.has(key)) { seen.add(key); orders.push(o); }
  });
  const data = {version:2, users:Array.isArray(legacyUsers)?legacyUsers:[], currentUser:legacyCurrent || null, orders};
  writeJSON(APP_DATA_KEY, data);
  return data;
}
function saveAppData(data) { writeJSON(APP_DATA_KEY, data); }
function getUsers() { return getAppData().users; }
function getOrders() { return getAppData().orders; }
function migrateLegacyOrders() { getAppData(); }
migrateLegacyOrders();
function getCurrentUser() { return getAppData().currentUser; }
function setCurrentUser(user) { const d=getAppData(); d.currentUser=user||null; saveAppData(d); }
function saveUsers(users) { const d=getAppData(); d.users=users; saveAppData(d); }
function saveOrders(orders) { const d=getAppData(); d.orders=orders; saveAppData(d); }
function customerOrSignup(next=location.pathname + location.search) {
  if (!getCurrentUser()) {
    location.href = "/login.html?next=" + encodeURIComponent(next);
    return false;
  }
  return true;
}

function downloadExcel(filename, rows, columns) {
  const escCell = v => esc(v == null ? "" : v);
  const header = columns.map(c => `<th>${escCell(c)}</th>`).join("");
  const body = rows.map(r => `<tr>${columns.map(c => `<td>${escCell(r[c])}</td>`).join("")}</tr>`).join("");
  const html = `<html><head><meta charset="UTF-8"></head><body><table><tr>${header}</tr>${body}</table></body></html>`;
  const blob = new Blob([html], {type:"application/vnd.ms-excel;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function recordLocalOrder(fd, orderDetails) {
  const u = getCurrentUser() || {};
  const formName = String(fd?.get("name") || "").trim();
  const formPhone = normalizePhone(fd?.get("phone") || "");
  const phone = formPhone || normalizePhone(u.phone);
  const name = formName || String(u.name || "Customer").trim();
  if (!phone) { toast("Customer mobile number is missing"); return false; }
  const mode = currentMode === "delivery" ? "Delivery" : currentMode === "takeaway" ? "Takeaway" : "Dine-in";
  const items = Object.entries(cart).map(([id, qty]) => {
    const p = products.find(x => x.id == id);
    return p ? {name:p.name, qty:Number(qty), amount:p.price * Number(qty)} : null;
  }).filter(Boolean);
  if (!items.length) { toast("Your cart is empty"); return false; }
  const now = new Date();
  const orders = getOrders();
  const orderNumber = String(orderDetails?.orderNumber || generateOrderDetails().orderNumber);
  const existing = orders.find(o => String(o.orderNumber) === orderNumber);
  if (existing) return true;
  const order = {
    id: "O" + Date.now(),
    orderNumber,
    userId: u.id || "",
    orderDate: orderDetails?.orderDate || orderDetails?.date || now.toLocaleDateString("en-IN"),
    orderTime: orderDetails?.orderTime || orderDetails?.time || now.toLocaleTimeString("en-IN"),
    isoDate: now.toLocaleDateString("en-CA"),
    createdAt: now.toISOString(),
    name,
    phone,
    normalizedPhone: phone,
    type: mode,
    address: mode === "Delivery" ? String(fd?.get("address") || "") : "",
    gpsLocation: mode === "Delivery" ? String(fd?.get("gpsLocation") || "") : "",
    notes: String(fd?.get("notes") || ""),
    items,
    total: items.reduce((sum,i)=>sum + Number(i.amount||0),0),
    status: "Placed"
  };
  orders.push(order);
  saveOrders(orders);
  return true;
}
function renderCustomerHeader() {
  const u = getCurrentUser();
  const link = $("#accountNav");
  if (link) {
    link.textContent = u ? `Hi, ${u.name.split(" ")[0]}` : "Login";
    link.href = u ? "/profile.html" : "/login.html";
  }
}

function staticAuthSetup() {
  const path = location.pathname.split("/").pop() || "index.html";
  const user = getCurrentUser();
  renderCustomerHeader();

  if (path === "checkout.html" && !user) {
    location.replace("/login.html?next=" + encodeURIComponent("/checkout.html"));
    return;
  }

  if (path === "checkout.html" && user) {
    const name = $("#checkoutForm [name=name]");
    const phone = $("#checkoutForm [name=phone]");
    if (name) { name.value = user.name; name.readOnly = true; }
    if (phone) { phone.value = user.phone; phone.readOnly = true; }
  }

  if (path === "checkout.html" && user) {
    const modeButtons = $$("#orderMode [data-mode]");
    modeButtons.forEach(btn => btn.addEventListener("click", () => {
      currentMode = btn.dataset.mode || "delivery";
      modeButtons.forEach(b => b.classList.toggle("active", b === btn));
      const addressWrap = $("#addressWrap");
      const address = $("#checkoutForm [name=address]");
      if (addressWrap) addressWrap.hidden = currentMode !== "delivery";
      if (address) address.required = currentMode === "delivery";
    }));
    const form = $("#checkoutForm");
    form?.addEventListener("submit", e => {
      e.preventDefault();
      const fd = new FormData(form);
      const name = String(fd.get("name") || "").trim();
      const phone = normalizePhone(fd.get("phone"));
      const address = String(fd.get("address") || "").trim();
      if (name.length < 2) { toast("Please enter your full name"); return; }
      if (phone.length !== 10) { toast("Please enter a valid 10-digit mobile number"); return; }
      if (currentMode === "delivery" && !address) { toast("Manual delivery address is compulsory"); return; }
      if (!Object.keys(cart).length) { toast("Your cart is empty"); return; }
      const details = generateOrderDetails();
      const formObject = {}; fd.forEach((v,k) => formObject[k] = String(v));
      const pending = {details, form:formObject, mode:currentMode, cart:{...cart}, userId:user.id};
      writeJSON("savor_cafe_pending_order_v2", pending);
      // Keep a compatibility copy for the confirmation handler.
      writeJSON("savor_cafe_pending_order", pending);
      const url = checkoutUrl(fd, details);
      window.location.href = url;
    });
    const showPendingIfNeeded = () => {
      const pending = readJSON("savor_cafe_pending_order_v2", null);
      if (pending && pending.userId === user.id && !$("#whatsappConfirm")) showWhatsAppConfirmation();
    };
    showPendingIfNeeded();
    window.addEventListener("pageshow", showPendingIfNeeded);
  }

  if (path === "signup.html") {
    const form = $("#signupForm"), msg = $("#signupMsg");
    form?.addEventListener("submit", e => {
      e.preventDefault();
      const name = String(form.name.value || "").trim();
      const phone = normalizePhone(form.phone.value);
      if (name.length < 2) { msg.textContent = "Please enter your full name."; return; }
      if (phone.length !== 10) { msg.textContent = "Please enter a valid 10-digit mobile number."; return; }
      const users = getUsers();
      if (users.some(u => normalizePhone(u.phone) === phone)) { location.href = "/login.html?next=" + encodeURIComponent(new URLSearchParams(location.search).get("next") || "/cart.html"); return; }
      const newUser = {id:"U" + Date.now(), name, phone, createdAt:new Date().toISOString()};
      users.push(newUser); saveUsers(users); setCurrentUser(newUser);
      const next = new URLSearchParams(location.search).get("next") || "/cart.html";
      location.href = next;
    });
  }

  if (path === "login.html") {
    const form = $("#loginForm"), msg = $("#loginMsg");
    form?.addEventListener("submit", e => {
      e.preventDefault();
      const phone = normalizePhone(form.phone.value);
      const found = getUsers().find(u => normalizePhone(u.phone) === phone);
      if (!found) { msg.textContent = "Mobile number not found. Please sign up first."; return; }
      setCurrentUser(found);
      const next = new URLSearchParams(location.search).get("next") || "/cart.html";
      location.href = next;
    });
  }

  if (path === "profile.html") {
    if (!customerOrSignup()) return;
    const u = getCurrentUser();
    $("#profileName") && ($("#profileName").textContent = u.name);
    $("#profilePhone") && ($("#profilePhone").textContent = "+91 " + u.phone);
    $("#profileInitial") && ($("#profileInitial").textContent = u.name.charAt(0).toUpperCase());
    $("#profileOrdersCount") && ($("#profileOrdersCount").textContent = getOrders().filter(o => (o.userId && o.userId === u.id) || normalizePhone(o.normalizedPhone || o.phone) === normalizePhone(u.phone)).length);
    $("#logoutBtn")?.addEventListener("click", () => { setCurrentUser(null); location.href="/index.html"; });
  }

  if (path === "orders.html") {
    if (!customerOrSignup()) return;
    const u = getCurrentUser();
    const mine = getOrders().filter(o => (o.userId && o.userId === u.id) || normalizePhone(o.normalizedPhone || o.phone) === normalizePhone(u.phone)).sort((a,b) => String(b.createdAt||"").localeCompare(String(a.createdAt||"")));
    const box = $("#ordersList");
    $("#ordersPhone") && ($("#ordersPhone").textContent = "+91 " + u.phone);
    if (box) box.innerHTML = mine.length ? mine.map(o => `
      <article class="order-card">
        <div class="order-card-top"><div><span class="eyebrow">ORDER</span><h3>#${esc(o.orderNumber)}</h3></div><span class="order-status">${esc(o.status || "Placed")}</span></div>
        <p>${esc(o.orderDate)} · ${esc(o.orderTime)} · ${esc(o.type)}</p>
        <div class="order-items">${(o.items||[]).map(i => `<div><span>${esc(i.name)} × ${i.qty}</span><b>${money(i.amount)}</b></div>`).join("")}</div>
        ${o.address ? `<p class="order-address">📍 ${esc(o.address)}</p>` : ""}
        <div class="order-card-bottom"><span>Total</span><strong>${money(o.total)}</strong></div>
      </article>`).join("") : `<div class="empty-state"><div>📦</div><h3>No orders yet</h3><p>Your placed orders will appear here.</p><a class="btn primary" href="/menu.html">Order now →</a></div>`;
  }

  if (path === "admin.html") {
    const login = $("#adminLogin"), dash = $("#adminDashboard");
    const renderAdmin = () => {
      const ok = localStorage.getItem(ADMIN_SESSION_KEY) === "1";
      if (login) login.hidden = ok; if (dash) dash.hidden = !ok; if (!ok) return;
      const orders = getOrders().sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
      const today = new Date().toLocaleDateString("en-CA");
      const todayOrders = orders.filter(o=>o.isoDate===today);
      $("#adminTodayOrders") && ($("#adminTodayOrders").textContent=todayOrders.length);
      $("#adminTodaySales") && ($("#adminTodaySales").textContent=money(todayOrders.reduce((s,o)=>s+Number(o.total||0),0)));
      $("#adminCustomers") && ($("#adminCustomers").textContent=getUsers().length);
      $("#adminAllOrders") && ($("#adminAllOrders").textContent=orders.length);
      const body=$("#adminOrdersBody");
      if(body) body.innerHTML=orders.length ? orders.map((o,i)=>`<tr><td>#${esc(o.orderNumber)}</td><td>${esc(o.name)}</td><td>${esc(o.phone)}</td><td>${esc(o.type)}</td><td>${money(o.total)}</td><td>${esc(o.orderDate)}<br><small>${esc(o.orderTime)}</small></td><td><select data-order-status="${esc(o.orderNumber)}"><option ${o.status==="Placed"?"selected":""}>Placed</option><option ${o.status==="Confirmed"?"selected":""}>Confirmed</option><option ${o.status==="Preparing"?"selected":""}>Preparing</option><option ${o.status==="Out for delivery"?"selected":""}>Out for delivery</option><option ${o.status==="Completed"?"selected":""}>Completed</option><option ${o.status==="Cancelled"?"selected":""}>Cancelled</option></select></td></tr>`).join("") : `<tr><td colspan="7">No orders in this browser.</td></tr>`;
    };
    login?.querySelector("form")?.addEventListener("submit",e=>{e.preventDefault(); if(login.adminUser.value==="admin" && login.adminPass.value==="savoradmin"){localStorage.setItem(ADMIN_SESSION_KEY,"1");renderAdmin();}else $("#adminMsg").textContent="Invalid admin credentials.";});
    $("#adminLogout")?.addEventListener("click",()=>{localStorage.removeItem(ADMIN_SESSION_KEY);location.reload();});
    $("#exportUsers")?.addEventListener("click",()=>downloadExcel("auth.xls",getUsers(),["id","name","phone","createdAt"]));
    $("#exportOrders")?.addEventListener("click",()=>downloadExcel("orders.xls",getOrders(),["orderNumber","orderDate","orderTime","name","phone","type","address","total","status"]));
    document.addEventListener("change", e=>{ const s=e.target.closest("[data-order-status]"); if(!s)return; const orders=getOrders(); const o=orders.find(x=>x.orderNumber===s.dataset.orderStatus); if(o){o.status=s.value;saveOrders(orders);} });
    renderAdmin();
  }
}

document.addEventListener("DOMContentLoaded", staticAuthSetup);

})();