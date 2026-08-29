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
        projectLightbox.innerHTML = '<div class="project-lightbox__backdrop"></div><div class="project-lightbox__panel"><button type="button" class="project-lightbox__close" aria-label="Close"><i class="ion ion-md-close"></i></button><button type="button" class="project-lightbox__nav project-lightbox__nav--prev" aria-label="Previous image"><i class="ion ion-md-arrow-back"></i></button><button type="button" class="project-lightbox__nav project-lightbox__nav--next" aria-label="Next image"><i class="ion ion-md-arrow-forward"></i></button><img class="project-lightbox__image" alt=""></div>';
        document.body.appendChild(projectLightbox);
      }

      var galleryImages = [];
      var projectLightboxImage = projectLightbox.querySelector(".project-lightbox__image");
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

      projectLightboxImage.style.display = "block";
      projectLightboxImage.style.width = "auto";
      projectLightboxImage.style.height = "auto";
      projectLightboxImage.style.maxWidth = "calc(100vw - 24px)";
      projectLightboxImage.style.maxHeight = "calc(100vh - 24px)";
      projectLightboxImage.style.borderRadius = "0";
      projectLightboxImage.style.boxShadow = "0 30px 80px rgba(0, 0, 0, 0.5)";
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

        var imageRect = projectLightboxImage.getBoundingClientRect();
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
