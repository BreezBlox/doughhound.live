
import { useState } from "react";
import { CalendarDay } from "@/types";
import { getDaysInMonth, getFirstDayOfMonth, getMonthName } from "@/utils/dateUtils";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());
  
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
  
  // Generate days for the previous month (for filling the calendar grid)
  const daysInPrevMonth = getDaysInMonth(currentYear, currentMonth - 1);
  const prevMonthDays: CalendarDay[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    prevMonthDays.push({
      date: new Date(currentYear, currentMonth - 1, daysInPrevMonth - firstDayOfMonth + i + 1),
      isCurrentMonth: false,
      isSelected: false
    });
  }
  
  // Generate days for the current month
  const currentMonthDays: CalendarDay[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(currentYear, currentMonth, i);
    currentMonthDays.push({
      date,
      isCurrentMonth: true,
      isSelected: 
        selectedDate.getFullYear() === date.getFullYear() &&
        selectedDate.getMonth() === date.getMonth() &&
        selectedDate.getDate() === date.getDate()
    });
  }
  
  // Generate days for the next month (to fill the rest of the grid)
  const nextMonthDays: CalendarDay[] = [];
  const totalDays = prevMonthDays.length + currentMonthDays.length;
  const remainingDays = 42 - totalDays; // 6 rows of 7 days
  
  for (let i = 1; i <= remainingDays; i++) {
    nextMonthDays.push({
      date: new Date(currentYear, currentMonth + 1, i),
      isCurrentMonth: false,
      isSelected: false
    });
  }
  
  // Combine all days
  const allDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  
  // Handle navigation
  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  
  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };
  
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <button 
          onClick={goToPrevMonth}
          className="p-1 border border-mgs-gray hover:border-mgs-green"
        >
          <ChevronLeft className="h-4 w-4 text-mgs-lightgray" />
        </button>
        
        <h3 className="font-orbitron text-mgs-green">
          {getMonthName(currentMonth)} {currentYear}
        </h3>
        
        <button 
          onClick={goToNextMonth}
          className="p-1 border border-mgs-gray hover:border-mgs-green"
        >
          <ChevronRight className="h-4 w-4 text-mgs-lightgray" />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <div 
            key={index}
            className="font-orbitron bg-mgs-gray text-mgs-lightertext text-center py-1 text-xs"
          >
            {day}
          </div>
        ))}
        
        {allDays.map((day, index) => (
          <div 
            key={index}
            className={cn(
              "text-center py-1 cursor-pointer text-sm border",
              day.isCurrentMonth ? "bg-mgs-darkgray border-mgs-gray" : "bg-mgs-black border-mgs-darkgray opacity-50",
              day.isSelected ? "bg-mgs-green text-mgs-black border-mgs-green font-bold" : "",
              !day.isCurrentMonth ? "pointer-events-none" : "hover:bg-mgs-gray"
            )}
            onClick={() => day.isCurrentMonth && onDateSelect(day.date)}
          >
            {day.date.getDate()}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Calendar;
