"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { weeklyProgress } from "@/lib/data";
import type { ProgressLinePoint, ProgressTrendPoint } from "@/lib/progress-analytics";
import { cn } from "@/lib/utils";

type WeeklyPoint = ProgressLinePoint | (typeof weeklyProgress)[number];
type ChartPeriod = "weekly" | "monthly" | "yearly";

type AggregatedTrendPoint = {
  label: string;
  result: number;
  rpe: number;
  sessions: number;
  periodLabel: string;
};

const periodOptions: Array<{ value: ChartPeriod; label: string; description: string }> = [
  { value: "weekly", label: "Mingguan", description: "Data digabung per minggu latihan." },
  { value: "monthly", label: "Bulanan", description: "Data digabung per bulan latihan." },
  { value: "yearly", label: "Tahunan", description: "Data digabung per tahun latihan." }
];

const monthFormatter = new Intl.DateTimeFormat("id-ID", { month: "short", year: "numeric" });
const longMonthFormatter = new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" });
const dayMonthFormatter = new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short" });

function withLabel(data: WeeklyPoint[]) {
  return data.map((point) => ({
    ...point,
    label: "label" in point ? point.label : point.week
  }));
}

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round((values.reduce((total, value) => total + value, 0) / values.length) * 10) / 10;
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay() || 7;
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - day + 1);
  return result;
}

function periodKey(date: Date, period: ChartPeriod) {
  if (period === "yearly") return `${date.getFullYear()}`;
  if (period === "monthly") return `${date.getFullYear()}-${date.getMonth()}`;

  const weekStart = startOfWeek(date);
  return `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`;
}

function periodLabel(date: Date, period: ChartPeriod) {
  if (period === "yearly") return `${date.getFullYear()}`;
  if (period === "monthly") return monthFormatter.format(date);

  return `Minggu ${dayMonthFormatter.format(startOfWeek(date))}`;
}

function periodDescriptionLabel(date: Date, period: ChartPeriod) {
  if (period === "yearly") return `${date.getFullYear()}`;
  if (period === "monthly") return longMonthFormatter.format(date);

  return `minggu mulai ${dayMonthFormatter.format(startOfWeek(date))}`;
}

function aggregateTrendData(data: ProgressTrendPoint[], period: ChartPeriod) {
  const groups = new Map<string, { date: Date; points: ProgressTrendPoint[] }>();

  data.forEach((point) => {
    const date = new Date(point.timestamp);
    const key = periodKey(date, period);
    const existing = groups.get(key);

    if (existing) {
      existing.points.push(point);
    } else {
      groups.set(key, { date, points: [point] });
    }
  });

  return Array.from(groups.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map<AggregatedTrendPoint>((group) => ({
      label: periodLabel(group.date, period),
      periodLabel: periodDescriptionLabel(group.date, period),
      result: average(group.points.map((point) => point.result)),
      rpe: average(group.points.map((point) => point.rpe)),
      sessions: group.points.length
    }));
}

function TrendTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ payload: AggregatedTrendPoint }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-md border bg-white px-3 py-2 text-xs shadow-lg shadow-slate-200/80">
      <p className="font-semibold text-slate-900">{label}</p>
      <p className="mt-1 text-slate-500">{point.periodLabel}</p>
      <div className="mt-2 space-y-1">
        <p>
          <span className="text-slate-500">Rata-rata hasil:</span> <span className="font-semibold text-sky-700">{point.result}</span>
        </p>
        <p>
          <span className="text-slate-500">Rata-rata RPE:</span> <span className="font-semibold text-emerald-700">{point.rpe}</span>
        </p>
        <p>
          <span className="text-slate-500">Jumlah log:</span> <span className="font-semibold text-slate-900">{point.sessions}</span>
        </p>
      </div>
    </div>
  );
}

