// public/js/modules/profile.js

window.profileModule = {
    currentProfile: null,
    isEditing: false,

    async load() {
        const id = sessionStorage.getItem('currentUserId');
        if (!id) return;

        try {
            const profile = await getProfile(id);
            if (profile) {
                this.currentProfile = profile;
                this.displayProfile();
            }
        } catch(e) {
            console.error(e);
        }

        const form = document.getElementById('profile-form');
        form.onsubmit = async (e) => {
            e.preventDefault();
            this.saveProfile();
        };
    },

    displayProfile() {
        if (!this.currentProfile) return;

        // Display mode
        document.getElementById('disp-username').textContent = this.currentProfile.ID || '-';
        document.getElementById('disp-fullname').textContent = this.currentProfile.NAME || '-';
        document.getElementById('disp-role').textContent = this.currentProfile.ROLE || '-';
        document.getElementById('disp-phone').textContent = this.currentProfile.PHONE_NO || '-';
        document.getElementById('disp-email').textContent = this.currentProfile.EMAIL || '-';
        document.getElementById('disp-dob').textContent = this.currentProfile.DOB ? this.formatDateForDisplay(this.currentProfile.DOB) : '-';
    },

    enableEdit() {
        if (!this.currentProfile) return;

        this.isEditing = true;

        // Hide display, show form
        document.getElementById('profile-display').style.display = 'none';
        document.getElementById('profile-form').style.display = 'block';
        document.getElementById('profile-actions').style.display = 'none';

        // Populate form with current values
        document.getElementById('prof-username').value = this.currentProfile.ID || '';
        document.getElementById('prof-fullname').value = this.currentProfile.NAME || '';
        document.getElementById('prof-role').value = this.currentProfile.ROLE || 'Operations Manager';
        document.getElementById('prof-phone').value = this.currentProfile.PHONE_NO || '';
        document.getElementById('prof-email').value = this.currentProfile.EMAIL || '';
        document.getElementById('prof-password').value = this.currentProfile.PASSWORD || '';
        
        // Format date for input (YYYY-MM-DD)
        if (this.currentProfile.DOB) {
            const date = new Date(this.currentProfile.DOB);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            document.getElementById('prof-dob').value = `${year}-${month}-${day}`;
        }

        // Reset password visibility
        document.getElementById('prof-password').type = 'password';
        document.getElementById('toggle-password').textContent = 'Show';
    },

    cancelEdit() {
        this.isEditing = false;

        // Show display, hide form
        document.getElementById('profile-display').style.display = 'block';
        document.getElementById('profile-form').style.display = 'none';
        document.getElementById('profile-actions').style.display = 'block';

        // Reset password visibility
        document.getElementById('prof-password').type = 'password';
        document.getElementById('toggle-password').textContent = 'Show';
    },

    togglePasswordVisibility() {
        const pwdField = document.getElementById('prof-password');
        const toggle = document.getElementById('toggle-password');

        if (pwdField.type === 'password') {
            pwdField.type = 'text';
            toggle.textContent = 'Hide';
        } else {
            pwdField.type = 'password';
            toggle.textContent = 'Show';
        }
    },

    formatDateForDisplay(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    },

    async saveProfile() {
        const username = document.getElementById('prof-username').value;
        const fullname = document.getElementById('prof-fullname').value;
        const role = document.getElementById('prof-role').value;
        const phone = document.getElementById('prof-phone').value;
        const email = document.getElementById('prof-email').value;
        const password = document.getElementById('prof-password').value;
        const dob = document.getElementById('prof-dob').value;

        const data = {
            id: username,
            name: fullname,
            password: password,
            role: role,
            phone_no: phone,
            email: email,
            dob: dob || null
        };

        try {
            const res = await updateProfile(data);
            if (res.success) {
                alert('Profile updated successfully');
                this.currentProfile = {
                    ID: username,
                    NAME: fullname,
                    PASSWORD: password,
                    ROLE: role,
                    PHONE_NO: phone,
                    EMAIL: email,
                    DOB: dob
                };
                this.cancelEdit();
                this.displayProfile();
            } else {
                alert('Failed to update profile');
            }
        } catch(e) {
            console.error(e);
            alert('Error updating profile');
        }
    },

    logout() {
        // Clear session and redirect to login
        sessionStorage.removeItem('currentUserId');
        sessionStorage.removeItem('currentUserName');
        window.location.href = '/index.html';
    }
};
