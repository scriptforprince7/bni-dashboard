// Extract email and login_type from query params
const urlParams = new URLSearchParams(window.location.search);
const email = urlParams.get('email');
const login_type = urlParams.get('login_type');

document.querySelector('.email b').textContent = email;

console.log(email);
console.log(login_type);

document.querySelectorAll('.otp-input').forEach((input, index, inputs) => {
  input.addEventListener('input', () => {
      if (input.value.length === 1 && index < inputs.length - 1) {
          inputs[index + 1].focus();
      }
  });
});

document.getElementById('otpVerificationForm').addEventListener('submit', async (e) => {
    console.log('OTP form submission started');
    e.preventDefault();

    const otpInputs = document.querySelectorAll('.otp-input');
    const otpCode = Array.from(otpInputs).map(input => input.value).join('');
    console.log('Collected OTP:', otpCode);

    if (otpCode.length !== 6) {
        console.log('Invalid OTP length');
        Swal.fire({
            icon: 'warning',
            title: 'Invalid OTP',
            text: 'Please enter a 6-digit OTP',
            confirmButtonText: 'OK'
        });
        return;
    }

    try {
        console.log('Preparing API request with data:', { email, otpCode, login_type });
        const response = await fetch('http://backend.bninewdelhi.com/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email, 
                otp: otpCode,
                login_type 
            }),
        });

        console.log('API Response received:', response.status);
        const result = await response.json();
        console.log('API Response data:', result);

        if (result.success) {
            console.log('OTP verification successful');
            console.log('Storing token in localStorage');
            localStorage.setItem('token', result.token);
            sessionStorage.setItem('newLogin', 'true');

            // Determine redirect URL first
            let redirectUrl = '/';
            if (login_type === 'ro_admin') {
                redirectUrl = '/d/ro-dashboard';
            } else if (login_type === 'chapter') {
                redirectUrl = '/d/chapter-dashboard';
            } else if (login_type === 'member') {
                redirectUrl = '/d/member-dashboard';
            }
            console.log('Redirect URL determined:', redirectUrl);

            // Set up auto-redirect timer
            const redirectTimer = setTimeout(() => {
                console.log('Auto-redirecting after 3 seconds');
                window.location.href = redirectUrl;
            }, 3000);

            Swal.fire({
                icon: 'success',
                title: 'Login successful!',
                text: 'You are being redirected...',
                confirmButtonText: 'OK',
                timer: 3000,
                timerProgressBar: true
            }).then((result) => {
                clearTimeout(redirectTimer); // Clear the timer if OK is clicked
                if (result.isConfirmed || result.isDismissed) {
                    console.log('Manual redirect triggered');
                    window.location.href = redirectUrl;
                }
            });
        } else {
            console.log('OTP verification failed:', result.message);
            Swal.fire({
                icon: 'error',
                title: 'OTP Verification Failed',
                text: result.message || 'OTP verification failed',
                confirmButtonText: 'OK'
            });
        }
    } catch (error) {
        console.error('Error in OTP verification:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred. Please try again.',
            confirmButtonText: 'OK'
        });
    }
});

function getDecodedToken() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
        // Decode the JWT token (this doesn't verify the signature)
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(window.atob(base64));
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
}

// Timer functionality
let timeLeft = 180; // 3 minutes in seconds
let timerId = null;

function startTimer() {
    console.log('Starting 3-minute timer for OTP resend');
    const resendLink = document.querySelector('.text-primary');
    resendLink.style.pointerEvents = 'none';
    resendLink.style.opacity = '0.5';

    // Update the text to show timer
    function updateTimer() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        resendLink.textContent = `Resend OTP in ${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft === 0) {
            console.log('Timer completed, enabling resend button');
            clearInterval(timerId);
            resendLink.textContent = 'Resend OTP';
            resendLink.style.pointerEvents = 'auto';
            resendLink.style.opacity = '1';
            timeLeft = 180; // Reset for next use
        } else {
            timeLeft--;
        }
    }

    // Initial call and start interval
    updateTimer();
    timerId = setInterval(updateTimer, 1000);
}

// Start timer when page loads
document.addEventListener('DOMContentLoaded', () => {
    startTimer();
});

// Handle resend OTP
document.querySelector('.text-primary').addEventListener('click', async (e) => {
    e.preventDefault();
    
    if (timeLeft !== 180) {
        console.log('Timer still running, cannot resend OTP yet');
        return;
    }

    try {
        console.log('Requesting OTP resend for email:', email, 'login_type:', login_type);
        const response = await fetch('http://backend.bninewdelhi.com/api/auth/login', {  // Using login endpoint as it handles OTP generation and sending
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email,
                login_type,
                resend: true  // Add flag to indicate this is a resend request
            })
        });

        const result = await response.json();
        console.log('Resend OTP response:', result);

        if (result.success) {
            console.log('New OTP sent successfully via email');
            Swal.fire({
                icon: 'success',
                title: 'OTP Resent',
                text: 'A new OTP has been sent to your email',
                confirmButtonText: 'OK'
            });
            timeLeft = 180; // Reset timer to 3 minutes
            startTimer(); // Restart the timer
        } else {
            console.log('OTP resend failed:', result.message);
            Swal.fire({
                icon: 'error',
                title: 'Failed to Resend OTP',
                text: result.message || 'Failed to resend OTP. Please try again.',
                confirmButtonText: 'OK'
            });
        }
    } catch (error) {
        console.error('Error in resending OTP:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred while resending OTP. Please try again.',
            confirmButtonText: 'OK'
        });
    }
});


