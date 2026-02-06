
import { useState } from "react";
import { FinancialEntry } from "@/types";
import { formatDateToMonthDayYear, parseLocalDateString } from "@/utils/dateUtils";
import { Button } from "./ui/button";
import { Trash2, Edit, Eye, EyeOff } from "lucide-react";

import BillForm from "./BillForm";
import PaycheckForm from "./PaycheckForm";
import PurchaseForm from "./PurchaseForm";

interface EntryListProps {
  entries: FinancialEntry[];
  onDeleteEntry: (id: string) => void;
  onEditEntry: (entry: FinancialEntry) => void;
  editingEntryId?: string;
  onSaveEdit?: (updated: FinancialEntry) => void;
  onCancelEdit?: () => void;
  hiddenIds: string[];
  toggleVisibility: (id: string) => void;
  compact?: boolean;
}

const EntryList: React.FC<EntryListProps> = ({ entries, onDeleteEntry, onEditEntry, editingEntryId, onSaveEdit, onCancelEdit, hiddenIds, toggleVisibility, compact }) => {
  const [activeTab, setActiveTab] = useState<'bills' | 'paychecks' | 'all'>('all');

  // For log display, show all, but for graph/export, exclude hidden
  const filteredEntries =
    activeTab === 'all' ? entries :
      activeTab === 'bills' ? entries.filter(entry => entry.type === 'bill' || entry.type === 'purchase') :
        entries.filter(entry => entry.type === 'paycheck');

  // For graph/export, use only visible entries
  const visibleEntries = filteredEntries.filter(entry => !hiddenIds.includes(entry.id));

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex justify-center gap-1 mb-4 border-b border-mgs-gray pb-2">
        <button
          className={`px-3 py-1 text-sm font-orbitron ${activeTab === 'all' ? 'bg-mgs-green text-mgs-black' : 'bg-mgs-darkgray text-mgs-lightgray'}`}
          onClick={() => setActiveTab('all')}
        >
          {compact ? 'All' : 'All Entries'}
        </button>
        <button
          className={`px-3 py-1 text-sm font-orbitron ${activeTab === 'bills' ? 'bg-mgs-green text-mgs-black' : 'bg-mgs-darkgray text-mgs-lightgray'}`}
          onClick={() => setActiveTab('bills')}
        >
          {compact ? 'Exp.' : 'Expenditures'}
        </button>
        <button
          className={`px-3 py-1 text-sm font-orbitron ${activeTab === 'paychecks' ? 'bg-mgs-green text-mgs-black' : 'bg-mgs-darkgray text-mgs-lightgray'}`}
          onClick={() => setActiveTab('paychecks')}
        >
          {compact ? 'Inc.' : 'Acquisitions'}
        </button>
      </div>

      <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1">
        {filteredEntries.length === 0 ? (
          <div className="text-center text-mgs-lightgray py-4 border border-mgs-gray bg-mgs-darkgray/30">
            No entries found
          </div>
        ) : (
          filteredEntries.map(entry => (
            <div
              key={entry.id}
              className={`p-3 border ${entry.type === 'bill' ? 'border-mgs-red/50' : entry.type === 'purchase' ? 'border-yellow-400/50' : 'border-mgs-green/50'} bg-mgs-darkgray/30`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className={`font-orbitron text-sm ${entry.type === 'bill' ? 'text-mgs-red' : entry.type === 'purchase' ? 'text-yellow-400' : 'text-mgs-green'}`}>
                    {entry.name}
                  </div>
                  <div className="text-xs text-mgs-lightgray mt-1">
                    {entry.customDates && entry.customDates.length > 0 ? (
                      <>
                        {entry.customDates.map(dateStr => formatDateToMonthDayYear(parseLocalDateString(dateStr))).join(', ')}
                        {entry.frequency ? ` • ${entry.frequency}` : ''}
                      </>
                    ) : (
                      <>
                        {formatDateToMonthDayYear(typeof entry.date === 'string' ? parseLocalDateString(entry.date) : entry.date)} • {entry.frequency}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-none hover:bg-mgs-green/20"
                    onClick={() => toggleVisibility(entry.id)}
                    title={hiddenIds.includes(entry.id) ? 'Show in forecast' : 'Hide from forecast'}
                  >
                    {hiddenIds.includes(entry.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                  <div className={`font-orbitron mr-4 ${entry.type === 'bill' ? 'text-mgs-red' : entry.type === 'purchase' ? 'text-yellow-400' : 'text-mgs-green'}`}>
                    {entry.type === 'bill' || entry.type === 'purchase' ? '-' : '+'}{entry.amount.toFixed(2)}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-none hover:bg-mgs-green/20"
                    onClick={() => onDeleteEntry(entry.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-none hover:bg-mgs-green/20"
                    onClick={() => onEditEntry(entry)}
                    disabled={!!editingEntryId && editingEntryId !== entry.id}
                  >
                    <Edit size={16} />
                  </Button>
                </div>
              </div>
              {editingEntryId === entry.id && (
                <div className="mt-2">
                  {entry.type === 'bill' && (
                    <BillForm
                      initialValues={entry}
                      editMode={true}
                      onSave={(updated) => onSaveEdit && onSaveEdit(updated)}
                      onCancel={onCancelEdit}
                      selectedDate={new Date()}
                    />
                  )}
                  {entry.type === 'paycheck' && (
                    <PaycheckForm
                      initialValues={entry}
                      editMode={true}
                      onSave={(updated) => onSaveEdit && onSaveEdit(updated)}
                      onCancel={onCancelEdit}
                      selectedDate={new Date()}
                    />
                  )}
                  {entry.type === 'purchase' && (
                    <PurchaseForm
                      initialValues={entry}
                      editMode={true}
                      onSave={(updated) => onSaveEdit && onSaveEdit(updated)}
                      onCancel={onCancelEdit}
                      selectedDate={new Date()}
                    />
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EntryList;
