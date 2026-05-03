
// HTML escape utility — used to defend against XSS when interpolating untrusted
// data into innerHTML. Strata audit (2026-05-03) flagged data-bearing
// interpolations across this file; the helper is now applied to all of them.
function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Show admin link for logged-in admin users
(function checkAdminAccess() {
  const hasAdminAccess = document.cookie.split('; ').find(row => row.startsWith('admin_logged_in='));
  if (hasAdminAccess) {
    document.getElementById('admin-link').style.display = 'block';
  }
})();

// Documentation loader
async function loadMarkdown(mdPath) {
  const contentEl = document.getElementById('markdown-content');

  try {
    const response = await fetch(mdPath);
    if (!response.ok) {
      throw new Error(`Failed to load documentation: ${escapeHtml(response.statusText)}`);
    }

    const markdown = await response.text();

    // Render markdown to HTML using marked.js
    contentEl.innerHTML = marked.parse(markdown);

    // Highlight code blocks if hljs is available
    if (typeof hljs !== 'undefined') {
      document.querySelectorAll('pre code').forEach((block) => {
        hljs.highlightElement(block);
      });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

  } catch (error) {
    contentEl.innerHTML = `
      <div style="text-align: center; padding: 4rem; color: var(--error);">
        <h2>⚠️ Error Loading Documentation</h2>
        <p>${escapeHtml(error.message)}</p>
        <a href="/" class="back-link">← Back to Home</a>
      </div>
    `;
    console.error('Error loading markdown:', error);
  }
}
