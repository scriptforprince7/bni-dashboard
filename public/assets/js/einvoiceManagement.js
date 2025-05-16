// Function to generate QR code from data
async function generateQRCode(data) {
    try {
        const response = await fetch('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(data));
        if (!response.ok) throw new Error('QR code generation failed');
        return response.url;
    } catch (error) {
        console.error('Error generating QR code:', error);
        return null;
    }
}

// Function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Function to check if an e-invoice is GST or non-GST
function isGSTEinvoice(order) {
    return order && order.gstin && order.gstin.trim() !== '';
}

// Function to handle filter selection
function handleFilterSelection(filterType, value, element) {
    // Remove active class from all items in the filter group
    document.querySelectorAll(`#${filterType}-filter .dropdown-item`).forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to selected item
    element.classList.add('active');
    
    // Update dropdown button text
    const dropdownButton = element.closest('.dropdown').querySelector('.dropdown-toggle');
    dropdownButton.innerHTML = `<i class="ti ti-${getFilterIcon(filterType)} me-1"></i> ${element.textContent}`;
    
    // Apply filters
    filterTable();
}

// Function to get filter icon
function getFilterIcon(filterType) {
    switch(filterType) {
        case 'region': return 'map-pin';
        case 'chapter': return 'building';
        case 'month': return 'calendar';
        default: return '';
    }
}

// Function to populate filter dropdowns
async function populateFilters(chaptersData, regionsData) {
    // Populate Region Filter
    const regionFilter = document.getElementById('region-filter');
    regionFilter.innerHTML = '<li><a class="dropdown-item" href="#" data-region="all">All Regions</a></li>';
    regionsData.forEach(region => {
        regionFilter.innerHTML += `
            <li><a class="dropdown-item" href="#" data-region="${region.region_id}">${region.region_name}</a></li>
        `;
    });

    // Populate Chapter Filter
    const chapterFilter = document.getElementById('chapter-filter');
    chapterFilter.innerHTML = '<li><a class="dropdown-item" href="#" data-chapter="all">All Chapters</a></li>';
    chaptersData.forEach(chapter => {
        chapterFilter.innerHTML += `
            <li><a class="dropdown-item" href="#" data-chapter="${chapter.chapter_id}">${chapter.chapter_name}</a></li>
        `;
    });

    // Populate Month Filter
    const monthFilter = document.getElementById('month-filter');
    const months = [
        { value: 'all', label: 'All Months' },
        { value: '01', label: 'January' },
        { value: '02', label: 'February' },
        { value: '03', label: 'March' },
        { value: '04', label: 'April' },
        { value: '05', label: 'May' },
        { value: '06', label: 'June' },
        { value: '07', label: 'July' },
        { value: '08', label: 'August' },
        { value: '09', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' }
    ];
    monthFilter.innerHTML = months.map(month => 
        `<li><a class="dropdown-item" href="#" data-month="${month.value}">${month.label}</a></li>`
    ).join('');

    // Add click event listeners to filter items
    document.querySelectorAll('#region-filter .dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            handleFilterSelection('region', e.target.dataset.region, e.target);
        });
    });

    document.querySelectorAll('#chapter-filter .dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            handleFilterSelection('chapter', e.target.dataset.chapter, e.target);
        });
    });

    document.querySelectorAll('#month-filter .dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            handleFilterSelection('month', e.target.dataset.month, e.target);
        });
    });
}

