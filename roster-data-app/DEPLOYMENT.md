# Deployment Guide - Manual Entry App

## Quick Deployment to GitHub Pages

### Step 1: Repository Setup
1. Create a new GitHub repository or use an existing one
2. Upload all files from the `roster-data-app` directory to your repository
3. Ensure the following structure is maintained:

```
your-repo/
├── src/
│   ├── index.html
│   ├── css/styles.css
│   └── js/app.js
├── data/
│   ├── sample-roster.csv
│   └── TestRoster.csv
├── manifest.json
├── package.json
└── README.md
```

### Step 2: Enable GitHub Pages
1. Go to your repository on GitHub
2. Click on "Settings" tab
3. Scroll down to "Pages" section
4. Under "Source", select "Deploy from a branch"
5. Choose "main" branch and "/ (root)" folder
6. Click "Save"

### Step 3: Access Your App
- Your app will be available at: `https://YOUR_USERNAME.github.io/YOUR_REPO_NAME/src/`
- Update the `homepage` field in `package.json` with your actual URL

## Local Development

### Run Locally
```bash
# Navigate to the app directory
cd roster-data-app

# Start a local server (Python 3)
python3 -m http.server 8000

# Or using Node.js serve
npx serve .

# Open browser to http://localhost:8000/src/
```

## iPad Setup

### Add to Home Screen
1. Open Safari on iPad
2. Navigate to your GitHub Pages URL
3. Tap the Share button (□ with arrow)
4. Select "Add to Home Screen"
5. Choose a name and tap "Add"

### Offline Use
- The app works offline after the first load
- All data is stored locally on the device
- No internet connection required for data collection

## Testing the App

### Basic Functionality Test
1. Enter operator name: "Test User"
2. Enter event name: "Test Event"
3. Upload the `TestRoster.csv` file from the data directory
4. Click "Start Event"
5. Select a person from the roster
6. Enter some measurements (remember to enter each value twice)
7. Save measurements
8. Export data to verify CSV generation

### Data Validation Test
1. Enter different values for the same measurement
2. Verify error message appears
3. Enter matching values
4. Verify green validation indicators

### Persistence Test
1. Close the browser/app
2. Reopen the app
3. Verify it resumes where you left off

## Troubleshooting

### App Won't Load
- Check browser console for JavaScript errors
- Ensure all files are uploaded correctly
- Try a different browser (Safari recommended for iPad)

### CSV Upload Issues
- Ensure CSV has proper header: `ID,Name,Gender`
- Check for proper quoting of names with apostrophes
- Try the included `TestRoster.csv` file

### Export Not Working
- Check if pop-up blocker is enabled
- Try manually downloading the file
- Ensure email app is configured on device

## File Formats

### Roster CSV Format
```csv
ID,Name,Gender
001,"John Smith",M
002,"Jane O'Connor",F
003,"Mike Johnson",M
```

### Export CSV Format
The exported file includes:
- Basic info: ID, Name, Gender, Present, Completed
- Metadata: Timestamp, Operator, Device, Comments
- Measurements: All measurements with values and units

## Security Notes
- All data stored locally on device
- No external servers involved
- Data only leaves device via manual export
- Password protection for data reset and cache clearing (password: 00000)

## Browser Support
- **Primary**: Safari on iPad (iOS 12+)
- **Secondary**: Chrome, Firefox, Edge on tablets
- **Features**: Local Storage, File API, ES6 Classes, CSS Grid

---

## Quick Commands

```bash
# Test locally
npm start

# Deploy preparation
./deploy.sh

# Check for updates
git status
git add .
git commit -m "Update app"
git push origin main
```

Your app is now ready for deployment! 🚀
