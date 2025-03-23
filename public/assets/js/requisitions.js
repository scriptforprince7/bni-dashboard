document.addEventListener('DOMContentLoaded', function() {
    const tableBody = document.getElementById('chaptersTableBody');
    
    // Static data for demonstration
    const requisitions = [
        {
            sno: 1,
            date: '15 March 2024',
            totalAccolades: 10,
            approved: 5,
            declined: 5,
            pickupStatus: {
                status: 'Picked Up',
                date: '18 March 2024'
            },
            givenStatus: {
                status: 'Given',
                date: '20 March 2024'
            }
        },
        {
            sno: 2,
            date: '22 March 2024',
            totalAccolades: 7,
            approved: 4,
            declined: 3,
            pickupStatus: {
                status: 'Yet to be Picked',
                date: null
            },
            givenStatus: {
                status: 'Pending',
                date: null
            }
        }
    ];

    // Render the table with static data
    const tableContent = requisitions.map(req => `
        <tr class="align-middle">
            <td class="fw-bold">${req.sno}</td>
            
            <td>
                <span class="text-dark fw-semibold">${req.date}</span>
            </td>
            
            <td>
                <span class="badge bg-primary-transparent" 
                      style="font-size: 0.9em; cursor: pointer;"
                      onclick="showAccoladeDetails(${req.totalAccolades})">
                    ${req.totalAccolades} Accolades
                </span>
            </td>
            
            <td>
                <span class="badge bg-success-transparent" 
                      style="font-size: 0.9em; cursor: pointer;"
                      onclick="showApprovedMembers(${req.approved})">
                    <i class="ri-checkbox-circle-line me-1"></i>
                    ${req.approved}
                </span>
            </td>
            
            <td>
                <span class="badge bg-danger-transparent" 
                      style="font-size: 0.9em; cursor: pointer;"
                      onclick="showDeclinedMembers(${req.declined})">
                    <i class="ri-close-circle-line me-1"></i>
                    ${req.declined}
                </span>
            </td>
            
            <td>
                ${req.pickupStatus.status === 'Picked Up' 
                    ? `<div class="d-flex flex-column" style="min-width: 80px;">
                        <span class="badge bg-success-transparent mb-1" style="width: fit-content;">
                            <i class="ri-checkbox-circle-line me-1"></i>
                            ${req.pickupStatus.status}
                        </span>
                        <small class="text-muted">
                            <i class="ri-calendar-line me-1"></i>
                            ${req.pickupStatus.date}
                        </small>
                       </div>`
                    : `<span class="badge bg-warning-transparent" style="width: fit-content;">
                        <i class="ri-time-line me-1"></i>
                        ${req.pickupStatus.status}
                       </span>`
                }
            </td>
            
            <td>
                ${req.givenStatus.status === 'Given' 
                    ? `<div class="d-flex flex-column" style="min-width: 120px;">
                        <span class="badge bg-success-transparent mb-1" style="width: fit-content;">
                            <i class="ri-checkbox-circle-line me-1"></i>
                            ${req.givenStatus.status}
                        </span>
                        <small class="text-muted">
                            <i class="ri-calendar-line me-1"></i>
                            ${req.givenStatus.date}
                        </small>
                       </div>`
                    : `<span class="badge bg-warning-transparent" style="width: fit-content;">
                        <i class="ri-time-line me-1"></i>
                        ${req.givenStatus.status}
                       </span>`
                }
            </td>
        </tr>
    `).join('');

    tableBody.innerHTML = tableContent;
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

// Add this function to handle accolade click
async function showAccoladeDetails(totalAccolades) {
    try {
        const response = await fetch('https://backend.bninewdelhi.com/api/accolades');
        const accolades = await response.json();
        
        // Get random accolades based on total count
        const randomAccolades = accolades
            .sort(() => 0.5 - Math.random())
            .slice(0, totalAccolades);

        // Random member selection
        const members = [
            'Prince Sachdeva',
            'Raja Shukla',
            'Aditya Sachdeva',
            'Vikram Mehta',
            'Rahul Sharma'
        ];
        
        const accoladesHtml = randomAccolades.map(accolade => {
            const randomMember = members[Math.floor(Math.random() * members.length)];
            return `
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
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <i class="ri-user-fill" style="color: #6b7280;"></i>
                            <span style="color: #6b7280; font-size: 0.9em;">${randomMember}</span>
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
            `;
        }).join('');

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
        console.error('Error fetching accolades:', error);
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
        'Prince Sachdeva',
        'Raja Shukla',
        'Aditya Sachdeva'
    ];
    
    // Additional members to fill the count
    const additionalMembers = [
        'Vikram Mehta',
        'Rahul Sharma',
        'Amit Kumar',
        'Priya Patel',
        'Rajesh Verma',
        'Neha Singh'
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
            align-items: center;
            padding: 12px;
            margin-bottom: 10px;
            border-radius: 8px;
            background: rgba(34, 197, 94, 0.1);
            border-left: 4px solid #22c55e;
        ">
            <div style="
                width: 35px;
                height: 35px;
                background: #22c55e;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 12px;
            ">
                <i class="ri-user-smile-line" style="color: white; font-size: 1.2em;"></i>
            </div>
            <div style="flex: 1;">
                <div style="font-weight: 500; color: #065f46;">${member}</div>
                <div style="font-size: 0.85em; color: #059669;">
                    <i class="ri-checkbox-circle-line"></i> Approved
                </div>
            </div>
        </div>
    `).join('');

    Swal.fire({
        title: '<span style="color: #22c55e;"><i class="ri-checkbox-circle-line"></i> Approved Accolades</span>',
        html: `
            <div style="max-height: 400px; overflow-y: auto; padding: 10px;">
                ${membersHtml}
            </div>
        `,
        width: 500,
        showCloseButton: true,
        showConfirmButton: false,
        customClass: {
            container: 'members-modal',
            popup: 'members-popup'
        }
    });
}

function showDeclinedMembers(declinedCount) {
    // Core members that should always be included (but we'll mark them as declined)
    const coreMembers = [
        'Prince Sachdeva',
        'Raja Shukla',
        'Aditya Sachdeva'
    ];
    
    // Additional members
    const additionalMembers = [
        'Vikram Mehta',
        'Rahul Sharma',
        'Amit Kumar',
        'Priya Patel',
        'Rajesh Verma',
        'Neha Singh'
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
            align-items: center;
            padding: 12px;
            margin-bottom: 10px;
            border-radius: 8px;
            background: rgba(239, 68, 68, 0.1);
            border-left: 4px solid #ef4444;
        ">
            <div style="
                width: 35px;
                height: 35px;
                background: #ef4444;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 12px;
            ">
                <i class="ri-user-unfollow-line" style="color: white; font-size: 1.2em;"></i>
            </div>
            <div style="flex: 1;">
                <div style="font-weight: 500; color: #991b1b;">${member}</div>
                <div style="font-size: 0.85em; color: #dc2626;">
                    <i class="ri-close-circle-line"></i> Declined
                </div>
            </div>
        </div>
    `).join('');

    Swal.fire({
        title: '<span style="color: #dc2626;"><i class="ri-close-circle-line"></i> Declined Accolades</span>',
        html: `
            <div style="max-height: 400px; overflow-y: auto; padding: 10px;"></div>
                ${membersHtml}
            </div>
        `,
        width: 500,
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

                    <!-- Accolade Selection -->
                    <div class="form-group mb-4">
                        <label style="
                            display: block;
                            margin-bottom: 10px;
                            color: #475569;
                            font-size: 0.95em;
                            font-weight: 500;
                        ">
                            <i class="ri-award-line me-1"></i> Select Accolade
                        </label>
                        <select id="accoladeSelect" class="form-select" style="
                            width: 100%;
                            padding: 10px 14px;
                            border: 1px solid #cbd5e1;
                            border-radius: 6px;
                            background-color: white;
                            font-size: 1em;
                        ">
                            <option value="">Choose an accolade...</option>
                            ${accolades.map(a => `
                                <option value="${a.accolade_id}">${a.accolade_name}</option>
                            `).join('')}
                        </select>
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
            preConfirm: () => {
                // Check if there are any assignments
                if (assignments.length === 0) {
                    Swal.showValidationMessage('Please add at least one assignment before submitting');
                    return false;
                }
                return true;
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
                    // window.location.reload();
                });
            }
        });

        // Function to add new assignment
        window.addAssignment = function() {
            const accoladeSelect = document.getElementById('accoladeSelect');
            const commentInput = document.getElementById('commentInput');
            const selectedCheckboxes = document.querySelectorAll('.member-checkbox-container input[type="checkbox"]:checked');

            const accolade = accolades.find(a => a.accolade_id === parseInt(accoladeSelect.value));
            const selectedMembers = Array.from(selectedCheckboxes).map(checkbox => 
                members.find(m => m.member_id === parseInt(checkbox.value))
            );

            if (!accolade || selectedMembers.length === 0 || !commentInput.value.trim()) {
                Swal.showValidationMessage('Please select an accolade, at least one member, and add a comment');
                return;
            }

            // Add an assignment for each selected member
            selectedMembers.forEach(member => {
                assignments.push({
                    sno: currentSno++,
                    accolade,
                    member,
                    comment: commentInput.value.trim()
                });
            });

            renderAssignments();
            
            // Reset form (keep accolade selected)
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
