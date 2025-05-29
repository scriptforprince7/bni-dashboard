// Global variables to store data
let allOrders = [];
let allTransactions = [];
let chapters = [];
let universalLinks = [];
let regions = []; // Add regions array
let currentFilters = {
    region: '',
    chapter: '',
    month: '',
    year: '',
    paymentType: '',
    paymentStatus: '',
    paymentMethod: ''
};

// Pagination variables
let currentPage = 1;
const itemsPerPage = 20;
let totalPages = 1;
let showAll = false; // Add show all flag

// Helper function to handle loader visibility
function toggleLoader(show) {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

// Helper function to format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
    });
}

// Helper to format amount in Indian Rupees
function formatINR(amount) {
    if (!amount) return '₹0';
    return '₹' + Number(amount).toLocaleString('en-IN');
}

// Helper to format Not Applicable in italic
function formatNA(val) {
    return val === 'Not Applicable' ? '<i>Not Applicable</i>' : val;
}

// Function to check if transaction is cash payment
function isCashPayment(transaction) {
    return transaction.payment_method && transaction.payment_method.cash;
}

// Function to get settlement status HTML
function getSettlementStatusHTML(transaction, order) {
    // For non-successful payments
    if (transaction.payment_status !== 'SUCCESS') {
        return 'Not Applicable';
    }

    if (isCashPayment(transaction)) {
        return '<span class="badge bg-success"><i class="ti ti-check"></i> Automatic Settled</span>';
    }

    if (transaction.is_settled) {
        return '<span class="badge bg-success"><i class="ti ti-check"></i>Payment Settled</span>';
    }

    return `<button style="color:#ff4d4f;border:1.5px solid #ff4d4f;background:#fff;font-weight:500;padding:4px 16px;border-radius:6px;" onclick="trackSettlement('${order.order_id}')">Track Settlement</button>`;
}

// Function to get settlement details
function getSettlementDetails(transaction) {
    if (isCashPayment(transaction)) {
        return {
            utr: 'Cash Payment',
            time: 'Cash Payment'
        };
    }

    if (transaction.is_settled) {
        return {
            utr: transaction.utr || 'Not Settled',
            time: formatDate(transaction.settled_on) || 'Not Settled'
        };
    }

    return {
        utr: 'Not Settled',
        time: 'Not Settled'
    };
}

// Function to track settlement
async function trackSettlement(orderId) {
    try {
        // Find the button and replace it with loading text
        const button = document.querySelector(`button[onclick="trackSettlement('${orderId}')"]`);
        if (button) {
            const originalText = button.innerHTML;
            button.innerHTML = 'Loading...';
            button.style.pointerEvents = 'none';
            button.style.opacity = '0.6';
        }

        // Wait for 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));

        const transaction = allTransactions.find(t => t.order_id === orderId);
        if (transaction && transaction.is_settled) {
            toastr.success('Settlement data fetched successfully');
            displayTransactions(); // Refresh the table to show updated settlement data
        } else {
            toastr.info('Settlement under process. Please check after some time.', {
                timeOut: 5000,
                extendedTimeOut: 2000,
                closeButton: true,
                progressBar: true,
                positionClass: "toast-top-right"
            });
        }

        // Restore button state
        if (button) {
            button.innerHTML = originalText;
            button.style.pointerEvents = '';
            button.style.opacity = '';
        }
    } catch (error) {
        console.error('Error tracking settlement:', error);
        
        // Restore button state in case of error
        const button = document.querySelector(`button[onclick="trackSettlement('${orderId}')"]`);
        if (button) {
            button.innerHTML = 'Track Settlement';
            button.style.pointerEvents = '';
            button.style.opacity = '';
        }
    }
}

