# School Hub - Messaging Screens Stitch Prompts

> **Project:** School Hub (Minivirson) - School Messaging System  
> **Platform:** React Native Mobile App  
> **Style:** Modern messaging (WhatsApp/Slack inspired, clean aesthetic)  
> **Primary Color:** Deep Blue (#1e1e8a)  
> **Background:** Light/White backgrounds  

---

## Prompt 1: Channel List Screen

```
Channel List Screen for School Hub Messaging App

Key Features:
- Header bar with "Messages" title and search icon, new chat button
- Channel list with 8-10 sample channels showing different states
- Each channel item: avatar/icon, channel name, last message preview (truncated), timestamp
- Unread message badges: circular red badges with white number (2, 5, 99+)
- Channel type icons: classroom (book icon), teacher-parent (people icon), broadcast (megaphone icon), direct message (user icon)
- Online status indicators: green dot for active channels
- Last message preview showing @mention highlighting (blue text for @username)
- Swipe actions: mute, pin, delete (optional visual indicator)
- Empty state: "No messages yet" with illustration
- Bottom navigation bar: Home, Messages (active), Courses, Profile

Visual Style:
- Clean, modern messaging interface inspired by WhatsApp and Slack
- Primary color: Deep blue (#1e1e8a) for headers, active states, and accents
- Background: Pure white (#FFFFFF) for channel list area
- Channel item background: White with subtle gray border separator
- Unread badges: Vibrant red (#FF3B30) with white text
- Timestamp text: Medium gray (#8E8E93)
- Message preview text: Dark gray (#3C3C43) for read, black for unread
- @mention highlighting: Primary blue (#1e1e8a) text color
- Channel type icons: Outlined style, primary blue color
- Online indicator: Bright green (#34C759) dot with white border
- Typography: System font (SF Pro style), 17pt title, 15pt channel name, 13pt preview

Platform: React Native iOS mobile app (375px width, iPhone style)
```

---

## Prompt 2: Chat/Message Thread Screen

```
Chat Screen for School Hub Messaging App

Key Features:
- Header: Back button, channel name "Classroom 10A - Math", member count, info button
- Message thread with alternating sent/received bubbles
- Sent messages: Right-aligned, deep blue (#1e1e8a) background, white text
- Received messages: Left-aligned, light gray (#F2F2F7) background, black text
- Message bubble content: Text, file attachments with thumbnails (PDF icon, image preview)
- @mention highlighting: Primary blue text within messages, bold weight
- Typing indicator: Three animated dots, "Teacher is typing..." text below
- Read receipts: Double checkmarks, blue when read, gray when delivered
- Message reactions: Emoji badges below messages (👍 3, ❤️ 1)
- Timestamps: Small gray text between message groups ("Today, 2:30 PM")
- Quick reply suggestions: Horizontal scroll of chip buttons above input ("Thanks!", "Got it", "I'll check")
- Message input bar: Text field with placeholder, attachment button, send button (blue when active)
- File preview: Thumbnail for images, document icon with filename for PDFs
- Voice message indicator: Waveform visualization for audio messages
- Date separators: "Yesterday", "Today" labels centered between days

Visual Style:
- Modern chat interface, clean and spacious
- Sent bubble: Deep blue (#1e1e8a) fill, 16pt white text, rounded corners (18px radius, tail on right)
- Received bubble: Light gray (#F2F2F7) fill, 16pt black text, rounded corners (18px radius, tail on left)
- @mention text: Primary blue (#1e1e8a), font-weight 600
- Link previews: Card with thumbnail, title, description below message
- File attachment cards: White background, blue icon, filename, file size
- Typing indicator: Light gray bubble with three pulsing dots
- Input bar: White background, light gray border, rounded input field
- Send button: Blue (#1e1e8a) when text entered, gray when empty
- Reaction badges: White background, light border, emoji + count
- Scroll indicator: Thin blue scrollbar on right

Platform: React Native iOS mobile app (375px width), full screen chat view
```

---

## Prompt 3: Channel Info/Details Screen

```
Channel Info Screen for School Hub Messaging App

Key Features:
- Header: Back button, "Channel Info" title, edit button (if admin)
- Channel header section: Large circular channel icon/avatar, channel name, channel type badge
- Channel stats: Member count, message count, creation date row
- Action buttons row: Mute notifications toggle, Pin channel toggle, Search in chat
- Members section: 
  - Section header "Members (24)" with add member button
  - Scrollable list of member avatars with names and roles
  - Role badges: "Admin" (red), "Teacher" (blue), "Parent" (green), "Student" (gray)
  - Online status dots on member avatars
- Media, links, and docs section: Grid preview of shared files (3x2 grid)
- Settings section:
  - Mute notifications toggle with duration options (1 hour, 8 hours, 1 week)
  - Pin to top toggle
  - Starred messages link
- Danger zone section:
  - Report channel button with warning icon
  - Leave channel button (red text)
  - Delete channel button (admin only, red destructive style)
- Channel description: "Classroom discussion for Math 10A. Please keep messages school-related."

Visual Style:
- Clean settings-style layout with grouped sections
- Header background: Light gradient from deep blue (#1e1e8a) to lighter blue
- Channel avatar: 80px circle, white background, blue icon or initials
- Channel type badge: Small pill-shaped label, blue background, white text
- Section headers: All caps, gray (#8E8E93), 13pt, letter-spacing 0.5px
- Member list: Circular avatars (40px), name in black, role badge to right
- Role badges: Small pills with distinct colors (Admin=#FF3B30, Teacher=#1e1e8a, Parent=#34C759, Student=#8E8E93)
- Toggle switches: iOS style, blue when on (#1e1e8a), gray when off
- Action buttons: Blue icon left, black text, right chevron
- Danger buttons: Red icon (#FF3B30), red text
- Media grid: 60px thumbnails, rounded corners, document icons for non-images
- Dividers: Light gray (#E5E5EA) hairline separators
- Background: White with grouped table view style (light gray section backgrounds)

Platform: React Native iOS mobile app (375px width), scrollable screen
```

---

## Additional Design Notes for All Screens

### Common UI Elements
- **Status Bar:** Dark icons on light background
- **Navigation:** iOS-style back buttons, clear hierarchy
- **Touch Targets:** Minimum 44x44pt for all interactive elements
- **Spacing:** 16pt horizontal padding, 12pt vertical spacing between items

### Interaction States
- **Pressed States:** 10% opacity overlay on tap
- **Selected States:** Light blue (#E3E8FF) background highlight
- **Disabled States:** 50% opacity, grayed out

### Accessibility Considerations
- Color contrast ratio 4.5:1 minimum for text
- Screen reader labels for all icons
- Dynamic type support (scalable fonts)
- VoiceOver-compatible element grouping

### Export Requirements
- Export to Figma for design system integration
- Provide component specs: colors, typography, spacing values
- Include dark mode variants (optional future iteration)

---

*Generated for Google Stitch UI Design Tool*  
*Project: School Hub (Minivirson) - School Messaging System*
