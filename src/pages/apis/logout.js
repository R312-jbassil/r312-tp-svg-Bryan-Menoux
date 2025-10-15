export const POST = async ({ cookies }) => {
  cookies.delete("pb_auth", { path: "/" });
  return new Response(null, { status: 303, headers: { Location: "/" } });
};
