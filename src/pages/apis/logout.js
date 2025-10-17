export const POST = async ({ cookies }) => {
  cookies.delete("pb_auth", {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
  });

  return new Response(null, {
    status: 303,
    headers: { Location: "/" },
  });
};

// Optionnel : GET visible pour tester
export const GET = async () =>
  new Response(JSON.stringify({ message: "Logout endpoint ready" }), {
    status: 200,
  });
