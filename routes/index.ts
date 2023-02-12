import { serveStatic } from "https://deno.land/x/hono@v3.0.0-rc.14/middleware.ts";
import { Hono } from "https://deno.land/x/hono@v3.0.0-rc.14/mod.ts";
import { setupWebhook } from "../twitch.ts";
import { apiRouter } from "./api.ts";

const router = new Hono();

router.route("/api", apiRouter);

router.get("/ping", (c) => c.json({ message: "pong" }, 200));

router.get("/init", async (c) => {
  // setup webhook
  // check if ffmpeg exists
  // setup youtube upload logic
  const webhookData = await setupWebhook();

  return c.json({ webhookData }, 200);
});

router.get("/video/*", serveStatic({ root: "./video" }));

router.get("*", serveStatic({ root: "./static" }));

export { router };
