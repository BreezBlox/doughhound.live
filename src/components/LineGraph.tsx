import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
// Helper to get color for reserve value
function reserveColor(reserve: number): string {
  if (reserve >= 0) {
    // Green, more vivid as reserve increases
    const g = Math.min(255, 120 + Math.floor(Math.min(reserve, 10000) / 10000 * 135));
    return `rgb(72, ${g}, 120)`; // greenish
  } else {
    // Red, more vivid as reserve decreases
    const r = Math.min(255, 120 + Math.floor(Math.min(-reserve, 10000) / 10000 * 135));
    return `rgb(${r}, 72, 72)`; // reddish
  }
}
// Split data into contiguous segments by sign
function splitSegments(data: {date: Date, reserve: number}[]) {
  if (!data.length) return [];
  const segments: {points: {date: Date, reserve: number}[], color: string}[] = [];
  let current: {date: Date, reserve: number}[] = [data[0]];
  for (let i = 1; i < data.length; ++i) {
    const prev = data[i-1].reserve;
    const curr = data[i].reserve;
    if ((prev >= 0 && curr >= 0) || (prev < 0 && curr < 0)) {
      current.push(data[i]);
    } else {
      // sign change: finish segment
      const avg = current.reduce((s, p) => s + p.reserve, 0) / current.length;
      segments.push({ points: current, color: reserveColor(avg) });
      current = [data[i-1], data[i]]; // repeat boundary for continuity
    }
  }
  const avg = current.reduce((s, p) => s + p.reserve, 0) / current.length;
  segments.push({ points: current, color: reserveColor(avg) });
  return segments;
}
import { DailyReserve } from "@/types";

export type IntervalType = "weekly" | "monthly" | "3month" | "quarterly" | "semiannually" | "annually";

// Extend props to accept entries
interface LineGraphProps {
  data: DailyReserve[];
  interval: IntervalType;
  selectedDate: Date;
  entries?: any[];
}

interface LineGraphProps {
  data: DailyReserve[];
  interval: IntervalType;
  selectedDate: Date;
}

import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter,
  startOfYear, endOfYear, format, addWeeks, addMonths, addQuarters, addYears, isWithinInterval,
  eachDayOfInterval, isSameMonth, isSameWeek, isSameQuarter, isSameYear
} from 'date-fns';

function aggregateData(data: DailyReserve[], interval: IntervalType) {
  // If interval is 'custom', just return sorted data (no aggregation)
  if (interval === 'custom') {
    return data.slice().sort((a, b) => a.date.getTime() - b.date.getTime());
  }
  if (!data.length) return [];
  const sorted = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());
  const result: { date: Date; reserve: number }[] = [];
  let current = sorted[0].date;
  let end: Date;
  let getNext: (date: Date) => Date;
  let getInterval: (date: Date) => { start: Date; end: Date };
  let labelFormat: string;

  switch (interval) {
    case "weekly":
      getNext = (d) => addWeeks(d, 1);
      getInterval = (d) => ({ start: startOfWeek(d, { weekStartsOn: 1 }), end: endOfWeek(d, { weekStartsOn: 1 }) });
      labelFormat = "MMM d";
      break;
    case "monthly":
      getNext = (d) => addMonths(d, 1);
      getInterval = (d) => ({ start: startOfMonth(d), end: endOfMonth(d) });
      labelFormat = "MMM yyyy";
      break;
    case "quarterly":
      getNext = (d) => addQuarters(d, 1);
      getInterval = (d) => ({ start: startOfQuarter(d), end: endOfQuarter(d) });
      labelFormat = "QQQ yyyy";
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
      labelFormat = "MMM yyyy";
      break;
    case "annually":
      getNext = (d) => addYears(d, 1);
      getInterval = (d) => ({ start: startOfYear(d), end: endOfYear(d) });
      labelFormat = "yyyy";
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
        reserve: inRange[inRange.length - 1].reserve // Use last day in range
      });
    }
    current = getNext(current);
  }
  return result;
}



