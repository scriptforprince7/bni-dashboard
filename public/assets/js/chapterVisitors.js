// Declare these variables in global scope
let regions = [];
let chapters = [];

// Declare the function in global scope
function showInductionConfirmation(visitor) {
    const region = regions.find(r => r.region_id === visitor.region_id);
    const chapter = chapters.find(c => c.chapter_id === visitor.chapter_id);
    
    Swal.fire({
        title: '<span style="color: #2563eb">Visitor Induction Confirmation</span>',
        html: `
            <div class="induction-details" style="text-align: left; padding: 20px;">
                <div class="detail-row" style="margin-bottom: 15px;">
                    <i class="ri-user-fill" style="color: #2563eb"></i>
                    <strong>Name:</strong> ${visitor.visitor_name}
                </div>
                
                <div class="detail-row" style="margin-bottom: 15px;">
                    <i class="ri-building-fill" style="color: #2563eb"></i>
                    <strong>Company:</strong> ${visitor.visitor_company_name}
                </div>

                <div class="detail-row" style="margin-bottom: 15px;">
                    <i class="ri-file-list-fill" style="color: #2563eb"></i>
                    <strong>GST No:</strong> ${visitor.visitor_gst || 'N/A'}
                </div>
                
                <div class="detail-row" style="margin-bottom: 15px;">
                    <i class="ri-map-pin-fill" style="color: #2563eb"></i>
                    <strong>Region:</strong> ${region?.region_name}
                </div>
                
                <div class="detail-row" style="margin-bottom: 15px;">
                    <i class="ri-community-fill" style="color: #2563eb"></i>
                    <strong>Chapter:</strong> ${chapter?.chapter_name}
                </div>
                
                <div class="detail-row" style="margin-bottom: 15px;">
                    <i class="ri-phone-fill" style="color: #2563eb"></i>
                    <strong>Phone:</strong> +91-${visitor.visitor_phone}
                </div>
                
                <div class="detail-row" style="margin-bottom: 15px;">
                    <i class="ri-calendar-fill" style="color: #2563eb"></i>
                    <strong>Visit Date:</strong> ${formatDate(visitor.visited_date)}
                </div>

                <div class="detail-row" style="margin-bottom: 15px;">
                    <i class="ri-user-received-fill" style="color: #2563eb"></i>
                    <strong>Invited By:</strong> ${visitor.invited_by_name || 'N/A'}
                </div>
                
                <div class="forms-status" style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                    <div style="color: #059669; margin-bottom: 8px;">
                        <i class="ri-checkbox-circle-fill"></i> Visitor Form Completed
                    </div>
                    <div style="color: #059669; margin-bottom: 8px;">
                        <i class="ri-checkbox-circle-fill"></i> EOI Form Completed
                    </div>
                    <div style="color: #059669; margin-bottom: 8px;">
                        <i class="ri-checkbox-circle-fill"></i> Member Application Form Completed
                    </div>
                    <div style="color: #059669; margin-bottom: 8px;">
                        <i class="ri-checkbox-circle-fill"></i> New Member Form Completed
                    </div>
                    <div style="color: #059669; margin-bottom: 8px;">
                        <i class="ri-checkbox-circle-fill"></i> Interview Sheet Completed
                    </div>
                    <div style="color: #059669; margin-bottom: 8px;">
                        <i class="ri-checkbox-circle-fill"></i> Commitment Sheet Completed
                    </div>
                    <div style="color: #059669; margin-bottom: 8px;">
                        <i class="ri-checkbox-circle-fill"></i> Inclusion and Exclusion Sheet Completed
                    </div>
                </div>
            </div>
        `,
        icon: 'info',
        iconColor: '#2563eb',
        showCancelButton: true,
        confirmButtonText: 'Yes, Induct Member',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#dc2626',
        customClass: {
            container: 'induction-modal',
            popup: 'induction-popup',
            content: 'induction-content'
        }
    }).then((result) => {
        if (result.isConfirmed) {
            // Log visitor data in a simplified format
            console.log('📋 Inducting Visitor:', {
                name: visitor.visitor_name,
                company: visitor.visitor_company_name,
                gst_no: visitor.visitor_gst,
                phone: visitor.visitor_phone,
                visit_date: formatDate(visitor.visited_date),
                invited_by: visitor.invited_by_name,
                region: region?.region_name,
                chapter: chapter?.chapter_name,
                region_id: visitor.region_id,
                chapter_id: visitor.chapter_id,
                visitor_form: visitor.visitor_form,
                eoi_form: visitor.eoi_form,
                new_member_form: visitor.new_member_form,
                visitor_id: visitor.visitor_id
            });

            Swal.fire({
                title: 'Success!',
                text: 'Visitor has been inducted successfully.',
                icon: 'success',
                confirmButtonColor: '#2563eb'
            });
        }
    });
}

