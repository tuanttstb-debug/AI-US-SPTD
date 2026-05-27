// LoggerService.gs
function logActivity_(useCaseId, action, details, userEmail) {
  const obj = {
    Record_ID: Utilities.getUuid(),
    UseCase_ID: useCaseId,
    Timestamp: new Date().toISOString(),
    Action: action,
    Details: details || '',
    User_Email: userEmail || ''
  };
  appendRowFromObject_(SHEETS.ACTIVITY, obj);
}
