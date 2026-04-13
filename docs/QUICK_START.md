# 🚀 Quick Start Guide

## ⚡ 5-Minute Setup

### Prerequisites
- Node.js installed
- PostgreSQL running
- `.env` file configured with `DATABASE_URL`

### Step 1: Start Backend (Terminal 1)
```bash
npm install
npm run dev
```

**Expected output:**
```
🚀 Server running on port 5000
✓ Application started successfully
```

### Step 2: Start Frontend (Terminal 2)
```bash
cd portal-frontend
npm install
npm run dev
```

**Expected output:**
```
Local: http://localhost:3000
```

### Step 3: Open Portal
- Go to `http://localhost:3000` in your browser
- You should see the Media Center Portal dashboard

## ✅ Verify Everything Works

### Test Backend
```bash
curl http://localhost:5000/health
```

**Expected response:**
```json
{"status":"OK","timestamp":"2026-04-12T..."}
```

### Test Frontend
- Click on "Employees" in the navigation
- You should see a table (may be empty)
- Click "+ Add Employee"
- Fill in the form and save
- Employee should appear in the table

## 📝 First Steps

### 1. Add an Employee
1. Go to Employees
2. Click "+ Add Employee"
3. Fill in:
   - Name: Your name
   - Email: your@email.com
   - Work Days: Saturday,Sunday,Monday
   - Start Time: 09:00
   - End Time: 17:00
4. Click Save

### 2. Create a Program
1. Go to Programs
2. Click "+ Add Program"
3. Fill in:
   - Title: My First Program
   - Description: Test program
   - Air Time: 20:00
4. Click Save

### 3. Add an Episode
1. Select the program you created
2. Click "+ Add Episode"
3. Fill in:
   - Title: Episode 1
   - Episode Number: 1
   - Air Date: Today's date
4. Click Save

### 4. Add a Guest
1. Go to Guests
2. Click "+ Add Guest"
3. Fill in:
   - Name: Guest Name
   - Title: Doctor
   - Phone: +966501234567
4. Click Save

## 🎯 Common Tasks

### View All Data
- Click any menu item to see all records
- Data loads automatically

### Edit Data
- Click "Edit" button on any item
- Modify the form
- Click "Save"

### Delete Data
- Click "Delete" button
- Confirm deletion

### Search Guests
- Go to Guests page
- Use the search box to find guests by name

## 🆘 Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
# Kill the process or use different port
# Verify DATABASE_URL in .env
```

### Frontend won't connect
```bash
# Make sure backend is running
# Check browser console (F12)
# Verify VITE_API_URL in portal-frontend/.env
```

### No data showing
```bash
# Refresh the page (F5)
# Check browser console for errors
# Verify backend is running
```

## 📚 Next Steps

1. Read `MANAGER_GUIDE.md` for detailed features
2. Read `SETUP_GUIDE.md` for complete setup
3. Read `DEVELOPER_GUIDE.md` if you want to modify code

## 🎓 Video Tutorial

For a visual walkthrough, see the included video tutorial.

---

**That's it! You're ready to go! 🎉**
