// Global variables
let allMembers = [];
let allAccolades = [];
let allDisapprovedAccolades = [];
let allMemberAccolades = [];
let currentMemberId = null;

// Function to show loader
function showLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'flex';
    }
}

// Function to hide loader
function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'none';
    }
}

// Function to get current member ID based on login type
async function getCurrentMemberId() {
    try {
        console.log('🔍 Getting current member ID...');
        
        const loginType = getUserLoginType();
        console.log('👤 Login Type:', loginType);
        
        if (loginType === 'ro_admin') {
            // For RO admin, get member_id from localStorage
            const currentMemberId = localStorage.getItem('current_member_id');
            console.log('🆔 RO Admin - Member ID from localStorage:', currentMemberId);
            return currentMemberId ? parseInt(currentMemberId) : null;
        } else if (loginType === 'member') {
            // For member, get email and match with members API
            const userEmail = getUserEmail();
            console.log('📧 Member Email:', userEmail);
            
            if (!userEmail) {
                console.error('❌ No email found for member');
                return null;
            }
            
            // Find member by email in allMembers array
            const member = allMembers.find(m => m.member_email_address === userEmail);
            if (member) {
                console.log('✅ Member found by email:', member.member_id);
                return member.member_id;
            } else {
                console.error('❌ Member not found with email:', userEmail);
                return null;
            }
        } else {
            console.error('❌ Unknown login type:', loginType);
            return null;
        }
    } catch (error) {
        console.error('❌ Error getting current member ID:', error);
        return null;
    }
}

// Function to fetch all required data
async function loadData() {
    try {
        showLoader();
        console.log('🚀 Starting data fetch for disapproved accolades...');

        // Fetch all required data in parallel
        const [membersResponse, accoladesResponse, disapprovedResponse, memberAccoladesResponse] = await Promise.all([
            fetch('https://backend.bninewdelhi.com/api/members'),
            fetch('https://backend.bninewdelhi.com/api/accolades'),
            fetch('https://backend.bninewdelhi.com/api/getDisapprovedAccolades'),
            fetch('https://backend.bninewdelhi.com/api/getAllMemberAccolades')
        ]);

        // Parse responses
        allMembers = await membersResponse.json();
        allAccolades = await accoladesResponse.json();
        allDisapprovedAccolades = await disapprovedResponse.json();
        allMemberAccolades = await memberAccoladesResponse.json();

        console.log('📊 All Members:', allMembers.length);
        console.log('🏆 All Accolades:', allAccolades.length);
        console.log('❌ All Disapproved Accolades:', allDisapprovedAccolades);
        console.log('📋 All Member Accolades:', allMemberAccolades.length);

        // Get current member ID
        currentMemberId = await getCurrentMemberId();
        console.log('🆔 Current Member ID:', currentMemberId);

        // Render the table
        renderDisapprovedAccoladesTable();

    } catch (error) {
        console.error('❌ Error in loadData:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load disapproved accolades data'
        });
    } finally {
        hideLoader();
    }
}

