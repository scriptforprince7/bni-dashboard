// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded, initializing chapter settings...');
    // Fetch and populate chapter data
    fetchChapterData();
    
    // Add event listeners for social media inputs
    setupSocialMediaInputs();
});

async function fetchChapterData() {
    console.log('Starting fetchChapterData function...');
    try {
        // Step 1: Try getting email from token first
        let userEmail = getUserEmail();
        let userType = getUserLoginType();
        console.log('Initial check from token:', {
            userEmail: userEmail,
            userType: userType
        });

        // Step 2: If no data found and user is ro_admin, try localStorage
        if (!userEmail || userType === 'ro_admin') {
            userEmail = localStorage.getItem('current_chapter_email');
            console.log('Retrieved from localStorage for ro_admin:', userEmail);
        }

        if (!userEmail) {
            console.error('No email found from any source');
            toastr.error('User email not found. Please login again.');
            return;
        }

        console.log('Using email for fetch:', userEmail);

        // Fetch chapters data
        console.log('Attempting to fetch chapters data from API...');
        const response = await fetch('http://backend.bninewdelhi.com/api/chapters');
        const chapters = await response.json();
        console.log('Received chapters data:', chapters);

        // Find the chapter matching the user's email
        const userChapter = chapters.find(chapter =>
            chapter.email_id === userEmail ||
            chapter.vice_president_mail === userEmail ||
            chapter.president_mail === userEmail ||
            chapter.treasurer_mail === userEmail
        );
        
        console.log('Found user chapter:', userChapter);
        
        
        if (!userChapter) {
            console.error('No chapter found matching email:', userEmail);
            toastr.error('Chapter information not found.');
            return;
        }

        // Populate the form fields
        console.log('Starting to populate form fields...');
        populateChapterInfo(userChapter);
        populateSocialLinks(userChapter);
        populateChapterLogo(userChapter);
        console.log('Form fields population completed');

    } catch (error) {
        console.error('Error in fetchChapterData:', error);
        toastr.error('Failed to load chapter information.');
    }
}

function populateChapterInfo(chapter) {
    console.log('Starting populateChapterInfo with chapter data:', chapter);

    try {
        // Populate contact information
        const phoneInput = document.getElementById('phone-number-input');
        phoneInput.value = chapter.contact_number || '';
        console.log('Set phone number:', phoneInput.value);

        const emailInput = document.getElementById('email-address-input');
        emailInput.value = chapter.email_id || '';
        console.log('Set email:', emailInput.value);
        
        // Populate chapter vision and mission - display "Not Found" if that's the value
        const visionInput = document.getElementById('chapter-vision-input');
        visionInput.value = chapter.chapter_vision || '';
        console.log('Set vision:', visionInput.value);

        const missionInput = document.getElementById('chapter-mission-input');
        missionInput.value = chapter.chapter_mission || '';
        console.log('Set mission:', missionInput.value);
        
        // Populate contact person - display "Not Found" if that's the value
        const contactPersonInput = document.getElementById('contact-person-input');
        contactPersonInput.value = chapter.contact_person || '';
        console.log('Set contact person:', contactPersonInput.value);
        
        // Combine address components
        const addressComponents = [
            chapter.meeting_hotel_name,
            chapter.street_address_line,
            chapter.postal_code
        ].filter(component => component); // Remove only null/undefined values, keep "Not Found"
        
        console.log('Address components before joining:', addressComponents);
        const fullAddress = addressComponents.join(', ');
        
        const addressInput = document.getElementById('chapter-address-input');
        addressInput.value = fullAddress;
        console.log('Set complete address:', addressInput.value);

    } catch (error) {
        console.error('Error in populateChapterInfo:', error);
        toastr.error('Error populating chapter information');
    }
}

function populateSocialLinks(chapter) {
    console.log('Starting populateSocialLinks with data:', chapter);

    try {
        // Populate social media links - display "Not Found" if that's the value
        const socialInputs = {
            'facebook': chapter.chapter_facebook,
            'Instagram': chapter.chapter_instagram,
            'Linkedin': chapter.chapter_linkedin,
            'Youtube': chapter.chapter_youtube
        };

        for (const [platform, value] of Object.entries(socialInputs)) {
            const input = document.getElementById(platform);
            if (input) {
                input.value = value || ''; // This will display "Not Found" if that's the value
                console.log(`Set ${platform} link:`, input.value);
            } else {
                console.warn(`Input element for ${platform} not found`);
            }
        }
    } catch (error) {
        console.error('Error in populateSocialLinks:', error);
        toastr.error('Error populating social media links');
    }
}

