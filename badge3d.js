/* Badge « En formation » en 3D (CSS 3D, sans bibliothèque).
   Il pend au bout de son cordon, se balance, tourne lentement sur lui-même et montre son dos
   (« Formation validée »). On peut le faire tourner avec le doigt ou la souris ; il garde son élan.
   Mouvement réduit demandé par le système : le badge reste immobile, face visible. */
(function () {
  var scene = document.querySelector(".ff-scene");
  var badge = scene && scene.querySelector(".ff-badge");
  if (!badge) return;
  var reduit = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduit.matches) return;

  var AUTO = 22;          // degrés par seconde quand personne ne touche le badge
  var angle = 0, vitesse = 0, t = 0;
  var tire = false, dernierX = 0, dernierT = 0, elanX = 0;
  var penche = 0, cible = 0;           // inclinaison vers le pointeur
  var chute = 1;                       // 1 → 0 pendant l'arrivée du badge
  var visible = true, enCours = false, avant = 0, depart = performance.now();

  scene.classList.add("ff-3d");

  function poser(z, y, x, dy) {
    badge.style.transform = "translateY(" + dy.toFixed(1) + "px) rotateZ(" + z.toFixed(2) + "deg) rotateY(" +
      y.toFixed(2) + "deg) rotateX(" + x.toFixed(2) + "deg)";
  }

  function image(maintenant) {
    if (!visible || document.hidden) { enCours = false; return; }
    var dt = Math.min((maintenant - (avant || maintenant)) / 1000, 0.05);
    avant = maintenant; t += dt;
    var ecoule = (maintenant - depart) / 1000;
    // Arrivée : le badge descend en se balançant, face visible, le temps que les tâches se cochent
    chute = Math.max(0, 1 - ecoule / 1.1);
    var demarre = ecoule > 2.4;
    if (!tire) {
      var voulu = demarre ? AUTO : 0;
      vitesse += (voulu - vitesse) * Math.min(1, dt * (demarre ? 0.8 : 3));
      angle += vitesse * dt;
    }
    penche += (cible - penche) * Math.min(1, dt * 4);
    var balance = Math.sin(t * 1.4) * 2.2 - 2.5 + Math.max(-12, Math.min(12, -vitesse * 0.05)) + chute * 9;
    poser(balance, angle % 360, penche + Math.sin(t * 0.9) * 2, -36 * chute * chute);
    requestAnimationFrame(image);
  }
  function lancer() {
    if (enCours) return;
    enCours = true; avant = 0;
    requestAnimationFrame(image);
  }

  // Faire tourner avec le doigt ou la souris
  scene.addEventListener("pointerdown", function (e) {
    tire = true; dernierX = e.clientX; dernierT = performance.now(); elanX = 0;
    scene.setPointerCapture(e.pointerId); scene.classList.add("ff-tire");
  });
  scene.addEventListener("pointermove", function (e) {
    var r = scene.getBoundingClientRect();
    cible = ((e.clientY - r.top) / r.height - 0.5) * -14;
    if (!tire) return;
    var maintenant = performance.now();
    var dx = e.clientX - dernierX;
    angle += dx * 0.6;
    elanX = (dx * 0.6) / Math.max((maintenant - dernierT) / 1000, 0.008);
    dernierX = e.clientX; dernierT = maintenant;
  });
  function lacher() {
    if (!tire) return;
    tire = false; scene.classList.remove("ff-tire");
    vitesse = Math.max(-900, Math.min(900, elanX));
    depart = Math.min(depart, performance.now() - 2400000);   // reprend tout de suite la rotation
  }
  scene.addEventListener("pointerup", lacher);
  scene.addEventListener("pointercancel", lacher);
  scene.addEventListener("pointerleave", function () { cible = 0; });

  // Pause quand le badge n'est pas à l'écran ou que l'onglet est caché
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entrees) {
      visible = entrees[0].isIntersecting;
      if (visible) lancer();
    }).observe(scene);
  }
  document.addEventListener("visibilitychange", function () { if (!document.hidden) lancer(); });
  reduit.addEventListener && reduit.addEventListener("change", function (e) {
    if (e.matches) { visible = false; badge.style.transform = ""; scene.classList.remove("ff-3d"); }
  });
  lancer();
})();
