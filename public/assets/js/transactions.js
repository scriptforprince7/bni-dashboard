// Global variables to store data
let allOrders = [];
let allTransactions = [];
let chapters = [];
let universalLinks = [];
let regions = []; // Add regions array
let allExpenses = [];
let allDocNumbers = [];
let currentFilters = {
    region: '',
    chapter: '',
    month: '',
    year: '',
    paymentType: '',
    paymentStatus: '',
    paymentMethod: '',
    einvoiceStatus: '' // Add new filter
};

// Pagination variables
let currentPage = 1;
const itemsPerPage = 50;
let totalPages = 1;
let showAll = false; // Add show all flag

// Mapping of dropdown menu IDs to currentFilters keys
const filterIdToKey = {
    'region-filter': 'region',
    'chapter-filter': 'chapter',
    'month-filter': 'month',
    'year-filter': 'year',
    'payment-type-filter': 'paymentType',
    'payment-status-filter': 'paymentStatus',
    'payment-method-filter': 'paymentMethod',
    'einvoice-status-filter': 'einvoiceStatus'
};

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

        // Fetch all data in parallel (add allExpenses and allDocNumbers)
        const [ordersResponse, transactionsResponse, chaptersResponse, universalLinksResponse, regionsResponse, expensesResponse, docNumbersResponse] = await Promise.all([
            fetch('https://backend.bninewdelhi.com/api/allOrders'),
            fetch('https://backend.bninewdelhi.com/api/allTransactions'),
            fetch('https://backend.bninewdelhi.com/api/chapters'),
            fetch('https://backend.bninewdelhi.com/api/universalLinks'),
            fetch('https://backend.bninewdelhi.com/api/regions'),
            fetch('https://backend.bninewdelhi.com/api/allExpenses'),
            fetch('https://backend.bninewdelhi.com/api/getAllDocNumbers')
        ]);

        if (!ordersResponse.ok || !transactionsResponse.ok || !chaptersResponse.ok || !universalLinksResponse.ok || !regionsResponse.ok || !expensesResponse.ok || !docNumbersResponse.ok) {
            throw new Error('Failed to fetch data from one or more endpoints');
        }

        allOrders = await ordersResponse.json();
        allTransactions = await transactionsResponse.json();
        chapters = await chaptersResponse.json();
        universalLinks = await universalLinksResponse.json();
        regions = await regionsResponse.json();
        allExpenses = await expensesResponse.json();
        allDocNumbers = await docNumbersResponse.json();

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
    document.getElementById('no_of_transaction').textContent = allTransactions.length;
    
    // Total generated invoice (transactions with einvoice_generated = true)
    const einvoiceGeneratedCount = allTransactions.filter(t => t.einvoice_generated === true).length;
    document.getElementById('settled_transaction').textContent = einvoiceGeneratedCount;
    
    // Total pending invoice (transactions with payment_status = 'SUCCESS' and einvoice_generated = false)
    const pendingEinvoiceCount = allTransactions.filter(t => 
        t.payment_status === 'SUCCESS' && 
        t.einvoice_generated === false && 
        allOrders.some(o => o.order_id === t.order_id) // Only count if order exists
    ).length;
    document.getElementById('not_settle_transaction').textContent = pendingEinvoiceCount;

    // Add click event for pending invoices
    const pendingInvoicesElem = document.getElementById('not_settle_transaction');
    if (pendingInvoicesElem && !pendingInvoicesElem.hasAttribute('data-listener')) {
        pendingInvoicesElem.setAttribute('data-listener', 'true');
        pendingInvoicesElem.style.cursor = 'pointer';
        pendingInvoicesElem.addEventListener('click', function() {
            showPendingInvoicesDetails();
        });
    }

    // Calculate total GST from expenses where payment_status is 'paid'
    let totalInputGst = 0;
    if (Array.isArray(allExpenses)) {
        allExpenses.forEach(exp => {
            if (exp.payment_status === 'paid') {
                const gst = parseFloat(exp.gst_amount);
                if (!isNaN(gst)) totalInputGst += gst;
            }
        });
    }
    document.getElementById('total_base_amount').textContent = formatINR(totalInputGst.toFixed(2));

    // Calculate total output GST for generated and pending invoices
    let totalGstAmountGenerated = 0;
    let totalGstAmountPending = 0;
    allOrders.forEach(order => {
        const transaction = allTransactions.find(t => t.order_id === order.order_id);
        if (transaction && transaction.payment_status === 'SUCCESS') {
            const tax = parseFloat(order.tax);
            if (!isNaN(tax)) {
                if (transaction.einvoice_generated === true) {
                    totalGstAmountGenerated += tax;
                } else if (transaction.einvoice_generated === false) {
                    totalGstAmountPending += tax;
                }
            }
        }
    });
    const totalGstAmount = totalGstAmountGenerated + totalGstAmountPending;
    const gstElem = document.getElementById('total_gst_amount');
    if (gstElem) {
        gstElem.textContent = formatINR(totalGstAmount.toFixed(2));
        gstElem.style.cursor = 'pointer';
        if (!gstElem.hasAttribute('data-listener')) {
            gstElem.setAttribute('data-listener', 'true');
            gstElem.addEventListener('click', function() {
                Swal.fire({
                    title: 'Output GST Bifurcation',
                    html: `
                        <div style="text-align:left;font-size:1.1em;">
                            <b>Total Output GST:</b> ${formatINR(totalGstAmount.toFixed(2))}<br><br>
                            <b style="color:#222;">Generated Invoice Output GST:</b> ${formatINR(totalGstAmountGenerated.toFixed(2))}<br>
                            <b style="color:#888;">Pending Invoice Output GST:</b> ${formatINR(totalGstAmountPending.toFixed(2))}
                        </div>
                    `,
                    icon: 'info',
                    confirmButtonText: 'Close',
                    customClass: {
                        popup: 'swal2-border-radius'
                    }
                });
            });
        }
    }

    // Add click event for showing transaction status breakdown
    const noOfTransactionElem = document.getElementById('no_of_transaction');
    if (noOfTransactionElem && !noOfTransactionElem.hasAttribute('data-listener')) {
        noOfTransactionElem.setAttribute('data-listener', 'true');
        noOfTransactionElem.style.cursor = 'pointer';
        noOfTransactionElem.addEventListener('click', function() {
            const statusCounts = {
                SUCCESS: 0,
                USER_DROPPED: 0,
                FAILED: 0,
                NOT_ATTEMPTED: 0
            };
            allTransactions.forEach(t => {
                const status = (t.payment_status || '').toUpperCase();
                if (statusCounts.hasOwnProperty(status)) {
                    statusCounts[status]++;
                }
            });
            Swal.fire({
                title: 'Transaction Status Breakdown',
                html: `
                    <div style="text-align:left;font-size:1.1em;">
                        <b>Total Transactions:</b> ${allTransactions.length}<br><br>
                        <b style="color:#22e2a1;">SUCCESS:</b> ${statusCounts.SUCCESS}<br>
                        <b style="color:#ff9800;">USER_DROPPED:</b> ${statusCounts.USER_DROPPED}<br>
                        <b style="color:#ff4d4f;">FAILED:</b> ${statusCounts.FAILED}<br>
                        <b style="color:#607d8b;">NOT_ATTEMPTED:</b> ${statusCounts.NOT_ATTEMPTED}<br>
                    </div>
                `,
                icon: 'info',
                confirmButtonText: 'Close',
                customClass: {
                    popup: 'swal2-border-radius'
                }
            });
        });
    }

    // In updateDashboardStats, add click event for generated invoices
    const generatedInvoicesElem = document.getElementById('settled_transaction');
    if (generatedInvoicesElem && !generatedInvoicesElem.hasAttribute('data-listener')) {
        generatedInvoicesElem.setAttribute('data-listener', 'true');
        generatedInvoicesElem.style.cursor = 'pointer';
        generatedInvoicesElem.addEventListener('click', function() {
            showGeneratedInvoicesDetails();
        });
    }
}

