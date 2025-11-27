// Tenants Overview Page JavaScript

// Load tenants on page load
document.addEventListener('DOMContentLoaded', () => {
  loadTenants();
});

async function loadTenants() {
  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const tenantsContent = document.getElementById('tenantsContent');

  try {
    const response = await fetch('/api/enterprise/tenants');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const tenants = await response.json();

    // Display tenants
    displayTenants(tenants);

    // Hide loading, show content
    loadingState.style.display = 'none';
    tenantsContent.style.display = 'block';

  } catch (error) {
    console.error('Error loading tenants:', error);
    loadingState.style.display = 'none';
    errorState.style.display = 'block';
  }
}

function displayTenants(tenants) {
  const grid = document.getElementById('tenantsGrid');
  const noResults = document.getElementById('noResults');

  if (tenants.length === 0) {
    grid.innerHTML = '';
    noResults.style.display = 'block';
    return;
  }

  noResults.style.display = 'none';

  grid.innerHTML = tenants.map(tenant => {
    const lastActivity = tenant.last_activity
      ? `Last activity: ${formatTimeAgo(new Date(tenant.last_activity))}`
      : 'No recent activity';

    return `
      <div class="tenant-card">
        <div class="tenant-header">
          <div class="tenant-icon">🏢</div>
          <div>
            <h3 class="tenant-name">${escapeHtml(tenant.tenant_name)}</h3>
            <p class="tenant-domain">${escapeHtml(tenant.domain)}</p>
          </div>
        </div>

        <div class="tenant-stats">
          <div class="stat-item">
            <div class="stat-label">Total Users</div>
            <div class="stat-value">${tenant.total_users}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Active Users</div>
            <div class="stat-value">${tenant.active_users}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Total Logins</div>
            <div class="stat-value">${tenant.total_logins}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Tenant ID</div>
            <div class="stat-value" style="font-size: 0.875rem;">${escapeHtml(tenant.tenant_id).substring(0, 8)}...</div>
          </div>
        </div>

        <div class="last-activity">${lastActivity}</div>

        <button class="view-details-btn" onclick="viewTenantDetails('${escapeHtml(tenant.tenant_id)}')">
          View Details
        </button>
      </div>
    `;
  }).join('');
}

function viewTenantDetails(tenantId) {
  // Navigate to audit logs filtered by this tenant
  window.location.href = `/portal/enterprise/audit?tenant_id=${encodeURIComponent(tenantId)}`;
}

function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
    }
  }

  return 'just now';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
