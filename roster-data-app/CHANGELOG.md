# Changelog - Manual Entry Data Collection App

## Version 2.3.4 - Reset for New Event & Cache Clearing (June 22, 2025)

### 🔄 **Reset Functionality Enhancement**

#### Interface Updates
- **Renamed "Purge" to "Reset for New Event"** - Clearer, more descriptive terminology
- **Updated button text** - "Reset for New Event" button in settings
- **Enhanced modal content** - Clear description of reset functionality with cache clearing
- **Consistent terminology** - All references updated throughout documentation

#### Cache Clearing Implementation
- **Web app cache clearing** - Clears Service Worker caches for fresh start
- **Service Worker unregistration** - Removes cached service workers
- **Application cache clearing** - Handles deprecated but existing application cache
- **Complete reset experience** - Fresh start without cached resources

#### Technical Improvements
- **Enhanced `clearWebAppCache()` method** - Comprehensive cache management
- **Graceful error handling** - Cache clearing failures don't break reset process
- **Cross-browser compatibility** - Works with various browser cache implementations
- **Console logging** - Clear feedback about cache clearing operations

#### Documentation Updates
- **Updated README.md** - Reflects new reset terminology and cache clearing
- **Updated QUICKSTART.md** - Clear instructions for reset functionality
- **Updated DEPLOYMENT.md** - Security notes mention reset instead of purge
- **Updated CHANGELOG.md** - Historical references updated for consistency

## Version 2.3.2 - Real iPad File System Integration (June 22, 2025)

### 📂 **iPad File System Optimization**

#### Real File Storage
- **Downloads folder integration** - CSV files save directly to iPad's Downloads folder (not virtual directory)
- **Real file attachments** - Files are actual iPad files, not data URLs or blobs
- **Native Files app access** - Exported files accessible via iPad's Files app
- **Proper file management** - Files persist independently of the web app

#### Enhanced Email Attachments
- **Web Share API with real files** - Creates actual File objects for native sharing
- **Improved attachment reliability** - Files are real iPad files, not temporary blobs
- **Better fallback handling** - Downloads folder ensures files are always available
- **Dual storage approach** - Primary: Downloads folder, Backup: localStorage

#### Technical Improvements
- **New `saveToDownloadsFolder()` function** - Direct iPad Downloads folder integration
- **Enhanced `openMailWithDownloadedFiles()` function** - Better iPad Mail app integration
- **Improved file lifecycle** - Real files persist beyond app session
- **Better error handling** - Clear feedback about file locations

#### User Experience
- **Clear file locations** - Users know exactly where files are saved
- **No confusion about directories** - No reference to non-existent "Manual entry" folder
- **Better instructions** - Clear guidance about Downloads folder and Files app
- **Reliable attachments** - Real files always work with Mail app

## Version 2.3.1 - Enhanced iPad Email Attachments (June 22, 2025)

### 📧 **iPad Email Optimization**

#### Advanced Attachment System
- **Web Share API integration** - Native iPad sharing for seamless file attachment
- **Automatic email composition** - Pre-filled subject, body, and attachments
- **Smart fallback system** - Progressive enhancement for maximum compatibility
- **Enhanced email content** - Rich formatting with emojis and data summaries

#### iPad-Specific Improvements
- **Native Mail app integration** - Direct integration with iPad's Mail app
- **Automatic file attachment** - CSV files automatically attach via Web Share API
- **Improved user experience** - Single-tap export with complete email package
- **Better error handling** - Graceful fallbacks if Web Share API unavailable

#### Technical Enhancements
- **Enhanced `emailDataWithAttachment()` function** - iPad-optimized email generation
- **New `openMailtoWithDownloads()` function** - Fallback email handling
- **Web Share API detection** - Progressive enhancement for modern browsers
- **Improved blob management** - Better memory handling for file attachments

## Version 2.3.0 - Automatic CSV Saving & Enhanced Data Recording (June 22, 2025)

### 🚀 **New Auto-Save Features**

#### Automatic CSV Writing
- **Every save writes to CSV** - Both individual measurement saves and full saves automatically write to CSV files in 'Manual entry' directory
- **Enhanced data recording** - Each CSV record includes event name, operator, device ID, and save timestamp
- **Separate file tracking** - Individual saves go to `[Event]_[Date]_individual_saves.csv`, full saves to `[Event]_[Date]_full_saves.csv`
- **Intelligent file appending** - Multiple saves append to the same daily file, preventing file proliferation
- **Complete audit trail** - Every measurement action is preserved with full context

#### Enhanced CSV Format
- **Event metadata** - Event name, operator, and device included in every record
- **Dual timestamps** - Save timestamp (when saved) and measurement timestamp (when collected)
- **Comprehensive data** - All measurements, units, presence status, and completion status included
- **Real-time updates** - Spreadsheet changes also trigger automatic CSV saves

### 🔧 **Technical Improvements**
- **New `generateIndividualMeasurementCSV()` function** for single-record CSV generation
- **New `appendToCSVFile()` function** for intelligent file management and appending
- **Enhanced data context** - Every save action includes complete environmental data
- **Improved file organization** - Clear naming convention distinguishes save types

## Version 2.2.0 - Logo Removal & Clean Interface (June 22, 2025)

### 🎨 User Interface Improvements

#### Logo Removal
- **Removed BAM logo** from all page headers (startup, main, and spreadsheet views)
- **Simplified header structure** for cleaner appearance
- **Eliminated logo-related CSS** classes and styling
- **Streamlined design** focusing on functionality over branding

