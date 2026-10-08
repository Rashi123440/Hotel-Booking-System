const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const { seedDatabase } = require('./db/seed');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Seed database on startup if empty
try {
  seedDatabase();
} catch (err) {
  console.error('Error during initial seed:', err);
}

// ==========================================
// HOTEL BOOKING REST API
// ==========================================

// 1. System Health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'Hotel Room Booking System',
    timestamp: new Date().toISOString()
  });
});

// 2. High-Level Stats & KPIs
app.get('/api/stats', (req, res) => {
  try {
    const totalRooms = db.prepare('SELECT COUNT(*) as count FROM rooms').get().count;
    const availableRooms = db.prepare("SELECT COUNT(*) as count FROM rooms WHERE status = 'Available'").get().count;
    const occupiedRooms = db.prepare("SELECT COUNT(*) as count FROM rooms WHERE status = 'Occupied'").get().count;
    const maintenanceRooms = db.prepare("SELECT COUNT(*) as count FROM rooms WHERE status = 'Maintenance'").get().count;

    const totalBookings = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status != 'Cancelled'").get().count;
    const cancelledBookings = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'Cancelled'").get().count;

    const revenueResult = db.prepare("SELECT SUM(total_price) as sum FROM bookings WHERE status != 'Cancelled'").get();
    const totalRevenue = revenueResult.sum || 0;

    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalRooms,
        availableRooms,
        occupiedRooms,
        maintenanceRooms,
        totalBookings,
        cancelledBookings,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        occupancyRate
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. List All Rooms (with search & filters)
app.get('/api/rooms', (req, res) => {
  try {
    const { type, status, minPrice, maxPrice, search, sort = 'room_number', order = 'ASC' } = req.query;

    const conditions = [];
    const params = {};

    if (type && type !== 'all') {
      conditions.push('type = @type');
      params.type = type;
    }

    if (status && status !== 'all') {
      conditions.push('status = @status');
      params.status = status;
    }

    if (minPrice) {
      conditions.push('price_per_night >= @minPrice');
      params.minPrice = parseFloat(minPrice);
    }

    if (maxPrice) {
      conditions.push('price_per_night <= @maxPrice');
      params.maxPrice = parseFloat(maxPrice);
    }

    if (search && search.trim()) {
      conditions.push('(room_number LIKE @search OR type LIKE @search OR description LIKE @search OR amenities LIKE @search)');
      params.search = `%${search.trim()}%`;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const allowedSort = ['id', 'room_number', 'type', 'price_per_night', 'capacity', 'floor', 'status', 'created_at'];
    const safeSort = allowedSort.includes(sort) ? sort : 'room_number';
    const safeOrder = (order.toUpperCase() === 'DESC') ? 'DESC' : 'ASC';

    const sql = `SELECT * FROM rooms ${whereClause} ORDER BY ${safeSort} ${safeOrder}`;
    const rooms = db.prepare(sql).all(params);

    res.json({ success: true, count: rooms.length, data: rooms });
  } catch (error) {
    console.error('List rooms error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Search Available Rooms by Date Range & Type (Prevents Overbooking)
app.get('/api/rooms/search', (req, res) => {
  try {
    const { checkIn, checkOut, type, guests } = req.query;

    if (!checkIn || !checkOut) {
      return res.status(400).json({
        success: false,
        error: 'Both checkIn and checkOut dates are required for search'
      });
    }

    if (new Date(checkIn) >= new Date(checkOut)) {
      return res.status(400).json({
        success: false,
        error: 'Check-out date must be strictly after check-in date'
      });
    }

    // Find rooms that have NO conflicting bookings in the date range
    let sql = `
      SELECT r.* FROM rooms r
      WHERE r.status != 'Maintenance'
        AND r.id NOT IN (
          SELECT b.room_id FROM bookings b
          WHERE b.status = 'Confirmed'
            AND (b.check_in < @checkOut AND b.check_out > @checkIn)
        )
    `;

    const params = { checkIn, checkOut };

    if (type && type !== 'all') {
      sql += ' AND r.type = @type';
      params.type = type;
    }

    if (guests) {
      sql += ' AND r.capacity >= @guests';
      params.guests = parseInt(guests, 10);
    }

    sql += ' ORDER BY r.price_per_night ASC';

    const availableRooms = db.prepare(sql).all(params);

    res.json({
      success: true,
      count: availableRooms.length,
      checkIn,
      checkOut,
      data: availableRooms
    });
  } catch (error) {
    console.error('Room search error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Get Single Room Details (with its upcoming reservations)
app.get('/api/rooms/:id', (req, res) => {
  try {
    const { id } = req.params;
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);

    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    const bookings = db.prepare(`
      SELECT id, booking_reference, guest_name, check_in, check_out, status, total_price
      FROM bookings
      WHERE room_id = ? AND status != 'Cancelled'
      ORDER BY check_in ASC
    `).all(id);

    res.json({
      success: true,
      data: {
        ...room,
        bookings
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Add a New Room
app.post('/api/rooms', (req, res) => {
  try {
    const { room_number, type, price_per_night, capacity = 2, floor = 1, status = 'Available', amenities = '', description = '' } = req.body;

    if (!room_number || !type || !price_per_night) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed: Room Number, Type, and Price per Night are required'
      });
    }

    const price = parseFloat(price_per_night);
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ success: false, error: 'Price per night must be a positive number' });
    }

    const cleanRoomNum = room_number.toString().trim();
    const existing = db.prepare('SELECT id FROM rooms WHERE room_number = ?').get(cleanRoomNum);
    if (existing) {
      return res.status(409).json({ success: false, error: `Room number "${cleanRoomNum}" already exists` });
    }

    const insert = db.prepare(`
      INSERT INTO rooms (room_number, type, price_per_night, capacity, floor, status, amenities, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      cleanRoomNum,
      type.trim(),
      price,
      parseInt(capacity, 10) || 2,
      parseInt(floor, 10) || 1,
      status || 'Available',
      amenities.trim(),
      description.trim()
    );

    const newRoom = db.prepare('SELECT * FROM rooms WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: `Room ${cleanRoomNum} added successfully`,
      data: newRoom
    });
  } catch (error) {
    console.error('Add room error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Update Room Details
app.put('/api/rooms/:id', (req, res) => {
  try {
    const { id } = req.params;
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);

    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    const { room_number, type, price_per_night, capacity, floor, status, amenities, description } = req.body;

    const newNumber = room_number ? room_number.toString().trim() : room.room_number;
    if (newNumber !== room.room_number) {
      const duplicate = db.prepare('SELECT id FROM rooms WHERE room_number = ? AND id != ?').get(newNumber, id);
      if (duplicate) {
        return res.status(409).json({ success: false, error: `Room number "${newNumber}" already in use by another room` });
      }
    }

    const newPrice = price_per_night !== undefined ? parseFloat(price_per_night) : room.price_per_night;
    const newType = type || room.type;
    const newCapacity = capacity !== undefined ? parseInt(capacity, 10) : room.capacity;
    const newFloor = floor !== undefined ? parseInt(floor, 10) : room.floor;
    const newStatus = status || room.status;
    const newAmenities = amenities !== undefined ? amenities.trim() : room.amenities;
    const newDesc = description !== undefined ? description.trim() : room.description;

    db.prepare(`
      UPDATE rooms
      SET room_number = ?, type = ?, price_per_night = ?, capacity = ?, floor = ?, status = ?, amenities = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newNumber, newType, newPrice, newCapacity, newFloor, newStatus, newAmenities, newDesc, id);

    const updated = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);

    res.json({
      success: true,
      message: `Room ${newNumber} updated successfully`,
      data: updated
    });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. Delete Room
app.delete('/api/rooms/:id', (req, res) => {
  try {
    const { id } = req.params;
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);

    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    // Check if room has active bookings
    const activeBooking = db.prepare(`
      SELECT id FROM bookings WHERE room_id = ? AND status = 'Confirmed'
    `).get(id);

    if (activeBooking) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete Room ${room.room_number} because it has active confirmed bookings. Cancel the bookings first.`
      });
    }

    db.prepare('DELETE FROM rooms WHERE id = ?').run(id);

    res.json({
      success: true,
      message: `Room ${room.room_number} deleted successfully`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// BOOKING ENDPOINTS
// ==========================================

// 9. List All Bookings
app.get('/api/bookings', (req, res) => {
  try {
    const { status, search, sort = 'check_in', order = 'DESC' } = req.query;

    const conditions = [];
    const params = {};

    if (status && status !== 'all') {
      conditions.push('b.status = @status');
      params.status = status;
    }

    if (search && search.trim()) {
      conditions.push('(b.guest_name LIKE @search OR b.guest_email LIKE @search OR b.guest_phone LIKE @search OR b.booking_reference LIKE @search OR r.room_number LIKE @search)');
      params.search = `%${search.trim()}%`;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const allowedSort = ['b.id', 'b.check_in', 'b.check_out', 'b.total_price', 'b.guest_name', 'b.created_at', 'r.room_number'];
    const safeSort = allowedSort.includes(sort) ? sort : 'b.created_at';
    const safeOrder = (order.toUpperCase() === 'ASC') ? 'ASC' : 'DESC';

    const sql = `
      SELECT b.*, r.room_number, r.type as room_type, r.price_per_night, r.floor
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      ${whereClause}
      ORDER BY ${safeSort} ${safeOrder}
    `;

    const bookings = db.prepare(sql).all(params);

    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('List bookings error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 10. Book a Room (With OVERLAP & DOUBLE-BOOKING PREVENTION)
app.post('/api/bookings', (req, res) => {
  try {
    const { room_id, guest_name, guest_email, guest_phone, check_in, check_out, special_requests = '' } = req.body;

    // 1. Validate Required Fields
    if (!room_id || !guest_name || !guest_email || !guest_phone || !check_in || !check_out) {
      return res.status(400).json({
        success: false,
        error: 'Missing required booking fields (Room, Guest Name, Email, Phone, Check-In, Check-Out)'
      });
    }

    // 2. Validate Dates
    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return res.status(400).json({ success: false, error: 'Invalid check-in or check-out date format' });
    }

    if (checkInDate >= checkOutDate) {
      return res.status(400).json({ success: false, error: 'Check-out date must be strictly after check-in date' });
    }

    // Calculate nights
    const diffTime = checkOutDate.getTime() - checkInDate.getTime();
    const nights = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));

    // 3. Verify Room Existence and Availability Status
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(room_id);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Specified room does not exist' });
    }

    if (room.status === 'Maintenance') {
      return res.status(400).json({
        success: false,
        error: `Room ${room.room_number} is currently under maintenance and cannot be booked`
      });
    }

    // 4. CRITICAL: Check for Overlapping Confirmed Bookings (Double-Booking Prevention)
    // An overlap occurs when an existing confirmed booking starts before the new checkout AND ends after the new checkin
    const conflictSql = `
      SELECT id, booking_reference, check_in, check_out, guest_name
      FROM bookings
      WHERE room_id = ?
        AND status = 'Confirmed'
        AND (check_in < ? AND check_out > ?)
      LIMIT 1
    `;

    const conflictingBooking = db.prepare(conflictSql).get(room_id, check_out, check_in);

    if (conflictingBooking) {
      return res.status(409).json({
        success: false,
        error: `Double-booking conflict: Room ${room.room_number} is already reserved from ${conflictingBooking.check_in} to ${conflictingBooking.check_out} (Ref: ${conflictingBooking.booking_reference}). Please select different dates or another room.`
      });
    }

    // 5. Calculate Total Price
    const totalPrice = nights * room.price_per_night;

    // 6. Generate Unique Booking Reference
    const refSuffix = Math.floor(10000 + Math.random() * 90000);
    const bookingReference = `HTL-${refSuffix}`;

    // 7. Insert Booking in Transaction
    const insertBooking = db.prepare(`
      INSERT INTO bookings (booking_reference, room_id, guest_name, guest_email, guest_phone, check_in, check_out, nights, total_price, special_requests, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed')
    `);

    const bookingResult = insertBooking.run(
      bookingReference,
      room_id,
      guest_name.trim(),
      guest_email.trim(),
      guest_phone.trim(),
      check_in,
      check_out,
      nights,
      totalPrice,
      special_requests.trim()
    );

    const createdBooking = db.prepare(`
      SELECT b.*, r.room_number, r.type as room_type, r.price_per_night
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      WHERE b.id = ?
    `).get(bookingResult.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: `Reservation confirmed for Room ${room.room_number}! Reference: ${bookingReference}`,
      data: createdBooking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 11. Cancel Booking (Update Status & Free up Room)
app.put('/api/bookings/:id/cancel', (req, res) => {
  try {
    const { id } = req.params;
    const booking = db.prepare('SELECT b.*, r.room_number FROM bookings b JOIN rooms r ON b.room_id = r.id WHERE b.id = ?').get(id);

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking record not found' });
    }

    if (booking.status === 'Cancelled') {
      return res.status(400).json({ success: false, error: 'Booking is already cancelled' });
    }

    db.prepare("UPDATE bookings SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);

    res.json({
      success: true,
      message: `Reservation ${booking.booking_reference} for Room ${booking.room_number} has been cancelled successfully`
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 12. Delete / Purge Booking
app.delete('/api/bookings/:id', (req, res) => {
  try {
    const { id } = req.params;
    const booking = db.prepare('SELECT booking_reference FROM bookings WHERE id = ?').get(id);

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking record not found' });
    }

    db.prepare('DELETE FROM bookings WHERE id = ?').run(id);

    res.json({
      success: true,
      message: `Booking ${booking.booking_reference} permanently deleted`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🏨 Hotel Room Booking System running at http://localhost:${PORT}`);
  console.log(`📦 Database: SQLite (hotel_database.sqlite)`);
  console.log(`🌐 Web Portal: http://localhost:${PORT}`);
  console.log(`===============================================`);
});

module.exports = app;
