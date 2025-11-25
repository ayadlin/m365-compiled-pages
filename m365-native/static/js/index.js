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

    // Add copy-to-clipboard functionality for all code blocks
    document.addEventListener('DOMContentLoaded', function() {
      document.querySelectorAll('pre code').forEach(function(codeBlock) {
        const button = document.createElement('button');
        button.className = 'copy-code-button';
        button.textContent = 'Copy';
        button.style.cssText = 'position: absolute; top: 0.5rem; right: 0.5rem; padding: 0.25rem 0.5rem; background: var(--accent); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem; opacity: 0.8; transition: opacity 0.2s;';

        button.addEventListener('mouseover', function() {
          button.style.opacity = '1';
        });
        button.addEventListener('mouseout', function() {
          button.style.opacity = '0.8';
        });

        button.addEventListener('click', function() {
          navigator.clipboard.writeText(codeBlock.textContent).then(function() {
            button.textContent = 'Copied!';
            setTimeout(function() {
              button.textContent = 'Copy';
            }, 2000);
          });
        });

        const pre = codeBlock.parentNode;
        pre.style.position = 'relative';
        pre.appendChild(button);
      });
    });
