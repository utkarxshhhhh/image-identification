# AR Food Menu Platform

A full-stack SaaS web application that lets restaurants display food menu items in **Augmented Reality** — no app download required.

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, Tailwind CSS, Three.js, WebXR API |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose) |
| Storage | Cloudinary (3D models + images) |
| Auth | JWT (email + password) |
| QR Codes | `qrcode` npm package |

---

## 📁 Project Structure

```
├── backend/                 # Express REST API
│   ├── src/
│   │   ├── config/          # DB + Cloudinary config
│   │   ├── middleware/      # JWT auth middleware
│   │   ├── models/          # Mongoose models (User, FoodItem)
│   │   ├── routes/          # auth.js, foodItems.js
│   │   └── server.js        # App entry point
│   ├── .env.example
│   └── package.json
│
├── frontend/                # Next.js app
│   ├── src/
│   │   ├── components/      # FoodItemCard, AddItemModal
│   │   ├── lib/             # Axios instance
│   │   ├── pages/
│   │   │   ├── login.js     # Auth page
│   │   │   ├── dashboard.js # Admin dashboard
│   │   │   └── view/
│   │   │       └── [itemId].js  # AR / 3D viewer
│   │   └── styles/
│   ├── .env.example
│   └── package.json
│
├── main.py                  # Original image classifier (MobileNetV2)
└── requirements.txt
```

---

## ⚙️ Setup

### 1. Clone & install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment variables

Copy the example files and fill in your values:

```bash
cp backend/.env.example   backend/.env
cp frontend/.env.example  frontend/.env.local
```

**Backend `.env`:**
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/ar-food-menu
JWT_SECRET=super_secret_key
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
FRONTEND_URL=http://localhost:3000
```

**Frontend `.env.local`:**
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Start the services

```bash
# Terminal 1 – backend
cd backend
npm run dev

# Terminal 2 – frontend
cd frontend
npm run dev
```

Open http://localhost:3000 in your browser.

---

## 🚀 Features

### Admin Dashboard (Restaurant Side)
- Email / password authentication (JWT)
- Add, edit, delete food items
- Upload 3D models (.glb) and preview images via Cloudinary
- Auto-generated QR code for each menu item
- View-count analytics per item

### Customer AR View (`/view/[itemId]`)
- Opens directly from a QR code scan — **no app install needed**
- Loads the 3D model from Cloudinary (lazy-loaded)
- **WebXR AR**: place the dish on a real table surface using hit-testing
- **Fallback 3D viewer**: orbit controls when AR is not supported
- Tap the info button to reveal an ingredient/calorie/price overlay

---

## 🔑 API Reference

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create restaurant account |
| POST | `/api/auth/login` | Sign in, returns JWT |

### Food Items (protected — Bearer token required)
| Method | Route | Description |
|---|---|---|
| GET | `/api/items` | List all items for current user |
| POST | `/api/items` | Create item (multipart/form-data) |
| PUT | `/api/items/:id` | Update item |
| DELETE | `/api/items/:id` | Delete item |
| GET | `/api/items/:id/qr` | (Re)generate QR code |

### Public (no auth)
| Method | Route | Description |
|---|---|---|
| GET | `/api/items/public/:id` | Get item details + increment view count |

---

## �� Running existing Python tests

```bash
pip install -r requirements.txt pytest
pytest -q
```

---

## 📝 Notes

- 3D models must be in `.glb` format (optimised / low-poly recommended).
- WebXR AR requires an HTTPS connection and a compatible mobile browser (Chrome on Android, Safari 15.4+ on iOS with WebXR flag enabled).
- The fallback 3D viewer works in all modern browsers.
