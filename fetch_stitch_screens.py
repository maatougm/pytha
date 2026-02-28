import urllib.request
import json
import time
import os

API_KEY = 'AQ.Ab8RN6KVww90cArcHgWeyXtiGW-QNxQ4zDbN4mX2wXkZRWStzQ'
PROJECT_ID = '18263562648051687417'
BASE_URL = 'https://stitch.googleapis.com/v1'

screens = [
    {'name': 'My Grades', 'prompt': 'My Grades screen for school management mobile app. Student view showing GPA summary, grade distribution chart, list of courses with current grades and percentages. Course cards show course name, teacher, grade letter and percentage, trend indicator. Filter by All Courses, Current Term, Past Terms. Deep blue primary color #1e1e8a. Clean academic aesthetic. React Native mobile 375px.'},
    {'name': 'My Attendance', 'prompt': 'My Attendance screen for school management mobile app. Student view with monthly calendar showing attendance status per day (green present, red absent, yellow late, blue excused). Summary statistics cards showing Present percentage, Absent days, Late days. List view of attendance history. Filter by Month, Term, Course. Deep blue primary color #1e1e8a. Clean calendar interface. React Native mobile 375px.'},
    {'name': 'Course Resources', 'prompt': 'Course Resources screen for school management mobile app. Student view showing resource folders and file list with filename, file type icon, size, upload date. Download buttons. File type colors: PDF red, DOC blue, IMG green, Video purple. Search bar. Filter by All, Documents, Videos, Images. Deep blue primary color #1e1e8a. File explorer aesthetic. React Native mobile 375px.'},
    {'name': 'Attendance Sessions', 'prompt': 'Attendance Sessions screen for school management mobile app. Teacher view showing list of scheduled classes for today. Each session card shows Class name, time, room, student count, status (Not Started gray, In Progress blue, Completed green). Create new session button. Session statistics. Filter by Today, This Week, All. Deep blue primary color #1e1e8a. Professional organized interface. React Native mobile 375px.'},
    {'name': 'Create Assignment', 'prompt': 'Create Assignment screen for school management mobile app. Teacher view with form fields: Assignment Title, Description, Course selector, Due Date picker, Points input, Assignment Type dropdown, Attachments upload area. Toggle switches for Allow late submissions, Enable peer review. Save Draft and Publish buttons. Deep blue primary color #1e1e8a. Clean form interface. React Native mobile 375px.'},
    {'name': 'Assignment Submissions', 'prompt': 'Assignment Submissions screen for school management mobile app. Teacher view showing list of student submissions with statistics: Total submissions, Graded, Pending, Late. Filter tabs: All, Submitted, Graded, Late, Missing. Each submission shows Student avatar, name, submission status (On Time green, Late amber, Missing red), submission date, Grade button. Deep blue primary color #1e1e8a. Clean organized list view. React Native mobile 375px.'},
    {'name': 'Class Roster', 'prompt': 'Class Roster screen for school management mobile app. Teacher view showing class info card with Subject, Grade level, Room, Schedule. List of enrolled students with avatar, full name, student ID, parent contact, status (Active, Inactive). Search bar. Filter by All, Active, Inactive. Add student button. Deep blue primary color #1e1e8a. Clean directory list view. React Native mobile 375px.'},
    {'name': 'Child Grades', 'prompt': 'Child Grades screen for school management mobile app. Parent view showing child selector dropdown, GPA summary card, grade distribution visualization, list of courses with grades for selected child. Recent grade changes highlighted. Compare with class average indicator. Deep blue primary color #1e1e8a, accent warm amber. Parent-friendly reassuring design. React Native mobile 375px.'},
    {'name': 'Child Attendance', 'prompt': 'Child Attendance screen for school management mobile app. Parent view showing child selector, monthly attendance summary with Present percentage, Absences, Tardies. Calendar view showing daily attendance (green present, red absent, yellow late, blue excused). Recent absences list. Alert for excessive absences. Deep blue primary color #1e1e8a. Parent-friendly calendar view. React Native mobile 375px.'},
    {'name': 'Child Assignments', 'prompt': 'Child Assignments screen for school management mobile app. Parent view showing child selector, segmented tabs: Upcoming, Overdue, Completed. List of assignments with title, course name, due date with countdown, status (Not Started, In Progress, Submitted, Graded), grade if available. Deep blue primary color #1e1e8a. Parent-friendly organized list. React Native mobile 375px.'},
    {'name': 'Course Management', 'prompt': 'Course Management screen for school management mobile app. Admin view showing total courses count, search bar, filter by Department, Grade Level, Status. List of courses with name, code, department, grade levels, number of classes, status toggle (Active/Inactive). Add New Course button. Deep blue primary color #1e1e8a. Professional admin interface. React Native mobile 375px.'},
    {'name': 'Class Management', 'prompt': 'Class Management screen for school management mobile app. Admin view showing statistics: Total classes, Active classes, Total students. Search and filter by Course, Teacher, Schedule, Status. List of classes with name, course, teacher avatar, schedule, room, enrolled count/capacity, status. Add New Class button. Deep blue primary color #1e1e8a. Admin dashboard aesthetic. React Native mobile 375px.'},
    {'name': 'User Invitations', 'prompt': 'User Invitations screen for school management mobile app. Admin view showing invite statistics: Sent, Accepted, Pending, Expired. Bulk invite section with Role selector, Email input, Message template, Send button. List of invitations with recipient email, role, sent date, status (Pending amber, Accepted green, Expired red). Deep blue primary color #1e1e8a. Clean admin form interface. React Native mobile 375px.'},
    {'name': 'System Settings', 'prompt': 'System Settings screen for school management mobile app. Admin view with settings categories: General, Academic Year, Grading, Attendance, Notifications, Security, Integrations. Each setting with toggle, input, or dropdown. Section headers with icons. Save Changes button. Deep blue primary color #1e1e8a. Settings interface like iOS system settings. React Native mobile 375px.'},
    {'name': 'Notifications Center', 'prompt': 'Notifications Center screen for school management mobile app. Segmented control tabs: All, Mentions, Messages, System, Grades. Notification list with sender avatar, title, preview text, timestamp, unread indicator. Swipe actions: Mark read, Dismiss. Grouped by date: Today, Yesterday, Earlier. Unread items have blue left border. Deep blue primary color #1e1e8a, mentions highlighted in amber. React Native mobile 375px.'},
    {'name': 'File Manager', 'prompt': 'File Manager screen for school management mobile app. Folder navigation breadcrumb, file list with thumbnails, file cards showing filename, size, upload date, owner, permission badge. Floating action button for upload. Swipe actions: download, share, delete. Search bar, filter chips: All, PDFs, Images, Documents. Deep blue primary color #1e1e8a. File type colors: PDF red, DOC blue, IMG green. Clean file explorer aesthetic. React Native mobile 375px.'},
]

