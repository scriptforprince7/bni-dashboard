const accoladesApiUrl = "http://backend.bninewdelhi.com/api/accolades";
const chaptersApiUrl = "http://backend.bninewdelhi.com/api/chapters";
const requisitionsApiUrl = "http://backend.bninewdelhi.com/api/getRequestedChapterRequisition";

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

// Add these variables at the top with other global variables
let selectedActions = {};

// Add these new functions at the top with other global variables
const PICKUP_STATUSES = {
    PENDING: 'yet_to_be_ready',
    READY: 'ready_for_pickup',
    PICKED: 'picked_up',
    FAILED: 'pickup_failed'
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
            fetch('http://backend.bninewdelhi.com/api/accolades')  // Add accolades API
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
        
        // Reset selected actions for new popup
        selectedActions = {};
        
        // Parse approve status and comments only if not a visitor request
        let approveStatusMap = {};
        let commentsMap = {};
        let roCommentsMap = '';
        
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
            approveStatusMap = requisition.approve_status || '';
            commentsMap = requisition.comment || '';
            roCommentsMap = requisition.ro_comment || '';
            console.log('👤 Visitor RO Comment:', roCommentsMap);
        }

        // Fetch all required data
        const [accoladesResponse, chaptersResponse, membersResponse, memberRequisitionsResponse, visitorsResponse, chapterRequisitionResponse] = await Promise.all([
            fetch('http://backend.bninewdelhi.com/api/accolades'),
            fetch('http://backend.bninewdelhi.com/api/chapters'),
            fetch('http://backend.bninewdelhi.com/api/members'),
            fetch('http://backend.bninewdelhi.com/api/getRequestedMemberRequisition'),
            fetch('http://backend.bninewdelhi.com/api/getallvisitors'),
            fetch('http://backend.bninewdelhi.com/api/getRequestedChapterRequisition')
        ]);

        const [allAccolades, allChapters, allMembers, memberRequisitions, visitors, chapterRequisitions] = await Promise.all([
            accoladesResponse.json(),
            chaptersResponse.json(),
            membersResponse.json(),
            memberRequisitionsResponse.json(),
            visitorsResponse.json(),
            chapterRequisitionResponse.json()
        ]);

        const chapter = allChapters.find(ch => ch.chapter_id === requisition.chapter_id);
        
        // Find the specific chapter requisition - use chapterRequisitions directly
        const currentChapterReq = chapterRequisitions.find(req => 
            req.chapter_requisition_id === requisition.chapter_requisition_id
        );

        // Parse the comment field to get the actual pairs
        const commentPairs = JSON.parse(currentChapterReq.comment || '{}');

        // Create combinations only for existing pairs
        const combinations = [];
        Object.keys(commentPairs).forEach(pair => {
            const [memberId, accoladeId] = pair.split('_').map(Number);
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
            
            const accolade = allAccolades.find(acc => acc.accolade_id === accoladeId);
            const commentKey = `${memberId}_${accoladeId}`;
            const comment = commentsMap[commentKey] || '';
            const roComment = roCommentsMap[commentKey] || '';
            const currentStatus = approveStatusMap[commentKey];

            combinations.push({
                memberId,
                memberName,
                accolade,
                comment,
                roComment,
                isVisitor,
                currentStatus
            });
        });

        // Create HTML for the popup
        Swal.fire({
            title: '<div style="color: #2563eb; margin-bottom: 20px;"><i class="ri-file-list-3-line"></i> Accolade Request Details</div>',
            html: `
                <div style="
                    margin-bottom: 20px;
                    display: flex;
                    
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px;
                    background: #f8fafc;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                ">
                    <div style="display: flex; gap: 12px;">
                        <button 
                            onclick="selectAllCheckboxes()"
                            class="btn"
                            style="
                                padding: 8px 16px;
                                border-radius: 6px;
                                background: #e2e8f0;
                                color: #475569;
                                border: none;
                                display: flex;
                                align-items: center;
                                gap: 6px;
                            "
                        >
                            <i class="ri-checkbox-multiple-line"></i>
                            Select All
                        </button>
                        <button 
                            onclick="bulkApprove()"
                            class="btn"
                            style="
                                padding: 8px 16px;
                                border-radius: 6px;
                                background: #dcfce7;
                                color: #16a34a;
                                border: none;
                                display: flex;
                                align-items: center;
                                gap: 6px;
                            "
                        >
                            <i class="ri-checkbox-circle-line"></i>
                            Approve Selected
                        </button>
                        <button 
                            onclick="bulkDecline()"
                            class="btn"
                            style="
                                padding: 8px 16px;
                                border-radius: 6px;
                                background: #fee2e2;
                                color: #dc2626;
                                border: none;
                                display: flex;
                                align-items: center;
                                gap: 6px;
                            "
                        >
                            <i class="ri-close-circle-line"></i>
                            Decline Selected
                        </button>
                    </div>
                   <button 
    onclick="submitBulkActions()"
    class="btn"
    style="
        padding: 8px 24px;
        border-radius: 6px;
        background: #2563eb;
        color: white;
        border: none;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
    "
>
    <i class="ri-save-line"></i>
    Submit Status
</button>

<!-- Loader for Submit Status -->
<div id="submitStatusLoader" style="display:none; text-align:center; margin:20px 0;">
  <span class="spinner-border text-primary" style="width:3rem; height:3rem;" role="status" aria-hidden="true"></span>
  <div style="margin-top:12px; color:#2563eb; font-weight:600; font-size:1.2rem;">Submitting status, please wait...</div>
</div>
                </div>
                <div class="request-details-container" style="
                    width: 100%;
                    max-height: 80vh;
                    overflow-y: auto;
                ">
                    <table style="
                        width: 100%;
                        border-collapse: separate;
                        border-spacing: 0;
                        background: white;
                        border-radius: 8px;
                        overflow: hidden;
                    ">
                        <thead>
                            <tr style="
                                background: linear-gradient(145deg, #1e40af, #2563eb);
                                color: white;
                                text-align: left;
                            ">
                                <th style="padding: 16px; font-weight: 600; white-space: nowrap;">
                                    <i class="ri-checkbox-line me-2"></i>Select
                                </th>
                                <th style="padding: 16px; font-weight: 600; white-space: nowrap;">
                                    <i class="ri-number-s me-2"></i>S.No
                                </th>
                                <th style="padding: 16px; font-weight: 600; white-space: nowrap;">
                                    <i class="ri-award-fill me-2"></i>Accolade Name
                                </th>
                                <th style="padding: 16px; font-weight: 600; white-space: nowrap;">
                                    <i class="ri-user-line me-2"></i>Member Name
                                </th>
                                <th style="padding: 16px; font-weight: 600; white-space: nowrap;">
                                    <i class="ri-building-line me-2"></i>Chapter Name
                                </th>
                                <th style="padding: 16px; font-weight: 600; white-space: nowrap;">
                                    <i class="ri-chat-1-line me-2"></i>Chapter Comment
                                </th>
                                <th style="padding: 16px; font-weight: 600; white-space: nowrap;">
                                    <i class="ri-price-tag-3-line me-2"></i>Accolade Type
                                </th>
                                <th style="padding: 16px; font-weight: 600; white-space: nowrap;">
                                    <i class="ri-chat-2-line me-2"></i>RO Comment
                                </th>
                                <th style="padding: 16px; font-weight: 600; text-align: center; white-space: nowrap;">
                                    <i class="ri-checkbox-circle-line me-2"></i>Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            ${combinations.map((combo, index) => {
                                const key = `${combo.memberId}_${combo.accolade.accolade_id}`;
                                const isPaid = checkAccoladePaidStatus(
                                    memberRequisitions, 
                                    combo.memberId, 
                                    requisition.chapter_id, 
                                    combo.accolade.accolade_id
                                );

                                return `
                                    <tr style="
                                        border-bottom: 1px solid #e5e7eb;
                                        background: ${index % 2 === 0 ? '#f8fafc' : 'white'};
                                        transition: background-color 0.3s ease;
                                    "
                                    onmouseover="this.style.backgroundColor='#f1f5f9'"
                                    onmouseout="this.style.backgroundColor='${index % 2 === 0 ? '#f8fafc' : 'white'}'">
                                        <td style="padding: 16px; text-align: center;">
                                            <input 
                                                type="checkbox" 
                                                class="accolade-checkbox"
                                                data-key="${key}"
                                                style="
                                                    width: 18px;
                                                    height: 18px;
                                                    cursor: pointer;
                                                "
                                                ${combo.currentStatus ? 'disabled' : ''}
                                            >
                                        </td>
                                        <td style="padding: 16px;">
                                            <span style="color: #1e293b; font-weight: 500;">${index + 1}</span>
                                        </td>
                                        <td style="padding: 16px;">
                                            <div style="
                                                display: flex;
                                                align-items: center;
                                                gap: 8px;
                                            ">
                                                <span style="font-weight: 500; color: #1e293b;">
                                                    ${combo.accolade.accolade_name}
                                                </span>
                                                <span style="
                                                    background: ${combo.accolade.accolade_type === 'Global' ? '#4f46e5' : '#e11d48'};
                                                    padding: 2px 8px;
                                                    border-radius: 12px;
                                                    font-size: 0.75rem;
                                                    color: white;
                                                ">
                                                    ${combo.accolade.accolade_type}
                                                </span>
                                            </div>
                                        </td>
                                        <td style="padding: 16px;">
                                            <span style="color: #1e293b; font-weight: 600;">${combo.memberName}</span>
                                        </td>
                                        <td style="padding: 16px;">
                                            <span style="color: #1e293b; font-weight: 600;">${chapter ? chapter.chapter_name : 'Unknown Chapter'}</span>
                                        </td>
                                        <td style="padding: 16px;">
                                            <span style="color: #1e293b; font-weight: 600;">${combo.comment || 'No comment provided'}</span>
                                        </td>
                                        <td style="padding: 16px;">
                                            <span style="
                                                color: ${isPaid ? '#059669' : '#6366f1'};
                                                display: flex;
                                                align-items: center;
                                                gap: 4px;
                                            ">
                                                <i class="ri-${isPaid ? 'shopping-cart-2' : 'gift'}-line"></i>
                                                ${isPaid ? 'Paid' : 'Free'}
                                            </span>
                                        </td>
                                        <td style="padding: 16px;">
                                            <textarea 
                                                id="ro-comment-${key}"
                                                class="form-control" 
                                                placeholder="Enter your comment here..."
                                                style="
                                                    width: 100%;
                                                    padding: 8px;
                                                    border: 1px solid #e5e7eb;
                                                    border-radius: 6px;
                                                    resize: vertical;
                                                    min-height: 38px;
                                                    font-size: 0.875rem;
                                                "
                                                onchange="handleBulkAction('${key}')"
                                            >${combo.roComment}</textarea>
                                        </td>
                                        <td style="padding: 16px; text-align: center;">
                                            <div style="
                                                display: flex;
                                                gap: 8px;
                                                justify-content: center;
                                            ">
                                               <button 
    onclick="handleBulkAction('${key}', 'declined')"
    class="action-btn decline-btn"
    data-key="${key}"
    style="
        padding: 8px 18px;
        border-radius: 999px;
        border: none;
        background: ${combo.currentStatus === 'declined'
            ? 'linear-gradient(90deg, #e5e7eb 60%, #f3f4f6 100%)'
            : 'linear-gradient(90deg, #f87171 0%, #ef4444 100%)'};
        color: ${combo.currentStatus === 'declined' ? '#9ca3af' : '#fff'};
        cursor: ${combo.currentStatus === 'declined' ? 'not-allowed' : 'pointer'};
        opacity: ${combo.currentStatus === 'declined' ? '0.7' : '1'};
        filter: ${combo.currentStatus === 'declined' ? 'grayscale(1)' : 'none'};
        box-shadow: 0 2px 8px rgba(239,68,68,0.08);
        font-weight: 600;
        font-size: 0.98em;
        transition: all 0.2s;
        margin-right: 8px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
    "
    ${combo.currentStatus === 'declined' ? 'disabled' : ''}
>
    <i class="ri-close-circle-line" style="font-size: 1.2em;"></i>
    Decline
</button>
<button 
    onclick="handleBulkAction('${key}', 'approved')"
    class="action-btn approve-btn"
    data-key="${key}"
    style="
        padding: 8px 18px;
        border-radius: 999px;
        border: none;
        background: ${combo.currentStatus === 'approved'
            ? 'linear-gradient(90deg, #e5e7eb 60%, #f3f4f6 100%)'
            : 'linear-gradient(90deg, #34d399 0%, #2563eb 100%)'};
        color: ${combo.currentStatus === 'approved' ? '#9ca3af' : '#fff'};
        cursor: ${combo.currentStatus === 'approved' ? 'not-allowed' : 'pointer'};
        opacity: ${combo.currentStatus === 'approved' ? '0.7' : '1'};
        filter: ${combo.currentStatus === 'approved' ? 'grayscale(1)' : 'none'};
        box-shadow: 0 2px 8px rgba(52,211,153,0.08);
        font-weight: 600;
        font-size: 0.98em;
        transition: all 0.2s;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
    "
    ${combo.currentStatus === 'approved' ? 'disabled' : ''}
>
    <i class="ri-checkbox-circle-line" style="font-size: 1.2em;"></i>
    Approve
</button>
                                            </div>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `,
            width: '100%',
            showCloseButton: true,
            showConfirmButton: false,
            padding: '24px',
            customClass: {
                container: 'swal-wide',
                popup: 'swal-wide-popup'
            }
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

// Add these new functions for bulk actions
function selectAllCheckboxes() {
    const checkboxes = document.querySelectorAll('.accolade-checkbox:not([disabled])');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = !allChecked;
    });
}

function handleBulkAction(key, action) {
    const commentEl = document.querySelector(`#ro-comment-${key}`);
    const comment = commentEl ? commentEl.value : '';

    // If action is provided, update the status. Otherwise, just update the comment
    if (action) {
        selectedActions[key] = {
            status: action,
            comment: comment
        };
        
        // Update button styles
        const row = document.querySelector(`[data-key="${key}"]`).closest('tr');
        const approveBtn = row.querySelector('.approve-btn');
        const declineBtn = row.querySelector('.decline-btn');
        
        // Reset both buttons first
        approveBtn.style.background = '#dcfce7';
        approveBtn.style.opacity = '1';
        declineBtn.style.background = '#fee2e2';
        declineBtn.style.opacity = '1';
        
        // Then highlight the selected action
        if (action === 'approved') {
            approveBtn.style.background = '#bbf7d0';
            approveBtn.style.opacity = '0.7';
            declineBtn.style.background = '#fee2e2';
            declineBtn.style.opacity = '1';
        } else {
            declineBtn.style.background = '#fecaca';
            declineBtn.style.opacity = '0.7';
            approveBtn.style.background = '#dcfce7';
            approveBtn.style.opacity = '1';
        }
    } else {
        // If no action is provided, just update the comment while preserving existing status
        const existingAction = selectedActions[key];
        selectedActions[key] = {
            status: existingAction ? existingAction.status : undefined,
            comment: comment
        };
    }
}

function bulkApprove() {
    const checkboxes = document.querySelectorAll('.accolade-checkbox:checked:not([disabled])');
    checkboxes.forEach(checkbox => {
        const key = checkbox.getAttribute('data-key');
        handleBulkAction(key, 'approved');
    });
}

function bulkDecline() {
    const checkboxes = document.querySelectorAll('.accolade-checkbox:checked:not([disabled])');
    checkboxes.forEach(checkbox => {
        const key = checkbox.getAttribute('data-key');
        handleBulkAction(key, 'declined');
    });
}

// async function submitBulkActions() {


//     try {
//         // Get the current requisition's existing data
//         const existingApproveStatus = currentRequisition.approve_status ? 
//             JSON.parse(currentRequisition.approve_status) : {};
//         const existingRoComments = currentRequisition.ro_comment ? 
//             JSON.parse(currentRequisition.ro_comment) : {};

//         // Prepare the data for API
//         const updateData = {
//             chapter_requisition_id: currentRequisition.chapter_requisition_id,
//             approve_status: { ...existingApproveStatus },
//             ro_comment: { ...existingRoComments }
//         };

//         // Populate the update data
//         for (const [key, action] of Object.entries(selectedActions)) {
//             // Only update status if one was selected
//             if (action.status) {
//                 updateData.approve_status[key] = action.status;
//             }
//             // Always update comment if provided
//             if (action.comment && action.comment.trim()) {
//                 updateData.ro_comment[key] = action.comment.trim();
//             }
//         }

//         // Make API call
//         const response = await fetch('http://backend.bninewdelhi.com/api/updateChapterRequisition', {
//             method: 'PUT',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify(updateData)
//         });

//         if (!response.ok) {
//             throw new Error('Failed to update requisitions');
//         }

//         // Show success message
//         await Swal.fire({
//             icon: 'success',
//             title: 'Success!',
//             text: 'Changes saved successfully',
//             timer: 2000,
//             showConfirmButton: false
//         });

//         // Refresh the data
//         loadData();

//     } catch (error) {
//         console.error('Error in submitBulkActions:', error);
//         Swal.fire({
//             icon: 'error',
//             title: 'Error',
//             text: 'Failed to process changes: ' + error.message
//         });
//     }
// }


// Comment out original function
/*
async function submitBulkActions() {
    // ... original code ...
}
*/

// New simplified version
async function submitBulkActions() {
    // Show loader
    const loader = document.getElementById('submitStatusLoader');
    if (loader) loader.style.display = 'block';

    try {
        console.log('🎯 Starting Simplified Submit Actions');
        console.log('📦 Selected Actions:', selectedActions);

        // Process each selected action
        for (const [key, action] of Object.entries(selectedActions)) {
            console.log('🔄 Processing action:', { key, action });
            
            const [memberId, accoladeId] = key.split('_');
            console.log('🔍 Parsed IDs:', { memberId, accoladeId });

            // Call handleRequisitionAction directly
            await handleRequisitionAction({
                memberId: parseInt(memberId),
                accoladeId: parseInt(accoladeId),
                status: action.status,
                requisitionId: currentRequisition.chapter_requisition_id,
                skipRefresh: true  // Add this flag to skip individual refreshes
            });
        }

        // Show single success message at the end
        await Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'All changes processed successfully',
            timer: 2000,
            showConfirmButton: false
        });

        // Refresh the data once at the end
        loadData();

    } catch (error) {
        console.error('❌ Error in simplified submitBulkActions:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to process changes: ' + error.message
        });
    } finally {
        // Hide loader
        if (loader) loader.style.display = 'none';
    }
}

