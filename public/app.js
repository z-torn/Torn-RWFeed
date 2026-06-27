const CONFIG = {
  API_BASE: 'https://tornrwfeed.onrender.com',
  POLL_INTERVAL: 30000
};

const state = {
  apiKey: null,
  sessionToken: null,
  faction: null,
  war: null,
  enemies: [],
  allies: [],
  targets: [],
  currentTab: 'targets',
  pollTimer: null,
  ws: null
};

const api = {
  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (state.sessionToken) {
      headers['Authorization'] = `Bearer ${state.sessionToken}`;
    }

    try {
      const response = await fetch(`${CONFIG.API_BASE}${endpoint}`, {
        ...options,
        headers
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }
};

function showView(viewName) {
  document.getElementById('login-view').classList.toggle('hidden-view', viewName !== 'login');
  document.getElementById('dashboard-view').classList.toggle('hidden-view', viewName !== 'dashboard');
}

function showError(message) {
  const banner = document.getElementById('error-banner');
  const msgEl = document.getElementById('error-message');
  msgEl.textContent = message;
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
    connectWebSocket();
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

function handleRefresh() {
  if (state.ws && state.ws.readyState === WebSocket.OPEN) {
    state.ws.send('refresh');
  } else {
    connectWebSocket();
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const tornKey = document.getElementById('api-key').value.trim();
  const errorEl = document.getElementById('login-error');
  
  try {
    const authResponse = await api.request(`/auth?torn_key=${encodeURIComponent(tornKey)}`);
    
    if (!authResponse.api_key) {
      throw new Error('Authentication failed');
    }
    
    state.apiKey = tornKey;
    state.sessionToken = authResponse.api_key;
    localStorage.setItem('torn_api_key', tornKey);
    localStorage.setItem('torn_session_token', authResponse.api_key);
    
    showView('dashboard');
    await loadDashboard();
    connectWebSocket();
  } catch (error) {
    errorEl.textContent = error.message || 'Connection failed. Please try again.';
    errorEl.classList.remove('hidden');
    showView('login');
    state.apiKey = null;
    state.sessionToken = null;
    localStorage.removeItem('torn_api_key');
    localStorage.removeItem('torn_session_token');
  }
}

function handleLogout() {
  if (state.ws) {
    state.ws.close();
    state.ws = null;
  }
  state.apiKey = null;
  state.sessionToken = null;
  localStorage.removeItem('torn_api_key');
  localStorage.removeItem('torn_session_token');
  clearInterval(state.pollTimer);
  document.getElementById('api-key').value = '';
  showView('login');
}

function switchTab(tabName) {
  state.currentTab = tabName;
  
  document.querySelectorAll('.tab-content').forEach(el => {
    el.classList.toggle('hidden-view', !el.id.includes(tabName));
  });
  
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
    btn.classList.toggle('bg-zinc-800', btn.dataset.tab === tabName);
    btn.classList.toggle('text-zinc-50', btn.dataset.tab === tabName);
    btn.classList.toggle('bg-zinc-900/50', btn.dataset.tab !== tabName);
    btn.classList.toggle('text-zinc-400', btn.dataset.tab !== tabName);
  });
}

async function loadDashboard() {
  console.log('Dashboard loaded, waiting for WebSocket data...');
}

function connectWebSocket() {
  if (state.ws) {
    state.ws.close();
  }

  const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  const wsUrl = `${protocol}://tornrwfeed.onrender.com/wars/socket?token=${state.sessionToken}`;

  try {
    state.ws = new WebSocket(wsUrl);

    state.ws.onopen = () => {
      console.log('WebSocket connected');
    };

    state.ws.onmessage = (event) => {
      handleWebSocketMessage(event.data);
    };

    state.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      showError('Real-time connection lost. Retrying...');
    };

    state.ws.onclose = () => {
      console.log('WebSocket closed');
      setTimeout(connectWebSocket, 5000);
    };
  } catch (error) {
    console.error('WebSocket connection failed:', error);
    showError('Could not connect to real-time feed. Retrying...');
    setTimeout(connectWebSocket, 5000);
  }
}

function handleWebSocketMessage(data) {
  try {
    const msg = JSON.parse(data);
    
    if (msg.war) {
      state.war = msg.war;
      updateWarStatus(msg.war);
    }
    
    if (msg.members) {
      state.enemies = msg.members;
      if (state.currentTab === 'targets') {
        renderTargets(msg.members);
      }
    }
    
    if (msg.targets) {
      state.targets = msg.targets;
      if (state.currentTab === 'targets') {
        renderTargets(state.enemies);
      }
    }
    
    if (msg.error) {
      showError(msg.error);
    }
  } catch (e) {
    console.error('Failed to parse WebSocket message:', e);
  }
}

function updateWarStatus(war) {
  const statusEl = document.getElementById('war-status');
  
  if (!war || !war.ranked) {
    statusEl.textContent = 'No active ranked war';
    return;
  }

  const w = war.ranked;
  const factions = w.factions || [];
  const attacker = factions[0];
  const defender = factions[1];

  if (attacker && defender) {
    const timeLeft = w.end ? formatTimeLeft(w.end) : '';
    statusEl.textContent = `${attacker.name} vs ${defender.name} | Score: ${attacker.score} - ${defender.score}${timeLeft ? ' | Ends: ' + timeLeft : ''}`;
    renderWarProgress(attacker, defender);
  } else {
    statusEl.textContent = `War #${w.war_id} in progress`;
  }
}

function renderWarProgress(attacker, defender) {
  const progressEl = document.getElementById('war-progress');
  
  const maxScore = Math.max(attacker.score, defender.score, 1);
  const attackerPercent = Math.round((attacker.score / maxScore) * 100);
  const defenderPercent = Math.round((defender.score / maxScore) * 100);
  
  progressEl.innerHTML = `
    <div class="space-y-3">
      <div>
        <div class="flex justify-between text-sm mb-1">
          <span>${attacker.name}</span>
          <span>${attacker.score} pts</span>
        </div>
        <div class="w-full bg-zinc-800 rounded-full h-2">
          <div class="bg-blue-500 h-2 rounded-full" style="width: ${attackerPercent}%"></div>
        </div>
      </div>
      <div>
        <div class="flex justify-between text-sm mb-1">
          <span>${defender.name}</span>
          <span>${defender.score} pts</span>
        </div>
        <div class="w-full bg-zinc-800 rounded-full h-2">
          <div class="bg-red-500 h-2 rounded-full" style="width: ${defenderPercent}%"></div>
        </div>
      </div>
    </div>
  `;
}

function formatTimeLeft(timestamp) {
  const now = Math.floor(Date.now() / 1000);
  const diff = timestamp - now;
  
  if (diff <= 0) return '';
  
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

function renderTargets(members) {
  const grid = document.getElementById('targets-grid');
  
  if (!members || members.length === 0) {
    grid.innerHTML = '<div class="text-zinc-400 col-span-full text-center py-8">No targets available</div>';
    return;
  }

  grid.innerHTML = members.map(member => {
    const status = member.status || {};
    const statusClass = getStatusBadgeClass(status.state);
    
    return `
      <div class="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="font-medium">${member.name}</span>
          <span class="text-xs ${statusClass}">${status.state || 'Unknown'}</span>
        </div>
        <div class="text-sm text-zinc-400">Level ${member.level || '?'}</div>
        <div class="text-xs text-zinc-500 mt-1">${status.description || ''}</div>
        ${status.until ? `<div class="text-xs text-yellow-400 mt-1">Hospital until: ${status.until}</div>` : ''}
      </div>
    `;
  }).join('');
}

function renderMembers(members) {
  const grid = document.getElementById('members-grid');
  
  if (!members || members.length === 0) {
    grid.innerHTML = '<div class="text-zinc-400 col-span-full text-center py-8">No members found</div>';
    return;
  }

  grid.innerHTML = members.map(member => {
    const status = member.status || {};
    const statusClass = getStatusBadgeClass(status.state);
    
    return `
      <div class="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="font-medium">${member.name}</span>
          <span class="text-xs ${statusClass}">${status.state || 'Unknown'}</span>
        </div>
        <div class="text-sm text-zinc-400">Level ${member.level || '?'}</div>
        <div class="text-xs text-zinc-500 mt-1">${status.description || ''}</div>
      </div>
    `;
  }).join('');
}

function getStatusBadgeClass(state) {
  const styles = {
    'Okay': 'bg-green-500/10 text-green-400 px-2 py-0.5 rounded',
    'Hospital': 'bg-red-500/10 text-red-400 px-2 py-0.5 rounded',
    'Traveling': 'bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded',
    'Offline': 'bg-zinc-500/10 text-zinc-400 px-2 py-0.5 rounded'
  };
  return styles[state] || 'bg-zinc-500/10 text-zinc-400 px-2 py-0.5 rounded';
}

document.addEventListener('DOMContentLoaded', init);