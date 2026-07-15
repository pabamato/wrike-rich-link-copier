# Bookmarklet (cross-browser alternative)

For people who don't use a Chromium browser — or who just don't want to load an unpacked
extension — this bookmarklet does the same job on **any** browser that supports bookmarklets
(Firefox, Safari, Edge, Chrome, Arc…).

## How it differs from the extension

The extension pre-patches Wrike's clipboard APIs at page load, so Wrike's own **Copy link**
button is intercepted automatically. A bookmarklet can only run **when you click it**, so it
can't hook Wrike's button ahead of time. Instead it works **directly**: while you're on a
Wrike task, clicking the bookmarklet copies **the current page** as a rich link
(`<a href="URL">Task Title</a>`), using the same HTML-escaping, title cleanup, and dual
`text/html` + `text/plain` clipboard behavior as the extension. One click replaces "click
Wrike's Copy link button."

It uses the async `ClipboardItem` API where available and falls back to a hidden
`contenteditable` + `execCommand('copy')` selection for older browsers.

## Install

1. Create a new bookmark (bookmark any page, then edit it).
2. Name it e.g. **Copy Wrike Rich Link**.
3. Replace the bookmark's URL/address with the entire `javascript:` string in
   [the bookmarklet section below](#the-bookmarklet).

## Usage

1. Open a Wrike task in your browser.
2. Click the **Copy Wrike Rich Link** bookmark.
3. You'll see a "📋 Copied Rich Link!" toast in the top-right corner.
4. Paste anywhere: rich-text apps (Slack, Gmail, Docs) show the titled link; plain-text apps
   show the raw URL.

## Known limitation

The bookmarklet copies the **current address-bar URL**, which for most Wrike task views is
exactly the shareable permalink. If you're in a view where the address bar isn't the link you
want, use Wrike's own **Copy link** control (or the extension) instead.

## The bookmarklet

Paste this entire string as the bookmark's URL:

```
javascript:(function%20()%20%7B%20function%20escapeHtml(str)%20%7B%20return%20String(str)%20.replace(%2F%26%2Fg%2C%20'%26amp%3B')%20.replace(%2F%3C%2Fg%2C%20'%26lt%3B')%20.replace(%2F%3E%2Fg%2C%20'%26gt%3B')%20.replace(%2F%22%2Fg%2C%20'%26quot%3B')%20.replace(%2F'%2Fg%2C%20'%26%2339%3B')%3B%20%7D%20function%20getCleanWrikeTitle()%20%7B%20return%20document.title.replace(%2F%5Cs*-%5Cs*Wrike%24%2Fi%2C%20'').trim()%3B%20%7D%20var%20url%20%3D%20location.href%3B%20var%20title%20%3D%20getCleanWrikeTitle()%3B%20var%20html%20%3D%20'%3Ca%20href%3D%22'%20%2B%20escapeHtml(url)%20%2B%20'%22%3E'%20%2B%20(escapeHtml(title)%20%7C%7C%20escapeHtml(url))%20%2B%20'%3C%2Fa%3E'%3B%20function%20showToast()%20%7B%20if%20(!document.body)%20return%3B%20var%20old%20%3D%20document.getElementById('wrike-rich-copier-toast')%3B%20if%20(old)%20old.remove()%3B%20var%20toast%20%3D%20document.createElement('div')%3B%20toast.id%20%3D%20'wrike-rich-copier-toast'%3B%20toast.textContent%20%3D%20'%F0%9F%93%8B%20Copied%20Rich%20Link!'%3B%20var%20s%20%3D%20toast.style%3B%20s.position%20%3D%20'fixed'%3B%20s.top%20%3D%20'20px'%3B%20s.right%20%3D%20'20px'%3B%20s.padding%20%3D%20'10px%2020px'%3B%20s.background%20%3D%20'rgb(40%2C%20167%2C%2069)'%3B%20s.color%20%3D%20'rgb(255%2C%20255%2C%20255)'%3B%20s.borderRadius%20%3D%20'5px'%3B%20s.zIndex%20%3D%20'999999'%3B%20s.fontFamily%20%3D%20'sans-serif'%3B%20s.boxShadow%20%3D%20'0%202px%2010px%20rgba(0%2C0%2C0%2C0.2)'%3B%20s.pointerEvents%20%3D%20'none'%3B%20s.transition%20%3D%20'opacity%200.2s%20ease-in-out'%3B%20document.body.appendChild(toast)%3B%20setTimeout(function%20()%20%7B%20toast.style.opacity%20%3D%20'0'%3B%20setTimeout(function%20()%20%7B%20toast.remove()%3B%20%7D%2C%20200)%3B%20%7D%2C%201200)%3B%20%7D%20function%20fallbackCopy()%20%7B%20var%20host%20%3D%20document.createElement('div')%3B%20host.contentEditable%20%3D%20'true'%3B%20host.innerHTML%20%3D%20html%3B%20host.style.position%20%3D%20'fixed'%3B%20host.style.left%20%3D%20'-9999px'%3B%20host.style.opacity%20%3D%20'0'%3B%20document.body.appendChild(host)%3B%20var%20range%20%3D%20document.createRange()%3B%20range.selectNodeContents(host)%3B%20var%20sel%20%3D%20window.getSelection()%3B%20sel.removeAllRanges()%3B%20sel.addRange(range)%3B%20try%20%7B%20document.execCommand('copy')%3B%20showToast()%3B%20%7D%20catch%20(e)%20%7B%20console.error('Wrike%20Rich%20Copier%20failed%3A'%2C%20e)%3B%20%7D%20sel.removeAllRanges()%3B%20host.remove()%3B%20%7D%20try%20%7B%20if%20(navigator.clipboard%20%26%26%20navigator.clipboard.write%20%26%26%20window.ClipboardItem)%20%7B%20navigator.clipboard.write(%5B%20new%20ClipboardItem(%7B%20'text%2Fhtml'%3A%20new%20Blob(%5Bhtml%5D%2C%20%7B%20type%3A%20'text%2Fhtml'%20%7D)%2C%20'text%2Fplain'%3A%20new%20Blob(%5Burl%5D%2C%20%7B%20type%3A%20'text%2Fplain'%20%7D)%20%7D)%20%5D).then(showToast%2C%20fallbackCopy)%3B%20%7D%20else%20%7B%20fallbackCopy()%3B%20%7D%20%7D%20catch%20(e)%20%7B%20fallbackCopy()%3B%20%7D%20%7D)()%3B
```

## Readable source

The bookmarklet above is a minified, URL-encoded form of this script. Edit here and re-encode
(`javascript:` + `encodeURIComponent(minified)`) if you need to change it.

```js
(function () {
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function getCleanWrikeTitle() {
    return document.title.replace(/\s*-\s*Wrike$/i, '').trim();
  }

  var url = location.href;
  var title = getCleanWrikeTitle();
  var html = '<a href="' + escapeHtml(url) + '">' + (escapeHtml(title) || escapeHtml(url)) + '</a>';

  function showToast() {
    if (!document.body) return;
    var old = document.getElementById('wrike-rich-copier-toast');
    if (old) old.remove();
    var toast = document.createElement('div');
    toast.id = 'wrike-rich-copier-toast';
    toast.textContent = '📋 Copied Rich Link!';
    var s = toast.style;
    s.position = 'fixed'; s.top = '20px'; s.right = '20px'; s.padding = '10px 20px';
    s.background = 'rgb(40, 167, 69)'; s.color = 'rgb(255, 255, 255)'; s.borderRadius = '5px';
    s.zIndex = '999999'; s.fontFamily = 'sans-serif'; s.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    s.pointerEvents = 'none'; s.transition = 'opacity 0.2s ease-in-out';
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.style.opacity = '0';
      setTimeout(function () { toast.remove(); }, 200);
    }, 1200);
  }

  // Fallback for browsers without the async ClipboardItem API.
  function fallbackCopy() {
    var host = document.createElement('div');
    host.contentEditable = 'true';
    host.innerHTML = html;
    host.style.position = 'fixed';
    host.style.left = '-9999px';
    host.style.opacity = '0';
    document.body.appendChild(host);
    var range = document.createRange();
    range.selectNodeContents(host);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    try {
      document.execCommand('copy');
      showToast();
    } catch (e) {
      console.error('Wrike Rich Copier failed:', e);
    }
    sel.removeAllRanges();
    host.remove();
  }

  try {
    if (navigator.clipboard && navigator.clipboard.write && window.ClipboardItem) {
      navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([url], { type: 'text/plain' })
        })
      ]).then(showToast, fallbackCopy);
    } else {
      fallbackCopy();
    }
  } catch (e) {
    fallbackCopy();
  }
})();
```
