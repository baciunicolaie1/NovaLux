
document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector, parent = document) =>
    parent.querySelector(selector);

  const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

  const header = $(".site-header");
  const menuToggle = $("#menuToggle");
  const navLinks = $("#navLinks");

  const searchButton = $("#searchButton");
  const searchOverlay = $("#searchOverlay");
  const searchClose = $("#searchClose");
  const searchForm = $("#searchForm");
  const searchInput = $("#searchInput");
  const searchResults = $("#searchResults");

  const cartButton = $("#cartButton");
  const cartCount = $("#cartCount");
  const toast = $("#toast");

  const productCards = $$(".product-card");
  const filterButtons = $$(".filter-chip");

  let cart = [];
  let toastTimer;
  let lastFocusedElement = null;

  const products = productCards.map((card) => ({
    name: card.dataset.name,
    category: card.dataset.category,
    price: Number(card.dataset.price)
  }));

  // YEAR
  $("#year").textContent = new Date().getFullYear();

  // TOAST
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, 2800);
  }

  // HEADER SCROLL
  function updateHeader() {
    header.classList.toggle("scrolled", window.scrollY > 15);
  }

  updateHeader();

  window.addEventListener("scroll", updateHeader, {
    passive: true
  });

  // MOBILE MENU
  function closeMenu() {
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open menu");
  }

  menuToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");

    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute(
      "aria-label",
      open ? "Close menu" : "Open menu"
    );
  });

  $$(".nav-link", navLinks).forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", (event) => {
    if (
      navLinks.classList.contains("open") &&
      !navLinks.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) {
      closeMenu();
    }
  });

  // ACTIVE NAV LINK
  const sections = $$("main section[id]");

  if ("IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          $$(".nav-link").forEach((link) => {
            link.classList.toggle(
              "active",
              link.getAttribute("href") === `#${entry.target.id}`
            );
          });
        });
      },
      {
        rootMargin: "-30% 0px -60% 0px",
        threshold: 0
      }
    );

    sections.forEach((section) => navObserver.observe(section));
  }

  // SEARCH
  function openSearch() {
    lastFocusedElement = document.activeElement;

    searchOverlay.classList.add("open");
    searchOverlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");

    renderSearchResults(searchInput.value);

    setTimeout(() => searchInput.focus(), 80);
  }

  function closeSearch() {
    searchOverlay.classList.remove("open");
    searchOverlay.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");

    if (lastFocusedElement) {
      lastFocusedElement.focus();
    }
  }

  searchButton.addEventListener("click", openSearch);
  searchClose.addEventListener("click", closeSearch);

  searchOverlay.addEventListener("click", (event) => {
    if (event.target === searchOverlay) {
      closeSearch();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (searchOverlay.classList.contains("open")) {
        closeSearch();
      }

      closeMenu();
    }
  });

  function renderSearchResults(query) {
    const term = query.trim().toLowerCase();

    const matches = products.filter((product) => {
      return `${product.name} ${product.category}`
        .toLowerCase()
        .includes(term);
    });

    if (!matches.length) {
      searchResults.innerHTML = `
        <p class="no-results">
          No products found. Try headphones, watch or speaker.
        </p>
      `;
      return;
    }

    searchResults.innerHTML = matches.map((product) => {
      const productIndex = products.indexOf(product);

      return `
        <div class="search-result">
          <div>
            <strong>${product.name}</strong><br>
            <span>${product.category} · $${product.price.toFixed(2)}</span>
          </div>
          <button type="button" data-search-add="${productIndex}">
            Add to cart +
          </button>
        </div>
      `;
    }).join("");
  }

  searchInput.addEventListener("input", () => {
    renderSearchResults(searchInput.value);
  });

  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    renderSearchResults(searchInput.value);
  });

  searchResults.addEventListener("click", (event) => {
    const button = event.target.closest("[data-search-add]");

    if (!button) return;

    const product = products[Number(button.dataset.searchAdd)];

    if (!product) return;

    addToCart(product.name, product.price);
  });

  // CART
  function addToCart(name, price) {
    cart.push({ name, price });

    cartCount.textContent = cart.length;

    cartButton.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.18)" },
        { transform: "scale(1)" }
      ],
      {
        duration: 330,
        easing: "ease-out"
      }
    );

    showToast(`${name} added to cart · $${price.toFixed(2)}`);
  }

  $$("[data-add]").forEach((button) => {
    button.addEventListener("click", () => {
      addToCart(
        button.dataset.add,
        Number(button.dataset.price)
      );
    });
  });

  cartButton.addEventListener("click", () => {
    if (!cart.length) {
      showToast("Your cart is empty. Explore the collection!");
      return;
    }

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const itemLabel = cart.length === 1 ? "item" : "items";

    const summary = cart
      .map((item) => `${item.name} — $${item.price.toFixed(2)}`)
      .join(" | ");

    showToast(
      `${cart.length} ${itemLabel} · Total $${total.toFixed(2)}`
    );

    console.info("NovaLux demo cart:", summary);
  });

  // FILTER PRODUCTS
  function filterProducts(category) {
    let visibleCount = 0;

    productCards.forEach((card) => {
      const matches =
        category === "All" ||
        card.dataset.category === category;

      card.hidden = !matches;

      if (matches) {
        visibleCount++;
        card.classList.remove("is-visible");
      }
    });

    filterButtons.forEach((button) => {
      const active = button.dataset.filter === category;

      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    $("#emptyProducts").hidden = visibleCount > 0;

    requestAnimationFrame(() => {
      productCards.forEach((card) => {
        if (!card.hidden) {
          card.classList.add("is-visible");
        }
      });
    });
  }

  filterButtons.forEach((button) => {
    button.setAttribute(
      "aria-pressed",
      String(button.classList.contains("active"))
    );

    button.addEventListener("click", () => {
      filterProducts(button.dataset.filter);
    });
  });

  // CATEGORY CARDS LINK TO SHOP FILTER
  $$(".category-card").forEach((card) => {
    card.addEventListener("click", () => {
      const category = card.dataset.categoryLink;

      filterProducts(category);

      closeMenu();
    });
  });

  // WISHLIST DEMO
  $$(".wishlist-button").forEach((button) => {
    button.setAttribute("aria-pressed", "false");

    button.addEventListener("click", () => {
      const liked = button.classList.toggle("liked");

      button.textContent = liked ? "♥" : "♡";
      button.setAttribute("aria-pressed", String(liked));

      const productCard = button.closest(".product-card");
      const name = productCard.dataset.name;

      showToast(
        liked
          ? `${name} added to your wishlist`
          : `${name} removed from your wishlist`
      );
    });
  });

  // NEWSLETTER DEMO
  $("#newsletterForm").addEventListener("submit", (event) => {
    event.preventDefault();

    const emailInput = $("#emailInput");

    if (!emailInput.checkValidity()) {
      emailInput.reportValidity();
      return;
    }

    showToast("Thanks for joining NovaLux! This is a demo signup.");

    emailInput.value = "";
  });

  // THEME TOGGLE
  const themeButton = $("#themeButton");

  themeButton.addEventListener("click", () => {
    const light = document.body.classList.toggle("light-theme");

    themeButton.setAttribute(
      "aria-label",
      light ? "Switch to dark theme" : "Switch to light theme"
    );

    showToast(light ? "Light theme enabled" : "Dark theme enabled");
  });

  // SCROLL REVEALS
  const revealElements = $$(".reveal");

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (!reduceMotion) {
    document.body.classList.add("js-motion");

    revealElements.forEach((element, index) => {
      element.style.setProperty(
        "--delay",
        `${(index % 4) * 90}ms`
      );
    });

    if ("IntersectionObserver" in window) {
      const revealObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.12,
          rootMargin: "0px 0px -35px 0px"
        }
      );

      revealElements.forEach((element) => {
        revealObserver.observe(element);
      });
    } else {
      revealElements.forEach((element) => {
        element.classList.add("is-visible");
      });
    }
  } else {
    revealElements.forEach((element) => {
      element.classList.add("is-visible");
    });
  }

  // 3D CATEGORY TILT
  const canHover = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  ).matches;

  if (canHover && !reduceMotion) {
    $$(".category-card").forEach((card) => {
      const image = $(".category-image", card);

      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();

        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;

        const rotateY = (x - 0.5) * 7;
        const rotateX = (0.5 - y) * 7;

        image.style.transform =
          `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

        image.style.transition = "transform .12s ease-out";
      });

      card.addEventListener("pointerleave", () => {
        image.style.transform = "";
        image.style.transition = "transform .45s ease";
      });
    });

    // HERO PARALLAX
    const hero = $(".hero");
    const heroVisual = $("#heroVisual");

    if (hero && heroVisual) {
      hero.addEventListener("pointermove", (event) => {
        const rect = hero.getBoundingClientRect();

        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;

        heroVisual.style.setProperty(
          "--hero-shift-x",
          `${x * 13}px`
        );

        heroVisual.style.setProperty(
          "--hero-shift-y",
          `${y * 10}px`
        );
      });

      hero.addEventListener("pointerleave", () => {
        heroVisual.style.setProperty("--hero-shift-x", "0px");
        heroVisual.style.setProperty("--hero-shift-y", "0px");
      });
    }
  }

  // IMAGE FALLBACK
  $$("img").forEach((img) => {
    img.addEventListener("error", () => {
      img.classList.add("image-unavailable");
    });
  });

  console.log("NovaLux initialized successfully.");
});
