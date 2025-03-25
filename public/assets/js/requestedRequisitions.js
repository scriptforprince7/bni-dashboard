const accoladesApiUrl = "https://bni-data-backend.onrender.com/api/accolades";
const chaptersApiUrl = "https://backend.bninewdelhi.com/api/chapters";
const requisitionsApiUrl = "https://backend.bninewdelhi.com/api/getRequestedChapterRequisition";

let allChapters = [];
let allAccolades = [];
let allRequisitions = [];

// Function to show the loader
function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

// Function to hide the loader
function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

// Fetch all data
async function loadData() {
    try {
        showLoader();
        console.log('🚀 Starting data fetch...');

        // Fetch all required data
        const [requisitionsResponse, chaptersResponse, accoladesResponse] = await Promise.all([
            fetch(requisitionsApiUrl),
            fetch(chaptersApiUrl),
            fetch(accoladesApiUrl)
        ]);

        allRequisitions = await requisitionsResponse.json();
        allChapters = await chaptersResponse.json();
        allAccolades = await accoladesResponse.json();

        console.log('📝 All Requisitions:', allRequisitions);
        console.log('📚 All Chapters:', allChapters);
        console.log('🏆 All Accolades:', allAccolades);

        renderTable();

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        hideLoader();
    }
}

// Function to get random accolades
function getRandomAccolades(count = 5) {
    const shuffled = [...allAccolades].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Function to handle click on accolades count
async function handleAccoladesClick(requisition) {
    try {
        console.log('📝 Processing requisition:', requisition);
        console.log('🎯 Accolade IDs to fetch:', requisition.accolade_ids);
        console.log('🏢 Chapter ID to match:', requisition.chapter_id);

        // Fetch both accolades and chapters data
        const [accoladesResponse, chaptersResponse] = await Promise.all([
            fetch('https://bni-data-backend.onrender.com/api/accolades'),
            fetch('https://backend.bninewdelhi.com/api/chapters')
        ]);

        const [allAccolades, allChapters] = await Promise.all([
            accoladesResponse.json(),
            chaptersResponse.json()
        ]);

        console.log('🏆 All Accolades from API:', allAccolades);
        console.log('📚 All Chapters from API:', allChapters);

        // Match chapter based on chapter_id
        const chapter = allChapters.find(ch => ch.chapter_id === requisition.chapter_id);
        console.log('🏢 Matched Chapter:', chapter);

        // Match accolades based on accolade_ids
        const matchedAccolades = requisition.accolade_ids
            .map(id => allAccolades.find(acc => acc.accolade_id === id))
            .filter(Boolean);

        console.log('✨ Matched Accolades:', matchedAccolades);

        const accoladesSectionsHtml = matchedAccolades.map((accolade, index) => {
            // Define gradient colors based on accolade type
            const headerGradient = accolade.accolade_type === 'Global' 
                ? 'linear-gradient(145deg, #2563eb, #1e40af)' // Blue gradient for Global
                : 'linear-gradient(145deg, #dc2626, #991b1b)'; // Red gradient for Regional

            return `
            <div class="accolade-section" style="
                background: #ffffff;
                border-radius: 12px;
                margin-bottom: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                border: 1px solid #e5e7eb;
            ">
                <!-- Header with Accolade Name -->
                <div style="
                    background: ${headerGradient};
                    padding: 15px;
                    border-radius: 12px 12px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <div style="color: #ffffff; font-size: 1.1rem; font-weight: 600;">
                        <i class="ri-award-fill me-2"></i>${accolade.accolade_name}
                    </div>
                    <span style="
                        background: ${accolade.accolade_type === 'Global' ? '#4f46e5' : '#e11d48'};
                        padding: 4px 12px;
                        border-radius: 9999px;
                        font-size: 0.75rem;
                        color: white;
                        font-weight: 500;
                    ">
                        ${accolade.accolade_type}
                    </span>
                </div>

                <!-- Content -->
                <div style="padding: 20px;">
                    <!-- Details Grid -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                        <!-- Chapter Name -->
                        <div style="
                            padding: 12px;
                            background: #f8fafc;
                            border-radius: 8px;
                            border-left: 4px solid #2563eb;
                        ">
                            <div style="color: #64748b; font-size: 0.875rem; margin-bottom: 4px;">
                                <i class="ri-building-line me-1"></i>Chapter
                            </div>
                            <div style="color: #1e293b; font-weight: 500;">
                                ${chapter ? chapter.chapter_name : 'Unknown Chapter'}
                            </div>
                        </div>

                        <!-- Member Name -->
                        <div style="
                            padding: 12px;
                            background: #f8fafc;
                            border-radius: 8px;
                            border-left: 4px solid #2563eb;
                        ">
                            <div style="color: #64748b; font-size: 0.875rem; margin-bottom: 4px;">
                                <i class="ri-user-line me-1"></i>Member
                            </div>
                            <div style="color: #1e293b; font-weight: 500;">
                                ${requisition.member_name || 'N/A'}
                            </div>
                        </div>

                        <!-- Accolade Type -->
                        <div style="
                            padding: 12px;
                            background: #f8fafc;
                            border-radius: 8px;
                            border-left: 4px solid #2563eb;
                        ">
                            <div style="color: #64748b; font-size: 0.875rem; margin-bottom: 4px;">
                                <i class="ri-price-tag-3-line me-1"></i>Type
                            </div>
                            <div style="color: #1e293b; font-weight: 500;">
                                ${accolade.accolade_type}
                            </div>
                        </div>

                        <!-- Chapter Comment -->
                        <div style="
                            padding: 12px;
                            background: #f8fafc;
                            border-radius: 8px;
                            border-left: 4px solid #2563eb;
                        ">
                            <div style="color: #64748b; font-size: 0.875rem; margin-bottom: 4px;">
                                <i class="ri-chat-1-line me-1"></i>Chapter Comment
                            </div>
                            <div style="color: #1e293b; font-weight: 500;">
                                ${requisition.comment || 'No comment provided'}
                            </div>
                        </div>
                    </div>

                    <!-- RO Comment Input -->
                    <div style="margin-bottom: 20px;">
                        <div style="color: #64748b; font-size: 0.875rem; margin-bottom: 8px;">
                            <i class="ri-chat-2-line me-1"></i>RO Comment
                        </div>
                        <textarea 
                            class="form-control" 
                            placeholder="Enter your comment here..."
                            style="
                                width: 100%;
                                padding: 10px;
                                border: 1px solid #e5e7eb;
                                border-radius: 8px;
                                resize: vertical;
                                min-height: 80px;
                            "
                        >${requisition.ro_comment || ''}</textarea>
                    </div>

                    <!-- Action Buttons -->
                    <div style="
                        display: flex;
                        gap: 10px;
                        justify-content: flex-end;
                        margin-top: 15px;
                    ">
                        <button 
                            class="btn-reject"
                            onclick="handleReject(${index})"
                            style="
                                padding: 8px 16px;
                                border-radius: 6px;
                                border: none;
                                background: #fee2e2;
                                color: #dc2626;
                                font-weight: 500;
                                cursor: pointer;
                                transition: all 0.3s ease;
                            "
                        >
                            <i class="ri-close-circle-line me-1"></i>Reject
                        </button>
                        <button 
                            class="btn-approve"
                            onclick="handleApprove(${index})"
                            style="
                                padding: 8px 16px;
                                border-radius: 6px;
                                border: none;
                                background: #dcfce7;
                                color: #16a34a;
                                font-weight: 500;
                                cursor: pointer;
                                transition: all 0.3s ease;
                            "
                        >
                            <i class="ri-checkbox-circle-line me-1"></i>Approve
                        </button>
                    </div>
                </div>
            </div>
        `}).join('');

        Swal.fire({
            title: '<span style="color: #2563eb"><i class="ri-file-list-3-line"></i> Accolade Request Details</span>',
            html: `
                <div class="request-details-container" style="
                    max-height: 70vh;
                    overflow-y: auto;
                    padding: 20px;
                ">
                    ${accoladesSectionsHtml}
                </div>
            `,
            width: '800px',
            showCloseButton: true,
            showConfirmButton: false
        });

    } catch (error) {
        console.error('❌ Error in handleAccoladesClick:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load accolades details'
        });
    }
}

