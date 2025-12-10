# Manual Entry v2.7 - User Stories

## Overview
User stories for the Manual Entry athletic measurement data collection application, organized by functional area.

### Components Summary
- **Event Setup**: Configuration and initialization of measurement events
- **Registration**: Participant roster management and check-in
- **Body Measures**: Physical measurement data collection with double-entry validation
- **Data Capture**: Multiple view modes and data entry workflows
- **Options**: Export, settings, interface optimization, and system features

---

## 1. EVENT SETUP

**Note:** All events are created via the event management portal. The Manual Entry app loads event details from the portal.

---

### US-ES-002: Import Participant Roster
**As an** operator  
**I want to** import a CSV file containing participant information  
**So that** I can quickly load all participants without manual entry

**Acceptance Criteria:**
- System accepts CSV files with columns: ID, Name, Gender
- Names with special characters (apostrophes, commas) are handled correctly
- Invalid CSV format shows clear error message
- System validates required columns exist
- All imported participants display in roster grid

---

### US-ES-003: Configure Measurement Units
**As an** operator  
**I want to** select measurement units (metric or imperial) for each measurement type  
**So that** I can use the appropriate units for my region and equipment

**Acceptance Criteria:**
- Height measurements: Inches or Centimeters
- Jump/Distance measurements: Inches or Centimeters
- Weight: Pounds (fixed)
- Hand measurements: Inches (fixed)
- Unit selection persists throughout session
- Units can be changed via settings after event starts

---

### US-ES-004: Configure Measurement Adjustments
**As an** operator  
**I want to** set gender-specific adjustment values for each measurement type  
**So that** I can apply systematic corrections for equipment calibration or standardization

**Acceptance Criteria:**
- Separate adjustment values for Male and Female participants
- Adjustments accept positive and negative decimal values
- Default adjustment value is 0 (no adjustment)
- Adjustments can be configured for all 10 measurement types
- Changes save automatically
- Adjustments are applied to all measurements during data collection and export

---

### US-ES-005: Resume Previous Session
**As an** operator  
**I want to** automatically resume my last session when I reopen the app  
**So that** I don't lose work if the browser closes or device restarts

**Acceptance Criteria:**
- App automatically restores previous session state
- All measurements and settings are preserved
- Roster and check-in status are maintained
- Works after browser closure and device restart
- User can start fresh event if desired via reset function

---

### US-ES-006: Reset Application for New Event
**As an** operator  
**I want to** clear all data and start fresh for a new event  
**So that** I can reuse the same device for multiple events

**Acceptance Criteria:**
- Reset function is password protected (password: 00000)
- All measurements, roster, and settings are cleared
- App returns to startup screen
- User is warned before data deletion
- Exported files are not deleted

---

## 2. REGISTRATION

### US-REG-001: View Participant Roster
**As an** operator  
**I want to** view all participants in a grid layout  
**So that** I can easily see who needs measurements

**Acceptance Criteria:**
- All participants display in grid format
- Each card shows participant name, ID, and gender
- Visual indicators show completion status
- Grid is responsive to different screen sizes
- Participant cards are touch-friendly for iPad use

---

### US-REG-002: Search for Participants
**As an** operator  
**I want to** filter the roster by name  
**So that** I can quickly find specific participants

**Acceptance Criteria:**
- Real-time search as user types
- Search matches partial names
- Clear button resets filter
- All participants return when filter is cleared
- Search is case-insensitive

---

### US-REG-003: Add New Participant
**As an** operator  
**I want to** add a participant who isn't in the original roster  
**So that** I can measure walk-ins or late additions

**Acceptance Criteria:**
- Simple form with fields: ID, Name, Gender
- New participant immediately appears in roster
- ID can be left blank for auto-generation
- Gender affects which adjustments are applied
- New participants are included in exports

---

### US-REG-004: Check-In Participants
**As an** operator  
**I want to** mark participants as present or absent  
**So that** I can track attendance and organize measurement flow

**Acceptance Criteria:**
- Dedicated check-in view with all participants
- Toggle between Present (green) and Absent (red)
- Edit mode prevents accidental changes
- Check-in status persists when returning to roster
- Status is included in data export

