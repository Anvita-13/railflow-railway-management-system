const express = require('express');
const router = express.Router();
const db = require('../db');

const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// 1. Login Authentication
router.post('/login', asyncHandler(async (req, res) => {
    const { id, password } = req.body;
    if (id === 'admin' && password === 'admin') {
        return res.json({
            success: true,
            officer: { ID: 'admin', NAME: 'Default Admin', ROLE: 'SuperAdmin' }
        });
    }

    try {
        const query = `SELECT ID, NAME, ROLE FROM OFFICERS WHERE ID = :id AND PASSWORD = :password`;
        const rows = await db.executeQuery(query, { id, password });
        if (rows && rows.length > 0) {
            res.json({ success: true, officer: rows[0] });
        } else {
            res.status(401).json({ success: false, message: 'Invalid Credentials' });
        }
    } catch (err) {
        // Logically capture missing OFFICERS table (ORA-00942) safely without terminal stack traces
        if (err.errorNum === 942) {
            res.status(401).json({ success: false, message: 'Invalid Credentials. (OFFICERS table missing, Please use admin)' });
        } else {
            console.error("Login DB error:", err);
            res.status(500).json({ success: false, message: 'Internal Database Error' });
        }
    }
}));

// 2. Schedule
router.get('/schedule', asyncHandler(async (req, res) => {
    const query = `
        SELECT 
            T.TRAIN_ID, 
            T.TRAIN_NAME, 
            NVL(ST_SRC.STATION_NAME, TO_CHAR(T.SOURCE_STATION)) AS SOURCE_STATION,
            NVL(TO_CHAR(S.DEPT_TIME), 'N/A') AS DEPT_TIME,
            S.DEPT_DATE AS DEPT_DATE,
            NVL(TO_CHAR(S.SRC_PLATFORM), '1') AS SRC_PLATFORM,
            NVL(ST_DST.STATION_NAME, TO_CHAR(T.DESTINATION_STATION)) AS DEST_STATION,
            NVL(TO_CHAR(S.ARR_TIME), 'N/A') AS ARR_TIME,
            S.ARR_DATE AS ARR_DATE,
            NVL(TO_CHAR(S.DEST_PLATFORM), '1') AS DEST_PLATFORM
        FROM TRAIN T
        LEFT JOIN (
            SELECT TRAIN_ID, MIN(DEPT_DATE) AS DEPT_DATE, MIN(DEPT_TIME) AS DEPT_TIME,
                   MIN(ARR_DATE) AS ARR_DATE, MIN(ARR_TIME) AS ARR_TIME,
                   MIN(SRC_PLATFORM) AS SRC_PLATFORM, MIN(DEST_PLATFORM) AS DEST_PLATFORM
            FROM TRAIN_SCHEDULE
            GROUP BY TRAIN_ID
        ) S ON T.TRAIN_ID = S.TRAIN_ID
        LEFT JOIN STATION ST_SRC ON T.SOURCE_STATION = ST_SRC.STATION_ID
        LEFT JOIN STATION ST_DST ON T.DESTINATION_STATION = ST_DST.STATION_ID
    `;
    const rows = await db.executeQuery(query);
    res.json(rows);
}));

// Provide train names for dropdowns
router.get('/trains', asyncHandler(async (req, res) => {
    const query = `SELECT TRAIN_ID, TRAIN_NAME FROM TRAIN`;
    const rows = await db.executeQuery(query);
    res.json(rows);
}));

// 3. Passengers by Train
router.get('/passengers/:trainId', asyncHandler(async (req, res) => {
    const trainId = req.params.trainId;
    const query = `
        SELECT 
            TK.TICKET_ID, P.PASSENGER_ID, P.PASSENGER_NAME, TK.TICKET_STATUS,
            CASE WHEN R.RESERVATION_ID IS NOT NULL THEN 'Applied' ELSE 'N/A' END AS RESERVATION,
            CASE WHEN PY.PAYMENT_ID IS NOT NULL THEN 'Paid' ELSE 'Not Paid' END AS PAYMENT_STATUS
        FROM TICKET TK
        JOIN PASSENGER P ON TK.PASSENGER_ID = P.PASSENGER_ID
        LEFT JOIN RESERVATION R ON TK.TICKET_ID = R.TICKET_ID
        LEFT JOIN PAYMENT PY ON TK.TICKET_ID = PY.TICKET_ID
        WHERE TK.TRAIN_ID = :trainId
    `;
    const rows = await db.executeQuery(query, { trainId });
    res.json(rows);
}));

