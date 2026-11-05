# 🍌 BananaQuest - Fullstack Math Puzzle Game

A modern, animated full-stack math puzzle game built on the **Marc Conrad Banana API** (`https://marcconrad.com/uob/banana/api.php`), featuring an anti-cheat server proxy, dynamic MySQL persistence, 3-step progressive hints, live leaderboards, customizable player profiles, and vibration/shake animations.

---

## 🌟 Key Highlights

- **🔒 Zero Data Leak Anti-Cheat**: The raw Banana API includes both the puzzle image and the plain-text answer. To prevent client inspection and cheating, our Node.js backend proxies all requests, securely seals the answer in session storage, and only delivers the puzzle image and an encrypted round token to the frontend. Verification occurs 100% server-side.
- **✨ Dynamic Animations & Vibration**:
  - **Mistake**: Triggers a rapid CSS vibration shake (`@keyframes gameShake`), hardware haptic pulse, and a `-20` penalty indicator.
  - **Success**: Triggers full-screen confetti bursts, floating gold points badges (`+150 pts`), a green glow pulse, and celebratory audio.
- **💡 3-Step Progressive Hint Assistant**:
  - **Step 1**: Parity & Range (Even/Odd, between 0–4 or 5–9) *(-15 pts)*
  - **Step 2**: Math Bounds & Multiples (divisibility, prime/square traits) *(-25 pts)*
  - **Step 3 (50/50)**: Narrows the solution down to exactly 2 digits *(-40 pts)*
- **🏆 Dynamic MySQL Leaderboard**: Live database rankings for **Top Scorers**, **Longest Streaks**, and **Recent Wins** (Zero hardcoding).
- **👤 Player Profile & Avatars**: Career statistics (accuracy %, streaks, games played) with 8 customizable avatars (*Banana Hero*, *Monkey King*, *Detective Ape*, *Golden Banana*, etc.).
- **🔐 JWT Authentication**: Passwords hashed with `bcryptjs`. Guests must register/login to play and record high scores.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti, Web Audio API
- **Backend**: Node.js, Express.js, JWT, bcryptjs, Axios
- **Database**: MySQL 8.0 (`mysql2/promise`) with automatic resilient fallback

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MySQL Server (Optional: default settings will auto-connect or use local storage)

### 2. Quick Run (1-Click on Windows)
Simply double-click:
```
start-game.bat
```
*(Or run `Start-Banana-Game.bat` from your Desktop)*

### 3. Manual Start
#### Backend:
```bash
cd backend
npm install
npm start
```
*Backend runs on `http://localhost:5000`*

#### Frontend:
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 📜 API Documentation

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Login and receive JWT token | No |
| `GET` | `/api/auth/me` | Fetch active user credentials | Yes |
| `POST` | `/api/game/start` | Start round & proxy Banana puzzle (Anti-cheat) | Yes |
| `POST` | `/api/game/hint` | Request 3-step hint with point deductions | Yes |
| `POST` | `/api/game/submit` | Validate answer, award points or trigger shake | Yes |
| `GET` | `/api/leaderboard` | Get live rankings (score, streak, recent) | No |
| `GET` | `/api/user/profile` | Get career stats & match history | Yes |
| `PUT` | `/api/user/avatar` | Update player character avatar | Yes |

---

## 📄 License
MIT License
