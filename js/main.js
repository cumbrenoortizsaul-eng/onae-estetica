(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============ year ============ */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ============ sticky header ============ */
  var header = document.getElementById("site-header");
  function onScrollHeader() {
    if (window.scrollY > 40) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  /* ============ mobile nav ============ */
  var navToggle = document.getElementById("nav-toggle");
  var mainNav = document.getElementById("main-nav");
  function closeNav() {
    navToggle.classList.remove("open");
    mainNav.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  }
  navToggle.addEventListener("click", function () {
    var open = mainNav.classList.toggle("open");
    navToggle.classList.toggle("open", open);
    navToggle.setAttribute("aria-expanded", String(open));
  });
  document.querySelectorAll(".nav-link").forEach(function (link) {
    link.addEventListener("click", closeNav);
  });

  /* ============ active nav link on scroll ============ */
  var sections = document.querySelectorAll("main section[id], .hero[id]");
  var navLinks = document.querySelectorAll(".nav-link");
  if ("IntersectionObserver" in window) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = entry.target.getAttribute("id");
            navLinks.forEach(function (link) {
              link.classList.toggle("active", link.getAttribute("href") === "#" + id);
            });
          }
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach(function (s) { navObserver.observe(s); });
  }

  /* ============ scroll reveal ============ */
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 6, 5) * 70 + "ms";
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in-view"); });
  }

  /* ============ back to top ============ */
  var backToTop = document.getElementById("back-to-top");
  window.addEventListener(
    "scroll",
    function () {
      backToTop.classList.toggle("visible", window.scrollY > 600);
    },
    { passive: true }
  );
  backToTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  /* ============ reviews carousel ============ */
  var track = document.getElementById("reviews-track");
  var prevBtn = document.getElementById("review-prev");
  var nextBtn = document.getElementById("review-next");
  var dotsWrap = document.getElementById("reviews-dots");

  if (track) {
    var cards = track.querySelectorAll(".review-card");
    cards.forEach(function (_, i) {
      var dot = document.createElement("span");
      if (i === 0) dot.classList.add("active");
      dot.addEventListener("click", function () { scrollToCard(i); });
      dotsWrap.appendChild(dot);
    });
    var dots = dotsWrap.querySelectorAll("span");

    function cardStep() {
      var card = track.querySelector(".review-card");
      var gap = parseFloat(getComputedStyle(track).gap) || 22;
      return card.getBoundingClientRect().width + gap;
    }
    function scrollToCard(i) {
      track.scrollTo({ left: cardStep() * i, behavior: reduceMotion ? "auto" : "smooth" });
    }
    prevBtn.addEventListener("click", function () {
      track.scrollBy({ left: -cardStep(), behavior: reduceMotion ? "auto" : "smooth" });
    });
    nextBtn.addEventListener("click", function () {
      track.scrollBy({ left: cardStep(), behavior: reduceMotion ? "auto" : "smooth" });
    });

    var scrollTimeout;
    track.addEventListener(
      "scroll",
      function () {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(function () {
          var index = Math.round(track.scrollLeft / cardStep());
          dots.forEach(function (d, i) { d.classList.toggle("active", i === index); });
        }, 100);
      },
      { passive: true }
    );

    // gentle auto-advance, pauses on interaction/hover
    var autoTimer;
    function startAuto() {
      if (reduceMotion) return;
      stopAuto();
      autoTimer = setInterval(function () {
        var atEnd = Math.ceil(track.scrollLeft + track.clientWidth) >= track.scrollWidth - 4;
        if (atEnd) track.scrollTo({ left: 0, behavior: "smooth" });
        else track.scrollBy({ left: cardStep(), behavior: "smooth" });
      }, 4500);
    }
    function stopAuto() { clearInterval(autoTimer); }
    startAuto();
    ["mouseenter", "touchstart", "pointerdown"].forEach(function (evt) {
      track.addEventListener(evt, stopAuto, { passive: true });
    });
    ["mouseleave"].forEach(function (evt) {
      track.addEventListener(evt, startAuto, { passive: true });
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stopAuto(); else startAuto();
    });
  }

  /* ============ open / closed status (Europe/Madrid time) ============ */
  var statusDot = document.getElementById("status-dot");
  var statusText = document.getElementById("status-text");

  function updateStatus() {
    try {
      var now = new Date();
      var parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Madrid",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).formatToParts(now);

      var map = {};
      parts.forEach(function (p) { map[p.type] = p.value; });
      var day = map.weekday; // Mon..Sun
      var minutes = parseInt(map.hour, 10) * 60 + parseInt(map.minute, 10);

      var ranges = [];
      if (["Mon", "Tue", "Wed", "Thu"].indexOf(day) !== -1) {
        ranges = [[10 * 60, 14 * 60], [16 * 60, 20 * 60]];
      } else if (day === "Fri") {
        ranges = [[9 * 60, 17 * 60]];
      }

      var isOpen = ranges.some(function (r) { return minutes >= r[0] && minutes < r[1]; });

      if (isOpen) {
        statusDot.className = "status-dot open";
        statusText.textContent = "Abierto ahora";
      } else {
        statusDot.className = "status-dot closed";
        statusText.textContent = "Cerrado ahora · Lun–Jue 10–14h y 16–20h · Vie 9–17h";
      }
    } catch (e) {
      statusText.textContent = "Lun–Jue 10–14h y 16–20h · Vie 9–17h";
    }
  }
  updateStatus();
  setInterval(updateStatus, 60000);

  /* ============ contact form -> WhatsApp ============ */
  var form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("f-name").value.trim();
      var phone = document.getElementById("f-phone").value.trim();
      var service = document.getElementById("f-service").value;
      var message = document.getElementById("f-message").value.trim();

      var lines = [
        "Hola ONAE, soy " + name + ".",
        "Teléfono: " + phone,
        "Tratamiento de interés: " + service
      ];
      if (message) lines.push("Mensaje: " + message);

      var text = encodeURIComponent(lines.join("\n"));
      window.open("https://wa.me/34636457342?text=" + text, "_blank", "noopener");
    });
  }

  /* ============ animated background particles ============ */
  var canvas = document.getElementById("particle-canvas");
  if (canvas && !reduceMotion) {
    var ctx = canvas.getContext("2d");
    var particles = [];
    var w, h, dpr;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildParticles();
    }

    function buildParticles() {
      var count = Math.round(Math.min(w, 1400) / 26);
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push(makeParticle(true));
      }
    }

    function makeParticle(randomY) {
      var palette = ["201,167,107", "230,211,168", "250,246,238"];
      return {
        x: Math.random() * w,
        y: randomY ? Math.random() * h : h + 40,
        r: 3 + Math.random() * 9,
        speed: 0.15 + Math.random() * 0.35,
        drift: (Math.random() - 0.5) * 0.4,
        alpha: 0.08 + Math.random() * 0.22,
        color: palette[Math.floor(Math.random() * palette.length)],
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.004 + Math.random() * 0.008
      };
    }

    var mouseX = null, mouseY = null;
    window.addEventListener(
      "mousemove",
      function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
      },
      { passive: true }
    );

    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.wobble += p.wobbleSpeed;
        p.y -= p.speed;
        p.x += p.drift + Math.sin(p.wobble) * 0.3;

        if (mouseX !== null) {
          var dx = p.x - mouseX, dy = p.y - mouseY;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            var force = (120 - dist) / 120;
            p.x += (dx / (dist || 1)) * force * 1.4;
            p.y += (dy / (dist || 1)) * force * 1.4;
          }
        }

        if (p.y < -20) { Object.assign(p, makeParticle(false)); }
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(" + p.color + "," + p.alpha + ")";
        ctx.fill();
      }
      rafId = requestAnimationFrame(tick);
    }

    var rafId;
    resize();
    rafId = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
      } else {
        rafId = requestAnimationFrame(tick);
      }
    });
  } else if (canvas) {
    canvas.style.display = "none";
  }

  /* ============ smooth-scroll offset for sticky header ============ */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("href");
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var offset = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: offset, behavior: reduceMotion ? "auto" : "smooth" });
    });
  });

  /* ============ copy phone number ============ */
  document.querySelectorAll('a[href^="tel:"]').forEach(function (el) {
    el.addEventListener("dblclick", function (e) {
      e.preventDefault();
      navigator.clipboard && navigator.clipboard.writeText("636 45 73 42");
    });
  });
})();