// Add a passenger & automatically create skeleton records for reservation
router.post('/passengers', asyncHandler(async (req, res) => {
    const { 
        passengerName, age, gender, phone, ticketStatus, trainId,
        reservationOption, reservationStatus, paymentOption, paymentMode
    } = req.body;

    if (!passengerName || !trainId) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    try {
        // 1. Auto-generate PASSENGER_ID: MAX + 1, floor 3001
        const pidRes = await db.executeQuery(`SELECT NVL(MAX(PASSENGER_ID), 3000) AS MX FROM PASSENGER`);
        const passengerId = Math.max(pidRes[0].MX + 1, 3001);

        // 2. Auto-generate TICKET_ID: MAX + 1, floor 4001
        const tidRes = await db.executeQuery(`SELECT NVL(MAX(TICKET_ID), 4000) AS MX FROM TICKET`);
        const ticketId = Math.max(tidRes[0].MX + 1, 4001);

        // 4. Insert into PASSENGER
        await db.executeUpdate(
            `INSERT INTO PASSENGER (PASSENGER_ID, PASSENGER_NAME, AGE, GENDER, PHONE) VALUES (:1, :2, :3, :4, :5)`,
            [passengerId, passengerName, age || null, gender || null, phone || null]
        );

        // 5. Fetch train stations and pricing
        const stationData = await db.executeQuery(`SELECT SOURCE_STATION, DESTINATION_STATION, TICKET_PRICE FROM TRAIN WHERE TRAIN_ID = :1`, [trainId]);
        const src = stationData.length ? stationData[0].SOURCE_STATION : null;
        const dest = stationData.length ? stationData[0].DESTINATION_STATION : null;
        const dynamicPrice = (stationData.length && stationData[0].TICKET_PRICE) ? stationData[0].TICKET_PRICE : 500;

        let deptDate = new Date(), arrDate = new Date(Date.now() + 86400000);
        let deptTime = null, arrTime = null;
        try {
            const sched = await db.executeQuery(`SELECT MIN(DEPT_DATE) as DD, MIN(ARR_DATE) as AD, MIN(DEPT_TIME) as DT, MIN(ARR_TIME) as AT FROM TRAIN_SCHEDULE WHERE TRAIN_ID = :1`, [trainId]);
            if (sched.length && sched[0].DD) { deptDate = sched[0].DD; deptTime = sched[0].DT; }
            if (sched.length && sched[0].AD) { arrDate = sched[0].AD; arrTime = sched[0].AT; }
        } catch(e) {}

        // Enforce DB logic for TICKET Ticket Status
        let finalTicketStatus = ticketStatus;
        if (paymentOption === 'Not Paid') finalTicketStatus = 'Pending';
        if (!finalTicketStatus) finalTicketStatus = 'Confirmed';

        // 6. Insert into TICKET
        await db.executeUpdate(
            `INSERT INTO TICKET (TICKET_ID, PASSENGER_ID, TRAIN_ID, DEPT_DATE, ARR_DATE, DEPT_TIME, ARR_TIME, SOURCE_STATION, DESTINATION_STATION, TICKET_STATUS)
             VALUES (:1, :2, :3, :4, :5, :6, :7, :8, :9, :10)`,
            [ticketId, passengerId, trainId, deptDate, arrDate, deptTime, arrTime, src, dest, finalTicketStatus]
        );

        // 7. Conditional Insert into RESERVATION
        if (reservationOption === 'Applied') {
            const ridRes = await db.executeQuery(`SELECT NVL(MAX(RESERVATION_ID), 5000) AS MX FROM RESERVATION`);
            const reservationId = Math.max(ridRes[0].MX + 1, 5001);
            
            await db.executeUpdate(
                `INSERT INTO RESERVATION (RESERVATION_ID, TICKET_ID, SEAT_NUMBER, RESERVATION_STATUS)
                 VALUES (:1, :2, :3, :4)`,
                [reservationId, ticketId, 'TBD', reservationStatus || 'WL']
            );
        }

        // 8. Conditional Insert into PAYMENT
        if (paymentOption === 'Paid') {
            const payRes = await db.executeQuery(`SELECT NVL(MAX(PAYMENT_ID), 6000) AS MX FROM PAYMENT`);
            const paymentId = Math.max(payRes[0].MX + 1, 6001);

            // Calculate dynamic price based on DB schema
            let price = dynamicPrice;

            await db.executeUpdate(
                `INSERT INTO PAYMENT (PAYMENT_ID, TICKET_ID, AMOUNT, PAYMENT_MODE, PAYMENT_DATE)
                 VALUES (:1, :2, :3, :4, SYSDATE)`,
                [paymentId, ticketId, price, paymentMode || 'UPI']
            );
        }

        res.json({ success: true, message: `Passenger ${passengerId} and Ticket ${ticketId} created successfully.` });
    } catch(e) {
        console.error('Error adding passenger:', e.message);
        res.status(500).json({ success: false, message: e.message });
    }
}));

