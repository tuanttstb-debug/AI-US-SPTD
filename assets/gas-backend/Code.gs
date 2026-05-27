// Code.gs
function doGet(e) {
  return handleRequest_(e, 'GET');
}

function doPost(e) {
  return handleRequest_(e, 'POST');
}

function doPut(e) {
  return handleRequest_(e, 'PUT');
}

// Handle OPTIONS for CORS preflight
function doOptions(e) {
  const output = ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
  output.addHeader('Access-Control-Allow-Origin', '*');
  output.addHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  output.addHeader('Access-Control-Allow-Headers', 'Content-Type');
  return output;
}

function handleRequest_(e, methodOverride) {
  const method = methodOverride || (e.postData ? 'POST' : 'GET');
  const pathInfo = e.pathInfo || '';
  let body = {};
  if (e.postData && e.postData.contents) {
    try {
      body = JSON.parse(e.postData.contents);
    } catch (ex) {
      return sendJson_(createResponse_(false, 'Invalid JSON', null, ex.message));
    }
  }
  try {
    // Route to appropriate handler
    if (method === 'GET') {
      if (pathInfo === 'lookup') {
        const data = getLookupData_();
        return sendJson_(createResponse_(true, 'Lookup data', data));
      }
      if (pathInfo.startsWith('usecase/')) {
        const id = pathInfo.split('usecase/')[1];
        if (!id) throw new Error('Missing ID');
        const data = getUseCaseById_(id);
        return sendJson_(createResponse_(true, 'Use case found', data));
      }
      if (pathInfo === 'dashboard-summary') {
        const data = getDashboardSummary_();
        return sendJson_(createResponse_(true, 'Dashboard summary', data));
      }
      if (pathInfo === 'health') {
        return sendJson_(createResponse_(true, 'OK', { status: 'healthy', timestamp: new Date() }));
      }
      throw new Error('Unknown GET endpoint: ' + pathInfo);
    }

    if (method === 'POST') {
      if (pathInfo === 'usecase/create') {
        const result = createUseCase_(body);
        return sendJson_(createResponse_(true, 'Use case created', result));
      }
      if (pathInfo === 'usecase/update') {
        const recordId = body.Record_ID;
        if (!recordId) throw new Error('Record_ID missing');
        const updated = updateUseCase_(recordId, body);
        return sendJson_(createResponse_(true, 'Use case updated', updated));
      }
      if (pathInfo === 'duplicate-check') {
        const result = checkDuplicate_(body.UseCase_Name, body.Pain_Point);
        return sendJson_(createResponse_(true, 'Duplicate check completed', result));
      }
      throw new Error('Unknown POST endpoint: ' + pathInfo);
    }

    // PUT same as POST but with update
    if (method === 'PUT') {
      if (pathInfo === 'usecase/update') {
        const recordId = body.Record_ID;
        if (!recordId) throw new Error('Record_ID missing');
        const updated = updateUseCase_(recordId, body);
        return sendJson_(createResponse_(true, 'Use case updated', updated));
      }
      throw new Error('Unknown PUT endpoint');
    }

    throw new Error('Method not allowed');
  } catch (error) {
    return sendJson_(createResponse_(false, error.message, null, error.toString()));
  }
}