const LineGraph: React.FC<LineGraphProps> = ({ data, interval, selectedDate, entries = [] }) => {
  // If interval is 'custom', skip any additional filtering/aggregation
  const chartData = interval === 'custom' ? data : aggregateData(data, interval);

  const getLabel = (date: Date) => {
    switch (interval) {
      case "weekly": return format(date, "MMM d");
      case "monthly": return format(date, "MMM d");
      case "3month": return format(date, "MMM d");
      case "quarterly": return format(date, "MMM d");
      case "semiannually": return format(date, "MMM d");
      case "annually": return format(date, "yyyy");
      default: return date.toLocaleDateString();
    }
  };

  // Find min/max reserve for gradient stops
  const reserves = chartData.map(d => d.reserve);
  const minReserve = Math.min(...reserves, 0);
  const maxReserve = Math.max(...reserves, 0);
  // Calculate gradient stops: 0 is at the right ratio between min and max
  const zeroRatio = maxReserve === minReserve ? 0.5 : (0 - minReserve) / (maxReserve - minReserve);
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
        <defs>
          <linearGradient id="reserve-gradient" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#e53e3e" /> {/* vivid red for lowest negative */}
            <stop offset={`${zeroRatio * 100}%`} stopColor="#e53e3e" /> {/* red up to zero */}
            <stop offset={`${zeroRatio * 100}%`} stopColor="#38a169" /> {/* green at zero */}
            <stop offset="100%" stopColor="#38a169" /> {/* vivid green for highest positive */}
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
           dataKey="date"
           tickFormatter={getLabel}
           type="category"
           minTickGap={0}
           tickCount={10}
           domain={undefined}
         />
        <YAxis
           domain={[dataMin => Math.floor(dataMin - 2), dataMax => Math.ceil(dataMax + 2)]}
           allowDecimals={true}
           tickCount={10}
         />
        <Tooltip 
          content={({ active, payload, label }) => {
            if (!active || !payload || !payload.length) return null;
            const d = payload[0].payload.date;
            // Use the entries attached to this reserve data point, if present
            const dayEntries = payload[0].payload.entries || [];
            const expenditure = dayEntries.filter(e => e.type === 'bill' || e.type === 'purchase').reduce((sum, e) => sum + e.amount, 0);
            const acquisition = dayEntries.filter(e => e.type === 'paycheck').reduce((sum, e) => sum + e.amount, 0);
            // Calculation breakdown
            let prevReserve = 0;
            if (payload[0].payload && payload[0].payload._index > 0 && payload[0].payload._parentData) {
              prevReserve = payload[0].payload._parentData[payload[0].payload._index - 1].reserve;
            } else if (payload[0].payload && payload[0].payload._index === 0 && payload[0].payload.reserve !== undefined) {
              prevReserve = payload[0].payload.reserve - acquisition + expenditure;
            }
            return (
              <div style={{background:'#181d23',border:'1px solid #38a169',padding:'8px',borderRadius:'8px',minWidth:200}}>
                <div style={{color:'#38a169',fontFamily:'Orbitron',marginBottom:4}}>{getLabel(d)}</div>
                <div style={{color:'#b9fbc0'}}>Reserve: <b>{payload[0].value}</b></div>
                <div style={{color:'#e53e3e'}}>Expenditure: <b>{expenditure.toFixed(2)}</b></div>
                <div style={{color:'#38a169'}}>Acquisition: <b>{acquisition.toFixed(2)}</b></div>
                <div style={{marginTop:6}}>
                  <div style={{fontWeight:'bold',fontSize:12,color:'#fff'}}>Expenditures (Bills):</div>
                  {dayEntries.filter(e => e.type === 'bill').length === 0 ? (
                    <div style={{color:'#b9fbc0',fontSize:12}}>No expenditures</div>
                  ) : (
                    <ul style={{margin:0,paddingLeft:16}}>
                      {dayEntries.filter(e => e.type === 'bill').map((e,i) => (
                        <li key={i} style={{color:'#e53e3e',fontSize:12}}>
                          Bill: {e.name} ({e.amount})
                        </li>
                      ))}
                    </ul>
                  )}
                  <div style={{fontWeight:'bold',fontSize:12,color:'#fff',marginTop:4}}>Purchases:</div>
                  {dayEntries.filter(e => e.type === 'purchase').length === 0 ? (
                    <div style={{color:'#facc15',fontSize:12}}>No purchases</div>
                  ) : (
                    <ul style={{margin:0,paddingLeft:16}}>
                      {dayEntries.filter(e => e.type === 'purchase').map((e,i) => (
                        <li key={i} style={{color:'#facc15',fontSize:12}}>
                          Purchase: {e.name} ({e.amount})
                        </li>
                      ))}
                    </ul>
                  )}
                  <div style={{fontWeight:'bold',fontSize:12,color:'#fff',marginTop:4}}>Acquisitions (Paychecks):</div>
                  {dayEntries.filter(e => e.type === 'paycheck').length === 0 ? (
                    <div style={{color:'#b9fbc0',fontSize:12}}>No acquisitions</div>
                  ) : (
                    <ul style={{margin:0,paddingLeft:16}}>
                      {dayEntries.filter(e => e.type === 'paycheck').map((e,i) => (
                        <li key={i} style={{color:'#38a169',fontSize:12}}>
                          Paycheck: {e.name} ({e.amount})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          }}
          labelFormatter={value => getLabel(value as Date)}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="reserve"
          stroke="url(#reserve-gradient)"
          strokeWidth={3}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default LineGraph;
