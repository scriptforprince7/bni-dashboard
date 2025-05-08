// Debug flag

// Function to show the loader

function showLoader() {
    document.getElementById('loader').style.display = 'flex'; // Show loader
  }
  
  // Function to hide the loader
  function hideLoader() {
    document.getElementById('loader').style.display = 'none'; // Hide loader
  }
const DEBUG = true;

// Debug logging function
function debugLog(message, data = null) {
    if (DEBUG) {
        console.log(`[DEBUG] ${message}`);
        if (data) console.log(data);
    }
}

// Add these variables at the top of your file
let selectedMonth = null;
let memberOriginalAccolades = []; // Store only member's original accolades

// Function to format date as MMM-YYYY
function formatMonthYear(date) {
    const d = new Date(date);
    return `${d.toLocaleString('default', { month: 'short' })}-${d.getFullYear()}`;
}

// Function to format date as MM/DD/YYYY
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1; // getMonth() returns 0-11
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
}

// Function to populate month filter
function populateMonthFilter(memberAccolades) {
    const monthSet = new Set();
    const monthFilterEl = document.getElementById('month-filter');
    
    memberAccolades.forEach(accolade => {
        if (accolade.accolade_publish_date) {
            monthSet.add(formatMonthYear(accolade.accolade_publish_date));
        }
    });

    const sortedMonths = Array.from(monthSet).sort((a, b) => {
        const [monthA, yearA] = a.split('-');
        const [monthB, yearB] = b.split('-');
        return new Date(`${monthA} ${yearA}`) - new Date(`${monthB} ${yearB}`);
    });

    monthFilterEl.innerHTML = sortedMonths.map(month => `
        <li>
            <a class="dropdown-item" href="javascript:void(0);" data-month="${month}">
                ${month}
            </a>
        </li>
    `).join('');

    // Add click handlers for filter items
    monthFilterEl.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            selectedMonth = item.dataset.month;
            document.querySelector('.dropdown-toggle').textContent = selectedMonth;
            document.getElementById('applyFilter').style.display = 'inline-block';
            document.getElementById('resetFilter').style.display = 'inline-block';
        });
    });
}

// Function to apply filter
function applyFilter() {
    if (!selectedMonth) return;

    const filteredAccolades = memberOriginalAccolades.filter(accolade => 
        formatMonthYear(accolade.accolade_publish_date) === selectedMonth
    );
    populateAccoladesTable(filteredAccolades);
}

// Function to reset filter
function resetFilter() {
    selectedMonth = null;
    document.querySelector('.dropdown-toggle').textContent = 'Select Month';
    document.getElementById('applyFilter').style.display = 'none';
    document.getElementById('resetFilter').style.display = 'none';
    populateAccoladesTable(memberOriginalAccolades); // Reset to member's original accolades
}

// At the top of your file, before any Cashfree usage


async function fetchMemberData() {
    try {
        showLoader();
        
        // Step 1: Get member_id from localStorage or token
        let member_id = localStorage.getItem('current_member_id');
        const loginType = getUserLoginType();
        
        console.log('=== Starting Member Accolades ===');
        console.log('Initial check:', { member_id, loginType });

        // If no member_id in localStorage and not ro_admin, get from token
        if (!member_id && loginType !== 'ro_admin') {
            const userEmail = getUserEmail();
            const membersResponse = await fetch('http://backend.bninewdelhi.com/api/members');
            const membersData = await membersResponse.json();
            const member = membersData.find(m => m.member_email_address === userEmail);
            member_id = member?.member_id;
        }

        if (!member_id) {
            throw new Error('No member ID found');
        }

        // Step 2: Fetch member accolades and all accolades in parallel
        const [memberAccoladesResponse, accoladesResponse] = await Promise.all([
            fetch('http://backend.bninewdelhi.com/api/getAllMemberAccolades'),
            fetch('http://backend.bninewdelhi.com/api/accolades')
        ]);

        const [memberAccoladesData, accoladesData] = await Promise.all([
            memberAccoladesResponse.json(),
            accoladesResponse.json()
        ]);

        console.log('📊 Fetched Data:', {
            memberAccolades: memberAccoladesData.length,
            accolades: accoladesData.length
        });

        // Step 3: Filter accolades for current member and map with details
        const memberAccolades = memberAccoladesData
            .filter(ma => ma.member_id === parseInt(member_id))
            .map(ma => {
                const accoladeDetails = accoladesData.find(a => a.accolade_id === ma.accolade_id);
                if (accoladeDetails) {
                    return {
                        ...accoladeDetails,
                        accolade_publish_date: formatDate(ma.issue_date),
                        accolade_given_date: formatDate(ma.given_date),
                        count: ma.count,
                        comment: ma.comment
                    };
                }
                return null;
            })
            .filter(Boolean); // Remove any null values

        console.log(`📚 Total accolades processed: ${memberAccolades.length}`, memberAccolades);

        // Store and populate
        memberOriginalAccolades = memberAccolades;
        populateMonthFilter(memberAccolades);
        populateAccoladesTable(memberAccolades);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        hideLoader();
    }
}

