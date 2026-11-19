/* Paiement en ligne : envoie les boutons « Choisir cette offre » vers les liens Stripe de paiement-config.js. */
(function () {
  var cfg = window.FF_PAIEMENT || {};
  function sur(url, debut) { return typeof url === "string" && url.indexOf(debut) === 0 ? url : ""; }
  function lien(cle) { return sur(cfg[cle], "https://buy.stripe.com/"); }
  var PLANS = { "Solo": "solo", "Réseau": "reseau" };
  function annuel() {
    var b = document.getElementById("billY");
    return !!b && b.getAttribute("aria-pressed") === "true";
  }
  function cible(plan) {
    var base = PLANS[plan];
    return base ? lien(base + (annuel() ? "_an" : "_mois")) : "";
  }
  var actif = Object.keys(PLANS).some(function (p) { return lien(PLANS[p] + "_mois") || lien(PLANS[p] + "_an"); });
  var note = document.getElementById("pay-note");
  if (note) note.hidden = !actif;
  // Phase de capture : passe avant le script qui préremplit le formulaire de contact.
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[data-plan]");
    if (!a) return;
    var url = cible(a.dataset.plan);
    if (!url) return;
    e.preventDefault(); e.stopImmediatePropagation();
    window.location.href = url;
  }, true);
})();
