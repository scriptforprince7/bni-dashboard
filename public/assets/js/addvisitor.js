// Function to get member details
async function getMemberDetails(email) {
    try {
        console.log('Fetching member details for email:', email);
        const response = await fetch('https://backend.bninewdelhi.com/api/members');
        const members = await response.json();
        console.log('All members fetched:', members);
        
        const member = members.find(member => member.member_email_address === email);
        console.log('Found member:', member);
        return member;
    } catch (error) {
        console.error('Error fetching member details:', error);
        return null;
    }
}

// Function to pre-fill member name
async function preFillMemberName() {
    try {
        console.log('Starting preFillMemberName function');
        const userEmail = getUserEmail();
        console.log('User email from token:', userEmail);

        if (!userEmail) {
            console.error('No user email found in token');
            throw new Error('User not authenticated');
        }

        const memberDetails = await getMemberDetails(userEmail);
        console.log('Member details retrieved:', memberDetails);

        if (!memberDetails) {
            console.error('No member details found for email:', userEmail);
            throw new Error('Member details not found');
        }

        // Combine first and last name
        const fullName = `${memberDetails.member_first_name} ${memberDetails.member_last_name}`.trim();
        console.log('Combined full name:', fullName);
        
        // Set the value in the input field
        const memberNameInput = document.getElementById('member_name');
        console.log('Member name input element:', memberNameInput);

        if (memberNameInput) {
            memberNameInput.value = fullName;
            console.log('Set member name input value to:', fullName);
        } else {
            console.error('Member name input element not found in DOM');
        }
    } catch (error) {
        console.error('Error in preFillMemberName:', error);
    }
}

// Function to validate form
function validateForm(formData) {
    const requiredFields = [
        'visitor_name',
        'visitor_email',
        'visitor_phone',
        'visitor_category',
        'visited_date'
    ];

    for (const field of requiredFields) {
        if (!formData[field]) {
            throw new Error(`${field.replace('_', ' ')} is required`);
        }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.visitor_email)) {
        throw new Error('Invalid email format');
    }

    // Validate phone number (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.visitor_phone)) {
        throw new Error('Phone number must be 10 digits');
    }

    // Validate category is not empty
    if (!formData.visitor_category.trim()) {
        throw new Error('Visitor category is required');
    }
}

// Function to handle form submission
async function handleSubmit(event) {
    event.preventDefault();

    try {
        // Get user email from tokenUtils
        const userEmail = getUserEmail();
        console.log('User email in handleSubmit:', userEmail);
        
        if (!userEmail) {
            throw new Error('User not authenticated');
        }

        // Get member details
        const memberDetails = await getMemberDetails(userEmail);
        console.log('Member details in handleSubmit:', memberDetails);
        
        if (!memberDetails) {
            throw new Error('Member details not found');
        }

        // Get form data
        const formData = {
            member_name: document.getElementById('member_name').value,
            visitor_name: document.getElementById('visitor_name').value,
            visitor_email: document.getElementById('visitor_email').value,
            visitor_phone: document.getElementById('visitor_phone').value,
            visitor_company_name: document.getElementById('visitor_company_name').value,
            visitor_address: document.getElementById('visitor_address').value,
            visitor_gst: document.getElementById('visitor_gst').value,
            visitor_business: document.getElementById('visitor_business').value,
            visitor_category: document.getElementById('visitor_category').value,
            visited_date: document.getElementById('visited_date').value,
            // Add required fields for controller
            member_id: memberDetails.member_id,
            chapter_id: memberDetails.chapter_id,
            region_id: memberDetails.region_id
        };

        console.log('Form data being submitted:', formData);

        // Validate form data
        validateForm(formData);

        // Show loading state
        const submitButton = document.getElementById('submit-event');
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Adding...';

        // Send data to backend
        const response = await fetch('https://backend.bninewdelhi.com/api/addVisitor', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        console.log('Server response:', result);

        if (!response.ok) {
            throw new Error(result.message || 'Failed to add visitor');
        }

        // Show success message
        await Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Visitor added successfully',
            confirmButtonText: 'OK'
        });

        // Reset individual fields
        document.getElementById('visitor_name').value = '';
        document.getElementById('visitor_email').value = '';
        document.getElementById('visitor_phone').value = '';
        document.getElementById('visitor_company_name').value = '';
        document.getElementById('visitor_address').value = '';
        document.getElementById('visitor_gst').value = '';
        document.getElementById('visitor_business').value = '';
        document.getElementById('visitor_category').value = '';
        document.getElementById('visited_date').value = '';

    } catch (error) {
        console.error('Error in handleSubmit:', error);
        // Show error message
        await Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: error.message || 'Failed to add visitor',
            confirmButtonText: 'OK'
        });
    } finally {
        // Reset button state
        const submitButton = document.getElementById('submit-event');
        submitButton.disabled = false;
        submitButton.innerHTML = 'Add visitor<i class="bi bi-plus-lg ms-2"></i>';
    }
}

// Initialize the page
function initializePage() {
    console.log('Initializing page...');
    
    // Check if token exists
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No token found in localStorage');
        return;
    }

    // Get submit button
    const submitButton = document.getElementById('submit-event');
    if (submitButton) {
        console.log('Found submit button, adding click listener');
        submitButton.addEventListener('click', handleSubmit);
    } else {
        console.error('Submit button not found');
    }

    // Get form
    const form = document.querySelector('form');
    if (form) {
        console.log('Found form, adding submit listener');
        form.addEventListener('submit', handleSubmit);
    } else {
        console.error('Form not found');
    }

    // Pre-fill member name
    console.log('Calling preFillMemberName');
    preFillMemberName();
}

// Wait for DOM to be fully loaded
console.log('Adding DOMContentLoaded event listener');
document.addEventListener('DOMContentLoaded', initializePage);
