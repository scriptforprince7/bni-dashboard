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
            const chaptersResponse = await fetch('https://backend.bninewdelhi.com/api/chapters');
            const chapters = await chaptersResponse.json();
            console.log('📚 All Chapters:', chapters);
            
            userChapter = chapters.find(chapter => chapter.chapter_id === parseInt(currentChapterId));
        } else {
            // For regular users, use email-based lookup
            userEmail = getUserEmail();
            console.log('👤 User Email:', userEmail);
            
            // Step 2: Fetch chapter data and find matching chapter
            const chaptersResponse = await fetch('https://backend.bninewdelhi.com/api/chapters');
            const chapters = await chaptersResponse.json();
            console.log('📚 All Chapters:', chapters);
            
            userChapter = chapters.find(chapter =>
                chapter.email_id === userEmail ||
                chapter.vice_president_mail === userEmail ||
                chapter.president_mail === userEmail ||
                chapter.treasurer_mail === userEmail
            );
            
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
            // Check if it's a visitor requisition
            const isVisitor = req.visitor_id !== null;
            
            let approvedCount = 0;
            let declinedCount = 0;

            if (isVisitor) {
                // For visitor requisitions - direct string comparison
                approvedCount = req.approve_status === 'approved' ? 1 : 0;
                declinedCount = req.approve_status === 'declined' ? 1 : 0;
            } else {
                // For member requisitions - parse JSON
                try {
                    const approveStatus = JSON.parse(req.approve_status || '{}');
                    approvedCount = Object.values(approveStatus).filter(status => status === 'approved').length;
                    declinedCount = Object.values(approveStatus).filter(status => status === 'declined').length;
                } catch (e) {
                    console.error('Error parsing approve status:', e);
                }
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
                            ${(() => {
                                // For visitor requisitions
                                if (req.visitor_id !== null) {
                                    return `1 accolade, 1 member`;
                                }
                                
                                // For regular requisitions
                                try {
                                    // Count members from the comment object which contains all assignments
                                    const comments = JSON.parse(req.comment || '{}');
                                    const uniqueMembers = new Set();
                                    
                                    // Extract unique member IDs from the comment keys
                                    Object.keys(comments).forEach(key => {
                                        const [memberId] = key.split('_');
                                        uniqueMembers.add(memberId);
                                    });
                                    
                                    return `${req.accolade_ids.length} accolade${req.accolade_ids.length > 1 ? 's' : ''}, ${uniqueMembers.size} member${uniqueMembers.size > 1 ? 's' : ''}`;
                                } catch (e) {
                                    console.error('Error parsing comments:', e);
                                    return `${req.accolade_ids.length} accolade${req.accolade_ids.length > 1 ? 's' : ''}`;
                                }
                            })()}
                        </span>
                    </td>

                    <td>
                        <span class="badge bg-info-transparent" 
                              style="font-size: 0.9em; cursor: pointer;"
                              onclick="showTotalAccoladesDetails(${req.chapter_requisition_id})"
                              title="Click to view member-wise details">
                            <i class="ri-stack-line me-1"></i>
                            ${(() => {
                                if (req.visitor_id !== null) {
                                    return '1 total'; // For visitor requisitions
                                }
                                try {
                                    const comments = JSON.parse(req.comment || '{}');
                                    // Simply count the number of pairs in comments object
                                    const totalAccolades = Object.keys(comments).length;
                                    return `${totalAccolades} total`;
                                } catch (e) {
                                    console.error('Error calculating total accolades:', e);
                                    return '0 total';
                                }
                            })()}
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
  <span class="badge"
        style="background-color: rgba(138, 43, 226, 0.15); 
               color: #8a2be2; 
               font-size: 0.95em; 
               padding: 6px 14px; 
               border-radius: 30px;
               font-weight: 600;
               box-shadow: 0 2px 6px rgba(138, 43, 226, 0.2);
               display: inline-block;
               border: 1px solid rgba(138, 43, 226, 0.25);
               backdrop-filter: blur(2px);">
    ${req.slab_wise_comment}
  </span>
</td>

<td>
    <div style="
        display: flex;
        flex-direction: column;
        gap: 8px;
    ">
        <!-- Status Badge -->
        <div style="
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            border-radius: 6px;
            font-weight: 500;
            font-size: 0.875rem;
            ${req.pick_up_status_ro === 'ready_for_pickup' ? `
                background: #dcfce7;
                color: #16a34a;
            ` : req.pick_up_status_ro === 'picked_up' ? `
                background: #dbeafe;
                color: #2563eb;
            ` : req.pick_up_status_ro === 'pickup_failed' ? `
                background: #fee2e2;
                color: #dc2626;
            ` : `
                background: #f3f4f6;
                color: #6b7280;
            `}
        ">
            <i class="ri-${
                req.pick_up_status_ro === 'ready_for_pickup' ? 'checkbox-circle' : 
                req.pick_up_status_ro === 'picked_up' ? 'check-double' :
                req.pick_up_status_ro === 'pickup_failed' ? 'close-circle' : 
                'time'}-line">
            </i>
            ${
                req.pick_up_status_ro === 'ready_for_pickup' ? 'Ready for Pickup' :
                req.pick_up_status_ro === 'picked_up' ? 'Picked Up' :
                req.pick_up_status_ro === 'pickup_failed' ? 'Pickup Failed' :
                'Yet to be Ready'
            }
        </div>

        <!-- Comment Section (if exists) -->
        ${req.pick_up_status_ro_comment ? `
            <div style="
                display: inline-flex;
                align-items: center;
                gap: 4px;
                font-size: 0.8rem;
                color: #64748b;
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 4px;
                transition: all 0.2s ease;
                background: #f8fafc;
                border: 1px solid #e2e8f0;
            "
            onclick="showPickupComment('${req.pick_up_status_ro_comment.replace(/'/g, "\\'")}')"
            onmouseover="this.style.background='#f1f5f9'"
            onmouseout="this.style.background='#f8fafc'"
            >
                <i class="ri-chat-1-line"></i>
                <span style="
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 150px;
                ">${req.pick_up_status_ro_comment}</span>
                <i class="ri-arrow-right-s-line" style="color: #94a3b8;"></i>
            </div>
        ` : ''}
    </div>
</td>



                    
                    <td>
                        ${req.pickup_status 
                            ? `<div class="d-flex flex-column" style="min-width: 80px;">
                                <span class="badge ${req.pickup_date ? 'bg-success-transparent' : 'bg-primary-transparent'} mb-1" 
                                      style="width: fit-content; ${req.pickup_date ? '' : 'cursor: pointer;'}"
                                      ${req.pickup_date ? '' : `onclick="handlePickupDateUpdate(${req.chapter_requisition_id}, '${new Date().toISOString().split('T')[0]}')"` }>
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
                        <button 
                            class="btn ${(req.pickup_status && req.pickup_date) ? 'btn-info' : 'btn-secondary'} btn-sm"
                            onclick="showGivenStatusModal(${req.chapter_requisition_id})"
                            ${(!req.pickup_status || !req.pickup_date) ? 'disabled' : ''}
                            title="${!req.pickup_status ? 'Please set pickup status first' : 
                                   (req.pickup_status && !req.pickup_date) ? 'Please set pickup date first' : 
                                   'View/Update Given Status'}"
                            style="${(!req.pickup_status || !req.pickup_date) ? 'opacity: 0.65; filter: grayscale(100%);' : ''}"
                        >
                            <i class="ri-gift-line me-1"></i>
                            Given Status
                        </button>
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

    /* Styles for disabled Given Status button */
    .btn-secondary.btn-sm[disabled] {
        opacity: 0.65;
        cursor: not-allowed;
        background-color: #cbd5e1;
        border-color: #cbd5e1;
        filter: grayscale(100%);
        transition: all 0.3s ease;
    }

    .btn-secondary.btn-sm[disabled]:hover {
        background-color: #cbd5e1;
        border-color: #cbd5e1;
        opacity: 0.65;
    }
`;

document.head.appendChild(style);

// Add custom styles for toast notifications
const toastStyles = `
    .delete-confirmation-popup {
        padding: 1rem !important;
        margin-top: 1rem !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        min-width: 300px !important;
        border-radius: 8px !important;
        background: white !important;
        z-index: 9999 !important;
    }

    .delete-confirmation-popup .swal2-title {
        font-size: 1rem !important;
        margin-bottom: 0.5rem !important;
    }

    .delete-confirmation-popup .swal2-html-container {
        font-size: 0.875rem !important;
        margin: 0 !important;
    }

    .delete-confirmation-popup .swal2-actions {
        margin-top: 1rem !important;
    }

    .delete-success-popup {
        padding: 0.75rem !important;
        margin-top: 1rem !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        min-width: 250px !important;
        border-radius: 8px !important;
        background: #f0fdf4 !important;
        border: 1px solid #dcfce7 !important;
        z-index: 9999 !important;
    }

    .delete-success-popup .swal2-title {
        color: #166534 !important;
        font-size: 0.875rem !important;
    }

    .delete-success-popup .swal2-icon {
        margin: 0.5rem auto !important;
    }
`;

style.textContent += toastStyles;

// Add custom toast notification styles
const customToastStyles = `
    .custom-toast {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 10px 20px;
        background: #f0fdf4;
        border: 1px solid #dcfce7;
        border-radius: 6px;
        color: #166534;
        font-size: 14px;
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 8px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        animation: slideIn 0.3s ease-out;
    }

    .custom-toast.warning {
        background: #fff7ed;
        border: 1px solid #ffedd5;
        color: #c2410c;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes fadeOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;

style.textContent += customToastStyles;

// Function to show custom toast notification
function showCustomToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;
    toast.innerHTML = `
        <i class="ri-${type === 'success' ? 'check-line' : 'error-warning-line'}" style="color: ${type === 'success' ? '#16a34a' : '#c2410c'};"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);

    // Remove toast after 1.5 seconds
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 1500);
}

