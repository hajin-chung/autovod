import { readLines } from "https://deno.land/std@0.177.0/io/mod.ts";

type ProgressHandler = (status: { frame: string; bitrate: string }) => void;

type Downloader = (
  input: string,
  output: string,
  progressHandler: ProgressHandler | undefined
) => Promise<Deno.ProcessStatus>;

export const download: Downloader = async (input, output, progressHandler) => {
  const process = Deno.run({
    cmd: [
      "./ffmpeg.exe",
      "-y",
      "-progress",
      "pipe:2",
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      input,
      "-c",
      "copy",
      output,
    ],
    stderr: "piped",
  });

  handleProgress(process.stderr, progressHandler);
  
  const status = await process.status();
  return status;
};

async function handleProgress(
  reader: Deno.Reader,
  progressHandler?: ProgressHandler
) {
  let frame = "";
  let bitrate = "";
  let updatedCount = 0;
  for await (const line of readLines(reader)) {
    const elements = line.split("=");
    const key = elements[0];
    const value = elements[1];

    if (key !== "frame" && key !== "bitrate") continue;

    if (key === "frame") {
      frame = value;
    } else if (key === "bitrate") {
      bitrate = value;
    }

    updatedCount++;
    if (updatedCount % 2 === 0) {
      if (progressHandler) progressHandler({ frame, bitrate });
      else {
        // default progress handler
        console.log(`frame: ${frame} | bitrate: ${bitrate}`);
      }
      updatedCount = 0;
    }
  }
}
