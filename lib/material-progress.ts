type MaterialScoreLike = {
  material: string;
};

type TrainingLogLike = {
  result: string;
  status: string;
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
export function isMaterialCompleted(material: string, completedMaterialKeys: Set<string>) {
  return completedMaterialKeys.has(normalizeMaterialName(material));
}
