import { config } from "https://deno.land/x/dotenv@v3.2.0/mod.ts";
import { Hono } from "https://deno.land/x/hono@v3.0.0-rc.14/mod.ts";
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { setupWebhook } from "./twitch.ts";
import { writeLog } from "./utils.ts";
import { router } from "./routes/index.ts";

const env = config();
const webhookData = await setupWebhook();
console.log(env);
writeLog(`server started with env ${JSON.stringify(env)}`);
writeLog(`server initialized data: ${JSON.stringify({ webhookData })}`);

const app = new Hono();

app.route("/", router);

serve(app.fetch, { port: 80 });
