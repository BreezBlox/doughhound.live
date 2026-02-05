import { useState, useEffect } from "react";
import LineGraph, { IntervalType } from "@/components/LineGraph";
import { MONTH_OPTIONS } from "@/utils/monthOptions";
import Calendar from "@/components/Calendar";
// import BarGraph from "@/components/BarGraph"; // No longer used
import BillForm from "@/components/BillForm";
import CsvImport from "@/components/CsvImport";
import PaycheckForm from "@/components/PaycheckForm";
import EntryList from "@/components/EntryList";
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
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { OpsCard } from "@/components/ui/OpsCard";
import { Progress } from "@/components/ui/progress";

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
  const [selectedMonths, setSelectedMonths] = useState<number[]>([new Date().getMonth()]);

  const toggleVisibility = (id: string) => {
    setHiddenIds((prev) => prev.includes(id) ? prev.filter(hid => hid !== id) : [...prev, id]);
  };

  // Calculate reserves when entries or selectedDate change
  const visibleEntries = entries.filter(e => !hiddenIds.includes(e.id));

  useEffect(() => {
    // Always show 24 months of data, but start from the earliest entry date for true running balance
    let minEntryDate = visibleEntries.length > 0 ? visibleEntries.reduce((min, e) => e.date < min ? e.date : min, visibleEntries[0].date) : new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    minEntryDate = new Date(minEntryDate.getFullYear(), minEntryDate.getMonth(), 1); // snap to first of month
    const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 24, 0); // 24 months ahead

    const recurringEntries = calculateRecurringEntries(visibleEntries, minEntryDate, endDate);
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

  const handleCsvImport = (imported: FinancialEntry[]) => {
    setEntries(prev => [...prev, ...imported]);
  };

  const [editingEntry, setEditingEntry] = useState<FinancialEntry | null>(null);

  const handleDeleteEntry = async (id: string) => {
    setEntries(prevEntries => prevEntries.filter(entry => entry.id !== id));
    if (editingEntry && editingEntry.id === id) setEditingEntry(null);

    if (user?.sheetId && accessToken) {
      await sheetsService.deleteEntry({ accessToken, sheetId: user.sheetId }, id);
    }
  };

  const handleEditEntry = (entry: FinancialEntry) => setEditingEntry(entry);

  const handleSaveEdit = async (updated: FinancialEntry) => {
    setEntries(prevEntries => prevEntries.map(e => e.id === updated.id ? updated : e));
    setEditingEntry(null);

    if (user?.sheetId && accessToken) {
      await sheetsService.updateEntry({ accessToken, sheetId: user.sheetId }, updated);
    }
  };

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

  // Show loading state
  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary font-orbitron text-xl animate-pulse">
          LOADING INTEL...
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col h-full bg-background p-6 lg:p-10 gap-8">

          {/* Dashboard Header */}
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h2 className="font-orbitron font-bold text-xs text-primary tracking-[0.2em] mb-1">SECONDBRAIN</h2>
                <h1 className="font-orbitron text-3xl font-bold tracking-widest text-foreground">OPS DECK</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center px-4 py-2 rounded-full border border-primary/20 bg-background/50 backdrop-blur-sm gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">FOCUS: DEEP</span>
              </div>
              <div className="items-center px-4 py-2 rounded-full border border-primary/20 bg-background/50 backdrop-blur-sm gap-2 hidden md:flex">
                <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest text-amber-500">MODE: BUILD</span>
              </div>
              <button
                onClick={() => setShowOnboarding(true)}
                className="items-center px-4 py-2 rounded-full border border-primary bg-primary/10 hover:bg-primary/20 transition-colors gap-2 flex"
              >
                <span className="font-mono text-xs text-primary uppercase tracking-widest">OPERATOR: {user.name.split(' ')[0].toUpperCase()}</span>
              </button>
            </div>
          </header>

          <OnboardingDialog open={showOnboarding} onClose={() => setShowOnboarding(false)} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">

            {/* Left Column: Main Ops Card (Forecast) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <OpsCard
                title="DOUGH_HOUND_V1_(WEB_APP)"
                subtitle={`CLIENT: ${user.name.toUpperCase()} // FOCUS: FINANCIAL FORECAST + RUNWAY`}
                className="flex-1 flex flex-col"
              >
                <div className="flex gap-8 mb-8 border-b border-border/50 pb-8">
                  <div>
                    <span className="font-mono text-xs text-muted-foreground tracking-widest block mb-1">CURRENT BALANCE</span>
                    <span className="font-orbitron text-4xl text-primary font-bold">
                      ${reserves.length > 0 ? reserves[0].reserve.toFixed(2) : '0.00'}
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-xs text-muted-foreground tracking-widest block mb-1">ENTRIES</span>
                    <span className="font-orbitron text-4xl text-amber-500 font-bold">{entries.length}</span>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex justify-between items-end mb-2">
                    <span className="font-mono text-xs text-muted-foreground tracking-widest">MOMENTUM</span>
                    <span className="font-mono text-xs text-primary">100%</span>
                  </div>
                  <Progress value={100} className="h-2 bg-secondary" indicatorClassName="bg-gradient-to-r from-primary to-amber-500" />
                </div>

                <div className="flex-1 w-full min-h-[300px]">
                  {/* Month Selection */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {MONTH_OPTIONS.map(opt => (
                      <label key={opt.value} className={`px-2 py-1 rounded text-[10px] font-orbitron border cursor-pointer transition-colors ${selectedMonths.includes(opt.value) ? 'bg-primary text-background border-primary' : 'bg-transparent text-muted-foreground border-border hover:border-primary/50'}`}>
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
                          className="hidden"
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>

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
              </OpsCard>
            </div>

            {/* Right Column: Next Up & Daily Loop */}
            <div className="flex flex-col gap-6">

              {/* Next Up (Intel Input) */}
              <OpsCard title="INTEL INPUT" subtitle="LOG ACQUISITION / EXPENDITURE" className="h-auto">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-orbitron text-xs text-muted-foreground">SELECTED DATE</h4>
                  <span className="font-mono text-xs text-primary">{formatDateToMonthDayYear(selectedDate)}</span>
                </div>

                <div className="bg-background/50 rounded-lg p-2 mb-4 border border-border">
                  <Calendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
                </div>

                <div className="flex justify-center gap-2 mb-4 bg-background/50 p-2 rounded-lg">
                  <button
                    onClick={() => setEntryType("bill")}
                    className={`flex-1 py-2 text-xs font-orbitron rounded transition-colors ${entryType === 'bill' ? 'bg-primary text-background' : 'text-muted-foreground hover:bg-secondary'}`}
                  >
                    BILL
                  </button>
                  <button
                    onClick={() => setEntryType("paycheck")}
                    className={`flex-1 py-2 text-xs font-orbitron rounded transition-colors ${entryType === 'paycheck' ? 'bg-primary text-background' : 'text-muted-foreground hover:bg-secondary'}`}
                  >
                    PAYCHECK
                  </button>
                  <button
                    onClick={() => setEntryType("purchase")}
                    className={`flex-1 py-2 text-xs font-orbitron rounded transition-colors ${entryType === 'purchase' ? 'bg-primary text-background' : 'text-muted-foreground hover:bg-secondary'}`}
                  >
                    PURCHASE
                  </button>
                </div>

                <div className="space-y-4">
                  {entryType === "bill" ? (
                    <BillForm selectedDate={selectedDate} onSubmit={handleEntrySubmit} />
                  ) : entryType === "paycheck" ? (
                    <PaycheckForm selectedDate={selectedDate} onSubmit={handleEntrySubmit} />
                  ) : (
                    <PurchaseForm selectedDate={selectedDate} onSubmit={handleEntrySubmit} />
                  )}
                </div>
              </OpsCard>

              {/* Daily Loop (Operations Log) */}
              <OpsCard title="DAILY LOOP" subtitle="OPERATIONS LOG" className="flex-1">
                <div className="h-[300px] overflow-auto pr-2">
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
              </OpsCard>

            </div>
          </div>

          <footer className="text-center text-[10px] text-muted-foreground font-mono opacity-50">
            SYSTEM STATUS: OPERATIONAL // V1.0.0
          </footer>

        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Index;
