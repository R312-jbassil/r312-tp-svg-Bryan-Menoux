// /src/pages/apis/logout.js
const clearCookie = (url) => {
  const domain = new URL(url).hostname;
  return new Response(null, {
    status: 303,
    headers: {
      "Set-Cookie": `pb_auth=; Path=/; Domain=${domain}; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict`,
      Location: "/",
    },
  });
};

export const GET = ({ request }) => clearCookie(request.url);
export const POST = ({ request }) => clearCookie(request.url);
