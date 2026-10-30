/* =========================================================
   Modern Clinic SOMAC - script.js
   Vanilla JavaScript, no frameworks (AOS is only used for scroll animations)
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const CLINIC_WHATSAPP = "243813621661"; // international format, no + or spaces

  /* ---------- Helpers ---------- */
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  /* ---------- 0. AOS scroll animations ---------- */
  if (window.AOS) {
    AOS.init({ duration: 800, easing: "ease-out-cubic", once: true, offset: 60 });
  }

  /* ---------- 1. Toast notification ---------- */
  const toast = $("#toast");
  let toastTimer;
  function showToast(message, type = "success") {
    toast.textContent = message;
    toast.classList.toggle("error-toast", type === "error");
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 4000);
  }

  /* ---------- 2. Mobile menu ---------- */
  const hamburger = $("#hamburger");
  const nav = $("#nav");

  function setMenu(open) {
    nav.classList.toggle("open", open);
    hamburger.classList.toggle("open", open);
    hamburger.setAttribute("aria-expanded", String(open));
    hamburger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  hamburger.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
  $$("a", nav).forEach((link) => link.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });
  window.addEventListener("resize", () => { if (window.innerWidth >= 1000) setMenu(false); });

  /* ---------- 3. Header shadow on scroll ---------- */
  const header = $("#header");
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 10);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- 4. Active nav link (scroll spy) ---------- */
  const sections = $$("main section[id]");
  const navLinks = $$(".nav__link");
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) =>
            link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`)
          );
        }
      });
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );
  sections.forEach((section) => spy.observe(section));

  /* ---------- 5. Stats counter (IntersectionObserver) ---------- */
  const counters = $$(".counter");

  function animateCounter(el) {
    const target = Number(el.dataset.target);
    const suffix = el.dataset.suffix || "";
    const duration = 1800;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out
      el.textContent = Math.floor(eased * target).toLocaleString("en-US") + (progress === 1 ? suffix : "");
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const counterObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target); // run only once
        }
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach((counter) => counterObserver.observe(counter));

  /* ---------- 6. FR / EN language switch ---------- */
  const translatable = $$("[data-fr]");
  const langButtons = $$(".lang__btn");

  // Remember the original English text the first time
  translatable.forEach((el) => (el.dataset.en = el.innerHTML));

  function setLanguage(lang) {
    translatable.forEach((el) => {
      if (lang === "fr") el.textContent = el.dataset.fr;
      else el.innerHTML = el.dataset.en;
    });
    langButtons.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.lang === lang));
    document.documentElement.lang = lang;
    try { localStorage.setItem("somac_lang", lang); } catch (_) { /* storage blocked */ }
  }

  langButtons.forEach((btn) => btn.addEventListener("click", () => setLanguage(btn.dataset.lang)));
  try {
    const saved = localStorage.getItem("somac_lang");
    if (saved === "fr") setLanguage("fr");
  } catch (_) { /* ignore */ }

  /* ---------- 7. Form helpers ---------- */
  function setError(input, message) {
    const field = input.closest(".field");
    const output = $(".error", field);
    field.classList.toggle("invalid", Boolean(message));
    if (output) output.textContent = message;
    input.setAttribute("aria-invalid", message ? "true" : "false");
    return !message;
  }

  const isValidPhone = (value) => /^\+?[0-9\s().-]{8,16}$/.test(value);
  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

  // Clear an error as soon as the user fixes the field
  document.addEventListener("input", (e) => {
    if (e.target.closest(".field.invalid")) setError(e.target, "");
  });

  /* ---------- 8. Appointment form -> localStorage + WhatsApp ---------- */
  const appointmentForm = $("#appointmentForm");
  const dateInput = $("#date");
  const serviceSelect = $("#service");
  const messageInput = $("#message");

  // Block past dates
  dateInput.min = new Date().toISOString().split("T")[0];

  // "Book now" on service cards pre-selects the service
  $$("[data-service]").forEach((link) =>
    link.addEventListener("click", () => {
      serviceSelect.value = link.dataset.service;
    })
  );

  // "Book" on doctor cards adds the doctor to the message
  $$("[data-doctor]").forEach((link) =>
    link.addEventListener("click", () => {
      messageInput.value = `I would like to see ${link.dataset.doctor}.`;
    })
  );

  appointmentForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = $("#name");
    const phone = $("#phone");

    // Run every check (no short-circuit) so all errors show at once
    const checks = [
      setError(name, name.value.trim().length < 3 ? "Please enter your full name." : ""),
      setError(phone, isValidPhone(phone.value.trim()) ? "" : "Enter a valid phone number."),
      setError(serviceSelect, serviceSelect.value ? "" : "Please choose a service."),
      setError(dateInput, dateInput.value ? "" : "Please pick a date."),
    ];

    if (!checks.every(Boolean)) {
      showToast("Please fix the highlighted fields.", "error");
      return;
    }

    const booking = {
      name: name.value.trim(),
      phone: phone.value.trim(),
      service: serviceSelect.value,
      date: dateInput.value,
      message: messageInput.value.trim(),
      createdAt: new Date().toISOString(),
    };

    // Save locally
    try {
      const all = JSON.parse(localStorage.getItem("somac_appointments") || "[]");
      all.push(booking);
      localStorage.setItem("somac_appointments", JSON.stringify(all));
    } catch (_) { /* storage blocked: still continue to WhatsApp */ }

    // Build the WhatsApp message
    const text = [
      "Hello Modern Clinic SOMAC, I would like to book an appointment.",
      "",
      `Name: ${booking.name}`,
      `Phone: ${booking.phone}`,
      `Service: ${booking.service}`,
      `Date: ${booking.date}`,
      booking.message ? `Message: ${booking.message}` : "",
    ].filter((line, i) => line !== "" || i === 1).join("\n");

    showToast("Request saved! Opening WhatsApp...");
    appointmentForm.reset();

    setTimeout(() => {
      window.open(`https://wa.me/${CLINIC_WHATSAPP}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    }, 700);
  });

  /* ---------- 9. Contact form ---------- */
  const contactForm = $("#contactForm");
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const cName = $("#cName");
    const cEmail = $("#cEmail");
    const cMessage = $("#cMessage");

    const checks = [
      setError(cName, cName.value.trim().length < 2 ? "Please enter your name." : ""),
      setError(cEmail, isValidEmail(cEmail.value.trim()) ? "" : "Enter a valid email address."),
      setError(cMessage, cMessage.value.trim().length < 10 ? "Message must be at least 10 characters." : ""),
    ];
    if (!checks.every(Boolean)) {
      showToast("Please fix the highlighted fields.", "error");
      return;
    }

    try {
      const all = JSON.parse(localStorage.getItem("somac_messages") || "[]");
      all.push({
        name: cName.value.trim(),
        email: cEmail.value.trim(),
        message: cMessage.value.trim(),
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem("somac_messages", JSON.stringify(all));
    } catch (_) { /* ignore */ }

    contactForm.reset();
    showToast("Thank you! We will reply to you soon.");
  });

  /* ---------- 10. Newsletter ---------- */
  const newsletterForm = $("#newsletterForm");
  const newsEmail = $("#newsEmail");
  const newsError = $("#newsError");

  newsletterForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!isValidEmail(newsEmail.value.trim())) {
      newsError.textContent = "Please enter a valid email.";
      return;
    }
    newsError.textContent = "";

    try {
      const list = JSON.parse(localStorage.getItem("somac_newsletter") || "[]");
      if (!list.includes(newsEmail.value.trim())) list.push(newsEmail.value.trim());
      localStorage.setItem("somac_newsletter", JSON.stringify(list));
    } catch (_) { /* ignore */ }

    newsletterForm.reset();
    showToast("Merci ! You are subscribed.");
  });
});
