// Global variables
let transactions = [];
let chapterOrders = [];

// Function to show/hide loader
function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

// Get dropdown elements
const monthsDropdown = document.getElementById("month-filter");
const paymentStatusDropdown = document.getElementById("payment-status-filter");
const paymentTypeDropdown = document.getElementById("payment-type-filter");
const paymentMethodDropdown = document.getElementById("payment-method-filter");

// Add this after your existing variable declarations
const searchInput = document.getElementById('searchChapterInput');
console.log('Search input initialized:', searchInput);

// Initialize filter data
const months = [
    { value: '01', text: 'January' },
    { value: '02', text: 'February' },
    { value: '03', text: 'March' },
    { value: '04', text: 'April' },
    { value: '05', text: 'May' },
    { value: '06', text: 'June' },
    { value: '07', text: 'July' },
    { value: '08', text: 'August' },
    { value: '09', text: 'September' },
    { value: '10', text: 'October' },
    { value: '11', text: 'November' },
    { value: '12', text: 'December' }
];

const paymentTypes = [
    { value: 'visitor-payment', text: 'Visitor Payment' },
    { value: 'membership-payment', text: 'Membership Payment' }
];

const paymentStatuses = [
    { value: 'SUCCESS', text: 'Success' },
    { value: 'FAILED', text: 'Failed' },
    { value: 'PENDING', text: 'Pending' }
];

const paymentMethods = [
    { value: 'upi', text: 'UPI' },
    { value: 'card', text: 'Card' },
    { value: 'netbanking', text: 'Net Banking' },
    { value: 'wallet', text: 'Wallet' }
];

// Function to populate dropdown with checkboxes
const populateDropdown = (dropdown, data, valueField, textField, defaultText) => {
    dropdown.innerHTML = `
        <li>
            <a class="dropdown-item" href="javascript:void(0);" data-value="">
                <input type="checkbox" class="select-all-checkbox me-2">
                ${defaultText}
            </a>
        </li>
    `;

    data.forEach(item => {
        dropdown.innerHTML += `
            <li>
                <a class="dropdown-item" href="javascript:void(0);" data-value="${item[valueField]}">
                    <input type="checkbox" class="month-checkbox me-2">
                    ${item[textField]}
                </a>
            </li>
        `;
    });

    attachDropdownListeners(dropdown);
};

// Updated dropdown listeners with checkbox support
const attachDropdownListeners = (dropdown) => {
    const dropdownToggle = dropdown.closest('.dropdown').querySelector('.dropdown-toggle');
    const selectAllCheckbox = dropdown.querySelector('.select-all-checkbox');
    const monthCheckboxes = dropdown.querySelectorAll('.month-checkbox');

    // Handle "Select All" checkbox
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', (e) => {
            e.stopPropagation();
            monthCheckboxes.forEach(checkbox => {
                checkbox.checked = selectAllCheckbox.checked;
            });
            updateDropdownText(dropdown, dropdownToggle);
        });
    }

    // Handle individual month checkboxes
    monthCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            updateDropdownText(dropdown, dropdownToggle);
            
            // Update "Select All" checkbox
            if (selectAllCheckbox) {
                selectAllCheckbox.checked = Array.from(monthCheckboxes)
                    .every(cb => cb.checked);
            }
        });
    });

    // Prevent dropdown from closing when clicking checkboxes
    dropdown.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });
};

// Function to update dropdown text based on selections
function updateDropdownText(dropdown, dropdownToggle) {
    const checkedBoxes = dropdown.querySelectorAll('.month-checkbox:checked');
    if (checkedBoxes.length === 0) {
        dropdownToggle.textContent = 'All Months';
    } else if (checkedBoxes.length === 12) {
        dropdownToggle.textContent = 'All Months';
    } else {
        const selectedMonths = Array.from(checkedBoxes).map(cb => 
            cb.closest('.dropdown-item').textContent.trim()
        );
        dropdownToggle.textContent = selectedMonths.join(', ');
    }
}

