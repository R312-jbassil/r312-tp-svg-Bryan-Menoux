const clearCookie = () =>
  new Response(null, {
    status: 303,
    headers: {
      "Set-Cookie":
        "pb_auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict",
      Location: "/",
    },
  });

export const POST = async () => clearCookie();
export const GET = async () => clearCookie();
