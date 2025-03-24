document.addEventListener('DOMContentLoaded', async function() {
    try {
        showLoader();
        
        // Get user details from token
        const userEmail = getUserEmail();
        const loginType = getUserLoginType();
        
        console.log('👤 User Details:', {
            userEmail,
            loginType
        });

        let currentMemberEmail, currentMemberId;
        
        // Determine which member details to use
        if (loginType === 'ro_admin') {
            currentMemberEmail = localStorage.getItem('current_member_email');
            currentMemberId = localStorage.getItem('current_member_id');
            console.log('🔄 RO Admin accessing member:', {
                email: currentMemberEmail,
                memberId: currentMemberId
            });
        } else {
            currentMemberEmail = userEmail;
        }

        if (!currentMemberEmail) {
            throw new Error('No member email found');
        }

        // Fetch both accolades and members data
        const [accoladesResponse, membersResponse] = await Promise.all([
            fetch('https://backend.bninewdelhi.com/api/accolades'),
            fetch('https://backend.bninewdelhi.com/api/members')
        ]);

        const accolades = await accoladesResponse.json();
        const members = await membersResponse.json();
        
        console.log('📚 All Accolades:', accolades);
        console.log('👥 All Members:', members);

        // Find the current member by email or id depending on login type
        const currentMember = loginType === 'ro_admin' 
            ? members.find(member => member.member_id === parseInt(currentMemberId))
            : members.find(member => member.member_email_address === currentMemberEmail);

        if (!currentMember) {
            throw new Error('Member not found');
        }

        console.log('🎯 Current Member Details:', {
            memberId: currentMember.member_id,
            name: `${currentMember.member_first_name} ${currentMember.member_last_name}`,
            email: currentMember.member_email_address,
            chapterId: currentMember.chapter_id,
            existingAccolades: currentMember.accolades_id,
            accessedBy: loginType
        });

        const accoladeSelect = document.getElementById('region_status');
        accoladeSelect.innerHTML = '<option value="">Select</option>';

        // Add only accolade names to dropdown
        const availableAccolades = accolades
            .filter(accolade => 
                accolade.accolade_availability === 'available' && 
                accolade.accolade_status === 'active' &&
                accolade.delete_status === 0
            )
            .sort((a, b) => a.accolade_name.localeCompare(b.accolade_name));

        console.log('🏆 Available Accolades for Dropdown:', availableAccolades);

        availableAccolades.forEach(accolade => {
            const option = document.createElement('option');
            option.value = accolade.accolade_id;
            option.textContent = accolade.accolade_name;
            accoladeSelect.appendChild(option);
        });

        // Check for existing accolade on selection
        accoladeSelect.addEventListener('change', function() {
            const selectedAccoladeId = parseInt(this.value);
            console.log('🎯 Selected Accolade ID:', selectedAccoladeId);
            
            if (!selectedAccoladeId) {
                console.log('❌ No accolade selected');
                document.getElementById('eligibilityContainer')?.remove();
                return;
            }

            // Find the selected accolade
            const selectedAccolade = availableAccolades.find(a => a.accolade_id === selectedAccoladeId);
            console.log('🏆 Selected Accolade Details:', selectedAccolade);

            if (currentMember.accolades_id.includes(selectedAccoladeId)) {
                console.log('⚠️ Accolade already assigned to member:', selectedAccoladeId);
                
                Swal.fire({
                    title: '<span style="color: #f59e0b">Accolade Already Assigned</span>',
                    html: `
                        <div style="
                            text-align: left;
                            padding: 15px;
                            background: #fffbeb;
                            border-radius: 8px;
                            border-left: 4px solid #f59e0b;
                            margin: 10px 0;
                        ">
                            <i class="ri-alert-line" style="color: #f59e0b"></i>
                            This accolade has already been assigned to ${currentMember.member_first_name} ${currentMember.member_last_name}. 
                            Are you sure you want to request it again?
                        </div>
                    `,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#f59e0b',
                    cancelButtonColor: '#64748b',
                    confirmButtonText: 'Yes, request again',
                    cancelButtonText: 'Cancel'
                }).then((result) => {
                    if (result.isConfirmed) {
                        window.location.href = '/macc/manage-memberAccolades';
                    } else {
                        this.value = ''; // Reset dropdown if user cancels
                    }
                });
            } else {
                // Show eligibility info
                document.getElementById('eligibilityContainer')?.remove();
                const eligibilityHtml = `
                    <div id="eligibilityContainer" style="
                        margin-top: 15px;
                        padding: 15px;
                        background: #f8fafc;
                        border-radius: 8px;
                        border-left: 4px solid #2563eb;
                        animation: fadeIn 0.3s ease-in-out;
                    ">
                        <div style="
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            margin-bottom: 10px;
                            color: #2563eb;
                            font-weight: 600;
                        ">
                            <i class="ri-award-line"></i>
                            Eligibility Criteria
                        </div>
                        <div style="
                            color: #475569;
                            font-size: 0.95em;
                            line-height: 1.6;
                        ">
                            ${selectedAccolade.eligibility_and_condition || 'No specific eligibility criteria specified.'}
                        </div>
                    </div>
                `;
                const dropdownContainer = document.querySelector('.col-xl-6');
                dropdownContainer.insertAdjacentHTML('beforeend', eligibilityHtml);
            }
        });

        // Update form submission handler to make API call
        const form = document.getElementById('addRegionForm');
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const selectedAccoladeId = accoladeSelect.value;
            const comment = document.getElementById('mission').value;
            const eligibilityChecked = document.getElementById('eligibilityCheck').checked;

            // Validate required fields
            if (!selectedAccoladeId || !comment || !eligibilityChecked) {
                Swal.fire({
                    icon: 'error',
                    title: 'Required Fields Missing',
                    text: 'Please select an accolade, add a comment, and confirm eligibility.',
                    confirmButtonColor: '#dc3545'
                });
                return;
            }

            try {
                showLoader();

                // Log form data before API call
                console.log('📝 Form Submission Data:', {
                    memberId: currentMember.member_id,
                    memberName: `${currentMember.member_first_name} ${currentMember.member_last_name}`,
                    memberEmail: currentMemberEmail,
                    chapterId: currentMember.chapter_id,
                    accoladeId: selectedAccoladeId,
                    selectedAccoladeName: availableAccolades.find(a => a.accolade_id === parseInt(selectedAccoladeId))?.accolade_name,
                    comment: comment,
                    eligibilityChecked: eligibilityChecked,
                    requestedBy: loginType,
                    accessMethod: loginType === 'ro_admin' ? 'RO Admin Access' : 'Direct Member Access',
                    timestamp: new Date().toISOString()
                });

                // Prepare request payload
                const requestPayload = {
                    member_id: currentMember.member_id,
                    chapter_id: currentMember.chapter_id,
                    accolade_id: parseInt(selectedAccoladeId),
                    request_comment: comment,
                    accolade_amount: null,
                    order_id: null,
                    requested_by: loginType
                };

                console.log('🚀 Sending API Request:', requestPayload);

                // Make API call
                const response = await fetch('https://backend.bninewdelhi.com/api/member-requisition', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(requestPayload)
                });

                const result = await response.json();
                console.log('✅ API Response:', result);

                if (!response.ok) {
                    throw new Error(result.message || 'Failed to submit requisition');
                }

                // Hide loader before showing success message
                hideLoader();

                // Show success message
                await Swal.fire({
                    icon: 'success',
                    title: 'Request Submitted Successfully',
                    text: 'Your accolade requisition has been submitted and is pending approval.',
                    confirmButtonColor: '#28a745'
                });

                // Redirect to manage page
                window.location.href = '/macc/manage-memberAccolades';

            } catch (error) {
                // Hide loader before showing error message
                hideLoader();
                
                console.error('❌ Error submitting requisition:', error);
                
                Swal.fire({
                    icon: 'error',
                    title: 'Submission Failed',
                    text: error.message || 'Failed to submit requisition. Please try again.',
                    confirmButtonColor: '#dc3545'
                });
            }
        });

        hideLoader();

    } catch (error) {
        console.error('❌ Error:', error);
        hideLoader();
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'Failed to load data. Please try again.'
        });
    }
});

// Helper functions for loader
function showLoader() {
    // Add your loader show logic here
    // For example:
    const loader = document.createElement('div');
    loader.id = 'accolade-loader';
    loader.innerHTML = '<div class="spinner-border text-primary" role="status"></div>';
    document.body.appendChild(loader);
}

function hideLoader() {
    // Add your loader hide logic here
    // For example:
    const loader = document.getElementById('accolade-loader');
    if (loader) {
        loader.remove();
    }
}

// Add some custom styles
const style = document.createElement('style');
style.textContent = `
    #region_status {
        padding: 10px;
        border-radius: 6px;
        border: 1px solid #e2e8f0;
        font-size: 0.95em;
        width: 100%;
        transition: all 0.3s ease;
    }

    #region_status:focus {
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    #region_status option {
        padding: 10px;
    }

    #accolade-loader {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
    }
`;

document.head.appendChild(style);

// Add animation styles
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    #eligibilityContainer {
        transition: all 0.3s ease;
    }

    #eligibilityContainer:hover {
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
`;
document.head.appendChild(styleSheet);
