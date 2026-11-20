/* Effets 3D de la page (CSS 3D, sans bibliothèque).
   1. « Comment ça marche » : les 3 étapes sont les faces d'un prisme. On le fait tourner avec les flèches ◀ ▶,
      un glissé à gauche ou à droite (pavé tactile, doigt, souris), les flèches du clavier ou les petits points.
   2. La carte du quiz se redresse en 3D en arrivant à l'écran.
   Mouvement réduit demandé par le système : rien ne bouge, la page garde sa mise en page normale. */
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var racine = document.documentElement;
  var MOTS = {
    fr: ["Étape précédente", "Étape suivante", "Étape"], en: ["Previous step", "Next step", "Step"],
    de: ["Vorheriger Schritt", "Nächster Schritt", "Schritt"], es: ["Paso anterior", "Paso siguiente", "Paso"],
    it: ["Passo precedente", "Passo successivo", "Passo"], ar: ["الخطوة السابقة", "الخطوة التالية", "الخطوة"],
    zh: ["上一步", "下一步", "步骤"]
  };
  function mots() { return MOTS[racine.lang] || MOTS.fr; }

  // ---------- 1. Le prisme des étapes ----------
  var zone = document.getElementById("comment");
  var histoire = zone && zone.querySelector(".story");
  var etapes = histoire ? Array.prototype.slice.call(histoire.children) : [];
  var points = [], precedent, suivant, scene, actuelle = 0, tour = 0;

  if (etapes.length === 3) {
    scene = document.createElement("div");
    scene.className = "ff-prisme-scene";
    scene.tabIndex = 0;
    histoire.parentNode.insertBefore(scene, histoire);
    scene.appendChild(histoire);

    var commandes = document.createElement("div");
    commandes.className = "ff-prisme-commandes";
    precedent = document.createElement("button");
    precedent.type = "button"; precedent.className = "ff-fleche"; precedent.textContent = "◀";
    suivant = document.createElement("button");
    suivant.type = "button"; suivant.className = "ff-fleche"; suivant.textContent = "▶";
    var repere = document.createElement("div");
    repere.className = "ff-prisme-points";
    etapes.forEach(function (e, k) {
      var p = document.createElement("button");
      p.type = "button";
      p.addEventListener("click", function () { aller(k); });
      repere.appendChild(p); points.push(p);
    });
    commandes.appendChild(precedent); commandes.appendChild(repere); commandes.appendChild(suivant);
    scene.parentNode.insertBefore(commandes, scene.nextSibling);
    precedent.addEventListener("click", function () { tourner(-1); });
    suivant.addEventListener("click", function () { tourner(1); });
    zone.classList.add("ff-prisme");
  }

  function etiqueter() {
    if (!precedent) return;
    var m = mots();
    precedent.setAttribute("aria-label", m[0]);
    suivant.setAttribute("aria-label", m[1]);
    points.forEach(function (p, k) { p.setAttribute("aria-label", m[2] + " " + (k + 1)); });
  }

  function afficher() {
    // « tour » compte les rotations sans revenir en arrière : le prisme tourne toujours dans le sens demandé
    histoire.style.transform = "translateZ(calc(-1 * var(--ff-r))) rotateY(" + (-tour * 120) + "deg)";
    points.forEach(function (p, k) {
      p.classList.toggle("on", k === actuelle);
      p.setAttribute("aria-current", k === actuelle ? "step" : "false");
    });
    etapes.forEach(function (e, k) { e.setAttribute("aria-hidden", k === actuelle ? "false" : "true"); });
  }
  function tourner(sens) {
    if (racine.dir === "rtl") sens = -sens;            // en arabe, la droite et la gauche s'inversent
    tour += sens;
    actuelle = ((tour % 3) + 3) % 3;
    afficher();
  }
  function aller(k) {
    var ecart = ((k - actuelle) % 3 + 3) % 3;          // chemin le plus court
    tour += ecart === 2 ? -1 : ecart;
    actuelle = k;
    afficher();
  }

  if (scene) {
    // Pavé tactile (glissé horizontal à deux doigts) : on cumule le geste, une étape par geste
    var cumul = 0, bloque = 0;
    scene.addEventListener("wheel", function (e) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;   // geste vertical : la page défile normalement
      e.preventDefault();
      var maintenant = Date.now();
      if (maintenant < bloque) return;
      cumul += e.deltaX;
      if (Math.abs(cumul) > 40) { tourner(cumul > 0 ? 1 : -1); cumul = 0; bloque = maintenant + 650; }
    }, { passive: false });
    // Doigt ou souris : glisser vers la gauche ou la droite
    var depart = null;
    scene.addEventListener("pointerdown", function (e) { depart = { x: e.clientX, y: e.clientY }; });
    scene.addEventListener("pointerup", function (e) {
      if (!depart) return;
      var dx = e.clientX - depart.x, dy = e.clientY - depart.y;
      depart = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) tourner(dx < 0 ? 1 : -1);
    });
    scene.addEventListener("pointercancel", function () { depart = null; });
    // Clavier
    scene.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { tourner(racine.dir === "rtl" ? -1 : 1); e.preventDefault(); }
      if (e.key === "ArrowLeft") { tourner(racine.dir === "rtl" ? 1 : -1); e.preventDefault(); }
    });
  }

  function dimensionner() {
    if (!scene) return;
    // le prisme prend la hauteur de la plus haute étape, pour qu'aucun texte ne déborde
    histoire.style.transition = "none";
    histoire.style.height = "";
    var h = 0;
    etapes.forEach(function (e) { e.style.height = "auto"; h = Math.max(h, e.scrollHeight); e.style.height = ""; });
    histoire.style.height = Math.ceil(h) + "px";
    histoire.style.setProperty("--ff-r", (histoire.offsetWidth / (2 * Math.tan(Math.PI / 3))).toFixed(1) + "px");
    afficher();
    void histoire.offsetWidth;
    histoire.style.transition = "";
  }

  // ---------- 2. La carte du quiz ----------
  var carte = document.getElementById("qcard");
  function lisse(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  var attente = false;
  function dessinerCarte() {
    attente = false;
    if (!carte) return;
    var hauteur = window.innerHeight, c = carte.getBoundingClientRect();
    var q = Math.min(1, Math.max(0, (hauteur - c.top) / (hauteur * 0.7)));   // 0 en bas de l'écran, 1 bien visible
    var k2 = 1 - lisse(0, 1, q);
    carte.style.transform = "perspective(900px) rotateX(" + (k2 * 28).toFixed(2) + "deg) rotateY(" + (k2 * -14).toFixed(2) +
      "deg) translateY(" + (k2 * 40).toFixed(1) + "px)";
  }
  function demander() { if (!attente) { attente = true; requestAnimationFrame(dessinerCarte); } }

  etiqueter();
  dimensionner();
  dessinerCarte();
  window.addEventListener("scroll", demander, { passive: true });
  window.addEventListener("resize", function () { dimensionner(); demander(); });
  new MutationObserver(function () { etiqueter(); dimensionner(); }).observe(racine, { attributes: true, attributeFilter: ["lang"] });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(dimensionner);
})();
