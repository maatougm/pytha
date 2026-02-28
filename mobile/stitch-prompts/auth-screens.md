# Google Stitch UI Design Prompts - Authentication Screens

> **Project:** School Hub (Pythagore/Minivirson) - School Messaging System  
> **Platform:** React Native Mobile App (iOS/Android)  
> **Style:** Modern, clean, trustworthy education app  
> **Primary Color:** Deep Blue (#1e1e8a)  
> **Accent Color:** Amber (#f59e0b)

---

## Screen 1: Login Screen

```
Login Screen for School Hub Education App

Key Features:
- Header section with school/education app logo and tagline "Connect. Learn. Grow."
- Email input field with envelope icon, placeholder "Enter your email address"
- Password input field with lock icon, eye toggle for show/hide password
- Role selector dropdown with 4 options: Admin (shield icon), Teacher (book icon), Parent (users icon), Student (graduation cap icon)
- "Remember me" checkbox with persistent login option
- Primary CTA button "Sign In" with full width, loading spinner state
- "Forgot Password?" text link below the form
- "Don't have an account? Sign Up" secondary action at bottom
- Form validation states: red error messages below invalid fields, green checkmarks for valid input
- Loading state: button shows spinner, inputs disabled with reduced opacity
- Error handling: inline error banners for authentication failures with dismiss button
- Biometric authentication option (Face ID/Touch ID) below password field
- Keyboard-aware layout with scrollable content area

Visual Style:
- Deep blue (#1e1e8a) as primary color for header background, primary buttons, and active states
- Amber (#f59e0b) as accent color for focus states, success indicators, and secondary highlights
- Clean white background (#ffffff) for main content area with subtle gray (#f8fafc) form field backgrounds
- Modern sans-serif typography (Inter or SF Pro style) with clear hierarchy
- Rounded corners (12px) on all input fields and buttons for friendly, approachable feel
- Subtle shadows (0 2px 8px rgba(0,0,0,0.08)) on input fields and cards
- Trust-building education aesthetic with subtle geometric patterns or abstract shapes in header
- Accessible touch targets minimum 44px height for all interactive elements

Platform: React Native mobile app for iOS and Android (375px width viewport, full-screen immersive design)
```

---

## Screen 2: Role Selection Screen

```
Role Selection Screen for School Hub Multi-User Registration

Key Features:
- Header with "Choose Your Role" title and subtitle "Select how you'll use School Hub"
- 4 large, tappable role cards arranged in a 2x2 grid layout:
  * Admin card: Shield icon, "Administrator" title, "Manage school operations" description
  * Teacher card: Book icon, "Teacher" title, "Create courses & assignments" description
  * Parent card: Users icon, "Parent" title, "Track your child's progress" description
  * Student card: Graduation cap icon, "Student" title, "Access courses & submit work" description
- Each card has selected state (filled background, colored border) and unselected state (outlined, gray)
- Selected role shows amber (#f59e0b) accent border and subtle blue (#1e1e8a) background tint
- Continue button at bottom, disabled until role selected, enabled with full opacity
- "Already have an account? Sign In" link at bottom
- Brief tooltip/info icon on each card explaining role permissions on tap
- Smooth animations on card selection (scale 1.02, border transition)
- Error state if user tries to continue without selection (shake animation + message)
- Back button in top-left for returning to previous step

Visual Style:
- Deep blue (#1e1e8a) for header background and selected card accent
- Amber (#f59e0b) for selected state borders, icons, and highlights
- White (#ffffff) card backgrounds with subtle elevation shadows
- Light gray (#f1f5f9) for unselected card borders and backgrounds
- Large, friendly icons in each card using amber accent color
- Generous spacing between cards (16px gap) for easy tap targets
- Modern card-based design with 16px border radius
- Typography: Bold 18px for card titles, regular 14px for descriptions
- Subtle gradient overlay on header from deep blue to slightly lighter blue
- Clean, trustworthy education aesthetic with professional iconography

Platform: React Native mobile app for iOS and Android (375px width viewport, centered content with safe area insets)
```

---

## Screen 3: Forgot Password Screen

```
Forgot Password Screen for School Hub Password Recovery

Key Features:
- Header illustration or icon (key/lock with arrow) indicating password recovery
- "Forgot Password?" large title with supporting text "Enter your email and we'll send you instructions to reset your password"
- Email input field with envelope icon, validation for valid email format
- "Send Reset Link" primary CTA button with full width
- Loading state: button shows spinner, "Sending..." text, input disabled
- Success state: green checkmark icon, "Check your email!" message, email preview card showing recipient
- Error states:
  * Invalid email: red inline message "Please enter a valid email address"
  * Email not found: red banner "We couldn't find an account with that email"
  * Network error: retry button with "Try Again" option
- Back to Login link with arrow icon at top-left
- "Didn't receive it? Resend" option available 30 seconds after initial send (countdown timer)
- Security note at bottom: "For security, password reset links expire in 1 hour"
- Alternative help option: "Need help? Contact support" link
- Input field clears and refocuses on error for retry

Visual Style:
- Deep blue (#1e1e8a) for header background, primary button, and icons
- Amber (#f59e0b) for success states, accent highlights, and loading spinner
- Success green (#22c55e) for checkmarks and success messages
- Error red (#ef4444) for validation errors and error banners
- White (#ffffff) main content background with card-like form container
- Light gray (#f8fafc) for input field backgrounds
- Rounded design language: 16px corners on cards, 12px on buttons
- Subtle animations: fade-in for success state, shake for errors
- Clean, reassuring design that builds trust for sensitive password recovery flow
- Generous padding (24px) around content for breathing room
- Typography hierarchy: 24px bold title, 16px regular body text, 14px helper text

Platform: React Native mobile app for iOS and Android (375px width viewport, centered form with keyboard handling)
```

---

## Design System Notes

### Color Palette
| Token | Hex | Usage |
|-------|-----|-------|
| Primary | #1e1e8a | Headers, primary buttons, active states, links |
| Accent | #f59e0b | Highlights, success states, selected items, icons |
| Success | #22c55e | Valid input, success messages, confirmations |
| Error | #ef4444 | Validation errors, error banners, failed states |
| Background | #ffffff | Main content backgrounds |
| Surface | #f8fafc | Input backgrounds, card backgrounds |
| Border | #e2e8f0 | Input borders, dividers, unselected states |
| Text Primary | #1e293b | Headlines, primary text |
| Text Secondary | #64748b | Descriptions, placeholders, hints |

### Typography Scale
| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 (Screen Title) | 24px | Bold (700) | 32px |
| H2 (Card Title) | 18px | SemiBold (600) | 24px |
| Body | 16px | Regular (400) | 24px |
| Caption | 14px | Regular (400) | 20px |
| Small | 12px | Medium (500) | 16px |

### Spacing Scale
- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px

### Component Specifications
- **Buttons:** Full width on mobile, 48px height, 12px border radius
- **Input Fields:** Full width, 56px height, 12px border radius, 16px horizontal padding
- **Cards:** 16px border radius, subtle shadow (0 2px 8px rgba(0,0,0,0.08))
- **Icons:** 24px default size, amber accent color

---

## Export & Implementation Notes

1. **Generate in Stitch:** Use these prompts to generate each screen in Google Stitch
2. **Export Options:**
   - Export to Figma for design system integration
   - Export HTML/CSS for React Native style reference
   - Use "Paste to Figma" for team collaboration
3. **React Native Considerations:**
   - Use `react-native-paper` or custom components matching generated designs
   - Implement `KeyboardAvoidingView` for input screens
   - Add `ActivityIndicator` for loading states
   - Use `react-native-vector-icons` for iconography
   - Implement `react-hook-form` or similar for validation logic

---

*Generated following Google Stitch UI Design Skill guidelines*
*For: School Hub (Pythagore/Minivirson) Mobile Application*
