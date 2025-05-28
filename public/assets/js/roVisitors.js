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

// Function to populate chapter dropdown
async function populateChapterDropdown() {
    try {
        console.log('Fetching chapters...');
        const response = await fetch('http://localhost:5000/api/chapters');
        const chapters = await response.json();
        console.log('Fetched chapters:', chapters);

        const chapterSelect = document.getElementById('chapter_select');
        if (!chapterSelect) {
            throw new Error('Chapter select element not found');
        }

        // Clear existing options except the first one
        chapterSelect.innerHTML = '<option value="">Select Chapter</option>';

        // Add chapters to dropdown
        chapters.forEach(chapter => {
            const option = document.createElement('option');
            option.value = chapter.chapter_id;
            option.textContent = chapter.chapter_name;
            chapterSelect.appendChild(option);
        });

        // Add change event listener
        chapterSelect.addEventListener('change', handleChapterChange);

    } catch (error) {
        console.error('Error populating chapter dropdown:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Failed to load chapters. Please refresh the page.',
            confirmButtonText: 'OK'
        });
    }
}

// Function to handle chapter selection change
async function handleChapterChange(event) {
    const chapterId = event.target.value;
    const memberSelect = document.getElementById('member_name');
    
    // Reset member dropdown
    memberSelect.innerHTML = '<option value="">Select Member</option>';
    
    if (!chapterId) {
        memberSelect.disabled = true;
        return;
    }

    try {
        // Enable member dropdown
        memberSelect.disabled = false;

        // Fetch members
        const response = await fetch('http://localhost:5000/api/members');
        const members = await response.json();
        console.log('Fetched members:', members);

        // Filter members by selected chapter
        const chapterMembers = members.filter(member => member.chapter_id === parseInt(chapterId));
        console.log('Filtered chapter members:', chapterMembers);

        // Add filtered members to dropdown
        chapterMembers.forEach(member => {
            const option = document.createElement('option');
            option.value = member.member_id;
            option.textContent = `${member.member_first_name} ${member.member_last_name}`;
            memberSelect.appendChild(option);
        });

    } catch (error) {
        console.error('Error handling chapter change:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'Failed to load members for selected chapter.',
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

// Function to handle GST details
async function handleGstDetails() {
    console.log('🔍 Starting GST details fetch');
    const gstNo = document.getElementById('visitor_gst').value.trim();
    
    if (gstNo === "") {
        console.log('❌ Empty GST number provided');
        Swal.fire({
            icon: "warning",
            title: "Empty GST Number",
            text: "Please enter a valid GSTIN number.",
        });
        return;
    }

    try {
        console.log('📡 Fetching GST details for:', gstNo);
        const response = await fetch(`http://localhost:5000/einvoice/get-gst-details/${gstNo}`);
        const data = await response.json();
        console.log('📥 Received GST details:', data);

        if (data.success) {
            const details = data.extractedDetails;
            const formattedDetails = `
                <b>GSTIN:</b> ${details.gstin}<br><br>
                <b>Trade Name:</b> ${details.tradeName}<br><br>
                <b>Legal Name:</b> ${details.legalName}<br><br>
                <b>Address:</b> ${details.address}<br><br>
                <b>Taxpayer Type:</b> ${details.taxpayerType}<br><br>
                <b>Status:</b> ${details.status}<br><br>
                <b>Registration Date:</b> ${details.registrationDate}
            `;
            
            console.log('📋 Formatted GST details for display');
            
            Swal.fire({
                icon: "success",
                title: "<h4 style='font-size: 22px;'>GST Details Retrieved</h4>",
                html: `<div style="font-size: 14px; text-align: left;">${formattedDetails}</div>`,
                showCancelButton: true,
                confirmButtonText: 'Add Automatically',
                cancelButtonText: 'Add Manually'
            }).then((result) => {
                if (result.isConfirmed) {
                    console.log('✅ User chose to auto-fill details');
                    // Automatically populate fields
                    document.getElementById("visitor_company_name").value = details.tradeName;
                    document.getElementById("visitor_address").value = details.address;
                    
                    console.log('📝 Auto-filled details:', {
                        companyName: details.tradeName,
                        address: details.address
                    });
                } else {
                    console.log('ℹ️ User chose to add details manually');
                }
            });
        } else {
            console.log('❌ Failed to fetch GST details:', data.message);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: data.message || "Failed to fetch GST details.",
            });
        }
    } catch (error) {
        console.error('❌ Error fetching GST details:', error);
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "Something went wrong. Please try again later.",
        });
    }
}

// Modify initializePage function to add GST button handler
function initializePage() {
    console.log('🚀 Initializing page...');
    
    // Check if token exists
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('❌ No token found in localStorage');
        return;
    }

    // Get submit button
    const submitButton = document.getElementById('submit-event');
    if (submitButton) {
        console.log('✅ Found submit button, adding click listener');
        submitButton.addEventListener('click', handleSubmit);
    } else {
        console.error('❌ Submit button not found');
    }

    // Get form
    const form = document.getElementById('visitorForm');
    if (form) {
        console.log('✅ Found form, adding submit listener');
        form.addEventListener('submit', handleSubmit);
    } else {
        console.error('❌ Form not found');
    }

    // Add GST details button handler
    const gstButton = document.getElementById('getGstDetailsBtn');
    if (gstButton) {
        console.log('✅ Found GST button, adding click listener');
        gstButton.addEventListener('click', handleGstDetails);
    } else {
        console.error('❌ GST button not found');
    }

    // Populate chapter dropdown
    console.log('📋 Calling populateChapterDropdown');
    populateChapterDropdown();
}

// Wait for DOM to be fully loaded
console.log('Adding DOMContentLoaded event listener');
document.addEventListener('DOMContentLoaded', initializePage);
