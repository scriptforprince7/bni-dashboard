// Function to show the loader
function showLoader() {
  document.getElementById("loader").style.display = "flex";
}

function hideLoader() {
  document.getElementById("loader").style.display = "none";
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    console.error("Error: incoming date is not valid");
    return "Invalid Date";
  }
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

// Global variable for ledger data
let ledgerData = [];

// Global variables for filtering
let selectedMonth = 'all';
let selectedType = 'all';
let allTransactionRows = [];  // Store all rows for filtering

let totalKittyAmount = 0;
let totalExpenseAmount = 0;
let totalExpenseBaseAmount = 0; // sum of base amounts (debit) only
let totalVisitorAmount = 0;
let cashExpenseAmount = 0;
let onlineExpenseAmount = 0;
let cashExpenseBaseAmount = 0; // base (debit) only
let onlineExpenseBaseAmount = 0; // base (debit) only
let cashVisitorAmount = 0;
let onlineVisitorAmount = 0;
let cashKittyAmount = 0;
let onlineKittyAmount = 0;
let cashOtherPayments = 0;
let onlineOtherPayments = 0;
let cashGSTAmount = 0;

function initializeFilters() {
  // Populate months dropdown
  const months = [
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

  const monthFilter = document.getElementById('monthFilter');
  months.forEach(month => {
    const li = document.createElement('li');
    li.innerHTML = `<a class="dropdown-item" href="#" data-value="${month.value}">${month.label}</a>`;
    monthFilter.appendChild(li);
  });

  // Add event listeners for filters
  document.getElementById('monthFilter').addEventListener('click', function(e) {
    if (e.target.classList.contains('dropdown-item')) {
      e.preventDefault();
      selectedMonth = e.target.dataset.value;
      document.getElementById('monthFilterBtn').textContent = 
        selectedMonth === 'all' ? 'Month' : months.find(m => m.value === selectedMonth).label;
      applyFilters();
    }
  });

  document.getElementById('typeFilter').addEventListener('click', function(e) {
    if (e.target.classList.contains('dropdown-item')) {
      e.preventDefault();
      selectedType = e.target.dataset.value;
      document.getElementById('typeFilterBtn').textContent = 
        e.target.textContent;
      applyFilters();
    }
  });

  document.getElementById('resetFilters').addEventListener('click', function() {
    selectedMonth = 'all';
    selectedType = 'all';
    document.getElementById('monthFilterBtn').innerHTML = '<i class="ri-calendar-line me-1"></i> Month';
    document.getElementById('typeFilterBtn').innerHTML = '<i class="ri-filter-line me-1"></i> Type';
    applyFilters();
  });

  // Add export button event listener
  document.getElementById('exportLedger').addEventListener('click', exportToExcel);
}

function applyFilters() {
  const tbody = document.getElementById('ledger-body');
  const rows = Array.from(tbody.getElementsByTagName('tr'));
  
  rows.forEach(row => {
    const date = row.cells[1].textContent;  // Date is in second column
    const description = row.cells[2].innerHTML;  // Using innerHTML to check for the expense icon
    const month = date.split('/')[1];  // Assuming date format is DD/MM/YYYY
    
    let showRow = true;
    
    // Apply month filter
    if (selectedMonth !== 'all' && month !== selectedMonth) {
      showRow = false;
    }
    
    // Apply type filter
    if (selectedType !== 'all') {
      // Check for expense (red E icon)
      const isExpense = description.includes('background-color: #ff4444') || description.includes('E</div>');
      // Check for visitor payment (green V icon)
      const isVisitor = description.includes('background-color: #4CAF50') || description.includes('V</div>');
      // Check for meeting fee (no special icon)
      const isKitty = description.includes('Meeting Fee') && !isExpense && !isVisitor;

      if (selectedType === 'kitty' && !isKitty) {
        showRow = false;
      } else if (selectedType === 'visitor' && !isVisitor) {
        showRow = false;
      } else if (selectedType === 'expense' && !isExpense) {
        showRow = false;
      }
    }
    
    row.style.display = showRow ? '' : 'none';
  });

  // Update row numbers for visible rows
  let visibleRowNum = 1;
  rows.forEach(row => {
    if (row.style.display !== 'none') {
      row.cells[0].textContent = visibleRowNum++;
    }
  });

  // Update totals based on filtered rows
  updateFilteredTotals(rows.filter(row => row.style.display !== 'none'));
}

function updateFilteredTotals(visibleRows) {
  let filteredKittyAmount = 0;
  let filteredVisitorAmount = 0;
  let filteredExpenseAmount = 0;
  let filteredCashExpenseAmount = 0;
  let filteredOnlineExpenseAmount = 0;
  let filteredCashVisitorAmount = 0;
  let filteredOnlineVisitorAmount = 0;

  visibleRows.forEach(row => {
    const description = row.cells[2].innerHTML;
    const debit = parseFloat(row.cells[4].textContent.replace(/[^0-9.-]+/g, '') || 0);
    const credit = parseFloat(row.cells[5].textContent.replace(/[^0-9.-]+/g, '') || 0);

    // Check for expense (red E icon)
    const isExpense = description.includes('background-color: #ff4444') || description.includes('E</div>');
    // Check for visitor payment (green V icon)
    const isVisitor = description.includes('background-color: #4CAF50') || description.includes('V</div>');
    // Check for meeting fee (no special icon)
    const isKitty = description.includes('Meeting Fee') && !isExpense && !isVisitor;
    
    const isCashPayment = description.toLowerCase().includes('cash');

    if (isKitty) {
      filteredKittyAmount += credit;
    } else if (isVisitor) {
      filteredVisitorAmount += credit;
      if (isCashPayment) {
        filteredCashVisitorAmount += credit;
      } else {
        filteredOnlineVisitorAmount += credit;
      }
    } else if (isExpense) {
      filteredExpenseAmount += debit;
      if (isCashPayment) {
        filteredCashExpenseAmount += debit;
      } else {
        filteredOnlineExpenseAmount += debit;
      }
    }
  });

  // Update the totals with filtered amounts
  const kittyElement = document.getElementById('total-kitty-amount');
  const visitorElement = document.getElementById('total-visitor-amount');
  const expenseElement = document.getElementById('total-expense-amount');

  // Update main amounts
  kittyElement.firstElementChild.firstChild.textContent = formatCurrency(filteredKittyAmount);
  
  // Update visitor amount with bifurcation
  visitorElement.innerHTML = `
    <div>
      ${formatCurrency(filteredVisitorAmount)}
      <div style="font-size: 0.5em; margin-top: 2px; color: #666;">
        <span>
          <i class="ri-money-dollar-circle-line"></i> Cash: ${formatCurrency(filteredCashVisitorAmount)}
        </span>
        <span style="margin-left: 8px;">
          <i class="ri-bank-card-line"></i> Online: ${formatCurrency(filteredOnlineVisitorAmount)}
        </span>
      </div>
    </div>
  `;

  // Update expense amount with bifurcation
  expenseElement.innerHTML = `
    <div>
      ${formatCurrency(filteredExpenseAmount)}
      <div style="font-size: 0.5em; margin-top: 2px; color: #666;">
        <span>
          <i class="ri-money-dollar-circle-line"></i> Cash: ${formatCurrency(filteredCashExpenseAmount)}
        </span>
        <span style="margin-left: 8px;">
          <i class="ri-bank-card-line"></i> Online: ${formatCurrency(filteredOnlineExpenseAmount)}
        </span>
      </div>
    </div>
  `;
}

// Add this function at the top level of your file
function exportToExcel() {
  // Get only visible rows
  const tbody = document.getElementById('ledger-body');
  const visibleRows = Array.from(tbody.getElementsByTagName('tr'))
    .filter(row => row.style.display !== 'none');

  // Get opening and closing balance
  const openingBalance = ledgerData[0].credit; // First entry is opening balance
  const closingBalance = ledgerData[ledgerData.length - 1].balance; // Last entry's balance

  // Count unique members and visitors
  const uniqueMembers = new Set();
  const uniqueVisitors = new Set();
  visibleRows.forEach(row => {
    const description = row.cells[2].innerHTML;
    if (description.includes('Meeting Fee')) {
      const memberName = description.split('-')[1].split('<')[0].trim();
      uniqueMembers.add(memberName);
    } else if (description.includes('Visitor Fee')) {
      const visitorName = description.match(/Visitor Fee - ([^<]+)/);
      if (visitorName && visitorName[1] && visitorName[1] !== 'N/A') {
        uniqueVisitors.add(visitorName[1].trim());
      }
    }
  });

  // Create Excel data
  let excelData = [
    ['Chapter Ledger Summary'],
    [''],
    ['Opening Balance', formatCurrency(openingBalance)],
    ['Closing Balance', formatCurrency(closingBalance)],
    ['Total Members', uniqueMembers.size],
    ['Total Visitors', uniqueVisitors.size],
    [''],
    ['Transaction Details'],
    ['S.No.', 'Date', 'Description', 'Total Amount', 'Debit (Dr.)', 'Credit (Cr.)', 'GST', 'Balance']
  ];

  // Add transaction rows
  visibleRows.forEach(row => {
    const rowData = Array.from(row.cells).map(cell => {
      // Get text content without HTML tags
      const text = cell.textContent.trim();
      // Remove currency symbol and commas from amounts
      if (text.includes('₹')) {
        return text.replace('₹', '').replace(/,/g, '').trim();
      }
      return text;
    });
    excelData.push(rowData);
  });

  // Get summary data
  const kittyAmount = document.getElementById('total-kitty-amount').textContent.replace('₹', '').replace(/,/g, '').trim();
  const visitorElement = document.getElementById('total-visitor-amount');
  const visitorTotal = visitorElement.querySelector('div').firstChild.textContent.trim().replace('₹', '').replace(/,/g, '');
  const visitorCash = visitorElement.querySelector('div div span:first-child').textContent.replace('Cash:', '').replace('₹', '').replace(/,/g, '').trim();
  const visitorOnline = visitorElement.querySelector('div div span:last-child').textContent.replace('Online:', '').replace('₹', '').replace(/,/g, '').trim();
  
  const expenseElement = document.getElementById('total-expense-amount');
  const expenseTotal = expenseElement.querySelector('div').firstChild.textContent.trim().replace('₹', '').replace(/,/g, '');
  const expenseCash = expenseElement.querySelector('div div span:first-child').textContent.replace('Cash:', '').replace('₹', '').replace(/,/g, '').trim();
  const expenseOnline = expenseElement.querySelector('div div span:last-child').textContent.replace('Online:', '').replace('₹', '').replace(/,/g, '').trim();

  // Add summary section
  excelData.push([]);  // Empty row for spacing
  excelData.push(['Financial Summary']);
  excelData.push(['Total Meeting Fees', kittyAmount]);
  excelData.push(['Total Visitor Payments', visitorTotal]);
  excelData.push(['- Cash Visitor Payments', visitorCash]);
  excelData.push(['- Online Visitor Payments', visitorOnline]);
  excelData.push(['Total Expenses', expenseTotal]);
  excelData.push(['- Cash Expenses', expenseCash]);
  excelData.push(['- Online Expenses', expenseOnline]);

  // Add member and visitor lists if any
  if (uniqueMembers.size > 0) {
    excelData.push([]);
    excelData.push(['Member List']);
    Array.from(uniqueMembers).sort().forEach((member, index) => {
      excelData.push([index + 1, member]);
    });
  }

  if (uniqueVisitors.size > 0) {
    excelData.push([]);
    excelData.push(['Visitor List']);
    Array.from(uniqueVisitors).sort().forEach((visitor, index) => {
      excelData.push([index + 1, visitor]);
    });
  }

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(excelData);

  // Set column widths
  const colWidths = [10, 15, 40, 15, 15, 15, 15, 15];
  ws['!cols'] = colWidths.map(width => ({ width }));

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Chapter Ledger');

  // Get current date for filename
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0];

  // Generate Excel file
  XLSX.writeFile(wb, `Chapter_Ledger_${dateStr}.xlsx`);
}