---

### US-REG-005: View Participant Details
**As an** operator  
**I want to** select a participant to view their full profile  
**So that** I can see all their information and measurements

**Acceptance Criteria:**
- Clicking participant card displays their details
- Shows all entered measurements
- Displays raw and adjusted values
- Shows completion status
- Provides clear navigation back to roster

---

### US-REG-006: Parent/Coach Waiver Signature
**As an** operator  
**I want to** collect parent or coach signature on liability waiver  
**So that** participants have proper authorization before measurements

**Acceptance Criteria:**
- Digital signature capture interface
- Signature associated with participant record
- Option to mark waiver as signed without digital capture
- Waiver status visible on participant card
- Signature included in export data
- Cannot begin measurements until waiver is signed

---

## 3. BODY MEASURES

### US-BM-001: Enter Height Measurements
**As an** operator  
**I want to** record height with shoes and without shoes  
**So that** I can capture standardized height measurements

**Acceptance Criteria:**
- Two separate input fields for each height type
- Each measurement requires double-entry validation
- Values display in selected units (inches or cm)
- Automatic conversion for height display (e.g., "6' 2\"")
- Adjustments automatically applied based on gender

---

### US-BM-002: Enter Reach and Wingspan Measurements
**As an** operator  
**I want to** record standing reach and wingspan  
**So that** I can capture arm length measurements

**Acceptance Criteria:**
- Separate input fields for reach and wingspan
- Double-entry validation required
- Values display in selected units
- Gender-specific adjustments applied
- Clear labels explain each measurement

---

### US-BM-003: Enter Weight Measurement
**As an** operator  
**I want to** record participant body weight  
**So that** I can capture weight data

**Acceptance Criteria:**
- Single weight input field
- Double-entry validation required
- Always measured in pounds
- Gender-specific adjustment applied
- Validates positive numbers only

---

### US-BM-004: Enter Hand Measurements
**As an** operator  
**I want to** record hand length and hand width  
**So that** I can capture hand size data

**Acceptance Criteria:**
- Separate fields for length and width
- Double-entry validation required
- Always measured in inches
- Gender-specific adjustments applied
- Clear measurement technique descriptions

---

### US-BM-005: Enter Jump Measurements
**As an** operator  
**I want to** record vertical jump, approach jump, and broad jump  
**So that** I can capture explosive power measurements

**Acceptance Criteria:**
- Three separate jump measurement fields
- Double-entry validation for each
- Values display in selected units (inches or cm)
- Gender-specific adjustments applied
- Clear labels distinguish each jump type

---

### US-BM-006: Double-Entry Validation
**As an** operator  
**I want to** enter each measurement twice to confirm accuracy  
**So that** I can minimize data entry errors

**Acceptance Criteria:**
- Each measurement requires two identical entries
- Green highlighting indicates matching entries
- Red highlighting indicates mismatched entries
- Auto-save when both entries match
- User can correct mismatched entries

---

### US-BM-007: Calculate Adjusted Values
**As an** operator  
**I want to** measurements automatically adjusted based on configured values  
**So that** standardized corrections are consistently applied

**Acceptance Criteria:**
- Formula: Final Value = Raw Measurement + Gender-Specific Adjustment
- Calculations performed automatically
- Both raw and adjusted values are stored
- Adjustments based on participant gender
- Calculations update if adjustments change

---

### US-BM-008: View Measurement Status
**As an** operator  
**I want to** see which measurements are complete for each participant  
**So that** I know what still needs to be collected

**Acceptance Criteria:**
- Visual indicators show complete vs. incomplete measurements
- Completion percentage displayed per participant
- Color coding shows status at a glance
- Status updates in real-time as measurements are entered
- Status included in roster view and spreadsheet view

---

### US-BM-009: 10-Key Numeric Input
**As an** operator  
**I want to** enter measurements using a 10-key numeric keypad  
**So that** I can input numeric data quickly and accurately

**Acceptance Criteria:**
- 10-key pad layout available for all measurement inputs
- Large, touch-friendly numeric buttons
- Decimal point key for fractional measurements
- Clear/backspace functionality
- Enter key submits value
- Works for both first and second entry in double-entry validation
- Can toggle between 10-key pad and standard keyboard input

