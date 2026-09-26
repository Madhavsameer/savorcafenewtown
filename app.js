(() => {
  "use strict";

  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const money = n => `₹${Number(n).toLocaleString("en-IN")}`;
  const products = window.MENU_PRODUCTS.map(p => ({
    ...p,
    veg: !/(chicken|mutton|fish|egg|katla|rui|prawn|meat)/i.test(p.name)
  }));

  const categories = {
    starters:["🍢","Starters"],
    tandoor:["🔥","Tandoor"],
    noodles:["🍜","Noodles"],
    chinese:["🥢","Chinese"],
    soup:["🥣","Soups"],
    seafood:["🐟","Seafood"],
    combo:["🍛","Combos"],
    veg:["🥦","Vegetarian"],
    roti:["🫓","Breads"],
    biryani:["🍚","Biryani"],
    rice:["🍚","Rice & Mains"],
    salad:["🥗","Salads & Drinks"]
  };
  const order = ["starters","tandoor","noodles","chinese","soup","seafood","combo","veg","roti","biryani","rice","salad"];
  const popular = [30,86,24,43,20,52,88,41,84,44];

  const cart = {};
  let currentMode = "delivery";
  let activeCategory = "all";

  function setNavHeight(){
    const h = $(".navbar")?.offsetHeight || 62;
    document.documentElement.style.setProperty("--nav", `${h}px`);
  }

  function toast(message){
    const el = $("#toast");
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove("show"), 2200);
  }

  function closeNav(){
    $("#navLinks").classList.remove("open");
    $("#navScrim").classList.remove("show");
    $("#navToggle").textContent = "☰";
    $("#navToggle").setAttribute("aria-expanded","false");
    document.body.classList.remove("lock");
  }

  function openNav(){
    $("#navLinks").classList.add("open");
    $("#navScrim").classList.add("show");
    $("#navToggle").textContent = "✕";
    $("#navToggle").setAttribute("aria-expanded","true");
    document.body.classList.add("lock");
  }

  function go(page){
    if(!["home","menu","about","contact"].includes(page)) page="home";
    closeNav();
    $$(".page").forEach(p => p.classList.toggle("active", p.id === `page-${page}`));
    $$(".nav-links a").forEach(a => a.classList.toggle("active", a.dataset.nav === page));
    if(location.hash !== `#${page}`) history.replaceState(null,"",`#${page}`);
    window.scrollTo(0,0);
  }

  function openCart(){
    $("#cart").classList.add("open");
    $("#cartScrim").classList.add("show");
    document.body.classList.add("lock");
  }

  function closeCart(){
    $("#cart").classList.remove("open");
    $("#cartScrim").classList.remove("show");
    document.body.classList.remove("lock");
  }

  function qty(id){ return cart[id] || 0; }

  function add(id){
    cart[id] = qty(id) + 1;
    renderAll();
    toast("Added to your order");
  }

  function change(id, delta){
    cart[id] = Math.max(0, qty(id) + delta);
    if(cart[id] === 0) delete cart[id];
    renderAll();
  }

  function cartCount(){ return Object.values(cart).reduce((a,b)=>a+b,0); }
  function cartTotal(){ return Object.entries(cart).reduce((sum,[id,q]) => sum + products.find(p=>p.id===+id).price*q,0); }

  function stepper(id){
    return `<div class="stepper"><button type="button" data-minus="${id}">−</button><b>${qty(id)}</b><button type="button" data-plus="${id}">+</button></div>`;
  }

  function renderCart(){
    const ids = Object.keys(cart).map(Number);
    const box = $("#cartItems");
    if(!ids.length){
      box.innerHTML = `<div class="cart-empty"><div style="font-size:48px">🛒</div><h3>Your cart is empty</h3><p>Add something delicious from the menu.</p></div>`;
    } else {
      box.innerHTML = ids.map(id => {
        const p = products.find(x=>x.id===id);
        return `<div class="cart-line">
          <div><h4>${escapeHtml(p.name)}</h4><small>${money(p.price)} each</small></div>
          <div class="cart-line-right"><strong>${money(p.price*qty(id))}</strong>${stepper(id)}<button class="remove" type="button" data-remove="${id}">Remove</button></div>
        </div>`;
      }).join("");
    }
    $("#cartCount").textContent = cartCount();
    $("#cartTotal").textContent = money(cartTotal());
    $("#checkoutBtn").disabled = !ids.length;
    $("#mobileCartCount").textContent = `${cartCount()} ${cartCount()===1?"item":"items"}`;
    $("#mobileCartTotal").textContent = money(cartTotal());
    $("#mobileCart").classList.toggle("show", ids.length > 0);
  }

  function renderHome(){
    $("#homeCats").innerHTML = order.map(key => {
      const [icon,label] = categories[key];
      const count = products.filter(p=>p.category===key).length;
      return `<a href="#menu" data-category="${key}" class="category-card"><span class="emoji">${icon}</span><h3>${label}</h3><p>${count} dishes</p></a>`;
    }).join("");

    $("#homePopular").innerHTML = popular.map(id => {
      const p = products.find(x=>x.id===id);
      return `<article class="popular-card">
        <div class="food-art">${foodEmoji(p)}</div>
        <h3>${escapeHtml(p.name)}</h3>
        <div class="pc-bottom"><strong>${money(p.price)}</strong><button class="mini-add" type="button" data-add="${p.id}">+ Add</button></div>
      </article>`;
    }).join("");
  }

  function renderTabs(){
    $("#cats").innerHTML = `<button type="button" class="category-tab ${activeCategory==="all"?"active":""}" data-cat="all">All</button>` +
      order.map(key => `<button type="button" class="category-tab ${activeCategory===key?"active":""}" data-cat="${key}">${categories[key][0]} ${categories[key][1]}</button>`).join("");
  }

  function renderMenu(){
    const query = $("#search").value.trim().toLowerCase();
    const mount = $("#menuMount");
    const groups = activeCategory === "all" ? order : [activeCategory];
    let html = "";
    let visible = 0;

    groups.forEach(cat => {
      const list = products.filter(p => p.category === cat && (!query || p.name.toLowerCase().includes(query)));
      if(!list.length) return;
      visible += list.length;
      const [icon,label] = categories[cat];
      html += `<section class="menu-section" id="cat-${cat}"><h2>${icon} ${label} <span>${list.length} dishes</span></h2><div class="menu-grid">`;
      html += list.map(p => `
        <article class="menu-item">
          <div class="item-info"><i class="food-dot ${p.veg?"":"nonveg"}"></i><div><div class="item-name">${escapeHtml(p.name)}</div><div class="item-price">${money(p.price)}</div></div></div>
          ${qty(p.id) ? stepper(p.id) : `<button class="add-button" type="button" data-add="${p.id}">+ Add</button>`}
        </article>`).join("");
      html += `</div></section>`;
    });

    mount.innerHTML = html;
    $("#emptyState").hidden = visible !== 0;
  }

  function renderAll(){
    renderCart();
    renderMenu();
  }

  function foodEmoji(p){
    if(/biryani|rice|khichuri|pulao/i.test(p.name)) return "🍚";
    if(/noodle|manchurian|chilli|chinese|fried rice/i.test(p.name)) return "🍜";
    if(/fish|katla|rui|prawn/i.test(p.name)) return "🐟";
    if(/paneer|veg|dal|aloo|mushroom|broccoli|rajma|roti|naan|paratha/i.test(p.name)) return "🥘";
    return "🍗";
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function updateStatus(){
    const now = new Date();
    const mins = now.getHours()*60 + now.getMinutes();
    const open = mins >= 660 && mins < 1380;
    $("#statusText").textContent = open ? "Open now" : "Closed · Opens 11 AM";
    $("#statusDot").classList.toggle("closed", !open);
  }

  function checkoutMessage(data){
    const lines = Object.entries(cart).map(([id,q]) => {
      const p = products.find(x=>x.id===+id);
      return `• ${p.name} × ${q} = ${money(p.price*q)}`;
    });
    const mode = currentMode === "delivery" ? "Delivery" : currentMode === "takeaway" ? "Takeaway" : "Dine-in";
    let msg = `*SAVOR CAFE' — NEW ORDER*%0A%0A`;
    msg += `*Order type:* ${mode}%0A`;
    msg += `*Name:* ${encodeURIComponent(data.name)}%0A`;
    msg += `*Phone:* ${encodeURIComponent(data.phone)}%0A`;
    if(currentMode==="delivery" && data.address) msg += `*Address:* ${encodeURIComponent(data.address)}%0A`;
    msg += `%0A*Items:*%0A${lines.map(encodeURIComponent).join("%0A")}%0A%0A`;
    msg += `*Total: ${money(cartTotal())}*`;
    if(data.notes) msg += `%0A*Notes:* ${encodeURIComponent(data.notes)}`;
    return `https://wa.me/918981315889?text=${msg}`;
  }

  function setup(){
    setNavHeight();
    renderHome();
    renderTabs();
    renderAll();
    updateStatus();
    setInterval(updateStatus,60000);

    setTimeout(() => $("#preloader").classList.add("hide"), 550);

    document.addEventListener("click", e => {
      const nav = e.target.closest("[data-nav]");
      if(nav){ e.preventDefault(); go(nav.dataset.nav); return; }

      const addBtn = e.target.closest("[data-add]");
      if(addBtn){ add(+addBtn.dataset.add); return; }

      const plus = e.target.closest("[data-plus]");
      if(plus){ change(+plus.dataset.plus,1); return; }

      const minus = e.target.closest("[data-minus]");
      if(minus){ change(+minus.dataset.minus,-1); return; }

      const remove = e.target.closest("[data-remove]");
      if(remove){ delete cart[remove.dataset.remove]; renderAll(); return; }

      const cat = e.target.closest("[data-cat]");
      if(cat){
        activeCategory = cat.dataset.cat;
        renderTabs(); renderMenu();
        return;
      }

      const homeCat = e.target.closest("[data-category]");
      if(homeCat){
        e.preventDefault();
        activeCategory = homeCat.dataset.category;
        $("#search").value = "";
        renderTabs(); renderMenu();
        go("menu");
        setTimeout(() => $("#cat-"+activeCategory)?.scrollIntoView({behavior:"smooth",block:"start"}),80);
      }
    });

    $("#navToggle").addEventListener("click", () => $("#navLinks").classList.contains("open") ? closeNav() : openNav());
    $("#navScrim").addEventListener("click", closeNav);
    $("#cartBtn").addEventListener("click", openCart);
    $("#mobileCartBtn").addEventListener("click", openCart);
    $("#closeCart").addEventListener("click", closeCart);
    $("#cartScrim").addEventListener("click", closeCart);

    $("#search").addEventListener("input", () => {
      $("#searchClear").classList.toggle("show", !!$("#search").value);
      renderMenu();
    });
    $("#searchClear").addEventListener("click", () => {
      $("#search").value = "";
      $("#searchClear").classList.remove("show");
      renderMenu();
      $("#search").focus();
    });

    $("#checkoutBtn").addEventListener("click", () => {
      closeCart();
      $("#checkoutModal").showModal();
    });
    $("#closeModal").addEventListener("click", () => $("#checkoutModal").close());

    $$("#orderMode button").forEach(btn => btn.addEventListener("click", () => {
      $$("#orderMode button").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      currentMode = btn.dataset.mode;
      $("#addressWrap").style.display = currentMode === "delivery" ? "" : "none";
    }));

    $("#gpsBtn").addEventListener("click", () => {
      const msg = $("#gpsMsg");
      if(!navigator.geolocation){ msg.textContent = "Location is not supported by this browser."; return; }
      msg.textContent = "Getting your location...";
      navigator.geolocation.getCurrentPosition(pos => {
        const {latitude,longitude} = pos.coords;
        const link = `https://www.google.com/maps?q=${latitude},${longitude}`;
        $("textarea[name=address]").value = link;
        msg.textContent = "Location added.";
      }, () => msg.textContent = "Couldn't access location. Please enter your address.", {enableHighAccuracy:true,timeout:10000});
    });

    $("#checkoutForm").addEventListener("submit", e => {
      e.preventDefault();
      if(!cartCount()) return;
      const fd = new FormData(e.currentTarget);
      const url = checkoutMessage({
        name: fd.get("name"),
        phone: fd.get("phone"),
        address: fd.get("address"),
        notes: fd.get("notes")
      });
      window.open(url,"_blank","noopener");
    });

    $("#contactForm").addEventListener("submit", e => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const text = `Hello Savor Cafe'!%0A%0AName: ${encodeURIComponent(fd.get("name"))}%0APhone: ${encodeURIComponent(fd.get("phone")||"Not provided")}%0AMessage: ${encodeURIComponent(fd.get("message"))}`;
      window.open(`https://wa.me/918981315889?text=${text}`,"_blank","noopener");
    });

    window.addEventListener("resize", setNavHeight);
    window.addEventListener("hashchange", () => {
      const page = location.hash.replace("#","") || "home";
      go(page);
    });

    const initial = location.hash.replace("#","") || "home";
    go(initial);
  }

  document.addEventListener("DOMContentLoaded", setup);
})();
