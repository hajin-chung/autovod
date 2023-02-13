import { config } from "https://deno.land/x/dotenv@v3.2.0/mod.ts";
import { Hono } from "https://deno.land/x/hono@v3.0.0-rc.14/mod.ts";
import { WebSocketServer, WebSocketClient } from "https://deno.land/x/websocket@v0.1.4/mod.ts";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { setupWebhook } from "./twitch.ts";
import { writeLog } from "./utils.ts";
import { router } from "./routes/index.ts";
import { MessageQueue } from "./messageQueue.ts";

const env = config();
console.log(env);
writeLog(`server started with env ${JSON.stringify(env)}`);

if (env.ENV !== "TEST") {
  const webhookData = await setupWebhook();
  writeLog(`server initialized data: ${JSON.stringify({ webhookData })}`);
}

const app = new Hono();
const queue = new MessageQueue();
const wss = new WebSocketServer(parseInt(env.WSPORT));

app.use("*", async (c, next) => {
  c.set('queue', queue);
  await next();
})

app.route("/", router);

wss.addListener("connection", (ws: WebSocketClient) => {
  while(queue.size > 0) {
    ws.send(queue.pop());
  }

  queue.onPush((message) => {
    ws.send(message);
    queue.pop();
  })
});

serve(app.fetch, { port: parseInt(env.PORT) });
