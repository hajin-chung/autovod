# Auto VOD

automatically download twitch live stream and uploads it to youtube

twitch eventsub api webhook -> ffmpeg -> youtube data api

created using deno

## setup

create .env file in bin/ directory
```
TWITCH_CLIENT_ID=
TWITCH_CLIENT_SECRET=
TWITCH_BROADCASTER_ID=
TWITCH_CLIENT_COOKIE=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
WEBHOOK_SECRET=
ENDPOINT=
ENV=TEST
PORT=80
```

to test

```
deno run --allow-net --allow-read --allow-run --allow-write --watch ./app.ts
```