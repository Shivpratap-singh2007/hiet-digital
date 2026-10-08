# HIET DIGITAL CAMPUS — IMPORT TEMPLATES & VALIDATION SPECIFICATION
**Himachal Institute of Engineering & Technology, Shahpur**  
**Document Version:** 1.0.0 (Production Release)  
**Endpoint:** `/app/admin/import`

---

## Overview

This guide details the exact column structure, data types, mandatory constraints, and sample values for all 16 official HIET Digital Campus CSV/XLSX import templates.

Templates may be downloaded directly in `.csv` or `.xlsx` format from the **College Data Import Console**.

---

## 1. Student Master (`students`)

| Column Header | Required | Data Type | Validation Rule | Example Value | Description |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `roll_no` | **Yes** | String (Unique) | Uppercase, alphanumeric, institute format | `22CSE001` | Official university roll number |
| `full_name` | **Yes** | String | 2–80 characters | `Aarav Sharma` | Student full legal name |
| `email` | Optional | Email | Valid RFC 5322 format, institute domain preferred | `aarav.22cse001@hiet.ac.in` | Student primary email address |
| `phone` | Optional | String | 10-digit mobile number | `9816012345` | Student contact number |
| `department_code` | **Yes** | String | Must exist in Department Master | `CSE` | Department code (`CSE`, `ECE`, etc.) |
| `semester` | **Yes** | Integer | Range `1` to `8` | `6` | Current active semester |
| `section` | **Yes** | String | 1–5 characters, uppercase | `A` | Class section identifier |
| `academic_year` | **Yes** | String | Format `YYYY-YYYY` | `2026-2027` | Academic calendar year |
| `enrolled_year` | Optional | Integer | 4-digit year >= 2010 | `2022` | Year of initial enrollment |
| `is_active` | Optional | Boolean | `true` or `false` | `true` | Active enrollment status |

### Sample CSV Row:
```csv
roll_no,full_name,email,phone,department_code,semester,section,academic_year,enrolled_year,is_active
22CSE001,Aarav Sharma,aarav.22cse001@hiet.ac.in,9816012345,CSE,6,A,2026-2027,2022,true
```

---

## 2. Faculty Master (`faculty`)

| Column Header | Required | Data Type | Validation Rule | Example Value | Description |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `employee_code` | **Yes** | String (Unique) | Uppercase, alphanumeric (e.g. `FAC-xxx`) | `FAC-001` | College employee code |
| `full_name` | **Yes** | String | 2–80 characters | `Dr. Ramesh Kumar` | Faculty full name |
| `email` | Optional | Email | Valid email format | `ramesh.kumar@hiet.ac.in` | Official institutional email |
| `phone` | Optional | String | 10-digit mobile number | `9816055555` | Contact phone number |
| `department_code` | **Yes** | String | Must exist in Department Master | `CSE` | Assigned academic department |
| `designation` | **Yes** | String | Valid academic designation | `Associate Professor` | Post/Designation |
| `qualification` | Optional | String | Free text | `Ph.D. (Computer Science)` | Highest academic degree |
| `is_active` | Optional | Boolean | `true` or `false` | `true` | Active employment status |

### Sample CSV Row:
```csv
employee_code,full_name,email,phone,department_code,designation,qualification,is_active
FAC-001,Dr. Ramesh Kumar,ramesh.kumar@hiet.ac.in,9816055555,CSE,Associate Professor,Ph.D. Computer Science,true
```

---

## 3. Subjects Catalog (`subjects`)

| Column Header | Required | Data Type | Validation Rule | Example Value | Description |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `subject_code` | **Yes** | String (Unique) | Uppercase, university curriculum code | `CS-601` | Official subject code |
| `subject_name` | **Yes** | String | 2–100 characters | `Compiler Design` | Full course title |
| `department_code` | **Yes** | String | Must exist in Department Master | `CSE` | Department offering the course |
| `semester` | **Yes** | Integer | Range `1` to `8` | `6` | Curricular semester |
| `credits` | **Yes** | Decimal | Range `1.0` to `8.0` | `4.0` | Academic credits allocated |
| `subject_type` | Optional | String | `Theory`, `Practical`, `Lab`, `Elective` | `Theory` | Course instructional format |
| `academic_year` | Optional | String | Format `YYYY-YYYY` | `2026-2027` | Academic curriculum year |
| `is_active` | Optional | Boolean | `true` or `false` | `true` | Active course catalog status |

