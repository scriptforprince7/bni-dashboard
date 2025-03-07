// DOM Elements
const trainingsTableBody = document.getElementById('chaptersTableBody');
const monthsDropdown = document.getElementById('month-filter');
const applyFilterBtn = document.getElementById('apply-filters-btn');
const resetFilterBtn = document.getElementById('reset-filters-btn');
const loader = document.getElementById('loader');
const trainingsApiUrl = 'https://bni-data-backend.onrender.com/api/allTrainings';
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
        const ordersResponse = await fetch('https://bni-data-backend.onrender.com/api/allOrders');
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
        const transactionsResponse = await fetch('https://bni-data-backend.onrender.com/api/allTransactions');
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

// Modify only the relevant part of the existing renderTrainings function
function renderTrainings(trainingsToShow) {
    trainingsTableBody.innerHTML = '';

    if (trainingsToShow.length === 0) {
        trainingsTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-danger">No trainings found matching your search.</td>
            </tr>`;
        return;
    }

    // Fetch hotels data first
    fetch('https://bni-data-backend.onrender.com/api/getHotels')
        .then(response => response.json())
        .then(hotels => {
            trainingsToShow.forEach(async (training, index) => {
                // Get registration count for this training
                const registrationsCount = await fetchRegistrationCount(training.training_id);
                
                // Find matching hotel
                const hotel = hotels.find(h => h.hotel_id === parseInt(training.training_venue));
                const venueDisplay = hotel ? 
                    `${hotel.hotel_name}, ${hotel.hotel_address}` : 
                    'N/A';

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



