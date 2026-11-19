/* Liens de paiement Stripe de FieldFluent.
   Tant qu'un lien est vide, le bouton correspondant ouvre le formulaire de contact comme avant.
   - Liens de paiement (Stripe → Liens de paiement) : commencent par https://buy.stripe.com/
   - Portail client (Stripe → Paramètres → Portail client) : commence par https://billing.stripe.com/
   Ces liens sont publics : ils peuvent être dans le site sans risque. Ne jamais mettre ici une clé secrète (sk_…).
   Sur l'aperçu local (localhost), les liens du mode test de Stripe sont utilisés : on peut payer avec la carte 4242 4242 4242 4242. */
(function () {
  var local = ["localhost", "127.0.0.1", "[::1]"].indexOf(location.hostname) !== -1;
  var reel = {
    solo_mois: "https://buy.stripe.com/7sY28k6Fl1LRddAgLja3u00",            // Un commerce, 35 € par mois (TVA non applicable)
    solo_an: "https://buy.stripe.com/00w9AMe7NeyDehEgLja3u01",              // Un commerce, 348 € par an (29 €/mois)
    reseau_mois: "https://buy.stripe.com/9B600c9Rx3TZ1uS2Uta3u02",          // Plusieurs boutiques, 19 € par boutique et par mois (2 à 50)
    reseau_an: "https://buy.stripe.com/8x25kw1l176bb5s9iRa3u03",            // Plusieurs boutiques, 192 € par boutique et par an (16 €/mois)
    portail: "https://billing.stripe.com/p/login/7sY28k6Fl1LRddAgLja3u00"   // Portail client : changer de carte, voir les factures, résilier
  };
  var test = {
    solo_mois: "https://buy.stripe.com/test_7sY28k6Fl1LRddAgLja3u00",
    solo_an: "https://buy.stripe.com/test_00w9AMe7NeyDehEgLja3u01",
    reseau_mois: "https://buy.stripe.com/test_9B600c9Rx3TZ1uS2Uta3u02",
    reseau_an: "https://buy.stripe.com/test_8x25kw1l176bb5s9iRa3u03",
    portail: "https://billing.stripe.com/p/login/test_7sY28k6Fl1LRddAgLja3u00"
  };
  window.FF_PAIEMENT = local ? test : reel;
})();
