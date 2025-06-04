// API URLs
const REGIONS_API = 'https://backend.bninewdelhi.com/api/regions';
const CHAPTERS_API = 'https://backend.bninewdelhi.com/api/chapters';
const MEMBERS_API = 'https://backend.bninewdelhi.com/api/members';

// DOM Elements
const regionDropdown = document.getElementById('regionDropdown');
const chapterDropdown = document.getElementById('chapterDropdown');
const memberSelect = document.getElementById('company-name');
const rateInput = document.getElementById('rate');
const priceInput = document.getElementById('price');
const taxableTotalInput = document.getElementById('taxable-total-amount');
const includeGstCheckbox = document.getElementById('include-gst');
const cgstInput = document.getElementById('cgst_amount');
const sgstInput = document.getElementById('sgst_amount');
const grandTotalInput = document.getElementById('grand_total');

// Member details fields
const memberAddressInput = document.getElementById('member_address');
const memberCompanyInput = document.getElementById('member_company_name');
const memberPhoneInput = document.getElementById('member_phone_number');
const memberGstInput = document.getElementById('member_gst_number');

// State variables
let selectedRegionId = null;
let selectedChapterId = null;
let visitorFees = 0;
let kittyFees = 0;

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing multiple visitors payment page...');
    // Parse visitorPaymentTemplate from localStorage
    let storedRegionId = null;
    let storedChapterId = null;
    const templateStr = localStorage.getItem('visitorPaymentTemplate');
    if (templateStr) {
        try {
            const templateObj = JSON.parse(templateStr);
            storedRegionId = templateObj.region_id;
            storedChapterId = templateObj.chapter_id;
            console.log('Parsed visitorPaymentTemplate from localStorage:', templateObj);
            console.log('Extracted region_id:', storedRegionId, 'chapter_id:', storedChapterId);
        } catch (e) {
            console.error('Error parsing visitorPaymentTemplate from localStorage:', e);
        }
    } else {
        console.log('No visitorPaymentTemplate found in localStorage.');
    }
    await loadRegions(storedRegionId, storedChapterId);
    setupEventListeners();
    loadStoredVisitors();
});

// Load regions from API
async function loadRegions(regionId = null, chapterId = null) {
    try {
        console.log('Fetching regions from API...');
        const response = await fetch(REGIONS_API);
        const regions = await response.json();
        console.log('Regions fetched:', regions);

        // Clear existing options
        regionDropdown.innerHTML = '';
        
        // Add regions to dropdown
        regions.forEach(region => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.className = 'dropdown-item';
            a.href = '#';
            a.textContent = region.region_name;
            a.dataset.regionId = region.region_id;
            
            a.addEventListener('click', (e) => {
                e.preventDefault();
                selectedRegionId = region.region_id;
                console.log('Selected region:', region.region_name, 'ID:', region.region_id);
                document.getElementById('regionDropdownBtn').textContent = region.region_name;
                loadChapters(region.region_id);
            });
            
            li.appendChild(a);
            regionDropdown.appendChild(li);
        });

        if (regionId) {
            selectedRegionId = regionId;
            console.log('Selected region:', regions.find(r => r.region_id === regionId).region_name, 'ID:', regionId);
            document.getElementById('regionDropdownBtn').textContent = regions.find(r => r.region_id === regionId).region_name;
            loadChapters(regionId);
        }
    } catch (error) {
        console.error('Error loading regions:', error);
    }
}

// Load chapters for selected region
async function loadChapters(regionId) {
    try {
        console.log('Fetching chapters for region ID:', regionId);
        const response = await fetch(CHAPTERS_API);
        const chapters = await response.json();
        console.log('All chapters:', chapters);

        // Filter chapters by region_id
        const regionChapters = chapters.filter(chapter => chapter.region_id === regionId);
        console.log('Filtered chapters for region:', regionChapters);

        // Clear existing options
        chapterDropdown.innerHTML = '';
        
        // Add chapters to dropdown
        regionChapters.forEach(chapter => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.className = 'dropdown-item';
            a.href = '#';
            a.textContent = chapter.chapter_name;
            a.dataset.chapterId = chapter.chapter_id;
            
            a.addEventListener('click', (e) => {
                e.preventDefault();
                selectedChapterId = chapter.chapter_id;
                visitorFees = parseFloat(chapter.chapter_visitor_fees);
                kittyFees = parseFloat(chapter.chapter_kitty_fees);
                console.log('Selected chapter:', chapter.chapter_name, 'ID:', chapter.chapter_id);
                console.log('Visitor fees:', visitorFees);
                console.log('Kitty fees:', kittyFees);
                document.getElementById('chapterDropdownBtn').textContent = chapter.chapter_name;
                updateFees();
                loadMembers(chapter.chapter_id);
            });
            
            li.appendChild(a);
            chapterDropdown.appendChild(li);
        });

        // Check if we have a stored chapter_id and it matches the current region
        const templateStr = localStorage.getItem('visitorPaymentTemplate');
        if (templateStr) {
            try {
                const templateObj = JSON.parse(templateStr);
                const storedChapterId = templateObj.chapter_id;
                if (storedChapterId) {
                    const matchingChapter = regionChapters.find(c => c.chapter_id === storedChapterId);
                    if (matchingChapter) {
                        selectedChapterId = matchingChapter.chapter_id;
                        visitorFees = parseFloat(matchingChapter.chapter_visitor_fees);
                        kittyFees = parseFloat(matchingChapter.chapter_kitty_fees);
                        console.log('Pre-selected chapter:', matchingChapter.chapter_name, 'ID:', matchingChapter.chapter_id);
                        console.log('Visitor fees:', visitorFees);
                        console.log('Kitty fees:', kittyFees);
                        document.getElementById('chapterDropdownBtn').textContent = matchingChapter.chapter_name;
                        updateFees();
                        loadMembers(matchingChapter.chapter_id);
                    }
                }
            } catch (e) {
                console.error('Error parsing visitorPaymentTemplate from localStorage:', e);
            }
        }
    } catch (error) {
        console.error('Error loading chapters:', error);
    }
}

