export const onRequest = async (context, next) => {
  // Cette fonction middleware s'exécute à chaque requête.
  // context = infos de la requête (URL, cookies, méthode...)
  // next() = continue le traitement normal (afficher la page demandée)
  if (context.url.pathname.startsWith("/api/")) {
    return next();
  }
  // Si la requête est un POST (soumission du formulaire de langue) :
  if (context.request.method === "POST") {
    // Lire les données du formulaire
    const form = await context.request.formData().catch(() => null);
    const lang = form?.get("language"); // Récupérer la langue choisie

    // Vérifier que la langue est bien 'en' ou 'fr'
    if (lang === "en" || lang === "fr") {
      // Enregistrer la préférence dans un cookie nommé 'locale'
      // - path: '/' → cookie disponible sur tout le site
      // - maxAge: 1 an
      context.cookies.set("locale", String(lang), {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });

      // Rediriger avec un code 303 (See Other) vers la même page en GET
      // Cela évite que le formulaire soit renvoyé si l'utilisateur recharge la page
      return Response.redirect(
        new URL(context.url.pathname + context.url.search, context.url),
        303
      );
    }
  }

  // Déterminer la langue pour cette requête
  const cookieLocale = context.cookies.get("locale")?.value; // Lire la langue depuis le cookie

  // Choisir la langue finale :
  // - Si cookie valide → utiliser la valeur du cookie
  // - Sinon → essayer d'utiliser la langue préférée du navigateur
  // - Si rien n'est défini → utiliser 'en' par défaut
  context.locals.lang =
    cookieLocale === "fr" || cookieLocale === "en"
      ? cookieLocale
      : context.preferredLocale ?? "en";

  // Continuer le traitement normal (afficher la page demandée)
  return next();
};

