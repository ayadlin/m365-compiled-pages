// SCIM Tokens Page JavaScript

// Show admin link for logged-in admin users
(function checkAdminAccess() {
  const hasAdminAccess = document.cookie.split('; ').find(row => row.startsWith('admin_logged_in='));
  if (hasAdminAccess) {
    document.getElementById('admin-link').style.display = 'block';
  }
})();

let allTokens = [];
let selectedTenant = '';

// Load tokens on page load
document.addEventListener('DOMContentLoaded', () => {
  // Check if tenant_id is in URL query params
  const urlParams = new URLSearchParams(window.location.search);
  selectedTenant = urlParams.get('tenant_id') || '';

  loadTenants();

  // Add event listeners for filters
  document.getElementById('tenantFilter').addEventListener('change', handleTenantChange);
  document.getElementById('statusFilter').addEventListener('change', filterTokens);
});

async function loadTenants() {
  try {
    // Fetch tenant list from tenant info endpoint
    const response = await fetch('/api/enterprise/tenants');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const tenants = await response.json();
    const tenantFilter = document.getElementById('tenantFilter');

    tenants.forEach(tenant => {
      const option = document.createElement('option');
      option.value = tenant.tenant_id;
      option.textContent = tenant.tenant_name || tenant.tenant_id;
      tenantFilter.appendChild(option);
    });

    // Select first tenant or URL param tenant
    if (tenants.length > 0) {
      if (selectedTenant && tenants.find(t => t.tenant_id === selectedTenant)) {
        tenantFilter.value = selectedTenant;
      } else {
        tenantFilter.value = tenants[0].tenant_id;
        selectedTenant = tenants[0].tenant_id;
      }
      loadTokens();
    }

  } catch (error) {
    console.error('Error loading tenants:', error);
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('errorState').style.display = 'block';
  }
}

async function handleTenantChange(event) {
  selectedTenant = event.target.value;
  if (selectedTenant) {
    loadTokens();
  }
}

async function loadTokens() {
  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const tokensContent = document.getElementById('tokensContent');

  if (!selectedTenant) {
    loadingState.style.display = 'none';
    errorState.style.display = 'block';
    return;
  }

  try {
    loadingState.style.display = 'block';
    errorState.style.display = 'none';
    tokensContent.style.display = 'none';

    const response = await fetch(`/api/enterprise/scim/tokens?tenant_id=${encodeURIComponent(selectedTenant)}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    allTokens = await response.json();

    // Display tokens
    filterTokens();

    // Hide loading, show content
    loadingState.style.display = 'none';
    tokensContent.style.display = 'block';

  } catch (error) {
    console.error('Error loading tokens:', error);
    loadingState.style.display = 'none';
    errorState.style.display = 'block';
  }
}

function filterTokens() {
  const statusFilter = document.getElementById('statusFilter').value;

  const filtered = allTokens.filter(token => {
    // Status filter
    if (statusFilter === 'active') {
      return token.active === true;
    } else if (statusFilter === 'inactive') {
      return token.active === false;
    }
    return true;
  });

  displayTokens(filtered);
}

function displayTokens(tokens) {
  const tbody = document.getElementById('tokensTableBody');
  const noResults = document.getElementById('noResults');

  if (tokens.length === 0) {
    tbody.innerHTML = '';
    noResults.style.display = 'block';
    return;
  }

  noResults.style.display = 'none';

  tbody.innerHTML = tokens.map(token => {
    const statusClass = token.active ? 'status-active' : 'status-inactive';
    const statusText = token.active ? 'Active' : 'Inactive';
    const createdDate = new Date(token.created_at).toLocaleString();
    const lastUsed = token.last_used_at
      ? new Date(token.last_used_at).toLocaleString()
      : 'Never';
    const expires = token.expires_at
      ? new Date(token.expires_at).toLocaleDateString()
      : 'No expiration';

    const revokeButton = token.active
      ? `<button class="revoke-btn" onclick="revokeToken(${token.id})">Revoke</button>`
      : '<span style="color: var(--fg, #9ca3af);">Revoked</span>';

    return `
      <tr>
        <td><strong>#${token.id}</strong></td>
        <td>${escapeHtml(token.tenant_id)}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>${createdDate}</td>
        <td>${lastUsed}</td>
        <td>${expires}</td>
        <td>${revokeButton}</td>
      </tr>
    `;
  }).join('');
}

async function revokeToken(tokenId) {
  if (!confirm('Are you sure you want to revoke this SCIM token? This action cannot be undone.')) {
    return;
  }

  try {
    const response = await fetch('/api/enterprise/scim/tokens/revoke', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token_id: tokenId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Token revoked:', result);

    // Reload tokens to reflect the change
    await loadTokens();

  } catch (error) {
    console.error('Error revoking token:', error);
    alert('Failed to revoke token. Please try again.');
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