// Load members for selected chapter
async function loadMembers(chapterId) {
    try {
        console.log('Fetching members for chapter ID:', chapterId);
        const response = await fetch(MEMBERS_API);
        const members = await response.json();
        console.log('All members:', members);

        // Filter members by chapter_id
        const chapterMembers = members.filter(member => member.chapter_id === chapterId);
        console.log('Filtered members for chapter:', chapterMembers);

        // Clear existing options
        memberSelect.innerHTML = '<option selected>Select Member</option>';
        
        // Add members to dropdown
        chapterMembers.forEach(member => {
            const option = document.createElement('option');
            option.value = member.member_id;
            option.textContent = `${member.member_first_name} ${member.member_last_name}`;
            option.dataset.member = JSON.stringify(member);
            memberSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading members:', error);
    }
}

// Update fees and calculations
function updateFees() {
    console.log('Updating fees and calculations...');
    
    // Update rate and amount fields
    rateInput.value = kittyFees.toFixed(2);
    priceInput.value = visitorFees.toFixed(2);
    taxableTotalInput.value = visitorFees.toFixed(2);
    
    // Calculate GST if checkbox is checked
    if (includeGstCheckbox.checked) {
        const gstAmount = visitorFees * 0.18;
        const cgstAmount = gstAmount / 2;
        const sgstAmount = gstAmount / 2;
        
        console.log('GST calculations:', {
            totalGST: gstAmount,
            CGST: cgstAmount,
            SGST: sgstAmount
        });
        
        cgstInput.value = cgstAmount.toFixed(2);
        sgstInput.value = sgstAmount.toFixed(2);
        grandTotalInput.value = (visitorFees + gstAmount).toFixed(2);
    } else {
        cgstInput.value = '0.00';
        sgstInput.value = '0.00';
        grandTotalInput.value = visitorFees.toFixed(2);
    }
}

// Setup event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // GST checkbox listener
    includeGstCheckbox.addEventListener('change', () => {
        console.log('GST checkbox changed:', includeGstCheckbox.checked);
        updateFees();
    });

    // Member selection listener
    memberSelect.addEventListener('change', (e) => {
        if (e.target.value) {
            const selectedOption = e.target.options[e.target.selectedIndex];
            const memberData = JSON.parse(selectedOption.dataset.member);
            console.log('Selected member:', memberData);

            // Update member details fields
            memberAddressInput.value = `${memberData.street_address_line_1}, ${memberData.street_address_line_2}, ${memberData.address_city}, ${memberData.address_state} - ${memberData.address_pincode}`;
            memberCompanyInput.value = memberData.member_company_name;
            memberPhoneInput.value = memberData.member_phone_number;
            memberGstInput.value = memberData.member_gst_number;
        } else {
            // Clear fields if no member selected
            memberAddressInput.value = '';
            memberCompanyInput.value = '';
            memberPhoneInput.value = '';
            memberGstInput.value = '';
        }
    });
}

// Add visitor row functionality
document.getElementById('addVisitorBtn').addEventListener('click', async () => {
    console.log('Opening visitor form...');
    
    // Initialize visitors array at the start
    let visitors = [];
    const storedVisitors = localStorage.getItem('visitors');
    if (storedVisitors) {
        visitors = JSON.parse(storedVisitors);
    }
    console.log('Current visitors count:', visitors.length);
    
    // Get members for the selected chapter
    let memberOptions = '<option value="">Select Member</option>';
    if (selectedChapterId) {
        try {
            const response = await fetch(MEMBERS_API);
            const members = await response.json();
            const chapterMembers = members.filter(member => member.chapter_id === selectedChapterId);
            
            chapterMembers.forEach(member => {
                memberOptions += `<option value="${member.member_id}">${member.member_first_name} ${member.member_last_name}</option>`;
            });
        } catch (error) {
            console.error('Error loading members:', error);
        }
    }

    const { value: formValues } = await Swal.fire({
        title: 'Add Visitor',
        html: `
            <div class="visitor-form-container" style="max-width: 600px; margin: 0 auto;">
                <div class="form-section" style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <div class="row g-3">
                        <div class="col-12">
                            <input type="text" id="visitor-name" class="form-control" placeholder="Name" style="border-radius: 8px; border: 1px solid #e0e0e0; padding: 12px;">
                        </div>
                        <div class="col-12">
                            <input type="email" id="visitor-email" class="form-control" placeholder="Email" style="border-radius: 8px; border: 1px solid #e0e0e0; padding: 12px;">
                        </div>
                        <div class="col-12">
                            <input type="tel" id="visitor-mobile" class="form-control" placeholder="Mobile" style="border-radius: 8px; border: 1px solid #e0e0e0; padding: 12px;">
                        </div>
                        <div class="col-12">
                            <textarea id="visitor-address" class="form-control" placeholder="Address" rows="2" style="border-radius: 8px; border: 1px solid #e0e0e0; padding: 12px;"></textarea>
                        </div>
                        <div class="col-12">
                            <input type="text" id="visitor-category" class="form-control" placeholder="Business Category" style="border-radius: 8px; border: 1px solid #e0e0e0; padding: 12px;">
                        </div>
                        <div class="col-12">
                            <input type="text" id="visitor-state" class="form-control" placeholder="Visitor State" style="border-radius: 8px; border: 1px solid #e0e0e0; padding: 12px;">
                        </div>
                        <div class="col-12">
                            <input type="text" id="visitor-pincode" class="form-control" placeholder="Visitor Pincode" style="border-radius: 8px; border: 1px solid #e0e0e0; padding: 12px;">
                        </div>
                        <div class="col-12">
                            <select id="invited-by" class="form-control" style="border-radius: 8px; border: 1px solid #e0e0e0; padding: 12px;">
                                ${memberOptions}
                            </select>
                        </div>
                    </div>
                </div>

                <div class="form-section" style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <div class="row g-3">
                        <div class="col-12">
                            <div class="input-group">
                                <input type="text" id="visitor-gstin" class="form-control" placeholder="GSTIN" style="border-radius: 8px 0 0 8px; border: 1px solid #e0e0e0; padding: 12px;">
                                <button type="button" id="get-gst-details" class="btn btn-primary" style="border-radius: 0 8px 8px 0; padding: 12px 20px;">Get GST Details</button>
                            </div>
                        </div>
                        <div class="col-12">
                            <input type="text" id="company-name" class="form-control" placeholder="Company Name" style="border-radius: 8px; border: 1px solid #e0e0e0; padding: 12px;">
                        </div>
                        <div class="col-12">
                            <textarea id="company-address" class="form-control" placeholder="Company Address" rows="2" style="border-radius: 8px; border: 1px solid #e0e0e0; padding: 12px;"></textarea>
                        </div>
                    </div>
                </div>

                <div class="form-section" style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
                    <div class="row g-3">
                        <div class="col-12">
                            <input type="datetime-local" id="date-issued" class="form-control" value="${new Date().toISOString().slice(0, 16)}" style="border-radius: 8px; border: 1px solid #e0e0e0; padding: 12px;">
                        </div>
                        <div class="col-12">
                            <select id="payment-mode" class="form-control" style="border-radius: 8px; border: 1px solid #e0e0e0; padding: 12px;">
                                <option value="cash">Cash</option>
                                <option value="upi">UPI</option>
                                <option value="net-banking">Net Banking</option>
                            </select>
                        </div>
                        <div id="upi-fields" class="col-12" style="display: none;">
                            <input type="text" id="upi-id" class="form-control" placeholder="Enter UPI ID" style="border-radius: 8px; border: 1px solid #e0e0e0; padding: 12px;">
                        </div>
                        <div id="net-banking-fields" class="col-12" style="display: none;">
                            <input type="text" id="ifsc-code" class="form-control mb-2" placeholder="IFSC Code" style="border-radius: 8px; border: 1px solid #e0e0e0; padding: 12px;">
                            <input type="text" id="bank-name" class="form-control" placeholder="Bank Name" style="border-radius: 8px; border: 1px solid #e0e0e0; padding: 12px;">
                        </div>
                        <div class="col-12">
                            <div class="form-check" style="margin-top: 10px;">
                                <input type="checkbox" id="include-gst" class="form-check-input">
                                <label class="form-check-label" for="include-gst">Include GST</label>
                            </div>
                        </div>
                        <div class="col-12">
                            <div class="alert alert-info" style="border-radius: 8px; margin-top: 15px;">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span>Base Amount:</span>
                                    <span id="base-amount" style="font-weight: 600;">${visitorFees.toFixed(2)}</span>
                                </div>
                                <div class="d-flex justify-content-between align-items-center mt-2">
                                    <span>GST Amount:</span>
                                    <span id="gst-amount" style="font-weight: 600;">0.00</span>
                                </div>
                                <div class="d-flex justify-content-between align-items-center mt-2">
                                    <span>Final Amount:</span>
                                    <span id="final-amount" style="font-weight: 600;">${visitorFees.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Add Visitor',
        cancelButtonText: 'Cancel',
        focusConfirm: false,
        customClass: {
            popup: 'animated fadeInDown',
            confirmButton: 'btn btn-primary',
            cancelButton: 'btn btn-light'
        },
        buttonsStyling: true,
        showClass: {
            popup: 'animate__animated animate__fadeInDown animate__faster'
        },
        hideClass: {
            popup: 'animate__animated animate__fadeOutUp animate__faster'
        },
        didOpen: () => {
            const modal = Swal.getPopup();
            const paymentMode = modal.querySelector('#payment-mode');
            const upiFields = modal.querySelector('#upi-fields');
            const netBankingFields = modal.querySelector('#net-banking-fields');
            const includeGst = modal.querySelector('#include-gst');
            const baseAmount = modal.querySelector('#base-amount');
            const gstAmount = modal.querySelector('#gst-amount');
            const finalAmount = modal.querySelector('#final-amount');

            // Add GST details fetch functionality
            const getGstDetailsBtn = modal.querySelector('#get-gst-details');
            const gstInput = modal.querySelector('#visitor-gstin');
            const companyNameInput = modal.querySelector('#company-name');
            const companyAddressInput = modal.querySelector('#company-address');

            getGstDetailsBtn.addEventListener('click', async () => {
                const gstNumber = gstInput.value.trim();
                if (!gstNumber) {
                    toast.error('Please enter GST number');
                    return;
                }

                try {
                    getGstDetailsBtn.disabled = true;
                    getGstDetailsBtn.innerHTML = 'Fetching...';
                    
                    const response = await fetch(`https://backend.bninewdelhi.com/einvoice/get-gst-details/${gstNumber}`);
                    const data = await response.json();
                    console.log('GST API Response:', data);

                    if (data.success && data.extractedDetails) {
                        // Auto-fill company details
                        companyNameInput.value = data.extractedDetails.legalName || data.extractedDetails.tradeName || '';
                        companyAddressInput.value = data.extractedDetails.address || '';
                        console.log('Filled values:', {
                            companyName: companyNameInput.value,
                            companyAddress: companyAddressInput.value
                        });
                        toast.success('GST details fetched successfully');
                    } else {
                        toast.error(data.message || 'Failed to fetch GST details');
                    }
                } catch (error) {
                    console.error('Error fetching GST details:', error);
                    toast.error('Error fetching GST details');
                } finally {
                    getGstDetailsBtn.disabled = false;
                    getGstDetailsBtn.innerHTML = 'Get GST Details';
                }
            });

            function updateGstAndFinal() {
                const base = visitorFees;
                const gst = includeGst && includeGst.checked ? base * 0.18 : 0;
                const final = base + gst;
                console.log('[GST DEBUG] Checkbox checked:', includeGst ? includeGst.checked : 'N/A');
                console.log('[GST DEBUG] Base:', base, 'GST:', gst, 'Final:', final);
                gstAmount.textContent = gst.toFixed(2);
                finalAmount.textContent = final.toFixed(2);
            }

            // Always set base amount to visitorFees
            baseAmount.textContent = visitorFees.toFixed(2);
            updateGstAndFinal();

            if (paymentMode) {
                paymentMode.addEventListener('change', (e) => {
                    upiFields.style.display = e.target.value === 'upi' ? 'block' : 'none';
                    netBankingFields.style.display = e.target.value === 'net-banking' ? 'block' : 'none';
                });
            }

            function attachGstHandler() {
                const includeGstNow = modal.querySelector('#include-gst');
                if (includeGstNow) {
                    includeGstNow.onchange = () => {
                        console.log('[GST DEBUG] Include GST checkbox toggled');
                        updateGstAndFinal();
                    };
                }
            }
            attachGstHandler();

            // MutationObserver to re-attach GST handler if modal content changes
            const observer = new MutationObserver(() => {
                attachGstHandler();
            });
            observer.observe(modal, { childList: true, subtree: true });
        },
        preConfirm: () => {
            const popup = Swal.getPopup();
            // Log all form values for debugging
            const name = popup.querySelector('#visitor-name').value;
            const email = popup.querySelector('#visitor-email').value;
            const mobile = popup.querySelector('#visitor-mobile').value;
            const paymentMode = popup.querySelector('#payment-mode').value;
            const upiId = popup.querySelector('#upi-id').value;
            const ifscCode = popup.querySelector('#ifsc-code').value;
            const bankName = popup.querySelector('#bank-name').value;
            const dateIssued = popup.querySelector('#date-issued').value;
            const invitedBySelect = popup.querySelector('#invited-by');
            const invitedBy = invitedBySelect.value || null;
            const invitedByName = invitedBySelect.options[invitedBySelect.selectedIndex]?.text || 'BNI';

            console.log('Form Values Check:', {
                name,
                email,
                mobile,
                dateIssued,
                paymentMode,
                hasUpiId: !!upiId,
                hasIfscCode: !!ifscCode,
                hasBankName: !!bankName
            });

            // Log validation status
            console.log('Validation Status:', {
                hasName: !!name,
                hasEmail: !!email,
                hasMobile: !!mobile,
                hasDateIssued: !!dateIssued,
                paymentMode,
                hasUpiId: !!upiId,
                hasIfscCode: !!ifscCode,
                hasBankName: !!bankName
            });

            // More lenient validation - only check name and mobile
            if (!name || !mobile) {
                console.log('Validation failed: Missing required fields');
                Swal.showValidationMessage('Please enter at least name and mobile number');
                return false;
            }

            // Payment mode specific validation
            if (paymentMode === 'upi' && !upiId) {
                console.log('Validation failed: Missing UPI ID');
                Swal.showValidationMessage('Please enter UPI ID for UPI payment');
                return false;
            }

            if (paymentMode === 'net-banking' && (!ifscCode || !bankName)) {
                console.log('Validation failed: Missing bank details');
                Swal.showValidationMessage('Please enter IFSC code and bank name for net banking');
                return false;
            }

            // If we get here, validation passed
            console.log('Validation passed, returning form values');
            return {
                name,
                email: email || 'N/A',
                mobile,
                address: popup.querySelector('#visitor-address').value || 'N/A',
                category: popup.querySelector('#visitor-category').value || 'N/A',
                state: popup.querySelector('#visitor-state').value || 'N/A',
                pincode: popup.querySelector('#visitor-pincode').value || 'N/A',
                invitedBy: invitedBy,
                invitedByName: invitedByName,
                gstin: popup.querySelector('#visitor-gstin').value || 'N/A',
                companyName: popup.querySelector('#company-name').value || 'N/A',
                companyAddress: popup.querySelector('#company-address').value || 'N/A',
                dateIssued: dateIssued || new Date().toISOString(),
                paymentMode,
                upiId: upiId || 'N/A',
                ifscCode: ifscCode || 'N/A',
                bankName: bankName || 'N/A',
                includeGst: popup.querySelector('#include-gst').checked,
                baseAmount: parseFloat(popup.querySelector('#base-amount').textContent),
                gstAmount: parseFloat(popup.querySelector('#gst-amount').textContent),
                finalAmount: parseFloat(popup.querySelector('#final-amount').textContent)
            };
        }
    });

    if (formValues) {
        console.log('Form submitted successfully with values:', formValues);
        
        // Add new row to table
        const tbody = document.getElementById('visitorsTableBody');
        const newRow = document.createElement('tr');
        
        // Create table cells in exact order matching the EJS table headers
        newRow.innerHTML = `
            <td>${formValues.name}</td>
            <td>${formValues.email}</td>
            <td>${formValues.mobile}</td>
            <td>${formValues.address}</td>
            <td>${formValues.category}</td>
            <td>${formValues.state}</td>
            <td>${formValues.pincode}</td>
            <td>${formValues.invitedByName}</td>
            <td>${formValues.gstin}</td>
            <td>${formValues.companyName}</td>
            <td>${formValues.companyAddress}</td>
            <td>${formValues.paymentMode}</td>
            <td>${new Date(formValues.dateIssued).toLocaleString()}</td>
            <td>${formValues.includeGst ? 'Yes' : 'No'}</td>
            <td>${formValues.gstAmount.toFixed(2)}</td>
            <td>${formValues.finalAmount.toFixed(2)}</td>
            <td>
                <button type="button" class="btn btn-primary btn-sm edit-visitor me-1" data-index="${visitors.length}">
                    <i class="ti ti-edit"></i>
                </button>
                <button type="button" class="btn btn-danger btn-sm delete-visitor">
                    <i class="ti ti-trash"></i>
                </button>
            </td>
        `;

        // Add the new row to the table
        tbody.appendChild(newRow);

        // Add new visitor to array and update localStorage
        visitors.push(formValues);
        localStorage.setItem('visitors', JSON.stringify(visitors));

        // Show success message
        Swal.fire({
            title: 'Success!',
            text: 'Visitor added successfully',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });
    }
});

