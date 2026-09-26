(() => {
"use strict";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const products = (window.MENU_PRODUCTS || []).map(p => ({
  ...p,
  veg: !/(chicken|mutton|fish|egg|katla|rui|prawn|meat)/i.test(p.name)
}));

const categories = {
  starters: ["🍢", "Starters"],
  tandoor: ["🔥", "Tandoor"],
  noodles: ["🍜", "Noodles"],
  chinese: ["🥢", "Chinese"],
  soup: ["🥣", "Soups"],
  seafood: ["🐟", "Seafood"],
  combo: ["🍛", "Combos"],
  veg: ["🥦", "Vegetarian"],
  roti: ["🫓", "Breads"],
  biryani: ["🍚", "Biryani"],
  rice: ["🍚", "Rice & Mains"],
  salad: ["🥗", "Salads & Drinks"]
};

const order = [
  "starters",
  "tandoor",
  "noodles",
  "chinese",
  "soup",
  "seafood",
  "combo",
  "veg",
  "roti",
  "biryani",
  "rice",
  "salad"
];

const popular = [30, 86, 24, 43, 20, 52, 88, 41, 84, 44];

const KEY = "savor_cafe_cart_v2";

let cart = JSON.parse(localStorage.getItem(KEY) || "{}");
let activeCategory = "all";
let currentMode = "delivery";

const money = n =>
  `₹${Number(n).toLocaleString("en-IN")}`;

const esc = s =>
  String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));

const save = () =>
  localStorage.setItem(KEY, JSON.stringify(cart));

const count = () =>
  Object.values(cart).reduce((a, b) => a + b, 0);

const total = () =>
  Object.entries(cart).reduce(
    (s, [id, q]) =>
      s + (products.find(p => p.id == id)?.price || 0) * q,
    0
  );


/* =========================================================
   ORDER NUMBER / DATE / TIME
   Format: DDMMYYYYHHMMSS
   Example: 27092026034218
========================================================= */

function generateOrderDetails() {

  const now = new Date();

  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = String(now.getFullYear());

  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  const orderNumber =
    `${dd}${mm}${yyyy}${hh}${min}${ss}`;

  const orderDate =
    `${dd}/${mm}/${yyyy}`;

  const orderTime =
    now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });

  return {
    orderNumber,
    orderDate,
    orderTime
  };
}


/* =========================================================
   CART
========================================================= */

function stepper(id) {
  return `
    <div class="stepper">
      <button type="button" data-minus="${id}">−</button>
      <b>${cart[id] || 0}</b>
      <button type="button" data-plus="${id}">+</button>
    </div>
  `;
}

function add(id) {

  cart[id] = (cart[id] || 0) + 1;

  save();
  renderAll();

  toast(
    `${products.find(p => p.id === id)?.name || "Item"} added to cart ✓`
  );
}

function change(id, d) {

  cart[id] = Math.max(
    0,
    (cart[id] || 0) + d
  );

  if (!cart[id]) {
    delete cart[id];
  }

  save();
  renderAll();
}

function toast(t) {

  const e = $("#toast");

  if (!e) return;

  e.textContent = t;
  e.classList.add("show");

  clearTimeout(window.tt);

  window.tt = setTimeout(
    () => e.classList.remove("show"),
    1800
  );
}


/* =========================================================
   NAVIGATION / FLOATING CART
========================================================= */

function renderNav() {

  const n = count();
  const t = total();

  ["#cartCount", "#navCartCount"].forEach(s => {

    if ($(s)) {
      $(s).textContent = n;
    }

  });

  const bar = $("#viewCartBar");

  if (bar) {

    const hideHere =
      document.body.classList.contains("cart-page") ||
      document.body.classList.contains("checkout-page");

    bar.hidden = hideHere || n === 0;

    bar.classList.toggle(
      "show",
      !hideHere && n > 0
    );

    if ($("#floatingCartCount")) {
      $("#floatingCartCount").textContent =
        `${n} ${n === 1 ? "item" : "items"}`;
    }

    if ($("#floatingCartTotal")) {
      $("#floatingCartTotal").textContent =
        money(t);
    }
  }
}


/* =========================================================
   HOME
========================================================= */

