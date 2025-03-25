document.addEventListener('DOMContentLoaded', async function() {
    const tableBody = document.getElementById('chaptersTableBody');
    
    try {
        console.log('🚀 Starting data fetch process...');
        
        // Step 1: Get user email
        const userEmail = getUserEmail();
        console.log('👤 User Email:', userEmail);
        
        // Step 2: Fetch chapter data and find matching chapter
        const chaptersResponse = await fetch('https://bni-data-backend.onrender.com/api/chapters');
        const chapters = await chaptersResponse.json();
        console.log('📚 All Chapters:', chapters);
        
        const userChapter = chapters.find(chapter => chapter.email_id === userEmail);
        if (!userChapter) {
            console.error('❌ No matching chapter found for email:', userEmail);
            return;
        }
        console.log('🏢 User Chapter:', userChapter);
        
        // Step 3: Fetch chapter requisitions
        const requisitionsResponse = await fetch('https://backend.bninewdelhi.com/api/getRequestedChapterRequisition');
        const allRequisitions = await requisitionsResponse.json();
        console.log('📝 All Requisitions:', allRequisitions);
        
        // Filter requisitions for user's chapter
        const chapterRequisitions = allRequisitions.filter(req => req.chapter_id === userChapter.chapter_id);
        console.log('🔍 Chapter Requisitions:', chapterRequisitions);
        
        // Step 4: Fetch accolades data
        const accoladesResponse = await fetch('https://backend.bninewdelhi.com/api/accolades');
        const accolades = await accoladesResponse.json();
        console.log('🏆 All Accolades:', accolades);

        // Render the table
        const tableContent = chapterRequisitions.map(req => {
            const formattedDate = new Date(req.requested_date).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            return `
                <tr class="align-middle">
                    <td class="fw-bold">${req.chapter_requisition_id}</td>
                    
                    <td>
                        <span class="text-dark fw-semibold">${formattedDate}</span>
                    </td>
                    
                    <td>
                        <span class="badge bg-primary-transparent" 
                              style="font-size: 0.9em; cursor: pointer;"
                              onclick="showAccoladeDetails(${JSON.stringify(req.accolade_ids)})">
                            ${req.accolade_ids.length} Accolades
                        </span>
                    </td>
                    
                    <td>
                        <span class="badge bg-success-transparent" 
                              style="font-size: 0.9em; cursor: pointer;"
                              onclick="showApprovedMembers(5)">
                            <i class="ri-checkbox-circle-line me-1"></i>
                            5
                        </span>
                    </td>
                    
                    <td>
                        <span class="badge bg-danger-transparent" 
                              style="font-size: 0.9em; cursor: pointer;"
                              onclick="showDeclinedMembers(3)">
                            <i class="ri-close-circle-line me-1"></i>
                            3
                        </span>
                    </td>
                    
                    <td>
                        ${req.pickup_status 
                            ? `<div class="d-flex flex-column" style="min-width: 80px;">
                                <span class="badge bg-success-transparent mb-1" style="width: fit-content;">
                                    <i class="ri-checkbox-circle-line me-1"></i>
                                    Picked Up
                                </span>
                                <small class="text-muted">
                                    <i class="ri-calendar-line me-1"></i>
                                    ${req.pickup_date ? new Date(req.pickup_date).toLocaleDateString() : 'N/A'}
                                </small>
                               </div>`
                            : `<span class="badge bg-warning-transparent" style="width: fit-content;">
                                <i class="ri-time-line me-1"></i>
                                Yet to be Picked
                               </span>`
                        }
                    </td>
                    
                    <td>
                        <span class="badge bg-warning-transparent" style="width: fit-content;">
                            <i class="ri-time-line me-1"></i>
                            N/A
                        </span>
                    </td>
                </tr>
            `;
        }).join('');

        tableBody.innerHTML = tableContent;

    } catch (error) {
        console.error('❌ Error:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-danger">
                    Error loading data. Please try again later.
                </td>
            </tr>
        `;
    }
});

// Add some custom styles
const style = document.createElement('style');
style.textContent = `
    .bg-primary-transparent {
        background-color: rgba(63, 131, 248, 0.15) !important;
        color: #0055ff !important;
        font-weight: 600 !important;
    }
    
    .bg-success-transparent {
        background-color: rgba(34, 197, 94, 0.15) !important;
        color: #059669 !important;
        font-weight: 600 !important;
    }
    
    .bg-danger-transparent {
        background-color: rgba(239, 68, 68, 0.15) !important;
        color: #dc2626 !important;
        font-weight: 600 !important;
    }
    
    .bg-warning-transparent {
        background-color: rgba(245, 158, 11, 0.15) !important;
        color: #d97706 !important;
        font-weight: 600 !important;
    }

    .badge {
        padding: 8px 14px;
        border-radius: 6px;
        font-weight: 500;
        border: 1px solid rgba(0, 0, 0, 0.05);
    }

    .table td {
        padding: 1rem;
        vertical-align: middle;
        font-weight: 500;
    }

    .text-muted {
        color: #4b5563 !important;
        font-weight: 500;
    }

    .table tr {
        border-bottom: 1px solid #e5e7eb;
    }

    .table tr:hover {
        background-color: #f9fafb;
    }

    .accolades-popup {
        border-radius: 12px;
    }

    .accolades-modal .swal2-html-container {
        margin: 1em 0 0 0;
    }

    .accolades-modal::-webkit-scrollbar {
        width: 8px;
    }

    .accolades-modal::-webkit-scrollbar-thumb {
        background-color: #cbd5e1;
        border-radius: 4px;
    }

    .accolades-modal::-webkit-scrollbar-track {
        background-color: #f1f5f9;
    }

    .members-popup {
        border-radius: 12px;
    }

    .members-modal .swal2-html-container {
        margin: 1em 0 0 0;
    }

    .members-modal::-webkit-scrollbar {
        width: 8px;
    }

    .members-modal::-webkit-scrollbar-thumb {
        background-color: #cbd5e1;
        border-radius: 4px;
    }

    .members-modal::-webkit-scrollbar-track {
        background-color: #f1f5f9;
    }

    .member-checkbox-item:hover {
        background-color: #f8fafc;
    }

    .member-checkbox-container::-webkit-scrollbar {
        width: 8px;
    }

    .member-checkbox-container::-webkit-scrollbar-thumb {
        background-color: #cbd5e1;
        border-radius: 4px;
    }

    .member-checkbox-container::-webkit-scrollbar-track {
        background-color: #f1f5f9;
    }
`;

document.head.appendChild(style);

// Update showAccoladeDetails function
async function showAccoladeDetails(accoladeIds) {
    try {
        console.log('🎯 Showing accolade details for IDs:', accoladeIds);
        
        const response = await fetch('https://backend.bninewdelhi.com/api/accolades');
        const allAccolades = await response.json();
        
        // Filter accolades based on IDs from requisition
        const selectedAccolades = allAccolades.filter(accolade => 
            accoladeIds.includes(accolade.accolade_id)
        );
        
        console.log('📊 Selected Accolades:', selectedAccolades);

        const accoladesHtml = selectedAccolades.map(accolade => `
            <div class="accolade-item" style="
                display: flex;
                align-items: center;
                padding: 12px;
                margin-bottom: 12px;
                border-radius: 8px;
                background: ${accolade.accolade_type === 'Global' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
                border-left: 4px solid ${accolade.accolade_type === 'Global' ? '#2563eb' : '#dc2626'};
            ">
                <div style="flex: 1;">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                        <span class="badge" style="
                            background: ${accolade.accolade_type === 'Global' ? '#2563eb' : '#dc2626'};
                            color: white;
                            padding: 4px 8px;
                            border-radius: 4px;
                            font-size: 0.75rem;
                        ">${accolade.accolade_type}</span>
                        <strong style="color: #1f2937;">${accolade.accolade_name}</strong>
                    </div>
                    <div style="color: #6b7280; font-size: 0.9em;">
                        ${accolade.eligibility_and_condition}
                    </div>
                </div>
                <div style="
                    padding: 8px 12px;
                    background: white;
                    border-radius: 6px;
                    color: #374151;
                    font-weight: 500;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                ">
                    ₹${accolade.accolade_price || 'N/A'}
                </div>
            </div>
        `).join('');

        Swal.fire({
            title: '<span style="color: #2563eb;"><i class="ri-award-line"></i> Requested Accolades</span>',
            html: `
                <div style="max-height: 400px; overflow-y: auto; padding: 10px;">
                    ${accoladesHtml}
                </div>
            `,
            width: 600,
            showCloseButton: true,
            showConfirmButton: false,
            customClass: {
                container: 'accolades-modal',
                popup: 'accolades-popup',
            }
        });

    } catch (error) {
        console.error('❌ Error fetching accolades:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load accolades details'
        });
    }
}

// Add these functions to handle approved and declined clicks
function showApprovedMembers(approvedCount) {
    // Core members that should always be included
    const coreMembers = [
        {
            name: 'Prince Sachdeva',
            accolades: ['BNI Name Badge']
        },
        {
            name: 'Raja Shukla',
            accolades: ['BNI Name Badge']
        },
        {
            name: 'Aditya Sachdeva',
            accolades: ['Core Group Pin']
        }
    ];
    
    // Additional members
    const additionalMembers = [
        {
            name: 'Vikram Mehta',
            accolades: ['BNI Name Badge']
        },
        {
            name: 'Rahul Sharma',
            accolades: ['Core Group Pin']
        }
        // ... other members
    ];
    
    // Get random additional members
    const randomAdditional = additionalMembers
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.max(0, approvedCount - coreMembers.length));
    
    // Combine core and additional members
    const approvedMembers = [...coreMembers, ...randomAdditional];
    
    const membersHtml = approvedMembers.map(member => `
        <div class="member-item" style="
            display: flex;
            flex-direction: column;
            padding: 16px;
            margin-bottom: 15px;
            border-radius: 8px;
            background: rgba(34, 197, 94, 0.1);
            border-left: 4px solid #22c55e;
        ">
            <div style="
                display: flex;
                align-items: center;
                margin-bottom: 10px;
            ">
                <div style="
                    width: 40px;
                    height: 40px;
                    background: #22c55e;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 12px;
                ">
                    <i class="ri-user-smile-line" style="color: white; font-size: 1.3em;"></i>
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: #065f46; font-size: 1.1em;">
                        ${member.name}
                    </div>
                    <div style="font-size: 0.85em; color: #059669;">
                        <i class="ri-checkbox-circle-line"></i> Approved
                    </div>
                </div>
            </div>
            
            <!-- Accolades Section -->
            <div style="
                margin-left: 52px;
                padding: 10px;
                background: white;
                border-radius: 6px;
            ">
                <div style="
                    font-size: 0.85em;
                    color: #059669;
                    margin-bottom: 8px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                ">
                    <i class="ri-award-line"></i>
                    Approved Accolades
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                    ${member.accolades.map(accolade => `
                        <span style="
                            padding: 4px 8px;
                            background: #f0fdf4;
                            border: 1px solid #86efac;
                            border-radius: 4px;
                            font-size: 0.8em;
                            color: #15803d;
                            display: flex;
                            align-items: center;
                            gap: 4px;
                        ">
                            <i class="ri-medal-line"></i>
                            ${accolade}
                        </span>
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('');

    Swal.fire({
        title: '<span style="color: #22c55e;"><i class="ri-checkbox-circle-line"></i> Approved Accolades</span>',
        html: `
            <div style="max-height: 500px; overflow-y: auto; padding: 10px;">
                ${membersHtml}
            </div>
        `,
        width: 600,
        showCloseButton: true,
        showConfirmButton: false,
        customClass: {
            container: 'members-modal',
            popup: 'members-popup'
        }
    });
}

function showDeclinedMembers(declinedCount) {
    // Core members that should always be included
    const coreMembers = [
        {
            name: 'Prince Sachdeva',
            accolades: ['Leadership Pin']
        },
        {
            name: 'Raja Shukla',
            accolades: ['Core Group Pin']
        },
        {
            name: 'Aditya Sachdeva',
            accolades: ['Membership Pin']
        }
    ];
    
    // Additional members
    const additionalMembers = [
        {
            name: 'Vikram Mehta',
            accolades: ['BNI Name Badge']
        },
        {
            name: 'Rahul Sharma',
            accolades: ['Leadership Pin']
        }
        // ... other members
    ];
    
    // Get random additional members
    const randomAdditional = additionalMembers
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.max(0, declinedCount - coreMembers.length));
    
    // Combine core and additional members
    const declinedMembers = [...coreMembers, ...randomAdditional];
    
    const membersHtml = declinedMembers.map(member => `
        <div class="member-item" style="
            display: flex;
            flex-direction: column;
            padding: 16px;
            margin-bottom: 15px;
            border-radius: 8px;
            background: rgba(239, 68, 68, 0.1);
            border-left: 4px solid #ef4444;
        ">
            <div style="
                display: flex;
                align-items: center;
                margin-bottom: 10px;
            ">
                <div style="
                    width: 40px;
                    height: 40px;
                    background: #ef4444;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 12px;
                ">
                    <i class="ri-user-unfollow-line" style="color: white; font-size: 1.3em;"></i>
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: #991b1b; font-size: 1.1em;">
                        ${member.name}
                    </div>
                    <div style="font-size: 0.85em; color: #dc2626;">
                        <i class="ri-close-circle-line"></i> Declined
                    </div>
                </div>
            </div>
            
            <!-- Accolades Section -->
            <div style="
                margin-left: 52px;
                padding: 10px;
                background: white;
                border-radius: 6px;
            ">
                <div style="
                    font-size: 0.85em;
                    color: #dc2626;
                    margin-bottom: 8px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                ">
                    <i class="ri-award-line"></i>
                    Declined Accolades
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                    ${member.accolades.map(accolade => `
                        <span style="
                            padding: 4px 8px;
                            background: #fef2f2;
                            border: 1px solid #fca5a5;
                            border-radius: 4px;
                            font-size: 0.8em;
                            color: #b91c1c;
                            display: flex;
                            align-items: center;
                            gap: 4px;
                        ">
                            <i class="ri-medal-line"></i>
                            ${accolade}
                        </span>
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('');

    Swal.fire({
        title: '<span style="color: #dc2626;"><i class="ri-close-circle-line"></i> Declined Accolades</span>',
        html: `
            <div style="max-height: 500px; overflow-y: auto; padding: 10px;">
                ${membersHtml}
            </div>
        `,
        width: 600,
        showCloseButton: true,
        showConfirmButton: false,
        customClass: {
            container: 'members-modal',
            popup: 'members-popup'
        }
    });
}

// Add click handler for "Apply Requisition" button
document.querySelector('.action-button button').addEventListener('click', showRequisitionForm);

async function showRequisitionForm() {
    try {
        // Fetch accolades and members
        const [accoladesResponse, membersResponse] = await Promise.all([
            fetch('https://backend.bninewdelhi.com/api/accolades'),
            fetch('https://backend.bninewdelhi.com/api/members')
        ]);
        
        const accolades = await accoladesResponse.json();
        const members = await membersResponse.json();

        // Track selected assignments
        let assignments = [];
        let currentSno = 1;

        const formHtml = `
            <div class="requisition-container" style="
                display: flex;
                gap: 20px;
                height: 700px;
            ">
                <!-- Left Panel - Form -->
                <div class="form-panel" style="
                    flex: 1;
                    padding: 25px;
                    background: #f8fafc;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                ">
                    <h3 style="
                        font-size: 1.2em;
                        color: #334155;
                        margin-bottom: 25px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    ">
                        <i class="ri-file-add-line"></i> New Requisition
                    </h3>

                    <!-- Accolade Selection with Checkboxes -->
                    <div class="form-group mb-4">
                        <label style="
                            display: block;
                            margin-bottom: 10px;
                            color: #475569;
                            font-size: 0.95em;
                            font-weight: 500;
                        ">
                            <i class="ri-award-line me-1"></i> Select Accolades
                        </label>
                        <div class="accolade-checkbox-container" style="
                            max-height: 200px;
                            overflow-y: auto;
                            border: 1px solid #cbd5e1;
                            border-radius: 6px;
                            background-color: white;
                            padding: 5px;
                        ">
                            ${accolades.map(a => `
                                <div class="accolade-checkbox-item" style="
                                    padding: 8px 12px;
                                    display: flex;
                                    align-items: center;
                                    gap: 10px;
                                    border-bottom: 1px solid #f1f5f9;
                                ">
                                    <input type="checkbox" 
                                           id="accolade-${a.accolade_id}" 
                                           value="${a.accolade_id}"
                                           class="accolade-checkbox"
                                           style="width: 16px; height: 16px;"
                                    >
                                    <label for="accolade-${a.accolade_id}" style="
                                        margin: 0;
                                        cursor: pointer;
                                        flex: 1;
                                        display: flex;
                                        align-items: center;
                                        justify-content: space-between;
                                    ">
                                        ${a.accolade_name}
                                        <span style="color: #64748b; font-size: 0.9em;">₹${a.accolade_price || 'N/A'}</span>
                                    </label>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Multiple Member Selection with Checkboxes -->
                    <div class="form-group mb-4">
                        <label style="
                            display: block;
                            margin-bottom: 10px;
                            color: #475569;
                            font-size: 0.95em;
                            font-weight: 500;
                        ">
                            <i class="ri-team-line me-1"></i> Select Members
                        </label>
                        <div class="member-checkbox-container" style="
                            max-height: 200px;
                            overflow-y: auto;
                            border: 1px solid #cbd5e1;
                            border-radius: 6px;
                            background-color: white;
                            padding: 5px;
                        ">
                            ${members.map(m => `
                                <div class="member-checkbox-item" style="
                                    padding: 8px 12px;
                                    display: flex;
                                    align-items: center;
                                    gap: 10px;
                                    border-bottom: 1px solid #f1f5f9;
                                    transition: background-color 0.2s;
                                    cursor: pointer;
                                ">
                                    <input type="checkbox" 
                                           id="member-${m.member_id}" 
                                           value="${m.member_id}"
                                           style="width: 16px; height: 16px; cursor: pointer;"
                                    >
                                    <label for="member-${m.member_id}" style="
                                        margin: 0;
                                        cursor: pointer;
                                        flex: 1;
                                        display: flex;
                                        align-items: center;
                                        gap: 8px;
                                    ">
                                        <i class="ri-user-line" style="color: #64748b;"></i>
                                        ${m.member_first_name} ${m.member_last_name}
                                    </label>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Comment Field -->
                    <div class="form-group mb-4">
                        <label style="
                            display: block;
                            margin-bottom: 10px;
                            color: #475569;
                            font-size: 0.95em;
                            font-weight: 500;
                        ">
                            <i class="ri-chat-1-line me-1"></i> Comment
                        </label>
                        <textarea id="commentInput" class="form-control" rows="4" style="
                            width: 100%;
                            padding: 10px 14px;
                            border: 1px solid #cbd5e1;
                            border-radius: 6px;
                            resize: none;
                            background-color: white;
                            font-size: 1em;
                        "></textarea>
                    </div>

                    <!-- Updated Button Text -->
                    <button onclick="addAssignment()" class="btn btn-primary w-100" style="
                        background: #2563eb;
                        border: none;
                        padding: 12px;
                        border-radius: 6px;
                        color: white;
                        font-weight: 500;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        font-size: 1em;
                    ">
                        <i class="ri-file-add-line"></i> Apply Requisition
                    </button>
                </div>

                <!-- Right Panel - Assignments List -->
                <div class="assignments-panel" style="
                    flex: 1;
                    padding: 25px;
                    background: #f8fafc;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    overflow-y: auto;
                ">
                    <h3 style="
                        font-size: 1.2em;
                        color: #334155;
                        margin-bottom: 25px;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    ">
                        <i class="ri-list-check"></i> Added Requisitions
                    </h3>
                    <div id="assignmentsList"></div>
                </div>
            </div>
        `;

        Swal.fire({
            title: '<span style="color: #2563eb;"><i class="ri-file-list-3-line"></i> Create New Requisition</span>',
            html: formHtml,
            width: 1200,
            height: 800,
            showCloseButton: true,
            showConfirmButton: true,
            confirmButtonText: 'Submit Requisition',
            confirmButtonColor: '#2563eb',
            customClass: {
                container: 'requisition-modal',
                popup: 'requisition-popup'
            },
            preConfirm: async () => {
                // Check if there are any assignments
                if (assignments.length === 0) {
                    Swal.showValidationMessage('Please add at least one assignment before submitting');
                    return false;
                }

                try {
                    // Group assignments by member and accolade
                    const uniqueMembers = [...new Set(assignments.map(a => a.member.member_id))];
                    const uniqueAccolades = [...new Set(assignments.map(a => a.accolade.accolade_id))];
                    
                    // Prepare data for API
                    const chapterRequisitionData = {
                        member_ids: uniqueMembers,
                        chapter_id: assignments[0].member.chapter_id,
                        accolade_ids: uniqueAccolades,
                        comment: assignments[0].comment,
                        request_status: 'open',
                        ro_comment: null,
                        pickup_status: false,
                        pickup_date: null
                    };

                    console.log('🚀 Sending Chapter Requisition Data:', chapterRequisitionData);

                    // Make API call
                    const response = await fetch('https://backend.bninewdelhi.com/api/chapter-requisition', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(chapterRequisitionData)
                    });

                    const result = await response.json();
                    console.log('✅ API Response:', result);

                    if (!response.ok) {
                        throw new Error(result.message || 'Failed to submit requisition');
                    }

                    return true;

                } catch (error) {
                    console.error('❌ Error:', error);
                    Swal.showValidationMessage(`Submission failed: ${error.message}`);
                    return false;
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    icon: 'success',
                    title: '<span style="color: #059669;">Success!</span>',
                    html: `
                        <div style="
                            padding: 20px;
                            background: rgba(34, 197, 94, 0.1);
                            border-radius: 8px;
                            margin: 20px 0;
                        ">
                            <div style="
                                color: #059669;
                                font-size: 1.1em;
                                margin-bottom: 10px;
                                display: flex;
                                align-items: center;
                                gap: 8px;
                                justify-content: center;
                            ">
                                <i class="ri-checkbox-circle-line"></i>
                                Requisition Submitted Successfully
                            </div>
                            <div style="
                                color: #065f46;
                                font-size: 0.9em;
                                text-align: center;
                            ">
                                Your requisition has been processed and will be reviewed shortly.
                            </div>
                        </div>
                    `,
                    showConfirmButton: true,
                    confirmButtonText: 'Done',
                    confirmButtonColor: '#059669',
                    customClass: {
                        popup: 'success-popup'
                    }
                }).then(() => {
                    // Optional: Refresh the page or update the table
                    window.location.reload();
                });
            }
        });

        // Function to add new assignment
        window.addAssignment = function() {
            const selectedAccolades = Array.from(document.querySelectorAll('.accolade-checkbox:checked'))
                .map(checkbox => accolades.find(a => a.accolade_id === parseInt(checkbox.value)));
            const commentInput = document.getElementById('commentInput');
            const selectedCheckboxes = document.querySelectorAll('.member-checkbox-container input[type="checkbox"]:checked');

            if (selectedAccolades.length === 0 || selectedCheckboxes.length === 0 || !commentInput.value.trim()) {
                Swal.showValidationMessage('Please select at least one accolade, one member, and add a comment');
                return;
            }

            // Add an assignment for each selected member and accolade combination
            selectedCheckboxes.forEach(memberCheckbox => {
                const member = members.find(m => m.member_id === parseInt(memberCheckbox.value));
                selectedAccolades.forEach(accolade => {
                    assignments.push({
                        sno: currentSno++,
                        accolade,
                        member,
                        comment: commentInput.value.trim()
                    });
                });
            });

            renderAssignments();
            
            // Reset form
            document.querySelectorAll('.accolade-checkbox').forEach(checkbox => checkbox.checked = false);
            selectedCheckboxes.forEach(checkbox => checkbox.checked = false);
            commentInput.value = '';
        };

        // Function to render assignments
        function renderAssignments() {
            const assignmentsList = document.getElementById('assignmentsList');
            assignmentsList.innerHTML = assignments.map(assignment => `
                <div class="assignment-item" style="
                    background: white;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 12px;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                ">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                        <span style="
                            background: #2563eb;
                            color: white;
                            width: 24px;
                            height: 24px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 0.8em;
                        ">${assignment.sno}</span>
                        <strong style="color: #1e40af;">${assignment.accolade.accolade_name}</strong>
                    </div>
                    
                    <div style="
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        margin-bottom: 8px;
                        color: #475569;
                    ">
                        <i class="ri-user-line"></i>
                        ${assignment.member.member_first_name} ${assignment.member.member_last_name}
                    </div>
                    
                    <div style="
                        color: #64748b;
                        font-size: 0.9em;
                        padding: 8px;
                        background: #f1f5f9;
                        border-radius: 4px;
                    ">
                        <i class="ri-chat-1-line me-1"></i>
                        ${assignment.comment}
                    </div>
                </div>
            `).join('');
        }

    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load form data'
        });
    }
}

// Add success popup styling
const successStyles = `
    .success-popup {
        border-radius: 12px;
        padding: 10px;
    }
    
    .success-popup .swal2-icon {
        border-color: #059669;
        color: #059669;
    }
    
    .success-popup .swal2-confirm {
        box-shadow: 0 4px 6px rgba(5, 150, 105, 0.2);
    }
    
    .success-popup .swal2-confirm:hover {
        background-color: #047857 !important;
    }
`;

style.textContent += successStyles;
