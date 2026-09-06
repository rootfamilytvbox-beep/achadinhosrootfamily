/**
 * Mercado Livre Afiliados - Dashboard Interactive Engine
 * Handles charts, real-time metrics tracking, affiliate link generator, and clipboard copying
 */

document.addEventListener('DOMContentLoaded', () => {
  // Check authentication
  const currentUser = window.Mercado LivreAuth ? window.Mercado LivreAuth.requireAuth() : null;
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

  const AFFILIATE_ID = '1836460594';

  // =========================================================================
  // 1. PERFORMANCE MULTI-LINE CHART
  // =========================================================================
  const perfCanvas = document.getElementById('performanceChart');
  let perfChart = null;

  if (perfCanvas) {
    const ctx = perfCanvas.getContext('2d');

    const labels7d = ['17/05', '18/05', '19/05', '20/05', '21/05', '22/05', '23/05'];

    // Data starting at zero
    const dataCliques = [0, 0, 0, 0, 0, 0, 0];
    const dataConversoes = [0, 0, 0, 0, 0, 0, 0];
    const dataComissoes = [0, 0, 0, 0, 0, 0, 0];

    perfChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels7d,
        datasets: [
          {
            label: 'Cliques',
            data: dataCliques,
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
            data: dataConversoes,
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
            data: dataComissoes,
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
            display: false // We use custom HTML legend matching screenshot
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
                  label += 'R$ ' + context.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
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
            min: 0,
            max: 20,
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
        labels: ['Sem vendas'],
        datasets: [{
          data: [1],
          backgroundColor: ['#222b3d'],
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
            borderWidth: 1,
            callbacks: {
              label: function() {
                return ' R$ 0,00 (0%)';
              }
            }
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
  const inputMercado LivreUrl = document.getElementById('inputMercado LivreUrl');
  const inputProductName = document.getElementById('inputProductName');
  const resultBox = document.getElementById('resultGeneratedBox');
  const outputLink = document.getElementById('generatedLinkOutput');
  const btnCopyGenerated = document.getElementById('btnCopyGeneratedLink');

  if (btnOpenModal && modal) {
    btnOpenModal.addEventListener('click', () => {
      modal.classList.add('active');
      if (inputMercado LivreUrl) inputMercado LivreUrl.focus();
    });
  }

  if (btnCloseModal && modal) {
    btnCloseModal.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  // Close when clicking outside modal content
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  }

  if (btnProcessNewLink) {
    btnProcessNewLink.addEventListener('click', () => {
      const rawUrl = inputMercado LivreUrl.value.trim();
      if (!rawUrl) {
        alert('Por favor, cole um link de produto da Mercado Livre.');
        return;
      }

      try {
        let finalUrl = rawUrl;
        const separator = finalUrl.includes('?') ? '&' : '?';
        if (!finalUrl.includes('aff_id=')) {
          finalUrl = `${finalUrl}${separator}aff_id=${AFFILIATE_ID}`;
        }

        outputLink.textContent = finalUrl;
        resultBox.style.display = 'block';

        // Add to monitored links if title provided
        const title = inputProductName.value.trim() || 'Novo Produto Mercado Livre';
        addNewAffiliateLinkCard(title, finalUrl);

        showToast('Link de afiliado gerado com seu ID!');
      } catch (err) {
        console.error(err);
      }
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

  function addNewAffiliateLinkCard(title, url) {
    const list = document.getElementById('affLinksList');
    if (!list) return;

    const div = document.createElement('div');
    div.className = 'aff-link-card';
    div.innerHTML = `
      <div class="aff-link-info">
        <h4 class="aff-link-title">${title}</h4>
        <div class="aff-link-url-row">
          <a href="${url}" target="_blank" class="aff-url-text">${url}</a>
          <button class="btn-copy-link" data-url="${url}" title="Copiar link">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
        </div>
      </div>
      <div class="aff-link-stat">
        <div class="aff-stat-num">1</div>
        <div class="aff-stat-label">cliques</div>
      </div>
    `;

    const copyBtn = div.querySelector('.btn-copy-link');
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(url).then(() => showToast('Link copiado!'));
    });

    list.prepend(div);
  }

  // =========================================================================
  // 6. REAL SITE MONITORING INTEGRATION
  // =========================================================================
  // Sync real clicks tracked from the affiliate storefront if available
  function syncRealSiteData() {
    try {
      const rawClicks = localStorage.getItem('shopee_site_clicks');
      const clicks = rawClicks ? (parseInt(rawClicks, 10) || 0) : 0;
      const cliquesEl = document.getElementById('kpiCliques');
      if (cliquesEl) {
        cliquesEl.textContent = clicks.toLocaleString('pt-BR');
      }
    } catch (e) {
      console.warn('Sync live data failed:', e);
    }
  }

  syncRealSiteData();

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
      const referralLink = `https://shopee.com.br/m/afiliados?ref=${AFFILIATE_ID}`;
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
      showToast('Perfil de Afiliado Nível Bronze • ID: ' + AFFILIATE_ID);
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
        window.Mercado LivreAuth.logout();
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
      const allUsers = window.Mercado LivreAuth.getUsers();
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
                    <div class="user-req-email">${user.email} • Solicitado em ${user.registeredAt || 'Hoje'}</div>
                  </div>
                </div>
                <span class="user-status-pill status-pending">Aguardando Permissão</span>
              </div>
              <div class="user-req-reason">
                <strong>Motivo:</strong>
                <span>${user.reason || 'Acesso para acompanhar relatórios e métricas de afiliados.'}</span>
              </div>
              <div class="user-req-actions">
                <button type="button" class="btn-action-reject" data-reject-id="${user.id}">Recusar</button>
                <button type="button" class="btn-action-approve" data-approve-id="${user.id}">✅ Liberar Permissão</button>
              </div>
            </div>
          `).join('');

          // Attach action listeners
          pendingListEl.querySelectorAll('[data-approve-id]').forEach(btn => {
            btn.addEventListener('click', () => {
              const uid = btn.getAttribute('data-approve-id');
              window.Mercado LivreAuth.approveUser(uid);
              showToast('Permissão de acesso concedida com sucesso!');
              renderPermissionsLists();
            });
          });

          pendingListEl.querySelectorAll('[data-reject-id]').forEach(btn => {
            btn.addEventListener('click', () => {
              const uid = btn.getAttribute('data-reject-id');
              window.Mercado LivreAuth.rejectUser(uid);
              showToast('Solicitação de acesso recusada.');
              renderPermissionsLists();
            });
          });
        }
      }

      // Render Approved
      if (approvedListEl) {
        approvedListEl.innerHTML = approved.map(user => `
          <div class="user-req-card" style="padding: 10px 14px;">
            <div class="user-req-header">
              <div class="user-req-info">
                <img src="${user.avatar || 'assets/images/user-avatar.jpg'}" alt="${user.name}" class="user-req-avatar" style="width: 32px; height: 32px;">
                <div>
                  <div class="user-req-name" style="font-size: 13px;">${user.name} ${user.role === 'admin' ? '<span style="color:#ffe600; font-size:11px;">(Admin)</span>' : ''}</div>
                  <div class="user-req-email">${user.email} • ${user.level || 'Afiliado'}</div>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span class="user-status-pill status-approved">Acesso Liberado</span>
                ${user.role !== 'admin' ? `
                  <button type="button" class="btn-action-delete" data-delete-id="${user.id}" title="Excluir ou revogar">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        `).join('');

        approvedListEl.querySelectorAll('[data-delete-id]').forEach(btn => {
          btn.addEventListener('click', () => {
            const uid = btn.getAttribute('data-delete-id');
            if (confirm('Deseja realmente revogar o acesso deste usuário?')) {
              window.Mercado LivreAuth.deleteUser(uid);
              showToast('Acesso revogado.');
              renderPermissionsLists();
            }
          });
        });
      }
    }

    // Initial badge update
    const pendingInitial = window.Mercado LivreAuth.getPendingUsers();
    updatePendingBadges(pendingInitial.length);
  }
});
