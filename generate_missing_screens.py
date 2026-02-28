import urllib.request
import json
import time
import os

API_KEY = 'AQ.Ab8RN6KVww90cArcHgWeyXtiGW-QNxQ4zDbN4mX2wXkZRWStzQ'
PROJECT_ID = '18263562648051687417'
BASE_URL = 'https://stitch.googleapis.com/v1'

# Missing screens based on priority list
missing_screens = [
    {
        'name': 'Assignment Submission Detail',
        'filename': 'assignment_submission_detail',
        'prompt': 'Assignment Submission Detail screen for school management mobile app. Teacher view showing student submission details: student info card with avatar and name, submission timestamp, file attachments with download buttons, submitted text content in a card, grade input field with slider, feedback textarea, rubric checklist with points. Approve/Reject buttons at bottom. Deep blue primary color #1E3A8A, amber accent #F59E0B. Clean professional grading interface. React Native mobile 375px.'
    },
    {
        'name': 'User Directory',
        'filename': 'user_directory',
        'prompt': 'User Directory screen for school management mobile app. School-wide people browser with search bar at top, filter chips by role (All, Teachers, Students, Parents, Admins), alphabetical section headers, user list with avatar, full name, role badge (colored: Teacher=teal, Student=blue, Parent=purple, Admin=red), department or grade info. Quick actions: message button, view profile button. Deep blue primary color #1E3A8A. Clean directory interface. React Native mobile 375px.'
    },
    {
        'name': 'Help Support',
        'filename': 'help_support',
        'prompt': 'Help & Support screen for school management mobile app. FAQ accordion list with categories (Getting Started, Account, Messaging, Grades, Technical Issues), search bar at top, contact support card with email and chat options, documentation links, video tutorials section with thumbnail grid, report a problem button at bottom. Deep blue primary color #1E3A8A. Support/help center aesthetic. React Native mobile 375px.'
    },
    {
        'name': 'Course Creation',
        'filename': 'course_creation',
        'prompt': 'Course Creation screen for school management mobile app. Admin/Teacher form for creating new course: Course Name input, Course Code input, Department dropdown, Grade Level selector (checklist), Description textarea, Assign Teachers (multi-select with chips), Course Image upload area, Credit Hours input, Prerequisites selection, Save as Draft and Publish buttons. Deep blue primary color #1E3A8A, amber accent #F59E0B. Clean form interface. React Native mobile 375px.'
    },
    {
        'name': 'Bulk User Import',
        'filename': 'bulk_user_import',
        'prompt': 'Bulk User Import screen for school management mobile app. Admin interface for importing users: Upload CSV/Excel file area with drag-drop zone, download template button, role selector (Student/Teacher/Parent), preview table showing imported data with validation status (valid green, error red), row count stats, progress bar during upload, Import and Cancel buttons. Deep blue primary color #1E3A8A. Data import interface. React Native mobile 375px.'
    },
    {
        'name': 'System Announcements',
        'filename': 'system_announcements',
        'prompt': 'System Announcements screen for school management mobile app. Admin broadcast message center: New Announcement button at top, list of sent announcements with title, message preview, target audience badge (All, Teachers, Parents, Students), send date, status (Sent/Draft), priority indicator (High red, Normal gray). Create new form with Title input, Message textarea, Target Audience checkboxes, Priority toggle, Schedule send datetime picker. Deep blue primary color #1E3A8A, red for urgent. Admin interface. React Native mobile 375px.'
    },
    {
        'name': 'Full Calendar Schedule',
        'filename': 'full_calendar',
        'prompt': 'Full Calendar Schedule screen for school management mobile app. Weekly/Monthly calendar view with events: Calendar grid showing days, color-coded events (Classes blue, Exams red, Events amber, Holidays green), time slots, all-day events bar at top, filter by event type, Today button, navigation arrows for month/week switch, list view toggle, event details popup preview. Deep blue primary color #1E3A8A. Clean calendar interface like Google Calendar. React Native mobile 375px.'
    },
    {
        'name': 'Global Search',
        'filename': 'global_search',
        'prompt': 'Global Search screen for school management mobile app. Universal search interface: Large search bar with microphone icon, recent searches chips, categorized results sections (Courses, People, Messages, Files), each result with icon, title, subtitle, highlighted matching text, filter tabs (All, Courses, People, Files, Messages), empty state illustration, quick filters. Deep blue primary color #1E3A8A. Clean search interface like spotlight. React Native mobile 375px.'
    },
]

headers = {
    'X-Goog-Api-Key': API_KEY,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
}

os.makedirs('mobile/stitch-assets/new-screens', exist_ok=True)

print(f'Generating {len(missing_screens)} missing screens from Stitch...\n')

for i, screen in enumerate(missing_screens, 1):
    print(f'{i}/{len(missing_screens)}: {screen["name"]}...')
    
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
            print(f'  Generated! ID: {screen_id}')
            
            # Download screenshot
            if result.get('screenshot', {}).get('downloadUrl'):
                img_req = urllib.request.Request(
                    result['screenshot']['downloadUrl'],
                    headers={'User-Agent': 'Mozilla/5.0'}
                )
                with urllib.request.urlopen(img_req, timeout=60) as img_resp:
                    with open(f'mobile/stitch-assets/new-screens/{screen["filename"]}.png', 'wb') as f:
                        f.write(img_resp.read())
                print(f'  Screenshot saved')
            
            # Download HTML
            if result.get('htmlCode', {}).get('downloadUrl'):
                html_req = urllib.request.Request(
                    result['htmlCode']['downloadUrl'],
                    headers={'User-Agent': 'Mozilla/5.0'}
                )
                with urllib.request.urlopen(html_req, timeout=60) as html_resp:
                    with open(f'mobile/stitch-assets/new-screens/{screen["filename"]}.html', 'wb') as f:
                        f.write(html_resp.read())
                print(f'  HTML saved')
            
            time.sleep(3)
    except Exception as e:
        print(f'  Error: {e}')

print('\nDone! Check mobile/stitch-assets/new-screens/')
