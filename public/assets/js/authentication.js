// Function to show the loader
function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

// Function to hide the loader
function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

// Function to handle login type change
function handleLoginTypeChange() {
    showLoader(); // Show loader on login type change

    setTimeout(() => {
        const loginType = document.getElementById('login-type').value;
        const passwordField = document.getElementById('password-field');
        const passwordInput = document.getElementById('signin-password');

        if (loginType === 'chapter' || loginType === 'member') {
            passwordField.style.display = 'none';
            passwordInput.removeAttribute('required');
        } else {
            passwordField.style.display = 'block';
            passwordInput.setAttribute('required', 'required');
        }

        hideLoader(); // Hide loader after updating UI
    }, 500); // Simulate a short delay
}

// Form submit event listener
document.getElementById('signInForm').addEventListener('submit', async function (e) {
    e.preventDefault(); 

    const loginType = document.getElementById('login-type').value;
    const email = document.getElementById('signin-email').value.trim();
    const password = document.getElementById('signin-password').value.trim();
    const signInButton = document.getElementById('signInButton');

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        Swal.fire({
            icon: 'error',
            title: 'Invalid Email',
            text: 'Please enter a valid email address',
            confirmButtonText: 'OK'
        });
        return;
    }
    

    // Prepare request payload
    const payload = { login_type: loginType, email };
    if (loginType === 'ro_admin') {
        if (!password) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Password',
                text: 'Password is required for RO Admin login',
                confirmButtonText: 'OK'
            });
            return;
        }
        
        payload.password = password;
    }

    // Show loader
    signInButton.disabled = true;
    showLoader();

    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        hideLoader();
        signInButton.disabled = false;

        if (response.ok && result.success) {
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'Please Verify OTP sent on email!',
                confirmButtonText: 'OK'
            }).then(() => {
                window.location.href = `/auth/otp-verification?email=${encodeURIComponent(email)}&login_type=${encodeURIComponent(loginType)}`;
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'OTP Sending Failed',
                text: result.message || 'Error sending OTP',
                confirmButtonText: 'OK'
            });
        }
        
        
    } catch (error) {
        hideLoader();
        signInButton.disabled = false;
        Swal.fire({
            icon: 'error',
            title: 'Login Failed',
            text: 'An error occurred during login. Please try again.',
            confirmButtonText: 'OK'
        });
    }
    
});
