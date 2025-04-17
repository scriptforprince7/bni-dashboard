const accoladesApiUrl = "https://backend.bninewdelhi.com/api/accolades";
const chaptersApiUrl = "https://backend.bninewdelhi.com/api/chapters";
const requisitionsApiUrl = "https://backend.bninewdelhi.com/api/getRequestedChapterRequisition";

let allChapters = [];
let allAccolades = [];
let allRequisitions = [];

// Add these variables at the top to store accumulated data
let accumulatedApprovals = {};
let accumulatedComments = {};
let currentRequisition = null;

// Add at the top with other global variables
let memberRequisitions = [];

// Add sorting state variables at the top
let currentSort = {
    column: 'chapter_requisition_id',
    direction: 'desc'
};

// Add these variables at the top with your existing variables
let filteredRequisitions = [];
let activeFilters = {
    chapter: 'all',
    month: 'all',
    accolade: 'all'
};

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

        // Fetch all required data including accolades
        const [requisitionsResponse, chaptersResponse, accoladesResponse] = await Promise.all([
            fetch(requisitionsApiUrl),
            fetch(chaptersApiUrl),
            fetch('https://backend.bninewdelhi.com/api/accolades')  // Add accolades API
        ]);

        allRequisitions = await requisitionsResponse.json();
        allChapters = await chaptersResponse.json();
        allAccolades = await accoladesResponse.json();
        filteredRequisitions = [...allRequisitions];

        console.log('📝 All Requisitions:', allRequisitions);
        console.log('📚 All Chapters:', allChapters);
        console.log('🏆 All Accolades:', allAccolades);

        initializeFilters();
        renderTable();

    } catch (error) {
        console.error('❌ Error in loadData:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load data'
        });
    } finally {
        hideLoader();
    }
}

