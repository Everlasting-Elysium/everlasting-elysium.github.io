/**
 * HollowLight — Waterfall Layout & Window Manager
 *
 * Pure vanilla JS. No dependencies.
 * Exports: window.waterfall(), window.closeWindow()
 */
(function () {
  'use strict';

  /* ---- Constants ---- */
  var CARD_WIDTH  = 256;
  var GAP         = 16;
  var COL_UNIT    = CARD_WIDTH + GAP;   // 272px per column
  var DEBOUNCE_MS = 500;

  /* ---- State ---- */
  var pageUrl       = window.location.href;
  var debounceTimer = null;

  /* ==========================================================
     Waterfall Layout
     ========================================================== */

  /**
   * Calculate absolute positions for every .card inside .list.
   * Finds the shortest column and places the next card there.
   */
  function waterfall() {
    var main = document.querySelector('main.home');
    var list = document.querySelector('main.home .list');
    if (!main || !list) return;

    var cards = list.querySelectorAll('.card');
    if (!cards.length) return;

    var pageWidth = main.clientWidth;
    // n columns need: n*CARD_WIDTH + (n-1)*GAP = n*COL_UNIT - GAP
    // Trailing gap is not required — add GAP back before flooring to fit the extra column
    var colNum = Math.max(1, Math.floor((pageWidth + GAP) / COL_UNIT));

    // List width = cards + inter-card gaps only (no trailing gap)
    list.style.width = (colNum * COL_UNIT - GAP) + 'px';

    var colHeights = [];
    for (var c = 0; c < colNum; c++) colHeights[c] = 0;

    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];

      // Find shortest column
      var minH  = colHeights[0];
      var minIdx = 0;
      for (var j = 1; j < colNum; j++) {
        if (colHeights[j] < minH) {
          minH   = colHeights[j];
          minIdx = j;
        }
      }

      card.style.position = 'absolute';
      card.style.left     = minIdx * COL_UNIT + 'px';
      card.style.top      = minH + 'px';

      colHeights[minIdx] += card.offsetHeight + GAP;
    }

    // Set container height to tallest column
    var maxH = colHeights[0];
    for (var k = 1; k < colHeights.length; k++) {
      if (colHeights[k] > maxH) maxH = colHeights[k];
    }
    list.style.height = maxH + 'px';
  }

  /** Debounced wrapper for resize events */
  function waterfallDebounced() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(waterfall, DEBOUNCE_MS);
  }

  /* ==========================================================
     Window (iframe overlay) Management
     ========================================================== */

  /**
   * Open an article inside the .window iframe overlay.
   * @param {string} href — article URL
   */
  function openWindow(href) {
    var win   = document.querySelector('.window');
    var frame = document.querySelector('.window-frame');
    if (!win || !frame) return;

    var sep = href.indexOf('?') === -1 ? '?' : '&';
    frame.src = href + sep + 'window=true';

    history.pushState({ hollowWindow: true }, '', href);
    win.style.display = 'flex';

    // Overlay covers clicks via z-index — no need to set pointer-events
    window.removeEventListener('resize', waterfallDebounced);
  }

  /**
   * Close the .window iframe overlay.
   * @param {boolean} [fromPopstate] — true when called by popstate (skip pushState)
   */
  function closeWindow(fromPopstate) {
    var win   = document.querySelector('.window');
    var frame = document.querySelector('.window-frame');
    if (!win) return;

    win.style.display = 'none';
    if (frame) frame.src = 'about:blank';

    if (!fromPopstate) {
      history.replaceState(null, '', pageUrl);
    }

    // Resume waterfall
    window.addEventListener('resize', waterfallDebounced);
    waterfallDebounced();

  }

  /* ---- Expose globally ---- */
  window.waterfall   = waterfall;
  window.closeWindow = closeWindow;

  /* ==========================================================
     Event Binding
     ========================================================== */

  document.addEventListener('DOMContentLoaded', function () {
    var list = document.querySelector('main.home .list');
    if (!list) return;

    /* ---- Event Delegation: card clicks ---- */
    list.addEventListener('click', function (e) {
      var target = e.target;

      // Walk up from click target to find the .card anchor
      while (target && target !== list) {
        if (target.classList && target.classList.contains('card')) {
          e.preventDefault();
          var href = target.getAttribute('href');
          if (href) openWindow(href);
          return;
        }
        target = target.parentNode;
      }
    });

    /* ---- Recalc waterfall after each image loads ---- */
    var imgs = list.querySelectorAll('.headimg');
    for (var i = 0; i < imgs.length; i++) {
      (function (img) {
        if (img.complete) return;           // already cached
        img.addEventListener('load', waterfall);
        img.addEventListener('error', waterfall);   // fallback also changes height
      })(imgs[i]);
    }

    waterfall();
  });

  /* ---- Global Listeners ---- */
  window.addEventListener('resize', waterfallDebounced);
  window.addEventListener('load', waterfall);

  window.addEventListener('popstate', function () {
    // If overlay is visible, close it on back
    var win = document.querySelector('.window');
    if (win && win.style.display !== 'none') {
      closeWindow(true);
    }
  });
})();
