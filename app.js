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
function renderNav(){const n=count(),t=total();["#cartCount","#navCartCount"].forEach(s=>{if($(s))$(s).textContent=n});let bar=$("#viewCartBar");if(bar){const hideHere=document.body.classList.contains("cart-page")||document.body.classList.contains("checkout-page");bar.hidden=hideHere||n===0;bar.classList.toggle("show",!hideHere&&n>0);if($("#floatingCartCount"))$("#floatingCartCount").textContent=`${n} ${n===1?"item":"items"}`;if($("#floatingCartTotal"))$("#floatingCartTotal").textContent=money(t)}}
function renderHome(){const c=$("#homeCats");if(c)c.innerHTML=order.map(k=>`<a class="category-card" href="/menu.html?category=${k}"><span class="emoji">${categories[k][0]}</span><h3>${categories[k][1]}</h3><p>${products.filter(p=>p.category===k).length} dishes</p></a>`).join("");const p=$("#homePopular");if(p)p.innerHTML=popular.map(id=>{let x=products.find(a=>a.id===id);return x?`<article class="popular-card"><div class="food-art">${emoji(x)}</div><h3>${esc(x.name)}</h3><div class="pc-bottom"><strong>${money(x.price)}</strong><button class="mini-add" data-add="${x.id}">+ Add</button></div></article>`:""}).join("")}
function emoji(p){if(!p)return"🍽️";if(/biryani|rice|khichuri|pulao/i.test(p.name))return"🍚";if(/noodle|manchurian|chilli|fried rice/i.test(p.name))return"🍜";if(/fish|katla|rui|prawn/i.test(p.name))return"🐟";if(/paneer|veg|dal|aloo|mushroom|broccoli|rajma|roti|naan|paratha/i.test(p.name))return"🥘";return"🍗"}
function renderMenu(){const mount=$("#menuMount");if(!mount)return;const q=($("#search")?.value||"").trim().toLowerCase(),groups=activeCategory==="all"?order:[activeCategory];let html="",seen=0;groups.forEach(k=>{let list=products.filter(p=>p.category===k&&(!q||p.name.toLowerCase().includes(q)));if(!list.length)return;seen+=list.length;html+=`<section class="menu-section" id="cat-${k}"><h2>${categories[k][0]} ${categories[k][1]} <span>${list.length} dishes</span></h2><div class="menu-grid">${list.map(p=>`<article class="menu-item"><div class="item-info"><i class="food-dot ${p.veg?"":"nonveg"}"></i><div><div class="item-name">${esc(p.name)}</div><div class="item-price">${money(p.price)}</div></div></div>${cart[p.id]?stepper(p.id):`<button class="add-button" data-add="${p.id}">+ Add</button>`}</article>`).join("")}</div></section>`});mount.innerHTML=html;if($("#emptyState"))$("#emptyState").hidden=seen!==0}
function renderTabs(){let e=$("#cats");if(!e)return;e.innerHTML=`<button class="category-tab ${activeCategory==="all"?"active":""}" data-cat="all">All</button>`+order.map(k=>`<button class="category-tab ${activeCategory===k?"active":""}" data-cat="${k}">${categories[k][0]} ${categories[k][1]}</button>`).join("")}
function renderCartPage(){let box=$("#cartPageItems");if(!box)return;let ids=Object.keys(cart).map(Number);box.innerHTML=ids.length?ids.map(id=>{let p=products.find(x=>x.id===id);return p?`<div class="cart-page-line"><div><b>${esc(p.name)}</b><small>${money(p.price)} each</small></div><div><strong>${money(p.price*(cart[id]||0))}</strong>${stepper(id)}<button class="remove" data-remove="${id}">Remove</button></div></div>`:""}).join(""):`<div class="cart-empty"><div>🛒</div><h2>Your cart is empty</h2><p>Add some dishes first.</p><a class="btn primary" href="/menu.html">Browse menu →</a></div>`;if($("#cartPageTotal"))$("#cartPageTotal").textContent=money(total());if($("#checkoutBtn")){ const b=$("#checkoutBtn"); b.classList.toggle("disabled",!ids.length); b.onclick=(e)=>{ if(!ids.length){e.preventDefault();return;} if(!getCurrentUser()){e.preventDefault();sessionStorage.setItem("savor_auth_next","/checkout.html");location.href="/signup.html?next="+encodeURIComponent("/checkout.html");} }; }}
function renderCheckout(){let box=$("#checkoutItems");if(!box)return;let ids=Object.keys(cart).map(Number);if(!ids.length){box.innerHTML=`<div class="checkout-empty">Your cart is empty.<br><a href="/menu.html">Browse menu →</a></div>`;$("#checkoutTotal").textContent="₹0";$("#checkoutForm")?.querySelector("button[type=submit]")?.setAttribute("disabled","");return}box.innerHTML=ids.map(id=>{let p=products.find(x=>x.id===id);return p?`<div class="summary-line"><span>${esc(p.name)} <b>× ${cart[id]}</b></span><strong>${money(p.price*cart[id])}</strong></div>`:""}).join("");$("#checkoutTotal").textContent=money(total())}
function renderAll(){renderNav();renderHome();renderTabs();renderMenu();renderCartPage();renderCheckout()}
function status(){let m=new Date().getHours()*60+new Date().getMinutes(),o=m>=660&&m<1380;if($("#statusText"))$("#statusText").textContent=o?"Open now":"Closed · Opens 11 AM";if($("#statusDot"))$("#statusDot").classList.toggle("closed",!o)}
function generateOrderDetails(){
  const d=new Date();
  const counterKey="savor_cafe_order_counter";
  const nextNumber=(parseInt(localStorage.getItem(counterKey)||"0",10)||0)+1;
  localStorage.setItem(counterKey,String(nextNumber));
  const orderNumber=String(nextNumber);
  const date=d.toLocaleDateString("en-IN",{day:"2-digit",month:"2-digit",year:"numeric"});
  const time=d.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:true});
  return {orderNumber,date,time,timestamp:d.toISOString()};
}
function checkoutUrl(fd,details){
  let items=Object.entries(cart).map(([id,q])=>{let p=products.find(x=>x.id==id);return`• ${p.name} × ${q} = ${money(p.price*q)}`}).join("\n"),mode=currentMode==="delivery"?"Delivery":currentMode==="takeaway"?"Takeaway":"Dine-in";
  let text=`*SAVOR CAFE' — NEW ORDER*\n\n*Order Number:* ${details.orderNumber}\n*Order Date:* ${details.date}\n*Order Time:* ${details.time}\n*Order type:* ${mode}\n*Name:* ${fd.get("name")}\n*Phone:* ${fd.get("phone")}\n`;
  if(currentMode==="delivery"){text+=`*Manual Address:* ${fd.get("address")}\n`;if(fd.get("gpsLocation"))text+=`*GPS Location:* ${fd.get("gpsLocation")}\n`;}
  text+=`\n*Items:*\n${items}\n\n*Total:* ${money(total())}`;
  if(fd.get("notes"))text+=`\n*Notes:* ${fd.get("notes")}`;
  return`https://wa.me/918981315889?text=${encodeURIComponent(text)}`
}
function themeInit(){let saved=localStorage.getItem("savor_theme")||"dark";document.documentElement.dataset.theme=saved;let b=$("#themeToggle");if(b){b.textContent=saved==="dark"?"☀️":"🌙";b.title=saved==="dark"?"Switch to light mode":"Switch to dark mode";b.setAttribute("aria-label",b.title)}}
function setup(){themeInit();const toggle=$("#navToggle"),links=$("#navLinks"),scrim=$("#navScrim");function close(){links?.classList.remove("open");scrim?.classList.remove("show");toggle?.setAttribute("aria-expanded","false");if(toggle)toggle.textContent="☰";document.body.classList.remove("nav-lock")}function open(){links?.classList.add("open");scrim?.classList.add("show");toggle?.setAttribute("aria-expanded","true");if(toggle)toggle.textContent="✕";document.body.classList.add("nav-lock")}toggle?.addEventListener("click",()=>links?.classList.contains("open")?close():open());scrim?.addEventListener("click",close);links?.querySelectorAll("a").forEach(a=>a.addEventListener("click",close));
let page=location.pathname.split("/").pop().replace(".html","")||"index";page=page==="index"?"home":page;$$('.nav-links a').forEach(a=>a.classList.toggle('active',a.dataset.page===page));if($("#statusText"))status();setInterval(status,60000);const params=new URLSearchParams(location.search);if(params.get("category"))activeCategory=params.get("category");renderAll();
$("#themeToggle")?.addEventListener("click",()=>{let next=document.documentElement.dataset.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=next;localStorage.setItem("savor_theme",next);let b=$("#themeToggle");b.textContent=next==="dark"?"☀️":"🌙";b.title=next==="dark"?"Switch to light mode":"Switch to dark mode";b.setAttribute("aria-label",b.title)});
document.addEventListener("click",e=>{let a=e.target.closest("[data-add]"),pl=e.target.closest("[data-plus]"),mi=e.target.closest("[data-minus]"),rm=e.target.closest("[data-remove]"),cat=e.target.closest("[data-cat]");if(a)add(+a.dataset.add);else if(pl)change(+pl.dataset.plus,1);else if(mi)change(+mi.dataset.minus,-1);else if(rm){delete cart[rm.dataset.remove];save();renderAll()}else if(cat){activeCategory=cat.dataset.cat;renderTabs();renderMenu()}});
$("#search")?.addEventListener("input",()=>{if($("#searchClear"))$("#searchClear").classList.toggle("show",!!$("#search").value);renderMenu()});$("#searchClear")?.addEventListener("click",()=>{$("#search").value="";$("#searchClear").classList.remove("show");renderMenu()});
$$("#orderMode button").forEach(b=>b.addEventListener("click",()=>{$$("#orderMode button").forEach(x=>x.classList.remove("active"));b.classList.add("active");currentMode=b.dataset.mode;if($("#addressWrap"))$("#addressWrap").style.display=""}));
$("#manualAddressBtn")?.addEventListener("click",()=>{const a=$("textarea[name=address]");$("#manualAddressBtn")?.classList.add("active");$("#gpsBtn")?.classList.remove("active");a?.focus();if($("#gpsMsg"))$("#gpsMsg").textContent="Please enter your complete manual address below."});
$("#gpsBtn")?.addEventListener("click",()=>{
  const msg=$("#gpsMsg");
  if(!navigator.geolocation){if(msg)msg.textContent="Live location is not supported by this browser.";return}
  $("#gpsBtn")?.classList.add("active");$("#manualAddressBtn")?.classList.remove("active");
  if(msg)msg.textContent="Getting your live location…";
  navigator.geolocation.getCurrentPosition(p=>{
    const lat=p.coords.latitude.toFixed(6),lng=p.coords.longitude.toFixed(6);
    const map=`https://www.google.com/maps?q=${lat},${lng}`;
    const gps=$("#gpsLocation");
    if(gps){gps.value=map;gps.hidden=false}
    if(msg)msg.textContent=`Live location captured: ${lat}, ${lng}. Manual address is still required.`;
  },err=>{if(msg)msg.textContent=err.code===1?"Location permission denied. Please allow location access.":"Could not get live location. Please try again."},{enableHighAccuracy:true,timeout:12000,maximumAge:0});
});
$("#checkoutForm")?.addEventListener("submit",e=>{e.preventDefault();if(!count())return toast("Your cart is empty");const form=e.currentTarget;const address=form.querySelector("[name=address]");if(currentMode==="delivery" && address && !address.value.trim()){address.setCustomValidity("Please enter your complete manual delivery address.");address.reportValidity();address.focus();return}if(address)address.setCustomValidity("");if(!getCurrentUser()){location.href="/signup.html?next="+encodeURIComponent("/checkout.html");return}const fd=new FormData(form);const details=generateOrderDetails();recordLocalOrder(fd,details);localStorage.setItem("savor_cafe_last_order",JSON.stringify(details));const whatsappUrl=checkoutUrl(fd,details);cart={};save();window.location.href=whatsappUrl});
$("#contactForm")?.addEventListener("submit",e=>{e.preventDefault();let f=new FormData(e.currentTarget);window.open(`https://wa.me/918981315889?text=${encodeURIComponent(`Hello Savor Cafe'!\n\nName: ${f.get("name")}\nPhone: ${f.get("phone")||"Not provided"}\nMessage: ${f.get("message")}`)}`,"_blank")});
const pl=$("#preloader");if(pl){if(sessionStorage.getItem("savor_intro_seen")){pl.classList.add("hide")}else{sessionStorage.setItem("savor_intro_seen","1");setTimeout(()=>pl.classList.add("hide"),1900)}}
}
function initGallery(){const slides=$$(".gallery-slide"),dots=$("#galleryDots");if(!slides.length)return;let i=0,t;slides.forEach((_,n)=>{if(dots){let b=document.createElement("button");b.type="button";b.setAttribute("aria-label",`Photo ${n+1}`);b.addEventListener("click",()=>go(n));dots.appendChild(b)}});function go(n){i=(n+slides.length)%slides.length;slides.forEach((x,k)=>x.classList.toggle("active",k===i));$$("#galleryDots button").forEach((b,k)=>b.classList.toggle("active",k===i))}$("#galleryPrev")?.addEventListener("click",()=>go(i-1));$("#galleryNext")?.addEventListener("click",()=>go(i+1));go(0);t=setInterval(()=>go(i+1),4200);$("#gallerySlider")?.addEventListener("mouseenter",()=>clearInterval(t));$("#gallerySlider")?.addEventListener("mouseleave",()=>t=setInterval(()=>go(i+1),4200))}
function initReviews(){const track=$("#reviewTrack");if(!track)return;const data=[{source:"Google snapshot",rating:"4.8",count:"46 ratings",text:"A strong public rating snapshot for Savor Cafe on the Google listing."},{source:"Zomato snapshot",rating:"4.3",count:"11 dining ratings",text:"Zomato currently shows a 4.3 dining rating for the New Town outlet."},{source:"Justdial snapshot",rating:"4.7",count:"49 ratings",text:"Justdial currently shows a 4.7 rating snapshot for the outlet."}];let i=0;track.innerHTML=data.map((r,k)=>`<article class="review-card ${k===0?"active":""}"><div class="review-stars">★★★★★</div><div class="review-rating">${r.rating}<small>/ 5</small></div><p>${r.text}</p><b>${r.source}</b><span>${r.count}</span></article>`).join("");const cards=$$(".review-card"),dots=$("#reviewDots");data.forEach((_,k)=>{let b=document.createElement("button");b.type="button";b.addEventListener("click",()=>go(k));dots?.appendChild(b)});function go(n){i=(n+data.length)%data.length;cards.forEach((c,k)=>c.classList.toggle("active",k===i));$$("#reviewDots button").forEach((b,k)=>b.classList.toggle("active",k===i))}go(0);setInterval(()=>go(i+1),4000)}
const oldSetup=setup;const wrappedSetup=()=>{oldSetup();initGallery();initReviews()};document.removeEventListener("DOMContentLoaded",setup);document.addEventListener("DOMContentLoaded",wrappedSetup);

/* =========================================================
   STATIC CUSTOMER AUTH + LOCAL ORDER BOOK
========================================================= */
const AUTH_USERS_KEY = "savor_auth_users_v1";
const AUTH_CURRENT_KEY = "savor_auth_current_v1";
const AUTH_ORDERS_KEY = "savor_orders_v1";
const ADMIN_SESSION_KEY = "savor_admin_session_v1";

function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
function writeJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function normalizePhone(v) { return String(v || "").replace(/\D/g, "").slice(-10); }
function getUsers() { return readJSON(AUTH_USERS_KEY, []); }
function getOrders() { return readJSON(AUTH_ORDERS_KEY, []); }
function migrateLegacyOrders() {
  const legacy=readJSON("savor_cafe_orders_v1", []);
  const current=getOrders();
  if (legacy.length && !current.length) writeJSON(AUTH_ORDERS_KEY, legacy);
}
migrateLegacyOrders();
function getCurrentUser() { return readJSON(AUTH_CURRENT_KEY, null); }
function setCurrentUser(user) { user ? writeJSON(AUTH_CURRENT_KEY, user) : localStorage.removeItem(AUTH_CURRENT_KEY); }
function customerOrSignup() {
  if (!getCurrentUser()) {
    location.href = "/signup.html?next=" + encodeURIComponent(location.pathname + location.search);
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
  const u = getCurrentUser();
  if (!u) return;
  const mode = currentMode === "delivery" ? "Delivery" : currentMode === "takeaway" ? "Takeaway" : "Dine-in";
  const items = Object.entries(cart).map(([id, qty]) => {
    const p = products.find(x => x.id == id);
    return p ? {name:p.name, qty, amount:p.price * qty} : null;
  }).filter(Boolean);
  const now = new Date();
  const orders = getOrders();
  orders.push({
    orderNumber: orderDetails.orderNumber,
    orderDate: orderDetails.orderDate || orderDetails.date,
    orderTime: orderDetails.orderTime || orderDetails.time,
    isoDate: now.toLocaleDateString("en-CA"),
    createdAt: now.toISOString(),
    name: u.name,
    phone: u.phone,
    type: mode,
    address: currentMode === "delivery" ? String(fd.get("address") || "") : "",
    gpsLocation: currentMode === "delivery" ? String(fd.get("gpsLocation") || "") : "",
    notes: String(fd.get("notes") || ""),
    items,
    total: total(),
    status: "Placed"
  });
  writeJSON(AUTH_ORDERS_KEY, orders);
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
    location.replace("/signup.html?next=" + encodeURIComponent("/checkout.html"));
    return;
  }

  if (path === "checkout.html" && user) {
    const name = $("#checkoutForm [name=name]");
    const phone = $("#checkoutForm [name=phone]");
    if (name) { name.value = user.name; name.readOnly = true; }
    if (phone) { phone.value = user.phone; phone.readOnly = true; }
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
      if (users.some(u => normalizePhone(u.phone) === phone)) { msg.textContent = "This mobile number already exists. Please login."; return; }
      const newUser = {id:"U" + Date.now(), name, phone, createdAt:new Date().toISOString()};
      users.push(newUser); writeJSON(AUTH_USERS_KEY, users); setCurrentUser(newUser);
      const next = new URLSearchParams(location.search).get("next") || "/profile.html";
      location.href = next;
    });
  }

  if (path === "login.html") {
    const form = $("#loginForm"), msg = $("#loginMsg");
    form?.addEventListener("submit", e => {
      e.preventDefault();
      const phone = normalizePhone(form.phone.value);
      const found = getUsers().find(u => u.phone === phone);
      if (!found) { msg.textContent = "Mobile number not found. Please sign up first."; return; }
      setCurrentUser(found);
      const next = new URLSearchParams(location.search).get("next") || "/profile.html";
      location.href = next;
    });
  }

  if (path === "profile.html") {
    if (!customerOrSignup()) return;
    const u = getCurrentUser();
    $("#profileName") && ($("#profileName").textContent = u.name);
    $("#profilePhone") && ($("#profilePhone").textContent = "+91 " + u.phone);
    $("#profileInitial") && ($("#profileInitial").textContent = u.name.charAt(0).toUpperCase());
    $("#profileOrdersCount") && ($("#profileOrdersCount").textContent = getOrders().filter(o => normalizePhone(o.phone) === normalizePhone(u.phone)).length);
    $("#logoutBtn")?.addEventListener("click", () => { setCurrentUser(null); location.href="/index.html"; });
  }

  if (path === "orders.html") {
    if (!customerOrSignup()) return;
    const u = getCurrentUser();
    const mine = getOrders().filter(o => normalizePhone(o.phone) === normalizePhone(u.phone)).sort((a,b) => String(b.createdAt||"").localeCompare(String(a.createdAt||"")));
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
    document.addEventListener("change", e=>{ const s=e.target.closest("[data-order-status]"); if(!s)return; const orders=getOrders(); const o=orders.find(x=>x.orderNumber===s.dataset.orderStatus); if(o){o.status=s.value;writeJSON(AUTH_ORDERS_KEY,orders);} });
    renderAdmin();
  }
}

document.addEventListener("DOMContentLoaded", staticAuthSetup);

})();