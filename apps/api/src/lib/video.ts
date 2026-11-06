import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

let available: boolean | null = null;

/** ffmpeg is optional in development; production images include it. */
export async function ffmpegAvailable(): Promise<boolean> {
  if (available !== null) return available;
  try {
    await run('ffmpeg', ['-version']);
    available = true;
  } catch {
    available = false;
  }
  return available;
}

/** Grabs a poster frame (about one second in) and returns it as a JPEG buffer. */
export async function extractPoster(inputPath: string, outputPath: string): Promise<void> {
  await run('ffmpeg', ['-y', '-ss', '1', '-i', inputPath, '-frames:v', '1', '-vf', 'scale=1280:-2', '-q:v', '3', outputPath], {
    timeout: 60_000,
  });
}

/** Duration in seconds, or null when ffprobe is unavailable. */
export async function probeDuration(inputPath: string): Promise<number | null> {
  try {
    const { stdout } = await run('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      inputPath,
    ]);
    const seconds = Number.parseFloat(stdout.trim());
    return Number.isFinite(seconds) ? Math.round(seconds) : null;
  } catch {
    return null;
  }
}
