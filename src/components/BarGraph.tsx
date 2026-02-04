
import { useState } from "react";
import { DailyReserve } from "@/types";
import { formatDateToMonthDayYear } from "@/utils/dateUtils";
import { cn } from "@/lib/utils";

interface BarGraphProps {
  reserves: DailyReserve[];
  maxHeight?: number;
}

interface BarTooltipProps {
  reserve: DailyReserve;
  position: { x: number; y: number };
}

const BarTooltip: React.FC<BarTooltipProps> = ({ reserve, position }) => {
  const formattedDate = formatDateToMonthDayYear(reserve.date);
  const hasEntries = reserve.entries.length > 0;
  
  return (
    <div
      className="absolute z-50 p-3 rounded-none border border-mgs-green bg-mgs-black bg-opacity-90 text-mgs-text shadow-lg pointer-events-none transform -translate-x-1/2"
      style={{
        left: position.x,
        bottom: position.y + 15
      }}
    >
      <div className="font-orbitron text-mgs-green border-b border-mgs-green mb-1 pb-1">
        {formattedDate}
      </div>
      
      {hasEntries && (
        <div className="mb-2">
          <div className="text-sm uppercase">
            {reserve.entries.some(e => e.type === 'bill') && (
              <div className="text-mgs-red">
                Bills: {reserve.entries.filter(e => e.type === 'bill').map(e => e.name).join(', ')}
              </div>
            )}
            {reserve.entries.some(e => e.type === 'paycheck') && (
              <div className="text-mgs-green">
                Income: {reserve.entries.filter(e => e.type === 'paycheck').reduce((sum, entry) => sum + entry.amount, 0).toFixed(2)}
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className={cn(
        "font-orbitron",
        reserve.reserve >= 0 ? "text-mgs-green" : "text-mgs-red"
      )}>
        Reserve: {reserve.reserve.toFixed(2)}
      </div>
    </div>
  );
};

const BarGraph: React.FC<BarGraphProps> = ({ reserves, maxHeight = 300 }) => {
  const [tooltip, setTooltip] = useState<{ reserve: DailyReserve; position: { x: number; y: number } } | null>(null);

  // Find the maximum absolute value of reserves to scale the bars properly
  const maxReserve = Math.max(
    ...reserves.map(r => Math.abs(r.reserve)),
    1 // Minimum to avoid division by zero
  );

  const handleMouseEnter = (reserve: DailyReserve, event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      reserve,
      position: {
        x: rect.left + rect.width / 2,
        y: maxHeight * (Math.abs(reserve.reserve) / maxReserve)
      }
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div className="relative">
      <div className="h-[300px] flex items-end overflow-x-auto bg-opacity-30 border border-mgs-green rounded-none bg-mgs-black px-1">
        {reserves.map((dailyReserve, index) => {
          const heightPercentage = Math.max(
            10,
            (Math.abs(dailyReserve.reserve) / maxReserve) * 100
          );
          
          return (
            <div
              key={index}
              className={cn(
                "min-w-[15px] mx-[1px] relative transition-all duration-300",
                dailyReserve.entries.length > 0 ? "animate-pulse-glow" : "",
                dailyReserve.reserve >= 0 ? "bg-mgs-green" : "bg-mgs-red"
              )}
              style={{
                height: `${heightPercentage}%`,
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.5)"
              }}
              onMouseEnter={(e) => handleMouseEnter(dailyReserve, e)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="absolute -bottom-6 left-0 right-0 text-center text-[10px] text-mgs-lightgray">
                {dailyReserve.date.getDate()}
              </div>
            </div>
          );
        })}
      </div>
      
      {tooltip && <BarTooltip reserve={tooltip.reserve} position={tooltip.position} />}
    </div>
  );
};

export default BarGraph;
