import { readLines } from "https://deno.land/std@0.177.0/io/mod.ts";
import { writeLog } from "./utils.ts";

type ProgressHandler = (status: { frame: string; bitrate: string }) => void;

export let downloadStatus: "idle" | "downloading" = "idle";

export const download = async (
  input: string,
  output: string,
  progressHandler: ProgressHandler | undefined
) => {
  if (downloadStatus !== "idle") {
    return { error: true, message: "stream already downloading" };
  }

  const process = Deno.run({
    cmd: [
      "ffmpeg",
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

  downloadStatus = "downloading";
  handleProgress(process.stderr, progressHandler);

  const status = await process.status();
  downloadStatus = "idle";
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
        writeLog(`frame: ${frame} | bitrate: ${bitrate}`);
      }
      updatedCount = 0;
    }
  }
}
