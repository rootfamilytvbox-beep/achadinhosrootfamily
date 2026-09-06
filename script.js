/**
 * Mercado Livre Afiliados - Interactive Application Script v2.0
 * Dynamic product rendering, filtering, sidebar controls, modals, mobile UX & micro-animations
 */

document.addEventListener('DOMContentLoaded', () => {

  // =========================================================================
  // 1. DATA & PRODUCTS MANAGEMENT
  // =========================================================================
  const FALLBACK_PRODUCTS = [
    { id: 1, title: "Samsung Galaxy S23 5G 256GB Preto 8GB RAM", category: "eletronicos", price: "R$ 3.899,00", oldPrice: "R$ 4.599,00", discount: "15% OFF", rating: "4,9", reviews: "2,5k", savings: "Economize R$ 700,00", image: "assets/images/prod-fone.jpg", affiliateUrl: "https://lista.mercadolivre.com.br/samsung-galaxy-s23?campId=SEU_ID_AFILIADO_AQUI" },
    { id: 2, title: "Smart TV LG 50\" 4K UHD Wi-Fi Bluetooth", category: "eletronicos", price: "R$ 2.199,00", oldPrice: "R$ 2.899,00", discount: "24% OFF", rating: "4,8", reviews: "1,2k", savings: "Economize R$ 700,00", image: "assets/images/prod-smartwatch.jpg", affiliateUrl: "https://lista.mercadolivre.com.br/smart-tv-lg-50?campId=SEU_ID_AFILIADO_AQUI" },
    { id: 3, title: "Tênis Masculino Nike Revolution 6 Preto", category: "moda", price: "R$ 259,90", oldPrice: "R$ 399,90", discount: "35% OFF", rating: "4,7", reviews: "6,1k", savings: "Economize R$ 140,00", image: "assets/images/prod-fita-led.jpg", affiliateUrl: "https://lista.mercadolivre.com.br/tenis-nike-revolution?campId=SEU_ID_AFILIADO_AQUI" },
    { id: 4, title: "Notebook Lenovo IdeaPad 3 Intel Core i3 4GB 256GB SSD", category: "eletronicos", price: "R$ 2.099,00", oldPrice: "R$ 2.599,00", discount: "19% OFF", rating: "4,8", reviews: "9,8k", savings: "Economize R$ 500,00", image: "assets/images/prod-carregador.jpg", affiliateUrl: "https://lista.mercadolivre.com.br/notebook-lenovo-ideapad?campId=SEU_ID_AFILIADO_AQUI" },
    { id: 5, title: "Fritadeira Sem Óleo Air Fryer Mondial 4L", category: "casa", price: "R$ 289,90", oldPrice: "R$ 399,90", discount: "27% OFF", rating: "4,9", reviews: "15,2k", savings: "Economize R$ 110,00", image: "assets/images/prod-airfryer.jpg", affiliateUrl: "https://lista.mercadolivre.com.br/fritadeira-air-fryer-mondial?campId=SEU_ID_AFILIADO_AQUI" }
  ];

  let ALL_PRODUCTS = (window.MERCADOLIVRE_PRODUCTS && Array.isArray(window.MERCADOLIVRE_PRODUCTS) && window.MERCADOLIVRE_PRODUCTS.length > 0)
    ? [...window.MERCADOLIVRE_PRODUCTS]
    : [...FALLBACK_PRODUCTS];

  // Wishlist state
  const wishlist = new Set(JSON.parse(localStorage.getItem('shopee_wishlist') || '[]'));

  function saveWishlist() {
    localStorage.setItem('shopee_wishlist', JSON.stringify([...wishlist]));
  }

  function renderProducts(products) {
    const container = document.getElementById('productsContainer');
    const offersCountEl = document.getElementById('offersCount');

    if (offersCountEl) {
      offersCountEl.textContent = `(${products.length} ${products.length === 1 ? 'oferta' : 'ofertas'})`;
    }

    if (!container) return;

    if (products.length === 0) {
      container.innerHTML = `
        <div class="empty-products">
          <p>😕 Nenhuma oferta local encontrada.</p>
          <button class="btn btn-primary" onclick="window.open('https://lista.mercadolivre.com.br/' + encodeURIComponent(document.getElementById('searchInput') ? document.getElementById('searchInput').value : ''), '_blank')">Pesquisar diretamente no Mercado Livre</button>
        </div>
      `;
      return;
    }

    container.innerHTML = products.map((prod, i) => {
      const discountTag = prod.discount || '';
      const isWishlisted = wishlist.has(prod.id);
      return `
        <div class="product-card" data-id="${prod.id}" data-category="${prod.category}" style="animation-delay:${i * 0.04}s">
          ${discountTag ? `<div class="card-discount-badge">${discountTag}</div>` : ''}
          <button class="card-wishlist-btn ${isWishlisted ? 'active' : ''}" data-prod-id="${prod.id}" aria-label="Adicionar aos favoritos" title="Favoritar">
            ${isWishlisted ? '❤️' : '🤍'}
          </button>
          <div class="card-thumb">
            <img src="${prod.image}" alt="${prod.title}" loading="lazy" onerror="this.src='assets/images/prod-fone.jpg'">
          </div>
          <div class="card-body">
            <h3 class="card-title">${prod.title}</h3>
            <div class="card-rating">
              <span class="star-icon">★</span>
              <span class="rate-val">${prod.rating || '4,8'}</span>
              <span class="rate-reviews">(${prod.reviews || '5k'})</span>
            </div>
            <div class="card-pricing">
              <span class="price-current">${prod.price}</span>
              ${prod.oldPrice ? `<span class="price-old">${prod.oldPrice}</span>` : ''}
            </div>
            ${prod.savings ? `<div class="card-savings">${prod.savings}</div>` : ''}
            <a href="${prod.affiliateUrl || 'https://shopee.com.br'}" target="_blank" rel="noopener noreferrer" class="btn btn-shopee">
              Ver na Mercado Livre <span class="arrow">→</span>
            </a>
          </div>
        </div>
      `;
    }).join('');

    attachProductClickListeners();
    attachWishlistListeners();
    initScrollAnimation();
  }

  function attachWishlistListeners() {
    document.querySelectorAll('.card-wishlist-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const prodId = parseInt(btn.dataset.prodId);
        if (wishlist.has(prodId)) {
          wishlist.delete(prodId);
          btn.innerHTML = '🤍';
          btn.classList.remove('active');
          showToast('Removido dos favoritos');
        } else {
          wishlist.add(prodId);
          btn.innerHTML = '❤️';
          btn.classList.add('active');
          // Heart burst animation
          btn.style.transform = 'scale(1.4)';
          setTimeout(() => { btn.style.transform = ''; }, 300);
          showToast('Adicionado aos favoritos! ❤️');
        }
        saveWishlist();
      });
    });
  }

  function attachProductClickListeners() {
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (!e.target.closest('a') && !e.target.closest('.card-wishlist-btn')) {
          const btnLink = card.querySelector('.btn-shopee');
          if (btnLink && btnLink.href) {
            window.open(btnLink.href, '_blank', 'noopener,noreferrer');
          }
        }
      });
    });
  }

  async function loadProducts() {
    if (window.SHOPEE_PRODUCTS && Array.isArray(window.SHOPEE_PRODUCTS) && window.SHOPEE_PRODUCTS.length > 0) {
      ALL_PRODUCTS = window.SHOPEE_PRODUCTS;
      applyFilters();
      return;
    }
    try {
      const res = await fetch('data/products.json?t=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          ALL_PRODUCTS = data;
          applyFilters();
          return;
        }
      }
    } catch (e) {}
    applyFilters();
  }

  // =========================================================================
  // 2. SIDEBAR FILTER & SEARCH ENGINE
  // =========================================================================
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');
  const filterForm = document.getElementById('filterForm');

  function applyFilters() {
    let result = [...ALL_PRODUCTS];

    // Search input text filter
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();
    if (query !== '') {
      result = result.filter(p => p.title.toLowerCase().includes(query));
    }

    // Category filter (checkboxes)
    const categoryChecks = document.querySelectorAll('input[name="filter-cat"]:checked');
    if (categoryChecks.length > 0) {
      const selectedCats = Array.from(categoryChecks).map(c => c.value);
      result = result.filter(p => selectedCats.includes(p.category));
    }

    // Discount range filter (checkboxes)
    const discountChecks = document.querySelectorAll('input[name="filter-disc"]:checked');
    const selectedDiscValues = Array.from(discountChecks).map(c => c.value);

    if (discountChecks.length > 0 && !selectedDiscValues.includes('all')) {
      result = result.filter(p => {
        const numMatch = (p.discount || '').match(/(\d+)/);
        const discNum = numMatch ? parseInt(numMatch[1], 10) : 0;
        return selectedDiscValues.some(val => {
          if (val === '0-20') return discNum <= 20;
          if (val === '20-40') return discNum >= 20 && discNum <= 40;
          if (val === '40-60') return discNum >= 40 && discNum <= 60;
          if (val === '60+') return discNum >= 60;
          return true;
        });
      });
    }

    // Sorting
    const sortVal = sortSelect ? sortSelect.value : 'recommended';
    if (sortVal === 'highest-discount') {
      result.sort((a, b) => {
        const dA = parseInt((a.discount || '0').replace(/\D/g, ''), 10);
        const dB = parseInt((b.discount || '0').replace(/\D/g, ''), 10);
        return dB - dA;
      });
    } else if (sortVal === 'lowest-price') {
      result.sort((a, b) => {
        const pA = parseFloat((a.price || '0').replace(/[^\d,]/g, '').replace(',', '.'));
        const pB = parseFloat((b.price || '0').replace(/[^\d,]/g, '').replace(',', '.'));
        return pA - pB;
      });
    } else if (sortVal === 'best-sellers') {
      result.sort((a, b) => {
        const reviewsToNum = r => parseFloat((r || '0').replace('k', '')) * (r.includes('k') ? 1000 : 1);
        return reviewsToNum(b.reviews) - reviewsToNum(a.reviews);
      });
    }

    renderProducts(result);
  }

  function resetAllFilters() {
    if (searchInput) searchInput.value = '';
    const allChecks = document.querySelectorAll('.sidebar-filter-box input[type="checkbox"]');
    allChecks.forEach(ch => {
      ch.checked = (ch.value === 'all');
    });
    const radios = document.querySelectorAll('input[name="filter-sort"]');
    radios.forEach(r => {
      r.checked = (r.value === 'recommended');
    });
    if (sortSelect) sortSelect.value = 'recommended';
    applyFilters();
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', (e) => {
      e.preventDefault();
      resetAllFilters();
    });
  }

  // Sidebar change listeners
  document.querySelectorAll('.sidebar-filter-box input').forEach(input => {
    input.addEventListener('change', applyFilters);
  });

  if (sortSelect) sortSelect.addEventListener('change', applyFilters);

  // Mercado Livre Global Search Integration
  const ML_AFFILIATE_ID = "SEU_ID_AFILIADO_AQUI"; // Substitua pelo seu ID real do Mercado Livre Afiliados

  function performMLSearch() {
    if (searchInput && searchInput.value.trim().length > 0) {
      const searchTerm = encodeURIComponent(searchInput.value.trim());
      const searchUrl = `https://lista.mercadolivre.com.br/${searchTerm}?campId=${ML_AFFILIATE_ID}`;
      window.open(searchUrl, '_blank');
    }
  }

  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        performMLSearch();
      }
    });
  }

  const searchBtn = document.querySelector('.search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      performMLSearch();
    });
  }

  // Accordion toggle in sidebar
  document.querySelectorAll('.filter-group-header').forEach(header => {
    header.addEventListener('click', () => {
      const group = header.closest('.filter-group');
      if (group) {
        group.classList.toggle('collapsed');
      }
    });
  });

  // =========================================================================
  // 3. MOBILE FILTER DRAWER (offers page)
  // =========================================================================
  const mobileFilterToggle = document.getElementById('mobileFilterToggle');
  const sidebarFilterBox = document.querySelector('.sidebar-filter-box');
  const filterMobileOverlay = document.getElementById('filterMobileOverlay');
  const mobileFilterClose = document.getElementById('mobileFilterClose');

  function openMobileFilters() {
    if (sidebarFilterBox) {
      sidebarFilterBox.classList.add('mobile-open');
      document.body.style.overflow = 'hidden';
    }
    if (filterMobileOverlay) filterMobileOverlay.classList.add('active');
  }

  function closeMobileFilters() {
    if (sidebarFilterBox) {
      sidebarFilterBox.classList.remove('mobile-open');
      document.body.style.overflow = '';
    }
    if (filterMobileOverlay) filterMobileOverlay.classList.remove('active');
  }

  if (mobileFilterToggle) mobileFilterToggle.addEventListener('click', openMobileFilters);
  if (mobileFilterClose) mobileFilterClose.addEventListener('click', closeMobileFilters);
  if (filterMobileOverlay) filterMobileOverlay.addEventListener('click', closeMobileFilters);

  // =========================================================================
  // 4. NAVIGATION & MOBILE DRAWER
  // =========================================================================
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const drawerOverlay = document.getElementById('drawerOverlay');
  const drawerClose = document.getElementById('drawerClose');
  const drawerLinks = document.querySelectorAll('.drawer-link');

  function openDrawer() {
    if (mobileDrawer) mobileDrawer.classList.add('active');
    if (drawerOverlay) drawerOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    if (mobileDrawer) mobileDrawer.classList.remove('active');
    if (drawerOverlay) drawerOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openDrawer);
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

  drawerLinks.forEach(link => {
    link.addEventListener('click', () => closeDrawer());
  });

  // =========================================================================
  // 5. HEADER SCROLL EFFECT
  // =========================================================================
  const mainHeader = document.getElementById('mainHeader');
  window.addEventListener('scroll', () => {
    if (mainHeader) {
      mainHeader.classList.toggle('scrolled', window.scrollY > 30);
    }
  }, { passive: true });

  // =========================================================================
  // 6. THEME TOGGLE (DARK / LIGHT)
  // =========================================================================
  const themeToggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('shopee_theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('light-mode');
      const isLight = document.body.classList.contains('light-mode');
      localStorage.setItem('shopee_theme', isLight ? 'light' : 'dark');

      // Small bounce animation on icon
      themeToggle.style.transform = 'rotate(360deg)';
      themeToggle.style.transition = 'transform 0.5s ease';
      setTimeout(() => {
        themeToggle.style.transform = '';
        themeToggle.style.transition = '';
      }, 500);
    });
  }

  // =========================================================================
  // 7. MODALS & NEWSLETTER
  // =========================================================================
  const couponsModal = document.getElementById('couponsModal');
  const closeCouponsModal = document.getElementById('closeCouponsModal');
  const viewCouponsBtn = document.getElementById('viewCouponsBtn');
  const navCupons = document.getElementById('navCupons');

  function openModal(m) {
    if (m) {
      m.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal(m) {
    if (m) {
      m.classList.remove('active');
      document.body.style.overflow = '';
    }
  }

  [viewCouponsBtn, navCupons].forEach(b => {
    if (b) {
      b.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(couponsModal);
      });
    }
  });

  if (closeCouponsModal) closeCouponsModal.addEventListener('click', () => closeModal(couponsModal));

  // Close modal on overlay click
  if (couponsModal) {
    couponsModal.addEventListener('click', (e) => {
      if (e.target === couponsModal) closeModal(couponsModal);
    });
  }

  // Close modal on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal(couponsModal);
      closeDrawer();
      closeMobileFilters();
    }
  });

  // Coupon copy functionality
  document.querySelectorAll('.coupon-item').forEach(item => {
    item.addEventListener('click', () => {
      const code = item.querySelector('.coupon-code-box')?.textContent?.trim();
      if (code) {
        navigator.clipboard.writeText(code).then(() => {
          showToast(`Cupom "${code}" copiado! 🎉`);
        }).catch(() => {
          showToast(`Código: ${code}`);
        });
      }
    });
  });

  // Newsletter form
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('emailInput');
      if (emailInput && emailInput.value) {
        showToast('🎉 Cadastro realizado! Em breve você receberá nossas melhores ofertas.');
        emailInput.value = '';
      }
    });
  }

  // =========================================================================
  // 8. TOAST NOTIFICATIONS
  // =========================================================================
  function showToast(message, duration = 3000) {
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toastContainer';
      toastContainer.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        pointer-events: none;
      `;
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.style.cssText = `
      background: rgba(15, 16, 24, 0.95);
      border: 1px solid rgba(255, 230, 0, 0.3);
      color: #f0f1f6;
      padding: 10px 20px;
      border-radius: 100px;
      font-size: 0.85rem;
      font-weight: 600;
      font-family: 'Plus Jakarta Sans', sans-serif;
      backdrop-filter: blur(12px);
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      animation: toastIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      white-space: nowrap;
    `;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    // Inject animation if not present
    if (!document.getElementById('toastStyles')) {
      const style = document.createElement('style');
      style.id = 'toastStyles';
      style.textContent = `
        @keyframes toastIn { from { opacity:0; transform:translateY(12px) scale(0.9); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes toastOut { from { opacity:1; transform:translateY(0) scale(1); } to { opacity:0; transform:translateY(-8px) scale(0.9); } }
      `;
      document.head.appendChild(style);
    }

    setTimeout(() => {
      toast.style.animation = 'toastOut 0.25s ease forwards';
      setTimeout(() => toast.remove(), 280);
    }, duration);
  }

  // =========================================================================
  // 9. INTERSECTION OBSERVER - Scroll animations
  // =========================================================================
  function initScrollAnimation() {
    const animatedEls = document.querySelectorAll('.animate-on-scroll');
    if (!animatedEls.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    animatedEls.forEach(el => observer.observe(el));
  }

  // Apply animate-on-scroll to sections
  document.querySelectorAll('.trust-bar, .section-categories, .section-bestsellers, .section-coupons, .section-newsletter, .bestseller-card, .category-item-card').forEach(el => {
    el.classList.add('animate-on-scroll');
  });

  initScrollAnimation();

  // =========================================================================
  // 10. CATEGORY CAROUSEL SCROLL
  // =========================================================================
  const catNextBtn = document.getElementById('catNextBtn');
  const catContainer = document.getElementById('categoriesContainer');

  if (catNextBtn && catContainer) {
    catNextBtn.addEventListener('click', () => {
      catContainer.scrollBy({ left: 200, behavior: 'smooth' });
    });
  }

  // =========================================================================
  // 11. HOW IT WORKS MODAL (index.html)
  // =========================================================================
  const openHowItWorksBtn = document.getElementById('openHowItWorksBtn');
  if (openHowItWorksBtn) {
    openHowItWorksBtn.addEventListener('click', () => {
      showToast('🛍️ Navegue pelas ofertas, clique no produto e economize na Mercado Livre!', 4000);
    });
  }

  // =========================================================================
  // 12. CATEGORIAS PAGE HANDLER (categorias.html)
  // =========================================================================
  function initCategoriesPage() {
    const categoryGrid = document.getElementById('categoryProductsGrid');
    if (!categoryGrid) return;

    const urlParams = new URLSearchParams(window.location.search);
    let selectedCategory = urlParams.get('cat') || 'eletronicos';

    const categoryNames = {
      'eletronicos': 'Eletrônicos',
      'casa': 'Casa e Decoração',
      'moda': 'Moda',
      'beleza': 'Beleza',
      'esportes': 'Esportes',
      'automotivo': 'Automotivo',
      'infantil': 'Infantil',
      'game': 'Game & Geek',
      'pet': 'Pet Shop',
      'alimentos': 'Alimentos e Bebidas',
      'saude': 'Saúde',
      'ferramentas': 'Ferramentas',
      'papelaria': 'Papelaria e Escritório',
      'telefonia': 'Telefonia',
      'jardim': 'Jardim e Outdoor'
    };

    function renderCategoryProducts(catKey) {
      const activeTitleEl = document.getElementById('catActiveTitle');
      const catName = categoryNames[catKey] || 'Destaques';
      if (activeTitleEl) {
        activeTitleEl.innerHTML = `<span class="section-title-dot"></span>Produtos em ${catName}`;
      }

      // Filter matching products
      let filtered = ALL_PRODUCTS.filter(p => p.category === catKey);
      if (filtered.length === 0) {
        filtered = ALL_PRODUCTS.slice(0, 6);
      }

      categoryGrid.innerHTML = filtered.map((prod, i) => {
        const isWishlisted = wishlist.has(prod.id);
        return `
          <div class="product-card" data-id="${prod.id}" data-category="${prod.category}" style="animation-delay:${i * 0.05}s">
            ${prod.discount ? `<div class="card-discount-badge">${prod.discount}</div>` : ''}
            <button class="card-wishlist-btn ${isWishlisted ? 'active' : ''}" data-prod-id="${prod.id}" aria-label="Adicionar aos favoritos" title="Favoritar">
              ${isWishlisted ? '❤️' : '🤍'}
            </button>
            <div class="card-thumb">
              <img src="${prod.image}" alt="${prod.title}" loading="lazy" onerror="this.src='assets/images/prod-fone.jpg'">
            </div>
            <div class="card-body">
              <h3 class="card-title">${prod.title}</h3>
              <div class="card-rating">
                <span class="star-icon">★</span>
                <span class="rate-val">${prod.rating || '4,8'}</span>
                <span class="rate-reviews">(${prod.reviews || '5k'})</span>
              </div>
              <div class="card-pricing">
                <span class="price-current">${prod.price}</span>
                ${prod.oldPrice ? `<span class="price-old">${prod.oldPrice}</span>` : ''}
              </div>
              ${prod.savings ? `<div class="card-savings">${prod.savings}</div>` : ''}
              <a href="${prod.affiliateUrl || 'https://mercadolivre.com.br'}" target="_blank" rel="noopener noreferrer" class="btn btn-shopee">
                Ver na Mercado Livre <span class="arrow">→</span>
              </a>
            </div>
          </div>
        `;
      }).join('');

      attachWishlistListeners();
      attachProductClickListeners();
    }

    function selectCategory(catKey, shouldScroll = false) {
      selectedCategory = catKey;

      document.querySelectorAll('.cat-sidebar-item').forEach(item => {
        item.classList.toggle('active', item.dataset.category === catKey);
      });

      document.querySelectorAll('.cat-featured-card').forEach(card => {
        card.classList.toggle('active', card.dataset.category === catKey);
      });

      renderCategoryProducts(catKey);

      if (shouldScroll) {
        const prodSec = document.getElementById('catProductsSection');
        if (prodSec) {
          prodSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }

    document.querySelectorAll('.cat-sidebar-item').forEach(item => {
      item.addEventListener('click', () => {
        const cat = item.dataset.category;
        if (cat) selectCategory(cat, true);
      });
    });

    document.querySelectorAll('.cat-featured-card').forEach(card => {
      card.addEventListener('click', () => {
        const cat = card.dataset.category;
        
        const term = "";
        const category = card.dataset.category || 'all';
        const filtered = [];
        
        ALL_PRODUCTS.forEach(p => {
          const matchSearch = p.title.toLowerCase().includes(term);
          const matchCat = category === 'all' || p.category === category;
          if (matchSearch && matchCat) filtered.push(p);
        });

        renderProducts(filtered);
        
        // If user typed something and pressed search, redirect to Mercado Livre
        if (term.length > 0) {
            window.open('https://lista.mercadolivre.com.br/' + encodeURIComponent(term), '_blank');
        }
      });
    });

    selectCategory(selectedCategory);
  }

  // =========================================================================
  // 13. MAIS VENDIDOS PAGE HANDLER (mais-vendidos.html)
  // =========================================================================
  function initBestSellersPage() {
    const bsGrid = document.getElementById('bestsellersGrid');
    if (!bsGrid) return;

    const salesVolumeMap = [
      '50mil+ vendidos', '45mil+ vendidos', '40mil+ vendidos', '38mil+ vendidos', '35mil+ vendidos',
      '32mil+ vendidos', '28mil+ vendidos', '23mil+ vendidos', '20mil+ vendidos', '18mil+ vendidos',
      '15mil+ vendidos', '12mil+ vendidos'
    ];

    let currentSort = 'bestseller';

    function renderBestSellers(products) {
      let list = [...products];

      if (currentSort === 'bestseller') {
        list.sort((a, b) => parseFloat(b.reviews) - parseFloat(a.reviews));
      } else if (currentSort === 'rating') {
        list.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
      } else if (currentSort === 'discount') {
        list.sort((a, b) => parseInt(b.discount || 0) - parseInt(a.discount || 0));
      } else if (currentSort === 'price-asc') {
        const getPrice = p => parseFloat(p.price.replace(/[^\d,]/g, '').replace(',', '.'));
        list.sort((a, b) => getPrice(a) - getPrice(b));
      } else if (currentSort === 'price-desc') {
        const getPrice = p => parseFloat(p.price.replace(/[^\d,]/g, '').replace(',', '.'));
        list.sort((a, b) => getPrice(b) - getPrice(a));
      }

      bsGrid.innerHTML = list.map((prod, i) => {
        const isWishlisted = wishlist.has(prod.id);
        const rankNum = i + 1;
        const isTopRank = rankNum <= 5;
        const salesText = salesVolumeMap[i] || `${Math.max(5, 50 - i * 3)}mil+ vendidos`;

        return `
          <div class="product-card bs-product-card" data-id="${prod.id}" style="animation-delay:${i * 0.04}s">
            <div class="rank-number-badge ${isTopRank ? 'top-rank' : ''}">${rankNum}</div>
            ${prod.discount ? `<div class="card-discount-badge">${prod.discount}</div>` : ''}
            <button class="card-wishlist-btn ${isWishlisted ? 'active' : ''}" data-prod-id="${prod.id}" aria-label="Adicionar aos favoritos" title="Favoritar">
              ${isWishlisted ? '❤️' : '🤍'}
            </button>
            <div class="card-thumb">
              <img src="${prod.image}" alt="${prod.title}" loading="lazy" onerror="this.src='assets/images/prod-fone.jpg'">
            </div>
            <div class="card-body">
              <h3 class="card-title">${prod.title}</h3>
              <div class="card-rating">
                <span class="star-icon">★</span>
                <span class="rate-val">${prod.rating || '4,8'}</span>
                <span class="rate-reviews">(${prod.reviews || '5k'})</span>
              </div>
              <div class="sales-count-info">🔥 ${salesText}</div>
              <div class="card-pricing" style="margin-top: 6px;">
                <span class="price-current">${prod.price}</span>
                ${prod.oldPrice ? `<span class="price-old">${prod.oldPrice}</span>` : ''}
              </div>
              <a href="${prod.affiliateUrl || 'https://shopee.com.br?aff_id=1836460594'}" target="_blank" rel="noopener noreferrer" class="btn btn-shopee">
                Ver na Mercado Livre <span class="arrow">→</span>
              </a>
            </div>
          </div>
        `;
      }).join('');

      attachWishlistListeners();
      attachProductClickListeners();
    }

    // Attach Tab Filter Handlers
    document.querySelectorAll('.bs-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.bs-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filterType = btn.dataset.filter;
        if (filterType === 'bestseller') currentSort = 'bestseller';
        else if (filterType === 'toprated') currentSort = 'rating';
        else if (filterType === 'trending') currentSort = 'discount';

        renderBestSellers(ALL_PRODUCTS);
      });
    });

    // Attach Sort Select Handler
    const sortSelect = document.getElementById('bsSortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderBestSellers(ALL_PRODUCTS);
      });
    }

    renderBestSellers(ALL_PRODUCTS);
  }

  // =========================================================================
  // INITIAL LOAD
  // =========================================================================
  loadProducts();
  initCategoriesPage();
  initBestSellersPage();

});


