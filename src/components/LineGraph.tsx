import React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { format, addWeeks, addMonths, addQuarters, addYears, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { DailyReserve } from "@/types";

export type IntervalType = "weekly" | "monthly" | "3month" | "quarterly" | "semiannually" | "annually" | "custom";

interface LineGraphProps {
  data: DailyReserve[];
  interval: IntervalType;
  selectedDate: Date;
  entries?: any[];
}

function aggregateData(data: DailyReserve[], interval: IntervalType) {
  if (interval === 'custom') {
    return data.slice().sort((a, b) => a.date.getTime() - b.date.getTime());
  }
  if (!data.length) return [];
  const sorted = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
  const result: { date: Date; reserve: number }[] = [];
  let current = sorted[0].date;

  // Helper functions for intervals
  let getNext: (date: Date) => Date;
  let getInterval: (date: Date) => { start: Date; end: Date };

  switch (interval) {
    case "weekly":
      getNext = (d) => addWeeks(d, 1);
      getInterval = (d) => ({ start: startOfWeek(d, { weekStartsOn: 1 }), end: endOfWeek(d, { weekStartsOn: 1 }) });
      break;
    case "monthly":
      getNext = (d) => addMonths(d, 1);
      getInterval = (d) => ({ start: startOfMonth(d), end: endOfMonth(d) });
      break;
    case "quarterly":
      getNext = (d) => addQuarters(d, 1);
      getInterval = (d) => ({ start: startOfQuarter(d), end: endOfQuarter(d) });
      break;
    case "semiannually":
      getNext = (d) => addMonths(d, 6);
      getInterval = (d) => {
        const month = d.getMonth();
        const year = d.getFullYear();
        const startMonth = month < 6 ? 0 : 6;
        return {
          start: new Date(year, startMonth, 1),
          end: new Date(year, startMonth + 5, new Date(year, startMonth + 6, 0).getDate())
        };
      };
      break;
    case "annually":
      getNext = (d) => addYears(d, 1);
      getInterval = (d) => ({ start: startOfYear(d), end: endOfYear(d) });
      break;
    default:
      return data;
  }

  while (current <= sorted[sorted.length - 1].date) {
    const { start, end } = getInterval(current);
    const inRange = sorted.filter(r => isWithinInterval(r.date, { start, end }));
    if (inRange.length) {
      result.push({
        date: start,
        reserve: inRange[inRange.length - 1].reserve
      });
    }
    current = getNext(current);
  }
  return result;
}

const LineGraph: React.FC<LineGraphProps> = ({ data, interval }) => {
  const chartData = interval === 'custom' ? data : aggregateData(data, interval);

  const getLabel = (date: Date) => {
    // Basic formatting based on duration context
    return format(date, "MMM d");
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorReserve" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={true} horizontal={true} />
        <XAxis
          dataKey="date"
          tickFormatter={getLabel}
          tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'Orbitron' }}
          axisLine={{ stroke: '#1f2937' }}
          tickLine={false}
          minTickGap={30}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'Orbitron' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#0c1219', borderColor: '#0ea5e9', color: '#e2e8f0' }}
          itemStyle={{ color: '#0ea5e9' }}
          labelFormatter={(label) => format(new Date(label), "MMM d, yyyy")}
          formatter={(value: number) => [`$${value.toFixed(2)}`, "Reserve Balance"]}
        />
        <Legend
          verticalAlign="top"
          height={36}
          content={({ payload }) => (
            <div className="flex justify-center items-center gap-2 mb-4">
              {payload?.map((entry, index) => (
                <div key={`item-${index}`} className="flex items-center gap-2">
                  <div className="w-8 h-3 bg-[#0ea5e9] rounded-[2px] opacity-80"></div>
                  <span className="text-sm text-[#64748b]" style={{ fontFamily: 'sans-serif' }}>{entry.value}</span>
                </div>
              ))}
            </div>
          )}
        />
        <Area
          type="monotone"
          dataKey="reserve"
          stroke="#0ea5e9"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorReserve)"
          name="Reserve Balance"
          animationDuration={1000}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};
export default LineGraph;
