// public/js/modules/schedule.js

window.scheduleModule = {
    async load() {
        try {
            const data = await getSchedule();
            const tbody = document.getElementById('schedule-tbody');
            tbody.innerHTML = '';
            
            if (!data || data.length === 0) {
                tbody.innerHTML = `<tr><td colspan="10" style="text-align: center;">No schedule available</td></tr>`;
                return;
            }

            data.forEach(train => {
                const formatDate = (dateStr) => {
                    if (!dateStr) return 'N/A';
                    const date = new Date(dateStr);
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    return `${day}-${month}-${year}`;
                };
                const deptDate = formatDate(train.DEPT_DATE);
                const arrDate = formatDate(train.ARR_DATE);
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${train.TRAIN_ID}</td>
                    <td><strong>${train.TRAIN_NAME}</strong></td>
                    <td>${train.SOURCE_STATION}</td>
                    <td>${train.DEPT_TIME}</td>
                    <td>${deptDate}</td>
                    <td>${train.SRC_PLATFORM}</td>
                    <td>${train.DEST_STATION}</td>
                    <td>${train.ARR_TIME}</td>
                    <td>${arrDate}</td>
                    <td>${train.DEST_PLATFORM}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch (error) {
            console.error('Failed to load schedule', error);
        }
    }
};