// Function to fetch all required data
async function fetchAllData() {
    try {
        // Show loader
        toggleLoader(true);

        // Fetch all data in parallel
        const [ordersResponse, transactionsResponse, chaptersResponse, universalLinksResponse, regionsResponse] = await Promise.all([
            fetch('http://localhost:5000/api/allOrders'),
            fetch('http://localhost:5000/api/allTransactions'),
            fetch('http://localhost:5000/api/chapters'),
            fetch('http://localhost:5000/api/universalLinks'),
            fetch('http://localhost:5000/api/regions')
        ]);

        if (!ordersResponse.ok || !transactionsResponse.ok || !chaptersResponse.ok || !universalLinksResponse.ok || !regionsResponse.ok) {
            throw new Error('Failed to fetch data from one or more endpoints');
        }

        allOrders = await ordersResponse.json();
        allTransactions = await transactionsResponse.json();
        chapters = await chaptersResponse.json();
        universalLinks = await universalLinksResponse.json();
        regions = await regionsResponse.json();

        // Update dashboard stats
        updateDashboardStats();
        
        // Populate filters
        populateFilters();
        
        // Display transactions
        displayTransactions();

    } catch (error) {
        console.error('Error fetching data:', error);
        toastr.error('Failed to fetch data. Please try again.');
    } finally {
        // Hide loader
        toggleLoader(false);
    }
}

// Function to update dashboard statistics
function updateDashboardStats() {
    // Total transactions
    document.getElementById('no_of_transaction').textContent = allOrders.length;
    
    // Total generated invoice (successful transactions)
    const successfulTransactions = allTransactions.filter(t => t.payment_status === 'SUCCESS').length;
    document.getElementById('settled_transaction').textContent = successfulTransactions;
    
    // Total pending invoice
    const pendingTransactions = allOrders.length - successfulTransactions;
    document.getElementById('not_settle_transaction').textContent = pendingTransactions;

    // Calculate total base amount and GST
    let totalBaseAmount = 0;
    let totalGstAmount = 0;
    
    allOrders.forEach(order => {
        const amount = parseFloat(order.order_amount);
        const tax = parseFloat(order.tax);
        totalBaseAmount += (amount - tax);
        totalGstAmount += tax;
    });

    document.getElementById('total_base_amount').textContent = `₹${totalBaseAmount.toFixed(2)}`;
    document.getElementById('total_gst_amount').textContent = `₹${totalGstAmount.toFixed(2)}`;
}

// Function to populate filter dropdowns
function populateFilters() {
    // Region filter
    const regionFilter = document.getElementById('region-filter');
    regionFilter.innerHTML = '<li><a class="dropdown-item" href="#" data-value="">All Regions</a></li>';
    regions.forEach(region => {
        regionFilter.innerHTML += `<li><a class="dropdown-item" href="#" data-value="${region.region_id}">${region.region_name}</a></li>`;
    });

    // Chapter filter
    const chapterFilter = document.getElementById('chapter-filter');
    chapterFilter.innerHTML = '<li><a class="dropdown-item" href="#" data-value="">All Chapters</a></li>';
    chapters.forEach(chapter => {
        chapterFilter.innerHTML += `<li><a class="dropdown-item" href="#" data-value="${chapter.chapter_id}">${chapter.chapter_name}</a></li>`;
    });

    // Month filter
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthFilter = document.getElementById('month-filter');
    monthFilter.innerHTML = '<li><a class="dropdown-item" href="#" data-value="">All Months</a></li>';
    months.forEach((month, index) => {
        monthFilter.innerHTML += `<li><a class="dropdown-item" href="#" data-value="${index + 1}">${month}</a></li>`;
    });

    // Year filter
    const years = [...new Set(allTransactions.map(t => new Date(t.payment_time).getFullYear()))];
    const yearFilter = document.getElementById('year-filter');
    yearFilter.innerHTML = '<li><a class="dropdown-item" href="#" data-value="">All Years</a></li>';
    years.forEach(year => {
        yearFilter.innerHTML += `<li><a class="dropdown-item" href="#" data-value="${year}">${year}</a></li>`;
    });

    // Payment type filter
    const paymentTypeFilter = document.getElementById('payment-type-filter');
    paymentTypeFilter.innerHTML = '<li><a class="dropdown-item" href="#" data-value="">All Payment Types</a></li>';
    universalLinks.forEach(link => {
        paymentTypeFilter.innerHTML += `<li><a class="dropdown-item" href="#" data-value="${link.id}">${link.universal_link_name}</a></li>`;
    });

    // Payment status filter
    const statuses = [...new Set(allTransactions.map(t => t.payment_status))];
    const statusFilter = document.getElementById('payment-status-filter');
    statusFilter.innerHTML = '<li><a class="dropdown-item" href="#" data-value="">All Statuses</a></li>';
    statuses.forEach(status => {
        statusFilter.innerHTML += `<li><a class="dropdown-item" href="#" data-value="${status}">${status}</a></li>`;
    });

    // Payment method filter
    const methods = [...new Set(allTransactions.map(t => t.payment_group))];
    const methodFilter = document.getElementById('payment-method-filter');
    methodFilter.innerHTML = '<li><a class="dropdown-item" href="#" data-value="">All Methods</a></li>';
    methods.forEach(method => {
        methodFilter.innerHTML += `<li><a class="dropdown-item" href="#" data-value="${method}">${method.toUpperCase()}</a></li>`;
    });
}

