// Provisioned Users Page JavaScript

// Show admin link for logged-in admin users
(function checkAdminAccess() {
  const hasAdminAccess = document.cookie.split('; ').find(row => row.startsWith('admin_logged_in='));
  if (hasAdminAccess) {
    document.getElementById('admin-link').style.display = 'block';
  }
})();

let allUsers = [];

// Load users on page load
document.addEventListener('DOMContentLoaded', () => {
  loadUsers();

  // Add event listeners for filters
  document.getElementById('searchInput').addEventListener('input', filterUsers);
  document.getElementById('statusFilter').addEventListener('change', filterUsers);
  document.getElementById('tenantFilter').addEventListener('change', filterUsers);
});

async function loadUsers() {
  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const usersContent = document.getElementById('usersContent');

  try {
    const response = await fetch('/api/enterprise/users');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    allUsers = await response.json();

    // Populate tenant filter
    populateTenantFilter();

    // Display users
    filterUsers();

    // Hide loading, show content
    loadingState.style.display = 'none';
    usersContent.style.display = 'block';

  } catch (error) {
    console.error('Error loading users:', error);
    loadingState.style.display = 'none';
    errorState.style.display = 'block';
  }
}

function populateTenantFilter() {
  const tenantFilter = document.getElementById('tenantFilter');
  const tenants = [...new Set(allUsers.map(u => u.tenant_name).filter(Boolean))];

  tenants.sort().forEach(tenant => {
    const option = document.createElement('option');
    option.value = tenant;
    option.textContent = tenant;
    tenantFilter.appendChild(option);
  });
}

function filterUsers() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const statusFilter = document.getElementById('statusFilter').value;
  const tenantFilter = document.getElementById('tenantFilter').value;

  const filtered = allUsers.filter(user => {
    // Search filter
    const matchesSearch = !searchTerm ||
      user.display_name?.toLowerCase().includes(searchTerm) ||
      user.email?.toLowerCase().includes(searchTerm) ||
      user.tenant_name?.toLowerCase().includes(searchTerm);

    // Status filter
    const matchesStatus = !statusFilter || user.status === statusFilter;

    // Tenant filter
    const matchesTenant = !tenantFilter || user.tenant_name === tenantFilter;

    return matchesSearch && matchesStatus && matchesTenant;
  });

  displayUsers(filtered);
}

function displayUsers(users) {
  const tbody = document.getElementById('usersTableBody');
  const noResults = document.getElementById('noResults');

  if (users.length === 0) {
    tbody.innerHTML = '';
    noResults.style.display = 'block';
    return;
  }

  noResults.style.display = 'none';

  tbody.innerHTML = users.map(user => {
    const statusClass = user.status === 'active' ? 'status-active' : 'status-inactive';
    const statusText = user.status.charAt(0).toUpperCase() + user.status.slice(1);
    const provisionedDate = new Date(user.provisioned_at).toLocaleDateString();
    const lastLogin = user.last_login_at
      ? new Date(user.last_login_at).toLocaleString()
      : 'Never';

    return `
      <tr>
        <td><strong>${escapeHtml(user.display_name || 'Unknown')}</strong></td>
        <td>${escapeHtml(user.email)}</td>
        <td>${escapeHtml(user.tenant_name || user.tenant_id)}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>${provisionedDate}</td>
        <td>${lastLogin}</td>
      </tr>
    `;
  }).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
