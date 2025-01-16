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
        const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
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

            Swal.fire({
                icon: 'success',
                title: 'Login successful!',
                text: 'You are being redirected...',
                confirmButtonText: 'OK'
            }).then(() => {
                console.log('Determining redirect URL');
                // Use login_type from URL parameters instead of decoded token
                let redirectUrl = '/';
                if (login_type === 'ro_admin') {
                    redirectUrl = '/d/ro-dashboard';
                } else if (login_type === 'chapter') {
                    redirectUrl = '/d/chapter-dashboard';
                } else if (login_type === 'member') {
                    redirectUrl = '/d/member-dashboard';
                }
                console.log('Redirecting to:', redirectUrl, 'Login type:', login_type);
                window.location.href = redirectUrl;
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


