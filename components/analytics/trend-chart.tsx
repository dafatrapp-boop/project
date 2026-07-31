'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export interface TrendPoint {
  day: string;
  views: number;
  leads: number;
}

/**
 * Renders the visits-vs-leads trend. Data is computed server-side from
 * real rows in `leads_daily_counts` / `page_views_daily_counts` — this
 * component only draws what it's given, it never invents values for
 * days with no activity (those are filled with 0 by the caller).
 */
export function TrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-72 w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 91%)" />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="views" name="الزيارات" stroke="hsl(234 76% 58%)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="leads" name="العملاء المحتملون" stroke="hsl(152 60% 36%)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
