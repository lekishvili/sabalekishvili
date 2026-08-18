const products = [
  {
    id: 1,
    name: "Urban Street Hoodie",
    gender: "man",
    type: "hoodie",
    price: 65,
    img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80",
    description: "Premium heavy-cotton blend oversized hoodie built for everyday comfort and modern streetwear aesthetics. Features a double-lined hood and spacious kangaroo pocket."
  },
  {
    id: 2,
    name: "Classic Cargo Pants",
    gender: "man",
    type: "pants",
    price: 50,
    img: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80",
    description: "Relaxed-fit tactile cargo pants crafted with durable ripstop fabric, multi-pocket utility design, and adjustable elastic cuff ankles."
  },
  {
    id: 3,
    name: "Retro High Sneakers",
    gender: "man",
    type: "shoes",
    price: 110,
    img: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=600&q=80",
    description: "Iconic high-top sneakers with genuine leather overlays, cushioned mid-soles for high impact absorption, and rubber traction outsoles."
  },
  {
    id: 4,
    name: "Summer Casual Tee",
    gender: "woman",
    type: "shirts",
    price: 30,
    img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80",
    description: "Lightweight 100% organic cotton graphic tee offering breathable daily wear with a clean crewneck silhouette."
  },
  {
    id: 5,
    name: "Wide-Leg Denim",
    gender: "woman",
    type: "pants",
    price: 75,
    img: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80",
    description: "High-waisted vintage wash denim jeans featuring a wide leg cut, non-stretch premium denim structure, and reinforced stitching."
  },
  {
    id: 6,
    name: "Minimalist Cap",
    gender: "woman",
    type: "hat",
    price: 25,
    img: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80",
    description: "Unstructured 6-panel strapback cap made from washed cotton twill. Features an adjustable metal slider buckle at the back."
  }
];

const FALLBACK_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect width='300' height='300' fill='%231e293b'/%3E%3Ctext x='50%25' y='50%25' font-family='sans-serif' font-size='16' fill='%2394a3b8' text-anchor='middle' dy='.3em'%3EImage unavailable%3C/text%3E%3C/svg%3E";

// Load Cart State (guard against corrupted/blocked localStorage)
let cart = [];
try {
  cart = JSON.parse(localStorage.getItem("zshop_cart")) || [];
} catch (e) {
  cart = [];
}
let selectedSize = "M";

document.addEventListener("DOMContentLoaded", () => {
  setupCartEvents();
  setupOverlayDismissals();
  updateCartUI();

  if (document.getElementById("products-grid")) {
    initShopPage();
  }

  if (document.getElementById("product-detail")) {
    renderProductDetail();
  }
});

// -------------------------------------------------------------
// CART SYSTEM & TOAST NOTIFICATION LOGIC
// -------------------------------------------------------------
function setupCartEvents() {
  const openCartBtn = document.getElementById("open-cart-btn");
  const closeCartBtn = document.getElementById("close-cart-btn");
  const cartDrawer = document.getElementById("cart-drawer");
  const checkoutBtn = document.getElementById("checkout-btn");

  if (openCartBtn && cartDrawer) {
    openCartBtn.addEventListener("click", () => cartDrawer.classList.add("active"));
  }

  if (closeCartBtn && cartDrawer) {
    closeCartBtn.addEventListener("click", () => cartDrawer.classList.remove("active"));
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", checkout);
  }
}

// Close modals on Escape key and on backdrop click, for both filter modal and cart drawer
function setupOverlayDismissals() {
  const overlays = [document.getElementById("filter-modal"), document.getElementById("cart-drawer")]
    .filter(Boolean);

  overlays.forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.remove("active");
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      overlays.forEach(overlay => overlay.classList.remove("active"));
    }
  });
}

