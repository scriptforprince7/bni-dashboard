document.addEventListener("DOMContentLoaded", () => {
    // Handle password visibility toggle
    const passwordField = document.getElementById('signin-password');
    const showPasswordButton = document.getElementById('showPasswordButton');

    // Add click event listener to the password toggle button
    showPasswordButton.addEventListener('click', () => {
        // Toggle the type of the password field between 'password' and 'text'
        const isPasswordVisible = passwordField.type === 'text';
        
        // Change the input type to 'text' if password is hidden, and 'password' if visible
        passwordField.type = isPasswordVisible ? 'password' : 'text';

        // Change the icon to show/hide accordingly
        const icon = showPasswordButton.querySelector('i');
        icon.classList.toggle('ri-eye-line', !isPasswordVisible); // Show eye
        icon.classList.toggle('ri-eye-off-line', isPasswordVisible); // Hide eye
    });

    // Form submission handler
    const handleSignIn = async (event) => {
        event.preventDefault(); // Prevent form reload
        const form = document.getElementById("signInForm");
        const submitButton = document.getElementById("signInButton");

        // Add loader and disable button
        submitButton.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        `;
        submitButton.disabled = true;

        // Collect form data
        const formData = new FormData(form); // Form data collection works here
        const payload = {
            username: formData.get("username"), // Correctly extract "username"
            password: formData.get("password"), // Correctly extract "password"
        };

        try {
            // Log payload for debugging
            console.log("Submitting payload:", payload);

            // Show loading state on the button
            submitButton.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Signing In...`;
            submitButton.disabled = true;

            // Perform POST request
            const response = await fetch("https://bni-data-backend.onrender.com/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload), // Use the correct payload
            });

            // Check if response is ok
            if (response.ok) {
                const result = await response.json(); // Parse JSON response
                console.log("Response data:", result);

                // Store the login data in localStorage
                localStorage.setItem("user", JSON.stringify(result.data)); // Store user data

                window.location.href = "/auth/otp-verification"; // Redirect after successful login
            } else {
                // Handle HTTP errors
                const errorData = await response.json();
                console.error("Login failed:", errorData);
                alert(errorData.message || "Login failed. Please check your credentials.", "Error", { timeOut: 3000 });
            }
        } catch (error) {
            // Handle unexpected errors
            console.error("An error occurred:", error);
            alert("An unexpected error occurred. Please try again.", "Error", { timeOut: 3000 });
        } finally {
            // Restore button state
            submitButton.innerHTML = "Sign In";
            submitButton.disabled = false;
        }
    };

    const form = document.getElementById("signInForm");
    if (form) {
        form.addEventListener("submit", handleSignIn);
    } else {
        console.error("Sign In form not found in the DOM.");
    }
});