### Sample CSV Row:
```csv
subject_code,subject_name,department_code,semester,credits,subject_type,academic_year,is_active
CS-601,Compiler Design,CSE,6,4.0,Theory,2026-2027,true
```

---

## 4. Faculty-Subject Mapping (`teacher_subjects`)

| Column Header | Required | Data Type | Validation Rule | Example Value | Description |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `employee_code` | **Yes** | String | Must exist in Faculty Master | `FAC-001` | Assigned faculty member |
| `subject_code` | **Yes** | String | Must exist in Subjects Master | `CS-601` | Subject taught |
| `department_code` | **Yes** | String | Department code | `CSE` | Course department |
| `semester` | **Yes** | Integer | Range `1` to `8` | `6` | Target class semester |
| `section` | **Yes** | String | 1–5 characters | `A` | Target class section |
| `academic_year` | **Yes** | String | Format `YYYY-YYYY` | `2026-2027` | Academic session |
| `is_primary` | Optional | Boolean | `true` or `false` | `true` | Primary course coordinator flag |

### Sample CSV Row:
```csv
employee_code,subject_code,department_code,semester,section,academic_year,is_primary
FAC-001,CS-601,CSE,6,A,2026-2027,true
```

---

## 5. Class In-Charge Mapping (`class_incharge`)

| Column Header | Required | Data Type | Validation Rule | Example Value | Description |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `department_code` | **Yes** | String | Must exist in Department Master | `CSE` | Department of the class |
| `semester` | **Yes** | Integer | Range `1` to `8` | `6` | Class semester |
| `section` | **Yes** | String | Single section code | `A` | Class section |
| `academic_year` | **Yes** | String | Format `YYYY-YYYY` | `2026-2027` | Academic session |
| `employee_code` | **Yes** | String | Faculty must belong to same department | `FAC-001` | Appointed class in-charge |

> [!IMPORTANT]
> **Unique In-Charge Constraint:** Only one active Class In-Charge is permitted per `(department_code, semester, section, academic_year)`. Attempting to map multiple in-charges will trigger validation rejection.

### Sample CSV Row:
```csv
department_code,semester,section,academic_year,employee_code
CSE,6,A,2026-2027,FAC-001
```

---

## 6. HOD Assignment (`hod_assignment`)

| Column Header | Required | Data Type | Validation Rule | Example Value | Description |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `department_code` | **Yes** | String | Must exist in Department Master | `CSE` | Department led |
| `employee_code` | **Yes** | String | Faculty must belong to department | `FAC-001` | Appointed HOD faculty code |
| `effective_from` | **Yes** | Date | Format `YYYY-MM-DD` | `2026-01-01` | Start of HOD tenure |
| `effective_until` | Optional | Date | Format `YYYY-MM-DD`, must be >= from date | `2028-12-31` | Expiry of HOD tenure |
| `remarks` | Optional | String | Up to 255 chars | `Appointed by Principal` | Appointment notes |

### Sample CSV Row:
```csv
department_code,employee_code,effective_from,effective_until,remarks
CSE,FAC-001,2026-01-01,2028-12-31,Appointed by Governing Body
```

---

## 7. Timetable Schedule (`timetable`)

| Column Header | Required | Data Type | Validation Rule | Example Value | Description |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `department_code` | **Yes** | String | Department code | `CSE` | Department |
| `semester` | **Yes** | Integer | 1 to 8 | `6` | Semester |
| `section` | **Yes** | String | Section | `A` | Section |
| `day_of_week` | **Yes** | String | Monday through Saturday | `Monday` | Lecture day |
| `start_time` | **Yes** | Time | `HH:MM AM/PM` or `HH:MM` | `09:30 AM` | Period start |
| `end_time` | **Yes** | Time | Must be > `start_time` | `10:25 AM` | Period end |
| `subject_code` | **Yes** | String | Must exist in Subjects Master | `CS-601` | Subject taught |
| `employee_code` | **Yes** | String | Must exist in Faculty Master | `FAC-001` | Instructor |
| `room_code` | **Yes** | String | Classroom or lab code | `LH-101` | Classroom room code |
| `room_lat` | Optional | Decimal | Latitude (-90 to +90) | `32.1872` | Geofence center latitude |
| `room_long` | Optional | Decimal | Longitude (-180 to +180) | `76.2415` | Geofence center longitude |
| `geofence_radius_meters` | Optional | Integer | Default `30`, range 5–500 | `30` | Presence boundary in meters |
| `academic_year` | **Yes** | String | `YYYY-YYYY` | `2026-2027` | Academic calendar year |