// Function to get random accolades
function getRandomAccolades(count = 5) {
    const shuffled = [...allAccolades].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

// Function to check accolade paid status
function checkAccoladePaidStatus(memberRequisitions, memberId, chapterId, accoladeId) {
    const matchingRequisition = memberRequisitions.find(req => 
        req.member_id === memberId && 
        req.chapter_id === chapterId && 
        req.accolade_id === accoladeId
    );

    return matchingRequisition && 
           matchingRequisition.order_id !== null && 
           matchingRequisition.accolade_amount !== null;
}

// Function to handle click on accolades count
async function handleAccoladesClick(requisition) {
    try {
        currentRequisition = requisition;
        
        console.log('📝 Processing requisition:', requisition);
        
        // Parse approve status and comments only if not a visitor request
        let approveStatusMap = {};
        let commentsMap = {};
        let roCommentsMap = '';  // Changed to string for visitor case
        
        const isVisitor = requisition.member_ids.includes(0);
        
        if (!isVisitor) {
            try {
                approveStatusMap = JSON.parse(requisition.approve_status || '{}');
                commentsMap = JSON.parse(requisition.comment || '{}');
                roCommentsMap = JSON.parse(requisition.ro_comment || '{}');
            } catch (e) {
                console.error('Error parsing data:', e);
            }
        } else {
            // For visitor, use direct values
            approveStatusMap = requisition.approve_status || '';
            commentsMap = requisition.comment || '';
            roCommentsMap = requisition.ro_comment || '';  // Direct string value for visitor
            console.log('👤 Visitor RO Comment:', roCommentsMap);
        }

        // Fetch all required data including visitors
        const [accoladesResponse, chaptersResponse, membersResponse, memberRequisitionsResponse, visitorsResponse] = await Promise.all([
            fetch('https://backend.bninewdelhi.com/api/accolades'),
            fetch('https://backend.bninewdelhi.com/api/chapters'),
            fetch('https://backend.bninewdelhi.com/api/members'),
            fetch('https://backend.bninewdelhi.com/api/getRequestedMemberRequisition'),
            fetch('https://backend.bninewdelhi.com/api/getallvisitors')
        ]);

        const [allAccolades, allChapters, allMembers, memberRequisitions, visitors] = await Promise.all([
            accoladesResponse.json(),
            chaptersResponse.json(),
            membersResponse.json(),
            memberRequisitionsResponse.json(),
            visitorsResponse.json()
        ]);

        // Match chapter based on chapter_id
        const chapter = allChapters.find(ch => ch.chapter_id === requisition.chapter_id);
        
        // Create combinations with comments and payment status
        const combinations = [];
        requisition.member_ids.forEach(memberId => {
            let memberName;
            let isVisitor = false;

            if (memberId === 0) {
                // This is a visitor case
                isVisitor = true;
                const visitor = visitors.find(v => v.visitor_id === requisition.visitor_id);
                memberName = visitor ? `${visitor.visitor_name} (Visitor)` : 'Unknown Visitor';
                console.log('👤 Found visitor:', memberName);
            } else {
                // Regular member case
                const member = allMembers.find(m => m.member_id === memberId);
                memberName = member ? `${member.member_first_name} ${member.member_last_name}` : `Member ID: ${memberId}`;
            }
            
            requisition.accolade_ids.forEach(accoladeId => {
                const accolade = allAccolades.find(acc => acc.accolade_id === accoladeId);
                const commentKey = `${memberId}_${accoladeId}`;
                const comment = commentsMap[commentKey] || '';
                const roComment = roCommentsMap[commentKey] || '';

                combinations.push({
                    memberId,
                    memberName,
                    accolade,
                    comment,
                    roComment,
                    isVisitor
                });
            });
        });

        const accoladesSectionsHtml = combinations.map((combo, index) => {
            const currentStatus = isVisitor ? approveStatusMap : approveStatusMap[`${combo.memberId}_${combo.accolade.accolade_id}`];
            const currentRoComment = isVisitor ? roCommentsMap : (roCommentsMap[`${combo.memberId}_${combo.accolade.accolade_id}`] || '');
            
            // Check paid status for this combination
            const isPaid = checkAccoladePaidStatus(
                memberRequisitions, 
                combo.memberId, 
                requisition.chapter_id, 
                combo.accolade.accolade_id
            );

            // Modify the Accolade Type section based on isVisitor
            const accoladeTypeHtml = combo.isVisitor ? `
                <div style="
                    padding: 12px;
                    background: #f8fafc;
                    border-radius: 8px;
                    border-left: 4px solid #6366f1;
                ">
                    <div style="color: #64748b; font-size: 0.875rem; margin-bottom: 4px;">
                        <i class="ri-price-tag-3-line me-1"></i>Accolade Type
                    </div>
                    <div style="
                        color: #6366f1;
                        font-weight: 500;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    ">
                        <i class="ri-gift-line"></i>
                        Induction Kit
                    </div>
                </div>
            ` : `
                <div style="
                    padding: 12px;
                    background: #f8fafc;
                    border-radius: 8px;
                    border-left: 4px solid ${isPaid ? '#059669' : '#6366f1'};
                ">
                    <div style="color: #64748b; font-size: 0.875rem; margin-bottom: 4px;">
                        <i class="ri-price-tag-3-line me-1"></i>Accolade Type
                    </div>
                    <div style="
                        color: ${isPaid ? '#059669' : '#6366f1'};
                        font-weight: 500;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    ">
                        <i class="ri-${isPaid ? 'shopping-cart-2' : 'gift'}-line"></i>
                        ${isPaid ? 'Paid' : 'Free'}
                    </div>
                </div>
            `;

            return `
                <div class="accolade-section" style="
                    background: #ffffff;
                    border-radius: 12px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    border: 1px solid #e5e7eb;
                ">
                    <!-- Header with Accolade and Member Name -->
                    <div style="
                        background: ${combo.accolade.accolade_type === 'Global' 
                            ? 'linear-gradient(145deg, #2563eb, #1e40af)' 
                            : 'linear-gradient(145deg, #dc2626, #991b1b)'};
                        padding: 15px;
                        border-radius: 12px 12px 0 0;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <div style="color: #ffffff; font-size: 1.1rem; font-weight: 600;">
                            <i class="ri-award-fill me-2"></i>${combo.accolade.accolade_name}
                        </div>
                        <span style="
                            background: ${combo.accolade.accolade_type === 'Global' ? '#4f46e5' : '#e11d48'};
                            padding: 4px 12px;
                            border-radius: 9999px;
                            font-size: 0.75rem;
                            color: white;
                            font-weight: 500;
                        ">
                            ${combo.accolade.accolade_type}
                        </span>
                    </div>

                    <!-- Content -->
                    <div style="padding: 20px;">
                        <!-- First Row: Member and Chapter -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                            <!-- Member Name -->
                            <div style="
                                padding: 12px;
                                background: #f8fafc;
                                border-radius: 8px;
                                border-left: 4px solid #2563eb;
                            ">
                                <div style="color: #64748b; font-size: 0.875rem; margin-bottom: 4px;">
                                    <i class="ri-user-line me-1"></i>${combo.isVisitor ? 'Visitor Name' : 'Member Name'}
                                </div>
                                <div style="color: #1e293b; font-weight: 500;">
                                    ${combo.memberName}
                                </div>
                            </div>

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
                        </div>

                        <!-- Second Row: Chapter Comment and Accolade Type -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
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
                                <div style="color: #1e293b;">
                                    ${combo.comment || 'No comment provided'}
                                </div>
                            </div>

                            <!-- Accolade Type -->
                            ${accoladeTypeHtml}
                        </div>

                        
                        <!-- RO Comment Input -->
                        <div style="margin-bottom: 20px;">
                            <div style="color: #64748b; font-size: 0.875rem; margin-bottom: 8px;">
                                <i class="ri-chat-2-line me-1"></i>RO Comment
                            </div>
                            <textarea 
                                id="ro-comment-${combo.memberId}_${combo.accolade.accolade_id}"
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
                            >${currentRoComment}</textarea>
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
                                onclick="handleRequisitionAction({
                                    requisitionId: ${requisition.chapter_requisition_id},
                                    memberId: ${combo.memberId},
                                    accoladeId: ${combo.accolade.accolade_id},
                                    status: 'declined',
                                    index: ${index}
                                })"
                                style="
                                    padding: 8px 16px;
                                    border-radius: 6px;
                                    border: none;
                                    background: ${currentStatus === 'declined' ? '#fecaca' : '#fee2e2'};
                                    color: #dc2626;
                                    font-weight: 500;
                                    cursor: ${currentStatus === 'declined' ? 'not-allowed' : 'pointer'};
                                    opacity: ${currentStatus === 'declined' ? '0.5' : '1'};
                                    transition: all 0.3s ease;
                                "
                                ${currentStatus === 'declined' ? 'disabled' : ''}
                            >
                                <i class="ri-close-circle-line me-1"></i>
                                ${currentStatus === 'declined' ? 'Rejected' : 'Reject'}
                            </button>
                            <button 
                                class="btn-approve"
                                onclick="handleRequisitionAction({
                                    requisitionId: ${requisition.chapter_requisition_id},
                                    memberId: ${combo.memberId},
                                    accoladeId: ${combo.accolade.accolade_id},
                                    status: 'approved',
                                    index: ${index}
                                })"
                                style="
                                    padding: 8px 16px;
                                    border-radius: 6px;
                                    border: none;
                                    background: ${currentStatus === 'approved' ? '#bbf7d0' : '#dcfce7'};
                                    color: #16a34a;
                                    font-weight: 500;
                                    cursor: ${currentStatus === 'approved' ? 'not-allowed' : 'pointer'};
                                    opacity: ${currentStatus === 'approved' ? '0.5' : '1'};
                                    transition: all 0.3s ease;
                                "
                                ${currentStatus === 'approved' ? 'disabled' : ''}
                            >
                                <i class="ri-checkbox-circle-line me-1"></i>
                                ${currentStatus === 'approved' ? 'Approved' : 'Approve'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

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
            showConfirmButton: false,
            allowOutsideClick: false // Prevent closing on outside click
        });

        // Add this function to handle checkbox changes
        window.togglePickupDate = function(index) {
            const checkbox = document.getElementById(`pickupStatus_${index}`);
            const dateContainer = document.getElementById(`pickupDateContainer_${index}`);
            
            if (checkbox.checked) {
                dateContainer.style.display = 'block';
            } else {
                dateContainer.style.display = 'none';
            }
        };

    } catch (error) {
        console.error('❌ Error in handleAccoladesClick:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load accolades details'
        });
    }
}

// Function to handle requisition action
async function handleRequisitionAction(data) {
    try {
        const actionData = typeof data === 'string' ? JSON.parse(data) : data;
        console.log('🎯 Action Data:', actionData);

        const key = `${actionData.memberId}_${actionData.accoladeId}`;
        // Get the comment from the specific textarea using the unique ID
        const commentEl = document.querySelector(`#ro-comment-${key}`);
        const roComment = commentEl ? commentEl.value : '';
        
        console.log('📝 Captured RO Comment:', roComment);

        // Check if this is a visitor case (memberId === 0)
        const isVisitor = actionData.memberId === 0;
        
        if (isVisitor) {
            // For visitor, prepare direct values
            const chapterRequestData = {
                chapter_requisition_id: actionData.requisitionId,
                approve_status: actionData.status,  // Direct 'approved' or 'declined'
                ro_comment: roComment,  // Direct comment
                pickup_status: false,
                pickup_date: null
            };

            console.log('📦 Visitor Request Data:', chapterRequestData);

            // Update chapter requisition for visitor
            const chapterResponse = await fetch('https://backend.bninewdelhi.com/api/updateChapterRequisition', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(chapterRequestData)
            });

            if (!chapterResponse.ok) {
                throw new Error('Chapter requisition update failed');
            }

            // Show success message for visitor
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: `Visitor requisition ${actionData.status} successfully`,
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                loadData(); // Refresh the data
            });

        } else {
            // Original member flow
            accumulatedApprovals[key] = actionData.status;
            accumulatedComments[key] = roComment;

            // Check if any accolade is approved to set pickup status
            const isAnyApproved = Object.values(accumulatedApprovals).includes('approved');
            
            console.log('🔍 Checking approvals:', {
                accumulatedApprovals,
                isAnyApproved
            });

            // Check if this is a paid accolade
            const isPaidAccolade = memberRequisitions.some(req => 
                req.member_id === actionData.memberId && 
                req.chapter_id === currentRequisition.chapter_id && 
                req.accolade_id === actionData.accoladeId &&
                req.order_id !== null && 
                req.accolade_amount !== null
            );

            // First update chapter requisition
            const chapterRequestData = {
                chapter_requisition_id: actionData.requisitionId,
                approve_status: accumulatedApprovals,
                ro_comment: accumulatedComments,
                pickup_date: null
            };

            try {
                // Update chapter requisition
                const chapterResponse = await fetch('https://backend.bninewdelhi.com/api/updateChapterRequisition', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(chapterRequestData)
                });

                if (!chapterResponse.ok) {
                    throw new Error('Chapter requisition update failed');
                }

                // Rest of the existing member logic...
                if (isPaidAccolade) {
                    console.log('🔄 Updating member requisition for paid accolade');
                    
                    // Find the correct member requisition record
                    const memberReq = memberRequisitions.find(req => 
                        req.member_id === actionData.memberId && 
                        req.chapter_id === currentRequisition.chapter_id && 
                        req.accolade_id === actionData.accoladeId
                    );

                    if (!memberReq) {
                        throw new Error('Member requisition record not found');
                    }

                    // Prepare member request data based on action (approve/reject)
                    const memberRequestData = {
                        member_request_id: memberReq.member_request_id,
                        member_id: actionData.memberId,
                        chapter_id: currentRequisition.chapter_id,
                        accolade_id: actionData.accoladeId,
                        approve_status: actionData.status === 'approved' ? 'approved' : 'rejected',
                        response_comment: roComment,
                        request_status: actionData.status === 'approved' ? 'closed' : 'open',
                        approved_date: actionData.status === 'approved' ? new Date().toISOString() : null
                    };

                    console.log('📝 Member Request Data:', memberRequestData);

                    const memberResponse = await fetch('https://backend.bninewdelhi.com/api/updateMemberRequisition', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(memberRequestData)
                    });

                    if (!memberResponse.ok) {
                        throw new Error('Member requisition update failed');
                    }

                    console.log('✅ Member requisition updated:', {
                        status: actionData.status,
                        newRequestStatus: memberRequestData.request_status
                    });
                } else {
                    // For free accolades, check if member requisition exists
                    const response = await fetch('https://backend.bninewdelhi.com/api/getRequestedMemberRequisition');
                    const allMemberRequisitions = await response.json();
                    
                    // Check if this specific free accolade exists in member requisitions
                    const freeReq = allMemberRequisitions.find(req => 
                        req.member_id === actionData.memberId && 
                        req.chapter_id === currentRequisition.chapter_id && 
                        req.accolade_id === actionData.accoladeId
                    );

                    if (freeReq) {
                        console.log('🆓 Found free accolade in member requisitions:', actionData.accoladeId);
                        try {
                            const freeRequestData = {
                                member_request_id: freeReq.member_request_id,
                                member_id: actionData.memberId,
                                chapter_id: currentRequisition.chapter_id,
                                accolade_id: actionData.accoladeId,
                                approve_status: actionData.status === 'approved' ? 'approved' : 'pending',
                                response_comment: roComment,
                                request_status: actionData.status === 'approved' ? 'closed' : 'open',
                                approved_date: actionData.status === 'approved' ? new Date().toISOString() : null
                            };

                            const freeResponse = await fetch('https://backend.bninewdelhi.com/api/updateMemberRequisition', {
                                method: 'PUT',
                                headers: { 
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(freeRequestData)
                            });

                            if (!freeResponse.ok) {
                                console.warn(`Warning: Failed to update free accolade ${actionData.accoladeId}`);
                            } else {
                                console.log(`✅ Successfully updated free accolade ${actionData.accoladeId} to ${freeRequestData.approve_status}`);
                            }
                        } catch (error) {
                            console.warn(`Warning: Error updating free accolade ${actionData.accoladeId}:`, error);
                        }
                    } else {
                        console.log(`ℹ️ Free accolade ${actionData.accoladeId} not found in member requisitions`);
                    }
                }

                // Show success message
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: `Requisition ${actionData.status} successfully`,
                    timer: 2000,
                    showConfirmButton: false
                }).then(() => {
                    loadData();
                });

            } catch (error) {
                console.error('❌ API Error:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to update requisition: ' + error.message
                });
            }
        }

    } catch (error) {
        console.error('❌ Error in handleRequisitionAction:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An unexpected error occurred while updating the requisition'
        });
    }
}

