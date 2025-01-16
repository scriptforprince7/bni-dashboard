console.log('Settings.js loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    displayCompanyInfo();
});

function displayCompanyInfo() {
    const userEmail = localStorage.getItem('loggedInEmail');
    
    console.log('Attempting to fetch data for email:', userEmail);
    
    fetch('https://bni-data-backend.onrender.com/api/members')
        .then(response => response.json())
        .then(members => {
            const member = members.find(m => m.member_email_address === userEmail);
            
            console.log('Found member data:', member);
            
            if (member) {
                // Update basic company information
                document.getElementById('company-name-input').value = member.member_company_name || 'Not Available';
                document.getElementById('company-address-input').value = member.member_company_address || 'Not Available';
                document.getElementById('company-gstin-input').value = member.member_gst_number || 'Not Available';

                // Add phone number and email address
                document.getElementById('phone-number-input').value = member.member_phone_number || 'Not Available';
                document.getElementById('email-address-input').value = member.member_email_address || 'Not Available';

                // Update new fields
                document.getElementById('current-membership-input').value = member.member_current_membership || 'Not Available';
                
                // Format and display renewal date
                const renewalDate = member.member_renewal_date ? 
                    new Date(member.member_renewal_date).toLocaleDateString() : 'Not Available';
                document.getElementById('renewal-date-input').value = renewalDate;

                // Handle company logo
                const logoPreview = document.getElementById('company-logo-preview');
                const noLogoMessage = document.getElementById('no-logo-message');
                
                if (member.member_company_logo && member.member_company_logo !== '{}') {
                    logoPreview.src = member.member_company_logo;
                    logoPreview.style.display = 'block';
                    noLogoMessage.style.display = 'none';
                } else {
                    logoPreview.style.display = 'none';
                    noLogoMessage.style.display = 'block';
                }

                // Handle member photo
                const photoPreview = document.getElementById('member-photo-preview');
                const noPhotoMessage = document.getElementById('no-photo-message');
                
                if (member.member_photo && member.member_photo !== '{}') {
                    photoPreview.src = member.member_photo;
                    photoPreview.style.display = 'block';
                    noPhotoMessage.style.display = 'none';
                } else {
                    photoPreview.style.display = 'none';
                    noPhotoMessage.style.display = 'block';
                }

                // Update social media links
                document.getElementById('facebook').value = member.member_facebook || 'Not Available';
                document.getElementById('Instagram').value = member.member_instagram || 'Not Available';
                document.getElementById('Youtube').value = member.member_youtube || 'Not Available';
                document.getElementById('Linkedin').value = member.member_linkedin || 'Not Available';

                // Add debug logs for social links
                console.log('Facebook:', member.member_facebook);
                console.log('Instagram:', member.member_instagram);
                console.log('Youtube:', member.member_youtube);
                console.log('LinkedIn:', member.member_linkedin);
            } else {
                console.error('Member not found with email:', userEmail);
            }
        })
        .catch(error => {
            console.error('Error fetching member data:', error);
        });
}

function saveChanges() {
    const loggedInEmail = localStorage.getItem('loggedInEmail');
    
    console.log('Starting save with email:', loggedInEmail);
    
    const updatedData = {
        member_email_address: loggedInEmail,
        member_phone_number: document.getElementById('phone-number-input').value,
        member_company_address: document.getElementById('company-address-input').value,
        member_company_name: document.getElementById('company-name-input').value,
        member_company_logo: document.getElementById('company-logo-preview').src
    };

    console.log('Data being sent:', updatedData);

    fetch('https://bni-data-backend.onrender.com/api/updateMemberSettings', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData)
    })
    .then(response => {
        console.log('Response status:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('Response data:', data);
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('confirmationModal'));
        modal.hide();

        if (data.message === "Member settings updated successfully") {
            toastr.success("Changes have been saved successfully!", "Success");
            displayCompanyInfo();
        } else {
            throw new Error(data.message || 'Update failed');
        }
    })
    .catch(error => {
        toastr.error("Error saving changes. Please try again.", "Error", {
            closeButton: true,
            progressBar: true,
            timeOut: 3000,
            positionClass: "toast-top-right",
        });
    });
}

// Make sure the function is globally available
window.saveChanges = saveChanges;

// Handle company logo upload
document.getElementById('company-logo-input').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const logoPreview = document.getElementById('company-logo-preview');
            const noLogoMessage = document.getElementById('no-logo-message');
            
            logoPreview.src = e.target.result;
            logoPreview.style.display = 'block';
            noLogoMessage.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
});

// Add event listener for member photo upload
document.getElementById('member-photo-input').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const photoPreview = document.getElementById('member-photo-preview');
            const noPhotoMessage = document.getElementById('no-photo-message');
            
            photoPreview.src = e.target.result;
            photoPreview.style.display = 'block';
            noPhotoMessage.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
});