// Populate dropdowns when page loads
document.addEventListener('DOMContentLoaded', () => {
    populateDropdown(monthsDropdown, months, 'value', 'text', 'All Months');
    populateDropdown(paymentTypeDropdown, paymentTypes, 'value', 'text', 'All Payment Types');
    populateDropdown(paymentStatusDropdown, paymentStatuses, 'value', 'text', 'All Statuses');
    populateDropdown(paymentMethodDropdown, paymentMethods, 'value', 'text', 'All Methods');
    
    // Initialize by fetching data
    fetchTransactions();
});

// Main fetch function
async function fetchTransactions() {
    try {
        showLoader();
        
        const loginType = getUserLoginType();
        let userEmail = loginType === 'ro_admin' ? 
            localStorage.getItem('current_chapter_email') : 
            getUserEmail();

        if (!userEmail) {
            console.error('❌ No valid email found');
            hideLoader();
            return;
        }

        // Fetch chapters to get chapter_id
        const chaptersResponse = await fetch('https://backend.bninewdelhi.com/api/chapters');
        const chapters = await chaptersResponse.json();
        
        const matchingChapter = chapters.find(chapter =>
            chapter.email_id === userEmail ||
            chapter.vice_president_mail === userEmail ||
            chapter.president_mail === userEmail ||
            chapter.treasurer_mail === userEmail
        );
        
        if (!matchingChapter) {
            console.error('❌ No matching chapter found');
            hideLoader();
            return;
        }

        // Fetch orders and transactions
        const [ordersResponse, transactionsResponse] = await Promise.all([
            fetch('https://backend.bninewdelhi.com/api/allOrders'),
            fetch('https://backend.bninewdelhi.com/api/allTransactions')
        ]);

        const allOrders = await ordersResponse.json();
        const allTransactions = await transactionsResponse.json();

        // Filter for chapter
        chapterOrders = allOrders.filter(order => order.chapter_id === matchingChapter.chapter_id);
        const chapterOrderIds = chapterOrders.map(order => order.order_id);
        
        transactions = allTransactions.filter(transaction => 
            chapterOrderIds.includes(transaction.order_id)
        );

        console.log('Loaded transactions:', transactions.length);
        updateTransactionsDisplay(transactions);

    } catch (error) {
        console.error('❌ Error:', error);
        alert('An error occurred while fetching transactions.');
    } finally {
        hideLoader();
    }
}

// Update the apply filters button handler
document.getElementById('apply-filters-btn').addEventListener('click', () => {
    const selectedMonths = Array.from(monthsDropdown.querySelectorAll('.month-checkbox:checked'))
        .map(checkbox => checkbox.closest('.dropdown-item').getAttribute('data-value'));
    const selectedType = paymentTypeDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value');
    const selectedStatus = paymentStatusDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value');
    const selectedMethod = paymentMethodDropdown.querySelector('.dropdown-item.active')?.getAttribute('data-value');

    const filteredTransactions = transactions.filter(transaction => {
        const order = chapterOrders.find(order => order.order_id === transaction.order_id);
        
        // Month filter (now handles multiple selections)
        if (selectedMonths.length > 0) {
            const transactionMonth = (new Date(transaction.payment_time).getMonth() + 1)
                .toString().padStart(2, '0');
            if (!selectedMonths.includes(transactionMonth)) return false;
        }

        // Rest of your existing filters
        if (selectedType && order) {
            if (order.payment_note !== selectedType) return false;
        }

        if (selectedStatus) {
            if (transaction.payment_status !== selectedStatus) return false;
        }

        if (selectedMethod && transaction.payment_method) {
            if (!transaction.payment_method[selectedMethod]) return false;
        }

        return true;
    });

    updateTransactionsDisplay(filteredTransactions);
});

// Update reset filters to handle checkboxes
document.getElementById('reset-filters-btn').addEventListener('click', () => {
    // Reset checkboxes in month dropdown
    monthsDropdown.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });

    // Reset other dropdowns
    [paymentTypeDropdown, paymentStatusDropdown, paymentMethodDropdown].forEach(dropdown => {
        const dropdownToggle = dropdown.closest('.dropdown').querySelector('.dropdown-toggle');
        dropdown.querySelectorAll('.dropdown-item.active').forEach(item => item.classList.remove('active'));
        dropdownToggle.textContent = dropdownToggle.getAttribute('data-original-text') || 'All';
    });

    updateTransactionsDisplay(transactions);
});

