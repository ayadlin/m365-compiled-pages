    fetch('../brand.json').then(r => r.json()).then(b => {
      document.getElementById('logo').src = '../' + b.logo || 'branding/logo.svg';
    });

    // Show admin link for logged-in admin users
    (function checkAdminAccess() {
      const hasAdminAccess = document.cookie.split('; ').find(row => row.startsWith('admin_logged_in='));
      if (hasAdminAccess) {
        document.getElementById('admin-link').style.display = 'block';
      }
    })();

    // Track when users view installation instructions
    if (window.trackInstallView) {
      window.trackInstallView();
    }
