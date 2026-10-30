/**
 * Google Sheets logger for the Profit page A/B test (src/lib/experiment.ts).
 *
 * Setup:
 * 1. Create a Google Sheet. Extensions → Apps Script, paste this file, save.
 * 2. Deploy → New deployment → Web app. Execute as: Me. Who has access: Anyone.
 * 3. Copy the web app URL into NEXT_PUBLIC_ANALYTICS_URL (Netlify env var or .env.local) and rebuild.
 *
 * Each request appends one row. Rows with no question mark a flow start (completedFlow false)
 * or a completed Submit (completedFlow true); the rest are feedback answers.
 */
const COLUMNS = ["timestamp", "sessionId", "variant", "feedbackQuestion", "feedbackResponse", "completedFlow", "debug"];

function doPost(e) {
  const row = JSON.parse(e.postData.contents);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000); // Concurrent posts would otherwise overwrite each other's rows.
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) sheet.appendRow(COLUMNS);
  sheet.appendRow(COLUMNS.map((c) => (row[c] === null || row[c] === undefined ? "" : row[c])));
  lock.releaseLock();
  return ContentService.createTextOutput("ok");
}