// Function to handle requisition action
async function handleRequisitionAction(data) {
    try {
        const actionData = typeof data === 'string' ? JSON.parse(data) : data;
        const skipRefresh = actionData.skipRefresh || false;  // Get the flag
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
            const chapterResponse = await fetch('http://backend.bninewdelhi.com/api/updateChapterRequisition', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(chapterRequestData)
            });

            if (!chapterResponse.ok) {
                throw new Error('Chapter requisition update failed');
            }

            // Only show message and refresh if not bulk action
            if (!skipRefresh) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: `Visitor requisition ${actionData.status} successfully`,
                    timer: 2000,
                    showConfirmButton: false
                });
                loadData();
            }

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
                const chapterResponse = await fetch('http://backend.bninewdelhi.com/api/updateChapterRequisition', {
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
                        req.accolade_id === actionData.accoladeId &&
                        req.given_status === false &&
                        req.request_status === 'open' &&
                        req.given_date === null
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
                        
                        approved_date: actionData.status === 'approved' ? new Date().toISOString() : null
                    };

                    console.log('📝 Member Request Data:', memberRequestData);

                    const memberResponse = await fetch('http://backend.bninewdelhi.com/api/updateMemberRequisition', {
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
                    const response = await fetch('http://backend.bninewdelhi.com/api/getRequestedMemberRequisition');
                    const allMemberRequisitions = await response.json();
                    
                    // Check if this specific free accolade exists in member requisitions
                    const freeReq = allMemberRequisitions.find(req => 
                        req.member_id === actionData.memberId && 
                        req.chapter_id === currentRequisition.chapter_id && 
                        req.accolade_id === actionData.accoladeId &&
                        req.given_status === false &&
                        req.request_status === 'open' &&
                        req.given_date === null
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
                               
                                approved_date: actionData.status === 'approved' ? new Date().toISOString() : null
                            };

                            const freeResponse = await fetch('http://backend.bninewdelhi.com/api/updateMemberRequisition', {
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

                // Only show message and refresh if not bulk action
                if (!skipRefresh) {
                    await Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: `Requisition ${actionData.status} successfully`,
                        timer: 2000,
                        showConfirmButton: false
                    });
                    loadData();
                }

            } catch (error) {
                console.error('❌ API Error:', error);
                throw error; // Propagate error to be handled by submitBulkActions
            }
        }

    } catch (error) {
        console.error('❌ Error in handleRequisitionAction:', error);
        throw error; // Propagate error to be handled by submitBulkActions
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
        <th scope="col" onclick="sortTable('approved')" style="cursor: pointer">
            Approved <i class="ri-arrow-${currentSort.column === 'approved' ? 
            (currentSort.direction === 'asc' ? 'up' : 'down') : 'up-down'}-line ms-1"></i>
        </th>
        <th scope="col" onclick="sortTable('rejected')" style="cursor: pointer">
            Rejected <i class="ri-arrow-${currentSort.column === 'rejected' ? 
            (currentSort.direction === 'asc' ? 'up' : 'down') : 'up-down'}-line ms-1"></i>
        </th>
        
        <th scope="col" onclick="sortTable('date')" style="cursor: pointer">
            Requested date <i class="ri-arrow-${currentSort.column === 'date' ? 
            (currentSort.direction === 'asc' ? 'up' : 'down') : 'up-down'}-line ms-1"></i>
        </th>
        <th scope="col" onclick="sortTable('requested_by')" style="cursor: pointer">
            Requested By <i class="ri-arrow-${currentSort.column === 'requested_by' ? 
            (currentSort.direction === 'asc' ? 'up' : 'down') : 'up-down'}-line ms-1"></i>
        </th>
        <th scope="col" onclick="sortTable('pickup_status')" style="cursor: pointer">
            Pickup Status (By RO) <i class="ri-arrow-${currentSort.column === 'pickup_status' ? 
            (currentSort.direction === 'asc' ? 'up' : 'down') : 'up-down'}-line ms-1"></i>
        </th>
        <th scope="col" onclick="sortTable('pickup_status')" style="cursor: pointer">
            Pickup Status (By Chapter)<i class="ri-arrow-${currentSort.column === 'pickup_status' ? 
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
                            ><span style="font-weight: 500; color: #1e293b;">
                ${req.accolade_ids.length} Accolades, ${req.member_ids.length} Members Requested
            </span>
                            </div>
                        </div>
                    </td>
                    
                    <!-- Add new Accolades Description column here -->
                    <td style="padding: 16px; text-align: center;">
                        <div 
                            onclick="handleViewAccoladeDetails(${JSON.stringify(req).replace(/"/g, '&quot;')})"
                            style="
                                display: inline-flex;
                                align-items: center;
                                gap: 6px;
                                background: linear-gradient(to right, #f0f9ff, #e0f2fe);
                                color: #0369a1;
                                border: 1px solid #bae6fd;
                                padding: 4px 12px;
                                border-radius: 8px;
                                font-size: 0.875rem;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.3s ease;
                                min-width: 32px;
                                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                            "
                            onmouseover="
                                this.style.transform='translateY(-2px)';
                                this.style.boxShadow='0 8px 16px -4px rgba(3, 105, 161, 0.15)';
                                this.style.background='linear-gradient(to right, #e0f2fe, #bae6fd)';
                            "
                            onmouseout="
                                this.style.transform='translateY(0)';
                                this.style.boxShadow='0 1px 2px rgba(0, 0, 0, 0.05)';
                                this.style.background='linear-gradient(to right, #f0f9ff, #e0f2fe)';
                            "
                        >
                            <i class="ri-eye-line" style="
                                font-size: 1rem;
                                color: #0284c7;
                                animation: pulse 2s infinite;
                            "></i>
                            <span style="
                                background: #ffffff;
                                padding: 2px 6px;
                                border-radius: 4px;
                                box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
                            ">${Object.keys(JSON.parse(req.comment || '{}')).length}</span>
                        </div>

                        <style>
                            @keyframes pulse {
                                0% { opacity: 1; }
                                50% { opacity: 0.7; }
                                100% { opacity: 1; }
                            }
                        </style>
                    </td>

                    <!-- Comment field -->
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
                                        cursor: pointer;
                                    "
                                    onclick="handleCommentSubmit(${req.chapter_requisition_id}, this.previousElementSibling.value)"
                                >
                                    <i class="ri-check-line" style="color: white;"></i>
                                </button>
                            </div>
                        </div>
                    </td>

                    <!-- Approved column with count -->
                    <td style="padding: 16px; text-align: center;">
                        <button 
                            class="btn btn-sm"
                            style="
                                background: #dcfce7;
                                color: #16a34a;
                                border: none;
                                padding: 6px 12px;
                                border-radius: 20px;
                                font-size: 0.875rem;
                                display: inline-flex;
                                align-items: center;
                                gap: 4px;
                                transition: all 0.3s ease;
                                box-shadow: 0 2px 4px rgba(22, 163, 74, 0.1);
                            "
                            onclick="handleApprovedView(${req.chapter_requisition_id})"
                        >
                            <i class="ri-eye-line"></i>
                            <span class="badge bg-success" style="
                                padding: 4px 8px;
                                border-radius: 12px;
                                font-weight: 500;
                            ">${countApprovedStatus(req.approve_status)}</span>
                        </button>
                    </td>

                    <!-- Rejected column with count -->
                    <td style="padding: 16px; text-align: center;">
                        <button 
                            class="btn btn-sm"
                            style="
                                background: #fee2e2;
                                color: #dc2626;
                                border: none;
                                padding: 6px 12px;
                                border-radius: 20px;
                                font-size: 0.875rem;
                                display: inline-flex;
                                align-items: center;
                                gap: 4px;
                                transition: all 0.3s ease;
                                box-shadow: 0 2px 4px rgba(220, 38, 38, 0.1);
                            "
                            onclick="handleRejectedView(${req.chapter_requisition_id})"
                        >
                            <i class="ri-eye-line"></i>
                            <span class="badge bg-danger" style="
                                padding: 4px 8px;
                                border-radius: 12px;
                                font-weight: 500;
                            ">${countRejectedStatus(req.approve_status)}</span>
                        </button>
                    </td>

                    <td style="font-weight: bold; color: #1e293b; padding: 16px;">
                        ${requestDate}
                    </td>
                    <td style="padding: 16px;">
    <div style="
        display: flex;
        align-items: center;
        gap: 8px;
    ">
        <i class="ri-user-line" style="color: #3b82f6;"></i>
        <span style="
            color: #1e293b;
            font-weight: 500;
            background: #f0f9ff;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 0.875rem;
        ">
            ${req.requested_by || 'Not Specified'}
        </span>
    </div>
</td>
                    <td style="font-weight: bold; color: #1e293b; padding: 16px;">
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <select 
                                class="form-select pickup-status-select"
                                onchange="handlePickupStatusChange(${req.chapter_requisition_id}, this.value)"
                                style="
                                    padding: 8px;
                                    border-radius: 6px;
                                    border: 1px solid #e5e7eb;
                                    background-color: ${
                                        req.pick_up_status_ro === PICKUP_STATUSES.READY ? '#dcfce7' :
                                        req.pick_up_status_ro === PICKUP_STATUSES.PICKED ? '#bbf7d0' :
                                        req.pick_up_status_ro === PICKUP_STATUSES.FAILED ? '#fee2e2' :
                                        '#f3f4f6'
                                    };
                                    color: ${
                                        req.pick_up_status_ro === PICKUP_STATUSES.READY ? '#16a34a' :
                                        req.pick_up_status_ro === PICKUP_STATUSES.PICKED ? '#15803d' :
                                        req.pick_up_status_ro === PICKUP_STATUSES.FAILED ? '#dc2626' :
                                        '#4b5563'
                                    };
                                    cursor: pointer;
                                    font-weight: 500;
                                "
                            >
                                
                                <option value="${PICKUP_STATUSES.READY}"
                                    ${req.pick_up_status_ro === PICKUP_STATUSES.READY ? 'selected' : ''}>
                                    Ready for Pickup
                                </option>
                                <option value="${PICKUP_STATUSES.PICKED}"
                                    ${req.pick_up_status_ro === PICKUP_STATUSES.PICKED ? 'selected' : ''}>
                                    Picked Up
                                </option>
                               
                            </select>
                            <div style="display: flex; gap: 8px; align-items: center;">
                                <button 
                                    onclick="handlePickupComment(${req.chapter_requisition_id}, '${req.pick_up_status_ro_comment || ''}')"
                                    style="
                                        background: none;
                                        border: none;
                                        padding: 4px 8px;
                                        display: flex;
                                        align-items: center;
                                        gap: 4px;
                                        color: #6b7280;
                                        font-size: 0.875rem;
                                        cursor: pointer;
                                        border-radius: 4px;
                                        transition: all 0.2s ease;
                                    "
                                    onmouseover="this.style.backgroundColor='#f3f4f6'"
                                    onmouseout="this.style.backgroundColor='transparent'"
                                >
                                    <i class="ri-chat-1-line"></i>
                                    ${req.pick_up_status_ro_comment ? 'Edit Comment' : 'Add Comment'}
                                </button>
                                ${req.pick_up_status_ro_comment ? `
                                    <button 
                                        onclick="showPickupComment('${req.pick_up_status_ro_comment.replace(/'/g, "\\'")}')"
                                        style="
                                            background: none;
                                            border: none;
                                            padding: 4px 8px;
                                            display: flex;
                                            align-items: center;
                                            gap: 4px;
                                            color: #6b7280;
                                            font-size: 0.875rem;
                                            cursor: pointer;
                                            border-radius: 4px;
                                            transition: all 0.2s ease;
                                        "
                                        onmouseover="this.style.backgroundColor='#f3f4f6'"
                                        onmouseout="this.style.backgroundColor='transparent'"
                                    >
                                        <i class="ri-eye-line"></i>
                                        View
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </td>
                    <td style="padding: 16px;">
                        <button 
                            class="pickup-status-btn"
                            data-requisition-id="${req.chapter_requisition_id}"
                            data-status="${req.pickup_status ? 'ready' : 'not-ready'}"
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
                            onclick="handlePickupConfirmation(${req.chapter_requisition_id}, ${req.pickup_status})"
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
        ${
            req.request_status.toLowerCase() !== 'open'
                ? 'Inactive'
                : (() => {
                    // Parse approve_status and given_status
                    let approved = 0, given = 0;
                    try {
                        const approveStatus = typeof req.approve_status === 'string'
                            ? JSON.parse(req.approve_status)
                            : req.approve_status || {};
                        const givenStatus = typeof req.given_status === 'string'
                            ? JSON.parse(req.given_status)
                            : req.given_status || {};
                        approved = Object.values(approveStatus).filter(v => v === 'approved').length;
                        given = Object.keys(givenStatus).length;
                    } catch (e) {}
                    if (approved === 0) return 'Not Given';
                    if (given === 0) return 'Not Given';
                    if (given === approved) return 'Completed';
                    if (given > 0 && given < approved) return 'Given to Specific';
                    return 'Not Given';
                })()
        }
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
        // Get requisition ID directly from button's data attribute
        const requisitionId = parseInt(btn.getAttribute('data-requisition-id'));
        
        // Find the requisition data
        const requisition = allRequisitions.find(req => req.chapter_requisition_id === requisitionId);
        
        // Check if already picked up
        if (requisition && requisition.pickup_status && requisition.pickup_date) {
            // Format the date to dd/mm/yy
            const pickupDate = new Date(requisition.pickup_date);
            const formattedDate = pickupDate.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
            });

            // Create container for button and date
            const container = document.createElement('div');
            container.style.flexDirection = 'column';
            container.style.gap = '4px';
            container.style.alignItems = 'center';

            // Style the button for picked up state
            btn.style.background = '#e5e7eb';
            btn.style.color = '#6b7280';
            btn.style.cursor = 'default';
            btn.style.pointerEvents = 'none';
            btn.innerHTML = '<i class="ri-checkbox-circle-line"></i> Picked Up';

            // Add date below button
            const dateSpan = document.createElement('span');
            dateSpan.style.fontSize = '0.75rem';
            dateSpan.style.color = '#6b7280';
            dateSpan.innerHTML = `<i class="ri-calendar-line"></i> ${formattedDate}`;

            // Replace button with container having both button and date
            btn.parentNode.replaceChild(container, btn);
            container.appendChild(btn);
            container.appendChild(dateSpan);
        } else {
            // For items not picked up yet
            btn.addEventListener('click', () => {
                handlePickupConfirmation(requisitionId, btn.getAttribute('data-status') === 'ready');
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
        // Find the current requisition to get its current state
        const currentRequisition = allRequisitions.find(req => req.chapter_requisition_id === requisitionId);
        if (!currentRequisition) {
            throw new Error('Requisition not found');
        }

        // Prepare the data object for API
        const requestData = {
            chapter_requisition_id: requisitionId,
            slab_wise_comment: commentText,
            // Preserve existing approval statuses and comments
            approve_status: currentRequisition.approve_status || {},
            ro_comment: currentRequisition.ro_comment || {},
            pickup_status: currentRequisition.pickup_status || false,
            pickup_date: currentRequisition.pickup_date || null
        };

        console.log('📦 Preparing comment submission:', requestData);

        // Make API call
        fetch('http://backend.bninewdelhi.com/api/updateChapterRequisition', {
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
                timerProgressBar: true,
                background: '#dcfce7',
                color: '#16a34a',
                iconColor: '#16a34a'
            });



            Toast.fire({
                icon: 'success',
                title: 'Comment saved successfully'
            });

            // Refresh the data to show updated comment
            loadData();
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
            const response = await fetch('http://backend.bninewdelhi.com/api/updateChapterRequisition', {
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

// async function handleViewAccoladeDetails(requisition) {
//     try {
//         // Fetch necessary data
//         const [accoladesResponse, membersResponse, visitorsResponse] = await Promise.all([
//             fetch('http://backend.bninewdelhi.com/api/accolades'),
//             fetch('http://backend.bninewdelhi.com/api/members'),
//             fetch('http://backend.bninewdelhi.com/api/getallvisitors')
//         ]);

//         const [allAccolades, allMembers, visitors] = await Promise.all([
//             accoladesResponse.json(),
//             membersResponse.json(),
//             visitorsResponse.json()
//         ]);

//         // Create combinations array
//         const combinations = [];
//         requisition.member_ids.forEach(memberId => {
//             let memberName;
//             let isVisitor = false;

//             if (memberId === 0) {
//                 isVisitor = true;
//                 const visitor = visitors.find(v => v.visitor_id === requisition.visitor_id);
//                 memberName = visitor ? `${visitor.visitor_name} (Visitor)` : 'Unknown Visitor';
//             } else {
//                 const member = allMembers.find(m => m.member_id === memberId);
//                 memberName = member ? `${member.member_first_name} ${member.member_last_name}` : `Member ID: ${memberId}`;
//             }
            
//             requisition.accolade_ids.forEach(accoladeId => {
//                 const accolade = allAccolades.find(acc => acc.accolade_id === accoladeId);
//                 combinations.push({ memberId, memberName, accolade, isVisitor });
//             });
//         });

//         // Group combinations by accolade
//         const accoladeGroups = combinations.reduce((groups, combo) => {
//             const key = combo.accolade.accolade_id;
//             if (!groups[key]) {
//                 groups[key] = {
//                     accolade: combo.accolade,
//                     members: []
//                 };
//             }
//             groups[key].members.push({
//                 name: combo.memberName,
//                 isVisitor: combo.isVisitor
//             });
//             return groups;
//         }, {});

//         // Create HTML for each accolade group (keeping your existing HTML structure)
//         const accoladesHtml = Object.values(accoladeGroups).map(group => `
//             <div class="accolade-card" style="
//                 background: white;
//                 border-radius: 16px;
//                 margin-bottom: 24px;
//                 box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.15);
//                 overflow: hidden;
//                 border: 1px solid rgba(0, 0, 0, 0.05);
//                 position: relative;
//             ">
//                 <!-- Your existing accolade header HTML -->
//                 <div style="
//                     background: ${group.accolade.accolade_type === 'Global' ? 
//                         'linear-gradient(135deg, #3b82f6, #1d4ed8)' : 
//                         'linear-gradient(135deg, #ef4444, #b91c1c)'};
//                     padding: 20px;
//                     color: white;
//                     position: sticky;
//                     top: 0;
//                     z-index: 10;
//                     box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
//                 ">
//                     <div style="
//                         display: flex;
//                         justify-content: space-between;
//                         align-items: center;
//                         position: relative;
//                     ">
//                         <h3 style="
//                             margin: 0;
//                             font-size: 1.35rem;
//                             font-weight: 600;
//                             display: flex;
//                             align-items: center;
//                             gap: 12px;
//                             color: white;
//                         ">
//                             <i class="ri-award-fill" style="font-size: 1.5rem;"></i>
//                             ${group.accolade.accolade_name}
//                             <span style="
//                                 font-size: 0.9rem;
//                                 opacity: 0.9;
//                                 font-weight: normal;
//                                 color: white;
//                             ">(${group.members.length} members)</span>
//                         </h3>
//                         <div style="
//                             background: rgba(255, 255, 255, 0.15);
//                             padding: 6px 16px;
//                             border-radius: 9999px;
//                             font-size: 0.875rem;
//                             color: white;
//                             backdrop-filter: blur(4px);
//                             border: 1px solid rgba(255, 255, 255, 0.2);
//                             font-weight: 500;
//                             letter-spacing: 0.5px;
//                         ">
//                             ${group.accolade.accolade_type}
//                         </div>
//                     </div>
//                 </div>

//                 <!-- Members List -->
//                 <div style="padding: 20px;">
//                     <div style="
//                         display: flex;
//                         flex-direction: column;
//                         gap: 10px;
//                     ">
//                         ${group.members.map(member => `
//                             <div style="
//                                 display: flex;
//                                 align-items: center;
//                                 gap: 10px;
//                                 padding: 12px;
//                                 background: ${member.isVisitor ? 
//                                     'linear-gradient(to right, #f0fdf4, #dcfce7)' : 
//                                     'linear-gradient(to right, #f1f5f9, #f8fafc)'};
//                                 border-radius: 10px;
//                                 transition: transform 0.2s ease;
//                                 border: 1px solid ${member.isVisitor ? '#86efac' : '#e2e8f0'};
//                             "
//                             onmouseover="this.style.transform='translateX(5px)'"
//                             onmouseout="this.style.transform='translateX(0)'"
//                             >
//                                 <div style="
//                                     background: ${member.isVisitor ? '#22c55e' : '#64748b'};
//                                     color: white;
//                                     width: 32px;
//                                     height: 32px;
//                                     border-radius: 50%;
//                                     display: flex;
//                                     align-items: center;
//                                     justify-content: center;
//                                 ">
//                                     <i class="ri-${member.isVisitor ? 'user-follow-line' : 'user-line'}"></i>
//                                 </div>
//                                 <span style="
//                                     color: ${member.isVisitor ? '#15803d' : '#1e293b'};
//                                     font-weight: 500;
//                                     flex-grow: 1;
//                                 ">${member.name}</span>
//                                 <span style="
//                                     font-size: 0.8rem;
//                                     color: ${member.isVisitor ? '#16a34a' : '#64748b'};
//                                     background: ${member.isVisitor ? '#dcfce7' : '#f1f5f9'};
//                                     padding: 4px 12px;
//                                     border-radius: 9999px;
//                                     border: 1px solid ${member.isVisitor ? '#86efac' : '#e2e8f0'};
//                                 ">
//                                     ${member.isVisitor ? 'Visitor' : 'Member'}
//                                 </span>
//                             </div>
//                         `).join('')}
//                     </div>
//                 </div>
//             </div>
//         `).join('');

//         // Show SweetAlert with a compact header
//         Swal.fire({
//             html: `
//                 <div style="
//                     margin: -20px -20px 0 -20px;
//                     padding: 15px 20px;
//                     border-bottom: 1px solid #e5e7eb;
//                     background: linear-gradient(to right, #f8fafc, #ffffff);
//                 ">
//                     <h3 style="
//                         margin: 0;
//                         color: #2563eb;
//                         font-size: 1.1rem;
//                         font-weight: 600;
//                         display: flex;
//                         align-items: center;
//                         gap: 8px;
//                     ">
//                         <i class="ri-award-fill"></i>
//                         Accolade Details
//                     </h3>
//                 </div>
//                 <div style="
//                     max-height: 85vh;
//                     overflow-y: auto;
//                     padding: 0;
//                     margin: 0 -20px -20px -20px;
//                     scrollbar-width: thin;
//                 ">
//                     ${accoladesHtml}
//                 </div>
//             `,
//             width: '650px',
//             showCloseButton: true,
//             showConfirmButton: false,
//             padding: '20px',
//             customClass: {
//                 container: 'accolade-details-modal'
//             }
//         });

//     } catch (error) {
//         console.error('Error in handleViewAccoladeDetails:', error);
//         Swal.fire({
//             icon: 'error',
//             title: 'Error',
//             text: 'Failed to load accolade details'
//         });
//     }
// }

async function handleViewAccoladeDetails(requisition) {
    try {
        // Fetch necessary data
        const [requisitionsResponse, accoladesResponse, membersResponse] = await Promise.all([
            fetch('http://backend.bninewdelhi.com/api/getRequestedChapterRequisition'),
            fetch('http://backend.bninewdelhi.com/api/accolades'),
            fetch('http://backend.bninewdelhi.com/api/members')
        ]);

        const [allRequisitions, allAccolades, allMembers] = await Promise.all([
            requisitionsResponse.json(),
            accoladesResponse.json(),
            membersResponse.json()
        ]);

        // Find the specific requisition
        const currentRequisition = allRequisitions.find(req => 
            req.chapter_requisition_id === requisition.chapter_requisition_id
        );

        if (!currentRequisition) {
            throw new Error('Requisition not found');
        }

        // Parse the comment object which contains member_id and accolade_id pairs
        const commentPairs = JSON.parse(currentRequisition.comment || '{}');
        
        // Create accolade groups from the comment pairs
        const accoladeGroups = {};
        
        // Process each pair (e.g., "143_40", "143_13", etc.)
        Object.keys(commentPairs).forEach(pair => {
            const [memberId, accoladeId] = pair.split('_').map(Number);
            
            // If this accolade hasn't been processed yet, initialize its group
            if (!accoladeGroups[accoladeId]) {
                const accolade = allAccolades.find(a => a.accolade_id === accoladeId);
                if (accolade) {
                    accoladeGroups[accoladeId] = {
                        accolade: accolade,
                        members: []
                    };
                }
            }
            
            // Find and add the member to this accolade's group
            if (accoladeGroups[accoladeId]) {
                const member = allMembers.find(m => m.member_id === memberId);
                if (member) {
                    accoladeGroups[accoladeId].members.push({
                        name: `${member.member_first_name} ${member.member_last_name}`,
                        isVisitor: false
                    });
                }
            }
        });

        // Create HTML for accolade groups in table format
        const accoladesHtml = `
            <div class="accolade-details-container" style="width: 100%;">
                <!-- Summary Cards -->
                <div style="
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 16px;
                    margin-bottom: 24px;
                    justify-content: center;
                    max-width: 1200px;
                    margin-left: auto;
                    margin-right: auto;
                ">
                    ${Object.values(accoladeGroups).map(group => `
                        <div style="
                            background: ${group.accolade.accolade_type === 'Global' 
                                ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                                : 'linear-gradient(135deg, #ef4444, #b91c1c)'};
                            padding: 20px;
                            border-radius: 12px;
                            color: white;
                            text-align: center;
                            transform: translateY(0);
                            transition: transform 0.2s ease;
                            cursor: default;
                        "
                        onmouseover="this.style.transform='translateY(-5px)'"
                        onmouseout="this.style.transform='translateY(0)'">
                            <div style="font-size: 2rem; margin-bottom: 8px;">
                                <i class="ri-award-fill"></i>
                            </div>
                            <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 4px;">
                                ${group.accolade.accolade_name}
                            </div>
                            <div style="font-size: 0.9rem; opacity: 0.9;">
                                ${group.members.length} Members
                            </div>
                            <div style="
                                background: rgba(255, 255, 255, 0.1);
                                margin-top: 8px;
                                padding: 4px 12px;
                                border-radius: 999px;
                                font-size: 0.8rem;
                                backdrop-filter: blur(4px);
                            ">
                                ${group.accolade.accolade_type}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Detailed Table -->
                <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.15);">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                                <th style="padding: 16px; text-align: left; color: #2563eb; font-weight: 600; font-size: 0.9rem;">
                                    <i class="ri-award-fill me-2"></i>Accolade
                                </th>
                                <th style="padding: 16px; text-align: left; color: #2563eb; font-weight: 600; font-size: 0.9rem;">
                                    <i class="ri-user-line me-2"></i>Member
                                </th>
                                <th style="padding: 16px; text-align: left; color: #2563eb; font-weight: 600; font-size: 0.9rem;">
                                    <i class="ri-profile-line me-2"></i>Type
                                </th>
                                <th style="padding: 16px; text-align: left; color: #2563eb; font-weight: 600; font-size: 0.9rem;">
                                    <i class="ri-flag-line me-2"></i>Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.values(accoladeGroups).map(group => 
                                group.members.map(member => `
                                    <tr style="
                                        border-bottom: 1px solid #e2e8f0;
                                        transition: background-color 0.2s ease;
                                    "
                                    onmouseover="this.style.backgroundColor='#f8fafc'"
                                    onmouseout="this.style.backgroundColor='white'">
                                        <td style="padding: 16px;">
                                            <div style="display: flex; align-items: center; gap: 12px;">
                                                <div style="
                                                    width: 40px;
                                                    height: 40px;
                                                    border-radius: 50%;
                                                    background: ${group.accolade.accolade_type === 'Global' ? '#3b82f6' : '#ef4444'};
                                                    display: flex;
                                                    align-items: center;
                                                    justify-content: center;
                                                    color: white;
                                                ">
                                                    <i class="ri-award-fill" style="font-size: 1.25rem;"></i>
                                                </div>
                                                <span style="font-weight: 500; color: #1e293b;">
                                                    ${group.accolade.accolade_name}
                                                </span>
                                            </div>
                                        </td>
                                        <td style="padding: 16px;">
                                            <div style="display: flex; align-items: center; gap: 8px;">
                                                <div style="
                                                    width: 32px;
                                                    height: 32px;
                                                    border-radius: 50%;
                                                    background: #64748b;
                                                    display: flex;
                                                    align-items: center;
                                                    justify-content: center;
                                                    color: white;
                                                ">
                                                    <i class="ri-user-line"></i>
                                                </div>
                                                <span style="color: #1e293b;">${member.name}</span>
                                            </div>
                                        </td>
                                        <td style="padding: 16px;">
                                            <span style="
                                                padding: 6px 12px;
                                                border-radius: 999px;
                                                font-size: 0.875rem;
                                                background: ${group.accolade.accolade_type === 'Global' ? '#eff6ff' : '#fef2f2'};
                                                color: ${group.accolade.accolade_type === 'Global' ? '#1d4ed8' : '#b91c1c'};
                                                border: 1px solid ${group.accolade.accolade_type === 'Global' ? '#bfdbfe' : '#fecaca'};
                                            ">
                                                ${group.accolade.accolade_type}
                                            </span>
                                        </td>
                                        <td style="padding: 16px;">
                                            <span style="
                                                padding: 6px 12px;
                                                border-radius: 999px;
                                                font-size: 0.875rem;
                                                background: #f0fdf4;
                                                color: #15803d;
                                                border: 1px solid #bbf7d0;
                                                display: inline-flex;
                                                align-items: center;
                                                gap: 4px;
                                            ">
                                                <i class="ri-user-follow-line"></i>
                                                Member
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
            title: '<div style="color: #2563eb; display: flex; align-items: center; gap: 8px;"><i class="ri-award-line"></i>Accolade Details</div>',
            html: accoladesHtml,
            width: '90%',
            showCloseButton: true,
            showConfirmButton: false,
            padding: '32px',
            customClass: {
                container: 'accolade-details-modal',
                popup: 'border-radius: 16px;'
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

async function handleApprovedView(chapterRequisitionId) {
    try {
        // Get requisition details
        const requisitionResponse = await fetch(`http://backend.bninewdelhi.com/api/getRequestedChapterRequisition`);
        const requisitions = await requisitionResponse.json();
        const requisition = requisitions.find(r => r.chapter_requisition_id === chapterRequisitionId);

        // Get members and accolades data
        const [membersResponse, accoladesResponse] = await Promise.all([
            fetch('http://backend.bninewdelhi.com/api/members'),
            fetch('http://backend.bninewdelhi.com/api/accolades')
        ]);
        const members = await membersResponse.json();
        const accolades = await accoladesResponse.json();

        // Parse the approve_status JSON
        const approveStatus = JSON.parse(requisition.approve_status || '{}');
        const roComments = JSON.parse(requisition.ro_comment || '{}');

        // Build the HTML content with improved styling
        let htmlContent = `
            <div style="margin: -32px -32px 0; padding: 24px 32px; background: linear-gradient(135deg, #dcfce7, #f0fdf4); border-bottom: 1px solid #86efac; border-radius: 8px 8px 0 0;">
                <h3 style="margin: 0; color: #15803d; font-size: 1.25rem; font-weight: 600; display: flex; align-items: center; gap: 12px;">
                    <i class="ri-checkbox-circle-fill" style="font-size: 1.5rem;"></i>
                    Approved Accolades Details
                </h3>
            </div>
            <div style="width: 100%; overflow-x: auto; padding: 20px;">
                <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden;">
                    <thead>
                        <tr style="background: #f0fdf4; border-bottom: 2px solid #86efac;">
                            <th style="padding: 16px; text-align: left; color: #15803d; font-weight: 600;">Member</th>
                            <th style="padding: 16px; text-align: left; color: #15803d; font-weight: 600;">Accolade</th>
                            <th style="padding: 16px; text-align: left; color: #15803d; font-weight: 600;">Status</th>
                            <th style="padding: 16px; text-align: left; color: #15803d; font-weight: 600;">RO Comment</th>
                        </tr>
                    </thead>
                    <tbody>`;

        // Process each approved pair
        for (const [key, status] of Object.entries(approveStatus)) {
            if (status === 'approved') {
                const [memberId, accoladeId] = key.split('_').map(Number);
                const member = members.find(m => m.member_id === memberId);
                const accolade = accolades.find(a => a.accolade_id === accoladeId);
                
                const memberName = member ? `${member.member_first_name} ${member.member_last_name}` : 'Unknown Member';
                const accoladeName = accolade ? accolade.accolade_name : 'Unknown Accolade';
                const roComment = roComments[key] || '-';

                htmlContent += `
                    <tr style="border-bottom: 1px solid #d1fae5;">
                        <td style="padding: 16px;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 40px; height: 40px; border-radius: 50%; background: #86efac; display: flex; align-items: center; justify-content: center;">
                                    <i class="ri-user-line" style="color: #15803d; font-size: 1.25rem;"></i>
                                </div>
                                <span style="font-weight: 500; color: #15803d;">${memberName}</span>
                            </div>
                        </td>
                        <td style="padding: 16px;">
                            <div style="display: flex; align-items: center; gap: 8px; color: #059669;">
                                <i class="ri-award-fill"></i>
                                <span style="font-weight: 500;">${accoladeName}</span>
                            </div>
                        </td>
                        <td style="padding: 16px;">
                            <span style="background: #dcfce7; color: #15803d; padding: 6px 12px; border-radius: 9999px; font-size: 0.875rem;">
                                <i class="ri-checkbox-circle-line me-1"></i>Approved
                            </span>
                        </td>
                        <td style="padding: 16px;">
                            <div style="background: #f0fdf4; padding: 12px; border-radius: 8px; color: #374151;">
                                <i class="ri-message-2-line me-2" style="color: #16a34a;"></i>${roComment}
                            </div>
                        </td>
                    </tr>`;
            }
        }

        htmlContent += `
                </tbody>
            </table>
        </div>`;

        // Update both Swal.fire calls to use 90% width
        Swal.fire({
            html: htmlContent,
            width: '90%',
            showCloseButton: true,
            showConfirmButton: false,
            padding: '32px',
            customClass: {
                container: 'approved-popup',
                popup: 'border-radius: 16px;'
            }
        });

    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Something went wrong!'
        });
    }
}

async function handleRejectedView(chapterRequisitionId) {
    try {
        // Get requisition details
        const requisitionResponse = await fetch(`http://backend.bninewdelhi.com/api/getRequestedChapterRequisition`);
        const requisitions = await requisitionResponse.json();
        const requisition = requisitions.find(r => r.chapter_requisition_id === chapterRequisitionId);

        // Get members and accolades data
        const [membersResponse, accoladesResponse] = await Promise.all([
            fetch('http://backend.bninewdelhi.com/api/members'),
            fetch('http://backend.bninewdelhi.com/api/accolades')
        ]);
        const members = await membersResponse.json();
        const accolades = await accoladesResponse.json();

        // Parse the approve_status JSON
        const approveStatus = JSON.parse(requisition.approve_status || '{}');
        const roComments = JSON.parse(requisition.ro_comment || '{}');

        // Build the HTML content with improved styling
        let htmlContent = `
            <div style="margin: -32px -32px 0; padding: 24px 32px; background: linear-gradient(135deg, #fee2e2, #fef2f2); border-bottom: 1px solid #fca5a5; border-radius: 8px 8px 0 0;">
                <h3 style="margin: 0; color: #991b1b; font-size: 1.25rem; font-weight: 600; display: flex; align-items: center; gap: 12px;">
                    <i class="ri-close-circle-fill" style="font-size: 1.5rem;"></i>
                    Rejected Accolades Details
                </h3>
            </div>
            <div style="width: 100%; overflow-x: auto; padding: 20px;">
                <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden;">
                    <thead>
                        <tr style="background: #fef2f2; border-bottom: 2px solid #fca5a5;">
                            <th style="padding: 16px; text-align: left; color: #991b1b; font-weight: 600;">Member</th>
                            <th style="padding: 16px; text-align: left; color: #991b1b; font-weight: 600;">Accolade</th>
                            <th style="padding: 16px; text-align: left; color: #991b1b; font-weight: 600;">Status</th>
                            <th style="padding: 16px; text-align: left; color: #991b1b; font-weight: 600;">RO Comment</th>
                        </tr>
                    </thead>
                    <tbody>`;

        // Process each rejected pair
        for (const [key, status] of Object.entries(approveStatus)) {
            if (status === 'declined') {
                const [memberId, accoladeId] = key.split('_').map(Number);
                const member = members.find(m => m.member_id === memberId);
                const accolade = accolades.find(a => a.accolade_id === accoladeId);
                
                const memberName = member ? `${member.member_first_name} ${member.member_last_name}` : 'Unknown Member';
                const accoladeName = accolade ? accolade.accolade_name : 'Unknown Accolade';
                const roComment = roComments[key] || '-';

                htmlContent += `
                    <tr style="border-bottom: 1px solid #fee2e2;">
                        <td style="padding: 16px;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="width: 40px; height: 40px; border-radius: 50%; background: #fca5a5; display: flex; align-items: center; justify-content: center;">
                                    <i class="ri-user-line" style="color: #991b1b; font-size: 1.25rem;"></i>
                                </div>
                                <span style="font-weight: 500; color: #991b1b;">${memberName}</span>
                            </div>
                        </td>
                        <td style="padding: 16px;">
                            <div style="display: flex; align-items: center; gap: 8px; color: #dc2626;">
                                <i class="ri-award-fill"></i>
                                <span style="font-weight: 500;">${accoladeName}</span>
                            </div>
                        </td>
                        <td style="padding: 16px;">
                            <span style="background: #fee2e2; color: #991b1b; padding: 6px 12px; border-radius: 9999px; font-size: 0.875rem;">
                                <i class="ri-close-circle-line me-1"></i>Rejected
                            </span>
                        </td>
                        <td style="padding: 16px;">
                            <div style="background: #fef2f2; padding: 12px; border-radius: 8px; color: #374151;">
                                <i class="ri-message-2-line me-2" style="color: #dc2626;"></i>${roComment}
                            </div>
                        </td>
                    </tr>`;
            }
        }

        htmlContent += `
                </tbody>
            </table>
        </div>`;

        // Update both Swal.fire calls to use 90% width
        Swal.fire({
            html: htmlContent,
            width: '90%',
            showCloseButton: true,
            showConfirmButton: false,
            padding: '32px',
            customClass: {
                container: 'rejected-popup',
                popup: 'border-radius: 16px;'
            }
        });

    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Oops...',
            text: 'Something went wrong!'
        });
    }
}

