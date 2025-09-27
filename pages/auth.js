// Authentication JavaScript

// Global variables
let currentTab = 'login';
let isLoading = false;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    if (window.currentUser) {
        // Redirect to dashboard or home page
        window.location.href = '../index.html';
        return;
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Set default tab
    switchTab('login');
});

// Set up event listeners
function setupEventListeners() {
    // Password strength checker for signup
    const signupPassword = document.getElementById('signupPassword');
    if (signupPassword) {
        signupPassword.addEventListener('input', checkPasswordStrength);
    }
    
    // Confirm password validation
    const confirmPassword = document.getElementById('confirmPassword');
    if (confirmPassword) {
        confirmPassword.addEventListener('input', validatePasswordMatch);
    }
    
    // Form validation
    const forms = document.querySelectorAll('.auth-form');
    forms.forEach(form => {
        form.addEventListener('input', validateForm);
    });
}

// Switch between login and signup tabs
function switchTab(tab) {
    currentTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.auth-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(tab + 'Tab').classList.add('active');
    
    // Show/hide forms
    document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('signupForm').style.display = tab === 'signup' ? 'block' : 'none';
    
    // Clear forms
    clearForms();
}

// Clear all form inputs
function clearForms() {
    const inputs = document.querySelectorAll('.auth-form input, .auth-form select');
    inputs.forEach(input => {
        input.value = '';
        input.classList.remove('error', 'success');
    });
    
    // Clear error messages
    document.querySelectorAll('.error-message, .success-message').forEach(msg => {
        msg.remove();
    });
    
    // Reset password strength
    const passwordStrength = document.getElementById('passwordStrength');
    if (passwordStrength) {
        passwordStrength.className = 'password-strength';
    }
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    if (isLoading) return;
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    // Validate inputs
    if (!validateEmail(email)) {
        showFieldError('loginEmail', 'Please enter a valid email address');
        return;
    }
    
    if (password.length < 6) {
        showFieldError('loginPassword', 'Password must be at least 6 characters');
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    
    try {
        const result = await window.authFunctions.signIn(email, password);
        
        if (result.success) {
            window.utils.showNotification('Login successful! Welcome back!', 'success');
            
            // Redirect to home page after a short delay
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1500);
        } else {
            showFieldError('loginPassword', result.error);
        }
    } catch (error) {
        console.error('Login error:', error);
        window.utils.showNotification('Login failed. Please try again.', 'error');
    } finally {
        setLoadingState(false);
    }
}

// Handle signup form submission
async function handleSignup(event) {
    event.preventDefault();
    
    if (isLoading) return;
    
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const studentId = document.getElementById('studentId').value.trim();
    const department = document.getElementById('department').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;
    
    // Validate inputs
    if (!validateName(name)) {
        showFieldError('signupName', 'Please enter your full name');
        return;
    }
    
    if (!validateEmail(email)) {
        showFieldError('signupEmail', 'Please enter a valid email address');
        return;
    }
    
    if (!validatePassword(password)) {
        showFieldError('signupPassword', 'Password must be at least 8 characters with uppercase, lowercase, and number');
        return;
    }
    
    if (password !== confirmPassword) {
        showFieldError('confirmPassword', 'Passwords do not match');
        return;
    }
    
    if (!agreeTerms) {
        window.utils.showNotification('Please agree to the Terms of Service and Privacy Policy', 'warning');
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    
    try {
        const result = await window.authFunctions.signUp(email, password, name);
        
        if (result.success) {
            // Save additional user information
            if (studentId || department) {
                await window.dbFunctions.addDocument('userProfiles', {
                    studentId: studentId,
                    department: department,
                    displayName: name
                });
            }
            
            window.utils.showNotification('Account created successfully! Welcome to Nitra Mitra!', 'success');
            
            // Redirect to home page after a short delay
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1500);
        } else {
            showFieldError('signupEmail', result.error);
        }
    } catch (error) {
        console.error('Signup error:', error);
        window.utils.showNotification('Signup failed. Please try again.', 'error');
    } finally {
        setLoadingState(false);
    }
}