function populateAccoladesTable(accolades) {
    const tableBody = document.querySelector('.chaptersTableBody tbody');
    if (!tableBody) {
        debugLog('Table body not found');
        return;
    }

    debugLog(`Populating table with ${accolades.length} accolades`);
    tableBody.innerHTML = '';

    accolades.forEach((accolade, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><span style="font-weight: 600">${index + 1}</span></td>
            <td>
                <span 
                    style="font-weight: 600; color: #2563eb; cursor: pointer;"
                    onclick="showAccoladeDetails(${accolade.accolade_id})"
                >${accolade.accolade_name || 'N/A'}</span>
            </td>
            <td>${accolade.item_type || 'N/A'}</td>
            <td><span style="font-weight: 600">${accolade.count || 1}</span></td>
            <td>${accolade.accolade_published_by || 'N/A'}</td>
            <td><span style="font-weight: 600">${accolade.accolade_publish_date || '-'}</span></td>
            <td><span style="font-weight: 600">${accolade.accolade_given_date || '-'}</span></td>
            <td class="text-center">
                <button 
                    onclick="handleRequestAndPay(${accolade.accolade_id})"
                    class="request-pay-btn"
                    style="background: linear-gradient(45deg, #2563eb, #1e40af); color: white;"
                >
                    <i class="ri-shopping-cart-line"></i>
                    Request & Pay
                </button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });

    if (accolades.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center">No accolades found</td></tr>';
    }

    updateAccoladesCount();
}

function updateAccoladesCount() {
    const totalRows = document.querySelector('.chaptersTableBody tbody').getElementsByTagName('tr').length;
    document.getElementById('totalAccoladesCount').innerHTML = `<b>${totalRows}</b>`;
}

async function populateAccoladesDropdown() {
    try {
        // Fetch accolades data
        const accoladesResponse = await fetch('http://backend.bninewdelhi.com/api/accolades');
        const accoladesData = await accoladesResponse.json();
        debugLog('Accolades data fetched for dropdown:', accoladesData);

        // Get the select element
        const selectElement = document.getElementById('region_status');
        if (!selectElement) {
            debugLog('Select element not found');
            return;
        }

        // Clear existing options except the first one
        selectElement.innerHTML = '<option value="">Select</option>';

        // Add accolades as options
        accoladesData.forEach(accolade => {
            const option = document.createElement('option');
            option.value = accolade.accolade_id;
            option.textContent = accolade.accolade_name;
            selectElement.appendChild(option);
        });

        debugLog('Dropdown populated with accolades');

    } catch (error) {
        console.error('Error populating accolades dropdown:', error);
        debugLog('Error occurred while populating dropdown:', error);
    }
}


