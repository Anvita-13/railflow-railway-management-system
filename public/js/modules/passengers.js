// public/js/modules/passengers.js

window.passengerModule = {
    trainsLoaded: false,
    
    async load() {
        if (!this.trainsLoaded) {
            await this.loadTrains();
            this.trainsLoaded = true;
            
            document.getElementById('train-selector').addEventListener('change', (e) => {
                const trainId = e.target.value;
                if(trainId) {
                    this.loadPassengers(trainId);
                } else {
                    document.getElementById('passengers-tbody').innerHTML = `<tr><td colspan="7" style="text-align: center;">Select a train above</td></tr>`;
                    document.getElementById('passengers-actions').style.display = 'none';
                }
            });
        }
    },
    
    async loadTrains() {
        try {
            const data = await getTrains();
            const selector = document.getElementById('train-selector');
            data.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.TRAIN_ID;
                opt.textContent = `${t.TRAIN_NAME} (${t.TRAIN_ID})`;
                selector.appendChild(opt);
            });
        } catch(e) {
            console.error(e);
        }
    },
    
    async loadPassengers(trainId) {
        try {
            const data = await getPassengers(trainId);
            const tbody = document.getElementById('passengers-tbody');
            tbody.innerHTML = '';
            
            document.getElementById('passengers-actions').style.display = 'flex';
            
            if (!data || data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align: center;">No passengers found</td></tr>`;
                return;
            }

            data.forEach(p => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><input type="checkbox" class="passenger-select" value="${p.TICKET_ID}"></td>
                    <td>${p.TICKET_ID}</td>
                    <td>${p.PASSENGER_ID}</td>
                    <td><strong>${p.PASSENGER_NAME}</strong></td>
                    <td>${p.TICKET_STATUS}</td>
                    <td><span class="status-badge ${p.RESERVATION === 'Applied' ? 'status-applied' : 'status-na'}">${p.RESERVATION}</span></td>
                    <td><span class="status-badge ${p.PAYMENT_STATUS === 'Paid' ? 'status-paid' : 'status-not-paid'}">${p.PAYMENT_STATUS}</span></td>
                `;
                tbody.appendChild(tr);
            });
        } catch(e) {
            console.error(e);
        }
    },

    initAddRow() {
        const trainId = document.getElementById('train-selector').value;
        if (!trainId) return alert('Please select a train first');

        // Reset the form fields
        document.getElementById('new-passenger-name').value = '';
        document.getElementById('new-age').value = '';
        document.getElementById('new-gender').value = 'M';
        document.getElementById('new-phone').value = '';
        
        // Reset selections
        const resSel = document.getElementById('new-reservation-status');
        resSel.value = '';
        this.toggleReservationFields();
        
        const paySel = document.getElementById('new-payment-status');
        paySel.value = '';
        this.togglePaymentFields();

        // Reveal the widget
        document.getElementById('add-passenger-form').style.display = 'block';
        document.getElementById('passengers-actions').style.display = 'none';
        
        // Ensure ticket status is checked on init
        this.updateTicketStatusDropdown();
    },

    cancelAdd() {
        document.getElementById('add-passenger-form').style.display = 'none';
        document.getElementById('passengers-actions').style.display = 'flex';
    },

    toggleReservationFields() {
        const resVal = document.getElementById('new-reservation-status').value;
        document.getElementById('res-status-group').style.display = (resVal === 'Applied') ? 'block' : 'none';
        this.updateTicketStatusDropdown();
    },

    togglePaymentFields() {
        const payVal = document.getElementById('new-payment-status').value;
        document.getElementById('pay-mode-group').style.display = (payVal === 'Paid') ? 'block' : 'none';
        this.updateTicketStatusDropdown();
    },

    updateTicketStatusDropdown() {
        const resVal = document.getElementById('new-reservation-status').value;
        const payVal = document.getElementById('new-payment-status').value;
        const tktSel = document.getElementById('new-ticket-status');

        if (!resVal || !payVal) {
            tktSel.disabled = true;
            tktSel.innerHTML = '<option value="" disabled selected>Fill Reservation & Payment first</option><option value="Pending">Pending</option><option value="Confirmed">Confirmed</option>';
            return;
        }

        tktSel.disabled = false;
        if (payVal === 'Not Paid') {
            tktSel.innerHTML = '<option value="Pending" selected>Pending</option>';
            tktSel.disabled = true; // Lock exactly to Pending as requested
        } else {
            tktSel.innerHTML = '<option value="Confirmed" selected>Confirmed</option><option value="Pending">Pending</option>';
            tktSel.disabled = false;
        }
    },

    async saveNewPassenger() {
        const trainId = document.getElementById('train-selector').value;
        const passengerName = document.getElementById('new-passenger-name').value;
        const age = document.getElementById('new-age').value;
        const gender = document.getElementById('new-gender').value;
        const phone = document.getElementById('new-phone').value;
        
        const reservationOption = document.getElementById('new-reservation-status').value;
        const reservationStatus = document.getElementById('new-res-type').value;
        
        const paymentOption = document.getElementById('new-payment-status').value;
        const paymentMode = document.getElementById('new-pay-mode').value;
        
        // If disabled, fetch its value directly since it might be locked to 'Pending'
        const tktSel = document.getElementById('new-ticket-status');
        const ticketStatus = tktSel.value;

        if (!trainId) { alert('Please select a train first'); return; }
        if (!passengerName) { alert('Please enter passenger name'); return; }
        if (!reservationOption || !paymentOption) { alert('Please select Reservation and Payment options'); return; }

        try {
            const payload = {
                trainId, passengerName, age, gender, phone, ticketStatus,
                reservationOption, reservationStatus, paymentOption, paymentMode
            };
            const res = await addPassenger(payload);
            
            if (res.success) {
                alert('Passenger added: ' + res.message);
                this.cancelAdd(); // Collapse the form
                this.loadPassengers(trainId);
            } else {
                alert('Error: ' + (res.message || 'Unknown error'));
            }
        } catch(e) {
            console.error('Error adding passenger:', e);
            alert('Error: ' + e.message);
        }
    },

    async deleteSelected() {
        const checkboxes = document.querySelectorAll('.passenger-select:checked');
        const ticketIds = Array.from(checkboxes).map(cb => cb.value);
        if (ticketIds.length === 0) return alert('Select records to delete');

        if (confirm('Are you sure you want to delete selected records?')) {
            try {
                await deletePassengers(ticketIds);
                // Refresh
                const trainId = document.getElementById('train-selector').value;
                this.loadPassengers(trainId);
            } catch(e) {
                console.error(e);
            }
        }
    }
};