// Only reset accumulated data when explicitly closing the modal
document.addEventListener('DOMContentLoaded', () => {
    // Add event listener for when SweetAlert closes
    Swal.getContainer()?.addEventListener('click', (e) => {
        if (e.target.classList.contains('swal2-close')) {
            accumulatedApprovals = {};
            accumulatedComments = {};
            currentRequisition = null;
        }
    });
});

// Update the renderTable function
const renderTable = () => {
    const tableBody = document.getElementById("chaptersTableBody");
    
    if (filteredRequisitions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="d-flex flex-column align-items-center">
                        <i class="ri-filter-off-line mb-2" style="font-size: 2rem; color: #dc2626;"></i>
                        <p class="mb-0 text-muted">No entries match the applied filters</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    // First update the table headers with sort icons
    const tableHeaders = document.querySelector('thead tr');
    tableHeaders.innerHTML = `
        <th scope="col" onclick="sortTable('chapter_requisition_id')" style="cursor: pointer">
            S.No. <i class="ri-arrow-${currentSort.column === 'chapter_requisition_id' ? 
            (currentSort.direction === 'asc' ? 'up' : 'down') : 'up-down'}-line ms-1"></i>
        </th>
        <th scope="col" onclick="sortTable('chapter_name')" style="cursor: pointer">
            Chapter Name <i class="ri-arrow-${currentSort.column === 'chapter_name' ? 
            (currentSort.direction === 'asc' ? 'up' : 'down') : 'up-down'}-line ms-1"></i>
        </th>
        <th scope="col" onclick="sortTable('accolades')" style="cursor: pointer">
            Accolades Requested <i class="ri-arrow-${currentSort.column === 'accolades' ? 
            (currentSort.direction === 'asc' ? 'up' : 'down') : 'up-down'}-line ms-1"></i>
        </th>
        <th scope="col" onclick="sortTable('description')" style="cursor: pointer">
            Accolades Description <i class="ri-arrow-${currentSort.column === 'description' ? 
            (currentSort.direction === 'asc' ? 'up' : 'down') : 'up-down'}-line ms-1"></i>
        </th>
        <th scope="col" onclick="sortTable('comment')" style="cursor: pointer">
            Comment <i class="ri-arrow-${currentSort.column === 'comment' ? 
            (currentSort.direction === 'asc' ? 'up' : 'down') : 'up-down'}-line ms-1"></i>
        </th>
        <th scope="col" onclick="sortTable('date')" style="cursor: pointer">
            Requested date <i class="ri-arrow-${currentSort.column === 'date' ? 
            (currentSort.direction === 'asc' ? 'up' : 'down') : 'up-down'}-line ms-1"></i>
        </th>
        <th scope="col" onclick="sortTable('pickup_status')" style="cursor: pointer">
            Pickup Status <i class="ri-arrow-${currentSort.column === 'pickup_status' ? 
            (currentSort.direction === 'asc' ? 'up' : 'down') : 'up-down'}-line ms-1"></i>
        </th>
        <th scope="col" onclick="sortTable('status')" style="cursor: pointer">
            Status <i class="ri-arrow-${currentSort.column === 'status' ? 
            (currentSort.direction === 'asc' ? 'up' : 'down') : 'up-down'}-line ms-1"></i>
        </th>
    `;

    tableBody.innerHTML = filteredRequisitions
        .map((req, index) => {
            const chapter = allChapters.find(ch => ch.chapter_id === req.chapter_id);
            
            // Format the requested date
            const requestDate = new Date(req.requested_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            const slabWiseComment = req.slab_wise_comment || 'No comment provided';
            

            // Determine button style and text based on pickup_status
            const isReadyToPickup = req.pickup_status;
            const pickupButtonStyle = isReadyToPickup ? '#dcfce7' : '#fee2e2';
            const pickupButtonColor = isReadyToPickup ? '#16a34a' : '#dc2626';
            const pickupButtonText = isReadyToPickup ? 'Ready to Pickup' : 'Not Ready to Pickup';
            const pickupButtonIcon = isReadyToPickup ? 'ri-checkbox-circle-line' : 'ri-time-line';
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
                    
                    <!-- Add new Accolades Description column here -->
                    <td style="padding: 16px; text-align: center;">
                        <button 
                            onclick="handleViewAccoladeDetails(${JSON.stringify(req).replace(/"/g, '&quot;')})"
                            class="btn btn-sm"
                            style="
                                background: linear-gradient(145deg, #3b82f6, #1d4ed8);
                                color: white;
                                border: none;
                                padding: 5px 15px;
                                border-radius: 6px;
                                font-size: 0.8rem;
                                display: inline-flex;
                                align-items: center;
                                gap: 5px;
                                transition: all 0.3s ease;
                            "
                            onmouseover="this.style.transform='translateY(-2px)'"
                            onmouseout="this.style.transform='translateY(0)'"
                        >
                            <i class="ri-eye-line"></i>
                            View Details
                        </button>
                    </td>

                    <!-- Keep existing comment field exactly as it is -->
                    <td style="padding: 16px;">
                        <div class="comment-container" style="
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            <div class="input-group" style="max-width: 250px;">
                                <input 
                                    type="text" 
                                    class="form-control ro-comment"
                                    placeholder="Add comment..."
                                    value="${slabWiseComment}"
                                    style="
                                       border: 1px solid #e5e7eb;
                                        border-radius: 6px 0 0 6px;
                                        padding: 8px 12px;
                                        font-size: 0.875rem;
                                        transition: all 0.3s ease;
                                        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                                        color: ${slabWiseComment === 'No comment provided' ? '#9ca3af' : '#1e293b'};
                                        font-style: ${slabWiseComment === 'No comment provided' ? 'italic' : 'normal'};
                                    "
                                >
                                <button 
                                    class="btn btn-success submit-comment"
                                    style="
                                        border-radius: 0 6px 6px 0;
                                        padding: 8px 12px;
                                        background: #16a34a;
                                        border: none;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        transition: all 0.3s ease;
                                    "
                                >
                                    <i class="ri-check-line" style="color: white;"></i>
                                </button>
                            </div>
                        </div>
                    </td>
                    <td style="font-weight: bold; color: #1e293b; padding: 16px;">
                        ${requestDate}
                    </td>
                    <td style="padding: 16px;">
                        <button 
                            class="pickup-status-btn"
                            style="
                                background: ${pickupButtonStyle};
                                color: ${pickupButtonColor};
                                border: none;
                                padding: 8px 16px;
                                border-radius: 6px;
                                font-weight: 500;
                                display: flex;
                                align-items: center;
                                gap: 6px;
                                cursor: pointer;
                                transition: all 0.3s ease;
                                box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                            "
                            onclick="handlePickupConfirmation(${req.chapter_requisition_id}, ${isReadyToPickup})"
                        >
                            <i class="${pickupButtonIcon}"></i>
                            ${pickupButtonText}
                        </button>
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

    // Add event listeners for comment submission
    document.querySelectorAll('.submit-comment').forEach((btn, index) => {
        btn.addEventListener('click', () => {
            const input = btn.previousElementSibling;
            const comment = input.value.trim();
            const requisitionId = parseInt(btn.closest('tr').querySelector('td:first-child').textContent);
            
            if (comment) {
                handleCommentSubmit(requisitionId, comment);
                input.value = ''; // Clear input after submission
            }
        });
    });

    // Add event listeners for pickup status buttons
    document.querySelectorAll('.pickup-status-btn').forEach(btn => {
        const row = btn.closest('tr');
        const requisitionId = parseInt(row.querySelector('td:first-child').textContent);
        
        // Find the requisition data
        const requisition = allRequisitions.find(req => req.chapter_requisition_id === requisitionId);
        
        if (requisition && requisition.pickup_status && requisition.pickup_date) {
            // Format the date to dd/mm/yy
            const pickupDate = new Date(requisition.pickup_date);
            const formattedDate = pickupDate.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
            });

            // Create a container div for button and date
            const container = document.createElement('div');
            // container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '4px';
            container.style.alignItems = 'center';

            // Style the existing button
            btn.style.background = '#e5e7eb';
            btn.style.color = '#6b7280';
            btn.style.cursor = 'default';
            btn.style.pointerEvents = 'none';
            btn.innerHTML = '<i class="ri-checkbox-circle-line"></i> Picked Up';
            btn.removeEventListener('click', handlePickupConfirmation);

            // Create date element
            const dateSpan = document.createElement('span');
            dateSpan.style.fontSize = '0.75rem';
            dateSpan.style.color = '#6b7280';
            dateSpan.innerHTML = `<i class="ri-calendar-line"></i> ${formattedDate}`;

            // Replace button with container containing button and date
            btn.parentNode.replaceChild(container, btn);
            container.appendChild(btn);
            container.appendChild(dateSpan);
        } else {
            // Normal button for items not picked up
            btn.addEventListener('click', () => {
                const currentStatus = btn.getAttribute('data-status') || 'not-ready';
                handlePickupConfirmation(requisitionId, currentStatus === 'ready');
            });
        }
    });
};

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', loadData);