// Add this function after the formatCurrency function
function showKittyBreakdownPopup(kittyAmountWithVisitors) {
  // Calculate other payments total
  const otherPaymentsTotal = totalKittyAmount - (cashKittyAmount + onlineKittyAmount);
  
  // Create the HTML content for the popup
  const content = `
    <div class="kitty-breakdown">
      <div class="breakdown-section">
        <h6 class="mb-3">Payment Mode Breakdown</h6>
        <div class="d-flex justify-content-between mb-2">
          <span><i class="ri-money-dollar-circle-line me-2"></i>Cash Payments</span>
          <span class="fw-bold">${formatCurrency(cashKittyAmount)}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span><i class="ri-bank-card-line me-2"></i>Online Payments</span>
          <span class="fw-bold">${formatCurrency(onlineKittyAmount)}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span><i class="ri-user-add-line me-2"></i>Visitor Payments</span>
          <span class="fw-bold">${formatCurrency(totalVisitorAmount)}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span><i class="ri-exchange-dollar-line me-2"></i>Other Payments</span>
          <span class="fw-bold">${formatCurrency(otherPaymentsTotal)}</span>
        </div>
        <hr>
        <div class="d-flex justify-content-between">
          <span class="fw-bold">Total Kitty Amount</span>
          <span class="fw-bold">${formatCurrency(kittyAmountWithVisitors)}</span>
        </div>
      </div>
    </div>
  `;

  // Show the popup
  // Swal.fire({
  //   title: 'Kitty Amount Breakdown',
  //   html: content,
  //   customClass: {
  //     container: 'kitty-breakdown-popup',
  //     popup: 'kitty-breakdown-popup',
  //     content: 'kitty-breakdown-content'
  //   },
  //   showCloseButton: true,
  //   showConfirmButton: false,
  //   width: '500px'
  // });
}

