// public/js/modules/reservations.js

window.reservationModule = {
    async load() {
        try {
            const data = await getReservations();
            const tbody = document.getElementById('reservations-tbody');
            tbody.innerHTML = '';
            
            if (!data || data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="9" style="text-align: center;">No reservations available</td></tr>`;
                return;
            }

            data.forEach(r => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${r.RESERVATION_ID}</td>
                    <td>${r.TICKET_ID}</td>
                    <td>${r.TRAIN_ID}</td>
                    <td><strong>${r.TRAIN_NAME}</strong></td>
                    <td>${r.PASSENGER_ID}</td>
                    <td><strong>${r.PASSENGER_NAME}</strong></td>
                    <td>
                        ${(() => {
                            if (r.RESERVATION_STATUS === 'WL') return '<span style="color: #d97706; font-weight: 500;">TBD</span>';
                            if (r.RESERVATION_STATUS === 'RAC') return '<span style="color: #0284c7; font-weight: 500;">TBD</span>';
                            if (r.RESERVATION_STATUS === 'Cancelled') return `<span style="color: #cf222e; text-decoration: line-through;">${r.SEAT_NUMBER || 'TBD'}</span>`;
                            return `<span style="color: var(--text-black);">${r.SEAT_NUMBER || 'TBD'}</span>`;
                        })()}
                    </td>
                    <td id="status-cell-${r.RESERVATION_ID}">
                        <span class="status-badge status-${r.RESERVATION_STATUS.toLowerCase()}">
                            ${r.RESERVATION_STATUS}
                        </span>
                    </td>
                    <td>
                        <button class="edit-btn" id="edit-btn-${r.RESERVATION_ID}" onclick="reservationModule.enableEdit('${r.RESERVATION_ID}', '${r.RESERVATION_STATUS}')">Edit</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } catch(e) {
            console.error(e);
        }
    },

    enableEdit(resId, currentStatus) {
        const cell = document.getElementById(`status-cell-${resId}`);
        const editBtn = document.getElementById(`edit-btn-${resId}`);
        
        const statuses = ['CNF', 'RAC', 'WL', 'Cancelled'];
        let selectHtml = `<select id="select-status-${resId}">`;
        statuses.forEach(s => {
            selectHtml += `<option value="${s}" ${s === currentStatus ? 'selected' : ''}>${s}</option>`;
        });
        selectHtml += `</select>`;
        
        cell.innerHTML = selectHtml;
        
        editBtn.textContent = 'Save';
        // Change onclick function dynamically
        editBtn.onclick = () => this.saveEdit(resId);
    },

    async saveEdit(resId) {
        const select = document.getElementById(`select-status-${resId}`);
        const newStatus = select.value;
        
        try {
            await updateReservation(resId, newStatus);
            // Refresh
            this.load();
        } catch(e) {
            console.error(e);
        }
    }
};