function renderHome() {

  const c = $("#homeCats");

  if (c) {

    c.innerHTML = order.map(k => `
      <a
        class="category-card"
        href="/menu.html?category=${k}"
      >
        <span class="emoji">${categories[k][0]}</span>

        <h3>${categories[k][1]}</h3>

        <p>
          ${products.filter(
            p => p.category === k
          ).length} dishes
        </p>
      </a>
    `).join("");
  }

  const p = $("#homePopular");

  if (p) {

    p.innerHTML = popular.map(id => {

      let x = products.find(a => a.id === id);

      return x
        ? `
          <article class="popular-card">

            <div class="food-art">
              ${emoji(x)}
            </div>

            <h3>
              ${esc(x.name)}
            </h3>

            <div class="pc-bottom">

              <strong>
                ${money(x.price)}
              </strong>

              <button
                class="mini-add"
                data-add="${x.id}"
              >
                + Add
              </button>

            </div>

          </article>
        `
        : "";

    }).join("");
  }
}


/* =========================================================
   FOOD EMOJI
========================================================= */

function emoji(p) {

  if (!p) return "🍽️";

  if (
    /biryani|rice|khichuri|pulao/i.test(p.name)
  ) return "🍚";

  if (
    /noodle|manchurian|chilli|fried rice/i.test(p.name)
  ) return "🍜";

  if (
    /fish|katla|rui|prawn/i.test(p.name)
  ) return "🐟";

  if (
    /paneer|veg|dal|aloo|mushroom|broccoli|rajma|roti|naan|paratha/i.test(p.name)
  ) return "🥘";

  return "🍗";
}


/* =========================================================
   MENU
========================================================= */

function renderMenu() {

  const mount = $("#menuMount");

  if (!mount) return;

  const q =
    ($("#search")?.value || "")
      .trim()
      .toLowerCase();

  const groups =
    activeCategory === "all"
      ? order
      : [activeCategory];

  let html = "";
  let seen = 0;

  groups.forEach(k => {

    let list = products.filter(
      p =>
        p.category === k &&
        (!q ||
          p.name
            .toLowerCase()
            .includes(q))
    );

    if (!list.length) return;

    seen += list.length;

    html += `
      <section
        class="menu-section"
        id="cat-${k}"
      >

        <h2>
          ${categories[k][0]}
          ${categories[k][1]}
          <span>
            ${list.length} dishes
          </span>
        </h2>

        <div class="menu-grid">

          ${list.map(p => `

            <article class="menu-item">

              <div class="item-info">

                <i
                  class="food-dot ${p.veg ? "" : "nonveg"}"
                ></i>

                <div>

                  <div class="item-name">
                    ${esc(p.name)}
                  </div>

                  <div class="item-price">
                    ${money(p.price)}
                  </div>

                </div>

              </div>

              ${
                cart[p.id]
                  ? stepper(p.id)
                  : `
                    <button
                      class="add-button"
                      data-add="${p.id}"
                    >
                      + Add
                    </button>
                  `
              }

            </article>

          `).join("")}

        </div>

      </section>
    `;
  });

  mount.innerHTML = html;

  if ($("#emptyState")) {
    $("#emptyState").hidden =
      seen !== 0;
  }
}


/* =========================================================
   CATEGORY TABS
========================================================= */

function renderTabs() {

  let e = $("#cats");

  if (!e) return;

  e.innerHTML = `
    <button
      class="category-tab ${activeCategory === "all" ? "active" : ""}"
      data-cat="all"
    >
      All
    </button>

    ${order.map(k => `
      <button
        class="category-tab ${activeCategory === k ? "active" : ""}"
        data-cat="${k}"
      >
        ${categories[k][0]}
        ${categories[k][1]}
      </button>
    `).join("")}
  `;
}


/* =========================================================
   CART PAGE
========================================================= */

function renderCartPage() {

  let box = $("#cartPageItems");

  if (!box) return;

  let ids =
    Object.keys(cart).map(Number);

  box.innerHTML = ids.length
    ? ids.map(id => {

        let p =
          products.find(x => x.id === id);

        return p
          ? `
            <div class="cart-page-line">

              <div>

                <b>
                  ${esc(p.name)}
                </b>

                <small>
                  ${money(p.price)} each
                </small>

              </div>

              <div>

                <strong>
                  ${money(
                    p.price *
                    (cart[id] || 0)
                  )}
                </strong>

                ${stepper(id)}

                <button
                  class="remove"
                  data-remove="${id}"
                >
                  Remove
                </button>

              </div>

            </div>
          `
          : "";

      }).join("")

    : `
      <div class="cart-empty">

        <div>🛒</div>

        <h2>
          Your cart is empty
        </h2>

        <p>
          Add some dishes first.
        </p>

        <a
          class="btn primary"
          href="/menu.html"
        >
          Browse menu →
        </a>

      </div>
    `;

  if ($("#cartPageTotal")) {
    $("#cartPageTotal").textContent =
      money(total());
  }

  if ($("#checkoutBtn")) {
    $("#checkoutBtn").classList.toggle(
      "disabled",
      !ids.length
    );
  }
}


