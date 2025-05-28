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
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                console.log('🔄 Processing Induction for visitor:', visitor);

                // Make API call to update induction status
                const response = await fetch('https://backend.bninewdelhi.com/api/update-visitor', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        visitor_id: visitor.visitor_id,
                        induction_status: true
                    })
                });

                console.log('📡 API Response Status:', response.status);
                const data = await response.json();
                console.log('📦 API Response Data:', data);

                if (!response.ok) {
                    throw new Error(data.error || 'Failed to update induction status');
                }

                // Update UI
                const inductionCell = document.querySelector(`[data-induction-id="${visitor.visitor_id}"]`);
                if (inductionCell) {
                    inductionCell.innerHTML = `
                        <div class="approved-kit-status" style="display: inline-flex; align-items: center; gap: 5px;">
                            <i class="ri-checkbox-circle-fill text-success" 
                               style="font-size: 1.5em; filter: drop-shadow(0 0 2px rgba(34, 197, 94, 0.5));"></i>
                            <span class="text-success fw-bold" 
                                  style="text-shadow: 0 0 2px rgba(34, 197, 94, 0.3);">
                                Inducted
                            </span>
                        </div>
                    `;
                }

                Swal.fire({
                    title: 'Success!',
                    text: 'Visitor has been inducted successfully.',
                    icon: 'success',
                    confirmButtonColor: '#2563eb'
                });

            } catch (error) {
                console.error('❌ Error inducting visitor:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: error.message || 'Failed to induct visitor. Please try again.'
                });
            }
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
        
        const membershipRecord = membershipData.find(record => record.visitor_id === visitorId);
        
        if (!membershipRecord) return false;
        
        // Handle NaN or invalid due_balance
        const dueBalance = parseFloat(membershipRecord.due_balance);
        if (isNaN(dueBalance)) {
            // If due_balance is NaN, check if paid_amount is greater than or equal to total_amount
            const paidAmount = parseFloat(membershipRecord.paid_amount) || 0;
            const totalAmount = parseFloat(membershipRecord.total_amount) || 0;
            return paidAmount >= totalAmount;
        }
        
        return dueBalance < 1;
    } catch (error) {
        console.error('Error checking membership payment:', error);
        return false;
    }
}

// Add this function to fetch member application details
async function fetchMemberApplicationDetails(visitorId) {
    try {
        console.log("🔍 Fetching member application details for visitor ID:", visitorId);
        const response = await fetch('https://backend.bninewdelhi.com/api/memberApplicationFormNewMember');
        const applications = await response.json();
        console.log("📄 All applications:", applications);
        
        const matchedApplication = applications.find(app => app.visitor_id === visitorId);
        console.log("🎯 Matched application:", matchedApplication);
        
        return matchedApplication || null;
    } catch (error) {
        console.error("❌ Error fetching member application:", error);
        return null;
    }
}

