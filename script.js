/**
 * Mercado Livre Afiliados - Interactive Application Script v2.0
 * Dynamic product rendering, filtering, sidebar controls, modals, mobile UX & micro-animations
 */

document.addEventListener('DOMContentLoaded', () => {

  // =========================================================================
  // 1. DATA & AFFILIATE CANONICAL ENGINE
  // =========================================================================
  const ML_AFFILIATE_ID = "91070744";
  const SHOPEE_AFFILIATE_ID = "1836460594";

  /**
   * Gera a URL canônica de afiliado da Shopee garantindo o identificador e tags UTM oficiais.
   */
  function buildShopeeAffiliateUrl(urlOrKeyword, isSearch = false) {
    const raw = (urlOrKeyword || '').trim();
    if (!raw) {
      return `https://shopee.com.br?aff_id=${SHOPEE_AFFILIATE_ID}&utm_source=an_${SHOPEE_AFFILIATE_ID}&utm_medium=affiliates&utm_campaign=site_afiliados`;
    }

    // Links curtos oficiais da Shopee (s.shopee.com.br / shope.ee) preservam atribuição
    if (raw.includes('s.shopee.com.br') || raw.includes('shope.ee')) {
      return raw;
    }

    // Se for termo de busca ou texto sem protocolo HTTP
    if (isSearch || (!raw.startsWith('http://') && !raw.startsWith('https://'))) {
      const term = encodeURIComponent(raw);
      return `https://shopee.com.br/search?keyword=${term}&aff_id=${SHOPEE_AFFILIATE_ID}&utm_source=an_${SHOPEE_AFFILIATE_ID}&utm_medium=affiliates&utm_campaign=site_afiliados&af_siteid=an_${SHOPEE_AFFILIATE_ID}`;
    }

    // Se for URL de produto do ML e o usuário estiver na loja Shopee, converter para busca na Shopee
    if (raw.includes('mercadolivre.com.br')) {
      return `https://shopee.com.br/search?keyword=ofertas&aff_id=${SHOPEE_AFFILIATE_ID}&utm_source=an_${SHOPEE_AFFILIATE_ID}&utm_medium=affiliates&utm_campaign=site_afiliados`;
    }

    // Limpar parâmetros anteriores para não duplicar
    let cleanUrl = raw.replace(/[?&](aff_id|utm_source|utm_medium|utm_campaign|af_siteid)=[^&]*/g, '');
    cleanUrl = cleanUrl.replace(/\?&/, '?').replace(/&&+/, '&').replace(/[?&]$/, '');

    const sep = cleanUrl.includes('?') ? '&' : '?';
    return `${cleanUrl}${sep}aff_id=${SHOPEE_AFFILIATE_ID}&utm_source=an_${SHOPEE_AFFILIATE_ID}&utm_medium=affiliates&utm_campaign=site_afiliados&af_siteid=an_${SHOPEE_AFFILIATE_ID}`;
  }

  /**
   * Gera a URL canônica de afiliado do Mercado Livre com conjunto quádruplo de parâmetros.
   */
  function buildMlAffiliateUrl(urlOrKeyword, isSearch = false) {
    const raw = (urlOrKeyword || '').trim();
    if (!raw) {
      return `https://www.mercadolivre.com.br/?tracking_id=${ML_AFFILIATE_ID}&affiliate=${ML_AFFILIATE_ID}&matt_tool=${ML_AFFILIATE_ID}&campId=${ML_AFFILIATE_ID}`;
    }

    // Link oficial encurtado do Mercado Livre preserva comissão diretamente
    if (raw.includes('mercadolivre.com/sec/')) {
      return raw;
    }

    // Se for busca ou texto puro
    if (isSearch || (!raw.startsWith('http://') && !raw.startsWith('https://'))) {
      const term = encodeURIComponent(raw);
      return `https://lista.mercadolivre.com.br/${term}?tracking_id=${ML_AFFILIATE_ID}&affiliate=${ML_AFFILIATE_ID}&matt_tool=${ML_AFFILIATE_ID}&campId=${ML_AFFILIATE_ID}`;
    }

    // Se for link da Shopee e usuário estiver no ML, converter para busca no ML
    if (raw.includes('shopee.com.br')) {
      return `https://lista.mercadolivre.com.br/ofertas?tracking_id=${ML_AFFILIATE_ID}&affiliate=${ML_AFFILIATE_ID}&matt_tool=${ML_AFFILIATE_ID}&campId=${ML_AFFILIATE_ID}`;
    }

    // Limpar parâmetros anteriores
    let cleanUrl = raw.replace(/[?&](tracking_id|affiliate|matt_tool|campId|aff_id)=[^&]*/g, '');
    cleanUrl = cleanUrl.replace(/\?&/, '?').replace(/&&+/, '&').replace(/[?&]$/, '');

    const sep = cleanUrl.includes('?') ? '&' : '?';
    return `${cleanUrl}${sep}tracking_id=${ML_AFFILIATE_ID}&affiliate=${ML_AFFILIATE_ID}&matt_tool=${ML_AFFILIATE_ID}&campId=${ML_AFFILIATE_ID}`;
  }

  /**
   * Rastreia o clique (total, loja, data) e abre o link garantindo as comissões.
   */
  function trackAndOpenAffiliate(targetUrl, store, title = 'Produto Afiliado', isSearch = false) {
    const activeStore = store || localStorage.getItem('active_store') || 'ml';
    let finalUrl = '';

    if (activeStore === 'shopee') {
      finalUrl = buildShopeeAffiliateUrl(targetUrl, isSearch);
    } else {
      finalUrl = buildMlAffiliateUrl(targetUrl, isSearch);
    }

    try {
      // 1. Contador total de cliques para o dashboard
      const currentTotal = parseInt(localStorage.getItem('shopee_site_clicks') || '0', 10) || 0;
      localStorage.setItem('shopee_site_clicks', currentTotal + 1);

      // 2. Contador por loja
      const storeKey = activeStore === 'shopee' ? 'clicks_shopee' : 'clicks_ml';
      const storeClicks = parseInt(localStorage.getItem(storeKey) || '0', 10) || 0;
      localStorage.setItem(storeKey, storeClicks + 1);

      // 3. Contador por tipo (busca vs clique em produto)
      const typeKey = isSearch ? 'clicks_search' : 'clicks_products';
      const typeClicks = parseInt(localStorage.getItem(typeKey) || '0', 10) || 0;
      localStorage.setItem(typeKey, typeClicks + 1);

      // 4. Distribuição diária (para o gráfico do painel)
      const today = new Date().toISOString().slice(0, 10);
      let dailyMap = {};
      try {
        dailyMap = JSON.parse(localStorage.getItem('site_daily_clicks') || '{}');
      } catch (e) { dailyMap = {}; }
      dailyMap[today] = (dailyMap[today] || 0) + 1;
      localStorage.setItem('site_daily_clicks', JSON.stringify(dailyMap));

      // 5. Histórico recente de atividades
      let recent = [];
      try {
        recent = JSON.parse(localStorage.getItem('site_recent_clicks') || '[]');
      } catch (e) { recent = []; }
      recent.unshift({
        title: title || (isSearch ? `Consulta: ${targetUrl}` : 'Compra / Produto'),
        store: activeStore === 'shopee' ? 'Shopee' : 'Mercado Livre',
        type: isSearch ? 'Consulta' : 'Compra',
        url: finalUrl,
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString('pt-BR')
      });
      if (recent.length > 50) recent = recent.slice(0, 50);
      localStorage.setItem('site_recent_clicks', JSON.stringify(recent));

      // Disparar evento para atualizar abas abertas do painel
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.warn('Erro ao salvar telemetria de cliques:', e);
    }

    // Abrir em nova aba segura
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  }

  // Expor no escopo global
  window.trackAndOpenAffiliate = trackAndOpenAffiliate;
  window.buildShopeeAffiliateUrl = buildShopeeAffiliateUrl;
  window.buildMlAffiliateUrl = buildMlAffiliateUrl;

  const ML_PRODUCTS_DATA = [
    { id: 1, title: "Samsung Galaxy S23 5G 256GB Preto 8GB RAM", category: "eletronicos", price: "R$ 3.899,00", oldPrice: "R$ 4.599,00", discount: "15% OFF", rating: "4,9", reviews: "2,5k", savings: "Economize R$ 700,00", image: "assets/images/prod-ml-s23.jpg", affiliateUrl: "https://lista.mercadolivre.com.br/samsung-galaxy-s23?tracking_id=91070744&affiliate=91070744&matt_tool=91070744&campId=91070744" },
    { id: 2, title: "Smart TV LG 50\" 4K UHD Wi-Fi Bluetooth", category: "eletronicos", price: "R$ 2.199,00", oldPrice: "R$ 2.899,00", discount: "24% OFF", rating: "4,8", reviews: "1,2k", savings: "Economize R$ 700,00", image: "assets/images/prod-ml-tv.jpg", affiliateUrl: "https://lista.mercadolivre.com.br/smart-tv-lg-50?tracking_id=91070744&affiliate=91070744&matt_tool=91070744&campId=91070744" },
    { id: 3, title: "Tênis Masculino Nike Revolution 6 Preto", category: "moda", price: "R$ 259,90", oldPrice: "R$ 399,90", discount: "35% OFF", rating: "4,7", reviews: "6,1k", savings: "Economize R$ 140,00", image: "assets/images/prod-ml-tenis.jpg", affiliateUrl: "https://lista.mercadolivre.com.br/tenis-nike-revolution?tracking_id=91070744&affiliate=91070744&matt_tool=91070744&campId=91070744" },
    { id: 4, title: "Notebook Lenovo IdeaPad 3 Intel Core i3 4GB 256GB SSD", category: "eletronicos", price: "R$ 2.099,00", oldPrice: "R$ 2.599,00", discount: "19% OFF", rating: "4,8", reviews: "9,8k", savings: "Economize R$ 500,00", image: "assets/images/prod-ml-notebook.jpg", affiliateUrl: "https://lista.mercadolivre.com.br/notebook-lenovo-ideapad?tracking_id=91070744&affiliate=91070744&matt_tool=91070744&campId=91070744" },
    { id: 5, title: "Fritadeira Sem Óleo Air Fryer Mondial 4L", category: "casa", price: "R$ 289,90", oldPrice: "R$ 399,90", discount: "27% OFF", rating: "4,9", reviews: "15,2k", savings: "Economize R$ 110,00", image: "assets/images/prod-ml-airfryer.jpg", affiliateUrl: "https://lista.mercadolivre.com.br/fritadeira-air-fryer-mondial?tracking_id=91070744&affiliate=91070744&matt_tool=91070744&campId=91070744" }
  ];

  const SHOPEE_PRODUCTS_DATA = [
    { id: 101, title: "Fone de Ouvido Bluetooth TWS Pro 5", category: "eletronicos", price: "R$ 29,90", oldPrice: "R$ 59,90", discount: "50% OFF", rating: "4,7", reviews: "10k+", savings: "Frete Grátis", image: "assets/images/prod-fone-tws.png", affiliateUrl: "https://shopee.com.br/search?keyword=fone+bluetooth&aff_id=1836460594&utm_source=an_1836460594&utm_medium=affiliates&utm_campaign=site_afiliados" },
    { id: 102, title: "Fita Led RGB 5 Metros com Controle", category: "casa", price: "R$ 15,90", oldPrice: "R$ 35,00", discount: "54% OFF", rating: "4,8", reviews: "5k+", savings: "Oferta Relâmpago", image: "assets/images/prod-fita-led.jpg", affiliateUrl: "https://shopee.com.br/search?keyword=fita+led&aff_id=1836460594&utm_source=an_1836460594&utm_medium=affiliates&utm_campaign=site_afiliados" },
    { id: 103, title: "Relógio Inteligente Smartwatch D20", category: "eletronicos", price: "R$ 19,90", oldPrice: "R$ 49,90", discount: "60% OFF", rating: "4,6", reviews: "12k+", savings: "Frete Grátis", image: "assets/images/prod-smartwatch.jpg", affiliateUrl: "https://shopee.com.br/search?keyword=smartwatch&aff_id=1836460594&utm_source=an_1836460594&utm_medium=affiliates&utm_campaign=site_afiliados" },
    { id: 104, title: "Mini Processador de Alimentos Elétrico USB", category: "casa", price: "R$ 25,00", oldPrice: "R$ 45,00", discount: "44% OFF", rating: "4,9", reviews: "8k+", savings: "Mais Vendido", image: "assets/images/prod-liquidificador.png", affiliateUrl: "https://shopee.com.br/search?keyword=processador&aff_id=1836460594&utm_source=an_1836460594&utm_medium=affiliates&utm_campaign=site_afiliados" },
    { id: 105, title: "Kit 5 Camisetas Básicas Algodão", category: "moda", price: "R$ 49,90", oldPrice: "R$ 99,00", discount: "50% OFF", rating: "4,8", reviews: "20k+", savings: "Promoção", image: "assets/images/prod-camisetas.jpg", affiliateUrl: "https://shopee.com.br/search?keyword=camiseta&aff_id=1836460594&utm_source=an_1836460594&utm_medium=affiliates&utm_campaign=site_afiliados" }
  ];

  const activeStoreData = localStorage.getItem('active_store') === 'shopee' ? SHOPEE_PRODUCTS_DATA : ML_PRODUCTS_DATA;

  let ALL_PRODUCTS = (window.MERCADOLIVRE_PRODUCTS && Array.isArray(window.MERCADOLIVRE_PRODUCTS) && window.MERCADOLIVRE_PRODUCTS.length > 0)
    ? [...window.MERCADOLIVRE_PRODUCTS]
    : [...activeStoreData];

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

    const activeStore = localStorage.getItem('active_store') || 'ml';
    const storeLabel = activeStore === 'shopee' ? 'Shopee' : 'Mercado Livre';

    if (products.length === 0) {
      const currentQuery = document.getElementById('searchInput') ? document.getElementById('searchInput').value.trim() : '';
      const btnLabel = `Pesquisar "${currentQuery || 'ofertas'}" diretamente no ${storeLabel}`;

      container.innerHTML = `
        <div class="empty-products">
          <p>😕 Nenhuma oferta local encontrada para "${currentQuery || 'este termo'}".</p>
          <button class="btn btn-primary" id="btnEmptySearchRedirect">${btnLabel} →</button>
        </div>
      `;

      const btnEmpty = document.getElementById('btnEmptySearchRedirect');
      if (btnEmpty) {
        btnEmpty.addEventListener('click', () => {
          trackAndOpenAffiliate(currentQuery || 'ofertas', activeStore, `Consulta Externa: "${currentQuery || 'ofertas'}"`, true);
        });
      }
      return;
    }

    container.innerHTML = products.map((prod, i) => {
      const discountTag = prod.discount || '';
      const isWishlisted = wishlist.has(prod.id);
      const finalUrl = activeStore === 'shopee' 
        ? buildShopeeAffiliateUrl(prod.affiliateUrl || prod.title)
        : buildMlAffiliateUrl(prod.affiliateUrl || prod.title);

      return `
        <div class="product-card" data-id="${prod.id}" data-category="${prod.category}" data-title="${encodeURIComponent(prod.title)}" data-url="${encodeURIComponent(prod.affiliateUrl || '')}" style="animation-delay:${i * 0.04}s">
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
            <a href="${finalUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-shopee">
              Ver no ${storeLabel} <span class="arrow">→</span>
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
    const cards = document.querySelectorAll('.product-card, .bestseller-card, .bs-product-card');
    cards.forEach(card => {
      if (card.dataset.hasClickListener === 'true') return;
      card.dataset.hasClickListener = 'true';

      card.addEventListener('click', (e) => {
        // Não interceptar botão de favoritos
        if (e.target.closest('.card-wishlist-btn')) return;

        // Se clicou direto no botão .btn-shopee, o evento global no body já cuidará
        if (e.target.closest('.btn-shopee, .btn-card-action')) return;

        const activeStore = localStorage.getItem('active_store') || 'ml';
        const titleEl = card.querySelector('.card-title, .bestseller-title');
        const title = titleEl ? titleEl.textContent.trim() : 'Produto Afiliado';
        const link = card.querySelector('.btn-shopee, .btn-card-action') || card.querySelector('a');
        const rawHref = link ? link.getAttribute('href') : '';
        const targetUrl = (rawHref && rawHref !== '#') ? rawHref : title;

        trackAndOpenAffiliate(targetUrl, activeStore, title, false);
      });
    });
  }

  async function loadProducts() {
    if (window.SHOPEE_PRODUCTS && Array.isArray(window.SHOPEE_PRODUCTS) && window.SHOPEE_PRODUCTS.length > 0) {
      ALL_PRODUCTS = window.SHOPEE_PRODUCTS;
      applyFilters();
      renderHomeBestSellers();
      return;
    }
    try {
      const res = await fetch('data/products.json?t=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          ALL_PRODUCTS = data;
          applyFilters();
          renderHomeBestSellers();
          return;
        }
      }
    } catch (e) {
      console.warn("Could not load products.json. Using memory products.");
    }
    applyFilters();
    renderHomeBestSellers();
  }

  function renderHomeBestSellers() {
    const homeBsGrid = document.getElementById('homeBestSellers');
    if (!homeBsGrid) return;
    
    // Pick top 5 based on sales logic, or just first 5
    const list = ALL_PRODUCTS.slice(0, 5);
    const activeStore = localStorage.getItem('active_store') || 'ml';
    const storeLabel = activeStore === 'shopee' ? 'Shopee' : 'Mercado Livre';

    homeBsGrid.innerHTML = list.map((prod, i) => {
      const rankNum = i + 1;
      const finalUrl = activeStore === 'shopee' 
        ? buildShopeeAffiliateUrl(prod.affiliateUrl || prod.title)
        : buildMlAffiliateUrl(prod.affiliateUrl || prod.title);

      return `
        <div class="bestseller-card" data-id="${prod.id}" data-title="${encodeURIComponent(prod.title)}" data-url="${encodeURIComponent(prod.affiliateUrl || '')}">
          <div class="rank-number rank-${rankNum}">${rankNum}</div>
          <div class="bestseller-thumb">
            <img src="${prod.image}" alt="${prod.title}" loading="lazy">
          </div>
          <div class="bestseller-info">
            <h3 class="bestseller-title">${prod.title}</h3>
            <div class="bestseller-rating">
              <span class="star">★</span>
              <span class="rate">${prod.rating || '4,8'}</span>
              <span class="count">(${prod.reviews || '2k+'})</span>
            </div>
            <div class="bestseller-pricing">
              <span class="curr">${prod.price}</span>
              ${prod.oldPrice ? `<span class="old">${prod.oldPrice}</span>` : ''}
              ${prod.discount ? `<span class="disc-tag">${prod.discount}</span>` : ''}
            </div>
            <a href="${finalUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-shopee btn-card-action">
              Ver no ${storeLabel}
            </a>
          </div>
        </div>
      `;
    }).join('');

    attachProductClickListeners();
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

  // Global Search Integration & Telemetry
  function performSearch() {
    if (searchInput && searchInput.value.trim().length > 0) {
      const searchTerm = searchInput.value.trim();
      const activeStore = localStorage.getItem('active_store') || 'ml';
      trackAndOpenAffiliate(searchTerm, activeStore, `Consulta: "${searchTerm}"`, true);
    }
  }

  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        performSearch();
      }
    });
  }

  const searchBtn = document.querySelector('.search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', (e) => {
      e.preventDefault();
      performSearch();
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

      const activeStore = localStorage.getItem('active_store') || 'ml';
      const storeLabel = activeStore === 'shopee' ? 'Shopee' : 'Mercado Livre';

      categoryGrid.innerHTML = filtered.map((prod, i) => {
        const isWishlisted = wishlist.has(prod.id);
        const finalUrl = activeStore === 'shopee' 
          ? buildShopeeAffiliateUrl(prod.affiliateUrl || prod.title)
          : buildMlAffiliateUrl(prod.affiliateUrl || prod.title);

        return `
          <div class="product-card" data-id="${prod.id}" data-category="${prod.category}" data-title="${encodeURIComponent(prod.title)}" data-url="${encodeURIComponent(prod.affiliateUrl || '')}" style="animation-delay:${i * 0.05}s">
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
              <a href="${finalUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-shopee">
                Ver no ${storeLabel} <span class="arrow">→</span>
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
        if (cat) {
          selectCategory(cat, true);
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

      const activeStore = localStorage.getItem('active_store') || 'ml';
      const storeLabel = activeStore === 'shopee' ? 'Shopee' : 'Mercado Livre';

      bsGrid.innerHTML = list.map((prod, i) => {
        const isWishlisted = wishlist.has(prod.id);
        const rankNum = i + 1;
        const isTopRank = rankNum <= 5;
        const salesText = salesVolumeMap[i] || `${Math.max(5, 50 - i * 3)}mil+ vendidos`;
        const finalUrl = activeStore === 'shopee' 
          ? buildShopeeAffiliateUrl(prod.affiliateUrl || prod.title)
          : buildMlAffiliateUrl(prod.affiliateUrl || prod.title);

        return `
          <div class="product-card bs-product-card" data-id="${prod.id}" data-title="${encodeURIComponent(prod.title)}" data-url="${encodeURIComponent(prod.affiliateUrl || '')}" style="animation-delay:${i * 0.04}s">
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
              <a href="${finalUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-shopee">
                Ver no ${storeLabel} <span class="arrow">→</span>
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
  // 14. STORE SWITCHER
  // =========================================================================
  const btnStoreML = document.getElementById('btnStoreML');
  const btnStoreShopee = document.getElementById('btnStoreShopee');
  
  // Credentials for Shopee
  window.SHOPEE_CREDENTIALS = {
    AppID: '18364260594',
    Senha: 'VLZ6FTCL3NUSQKCDDKOVDZ3TFTDJXAMU'
  };

  function setStore(storeName, showNotification = false) {
    localStorage.setItem('active_store', storeName);
    
    // Theme and texts
    const body = document.body;
    const brandNames = document.querySelectorAll('.brand-name');
    const brandIcons = document.querySelectorAll('.logo-badge-s');
    const btnLinks = document.querySelectorAll('.btn-shopee, .btn-card-action');

    if (storeName === 'shopee') {
      if (btnStoreShopee) btnStoreShopee.classList.add('active');
      if (btnStoreML) btnStoreML.classList.remove('active');
      if (showNotification) showToast('Mudando para ofertas da Shopee...');
      
      body.classList.add('shopee-theme');
      brandNames.forEach(el => el.textContent = 'Shopee');
      brandIcons.forEach(el => { el.textContent = 'S'; el.style.color = '#fff'; });
      btnLinks.forEach(el => { 
        if(el.innerHTML.includes('Mercado Livre')) {
           el.innerHTML = el.innerHTML.replace('Mercado Livre', 'Shopee'); 
        }
      });
      if(document.title.includes('Mercado Livre')) document.title = document.title.replace('Mercado Livre', 'Shopee');
      
    } else {
      if (btnStoreML) btnStoreML.classList.add('active');
      if (btnStoreShopee) btnStoreShopee.classList.remove('active');
      if (showNotification) showToast('Mudando para ofertas do Mercado Livre...');
      
      body.classList.remove('shopee-theme');
      brandNames.forEach(el => el.textContent = 'Mercado Livre');
      brandIcons.forEach(el => { el.textContent = 'ML'; el.style.color = '#333'; });
      btnLinks.forEach(el => { 
        if(el.innerHTML.includes('Shopee')) {
           el.innerHTML = el.innerHTML.replace('Shopee', 'Mercado Livre'); 
        }
      });
      if(document.title.includes('Shopee')) document.title = document.title.replace('Shopee', 'Mercado Livre');
    }
  }

  if (btnStoreML && btnStoreShopee) {
    btnStoreML.addEventListener('click', () => {
      if (localStorage.getItem('active_store') !== 'ml') {
        localStorage.setItem('active_store', 'ml');
        window.location.reload();
      }
    });
    btnStoreShopee.addEventListener('click', () => {
      if (localStorage.getItem('active_store') !== 'shopee') {
        localStorage.setItem('active_store', 'shopee');
        window.location.reload();
      }
    });
  }

  // Always initialize based on saved preference
  const savedStore = localStorage.getItem('active_store') || 'ml';
  setStore(savedStore, false);

  // =========================================================================
  // 15. DYNAMIC LINK ROUTING & AFFILIATE ATTRIBUTION CAPTURE
  // =========================================================================
  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-shopee, .btn-card-action');
    if (btn) {
      e.preventDefault();
      const activeStore = localStorage.getItem('active_store') || 'ml';
      const card = btn.closest('.product-card, .bestseller-card, .bs-product-card');
      let title = '';
      if (card) {
        const titleEl = card.querySelector('.card-title, .bestseller-title');
        if (titleEl) title = titleEl.textContent.trim();
      }
      const rawHref = btn.getAttribute('href') || (card && card.dataset.url ? decodeURIComponent(card.dataset.url) : '');
      const targetUrl = (rawHref && rawHref !== '#') ? rawHref : title;
      trackAndOpenAffiliate(targetUrl, activeStore, title || 'Produto Afiliado', false);
    }
  });

  // =========================================================================
  // INITIAL LOAD
  // =========================================================================
  loadProducts();
  initCategoriesPage();
  initBestSellersPage();

});


