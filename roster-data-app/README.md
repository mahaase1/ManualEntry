# Manual Entry - Data Collection App

A standalone web application for collecting physical measurements with local storage and offline capability. Designed specifically for iPad use with large, touch-friendly interface.

## Features

✅ **Standalone web app** - Works offline after initial load  
✅ **Local storage** - All data saved locally with automatic backup  
✅ **Roster import** - CSV file import before use  
✅ **Double-entry validation** - Measurements must be entered twice to match  
✅ **Individual unit selection** - Choose metric/imperial per measurement  
✅ **iPad optimized** - Large fonts and touch-friendly interface  
✅ **Session persistence** - Resumes where you left off  
✅ **Password-protected purge** - Secure data removal (password: 00000)  
✅ **CSV export** - Data export with email integration and auto-attachment
✅ **Local file management** - Organized "Manual entry" directory with file browser
✅ **Auto-attachment** - CSV files automatically attached to email (when supported)
✅ **Professional branding** - BAM logo integrated in all page headers
✅ **Streamlined UI** - Direct access to setup screen without start page
✅ **Spreadsheet view** - Grid-based data entry and viewing with edit mode
✅ **Activity logging** - Complete audit trail of all user actions
✅ **Duplicate event protection** - Automatic timestamp appending for duplicate names
✅ **Add new people** - Simple form to add roster entries  
✅ **Check-in system** - Mark people as present with comments  

## Measurements Collected

- Height with shoes
- Height without shoes  
- Reach
- Wingspan
- Weight
- Hand length
- Hand width
- Vertical
- Approach
- Broad

Each measurement supports both metric (cm/kg) and imperial (inches/lbs) units.

## Setup Instructions

### Option 1: GitHub Pages (Recommended)

1. Fork or download this repository
2. Push to your GitHub repository
3. Go to repository Settings → Pages
4. Set source to "Deploy from a branch"
5. Select "main" branch and "/ (root)" folder
6. Save and wait for deployment
7. Access via the provided GitHub Pages URL

### Option 2: Local File System

1. Download all files to your device
2. Open `src/index.html` in Safari on iPad
3. Add to Home Screen for app-like experience

### Option 3: Simple HTTP Server

```bash
# In the project directory
python3 -m http.server 8000
# Or
npx serve .
```

## Usage

### Initial Setup
1. Enter your name as the operator
2. Enter event name
3. Import CSV roster file (see format below)
4. Click "Start Event"

### CSV Roster Format
```csv
ID,Name,Gender
001,"John Smith",M
002,"Jane O'Connor",F
003,"Mike Johnson",M
```

- Names with apostrophes should be quoted
- Gender: M/F/Other
- ID can be blank for new additions

### Data Collection
1. Select person from roster grid
2. Mark as present if checked in
3. Enter measurements (each value twice for validation)
4. Add comments if needed
5. Save measurements

### Export Data
- Click export button (📤)
- CSV file automatically saved to "Manual entry" local directory
- CSV file downloads to device
- Email app opens with pre-filled subject/body and automatic attachment
- File automatically attached if email client supports data URLs
- Fallback to manual attachment if needed

### File Management
- **View saved files**: Settings → View Saved Files
- **Download files**: Re-download any previously exported file
- **Delete files**: Remove files from local directory
- **Auto-cleanup**: System keeps last 10 files automatically

### Data Management
- **Auto-save**: All changes saved automatically
- **Backup**: Local backups created on each save
- **Local directory**: All exports saved to organized "Manual entry" folder
- **File browser**: Access, download, and manage all saved files
- **Purge**: Settings → Purge Data (password: 00000)
- **Resume**: App resumes where you left off

## File Structure

```
roster-data-app/
├── src/
│   ├── index.html          # Main application
│   ├── css/
│   │   └── styles.css      # iPad-optimized styles
│   └── js/
│       └── app.js          # Complete application logic
├── data/
│   └── sample-roster.csv   # Example roster format
├── manifest.json           # PWA configuration
└── README.md              # This file
```

## Browser Compatibility

- **Primary**: Safari on iPad (iOS 12+)
- **Secondary**: Chrome, Firefox, Edge on tablets
- **Features**: Works best with modern browsers supporting:
  - Local Storage
  - File API
  - ES6 Classes
  - CSS Grid

## Technical Notes

- **Storage**: Uses localStorage for all data persistence and file management
- **Local Directory**: Creates virtual "Manual entry" folder in localStorage
- **Backup**: Maintains 5 most recent backups automatically
- **File Management**: Organized metadata system with automatic cleanup
- **Validation**: Double-entry with floating-point tolerance
- **Export**: CSV format with timestamp and device info, auto-attachment support
- **PWA**: Can be installed as Progressive Web App

## Troubleshooting

**App won't load roster:**
- Check CSV format matches example
- Ensure file has .csv extension
- Try different browser if issues persist

**Measurements won't save:**
- Ensure both values match exactly
- Check for validation error messages
- Try refreshing and re-entering

**Export not working:**
- Files automatically saved to "Manual entry" directory
- Use Settings → View Saved Files to access exports
- Check if email client supports automatic attachments
- Manually download files if auto-attachment fails

## Security & Privacy

- All data stored locally on device
- No external servers or tracking
- Data only leaves device via manual export
- Password protection for data purge

## Support

For issues or questions, check the browser console for error messages and ensure you're using a compatible browser with JavaScript enabled.