// Function to update transactions display
function updateTransactionsDisplay(transactionsToShow) {
    const transactionsBody = document.querySelector('.member-all-transactions');
    transactionsBody.innerHTML = '';

    // Sort transactions by date (most recent first)
    const sortedTransactions = [...transactionsToShow].sort((a, b) => {
        return new Date(b.payment_time) - new Date(a.payment_time);
    });

    sortedTransactions.forEach((transaction, index) => {
        const order = chapterOrders.find(order => order.order_id === transaction.order_id);
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${new Date(transaction.payment_time).toLocaleDateString('en-IN')}</td>
            <td><b>+₹${parseFloat(transaction.payment_amount).toFixed(2)}</b><br>
                <a href="/minv/view-chapterInvoice?order_id=${transaction.order_id}" 
                   class="fw-medium text-success">View</a></td>
            <td>${getPaymentMethodDisplay(transaction.payment_method)}</td>
            <td><em>${transaction.order_id}</em></td>
            <td><b><em>${transaction.cf_payment_id}</em></b></td>
            <td><span class="badge ${
                transaction.payment_status === "SUCCESS" ? "bg-success" : "bg-danger"
            }">${transaction.payment_status.toLowerCase()}</span></td>
            <td><b><em>${getDisplayName(order)}</em></b></td>
            <td><b><em>${order ? order.payment_note : 'Unknown'}</em></b></td>
        `;
        
        transactionsBody.appendChild(row);
    });

    updateTotals(transactionsToShow);
}

// Function to update totals
function updateTotals(transactionsToShow) {
    const totalAmount = transactionsToShow.reduce(
        (sum, transaction) => sum + parseFloat(transaction.payment_amount || 0),
        0
    );

    const successPayments = transactionsToShow
        .filter(transaction => transaction.payment_status === "SUCCESS")
        .reduce((sum, transaction) => sum + parseFloat(transaction.payment_amount || 0), 0);

    const pendingPayments = transactionsToShow
        .filter(transaction => transaction.payment_status !== "SUCCESS")
        .reduce((sum, transaction) => sum + parseFloat(transaction.payment_amount || 0), 0);

    document.getElementById('total_transactions_amount').textContent = `₹${totalAmount.toFixed(2)}`;
    document.getElementById('success_payments').textContent = `₹${successPayments.toFixed(2)}`;
    document.getElementById('pending_payments').textContent = `₹${pendingPayments.toFixed(2)}`;
}

// Keep your existing helper functions
function getPaymentMethodDisplay(paymentMethod) {
    if (!paymentMethod) return "N/A";
    
    if (paymentMethod.upi) {
        return '<img src="https://economictimes.indiatimes.com/thumb/msid-74960608,width-1200,height-900,resizemode-4,imgsize-49172/upi-twitter.jpg?from=mdr" alt="UPI" width="30" height="30"> UPI';
    } else if (paymentMethod.card) {
        return '<img src="https://www.investopedia.com/thmb/F8CKM3YkF1fmnRCU2g4knuK0eDY=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/MClogo-c823e495c5cf455c89ddfb0e17fc7978.jpg" alt="Card" width="20" height="20"> Card';
    } else if (paymentMethod.netbanking) {
        return '<img src="https://cdn.prod.website-files.com/64199d190fc7afa82666d89c/648b63af41676287e601542d_regular-bank-transfer.png" alt="Net Banking" width="20" height="20"> Net Banking';
    } else if (paymentMethod.wallet) {
        return '<img src="https://ibsintelligence.com/wp-content/uploads/2024/01/digital-wallet-application-mobile-internet-banking-online-payment-security-via-credit-card_228260-825.jpg" alt="Wallet" width="20" height="20"> Wallet';
    }
    return "Other";
}

function getDisplayName(order) {
    if (order?.payment_note === 'visitor-payment') {
        return order.visitor_name || 'Unknown Visitor';
    } else if (order?.payment_note === 'New Member Payment') {
        return order.visitor_name || 'Unknown';
    }
    return order?.member_name || 'Unknown';
}
  