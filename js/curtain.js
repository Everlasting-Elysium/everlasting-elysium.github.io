;(function () {
  'use strict';

  var curtain = document.getElementById('hl-curtain');
  if (!curtain) return;

  // --- Header visibility: hide while curtain fills viewport ---
  var header = document.querySelector('header');
  function syncHeader() {
    var h = curtain.offsetHeight || window.innerHeight;
    if (header) {
      // Also show header when near the bottom of the page (short post lists)
      var nearBottom = (window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 60;
      header.classList.toggle('header--curtain-hidden', window.scrollY < h * 0.5 && !nearBottom);
    }
  }
  window.addEventListener('scroll', syncHeader, { passive: true });
  syncHeader();

  // --- Typewriter ---
  var texts = (window.__HL_CURTAIN_TEXTS__ || []).filter(Boolean);
  if (!texts.length) texts = [''];

  var textEl = document.getElementById('curtain-tw-text');
  var idx = 0, charIdx = 0, deleting = false;

  function tick() {
    if (!textEl) return;
    var cur = texts[idx] || '';
    if (!deleting) {
      charIdx++;
      textEl.textContent = cur.slice(0, charIdx);
      if (charIdx >= cur.length) {
        deleting = true;
        setTimeout(tick, 2000);
        return;
      }
      setTimeout(tick, 75 + Math.random() * 55);
    } else {
      charIdx--;
      textEl.textContent = cur.slice(0, charIdx);
      if (charIdx <= 0) {
        deleting = false;
        idx = (idx + 1) % texts.length;
        setTimeout(tick, 380);
        return;
      }
      setTimeout(tick, 32 + Math.random() * 22);
    }
  }
  if (texts[0]) setTimeout(tick, 800);

  // --- Scroll hint: click to scroll past curtain ---
  var scrollBtn = document.getElementById('curtain-scroll-btn');
  if (scrollBtn) {
    scrollBtn.addEventListener('click', function () {
      var h = curtain.offsetHeight || window.innerHeight;
      window.scrollTo({ top: h, behavior: 'smooth' });
    });
  }
})();
