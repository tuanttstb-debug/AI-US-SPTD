// Utils.gs
function createResponse_(success, message, data, error) {
  return {
    success: success,
    message: message || '',
    data: data || null,
    error: error || null
  };
}

function sendJson_(response) {
  const output = ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
  // CORS headers
  output.addHeader('Access-Control-Allow-Origin', '*');
  output.addHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  output.addHeader('Access-Control-Allow-Headers', 'Content-Type');
  return output;
}

function getOrCreateSheet_(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    if (sheetName === SHEETS.MASTER) {
      sheet.appendRow(HEADERS);
    }
    if (sheetName === SHEETS.LOOKUP) {
      sheet.appendRow(['Field', 'Value']);
    }
    if (sheetName === SHEETS.ACTIVITY) {
      sheet.appendRow(['Record_ID', 'UseCase_ID', 'Timestamp', 'Action', 'Details', 'User_Email']);
    }
    if (sheetName === SHEETS.CONFIG) {
      sheet.appendRow(['Key', 'Value']);
      sheet.appendRow(['NEXT_ID', '1']);
    }
  }
  return sheet;
}

function readSheetAsObjects_(sheetName) {
  const sheet = getOrCreateSheet_(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length === 0) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] !== undefined ? row[i] : ''; });
    return obj;
  });
}

function appendRowFromObject_(sheetName, obj) {
  const sheet = getOrCreateSheet_(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data.length > 0 ? data[0] : [];
  if (headers.length === 0) throw new Error('Sheet has no headers');
  const row = headers.map(h => (obj[h] !== undefined ? obj[h] : ''));
  sheet.appendRow(row);
}

function updateRowByRecordId_(sheetName, recordId, obj) {
  const sheet = getOrCreateSheet_(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) throw new Error('No data rows');
  const headers = data[0];
  const recordCol = headers.indexOf('Record_ID');
  if (recordCol === -1) throw new Error('Record_ID column not found');
  for (let i = 1; i < data.length; i++) {
    if (data[i][recordCol] == recordId) {
      const row = headers.map((h, j) => (obj[h] !== undefined ? obj[h] : data[i][j]));
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([row]);
      return;
    }
  }
  throw new Error(`Record_ID ${recordId} not found`);
}

function findObjectByField_(sheetName, field, value) {
  const objects = readSheetAsObjects_(sheetName);
  return objects.find(o => o[field] == value) || null;
}

// Simple string similarity (Dice coefficient)
function diceSimilarity_(str1, str2) {
  if (!str1 || !str2) return 0;
  str1 = String(str1).toLowerCase().replace(/[^a-z0-9à-ỹ]/g, '');
  str2 = String(str2).toLowerCase().replace(/[^a-z0-9à-ỹ]/g, '');
  if (!str1 || !str2) return 0;
  const bigram = s => {
    const bg = new Set();
    for (let i = 0; i < s.length - 1; i++) bg.add(s.substring(i, i + 2));
    return bg;
  };
  const a = bigram(str1);
  const b = bigram(str2);
  const intersection = new Set([...a].filter(x => b.has(x)));
  return (2 * intersection.size) / (a.size + b.size);
}
