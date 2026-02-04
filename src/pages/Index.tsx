
import { useState, useEffect } from "react";
import LineGraph, { IntervalType } from "@/components/LineGraph";
import { MONTH_OPTIONS } from "@/utils/monthOptions";
import Calendar from "@/components/Calendar";
// import BarGraph from "@/components/BarGraph"; // No longer used
import BillForm from "@/components/BillForm";
import CsvImport from "@/components/CsvImport";
import PaycheckForm from "@/components/PaycheckForm";
import EntryList from "@/components/EntryList";
import { FinancialEntry } from "@/types";
import PurchaseForm from "@/components/PurchaseForm";
import PurchaseRadio from "@/components/ui/purchase-radio";
import OnboardingDialog from "@/components/OnboardingDialog";
import OnboardingHint from "@/components/ui/OnboardingHint";
import SheetSetup from "@/components/SheetSetup";
import { useAuth } from "@/auth/AuthContext";
import { FinancialEntry, EntryType, DailyReserve } from "@/types";
import { calculateRecurringEntries, calculateDailyReserves, formatDateToMonthDayYear, formatDateToYYYYMMDD } from "@/utils/dateUtils";
import { v4 as uuidv4 } from "uuid";
import * as sheetsService from "@/services/sheetsService";

const Index = () => {
  const { user, accessToken, logout } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [entryType, setEntryType] = useState<EntryType>("bill");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [reserves, setReserves] = useState<DailyReserve[]>([]);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const toggleVisibility = (id: string) => {
    setHiddenIds((prev) => prev.includes(id) ? prev.filter(hid => hid !== id) : [...prev, id]);
  };
  // Remove interval state, add selectedMonths
  const [selectedMonths, setSelectedMonths] = useState<number[]>([new Date().getMonth()]);

  // Calculate reserves when entries or selectedDate change
  // Only use visible entries for forecast/graph/export
  const visibleEntries = entries.filter(e => !hiddenIds.includes(e.id));

  useEffect(() => {
    // Always show 24 months of data, but start from the earliest entry date for true running balance
    let minEntryDate = visibleEntries.length > 0 ? visibleEntries.reduce((min, e) => e.date < min ? e.date : min, visibleEntries[0].date) : new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    minEntryDate = new Date(minEntryDate.getFullYear(), minEntryDate.getMonth(), 1); // snap to first of month
    const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 24, 0); // 24 months ahead
    // Calculate all recurring entries for 24 months
    const recurringEntries = calculateRecurringEntries(visibleEntries, minEntryDate, endDate);
    // Calculate daily reserves for 24 months
    const dailyReserves = calculateDailyReserves(recurringEntries, minEntryDate, endDate);
    setReserves(dailyReserves);
  }, [entries, selectedDate, hiddenIds]);

  // Handle form submission
  const handleEntrySubmit = async (newEntry: Omit<FinancialEntry, 'id'>) => {
    const entryWithId: FinancialEntry = {
      ...newEntry,
      id: uuidv4()
    };
    setEntries(prevEntries => [...prevEntries, entryWithId]);

    // Save to Google Sheets
    if (user?.sheetId && accessToken) {
      setIsSaving(true);
      await sheetsService.saveEntry({ accessToken, sheetId: user.sheetId }, entryWithId);
      setIsSaving(false);
    }
  };

  // Bulk import handler for CSV
  const handleCsvImport = (imported: FinancialEntry[]) => {
    setEntries(prev => [...prev, ...imported]);
  };

  // Edit entry logic
  const [editingEntry, setEditingEntry] = useState<FinancialEntry | null>(null);

  // Delete an entry
  const handleDeleteEntry = async (id: string) => {
    setEntries(prevEntries => prevEntries.filter(entry => entry.id !== id));
    if (editingEntry && editingEntry.id === id) setEditingEntry(null);

    // Delete from Google Sheets
    if (user?.sheetId && accessToken) {
      await sheetsService.deleteEntry({ accessToken, sheetId: user.sheetId }, id);
    }
  };

  // Start editing
  const handleEditEntry = (entry: FinancialEntry) => setEditingEntry(entry);
  // Save edit
  const handleSaveEdit = async (updated: FinancialEntry) => {
    setEntries(prevEntries => prevEntries.map(e => e.id === updated.id ? updated : e));
    setEditingEntry(null);

    // Update in Google Sheets
    if (user?.sheetId && accessToken) {
      await sheetsService.updateEntry({ accessToken, sheetId: user.sheetId }, updated);
    }
  };
  // Cancel edit
  const handleCancelEdit = () => setEditingEntry(null);


  // Load entries from Google Sheets on mount
  useEffect(() => {
    const loadEntries = async () => {
      if (user?.sheetId && accessToken) {
        setIsLoadingData(true);
        try {
          const loadedEntries = await sheetsService.fetchEntries({
            accessToken,
            sheetId: user.sheetId,
          });
          setEntries(loadedEntries);
        } catch (error) {
          console.error('Failed to load entries:', error);
        } finally {
          setIsLoadingData(false);
        }
      } else {
        setIsLoadingData(false);
      }
    };
    loadEntries();
  }, [user?.sheetId, accessToken]);

  // If user hasn't linked a sheet yet, show setup
  if (!user?.sheetId) {
    return <SheetSetup onComplete={() => window.location.reload()} />;
  }

  // Show loading state while fetching data
  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-mgs-black flex items-center justify-center">
        <div className="text-mgs-green font-orbitron text-xl animate-pulse">
          LOADING INTEL...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mgs-black p-2 sm:p-4 md:p-8">
      <header className="flex flex-col items-center border-b border-mgs-green pb-4 mb-6 relative">
        <img src="/logo/android-chrome-512x512.png" alt="Dough Hound Logo" className="w-20 h-20 object-contain mb-2" />
        <div className="flex flex-col items-center">
          <span className="text-3xl sm:text-5xl font-orbitron text-mgs-green tracking-wider leading-tight text-center">DOUGH HOUND</span>
          <span className="text-xl sm:text-3xl font-orbitron text-mgs-green tracking-wider leading-tight text-center">TACTICAL FINANCE</span>
        </div>
        <button
          className="absolute right-2 top-2 px-3 py-1 text-xs font-orbitron bg-mgs-green text-mgs-black rounded hover:bg-mgs-darkgreen border border-mgs-green"
          onClick={() => setShowOnboarding(true)}
        >
          Help
        </button>
      </header>
      <OnboardingHint onShow={() => setShowOnboarding(true)} />
      <OnboardingDialog open={showOnboarding} onClose={() => setShowOnboarding(false)} />

      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Left Panel - Bar Graph */}
        <div className="w-full md:w-3/5 bg-opacity-30 border border-mgs-green p-2 sm:p-4 animate-fade-in flex flex-col items-center justify-center min-h-[250px] sm:min-h-[350px] md:min-h-[550px]">
          <h2 className="font-orbitron text-lg text-center mb-4 pb-2 border-b border-mgs-green">
            Reserve Forecast
          </h2>
          {/* Month Selection Checkboxes */}
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {MONTH_OPTIONS.map(opt => (
              <label key={opt.value} className={`px-2 py-1 rounded font-orbitron border text-xs sm:text-sm transition-colors cursor-pointer ${selectedMonths.includes(opt.value) ? 'bg-mgs-green text-mgs-black border-mgs-green' : 'bg-mgs-black text-mgs-green border-mgs-green hover:bg-mgs-green/30'}`}>
                <input
                  type="checkbox"
                  checked={selectedMonths.includes(opt.value)}
                  onChange={e => {
                    setSelectedMonths(prev =>
                      e.target.checked
                        ? [...prev, opt.value].slice(0, 12)
                        : prev.filter(m => m !== opt.value)
                    );
                  }}
                  className="mr-1 accent-mgs-green"
                  style={{ display: 'inline-block' }}
                />
                {opt.label}
              </label>
            ))}
          </div>
          <div className="w-full flex-1 flex items-center justify-center overflow-x-auto">
            <LineGraph
              data={reserves
                .filter(r =>
                  selectedMonths.includes(r.date.getMonth()) &&
                  r.date.getFullYear() === new Date().getFullYear()
                )
                .sort((a, b) => a.date.getTime() - b.date.getTime())
              }
              interval={"custom"}
              selectedDate={selectedDate}
              entries={entries}
            />
          </div>

          {/* Export Forecast Button */}
          <div className="flex justify-center mt-4">
            <button
              className="px-4 py-2 rounded font-orbitron border text-xs sm:text-sm bg-mgs-green text-mgs-black border-mgs-green hover:bg-mgs-green/80 transition-colors"
              onClick={() => {
                // Export detailed CSV: Date, Reserve, entry1, entry2, ...
                // Find max number of entries per day
                let maxEntries = 0;
                for (const r of reserves) {
                  if (r.entries && r.entries.length > maxEntries) maxEntries = r.entries.length;
                }
                // Header
                let csv = 'Date,Reserve';
                for (let i = 1; i <= maxEntries; ++i) {
                  csv += `,Entry ${i}`;
                }
                csv += '\n';
                // Rows
                for (const r of reserves) {
                  const date = formatDateToYYYYMMDD(r.date);
                  const reserve = r.reserve;
                  let row = `${date},${reserve}`;
                  if (r.entries && r.entries.length > 0) {
                    row += r.entries.map(e => {
                      let sign = (e.type === 'paycheck') ? '+' : '-';
                      let label = e.name ? ` ${e.name}` : '';
                      return `,"${sign}${e.amount}${label}"`;
                    }).join('');
                    // If fewer than maxEntries, pad with blanks
                    if (r.entries.length < maxEntries) {
                      row += ','.repeat(maxEntries - r.entries.length);
                    }
                  } else {
                    row += ','.repeat(maxEntries);
                  }
                  csv += row + '\n';
                }
                // Download
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'detailed_doughflow.csv';
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }, 100);
              }}
            >
              Export Forecast
            </button>
          </div>

          <div className="mt-6">
            <h3 className="font-orbitron text-mgs-green text-sm mb-3 border-b border-mgs-gray pb-2">Operations Log</h3>
            <EntryList
              entries={entries}
              onDeleteEntry={handleDeleteEntry}
              onEditEntry={handleEditEntry}
              editingEntryId={editingEntry?.id}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              hiddenIds={hiddenIds}
              toggleVisibility={toggleVisibility}
            />
          </div>
        </div>

        {/* Right Panel - Forms */}
        <div className="w-full md:w-2/5 bg-opacity-30 border border-mgs-green p-2 sm:p-4 animate-fade-in">
          <h2 className="font-orbitron text-lg text-center mb-4 pb-2 border-b border-mgs-green">
            Intel Input Terminal
          </h2>

          <CsvImport onImport={handleCsvImport} />
          <div>
            <h3 className="font-orbitron text-sm text-center mb-2">
              Selected Date: {formatDateToMonthDayYear(selectedDate)}
            </h3>
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
            />
          </div>

          <div className="flex justify-center gap-6 mb-4 border-t border-b border-mgs-gray py-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="entryType"
                checked={entryType === "bill"}
                onChange={() => setEntryType("bill")}
                className="appearance-none w-5 h-5 border-2 border-mgs-gray rounded-full relative cursor-pointer checked:border-mgs-green before:content-[''] before:block before:absolute before:w-3 before:h-3 before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:bg-mgs-green before:scale-0 checked:before:scale-100 before:transition-transform"
              />
              <span className="text-mgs-lightgray text-xs uppercase ml-1 font-medium">
                Log Expenditure
              </span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="entryType"
                checked={entryType === "paycheck"}
                onChange={() => setEntryType("paycheck")}
                className="appearance-none w-5 h-5 border-2 border-mgs-gray rounded-full relative cursor-pointer checked:border-mgs-green before:content-[''] before:block before:absolute before:w-3 before:h-3 before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:bg-mgs-green before:scale-0 checked:before:scale-100 before:transition-transform"
              />
              <span className="text-mgs-lightgray text-xs uppercase ml-1 font-medium">
                Log Acquisition
              </span>
            </label>
            <PurchaseRadio checked={entryType === "purchase"} onChange={() => setEntryType("purchase")} />
          </div>

          {entryType === "bill" ? (
            <BillForm
              selectedDate={selectedDate}
              onSubmit={handleEntrySubmit}
            />
          ) : entryType === "paycheck" ? (
            <PaycheckForm
              selectedDate={selectedDate}
              onSubmit={handleEntrySubmit}
            />
          ) : (
            <PurchaseForm
              selectedDate={selectedDate}
              onSubmit={handleEntrySubmit}
            />
          )}
        </div>
      </div>

      <footer className="mt-8 py-4 border-t border-mgs-gray text-center text-xs text-mgs-lightgray">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span style={{ fontFamily: 'monospace', fontSize: 24, marginLeft: 24 }}>|‖‖‖‖‖|</span>
          <span style={{ color: '#7dd3fc', fontSize: 12 }}>
            built by <a href="https://breezblox.com" target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>BreezBlox</a>
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: 24, marginRight: 24 }}>|‖‖‖‖‖|</span>
        </div>

      </footer>
    </div>
  );
};

export default Index;
