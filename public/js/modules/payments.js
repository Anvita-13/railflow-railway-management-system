// public/js/modules/payments.js

window.paymentModule = {
    async load() {
        this.loadNotPaid();
        this.loadPaid();
    },

    async loadNotPaid() {
        try {
            const data = await getNotPaidList();
            const tbody = document.getElementById('not-paid-tbody');
            tbody.innerHTML = '';
            
            if (!data || data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align: center;">All passengers have paid</td></tr>`;
                return;
            }

            data.forEach(p => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><input type="checkbox" class="notpaid-select" data-ticket="${p.TICKET_ID}" data-passenger="${p.PASSENGER_ID}"></td>
                    <td>${p.TICKET_ID}</td>
                    <td>${p.PASSENGER_ID}</td>
                    <td><strong>${p.PASSENGER_NAME}</strong></td>
                    <td>${p.TRAIN_ID}</td>
                    <td>${p.TRAIN_NAME}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch(e) {
            console.error(e);
        }
    },

    async loadPaid() {
        try {
            const data = await getPaidList();
            const tbody = document.getElementById('paid-tbody');
            tbody.innerHTML = '';
            
            if (!data || data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="9" style="text-align: center;">No completed payments yet</td></tr>`;
                return;
            }

            data.forEach(p => {
                const tr = document.createElement('tr');
                // Format date roughly just to string if it comes as ISO
                const dateFmt = typeof p.PAYMENT_DATE === 'string' ? p.PAYMENT_DATE.split('T')[0] : 'N/A';
                
                tr.innerHTML = `
                    <td>${p.PAYMENT_ID}</td>
                    <td>${p.TICKET_ID}</td>
                    <td>${p.PASSENGER_ID}</td>
                    <td><strong>${p.PASSENGER_NAME}</strong></td>
                    <td>${p.TRAIN_ID}</td>
                    <td>${p.TRAIN_NAME}</td>
                    <td>₹${p.AMOUNT}</td>
                    <td><span class="status-badge status-applied">${p.PAYMENT_MODE}</span></td>
                    <td>${dateFmt}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch(e) {
            console.error(e);
        }
    },

    markSelectedAsPaid() {
        const checkboxes = document.querySelectorAll('.notpaid-select:checked');
        if (checkboxes.length === 0) return alert('Select passengers to complete payment');
        
        // Hide the action bar and show the payment mode box
        document.getElementById('not-paid-actions').style.display = 'none';
        document.getElementById('payment-mode-box').style.display = 'block';
    },

    cancelPayment() {
        // Hide the payment mode box and restore the action bar
        document.getElementById('payment-mode-box').style.display = 'none';
        document.getElementById('not-paid-actions').style.display = 'flex';
    },

    async confirmAndSavePayment() {
        const checkboxes = document.querySelectorAll('.notpaid-select:checked');
        const tickets = Array.from(checkboxes).map(cb => ({
            ticketId: cb.dataset.ticket,
            passengerId: cb.dataset.passenger
        }));

        if (tickets.length === 0) {
            alert('Select passengers to complete payment');
            this.cancelPayment();
            return;
        }

        // Get the selected payment mode
        const payModeChecked = document.querySelector('input[name="pay_mode"]:checked');
        const paymentMode = payModeChecked ? payModeChecked.value : 'Net Banking';

        if (confirm(`Charge ${tickets.length} ticket(s) via ${paymentMode}?`)) {
            try {
                // Must pass paymentMode alongside tickets
                const res = await completePayment({ tickets, paymentMode });
                if (res.success) {
                    alert(`Payment successful! ${tickets.length} reservation(s) confirmed.`);
                    // Refresh both tables
                    this.cancelPayment();
                    this.loadNotPaid();
                    this.loadPaid();
                } else {
                    alert('Error updating payment status');
                }
            } catch(e) {
                console.error(e);
                alert('Error processing payment: ' + e.message);
            }
        }
    }
};
