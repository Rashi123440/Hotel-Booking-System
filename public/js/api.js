/**
 * Hotel Room Booking System - API Client
 * Facilitates asynchronous communication with the Express REST API.
 */

const API = {
  baseUrl: '/api',

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return data;
    } catch (err) {
      console.error(`API Error on ${url}:`, err);
      throw err;
    }
  },

  // 1. System Statistics & KPIs
  async getStats() {
    return this.request('/stats');
  },

  // 2. Room Management
  async getRooms(params = {}) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    }
    return this.request(`/rooms?${query.toString()}`);
  },

  async searchAvailableRooms(params = {}) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) query.append(key, value);
    }
    return this.request(`/rooms/search?${query.toString()}`);
  },

  async getRoomById(id) {
    return this.request(`/rooms/${id}`);
  },

  async createRoom(payload) {
    return this.request('/rooms', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async updateRoom(id, payload) {
    return this.request(`/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  async deleteRoom(id) {
    return this.request(`/rooms/${id}`, {
      method: 'DELETE'
    });
  },

  // 3. Booking Management
  async getBookings(params = {}) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) query.append(key, value);
    }
    return this.request(`/bookings?${query.toString()}`);
  },

  async createBooking(payload) {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async cancelBooking(id) {
    return this.request(`/bookings/${id}/cancel`, {
      method: 'PUT'
    });
  },

  async deleteBooking(id) {
    return this.request(`/bookings/${id}`, {
      method: 'DELETE'
    });
  }
};

window.API = API;
