# Media Center Portal - Manager Guide

## 🎯 Quick Start

### Starting the System

1. **Start Backend Server** (Terminal 1)
   ```bash
   npm run dev
   ```
   Wait for: `🚀 Server running on port 5000`

2. **Start Frontend Server** (Terminal 2)
   ```bash
   cd portal-frontend
   npm run dev
   ```
   Wait for: `Local: http://localhost:3000`

3. **Open Portal**
   - Go to `http://localhost:3000` in your browser

## 📋 Features Overview

### 1. 👥 Employees Management
**Location:** Employees menu

**What you can do:**
- Add new employees with name, email, and schedule
- Set work days (e.g., Saturday,Sunday,Monday)
- Set start and end times for work hours
- Edit employee information
- Delete employees

**Example:**
- Name: أحمد محمد
- Email: ahmed@example.com
- Work Days: Saturday,Sunday,Monday
- Start Time: 09:00
- End Time: 17:00

### 2. 📺 Programs Management
**Location:** Programs menu

**What you can do:**
- Create new programs with title and description
- Set program air time
- View all programs
- Edit program details
- Delete programs

**For each program, you can:**
- Add episodes
- Set episode number and air date
- Track episode information

### 3. 🎬 Episodes Management
**Location:** Programs menu (right side)

**What you can do:**
- Add episodes to programs
- Set episode number and title
- Set air date for each episode
- Edit episode details
- Delete episodes

**Note:** Select a program first to see its episodes

### 4. 🎤 Guests Management
**Location:** Guests menu

**What you can do:**
- Add guest information (name, title, bio, phone)
- Search for guests
- Edit guest details
- Delete guests

**Example:**
- Name: Dr. محمد علي
- Title: Doctor
- Bio: Specialist in media
- Phone: +966501234567

### 5. 📋 Desks & Teams
**Location:** Desks menu

**Desks (Left side):**
- Create desks (departments) like: Ideas, Production, Publishing
- Add descriptions
- Assign managers
- Edit desk information
- Delete desks

**Teams (Right side):**
- Add teams within each desk
- Set team names
- Assign team managers
- Edit team details
- Delete teams

**Note:** Select a desk first to see its teams

### 6. 📜 Editorial Policies
**Location:** Policies menu

**What you can do:**
- Create editorial policies
- Add policy name and description
- Define rules for the policy
- Mark policies as active/inactive
- Edit policies
- Delete policies

## 🎨 User Interface Guide

### Navigation Bar
- **Desks** - Manage desks and teams
- **Teams** - View teams (also in Desks page)
- **Users** - Manage employees
- **Programs** - Manage programs and episodes
- **Episodes** - View episodes (also in Programs page)
- **Guests** - Manage guests
- **Policies** - Manage editorial policies

### Common Actions

**Adding New Item:**
1. Click "+ Add [Item]" button
2. Fill in the form
3. Click "Save"

**Editing Item:**
1. Click "Edit" button on the item
2. Modify the information
3. Click "Save"

**Deleting Item:**
1. Click "Delete" button
2. Confirm deletion

**Searching:**
- Use the search functionality in Guests page
- Filter by name

## 💡 Tips & Best Practices

### For Employees
- Use consistent email format
- Set work days as comma-separated values
- Use 24-hour format for times (09:00, 17:00)

### For Programs
- Add descriptive titles
- Set air times for better scheduling
- Link episodes to programs

### For Episodes
- Number episodes sequentially
- Set air dates for tracking
- Add episode titles for identification

### For Guests
- Include phone numbers for contact
- Add titles/positions for context
- Write brief bios for reference

### For Organization
- Create desks for each department
- Organize teams within desks
- Assign managers for accountability

## 🔄 Workflow Example

### Setting up a New Program

1. **Create Desk** (if needed)
   - Go to Desks
   - Click "+ Add Desk"
   - Name: "Production"
   - Save

2. **Create Team** (if needed)
   - Select the desk
   - Click "+ Add Team"
   - Name: "News Team"
   - Save

3. **Add Employees**
   - Go to Employees
   - Click "+ Add Employee"
   - Add team members
   - Set their schedules

4. **Create Program**
   - Go to Programs
   - Click "+ Add Program"
   - Title: "Daily News"
   - Description: "Daily news broadcast"
   - Air Time: "20:00"
   - Save

5. **Add Episodes**
   - Select the program
   - Click "+ Add Episode"
   - Episode 1: "Breaking News"
   - Air Date: Today's date
   - Save

6. **Add Guests** (if needed)
   - Go to Guests
   - Click "+ Add Guest"
   - Add guest information
   - Save

## ⚠️ Important Notes

- **Data is saved immediately** - No need to click save multiple times
- **Deletions are permanent** - Confirm before deleting
- **All fields are required** - Fill in all information before saving
- **Email must be unique** - Each employee needs a different email
- **Times use 24-hour format** - 09:00 for 9 AM, 17:00 for 5 PM

## 🆘 Troubleshooting

### Can't see data after adding
- Refresh the page (F5)
- Check browser console for errors

### Can't connect to backend
- Ensure backend server is running
- Check if port 5000 is available
- Restart both servers

### Form won't submit
- Check all required fields are filled
- Verify email format is correct
- Check browser console for errors

## 📞 Support

If you encounter issues:
1. Check the browser console (F12)
2. Restart both servers
3. Clear browser cache and refresh
4. Check database connection

## 🎓 Video Tutorial

For a visual guide, refer to the setup video or contact the development team.

---

**Happy Managing! 🚀**