// Add this function to fetch document details
async function getDocumentFileName(visitorId, chapterId, documentType) {
    try {
        const response = await fetch('https://backend.bninewdelhi.com/api/getAllVisitorDocuments');
        const documents = await response.json();
        
        console.log('📄 All Documents:', documents);
        
        // Find the matching document
        const document = documents.find(doc => 
            doc.visitor_id === visitorId && 
            doc.chapter_id === chapterId && 
            doc.document_type === documentType
        );
        
        console.log('🔍 Found Document:', document);
        
        return document ? document.file_name : null;
    } catch (error) {
        console.error('❌ Error fetching document:', error);
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
            console.log('📋 Document Status Check:');
            console.log('📄 Type:', type);
            console.log('✅ Status:', status);
            console.log('👤 Visitor:', visitor);

            // For new member form, check payment status
            if (type === 'payment') {
                const isPaid = await checkMembershipPayment(visitor.visitor_id);
                status = status && isPaid; // Only show green check if both form is completed AND payment is made
            }

            const icon = status ? 
                '<i class="ri-checkbox-circle-fill text-success" style="font-size: 1.5em;"></i>' : 
                '<i class="ri-close-circle-fill text-danger" style="font-size: 1.5em;"></i>';
            
                let pageUrl;
                let verificationStatus = false;

                // Debug log for incoming data
                console.log('🔍 Processing visitor:', visitor);
                console.log('📋 Form type:', type);
                console.log('📊 Verification data:', visitor.verification);

                // Check verification status based on form type
                if (visitor.verification) {
                    try {
                        const verificationData = typeof visitor.verification === 'string' 
                            ? JSON.parse(visitor.verification) 
                            : visitor.verification;
                        
                        console.log('✅ Parsed verification data:', verificationData);

                        switch(type) {
                            case 'eoi':
                                verificationStatus = verificationData.eoi_form === "true";
                                break;
                            case 'member_application':
                                verificationStatus = verificationData.member_application_form === "true";
                                break;
                            case 'interview':
                                verificationStatus = verificationData.interview_sheet === "true";
                                break;
                            case 'commitment':
                                verificationStatus = verificationData.commitment_sheet === "true";
                                break;
                            case 'inclusion':
                                verificationStatus = verificationData.inclusion_exclusion_sheet === "true";
                                break;
                        }
                        console.log('🎯 Verification status:', verificationStatus);
                    } catch (error) {
                        console.error('❌ Error parsing verification data:', error);
                    }
                }

                switch(type) {
                    case 'visitor':
                        pageUrl = '/t/visitorForm';
                        return `
                            ${icon}<br>
                            <a href="${pageUrl}?visitor_id=${visitor.visitor_id}" 
                               target="_blank" 
                               class="view-sheet-link fw-medium text-success text-decoration-underline">
                               View
                            </a>
                        `;
                    case 'payment':
                        // Only show view link if payment is completed
                        const isPaid = await checkMembershipPayment(visitor.visitor_id);
                        if (!isPaid) return icon;
                        pageUrl = '/t/newmemberReceipt';
                        return `
                            ${icon}<br>
                            <a href="${pageUrl}?visitor_id=${visitor.visitor_id}" 
                               target="_blank" 
                               class="view-sheet-link fw-medium text-success text-decoration-underline">
                               View
                            </a>
                        `;
                    case 'eoi':
                        pageUrl = '/t/eoi-form';
                        break;
                    case 'member_application':
                        pageUrl = '/t/memberApplication';
                        break;
                    case 'interview':
                        pageUrl = '/t/interview';
                        break;
                    case 'commitment':
                        pageUrl = '/t/commitment';
                        break;
                    case 'inclusion':
                        pageUrl = '/t/inclusion';
                        break;
                }

            // Add upload button for specific document types
            let uploadButton = '';
            let previewButton = '';
            if (['member_application', 'interview', 'commitment', 'inclusion'].includes(type)) {
                const documentTypeMap = {
                    'member_application': 'member_application_form',
                    'interview': 'interview_sheet',
                    'commitment': 'commitment_sheet',
                    'inclusion': 'inclusion_exclusion_sheet'
                };
                
                console.log('📝 Document Type Mapping:', documentTypeMap[type]);
                
                // Add preview button if document exists
                if (status) {
                    const baseUrl = 'https://backend.bninewdelhi.com/api/uploads/visitor_documents';
                    const docType = documentTypeMap[type];
                    
                    // Get the file name from the API
                    const fileName = await getDocumentFileName(visitor.visitor_id, visitor.chapter_id, docType);
                    
                    console.log('🔍 File Details:');
                    console.log('📄 File Name from API:', fileName);
                    
                    if (fileName) {
                        const fullUrl = `${baseUrl}/${docType}/${fileName}`;
                        
                        console.log('🔗 Document URL Details:');
                        console.log('📁 Base URL:', baseUrl);
                        console.log('📄 Document Type:', docType);
                        console.log('🆔 Visitor ID:', visitor.visitor_id);
                        console.log('📎 File Name:', fileName);
                        console.log('🔗 Full URL:', fullUrl);
                        
                        previewButton = `
                            <a href="javascript:void(0)" 
                               onclick="previewDocument('${fullUrl}', '${type.replace('_', ' ').toUpperCase()}', ${visitor.visitor_id})"
                               class="preview-btn mt-2" 
                               title="Preview ${type.replace('_', ' ').toUpperCase()}">
                                <i class="ri-eye-line"></i> Preview
                            </a>`;
                    } else {
                        console.log('⚠️ No file name found in documents');
                    }
                }
                
                uploadButton = `
                    <label class="upload-btn mt-2" title="Upload ${type.replace('_', ' ').toUpperCase()}">
                        <i class="ri-upload-2-line"></i> Upload
                        <input type="file" 
                               accept=".pdf,.jpg,.jpeg,.png" 
                               style="display: none;" 
                               onchange="handleDocumentUpload(event, ${visitor.visitor_id}, ${visitor.chapter_id}, '${documentTypeMap[type]}', ${visitor.invited_by})"
                        >
                    </label>`;
            }

            // Show verification badge, preview button, and upload button for all document types
                return `
                    ${icon}<br>
                ${status ? `
                    <a href="${pageUrl}?visitor_id=${visitor.visitor_id}" 
                       target="_blank" 
                       class="view-sheet-link fw-medium text-success text-decoration-underline">
                       View
                    </a>
                ` : ''}
                ${previewButton}
                ${uploadButton}
                    <div class="verification-badge" style="
                        margin-top: 5px;
                        padding: 2px 8px;
                        background-color: ${verificationStatus ? '#dcfce7' : '#fee2e2'};
                        color: ${verificationStatus ? '#16a34a' : '#dc2626'};
                        border: 1px solid ${verificationStatus ? '#86efac' : '#fecaca'};
                        border-radius: 12px;
                        font-size: 11px;
                        font-weight: 600;
                        display: inline-block;
                        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
                        ${verificationStatus ? 'Verified' : 'Not Verified'}
                    </div>
                `;
        };

        // Add function to check induction status
        const getInductionStatus = (visitor) => {
            console.log('🔍 Checking induction status for visitor:', visitor);
            let verificationData = {};
            try {
                // Remove extra quotes if they exist and parse
                const cleanVerification = visitor.verification && typeof visitor.verification === 'string'
                    ? visitor.verification.replace(/^"/, '').replace(/"$/, '')
                    : visitor.verification;
                verificationData = cleanVerification ? JSON.parse(cleanVerification) : {};
                console.log('📋 Parsed verification data:', verificationData);
            } catch (error) {
                console.error('❌ Error parsing verification data:', error);
                return false;
            }
            // Check all required conditions
            const conditions = {
                // Form completions
                // visitor_form: visitor.visitor_form,  
                // eoi_form: visitor.eoi_form && verificationData.eoi_form === "true",
                member_application: visitor.member_application_form && verificationData.member_application_form === "true",
                // interview_sheet: visitor.interview_sheet && verificationData.interview_sheet === "true",
                // commitment_sheet: visitor.commitment_sheet && verificationData.commitment_sheet === "true",
                // inclusion_exclusion_sheet: visitor.inclusion_exclusion_sheet && verificationData.inclusion_exclusion_sheet === "true",
                new_member_form: visitor.new_member_form,
                // Document verifications
                // aadhar_verified: verificationData.aadharcard === "true",
                // pan_verified: verificationData.pancard === "true",
                // gst_verified: verificationData.gstcertificate === "true",
                // Mail verifications
                // vp_mail: verificationData.vp_mail === "true",
                // welcome_mail: verificationData.welcome_mail === "true"
            };
            console.log('✅ Checking conditions:', conditions);
            // Return true only if all conditions are met
            const isReady = Object.values(conditions).every(condition => condition === true);
            console.log('🎯 Final induction status:', isReady);
            return isReady;
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

        // Define the simplified condition for showing buttons
        const showUpdateButtons = (visitor) => {
            return visitor.new_member_form && visitor.member_application_form ;
        };

        // Function to render visitors
        async function renderVisitors(visitorsToShow) {
            // Filter visitors based on payment status
            const filteredVisitors = await Promise.all(
                visitorsToShow.map(async (visitor) => {
                    const isPaid = await checkMembershipPayment(visitor.visitor_id);
                    return isPaid ? visitor : null;
                })
            );

            // Remove null values (visitors who haven't paid)
            const paidVisitors = filteredVisitors.filter(visitor => visitor !== null);

            // Update total count with paid visitors only
            updateTotalCount(paidVisitors.length);

            if (!paidVisitors.length) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="15" class="text-center">No visitors found</td>
                    </tr>`;
                return;
            }

            const tableContent = await Promise.all(paidVisitors.map(async (visitor, index) => {
                console.log("👤 Processing visitor:", visitor);
                const region = regions.find(r => r.region_id === visitor.region_id);
                const chapter = chapters.find(c => c.chapter_id === visitor.chapter_id);
                
                // Fetch member application details for this visitor
                const memberApplication = await fetchMemberApplicationDetails(visitor.visitor_id);
                console.log("📑 Member application data:", memberApplication);
                
                // Check payment status
                const isPaid = await checkMembershipPayment(visitor.visitor_id);
                
                // Create payment status display
                const paymentStatusDisplay = isPaid ? 
                    `<i class="ri-checkbox-circle-fill text-success" style="font-size: 1.5em;"></i>
                     <a href="/t/newmemberReceipt?visitor_id=${visitor.visitor_id}" 
                        target="_blank" 
                        class="view-sheet-link fw-medium text-success text-decoration-underline">
                        View
                     </a>` :
                    `<button class="btn btn-primary btn-sm" onclick="handleManualPayment(${visitor.visitor_id})">
                        Add Manually
                    </button>`;

                // Document display helper function
                const createDocumentDisplay = (imgPath, docNumber, docType, visitorId) => {
                    console.log(`🖼️ Creating ${docType} display:`, { imgPath, docNumber, visitorId });
                    
                    // Parse verification status from visitor data
                    let verificationStatus = false;
                    try {
                        const verificationData = JSON.parse(visitor.verification || '{}');
                        const verificationKey = docType.toLowerCase().replace(/\s+/g, '_');
                        verificationStatus = verificationData[verificationKey] === "true";
                        console.log(`📋 Verification status for ${docType}:`, verificationStatus);
                    } catch (error) {
                        console.error('❌ Error parsing verification data:', error);
                    }
                    
                    // Base URL for images
                    const baseUrl = 'https://backend.bninewdelhi.com/api/uploads';
                    
                    // Determine folder name based on document type
                    const folderName = docType === 'aadharCard' ? 'aadharCards' : 
                                      docType === 'panCard' ? 'panCards' : 
                                      'gstCertificates';
                    
                    if (!imgPath) {
                        console.log(`⚠️ No ${docType} image found, showing upload button`);
                        return `
                            <div class="doc-container">
                                <div class="no-doc">No ${docType} Found</div>
                                <label class="upload-btn" title="Upload ${docType}">
                                    <i class="ri-upload-2-line"></i> Upload
                                    <input type="file" 
                                           accept="image/*" 
                                           style="display: none;" 
                                           onchange="handleDocUpload(event, '${docType}', ${visitorId})"
                                    >
                                </label>
                                <div class="verification-badge" style="
                                    margin-top: 5px;
                                    padding: 2px 8px;
                                    background-color: ${verificationStatus ? '#dcfce7' : '#fee2e2'};
                                    color: ${verificationStatus ? '#16a34a' : '#dc2626'};
                                    border: 1px solid ${verificationStatus ? '#86efac' : '#fecaca'};
                                    border-radius: 12px;
                                    font-size: 11px;
                                    font-weight: 600;
                                    display: inline-block;
                                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);"
                                    onclick="handleDocVerification('${docType}', event, ${visitorId})">
                                    ${verificationStatus ? 'Verified' : 'Not Verified'}
                                </div>
                            </div>`;
                    }

                    console.log(`✅ ${docType} image found, showing preview`);
                    return `
                        <div class="doc-container">
                            <a href="${baseUrl}/${folderName}/${imgPath}" target="_blank">
                                <img src="${baseUrl}/${folderName}/${imgPath}" 
                                     alt="${docType}" 
                                     style="max-width: 100px;"
                                     onerror="this.onerror=null; this.src='../../assets/images/media/no-image.png';">
                            </a>
                            <div class="doc-number">${docNumber || 'N/A'}</div>
                            <label class="upload-btn" title="Upload New">
                                <i class="ri-upload-2-line"></i>
                                <input type="file" 
                                       accept="image/*" 
                                       style="display: none;" 
                                       onchange="handleDocUpload(event, '${docType}', ${visitorId})"
                                >
                            </label>
                            <div class="verification-badge" style="
                                margin-top: 5px;
                                padding: 2px 8px;
                                background-color: ${verificationStatus ? '#dcfce7' : '#fee2e2'};
                                color: ${verificationStatus ? '#16a34a' : '#dc2626'};
                                border: 1px solid ${verificationStatus ? '#86efac' : '#fecaca'};
                                border-radius: 12px;
                                font-size: 11px;
                                font-weight: 600;
                                display: inline-block;
                                cursor: pointer;
                                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);"
                                onclick="handleDocVerification('${docType}', event, ${visitorId})">
                                ${verificationStatus ? 'Verified' : 'Not Verified'}
                            </div>
                        </div>`;
                };

                // Add this new section for onboarding call display
                const onboardingCallDisplay = visitor.onboarding_call 
                    ? `
                        <div class="doc-container">
                            <img src="https://backend.bninewdelhi.com/api/uploads/onboardingCalls/${visitor.onboarding_call}" 
                                 class="doc-preview" 
                                 onclick="previewDocument(this.src, 'Onboarding Call Screenshot', ${visitor.visitor_id})" 
                                 alt="Onboarding Call Preview"
                                 onerror="this.onerror=null; this.src='../../assets/images/media/no-image.png';"
                            />
                            <div class="doc-actions">
                                <label class="upload-btn" title="Upload New">
                                    <i class="ri-upload-2-line"></i>
                                    <input type="file" 
                                           accept="image/*" 
                                           style="display: none;" 
                                           onchange="handleScreenshotUpload(event, ${visitor.visitor_id})"
                                    >
                                </label>
                            </div>
                            ${(() => {
                                let verificationStatus = false;
                                try {
                                    const verificationData = typeof visitor.verification === 'string' 
                                        ? JSON.parse(visitor.verification) 
                                        : visitor.verification;
                                    verificationStatus = verificationData.onboarding_call === "true";
                                } catch (e) {
                                    console.error('Error parsing verification:', e);
                                }
                                return `
                                    <div class="verification-badge" style="
                                        margin-top: 5px;
                                        padding: 2px 8px;
                                        background-color: ${verificationStatus ? '#dcfce7' : '#fee2e2'};
                                        color: ${verificationStatus ? '#16a34a' : '#dc2626'};
                                        border: 1px solid ${verificationStatus ? '#86efac' : '#fecaca'};
                                        border-radius: 12px;
                                        font-size: 11px;
                                        font-weight: 600;
                                        display: inline-block;
                                        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
                                        ${verificationStatus ? 'Verified' : 'Not Verified'}
                                    </div>
                                `;
                            })()}
                        </div>
                    `
                    : `
                        <label class="upload-btn">
                            <i class="ri-upload-2-line"></i> Upload Screenshot
                            <input type="file" 
                                   accept="image/*" 
                                   style="display: none;" 
                                   onchange="handleScreenshotUpload(event, ${visitor.visitor_id})"
                            >
                        </label>
                        ${(() => {
                            let verificationStatus = false;
                            try {
                                const verificationData = typeof visitor.verification === 'string' 
                                    ? JSON.parse(visitor.verification) 
                                    : visitor.verification;
                                verificationStatus = verificationData.onboarding_call === "true";
                            } catch (e) {
                                console.error('Error parsing verification:', e);
                            }
                            return `
                                <div class="verification-badge" style="
                                    margin-top: 5px;
                                    padding: 2px 8px;
                                    background-color: ${verificationStatus ? '#dcfce7' : '#fee2e2'};
                                    color: ${verificationStatus ? '#16a34a' : '#dc2626'};
                                    border: 1px solid ${verificationStatus ? '#86efac' : '#fecaca'};
                                    border-radius: 12px;
                                    font-size: 11px;
                                    font-weight: 600;
                                    display: inline-block;
                                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
                                    ${verificationStatus ? 'Verified' : 'Not Verified'}
                                </div>
                            `;
                        })()}
                    `;

                // Add this function to handle induction kit status
                function createInductionKitStatus(visitor) {
                    const isReady =
                                    // visitor.eoi_form && 
                                    visitor.member_application_form && 
                                    visitor.new_member_form 
                                    // visitor.interview_sheet && 
                                    // visitor.commitment_sheet && 
                                    // visitor.inclusion_exclusion_sheet;
                    
                    if (!isReady) {
                        return `<i class="ri-close-circle-fill text-danger" style="font-size: 1.5em;"></i>`;
                    }

                    if (visitor.approve_induction_kit) {
                        return `
                            <button class="btn btn-success btn-sm" disabled 
                                    style="opacity: 0.7; cursor: not-allowed; filter: blur(0.3px); transition: all 0.3s ease;">
                                <i class="ri-checkbox-circle-line me-1"></i> Induction Kit Approved
                            </button>
                        `;
                    }

                    return `
                        <button class="btn btn-primary btn-sm approve-kit-btn" 
                                onclick="handleInductionKitApproval(${visitor.visitor_id}, ${visitor.chapter_id})"
                                type="button">
                            Approve Induction kit
                        </button>
                    `;
                }

                // Add these new cells before the induction kit status cell
                const isReadyForInduction = visitor.visitor_form && 
                                           visitor.eoi_form && 
                                           visitor.member_application_form && 
                                           visitor.new_member_form && 
                                           visitor.interview_sheet && 
                                           visitor.commitment_sheet && 
                                           visitor.inclusion_exclusion_sheet;

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
                        <td class="text-center">${paymentStatusDisplay}</td>
                        <td class="text-center">
                            ${visitor.vp_mail ? 
                                `<button class="mail-sent-btn">
                                    Mail Sent <i class="ri-check-line"></i>
                                </button>
                                ${(() => {
                                    let verification = {};
                                    try {
                                        verification = typeof visitor.verification === 'string' ? JSON.parse(visitor.verification) : (visitor.verification || {});
                                    } catch (e) { verification = {}; }
                                    if (verification.vp_mail === "true") {
                                        return '<span class="badge bg-success ms-2" style="cursor:default;">Verified</span>';
                                    } else {
                                        return '<span class="badge bg-danger ms-2 vp-mail-verify-badge" style="cursor:pointer;">Not Verified</span>';
                                    }
                                })()}`
                                : 
                                `<button class="mail-not-sent-btn">
                                    Mail Not Sent <i class="ri-close-line"></i>
                                </button>`
                            }
                        </td>
                        <td class="text-center">
                            ${visitor.welcome_mail ? 
                                `<button class="mail-sent-btn">
                                    Mail Sent <i class="ri-check-line"></i>
                                </button>
                                ${(() => {
                                    let verification = {};
                                    try {
                                        verification = typeof visitor.verification === 'string' ? JSON.parse(visitor.verification) : (visitor.verification || {});
                                    } catch (e) { verification = {}; }
                                    if (verification.welcome_mail === "true") {
                                        return '<span class="badge bg-success ms-2" style="cursor:default;">Verified</span>';
                                    } else {
                                        return '<span class="badge bg-danger ms-2 welcome-mail-verify-badge" style="cursor:pointer;">Not Verified</span>';
                                    }
                                })()}`
                                : 
                                `<button class="mail-not-sent-btn">
                                    Mail Not Sent <i class="ri-close-line"></i>
                                </button>`
                            }
                        </td>
                        <td class="text-center">${await getStatusIcon(visitor.interview_sheet, 'interview', visitor)}</td>
                        <td class="text-center">${await getStatusIcon(visitor.commitment_sheet, 'commitment', visitor)}</td>
                        <td class="text-center">${await getStatusIcon(visitor.inclusion_exclusion_sheet, 'inclusion', visitor)}</td>
                        <td class="text-center">
                            ${onboardingCallDisplay}
                        </td>
                        <td class="text-center">
                            ${createDocumentDisplay(
                                memberApplication?.aadhar_card_img,
                                memberApplication?.aadhar_card_number,
                                'aadharCard',
                                visitor.visitor_id
                            )}
                        </td>
                        <td class="text-center">
                            ${createDocumentDisplay(
                                memberApplication?.pan_card_img,
                                memberApplication?.pan_card_number,
                                'panCard',
                                visitor.visitor_id
                            )}
                        </td>
                        <td class="text-center">
                            ${createDocumentDisplay(
                                memberApplication?.gst_certificate,
                                visitor.visitor_gst,
                                'gstCertificate',
                                visitor.visitor_id
                            )}
                        </td>
                        <td class="text-center" data-entry-id="${visitor.visitor_id}">
                            ${visitor.visitor_entry_excel 
                                ? `<button class="btn btn-success btn-sm" disabled style="opacity: 0.7; cursor: not-allowed;">
                                    <i class="ri-checkbox-circle-line"></i> Entry Updated
                                   </button>`
                                : showUpdateButtons(visitor)
                                    ? `<button class="btn btn-primary btn-sm" onclick="handleVisitorEntry(${JSON.stringify(visitor).replace(/"/g, '&quot;')})">
                                         <i class="ri-user-add-line"></i> Update Entry
                                       </button>`
                                    : `<i class="ri-close-circle-fill text-danger" style="font-size: 1.5em;"></i>`
                            }
                        </td>
                        <td class="text-center" data-sheet-id="${visitor.visitor_id}">
                            ${visitor.google_updation_sheet 
                                ? `<button class="btn btn-success btn-sm" disabled style="opacity: 0.7; cursor: not-allowed;">
                                    <i class="ri-checkbox-circle-line"></i> Sheet Updated
                                   </button>`
                                : showUpdateButtons(visitor)
                                    ? `<button class="btn btn-primary btn-sm" onclick="handleGoogleSheet(${JSON.stringify(visitor).replace(/"/g, '&quot;')})">
                                         <i class="ri-google-line"></i> Update Sheet
                                       </button>`
                                    : `<i class="ri-close-circle-fill text-danger" style="font-size: 1.5em;"></i>`
                            }
                        </td>
                        <td class="text-center" data-visitor-id="${visitor.visitor_id}">
                            ${createInductionKitStatus(visitor)}
                        </td>
                        <td class="text-center" data-induction-id="${visitor.visitor_id}">
                            ${visitor.induction_status 
                                ? `<div class="approved-kit-status" style="display: inline-flex; align-items: center; gap: 5px;">
                                       <i class="ri-checkbox-circle-fill text-success" 
                                          style="font-size: 1.5em; filter: drop-shadow(0 0 2px rgba(34, 197, 94, 0.5));"></i>
                                       <span class="text-success fw-bold" 
                                             style="text-shadow: 0 0 2px rgba(34, 197, 94, 0.3);">
                                           Inducted
                                       </span>
                                   </div>`
                                : createInductionStatus(visitor)
                            }
                        </td>
                    </tr>
                `;
            }));

            tableBody.innerHTML = tableContent.join('');

            // Helper to get visitor object by ID from the current data
            function getVisitorById(visitorId, visitorsArr) {
                return visitorsArr.find(v => String(v.visitor_id) === String(visitorId));
            }

            // VP Mail badge handler
            Array.from(document.querySelectorAll('.vp-mail-verify-badge')).forEach(badge => {
                badge.addEventListener('click', async function() {
                    const row = this.closest('tr');
                    let visitorId;
                    if (row) {
                        visitorId = row.getAttribute('data-visitor-id');
                        if (!visitorId) {
                            const paymentLink = row.querySelector('a[href*="visitor_id="]');
                            if (paymentLink) {
                                const url = new URL(paymentLink.href, window.location.origin);
                                visitorId = url.searchParams.get('visitor_id');
                            }
                        }
                    }
                    if (!visitorId) {
                        Swal.fire('Error', 'Could not determine visitor ID.', 'error');
                        return;
                    }
                    const result = await Swal.fire({
                        title: 'Verify Mail',
                        text: 'Are you sure that this mail has come to you?',
                        icon: 'question',
                        showCancelButton: true,
                        confirmButtonColor: '#16a34a',
                        cancelButtonColor: '#dc2626',
                        confirmButtonText: 'Yes',
                        cancelButtonText: 'Cancel'
                    });
                    if (result.isConfirmed) {
                        // Get the visitor object from the current data
                        const visitor = typeof window.visitors !== 'undefined' ? getVisitorById(visitorId, window.visitors) : null;
                        let verification = {};
                        if (visitor && visitor.verification) {
                            try {
                                verification = typeof visitor.verification === 'string'
                                    ? JSON.parse(visitor.verification)
                                    : visitor.verification;
                            } catch (e) { verification = {}; }
                        }
                        verification.vp_mail = "true";
                        try {
                            const response = await fetch('https://backend.bninewdelhi.com/api/update-visitor', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    visitor_id: parseInt(visitorId),
                                    verification: verification
                                })
                            });
                            const data = await response.json();
                            if (!response.ok) throw new Error(data.error || 'Failed to update mail verification');
                            this.classList.remove('bg-danger');
                            this.classList.add('bg-success');
                            this.textContent = 'Verified';
                            this.style.cursor = 'default';
                            Swal.fire('Verified!', 'VP Mail has been marked as verified.', 'success');
                        } catch (error) {
                            Swal.fire('Error', error.message || 'Failed to verify mail.', 'error');
                        }
                    }
                });
            });

            // Welcome Mail badge handler
            Array.from(document.querySelectorAll('.welcome-mail-verify-badge')).forEach(badge => {
                badge.addEventListener('click', async function() {
                    const row = this.closest('tr');
                    let visitorId;
                    if (row) {
                        visitorId = row.getAttribute('data-visitor-id');
                        if (!visitorId) {
                            const paymentLink = row.querySelector('a[href*="visitor_id="]');
                            if (paymentLink) {
                                const url = new URL(paymentLink.href, window.location.origin);
                                visitorId = url.searchParams.get('visitor_id');
                            }
                        }
                    }
                    if (!visitorId) {
                        Swal.fire('Error', 'Could not determine visitor ID.', 'error');
                        return;
                    }
                    const result = await Swal.fire({
                        title: 'Verify Mail',
                        text: 'Are you sure that this mail has come to you?',
                        icon: 'question',
                        showCancelButton: true,
                        confirmButtonColor: '#16a34a',
                        cancelButtonColor: '#dc2626',
                        confirmButtonText: 'Yes',
                        cancelButtonText: 'Cancel'
                    });
                    if (result.isConfirmed) {
                        // Get the visitor object from the current data
                        const visitor = typeof window.visitors !== 'undefined' ? getVisitorById(visitorId, window.visitors) : null;
                        let verification = {};
                        if (visitor && visitor.verification) {
                            try {
                                verification = typeof visitor.verification === 'string'
                                    ? JSON.parse(visitor.verification)
                                    : visitor.verification;
                            } catch (e) { verification = {}; }
                        }
                        verification.welcome_mail = "true";
                        try {
                            const response = await fetch('https://backend.bninewdelhi.com/api/update-visitor', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    visitor_id: parseInt(visitorId),
                                    verification: verification
                                })
                            });
                            const data = await response.json();
                            if (!response.ok) throw new Error(data.error || 'Failed to update mail verification');
                            this.classList.remove('bg-danger');
                            this.classList.add('bg-success');
                            this.textContent = 'Verified';
                            this.style.cursor = 'default';
                            Swal.fire('Verified!', 'Welcome Mail has been marked as verified.', 'success');
                        } catch (error) {
                            Swal.fire('Error', error.message || 'Failed to verify mail.', 'error');
                        }
                    }
                });
            });
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
    .mail-not-sent-btn {
        background-color: rgba(239, 68, 68, 0.1);
        color: #ef4444;
        border: none;
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 12px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        cursor: default;
    }

    .mail-not-sent-btn i {
        font-size: 14px;
    }

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
        margin-top: 5px;
    }

    .upload-btn:hover {
        background-color: #e5e7eb;
    }

    .upload-btn i {
        font-size: 14px;
    }

    .doc-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        padding: 5px;
    }

    .doc-preview {
        width: 50px;
        height: 50px;
        border-radius: 4px;
        object-fit: cover;
        cursor: pointer;
        border: 1px solid #e5e7eb;
        transition: transform 0.2s;
        background-color: #f9fafb;
    }

    .doc-preview:hover {
        transform: scale(1.1);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .doc-number {
        font-size: 11px;
        color: #4b5563;
        max-width: 120px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-align: center;
        margin-top: 4px;
    }

    .no-doc {
        color: #9ca3af;
        font-size: 12px;
        text-align: center;
        padding: 5px;
    }

    .preview-btn {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        background-color: #f3f4f6;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        color: #4b5563;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        text-decoration: none;
        margin-right: 8px;
    }

    .preview-btn:hover {
        background-color: #e5e7eb;
        color: #1f2937;
    }

    .preview-btn i {
        font-size: 14px;
    }
`;

// Function to handle screenshot upload
async function handleScreenshotUpload(event, visitor_id) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        // Show loading state
        Swal.fire({
            title: 'Uploading...',
            text: 'Please wait while we upload your screenshot',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const formData = new FormData();
        formData.append('onboarding_call_img', file);

        const response = await fetch(`https://backend.bninewdelhi.com/api/updateOnboardingCall/${visitor_id}`, {
            method: 'PUT',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            // Show success message
            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Screenshot uploaded successfully'
            });

            // Update just the image cell instead of re-rendering the whole table
            const uploadCell = event.target.closest('td');
            uploadCell.innerHTML = `
                <div class="doc-container">
                    <img src="${result.data.imageUrl}" 
                         class="doc-preview" 
                         onclick="previewDocument(this.src, 'Onboarding Call Screenshot', ${visitor_id})" 
                         alt="Onboarding Call Preview"
                         onerror="this.onerror=null; this.src='../../assets/images/media/no-image.png';"
                    />
                    <div class="doc-actions">
                        <label class="upload-btn" title="Upload New">
                            <i class="ri-upload-2-line"></i>
                            <input type="file" 
                                   accept="image/*" 
                                   style="display: none;" 
                                   onchange="handleScreenshotUpload(event, ${visitor_id})"
                            >
                        </label>
                    </div>
                </div>
            `;
        } else {
            throw new Error(result.message || 'Upload failed');
        }

    } catch (error) {
        console.error('Error uploading screenshot:', error);
        Swal.fire({
            icon: 'error',
            title: 'Upload Failed',
            text: error.message || 'Failed to upload screenshot. Please try again.'
        });
    }
}

