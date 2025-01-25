document.addEventListener('DOMContentLoaded', function() {
    Swal.fire({
        title: 'Login Required',
        html: `
            <div class="login-form">
                <div class="mb-3">
                    <label for="email" class="form-label">Email</label>
                    <input type="text" 
                           id="email" 
                           class="form-control" 
                           placeholder="Email"
                           value="nmpiprojects@gmail.com"
                           required>
                </div>
                <div class="mb-3">
                    <label for="password" class="form-label">Password</label>
                    <div class="input-group">
                        <input type="password" 
                               id="password" 
                               class="form-control" 
                               placeholder="Password"
                               value="@Bni9708"
                               required>
                        <span class="input-group-text" id="togglePassword" style="cursor: pointer; height: 38px;">
                            <span id="eyeIcon" style="font-size: 1.2em; line-height: 1;">👁️</span>
                        </span>
                    </div>
                </div>
            </div>`,
        showCloseButton: true,
        showCancelButton: false,
        confirmButtonText: 'Login',
        allowOutsideClick: false,
        allowEscapeKey: false,
        customClass: {
            popup: 'custom-popup-class',
            confirmButton: 'btn btn-primary',
            closeButton: 'small-close-button'
        },
        preConfirm: async () => {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            console.log('Email:', email);
            console.log('Password:', password);

            if (!email || !password) {
                Swal.showValidationMessage('Please enter both email and password');
                return false;
            }

            console.log('Attempting to log in with:', { email, password });

            // API login request
            try {
                const formData = new FormData();
                formData.append('email', email);
                formData.append('password', password);

                const response = await fetch('https://nmpinfotech.com/api/login', {
                    method: 'POST',
                    headers: {
                        'apiKey': 'RU5vkjPJBy1mKO9KjDRBtmaysPmBmVCTvf2zKS3v'
                    },
                    body: formData
                });

                const data = await response.json();
                const metaToken = data.token;
                console.log('API Response:', data);
           
                if (response.ok) {
                    // Store token and apiKey in localStorage
                    const metaToken = data.token;
                    console.log(metaToken);
                    localStorage.setItem('metatoken',data.data.token);
                    localStorage.setItem('apiKey', 'RU5vkjPJBy1mKO9KjDRBtmaysPmBmVCTvf2zKS3v');
                    console.log('Login successful! Token and API key stored in localStorage.');
                    return { email, password };
                } else {
                    console.error('Login failed:', data.message);
                    Swal.showValidationMessage(data.message || 'Login failed');
                    return false;
                }
            } catch (error) {
                console.error('Error during login:', error);
                Swal.showValidationMessage('An error occurred during login');
                return false;
            }
        }
    });

    // Toggle password visibility
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');

    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        eyeIcon.textContent = type === 'password' ? '👁️' : '🙈'; // Change icon based on visibility
    });
});

// Fetch templates from the API and populate the dropdown
async function fetchTemplates() {
    try {
        const apiKey = 'RU5vkjPJBy1mKO9KjDRBtmaysPmBmVCTvf2zKS3v'; // Your API key
        const metaToken = localStorage.getItem('metatoken'); // Get the bearer token from localStorage

        const response = await fetch('https://nmpinfotech.com/api/whatsapp-template', {
            method: 'GET',
            headers: {
                'apiKey': apiKey, // Include your API key
                'Authorization': `Bearer ${metaToken}` // Include the bearer token
            }
        });

        const data = await response.json();

        if (data.success) {
            const templatesDropdown = document.getElementById('templates');
            data.data.template.forEach(template => {
                const option = document.createElement('option');
                option.value = template.id; // Set the value to the template ID
                option.textContent = template.name; // Set the display text to the template name
                if (templatesDropdown) {
                    templatesDropdown.appendChild(option);
                } else {
                    console.error('Dropdown element not found');
                }
            });
        } else {
            console.error('Failed to fetch templates:', data.message);
        }
    } catch (error) {
        console.error('Error fetching templates:', error);
    }
}

