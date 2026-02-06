import { useState, useEffect } from "react";
import { toast } from "sonner";
import LineGraph, { IntervalType } from "@/components/LineGraph";
import { MONTH_OPTIONS } from "@/utils/monthOptions";
import { useAuth } from "@/auth/AuthContext";
import { FinancialEntry, EntryType, DailyReserve, DashboardConfig } from "@/types";
import { calculateRecurringEntries, calculateDailyReserves, formatDateToMonthDayYear, formatDateToYYYYMMDD, parseLocalDateString } from "@/utils/dateUtils";
import { v4 as uuidv4 } from "uuid";
import * as sheetsService from "@/services/sheetsService";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CalendarIcon, Edit2, Loader2, Plus, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import OnboardingDialog from "@/components/OnboardingDialog";
import SheetSetup from "@/components/SheetSetup";

const Index = () => {
  const { user, accessToken, logout } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Data State
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [reserves, setReserves] = useState<DailyReserve[]>([]);
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>({ startDate: null, startBalance: 0 });
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // UI State
  const [showReconcileDialog, setShowReconcileDialog] = useState(false);
  const [reconcileBalance, setReconcileBalance] = useState<string>("");
  const [chartRange, setChartRange] = useState<"1M" | "2M" | "3M" | "ALL">("3M");

  // Form State
  const [formType, setFormType] = useState<"expense" | "paycheck">("expense");
  const [formData, setFormData] = useState({
    date: formatDateToYYYYMMDD(new Date()),
    description: "",
    amount: "",
    frequency: "one-time" as const,
    limit: ""
  });

  // Entry Management State (Moved Up)
  const [editingEntry, setEditingEntry] = useState<FinancialEntry | null>(null);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);

  // Calculate Reserves Effect
  useEffect(() => {
    // 1. Determine Start Date (Anchor)
    let calculationStartDate: Date;
    if (dashboardConfig.startDate) {
      calculationStartDate = new Date(dashboardConfig.startDate);
    } else {
      calculationStartDate = new Date();
      calculationStartDate.setDate(1); // Default to 1st of current month
    }

    // 2. Determine End Date (24 months out approx)
    const endDate = new Date(calculationStartDate);
    endDate.setMonth(endDate.getMonth() + 24);

    // 3. Expand Recurring Entries
    const recurringEntries = calculateRecurringEntries(entries, calculationStartDate, endDate);

    // 4. Calculate Daily Balance (Raw)
    const dailyReservesRaw = calculateDailyReserves(recurringEntries, calculationStartDate, endDate);

    // 5. Apply Start Balance Offset
    const dailyReserves = dailyReservesRaw.map(dr => ({
      ...dr,
      reserve: dr.reserve + (dashboardConfig.startBalance || 0)
    }));

    setReserves(dailyReserves);
  }, [entries, dashboardConfig]);

  // Load Data Effect
  useEffect(() => {
    const loadData = async () => {
      if (user?.sheetId && accessToken) {
        setIsLoadingData(true);
        try {
          const [loadedEntries, loadedConfig] = await Promise.all([
            sheetsService.fetchEntries({ accessToken, sheetId: user.sheetId }),
            sheetsService.fetchDashboardSettings({ accessToken, sheetId: user.sheetId })
          ]);
          setEntries(loadedEntries);
          setDashboardConfig(loadedConfig);
        } catch (error) {
          if (error instanceof sheetsService.AuthError) {
            console.warn("Session expired during load:", error);
            logout(); // Force logout to clear invalid state
          } else {
            console.error('Failed to load data:', error);
          }
        } finally {
          setIsLoadingData(false);
        }
      } else {
        setIsLoadingData(false);
      }
    };
    loadData();
  }, [user?.sheetId, accessToken]);

  // Handlers
  const handleReconcile = async () => {
    const newBalance = parseFloat(reconcileBalance);
    if (isNaN(newBalance)) return;

    const newConfig: DashboardConfig = {
      startDate: new Date(),
      startBalance: newBalance
    };

    setDashboardConfig(newConfig);
    setShowReconcileDialog(false);

    if (user?.sheetId && accessToken) {
      try {
        await sheetsService.updateDashboardSettings({ accessToken, sheetId: user.sheetId }, newConfig);
      } catch (error) {
        if (error instanceof sheetsService.AuthError) {
          toast.error("Session expired");
          logout();
        } else {
          toast.error("Failed to sync settings");
        }
      }
    }
  };

  const handleAddTransaction = async () => {
    if (!formData.description || !formData.amount) return;

    const newEntry: FinancialEntry = {
      id: uuidv4(),
      type: formType === 'expense' ? 'bill' : 'paycheck', // simplified mapping
      name: formData.description,
      amount: parseFloat(formData.amount),
      date: parseLocalDateString(formData.date),
      frequency: formData.frequency,
      occurrenceLimit: formData.limit ? parseInt(formData.limit) : undefined
    };

    // Optimistic Update
    setEntries(prev => [...prev, newEntry]);

    // Reset Form
    setFormData(prev => ({ ...prev, description: "", amount: "", limit: "" }));

    // Persist
    if (user?.sheetId && accessToken) {
      setIsSaving(true);
      try {
        const success = await sheetsService.saveEntry({ accessToken, sheetId: user.sheetId }, newEntry);
        if (!success) {
          // Rollback on generic failure
          setEntries(prev => prev.filter(e => e.id !== newEntry.id));
          toast.error("Failed to save transaction");
        }
      } catch (error) {
        // Rollback on error
        setEntries(prev => prev.filter(e => e.id !== newEntry.id));

        if (error instanceof sheetsService.AuthError) {
          toast.error("Session expired. Please login again.");
          logout();
        } else {
          console.error("Save error:", error);
          toast.error("Failed to save transaction");
        }
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Filter Chart Data based on Range
  const getChartData = () => {
    const now = new Date();
    let monthsToAdd = 3;
    if (chartRange === "1M") monthsToAdd = 1;
    if (chartRange === "2M") monthsToAdd = 2;
    if (chartRange === "ALL") monthsToAdd = 24;

    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + monthsToAdd);

    return reserves.filter(r => r.date >= now && r.date <= endDate);
  };

  // Insights
  const getLowestBalance = () => {
    const next30Days = reserves.filter(r => {
      const diffTime = r.date.getTime() - new Date().getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 30;
    });
    if (next30Days.length === 0) return null;

    return next30Days.reduce((min, curr) => curr.reserve < min.reserve ? curr : min, next30Days[0]);
  };
  const lowest = getLowestBalance();

  const getUpcomingDays = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return reserves.filter(r => r.date >= today).slice(0, 10);
  };


  // Entry Handlers
  const handleEditEntry = (entry: FinancialEntry) => setEditingEntry(entry);
  const handleCancelEdit = () => setEditingEntry(null);
  const handleSaveEdit = async (updated: FinancialEntry) => {
    const originalEntry = entries.find(e => e.id === updated.id);

    // Optimistic update
    setEntries(prev => prev.map(e => e.id === updated.id ? updated : e));
    setEditingEntry(null);

    if (user?.sheetId && accessToken) {
      try {
        const success = await sheetsService.updateEntry({ accessToken, sheetId: user.sheetId }, updated);
        if (!success && originalEntry) {
          // Rollback
          setEntries(prev => prev.map(e => e.id === updated.id ? originalEntry : e));
          toast.error("Failed to update transaction");
        }
      } catch (error) {
        // Rollback
        if (originalEntry) {
          setEntries(prev => prev.map(e => e.id === updated.id ? originalEntry : e));
        }

        if (error instanceof sheetsService.AuthError) {
          toast.error("Session expired. Please login again.");
          logout();
        } else {
          toast.error("Failed to update transaction");
        }
      }
    }
  };
  const handleDeleteEntry = async (id: string) => {
    const entryToDelete = entries.find(e => e.id === id);

    // Optimistic delete
    setEntries(prevEntries => prevEntries.filter(entry => entry.id !== id));
    if (editingEntry && editingEntry.id === id) setEditingEntry(null);

    if (user?.sheetId && accessToken) {
      try {
        const success = await sheetsService.deleteEntry({ accessToken, sheetId: user.sheetId }, id);
        if (!success && entryToDelete) {
          // Rollback
          setEntries(prev => [...prev, entryToDelete]);
          toast.error("Failed to delete transaction");
        }
      } catch (error) {
        // Rollback
        if (entryToDelete) {
          setEntries(prev => [...prev, entryToDelete]);
        }

        if (error instanceof sheetsService.AuthError) {
          toast.error("Session expired. Please login again.");
          logout();
        } else {
          toast.error("Failed to delete transaction");
        }
      }
    }
  };

  const toggleVisibility = (id: string) => {
    setHiddenIds(prev => prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]);
  };

  if (isLoadingData) return <div className="min-h-screen bg-ops-bg flex items-center justify-center text-ops-accent animate-pulse">Initializing Ops Deck...</div>;

  // If user has no sheet connected, show the setup screen
  if (!user?.sheetId) {
    return <SheetSetup onComplete={() => window.location.reload()} />;
  }

  return (
    <SidebarProvider>
      <AppSidebar
        entries={entries}
        onDeleteEntry={handleDeleteEntry}
        onEditEntry={handleEditEntry}
        editingEntryId={editingEntry?.id}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
        hiddenIds={hiddenIds}
        toggleVisibility={toggleVisibility}
      />
      <SidebarInset>
        <div className="flex flex-col h-full bg-ops-bg text-ops-text p-4 lg:p-8 gap-6 overflow-y-auto relative">

          {/* Custom Sidebar Toggle "Tab" */}
          <div className="absolute top-4 left-4 z-50 md:hidden">
            <SidebarTrigger className="bg-ops-accent text-ops-bg p-2 rounded-r-md shadow-lg" />
          </div>
          <div className="hidden md:block absolute top-1/2 -left-3 z-50">
            <SidebarTrigger className="bg-ops-accent text-ops-bg p-2 h-12 w-6 rounded-r-md shadow-[0_0_15px_rgba(14,165,233,0.3)] hover:w-8 transition-all flex items-center justify-center cursor-pointer border border-l-0 border-ops-accent" />
          </div>

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-end items-end border-b border-ops-border pb-6 gap-8">
            <div className="text-right">
              <h1 className="text-3xl font-orbitron font-bold text-ops-accent mb-1 tracking-wider">Dough Hound</h1>
              <p className="text-ops-dim font-mono text-sm">Reserve Balance Forecaster</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-[10px] font-mono text-ops-dim uppercase tracking-widest mb-1">Current Reserve</div>
                <div className="flex items-center justify-end gap-2 group cursor-pointer" onClick={() => setShowReconcileDialog(true)}>
                  <span className="text-3xl font-orbitron font-bold text-white group-hover:text-ops-accent transition-colors">
                    ${(() => {
                      // Find reserve for TODAY
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const todayReserve = reserves.find(r => r.date.getTime() === today.getTime());
                      // Fallback to first if not found (e.g. range starts in future?), or 0
                      return (todayReserve?.reserve ?? reserves[0]?.reserve ?? 0).toFixed(2);
                    })()}
                  </span>
                  <Edit2 size={14} className="text-ops-dim group-hover:text-ops-accent" />
                </div>
                <div className="text-[10px] text-right text-ops-accent cursor-pointer hover:underline mt-1" onClick={() => setShowReconcileDialog(true)}>Sync to Today</div>
              </div>
              <Button className="hidden md:flex bg-ops-accent hover:bg-teal-400 text-ops-bg font-bold font-mono text-xs items-center gap-2" onClick={() => document.getElementById('transaction-form')?.scrollIntoView({ behavior: 'smooth' })}>
                <Plus size={16} /> QUICK ADD EXPENSE
              </Button>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LEFT COLUMN (Chart & Schedule) */}
            <div className="lg:col-span-2 space-y-6">

              {/* Projection Chart */}
              <Card className="bg-ops-card border-ops-border shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-orbitron text-white">Projection</CardTitle>
                  <Tabs defaultValue="3M" className="w-auto" onValueChange={(v) => setChartRange(v as any)}>
                    <TabsList className="bg-ops-panel h-8 border border-ops-border">
                      <TabsTrigger value="1M" className="text-xs font-mono data-[state=active]:bg-ops-accent data-[state=active]:text-ops-bg h-6">1M</TabsTrigger>
                      <TabsTrigger value="2M" className="text-xs font-mono data-[state=active]:bg-ops-accent data-[state=active]:text-ops-bg h-6">2M</TabsTrigger>
                      <TabsTrigger value="3M" className="text-xs font-mono data-[state=active]:bg-ops-accent data-[state=active]:text-ops-bg h-6">3M</TabsTrigger>
                      <TabsTrigger value="ALL" className="text-xs font-mono data-[state=active]:bg-ops-accent data-[state=active]:text-ops-bg h-6">All</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full mt-4">
                    <LineGraph
                      data={getChartData()}
                      interval={chartRange === 'ALL' ? 'monthly' : 'custom'}
                      selectedDate={new Date()}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Schedule */}
              <div className="space-y-4">
                <h3 className="font-orbitron text-sm text-ops-dim uppercase tracking-widest pl-1">Upcoming 10 Days</h3>
                <div className="bg-ops-card border border-ops-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm font-mono">
                    <thead>
                      <tr className="bg-ops-panel/50 text-ops-dim text-xs uppercase text-left">
                        <th className="p-3 font-normal">Date</th>
                        <th className="p-3 font-normal">Net (+/-)</th>
                        <th className="p-3 font-normal">Balance</th>
                        <th className="p-3 font-normal">Events</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ops-border/30">
                      {getUpcomingDays().map((day, i) => {
                        // Calculate simple net for display (this day only)
                        const dayTotal = day.entries.reduce((acc, e) => {
                          return e.type === 'paycheck' ? acc + e.amount : acc - e.amount;
                        }, 0);

                        const entryNames = day.entries.map(e => {
                          const sign = e.type === 'paycheck' ? '+' : '-'; // Simplify display
                          return `${e.name} (${sign}${e.amount})`;
                        }).join(', ');

                        return (
                          <tr key={i} className="hover:bg-ops-panel/30 transition-colors group">
                            <td className="p-3 text-ops-dim">{formatDateToYYYYMMDD(day.date)}</td>
                            <td className={cn("p-3 font-bold", dayTotal > 0 ? "text-ops-success" : dayTotal < 0 ? "text-ops-danger" : "text-ops-dim")}>
                              {dayTotal > 0 ? "+" : ""}{dayTotal === 0 ? "0.00" : dayTotal.toFixed(2)}
                            </td>
                            <td className="p-3 text-white font-bold">${day.reserve.toFixed(2)}</td>
                            <td className="p-3 text-ops-dim text-xs truncate max-w-[200px]" title={entryNames}>
                              {entryNames || "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN (Form & Insights) */}
            <div className="space-y-6">

              {/* Add Transaction Form */}
              <Card className="bg-ops-card border-ops-border shadow-lg" id="transaction-form">
                <CardHeader>
                  <CardTitle className="text-ops-accent font-orbitron text-lg">Add Transaction</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Type Toggle */}
                  <div className="grid grid-cols-2 gap-2 bg-ops-panel p-1 rounded-md">
                    <button
                      onClick={() => setFormType('expense')}
                      className={cn("py-2 text-sm font-bold rounded transition-all", formType === 'expense' ? "bg-ops-danger text-white shadow" : "text-ops-dim hover:text-white")}
                    >
                      Expense
                    </button>
                    <button
                      onClick={() => setFormType('paycheck')}
                      className={cn("py-2 text-sm font-bold rounded transition-all", formType === 'paycheck' ? "bg-ops-panel text-white shadow border border-ops-border" : "text-ops-dim hover:text-white")} // Using simplified style for inactive/active check
                    >
                      Paycheck
                    </button>
                  </div>

                  {/* Date */}
                  <div className="space-y-1">
                    <Label className="text-[10px] font-mono text-ops-dim uppercase">Date</Label>
                    <div className="relative">
                      <Input
                        type="date"
                        className="bg-ops-panel border-ops-border text-white font-mono pl-10"
                        value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                      />
                      <CalendarIcon size={14} className="absolute left-3 top-3 text-ops-dim" />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <Label className="text-[10px] font-mono text-ops-dim uppercase">Description</Label>
                    <Input
                      type="text"
                      className="bg-ops-panel border-ops-border text-white placeholder:text-ops-dim/30"
                      placeholder="e.g. Grocery Run"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  {/* Amount & Frequency */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono text-ops-dim uppercase">Amount</Label>
                      <Input
                        type="number"
                        className="bg-ops-panel border-ops-border text-white"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-mono text-ops-dim uppercase">Frequency</Label>
                      <Select value={formData.frequency} onValueChange={(v: any) => setFormData({ ...formData, frequency: v })}>
                        <SelectTrigger className="bg-ops-panel border-ops-border text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-ops-card border-ops-border text-white">
                          <SelectItem value="one-time">One-Time</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="every-4-weeks">Every 4 Weeks</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Limit */}
                  {formData.frequency !== 'one-time' && (
                    <div className="space-y-1 animate-accordion-down">
                      <Label className="text-[10px] font-mono text-ops-dim uppercase">Limit (Optional)</Label>
                      <Input
                        type="number"
                        className="bg-ops-panel border-ops-border text-white placeholder:text-ops-dim/30"
                        placeholder="e.g. 6 payments left"
                        value={formData.limit}
                        onChange={e => setFormData({ ...formData, limit: e.target.value })}
                      />
                      <p className="text-[10px] text-ops-dim">Leave empty for indefinite.</p>
                    </div>
                  )}

                  <Button
                    className={cn("w-full font-bold", formType === 'expense' ? "bg-ops-danger hover:bg-red-600" : "bg-ops-success hover:bg-green-600")}
                    onClick={handleAddTransaction}
                    disabled={isSaving}
                  >
                    {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                    {formType === 'expense' ? 'Add Expense' : 'Add Paycheck'}
                  </Button>

                </CardContent>
              </Card>

              {/* Insight Card */}
              <Card className="bg-ops-card border-ops-border shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-mono text-ops-dim uppercase tracking-widest">Insight</CardTitle>
                </CardHeader>
                <CardContent>
                  {lowest ? (
                    <div>
                      <p className="text-sm text-ops-text">
                        Lowest projected balance is <span className="text-ops-danger font-bold">${lowest.reserve.toFixed(2)}</span> on <span className="text-white">{formatDateToYYYYMMDD(lowest.date)}</span>.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-ops-dim">Not enough data to project lows.</p>
                  )}
                </CardContent>
              </Card>

            </div>
          </div>

          <OnboardingDialog open={showOnboarding} onClose={() => setShowOnboarding(false)} />

          {/* Reconcile Dialog */}
          <Dialog open={showReconcileDialog} onOpenChange={setShowReconcileDialog}>
            <DialogContent className="bg-ops-card border-ops-accent text-white font-mono">
              <DialogHeader>
                <DialogTitle className="font-orbitron text-ops-accent">SYNC ANCHOR POINT</DialogTitle>
                <DialogDescription className="sr-only">
                  Set your current bank balance to anchor future forecasts.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <p className="text-xs text-ops-dim">
                  Set the actual bank balance for TODAY ({formatDateToMonthDayYear(new Date())}).
                  This will anchor your forecast from this point forward.
                </p>
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="balance" className="text-ops-dim">Current Reserve Balance</Label>
                  <Input
                    id="balance"
                    type="number"
                    placeholder="0.00"
                    value={reconcileBalance}
                    onChange={(e) => setReconcileBalance(e.target.value)}
                    className="font-mono text-lg bg-ops-panel border-ops-accent focus:ring-ops-accent text-white"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setShowReconcileDialog(false)} className="text-ops-dim hover:text-white hover:bg-ops-panel">CANCEL</Button>
                <Button onClick={handleReconcile} className="bg-ops-accent text-ops-bg hover:bg-teal-400 font-orbitron font-bold">SYNC & LOCK</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Index;
