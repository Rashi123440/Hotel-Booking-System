# The Grand Horizon — Hotel Room Booking System

A full-stack **Hotel Room Booking System** web application developed with **HTML, CSS, JavaScript (ES6+)**, **Node.js + Express.js**, and **SQLite (`better-sqlite3`)**.

---

## 🎯 Aim & Objectives

### Aim
To design and develop a Hotel Room Booking System web application enabling administrators and guests to add, view, search, book, and cancel hotel room records, backed by persistent SQLite storage and RESTful Express.js APIs.

### Key Objectives Implemented
1. **User-Friendly Frontend**: Responsive single-page application with modern luxury hospitality aesthetics (Midnight Dark & Champagne Gold themes), Room Cards, interactive Table View, and dynamic modal workflows.
2. **Dynamic Date Search & Availability**: Search rooms by check-in / check-out date range and capacity without page reloads using Fetch/AJAX.
3. **Double-Booking & Overlap Prevention**: Robust server-side date validation ensuring a room cannot be reserved for conflicting dates.
4. **Complete RESTful CRUD API**:
   - Add new room records
   - List and filter rooms by type, status, price, and amenities
   - Search available rooms for specific date windows
   - Book rooms with automatic nights & pricing calculations
   - Cancel and delete reservations (instantly releasing room inventory)
5. **Persistent SQLite Database**: Structured relational schema with foreign key constraints, cascading rules, and WAL mode.
6. **Edge Case Handling**: Tested for duplicate room numbers, invalid date ranges, overlapping bookings, and non-existent booking cancellations.

---

## 🛠️ Technology Stack

- **Client / Frontend**: Vanilla HTML5, CSS3 Luxury Design System, Vanilla JavaScript (ES6+ Fetch/DOM)
  - *Typography*: Playfair Display & Outfit (Google Fonts)
  - *Themes*: Dark & Light mode toggle with `localStorage` persistence
- **Server / Backend**: Node.js v24 + Express 4.x
- **Database**: SQLite 3 with `better-sqlite3` (WAL mode enabled, Foreign Key checks active)

---

## 🗄️ Database Schema

### `rooms` Table
| Column | Type | Constraints / Description |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `room_number` | TEXT | NOT NULL, UNIQUE (e.g., "101", "201", "PH-1") |
| `type` | TEXT | NOT NULL (Single, Double, Deluxe, Executive Suite, Presidential Suite) |
| `price_per_night` | REAL | NOT NULL (> 0) |
| `capacity` | INTEGER | NOT NULL DEFAULT 2 |
| `floor` | INTEGER | NOT NULL DEFAULT 1 |
| `status` | TEXT | DEFAULT 'Available' ('Available', 'Occupied', 'Maintenance') |
| `amenities` | TEXT | Comma-separated list (Wi-Fi, Balcony, Jacuzzi, Smart TV...) |
| `description` | TEXT | Detailed room summary |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP |

### `bookings` Table
| Column | Type | Constraints / Description |
|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT |
| `booking_reference` | TEXT | NOT NULL, UNIQUE (e.g., "HTL-74892") |
| `room_id` | INTEGER | FOREIGN KEY REFERENCES `rooms(id)` ON DELETE CASCADE |
| `guest_name` | TEXT | NOT NULL |
| `guest_email` | TEXT | NOT NULL |
| `guest_phone` | TEXT | NOT NULL |
| `check_in` | TEXT | NOT NULL (ISO Date: YYYY-MM-DD) |
| `check_out` | TEXT | NOT NULL (ISO Date: YYYY-MM-DD) |
| `nights` | INTEGER | NOT NULL |
| `total_price` | REAL | NOT NULL (`nights * room.price_per_night`) |
| `special_requests`| TEXT | Optional guest instructions |
| `status` | TEXT | DEFAULT 'Confirmed' ('Confirmed', 'Cancelled') |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP |

---

## 🔒 Overlap & Double-Booking Prevention Logic

To prevent double bookings, any reservation request for date window $[\text{CheckIn}_{\text{new}}, \text{CheckOut}_{\text{new}}]$ executes the following atomic conflict verification before writing to the database:

```sql
SELECT id, booking_reference, check_in, check_out
FROM bookings
WHERE room_id = ?
  AND status = 'Confirmed'
  AND (check_in < ? AND check_out > ?)
LIMIT 1;
```

If any conflicting record exists, the server rejects the request with **HTTP 409 Conflict** and a descriptive error message indicating the reserved dates and reference number.

---

## 📡 RESTful API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System health check and server uptime |
| `GET` | `/api/stats` | Total rooms, available rooms, occupancy rate, and revenue |
| `GET` | `/api/rooms` | List rooms (filters: `type`, `status`, `minPrice`, `maxPrice`, `search`) |
| `GET` | `/api/rooms/search` | Search available rooms by `checkIn`, `checkOut`, `type`, `guests` |
| `GET` | `/api/rooms/:id` | Room details with active upcoming reservations |
| `POST` | `/api/rooms` | Create new room record |
| `PUT` | `/api/rooms/:id` | Update existing room record |
| `DELETE` | `/api/rooms/:id` | Delete room (verifies no active bookings) |
| `GET` | `/api/bookings` | List all bookings (search by guest, ref, room number) |
| `POST` | `/api/bookings` | Book a room (performs date overlap validation) |
| `PUT` | `/api/bookings/:id/cancel` | Cancel an active reservation and free up room dates |
| `DELETE` | `/api/bookings/:id` | Permanently remove a booking record |

---

## ⚡ How to Run

### 1. Start the Server
```bash
npm start
```
*Or during development with auto-reload:*
```bash
npm run dev
```

### 2. Open in Browser
Visit **[http://localhost:3000](http://localhost:3000)**

### 3. Run Automated Integration Test Suite
```bash
node test_suite.js
```
*Executes 13 automated tests covering CRUD operations, date availability searches, and double-booking conflict rejection.*