### 🔧 Technical Updates
- **Removed logo asset files** from project directory
- **Cleaned up CSS** by removing `.header-with-logo` and `.header-logo` classes
- **Updated responsive styles** to remove logo-specific mobile adjustments
- **Simplified HTML structure** in headers across all views

## Version 2.1.0 - UI Streamlining & BAM Logo Integration (June 22, 2025)

### 🎨 User Interface Improvements

#### Start Page Removal
- **Removed home screen** with large BAM logo and continue button
- **Direct access** to data entry setup screen
- **Streamlined workflow** - app starts immediately at the functional screen
- **Faster user onboarding** - no extra clicks needed

#### Header Logo Integration
- **Small BAM logo** (32px) added to all page headers
- **Consistent branding** across startup, main, and spreadsheet views
- **Professional appearance** maintains brand identity without taking up screen space
- **Responsive design** - logo scales appropriately on mobile devices

#### New Measurements Added
- **Vertical jump** measurement with metric/imperial units
- **Approach jump** measurement with metric/imperial units  
- **Broad jump** measurement with metric/imperial units
- **Double-entry validation** for all new measurements
- **Spreadsheet integration** - new columns in grid view
- **CSV export support** - all measurements included in data export

### 🔧 Technical Updates
- **Removed unused CSS** for home screen styling and animations
- **Updated JavaScript** to remove home screen navigation logic
- **Enhanced responsive design** for header logos on mobile
- **Cleaner codebase** with elimination of redundant screen management

---

## Version 2.0.0 - Enhanced Export & File Management (June 22, 2025)

### 🚀 Major New Features

#### Automatic Email Attachment
- **Auto-attach CSV files** to email using data URLs
- **Enhanced email content** with data summary and statistics
- **Fallback support** for email clients that don't support data URL attachments
- **Improved user feedback** with detailed success/error messages

#### Local Directory Management
- **Virtual "Manual entry" folder** created in localStorage
- **Organized file structure** with metadata and timestamps
- **File browser interface** accessible through Settings
- **Download and delete** individual files
- **Automatic cleanup** - keeps last 10 files to manage storage

#### File Management Interface
- **New "View Saved Files" option** in Settings menu
- **File list display** with event, operator, date, and size information
- **Individual file actions** - download or delete specific files
- **Storage optimization** with automatic old file removal

### 📧 Email Export Improvements

#### Before (v1.x):
- Manual file download
- Basic email with simple message
- User had to manually attach downloaded file
- No file organization or management

#### After (v2.0):
- **Automatic file attachment** (when supported by email client)
- **Rich email content** with data summary:
  - Total roster count
  - Completed measurements count
  - Present participants count
  - Operator and device information
  - Export timestamp
- **Fallback handling** for unsupported email clients
- **Files automatically saved** to organized local directory

### 📂 Local Storage Enhancements

#### New Directory Structure:
```
localStorage:
├── ManualEntry_Directory (index of all saved files)
├── ManualEntry_[filename]_[timestamp] (file content)
├── manualEntryState (current session state)
├── backup_[event]_[timestamp] (automatic backups)
└── deviceId (device identification)
```

#### File Metadata Tracking:
- Filename with event and timestamp
- Event name and operator
- File size and creation date
- Unique storage key for retrieval
- Automatic indexing and organization

### 🎯 User Experience Improvements

#### Enhanced Export Workflow:
1. **Click Export (📤)** - Single button press
2. **Automatic local save** - File saved to "Manual entry" directory
3. **Email opens** - Pre-filled with rich content
4. **File auto-attached** - CSV automatically attached if supported
5. **Send immediately** - No manual attachment needed (in most cases)

#### New File Management:
- **Settings → View Saved Files** - Access all exported data
- **Visual file browser** - See all files with metadata
- **Easy download** - Re-download any previous export
- **Simple deletion** - Remove unwanted files
- **Storage monitoring** - Automatic cleanup prevents storage overflow

### 🔧 Technical Improvements

#### Robust Error Handling:
- Storage limitation detection
- Email client compatibility checking
- Graceful fallbacks for unsupported features
- Detailed user feedback and guidance

#### Performance Optimizations:
- Efficient blob URL management
- Automatic memory cleanup
- Optimized localStorage usage
- Background file organization

#### Enhanced Security:
- Continued local-only storage
- No external dependencies
- Secure blob URL handling
- Automatic cleanup of temporary resources

### 📱 iPad Compatibility

#### Enhanced iOS Support:
- **Data URL attachment** works with most iOS email clients
- **Improved touch interface** for file management
- **Better storage management** for iPad limitations
- **Optimized for Safari** on iPad

#### PWA Improvements:
- **Better offline functionality** with local file management
- **Enhanced home screen experience** with file access
- **Improved app-like behavior** with organized data storage

## Migration Notes

### Automatic Compatibility:
- **Existing data preserved** - All current session data and backups remain intact
- **Seamless upgrade** - No user action required for existing installations
- **Backward compatibility** - New features don't break existing functionality

### New Features Available Immediately:
- All existing exports will continue to work as before
- New auto-attachment feature activates on next export
- File management becomes available in Settings menu
- Local directory creation starts with first new export

## Version 1.0.0 - Initial Release

### Core Features:
- iPad-optimized manual data collection app
- CSV roster import with robust parsing
- 7 physical measurements with double-entry validation
- Individual unit selection (metric/imperial)
- Session persistence and auto-save
- Basic CSV export with email integration
- Password-protected data reset with cache clearing
- PWA configuration for offline use

---

**Latest Version**: 2.0.0 - Enhanced Export & File Management  
**Deployment**: Ready for GitHub Pages  
**Compatibility**: iOS 12+, Safari recommended  
**Storage**: Local-only with enhanced organization
