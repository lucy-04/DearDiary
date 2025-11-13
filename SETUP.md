# Dear Diary - Setup Instructions

## ✨ Project Overview

Dear Diary is a full-stack web application that combines:
- **Express.js Backend** (Node.js) - REST API with PostgreSQL
- **Python Flask ML Service** - Emotion detection model
- **EJS Frontend** - Beautiful, responsive UI with mood tracking

## 🚀 Quick Start

### 1. Backend Setup (Express + PostgreSQL)

```bash
# Install dependencies
npm install

# Create .env file with:
# PORT=5001
# JWT_SECRET=your_secret_key
# JWT_EXPIRES_IN=7d
# DATABASE_URL=your_postgresql_connection_string

# Start the Express server
node server.js
```

The backend will run on **http://localhost:5001**

### 2. Python ML Service Setup (Flask)

```bash
# Navigate to python directory
cd python

# Ensure you have the emotion detection model file
# File: text_emotion.pkl (should be in the python/ directory)

# Start the Flask service with gunicorn on port 8000
uv run gunicorn -w 4 -b 0.0.0.0:8000 main:app

# Or for development:
uv run python main.py
```

The ML service will run on **http://localhost:8000**

### 3. Access the Application

1. Open browser to **http://localhost:5001**
2. Register a new account at **/register**
3. Login at **/login**
4. Start writing your diary entries!

## 📁 Project Structure

```
DearDiary_forked/
├── server.js                 # Express server with EJS setup
├── package.json              # Node dependencies
├── config/
│   └── db.js                # PostgreSQL connection
├── controllers/
│   ├── authcontoller.js     # Authentication logic
│   └── diartcontroller.js   # Diary + emotion detection
├── routes/
│   ├── authRoutes.js        # Auth endpoints
│   └── diaryRoutes.js       # Diary + emotion endpoints
├── middlewatre/
│   └── authmiddleware.js    # JWT authentication
├── views/
│   ├── index.ejs            # Main diary interface
│   ├── login.ejs            # Login page
│   └── register.ejs         # Registration page
├── public/
│   ├── css/
│   │   └── style.css        # All styles
│   └── js/
│       ├── app.js           # Main app logic (API calls)
│       └── auth.js          # Authentication logic
└── python/
    ├── main.py              # Flask emotion detection API
    ├── text_emotion.pkl     # Trained ML model
    └── pyproject.toml       # Python dependencies
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Diary Entries (Protected - requires JWT token)
- `GET /api/entries` - Get all entries
- `GET /api/entries/:id` - Get single entry
- `POST /api/entries` - Create new entry
- `PUT /api/entries/:id` - Update entry
- `DELETE /api/entries/:id` - Delete entry
- `GET /api/entries/calendar/:year/:month` - Get calendar entries
- `POST /api/entries/detect-emotion` - Detect emotion from text

### Python ML Service
- `GET /` - Health check
- `POST /predict` - Emotion prediction (running on port 8000)
  ```json
  {
    "text": "Your diary entry text here"
  }
  ```

## 🎨 Features

### Frontend
- ✅ Beautiful glass-morphism UI design
- ✅ Mood tracking with 6 different moods
- ✅ Real-time character counter
- ✅ Search functionality
- ✅ Analytics dashboard (streak, top mood, charts)
- ✅ Responsive design
- ✅ Toast notifications
- ✅ Modal for viewing entries
- ✅ JWT-based authentication

### Backend
- ✅ RESTful API with Express.js
- ✅ PostgreSQL database
- ✅ JWT authentication & authorization
- ✅ Input validation (express-validator)
- ✅ Error handling middleware
- ✅ CORS enabled for Python service
- ✅ Emotion detection integration

### ML Service
- ✅ Flask API for emotion prediction
- ✅ Scikit-learn emotion classification model
- ✅ Returns prediction + probabilities
- ✅ Graceful fallback if service unavailable

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# Server
PORT=5001

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Database (PostgreSQL/CockroachDB)
DATABASE_URL=postgresql://user:password@host:port/database

# Optional: Python ML Service URL (default: http://localhost:8000)
AI_MODEL_API_URL=http://localhost:8000/predict
```

## 🧪 Testing the Integration

1. **Start Python ML Service**:
   ```bash
   cd python
   uv run gunicorn -w 4 -b 0.0.0.0:8000 main:app
   ```

2. **Start Express Backend**:
   ```bash
   node server.js
   ```

3. **Test Emotion Detection**:
   - Register and login at http://localhost:5001
   - Write a diary entry
   - Click "Detect Emotion" button
   - The app will call the Python service at port 8000 to detect emotion
   - You'll see the detected emotion and probabilities
   - The mood will be automatically selected (but you can change it)
   - Click "Save Entry" to save with your chosen mood

## 📝 How It Works

1. User writes a diary entry in the textarea
2. User clicks "Detect Emotion" button
3. Frontend (`app.js`) calls `/api/entries/detect-emotion`
4. Backend (`diartcontroller.js`) forwards the text to Python Flask at `http://localhost:8000/predict`
5. Python returns emotion prediction with probabilities (happy, sad, angry, etc.)
6. Frontend automatically selects the detected mood
7. User can change the mood if desired
8. User clicks "Save Entry"
9. Backend creates the diary entry with the selected mood
10. Entry appears in the history immediately (no page reload)

## 🛠️ Troubleshooting

### Python Service Connection Error
- Make sure Flask is running on port 8000
- Check firewall settings
- Verify the model file `text_emotion.pkl` exists in `python/` directory
- The backend will use default "neutral" emotion if service is unavailable

### Database Connection Error
- Verify DATABASE_URL in .env
- Ensure PostgreSQL is running
- Check database permissions

### JWT Authentication Issues
- Clear localStorage in browser
- Generate a new JWT_SECRET
- Re-register/login

## 🎯 Next Steps

- Add edit functionality for diary entries
- Implement data export (PDF, JSON)
- Add calendar view
- Enhance emotion model with more emotions
- Add rich text editor
- Implement sharing features

## 📦 Dependencies

### Node.js
- express
- ejs
- cors
- helmet
- morgan
- pg (PostgreSQL)
- bcrypt
- jsonwebtoken
- express-validator
- dotenv
- axios

### Python
- flask
- joblib
- scikit-learn (for model)
- gunicorn

---

**Created with ❤️ | Happy Journaling! 📖✨**
