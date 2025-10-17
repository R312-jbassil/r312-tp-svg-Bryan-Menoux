import pb from "../lib/pocketbase.js";

export const onRequest = async (context, next) => {
  // --- AUTHENTIFICATION POCKETBASE ---
  const cookie = context.cookies.get("pb_auth")?.value;
  if (cookie) {
    pb.authStore.loadFromCookie(cookie); // Charge les infos d'auth depuis le cookie
    if (pb.authStore.isValid) {
      // Si le token est valide, ajoute les données utilisateur dans Astro.locals
      context.locals.user = pb.authStore.record;
    }
  }

  // --- ROUTES API : AUTH OBLIGATOIRE SAUF LOGIN / SIGNUP ---
  if (context.url.pathname.startsWith("/_api/")) {
    const publicApiRoutes = ["/_api/login", "/_api/signup"];

    // Tolère les variantes avec ou sans slash final
    const isPublicApi = publicApiRoutes.some(
      (route) =>
        context.url.pathname === route || context.url.pathname === route + "/"
    );

    if (!context.locals.user && !isPublicApi) {
      // Si l'utilisateur n'est pas connecté, on retourne une erreur 401 (non autorisé)
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return next(); // Continue le traitement normal
  }

  // --- REDIRECTION SI NON CONNECTÉ ---
  if (!context.locals.user) {
    const publicPages = ["/login", "/signup", "/"];
    const isPublicPage = publicPages.some(
      (page) =>
        context.url.pathname === page || context.url.pathname === page + "/"
    );

    if (!isPublicPage) {
      return Response.redirect(new URL("/login/", context.url), 303);
    }
  }

  // --- LOG DÉBOGAGE ---
  console.log("Middleware onRequest:", context.url.pathname);

  // --- GESTION DE LA LANGUE ---
  if (context.request.method === "POST") {
    // Lire les données du formulaire
    const form = await context.request.formData().catch(() => null);
    const lang = form?.get("language"); // Récupérer la langue choisie

    // Vérifier que la langue est bien 'en' ou 'fr'
    if (lang === "en" || lang === "fr") {
      // Enregistrer la préférence dans un cookie nommé 'locale'
      context.cookies.set("locale", String(lang), {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });

      // Rediriger avec un code 303 (See Other) vers la même page en GET
      return Response.redirect(
        new URL(context.url.pathname + context.url.search, context.url),
        303
      );
    }
  }

  // --- DÉTERMINATION DE LA LANGUE ---
  const cookieLocale = context.cookies.get("locale")?.value;
  context.locals.lang =
    cookieLocale === "fr" || cookieLocale === "en"
      ? cookieLocale
      : context.preferredLocale ?? "en";

  // --- CONTINUER LE TRAITEMENT NORMAL ---
  return next();
};
