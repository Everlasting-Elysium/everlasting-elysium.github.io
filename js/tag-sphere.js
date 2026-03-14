/**
 * HollowLight — 3D Tag Sphere
 * ZZZ / InterKnot aesthetic: dark bg + yellow (#fbfe00) accent
 *
 * Algorithm:
 *   - Fibonacci sphere distribution for uniform point spreading
 *   - Incremental rotation matrix (no Euler angle accumulation)
 *   - Perspective projection with depth-based opacity + color
 *   - Mouse control with smooth lerp
 */
(function () {
  'use strict';

  /* ── Config ─────────────────────────────────────── */
  var AUTO_SPEED_X  = 0.0003;   // rad/frame (tilt up)
  var AUTO_SPEED_Y  = 0.001;    // rad/frame (spin right)
  var MOUSE_FACTOR  = 0.018;    // mouse-drag influence
  var FOV           = 280;      // perspective focal length
  var MIN_FONT      = 12;       // px — smallest tag
  var MAX_FONT      = 26;       // px — largest tag
  var LERP          = 0.08;     // speed interpolation factor

  /* ── DOM refs ────────────────────────────────────── */
  var container = document.getElementById('tag-sphere');
  var tags      = window.__HL_TAGS__ || [];

  if (!container || !tags.length) return;

  var W = container.offsetWidth  || 540;
  var H = container.offsetHeight || 540;
  var R = Math.min(W, H) * 0.42; // sphere radius

  /* ── Build tag items ─────────────────────────────── */
  var minCount = Infinity, maxCount = -Infinity;
  tags.forEach(function (t) {
    if (t.count < minCount) minCount = t.count;
    if (t.count > maxCount) maxCount = t.count;
  });

  var golden = Math.PI * (3 - Math.sqrt(5)); // ≈ 2.399963

  var items = tags.map(function (t, i) {
    /* Fibonacci sphere: uniform point on unit sphere */
    var y   = 1 - (i / (tags.length - 1 || 1)) * 2; // 1 → -1
    var r   = Math.sqrt(Math.max(0, 1 - y * y));
    var phi = golden * i;
    var x   = Math.cos(phi) * r;
    var z   = Math.sin(phi) * r;

    /* Font size proportional to post count */
    var ratio = (maxCount === minCount)
      ? 0.5
      : (t.count - minCount) / (maxCount - minCount);
    var fontSize = MIN_FONT + ratio * (MAX_FONT - MIN_FONT);

    /* Create DOM element */
    var el = document.createElement('a');
    el.className   = 'tag-sphere-item';
    el.href        = t.url;
    el.textContent = t.name;
    if (t.count > 1) {
      var sup = document.createElement('span');
      sup.className   = 'tag-sphere-count';
      sup.textContent = t.count;
      el.appendChild(sup);
    }
    container.appendChild(el);

    return { x: x, y: y, z: z, el: el, baseFont: fontSize, hovered: false };
  });

  /* ── Speed state ─────────────────────────────────── */
  var curSpeedX = AUTO_SPEED_X;
  var curSpeedY = AUTO_SPEED_Y;
  var tgtSpeedX = AUTO_SPEED_X;
  var tgtSpeedY = AUTO_SPEED_Y;
  var anyHovered = false;       // true while any tag is under cursor

  /* ── Mouse control ───────────────────────────────── */
  var wrap = document.getElementById('tag-sphere-wrap') || container;

  wrap.addEventListener('mousemove', function (e) {
    /* Do not override speed while a tag is hovered — let it brake to 0 */
    if (anyHovered) return;
    var rect = wrap.getBoundingClientRect();
    var mx   = (e.clientX - rect.left  - rect.width  / 2) / (rect.width  / 2);
    var my   = (e.clientY - rect.top   - rect.height / 2) / (rect.height / 2);
    tgtSpeedX =  my * MOUSE_FACTOR;
    tgtSpeedY =  mx * MOUSE_FACTOR;
  });

  wrap.addEventListener('mouseleave', function () {
    anyHovered = false;
    tgtSpeedX = AUTO_SPEED_X;
    tgtSpeedY = AUTO_SPEED_Y;
  });

  /* Hover: freeze sphere so the tag stays put and is always clickable */
  items.forEach(function (item) {
    item.el.addEventListener('mouseenter', function () {
      item.hovered = true;
      anyHovered   = true;
      tgtSpeedX    = 0;
      tgtSpeedY    = 0;
    });
    item.el.addEventListener('mouseleave', function () {
      item.hovered = false;
      /* Only clear anyHovered if no sibling is still hovered */
      anyHovered = items.some(function (it) { return it.hovered; });
      if (!anyHovered) {
        tgtSpeedX = AUTO_SPEED_X;
        tgtSpeedY = AUTO_SPEED_Y;
      }
    });
  });

  /* ── Rotation helpers ────────────────────────────── */
  function rotateY(p, a) {
    var cos = Math.cos(a), sin = Math.sin(a);
    return { x: p.x * cos + p.z * sin, y: p.y, z: -p.x * sin + p.z * cos };
  }
  function rotateX(p, a) {
    var cos = Math.cos(a), sin = Math.sin(a);
    return { x: p.x, y: p.y * cos - p.z * sin, z: p.y * sin + p.z * cos };
  }

  /* ── Render loop ─────────────────────────────────── */
  function render() {
    /* Smooth speed lerp */
    curSpeedX += (tgtSpeedX - curSpeedX) * LERP;
    curSpeedY += (tgtSpeedY - curSpeedY) * LERP;

    items.forEach(function (item) {
      /* Apply rotation to unit-sphere coords */
      var p = rotateY({ x: item.x, y: item.y, z: item.z }, curSpeedY);
      p     = rotateX(p, curSpeedX);
      /* Write back */
      item.x = p.x; item.y = p.y; item.z = p.z;

      /* Perspective scale */
      var scale  = FOV / Math.max(FOV * 0.3, FOV + item.z * R);
      var px     = item.x * R * scale + W / 2;
      var py     = item.y * R * scale + H / 2;
      var depth  = (item.z + 1) / 2; // 0 (back) → 1 (front)

      var fontSize = item.baseFont * scale;
      var opacity  = 0.15 + depth * 0.85;

      /* Color: back=gray → mid=white → front=yellow */
      var color, shadow;
      if (item.hovered) {
        color  = '#fbfe00';
        shadow = '0 0 12px rgba(251,254,0,0.9), 0 0 24px rgba(251,254,0,0.5)';
      } else if (depth >= 0.5) {
        /* front half: white → yellow */
        var t   = (depth - 0.5) * 2; // 0→1
        var r   = Math.round(255);
        var g   = Math.round(255);
        var b   = Math.round(255 - t * 255);
        color   = 'rgb(' + r + ',' + g + ',' + b + ')';
        var glow = t * 0.65;
        shadow  = glow > 0.1
          ? '0 0 ' + Math.round(4 + t * 10) + 'px rgba(251,254,0,' + glow.toFixed(2) + ')'
          : 'none';
      } else {
        /* back half: dark-gray → white */
        var tBack = depth * 2; // 0→1
        var lum   = Math.round(80 + tBack * 175);
        color     = 'rgb(' + lum + ',' + lum + ',' + lum + ')';
        shadow    = 'none';
      }

      var el = item.el;
      el.style.left       = px + 'px';
      el.style.top        = py + 'px';
      el.style.fontSize   = fontSize + 'px';
      el.style.opacity    = opacity;
      el.style.color      = color;
      el.style.textShadow = shadow;
      el.style.zIndex     = Math.round(depth * 1000);
    });

    requestAnimationFrame(render);
  }

  /* Resize handler */
  window.addEventListener('resize', function () {
    W = container.offsetWidth  || 540;
    H = container.offsetHeight || 540;
    R = Math.min(W, H) * 0.42;
  });

  requestAnimationFrame(render);
})();
