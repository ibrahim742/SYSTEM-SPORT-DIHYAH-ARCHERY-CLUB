type AssignmentMetricSource = {
  status?: string;
  program?: {
    materials?: number | null;
  } | null;
};

type TrainingLogMetricSource = {
  status?: string;
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

export function calculateStudentMetrics(student: StudentMetricSource): StudentMetrics {
  const assignments = student.assignments ?? [];
  const latestAssignment = assignments[0];
  const activeAssignment = assignments.find((assignment) => assignment.status === "AKTIF") ?? latestAssignment;
  const trainingLogs = student.trainingLogs ?? [];
  const completedLogs = trainingLogs.filter((log) => log.status === "SELESAI").length;
  const targetMaterials = activeAssignment?.program?.materials ?? latestAssignment?.program?.materials ?? 0;

  const progress =
    activeAssignment?.status === "SELESAI"
      ? 100
      : targetMaterials > 0
        ? percent(completedLogs, targetMaterials)
        : trainingLogs.length > 0
          ? percent(completedLogs, trainingLogs.length)
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
