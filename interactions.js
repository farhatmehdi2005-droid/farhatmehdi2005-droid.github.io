(() => {
  const video = document.getElementById("demo-video");
  const cover = document.querySelector(".demo-cover");
  const progress = document.querySelector(".demo-progress");
  const steps = [...document.querySelectorAll(".demo-step")].map(button => ({
    button,
    time: Number(button.dataset.time)
  })).reverse();
  let currentStep;
  let requestedTime = null;

  function playDemo() {
    cover.hidden = true;
    video.hidden = false;
    video.play()?.catch(() => {});
  }

  video.hidden = true;
  cover.hidden = false;
  cover.addEventListener("click", () => {
    playDemo();
    video.focus({ preventScroll: true });
  });

  function syncDemo() {
    const time = requestedTime ?? video.currentTime;
    const active = steps.find(step => time >= step.time);
    if (active !== currentStep) {
      currentStep?.button.removeAttribute("aria-current");
      active?.button.setAttribute("aria-current", "step");
      currentStep = active;
    }
    const fraction = Number.isFinite(video.duration) && video.duration > 0 ? time / video.duration : 0;
    progress.style.setProperty("--video-progress", Math.min(fraction, 1));
  }

  for (const { button, time } of steps) {
    button.disabled = false;
    button.addEventListener("click", () => {
      if (video.readyState > 0) {
        video.currentTime = time;
      } else {
        requestedTime = time;
      }
      syncDemo();
      playDemo();
    });
  }
  video.addEventListener("loadedmetadata", () => {
    if (requestedTime !== null) {
      video.currentTime = requestedTime;
      requestedTime = null;
    }
    syncDemo();
  });
  video.addEventListener("emptied", syncDemo);
  video.addEventListener("timeupdate", syncDemo);
  video.addEventListener("seeked", syncDemo);
  video.addEventListener("error", () => {
    requestedTime = null;
    syncDemo();
    progress.hidden = true;
    steps.forEach(({ button }) => { button.disabled = true; });
  });
  progress.hidden = false;
  syncDemo();

  const header = document.querySelector(".top");
  const optionsToggle = header.querySelector(".top-options");
  const utilities = header.querySelector(".top-utilities");
  optionsToggle.hidden = false;
  optionsToggle.addEventListener("click", () => {
    optionsToggle.setAttribute("aria-expanded", String(optionsToggle.getAttribute("aria-expanded") === "false"));
  });
  document.addEventListener("click", event => {
    if (!optionsToggle.contains(event.target) && !utilities.contains(event.target)) {
      optionsToggle.setAttribute("aria-expanded", "false");
    }
  });
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape" || optionsToggle.getAttribute("aria-expanded") !== "true") return;
    optionsToggle.setAttribute("aria-expanded", "false");
    optionsToggle.focus();
  });

  const links = [...header.querySelectorAll('nav a[href^="#"]')].map(link => ({
    link,
    section: document.getElementById(link.hash.slice(1))
  })).reverse();
  let currentLink;
  let updateQueued = false;

  function updateNav() {
    updateQueued = false;
    const marker = Math.max(0, header.getBoundingClientRect().bottom) + Math.min(120, window.innerHeight / 4);
    const bottom = Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight;
    const active = bottom
      ? links[0]
      : links.find(({ section }) => section.getBoundingClientRect().top <= marker) ?? links[links.length - 1];
    if (active === currentLink) return;
    currentLink?.link.removeAttribute("aria-current");
    active?.link.setAttribute("aria-current", "location");
    currentLink = active;
  }

  function queueNavUpdate() {
    if (updateQueued) return;
    updateQueued = true;
    window.requestAnimationFrame(updateNav);
  }

  window.addEventListener("scroll", queueNavUpdate, { passive: true });
  window.addEventListener("resize", queueNavUpdate);
  window.addEventListener("hashchange", queueNavUpdate);
  if ("ResizeObserver" in window) new ResizeObserver(queueNavUpdate).observe(document.querySelector("main"));
  queueNavUpdate();

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const ease = "cubic-bezier(.22, 1, .36, 1)";
  const springFrames = Array.from({ length: 25 }, (_, index) => {
    const time = index / 24;
    const offset = index === 24 ? 0 : 16 * Math.exp(-6 * time) * (Math.cos(12 * time) + .5 * Math.sin(12 * time));
    return { transform: `translateY(${offset}px)`, opacity: Math.min(1, .72 + time * 2) };
  });

  function reveal(element, delay = 0) {
    if (motion.matches) return;
    element.animate?.(springFrames, { duration: 540, delay, fill: "backwards" });
  }

  const feedback = document.getElementById("qfb");
  new MutationObserver(() => {
    if (!feedback.hidden) reveal(feedback);
  }).observe(feedback, { attributes: true, attributeFilter: ["hidden"] });

  const amount = document.getElementById("estimate-net");
  let previousAmount = amount.textContent;
  let amountAnimation;
  new MutationObserver(() => {
    if (previousAmount === amount.textContent) return;
    previousAmount = amount.textContent;
    if (motion.matches) return;
    amountAnimation?.cancel();
    amountAnimation = amount.parentElement.animate?.(
      [{ backgroundColor: "var(--accent-soft)" }, { backgroundColor: "transparent" }],
      { duration: 420, easing: ease }
    );
  }).observe(amount, { childList: true, subtree: true, characterData: true });
})();
