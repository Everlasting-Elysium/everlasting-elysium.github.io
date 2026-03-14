/**
 * HollowLight — Local Search
 *
 * Data source: hexo-generator-searchdb → search.json
 * Format:  [{title, url, content, tags?, categories?}]
 *
 * Features:
 *  - AND multi-keyword search (space-separated)
 *  - Searches title + content + tags
 *  - Title matches ranked higher
 *  - Keyword highlighting with <mark>
 *  - Keyboard navigation ↑↓ Enter Esc
 *  - Ctrl/Cmd+K shortcut
 *  - Lazy data fetch (first open only)
 */
;(function () {
  'use strict';

  /* ---- DOM refs ---- */
  var overlay  = document.getElementById('hl-search-overlay');
  var backdrop = document.getElementById('hl-search-backdrop');
  var input    = document.getElementById('hl-search-input');
  var closeBtn = document.getElementById('hl-search-close');
  var body     = document.getElementById('hl-search-body');
  var hint     = document.getElementById('hl-search-hint');
  var results  = document.getElementById('hl-search-results');

  if (!overlay || !input) return;

  /* ---- State ---- */
  var dataPath     = window.__HL_SEARCH_PATH__ || '/search.json';
  var searchData   = null;   // Array<entry> once loaded
  var loading      = false;
  var activeIdx    = -1;

  /* ---- Public API ---- */
  window.openSearch = openSearch;

  /* ---- Trigger: header button ---- */
  var btn = document.getElementById('hl-search-btn');
  if (btn) btn.addEventListener('click', openSearch);

  /* ---- Trigger: Ctrl+K / Cmd+K ---- */
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      openSearch();
    }
  });

  /* ============================================================
     Open / Close
  ============================================================ */

  function openSearch() {
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(function () { input.focus(); }, 30);
    if (!searchData && !loading) fetchData();
  }

  function closeSearch() {
    overlay.hidden = true;
    document.body.style.overflow = '';
    input.value = '';
    showHint();
    activeIdx = -1;
  }

  closeBtn.addEventListener('click', closeSearch);
  backdrop.addEventListener('click', closeSearch);

  document.addEventListener('keydown', function (e) {
    if (overlay.hidden) return;
    switch (e.key) {
      case 'Escape':    e.preventDefault(); closeSearch(); break;
      case 'ArrowDown': e.preventDefault(); navigate(+1); break;
      case 'ArrowUp':   e.preventDefault(); navigate(-1); break;
      case 'Enter':     e.preventDefault(); openSelected(); break;
    }
  });

  /* ============================================================
     Data loading
  ============================================================ */

  function fetchData(cb) {
    loading = true;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', dataPath, true);
    xhr.onload = function () {
      loading = false;
      if (xhr.status === 200) {
        try { searchData = JSON.parse(xhr.responseText); } catch (e) { searchData = []; }
        if (cb) cb();
      }
    };
    xhr.onerror = function () { loading = false; };
    xhr.send();
  }

  /* ============================================================
     Search
  ============================================================ */

  input.addEventListener('input', function () {
    var q = this.value.trim();
    activeIdx = -1;
    if (!q) { showHint(); return; }
    if (searchData) {
      doSearch(q);
    } else if (!loading) {
      fetchData(function () { doSearch(q); });
    }
  });

  function doSearch(q) {
    var keywords = q.toLowerCase().split(/\s+/).filter(Boolean);

    var hits = [];
    for (var i = 0; i < searchData.length; i++) {
      var entry   = searchData[i];
      var title   = (entry.title   || '').toLowerCase();
      var content = (entry.content || '').toLowerCase();
      var tags    = (entry.tags    || []).join(' ').toLowerCase();

      // AND: every keyword must appear somewhere
      var allMatch = keywords.every(function (kw) {
        return title.indexOf(kw) !== -1 ||
               content.indexOf(kw) !== -1 ||
               tags.indexOf(kw) !== -1;
      });
      if (!allMatch) continue;

      // Score: title hits weighted 10×
      var score = 0;
      keywords.forEach(function (kw) {
        if (title.indexOf(kw) !== -1)   score += 10;
        if (content.indexOf(kw) !== -1) score += 1;
        if (tags.indexOf(kw) !== -1)    score += 3;
      });

      hits.push({ entry: entry, score: score });
    }

    hits.sort(function (a, b) { return b.score - a.score; });
    renderResults(hits.slice(0, 20), keywords);
  }

  /* ============================================================
     Rendering
  ============================================================ */

  function showHint() {
    if (hint) hint.style.display = '';
    results.innerHTML = '';
  }

  function renderResults(hits, keywords) {
    if (hint) hint.style.display = 'none';

    if (!hits.length) {
      results.innerHTML =
        '<div class="hl-search-empty">' +
        '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>' +
        '<span>没有找到相关文章</span>' +
        '</div>';
      return;
    }

    var html = '';
    for (var i = 0; i < hits.length; i++) {
      var entry   = hits[i].entry;
      var titleHL = hlText(entry.title || '无题', keywords);
      var excerpt = getExcerpt(entry.content || '', keywords, 130);
      var excHL   = hlText(excerpt, keywords);

      var tagsHtml = '';
      var entryTags = entry.tags || [];
      for (var t = 0; t < entryTags.length && t < 5; t++) {
        tagsHtml += '<span class="hl-search-item-tag">' + esc(entryTags[t]) + '</span>';
      }

      html +=
        '<div class="hl-search-item" role="option" aria-selected="false"' +
        ' data-url="' + esc(entry.url || '#') + '" tabindex="-1">' +
        '<div class="hl-search-item-title">' + titleHL + '</div>' +
        '<div class="hl-search-item-excerpt">' + excHL + '</div>' +
        (tagsHtml ? '<div class="hl-search-item-meta">' + tagsHtml + '</div>' : '') +
        '</div>';
    }

    results.innerHTML = html;

    // Bind click
    var items = results.querySelectorAll('.hl-search-item');
    for (var j = 0; j < items.length; j++) {
      (function (el) {
        el.addEventListener('click', function () {
          window.location.href = el.dataset.url;
        });
      })(items[j]);
    }
  }

  /* ============================================================
     Highlight & Excerpt helpers
  ============================================================ */

  /** Extract a snippet around the first keyword hit */
  function getExcerpt(text, keywords, maxLen) {
    if (!text) return '';
    var lower = text.toLowerCase();
    var pos = -1;
    for (var k = 0; k < keywords.length; k++) {
      pos = lower.indexOf(keywords[k]);
      if (pos !== -1) break;
    }
    if (pos === -1) return text.slice(0, maxLen) + (text.length > maxLen ? '…' : '');
    var start = Math.max(0, pos - 24);
    var end   = Math.min(text.length, start + maxLen);
    return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
  }

  /** Wrap keyword occurrences in <mark> (case-insensitive) */
  function hlText(text, keywords) {
    if (!text || !keywords.length) return esc(text || '');
    var escaped = esc(text);
    keywords.forEach(function (kw) {
      if (!kw) return;
      var pattern = new RegExp(escRe(esc(kw)), 'gi');
      escaped = escaped.replace(pattern, '<mark>$&</mark>');
    });
    return escaped;
  }

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escRe(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /* ============================================================
     Keyboard navigation
  ============================================================ */

  function navigate(delta) {
    var items = results.querySelectorAll('.hl-search-item');
    if (!items.length) return;
    activeIdx = Math.max(0, Math.min(items.length - 1, activeIdx + delta));
    items.forEach(function (el, i) {
      el.setAttribute('aria-selected', i === activeIdx ? 'true' : 'false');
    });
    items[activeIdx].scrollIntoView({ block: 'nearest' });
  }

  function openSelected() {
    var items = results.querySelectorAll('.hl-search-item');
    if (activeIdx >= 0 && items[activeIdx]) {
      window.location.href = items[activeIdx].dataset.url;
    }
  }

})();
