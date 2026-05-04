// app.js

const appContext = {
    currentTab: 'schedule',
    init() {
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
        
        // Initial tab load
        this.switchTab('schedule');
        
        // Verify login
        if (!sessionStorage.getItem('currentUserId')) {
            window.location.href = 'index.html';
        }
    },

    updateTime() {
        const now = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        const dayName = days[now.getDay()];
        const dateString = now.toLocaleDateString();
        
        // 24-hour format
        const timeString = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        document.getElementById('current-day').textContent = dayName;
        document.getElementById('current-date').textContent = dateString;
        document.getElementById('current-time').textContent = timeString;
    },

    switchTab(tabId) {
        this.currentTab = tabId;
        
        // Update sidebar
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.remove('active');
            if(el.dataset.target === tabId) {
                el.classList.add('active');
            }
        });

        // Update content area
        document.querySelectorAll('.tab-content').forEach(el => {
            el.classList.remove('active');
        });
        
        const activeSection = document.getElementById(`tab-${tabId}`);
        if(activeSection) {
            activeSection.classList.add('active');
        }

        // Trigger module load
        if (tabId === 'schedule' && window.scheduleModule) window.scheduleModule.load();
        if (tabId === 'passengers' && window.passengerModule) window.passengerModule.load();
        if (tabId === 'reservations' && window.reservationModule) window.reservationModule.load();
        if (tabId === 'payment-status' && window.paymentModule) window.paymentModule.load();
        if (tabId === 'profile' && window.profileModule) window.profileModule.load();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Only init if we are on dashboard.html
    if (document.getElementById('current-time')) {
        appContext.init();
    }
});
