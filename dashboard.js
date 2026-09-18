/**
 * Mercado Livre Afiliados - Dashboard Interactive Engine
 * Handles charts, real-time metrics tracking, affiliate link generator, and clipboard copying
 */

document.addEventListener('DOMContentLoaded', () => {
  // Check authentication
  const currentUser = window.MercadoLivreAuth ? window.MercadoLivreAuth.requireAuth() : null;
  if (!currentUser) return; // Will redirect to login.html

  // Update header and profile with logged in user's information
  const greetingEl = document.querySelector('.header-greeting h1');
  if (greetingEl) {
    greetingEl.innerHTML = `Olá, ${currentUser.name}! 👋`;
  }

  const profileNameEl = document.querySelector('.profile-name');
  if (profileNameEl) {
    profileNameEl.textContent = currentUser.name;
  }

  const profileBadgeEl = document.querySelector('.profile-badge');
  if (profileBadgeEl) {
    profileBadgeEl.textContent = currentUser.level || (currentUser.role === 'admin' ? 'Administrador Master' : 'Afiliado Bronze');
  }

  if (currentUser.avatar) {
    document.querySelectorAll('.profile-avatar, .header-avatar').forEach(img => {
      img.src = currentUser.avatar;
    });
  }

  const ML_AFFILIATE_ID = '91070744';
  const SHOPEE_AFFILIATE_ID = '1836460594';

  function getLast7Days() {
    const labels = [];
    const keys = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      labels.push(`${dd}/${mm}`);
      keys.push(d.toISOString().slice(0, 10));
    }
    return { labels, keys };
  }

  function get7DaysData() {
    const { labels, keys } = getLast7Days();
    let dailyMap = {};
    try {
      dailyMap = JSON.parse(localStorage.getItem('site_daily_clicks') || '{}');
    } catch (e) { dailyMap = {}; }

    const clicks = keys.map(k => dailyMap[k] || 0);
    const convs = clicks.map(c => Math.round(c * 0.025));
    const comms = convs.map(cv => parseFloat((cv * 6.50).toFixed(2)));

    return { labels, clicks, convs, comms };
  }

  // =========================================================================
  // 1. PERFORMANCE MULTI-LINE CHART
  // =========================================================================
  const perfCanvas = document.getElementById('performanceChart');
  let perfChart = null;

  if (perfCanvas) {
    const ctx = perfCanvas.getContext('2d');
    const initial7d = get7DaysData();

    perfChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: initial7d.labels,
        datasets: [
          {
            label: 'Cliques',
            data: initial7d.clicks,
            borderColor: '#5c5be5',
            backgroundColor: 'transparent',
            borderWidth: 2.5,
            pointBackgroundColor: '#5c5be5',
            pointBorderColor: '#0f141f',
            pointBorderWidth: 2,
            pointRadius: 3.5,
            pointHoverRadius: 6,
            tension: 0.42
          },
          {
            label: 'Conversões',
            data: initial7d.convs,
            borderColor: '#10b981',
            backgroundColor: 'transparent',
            borderWidth: 2.5,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#0f141f',
            pointBorderWidth: 2,
            pointRadius: 3.5,
            pointHoverRadius: 6,
            tension: 0.42
          },
          {
            label: 'Comissões (R$)',
            data: initial7d.comms,
            borderColor: '#ffe600',
            backgroundColor: 'transparent',
            borderWidth: 2.5,
            pointBackgroundColor: '#ffe600',
            pointBorderColor: '#0f141f',
            pointBorderWidth: 2,
            pointRadius: 3.5,
            pointHoverRadius: 6,
            tension: 0.42
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#161e2e',
            titleColor: '#ffffff',
            bodyColor: '#c9d5e8',
            borderColor: '#2b384f',
            borderWidth: 1,
            padding: 10,
            boxPadding: 4,
            usePointStyle: true,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.dataset.label.includes('Comissões')) {
                  label += 'R$ ' + context.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                } else {
                  label += context.parsed.y.toLocaleString('pt-BR');
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.03)',
              drawBorder: false
            },
            ticks: {
              color: '#657794',
              font: {
                family: "'Plus Jakarta Sans', sans-serif",
                size: 11
              }
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 5,
              color: '#657794',
              font: {
                family: "'Plus Jakarta Sans', sans-serif",
                size: 11
              },
              callback: function(value) {
                return value;
              }
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
              drawBorder: false
            }
          }
        }
      }
    });
  }

  // =========================================================================
  // 2. COMMISSIONS DONUT CHART
  // =========================================================================
  const donutCanvas = document.getElementById('commissionsDonutChart');
  let donutChart = null;

  if (donutCanvas) {
    const ctxDonut = donutCanvas.getContext('2d');

    donutChart = new Chart(ctxDonut, {
      type: 'doughnut',
      data: {
        labels: ['Mercado Livre', 'Shopee'],
        datasets: [{
          data: [1, 1],
          backgroundColor: ['#ffe600', '#ee4d2d'],
          borderWidth: 2,
          borderColor: '#151a26'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '74%',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#161e2e',
            titleColor: '#ffffff',
            bodyColor: '#c9d5e8',
            borderColor: '#2b384f',
            borderWidth: 1
          }
        }
      }
    });
  }

  // =========================================================================
  // 3. TOAST NOTIFICATION SYSTEM
  // =========================================================================
  const toast = document.getElementById('dashboardToast');
  const toastMsg = document.getElementById('toastMsg');
  let toastTimer = null;

  function showToast(message) {
    if (!toast) return;
    toastMsg.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  // =========================================================================
  // 4. COPY TO CLIPBOARD
  // =========================================================================
  document.querySelectorAll('.btn-copy-link').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const url = btn.getAttribute('data-url');
      if (url) {
        navigator.clipboard.writeText(url).then(() => {
          showToast('Link copiado com sucesso!');
        }).catch(() => {
          showToast('Erro ao copiar link.');
        });
      }
    });
  });

  // =========================================================================
  // 5. MODAL: GERAR NOVO LINK DE AFILIADO
  // =========================================================================
  const modal = document.getElementById('generateModal');
  const btnOpenModal = document.getElementById('btnOpenGenerateModal');
  const btnCloseModal = document.getElementById('btnCloseGenerateModal');
  const btnProcessNewLink = document.getElementById('btnProcessNewLink');
  const selectPlatform = document.getElementById('selectAffiliatePlatform');
  const inputProductUrl = document.getElementById('inputProductUrl');
  const inputProductName = document.getElementById('inputProductName');
  const resultBox = document.getElementById('resultGeneratedBox');
  const outputLink = document.getElementById('generatedLinkOutput');
  const btnCopyGenerated = document.getElementById('btnCopyGeneratedLink');

  if (btnOpenModal && modal) {
    btnOpenModal.addEventListener('click', () => {
      modal.classList.add('active');
      if (inputProductUrl) inputProductUrl.focus();
    });
  }

  if (btnCloseModal && modal) {
    btnCloseModal.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  }

  if (btnProcessNewLink) {
    btnProcessNewLink.addEventListener('click', () => {
      const rawUrl = inputProductUrl ? inputProductUrl.value.trim() : '';
      if (!rawUrl) {
        alert('Por favor, cole um link de produto ou termo de busca.');
        return;
      }

      const platform = selectPlatform ? selectPlatform.value : 'ml';
      let finalUrl = '';

      if (platform === 'shopee') {
        finalUrl = window.buildShopeeAffiliateUrl 
          ? window.buildShopeeAffiliateUrl(rawUrl)
          : `https://shopee.com.br/search?keyword=${encodeURIComponent(rawUrl)}&aff_id=${SHOPEE_AFFILIATE_ID}&utm_source=an_${SHOPEE_AFFILIATE_ID}&utm_medium=affiliates&utm_campaign=site_afiliados`;
      } else {
        finalUrl = window.buildMlAffiliateUrl 
          ? window.buildMlAffiliateUrl(rawUrl)
          : `https://lista.mercadolivre.com.br/${encodeURIComponent(rawUrl)}?tracking_id=${ML_AFFILIATE_ID}&affiliate=${ML_AFFILIATE_ID}&matt_tool=${ML_AFFILIATE_ID}&campId=${ML_AFFILIATE_ID}`;
      }

      outputLink.textContent = finalUrl;
      resultBox.style.display = 'block';

      const title = (inputProductName ? inputProductName.value.trim() : '') || (platform === 'shopee' ? 'Produto Shopee' : 'Produto Mercado Livre');
      addNewAffiliateLinkCard(title, finalUrl, platform === 'shopee' ? 'Shopee' : 'Mercado Livre');

      showToast(`Link de afiliado gerado com comissão garantida para ${platform === 'shopee' ? 'Shopee' : 'Mercado Livre'}!`);
    });
  }

  if (btnCopyGenerated) {
    btnCopyGenerated.addEventListener('click', () => {
      const url = outputLink.textContent;
      if (url) {
        navigator.clipboard.writeText(url).then(() => {
          showToast('Link copiado para a área de transferência!');
        });
      }
    });
  }

  function addNewAffiliateLinkCard(title, url, store = 'Mercado Livre') {
    const list = document.getElementById('affLinksList');
    if (!list) return;

    if (list.textContent.includes('Aguardando cliques')) {
      list.innerHTML = '';
    }

    const div = document.createElement('div');
    div.className = 'aff-link-card';
    div.innerHTML = `
      <div class="aff-link-info">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 3px;">
          <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; background: ${store === 'Shopee' ? 'rgba(238,77,45,0.2)' : 'rgba(255,230,0,0.2)'}; color: ${store === 'Shopee' ? '#ee4d2d' : '#ffe600'};">
            ${store}
          </span>
          <span style="font-size: 10px; color: var(--text-muted);">Novo link gerado</span>
        </div>
        <h4 class="aff-link-title">${title}</h4>
        <div class="aff-link-url-row">
          <a href="${url}" target="_blank" rel="noopener noreferrer" class="aff-url-text">${url}</a>
          <button class="btn-copy-link" data-url="${url}" title="Copiar link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
        </div>
      </div>
      <div class="aff-link-stat">
        <div class="aff-stat-num">1</div>
        <div class="aff-stat-label">clique</div>
      </div>
    `;

    const copyBtn = div.querySelector('.btn-copy-link');
    copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(url).then(() => showToast('Link copiado!'));
    });

    list.prepend(div);
  }

  // =========================================================================
  // 6. REAL SITE MONITORING INTEGRATION & TELEMETRY
  // =========================================================================
  function renderRecentActivity() {
    const list = document.getElementById('affLinksList');
    if (!list) return;

    let recent = [];
    try {
      recent = JSON.parse(localStorage.getItem('site_recent_clicks') || '[]');
    } catch (e) { recent = []; }

    if (recent.length === 0) return;

    list.innerHTML = recent.slice(0, 6).map(item => `
      <div class="aff-link-card">
        <div class="aff-link-info">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 3px;">
            <span style="font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; background: ${item.store === 'Shopee' ? 'rgba(238,77,45,0.2)' : 'rgba(255,230,0,0.2)'}; color: ${item.store === 'Shopee' ? '#ee4d2d' : '#ffe600'};">
              ${item.store}
            </span>
            <span style="font-size: 10px; color: var(--text-muted);">${item.type} • ${item.time} (${item.date})</span>
          </div>
          <h4 class="aff-link-title">${item.title}</h4>
          <div class="aff-link-url-row">
            <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="aff-url-text">${item.url}</a>
            <button class="btn-copy-link" data-url="${item.url}" title="Copiar link rastreado">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
          </div>
        </div>
        <div class="aff-link-stat">
          <div class="aff-stat-num">1</div>
          <div class="aff-stat-label">clique</div>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('.btn-copy-link').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const url = btn.dataset.url;
        if (url) {
          navigator.clipboard.writeText(url).then(() => showToast('Link rastreado copiado!'));
        }
      });
    });
  }

  function syncRealSiteData() {
    try {
      const rawClicks = localStorage.getItem('shopee_site_clicks');
      const clicks = rawClicks ? (parseInt(rawClicks, 10) || 0) : 0;
      const conversoes = Math.round(clicks * 0.025);
      const comissoes = conversoes * 6.50;

      const cliquesEl = document.getElementById('kpiCliques');
      if (cliquesEl) {
        cliquesEl.textContent = clicks.toLocaleString('pt-BR');
      }

      const convEl = document.getElementById('kpiConversoes');
      if (convEl) {
        convEl.textContent = conversoes.toLocaleString('pt-BR');
      }

      const comissEl = document.getElementById('kpiComissoes');
      if (comissEl) {
        comissEl.textContent = `R$ ${comissoes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }

      const pedidosEl = document.getElementById('kpiPedidos');
      if (pedidosEl) {
        pedidosEl.textContent = conversoes.toLocaleString('pt-BR');
      }

      const statClicks = document.getElementById('statMonitoredClicks');
      if (statClicks) {
        statClicks.textContent = clicks.toLocaleString('pt-BR');
      }

      // Atualizar donut chart com proporção entre ML e Shopee
      if (donutChart) {
        const clicksShopee = parseInt(localStorage.getItem('clicks_shopee') || '0', 10) || 0;
        const clicksMl = parseInt(localStorage.getItem('clicks_ml') || '0', 10) || 0;
        if (clicksShopee > 0 || clicksMl > 0) {
          donutChart.data.datasets[0].data = [clicksMl || 1, clicksShopee || 1];
          donutChart.update();
        }
      }

      // Atualizar gráfico de linha com dados dos últimos 7 dias
      if (perfChart) {
        const { labels, clicks: cData, convs: cvData, comms: cmData } = get7DaysData();
        perfChart.data.labels = labels;
        perfChart.data.datasets[0].data = cData;
        perfChart.data.datasets[1].data = cvData;
        perfChart.data.datasets[2].data = cmData;
        perfChart.update();
      }

      renderRecentActivity();
    } catch (e) {
      console.warn('Sync live data failed:', e);
    }
  }

  syncRealSiteData();

  // Escutar eventos para atualizar em tempo real quando o usuário clicar no site
  window.addEventListener('storage', syncRealSiteData);
  window.addEventListener('affiliate_click_recorded', syncRealSiteData);

  // =========================================================================
  // 7. RESPONSIVE MOBILE SIDEBAR TOGGLE
  // =========================================================================
  const mobileToggle = document.getElementById('mobileNavToggle');
  const sidebar = document.getElementById('sidebar');

  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && !mobileToggle.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }

  // =========================================================================
  // 8. INTERACTIVE BUTTONS (CONVIDAR, PERFIL, NOTIFICAÇÃO)
  // =========================================================================
  const btnInvite = document.getElementById('btnInvite');
  if (btnInvite) {
    btnInvite.addEventListener('click', () => {
      const referralLink = `https://www.mercadolivre.com.br/afiliados?ref=${ML_AFFILIATE_ID}`;
      navigator.clipboard.writeText(referralLink).then(() => {
        showToast('Link de convite de afiliados copiado!');
      });
    });
  }

  const btnNotification = document.getElementById('btnNotification');
  if (btnNotification) {
    btnNotification.addEventListener('click', () => {
      showToast('Nenhuma notificação nova no momento.');
    });
  }

  const btnVerPerfil = document.getElementById('btnVerPerfil');
  if (btnVerPerfil) {
    btnVerPerfil.addEventListener('click', (e) => {
      e.preventDefault();
      showToast(`Perfil de Afiliado Master • ML: ${ML_AFFILIATE_ID} | Shopee: ${SHOPEE_AFFILIATE_ID}`);
    });
  }

  // =========================================================================
  // 9. AUTH LOGOUT & PERMISSIONS MANAGEMENT (ADMIN)
  // =========================================================================
  const navSair = document.getElementById('navSair');
  if (navSair) {
    navSair.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Deseja realmente sair do painel?')) {
        window.MercadoLivreAuth.logout();
      }
    });
  }

  // Check if current user is admin to enable permissions management
  if (currentUser.role === 'admin') {
    const navItemPermissions = document.getElementById('navItemPermissions');
    const btnHeaderPermissions = document.getElementById('btnHeaderPermissions');
    const permissionsModal = document.getElementById('permissionsModal');
    const btnClosePermissionsModal = document.getElementById('btnClosePermissionsModal');
    const navPermissoesLink = document.getElementById('navPermissoesLink');

    if (navItemPermissions) navItemPermissions.style.display = 'block';
    if (btnHeaderPermissions) btnHeaderPermissions.style.display = 'flex';

    function openPermissionsModal() {
      renderPermissionsLists();
      permissionsModal.classList.add('active');
    }

    function closePermissionsModal() {
      permissionsModal.classList.remove('active');
    }

    if (btnHeaderPermissions) btnHeaderPermissions.addEventListener('click', openPermissionsModal);
    if (navPermissoesLink) navPermissoesLink.addEventListener('click', (e) => {
      e.preventDefault();
      openPermissionsModal();
    });
    if (btnClosePermissionsModal) btnClosePermissionsModal.addEventListener('click', closePermissionsModal);

    if (permissionsModal) {
      permissionsModal.addEventListener('click', (e) => {
        if (e.target === permissionsModal) closePermissionsModal();
      });
    }

    function updatePendingBadges(pendingCount) {
      const b1 = document.getElementById('headerPendingCount');
      const b2 = document.getElementById('sidebarPendingCount');
      const b3 = document.getElementById('pendingSectionCount');
      if (b1) b1.textContent = pendingCount;
      if (b2) b2.textContent = pendingCount;
      if (b3) b3.textContent = `${pendingCount} pendente${pendingCount !== 1 ? 's' : ''}`;
    }

    function renderPermissionsLists() {
      const allUsers = window.MercadoLivreAuth.getUsers();
      const pending = allUsers.filter(u => u.status === 'pending');
      const approved = allUsers.filter(u => u.status === 'approved');

      updatePendingBadges(pending.length);

      const pendingListEl = document.getElementById('pendingUsersList');
      const approvedListEl = document.getElementById('approvedUsersList');
      const approvedCountEl = document.getElementById('approvedSectionCount');

      if (approvedCountEl) approvedCountEl.textContent = `${approved.length} ativo${approved.length !== 1 ? 's' : ''}`;

      // Render Pending
      if (pendingListEl) {
        if (pending.length === 0) {
          pendingListEl.innerHTML = `<div class="empty-req-notice">Nenhuma solicitação de permissão pendente no momento. Novos cadastros aparecerão aqui.</div>`;
        } else {
          pendingListEl.innerHTML = pending.map(user => `
            <div class="user-req-card" data-user-id="${user.id}">
              <div class="user-req-header">
                <div class="user-req-info">
                  <img src="${user.avatar || 'assets/images/user-avatar.jpg'}" alt="${user.name}" class="user-req-avatar">
                  <div>
                    <div class="user-req-name">${user.name}</div>
                    <div class="user-req-email">${user.email}</div>
                  </div>
                </div>
                <div class="user-req-badge">Aguardando Aprovação</div>
              </div>
              ${user.reason ? `<div class="user-req-reason"><strong>Motivo:</strong> "${user.reason}"</div>` : ''}
              <div class="user-req-time">Solicitado em: ${user.registeredAt || 'Recentemente'}</div>
              <div class="user-req-actions">
                <button class="btn-req-approve" data-user-id="${user.id}">Aprovar Acesso</button>
                <button class="btn-req-reject" data-user-id="${user.id}">Recusar</button>
              </div>
            </div>
          `).join('');

          // Attach Approve / Reject listeners
          pendingListEl.querySelectorAll('.btn-req-approve').forEach(btn => {
            btn.addEventListener('click', () => {
              const userId = parseInt(btn.dataset.userId);
              const res = window.MercadoLivreAuth.approveUser(userId);
              if (res.success) {
                showToast(`Acesso aprovado para ${res.user.name}!`);
                renderPermissionsLists();
              }
            });
          });

          pendingListEl.querySelectorAll('.btn-req-reject').forEach(btn => {
            btn.addEventListener('click', () => {
              const userId = parseInt(btn.dataset.userId);
              if (confirm('Deseja realmente recusar esta solicitação?')) {
                const res = window.MercadoLivreAuth.rejectUser(userId);
                if (res.success) {
                  showToast('Solicitação recusada.');
                  renderPermissionsLists();
                }
              }
            });
          });
        }
      }

      // Render Approved
      if (approvedListEl) {
        approvedListEl.innerHTML = approved.map(user => `
          <div class="approved-user-item">
            <div class="user-req-info">
              <img src="${user.avatar || 'assets/images/user-avatar.jpg'}" alt="${user.name}" class="user-req-avatar">
              <div>
                <div class="user-req-name">${user.name} ${user.id === currentUser.id ? '<span style="font-size: 11px; color: var(--color-purple); font-weight: normal;">(Você)</span>' : ''}</div>
                <div class="user-req-email">${user.email}</div>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="status-pill status-pill-active">${user.role === 'admin' ? '👑 Admin' : 'Afiliado'}</span>
              ${user.id !== currentUser.id && user.id !== 1 ? `
                <button class="btn-req-revoke" data-user-id="${user.id}" title="Revogar acesso">Revogar</button>
              ` : ''}
            </div>
          </div>
        `).join('');

        approvedListEl.querySelectorAll('.btn-req-revoke').forEach(btn => {
          btn.addEventListener('click', () => {
            const userId = parseInt(btn.dataset.userId);
            if (confirm('Deseja realmente revogar o acesso deste usuário?')) {
              const res = window.MercadoLivreAuth.rejectUser(userId);
              if (res.success) {
                showToast('Acesso revogado.');
                renderPermissionsLists();
              }
            }
          });
        });
      }
    }
  }

});
