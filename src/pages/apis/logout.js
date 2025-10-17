export const POST = async ({ cookies }) => {
  // On réécrit le cookie pour le "vider" côté navigateur
  cookies.set("pb_auth", "", {
    path: "/",
    expires: new Date(0), // expire immédiatement
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });

  return new Response(null, {
    status: 303,
    headers: { Location: "/" },
  });
};

// Optionnel : GET visible pour test
export const GET = async () =>
  new Response(JSON.stringify({ message: "Logout endpoint ready" }), {
    status: 200,
  });
