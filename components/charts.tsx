"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { weeklyProgress } from "@/lib/data";

export function WeeklyProgressChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={weeklyProgress} margin={{ left: -24, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
        <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
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

export function MonitoringMiniChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={weeklyProgress} margin={{ left: -24, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="progressFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#059669" stopOpacity={0.22} />
            <stop offset="95%" stopColor="#059669" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
        <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} domain={[0, 100]} />
        <Tooltip contentStyle={{ borderRadius: 6, border: "1px solid #e5e7eb", fontSize: 12 }} />
        <Area type="monotone" dataKey="progress" stroke="#059669" strokeWidth={2} fill="url(#progressFill)" name="Progress" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
