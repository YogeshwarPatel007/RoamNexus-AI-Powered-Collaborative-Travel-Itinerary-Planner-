# 🌍 RoamNexus — Complete Project Explanation (Extreme Detail)

> **Purpose of this document:** This file explains every single file, folder, function, and concept used in this project in such detail that even someone with zero prior knowledge of web development can understand it from start to finish.

---

## TABLE OF CONTENTS

1. [What is this Project?](#1-what-is-this-project)
2. [What Technologies are Used and Why?](#2-what-technologies-are-used-and-why)
3. [How the Project Folder is Organized](#3-how-the-project-folder-is-organized)
4. [The Backend — Explained File by File](#4-the-backend--explained-file-by-file)
   - 4.1 server.js — The Entry Point
   - 4.2 The `.env` File — Secrets & Configuration
   - 4.3 middleware/auth.js — The Security Guard
   - 4.4 models/ — Database Blueprints (Schemas)
   - 4.5 routes/ — URL Endpoints
   - 4.6 controllers/authController.js — User Registration & Login
   - 4.7 controllers/roomController.js — Collaborative Rooms
   - 4.8 controllers/tripController.js — The AI Brain
   - 4.9 socketHandler.js — Real-Time Communication
5. [The Frontend — Explained File by File](#5-the-frontend--explained-file-by-file)
   - 5.1 index.js — The Starting Point
   - 5.2 App.js — Routing & Page Structure
   - 5.3 context/ — Global State Management
   - 5.4 utils/api.js — HTTP Request Helper
   - 5.5 components/ — Reusable UI Building Blocks
   - 5.6 pages/ — The Actual Screens
   - 5.7 Styling — Tailwind CSS, index.css, tailwind.config.js
6. [Complete Data Flow — Step by Step](#6-complete-data-flow--step-by-step)
7. [The Group Trip Voting System — Full Breakdown](#7-the-group-trip-voting-system--full-breakdown)
8. [How the AI Generates Itineraries — The Prompt Engineering](#8-how-the-ai-generates-itineraries--the-prompt-engineering)
9. [Security Mechanisms](#9-security-mechanisms)
10. [NPM Dependencies Explained](#10-npm-dependencies-explained)
11. [How to Run the Project](#11-how-to-run-the-project)

---

## 1. What is this Project?

RoamNexus is a **full-stack web application** that helps people plan trips using Artificial Intelligence. Instead of manually searching Google for hotels, places to visit, and restaurants, a user simply tells the app:
- Where they want to go (e.g., "Jaipur")
- Where they are coming from (e.g., "Mumbai")
- How many days (e.g., 5)
- Their budget (e.g., "mid-range")
- Their interests (e.g., "food, culture, history")

The app then sends all of this information to **Google's Gemini AI** (a Large Language Model, similar to ChatGPT), which generates a **complete day-by-day travel plan** including:
- A timetable for each day (what to do at 9 AM, 11 AM, 2 PM, etc.)
- Real hotel recommendations with prices and ratings
- Real restaurant suggestions for each meal
- A full budget breakdown (how much you will spend on stay, food, transport, activities)
- Packing lists and emergency contacts

**The unique feature:** Beyond individual planning, this app supports **real-time group trip planning**. Multiple friends can join a "room" (like a group chat), each votes on their budget, pace, and preferences, and the system **democratically aggregates** everyone's votes to generate a single trip that satisfies the group.

---

## 2. What Technologies are Used and Why?

### Frontend (What the user sees in the browser)
| Technology | What it does | Why it was chosen |
|---|---|---|
| **React.js 18** | A JavaScript library for building user interfaces. It lets you build a website out of small, reusable "components" (like LEGO blocks). | Industry standard, fast, huge community |
| **Tailwind CSS** | A utility-first CSS framework. Instead of writing custom CSS rules, you add small class names directly to HTML (e.g., `text-red-500`, `p-4`) | Very fast to develop with, consistent styling |
| **React Router v6** | Handles navigation between different pages (e.g., `/login`, `/dashboard`, `/plan`) without reloading the entire browser page | The standard routing library for React |
| **Framer Motion** | Adds smooth animations and transitions to React components | Makes the UI feel alive and premium |
| **Axios** | A library for making HTTP requests (GET, POST, etc.) from the browser to the backend server | Simpler API than native `fetch`, supports interceptors |
| **Socket.IO Client** | Enables real-time, bidirectional communication with the server (for live chat and voting) | Industry standard for real-time web apps |
| **Lucide React** | A library of beautiful, consistent SVG icons (map pins, users, clocks, etc.) | Lightweight, looks professional |
| **React Hot Toast** | Shows small notification pop-ups (e.g., "Trip saved!", "Login failed") | Clean, customizable toast notifications |
| **date-fns** | A utility library for formatting dates and times | Lightweight alternative to Moment.js |

### Backend (The server that runs behind the scenes)
| Technology | What it does | Why it was chosen |
|---|---|---|
| **Node.js** | Allows JavaScript to run outside the browser, on a server | Same language as frontend, fast I/O |
| **Express.js** | A minimal web framework for Node.js that makes it easy to define API routes (URLs) | The most popular Node.js framework |
| **MongoDB** | A NoSQL database that stores data as JSON-like documents (not tables like SQL) | Flexible schema, perfect for storing varied AI responses |
| **Mongoose** | An ODM (Object Data Modeling) library that provides a structured way to interact with MongoDB | Adds schema validation, type checking |
| **Socket.IO** | Server-side real-time communication library (pairs with the client-side Socket.IO) | Handles WebSocket connections with automatic fallback |
| **JSON Web Tokens (JWT)** | A standard for securely transmitting information between parties as a JSON object, used here for login sessions | Stateless authentication, no server-side sessions needed |
| **bcryptjs** | A library that hashes (encrypts) passwords before storing them in the database | Passwords are never stored in plain text |
| **@google/generative-ai** | Google's official SDK for interacting with the Gemini AI API | Direct integration with Gemini models |
| **@anthropic-ai/sdk** | Anthropic's SDK for Claude AI models | Backup/alternative AI provider |
| **openai** | OpenAI's SDK, repurposed here to connect to Grok (xAI's model) via a custom base URL | Third AI provider option |

---

## 3. How the Project Folder is Organized

```
RoamNexus/
│
├── backend/                          ← The server-side code
│   ├── .env                          ← Secret keys (API keys, database URL) — NEVER commit this
│   ├── .gitignore                    ← Tells Git which files to ignore
│   ├── package.json                  ← Lists all backend dependencies and scripts
│   ├── server.js                     ← THE MAIN FILE — starts everything
│   ├── socketHandler.js              ← ALL real-time WebSocket logic (720 lines)
│   ├── middleware/
│   │   └── auth.js                   ← Checks if user is logged in before allowing access
│   ├── models/                       ← Database "blueprints" (what data looks like)
│   │   ├── User.js                   ← User accounts (name, email, hashed password)
│   │   ├── Trip.js                   ← Saved trip itineraries
│   │   ├── Room.js                   ← Collaborative rooms (group chat spaces)
│   │   ├── ChatMessage.js            ← Messages sent in rooms
│   │   ├── GroupTripSession.js        ← Active voting sessions
│   │   └── TripPreferenceResponse.js  ← Individual user votes
│   ├── controllers/                  ← Business logic (what happens when a route is hit)
│   │   ├── authController.js         ← Signup, login, profile update
│   │   ├── tripController.js         ← AI prompt building, trip CRUD
│   │   └── roomController.js         ← Room creation, joining, history
│   └── routes/                       ← Maps URLs to controller functions
│       ├── auth.js                   ← /api/auth/* routes
│       ├── trip.js                   ← /api/trip/* routes
│       └── room.js                   ← /api/rooms/* routes
│
├── frontend/                         ← The browser-side code
│   ├── package.json                  ← Lists all frontend dependencies
│   ├── tailwind.config.js            ← Tailwind CSS customization (colors, fonts, animations)
│   ├── postcss.config.js             ← PostCSS plugin configuration for Tailwind
│   ├── public/                       ← Static files served as-is (index.html, favicon)
│   └── src/                          ← All React source code
│       ├── index.js                  ← THE ENTRY POINT — renders <App /> into the browser
│       ├── index.css                 ← Global styles, custom Tailwind components
│       ├── App.js                    ← Route definitions, context providers, protected routes
│       ├── context/                  ← React Contexts (global state shared across components)
│       │   ├── AuthContext.js        ← Manages logged-in user state
│       │   ├── SocketContext.js      ← Manages the WebSocket connection
│       │   └── RoomContext.js        ← Manages room, chat, and voting state
│       ├── utils/
│       │   └── api.js                ← Axios instance with JWT token auto-attach
│       ├── components/               ← Reusable UI pieces
│       │   ├── GroupFormPanel.js      ← The group voting form (438 lines)
│       │   ├── ItineraryCard.js      ← Card showing a generated trip summary
│       │   └── ui/
│       │       ├── Navbar.js         ← Top navigation bar
│       │       └── LoadingSpinner.js ← Animated loading indicator
│       └── pages/                    ← Full-screen views
│           ├── LandingPage.js        ← Marketing/hero page (first thing visitors see)
│           ├── LoginPage.js          ← Login form
│           ├── SignupPage.js         ← Registration form with password strength indicator
│           ├── DashboardPage.js      ← Shows all saved trips
│           ├── PlannerPage.js        ← The main solo trip planning form (32KB, biggest page)
│           ├── ItineraryPage.js      ← Renders AI-generated itinerary (50KB, most complex page)
│           ├── TripDetailPage.js     ← View a previously saved trip
│           ├── RoomsPage.js          ← List/create/join collaborative rooms
│           └── RoomPage.js           ← Inside a room: chat + group voting
│
└── README.md                         ← Project overview and setup instructions
```

---

## 4. The Backend — Explained File by File

### 4.1 `server.js` — The Entry Point

**What it does:** This is the very first file that runs when you type `npm start` in the backend folder. It sets up the entire server.

**Step-by-step breakdown:**
1. **Imports libraries**: `express` (web framework), `mongoose` (database), `cors` (cross-origin requests), `dotenv` (reads `.env` file).
2. **Loads environment variables**: `dotenv.config()` reads the `.env` file and makes values like `MONGO_URI` and `GEMINI_API_KEY` available via `process.env`.
3. **Creates the Express app**: `const app = express()` — this is the core server object.
4. **Configures CORS**: CORS (Cross-Origin Resource Sharing) is a security feature in browsers. Since the frontend runs on port 3000 and the backend on port 5000, the browser would normally block requests between them. CORS configuration tells the browser "it's okay, allow requests from port 3000".
5. **Sets up JSON parsing**: `app.use(express.json({ limit: '10mb' }))` — tells Express to automatically parse incoming JSON request bodies (up to 10MB, because AI responses can be large).
6. **Mounts API routes**: 
   - `app.use('/api/auth', authRoutes)` — any request starting with `/api/auth/` goes to the auth router.
   - `app.use('/api/trip', tripRoutes)` — any request starting with `/api/trip/` goes to the trip router.
   - `app.use('/api/rooms', roomRoutes)` — any request starting with `/api/rooms/` goes to the room router.
7. **Error handling**: A catch-all middleware that returns a JSON error response for any unhandled errors.
8. **404 handler**: If someone requests a URL that doesn't match any route, return "Route not found".
9. **Connects to MongoDB**: `mongoose.connect(process.env.MONGO_URI)` — establishes a connection to the MongoDB database. If successful, it proceeds to start the HTTP server.
10. **Creates HTTP + Socket.IO server**: After MongoDB connects, it creates an HTTP server from the Express app, then wraps it with Socket.IO for real-time capabilities.
11. **Initializes Socket handlers**: Calls `initSocket(io)` from `socketHandler.js` to register all real-time event listeners.
12. **Starts listening**: The server starts listening on port 5000 and logs which LLM provider is configured and which API keys are available.

---

### 4.2 The `.env` File — Secrets & Configuration

This file stores sensitive information that should NEVER be committed to Git.

| Variable | Purpose | Current Value |
|---|---|---|
| `PORT` | Which port the backend listens on | `5000` |
| `MONGO_URI` | Connection string to the MongoDB database | `mongodb://localhost:27017/ai-trip-planner` |
| `JWT_SECRET` | A secret string used to sign authentication tokens | A long random string |
| `LLM_PROVIDER` | Which AI model to use (`gemini`, `grok`, or `anthropic`) | `gemini` |
| `GEMINI_API_KEY` | The API key for Google Gemini | Starts with `AIza...` |
| `GEMINI_MODEL` | Which specific Gemini model to use | `gemini-2.5-flash` |

---

### 4.3 `middleware/auth.js` — The Security Guard

**What is middleware?** In Express.js, middleware is a function that runs BEFORE the actual route handler. Think of it as a security guard at a door — it checks your credentials before letting you into the building.

**What this file does:**
1. Extracts the `Authorization` header from the incoming HTTP request. The header looks like: `Bearer eyJhbGciOiJIUz...` (the word "Bearer" followed by a long token string).
2. If no header or it doesn't start with "Bearer ", it returns a `401 Unauthorized` error.
3. Splits the header to extract just the token part.
4. Uses `jwt.verify()` to decode and validate the token using the `JWT_SECRET`. If someone tampered with the token, this will throw an error.
5. Uses the decoded `id` from inside the token to look up the user in MongoDB. This ensures the user still exists and hasn't been deleted.
6. Attaches the user object to `req.user` so that all subsequent route handlers can access the logged-in user's information.
7. Calls `next()` to pass control to the actual route handler.

**If anything goes wrong** (expired token, invalid token, user deleted), it returns a `401` error with an appropriate message.

---

### 4.4 `models/` — Database Blueprints (Schemas)

In MongoDB with Mongoose, a "model" defines the structure (schema) of a document. Think of it as a form template — it says "a User must have a name (string), an email (string), and a password (string)".

#### 4.4.1 `User.js` — User Accounts
**Fields:**
- `name`: String, required, 2-50 characters, trimmed of whitespace
- `email`: String, required, must be unique, stored in lowercase, validated with a regex pattern
- `password`: String, required, minimum 6 characters, **`select: false`** — this is critical. It means that by default, when you query for a user, the password field is NOT included in the result. You must explicitly request it with `.select('+password')`.
- `avatar`: String, optional, defaults to empty string

**Special behaviors (Mongoose middleware):**
- `pre('save')` hook: Before saving a user document, if the password was changed, it automatically hashes it using bcrypt with a salt round of 12. This means the plain text password "myPassword123" gets converted to something like `$2a$12$LJ3m...` which is irreversible.
- `comparePassword()` method: Takes a candidate plain-text password and compares it against the stored hash using `bcrypt.compare()`. Returns true/false.

#### 4.4.2 `Trip.js` — Saved Trip Itineraries
**Fields:**
- `userId`: ObjectId reference to the User who created/owns this trip. Indexed for fast lookups.
- `title`: String, e.g., "Jaipur Heritage Tour - 5 Days"
- `tripDetails`: An embedded object containing `source`, `destination`, `travelMode` (enum: flight/train/bus/car), `budget`, `days` (1-30), `people` (1-20), and `preferences` (array of strings).
- `itinerary`: `Mixed` type — this stores the entire AI-generated JSON response (which can have deeply nested objects with days, schedules, hotels, budgets, etc.). Using `Mixed` means Mongoose doesn't enforce a specific structure on this field.
- `rawResponse`: String, the raw AI text response stored as a backup.
- `isFavorite`: Boolean, default false. Toggled by the user.
- `roomId`: ObjectId reference to a Room (null for solo trips).
- `groupSessionId`: ObjectId reference to a GroupTripSession (null for solo trips).
- `isGroupTrip`: Boolean, default false.
- A compound index on `{ userId: 1, createdAt: -1 }` for fast retrieval of a user's trips sorted by newest first.

#### 4.4.3 `Room.js` — Collaborative Rooms
**Fields:**
- `name`: String, 2-50 characters (e.g., "Goa Trip Gang")
- `code`: String, required, unique, stored in uppercase, indexed. This is the 6-character invite code (e.g., "A7B3K9") that friends use to join.
- `createdBy`: ObjectId reference to the User who created the room.
- `members`: An array of objects, each containing `userId` (ObjectId) and `joinedAt` (Date, defaults to now).

**Static method `generateCode()`:** Generates a unique 6-character alphanumeric code. It deliberately excludes visually confusing characters (I, O, 0, 1) to prevent users from mistyping codes. It uses `crypto.randomBytes()` for cryptographic randomness and retries up to 10 times if a collision (duplicate code) is found.

#### 4.4.4 `ChatMessage.js` — Room Chat Messages
**Fields:**
- `roomId`: ObjectId reference to the Room. Indexed.
- `senderId`: ObjectId reference to the User. **Defaults to null** — a null sender means it's a system message (e.g., "Alice joined the room").
- `content`: String, max 2000 characters.
- `messageType`: Enum (`text`, `system`, `itinerary_card`). `text` is a normal user message, `system` is an automated notification, `itinerary_card` is used for embedding trip results in chat.
- `metadata`: Mixed type, for storing extra data associated with special message types.
- Compound index on `{ roomId: 1, createdAt: 1 }` for efficiently fetching all messages in a room in chronological order.

#### 4.4.5 `GroupTripSession.js` — Voting Sessions
**Fields:**
- `roomId`: ObjectId reference to the Room.
- `triggeredBy`: ObjectId reference to the User who started the session (the "host").
- `status`: Enum (`collecting`, `finalized`, `cancelled`). Starts as `collecting`, transitions to `finalized` when the AI generates the trip, or `cancelled` if dismissed.
- `logisticsData`: An embedded object with `source`, `destination`, `travelMode`, `startDate`, `endDate`, `days`, `people` — these are set by the host and NOT voted on.
- `responseDeadline`: Date, currently unused (set to null).
- `finalizedAt`: Date, set when the session is finalized.
- `aggregatedPreferences`: Mixed type, stores the result of the vote aggregation after finalization.
- `tieBreakLog`: Array of objects documenting any ties that had to be broken (which field, what the tied options were, who won, and why).
- `resultTripId`: ObjectId reference to the generated Trip.

#### 4.4.6 `TripPreferenceResponse.js` — Individual Votes
This is the most complex schema. Each member of a room submits one of these per session.

**Fields organized by voting category:**
- **Attendance**: `attending` (Boolean, default true) — "Am I coming?"
- **Category B — Single-Select (Majority Vote):**
  - `travellerType`: Enum (solo/couple/family/friends/business)
  - `pace`: Enum (auto/relaxed/moderate/packed)
  - `budgetTier`: Enum (minimum/medium/luxury/ultra)
  - `distanceRange`: String (e.g., "5" meaning within 5 km)
- **Category C — Multi-Select (Approval Voting):**
  - `preferences`: Array of strings (e.g., ["Adventure", "Food", "Culture"])
  - `mealPreference`: Array of strings (e.g., ["Vegetarian", "Street food"])
  - `tripVibe`: Array of strings (e.g., ["Relaxation", "Photography"])
- **Category D — Boolean (Any-Yes-Wins):**
  - `hasChildren`: Boolean — if even ONE person says true, the trip accounts for children
  - `hasElderly`: Boolean — same logic
  - `accessibilityNeeds`: Boolean — same logic
- **Category E — Free Text (Concatenate):**
  - `specialRequirements`: String, max 500 chars
- **Group-Specific Additions:**
  - `roomSharing`: Enum (same-gender/no-preference/private-room)
  - `budgetFlexibility`: Enum (strict/flexible)
  - `mustAvoid`: String, max 500 chars (e.g., "no seafood, avoid old city at night")

**Compound unique index** on `{ sessionId: 1, userId: 1 }` — this ensures each user can only have ONE response per session. If they submit again, it overwrites their previous response (upsert).

---

### 4.5 `routes/` — URL Endpoints

Routes are simple mapping files. They define "when someone sends a request to URL X, call function Y".

#### 4.5.1 `routes/auth.js`
- `POST /api/auth/signup` — Calls `signup()` with validation rules (name: 2-50 chars, email: valid format, password: min 6 chars)
- `POST /api/auth/login` — Calls `login()` with validation rules
- `GET /api/auth/me` — Protected (requires `authMiddleware`). Calls `getMe()`.
- `PUT /api/auth/profile` — Protected. Calls `updateProfile()`.

#### 4.5.2 `routes/trip.js`
All routes require authentication (`router.use(authMiddleware)` — this applies the auth check to ALL routes in this file).
- `POST /api/trip/generate` — Calls `generateTrip()` (sends data to AI)
- `POST /api/trip/save` — Calls `saveTrip()` (saves to database)
- `GET /api/trip/get` — Calls `getTrips()` (fetches all user's trips)
- `GET /api/trip/:id` — Calls `getTripById()` (fetches a single trip by its MongoDB ID)
- `DELETE /api/trip/:id` — Calls `deleteTrip()`
- `PATCH /api/trip/:id/favorite` — Calls `toggleFavorite()`

#### 4.5.3 `routes/room.js`
All routes require authentication.
- `POST /api/rooms` — Creates a new room
- `POST /api/rooms/join` — Joins a room by entering a 6-character code
- `GET /api/rooms/my/list` — Gets all rooms the user belongs to
- `GET /api/rooms/:id` — Gets detailed info about a specific room
- `GET /api/rooms/:id/history` — Gets all past group trips generated in this room

---

### 4.6 `controllers/authController.js` — User Registration & Login

#### `signup(req, res)`
1. Validates input using `express-validator` results. If validation fails, returns 422 with error details.
2. Checks if a user with the same email already exists. If yes, returns 409 (Conflict).
3. Creates the user via `User.create({ name, email, password })`. The password is automatically hashed by the Mongoose `pre('save')` hook defined in User.js.
4. Generates a JWT token that expires in 7 days: `jwt.sign({ id: userId }, secret, { expiresIn: '7d' })`.
5. Returns the token and user info (but NOT the password).

#### `login(req, res)`
1. Validates input.
2. Finds the user by email. Crucially, uses `.select('+password')` because the password field is hidden by default.
3. If no user found, returns 401 "Invalid email or password" (deliberately vague to prevent email enumeration attacks).
4. Compares the submitted password with the stored hash using `user.comparePassword()`.
5. If match, generates a JWT token and returns it with user info.

#### `getMe(req, res)`
Simply returns `req.user` — the user object that was attached by the auth middleware. This is called on app startup to verify the stored token is still valid.

#### `updateProfile(req, res)`
Updates the user's name. Validates it must be at least 2 characters.

---

### 4.7 `controllers/roomController.js` — Collaborative Rooms

#### `createRoom(req, res)`
1. Validates room name (min 2 chars).
2. Generates a unique 6-character code using `Room.generateCode()`.
3. Creates the room with the current user as both `createdBy` and the first member.
4. Returns the room info including the invite code.

#### `joinRoom(req, res)`
1. Validates the code is exactly 6 characters.
2. Looks up the room by code (case-insensitive, converted to uppercase).
3. If the user is already a member, it simply welcomes them back without duplicating.
4. If they're new, pushes their `userId` into the `members` array.
5. Returns populated room data (with member names and avatars resolved from the User collection).

#### `getRoomDetails(req, res)`
Fetches full room details including populated member info. Verifies the requesting user is actually a member before returning data (security check).

#### `getRoomHistory(req, res)`
Finds all trips where `roomId` matches and `isGroupTrip` is true. Returns them sorted newest first. This lets room members see all previously generated group itineraries.

#### `getMyRooms(req, res)`
Finds all rooms where the current user's ID appears in the `members` array. Returns a summary (name, code, member count, first 5 member names).

---

### 4.8 `controllers/tripController.js` — The AI Brain (339 lines)

This is the most important and complex backend file. It contains the core AI integration.

#### Budget Tier System
The app defines 4 hardcoded budget tiers with specific price ranges (in Indian Rupees):

| Tier | Hotel Cost/Night | Breakfast | Lunch | Dinner | Daily Total |
|---|---|---|---|---|---|
| **Minimum** (Backpacker) | ₹300-800 | ₹50-100 | ₹80-150 | ₹100-200 | ₹500-1,200 |
| **Medium** (Mid-range) | ₹1,500-3,500 | ₹200-350 | ₹350-600 | ₹500-1,000 | ₹3,000-6,000 |
| **Luxury** | ₹4,000-9,000 | ₹600-900 | ₹1,200-2,000 | ₹2,000-3,500 | ₹9,000-18,000 |
| **Ultra** | ₹10,000+ | ₹1,500-2,500 | ₹3,000-5,000 | ₹5,000-12,000 | ₹25,000-60,000 |

These are injected directly into the AI prompt so that the LLM knows exactly what price range to suggest.

#### `generateTripFromParams(params)` — The Core Function

**Step 1 — Validation:**
- Checks that required fields exist (source, destination, travelMode, days, people).
- Validates days is between 1-30 and people between 1-20.

**Step 2 — Resolve Budget Tier:**
- Maps the user's budget selection to one of the 4 tiers. Defaults to "medium" if invalid.

**Step 3 — Calculate Activities per Day:**
- Relaxed pace → exactly 3 activities/day
- Moderate pace → exactly 4 activities/day
- Packed pace → exactly 6 activities/day

**Step 4 — Build Date Array:**
- If user provided a `startDate`, generates real dates (e.g., "2024-03-15", "2024-03-16", ...).
- Otherwise, uses generic labels ("Day 1", "Day 2", ...).

**Step 5 — Build the "extras" string:**
Concatenates all optional user preferences into a single string that gets injected into the prompt. For example:
- If user selected interests ["Adventure", "Food"]: adds `"User interests: Adventure, Food — prioritise these types of places"`
- If `hasChildren` is true: adds `"Travelling with children — include family-friendly & kid-safe activities"`
- If `distanceRange` is "5": adds `"DISTANCE CONSTRAINT: ONLY suggest places within 5 km of Jaipur city centre"`
- If `mustAvoid` has text: adds `"MUST AVOID: seafood, old city at night — DO NOT INCLUDE THESE AT ALL COSTS"`

**Step 6 — Construct the AI Prompt:**
The prompt is a carefully engineered string that:
1. Tells the AI to output ONLY valid JSON, no markdown, no extra text.
2. Provides all trip details in a compressed format: `Mumbai→Jaipur|train|5days|4pax|Mid-range`
3. Specifies exact budget constraints with the tier's price ranges.
4. Lists strict RULES the AI must follow (e.g., "EXACTLY 4 activities per day", "ONLY suggest REAL places", "NO repeated places across all days").
5. Provides a JSON template with empty placeholders that the AI must fill. This template includes:
   - `summary`: title, destination, best time to visit, overview
   - `travel`: mode, from, to, estimated time, fare
   - `hotels`: 3 real hotel suggestions with names, areas, prices, ratings
   - `days`: An array of day objects, each with a schedule array, food suggestions, and day budget
   - `budget`: Overall breakdown
   - `tips`, `packing`, `emergency` contacts

**Step 7 — Call the LLM:**
Based on `LLM_PROVIDER` in the `.env` file:
- **Gemini**: Uses `GoogleGenerativeAI` SDK, calls `model.generateContent(prompt)`.
- **Grok**: Uses OpenAI SDK with base URL `https://api.x.ai/v1`, calls `chat.completions.create()`.
- **Anthropic**: Uses Anthropic SDK, calls `messages.create()` with max 8192 tokens.

**Step 8 — Parse the Response:**
1. Strips any accidental markdown code blocks (` ```json ... ``` `).
2. Finds the first `{` and last `}` to extract the JSON object.
3. Attempts `JSON.parse()`. If parsing fails, returns an error message.
4. Normalizes the compact AI response into a rich, structured `itinerary` object with human-readable keys (e.g., `s.t` → `time`, `s.a` → `activity`, `s.l` → `location`).

**Step 9 — Error Handling:**
Catches specific error types and returns user-friendly messages:
- 401 → "Invalid API key"
- 429 → "Rate limit hit, please wait"
- 503/529 → "AI provider is temporarily overloaded"

#### Other Functions in tripController.js

- **`generateTrip(req, res)`**: A thin REST API wrapper around `generateTripFromParams()`. Receives HTTP request, calls the core function, returns the result.
- **`saveTrip(req, res)`**: Takes `tripDetails` + `itinerary` from the request body, creates a Trip document in MongoDB.
- **`getTrips(req, res)`**: Finds all trips for the current user, sorted newest first, excluding the `rawResponse` field (to reduce response size).
- **`getTripById(req, res)`**: Finds a single trip by ID, but only if it belongs to the current user (security).
- **`deleteTrip(req, res)`**: Deletes a trip, but only if it belongs to the current user.
- **`toggleFavorite(req, res)`**: Flips the `isFavorite` boolean on a trip.

---

### 4.9 `socketHandler.js` — Real-Time Communication (720 lines)

This is the largest backend file and powers all real-time features. It uses Socket.IO, which is built on top of WebSockets.

**What are WebSockets?** Unlike HTTP (where the browser must ask the server for information), WebSockets create a persistent, two-way connection. Both the browser and server can send messages to each other at any time, instantly. This is perfect for chat and live voting.

#### Authentication
Before any socket connection is accepted, the middleware verifies the JWT token:
```
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  // verify token, find user, attach to socket.user
})
```

#### Online User Tracking
A `Map<roomId, Set<userId>>` tracks exactly who is online in which room. Functions `addOnlineUser()`, `removeOnlineUser()`, and `getOnlineUsers()` manage this data structure.

#### Socket Events (What the Server Listens For):

**`join_room`** — When a user opens a room:
1. Validates room exists and user is a member.
2. Adds user to the Socket.IO room and to the online tracking map.
3. Broadcasts updated member list (with `isOnline` status for each member) to everyone in the room.
4. Creates a system chat message ("Alice joined the room").
5. Checks if there's an active voting session — if so, sends the session details and current vote tally to the newly joined user.

**`leave_room`** — When a user leaves:
1. Removes from Socket.IO room and online tracking.
2. Broadcasts updated member list.
3. Creates a system chat message ("Alice left the room").

**`chat_message`** — When a user sends a message:
1. Validates content is not empty.
2. Saves to MongoDB (`ChatMessage.create()`).
3. Broadcasts to everyone in the room with sender info (name, avatar, timestamp).

**`generate_trip_group`** — Host starts a voting session:
1. Checks no session is already active.
2. Validates logistics data (source, destination, travel mode, days).
3. Creates a `GroupTripSession` document in MongoDB.
4. Broadcasts `trip_form_opened` to everyone — this causes a voting form to appear on all screens.

**`submit_preference`** — Member submits their vote:
1. Validates the session is still in `collecting` status.
2. Upserts the `TripPreferenceResponse` (creates new or updates existing).
3. Calls `buildVoteTally()` to recalculate all tallies.
4. Broadcasts `vote_tally_update` to everyone — this updates the live progress bars.

**`finalize_session`** — Host clicks "Generate Trip":
1. Validates session is active.
2. Checks if the requester is the host. If not, checks if the host is offline — non-hosts can only finalize if the host is disconnected.
3. Calls `finalizeSession()` (the big aggregation + AI function).

**`cancel_session`** — Host dismisses the vote:
1. Same permission check as finalize.
2. Sets session status to `cancelled`.
3. Broadcasts `session_cancelled`.

**`disconnect`** — User's browser disconnects:
1. Removes from online tracking.
2. Broadcasts updated member list.

#### `buildVoteTally(sessionId)` — Vote Counting
Fetches all `TripPreferenceResponse` documents for a session and builds a comprehensive tally object:
- Counts of each option for single-select fields (e.g., budget: { minimum: 1, medium: 3, luxury: 2 })
- Counts of each option for multi-select fields
- Counts for boolean fields
- Lists of free-text responses
- Lists of attendees vs. not-coming members

#### `aggregateVotes(session, responses, organizerId)` — Democratic Resolution
This function implements three different voting algorithms:

1. **Majority Vote** (for single-select fields like budget, pace):
   - Counts votes for each option.
   - If there's a clear winner, that option wins.
   - If there's a TIE: checks what the organizer (host) voted for. If the host voted for one of the tied options, that one wins (tie-breaker).
   - If the host didn't vote for any tied option: picks the first alphabetically.
   - Records every tie-break in a `tieBreakLog` array.

2. **Approval Vote** (for multi-select fields like interests, vibe):
   - Any option selected by MORE THAN 50% of respondents is included.

3. **Any-Yes-Wins** (for boolean fields like hasChildren):
   - If even ONE person selects true, the final result is true. This ensures no group member's critical need is ignored.

#### `finalizeSession(io, sessionId, roomId)` — The Grand Finale
1. Checks for responses. If zero responses, cancels the session.
2. Checks at least one person marked "attending".
3. Broadcasts `session_finalizing` (shows "AI is generating..." on all screens).
4. Calls `aggregateVotes()` to get the final parameters.
5. Calls `generateTripFromParams()` with the aggregated parameters.
6. If AI fails, broadcasts an error but does NOT cancel — allows retry.
7. If AI succeeds:
   - Creates a `Trip` document for the host.
   - Loops through ALL other room members and creates a SEPARATE `Trip` document for each. This means the trip appears in everyone's personal dashboard.
   - Updates the session with `status: 'finalized'`, the aggregated preferences, tie-break log, and resulting trip ID.
   - Broadcasts `session_finalized` with the complete itinerary, rendering it on all screens simultaneously.

---

## 5. The Frontend — Explained File by File

### 5.1 `index.js` — The Starting Point
This is the very first JavaScript file that runs in the browser. It:
1. Imports React and ReactDOM.
2. Imports global styles from `index.css`.
3. Imports the `App` component.
4. Finds the `<div id="root">` element in the HTML page.
5. Renders the `<App />` component into that div using React 18's `createRoot` API.

### 5.2 `App.js` — Routing & Page Structure

**Provider Nesting:**
The app wraps everything in three nested "Context Providers" (explained in 5.3):
```
<AuthProvider>          ← Manages login state
  <SocketProvider>      ← Manages WebSocket connection
    <RoomProvider>      ← Manages room/chat/voting state
      <BrowserRouter>   ← React Router
        <AppRoutes />
        <Toaster />     ← Notification pop-ups
      </BrowserRouter>
    </RoomProvider>
  </SocketProvider>
</AuthProvider>
```

**Route Definitions:**
| URL Path | Component | Access |
|---|---|---|
| `/` | LandingPage | Public |
| `/login` | LoginPage | Public only (redirects to dashboard if logged in) |
| `/signup` | SignupPage | Public only |
| `/dashboard` | DashboardPage | Protected (redirects to login if not logged in) |
| `/plan` | PlannerPage | Protected |
| `/itinerary` | ItineraryPage | Protected |
| `/trip/:id` | TripDetailPage | Protected |
| `/rooms` | RoomsPage | Protected |
| `/room/:id` | RoomPage | Protected |
| `*` (anything else) | Redirects to `/` | Public |

**ProtectedRoute component:** A wrapper that checks `useAuth().isAuthenticated`. If true, renders the child. If false, redirects to `/login`.

**PublicRoute component:** The opposite — if the user IS logged in, redirects to `/dashboard` (so logged-in users can't see the login page).

### 5.3 `context/` — Global State Management

React's Context API allows data to be shared across many components without passing it through props at every level. Think of it as "global variables" for your React app.

#### 5.3.1 `AuthContext.js`
**State:**
- `user`: The current user object (null if not logged in)
- `token`: The JWT token string (initialized from `localStorage`)
- `loading`: Boolean, true while the initial auth check is in progress

**On mount:**
- If a token exists in `localStorage`, calls `GET /api/auth/me` to validate it and fetch the user profile.
- If the token is invalid/expired, clears it from localStorage.

**Exposed functions:**
- `login(userData, authToken)`: Saves token to localStorage, updates state.
- `logout()`: Removes token from localStorage, clears user state.

**Token persistence:** The token is stored in `localStorage` under the key `wanderai_token`. This means the user stays logged in even after closing the browser, until the token expires (7 days) or they explicitly log out.

#### 5.3.2 `SocketContext.js`
**Purpose:** Creates and manages a single Socket.IO connection to the backend.

**Behavior:**
- Only connects when the user is authenticated (has a valid token).
- Passes the JWT token via `socket.handshake.auth.token` for server-side authentication.
- Uses WebSocket transport with polling fallback.
- Tracks connection state (`isConnected`).
- Automatically disconnects when the user logs out or the component unmounts.
- The backend URL is derived from `REACT_APP_API_URL` (stripping `/api`) or defaults to `http://localhost:5000`.

#### 5.3.3 `RoomContext.js` (220 lines)
**State:**
- `currentRoom`: The room the user is currently inside
- `members`: Array of room members with online status
- `messages`: Array of chat messages
- `activeSession`: The current voting session (if any)
- `voteTally`: The live vote counts
- `loading`, `error`: UI states

**Exposed functions:**
- `createRoom(name)`: POST to `/api/rooms`, creates a room.
- `joinRoomByCode(code)`: POST to `/api/rooms/join`.
- `loadRoomDetails(roomId)`: GET `/api/rooms/:id`, then emits `join_room` via socket.
- `leaveRoom()`: Emits `leave_room`, resets all state.
- `sendMessage(content)`: Emits `chat_message` via socket.
- `startGroupTrip(logisticsData)`: Emits `generate_trip_group`.
- `submitPreference(sessionId, preferences)`: Emits `submit_preference`.
- `finalizeSession(sessionId)`: Emits `finalize_session`.
- `cancelSession(sessionId)`: Emits `cancel_session`.

**Event listeners (inside useEffect):**
Listens for all server-side events and updates React state accordingly:
- `member_list_update` → updates `members`
- `chat_message` → appends to `messages`
- `error_message` → shows toast notification
- `trip_form_opened` → sets `activeSession`
- `vote_tally_update` → sets `voteTally`
- `session_finalizing` → updates session status to show loading
- `session_finalized` → updates session with full itinerary data
- `session_cancelled` → clears active session
- `session_error` → shows error toast, reverts to collecting status

### 5.4 `utils/api.js` — HTTP Request Helper
Creates a pre-configured Axios instance:
- **Base URL**: `http://localhost:5000/api` (or from environment variable)
- **Timeout**: 120 seconds (AI responses can be slow for long trips)
- **Request interceptor**: Before every request, reads the JWT token from localStorage and adds it as `Authorization: Bearer <token>`.
- **Response interceptor**: If ANY response returns 401 (unauthorized), automatically clears the token and redirects to the login page. This handles expired tokens gracefully.

### 5.5 `components/` — Reusable UI Building Blocks

#### `GroupFormPanel.js` (438 lines)
This is the voting form that appears inside a room when a group trip session is active. It renders:
- **Attendance section**: Two buttons ("I am coming" / "Not coming") with live tally bars.
- **Single-choice selects**: Budget, Pace, Traveller type, Distance, Room sharing, Budget flexibility — each with a dropdown and a live progress bar showing how others voted.
- **Multi-choice chips**: Interests, Meal preferences, Trip vibe — toggleable chip buttons with vote tallies.
- **Boolean checkboxes**: Has children, Has elderly, Accessibility needs — with counts of how many said yes.
- **Free text areas**: Must-avoid list, Special requirements.
- **Action buttons**: "Submit My Response" (or "Update My Response" if already submitted), "Dismiss Vote" (cancel), "Generate Trip" (finalize).
- **Permission logic**: Only the host (or anyone if host is offline) can see finalize/cancel buttons.

#### `ItineraryCard.js` (79 lines)
A compact card component that summarizes a generated trip. Shows title, destination, days, budget, traveller count, key highlights, and tie-break warnings. Has a "View Full Itinerary" button.

#### `ui/Navbar.js` — Top Navigation Bar
The site-wide navigation bar with links to Dashboard, Plan a Trip, and Rooms.

#### `ui/LoadingSpinner.js` — Animated Loading Indicator
A reusable spinner component shown during data loading.

### 5.6 `pages/` — The Actual Screens

| Page | Size | Purpose |
|---|---|---|
| **LandingPage.js** | 21 KB | The marketing hero page with feature showcases and call-to-action buttons |
| **LoginPage.js** | 5.5 KB | Login form with email/password fields |
| **SignupPage.js** | 8.5 KB | Registration form with password strength indicator |
| **DashboardPage.js** | 13 KB | Grid of all saved trips (solo + group), with favorite/delete actions |
| **PlannerPage.js** | 33 KB | The main solo trip planning form — source, destination, dates, budget, preferences, pace, vibe, etc. |
| **ItineraryPage.js** | 51 KB | The largest page. Renders the complete AI-generated itinerary with day tabs, timeline views, hotel cards, food suggestions, budget progress bars, packing lists, emergency contacts, and a "Save Trip" button |
| **TripDetailPage.js** | 1.5 KB | Fetches a saved trip by ID and renders it using the same itinerary layout |
| **RoomsPage.js** | 11 KB | List of rooms, create room form, join room by code form |
| **RoomPage.js** | 16 KB | Inside a room: live chat on the left, member list on top, group voting form on the right, generated itinerary display |

### 5.7 Styling — Tailwind CSS, index.css, tailwind.config.js

#### `tailwind.config.js`
Custom Tailwind configuration:
- **Fonts**: `Playfair Display` (serif, for headings), `DM Sans` (sans-serif, for body text), `JetBrains Mono` (monospace).
- **Colors**: Custom `primary` palette (sky blues), `sand` palette (warm beiges), `forest` palette (greens).
- **Animations**: `fade-in`, `slide-up`, `slide-in-right`, `shimmer` (for skeleton loaders), `float` (gentle up-down).
- **Shadows**: `card`, `card-hover`, `glass` (for glassmorphism effect).

#### `index.css`
Defines reusable component classes using Tailwind's `@layer` directive:
- `.skeleton` — Shimmer loading placeholder
- `.glass-card` — Frosted glass effect with backdrop blur
- `.trip-card` — Card with hover shadow transition
- `.btn-primary`, `.btn-secondary`, `.btn-danger` — Button variants
- `.form-input`, `.form-label` — Form element styles
- `.timeline-dot` — Dot for timeline views
- `.day-card` — Card for daily itinerary
- `.text-gradient` — Gradient text effect
- `.bg-mesh` — Radial gradient mesh background
- Custom scrollbar styling

---

## 6. Complete Data Flow — Step by Step

### Flow 1: User Signs Up
```
Browser                          Backend                         Database
  │                                │                               │
  ├─ POST /api/auth/signup ──────► │                               │
  │  { name, email, password }     │                               │
  │                                ├─ validate fields              │
  │                                ├─ check email uniqueness ────► │ (findOne)
  │                                │◄──── no duplicate ──────────  │
  │                                ├─ User.create() ─────────────► │
  │                                │  (password auto-hashed)       │ (saves doc)
  │                                │◄──── user document ─────────  │
  │                                ├─ jwt.sign({ id: user._id })   │
  │                                │                               │
  │◄── { token, user } ──────────  │                               │
  │                                │                               │
  ├─ localStorage.setItem(token)   │                               │
  ├─ AuthContext.login()           │                               │
  ├─ Navigate to /dashboard        │                               │
```

### Flow 2: User Plans a Solo Trip
```
Browser (PlannerPage)             Backend                         Gemini AI
  │                                │                               │
  ├─ Fill form (destination,       │                               │
  │  days, budget, preferences)    │                               │
  │                                │                               │
  ├─ POST /api/trip/generate ────► │                               │
  │  { source, destination, ... }  │                               │
  │                                ├─ validate fields              │
  │                                ├─ resolve budget tier          │
  │                                ├─ build prompt string          │
  │                                ├─ call Gemini API ───────────► │
  │                                │                               ├─ process prompt
  │                                │                               ├─ generate JSON
  │                                │◄──── JSON response ─────────  │
  │                                ├─ clean & parse JSON           │
  │                                ├─ normalize to itinerary       │
  │                                │                               │
  │◄── { itinerary, tripDetails }  │                               │
  │                                │                               │
  ├─ Navigate to /itinerary        │                               │
  ├─ Render day-by-day view        │                               │
  │                                │                               │
  ├─ Click "Save Trip"             │                               │
  ├─ POST /api/trip/save ─────── ► │                               │
  │                                ├─ Trip.create() ────────────► MongoDB
  │◄── { trip } ──────────────────  │
```

### Flow 3: Group Trip (Real-Time)
```
User A (Host)                    Server (Socket.IO)              User B (Member)
  │                                │                               │
  ├─ emit('join_room') ──────────► │                               │
  │                                ├─ emit('join_room') ◄─────────  │
  │                                │                               │
  │◄── 'member_list_update' ─────  │                               │
  │                                ├──── 'member_list_update' ───►  │
  │                                │                               │
  ├─ emit('generate_trip_group') ► │                               │
  │  { logistics data }           │                               │
  │                                ├─ create GroupTripSession      │
  │                                │                               │
  │◄── 'trip_form_opened' ───────  │                               │
  │                                ├──── 'trip_form_opened' ────►  │
  │     (voting form appears)      │           (voting form appears)│
  │                                │                               │
  ├─ emit('submit_preference') ──► │                               │
  │                                ├─ save/update vote             │
  │                                ├─ buildVoteTally()             │
  │◄── 'vote_tally_update' ──────  │                               │
  │                                ├──── 'vote_tally_update' ───►  │
  │     (progress bars update)     │         (progress bars update) │
  │                                │                               │
  │                                │  (User B also submits)        │
  │                                ├──── 'vote_tally_update' ───►  │
  │◄── 'vote_tally_update' ──────  │                               │
  │                                │                               │
  ├─ emit('finalize_session') ───► │                               │
  │                                ├─ aggregateVotes()             │
  │                                ├─ call Gemini AI               │
  │                                ├─ save Trip for User A         │
  │                                ├─ save Trip for User B         │
  │                                │                               │
  │◄── 'session_finalized' ──────  │                               │
  │  { itinerary, tieBreakLog }    ├──── 'session_finalized' ───►  │
  │                                │                               │
  │  (itinerary appears on screen) │    (itinerary appears on screen)
```

---

## 7. The Group Trip Voting System — Full Breakdown

The voting system uses different algorithms for different types of preferences:

### 7.1 Majority Vote (Single-Select Fields)
Used for: Budget tier, Pace, Traveller type, Distance range, Room sharing, Budget flexibility.

**Example:** 5 friends vote on budget:
- Alice: luxury
- Bob: medium
- Charlie: medium
- Diana: luxury
- Eve: medium

Result: **medium** wins (3 votes vs 2).

**Tie scenario:** 4 friends vote on pace:
- Alice (host): relaxed
- Bob: packed
- Charlie: relaxed
- Diana: packed

Scores: relaxed=2, packed=2. **TIE!**
→ System checks Alice's vote (she's the host). Alice voted "relaxed".
→ **relaxed** wins. Logged as: `{ field: "pace", tiedOptions: ["relaxed", "packed"], winner: "relaxed", reason: "Tie broken by organizer preference" }`.

### 7.2 Approval Vote (Multi-Select Fields)
Used for: Interests, Meal preferences, Trip vibe.

**Example:** 4 friends vote on interests:
- Alice: [Adventure, Food, History]
- Bob: [Adventure, Culture, Food]
- Charlie: [Food, Nature]
- Diana: [Adventure, Food, Shopping]

Counts: Adventure=3, Food=4, History=1, Culture=1, Nature=1, Shopping=1.
Threshold: 50% of 4 = 2. Any option with count > 2 wins.
Result: **Adventure** (3) and **Food** (4) are included. Others are dropped.

### 7.3 Any-Yes-Wins (Boolean Fields)
Used for: Has children, Has elderly, Accessibility needs.

**Example:** 5 friends vote on "travelling with children":
- Alice: false, Bob: false, Charlie: true, Diana: false, Eve: false

Result: **true** — because Charlie has children, the trip MUST accommodate them.

### 7.4 Concatenate (Free Text)
Used for: Special requirements, Must-avoid list.

All unique text entries are joined with a period. Example:
- Alice: "no seafood"
- Bob: "need wheelchair access"
- Charlie: "no seafood" (duplicate — removed)

Result: `"no seafood. need wheelchair access"`

---

## 8. How the AI Generates Itineraries — The Prompt Engineering

The prompt sent to the AI is carefully structured to prevent hallucinations and ensure consistent output. Here is the strategy:

### 8.1 Constraint-Based Prompting
The prompt begins with: `"World travel planner. Output ONLY valid JSON. No markdown. No extra text."`
This forces the AI into a strict output format.

### 8.2 Template-Based Prompting
Instead of asking the AI to "create a JSON structure", the prompt provides a complete JSON template with empty values:
```json
{"t":"","a":"","l":"","d":"","c":0}
```
The AI simply fills in the blanks. This dramatically reduces the chance of malformed output.

### 8.3 Anti-Hallucination Rules
```
- ONLY suggest REAL, FAMOUS, WELL-KNOWN places that actually exist nearby [destination]
- NEVER invent or hallucinate any place, hotel, or restaurant name
- Hotels: only real verifiable hotels inside [destination]
```

### 8.4 Adaptive Complexity
- **≤6 days**: DETAILED MODE — each activity gets a description
- **7-10 days**: COMPACT MODE — names only, no descriptions
- **>10 days**: ULTRA COMPACT MODE — minimal data to stay within token limits

### 8.5 Geographic Clustering
```
- Geographic logic: cluster nearby places each day to minimise travel time
```
This ensures the AI groups geographically close places on the same day.

---

## 9. Security Mechanisms

1. **Passwords**: Hashed with bcrypt (12 salt rounds) before storage. Never stored or transmitted in plain text.
2. **Authentication**: JWT tokens with 7-day expiry. Verified on every protected route and socket connection.
3. **Password field hidden**: `select: false` in the User schema prevents accidental exposure.
4. **Input validation**: `express-validator` validates all inputs (email format, password length, name length).
5. **Room access control**: Every room operation verifies the user is a member before proceeding.
6. **Trip ownership**: Users can only view/edit/delete their own trips.
7. **CORS**: Only the frontend origin is allowed to make requests.
8. **Rate limit awareness**: The backend gracefully handles 429 (rate limit) responses from the AI provider.
9. **Auto-logout**: The frontend interceptor automatically logs out users with expired/invalid tokens.

---

## 10. NPM Dependencies Explained

### Backend (`backend/package.json`)
| Package | Version | Purpose |
|---|---|---|
| `@anthropic-ai/sdk` | ^0.39.0 | Anthropic Claude API client |
| `@google/generative-ai` | ^0.24.1 | Google Gemini API client |
| `axios` | ^1.15.2 | HTTP client (used internally if needed) |
| `bcryptjs` | ^2.4.3 | Password hashing |
| `cors` | ^2.8.5 | Cross-Origin Resource Sharing middleware |
| `dotenv` | ^16.4.5 | Loads `.env` file into `process.env` |
| `express` | ^4.18.2 | Web framework |
| `express-validator` | ^7.0.1 | Request body validation middleware |
| `jsonwebtoken` | ^9.0.2 | JWT creation and verification |
| `mongoose` | ^8.2.1 | MongoDB ODM |
| `openai` | ^7.8.0 | OpenAI-compatible SDK (used for Grok) |
| `socket.io` | ^4.8.3 | Real-time WebSocket server |
| `nodemon` | ^3.1.0 | (Dev) Auto-restarts server on file changes |

### Frontend (`frontend/package.json`)
| Package | Version | Purpose |
|---|---|---|
| `@headlessui/react` | ^1.7.18 | Accessible UI primitives (modals, dropdowns) |
| `axios` | ^1.6.7 | HTTP requests to the backend |
| `date-fns` | ^3.3.1 | Date formatting utilities |
| `framer-motion` | ^11.0.14 | Animations and transitions |
| `lucide-react` | ^0.344.0 | Icon library |
| `react` | ^18.2.0 | Core React library |
| `react-dom` | ^18.2.0 | React DOM renderer |
| `react-hot-toast` | ^2.4.1 | Toast notifications |
| `react-router-dom` | ^6.22.3 | Client-side routing |
| `react-scripts` | 5.0.1 | Create React App build tooling |
| `socket.io-client` | ^4.8.3 | Socket.IO client for real-time communication |

---

## 11. How to Run the Project

### Prerequisites
- **Node.js v18+** installed on your computer
- **MongoDB** running locally (or a MongoDB Atlas cloud connection string)
- **A Google Gemini API Key** from [aistudio.google.com](https://aistudio.google.com)

### Step 1: Start the Backend
```bash
cd backend
npm install          # Installs all backend dependencies
```
Create/edit the `.env` file with your actual values (especially `GEMINI_API_KEY`).
```bash
npm run dev          # Starts the server with auto-reload (uses nodemon)
```
You should see: `MongoDB connected successfully` and `Server running on http://localhost:5000`.

### Step 2: Start the Frontend
Open a NEW terminal window:
```bash
cd frontend
npm install          # Installs all frontend dependencies
npm start            # Starts the React development server
```
The app opens automatically at `http://localhost:3000`.

### Step 3: Use the App
1. Go to `http://localhost:3000` → See the landing page.
2. Click "Sign Up" → Create an account.
3. Go to "Plan a Trip" → Fill in the form → Click "Generate".
4. Wait for the AI → View your itinerary → Save it.
5. Go to "Rooms" → Create a room → Share the 6-digit code with friends.
6. Friends join using the code → Host starts a Group Trip → Everyone votes → Host finalizes → AI generates a group trip.

---

*This document was generated as a comprehensive guide to the RoamNexus codebase. Every file, function, and concept has been explained in detail.*
