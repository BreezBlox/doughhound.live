/**
 * Dough Hound - Google Apps Script Backend
 * 
 * CORE FUNCTIONALITY:
 * 1. Web App (doGet)
 * 2. Menus & Sidebars
 * 3. Database Interaction (Reading/Writing to 'Transactions' sheet)
 * 4. Forecasting Engine (Calculating future balances)
 */

// ==========================================
// 0. WEB APP SETUP
// ==========================================
function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Dough Hound Reserve')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ==========================================
// 1. SETUP & UTILITIES
// ==========================================
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Dough Hound')
    .addItem('Open Web App', 'openWebAppModal')
    .addSeparator()
    .addItem('Open Transaction Terminal', 'showSidebar')
    .addSeparator()
    .addItem('Refresh Forecast', 'generateForecast')
    .addToUi();
}

function openWebAppModal() {
  const html = HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setWidth(1200)
    .setHeight(800);
  SpreadsheetApp.getUi().showModalDialog(html, 'Dough Hound Reserve');
}

function showSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('Note Transaction')
    .setWidth(400);
  SpreadsheetApp.getUi().showSidebar(html);
}

function uuidv4() {
  return Utilities.getUuid();
}

function formatDate(date) {
  return Utilities.formatDate(new Date(date), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

// ==========================================
// 2. API & TRANSACTION MANAGEMENT
// ==========================================

/**
 * Helper: Ensure Dashboard sheet exists with correct structure
 */
function ensureDashboard(ss) {
  let dSheet = ss.getSheetByName('Dashboard');
  if (!dSheet) {
    dSheet = ss.insertSheet('Dashboard', 0);
    dSheet.getRange('A1').setValue('DoughFlow Settings').setFontWeight('bold').setFontSize(14);
    dSheet.getRange('A3').setValue('Forecast Start Date').setFontWeight('bold');
    dSheet.getRange('A4').setValue('Current Reserve Balance').setFontWeight('bold');
    // Set Defaults
    dSheet.getRange('B3').setValue(new Date()).setNumberFormat('yyyy-mm-dd');
    dSheet.getRange('B4').setValue(0).setNumberFormat('$#,##0.00');
    dSheet.autoResizeColumns(1, 2);
  }
  return dSheet;
}

/**
 * API Endpoint: Fetch forecast data for the chart
 */
function getForecastData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tSheet = ss.getSheetByName('Transactions');
  const dSheet = ensureDashboard(ss); // Auto-create if missing

  // 1. Get Start Balance & Date
  let startBalance = 0;
  let startDate = new Date(); // Default today

  if (dSheet) {
    const dateVal = dSheet.getRange('B3').getValue();
    const balVal = dSheet.getRange('B4').getValue();

    if (dateVal instanceof Date) startDate = dateVal;
    if (typeof balVal === 'number') startBalance = balVal;
  }

  // Normalize Start Date to Midnight to match proper date comparison
  startDate.setHours(0, 0, 0, 0);

  // 2. Get Transaction Data
  if (!tSheet) return { error: "No 'Transactions' sheet found." };

  const data = tSheet.getDataRange().getValues();
  const headers = data.shift(); // Remove header

  const entries = data.map(row => ({
    id: row[0],
    date: new Date(row[1]),
    name: row[2],
    amount: Number(row[3]),
    type: row[4],
    frequency: row[5],
    stopDate: row[6] ? new Date(row[6]) : null
  }));

  // 3. Generate Forecast Data
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 24); // 24 months out

  const expandedEvents = calculateRecurringEntries(entries, startDate, endDate);
  const dailyReserves = calculateDailyReserves(expandedEvents, startDate, endDate, startBalance);

  // Return simpler structure for JSON
  return {
    startBalance: startBalance,
    startDate: formatDate(startDate),
    anchorDate: formatDate(startDate), // For UI display
    timeline: dailyReserves.map(d => ({
      date: formatDate(d.date),
      balance: d.reserve,
      net: d.netChange,
      events: d.entries.map(e => `${e.name} (${e.amount > 0 ? '+' : ''}${e.amount})`).join(', ')
    }))
  };
}

