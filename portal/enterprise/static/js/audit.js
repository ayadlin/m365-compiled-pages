// Audit Logs Page JavaScript

// Show admin link for logged-in admin users
(function checkAdminAccess() {
  const hasAdminAccess = document.cookie.split('; ').find(row => row.startsWith('admin_logged_in='));
  if (hasAdminAccess) {
    document.getElementById('admin-link').style.display = 'block';
  }
})();

let allLogs = [];

// Load audit logs on page load
document.addEventListener('DOMContentLoaded', () => {
  loadAuditLogs();

  // Add event listeners for filters
  document.getElementById('eventTypeFilter').addEventListener('change', filterLogs);
  document.getElementById('tenantFilter').addEventListener('change', filterLogs);
  document.getElementById('successFilter').addEventListener('change', filterLogs);
});

async function loadAuditLogs() {
  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const auditContent = document.getElementById('auditContent');

  try {
    const response = await fetch('/api/enterprise/audit/logs');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    allLogs = await response.json();

    // Populate tenant filter
    populateTenantFilter();

    // Display logs
    filterLogs();

    // Hide loading, show content
    loadingState.style.display = 'none';
    auditContent.style.display = 'block';

  } catch (error) {
    console.error('Error loading audit logs:', error);
    loadingState.style.display = 'none';
    errorState.style.display = 'block';
  }
}

function populateTenantFilter() {
  const tenantFilter = document.getElementById('tenantFilter');
  const tenants = [...new Set(allLogs.map(l => l.tenant_name).filter(Boolean))];

  tenants.sort().forEach(tenant => {
    const option = document.createElement('option');
    option.value = tenant;
    option.textContent = tenant;
    tenantFilter.appendChild(option);
  });
}

function filterLogs() {
  const eventTypeFilter = document.getElementById('eventTypeFilter').value;
  const tenantFilter = document.getElementById('tenantFilter').value;
  const successFilter = document.getElementById('successFilter').value;

  const filtered = allLogs.filter(log => {
    // Event type filter
    const matchesEventType = !eventTypeFilter || log.event_type === eventTypeFilter;

    // Tenant filter
    const matchesTenant = !tenantFilter || log.tenant_name === tenantFilter;

    // Success filter
    let matchesSuccess = true;
    if (successFilter === 'success') {
      matchesSuccess = log.success === true;
    } else if (successFilter === 'failed') {
      matchesSuccess = log.success === false;
    }

    return matchesEventType && matchesTenant && matchesSuccess;
  });

  displayLogs(filtered);
}

function displayLogs(logs) {
  const tbody = document.getElementById('auditTableBody');
  const noResults = document.getElementById('noResults');

  if (logs.length === 0) {
    tbody.innerHTML = '';
    noResults.style.display = 'block';
    return;
  }

  noResults.style.display = 'none';

  tbody.innerHTML = logs.map(log => {
    const statusIcon = log.success ? '<span class="status-icon">✅</span>' : '<span class="status-icon">❌</span>';
    const eventLabel = getEventLabel(log.event_type);
    const timestamp = new Date(log.created_at).toLocaleString();
    const errorDetail = log.error_message
      ? `<div class="error-message-cell">Error: ${escapeHtml(log.error_message)}</div>`
      : '';

    return `
      <tr>
        <td>${statusIcon}</td>
        <td><span class="event-badge">${eventLabel}</span></td>
        <td>${escapeHtml(log.user_email || 'System')}</td>
        <td>${escapeHtml(log.tenant_name || log.tenant_id || '-')}</td>
        <td>${timestamp}</td>
        <td>${errorDetail || '-'}</td>
      </tr>
    `;
  }).join('');
}

function getEventLabel(eventType) {
  const labels = {
    'sso_login': 'SSO Login',
    'user_provisioned': 'User Provisioned',
    'user_deprovisioned': 'User Deprovisioned',
    'scim_sync': 'SCIM Sync',
    'token_created': 'Token Created',
    'token_revoked': 'Token Revoked'
  };
  return labels[eventType] || eventType;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