async function handleRequestAndPay(accoladeId) {
    try {
        // Show SweetAlert first before showing loader
        const { value: comment } = await Swal.fire({
            title: 'Request Accolade',
            html: `
                <div style="text-align: left; margin-bottom: 15px;">
                    <p style="color: #4b5563; margin-bottom: 10px;">
                        Please provide any additional comments or requirements for your request:
                    </p>
                </div>
            `,
            input: 'textarea',
            inputPlaceholder: 'Enter your comments here...',
            inputAttributes: {
                'aria-label': 'Comments',
                'style': 'height: 120px; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px;'
            },
            showCancelButton: true,
            confirmButtonText: 'Pay Now',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#dc2626',
            showCloseButton: true,
            preConfirm: (comment) => {
                if (!comment) {
                    Swal.showValidationMessage('Please enter a comment');
                }
                return comment;
            }
        });

        if (!comment) return;

        showLoader();

        // Get current member details
        const userEmail = getUserEmail();
        const loginType = getUserLoginType();

        let currentMemberEmail, currentMemberId;

        if (loginType === 'ro_admin') {
            currentMemberEmail = localStorage.getItem('current_member_email');
            currentMemberId = parseInt(localStorage.getItem('current_member_id'));
            console.log('🔄 RO Admin requesting for member:', {
                email: currentMemberEmail,
                memberId: currentMemberId
            });
        } else {
            currentMemberEmail = userEmail;
        }

        // Fetch both member and accolade details
        const [membersResponse, accoladesResponse] = await Promise.all([
            fetch('http://backend.bninewdelhi.com/api/members'),
            fetch('http://backend.bninewdelhi.com/api/accolades')
        ]);

        const [members, accolades] = await Promise.all([
            membersResponse.json(),
            accoladesResponse.json()
        ]);

        // Find current member
        const currentMember = loginType === 'ro_admin' 
            ? members.find(member => member.member_id === currentMemberId)
            : members.find(member => member.member_email_address === currentMemberEmail);

        if (!currentMember) {
            throw new Error('Member not found');
        }

        // Find the selected accolade
        const selectedAccolade = accolades.find(accolade => accolade.accolade_id === parseInt(accoladeId));
        if (!selectedAccolade) {
            throw new Error('Accolade not found');
        }

        // Calculate amounts
        const accoladeAmount = parseFloat(selectedAccolade.accolade_price);
        const taxAmount = parseFloat((accoladeAmount * 0.18).toFixed(2));
        const totalAmount = parseFloat((accoladeAmount * 1.18).toFixed(2));

        // Prepare payment data
        const paymentData = {
            order_amount: Math.round(totalAmount).toString(),
            order_note: "Accolade Payment",
            order_currency: "INR",
            customer_details: {
                customer_id: currentMember.member_id.toString(),
                customer_email: currentMember.member_email_address,
                customer_phone: currentMember.member_phone_number,
                customer_name: `${currentMember.member_first_name} ${currentMember.member_last_name}`,
                chapter_id: currentMember.chapter_id,
                region_id: currentMember.region_id,
                member_id: currentMember.member_id,
                payment_note: 'member-requisition-payment',
                payment_gateway_id: '1',
                accolade_id: accoladeId,
            },
            order_meta: {
                payment_note: 'member-requisition-payment',
                accolade_id: accoladeId // Also add here for reference
            },
            tax: taxAmount,
            memberData: {
                member_gst_number: currentMember.member_gst_number,
                member_company_name: currentMember.member_company_name
            }
        };

        console.log('💳 Payment Data with Accolade:', paymentData);


        try {
            // Fetch payment session from backend
            const sessionResponse = await fetch('http://backend.bninewdelhi.com/api/generate-cashfree-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(paymentData)
            });
        
            const sessionData = await sessionResponse.json();
            console.log('🔑 Session Response:', sessionData);
        
            if (!sessionData.payment_session_id) {
                throw new Error('Invalid session response');
            }
        
            // Load Cashfree SDK and initialize payment
            loadCashfreeSDK(() => {
                console.log("✅ Cashfree SDK Loaded");
        
                const cashfreeInstance = Cashfree({
                    mode: "production"
                });
        
                cashfreeInstance.checkout({
                    paymentSessionId: sessionData.payment_session_id,
                    redirectTarget: "_self",  // Ensures redirection occurs
                    returnUrl: `http://backend.bninewdelhi.com/api/getCashfreeOrderDataAndVerifyPayment/${sessionData.order_id}`, // Change this to your production URL
                }).then(async (result) => {
                    if (result.paymentDetails) {
                        console.log("✅ Payment completed:", result.paymentDetails);
                        
                        try {
                            // Create member requisition after successful payment
                            const requisitionData = {
                                member_id: currentMember.member_id,
                                chapter_id: currentMember.chapter_id,
                                accolade_id: accoladeId,
                                request_comment: comment, // From the earlier SweetAlert input
                                accolade_amount: accoladeAmount,
                                order_id: sessionData.order_id // From the payment session
                            };

                            console.log('📝 Creating member requisition:', requisitionData);

                            const requisitionResponse = await fetch('http://backend.bninewdelhi.com/api/member-requisition', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(requisitionData)
                            });

                            const requisitionResult = await requisitionResponse.json();
                            console.log('✅ Requisition created:', requisitionResult);

                            if (!requisitionResponse.ok) {
                                throw new Error(requisitionResult.message || 'Failed to create requisition');
                            }

                            // Success - redirect to manage accolades page
                            window.location.href = `/macc/manage-memberAccolades`;
                        } catch (error) {
                            console.error('❌ Error creating requisition:', error);
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: 'Payment successful but failed to create requisition. Please contact support.',
                                confirmButtonColor: '#dc2626'
                            });
                        }
                    }

                    if (result.error) {
                        console.error("❌ Payment error:", result.error);
                        Swal.fire({
                            icon: 'error',
                            title: 'Payment Failed',
                            text: result.error.message || 'Payment processing failed',
                            confirmButtonColor: '#dc2626'
                        });
                    }
                });
            });
        } catch (error) {
            console.error("❌ Error during payment:", error);
            alert("Something went wrong. Please try again.");
        }

        

        hideLoader();

    } catch (error) {
        hideLoader();
        console.error('Payment Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Payment Error',
            text: error.message || 'Failed to process payment',
            confirmButtonColor: '#dc2626'
        });
    }
}