// Function to show pending invoices details
function showPendingInvoicesDetails() {
    // Get all pending invoices (successful transactions without e-invoice)
    const pendingInvoices = allTransactions.filter(t =>
        t.payment_status === 'SUCCESS' &&
        t.einvoice_generated === false
    );

    let renderedCount = 0; // Counter for actually rendered rows

    // Start HTML content for the popup
    let htmlContent = `
        <div style="text-align:left;font-size:1.1em;">
            <b>Total Pending Invoices:</b> <span id="pending-invoice-count"></span><br><br>
            <div style="max-height:400px;overflow-y:auto;">
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Member/Visitor</th>
                            <th>Chapter</th>
                            <th>Amount</th>
                            <th>Payment Method</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    // Add each pending invoice to the table
    pendingInvoices.forEach(transaction => {
        const order = allOrders.find(o => o.order_id === transaction.order_id);
        if (!order) return; // Skip if order not found

        renderedCount++; // Only increment if row is rendered

        const chapter = chapters.find(c => c.chapter_id === order.chapter_id);

        // Format member/visitor name
        let memberName = '';
        if (order.payment_note && (order.payment_note.toLowerCase() === 'visitor payment' ||
            order.payment_note.toLowerCase() === 'visitor-payment' ||
            order.payment_note.toLowerCase() === 'new member payment')) {
            memberName = `${order.visitor_name || 'N/A'} (Invited by: ${order.member_name || 'N/A'})`;
        } else {
            memberName = order.member_name || 'N/A';
        }

        // Button logic based on is_settled
        let actionButton = '';
        if (transaction.is_settled) {
            actionButton = `<button class="btn btn-primary btn-sm" onclick="generateEInvoice('${order.order_id}')">Generate E-Invoice</button>`;
        } else {
            actionButton = `<button class="btn btn-secondary btn-sm" disabled title="Settlement Pending">Generate E-Invoice</button>`;
        }

        htmlContent += `
            <tr>
                <td>${formatDate(transaction.payment_time)}</td>
                <td>${memberName}</td>
                <td>${chapter?.chapter_name || 'N/A'}</td>
                <td>${formatINR(transaction.payment_amount)}</td>
                <td>${getPaymentMethodHTML(transaction.payment_group)}</td>
                <td>
                    ${actionButton}
                </td>
            </tr>
        `;
    });

    htmlContent += `
                    </tbody>
                </table>
            </div>
        </div>
        <script>document.getElementById('pending-invoice-count').textContent = '${renderedCount}';</script>
    `;

    // Show the popup
    Swal.fire({
        title: 'Pending Invoices Details',
        html: htmlContent,
        width: '80%',
        showCloseButton: true,
        showConfirmButton: false,
        customClass: {
            popup: 'swal2-border-radius'
        },
        didOpen: () => {
            document.getElementById('pending-invoice-count').textContent = renderedCount;
        }
    });
}

// Function to show generated invoices details
function showGeneratedInvoicesDetails() {
    // Get all generated invoices (transactions with einvoice_generated = true and valid order)
    const generatedInvoices = allTransactions.filter(t =>
        t.einvoice_generated === true &&
        allOrders.some(o => o.order_id === t.order_id)
    );

    // Sort by payment_time in descending order (most recent first)
    generatedInvoices.sort((a, b) => new Date(b.payment_time) - new Date(a.payment_time));

    let renderedCount = 0;
    let htmlContent = `
        <div style="text-align:left;font-size:1.1em;">
            <b>Total Generated Invoices:</b> <span id="generated-invoice-count"></span><br><br>
            <div style="max-height:400px;overflow-y:auto;">
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>Sr No.</th>
                            <th>Date</th>
                            <th>Member/Visitor</th>
                            <th>Chapter</th>
                            <th>Amount</th>
                            <th>Payment Method</th>
                            <th>Payment Type</th>
                            <th>Document No.</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    generatedInvoices.forEach(transaction => {
        const order = allOrders.find(o => o.order_id === transaction.order_id);
        if (!order) return;
        renderedCount++;
        const chapter = chapters.find(c => c.chapter_id === order.chapter_id);
        const universalLink = universalLinks.find(ul => ul.id === order.universal_link_id);
        // Format member/visitor name
        let memberName = '';
        if (order.payment_note && (order.payment_note.toLowerCase() === 'visitor payment' ||
            order.payment_note.toLowerCase() === 'visitor-payment' ||
            order.payment_note.toLowerCase() === 'new member payment')) {
            memberName = `${order.visitor_name || 'N/A'} (Invited by: ${order.member_name || 'N/A'})`;
        } else {
            memberName = order.member_name || 'N/A';
        }
        // Document No.
        const docNo = getDocumentNumber(order.order_id);
        htmlContent += `
            <tr>
                <td>${renderedCount}</td>
                <td>${formatDate(transaction.payment_time)}</td>
                <td>${memberName}</td>
                <td>${chapter?.chapter_name || 'N/A'}</td>
                <td>${formatINR(transaction.payment_amount)}</td>
                <td>${getPaymentMethodHTML(transaction.payment_group)}</td>
                <td>${getPaymentTypeDisplay(order, universalLink)}</td>
                <td><b>${formatNA(docNo)}</b></td>
                <td>
                    <button class="btn btn-success btn-sm" onclick="viewEInvoice('${order.order_id}')">
                        View E-Invoice
                    </button>
                </td>
            </tr>
        `;
    });

    htmlContent += `
                    </tbody>
                </table>
            </div>
        </div>
        <script>document.getElementById('generated-invoice-count').textContent = '${renderedCount}';</script>
    `;

    Swal.fire({
        title: 'Generated Invoices Details',
        html: htmlContent,
        width: '80%',
        showCloseButton: true,
        showConfirmButton: false,
        customClass: {
            popup: 'swal2-border-radius'
        },
        didOpen: () => {
            document.getElementById('generated-invoice-count').textContent = renderedCount;
        }
    });
}