/**
 * API Endpoint: Add a new transaction
 */
function addTransactionAPI(formObject) {
  try {
    const success = addTransaction(formObject);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * API Endpoint: Update the Reserve Balance in the Dashboard
 */
function updateBalanceAPI(newBalance) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dSheet = ensureDashboard(ss); // Auto-create if missing

  // Update B3 (Date) and B4 (Balance)
  dSheet.getRange('B3').setValue(new Date());
  dSheet.getRange('B4').setValue(Number(newBalance));

  // Regenerate Forecast since start balance changed
  generateForecast();

  return { success: true };
}

/**
 * API Endpoint: Sync the Anchor Date to Today (locking in the projected balance)
 */
function syncAnchorToTodayAPI(newBalance) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dSheet = ensureDashboard(ss);

  // Update B3 (Date) to today and B4 (Balance) to the projected amount
  dSheet.getRange('B3').setValue(new Date());
  dSheet.getRange('B4').setValue(Number(newBalance));

  // Regenerate Forecast since start settings changed
  generateForecast();

  return { success: true };
}


/**
 * Adds a new transaction to the 'Transactions' sheet.
 * Shared by Sidebar and Web App.
 */
function addTransaction(formObject) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Transactions');

  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet('Transactions');
    sheet.appendRow(['ID', 'Date', 'Name', 'Amount', 'Type', 'Frequency', 'Stop Date', 'Custom Dates', 'Limit']);
    sheet.setFrozenRows(1);
  }
  const id = uuidv4();

  // Handle different object structures (Sidebar vs Web App JSON)
  const rawAmount = Number(formObject.amount);
  // Trust explicit type if provided, otherwise infer: Is it negative? -> withdrawal
  const type = formObject.type || (rawAmount < 0 ? 'withdrawal' : 'deposit');

  // Store absolute value to keep math clean in forecasting engine
  const amount = Math.abs(rawAmount);

  const rowData = [
    id,
    formObject.date,          // Col B: Date
    formObject.name,          // Col C: Name
    amount,                   // Col D: Amount
    type,                     // Col E: Type
    formObject.frequency || 'one-time', // Col F: Frequency
    formObject.stopDate || '',// Col G: Stop Date
    '',                       // Col H: Custom Dates
    formObject.limit || ''    // Col I: Occurence Limit
  ];
  sheet.appendRow(rowData);

  // Auto-refresh forecast sheet if it exists
  generateForecast();

  return true;
}

// ==========================================
// 3. FORECASTING ENGINE
// ==========================================
/**
 * Main function to regenerate the 'Forecast' sheet.
 * Reads 'Transactions', expands recurring events, calculates running balance, and writes to 'Forecast'.
 */
