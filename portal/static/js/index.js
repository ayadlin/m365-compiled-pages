    // API base URL - use api.ytech.tools for production, or same domain for local/direct access
    const API_BASE = window.location.hostname === 'ytech.tools' ? 'https://api.ytech.tools' : '';

    // Load brand logo
    fetch('/brand.json').then(r => r.json()).then(b => {
      document.getElementById('logo').src = '/' + (b.logo || 'branding/logo.svg');
      // Colors are now managed by CSS theme system (theme.css) for light/dark mode support
    });

    // Redirect to dashboard if already logged in
    (async function checkLoginStatus() {
      try {
        const response = await fetch(`${API_BASE}/api/portal/license-info`, {
          method: 'GET',
          credentials: 'include',
        });

        // If request succeeds or returns 404 (free trial), user is logged in
        if (response.ok || response.status === 404) {
          window.location.href = '/portal/dashboard';
        }
      } catch (error) {
        // User not logged in, stay on login page
      }
    })();

    // Handle form submission
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = document.getElementById('submitBtn');
      const email = document.getElementById('email').value.trim();
      const messageContainer = document.getElementById('messageContainer');

      // Disable button
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
      messageContainer.innerHTML = '';

      try {
        const response = await fetch(`${API_BASE}/api/portal/request-access`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (response.ok) {
          messageContainer.innerHTML = `
            <div class="message success">
              ✉️ Login link sent! Check your email inbox.
            </div>
          `;
          document.getElementById('email').value = '';
        } else {
          messageContainer.innerHTML = `
            <div class="message error">
              ${data.error || 'Failed to send login link. Please try again.'}
            </div>
          `;
        }
      } catch (error) {
        messageContainer.innerHTML = `
          <div class="message error">
            Network error. Please check your connection and try again.
          </div>
        `;
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Login Link';
      }
    });

    // Check for error/expired token messages from query params
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const messageContainer = document.getElementById('messageContainer');

    if (error === 'invalid_token') {
      messageContainer.innerHTML = `
        <div class="message error">
          Invalid or expired login link. Please request a new one.
        </div>
      `;
    } else if (error === 'expired_token') {
      messageContainer.innerHTML = `
        <div class="message error">
          Login link has expired. Please request a new one.
        </div>
      `;
    }