// Function to filter table based on selected filters
function filterTable() {
    const selectedRegion = document.querySelector('#region-filter .dropdown-item.active')?.dataset.region || 'all';
    const selectedChapter = document.querySelector('#chapter-filter .dropdown-item.active')?.dataset.chapter || 'all';
    const selectedMonth = document.querySelector('#month-filter .dropdown-item.active')?.dataset.month || 'all';
    const selectedInvoiceType = document.querySelector('input[name="eoi-status"]:checked')?.id || 'all';

    const rows = document.querySelectorAll('#einvoiceTableBody tr');
    let visibleCount = 0;

    rows.forEach(row => {
        // Get orderId from the checkbox value (first cell)
        const orderId = row.querySelector('input.einvoice-checkbox').value;
        const order = ordersMap.get(orderId);
        const chapter = order ? chaptersMap.get(order.chapter_id) : null;
        const region = chapter ? regionsMap.get(chapter.region_id) : null;
        // Ack Date is now 8th column
        const ackDate = row.querySelector('td:nth-child(8)').textContent;
        // GSTIN is now 12th column
        const gstin = row.querySelector('td:nth-child(12)').textContent;

        // Filter by region, chapter, and month
        const regionMatch = selectedRegion === 'all' || (region && region.region_id.toString() === selectedRegion);
        const chapterMatch = selectedChapter === 'all' || (chapter && chapter.chapter_id.toString() === selectedChapter);
        const monthMatch = selectedMonth === 'all' || (ackDate && ackDate.split('/')[1] === selectedMonth);

        // Filter by invoice type
        let invoiceTypeMatch = true;
        switch(selectedInvoiceType) {
            case 'ready': // GST E-Invoices
                invoiceTypeMatch = gstin !== 'N/A';
                break;
            case 'maybe': // Without GST E-Invoices
                invoiceTypeMatch = gstin === 'N/A';
                break;
            case 'no': // Cash E-Invoices
                invoiceTypeMatch = orderId.toLowerCase().includes('cash');
                break;
        }

        const shouldShow = regionMatch && chapterMatch && monthMatch && invoiceTypeMatch;
        row.style.display = shouldShow ? '' : 'none';
        if (shouldShow) visibleCount++;
    });

    // Update the "Showing X to Y entries" text
    const showingText = document.querySelector('.card-footer .mb-2');
    if (showingText) {
        showingText.innerHTML = `Showing <b>1</b> to <b>${visibleCount}</b> entries`;
    }
}

// Global variables for maps
let ordersMap, chaptersMap, regionsMap;

// Function to show document details modal
function showDocumentDetailsModal(docNo, row) {
    // Get all the data from the row
    const company = row.querySelector('td:nth-child(3)').textContent;
    const irn = row.querySelector('td:nth-child(4)').textContent;
    const ackNo = row.querySelector('td:nth-child(5)').textContent;
    const ackDate = row.querySelector('td:nth-child(6)').textContent;
    const qrCodeImg = row.querySelector('td:nth-child(7) img')?.src;
    const transactionId = row.querySelector('td:nth-child(8)').textContent;
    const orderId = row.querySelector('td:nth-child(9)').textContent;
    const gstinCell = row.querySelector('td:nth-child(10)').textContent;
    const memberName = row.querySelector('td:nth-child(11)').textContent;
    const chapterName = row.querySelector('td:nth-child(12)').textContent;

    // Get the order data to ensure we have the correct GSTIN
    const order = ordersMap.get(orderId);
    console.log('Modal orderId:', orderId, 'order:', order); // DEBUG
    let displayGstin = 'N/A';
    if (order && order.gstin && order.gstin.trim() !== '') {
        displayGstin = order.gstin;
    } else if (gstinCell && gstinCell.trim() !== '' && gstinCell !== 'N/A' && gstinCell !== 'Not applicable for NON-GST einvoices') {
        displayGstin = gstinCell;
    } else if (order && !order.gstin && gstinCell === 'Not applicable for NON-GST einvoices') {
        displayGstin = 'Not applicable for NON-GST einvoices';
    }

    // Update modal content
    document.getElementById('modal-doc-no').textContent = docNo;
    document.getElementById('modal-company').textContent = company;
    document.getElementById('modal-member-name').textContent = memberName;
    document.getElementById('modal-chapter-name').textContent = chapterName;
    document.getElementById('modal-gstin').textContent = displayGstin;
    document.getElementById('modal-transaction-id').textContent = transactionId;
    document.getElementById('modal-order-id').textContent = orderId;
    document.getElementById('modal-irn').textContent = irn;
    document.getElementById('modal-ack-no').textContent = ackNo;
    document.getElementById('modal-ack-date').textContent = ackDate;

    // Update QR code
    const qrCodeContainer = document.getElementById('modal-qr-code');
    if (qrCodeImg) {
        qrCodeContainer.innerHTML = `<img src="${qrCodeImg}" alt="QR Code" class="img-fluid">`;
    } else {
        qrCodeContainer.innerHTML = '<p class="text-muted mb-0">QR Code not available</p>';
    }

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('documentDetailsModal'));
    modal.show();
}