### Sample CSV Row:
```csv
department_code,semester,section,day_of_week,start_time,end_time,subject_code,employee_code,room_code,room_lat,room_long,geofence_radius_meters,academic_year
CSE,6,A,Monday,09:30 AM,10:25 AM,CS-601,FAC-001,LH-101,32.1872,76.2415,30,2026-2027
```

---

## 8. Sessional & Mid-Term Marks (`sessional_marks`)

| Column Header | Required | Data Type | Validation Rule | Example Value | Description |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `roll_no` | **Yes** | String | Must exist in Students Master | `22CSE001` | Student roll number |
| `subject_code` | **Yes** | String | Must exist in Subjects Master | `CS-601` | Subject code |
| `assessment_name` | **Yes** | String | Assessment title | `Mid Term Exam` | Evaluation title |
| `assessment_type` | **Yes** | String | `sessional`, `mid_sem`, `quiz`, `lab` | `sessional` | Assessment category |
| `obtained_marks` | **Yes** | Decimal | Range `0` to `max_marks` | `24.5` | Marks scored |
| `max_marks` | **Yes** | Decimal | Positive number > 0 | `30.0` | Maximum marks scale |
| `academic_year` | **Yes** | String | `YYYY-YYYY` | `2026-2027` | Academic session |

### Sample CSV Row:
```csv
roll_no,subject_code,assessment_name,assessment_type,obtained_marks,max_marks,academic_year
22CSE001,CS-601,Sessional Exam 1,sessional,24.5,30.0,2026-2027
```

---

## 9. Academic Results & Grades (`results_grades`)

| Column Header | Required | Data Type | Validation Rule | Example Value | Description |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `roll_no` | **Yes** | String | Must exist in Students Master | `22CSE001` | Student roll number |
| `semester` | **Yes** | Integer | 1 to 8 | `5` | Completed semester |
| `sgpa` | **Yes** | Decimal | Range `0.00` to `10.00` | `8.75` | Semester Grade Point Average |
| `cgpa` | **Yes** | Decimal | Range `0.00` to `10.00` | `8.60` | Cumulative Grade Point Average |
| `result_status` | **Yes** | String | `Pass`, `Fail`, `Backlog`, `Promoted` | `Pass` | Final semester result |
| `academic_year` | **Yes** | String | `YYYY-YYYY` | `2025-2026` | Academic year of exam |

### Sample CSV Row:
```csv
roll_no,semester,sgpa,cgpa,result_status,academic_year
22CSE001,5,8.75,8.60,Pass,2025-2026
```

---

## 10. User Account Invitations (`user_invitations`)

| Column Header | Required | Data Type | Validation Rule | Example Value | Description |
| :--- | :---: | :--- | :--- | :--- | :--- |
| `email` | **Yes** | Email | Valid RFC 5322 format | `aarav.sharma@hiet.ac.in` | Destination invitation email |
| `full_name` | **Yes** | String | 2–80 characters | `Aarav Sharma` | Legal name of user |
| `role` | **Yes** | String | `student`, `teacher`, `hod` | `student` | Granted platform role |
| `identifier` | **Yes** | String | Must match `roll_no` or `employee_code` | `22CSE001` | Roll number or Employee code |
| `department_code` | Optional | String | Valid department | `CSE` | Department affiliation |

> [!CAUTION]
> **No Plaintext Passwords:** Passwords must NOT be entered in this template. Invitations are dispatched with secure self-service activation tokens via the Supabase Auth Admin API.