// Add this function to show the current balance calculation popup
function showCurrentBalanceBreakdown(openingBalance, kittyAmountWithVisitors, totalExpenseBaseAmount, currentBalance) {
  const content = `
    <div class="kitty-breakdown">
      <div class="breakdown-section">
        <h6 class="mb-3">Current Balance Calculation</h6>
        <div class="d-flex justify-content-between mb-2">
          <span>Opening Balance</span>
          <span class="fw-bold" style="color: #28a745;">${formatCurrency(openingBalance)}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span>+ Total Kitty Amount (incl. Visitor)</span>
          <span class="fw-bold" style="color: #28a745;">${formatCurrency(kittyAmountWithVisitors)}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span>- Total Expenses</span>
          <span class="fw-bold" style="color: #dc3545;">${formatCurrency(totalExpenseBaseAmount)}</span>
        </div>
        <hr>
        <div class="d-flex justify-content-between">
          <span class="fw-bold">Current Balance</span>
          <span class="fw-bold" style="color: #28a745;">${formatCurrency(currentBalance)}</span>
        </div>
      </div>
    </div>
  `;
  Swal.fire({
    title: 'Current Balance Breakdown',
    html: content,
    customClass: {
      container: 'kitty-breakdown-popup',
      popup: 'kitty-breakdown-popup',
      content: 'kitty-breakdown-content'
    },
    showCloseButton: true,
    showConfirmButton: false,
    width: '500px'
  });
}