// Function to render the disapproved accolades table
function renderDisapprovedAccoladesTable() {
    console.log('🎨 Rendering disapproved accolades table...');
    
    const tableBody = document.querySelector('.chaptersTableBody tbody');
    if (!tableBody) {
        console.error('❌ Table body not found');
        return;
    }

    // Filter disapproved accolades for current member (if not RO admin)
    let filteredDisapprovedAccolades = allDisapprovedAccolades;
    const loginType = getUserLoginType();
    
    if (loginType === 'member' && currentMemberId) {
        filteredDisapprovedAccolades = allDisapprovedAccolades.filter(
            item => item.member_id === currentMemberId
        );
        console.log('👤 Filtered for member:', filteredDisapprovedAccolades.length, 'items');
    } else if (loginType === 'ro_admin') {
        console.log('👑 RO Admin - showing all disapproved accolades');
    }

    // Filter out entries that exist in member_accolades table
    filteredDisapprovedAccolades = filteredDisapprovedAccolades.filter(disapprovedItem => {
        const existsInMemberAccolades = allMemberAccolades.some(memberAccolade => 
            memberAccolade.member_id === disapprovedItem.member_id && 
            memberAccolade.accolade_id === disapprovedItem.accolade_id
        );
        
        if (existsInMemberAccolades) {
            console.log(`🚫 Filtering out: member_id ${disapprovedItem.member_id}, accolade_id ${disapprovedItem.accolade_id} - exists in member_accolades`);
        }
        
        return !existsInMemberAccolades;
    });
    
    console.log('✅ Final filtered disapproved accolades:', filteredDisapprovedAccolades.length, 'items');

    if (filteredDisapprovedAccolades.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-4">
                    <div class="d-flex flex-column align-items-center">
                        <i class="ri-information-line mb-2" style="font-size: 2rem; color: #6b7280;"></i>
                        <p class="mb-0 text-muted">No disapproved accolades found</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    // Generate table rows
    const tableRows = filteredDisapprovedAccolades.map((item, index) => {
        const member = allMembers.find(m => m.member_id === item.member_id);
        const accolade = allAccolades.find(a => a.accolade_id === item.accolade_id);
        
        const memberName = member ? `${member.member_first_name} ${member.member_last_name}` : 'Unknown Member';
        const accoladeName = accolade ? accolade.accolade_name : 'Unknown Accolade';
        
        // Format date
        const disapprovedDate = new Date(item.disapproved_date).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });

        return `
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 16px; font-weight: 500; color: #1e293b;">
                    ${index + 1}
                </td>
                <td style="padding: 16px;">
                    <span style="font-weight: 500; color: #1e293b;">${memberName}</span>
                </td>
                <td style="padding: 16px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="
                            width: 32px;
                            height: 32px;
                            border-radius: 50%;
                            background: #fef2f2;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: #dc2626;
                        ">
                            <i class="ri-award-fill"></i>
                        </div>
                        <span style="font-weight: 500; color: #1e293b;">${accoladeName}</span>
                    </div>
                </td>
                <td style="padding: 16px;">
                    ${item.declineimage ? `
                        <div style="
                            width: 60px;
                            height: 60px;
                            border-radius: 8px;
                            overflow: hidden;
                            border: 2px solid #e5e7eb;
                            cursor: pointer;
                            transition: transform 0.2s ease;
                        "
                        onclick="window.open('${item.declineimage}', '_blank')"
                        onmouseover="this.style.transform='scale(1.05)'"
                        onmouseout="this.style.transform='scale(1)'"
                        >
                            <img 
                                src="${item.declineimage}" 
                                alt="Decline Image"
                                style="
                                    width: 100%;
                                    height: 100%;
                                    object-fit: cover;
                                "
                            />
                        </div>
                    ` : `
                        <span style="color: #6b7280; font-style: italic;">No image</span>
                    `}
                </td>
                <td style="padding: 16px;">
                    <span style="
                        background: #fee2e2;
                        color: #dc2626;
                        padding: 6px 12px;
                        border-radius: 999px;
                        font-size: 0.875rem;
                        font-weight: 500;
                    ">
                        <i class="ri-time-line me-1"></i>
                        ${disapprovedDate}
                    </span>
                </td>
            </tr>
        `;
    }).join('');

    tableBody.innerHTML = tableRows;
    console.log('✅ Table rendered successfully');
}

// Function to show image modal (kept for reference but not used)
function showImageModal(imageUrl) {
    Swal.fire({
        title: 'Decline Image',
        imageUrl: imageUrl,
        imageWidth: 400,
        imageHeight: 300,
        imageAlt: 'Decline Image',
        confirmButtonText: 'Close',
        showCloseButton: true
    });
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Disapproved Accolades page loaded');
    loadData();
});