// Also move formatDate to global scope
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
}

// Function to check payment status from membership pending data
async function checkMembershipPayment(visitorId) {
    try {
        const response = await fetch('https://backend.bninewdelhi.com/api/getMembershipPending');
        const membershipData = await response.json();
        
        // Find the membership record for this visitor
        const membershipRecord = membershipData.find(record => record.visitor_id === visitorId);
        
        // Return true if there's a record and due_balance is less than 1
        return membershipRecord && parseFloat(membershipRecord.due_balance) < 1;
    } catch (error) {
        console.error('Error checking membership payment:', error);
        return false;
    }
}

// Add this function at the top level
async function fetchMemberApplicationDetails(visitorId) {
    try {
        console.log("🔍 Fetching member application details for visitor ID:", visitorId);
        const response = await fetch('https://backend.bninewdelhi.com/api/memberApplicationFormNewMember');
        const applications = await response.json();
        return applications.find(app => app.visitor_id === visitorId) || null;
    } catch (error) {
        console.error("❌ Error fetching member application:", error);
        return null;
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    const tableBody = document.getElementById('chaptersTableBody');
    const loader = document.getElementById('loader');
    const regionFilter = document.getElementById('region-filter');
    const chapterFilter = document.getElementById('chapter-filter');
    const monthFilter = document.getElementById('month-filter');

    // Show loader
    const showLoader = () => loader.style.display = 'flex';
    const hideLoader = () => loader.style.display = 'none';

    // Add filter buttons container after the dropdowns
    const filterButtonsContainer = document.createElement('div');
    filterButtonsContainer.className = 'ms-2';
    filterButtonsContainer.innerHTML = `
        <button id="applyFilter" class="btn btn-sm btn-primary" style="display: none;">
            Apply Filter
        </button>
        <button id="resetFilter" class="btn btn-sm btn-danger" style="display: none;">
            Reset Filter
        </button>
    `;
    document.querySelector('.d-flex.gap-3').appendChild(filterButtonsContainer);

    const applyFilterBtn = document.getElementById('applyFilter');
    const resetFilterBtn = document.getElementById('resetFilter');

    // Add CSS for table styling
    const style = document.createElement('style');
    style.textContent = `
        .table td, .table th {
            border-right: 1px solid #dee2e6 !important;
            vertical-align: middle !important;
        }
        
        .table td:last-child, .table th:last-child {
            border-right: none !important;
        }

        .table thead th {
            border-bottom: 2px solid #dee2e6 !important;
        }

        .table tbody tr {
            border-bottom: 1px solid #dee2e6 !important;
        }

        .btn-success {
            padding: 4px 8px;
            font-size: 12px;
            line-height: 1.5;
            border-radius: 4px;
            white-space: nowrap;
        }
        
        .btn-success i {
            margin-left: 4px;
        }
        
        .table td {
            vertical-align: middle;
        }
    `;
    document.head.appendChild(style);

    try {
        showLoader();

        // Fetch all required data
        const [visitorsResponse, regionsResponse, chaptersResponse] = await Promise.all([
            fetch('https://backend.bninewdelhi.com/api/getallVisitors'),
            fetch('https://backend.bninewdelhi.com/api/regions'),
            fetch('https://backend.bninewdelhi.com/api/chapters')
        ]);

        const visitors = await visitorsResponse.json();
        regions = await regionsResponse.json();
        chapters = await chaptersResponse.json();

        console.log('Fetched Data:', {
            visitors: visitors,
            regions: regions,
            chapters: chapters
        });

        // Function to format date
        const formatDate = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
        };

        // Function to create status icon with view link
        const getStatusIcon = async (status, type = null, visitor = null) => {
            // For new member form, check payment status
            if (type === 'payment') {
                const isPaid = await checkMembershipPayment(visitor.visitor_id);
                status = status && isPaid; // Only show green check if both form is completed AND payment is made
            }

            const icon = status ? 
                '<i class="ri-checkbox-circle-fill text-success" style="font-size: 1.5em;"></i>' : 
                '<i class="ri-close-circle-fill text-danger" style="font-size: 1.5em;"></i>';
            
            // Only add View link for specified types when status is true
            if (status && type && visitor) {
                let pageUrl;
                switch(type) {
                    case 'interview':
                        pageUrl = '/t/interview';
                        break;
                    case 'commitment':
                        pageUrl = '/t/commitment';
                        break;
                    case 'inclusion':
                        pageUrl = '/t/inclusion';
                        break;
                    case 'eoi':
                        pageUrl = '/t/eoi-form';
                        break;
                    case 'visitor':
                        pageUrl = '/t/visitorForm';
                        break;
                    case 'member_application':  // Add new case for member application
                        pageUrl = '/t/memberApplication';
                        break;
                    case 'payment':
                        // Only show view link if payment is completed
                        const isPaid = await checkMembershipPayment(visitor.visitor_id);
                        if (!isPaid) return icon;
                        pageUrl = '/t/newmemberReceipt';
                        break;
                }
                return `
                    ${icon}<br>
                    <a href="${pageUrl}?visitor_id=${visitor.visitor_id}" 
                       target="_blank" 
                       class="view-sheet-link fw-medium text-success text-decoration-underline">
                       View
                    </a>
                `;
            }
            return icon;
        };

        // Add function to check induction status
        const getInductionStatus = (visitor) => {
            // Return true only if all seven forms are completed
            return visitor.visitor_form && 
                   visitor.eoi_form && 
                   visitor.member_application_form &&  // Add member_application check
                   visitor.new_member_form && 
                   visitor.interview_sheet && 
                   visitor.commitment_sheet && 
                   visitor.inclusion_exclusion_sheet;
        };

        // Function to create induction status button/icon
        function createInductionStatus(visitor) {
            const isReady = getInductionStatus(visitor);
            
            if (isReady) {
                return `
                    <button class="btn btn-success btn-sm induct-btn" onclick="showInductionConfirmation(${JSON.stringify(visitor).replace(/"/g, '&quot;')})">
                        Induct Member <i class="ti ti-check" style="font-size: 12px;"></i>
                    </button>
                `;
            } else {
                return '<i class="ri-close-circle-fill text-danger" style="font-size: 1.5em;"></i>';
            }
        }

        // Add custom styles for the modal
        const style = document.createElement('style');
        style.textContent = `
            .induction-popup {
                border-radius: 15px;
            }
            
            .induction-content {
                padding: 20px;
            }
            
            .detail-row {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .detail-row i {
                font-size: 1.2em;
            }
            
            .forms-status {
                background-color: #f8fafc;
                padding: 15px;
                border-radius: 8px;
            }
            
            .forms-status div {
                display: flex;
                align-items: center;
                gap: 8px;
            }
        `;
        document.head.appendChild(style);

        // Populate filter dropdowns
        // Regions dropdown
        const uniqueRegions = [...new Set(regions.map(r => r.region_name))].sort();
        regionFilter.innerHTML = uniqueRegions.map(region => 
            `<li><a class="dropdown-item" href="javascript:void(0);">${region}</a></li>`
        ).join('');

        // Chapters dropdown
        const uniqueChapters = [...new Set(chapters.map(c => c.chapter_name))].sort();
        chapterFilter.innerHTML = uniqueChapters.map(chapter => 
            `<li><a class="dropdown-item" href="javascript:void(0);">${chapter}</a></li>`
        ).join('');

        // Months dropdown (from visitor dates)
        const months = [...new Set(visitors.map(v => {
            const date = new Date(v.visited_date);
            return date.toLocaleString('default', { month: 'long', year: 'numeric' });
        }))].sort();
        monthFilter.innerHTML = months.map(month => 
            `<li><a class="dropdown-item" href="javascript:void(0);">${month}</a></li>`
        ).join('');

        // Track selected filters
        let selectedFilters = {
            region: '',
            chapter: '',
            month: ''
        };

        // Add click handlers for filter items
        const dropdowns = {
            region: regionFilter,
            chapter: chapterFilter,
            month: monthFilter
        };

        Object.entries(dropdowns).forEach(([key, dropdown]) => {
            dropdown.addEventListener('click', (e) => {
                if (e.target.classList.contains('dropdown-item')) {
                    selectedFilters[key] = e.target.textContent;
                    e.target.closest('.dropdown').querySelector('.dropdown-toggle').textContent = e.target.textContent;
                    applyFilterBtn.style.display = 'inline-block';
                    resetFilterBtn.style.display = 'inline-block';
                }
            });
        });

        // Apply filter function
        applyFilterBtn.addEventListener('click', () => {
            const filteredVisitors = visitors.filter(visitor => {
                const region = regions.find(r => r.region_id === visitor.region_id);
                const chapter = chapters.find(c => c.chapter_id === visitor.chapter_id);
                const visitorMonth = new Date(visitor.visited_date)
                    .toLocaleString('default', { month: 'long', year: 'numeric' });

                return (!selectedFilters.region || region?.region_name === selectedFilters.region) &&
                       (!selectedFilters.chapter || chapter?.chapter_name === selectedFilters.chapter) &&
                       (!selectedFilters.month || visitorMonth === selectedFilters.month);
            });

            renderVisitors(filteredVisitors);
        });

        // Reset filter function
        resetFilterBtn.addEventListener('click', () => {
            // Reset selected filters object
            selectedFilters = { region: '', chapter: '', month: '' };
            
            // Reset all dropdown toggles to their default text
            Object.entries(dropdowns).forEach(([key, dropdown]) => {
                const toggleButton = dropdown.closest('.dropdown').querySelector('.dropdown-toggle');
                // Reset text and add back the icons
                switch(key) {
                    case 'region':
                        toggleButton.innerHTML = '<i class="ti ti-map-pin me-1"></i> Region';
                        break;
                    case 'chapter':
                        toggleButton.innerHTML = '<i class="ti ti-building me-1"></i> Chapter';
                        break;
                    case 'month':
                        toggleButton.innerHTML = '<i class="ti ti-calendar me-1"></i> Month';
                        break;
                }
            });

            // Reset any active selections in dropdowns
            document.querySelectorAll('.dropdown-item.active').forEach(item => {
                item.classList.remove('active');
            });

            // Hide filter buttons
            applyFilterBtn.style.display = 'none';
            resetFilterBtn.style.display = 'none';

            // Reset the table to show all visitors
            renderVisitors(visitors);
        });

        // Add real-time search functionality
        const searchInput = document.getElementById('searchAccolades');
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            // If search term is empty, show all visitors or current filtered results
            if (!searchTerm) {
                renderVisitors(visitors);
                return;
            }

            // Filter visitors based on search term
            const filteredVisitors = visitors.filter(visitor => {
                return (
                    (visitor.visitor_name && visitor.visitor_name.toLowerCase().includes(searchTerm)) ||
                    (visitor.visitor_company_name && visitor.visitor_company_name.toLowerCase().includes(searchTerm)) ||
                    (visitor.visitor_phone && visitor.visitor_phone.includes(searchTerm)) ||
                    (visitor.invited_by_name && visitor.invited_by_name.toLowerCase().includes(searchTerm))
                );
            });

            console.log('Search Term:', searchTerm);
            console.log('Filtered Results:', filteredVisitors.length);

            // Render filtered results
            renderVisitors(filteredVisitors);
        });

        // Add sorting state
        let sortState = {
            column: null,
            ascending: true
        };

        // Function to update total count
        const updateTotalCount = (count) => {
            document.getElementById('total-visitors-count').innerHTML = `<b>${count}</b>`;
        };

        // Function to sort data
        const sortData = (data, column, ascending) => {
            return [...data].sort((a, b) => {
                let aValue, bValue;

                switch(column) {
                    case 'visitor_name':
                    case 'invited_by_name':
                    case 'visitor_company_name':
                    case 'visitor_phone':
                        aValue = (a[column] || '').toLowerCase();
                        bValue = (b[column] || '').toLowerCase();
                        break;
                    case 'region':
                        aValue = (regions.find(r => r.region_id === a.region_id)?.region_name || '').toLowerCase();
                        bValue = (regions.find(r => r.region_id === b.region_id)?.region_name || '').toLowerCase();
                        break;
                    case 'chapter':
                        aValue = (chapters.find(c => c.chapter_id === a.chapter_id)?.chapter_name || '').toLowerCase();
                        bValue = (chapters.find(c => c.chapter_id === b.chapter_id)?.chapter_name || '').toLowerCase();
                        break;
                    case 'visited_date':
                        aValue = new Date(a.visited_date);
                        bValue = new Date(b.visited_date);
                        break;
                    case 'forms':
                        aValue = (a.visitor_form ? 1 : 0) + (a.eoi_form ? 1 : 0) + (a.new_member_form ? 1 : 0);
                        bValue = (b.visitor_form ? 1 : 0) + (b.eoi_form ? 1 : 0) + (b.new_member_form ? 1 : 0);
                        break;
                    default:
                        aValue = a[column];
                        bValue = b[column];
                }

                if (aValue < bValue) return ascending ? -1 : 1;
                if (aValue > bValue) return ascending ? 1 : -1;
                return 0;
            });
        };

        // Add click handlers for sorting
        document.querySelectorAll('th').forEach(th => {
            th.style.cursor = 'pointer';
            th.addEventListener('click', () => {
                const column = th.textContent.trim().toLowerCase()
                    .replace(/\s+/g, '_')
                    .replace(/[^a-z0-9_]/g, '');

                // Toggle sort direction if same column, else default to ascending
                if (sortState.column === column) {
                    sortState.ascending = !sortState.ascending;
                } else {
                    sortState.column = column;
                    sortState.ascending = true;
                }

                // Update sort icons
                document.querySelectorAll('th i').forEach(icon => {
                    icon.className = 'ti ti-arrows-sort';
                });
                th.querySelector('i').className = `ti ti-sort-${sortState.ascending ? 'ascending' : 'descending'}`;

                // Sort and render
                const sortedData = sortData(visitors, column, sortState.ascending);
                renderVisitors(sortedData);
            });
        });

        // Update renderVisitors function
        async function renderVisitors(visitorsToShow) {
            // First filter visitors to only include those with completed payments
            const paidVisitors = await Promise.all(
                visitorsToShow.map(async (visitor) => {
                    const isPaid = await checkMembershipPayment(visitor.visitor_id);
                    return isPaid ? visitor : null;
                })
            );
            
            // Remove null entries and keep only paid visitors
            const filteredVisitors = paidVisitors.filter(visitor => visitor !== null);

            // Update total count with filtered visitors
            updateTotalCount(filteredVisitors.length);

            if (!filteredVisitors.length) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="15" class="text-center">No visitors found with completed payments</td>
                    </tr>`;
                return;
            }

            const tableContent = await Promise.all(filteredVisitors.map(async (visitor, index) => {
                const region = regions.find(r => r.region_id === visitor.region_id);
                const chapter = chapters.find(c => c.chapter_id === visitor.chapter_id);
                
                // Fetch member application details for this visitor
                const memberApplication = await fetchMemberApplicationDetails(visitor.visitor_id);
                
                return `
                    <tr>
                        <td>${index + 1}</td>
                        <td><b>${visitor.visitor_name || 'N/A'}</b></td>
                        <td><b>${visitor.invited_by_name || 'N/A'}</b></td>
                        <td><b>${region?.region_name || 'N/A'}</b></td>
                        <td><b>${chapter?.chapter_name || 'N/A'}</b></td>
                        <td><b>${formatDate(visitor.visited_date)}</b></td>
                        <td><b>${visitor.visitor_phone || 'N/A'}</b></td>
                        <td><b>${visitor.visitor_category || 'N/A'}</b></td>
                        <td class="text-center">${await getStatusIcon(visitor.visitor_form, 'visitor', visitor)}</td>
                        <td class="text-center">${await getStatusIcon(visitor.eoi_form, 'eoi', visitor)}</td>
                        <td class="text-center">${await getStatusIcon(visitor.member_application_form, 'member_application', visitor)}</td>
                        <td class="text-center">${await getStatusIcon(visitor.new_member_form, 'payment', visitor)}</td>
                        <td class="text-center">
                            <button class="send-mail-btn">
                                Send Mail <i class="ri-mail-send-line"></i>
                            </button>
                        </td>
                        <td class="text-center">
                            <button class="send-mail-btn">
                                Send Mail <i class="ri-mail-send-line"></i>
                            </button>
                        </td>
                        <td class="text-center">${await getStatusIcon(visitor.interview_sheet, 'interview', visitor)}</td>
                        <td class="text-center">${await getStatusIcon(visitor.commitment_sheet, 'commitment', visitor)}</td>
                        <td class="text-center">${await getStatusIcon(visitor.inclusion_exclusion_sheet, 'inclusion', visitor)}</td>
                        <td class="text-center">
                            ${createDocumentDisplay(
                                memberApplication?.aadhar_card_img,
                                memberApplication?.aadhar_card_number,
                                'aadharCard'
                            )}
                        </td>
                        <td class="text-center">
                            ${createDocumentDisplay(
                                memberApplication?.pan_card_img,
                                memberApplication?.pan_card_number,
                                'panCard'
                            )}
                        </td>
                        <td class="text-center">
                            ${createDocumentDisplay(
                                memberApplication?.gst_certificate,
                                visitor.visitor_gst,
                                'gstCertificate'
                            )}
                        </td>
                        <td class="text-center">${createInductionStatus(visitor)}</td>
                    </tr>
                `;
            }));

            tableBody.innerHTML = tableContent.join('');
        }

        // Add this helper function
        function createDocumentDisplay(imgPath, docNumber, docType) {
            if (!imgPath) {
                return `
                    <div class="doc-container">
                        <div class="no-doc">No ${docType} Found</div>
                    </div>`;
            }

            const folderName = docType === 'aadharCard' ? 'aadharCards' : 
                              docType === 'panCard' ? 'panCards' : 
                              'gstCertificates';
                              
            const fullImageUrl = `https://backend.bninewdelhi.com/api/uploads/${folderName}/${imgPath}`;
            
            return `
                <div class="doc-container">
                    <img src="${fullImageUrl}" 
                         class="doc-preview" 
                         onclick="previewDocument(this.src, '${docType}')" 
                         alt="${docType} Preview"
                         onerror="this.onerror=null; this.src='../../assets/images/media/no-image.png';"
                    />
                    <div class="doc-number">${docNumber || 'N/A'}</div>
                </div>`;
        }

        // Initial render with total count
        renderVisitors(visitors);

    } catch (error) {
        console.error('Error:', error);
        tableBody.innerHTML = `
            <tr>
                <td colspan="11" class="text-center text-danger">Error loading visitors data</td>
            </tr>
        `;
    } finally {
        hideLoader();
    }
});

