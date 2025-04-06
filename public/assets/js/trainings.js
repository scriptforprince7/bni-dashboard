// DOM Elements
const trainingsTableBody = document.getElementById('chaptersTableBody');
const monthsDropdown = document.getElementById('month-filter');
const applyFilterBtn = document.getElementById('apply-filters-btn');
const resetFilterBtn = document.getElementById('reset-filters-btn');
const loader = document.getElementById('loader');
const trainingsApiUrl = 'https://backend.bninewdelhi.com/api/allTrainings';
const searchInput = document.getElementById('searchAccolades');
const yearsDropdown = document.getElementById('year-filter');

let trainings = []; // Store all trainings
let selectedTrainingStatus = null;
let selectedYear = null;

// Loader functions
function showLoader() {
    if (loader) {
        loader.style.display = 'flex';
    }
}

function hideLoader() {
    if (loader) {
        loader.style.display = 'none';
    }
}

// Populate months dropdown
function populateMonthsDropdown() {
    const months = [
        { value: 1, name: "January" },
        { value: 2, name: "February" },
        { value: 3, name: "March" },
        { value: 4, name: "April" },
        { value: 5, name: "May" },
        { value: 6, name: "June" },
        { value: 7, name: "July" },
        { value: 8, name: "August" },
        { value: 9, name: "September" },
        { value: 10, name: "October" },
        { value: 11, name: "November" },
        { value: 12, name: "December" }
    ];

    monthsDropdown.innerHTML = `
        <li><a class="dropdown-item" href="javascript:void(0);" data-value="">Select Month</a></li>
        ${months.map(month => `
            <li><a class="dropdown-item" href="javascript:void(0);" data-value="${month.value}">${month.name}</a></li>
        `).join('')}
    `;

    // Add click listeners to dropdown items
    monthsDropdown.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            const dropdownToggle = monthsDropdown.closest('.dropdown').querySelector('.dropdown-toggle');
            dropdownToggle.textContent = item.textContent;
            
            // Remove active class from all items and add to selected
            monthsDropdown.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });
}

// Function to populate Training Status filter dropdown
function populateTrainingStatusFilter() {
    const statuses = ['Scheduled', 'Postponed', 'Cancelled', 'Completed'];
    const statusFilter = document.getElementById('trainings-status-filter');
    statusFilter.innerHTML = ''; // Clear existing options

    statuses.forEach(status => {
        const li = document.createElement('li');
        li.innerHTML = `
            <a class="dropdown-item" href="javascript:void(0);" data-status="${status}">
                ${status}
            </a>
        `;
        statusFilter.appendChild(li);
    });
}

// Add click event listener for status filter items
document.getElementById('trainings-status-filter').addEventListener('click', function(e) {
    if (e.target.classList.contains('dropdown-item')) {
        selectedTrainingStatus = e.target.dataset.status;
        console.log('Selected Status:', selectedTrainingStatus); // Debug log
        
        // Update dropdown button text
        const dropdownButton = e.target.closest('.dropdown').querySelector('.dropdown-toggle');
        dropdownButton.textContent = selectedTrainingStatus;
    }
});

// Function to populate years dropdown
function populateYearsDropdown() {
    // Extract unique years from trainings data
    const uniqueYears = [...new Set(trainings.map(training => {
        const trainingDate = new Date(training.training_date);
        return trainingDate.getFullYear();
    }))].sort((a, b) => b - a); // Sort years in descending order

    console.log("📅 Available years in data:", uniqueYears);

    yearsDropdown.innerHTML = `
        <li><a class="dropdown-item" href="javascript:void(0);" data-value="">Select Year</a></li>
        ${uniqueYears.map(year => `
            <li><a class="dropdown-item" href="javascript:void(0);" data-value="${year}">${year}</a></li>
        `).join('')}
    `;

    // Add click listeners to dropdown items
    yearsDropdown.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            const dropdownToggle = yearsDropdown.closest('.dropdown').querySelector('.dropdown-toggle');
            dropdownToggle.textContent = item.textContent;
            
            // Remove active class from all items and add to selected
            yearsDropdown.querySelectorAll('.dropdown-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            selectedYear = item.getAttribute('data-value');
            console.log("🎯 Selected year:", selectedYear);
        });
    });
}