/* =========================================================
   CHECKOUT SUMMARY
========================================================= */

function renderCheckout() {

  let box = $("#checkoutItems");

  if (!box) return;

  let ids =
    Object.keys(cart).map(Number);

  if (!ids.length) {

    box.innerHTML = `
      <div class="checkout-empty">

        Your cart is empty.

        <br>

        <a href="/menu.html">
          Browse menu →
        </a>

      </div>
    `;

    if ($("#checkoutTotal")) {
      $("#checkoutTotal").textContent =
        "₹0";
    }

    $("#checkoutForm")
      ?.querySelector(
        'button[type="submit"]'
      )
      ?.setAttribute(
        "disabled",
        ""
      );

    return;
  }

  box.innerHTML = ids.map(id => {

    let p =
      products.find(x => x.id === id);

    return p
      ? `
        <div class="summary-line">

          <span>
            ${esc(p.name)}
            <b>× ${cart[id]}</b>
          </span>

          <strong>
            ${money(
              p.price * cart[id]
            )}
          </strong>

        </div>
      `
      : "";

  }).join("");

  if ($("#checkoutTotal")) {
    $("#checkoutTotal").textContent =
      money(total());
  }
}


/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {

  renderNav();
  renderHome();
  renderTabs();
  renderMenu();
  renderCartPage();
  renderCheckout();
}


/* =========================================================
   OPEN / CLOSED STATUS
========================================================= */

function status() {

  let m =
    new Date().getHours() * 60 +
    new Date().getMinutes();

  let o =
    m >= 660 &&
    m < 1380;

  if ($("#statusText")) {
    $("#statusText").textContent =
      o
        ? "Open now"
        : "Closed · Opens 11 AM";
  }

  if ($("#statusDot")) {
    $("#statusDot").classList.toggle(
      "closed",
      !o
    );
  }
}


/* =========================================================
   WHATSAPP ORDER
========================================================= */

function checkoutUrl(fd) {

  /*
    Generate ALL order details from ONE timestamp.

    Example:
    Order Number: 27092026034218
  */

  const orderDetails =
    generateOrderDetails();

  const items =
    Object.entries(cart)
      .map(([id, q]) => {

        let p =
          products.find(
            x => x.id == id
          );

        return p
          ? `• ${p.name} × ${q} = ${money(p.price * q)}`
          : "";

      })
      .filter(Boolean)
      .join("\n");

  const mode =
    currentMode === "delivery"
      ? "Delivery"
      : currentMode === "takeaway"
        ? "Takeaway"
        : "Dine-in";


  let text =
`*SAVOR CAFE' — NEW ORDER*

*Order Number:* ${orderDetails.orderNumber}
*Order Date:* ${orderDetails.orderDate}
*Order Time:* ${orderDetails.orderTime}

*Order type:* ${mode}
*Name:* ${fd.get("name")}
*Phone:* ${fd.get("phone")}
`;


  if (currentMode === "delivery") {

    text +=
`*Manual Address:* ${fd.get("address")}
`;

    if (fd.get("gpsLocation")) {

      text +=
`*GPS Location:* ${fd.get("gpsLocation")}
`;
    }
  }


  text +=
`
*Items:*
${items}

*Total:* ${money(total())}`;


  if (fd.get("notes")) {

    text +=
`\n*Notes:* ${fd.get("notes")}`;
  }


  return (
    `https://wa.me/918981315889?text=` +
    encodeURIComponent(text)
  );
}


/* =========================================================
   THEME
========================================================= */

function themeInit() {

  let saved =
    localStorage.getItem(
      "savor_theme"
    ) || "dark";

  document.documentElement.dataset.theme =
    saved;

  let b =
    $("#themeToggle");

  if (b) {

    b.textContent =
      saved === "dark"
        ? "☀️"
        : "🌙";

    b.title =
      saved === "dark"
        ? "Switch to light mode"
        : "Switch to dark mode";

    b.setAttribute(
      "aria-label",
      b.title
    );
  }
}


