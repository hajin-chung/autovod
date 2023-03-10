import { config } from "https://deno.land/x/dotenv@v3.2.0/mod.ts";
import { Hono } from "https://deno.land/x/hono@v3.0.0-rc.14/mod.ts";
import { serveStatic } from "https://deno.land/x/hono@v3.0.0-rc.14/middleware.ts";
import { getStreamURL, listWebhook } from "../twitch.ts";
import { videoTitle, writeLog } from "../utils.ts";
import { MessageQueue } from "../messageQueue.ts";
import { Uploader } from "../uploader.ts";
import { Downloader } from "../downloader.ts";

const env = config();
const router = new Hono();

router.get("/webhook/list", async (c) => {
  const data = await listWebhook();
  return c.json({ data });
});

router.post("/webhook/callback", async (c) => {
  const reqData = (await c.req.json()) as {
    subscription: { type: string };
    event: { broadcaster_user_id: string; broadcaster_user_login: string };
  };
  const type = reqData.subscription.type;
  writeLog(`webhook callback ${reqData}`);

  if (type === "stream.online") {
    const userId = reqData.event.broadcaster_user_id;
    const userLogin = reqData.event.broadcaster_user_login;

    if (userId === env.TWITCH_BROADCASTER_ID) {
      (async () => {
        const title = videoTitle(userLogin);
        const output = `./video/${title}.ts`;
        // start download
        const streamURL = await getStreamURL(userLogin);
        const downloader: Downloader = c.get("downloader");
        const code = await downloader.download(streamURL, output);
        writeLog(`download exited with ${JSON.stringify(code)}`);

        if ("success" in code && code.success === true) {
          // start uploading
          const uploader: Uploader = c.get("uploader");
          await uploader.upload(output, title, undefined);
        }

        // TODO: properly remove video
      })();
    }
  }
  return c.json({}, 200);
});

router.get("/test/full", (c) => {
  const login = c.req.query("login");
  (async () => {
    const title = videoTitle(login);
    const output = `./video/${title}.ts`;
    // start download
    const streamURL = await getStreamURL(login);
    const downloader: Downloader = c.get("downloader");
    const code = await downloader.download(streamURL, output);
    writeLog(`download exited with ${JSON.stringify(code)}`);

    // start uploading
    const uploader: Uploader = c.get("uploader");
    await uploader.upload(output, title, undefined);
  })();
  return c.json({}, 200);
});

router.get("/test/download", (c) => {
  const login = c.req.query("login");
  const title = videoTitle(login);
  const output = `./video/${title}.ts`;
  (async () => {
    const url = await getStreamURL(login);

    writeLog(`downloading from url ${url} to output ${output}`);
    const downloader: Downloader = c.get("downloader");
    const code = await downloader.download(url, output);
    writeLog(`download exited with ${JSON.stringify(code)}`);
  })();
  return c.json({ output }, 200);
});

router.get("/test/upload", (c) => {
  const path = c.req.query("path");
  const queue: MessageQueue = c.get("queue");
  const uploader: Uploader = c.get("uploader");

  uploader.upload(path, "test", (message) => queue.push(message));
  return c.json({}, 200);
});

router.get("/auth/callback", (c) => {
  const uploader: Uploader = c.get("uploader");
  const error = c.req.query("error");
  const code = c.req.query("code");
  writeLog(`error: ${error}, code: ${code.slice(0, 20)}...`);
  uploader.setCode(code);

  return c.json({}, 200);
});

router.get("/status", (c) => {
  const downloader: Downloader = c.get("downloader");
  const uploader: Uploader = c.get("uploader");

  return c.json({ downloader: downloader.status, uploader: uploader.status });
});

router.use("/log", serveStatic({ path: ".log" }));

export { router as apiRouter };