// Add this function after showKittyBreakdownPopup
function showPaymentModeBreakdownPopup(mode, totalAmount, breakdown) {
  const content = `
    <div class="kitty-breakdown">
      <div class="breakdown-section">
        <h6 class="mb-3">${mode} Payments Breakdown</h6>
        <div class="d-flex justify-content-between mb-2">
          <span><i class="ri-money-dollar-circle-line me-2"></i>Meeting Fees</span>
          <span class="fw-bold">${formatCurrency(breakdown.kitty)}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span><i class="ri-user-add-line me-2"></i>Visitor Payments</span>
          <span class="fw-bold">${formatCurrency(breakdown.visitor)}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span><i class="ri-exchange-dollar-line me-2"></i>Other Payments</span>
          <span class="fw-bold">${formatCurrency(breakdown.other)}</span>
        </div>
        <hr>
        <div class="d-flex justify-content-between">
          <span class="fw-bold">Total ${mode} Amount</span>
          <span class="fw-bold">${formatCurrency(totalAmount)}</span>
        </div>
      </div>
    </div>
  `;

  // Show the popup
  Swal.fire({
    title: `${mode} Payments Breakdown`,
    html: content,
    customClass: {
      container: 'kitty-breakdown-popup',
      popup: 'kitty-breakdown-popup',
      content: 'kitty-breakdown-content'
    },
    showCloseButton: true,
    showConfirmButton: false,
    width: '500px'
  });
}

// Add this function after showPaymentModeBreakdownPopup
function showCurrentBalanceBreakdownPopup(currentBalance, cashBreakdown, onlineBreakdown, availableFund, cashGST) {
  const content = `
    <div class="kitty-breakdown">
      <div class="breakdown-section">
        <h6 class="mb-3">Current Balance Breakdown</h6>
        <div class="d-flex justify-content-between mb-2">
          <span><i class="ri-money-dollar-circle-line me-2"></i>Cash Balance</span>
          <span class="fw-bold">${formatCurrency(cashBreakdown.total)}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span><i class="ri-wallet-3-line me-2"></i>Opening Balance (Available Fund)</span>
          <span class="fw-bold" style="color: #28a745;">${formatCurrency(availableFund)}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span><i class="ri-money-dollar-circle-line me-2"></i>Cash Receipts</span>
          <span class="fw-bold" style="color: #28a745;">${formatCurrency(cashBreakdown.receipts)}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span><i class="ri-money-dollar-circle-line me-2"></i>Cash GST</span>
          <span class="fw-bold" style="color: #28a745;">${formatCurrency(cashGST)}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span><i class="ri-money-dollar-circle-line me-2"></i>Cash Expenses</span>
          <span class="fw-bold" style="color: #dc3545;">${formatCurrency(cashBreakdown.expenses)}</span>
        </div>
        <hr>
        <div class="d-flex justify-content-between mb-2">
          <span><i class="ri-bank-card-line me-2"></i>Online Balance</span>
          <span class="fw-bold">${formatCurrency(onlineBreakdown.total)}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span><i class="ri-bank-card-line me-2"></i>Online Receipts</span>
          <span class="fw-bold" style="color: #28a745;">${formatCurrency(onlineBreakdown.receipts)}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span><i class="ri-bank-card-line me-2"></i>Online Expenses</span>
          <span class="fw-bold" style="color: #dc3545;">${formatCurrency(onlineBreakdown.expenses)}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span><i class="ri-bank-card-line me-2"></i>Less: Cash GST</span>
          <span class="fw-bold" style="color: #dc3545;">-${formatCurrency(cashGST)}</span>
        </div>
        <hr>
        <div class="d-flex justify-content-between">
          <span class="fw-bold">Total Current Balance</span>
          <span class="fw-bold">${formatCurrency(currentBalance)}</span>
        </div>
      </div>
    </div>
  `;

  // Show the popup
  Swal.fire({
    title: 'Current Balance Breakdown',
    html: content,
    customClass: {
      container: 'kitty-breakdown-popup',
      popup: 'kitty-breakdown-popup',
      content: 'kitty-breakdown-content'
    },
    showCloseButton: true,
    showConfirmButton: false,
    width: '500px'
  });
}

