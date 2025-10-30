    fetch('../brand.json').then(r => r.json()).then(b => {
      document.getElementById('logo').src = '../' + b.logo || 'branding/logo.svg';

      // Apply brand colors
      if (b.colors) {
        document.documentElement.style.setProperty('--card-bg', b.colors.card);
        document.documentElement.style.setProperty('--accent', b.colors.accent);
        document.documentElement.style.setProperty('--muted', b.colors.muted);
      }
    });

    // Show admin link for logged-in admin users
    // Checks if user has valid admin session from dashboard
    (function checkAdminAccess() {
      // Check if admin_logged_in cookie exists (user is logged into admin dashboard)
      const hasAdminAccess = document.cookie.split('; ').find(row => row.startsWith('admin_logged_in='));

      if (hasAdminAccess) {
        document.getElementById('admin-link').style.display = 'block';
      }
    })();
