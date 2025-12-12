# Analyzer App - Quick Start Guide

## 🚀 Get Started in 10 Minutes

### Prerequisites Check
```bash
# Check Node.js (need v16+)
node --version

# Check npm
npm --version

# Check if MongoDB is running locally (optional if using Atlas)
# Windows: Check Services for "MongoDB"
# Mac/Linux: systemctl status mongod
```

### Step 1: Install Backend (2 minutes)
```bash
cd backend
npm install
```

### Step 2: Configure Environment (1 minute)
```bash
# The .env file is already created, but you need to update it

# For local MongoDB (easiest):
# - Make sure MongoDB is running on your system
# - MONGO_URI is already set to: mongodb://localhost:27017/analyzer

# For MongoDB Atlas (recommended for production):
# 1. Go to https://cloud.mongodb.com
# 2. Create a free cluster
# 3. Get connection string
# 4. Update MONGO_URI in .env file
```

**Edit backend/.env:**
```env
MONGO_URI=mongodb://localhost:27017/analyzer
SESSION_SECRET=your-secret-key-change-this
PORT=4000
NODE_ENV=development
```

### Step 3: Create Admin User (30 seconds)
```bash
npm run seed
```

Output should show:
```
✅ Admin user created successfully
Email: admin@analyzer.com
Password: admin123
```

### Step 4: Start Backend (30 seconds)
```bash
npm start
```

You should see:
```
MongoDB Connected: ...
Server running on port 4000
```

### Step 5: Install Frontend (2 minutes)
```bash
# Open NEW terminal
cd frontend
npm install
```

### Step 6: Start Frontend (30 seconds)
```bash
npm run dev
```

You should see:
```
VITE v5.x ready in xxx ms
➜  Local:   http://localhost:5173/
```

### Step 7: Access Application (30 seconds)
1. Open browser: http://localhost:5173
2. Login with:
   - Email: `admin@analyzer.com`
   - Password: `admin123`

### Step 8: Upload Answer CSV (1 minute)
1. Go to Admin Dashboard
2. Click "Answer CSV" tab
3. Upload `test-data/answer.csv`
4. Wait for success message

### Step 9: Create Test User (1 minute)
1. Stay in Admin Dashboard
2. Click "Manage Users" tab
3. Fill form:
   - Email: `test@example.com`
   - Password: `test123`
   - Team Name: `Test Team`
   - Role: `user`
4. Click "Create User"

### Step 10: Test as User (2 minutes)
1. Logout (top right)
2. Login as test user:
   - Email: `test@example.com`
   - Password: `test123`
3. Upload `test-data/user_submission_80.csv`
4. View results!
5. Check leaderboard

## ✅ Verification Checklist

- [ ] Backend running on port 4000
- [ ] Frontend running on port 5173
- [ ] Can login as admin
- [ ] Can upload answer CSV
- [ ] Can create test user
- [ ] Can login as test user
- [ ] Can upload submission
- [ ] Can view results
- [ ] Can see leaderboard

## 🎉 Success!

You now have a working Analyzer App!

## 📚 Next Steps

### Learn the System
- [ ] Read [README.md](README.md) for detailed documentation
- [ ] Review [METRICS.md](METRICS.md) to understand calculations
- [ ] Check [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for overview

### Customize
- [ ] Change admin password
- [ ] Adjust upload limits
- [ ] Modify UI styling
- [ ] Add your own test data

### Deploy
- [ ] Review [DEPLOYMENT.md](DEPLOYMENT.md)
- [ ] Set up production MongoDB
- [ ] Configure production environment
- [ ] Deploy to hosting provider

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 4000 is in use
# Windows:
netstat -ano | findstr :4000

# Mac/Linux:
lsof -i :4000

# If MongoDB connection fails:
# 1. Check MongoDB is running
# 2. Verify MONGO_URI in .env
```

### Frontend won't start
```bash
# Check if port 5173 is in use
# Windows:
netstat -ano | findstr :5173

# Mac/Linux:
lsof -i :5173

# Clear node_modules and reinstall:
rm -rf node_modules package-lock.json
npm install
```

### Can't login
```bash
# Make sure you ran the seed script:
cd backend
npm run seed

# Check if backend is running and accessible:
# Visit: http://localhost:4000/api/health
```

### CSV upload fails
- Check file is valid CSV format
- Ensure columns: row_id, label
- File size under 10MB
- Answer CSV must be uploaded first (admin only)

### Session not persisting
- Check SESSION_SECRET is set in .env
- Verify MongoDB connection
- Clear browser cookies and try again

## 🆘 Still Need Help?

1. Check backend console for error messages
2. Check browser console (F12) for errors
3. Review code comments in source files
4. Check MongoDB connection status
5. Verify all environment variables are set

## 🎯 Common Commands

```bash
# Backend commands
cd backend
npm start          # Start server
npm run dev        # Start with auto-reload
npm run seed       # Seed database
npm test          # Run tests

# Frontend commands
cd frontend
npm run dev       # Start dev server
npm run build     # Build for production
npm run preview   # Preview production build

# MongoDB commands (if running locally)
# Windows:
net start MongoDB

# Mac/Linux:
sudo systemctl start mongod
```

## 📊 Test Data Explained

- `answer.csv` - Canonical answer (50 rows, 3 classes)
- `user_submission_100.csv` - Perfect submission (100% accuracy)
- `user_submission_80.csv` - Good submission (80% accuracy)
- `user_submission_60.csv` - Fair submission (60% accuracy)

Test the app by uploading these in order to see different results!

## 🔒 Default Credentials

**Admin:**
- Email: admin@analyzer.com
- Password: admin123

**Test User (after creation):**
- Email: test@example.com
- Password: test123

⚠️ **Remember to change these passwords in production!**

---

**You're all set! Happy analyzing! 🎊**

Need more details? Check the full [README.md](README.md)
