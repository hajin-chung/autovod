import { serveStatic } from "https://deno.land/x/hono@v3.0.0-rc.14/middleware.ts";
import { Hono } from "https://deno.land/x/hono@v3.0.0-rc.14/mod.ts";
import { MessageQueue } from "../messageQueue.ts";
import { setupWebhook } from "../twitch.ts";
import { apiRouter } from "./api.ts";

const router = new Hono();

router.route("/api", apiRouter);

router.get("/ws", (c) => {
  const queue: MessageQueue = c.get("queue");
  const { response, socket } = Deno.upgradeWebSocket(c.req);

  socket.onopen = () => {
    while (queue.size > 0) {
      socket.send(queue.pop());
    }

    queue.onPush((message) => {
      socket.send(message);
      queue.pop();
    });
  };

  return response;
});

router.get("/ping", (c) => c.json({ message: "pong" }, 200));

router.get("/init", async (c) => {
  // setup webhook
  // check if ffmpeg exists
  // setup youtube upload logic
  const webhookData = await setupWebhook();

  return c.json({ webhookData }, 200);
});

router.get("/video/*", serveStatic({ root: "./" }));

router.get("*", serveStatic({ root: "./static" }));

export { router };
