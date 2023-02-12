import { config } from "https://deno.land/x/dotenv@v3.2.0/mod.ts";
import { Hono } from "https://deno.land/x/hono@v3.0.0-rc.14/mod.ts";
import { serveStatic } from "https://deno.land/x/hono@v3.0.0-rc.14/middleware.ts";
import { download } from "../downloader.ts";
import { getStreamURL, listWebhook } from "../twitch.ts";
import { videoTitle, writeLog } from "../utils.ts";

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

  if (type === "stream.online") {
    const userId = reqData.event.broadcaster_user_id;
    const userLogin = reqData.event.broadcaster_user_login;

    if (userId === env.TWITCH_BROADCASTER_ID) {
      (async () => {
        const title = videoTitle(userLogin);
        const output = `./video/${title}.ts`;
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

router.get("/test/download", (c) => {
  const login = c.req.query("login");
  const title = videoTitle(login);
  const output = `./video/${title}.ts`;
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

router.use("/log", serveStatic({ path: ".log" }));

export { router as apiRouter };