// Update the apply filter button click handler
applyFilterBtn.addEventListener('click', () => {
    console.log('🔍 Applying filters...'); 
    console.log('📊 Status:', selectedTrainingStatus);
    console.log('📅 Year:', selectedYear);
    
    const selectedMonth = monthsDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value');
    let filteredTrainings = [...trainings];

    // Filter by year if selected
    if (selectedYear) {
        console.log("🗓️ Filtering by year:", selectedYear);
        filteredTrainings = filteredTrainings.filter(training => {
            const trainingDate = new Date(training.training_date);
            const trainingYear = trainingDate.getFullYear();
            return trainingYear === parseInt(selectedYear);
        });
    }

    // Filter by month if selected
    if (selectedMonth) {
        console.log("📅 Filtering by month:", selectedMonth);
        filteredTrainings = filteredTrainings.filter(training => {
            const trainingDate = new Date(training.training_date);
            const trainingMonth = trainingDate.getMonth() + 1;
            return trainingMonth === parseInt(selectedMonth);
        });
    }

    // Filter by status if selected
    if (selectedTrainingStatus) {
        console.log("🏷️ Filtering by status:", selectedTrainingStatus);
        filteredTrainings = filteredTrainings.filter(training => {
            return training.training_status === selectedTrainingStatus;
        });
    }

    console.log("✨ Filtered trainings:", filteredTrainings.length);
    renderTrainings(filteredTrainings);
});

// Update reset filter button handler
resetFilterBtn.addEventListener('click', () => {
    // Reset year filter
    selectedYear = null;
    const yearDropdown = document.querySelector('#year-filter').closest('.dropdown').querySelector('.dropdown-toggle');
    yearDropdown.innerHTML = '<i class="ti ti-sort-descending-2 me-1"></i> Year';
    
    // Reset training status filter
    selectedTrainingStatus = null;
    const statusDropdown = document.querySelector('[data-bs-toggle="dropdown"]');
    statusDropdown.innerHTML = '<i class="ti ti-sort-descending-2 me-1"></i> Training Status';
    
    // Reset month filter
    const monthDropdown = monthsDropdown.closest('.dropdown').querySelector('.dropdown-toggle');
    monthDropdown.textContent = 'Month';
    monthsDropdown.querySelectorAll('.dropdown-item').forEach(item => item.classList.remove('active'));
    
    console.log("🔄 Resetting all filters");
    // Show all trainings
    renderTrainings(trainings);
});

// Add this function for search functionality
function searchTrainings(searchTerm) {
    const filteredTrainings = trainings.filter(training => {
        // Convert both search term and training data to lowercase for case-insensitive search
        searchTerm = searchTerm.toLowerCase();
        const trainingName = training.training_name.toLowerCase();
        const trainingVenue = (training.training_venue || '').toLowerCase();
        const trainingStatus = training.training_status.toLowerCase();

        // Return true if search term is found in any of these fields
        return trainingName.includes(searchTerm) || 
               trainingVenue.includes(searchTerm) || 
               trainingStatus.includes(searchTerm);
    });

    renderTrainings(filteredTrainings);
}

// Add real-time search event listener
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.trim();
    if (searchTerm === '') {
        // If search box is empty, show all trainings
        renderTrainings(trainings);
    } else {
        // Filter trainings based on search term
        searchTrainings(searchTerm);
    }
});