(async function generateChapterLedger() {
  let currentBalance = 0;
  totalKittyAmount = 0;
  totalExpenseAmount = 0;
  totalExpenseBaseAmount = 0; // sum of base amounts (debit) only
  totalVisitorAmount = 0;
  cashExpenseAmount = 0;
  onlineExpenseAmount = 0;
  cashExpenseBaseAmount = 0; // base (debit) only
  onlineExpenseBaseAmount = 0; // base (debit) only
  cashVisitorAmount = 0;
  onlineVisitorAmount = 0;
  cashKittyAmount = 0;
  onlineKittyAmount = 0;
  cashOtherPayments = 0;
  onlineOtherPayments = 0;
  cashGSTAmount = 0;

  try {
    showLoader();
    console.log("=== Chapter Ledger Loading Process Started ===");

    // Step 1: Get logged-in chapter email and type
    console.log("Step 1: Getting user login type...");
    const loginType = getUserLoginType();
    console.log("Detected login type:", loginType);

    let chapterEmail;
    let chapterId;

    if (loginType === "ro_admin") {
      console.log("RO Admin detected, fetching from localStorage...");
      chapterEmail = localStorage.getItem("current_chapter_email");
      chapterId = parseInt(localStorage.getItem("current_chapter_id"));

      console.log("localStorage data found:", {
        email: chapterEmail,
        id: chapterId
      });

      if (!chapterEmail || !chapterId) {
        console.error("CRITICAL: Missing localStorage data for RO Admin");
        hideLoader();
        return;
      }
    } else {
      console.log("Regular chapter login detected, getting email from token...");
      chapterEmail = getUserEmail();
    }

    // Step 2: Fetch chapter details
    console.log("Step 2: Fetching chapter details...");
    const chaptersResponse = await fetch("http://localhost:5000/api/chapters");
    const chapters = await chaptersResponse.json();
    console.log("Chapters data received:", chapters.length, "chapters");

    let loggedInChapter;
    if (loginType === "ro_admin") {
      loggedInChapter = chapters.find(chapter => chapter.chapter_id === chapterId);
    } else {
      loggedInChapter = chapters.find(chapter =>
        chapter.email_id === chapterEmail ||
        chapter.vice_president_mail === chapterEmail ||
        chapter.president_mail === chapterEmail ||
        chapter.treasurer_mail === chapterEmail
      );
      if (loggedInChapter) {
        chapterId = loggedInChapter.chapter_id;
      }
    }

    console.log("Found chapter:", loggedInChapter);

    if (!loggedInChapter) {
      console.error("ERROR: No chapter found");
      hideLoader();
      return;
    }

    // Fetch all orders, transactions and expenses
    console.log("Fetching transactions data...");
    const [ordersResponse, transactionsResponse, expensesResponse, otherPaymentsResponse] = await Promise.all([
      fetch("http://localhost:5000/api/allOrders"),
      fetch("http://localhost:5000/api/allTransactions"),
      fetch("http://localhost:5000/api/allExpenses"),
      fetch("http://localhost:5000/api/allOtherPayment")
    ]);

    const [allOrders, allTransactions, allExpenses, allOtherPayments] = await Promise.all([
      ordersResponse.json(),
      transactionsResponse.json(),
      expensesResponse.json(),
      otherPaymentsResponse.json()
    ]);

    // Find the earliest transaction date (move this block here, after allOrders etc. are initialized)
    let earliestDate = new Date();
    if (allOrders.length > 0 || allExpenses.length > 0 || allOtherPayments.length > 0) {
      let dates = [];
      allOrders.forEach(order => { if (order.payment_time) dates.push(new Date(order.payment_time)); });
      allExpenses.forEach(expense => { if (expense.bill_date) dates.push(new Date(expense.bill_date)); });
      allOtherPayments.forEach(payment => { if (payment.date) dates.push(new Date(payment.date)); });
      if (dates.length > 0) {
        earliestDate = new Date(Math.min(...dates.map(d => d.getTime())));
      }
    }
    // Set opening balance date to one day before earliest transaction
    let openingBalanceDate = new Date(earliestDate);
    openingBalanceDate.setDate(openingBalanceDate.getDate() - 1);

    // Filter orders for current chapter
    console.log("Filtering orders for chapter:", chapterId);
    const chapterOrders = allOrders.filter(order => 
      parseInt(order.chapter_id) === chapterId && 
      (order.payment_note === "meeting-payments" || 
       order.payment_note === "visitor-payment" ||
       order.payment_note === "Visitor Payment")
    );
    console.log("Found chapter orders:", chapterOrders.length);

    // Process all orders chronologically
    const allTransactionItems = [];

    // Add kitty and visitor payments
    chapterOrders.forEach(order => {
      const successfulTransaction = allTransactions.find(
        transaction => 
          transaction.order_id === order.order_id && 
          transaction.payment_status === "SUCCESS"
      );

      if (successfulTransaction) {
        const amount = parseFloat(successfulTransaction.payment_amount) - parseFloat(order.tax);
        const gst = parseFloat(order.tax);
        const isKittyPayment = order.payment_note === "meeting-payments";
        const isVisitorPayment = order.payment_note === "visitor-payment" || order.payment_note === "Visitor Payment";
        
        // Determine payment method
        let paymentMethod = "N/A";
        if (successfulTransaction.payment_method) {
          if (typeof successfulTransaction.payment_method === 'string') {
            try {
              const paymentMethodObj = JSON.parse(successfulTransaction.payment_method);
              if (paymentMethodObj.upi) paymentMethod = "UPI";
              else if (paymentMethodObj.netbanking) paymentMethod = "Net Banking";
              else if (paymentMethodObj.card) paymentMethod = "Card";
              else if (paymentMethodObj.cash) paymentMethod = "Cash";
            } catch (e) {
              paymentMethod = successfulTransaction.payment_method;
            }
          } else {
            if (successfulTransaction.payment_method.upi) paymentMethod = "UPI";
            else if (successfulTransaction.payment_method.netbanking) paymentMethod = "Net Banking";
            else if (successfulTransaction.payment_method.card) paymentMethod = "Card";
            else if (successfulTransaction.payment_method.cash) paymentMethod = "Cash";
          }
        }

        let description;
        if (isKittyPayment) {
          description = `Meeting Fee - ${order.member_name}<br>
                        <small class="text-muted">
                          ${order.company || 'N/A'} | ${paymentMethod}
                        </small>`;
        } else if (isVisitorPayment) {
          description = `<div style="display: flex; align-items: center; gap: 8px;">
                          <div style="background-color: #4CAF50; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                            V
                          </div>
                          <div>
                            <span style="color: #4CAF50; font-weight: 500;">Visitor Fee - ${order.visitor_name || 'N/A'}</span><br>
                            <small class="text-muted">
                              Invited by ${order.member_name || 'N/A'} | ${paymentMethod}
                            </small>
                          </div>
                        </div>`;
        }

        allTransactionItems.push({
          date: new Date(successfulTransaction.payment_time),
          type: isKittyPayment ? "kitty" : "visitor",
          description: description,
          amount: amount,
          gst: gst,
          totalAmount: amount + gst,
          paymentMethod: paymentMethod
        });

        if (isKittyPayment) {
          totalKittyAmount += amount;
          // Track kitty payments by mode
          if (successfulTransaction.payment_method?.cash || paymentMethod.toLowerCase() === 'cash') {
            cashKittyAmount += amount;
            cashGSTAmount += gst;
          } else {
            onlineKittyAmount += amount;
          }
        } else if (isVisitorPayment) {
          totalVisitorAmount += amount;
          // Track visitor payments by mode
          if (successfulTransaction.payment_method?.cash || paymentMethod.toLowerCase() === 'cash') {
            cashVisitorAmount += amount;
            cashGSTAmount += gst;
          } else {
            onlineVisitorAmount += amount;
          }
        }
      }
    });

    // Sort all items by date
    allTransactionItems.sort((a, b) => a.date - b.date);
    console.log("Total transaction items:", allTransactionItems.length);

    // Add expenses
    console.log("Processing expenses for chapter:", chapterId);
    const chapterExpenses = allExpenses.filter(expense => 
      parseInt(expense.chapter_id) === chapterId && 
      expense.delete_status === 0 && 
      expense.payment_status === "paid"
    );
    console.log("Found chapter expenses:", chapterExpenses.length);

    // Process other payments
    console.log("Processing other payments for chapter:", chapterId);
    const chapterOtherPayments = allOtherPayments.filter(payment => 
      parseInt(payment.chapter_id) === chapterId
    );
    console.log("Found chapter other payments:", chapterOtherPayments.length);

    // Process expenses
    chapterExpenses.forEach(expense => {
      // Parse amounts from expense data
      const baseAmount = parseFloat(expense.amount) || 0;
      const gstAmount = parseFloat(expense.gst_amount) || 0;
      const totalAmount = parseFloat(expense.total_amount) || (baseAmount + gstAmount);
      
      // Track expenses by payment mode
      if (expense.mode_of_payment.toLowerCase() === 'cash') {
        cashExpenseAmount += totalAmount;
        cashExpenseBaseAmount += baseAmount;
      } else {
        onlineExpenseAmount += totalAmount;
        onlineExpenseBaseAmount += baseAmount;
      }

      totalExpenseAmount += totalAmount;
      totalExpenseBaseAmount += baseAmount;
      
      allTransactionItems.push({
        date: new Date(expense.bill_date),
        type: "expense",
        description: `<div style="display: flex; align-items: center; gap: 8px;">
                       <div style="background-color: #ff4444; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                         E
                       </div>
                       <div>
                         <span style="color: #ff4444; font-weight: 500;">${expense.description}</span><br>
                         <small class="text-muted">
                           By: ${expense.submitted_by} | ${expense.mode_of_payment}
                           ${expense.bill_no ? ' | Bill #' + expense.bill_no : ''}
                         </small>
                       </div>
                     </div>`,
        amount: baseAmount, // base amount for debit
        gst: gstAmount,
        totalAmount: totalAmount,
        modeOfPayment: expense.mode_of_payment,
        submittedBy: expense.submitted_by
      });
    });

    // Process other payments
    chapterOtherPayments.forEach(payment => {
      const baseAmount = parseFloat(payment.total_amount) - (payment.is_gst ? parseFloat(payment.gst_amount) : 0);
      const gstAmount = payment.is_gst ? parseFloat(payment.gst_amount) : 0;
      const totalAmount = parseFloat(payment.total_amount);
      
      // Add to total kitty amount instead of expenses
      totalKittyAmount += totalAmount;
      currentBalance += totalAmount;

      // Track other payments by mode
      if (payment.mode_of_payment.toLowerCase() === 'cash') {
        cashOtherPayments += totalAmount;
        cashGSTAmount += gstAmount;
      } else {
        onlineOtherPayments += totalAmount;
      }
      
      allTransactionItems.push({
        date: new Date(payment.date),
        type: "kitty", // Changed from "expense" to "kitty"
        description: `<div style="display: flex; align-items: center; gap: 8px;">
                       <div style="background-color: #4CAF50; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                         P
                       </div>
                       <div>
                         <span style="color: #4CAF50; font-weight: 500;">${payment.payment_description}</span><br>
                         <small class="text-muted">
                           By: ${payment.added_by} | ${payment.mode_of_payment}
                         </small>
                       </div>
                     </div>`,
        amount: baseAmount,
        gst: gstAmount,
        totalAmount: totalAmount,
        modeOfPayment: payment.mode_of_payment,
        submittedBy: payment.added_by
      });
    });

    // Sort all items by date again after adding expenses and other payments
    allTransactionItems.sort((a, b) => a.date - b.date);
    console.log("Total transaction items after adding expenses and other payments:", allTransactionItems.length);

    // Insert opening balance as the very first transaction
    allTransactionItems.unshift({
      date: openingBalanceDate,
      type: "opening",
      description: "Opening Balance",
      amount: 0,
      gst: 0,
      totalAmount: 0,
      credit: currentBalance,
      balance: currentBalance
    });

    // Now process allTransactionItems in order to build ledgerData
    currentBalance = parseFloat(loggedInChapter.available_fund) || 0;
    ledgerData = [];
    allTransactionItems.forEach((item, idx) => {
      if (item.type === "opening") {
        ledgerData.push({
          sNo: ledgerData.length + 1,
          date: formatDate(item.date),
          description: item.description,
          billAmount: 0,
          debit: 0,
          credit: Math.round(currentBalance * 100) / 100,
          gst: 0,
          balance: Math.round(currentBalance * 100) / 100,
          balanceColor: currentBalance >= 0 ? "green" : "red"
        });
      } else if (item.type === "expense") {
        currentBalance -= item.amount;
        ledgerData.push({
          sNo: ledgerData.length + 1,
          date: formatDate(item.date),
          description: item.description,
          billAmount: Math.round(item.totalAmount * 100) / 100,
          debit: Math.round(item.amount * 100) / 100,
          credit: 0,
          gst: Math.round(item.gst * 100) / 100,
          balance: Math.round(currentBalance * 100) / 100,
          balanceColor: currentBalance >= 0 ? "green" : "red"
        });
      } else {
        currentBalance += item.amount;
        ledgerData.push({
          sNo: ledgerData.length + 1,
          date: formatDate(item.date),
          description: item.description,
          billAmount: Math.round(item.totalAmount * 100) / 100,
          debit: 0,
          credit: Math.round(item.amount * 100) / 100,
          gst: Math.round(item.gst * 100) / 100,
          balance: Math.round(currentBalance * 100) / 100,
          balanceColor: currentBalance >= 0 ? "green" : "red"
        });
      }
    });

    console.log("Updating UI with totals...");
    // Add visitor payments to totalKittyAmount before updating the UI
    const kittyAmountWithVisitors = totalKittyAmount + totalVisitorAmount;

    // Update UI with totals
    const kittyElement = document.getElementById("total-kitty-amount");
    const totalCashAmount = cashKittyAmount + cashVisitorAmount + cashOtherPayments;
    const totalOnlineAmount = onlineKittyAmount + onlineVisitorAmount + onlineOtherPayments;

    kittyElement.innerHTML = `
      <div>
        ${formatCurrency(kittyAmountWithVisitors)}
        <div style="font-size: 0.5em; margin-top: 2px; color: #666;">
          <span style="cursor: pointer;" id="cash-breakdown">
            <i class="ri-money-dollar-circle-line"></i> Cash: ${formatCurrency(totalCashAmount)}
          </span>
          <span style="margin-left: 8px; cursor: pointer;" id="online-breakdown">
            <i class="ri-bank-card-line"></i> Online: ${formatCurrency(totalOnlineAmount)}
          </span>
        </div>
      </div>
    `;
    
    // Update visitor amount with bifurcation
    const visitorElement = document.getElementById("total-visitor-amount");
    visitorElement.innerHTML = `
      <div>
        ${formatCurrency(totalVisitorAmount)}
        <div style="font-size: 0.5em; margin-top: 2px; color: #666;">
          <span>
            <i class="ri-money-dollar-circle-line"></i> Cash: ${formatCurrency(cashVisitorAmount)}
          </span>
          <span style="margin-left: 8px;">
            <i class="ri-bank-card-line"></i> Online: ${formatCurrency(onlineVisitorAmount)}
          </span>
        </div>
      </div>
    `;
    
    // Update expense amount with bifurcation
    const expenseElement = document.getElementById("total-expense-amount");
    expenseElement.innerHTML = `
      <div>
        ${formatCurrency(totalExpenseBaseAmount)}
        <div style="font-size: 0.5em; margin-top: 2px; color: #666;">
          <span>
            <i class="ri-money-dollar-circle-line"></i> Cash: ${formatCurrency(cashExpenseBaseAmount)}
          </span>
          <span style="margin-left: 8px;">
            <i class="ri-bank-card-line"></i> Online: ${formatCurrency(onlineExpenseBaseAmount)}
          </span>
        </div>
      </div>
    `;
    
    // Update current balance display with cash/online bifurcation
    const currentBalanceElement = document.getElementById("current-balance");
    const totalCashReceipts = cashKittyAmount + cashVisitorAmount + cashOtherPayments;
    const totalOnlineReceipts = onlineKittyAmount + onlineVisitorAmount + onlineOtherPayments;

    // Calculate cash and online expenses
    const cashExpenses = cashExpenseBaseAmount;
    const onlineExpenses = onlineExpenseBaseAmount;

    // Calculate cash and online balances
    const cashBalance = (parseFloat(loggedInChapter.available_fund) || 0) + totalCashReceipts + cashGSTAmount - cashExpenses;
    const onlineBalance = totalOnlineReceipts - onlineExpenses - cashGSTAmount;

    currentBalanceElement.innerHTML = `
      <div>
        ${formatCurrency(currentBalance)}
        <div style="font-size: 0.5em; margin-top: 2px; color: #666;">
          <span>
            <i class="ri-money-dollar-circle-line"></i> Cash: ${formatCurrency(cashBalance)}
          </span>
          <span style="margin-left: 8px;">
            <i class="ri-bank-card-line"></i> Online: ${formatCurrency(onlineBalance)}
          </span>
        </div>
      </div>
    `;

    // Make current balance clickable and add click handler
    currentBalanceElement.style.cursor = 'pointer';
    currentBalanceElement.addEventListener('click', function() {
      showCurrentBalanceBreakdownPopup(currentBalance, {
        total: cashBalance,
        receipts: totalCashReceipts,
        expenses: cashExpenses
      }, {
        total: onlineBalance,
        receipts: totalOnlineReceipts,
        expenses: onlineExpenses
      },
      parseFloat(loggedInChapter.available_fund) || 0,
      cashGSTAmount
      );
    });

    // Render ledger table
    console.log("Rendering ledger table...");
    const ledgerBody = document.getElementById("ledger-body");
    ledgerBody.innerHTML = "";
    
    ledgerData.forEach(entry => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${entry.sNo}</td>
        <td><b>${entry.date}</b></td>
        <td><b>${entry.description}</b></td>
        <td><b>${entry.billAmount ? formatCurrency(entry.billAmount) : "-"}</b></td>
        <td><b style="color: ${entry.debit ? "red" : "inherit"}">${entry.debit ? formatCurrency(entry.debit) : "-"}</b></td>
        <td><b style="color: ${entry.credit ? "green" : "inherit"}">${entry.credit ? formatCurrency(entry.credit) : "-"}</b></td>
        <td>${entry.gst ? formatCurrency(entry.gst) : "-"}</td>
        <td><b style="color: ${entry.balanceColor}">${formatCurrency(entry.balance)}</b></td>
      `;
      ledgerBody.appendChild(row);
    });

    // Initialize filters after table is populated
    initializeFilters();

    // Add click event listener to the kitty amount card
    kittyElement.style.cursor = 'pointer';
    kittyElement.addEventListener('click', function() {
      showKittyBreakdownPopup(kittyAmountWithVisitors);
    });

    // After finding loggedInChapter and before rendering the ledger table
    document.getElementById("opening-balance").textContent = formatCurrency(parseFloat(loggedInChapter.available_fund) || 0);

    // Add click handlers for cash and online breakdowns
    document.getElementById('cash-breakdown').addEventListener('click', function() {
      showPaymentModeBreakdownPopup('Cash', totalCashAmount, {
        kitty: cashKittyAmount,
        visitor: cashVisitorAmount,
        other: cashOtherPayments
      });
    });

    document.getElementById('online-breakdown').addEventListener('click', function() {
      showPaymentModeBreakdownPopup('Online', totalOnlineAmount, {
        kitty: onlineKittyAmount,
        visitor: onlineVisitorAmount,
        other: onlineOtherPayments
      });
    });

    console.log("Ledger generation completed successfully");

  } catch (error) {
    console.error("Error generating chapter ledger:", error);
    alert("An error occurred while generating the ledger.");
  } finally {
    hideLoader();
    console.log("=== Chapter Ledger Loading Process Completed ===");
  }
})();