// Function to show E-Invoice PDF modal
function showEinvoicePdfModal(order, transaction, einvoice) {
    const invoiceData = {
        orderId: order,
        transactionId: transaction,
        amount: order.order_amount,
        chapterName: chaptersMap.get(order.chapter_id)?.chapter_name || 'N/A',
        gatewayName: 'Unknown', // Set as needed
        universalLinkName: 'Not Applicable' // Set as needed
    };
    const einvoiceData = einvoice;
    const url = `https://dashboard.bninewdelhi.com/v/einvoice?invoiceData=${encodeURIComponent(JSON.stringify(invoiceData))}&einvoiceData=${encodeURIComponent(JSON.stringify(einvoiceData))}`;
    document.getElementById('einvoicePdfIframe').src = url;
    const modal = new bootstrap.Modal(document.getElementById('einvoicePdfModal'));
    modal.show();
}

// Function to fetch and display e-invoice data
async function fetchAndDisplayEinvoices() {
    try {
        // Fetch e-invoice data
        const einvoiceResponse = await fetch('https://backend.bninewdelhi.com/api/einvoiceData');
        const einvoiceData = await einvoiceResponse.json();

        // Fetch all orders data
        const ordersResponse = await fetch('https://backend.bninewdelhi.com/api/allOrders');
        const ordersData = await ordersResponse.json();

        // Fetch document numbers
        const docNumbersResponse = await fetch('https://backend.bninewdelhi.com/api/getAllDocNumbers');
        const docNumbersData = await docNumbersResponse.json();

        // Fetch chapters data
        const chaptersResponse = await fetch('https://backend.bninewdelhi.com/api/chapters');
        const chaptersData = await chaptersResponse.json();

        // Fetch regions data
        const regionsResponse = await fetch('https://backend.bninewdelhi.com/api/regions');
        const regionsData = await regionsResponse.json();

        // Fetch transactions data
        const transactionsResponse = await fetch('https://backend.bninewdelhi.com/api/allTransactions');
        const transactionsData = await transactionsResponse.json();

        // Create maps for quick lookup
        ordersMap = new Map(ordersData.map(order => [order.order_id, order]));
        const docNumbersMap = new Map(docNumbersData.map(doc => [doc.order_id, doc]));
        chaptersMap = new Map(chaptersData.map(chapter => [chapter.chapter_id, chapter]));
        regionsMap = new Map(regionsData.map(region => [region.region_id, region]));
        const transactionsMap = new Map(transactionsData.map(transaction => [transaction.order_id, transaction]));

        // Populate filters
        await populateFilters(chaptersData, regionsData);

        const tableBody = document.getElementById('einvoiceTableBody');
        tableBody.innerHTML = '';

        // Update total count
        document.getElementById('total-visitors-count').textContent = einvoiceData.length;

        // Process each e-invoice
        for (let i = 0; i < einvoiceData.length; i++) {
            const einvoice = einvoiceData[i];
            const order = ordersMap.get(einvoice.order_id);
            const docNumber = docNumbersMap.get(einvoice.order_id);
            const chapter = order ? chaptersMap.get(order.chapter_id) : null;
            const transaction = transactionsMap.get(einvoice.order_id);
            const isGST = isGSTEinvoice(order);

            // Generate QR code
            const qrCodeUrl = await generateQRCode(einvoice.qrcode);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="einvoice-checkbox" value="${einvoice.order_id}"></td>
                <td><span class="fw-bold">${i + 1}</span></td>
                <td>
                    <span class="clickable-doc" style="cursor:pointer;">
                        ${docNumber?.doc_no || 'N/A'}
                    </span>
                </td>
                <td><span class="fw-bold">${order?.member_name || 'N/A'}</span></td>
                <td><span class="fw-bold">${chapter?.chapter_name || 'N/A'}</span></td>
                <td><span class="fw-bold">${order?.company || 'N/A'}</span></td>
                <td><span class="fst-italic">${isGST ? (einvoice.irn || 'N/A') : 'Not applicable for NON-GST einvoices'}</span></td>
                <td><span class="fw-bold">${isGST ? (einvoice.ack_dt ? formatDate(einvoice.ack_dt) : 'N/A') : 'Not applicable for NON-GST einvoices'}</span></td>
                <td><span class="fw-bold">${order?.order_amount !== undefined && order?.order_amount !== null ? Number(order.order_amount).toFixed(2) : 'N/A'}</span></td>
                <td><span class="fw-bold">${order?.tax !== undefined && order?.tax !== null ? Number(order.tax).toFixed(2) : 'N/A'}</span></td>
                <td><span class="fw-bold">${transaction?.cf_payment_id || 'N/A'}</span></td>
                <td><span class="fw-bold">${order?.gstin || 'N/A'}</span></td>
            `;
            tableBody.appendChild(row);
        }

        // Initialize with all filters set to "All"
        document.querySelectorAll('.dropdown-item[data-region="all"], .dropdown-item[data-chapter="all"], .dropdown-item[data-month="all"]')
            .forEach(item => item.classList.add('active'));
        // Setup select all checkbox
        setupSelectAllCheckbox();

        // Event delegation for Doc No click
        tableBody.addEventListener('click', function(e) {
            const target = e.target.closest('.clickable-doc');
            if (target) {
                const row = target.closest('tr');
                const orderId = row.querySelector('input.einvoice-checkbox').value;
                const order = ordersMap.get(orderId);
                const transaction = transactionsMap.get(orderId);
                const einvoice = einvoiceData.find(e => e.order_id === orderId);
                showEinvoicePdfModal(order, transaction, einvoice);
            }
        });
    } catch (error) {
        console.error('Error fetching e-invoice data:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to fetch e-invoice data. Please try again later.'
        });
    }
}

// Function to show QR code in modal
function showQRCodeModal(qrCodeUrl) {
    Swal.fire({
        imageUrl: qrCodeUrl,
        imageWidth: 300,
        imageHeight: 300,
        imageAlt: 'QR Code',
        showConfirmButton: true,
        confirmButtonText: 'Close'
    });
}

// Search functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchEinvoice');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase().trim();
            const rows = document.querySelectorAll('#einvoiceTableBody tr');
            let visibleCount = 0;

            rows.forEach(row => {
                // Get all relevant cell values
                const memberName = row.querySelector('td:nth-child(11)').textContent.toLowerCase();
                const companyName = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
                const gstin = row.querySelector('td:nth-child(10)').textContent.toLowerCase();
                const docNumber = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
                const ackNo = row.querySelector('td:nth-child(5)').textContent.toLowerCase();
                const irn = row.querySelector('td:nth-child(4)').textContent.toLowerCase();
                const ackDate = row.querySelector('td:nth-child(6)').textContent.toLowerCase();
                const transactionId = row.querySelector('td:nth-child(8)').textContent.toLowerCase();

                // Check if any field contains the search term
                const matches = 
                    memberName.includes(searchTerm) ||
                    companyName.includes(searchTerm) ||
                    gstin.includes(searchTerm) ||
                    docNumber.includes(searchTerm) ||
                    ackNo.includes(searchTerm) ||
                    irn.includes(searchTerm) ||
                    ackDate.includes(searchTerm) ||
                    transactionId.includes(searchTerm);

                // Show/hide row based on match
                row.style.display = matches ? '' : 'none';
                if (matches) visibleCount++;
            });

            // Update the "Showing X to Y entries" text
            const showingText = document.querySelector('.card-footer .mb-2');
            if (showingText) {
                showingText.innerHTML = `Showing <b>1</b> to <b>${visibleCount}</b> entries`;
            }
        });
    }
});

// Radio button filter functionality
document.querySelectorAll('input[name="eoi-status"]').forEach(radio => {
    radio.addEventListener('change', function() {
        filterTable();
    });
});

// Select All functionality
function setupSelectAllCheckbox() {
    const selectAll = document.getElementById('selectAllEinvoices');
    selectAll.addEventListener('change', function() {
        document.querySelectorAll('.einvoice-checkbox').forEach(cb => {
            cb.checked = selectAll.checked;
        });
    });
}

// Helper to get selected order_ids
function getSelectedOrderIds() {
    return Array.from(document.querySelectorAll('.einvoice-checkbox:checked')).map(cb => cb.value);
}

// Export JSON functionality
document.addEventListener('DOMContentLoaded', function() {
    const exportJsonBtn = document.getElementById('exportJsonBtn');
    if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', async function() {
            try {
                // Fetch all data sources
                const [einvoiceRes, ordersRes, docNumbersRes, chaptersRes, regionsRes, transactionsRes] = await Promise.all([
                    fetch('https://backend.bninewdelhi.com/api/einvoiceData'),
                    fetch('https://backend.bninewdelhi.com/api/allOrders'),
                    fetch('https://backend.bninewdelhi.com/api/getAllDocNumbers'),
                    fetch('https://backend.bninewdelhi.com/api/chapters'),
                    fetch('https://backend.bninewdelhi.com/api/regions'),
                    fetch('https://backend.bninewdelhi.com/api/allTransactions')
                ]);
                const [einvoiceData, ordersData, docNumbersData, chaptersData, regionsData, transactionsData] = await Promise.all([
                    einvoiceRes.json(),
                    ordersRes.json(),
                    docNumbersRes.json(),
                    chaptersRes.json(),
                    regionsRes.json(),
                    transactionsRes.json()
                ]);

                // Create maps for quick lookup
                const ordersMap = new Map(ordersData.map(order => [order.order_id, order]));
                const docNumbersMap = new Map(docNumbersData.map(doc => [doc.order_id, doc]));
                const chaptersMap = new Map(chaptersData.map(chapter => [chapter.chapter_id, chapter]));
                const transactionsMap = new Map(transactionsData.map(transaction => [transaction.order_id, transaction]));

                // Filter data if any checkboxes are selected
                const selectedIds = getSelectedOrderIds();
                let filteredEinvoiceData = einvoiceData;
                if (selectedIds.length > 0) {
                    filteredEinvoiceData = einvoiceData.filter(e => selectedIds.includes(e.order_id));
                }
                // Build export data in table format
                const exportData = filteredEinvoiceData.map((einvoice, i) => {
                    const order = ordersMap.get(einvoice.order_id);
                    const docNumber = docNumbersMap.get(einvoice.order_id);
                    const chapter = order ? chaptersMap.get(order.chapter_id) : null;
                    const transaction = transactionsMap.get(einvoice.order_id);
                    const isGST = order && order.gstin && order.gstin.trim() !== '';
                    return {
                        serial_no: i + 1,
                        doc_no: docNumber?.doc_no || 'N/A',
                        company: order?.company || 'N/A',
                        irn: isGST ? (einvoice.irn || 'N/A') : 'Not applicable for NON-GST einvoices',
                        ack_no: isGST ? (einvoice.ack_no || 'N/A') : 'Not applicable for NON-GST einvoices',
                        ack_date: isGST ? (einvoice.ack_dt || 'N/A') : 'Not applicable for NON-GST einvoices',
                        qrcode_url: isGST && einvoice.qrcode ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(einvoice.qrcode)}` : 'Not applicable for NON-GST einvoices',
                        transaction_id: transaction?.cf_payment_id || 'N/A',
                        order_id: einvoice.order_id || 'N/A',
                        gstin: order?.gstin || 'N/A',
                        member_name: order?.member_name || 'N/A',
                        chapter_name: chapter?.chapter_name || 'N/A',
                        total_bill_amount: order?.order_amount || 'N/A',
                        tax: order?.tax || 'N/A'
                    };
                });

                const jsonStr = JSON.stringify(exportData, null, 2);
                const blob = new Blob([jsonStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'einvoices-table.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Export Failed',
                    text: 'Could not export JSON. Please try again.'
                });
            }
        });
    }
});