// Function to load Cashfree SDK
function loadCashfreeSDK(callback) {
    if (document.querySelector('script[src="https://sdk.cashfree.com/js/v3/cashfree.js"]')) {
        callback();
        return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.onload = callback;
    document.head.appendChild(script);
}


// Add this new function to show accolade details
async function showAccoladeDetails(accoladeId) {
    try {
        // Fetch accolades data
        const response = await fetch('http://backend.bninewdelhi.com/api/accolades');
        const accolades = await response.json();
        
        // Find the matching accolade
        const accolade = accolades.find(a => a.accolade_id === accoladeId);
        
        if (!accolade) {
            throw new Error('Accolade not found');
        }

        // Get availability status with icon
        const availabilityIcon = accolade.accolade_availability === 'available' 
            ? '<i class="ri-checkbox-circle-fill" style="color: #10b981;"></i>' 
            : '<i class="ri-close-circle-fill" style="color: #ef4444;"></i>';

        // Get status with icon
        const statusIcon = accolade.accolade_status === 'active' 
            ? '<i class="ri-shield-check-fill" style="color: #10b981;"></i>' 
            : '<i class="ri-shield-cross-fill" style="color: #ef4444;"></i>';

        // Format price
        const formattedPrice = accolade.accolade_price 
            ? `₹${parseFloat(accolade.accolade_price).toFixed(2)}` 
            : 'N/A';

        Swal.fire({
            title: `<span style="color: #2563eb; font-size: 1.5rem;">${accolade.accolade_name}</span>`,
            html: `
                <div style="text-align: left; padding: 20px;">
                    <div style="
                        background: #f3f4f6;
                        border-radius: 8px;
                        padding: 15px;
                        margin-bottom: 20px;
                    ">
                        <div style="margin-bottom: 15px;">
                            <i class="ri-store-2-fill" style="color: #2563eb;"></i>
                            <strong>Availability:</strong> 
                            <span style="margin-left: 8px;">
                                ${availabilityIcon} ${accolade.accolade_availability.toUpperCase()}
                            </span>
                        </div>
                        
                        <div style="margin-bottom: 15px;">
                            <i class="ri-price-tag-3-fill" style="color: #2563eb;"></i>
                            <strong>Price:</strong> 
                            <span style="margin-left: 8px;">${formattedPrice}</span>
                        </div>

                        <div style="margin-bottom: 15px;">
                            <i class="ri-stack-fill" style="color: #2563eb;"></i>
                            <strong>Stock:</strong> 
                            <span style="margin-left: 8px;">${accolade.stock_available} units</span>
                        </div>

                        <div>
                            <i class="ri-shield-star-fill" style="color: #2563eb;"></i>
                            <strong>Status:</strong> 
                            <span style="margin-left: 8px;">
                                ${statusIcon} ${accolade.accolade_status.toUpperCase()}
                            </span>
                        </div>
                    </div>

                    <div style="
                        background: #fff;
                        border: 1px solid #e5e7eb;
                        border-radius: 8px;
                        padding: 15px;
                    ">
                        <h3 style="
                            color: #2563eb;
                            font-size: 1.1rem;
                            margin-bottom: 10px;
                        ">
                            <i class="ri-file-list-3-fill"></i>
                            Eligibility & Conditions
                        </h3>
                        <p style="
                            color: #4b5563;
                            line-height: 1.6;
                            margin: 0;
                        ">${accolade.eligibility_and_condition}</p>
                    </div>
                </div>
            `,
            showCloseButton: true,
            showConfirmButton: false,
            customClass: {
                popup: 'swal2-show-border'
            }
        });

    } catch (error) {
        console.error('Error showing accolade details:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load accolade details'
        });
    }
}

