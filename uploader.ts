import { config } from "https://deno.land/x/dotenv@v3.2.0/mod.ts";
import { writeLog } from "./utils.ts";

const env = config();

export class Uploader {
  accessToken: string | undefined;
  refreshToken: string | undefined;

  constructor() {
    writeLog(`initializing uploader`);
    const redirectURI = `${env.ENDPOINT}/api/auth/callback`;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${env.GOOGLE_CLIENT_ID}&redirect_uri=${redirectURI}&scope=https://www.googleapis.com/auth/youtube.upload&access_type=offline&response_type=code`;

    writeLog(`goto ${authUrl}`);
  }

  setToken(tokens: { accessToken: string; refreshToken: string }) {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    writeLog(
      `tokens set to access: ${this.accessToken}, refresh: ${this.refreshToken}`
    );
  }

  upload(target: string) {}
}
