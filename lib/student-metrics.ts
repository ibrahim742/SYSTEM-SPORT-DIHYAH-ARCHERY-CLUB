type AssignmentMetricSource = {
  status?: string;
  assignedAt?: Date | string | null;
  program?: {
    materials?: number | null;
  } | null;
};

type TrainingLogMetricSource = {
  status?: string;
  date?: Date | string | null;
};

type AttendanceRecordMetricSource = {
  status?: string;
  session?: {
    deletedAt?: Date | string | null;
  } | null;
};

type StudentMetricSource = {
  progress?: number | null;
  attendance?: number | null;
  assignments?: AssignmentMetricSource[];
  trainingLogs?: TrainingLogMetricSource[];
  attendanceRecords?: AttendanceRecordMetricSource[];
};

export type StudentMetrics = {
  progress: number;
  attendance: number;
};

function percent(done: number, total: number) {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((done / total) * 100)));
}

function toTime(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();

  return Number.isNaN(time) ? null : time;
}

export function calculateStudentMetrics(student: StudentMetricSource): StudentMetrics {
  const assignments = student.assignments ?? [];
  const latestAssignment = assignments[0];
  const activeAssignment = assignments.find((assignment) => assignment.status === "AKTIF") ?? latestAssignment;
  const trainingLogs = student.trainingLogs ?? [];
  const assignmentStart = toTime(activeAssignment?.assignedAt);
  const activeTrainingLogs = assignmentStart ? trainingLogs.filter((log) => {
    const logTime = toTime(log.date);
    return logTime ? logTime >= assignmentStart : true;
  }) : trainingLogs;
  const completedLogs = activeTrainingLogs.filter((log) => log.status === "SELESAI").length;
  const targetMaterials = activeAssignment?.program?.materials ?? latestAssignment?.program?.materials ?? 0;

  const progress =
    activeAssignment?.status === "SELESAI"
      ? 100
      : targetMaterials > 0
        ? percent(completedLogs, targetMaterials)
        : activeTrainingLogs.length > 0
          ? percent(completedLogs, activeTrainingLogs.length)
          : Math.round(student.progress ?? 0);

  const attendanceRecords = (student.attendanceRecords ?? []).filter((record) => !record.session?.deletedAt);
  const presentRecords = attendanceRecords.filter((record) => record.status === "HADIR").length;
  const attendance = attendanceRecords.length > 0 ? percent(presentRecords, attendanceRecords.length) : Math.round(student.attendance ?? 0);

  return { progress, attendance };
}

export function averageStudentMetrics(students: StudentMetricSource[]): StudentMetrics {
  if (!students.length) return { progress: 0, attendance: 0 };

  const totals = students.reduce<StudentMetrics>(
    (current, student) => {
      const metrics = calculateStudentMetrics(student);
      return {
        progress: current.progress + metrics.progress,
        attendance: current.attendance + metrics.attendance
      };
    },
    { progress: 0, attendance: 0 }
  );

  return {
    progress: Math.round(totals.progress / students.length),
    attendance: Math.round(totals.attendance / students.length)
  };
}
