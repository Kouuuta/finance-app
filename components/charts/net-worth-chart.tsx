"use client";

import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface NetWorthChartProps {
  data: { date: string; value: number }[];
}

const THEME = {
  ink400: "rgb(var(--ink-400))",
  line: "rgb(var(--line))",
  ink900: "rgb(var(--ink-900))",
  paper0: "rgb(var(--paper-0))",
};

export function NetWorthChart({ data }: NetWorthChartProps) {
  if (data.length === 0) return null;

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: THEME.ink400 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: THEME.ink400 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              background: THEME.paper0,
              border: `0.5px solid ${THEME.line}`,
              borderRadius: 10,
              fontSize: 13,
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={THEME.ink900}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