export function WeeklyProgressChart({ data = weeklyProgress }: { data?: WeeklyPoint[] }) {
  const chartData = withLabel(data);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ left: -24, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} domain={[0, 100]} />
        <Tooltip
          contentStyle={{ borderRadius: 6, border: "1px solid #e5e7eb", fontSize: 12 }}
          labelStyle={{ fontSize: 12 }}
        />
        <Line type="monotone" dataKey="progress" stroke="#059669" strokeWidth={2} dot={{ r: 2 }} name="Progress" />
        <Line type="monotone" dataKey="attendance" stroke="#2563eb" strokeWidth={2} dot={{ r: 2 }} name="Kehadiran" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function MonitoringMiniChart({ data = weeklyProgress }: { data?: WeeklyPoint[] }) {
  const chartData = withLabel(data);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ left: -24, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#059669" stopOpacity={0.22} />
            <stop offset="95%" stopColor="#059669" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} domain={[0, 100]} />
        <Tooltip contentStyle={{ borderRadius: 6, border: "1px solid #e5e7eb", fontSize: 12 }} />
        <Area type="monotone" dataKey="progress" stroke="#059669" strokeWidth={2} fill="url(#progressFill)" name="Progress" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ProgressPerformanceChart({ data }: { data: ProgressTrendPoint[] }) {
  const [period, setPeriod] = useState<ChartPeriod>("weekly");
  const chartData = useMemo(() => aggregateTrendData(data, period), [data, period]);
  const selectedOption = periodOptions.find((option) => option.value === period) ?? periodOptions[0];

  if (!data.length) {
    return <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Belum ada log latihan untuk grafik.</div>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-900">Tampilan {selectedOption.label.toLowerCase()}</p>
          <p className="text-[11px] text-muted-foreground">{selectedOption.description}</p>
        </div>
        <div className="inline-flex rounded-md border bg-slate-50 p-0.5">
          {periodOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPeriod(option.value)}
              className={cn(
                "h-7 rounded px-2.5 text-[11px] font-medium transition-colors",
                period === option.value ? "bg-white text-sky-700 shadow-sm" : "text-slate-500 hover:text-slate-900"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ left: -16, right: -10, top: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="resultBarGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="55%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
              <linearGradient id="rpeLineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#475569" }} />
            <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
            <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#64748b" }} domain={[0, 1000]} />
            <Tooltip content={<TrendTooltip />} cursor={{ fill: "rgba(14, 165, 233, 0.08)" }} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            <Bar yAxisId="left" dataKey="result" name="Rata-rata hasil" fill="url(#resultBarGradient)" radius={[5, 5, 0, 0]} maxBarSize={52} />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="rpe"
              name="Rata-rata RPE"
              stroke="url(#rpeLineGradient)"
              strokeWidth={3}
              dot={{ r: 3, strokeWidth: 2, fill: "#ffffff", stroke: "#10b981" }}
              activeDot={{ r: 5, strokeWidth: 2, fill: "#ffffff", stroke: "#059669" }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-2 rounded-md border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-emerald-50 px-3 py-2 text-[11px] text-slate-600 sm:grid-cols-3">
        <p><span className="font-semibold text-sky-700">Batang biru</span> menunjukkan rata-rata hasil latihan.</p>
        <p><span className="font-semibold text-emerald-700">Garis hijau</span> menunjukkan tingkat beban latihan RPE 1-1000.</p>
        <p><span className="font-semibold text-slate-900">Jumlah log</span> terlihat saat kursor diarahkan ke grafik.</p>
      </div>
    </div>
  );
}

export function ProgressDonutChart({ progress, attendance }: { progress: number; attendance: number }) {
  const progressValue = Math.max(0, Math.min(100, progress));
  const attendanceValue = Math.max(0, Math.min(100, attendance));
  const readinessLabel = progressValue >= 80 && attendanceValue >= 80 ? "Sangat baik" : progressValue >= 50 && attendanceValue >= 70 ? "Dalam jalur" : "Perlu perhatian";
  const readinessTone =
    readinessLabel === "Sangat baik"
      ? "text-emerald-700"
      : readinessLabel === "Dalam jalur"
        ? "text-sky-700"
        : "text-amber-700";

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="grid min-h-0 flex-1 gap-3">
        <div className="grid min-h-0 grid-cols-[86px_1fr] items-center gap-3 rounded-md border border-sky-100 bg-gradient-to-r from-sky-50/80 via-white to-white p-3 shadow-sm shadow-slate-200/50">
          <div className="relative h-20 w-20">
            <div
              className="absolute inset-0 rounded-full shadow-inner"
              style={{
                background: `conic-gradient(from 180deg, #0284c7 0deg, #38bdf8 ${progressValue * 3.6}deg, #e2e8f0 ${progressValue * 3.6}deg 360deg)`
              }}
            />
            <div className="absolute inset-3 rounded-full bg-white shadow-sm" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-semibold leading-none text-slate-950">{progressValue}%</span>
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-sky-500" />
                <p className="truncate font-semibold text-slate-900">Progress program</p>
              </div>
              <span className={cn("shrink-0 text-[11px] font-semibold", readinessTone)}>{readinessLabel}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-sky-700 via-sky-500 to-cyan-300" style={{ width: `${progressValue}%` }} />
            </div>
            <p className="mt-2 text-[11px] leading-4 text-slate-600">
              Bagian program atau log latihan yang sudah selesai.
            </p>
          </div>
        </div>

        <div className="grid min-h-0 grid-cols-[86px_1fr] items-center gap-3 rounded-md border border-emerald-100 bg-gradient-to-r from-emerald-50/80 via-white to-white p-3 shadow-sm shadow-slate-200/50">
          <div className="relative h-20 w-20">
            <div
              className="absolute inset-0 rounded-full shadow-inner"
              style={{
                background: `conic-gradient(from 180deg, #047857 0deg, #34d399 ${attendanceValue * 3.6}deg, #e2e8f0 ${attendanceValue * 3.6}deg 360deg)`
              }}
            />
            <div className="absolute inset-3 rounded-full bg-white shadow-sm" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-semibold leading-none text-slate-950">{attendanceValue}%</span>
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                <p className="truncate font-semibold text-slate-900">Kehadiran latihan</p>
              </div>
              <span className="shrink-0 text-[11px] font-semibold text-emerald-700">
                {attendanceValue >= 80 ? "Konsisten" : attendanceValue >= 60 ? "Cukup" : "Perlu naik"}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-700 via-emerald-500 to-lime-300" style={{ width: `${attendanceValue}%` }} />
            </div>
            <p className="mt-2 text-[11px] leading-4 text-slate-600">
              Konsistensi hadir dari semua sesi absensi tercatat.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] leading-4 text-slate-600">
        <p>
          <span className="font-semibold text-slate-900">Cara baca:</span> lingkaran dan bar yang makin penuh berarti capaian makin tinggi.
        </p>
      </div>
    </div>
  );
}
