// =============================================
// SETTINGS PAGE - JAVASCRIPT FUNCTIONALITY
// =============================================

// User data
const currentUser = {
    fullName: 'John Doe',
    phoneNumber: '+1 (555) 123-4567',
    emailAddress: 'john.doe@webpot.com',
    referralCode: 'WP-JD-2024-A1B2C3',
    password: 'SecurePassword123'
};

let otpVerificationData = {};
let passwordResetAttempts = 0;

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    setupPasswordStrengthChecker();
});

// Load user data into form
function loadUserData() {
    document.getElementById('fullName').value = currentUser.fullName;
    document.getElementById('phoneNumber').value = currentUser.phoneNumber;
    document.getElementById('emailAddress').value = currentUser.emailAddress;
    document.getElementById('referralCodeDisplay').textContent = currentUser.referralCode;
    document.getElementById('recoveryEmail').value = currentUser.emailAddress;
    document.getElementById('recoveryPhone').value = currentUser.phoneNumber;
}

// Switch between settings tabs
function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.settings-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active class from all nav items
    document.querySelectorAll('.settings-nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Show selected tab
    const selectedTab = document.getElementById(tabName + '-tab');
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Add active class to clicked nav item
    event.target.closest('.settings-nav-item').classList.add('active');
}

// Edit account field
function editField(fieldId) {
    const field = document.getElementById(fieldId);
    const button = event.target;

    if (field.disabled) {
        field.disabled = false;
        button.textContent = 'Save';
        button.classList.add('saving');
        field.focus();
    } else {
        field.disabled = true;
        button.textContent = 'Edit';
        button.classList.remove('saving');
        
        // Update user data
        if (fieldId === 'fullName') {
            currentUser.fullName = field.value;
        } else if (fieldId === 'phoneNumber') {
            currentUser.phoneNumber = field.value;
        } else if (fieldId === 'emailAddress') {
            currentUser.emailAddress = field.value;
        }

        showNotification(`${fieldId.replace(/([A-Z])/g, ' $1').trim()} updated successfully!`, 'success');
    }
}

// Copy referral code to clipboard
function copyReferralCode() {
    const referralCode = document.getElementById('referralCodeDisplay').textContent;
    navigator.clipboard.writeText(referralCode).then(() => {
        showNotification('Referral code copied to clipboard!', 'success');
    }).catch(err => {
        showNotification('Failed to copy referral code', 'error');
    });
}

