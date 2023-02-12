import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Hono } from "https://deno.land/x/hono@v2.7.7/mod.ts";
import { serveStatic } from "https://deno.land/x/hono@v2.7.7/middleware.ts";
import { config } from "https://deno.land/x/dotenv@v3.2.0/mod.ts";
import { getStreamURL, listWebhook, setupWebhook } from "./twitch.ts";
import { download } from "./downloader.ts";
import { videoTitle, writeLog } from "./utils.ts";

const env = config();
const webhookData = await setupWebhook();
console.log(env);
writeLog(`server started with env ${JSON.stringify(env)}`);
writeLog(`server initialized data: ${JSON.stringify({ webhookData })}`);

const app = new Hono();

app.get("/ping", (c) => c.json({ message: "pong" }, 200));

app.get("/init", async (c) => {
  // setup webhook
  // check if ffmpeg exists
  // setup youtube upload logic
  const webhookData = await setupWebhook();

  return c.json({ webhookData }, 200);
});

app.get("/webhook/list", async (c) => {
  const data = await listWebhook();
  return c.json({ data });
});

app.post("/webhook/callback", async (c) => {
  const reqData = (await c.req.json()) as {
    subscription: { type: string };
    event: { broadcaster_user_id: string; broadcaster_user_login: string };
  };
  const type = reqData.subscription.type;

  if (type === "stream.online") {
    const userId = reqData.event.broadcaster_user_id;
    const userLogin = reqData.event.broadcaster_user_login;

    if (userId === env.TWITCH_BROADCASTER_ID) {
      (async () => {
        const title = videoTitle(userLogin);
        const output = `./${title}.ts`;
        // start download
        const streamURL = await getStreamURL(userLogin);
        const code = await download(streamURL, output, undefined);
        writeLog(`download exited with ${JSON.stringify(code)}`);

        // start uploading
      })();
    }
  }
  return c.json({}, 200);
});

app.get("/test/download", (c) => {
  const login = c.req.query("login");
  const title = videoTitle(login);
  const output = `./${title}.ts`;
  (async () => {
    const url = await getStreamURL(login);

    writeLog(`downloading from url ${url} to output ${output}`);
    const code = await download(url, output, ({ bitrate, frame }) => {
      writeLog(JSON.stringify({ bitrate, frame }));
    });
    writeLog(`download exited with ${JSON.stringify(code)}`);
  })();
  return c.json({ output }, 200);
});

app.use("/log", serveStatic({ path: ".log" }));

serve(app.fetch);