// Function to attach filter dropdown listeners
function attachFilterListeners() {
    document.querySelectorAll('.dropdown-menu a').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const menuId = e.target.closest('.dropdown-menu').id;
            const filterType = filterIdToKey[menuId];
            const value = e.target.dataset.value;
            handleFilterSelection(filterType, value);

            // Update dropdown label to show selected value
            const dropdown = e.target.closest('.dropdown');
            const dropdownButton = dropdown.querySelector('.dropdown-toggle');
            let baseLabel = dropdownButton.textContent.split(':')[0].trim();
            if (baseLabel.includes(' ')) baseLabel = baseLabel.replace(/\s+$/, '');
            dropdownButton.innerHTML = `<i class="ti ti-sort-descending-2 me-1"></i> ${baseLabel}: ${e.target.textContent}`;
        });
    });
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
    // Add Requisition Payment option
    paymentTypeFilter.innerHTML += `<li><a class="dropdown-item" href="#" data-value="requisition-payment">Requisition Payment</a></li>`;

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

    // E-Invoice Status filter
    const einvoiceStatusFilter = document.getElementById('einvoice-status-filter');
    einvoiceStatusFilter.innerHTML = `
        <li><a class="dropdown-item" href="#" data-value="">All Statuses</a></li>
        <li><a class="dropdown-item" href="#" data-value="generated">Generated</a></li>
        <li><a class="dropdown-item" href="#" data-value="to_be_generated">To Be Generated</a></li>
        <li><a class="dropdown-item" href="#" data-value="cancelled">Cancelled IRN</a></li>
    `;
    // Attach listeners after populating
    attachFilterListeners();
}

