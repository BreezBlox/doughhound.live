
import { useState, FormEvent, useId } from "react";
import { EntryType, FinancialEntry, Frequency } from "@/types";
import { formatDateToYYYYMMDD, parseLocalDateString } from "@/utils/dateUtils";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import MultiDateCalendar from "./ui/MultiDateCalendar";

interface BillFormProps {
  selectedDate: Date;
  onSubmit?: (entry: Omit<FinancialEntry, "id">) => void;
  initialValues?: FinancialEntry;
  editMode?: boolean;
  onSave?: (entry: FinancialEntry) => void;
  onCancel?: () => void;
}

const BillForm: React.FC<BillFormProps> = ({
  selectedDate,
  onSubmit,
  initialValues,
  editMode,
  onSave,
  onCancel,
}) => {
  const formId = useId();
  const [billName, setBillName] = useState(initialValues ? initialValues.name : "");
  const [billAmount, setBillAmount] = useState<number | "">(initialValues ? initialValues.amount : "");
  const [billDueDate, setBillDueDate] = useState(
    initialValues ? formatDateToYYYYMMDD(new Date(initialValues.date)) : formatDateToYYYYMMDD(selectedDate)
  );
  const [billFrequency, setBillFrequency] = useState<Frequency>(
    initialValues ? initialValues.frequency : "monthly"
  );
  const [useLimitType, setUseLimitType] = useState<"none" | "occurrences" | "date">(
    initialValues && initialValues.occurrenceLimit
      ? "occurrences"
      : initialValues && initialValues.stopDate
      ? "date"
      : "none"
  );
  const [occurrenceLimit, setOccurrenceLimit] = useState<number | "">(
    initialValues && initialValues.occurrenceLimit ? initialValues.occurrenceLimit : ""
  );
  const [stopDate, setStopDate] = useState<string>(
    initialValues && initialValues.stopDate ? formatDateToYYYYMMDD(new Date(initialValues.stopDate)) : ""
  );
  const [customDates, setCustomDates] = useState<string[]>(
    initialValues && initialValues.customDates ? initialValues.customDates : []
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!billName || billAmount === "") {
      // TODO: Add proper validation
      return;
    }

    const entry: FinancialEntry = {
      id: initialValues?.id || "",
      type: "bill" as EntryType,
      name: billName,
      amount: typeof billAmount === "number" ? billAmount : parseFloat(String(billAmount)),
      date: parseLocalDateString(billDueDate),
      frequency: billFrequency,
    };

    if (useLimitType === "occurrences" && occurrenceLimit !== "") {
      entry.occurrenceLimit = occurrenceLimit;
      delete entry.stopDate;
    } else if (useLimitType === "date" && stopDate) {
      entry.stopDate = parseLocalDateString(stopDate);
      delete entry.occurrenceLimit;
    } else {
      delete entry.occurrenceLimit;
      delete entry.stopDate;
    }
    if (customDates.length > 0) {
      entry.customDates = customDates;
    } else {
      delete entry.customDates;
    }
    if (editMode && onSave) {
      onSave(entry);
    } else if (onSubmit) {
      onSubmit(entry);
      // Reset form when adding
      setBillName("");
      setBillAmount("");
      setBillDueDate(formatDateToYYYYMMDD(selectedDate));
      setBillFrequency("monthly");
      setUseLimitType("none");
      setOccurrenceLimit("");
      setStopDate("");
    }
  };

  return (
    <form id={`bill-form-${formId}`} className="space-y-3" onSubmit={handleSubmit}>
      <div>
        <label htmlFor={`billName-${formId}`} className="font-medium uppercase text-sm text-mgs-lightgray block mb-1">
          Expenditure ID:
        </label>
        <Input
          id={`billName-${formId}`}
          value={billName}
          onChange={(e) => setBillName(e.target.value)}
          placeholder="e.g., Utility Grid Payment"
          className="font-roboto-mono bg-mgs-darkgray border-mgs-gray text-mgs-lightertext placeholder:text-mgs-lightgray/50 rounded-none"
        />
      </div>
      
      <div>
        <label htmlFor={`billAmount-${formId}`} className="font-medium uppercase text-sm text-mgs-lightgray block mb-1">
          Amount:
        </label>
        <Input
          id={`billAmount-${formId}`}
          type="number"
          step="0.01"
          value={billAmount}
          onChange={(e) => setBillAmount(e.target.value ? parseFloat(e.target.value) : "")}
          placeholder="e.g., 45.50"
          className="font-roboto-mono bg-mgs-darkgray border-mgs-gray text-mgs-lightertext placeholder:text-mgs-lightgray/50 rounded-none"
        />
      </div>
      
      <div>
        <label htmlFor={`billDueDate-${formId}`} className="font-medium uppercase text-sm text-mgs-lightgray block mb-1">
          Due Date:
        </label>
        <Input
          id={`billDueDate-${formId}`}
          type="date"
          value={billDueDate}
          onChange={(e) => setBillDueDate(e.target.value)}
          className="font-roboto-mono bg-mgs-darkgray border-mgs-gray text-mgs-lightertext rounded-none"
        />
      </div>
      
      <div>
        <label htmlFor={`billFrequency-${formId}`} className="font-medium uppercase text-sm text-mgs-lightgray block mb-1">
          Frequency Protocol:
        </label>
        <select
          id={`billFrequency-${formId}`}
          value={billFrequency}
          onChange={(e) => setBillFrequency(e.target.value as Frequency)}
          className="w-full font-roboto-mono bg-mgs-darkgray border-mgs-gray text-mgs-lightertext py-2 px-3 rounded-none"
        >
          <option value="weekly">Weekly</option>
          <option value="bi-weekly">Bi-Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="one-time">One-Time</option>
        </select>
      </div>
      
      <div className="space-y-1">
        <label className="font-medium uppercase text-sm text-mgs-lightgray block mb-1">
          Termination Protocol:
        </label>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id={`noLimit-${formId}`}
              name={`limitType-${formId}`}
              checked={useLimitType === "none"}
              onChange={() => setUseLimitType("none")}
              className="accent-mgs-green"
            />
            <label htmlFor={`noLimit-${formId}`} className="text-mgs-lightertext">
              No Limit
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id={`limitOccurrences-${formId}`}
              name={`limitType-${formId}`}
              checked={useLimitType === "occurrences"}
              onChange={() => setUseLimitType("occurrences")}
              className="accent-mgs-green"
            />
            <label htmlFor={`limitOccurrences-${formId}`} className="text-mgs-lightertext">
              Limit Occurrences
            </label>
          </div>
          
          {useLimitType === "occurrences" && (
            <div className="ml-6">
              <Input
                id={`occurrenceLimit-${formId}`}
                type="number"
                min="1"
                value={occurrenceLimit}
                onChange={(e) => setOccurrenceLimit(e.target.value ? parseInt(e.target.value) : "")}
                placeholder="Number of occurrences"
                className="font-roboto-mono bg-mgs-darkgray border-mgs-gray text-mgs-lightertext placeholder:text-mgs-lightgray/50 rounded-none"
              />
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id={`stopDate-${formId}`}
              name={`limitType-${formId}`}
              checked={useLimitType === "date"}
              onChange={() => setUseLimitType("date")}
              className="accent-mgs-green"
            />
            <label htmlFor={`stopDate-${formId}`} className="text-mgs-lightertext">
              Stop Date
            </label>
          </div>
          
          {useLimitType === "date" && (
            <div className="ml-6">
              <Input
                id={`billStopDate-${formId}`}
                type="date"
                value={stopDate}
                onChange={(e) => setStopDate(e.target.value)}
                className="font-roboto-mono bg-mgs-darkgray border-mgs-gray text-mgs-lightertext rounded-none"
              />
            </div>
          )}
        </div>
      </div>
      
      <div>
        <label className="font-medium uppercase text-sm text-mgs-lightgray block mb-1">
          Custom Dates (optional):
        </label>
        <div className="mb-2">
          <MultiDateCalendar selectedDates={customDates} onChange={setCustomDates} />
        </div>
        {customDates.length > 0 && (
          <div className="text-xs text-mgs-lightertext mt-1">
            Selected Dates: {customDates.sort().join(', ')}
          </div>
        )}
      </div>
      {editMode ? (
        <div className="flex gap-2">
          <Button
            type="button"
            className="flex-1 font-orbitron bg-mgs-green text-mgs-black rounded-none hover:bg-mgs-darkgreen"
            onClick={handleSubmit}
          >
            Save
          </Button>
          <Button
            type="button"
            className="flex-1 font-orbitron bg-mgs-gray text-mgs-black rounded-none hover:bg-mgs-darkgray"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          type="submit"
          className="w-full font-orbitron bg-mgs-green hover:bg-mgs-darkgreen text-mgs-black uppercase tracking-wider rounded-none border border-mgs-green mt-4"
        >
          Transmit Log
        </Button>
      )}
    </form>
  );
};

export default BillForm;
