console.log('Settings.js loaded');

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded');
    
    // First check the user type
    const userType = getUserLoginType();
    console.log('User Type:', userType);
    
    let targetEmail;
    
    if (userType === 'ro_admin') {
        // For RO admin, get email from localStorage
        targetEmail = localStorage.getItem('current_member_email');
        const currentMemberId = localStorage.getItem('current_member_id');
        console.log('RO Admin viewing member:', targetEmail, 'with ID:', currentMemberId);
        
        if (!targetEmail || !currentMemberId) {
            console.error('No member selected for viewing');
            window.location.href = '/dashboard'; // Redirect to dashboard if no member selected
            return;
        }
    } else {
        // For regular member, get email from token
        targetEmail = getUserEmail();
        console.log('Member viewing own profile:', targetEmail);
        
        if (!targetEmail) {
            console.error('No user email found in token');
            window.location.href = '/login';
            return;
        }
    }
    
    console.log('Attempting to fetch data for email:', targetEmail);
    
    function setupPdfPreview(pdfPreview, imagePreview, url) {
        // Create a wrapper div for better styling
        const wrapper = document.createElement('div');
        wrapper.className = 'pdf-preview-wrapper';
        wrapper.style.cursor = 'pointer';
        wrapper.innerHTML = `
            <embed src="${url}" type="application/pdf" width="100%" height="300px" />
            <div class="pdf-overlay">
                <span>Click to view full PDF</span>
            </div>
        `;
        
        // Add click event to open PDF in new tab
        wrapper.addEventListener('click', (e) => {
            e.preventDefault();
            window.open(url, '_blank', 'noopener,noreferrer');
        });

        // Replace the existing preview with the wrapper
        pdfPreview.parentNode.replaceChild(wrapper, pdfPreview);
        if (imagePreview) imagePreview.style.display = 'none';
    }

    fetch('http://backend.bninewdelhi.com/api/members')
        .then(response => response.json())
        .then(members => {
            const member = members.find(m => m.member_email_address === targetEmail);
            
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

                // Handle member photo display
                if (member.member_photo) {
                    console.log('Loading member photo:', member.member_photo);
                    const photoUrl = `http://backend.bninewdelhi.com/uploads/memberLogos/${member.member_photo}`;
                    console.log('Member Photo URL:', photoUrl);
                    
                    const photoPreview = document.getElementById('member-photo-preview');
                    const noPhotoMessage = document.getElementById('no-photo-message');
                    
                    photoPreview.src = photoUrl;
                    photoPreview.style.display = 'block';
                    noPhotoMessage.style.display = 'none';
                }

                // Handle Aadhar card display
                if (member.member_aadhar_image) {
                    const aadharUrl = `http://backend.bninewdelhi.com/uploads/aadharCards/${member.member_aadhar_image}`;
                    const aadharPreview = document.getElementById('aadhar-preview');
                    const aadharPdfPreview = document.getElementById('aadhar-pdf-preview');
                    const noAadharMessage = document.getElementById('no-aadhar-message');
                    
                    if (aadharPdfPreview && noAadharMessage) {
                        if (member.member_aadhar_image.toLowerCase().endsWith('.pdf')) {
                            setupPdfPreview(aadharPdfPreview, aadharPreview, aadharUrl);
                        } else {
                            aadharPreview.src = aadharUrl;
                            aadharPreview.style.display = 'block';
                            aadharPdfPreview.style.display = 'none';
                        }
                        noAadharMessage.style.display = 'none';
                    }
                } else {
                    console.log('No Aadhar image found in member data');
                }

                // Handle PAN card display
                if (member.member_pan_image) {
                    const panUrl = `http://backend.bninewdelhi.com/uploads/panCards/${member.member_pan_image}`;
                    const panPreview = document.getElementById('pan-preview');
                    const panPdfPreview = document.getElementById('pan-pdf-preview');
                    const noPanMessage = document.getElementById('no-pan-message');
                    
                    if (panPdfPreview && noPanMessage) {
                        if (member.member_pan_image.toLowerCase().endsWith('.pdf')) {
                            setupPdfPreview(panPdfPreview, panPreview, panUrl);
                        } else {
                            panPreview.src = panUrl;
                            panPreview.style.display = 'block';
                            panPdfPreview.style.display = 'none';
                        }
                        noPanMessage.style.display = 'none';
                    }
                } else {
                    console.log('No PAN image found in member data');
                }

                // Handle GST certificate display
                if (member.member_gst_certificate_image) {
                    const gstUrl = `http://backend.bninewdelhi.com/uploads/gstCertificates/${member.member_gst_certificate_image}`;
                    const gstPreview = document.getElementById('gst-cert-preview');
                    const gstPdfPreview = document.getElementById('gst-cert-pdf-preview');
                    const noGstMessage = document.getElementById('no-gst-cert-message');
                    
                    if (gstPdfPreview && noGstMessage) {
                        if (member.member_gst_certificate_image.toLowerCase().endsWith('.pdf')) {
                            setupPdfPreview(gstPdfPreview, gstPreview, gstUrl);
                        } else {
                            gstPreview.src = gstUrl;
                            gstPreview.style.display = 'block';
                            gstPdfPreview.style.display = 'none';
                        }
                        noGstMessage.style.display = 'none';
                    }
                } else {
                    console.log('No GST certificate found in member data');
                }

                // Debug log for all document fields
                console.log('Document fields in member data:', {
                    member_photo: member.member_photo,
                    member_aadhar: member.member_aadhar_image,
                    member_pan: member.member_pan_image,
                    member_gst: member.member_gst_certificate_image
                });

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

                // Add debug logs for access type
                console.log('Access Type:', userType === 'ro_admin' ? 'RO Admin View' : 'Member Self View');
                console.log('Viewing Member Email:', targetEmail);
            } else {
                console.error('Member not found with email:', targetEmail);
                if (userType === 'ro_admin') {
                    window.location.href = '/dashboard';
                } else {
                    window.location.href = '/login';
                }
            }
        })
        .catch(error => {
            console.error('Error fetching member data:', error);
        });
});

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

    fetch('http://backend.bninewdelhi.com/api/updateMemberSettings', {
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

// Update the member photo upload preview handler
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

// Add this CSS to your styles
const style = document.createElement('style');
style.textContent = `
    .pdf-preview-wrapper {
        position: relative;
        width: 80%;          /* Reduced from 100% */
        min-height: 200px;   /* Reduced from 300px */
        border: 1px solid #ddd;
        border-radius: 4px;
        overflow: hidden;
        margin: 0 auto;      /* Center the wrapper */
    }
    .pdf-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s;
    }
    .pdf-overlay span {
        background: rgba(255,255,255,0.9);
        padding: 8px 16px;
        border-radius: 4px;
    }
    .pdf-preview-wrapper:hover .pdf-overlay {
        opacity: 1;
    }
`;
document.head.appendChild(style);
