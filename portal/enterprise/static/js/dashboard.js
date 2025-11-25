// Enterprise Dashboard JavaScript

// Load dashboard data on page load
document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();
});

async function loadDashboardData() {
  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const dashboardContent = document.getElementById('dashboardContent');

  try {
    // Fetch dashboard statistics
    const response = await fetch('/api/enterprise/dashboard/stats');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
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
      throw new Error(`HTTP error! status: ${response.status}`);
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
          <div class="activity-icon">${icon}</div>
          <div class="activity-content">
            <div class="activity-title">${eventLabel}</div>
            <div class="activity-meta">${event.user_email || 'Unknown user'} • ${event.tenant_name || event.tenant_id}</div>
          </div>
          <div class="activity-time">${timeAgo}</div>
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
      return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
    }
  }

  return 'just now';
}
