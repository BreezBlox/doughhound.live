import React, { useState } from "react";

interface MultiDateCalendarProps {
  selectedDates: string[];
  onChange: (dates: string[]) => void;
  initialMonth?: number; // 0-11
  initialYear?: number;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const MultiDateCalendar: React.FC<MultiDateCalendarProps> = ({
  selectedDates,
  onChange,
  initialMonth,
  initialYear
}) => {
  const today = new Date();
  const [month, setMonth] = useState(initialMonth ?? today.getMonth());
  const [year, setYear] = useState(initialYear ?? today.getFullYear());

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  // Helper: YYYY-MM-DD
  function getDateString(day: number) {
    return `${year}-${pad(month + 1)}-${pad(day)}`;
  }

  function isSelected(day: number) {
    return selectedDates.includes(getDateString(day));
  }

  function toggleDay(day: number) {
    const dateStr = getDateString(day);
    if (selectedDates.includes(dateStr)) {
      onChange(selectedDates.filter(d => d !== dateStr));
    } else {
      onChange([...selectedDates, dateStr]);
    }
  }

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  }
  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  }

  // Render days grid
  const days: React.ReactNode[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const selected = isSelected(day);
    days.push(
      <button
        key={day}
        type="button"
        className={`w-8 h-8 rounded-full border-2 mx-0.5 my-0.5 ${selected ? "bg-mgs-green border-mgs-green text-mgs-black" : "bg-mgs-darkgray border-mgs-gray text-mgs-lightertext hover:bg-mgs-green/30"}`}
        onClick={() => toggleDay(day)}
        aria-pressed={selected}
      >
        {day}
      </button>
    );
  }

  return (
    <div className="inline-block p-2 bg-mgs-darkgray rounded shadow-md">
      <div className="flex items-center justify-between mb-2">
        <button type="button" onClick={prevMonth} className="px-2 py-1 text-mgs-lightgray hover:text-mgs-green">&#60;</button>
        <span className="font-semibold text-mgs-lightertext">
          {new Date(year, month).toLocaleString(undefined, { month: "long", year: "numeric" })}
        </span>
        <button type="button" onClick={nextMonth} className="px-2 py-1 text-mgs-lightgray hover:text-mgs-green">&#62;</button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {WEEKDAYS.map(wd => (
          <div key={wd} className="text-xs font-bold text-mgs-lightgray text-center">{wd}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days}
      </div>
    </div>
  );
};

export default MultiDateCalendar;
