import { config } from "https://deno.land/x/dotenv@v3.2.0/mod.ts";
import { Hono } from "https://deno.land/x/hono@v3.0.0-rc.14/mod.ts";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { setupWebhook } from "./twitch.ts";
import { initLog, writeLog } from "./utils.ts";
import { router } from "./routes/index.ts";
import { MessageQueue } from "./messageQueue.ts";
import { Uploader } from "./uploader.ts";
import { Downloader } from "./downloader.ts";

const env = config();
console.log(env);
await initLog();

if (env.ENV !== "TEST") {
  const webhookData = await setupWebhook();
  writeLog(`server initialized data: ${JSON.stringify({ webhookData })}`);
}

const app = new Hono();
const queue = new MessageQueue();
const uploader = new Uploader();
const downloader = new Downloader({});
downloader.progressHandler = (message: string) => {
  queue.push(message);
}

app.use("*", async (c, next) => {
  c.set("queue", queue);
  c.set("uploader", uploader);
  c.set("downloader", downloader);
  await next();
});

app.route("/", router);

serve(app.fetch, { port: parseInt(env.PORT) });
