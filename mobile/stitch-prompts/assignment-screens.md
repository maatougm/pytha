# Google Stitch UI Design Prompts - Assignment Screens

## Overview
Detailed prompts for designing assignment management screens for a React Native mobile school management app (Pythagore/Minivirson). Follows Google Stitch AI UI design best practices.

**Design System:**
- Platform: React Native mobile app (iOS/Android)
- Primary Color: Deep blue (#1E3A5F)
- Success/Grades: Green (#22C55E)
- Late/Overdue: Red (#EF4444)
- Background: White/Light gray (#F8FAFC)
- Style: Clean, organized, data-focused, educational

---

## Prompt 1: Assignments List Screen

```
Assignments List Screen for student mobile learning app

Key Features:
- Horizontal filter tabs at top: "All", "Pending", "Submitted", "Graded", "Late" with active state indicator (deep blue underline)
- Assignment cards in vertical scrollable list with:
  - Assignment title (bold, 16px) - e.g., "Calculus Homework Chapter 5"
  - Course name subtitle (gray, 14px) - e.g., "Mathematics 101"
  - Due date with calendar icon (14px) - e.g., "Due Tomorrow, 11:59 PM"
  - Status badge (pill-shaped) - colors: blue (pending), green (submitted), purple (graded), red (late)
  - Priority/urgency indicator: Orange dot + "Due Soon" label for assignments due within 24 hours
  - Red alert banner for overdue assignments with warning icon
- Pull-to-refresh gesture with loading spinner animation
- Floating action button (FAB) at bottom right for quick assignment creation (teacher view) or view submitted work (student view)
- Empty state illustration with "No assignments found" message when filtered list is empty
- Skeleton loading state with 3 shimmer placeholder cards while data loads
- Search bar at top with filter icon for course-based filtering
- Header with "Assignments" title and notification bell icon with badge

Visual Style:
- Clean card-based layout with subtle shadows (2dp elevation)
- White cards on light gray background (#F8FAFC)
- Deep blue (#1E3A5F) for primary text and active states
- Green (#22C55E) for success/submitted states
- Red (#EF4444) for late/overdue states
- Orange (#F97316) for urgent/due-soon indicators
- Generous padding (16px) between cards for readability
- Modern sans-serif typography (Inter/Roboto style)

Platform: React Native mobile (375px width, iOS-style status bar)
```

---

## Prompt 2: Assignment Detail/Submission Screen

```
Assignment Detail and Submission Screen for student mobile learning app

Key Features:
- Header section with:
  - Back arrow button in top-left
  - Assignment title (20px, bold, deep blue)
  - Course chip/badge below title
  - Due date countdown timer: "Due in 2 days, 4 hours" (red if < 24 hours, green if submitted)
- Scrollable content area with:
  - Assignment description section with rich text instructions
  - "Instructions" label (14px, uppercase, gray)
  - Bulleted list of requirements
  - Attached files section with document thumbnails (PDF icon + filename)
  - Points possible badge (e.g., "100 points")
- File upload area:
  - Large dashed border box with upload icon
  - "Tap to select files" or "Drag files here" text
  - Supported formats hint: "PDF, DOC, DOCX, Images up to 10MB"
  - File preview chips showing selected files with remove (X) button
  - Progress bar animation during upload
- Submission history section:
  - "Submission History" header
  - List of previous submissions with timestamps
  - Status for each: "Submitted on Oct 15, 2:30 PM", "Graded: 85/100"
  - Teacher feedback bubble if graded
- Bottom action bar (sticky):
  - Primary "Submit Assignment" button (full-width, deep blue, rounded corners)
  - Disabled state with "Submission Closed" if past deadline
  - Secondary "Save Draft" button (outline style)
- Confirmation modal overlay:
  - "Ready to submit?" title
  - File count confirmation
  - "Submit" and "Cancel" buttons
- Empty state: "No description provided" with placeholder icon
- Loading state: Skeleton placeholders for description and upload area

Visual Style:
- Clean white background with section dividers (light gray lines)
- Deep blue (#1E3A5F) for primary actions and headers
- Green (#22C55E) for success states and submitted status
- Red (#EF4444) for urgent countdown and errors
- Upload area: Light blue (#EFF6FF) dashed border background with blue icon
- Teacher feedback bubble: Light green (#F0FDF4) background with green border
- Cards with subtle rounded corners (12px radius) and soft shadows
- Ample white space between sections (24px)

Platform: React Native mobile (375px width, iOS/Android native components)
```

---

## Prompt 3: Gradebook/Grades Screen

```
Gradebook Dashboard Screen for student and teacher mobile learning app

Key Features:
- Segmented control at top to toggle between "Student View" and "Teacher View"

STUDENT VIEW:
- Overall GPA card at top:
  - Large GPA number (48px, bold, deep blue)
  - "Current Semester GPA" label
  - Trend indicator arrow (up/down) with percentage change
  - Circular progress ring showing grade distribution
- Course grades list:
  - Expandable course cards with:
    - Course name and code
    - Current letter grade (A, B+, C, etc.) in colored circle badge
    - Percentage score
    - Trend sparkline mini-chart showing grade progression
    - Expand arrow indicator
  - Expanded state shows:
    - Assignment breakdown table: Name | Score | Points | Grade
    - Assignment type categorization (Homework, Quiz, Exam, Project)
    - Color-coded rows: Green (90%+), Yellow (70-89%), Red (<70%)
- Visual charts section:
  - Bar chart: Grade distribution across all courses
  - Line chart: Grade trends over time (last 10 assignments)
  - Pie chart: Assignment category weight distribution
- Empty state: "No grades yet" with illustration and "Check back after your first assignment is graded"

TEACHER VIEW (Class Gradebook):
- Class selector dropdown at top
- Summary stats row:
  - Class average (large number)
  - Total students
  - Assignments count
  - Students failing count (red if > 0)
- Class roster list:
  - Student photo/avatar, name, current grade
  - Color-coded grade badges (green A/B, yellow C, red D/F)
  - Unread submission indicator (blue dot)
  - Expandable row for individual student detail
- Bulk grade entry mode:
  - Input fields inline for quick grading
  - "Save All" floating button
  - Validation checks (red outline for invalid entries)
- Filter options:
  - Sort by: Name, Grade (high/low), Last submission
  - Filter by: Missing submissions, Failing grades, Recently submitted
- Export button (top right) for CSV/Excel download

Visual Style:
- Data-focused dashboard aesthetic with clear information hierarchy
- Deep blue (#1E3A5F) for headers and primary data
- Grade colors: Green (#22C55E) for A/B, Yellow (#EAB308) for C, Red (#EF4444) for D/F
- Charts: Deep blue bars/lines with gradient fills
- Card backgrounds: White with subtle shadows
- Light gray (#F1F5F9) alternating row backgrounds for readability
- Student avatars: Circular with initials or photos
- Touch-friendly tap targets (min 44px)
- Segmented control: Deep blue active state, gray inactive

Platform: React Native mobile (375px width, supports horizontal scroll for wide tables)

Interactive States:
- Empty state: Centered illustration with CTA button
- Loading state: Skeleton cards and shimmer chart placeholders
- Error state: Retry button with error message
- Pull-to-refresh for updated grades
```

---

## Design Notes for Developers

### Common Components to Extract
1. **Status Badge** - Reusable pill component with color variants
2. **Assignment Card** - Base card component with consistent shadows
3. **Empty State** - Illustration + message + optional CTA
4. **Skeleton Loader** - Shimmer effect placeholder
5. **Countdown Timer** - Dynamic time display component
6. **File Upload Box** - Dashed border upload area
7. **Grade Badge** - Circular letter grade indicator

### Color Palette Reference
| Purpose | Hex | Usage |
|---------|-----|-------|
| Primary | #1E3A5F | Headers, buttons, active states |
| Success/Good | #22C55E | Submitted, passing grades, success |
| Late/Urgent | #EF4444 | Overdue, failing grades, errors |
| Warning | #F97316 | Due soon, medium priority |
| Background | #F8FAFC | Screen background |
| Card | #FFFFFF | Card backgrounds |
| Text Primary | #1F2937 | Main text |
| Text Secondary | #6B7280 | Subtitles, hints |
| Border | #E5E7EB | Dividers, borders |

### Typography Scale
- Header Title: 20px Bold
- Section Headers: 16px Semi-bold
- Card Titles: 16px Bold
- Body Text: 14px Regular
- Captions/Labels: 12px Regular
- Large Numbers (GPA): 48px Bold

### Accessibility Considerations
- Minimum touch target: 44x44px
- Color contrast ratio: 4.5:1 minimum
- Status indicators use both color AND icons/text
- Screen reader labels for all interactive elements

---

## Next Steps

1. Copy each prompt into Google Stitch (https://stitch.withgoogle.com)
2. Generate initial designs
3. Use Stitch's annotation feature to refine specific elements
4. Export to Figma or HTML/CSS for developer handoff
5. Iterate based on user testing feedback

---

*Generated for Pythagore/Minivirson School Hub Mobile App*
*Platform: React Native | Design Tool: Google Stitch AI*