function previewDocument(src, title, visitorId) {
    console.log('🔍 Preview Document Details:');
    console.log('📄 Title:', title);
    console.log('🔗 Full URL:', src);
    console.log('👤 Visitor ID:', visitorId);
    
    // Check if the file is a PDF
    const isPDF = src.toLowerCase().endsWith('.pdf');
    
    // Get document type from title
    const documentTypeMap = {
        'MEMBER APPLICATION': 'member_application_form',
        'INTERVIEW': 'interview_sheet',
        'COMMITMENT': 'commitment_sheet',
        'INCLUSION': 'inclusion_exclusion_sheet'
    };
    
    // Special handling for onboarding call
    if (title === 'Onboarding Call Screenshot') {
        if (isPDF) {
    Swal.fire({
        title: title,
                html: `
                    <div class="text-center">
                        <p class="mb-3">This is a PDF document. Click below to view it.</p>
                        <div class="d-flex gap-2 justify-content-center">
                            <a href="${src}" target="_blank" class="btn btn-primary">
                                <i class="ri-file-pdf-line me-2"></i>Open PDF
                            </a>
                            <button onclick="verifyDocument('onboarding_call', ${visitorId})" class="btn btn-success">
                                <i class="ri-check-line me-2"></i>Verify Details
                            </button>
                        </div>
                    </div>
                `,
        showCloseButton: true,
                showConfirmButton: false,
                width: 'auto'
            });
        } else {
            Swal.fire({
                title: title,
                html: `
                    <div class="text-center">
                        <img src="${src}" style="max-width: 100%; max-height: 70vh;" class="mb-3" />
                        <button onclick="verifyDocument('onboarding_call', ${visitorId})" class="btn btn-success">
                            <i class="ri-check-line me-2"></i>Verify Details
                        </button>
                    </div>
                `,
                showCloseButton: true,
                showConfirmButton: false,
                width: 'auto'
            });
        }
        return;
    }
    
    const docType = documentTypeMap[title.toUpperCase()];
    console.log('📄 Document Type for Verification:', docType);
    
    if (isPDF) {
        Swal.fire({
            title: title,
            html: `
                <div class="text-center">
                    <p class="mb-3">This is a PDF document. Click below to view it.</p>
                    <div class="d-flex gap-2 justify-content-center">
                        <a href="${src}" target="_blank" class="btn btn-primary">
                            <i class="ri-file-pdf-line me-2"></i>Open PDF
                        </a>
                        <button onclick="verifyDocument('${docType}', ${visitorId})" class="btn btn-success">
                            <i class="ri-check-line me-2"></i>Verify Details
                        </button>
                    </div>
                </div>
            `,
            showCloseButton: true,
            showConfirmButton: false,
            width: 'auto'
        });
    } else {
        Swal.fire({
            title: title,
            html: `
                <div class="text-center">
                    <img src="${src}" style="max-width: 100%; max-height: 70vh;" class="mb-3" />
                    <button onclick="verifyDocument('${docType}', ${visitorId})" class="btn btn-success">
                        <i class="ri-check-line me-2"></i>Verify Details
                    </button>
                </div>
            `,
            showCloseButton: true,
            showConfirmButton: false,
            width: 'auto'
        });
    }
}

