// Show/Hide loader functions
function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

// Format date function
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

async function fetchAndDisplayAccoladeRequests() {
    try {
        showLoader();
        
        // Step 1: Get user type and relevant chapter info
        const loginType = getUserLoginType();
        let chapterEmail, chapterData;

        if (loginType === 'ro_admin') {
            // For RO Admin, get chapter details from localStorage
            chapterEmail = localStorage.getItem('current_chapter_email');
            console.log('👤 RO Admin accessing chapter:', chapterEmail);
        } else {
            // For regular chapter access, get email from token
            chapterEmail = getUserEmail();
            console.log('👤 Chapter logged in:', chapterEmail);
        }

        if (!chapterEmail) {
            throw new Error('No chapter email found');
        }

        // Step 2: Fetch chapter data and find matching chapter
        const chaptersResponse = await fetch('https://backend.bninewdelhi.com/api/chapters');
        const chapters = await chaptersResponse.json();
        
        if (loginType === 'ro_admin') {
            // For RO Admin, use current_chapter_id from localStorage
            const currentChapterId = parseInt(localStorage.getItem('current_chapter_id'));
            chapterData = chapters.find(chapter => chapter.chapter_id === currentChapterId);
        } else {
            // For regular chapter access, match by email
            chapterData = chapters.find(chapter => chapter.email_id === chapterEmail);
        }

        if (!chapterData) {
            console.error('❌ No matching chapter found:', { loginType, chapterEmail });
            throw new Error('Chapter not found');
        }
        
        console.log('📍 Chapter Data:', chapterData);

        // Step 3: Fetch all requisitions
        const requisitionsResponse = await fetch('https://backend.bninewdelhi.com/api/getRequestedMemberRequisition');
        const requisitions = await requisitionsResponse.json();
        
        // Filter requisitions for the chapter
        const chapterRequisitions = requisitions.filter(req => req.chapter_id === chapterData.chapter_id);
        console.log('📝 Chapter Requisitions:', chapterRequisitions);

        // Step 4: Fetch members data
        const membersResponse = await fetch('https://bni-data-backend.onrender.com/api/members');
        const members = await membersResponse.json();

        // Step 5: Fetch accolades data
        const accoladesResponse = await fetch('https://bni-data-backend.onrender.com/api/accolades');
        const accolades = await accoladesResponse.json();
        console.log('🏆 All Accolades:', accolades);

        // Step 6: Prepare and display the data
        const tableBody = document.getElementById('chaptersTableBody');
        if (!tableBody) {
            throw new Error('Table body element not found');
        }

        if (chapterRequisitions.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center"><b>No accolade requests found</b></td>
                </tr>
            `;
            hideLoader();
            return;
        }

        const tableRows = chapterRequisitions.map((req, index) => {
            // Find corresponding member and accolade
            const member = members.find(m => m.member_id === req.member_id);
            const accolade = accolades.find(a => a.accolade_id === req.accolade_id);

            // Debug logging for accolade matching
            console.log(`🔍 Looking for accolade_id: ${req.accolade_id}`, {
                found: !!accolade,
                accoladeDetails: accolade
            });

            const memberName = member 
                ? `${member.member_first_name} ${member.member_last_name}`
                : 'Unknown Member';

            return `
                <tr>
                    <td><b>${index + 1}</b></td>
                    <td><b>${chapterData.chapter_name}</b></td>
                    <td><b>${memberName}</b></td>
                    <td><b>${accolade ? accolade.accolade_name : 'Unknown Accolade'}</b></td>
                    <td><b>${formatDate(req.requested_time_date)}</b></td>
                    <td>
                        <span class="badge ${req.approve_status === 'pending' ? 'bg-warning' : 'bg-success'}">
                            <b>${req.approve_status}</b>
                        </span>
                    </td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = tableRows;
        console.log('✅ Table populated successfully');

    } catch (error) {
        console.error('❌ Error:', error);
        const tableBody = document.getElementById('chaptersTableBody');
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-danger">
                        <b>Error loading data: ${error.message}</b>
                    </td>
                </tr>
            `;
        }
    } finally {
        hideLoader();
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing accolade requests page...');
    fetchAndDisplayAccoladeRequests();
});
