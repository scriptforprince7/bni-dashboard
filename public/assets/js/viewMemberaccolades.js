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

async function fetchMemberData() {
    try {
        showLoader();
        
        // Get member email
        const member_email = localStorage.getItem('current_member_email') || getUserEmail();
        debugLog('Using member email:', member_email);

        if (!member_email) {
            throw new Error('No member email found');
        }

        // Fetch members data to get accolades array
        const membersResponse = await fetch('https://backend.bninewdelhi.com/api/members');
        const membersData = await membersResponse.json();
        debugLog('Members data fetched:', membersData);

        // Find logged in member
        const loggedInMember = membersData.find(member => member.member_email_address === member_email);
        if (!loggedInMember) {
            throw new Error('Member not found');
        }
        debugLog('Found member:', loggedInMember);

        // Get all accolades
        const accoladesResponse = await fetch('https://backend.bninewdelhi.com/api/accolades');
        const accoladesData = await accoladesResponse.json();
        debugLog('All accolades fetched:', accoladesData);

        // Populate table with all accolades and member info
        populateAccoladesTable(accoladesData, loggedInMember);

    } catch (error) {
        console.error('Error:', error);
        debugLog('Error occurred:', error);
    } finally {
        hideLoader();
    }
}

async function populateAccoladesTable(accolades, loggedInMember) {
    const tableBody = document.querySelector('.chaptersTableBody tbody');
    if (!tableBody) {
        debugLog('Table body not found');
        return;
    }

    debugLog(`Populating table with ${accolades.length} accolades`);
    debugLog('Member accolades array:', loggedInMember.accolades_id);

    // Counter for assigned accolades (green ticks)
    let assignedAccoladesCount = 0;

    // Clear existing rows
    tableBody.innerHTML = '';

    // Add rows for each accolade
    accolades.forEach((accolade, index) => {
        // Check if this accolade is assigned to the member
        const isAssigned = loggedInMember.accolades_id.includes(accolade.accolade_id);
        
        // Increment counter if accolade is assigned
        if (isAssigned) {
            assignedAccoladesCount++;
        }
        
        debugLog(`Checking accolade ${accolade.accolade_id}:`, {
            name: accolade.accolade_name,
            isAssigned: isAssigned
        });

        const statusStyle = isAssigned 
            ? 'color: #10b981; font-size: 1.2em; display: flex; justify-content: flex-start; padding-left: 40%;' 
            : 'color: #ef4444; font-size: 1.2em; display: flex; justify-content: flex-start; padding-left: 40%;';
        
        const statusIcon = isAssigned 
            ? '<i class="ri-checkbox-circle-fill"></i>'     
            : '<i class="ri-close-circle-fill"></i>';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><span style="font-weight: 600">${index + 1}</span></td>
            <td>
                <span 
                    style="
                        font-weight: 600; 
                        color: #2563eb; 
                        cursor: pointer;
                        text-decoration: underline;
                        transition: all 0.3s ease;
                    "
                    onmouseover="this.style.color='#1e40af'"
                    onmouseout="this.style.color='#2563eb'"
                    onclick="showAccoladeDetails(${accolade.accolade_id})"
                >${accolade.accolade_name || 'N/A'}</span>
            </td>
            <td>${accolade.item_type || 'N/A'}</td>
            <td>
                <div style="${statusStyle}">
                    ${statusIcon}
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });

    // Update the total assigned accolades count in the UI
    const totalAccoladesElement = document.getElementById('totalAccoladesCount');
    if (totalAccoladesElement) {
        totalAccoladesElement.innerHTML = `<b>${assignedAccoladesCount}</b>`;
        debugLog('Updated total assigned accolades count:', assignedAccoladesCount);
    }

    if (accolades.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No accolades found</td></tr>';
        debugLog('No accolades to display');
    }
}

function updateAccoladesCount() {
    const totalRows = document.querySelector('.chaptersTableBody tbody').getElementsByTagName('tr').length;
    document.getElementById('totalAccoladesCount').innerHTML = `<b>${totalRows}</b>`;
}

async function populateAccoladesDropdown() {
    try {
        // Fetch accolades data
        const accoladesResponse = await fetch('https://backend.bninewdelhi.com/api/accolades');
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

// Add this new function to handle the request and pay action
async function handleRequestAndPay(accoladeId) {
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
        confirmButtonText: 'Submit Request',
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

    if (comment) {
        // Show success message
        Swal.fire({
            icon: 'success',
            title: 'Request Submitted!',
            text: 'Your accolade request has been submitted successfully.',
            confirmButtonColor: '#2563eb'
        });

        // Here you can add the API call to submit the request
        debugLog('Accolade request submitted:', {
            accoladeId: accoladeId,
            comment: comment
        });
    }
}

// Add this new function to show accolade details
async function showAccoladeDetails(accoladeId) {
    try {
        // Fetch accolades data
        const response = await fetch('https://backend.bninewdelhi.com/api/accolades');
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

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    debugLog('Document ready, initializing...');
    fetchMemberData();
    populateAccoladesDropdown();
});