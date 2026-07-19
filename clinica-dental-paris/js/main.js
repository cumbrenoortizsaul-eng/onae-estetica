/* ============================================================
   Clínica Dental París — JavaScript principal
   ============================================================ */

(function () {
  "use strict";

  /* ---------- Horario de la clínica ----------
     Día de la semana (0=domingo … 6=sábado) → [apertura, cierre] en horas.
     null = cerrado. */
  const SCHEDULE = {
    0: null,        // domingo
    1: [13, 21],    // lunes
    2: [13, 21],    // martes
    3: [8, 16],     // miércoles
    4: [13, 21],    // jueves
    5: [8, 15],     // viernes
    6: null         // sábado
  };

  const DAY_NAMES = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const WHATSAPP_NUMBER = "34675404871";

  /* ---------- Header con scroll ---------- */
  const header = document.getElementById("site-header");
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 30);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Menú móvil ---------- */
  const navToggle = document.getElementById("nav-toggle");
  const mainNav = document.getElementById("main-nav");

  navToggle.addEventListener("click", () => {
    const open = mainNav.classList.toggle("open");
    navToggle.classList.toggle("open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  });

  mainNav.querySelectorAll("a").forEach((link) =>
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
      navToggle.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    })
  );

  /* ---------- Enlace activo según sección visible ---------- */
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-link");

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((l) =>
          l.classList.toggle("active", l.getAttribute("href") === "#" + entry.target.id)
        );
      });
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );
  sections.forEach((s) => sectionObserver.observe(s));

  /* ---------- Animaciones de aparición ---------- */
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.documentElement.classList.add("js-anim");
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
  }

  /* ---------- Dientes flotantes de fondo ---------- */
  const TOOTH_PATH =
    "M50 8C32 8 20 21 22 39c1.3 12 6.4 17.6 8.4 30C32.8 84 36.8 93 42 93c5.6 0 5-11 8-11s2.4 11 8 11c5.2 0 9.2-9 11.6-24 2-12.4 7.1-18 8.4-30C80 21 68 8 50 8Z";
  const SPARKLE_PATH = "M50 0 L58 42 L100 50 L58 58 L50 100 L42 58 L0 50 L42 42 Z";

  function buildTeethLayer() {
    const layer = document.getElementById("teeth-layer");
    if (!layer || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const TOTAL = 16;
    for (let i = 0; i < TOTAL; i++) {
      const isSparkle = i % 5 === 4; // un destello por cada cuatro dientes
      const el = document.createElement("span");
      el.className = "floating-tooth" + (isSparkle ? " sparkle" : "");

      const size = isSparkle ? 10 + Math.random() * 14 : 26 + Math.random() * 54;
      const duration = 26 + Math.random() * 30;
      const delay = -Math.random() * duration; // reparte los dientes por toda la pantalla desde el inicio

      el.style.left = Math.random() * 100 + "%";
      el.style.width = size + "px";
      el.style.height = size + "px";
      el.style.animationDuration = duration + "s";
      el.style.animationDelay = delay + "s";
      el.style.setProperty("--tooth-opacity", (isSparkle ? 0.1 : 0.05 + Math.random() * 0.05).toFixed(3));

      el.innerHTML =
        '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="' +
        (isSparkle ? SPARKLE_PATH : TOOTH_PATH) +
        '"/></svg>';
      layer.appendChild(el);
    }
  }
  buildTeethLayer();

  /* ---------- Imágenes con respaldo ----------
     Mientras no se suban las fotos reales (assets/img/*.jpg),
     se muestra un marcador de posición elegante. */
  document.querySelectorAll("img[data-fallback]").forEach((img) => {
    img.addEventListener("error", function handler() {
      img.removeEventListener("error", handler);
      img.src = img.dataset.fallback;
    });
    if (img.complete && img.naturalWidth === 0) {
      img.src = img.dataset.fallback;
    }
  });

  /* ---------- Fecha/hora actual en Madrid ---------- */
  function nowInMadrid() {
    const parts = new Intl.DateTimeFormat("es-ES", {
      timeZone: "Europe/Madrid",
      weekday: "short",
      hour: "numeric",
      minute: "numeric",
      hour12: false
    }).formatToParts(new Date());

    const get = (type) => parts.find((p) => p.type === type)?.value || "";
    const dayMap = { dom: 0, lun: 1, mar: 2, mié: 3, jue: 4, vie: 5, sáb: 6 };
    const day = dayMap[get("weekday").replace(".", "").toLowerCase()] ?? new Date().getDay();
    return { day, hour: parseInt(get("hour"), 10), minute: parseInt(get("minute"), 10) };
  }

  /* ---------- Estado abierto/cerrado ---------- */
  function updateOpenStatus() {
    const dot = document.getElementById("status-dot");
    const text = document.getElementById("status-text");
    const sub = document.getElementById("status-sub");
    if (!dot || !text) return;

    const { day, hour, minute } = nowInMadrid();
    const today = SCHEDULE[day];
    const time = hour + minute / 60;

    if (today && time >= today[0] && time < today[1]) {
      dot.className = "status-dot open";
      text.textContent = "Abierto ahora";
      sub.textContent = "Hoy hasta las " + today[1] + ":00 · Av. París, 29";
    } else {
      dot.className = "status-dot closed";
      text.textContent = "Cerrado ahora";
      // Busca el próximo día de apertura para mostrarlo
      for (let i = 1; i <= 7; i++) {
        const next = (day + i) % 7;
        if (SCHEDULE[next]) {
          const label = i === 1 ? "mañana" : "el " + DAY_NAMES[next];
          sub.textContent = "Abrimos " + label + " a las " + SCHEDULE[next][0] + ":00";
          break;
        }
      }
    }
  }
  updateOpenStatus();
  setInterval(updateOpenStatus, 60000);

  /* ---------- Resaltar el día actual en la tabla de horario ---------- */
  (function highlightToday() {
    const { day } = nowInMadrid();
    const row = document.querySelector('#hours-table tr[data-day="' + day + '"]');
    if (row) row.classList.add("today");
  })();

  /* ============================================================
     RESERVA DE CITAS
     ============================================================ */
  const form = document.getElementById("booking-form");
  const dateInput = document.getElementById("bk-date");
  const timeSelect = document.getElementById("bk-time");
  const dateHint = document.getElementById("bk-date-hint");
  const successPanel = document.getElementById("booking-success");
  const successSummary = document.getElementById("success-summary");
  const successWaLink = document.getElementById("success-wa-link");

  let lastBooking = null;

  // Rango de fechas: de mañana a 60 días vista
  (function initDateRange() {
    const pad = (n) => String(n).padStart(2, "0");
    const toISO = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    const min = new Date();
    min.setDate(min.getDate() + 1);
    const max = new Date();
    max.setDate(max.getDate() + 60);
    dateInput.min = toISO(min);
    dateInput.max = toISO(max);
  })();

  const HINT_DEFAULT = dateHint.textContent;

  function slotsForDay(range) {
    // Huecos de 30 min desde la apertura hasta media hora antes del cierre
    const slots = [];
    for (let t = range[0]; t <= range[1] - 0.5; t += 0.5) {
      const h = Math.floor(t);
      const m = t % 1 ? "30" : "00";
      slots.push(h + ":" + m);
    }
    return slots;
  }

  dateInput.addEventListener("change", () => {
    timeSelect.innerHTML = "";
    if (!dateInput.value) {
      timeSelect.disabled = true;
      timeSelect.innerHTML = '<option value="">Elige primero el día</option>';
      return;
    }

    const selected = new Date(dateInput.value + "T12:00:00");
    const range = SCHEDULE[selected.getDay()];

    if (!range) {
      timeSelect.disabled = true;
      timeSelect.innerHTML = '<option value="">Día cerrado</option>';
      dateHint.textContent =
        "Los " + DAY_NAMES[selected.getDay()] + "s la clínica está cerrada. Elige, por favor, un día de lunes a viernes.";
      dateHint.classList.add("closed-day");
      return;
    }

    dateHint.textContent = HINT_DEFAULT;
    dateHint.classList.remove("closed-day");
    timeSelect.disabled = false;
    timeSelect.innerHTML = '<option value="">Elige una hora</option>';
    slotsForDay(range).forEach((slot) => {
      const opt = document.createElement("option");
      opt.value = slot;
      opt.textContent = slot + " h";
      timeSelect.appendChild(opt);
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!form.reportValidity()) return;

    const name = document.getElementById("bk-name").value.trim();
    const phone = document.getElementById("bk-phone").value.trim();
    const treatment = document.getElementById("bk-treatment").value;
    const notes = document.getElementById("bk-notes").value.trim();

    if (timeSelect.disabled || !timeSelect.value) {
      timeSelect.focus();
      return;
    }

    const date = new Date(dateInput.value + "T12:00:00");
    const dateHuman = date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    const lines = [
      "Hola, soy " + name + " y me gustaría reservar una cita en Clínica Dental París.",
      "",
      "📋 Motivo: " + treatment,
      "📅 Día: " + dateHuman,
      "🕐 Hora: " + timeSelect.value + " h",
      "📞 Teléfono: " + phone
    ];
    if (notes) lines.push("📝 Nota: " + notes);
    lines.push("", "¿Me podéis confirmar la cita? ¡Gracias!");

    const waUrl =
      "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(lines.join("\n"));

    lastBooking = { name, phone, treatment, notes, date: dateInput.value, time: timeSelect.value, dateHuman };

    // Muestra el panel de confirmación y abre WhatsApp
    form.hidden = true;
    successPanel.hidden = false;
    successSummary.innerHTML =
      "<strong>" + treatment + "</strong> · " + dateHuman + " a las <strong>" + timeSelect.value + " h</strong>";
    successWaLink.href = waUrl;
    successPanel.scrollIntoView({ behavior: "smooth", block: "center" });

    window.open(waUrl, "_blank", "noopener");
  });

  /* Descarga de recordatorio .ics */
  document.getElementById("success-ics").addEventListener("click", () => {
    if (!lastBooking) return;

    const [h, m] = lastBooking.time.split(":").map(Number);
    const start = lastBooking.date.replace(/-/g, "") + "T" + String(h).padStart(2, "0") + String(m).padStart(2, "0") + "00";
    const endH = m === 30 ? h + 1 : h;
    const endM = m === 30 ? 0 : 30;
    const end = lastBooking.date.replace(/-/g, "") + "T" + String(endH).padStart(2, "0") + String(endM).padStart(2, "0") + "00";

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Clinica Dental Paris//Reserva//ES",
      "BEGIN:VEVENT",
      "UID:" + Date.now() + "@clinicadentalparis",
      "DTSTART;TZID=Europe/Madrid:" + start,
      "DTEND;TZID=Europe/Madrid:" + end,
      "SUMMARY:Cita en Clínica Dental París — " + lastBooking.treatment,
      "LOCATION:Av. París 29\\, bajo\\, 10005 Cáceres",
      "DESCRIPTION:Cita pendiente de confirmación por la clínica. Teléfono: 927 04 26 06",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "cita-clinica-dental-paris.ics";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  });

  /* Volver a empezar */
  document.getElementById("success-reset").addEventListener("click", () => {
    successPanel.hidden = true;
    form.hidden = false;
    form.reset();
    timeSelect.disabled = true;
    timeSelect.innerHTML = '<option value="">Elige primero el día</option>';
    dateHint.textContent = HINT_DEFAULT;
    dateHint.classList.remove("closed-day");
  });

  /* ---------- Año del pie de página ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();
})();