// Delete multiple passengers (meaning deleting their tickets)
router.post('/passengers/delete', asyncHandler(async (req, res) => {
    const { ticketIds } = req.body;
    if (!ticketIds || ticketIds.length === 0) return res.json({ success: true });

    for (const tid of ticketIds) {
        const numTid = Number(tid);
        await db.executeUpdate(`DELETE FROM PAYMENT WHERE TICKET_ID = :1`, [numTid]);
        await db.executeUpdate(`DELETE FROM RESERVATION WHERE TICKET_ID = :1`, [numTid]);
        await db.executeUpdate(`DELETE FROM TICKET WHERE TICKET_ID = :1`, [numTid]);
        await db.executeUpdate(`DELETE FROM PASSENGER WHERE PASSENGER_ID NOT IN (SELECT PASSENGER_ID FROM TICKET)`);
    }

    res.json({ success: true });
}));

// 4. Reservations
router.get('/reservations', asyncHandler(async (req, res) => {
    const query = `
        SELECT 
            R.RESERVATION_ID, R.TICKET_ID, TK.PASSENGER_ID, P.PASSENGER_NAME,
            R.SEAT_NUMBER, R.RESERVATION_STATUS,
            TK.TRAIN_ID, T.TRAIN_NAME
        FROM RESERVATION R
        JOIN TICKET TK ON R.TICKET_ID = TK.TICKET_ID
        JOIN PASSENGER P ON TK.PASSENGER_ID = P.PASSENGER_ID
        JOIN TRAIN T ON TK.TRAIN_ID = T.TRAIN_ID
    `;
    const rows = await db.executeQuery(query);
    res.json(rows);
}));

router.put('/reservations', asyncHandler(async (req, res) => {
    const { reservationId, reservationStatus } = req.body;
    
    // First, check the current SEAT_NUMBER
    const currentRes = await db.executeQuery(`SELECT SEAT_NUMBER FROM RESERVATION WHERE RESERVATION_ID = :1`, [reservationId]);
    const currentSeat = currentRes.length ? currentRes[0].SEAT_NUMBER : 'TBD';

    let newSeat = currentSeat;

    // If pushing down to WL, RAC, or Cancelled, strip the seat
    if (['WL', 'RAC', 'Cancelled'].includes(reservationStatus)) {
        newSeat = 'TBD';
    } 
    // If pushing UP to CNF, and it lacks a seat, assign a random dummy one
    else if (reservationStatus === 'CNF' && (!currentSeat || currentSeat === 'TBD')) {
        const randomSeat = 'S' + Math.floor(Math.random() * 8 + 1) + '-' + Math.floor(Math.random() * 70 + 1);
        newSeat = randomSeat;
    }

    // Execute update with both Status and Seat payload
    await db.executeUpdate(
        `UPDATE RESERVATION SET RESERVATION_STATUS = :1, SEAT_NUMBER = :2 WHERE RESERVATION_ID = :3`,
        [reservationStatus, newSeat, reservationId]
    );

    res.json({ success: true, newSeat });
}));

// 5. Payments
// Paid list
router.get('/payments/paid', asyncHandler(async (req, res) => {
    const query = `
        SELECT PY.PAYMENT_ID, PY.TICKET_ID, TK.PASSENGER_ID, P.PASSENGER_NAME, T.TRAIN_ID, T.TRAIN_NAME, 'Daily' as TRAIN_DAY, PY.AMOUNT, PY.PAYMENT_MODE, PY.PAYMENT_DATE
        FROM PAYMENT PY
        JOIN TICKET TK ON PY.TICKET_ID = TK.TICKET_ID
        JOIN PASSENGER P ON TK.PASSENGER_ID = P.PASSENGER_ID
        JOIN TRAIN T ON TK.TRAIN_ID = T.TRAIN_ID
    `;
    const rows = await db.executeQuery(query);
    res.json(rows);
}));

