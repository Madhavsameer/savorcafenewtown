const CATEGORY_LABELS = {
  starters:"Starters (6 pcs)",
  tandoor:"Tandoor (6 pcs)",
  noodles:"Noodles",
  chinese:"Chinese",
  soup:"Soups",
  seafood:"Seafood",
  salad:"Salads & Drinks",
  combo:"Indian Combos",
  veg:"Vegetarian Mains",
  roti:"Tawa Roti & Breads",
  biryani:"Biryani & Khichuri",
  rice:"Rice & Mains"
};

const CATEGORY_ICONS = {
  starters:"🍢",
  tandoor:"🔥",
  noodles:"🍜",
  chinese:"🥢",
  soup:"🥣",
  seafood:"🐟",
  salad:"🥗",
  combo:"🍛",
  veg:"🥦",
  roti:"🫓",
  biryani:"🍚",
  rice:"🍚"
};

const CATEGORY_ORDER = [
  "starters",
  "tandoor",
  "noodles",
  "chinese",
  "soup",
  "seafood",
  "veg",
  "combo",
  "biryani",
  "rice",
  "roti",
  "salad"
];

const NONVEG_WORDS = [
  "chicken",
  "mutton",
  "fish",
  "egg",
  "katla",
  "rui",
  "prawn",
  "meat"
];