/* =========================================================
   MAIN SETUP
========================================================= */

function setup() {

  themeInit();


  /* =========================
     MOBILE NAVBAR
  ========================= */

  const toggle =
    $("#navToggle");

  const links =
    $("#navLinks");

  const scrim =
    $("#navScrim");


  function close() {

    links?.classList.remove("open");

    scrim?.classList.remove("show");

    toggle?.setAttribute(
      "aria-expanded",
      "false"
    );

    if (toggle) {
      toggle.textContent = "☰";
    }

    document.body.classList.remove(
      "nav-lock"
    );
  }


  function open() {

    links?.classList.add("open");

    scrim?.classList.add("show");

    toggle?.setAttribute(
      "aria-expanded",
      "true"
    );

    if (toggle) {
      toggle.textContent = "✕";
    }

    document.body.classList.add(
      "nav-lock"
    );
  }


  toggle?.addEventListener(
    "click",
    () =>
      links?.classList.contains("open")
        ? close()
        : open()
  );


  scrim?.addEventListener(
    "click",
    close
  );


  links
    ?.querySelectorAll("a")
    .forEach(a =>
      a.addEventListener(
        "click",
        close
      )
    );


  /* =========================
     ACTIVE NAV PAGE
  ========================= */

  let page =
    location.pathname
      .split("/")
      .pop()
      .replace(".html", "") ||
    "index";

  page =
    page === "index"
      ? "home"
      : page;

  $$(".nav-links a")
    .forEach(a =>
      a.classList.toggle(
        "active",
        a.dataset.page === page
      )
    );


  /* =========================
     STATUS
  ========================= */

  if ($("#statusText")) {
    status();
  }

  setInterval(
    status,
    60000
  );


  /* =========================
     URL CATEGORY
  ========================= */

  const params =
    new URLSearchParams(
      location.search
    );

  if (params.get("category")) {
    activeCategory =
      params.get("category");
  }


  renderAll();


  /* =========================
     THEME TOGGLE
  ========================= */

  $("#themeToggle")
    ?.addEventListener(
      "click",
      () => {

        let next =
          document.documentElement.dataset.theme === "dark"
            ? "light"
            : "dark";

        document.documentElement.dataset.theme =
          next;

        localStorage.setItem(
          "savor_theme",
          next
        );

        let b =
          $("#themeToggle");

        if (b) {

          b.textContent =
            next === "dark"
              ? "☀️"
              : "🌙";

          b.title =
            next === "dark"
              ? "Switch to light mode"
              : "Switch to dark mode";

          b.setAttribute(
            "aria-label",
            b.title
          );
        }
      }
    );


  /* =========================
     GLOBAL CLICK HANDLERS
  ========================= */

  document.addEventListener(
    "click",
    e => {

      let a =
        e.target.closest(
          "[data-add]"
        );

      let pl =
        e.target.closest(
          "[data-plus]"
        );

      let mi =
        e.target.closest(
          "[data-minus]"
        );

      let rm =
        e.target.closest(
          "[data-remove]"
        );

      let cat =
        e.target.closest(
          "[data-cat]"
        );


      if (a) {

        add(
          +a.dataset.add
        );

      } else if (pl) {

        change(
          +pl.dataset.plus,
          1
        );

      } else if (mi) {

        change(
          +mi.dataset.minus,
          -1
        );

      } else if (rm) {

        delete cart[
          rm.dataset.remove
        ];

        save();
        renderAll();

      } else if (cat) {

        activeCategory =
          cat.dataset.cat;

        renderTabs();
        renderMenu();
      }
    }
  );


  /* =========================
     SEARCH
  ========================= */

  $("#search")
    ?.addEventListener(
      "input",
      () => {

        if ($("#searchClear")) {

          $("#searchClear").classList.toggle(
            "show",
            !!$("#search").value
          );
        }

        renderMenu();
      }
    );


  $("#searchClear")
    ?.addEventListener(
      "click",
      () => {

        $("#search").value = "";

        $("#searchClear")
          .classList.remove(
            "show"
          );

        renderMenu();
      }
    );


  /* =========================
     ORDER MODE
  ========================= */

  $$("#orderMode button")
    .forEach(b => {

      b.addEventListener(
        "click",
        () => {

          $$("#orderMode button")
            .forEach(x =>
              x.classList.remove(
                "active"
              )
            );

          b.classList.add(
            "active"
          );

          currentMode =
            b.dataset.mode;

          if ($("#addressWrap")) {

            $("#addressWrap").style.display =
              currentMode === "delivery"
                ? ""
                : "none";
          }
        }
      );
    });


  /* =========================
     MANUAL ADDRESS
  ========================= */

  $("#manualAddressBtn")
    ?.addEventListener(
      "click",
      () => {

        const a =
          $('textarea[name="address"]');

        $("#manualAddressBtn")
          ?.classList.add("active");

        $("#gpsBtn")
          ?.classList.remove("active");

        if (a) {

          a.hidden = false;
          a.focus();
        }

        if ($("#gpsMsg")) {

          $("#gpsMsg").textContent =
            "Please enter your complete manual address below.";
        }
      }
    );


  /* =========================
     GPS LOCATION
  ========================= */

  $("#gpsBtn")
    ?.addEventListener(
      "click",
      () => {

        const msg =
          $("#gpsMsg");

        if (!navigator.geolocation) {

          if (msg) {

            msg.textContent =
              "Live location is not supported by this browser.";
          }

          return;
        }


        $("#gpsBtn")
          ?.classList.add(
            "active"
          );

        $("#manualAddressBtn")
          ?.classList.remove(
            "active"
          );


        if (msg) {

          msg.textContent =
            "Getting your live location…";
        }


        navigator.geolocation.getCurrentPosition(

          p => {

            const lat =
              p.coords.latitude.toFixed(6);

            const lng =
              p.coords.longitude.toFixed(6);

            const map =
              `https://www.google.com/maps?q=${lat},${lng}`;


            const gps =
              $("#gpsLocation");

            if (gps) {

              gps.value = map;

              gps.hidden = false;
            }


            if (msg) {

              msg.textContent =
                `Live location captured: ${lat}, ${lng}. Manual address is still required.`;
            }
          },


          err => {

            if (!msg) return;

            msg.textContent =
              err.code === 1
                ? "Location permission denied. Please allow location access."
                : "Could not get live location. Please try again.";
          },


          {
            enableHighAccuracy: true,
            timeout: 12000,
            maximumAge: 0
          }
        );
      }
    );


  /* =========================
     CHECKOUT FORM
  ========================= */

  $("#checkoutForm")
    ?.addEventListener(
      "submit",
      e => {

        e.preventDefault();


        if (!count()) {

          return toast(
            "Your cart is empty"
          );
        }


        const form =
          e.currentTarget;


        const address =
          form.querySelector(
            "[name=address]"
          );


        /*
          MANUAL ADDRESS IS ALWAYS REQUIRED
          FOR DELIVERY.
        */

        if (
          currentMode === "delivery" &&
          address &&
          !address.value.trim()
        ) {

          address.setCustomValidity(
            "Please enter your complete manual delivery address."
          );

          address.reportValidity();

          address.focus();

          return;
        }


        if (address) {

          address.setCustomValidity("");
        }


        /*
          Order number/date/time are
          automatically generated here.
        */

        const orderDetails =
          generateOrderDetails();


        /*
          Store latest order details locally.
          This does NOT ask the user for anything.
        */

        localStorage.setItem(
          "savor_last_order",
          JSON.stringify({
            orderNumber:
              orderDetails.orderNumber,

            orderDate:
              orderDetails.orderDate,

            orderTime:
              orderDetails.orderTime
          })
        );


        /*
          Generate WhatsApp URL.
        */

        const whatsappUrl =
          checkoutUrl(
            new FormData(form)
          );


        /*
          Open WhatsApp directly.
        */

        window.location.href =
          whatsappUrl;
      }
    );


  /* =========================
     CONTACT FORM
  ========================= */

  $("#contactForm")
    ?.addEventListener(
      "submit",
      e => {

        e.preventDefault();

        let f =
          new FormData(
            e.currentTarget
          );

        window.open(
          `https://wa.me/918981315889?text=${
            encodeURIComponent(
`Hello Savor Cafe'!

Name: ${f.get("name")}
Phone: ${f.get("phone") || "Not provided"}
Message: ${f.get("message")}`
            )
          }`,
          "_blank"
        );
      }
    );


  /* =========================
     STARTUP LOGO ANIMATION
  ========================= */

  const pl =
    $("#preloader");

  if (pl) {

    if (
      sessionStorage.getItem(
        "savor_intro_seen"
      )
    ) {

      pl.classList.add(
        "hide"
      );

    } else {

      sessionStorage.setItem(
        "savor_intro_seen",
        "1"
      );

      setTimeout(
        () =>
          pl.classList.add(
            "hide"
          ),
        1900
      );
    }
  }
}


