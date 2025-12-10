# Manual Entry v2.7 - End User Adoption Test Cases

## Overview
These test cases are designed for end-user adoption testing to validate the Manual Entry v2.7 application works correctly in real-world scenarios. Tests should be performed on the target devices (primarily iPad) in actual usage conditions.

## Test Environment Setup
- **Device**: iPad (iOS 12+) or compatible tablet
- **Browser**: Safari (primary) or Chrome/Edge (secondary)
- **Network**: Test both online and offline scenarios
- **Test Data**: Sample roster CSV file with 10-15 participants

---

## Test Case 1: Initial Application Setup
**Objective**: Verify first-time setup process works correctly

### Pre-conditions:
- Fresh browser session (clear cache/storage)
- Sample CSV roster file available

### Test Steps:
1. Navigate to the application URL
2. Verify app loads and displays startup screen
3. Enter operator name: "Test User"
4. Enter event name: "Adoption Test Event"
5. Click "Import Roster (CSV)" and select test file
6. Verify roster file uploads successfully
7. Click "Next: Setup Measurements"
8. Verify measurement setup screen appears

### Expected Results:
- ✅ App loads without errors
- ✅ All form fields accept input
- ✅ CSV file uploads successfully
- ✅ Navigation to setup screen works
- ✅ No console errors in browser

### Pass/Fail: ______

---

## Test Case 2: Measurement Configuration
**Objective**: Verify measurement units and adjustments can be configured

### Pre-conditions:
- Test Case 1 completed successfully
- Currently on measurement setup screen

### Test Steps:
1. Change height unit from "Inches" to "Centimeters"
2. Change reach unit from "Inches" to "Centimeters"
3. Set height with shoes adjustment for Males to "+1.0"
4. Set height with shoes adjustment for Females to "+0.5"
5. Set reach adjustment for Males to "-0.5"
6. Leave all other adjustments at 0
7. Click "Start Event"

### Expected Results:
- ✅ Unit dropdowns change successfully
- ✅ Adjustment inputs accept decimal values
- ✅ Changes are saved automatically
- ✅ "Start Event" navigates to main screen
- ✅ Event title displays correctly

### Pass/Fail: ______

---

## Test Case 3: Roster Navigation and Display
**Objective**: Verify roster displays correctly and navigation works

### Pre-conditions:
- Test Cases 1-2 completed
- Currently on main screen

### Test Steps:
1. Verify roster grid displays all participants from CSV
2. Check that participant names display correctly
3. Use name filter to search for a specific participant
4. Clear the filter and verify all participants return
5. Click on a participant card to select them
6. Verify measurement form appears for selected participant

### Expected Results:
- ✅ All CSV participants display in grid
- ✅ Names with special characters display correctly
- ✅ Search filter works properly
- ✅ Participant selection works
- ✅ Measurement form loads for selected participant

### Pass/Fail: ______

---

## Test Case 4: Basic Measurement Entry (Athlete View)
**Objective**: Verify double-entry measurement process works correctly

### Pre-conditions:
- Test Cases 1-3 completed
- Participant selected in athlete view

### Test Steps:
1. Enter height with shoes: First entry "72.5", Second entry "72.5"
2. Verify green validation and auto-save
3. Enter height without shoes: First entry "71.0", Second entry "71.1"
4. Verify red validation (mismatch)
5. Correct second entry to "71.0"
6. Verify green validation and auto-save
7. Enter reach: First entry "85.0", Second entry "85.0"
8. Enter weight: First entry "175", Second entry "175"
9. Click "Save Measurements" button

### Expected Results:
- ✅ Matching entries show green validation
- ✅ Mismatched entries show red validation
- ✅ Auto-save works for validated entries
- ✅ Manual save button works
- ✅ Toast confirmation appears
- ✅ Values persist when navigating away and back

### Pass/Fail: ______

---

## Test Case 5: Adjustment Calculations
**Objective**: Verify adjustments are applied correctly to measurements

### Pre-conditions:
- Test Case 4 completed with measurements entered
- Adjustments configured in Test Case 2

### Test Steps:
1. Navigate to spreadsheet view (📊 button)
2. Locate the test participant's row
3. Verify raw height with shoes shows "72.5"
4. Verify adjusted height shows "73.5" (72.5 + 1.0 adjustment)
5. Verify raw reach shows "85.0"
6. Verify adjusted reach shows "84.5" (85.0 - 0.5 adjustment)
7. Switch units back to inches in settings
8. Verify values convert correctly

### Expected Results:
- ✅ Raw measurements display as entered
- ✅ Adjusted measurements include gender-specific adjustments
- ✅ Calculations are mathematically correct
- ✅ Unit conversions work properly
- ✅ Changes persist across view switches

### Pass/Fail: ______

---

## Test Case 6: Check-in System
**Objective**: Verify attendance tracking functionality

