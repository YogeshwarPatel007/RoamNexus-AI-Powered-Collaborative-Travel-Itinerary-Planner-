# 🌍 RoamNexus — AI-Powered Collaborative Trip Planner

RoamNexus is a full-stack, real-time travel planning web application. It uses **Large Language Models (Google Gemini 1.5 Flash, with Anthropic/Grok fallback)** to generate complete, highly personalized travel itineraries. Beyond solo travel planning, it features a real-time collaborative mode using **Socket.IO** where groups can democratically vote on trip preferences and generate a shared itinerary together.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React.js 18, Tailwind CSS, React Router v6, Framer Motion |
| **Backend** | Node.js, Express.js, Socket.IO (Real-time Collab) |
| **Database** | MongoDB (via Mongoose) |
| **AI Providers**| Google Gemini 1.5 Flash (default), Grok, Anthropic |
| **Auth** | JWT + bcrypt |

---

## 📁 Project Structure

```text
voyageweave/
├── backend/
│   ├── controllers/      # AI logic, Rooms, Users
│   ├── middleware/       # JWT auth
│   ├── models/           # Mongoose schemas (User, Trip, Room, Chat, Session)
│   ├── routes/           # REST API endpoints
│   ├── server.js         # Express app + MongoDB connection
│   └── socketHandler.js  # Real-time WebSocket logic (Group voting & Chat)
│
└── frontend/
    ├── public/
    └── src/
        ├── components/   # UI elements
        ├── context/      # AuthContext & RoomContext
        ├── pages/        # Views (Dashboard, Planner, Itinerary, etc.)
        └── utils/        # API interceptors
```

---

## 🎨 Key Features

- **✅ AI Trip Generation**: Day-wise itineraries, budget breakdown, hotels, and food via Gemini.
- **✅ Real-Time Collaboration**: Create "Rooms", invite friends, and live chat via Socket.IO.
- **✅ Democratic Voting**: Group trip sessions where users vote on budget, pace, vibe, and requirements. The system automatically aggregates votes and tie-breaks.
- **✅ Multi-LLM Support**: Configurable environment to use Gemini, Anthropic, or Grok.
- **✅ Authentication**: Secure JWT-based user login and session persistence.
- **✅ Modern UI**: Fully responsive, beautifully animated, card-based interface.

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v18+ ([nodejs.org](https://nodejs.org))
- MongoDB installed locally ([mongodb.com](https://www.mongodb.com/try/download/community))
- Google Gemini API Key ([aistudio.google.com](https://aistudio.google.com))

---

### Step 1 — Setup the Backend

```bash
cd backend
npm install
```

Create your `.env` file:
```bash
cp .env.example .env
```

Open `.env` and configure your values:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ai-trip-planner
JWT_SECRET=your_super_secret_key_here_make_it_long
CLIENT_URL=http://localhost:3000

# LLM Configuration
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_actual_gemini_api_key_here
# GROK_API_KEY=your_grok_key
# ANTHROPIC_API_KEY=your_anthropic_key
```

Start the backend:
```bash
npm run dev        # Development (with nodemon auto-reload)
# OR
npm start          # Production
```

---

### Step 2 — Setup the Frontend

Open a **new terminal**:
```bash
cd frontend
npm install
npm start
```

The app opens at **http://localhost:3000** 🎉

---

## 🌐 API Endpoints

### Auth & Trip Routes
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/api/auth/signup` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user profile | Yes |
| POST | `/api/trip/generate` | Generate AI itinerary | Yes |
| POST | `/api/trip/save` | Save a trip to DB | Yes |
| GET | `/api/trip/get` | Get all user trips | Yes |
| GET | `/api/trip/:id` | Get single trip | Yes |
| DELETE | `/api/trip/:id` | Delete a trip | Yes |
| PATCH | `/api/trip/:id/favorite` | Toggle favorite | Yes |

### Room & Collab Routes
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/api/rooms` | Create a new room | Yes |
| GET | `/api/rooms` | Get user's rooms | Yes |

*Note: Group trip voting, tie-breaking logic, and real-time messaging are handled exclusively over WebSockets via `socketHandler.js`.*

---

## 🐛 Troubleshooting

**MongoDB connection failed?**
- Ensure MongoDB service is running locally or check `MONGO_URI` in `.env`.

**Gemini API error?**
- Verify your `GEMINI_API_KEY`. Free tier has rate limits, wait and retry.
- Alternatively, swap `LLM_PROVIDER` in `.env` to use Anthropic or Grok.

**CORS errors?**
- Backend runs on port 5000, frontend on 3000. Ensure `CLIENT_URL` in backend `.env` matches your frontend origin.

---

## 📦 Build for Production

```bash
# Build frontend
cd frontend
npm run build
```

---

Built with ❤️ using React, Node.js, MongoDB, Socket.IO, and Generative AI.
