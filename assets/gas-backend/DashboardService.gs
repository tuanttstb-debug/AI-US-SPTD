// DashboardService.gs
function getDashboardSummary_() {
  const all = readSheetAsObjects_(SHEETS.MASTER);
  const statusCounts = {};
  const teamCounts = {};
  const categoryCounts = {};
  let totalTimeSaved = 0;
  let totalEstimatedHours = 0;
  let countWithTime = 0;
  all.forEach(uc => {
    const st = uc.Status || 'Unknown';
    statusCounts[st] = (statusCounts[st] || 0) + 1;
    const team = uc.Team || 'Unknown';
    teamCounts[team] = (teamCounts[team] || 0) + 1;
    const cat = uc.Business_Category || 'Unknown';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    const saving = parseFloat(uc.Estimated_Time_Saving) || 0;
    totalTimeSaved += saving;
    const hours = parseFloat(uc.Estimated_Hours_Saved_Month) || 0;
    totalEstimatedHours += hours;
    if (uc.Before_Time_Min && uc.After_Time_Min) countWithTime++;
  });
  return {
    total_use_cases: all.length,
    status_breakdown: statusCounts,
    team_breakdown: teamCounts,
    category_breakdown: categoryCounts,
    total_time_saved_min: totalTimeSaved,
    total_estimated_hours_per_month: totalEstimatedHours,
    use_cases_with_measurement: countWithTime
  };
}
