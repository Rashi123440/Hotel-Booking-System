async function runHotelTests() {
  const base = 'http://localhost:3000';
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
    }
  }

  console.log('====================================================');
  console.log('🏨 HOTEL ROOM BOOKING SYSTEM - RUPEE (INR) TESTS');
  console.log('====================================================');

  try {
    // 1. Health check
    const healthRes = await fetch(`${base}/api/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.status === 'healthy', 'GET /api/health returns healthy status');

    // 2. Stats
    const statsRes = await fetch(`${base}/api/stats`);
    const statsData = await statsRes.json();
    assert(statsRes.status === 200 && statsData.success && statsData.data.totalRooms >= 8, 'GET /api/stats returns room counts and revenue');

    // 3. List Rooms
    const roomsRes = await fetch(`${base}/api/rooms`);
    const roomsData = await roomsRes.json();
    assert(roomsRes.status === 200 && roomsData.data.length >= 8, 'GET /api/rooms returns seeded rooms catalog');

    // 4. Add Room (with Rupee price)
    const addRoomRes = await fetch(`${base}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_number: '999',
        type: 'Deluxe',
        price_per_night: 18500.00,
        capacity: 2,
        floor: 9,
        amenities: 'Skyline Terrace, Rain Shower, Jacuzzi',
        description: 'Penthouse test suite with Indian ocean view'
      })
    });
    const addRoomData = await addRoomRes.json();
    assert(addRoomRes.status === 201 && addRoomData.success && addRoomData.data.room_number === '999', 'POST /api/rooms adds new room with ₹18,500 rate');

    const createdRoomId = addRoomData.data.id;

    // 5. Update Room
    const updateRoomRes = await fetch(`${base}/api/rooms/${createdRoomId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price_per_night: 19500.00 })
    });
    const updateRoomData = await updateRoomRes.json();
    assert(updateRoomRes.status === 200 && updateRoomData.data.price_per_night === 19500, 'PUT /api/rooms/:id updates room price to ₹19,500');

    // 6. Search Available Rooms by Date Range
    const searchRes = await fetch(`${base}/api/rooms/search?checkIn=2026-11-01&checkOut=2026-11-05&type=Deluxe`);
    const searchData = await searchRes.json();
    assert(searchRes.status === 200 && searchData.data.some(r => r.id === createdRoomId), 'GET /api/rooms/search finds available rooms for dates');

    // 7. Book Room for Guest (in Rupees)
    const bookRes = await fetch(`${base}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_id: createdRoomId,
        guest_name: 'Vikramaditya Singhania',
        guest_email: 'vikram@singhania.in',
        guest_phone: '+91 98200 12345',
        check_in: '2026-11-01',
        check_out: '2026-11-05',
        special_requests: 'Airport Rolls-Royce transfer and vegetarian Jain dining'
      })
    });
    const bookData = await bookRes.json();
    assert(bookRes.status === 201 && bookData.success && bookData.data.nights === 4 && bookData.data.total_price === 19500 * 4, 'POST /api/bookings reserves room (4 nights = ₹78,000 calculated)');

    const createdBookingId = bookData.data.id;

    // 8. EDGE CASE TEST: Overlapping Double-Booking Prevention!
    const conflictRes = await fetch(`${base}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_id: createdRoomId,
        guest_name: 'Duplicate Booker',
        guest_email: 'duplicate@test.in',
        guest_phone: '+91 90000 00000',
        check_in: '2026-11-03',
        check_out: '2026-11-07'
      })
    });
    const conflictData = await conflictRes.json();
    assert(conflictRes.status === 409 && conflictData.error.includes('Double-booking conflict'), 'EDGE CASE: Double-booking overlap correctly rejected with 409 Conflict');

    // 9. Cancel Booking
    const cancelRes = await fetch(`${base}/api/bookings/${createdBookingId}/cancel`, { method: 'PUT' });
    const cancelData = await cancelRes.json();
    assert(cancelRes.status === 200 && cancelData.success, 'PUT /api/bookings/:id/cancel successfully cancels booking');

    // 10. Clean up: Delete Room
    const deleteRoomRes = await fetch(`${base}/api/rooms/${createdRoomId}`, { method: 'DELETE' });
    const deleteRoomData = await deleteRoomRes.json();
    assert(deleteRoomRes.status === 200 && deleteRoomData.success, 'DELETE /api/rooms/:id deletes room');

    // 11. Static Frontend Assets
    const htmlRes = await fetch(`${base}/`);
    assert(htmlRes.status === 200, 'GET / serves HTML portal');

    const cssRes = await fetch(`${base}/css/style.css`);
    assert(cssRes.status === 200, 'GET /css/style.css serves luxury stylesheet');

    const jsRes = await fetch(`${base}/js/app.js`);
    assert(jsRes.status === 200, 'GET /js/app.js serves application controller');

  } catch (err) {
    console.error('Test execution error:', err);
  }

  console.log('====================================================');
  console.log(`TOTAL PASSED: ${passed}/${total} (${Math.round((passed / total) * 100)}%)`);
  console.log('====================================================');
}

runHotelTests();
