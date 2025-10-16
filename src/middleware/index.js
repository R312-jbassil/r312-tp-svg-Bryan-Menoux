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

  // --- Gestion des routes API ---
  if (context.url.pathname.startsWith("/api/")) {
    const publicApiRoutes = ["/api/login", "/api/signup"];
    const routePath = context.url.pathname.replace("/api/", "");

    // 📁 Détection du bon répertoire
    const baseDir = import.meta.env?.PROD
      ? path.resolve("server/pages/api")
      : path.resolve("src/pages/api");

    const apiFilePathJs = path.join(baseDir, `${routePath}.js`);
    const apiFilePathTs = path.join(baseDir, `${routePath}.ts`);
    const apiFilePath = fs.existsSync(apiFilePathJs)
      ? apiFilePathJs
      : fs.existsSync(apiFilePathTs)
      ? apiFilePathTs
      : null;

    if (apiFilePath) {
      try {
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
      } catch (err) {
        console.error(`❌ Erreur dans /api/${routePath}:`, err);
        return new Response(
          JSON.stringify({ error: "Erreur interne du serveur" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // --- Vérification d’auth sur API privées ---
    const isPublicApi = publicApiRoutes.some((r) =>
      context.url.pathname.startsWith(r)
    );

    if (!context.locals.user && !isPublicApi) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return next();
  }

  // --- Redirection des pages protégées ---
  if (!context.locals.user) {
    const publicPages = ["/", "/login", "/signup"];

    // On normalise le chemin sans slash final
    const cleanPath = context.url.pathname.replace(/\/$/, "");

    const isPublicPage = publicPages.some(
      (p) => cleanPath === p || cleanPath.startsWith(p)
    );

    if (!isPublicPage) {
      console.log("🔒 Accès refusé, redirection vers /login :", cleanPath);
      return Response.redirect(new URL("/login", context.url), 303);
    }
  }

  // --- Sécurité HTTPS pour cookies/langue ---
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
