// Load branding
fetch('../brand.json').then(r => r.json()).then(b => {
  document.getElementById('logo').src = '../' + b.logo || 'branding/logo.svg';
  // Colors are now managed by CSS theme system (theme.css) for light/dark mode support
});

// Show admin link for logged-in admin users
(function checkAdminAccess() {
  const hasAdminAccess = document.cookie.split('; ').find(row => row.startsWith('admin_logged_in='));
  if (hasAdminAccess) {
    document.getElementById('admin-link').style.display = 'block';
  }
})();

// Load pricing config
fetch('config.json').then(r => r.json()).then(config => {
  const grid = document.getElementById('pricing-grid');

  // Separate free trial from paid plans
  const freeTrial = config.plans.find(plan => plan.id === 'free');
  const mainPlans = config.plans.filter(plan => plan.id !== 'free' && !plan.section);
  const foundationBundles = config.plans.filter(plan => plan.section === 'foundation-bundles');
  const teamBundles = config.plans.filter(plan => plan.section === 'team-bundles');
  const teamNativeBundles = config.plans.filter(plan => plan.section === 'team-native-bundles');

  // Render free trial as hero bar if it exists
  if (freeTrial) {
    const heroContainer = document.createElement('div');
    heroContainer.className = 'free-trial-hero';

    const features = freeTrial.features.map(f => `<li>${f}</li>`).join('');
    const checkoutUrl = config.checkout[freeTrial.id] || '#';
    const trackingCode = `onclick="if(window.trackTrialDownload) trackTrialDownload('pricing_free_plan');"`;

    heroContainer.innerHTML = `
      <div class="free-trial-content">
        <div class="free-trial-header">
          <div class="free-trial-badge">${freeTrial.badge || '🆓'}</div>
          <div class="free-trial-info">
            <div class="free-trial-name">${freeTrial.label}</div>
            <div class="free-trial-description">${freeTrial.description || ''}</div>
          </div>
        </div>
        <ul class="free-trial-features">
          ${features}
        </ul>
        <a href="${checkoutUrl}" class="free-trial-cta" ${trackingCode}>${freeTrial.cta || 'Get Started'}</a>
      </div>
    `;

    // Insert before the pricing grid
    grid.parentNode.insertBefore(heroContainer, grid);
  }

  // Helper function to render a plan card
  function renderPlanCard(plan) {
    const card = document.createElement('div');
    card.className = `pricing-card ${plan.id}`;
    if (plan.popular) {
      card.classList.add('popular');
    }

    const popularBadge = plan.popular ? '<div class="popular-badge">Most Popular</div>' : '';
    const priceDisplay = `<div class="plan-price"><span class="currency">${config.currency === 'USD' ? '$' : config.currency}</span>${plan.price}<span class="period">/${plan.period}</span></div>`;
    const features = plan.features.map(f => `<li>${f}</li>`).join('');
    const checkoutUrl = config.checkout[plan.id] || '#';
    const trackingCode = `onclick="if(window.trackPurchaseClick) trackPurchaseClick('${plan.id}');"`;

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

    return card;
  }

  // Render main plans in the grid
  mainPlans.forEach(plan => {
    grid.appendChild(renderPlanCard(plan));
  });

  // Render Foundation + Mobile bundles section
  if (foundationBundles.length > 0) {
    const section = document.createElement('div');
    section.className = 'bundle-section';
    section.innerHTML = '<h2 class="bundle-title">Foundation + Mobile Bundles</h2><div class="bundle-grid" id="foundation-bundles-grid"></div>';
    grid.parentNode.insertBefore(section, grid.nextSibling);

    const bundleGrid = document.getElementById('foundation-bundles-grid');
    foundationBundles.forEach(plan => {
      bundleGrid.appendChild(renderPlanCard(plan));
    });
  }

  // Render Team + Mobile bundles section
  if (teamBundles.length > 0) {
    const section = document.createElement('div');
    section.className = 'bundle-section';
    section.innerHTML = '<h2 class="bundle-title">Team + Mobile Bundles</h2><div class="bundle-grid" id="team-bundles-grid"></div>';

    const lastSection = document.querySelector('.bundle-section:last-of-type') || grid;
    lastSection.parentNode.insertBefore(section, lastSection.nextSibling);

    const bundleGrid = document.getElementById('team-bundles-grid');
    teamBundles.forEach(plan => {
      bundleGrid.appendChild(renderPlanCard(plan));
    });
  }

  // Render Team Native + Mobile bundles section
  if (teamNativeBundles.length > 0) {
    const section = document.createElement('div');
    section.className = 'bundle-section';
    section.innerHTML = '<h2 class="bundle-title">Team Native + Mobile Bundles</h2><div class="bundle-grid" id="team-native-bundles-grid"></div>';

    const lastSection = document.querySelector('.bundle-section:last-of-type') || grid;
    lastSection.parentNode.insertBefore(section, lastSection.nextSibling);

    const bundleGrid = document.getElementById('team-native-bundles-grid');
    teamNativeBundles.forEach(plan => {
      bundleGrid.appendChild(renderPlanCard(plan));
    });
  }
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
