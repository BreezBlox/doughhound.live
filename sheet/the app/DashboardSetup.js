/**
 * DoughFlow - Financial Dashboard Setup
 * 
 * Instructions:
 * 1. Open your Google Sheet with the imported CSV data.
 * 2. Go to Extensions > Apps Script.
 * 3. Delete any existing code and paste this entire script.
 * 4. Save the project (Ctrl+S).
 * 5. Refresh your spreadsheet tab.
 * 6. You will see a new menu "DoughFlow" in the toolbar. Click "Setup Dashboard".
 */
function onOpen() {
    SpreadsheetApp.getUi()
        .createMenu('DoughFlow')
        .addItem('Setup Dashboard', 'setupDashboard')
        .addToUi();
}
function setupDashboard() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const ui = SpreadsheetApp.getUi();
    // 1. Identify or Create 'Data' Sheet
    // We assume the active sheet contains the CSV data if 'Data' doesn't exist yet
    let dataSheet = ss.getSheetByName('Data');
    if (!dataSheet) {
        dataSheet = ss.getActiveSheet();
        dataSheet.setName('Data');
    }
    // 2. Identify or Create 'Dashboard' Sheet
    let dashSheet = ss.getSheetByName('Dashboard');
    if (!dashSheet) {
        dashSheet = ss.insertSheet('Dashboard', 0); // Insert at index 0 (first tab)
    }
    setupDashboardUI(ss, dashSheet);
    setupDataFormulas(ss, dataSheet);
    ui.alert('Dashboard Setup Complete!\n\nCheck the "Dashboard" tab to set your Start Date and Reserve Balance.');
}
function setupDashboardUI(ss, sheet) {
    sheet.clear();
    // Formatting variables
    const headerStyle = SpreadsheetApp.newTextStyle().setBold(true).setFontSize(14).build();
    const labelStyle = SpreadsheetApp.newTextStyle().setBold(true).build();
    // Header
    sheet.getRange('A1').setValue('DoughFlow Control Center').setTextStyle(headerStyle);
    // Inputs
    sheet.getRange('A3').setValue('Forecast Start Date').setTextStyle(labelStyle);
    sheet.getRange('A4').setValue('Current Reserve Balance').setTextStyle(labelStyle);
    // Set Defaults if empty
    const dateCell = sheet.getRange('B3');
    if (dateCell.isBlank()) {
        dateCell.setValue(new Date());
        dateCell.setNumberFormat("yyyy-mm-dd");
    }
    const balanceCell = sheet.getRange('B4');
    if (balanceCell.isBlank()) {
        balanceCell.setValue(0);
        balanceCell.setNumberFormat("$#,##0.00");
    }
    // Create Named Ranges for easy formula reference
    ss.setNamedRange('OverrideDate', dateCell);
    ss.setNamedRange('OverrideBalance', balanceCell);
    // Add some helpful instructions text
    sheet.getRange('D3').setValue('Instructions:');
    sheet.getRange('D4').setValue('1. Set the "Forecast Start Date" to today or a past date.');
    sheet.getRange('D5').setValue('2. Enter your ACTUAL bank balance in "Current Reserve Balance".');
    sheet.getRange('D6').setValue('3. The "Data" tab will update automatically to forecast from this point forward.');
    sheet.autoResizeColumns(1, 4);
}
function setupDataFormulas(ss, sheet) {
    const lastRow = sheet.getLastRow();
    // 1. Ensure Date Column (A) is formatted as Date to avoid string mismatches
    sheet.getRange(2, 1, lastRow - 1, 1).setNumberFormat("yyyy-mm-dd");
    // 2. Ensure headers
    sheet.getRange('G1').setValue('Forecasted Reserve').setFontWeight('bold');
    // 3. Clear old data
    sheet.getRange(2, 7, lastRow, 1).clearContent();
    // 4. Generate Robust Formula
    // - INT(RC1) forces the cell to a number (date value) for comparison.
    // - TO_TEXT(RC3:RC6) ensures empty cells don't break REGEXEXTRACT.
    // - ARRAYFORMULA handles the range C:F for each row.
    const formula = '=IF(INT(RC1) < INT(OverrideDate), "", IF(INT(RC1) = INT(OverrideDate), OverrideBalance, N(R[-1]C[0]) + SUM(ARRAYFORMULA(IFERROR(VALUE(REGEXEXTRACT(TO_TEXT(RC3:RC6), "[+-]?\\d+(\\.\\d+)?")),0)))))';
    // Apply formula
    sheet.getRange(2, 7, lastRow - 1, 1).setFormulaR1C1(formula);
    // Format as Currency
    sheet.getRange(2, 7, lastRow - 1, 1).setNumberFormat("$#,##0.00");
    // Freeze Header
    sheet.setFrozenRows(1);
}