async function verifyDocument(docType, visitorId) {
    try {
        console.log('🔍 Verifying document:', docType);
        console.log('👤 Visitor ID:', visitorId);
        
        if (!visitorId) {
            throw new Error('Visitor ID is missing');
        }

        // Show loading state
        Swal.fire({
            title: 'Verifying...',
            text: 'Please wait while we update the verification status',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // First get current verification status
        const response = await fetch(`https://backend.bninewdelhi.com/api/getallVisitors`);
        const visitors = await response.json();
        const visitor = visitors.find(v => v.visitor_id === parseInt(visitorId));
        
        let verification = {};
        if (visitor && visitor.verification) {
            try {
                verification = typeof visitor.verification === 'string'
                    ? JSON.parse(visitor.verification)
                    : visitor.verification;
            } catch (e) { 
                verification = {}; 
            }
        }
        
        // Update verification status for this document type
        if (docType === 'onboarding_call') {
            verification.onboarding_call = "true";
        } else {
            verification[docType] = "true";
        }
        console.log('📝 Updated verification:', verification);

        // Update the verification status
        const updateResponse = await fetch('https://backend.bninewdelhi.com/api/update-visitor', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                visitor_id: parseInt(visitorId),
                verification: verification
            })
        });

        if (!updateResponse.ok) {
            throw new Error('Failed to update verification status');
        }

        // Show success message
        await Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Document verified successfully'
        });

        // Refresh the page to show updated verification status
        window.location.reload();

    } catch (error) {
        console.error('❌ Error verifying document:', error);
        Swal.fire({
            icon: 'error',
            title: 'Verification Failed',
            text: error.message || 'Failed to verify document. Please try again.'
            });
        }
}

