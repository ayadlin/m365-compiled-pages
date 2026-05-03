
// HTML escape utility — used to defend against XSS when interpolating untrusted
// data into innerHTML. Strata audit (2026-05-03) flagged data-bearing
// interpolations across this file; the helper is now applied to all of them.
function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Enterprise Dashboard JavaScript

// Load dashboard data on page load
document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();
  setupLicenseManagement();
});

async function loadDashboardData() {
  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const dashboardContent = document.getElementById('dashboardContent');

  try {
    // Fetch dashboard statistics
    const response = await fetch('/api/enterprise/dashboard/stats');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${escapeHtml(response.status)}`);
    }

    const stats = await response.json();

    // Update statistics
    document.getElementById('totalTenants').textContent = stats.total_tenants || '0';
    document.getElementById('totalUsers').textContent = stats.total_users || '0';
    document.getElementById('activeUsers').textContent = stats.active_users || '0';
    document.getElementById('logins24h').textContent = stats.total_logins_24h || '0';

    // Load recent activity
    await loadRecentActivity();

    // Hide loading, show content
    loadingState.style.display = 'none';
    dashboardContent.style.display = 'block';

  } catch (error) {
    console.error('Error loading dashboard:', error);
    loadingState.style.display = 'none';
    errorState.style.display = 'block';
  }
}

async function loadRecentActivity() {
  const activityContainer = document.getElementById('recentActivity');

  try {
    // Fetch recent audit logs
    const response = await fetch('/api/enterprise/audit/logs?limit=5');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${escapeHtml(response.status)}`);
    }

    const events = await response.json();

    if (!events || events.length === 0) {
      activityContainer.innerHTML = '<p class="loading-text">No recent activity</p>';
      return;
    }

    // Build activity list
    activityContainer.innerHTML = events.map(event => {
      const icon = event.success ? '✅' : '❌';
      const eventLabel = getEventLabel(event.event_type);
      const timeAgo = formatTimeAgo(new Date(event.created_at));

      return `
        <div class="activity-item">
          <div class="activity-icon">${escapeHtml(icon)}</div>
          <div class="activity-content">
            <div class="activity-title">${escapeHtml(eventLabel)}</div>
            <div class="activity-meta">${escapeHtml(event.user_email || 'Unknown user')} • ${escapeHtml(event.tenant_name || event.tenant_id)}</div>
          </div>
          <div class="activity-time">${escapeHtml(timeAgo)}</div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Error loading recent activity:', error);
    activityContainer.innerHTML = '<p class="loading-text">Failed to load activity</p>';
  }
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
      return interval === 1 ? `1 ${escapeHtml(unit)} ago` : `${escapeHtml(interval)} ${escapeHtml(unit)}s ago`;
    }
  }

  return 'just now';
}

// Setup license management functionality
function setupLicenseManagement() {
  const addButton = document.getElementById('addLicensesBtn');
  if (!addButton) return;

  addButton.addEventListener('click', async () => {
    const email = document.getElementById('licenseEmail').value.trim();
    const additionalSeats = parseInt(document.getElementById('additionalSeats').value);
    const resultDiv = document.getElementById('licenseResult');

    // Validate inputs
    if (!email || !additionalSeats || additionalSeats <= 0) {
      showLicenseResult('error', 'Please enter a valid email and number of seats');
      return;
    }

    // Disable button during request
    addButton.disabled = true;
    addButton.textContent = 'Adding Licenses...';

    try {
      const response = await fetch('/api/enterprise/licenses/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email,
          additional_seats: additionalSeats
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showLicenseResult('success',
          `Successfully added ${escapeHtml(data.additional_seats)} seat(s)! ` +
          `Previous: ${escapeHtml(data.previous_seats)} → New: ${escapeHtml(data.new_seats)} seats. ` +
          `${escapeHtml(data.proration)}`
        );

        // Clear form
        document.getElementById('licenseEmail').value = '';
        document.getElementById('additionalSeats').value = '';
      } else {
        showLicenseResult('error', data.message || 'Failed to add licenses');
      }

    } catch (error) {
      console.error('Error adding licenses:', error);
      showLicenseResult('error', 'An error occurred while adding licenses');
    } finally {
      // Re-enable button
      addButton.disabled = false;
      addButton.textContent = 'Add Licenses';
    }
  });
}

function showLicenseResult(type, message) {
  const resultDiv = document.getElementById('licenseResult');
  resultDiv.style.display = 'block';
  resultDiv.className = type === 'success' ? 'success-message' : 'error-message';
  resultDiv.textContent = message;

  // Auto-hide after 10 seconds
  setTimeout(() => {
    resultDiv.style.display = 'none';
  }, 10000);
}