// Not Paid list
router.get('/payments/notpaid', asyncHandler(async (req, res) => {
    const query = `
        SELECT TK.TICKET_ID, TK.PASSENGER_ID, P.PASSENGER_NAME, T.TRAIN_ID, T.TRAIN_NAME, 'Daily' as TRAIN_DAY
        FROM TICKET TK
        JOIN PASSENGER P ON TK.PASSENGER_ID = P.PASSENGER_ID
        JOIN TRAIN T ON TK.TRAIN_ID = T.TRAIN_ID
        WHERE NOT EXISTS (
            SELECT 1 FROM PAYMENT PY WHERE PY.TICKET_ID = TK.TICKET_ID
        )
    `;
    const rows = await db.executeQuery(query);
    res.json(rows);
}));

// Multiple mark as paid
router.post('/payments/complete', asyncHandler(async (req, res) => {
    const { tickets, paymentMode } = req.body;
    const results = [];
    for (const t of tickets) {
        try {
            // Fetch dynamically pricing natively from mapping
            const tktRes = await db.executeQuery(`
                SELECT TR.TICKET_PRICE 
                FROM TICKET TK
                JOIN TRAIN TR ON TK.TRAIN_ID = TR.TRAIN_ID
                WHERE TK.TICKET_ID = :1
            `, [Number(t.ticketId)]);
            
            const dynamicPrice = (tktRes.length && tktRes[0].TICKET_PRICE) ? tktRes[0].TICKET_PRICE : 500;

            // Auto-generate PAYMENT_ID: MAX + 1, floor 6001
            const pidRes = await db.executeQuery(`SELECT NVL(MAX(PAYMENT_ID), 6000) AS MX FROM PAYMENT`);
            const paymentId = Math.max(pidRes[0].MX + 1, 6001);

            await db.executeUpdate(
                `INSERT INTO PAYMENT (PAYMENT_ID, TICKET_ID, AMOUNT, PAYMENT_MODE, PAYMENT_DATE)
                 VALUES (:1, :2, :3, :4, SYSDATE)`,
                [paymentId, Number(t.ticketId), dynamicPrice, paymentMode || 'Net Banking']
            );
            
            // Also enforce updating the TICKET_STATUS to Confirmed if it was Pending
            await db.executeUpdate(
                `UPDATE TICKET SET TICKET_STATUS = 'Confirmed' WHERE TICKET_ID = :1 AND TICKET_STATUS = 'Pending'`,
                [Number(t.ticketId)]
            );

            results.push({ ticketId: t.ticketId, paymentId, success: true });
        } catch(e) {
            results.push({ ticketId: t.ticketId, success: false, error: e.message });
        }
    }
    res.json({ success: true, results });
}));

// 6. Profile
router.get('/profile/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (id === 'admin') {
        return res.json({
            ID: 'admin',
            PASSWORD: 'admin',
            NAME: 'Default Admin',
            ROLE: 'SuperAdmin',
            PHONE_NO: '000-000-0000',
            EMAIL: 'admin@railway.gov'
        });
    }
    try {
        const rows = await db.executeQuery(
            `SELECT ID, PASSWORD, NAME, ROLE, PHONE_NO, EMAIL FROM OFFICERS WHERE ID = :id`,
            { id }
        );
        res.json(rows.length ? rows[0] : null);
    } catch (err) {
        console.error("Profile fetch DB error:", err);
        res.json(null);
    }
}));

router.put('/profile', asyncHandler(async (req, res) => {
    const { id, password, name, role, phone_no, email } = req.body;
    if (id === 'admin') {
        return res.json({ success: true });
    }
    try {
        await db.executeUpdate(
            `UPDATE OFFICERS SET PASSWORD = :2, NAME = :3, ROLE = :4, PHONE_NO = :5, EMAIL = :6 WHERE ID = :1`,
            [id, password, name, role, phone_no, email]
        );
        res.json({ success: true });
    } catch (err) {
        console.error("Profile update DB error:", err);
        res.status(500).json({ success: false, message: 'DB Error' });
    }
}));

module.exports = router;
