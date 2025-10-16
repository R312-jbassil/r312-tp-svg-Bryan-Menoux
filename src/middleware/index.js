import pb from "../lib/pocketbase.js";
import fs from "fs";
import path from "path";

export const onRequest = async (context, next) => {
  // --- Auth depuis le cookie ---
  const cookie = context.cookies.get("pb_auth")?.value;
  if (cookie) {
    pb.authStore.loadFromCookie(cookie);
    if (pb.authStore.isValid) {
      context.locals.user = pb.authStore.record;
    }
  }

  // --- Proxy pour routes API physiques dans /src/api ---
  if (context.url.pathname.startsWith("/apis/")) {
    const publicApiRoutes = ["/apis/login", "/apis/signup"];
    const routePath = context.url.pathname.replace("/apis/", "");
    const apiFilePath = path.resolve("src/apis", `${routePath}.js`);

    // Si un fichier d'API existe physiquement (ex: src/api/login.js)
    if (fs.existsSync(apiFilePath)) {
      const module = await import(`file://${apiFilePath}`);
      const method = context.request.method.toUpperCase();

      if (method === "POST" && typeof module.POST === "function") {
        return module.POST(context);
      }
      if (method === "GET" && typeof module.GET === "function") {
        return module.GET(context);
      }

      return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Si pas trouvé, vérifier auth sinon 401
    if (
      !context.locals.user &&
      !publicApiRoutes.includes(context.url.pathname)
    ) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Continue la chaîne normale si rien d’intercepté
    return next();
  }

  // --- Redirection pages protégées ---
  if (!context.locals.user) {
    const publicPages = ["/login", "/signup", "/"];
    if (!publicPages.includes(context.url.pathname)) {
      return Response.redirect(new URL("/login", context.url), 303);
    }
  }

  // --- Détection HTTPS ---
  const host = context.request.headers.get("host") || "";
  const isSecure =
    context.url.protocol === "https:" ||
    context.request.headers.get("x-forwarded-proto") === "https" ||
    host.includes("bryan-menoux.fr");

  // --- Gestion du changement de langue ---
  if (context.request.method === "POST") {
    const referer = context.request.headers.get("referer") || "";
    if (!isSecure && referer.includes("https://")) {
      return new Response("HTTPS required", { status: 403 });
    }

    const form = await context.request.formData().catch(() => null);
    const lang = form?.get("language");

    if (lang === "en" || lang === "fr") {
      context.cookies.set("locale", String(lang), {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        secure: isSecure,
        sameSite: "lax",
      });

      return Response.redirect(
        new URL(context.url.pathname + context.url.search, context.url),
        303
      );
    }
  }

  // --- Langue par défaut ---
  const cookieLocale = context.cookies.get("locale")?.value;
  context.locals.lang =
    cookieLocale === "fr" || cookieLocale === "en"
      ? cookieLocale
      : context.preferredLocale ?? "en";

  return next();
};
