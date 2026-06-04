// HTML escape utility — used to defend against XSS when interpolating untrusted
// data into innerHTML. The escapeHtml() callers below all depend on this.
function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJsString(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
}

function getAcrobatToggle(tier) {
  const checkbox = document.getElementById(`add-acrobat-${tier}`);
  return checkbox && checkbox.checked ? ['acrobat'] : [];
}

async function checkout(tier, interval, addons) {
  try {
    const response = await fetch('https://api.ytech.tools/api/checkout/create-session', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({tier, interval, addons: addons || []})
    });
    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert('Checkout error: ' + (data.error || 'unknown'));
    }
  } catch (error) {
    alert('Checkout error: ' + (error.message || 'unknown'));
  }
}

window.checkout = checkout;
window.getAcrobatToggle = getAcrobatToggle;

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
  const paidPlans = config.plans.filter(plan => plan.id !== 'free');

  // Render free trial as hero bar if it exists
  if (freeTrial) {
    const heroContainer = document.createElement('div');
    heroContainer.className = 'free-trial-hero';
    heroContainer.id = 'free-trial';

    const features = freeTrial.features.map(f => `<li>${escapeHtml(f)}</li>`).join('');
    const checkoutUrl = escapeHtml(config.checkout[freeTrial.id] || '#');
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
        <a href="${checkoutUrl}" class="free-trial-cta" ${trackingCode}>${escapeHtml(freeTrial.cta || 'Get Started')}</a>
      </div>
    `;

    // Insert before the pricing grid
    grid.parentNode.insertBefore(heroContainer, grid);
  }

  const currencySym = config.currency === 'USD' ? '$' : config.currency;

  // Helper function to render a plan card
  function renderPlanCard(plan) {
    const card = document.createElement('div');
    card.className = `pricing-card ${plan.id}`;
    if (plan.popular) {
      card.classList.add('popular');
    }

    const popularBadge = plan.popular ? '<div class="popular-badge">Most Popular</div>' : '';

    let priceDisplay;
    let ctaBlock;
    let addonControl = '';
    if (typeof plan.priceMonthly === 'number' && typeof plan.priceAnnual === 'number') {
      const savings = Math.round(100 - (plan.priceAnnual / (plan.priceMonthly * 12)) * 100);
      priceDisplay = `
        <div class="plan-price">
          <div class="price-row price-annual">
            <span class="currency">${escapeHtml(currencySym)}</span><span class="amount">${escapeHtml(plan.priceAnnual)}</span><span class="period">/yr</span>
            <span class="savings-badge">save ${savings}%</span>
          </div>
          <div class="price-row price-monthly">
            <span class="muted small">or ${escapeHtml(currencySym)}${escapeHtml(plan.priceMonthly)}/mo</span>
          </div>
        </div>`;
      if (plan.id !== 'enterprise') {
        addonControl = `
          <label class="plan-addon">
            <input type="checkbox" id="add-acrobat-${escapeHtml(plan.id)}" value="acrobat">
            <span>Add Acrobat</span>
          </label>`;
      }
      const tierArg = escapeJsString(plan.id);
      const track = (b) => `if(window.trackPurchaseClick) trackPurchaseClick('${tierArg}_${b}');`;
      ctaBlock = `
        <div class="plan-cta-actions">
          <button type="button" class="plan-cta plan-cta-primary" onclick="${escapeHtml(`${track('annual')} checkout('${tierArg}','annual', getAcrobatToggle('${tierArg}'));`)}">Subscribe Annual</button>
          <button type="button" class="plan-cta plan-cta-secondary" onclick="${escapeHtml(`${track('monthly')} checkout('${tierArg}','monthly', getAcrobatToggle('${tierArg}'));`)}">Subscribe Monthly</button>
        </div>`;
    } else {
      priceDisplay = `<div class="plan-price"><span class="currency">${escapeHtml(currencySym)}</span>${escapeHtml(plan.price)}<span class="period">/${escapeHtml(plan.period)}</span>`;
      if (plan.priceNote) priceDisplay += `<div class="price-note">${escapeHtml(plan.priceNote)}</div>`;
      priceDisplay += `</div>`;
      const checkoutUrl = escapeHtml(config.checkout[plan.id] || '#');
      const track = `onclick="if(window.trackPurchaseClick) trackPurchaseClick('${plan.id}');"`;
      ctaBlock = `<div class="plan-cta-actions"><a href="${checkoutUrl}" class="plan-cta" ${track}>${escapeHtml(plan.cta || 'Get Started')}</a></div>`;
    }

    const visibleFeatures = plan.features.slice(0, 4);
    const hiddenFeatureCount = plan.features.length - visibleFeatures.length;
    const features = visibleFeatures.map(f => `<li><span>${escapeHtml(f)}</span></li>`).join('');
    const moreFeatures = hiddenFeatureCount > 0
      ? `<li class="more-features">+${escapeHtml(hiddenFeatureCount)} more</li>`
      : '';

    // Add pricing examples if they exist (for Enterprise tier)
    let pricingExamples = '';
    if (plan.pricingExamples && plan.pricingExamples.length > 0) {
      pricingExamples = '<div class="pricing-examples"><strong>Examples:</strong><ul>' +
        plan.pricingExamples.map(ex => `<li>${escapeHtml(ex)}</li>`).join('') +
        '</ul></div>';
    }

    card.innerHTML = `
      ${popularBadge}
      <div class="plan-badge">${escapeHtml(plan.badge || '📦')}</div>
      <div class="plan-name">${escapeHtml(plan.label)}</div>
      <div class="plan-description">${escapeHtml(plan.description || '')}</div>
      ${priceDisplay}
      <ul class="plan-features">
        ${features}
        ${moreFeatures}
      </ul>
      ${pricingExamples}
      ${addonControl}
      ${ctaBlock}
    `;

    return card;
  }

  // Render all paid plans in a clean grid (no section headers)
  paidPlans.forEach(plan => {
    grid.appendChild(renderPlanCard(plan));
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
