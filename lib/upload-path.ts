import { existsSync } from "fs";
import path from "path";

function publicUploadsCandidate(baseDir: string) {
  return path.join(baseDir, "public", "uploads");
}

export function resolveUploadsDir() {
  const cwd = process.cwd();
  const candidates = [
    publicUploadsCandidate(cwd),
    publicUploadsCandidate(path.resolve(cwd, "..")),
    publicUploadsCandidate(path.resolve(cwd, "../.."))
  ];

  for (const candidate of candidates) {
    if (existsSync(path.dirname(candidate))) {
      return candidate;
    }
  }

  return candidates[0];
}
