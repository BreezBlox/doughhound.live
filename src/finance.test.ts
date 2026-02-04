test('Force fail', () => { expect(true).toBe(false); });
import { FinancialEntry } from "./types";

describe("Finance Data Calculation", () => {
  const entries: FinancialEntry[] = [
    {
      id: "paycheck1",
      name: "Paycheck",
      date: "2025-04-01",
      amount: 2000,
      type: "paycheck",
      frequency: "one-time"
    },
    {
      id: "bill1",
      name: "Rent",
      date: "2025-04-02",
      amount: 1200,
      type: "bill",
      frequency: "one-time"
    },
    {
      id: "bill2",
      name: "Gym",
      date: "2025-04-03",
      amount: 50,
      type: "bill",
      frequency: "weekly"
    }
  ];
  
  it("should correctly expand recurring entries", () => {
    const expanded = calculateRecurringEntries(entries, new Date("2025-04-01"), new Date("2025-04-21"));
    const gymEntries = expanded.filter(e => e.name === "Gym");
    expect(gymEntries.length).toBe(3); // 4/3, 4/10, 4/17
    expect(gymEntries[0].date instanceof Date).toBe(true);
  });

  it("should calculate correct daily reserves", () => {
    const expanded = calculateRecurringEntries(entries, new Date("2025-04-01"), new Date("2025-04-21"));
    const reserves = calculateDailyReserves(expanded, new Date("2025-04-01"), new Date("2025-04-05"));
    // Day by day check
    const reservesByDate = Object.fromEntries(reserves.map(r => [formatDateToYYYYMMDD(r.date), r.reserve]));
    expect(reservesByDate["2025-04-01"]).toBe(2000); // Paycheck
    expect(reservesByDate["2025-04-02"]).toBe(800); // Rent
    expect(reservesByDate["2025-04-03"]).toBe(750); // Gym
    expect(reservesByDate["2025-04-10"]).toBe(700); // Gym again
    expect(reservesByDate["2025-04-17"]).toBe(650); // Gym again
  });
});
