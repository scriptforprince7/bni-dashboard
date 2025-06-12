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
  // Use local time for display
  return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
}

function formatCurrency(amount) {
  // First round the number according to the rules:
  // If decimal part is <= 0.5, round down to same number
  // If decimal part is > 0.5, round up to next number
  const decimalPart = amount - Math.floor(amount);
  let roundedAmount;
  if (decimalPart <= 0.5) {
    roundedAmount = Math.floor(amount);
  } else {
    roundedAmount = Math.ceil(amount);
  }

  // Format with 2 decimal places
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(roundedAmount);
}

// Global variable for ledger data
let ledgerData = [];

// Pagination variables
let currentPage = 1;
const itemsPerPage = 25;
let totalPages = 1;
let filteredLedgerData = [];
let showAllEntries = false;  // Variable to track if we're showing all entries

// Global variables for filtering
let selectedMonth = 'all';
let selectedYear = 'all';
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
let cashExpenseGST = 0; // Track cash expense GST
let onlineExpenseGST = 0; // Track online expense GST
let cashVisitorAmount = 0;
let onlineVisitorAmount = 0;
let cashKittyAmount = 0;
let onlineKittyAmount = 0;
let cashOtherPayments = 0;
let onlineOtherPayments = 0;
let cashGSTAmount = 0;

// Add variables for pending expenses
let totalPendingExpenseAmount = 0;
let cashPendingExpenseAmount = 0;
let onlinePendingExpenseAmount = 0;
let pendingExpenseDetails = [];

// Add variables for paid expenses tracking
let paidExpenseDetails = [];

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

  // Get unique years from ledger data
  const years = new Set();
  ledgerData.forEach(entry => {
    if (entry.date) {
      const year = entry.date.split('/')[2];
      if (year) years.add(year);
    }
  });
  const sortedYears = Array.from(years).sort((a, b) => b - a); // Sort years in descending order

  // Populate year filter
  const yearFilter = document.getElementById('yearFilter');
  yearFilter.innerHTML = '<li><a class="dropdown-item" href="#" data-value="all">All Years</a></li>';
  sortedYears.forEach(year => {
    const li = document.createElement('li');
    li.innerHTML = `<a class="dropdown-item" href="#" data-value="${year}">${year}</a>`;
    yearFilter.appendChild(li);
  });

  // Populate month filter
  const monthFilter = document.getElementById('monthFilter');
  monthFilter.innerHTML = '<li><a class="dropdown-item" href="#" data-value="all">All Months</a></li>';
  months.forEach(month => {
    const li = document.createElement('li');
    li.innerHTML = `<a class="dropdown-item" href="#" data-value="${month.value}">${month.label}</a>`;
    monthFilter.appendChild(li);
  });

  // Add event listeners for filters
  document.getElementById('yearFilter').addEventListener('click', function(e) {
    if (e.target.classList.contains('dropdown-item')) {
      e.preventDefault();
      selectedYear = e.target.dataset.value;
      document.getElementById('yearFilterBtn').textContent = 
        selectedYear === 'all' ? 'Year' : selectedYear;
      applyFilters();
    }
  });

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
    selectedYear = 'all';
    selectedType = 'all';
    document.getElementById('monthFilterBtn').innerHTML = '<i class="ri-calendar-line me-1"></i> Month';
    document.getElementById('yearFilterBtn').innerHTML = '<i class="ri-calendar-line me-1"></i> Year';
    document.getElementById('typeFilterBtn').innerHTML = '<i class="ri-filter-line me-1"></i> Type';
    applyFilters();
  });

  // Add export button event listener
  document.getElementById('exportLedger').addEventListener('click', exportToExcel);
}

function applyFilters() {
  // Reset current page and showAllEntries when filters change
  currentPage = 1;
  showAllEntries = false;
  
  const tbody = document.getElementById('ledger-body');
  const rows = Array.from(tbody.getElementsByTagName('tr'));
  
  // Filter the ledger data
  filteredLedgerData = ledgerData.filter(entry => {
    const [day, month, year] = entry.date.split('/');
    let showEntry = true;
    
    // Apply year filter
    if (selectedYear !== 'all' && year !== selectedYear) {
      showEntry = false;
    }
    
    // Apply month filter
    if (selectedMonth !== 'all' && month !== selectedMonth) {
      showEntry = false;
    }
    
    // Apply type filter
    if (selectedType !== 'all') {
      const isExpense = entry.description.includes('background-color: #ff4444') || entry.description.includes('E</div>');
      const isVisitor = entry.description.includes('background-color: #4CAF50') || entry.description.includes('V</div>');
      const isKitty = entry.description.includes('Meeting Fee') && !isExpense && !isVisitor;

      if (selectedType === 'kitty' && !isKitty) {
        showEntry = false;
      } else if (selectedType === 'visitor' && !isVisitor) {
        showEntry = false;
      } else if (selectedType === 'expense' && !isExpense) {
        showEntry = false;
      }
    }
    
    return showEntry;
  });

  // Update row numbers for filtered data
  filteredLedgerData.forEach((entry, index) => {
    entry.sNo = index + 1;
  });

  // Update totals based on filtered data
  updateFilteredTotals(filteredLedgerData);

  // Render the table with pagination
  renderLedgerTable();
}

