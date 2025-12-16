# How to Update Snowboarding Widget Data

This guide explains how to update the snowboarding data that powers the Snowboarding Widget on your personal website.

## File Location

The snowboarding data is stored in a CSV file located at:
```
src/data/snowboarding.csv
```

There's also a copy in the `public` folder (used by the widget at runtime):
```
public/data/snowboarding.csv
```

**Important:** You need to update **both files** when making changes.

## CSV Format

The CSV file has the following structure:

```csv
Date,Location,Season,Days Snowboarded
"Monday, November 18","Eldora Mountain Resort, CO",24-'25,1
"Friday, November 22","Eldora Mountain Resort, CO",24-'25,2
```

### Columns Explained:

1. **Date**: Format as `"Day, Month DD"` (e.g., `"Monday, November 18"` or `"Friday, December 6"`)
   - Include day of week (optional but recommended)
   - Use full month name (November, December, January, etc.)
   - Day can be single or double digit (1 or 01 both work)

2. **Location**: The name of the resort/location where you snowboarded
   - Use quotes if the location contains commas
   - Format: `"Eldora Mountain Resort, CO"`

3. **Season**: Format as `YY-'YY` (e.g., `24-'25` for 2024-2025 season)
   - First two digits are the starting year
   - Second two digits are the ending year

4. **Days Snowboarded**: Cumulative count of days snowboarded this season
   - This is a running total, not per-day count
   - First entry of season = 1
   - Second entry = 2, third = 3, etc.
   - Each new entry increments by 1

## Example Entry

When you go snowboarding, add a new row to the CSV:

```csv
"Saturday, December 14","Eldora Mountain Resort, CO",25-'26,5
```

**Key Points:**
- The date must match your actual snowboarding date
- Location should be accurate
- Season must match the current season
- Days Snowboarded should be the next number in sequence (if your last entry was 4, this should be 5)

## Step-by-Step Update Process

### 1. Edit the CSV File

Open `src/data/snowboarding.csv` in any text editor or spreadsheet application.

**Option A: Text Editor (Recommended)**
- Open the file in VS Code, TextEdit, or any text editor
- Add your new entry at the bottom of the file
- Follow the exact format of existing entries

**Option B: Spreadsheet Application**
- Open in Excel, Google Sheets, or Numbers
- Add a new row at the bottom
- Make sure quotes are preserved for fields with commas
- Export back to CSV format

### 2. Copy to Public Folder

After editing `src/data/snowboarding.csv`, copy it to the public folder:

```bash
cp src/data/snowboarding.csv public/data/snowboarding.csv
```

Or manually copy the file from `src/data/` to `public/data/`.

### 3. Commit and Push Changes

Once both files are updated, commit and push to GitHub:

```bash
# Stage the changes
git add src/data/snowboarding.csv public/data/snowboarding.csv

# Commit with a descriptive message
git commit -m "Update snowboarding data: Added Dec 14 trip to Eldora"

# Push to GitHub
git push
```

### 4. Wait for Auto-Deploy

- Vercel will automatically detect the push to GitHub
- A new deployment will start (usually takes 1-2 minutes)
- Your changes will appear on the live site automatically

You can check deployment status in your Vercel dashboard.

## Quick Reference

### Common Locations (for copy-paste):
```
"Eldora Mountain Resort, CO"
"Copper Mountain, CO"
"Winter Park Resort, CO"
"Breckenridge, CO"
"Arapahoe Basin, CO"
```

### Season Format Reference:
- 2024-2025 season: `24-'25`
- 2025-2026 season: `25-'26`
- 2026-2027 season: `26-'27`

## Troubleshooting

### Chart shows old data
- **Solution**: Make sure you updated both CSV files (src/data and public/data)
- Clear browser cache and hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

### Chart shows no data
- **Solution**: Check CSV format - make sure quotes are correct and commas are inside quotes
- Verify the file saved correctly
- Check browser console for errors

### Dates appear in wrong order
- **Solution**: Ensure dates follow the format `"Day, Month DD"` exactly
- Make sure the cumulative count (Days Snowboarded) increments correctly

### Latest season line doesn't stop
- **Solution**: The line automatically stops at your most recent entry - no action needed
- If it continues, check that you didn't include dates beyond your actual snowboarding dates

## Tips

1. **Update regularly**: It's easier to remember details if you update right after each trip
2. **Be consistent**: Use the same location name format each time
3. **Check the count**: Make sure "Days Snowboarded" is sequential (1, 2, 3, 4...)
4. **Test locally**: Run `npm run dev` to see changes before pushing to production

## Need Help?

If you run into issues:
1. Check the CSV format matches the examples exactly
2. Verify both files were updated
3. Check the git commit was successful
4. Look at Vercel deployment logs for errors

---

**Last Updated**: December 2024


