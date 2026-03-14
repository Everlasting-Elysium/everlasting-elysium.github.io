/**
 * HollowLight — Code Block Copy Button
 * Adds a copy button to every .markdown-content pre block.
 * Button appears on hover, shows checkmark after copy.
 */
;(function () {
  'use strict';

  var COPY_ICON =
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="9" y="9" width="13" height="13" rx="2"/>' +
    '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>' +
    '</svg>';

  var CHECK_ICON =
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
    '<polyline points="20 6 9 17 4 12"/>' +
    '</svg>';

  function init() {
    var blocks = document.querySelectorAll('.markdown-content pre');
    for (var i = 0; i < blocks.length; i++) {
      attachCopyButton(blocks[i]);
    }
  }

  function attachCopyButton(pre) {
    if (pre.querySelector('.hl-copy-btn')) return; // already added

    var btn = document.createElement('button');
    btn.className  = 'hl-copy-btn';
    btn.title      = '复制代码';
    btn.innerHTML  = COPY_ICON;
    btn.setAttribute('aria-label', '复制代码');

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var code = pre.querySelector('code');
      var text = code ? code.innerText : pre.innerText;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          showCheck(btn);
        }).catch(function () {
          fallbackCopy(text, btn);
        });
      } else {
        fallbackCopy(text, btn);
      }
    });

    pre.appendChild(btn);
  }

  function showCheck(btn) {
    btn.classList.add('hl-copy-btn--done');
    btn.innerHTML = CHECK_ICON;
    clearTimeout(btn.__resetTimer);
    btn.__resetTimer = setTimeout(function () {
      btn.classList.remove('hl-copy-btn--done');
      btn.innerHTML = COPY_ICON;
    }, 2000);
  }

  function fallbackCopy(text, btn) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.select();
    try {
      var ok = document.execCommand('copy');
      if (ok) showCheck(btn);
    } catch (e) { /* silent */ }
    document.body.removeChild(ta);
  }

  /* Run after DOM is ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
