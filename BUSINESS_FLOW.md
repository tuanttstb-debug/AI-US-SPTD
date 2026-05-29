# BUSINESS FLOW

## Tổng quan quy trình đăng ký AI Use Case

```
Người dùng mở app
       │
       ▼
┌─────────────────┐
│ Draft restore?  │ ← localStorage check
│ (confirm dialog)│
└────────┬────────┘
         │ Yes: populate form   No: clean start
         ▼
┌────────────────────────────────────────────────────┐
│  BƯỚC 1 — Thông tin nghiệp vụ                      │
│                                                    │
│  • Tên Use Case *         • Team *                 │
│  • Chủ sở hữu *           • Business Category *   │
│  • Email *                • Pain Point *           │
│  • Quy trình hiện tại     • Thời gian hiện tại     │
│  • Vấn đề hiện tại        • Loại người dùng        │
│  • Mục tiêu kỳ vọng                               │
│                                                    │
│  [OnBlur UseCase_Name + Pain_Point → duplicate API]│
└────────────────────┬───────────────────────────────┘
                     │ Validate step 1 (6 fields bắt buộc)
                     ▼
┌────────────────────────────────────────────────────┐
│  BƯỚC 2 — Luồng AI & Prompt                        │
│                                                    │
│  • Mô tả luồng xử lý *    • Loại input             │
│  • Prompt Role            • Prompt Task            │
│  • Prompt Goal            • Prompt Context         │
│  • Prompt Input           • Prompt Steps           │
│  • Prompt Output Format   • Tiêu chí đánh giá      │
└────────────────────┬───────────────────────────────┘
                     │ Validate step 2 (1 field bắt buộc)
                     ▼
┌────────────────────────────────────────────────────┐
│  BƯỚC 3 — Demo & Tái sử dụng                       │
│                                                    │
│  • Trạng thái demo (dropdown: Chưa có/Đã có/Triển) │
│  • Link demo              • Thời gian trước (min)  │
│  • Thời gian sau (min)    • Cải thiện chất lượng   │
│  • Ghi chú cải thiện      • Phạm vi tái sử dụng    │
│  • Điều chỉnh khi tái dùng                         │
│                                                    │
│  [Không có validation bắt buộc]                    │
└────────────────────┬───────────────────────────────┘
                     │ No validation
                     ▼
┌────────────────────────────────────────────────────┐
│  BƯỚC 4 — Hướng dẫn sử dụng                        │
│                                                    │
│  • Khi nào dùng           • Các bước thực hiện     │
│  • Lưu ý khi sử dụng                              │
│                                                    │
│  [Không có validation bắt buộc]                    │
│  [Submit button hiển thị thay Next]                │
└────────────────────┬───────────────────────────────┘
                     │ Click "Gửi đăng ký"
                     ▼
              Validator.all(data)
              (chỉ validate step1 + step2 lại)
                     │
              POST /usecase/create
              hoặc POST /usecase/update (edit mode)
                     │
              Toast success + Storage.clear()
```

## Lifecycle của một Use Case

```
[New Submission]
     │
     ▼
  Status: "Draft"          ← Backend tự set khi create (dù FE gửi "Submitted")
     │
     │  [Manual update by admin/reviewer — chưa có UI]
     ▼
  Status: "Submitted"      ← Submit_Date được set lúc này
     │
     ▼
  Status: "Approved" / "Rejected"  ← Data model hỗ trợ, workflow chưa implement
```

> **[ASSUMPTION]** Các trạng thái "Approved", "Rejected", "Under Review" được thiết kế nhưng chưa có workflow UI. Reviewer phải cập nhật trực tiếp trong Google Sheets.

## Data Model — MASTER_DATA (63 cột)

### Nhóm metadata hệ thống
| Field | Mô tả |
|---|---|
| Record_ID | UUID — primary key |
| UseCase_ID | AIUS-NNNN — business key |
| Created_At | ISO timestamp |
| Updated_At | ISO timestamp |
| Submit_Date | Set khi Status → Submitted |
| Edit_Version | Auto-increment mỗi lần update |
| JSON_Backup | Toàn bộ data dạng JSON string (dự phòng) |

### Nhóm workflow
| Field | Mô tả |
|---|---|
| Status | Draft / Submitted / Approved / Rejected |
| Current_Stage | Mirror của Status hoặc sub-stage |
| Reviewer | Email người review |
| Review_Date | Ngày review |
| Review_Comment | Nhận xét của reviewer |
| Priority | Mức ưu tiên |
| AI_Day_Flag | Đánh dấu cho "AI Day" event |
| AI_Day_Date | Ngày AI Day |

### Nhóm business info (form step 1)
UseCase_Name, Owner_Name, Owner_Email, Team, Business_Category, Co_Owner, Department, Pain_Point, Current_Process, Current_Time_Min, Current_Problem, User_Type, Expected_Goals

### Nhóm AI & Prompt (form step 2)
Flow_Description, Input_Types, Prompt_Role, Prompt_Task, Prompt_Goal, Prompt_Context, Prompt_Input, Prompt_Steps, Prompt_Output_Format, Prompt_Evaluation

### Nhóm demo & ROI (form step 3)
Demo_Status, Demo_Link, Before_Time_Min, After_Time_Min, Estimated_Time_Saving, Quality_Improvement, Improvement_Note

### Nhóm reuse (form step 3)
Reuse_Level, Reuse_Adjustment, Cross_Team_Flag, Reuse_Count, Active_User_Count, Last_Used_Date, Adoption_Score, Standardized_Flag

### Nhóm usage guide (form step 4)
When_To_Use, Usage_Steps, Usage_Notes

### Nhóm impact metrics (chưa có UI nhập)
Estimated_Hours_Saved_Month, Estimated_Cost_Impact, Business_Value, Scale_Potential, Risk_Level, Leadership_Support_Needed

### Nhóm duplicate detection
Similarity_Score, Duplicate_Flag

## Quy trình Duplicate Check

```
User nhập UseCase_Name → blur event → debounce(600ms)
  → DuplicateChecker.check(name, painPoint)
      → POST /duplicate-check
          → đọc toàn bộ MASTER_DATA
          → tính Dice similarity mỗi record:
              combined = name_score * 0.6 + pain_score * 0.4
          → nếu best_score >= 0.8 → duplicate_flag = true
      → Toast warning nếu duplicate
          "⚠️ Trùng lặp cao (87.0%) với 'Tên use case cũ'"
```

User có thể **bỏ qua** warning này và submit bình thường — không có block.

## Auto-save (Draft)

```
form.change event
  → FormMapper.collectData()
  → Storage.save(data)
  → localStorage['ai_usecase_draft'] = JSON.stringify(data)
```

Draft chỉ xóa khi:
1. Submit thành công (create mode)
2. User chọn "Không" khi được hỏi restore draft

> **[GAP]** Draft không xóa sau khi update thành công (edit mode). Sau khi edit xong, localStorage vẫn còn draft cũ.