/* =========================================================
   GALLERY
========================================================= */

function initGallery() {

  const slides =
    $$(".gallery-slide");

  const dots =
    $("#galleryDots");

  if (!slides.length) return;

  let i = 0;
  let t;


  slides.forEach(
    (_, n) => {

      if (dots) {

        let b =
          document.createElement(
            "button"
          );

        b.type = "button";

        b.setAttribute(
          "aria-label",
          `Photo ${n + 1}`
        );

        b.addEventListener(
          "click",
          () => go(n)
        );

        dots.appendChild(b);
      }
    }
  );


  function go(n) {

    i =
      (n + slides.length) %
      slides.length;

    slides.forEach(
      (x, k) =>
        x.classList.toggle(
          "active",
          k === i
        )
    );

    $$("#galleryDots button")
      .forEach(
        (b, k) =>
          b.classList.toggle(
            "active",
            k === i
          )
      );
  }


  $("#galleryPrev")
    ?.addEventListener(
      "click",
      () => go(i - 1)
    );


  $("#galleryNext")
    ?.addEventListener(
      "click",
      () => go(i + 1)
    );


  go(0);


  t = setInterval(
    () => go(i + 1),
    4200
  );


  $("#gallerySlider")
    ?.addEventListener(
      "mouseenter",
      () => clearInterval(t)
    );


  $("#gallerySlider")
    ?.addEventListener(
      "mouseleave",
      () =>
        t = setInterval(
          () => go(i + 1),
          4200
        )
    );
}


