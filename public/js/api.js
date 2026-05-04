// public/js/api.js

const API_BASE = '/api';

async function fetchAPI(endpoint, options = {}) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });
    if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`);
    }
    return res.json();
}

// Auth
const apiLogin = (id, password) => fetchAPI('/login', {
    method: 'POST',
    body: JSON.stringify({ id, password })
});

// Schedule
const getSchedule = () => fetchAPI('/schedule');

// Passengers
const getTrains = () => fetchAPI('/trains');
const getPassengers = (trainId) => fetchAPI(`/passengers/${trainId}`);
const addPassenger = (data) => fetchAPI('/passengers', {
    method: 'POST',
    body: JSON.stringify(data)
});
const deletePassengers = (ticketIds) => fetchAPI('/passengers/delete', {
    method: 'POST',
    body: JSON.stringify({ ticketIds })
});

// Reservations
const getReservations = () => fetchAPI('/reservations');
const updateReservation = (reservationId, reservationStatus) => fetchAPI('/reservations', {
    method: 'PUT',
    body: JSON.stringify({ reservationId, reservationStatus })
});

// Payments
const getPaidList = () => fetchAPI('/payments/paid');
const getNotPaidList = () => fetchAPI('/payments/notpaid');
const completePayment = (payload) => fetchAPI('/payments/complete', {
    method: 'POST',
    body: JSON.stringify(payload)
});

// Profile
const getProfile = (id) => fetchAPI(`/profile/${id}`);
const updateProfile = (data) => fetchAPI('/profile', {
    method: 'PUT',
    body: JSON.stringify(data)
});

// Export if module, but since we're using simple script tags, they will be globally available.
