/* Défilement en 3D (CSS 3D, sans bibliothèque).
   1. « Comment ça marche » : la section reste à l'écran pendant qu'on fait défiler, et ses 3 étapes sont
      les faces d'un prisme qui pivote d'une étape à l'autre.
   2. La carte du quiz se redresse en 3D en arrivant à l'écran.
   Mouvement réduit demandé par le système : rien ne bouge, la page garde sa mise en page normale. */
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var racine = document.documentElement;
  var entete = document.querySelector(".top");

  // ---------- 1. Le prisme des étapes ----------
  var zone = document.getElementById("comment");
  var histoire = zone && zone.querySelector(".story");
  var etapes = histoire ? Array.prototype.slice.call(histoire.children) : [];
  var points = [];
  if (etapes.length === 3) {
    var scene = document.createElement("div");
    scene.className = "ff-prisme-scene";
    histoire.parentNode.insertBefore(scene, histoire);
    scene.appendChild(histoire);
    var repere = document.createElement("div");
    repere.className = "ff-prisme-points";
    repere.setAttribute("aria-hidden", "true");
    etapes.forEach(function () { var p = document.createElement("span"); repere.appendChild(p); points.push(p); });
    scene.parentNode.insertBefore(repere, scene.nextSibling);
    zone.classList.add("ff-prisme");
  }

  function dimensionner() {
    racine.style.setProperty("--ff-haut", (entete ? entete.offsetHeight : 0) + "px");
    if (!points.length) return;
    zone.classList.add("ff-prisme");
    // le prisme prend la hauteur de la plus haute étape, pour qu'aucun texte ne déborde
    histoire.style.height = "";
    var h = 0;
    etapes.forEach(function (e) { e.style.height = "auto"; h = Math.max(h, e.scrollHeight); e.style.height = ""; });
    histoire.style.height = Math.ceil(h) + "px";
    var largeur = histoire.offsetWidth;
    histoire.style.setProperty("--ff-r", (largeur / (2 * Math.tan(Math.PI / 3))).toFixed(1) + "px");
    // écran trop bas (téléphone à l'horizontale…) : pas de prisme, les étapes reprennent leur place normale
    var bloc = zone.querySelector(".section-split");
    var place = window.innerHeight - (entete ? entete.offsetHeight : 0);
    if (bloc.scrollHeight > place) {
      zone.classList.remove("ff-prisme"); histoire.style.transform = ""; histoire.style.height = "";
    }
  }

  function lisse(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

  // ---------- 2. La carte du quiz ----------
  var carte = document.getElementById("qcard");

  var attente = false;
  function dessiner() {
    attente = false;
    var hauteur = window.innerHeight;
    if (points.length && zone.classList.contains("ff-prisme")) {
      var r = zone.getBoundingClientRect();
      var parcours = zone.offsetHeight - hauteur;
      var p = parcours > 0 ? Math.min(1, Math.max(0, -r.top / parcours)) : 0;
      // on s'arrête un instant sur chaque face : la rotation se fait au milieu de chaque tiers
      var s = p * 2, i = Math.min(1, Math.floor(s)), f = s - i;
      var position = i + lisse(0.3, 0.7, f);
      histoire.style.transform = "translateZ(calc(-1 * var(--ff-r))) rotateY(" + (-position * 120).toFixed(2) + "deg)";
      var active = Math.round(position);
      points.forEach(function (pt, k) { pt.classList.toggle("on", k === active); });
      etapes.forEach(function (e, k) { e.classList.toggle("ff-face-active", k === active); });
    }
    if (carte) {
      var c = carte.getBoundingClientRect();
      var q = Math.min(1, Math.max(0, (hauteur - c.top) / (hauteur * 0.7)));   // 0 en bas de l'écran, 1 bien visible
      var k2 = 1 - lisse(0, 1, q);
      carte.style.transform = "perspective(900px) rotateX(" + (k2 * 28).toFixed(2) + "deg) rotateY(" + (k2 * -14).toFixed(2) +
        "deg) translateY(" + (k2 * 40).toFixed(1) + "px)";
    }
  }
  function demander() { if (!attente) { attente = true; requestAnimationFrame(dessiner); } }

  dimensionner();
  dessiner();
  window.addEventListener("scroll", demander, { passive: true });
  window.addEventListener("resize", function () { dimensionner(); demander(); });
  // les traductions changent la longueur des textes : on recalcule quand la langue change
  new MutationObserver(function () { dimensionner(); demander(); }).observe(racine, { attributes: true, attributeFilter: ["lang"] });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { dimensionner(); demander(); });
})();
