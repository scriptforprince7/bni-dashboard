// Function to get member details
async function getMemberDetails(email) {
    try {
        console.log('Fetching member details for email:', email);
        const response = await fetch('http://localhost:5000/api/members');
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

// Function to get chapter ID from email
async function getChapterIdFromEmail(email) {
    try {
        console.log('Fetching chapter ID for email:', email);
        const loginType = getUserLoginType();
        console.log('Login type:', loginType);

        // For RO admin, get chapter details from localStorage
        if (loginType === 'ro_admin') {
            const currentChapterId = localStorage.getItem('current_chapter_id');
            const currentChapterEmail = localStorage.getItem('current_chapter_email');
            console.log('RO Admin - Current chapter ID:', currentChapterId);
            console.log('RO Admin - Current chapter email:', currentChapterEmail);
            
            if (currentChapterId && currentChapterEmail) {
                return parseInt(currentChapterId);
            }
        }

        // For chapter login or if RO admin doesn't have chapter selected
        const response = await fetch('http://localhost:5000/api/chapters');
        const chapters = await response.json();
        console.log('Fetched chapters:', chapters);
        
        const chapter = chapters.find(chapter => {
            console.log('Comparing:', chapter.email_id, 'with', email);
            return chapter.email_id === email;
        });
        
        console.log('Found chapter:', chapter);
        return chapter ? chapter.chapter_id : null;
    } catch (error) {
        console.error('Error fetching chapter ID:', error);
        return null;
    }
}

// Function to populate member dropdown
async function populateMemberDropdown() {
    try {
        const userEmail = getUserEmail();
        console.log('User email:', userEmail);
        
        if (!userEmail) {
            throw new Error('User not authenticated');
        }

        // Get chapter ID
        const chapterId = await getChapterIdFromEmail(userEmail);
        console.log('Chapter ID:', chapterId);
        
        if (!chapterId) {
            const loginType = getUserLoginType();
            if (loginType === 'ro_admin') {
                throw new Error('Please select a chapter first');
            } else {
                throw new Error('Chapter ID not found for email: ' + userEmail);
            }
        }

        // Fetch all members
        const response = await fetch('http://localhost:5000/api/members');
        const members = await response.json();
        console.log('Fetched members:', members);

        // Filter members by chapter_id
        const chapterMembers = members.filter(member => member.chapter_id === chapterId);
        console.log('Filtered chapter members:', chapterMembers);

        // Get the select element
        const memberSelect = document.getElementById('member_name');
        if (!memberSelect) {
            throw new Error('Member select element not found');
        }
        
        // Clear existing options except the first one
        memberSelect.innerHTML = '<option value="">Select Member</option>';

        // Add members to dropdown
        chapterMembers.forEach(member => {
            const option = document.createElement('option');
            option.value = member.member_id;
            option.textContent = `${member.member_first_name} ${member.member_last_name}`;
            memberSelect.appendChild(option);
        });

    } catch (error) {
        console.error('Error populating member dropdown:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: error.message || 'Failed to load members. Please refresh the page.',
            confirmButtonText: 'OK'
        });
    }
}

// Function to get member details by ID
async function getMemberDetailsById(memberId) {
    try {
        const response = await fetch('http://localhost:5000/api/members');
        const members = await response.json();
        return members.find(member => member.member_id === memberId);
    } catch (error) {
        console.error('Error fetching member details:', error);
        return null;
    }
}

// Function to handle form submission
async function handleSubmit(event) {
    event.preventDefault();
    console.log('Form submitted');

    try {
        // Get selected member ID
        const memberId = document.getElementById('member_name').value;
        console.log('Selected member ID:', memberId);
        
        if (!memberId) {
            throw new Error('Please select a member');
        }

        // Get member details
        const memberDetails = await getMemberDetailsById(parseInt(memberId));
        console.log('Member details:', memberDetails);
        
        if (!memberDetails) {
            throw new Error('Selected member details not found');
        }

        // Get form data
        const formData = {
            member_name: document.getElementById('member_name').options[document.getElementById('member_name').selectedIndex].text,
            visitor_name: document.getElementById('visitor_name').value,
            visitor_email: document.getElementById('visitor_email').value,
            visitor_phone: document.getElementById('visitor_phone').value,
            visitor_company_name: document.getElementById('visitor_company_name').value,
            visitor_address: document.getElementById('visitor_address').value,
            visitor_gst: document.getElementById('visitor_gst').value,
            visitor_business: document.getElementById('visitor_business').value,
            visitor_category: document.getElementById('visitor_category').value,
            visited_date: document.getElementById('visited_date').value,
            member_id: memberDetails.member_id,
            chapter_id: memberDetails.chapter_id,
            region_id: memberDetails.region_id
        };

        console.log('Form data:', formData);

        // Validate form data
        validateForm(formData);

        // Show loading state
        const submitButton = document.getElementById('submit-event');
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Adding...';

        // Send data to backend
        const response = await fetch('http://localhost:5000/api/addVisitor', {
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

// Modify initializePage function
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
    const form = document.getElementById('visitorForm');
    if (form) {
        console.log('Found form, adding submit listener');
        form.addEventListener('submit', handleSubmit);
    } else {
        console.error('Form not found');
    }

    // Populate member dropdown
    console.log('Calling populateMemberDropdown');
    populateMemberDropdown();
}

// Wait for DOM to be fully loaded
console.log('Adding DOMContentLoaded event listener');
document.addEventListener('DOMContentLoaded', initializePage);