// Add CSS for the View link styling
const style = document.createElement('style');
style.textContent = `
    .view-sheet-link {
        display: inline-block;
        margin-top: 5px;
        font-size: 0.875rem;
        cursor: pointer;
    }
`;
document.head.appendChild(style);

// Update the existing style declaration instead of creating a new one
document.head.querySelector('style').textContent += `
    .mail-sent-btn {
        background-color: rgba(37, 99, 235, 0.1);
        color: #2563eb;
        border: none;
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 12px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        cursor: default;
    }

    .mail-sent-btn i {
        font-size: 14px;
    }

    .upload-btn {
        background-color: #f3f4f6;
        color: #374151;
        border: 1px dashed #9ca3af;
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 12px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .upload-btn:hover {
        background-color: #e5e7eb;
    }

    .doc-preview {
        width: 40px;
        height: 40px;
        border-radius: 4px;
        object-fit: cover;
        cursor: pointer;
        border: 1px solid #e5e7eb;
    }

    .send-mail-btn {
        background-color: rgba(34, 197, 94, 0.1);  // Light green with opacity
        color: #16a34a;                            // Green text
        border: none;                              // No border at all
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 12px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .send-mail-btn:hover {
        background-color: rgba(34, 197, 94, 0.15);
    }

    .send-mail-btn i {
        font-size: 14px;
    }
`;

// Add these functions outside the DOMContentLoaded event
function handleScreenshotUpload(event, visitorId) {
    const file = event.target.files[0];
    if (file) {
        // Show preview in a SweetAlert2 dialog
        const reader = new FileReader();
        reader.onload = function(e) {
            Swal.fire({
                title: 'Onboarding Call Screenshot',
                imageUrl: e.target.result,
                imageAlt: 'Screenshot Preview',
                showCancelButton: true,
                confirmButtonText: 'Upload',
                cancelButtonText: 'Cancel',
                confirmButtonColor: '#2563eb',
                cancelButtonColor: '#dc2626'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Here you'll add the actual upload logic later
                    Swal.fire('Success!', 'Screenshot uploaded successfully', 'success');
                }
            });
        };
        reader.readAsDataURL(file);
    }
}

function previewDocument(src, title) {
    Swal.fire({
        title: title,
        imageUrl: src,
        imageAlt: title,
        confirmButtonText: 'Close',
        confirmButtonColor: '#2563eb'
    });
}
