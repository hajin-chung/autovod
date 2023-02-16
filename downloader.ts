import { readLines } from "https://deno.land/std@0.177.0/io/mod.ts";
import { writeLog } from "./utils.ts";

type ProgressHandler = (message: string) => void;

export class Downloader {
  process: Deno.Process | undefined;
  status: "idle" | "running";
  message: string;
  progressHandler: ProgressHandler | undefined;

  constructor(params: { progressHandler?: ProgressHandler }) {
    writeLog(`initializing downloader`);
    this.status = "idle";
    this.message = "waiting for download";
    this.progressHandler = params.progressHandler;
  }

  async download(input: string, output: string) {
    if (this.status === "running") {
      const error: Deno.ProcessStatus = {
        success: false,
        code: -1,
      };
      return error;
    }

    this.status = "running";
    this.process = Deno.run({
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

    if (this.process.stderr) {
      for await (const line of readLines(this.process.stderr)) {
        if (this.progressHandler) this.progressHandler(line);
        else writeLog(line);
      }
    }

    const status = await this.process.status();
    this.status = "idle";
    return status;
  }
}