function showToast(message) {
  const toast = document.getElementById("toast-notification");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

function addToCart(productId, size = "M") {
  const product = products.find(p => p.id === productId);
  if (!product) return;

  const existingItem = cart.find(item => item.id === productId && item.size === size);

  if (existingItem) {
    existingItem.qty += 1;
  } else {
    cart.push({ ...product, size: size, qty: 1 });
  }

  saveAndUpdateCart();
  showToast(`Added "${product.name}" (${size}) to cart!`);
}

function changeQty(index, delta) {
  const item = cart[index];
  if (!item) return;

  item.qty += delta;

  if (item.qty <= 0) {
    cart.splice(index, 1);
  }

  saveAndUpdateCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  saveAndUpdateCart();
}

function saveAndUpdateCart() {
  try {
    localStorage.setItem("zshop_cart", JSON.stringify(cart));
  } catch (e) {
    // Storage unavailable (e.g. private browsing) — cart still works for this session
  }
  updateCartUI();
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function updateCartUI() {
  const cartCountEl = document.getElementById("cart-count");
  const cartItemsEl = document.getElementById("cart-items");
  const cartTotalEl = document.getElementById("cart-total-price");

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  if (cartCountEl) cartCountEl.textContent = totalItems;
  if (cartTotalEl) cartTotalEl.textContent = `$${totalPrice}`;

  if (cartItemsEl) {
    if (cart.length === 0) {
      cartItemsEl.innerHTML = `<p style="text-align: center; color: var(--text-muted); margin-top: 2rem;">Your cart is empty.</p>`;
      return;
    }

    cartItemsEl.innerHTML = cart.map((item, index) => `
      <div class="cart-item">
        <img src="${item.img}" alt="${escapeHtml(item.name)}" onerror="this.onerror=null;this.src='${FALLBACK_IMG}';">
        <div class="cart-item-details">
          <div class="cart-item-title">${escapeHtml(item.name)}</div>
          <div class="cart-item-meta">
            Size: ${escapeHtml(item.size)} •
            <span class="qty-controls">
              <button class="qty-btn" aria-label="Decrease quantity" onclick="changeQty(${index}, -1)">&minus;</button>
              ${item.qty}
              <button class="qty-btn" aria-label="Increase quantity" onclick="changeQty(${index}, 1)">&plus;</button>
            </span>
          </div>
          <div style="font-weight:700;">$${item.price * item.qty}</div>
        </div>
        <button class="remove-item-btn" aria-label="Remove ${escapeHtml(item.name)} from cart" onclick="removeFromCart(${index})">&times;</button>
      </div>
    `).join("");
  }
}

function checkout() {
  if (cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }
  alert("Order submitted successfully!");
  cart = [];
  saveAndUpdateCart();
  document.getElementById("cart-drawer")?.classList.remove("active");
}

// -------------------------------------------------------------
// MAIN SHOP GRID LOGIC
// -------------------------------------------------------------
function initShopPage() {
  const modal = document.getElementById("filter-modal");
  const openModalBtn = document.getElementById("open-filter-btn");
  const closeModalBtn = document.getElementById("close-filter-btn");
  const priceRange = document.getElementById("price-range");
  const priceValue = document.getElementById("price-value");
  const searchForm = document.getElementById("search-form");

  const maxProductPrice = Math.max(...products.map(p => p.price));
  priceRange.max = maxProductPrice;
  priceRange.value = maxProductPrice;
  priceValue.textContent = maxProductPrice;

  if (openModalBtn) openModalBtn.addEventListener("click", () => modal.classList.add("active"));
  if (closeModalBtn) closeModalBtn.addEventListener("click", () => modal.classList.remove("active"));

  priceRange.addEventListener("input", (e) => {
    priceValue.textContent = e.target.value;
  });

  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      applyFilters(priceRange);
    });
  }

  document.getElementById("apply-filters-btn")?.addEventListener("click", () => {
    applyFilters(priceRange);
    modal.classList.remove("active");
  });

  document.getElementById("reset-filters-btn")?.addEventListener("click", () => {
    document.querySelector('input[name="gender"][value="all"]').checked = true;
    document.querySelectorAll('.checkbox-options input').forEach(cb => cb.checked = false);
    priceRange.value = maxProductPrice;
    priceValue.textContent = maxProductPrice;
    document.getElementById("search-input").value = "";
    renderGrid(products);
    modal.classList.remove("active");
  });

  renderGrid(products);
}

