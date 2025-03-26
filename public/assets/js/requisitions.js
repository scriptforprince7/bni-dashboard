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
                              onclick="showAccoladeDetails(${JSON.stringify(req.accolade_ids)}, ${req.chapter_requisition_id})">
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
async function showAccoladeDetails(accoladeIds, requisitionId) {
    try {
        // Add memberRequisitions to the parallel fetch
        const [accoladesResponse, membersResponse, requisitionResponse, memberRequisitionsResponse] = await Promise.all([
            fetch('https://bni-data-backend.onrender.com/api/accolades'),
            fetch('https://backend.bninewdelhi.com/api/members'),
            fetch('https://backend.bninewdelhi.com/api/getRequestedChapterRequisition'),
            fetch('https://backend.bninewdelhi.com/api/getRequestedMemberRequisition')
        ]);

        const [allAccolades, allMembers, allRequisitions, memberRequisitions] = await Promise.all([
            accoladesResponse.json(),
            membersResponse.json(),
            requisitionResponse.json(),
            memberRequisitionsResponse.json()
        ]);

        console.log('💰 Member Requisitions:', memberRequisitions);

        // Get the specific requisition to access comments
        const requisition = allRequisitions.find(r => r.chapter_requisition_id === requisitionId);
        console.log('📝 Requisition:', requisition);
        
        // Parse comments JSON
        const commentsMap = requisition.comment ? JSON.parse(requisition.comment) : {};
        console.log('💬 Comments Map:', commentsMap);

        // Match accolades with members and their comments
        const accoladeDetails = accoladeIds.map(accoladeId => {
            const accolade = allAccolades.find(a => a.accolade_id === accoladeId);
            const memberRequisition = memberRequisitions.find(mr => mr.accolade_id === accoladeId);
            const isPaid = memberRequisition && memberRequisition.accolade_amount !== null && memberRequisition.order_id !== null;
            
            const assignedMembers = allMembers.filter(member => 
                Object.keys(commentsMap).some(key => {
                    const [memberId, accId] = key.split('_');
                    return parseInt(memberId) === member.member_id && parseInt(accId) === accoladeId;
                })
            );

            return {
                accolade,
                isPaid,
                members: assignedMembers.map(member => ({
                    ...member,
                    comment: commentsMap[`${member.member_id}_${accoladeId}`] || ''
                }))
            };
        });

        const detailsHtml = accoladeDetails.map(detail => `
            <div class="accolade-section" style="
                background: white;
                border-radius: 12px;
                margin-bottom: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                border: 1px solid #e5e7eb;
            ">
                <!-- Accolade Header -->
                <div style="
                    background: ${detail.accolade.accolade_type === 'Global' 
                        ? 'linear-gradient(145deg, #2563eb, #1e40af)'
                        : 'linear-gradient(145deg, #dc2626, #991b1b)'};
                    padding: 15px;
                    border-radius: 12px 12px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <div style="color: white; font-size: 1.1rem; font-weight: 600;">
                        <i class="ri-award-fill me-2"></i>${detail.accolade.accolade_name}
                    </div>
                    <span style="
                        background: ${detail.accolade.accolade_type === 'Global' ? '#4f46e5' : '#e11d48'};
                        padding: 4px 12px;
                        border-radius: 9999px;
                        font-size: 0.75rem;
                        color: white;
                        font-weight: 500;
                    ">
                        ${detail.accolade.accolade_type}
                    </span>
                </div>

                <!-- Accolade Content -->
                <div style="padding: 20px;">
                    <div style="
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 15px;
                        margin-bottom: 20px;
                    ">
                        <div style="
                            padding: 12px;
                            background: #f8fafc;
                            border-radius: 8px;
                            border-left: 4px solid #2563eb;
                        ">
                            <div style="color: #64748b; font-size: 0.875rem; margin-bottom: 4px;">
                                <i class="ri-money-dollar-circle-line me-1"></i>Price
                            </div>
                            <div style="color: #1e293b; font-weight: 500;">
                                ₹${detail.accolade.accolade_price || 'N/A'}
                            </div>
                        </div>

                        <div style="
                            padding: 12px;
                            background: #f8fafc;
                            border-radius: 8px;
                            border-left: 4px solid ${detail.isPaid ? '#059669' : '#6366f1'};
                        ">
                            <div style="color: #64748b; font-size: 0.875rem; margin-bottom: 4px;">
                                <i class="ri-price-tag-3-line me-1"></i>Type
                            </div>
                            <div style="
                                color: ${detail.isPaid ? '#059669' : '#6366f1'};
                                font-weight: 500;
                                display: flex;
                                align-items: center;
                                gap: 6px;
                            ">
                                <i class="ri-${detail.isPaid ? 'shopping-cart-2' : 'gift'}-line"></i>
                                ${detail.isPaid ? 'Paid' : 'Free'}
                            </div>
                        </div>

                        <div style="
                            padding: 12px;
                            background: #f8fafc;
                            border-radius: 8px;
                            border-left: 4px solid #2563eb;
                        ">
                            <div style="color: #64748b; font-size: 0.875rem; margin-bottom: 4px;">
                                <i class="ri-file-text-line me-1"></i>Eligibility & Conditions
                            </div>
                            <div style="color: #1e293b;">
                                ${detail.accolade.eligibility_and_condition || 'No eligibility conditions available'}
                            </div>
                        </div>
                    </div>

                    <!-- Assigned Members -->
                    <div style="margin-top: 20px;">
                        <h6 style="color: #475569; margin-bottom: 15px;">
                            <i class="ri-team-line me-2"></i>Assigned Members
                        </h6>
                        ${detail.members.map(member => `
                            <div style="
                                padding: 15px;
                                background: #f8fafc;
                                border-radius: 8px;
                                margin-bottom: 10px;
                            ">
                                <div style="
                                    display: flex;
                                    align-items: center;
                                    gap: 10px;
                                    margin-bottom: 10px;
                                ">
                                    <i class="ri-user-line" style="color: #64748b;"></i>
                                    <span style="font-weight: 500; color: #1e293b;">
                                        ${member.member_first_name} ${member.member_last_name}
                                    </span>
                                </div>
                                <div style="
                                    background: white;
                                    padding: 10px;
                                    border-radius: 6px;
                                    border: 1px solid #e2e8f0;
                                ">
                                    <div style="color: #64748b; font-size: 0.875rem; margin-bottom: 4px;">
                                        <i class="ri-chat-1-line me-1"></i>Comment
                                    </div>
                                    <div style="color: #1e293b;">
                                        ${member.comment || 'No comment provided'}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `).join('');

        Swal.fire({
            title: '<span style="color: #2563eb"><i class="ri-award-line"></i> Accolade Details</span>',
            html: `
                <div style="max-height: 70vh; overflow-y: auto; padding: 20px;">
                    ${detailsHtml}
                </div>
            `,
            width: '800px',
            showCloseButton: true,
            showConfirmButton: false,
            customClass: {
                popup: 'accolades-popup'
            }
        });

    } catch (error) {
        console.error('❌ Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load accolade details'
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
                if (assignments.length === 0) {
                    Swal.showValidationMessage('Please add at least one assignment before submitting');
                    return false;
                }

                try {
                    // Group assignments by member and accolade
                    const uniqueMembers = [...new Set(assignments.map(a => a.member.member_id))];
                    const uniqueAccolades = [...new Set(assignments.map(a => a.accolade.accolade_id))];
                    
                    // Create comments object with proper structure
                    const commentsObject = {};
                    assignments.forEach(assignment => {
                        const key = `${assignment.member.member_id}_${assignment.accolade.accolade_id}`;
                        commentsObject[key] = assignment.comment || '';
                    });

                    console.log('📝 Comments Object:', commentsObject);
                    
                    // Convert to JSON string
                    const commentsJSON = JSON.stringify(commentsObject);
                    console.log('📝 Comments as JSON string:', commentsJSON);

                    const chapterRequisitionData = {
                        member_ids: uniqueMembers,
                        chapter_id: assignments[0].member.chapter_id,
                        accolade_ids: uniqueAccolades,
                        comment: commentsJSON,
                        request_status: 'open',
                        ro_comment: null,
                        pickup_status: false,
                        pickup_date: null
                    };

                    console.log('🚀 Sending Data:', chapterRequisitionData);

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
                    
                    <!-- Individual Comment Box -->
                    <div style="margin-top: 12px;">
                        <label style="
                            display: block;
                            margin-bottom: 6px;
                            color: #64748b;
                            font-size: 0.875rem;
                        ">
                            <i class="ri-chat-1-line me-1"></i>Add Comment
                        </label>
                        <textarea 
                            class="individual-comment"
                            data-sno="${assignment.sno}"
                            data-member-id="${assignment.member.member_id}"
                            data-accolade-id="${assignment.accolade.accolade_id}"
                            placeholder="Add comment for this accolade..."
                            style="
                                width: 100%;
                                padding: 8px 12px;
                                border: 1px solid #e2e8f0;
                                border-radius: 6px;
                                resize: none;
                                background-color: #f8fafc;
                                font-size: 0.875rem;
                                min-height: 60px;
                                margin-bottom: 8px;
                            "
                        >${assignment.comment || ''}</textarea>
                    </div>
                </div>
            `).join('');

            // Add event listeners for comment changes
            document.querySelectorAll('.individual-comment').forEach(textarea => {
                textarea.addEventListener('change', (e) => {
                    const sno = parseInt(e.target.dataset.sno);
                    const assignment = assignments.find(a => a.sno === sno);
                    if (assignment) {
                        assignment.comment = e.target.value;
                        console.log(`Updated comment for assignment ${sno}:`, assignment.comment);
                    }
                });
            });
        }

        // Update addAssignment function
        window.addAssignment = function() {
            const selectedAccolades = Array.from(document.querySelectorAll('.accolade-checkbox:checked'))
                .map(checkbox => accolades.find(a => a.accolade_id === parseInt(checkbox.value)));
            const selectedCheckboxes = document.querySelectorAll('.member-checkbox-container input[type="checkbox"]:checked');

            if (selectedAccolades.length === 0 || selectedCheckboxes.length === 0) {
                Swal.showValidationMessage('Please select at least one accolade and one member');
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
                        comment: '' // Initialize empty comment
                    });
                });
            });

            renderAssignments();
            
            // Reset form
            document.querySelectorAll('.accolade-checkbox').forEach(checkbox => checkbox.checked = false);
            selectedCheckboxes.forEach(checkbox => checkbox.checked = false);
        };

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