// Add function to save pickup status and date
async function savePickupStatus(index) {
    const checkbox = document.getElementById(`pickupStatus_${index}`);
    const dateInput = document.getElementById(`pickupDate_${index}`);
    
    if (checkbox.checked && !dateInput.value) {
        Swal.fire({
            icon: 'warning',
            title: 'Warning',
            text: 'Please select a pickup date'
        });
        return;
    }

    const pickupData = {
        pickup_status: checkbox.checked,
        pickup_date: checkbox.checked ? dateInput.value : null
    };

    console.log('📅 Pickup Data:', pickupData);
    // Add your API call here to save the pickup status and date
}

// Modify the comment submission part
function handleCommentSubmit(requisitionId, commentText) {
    try {
        // Prepare the data object for API
        const requestData = {
            chapter_requisition_id: requisitionId,
            slab_wise_comment: commentText,  // Add the comment to slab_wise_comment field
            approve_status: accumulatedApprovals,
            ro_comment: accumulatedComments,
            pickup_status: false,
            pickup_date: null
        };

        console.log('📦 Preparing comment submission:', requestData);

        // Make API call
        fetch('https://backend.bninewdelhi.com/api/updateChapterRequisition', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        })
        .then(response => {
            console.log('🔄 API Response Status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('✅ Comment submitted successfully:', data);

            // Show success toast
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 1500,
                timerProgressBar: true
            });

            Toast.fire({
                icon: 'success',
                title: 'Comment saved successfully'
            });
        })
        .catch(error => {
            console.error('❌ API Error:', error);
            
            // Show error toast
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });

            Toast.fire({
                icon: 'error',
                title: 'Failed to save comment'
            });
        });

    } catch (error) {
        console.error('❌ Error in handleCommentSubmit:', error);
    }
}