// Add these helper functions to count approved and rejected statuses
function countApprovedStatus(approveStatus) {
    try {
        if (!approveStatus) return 0;
        const statusObj = typeof approveStatus === 'string' ? JSON.parse(approveStatus) : approveStatus;
        return Object.values(statusObj).filter(status => status === 'approved').length;
    } catch (error) {
        console.error('Error counting approved status:', error);
        return 0;
    }
}

function countRejectedStatus(approveStatus) {
    try {
        if (!approveStatus) return 0;
        const statusObj = typeof approveStatus === 'string' ? JSON.parse(approveStatus) : approveStatus;
        return Object.values(statusObj).filter(status => status === 'declined').length;
    } catch (error) {
        console.error('Error counting rejected status:', error);
        return 0;
    }
}

// Add this function to handle pickup status change
async function handlePickupStatusChange(requisitionId, newStatus) {
    try {
        const updateData = {
            chapter_requisition_id: requisitionId,
            pick_up_status_ro: newStatus  // Changed from ro_pickup_status
        };

        const response = await fetch('http://backend.bninewdelhi.com/api/updateChapterRequisition', {
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
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
            background: '#dcfce7',
            color: '#16a34a'
        });

        Toast.fire({
            icon: 'success',
            title: 'Pickup status updated successfully'
        });

        // Refresh the data
        loadData();
    } catch (error) {
        console.error('Error updating pickup status:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to update pickup status'
        });
    }
}

