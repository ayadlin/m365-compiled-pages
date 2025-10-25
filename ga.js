// Google Analytics 4 Setup
// Replace G-XXXXXXXXXX with your actual Measurement ID from analytics.google.com

// Initialize gtag
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

// Configure your GA4 property
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

// Track purchase clicks
window.trackPurchaseClick = function(plan) {
  trackEvent('purchase_initiated', {
    'event_category': 'conversion',
    'event_label': plan,
    'value': 1
  });
};