function updateFilteredTotals(visibleRows) {
  let filteredKittyAmount = 0;
  let filteredVisitorAmount = 0;
  let filteredExpenseAmount = 0;
  let filteredCashExpenseAmount = 0;
  let filteredOnlineExpenseAmount = 0;
  let filteredCashVisitorAmount = 0;
  let filteredOnlineVisitorAmount = 0;
  let filteredCashKittyAmount = 0;
  let filteredOnlineKittyAmount = 0;
  let filteredCashOtherPayments = 0;
  let filteredOnlineOtherPayments = 0;
  let filteredCashGSTAmount = 0;
  let filteredPendingExpenseAmount = 0;
  let filteredCashPendingExpenseAmount = 0;
  let filteredOnlinePendingExpenseAmount = 0;

  // Track unique members and visitors for filtered data
  const filteredMeetingMembers = new Set();
  const filteredMeetingMembersCash = new Set();
  const filteredMeetingMembersOnline = new Set();
  const filteredVisitorMembers = new Set();
  const filteredVisitorMembersCash = new Set();
  const filteredVisitorMembersOnline = new Set();

  // Store filtered details for popups
  const filteredMeetingMemberDetailsCash = [];
  const filteredMeetingMemberDetailsOnline = [];
  const filteredVisitorMemberDetailsCash = [];
  const filteredVisitorMemberDetailsOnline = [];
  const filteredPendingExpenseDetails = [];
  const filteredPaidExpenseDetails = [];

  visibleRows.forEach(row => {
    const description = row.cells[2].innerHTML;
    const debit = parseFloat(row.cells[4].textContent.replace(/[^0-9.-]+/g, '') || 0);
    const credit = parseFloat(row.cells[5].textContent.replace(/[^0-9.-]+/g, '') || 0);
    const gst = parseFloat(row.cells[6].textContent.replace(/[^0-9.-]+/g, '') || 0);
    const date = row.cells[1].textContent;

    // Check for expense (red E icon)
    const isExpense = description.includes('background-color: #ff4444') || description.includes('E</div>');
    // Check for visitor payment (green V icon)
    const isVisitor = description.includes('background-color: #4CAF50') || description.includes('V</div>');
    // Check for meeting fee (no special icon)
    const isKitty = description.includes('Meeting Fee') && !isExpense && !isVisitor;
    
    const isCashPayment = description.toLowerCase().includes('cash');

    if (isKitty) {
      filteredKittyAmount += credit;
      if (isCashPayment) {
        filteredCashKittyAmount += credit;
        filteredCashGSTAmount += gst;
      } else {
        filteredOnlineKittyAmount += credit;
      }

      // Track meeting members
      const nameMatch = description.match(/Meeting Fee - ([^<]+)/);
      const companyMatch = description.match(/<small class=\"text-muted\">([^|]*)\|/);
      const memberName = nameMatch && nameMatch[1] ? nameMatch[1].trim() : '';
      const company = companyMatch && companyMatch[1] ? companyMatch[1].trim() : '';
      
      if (memberName) {
        filteredMeetingMembers.add(memberName);
        const detailObj = {
          name: memberName,
          company,
          date: date,
          amount: credit
        };
        if (isCashPayment) {
          filteredMeetingMembersCash.add(memberName);
          filteredMeetingMemberDetailsCash.push(detailObj);
        } else {
          filteredMeetingMembersOnline.add(memberName);
          filteredMeetingMemberDetailsOnline.push(detailObj);
        }
      }
    } else if (isVisitor) {
      filteredVisitorAmount += credit;
      if (isCashPayment) {
        filteredCashVisitorAmount += credit;
        filteredCashGSTAmount += gst;
      } else {
        filteredOnlineVisitorAmount += credit;
      }

      // Track visitor members
      const nameMatch = description.match(/Visitor Fee - ([^<]+)/);
      const invitedByMatch = description.match(/Invited by ([^|<]+)/);
      const visitorName = nameMatch && nameMatch[1] && nameMatch[1] !== 'N/A' ? nameMatch[1].trim() : '';
      const invitedBy = invitedByMatch && invitedByMatch[1] ? invitedByMatch[1].trim() : '';
      
      if (visitorName) {
        filteredVisitorMembers.add(visitorName);
        const detailObj = {
          name: visitorName,
          invitedBy,
          date: date,
          amount: credit
        };
        if (isCashPayment) {
          filteredVisitorMembersCash.add(visitorName);
          filteredVisitorMemberDetailsCash.push(detailObj);
        } else {
          filteredVisitorMembersOnline.add(visitorName);
          filteredVisitorMemberDetailsOnline.push(detailObj);
        }
      }
    } else if (isExpense) {
      filteredExpenseAmount += debit;
      if (isCashPayment) {
        filteredCashExpenseAmount += debit;
      } else {
        filteredOnlineExpenseAmount += debit;
      }

      // Track expense details for popup
      const expenseMatch = description.match(/<span style="color: #ff4444; font-weight: 500;">([^<]+)<\/span>/);
      const submittedByMatch = description.match(/By: ([^|]+)/);
      const billNoMatch = description.match(/Bill #([^<]+)/);
      
      if (expenseMatch) {
        const expenseDetail = {
          description: expenseMatch[1],
          date: date,
          submittedBy: submittedByMatch ? submittedByMatch[1].trim() : 'N/A',
          billNo: billNoMatch ? billNoMatch[1].trim() : '-',
          amount: debit,
          mode: isCashPayment ? 'Cash' : 'Online',
          gstAmount: gst,
          baseAmount: debit - gst
        };
        filteredPaidExpenseDetails.push(expenseDetail);
      }
    }
  });

  // Calculate filtered current balance
  const filteredCurrentBalance = visibleRows.length > 0 ? 
    parseFloat(visibleRows[visibleRows.length - 1].cells[7].textContent.replace(/[^0-9.-]+/g, '') || 0) : 0;

  // Calculate filtered cash and online balances
  const filteredCashBalance = filteredCurrentBalance * (filteredCashKittyAmount + filteredCashVisitorAmount + filteredCashOtherPayments) / 
    (filteredKittyAmount + filteredVisitorAmount + filteredCashOtherPayments + filteredOnlineOtherPayments);
  const filteredOnlineBalance = filteredCurrentBalance - filteredCashBalance;

  // Update the UI with filtered amounts
  const kittyElement = document.getElementById('total-kitty-amount');
  const visitorElement = document.getElementById('total-visitor-amount');
  const expenseElement = document.getElementById('total-expense-amount');
  const currentBalanceElement = document.getElementById('current-balance');
  const meetingMemberCountElement = document.getElementById('meeting-member-count');
  const visitorMemberCountElement = document.getElementById('visitor-member-count');

  // Update kitty amount with click handler
  kittyElement.innerHTML = `
    <div>
      ${formatCurrency(filteredKittyAmount)}
      <div style="font-size: 0.5em; margin-top: 2px; color: #666;">
        <span style="cursor: pointer;" id="cash-breakdown">
          <i class="ri-money-dollar-circle-line"></i> Cash: ${formatCurrency(filteredCashKittyAmount)}
        </span>
        <span style="margin-left: 8px; cursor: pointer;" id="online-breakdown">
          <i class="ri-bank-card-line"></i> Online: ${formatCurrency(filteredOnlineKittyAmount)}
        </span>
      </div>
    </div>
  `;

  // Add click handlers for kitty breakdown
  document.getElementById('cash-breakdown').addEventListener('click', function() {
    showPaymentModeBreakdownPopup('Cash', filteredCashKittyAmount, {
      kitty: filteredCashKittyAmount,
      visitor: filteredCashVisitorAmount,
      other: filteredCashOtherPayments
    });
  });

  document.getElementById('online-breakdown').addEventListener('click', function() {
    showPaymentModeBreakdownPopup('Online', filteredOnlineKittyAmount, {
      kitty: filteredOnlineKittyAmount,
      visitor: filteredOnlineVisitorAmount,
      other: filteredOnlineOtherPayments
    });
  });

  // Update visitor amount
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

  // Update expense amount with click handler
  expenseElement.innerHTML = `
    <div style="cursor: pointer;">
      ${formatCurrency(filteredExpenseAmount)}
      <div style="font-size: 0.5em; margin-top: 2px; color: #666;">
        <span id="expense-cash-breakdown" style="cursor:pointer;">
          <i class="ri-money-dollar-circle-line"></i> Cash: ${formatCurrency(filteredCashExpenseAmount)}
        </span>
        <span id="expense-online-breakdown" style="margin-left:8px; cursor:pointer;">
          <i class="ri-bank-card-line"></i> Online: ${formatCurrency(filteredOnlineExpenseAmount)}
        </span>
      </div>
    </div>
  `;

  // Add click handlers for expense breakdown
  expenseElement.addEventListener('click', () => showTotalExpensesPopup('all', filteredPaidExpenseDetails));
  document.getElementById('expense-cash-breakdown').addEventListener('click', () => showTotalExpensesPopup('cash', filteredPaidExpenseDetails));
  document.getElementById('expense-online-breakdown').addEventListener('click', () => showTotalExpensesPopup('online', filteredPaidExpenseDetails));

  // Update current balance with click handler
  currentBalanceElement.innerHTML = `
    <div style="cursor: pointer;">
      ${formatCurrency(filteredCurrentBalance)}
      <div style="font-size: 0.5em; margin-top: 2px; color: #666;">
        <span>
          <i class="ri-money-dollar-circle-line"></i> Cash: ${formatCurrency(filteredCashBalance)}
        </span>
        <span style="margin-left: 8px;">
          <i class="ri-bank-card-line"></i> Online: ${formatCurrency(filteredOnlineBalance)}
        </span>
      </div>
    </div>
  `;

  // Add click handler for current balance
  currentBalanceElement.addEventListener('click', function() {
    showCurrentBalanceBreakdownPopup(filteredCurrentBalance, {
      total: filteredCashBalance,
      receipts: filteredCashKittyAmount + filteredCashVisitorAmount + filteredCashOtherPayments,
      expenses: filteredCashExpenseAmount,
      expenseGST: filteredCashExpenseGST
    }, {
      total: filteredOnlineBalance,
      receipts: filteredOnlineKittyAmount + filteredOnlineVisitorAmount + filteredOnlineOtherPayments,
      expenses: filteredOnlineExpenseAmount,
      expenseGST: filteredOnlineExpenseGST
    },
    parseFloat(loggedInChapter.available_fund) || 0,
    filteredCashGSTAmount
    );
  });

  // Update meeting member count
  meetingMemberCountElement.textContent = filteredMeetingMembers.size;
  document.getElementById('meeting-member-cash-count').innerHTML = '<i class="ri-money-dollar-circle-line"></i> Cash: <span>' + filteredMeetingMembersCash.size + '</span>';
  document.getElementById('meeting-member-online-count').innerHTML = '<i class="ri-bank-card-line"></i> Online: <span>' + filteredMeetingMembersOnline.size + '</span>';

  // Update visitor member count
  visitorMemberCountElement.textContent = filteredVisitorMembers.size;
  document.getElementById('visitor-member-cash-count').innerHTML = '<i class="ri-money-dollar-circle-line"></i> Cash: <span>' + filteredVisitorMembersCash.size + '</span>';
  document.getElementById('visitor-member-online-count').innerHTML = '<i class="ri-bank-card-line"></i> Online: <span>' + filteredVisitorMembersOnline.size + '</span>';

  // Add click handlers for member lists
  document.getElementById('meeting-member-cash-count').addEventListener('click', () => showMemberListPopup('Meeting Payment Members (Cash)', filteredMeetingMemberDetailsCash, 'meeting'));
  document.getElementById('meeting-member-online-count').addEventListener('click', () => showMemberListPopup('Meeting Payment Members (Online)', filteredMeetingMemberDetailsOnline, 'meeting'));
  document.getElementById('visitor-member-cash-count').addEventListener('click', () => showMemberListPopup('Visitor Payment Members (Cash)', filteredVisitorMemberDetailsCash, 'visitor'));
  document.getElementById('visitor-member-online-count').addEventListener('click', () => showMemberListPopup('Visitor Payment Members (Online)', filteredVisitorMemberDetailsOnline, 'visitor'));
}

// Update showTotalExpensesPopup to accept filtered details
function showTotalExpensesPopup(mode, filteredDetails) {
  const filteredExpenses = filteredDetails.filter(expense => {
    if (mode === 'all') return true;
    return expense.mode.toLowerCase() === mode.toLowerCase();
  });

  if (filteredExpenses.length === 0) {
    Swal.fire({
      title: mode === 'all' ? 'Total Expenses' : `${mode.charAt(0).toUpperCase() + mode.slice(1)} Expenses`,
      html: '<p>No expenses found</p>',
      width: 500,
      showCloseButton: true,
      showConfirmButton: false,
      customClass: {
        container: 'kitty-breakdown-popup',
        popup: 'kitty-breakdown-popup',
        content: 'kitty-breakdown-content'
      }
    });
    return;
  }

  // Calculate totals for the filtered expenses
  const totalBaseAmount = filteredExpenses.reduce((sum, e) => sum + e.baseAmount, 0);
  const totalGST = filteredExpenses.reduce((sum, e) => sum + e.gstAmount, 0);
  const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  let html = `<div style="padding:0.5em 0;">
    <div style="margin-bottom: 1em; padding: 0.5em; background: #f8f9fa; border-radius: 4px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.5em;">
        <span style="font-weight: 600;">Total Base Amount:</span>
        <span style="font-weight: 600;">${formatCurrency(totalBaseAmount)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.5em;">
        <span style="font-weight: 600;">Total GST:</span>
        <span style="font-weight: 600;">${formatCurrency(totalGST)}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="font-weight: 600;">Total Amount (including GST):</span>
        <span style="font-weight: 600;">${formatCurrency(totalAmount)}</span>
      </div>
    </div>
    <table style="width:100%;border-collapse:separate;border-spacing:0 8px;">
      <thead>
        <tr style="background:#f8f9fa;color:#495057;font-size:1em;">
          <th style="text-align:center;padding:6px 8px;">#</th>
          <th style="text-align:center;padding:6px 8px;">Description</th>
          <th style="text-align:center;padding:6px 8px;">Date</th>
          <th style="text-align:center;padding:6px 8px;">Submitted By</th>
          <th style="text-align:center;padding:6px 8px;">Bill No.</th>
          <th style="text-align:center;padding:6px 8px;">Base Amount</th>
          <th style="text-align:center;padding:6px 8px;">GST %</th>
          <th style="text-align:center;padding:6px 8px;">GST Amount</th>
          <th style="text-align:center;padding:6px 8px;">Total Amount</th>
        </tr>
      </thead>
      <tbody>`;
  
  filteredExpenses.forEach((expense, i) => {
    html += `<tr style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.03);">
      <td style="padding:6px 8px;font-weight:600;color:#d01f2f;">${i+1}</td>
      <td style="padding:6px 8px;font-weight:600;">${expense.description}</td>
      <td style="padding:6px 8px;">${expense.date}</td>
      <td style="padding:6px 8px;">${expense.submittedBy}</td>
      <td style="padding:6px 8px;">${expense.billNo}</td>
      <td style="padding:6px 8px;text-align:right;">${formatCurrency(expense.baseAmount)}</td>
      <td style="padding:6px 8px;text-align:right;">${expense.gstPercentage || '-'}</td>
      <td style="padding:6px 8px;text-align:right;">${formatCurrency(expense.gstAmount)}</td>
      <td style="padding:6px 8px;text-align:right;font-weight:600;">${formatCurrency(expense.amount)}</td>
    </tr>`;
  });
  
  html += `</tbody></table></div>`;

  Swal.fire({
    title: mode === 'all' ? 'Total Expenses' : `${mode.charAt(0).toUpperCase() + mode.slice(1)} Expenses`,
    html,
    width: 1200,
    showCloseButton: true,
    showConfirmButton: false,
    customClass: {
      container: 'kitty-breakdown-popup',
      popup: 'kitty-breakdown-popup',
      content: 'kitty-breakdown-content'
    }
  });
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
        <div class="d-flex justify-content-between mb-2">
          <span><i class="ri-money-dollar-circle-line me-2"></i>Cash Expense GST</span>
          <span class="fw-bold" style="color: #dc3545;">${formatCurrency(cashBreakdown.expenseGST)}</span>
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
          <span><i class="ri-bank-card-line me-2"></i>Online Expense GST</span>
          <span class="fw-bold" style="color: #28a745;">${formatCurrency(onlineBreakdown.expenseGST)}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span><i class="ri-bank-card-line me-2"></i>Less: Cash GST</span>
          <span class="fw-bold" style="color: #dc3545;">-${formatCurrency(cashGST)}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span><i class="ri-bank-card-line me-2"></i>Add: Cash Expense GST</span>
          <span class="fw-bold" style="color: #28a745;">+${formatCurrency(cashBreakdown.expenseGST)}</span>
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

// Add this function after showCurrentBalanceBreakdownPopup
function showPendingExpensesPopup(mode) {
  const filteredDetails = pendingExpenseDetails.filter(expense => 
    mode === 'all' || expense.mode.toLowerCase() === mode.toLowerCase()
  );

  if (filteredDetails.length === 0) {
    Swal.fire({
      title: 'Pending Expenses',
      html: '<p>No pending expenses found</p>',
      width: 500,
      showCloseButton: true,
      showConfirmButton: false,
      customClass: {
        container: 'kitty-breakdown-popup',
        popup: 'kitty-breakdown-popup',
        content: 'kitty-breakdown-content'
      }
    });
    return;
  }

  // Calculate totals for the filtered expenses
  const totalBaseAmount = filteredDetails.reduce((sum, e) => sum + e.baseAmount, 0);
  const totalGST = filteredDetails.reduce((sum, e) => sum + e.gstAmount, 0);
  const totalAmount = filteredDetails.reduce((sum, e) => sum + e.amount, 0);

  let html = `<div style="padding:0.5em 0;">
    <div style="margin-bottom: 1em; padding: 0.5em; background: #f8f9fa; border-radius: 4px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.5em;">
        <span style="font-weight: 600;">Total Base Amount:</span>
        <span style="font-weight: 600;">${formatCurrency(totalBaseAmount)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.5em;">
        <span style="font-weight: 600;">Total GST:</span>
        <span style="font-weight: 600;">${formatCurrency(totalGST)}</span>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span style="font-weight: 600;">Total Amount (including GST):</span>
        <span style="font-weight: 600;">${formatCurrency(totalAmount)}</span>
      </div>
    </div>
    <table style="width:100%;border-collapse:separate;border-spacing:0 8px;">
      <thead>
        <tr style="background:#f8f9fa;color:#495057;font-size:1em;">
          <th style="text-align:center;padding:6px 8px;">#</th>
          <th style="text-align:center;padding:6px 8px;">Description</th>
          <th style="text-align:center;padding:6px 8px;">Date</th>
          <th style="text-align:center;padding:6px 8px;">Submitted By</th>
          <th style="text-align:center;padding:6px 8px;">Bill No.</th>
          <th style="text-align:center;padding:6px 8px;">Base Amount</th>
          <th style="text-align:center;padding:6px 8px;">GST %</th>
          <th style="text-align:center;padding:6px 8px;">GST Amount</th>
          <th style="text-align:center;padding:6px 8px;">Total Amount</th>
        </tr>
      </thead>
      <tbody>`;
  
  filteredDetails.forEach((expense, i) => {
    html += `<tr style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.03);">
      <td style="padding:6px 8px;font-weight:600;color:#d01f2f;">${i+1}</td>
      <td style="padding:6px 8px;font-weight:600;">${expense.description}</td>
      <td style="padding:6px 8px;">${formatDate(expense.date)}</td>
      <td style="padding:6px 8px;">${expense.submittedBy}</td>
      <td style="padding:6px 8px;">${expense.billNo || '-'}</td>
      <td style="padding:6px 8px;text-align:right;">${formatCurrency(expense.baseAmount)}</td>
      <td style="padding:6px 8px;text-align:right;">${expense.gstPercentage || '-'}</td>
      <td style="padding:6px 8px;text-align:right;">${formatCurrency(expense.gstAmount)}</td>
      <td style="padding:6px 8px;text-align:right;font-weight:600;">${formatCurrency(expense.amount)}</td>
    </tr>`;
  });
  
  html += `</tbody></table></div>`;

  Swal.fire({
    title: 'Pending Expenses',
    html,
    width: 1200,
    showCloseButton: true,
    showConfirmButton: false,
    customClass: {
      container: 'kitty-breakdown-popup',
      popup: 'kitty-breakdown-popup',
      content: 'kitty-breakdown-content'
    }
  });
}

// Function to update pagination
function updatePagination() {
  const paginationContainer = document.getElementById('pagination-container');
  if (!paginationContainer) return;

  // Calculate total pages
  totalPages = Math.ceil(filteredLedgerData.length / itemsPerPage);
  
  // Generate pagination HTML
  let paginationHTML = `
    <nav aria-label="Page navigation">
      <ul class="pagination justify-content-center mb-0">
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
          <a class="page-link" href="#" data-page="prev" aria-label="Previous">
            <span aria-hidden="true">&laquo;</span>
          </a>
        </li>
  `;

  // Add page numbers
  for (let i = 1; i <= totalPages; i++) {
    paginationHTML += `
      <li class="page-item ${currentPage === i ? 'active' : ''}">
        <a class="page-link" href="#" data-page="${i}">${i}</a>
      </li>
    `;
  }

  paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
          <a class="page-link" href="#" data-page="next" aria-label="Next">
            <span aria-hidden="true">&raquo;</span>
          </a>
        </li>
        <li class="page-item">
          <a class="page-link ${showAllEntries ? 'active' : ''}" href="#" data-page="all">
            Show All
          </a>
        </li>
      </ul>
    </nav>
  `;

  paginationContainer.innerHTML = paginationHTML;

  // Add click event listeners to pagination links
  paginationContainer.querySelectorAll('.page-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const page = this.dataset.page;
      
      if (page === 'all') {
        showAllEntries = !showAllEntries;
        renderLedgerTable();
      } else if (page === 'prev' && currentPage > 1) {
        showAllEntries = false;
        currentPage--;
        renderLedgerTable();
      } else if (page === 'next' && currentPage < totalPages) {
        showAllEntries = false;
        currentPage++;
        renderLedgerTable();
      } else if (page !== 'prev' && page !== 'next') {
        showAllEntries = false;
        currentPage = parseInt(page);
        renderLedgerTable();
      }
    });
  });
}

// Function to render ledger table with pagination
function renderLedgerTable() {
  const ledgerBody = document.getElementById("ledger-body");
  ledgerBody.innerHTML = "";
  
  let currentPageItems;
  
  if (showAllEntries) {
    // Show all entries
    currentPageItems = filteredLedgerData;
  } else {
    // Calculate start and end indices for current page
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredLedgerData.length);
    currentPageItems = filteredLedgerData.slice(startIndex, endIndex);
  }
  
  currentPageItems.forEach(entry => {
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

  // Update pagination controls
  updatePagination();
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
  cashExpenseGST = 0; // Track cash expense GST
  onlineExpenseGST = 0; // Track online expense GST
  cashVisitorAmount = 0;
  onlineVisitorAmount = 0;
  cashKittyAmount = 0;
  onlineKittyAmount = 0;
  cashOtherPayments = 0;
  onlineOtherPayments = 0;
  cashGSTAmount = 0;

  // Add variables for pending expenses
  totalPendingExpenseAmount = 0;
  cashPendingExpenseAmount = 0;
  onlinePendingExpenseAmount = 0;
  pendingExpenseDetails = [];

  // Add variables for paid expenses tracking
  paidExpenseDetails = [];

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
    const chaptersResponse = await fetch("https://backend.bninewdelhi.com/api/chapters");
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
      fetch("https://backend.bninewdelhi.com/api/allOrders"),
      fetch("https://backend.bninewdelhi.com/api/allTransactions"),
      fetch("https://backend.bninewdelhi.com/api/allExpenses"),
      fetch("https://backend.bninewdelhi.com/api/allOtherPayment")
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
      expense.delete_status === 0
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
      
      // Track expenses by payment mode and status
      if (expense.payment_status === "paid") {
        if (expense.mode_of_payment.toLowerCase() === 'cash') {
          cashExpenseAmount += totalAmount;
          cashExpenseBaseAmount += baseAmount;
          cashExpenseGST += gstAmount;
        } else {
          onlineExpenseAmount += totalAmount;
          onlineExpenseBaseAmount += baseAmount;
          onlineExpenseGST += gstAmount;
        }
        totalExpenseAmount += totalAmount;
        totalExpenseBaseAmount += baseAmount;

        // Store paid expense details for popup
        paidExpenseDetails.push({
          description: expense.description,
          amount: totalAmount,
          date: expense.bill_date,
          mode: expense.mode_of_payment,
          submittedBy: expense.submitted_by,
          billNo: expense.bill_no,
          gstAmount: gstAmount,
          baseAmount: baseAmount,
          gstPercentage: expense.gst_percentage
        });

        // Only add paid expenses to transaction items
        allTransactionItems.push({
          date: new Date(expense.bill_date),
          type: "expense",
          description: `<div style="display: flex; align-items: center; gap: 8px;">
                         <div style="background-color: #ff4444; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                           E
                         </div>
                         <div>
                           <span style="color: #ff4444; font-weight: 500;">${expense.description}</span><br>
                           <small class="text-align:right;">
                             By: ${expense.submitted_by} | ${expense.mode_of_payment}
                             ${expense.bill_no ? ' | Bill #' + expense.bill_no : ''}
                           </small>
                         </div>
                       </div>`,
          amount: baseAmount,
          gst: gstAmount,
          totalAmount: totalAmount,
          modeOfPayment: expense.mode_of_payment,
          submittedBy: expense.submitted_by
        });
      } else if (expense.payment_status === "pending") {
        console.log("Found pending expense:", expense);
        // Track pending expenses using base amount (excluding GST)
        totalPendingExpenseAmount += baseAmount;
        if (expense.mode_of_payment.toLowerCase() === 'cash') {
          cashPendingExpenseAmount += baseAmount;
        } else {
          onlinePendingExpenseAmount += baseAmount;
        }
        // Store pending expense details for popup
        pendingExpenseDetails.push({
          description: expense.description,
          amount: totalAmount,
          date: expense.bill_date,
          mode: expense.mode_of_payment,
          submittedBy: expense.submitted_by,
          billNo: expense.bill_no,
          gstAmount: gstAmount,
          baseAmount: baseAmount,
          gstPercentage: expense.gst_percentage
        });
      }
    });

    // Calculate total GST for pending expenses
    const totalPendingGST = pendingExpenseDetails.reduce((sum, expense) => sum + expense.gstAmount, 0);

    // Update the UI with pending expenses
    document.getElementById('pending-expense-amount').innerHTML = 
      `${formatCurrency(totalPendingExpenseAmount)}<b> <small style="font-size: 0.5em; color: #666;">(exc. ${formatCurrency(totalPendingGST)} GST)</small> </b>`;
    
    document.getElementById('pending-expense-cash-count').querySelector('span').textContent = 
      formatCurrency(cashPendingExpenseAmount);
    
    document.getElementById('pending-expense-online-count').querySelector('span').textContent = 
      formatCurrency(onlinePendingExpenseAmount);

    // Add click handlers for pending expenses
    document.getElementById('pending-expense-amount').style.cursor = 'pointer';
    document.getElementById('pending-expense-amount').addEventListener('click', () => showPendingExpensesPopup('all'));

    document.getElementById('pending-expense-cash-count').style.cursor = 'pointer';
    document.getElementById('pending-expense-cash-count').addEventListener('click', () => showPendingExpensesPopup('cash'));
    
    document.getElementById('pending-expense-online-count').style.cursor = 'pointer';
    document.getElementById('pending-expense-online-count').addEventListener('click', () => showPendingExpensesPopup('online'));

    // Process other payments
    chapterOtherPayments.forEach(payment => {
      const baseAmount = parseFloat(payment.total_amount) - (payment.is_gst ? parseFloat(payment.gst_amount) : 0);
      const gstAmount = payment.is_gst ? parseFloat(payment.gst_amount) : 0;
      const totalAmount = parseFloat(payment.total_amount);
      
      // Add to total kitty amount instead of expenses
      totalKittyAmount += baseAmount; // Changed from totalAmount to baseAmount
      currentBalance += baseAmount; // Changed from totalAmount to baseAmount

      // Track other payments by mode
      if (payment.mode_of_payment.toLowerCase() === 'cash') {
        cashOtherPayments += baseAmount; // Changed from totalAmount to baseAmount
        cashGSTAmount += gstAmount;
      } else {
        onlineOtherPayments += baseAmount; // Changed from totalAmount to baseAmount
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

    // Group transactions by month/year (using local time)
    const monthGroups = {};
    allTransactionItems.forEach((item, idx) => {
      const d = new Date(item.date);
      // Use local time for grouping
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!monthGroups[key]) monthGroups[key] = [];
      monthGroups[key].push({ ...item, _originalIndex: idx });
    });

    // Get available fund month/year
    const availableFundDate = new Date(loggedInChapter.available_fund_date || new Date());
    const availableFundMonth = availableFundDate.getMonth();
    const availableFundYear = availableFundDate.getFullYear();

    // Prepare new transaction list with opening/closing balances
    let newTransactionItems = [];
    let runningBalance = parseFloat(loggedInChapter.available_fund) || 0;

    // Sort month keys chronologically
    const sortedMonthKeys = Object.keys(monthGroups).sort((a, b) => {
      const [ay, am] = a.split('-').map(Number);
      const [by, bm] = b.split('-').map(Number);
      return ay !== by ? ay - by : am - bm;
    });

    // Find the first month with real transactions (not just the opening balance)
    let firstMonthWithTransactionsIdx = -1;
    for (let i = 0; i < sortedMonthKeys.length; i++) {
      const group = monthGroups[sortedMonthKeys[i]];
      // Check if this month has any real transactions (not just the opening balance)
      if (group.some(item => item.type !== 'opening')) {
        firstMonthWithTransactionsIdx = i;
        break;
      }
    }

    sortedMonthKeys.forEach((key, monthIdx) => {
      const [year, month] = key.split('-').map(Number);
      let group = monthGroups[key];
      if (!group.length) return;

      // Show opening balance for every month except the very first/top with real transactions
      if (monthIdx === firstMonthWithTransactionsIdx) {
        // Insert opening balance on the 1st of the month (local time)
        const firstDate = new Date(group[0].date);
        newTransactionItems.push({
          date: new Date(firstDate.getFullYear(), firstDate.getMonth(), 1, 0, 0, 0, 0), // Always 1st of the month
          type: "monthly_opening",
          description: `Opening Balance for ${firstDate.toLocaleString('default', { month: 'long' })} ${firstDate.getFullYear()}`,
          amount: 0,
          gst: 0,
          totalAmount: 0,
          balance: runningBalance,
          _sortOrder: -1 // ensure it comes before any transaction that day
        });
      } else if (monthIdx > firstMonthWithTransactionsIdx) {
        // Insert opening balance for all subsequent months
        const firstDate = new Date(group[0].date);
        newTransactionItems.push({
          date: new Date(firstDate.getFullYear(), firstDate.getMonth(), 1, 0, 0, 0, 0),
          type: "monthly_opening",
          description: `Opening Balance for ${firstDate.toLocaleString('default', { month: 'long' })} ${firstDate.getFullYear()}`,
          amount: 0,
          gst: 0,
          totalAmount: 0,
          balance: runningBalance,
          _sortOrder: -1
        });
      }

      // Sort group by local date, then by type (expenses last), then by original index
      group.sort((a, b) => {
        const da = new Date(a.date);
        const db = new Date(b.date);
        // Compare local time
        const daTime = new Date(da.getFullYear(), da.getMonth(), da.getDate(), da.getHours(), da.getMinutes(), da.getSeconds(), da.getMilliseconds()).getTime();
        const dbTime = new Date(db.getFullYear(), db.getMonth(), db.getDate(), db.getHours(), db.getMinutes(), db.getSeconds(), db.getMilliseconds()).getTime();
        if (daTime !== dbTime) return daTime - dbTime;
        // Expenses last if on same date
        if (a.type === 'expense' && b.type !== 'expense') return 1;
        if (a.type !== 'expense' && b.type === 'expense') return -1;
        // Otherwise, preserve original order
        return (a._originalIndex || 0) - (b._originalIndex || 0);
      });

      // Add all transactions for this month (now sorted)
      group.forEach(item => {
        newTransactionItems.push({ ...item, _sortOrder: 0 });
        // Update running balance as we go
        if (item.type === "expense") {
          runningBalance -= item.amount;
        } else if (item.type !== "opening") {
          runningBalance += item.amount;
        }
      });

      // Insert closing balance after last transaction (use last day of the month, not last transaction date)
      const lastDay = new Date(year, month + 1, 0); // last day of the month
      newTransactionItems.push({
        date: new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate(), 23, 59, 59, 999),
        type: "monthly_closing",
        description: `Closing Balance for ${lastDay.toLocaleString('default', { month: 'long' })} ${lastDay.getFullYear()}`,
        amount: 0,
        gst: 0,
        totalAmount: 0,
        balance: runningBalance,
        _sortOrder: 9999 // ensure it comes after all transactions that day
      });
    });

    // Sort by date and _sortOrder
    newTransactionItems.sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      if (da !== db) return da - db;
      return (a._sortOrder || 0) - (b._sortOrder || 0);
    });

    // Insert opening balance as the very first transaction (for the ledger start)
    newTransactionItems.unshift({
      date: openingBalanceDate,
      type: "opening",
      description: "Opening Balance",
      amount: 0,
      gst: 0,
      totalAmount: 0,
      credit: currentBalance,
      balance: currentBalance
    });

    // Now process newTransactionItems in order to build ledgerData
    currentBalance = parseFloat(loggedInChapter.available_fund) || 0;
    ledgerData = [];
    newTransactionItems.forEach((item, idx) => {
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
      } else if (item.type === "monthly_closing" || item.type === "monthly_opening") {
        ledgerData.push({
          sNo: ledgerData.length + 1,
          date: formatDate(item.date),
          description: `<div style="background-color: #f8f9fa; padding: 8px 12px; border-radius: 6px; border-left: 4px solid ${item.type === 'monthly_opening' ? '#28a745' : '#dc3545'};">
            <div style="display: flex; align-items: center; gap: 8px;">
              <i class="ri-${item.type === 'monthly_opening' ? 'bank-line' : 'bank-card-line'}" style="color: ${item.type === 'monthly_opening' ? '#28a745' : '#dc3545'}; font-size: 1.2em;"></i>
              <div>
                <div style="color: ${item.type === 'monthly_opening' ? '#28a745' : '#dc3545'}; font-weight: 600; font-size: 1.1em;">${item.description}</div>
                <div style="color: #666; font-size: 0.9em; margin-top: 2px;">
                  <i class="ri-calendar-line"></i> ${formatDate(item.date)}
                </div>
              </div>
            </div>
          </div>`,
          billAmount: 0,
          debit: 0,
          credit: 0,
          gst: 0,
          balance: Math.round(item.balance * 100) / 100,
          balanceColor: item.balance >= 0 ? "green" : "red"
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
      <div style="cursor: pointer;">
        ${formatCurrency(totalExpenseBaseAmount)}
        <div style="font-size: 0.5em; margin-top: 2px; color: #666;">
          <span id="expense-cash-breakdown" style="cursor:pointer;">
            <i class="ri-money-dollar-circle-line"></i> Cash: ${formatCurrency(cashExpenseBaseAmount)}
          </span>
          <span id="expense-online-breakdown" style="margin-left:8px; cursor:pointer;">
            <i class="ri-bank-card-line"></i> Online: ${formatCurrency(onlineExpenseBaseAmount)}
          </span>
        </div>
      </div>
    `;

    // Add click handlers for total expenses
    expenseElement.addEventListener('click', () => showTotalExpensesPopup('all', paidExpenseDetails));
    document.getElementById('expense-cash-breakdown').addEventListener('click', () => showTotalExpensesPopup('cash', paidExpenseDetails));
    document.getElementById('expense-online-breakdown').addEventListener('click', () => showTotalExpensesPopup('online', paidExpenseDetails));

    // Add function to show total expenses popup
    function showTotalExpensesPopup(mode, filteredDetails) {
      const filteredExpenses = filteredDetails.filter(expense => {
        if (mode === 'all') return true;
        return expense.mode.toLowerCase() === mode.toLowerCase();
      });

      if (filteredExpenses.length === 0) {
        Swal.fire({
          title: mode === 'all' ? 'Total Expenses' : `${mode.charAt(0).toUpperCase() + mode.slice(1)} Expenses`,
          html: '<p>No expenses found</p>',
          width: 500,
          showCloseButton: true,
          showConfirmButton: false,
          customClass: {
            container: 'kitty-breakdown-popup',
            popup: 'kitty-breakdown-popup',
            content: 'kitty-breakdown-content'
          }
        });
        return;
      }

      // Calculate totals for the filtered expenses
      const totalBaseAmount = filteredExpenses.reduce((sum, e) => sum + e.baseAmount, 0);
      const totalGST = filteredExpenses.reduce((sum, e) => sum + e.gstAmount, 0);
      const totalAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

      let html = `<div style="padding:0.5em 0;">
        <div style="margin-bottom: 1em; padding: 0.5em; background: #f8f9fa; border-radius: 4px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5em;">
            <span style="font-weight: 600;">Total Base Amount:</span>
            <span style="font-weight: 600;">${formatCurrency(totalBaseAmount)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5em;">
            <span style="font-weight: 600;">Total GST:</span>
            <span style="font-weight: 600;">${formatCurrency(totalGST)}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="font-weight: 600;">Total Amount (including GST):</span>
            <span style="font-weight: 600;">${formatCurrency(totalAmount)}</span>
          </div>
        </div>
        <table style="width:100%;border-collapse:separate;border-spacing:0 8px;">
          <thead>
            <tr style="background:#f8f9fa;color:#495057;font-size:1em;">
              <th style="text-align:center;padding:6px 8px;">#</th>
              <th style="text-align:center;padding:6px 8px;">Description</th>
              <th style="text-align:center;padding:6px 8px;">Date</th>
              <th style="text-align:center;padding:6px 8px;">Submitted By</th>
              <th style="text-align:center;padding:6px 8px;">Bill No.</th>
              <th style="text-align:center;padding:6px 8px;">Base Amount</th>
              <th style="text-align:center;padding:6px 8px;">GST %</th>
              <th style="text-align:center;padding:6px 8px;">GST Amount</th>
              <th style="text-align:center;padding:6px 8px;">Total Amount</th>
            </tr>
          </thead>
          <tbody>`;
      
      filteredExpenses.forEach((expense, i) => {
        html += `<tr style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.03);">
          <td style="padding:6px 8px;font-weight:600;color:#d01f2f;">${i+1}</td>
          <td style="padding:6px 8px;font-weight:600;">${expense.description}</td>
          <td style="padding:6px 8px;">${expense.date}</td>
          <td style="padding:6px 8px;">${expense.submittedBy}</td>
          <td style="padding:6px 8px;">${expense.billNo}</td>
          <td style="padding:6px 8px;text-align:right;">${formatCurrency(expense.baseAmount)}</td>
          <td style="padding:6px 8px;text-align:right;">${expense.gstPercentage || '-'}</td>
          <td style="padding:6px 8px;text-align:right;">${formatCurrency(expense.gstAmount)}</td>
          <td style="padding:6px 8px;text-align:right;font-weight:600;">${formatCurrency(expense.amount)}</td>
        </tr>`;
      });
      
      html += `</tbody></table></div>`;

      Swal.fire({
        title: mode === 'all' ? 'Total Expenses' : `${mode.charAt(0).toUpperCase() + mode.slice(1)} Expenses`,
        html,
        width: 1200,
        showCloseButton: true,
        showConfirmButton: false,
        customClass: {
          container: 'kitty-breakdown-popup',
          popup: 'kitty-breakdown-popup',
          content: 'kitty-breakdown-content'
        }
      });
    }

    // Update current balance display with cash/online bifurcation
    const currentBalanceElement = document.getElementById("current-balance");
    const totalCashReceipts = cashKittyAmount + cashVisitorAmount + cashOtherPayments;
    const totalOnlineReceipts = onlineKittyAmount + onlineVisitorAmount + onlineOtherPayments;

    // Calculate cash and online expenses
    const cashExpenses = cashExpenseBaseAmount;
    const onlineExpenses = onlineExpenseBaseAmount;

    // Calculate cash and online balances
    const cashBalance = (parseFloat(loggedInChapter.available_fund) || 0) + totalCashReceipts + cashGSTAmount - cashExpenses - cashExpenseGST;
    const onlineBalance = totalOnlineReceipts - onlineExpenses - cashGSTAmount + cashExpenseGST;

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
        expenses: cashExpenses,
        expenseGST: cashExpenseGST
      }, {
        total: onlineBalance,
        receipts: totalOnlineReceipts,
        expenses: onlineExpenses,
        expenseGST: onlineExpenseGST
      },
      parseFloat(loggedInChapter.available_fund) || 0,
      cashGSTAmount
      );
    });

    // Initialize filteredLedgerData with all data
    filteredLedgerData = [...ledgerData];

    // Render the table with pagination
    renderLedgerTable();

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

    // === Meeting & Visitor Payment Member Count Calculation ===
    // Use ledgerData to get unique member/visitor names for meeting and visitor payments, and bifurcate by cash/online
    const meetingMembers = new Set();
    const meetingMembersCash = new Set();
    const meetingMembersOnline = new Set();
    const visitorMembers = new Set();
    const visitorMembersCash = new Set();
    const visitorMembersOnline = new Set();

    // For popups: store details
    const meetingMemberDetailsCash = [];
    const meetingMemberDetailsOnline = [];
    const visitorMemberDetailsCash = [];
    const visitorMemberDetailsOnline = [];

    ledgerData.forEach(entry => {
      if (typeof entry.description === 'string' && entry.description.includes('Meeting Fee')) {
        // Extract member name and company
        const nameMatch = entry.description.match(/Meeting Fee - ([^<]+)/);
        const companyMatch = entry.description.match(/<small class=\"text-muted\">([^|]*)\|/);
        const memberName = nameMatch && nameMatch[1] ? nameMatch[1].trim() : '';
        const company = companyMatch && companyMatch[1] ? companyMatch[1].trim() : '';
        if (memberName) {
          meetingMembers.add(memberName);
          const detailObj = {
            name: memberName,
            company,
            date: entry.date,
            amount: entry.credit || 0
          };
          if (entry.description.toLowerCase().includes('cash')) {
            meetingMembersCash.add(memberName);
            meetingMemberDetailsCash.push(detailObj);
          } else {
            meetingMembersOnline.add(memberName);
            meetingMemberDetailsOnline.push(detailObj);
          }
        }
      } else if (typeof entry.description === 'string' && entry.description.includes('Visitor Fee')) {
        // Extract visitor name and invited by
        const nameMatch = entry.description.match(/Visitor Fee - ([^<]+)/);
        const invitedByMatch = entry.description.match(/Invited by ([^|<]+)/);
        const visitorName = nameMatch && nameMatch[1] && nameMatch[1] !== 'N/A' ? nameMatch[1].trim() : '';
        const invitedBy = invitedByMatch && invitedByMatch[1] ? invitedByMatch[1].trim() : '';
        if (visitorName) {
          visitorMembers.add(visitorName);
          const detailObj = {
            name: visitorName,
            invitedBy,
            date: entry.date,
            amount: entry.credit || 0
          };
          if (entry.description.toLowerCase().includes('cash')) {
            visitorMembersCash.add(visitorName);
            visitorMemberDetailsCash.push(detailObj);
          } else {
            visitorMembersOnline.add(visitorName);
            visitorMemberDetailsOnline.push(detailObj);
          }
        }
      }
    });

    // Update the UI
    document.getElementById('meeting-member-count').textContent = meetingMembers.size;
    document.getElementById('meeting-member-cash-count').innerHTML = '<i class="ri-money-dollar-circle-line"></i> Cash: <span>' + meetingMembersCash.size + '</span>';
    document.getElementById('meeting-member-online-count').innerHTML = '<i class="ri-bank-card-line"></i> Online: <span>' + meetingMembersOnline.size + '</span>';
    document.getElementById('visitor-member-count').textContent = visitorMembers.size;
    document.getElementById('visitor-member-cash-count').innerHTML = '<i class="ri-money-dollar-circle-line"></i> Cash: <span>' + visitorMembersCash.size + '</span>';
    document.getElementById('visitor-member-online-count').innerHTML = '<i class="ri-bank-card-line"></i> Online: <span>' + visitorMembersOnline.size + '</span>';

    // === Add popups for member/visitor cash/online counts ===
    function showMemberListPopup(title, details, type) {
      if (!details || details.length === 0) {
        Swal.fire({
          title,
          html: '<p>No members found</p>',
          width: 500,
          showCloseButton: true,
          showConfirmButton: false,
          customClass: {
            container: 'kitty-breakdown-popup',
            popup: 'kitty-breakdown-popup',
            content: 'kitty-breakdown-content'
          }
        });
        return;
      }

      let html = `<div style=\"padding:0.5em 0;\">
        <table style=\"width:100%;border-collapse:separate;border-spacing:0 8px;\">
          <thead>
            <tr style=\"background:#f8f9fa;color:#495057;font-size:1em;\">
              <th style=\"text-align:center;padding:6px 8px;\">#</th>
              <th style=\"text-align:center;padding:6px 8px;\">Name</th>
              ${type === 'meeting' ? '<th style=\"text-align:center;padding:6px 8px;\">Company</th>' : '<th style=\"text-align:center;padding:6px 8px;\">Invited By</th>'}
              <th style=\"text-align:center;padding:6px 8px;\">Date</th>
              <th style=\"text-align:center;padding:6px 8px;\">Amount</th>
            </tr>
          </thead>
          <tbody>`;
      details.forEach((d, i) => {
        html += `<tr style="background:#fff;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.03);">
          <td style="padding:6px 8px;font-weight:600;color:#d01f2f;">${i+1}</td>
          <td style="padding:6px 8px;font-weight:600;">${d.name}</td>
          <td style="padding:6px 8px;">${type === 'meeting' ? (d.company || '-') : (d.invitedBy || '-')}</td>
          <td style="padding:6px 8px;">${d.date}</td>
          <td style="padding:6px 8px;text-align:right;font-weight:600;">${formatCurrency(d.amount)}</td>
        </tr>`;
      });
      html += `</tbody></table></div>`;
      Swal.fire({
        title,
        html,
        width: 900,
        showCloseButton: true,
        showConfirmButton: false,
        customClass: {
          container: 'kitty-breakdown-popup',
          popup: 'kitty-breakdown-popup',
          content: 'kitty-breakdown-content'
        }
      });
    }

    // Function to setup click handlers
    function setupClickHandlers() {
      try {
        const elements = {
          'meeting-member-cash-count': () => showMemberListPopup('Meeting Payment Members (Cash)', meetingMemberDetailsCash, 'meeting'),
          'meeting-member-online-count': () => showMemberListPopup('Meeting Payment Members (Online)', meetingMemberDetailsOnline, 'meeting'),
          'visitor-member-cash-count': () => showMemberListPopup('Visitor Payment Members (Cash)', visitorMemberDetailsCash, 'visitor'),
          'visitor-member-online-count': () => showMemberListPopup('Visitor Payment Members (Online)', visitorMemberDetailsOnline, 'visitor')
        };

        Object.entries(elements).forEach(([id, handler]) => {
          const element = document.getElementById(id);
          if (element) {
            element.style.cursor = 'pointer';
            element.onclick = handler;
          } else {
            console.warn(`Element with id ${id} not found`);
          }
        });
      } catch (error) {
        console.error('Error setting up click handlers:', error);
      }
    }

    // Call setupClickHandlers after a short delay to ensure DOM is ready
    setTimeout(setupClickHandlers, 100);

    console.log("Ledger generation completed successfully");

  } catch (error) {
    console.error("Error generating chapter ledger:", error);
    alert("An error occurred while generating the ledger.");
  } finally {
    hideLoader();
    console.log("=== Chapter Ledger Loading Process Completed ===");
  }
})();