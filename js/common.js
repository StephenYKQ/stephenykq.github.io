document.addEventListener("DOMContentLoaded", function () {
  'use strict';

  var theme = getComputedStyle(document.documentElement);
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var motionBase = parseFloat(theme.getPropertyValue("--motion-base")) || 280;
  var motionReveal = parseFloat(theme.getPropertyValue("--motion-reveal")) || 560;
  var motionEase = theme.getPropertyValue("--motion-ease").trim() || "ease";

  /* =======================
  // Menu
  ======================= */
  var body = document.querySelector("body"),
  menuOpenIcon = document.querySelector(".nav__icon-menu"),
  menuCloseIcon = document.querySelector(".nav__icon-close"),
  menuList = document.querySelector(".main-nav");

  menuOpenIcon.addEventListener("click", () => {
    menuOpen();
  });

  menuCloseIcon.addEventListener("click", () => {
    menuClose();
  });

  function menuOpen() {
    menuList.classList.add("is-open");
    menuOpenIcon.setAttribute("aria-expanded", "true");
    menuCloseIcon.focus();
  }

  function menuClose() {
    menuList.classList.remove("is-open");
    menuOpenIcon.setAttribute("aria-expanded", "false");
    menuOpenIcon.focus();
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && menuList.classList.contains("is-open")) menuClose();
  });

  /* ======================================
  // Stop Animations During Window Resizing
  ====================================== */
  let resizeTimer;
  window.addEventListener("resize", () => {
    document.body.classList.add("resize-animation-stopper");
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      document.body.classList.remove("resize-animation-stopper");
    }, 300);
  });


  /* =======================
  // Responsive Videos
  ======================= */
  reframe(".post__content iframe:not(.reframe-off), .page__content iframe:not(.reframe-off)");

  // Both archives progressively reveal the same DOM; filters reset the visible batch.
  var collections = new Map();
  document.querySelectorAll("[data-collection-list]").forEach(function (list) {
    var cards = Array.from(list.querySelector("[data-collection-grid]").children).filter(function (card) {
      return card.matches(".c-project-card, .c-blog-card");
    });
    var button = list.querySelector("[data-collection-more]");
    var status = list.querySelector("[data-collection-status]");
    var empty = list.querySelector(".c-projects-list__empty");
    var step = Number(list.dataset.collectionStep) || 6;
    var limit = step;

    function refresh(reset, animate) {
      if (reset) limit = step;
      var matched = cards.filter(function (card) { return !card.hasAttribute("data-filtered-out"); });
      var revealed = [];
      var index = 0;
      cards.forEach(function (card) {
        var wasHidden = card.hidden;
        card.hidden = card.hasAttribute("data-filtered-out") || index++ >= limit;
        if (wasHidden && !card.hidden) revealed.push(card);
      });
      button.hidden = matched.length <= limit;
      status.textContent = "Showing " + Math.min(limit, matched.length) + " of " + matched.length +
        (matched.length < cards.length ? " matching " : " ") + list.dataset.collectionName;
      if (empty) empty.hidden = matched.length > 0;
      if (animate && !reducedMotion.matches) {
        revealed.forEach(function (card, position) {
          card.animate([
            { opacity: 0, transform: "translateY(16px)" },
            { opacity: 1, transform: "translateY(0)" }
          ], { duration: motionReveal, delay: Math.min(position, step - 1) * 35, easing: motionEase, fill: "backwards" });
        });
      }
      return revealed;
    }

    collections.set(list, { refresh: refresh });
    button.addEventListener("click", function (event) {
      limit += step;
      var revealed = refresh(false, true);
      if (revealed.length && (event.detail === 0 || button.hidden)) {
        revealed[0].querySelector("a").focus({ preventScroll: true });
      }
    });
    refresh(false, false);
  });

  /* Project Filters: union within each group, intersection across groups. */
  document.querySelectorAll("[data-projects-list]").forEach(function (list) {
    var filters = list.querySelector(".c-projects-list__filters");
    if (!filters) return;
    var options = Array.from(filters.querySelectorAll("[data-filter-value]"));
    var allButton = filters.querySelector("[data-projects-all]");
    var groups = Array.from(new Set(options.map(function (option) {
      return option.dataset.filterDimension;
    }))).map(function (dimension) {
      return {
        dimension: dimension,
        options: options.filter(function (option) { return option.dataset.filterDimension === dimension; }),
        included: new Set(),
        excluded: new Set()
      };
    });
    if (!groups.length) return;
    var cards = Array.from(list.querySelectorAll("[data-project-type]"));
    function filterProjects() {
      cards.forEach(function (card) {
        card.toggleAttribute("data-filtered-out", !groups.every(function (group) {
          var value = card.getAttribute("data-project-" + group.dimension) || "";
          return group.included.size > 0 ? group.included.has(value) : !group.excluded.has(value);
        }));
      });
      groups.forEach(function (group) {
        group.options.forEach(function (option) {
          var value = option.dataset.filterValue;
          var included = group.included.has(value);
          option.classList.toggle("is-included", included);
          option.classList.toggle("is-excluded", group.excluded.has(value));
          option.querySelectorAll('[data-filter-action="include"]').forEach(function (button) {
            button.setAttribute("aria-pressed", String(included));
          });
          option.querySelector('[data-filter-action="exclude"]').setAttribute("aria-pressed", String(group.excluded.has(value)));
        });
      });
      allButton.setAttribute("aria-pressed", String(groups.every(function (group) {
        return group.included.size === 0 && group.excluded.size === 0;
      })));
      collections.get(list).refresh(true, true);
    }

      filters.addEventListener("click", function (event) {
        var button = event.target.closest("[data-filter-action]");
        if (!button) return;
        var option = button.closest("[data-filter-value]");
        var value = option.dataset.filterValue;
        var group = groups.find(function (group) { return group.dimension === option.dataset.filterDimension; });

        if (button.dataset.filterAction === "include") {
          group.excluded.clear();
          if (group.included.has(value)) {
            group.included.delete(value);
          } else {
            group.included.add(value);
          }
        } else {
          group.included.clear();
          if (group.excluded.has(value)) {
            group.excluded.delete(value);
          } else {
            group.excluded.add(value);
          }
        }
        filterProjects();
      });
      allButton.addEventListener("click", function () {
        groups.forEach(function (group) {
          group.included.clear();
          group.excluded.clear();
        });
        filterProjects();
      });
      filters.disabled = false;

      // Width transitions move neighbors; animate row changes when a pill wraps.
      if (window.ResizeObserver) {
        var positions = new Map();
        var motions = new Map();
        var layoutObserver = new ResizeObserver(function () {
          options.concat([allButton]).forEach(function (option) {
            var next = { left: option.offsetLeft, top: option.offsetTop };
            var previous = positions.get(option);
            if (previous && previous.top !== next.top && !reducedMotion.matches && !body.classList.contains("resize-animation-stopper")) {
              var transform = new DOMMatrixReadOnly(getComputedStyle(option).transform);
              var motion = motions.get(option);
              if (motion) motion.cancel();
              motions.set(option, option.animate([
                { transform: "translate(" + (previous.left - next.left + transform.m41) + "px, " + (previous.top - next.top + transform.m42) + "px)" },
                { transform: "translate(0, 0)" }
              ], { duration: motionBase, easing: motionEase }));
            }
            positions.set(option, next);
          });
        });
        options.forEach(function (option) { layoutObserver.observe(option); });
        layoutObserver.observe(filters);
      }
    filterProjects();
  });

  /* Reveal project captions only while a card passes through the mobile focus area. */
  var projectCards = Array.from(document.querySelectorAll(".c-project-card"));
  var projectFocusQuery = window.matchMedia("(hover: none), (pointer: coarse), (max-width: 768px)");
  if (projectCards.length && "IntersectionObserver" in window) {
    var projectFocusObserver;
    var projectFocusTimers = new Map();
    var projectFocusStarted = new Map();
    var projectFocusPending = new Set();
    function updateProjectFocusMode() {
      if (projectFocusObserver) projectFocusObserver.disconnect();
      projectCards.forEach(function (card) {
        clearTimeout(projectFocusTimers.get(card));
        projectFocusTimers.delete(card);
        projectFocusStarted.delete(card);
        projectFocusPending.delete(card);
        card.classList.remove("is-focused");
      });
      var enabled = projectFocusQuery.matches;
      document.body.classList.toggle("has-project-focus", enabled);
      if (!enabled) return;
      projectFocusObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var card = entry.target;
          clearTimeout(projectFocusTimers.get(card));
          projectFocusTimers.delete(card);
          if (entry.isIntersecting) {
            projectFocusPending.add(card);
            projectFocusTimers.set(card, setTimeout(function () {
              projectFocusPending.delete(card);
              card.classList.add("is-focused");
              projectFocusStarted.set(card, performance.now());
              projectFocusTimers.delete(card);
            }, reducedMotion.matches ? 0 : 120));
          } else {
            if (projectFocusPending.has(card)) {
              projectFocusPending.delete(card);
              return;
            }
            if (!card.classList.contains("is-focused")) return;
            // Let the desktop-matched entrance finish, then hold the caption briefly before reversing.
            var elapsed = performance.now() - (projectFocusStarted.get(card) || 0);
            projectFocusTimers.set(card, setTimeout(function () {
              card.classList.remove("is-focused");
              projectFocusStarted.delete(card);
              projectFocusTimers.delete(card);
            }, reducedMotion.matches ? 0 : Math.max(0, 600 - elapsed) + 300));
          }
        });
      }, { rootMargin: "-40% 0px -40% 0px", threshold: 0 });
      projectCards.forEach(function (card) { projectFocusObserver.observe(card); });
    }
    updateProjectFocusMode();
    if (projectFocusQuery.addEventListener) {
      projectFocusQuery.addEventListener("change", updateProjectFocusMode);
    } else if (projectFocusQuery.addListener) {
      projectFocusQuery.addListener(updateProjectFocusMode);
    }
  }

  /* =======================
  // Project Gallery
  ======================= */
  var projectPage = document.querySelector(".project .page");
  if (projectPage) {
    var projectCoverImage = document.querySelector(".project .c-page-image img");
    var galleryItems = Array.prototype.slice.call(projectPage.querySelectorAll("p, figure")).filter(function (node) {
      return node.querySelector("img") && node.textContent.trim() === "";
    });

    if (projectCoverImage || galleryItems.length) {
      var gallery = document.createElement("div");
      gallery.className = "project-gallery";
      var projectLightbox = document.querySelector(".project-lightbox");

      if (!projectLightbox) {
        projectLightbox = document.createElement("div");
        projectLightbox.className = "project-lightbox";
        projectLightbox.innerHTML = '<div class="project-lightbox__backdrop"></div><div class="project-lightbox__panel"><button type="button" class="project-lightbox__close" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button><button type="button" class="project-lightbox__nav project-lightbox__nav--prev" aria-label="Previous image"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 5-7 7 7 7"/></svg></button><button type="button" class="project-lightbox__nav project-lightbox__nav--next" aria-label="Next image"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></button><div class="project-lightbox__frame"><img class="project-lightbox__image" alt=""></div></div>';
        document.body.appendChild(projectLightbox);
      }

      var galleryImages = [];
      var projectLightboxImage = projectLightbox.querySelector(".project-lightbox__image");
      var projectLightboxClose = projectLightbox.querySelector(".project-lightbox__close");
      var projectLightboxBackdrop = projectLightbox.querySelector(".project-lightbox__backdrop");
      var projectLightboxPrev = projectLightbox.querySelector(".project-lightbox__nav--prev");
      var projectLightboxNext = projectLightbox.querySelector(".project-lightbox__nav--next");
      var currentGalleryIndex = 0;

      var lastProjectFocus = null;
      projectLightbox.setAttribute("role", "dialog");
      projectLightbox.setAttribute("aria-modal", "true");
      projectLightbox.setAttribute("aria-label", "Project images");
      projectLightbox.setAttribute("aria-hidden", "true");
      projectLightbox.inert = true;

      function closeProjectLightbox() {
        projectLightbox.classList.remove("is-open");
        document.body.classList.remove("project-lightbox-open");
        if (projectLightbox.contains(document.activeElement)) document.activeElement.blur();
        projectLightbox.inert = true;
        projectLightbox.setAttribute("aria-hidden", "true");
        if (lastProjectFocus && lastProjectFocus.isConnected) lastProjectFocus.focus({ preventScroll: true });
        projectLightboxImage.removeAttribute("src");
        projectLightboxImage.removeAttribute("alt");
      }

      function openProjectLightbox(index) {
        if (!galleryImages.length) {
          return;
        }

        var opening = !projectLightbox.classList.contains("is-open");
        if (opening) lastProjectFocus = document.activeElement;
        currentGalleryIndex = (index + galleryImages.length) % galleryImages.length;
        projectLightboxImage.src = galleryImages[currentGalleryIndex].src;
        projectLightboxImage.alt = galleryImages[currentGalleryIndex].alt || "";
        projectLightbox.classList.add("is-open");
        document.body.classList.add("project-lightbox-open");
        projectLightboxPrev.hidden = projectLightboxNext.hidden = galleryImages.length < 2;
        projectLightbox.inert = false;
        projectLightbox.setAttribute("aria-hidden", "false");
        if (opening) {
          requestAnimationFrame(function () {
            if (projectLightbox.classList.contains("is-open")) projectLightboxClose.focus({ preventScroll: true });
          });
        }
      }

      function stepProjectLightbox(step) {
        openProjectLightbox(currentGalleryIndex + step);
      }

      function bindProjectImage(image, index) {
        image.classList.add("no-lightense");
        image.tabIndex = 0;
        image.setAttribute("role", "button");
        image.setAttribute("aria-haspopup", "dialog");
        image.setAttribute("aria-label", "View larger image: " + (image.alt || "Project image"));
        image.addEventListener("click", function () { openProjectLightbox(index); });
        image.addEventListener("keydown", function (event) {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openProjectLightbox(index);
          }
        });
      }

      if (projectCoverImage) {
        galleryImages.push({
          src: projectCoverImage.currentSrc || projectCoverImage.getAttribute("src"),
          alt: projectCoverImage.alt
        });
        bindProjectImage(projectCoverImage, 0);
      }

      galleryItems.forEach(function (node, index) {
        var image = node.querySelector("img");
        var imageName = image && image.getAttribute("src") ? image.getAttribute("src").toLowerCase() : "";
        var imageIndex = -1;

        node.classList.add("project-gallery__item");
        if (imageName.indexOf("poster") > -1) {
          node.classList.add("project-gallery__item--poster");
        }
        node.style.setProperty("--gallery-index", index);

        if (image) {
          imageIndex = galleryImages.push({
            src: image.currentSrc || image.getAttribute("src"),
            alt: image.alt
          }) - 1;

          bindProjectImage(image, imageIndex);
        }

        gallery.appendChild(node);
      });

      if (galleryItems.length) {
        projectPage.appendChild(gallery);
      }

      projectLightboxClose.addEventListener("click", closeProjectLightbox);
      projectLightboxBackdrop.addEventListener("click", closeProjectLightbox);
      projectLightboxPrev.addEventListener("click", function () {
        stepProjectLightbox(-1);
      });
      projectLightboxNext.addEventListener("click", function () {
        stepProjectLightbox(1);
      });
      projectLightbox.addEventListener("click", function (event) {
        if (event.target === projectLightbox) {
          closeProjectLightbox();
        }
      });

      document.addEventListener("keydown", function (event) {
        if (!projectLightbox.classList.contains("is-open")) {
          return;
        }

        if (event.key === "Escape") {
          event.preventDefault();
          closeProjectLightbox();
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          stepProjectLightbox(-1);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          stepProjectLightbox(1);
        } else if (event.key === "Tab") {
          var controls = [projectLightboxClose, projectLightboxPrev, projectLightboxNext].filter(function (button) { return !button.hidden; });
          var focused = controls.indexOf(document.activeElement);
          if (event.shiftKey && focused <= 0) {
            event.preventDefault();
            controls[controls.length - 1].focus();
          } else if (!event.shiftKey && (focused < 0 || focused === controls.length - 1)) {
            event.preventDefault();
            controls[0].focus();
          }
        }
      });
    }
  }

  /* =======================
  // SDR / HDR Comparison Gallery
  ======================= */
  var hdrGallery = document.querySelector("[data-hdr-gallery]");
  if (hdrGallery) {
    var hdrDataNode = document.querySelector("[data-hdr-gallery-data]");
    var hdrItems = [];
    try {
      hdrItems = JSON.parse(hdrDataNode.textContent);
    } catch (error) {
      hdrItems = [];
    }

    if (hdrItems.length) {
      var hdrStage = hdrGallery.querySelector("[data-hdr-stage]");
      var hdrSdrImage = hdrGallery.querySelector("[data-hdr-sdr]") || hdrGallery.querySelector("[data-hdr-sdr-image]");
      var hdrHdrImage = hdrGallery.querySelector("[data-hdr-hdr]") || hdrGallery.querySelector("[data-hdr-hdr-image]");
      var hdrIsImagePair = hdrHdrImage.tagName === "IMG";
      var hdrLeftLabel = hdrModesLabel("sdr", "SDR");
      var hdrRightLabel = hdrModesLabel("hdr", "HDR");
      function hdrModesLabel(mode, fallback) {
        var button = hdrGallery.querySelector('[data-hdr-mode="' + mode + '"]');
        return button ? button.textContent.trim() : fallback;
      }
      var hdrCurrent = hdrGallery.querySelector("[data-hdr-current]");
      var hdrProgress = hdrGallery.querySelector("[data-hdr-progress]");
      var hdrPrev = hdrGallery.querySelector("[data-hdr-prev]");
      var hdrNext = hdrGallery.querySelector("[data-hdr-next]");
      var hdrDivider = hdrGallery.querySelector("[data-hdr-divider]");
      var hdrLoading = hdrGallery.querySelector("[data-hdr-loading]");
      var hdrDisplayNotice = hdrGallery.querySelector("[data-hdr-display-notice]");
      var hdrModes = Array.prototype.slice.call(hdrGallery.querySelectorAll("[data-hdr-mode]"));
      var hdrIndex = 0;
      var hdrMode = "split";
      var hdrDragging = false;
      var hdrVideoRequest = 0;
      var hdrCurrentPair = null;
      var hdrPreviousPair = null;
      var hdrNextPair = null;
      var hdrPendingPair = null;
      var hdrLoadingTimer = null;
      var hdrDisplayRange = null;

      if (hdrDisplayNotice && typeof window.matchMedia === "function") {
        // Prefer the video pipeline's range for PQ clips when the browser
        // exposes it; otherwise use the current display's dynamic range.
        var hdrRangeFeature = !hdrIsImagePair && window.matchMedia("(video-dynamic-range: standard)").matches
          ? "video-dynamic-range" : "dynamic-range";
        var hdrHighRange = window.matchMedia("(" + hdrRangeFeature + ": high)");
        var hdrStandardRange = window.matchMedia("(" + hdrRangeFeature + ": standard)");
        // Unsupported media features match neither value. Leave the notice
        // hidden instead of reporting an unknown HDR state as disabled.
        if (hdrHighRange.matches || hdrStandardRange.matches) {
          hdrDisplayRange = hdrHighRange;
          if (typeof hdrDisplayRange.addEventListener === "function") {
            hdrDisplayRange.addEventListener("change", hdrUpdateDisplayNotice);
          } else if (typeof hdrDisplayRange.addListener === "function") {
            hdrDisplayRange.addListener(hdrUpdateDisplayNotice);
          }
        }
      }

      function hdrUpdateDisplayNotice() {
        if (!hdrDisplayNotice) return;
        // Loading owns the bottom-right corner until the pair is ready.
        hdrDisplayNotice.hidden = !hdrDisplayRange || hdrDisplayRange.matches || hdrMode === "sdr" || !!hdrPendingPair;
      }

      // Keep the status inside the picture even if an older page placed it
      // beside the navigation controls.
      if (hdrLoading.parentNode !== hdrStage) hdrStage.appendChild(hdrLoading);

      function hdrShowLoading(requestId) {
        clearTimeout(hdrLoadingTimer);
        hdrStage.classList.remove("is-loading");
        hdrLoading.hidden = true;
        hdrUpdateDisplayNotice();
        hdrLoadingTimer = setTimeout(function () {
          if (requestId === hdrVideoRequest && hdrPendingPair) {
            hdrStage.classList.add("is-loading");
            hdrLoading.hidden = false;
          }
        }, 180);
      }

      function hdrHideLoading() {
        clearTimeout(hdrLoadingTimer);
        hdrStage.classList.remove("is-loading");
        hdrLoading.hidden = true;
        hdrUpdateDisplayNotice();
      }

      function hdrSetSplit(clientX) {
        var bounds = hdrStage.getBoundingClientRect();
        var position = ((clientX - bounds.left) / bounds.width) * 100;
        position = Math.max(0, Math.min(100, position));
        hdrStage.style.setProperty("--split-position", position + "%");
        hdrDivider.setAttribute("aria-valuenow", Math.round(position));
      }

      function hdrReleasePair(pair) {
        if (!pair || pair.disposed) return;
        pair.disposed = true;
        if (!hdrIsImagePair) pair.video.pause();
        pair.video.removeAttribute("src");
        if (!hdrIsImagePair) pair.video.load();
        pair.image.removeAttribute("src");
      }

      function hdrPreparePair(index, image, video) {
        var item = hdrItems[index];
        var initial = !!image;
        var pair = {
          index: index, image: image || new Image(), video: video || (hdrIsImagePair ? new Image() : document.createElement("video")),
          imageReady: false, videoReady: false, decoding: false, disposed: false,
          imageRetries: 0, videoRetries: 0
        };
        pair.image.className = hdrSdrImage.className;
        pair.image.setAttribute("data-hdr-sdr", "");
        pair.image.alt = hdrLeftLabel + " frame " + item.id;
        pair.image.draggable = false;
        pair.video.className = hdrHdrImage.className;
        pair.video.setAttribute("data-hdr-hdr", "");
        pair.video.setAttribute("aria-label", hdrRightLabel + " frame " + item.id);
        if (hdrIsImagePair) {
          pair.video.alt = hdrRightLabel + " frame " + item.id;
          pair.video.draggable = false;
        }
        pair.video.muted = true;
        pair.video.defaultMuted = true;
        pair.video.playsInline = true;
        pair.video.preload = "auto";
        // A single-frame clip can hold its final frame. Looping repeatedly
        // seeks and decodes the same HEVC frame, including while off screen.
        pair.video.loop = false;
        if (!initial) pair.video.autoplay = false;

        function retryImage() {
          if (pair.disposed || pair.imageRetries >= 1) return;
          pair.imageRetries++;
          pair.decoding = false;
          pair.image.src = item.sdr;
        }
        function imageLoaded() {
          if (pair.disposed || pair.decoding || pair.imageReady || !pair.image.naturalWidth) return;
          pair.decoding = true;
          function decoded() {
            if (pair.disposed) return;
            pair.decoding = false;
            pair.imageReady = true;
            hdrCommitPair(pair);
          }
          if (typeof pair.image.decode === "function") {
            pair.image.decode().then(decoded, retryImage);
          } else {
            decoded();
          }
        }
        function videoLoaded() {
          if (pair.disposed || pair.video.readyState < 2) return;
          pair.videoReady = true;
          hdrCommitPair(pair);
        }
        pair.refreshImage = function () {
          pair.imageReady = false;
          imageLoaded();
        };
        pair.retryFailures = function () {
          if (!pair.imageReady && !pair.decoding && pair.image.complete && !pair.image.naturalWidth) {
            pair.imageRetries = 0;
            retryImage();
          }
          if (!hdrIsImagePair && !pair.videoReady && pair.video.error) {
            pair.videoRetries = 0;
            pair.video.load();
          }
        };
        pair.image.addEventListener("load", imageLoaded);
        pair.image.addEventListener("error", retryImage);
        // Declare this in the pair scope: cached images call it below the
        // conditional, and this controller runs in strict mode.
        var afterImageLoaded;
        if (hdrIsImagePair) {
          var afterDecoding = false;
          function retryAfterImage() {
            if (pair.disposed || pair.videoRetries >= 1) return;
            pair.videoRetries++;
            afterDecoding = false;
            pair.video.src = item.hdr;
          }
          afterImageLoaded = function () {
            if (pair.disposed || afterDecoding || pair.videoReady || !pair.video.naturalWidth) return;
            afterDecoding = true;
            function decoded() {
              if (pair.disposed) return;
              afterDecoding = false;
              pair.videoReady = true;
              hdrCommitPair(pair);
            }
            if (typeof pair.video.decode === "function") pair.video.decode().then(decoded, retryAfterImage);
            else decoded();
          };
          pair.video.addEventListener("load", afterImageLoaded);
          pair.video.addEventListener("error", retryAfterImage);
          var retryBefore = pair.retryFailures;
          pair.retryFailures = function () {
            retryBefore();
            if (!pair.videoReady && !afterDecoding && pair.video.complete && !pair.video.naturalWidth) {
              pair.videoRetries = 0;
              retryAfterImage();
            }
          };
          var refreshBefore = pair.refreshImage;
          pair.refreshImage = function () {
            pair.videoReady = false;
            afterImageLoaded();
            refreshBefore();
          };
        } else {
          pair.video.addEventListener("loadeddata", videoLoaded);
          pair.video.addEventListener("canplay", videoLoaded);
          pair.video.addEventListener("error", function () {
            if (pair.disposed || pair.videoRetries >= 1) return;
            pair.videoRetries++;
            pair.videoReady = false;
            pair.video.load();
          });
        }
        // Native media loading decodes each resource as it arrives. There is
        // no fetch -> two complete blobs -> new players/decode sequence.
        if (!initial) {
          pair.image.src = item.sdr;
          pair.video.src = item.hdr;
          if (!hdrIsImagePair) pair.video.load();
        }
        if (pair.image.complete) imageLoaded();
        if (hdrIsImagePair) {
          if (pair.video.complete) afterImageLoaded();
        } else if (pair.video.readyState >= 2) videoLoaded();
        return pair;
      }

      function hdrPrepareNext() {
        var nextIndex = hdrIndex + 1;
        if (hdrNextPair && hdrNextPair.index === nextIndex) return;
        hdrReleasePair(hdrNextPair);
        hdrNextPair = null;
        if (nextIndex >= hdrItems.length || (hdrPreviousPair && hdrPreviousPair.index === nextIndex)) return;
        if (typeof navigator !== "undefined" && navigator.connection && navigator.connection.saveData) return;
        // At 1080p, keep exactly one upcoming pair downloaded AND decoded.
        // Selecting it reuses these exact elements with no new media request.
        hdrNextPair = hdrPreparePair(nextIndex);
      }

      function hdrCommitPair(pair) {
        if (pair !== hdrPendingPair || pair.disposed || !pair.imageReady || !pair.videoReady) return;
        var oldPair = hdrCurrentPair;
        // Both decoded elements are replaced in one task, so a paint cannot
        // show two different frame numbers during either loading order.
        if (pair.image !== hdrSdrImage) hdrSdrImage.replaceWith(pair.image);
        if (pair.video !== hdrHdrImage) hdrHdrImage.replaceWith(pair.video);
        hdrSdrImage = pair.image;
        hdrHdrImage = pair.video;
        hdrCurrentPair = pair;
        hdrIndex = pair.index;
        hdrPendingPair = null;
        if (hdrNextPair === pair) hdrNextPair = null;
        hdrCurrent.textContent = String(hdrIndex + 1).padStart(2, "0");
        hdrProgress.value = String(hdrIndex + 1);
        hdrPrev.disabled = hdrIndex === 0;
        hdrNext.disabled = hdrIndex === hdrItems.length - 1;
        hdrHideLoading();
        // Reusing a clip that has ended must not seek back to its beginning.
        if (!hdrIsImagePair && !pair.video.ended) {
          var playback = pair.video.play();
          if (playback && typeof playback.catch === "function") playback.catch(function () {});
        }
        if (oldPair && oldPair !== pair) {
          if (!hdrIsImagePair) oldPair.video.pause();
          if (hdrPreviousPair !== pair) hdrReleasePair(hdrPreviousPair);
          hdrPreviousPair = oldPair;
        }
        hdrPrepareNext();
      }

      function hdrSetMode(mode) {
        hdrMode = mode;
        hdrStage.classList.remove("is-mode-split", "is-mode-sdr", "is-mode-hdr");
        hdrStage.classList.add("is-mode-" + mode);
        hdrModes.forEach(function (button) {
          var active = button.dataset.hdrMode === mode;
          button.classList.toggle("is-active", active);
          button.setAttribute("aria-pressed", String(active));
        });
        hdrUpdateDisplayNotice();
      }

      function hdrSetFrame(index) {
        var targetIndex = (index + hdrItems.length) % hdrItems.length;
        // Repeat clicks must not restart a request or postpone the spinner.
        if (hdrPendingPair && hdrPendingPair.index === targetIndex) return;
        var requestId = ++hdrVideoRequest;
        var abandoned = hdrPendingPair;
        hdrPendingPair = null;
        if (abandoned && abandoned !== hdrCurrentPair && abandoned !== hdrPreviousPair && abandoned !== hdrNextPair) hdrReleasePair(abandoned);
        var pair = targetIndex === hdrCurrentPair.index ? hdrCurrentPair
          : hdrPreviousPair && targetIndex === hdrPreviousPair.index ? hdrPreviousPair
          : hdrNextPair && targetIndex === hdrNextPair.index ? hdrNextPair : null;
        if (hdrNextPair && hdrNextPair !== pair) {
          hdrReleasePair(hdrNextPair);
          hdrNextPair = null;
        }
        if (!pair) pair = hdrPreparePair(targetIndex);
        if (pair === hdrNextPair) hdrNextPair = null;
        hdrPendingPair = pair;
        hdrShowLoading(requestId);
        pair.image.fetchPriority = "high";
        // A mobile browser may evict a retained video's decoded frame.
        // Restore only that video; do not redownload the decoded JPEG too.
        if (!hdrIsImagePair && pair.videoReady && pair.video.readyState < 2) {
          pair.videoReady = false;
          pair.video.load();
        }
        pair.retryFailures();
        if (pair === hdrPreviousPair) pair.refreshImage();
        hdrCommitPair(pair);
      }

      hdrModes.forEach(function (button) {
        button.addEventListener("click", function () {
          hdrSetMode(button.dataset.hdrMode);
        });
      });

      hdrPrev.addEventListener("click", function () { hdrSetFrame(hdrIndex - 1); });
      hdrNext.addEventListener("click", function () { hdrSetFrame(hdrIndex + 1); });
      hdrProgress.addEventListener("input", function () {
        hdrSetFrame(Number(hdrProgress.value) - 1);
      });

      hdrDivider.addEventListener("pointerdown", function (event) {
        hdrDragging = true;
        hdrStage.classList.add("is-dragging");
        hdrDivider.setPointerCapture(event.pointerId);
        hdrSetSplit(event.clientX);
        event.preventDefault();
      });
      hdrDivider.addEventListener("pointermove", function (event) {
        if (hdrDragging) hdrSetSplit(event.clientX);
      });
      hdrDivider.addEventListener("pointerup", function () {
        hdrDragging = false;
        hdrStage.classList.remove("is-dragging");
      });
      hdrDivider.addEventListener("keydown", function (event) {
        var current = Number(hdrDivider.getAttribute("aria-valuenow")) || 50;
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          var step = event.key === "ArrowLeft" ? -5 : 5;
          hdrSetSplit(hdrStage.getBoundingClientRect().left + hdrStage.getBoundingClientRect().width * ((current + step) / 100));
        }
      });

      hdrCurrentPair = hdrPreparePair(0, hdrSdrImage, hdrHdrImage);
      hdrSetMode("split");
      hdrSetFrame(0);
    }
  }


  /* =======================
  // Zoom Image
  ======================= */
  const lightense = document.querySelector(".page img, .post img"),
  imageLink = document.querySelectorAll(".page a img, .post a img");

  if (imageLink) {
    for (var i = 0; i < imageLink.length; i++) imageLink[i].parentNode.classList.add("image-link");
    for (var i = 0; i < imageLink.length; i++) imageLink[i].classList.add("no-lightense");
  }

  if (lightense) {
    Lightense(".page img:not(.no-lightense), .post img:not(.no-lightense)", {
    time: reducedMotion.matches ? 0 : motionBase,
    cubicBezier: motionEase,
    background: "rgba(10, 10, 14, .96)",
    padding: 60,
    offset: 30
    });
  }

  /* ============================
  // Testimonials Slider
  ============================ */
  if (document.querySelector(".my-slider")) {
    var slider = tns({
      container: ".my-slider",
      items: 3,
      slideBy: 1,
      gutter: 20,
      nav: false,
      mouseDrag: true,
      autoplay: false,
      speed: reducedMotion.matches ? 0 : motionBase,
      controlsContainer: "#customize-controls",
      responsive: {
        1024: {
          items: 3,
        },
        768: {
          items: 2,
        },
        0: {
          items: 1,
        }
      }
    });
  }


  /* ============================
  // iTyped
  ============================ */
  if (document.querySelector(".c-subscribe")) {
    var options = {
      strings: itype_text,
      typeSpeed: 100,
      backSpeed: 50,
      startDelay: 200,
      backDelay: 1500,
      loop: true,
      showCursor: true,
      cursorChar: "|",
      onFinished: function(){}
    }

    ityped.init('#ityped', options);
  }


  /* ============================
  // Scroll to top
  ============================ */
  const btnScrollToTop = document.querySelector(".top");

  window.addEventListener("scroll", function () {
    window.scrollY > window.innerHeight ? btnScrollToTop.classList.add("is-active") : btnScrollToTop.classList.remove("is-active");
  }, { passive: true });

  btnScrollToTop.addEventListener("click", function () {
    if (window.scrollY != 0) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: reducedMotion.matches ? "instant" : "smooth"
      })
    }
  });

});

