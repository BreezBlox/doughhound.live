import React, { useRef, useState } from "react";
import Papa from "papaparse";
import { FinancialEntry } from "@/types";
import { parseLocalDateString } from "@/utils/dateUtils";
import { v4 as uuidv4 } from "uuid";

interface CsvImportProps {
  onImport: (entries: FinancialEntry[]) => void;
}

const CsvImport: React.FC<CsvImportProps> = ({ onImport }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setMessage(null);
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const entries: FinancialEntry[] = [];
        for (const row of results.data as any[]) {
          if (!row.type || !row.name || !row.amount || !row.date || !row.frequency) continue;
          if (row.type !== "bill" && row.type !== "paycheck" && row.type !== "purchase") continue;
          const amount = parseFloat(row.amount);
          if (isNaN(amount)) continue;
          const date = parseLocalDateString(row.date);
          entries.push({
            id: uuidv4(),
            type: row.type,
            name: row.name,
            amount,
            date,
            frequency: row.frequency
          });
        }
        console.log("CSV parsed entries:", entries);
        if (entries.length > 0) {
          setMessage(`Imported ${entries.length} entries successfully!`);
          setError(null);
          onImport(entries);
        } else {
          setMessage(null);
          setError("No valid entries found in the CSV file.");
        }
        if (inputRef.current) inputRef.current.value = "";
      },
      error: (err) => {
        setMessage(null);
        setError("CSV parse error: " + err.message);
      }
    });
  }

  return (
    <div className="mb-4 flex flex-col items-center">
      <label className="font-orbitron text-mgs-green mb-2">Import Bills & Paychecks via CSV</label>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="block w-full text-xs text-mgs-green file:mr-4 file:py-2 file:px-4 file:rounded-none file:border-0 file:text-xs file:font-orbitron file:bg-mgs-green file:text-mgs-black hover:file:bg-mgs-darkgreen"
        onChange={handleFileChange}
      />
      <a
        href={`data:text/csv,` + encodeURIComponent(
          [
            'type,name,amount,date,frequency,occurrence,stopDate,customDates',
            'bill,Electricity,50,01/05/2025,monthly,12,01/05/2026,',
            'paycheck,Salary,2000,05/05/2025,bi-weekly,,01/12/2025,',
            'purchase,Groceries,120,03/05/2025,one-time,,,10/05/2025 15/05/2025'
          ].join('\n')
        )}
        download="doughflow-template.csv"
        className="mt-2 text-xs underline text-mgs-lightgray hover:text-mgs-green"
      >
        Download CSV Template
      </a>
      {message && <div className="mt-2 text-xs text-mgs-green">{message}</div>}
      {error && <div className="mt-2 text-xs text-mgs-red">{error}</div>}
    </div>
  );
};

export default CsvImport;