// Function to fetch e-invoice data
async function fetchEInvoiceData(orderId) {
    try {
        const response = await fetch(`https://backend.bninewdelhi.com/api/einvoice/${orderId}`);
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
            let detailsHTML = '';
            
            if (order.payment_note && (order.payment_note.toLowerCase() === 'visitor payment' || 
                order.payment_note.toLowerCase() === 'visitor-payment' || 
                order.payment_note.toLowerCase() === 'new member payment')) {
                detailsHTML = `
                    <strong>Visitor Name:</strong> ${order.visitor_name || 'N/A'}<br>
                    <strong>Visitor Email:</strong> ${order.visitor_email || 'N/A'}<br>
                    <strong>Visitor Mobile:</strong> ${order.visitor_mobilenumber || 'N/A'}<br>
                    <strong>Visitor GSTIN:</strong> ${order.visitor_gstin || 'N/A'}<br>
                    <strong>Chapter Name:</strong> ${chapter?.chapter_name || 'N/A'}<br>
                    <strong>Payment Description:</strong> ${getPaymentDescription(order, universalLink)}<br>
                    <strong>Amount:</strong> ₹ ${transaction.payment_amount}
                `;
            } else {
                detailsHTML = `
                    <strong>Member Name:</strong> ${order?.member_name || 'N/A'}<br>
                    <strong>Chapter Name:</strong> ${chapter?.chapter_name || 'N/A'}<br>
                    <strong>Email:</strong> ${order?.customer_email || 'N/A'}<br>
                    <strong>Phone:</strong> ${order?.customer_phone || 'N/A'}<br>
                    <strong>Company Name:</strong> ${order?.company || 'N/A'}<br>
                    <strong>Company GST No:</strong> ${order?.gstin || 'N/A'}<br>
                    <strong>Payment Description:</strong> ${getPaymentDescription(order, universalLink)}<br>
                    <strong>Amount:</strong> ₹ ${transaction.payment_amount}
                `;
            }

            const secondResult = await Swal.fire({
                title: "Please check the details",
                html: detailsHTML,
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
                    universalLinkName: getPaymentDescription(order, universalLink),
                };

                // Make API call
                const response = await fetch('https://backend.bninewdelhi.com/einvoice/generate-irn', {
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
            universalLinkName: getPaymentDescription(order, universalLink)
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
    } else if (normalized === 'cash') {
        return `<img src="../../assets/images/cash4.jpg" alt="Cash" style="height:18px;vertical-align:middle;margin-right:6px;"> <span style="vertical-align:middle;">CASH</span>`;
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
    const filteredTransactions = await filterTransactions();
    
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

        // Format member name based on payment_note
        let memberNameHTML = '';
        if (order.payment_note && (order.payment_note.toLowerCase() === 'visitor payment' || 
            order.payment_note.toLowerCase() === 'visitor-payment' || 
            order.payment_note.toLowerCase() === 'new member payment')) {
            memberNameHTML = `
                <div><img src="../../assets/images/avatar.png" alt="avatar" style="height:22px;width:22px;border-radius:50%;vertical-align:middle;margin-right:8px;"> ${order.visitor_name || formatNA('Not Applicable')}</div>
                <div style="font-size:0.85em;color:#666;margin-left:30px;">Invited by: <b>${order.member_name || formatNA('Not Applicable')}</b></div>
            `;
        } else {
            memberNameHTML = `<img src="../../assets/images/avatar.png" alt="avatar" style="height:22px;width:22px;border-radius:50%;vertical-align:middle;margin-right:8px;"> ${order.member_name || formatNA('Not Applicable')}`;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${startIndex + i + 1}</td>
            <td>${formatDate(transaction.payment_time)}</td>
            <td>${memberNameHTML}</td>
            <td><b><i>${chapter ? chapter.chapter_name : formatNA('Not Applicable')}</i></b></td>
            <td><div><b>${formatINR(transaction.payment_amount)}</b></div><div><span class="text-success" style="cursor:pointer;font-weight:500;" onclick="showInvoiceModal('${order.order_id}')">View</span></div></td>
            <td>${getPaymentMethodHTML(transaction.payment_group)}</td>
            <td>${getPaymentTypeDisplay(order, universalLink)}</td>
            <td>${getPGStatusBadge(transaction.payment_status)}</td>
            <td><i>${order.order_id || formatNA('Not Applicable')}</i></td>
            <td><b><i>${transaction.cf_payment_id || formatNA('Not Applicable')}</i></b></td>
            <td>Cashfree</td>
            <td>${getSettlementStatusHTML(transaction, order)}</td>
            <td><b>${formatNA(settlementDetails.utr)}</b></td>
            <td><b>${formatNA(settlementDetails.time)}</b></td>
            <td>${formatNA(eInvoiceDetails.irn)}</td>
            <td>${formatNA(eInvoiceDetails.qrCode)}</td>
            <td><b>${formatNA(transaction.einvoice_generated ? getDocumentNumber(order.order_id) : 'Not Applicable')}</b></td>
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
async function filterTransactions() {
    const searchTerm = document.getElementById('searchChapterInput').value.toLowerCase().trim();
    
    let filteredTransactions = allTransactions.filter(transaction => {
        const order = allOrders.find(o => o.order_id === transaction.order_id);
        if (!order) return false;

        // Search by member name
        if (searchTerm && !(order.member_name || '').toLowerCase().includes(searchTerm)) return false;

        // Region filter
        if (currentFilters.region && String(order.region_id) !== String(currentFilters.region)) return false;

        // Chapter filter
        if (currentFilters.chapter && String(order.chapter_id) !== String(currentFilters.chapter)) return false;

        // Payment type filter
        if (currentFilters.paymentType) {
            if (currentFilters.paymentType === 'requisition-payment') {
                // Special case for Requisition Payment
                if (!order.payment_note || order.payment_note.toLowerCase() !== 'member-requisition-payment') {
                    return false;
                }
            } else {
                // Regular universal link filter
                if (String(order.universal_link_id) !== String(currentFilters.paymentType)) return false;
            }
        }

        // Payment status filter
        if (currentFilters.paymentStatus && transaction.payment_status !== currentFilters.paymentStatus) return false;

        // Payment method filter
        if (currentFilters.paymentMethod && transaction.payment_group !== currentFilters.paymentMethod) return false;

        // Month filter
        if (currentFilters.month) {
            const month = new Date(transaction.payment_time).getMonth() + 1;
            if (String(month) !== String(currentFilters.month)) return false;
        }

        // Year filter
        if (currentFilters.year) {
            const year = new Date(transaction.payment_time).getFullYear();
            if (String(year) !== String(currentFilters.year)) return false;
        }

        return true;
    });

    // E-Invoice Status filter
    if (currentFilters.einvoiceStatus) {
        if (currentFilters.einvoiceStatus === 'generated') {
            filteredTransactions = filteredTransactions.filter(t => t.einvoice_generated === true);
        } else if (currentFilters.einvoiceStatus === 'to_be_generated') {
            filteredTransactions = filteredTransactions.filter(t => t.einvoice_generated === false);
        } else if (currentFilters.einvoiceStatus === 'cancelled') {
            const cancelledTransactions = [];
            for (const transaction of filteredTransactions) {
                const eInvoiceData = await fetchEInvoiceData(transaction.order_id);
                if (eInvoiceData && eInvoiceData.is_cancelled) {
                    cancelledTransactions.push(transaction);
                }
            }
            filteredTransactions = cancelledTransactions;
        }
    }

    console.log('Filtered Transactions Count:', filteredTransactions.length);
    // Sort by payment_time descending
    return filteredTransactions.sort((a, b) => new Date(b.payment_time) - new Date(a.payment_time));
}

// Function to handle filter selection
function handleFilterSelection(filterType, value) {
    currentFilters[filterType] = value;
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
                const response = await fetch('https://backend.bninewdelhi.com/einvoice/cancel-irn', {
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
        paymentMethod: '',
        einvoiceStatus: '' // Reset new filter
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

    // Apply filters button
    document.getElementById('apply-filters-btn').addEventListener('click', async () => {
        currentPage = 1;
        showAll = false;
        console.log('Apply Filter Clicked. Current Filters:', currentFilters);
        await displayTransactions();
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

// Add this helper function to get document number
function getDocumentNumber(orderId) {
    const docNumber = allDocNumbers.find(doc => doc.order_id === orderId);
    return docNumber ? docNumber.doc_no : 'Not Applicable';
}

// Helper function to get payment type display text
function getPaymentTypeDisplay(order, universalLink) {
    // Check if this is a member requisition payment
    if (order.payment_note && order.payment_note.toLowerCase() === 'member-requisition-payment') {
        return '<i>Requisition Payment</i>';
    }
    
    // Return the universal link name for other payment types
    return `<i>${universalLink ? universalLink.universal_link_name : formatNA('Not Applicable')}</i>`;
}

// Helper function to get payment description
function getPaymentDescription(order, universalLink) {
    // Check if this is a member requisition payment
    if (order.payment_note && order.payment_note.toLowerCase() === 'member-requisition-payment') {
        return 'Requisition Payment';
    }
    
    // Return the universal link name for other payment types
    return universalLink ? universalLink.universal_link_name : 'N/A';
}
