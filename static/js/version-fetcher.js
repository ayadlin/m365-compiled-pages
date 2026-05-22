// Dynamic Version Fetcher for M365 WebApps
// Fetches latest release versions from GitHub API and updates download links

const GITHUB_REPO = 'ayadlin/m365-compiled';
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}/releases`;

// Cache versions in sessionStorage to avoid repeated API calls
const CACHE_KEY = 'm365_versions_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get tier type from current page URL
 */
function getCurrentTier() {
  const path = window.location.pathname;
  if (path.includes('m365-native')) return 'native';
  if (path.includes('m365-foundation')) return 'foundation';
  return null;
}

/**
 * Determine tier from release tag name
 */
function getTierFromTag(tagName) {
  if (tagName.startsWith('native-v')) return 'native';
  if (tagName.match(/^v\d+\.\d+\.\d+$/)) return 'foundation';
  return null;
}

/**
 * Extract version number from tag (removes 'v' or 'native-v' prefix)
 */
function extractVersion(tagName) {
  return tagName.replace(/^(native-)?v/, '');
}

/**
 * Get cached versions if available and not expired
 */
function getCachedVersions() {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { timestamp, versions } = JSON.parse(cached);
    const now = Date.now();

    if (now - timestamp < CACHE_DURATION) {
      return versions;
    }

    // Cache expired
    sessionStorage.removeItem(CACHE_KEY);
    return null;
  } catch (error) {
    console.error('Error reading version cache:', error);
    return null;
  }
}

/**
 * Cache versions
 */
function cacheVersions(versions) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      versions
    }));
  } catch (error) {
    console.error('Error caching versions:', error);
  }
}

/**
 * Fetch latest versions from GitHub API
 */
async function fetchLatestVersions() {
  // Check cache first
  const cached = getCachedVersions();
  if (cached) {
    console.log('Using cached versions:', cached);
    return cached;
  }

  console.log('Fetching versions from GitHub API...');

  try {
    const response = await fetch(GITHUB_API);
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const releases = await response.json();

    // Find latest stable release for each tier
    const foundationRelease = releases.find(r =>
      !r.prerelease && getTierFromTag(r.tag_name) === 'foundation'
    );
    const nativeRelease = releases.find(r =>
      !r.prerelease && getTierFromTag(r.tag_name) === 'native'
    );

    const versions = {
      foundation: foundationRelease ? extractVersion(foundationRelease.tag_name) : null,
      native: nativeRelease ? extractVersion(nativeRelease.tag_name) : null,
      foundationTag: foundationRelease?.tag_name || null,
      nativeTag: nativeRelease?.tag_name || null
    };

    console.log('Fetched versions:', versions);

    // Cache the results
    cacheVersions(versions);

    return versions;
  } catch (error) {
    console.error('Error fetching versions from GitHub:', error);
    return null;
  }
}

/**
 * Update all version references on the page
 */
function updateVersionReferences(version, tier) {
  if (!version) {
    console.warn('No version provided for update');
    return;
  }

  console.log(`Updating ${tier} version references to ${version}`);

  // Update all text content that matches version pattern
  const versionPattern = /\d+\.\d+\.\d+/g;
  const elements = document.querySelectorAll('.download-btn, .install-code, a[href*="packages.ytech.tools"]');

  elements.forEach(el => {
    // Update href attributes
    if (el.hasAttribute('href')) {
      const currentHref = el.getAttribute('href');
      const newHref = currentHref.replace(versionPattern, version);
      if (currentHref !== newHref) {
        el.setAttribute('href', newHref);
        console.log(`Updated href: ${currentHref} → ${newHref}`);
      }
    }

    // Update text content in install code blocks
    if (el.classList.contains('install-code')) {
      const currentText = el.textContent;
      const newText = currentText.replace(versionPattern, version);
      if (currentText !== newText) {
        el.textContent = newText;
        console.log('Updated install code text');
      }
    }
  });

  // Update any version display elements
  const versionDisplays = document.querySelectorAll('.version-number, [data-version]');
  versionDisplays.forEach(el => {
    el.textContent = version;
  });
}

/**
 * Add version indicator badge to header
 */
function addVersionBadge(version, tier) {
  if (!version) return;

  const header = document.querySelector('header');
  if (!header) return;

  // Check if badge already exists
  if (document.querySelector('.version-badge')) return;

  const badge = document.createElement('div');
  badge.className = 'version-badge';
  badge.style.cssText = `
    display: inline-block;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-size: 0.9rem;
    font-weight: 600;
    margin-top: 0.5rem;
  `;
  badge.textContent = `Latest: v${version}`;

  header.appendChild(badge);
}

/**
 * Add "View All Versions" link
 */
function addLegacyVersionsLink() {
  const header = document.querySelector('header');
  if (!header) return;

  // Check if link already exists
  if (document.querySelector('.legacy-versions-link')) return;

  const link = document.createElement('a');
  link.href = '/legacy-versions.html';
  link.className = 'legacy-versions-link';
  link.style.cssText = `
    display: inline-block;
    color: white;
    text-decoration: underline;
    margin-top: 0.5rem;
    font-size: 0.9rem;
    opacity: 0.9;
    transition: opacity 0.2s;
  `;
  link.textContent = '📦 View All Versions';
  link.onmouseover = () => link.style.opacity = '1';
  link.onmouseout = () => link.style.opacity = '0.9';

  header.appendChild(link);
}

/**
 * Initialize version fetcher
 */
async function initVersionFetcher() {
  const tier = getCurrentTier();
  if (!tier) {
    console.log('Could not determine tier from URL, skipping version update');
    return;
  }

  console.log(`Initializing version fetcher for tier: ${tier}`);

  // Fetch latest versions
  const versions = await fetchLatestVersions();

  if (!versions) {
    console.warn('Could not fetch versions, keeping existing values');
    return;
  }

  const latestVersion = tier === 'native' ? versions.native : versions.foundation;

  if (latestVersion) {
    updateVersionReferences(latestVersion, tier);
    addVersionBadge(latestVersion, tier);
  } else {
    console.warn(`No ${tier} version found in GitHub releases`);
  }

  // Add legacy versions link
  addLegacyVersionsLink();
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVersionFetcher);
} else {
  // DOM already loaded
  initVersionFetcher();
}

// Export for manual usage
window.M365VersionFetcher = {
  fetch: fetchLatestVersions,
  update: updateVersionReferences,
  getCurrentTier,
  getCachedVersions
};
