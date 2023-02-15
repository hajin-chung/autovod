import { config } from "https://deno.land/x/dotenv@v3.2.0/mod.ts";
import { sleep } from "https://deno.land/x/sleep@v1.2.1/mod.ts";
import { writeLog } from "./utils.ts";

const env = config();

export class Uploader {
  accessToken: string | undefined;
  refreshToken: string | undefined;
  code: string | undefined;

  constructor() {
    writeLog(`initializing uploader`);
    const redirectURI = `${env.ENDPOINT}/api/auth/callback`;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${env.GOOGLE_CLIENT_ID}&redirect_uri=${redirectURI}&scope=https://www.googleapis.com/auth/youtube.upload&access_type=offline&response_type=code&prompt=consent`;

    writeLog(`goto ${authUrl}`);
  }

  setCode(code: string) {
    this.code = code;
    const redirectURI = `${env.ENDPOINT}/api/auth/callback`;
    const body = `code=${code}&client_id=${env.GOOGLE_CLIENT_ID}&client_secret=${env.GOOGLE_CLIENT_SECRET}&redirect_uri=${redirectURI}&grant_type=authorization_code`;

    fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    })
      .then((res) => res.json())
      .then((tokens) => {
        writeLog(JSON.stringify(tokens));
        this.accessToken = tokens.access_token as string;
        this.refreshToken = tokens.refresh_token as string;
        writeLog(
          `tokens set to access: ${this.accessToken}, refresh: ${this.refreshToken}`
        );
      })
      .catch((err) => {
        writeLog(`error on fetching token with code: ${JSON.stringify(err)}`);
      });
  }

  async tokenRefresh() {
    const body = encodeURI(
      `client_id=${env.GOOGLE_CLIENT_ID}&client_secret=${env.GOOGLE_CLIENT_SECRET}&grant_type=refresh_token&refresh_token=${this.refreshToken}`
    );
    writeLog(`token refresh body ${body}`);
    try {
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });
      const data = await res.json();
      writeLog(JSON.stringify(data));
      this.accessToken = data.access_token;
      writeLog(`refreshed token ${this.accessToken}`);
    } catch (err) {
      writeLog(`error while refreshing token: ${JSON.stringify(err)}`);
    }
  }

  async upload(
    target: string,
    title: string,
    progressHandler: (message: string) => void
  ) {
    // FIXME: check if target exists
    // just refresh every time
    await this.tokenRefresh();

    writeLog(`initializing resumable upload session`);
    const videoFile = await Deno.open(target, { read: true });
    const videoLength = (await videoFile.stat()).size;
    const videoType = "video/*";
    writeLog(`video file; length: ${videoLength}`);

    // initiate resumable session
    const initBody = JSON.stringify({
      snippet: {
        title,
        description: "",
        tags: [],
        categoryId: 22,
      },
      status: {
        privacyStatus: "private",
        embeddable: true,
        license: "youtube",
      },
    });
    const initRes = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status,contentDetails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Length": `${initBody.length}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Length": `${videoLength}`,
          "X-Upload-Content-Type": videoType,
        },
        body: initBody,
      }
    );
    const uploadURL = initRes.headers.get("Location");
    writeLog(`got upload url ${uploadURL}`);
    if (!uploadURL) {
      writeLog(`got upload url ${uploadURL}`);
      return;
    }

    const videoStream = videoFile.readable;
    // exponential waiting in seconds
    let cooldown = 1;
    while (1) {
      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        headers: {
          "Content-Length": `${videoLength}`,
          "Content-Type": videoType,
        },
        body: videoStream,
      });
      const { status } = uploadRes;
      if (status === 201) {
        writeLog("upload success");
        break;
      } else if (
        status === 500 ||
        status === 502 ||
        status === 503 ||
        status === 504
      ) {
        writeLog(`upload failed (resumable) status: ${status}`);
        await sleep(cooldown);
        cooldown *= 2;
        // FIXME: properly manage resume
        break;
      } else {
        writeLog(`upload failed (permanently) status: ${status}`);
        break;
      }
    }
    writeLog("ending upload");
  }
}