---

## 4. DATA CAPTURE

### US-DC-001: Athlete View Mode
**As an** operator  
**I want to** enter all measurements for one participant at a time  
**So that** I can complete each athlete's profile sequentially

**Acceptance Criteria:**
- Individual focus on one participant
- All 10 measurement types visible
- Clear navigation between participants
- Progress tracking shows completion status
- Best for complete measurement sessions per person

---

### US-DC-002: Station View Mode
**As an** operator  
**I want to** enter one measurement type for multiple participants  
**So that** I can efficiently process participants through measurement stations

**Acceptance Criteria:**
- Focus on single measurement type
- Dropdown to select measurement type
- Dropdown to select participant
- Quick participant switching
- Best for specialized measurement stations and large groups

---

### US-DC-003: Switch Between View Modes
**As an** operator  
**I want to** toggle between Athlete View and Station View  
**So that** I can adapt to different workflow needs

**Acceptance Criteria:**
- View mode dropdown in controls section
- Selection persists throughout session
- Can switch at any time without data loss
- Measurements entered in either view are preserved
- Clear indication of current view mode

---

### US-DC-004: Spreadsheet Grid View
**As an** operator  
**I want to** view all participants and measurements in a spreadsheet format  
**So that** I can review data completeness and accuracy at a glance

**Acceptance Criteria:**
- Grid layout with participants as rows, measurements as columns
- Participant names fixed on left during horizontal scroll
- All measurement values visible
- Sortable columns
- Completion and check-in status indicators

---

### US-DC-005: Edit Measurements in Spreadsheet View
**As an** operator  
**I want to** edit measurements directly in the spreadsheet grid  
**So that** I can quickly correct errors without navigating to individual participants

**Acceptance Criteria:**
- Edit mode toggle to enable/disable editing
- Click cells to modify values
- Changes save automatically
- Validation still applies (positive numbers only)
- Visual feedback for successful edits

---

### US-DC-006: Auto-Save Measurements
**As an** operator  
**I want to** measurements saved automatically when validated  
**So that** I don't lose data if I forget to manually save

**Acceptance Criteria:**
- Auto-save triggers when double-entry validation passes
- Visual confirmation of successful save (toast message)
- Data persists immediately to local storage
- No manual save required for validated entries
- Manual save button available as backup

---

### US-DC-007: Add Comments/Notes
**As an** operator  
**I want to** add comments or notes to participant records  
**So that** I can document special circumstances or observations

**Acceptance Criteria:**
- Comments field available for each participant
- Comments are saved with measurement data
- Comments included in data export
- Comments can be edited at any time
- No character limit on comments

---

### US-DC-008: Offline Data Collection
**As an** operator  
**I want to** use the app without internet connection  
**So that** I can collect data in any location regardless of connectivity

**Acceptance Criteria:**
- App loads completely offline after initial online load
- All core functionality works without internet
- Data entry and validation work offline
- Local storage continues functioning
- No features disabled when offline

---

### US-DC-009: Session State Persistence
**As an** operator  
**I want to** my work saved automatically throughout the session  
**So that** I can close the browser or restart device without losing data

**Acceptance Criteria:**
- All changes save to local storage immediately
- App resumes exactly where user left off
- Measurements, settings, and view mode preserved
- Works after browser closure and device restart
- No manual save action required

---

## 5. OPTIONS

### US-OPT-001: Export Data to CSV
**As an** operator  
**I want to** export all measurements to a CSV file  
**So that** I can analyze data in spreadsheet applications

**Acceptance Criteria:**
- Export button generates comprehensive CSV file
- Includes all participant information
- Includes both raw and adjusted measurements
- Includes calculated values and metadata
- File naming convention: ManualEntry_[EventName]_[Timestamp].csv

---

### US-OPT-002: Email Data Export
**As an** operator  
**I want to** automatically email exported CSV files  
**So that** I can quickly share data with stakeholders

**Acceptance Criteria:**
- Export automatically opens email app on iPad
- CSV file pre-attached to email
- Uses device's native email functionality
- Works with iPad Mail app integration
- Fallback download to Downloads folder

