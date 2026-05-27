const FIELDS = {
  USE_CASE_NAME: 'UseCase_Name',
  OWNER_NAME: 'Owner_Name',
  OWNER_EMAIL: 'Owner_Email',
  TEAM: 'Team',
  BUSINESS_CATEGORY: 'Business_Category',
  PAIN_POINT: 'Pain_Point',
  CURRENT_PROCESS: 'Current_Process',
  CURRENT_TIME_MIN: 'Current_Time_Min',
  CURRENT_PROBLEM: 'Current_Problem',
  USER_TYPE: 'User_Type',
  EXPECTED_GOALS: 'Expected_Goals',
  FLOW_DESC: 'Flow_Description',
  INPUT_TYPES: 'Input_Types',
  PROMPT_ROLE: 'Prompt_Role',
  PROMPT_TASK: 'Prompt_Task',
  PROMPT_GOAL: 'Prompt_Goal',
  PROMPT_CONTEXT: 'Prompt_Context',
  PROMPT_INPUT: 'Prompt_Input',
  PROMPT_STEPS: 'Prompt_Steps',
  PROMPT_OUTPUT_FORMAT: 'Prompt_Output_Format',
  PROMPT_EVALUATION: 'Prompt_Evaluation',
  DEMO_STATUS: 'Demo_Status',
  DEMO_LINK: 'Demo_Link',
  BEFORE_TIME_MIN: 'Before_Time_Min',
  AFTER_TIME_MIN: 'After_Time_Min',
  QUALITY_IMPROVEMENT: 'Quality_Improvement',
  IMPROVEMENT_NOTE: 'Improvement_Note',
  REUSE_LEVEL: 'Reuse_Level',
  REUSE_ADJUSTMENT: 'Reuse_Adjustment',
  WHEN_TO_USE: 'When_To_Use',
  USAGE_STEPS: 'Usage_Steps',
  USAGE_NOTES: 'Usage_Notes'
};

const STEPS = [
  { id: 1, title: 'Thông tin nghiệp vụ', fields: [
    FIELDS.USE_CASE_NAME, FIELDS.OWNER_NAME, FIELDS.OWNER_EMAIL, FIELDS.TEAM,
    FIELDS.BUSINESS_CATEGORY, FIELDS.PAIN_POINT, FIELDS.CURRENT_PROCESS,
    FIELDS.CURRENT_TIME_MIN, FIELDS.CURRENT_PROBLEM, FIELDS.USER_TYPE,
    FIELDS.EXPECTED_GOALS
  ]},
  { id: 2, title: 'Luồng AI & Prompt', fields: [
    FIELDS.FLOW_DESC, FIELDS.INPUT_TYPES, FIELDS.PROMPT_ROLE, FIELDS.PROMPT_TASK,
    FIELDS.PROMPT_GOAL, FIELDS.PROMPT_CONTEXT, FIELDS.PROMPT_INPUT,
    FIELDS.PROMPT_STEPS, FIELDS.PROMPT_OUTPUT_FORMAT, FIELDS.PROMPT_EVALUATION
  ]},
  { id: 3, title: 'Demo & Tái sử dụng', fields: [
    FIELDS.DEMO_STATUS, FIELDS.DEMO_LINK, FIELDS.BEFORE_TIME_MIN,
    FIELDS.AFTER_TIME_MIN, FIELDS.QUALITY_IMPROVEMENT, FIELDS.IMPROVEMENT_NOTE,
    FIELDS.REUSE_LEVEL, FIELDS.REUSE_ADJUSTMENT
  ]},
  { id: 4, title: 'Hướng dẫn sử dụng', fields: [
    FIELDS.WHEN_TO_USE, FIELDS.USAGE_STEPS, FIELDS.USAGE_NOTES
  ]}
];