// Handle Google login
async function handleGoogleLogin() {
    if (isLoading) return;
    
    setLoadingState(true);
    
    try {
        const result = await window.authFunctions.signInWithGoogle();
        
        if (result.success) {
            window.utils.showNotification('Login successful! Welcome back!', 'success');
            
            // Redirect to home page after a short delay
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1500);
        } else {
            window.utils.showNotification(result.error, 'error');
        }
    } catch (error) {
        console.error('Google login error:', error);
        window.utils.showNotification('Google login failed. Please try again.', 'error');
    } finally {
        setLoadingState(false);
    }
}

// Handle Google signup (same as login for Google)
async function handleGoogleSignup() {
    await handleGoogleLogin();
}

// Handle forgot password
async function handleForgotPassword(event) {
    event.preventDefault();
    
    const email = document.getElementById('resetEmail').value.trim();
    
    if (!validateEmail(email)) {
        window.utils.showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    try {
        const result = await window.authFunctions.resetPassword(email);
        
        if (result.success) {
            window.utils.showNotification('Password reset email sent! Check your inbox.', 'success');
            
            // Close modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('forgotPasswordModal'));
            modal.hide();
            
            // Clear form
            document.getElementById('resetEmail').value = '';
        } else {
            window.utils.showNotification(result.error, 'error');
        }
    } catch (error) {
        console.error('Password reset error:', error);
        window.utils.showNotification('Failed to send reset email. Please try again.', 'error');
    }
}

// Show forgot password modal
function showForgotPassword() {
    const modal = new bootstrap.Modal(document.getElementById('forgotPasswordModal'));
    modal.show();
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Check password strength
function checkPasswordStrength() {
    const password = document.getElementById('signupPassword').value;
    const strengthIndicator = document.getElementById('passwordStrength');
    
    if (!strengthIndicator) return;
    
    let strength = 0;
    let feedback = '';
    
    // Length check
    if (password.length >= 8) strength++;
    else feedback += 'At least 8 characters. ';
    
    // Uppercase check
    if (/[A-Z]/.test(password)) strength++;
    else feedback += 'One uppercase letter. ';
    
    // Lowercase check
    if (/[a-z]/.test(password)) strength++;
    else feedback += 'One lowercase letter. ';
    
    // Number check
    if (/\d/.test(password)) strength++;
    else feedback += 'One number. ';
    
    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    else feedback += 'One special character. ';
    
    // Update strength indicator
    strengthIndicator.className = 'password-strength';
    
    if (password.length > 0) {
        if (strength < 2) {
            strengthIndicator.classList.add('weak');
        } else if (strength < 3) {
            strengthIndicator.classList.add('fair');
        } else if (strength < 4) {
            strengthIndicator.classList.add('good');
        } else {
            strengthIndicator.classList.add('strong');
        }
    }
    
    // Show feedback
    let feedbackElement = document.getElementById('passwordFeedback');
    if (!feedbackElement) {
        feedbackElement = document.createElement('div');
        feedbackElement.id = 'passwordFeedback';
        feedbackElement.className = 'password-feedback';
        strengthIndicator.parentNode.appendChild(feedbackElement);
    }
    
    if (password.length > 0 && strength < 4) {
        feedbackElement.textContent = 'Password should contain: ' + feedback;
        feedbackElement.className = 'password-feedback text-muted small';
    } else if (password.length > 0 && strength >= 4) {
        feedbackElement.textContent = 'Strong password!';
        feedbackElement.className = 'password-feedback text-success small';
    } else {
        feedbackElement.textContent = '';
    }
}

// Validate password match
function validatePasswordMatch() {
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (confirmPassword.length > 0) {
        if (password === confirmPassword) {
            showFieldSuccess('confirmPassword', 'Passwords match');
        } else {
            showFieldError('confirmPassword', 'Passwords do not match');
        }
    }
}

// Validate form inputs
function validateForm(event) {
    const input = event.target;
    const value = input.value.trim();
    
    // Remove existing error/success states
    input.classList.remove('error', 'success');
    removeFieldMessage(input.id);
    
    // Validate based on input type
    if (input.type === 'email' && value.length > 0) {
        if (validateEmail(value)) {
            showFieldSuccess(input.id, 'Valid email address');
        } else {
            showFieldError(input.id, 'Please enter a valid email address');
        }
    } else if (input.id === 'signupName' && value.length > 0) {
        if (validateName(value)) {
            showFieldSuccess(input.id, 'Valid name');
        } else {
            showFieldError(input.id, 'Please enter your full name');
        }
    }
}

// Validation functions
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateName(name) {
    return name.length >= 2 && /^[a-zA-Z\s]+$/.test(name);
}

function validatePassword(password) {
    return password.length >= 8 && 
           /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && 
           /\d/.test(password);
}

// Show field error
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    field.classList.add('error');
    field.classList.remove('success');
    
    removeFieldMessage(fieldId);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    
    field.parentNode.appendChild(errorDiv);
}

// Show field success
function showFieldSuccess(fieldId, message) {
    const field = document.getElementById(fieldId);
    field.classList.add('success');
    field.classList.remove('error');
    
    removeFieldMessage(fieldId);
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    
    field.parentNode.appendChild(successDiv);
}

// Remove field message
function removeFieldMessage(fieldId) {
    const field = document.getElementById(fieldId);
    const existingMessage = field.parentNode.querySelector('.error-message, .success-message');
    if (existingMessage) {
        existingMessage.remove();
    }
}

// Set loading state
function setLoadingState(loading) {
    isLoading = loading;
    
    const loadingState = document.getElementById('loadingState');
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    
    if (loading) {
        loadingState.style.display = 'block';
        loginForm.style.display = 'none';
        signupForm.style.display = 'none';
        
        if (loginBtn) loginBtn.disabled = true;
        if (signupBtn) signupBtn.disabled = true;
    } else {
        loadingState.style.display = 'none';
        
        if (currentTab === 'login') {
            loginForm.style.display = 'block';
        } else {
            signupForm.style.display = 'block';
        }
        
        if (loginBtn) loginBtn.disabled = false;
        if (signupBtn) signupBtn.disabled = false;
    }
}

// Handle back button
function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = '../index.html';
    }
}

