// Google Analytics 4 Setup
// Replace G-XXXXXXXXXX with your actual Measurement ID from analytics.google.com

// Initialize gtag
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

// Configure your GA4 property
// Measurement ID from https://analytics.google.com
const MEASUREMENT_ID = 'G-ETMMN0VXS4';

if (MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
  gtag('config', MEASUREMENT_ID, {
    'page_title': document.title,
    'page_location': window.location.href,
    'page_path': window.location.pathname
  });

  // Load GA4 script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);
} else {
  console.log('[GA] Measurement ID not configured yet. Get yours at https://analytics.google.com');
}

// Custom event tracking helpers
window.trackEvent = function(eventName, eventParams) {
  if (MEASUREMENT_ID !== 'G-XXXXXXXXXX') {
    gtag('event', eventName, eventParams);
  }
};

// Track trial signups
window.trackTrialSignup = function(email) {
  trackEvent('trial_started', {
    'event_category': 'engagement',
    'event_label': 'free_trial',
    'value': 1
  });
};

// Track trial downloads/installs
window.trackTrialDownload = function(source) {
  trackEvent('trial_download', {
    'event_category': 'conversion',
    'event_label': source || 'unknown',
    'value': 1
  });
};

// Track purchase clicks
window.trackPurchaseClick = function(plan) {
  trackEvent('purchase_initiated', {
    'event_category': 'conversion',
    'event_label': plan,
    'value': 1
  });
};

// Track billing portal access
window.trackBillingPortal = function(email) {
  trackEvent('billing_portal_opened', {
    'event_category': 'engagement',
    'event_label': 'customer_billing',
    'value': 1
  });
};

// Track pricing page views
window.trackPricingView = function() {
  trackEvent('pricing_viewed', {
    'event_category': 'engagement',
    'event_label': 'pricing_page',
    'value': 1
  });
};

// Track documentation access
window.trackDocsView = function() {
  trackEvent('docs_viewed', {
    'event_category': 'engagement',
    'event_label': 'documentation',
    'value': 1
  });
};

// Track install instructions viewed
window.trackInstallView = function() {
  trackEvent('install_viewed', {
    'event_category': 'engagement',
    'event_label': 'install_instructions',
    'value': 1
  });
};

// Track CTA button clicks
window.trackCTA = function(ctaType) {
  trackEvent('cta_clicked', {
    'event_category': 'engagement',
    'event_label': ctaType,
    'value': 1
  });
};

// Auto-track page views based on URL
(function autoTrackPageViews() {
  const path = window.location.pathname;

  if (path.includes('pricing')) {
    trackPricingView();
  } else if (path.includes('docs')) {
    trackDocsView();
  } else if (path.includes('index') || path === '/' || path.endsWith('/m365/')) {
    trackEvent('homepage_viewed', {
      'event_category': 'engagement',
      'event_label': 'landing_page',
      'value': 1
    });
  }
})();