// Add this function to get pending requisitions count and details
async function getPendingRequisitions() {
    try {
        // Get current member ID
        const loginType = getUserLoginType();
        let currentMemberId;
        
        if (loginType === 'ro_admin') {
            currentMemberId = parseInt(localStorage.getItem('current_member_id'));
        } else {
            const membersResponse = await fetch('http://backend.bninewdelhi.com/api/members');
            const members = await membersResponse.json();
            const currentMember = members.find(member => member.member_email_address === getUserEmail());
            currentMemberId = currentMember.member_id;
        }

        console.log('👤 Current Member ID:', currentMemberId);

        // Fetch requisitions
        const requisitionsResponse = await fetch('http://backend.bninewdelhi.com/api/getRequestedMemberRequisition');
        const requisitions = await requisitionsResponse.json();

        console.log('📝 All Requisitions:', requisitions);

        // Filter requisitions - only change this part
        const pendingRequisitions = requisitions.filter(req => 
            req.member_id === currentMemberId && 
            !(req.given_status === true && req.given_date)  // New condition
        );

        console.log('⏳ Pending Requisitions:', pendingRequisitions);
        console.log('📊 Pending Count:', pendingRequisitions.length);

        // Update the count in UI - using the correct ID
        const countElement = document.getElementById('pendingAccoladesCount');
        if (countElement) {
            countElement.innerHTML = `<b>${pendingRequisitions.length}</b>`;
            console.log('🔄 Updated UI count to:', pendingRequisitions.length);
        } else {
            console.error('❌ Count element not found');
        }

        // Keep existing click handler for the modal
        const countButton = document.getElementById('pendingAccoladesBtn');
        if (countButton) {
            countButton.onclick = async () => {
                if (pendingRequisitions.length === 0) {
                    Swal.fire({
                        icon: 'info',
                        title: 'No Pending Requisitions',
                        text: 'You have no pending accolade requisitions.',
                        confirmButtonColor: '#2563eb'
                    });
                    return;
                }

                // Fetch accolades data for the modal
                const accoladesResponse = await fetch('http://backend.bninewdelhi.com/api/accolades');
                const accolades = await accoladesResponse.json();

                console.log('🏆 All Accolades:', accolades);

                // Map pending requisitions to accolade names
                const pendingDetails = pendingRequisitions.map(req => {
                    const accolade = accolades.find(a => a.accolade_id === req.accolade_id);
                    return {
                        requestId: req.member_request_id,
                        accoladeName: accolade ? accolade.accolade_name : 'Unknown Accolade',
                        requestDate: new Date(req.requested_time_date).toLocaleDateString(),
                        comment: req.request_comment
                    };
                });

                console.log('📊 Pending Requisitions Details:', pendingDetails);

                // Show details in SweetAlert
                Swal.fire({
                    title: 'Pending Accolade Requests',
                    html: `
                        <div style="text-align: left; max-height: 300px; overflow-y: auto;">
                            ${pendingDetails.map(detail => `
                                <div style="border-bottom: 1px solid #e5e7eb; padding: 10px 0;">
                                    <p><strong>Accolade:</strong> ${detail.accoladeName}</p>
                                    <p><strong>Request Date:</strong> ${detail.requestDate}</p>
                                    <p><strong>Comment:</strong> ${detail.comment}</p>
                                </div>
                            `).join('')}
                        </div>
                    `,
                    confirmButtonColor: '#2563eb',
                    width: '600px'
                });
            };
        }

    } catch (error) {
        console.error('❌ Error fetching pending requisitions:', error);
        const countElement = document.getElementById('pendingAccoladesCount');
        if (countElement) {
            countElement.innerHTML = '<b>Error</b>';
        }
    }
}

// Move the Cashfree configuration inside DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    debugLog('Document ready, initializing...');
    fetchMemberData();
    populateAccoladesDropdown();
    
    // Add filter button listeners
    document.getElementById('applyFilter').addEventListener('click', applyFilter);
    document.getElementById('resetFilter').addEventListener('click', resetFilter);
    getPendingRequisitions();
});
