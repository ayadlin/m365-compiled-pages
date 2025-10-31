// Load branding
fetch('../brand.json').then(r => r.json()).then(b => {
  document.getElementById('logo').src = '../' + b.logo || 'branding/logo.svg';
  // Colors are now managed by CSS theme system (theme.css) for light/dark mode support
});

// Load pricing config
fetch('config.json').then(r => r.json()).then(config => {
  const grid = document.getElementById('pricing-grid');

  config.plans.forEach(plan => {
    const card = document.createElement('div');
    card.className = `pricing-card ${plan.id}`;
    if (plan.popular) {
      card.classList.add('popular');
    }

    const popularBadge = plan.popular ? '<div class="popular-badge">Most Popular</div>' : '';

    const priceDisplay = plan.price === 0
      ? '<div class="plan-price">Free</div>'
      : `<div class="plan-price"><span class="currency">${config.currency === 'USD' ? '$' : config.currency}</span>${plan.price}<span class="period">/${plan.period}</span></div>`;

    const features = plan.features.map(f => `<li>${f}</li>`).join('');

    const checkoutUrl = config.checkout[plan.id] || '#';

    // Determine tracking based on plan type
    const isFree = plan.price === 0;
    const trackingCode = isFree
      ? `onclick="if(window.trackTrialDownload) trackTrialDownload('pricing_free_plan');"`
      : `onclick="if(window.trackPurchaseClick) trackPurchaseClick('${plan.id}');"`;

    card.innerHTML = `
      ${popularBadge}
      <div class="plan-badge">${plan.badge || '📦'}</div>
      <div class="plan-name">${plan.label}</div>
      <div class="plan-description">${plan.description || ''}</div>
      ${priceDisplay}
      <ul class="plan-features">
        ${features}
      </ul>
      <a href="${checkoutUrl}" class="plan-cta" ${trackingCode}>${plan.cta || 'Get Started'}</a>
    `;

    grid.appendChild(card);
  });
});

// Billing portal handler
const API_URL = 'https://api.ytech.tools';

document.getElementById('manage-billing-btn').addEventListener('click', async () => {
  const searchQuery = document.getElementById('billing-search').value.trim();
  const statusDiv = document.getElementById('billing-status');
  const btn = document.getElementById('manage-billing-btn');

  if (!searchQuery) {
    statusDiv.style.display = 'block';
    statusDiv.style.background = 'rgba(var(--error-rgb), 0.1)';
    statusDiv.style.border = '2px solid var(--error)';
    statusDiv.style.color = 'var(--error)';
    statusDiv.textContent = 'Please enter your email or company name';
    return;
  }

  // Track billing portal access
  if (window.trackBillingPortal) {
    window.trackBillingPortal(searchQuery);
  }

  // Disable button and show loading
  btn.disabled = true;
  btn.textContent = 'Loading...';
  statusDiv.style.display = 'none';

  try {
    const response = await fetch(`${API_URL}/api/create-portal-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        search: searchQuery,
        return_url: window.location.href
      }),
    });

    const data = await response.json();

    if (response.ok && data.url) {
      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
    } else if (response.ok && data.is_free_user === "true") {
      // Free trial user - show upgrade message
      statusDiv.style.display = 'block';
      statusDiv.style.background = 'rgba(var(--muted-rgb), 0.1)';
      statusDiv.style.border = '2px solid var(--muted)';
      statusDiv.style.color = 'var(--muted)';
      statusDiv.innerHTML = `<strong>✨ You have a free trial!</strong><br>${data.message}<br><br>Scroll up to choose a plan above.`;
      btn.disabled = false;
      btn.textContent = 'Open Billing Portal';
    } else {
      throw new Error(data.error || 'Failed to create portal session');
    }
  } catch (error) {
    console.error('Error:', error);
    statusDiv.style.display = 'block';
    statusDiv.style.background = 'rgba(var(--error-rgb), 0.1)';
    statusDiv.style.border = '2px solid var(--error)';
    statusDiv.style.color = 'var(--error)';
    statusDiv.textContent = error.message || 'An error occurred. Please try again or contact support.';
    btn.disabled = false;
    btn.textContent = 'Open Billing Portal';
  }
});
