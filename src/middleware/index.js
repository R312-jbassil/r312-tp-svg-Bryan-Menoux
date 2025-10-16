import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import pb from "../lib/pocketbase.js";

const middlewareDir = path.dirname(fileURLToPath(import.meta.url));
const distApiDir = path.resolve(middlewareDir, "../pages/api");
const srcApiDir = path.resolve(process.cwd(), "src/pages/api");

const getApiBaseDir = () =>
  import.meta?.env?.PROD ? distApiDir : srcApiDir;

const findApiModulePath = (routePath) => {
  if (!routePath) return null;

  const baseDir = getApiBaseDir();
  if (!fs.existsSync(baseDir)) {
    return null;
  }

  const candidates = [
    path.join(baseDir, `${routePath}.astro.mjs`),
    path.join(baseDir, `${routePath}.mjs`),
    path.join(baseDir, `${routePath}.js`),
    path.join(baseDir, `${routePath}.cjs`),
    path.join(baseDir, `${routePath}.ts`),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  const entry = fs
    .readdirSync(baseDir)
    .find((fileName) => fileName.toLowerCase().startsWith(`${routePath.toLowerCase()}.`));

  return entry ? path.join(baseDir, entry) : null;
};

const isSecureRequest = (request, url) => {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const host = request.headers.get("host") || "";

  return (
    url.protocol === "https:" ||
    forwardedProto === "https" ||
    host.includes("bryan-menoux.fr")
  );
};

export const onRequest = async (context, next) => {
  // Load auth data from cookie if present
  const cookie = context.cookies.get("pb_auth")?.value;
  if (cookie) {
    pb.authStore.loadFromCookie(cookie);
    if (pb.authStore.isValid) {
      context.locals.user = pb.authStore.record;
    }
  }

  if (context.url.pathname.startsWith("/api/")) {
    const publicApiRoutes = ["/api/login", "/api/signup"];

    const cleanPath = context.url.pathname.replace(/\/$/, "");
    const routePath = cleanPath.replace("/api/", "");

    const apiFilePath = findApiModulePath(routePath);

    if (apiFilePath) {
      try {
        const moduleUrl = pathToFileURL(apiFilePath);
        const module = await import(moduleUrl.href);
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
        console.error(`Error in /api/${routePath}:`, err);
        return new Response(
          JSON.stringify({ error: "Internal Server Error" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    const isPublicApi = publicApiRoutes.includes(cleanPath);

    if (!context.locals.user && !isPublicApi) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    return next();
  }

  if (!context.locals.user) {
    const publicPages = ["/", "/login", "/signup"];
    const cleanPath = context.url.pathname.replace(/\/$/, "");

    if (!publicPages.includes(cleanPath)) {
      console.log("Access denied, redirecting to /login:", cleanPath);
      return Response.redirect(new URL("/login", context.url), 303);
    }
  }

  const isSecure = isSecureRequest(context.request, context.url);

  if (context.request.method === "POST") {
    const referer = context.request.headers.get("referer") || "";
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        const sameOrigin =
          refererUrl.hostname === context.url.hostname &&
          refererUrl.port === context.url.port;

        if (!isSecure && !sameOrigin) {
          return new Response("Cross-site POST forbidden", { status: 403 });
        }
      } catch {
        if (!isSecure) {
          return new Response("Cross-site POST forbidden", { status: 403 });
        }
      }
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

  const cookieLocale = context.cookies.get("locale")?.value;
  context.locals.lang =
    cookieLocale === "fr" || cookieLocale === "en"
      ? cookieLocale
      : context.preferredLocale ?? "en";

  return next();
};