// Toggle password visibility
function togglePasswordVisibility(fieldId) {
    const field = document.getElementById(fieldId);
    const button = event.target.closest('.btn-icon');
    const icon = button.querySelector('i');

    if (field.type === 'password') {
        field.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        field.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Setup password strength checker
function setupPasswordStrengthChecker() {
    const newPasswordInput = document.getElementById('newPassword');
    const newPasswordResetInput = document.getElementById('newPasswordReset');

    if (newPasswordInput) {
        newPasswordInput.addEventListener('input', function() {
            updatePasswordStrength(this.value, 'strengthBar', 'strengthText');
        });
    }

    if (newPasswordResetInput) {
        newPasswordResetInput.addEventListener('input', function() {
            updatePasswordStrength(this.value, 'strengthBarReset', 'strengthTextReset');
        });
    }
}

// Update password strength indicator
function updatePasswordStrength(password, barId, textId) {
    const strengthBar = document.getElementById(barId);
    const strengthText = document.getElementById(textId);
    let strength = 0;
    let strengthLevel = 'Weak';
    let color = '#ef4444';

    // Check password length
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 10;

    // Check for uppercase letters
    if (/[A-Z]/.test(password)) strength += 15;

    // Check for lowercase letters
    if (/[a-z]/.test(password)) strength += 15;

    // Check for numbers
    if (/[0-9]/.test(password)) strength += 15;

    // Check for special characters
    if (/[!@#$%^&*]/.test(password)) strength += 20;

    // Determine strength level
    if (strength < 30) {
        strengthLevel = 'Weak';
        color = '#ef4444';
    } else if (strength < 60) {
        strengthLevel = 'Fair';
        color = '#f59e0b';
    } else if (strength < 80) {
        strengthLevel = 'Good';
        color = '#3b82f6';
    } else {
        strengthLevel = 'Strong';
        color = '#10b981';
    }

    // Update UI
    strengthBar.style.width = strength + '%';
    strengthBar.style.backgroundColor = color;
    strengthText.textContent = `Password strength: ${strengthLevel}`;
    strengthText.style.color = color;
}

// Change password
function changePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validation
    if (!currentPassword) {
        showNotification('Please enter your current password', 'error');
        return;
    }

    if (!newPassword) {
        showNotification('Please enter a new password', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match', 'error');
        return;
    }

    if (newPassword.length < 8) {
        showNotification('New password must be at least 8 characters long', 'error');
        return;
    }

    if (currentPassword !== currentUser.password) {
        showNotification('Current password is incorrect', 'error');
        return;
    }

    // Update password
    currentUser.password = newPassword;
    
    // Clear form
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';

    showNotification('Password changed successfully!', 'success');
}

// Open forgot password modal
function openForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    modal.style.display = 'block';
    resetForgotPasswordFlow();
}

// Close forgot password modal
function closeForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    modal.style.display = 'none';
}

// Reset forgot password flow
function resetForgotPasswordFlow() {
    document.getElementById('forgotPasswordStep1').style.display = 'block';
    document.getElementById('forgotPasswordStep2').style.display = 'none';
    document.getElementById('forgotPasswordStep3').style.display = 'none';
    document.getElementById('recoveryEmail').value = currentUser.emailAddress;
    document.getElementById('recoveryPhone').value = currentUser.phoneNumber;
}

// Send OTP
function sendOTP() {
    const email = document.getElementById('recoveryEmail').value;
    const phone = document.getElementById('recoveryPhone').value;

    if (!email) {
        showNotification('Please enter your email address', 'error');
        return;
    }

    if (!phone) {
        showNotification('Please enter your phone number', 'error');
        return;
    }

    // Simulate sending OTP
    showNotification('OTP sent to your email and phone number!', 'success');

    // Generate mock OTPs for demo purposes
    otpVerificationData.emailOTP = Math.random().toString().slice(2, 8);
    otpVerificationData.phoneOTP = Math.random().toString().slice(2, 8);

    console.log('Email OTP:', otpVerificationData.emailOTP);
    console.log('Phone OTP:', otpVerificationData.phoneOTP);

    // Move to step 2
    document.getElementById('forgotPasswordStep1').style.display = 'none';
    document.getElementById('forgotPasswordStep2').style.display = 'block';

    // Start OTP timer
    startOTPTimer();
}

// Start OTP timer
function startOTPTimer() {
    let timeLeft = 300; // 5 minutes
    const timerDisplay = document.getElementById('otpTimer');

    const timer = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        if (timeLeft <= 0) {
            clearInterval(timer);
            showNotification('OTP expired. Please request a new one.', 'error');
            resetForgotPasswordFlow();
        }
    }, 1000);
}

// Go back to step 1
function goBackStep1() {
    document.getElementById('forgotPasswordStep1').style.display = 'block';
    document.getElementById('forgotPasswordStep2').style.display = 'none';
    document.getElementById('otpEmail').value = '';
    document.getElementById('otpPhone').value = '';
}

// Verify OTP
function verifyOTP() {
    const otpEmail = document.getElementById('otpEmail').value;
    const otpPhone = document.getElementById('otpPhone').value;

    if (!otpEmail) {
        showNotification('Please enter OTP from email', 'error');
        return;
    }

    if (!otpPhone) {
        showNotification('Please enter OTP from phone', 'error');
        return;
    }

    if (otpEmail === otpVerificationData.emailOTP && otpPhone === otpVerificationData.phoneOTP) {
        showNotification('OTP verified successfully!', 'success');
        document.getElementById('forgotPasswordStep2').style.display = 'none';
        document.getElementById('forgotPasswordStep3').style.display = 'block';
    } else {
        passwordResetAttempts++;
        if (passwordResetAttempts >= 3) {
            showNotification('Too many failed attempts. Please try again later.', 'error');
            closeForgotPasswordModal();
            passwordResetAttempts = 0;
        } else {
            showNotification(`Invalid OTP. Attempts remaining: ${3 - passwordResetAttempts}`, 'error');
        }
    }
}

// Reset password (final step)
function resetPassword() {
    const newPassword = document.getElementById('newPasswordReset').value;
    const confirmPassword = document.getElementById('confirmPasswordReset').value;

    if (!newPassword) {
        showNotification('Please enter a new password', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }

    if (newPassword.length < 8) {
        showNotification('Password must be at least 8 characters long', 'error');
        return;
    }

    // Update password
    currentUser.password = newPassword;

    showNotification('Password reset successfully!', 'success');
    setTimeout(() => {
        closeForgotPasswordModal();
        resetForgotPasswordFlow();
    }, 1500);
}

// Show notifications
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background-color: ${type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#0284c7'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        z-index: 1001;
        animation: slideInNotification 0.3s ease-out;
        max-width: 300px;
        font-weight: 600;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutNotification 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('forgotPasswordModal');
    if (event.target == modal) {
        closeForgotPasswordModal();
    }
}

console.log('Settings page initialized successfully!');
