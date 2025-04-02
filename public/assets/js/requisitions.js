document.addEventListener('DOMContentLoaded', async function() {
    const tableBody = document.getElementById('chaptersTableBody');
    
    try {
        console.log('🚀 Starting data fetch process...');
        
        // Step 1: Get user type and chapter info
        const loginType = getUserLoginType();
        let userEmail, userChapter;

        if (loginType === 'ro_admin') {
            // For RO admin, get chapter info from localStorage
            const currentChapterEmail = localStorage.getItem('current_chapter_email');
            const currentChapterId = localStorage.getItem('current_chapter_id');
            
            console.log('👤 RO Admin accessing chapter:', { currentChapterEmail, currentChapterId });
            
            // Step 2: Fetch chapter data to get full chapter details
            const chaptersResponse = await fetch('https://bni-data-backend.onrender.com/api/chapters');
            const chapters = await chaptersResponse.json();
            console.log('📚 All Chapters:', chapters);
            
            userChapter = chapters.find(chapter => chapter.chapter_id === parseInt(currentChapterId));
        } else {
            // For regular users, use email-based lookup
            userEmail = getUserEmail();
            console.log('👤 User Email:', userEmail);
            
            // Step 2: Fetch chapter data and find matching chapter
            const chaptersResponse = await fetch('https://bni-data-backend.onrender.com/api/chapters');
            const chapters = await chaptersResponse.json();
            console.log('📚 All Chapters:', chapters);
            
            userChapter = chapters.find(chapter => chapter.email_id === userEmail);
        }

        if (!userChapter) {
            console.error('❌ No matching chapter found:', loginType === 'ro_admin' ? 'Chapter ID not found' : 'Email not found');
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
            // Parse approve status to get counts
            let approvedCount = 0;
            let declinedCount = 0;
            try {
                const approveStatus = JSON.parse(req.approve_status || '{}');
                approvedCount = Object.values(approveStatus).filter(status => status === 'approved').length;
                declinedCount = Object.values(approveStatus).filter(status => status === 'declined').length;
                console.log('📊 Status counts:', { approvedCount, declinedCount });
            } catch (e) {
                console.error('❌ Error parsing approve status:', e);
            }

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
                              onclick="showApprovedMembers(${req.chapter_requisition_id})">
                            <i class="ri-checkbox-circle-line me-1"></i>
                            ${approvedCount} Approved
                        </span>
                    </td>
                    
                    <td>
                        <span class="badge bg-danger-transparent" 
                              style="font-size: 0.9em; cursor: pointer;"
                              onclick="showDeclinedMembers(${req.chapter_requisition_id})">
                            <i class="ri-close-circle-line me-1"></i>
                            ${declinedCount} Declined
                        </span>
                    </td>
                    
                    <td>
                        ${req.pickup_status 
                            ? `<div class="d-flex flex-column" style="min-width: 80px;">
                                <span class="badge ${req.pickup_date ? 'bg-success-transparent' : 'bg-primary-transparent'} mb-1" 
                                      style="width: fit-content; cursor: pointer;"
                                      onclick="handlePickupDateUpdate(${req.chapter_requisition_id}, '${req.pickup_date || ''}')">
                                    <i class="${req.pickup_date ? 'ri-checkbox-circle-line' : 'ri-calendar-check-line'} me-1"></i>
                                    ${req.pickup_date ? 'Picked Up' : 'Ready to Pick Up'}
                                </span>
                                ${req.pickup_date && req.pickup_date !== 'null' && req.pickup_date !== null
                                    ? `<small class="text-muted">
                                        <i class="ri-calendar-line me-1"></i>
                                        ${new Date(req.pickup_date).toLocaleDateString()}
                                       </small>`
                                    : ''
                                }
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
async function showApprovedMembers(requisitionId) {
    try {
        console.log('🎯 Fetching approved members for requisition:', requisitionId);
        
        // Fetch all required data
        const [requisitionResponse, membersResponse, accoladesResponse] = await Promise.all([
            fetch('https://backend.bninewdelhi.com/api/getRequestedChapterRequisition'),
            fetch('https://backend.bninewdelhi.com/api/members'),
            fetch('https://backend.bninewdelhi.com/api/accolades')
        ]);

        const [requisitions, members, accolades] = await Promise.all([
            requisitionResponse.json(),
            membersResponse.json(),
            accoladesResponse.json()
        ]);

        // Find the specific requisition
        const requisition = requisitions.find(req => req.chapter_requisition_id === requisitionId);
        console.log('📝 Found requisition:', requisition);

        if (!requisition) {
            console.error('❌ No requisition found with ID:', requisitionId);
            return;
        }

        // Parse approve status
        const approveStatus = JSON.parse(requisition.approve_status || '{}');
        console.log('👍 Approve status:', approveStatus);

        // Get approved combinations
        const approvedCombinations = Object.entries(approveStatus)
            .filter(([key, status]) => status === 'approved')
            .map(([key]) => {
                const [memberId, accoladeId] = key.split('_').map(Number);
                const member = members.find(m => m.member_id === memberId);
                const accolade = accolades.find(a => a.accolade_id === accoladeId);
                
                return {
                    memberName: member ? `${member.member_first_name} ${member.member_last_name}` : `Member ${memberId}`,
                    accoladeName: accolade ? accolade.accolade_name : `Accolade ${accoladeId}`
                };
            });

        console.log('✅ Approved combinations:', approvedCombinations);

        // Show in SweetAlert
        const approvedHtml = approvedCombinations.map(combo => `
            <div style="
                padding: 10px;
                margin: 5px 0;
                background: #f0fdf4;
                border-radius: 6px;
                border: 1px solid #dcfce7;
            ">
                <div style="font-weight: 600; color: #166534;">
                    ${combo.memberName}
                </div>
                <div style="color: #22c55e; font-size: 0.9em;">
                    ${combo.accoladeName}
                </div>
            </div>
        `).join('');

        Swal.fire({
            title: 'Approved Members',
            html: approvedHtml || '<div class="text-muted">No approved members found</div>',
            confirmButtonText: 'Close'
        });

    } catch (error) {
        console.error('❌ Error in showApprovedMembers:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load approved members'
        });
    }
}

async function showDeclinedMembers(requisitionId) {
    try {
        console.log('🎯 Fetching declined members for requisition:', requisitionId);
        
        // Fetch all required data
        const [requisitionResponse, membersResponse, accoladesResponse] = await Promise.all([
            fetch('https://backend.bninewdelhi.com/api/getRequestedChapterRequisition'),
            fetch('https://backend.bninewdelhi.com/api/members'),
            fetch('https://backend.bninewdelhi.com/api/accolades')
        ]);

        const [requisitions, members, accolades] = await Promise.all([
            requisitionResponse.json(),
            membersResponse.json(),
            accoladesResponse.json()
        ]);

        // Find the specific requisition
        const requisition = requisitions.find(req => req.chapter_requisition_id === requisitionId);
        console.log('📝 Found requisition:', requisition);

        if (!requisition) {
            console.error('❌ No requisition found with ID:', requisitionId);
            return;
        }

        // Parse approve status
        const approveStatus = JSON.parse(requisition.approve_status || '{}');
        console.log('👎 Approve status:', approveStatus);

        // Get declined combinations
        const declinedCombinations = Object.entries(approveStatus)
            .filter(([key, status]) => status === 'declined')
            .map(([key]) => {
                const [memberId, accoladeId] = key.split('_').map(Number);
                const member = members.find(m => m.member_id === memberId);
                const accolade = accolades.find(a => a.accolade_id === accoladeId);
                
                return {
                    memberName: member ? `${member.member_first_name} ${member.member_last_name}` : `Member ${memberId}`,
                    accoladeName: accolade ? accolade.accolade_name : `Accolade ${accoladeId}`
                };
            });

        console.log('❌ Declined combinations:', declinedCombinations);

        // Show in SweetAlert
        const declinedHtml = declinedCombinations.map(combo => `
            <div style="
                padding: 10px;
                margin: 5px 0;
                background: #fef2f2;
                border-radius: 6px;
                border: 1px solid #fee2e2;
            ">
                <div style="font-weight: 600; color: #991b1b;">
                    ${combo.memberName}
                </div>
                <div style="color: #dc2626; font-size: 0.9em;">
                    ${combo.accoladeName}
                </div>
            </div>
        `).join('');

        Swal.fire({
            title: 'Declined Members',
            html: declinedHtml || '<div class="text-muted">No declined members found</div>',
            confirmButtonText: 'Close'
        });

    } catch (error) {
        console.error('❌ Error in showDeclinedMembers:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load declined members'
        });
    }
}

// Add click handler for "Apply Requisition" button
document.querySelector('.action-button button').addEventListener('click', showRequisitionForm);

async function showRequisitionForm() {
    try {
        // First get chapter info based on logged in email
        const userEmail = getUserEmail();
        const chaptersResponse = await fetch('https://backend.bninewdelhi.com/api/chapters');
        const chapters = await chaptersResponse.json();
        const currentChapter = chapters.find(chapter => chapter.email_id === userEmail);
        
        if (!currentChapter) {
            throw new Error('Chapter not found');
        }

        // Fetch all required data
        const [accoladesResponse, membersResponse, requisitionsResponse] = await Promise.all([
            fetch('https://backend.bninewdelhi.com/api/accolades'),
            fetch('https://backend.bninewdelhi.com/api/members'),
            fetch('https://backend.bninewdelhi.com/api/getRequestedMemberRequisition')
        ]);
        
        const accolades = await accoladesResponse.json();
        const members = await membersResponse.json();
        const requisitions = await requisitionsResponse.json();

        // Filter requisitions for current chapter and not approved
        const allRequisitions = requisitions.filter(req => 
            req.chapter_id === currentChapter.chapter_id && 
            req.approve_status !== 'approved'
        );

        // Track selected assignments
        let assignments = [];
        let currentSno = 1;

        const formHtml = `
            <div class="requisition-container" style="
                display: flex;
                flex-direction: column;
                gap: 20px;
                min-height: 85vh;
            ">
                <!-- Top Section - Selection Panel -->
                <div style="display: flex; gap: 20px;">
                    <!-- Accolades Section -->
                    <div style="flex: 1;">
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
                                height: 200px;
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
                                        <label for="accolade-${a.accolade_id}" style="margin: 0;">
                                            ${a.accolade_name}
                                        </label>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>

                    <!-- Members Section -->
                    <div style="flex: 1;">
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
                                height: 200px;
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
                                    ">
                                        <input type="checkbox" 
                                               id="member-${m.member_id}" 
                                               value="${m.member_id}"
                                               style="width: 16px; height: 16px;"
                                        >
                                        <label for="member-${m.member_id}" style="margin: 0;">
                                            ${m.member_first_name} ${m.member_last_name}
                                        </label>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Requisitions Section -->
                <div class="payment-status-section" style="
                    padding: 20px;
                    background: #f8fafc;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                    margin-top: 20px;
                ">
                    <h3 style="font-size: 1.2em; color: #334155; margin-bottom: 15px;">
                        <i class="ri-money-dollar-circle-line"></i> Available Requisitions
                    </h3>
                    
                    <div class="payment-grid" style="
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                        gap: 15px;
                        max-height: 200px;
                        overflow-y: auto;
                    ">
                        ${allRequisitions.map(req => {
                            const member = members.find(m => m.member_id === req.member_id);
                            const accolade = accolades.find(a => a.accolade_id === req.accolade_id);
                            
                            if (!accolade) return '';
                            
                            const isPaid = req.order_id !== null && req.accolade_amount !== null;
                            
                            return `
                                <div class="payment-item" style="
                                    background: white;
                                    padding: 12px;
                                    border-radius: 8px;
                                    border: 1px solid #e2e8f0;
                                    display: flex;
                                    align-items: center;
                                    gap: 12px;
                                ">
                                    <input type="checkbox" 
                                           style="width: 16px; height: 16px;"
                                           data-requisition-id="${req.member_request_id}"
                                    >
                                    <div style="flex: 1;">
                                        <div style="font-weight: 500; color: #1e40af;">
                                            ${member ? `${member.member_first_name} ${member.member_last_name}` : 'Unknown Member'}
                                        </div>
                                        <div style="color: #64748b; font-size: 0.9em;">
                                            ${accolade.accolade_name}
                                        </div>
                                        <div style="
                                            display: flex;
                                            justify-content: space-between;
                                            align-items: center;
                                            margin-top: 4px;
                                        ">
                                            <span style="color: ${isPaid ? '#059669' : '#0284c7'}; font-weight: 500;">
                                                ${isPaid ? `₹${req.accolade_amount}` : 'Free'}
                                            </span>
                                            <span class="badge ${isPaid ? 'bg-success-transparent' : 'bg-info-transparent'}" 
                                                  style="font-size: 0.8em;">
                                                ${isPaid ? 'Paid' : 'No Payment Required'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).filter(Boolean).join('')}
                    </div>
                </div>

                <!-- Add Button -->
                <button onclick="addAssignment()" class="btn btn-primary w-100" style="margin: 10px 0;">
                    <i class="ri-add-line me-1"></i> Add Selection
                </button>

                <!-- Assignments List -->
                <div id="assignmentsList" style="
                    max-height: 300px;
                    overflow-y: auto;
                    padding: 10px;
                    background: #f8fafc;
                    border-radius: 8px;
                "></div>
            </div>
        `;

        // Update SweetAlert configuration
        Swal.fire({
            title: 'New Requisition',
            html: formHtml,
            width: '90%',
            height: '90vh',
            showCloseButton: true,
            showConfirmButton: true,
            confirmButtonText: 'Submit Requisition',
            showCancelButton: true,
            preConfirm: async () => {
                if (assignments.length === 0) {
                    Swal.showValidationMessage('Please add at least one assignment');
                    return false;
                }

                try {
                    const uniqueMembers = [...new Set(assignments.map(a => a.member.member_id))];
                    const uniqueAccolades = [...new Set(assignments.map(a => a.accolade.accolade_id))];
                    
                    const commentsObject = {};
                    assignments.forEach(assignment => {
                        const key = `${assignment.member.member_id}_${assignment.accolade.accolade_id}`;
                        commentsObject[key] = assignment.comment || '';
                    });

                    const chapterRequisitionData = {
                        member_ids: uniqueMembers,
                        chapter_id: assignments[0].member.chapter_id,
                        accolade_ids: uniqueAccolades,
                        comment: JSON.stringify(commentsObject),
                        request_status: 'open',
                        ro_comment: null,
                        pickup_status: false,
                        pickup_date: null
                    };

                    const response = await fetch('https://backend.bninewdelhi.com/api/chapter-requisition', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(chapterRequisitionData)
                    });

                    if (!response.ok) throw new Error('Failed to submit requisition');
                    return true;
                } catch (error) {
                    Swal.showValidationMessage(`Submission failed: ${error.message}`);
                    return false;
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Requisition submitted successfully',
                    confirmButtonText: 'Done'
                }).then(() => {
                    window.location.reload();
                });
            }
        });

        // Add assignment handling function
        window.addAssignment = function() {
            // Get selections from top dropdowns (Method 1)
            const selectedAccolades = Array.from(document.querySelectorAll('.accolade-checkbox:checked'))
                .map(checkbox => accolades.find(a => a.accolade_id === parseInt(checkbox.value)));
            const selectedMembers = Array.from(document.querySelectorAll('.member-checkbox-container input[type="checkbox"]:checked'))
                .map(checkbox => members.find(m => m.member_id === parseInt(checkbox.value)));

            // Get selections from requisitions (Method 2)
            const selectedItems = Array.from(document.querySelectorAll('.payment-item input[type="checkbox"]:checked'))
                .map(checkbox => {
                    const requisitionId = parseInt(checkbox.dataset.requisitionId);
                    const requisition = allRequisitions.find(r => r.member_request_id === requisitionId);
                    return {
                        accolade: accolades.find(a => a.accolade_id === requisition.accolade_id),
                        member: members.find(m => m.member_id === requisition.member_id)
                    };
                });

            // Handle Method 1: Regular selection
            if (selectedAccolades.length > 0) {
                if (selectedMembers.length === 0) {
                    Swal.showValidationMessage('Please select at least one member');
                    return;
                }
                
                selectedMembers.forEach(member => {
                    selectedAccolades.forEach(accolade => {
                        assignments.push({
                            sno: currentSno++,
                            accolade,
                            member,
                            comment: ''
                        });
                    });
                });
            }

            // Handle Method 2: Requisition selection
            selectedItems.forEach(({ accolade, member }) => {
                if (accolade && member) {
                    assignments.push({
                        sno: currentSno++,
                        accolade,
                        member,
                        comment: ''
                    });
                }
            });

            // Validate if any assignments were added
            if (selectedAccolades.length === 0 && selectedItems.length === 0) {
                Swal.showValidationMessage('Please select either accolades or requisitions');
                return;
            }

            // Render assignments and reset checkboxes
            renderAssignments();
            document.querySelectorAll('.accolade-checkbox').forEach(checkbox => checkbox.checked = false);
            document.querySelectorAll('.member-checkbox-container input[type="checkbox"]').forEach(checkbox => checkbox.checked = false);
            document.querySelectorAll('.payment-item input[type="checkbox"]').forEach(checkbox => checkbox.checked = false);

            console.log('✅ Added new assignments:', assignments);
        };

        // Add render assignments function
        window.renderAssignments = function() {
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

            // Add event listeners for comments
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

// Add this function to handle date selection
async function handlePickupDateUpdate(requisitionId, currentDate) {
    const { value: pickupDate } = await Swal.fire({
        title: 'Select Pickup Date',
        html: `
            <div class="p-4" style="background: #f8fafc; border-radius: 12px;">
                <div class="mb-3">
                    <i class="ri-calendar-2-line text-primary" style="font-size: 2rem;"></i>
                </div>
                <p class="mb-4" style="color: #475569;">Please select the date when the accolades will be picked up.</p>
                <input type="date" 
                       id="pickup-date" 
                       class="swal2-input" 
                       value="${currentDate ? currentDate.split('T')[0] : ''}"
                       style="width: 100%; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px;">
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Confirm Date',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#16a34a',
        cancelButtonColor: '#dc2626',
        preConfirm: () => {
            const date = document.getElementById('pickup-date').value;
            if (!date) {
                Swal.showValidationMessage('Please select a date');
                return false;
            }
            return date;
        }
    });

    if (pickupDate) {
        try {
            const response = await fetch('https://backend.bninewdelhi.com/api/updateChapterRequisition', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chapter_requisition_id: requisitionId,
                    pickup_status: true,
                    pickup_date: pickupDate
                })
            });

            if (!response.ok) throw new Error('Failed to update pickup date');

            // Show success message
            await Swal.fire({
                icon: 'success',
                title: 'Pickup Date Updated!',
                text: 'The pickup date has been successfully scheduled.',
                timer: 2000,
                showConfirmButton: false
            });

            // Refresh the data
            location.reload();
        } catch (error) {
            console.error('Error updating pickup date:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: 'Failed to update pickup date. Please try again.'
            });
        }
    }
}