function populateChapterLogo(chapter) {
    console.log('🎨 Starting populateChapterLogo with data:', chapter);

    try {
        const logoPreview = document.getElementById('member-photo-preview');
        const noPhotoMessage = document.getElementById('no-photo-message');

        if (chapter.chapter_logo && chapter.chapter_logo !== 'Not Found') {
            console.log('🖼️ Found chapter logo:', chapter.chapter_logo);
            // Use the consistent URL pattern for chapter logos
            const photoPath = `http://backend.bninewdelhi.com/api/uploads/chapterLogos/${chapter.chapter_logo}`;
            console.log('🔗 Full photo path:', photoPath);
            
            logoPreview.src = photoPath;
            logoPreview.style.display = 'block';
            noPhotoMessage.style.display = 'none';
            console.log('✅ Logo preview updated successfully');
        } else {
            console.log('⚠️ No chapter logo found, showing default message');
            logoPreview.style.display = 'none';
            noPhotoMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('❌ Error in populateChapterLogo:', error);
        toastr.error('Error loading chapter logo');
    }
}

function setupSocialMediaInputs() {
    console.log('Setting up social media input event listeners...');
    
    const socialInputIds = ['facebook', 'Instagram', 'Linkedin', 'Youtube'];
    
    socialInputIds.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', function(e) {
                console.log(`${id} input changed:`, e.target.value);
            });
        } else {
            console.warn(`Social media input element not found for: ${id}`);
        }
    });
}

// Add this function to handle save changes
async function saveChanges() {
    console.log('🚀 Starting saveChanges function...');
    
    try {
        const formData = new FormData();
        
        // Get email from the email input field
        const email_id = document.getElementById('email-address-input').value;
        console.log('📧 Email ID from input:', email_id);

        if (!email_id) {
            console.error('❌ Email ID is required');
            toastr.error('Email address is required');
            return;
        }

        // Get all input values with proper validation
        const inputs = {
            email_id: email_id,
            contact_number: document.getElementById('phone-number-input').value || null,
            contact_person: document.getElementById('contact-person-input').value || null,
            chapter_mission: document.getElementById('chapter-mission-input').value || null,
            chapter_vision: document.getElementById('chapter-vision-input').value || null,
            chapter_facebook: document.getElementById('facebook').value || null,
            chapter_instagram: document.getElementById('Instagram').value || null,
            chapter_linkedin: document.getElementById('Linkedin').value || null,
            chapter_youtube: document.getElementById('Youtube').value || null
        };

        // Handle address fields
        const addressInput = document.getElementById('chapter-address-input').value;
        if (addressInput) {
            const addressParts = addressInput.split(',').map(part => part.trim());
            console.log('📍 Address parts:', addressParts);

            // Set meeting_hotel_id to 1 (default) or get from your form if needed
            inputs.meeting_hotel_id = 1;
            inputs.street_address_line = addressParts[1] || null;
            inputs.postal_code = addressParts[2] || null;
        }

        // Log the collected data
        console.log('📝 Collected form data:', inputs);

        // Append all non-null values to FormData
        Object.entries(inputs).forEach(([key, value]) => {
            if (value !== null && value !== '') {
                formData.append(key, value);
                console.log(`📎 Appending ${key}:`, value);
            }
        });

        // Handle logo upload
        const logoInput = document.getElementById('member-photo-input');
        if (logoInput.files.length > 0) {
            const file = logoInput.files[0];
            console.log('🖼️ New logo file:', {
                name: file.name,
                type: file.type,
                size: `${(file.size / 1024).toFixed(2)}KB`
            });
            formData.append('chapter_logo', file);
        }

        console.log('📤 Sending update request...');
        const response = await fetch('http://backend.bninewdelhi.com/api/updateChapterSettings', {
            method: 'PUT',
            body: formData
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Server error:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Server response:', result);

        if (result.success) {
            console.log('🎉 Update successful');
            toastr.success('Chapter settings updated successfully');
            $('#confirmationModal').modal('hide');
            
            // Refresh the data
            console.log('🔄 Refreshing chapter data...');
            await fetchChapterData();
        } else {
            console.error('❌ Update failed:', result.message);
            toastr.error(result.message || 'Failed to update settings');
        }

    } catch (error) {
        console.error('❌ Error in saveChanges:', error);
        toastr.error('An error occurred while saving changes');
    }
}

// Add event listener for file input change
document.getElementById('member-photo-input').addEventListener('change', function(e) {
    console.log('📸 File input changed');
    const file = e.target.files[0];
    if (file) {
        console.log('📄 Selected file:', {
            name: file.name,
            type: file.type,
            size: `${(file.size / 1024).toFixed(2)}KB`
        });
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('member-photo-preview');
            const noPhotoMessage = document.getElementById('no-photo-message');
            console.log('🖼️ Setting preview image');
            preview.src = e.target.result;
            preview.style.display = 'block';
            noPhotoMessage.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
});