// Add edit visitor functionality
document.addEventListener('click', async (e) => {
    if (e.target.closest('.edit-visitor')) {
        const row = e.target.closest('tr');
        const rowIndex = Array.from(row.parentNode.children).indexOf(row);
        
        // Get visitor data from localStorage
        const storedVisitors = localStorage.getItem('visitors');
        if (!storedVisitors) return;
        
        const visitors = JSON.parse(storedVisitors);
        const visitor = visitors[rowIndex];
        
        // Get members for the selected chapter
        let memberOptions = '<option value="">Select Member</option>';
        if (selectedChapterId) {
            try {
                console.log('Fetching members for edit form...');
                const response = await fetch(MEMBERS_API);
                const members = await response.json();
                const chapterMembers = members.filter(member => member.chapter_id === selectedChapterId);
                console.log('Found chapter members:', chapterMembers.length);
                
                chapterMembers.forEach(member => {
                    const selected = member.member_id === visitor.invitedBy ? 'selected' : '';
                    memberOptions += `<option value="${member.member_id}" ${selected}>${member.member_first_name} ${member.member_last_name}</option>`;
                });
                console.log('Member options generated with selected member:', visitor.invitedBy);
            } catch (error) {
                console.error('Error loading members for edit form:', error);
            }
        }

        const { value: formValues } = await Swal.fire({
            title: 'Edit Visitor',
            html: `
                <div class="visitor-form-container" style="max-width: 600px; margin: 0 auto;">
                    <div class="form-section" style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                        <div class="row g-3">
                            <div class="col-12">
                                <input type="text" id="visitor-name" class="form-control" placeholder="Name" value="${visitor.name}" style="border-radius: 8px; border: 1px solid #e0e0e0; padding: 12px;">
                            </div>
                            <div class="col-12">
                                <input type="email" id="visitor-email" class="form-control" placeholder="Email" value="${visitor.email}" style="border-radius: 8px; border: 1px solid #e0e0e0; padding: 12px;">
                            </div>
                            <div class="col-12">
                                <input type="tel" id="visitor-mobile" class="form-control" placeholder="Mobile" value="${visitor.mobile}" style="border-radius: 8px; border: 1px solid #e0e0e0; padding: 12px;">
                            </div>
                            <div class="col-12">
                                <textarea id="visitor-address" class="form-control" placeholder="Address" rows="2" style="border-radius: 8px; border: 1px solid #e0e0e0; padding: 12px;">${visitor.address}</textarea>
                            </div>
                            <div class="col-12">
                                <input type="text" id="visitor-category" class="form-control" placeholder="Business Category" value="${visitor.category}" style="border-radius: 8px; border: 1px solid #e0e0e0; padding: 12px;">
                            </div>
                            <div class="col-12">
                                <input type="text" id="visitor-state" class="form-control" placeholder="Visitor State" value="${visitor.state}" style="border-radius: 8px; border: 1px solid #e0e0e0; padding: 12px;">
                            </div>
                            <div class="col-12">
                                <input type="text" id="visitor-pincode" class="form-control" placeholder="Visitor Pincode" value="${visitor.pincode}" style="border-radius: 8px; border: 1px solid #e0e0e0; padding: 12px;">
                            </div>
                            <div class="col-12">
                                <select id="invited-by" class="form-control" style="border-radius: 8px; border: 1px solid #e0e0e0; padding: 12px;">
                                    ${memberOptions}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="form-section" style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                        <div class="row g-3">
                            <div class="col-12">
                                <div class="input-group">
                                    <input type="text" id="visitor-gstin" class="form-control" placeholder="GSTIN" value="${visitor.gstin}" style="border-radius: 8px 0 0 8px; border: 1px solid #e0e0e0; padding: 12px;">
                                    <button type="button" id="get-gst-details" class="btn btn-primary" style="border-radius: 0 8px 8px 0; padding: 12px 20px;">Get GST Details</button>
                                </div>
                            </div>
                            <div class="col-12">
                                <input type="text" id="company-name" class="form-control" placeholder="Company Name" value="${visitor.companyName}" style="border-radius: 8px; border: 1px solid #e0e0e0; padding: 12px;">
                            </div>
                            <div class="col-12">
                                <textarea id="company-address" class="form-control" placeholder="Company Address" rows="2" style="border-radius: 8px; border: 1px solid #e0e0e0; padding: 12px;">${visitor.companyAddress}</textarea>
                            </div>
                        </div>
                    </div>

                    <div class="form-section" style="background: #f8f9fa; padding: 20px; border-radius: 10px;">
                        <div class="row g-3">
                            <div class="col-12">
                                <input type="datetime-local" id="date-issued" class="form-control" value="${visitor.dateIssued.slice(0, 16)}" style="border-radius: 8px; border: 1px solid #e0e0e0; padding: 12px;">
                            </div>
                            <div class="col-12">
                                <select id="payment-mode" class="form-control" style="border-radius: 8px; border: 1px solid #e0e0e0; padding: 12px;">
                                    <option value="cash" ${visitor.paymentMode === 'cash' ? 'selected' : ''}>Cash</option>
                                    <option value="upi" ${visitor.paymentMode === 'upi' ? 'selected' : ''}>UPI</option>
                                    <option value="net-banking" ${visitor.paymentMode === 'net-banking' ? 'selected' : ''}>Net Banking</option>
                                </select>
                            </div>
                            <div id="upi-fields" class="col-12" style="display: ${visitor.paymentMode === 'upi' ? 'block' : 'none'};">
                                <input type="text" id="upi-id" class="form-control" placeholder="Enter UPI ID" value="${visitor.upiId}" style="border-radius: 8px; border: 1px solid #e0e0e0; padding: 12px;">
                            </div>
                            <div id="net-banking-fields" class="col-12" style="display: ${visitor.paymentMode === 'net-banking' ? 'block' : 'none'};">
                                <input type="text" id="ifsc-code" class="form-control mb-2" placeholder="IFSC Code" value="${visitor.ifscCode}" style="border-radius: 8px; border: 1px solid #e0e0e0; padding: 12px;">
                                <input type="text" id="bank-name" class="form-control" placeholder="Bank Name" value="${visitor.bankName}" style="border-radius: 8px; border: 1px solid #e0e0e0; padding: 12px;">
                            </div>
                            <div class="col-12">
                                <div class="form-check" style="margin-top: 10px;">
                                    <input type="checkbox" id="include-gst" class="form-check-input" ${visitor.includeGst ? 'checked' : ''}>
                                    <label class="form-check-label" for="include-gst">Include GST</label>
                                </div>
                            </div>
                            <div class="col-12">
                                <div class="alert alert-info" style="border-radius: 8px; margin-top: 15px;">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <span>Base Amount:</span>
                                        <span id="base-amount" style="font-weight: 600;">${visitor.baseAmount.toFixed(2)}</span>
                                    </div>
                                    <div class="d-flex justify-content-between align-items-center mt-2">
                                        <span>GST Amount:</span>
                                        <span id="gst-amount" style="font-weight: 600;">${visitor.gstAmount.toFixed(2)}</span>
                                    </div>
                                    <div class="d-flex justify-content-between align-items-center mt-2">
                                        <span>Final Amount:</span>
                                        <span id="final-amount" style="font-weight: 600;">${visitor.finalAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Save Changes',
            cancelButtonText: 'Cancel',
            focusConfirm: false,
            customClass: {
                popup: 'animated fadeInDown',
                confirmButton: 'btn btn-primary',
                cancelButton: 'btn btn-light'
            },
            buttonsStyling: true,
            showClass: {
                popup: 'animate__animated animate__fadeInDown animate__faster'
            },
            hideClass: {
                popup: 'animate__animated animate__fadeOutUp animate__faster'
            },
            didOpen: () => {
                const modal = Swal.getPopup();
                const paymentMode = modal.querySelector('#payment-mode');
                const upiFields = modal.querySelector('#upi-fields');
                const netBankingFields = modal.querySelector('#net-banking-fields');

                if (paymentMode) {
                    paymentMode.addEventListener('change', (e) => {
                        upiFields.style.display = e.target.value === 'upi' ? 'block' : 'none';
                        netBankingFields.style.display = e.target.value === 'net-banking' ? 'block' : 'none';
                    });
                }

                // Add GST details fetch functionality
                const getGstDetailsBtn = modal.querySelector('#get-gst-details');
                const gstInput = modal.querySelector('#visitor-gstin');
                const companyNameInput = modal.querySelector('#company-name');
                const companyAddressInput = modal.querySelector('#company-address');

                getGstDetailsBtn.addEventListener('click', async () => {
                    const gstNumber = gstInput.value.trim();
                    if (!gstNumber) {
                        toast.error('Please enter GST number');
                        return;
                    }

                    try {
                        getGstDetailsBtn.disabled = true;
                        getGstDetailsBtn.innerHTML = 'Fetching...';
                        
                        const response = await fetch(`https://backend.bninewdelhi.com/einvoice/get-gst-details/${gstNumber}`);
                        const data = await response.json();
                        console.log('GST API Response:', data);

                        if (data.success && data.extractedDetails) {
                            companyNameInput.value = data.extractedDetails.legalName || data.extractedDetails.tradeName || '';
                            companyAddressInput.value = data.extractedDetails.address || '';
                            toast.success('GST details fetched successfully');
                        } else {
                            toast.error(data.message || 'Failed to fetch GST details');
                        }
                    } catch (error) {
                        console.error('Error fetching GST details:', error);
                        toast.error('Error fetching GST details');
                    } finally {
                        getGstDetailsBtn.disabled = false;
                        getGstDetailsBtn.innerHTML = 'Get GST Details';
                    }
                });
            },
            preConfirm: () => {
                const popup = Swal.getPopup();
                const name = popup.querySelector('#visitor-name').value;
                const email = popup.querySelector('#visitor-email').value;
                const mobile = popup.querySelector('#visitor-mobile').value;
                const paymentMode = popup.querySelector('#payment-mode').value;
                const upiId = popup.querySelector('#upi-id').value;
                const ifscCode = popup.querySelector('#ifsc-code').value;
                const bankName = popup.querySelector('#bank-name').value;
                const dateIssued = popup.querySelector('#date-issued').value;
                const invitedBySelect = popup.querySelector('#invited-by');
                const invitedBy = invitedBySelect.value || null;
                const invitedByName = invitedBySelect.options[invitedBySelect.selectedIndex]?.text || 'BNI';

                console.log('Edit form values:', {
                    invitedBy,
                    invitedByName,
                    selectedIndex: invitedBySelect.selectedIndex,
                    options: Array.from(invitedBySelect.options).map(opt => ({
                        value: opt.value,
                        text: opt.text,
                        selected: opt.selected
                    }))
                });

                if (!name || !mobile) {
                    Swal.showValidationMessage('Please enter at least name and mobile number');
                    return false;
                }

                if (paymentMode === 'upi' && !upiId) {
                    Swal.showValidationMessage('Please enter UPI ID for UPI payment');
                    return false;
                }

                if (paymentMode === 'net-banking' && (!ifscCode || !bankName)) {
                    Swal.showValidationMessage('Please enter IFSC code and bank name for net banking');
                    return false;
                }

                return {
                    name,
                    email: email || 'N/A',
                    mobile,
                    address: popup.querySelector('#visitor-address').value || 'N/A',
                    category: popup.querySelector('#visitor-category').value || 'N/A',
                    state: popup.querySelector('#visitor-state').value || 'N/A',
                    pincode: popup.querySelector('#visitor-pincode').value || 'N/A',
                    invitedBy: invitedBy,
                    invitedByName: invitedByName,
                    gstin: popup.querySelector('#visitor-gstin').value || 'N/A',
                    companyName: popup.querySelector('#company-name').value || 'N/A',
                    companyAddress: popup.querySelector('#company-address').value || 'N/A',
                    dateIssued: dateIssued || new Date().toISOString(),
                    paymentMode,
                    upiId: upiId || 'N/A',
                    ifscCode: ifscCode || 'N/A',
                    bankName: bankName || 'N/A',
                    includeGst: popup.querySelector('#include-gst').checked,
                    baseAmount: parseFloat(popup.querySelector('#base-amount').textContent),
                    gstAmount: parseFloat(popup.querySelector('#gst-amount').textContent),
                    finalAmount: parseFloat(popup.querySelector('#final-amount').textContent)
                };
            }
        });

        if (formValues) {
            console.log('Updated form values:', formValues);
            // Update the row in the table
            row.innerHTML = `
                <td>${formValues.name}</td>
                <td>${formValues.email}</td>
                <td>${formValues.mobile}</td>
                <td>${formValues.address}</td>
                <td>${formValues.category}</td>
                <td>${formValues.state}</td>
                <td>${formValues.pincode}</td>
                <td>${formValues.invitedByName}</td>
                <td>${formValues.gstin}</td>
                <td>${formValues.companyName}</td>
                <td>${formValues.companyAddress}</td>
                <td>${formValues.paymentMode}</td>
                <td>${new Date(formValues.dateIssued).toLocaleString()}</td>
                <td>${formValues.includeGst ? 'Yes' : 'No'}</td>
                <td>${formValues.gstAmount.toFixed(2)}</td>
                <td>${formValues.finalAmount.toFixed(2)}</td>
                <td>
                    <button type="button" class="btn btn-primary btn-sm edit-visitor me-1" data-index="${rowIndex}">
                        <i class="ti ti-edit"></i>
                    </button>
                    <button type="button" class="btn btn-danger btn-sm delete-visitor">
                        <i class="ti ti-trash"></i>
                    </button>
                </td>
            `;

            // Update localStorage
            visitors[rowIndex] = formValues;
            localStorage.setItem('visitors', JSON.stringify(visitors));

            // Show success message
            Swal.fire({
                title: 'Success!',
                text: 'Visitor updated successfully',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        }
    }
});

