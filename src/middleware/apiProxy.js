import fs from "fs";
import path from "path";

export const onRequest = async (context, next) => {
  if (context.url.pathname.startsWith("/apis/")) {
    const apiPath = path.resolve(
      "src/api",
      context.url.pathname.replace("/apis/", "")
    );

    const filePath = `${apiPath}.js`;
    if (fs.existsSync(filePath)) {
      const module = await import(`file://${filePath}`);
      if (context.request.method === "POST" && module.POST)
        return module.POST(context);
      if (context.request.method === "GET" && module.GET)
        return module.GET(context);
    }

    return new Response(JSON.stringify({ error: "Not Found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return next();
};