// Add this function to handle the approval process
async function handleInductionKitApproval(visitorId, chapterId) {
    console.log('------------------------------------------------------');
    console.log('🚀 Starting Induction Kit Approval Process');
    console.log('Visitor ID:', visitorId);
    console.log('Chapter ID:', chapterId);

    try {
        // Fetch chapter requisitions
        const response = await fetch('https://backend.bninewdelhi.com/api/getRequestedChapterRequisition');
        const requisitions = await response.json();
        console.log('------------------------------------------------------');
        console.log('📦 All Requisitions:', requisitions);

        // Find matching requisition
        const requisition = requisitions.find(req => 
            req.visitor_id === visitorId && 
            req.chapter_id === chapterId
        );
        console.log('------------------------------------------------------');
        console.log('🔍 Found Requisition:', requisition);

        if (!requisition) {
            throw new Error('No requisition found for this visitor');
        }

        if (requisition.approve_status !== 'approved') {
            throw new Error('Requisition not yet approved');
        }

        console.log('------------------------------------------------------');
        console.log('✅ Requisition is approved, updating visitor status');

        // Update visitor status
        const updateResponse = await fetch('https://backend.bninewdelhi.com/api/update-visitor', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                visitor_id: visitorId,
                approve_induction_kit: true,
                chapter_apply_kit: 'approved',
                induction_status: 'true'
            })
        });

        if (!updateResponse.ok) {
            throw new Error('Failed to update visitor status');
        }

        console.log('------------------------------------------------------');
        console.log('✨ Visitor status updated successfully');

        // Update UI
        const buttonElement = document.querySelector(`[data-visitor-id="${visitorId}"]`);
        if (buttonElement) {
            buttonElement.innerHTML = `
                <button class="btn btn-success btn-sm" disabled 
                        style="opacity: 0.7; cursor: not-allowed; filter: blur(0.3px); transition: all 0.3s ease;">
                    <i class="ri-checkbox-circle-line me-1"></i> Induction Kit Approved
                </button>
            `;
        }

        Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Induction Kit has been approved successfully.'
        });

    } catch (error) {
        console.error('------------------------------------------------------');
        console.error('❌ Error:', error.message);
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: error.message
        });
    }
}