// Export CSV functionality
document.addEventListener('DOMContentLoaded', function() {
    const exportCsvBtn = document.getElementById('exportCsvBtn');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', async function() {
            try {
                // Fetch all data sources (same as for JSON export)
                const [einvoiceRes, ordersRes, docNumbersRes, chaptersRes, regionsRes, transactionsRes] = await Promise.all([
                    fetch('https://backend.bninewdelhi.com/api/einvoiceData'),
                    fetch('https://backend.bninewdelhi.com/api/allOrders'),
                    fetch('https://backend.bninewdelhi.com/api/getAllDocNumbers'),
                    fetch('https://backend.bninewdelhi.com/api/chapters'),
                    fetch('https://backend.bninewdelhi.com/api/regions'),
                    fetch('https://backend.bninewdelhi.com/api/allTransactions')
                ]);
                const [einvoiceData, ordersData, docNumbersData, chaptersData, regionsData, transactionsData] = await Promise.all([
                    einvoiceRes.json(),
                    ordersRes.json(),
                    docNumbersRes.json(),
                    chaptersRes.json(),
                    regionsRes.json(),
                    transactionsRes.json()
                ]);

                // Create maps for quick lookup
                const ordersMap = new Map(ordersData.map(order => [order.order_id, order]));
                const docNumbersMap = new Map(docNumbersData.map(doc => [doc.order_id, doc]));
                const chaptersMap = new Map(chaptersData.map(chapter => [chapter.chapter_id, chapter]));
                const transactionsMap = new Map(transactionsData.map(transaction => [transaction.order_id, transaction]));

                // Filter data if any checkboxes are selected
                const selectedIds = getSelectedOrderIds();
                let filteredEinvoiceData = einvoiceData;
                if (selectedIds.length > 0) {
                    filteredEinvoiceData = einvoiceData.filter(e => selectedIds.includes(e.order_id));
                }
                // Build export data in table format for CSV
                const exportData = filteredEinvoiceData.map((einvoice, i) => {
                    const order = ordersMap.get(einvoice.order_id);
                    const docNumber = docNumbersMap.get(einvoice.order_id);
                    const chapter = order ? chaptersMap.get(order.chapter_id) : null;
                    const transaction = transactionsMap.get(einvoice.order_id);
                    const isGST = order && order.gstin && order.gstin.trim() !== '';
                    return {
                        'S.No.': i + 1,
                        'Doc No.': docNumber?.doc_no || 'N/A',
                        'Member Name': order?.member_name || 'N/A',
                        'Chapter Name': chapter?.chapter_name || 'N/A',
                        'Company Name': order?.company || 'N/A',
                        'IRN Generated': isGST ? (einvoice.irn || 'N/A') : 'Not applicable for NON-GST einvoices',
                        'Ack. Date': isGST ? (einvoice.ack_dt || 'N/A') : 'Not applicable for NON-GST einvoices',
                        'Total Bill Amount': order?.order_amount !== undefined && order?.order_amount !== null ? Number(order.order_amount).toFixed(2) : 'N/A',
                        'Tax (18%)': order?.tax !== undefined && order?.tax !== null ? Number(order.tax).toFixed(2) : 'N/A',
                        'Transaction ID': transaction?.cf_payment_id || 'N/A',
                        'GSTIN': order?.gstin || 'N/A'
                    };
                });

                // Convert to CSV
                const headers = Object.keys(exportData[0]);
                const csvRows = [headers.join(',')];
                for (const row of exportData) {
                    const values = headers.map(h => {
                        const val = row[h] ?? '';
                        // Escape quotes and commas
                        if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
                            return '"' + val.replace(/"/g, '""') + '"';
                        }
                        return val;
                    });
                    csvRows.push(values.join(','));
                }
                const csvContent = csvRows.join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'einvoices-table.csv';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Export Failed',
                    text: 'Could not export CSV. Please try again.'
                });
            }
        });
    }
});

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    fetchAndDisplayEinvoices();
    const fullscreenBtn = document.getElementById('einvoicePdfFullscreenBtn');
    const downloadBtn = document.getElementById('einvoicePdfDownloadBtn');
    const iframe = document.getElementById('einvoicePdfIframe');
    const printBtn = document.getElementById('einvoicePdfPrintBtn');
    if (fullscreenBtn && iframe) {
        fullscreenBtn.addEventListener('click', function() {
            if (iframe.requestFullscreen) {
                iframe.requestFullscreen();
            } else if (iframe.webkitRequestFullscreen) { /* Safari */
                iframe.webkitRequestFullscreen();
            } else if (iframe.msRequestFullscreen) { /* IE11 */
                iframe.msRequestFullscreen();
            }
        });
    }
    if (downloadBtn && iframe) {
        downloadBtn.addEventListener('click', function() {
            // Get the current iframe src (which contains the query params)
            const iframeUrl = iframe.src;
            // Build the correct PDF endpoint URL
            const urlParams = iframeUrl.split('?')[1];
            const pdfUrl = `https://backend.bninewdelhi.com/api/v/einvoice/pdf?${urlParams}`;
            // Open the PDF in a new tab (for direct download)
            window.open(pdfUrl, '_blank');
        });
    }
    if (printBtn && iframe) {
        printBtn.addEventListener('click', function() {
            if (iframe.contentWindow) {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            } else {
                alert('Unable to access invoice for printing.');
            }
        });
    }
});
