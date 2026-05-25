type MaterialScoreLike = {
  material: string;
  scoredAt?: Date | string | null;
};

type TrainingLogLike = {
  result: string;
  status: string;
  date?: Date | string | null;
};

export function normalizeMaterialName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function buildCompletedMaterialKeys(scores: MaterialScoreLike[], trainingLogs: TrainingLogLike[] = []) {
  const completed = new Set<string>();

  for (const score of scores) {
    const key = normalizeMaterialName(score.material);
    if (key) completed.add(key);
  }

  for (const log of trainingLogs) {
    if (log.status !== "SELESAI") continue;
    const key = normalizeMaterialName(log.result);
    if (key) completed.add(key);
  }

  return completed;
}

function isoDay(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

export function buildLatestCompletedMaterialKeys(scores: MaterialScoreLike[], trainingLogs: TrainingLogLike[] = []) {
  const latestScoreDay = scores.map((score) => isoDay(score.scoredAt ?? null)).find(Boolean) ?? null;
  const latestCompletedLogDay = trainingLogs
    .filter((log) => log.status === "SELESAI")
    .map((log) => isoDay(log.date ?? null))
    .find(Boolean) ?? null;
  const latestDay = [latestScoreDay, latestCompletedLogDay].filter(Boolean).sort().at(-1) ?? null;

  if (!latestDay) return new Set<string>();

  const completed = new Set<string>();

  for (const score of scores) {
    if (isoDay(score.scoredAt ?? null) !== latestDay) continue;
    const key = normalizeMaterialName(score.material);
    if (key) completed.add(key);
  }

  for (const log of trainingLogs) {
    if (log.status !== "SELESAI" || isoDay(log.date ?? null) !== latestDay) continue;
    const key = normalizeMaterialName(log.result);
    if (key) completed.add(key);
  }

  return completed;
}

export function isMaterialCompleted(material: string, completedMaterialKeys: Set<string>) {
  return completedMaterialKeys.has(normalizeMaterialName(material));
}