/* =========================================================
   REVIEWS
========================================================= */

function initReviews() {

  const track =
    $("#reviewTrack");

  if (!track) return;

  const data = [

    {
      source: "Google snapshot",
      rating: "4.8",
      count: "46 ratings",
      text:
        "A strong public rating snapshot for Savor Cafe on the Google listing."
    },

    {
      source: "Zomato snapshot",
      rating: "4.3",
      count: "11 dining ratings",
      text:
        "Zomato currently shows a 4.3 dining rating for the New Town outlet."
    },

    {
      source: "Justdial snapshot",
      rating: "4.7",
      count: "49 ratings",
      text:
        "Justdial currently shows a 4.7 rating snapshot for the outlet."
    }

  ];


  let i = 0;


  track.innerHTML =
    data.map(
      (r, k) => `

        <article
          class="review-card ${
            k === 0
              ? "active"
              : ""
          }"
        >

          <div class="review-stars">
            ★★★★★
          </div>

          <div class="review-rating">

            ${r.rating}

            <small>
              / 5
            </small>

          </div>

          <p>
            ${r.text}
          </p>

          <b>
            ${r.source}
          </b>

          <span>
            ${r.count}
          </span>

        </article>

      `
    ).join("");


  const cards =
    $$(".review-card");

  const dots =
    $("#reviewDots");


  data.forEach(
    (_, k) => {

      let b =
        document.createElement(
          "button"
        );

      b.type = "button";

      b.addEventListener(
        "click",
        () => go(k)
      );

      dots?.appendChild(b);
    }
  );


  function go(n) {

    i =
      (n + data.length) %
      data.length;

    cards.forEach(
      (c, k) =>
        c.classList.toggle(
          "active",
          k === i
        )
    );

    $$("#reviewDots button")
      .forEach(
        (b, k) =>
          b.classList.toggle(
            "active",
            k === i
          )
      );
  }


  go(0);


  setInterval(
    () => go(i + 1),
    4000
  );
}


/* =========================================================
   START APPLICATION
========================================================= */

const oldSetup = setup;

const wrappedSetup = () => {

  oldSetup();

  initGallery();

  initReviews();
};


document.removeEventListener(
  "DOMContentLoaded",
  setup
);

document.addEventListener(
  "DOMContentLoaded",
  wrappedSetup
);

})();