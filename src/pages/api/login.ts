import type { APIContext } from "astro";
import pb from "../../lib/pocketbase";
import { Collections } from "../../utils/pocketbase-types";

interface LoginBody {
  email: string;
  password: string;
}

const buildAuthCookieOptions = (request: Request) => {
  const url = new URL(request.url);
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const host = request.headers.get("host") || "";
  const isSecure =
    url.protocol === "https:" ||
    forwardedProto === "https" ||
    host.includes("bryan-menoux.fr");

  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isSecure,
    expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  };
};

export const POST = async ({ request, cookies }: APIContext): Promise<Response> => {
  try {
    const { email, password }: LoginBody = await request.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email et mot de passe requis." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const authData = await pb
      .collection(Collections.Users)
      .authWithPassword(email, password);

    cookies.set("pb_auth", pb.authStore.exportToCookie(), buildAuthCookieOptions(request));

    return new Response(JSON.stringify({ user: authData.record }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Erreur de connexion :", err);
    return new Response(
      JSON.stringify({
        error:
          err?.status === 400
            ? "Email ou mot de passe invalide."
            : "Erreur de connexion au serveur.",
      }),
      { status: err?.status || 401, headers: { "Content-Type": "application/json" } }
    );
  }
};