// Add this function to handle pickup confirmation
async function handlePickupConfirmation(requisitionId, currentStatus) {
    try {
        // Show confirmation dialog
        const result = await Swal.fire({
            title: 'Confirm Pickup Status',
            text: currentStatus ? 
                  'Are you sure you want to mark this as not picked up?' : 
                  'Are you sure you want to mark this as picked up?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: currentStatus ? 'Yes, mark as not picked up' : 'Yes, mark as picked up',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#dc2626'
        });

        if (result.isConfirmed) {
            // Prepare the update data
            const updateData = {
                chapter_requisition_id: requisitionId,
                pickup_status: !currentStatus,
                // pickup_date: !currentStatus ? new Date().toISOString() : null,
                // Keep existing approvals and comments
                // approve_status: accumulatedApprovals,
                // ro_comment: accumulatedComments
            };

            // Make API call to update pickup status
            const response = await fetch('https://backend.bninewdelhi.com/api/updateChapterRequisition', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                throw new Error('Failed to update pickup status');
            }

            // Show success message
            await Swal.fire({
                title: 'Success!',
                text: currentStatus ? 
                      'Requisition marked as not picked up.' : 
                      'Requisition marked as picked up.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });

            // Refresh the data to show updated status
            loadData();

        }
    } catch (error) {
        console.error('Error updating pickup status:', error);
        Swal.fire({
            title: 'Error!',
            text: 'Failed to update pickup status.',
            icon: 'error'
        });
    }
}

// Add sorting function
function sortTable(column) {
    // Toggle sort direction if clicking the same column
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }

    // Sort the allRequisitions array
    filteredRequisitions.sort((a, b) => {
        let compareA, compareB;

        switch(column) {
            case 'chapter_requisition_id':
                compareA = a.chapter_requisition_id;
                compareB = b.chapter_requisition_id;
                break;
            case 'chapter_name':
                const chapterA = allChapters.find(ch => ch.chapter_id === a.chapter_id);
                const chapterB = allChapters.find(ch => ch.chapter_id === b.chapter_id);
                compareA = chapterA ? chapterA.chapter_name : '';
                compareB = chapterB ? chapterB.chapter_name : '';
                break;
            case 'accolades':
                compareA = a.accolade_ids.length;
                compareB = b.accolade_ids.length;
                break;
            case 'comment':
                compareA = a.slab_wise_comment || '';
                compareB = b.slab_wise_comment || '';
                break;
            case 'date':
                compareA = new Date(a.requested_date);
                compareB = new Date(b.requested_date);
                break;
            case 'pickup_status':
                compareA = a.pickup_status ? 1 : 0;
                compareB = b.pickup_status ? 1 : 0;
                break;
            case 'status':
                compareA = a.request_status;
                compareB = b.request_status;
                break;
            default:
                return 0;
        }

        // Handle the sort direction
        const sortOrder = currentSort.direction === 'asc' ? 1 : -1;
        
        if (compareA < compareB) return -1 * sortOrder;
        if (compareA > compareB) return 1 * sortOrder;
        return 0;
    });

    // Re-render the table with sorted data
    renderTable();
}

// Add some CSS for the sort icons
const style = document.createElement('style');
style.textContent = `
    th {
        position: relative;
        padding-right: 10px !important;
    }
    th i {
        position: absolute;
        // right: 5px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 14px;
        color: #666;
    }
    th:hover {
        background-color: rgba(0,0,0,0.05);
    }
    th:hover i {
        color: #000;
    }
`;
document.head.appendChild(style);

// Add this new function to initialize filters
function initializeFilters() {
    // Initialize accolades filter
    const accoladesFilter = document.getElementById('accolades-filter');
    const uniqueAccoladeIds = [...new Set(allRequisitions.flatMap(req => req.accolade_ids))];
    
    console.log('🎯 Unique Accolade IDs:', uniqueAccoladeIds);

    accoladesFilter.innerHTML = `
        <li><a class="dropdown-item" href="javascript:void(0);" data-accolade="all">
            <i class="ti ti-award me-1"></i>All Accolades
        </a></li>
        ${uniqueAccoladeIds.map(accoladeId => {
            const accolade = allAccolades.find(acc => acc.accolade_id === accoladeId);
            return accolade ? `
                <li><a class="dropdown-item" href="javascript:void(0);" data-accolade="${accoladeId}">
                    <i class="ti ti-award me-1"></i>${accolade.accolade_name}
                </a></li>
            ` : '';
        }).join('')}
    `;

    // Add event listeners for accolades filter
    document.querySelectorAll('#accolades-filter .dropdown-item').forEach(item => {
        item.addEventListener('click', function() {
            const accoladeId = this.getAttribute('data-accolade');
            activeFilters.accolade = accoladeId;
            console.log('🎯 Selected Accolade:', accoladeId);
            applyFilters();
            
            // Update button text
            const buttonText = accoladeId === 'all' ? 'Accolades' : 
                allAccolades.find(acc => acc.accolade_id === parseInt(accoladeId))?.accolade_name;
            this.closest('.dropdown').querySelector('.dropdown-toggle').innerHTML = 
                `<i class="ti ti-award me-1"></i> ${buttonText}`;
        });
    });

    // Initialize chapters filter
    const chaptersFilter = document.getElementById('chapters-filter');
    const uniqueChapters = [...new Set(allRequisitions.map(req => req.chapter_id))];
    
    chaptersFilter.innerHTML = `
        <li><a class="dropdown-item" href="javascript:void(0);" data-chapter="all">
            <i class="ti ti-building me-1"></i>All Chapters
        </a></li>
        ${uniqueChapters.map(chapterId => {
            const chapter = allChapters.find(ch => ch.chapter_id === chapterId);
            return chapter ? `
                <li><a class="dropdown-item" href="javascript:void(0);" data-chapter="${chapterId}">
                    <i class="ti ti-building me-1"></i>${chapter.chapter_name}
                </a></li>
            ` : '';
        }).join('')}
    `;

    // Add event listeners for chapter filter
    document.querySelectorAll('#chapters-filter .dropdown-item').forEach(item => {
        item.addEventListener('click', function() {
            const chapterId = this.getAttribute('data-chapter');
            activeFilters.chapter = chapterId;
            applyFilters();
            
            // Update button text
            const buttonText = chapterId === 'all' ? 'Chapters' : 
                allChapters.find(ch => ch.chapter_id === parseInt(chapterId))?.chapter_name;
            this.closest('.dropdown').querySelector('.dropdown-toggle').innerHTML = 
                `<i class="ti ti-building me-1"></i> ${buttonText}`;
        });
    });

    // Add event listeners for month filter
    document.querySelectorAll('#month-filter .dropdown-item').forEach(item => {
        item.addEventListener('click', function() {
            const month = this.getAttribute('data-month');
            activeFilters.month = month;
            applyFilters();
            
            // Update button text
            const monthNames = ['All Months', 'January', 'February', 'March', 'April', 'May', 'June', 
                              'July', 'August', 'September', 'October', 'November', 'December'];
            const buttonText = month === 'all' ? 'Month' : monthNames[parseInt(month)];
            this.closest('.dropdown').querySelector('.dropdown-toggle').innerHTML = 
                `<i class="ti ti-calendar me-1"></i> ${buttonText}`;
        });
    });

    // Reset filters button
    document.getElementById('reset-filters-btn').addEventListener('click', function() {
        console.log('🔄 Resetting all filters');
        
        activeFilters = {
            chapter: 'all',
            month: 'all',
            accolade: 'all'
        };

        // Reset all dropdown texts
        document.querySelector('#accolades-filter').closest('.dropdown')
            .querySelector('.dropdown-toggle').innerHTML = '<i class="ti ti-award me-1"></i> Accolades';
        document.querySelector('#chapters-filter').closest('.dropdown')
            .querySelector('.dropdown-toggle').innerHTML = '<i class="ti ti-building me-1"></i> Chapters';
        document.querySelector('#month-filter').closest('.dropdown')
            .querySelector('.dropdown-toggle').innerHTML = '<i class="ti ti-calendar me-1"></i> Month';

        filteredRequisitions = [...allRequisitions];
        renderTable();
    });
}

// Add this function to apply filters
function applyFilters() {
    console.log('🔍 Applying filters:', activeFilters);
    
    filteredRequisitions = [...allRequisitions];

    if (activeFilters.accolade !== 'all') {
        filteredRequisitions = filteredRequisitions.filter(req => 
            req.accolade_ids.includes(parseInt(activeFilters.accolade))
        );
        console.log('🏆 Filtered by accolade:', filteredRequisitions.length, 'results');
    }

    if (activeFilters.chapter !== 'all') {
        filteredRequisitions = filteredRequisitions.filter(req => 
            req.chapter_id === parseInt(activeFilters.chapter)
        );
        console.log('🏢 Filtered by chapter:', filteredRequisitions.length, 'results');
    }

    if (activeFilters.month !== 'all') {
        filteredRequisitions = filteredRequisitions.filter(req => {
            const reqDate = new Date(req.requested_date);
            return (reqDate.getMonth() + 1) === parseInt(activeFilters.month);
        });
        console.log('📅 Filtered by month:', filteredRequisitions.length, 'results');
    }

    console.log('✨ Final filtered results:', filteredRequisitions);
    renderTable();
}

async function handleViewAccoladeDetails(requisition) {
    try {
        // Fetch necessary data
        const [accoladesResponse, membersResponse, visitorsResponse] = await Promise.all([
            fetch('https://backend.bninewdelhi.com/api/accolades'),
            fetch('https://backend.bninewdelhi.com/api/members'),
            fetch('https://backend.bninewdelhi.com/api/getallvisitors')
        ]);

        const [allAccolades, allMembers, visitors] = await Promise.all([
            accoladesResponse.json(),
            membersResponse.json(),
            visitorsResponse.json()
        ]);

        // Create combinations array
        const combinations = [];
        requisition.member_ids.forEach(memberId => {
            let memberName;
            let isVisitor = false;

            if (memberId === 0) {
                isVisitor = true;
                const visitor = visitors.find(v => v.visitor_id === requisition.visitor_id);
                memberName = visitor ? `${visitor.visitor_name} (Visitor)` : 'Unknown Visitor';
            } else {
                const member = allMembers.find(m => m.member_id === memberId);
                memberName = member ? `${member.member_first_name} ${member.member_last_name}` : `Member ID: ${memberId}`;
            }
            
            requisition.accolade_ids.forEach(accoladeId => {
                const accolade = allAccolades.find(acc => acc.accolade_id === accoladeId);
                combinations.push({ memberId, memberName, accolade, isVisitor });
            });
        });

        // Group combinations by accolade
        const accoladeGroups = combinations.reduce((groups, combo) => {
            const key = combo.accolade.accolade_id;
            if (!groups[key]) {
                groups[key] = {
                    accolade: combo.accolade,
                    members: []
                };
            }
            groups[key].members.push({
                name: combo.memberName,
                isVisitor: combo.isVisitor
            });
            return groups;
        }, {});

        // Create HTML for each accolade group
        const accoladesHtml = Object.values(accoladeGroups).map(group => `
            <div class="accolade-card" style="
                background: white;
                border-radius: 16px;
                margin-bottom: 24px;
                box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.15);
                overflow: hidden;
                border: 1px solid rgba(0, 0, 0, 0.05);
                position: relative;
            ">
                <!-- Sticky Accolade Header -->
                <div style="
                    background: ${group.accolade.accolade_type === 'Global' ? 
                        'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 
                        'linear-gradient(135deg, #ef4444, #b91c1c)'};
                    padding: 20px;
                    color: white;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                ">
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        position: relative;
                    ">
                        <h3 style="
                            margin: 0;
                            font-size: 1.35rem;
                            font-weight: 600;
                            display: flex;
                            align-items: center;
                            gap: 12px;
                            color: white;
                        ">
                            <i class="ri-award-fill" style="font-size: 1.5rem;"></i>
                            ${group.accolade.accolade_name}
                            <span style="
                                font-size: 0.9rem;
                                opacity: 0.9;
                                font-weight: normal;
                                color: white;
                            ">(${group.members.length} members)</span>
                        </h3>
                        <div style="
                            background: rgba(255, 255, 255, 0.15);
                            padding: 6px 16px;
                            border-radius: 9999px;
                            font-size: 0.875rem;
                            color: white;
                            backdrop-filter: blur(4px);
                            border: 1px solid rgba(255, 255, 255, 0.2);
                            font-weight: 500;
                            letter-spacing: 0.5px;
                        ">
                            ${group.accolade.accolade_type}
                        </div>
                    </div>
                </div>

                <!-- Members List -->
                <div style="padding: 20px;">
                    <div style="
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                    ">
                        ${group.members.map(member => `
                            <div style="
                                display: flex;
                                align-items: center;
                                gap: 10px;
                                padding: 12px;
                                background: ${member.isVisitor ? 
                                    'linear-gradient(to right, #f0fdf4, #dcfce7)' : 
                                    'linear-gradient(to right, #f1f5f9, #f8fafc)'};
                                border-radius: 10px;
                                transition: transform 0.2s ease;
                                border: 1px solid ${member.isVisitor ? '#86efac' : '#e2e8f0'};
                            "
                            onmouseover="this.style.transform='translateX(5px)'"
                            onmouseout="this.style.transform='translateX(0)'"
                            >
                                <div style="
                                    background: ${member.isVisitor ? '#22c55e' : '#64748b'};
                                    color: white;
                                    width: 32px;
                                    height: 32px;
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                ">
                                    <i class="ri-${member.isVisitor ? 'user-follow-line' : 'user-line'}"></i>
                                </div>
                                <span style="
                                    color: ${member.isVisitor ? '#15803d' : '#1e293b'};
                                    font-weight: 500;
                                    flex-grow: 1;
                                ">${member.name}</span>
                                <span style="
                                    font-size: 0.8rem;
                                    color: ${member.isVisitor ? '#16a34a' : '#64748b'};
                                    background: ${member.isVisitor ? '#dcfce7' : '#f1f5f9'};
                                    padding: 4px 12px;
                                    border-radius: 9999px;
                                    border: 1px solid ${member.isVisitor ? '#86efac' : '#e2e8f0'};
                                ">
                                    ${member.isVisitor ? 'Visitor' : 'Member'}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `).join('');

        // Show SweetAlert with a compact header
        Swal.fire({
            html: `
                <div style="
                    margin: -20px -20px 0 -20px;
                    padding: 15px 20px;
                    border-bottom: 1px solid #e5e7eb;
                    background: linear-gradient(to right, #f8fafc, #ffffff);
                ">
                    <h3 style="
                        margin: 0;
                        color: #2563eb;
                        font-size: 1.1rem;
                        font-weight: 600;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    ">
                        <i class="ri-award-fill"></i>
                        Accolade Details
                    </h3>
                </div>
                <div style="
                    max-height: 85vh;
                    overflow-y: auto;
                    padding: 0;
                    margin: 0 -20px -20px -20px;
                    scrollbar-width: thin;
                ">
                    ${accoladesHtml}
                </div>
            `,
            width: '650px',
            showCloseButton: true,
            showConfirmButton: false,
            padding: '20px',
            customClass: {
                container: 'accolade-details-modal'
            }
        });

    } catch (error) {
        console.error('Error in handleViewAccoladeDetails:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load accolade details'
        });
    }
}