(function(){

  const P = window.MENU_PRODUCTS || [];

  const $ = selector => document.querySelector(selector);

  /* =====================================================
     PRODUCT CLASSIFICATION
     ===================================================== */

  const isVeg = product =>
    !NONVEG_WORDS.some(word =>
      product.name.toLowerCase().includes(word)
    );

  P.forEach(product => {
    product.veg = isVeg(product);
  });

  /* =====================================================
     CART
     ===================================================== */

  const cart = {};

  /* =====================================================
     PRELOADER
     ===================================================== */

  requestAnimationFrame(() => {
    setTimeout(() => {
      $("#preloader")?.classList.add("hide");
    }, 650);
  });

  /* =====================================================
     NAVBAR HEIGHT
     ===================================================== */

  function setNavHeight(){

    const navbar = document.querySelector(".navbar");

    if(!navbar) return;

    document.documentElement.style.setProperty(
      "--navh",
      `${navbar.getBoundingClientRect().height}px`
    );
  }

  setNavHeight();

  window.addEventListener("resize", setNavHeight);

  window.addEventListener(
    "orientationchange",
    () => setTimeout(setNavHeight, 250)
  );

  /* =====================================================
     RESTAURANT STATUS
     ===================================================== */

  function updateStatus(){

    const dot = $("#statusDot");
    const text = $("#statusText");

    if(!dot || !text) return;

    const hour = new Date().getHours();

    const open = hour >= 11 && hour < 23;

    dot.classList.toggle("closed", !open);

    text.textContent = open
      ? "Open now"
      : "Closed — opens 11:00 AM";
  }

  updateStatus();

  setInterval(updateStatus, 60000);

  /* =====================================================
     MOBILE NAVIGATION
     ===================================================== */

  const navLinks = $("#navLinks");
  const navScrim = $("#navScrim");
  const navToggle = $("#navToggle");

  function closeNav(){

    navLinks?.classList.remove("open");
    navScrim?.classList.remove("show");

    navToggle?.setAttribute(
      "aria-expanded",
      "false"
    );

    navToggle?.setAttribute(
      "aria-label",
      "Open menu"
    );

    if(navToggle){
      navToggle.textContent = "☰";
    }

    document.body.classList.remove("nav-open");

    setNavHeight();
  }

  function openNav(){

    navLinks?.classList.add("open");
    navScrim?.classList.add("show");

    navToggle?.setAttribute(
      "aria-expanded",
      "true"
    );

    navToggle?.setAttribute(
      "aria-label",
      "Close menu"
    );

    if(navToggle){
      navToggle.textContent = "✕";
    }

    document.body.classList.add("nav-open");

    setNavHeight();
  }

  navToggle?.addEventListener("click", () => {

    if(navLinks?.classList.contains("open")){
      closeNav();
    }else{
      openNav();
    }

  });

  navScrim?.addEventListener("click", closeNav);

  /* =====================================================
     ROUTING
     ===================================================== */

  const pages = [
    ...document.querySelectorAll(".page")
  ];

  const VALID_PAGES = [
    "home",
    "menu",
    "about",
    "contact"
  ];

  function goTo(name){

    if(!VALID_PAGES.includes(name)){
      name = "home";
    }

    pages.forEach(page => {

      page.classList.toggle(
        "active",
        page.dataset.page === name
      );

    });

    document
      .querySelectorAll("[data-nav]")
      .forEach(link => {

        if(link.closest(".nav-links")){

          link.classList.toggle(
            "active",
            link.dataset.nav === name
          );

        }

      });

    closeNav();

    window.scrollTo({
      top:0,
      behavior:"instant"
    });

    setTimeout(setNavHeight,50);

    if(location.hash.slice(1) !== name){

      history.replaceState(
        null,
        "",
        "#" + name
      );

    }
  }

  document
    .querySelectorAll("[data-nav]")
    .forEach(link => {

      link.addEventListener("click", event => {

        event.preventDefault();

        goTo(link.dataset.nav);

      });

    });

  window.addEventListener("hashchange", () => {

    const page =
      location.hash.slice(1) || "home";

    goTo(page);

  });

  goTo(
    location.hash.slice(1) || "home"
  );

  /* =====================================================
     CATEGORIES
     ===================================================== */

  const presentCategories =
    CATEGORY_ORDER.filter(category =>
      P.some(product =>
        product.category === category
      )
    );

  /* =====================================================
     HOME CATEGORY CARDS
     ===================================================== */

  const homeCats = $("#homeCats");

  if(homeCats){

    presentCategories.forEach(category => {

      const card =
        document.createElement("button");

      card.type = "button";

      card.className = "cat-card";

      const count =
        P.filter(
          product =>
            product.category === category
        ).length;

      card.innerHTML = `
        <span class="ic">
          ${CATEGORY_ICONS[category] || "🍴"}
        </span>

        <h4>
          ${CATEGORY_LABELS[category]}
        </h4>

        <span>
          ${count} dishes
        </span>
      `;

      card.addEventListener("click", () => {

        goTo("menu");

        setTimeout(() => {

          document
            .getElementById("s-" + category)
            ?.scrollIntoView({
              behavior:"smooth",
              block:"start"
            });

        },80);

      });

      homeCats.appendChild(card);

    });

  }

  /* =====================================================
     MENU ELEMENTS
     ===================================================== */

  const catsEl = $("#cats");
  const menuEl = $("#menu");
  const searchEl = $("#search");

  /* =====================================================
     MENU CATEGORY BUTTONS
     ===================================================== */

  if(catsEl){

    presentCategories.forEach(category => {

      const button =
        document.createElement("button");

      button.type = "button";

      button.className = "cat";

      button.textContent =
        CATEGORY_LABELS[category] || category;

      button.dataset.cat = category;

      button.addEventListener("click", () => {

        document
          .getElementById("s-" + category)
          ?.scrollIntoView({
            behavior:"smooth",
            block:"start"
          });

      });

      catsEl.appendChild(button);

    });

  }

  /* =====================================================
     PRODUCT LOOKUP
     ===================================================== */

  const productByName = {};

  P.forEach(product => {

    productByName[
      product.name.toLowerCase()
    ] = product;

  });

  /* =====================================================
     PRODUCT CARD
     ===================================================== */

  function itemCard(product){

    const element =
      document.createElement("div");

    element.className = "item";

    element.dataset.name =
      product.name.toLowerCase();

    element.innerHTML = `
      <div class="item-info">

        <span
          class="dot ${product.veg ? "veg" : "nonveg"}"
          title="${product.veg ? "Veg" : "Non-veg"}"
          aria-label="${product.veg ? "Vegetarian" : "Non vegetarian"}"
        ></span>

        <div>
          <div class="item-name">
            ${product.name}
          </div>

          <div class="item-price">
            ₹${product.price}
          </div>
        </div>

      </div>

      <div class="qty-slot"></div>
    `;

    renderQtySlot(
      element.querySelector(".qty-slot"),
      product
    );

    return element;
  }

  /* =====================================================
     QUANTITY CONTROL
     ===================================================== */

  function renderQtySlot(slot, product){

    if(!slot) return;

    const quantity =
      cart[product.id] || 0;

    if(!quantity){

      slot.innerHTML = `
        <button
          type="button"
          class="add-btn"
          aria-label="Add ${product.name}"
        >
          Add
        </button>
      `;

      slot
        .querySelector(".add-btn")
        .addEventListener(
          "click",
          () => addToCart(product)
        );

      return;
    }

    slot.innerHTML = `
      <div class="stepper">

        <button
          type="button"
          data-d="-1"
          aria-label="Remove one ${product.name}"
        >
          −
        </button>

        <span class="n">
          ${quantity}
        </span>

        <button
          type="button"
          data-d="1"
          aria-label="Add one ${product.name}"
        >
          +
        </button>

      </div>
    `;

    slot
      .querySelectorAll(".stepper button")
      .forEach(button => {

        button.addEventListener(
          "click",
          () =>
            changeQty(
              product,
              Number(button.dataset.d)
            )
        );

      });

  }

  function rebuildAllCopies(name){

    const selector =
      `.item[data-name="${CSS.escape(
        name.toLowerCase()
      )}"]`;

    document
      .querySelectorAll(selector)
      .forEach(element => {

        const product =
          productByName[
            element.dataset.name
          ];

        if(product){

          renderQtySlot(
            element.querySelector(".qty-slot"),
            product
          );

        }

      });

  }

  /* =====================================================
     POPULAR DISHES
     ===================================================== */

  const POPULAR_IDS = [
    30,
    86,
    24,
    43,
    20,
    52,
    88,
    41,
    84,
    44
  ];

  const popularWrap =
    $("#homePopular");

  if(popularWrap){

    const grid =
      document.createElement("div");

    grid.className = "grid";

    POPULAR_IDS.forEach(id => {

      const product =
        P.find(item => item.id === id);

      if(product){

        grid.appendChild(
          itemCard(product)
        );

      }

    });

    popularWrap.appendChild(grid);

  }

  /* =====================================================
     FULL MENU
     ===================================================== */

  if(menuEl){

    presentCategories.forEach(category => {

      const section =
        document.createElement("section");

      section.className = "section";

      section.id =
        "s-" + category;

      const items =
        P.filter(
          product =>
            product.category === category
        );

      section.innerHTML = `
        <h3>
          ${CATEGORY_LABELS[category] || category}
          <small>
            ${items.length} dishes
          </small>
        </h3>
      `;

      const grid =
        document.createElement("div");

      grid.className = "grid";

      items.forEach(product => {

        grid.appendChild(
          itemCard(product)
        );

      });

      section.appendChild(grid);

      menuEl.appendChild(section);

    });

  }

  /* =====================================================
     ADD TO CART
     ===================================================== */

  function addToCart(product){

    cart[product.id] =
      (cart[product.id] || 0) + 1;

    renderCart();

    rebuildAllCopies(product.name);

    showToast(
      product.name + " added"
    );

  }

  /* =====================================================
     CHANGE QUANTITY
     ===================================================== */

  function changeQty(product, difference){

    cart[product.id] =
      (cart[product.id] || 0) + difference;

    if(cart[product.id] <= 0){

      delete cart[product.id];

    }

    renderCart();

    rebuildAllCopies(product.name);

  }

  /* =====================================================
     RENDER CART
     ===================================================== */

  function renderCart(){

    const box = $("#cartItems");

    if(!box) return;

    const entries =
      Object.entries(cart);

    let total = 0;
    let count = 0;

    if(!entries.length){

      box.innerHTML = `
        <div class="cart-empty">
          Your cart is empty.<br>
          Add a few dishes to get started.
        </div>
      `;

    }else{

      box.innerHTML = "";

      entries.forEach(
        ([id, quantity]) => {

          const product =
            P.find(item => item.id == id);

          if(!product) return;

          total +=
            product.price * quantity;

          count += quantity;

          const line =
            document.createElement("div");

          line.className = "line";

          line.innerHTML = `
            <div>

              <div class="li-name">
                ${product.name}
              </div>

              <div class="li-price">
                ₹${product.price}
                × ${quantity}
                = ₹${product.price * quantity}
              </div>

              <button
                type="button"
                class="remove"
              >
                Remove
              </button>

            </div>

            <div class="stepper">

              <button
                type="button"
                data-d="-1"
                aria-label="Remove one"
              >
                −
              </button>

              <span class="n">
                ${quantity}
              </span>

              <button
                type="button"
                data-d="1"
                aria-label="Add one"
              >
                +
              </button>

            </div>
          `;

          line
            .querySelector(".remove")
            .addEventListener(
              "click",
              () => {

                delete cart[product.id];

                renderCart();

                rebuildAllCopies(
                  product.name
                );

              }
            );

          line
            .querySelectorAll(
              ".stepper button"
            )
            .forEach(button => {

              button.addEventListener(
                "click",
                () =>
                  changeQty(
                    product,
                    Number(button.dataset.d)
                  )
              );

            });

          box.appendChild(line);

        }
      );

    }

    $("#total").textContent =
      "₹" + total;

    const countElement =
      $("#count");

    if(
      countElement &&
      Number(countElement.textContent) !== count
    ){

      countElement.textContent =
        count;

      countElement.classList.remove(
        "bump"
      );

      void countElement.offsetWidth;

      countElement.classList.add(
        "bump"
      );

    }

    $("#checkout").disabled =
      count === 0;

    /* Sticky mobile cart */

    const cartBar =
      $("#viewCartBar");

    const fabGroup =
      $("#fabGroup");

    if(count > 0){

      $("#vcbCount").textContent =
        count;

      $("#vcbTotal").textContent =
        "₹" + total;

      cartBar?.classList.add("show");

      fabGroup?.classList.add("lift");

    }else{

      cartBar?.classList.remove("show");

      fabGroup?.classList.remove("lift");

    }

  }

  /* =====================================================
     TOAST
     ===================================================== */

  let toastTimer;

  function showToast(message){

    const toast = $("#toast");

    if(!toast) return;

    toast.textContent =
      message;

    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer =
      setTimeout(
        () =>
          toast.classList.remove("show"),
        1800
      );

  }

  /* =====================================================
     SEARCH
     ===================================================== */

  if(searchEl){

    searchEl.addEventListener(
      "input",
      () => {

        const query =
          searchEl.value
            .trim()
            .toLowerCase();

        $("#searchClear")
          ?.classList
          .toggle(
            "show",
            Boolean(query)
          );

        let anythingVisible =
          false;

        document
          .querySelectorAll(".section")
          .forEach(section => {

            let sectionHasMatch =
              false;

            section
              .querySelectorAll(".item")
              .forEach(item => {

                const match =
                  !query ||
                  item.dataset.name
                    .includes(query);

                item.style.display =
                  match ? "" : "none";

                if(match){
                  sectionHasMatch = true;
                }

              });

            section.style.display =
              sectionHasMatch
                ? ""
                : "none";

            if(sectionHasMatch){
              anythingVisible = true;
            }

          });

        $("#emptyState").style.display =
          anythingVisible || !query
            ? "none"
            : "block";

        $("#emptyQuery").textContent =
          searchEl.value.trim();

        if(catsEl){

          catsEl.style.display =
            query ? "none" : "flex";

        }

      }
    );

    $("#searchClear")?.addEventListener(
      "click",
      () => {

        searchEl.value = "";

        searchEl.dispatchEvent(
          new Event("input")
        );

        searchEl.focus();

      }
    );

  }

  /* =====================================================
     CATEGORY SCROLL OBSERVER
     ===================================================== */

  const categoryButtons =
    catsEl
      ? [...catsEl.querySelectorAll(".cat")]
      : [];

  const sections =
    presentCategories
      .map(category =>
        document.getElementById(
          "s-" + category
        )
      )
      .filter(Boolean);

  if(
    "IntersectionObserver"
    in window
  ){

    const observer =
      new IntersectionObserver(
        entries => {

          entries.forEach(entry => {

            if(!entry.isIntersecting)
              return;

            const id =
              entry.target.id
                .replace("s-","");

            categoryButtons.forEach(
              button => {

                button.classList.toggle(
                  "active",
                  button.dataset.cat === id
                );

              }
            );

          });

        },
        {
          rootMargin:
            "-150px 0px -70% 0px"
        }
      );

    sections.forEach(
      section =>
        observer.observe(section)
    );

  }

  /* =====================================================
     CART DRAWER
     ===================================================== */

  const cartElement =
    $("#cart");

  const scrim =
    $("#scrim");

  function openCart(){

    cartElement?.classList.add(
      "open"
    );

    scrim?.classList.add(
      "show"
    );

    document.body.classList.add(
      "cart-open"
    );

  }

  function closeCart(){

    cartElement?.classList.remove(
      "open"
    );

    scrim?.classList.remove(
      "show"
    );

    document.body.classList.remove(
      "cart-open"
    );

  }

  $("#cartBtn")
    ?.addEventListener(
      "click",
      openCart
    );

  $("#vcbBtn")
    ?.addEventListener(
      "click",
      openCart
    );

  $("#closeCart")
    ?.addEventListener(
      "click",
      closeCart
    );

  scrim?.addEventListener(
    "click",
    () => {

      closeCart();

      const modal =
        $("#checkoutModal");

      if(
        modal &&
        modal.open
      ){

        modal.close();

      }

    }
  );

  /* =====================================================
     CHECKOUT MODAL
     ===================================================== */

  const modal =
    $("#checkoutModal");

  let orderMode =
    "delivery";

  $("#orderToggle")
    ?.addEventListener(
      "click",
      event => {

        const button =
          event.target.closest("button");

        if(!button) return;

        orderMode =
          button.dataset.mode;

        [
          ...$("#orderToggle").children
        ].forEach(
          item =>
            item.classList.toggle(
              "active",
              item === button
            )
        );

        const addressField =
          $("#addressField");

        const addressInput =
          $("#addressInput");

        if(orderMode === "delivery"){

          addressField
            ?.classList
            .remove("field-hidden");

          if(addressInput){
            addressInput.required = true;
          }

        }else{

          addressField
            ?.classList
            .add("field-hidden");

          if(addressInput){
            addressInput.required = false;
          }

        }

      }
    );

  $("#checkout")
    ?.addEventListener(
      "click",
      () => {

        if(!Object.keys(cart).length)
          return;

        scrim?.classList.add("show");

        modal?.showModal();

      }
    );

  $("#closeModal")
    ?.addEventListener(
      "click",
      () => {

        modal?.close();

        scrim?.classList.remove(
          "show"
        );

      }
    );

  modal?.addEventListener(
    "close",
    () => {

      scrim?.classList.remove(
        "show"
      );

    }
  );

  /* =====================================================
     GPS
     ===================================================== */

  $("#gps")
    ?.addEventListener(
      "click",
      () => {

        const gpsMessage =
          $("#gpsmsg");

        if(!navigator.geolocation){

          gpsMessage.textContent =
            "Location is not supported by this browser.";

          return;

        }

        gpsMessage.textContent =
          "Getting your location…";

        navigator.geolocation.getCurrentPosition(

          position => {

            $("#lat").value =
              position.coords.latitude;

            $("#lng").value =
              position.coords.longitude;

            gpsMessage.textContent =
              "✓ Location captured successfully.";

          },

          () => {

            gpsMessage.textContent =
              "Location permission denied — you can enter the address manually.";

          },

          {
            enableHighAccuracy:true,
            timeout:10000,
            maximumAge:0
          }

        );

      }
    );

  /* =====================================================
     ORDER SUBMISSION
     ===================================================== */

  $("#form")
    ?.addEventListener(
      "submit",
      event => {

        event.preventDefault();

        const form =
          new FormData(event.target);

        const items =
          Object.entries(cart)
            .map(
              ([id, quantity]) => {

                const product =
                  P.find(
                    item => item.id == id
                  );

                return {
                  ...product,
                  qty:quantity
                };

              }
            );

        const total =
          items.reduce(
            (sum,item) =>
              sum +
              item.price * item.qty,
            0
          );

        const orderNumber =
          "SC" +
          Date.now()
            .toString()
            .slice(-7);

        const latitude =
          form.get("lat");

        const longitude =
          form.get("lng");

        let locationText =
          "Not shared";

        if(
          latitude &&
          longitude
        ){

          locationText =
            `https://www.google.com/maps?q=${
              encodeURIComponent(
                latitude + "," + longitude
              )
            }`;

        }

        const modeLabel = {
          delivery:"Home Delivery",
          takeaway:"Takeaway",
          dinein:"Dine-in"
        }[orderMode];

        let message =
          `🍽️ *NEW ORDER — SAVOR CAFE'*\\n\\n`;

        message +=
          `*Order:* ${orderNumber}\\n`;

        message +=
          `*Type:* ${modeLabel}\\n`;

        message +=
          `*Customer:* ${form.get("name")}\\n`;

        message +=
          `*Phone:* ${form.get("phone")}\\n`;

        if(orderMode === "delivery"){

          message +=
            `*Address:* ${form.get("address")}\\n`;

          message +=
            `*Live Location:* ${locationText}\\n`;

        }

        message +=
          `\\n*ITEMS*\\n`;

        items.forEach(item => {

          message +=
            `• ${item.name} × ${item.qty} — ₹${item.price * item.qty}\\n`;

        });

        message +=
          `\\n*TOTAL: ₹${total}*\\n`;

        if(form.get("notes")){

          message +=
            `\\n*Note:* ${form.get("notes")}\\n`;

        }

        message +=
          `\\nPlease confirm the order.`;

        const whatsappUrl =
          `https://wa.me/918981315889?text=${
            encodeURIComponent(message)
          }`;

        Object.keys(cart)
          .forEach(
            key =>
              delete cart[key]
          );

        renderCart();

        items.forEach(
          item =>
            rebuildAllCopies(
              item.name
            )
        );

        modal?.close();

        closeCart();

        event.target.reset();

        $("#gpsmsg").textContent =
          "";

        window.open(
          whatsappUrl,
          "_blank"
        );

      }
    );

  /* =====================================================
     CONTACT FORM
     ===================================================== */

  $("#contactForm")
    ?.addEventListener(
      "submit",
      event => {

        event.preventDefault();

        const form =
          new FormData(
            event.target
          );

        let message =
          `📩 *Message from website*\\n\\n`;

        message +=
          `*Name:* ${form.get("cname")}\\n`;

        if(form.get("cphone")){

          message +=
            `*Phone:* ${form.get("cphone")}\\n`;

        }

        message +=
          `\\n${form.get("cmsg")}`;

        const whatsappUrl =
          `https://wa.me/918981315889?text=${
            encodeURIComponent(message)
          }`;

        window.open(
          whatsappUrl,
          "_blank"
        );

        event.target.reset();

      }
    );

  /* =====================================================
     INITIAL CART RENDER
     ===================================================== */

  renderCart();

})();