// Fetch contacts from the API and populate the dropdown
async function fetchContacts() {
    try {
        const apiKey = 'RU5vkjPJBy1mKO9KjDRBtmaysPmBmVCTvf2zKS3v'; // Your API key
        const metaToken = localStorage.getItem('metatoken'); // Get the bearer token from localStorage

        const response = await fetch('https://nmpinfotech.com/api/whatsapp-contact-list', {
            method: 'GET',
            headers: {
                'apiKey': apiKey, // Include your API key
                'Authorization': `Bearer ${metaToken}` // Include the bearer token
            }
        });

        const data = await response.json();

        if (data.status === "success") {
            const contactsDropdown = document.getElementById('contact_list');
            data.data.contacts.forEach(contact => {
                const option = document.createElement('option');
                option.value = contact.contact.id; // Set the value to the contact ID
                option.textContent = contact.contact.name; // Set the display text to the contact name
                if (contactsDropdown) {
                    contactsDropdown.appendChild(option);
                } else {
                    console.error('Dropdown element not found');
                }
            });
        } else {
            console.error('Failed to fetch contacts:', data.message);
        }
    } catch (error) {
        console.error('Error fetching contacts:', error);
    }
}

// Fetch segments from the API and populate the dropdown
async function fetchSegments() {
    try {
        const apiKey = 'RU5vkjPJBy1mKO9KjDRBtmaysPmBmVCTvf2zKS3v'; // Your API key
        const metaToken = localStorage.getItem('metatoken'); // Get the bearer token from localStorage

        const response = await fetch('https://nmpinfotech.com/api/whatsapp-segment', {
            method: 'GET',
            headers: {
                'apiKey': apiKey, // Include your API key
                'Authorization': `Bearer ${metaToken}` // Include the bearer token
            }
        });

        const data = await response.json();

        if (data.success) {
            const segmentsDropdown = document.getElementById('segment');
            data.data.segment.forEach(segment => {
                const option = document.createElement('option');
                option.value = segment.id; // Set the value to the segment ID
                option.textContent = segment.title; // Set the display text to the segment title
                if (segmentsDropdown) {
                    segmentsDropdown.appendChild(option);
                } else {
                    console.error('Dropdown element not found');
                }
            });
        } else {
            console.error('Failed to fetch segments:', data.message);
        }
    } catch (error) {
        console.error('Error fetching segments:', error);
    }
}

// Call the functions to fetch templates, contacts, and segments when the page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchTemplates();
    fetchContacts();
    fetchSegments();
});

// Function to handle the send button click
async function handleSendButtonClick(event) {
    event.preventDefault(); // Prevent the default form submission

    // Retrieve values from the input fields and dropdowns
    const campaignName = document.getElementById('campaign_name').value;
    const campaignType = document.getElementById('campaign_type').value; // This will be "WhatsApp"
    const templateId = document.getElementById('templates').value; // Get selected template ID
    const contactListId = document.getElementById('contact_list').value; // Get selected contact list ID
    const segmentId = document.getElementById('segment').value; // Get selected segment ID
    const scheduleTime = document.getElementById('schedule_time').value; // Get schedule time

    // Construct the payload
    const payload = {
        campaign_name: campaignName,
        campaign_type: campaignType,
        template_id: templateId,
        contact_list_id: contactListId,
        segment_id: segmentId,
        schedule_time: scheduleTime
    };

    // Log the form data for debugging
    console.log('Form Data:', payload);

    // Retrieve API key and meta token from localStorage
    const apiKey = localStorage.getItem('apiKey');
    const metaToken = localStorage.getItem('metatoken');

    // Make the API request
    try {
        const response = await fetch('https://nmpinfotech.com/api/whatsapp-campaign-store', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Set content type to JSON
                'apiKey': apiKey,
                'Authorization': `Bearer ${metaToken}`
            },
            body: JSON.stringify(payload) // Convert payload to JSON string
        });

        const data = await response.json();
        console.log('API Response:', data); // Log the API response

        if (response.ok) {
            console.log('Campaign created successfully:', data.message);

            // Clear the form fields after success
            document.getElementById('campaign_name').value = '';
            document.getElementById('campaign_type').value = '';
            document.getElementById('templates').value = '';
            document.getElementById('contact_list').value = '';
            document.getElementById('segment').value = '';
            document.getElementById('schedule_time').value = '';
            
            Swal.fire({
                icon: 'success',
                title: 'Campaign Created',
                text: 'Your campaign has been successfully created!',
                confirmButtonText: 'OK'
            });
        } else {
            console.error('Failed to create campaign:', data.message);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to create campaign. Please try again.',
                confirmButtonText: 'OK'
            });
        }
    } catch (error) {
        console.error('Error during API request:', error);
    }
}

// Add event listener to the send button
document.getElementById('sendButton').addEventListener('click', handleSendButtonClick);