headers = {
    'X-Goog-Api-Key': API_KEY,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

# Create output directory
os.makedirs('mobile/stitch-assets/screens', exist_ok=True)

print(f'Fetching {len(screens)} screens from Stitch...\n')
results = []

for i, screen in enumerate(screens, 1):
    print(f'{i}/{len(screens)}: {screen["name"]}...')
    
    data = json.dumps({
        'prompt': screen['prompt'],
        'device_type': 'MOBILE',
        'screen_type': 'DESIGN',
        'width': '780',
        'height': '1866'
    }).encode()
    
    req = urllib.request.Request(
        f'{BASE_URL}/projects/{PROJECT_ID}/screens:generate',
        data=data,
        headers=headers,
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req, timeout=180) as response:
            result = json.loads(response.read().decode())
            screen_id = result.get('id', 'unknown')
            print(f'  ✅ Generated! ID: {screen_id}')
            
            # Save result info
            results.append({
                'name': screen['name'],
                'id': screen_id,
                'downloadUrl': result.get('screenshot', {}).get('downloadUrl', ''),
                'htmlUrl': result.get('htmlCode', {}).get('downloadUrl', '')
            })
            
            # Download screenshot
            if result.get('screenshot', {}).get('downloadUrl'):
                img_req = urllib.request.Request(
                    result['screenshot']['downloadUrl'],
                    headers={'User-Agent': 'Mozilla/5.0'}
                )
                with urllib.request.urlopen(img_req, timeout=60) as img_resp:
                    safe_name = screen['name'].replace(' ', '_').lower()
                    with open(f'mobile/stitch-assets/screens/{safe_name}.png', 'wb') as f:
                        f.write(img_resp.read())
                print(f'  📸 Screenshot saved')
            
            # Download HTML
            if result.get('htmlCode', {}).get('downloadUrl'):
                html_req = urllib.request.Request(
                    result['htmlCode']['downloadUrl'],
                    headers={'User-Agent': 'Mozilla/5.0'}
                )
                with urllib.request.urlopen(html_req, timeout=60) as html_resp:
                    safe_name = screen['name'].replace(' ', '_').lower()
                    with open(f'mobile/stitch-assets/screens/{safe_name}.html', 'wb') as f:
                        f.write(html_resp.read())
                print(f'  💻 HTML saved')
            
            time.sleep(3)  # Rate limiting
    except Exception as e:
        print(f'  ❌ Error: {e}')
        results.append({'name': screen['name'], 'error': str(e)})

# Save summary
with open('mobile/stitch-assets/screens/summary.json', 'w') as f:
    json.dump(results, f, indent=2)

print(f'\n✅ Complete! Summary saved to mobile/stitch-assets/screens/summary.json')