// Function to fetch e-invoice data
async function fetchEInvoiceData(orderId) {
    try {
        const response = await fetch(`http://localhost:5000/api/einvoice/${orderId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch e-invoice data');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching e-invoice data:', error);
        return null;
    }
}

// Function to get e-invoice details
async function getEInvoiceDetails(transaction, order) {
    // For unsettled transactions (including cash)
    if (!transaction.is_settled) {
        return {
            irn: 'Not Applicable',
            qrCode: 'Not Applicable',
            eInvoiceStatus: 'Not Applicable',
            cancelIRN: 'Not Applicable'
        };
    }

    // Only show e-invoice actions if einvoice_generated === true
    if (!transaction.einvoice_generated) {
        return {
            irn: 'Not Applicable',
            qrCode: 'Not Applicable',
            eInvoiceStatus: `<button style="color:#fff;background:#22e2a1;border:1.5px solid #22e2a1;font-weight:500;padding:4px 16px;border-radius:6px;" onclick="generateEInvoice('${order.order_id}')">Generate E-Invoice</button>`,
            cancelIRN: 'Not Applicable'
        };
    }

    // Fetch e-invoice data if not already fetched
    const eInvoiceData = await fetchEInvoiceData(order.order_id);
    if (!eInvoiceData) {
        return {
            irn: 'N/A',
            qrCode: `<span class="gradient-qr-text" onclick="generateQRCode('${order.order_id}')">Generate QR Code</span>`,
            eInvoiceStatus: `<span class="view-einvoice-link" onclick="viewEInvoice('${order.order_id}')">View E-Invoice</span>`,
            cancelIRN: `<button class="btn btn-danger btn-sm" onclick="cancelIRN('${order.order_id}')">Cancel IRN</button>`
        };
    }

    if (eInvoiceData.is_gst_number === false) {
        return {
            irn: 'Without GST Invoice',
            qrCode: 'Without GST Invoice',
            eInvoiceStatus: `<span class="view-einvoice-link" onclick="viewEInvoice('${order.order_id}')">View E-Invoice</span>`,
            cancelIRN: 'Without GST Invoice'
        };
    }

    // Check if IRN is cancelled
    if (eInvoiceData.is_cancelled) {
        return {
            irn: eInvoiceData.irn || 'N/A',
            qrCode: `<span class="gradient-qr-text" onclick="generateQRCode('${order.order_id}')">Generate QR Code</span>`,
            eInvoiceStatus: `<span class="view-einvoice-link" onclick="viewEInvoice('${order.order_id}')">View E-Invoice</span>`,
            cancelIRN: `<button class="btn btn-danger btn-sm" style="background-color: #ffcccc; border-color: #ffcccc; color: #666; cursor: not-allowed;" disabled>Cancelled</button>`
        };
    }

    return {
        irn: eInvoiceData.irn || 'N/A',
        qrCode: `<span class="gradient-qr-text" onclick="generateQRCode('${order.order_id}')">Generate QR Code</span>`,
        eInvoiceStatus: `<span class="view-einvoice-link" onclick="viewEInvoice('${order.order_id}')">View E-Invoice</span>`,
        cancelIRN: `<button class="btn btn-danger btn-sm" onclick="cancelIRN('${order.order_id}')">Cancel IRN</button>`
    };
}

// Function to generate e-invoice
async function generateEInvoice(orderId) {
    try {
        // Find the order and transaction objects
        const order = allOrders.find(o => o.order_id === orderId);
        const transaction = allTransactions.find(t => t.order_id === orderId);
        const chapter = chapters.find(c => c.chapter_id === order?.chapter_id);
        const universalLink = universalLinks.find(ul => ul.id === order?.universal_link_id);

        if (!order || !transaction) {
            toastr.error('Order or transaction not found');
            return;
        }

        // First SweetAlert - Initial confirmation
        const result = await Swal.fire({
            title: "Are you sure?",
            text: `You are about to generate IRN and QR code for Order ID: ${orderId} and Transaction ID: ${transaction.cf_payment_id}.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Generate!",
            cancelButtonText: "No, Cancel",
        });

        if (result.isConfirmed) {
            // Second SweetAlert - Details confirmation
            const secondResult = await Swal.fire({
                title: "Please check the details",
                html: `
                    <strong>Member Name:</strong> ${order?.member_name || 'N/A'}<br>
                    <strong>Chapter Name:</strong> ${chapter?.chapter_name || 'N/A'}<br>
                    <strong>Email:</strong> ${order?.customer_email || 'N/A'}<br>
                    <strong>Phone:</strong> ${order?.customer_phone || 'N/A'}<br>
                    <strong>Company Name:</strong> ${order?.company || 'N/A'}<br>
                    <strong>Company GST No:</strong> ${order?.gstin || 'N/A'}<br>
                    <strong>Payment Description:</strong> ${universalLink?.universal_link_name || 'N/A'}<br>
                    <strong>Amount:</strong> ₹ ${transaction.payment_amount}
                `,
                icon: "info",
                showCancelButton: true,
                confirmButtonText: "Confirm and Generate",
                cancelButtonText: "Cancel",
            });

            if (secondResult.isConfirmed) {
                // Show loading SweetAlert
                const loadingSwal = Swal.fire({
                    title: "Fetching IRN and QR code",
                    html: "Please wait while we fetch the IRN and QR code...",
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                // Prepare invoice data
                const invoiceData = {
                    orderId: order,
                    transactionId: transaction,
                    amount: transaction.payment_amount,
                    chapterName: chapter?.chapter_name || 'N/A',
                    gatewayName: 'Cashfree',
                    universalLinkName: universalLink?.universal_link_name || 'N/A',
                };

                // Make API call
                const response = await fetch('http://localhost:5000/einvoice/generate-irn', {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(invoiceData),
                });

                // Close loading SweetAlert
                await loadingSwal.close();

                if (response.ok) {
                    toastr.success('E-Invoice generated successfully');
                    // Refresh data to show updated status
                    await fetchAllData();
                } else {
                    toastr.error('Failed to generate E-Invoice');
                }
            }
        }
    } catch (error) {
        console.error('Error generating E-Invoice:', error);
        toastr.error('Failed to generate E-Invoice');
    }
}

// Function to view e-invoice
async function viewEInvoice(orderId) {
    try {
        const eInvoiceData = await fetchEInvoiceData(orderId);
        if (!eInvoiceData) {
            toastr.error('Failed to fetch e-invoice data');
            return;
        }

        // Find the order and transaction objects
        const order = allOrders.find(o => o.order_id === orderId);
        const transaction = allTransactions.find(t => t.order_id === orderId);
        const chapter = chapters.find(c => c.chapter_id === order?.chapter_id);
        const universalLink = universalLinks.find(ul => ul.id === order?.universal_link_id);

        // Compose invoiceData and einvoiceData as per the sample URL
        const invoiceData = {
            orderId: order,
            transactionId: transaction,
            amount: order?.order_amount,
            chapterName: chapter ? chapter.chapter_name : 'N/A',
            gatewayName: 'Unknown', // Set as needed or fetch if available
            universalLinkName: universalLink ? universalLink.universal_link_name : 'Not Applicable'
        };
        const einvoiceData = eInvoiceData;

        const url = `/v/einvoice?invoiceData=${encodeURIComponent(JSON.stringify(invoiceData))}&einvoiceData=${encodeURIComponent(JSON.stringify(einvoiceData))}`;
        window.open(url, '_blank');
    } catch (error) {
        console.error('Error viewing e-invoice:', error);
        toastr.error('Failed to view e-invoice');
    }
}

// Helper function to get PG Status badge
function getPGStatusBadge(status) {
    if (!status) return '';
    const normalized = status.toLowerCase();
    if (normalized === 'success') {
        return '<span style="background:#22e2a1;color:#fff;padding:2px 10px;border-radius:6px;font-weight:600;display:inline-block;">success</span>';
    } else if (normalized === 'failed') {
        return '<span style="background:#ff4d4f;color:#fff;padding:2px 10px;border-radius:6px;font-weight:600;display:inline-block;">failed</span>';
    } else if (normalized === 'not_attempted') {
        return '<span style="background:#ff4d4f;color:#fff;padding:2px 10px;border-radius:6px;font-weight:600;display:inline-block;">not_attempted</span>';
    } else if (normalized === 'pending') {
        return '<span style="background:#ffe066;color:#000;padding:2px 10px;border-radius:6px;font-weight:600;display:inline-block;">pending</span>';
    } else if (normalized === 'user_dropped') {
        return '<span style="background:#fff3cd;color:#856404;padding:2px 10px;border-radius:6px;font-weight:600;display:inline-block;">user_dropped</span>';
    } else {
        return `<span style=\"background:#eee;color:#000;padding:2px 10px;border-radius:6px;font-weight:600;display:inline-block;\">${status}</span>`;
    }
}

// Helper function to get payment method image and label
function getPaymentMethodHTML(method) {
    if (!method) return 'N/A';
    const normalized = method.toLowerCase();
    if (normalized === 'upi') {
        return `<img src="../../assets/images/upi.webp" alt="UPI" style="height:18px;vertical-align:middle;margin-right:6px;"> <span style="vertical-align:middle;">UPI</span>`;
    } else if (normalized === 'net_banking') {
        return `<img src="../../assets/images/netbanking.png" alt="Net Banking" style="height:18px;vertical-align:middle;margin-right:6px;"> <span style="vertical-align:middle;">Net Banking</span>`;
    } else if (normalized === 'debit_card') {
        return `<img src="../../assets/images/mastercard.jpg" alt="Debit Card" style="height:18px;vertical-align:middle;margin-right:6px;"> <span style="vertical-align:middle;">DEBIT CARD</span>`;
    } else if (normalized === 'credit_card') {
        return `<img src="../../assets/images/mastercard.jpg" alt="Credit Card" style="height:18px;vertical-align:middle;margin-right:6px;"> <span style="vertical-align:middle;">CREDIT CARD</span>`;
    } else {
        return `<span>${method.toUpperCase()}</span>`;
    }
}

// Helper to show invoice modal
function showInvoiceModal(orderId) {
    const modal = new bootstrap.Modal(document.getElementById('invoiceModal'));
    const iframe = document.getElementById('invoiceIframe');
    iframe.src = `/t/view-invoice?order_id=${orderId}`;
    modal.show();
}

// Function to display transactions in the table
async function displayTransactions() {
    const tableBody = document.getElementById('transactionsTableBody');
    if (!tableBody) {
        console.error('Transactions table body not found');
        return;
    }

    tableBody.innerHTML = '';

    // Filter transactions based on current filters
    const filteredTransactions = filterTransactions();
    
    // Calculate pagination
    totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const startIndex = showAll ? 0 : (currentPage - 1) * itemsPerPage;
    const endIndex = showAll ? filteredTransactions.length : startIndex + itemsPerPage;
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

    const noTransactionsRow = document.getElementById('no-transactions-row');
    if (noTransactionsRow) {
        noTransactionsRow.style.display = filteredTransactions.length === 0 ? 'table-row' : 'none';
    }

    if (filteredTransactions.length === 0) {
        return;
    }

    // Process transactions sequentially to handle async e-invoice data fetching
    for (let i = 0; i < paginatedTransactions.length; i++) {
        const transaction = paginatedTransactions[i];
        const order = allOrders.find(o => o.order_id === transaction.order_id);
        if (!order) continue;

        const chapter = chapters.find(c => c.chapter_id === order.chapter_id);
        const universalLink = universalLinks.find(ul => ul.id === order.universal_link_id);
        const settlementDetails = getSettlementDetails(transaction);
        const eInvoiceDetails = await getEInvoiceDetails(transaction, order);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${startIndex + i + 1}</td>
            <td>${formatDate(transaction.payment_time)}</td>
            <td><img src="../../assets/images/avatar.png" alt="avatar" style="height:22px;width:22px;border-radius:50%;vertical-align:middle;margin-right:8px;"> ${order.member_name || formatNA('Not Applicable')}</td>
            <td><b><i>${chapter ? chapter.chapter_name : formatNA('Not Applicable')}</i></b></td>
            <td><div><b>${formatINR(order.order_amount)}</b></div><div><span class="text-success" style="cursor:pointer;font-weight:500;" onclick="showInvoiceModal('${order.order_id}')">View</span></div></td>
            <td>${getPaymentMethodHTML(transaction.payment_group)}</td>
            <td><i>${universalLink ? universalLink.universal_link_name : formatNA('Not Applicable')}</i></td>
            <td>${getPGStatusBadge(transaction.payment_status)}</td>
            <td><i>${order.order_id || formatNA('Not Applicable')}</i></td>
            <td><b><i>${transaction.cf_payment_id || formatNA('Not Applicable')}</i></b></td>
            <td>Cashfree</td>
            <td>${getSettlementStatusHTML(transaction, order)}</td>
            <td><b>${formatNA(settlementDetails.utr)}</b></td>
            <td><b>${formatNA(settlementDetails.time)}</b></td>
            <td>${formatNA(eInvoiceDetails.irn)}</td>
            <td>${formatNA(eInvoiceDetails.qrCode)}</td>
            <td>${formatNA(eInvoiceDetails.eInvoiceStatus)}</td>
            <td>${formatNA(eInvoiceDetails.cancelIRN)}</td>
        `;
        tableBody.appendChild(row);
    }

    // Update pagination UI
    updatePagination(filteredTransactions.length);
}

// Function to update pagination UI
function updatePagination(totalItems) {
    const paginationContainer = document.querySelector('.pagination');
    if (!paginationContainer) return;

    // Calculate total pages
    totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // Generate pagination HTML
    let paginationHTML = `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="javascript:void(0);" onclick="changePage(${currentPage - 1})" aria-label="Previous">
                <span aria-hidden="true">&laquo;</span>
            </a>
        </li>
    `;

    // Show page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // First page
    if (startPage > 1) {
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="javascript:void(0);" onclick="changePage(1)">1</a>
            </li>
        `;
        if (startPage > 2) {
            paginationHTML += `
                <li class="page-item disabled">
                    <span class="page-link">...</span>
                </li>
            `;
        }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `
            <li class="page-item ${currentPage === i ? 'active' : ''}">
                <a class="page-link" href="javascript:void(0);" onclick="changePage(${i})">${i}</a>
            </li>
        `;
    }

    // Last page
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `
                <li class="page-item disabled">
                    <span class="page-link">...</span>
                </li>
            `;
        }
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="javascript:void(0);" onclick="changePage(${totalPages})">${totalPages}</a>
            </li>
        `;
    }

    // Next button
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="javascript:void(0);" onclick="changePage(${currentPage + 1})" aria-label="Next">
                <span aria-hidden="true">&raquo;</span>
            </a>
        </li>
    `;

    // Add Show All button
    paginationHTML += `
        <li class="page-item ms-2">
            <button class="btn btn-outline-primary" onclick="toggleShowAll()">
                ${showAll ? 'Show Paginated' : 'Show All'}
            </button>
        </li>
    `;

    paginationContainer.innerHTML = paginationHTML;
}

