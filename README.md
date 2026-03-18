# SMS Connect Pay - Project Documentation

## 1. Overview
SMS Connect Pay is a modern web application designed for bulk SMS management with an integrated M-Pesa payment system. Originally built on Supabase, the project has been migrated to a custom **Python FastAPI** backend to provide more control, security, and scalability.

## 2. Architecture
The project follows a decoupled architecture:
- **Frontend**: React (Vite) + Tailwind CSS + Shadcn UI.
- **Backend**: Python FastAPI (REST API).
- **Database**: SQLite (SQLAlchemy ORM) - easily switchable to PostgreSQL.
- **Authentication**: JWT (JSON Web Tokens) with Bcrypt password hashing.

---

## 3. Core Features

### 🔐 Authentication
- **Secure Registration**: Users can create accounts with phone validation.
- **JWT Login**: Secure token-based access.
- **Protected Routes**: Dashboard and messaging features are only accessible to authenticated users.

### 💬 SMS Management
- **Segment-Based Costing**: Costs are calculated based on 160-character segments.
- **Bulk Sending**: Upload Excel/CSV files or enter numbers manually to send to hundreds of recipients at once.
- **Message History**: Full logs of all sent messages, including recipient, content, cost (TK), and status.

### 💰 Token & Payment System
- **SMS Tokens (TK)**: Internal currency used to send messages.
- **M-Pesa Integration**: Users can top up their balance via M-Pesa prompts.
- **Welcome Credit**: New users are automatically gifted **10 free tokens**.

### 🛠 Admin Dashboard
- **Global Overview**: Monitors total users, messages, and payments.
- **User Management**: View and manage all user profiles and balances.
- **Audit Logs**: See every transaction and message sent across the platform.

---

## 4. File Structure

### `/backend`
- `main.py`: The heart of the API. Contains all routes and logic.
- `models.py`: Defines the database tables (Users, Profiles, Messages, Payments).
- `schemas.py`: Pydantic models for data validation and API responses.
- `auth.py`: Handles password encryption and JWT token generation.
- `database.py`: Manages the connection to the SQLite database.
- `.env`: Contains sensitive keys like the `SECRET_KEY`.

### `/src` (React Frontend)
- `contexts/AuthContext.tsx`: Manages the global login state and profile syncing.
- `pages/`: Individual screens like Dashboard, Compose, and Admin.
- `components/`: Reusable UI elements like the Top-Up Modal.

---

## 5. Setup & Running

### Backend Requirements:
1. Python 3.8+
2. Install dependencies: `pip install -r backend/requirements.txt`
3. Start server: `cd backend && uvicorn main:app --reload`

### Frontend Requirements:
1. Node.js
2. Install dependencies: `npm install`
3. Start dev server: `npm run dev` (Runs on [http://localhost:8080](http://localhost:8080))

---

## 6. Utility Scripts
I have included several scripts in the `/backend` folder for easy management:
- `register_user.py`: Register a user directly into the database.
- `make_admin.py [email]`: Promote any user to an Admin role.
- `verify_api.py`: Automatically tests every feature to ensure the system is healthy.

---

## 8. Real-World API Integration
In a production environment, the placeholders in `backend/services/` should be replaced with actual provider SDKs.

### SMS Integration (`services/sms_provider.py`)
- **Recommended**: Africa's Talking, Twilio, or Vonage.
- **Workflow**: The `send_sms` method is called asynchronously in the background when a user clicks "Send".

### Payment Integration (`services/payment_provider.py`)
- **Recommended**: Safaricom Daraja API (STK Push).
- **Workflow**: The `trigger_stk_push` method initiates the M-Pesa prompt on the user's phone. You will need to implement a **Callback URL** to handle successful payment notifications from Safaricom.

### Environment Variables
For production, update your `.env` with:
- `SMS_API_KEY`
- `MPESA_CONSUMER_KEY`
- `MPESA_CONSUMER_SECRET`
