const db = require('./index');

function seedDatabase() {
  const roomCount = db.prepare('SELECT COUNT(*) as count FROM rooms').get().count;
  if (roomCount > 0) {
    console.log(`Database already has ${roomCount} rooms. Skipping initial seed.`);
    return;
  }

  console.log('Seeding initial Hotel Rooms and Bookings with INR (Rupees) rates...');

  const insertRoom = db.prepare(`
    INSERT INTO rooms (room_number, type, price_per_night, capacity, floor, status, amenities, description)
    VALUES (@room_number, @type, @price_per_night, @capacity, @floor, @status, @amenities, @description)
  `);

  const roomsData = [
    {
      room_number: '101',
      type: 'Single',
      price_per_night: 4500.00,
      capacity: 1,
      floor: 1,
      status: 'Available',
      amenities: 'Free High-Speed Wi-Fi, Ergonomic Work Desk, 43" Smart TV, Rain Shower, Climate Control',
      description: 'Cozy, modern single room tailored for solo travelers and business executives seeking comfort.'
    },
    {
      room_number: '102',
      type: 'Single',
      price_per_night: 5200.00,
      capacity: 1,
      floor: 1,
      status: 'Available',
      amenities: 'Free High-Speed Wi-Fi, Work Desk, 43" Smart TV, Garden View, Coffee Maker',
      description: 'Peaceful garden-facing single room with quiet acoustic insulation and plush mattress.'
    },
    {
      room_number: '201',
      type: 'Double',
      price_per_night: 8500.00,
      capacity: 2,
      floor: 2,
      status: 'Occupied',
      amenities: 'King Bed, City Skyline View, 50" 4K TV, Mini Fridge, Rainfall Shower, Luxury Linens',
      description: 'Spacious double room with floor-to-ceiling windows overlooking the vibrant skyline.'
    },
    {
      room_number: '202',
      type: 'Double',
      price_per_night: 9200.00,
      capacity: 2,
      floor: 2,
      status: 'Available',
      amenities: 'Twin Beds, Courtyard View, Wi-Fi, Mini Bar, Safe, Premium Ayurveda Toiletries',
      description: 'Elegant dual-bed configuration ideal for friends and colleagues traveling together.'
    },
    {
      room_number: '301',
      type: 'Deluxe',
      price_per_night: 14500.00,
      capacity: 3,
      floor: 3,
      status: 'Available',
      amenities: 'King Bed, Private Balcony, Ocean Horizon View, Bathtub, Nespresso Machine, Robes & Slippers',
      description: 'Sophisticated deluxe haven with sunset balcony views and bespoke Italian marble bathroom.'
    },
    {
      room_number: '302',
      type: 'Deluxe',
      price_per_night: 16500.00,
      capacity: 3,
      floor: 3,
      status: 'Available',
      amenities: 'King Bed, Lounge Seating, Panoramic Balcony, 55" OLED TV, Bluetooth Soundbar',
      description: 'Ultra-luxurious deluxe room featuring curated artwork and expansive lounge area.'
    },
    {
      room_number: '401',
      type: 'Executive Suite',
      price_per_night: 26000.00,
      capacity: 4,
      floor: 4,
      status: 'Available',
      amenities: 'Separate Living Salon, Dining Table, Jacuzzi Tub, Executive Lounge Access, Complimentary Bar',
      description: 'Two-room suite boasting separate dining salon, private whirlpool spa tub, and VIP privileges.'
    },
    {
      room_number: '501',
      type: 'Presidential Suite',
      price_per_night: 55000.00,
      capacity: 4,
      floor: 5,
      status: 'Available',
      amenities: '360° Penthouse Rooftop Terrace, Private Butler Service, Grand Piano, Custom Spa Bath, Kitchenette',
      description: 'The pinnacle of luxury. Private rooftop terrace, dedicated butler service, and unrivaled vistas.'
    }
  ];

  const insertBooking = db.prepare(`
    INSERT INTO bookings (booking_reference, room_id, guest_name, guest_email, guest_phone, check_in, check_out, nights, total_price, special_requests, status)
    VALUES (@booking_reference, @room_id, @guest_name, @guest_email, @guest_phone, @check_in, @check_out, @nights, @total_price, @special_requests, @status)
  `);

  const seedTx = db.transaction(() => {
    const roomMap = {};
    for (const r of roomsData) {
      const res = insertRoom.run(r);
      roomMap[r.room_number] = res.lastInsertRowid;
    }

    const today = new Date();
    const d1 = new Date(today);
    d1.setDate(today.getDate() + 1);
    const d2 = new Date(today);
    d2.setDate(today.getDate() + 4);

    insertBooking.run({
      booking_reference: 'HTL-10821',
      room_id: roomMap['201'],
      guest_name: 'Aditya Sharma',
      guest_email: 'aditya.sharma@example.in',
      guest_phone: '+91 98201 44521',
      check_in: d1.toISOString().split('T')[0],
      check_out: d2.toISOString().split('T')[0],
      nights: 3,
      total_price: 8500.00 * 3,
      special_requests: 'High floor preferred, late check-in requested.',
      status: 'Confirmed'
    });

    const d3 = new Date(today);
    d3.setDate(today.getDate() + 5);
    const d4 = new Date(today);
    d4.setDate(today.getDate() + 7);

    insertBooking.run({
      booking_reference: 'HTL-20944',
      room_id: roomMap['301'],
      guest_name: 'Dr. Priya Nair',
      guest_email: 'priya.nair@aiims.edu',
      guest_phone: '+91 94470 12890',
      check_in: d3.toISOString().split('T')[0],
      check_out: d4.toISOString().split('T')[0],
      nights: 2,
      total_price: 14500.00 * 2,
      special_requests: 'Quiet room with ocean sunset view for conference visit.',
      status: 'Confirmed'
    });
  });

  seedTx();
  console.log('Seeding completed successfully with Rupee rates!');
}

module.exports = { seedDatabase };

if (require.main === module) {
  seedDatabase();
}
