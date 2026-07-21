/* =========================================================
   VILLA MISKHOR — interaction & motion layer
   Lenis smooth scroll + GSAP ScrollTrigger + UI behaviour
   ========================================================= */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- preloader ---------------- */
  var preloader = document.querySelector(".preloader");
  var barSpan = document.querySelector(".preloader__bar span");
  var pctEl = document.querySelector(".preloader__pct");

  function runPreloader(done) {
    if (!preloader) return done();
    var p = 0;
    var imgs = document.images.length;
    var loaded = 0;
    function bump(target) {
      p = Math.max(p, target);
      if (barSpan) barSpan.style.width = p + "%";
      if (pctEl) pctEl.textContent = Math.round(p).toString().padStart(2, "0");
    }
    var tick = setInterval(function () {
      bump(Math.min(92, p + Math.random() * 14));
      if (p >= 92) clearInterval(tick);
    }, 140);

    window.addEventListener("load", finish);
    setTimeout(finish, 2600); // safety cap

    var finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      clearInterval(tick);
      bump(100);
      setTimeout(function () {
        preloader.style.transition = "transform .9s cubic-bezier(.65,0,.35,1)";
        preloader.style.transform = "translateY(-100%)";
        document.body.classList.remove("no-scroll");
        setTimeout(function () {
          preloader.remove();
          done();
        }, 950);
      }, 260);
    }
  }

  document.body.classList.add("no-scroll");

  /* ---------------- smooth scroll (Lenis) ---------------- */
  var lenis = null;
  function initLenis() {
    if (reduceMotion || typeof Lenis === "undefined") return;
    lenis = new Lenis({
      duration: 1.1,
      easing: function (t) { return 1 - Math.pow(1 - t, 3); },
      smoothWheel: true,
    });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------------- custom cursor ---------------- */
  function initCursor() {
    if (window.matchMedia("(hover:none), (pointer:coarse)").matches) return;
    var dot = document.querySelector(".cursor");
    var ring = document.querySelector(".cursor-ring");
    if (!dot || !ring) return;
    var mx = window.innerWidth / 2, my = window.innerHeight / 2;
    var rx = mx, ry = my;
    window.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + "px";
      dot.style.top = my + "px";
    });
    (function loop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.left = rx + "px";
      ring.style.top = ry + "px";
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll("a, button, .g-card, .floor-tab").forEach(function (el) {
      el.addEventListener("mouseenter", function () { ring.classList.add("is-active"); });
      el.addEventListener("mouseleave", function () { ring.classList.remove("is-active"); });
    });
  }

  /* ---------------- magnetic buttons ---------------- */
  function initMagnetic() {
    if (reduceMotion) return;
    document.querySelectorAll(".magnetic").forEach(function (el) {
      var strength = 26;
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        gsap.to(el, { x: (x / r.width) * strength, y: (y / r.height) * strength, duration: 0.5, ease: "power3.out" });
      });
      el.addEventListener("mouseleave", function () {
        gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1,0.4)" });
      });
    });
  }

  /* ---------------- header state + mobile nav ---------------- */
  function initHeader() {
    var header = document.querySelector(".site-header");
    var burger = document.querySelector(".btn-burger");
    var overlay = document.querySelector(".nav-overlay");
    if (header) {
      var onScroll = function () {
        header.classList.toggle("is-scrolled", window.scrollY > 40);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
    if (burger && overlay) {
      burger.addEventListener("click", function () {
        var open = overlay.classList.toggle("is-open");
        burger.classList.toggle("is-open", open);
        document.body.classList.toggle("no-scroll", open);
        if (lenis) open ? lenis.stop() : lenis.start();
      });
      overlay.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          overlay.classList.remove("is-open");
          burger.classList.remove("is-open");
          document.body.classList.remove("no-scroll");
          if (lenis) lenis.start();
        });
      });
    }
  }

  /* ---------------- anchor scroll via lenis ---------------- */
  function initAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        if (lenis) lenis.scrollTo(target, { offset: -20, duration: 1.3 });
        else target.scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  /* ---------------- split text into lines/words for reveal ---------------- */
  function splitLines(el) {
    var text = el.textContent.trim();
    var words = text.split(/\s+/);
    el.textContent = "";
    words.forEach(function (w, i) {
      var line = document.createElement("span");
      line.className = "line";
      var inner = document.createElement("span");
      inner.textContent = w + (i < words.length - 1 ? " " : "");
      line.appendChild(inner);
      el.appendChild(line);
    });
  }

  function initTextReveals() {
    document.querySelectorAll(".reveal-lines").forEach(function (el) {
      splitLines(el);
      gsap.to(el.querySelectorAll(".line > span"), {
        yPercent: 0,
        duration: 1.1,
        ease: "power4.out",
        stagger: 0.06,
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });
  }

  /* ---------------- generic reveal-up ---------------- */
  function initReveals() {
    var groups = {};
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      var g = el.getAttribute("data-reveal-group") || "__solo_" + Math.random();
      groups[g] = groups[g] || [];
      groups[g].push(el);
    });
    Object.keys(groups).forEach(function (g) {
      var els = groups[g];
      gsap.to(els, {
        opacity: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.12,
        scrollTrigger: { trigger: els[0], start: "top 90%" },
      });
    });
  }

  /* ---------------- hero intro timeline ---------------- */
  function initHeroIntro() {
    var tl = gsap.timeline({ delay: 0.15 });
    tl.to(".hero__title .line > span", { yPercent: 0, duration: 1.3, ease: "power4.out", stagger: 0.08 })
      .to(".hero__location", { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }, "-=0.9")
      .to(".hero__row [data-reveal]", { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.08 }, "-=0.7")
      .to(".site-header", { opacity: 1, duration: 0.6 }, "-=1.1");

    gsap.to(".hero__media img", {
      yPercent: 12,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
  }

  /* ---------------- parallax on [data-parallax] ---------------- */
  function initParallax() {
    document.querySelectorAll("[data-parallax]").forEach(function (el) {
      var amount = parseFloat(el.getAttribute("data-parallax")) || 14;
      gsap.to(el, {
        yPercent: amount,
        ease: "none",
        scrollTrigger: { trigger: el.closest(".bleed, .g-card, .floor-visual") || el, start: "top bottom", end: "bottom top", scrub: true },
      });
    });
  }

  /* ---------------- counters ---------------- */
  function initCounters() {
    document.querySelectorAll("[data-count]").forEach(function (el) {
      var end = parseFloat(el.getAttribute("data-count"));
      var decimals = (el.getAttribute("data-count").split(".")[1] || "").length;
      var obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: "top 92%",
        once: true,
        onEnter: function () {
          gsap.to(obj, {
            v: end, duration: 1.6, ease: "power2.out",
            onUpdate: function () { el.textContent = obj.v.toFixed(decimals); },
          });
        },
      });
    });
  }

  /* ---------------- horizontal gallery pin ---------------- */
  function initGallery() {
    var section = document.querySelector(".gallery-pin");
    var track = document.querySelector(".gallery-track");
    if (!section || !track) return;

    function build() {
      var distance = track.scrollWidth - window.innerWidth + parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--gutter") || 40) * 2;
      return distance > 0 ? distance : 0;
    }

    var st = ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: function () { return "+=" + (build() + window.innerHeight); },
      pin: true,
      scrub: 0.6,
      invalidateOnRefresh: true,
      onUpdate: function (self) {
        var d = build();
        gsap.set(track, { x: -d * self.progress });
      },
    });
  }

  /* ---------------- floor accordion (chertyozh + photo layers) ---------------- */
  function initFloors() {
    var tabs = document.querySelectorAll(".floor-tab");
    var planImgs = document.querySelectorAll(".floor-visual [data-floor-plan]");
    var photoImgs = document.querySelectorAll(".floor-visual [data-floor-img]");
    if (!tabs.length) return;
    tabs.forEach(function (tab) {
      var panel = document.getElementById(tab.getAttribute("aria-controls"));
      tab.addEventListener("click", function () {
        var isOpen = tab.getAttribute("aria-expanded") === "true";
        tabs.forEach(function (t) {
          t.setAttribute("aria-expanded", "false");
          var p = document.getElementById(t.getAttribute("aria-controls"));
          if (p) p.style.maxHeight = 0;
        });
        if (!isOpen) {
          tab.setAttribute("aria-expanded", "true");
          if (panel) panel.style.maxHeight = panel.scrollHeight + "px";
          var floorId = tab.getAttribute("data-floor");
          planImgs.forEach(function (img) {
            img.classList.toggle("is-active", img.getAttribute("data-floor-plan") === floorId);
          });
          photoImgs.forEach(function (img) {
            img.classList.toggle("is-active", img.getAttribute("data-floor-img") === floorId);
          });
        }
      });
    });
    tabs[0] && tabs[0].click();

    var visual = document.querySelector(".floor-visual");
    var toggleBtns = document.querySelectorAll(".fv-toggle-btn");
    if (visual && toggleBtns.length) {
      toggleBtns.forEach(function (btn) {
        btn.addEventListener("click", function () {
          toggleBtns.forEach(function (b) { b.classList.remove("is-active"); });
          btn.classList.add("is-active");
          visual.setAttribute("data-mode", btn.getAttribute("data-mode"));
        });
      });
    }
  }

  /* ---------------- lightbox for chertyozh (technical plan) viewing ---------------- */
  function initLightbox() {
    var lightbox = document.getElementById("lightbox");
    if (!lightbox) return;
    var img = lightbox.querySelector(".lightbox__img");
    var closeBtn = lightbox.querySelector(".lightbox__close");

    function open(src, alt) {
      img.src = src;
      img.alt = alt || "";
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("no-scroll");
      if (lenis) lenis.stop();
    }
    function close() {
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.classList.remove("no-scroll");
      if (lenis) lenis.start();
    }
    document.querySelectorAll("[data-lightbox]").forEach(function (el) {
      el.addEventListener("click", function () { open(el.currentSrc || el.src, el.alt); });
    });
    closeBtn.addEventListener("click", close);
    lightbox.addEventListener("click", function (e) { if (e.target === lightbox) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  }

  /* ---------------- scroll progress rail ---------------- */
  function initRail() {
    var rail = document.querySelector(".scroll-rail span");
    if (!rail) return;
    ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      onUpdate: function (self) { rail.style.height = (self.progress * 100) + "%"; },
    });
  }

  /* ---------------- contact form (static demo) ---------------- */
  function initForm() {
    var form = document.querySelector(".contact-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = form.querySelector("button[type=submit]");
      var original = btn.textContent;
      btn.textContent = "Заявка отправлена";
      form.reset();
      setTimeout(function () { btn.textContent = original; }, 2600);
    });
  }

  /* ---------------- image fallback (real photo not yet dropped in) ---------------- */
  function initImageFallback() {
    document.querySelectorAll(".ph img").forEach(function (img) {
      img.addEventListener("error", function () { img.setAttribute("data-broken", ""); }, { once: true });
    });
  }

  /* ---------------- year ---------------- */
  function initYear() {
    var y = document.querySelector("[data-year]");
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------------- boot ---------------- */
  function boot() {
    if (typeof gsap === "undefined") {
      document.documentElement.classList.remove("js");
      return;
    }
    try {
      gsap.registerPlugin(ScrollTrigger);
      initLenis();
      initHeader();
      initAnchors();
      initCursor();
      initMagnetic();
      initImageFallback();
      initHeroIntro();
      initTextReveals();
      initReveals();
      initParallax();
      initCounters();
      initGallery();
      initFloors();
      initLightbox();
      initRail();
      initForm();
      initYear();
      ScrollTrigger.refresh();
    } catch (err) {
      // If any animation module fails, don't leave [data-reveal] content
      // permanently hidden behind the CSS "no-JS-yet" state.
      document.documentElement.classList.remove("js");
      console.error("Motion layer failed to initialise:", err);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    runPreloader(boot);
  });
})();