function applyFilters(priceRange) {
  const searchQuery = document.getElementById("search-input").value.toLowerCase().trim();
  const selectedGender = document.querySelector('input[name="gender"]:checked').value;
  const selectedTypes = Array.from(document.querySelectorAll('.checkbox-options input:checked')).map(cb => cb.value);
  const maxPrice = parseFloat(priceRange.value);

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery);
    const matchGender = selectedGender === "all" || p.gender === selectedGender;
    const matchType = selectedTypes.length === 0 || selectedTypes.includes(p.type);
    const matchPrice = p.price <= maxPrice;

    return matchSearch && matchGender && matchType && matchPrice;
  });

  renderGrid(filtered);
}

function renderGrid(items) {
  const grid = document.getElementById("products-grid");
  if (!grid) return;

  if (items.length === 0) {
    grid.innerHTML = `<p class="empty-state">No products match your criteria.</p>`;
    return;
  }

  grid.innerHTML = items.map(p => `
    <div class="product-card">
      <img src="${p.img}" alt="${escapeHtml(p.name)}" class="product-img" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_IMG}';">
      <div class="product-info">
        <span class="product-meta">${escapeHtml(p.gender)} • ${escapeHtml(p.type)}</span>
        <h3 class="product-title">${escapeHtml(p.name)}</h3>
        <div class="product-bottom">
          <span class="product-price">$${p.price}</span>
          <a href="product.html?id=${p.id}" class="action-btn" style="text-decoration: none;">Buy</a>
        </div>
      </div>
    </div>
  `).join("");
}

// -------------------------------------------------------------
// SINGLE PRODUCT DETAIL PAGE LOGIC (product.html)
// -------------------------------------------------------------
function renderProductDetail() {
  const container = document.getElementById("product-detail");
  if (!container) return;

  const urlParams = new URLSearchParams(window.location.search);
  const productId = parseInt(urlParams.get("id"), 10);
  const product = products.find(p => p.id === productId);

  if (!product) {
    container.innerHTML = `<div><h2>Product not found.</h2><p style="color:var(--text-muted); margin: 0.8rem 0 1.2rem;">The item you're looking for doesn't exist or may have been removed.</p><a href="index.html" class="action-btn" style="text-decoration:none;">Back to Shop</a></div>`;
    return;
  }

  document.title = `Zshop | ${product.name}`;
  selectedSize = "M";

  container.innerHTML = `
    <img src="${product.img}" alt="${escapeHtml(product.name)}" class="detail-img" onerror="this.onerror=null;this.src='${FALLBACK_IMG}';">
    <div class="detail-info">
      <span class="detail-meta">${escapeHtml(product.gender)} • ${escapeHtml(product.type)}</span>
      <h1 class="detail-title">${escapeHtml(product.name)}</h1>
      <span class="detail-price">$${product.price}</span>
      <p class="detail-description">${escapeHtml(product.description)}</p>

      <div class="size-selector">
        <h4 id="size-label">Select Size</h4>
        <div class="size-options" role="group" aria-labelledby="size-label">
          <button class="size-btn" data-size="S">S</button>
          <button class="size-btn active" data-size="M" aria-pressed="true">M</button>
          <button class="size-btn" data-size="L">L</button>
          <button class="size-btn" data-size="XL">XL</button>
        </div>
      </div>

      <button class="order-btn" id="add-to-cart-detail-btn">Add to Cart</button>
    </div>
  `;

  // Size Button Selection
  const sizeBtns = container.querySelectorAll(".size-btn");
  sizeBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      sizeBtns.forEach(b => {
        b.classList.remove("active");
        b.setAttribute("aria-pressed", "false");
      });
      e.target.classList.add("active");
      e.target.setAttribute("aria-pressed", "true");
      selectedSize = e.target.dataset.size;
    });
  });

  // Add to Cart Button Click Handler
  document.getElementById("add-to-cart-detail-btn").addEventListener("click", () => {
    addToCart(product.id, selectedSize);
  });
}
