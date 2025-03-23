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
            <td class="fw-bold text-center">${req.sno}</td>
            
            <td class="text-center">
                <span class="text-dark fw-semibold">${req.date}</span>
            </td>
            
            <td class="text-center">
                <span class="badge bg-primary-transparent" 
                      style="font-size: 0.9em; cursor: pointer;"
                      onclick="showAccoladeDetails(${req.totalAccolades})">
                    ${req.totalAccolades} Accolades
                </span>
            </td>
            
            <td class="text-center">
                <span class="badge bg-success-transparent" 
                      style="font-size: 0.9em; cursor: pointer;"
                      onclick="showApprovedMembers(${req.approved})">
                    <i class="ri-checkbox-circle-line me-1"></i>
                    ${req.approved}
                </span>
            </td>
            
            <td class="text-center">
                <span class="badge bg-danger-transparent" 
                      style="font-size: 0.9em; cursor: pointer;"
                      onclick="showDeclinedMembers(${req.declined})">
                    <i class="ri-close-circle-line me-1"></i>
                    ${req.declined}
                </span>
            </td>
            
            <td class="text-center">
                ${req.pickupStatus.status === 'Picked Up' 
                    ? `<div class="d-flex flex-column align-items-center">
                        <span class="badge bg-success-transparent mb-1">
                            <i class="ri-checkbox-circle-line me-1"></i>
                            ${req.pickupStatus.status}
                        </span>
                        <small class="text-muted">
                            <i class="ri-calendar-line me-1"></i>
                            ${req.pickupStatus.date}
                        </small>
                       </div>`
                    : `<span class="badge bg-warning-transparent">
                        <i class="ri-time-line me-1"></i>
                        ${req.pickupStatus.status}
                       </span>`
                }
            </td>
            
            <td class="text-center">
                ${req.givenStatus.status === 'Given' 
                    ? `<div class="d-flex flex-column align-items-center">
                        <span class="badge bg-success-transparent mb-1">
                            <i class="ri-checkbox-circle-line me-1"></i>
                            ${req.givenStatus.status}
                        </span>
                        <small class="text-muted">
                            <i class="ri-calendar-line me-1"></i>
                            ${req.givenStatus.date}
                        </small>
                       </div>`
                    : `<span class="badge bg-warning-transparent">
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
