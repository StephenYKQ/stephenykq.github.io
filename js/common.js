document.addEventListener("DOMContentLoaded", function () {
  'use strict';

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
  }

  function menuClose() {
    menuList.classList.remove("is-open");
  }

  /* =======================
  // Animation Load Page
  ======================= */
  setTimeout(function(){
    body.classList.add("is-in");
  },150)

  /* ==================================
  // Stop Animations After All Have Run
  ================================== */
  setTimeout(function(){
    body.classList.add("stop-animations");
  },1500)

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
    var status = list.querySelector('[role="status"]');
    var empty = list.querySelector(".c-projects-list__empty");

    function filterProjects() {
      var visibleCount = 0;

      cards.forEach(function (card) {
        card.hidden = !groups.every(function (group) {
          var value = card.getAttribute("data-project-" + group.dimension) || "";
          return group.included.size > 0 ? group.included.has(value) : !group.excluded.has(value);
        });
        if (!card.hidden) visibleCount++;
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
      empty.hidden = visibleCount > 0;
      status.textContent = visibleCount + " of " + cards.length + " projects shown";
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
        var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
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
              ], { duration: 240, easing: "cubic-bezier(.2,.7,.2,1)" }));
            }
            positions.set(option, next);
          });
        });
        options.forEach(function (option) { layoutObserver.observe(option); });
        layoutObserver.observe(filters);
      }
    filterProjects();
  });

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
        projectLightbox.innerHTML = '<div class="project-lightbox__backdrop"></div><div class="project-lightbox__panel"><button type="button" class="project-lightbox__close" aria-label="Close"><i class="ion ion-md-close"></i></button><button type="button" class="project-lightbox__nav project-lightbox__nav--prev" aria-label="Previous image"><i class="ion ion-md-arrow-back"></i></button><button type="button" class="project-lightbox__nav project-lightbox__nav--next" aria-label="Next image"><i class="ion ion-md-arrow-forward"></i></button><div class="project-lightbox__frame"><img class="project-lightbox__image" alt=""></div></div>';
        document.body.appendChild(projectLightbox);
      }

      var galleryImages = [];
      var projectLightboxImage = projectLightbox.querySelector(".project-lightbox__image");
      var projectLightboxFrame = projectLightbox.querySelector(".project-lightbox__frame");
      var projectLightboxClose = projectLightbox.querySelector(".project-lightbox__close");
      var projectLightboxBackdrop = projectLightbox.querySelector(".project-lightbox__backdrop");
      var projectLightboxPrev = projectLightbox.querySelector(".project-lightbox__nav--prev");
      var projectLightboxNext = projectLightbox.querySelector(".project-lightbox__nav--next");
      var currentGalleryIndex = 0;

      projectLightbox.style.position = "fixed";
      projectLightbox.style.inset = "0";
      projectLightbox.style.zIndex = "9999";
      projectLightbox.style.display = "flex";
      projectLightbox.style.alignItems = "center";
      projectLightbox.style.justifyContent = "center";
      projectLightbox.style.padding = "0";
      projectLightbox.style.background = "rgba(10, 12, 16, 0.92)";
      projectLightbox.style.opacity = "0";
      projectLightbox.style.pointerEvents = "none";
      projectLightbox.style.transition = "opacity .2s ease";

      projectLightboxBackdrop.style.position = "absolute";
      projectLightboxBackdrop.style.inset = "0";
      projectLightboxBackdrop.style.background = "transparent";

      projectLightbox.querySelector(".project-lightbox__panel").style.position = "relative";
      projectLightbox.querySelector(".project-lightbox__panel").style.width = "100%";
      projectLightbox.querySelector(".project-lightbox__panel").style.height = "100%";
      projectLightbox.querySelector(".project-lightbox__panel").style.maxWidth = "100vw";
      projectLightbox.querySelector(".project-lightbox__panel").style.maxHeight = "100vh";
      projectLightbox.querySelector(".project-lightbox__panel").style.display = "flex";
      projectLightbox.querySelector(".project-lightbox__panel").style.alignItems = "center";
      projectLightbox.querySelector(".project-lightbox__panel").style.justifyContent = "center";
      projectLightbox.querySelector(".project-lightbox__panel").style.overflow = "visible";

      projectLightboxFrame.style.display = "inline-block";
      projectLightboxFrame.style.lineHeight = "0";
      projectLightboxFrame.style.maxWidth = "calc(100vw - 24px)";
      projectLightboxFrame.style.maxHeight = "calc(100vh - 24px)";
      projectLightboxFrame.style.boxShadow = "none";
      projectLightboxFrame.style.filter = "drop-shadow(0 30px 80px rgba(0, 0, 0, 0.5))";
      projectLightboxFrame.style.background = "transparent";
      projectLightboxFrame.style.overflow = "visible";

      projectLightboxImage.style.display = "block";
      projectLightboxImage.style.width = "auto";
      projectLightboxImage.style.height = "auto";
      projectLightboxImage.style.maxWidth = "calc(100vw - 24px)";
      projectLightboxImage.style.maxHeight = "calc(100vh - 24px)";
      projectLightboxImage.style.borderRadius = "0";
      projectLightboxImage.style.boxShadow = "none";
      projectLightboxImage.style.background = "transparent";

      projectLightboxClose.style.position = "fixed";
      projectLightboxClose.style.top = "0px";
      projectLightboxClose.style.right = "0px";
      projectLightboxClose.style.width = "28px";
      projectLightboxClose.style.height = "28px";
      projectLightboxClose.style.padding = "0";
      projectLightboxClose.style.border = "0";
      projectLightboxClose.style.background = "transparent";
      projectLightboxClose.style.color = "#fff";
      projectLightboxClose.style.fontSize = "20px";
      projectLightboxClose.style.lineHeight = "1";

      projectLightboxPrev.style.position = "fixed";
      projectLightboxPrev.style.top = "50%";
      projectLightboxPrev.style.left = "0px";
      projectLightboxPrev.style.width = "40px";
      projectLightboxPrev.style.height = "40px";
      projectLightboxPrev.style.padding = "0";
      projectLightboxPrev.style.border = "0";
      projectLightboxPrev.style.borderRadius = "50%";
      projectLightboxPrev.style.color = "#fff";
      projectLightboxPrev.style.background = "rgba(255, 255, 255, 0.12)";
      projectLightboxPrev.style.backdropFilter = "blur(8px)";
      projectLightboxPrev.style.transform = "translateY(-50%)";

      projectLightboxNext.style.position = "fixed";
      projectLightboxNext.style.top = "50%";
      projectLightboxNext.style.right = "0px";
      projectLightboxNext.style.width = "40px";
      projectLightboxNext.style.height = "40px";
      projectLightboxNext.style.padding = "0";
      projectLightboxNext.style.border = "0";
      projectLightboxNext.style.borderRadius = "50%";
      projectLightboxNext.style.color = "#fff";
      projectLightboxNext.style.background = "rgba(255, 255, 255, 0.12)";
      projectLightboxNext.style.backdropFilter = "blur(8px)";
      projectLightboxNext.style.transform = "translateY(-50%)";

      function layoutProjectLightboxControls() {
        if (!projectLightbox.classList.contains("is-open")) {
          return;
        }

        var imageRect = projectLightboxFrame.getBoundingClientRect();
        var viewportWidth = window.innerWidth;
        var viewportHeight = window.innerHeight;
        var arrowGap = 72;
        var closeGap = 42;

        projectLightboxPrev.style.left = Math.max(12, imageRect.left - arrowGap) + "px";
        projectLightboxPrev.style.top = (imageRect.top + (imageRect.height / 2)) + "px";
        projectLightboxPrev.style.transform = "translate(-100%, -50%)";

        projectLightboxNext.style.right = Math.max(12, viewportWidth - imageRect.right - arrowGap) + "px";
        projectLightboxNext.style.top = (imageRect.top + (imageRect.height / 2)) + "px";
        projectLightboxNext.style.transform = "translate(100%, -50%)";

        projectLightboxClose.style.right = Math.max(12, viewportWidth - imageRect.right - closeGap) + "px";
        projectLightboxClose.style.top = Math.max(12, imageRect.top - closeGap) + "px";

        if (imageRect.width === 0 || imageRect.height === 0) {
          projectLightboxClose.style.right = "12px";
          projectLightboxClose.style.top = "12px";
          projectLightboxPrev.style.left = "12px";
          projectLightboxNext.style.right = "12px";
          projectLightboxPrev.style.top = projectLightboxNext.style.top = (viewportHeight / 2) + "px";
        }
      }

      projectLightboxImage.addEventListener("load", layoutProjectLightboxControls);

      function closeProjectLightbox() {
        projectLightbox.classList.remove("is-open");
        document.body.classList.remove("project-lightbox-open");
        projectLightbox.style.opacity = "0";
        projectLightbox.style.pointerEvents = "none";
        projectLightboxImage.removeAttribute("src");
        projectLightboxImage.removeAttribute("alt");
      }

      function openProjectLightbox(index) {
        if (!galleryImages.length) {
          return;
        }

        currentGalleryIndex = (index + galleryImages.length) % galleryImages.length;
        projectLightboxImage.src = galleryImages[currentGalleryIndex].src;
        projectLightboxImage.alt = galleryImages[currentGalleryIndex].alt || "";
        projectLightbox.classList.add("is-open");
        document.body.classList.add("project-lightbox-open");
        projectLightbox.style.opacity = "1";
        projectLightbox.style.pointerEvents = "auto";
        requestAnimationFrame(layoutProjectLightboxControls);
      }

      function stepProjectLightbox(step) {
        openProjectLightbox(currentGalleryIndex + step);
      }

      if (projectCoverImage) {
        projectCoverImage.classList.add("no-lightense");
        projectCoverImage.style.cursor = "zoom-in";
        galleryImages.push({
          src: projectCoverImage.currentSrc || projectCoverImage.getAttribute("src"),
          alt: projectCoverImage.alt
        });
        projectCoverImage.addEventListener("click", function () {
          openProjectLightbox(0);
        });
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

          image.classList.add("no-lightense");
          image.style.cursor = "zoom-in";
          image.addEventListener("click", function () {
            openProjectLightbox(imageIndex);
          });
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
          closeProjectLightbox();
        } else if (event.key === "ArrowLeft") {
          stepProjectLightbox(-1);
        } else if (event.key === "ArrowRight") {
          stepProjectLightbox(1);
        }
      });

      window.addEventListener("resize", function () {
        layoutProjectLightboxControls();
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
      var hdrCurrent = hdrGallery.querySelector("[data-hdr-current]");
      var hdrProgress = hdrGallery.querySelector("[data-hdr-progress]");
      var hdrPrev = hdrGallery.querySelector("[data-hdr-prev]");
      var hdrNext = hdrGallery.querySelector("[data-hdr-next]");
      var hdrDivider = hdrGallery.querySelector("[data-hdr-divider]");
      var hdrLoading = hdrGallery.querySelector("[data-hdr-loading]");
      var hdrModes = Array.prototype.slice.call(hdrGallery.querySelectorAll("[data-hdr-mode]"));
      var hdrIndex = 0;
      var hdrMode = "split";
      var hdrDragging = false;
      var hdrVideoRequest = 0;
      var hdrPendingVideo = null;
      var hdrPendingImage = null;
      var hdrPendingIndex = null;
      // Keep only the previously displayed pair. Returning to it should not
      // create another HEVC player, download, or decode all over again.
      var hdrPreviousPair = null;
      var hdrPrefetch = null;
      var hdrPendingPrefetch = null;
      var hdrLoadingTimer = null;

      function hdrShowLoading(requestId) {
        clearTimeout(hdrLoadingTimer);
        hdrStage.classList.remove("is-loading");
        hdrLoading.hidden = true;
        hdrLoadingTimer = setTimeout(function () {
          if (requestId === hdrVideoRequest) {
            hdrStage.classList.add("is-loading");
            hdrLoading.hidden = false;
          }
        }, 180);
      }

      function hdrHideLoading() {
        clearTimeout(hdrLoadingTimer);
        hdrStage.classList.remove("is-loading");
        hdrLoading.hidden = true;
      }

      function hdrStopPrefetch() {
        if (hdrPrefetch) {
          hdrPrefetch.controller.abort();
          hdrPrefetch = null;
        }
      }

      function hdrPrefetchNext(index) {
        // Fetch only the next pair's bytes, not another video decoder.
        // Do this after the visible pair is complete, never alongside its load.
        if (typeof fetch !== "function" || typeof AbortController !== "function" || typeof URL === "undefined" || !URL.createObjectURL) return;
        if (typeof navigator !== "undefined" && navigator.connection && navigator.connection.saveData) return;
        var nextIndex = index + 1;
        if (hdrPrefetch && hdrPrefetch.index === nextIndex) return;
        hdrStopPrefetch();
        if (nextIndex >= hdrItems.length) return;
        if (hdrPreviousPair && hdrPreviousPair.index === nextIndex) return;
        var controller = new AbortController();
        var item = hdrItems[nextIndex];
        var ready = Promise.all([item.sdr, item.hdr].map(function (src) {
          return fetch(src, { signal: controller.signal, cache: "force-cache", priority: "low" }).then(function (response) {
            if (!response.ok) throw new Error("Prefetch failed");
            return response.blob();
          });
        })).then(function (blobs) { return { image: blobs[0], video: blobs[1] }; }, function () { return null; });
        hdrPrefetch = { index: nextIndex, controller: controller, ready: ready };
      }

      function hdrSetSplit(clientX) {
        var bounds = hdrStage.getBoundingClientRect();
        var position = ((clientX - bounds.left) / bounds.width) * 100;
        position = Math.max(0, Math.min(100, position));
        hdrStage.style.setProperty("--split-position", position + "%");
        hdrDivider.setAttribute("aria-valuenow", Math.round(position));
      }

      function hdrSetMediaSource(media, src, blob) {
        if (blob) {
          media.hdrObjectURL = URL.createObjectURL(blob);
          media.src = media.hdrObjectURL;
        } else {
          media.src = src;
        }
      }

      function hdrReleaseMedia(media) {
        if (media.tagName === "VIDEO") media.pause();
        media.removeAttribute("src");
        if (media.tagName === "VIDEO") media.load();
        if (media.hdrObjectURL) {
          URL.revokeObjectURL(media.hdrObjectURL);
          media.hdrObjectURL = null;
        }
      }

      function hdrCreateVideo(src, label, blob) {
        var nextVideo = document.createElement("video");
        nextVideo.className = hdrHdrImage.className;
        nextVideo.setAttribute("data-hdr-hdr", "");
        nextVideo.setAttribute("aria-label", label);
        nextVideo.autoplay = true;
        nextVideo.muted = true;
        nextVideo.defaultMuted = true;
        nextVideo.loop = true;
        nextVideo.playsInline = true;
        nextVideo.preload = "auto";
        hdrSetMediaSource(nextVideo, src, blob);
        return nextVideo;
      }

      function hdrLoadVideo(src, label, requestId, onReady, existingVideo, blob) {
        var nextVideo = existingVideo || hdrCreateVideo(src, label, blob);
        hdrPendingVideo = nextVideo;

        var committed = false;
        function commit() {
          if (committed || requestId !== hdrVideoRequest) return;
          committed = true;
          onReady(nextVideo);
        }
        nextVideo.addEventListener("loadeddata", commit, { once: true });
        nextVideo.addEventListener("canplay", commit, { once: true });
        nextVideo.addEventListener("error", function () {
          if (requestId !== hdrVideoRequest) return;
          // Retry a failed mobile HEVC request once without changing the
          // visible pair, so SDR and HDR can never become mismatched.
          nextVideo.load();
        }, { once: true });
        // The initial <video> is already loading through its HTML src. A
        // retained video may need data restored after mobile memory eviction.
        if (!existingVideo || (existingVideo !== hdrHdrImage && existingVideo.readyState < 2)) nextVideo.load();
        if (nextVideo.readyState >= 2) commit();
      }

      function hdrLoadImage(item, requestId, onReady, existingImage, blob) {
        var nextImage = existingImage || new Image();
        nextImage.className = hdrSdrImage.className;
        nextImage.setAttribute("data-hdr-sdr", "");
        nextImage.alt = "SDR frame " + item.id;
        nextImage.draggable = false;
        hdrPendingImage = nextImage;
        var decoding = false;
        var ready = false;
        var retried = false;

        function retry() {
          if (requestId !== hdrVideoRequest || retried) return;
          retried = true;
          decoding = false;
          nextImage.src = item.sdr;
        }
        function loaded() {
          if (requestId !== hdrVideoRequest || decoding || ready || !nextImage.naturalWidth) return;
          decoding = true;
          function decoded() {
            if (requestId !== hdrVideoRequest || ready) return;
            ready = true;
            onReady(nextImage);
          }
          // A load event alone does not guarantee that the JPEG is decoded
          // for the next paint. Insert this very element after decode resolves.
          if (typeof nextImage.decode === "function") {
            nextImage.decode().then(decoded, retry);
          } else {
            decoded();
          }
        }
        nextImage.addEventListener("load", loaded);
        nextImage.addEventListener("error", retry);
        if (!existingImage) hdrSetMediaSource(nextImage, item.sdr, blob);
        if (nextImage.complete) loaded();
      }

      function hdrCancelPending() {
        if (hdrPendingPrefetch) {
          hdrPendingPrefetch.controller.abort();
          hdrPendingPrefetch = null;
        }
        if (hdrPendingVideo) {
          if (hdrPendingVideo !== hdrHdrImage && (!hdrPreviousPair || hdrPendingVideo !== hdrPreviousPair.video)) {
            hdrReleaseMedia(hdrPendingVideo);
          }
          hdrPendingVideo = null;
        }
        if (hdrPendingImage) {
          if (hdrPendingImage !== hdrSdrImage && (!hdrPreviousPair || hdrPendingImage !== hdrPreviousPair.image)) hdrReleaseMedia(hdrPendingImage);
          hdrPendingImage = null;
        }
        hdrPendingIndex = null;
      }

      function hdrApplyFrame(item, targetIndex, nextVideo, nextImage) {
        var previousPair = { index: hdrIndex, image: hdrSdrImage, video: hdrHdrImage };
        hdrIndex = targetIndex;
        var previousVideo = hdrHdrImage;
        // Both media are ready. These synchronous replacements are painted
        // together; never assign a new URL to an on-screen image here.
        if (nextImage && nextImage !== hdrSdrImage) {
          hdrSdrImage.replaceWith(nextImage);
          hdrSdrImage = nextImage;
        }
        if (nextVideo && nextVideo !== hdrHdrImage) {
          hdrHdrImage.replaceWith(nextVideo);
          hdrHdrImage = nextVideo;
        }
        hdrSdrImage.alt = "SDR frame " + item.id;
        hdrHdrImage.setAttribute("aria-label", "HDR frame " + item.id);
        hdrCurrent.textContent = String(targetIndex + 1).padStart(2, "0");
        hdrProgress.value = String(targetIndex + 1);
        hdrPrev.disabled = targetIndex === 0;
        hdrNext.disabled = targetIndex === hdrItems.length - 1;
        hdrPendingVideo = null;
        hdrPendingImage = null;
        hdrPendingIndex = null;
        hdrHideLoading();
        var playback = hdrHdrImage.play();
        if (playback && typeof playback.catch === "function") playback.catch(function () {});
        if (previousVideo !== hdrHdrImage) {
          previousVideo.pause();
          if (hdrPreviousPair && hdrPreviousPair.video !== hdrHdrImage) {
            hdrReleaseMedia(hdrPreviousPair.video);
            hdrReleaseMedia(hdrPreviousPair.image);
          }
          hdrPreviousPair = previousPair;
        }
        hdrPrefetchNext(targetIndex);
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
      }

      function hdrSetFrame(index) {
        var targetIndex = (index + hdrItems.length) % hdrItems.length;
        // Repeated clicks on Next while it is loading must not restart the
        // same downloads or keep postponing the loading indicator.
        if (targetIndex === hdrPendingIndex) return;
        var item = hdrItems[targetIndex];
        var videoRequest = ++hdrVideoRequest;
        hdrCancelPending();
        if (targetIndex === hdrIndex && hdrHdrImage.readyState >= 2 && hdrSdrImage.complete && hdrSdrImage.naturalWidth) {
          hdrHideLoading();
          hdrPrefetchNext(targetIndex);
          return;
        }
        hdrShowLoading(videoRequest);
        hdrPendingIndex = targetIndex;
        var existingPair = targetIndex === hdrIndex ? { image: hdrSdrImage, video: hdrHdrImage }
          : hdrPreviousPair && targetIndex === hdrPreviousPair.index ? hdrPreviousPair : null;
        var nextImage = null;
        var nextVideo = null;
        var applied = false;
        function applyPair() {
          if (applied || videoRequest !== hdrVideoRequest || !nextImage || !nextVideo) return;
          applied = true;
          hdrApplyFrame(item, targetIndex, nextVideo, nextImage);
        }
        function loadPair(prefetchedBytes) {
          if (videoRequest !== hdrVideoRequest) return;
          hdrLoadImage(item, videoRequest, function (image) {
            nextImage = image;
            applyPair();
          }, existingPair ? existingPair.image : null, prefetchedBytes && prefetchedBytes.image);
          hdrLoadVideo(item.hdr, "HDR frame " + item.id, videoRequest, function (video) {
            nextVideo = video;
            applyPair();
          }, existingPair ? existingPair.video : null, prefetchedBytes && prefetchedBytes.video);
        }
        if (hdrPrefetch && hdrPrefetch.index === targetIndex && !existingPair) {
          var prefetched = hdrPrefetch;
          hdrPrefetch = null;
          hdrPendingPrefetch = prefetched;
          // Consume the in-flight prefetch instead of starting a second
          // request for the same MP4. Reuse the bytes directly even when the
          // hosting server requires HTTP cache revalidation.
          prefetched.ready.then(function (bytes) {
            if (videoRequest !== hdrVideoRequest) return;
            hdrPendingPrefetch = null;
            loadPair(bytes);
          });
        } else {
          hdrStopPrefetch();
          loadPair();
        }
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
  });

  btnScrollToTop.addEventListener("click", function () {
    if (window.scrollY != 0) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth"
      })
    }
  });

});