// Function to toggle show all
function toggleShowAll() {
    showAll = !showAll;
    if (!showAll) {
        currentPage = 1; // Reset to first page when switching back to paginated view
    }
    displayTransactions();
    // Scroll to top of table
    const table = document.querySelector('.table-responsive');
    if (table) {
        table.scrollIntoView({ behavior: 'smooth' });
    }
}

// Function to change page
function changePage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    showAll = false; // Reset show all when changing pages
    displayTransactions();
    // Scroll to top of table
    const table = document.querySelector('.table-responsive');
    if (table) {
        table.scrollIntoView({ behavior: 'smooth' });
    }
}

// Function to filter transactions based on current filters
function filterTransactions() {
    const searchTerm = document.getElementById('searchChapterInput').value.toLowerCase().trim();
    
    let filteredTransactions = allTransactions.filter(transaction => {
        const order = allOrders.find(o => o.order_id === transaction.order_id);
        if (!order) return false;

        // Apply search filter
        if (searchTerm) {
            const memberName = (order.member_name || '').toLowerCase();
            if (!memberName.includes(searchTerm)) return false;
        }

        // Apply region filter
        if (currentFilters.region && order.region_id !== parseInt(currentFilters.region)) {
            return false;
        }

        // Apply chapter filter
        if (currentFilters.chapter && order.chapter_id !== parseInt(currentFilters.chapter)) {
            return false;
        }

        // Apply payment type filter
        if (currentFilters.paymentType && order.universal_link_id !== parseInt(currentFilters.paymentType)) {
            return false;
        }

        // Apply payment status filter
        if (currentFilters.paymentStatus && transaction.payment_status !== currentFilters.paymentStatus) {
            return false;
        }

        // Apply payment method filter
        if (currentFilters.paymentMethod && transaction.payment_group !== currentFilters.paymentMethod) {
            return false;
        }

        // Apply month and year filters
        if (currentFilters.month || currentFilters.year) {
            const paymentDate = new Date(transaction.payment_time);
            if (currentFilters.month && paymentDate.getMonth() + 1 !== parseInt(currentFilters.month)) {
                return false;
            }
            if (currentFilters.year && paymentDate.getFullYear() !== parseInt(currentFilters.year)) {
                return false;
            }
        }

        return true;
    });

    // Sort transactions in descending order by payment time
    return filteredTransactions.sort((a, b) => {
        const dateA = new Date(a.payment_time);
        const dateB = new Date(b.payment_time);
        return dateB - dateA;
    });
}