---

### US-OPT-003: View Saved Export Files
**As an** operator  
**I want to** access previously exported files  
**So that** I can retrieve past exports without re-exporting

**Acceptance Criteria:**
- File management view accessible via settings
- Lists all saved export files
- Shows file name and export timestamp
- Can re-download files from list
- Can delete old files to manage storage

---

### US-OPT-004: Automatic File Backup
**As an** operator  
**I want to** app to automatically backup export files  
**So that** I have redundant copies in case of issues

**Acceptance Criteria:**
- App maintains backup copies of exports
- Last 10 exports kept automatically
- Backups stored in local browser storage
- Accessible via View Saved Files feature
- Older backups automatically deleted

---

### US-OPT-005: Modify Settings After Event Start
**As an** operator  
**I want to** access and modify measurement setup after starting the event  
**So that** I can adjust units or adjustments without restarting

**Acceptance Criteria:**
- Settings accessible via Settings button in header
- Measurement Setup option returns to configuration screen
- Current values are preserved and displayed
- Changes apply to future measurements
- Does not affect previously entered measurements

---

### US-OPT-006: View Application Version
**As a** user  
**I want to** see the current app version  
**So that** I know which version I'm using for support purposes

**Acceptance Criteria:**
- Version number displayed in app header
- Version included in export file metadata
- Current version: 2.7
- Version visible on all screens
- Helps with troubleshooting and support

---

### US-OPT-007: Touch-Optimized Interface
**As a** iPad user  
**I want to** large, touch-friendly interface elements  
**So that** I can easily interact with the app on a touchscreen

**Acceptance Criteria:**
- Large fonts (18px minimum)
- Touch-friendly buttons (min 48px height)
- Adequate spacing between interactive elements
- No need for precise pointer control
- Optimized for iPad screen sizes

---

### US-OPT-008: Error Messages and Validation Feedback
**As a** user  
**I want to** clear error messages and validation feedback  
**So that** I understand what went wrong and how to fix it

**Acceptance Criteria:**
- Invalid CSV format shows descriptive error
- Negative measurements rejected with clear message
- Mismatched double-entry shows visual feedback
- Toast notifications for successful actions
- Error messages guide user to solution

---

### US-OPT-009: Activity Logging
**As a** administrator  
**I want to** complete audit trail of all user actions  
**So that** I can track what happened during data collection

**Acceptance Criteria:**
- All major actions logged (measurements, exports, changes)
- Timestamps recorded for each action
- User (operator name) associated with actions
- Logs included in export metadata
- Logs help with troubleshooting

---

### US-OPT-010: Cross-Browser Compatibility
**As a** user  
**I want to** use the app on different browsers  
**So that** I have flexibility in device and browser choice

**Acceptance Criteria:**
- Works on Safari (primary for iPad)
- Works on Chrome (secondary)
- Works on Edge and Firefox
- Core functionality consistent across browsers
- Degraded features clearly communicated if present

---

### US-OPT-011: Progressive Export During Session
**As an** operator  
**I want to** export data multiple times during a session  
**So that** I have incremental backups as data collection progresses

**Acceptance Criteria:**
- Export can be triggered at any time
- Each export captures current state
- Multiple exports don't interfere with data collection
- Export history maintained (last 10 files)
- Recommended to export every 50-100 measurements

---

### US-OPT-012: Keyboard Navigation Support
**As a** user  
**I want to** navigate between fields using keyboard shortcuts  
**So that** I can enter data efficiently

**Acceptance Criteria:**
- Tab/Enter moves between measurement fields
- Escape cancels current entry
- Space toggles present/absent in check-in mode
- Keyboard shortcuts work consistently
- Touch and keyboard input can be mixed

---

## User Story Summary

**Total User Stories:** 63

**By Category:**
- Event Setup: 5 stories (US-ES-001 removed - events created via portal)
- Registration: 6 stories (added waiver signature)
- Body Measures: 9 stories (added 10-key input)
- Data Capture: 9 stories
- Options: 12 stories

---

*Manual Entry v2.7 User Stories - Created December 2025*