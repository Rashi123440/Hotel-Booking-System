const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'hotel_database.sqlite');
const db = new Database(DB_PATH);

// Enable Foreign Keys and WAL Mode for high performance and integrity
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_number TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL, /* Single, Double, Deluxe, Executive Suite, Presidential Suite */
      price_per_night REAL NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 2,
      floor INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'Available', /* Available, Occupied, Maintenance */
      amenities TEXT DEFAULT '',
      description TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_rooms_number ON rooms(room_number);
    CREATE INDEX IF NOT EXISTS idx_rooms_type ON rooms(type);
    CREATE INDEX IF NOT EXISTS idx_rooms_status ON rooms(status);

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_reference TEXT NOT NULL UNIQUE,
      room_id INTEGER NOT NULL,
      guest_name TEXT NOT NULL,
      guest_email TEXT NOT NULL,
      guest_phone TEXT NOT NULL,
      check_in TEXT NOT NULL, /* YYYY-MM-DD */
      check_out TEXT NOT NULL, /* YYYY-MM-DD */
      nights INTEGER NOT NULL DEFAULT 1,
      total_price REAL NOT NULL,
      special_requests TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Confirmed', /* Confirmed, Checked-In, Checked-Out, Cancelled */
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_bookings_room ON bookings(room_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in, check_out);
    CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
    CREATE INDEX IF NOT EXISTS idx_bookings_ref ON bookings(booking_reference);
  `);
}

initDb();

module.exports = db;
