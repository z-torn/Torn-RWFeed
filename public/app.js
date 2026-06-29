const CONFIG = {
  API_BASE: 'https://tornrwfeed.onrender.com',
};

const state = {
  apiKey: null,
  sessionToken: null,
  faction: null,
  war: null,
  enemies: [],
  targets: [],
  currentTab: 'targets',
  ws: null,
  pingTimer: null
};

const api = {
  async request(endpoint, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (state.sessionToken) headers['Authorization'] = `Bearer ${state.sessionToken}`;

    const response = await fetch(`${CONFIG.API_BASE}${endpoint}`, { ...options, headers });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `HTTP ${response.status}`);
    }
    return await response.json();
  }
};

// --- UI Controls ---

function showView(viewName) {
  document.getElementById('login-view').classList.toggle('hidden-view', viewName !== 'login');
  document.getElementById('dashboard-view').classList.toggle('hidden-view', viewName !== 'dashboard');
}

function showError(message) {
  const banner = document.getElementById('error-banner');
  document.getElementById('error-message').textContent = message;
  banner.classList.remove('hidden');
  setTimeout(() => banner.classList.add('hidden'), 5000);
}

function init() {
  const savedKey = localStorage.getItem('torn_api_key');
  const savedToken = localStorage.getItem('torn_session_token');
  
  if (savedKey && savedToken) {
    state.apiKey = savedKey;
    state.sessionToken = savedToken;
    showView('dashboard');
    loadDashboard();
  } else {
    showView('login');
  }

  document.getElementById('login-form').addEventListener('submit', handleLogin);
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  document.getElementById('refresh-btn').addEventListener('click', handleRefresh);
  
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

// --- WebSocket Logic ---

function loadDashboard() {
  console.log('Dashboard loaded, starting connection...');
  connectWebSocket();
}

function handleRefresh() {
  console.log('Manual refresh triggered');
  connectWebSocket();
}

function connectWebSocket() {
  if (state.ws) state.ws.close();
  if (state.pingTimer) clearInterval(state.pingTimer);

  const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  const wsUrl = `${protocol}://tornrwfeed.onrender.com/wars/socket?token=${state.sessionToken}`;

  try {
    state.ws = new WebSocket(wsUrl);

    state.ws.onopen = () => {
      console.log('✅ WebSocket connected');
      
      // NUDGE: Send an initial request for data if the server expects one
      // You might need to change 'get_status' to whatever your C++ backend expects
      state.ws.send(JSON.stringify({ type: 'get_status' })); 
      
      state.pingTimer = setInterval(() => {
        if (state.ws.readyState === WebSocket.OPEN) {
          state.ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 20000);
    };

    state.ws.onmessage = (event) => handleWebSocketMessage(event.data);

    state.ws.onclose = (event) => {
      console.warn(`⚠️ WebSocket closed: ${event.code}`);
      if (state.pingTimer) clearInterval(state.pingTimer);
      if (event.code !== 1000) setTimeout(connectWebSocket, 5000);
    };
  } catch (e) {
    console.error('Connection failed', e);
  }
}

function handleWebSocketMessage(data) {
  try {
    if (data === 'pong') return;
    const msg = JSON.parse(data);
    if (msg.war) updateWarStatus(msg.war);
    if (msg.members) renderMembers(msg.members);
    if (msg.targets) renderTargets(msg.targets);
    if (msg.error) showError(msg.error);
  } catch (e) { console.error('Parse error', e); }
}

// --- Auth & Handlers ---

async function handleLogin(e) {
  e.preventDefault();
  const tornKey = document.getElementById('api-key').value.trim();
  try {
    const res = await api.request(`/auth?torn_key=${encodeURIComponent(tornKey)}`);
    state.sessionToken = res.api_key;
    localStorage.setItem('torn_api_key', tornKey);
    localStorage.setItem('torn_session_token', res.api_key);
    showView('dashboard');
    loadDashboard();
  } catch (e) {
    showError('Auth failed');
  }
}

function handleLogout() {
  if (state.ws) state.ws.close();
  localStorage.clear();
  showView('login');
}

function switchTab(tabName) {
  state.currentTab = tabName;
  document.querySelectorAll('.tab-content').forEach(el => el.classList.toggle('hidden-view', !el.id.includes(tabName)));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
}

// --- Renderers ---

function updateWarStatus(war) {
  const statusEl = document.getElementById('war-status');
  if (!war?.ranked) return statusEl.textContent = 'No active ranked war';
  const w = war.ranked;
  statusEl.textContent = `${w.factions[0].name} vs ${w.factions[1].name} | ${w.factions[0].score} - ${w.factions[1].score}`;
}

function renderTargets(targets) {
  const grid = document.getElementById('targets-grid');
  grid.innerHTML = targets.map(m => `
    <div class="bg-zinc-900/50 p-4 rounded-lg">
      <div class="font-medium">${m.name}</div>
      <div class="text-xs text-zinc-400">${m.status?.state || 'Unknown'}</div>
    </div>`).join('');
}

function renderMembers(members) {
  const grid = document.getElementById('members-grid');
  grid.innerHTML = members.map(m => `
    <div class="bg-zinc-900/50 p-4 rounded-lg">
      <div class="font-medium">${m.name}</div>
    </div>`).join('');
}

document.addEventListener('DOMContentLoaded', init);