// Placeholder functions for approve/reject actions
function handleApprove(index) {
    console.log('✅ Approved accolade at index:', index);
    // Add your approve logic here
}

function handleReject(index) {
    console.log('❌ Rejected accolade at index:', index);
    // Add your reject logic here
}

// Update the renderTable function
const renderTable = () => {
    const tableBody = document.getElementById("chaptersTableBody");
    
    tableBody.innerHTML = allRequisitions
        .map((req, index) => {
            const chapter = allChapters.find(ch => ch.chapter_id === req.chapter_id);
            
            // Format the requested date
            const requestDate = new Date(req.requested_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            console.log('📅 Formatting date for requisition:', {
                originalDate: req.requested_date,
                formattedDate: requestDate
            });

            return `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="font-weight: bold; color: #1e293b; padding: 16px;">
                        ${index + 1}
                    </td>
                    <td style="font-weight: bold; color: #1e293b; padding: 16px;">
                        ${chapter ? chapter.chapter_name : 'Unknown Chapter'}
                    </td>
                    <td style="padding: 16px;">
                        <div class="accolades-container" style="max-width: 500px;">
                            <div class="accolade-count" 
                                 onclick='handleAccoladesClick(${JSON.stringify(req).replace(/"/g, '&quot;')})'
                                 style="
                                    display: inline-block;
                                    padding: 8px 16px;
                                    background: linear-gradient(to right, #f8fafc, transparent);
                                    border-left: 3px solid #2563eb;
                                    border-radius: 4px;
                                    cursor: pointer;
                                    transition: all 0.3s ease;
                                 "
                            >
                                <span style="font-weight: 500; color: #1e293b;">
                                    ${req.accolade_ids.length} Accolades Requested
                                </span>
                            </div>
                        </div>
                    </td>
                    <td style="font-weight: bold; color: #1e293b; padding: 16px;">
                        ${requestDate}
                    </td>
                    <td style="font-weight: bold; padding: 16px;">
                        <span class="badge" style="
                            background: ${req.request_status.toLowerCase() === 'open' ? '#dcfce7' : '#fee2e2'};
                            color: ${req.request_status.toLowerCase() === 'open' ? '#16a34a' : '#dc2626'};
                            padding: 6px 12px;
                            border-radius: 9999px;
                            font-weight: 500;
                            font-size: 0.875rem;
                        ">
                            ${req.request_status.toLowerCase() === 'open' ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                </tr>`;
        })
        .join("");
};

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', loadData);
