# Manual Entry v2.7 User Manual

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Roster Management](#roster-management)
4. [Measurement Setup](#measurement-setup)
5. [Data Collection](#data-collection)
6. [Check-in System](#check-in-system)
7. [View Modes](#view-modes)
8. [Spreadsheet View](#spreadsheet-view)
9. [Data Export](#data-export)
10. [Settings & Administration](#settings--administration)
11. [Technical Requirements](#technical-requirements)
12. [Troubleshooting](#troubleshooting)

---

## Introduction

The Manual Entry app v2.7 is a comprehensive data collection system designed for athletic measurements and roster management. It provides a touch-friendly interface optimized for iPad use, with offline capability and local data storage.

### Key Features
- **Offline Operation**: Works without internet connection after initial load
- **Local Data Storage**: All information saved securely on your device
- **Double-Entry Validation**: Ensures accuracy through confirmation entries
- **Flexible Units**: Choose metric or imperial units per measurement
- **Adjustment System**: Apply systematic corrections to measurements
- **Export Capabilities**: Generate CSV files for data analysis
- **Session Persistence**: Resume work exactly where you left off

---

## Getting Started

### Initial Setup

1. **Launch the Application**
   - Open the app in Safari on your iPad
   - For best experience, add to Home Screen for app-like functionality

2. **Enter Operator Information**
   - Your Name: Enter the name of the person collecting data
   - Event Name: Provide a descriptive name for this measurement session

3. **Upload Roster**
   - Click "Import Roster (CSV)" and select your participant file
   - See [Roster Requirements](#roster-requirements) for proper format

4. **Proceed to Setup**
   - Click "Next: Setup Measurements" to configure your measurement parameters

### Roster Requirements

Your CSV file must contain the following columns in this exact order:

```csv
ID,Name,Gender
001,"John Smith",M
002,"Jane O'Connor",F
003,"Mike Johnson",M
```

**Column Specifications:**
- **ID**: Unique identifier (can be numbers, letters, or blank for new entries)
- **Name**: Full participant name (use quotes if name contains apostrophes)
- **Gender**: M (Male), F (Female), or Other

**Important Notes:**
- First row must contain column headers exactly as shown
- Names with special characters (apostrophes, commas) should be in quotes
- Gender affects which adjustment values are applied to measurements
- File must have .csv extension

---

## Measurement Setup

### Units Configuration

Configure measurement units for each category:

**Height Measurements:**
- Inches (default)
- Centimeters

**Jump/Distance Measurements:**
- Inches (default)
- Centimeters

**Weight:**
- Always measured in pounds (fixed)

**Hand Measurements:**
- Always measured in inches (fixed)

### Adjustment System

Adjustments are systematic corrections applied to all measurements based on equipment, environmental factors, or standardization requirements.

**How Adjustments Work:**
1. **Gender-Specific**: Different adjustments for Male (M) and Female (F) participants
2. **Additive**: Adjustments are added to raw measurements
3. **Automatic**: Applied during data collection and export
4. **Measurement-Specific**: Each measurement type has its own adjustment value

**Available Adjustments:**
- Height with Shoes
- Height without Shoes
- Reach
- Wingspan
- Weight
- Hand Length
- Hand Width
- Vertical Jump
- Approach Jump
- Broad Jump

**Setting Adjustments:**
1. Enter values in the Measurement Adjustments table
2. Use positive numbers to add to measurements
3. Use negative numbers to subtract from measurements
4. Default value is 0 (no adjustment)
5. Adjustments automatically save when changed

**Example Adjustment Scenario:**
If your measuring tape consistently reads 0.5 inches low, enter +0.5 in the appropriate adjustment field to correct all measurements.

---

## Data Collection

### Measurement Process

1. **Select Participant**
   - Click on a participant card from the roster grid
   - Card will expand to show measurement interface

2. **Enter Measurements**
   - Each measurement requires two identical entries for validation
   - Enter the first value and press Enter or Tab
   - Enter the second value to confirm
   - Values must match exactly to save

3. **Measurement Types**
   - **Height with Shoes**: Standing height wearing shoes
   - **Height without Shoes**: Standing height in socks/barefoot
   - **Reach**: Standing reach (fingertip to fingertip)
   - **Wingspan**: Arm span (fingertip to fingertip)
   - **Weight**: Body weight in pounds
   - **Hand Length**: Length from wrist to fingertip
   - **Hand Width**: Width across palm
   - **Vertical Jump**: Maximum vertical leap
   - **Approach Jump**: Running vertical leap
   - **Broad Jump**: Standing horizontal jump distance

4. **Save Process**
   - Measurements auto-save when both entries match
   - Green highlighting indicates successful validation
   - Red highlighting indicates entry mismatch

### Calculation Details

**Adjusted Value Calculation:**
```
Final Value = Raw Measurement + Gender-Specific Adjustment
```

**Unit Conversions:**
- All calculations performed in inches internally
- Display units converted based on your selection
- Height displays include feet/inches format (e.g., "6' 2\"")

**Validation Rules:**
- Both entries must be identical to the decimal place
- Values must be positive numbers
- Empty entries are allowed (saves as blank)

---

## Check-in System

The check-in system allows you to track participant attendance and readiness for measurement.

### Using Check-in

1. **Access Check-in**
   - Click "👥 Check-in" button in the main roster view
   - This switches to the check-in grid layout

2. **Mark Attendance**
   - Toggle between "Present" and "Absent" for each participant
   - Present participants show with green highlighting
   - Absent participants show with red highlighting

3. **Edit Mode**
   - Click "📝 Edit Mode: OFF" to enable editing
   - When active, you can modify attendance status
   - Click again to disable editing

4. **Return to Measurement**
   - Click "← Back to Roster" to return to main measurement view
   - Check-in status is preserved and affects display

### Check-in Benefits
- Visual tracking of who has arrived
- Filter participants by attendance status
- Organize measurement flow more efficiently
- Maintain accurate event attendance records

---

## View Modes

### Athlete View (Default)
- **Individual Focus**: One participant at a time
- **Complete Profile**: All measurements for selected athlete
- **Sequential Workflow**: Move through roster systematically
- **Best For**: Complete measurement sessions per person

### Station View
- **Measurement Focus**: One measurement type across multiple participants
- **Efficient Workflow**: Collect single measurement from many people
- **Equipment Optimization**: Set up once, measure many
- **Best For**: Large groups, specialized measurement stations

**Switching Views:**
- Use the "View Mode" dropdown in the controls section
- Selection persists throughout your session
- Can switch modes at any time without losing data

---

## Spreadsheet View

Access the spreadsheet view by clicking the 📊 button in the header.

### Features
- **Grid Layout**: See all participants and measurements in table format
- **Edit Mode**: Click "📝 Edit Mode" to modify values directly in cells
- **Sortable Columns**: Click headers to sort by different criteria
- **Status Indicators**: Visual indicators for completion and attendance
- **Bulk View**: Quickly assess data completeness across all participants

### Using Spreadsheet Mode
1. **Viewing Data**
   - Scroll horizontally to see all measurement columns
   - Participant names remain fixed on the left
   - Status columns show completion percentages

2. **Editing Values**
   - Enable Edit Mode
   - Click any measurement cell to modify
   - Changes save automatically
   - Validation still applies (positive numbers only)

3. **Data Review**
   - Identify missing measurements quickly
   - Spot data inconsistencies
   - Review adjusted values vs. raw measurements

---

## Data Export

### Export Process

1. **Initiate Export**
   - Click the 📤 Export button in the header
   - System generates comprehensive CSV file

2. **File Contents**
   - All participant information
   - Raw measurements
   - Adjusted measurements (with corrections applied)
   - Calculated values (reach + vertical, etc.)
   - Export metadata (timestamp, operator, device)

3. **File Delivery**
   - **iPad**: Files save to Downloads folder automatically
   - **Email**: Mail app opens with file pre-attached
   - **File Management**: Access via Settings → View Saved Files

### Export Data Structure

**Columns Included:**
- Participant ID and Name
- Gender
- All raw measurement values
- All adjusted measurement values
- Unit specifications
- Calculated reporting values
- Completion status
- Check-in status
- Comments/notes

**File Naming:**
```
ManualEntry_[EventName]_[Timestamp].csv
```

Example: `ManualEntry_SpringCombine_2025-06-30_14-30.csv`

---

## Settings & Administration

### Accessing Settings
Click the ⚙️ Settings button in the header to access:

1. **📏 Measurement Setup**
   - Return to units and adjustments configuration
   - Modify settings without losing current data
   - Changes apply to future measurements

2. **View Saved Files**
   - Browse previously exported files
   - Re-download files to device
   - Delete old files to manage storage

3. **Reset for New Event**
   - Clear all current data to start fresh
   - Password protected (password: 00000)
   - Removes all measurements, roster, and settings

### File Management
- **Automatic Backup**: App maintains backup copies of exports
- **Storage Limit**: Last 10 exports kept automatically
- **Manual Cleanup**: Delete files individually through file browser
- **Primary Storage**: All exports save to iPad Downloads folder

### Session Management
- **Auto-Save**: All changes saved automatically
- **Session Restore**: App resumes exactly where you left off
- **State Persistence**: Survives app closure and device restart
- **Data Security**: All data remains on your device only

---

## Technical Requirements

### Device Compatibility
- **Primary**: iPad with iOS 12 or later
- **Secondary**: Android tablets, Windows tablets
- **Browser**: Safari (recommended), Chrome, Firefox, Edge

### Storage Requirements
- **App Size**: ~2MB initial download
- **Data Storage**: Varies by roster size (typically <10MB per event)
- **Available Space**: 50MB recommended for smooth operation

### Performance Optimization
- **Roster Size**: Tested with up to 500 participants
- **Measurements**: All 10 measurement types supported simultaneously
- **Export Speed**: Large datasets export in under 30 seconds
- **Battery Usage**: Minimal impact on device battery life

### Network Requirements
- **Initial Load**: Internet connection required for first access
- **Offline Operation**: Full functionality without internet after loading
- **Data Sync**: Manual export only (no automatic cloud sync)

---

## Troubleshooting

### Common Issues

**App Won't Load Roster**
- Verify CSV file format matches requirements exactly
- Ensure file has .csv extension
- Check for special characters in names (use quotes)
- Try with smaller file first to test format

**Measurements Won't Save**
- Ensure both entries match exactly
- Check for negative numbers (not allowed)
- Verify participant is selected
- Clear browser cache and reload if persistent

**Export Not Working**
- Check available storage space on device
- Verify Downloads folder permissions
- Try Settings → View Saved Files for backup access
- Use different browser if issues persist

**App Runs Slowly**
- Close other browser tabs
- Restart browser application
- Check available device memory
- Reduce roster size if extremely large (>1000 people)

### Data Recovery
- **Auto-Backup**: App maintains automatic backups
- **Manual Backup**: Export data regularly as protection
- **State Recovery**: Restart app to restore last session
- **Emergency Export**: Use View Saved Files if export button fails

### Support Information
- **Error Logging**: Check browser console for detailed error messages
- **Version Info**: App displays current version (v2.7) in header
- **Device Info**: Automatically included in export files for support
- **Data Privacy**: All troubleshooting can be done without sharing personal data

---

## Best Practices

### Before Starting
1. **Test Setup**: Try with small sample roster first
2. **Verify Equipment**: Ensure measurement tools are calibrated
3. **Check Settings**: Configure units and adjustments before data collection
4. **Backup Plan**: Know how to export data in case of device issues

### During Data Collection
1. **Regular Exports**: Export data every 50-100 measurements
2. **Double-Check**: Review measurements before moving to next participant
3. **Consistent Process**: Use same measurement technique for all participants
4. **Break Periods**: Take breaks to maintain measurement accuracy

### After Completion
1. **Final Export**: Ensure all data is exported
2. **Verify Export**: Open CSV file to confirm data integrity
3. **Backup Storage**: Save exported files to multiple locations
4. **Reset App**: Clear data if device will be reused for different event

---

## Quick Reference

### Essential Buttons
- **📊** Spreadsheet View
- **⚙️** Settings
- **📤** Export Data
- **👥** Check-in
- **+** Add Person

### Keyboard Shortcuts
- **Tab/Enter**: Move between measurement fields
- **Escape**: Cancel current entry
- **Space**: Toggle present/absent in check-in mode

### File Locations
- **Primary**: iPad Downloads folder
- **Backup**: Settings → View Saved Files
- **Mail**: Automatically attached to emails

### Support Contacts
For technical issues or questions, refer to the browser console for error details and ensure you're using a compatible browser with JavaScript enabled.

---

*Manual Entry v2.7 User Manual - Created June 2025*