// Handle Enter key in forms
document.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.closest('.auth-form')) {
            event.preventDefault();
            
            if (currentTab === 'login') {
                handleLogin(event);
            } else {
                handleSignup(event);
            }
        }
    }
});

// Auto-focus first input when switching tabs
function switchTab(tab) {
    currentTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.auth-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(tab + 'Tab').classList.add('active');
    
    // Show/hide forms
    document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('signupForm').style.display = tab === 'signup' ? 'block' : 'none';
    
    // Clear forms
    clearForms();
    
    // Focus first input
    setTimeout(() => {
        const firstInput = document.querySelector(`#${tab}Form input:not([type="hidden"])`);
        if (firstInput) {
            firstInput.focus();
        }
    }, 100);
}

// Handle page visibility change
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // Page is hidden, pause any ongoing processes
        console.log('Page hidden');
    } else {
        // Page is visible, resume processes
        console.log('Page visible');
    }
});

// Handle online/offline status
window.addEventListener('online', function() {
    window.utils.showNotification('Connection restored!', 'success');
});

window.addEventListener('offline', function() {
    window.utils.showNotification('You are offline. Some features may not work.', 'warning');
});

// Prevent form submission on Enter in non-submit inputs
document.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.type === 'text' && !activeElement.closest('form')) {
            event.preventDefault();
        }
    }
});

// Add CSS for password feedback
const style = document.createElement('style');
style.textContent = `
    .password-feedback {
        margin-top: 0.5rem;
        font-size: 0.875rem;
        line-height: 1.4;
    }
    
    .password-feedback.text-muted {
        color: #6c757d !important;
    }
    
    .password-feedback.text-success {
        color: #28a745 !important;
    }
`;
document.head.appendChild(style);

console.log('Authentication page loaded successfully!');
