/**
 * HollowLight — Album Page JS
 * Handles: tab switching, lightbox, keyboard navigation
 */
;(function () {
  'use strict'

  const albums = window.__ALBUM_DATA__ || []
  if (!albums.length) return

  // --- DOM refs ---
  const tabs = document.querySelectorAll('.album-tab')
  const panels = document.querySelectorAll('.album-panel')
  const lightbox = document.getElementById('albumLightbox')

  if (!lightbox) return

  const lbImg = lightbox.querySelector('.album-lightbox__img')
  const lbTitle = lightbox.querySelector('.album-lightbox__title')
  const lbDesc = lightbox.querySelector('.album-lightbox__desc')
  const lbCounter = lightbox.querySelector('.album-lightbox__counter')
  const lbClose = lightbox.querySelector('.album-lightbox__close')
  const lbPrev = lightbox.querySelector('.album-lightbox__nav--prev')
  const lbNext = lightbox.querySelector('.album-lightbox__nav--next')
  const lbBackdrop = lightbox.querySelector('.album-lightbox__backdrop')
  const lbContainer = lightbox.querySelector('.album-lightbox__container')
  let currentAlbum = 0
  let currentPhoto = 0
  let isOpen = false

  // --- Tab switching ---
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      const idx = parseInt(this.dataset.albumIndex, 10)
      if (idx === currentAlbum && panels[idx].classList.contains('album-panel--active')) return
      switchAlbum(idx)
    })
  })

  function switchAlbum(idx) {
    // Deactivate current
    tabs.forEach(function (t) {
      t.classList.remove('album-tab--active')
      t.setAttribute('aria-selected', 'false')
    })
    panels.forEach(function (p) {
      p.classList.remove('album-panel--active')
    })

    // Activate new
    tabs[idx].classList.add('album-tab--active')
    tabs[idx].setAttribute('aria-selected', 'true')
    panels[idx].classList.add('album-panel--active')

    // Re-trigger card entry animations
    var cards = panels[idx].querySelectorAll('.album-card')
    cards.forEach(function (card, i) {
      card.style.animation = 'none'
      card.offsetHeight // force reflow
      card.style.animation = ''
    })

    currentAlbum = idx
  }

  // --- Lightbox ---
  // Open on card click
  document.querySelectorAll('.album-card').forEach(function (card) {
    card.addEventListener('click', function () {
      var aIdx = parseInt(this.dataset.album, 10)
      var pIdx = parseInt(this.dataset.photo, 10)
      openLightbox(aIdx, pIdx)
    })

    // Also support Enter key on focused card
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        var aIdx = parseInt(this.dataset.album, 10)
        var pIdx = parseInt(this.dataset.photo, 10)
        openLightbox(aIdx, pIdx)
      }
    })
  })

  function openLightbox(albumIdx, photoIdx) {
    currentAlbum = albumIdx
    currentPhoto = photoIdx
    isOpen = true

    lightbox.hidden = false
    document.body.style.overflow = 'hidden'

    updateLightboxContent()

    // Focus trap
    lbClose.focus()
  }

  function closeLightbox() {
    isOpen = false
    lightbox.hidden = true
    document.body.style.overflow = ''

    // Return focus to the card that opened it
    var card = document.querySelector(
      '.album-card[data-album="' + currentAlbum + '"][data-photo="' + currentPhoto + '"]'
    )
    if (card) card.focus()
  }

  function updateLightboxContent() {
    var album = albums[currentAlbum]
    if (!album || !album.photos) return

    var photos = album.photos
    var photo = photos[currentPhoto]
    if (!photo) return

    // Mark loading
    lbImg.classList.add('album-lightbox__img--loading')

    // Resolve src — handle Hexo url_for at build time, but src is already resolved in __ALBUM_DATA__
    var src = photo.url || photo.src || ''

    lbImg.onload = function () {
      lbImg.classList.remove('album-lightbox__img--loading')
    }
    lbImg.onerror = function () {
      lbImg.classList.remove('album-lightbox__img--loading')
      lbImg.src = '/img/default-cover.svg'
    }
    lbImg.src = src
    lbImg.alt = photo.title || photo.alt || ''

    // Click-to-link: store target in data attr, toggle pointer cursor
    var link = photo.link || ''
    lbImg.dataset.link = link
    lbImg.style.cursor = link ? 'pointer' : 'default'
    lbImg.title = link ? '点击查看原图' : ''

    lbTitle.textContent = photo.title || photo.alt || '未命名'
    lbDesc.textContent = photo.desc || ''
    lbCounter.textContent = (currentPhoto + 1) + ' / ' + photos.length

    // Nav visibility
    lbPrev.style.visibility = currentPhoto > 0 ? 'visible' : 'hidden'
    lbNext.style.visibility = currentPhoto < photos.length - 1 ? 'visible' : 'hidden'
  }

  function navPrev() {
    var album = albums[currentAlbum]
    if (!album || !album.photos) return
    if (currentPhoto > 0) {
      currentPhoto--
      updateLightboxContent()
    }
  }

  function navNext() {
    var album = albums[currentAlbum]
    if (!album || !album.photos) return
    if (currentPhoto < album.photos.length - 1) {
      currentPhoto++
      updateLightboxContent()
    }
  }

  // Close button
  lbClose.addEventListener('click', closeLightbox)

  // Nav buttons
  lbPrev.addEventListener('click', function (e) {
    e.stopPropagation()
    navPrev()
  })
  lbNext.addEventListener('click', function (e) {
    e.stopPropagation()
    navNext()
  })

  // Backdrop click to close
  lbBackdrop.addEventListener('click', closeLightbox)

  // Click on container background (outside image/nav/close/info) → close
  lbContainer.addEventListener('click', function (e) {
    var t = e.target
    if (
      t === lbImg ||
      t.closest('.album-lightbox__nav') ||
      t.closest('.album-lightbox__close') ||
      t.closest('.album-lightbox__stage') ||
      t.closest('.album-lightbox__info')
    ) return
    closeLightbox()
  })

  // Image click → navigate to photo.link (if set)
  lbImg.addEventListener('click', function (e) {
    var link = this.dataset.link
    if (link) {
      e.stopPropagation()
      window.open(link, '_blank', 'noopener,noreferrer')
    }
  })

  // --- Keyboard support ---
  document.addEventListener('keydown', function (e) {
    if (!isOpen) return

    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        closeLightbox()
        break
      case 'ArrowLeft':
        e.preventDefault()
        navPrev()
        break
      case 'ArrowRight':
        e.preventDefault()
        navNext()
        break
    }
  })

  // --- Swipe support (touch) ---
  var touchStartX = 0
  var touchEndX = 0

  lightbox.addEventListener('touchstart', function (e) {
    touchStartX = e.changedTouches[0].screenX
  }, { passive: true })

  lightbox.addEventListener('touchend', function (e) {
    touchEndX = e.changedTouches[0].screenX
    var diff = touchStartX - touchEndX
    if (Math.abs(diff) > 50) {
      if (diff > 0) navNext()
      else navPrev()
    }
  }, { passive: true })
})()
