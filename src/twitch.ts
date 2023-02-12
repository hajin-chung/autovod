import { config } from "https://deno.land/x/dotenv@v3.2.0/mod.ts";
import { fetchJSON, writeLog } from "./utils.ts";

const env = config();

export async function getAccessToken() {
  const body = `client_id=${env.TWITCH_CLIENT_ID}&client_secret=${env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`;
  const data = await fetchJSON(`https://id.twitch.tv/oauth2/token?${body}`, {
    method: "POST",
    headers: {
      "Content-Type": "x-www-form-urlencoded;charset=UTF-8",
    },
  });

  return data.access_token as string;
}

export async function setupWebhook() {
  const accessToken = await getAccessToken();

  const webhooks = await listWebhook();
  const list = webhooks.data as { id: string }[];
  await Promise.all(
    list.map(async ({ id }) => {
      const res = await fetch(
        `https://api.twitch.tv/helix/eventsub/subscriptions?id=${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Client-Id": env.TWITCH_CLIENT_ID,
          },
        }
      );
      writeLog(`removed webhook subscription ${id} ${res.status}`);
    })
  );

  const body = {
    type: "stream.online",
    version: "1",
    condition: {
      broadcaster_user_id: env.TWITCH_BROADCASTER_ID,
    },
    transport: {
      method: "webhook",
      callback: "https://example.com/webhooks/callback",
      secret: env.WEBHOOK_SECRET,
    },
  };

  const data = await fetchJSON(
    "https://api.twitch.tv/helix/eventsub/subscriptions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Client-Id": env.TWITCH_CLIENT_ID,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  return data;
}

export async function listWebhook() {
  const accessToken = await getAccessToken();

  const data = await fetchJSON(
    "https://api.twitch.tv/helix/eventsub/subscriptions",
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Client-Id": env.TWITCH_CLIENT_ID,
        "Content-Type": "application/json",
      },
    }
  );
  return data;
}

async function getPlaybackToken(login: string) {
  const data = await fetchJSON("https://gql.twitch.tv/gql", {
    method: "POST",
    headers: {
      Authorization: `OAuth ${env.TWITCH_CLIENT_COOKIE}`,
      "Client-ID": "kimne78kx3ncx6brgo4mv6wki5h1ko",
    },
    body: JSON.stringify({
      operationName: "PlaybackAccessToken_Template",
      query:
        'query PlaybackAccessToken_Template($login: String!, $isLive: Boolean!, $vodID: ID!, $isVod: Boolean!, $playerType: String!) {  streamPlaybackAccessToken(channelName: $login, params: {platform: "web", playerBackend: "mediaplayer", playerType: $playerType}) @include(if: $isLive) {    value    signature    __typename  }  videoPlaybackAccessToken(id: $vodID, params: {platform: "web", playerBackend: "mediaplayer", playerType: $playerType}) @include(if: $isVod) {    value    signature    __typename  }}',
      variables: {
        isLive: true,
        login,
        isVod: false,
        vodID: "",
        playerType: "site",
      },
    }),
  });

  return {
    sig: data.data.streamPlaybackAccessToken.signature as string,
    token: data.data.streamPlaybackAccessToken.value as string,
  };
}

export async function getStreamURL(login: string) {
  const { sig, token } = await getPlaybackToken(login);
  const encodedToken = encodeURI(token);
  const url = `https://usher.ttvnw.net/api/channel/hls/${login}.m3u8?acmb=e30%3D&allow_source=true&fast_bread=true&player_backend=mediaplayer&playlist_include_framerate=true&reassignments_supported=true&sig=${sig}&supported_codecs=avc1&token=${encodedToken}&cdm=wv&player_version=1.17.0`;
  writeLog(`stream url: ${url}`);
  return url;
}
