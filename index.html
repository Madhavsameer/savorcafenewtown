const CATEGORY_LABELS = {
  starters:"Starters (6 pcs)", tandoor:"Tandoor (6 pcs)", noodles:"Noodles", chinese:"Chinese",
  soup:"Soups", seafood:"Seafood", salad:"Salads & Drinks", combo:"Indian Combos",
  veg:"Vegetarian Mains", roti:"Tawa Roti & Breads", biryani:"Biryani & Khichuri", rice:"Rice & Mains"
};
const CATEGORY_ICONS = {
  starters:"🍢", tandoor:"🔥", noodles:"🍜", chinese:"🥢", soup:"🥣", seafood:"🐟",
  salad:"🥗", combo:"🍛", veg:"🥦", roti:"🫓", biryani:"🍚", rice:"🍚"
};
const CATEGORY_ORDER = ["starters","tandoor","noodles","chinese","soup","seafood","veg","combo","biryani","rice","roti","salad"];
const NONVEG_WORDS = ["chicken","mutton","fish","egg","katla","rui","prawn","meat"];

(function(){
  const P = window.MENU_PRODUCTS;
  const isVeg = p => !NONVEG_WORDS.some(w => p.name.toLowerCase().includes(w));
  P.forEach(p => p.veg = isVeg(p));

  const cart = {};
  const $ = sel => document.querySelector(sel);

  // ---- preloader: one short, guaranteed branded moment — never depends on slow network/font loads ----
  requestAnimationFrame(() => {
    setTimeout(() => $('#preloader')?.classList.add('hide'), 650);
  });

  // ---- keep sticky offsets correct on notched phones (the navbar grows taller there) ----
  function setNavHeight(){
    const nb = document.querySelector('.navbar');
    if (nb) document.documentElement.style.setProperty('--navh', nb.getBoundingClientRect().height + 'px');
  }
  setNavHeight();
  window.addEventListener('resize', setNavHeight);
  window.addEventListener('orientationchange', () => setTimeout(setNavHeight, 250));

  // ---- status pill ----
  function updateStatus(){
    const h = new Date().getHours();
    const open = h >= 11 && h < 23;
    $('#statusDot').classList.toggle('closed', !open);
    $('#statusText').textContent = open ? 'Open now' : 'Closed — opens 11:00 AM';
  }
  updateStatus();

  // ---- mobile nav toggle (defined before routing, since goTo() calls closeNav on first load) ----
  const navLinks = $('#navLinks'), navScrim = $('#navScrim'), navToggle = $('#navToggle');
  function closeNav(){ navLinks.classList.remove('open'); navScrim.classList.remove('show'); navToggle.setAttribute('aria-expanded','false'); navToggle.textContent='☰'; }
  function openNav(){ navLinks.classList.add('open'); navScrim.classList.add('show'); navToggle.setAttribute('aria-expanded','true'); navToggle.textContent='✕'; setNavHeight(); }
  navToggle.onclick = () => { navLinks.classList.contains('open') ? closeNav() : openNav(); };
  navScrim.onclick = closeNav;

  // ---- routing ----
  const pages = [...document.querySelectorAll('.page')];
  function goTo(name){
    pages.forEach(p => p.classList.toggle('active', p.dataset.page === name));
    document.querySelectorAll('[data-nav]').forEach(a => {
      if (a.closest('.nav-links')) a.classList.toggle('active', a.dataset.nav === name);
    });
    closeNav();
    window.scrollTo(0,0);
    setTimeout(setNavHeight, 50);
    if (location.hash.slice(1) !== name) history.replaceState(null,'','#'+name);
  }
  document.querySelectorAll('[data-nav]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    goTo(a.dataset.nav);
  }));
  window.addEventListener('hashchange', () => {
    const n = location.hash.slice(1) || 'home';
    if (['home','menu','about','contact'].includes(n)) goTo(n);
  });
  goTo(location.hash.slice(1) || 'home');

  // ---- home category cards ----
  const present = CATEGORY_ORDER.filter(c => P.some(p => p.category === c));
  const homeCats = $('#homeCats');
  present.forEach(c => {
    const card = document.createElement('button');
    card.className = 'cat-card';
    card.innerHTML = `<span class="ic">${CATEGORY_ICONS[c]||'🍴'}</span><h4>${CATEGORY_LABELS[c]}</h4><span>${P.filter(p=>p.category===c).length} dishes</span>`;
    card.onclick = () => { goTo('menu'); setTimeout(() => document.getElementById('s-'+c)?.scrollIntoView({behavior:'smooth'}), 60); };
    homeCats.appendChild(card);
  });

  // ---- categories row (menu page) ----
  const catsEl = $('#cats'), menuEl = $('#menu'), searchEl = $('#search');
  present.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'cat';
    btn.textContent = CATEGORY_LABELS[c] || c;
    btn.dataset.cat = c;
    btn.onclick = () => document.getElementById('s-'+c).scrollIntoView({behavior:'smooth', block:'start'});
    catsEl.appendChild(btn);
  });

  const currentIndexByName = {};
  P.forEach(p => currentIndexByName[p.name.toLowerCase()] = p);

  function itemCard(p){
    const e = document.createElement('div');
    e.className = 'item';
    e.dataset.name = p.name.toLowerCase();
    e.innerHTML = `
      <div class="item-info">
        <span class="dot ${p.veg?'veg':'nonveg'}" title="${p.veg?'Veg':'Non-veg'}"></span>
        <div><div class="item-name">${p.name}</div><div class="item-price">₹${p.price}</div></div>
      </div>
      <div class="qty-slot"></div>`;
    renderQtySlot(e.querySelector('.qty-slot'), p);
    return e;
  }
  function renderQtySlot(slot, p){
    const q = cart[p.id] || 0;
    if (!q){
      slot.innerHTML = `<button class="add-btn">Add</button>`;
      slot.querySelector('.add-btn').onclick = () => addToCart(p);
    } else {
      slot.innerHTML = `<div class="stepper"><button data-d="-1" aria-label="Remove one">−</button><span class="n">${q}</span><button data-d="1" aria-label="Add one">+</button></div>`;
      slot.querySelectorAll('button').forEach(b => b.onclick = () => changeQty(p, parseInt(b.dataset.d)));
    }
  }
  function rebuildSlot(el){ if(!el) return; const p = currentIndexByName[el.dataset.name]; if (p) renderQtySlot(el.querySelector('.qty-slot'), p); }
  function findEl(name){ return document.querySelector(`.item[data-name="${CSS.escape(name.toLowerCase())}"]`); }
  // A dish can appear in more than one place (home preview + full menu) — keep every copy in sync.
  function rebuildAllCopies(name){
    document.querySelectorAll(`.item[data-name="${CSS.escape(name.toLowerCase())}"]`).forEach(rebuildSlot);
  }

  // ---- home "Popular Dishes" preview ----
  const POPULAR_IDS = [30,86,24,43,20,52,88,41,84,44];
  const popularWrap = $('#homePopular');
  if (popularWrap){
    const grid = document.createElement('div');
    grid.className = 'grid';
    POPULAR_IDS.forEach(id => { const p = P.find(x => x.id === id); if (p) grid.appendChild(itemCard(p)); });
    popularWrap.appendChild(grid);
  }

  present.forEach(c => {
    const section = document.createElement('section');
    section.className = 'section';
    section.id = 's-' + c;
    const items = P.filter(p => p.category === c);
    section.innerHTML = `<h3>${CATEGORY_LABELS[c]||c} <small>${items.length} dishes</small></h3>`;
    const grid = document.createElement('div');
    grid.className = 'grid';
    items.forEach(p => grid.appendChild(itemCard(p)));
    section.appendChild(grid);
    menuEl.appendChild(section);
  });

  function addToCart(p){
    cart[p.id] = (cart[p.id]||0) + 1;
    renderCart();
    showToast(p.name + ' added');
    rebuildAllCopies(p.name);
  }
  function changeQty(p, d){
    cart[p.id] = (cart[p.id]||0) + d;
    if (cart[p.id] <= 0) delete cart[p.id];
    renderCart();
    rebuildAllCopies(p.name);
  }

  function renderCart(){
    const box = $('#cartItems');
    const entries = Object.entries(cart);
    let total = 0, count = 0;
    if (!entries.length){
      box.innerHTML = `<div class="cart-empty">Your cart is empty.<br>Add a few dishes to get started.</div>`;
    } else {
      box.innerHTML = '';
      entries.forEach(([id, qty]) => {
        const p = P.find(x => x.id == id);
        if (!p) return;
        total += p.price * qty; count += qty;
        const line = document.createElement('div');
        line.className = 'line';
        line.innerHTML = `
          <div><div class="li-name">${p.name}</div><div class="li-price">₹${p.price} × ${qty} = ₹${p.price*qty}</div><button class="remove">Remove</button></div>
          <div class="stepper"><button data-d="-1" aria-label="Remove one">−</button><span class="n">${qty}</span><button data-d="1" aria-label="Add one">+</button></div>`;
        line.querySelector('.remove').onclick = () => { delete cart[p.id]; renderCart(); rebuildAllCopies(p.name); };
        line.querySelectorAll('.stepper button').forEach(b => b.onclick = () => changeQty(p, parseInt(b.dataset.d)));
        box.appendChild(line);
      });
    }
    $('#total').textContent = '₹' + total;
    const countEl = $('#count');
    if (countEl.textContent != count) { countEl.textContent = count; countEl.classList.remove('bump'); void countEl.offsetWidth; countEl.classList.add('bump'); }
    $('#checkout').disabled = !count;

    // ---- View Cart bar: appears the moment there's at least one item ----
    const bar = $('#viewCartBar'), fabGroup = $('#fabGroup');
    if (count){
      $('#vcbCount').textContent = count;
      $('#vcbTotal').textContent = '₹' + total;
      bar.classList.add('show');
      fabGroup.classList.add('lift');
    } else {
      bar.classList.remove('show');
      fabGroup.classList.remove('lift');
    }
  }

  let toastTimer;
  function showToast(msg){
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
  }

  searchEl.addEventListener('input', () => {
    const q = searchEl.value.trim().toLowerCase();
    $('#searchClear').classList.toggle('show', !!q);
    let anyVisible = false;
    document.querySelectorAll('.section').forEach(section => {
      let has = false;
      section.querySelectorAll('.item').forEach(el => {
        const match = !q || el.dataset.name.includes(q);
        el.style.display = match ? '' : 'none';
        if (match) has = true;
      });
      section.style.display = has ? '' : 'none';
      if (has) anyVisible = true;
    });
    $('#emptyState').style.display = anyVisible || !q ? 'none' : 'block';
    $('#emptyQuery').textContent = searchEl.value.trim();
    catsEl.style.display = q ? 'none' : 'flex';
  });
  $('#searchClear').onclick = () => { searchEl.value=''; searchEl.dispatchEvent(new Event('input')); searchEl.focus(); };

  const catButtons = [...catsEl.querySelectorAll('.cat')];
  const sections = present.map(c => document.getElementById('s-'+c));
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting){ const id = en.target.id.replace('s-',''); catButtons.forEach(b => b.classList.toggle('active', b.dataset.cat === id)); } });
  }, {rootMargin:'-160px 0px -70% 0px'});
  sections.forEach(s => io.observe(s));

  const cartEl = $('#cart'), scrim = $('#scrim');
  function openCart(){ cartEl.classList.add('open'); scrim.classList.add('show'); }
  function closeCartFn(){ cartEl.classList.remove('open'); scrim.classList.remove('show'); }
  $('#cartBtn').onclick = openCart;
  $('#vcbBtn').onclick = openCart;
  $('#closeCart').onclick = closeCartFn;
  scrim.onclick = () => { closeCartFn(); $('#checkoutModal').close(); };

  const modal = $('#checkoutModal');
  let orderMode = 'delivery';
  $('#orderToggle').addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b) return;
    orderMode = b.dataset.mode;
    [...$('#orderToggle').children].forEach(x => x.classList.toggle('active', x===b));
    const addrField = $('#addressField'), addrInput = $('#addressInput');
    if (orderMode === 'delivery'){ addrField.classList.remove('field-hidden'); addrInput.required = true; }
    else { addrField.classList.add('field-hidden'); addrInput.required = false; }
  });
  $('#checkout').onclick = () => { if (Object.keys(cart).length){ scrim.classList.add('show'); modal.showModal(); } };
  $('#closeModal').onclick = () => { modal.close(); scrim.classList.remove('show'); };
  modal.addEventListener('close', () => scrim.classList.remove('show'));

  $('#gps').onclick = () => {
    if (!navigator.geolocation){ $('#gpsmsg').textContent = 'Location is not supported by this browser.'; return; }
    $('#gpsmsg').textContent = 'Getting your location…';
    navigator.geolocation.getCurrentPosition(
      pos => { $('#lat').value = pos.coords.latitude; $('#lng').value = pos.coords.longitude; $('#gpsmsg').textContent = '✓ Location captured successfully.'; },
      () => { $('#gpsmsg').textContent = 'Location permission denied — you can enter the address manually.'; },
      {enableHighAccuracy:true, timeout:10000, maximumAge:0}
    );
  };

  $('#form').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const items = Object.entries(cart).map(([id,qty]) => ({...P.find(x=>x.id==id), qty}));
    const total = items.reduce((s,x)=>s+x.price*x.qty,0);
    const orderNo = 'SC' + Date.now().toString().slice(-7);
    const lat = f.get('lat'), lng = f.get('lng');
    let locationText = 'Not shared';
    if (lat && lng) locationText = `https://www.google.com/maps?q=${encodeURIComponent(lat+','+lng)}`;
    const modeLabel = {delivery:'Home Delivery', takeaway:'Takeaway', dinein:'Dine-in'}[orderMode];

    let message = `🍽️ *NEW ORDER — SAVOR CAFE'*\n\n`;
    message += `*Order:* ${orderNo}\n*Type:* ${modeLabel}\n*Customer:* ${f.get('name')}\n*Phone:* ${f.get('phone')}\n`;
    if (orderMode === 'delivery'){ message += `*Address:* ${f.get('address')}\n*Live Location:* ${locationText}\n`; }
    message += `\n*ITEMS*\n`;
    items.forEach(x => { message += `• ${x.name} × ${x.qty} — ₹${x.price*x.qty}\n`; });
    message += `\n*TOTAL: ₹${total}*\n`;
    if (f.get('notes')) message += `\n*Note:* ${f.get('notes')}\n`;
    message += `\nPlease confirm the order.`;

    const waUrl = `https://wa.me/918981315889?text=${encodeURIComponent(message)}`;
    Object.keys(cart).forEach(k => delete cart[k]);
    renderCart();
    items.forEach(it => rebuildAllCopies(it.name));
    modal.close(); closeCartFn();
    e.target.reset(); $('#gpsmsg').textContent = '';
    window.open(waUrl, '_blank');
  });

  // ---- contact form -> whatsapp ----
  $('#contactForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(e.target);
    let msg = `📩 *Message from website*\n\n*Name:* ${f.get('cname')}\n`;
    if (f.get('cphone')) msg += `*Phone:* ${f.get('cphone')}\n`;
    msg += `\n${f.get('cmsg')}`;
    window.open(`https://wa.me/918981315889?text=${encodeURIComponent(msg)}`, '_blank');
    e.target.reset();
  });

  renderCart();
})();
