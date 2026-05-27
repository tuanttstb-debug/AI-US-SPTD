// Config.gs
const SPREADSHEET_ID = '1xLMQLTgj2sRf1l9C6s6AHCT5zWJLQOofL375t8Pv_NA'; // Replace with actual ID

const SHEETS = {
  MASTER: 'MASTER_DATA',
  LOOKUP: 'LOOKUP',
  ACTIVITY: 'ACTIVITY_LOG',
  DASHBOARD: 'DASHBOARD_READY',
  CONFIG: 'CONFIG'
};

// Exact headers of MASTER_DATA sheet – must match first row
const HEADERS = [
  'Record_ID', 'UseCase_ID', 'Created_At', 'Updated_At', 'Submit_Date',
  'Status', 'Current_Stage', 'Reviewer', 'Review_Date', 'Review_Comment',
  'Priority', 'AI_Day_Flag', 'AI_Day_Date',
  'UseCase_Name', 'Owner_Name', 'Owner_Email', 'Team', 'Business_Category',
  'Co_Owner', 'Department', 'Pain_Point', 'Current_Process', 'Current_Time_Min',
  'Current_Problem', 'User_Type', 'Expected_Goals',
  'Flow_Description', 'Input_Types',
  'Prompt_Role', 'Prompt_Task', 'Prompt_Goal', 'Prompt_Context', 'Prompt_Input',
  'Prompt_Steps', 'Prompt_Output_Format', 'Prompt_Evaluation',
  'Demo_Status', 'Demo_Link', 'Before_Time_Min', 'After_Time_Min',
  'Estimated_Time_Saving', 'Quality_Improvement', 'Improvement_Note',
  'Reuse_Level', 'Reuse_Adjustment', 'Cross_Team_Flag', 'Reuse_Count',
  'Active_User_Count', 'Last_Used_Date', 'Adoption_Score', 'Standardized_Flag',
  'When_To_Use', 'Usage_Steps', 'Usage_Notes',
  'Estimated_Hours_Saved_Month', 'Estimated_Cost_Impact', 'Business_Value',
  'Scale_Potential', 'Risk_Level', 'Leadership_Support_Needed',
  'Similarity_Score', 'Duplicate_Flag', 'Edit_Version', 'JSON_Backup'
];

const REQUIRED_FIELDS_CREATE = [
  'UseCase_Name', 'Owner_Name', 'Owner_Email', 'Team', 'Business_Category',
  'Pain_Point', 'Current_Process', 'Current_Time_Min', 'Expected_Goals',
  'Flow_Description'
];

const DUPLICATE_THRESHOLD = 0.8;

const CONFIG_DEFAULTS = {
  NEXT_ID: 1
};
