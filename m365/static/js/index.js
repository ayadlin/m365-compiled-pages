    fetch('../brand.json').then(r => r.json()).then(b => {
      document.getElementById('logo').src = '../' + b.logo || 'branding/logo.svg';
      // Colors are now managed by CSS theme system (theme.css) for light/dark mode support
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