// Reusable bilingual regions. Each scope can contain one or more shared controls.
document.querySelectorAll('[data-language-scope]').forEach(function (scope) {
  var controls = scope.querySelectorAll('[data-language-controls]');
  var buttons = scope.querySelectorAll('[data-language]');
  function setLanguage(language) {
    scope.querySelectorAll('[data-language-panel]').forEach(function (panel) {
      panel.hidden = panel.getAttribute('data-language-panel') !== language;
    });
    buttons.forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.getAttribute('data-language') === language));
    });
  }
  var language = 'en';
  try { language = localStorage.getItem('site-language') === 'zh' ? 'zh' : 'en'; } catch (error) {}
  setLanguage(language);
  controls.forEach(function (control) { control.hidden = false; });
  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      var selected = button.getAttribute('data-language');
      setLanguage(selected);
      try { localStorage.setItem('site-language', selected); } catch (error) {}
    });
  });
});

document.querySelectorAll('[data-copy]').forEach(function (button) {
  button.addEventListener('click', async function () {
    var scope = button.closest('[data-language-scope]');
    var chinese = scope && scope.querySelector('[data-language="zh"][aria-pressed="true"]');
    var status = button.parentNode.querySelector('[role="status"]');
    try {
      await navigator.clipboard.writeText(button.getAttribute('data-copy'));
      status.textContent = chinese ? '已复制微信号' : 'WeChat ID copied';
    } catch (error) {
      status.textContent = chinese ? '请手动复制微信号：stephenykq' : 'Please copy manually: stephenykq';
    }
    clearTimeout(button.copyStatusTimer);
    button.copyStatusTimer = setTimeout(function () { status.textContent = ''; }, 4000);
  });
});
