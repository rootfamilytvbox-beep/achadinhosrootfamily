/**
 * Mercado Livre Afiliados - Authentication & Permissions Engine
 * Handles user login, registration, approval requests, and session protection.
 */

(function(window) {
  const USERS_STORAGE_KEY = 'shopee_dashboard_users';
  const SESSION_STORAGE_KEY = 'shopee_current_user';

  // Seed default admin and sample pending accounts if none exist
  function initUsers() {
    let users = [];
    try {
      users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
    } catch (e) {
      users = [];
    }

    if (!Array.isArray(users) || users.length === 0) {
      users = [
        {
          id: 1,
          name: 'Pedro Henrique',
          email: 'admin@shopee.com',
          password: 'admin',
          role: 'admin',
          status: 'approved', // 'approved', 'pending', 'rejected'
          level: 'Afiliado Nível Bronze',
          avatar: 'assets/images/user-avatar.jpg',
          registeredAt: '01/09/2026'
        },
        {
          id: 2,
          name: 'Carlos Silva',
          email: 'carlos@exemplo.com',
          password: '123',
          role: 'afiliado',
          status: 'pending', // Waiting for admin approval!
          reason: 'Afiliado parceiro de tráfego pago querendo acompanhar os relatórios de conversão.',
          level: 'Novo Membro',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
          registeredAt: '03/09/2026 às 21:45'
        }
      ];
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
    return users;
  }

  function getUsers() {
    initUsers();
    try {
      return JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  }

  function getCurrentUser() {
    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return null;
      const user = JSON.parse(raw);
      // Ensure user is still approved in latest users list
      const all = getUsers();
      const latest = all.find(u => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
      if (!latest || latest.status !== 'approved') {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        return null;
      }
      return latest;
    } catch (e) {
      return null;
    }
  }

  function login(email, password) {
    const users = getUsers();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    const user = users.find(u => u.email.toLowerCase() === cleanEmail && u.password === cleanPass);

    if (!user) {
      return {
        success: false,
        message: 'E-mail ou senha incorretos. Verifique suas credenciais.'
      };
    }

    if (user.status === 'pending') {
      return {
        success: false,
        status: 'pending',
        user: user,
        message: 'Sua conta está criada, mas ainda está AGUARDANDO PERMISSÃO de um administrador. Por favor aguarde a liberação do seu acesso.'
      };
    }

    if (user.status === 'rejected') {
      return {
        success: false,
        status: 'rejected',
        message: 'Seu pedido de acesso ao painel foi recusado pelo administrador.'
      };
    }

    // Login successful
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    return {
      success: true,
      user: user
    };
  }

  function register(name, email, password, reason) {
    const users = getUsers();
    const cleanEmail = (email || '').trim().toLowerCase();

    // Check if email already registered
    const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      if (existing.status === 'pending') {
        return {
          success: false,
          status: 'pending',
          message: 'Este e-mail já possui uma solicitação de cadastro aguardando permissão do administrador.'
        };
      }
      return {
        success: false,
        message: 'Este e-mail já está cadastrado. Tente fazer login.'
      };
    }

    const newUser = {
      id: Date.now(),
      name: name.trim(),
      email: cleanEmail,
      password: password.trim(),
      role: 'afiliado',
      status: 'pending', // Requires approval!
      reason: (reason || 'Solicitação de acesso padrão ao dashboard de afiliados.').trim(),
      level: 'Aguardando Permissão',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      registeredAt: new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    users.push(newUser);
    saveUsers(users);

    return {
      success: true,
      user: newUser,
      message: 'Cadastro recebido com sucesso! Como medida de segurança, o acesso ao painel requer aprovação prévia do administrador. Sua solicitação já está na fila.'
    };
  }

  function approveUser(userId) {
    const users = getUsers();
    const user = users.find(u => u.id === Number(userId));
    if (!user) return false;
    user.status = 'approved';
    user.level = user.level === 'Aguardando Permissão' ? 'Afiliado Iniciante' : user.level;
    saveUsers(users);
    return true;
  }

  function rejectUser(userId) {
    const users = getUsers();
    const user = users.find(u => u.id === Number(userId));
    if (!user) return false;
    user.status = 'rejected';
    saveUsers(users);
    return true;
  }

  function deleteUser(userId) {
    let users = getUsers();
    users = users.filter(u => u.id !== Number(userId));
    saveUsers(users);
    return true;
  }

  function logout() {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    window.location.href = 'login.html';
  }

  function getPendingUsers() {
    const users = getUsers();
    return users.filter(u => u.status === 'pending');
  }

  function requireAuth() {
    const user = getCurrentUser();
    if (!user) {
      window.location.href = 'login.html';
      return null;
    }
    return user;
  }

  // Auto initialize
  initUsers();

  window.Mercado LivreAuth = {
    getUsers,
    getCurrentUser,
    login,
    register,
    approveUser,
    rejectUser,
    deleteUser,
    logout,
    getPendingUsers,
    requireAuth
  };
})(window);
