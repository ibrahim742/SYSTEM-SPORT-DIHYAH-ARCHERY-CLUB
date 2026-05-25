type TrainingLogLike = {
  id?: string;
  studentId?: string | null;
  date: Date | string;
  updatedAt?: Date | string | null;
  result: string;
  duration: string;
  rpe: number;
  note?: string | null;
  status?: string | null;
};

export type ProgressTrendPoint = {
  label: string;
  timestamp: string;
  result: number;
  duration: number;
  rpe: number;
  status: string;
};

export type ProgressLinePoint = {
  label: string;
  name: string;
  progress: number;
  attendance: number;
};

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});

const shortDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short"
});

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function normalizedStatus(status?: string | null) {
  return (status ?? "").toUpperCase();
}

function dateKey(value: Date | string) {
  const date = toDate(value);
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()].join("-");
}

function logKey(log: TrainingLogLike) {
  return [
    log.studentId ?? "student",
    dateKey(log.date),
    log.result.trim().toLowerCase(),
    log.duration.trim().toLowerCase(),
    log.rpe
  ].join("|");
}

function firstNumber(value: string) {
  const match = value.replace(",", ".").match(/\d+(?:\.\d+)?/);
  if (!match) return 0;
  return Number(match[0]) || 0;
}

export function collapseTrainingLogDuplicates<T extends TrainingLogLike>(logs: T[]) {
  const completedKeys = new Set(logs.filter((log) => normalizedStatus(log.status) === "SELESAI").map(logKey));
  return logs.filter((log) => normalizedStatus(log.status) !== "PROSES" || !completedKeys.has(logKey(log)));
}

export function getTrainingLogDisplayDate(log: TrainingLogLike) {
  return normalizedStatus(log.status) === "SELESAI" && log.updatedAt ? log.updatedAt : log.date;
}

export function formatTrainingLogTimestamp(value: Date | string) {
  return dateTimeFormatter.format(toDate(value));
}

export function buildTrainingTrendData(logs: TrainingLogLike[], take = 8): ProgressTrendPoint[] {
  return collapseTrainingLogDuplicates(logs)
    .slice(0, take)
    .reverse()
    .map((log) => {
      const displayDate = toDate(getTrainingLogDisplayDate(log));

      return {
        label: shortDateFormatter.format(displayDate),
        timestamp: displayDate.toISOString(),
        result: firstNumber(log.result),
        duration: firstNumber(log.duration),
        rpe: log.rpe,
        status: normalizedStatus(log.status) === "SELESAI" ? "Selesai" : "Proses"
      };
    });
}

export function buildStudentProgressLineData(
  students: Array<{ name: string; progress: number; attendance: number }>
): ProgressLinePoint[] {
  return students.map((student) => ({
    label: student.name.split(" ")[0] ?? student.name,
    name: student.name,
    progress: student.progress,
    attendance: student.attendance
  }));
}