function generateForecast() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tSheet = ss.getSheetByName('Transactions');
  if (!tSheet) return; // No data yet

  // 1. Resolve Start Settings
  let startBalance = 0;
  let startDate = new Date();

  const dSheet = ensureDashboard(ss); // Use helper

  if (dSheet) {
    const dateVal = dSheet.getRange('B3').getValue();
    const balVal = dSheet.getRange('B4').getValue();
    if (dateVal instanceof Date) startDate = dateVal;
    if (typeof balVal === 'number') startBalance = balVal;
  }

  // Normalize Start Date to Midnight to ensure 'Today' transactions are included
  startDate.setHours(0, 0, 0, 0);

  const data = tSheet.getDataRange().getValues();
  const headers = data.shift(); // Remove header row

  // Map rows to objects
  const entries = data.map(row => ({
    id: row[0],
    date: new Date(row[1]),
    name: row[2],
    amount: Number(row[3]),
    type: row[4],
    frequency: row[5],
    stopDate: row[6] ? new Date(row[6]) : null,
    limit: row[8] ? Number(row[8]) : null
  }));

  // Define Forecast Range
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 24);

  // 1. Expand Recurring Entries
  const expandedEvents = calculateRecurringEntries(entries, startDate, endDate);

  // 2. Calculate Daily Reserves
  const dailyReserves = calculateDailyReserves(expandedEvents, startDate, endDate, startBalance);

  // 3. Write to 'Forecast' Sheet
  let fSheet = ss.getSheetByName('Forecast');
  if (!fSheet) {
    fSheet = ss.insertSheet('Forecast');
    fSheet.appendRow(['Date', 'Daily Net', 'Reserve Balance', 'Events']);
  } else {
    fSheet.clear();
    fSheet.appendRow(['Date', 'Daily Net', 'Reserve Balance', 'Events']);
  }

  // Format output for sheet
  const outputRows = dailyReserves.map(day => [
    formatDate(day.date),
    day.netChange,
    day.reserve,
    day.entries.map(e => `${e.name} (${e.amount > 0 ? '+' : ''}${e.amount})`).join(', ')
  ]);

  if (outputRows.length > 0) {
    fSheet.getRange(2, 1, outputRows.length, 4).setValues(outputRows);
  }
}

/**
 * LOGIC PORT: Expands recurring entries into individual events.
 */
function calculateRecurringEntries(entries, startDate, endDate) {
  let allEvents = [];
  entries.forEach(entry => {
    let currentDate = new Date(entry.date);
    let stopDate = entry.stopDate || endDate;

    // Safety break for infinite loops
    let count = 0;
    const MAX_ITERATIONS = 1000;

    // Handle One-Time
    if (entry.frequency === 'one-time') {
      if (currentDate >= startDate && currentDate <= endDate) {
        allEvents.push({ ...entry, date: new Date(currentDate) });
      }
      return;
    }

    // Handle Recurring
    while (currentDate <= stopDate && currentDate <= endDate && count < MAX_ITERATIONS) {
      if (entry.limit && count >= entry.limit) break;

      if (currentDate >= startDate) {
        allEvents.push({
          ...entry,
          date: new Date(currentDate)
        });
      }

      // Increment Date
      switch (entry.frequency) {
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'bi-weekly':
          currentDate.setDate(currentDate.getDate() + 14);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'every-4-weeks':
          currentDate.setDate(currentDate.getDate() + 28);
          break;
        default:
          count = MAX_ITERATIONS; // Break if unknown freq
      }
      count++;
    }
  });

  return allEvents;
}

/**
 * LOGIC PORT: Calculates running balance day-by-day.
 */
function calculateDailyReserves(events, startDate, endDate, startBalance) {
  let dailyData = [];
  let currentDate = new Date(startDate);
  let cumulativeReserve = startBalance;

  // Group events by date string (YYYY-MM-DD)
  const eventsByDate = {};
  events.forEach(e => {
    const dString = formatDate(e.date);
    if (!eventsByDate[dString]) eventsByDate[dString] = [];
    eventsByDate[dString].push(e);
  });

  while (currentDate <= endDate) {
    const dString = formatDate(currentDate);
    const dayEvents = eventsByDate[dString] || [];

    let dailyNet = 0;
    dayEvents.forEach(e => {
      // Simple signed addition (assuming amount is signed correctly or handled by type)
      // In sheet, expenses were positive numbers with type 'withdrawal', let's unify.
      // Legacy code: if paycheck += amount, else -= amount.
      if (e.type === 'paycheck' || e.type === 'deposit') {
        dailyNet += e.amount;
      } else {
        dailyNet -= e.amount;
      }
    });

    cumulativeReserve += dailyNet;

    dailyData.push({
      date: new Date(currentDate),
      netChange: dailyNet,
      reserve: cumulativeReserve,
      entries: dayEvents
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dailyData;
}