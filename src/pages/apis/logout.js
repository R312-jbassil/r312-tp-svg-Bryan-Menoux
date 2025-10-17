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
