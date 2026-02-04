import { useState, FormEvent, useId } from "react";
import { FinancialEntry, Frequency } from "@/types";
import { formatDateToYYYYMMDD, parseLocalDateString } from "@/utils/dateUtils";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import MultiDateCalendar from "./ui/MultiDateCalendar";

const FREQUENCY_OPTIONS: Frequency[] = [
  "weekly",
  "bi-weekly",
  "monthly",
  "one-time"
];

interface PurchaseFormProps {
  selectedDate: Date;
  onSubmit?: (entry: Omit<FinancialEntry, "id">) => void;
  initialValues?: FinancialEntry;
  editMode?: boolean;
  onSave?: (entry: FinancialEntry) => void;
  onCancel?: () => void;
}

const PurchaseForm: React.FC<PurchaseFormProps> = ({
  selectedDate,
  onSubmit,
  initialValues,
  editMode,
  onSave,
  onCancel,
}) => {
  const formId = useId();
  const [purchaseName, setPurchaseName] = useState(initialValues ? initialValues.name : "");
  const [purchaseAmount, setPurchaseAmount] = useState<number | "">(initialValues ? initialValues.amount : "");
  const [purchaseDate, setPurchaseDate] = useState(
    initialValues ? formatDateToYYYYMMDD(new Date(initialValues.date)) : formatDateToYYYYMMDD(selectedDate)
  );
  const [purchaseFrequency, setPurchaseFrequency] = useState<Frequency>(
    initialValues ? initialValues.frequency : "one-time"
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

    if (!purchaseName || purchaseAmount === "") {
      // TODO: Add proper validation
      return;
    }

    const entry: FinancialEntry = {
      id: initialValues?.id || "",
      type: "purchase" as EntryType,
      name: purchaseName,
      amount: typeof purchaseAmount === "number" ? purchaseAmount : parseFloat(String(purchaseAmount)),
      date: parseLocalDateString(purchaseDate),
      frequency: purchaseFrequency,
      ...(customDates.length > 0 && { customDates }),
    };

    if (useLimitType === "occurrences" && occurrenceLimit !== "") {
      entry.occurrenceLimit = occurrenceLimit;
    } else if (useLimitType === "date" && stopDate) {
      entry.stopDate = parseLocalDateString(stopDate);
    }

    if (editMode && onSave) {
      onSave(entry);
    } else if (onSubmit) {
      onSubmit(entry);
      // Reset form when adding
      setPurchaseName("");
      setPurchaseAmount("");
      setPurchaseDate(formatDateToYYYYMMDD(selectedDate));
      setPurchaseFrequency("one-time");
      setUseLimitType("none");
      setOccurrenceLimit("");
      setStopDate("");
      setCustomDates([]);
    }
  };

  return (
    <form id={`purchase-form-${formId}`} className="space-y-3" onSubmit={handleSubmit}>
      <div>
        <label htmlFor={`purchaseName-${formId}`} className="font-medium uppercase text-sm text-mgs-lightgray block mb-1">
          Purchase ID:
        </label>
        <Input
          id={`purchaseName-${formId}`}
          value={purchaseName}
          onChange={e => setPurchaseName(e.target.value)}
          placeholder="e.g., Gasoline, Groceries, Nicotine, Weed"
          className="font-roboto-mono bg-mgs-darkgray border-mgs-gray text-mgs-lightertext placeholder:text-mgs-lightgray/50 rounded-none"
          required
        />
      </div>
      <div>
        <label htmlFor={`purchaseAmount-${formId}`} className="font-medium uppercase text-sm text-mgs-lightgray block mb-1">
          Amount:
        </label>
        <Input
          id={`purchaseAmount-${formId}`}
          type="number"
          step="0.01"
          value={purchaseAmount}
          onChange={e => setPurchaseAmount(e.target.value ? parseFloat(e.target.value) : "")}
          placeholder="e.g., 45.50"
          className="font-roboto-mono bg-mgs-darkgray border-mgs-gray text-mgs-lightertext placeholder:text-mgs-lightgray/50 rounded-none"
          required
        />
      </div>
      <div>
        <label htmlFor={`purchaseDate-${formId}`} className="font-medium uppercase text-sm text-mgs-lightgray block mb-1">
          Purchase Date:
        </label>
        <Input
          id={`purchaseDate-${formId}`}
          type="date"
          value={purchaseDate}
          onChange={e => setPurchaseDate(e.target.value)}
          className="font-roboto-mono bg-mgs-darkgray border-mgs-gray text-mgs-lightertext rounded-none"
          required
        />
      </div>
      <div>
        <label htmlFor={`purchaseFrequency-${formId}`} className="font-medium uppercase text-sm text-mgs-lightgray block mb-1">
          Frequency Protocol:
        </label>
        <select
          id={`purchaseFrequency-${formId}`}
          value={purchaseFrequency}
          onChange={e => setPurchaseFrequency(e.target.value as Frequency)}
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
            {useLimitType === "occurrences" && (
              <Input
                id={`occurrenceLimit-${formId}`}
                type="number"
                min={1}
                value={occurrenceLimit}
                onChange={e => setOccurrenceLimit(e.target.value)}
                className="w-48 ml-2 font-roboto-mono bg-mgs-darkgray border-mgs-gray text-mgs-lightertext placeholder:text-mgs-lightgray/50 rounded-none"
                placeholder="Number of occurrences"
              />
            )}
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id={`limitDate-${formId}`}
              name={`limitType-${formId}`}
              checked={useLimitType === "date"}
              onChange={() => setUseLimitType("date")}
              className="accent-mgs-green"
            />
            <label htmlFor={`limitDate-${formId}`} className="text-mgs-lightertext">
              Stop Date
            </label>
            {useLimitType === "date" && (
              <Input
                id={`stopDate-${formId}`}
                type="date"
                value={stopDate}
                onChange={e => setStopDate(e.target.value)}
                className="w-48 ml-2 font-roboto-mono bg-mgs-darkgray border-mgs-gray text-mgs-lightertext rounded-none"
                placeholder="Stop date"
              />
            )}
          </div>
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
          Add Purchase
        </Button>
      )}
    </form>
  );
};

export default PurchaseForm;
