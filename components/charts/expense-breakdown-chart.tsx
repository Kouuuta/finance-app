"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface ExpenseBreakdownChartProps {
  data: { name: string; value: number }[];
}

const THEME = {
  ink900: "rgb(var(--ink-900))",
  ink700: "rgb(var(--ink-700))",
  ink400: "rgb(var(--ink-400))",
  line: "rgb(var(--line))",
  paper0: "rgb(var(--paper-0))",
};

const COLORS = [
  THEME.ink900,
  THEME.ink700,
  THEME.ink400,
  THEME.line,
  `${THEME.ink700} / 0.6`,
  `${THEME.ink400} / 0.6`,
];

export function ExpenseBreakdownChart({ data }: ExpenseBreakdownChartProps) {
  if (data.length === 0) return null;

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={0} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: THEME.paper0,
              border: `0.5px solid ${THEME.line}`,
              borderRadius: 10,
              fontSize: 13,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
