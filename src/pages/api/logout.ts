import type { APIContext } from "astro";

export const POST = async ({ cookies }: APIContext): Promise<Response> => {
  // --- Suppression du cookie d’authentification ---
  cookies.delete("pb_auth", { path: "/" });

  // --- Redirection vers la page d’accueil ---
  return new Response(null, {
    status: 303,
    headers: { Location: "/" },
  });
};