// Add new function to handle pickup comment
async function handlePickupComment(requisitionId, currentComment) {
    try {
        const { value: comment } = await Swal.fire({
            title: 'Pickup Comment',
            html: `
                <textarea 
                    id="pickup-comment" 
                    class="swal2-textarea" 
                    placeholder="Enter pickup comment..."
                    style="height: 100px; width: 100%; padding: 8px;"
                >${currentComment || ''}</textarea>
            `,
            showCancelButton: true,
            confirmButtonText: 'Save',
            cancelButtonText: 'Cancel',
            preConfirm: () => {
                return document.getElementById('pickup-comment').value;
            }
        });

        if (comment !== undefined) {  // Only proceed if not cancelled
            const updateData = {
                chapter_requisition_id: requisitionId,
                pick_up_status_ro_comment: comment  // Changed from ro_pickup_comment
            };

            const response = await fetch('http://backend.bninewdelhi.com/api/updateChapterRequisition', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                throw new Error('Failed to update pickup comment');
            }

            // Show success message specifically for comment update
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
                background: '#dcfce7',
                color: '#16a34a'
            });

            Toast.fire({
                icon: 'success',
                title: 'Comment updated successfully'
            }).then(() => {
                // Only refresh the specific row or element that needs updating
                const row = document.querySelector(`[data-requisition-id="${requisitionId}"]`).closest('tr');
                if (row) {
                    const commentButton = row.querySelector('button:has(.ri-chat-1-line)');
                    if (commentButton) {
                        commentButton.innerHTML = `<i class="ri-chat-1-line"></i> Edit Comment`;
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error updating pickup comment:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to update comment'
        });
    }
}

// Add this function to show pickup comment
function showPickupComment(comment) {
    if (!comment) return;
    
    Swal.fire({
        title: 'Pickup Comment',
        text: comment,
        confirmButtonText: 'Close'
    });
}