### Pre-conditions:
- Test Cases 1-5 completed
- Multiple participants in roster

### Test Steps:
1. Click "👥 Check-in" button from main roster view
2. Verify check-in grid displays all participants
3. Click "📝 Edit Mode: OFF" to enable editing
4. Mark 3 participants as "Present" (green)
5. Leave 2 participants as "Absent" (red)
6. Click "📝 Edit Mode: ON" to disable editing
7. Try to change attendance (should be disabled)
8. Click "← Back to Roster"
9. Verify present participants show different visual indicator

### Expected Results:
- ✅ Check-in view loads correctly
- ✅ Edit mode toggles work
- ✅ Attendance changes save properly
- ✅ Visual indicators work correctly
- ✅ Status persists when returning to roster
- ✅ Edit protection works when disabled

### Pass/Fail: ______

---

## Test Case 7: Station View Mode
**Objective**: Verify station-based measurement workflow

### Pre-conditions:
- Test Cases 1-6 completed
- Back on main roster screen

### Test Steps:
1. Change "View Mode" dropdown from "Athlete View" to "Station View"
2. Select "Height with Shoes" from measurement dropdown
3. Select first participant from participant dropdown
4. Enter measurement: "70.0" (first entry), "70.0" (second entry)
5. Select second participant
6. Enter measurement: "68.5" (first entry), "68.5" (second entry)
7. Change measurement type to "Weight"
8. Verify participant selection resets
9. Switch back to "Athlete View"

### Expected Results:
- ✅ View mode switches correctly
- ✅ Station dropdowns populate properly
- ✅ Measurement entry works for multiple participants
- ✅ Values save correctly for each participant
- ✅ Switching measurement types works
- ✅ Return to athlete view works

### Pass/Fail: ______

---

## Test Case 8: Spreadsheet View and Editing
**Objective**: Verify grid-based data review and editing

### Pre-conditions:
- Test Cases 1-7 completed with various measurements entered

### Test Steps:
1. Click 📊 button to open spreadsheet view
2. Verify all entered measurements display in grid
3. Click "📝 Edit Mode" to enable editing
4. Click on a measurement cell and change the value
5. Press Enter to save the change
6. Verify the change is reflected immediately
7. Scroll horizontally to see all measurement columns
8. Check completion status indicators
9. Click "← Back to Main" to return to roster view

### Expected Results:
- ✅ Spreadsheet loads with all data
- ✅ Edit mode enables cell editing
- ✅ Changes save immediately
- ✅ Data validation still applies
- ✅ Horizontal scrolling works
- ✅ Status indicators are accurate
- ✅ Navigation back to main works

### Pass/Fail: ______

---

## Test Case 9: Data Export
**Objective**: Verify CSV export functionality works correctly

### Pre-conditions:
- Test Cases 1-8 completed with measurement data

### Test Steps:
1. Click 📤 Export button from main screen
2. Wait for export processing
3. Verify file download or email integration
4. Open the exported CSV file
5. Verify all participant data is present
6. Verify raw measurements are correct
7. Verify adjusted measurements include adjustments
8. Check export metadata (timestamp, operator, event name)
9. Verify file naming convention

### Expected Results:
- ✅ Export initiates without errors
- ✅ File downloads successfully OR email opens with attachment
- ✅ CSV file opens in spreadsheet application
- ✅ All data is complete and accurate
- ✅ Calculations are correct
- ✅ Metadata is included
- ✅ File name follows naming convention
- ✅ No data corruption or missing values

### Pass/Fail: ______

---

## Test Case 10: Settings and File Management
**Objective**: Verify settings functionality and file management

### Pre-conditions:
- Test Cases 1-9 completed

### Test Steps:
1. Click ⚙️ Settings button
2. Click "📏 Measurement Setup"
3. Verify return to setup screen with current values
4. Make a small adjustment change
5. Click "Start Event" to return to main
6. Go back to Settings
7. Click "View Saved Files"
8. Verify exported file appears in list
9. Test file download from saved files
10. Click "Reset for New Event"
11. Enter password: "00000"
12. Verify app resets to startup screen

### Expected Results:
- ✅ Settings modal opens correctly
- ✅ Measurement setup retains current values
- ✅ Changes save and persist
- ✅ File management shows saved exports
- ✅ File re-download works
- ✅ Reset requires correct password
- ✅ Reset clears all data
- ✅ App returns to startup state

### Pass/Fail: ______

---

## Test Case 11: Session Persistence
**Objective**: Verify data persists across browser sessions

### Pre-conditions:
- Test Cases 1-10 completed with data entered

### Test Steps:
1. Note current state (participants, measurements, settings)
2. Close the browser tab/window completely
3. Wait 30 seconds
4. Reopen browser and navigate to application URL
5. Verify app resumes where you left off
6. Check that all measurements are still present
7. Verify settings/adjustments are preserved
8. Test that you can continue entering new measurements

