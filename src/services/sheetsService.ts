import { FinancialEntry } from '@/types';

// Google Sheets API base URL
const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

// Sheet structure: Header row + data rows
const HEADERS = ['id', 'type', 'name', 'amount', 'date', 'frequency', 'occurrenceLimit', 'stopDate', 'customDates'];

interface SheetsServiceConfig {
    accessToken: string;
    sheetId: string;
}

/**
 * Extract spreadsheet ID from a Google Sheets URL
 */
export function extractSheetId(url: string): string | null {
    // Match patterns like:
    // https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
    // https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
}

/**
 * Initialize a blank Google Sheet with the proper structure
 */
export async function initializeSheet(config: SheetsServiceConfig): Promise<boolean> {
    const { accessToken, sheetId } = config;

    try {
        // First, check if sheet already has headers
        const checkResponse = await fetch(
            `${SHEETS_API_BASE}/${sheetId}/values/A1:I1`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        );

        if (!checkResponse.ok) {
            console.error('Failed to check sheet:', await checkResponse.text());
            return false;
        }

        const checkData = await checkResponse.json();

        // If headers already exist, don't overwrite
        if (checkData.values && checkData.values[0] && checkData.values[0][0] === 'id') {
            console.log('Sheet already initialized');
            return true;
        }

        // Add headers to the sheet
        const response = await fetch(
            `${SHEETS_API_BASE}/${sheetId}/values/A1:I1?valueInputOption=RAW`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    range: 'A1:I1',
                    majorDimension: 'ROWS',
                    values: [HEADERS],
                }),
            }
        );

        if (!response.ok) {
            console.error('Failed to initialize sheet:', await response.text());
            return false;
        }

        console.log('Sheet initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing sheet:', error);
        return false;
    }
}

/**
 * Fetch all entries from the Google Sheet
 */
export async function fetchEntries(config: SheetsServiceConfig): Promise<FinancialEntry[]> {
    const { accessToken, sheetId } = config;

    try {
        const response = await fetch(
            `${SHEETS_API_BASE}/${sheetId}/values/A2:I1000`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            console.error('Failed to fetch entries:', await response.text());
            return [];
        }

        const data = await response.json();

        if (!data.values) {
            return [];
        }

        // Parse rows into FinancialEntry objects
        return data.values.map((row: string[]) => ({
            id: row[0] || '',
            type: row[1] as FinancialEntry['type'] || 'bill',
            name: row[2] || '',
            amount: parseFloat(row[3]) || 0,
            date: new Date(row[4]),
            frequency: row[5] as FinancialEntry['frequency'] || 'one-time',
            occurrenceLimit: row[6] ? parseInt(row[6]) : undefined,
            stopDate: row[7] ? new Date(row[7]) : undefined,
            customDates: row[8] ? JSON.parse(row[8]) : undefined,
        }));
    } catch (error) {
        console.error('Error fetching entries:', error);
        return [];
    }
}

/**
 * Save a new entry to the Google Sheet
 */
export async function saveEntry(config: SheetsServiceConfig, entry: FinancialEntry): Promise<boolean> {
    const { accessToken, sheetId } = config;

    try {
        const row = [
            entry.id,
            entry.type,
            entry.name,
            entry.amount.toString(),
            entry.date.toISOString(),
            entry.frequency,
            entry.occurrenceLimit?.toString() || '',
            entry.stopDate?.toISOString() || '',
            entry.customDates ? JSON.stringify(entry.customDates) : '',
        ];

        const response = await fetch(
            `${SHEETS_API_BASE}/${sheetId}/values/A:I:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    values: [row],
                }),
            }
        );

        if (!response.ok) {
            console.error('Failed to save entry:', await response.text());
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error saving entry:', error);
        return false;
    }
}

/**
 * Delete an entry from the Google Sheet by ID
 */
export async function deleteEntry(config: SheetsServiceConfig, entryId: string): Promise<boolean> {
    const { accessToken, sheetId } = config;

    try {
        // First, find the row with this ID
        const response = await fetch(
            `${SHEETS_API_BASE}/${sheetId}/values/A:A`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            console.error('Failed to find entry:', await response.text());
            return false;
        }

        const data = await response.json();
        const rows = data.values || [];

        // Find the row index (1-indexed in Sheets, +1 for header)
        const rowIndex = rows.findIndex((row: string[]) => row[0] === entryId);

        if (rowIndex === -1) {
            console.error('Entry not found:', entryId);
            return false;
        }

        // Clear the row (we could also delete it, but clearing is simpler)
        const clearResponse = await fetch(
            `${SHEETS_API_BASE}/${sheetId}/values/A${rowIndex + 1}:I${rowIndex + 1}:clear`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!clearResponse.ok) {
            console.error('Failed to delete entry:', await clearResponse.text());
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error deleting entry:', error);
        return false;
    }
}

/**
 * Update an existing entry in the Google Sheet
 */
export async function updateEntry(config: SheetsServiceConfig, entry: FinancialEntry): Promise<boolean> {
    const { accessToken, sheetId } = config;

    try {
        // First, find the row with this ID
        const response = await fetch(
            `${SHEETS_API_BASE}/${sheetId}/values/A:A`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            console.error('Failed to find entry:', await response.text());
            return false;
        }

        const data = await response.json();
        const rows = data.values || [];

        // Find the row index
        const rowIndex = rows.findIndex((row: string[]) => row[0] === entry.id);

        if (rowIndex === -1) {
            console.error('Entry not found for update:', entry.id);
            return false;
        }

        const row = [
            entry.id,
            entry.type,
            entry.name,
            entry.amount.toString(),
            entry.date.toISOString(),
            entry.frequency,
            entry.occurrenceLimit?.toString() || '',
            entry.stopDate?.toISOString() || '',
            entry.customDates ? JSON.stringify(entry.customDates) : '',
        ];

        const updateResponse = await fetch(
            `${SHEETS_API_BASE}/${sheetId}/values/A${rowIndex + 1}:I${rowIndex + 1}?valueInputOption=RAW`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    range: `A${rowIndex + 1}:I${rowIndex + 1}`,
                    majorDimension: 'ROWS',
                    values: [row],
                }),
            }
        );

        if (!updateResponse.ok) {
            console.error('Failed to update entry:', await updateResponse.text());
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error updating entry:', error);
        return false;
    }
}

/**
 * Test if a sheet is accessible with the given token
 */
export async function testSheetAccess(config: SheetsServiceConfig): Promise<boolean> {
    const { accessToken, sheetId } = config;

    try {
        const response = await fetch(
            `${SHEETS_API_BASE}/${sheetId}?fields=properties.title`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        );

        return response.ok;
    } catch {
        return false;
    }
}