// Add this new function for fetching registration count
async function fetchRegistrationCount(training_id) {
    console.log(`Fetching registration count for training_id: ${training_id}`);
    try {
        // Fetch all orders
        const ordersResponse = await fetch('https://backend.bninewdelhi.com/api/allOrders');
        const orders = await ordersResponse.json();
        console.log(`Found ${orders.length} total orders`);

        // Filter orders for this training
        const trainingOrders = orders.filter(order => order.training_id === training_id);
        console.log(`Found ${trainingOrders.length} orders for training ${training_id}`);

        if (trainingOrders.length === 0) {
            console.log(`No orders found for training ${training_id}`);
            return 0;
        }

        // Get order_ids for this training
        const orderIds = trainingOrders.map(order => order.order_id);
        console.log(`Order IDs to check for training ${training_id}:`, orderIds);

        // Fetch all transactions
        const transactionsResponse = await fetch('https://backend.bninewdelhi.com/api/allTransactions');
        const transactions = await transactionsResponse.json();
        console.log(`Found ${transactions.length} total transactions`);

        // Count successful payments for these orders
        const successfulPayments = transactions.filter(transaction => 
            orderIds.includes(transaction.order_id) && 
            transaction.payment_status === 'SUCCESS'
        );
        console.log(`Found ${successfulPayments.length} successful payments for training ${training_id}`);

        return successfulPayments.length;
    } catch (error) {
        console.error('Error fetching registration count:', error);
        return 0;
    }
}

// Function to update total trainings count
function updateTotalTrainingsCount(trainingsCount) {
    const totalTrainingsButton = document.querySelector('.btn-white.btn-wave b');
    if (totalTrainingsButton) {
        totalTrainingsButton.textContent = trainingsCount;
    }
}

// Modify the existing renderTrainings function
function renderTrainings(trainingsToShow) {
    trainingsTableBody.innerHTML = '';

    if (trainingsToShow.length === 0) {
        trainingsTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-danger">No trainings found matching your search.</td>
            </tr>`;
        updateTotalTrainingsCount(0);
        return;
    }

    // Update total count
    updateTotalTrainingsCount(trainingsToShow.length);

    // Fetch hotels data first
    fetch('https://backend.bninewdelhi.com/api/getHotels')
        .then(response => response.json())
        .then(hotels => {
            trainingsToShow.forEach(async (training, index) => {
                const registrationsCount = await fetchRegistrationCount(training.training_id);
                
                // Find matching hotel
                const hotel = hotels.find(h => h.hotel_id === parseInt(training.training_venue));
                let venueDisplay = 'N/A';
                
                if (hotel) {
                    // Get first two parts of the address (up to second comma)
                    const addressParts = hotel.hotel_address.split(',');
                    const shortenedAddress = addressParts.length > 1 ? addressParts[0] : hotel.hotel_address;
                    venueDisplay = `${hotel.hotel_name}, ${shortenedAddress}`;
                }

                trainingsTableBody.innerHTML += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>
                            <a href="/tr/view-training?training_id=${training.training_id}"><b>${training.training_name}</b></a>
                        </td>
                        <td>${venueDisplay}</td>
                        <td><b>${new Date(training.training_date).toLocaleDateString('en-US', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                        })}</b></td>
                        <td><b>${registrationsCount}</b></td>
                        <td class="text-center"><b>${training.training_price}</b></td>
                        <td>
                            <span class="badge bg-${getBadgeClass(training.training_status)}">${training.training_status}</span>
                        </td>
                        <td>
                            <span class="badge bg-primary">
                                <a href="/tr/edit-training/?training_id=${training.training_id}" style="color:white">Edit</a>
                            </span>
                        </td>
                        <td>
                            <button class="btn btn-primary btn-sm send-mail-btn" onclick="openMailDialog(${training.training_id})">
                                <i class="ri-mail-send-line me-1"></i> Send Mail
                            </button>
                        </td>
                    </tr>`;
            });
        })
        .catch(error => {
            console.error('Error fetching hotels:', error);
            // Fallback to showing just the venue ID if hotels fetch fails
            trainingsToShow.forEach(async (training, index) => {
                const registrationsCount = await fetchRegistrationCount(training.training_id);
                // ... rest of your existing rendering code with training.training_venue || 'N/A' ...
            });
        });
}