// Add these functions to handle the updates
async function handleVisitorEntry(visitor) {
    try {
        console.log('🔄 Processing Visitor Entry Update:', visitor);

        // Make API call to update visitor
        const response = await fetch('https://backend.bninewdelhi.com/api/update-visitor', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                visitor_id: visitor.visitor_id,
                visitor_entry_excel: true
            })
        });

        console.log('📡 API Response Status:', response.status);
        const data = await response.json();
        console.log('📦 API Response Data:', data);

        if (!response.ok) {
            throw new Error(data.error || 'Failed to update visitor entry');
        }

        // Update UI
        const entryCell = document.querySelector(`[data-entry-id="${visitor.visitor_id}"]`);
        if (entryCell) {
            entryCell.innerHTML = `
                <button class="btn btn-success btn-sm" disabled style="opacity: 0.7; cursor: not-allowed;">
                    <i class="ri-checkbox-circle-line"></i> Entry Updated
                </button>
            `;
        }

        Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Visitor entry has been updated successfully.'
        });

    } catch (error) {
        console.error('❌ Error updating visitor entry:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: error.message || 'Failed to update visitor entry'
        });
    }
}

async function handleGoogleSheet(visitor) {
    try {
        console.log('🔄 Processing Google Sheet Update:', visitor);

        // Make API call to update visitor
        const response = await fetch('https://backend.bninewdelhi.com/api/update-visitor', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                visitor_id: visitor.visitor_id,
                google_updation_sheet: true
            })
        });

        console.log('📡 API Response Status:', response.status);
        const data = await response.json();
        console.log('📦 API Response Data:', data);

        if (!response.ok) {
            throw new Error(data.error || 'Failed to update Google Sheet status');
        }

        // Update UI
        const sheetCell = document.querySelector(`[data-sheet-id="${visitor.visitor_id}"]`);
        if (sheetCell) {
            sheetCell.innerHTML = `
                <button class="btn btn-success btn-sm" disabled style="opacity: 0.7; cursor: not-allowed;">
                    <i class="ri-checkbox-circle-line"></i> Sheet Updated
                </button>
            `;
        }

        Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Google Sheet has been updated successfully.'
        });

    } catch (error) {
        console.error('❌ Error updating Google Sheet status:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: error.message || 'Failed to update Google Sheet status'
        });
    }
}