// Delete visitor row functionality
document.addEventListener('click', (e) => {
    if (e.target.closest('.delete-visitor')) {
        console.log('Deleting visitor row...');
        const row = e.target.closest('tr');
        const rowIndex = Array.from(row.parentNode.children).indexOf(row);
        
        // Remove from localStorage
        const storedVisitors = localStorage.getItem('visitors');
        if (storedVisitors) {
            let visitors = JSON.parse(storedVisitors);
            visitors.splice(rowIndex, 1);
            localStorage.setItem('visitors', JSON.stringify(visitors));
        }
        
        // Remove from table
        row.remove();
        
        // Show success message
        Swal.fire({
            title: 'Deleted!',
            text: 'Visitor has been removed',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        });
    }
});

// Add this new function to load stored visitors
function loadStoredVisitors() {
    const storedVisitors = localStorage.getItem('visitors');
    if (storedVisitors) {
        try {
            const visitors = JSON.parse(storedVisitors);
            const tbody = document.getElementById('visitorsTableBody');
            if (!tbody) {
                console.error('Visitors table body not found');
                return;
            }
            tbody.innerHTML = ''; // Clear existing rows
            
            visitors.forEach((visitor, index) => {
                const newRow = document.createElement('tr');
                newRow.innerHTML = `
                    <td>${visitor.name}</td>
                    <td>${visitor.email}</td>
                    <td>${visitor.mobile}</td>
                    <td>${visitor.address}</td>
                    <td>${visitor.category}</td>
                    <td>${visitor.state}</td>
                    <td>${visitor.pincode}</td>
                    <td>${visitor.invitedByName}</td>
                    <td>${visitor.gstin}</td>
                    <td>${visitor.companyName}</td>
                    <td>${visitor.companyAddress}</td>
                    <td>${visitor.paymentMode}</td>
                    <td>${new Date(visitor.dateIssued).toLocaleString()}</td>
                    <td>${visitor.includeGst ? 'Yes' : 'No'}</td>
                    <td>${visitor.gstAmount.toFixed(2)}</td>
                    <td>${visitor.finalAmount.toFixed(2)}</td>
                    <td>
                        <button type="button" class="btn btn-primary btn-sm edit-visitor me-1" data-index="${index}">
                            <i class="ti ti-edit"></i>
                        </button>
                        <button type="button" class="btn btn-danger btn-sm delete-visitor">
                            <i class="ti ti-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(newRow);
            });
        } catch (e) {
            console.error('Error loading stored visitors:', e);
        }
    }
}

// Add submit invoice button click handler
document.getElementById('submit_invoice').addEventListener('click', async () => {
    console.log('Submit invoice button clicked');
    
    // Get all visitors from localStorage
    const storedVisitors = localStorage.getItem('visitors');
    if (!storedVisitors) {
        toast.error('No visitors added. Please add at least one visitor.');
        
        return;
    }

    const visitors = JSON.parse(storedVisitors);
    console.log('Stored visitors:', visitors);

    // Get common data
    const regionId = selectedRegionId;
    const chapterId = selectedChapterId;

    if (!regionId || !chapterId) {
        toast.error('Please select both region and chapter');
        return;
    }

    // Function to format payment method based on mode
    const formatPaymentMethod = (visitor) => {
        switch(visitor.paymentMode) {
            case 'upi':
                return {
                    upi: {
                        upi_id: visitor.upiId,
                        channel: "collect"
                    }
                };
            case 'net-banking':
                return {
                    netbanking: {
                        bank: visitor.bankName,
                        ifsc: visitor.ifscCode
                    }
                };
            case 'cash':
            default:
                return {
                    cash: {
                        payment_note: "Cash"
                    }
                };
        }
    };

    // Prepare data for API
    const requestData = {
        region_id: regionId,
        chapter_id: chapterId,
        universal_link_id: 5, // Set to 5 for now
        visitors: visitors.map(visitor => ({
            // Visitor basic info
            visitor_name: visitor.name,
            visitor_email: visitor.email,
            visitor_mobile: visitor.mobile,
            visitor_address: visitor.address,
            visitor_category: visitor.category,
            visitor_state: visitor.state,
            visitor_pincode: visitor.pincode,
            visitor_gstin: visitor.gstin,
            visitor_company: visitor.companyName,
            visitor_company_address: visitor.companyAddress,
            visitor_business_category: visitor.category,

            // Payment related
            date_issued: visitor.dateIssued,
            mode_of_payment: formatPaymentMethod(visitor),
            include_gst: visitor.includeGst,
            base_amount: visitor.baseAmount,
            gst_amount: visitor.gstAmount,
            final_amount: visitor.finalAmount,
            taxable_amount: visitor.finalAmount,
            total_amount: visitor.baseAmount,

            // Member related - Fixed to handle null/undefined cases
            member_id: visitor.invitedBy === "N/A" || !visitor.invitedBy ? null : visitor.invitedBy,
            member_name: visitor.invitedByName === "Select Member" || !visitor.invitedByName ? "BNI" : visitor.invitedByName,

            // Additional required fields
            payment_gateway_id: null,
            order_currency: "INR",
            payment_currency: "INR",
            payment_status: "SUCCESS",
            payment_note: "Visitor Payment",
            error_details: {}
        }))
    };

    // Log the complete request data
    console.log('Request data to be sent:', requestData);

    // Show confirmation dialog
    const result = await Swal.fire({
        title: 'Confirm Multiple Visitor Payment',
        text: `Are you sure you want to process payment for ${visitors.length} visitor(s)?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, proceed',
        cancelButtonText: 'No, cancel',
        confirmButtonColor: '#6259ca',
        cancelButtonColor: '#d33'
    });

    if (result.isConfirmed) {
        try {
            // Make the API call to backend
            const response = await fetch('https://backend.bninewdelhi.com/api/addMultipleVisitorPayment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            const result = await response.json();
            
            if (result.success) {
                toast.success('Payment processed successfully!');
                console.log('API Response:', result);
                
                // Clear localStorage after successful submission
                localStorage.removeItem('visitors');
                
                // Reload the page after successful submission
                window.location.reload();
            } else {
                toast.error(result.message || 'Error processing payment');
                console.error('API Error:', result);
            }
        } catch (error) {
            console.error('Error processing payment:', error);
            toast.error('Error processing payment. Please try again.');
        }
    }
});