// Function to handle filter selection
function handleFilterSelection(filterType, value) {
    currentFilters[filterType] = value;
    // Update the dropdown button text
    const dropdownButton = document.querySelector(`[data-bs-toggle="dropdown"][aria-expanded="true"]`);
    if (dropdownButton) {
        const selectedText = value ? document.querySelector(`#${filterType}-filter a[data-value="${value}"]`).textContent : 'All';
        dropdownButton.innerHTML = `<i class="ti ti-sort-descending-2 me-1"></i> ${filterType.charAt(0).toUpperCase() + filterType.slice(1)}: ${selectedText}`;
    }
}

// Function to cancel IRN
async function cancelIRN(orderId) {
    try {
        // Find the order and get IRN
        const order = allOrders.find(o => o.order_id === orderId);
        const eInvoiceData = await fetchEInvoiceData(orderId);
        
        if (!eInvoiceData || !eInvoiceData.irn) {
            toastr.error('IRN not found');
            return;
        }

        const irn = eInvoiceData.irn;

        // First SweetAlert - Initial confirmation
        const result = await Swal.fire({
            title: "Are you sure?",
            html: `Are you sure to cancel IRN for <b>${irn}</b>?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Cancel IRN",
            cancelButtonText: "No"
        });

        if (result.isConfirmed) {
            // Second SweetAlert - Enter cancellation reason
            const secondResult = await Swal.fire({
                title: "Enter Cancel Reason",
                input: "textarea",
                inputPlaceholder: "Enter the reason for cancellation...",
                showCancelButton: true,
                confirmButtonText: "Cancel IRN",
                preConfirm: (remarks) => {
                    if (!remarks) {
                        Swal.showValidationMessage("Please enter a reason!");
                    }
                    return remarks;
                }
            });

            if (secondResult.isConfirmed) {
                // Show loading SweetAlert
                const loadingSwal = Swal.fire({
                    title: "Cancelling IRN",
                    html: "Please wait while we process your request...",
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });

                // Make API call
                const response = await fetch('http://localhost:5000/einvoice/cancel-irn', {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        Irn: irn,
                        CnlRsn: 1,
                        CnlRem: secondResult.value
                    })
                });

                // Close loading SweetAlert
                await loadingSwal.close();

                if (response.ok) {
                    toastr.success('IRN cancelled successfully');
                    // Redirect to cancelled IRNs page
                    window.location.href = '/t/cancelled-irns';
                } else {
                    toastr.error('Failed to cancel IRN');
                }
            }
        }
    } catch (error) {
        console.error('Error cancelling IRN:', error);
        toastr.error('Failed to cancel IRN');
    }
}

// Function to reset all filters
function resetAllFilters() {
    // Reset filter values
    currentFilters = {
        region: '',
        chapter: '',
        month: '',
        year: '',
        paymentType: '',
        paymentStatus: '',
        paymentMethod: ''
    };

    // Reset dropdown button texts
    document.querySelectorAll('[data-bs-toggle="dropdown"]').forEach(button => {
        const filterType = button.closest('.dropdown').querySelector('.dropdown-menu').id.split('-')[0];
        button.innerHTML = `<i class="ti ti-sort-descending-2 me-1"></i> ${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`;
    });

    // Clear search input
    document.getElementById('searchChapterInput').value = '';

    // Reset pagination
    currentPage = 1;
    showAll = false;

    // Refresh display
    displayTransactions();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initial data fetch
    fetchAllData();

    // Filter event listeners
    document.querySelectorAll('.dropdown-menu a').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const filterType = e.target.closest('.dropdown-menu').id.split('-')[0];
            const value = e.target.dataset.value;
            handleFilterSelection(filterType, value);
        });
    });

    // Apply filters button
    document.getElementById('apply-filters-btn').addEventListener('click', () => {
        currentPage = 1;
        showAll = false;
        displayTransactions();
    });

    // Reset filters button
    document.getElementById('reset-filters-btn').addEventListener('click', resetAllFilters);

    // Search functionality
    document.getElementById('searchChapterInput').addEventListener('input', (e) => {
        currentPage = 1;
        showAll = false;
        displayTransactions();
    });
});

// Function to generate QR code
async function generateQRCode(orderId) {
    try {
        // Find the span and replace it with loading text
        const qrSpan = document.querySelector(`span.gradient-qr-text[onclick="generateQRCode('${orderId}')"]`);
        if (qrSpan) {
            qrSpan.innerHTML = 'Loading...';
            qrSpan.style.pointerEvents = 'none';
            qrSpan.style.opacity = '0.6';
        }

        // Wait for 2 seconds
        await new Promise(resolve => setTimeout(resolve, 2000));

        const eInvoiceData = await fetchEInvoiceData(orderId);
        if (!eInvoiceData || !eInvoiceData.qrcode) {
            toastr.error('Failed to generate QR code');
            if (qrSpan) {
                qrSpan.innerHTML = 'Generate QR Code';
                qrSpan.style.pointerEvents = '';
                qrSpan.style.opacity = '';
            }
            return;
        }

        // Create QR code image with custom class
        const qrCodeImg = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=50x50&data=${encodeURIComponent(eInvoiceData.qrcode)}" alt="QR Code" class="custom-qr-img">`;

        if (qrSpan) {
            qrSpan.outerHTML = qrCodeImg;
        }
    } catch (error) {
        console.error('Error generating QR code:', error);
        toastr.error('Failed to generate QR code');
    }
}