// Add the verification handler function
async function handleDocVerification(docType, event, visitorId) {
    try {
        console.log('🔄 Starting document verification process');
        console.log('📄 Document Type:', docType);
        console.log('👤 Visitor ID:', visitorId);

        const result = await Swal.fire({
            title: `Verify ${docType}`,
            text: `Are you sure you want to verify this ${docType}?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#dc2626',
            confirmButtonText: 'Yes, verify it!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            console.log('✅ User confirmed verification');
            
            // Prepare verification object based on document type
            const verificationKey = docType.toLowerCase().replace(/\s+/g, '_');
            const verificationData = {
                [verificationKey]: "true"
            };
            
            console.log('📤 Making API call with data:', {
                visitor_id: visitorId,
                verification: verificationData
            });

            // Make API call to update verification status
            const response = await fetch('https://backend.bninewdelhi.com/api/update-visitor', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    visitor_id: parseInt(visitorId),
                    verification: verificationData
                })
            });

            console.log('📡 API Response Status:', response.status);
            const data = await response.json();
            console.log('📦 API Response Data:', data);

            if (!response.ok) {
                throw new Error(data.error || `Failed to verify ${docType}`);
            }

            // Show success message
            await Swal.fire({
                title: 'Verified!',
                text: `${docType} has been verified successfully.`,
                icon: 'success',
                confirmButtonColor: '#16a34a'
            });

            // Update the badge UI
            console.log('🎨 Updating badge UI');
            const badge = event.target;
            badge.style.backgroundColor = '#dcfce7';
            badge.style.color = '#16a34a';
            badge.style.borderColor = '#86efac';
            badge.textContent = 'Verified';
            
            console.log('✨ Document verification process completed successfully');
        }
    } catch (error) {
        console.error('❌ Error in document verification:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: error.message || `Failed to verify ${docType}. Please try again.`
        });
    }
}

// Add function to handle manual payment
async function handleManualPayment(visitorId) {
    // Redirect to new invoice page with universal id=1
    window.location.href = '/t/new-invoice?id=1';
}

// Add this new function to handle document uploads
async function handleDocUpload(event, docType, visitorId) {
    try {
        console.log('🔄 Starting document upload process');
        console.log('📄 Document Type:', docType);
        console.log('👤 Visitor ID:', visitorId);

        const file = event.target.files[0];
        if (!file) {
            console.log('❌ No file selected');
            return;
        }

        // Show loading state
        Swal.fire({
            title: 'Uploading...',
            text: 'Please wait while we upload your document',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const formData = new FormData();
        
        // Map the document type to the correct field name
        let fieldName;
        switch(docType.toLowerCase()) {
            case 'aadharcard':
                fieldName = 'aadhar_card_img';
                break;
            case 'pancard':
                fieldName = 'pan_card_img';
                break;
            case 'gstcertificate':
                fieldName = 'gst_certificate';
                break;
            default:
                throw new Error('Invalid document type');
        }

        // Add visitor_id to formData
        formData.append('visitor_id', visitorId);
        
        // Add the file with correct field name
        formData.append(fieldName, file);

        console.log('📤 Making API call to update visitor docs');
        console.log('📦 FormData contents:', {
            visitor_id: visitorId,
            fieldName: fieldName,
            fileName: file.name
        });

        const response = await fetch('https://backend.bninewdelhi.com/api/updateVisitorDocs', {
            method: 'PUT',
            body: formData
        });

        console.log('📡 API Response Status:', response.status);
        const data = await response.json();
        console.log('📦 API Response Data:', data);

        if (!response.ok) {
            throw new Error(data.message || 'Failed to upload document');
        }

        // Show success message
        await Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Document uploaded successfully'
        });

        // Refresh the page to show updated documents
        window.location.reload();

    } catch (error) {
        console.error('❌ Error uploading document:', error);
        Swal.fire({
            icon: 'error',
            title: 'Upload Failed',
            text: error.message || 'Failed to upload document. Please try again.'
        });
    }
}

// Add this new function for handling document uploads
async function handleDocumentUpload(event, visitorId, chapterId, documentType, memberId) {
    try {
        console.log('🔄 Starting document upload process');
        console.log('📄 Document Type:', documentType);
        console.log('👤 Visitor ID:', visitorId);
        console.log('🏢 Chapter ID:', chapterId);
        console.log('👥 Member ID:', memberId);

        const file = event.target.files[0];
        if (!file) {
            console.log('❌ No file selected');
            return;
        }

        // Show loading state
        Swal.fire({
            title: 'Uploading...',
            text: 'Please wait while we upload your document',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const formData = new FormData();
        formData.append('document', file);
        formData.append('visitor_id', visitorId);
        formData.append('chapter_id', chapterId);
        formData.append('document_type', documentType);
        formData.append('member_id', memberId);

        console.log('📤 Making API call with data:', {
            visitor_id: visitorId,
            chapter_id: chapterId,
            document_type: documentType,
            member_id: memberId,
            fileName: file.name
        });

        const response = await fetch('https://backend.bninewdelhi.com/api/upload-visitor-document', {
            method: 'POST',
            body: formData
        });

        console.log('📡 API Response Status:', response.status);
        const data = await response.json();
        console.log('📦 API Response Data:', data);

        if (!response.ok) {
            throw new Error(data.message || 'Failed to upload document');
        }

        // Show success message
        await Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Document uploaded successfully'
        });

        // Refresh the page to show updated documents
        window.location.reload();

    } catch (error) {
        console.error('❌ Error uploading document:', error);
        Swal.fire({
            icon: 'error',
            title: 'Upload Failed',
            text: error.message || 'Failed to upload document. Please try again.'
        });
    }
}

// Add this helper function to get file extension
function getFileExtension(filename) {
    console.log('📎 Getting file extension for:', filename);
    if (!filename) {
        console.log('⚠️ No filename provided, using default extension: jpg');
        return 'jpg'; // default extension
    }
    const extension = filename.split('.').pop().toLowerCase();
    console.log('📎 Extracted extension:', extension);
    return extension;
}
