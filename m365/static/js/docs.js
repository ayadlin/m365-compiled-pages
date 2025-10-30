    fetch('../brand.json').then(r => r.json()).then(b => {
      document.getElementById('logo').src = '../' + b.logo || 'branding/logo.svg';
    });

    // Track when users view installation instructions
    if (window.trackInstallView) {
      window.trackInstallView();
    }
