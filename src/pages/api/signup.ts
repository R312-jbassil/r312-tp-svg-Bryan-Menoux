import type { APIContext } from "astro";
import pb from "../../lib/pocketbase";
import { Collections } from "../../utils/pocketbase-types";

interface SignupBody {
  email: string;
  password: string;
  passwordConfirm: string;
  username?: string;
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
    const { email, password, passwordConfirm, username }: SignupBody = await request.json();

    if (!email || !password || !passwordConfirm) {
      return new Response(
        JSON.stringify({ error: "Email et mot de passe requis." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (password !== passwordConfirm) {
      return new Response(
        JSON.stringify({ error: "Les mots de passe ne correspondent pas." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    pb.authStore.clear();

    await pb.collection(Collections.Users).create({
      email,
      password,
      passwordConfirm,
      username: username || email.split("@")[0],
    });

    const authData = await pb
      .collection(Collections.Users)
      .authWithPassword(email, password);

    cookies.set("pb_auth", pb.authStore.exportToCookie(), buildAuthCookieOptions(request));

    return new Response(JSON.stringify({ user: authData.record }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Erreur d'inscription :", err);

    const message =
      err?.status === 400
        ? "Données invalides."
        : err?.status === 409
        ? "Un compte existe déjà avec cet email."
        : "Impossible de créer le compte.";

    return new Response(JSON.stringify({ error: message }), {
      status: err?.status || 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