// Helper function for badge colors
function getBadgeClass(status) {
    const statusMap = {
        'Scheduled': 'warning',
        'Completed': 'success',
        'Postponed': 'info',
        'Cancelled': 'danger'
    };
    return statusMap[status] || 'secondary';
}

// Fetch and display trainings on page load
async function fetchAndDisplayTrainings() {
    try {
        showLoader();
        const response = await fetch(trainingsApiUrl);
        if (!response.ok) throw new Error('Failed to fetch trainings');
        
        trainings = await response.json();
        renderTrainings(trainings);
        populateMonthsDropdown();
        populateTrainingStatusFilter();
        populateYearsDropdown();
    } catch (error) {
        console.error('Error:', error);
        trainingsTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-danger">Error loading trainings. Please try again.</td>
            </tr>`;
    } finally {
        hideLoader();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchAndDisplayTrainings();
    populateMonthsDropdown();
    populateTrainingStatusFilter();
    populateYearsDropdown();
});

// Add these new functions
async function openMailDialog(trainingId) {
    console.log('🚀 Opening mail dialog for training ID:', trainingId);
    
    try {
        // Fetch all required data
        console.log('📡 Fetching required data from APIs...');
        const [regions, chapters, members] = await Promise.all([
            fetch('https://backend.bninewdelhi.com/api/regions').then(res => res.json()),
            fetch('https://backend.bninewdelhi.com/api/chapters').then(res => res.json()),
            fetch('https://backend.bninewdelhi.com/api/members').then(res => res.json())
        ]);

        console.log('✅ Data fetched successfully:', {
            regionsCount: regions.length,
            chaptersCount: chapters.length,
            membersCount: members.length
        });

        const regionOptions = regions.map(region => 
            `<option value="${region.region_id}">${region.region_name}</option>`
        ).join('');

        const result = await Swal.fire({
            title: 'Send Training Mail',
            html: `
                <div class="mail-dialog-container">
                    <div class="form-group mb-3">
                        <label class="form-label">Select Region</label>
                        <select class="form-select" id="regionSelect" onchange="updateChapters(this.value)">
                            <option value="">Select Region</option>
                            ${regionOptions}
                        </select>
                    </div>
                    
                    <div class="form-group mb-3">
                        <label class="form-label">Select Chapter</label>
                        <select class="form-select" id="chapterSelect" onchange="updateMembers(this.value)" disabled>
                            <option value="">Select Chapter</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Select Members</label>
                        <div class="member-select-container">
                            <div class="d-flex justify-content-between mb-2">
                                <label class="form-check">
                                    <input type="checkbox" class="form-check-input" id="selectAllMembers">
                                    <span class="form-check-label">Select All</span>
                                </label>
                            </div>
                            <div class="member-list" id="memberList">
                                <!-- Members will be populated here -->
                            </div>
                        </div>
                    </div>
                </div>
            `,
            customClass: {
                container: 'mail-dialog-custom',
                popup: 'mail-dialog-popup',
                content: 'mail-dialog-content'
            },
            showCancelButton: true,
            confirmButtonText: 'Send Mail',
            confirmButtonColor: '#d01f2f',
            cancelButtonColor: '#6c757d',
            width: '600px',
            didOpen: () => {
                // Store data for access by other functions
                window.mailDialogData = { regions, chapters, members };
                
                // Setup event listeners
                document.getElementById('selectAllMembers').addEventListener('change', function() {
                    const memberCheckboxes = document.querySelectorAll('.member-checkbox');
                    memberCheckboxes.forEach(cb => cb.checked = this.checked);
                });
            }
        });

        if (result.isConfirmed) {
            console.log('📧 Preparing to send emails...');
            const selectedMembers = getSelectedMembers();
            
            if (selectedMembers.length === 0) {
                console.warn('⚠️ No members selected');
                Swal.fire('Warning', 'Please select at least one member', 'warning');
                return;
            }

            console.log('👥 Selected member IDs:', selectedMembers);

            // Show loading state
            Swal.fire({
                title: 'Sending Emails',
                html: 'Please wait...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Get member emails from selected IDs
            const selectedMemberDetails = window.mailDialogData.members
                .filter(m => selectedMembers.includes(m.member_id.toString()))
                .map(m => ({
                    member_id: m.member_id,
                    member_email_address: m.member_email_address
                }));

            console.log('📧 Selected member details:', selectedMemberDetails);

            try {
                const response = await fetch('https://backend.bninewdelhi.com/api/sendTrainingMails', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        member_ids: selectedMembers,
                        training_id: trainingId
                    })
                });

                const data = await response.json();
                console.log('📬 Mail sending response:', data);

                if (data.success) {
                    // Show success message with details
                    Swal.fire({
                        icon: 'success',
                        title: 'Emails Sent Successfully!',
                        html: `
                            <div class="text-left">
                                <p>✅ Successfully sent: ${data.details.filter(d => d.success).length}</p>
                                ${data.details.filter(d => !d.success).length > 0 ? 
                                    `<p>❌ Failed: ${data.details.filter(d => !d.success).length}</p>` : ''}
                            </div>
                        `,
                        confirmButtonColor: '#d01f2f'
                    });
                } else {
                    throw new Error(data.message || 'Failed to send emails');
                }
            } catch (error) {
                console.error('❌ Error sending emails:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to send emails. Please try again.',
                    confirmButtonColor: '#d01f2f'
                });
            }
        }
    } catch (error) {
        console.error('❌ Error in mail dialog:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load required data. Please try again.',
            confirmButtonColor: '#d01f2f'
        });
    }
}

function updateChapters(regionId) {
    console.log('Updating chapters for region:', regionId);
    const chapterSelect = document.getElementById('chapterSelect');
    const { chapters } = window.mailDialogData;
    
    chapterSelect.innerHTML = '<option value="">Select Chapter</option>';
    chapterSelect.disabled = !regionId;
    
    if (regionId) {
        const filteredChapters = chapters.filter(c => c.region_id === parseInt(regionId));
        filteredChapters.forEach(chapter => {
            chapterSelect.innerHTML += `
                <option value="${chapter.chapter_id}">${chapter.chapter_name}</option>
            `;
        });
    }
}

function updateMembers(chapterId) {
    console.log('Updating members for chapter:', chapterId);
    const memberList = document.getElementById('memberList');
    const { members } = window.mailDialogData;
    
    memberList.innerHTML = '';
    
    if (chapterId) {
        const filteredMembers = members.filter(m => m.chapter_id === parseInt(chapterId));
        filteredMembers.forEach(member => {
            memberList.innerHTML += `
                <div class="member-item">
                    <label class="form-check">
                        <input type="checkbox" class="form-check-input member-checkbox" 
                               value="${member.member_id}">
                        <span class="form-check-label">
                            ${member.member_first_name} ${member.member_last_name}
                        </span>
                    </label>
                </div>
            `;
        });
    }
}

function getSelectedMembers() {
    const checkboxes = document.querySelectorAll('.member-checkbox:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

// Add this CSS to your stylesheet
const style = document.createElement('style');
style.textContent = `
    .mail-dialog-custom .mail-dialog-popup {
        border-radius: 15px;
    }
    
    .mail-dialog-content {
        padding: 20px;
    }
    
    .member-select-container {
        max-height: 200px;
        overflow-y: auto;
        border: 1px solid #dee2e6;
        border-radius: 5px;
        padding: 10px;
    }
    
    .member-item {
        padding: 5px 0;
    }
    
    .member-item:hover {
        background-color: #f8f9fa;
    }
`;
document.head.appendChild(style);