// Update showAccoladeDetails function
async function showAccoladeDetails(accoladeIds, requisitionId) {
    try {
        // Add visitors to the parallel fetch
        const [accoladesResponse, membersResponse, requisitionResponse, memberRequisitionsResponse, visitorsResponse] = await Promise.all([
            fetch('https://backend.bninewdelhi.com/api/accolades'),
            fetch('https://backend.bninewdelhi.com/api/members'),
            fetch('https://backend.bninewdelhi.com/api/getRequestedChapterRequisition'),
            fetch('https://backend.bninewdelhi.com/api/getRequestedMemberRequisition'),
            fetch('https://backend.bninewdelhi.com/api/getallvisitors')
        ]);

        const [allAccolades, allMembers, allRequisitions, memberRequisitions, visitors] = await Promise.all([
            accoladesResponse.json(),
            membersResponse.json(),
            requisitionResponse.json(),
            memberRequisitionsResponse.json(),
            visitorsResponse.json()
        ]);

        console.log('💰 Member Requisitions:', memberRequisitions);

        // Get the specific requisition to access comments
        const requisition = allRequisitions.find(r => r.chapter_requisition_id === parseInt(requisitionId));
        console.log('📝 Requisition:', requisition);
        
        // Check if this is a visitor requisition
        const isVisitorRequisition = requisition.visitor_id !== null;
        console.log('🎯 Is Visitor Requisition:', isVisitorRequisition);

        // Get visitor details if it's a visitor requisition
        let visitorName = 'Visitor';
        if (isVisitorRequisition) {
            const visitor = visitors.find(v => v.visitor_id === requisition.visitor_id);
            if (visitor) {
                visitorName = visitor.visitor_name;
                console.log('👤 Found visitor:', visitorName);
            }
        }
        
        // Parse comments JSON based on requisition type
        let commentsMap = {};
        if (isVisitorRequisition) {
            commentsMap = { 
                [`0_${accoladeIds[0]}`]: requisition.comment 
            };
        } else {
            try {
                commentsMap = requisition.comment ? JSON.parse(requisition.comment) : {};
            } catch (e) {
                console.warn('⚠️ Error parsing comment JSON:', e);
                commentsMap = {};
            }
        }
        console.log('💬 Comments Map:', commentsMap);

        // Group members by accolade for counting
        const accoladeGroups = {};
        
        if (isVisitorRequisition) {
            // For visitor requisitions, each accolade has 1 member (the visitor)
            accoladeIds.forEach(accoladeId => {
                accoladeGroups[accoladeId] = 1;
            });
        } else {
            // For regular requisitions, count members per accolade
            Object.keys(commentsMap).forEach(key => {
                const [memberId, accoladeId] = key.split('_').map(Number);
                accoladeGroups[accoladeId] = (accoladeGroups[accoladeId] || 0) + 1;
            });
        }

        // Match accolades with members and their comments
        const accoladeDetails = accoladeIds.map(accoladeId => {
            const accolade = allAccolades.find(a => a.accolade_id === accoladeId);
            const memberRequisition = memberRequisitions.find(mr => mr.accolade_id === accoladeId);
            const isPaid = memberRequisition && memberRequisition.accolade_amount !== null && memberRequisition.order_id !== null;
            
            let assignedMembers;
            if (isVisitorRequisition) {
                // For visitor requisitions, use actual visitor name
                assignedMembers = [{
                    member_id: 0,
                    member_first_name: visitorName,
                    member_last_name: '(Visitor)',
                    comment: requisition.comment
                }];
            } else {
                // Regular requisitions logic remains the same
                assignedMembers = allMembers.filter(member => 
                    Object.keys(commentsMap).some(key => {
                        const [memberId, accId] = key.split('_');
                        return parseInt(memberId) === member.member_id && parseInt(accId) === accoladeId;
                    })
                ).map(member => ({
                    ...member,
                    comment: commentsMap[`${member.member_id}_${accoladeId}`] || ''
                }));
            }

            return {
                accolade,
                isPaid,
                members: assignedMembers,
                memberCount: accoladeGroups[accoladeId] || 0
            };
        });

        const detailsHtml = `
            <div class="accolade-details-container" style="width: 100%;">
                <!-- Summary Stats -->
                <div style="
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 20px;
                    margin-bottom: 20px;
                    justify-content: center;
                    max-width: 1200px;  /* Add max-width */
                    margin-left: auto;  /* Center horizontally */
                    margin-right: auto; /* Center horizontally */
                ">
                    ${accoladeDetails.map(detail => `
                        <div style="
                            background: ${detail.accolade.accolade_type === 'Global' 
                                ? 'linear-gradient(145deg, #2563eb, #1e40af)'
                                : 'linear-gradient(145deg, #dc2626, #991b1b)'};
                            padding: 15px;
                            border-radius: 12px;
                            color: white;
                            text-align: center;  /* Center text */
                        ">
                            <div style="font-size: 0.875rem; opacity: 0.9; margin-bottom: 4px;">
                                <i class="ri-award-fill me-2"></i>${detail.accolade.accolade_name}
                            </div>
                            <div style="font-size: 1.25rem; font-weight: 600;">
                                ${detail.memberCount} ${detail.memberCount === 1 ? 'Member' : 'Members'}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Detailed Table -->
                <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                                <th style="padding: 12px 16px; text-align: left; color: #475569; font-weight: 600;">Accolade</th>
                                <th style="padding: 12px 16px; text-align: left; color: #475569; font-weight: 600;">Type</th>
                                <th style="padding: 12px 16px; text-align: left; color: #475569; font-weight: 600;">Price</th>
                                <th style="padding: 12px 16px; text-align: left; color: #475569; font-weight: 600;">Member</th>
                                <th style="padding: 12px 16px; text-align: left; color: #475569; font-weight: 600;">Status</th>
                                <th style="padding: 12px 16px; text-align: left; color: #475569; font-weight: 600;">Comment</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${accoladeDetails.map(detail => 
                                detail.members.map(member => `
                                    <tr style="border-bottom: 1px solid #e2e8f0;">
                                        <td style="padding: 12px 16px;">
                                            <div style="font-weight: 500; color: #2563eb;">
                                                <i class="ri-award-fill me-2"></i>${detail.accolade.accolade_name}
                                            </div>
                                            <div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">
                                                ${detail.accolade.eligibility_and_condition || 'No conditions'}
                                            </div>
                                        </td>
                                        <td style="padding: 12px 16px;">
                                            <span style="
                                                padding: 4px 8px;
                                                border-radius: 9999px;
                                                font-size: 0.75rem;
                                                background: ${detail.accolade.accolade_type === 'Global' ? '#e0e7ff' : '#fee2e2'};
                                                color: ${detail.accolade.accolade_type === 'Global' ? '#4f46e5' : '#dc2626'};
                                            ">
                                                ${detail.accolade.accolade_type}
                                            </span>
                                        </td>
                                        <td style="padding: 12px 16px;">
                                            <div style="color: #1e293b; font-weight: 500;">
                                                ₹${detail.accolade.accolade_price || 'N/A'}
                                            </div>
                                            <div style="font-size: 0.75rem; color: #64748b;">
                                                ${isVisitorRequisition ? 'Induction Kit' : (detail.isPaid ? 'Paid' : 'Free')}
                                            </div>
                                        </td>
                                        <td style="padding: 12px 16px;">
                                            <div style="display: flex; align-items: center; gap: 8px;">
                                                <div style="
                                                    width: 32px;
                                                    height: 32px;
                                                    border-radius: 50%;
                                                    background: #e2e8f0;
                                                    display: flex;
                                                    align-items: center;
                                                    justify-content: center;
                                                ">
                                                    <i class="ri-user-line" style="color: #64748b;"></i>
                                                </div>
                                                <div>
                                                    <div style="font-weight: 500; color: #1e293b;">
                                                        ${member.member_first_name} ${member.member_last_name}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style="padding: 12px 16px;">
                                            <span style="
                                                padding: 4px 8px;
                                                border-radius: 9999px;
                                                font-size: 0.75rem;
                                                background: #f0fdf4;
                                                color: #166534;
                                            ">
                                                <i class="ri-checkbox-circle-line me-1"></i>Approved
                                            </span>
                                        </td>
                                        <td style="padding: 12px 16px;">
                                            <div style="
                                                max-width: 200px;
                                                overflow: hidden;
                                                text-overflow: ellipsis;
                                                white-space: nowrap;
                                                color: #64748b;
                                                font-size: 0.875rem;
                                            ">
                                                ${member.comment || 'No comment provided'}
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')
                            ).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        Swal.fire({
            title: '<span style="color: #2563eb"><i class="ri-award-line"></i> Accolade Details</span>',
            html: detailsHtml,
            width: '90%',
            heightAuto: false,
            customClass: {
                container: 'accolade-details-modal',
                popup: 'accolade-details-popup',
                content: 'accolade-details-content'
            },
            showCloseButton: true,
            showConfirmButton: false,
            didOpen: () => {
                // Add custom styles to the modal
                const modalContent = document.querySelector('.accolade-details-content');
                if (modalContent) {
                    modalContent.style.maxHeight = '80vh';
                    modalContent.style.overflow = 'auto';
                }
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
        const [requisitionResponse, membersResponse, accoladesResponse, visitorsResponse] = await Promise.all([
            fetch('https://backend.bninewdelhi.com/api/getRequestedChapterRequisition'),
            fetch('https://backend.bninewdelhi.com/api/members'),
            fetch('https://backend.bninewdelhi.com/api/accolades'),
            fetch('https://backend.bninewdelhi.com/api/getallvisitors')
        ]);

        const [requisitions, members, accolades, visitors] = await Promise.all([
            requisitionResponse.json(),
            membersResponse.json(),
            accoladesResponse.json(),
            visitorsResponse.json()
        ]);

        // Find the specific requisition
        const requisition = requisitions.find(req => req.chapter_requisition_id === requisitionId);
        console.log('📝 Found requisition:', requisition);

        if (!requisition) {
            console.error('❌ No requisition found with ID:', requisitionId);
            return;
        }

        let approvedCombinations = [];

        // Check if this is a visitor requisition
        if (requisition.visitor_id) {
            // Handle visitor case
            if (requisition.approve_status === 'approved') {
                const visitor = visitors.find(v => v.visitor_id === requisition.visitor_id);
                const accolade = accolades.find(a => a.accolade_id === requisition.accolade_ids[0]);
                
                approvedCombinations = [{
                    memberName: `${visitor?.visitor_name || 'Unknown Visitor'} (Visitor)`,
                    accoladeName: accolade?.accolade_name || 'Induction Kit',
                    comment: requisition.comment || 'No comment provided',
                    roComment: requisition.ro_comment || 'No RO comment provided'
                }];
            }
        } else {
            // Handle regular member case
            try {
                const approveStatus = JSON.parse(requisition.approve_status || '{}');
                const comments = JSON.parse(requisition.comment || '{}');
                const roComments = JSON.parse(requisition.ro_comment || '{}');

                // Get all approved combinations
                approvedCombinations = Object.entries(approveStatus)
                    .filter(([key, status]) => status === 'approved')
                    .map(([key]) => {
                        const [memberId, accoladeId] = key.split('_').map(Number);
                        const member = members.find(m => m.member_id === memberId);
                        const accolade = accolades.find(a => a.accolade_id === accoladeId);
                        
                        return {
                            memberName: member ? `${member.member_first_name} ${member.member_last_name}` : `Member ${memberId}`,
                            accoladeName: accolade ? accolade.accolade_name : `Accolade ${accoladeId}`,
                            comment: comments[key] || 'No comment provided',
                            roComment: roComments[key] || 'No RO comment provided'
                        };
                    });
            } catch (e) {
                console.error('Error parsing approve status:', e);
            }
        }

        console.log('✅ Approved combinations:', approvedCombinations);

        // For showApprovedMembers function
        const approvedHtml = `
            <div class="approved-details-container" style="width: 100%;">
                <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f0fdf4; border-bottom: 2px solid #bbf7d0;">
                                <th style="padding: 12px 16px; text-align: left; color: #166534; font-weight: 600;">Member</th>
                                <th style="padding: 12px 16px; text-align: left; color: #166534; font-weight: 600;">Accolade</th>
                                <th style="padding: 12px 16px; text-align: left; color: #166534; font-weight: 600;">Status</th>
                                <th style="padding: 12px 16px; text-align: left; color: #166534; font-weight: 600;">Request Comment</th>
                                <th style="padding: 12px 16px; text-align: left; color: #166534; font-weight: 600;">RO Comment</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${approvedCombinations.map(combo => `
                                <tr style="border-bottom: 1px solid #dcfce7;">
                                    <td style="padding: 12px 16px;">
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <div style="
                                                width: 32px;
                                                height: 32px;
                                                border-radius: 50%;
                                                background: #dcfce7;
                                                display: flex;
                                                align-items: center;
                                                justify-content: center;
                                            ">
                                                <i class="ri-user-line" style="color: #15803d;"></i>
                                            </div>
                                            <div style="font-weight: 500; color: #15803d;">
                                                ${combo.memberName}
                                            </div>
                                        </div>
                                    </td>
                                    <td style="padding: 12px 16px;">
                                        <div style="color: #16a34a;">
                                            <i class="ri-award-fill me-2"></i>${combo.accoladeName}
                                        </div>
                                    </td>
                                    <td style="padding: 12px 16px;">
                                        <span style="
                                            padding: 4px 8px;
                                            border-radius: 9999px;
                                            font-size: 0.75rem;
                                            background: #dcfce7;
                                            color: #15803d;
                                        ">
                                            <i class="ri-checkbox-circle-line me-1"></i>Approved
                                        </span>
                                    </td>
                                    <td style="padding: 12px 16px;">
                                        <div style="color: #15803d; font-size: 0.875rem;">
                                            ${combo.comment}
                                        </div>
                                    </td>
                                    <td style="padding: 12px 16px;">
                                        <div style="color: #15803d; font-size: 0.875rem;">
                                            ${combo.roComment}
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // Update the Swal.fire calls to use 90% width
        Swal.fire({
            title: '<span style="color: #16a34a"><i class="ri-checkbox-circle-line me-2"></i>Approved Members</span>',
            html: approvedHtml || '<div class="text-muted">No approved members found</div>',
            width: '90%',
            confirmButtonText: 'Close',
            customClass: {
                popup: 'members-popup'
            }
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
        const [requisitionResponse, membersResponse, accoladesResponse, visitorsResponse] = await Promise.all([
            fetch('https://backend.bninewdelhi.com/api/getRequestedChapterRequisition'),
            fetch('https://backend.bninewdelhi.com/api/members'),
            fetch('https://backend.bninewdelhi.com/api/accolades'),
            fetch('https://backend.bninewdelhi.com/api/getallvisitors')
        ]);

        const [requisitions, members, accolades, visitors] = await Promise.all([
            requisitionResponse.json(),
            membersResponse.json(),
            accoladesResponse.json(),
            visitorsResponse.json()
        ]);

        // Find the specific requisition
        const requisition = requisitions.find(req => req.chapter_requisition_id === requisitionId);
        console.log('📝 Found requisition:', requisition);

        if (!requisition) {
            console.error('❌ No requisition found with ID:', requisitionId);
            return;
        }

        let declinedCombinations = [];

        // Check if this is a visitor requisition
        if (requisition.visitor_id) {
            // Handle visitor case
            if (requisition.approve_status === 'declined') {
                const visitor = visitors.find(v => v.visitor_id === requisition.visitor_id);
                const accolade = accolades.find(a => a.accolade_id === requisition.accolade_ids[0]);
                
                declinedCombinations = [{
                    memberName: `${visitor?.visitor_name || 'Unknown Visitor'} (Visitor)`,
                    accoladeName: accolade?.accolade_name || 'Induction Kit',
                    comment: requisition.comment || 'No comment provided',
                    roComment: requisition.ro_comment || 'No RO comment provided'
                }];
            }
        } else {
            // Handle regular member case
            try {
                const approveStatus = JSON.parse(requisition.approve_status || '{}');
                const comments = JSON.parse(requisition.comment || '{}');
                const roComments = JSON.parse(requisition.ro_comment || '{}');

                // Get all declined combinations
                declinedCombinations = Object.entries(approveStatus)
                    .filter(([key, status]) => status === 'declined')
                    .map(([key]) => {
                        const [memberId, accoladeId] = key.split('_').map(Number);
                        const member = members.find(m => m.member_id === memberId);
                        const accolade = accolades.find(a => a.accolade_id === accoladeId);
                        
                        return {
                            memberName: member ? `${member.member_first_name} ${member.member_last_name}` : `Member ${memberId}`,
                            accoladeName: accolade ? accolade.accolade_name : `Accolade ${accoladeId}`,
                            comment: comments[key] || 'No comment provided',
                            roComment: roComments[key] || 'No RO comment provided'
                        };
                    });
            } catch (e) {
                console.error('Error parsing approve status:', e);
            }
        }

        console.log('❌ Declined combinations:', declinedCombinations);

        // For showDeclinedMembers function
        const declinedHtml = `
            <div class="declined-details-container" style="width: 100%;">
                <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #fef2f2; border-bottom: 2px solid #fecaca;">
                                <th style="padding: 12px 16px; text-align: left; color: #991b1b; font-weight: 600;">Member</th>
                                <th style="padding: 12px 16px; text-align: left; color: #991b1b; font-weight: 600;">Accolade</th>
                                <th style="padding: 12px 16px; text-align: left; color: #991b1b; font-weight: 600;">Status</th>
                                <th style="padding: 12px 16px; text-align: left; color: #991b1b; font-weight: 600;">Request Comment</th>
                                <th style="padding: 12px 16px; text-align: left; color: #991b1b; font-weight: 600;">RO Comment</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${declinedCombinations.map(combo => `
                                <tr style="border-bottom: 1px solid #fee2e2;">
                                    <td style="padding: 12px 16px;">
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <div style="
                                                width: 32px;
                                                height: 32px;
                                                border-radius: 50%;
                                                background: #fee2e2;
                                                display: flex;
                                                align-items: center;
                                                justify-content: center;
                                            ">
                                                <i class="ri-user-line" style="color: #991b1b;"></i>
                                            </div>
                                            <div style="font-weight: 500; color: #991b1b;">
                                                ${combo.memberName}
                                            </div>
                                        </div>
                                    </td>
                                    <td style="padding: 12px 16px;">
                                        <div style="color: #dc2626;">
                                            <i class="ri-award-fill me-2"></i>${combo.accoladeName}
                                        </div>
                                    </td>
                                    <td style="padding: 12px 16px;">
                                        <span style="
                                            padding: 4px 8px;
                                            border-radius: 9999px;
                                            font-size: 0.75rem;
                                            background: #fee2e2;
                                            color: #991b1b;
                                        ">
                                            <i class="ri-close-circle-line me-1"></i>Declined
                                        </span>
                                    </td>
                                    <td style="padding: 12px 16px;">
                                        <div style="color: #991b1b; font-size: 0.875rem;">
                                            ${combo.comment}
                                        </div>
                                    </td>
                                    <td style="padding: 12px 16px;">
                                        <div style="color: #991b1b; font-size: 0.875rem;">
                                            ${combo.roComment}
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // Update the Swal.fire calls to use 90% width
        Swal.fire({
            title: '<span style="color: #dc2626"><i class="ri-close-circle-line me-2"></i>Declined Members</span>',
            html: declinedHtml || '<div class="text-muted">No declined members found</div>',
            width: '90%',
            confirmButtonText: 'Close',
            customClass: {
                popup: 'members-popup'
            }
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
        // First get chapter info based on login type
        const loginType = getUserLoginType();
        let userEmail;

        if (loginType === 'ro_admin') {
            // For RO admin, get chapter email from localStorage
            userEmail = localStorage.getItem('current_chapter_email');
            console.log('👤 RO Admin using chapter email:', userEmail);
        } else {
            // For regular users, get email from token
            userEmail = getUserEmail();
            console.log('👤 Regular user email:', userEmail);
        }

        const chaptersResponse = await fetch('https://backend.bninewdelhi.com/api/chapters');
        const chapters = await chaptersResponse.json();
        const currentChapter = chapters.find(
            (chapter) =>
              chapter.email_id === userEmail ||
              chapter.vice_president_mail === userEmail ||
              chapter.president_mail === userEmail ||
              chapter.treasurer_mail === userEmail
          );
          
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
                                margin-bottom: 15px;
                                color: #1e293b;
                                font-size: 1.1em;
                                font-weight: 600;
                            ">
                                <i class="ri-award-line me-2" style="color: #6366f1;"></i>
                                Select Accolades
                            </label>
                            <!-- Add this search bar below -->
                            <div style="margin-bottom: 10px; position: relative;">
                                <input 
                                    type="text" 
                                    id="accoladeSearchInput"
                                    placeholder="Search accolades..."
                                    style="width: 100%; padding: 8px 12px; padding-left: 35px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 0.95em; transition: all 0.2s ease; background-color: white;"
                                    oninput="filterAccolades(this.value)"
                                    onfocus="this.style.borderColor='#818cf8'"
                                    onblur="this.style.borderColor='#e2e8f0'"
                                >
                                <i class="ri-search-line" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8;"></i>
                            </div>
                            <div class="accolade-checkbox-container" style="
                                height: 200px;
                                overflow-y: auto;
                                border: 1px solid #e2e8f0;
                                border-radius: 12px;
                                background-color: white;
                                padding: 8px;
                                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                            ">
                                ${accolades.map(a => `
                                    <div class="accolade-checkbox-item" style="
                                        padding: 12px;
                                        display: flex;
                                        align-items: center;
                                        gap: 12px;
                                        border-bottom: 1px solid #f1f5f9;
                                        transition: all 0.2s ease;
                                        cursor: pointer;
                                        position: relative;
                                        overflow: hidden;
                                    "
                                    onmouseover="this.style.backgroundColor='#f8fafc'"
                                    onmouseout="this.style.backgroundColor='white'"
                                    >
                                        <input type="checkbox" 
                                               id="accolade-${a.accolade_id}" 
                                               value="${a.accolade_id}"
                                               class="accolade-checkbox"
                                               style="
                                                   width: 18px;
                                                   height: 18px;
                                                   border: 2px solid #6366f1;
                                                   border-radius: 4px;
                                                   cursor: pointer;
                                               "
                                        >
                                        <label for="accolade-${a.accolade_id}" style="
                                            margin: 0;
                                            flex: 1;
                                            cursor: pointer;
                                        ">
                                            <div style="
                                                display: flex;
                                                justify-content: space-between;
                                                align-items: center;
                                                gap: 8px;
                                            ">
                                                <span style="
                                                    color: #1e293b;
                                                    font-weight: 500;
                                                    font-size: 0.95em;
                                                ">${a.accolade_name}</span>
                                                
                                                <div style="display: flex; gap: 8px; align-items: center;">
                                                    <span class="badge" style="
                                                        background: ${a.accolade_type === 'Global' ? 'linear-gradient(145deg, #818cf8, #6366f1)' : 'linear-gradient(145deg, #f87171, #ef4444)'};
                                                        color: white;
                                                        padding: 4px 10px;
                                                        border-radius: 999px;
                                                        font-size: 0.7em;
                                                        font-weight: 500;
                                                        letter-spacing: 0.5px;
                                                        text-transform: uppercase;
                                                    ">
                                                        ${a.accolade_type}
                                                    </span>
                                                    
                                                    <span class="badge" style="
                                                        background: ${a.item_type === 'Paid' ? '#dcfce7' : '#dbeafe'};
                                                        color: ${a.item_type === 'Paid' ? '#15803d' : '#1e40af'};
                                                        padding: 4px 10px;
                                                        border-radius: 999px;
                                                        font-size: 0.75em;
                                                        font-weight: 500;
                                                        display: flex;
                                                        align-items: center;
                                                        gap: 4px;
                                                    ">
                                                        <i class="ri-${a.item_type === 'Paid' ? 'money-dollar-circle-line' : 'gift-line'}"></i>
                                                        ${a.item_type || 'Free'}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            ${a.eligibility_and_condition ? `
                                                <div style="
                                                    margin-top: 6px;
                                                    color: #64748b;
                                                    font-size: 0.8em;
                                                    display: flex;
                                                    align-items: center;
                                                    gap: 4px;
                                                ">
                                                    <i class="ri-information-line"></i>
                                                    ${a.eligibility_and_condition}
                                                </div>
                                            ` : ''}
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
                                margin-bottom: 15px;
                                color: #1e293b;
                                font-size: 1.1em;
                                font-weight: 600;
                            ">
                                <i class="ri-team-line me-2" style="color: #6366f1;"></i>
                                Select Members
                            </label>

                            <!-- Search Bar -->
                            <div style="
                                margin-bottom: 10px;
                                position: relative;
                            ">
                                <input 
                                    type="text" 
                                    id="memberSearchInput"
                                    placeholder="Search members..."
                                    style="
                                        width: 100%;
                                        padding: 8px 12px;
                                        padding-left: 35px;
                                        border: 2px solid #e2e8f0;
                                        border-radius: 8px;
                                        font-size: 0.95em;
                                        transition: all 0.2s ease;
                                        background-color: white;
                                    "
                                    oninput="filterMembers(this.value)"
                                    onfocus="this.style.borderColor='#818cf8'"
                                    onblur="this.style.borderColor='#e2e8f0'"
                                >
                                <i class="ri-search-line" style="
                                    position: absolute;
                                    left: 12px;
                                    top: 50%;
                                    transform: translateY(-50%);
                                    color: #94a3b8;
                                "></i>
                            </div>

                            <div class="member-checkbox-container" style="
                                height: 200px;
                                overflow-y: auto;
                                border: 1px solid #e2e8f0;
                                border-radius: 12px;
                                background-color: white;
                                padding: 8px;
                                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                            ">
                                <div id="membersList">
                                    ${members.filter(member => {
                                        // Get login type and appropriate chapter email
                                        const loginType = getUserLoginType();
                                        let chapterEmail;

                                        if (loginType === 'ro_admin') {
                                            chapterEmail = localStorage.getItem('current_chapter_email');
                                            console.log("👤 RO Admin using chapter email:", chapterEmail);
                                        } else {
                                            chapterEmail = getUserEmail();
                                            console.log("👤 Regular user email:", chapterEmail);
                                        }
                                        
                                        const chapter = chapters.find(ch => ch.email_id === chapterEmail);
                                        console.log("🏢 Found chapter:", chapter);
                                        
                                        if (chapter) {
                                            return member.chapter_id === chapter.chapter_id;
                                        }
                                        return false;
                                    }).map(m => `
                                        <div class="member-checkbox-item" style="
                                            padding: 12px;
                                            display: flex;
                                            align-items: center;
                                            gap: 12px;
                                            border-bottom: 1px solid #f1f5f9;
                                            transition: all 0.2s ease;
                                            cursor: pointer;
                                        "
                                        onmouseover="this.style.backgroundColor='#f8fafc'"
                                        onmouseout="this.style.backgroundColor='white'"
                                        data-member-name="${m.member_first_name.toLowerCase()} ${m.member_last_name.toLowerCase()}"
                                        >
                                            <input type="checkbox" 
                                                   id="member-${m.member_id}" 
                                                   value="${m.member_id}"
                                                   style="
                                                       width: 18px;
                                                       height: 18px;
                                                       border: 2px solid #6366f1;
                                                       border-radius: 4px;
                                                       cursor: pointer;
                                                   "
                                            >
                                            <label for="member-${m.member_id}" style="
                                                margin: 0;
                                                cursor: pointer;
                                                font-weight: 500;
                                                color: #1e293b;
                                                flex: 1;
                                            ">
                                                ${m.member_first_name} ${m.member_last_name}
                                            </label>
                                        </div>
                                    `).join('')}
                                </div>
                                <div id="noMembersFound" style="
                                    display: none;
                                    padding: 20px;
                                    text-align: center;
                                    color: #64748b;
                                ">
                                    <i class="ri-search-line mb-2" style="font-size: 24px;"></i>
                                    <p style="margin: 0;">No members found</p>
                                </div>
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
                            // Skip if the requisition has already been given
                            if (req.given_status === true) return '';

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

                <button onclick="addAssignment()" class="btn btn-primary w-100" style="margin: 10px 0;">
                    <i class="ri-add-line me-1"></i> Add Selection
                </button>

<!-- Loader for Add Selection -->
<div id="addSelectionLoader" style="display:none; text-align:center; margin:10px 0;">
  <span class="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true"></span>
  <span style="margin-left:8px; color:#2563eb; font-weight:500;">Adding selection...</span>
</div>

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
                     // Get the email of logged in user from token
            const requestedByEmail = getUserEmail();

                    const chapterRequisitionData = {
                        member_ids: uniqueMembers,
                        chapter_id: assignments[0].member.chapter_id,
                        accolade_ids: uniqueAccolades,
                        comment: JSON.stringify(commentsObject),
                        request_status: 'open',
                        ro_comment: null,
                        pickup_status: false,
                        pickup_date: null,
                        requested_by: requestedByEmail
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
        window.addAssignment = async function() {
            // Show loader
            const loader = document.getElementById('addSelectionLoader');
            if (loader) loader.style.display = 'block';

            try {
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

                    // Check each member-accolade combination
                    for (const member of selectedMembers) {
                        for (const accolade of selectedAccolades) {
                            const hasAccolade = await checkExistingAccolades(member.member_id, accolade.accolade_id);
                            
                            if (hasAccolade) {
                                // Show custom toast notification for existing accolade
                                showCustomToast(`${member.member_first_name} ${member.member_last_name} already has ${accolade.accolade_name}`, 'warning');
                                continue; // Skip this combination
                            }

                            assignments.push({
                                sno: currentSno++,
                                accolade,
                                member,
                                comment: ''
                            });
                        }
                    }
                }

                // Handle Method 2: Requisition selection
                for (const item of selectedItems) {
                    if (item.accolade && item.member) {
                        const hasAccolade = await checkExistingAccolades(item.member.member_id, item.accolade.accolade_id);
                        
                        if (hasAccolade) {
                            // Show custom toast notification for existing accolade
                            showCustomToast(`${item.member.member_first_name} ${item.member.member_last_name} already has ${item.accolade.accolade_name}`, 'warning');
                            continue; // Skip this combination
                        }

                        assignments.push({
                            sno: currentSno++,
                            accolade: item.accolade,
                            member: item.member,
                            comment: ''
                        });
                    }
                }

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
            } finally {
                // Hide loader
                if (loader) loader.style.display = 'none';
            }
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
                    position: relative;
                ">
                    <div class="delete-btn" 
                         onclick="deleteAssignment(${assignment.sno})"
                         style="
                            position: absolute;
                            top: 10px;
                            right: 10px;
                            cursor: pointer;
                            width: 30px;
                            height: 30px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            border-radius: 50%;
                            background: #fee2e2;
                            color: #dc2626;
                            transition: all 0.2s ease;
                         "
                         onmouseover="this.style.background='#fecaca'"
                         onmouseout="this.style.background='#fee2e2'"
                    >
                        <i class="ri-delete-bin-line"></i>
                    </div>
                    
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

        // Update delete assignment function
        window.deleteAssignment = function(sno) {
            // Remove the assignment from the assignments array
            assignments = assignments.filter(a => a.sno !== sno);
            
            // Re-render the assignments table
            renderAssignments();

            // Show custom toast notification
            showCustomToast('Assignment removed');
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
async function handlePickupDateUpdate(requisitionId, defaultDate) {
    try {
        const { value: pickupDate } = await Swal.fire({
            title: 'Select Pickup Date',
            html: `
                <input type="date" 
                       id="pickup-date" 
                       class="swal2-input" 
                       value="${defaultDate || new Date().toISOString().split('T')[0]}"
                       style="width: auto;">
            `,
            showCancelButton: true,
            confirmButtonText: 'Update',
            focusConfirm: false,
            preConfirm: () => {
                const selectedDate = document.getElementById('pickup-date').value;
                if (!selectedDate) {
                    Swal.showValidationMessage('Please select a date');
                }
                return selectedDate;
            }
        });

        if (pickupDate) {
            try {
                // First get the existing requisition data
                const getRequisitionResponse = await fetch('https://backend.bninewdelhi.com/api/getRequestedChapterRequisition');
                const requisitionsData = await getRequisitionResponse.json();
                
                console.log('🔍 Fetched requisitions:', requisitionsData);
                console.log('🎯 Looking for requisition ID:', requisitionId);
                
                const currentRequisition = requisitionsData.find(req => req.chapter_requisition_id === parseInt(requisitionId));
                
                
                console.log('📝 Found requisition:', currentRequisition);

                if (!currentRequisition) {
                    throw new Error('Requisition not found');
                }

                // Helper function to safely parse JSON strings
                const safeJSONParse = (value) => {
                    if (!value) return {};
                    try {
                        return typeof value === 'string' ? JSON.parse(value) : value;
                    } catch (e) {
                        return value;
                    }
                };

                const response = await fetch('https://backend.bninewdelhi.com/api/updateChapterRequisition', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        chapter_requisition_id: requisitionId,
                        pickup_status: true,
                        pickup_date: pickupDate,
                        approve_status: safeJSONParse(currentRequisition.approve_status),
                        ro_comment: safeJSONParse(currentRequisition.ro_comment),
                        given_status: safeJSONParse(currentRequisition.given_status),
                        slab_wise_comment: currentRequisition.slab_wise_comment
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
    } catch (error) {
        console.error('Error updating pickup date:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to update pickup date'
        });
    }
}

// Add this function to handle given status click
async function showGivenStatusModal(requisitionId) {
    try {
        console.log('🎯 Fetching given status details for requisition:', requisitionId);
        
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
        const requisition = requisitions.find(req => req.chapter_requisition_id === parseInt(requisitionId));
        console.log('📝 Found requisition:', requisition);

        if (!requisition) {
            throw new Error('Requisition not found');
        }

        let approvedCombinations = [];

        // Check if it's a visitor requisition
        if (requisition.visitor_id) {
            console.log('👤 Processing visitor requisition');
            
            if (requisition.approve_status === 'approved') {
                const accolade = accolades.find(a => a.accolade_id === requisition.accolade_ids[0]);
                let givenData = null;

                try {
                    if (requisition.given_status && requisition.given_status !== '{}') {
                        givenData = JSON.parse(requisition.given_status);
                    }
                } catch (e) {
                    console.error('Error parsing visitor given status:', e);
                }

                approvedCombinations = [{
                    key: 'visitor',
                    visitorId: requisition.visitor_id,
                    accoladeId: requisition.accolade_ids[0],
                    memberName: `${requisition.comment.split('for ')[1] || 'Visitor'} (Visitor)`,
                    accoladeName: accolade?.accolade_name || 'Induction Kit',
                    accoladePrice: accolade?.accolade_price || 'Free',
                    isGiven: givenData?.status === 'given',
                    givenDate: givenData?.date || null
                }];
            }
        } else {
            // Existing member logic
            const approveStatus = JSON.parse(requisition.approve_status || '{}');
            const givenStatus = JSON.parse(requisition.given_status || '{}');
            
            approvedCombinations = Object.entries(approveStatus)
                .filter(([key, status]) => status === 'approved')
                .map(([key]) => {
                    const [memberId, accoladeId] = key.split('_').map(Number);
                    const member = members.find(m => m.member_id === memberId);
                    const accolade = accolades.find(a => a.accolade_id === accoladeId);
                    const givenData = givenStatus[key] || null;
                    
                    return {
                        key,
                        memberId,
                        accoladeId,
                        memberName: member ? `${member.member_first_name} ${member.member_last_name}` : `Member ${memberId}`,
                        accoladeName: accolade ? accolade.accolade_name : `Accolade ${accoladeId}`,
                        accoladePrice: accolade?.accolade_price || 'Free',
                        isGiven: givenData ? true : false,
                        givenDate: givenData?.date || null
                    };
                });
        }

        // Show in SweetAlert with the same modal content structure
        const modalContent = `
            <div class="given-status-container" style="max-height: 70vh; overflow-y: auto;">
                ${approvedCombinations.map(combo => `
                    <div class="accolade-item" style="
                        background: white;
                        padding: 15px;
                        margin-bottom: 15px;
                        border-radius: 10px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <div>
                                <h4 style="margin: 0; color: #2563eb; font-size: 16px;">${combo.memberName}</h4>
                                <p style="margin: 5px 0; color: #64748b;">${combo.accoladeName}</p>
                            </div>
                            <span class="badge ${combo.accoladePrice === 'Free' ? 'bg-info-transparent' : 'bg-success-transparent'}">
                                ${combo.accoladePrice === 'Free' ? 'Free' : `₹${combo.accoladePrice}`}
                            </span>
                        </div>
                        
                        ${combo.isGiven ? `
                            <div class="text-success" style="display: flex; align-items: center; gap: 8px;">
                                <i class="ri-checkbox-circle-fill"></i>
                                Given on ${new Date(combo.givenDate).toLocaleDateString()}
                            </div>
                        ` : `
                            <div style="display: flex; gap: 10px; align-items: center;">
                                <input type="date" 
                                    class="form-control" 
                                    style="width: 150px;"
                                    id="date_${combo.key}"
                                >
                                <button class="btn btn-primary btn-sm" 
                                    onclick="markAsGiven('${requisitionId}', '${combo.key}')">
                                    Mark as Given
                                </button>
                            </div>
                        `}
                    </div>
                `).join('')}
            </div>
        `;

        await Swal.fire({
            title: 'Accolade Distribution Status',
            html: modalContent,
            width: '600px',
            showConfirmButton: false,
            showCloseButton: true
        });

        // Refresh the data after closing the modal
        window.location.reload();

    } catch (error) {
        console.error('❌ Error showing given status:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load given status details'
        });
    }
}
async function markAsGiven(requisitionId, combinationKey) {
    try {
        const dateInput = document.getElementById(`date_${combinationKey}`);
        const givenDate = dateInput.value;

        if (!givenDate) {
            Swal.showValidationMessage('Please select a date');
            return;
        }

        // Parse member and accolade IDs from combinationKey
        const [memberId, accoladeId] = combinationKey.split('_').map(Number);

        // Fetch chapter requisition
        const chapterReqResponse = await fetch('https://backend.bninewdelhi.com/api/getRequestedChapterRequisition');
        const chapterRequisitions = await chapterReqResponse.json();
        
        const currentRequisition = chapterRequisitions.find(req => 
            req.chapter_requisition_id === parseInt(requisitionId)
        );

        if (!currentRequisition) {
            throw new Error('Chapter requisition not found');
        }

        // Check if it's a visitor requisition
        if (currentRequisition.visitor_id) {
            console.log('👤 Processing visitor given status update');
            
            const response = await fetch('https://backend.bninewdelhi.com/api/updateChapterRequisition', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chapter_requisition_id: requisitionId,
                    given_status: JSON.stringify({
                        status: 'given',
                        date: givenDate
                    })
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update visitor given status');
            }
        } else {
            console.log('👥 Processing member given status update');

            // 1. Check member requisition status
            const memberReqResponse = await fetch('https://backend.bninewdelhi.com/api/getRequestedMemberRequisition');
            const memberRequisitions = await memberReqResponse.json();
            
            // Check if valid member requisition exists
            const matchingRequisition = memberRequisitions.find(req => 
                req.member_id === memberId &&
                req.accolade_id === accoladeId &&
                req.chapter_id === currentRequisition.chapter_id &&
                req.given_status === false &&
                req.request_status === 'open' &&
                req.given_date === null
            );

            if (matchingRequisition) {
                // Update member requisition if found
                const memberUpdateResponse = await fetch('https://backend.bninewdelhi.com/api/updateMemberRequisition', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        member_id: memberId,
                        chapter_id: currentRequisition.chapter_id,
                        accolade_id: accoladeId,
                        given_date: givenDate,
                        request_status: 'closed',
                        given_status: true
                    })
                });

                if (!memberUpdateResponse.ok) {
                    console.warn('Failed to update member requisition, but continuing...');
                }
            }

            // Always update chapter requisition regardless of member requisition status
            let existingGivenStatus = {};
            try {
                existingGivenStatus = currentRequisition.given_status ? 
                    JSON.parse(currentRequisition.given_status) : {};
            } catch (e) {
                console.warn('Error parsing existing given status, starting fresh');
            }

            existingGivenStatus[combinationKey] = {
                date: givenDate
            };

            const chapterResponse = await fetch('https://backend.bninewdelhi.com/api/updateChapterRequisition', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chapter_requisition_id: requisitionId,
                    given_status: existingGivenStatus
                })
            });

            if (!chapterResponse.ok) {
                throw new Error('Failed to update chapter requisition');
            }
        }

        console.log('✅ Successfully updated given status');
        
        await Swal.fire({
            icon: 'success',
            title: 'Success',
            text: `${currentRequisition.visitor_id ? 'Visitor' : 'Member'} accolade marked as given successfully`,
            timer: 2000
        });

        // Refresh the modal
        await showGivenStatusModal(requisitionId);

    } catch (error) {
        console.error('❌ Error marking as given:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to update status: ' + error.message
        });
    }
}
// Add the new function for showing total accolades details
async function showTotalAccoladesDetails(requisitionId) {
    try {
        console.log('🎯 Fetching total accolades details for requisition:', requisitionId);
        
        // Fetch all required data
        const [requisitionResponse, membersResponse, accoladesResponse, visitorsResponse] = await Promise.all([
            fetch('https://backend.bninewdelhi.com/api/getRequestedChapterRequisition'),
            fetch('https://backend.bninewdelhi.com/api/members'),
            fetch('https://backend.bninewdelhi.com/api/accolades'),
            fetch('https://backend.bninewdelhi.com/api/getallvisitors')
        ]);

        const [requisitions, members, accolades, visitors] = await Promise.all([
            requisitionResponse.json(),
            membersResponse.json(),
            accoladesResponse.json(),
            visitorsResponse.json()
        ]);

        // Find the specific requisition
        const requisition = requisitions.find(req => req.chapter_requisition_id === parseInt(requisitionId));
        console.log('📝 Found requisition:', requisition);

        if (!requisition) {
            throw new Error('Requisition not found');
        }

        let memberAccolades = [];
        let totalCount = 0;

        // Process visitor requisition
        if (requisition.visitor_id) {
            const visitor = visitors.find(v => v.visitor_id === requisition.visitor_id);
            const accolade = accolades.find(a => a.accolade_id === requisition.accolade_ids[0]);
            
            memberAccolades = [{
                memberName: visitor ? visitor.visitor_name : 'Unknown Visitor',
                isVisitor: true,
                accolades: [{
                    name: accolade ? accolade.accolade_name : 'Induction Kit',
                    count: 1
                }],
                totalCount: 1
            }];
            totalCount = 1;
        } else {
            // Process regular member requisition
            try {
                const comments = JSON.parse(requisition.comment || '{}');
                const memberMap = new Map();

                // Group accolades by member
                Object.keys(comments).forEach(key => {
                    const [memberId, accoladeId] = key.split('_').map(Number);
                    const member = members.find(m => m.member_id === memberId);
                    const accolade = accolades.find(a => a.accolade_id === accoladeId);

                    if (member && accolade) {
                        if (!memberMap.has(memberId)) {
                            memberMap.set(memberId, {
                                memberName: `${member.member_first_name} ${member.member_last_name}`,
                                isVisitor: false,
                                accolades: new Map()
                            });
                        }

                        const memberData = memberMap.get(memberId);
                        if (!memberData.accolades.has(accoladeId)) {
                            memberData.accolades.set(accoladeId, {
                                name: accolade.accolade_name,
                                count: 1
                            });
                        } else {
                            memberData.accolades.get(accoladeId).count++;
                        }
                    }
                });

                // Convert map to array and calculate totals
                memberAccolades = Array.from(memberMap.values()).map(member => {
                    const accoladesList = Array.from(member.accolades.values());
                    const memberTotal = accoladesList.reduce((sum, acc) => sum + acc.count, 0);
                    totalCount += memberTotal;
                    return {
                        ...member,
                        accolades: accoladesList,
                        totalCount: memberTotal
                    };
                });
            } catch (e) {
                console.error('Error processing member accolades:', e);
            }
        }

        // Create the modal content
        const modalContent = `
            <div class="total-accolades-container">
                <!-- Summary Stats Cards -->
                <div style="
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                ">
                    <div style="
                        background: linear-gradient(145deg, #3b82f6, #2563eb);
                        padding: 25px;
                        border-radius: 16px;
                        color: white;
                        text-align: center;
                        box-shadow: 0 10px 20px rgba(37, 99, 235, 0.15);
                        transform: translateY(0);
                        transition: transform 0.2s ease;
                    "
                    onmouseover="this.style.transform='translateY(-5px)'"
                    onmouseout="this.style.transform='translateY(0)'">
                        <i class="ri-stack-line" style="font-size: 2.5em; margin-bottom: 10px;"></i>
                        <div style="font-size: 2.5em; font-weight: 600; margin-bottom: 5px;">
                            ${totalCount}
                        </div>
                        <div style="opacity: 0.9;">Total Accolades</div>
                    </div>
                    
                    <div style="
                        background: linear-gradient(145deg, #06b6d4, #0891b2);
                        padding: 25px;
                        border-radius: 16px;
                        color: white;
                        text-align: center;
                        box-shadow: 0 10px 20px rgba(6, 182, 212, 0.15);
                        transform: translateY(0);
                        transition: transform 0.2s ease;
                    "
                    onmouseover="this.style.transform='translateY(-5px)'"
                    onmouseout="this.style.transform='translateY(0)'">
                        <i class="ri-user-line" style="font-size: 2.5em; margin-bottom: 10px;"></i>
                        <div style="font-size: 2.5em; font-weight: 600; margin-bottom: 5px;">
                            ${memberAccolades.length}
                        </div>
                        <div style="opacity: 0.9;">Total Members</div>
                    </div>
                </div>

                <!-- Detailed Table -->
                <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                                <th style="padding: 16px; text-align: left; color: #2563eb; font-weight: 600;">
                                    <i class="ri-user-line me-2"></i>Member
                                </th>
                                <th style="padding: 16px; text-align: left; color: #2563eb; font-weight: 600;">
                                    <i class="ri-award-line me-2"></i>Accolade
                                </th>
                                <th style="padding: 16px; text-align: center; color: #2563eb; font-weight: 600;">
                                    <i class="ri-numbers-line me-2"></i>Quantity
                                </th>
                                <th style="padding: 16px; text-align: center; color: #2563eb; font-weight: 600;">
                                    <i class="ri-user-star-line me-2"></i>Type
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            ${memberAccolades.map(member => 
                                member.accolades.map(accolade => `
                                    <tr style="border-bottom: 1px solid #e2e8f0; transition: all 0.2s ease;"
                                        onmouseover="this.style.backgroundColor='#f8fafc'"
                                        onmouseout="this.style.backgroundColor='white'">
                                        <td style="padding: 16px;">
                                            <div style="display: flex; align-items: center; gap: 12px;">
                                                <div style="
                                                    width: 40px;
                                                    height: 40px;
                                                    border-radius: 50%;
                                                    background: ${member.isVisitor ? '#fb923c' : '#3b82f6'};
                                                    display: flex;
                                                    align-items: center;
                                                    justify-content: center;
                                                    color: white;
                                                ">
                                                    <i class="${member.isVisitor ? 'ri-user-star-line' : 'ri-user-line'}"></i>
                                                </div>
                                                <div>
                                                    <div style="font-weight: 500; color: #1e293b;">
                                                        ${member.memberName}
                                                    </div>
                                                    <div style="font-size: 0.875rem; color: #64748b;">
                                                        Total: ${member.totalCount} accolades
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style="padding: 16px;">
                                            <div style="display: flex; align-items: center; gap: 8px;">
                                                <i class="ri-award-line" style="color: #3b82f6;"></i>
                                                <span style="color: #1e293b;">${accolade.name}</span>
                                            </div>
                                        </td>
                                        <td style="padding: 16px; text-align: center;">
                                            <span style="
                                                background: #eff6ff;
                                                color: #3b82f6;
                                                padding: 6px 12px;
                                                border-radius: 9999px;
                                                font-weight: 500;
                                                font-size: 0.875rem;
                                            ">
                                                ${accolade.count} ${accolade.count === 1 ? 'unit' : 'units'}
                                            </span>
                                        </td>
                                        <td style="padding: 16px; text-align: center;">
                                            <span style="
                                                background: ${member.isVisitor ? '#fff7ed' : '#f0f9ff'};
                                                color: ${member.isVisitor ? '#ea580c' : '#0284c7'};
                                                padding: 6px 12px;
                                                border-radius: 9999px;
                                                font-size: 0.875rem;
                                                display: inline-flex;
                                                align-items: center;
                                                gap: 4px;
                                            ">
                                                <i class="${member.isVisitor ? 'ri-user-star-line' : 'ri-user-line'}"></i>
                                                ${member.isVisitor ? 'Visitor' : 'Member'}
                                            </span>
                                        </td>
                                    </tr>
                                `).join('')
                            ).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        // Update the Swal.fire call
        Swal.fire({
            title: '<span style="color: #3b82f6;"><i class="ri-stack-line me-2"></i>Total Accolades Details</span>',
            html: modalContent,
            width: '90%',
            showCloseButton: true,
            showConfirmButton: false,
            padding: '32px',
            customClass: {
                container: 'total-accolades-modal'
            }
        });

    } catch (error) {
        console.error('❌ Error showing total accolades details:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load total accolades details'
        });
    }
}

// Add the filterMembers function after your existing code
function filterMembers(searchTerm) {
    const memberItems = document.querySelectorAll('.member-checkbox-item');
    const noMembersFound = document.getElementById('noMembersFound');
    let hasVisibleMembers = false;
    
    searchTerm = searchTerm.toLowerCase().trim();
    
    memberItems.forEach(item => {
        const memberName = item.getAttribute('data-member-name');
        const shouldShow = memberName.includes(searchTerm);
        item.style.display = shouldShow ? 'flex' : 'none';
        if (shouldShow) hasVisibleMembers = true;
    });
    
    // Show/hide the "No members found" message
    if (noMembersFound) {
        noMembersFound.style.display = hasVisibleMembers ? 'none' : 'block';
    }

    // Add highlight to matching text if there's a search term
    if (searchTerm) {
        memberItems.forEach(item => {
            if (item.style.display !== 'none') {
                const label = item.querySelector('label');
                const memberName = label.textContent;
                const regex = new RegExp(`(${searchTerm})`, 'gi');
                label.innerHTML = memberName.replace(regex, '<span style="background-color: #dbeafe; padding: 0 2px; border-radius: 2px;">$1</span>');
            }
        });
    } else {
        // Reset highlights if search is cleared
        memberItems.forEach(item => {
            const label = item.querySelector('label');
            const memberName = item.getAttribute('data-member-name').split(' ');
            label.textContent = memberName.map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
        });
    }
}

// Add this function before the addAssignment function
async function checkExistingAccolades(memberId, accoladeId) {
    try {
        // Fetch all member accolades from the new API
        const response = await fetch('https://backend.bninewdelhi.com/api/getAllMemberAccolades');
        const allMemberAccolades = await response.json();
        
        console.log('🔍 Checking accolade assignment:', {
            memberId,
            accoladeId,
            totalRecords: allMemberAccolades.length
        });

        // Check if there's any record matching both member_id and accolade_id
        const existingAssignment = allMemberAccolades.find(record => 
            record.member_id === memberId && 
            record.accolade_id === accoladeId
        );

        if (existingAssignment) {
            console.log('✅ Found existing assignment:', existingAssignment);
            return true;
        }

        console.log('❌ No existing assignment found');
        return false;

    } catch (error) {
        console.error('❌ Error checking existing accolades:', error);
        return false;
    }
}

function filterAccolades(searchTerm) {
    const accoladeItems = document.querySelectorAll('.accolade-checkbox-item');
    let hasVisibleAccolades = false;

    searchTerm = searchTerm.toLowerCase().trim();

    accoladeItems.forEach(item => {
        const label = item.querySelector('label');
        const accoladeName = label.textContent.toLowerCase();
        const shouldShow = accoladeName.includes(searchTerm);
        item.style.display = shouldShow ? 'flex' : 'none';
        if (shouldShow) hasVisibleAccolades = true;
    });

    // Optionally, show a "No accolades found" message if you want
}