### Expected Results:
- ✅ App automatically restores previous session
- ✅ All measurement data is preserved
- ✅ Settings and adjustments are maintained
- ✅ Current view mode is remembered
- ✅ No data loss occurs
- ✅ Full functionality continues to work

### Pass/Fail: ______

---

## Test Case 12: Offline Functionality
**Objective**: Verify app works without internet connection

### Pre-conditions:
- Test Case 11 completed (app loaded at least once online)

### Test Steps:
1. Disconnect device from internet/WiFi
2. Refresh the browser page
3. Verify app still loads
4. Enter new measurements for a participant
5. Use check-in functionality
6. Switch between view modes
7. Access settings
8. Attempt data export (should still work locally)
9. Reconnect to internet
10. Verify no data loss occurred

### Expected Results:
- ✅ App loads completely offline
- ✅ All core functionality works without internet
- ✅ Data entry and validation work
- ✅ Local storage continues working
- ✅ Export creates local files
- ✅ No functionality is lost
- ✅ Data syncs properly when reconnected

### Pass/Fail: ______

---

## Test Case 13: Error Handling and Edge Cases
**Objective**: Verify app handles errors gracefully

### Pre-conditions:
- Fresh app session

### Test Steps:
1. Try uploading an invalid CSV file (wrong format)
2. Try entering negative measurements
3. Try entering extremely large numbers (>999)
4. Leave measurement fields empty and try to save
5. Try rapid clicking on buttons
6. Enter special characters in measurement fields
7. Try to access features before completing setup
8. Test with very long participant names

### Expected Results:
- ✅ Invalid CSV shows clear error message
- ✅ Negative numbers are rejected with feedback
- ✅ Large numbers are handled appropriately
- ✅ Empty fields are handled gracefully
- ✅ No UI breaking from rapid clicks
- ✅ Invalid characters are filtered/rejected
- ✅ Proper navigation flow is enforced
- ✅ Long names display properly without breaking layout

### Pass/Fail: ______

---

## Test Case 14: Multi-User Workflow Simulation
**Objective**: Verify app works efficiently in realistic usage scenario

### Pre-conditions:
- Fresh app setup with roster of 20+ participants

### Test Steps:
1. Set up event with realistic measurements and adjustments
2. Process first 5 participants completely (all measurements)
3. Use check-in to mark 10 participants as present
4. Switch to station view and measure height for 8 participants
5. Switch back to athlete view
6. Complete 3 more participants fully
7. Export data mid-session
8. Continue with 5 more participants
9. Use spreadsheet view to review and edit 2 measurements
10. Perform final export
11. Verify both exports contain correct progressive data

### Expected Results:
- ✅ App handles realistic workload smoothly
- ✅ Performance remains good with multiple participants
- ✅ Data integrity maintained throughout session
- ✅ View switching works efficiently
- ✅ Progressive exports show correct data states
- ✅ No memory leaks or performance degradation
- ✅ All functionality remains responsive

### Pass/Fail: ______

---

## Test Case 15: Cross-Browser Compatibility
**Objective**: Verify app works across different browsers

### Pre-conditions:
- Access to Safari, Chrome, and/or Edge browsers

### Test Steps:
1. Complete Test Cases 1-4 in Safari
2. Export the data
3. Open the same app URL in Chrome
4. Verify data persists across browsers (should not - each browser independent)
5. Complete basic measurement entry workflow in Chrome
6. Test export functionality in Chrome
7. If available, repeat key tests in Edge browser
8. Compare functionality and performance across browsers

### Expected Results:
- ✅ App loads correctly in all tested browsers
- ✅ All core functionality works consistently
- ✅ Data storage is browser-specific (as expected)
- ✅ Export works in all browsers
- ✅ UI renders correctly across browsers
- ✅ Performance is acceptable in all browsers
- ✅ No browser-specific errors occur

### Pass/Fail: ______

---

## Summary Report

### Test Execution Summary:
- **Total Test Cases**: 15
- **Passed**: ___/15
- **Failed**: ___/15
- **Pass Rate**: ___%

### Critical Issues Found:
1. ________________________________
2. ________________________________
3. ________________________________

### Minor Issues Found:
1. ________________________________
2. ________________________________
3. ________________________________

### Recommendations:
- ________________________________
- ________________________________
- ________________________________

### Overall Assessment:
☐ **Ready for Production** - All critical functionality works correctly
☐ **Ready with Minor Issues** - Core functionality works, minor issues acceptable
☐ **Needs Fixes** - Critical issues must be resolved before deployment
☐ **Major Rework Required** - Significant problems prevent production use

### Tester Information:
- **Name**: ________________________
- **Date**: ________________________
- **Device**: ______________________
- **Browser**: ____________________
- **Environment**: _________________

---

*Manual Entry v2.7 - End User Adoption Test Cases*
*Created August 2025*
