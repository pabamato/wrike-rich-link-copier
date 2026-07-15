(function() {
  // Prevent double loading
  if (window.__wrikeRichLinkInterceptorLoaded) return;
  window.__wrikeRichLinkInterceptorLoaded = true;

  // Stash original browser copy methods so we don't cause infinite loops
  const originalWriteText = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText.bind(navigator.clipboard) : null;
  const originalWrite = navigator.clipboard && navigator.clipboard.write ? navigator.clipboard.write.bind(navigator.clipboard) : null;

  // Clean the task/project title
  function getCleanWrikeTitle() {
    return document.title.replace(/\s*-\s*Wrike$/i, '').trim();
  }

  // Escape a string so it is safe inside HTML text/attribute content.
  // Wrike titles routinely contain &, <, >, and quotes, which would
  // otherwise corrupt the generated anchor markup on the clipboard.
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Build the rich-text anchor with all interpolated values escaped.
  function buildAnchorHtml(url, title) {
    const safeTitle = escapeHtml(title) || escapeHtml(url);
    return `<a href="${escapeHtml(url)}">${safeTitle}</a>`;
  }

  // Detect if copied text is a Wrike link
  function isWrikeUrl(str) {
    if (typeof str !== 'string') return false;
    try {
      const url = new URL(str);
      return url.hostname.endsWith('wrike.com');
    } catch (e) {
      return false;
    }
  }

  // Inject the beautiful Rich Link to the Clipboard
  async function writeRichLink(url, title) {
    const htmlBlob = new Blob([buildAnchorHtml(url, title)], { type: 'text/html' });
    const plainBlob = new Blob([url], { type: 'text/plain' });
    try {
      if (originalWrite) {
        await originalWrite([
          new ClipboardItem({
            'text/html': htmlBlob,
            'text/plain': plainBlob
          })
        ]);
      } else if (originalWriteText) {
        await originalWriteText(url);
      }
      showToast();
    } catch (err) {
      console.error('Wrike Rich Copier failed:', err);
    }
  }

  // Visual Confirmation Toast
  function showToast() {
    if (!document.body) return;

    const existing = document.getElementById('wrike-rich-copier-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'wrike-rich-copier-toast';
    toast.textContent = '📋 Copied Rich Link!';
    Object.assign(toast.style, {
      position: 'fixed', top: '20px', right: '20px', padding: '10px 20px',
      background: 'rgb(40, 167, 69)', color: 'rgb(255, 255, 255)', borderRadius: '5px',
      zIndex: '999999', fontFamily: 'sans-serif', boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      pointerEvents: 'none', transition: 'opacity 0.2s ease-in-out'
    });
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 200);
    }, 1200);
  }

  // INTERCEPT 1: Modern writeText (Direct clipboard writing)
  if (originalWriteText) {
    navigator.clipboard.writeText = async function(text) {
      if (isWrikeUrl(text)) {
        const title = getCleanWrikeTitle();
        await writeRichLink(text, title);
      } else {
        return originalWriteText(text);
      }
    };
  }

  // INTERCEPT 2: Modern write (Generic clipboard writing)
  if (originalWrite) {
    navigator.clipboard.write = async function(data) {
      try {
        for (const item of data) {
          if (item.types.includes('text/plain')) {
            const blob = await item.getType('text/plain');
            const text = await blob.text();
            if (isWrikeUrl(text)) {
              const title = getCleanWrikeTitle();
              await writeRichLink(text, title);
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Wrike Rich Interceptor error, falling back to original write:', err);
      }
      return originalWrite(data);
    };
  }

  // INTERCEPT 3: Legacy command fallback
  document.addEventListener('copy', (e) => {
    const selection = document.getSelection()?.toString() || '';
    if (isWrikeUrl(selection)) {
      e.preventDefault();
      const title = getCleanWrikeTitle();
      e.clipboardData.setData('text/plain', selection);
      e.clipboardData.setData('text/html', buildAnchorHtml(selection, title));
      showToast();
    }
  }, true);

})();