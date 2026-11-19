(function () {
  const root = document.documentElement;
  const storageKey = "pdp-theme";
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  const labels = {
    fr: ["Mode sombre", "Changer le thème"],
    en: ["Dark mode", "Switch theme"],
    de: ["Dunkelmodus", "Darstellung wechseln"],
    es: ["Modo oscuro", "Cambiar tema"],
    it: ["Modalità scura", "Cambia tema"],
    ar: ["الوضع الداكن", "تغيير المظهر"],
    zh: ["深色模式", "切换主题"]
  };
  let button;

  function readPreference() {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved === "light" || saved === "dark" ? saved : null;
    } catch {
      return null;
    }
  }

  let preference = readPreference();
  const themeColor = document.querySelector('meta[name="theme-color"][data-light][data-dark]');

  function applyTheme() {
    const theme = preference || root.dataset.defaultTheme || (systemTheme.matches ? "dark" : "light");
    root.dataset.theme = theme;
    if (themeColor) themeColor.content = themeColor.dataset[theme];
    const dark = theme === "dark";
    if (button) button.setAttribute("aria-pressed", String(dark));
  }

  function labelButton() {
    const [label, tooltip] = labels[root.lang] || labels.fr;
    button.setAttribute("aria-label", label);
    button.title = tooltip;
  }

  applyTheme();
  if (systemTheme.addEventListener) {
    systemTheme.addEventListener("change", applyTheme);
  } else {
    systemTheme.addListener(applyTheme);
  }
  window.addEventListener("storage", (event) => {
    if (event.key !== storageKey && event.key !== null) return;
    preference = readPreference();
    applyTheme();
  });

  document.addEventListener("DOMContentLoaded", () => {
    button = document.querySelector("[data-theme-toggle]");
    if (!button) return;
    labelButton();
    applyTheme();
    button.hidden = false;
    new MutationObserver(labelButton).observe(root, { attributes: true, attributeFilter: ["lang"] });
    button.addEventListener("click", () => {
      preference = root.dataset.theme === "dark" ? "light" : "dark";
      try { localStorage.setItem(storageKey, preference); } catch {}
      applyTheme();
    });
  });
})();
