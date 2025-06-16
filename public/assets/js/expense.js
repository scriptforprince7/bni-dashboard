// let apiUrl = "https://backend.bninewdelhi.com/api/allExpenses"; // API for expenses
let allExpenses = []; // To store fetched expenses globally
let filteredExpenses = []; // To store filtered expenses based on search
let expenseTypes = []; // Store expense types mapping
let allChapters = []; // Store all chapters

// Define base URL at the top of your file
const BILL_BASE_URL = 'https://backend.bninewdelhi.com';

// Add sorting state tracking
let currentSortColumn = null;
let currentSortDirection = 'asc';

// Global variables
let allVendors = [];

// Pagination state
let currentPage = 1;
let entriesPerPage = 20; // Ensure default is 20
let paginatedExpenses = [];

// Helper to get paginated data
function getPaginatedExpenses() {
  if (entriesPerPage === 'all') return filteredExpenses;
  const start = (currentPage - 1) * entriesPerPage;
  const end = start + entriesPerPage;
  return filteredExpenses.slice(start, end);
}

// Render pagination controls
function renderPaginationControls() {
  const containerId = 'expensesPaginationControls';
  let container = document.getElementById(containerId);
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.style.display = 'flex';
    container.style.justifyContent = 'space-between';
    container.style.alignItems = 'center';
    container.style.margin = '1rem 0';
    const table = document.getElementById('expensesTableBody').parentElement.parentElement;
    table.parentElement.appendChild(container);
  }
  container.innerHTML = '';

  // Entries per page dropdown
  const perPageSelect = document.createElement('select');
  perPageSelect.className = 'form-select form-select-sm';
  perPageSelect.style.width = 'auto';
  perPageSelect.style.display = 'inline-block';
  ['20', '50', '100', 'all'].forEach(opt => {
    const option = document.createElement('option');
    option.value = opt;
    option.textContent = opt === 'all' ? 'Show All' : `Show ${opt}`;
    if ((entriesPerPage === 'all' && opt === 'all') || entriesPerPage == opt) option.selected = true;
    perPageSelect.appendChild(option);
  });
  perPageSelect.addEventListener('change', e => {
    entriesPerPage = e.target.value === 'all' ? 'all' : parseInt(e.target.value);
    currentPage = 1;
    updatePaginatedDisplay();
  });

  // Info text
  const total = filteredExpenses.length;
  const showingStart = total === 0 ? 0 : ((currentPage - 1) * (entriesPerPage === 'all' ? total : entriesPerPage)) + 1;
  const showingEnd = entriesPerPage === 'all' ? total : Math.min(currentPage * entriesPerPage, total);
  const info = document.createElement('span');
  info.textContent = `Showing ${showingStart} to ${showingEnd} of ${total} entries`;
  info.style.margin = '0 1rem';

  // Pagination buttons
  const totalPages = entriesPerPage === 'all' ? 1 : Math.ceil(total / entriesPerPage);
  const pagination = document.createElement('div');
  pagination.className = 'pagination-controls';
  pagination.style.display = 'inline-flex';
  pagination.style.gap = '0.25rem';

  // Prev button
  const prevBtn = document.createElement('button');
  prevBtn.textContent = 'Previous';
  prevBtn.className = 'btn btn-sm btn-light';
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      updatePaginatedDisplay();
    }
  };
  pagination.appendChild(prevBtn);

  // Page numbers (show up to 5 pages around current)
  if (totalPages > 1) {
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    if (currentPage <= 3) endPage = Math.min(5, totalPages);
    if (currentPage >= totalPages - 2) startPage = Math.max(1, totalPages - 4);
    for (let i = startPage; i <= endPage; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.textContent = i;
      pageBtn.className = 'btn btn-sm ' + (i === currentPage ? 'btn-primary' : 'btn-light');
      pageBtn.disabled = i === currentPage;
      pageBtn.onclick = () => {
        currentPage = i;
        updatePaginatedDisplay();
      };
      pagination.appendChild(pageBtn);
    }
  }

  // Next button
  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next';
  nextBtn.className = 'btn btn-sm btn-light';
  nextBtn.disabled = currentPage === totalPages || totalPages === 0;
  nextBtn.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      updatePaginatedDisplay();
    }
  };
  pagination.appendChild(nextBtn);

  // Layout
  container.appendChild(perPageSelect);
  container.appendChild(info);
  container.appendChild(pagination);
}

// Update paginated display
async function updatePaginatedDisplay() {
  console.log('[TRACE] updatePaginatedDisplay called');
  paginatedExpenses = getPaginatedExpenses();
  console.log('[TRACE] updatePaginatedDisplay -> calling displayExpenses(paginatedExpenses)');
  await displayExpenses(paginatedExpenses);
  renderPaginationControls();
  // Update total count
  const totalCount = document.getElementById('totalExpensesCount');
  if (totalCount) totalCount.textContent = filteredExpenses.length;
}

// Function to fetch vendors
const fetchVendors = async () => {
  try {
    const response = await fetch('https://backend.bninewdelhi.com/api/getAllVendors');
    if (!response.ok) throw new Error('Failed to fetch vendors');
    allVendors = await response.json();
  } catch (error) {
    console.error('Error fetching vendors:', error);
    Swal.fire('Error!', 'Failed to load vendors', 'error');
  }
};

// Function to populate chapter filter dropdown
const populateChapterFilter = async () => {
  const chapterFilter = document.getElementById('chapterFilter');
  
  // Sort chapters alphabetically
  allChapters.sort((a, b) => a.chapter_name.localeCompare(b.chapter_name));
  
  // Clear existing options except "All Chapters"
  chapterFilter.innerHTML = '<option value="all">All Chapters</option>';
  
  // Add chapter options
  allChapters.forEach(chapter => {
    const option = document.createElement('option');
    option.value = chapter.chapter_name;
    option.textContent = chapter.chapter_name;
    chapterFilter.appendChild(option);
  });
};

// Function to filter expenses by chapter
const filterExpensesByChapter = (chapterName) => {
  if (chapterName === 'all') {
    filteredExpenses = [...allExpenses];
  } else {
    filteredExpenses = allExpenses.filter(expense => expense.chapter_id === chapterName);
  }
  updatePaginatedDisplay();
  updateExpenseTotals(filteredExpenses);
};

// Add event listener for chapter filter
document.getElementById('chapterFilter').addEventListener('change', (event) => {
  const selectedChapter = event.target.value;
  filterExpensesByChapter(selectedChapter);
});

// Function to show the loader
function showLoader() {
  document.getElementById("loader").style.display = "flex"; // Show loader
}

// Function to hide the loader
function hideLoader() {
  document.getElementById("loader").style.display = "none"; // Hide loader
}

// Function to calculate and update expense totals
const updateExpenseTotals = (expenses) => {
  // Calculate total expenses
  const totalAmount = expenses.reduce((sum, expense) => {
    return sum + parseFloat(expense.amount);
  }, 0);

  // Calculate paid expenses
  const paidAmount = expenses
    .filter(expense => expense.payment_status.toLowerCase() === 'paid')
    .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

  // Calculate pending expenses
  const pendingAmount = expenses
    .filter(expense => expense.payment_status.toLowerCase() !== 'paid')
    .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

  // Update the UI with formatted amounts
  document.querySelector('[data-total-expenses]').textContent = `₹ ${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  document.querySelector('[data-paid-expenses]').textContent = `₹ ${paidAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  document.querySelector('[data-pending-expenses]').textContent = `₹ ${pendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Function to fetch and display expenses based on user's email and chapter
const fetchExpenses = async (sortDirection = 'desc') => {
  try {
    showLoader();
    console.log('🚀 Fetching expenses...');

    // Get login type and email
    const loginType = getUserLoginType();
    const userEmail = getUserEmail();
    console.log('👤 User details:', {
      loginType,
      userEmail
    });

    // First fetch chapters to get the user's chapter_id
    const chaptersResponse = await fetch("https://backend.bninewdelhi.com/api/chapters");
    const chapters = await chaptersResponse.json();
    console.log('All chapters:', chapters);
    
    // Store chapters globally
    allChapters = chapters;
    
    // Populate chapter filter dropdown
    await populateChapterFilter();

    // Fetch vendors for vendor name mapping
    const vendorsResponse = await fetch('https://backend.bninewdelhi.com/api/getAllVendors');
    if (!vendorsResponse.ok) throw new Error('Failed to fetch vendors');
    const vendors = await vendorsResponse.json();
    
    // Create a map of vendor_id to vendor details for quick lookup
    const vendorMap = new Map(vendors.map(vendor => [
      vendor.vendor_id, 
      { 
        name: vendor.vendor_name,
        company: vendor.vendor_company_name || 'N/A'
      }
    ]));

    let chapterId = null;
    if (loginType === 'ro_admin') {
      // For RO admin, get chapter ID from localStorage
      chapterId = localStorage.getItem('current_chapter_id');
      console.log('🔑 RO Admin accessing chapter:', {
        chapterId
      });
    } else {
      // For chapter users, find their chapter
      const userChapter = chapters.find(chapter =>
        chapter.email_id === userEmail ||
        chapter.vice_president_mail === userEmail ||
        chapter.president_mail === userEmail ||
        chapter.treasurer_mail === userEmail
      );

      if (userChapter) {
        chapterId = userChapter.chapter_id;
        console.log('🏢 Chapter user accessing chapter:', {
          chapterId,
          chapterName: userChapter.chapter_name,
          userRole: userChapter.email_id === userEmail ? 'Chapter Email' :
                   userChapter.vice_president_mail === userEmail ? 'Vice President' :
                   userChapter.president_mail === userEmail ? 'President' :
                   'Treasurer'
        });
      } else {
        console.error('❌ No matching chapter found for user email:', userEmail);
        hideLoader();
        return;
      }
    }

    // Fetch expense types for mapping
    const expenseTypesResponse = await fetch(
      "https://backend.bninewdelhi.com/api/expenseType"
    );
    if (!expenseTypesResponse.ok) {
      throw new Error("Failed to fetch expense types");
    }
    expenseTypes = await expenseTypesResponse.json();
    console.log('Expense types:', expenseTypes);

    // Fetch all expenses
    const response = await fetch("https://backend.bninewdelhi.com/api/allExpenses");
    if (!response.ok) throw new Error("Network response was not ok");

    const allExpensesData = await response.json();
    console.log('All expenses:', allExpensesData);

    // Filter expenses based on chapter ID
    const filteredExpensesData = allExpensesData.filter(expense => 
      expense.chapter_id === parseInt(chapterId)
    );
    console.log('💰 Filtered expenses for chapter:', {
      totalExpenses: allExpensesData.length,
      filteredExpenses: filteredExpensesData.length,
      chapterId
    });

    // Sort filtered expenses by entry_date in descending order (latest first)
    filteredExpensesData.sort((a, b) => {
      const dateA = new Date(a.entry_date);
      const dateB = new Date(b.entry_date);
      return dateB - dateA; // Sort by entry_date in descending order (latest first)
    });

    // Replace chapter_id with chapter_name and add vendor details
    filteredExpensesData.forEach(expense => {
      const matchedChapter = chapters.find(chapter => chapter.chapter_id === expense.chapter_id);
      if (matchedChapter) {
        expense.chapter_id = matchedChapter.chapter_name;
      }
      // Add vendor details to expense
      const vendorDetails = expense.vendor_id ? vendorMap.get(expense.vendor_id) : null;
      expense.vendor_name = vendorDetails ? vendorDetails.name : 'N/A';
      expense.vendor_company = vendorDetails ? vendorDetails.company : 'N/A';
    });

    filteredExpenses = [...filteredExpensesData];
    console.log('All dates before sorting:', filteredExpenses.map(exp => ({
      date: exp.entry_date,
      parsed: new Date(exp.entry_date),
      timestamp: new Date(exp.entry_date).getTime()
    })));

    // Sort expenses by entry_date in descending order (latest first) initially
    filteredExpenses.sort((a, b) => { 
      const dateA = new Date(a.entry_date);
      const dateB = new Date(b.entry_date);
      console.log('Comparing dates:', {
        dateA: {
          original: a.entry_date,
          parsed: dateA,
          timestamp: dateA.getTime()
        },
        dateB: {
          original: b.entry_date,
          parsed: dateB,
          timestamp: dateB.getTime()
        },
        result: dateB - dateA
      });
      return dateB - dateA;
    });

    console.log('All dates after sorting:', filteredExpenses.map(exp => ({
      date: exp.entry_date,
      parsed: new Date(exp.entry_date),
      timestamp: new Date(exp.entry_date).getTime()
    })));

    // Set initial sort state for entry_date column
    currentSortColumn = 'entry_date';
    currentSortDirection = 'desc';
    const tbody = document.getElementById('expensesTableBody');
    if (tbody) {
      tbody.setAttribute('data-sort-direction', 'desc');
    }

    // Update sort icons to reflect initial state
    const entryDateHeader = document.querySelector('th[data-column="entry_date"]');
    if (entryDateHeader) {
      const icon = entryDateHeader.querySelector('i');
      if (icon) {
        icon.className = 'ri-sort-desc';
      }
    }

    // Remove redundant displayExpenses call and only use updatePaginatedDisplay
    // updatePaginatedDisplay();
    
    // Update the expense totals
    updateExpenseTotals(filteredExpenses);
    console.log('Updated expense totals');

  } catch (error) {
    console.error("Error in fetchExpenses:", error);
  } finally {
    hideLoader();
  }
};

// Sort expenses based on the selected filter
const sortExpenses = (filter) => {
  console.log('[TRACE] sortExpenses called with filter:', filter);
  console.log("=== Sort Debug Start ===");
  console.log("Sort direction:", filter);

  const expenseNameMap = new Map(
    expenseTypes.map(type => {
      console.log(`Mapping expense_id ${type.expense_id} to name ${type.expense_name}`);
      return [type.expense_id, type.expense_name];
    })
  );

  filteredExpenses.sort((a, b) => {
    // Sort by entry_date in descending order (latest first)
    const dateA = new Date(a.entry_date);
    const dateB = new Date(b.entry_date);
    
    if (filter === "desc") {
      return dateB - dateA; // Latest first
    } else {
      return dateA - dateB; // Oldest first
    }
  });

  // Update the display after sorting
  console.log('[TRACE] sortExpenses -> calling updatePaginatedDisplay()');
  updatePaginatedDisplay();
};

const AddExpenseType = async () => {
  // Show confirmation using SweetAlert with an input field and dropdown
  const result = await Swal.fire({
    title: 'Add Expense',
    html: `
      <label for="expenseType">Expense Type:</label>
      <input id="expenseType" class="swal2-input" placeholder="Enter the Expense Type for the expense">
      </br>
      <label for="status">Status:</label>
      <select id="status" class="swal2-input">
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    `,
    showCancelButton: true,
    confirmButtonText: 'Submit',
    cancelButtonText: 'Cancel',
    focusConfirm: false,
    preConfirm: () => {
      const expenseType = document.getElementById('expenseType').value;
      const status = document.getElementById('status').value;

      if (!expenseType) {
        Swal.showValidationMessage('Expense Type is required');
        return null;
      }
      return { expenseType, status };
    }
  });

  if (result.isConfirmed) {
    const { expenseType, status } = result.value; // Extract the values

    if (expenseType) {
      try {
        showLoader(); // Show loading indicator

        // Call the API to add the expense (replace with the actual API endpoint)
        const response = await fetch(`https://backend.bninewdelhi.com/api/expenseType`, {
          method: 'POST', // Use POST to add an expense
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ expense_name: expenseType, expense_status:status }), // Send the expense name and status
        });

        if (response.ok) {
          const data = await response.json();
          Swal.fire('Success!', data.message, 'success');
        } else {
          const errorResponse = await response.json();
          Swal.fire('Failed!', errorResponse.message, 'error');
        }
      } catch (error) {
        console.error('Error adding expense:', error);
        Swal.fire('Error!', 'Failed to add expense. Please try again.', 'error');
      } finally {
        hideLoader(); // Hide loading indicator
        window.location.reload();
      }
    } else {
      Swal.fire('Canceled', 'No expense type entered. Expense not added.', 'info');
    }
  }
};

// Function to display expenses in the table
async function displayExpenses(expenses) {
  console.log('[TRACE] displayExpenses called with', expenses.length, 'entries');
  console.log('Displaying expenses:', expenses);
  const tableBody = document.getElementById("expensesTableBody");
  tableBody.innerHTML = "";

  if (expenses.length === 0) {
    console.log('No expenses to display');
    const row = document.createElement("tr");
    row.innerHTML = `
      <td colspan="17" class="text-center">No expenses found</td>
    `;
    tableBody.appendChild(row);
    return;
  }

  // Pre-fetch all hotel names in parallel for expenses with hotel_id
  const hotelIdToName = {};
  const hotelFetchPromises = expenses.map(async (expense) => {
    if (expense.hotel_id && !expense.hotel_name) {
      const hotelName = await fetchHotelDetails(expense.hotel_id);
      hotelIdToName[expense.hotel_id] = hotelName;
    }
  });
  await Promise.all(hotelFetchPromises);

  // Now render rows in order
  expenses.forEach((expense, index) => {
    const row = document.createElement("tr");
    row.setAttribute("data-expense-id", expense.expense_id);
    row.classList.add("order-list");

    // Find expense type name
    const expenseTypeObj = expenseTypes.find(
      (type) => type.expense_id === expense.expense_type
    );
    const expenseName = expenseTypeObj ? expenseTypeObj.expense_name : "Unknown";

    const billDate = new Date(expense.bill_date);
    const formattedBillDate = billDate.toLocaleDateString();

    // Format entry date
    const entryDate = new Date(expense.entry_date);
    const formattedEntryDate = entryDate.toLocaleDateString();
    const formattedEntryTime = entryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Get just the filename from upload_bill (remove any path if present)
    const filename = expense.upload_bill ? expense.upload_bill.split('/').pop() : null;
    // Construct the bill URL
    const billUrl = filename ? `${BILL_BASE_URL}/api/uploads/expenses/${filename}` : '#';
    // Get receipt filename and construct receipt URL
    const receiptFilename = expense.upload_receipt ? expense.upload_receipt.split('/').pop() : null;
    const receiptUrl = receiptFilename ? `${BILL_BASE_URL}/api/uploads/expenses/${receiptFilename}` : '#';

    // Use pre-fetched hotel name if available
    if (expense.hotel_id) {
      expense.hotel_name = hotelIdToName[expense.hotel_id] || 'Loading...';
    }

    row.innerHTML = `
      <td>${expenses.length - index}</td>
      <td style="border: 1px solid grey;">
        <div style="display: flex; flex-direction: column;">
          <b>${formattedEntryDate}</b>
          <small style="color: #666; font-size: 0.85em;">${formattedEntryTime}</small>
        </div>
      </td>
      <td style="border: 1px solid grey;"><b>${expenseName}</b></td>
      <td style="border: 1px solid grey;"><b>${expense.chapter_id}</b></td>
     <td style="border: 1px solid grey;">
  <div style="display: flex; flex-direction: column; cursor: pointer;" onclick="viewVendorLedger(${expense.vendor_id})">
    <b style="color: #007bff;">${expense.vendor_name}</b>
    <small style="color: #666; font-size: 0.85em;">${expense.vendor_company}</small>
  </div>
</td>

        <td style="border: 1px solid grey;">
  <div style="display: flex; flex-direction: column;">
    ${expense.hotel_id ? `
      <b 
        class="hotel-name" 
        data-hotel-id="${expense.hotel_id}" 
        style="cursor: pointer; color: #007bff;"
      >
        ${expense.hotel_name || 'Loading...'}
      </b>
      <small style="color: #666; font-size: 0.85em;">Hotel</small>
    ` : '-'}
  </div>
</td>

      <td style="border: 1px solid grey;">
        <div style="position: relative;">
          <span class="description-text" style="display: inline-block; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            <b>${expense.description.split(' ').slice(0, 3).join(' ')}</b>
          </span>
          ${expense.description.split(' ').length > 3 ? `
            <span class="show-more-text" style="color: #6f42c1; cursor: pointer; margin-left: 5px; font-size: 12px; font-weight: 500;">
              ...Show More
            </span>
            <div class="full-description" style="display: none; position: absolute; top: 100%; left: 0; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); z-index: 1000; min-width: 200px; max-width: 300px;">
              <b>${expense.description}</b>
              <span class="show-less-text" style="display: block; color: #6f42c1; cursor: pointer; margin-top: 5px; font-size: 12px; font-weight: 500; text-align: right;">
                Show Less
              </span> 
            </div>
          ` : ''}
        </div>
      </td>
      <td style="border: 1px solid grey;"><b>₹ ${expense.amount}</b></td>
      <td style="border: 1px solid grey;"><b>₹ ${expense.gst_amount || 0}</b></td>
      <td style="border: 1px solid grey;"><b>₹ ${expense.total_amount}</b></td>
      <td style="border: 1px solid grey;">
        ${expense.tds_process ? `
          <button class="btn ${expense.tds_section_list === "NA" ? 'btn-danger' : 'btn-success'} btn-sm view-tds-btn" 
                  data-expense-id="${expense.expense_id}"
                  data-amount="${expense.amount}"
                  data-gst-amount="${expense.gst_amount || 0}"
                  data-tds-section="${expense.tds_section_list}"
                  data-tds-type="${expense.tds_type}"
                  data-tds-percentage="${expense.tds_percentage}"
                  data-tds-amount="${expense.tds_amount}"
                  data-ca-comment="${expense.ca_comment}"
                  data-final-amount="${expense.final_amount}"
                  style="background: ${expense.tds_section_list === "NA" ? 'linear-gradient(45deg, #dc3545, #c82333)' : 'linear-gradient(45deg, #4CAF50, #45a049)'};
                          border: none;
                          border-radius: 20px;
                          padding: 8px 16px;
                          color: white;
                          font-weight: 500;
                          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                          transition: all 0.3s ease;
                          display: flex;
                          align-items: center;
                          gap: 5px;">
            <i class="ri-eye-line"></i>
            View TDS Details
          </button>
        ` : `
          <button class="btn btn-primary btn-sm add-tds-btn" 
                  data-expense-id="${expense.expense_id}"
                  data-amount="${expense.amount}"
                  data-gst-amount="${expense.gst_amount || 0}"
                  style="background: linear-gradient(45deg, #2196F3, #1976D2);
                          border: none;
                          border-radius: 20px;
                          padding: 8px 16px;
                          color: white;
                          font-weight: 500;
                          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                          transition: all 0.3s ease;
                          display: flex;
                          align-items: center;
                          gap: 5px;">
            <i class="ri-add-circle-line"></i>
            Add TDS Detail
          </button>
        `}
      </td>
      <td style="border: 1px solid grey;">
        ${expense.tds_percentage && expense.tds_type ? 
          `<b> (${expense.tds_section_list}) (${expense.tds_type}) ${expense.tds_percentage}%  </b>` : 
          '<b>-</b>'}
      </td>
      <td style="border: 1px solid grey;">
        ${expense.tds_amount ? `<b>₹ ${expense.tds_amount}</b>` : '<b>-</b>'}
      </td>
      <td style="border: 1px solid grey;">
        ${expense.tds_certificate ? 
          `<div style="display: flex; align-items: center; gap: 10px;">
            <div class="tds-certificate-preview" style="cursor: pointer;" onclick="openTdsCertificate('${expense.tds_certificate}')">
              <img src="https://backend.bninewdelhi.com/api/uploads/tds-certificates/${expense.tds_certificate}" 
                   alt="TDS Certificate" 
                   style="max-width: 50px; max-height: 50px; border-radius: 4px;"
                   onerror="this.onerror=null; this.src='/assets/images/pdf-icon.png';">
            </div>
            <button class="btn btn-outline-primary btn-sm edit-tds-certificate" 
                    data-expense-id="${expense.expense_id}"
                    style="padding: 4px 8px; font-size: 12px;">
              <i class="ri-edit-line"></i>
              Edit
            </button>
          </div>` : 
          `<button class="btn btn-outline-primary btn-sm upload-tds-certificate" 
                   data-expense-id="${expense.expense_id}"
                   style="border-radius: 20px; padding: 8px 16px;">
            <i class="ri-upload-2-line"></i> Upload Certificate
          </button>`
        }
      </td>
      <td style="border: 1px solid grey;">
        <div style="background: linear-gradient(135deg, #f6f8fa 0%, #ffffff 100%);
                    padding: 6px;
                    border-radius: 6px;
                    border: 2px solid #e0e0e0;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s ease;"
             data-expense='${JSON.stringify(expense)}'
             onclick="showCalculationDetails(JSON.parse(this.getAttribute('data-expense')))"
             onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)';"
             onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 2px 4px rgba(0,0,0,0.05)';">
          <div style="font-size: 12px; color: #666; margin-bottom: 2px;">Final Amount</div>
          <div style="font-size: 16px; font-weight: 700; color: #1976D2;">
            ₹ ${expense.final_amount || expense.total_amount}
          </div>
          <div style="font-size: 10px; color: #666; margin-top: 2px;">
            <i class="ri-information-line"></i> Click to view calculation
          </div>
        </div>
      </td>
      <td style="border: 1px solid grey;">
        ${expense.verification ? `
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 5px; color: #28a745; font-weight: 500;">
              <i class="ri-check-double-line"></i>
              Approved
            </div>
            <button class="btn btn-sm btn-outline-primary modify-status-btn" 
                    data-expense-id="${expense.expense_id}"
                    data-current-status="approved"
                    style="padding: 4px 8px; font-size: 12px;">
              <i class="ri-edit-line"></i>
              Modify
            </button>
          </div>
        ` : expense.ro_comment ? `
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="position: relative;">
              <div style="display: flex; align-items: center; gap: 5px; color: #dc3545; font-weight: 500; cursor: help;">
                <i class="ri-close-circle-line"></i>
                Rejected
              </div>
              <div style="position: absolute; 
                         top: 100%; 
                         left: 50%; 
                         transform: translateX(-50%); 
                         background: #333; 
                         color: white; 
                         padding: 8px 12px; 
                         border-radius: 6px; 
                         font-size: 12px; 
                         white-space: nowrap; 
                         z-index: 1000; 
                         display: none;
                         margin-top: 5px;
                         box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                         max-width: 300px;
                         text-align: center;">
                ${expense.ro_comment}
                <div style="position: absolute; 
                           top: -5px; 
                           left: 50%; 
                           transform: translateX(-50%); 
                           width: 0; 
                           height: 0; 
                           border-left: 5px solid transparent; 
                           border-right: 5px solid transparent; 
                           border-bottom: 5px solid #333;">
                </div>
              </div>
            </div>
            <button class="btn btn-sm btn-outline-primary modify-status-btn" 
                    data-expense-id="${expense.expense_id}"
                    data-current-status="rejected"
                    style="padding: 4px 8px; font-size: 12px;">
              <i class="ri-edit-line"></i>
              Modify
            </button>
          </div>
        ` : `
          <button class="btn btn-sm ro-approve-btn" 
                  data-expense-id="${expense.expense_id}"
                  style="background: linear-gradient(45deg, #6f42c1, #5a32a3);
                         border: none;
                         border-radius: 20px;
                         padding: 8px 16px;
                         color: white;
                         font-weight: 500;
                         box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                         transition: all 0.3s ease;
                         display: flex;
                         align-items: center;
                         gap: 5px;
                         position: relative;
                         overflow: hidden;">
            <i class="ri-check-double-line"></i>
            Confirm Status
            <span style="position: absolute;
                         top: 0;
                         left: 0;
                         width: 100%;
                         height: 100%;
                         background: linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0));
                         transform: translateX(-100%);
                         transition: transform 0.3s ease;">
            </span>
          </button>
        `}
      </td>
   <td style="border: 1px solid grey;">
        <span class="badge bg-${expense.payment_status === "pending" ? "warning" : "success"}">${expense.payment_status}</span>
      </td>
      <td style="border: 1px solid grey;"><b>${formattedBillDate}</b></td>
      <td style="border: 1px solid grey;">
        <span class="badge bg-${expense.mode_of_payment === "online" ? "info" : "secondary"}">${expense.mode_of_payment || "N/A"}</span>
      </td>
      <td style="border: 1px solid grey;">
        ${filename ? `
          <a href="${billUrl}" target="_blank" style="text-decoration: underline; color: blue">
            View Bill
            <i class="fas fa-external-link-alt" style="font-size: 12px; margin-left: 4px;"></i>
          </a>
        ` : 'No bill uploaded'}
      </td>
      <td style="border: 1px solid grey;">
        ${receiptFilename ? `
          <a href="${receiptUrl}" target="_blank" style="text-decoration: underline; color: blue">
            View Receipt
            <i class="fas fa-external-link-alt" style="font-size: 12px; margin-left: 4px;"></i>
          </a>
        ` : 'No receipt uploaded'}
      </td>
      <td style="border: 1px solid grey">
        <a href="/exp/edit-expense/?expense_id=${expense.expense_id}" class="badge" style="background-color: #10b981; color: #ffffff; text-shadow: 1px 1px 1px rgba(0,0,0,0.3); transition: all 0.3s ease; hover: {opacity: 0.9};">Edit Bill</a>
        <span class="badge bg-danger delete-btn" style="cursor:pointer; color: #ffffff; text-shadow: 1px 1px 1px rgba(0,0,0,0.5); font-weight: bold;" data-expense-id="${expense.expense_id}">Delete</span>
      </td>
    `;
    tableBody.appendChild(row);
  });

  // Add event listeners for certificate upload buttons
  document.querySelectorAll('.upload-tds-certificate, .edit-tds-certificate').forEach(button => {
    button.addEventListener('click', handleCertificateUpload);
  });
}

// Function to handle certificate upload
async function handleCertificateUpload(event) {
  const button = event.target.closest('.upload-tds-certificate, .edit-tds-certificate');
  if (!button) return;
  
  const expenseId = button.dataset.expenseId;
  
  const { value: file } = await Swal.fire({
    title: 'Upload TDS Certificate',
    html: `
      <div style="text-align: left; padding: 20px; background: #f8f9fa; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <div style="margin-bottom: 15px;">
          <label for="tdsCertificate" style="font-weight: 500; color: #333; margin-bottom: 5px; display: block;">Select Certificate</label>
          <input type="file" id="tdsCertificate" class="form-control" accept=".jpg,.jpeg,.png,.pdf" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 6px;">
        </div>
        <div id="certificatePreview" class="mt-2" style="display: none;">
          <img id="certificateImage" src="" alt="Certificate Preview" style="max-width: 200px; max-height: 200px; display: none;">
          <embed id="certificatePdf" src="" type="application/pdf" style="width: 200px; height: 200px; display: none;">
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Upload',
    cancelButtonText: 'Cancel',
    showLoaderOnConfirm: true,
    preConfirm: () => {
      const fileInput = document.getElementById('tdsCertificate');
      const file = fileInput.files[0];
      
      if (!file) {
        Swal.showValidationMessage('Please select a file');
        return false;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        Swal.showValidationMessage('Only JPG, JPEG, PNG and PDF files are allowed');
        return false;
      }

      if (file.size > maxSize) {
        Swal.showValidationMessage('File size should not exceed 5MB');
        return false;
      }

      return file;
    },
    didOpen: () => {
      const fileInput = document.getElementById('tdsCertificate');
      const preview = document.getElementById('certificatePreview');
      const imagePreview = document.getElementById('certificateImage');
      const pdfPreview = document.getElementById('certificatePdf');

      fileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
          if (file.type === 'application/pdf') {
            pdfPreview.src = e.target.result;
            pdfPreview.style.display = 'block';
            imagePreview.style.display = 'none';
          } else {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
            pdfPreview.style.display = 'none';
          }
          preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      });
    }
  });

  if (file) {
    try {
      const formData = new FormData();
      formData.append('expense_id', expenseId);
      formData.append('tds_certificate', file);

      const response = await fetch('https://backend.bninewdelhi.com/api/tdsUpdateexpense', {
        method: 'PUT',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          title: 'Success!',
          text: 'TDS certificate uploaded successfully',
          icon: 'success',
          confirmButtonText: 'OK'
        }).then(() => {
          fetchExpenses();
        });
      } else {
        throw new Error(data.message || 'Failed to upload certificate');
      }
    } catch (error) {
      console.error('Error uploading certificate:', error);
      Swal.fire({
        title: 'Error!',
        text: error.message || 'Failed to upload certificate',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  }
}

// Function to open TDS certificate in new tab
function openTdsCertificate(filename) {
  window.open(`https://backend.bninewdelhi.com/api/uploads/tds-certificates/${filename}`, '_blank');
}

// Event listener for Delete button
document
  .getElementById("expensesTableBody")
  .addEventListener("click", (event) => {
    if (event.target.classList.contains("delete-expense")) {
      const expenseId = event.target.getAttribute("data-expense-id");
      deleteExpense(expenseId);
    }
  });

// Function to delete an expense
const deleteExpense = async (expense_id) => {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "This action will delete the expense.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it!",
    cancelButtonText: "No, cancel",
  });

  if (result.isConfirmed) {
    try {
      showLoader();

      const response = await fetch(
        `https://backend.bninewdelhi.com/api/expense/${expense_id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        // Remove from arrays
        allExpenses = allExpenses.filter(
          (expense) => expense.expense_id !== expense_id
        );
        filteredExpenses = filteredExpenses.filter(
          (expense) => expense.expense_id !== expense_id
        );

        // Console log the filtered arrays
        console.log("Filtered allExpenses:", allExpenses);
        console.log("Filtered filteredExpenses:", filteredExpenses);

        Swal.fire({
          title: "Deleted!",
          text: "Expense has been deleted.",
          icon: "success",
        }).then(() => {
          // Refresh the page after clicking OK on the success message
          window.location.reload();
        });
      } else {
        Swal.fire("Failed!", "Failed to delete the expense.", "error");
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      Swal.fire(
        "Error!",
        "An error occurred while deleting the expense.",
        "error"
      );
    } finally {
      hideLoader();
    }
  }
};

// Event listener for sort button
document.getElementById("sortButton").addEventListener("click", () => {
  const button = document.getElementById("sortButton");
  const currentSort = button.getAttribute("data-sort") || "asc";

  // Toggle sort direction
  const newSort = currentSort === "asc" ? "desc" : "asc";
  
  // Update button text and icon based on new sort direction
  if (newSort === "asc") {
    button.textContent = "↑(A-Z)";
  } else {
    button.textContent = "↓ (Z-A)";
  }

  // Update button attribute and sort
  button.setAttribute("data-sort", newSort);
  sortExpenses(newSort);
});

// Initial fetch when page loads
window.addEventListener("DOMContentLoaded", async () => {
  console.log('Page loaded - fetching expenses');
  console.log('User login type:', getUserLoginType());
  console.log('User email:', getUserEmail());
  
  showLoader();
  entriesPerPage = 20; // Force default to 20 on reload
  currentPage = 1;
  await fetchExpenses("asc");
  sortByColumn('expense_id');
  
  // Set initial button text
  const button = document.getElementById("sortButton");
  button.textContent = "↑ (A-Z)";
  button.setAttribute("data-sort", "asc");

  // Add fetchVendors to the initial load
  fetchVendors();
  updatePaginatedDisplay();
});

// Function to handle column sorting
const sortByColumn = (columnName) => {
  const tbody = document.getElementById('expensesTableBody');
  const rows = Array.from(tbody.getElementsByTagName('tr'));
  const currentDirection = tbody.getAttribute('data-sort-direction') || 'asc';
  const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';

  rows.sort((a, b) => {
    let aValue, bValue;

    switch (columnName) {
      case 'expense_id':
        aValue = parseInt(a.querySelector('td').textContent);
        bValue = parseInt(b.querySelector('td').textContent);
        break;
      case 'entry_date':
        aValue = new Date(a.querySelector('td:nth-child(2)').textContent);
        bValue = new Date(b.querySelector('td:nth-child(2)').textContent);
        console.log('SortByColumn comparing dates:', {
          dateA: {
            text: a.querySelector('td:nth-child(2)').textContent,
            parsed: aValue,
            timestamp: aValue.getTime()
          },
          dateB: {
            text: b.querySelector('td:nth-child(2)').textContent,
            parsed: bValue,
            timestamp: bValue.getTime()
          }
        });
        break;
      case 'expense_type':
        const expenseNameA = expenseTypes.find(type => type.expense_id === a.querySelector('td:nth-child(3) b').textContent)?.expense_name || '';
        const expenseNameB = expenseTypes.find(type => type.expense_id === b.querySelector('td:nth-child(3) b').textContent)?.expense_name || '';
        aValue = expenseNameA.toLowerCase();
        bValue = expenseNameB.toLowerCase();
        break;
      case 'chapter_id':
        aValue = a.querySelector('td:nth-child(4)').textContent.toLowerCase();
        bValue = b.querySelector('td:nth-child(4)').textContent.toLowerCase();
        break;
        case 'vendor_id':
  aValue = a.querySelector('td:nth-child(5) b').textContent.toLowerCase();
  bValue = b.querySelector('td:nth-child(5) b').textContent.toLowerCase();
  break;

case 'hotel_id':
  aValue = a.querySelector('td:nth-child(6) b').textContent.toLowerCase();
  bValue = b.querySelector('td:nth-child(6) b').textContent.toLowerCase();
  break;
      case 'description':
        aValue = a.querySelector('td:nth-child(5)').textContent.toLowerCase();
        bValue = b.querySelector('td:nth-child(5)').textContent.toLowerCase();
        break;
      case 'amount':
        aValue = parseFloat(a.querySelector('td:nth-child(8) b').textContent);
        bValue = parseFloat(b.querySelector('td:nth-child(8) b').textContent);
        break;
      case 'gst_amount':
        aValue = parseFloat(a.querySelector('td:nth-child(7) b').textContent);
        bValue = parseFloat(b.querySelector('td:nth-child(7) b').textContent);
        break;
      case 'total_amount':
        aValue = parseFloat(a.querySelector('td:nth-child(8) b').textContent);
        bValue = parseFloat(b.querySelector('td:nth-child(8) b').textContent);
        break;
      case 'tds_details':
        // Sort TDS details based on section and process status
        aValue = a.querySelector('td:nth-child(9)').textContent.split(' ')[0] === 'No' ? 0 : 1;
        bValue = b.querySelector('td:nth-child(9)').textContent.split(' ')[0] === 'No' ? 0 : 1;
        break;
      case 'ro_verification':
        // Sort RO verification based on status
        aValue = a.querySelector('td:nth-child(16)').textContent === 'Approved' ? 1 : (a.querySelector('td:nth-child(10)').textContent === 'Rejected' ? 2 : 0);
        bValue = b.querySelector('td:nth-child(16)').textContent === 'Approved' ? 1 : (b.querySelector('td:nth-child(10)').textContent === 'Rejected' ? 2 : 0);
        break;
        case 'final_payable':
          aValue = parseFloat(a.querySelector('td:nth-child(18) b').textContent);
          bValue = parseFloat(b.querySelector('td:nth-child(18) b').textContent);
          break;
        case 'payment_status':
          aValue = a.querySelector('td:nth-child(17)').textContent.toLowerCase();
          bValue = b.querySelector('td:nth-child(17)').textContent.toLowerCase();
          console.log('Comparing payment statuses:', {aValue, bValue, aText: a.querySelector('td:nth-child(12)').textContent, bText: b.querySelector('td:nth-child(12)').textContent, aHTML: a.querySelector('td:nth-child(12)').innerHTML, bHTML: b.querySelector('td:nth-child(12)').innerHTML});
          break;
      case 'bill_date':
        aValue = new Date(a.querySelector('td:nth-child(13)').textContent);
        bValue = new Date(b.querySelector('td:nth-child(13)').textContent);
        break;
      case 'mode_of_payment':
        aValue = (a.querySelector('td:nth-child(14)').textContent || 'N/A').toLowerCase();
        bValue = (b.querySelector('td:nth-child(14)').textContent || 'N/A').toLowerCase();
        break;
      case 'tds_percentage_type':
        aValue = a.querySelector('td:nth-child(15) b')?.textContent || '-';
        bValue = b.querySelector('td:nth-child(15) b')?.textContent || '-';
        // Extract percentage number for sorting
        aValue = aValue === '-' ? 0 : parseFloat(aValue.split('%')[0]) || 0;
        bValue = bValue === '-' ? 0 : parseFloat(bValue.split('%')[0]) || 0;
        break;
      case 'tds_amount':
        aValue = a.querySelector('td:nth-child(16) b')?.textContent || '-';
        bValue = b.querySelector('td:nth-child(16) b')?.textContent || '-';
        // Extract amount number for sorting
        aValue = aValue === '-' ? 0 : parseFloat(aValue.replace('₹', '').trim()) || 0;
        bValue = bValue === '-' ? 0 : parseFloat(bValue.replace('₹', '').trim()) || 0;
        break;
      case 'ca_comment':
        aValue = a.querySelector('td:nth-child(17)').textContent || 'No comment';
        bValue = b.querySelector('td:nth-child(17)').textContent || 'No comment';
        break;
      case 'final_amount':
        aValue = parseFloat(a.querySelector('td:nth-child(18) b').textContent);
        bValue = parseFloat(b.querySelector('td:nth-child(18) b').textContent);
        break;
      case 'ro_comment':
        aValue = a.querySelector('td:nth-child(19)').textContent || 'No comment';
        bValue = b.querySelector('td:nth-child(19)').textContent || 'No comment';
        break;
      default:
        return 0;
    }

    if (newDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Update sort direction
  tbody.setAttribute('data-sort-direction', newDirection);
  updateSortIcons(columnName);

  // Reorder rows
  rows.forEach(row => tbody.appendChild(row));
};

// Function to update sort icons
const updateSortIcons = (activeColumn) => {
  // Reset all icons
  document.querySelectorAll('th i').forEach(icon => {
    icon.className = 'ri-sort-asc';
  });

  // Update active column icon
  const activeIcon = document.querySelector(`th[data-column="${activeColumn}"] i`);
  if (activeIcon) {
    activeIcon.className = currentSortDirection === 'asc' ? 'ri-sort-asc' : 'ri-sort-desc';
  }
};

// Add click event listeners to sortable headers
document.addEventListener('DOMContentLoaded', () => {
  const sortableHeaders = document.querySelectorAll('th[data-column]');
  sortableHeaders.forEach(header => {
    header.style.cursor = 'pointer';
    header.addEventListener('click', () => {
      const columnName = header.getAttribute('data-column');
      sortByColumn(columnName);
    });
  });
});

// Add this after the displayExpenses function
document.addEventListener('click', async (event) => {
  if (event.target.closest('.add-tds-btn')) {
    const button = event.target.closest('.add-tds-btn');
    const expenseId = button.getAttribute('data-expense-id');

    // First show the confirmation dialog
    const { value: formValues, isConfirmed, isDenied } = await Swal.fire({
      title: `
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
          <i class="ri-question-line" style="font-size: 28px; color: #1976D2;"></i>
          <h2 style="color: #1976D2; font-weight: 600; margin: 0;">TDS Confirmation</h2>
        </div>
      `,
      html: `
        <div style="text-align: left; padding: 20px; background: #f8f9fa; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <div style="margin-bottom: 15px;">
            <label class="form-check" style="display: flex; align-items: center; padding: 15px; background: white; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <input type="radio" name="tdsOption" value="apply" class="form-check-input" style="margin-right: 10px;">
              <div>
                <div style="font-weight: 500; color: #1976D2; display: flex; align-items: center; gap: 8px;">
                  <i class="ri-check-line"></i>
                  Apply TDS
                </div>
                <div style="font-size: 12px; color: #666; margin-top: 4px;">Add TDS details for this expense</div>
              </div>
            </label>
          </div>
          
          <div style="margin-bottom: 15px;">
            <label class="form-check" style="display: flex; align-items: center; padding: 15px; background: white; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <input type="radio" name="tdsOption" value="noTds" class="form-check-input" style="margin-right: 10px;">
              <div>
                <div style="font-weight: 500; color: #6c757d; display: flex; align-items: center; gap: 8px;">
                  <i class="ri-close-circle-line"></i>
                  Don't Apply TDS
                </div>
                <div style="font-size: 12px; color: #666; margin-top: 4px;">Mark this expense as no TDS applicable</div>
              </div>
            </label>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: `
        <div style="display: flex; align-items: center; gap: 8px;">
          <i class="ri-check-line"></i>
          Continue
        </div>
      `,
      cancelButtonText: `
        <div style="display: flex; align-items: center; gap: 8px;">
          <i class="ri-close-line"></i>
          Cancel
        </div>
      `,
      confirmButtonColor: '#1976D2',
      cancelButtonColor: '#dc3545',
      customClass: {
        popup: 'animated fadeInDown',
        confirmButton: 'btn btn-primary',
        cancelButton: 'btn btn-danger',
        title: 'swal2-title-custom',
        htmlContainer: 'swal2-html-container-custom'
      },
      didOpen: () => {
        // Add hover effect to radio options
        const radioLabels = document.querySelectorAll('.form-check');
        radioLabels.forEach(label => {
          label.addEventListener('mouseover', () => {
            label.style.transform = 'translateY(-2px)';
            label.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          });
          label.addEventListener('mouseout', () => {
            label.style.transform = 'translateY(0)';
            label.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
          });
        });
      },
      preConfirm: () => {
        const selectedOption = document.querySelector('input[name="tdsOption"]:checked')?.value;
        if (!selectedOption) {
          Swal.showValidationMessage('Please select an option');
          return false;
        }
        return selectedOption;
      }
    });

    if (formValues === 'apply') {
      // Show the existing TDS details form
      const { value: tdsDetails } = await Swal.fire({
        title: `
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
            <i class="ri-money-dollar-circle-line" style="font-size: 24px; color: #1976D2;"></i>
            <h2 style="color: #1976D2; font-weight: 600; margin: 0;">TDS Details</h2>
          </div>
        `,
        html: `
          <div style="text-align: left; margin-top: 0; background: #f8f9fa; padding: 15px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <div style="margin-bottom: 15px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <label for="tdsSection" style="display: flex; align-items: center; margin-bottom: 12px; font-weight: 500; color: #333; font-size: 16px;">
                <i class="ri-file-list-3-line" style="color: #1976D2; margin-right: 8px;"></i>
                TDS Section List
              </label>
              <select id="tdsSection" class="form-select" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd; font-size: 15px; background-color: #f8f9fa;">
                <option value="">Select TDS Section</option>
                <option value="194C">194C</option>
                <option value="194H">194H</option>
                <option value="194I">194I</option>
                <option value="194J">194J</option>
              </select>
            </div>

            <div style="margin-bottom: 15px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <label for="tdsType" style="display: flex; align-items: center; margin-bottom: 12px; font-weight: 500; color: #333; font-size: 16px;">
                <i class="ri-user-settings-line" style="color: #1976D2; margin-right: 8px;"></i>
                Individual/Others
              </label>
              <select id="tdsType" class="form-select" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd; font-size: 15px; background-color: #f8f9fa;">
                <option value="">Select Type</option>
                <option value="individual">Individual</option>
                <option value="others">Others</option>
              </select>
            </div>

            <div id="tdsPercentageSection" style="display: none; margin-bottom: 15px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <label for="tdsPercentage" style="display: flex; align-items: center; margin-bottom: 12px; font-weight: 500; color: #333; font-size: 16px;">
                <i class="ri-percent-line" style="color: #1976D2; margin-right: 8px;"></i>
                TDS Percentage
              </label>
              <select id="tdsPercentage" class="form-select" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd; font-size: 15px; background-color: #f8f9fa;">
                <option value="">Select Percentage</option>
              </select>
            </div>

            <div id="commentSection" style="margin-top: 20px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <label for="tdsComment" style="display: flex; align-items: center; margin-bottom: 12px; font-weight: 500; color: #333; font-size: 16px;">
                <i class="ri-message-2-line" style="color: #1976D2; margin-right: 8px;"></i>
                Add Comment
              </label>
              <textarea id="tdsComment" class="form-control" 
                        style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd; min-height: 100px; font-size: 15px; background-color: #f8f9fa;"
                        placeholder="Enter your comment here..."></textarea>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: `
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="ri-check-line"></i>
            Submit
          </div>
        `,
        cancelButtonText: `
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="ri-close-line"></i>
            Cancel
          </div>
        `,
        confirmButtonColor: '#1976D2',
        cancelButtonColor: '#6c757d',
        customClass: {
          popup: 'animated fadeInDown',
          confirmButton: 'btn btn-primary',
          cancelButton: 'btn btn-secondary',
          title: 'swal2-title-custom',
          htmlContainer: 'swal2-html-container-custom'
        },
        didOpen: () => {
          const tdsSection = document.getElementById('tdsSection');
          const tdsType = document.getElementById('tdsType');
          const tdsPercentageSection = document.getElementById('tdsPercentageSection');
          const tdsPercentage = document.getElementById('tdsPercentage');

          const updateTdsPercentage = () => {
            const section = tdsSection.value;
            const type = tdsType.value;
            
            if (!section || !type) {
              tdsPercentageSection.style.display = 'none';
              return;
            }

            tdsPercentageSection.style.display = 'block';
            tdsPercentage.innerHTML = '<option value="">Select Percentage</option>';

            if (section === '194C') {
              if (type === 'individual') {
                tdsPercentage.innerHTML += '<option value="1">1%</option>';
              } else {
                tdsPercentage.innerHTML += '<option value="2">2%</option>';
              }
            } else if (section === '194H') {
              tdsPercentage.innerHTML += '<option value="2">2%</option>';
            } else if (section === '194I') {
              tdsPercentage.innerHTML += `
                <option value="2">2%</option>
                <option value="10">10%</option>
              `;
            } else if (section === '194J') {
              tdsPercentage.innerHTML += '<option value="10">10%</option>';
            }
          };

          tdsSection.addEventListener('change', updateTdsPercentage);
          tdsType.addEventListener('change', updateTdsPercentage);
        },
        preConfirm: () => {
          const tdsSection = document.getElementById('tdsSection').value;
          const tdsType = document.getElementById('tdsType').value;
          const tdsPercentage = document.getElementById('tdsPercentage').value;
          const comment = document.getElementById('tdsComment').value;

          if (!tdsSection) {
            Swal.showValidationMessage('Please select a TDS Section');
            return false;
          }

          if (!tdsType) {
            Swal.showValidationMessage('Please select Individual/Others');
            return false;
          }

          if (!tdsPercentage) {
            Swal.showValidationMessage('Please select TDS Percentage');
            return false;
          }

          // Get the clicked button instead of querying all buttons
          const clickedButton = event.target.closest('.add-tds-btn');
          const baseAmount = parseFloat(clickedButton.getAttribute('data-amount'));
          const gstAmount = parseFloat(clickedButton.getAttribute('data-gst-amount')) || 0;
          
          // Calculate TDS amount
          const tdsAmount = (baseAmount * parseFloat(tdsPercentage)) / 100;
          
          // Calculate final amount
          const finalAmount = Math.round(baseAmount - tdsAmount + gstAmount);

          // Log calculations
          console.log('TDS Calculations:', {
            'Base Amount': baseAmount,
            'TDS Percentage': tdsPercentage,
            'TDS Amount': tdsAmount,
            'GST Amount': gstAmount,
            'Final Amount': finalAmount
          });

          return {
            tdsSection,
            tdsType,
            tdsPercentage,
            comment,
            tdsAmount,
            finalAmount
          };
        }
      });

      if (tdsDetails) {
        await handleTdsSubmit(expenseId, tdsDetails);
      }
    } else if (formValues === 'noTds') {
      const clickedButton = event.target.closest('.add-tds-btn');
      const row = clickedButton.closest('tr');
      const totalAmount = row.cells[9].textContent.replace(/[₹,]/g, '').trim();
      // Handle "No TDS" case
      const requestData = {
        expense_id: expenseId,
        tds_percentage: "0",
        tds_amount: "0",
        tds_process: true,
        ca_comment: "No TDS Applicable",
        final_amount: parseFloat(totalAmount),
        tds_section_list: "NA",
        tds_type: "NA"
      };

      try {
        const response = await fetch('https://backend.bninewdelhi.com/api/tdsUpdateexpense', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        });

        const data = await response.json();

        if (data.success) {
          // Update the button to show "No TDS" state
          button.outerHTML = `
            <button class="btn btn-secondary btn-sm" disabled style="opacity: 0.7;">
              <i class="ri-close-circle-line"></i>
              No TDS
            </button>
          `;
          
          Swal.fire({
            title: "Success!",
            text: "Expense marked as No TDS",
            icon: "success",
            confirmButtonText: "OK"
          }).then(() => {
            fetchExpenses();
          });
        } else {
          Swal.fire({
            title: "Error!",
            text: data.message || "Failed to update expense",
            icon: "error",
            confirmButtonText: "OK"
          });
        }
      } catch (error) {
        console.error('Error updating expense:', error);
        Swal.fire({
          title: "Error!",
          text: "Failed to update expense",
          icon: "error",
          confirmButtonText: "OK"
        });
      }
    }
  }
});

// Add this after your existing SweetAlert form code
const handleTdsSubmit = async (expenseId, formData) => {
  try {
    const requestData = {
      expense_id: expenseId,
      tds_percentage: formData.tdsPercentage,
      tds_amount: formData.tdsAmount,
      tds_process: true,
      ca_comment: formData.comment,
      final_amount: formData.finalAmount,
      tds_section_list: formData.tdsSection,
      tds_type: formData.tdsType
    };

    // Show confirmation SweetAlert with details
    const result = await Swal.fire({
      title: `
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
          <i class="ri-file-list-3-line" style="font-size: 28px; color: #4CAF50;"></i>
          <h2 style="color: #4CAF50; font-weight: 600; margin: 0;">TDS Details</h2>
        </div>
      `,
      html: `
        <div style="text-align: left; padding: 10px; background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
          <div style="display: flex; align-items: center; margin-bottom: 10px; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); transition: transform 0.3s ease;">
            <i class="ri-file-list-3-line" style="font-size: 20px; color: #4CAF50; margin-right: 10px;"></i>
            <div>
              <div style="font-size: 11px; color: #666; margin-bottom: 2px;">TDS Section</div>
              <div style="font-weight: 600; color: #333; font-size: 14px;">${formData.tdsSection}</div>
            </div>
          </div>

          <div style="display: flex; align-items: center; margin-bottom: 10px; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); transition: transform 0.3s ease;">
            <i class="ri-user-settings-line" style="font-size: 20px; color: #4CAF50; margin-right: 10px;"></i>
            <div>
              <div style="font-size: 11px; color: #666; margin-bottom: 2px;">TDS Type</div>
              <div style="font-weight: 600; color: #333; font-size: 14px;">${formData.tdsType}</div>
            </div>
          </div>

          <div style="display: flex; align-items: center; margin-bottom: 10px; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); transition: transform 0.3s ease;">
            <i class="ri-percent-line" style="font-size: 20px; color: #4CAF50; margin-right: 10px;"></i>
            <div>
              <div style="font-size: 11px; color: #666; margin-bottom: 2px;">TDS Percentage</div>
              <div style="font-weight: 600; color: #333; font-size: 14px;">${formData.tdsPercentage}%</div>
            </div>
          </div>

          <div style="display: flex; align-items: center; margin-bottom: 10px; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); transition: transform 0.3s ease;">
            <i class="ri-money-dollar-circle-line" style="font-size: 20px; color: #4CAF50; margin-right: 10px;"></i>
            <div>
              <div style="font-size: 11px; color: #666; margin-bottom: 2px;">TDS Amount</div>
              <div style="font-weight: 600; color: #333; font-size: 14px;">₹${formData.tdsAmount}</div>
            </div>
          </div>

          <div style="display: flex; align-items: center; margin-bottom: 10px; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); transition: transform 0.3s ease;">
            <i class="ri-message-2-line" style="font-size: 20px; color: #4CAF50; margin-right: 10px;"></i>
            <div>
              <div style="font-size: 11px; color: #666; margin-bottom: 2px;">CA Comment</div>
              <div style="font-weight: 600; color: #333; font-size: 14px;">${formData.comment || 'No comment'}</div>
            </div>
          </div>

          <div style="display: flex; align-items: center; margin-bottom: 0; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); transition: transform 0.3s ease;">
            <i class="ri-calculator-line" style="font-size: 20px; color: #4CAF50; margin-right: 10px;"></i>
            <div>
              <div style="font-size: 11px; color: #666; margin-bottom: 2px;">Final Amount</div>
              <div style="font-weight: 600; color: #333; font-size: 14px;">₹${formData.finalAmount}</div>
            </div>
          </div>
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: `
        <div style="display: flex; align-items: center; gap: 6px;">
          <i class="ri-check-line"></i>
          Close
        </div>
      `,
      confirmButtonColor: '#4CAF50',
      customClass: {
        popup: 'animated fadeInDown',
        title: 'swal2-title-custom',
        htmlContainer: 'swal2-html-container-custom',
        confirmButton: 'btn btn-success'
      },
      didOpen: () => {
        // Add hover effect to each detail box
        const detailBoxes = document.querySelectorAll('.swal2-html-container > div > div');
        detailBoxes.forEach(box => {
          box.addEventListener('mouseover', () => {
            box.style.transform = 'translateY(-2px)';
            box.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          });
          box.addEventListener('mouseout', () => {
            box.style.transform = 'translateY(0)';
            box.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
          });
        });
      }
    });

    if (result.isConfirmed) {
      console.log('Request Data to be sent:', requestData);
      
      
      const response = await fetch('https://backend.bninewdelhi.com/api/tdsUpdateexpense', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          title: "Success!",
          text: "TDS details updated successfully",
          icon: "success",
          confirmButtonText: "OK"
        }).then(() => {
          fetchExpenses();
        });
      } else {
        Swal.fire({
          title: "Error!",
          text: data.message || "Failed to update TDS details",
          icon: "error",
          confirmButtonText: "OK"
        });
      }
      
    }

  } catch (error) {
    console.error('Error in TDS calculations:', error);
    Swal.fire({
      title: "Error!",
      text: "Failed to calculate TDS details",
      icon: "error",
      confirmButtonText: "OK"
    });
  }
};

// Enhanced CSS styles
const style = document.createElement('style');
style.textContent = `
  .swal2-popup {
    border-radius: 15px !important;
    padding: 1.5rem !important;
    background: #ffffff !important;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;
  }
  
  .swal2-title {
    margin-bottom: 0.5rem !important;
    padding-bottom: 0 !important;
  }
  
  .swal2-html-container {
    margin-top: 0.5rem !important;
  }
  
  .form-check-input:checked {
    background-color: #1976D2 !important;
    border-color: #1976D2 !important;
  }
  
  .form-select:focus, .form-control:focus {
    border-color: #1976D2 !important;
    box-shadow: 0 0 0 0.2rem rgba(25, 118, 210, 0.25) !important;
  }
  
  .swal2-confirm, .swal2-cancel {
    padding: 12px 30px !important;
    font-weight: 500 !important;
    border-radius: 8px !important;
    transition: all 0.3s ease !important;
  }
  
  .swal2-confirm:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 4px 8px rgba(25, 118, 210, 0.2) !important;
  }
  
  .swal2-cancel:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 4px 8px rgba(108, 117, 125, 0.2) !important;
  }
  
  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translate3d(0, -20px, 0);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animated {
    animation-duration: 0.3s;
    animation-fill-mode: both;
  }
  
  .fadeInDown {
    animation-name: fadeInDown;
  }
  
  .swal2-title-custom {
    font-size: 1.5rem !important;
    color: #1976D2 !important;
  }
  
  .swal2-html-container-custom {
    margin: 1rem 0 !important;
  }
  
  .form-select, .form-control {
    transition: all 0.3s ease !important;
  }
  
  .form-select:hover, .form-control:hover {
    border-color: #1976D2 !important;
  }
`;
document.head.appendChild(style);

// Add event listener for View TDS Details button
document.addEventListener('click', function(event) {
  if (event.target.closest('.view-tds-btn')) {
    console.log('View TDS Details button clicked');
    const button = event.target.closest('.view-tds-btn');
    
    // First show the confirmation dialog for TDS status
    Swal.fire({
      title: `
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
          <i class="ri-question-line" style="font-size: 28px; color: #1976D2;"></i>
          <h2 style="color: #1976D2; font-weight: 600; margin: 0;">TDS Status</h2>
        </div>
      `,
      html: `
        <div style="text-align: left; padding: 20px; background: #f8f9fa; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <div style="margin-bottom: 15px;">
            <label class="form-check" style="display: flex; align-items: center; padding: 15px; background: white; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <input type="radio" name="tdsStatus" value="apply" class="form-check-input" style="margin-right: 10px;" ${button.getAttribute('data-tds-section') !== 'NA' ? 'checked' : ''}>
              <div>
                <div style="font-weight: 500; color: #1976D2; display: flex; align-items: center; gap: 8px;">
                  <i class="ri-check-line"></i>
                  Apply TDS
                </div>
                <div style="font-size: 12px; color: #666; margin-top: 4px;">Apply TDS to this expense</div>
              </div>
            </label>
          </div>
          
          <div style="margin-bottom: 15px;">
            <label class="form-check" style="display: flex; align-items: center; padding: 15px; background: white; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <input type="radio" name="tdsStatus" value="noTds" class="form-check-input" style="margin-right: 10px;" ${button.getAttribute('data-tds-section') === 'NA' ? 'checked' : ''}>
              <div>
                <div style="font-weight: 500; color: #6c757d; display: flex; align-items: center; gap: 8px;">
                  <i class="ri-close-circle-line"></i>
                  Don't Apply TDS
                </div>
                <div style="font-size: 12px; color: #666; margin-top: 4px;">Mark this expense as no TDS applicable</div>
              </div>
            </label>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: `
        <div style="display: flex; align-items: center; gap: 6px;">
          <i class="ri-edit-line"></i>
          Continue
        </div>
      `,
      cancelButtonText: `
        <div style="display: flex; align-items: center; gap: 6px;">
          <i class="ri-close-line"></i>
          Cancel
        </div>
      `,
      confirmButtonColor: '#1976D2',
      cancelButtonColor: '#6c757d',
      customClass: {
        popup: 'animated fadeInDown',
        title: 'swal2-title-custom',
        htmlContainer: 'swal2-html-container-custom',
        confirmButton: 'btn btn-primary',
        cancelButton: 'btn btn-secondary'
      },
      didOpen: () => {
        // Add hover effect to each option
        const options = document.querySelectorAll('.form-check');
        options.forEach(option => {
          option.addEventListener('mouseover', () => {
            option.style.transform = 'translateY(-2px)';
            option.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          });
          option.addEventListener('mouseout', () => {
            option.style.transform = 'translateY(0)';
            option.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
          });
        });
      },
      preConfirm: () => {
        const selectedStatus = document.querySelector('input[name="tdsStatus"]:checked')?.value;
        if (!selectedStatus) {
          Swal.showValidationMessage('Please select a TDS status');
          return false;
        }
        return selectedStatus;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const selectedStatus = result.value;
        
        if (selectedStatus === 'noTds') {
          const row = button.closest('tr');
const totalAmount = row.cells[9].textContent.replace(/[₹,]/g, '').trim();
          // Handle "No TDS" case
          const requestData = {
            expense_id: button.getAttribute('data-expense-id'),
            tds_percentage: "0",
            tds_amount: "0",
            tds_process: true,
            ca_comment: "No TDS Applicable",
            final_amount: parseFloat(totalAmount),
            tds_section_list: "NA",
            tds_type: "NA"
          };

          // Show confirmation before updating
          Swal.fire({
            title: 'Confirm Update',
            text: 'Are you sure you want to mark this expense as No TDS applicable?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, update it',
            cancelButtonText: 'Cancel'
          }).then(async (confirmResult) => {
            if (confirmResult.isConfirmed) {
              try {
                const response = await fetch('https://backend.bninewdelhi.com/api/tdsUpdateexpense', {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(requestData)
                });

                const data = await response.json();

                if (data.success) {
                  Swal.fire({
                    title: "Success!",
                    text: "Expense marked as No TDS",
                    icon: "success",
                    confirmButtonText: "OK"
                  }).then(() => {
                    fetchExpenses();
                  });
                } else {
                  throw new Error(data.message || "Failed to update expense");
                }
              } catch (error) {
                console.error('Error updating expense:', error);
                Swal.fire({
                  title: "Error!",
                  text: error.message || "Failed to update expense",
                  icon: "error",
                  confirmButtonText: "OK"
                });
              }
            }
          });
        } else {
          // Show the existing TDS details view/edit form
          Swal.fire({
            title: `
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
                <i class="ri-file-list-3-line" style="font-size: 28px; color: #4CAF50;"></i>
                <h2 style="color: #4CAF50; font-weight: 600; margin: 0;">TDS Details</h2>
              </div>
            `,
            html: `
              <div style="text-align: left; padding: 10px; background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%); border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                <div style="display: flex; align-items: center; margin-bottom: 10px; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); transition: transform 0.3s ease;">
                  <i class="ri-file-list-3-line" style="font-size: 20px; color: #4CAF50; margin-right: 10px;"></i>
                  <div>
                    <div style="font-size: 11px; color: #666; margin-bottom: 2px;">TDS Section</div>
                    <div style="font-weight: 600; color: #333; font-size: 14px;">${button.getAttribute('data-tds-section')}</div>
                  </div>
                </div>

                <div style="display: flex; align-items: center; margin-bottom: 10px; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); transition: transform 0.3s ease;">
                  <i class="ri-user-settings-line" style="font-size: 20px; color: #4CAF50; margin-right: 10px;"></i>
                  <div>
                    <div style="font-size: 11px; color: #666; margin-bottom: 2px;">TDS Type</div>
                    <div style="font-weight: 600; color: #333; font-size: 14px;">${button.getAttribute('data-tds-type')}</div>
                  </div>
                </div>

                <div style="display: flex; align-items: center; margin-bottom: 10px; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); transition: transform 0.3s ease;">
                  <i class="ri-percent-line" style="font-size: 20px; color: #4CAF50; margin-right: 10px;"></i>
                  <div>
                    <div style="font-size: 11px; color: #666; margin-bottom: 2px;">TDS Percentage</div>
                    <div style="font-weight: 600; color: #333; font-size: 14px;">${button.getAttribute('data-tds-percentage')}%</div>
                  </div>
                </div>

                <div style="display: flex; align-items: center; margin-bottom: 10px; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); transition: transform 0.3s ease;">
                  <i class="ri-money-dollar-circle-line" style="font-size: 20px; color: #4CAF50; margin-right: 10px;"></i>
                  <div>
                    <div style="font-size: 11px; color: #666; margin-bottom: 2px;">TDS Amount</div>
                    <div style="font-weight: 600; color: #333; font-size: 14px;">₹${button.getAttribute('data-tds-amount')}</div>
                  </div>
                </div>

                <div style="display: flex; align-items: center; margin-bottom: 10px; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); transition: transform 0.3s ease;">
                  <i class="ri-message-2-line" style="font-size: 20px; color: #4CAF50; margin-right: 10px;"></i>
                  <div>
                    <div style="font-size: 11px; color: #666; margin-bottom: 2px;">CA Comment</div>
                    <div style="font-weight: 600; color: #333; font-size: 14px;">${button.getAttribute('data-ca-comment') || 'No comment'}</div>
                  </div>
                </div>

                <div style="display: flex; align-items: center; margin-bottom: 0; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); transition: transform 0.3s ease;">
                  <i class="ri-calculator-line" style="font-size: 20px; color: #4CAF50; margin-right: 10px;"></i>
                  <div>
                    <div style="font-size: 11px; color: #666; margin-bottom: 2px;">Final Amount</div>
                    <div style="font-weight: 600; color: #333; font-size: 14px;">₹${button.getAttribute('data-final-amount')}</div>
                  </div>
                </div>
              </div>
            `,
            showConfirmButton: true,
            showDenyButton: true,
            confirmButtonText: `
              <div style="display: flex; align-items: center; gap: 6px;">
                <i class="ri-edit-line"></i>
                Edit
              </div>
            `,
            denyButtonText: `
              <div style="display: flex; align-items: center; gap: 6px;">
                <i class="ri-close-line"></i>
                Close
              </div>
            `,
            confirmButtonColor: '#1976D2',
            denyButtonColor: '#6c757d',
            customClass: {
              popup: 'animated fadeInDown',
              title: 'swal2-title-custom',
              htmlContainer: 'swal2-html-container-custom',
              confirmButton: 'btn btn-primary',
              denyButton: 'btn btn-secondary'
            },
            didOpen: () => {
              // Add hover effect to each detail box
              const detailBoxes = document.querySelectorAll('.swal2-html-container > div > div');
              detailBoxes.forEach(box => {
                box.addEventListener('mouseover', () => {
                  box.style.transform = 'translateY(-2px)';
                  box.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                });
                box.addEventListener('mouseout', () => {
                  box.style.transform = 'translateY(0)';
                  box.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
                });
              });
            }
          }).then((result) => {
            if (result.isConfirmed) {
              // Show edit form
              Swal.fire({
                title: `
                  <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <i class="ri-edit-line" style="font-size: 24px; color: #1976D2;"></i>
                    <h2 style="color: #1976D2; font-weight: 600; margin: 0;">Edit TDS Details</h2>
                  </div>
                `,
                html: `
                  <div style="text-align: left; margin-top: 0; background: #f8f9fa; padding: 15px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                    <div style="margin-bottom: 15px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                      <label for="tdsSection" style="display: flex; align-items: center; margin-bottom: 12px; font-weight: 500; color: #333; font-size: 16px;">
                        <i class="ri-file-list-3-line" style="color: #1976D2; margin-right: 8px;"></i>
                        TDS Section List
                      </label>
                      <select id="tdsSection" class="form-select" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd; font-size: 15px; background-color: #f8f9fa;">
                        <option value="">Select TDS Section</option>
                        <option value="194C" ${button.getAttribute('data-tds-section') === '194C' ? 'selected' : ''}>194C</option>
                        <option value="194H" ${button.getAttribute('data-tds-section') === '194H' ? 'selected' : ''}>194H</option>
                        <option value="194I" ${button.getAttribute('data-tds-section') === '194I' ? 'selected' : ''}>194I</option>
                        <option value="194J" ${button.getAttribute('data-tds-section') === '194J' ? 'selected' : ''}>194J</option>
                      </select>
                    </div>

                    <div style="margin-bottom: 15px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                      <label for="tdsType" style="display: flex; align-items: center; margin-bottom: 12px; font-weight: 500; color: #333; font-size: 16px;">
                        <i class="ri-user-settings-line" style="color: #1976D2; margin-right: 8px;"></i>
                        Individual/Others
                      </label>
                      <select id="tdsType" class="form-select" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd; font-size: 15px; background-color: #f8f9fa;">
                        <option value="">Select Type</option>
                        <option value="individual" ${button.getAttribute('data-tds-type') === 'individual' ? 'selected' : ''}>Individual</option>
                        <option value="others" ${button.getAttribute('data-tds-type') === 'others' ? 'selected' : ''}>Others</option>
                      </select>
                    </div>

                    <div id="tdsPercentageSection" style="margin-bottom: 15px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                      <label for="tdsPercentage" style="display: flex; align-items: center; margin-bottom: 12px; font-weight: 500; color: #333; font-size: 16px;">
                        <i class="ri-percent-line" style="color: #1976D2; margin-right: 8px;"></i>
                        TDS Percentage
                      </label>
                      <select id="tdsPercentage" class="form-select" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd; font-size: 15px; background-color: #f8f9fa;">
                        <option value="">Select Percentage</option>
                      </select>
                    </div>

                    <div id="commentSection" style="margin-top: 20px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                      <label for="tdsComment" style="display: flex; align-items: center; margin-bottom: 12px; font-weight: 500; color: #333; font-size: 16px;">
                        <i class="ri-message-2-line" style="color: #1976D2; margin-right: 8px;"></i>
                        Add Comment
                      </label>
                      <textarea id="tdsComment" class="form-control" 
                                style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd; min-height: 100px; font-size: 15px; background-color: #f8f9fa;"
                                placeholder="Enter your comment here...">${button.getAttribute('data-ca-comment') || ''}</textarea>
                    </div>
                  </div>
                `,
                showCancelButton: true,
                confirmButtonText: `
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="ri-check-line"></i>
                    Save Changes
                  </div>
                `,
                cancelButtonText: `
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <i class="ri-close-line"></i>
                    Cancel
                  </div>
                `,
                confirmButtonColor: '#1976D2',
                cancelButtonColor: '#6c757d',
                customClass: {
                  popup: 'animated fadeInDown',
                  confirmButton: 'btn btn-primary',
                  cancelButton: 'btn btn-secondary',
                  title: 'swal2-title-custom',
                  htmlContainer: 'swal2-html-container-custom'
                },
                didOpen: () => {
                  const tdsSection = document.getElementById('tdsSection');
                  const tdsType = document.getElementById('tdsType');
                  const tdsPercentageSection = document.getElementById('tdsPercentageSection');
                  const tdsPercentage = document.getElementById('tdsPercentage');

                  // Set initial percentage based on current values
                  const currentSection = button.getAttribute('data-tds-section');
                  const currentType = button.getAttribute('data-tds-type');
                  const currentPercentage = button.getAttribute('data-tds-percentage');

                  const updateTdsPercentage = () => {
                    const section = tdsSection.value;
                    const type = tdsType.value;
                    
                    if (!section || !type) {
                      tdsPercentageSection.style.display = 'none';
                      return;
                    }

                    tdsPercentageSection.style.display = 'block';
                    tdsPercentage.innerHTML = '<option value="">Select Percentage</option>';

                    if (section === '194C') {
                      if (type === 'individual') {
                        tdsPercentage.innerHTML += '<option value="1">1%</option>';
                      } else {
                        tdsPercentage.innerHTML += '<option value="2">2%</option>';
                      }
                    } else if (section === '194H') {
                      tdsPercentage.innerHTML += '<option value="2">2%</option>';
                    } else if (section === '194I') {
                      tdsPercentage.innerHTML += `
                        <option value="2">2%</option>
                        <option value="10">10%</option>
                      `;
                    } else if (section === '194J') {
                      tdsPercentage.innerHTML += '<option value="10">10%</option>';
                    }

                    // Set the current percentage if it matches the available options
                    if (currentPercentage) {
                      const option = Array.from(tdsPercentage.options).find(opt => opt.value === currentPercentage);
                      if (option) {
                        option.selected = true;
                      }
                    }
                  };

                  tdsSection.addEventListener('change', updateTdsPercentage);
                  tdsType.addEventListener('change', updateTdsPercentage);

                  // Initial update
                  updateTdsPercentage();
                },
                preConfirm: () => {
                  const tdsSection = document.getElementById('tdsSection').value;
                  const tdsType = document.getElementById('tdsType').value;
                  const tdsPercentage = document.getElementById('tdsPercentage').value;
                  const comment = document.getElementById('tdsComment').value;

                  if (!tdsSection) {
                    Swal.showValidationMessage('Please select a TDS Section');
                    return false;
                  }

                  if (!tdsType) {
                    Swal.showValidationMessage('Please select Individual/Others');
                    return false;
                  }

                  if (!tdsPercentage) {
                    Swal.showValidationMessage('Please select TDS Percentage');
                    return false;
                  }

                  // Calculate TDS amount
                  const baseAmount = parseFloat(button.getAttribute('data-amount'));
                  const tdsAmount = (baseAmount * parseFloat(tdsPercentage)) / 100;
                  
                  // Calculate final amount
                  const gstAmount = parseFloat(button.getAttribute('data-gst-amount')) || 0;
                  const finalAmount = Math.round(baseAmount - tdsAmount + gstAmount);

                  return {
                    tdsSection,
                    tdsType,
                    tdsPercentage,
                    comment,
                    tdsAmount,
                    finalAmount
                  };
                }
              }).then((result) => {
                if (result.isConfirmed) {
                  handleEditTdsSubmit(button.getAttribute('data-expense-id'), result.value);
                }
              });
            }
          });
        }
      }
    });
  }
});

// Add event listener for Approve button
document.addEventListener('click', function(event) {
  if (event.target.closest('.ro-approve-btn')) {
    const button = event.target.closest('.ro-approve-btn');
    
    Swal.fire({
      title: `
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
          <i class="ri-check-double-line" style="font-size: 28px; color: #6f42c1;"></i>
          <h2 style="color: #6f42c1; font-weight: 600; margin: 0;">RO Verification</h2>
        </div>
      `,
      html: `
        <div style="text-align: left; padding: 20px; background: #f8f9fa; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <div style="margin-bottom: 15px;">
            <label class="form-check" style="display: flex; align-items: center; padding: 15px; background: white; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <input type="radio" name="approvalOption" value="approve" class="form-check-input" style="margin-right: 10px;">
              <div>
                <div style="font-weight: 500; color: #6f42c1; display: flex; align-items: center; gap: 8px;">
                  <i class="ri-check-double-line"></i>
                  Yes, Proceed
                </div>
                <div style="font-size: 12px; color: #666; margin-top: 4px;">Approve this expense for processing</div>
              </div>
            </label>
          </div>
          
          <div style="margin-bottom: 15px;">
            <label class="form-check" style="display: flex; align-items: center; padding: 15px; background: white; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <input type="radio" name="approvalOption" value="reject" class="form-check-input" style="margin-right: 10px;">
              <div>
                <div style="font-weight: 500; color: #dc3545; display: flex; align-items: center; gap: 8px;">
                  <i class="ri-close-circle-line"></i>
                  Reject
                </div>
                <div style="font-size: 12px; color: #666; margin-top: 4px;">Reject this expense with a reason</div>
              </div>
            </label>
          </div>

          <div id="rejectCommentSection" style="display: none; margin-top: 15px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <label for="rejectComment" style="display: flex; align-items: center; margin-bottom: 10px; font-weight: 500; color: #dc3545;">
              <i class="ri-message-2-line" style="margin-right: 8px;"></i>
              Rejection Reason
            </label>
            <textarea id="rejectComment" class="form-control" 
                      style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd; min-height: 100px; font-size: 14px; background-color: #f8f9fa;"
                      placeholder="Please provide a reason for rejection..."></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: `
        <div style="display: flex; align-items: center; gap: 8px;">
          <i class="ri-check-line"></i>
          Submit
        </div>
      `,
      cancelButtonText: `
        <div style="display: flex; align-items: center; gap: 8px;">
          <i class="ri-close-line"></i>
          Cancel
        </div>
      `,
      confirmButtonColor: '#6f42c1',
      cancelButtonColor: '#dc3545',
      customClass: {
        popup: 'animated fadeInDown',
        confirmButton: 'btn btn-primary',
        cancelButton: 'btn btn-danger',
        title: 'swal2-title-custom',
        htmlContainer: 'swal2-html-container-custom'
      },
      didOpen: () => {
        // Add hover effect to radio options
        const radioLabels = document.querySelectorAll('.form-check');
        radioLabels.forEach(label => {
          label.addEventListener('mouseover', () => {
            label.style.transform = 'translateY(-2px)';
            label.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
          });
          label.addEventListener('mouseout', () => {
            label.style.transform = 'translateY(0)';
            label.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
          });
        });

        // Show/hide comment section based on radio selection
        const radioButtons = document.querySelectorAll('input[name="approvalOption"]');
        const commentSection = document.getElementById('rejectCommentSection');
        
        radioButtons.forEach(radio => {
          radio.addEventListener('change', () => {
            if (radio.value === 'reject') {
              commentSection.style.display = 'block';
            } else {
              commentSection.style.display = 'none';
            }
          });
        });
      },
      preConfirm: () => {
        const selectedOption = document.querySelector('input[name="approvalOption"]:checked')?.value;
        if (!selectedOption) {
          Swal.showValidationMessage('Please select an option');
          return false;
        }
        
        if (selectedOption === 'reject') {
          const comment = document.getElementById('rejectComment').value;
          if (!comment.trim()) {
            Swal.showValidationMessage('Please provide a reason for rejection');
            return false;
          }
          return { option: selectedOption, comment };
        }
        
        return { option: selectedOption };
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const expenseId = button.getAttribute('data-expense-id');
        const { option, comment } = result.value;
        
        // Prepare the request data
        const requestData = {
          expense_id: expenseId,
          verification: option === 'approve',
          ro_comment: option === 'reject' ? comment : null
        };

        // Send the request to update verification status
        fetch('https://backend.bninewdelhi.com/api/tdsUpdateexpense', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Update button appearance based on verification status
            if (option === 'approve') {
              button.innerHTML = `
                <i class="ri-check-double-line"></i>
                Verified
              `;
              button.style.background = 'linear-gradient(45deg, #28a745, #218838)';
            } else {
              button.innerHTML = `
                <i class="ri-close-circle-line"></i>
                Rejected
              `;
              button.style.background = 'linear-gradient(45deg, #dc3545, #c82333)';
            }
            button.disabled = true;

            Swal.fire({
              title: "Success!",
              text: option === 'approve' ? "Expense verified successfully" : "Expense rejected successfully",
              icon: "success",
              confirmButtonText: "OK"
            });
          } else {
            Swal.fire({
              title: "Error!",
              text: data.message || "Failed to update verification status",
              icon: "error",
              confirmButtonText: "OK"
            });
          }
        })
        .catch(error => {
          console.error('Error updating verification:', error);
          Swal.fire({
            title: "Error!",
            text: "Failed to update verification status",
            icon: "error",
            confirmButtonText: "OK"
          });
        });
      }
    });
  }
});

// Add this after your existing event listeners
document.addEventListener('click', function(event) {
  if (event.target.classList.contains('show-more-text')) {
    const descriptionContainer = event.target.closest('div');
    const fullDescription = descriptionContainer.querySelector('.full-description');
    fullDescription.style.display = 'block';
  }
  
  if (event.target.classList.contains('show-less-text')) {
    const fullDescription = event.target.closest('.full-description');
    fullDescription.style.display = 'none';
  }
});

// Add this after your existing event listeners
document.addEventListener('mouseover', function(event) {
  if (event.target.closest('div[style*="cursor: help"]')) {
    const tooltip = event.target.closest('div[style*="position: relative"]').querySelector('div[style*="position: absolute"]');
    if (tooltip) {
      tooltip.style.display = 'block';
    }
  }
});

document.addEventListener('mouseout', function(event) {
  if (event.target.closest('div[style*="cursor: help"]')) {
    const tooltip = event.target.closest('div[style*="position: relative"]').querySelector('div[style*="position: absolute"]');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  }
});

// Add this function for handling status modification
const handleStatusModification = async (expenseId, currentStatus) => {
  const result = await Swal.fire({
    title: 'Modify Status',
    html: `
      <div style="text-align: left; padding: 20px; background: #f8f9fa; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <div style="margin-bottom: 15px;">
          <label class="form-check" style="display: flex; align-items: center; padding: 15px; background: white; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <input type="radio" name="statusOption" value="approve" class="form-check-input" style="margin-right: 10px;" ${currentStatus === 'approved' ? 'checked' : ''}>
            <div>
              <div style="font-weight: 500; color: #28a745; display: flex; align-items: center; gap: 8px;">
                <i class="ri-check-double-line"></i>
                Approve
              </div>
            </div>
          </label>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label class="form-check" style="display: flex; align-items: center; padding: 15px; background: white; border-radius: 8px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <input type="radio" name="statusOption" value="reject" class="form-check-input" style="margin-right: 10px;" ${currentStatus === 'rejected' ? 'checked' : ''}>
            <div>
              <div style="font-weight: 500; color: #dc3545; display: flex; align-items: center; gap: 8px;">
                <i class="ri-close-circle-line"></i>
                Reject
              </div>
            </div>
          </label>
        </div>

        <div id="rejectCommentSection" style="display: none; margin-top: 15px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <label for="rejectComment" style="display: flex; align-items: center; margin-bottom: 10px; font-weight: 500; color: #dc3545;">
            <i class="ri-message-2-line" style="margin-right: 8px;"></i>
            Rejection Reason
          </label>
          <textarea id="rejectComment" class="form-control" 
                    style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd; min-height: 100px; font-size: 14px; background-color: #f8f9fa;"
                    placeholder="Please provide a reason for rejection..."></textarea>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Update Status',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#6f42c1',
    cancelButtonColor: '#dc3545',
    customClass: {
      popup: 'animated fadeInDown',
      confirmButton: 'btn btn-primary',
      cancelButton: 'btn btn-danger',
      title: 'swal2-title-custom',
      htmlContainer: 'swal2-html-container-custom'
    },
    didOpen: () => {
      const radioButtons = document.querySelectorAll('input[name="statusOption"]');
      const commentSection = document.getElementById('rejectCommentSection');
      
      radioButtons.forEach(radio => {
        radio.addEventListener('change', () => {
          if (radio.value === 'reject') {
            commentSection.style.display = 'block';
          } else {
            commentSection.style.display = 'none';
          }
        });
      });
    },
    preConfirm: () => {
      const selectedOption = document.querySelector('input[name="statusOption"]:checked')?.value;
      if (!selectedOption) {
        Swal.showValidationMessage('Please select a status');
        return false;
      }
      
      if (selectedOption === 'reject') {
        const comment = document.getElementById('rejectComment').value;
        if (!comment.trim()) {
          Swal.showValidationMessage('Please provide a reason for rejection');
          return false;
        }
        return { option: selectedOption, comment };
      }
      
      return { option: selectedOption };
    }
  });

  if (result.isConfirmed) {
    const { option, comment } = result.value;
    
    try {
      const response = await fetch('https://backend.bninewdelhi.com/api/tdsUpdateexpense', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          expense_id: expenseId,
          verification: option === 'approve',
          ro_comment: option === 'reject' ? comment : null
        })
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          title: "Success!",
          text: "Status updated successfully",
          icon: "success",
          confirmButtonText: "OK"
        }).then(() => {
          fetchExpenses(); // Refresh the expenses list
        });
      } else {
        throw new Error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      Swal.fire({
        title: "Error!",
        text: error.message || "Failed to update status",
        icon: "error",
        confirmButtonText: "OK"
      });
    }
  }
};

// Add event listener for modify status buttons
document.addEventListener('click', function(event) {
  if (event.target.closest('.modify-status-btn')) {
    const button = event.target.closest('.modify-status-btn');
    const expenseId = button.getAttribute('data-expense-id');
    const currentStatus = button.getAttribute('data-current-status');
    handleStatusModification(expenseId, currentStatus);
  }
});

// Add this function before the displayExpenses function
function showCalculationDetails(expense) {
  const baseAmount = parseFloat(expense.amount) || 0;
  const gstAmount = parseFloat(expense.gst_amount) || 0;
  const tdsAmount = parseFloat(expense.tds_amount) || 0;
  const finalAmount = parseFloat(expense.final_amount) || parseFloat(expense.total_amount) || 0;

  Swal.fire({
    title: `
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
        <i class="ri-calculator-line" style="font-size: 28px; color: #1976D2;"></i>
        <h2 style="color: #1976D2; font-weight: 600; margin: 0;">Amount Calculation</h2>
      </div>
    `,
    html: `
      <div style="text-align: left; padding: 20px; background: #f8f9fa; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <div style="display: flex; align-items: center; margin-bottom: 15px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <i class="ri-money-dollar-circle-line" style="font-size: 20px; color: #1976D2; margin-right: 10px;"></i>
          <div>
            <div style="font-size: 12px; color: #666; margin-bottom: 2px;">Base Amount</div>
            <div style="font-weight: 600; color: #333; font-size: 16px;">₹ ${baseAmount.toLocaleString('en-IN')}</div>
          </div>
        </div>

        ${expense.tds_process ? `
          <div style="display: flex; align-items: center; margin-bottom: 15px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <i class="ri-subtract-line" style="font-size: 20px; color: #dc3545; margin-right: 10px;"></i>
            <div>
              <div style="font-size: 12px; color: #666; margin-bottom: 2px;">TDS Amount (${expense.tds_percentage || 0}%)</div>
              <div style="font-weight: 600; color: #333; font-size: 16px;">₹ ${tdsAmount.toLocaleString('en-IN')}</div>
            </div>
          </div>
        ` : `
          <div style="display: flex; align-items: center; margin-bottom: 15px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <i class="ri-information-line" style="font-size: 20px; color: #6c757d; margin-right: 10px;"></i>
            <div>
              <div style="font-size: 12px; color: #666; margin-bottom: 2px;">TDS Status</div>
              <div style="font-weight: 600; color: #6c757d; font-size: 16px;">Not Applied</div>
            </div>
          </div>
        `}

        <div style="display: flex; align-items: center; margin-bottom: 15px; background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <i class="ri-add-line" style="font-size: 20px; color: #28a745; margin-right: 10px;"></i>
          <div>
            <div style="font-size: 12px; color: #666; margin-bottom: 2px;">GST Amount</div>
            <div style="font-weight: 600; color: #333; font-size: 16px;">₹ ${gstAmount.toLocaleString('en-IN')}</div>
          </div>
        </div>

        <div style="display: flex; align-items: center; margin-bottom: 0; background: linear-gradient(135deg, #1976D2 0%, #1565C0 100%); padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <i class="ri-equal-line" style="font-size: 20px; color: white; margin-right: 10px;"></i>
          <div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.8); margin-bottom: 2px;">Final Amount</div>
            <div style="font-weight: 600; color: white; font-size: 18px;">₹ ${finalAmount.toLocaleString('en-IN')}</div>
          </div>
        </div>

        ${expense.tds_process ? `
          <div style="margin-top: 15px; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <div style="font-size: 12px; color: #666; margin-bottom: 5px;">TDS Details:</div>
            <div style="font-size: 13px; color: #333;">
              <div><strong>Section:</strong> ${expense.tds_section_list || 'N/A'}</div>
              <div><strong>Type:</strong> ${expense.tds_type || 'N/A'}</div>
              ${expense.ca_comment ? `<div><strong>Comment:</strong> ${expense.ca_comment}</div>` : ''}
            </div>
          </div>
        ` : ''}
      </div>
    `,
    showConfirmButton: true,
    confirmButtonText: `
      <div style="display: flex; align-items: center; gap: 6px;">
        <i class="ri-close-line"></i>
        Close
      </div>
    `,
    confirmButtonColor: '#1976D2',
    customClass: {
      popup: 'animated fadeInDown',
      title: 'swal2-title-custom',
      htmlContainer: 'swal2-html-container-custom',
      confirmButton: 'btn btn-primary'
    }
  });
}

// Add this function to handle the export functionality
function exportExpensesToExcel() {
  try {
    // Define the fields you want to export
    const headers = [
      "Expense ID",
      "Entry Date",
      "Expense Type",
      "Chapter Name",
      "Vendor Name",
      "Vendor Company",
      "Description",
      "Amount",
      "GST Amount",
      "Total Amount",
      "TDS Section",
      "TDS Type",
      "TDS Percentage",
      "TDS Amount",
      "CA Comment",
      "Final Amount",
      "RO Verification",
      "RO Comment",
      "Payment Status",
      "Bill Date",
      "Mode of Payment",
      "Bill Link",
      "Receipt Link",
      "Created By"
    ];

    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n";

    filteredExpenses.forEach(expense => {
      // Get expense type name
      const expenseTypeObj = expenseTypes.find(
        (type) => type.expense_id === expense.expense_type
      );
      const expenseTypeName = expenseTypeObj ? expenseTypeObj.expense_name : "Unknown";

      const row = [
        expense.expense_id,
        expense.entry_date,
        expenseTypeName, // Use name, not ID
        expense.chapter_id,
        expense.vendor_name,
        expense.vendor_company,
        (expense.description || '').replace(/,/g, ';'),
        expense.amount,
        expense.gst_amount,
        expense.total_amount,
        expense.tds_section_list,
        expense.tds_type,
        expense.tds_percentage,
        expense.tds_amount,
        (expense.ca_comment || '').replace(/,/g, ';'),
        expense.final_amount || expense.total_amount,
        expense.verification ? "Approved" : (expense.ro_comment ? "Rejected" : "Pending"),
        (expense.ro_comment || '').replace(/,/g, ';'),
        expense.payment_status,
        expense.bill_date,
        expense.mode_of_payment,
        expense.upload_bill ? `${BILL_BASE_URL}/api/uploads/expenses/${expense.upload_bill.split('/').pop()}` : '',
        expense.upload_receipt ? `${BILL_BASE_URL}/api/uploads/expenses/${expense.upload_receipt.split('/').pop()}` : '',
        expense.created_by || ''
      ];
      csvContent += row.map(val => `"${val !== undefined ? val : ''}"`).join(",") + "\n";
    });

    // Download logic remains the same
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `expenses_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);

    Swal.fire({
      title: 'Exporting Data',
      html: 'Please wait while we prepare your export...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    setTimeout(() => {
      link.click();
      document.body.removeChild(link);
      Swal.fire({
        title: 'Export Successful!',
        text: 'Your expenses data has been exported successfully.',
        icon: 'success',
        confirmButtonText: 'OK',
        confirmButtonColor: '#1976D2'
      });
    }, 1000);

  } catch (error) {
    console.error('Error exporting data:', error);
    Swal.fire({
      title: 'Export Failed',
      text: 'There was an error exporting the data. Please try again.',
      icon: 'error',
      confirmButtonText: 'OK',
      confirmButtonColor: '#dc3545'
    });
  }
}

// Add event listener for the export button
document.addEventListener('DOMContentLoaded', function() {
  const exportButton = document.querySelector('.btn-danger.btn-wave');
  if (exportButton) {
    exportButton.addEventListener('click', function(e) {
      e.preventDefault();
      exportExpensesToExcel();
    });
  }
});

// Add event listener for chapter name click in the expenses table
// This should be placed after the table is rendered

document.addEventListener('click', async function(event) {
  // Check if a chapter name cell was clicked
  if (event.target && event.target.tagName === 'TD' && event.target.cellIndex === 3) {
    const chapterName = event.target.textContent.trim();
    if (!chapterName || chapterName === 'All Chapters') return;

    // Show loading SweetAlert immediately
    Swal.fire({
      title: `Current Balance for ${chapterName}`,
      html: '<div style="text-align:center;padding:2em 0;">Loading breakdown...</div>',
      showCloseButton: true,
      showConfirmButton: false,
      allowOutsideClick: false,
      width: '500px',
      didOpen: () => {
        Swal.showLoading();
      }
    });

    // Fetch all chapters to get chapter_id
    const chaptersResponse = await fetch("https://backend.bninewdelhi.com/api/chapters");
    const chapters = await chaptersResponse.json();
    const chapter = chapters.find(ch => ch.chapter_name === chapterName);
    if (!chapter) {
      Swal.fire('Error', 'Chapter not found', 'error');
      return;
    }
    const chapterId = chapter.chapter_id;

    // Fetch all orders, transactions, expenses, and other payments for this chapter
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

    // === MATCH chapterWiseLedger.js LOGIC EXACTLY ===
    let totalKittyAmount = 0;
    let totalVisitorAmount = 0;
    let cashKittyAmount = 0;
    let onlineKittyAmount = 0;
    let cashVisitorAmount = 0;
    let onlineVisitorAmount = 0;
    let cashOtherPayments = 0;
    let onlineOtherPayments = 0;
    let cashGSTAmount = 0;
    let totalExpenseBaseAmount = 0;
    let cashExpenseBaseAmount = 0;
    let onlineExpenseBaseAmount = 0;

    // 1. Kitty & Visitor Payments
    const chapterOrders = allOrders.filter(order => 
      parseInt(order.chapter_id) === chapterId && 
      (order.payment_note === "meeting-payments" || 
       order.payment_note === "visitor-payment" ||
       order.payment_note === "Visitor Payment")
    );
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
        if (isKittyPayment) {
          totalKittyAmount += amount;
          if (successfulTransaction.payment_method?.cash || paymentMethod.toLowerCase() === 'cash') {
            cashKittyAmount += amount;
            cashGSTAmount += gst;
          } else {
            onlineKittyAmount += amount;
          }
        } else if (isVisitorPayment) {
          totalVisitorAmount += amount;
          if (successfulTransaction.payment_method?.cash || paymentMethod.toLowerCase() === 'cash') {
            cashVisitorAmount += amount;
            cashGSTAmount += gst;
          } else {
            onlineVisitorAmount += amount;
          }
        }
      }
    });

    // 2. Expenses (base amount only)
    const chapterExpenses = allExpenses.filter(expense => 
      parseInt(expense.chapter_id) === chapterId && 
      expense.delete_status === 0 && 
      expense.payment_status === "paid"
    );
    chapterExpenses.forEach(expense => {
      const baseAmount = parseFloat(expense.amount) || 0;
      if (expense.mode_of_payment && expense.mode_of_payment.toLowerCase() === 'cash') {
        cashExpenseBaseAmount += baseAmount;
      } else {
        onlineExpenseBaseAmount += baseAmount;
      }
      totalExpenseBaseAmount += baseAmount;
    });

    // 3. Other Payments
    const chapterOtherPayments = allOtherPayments.filter(payment => 
      parseInt(payment.chapter_id) === chapterId
    );
    chapterOtherPayments.forEach(payment => {
      const baseAmount = parseFloat(payment.total_amount) - (payment.is_gst ? parseFloat(payment.gst_amount) : 0);
      const gstAmount = payment.is_gst ? parseFloat(payment.gst_amount) : 0;
      const totalAmount = parseFloat(payment.total_amount);
      totalKittyAmount += totalAmount;
      if (payment.mode_of_payment && payment.mode_of_payment.toLowerCase() === 'cash') {
        cashOtherPayments += totalAmount;
        cashGSTAmount += gstAmount;
      } else {
        onlineOtherPayments += totalAmount;
      }
    });

    // 4. Calculate totals for breakdown
    const opening_balance = parseFloat(chapter.available_fund) || 0;
    const totalCashReceipts = cashKittyAmount + cashVisitorAmount + cashOtherPayments;
    const totalOnlineReceipts = onlineKittyAmount + onlineVisitorAmount + onlineOtherPayments;
    const cashExpenses = cashExpenseBaseAmount;
    const onlineExpenses = onlineExpenseBaseAmount;
    const cashBalance = opening_balance + totalCashReceipts + cashGSTAmount - cashExpenses;
    const onlineBalance = totalOnlineReceipts - onlineExpenses - cashGSTAmount;

    // --- Restore previous total current balance calculation for the popup only ---
    // This matches: opening_balance + kittyAndVisitorTotal + otherPaymentsTotal - totalPaidExpense
    // Recalculate these values for the total only:
    let kittyAndVisitorTotal = 0;
    let otherPaymentsTotal = 0;
    let totalPaidExpense = 0;
    // Kitty & Visitor Payments (meeting-payments, visitor-payment, minus GST)
    chapterOrders.forEach(order => {
      const successfulTransaction = allTransactions.find(
        transaction => 
          transaction.order_id === order.order_id && 
          transaction.payment_status === "SUCCESS"
      );
      if (successfulTransaction) {
        const tax = parseFloat(order.tax) || 0;
        const netAmount = parseFloat(successfulTransaction.payment_amount) - tax;
        kittyAndVisitorTotal += netAmount;
      }
    });
    // Other Payments (minus GST if present)
    chapterOtherPayments.forEach(payment => {
      let baseAmount = parseFloat(payment.total_amount) || 0;
      if (payment.is_gst && payment.gst_amount) {
        baseAmount -= parseFloat(payment.gst_amount) || 0;
      }
      otherPaymentsTotal += baseAmount;
    });
    // Paid Expenses (base amount only)
    chapterExpenses.forEach(expense => {
      totalPaidExpense += parseFloat(expense.amount) || 0;
    });
    const currentBalance = opening_balance + kittyAndVisitorTotal + otherPaymentsTotal - totalPaidExpense;
    // --- End restore ---

    // 5. Prepare breakdown objects
    const cashBreakdown = {
      total: cashBalance,
      receipts: totalCashReceipts,
      expenses: cashExpenses
    };
    const onlineBreakdown = {
      total: onlineBalance,
      receipts: totalOnlineReceipts,
      expenses: onlineExpenses
    };

    showCurrentBalanceBreakdownPopup(
      currentBalance,
      cashBreakdown,
      onlineBreakdown,
      opening_balance,
      cashGSTAmount
    );
  }
});

// Add this function for the exact same SweetAlert2 breakdown popup as in chapterWiseLedger.js
function showCurrentBalanceBreakdownPopup(currentBalance, cashBreakdown, onlineBreakdown, availableFund, cashGST) {
  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amt);
  };
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

  // Add or update the CSS for .kitty-breakdown-popup to match the ledger design
  const styleId = 'kitty-breakdown-popup-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .kitty-breakdown-popup {
        font-family: inherit;
      }
      .kitty-breakdown-popup .swal2-title {
        color: #333;
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
      }
      .kitty-breakdown-popup .swal2-html-container {
        margin: 0;
        padding: 0;
      }
      .kitty-breakdown {
        padding: 1rem;
      }
      .breakdown-section {
        background-color: #f8f9fa;
        border-radius: 8px;
        padding: 1.5rem;
      }
      .breakdown-section h6 {
        color: #495057;
        font-weight: 600;
      }
      .breakdown-section .d-flex {
        padding: 0.5rem 0;
      }
      .breakdown-section hr {
        margin: 1rem 0;
        opacity: 0.1;
      }
      .breakdown-section i {
        color: #6c757d;
      }
      .breakdown-section .fw-bold {
        color: #212529;
      }
    `;
    document.head.appendChild(style);
  }

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
// Add CSS for chapter name hover effect in the expenses table
(function addChapterNameHoverStyle() {
  const styleId = 'chapter-name-hover-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #expensesTableBody td.chapter-name-cell {
        cursor: pointer;
        transition: background 0.2s;
      }
      #expensesTableBody td.chapter-name-cell:hover {
        background: #e6f0fa !important;
        color: #1976D2 !important;
      }
    `;
    document.head.appendChild(style);
  }
})();

// When rendering the expenses table, add the class 'chapter-name-cell' to the chapter name column (cellIndex 2)
const originalDisplayExpenses = displayExpenses;
displayExpenses = function(expenses) {
  originalDisplayExpenses.call(this, expenses);
  // Add the class to chapter name cells
  const tableBody = document.getElementById("expensesTableBody");
  if (tableBody) {
    Array.from(tableBody.rows).forEach(row => {
      if (row.cells[3]) { // Changed from 2 to 3
        row.cells[3].classList.add('chapter-name-cell');
      }
    });
  }
};

const handleEditTdsSubmit = async (expenseId, formData) => {
  try {
    // Debug logging for input parameters
    console.log('Edit TDS Submit - Input Parameters:', {
      expenseId,
      formData
    });

    // Get the button element for this expense
    const button = document.querySelector(`.view-tds-btn[data-expense-id="${expenseId}"]`);
    if (!button) {
      console.error('Button not found for expense ID:', expenseId);
      throw new Error('Could not find the expense button');
    }

    // Debug logging for button attributes
    console.log('Button Data Attributes:', {
      'data-amount': button.getAttribute('data-amount'),
      'data-gst-amount': button.getAttribute('data-gst-amount'),
      'data-tds-section': button.getAttribute('data-tds-section'),
      'data-tds-type': button.getAttribute('data-tds-type'),
      'data-tds-percentage': button.getAttribute('data-tds-percentage'),
      'data-ca-comment': button.getAttribute('data-ca-comment'),
      'data-final-amount': button.getAttribute('data-final-amount')
    });

    // Get and validate base amount
    const baseAmount = parseFloat(button.getAttribute('data-amount'));
    if (isNaN(baseAmount) || baseAmount <= 0) {
      // Try to get amount from the expense object in filteredExpenses
      const expense = filteredExpenses.find(e => e.expense_id === expenseId);
      if (expense && expense.amount) {
        baseAmount = parseFloat(expense.amount);
      } else {
        console.error('Invalid base amount:', baseAmount);
        throw new Error('Invalid base amount');
      }
    }

    // Get and validate GST amount
    let gstAmount = parseFloat(button.getAttribute('data-gst-amount')) || 0;
    if (isNaN(gstAmount) || gstAmount < 0) {
      // Try to get GST amount from the expense object
      const expense = filteredExpenses.find(e => e.expense_id === expenseId);
      if (expense && expense.gst_amount) {
        gstAmount = parseFloat(expense.gst_amount);
      } else {
        gstAmount = 0;
      }
    }

    // Validate form data
    if (!formData.tdsPercentage || !formData.tdsSection || !formData.tdsType) {
      console.error('Missing required form data:', formData);
      throw new Error('Missing required TDS information');
    }

    // Calculate TDS amount and final amount
    const tdsAmount = (baseAmount * parseFloat(formData.tdsPercentage)) / 100;
    const finalAmount = Math.round(baseAmount - tdsAmount + gstAmount);

    // Debug logging for calculations
    console.log('TDS Calculations:', {
      baseAmount,
      gstAmount,
      tdsPercentage: formData.tdsPercentage,
      tdsAmount,
      finalAmount
    });

    const requestData = {
      expense_id: expenseId,
      tds_percentage: formData.tdsPercentage,
      tds_amount: tdsAmount,
      tds_process: true,
      ca_comment: formData.comment || '',
      final_amount: finalAmount,
      tds_section_list: formData.tdsSection,
      tds_type: formData.tdsType
    };

    // Debug logging for request data
    console.log('Request Data to be sent:', requestData);

    // Show confirmation dialog with calculated values
    const confirmResult = await Swal.fire({
      title: 'Confirm TDS Update',
      html: `
        <div style="text-align: left; padding: 15px; background: #f8f9fa; border-radius: 8px;">
          <div style="margin-bottom: 10px;">
            <strong>Base Amount:</strong> ₹${baseAmount.toLocaleString('en-IN')}
          </div>
          <div style="margin-bottom: 10px;">
            <strong>TDS Amount:</strong> ₹${tdsAmount.toLocaleString('en-IN')}
          </div>
          <div style="margin-bottom: 10px;">
            <strong>GST Amount:</strong> ₹${gstAmount.toLocaleString('en-IN')}
          </div>
          <div style="margin-bottom: 10px;">
            <strong>Final Amount:</strong> ₹${finalAmount.toLocaleString('en-IN')}
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Confirm Update',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#1976D2',
      cancelButtonColor: '#dc3545'
    });

    if (confirmResult.isConfirmed) {
      const response = await fetch('https://backend.bninewdelhi.com/api/tdsUpdateexpense', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();
      console.log('API Response:', data);

      if (data.success) {
        await Swal.fire({
          title: "Success!",
          text: "TDS details updated successfully",
          icon: "success",
          confirmButtonText: "OK"
        });
        // Refresh the expenses list
        await fetchExpenses();
      } else {
        throw new Error(data.message || "Failed to update TDS details");
      }
    }

  } catch (error) {
    console.error('Error in TDS calculations:', error);
    await Swal.fire({
      title: "Error!",
      text: error.message || "Failed to update TDS details",
      icon: "error",
      confirmButtonText: "OK"
    });
  }
};

// Function to view vendor ledger
const viewVendorLedger = async (vendorId) => {
  try {
    showLoader();
    
    // If vendors are not loaded, fetch them first
    if (allVendors.length === 0) {
      await fetchVendors();
    }
    
    // Find vendor details
    const vendor = allVendors.find(v => v.vendor_id === parseInt(vendorId));
    if (!vendor) throw new Error('Vendor not found');

    // Fetch vendor's expenses
    const response = await fetch(`https://backend.bninewdelhi.com/api/allExpenses`);
    if (!response.ok) throw new Error('Failed to fetch expenses');
    const allExpenses = await response.json();

    // Filter expenses for this vendor
    const vendorExpenses = allExpenses.filter(expense => expense.vendor_id === parseInt(vendorId));

    // Sort expenses by date in descending order (latest first)
    vendorExpenses.sort((a, b) => new Date(b.bill_date) - new Date(a.bill_date));

    // Update modal with vendor information
    document.querySelector('.vendor-name').textContent = vendor.vendor_name;
    document.querySelector('.vendor-company').textContent = vendor.vendor_company_name;
    document.querySelector('.vendor-contact').textContent = `${vendor.phone_number} | ${vendor.email_id}`;

    // Calculate totals
    const totalAmount = vendorExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    const paidAmount = vendorExpenses
      .filter(expense => expense.payment_status === 'paid')
      .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    const balanceAmount = totalAmount - paidAmount;

    // Update summary amounts
    document.querySelector('.total-amount').textContent = formatCurrency(totalAmount);
    document.querySelector('.paid-amount').textContent = formatCurrency(paidAmount);
    document.querySelector('.balance-amount').textContent = formatCurrency(balanceAmount);

    // Get last expense date
    const lastExpense = vendorExpenses.length > 0 
    ? formatDate(vendorExpenses[0].bill_date)
    : 'No expenses';
  document.querySelector('.last-expense-date').textContent = lastExpense;

    // Populate expense history table
    const tableBody = document.querySelector('#vendorLedgerTableBody');
    tableBody.innerHTML = '';

    if (vendorExpenses.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-4" style="color: #7f8c8d;">
            No expenses found for this vendor
          </td>
        </tr>
      `;
    } else {
      vendorExpenses.forEach(expense => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td style="padding: 1rem;">${formatDate(expense.bill_date)}</td>
          <td style="padding: 1rem;">${expense.description || expense.expense_type}</td>
          <td style="padding: 1rem;">${formatCurrency(expense.amount)}</td>
          <td style="padding: 1rem;">${expense.withGST ? `${expense.gstPercentage}% (${formatCurrency(expense.gstAmount)})` : 'N/A'}</td>
          <td style="padding: 1rem;">${formatCurrency(expense.totalAmount || expense.amount)}</td>
          <td style="padding: 1rem;">
            <span class="badge ${expense.payment_status === 'paid' ? 'bg-success' : 'bg-warning'}" 
                  style="padding: 0.5rem 1rem; border-radius: 6px;">
              ${expense.payment_status.toUpperCase()}
            </span>
          </td>
          <td style="padding: 1rem;">
             <button class="btn btn-sm" 
                    onclick="window.open('${BILL_BASE_URL}/api/uploads/expenses/${expense.upload_bill}', '_blank')"
                    style="background: linear-gradient(135deg, #4b6cb7 0%, #182848 100%); color: white; border: none; padding: 0.5rem 1rem; border-radius: 6px;">
              View Bill
            </button>
          </td>
        `;
        tableBody.appendChild(row);
      });
    }

    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('vendorLedgerModal'));
    modal.show();

  } catch (error) {
    console.error('Error viewing vendor ledger:', error);
    Swal.fire('Error!', 'Failed to load vendor ledger', 'error');
  } finally {
    hideLoader();
  }
};

// Function to export vendor ledger
const exportVendorLedger = async () => {
  try {
    // Implementation for exporting ledger to Excel/PDF
    // This can be added later based on requirements
    Swal.fire('Coming Soon!', 'Export functionality will be available soon.', 'info');
  } catch (error) {
    console.error('Error exporting ledger:', error);
    Swal.fire('Error!', 'Failed to export ledger', 'error');
  }
};

// Add this HTML structure for the vendor ledger modal
document.body.insertAdjacentHTML('beforeend', `
  <div class="modal fade" id="vendorLedgerModal" tabindex="-1" aria-labelledby="vendorLedgerModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-xl">
      <div class="modal-content" style="border: none; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
        <div class="modal-header" style="background: linear-gradient(135deg, #4b6cb7 0%, #182848 100%); color: white; border-radius: 15px 15px 0 0; padding: 1.5rem;">
          <h5 class="modal-title" id="vendorLedgerModalLabel" style="font-weight: 600; font-size: 1.4rem;">Vendor Ledger</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body" style="padding: 2rem;">
          <div class="row mb-4">
            <div class="col-md-4">
              <div class="card" style="border: none; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); background: linear-gradient(135deg, #f6f9fc 0%, #eef2f7 100%);">
                <div class="card-body" style="padding: 1.5rem;">
                  <h6 class="card-title" style="color: #2c3e50; font-weight: 600; margin-bottom: 1.2rem; font-size: 1.1rem;">Vendor Details</h6>
                  <p class="vendor-name mb-2" style="color: #34495e; font-weight: 500;"></p>
                  <p class="vendor-company mb-2" style="color: #7f8c8d;"></p>
                  <p class="vendor-contact mb-0" style="color: #7f8c8d;"></p>
                </div>
              </div>
            </div>
            <div class="col-md-8">
              <div class="card" style="border: none; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); background: linear-gradient(135deg, #f6f9fc 0%, #eef2f7 100%);">
                <div class="card-body" style="padding: 1.5rem;">
                  <h6 class="card-title" style="color: #2c3e50; font-weight: 600; margin-bottom: 1.2rem; font-size: 1.1rem;">Summary</h6>
                  <div class="row">
                    <div class="col-md-3">
                      <div class="summary-item" style="text-align: center; padding: 1rem; background: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <h6 style="color: #7f8c8d; font-size: 0.9rem; margin-bottom: 0.5rem;">Total Amount</h6>
                        <p class="total-amount mb-0" style="color: #2c3e50; font-weight: 600; font-size: 1.2rem;"></p>
                      </div>
                    </div>
                    <div class="col-md-3">
                      <div class="summary-item" style="text-align: center; padding: 1rem; background: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <h6 style="color: #7f8c8d; font-size: 0.9rem; margin-bottom: 0.5rem;">Paid Amount</h6>
                        <p class="paid-amount mb-0" style="color: #27ae60; font-weight: 600; font-size: 1.2rem;"></p>
                      </div>
                    </div>
                    <div class="col-md-3">
                      <div class="summary-item" style="text-align: center; padding: 1rem; background: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <h6 style="color: #7f8c8d; font-size: 0.9rem; margin-bottom: 0.5rem;">Balance</h6>
                        <p class="balance-amount mb-0" style="color: #e74c3c; font-weight: 600; font-size: 1.2rem;"></p>
                      </div>
                    </div>
                    <div class="col-md-3">
                      <div class="summary-item" style="text-align: center; padding: 1rem; background: white; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                        <h6 style="color: #7f8c8d; font-size: 0.9rem; margin-bottom: 0.5rem;">Last Expense</h6>
                        <p class="last-expense-date mb-0" style="color: #2c3e50; font-weight: 600; font-size: 1.2rem;"></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="table-responsive" style="background: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <table class="table table-hover mb-0" style="margin-bottom: 0 !important;">
              <thead style="background: linear-gradient(135deg, #f6f9fc 0%, #eef2f7 100%);">
                <tr>
                  <th style="padding: 1rem; color: #2c3e50; font-weight: 600;">Date</th>
                  <th style="padding: 1rem; color: #2c3e50; font-weight: 600;">Description</th>
                  <th style="padding: 1rem; color: #2c3e50; font-weight: 600;">Amount</th>
                  <th style="padding: 1rem; color: #2c3e50; font-weight: 600;">GST</th>
                  <th style="padding: 1rem; color: #2c3e50; font-weight: 600;">Total</th>
                  <th style="padding: 1rem; color: #2c3e50; font-weight: 600;">Status</th>
                  <th style="padding: 1rem; color: #2c3e50; font-weight: 600;">Bill</th>
                </tr>
              </thead>
              <tbody id="vendorLedgerTableBody">
                <!-- Ledger entries will be populated here -->
              </tbody>
            </table>
          </div>
        </div>
        <div class="modal-footer" style="background: #f8f9fa; border-radius: 0 0 15px 15px; padding: 1.5rem;">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" style="background: #95a5a6; border: none; padding: 0.5rem 1.5rem; border-radius: 8px;">Close</button>
          <button type="button" class="btn btn-primary" onclick="exportVendorLedger()" style="background: linear-gradient(135deg, #4b6cb7 0%, #182848 100%); border: none; padding: 0.5rem 1.5rem; border-radius: 8px;">Export</button>
        </div>
      </div>
    </div>
  </div>
`);

// Function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

// Function to format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const fetchHotelDetails = async (hotelId) => {
  try {
    const response = await fetch('https://backend.bninewdelhi.com/api/gethotels');
    const hotels = await response.json();
    const hotel = hotels.find(h => h.hotel_id === hotelId);
    return hotel ? hotel.hotel_name : 'Hotel not found';
  } catch (error) {
    console.error('Error fetching hotel details:', error);
    return 'Hotel not found';
  }
};

// Function to view hotel ledger
async function viewHotelLedger(hotelId) {
  try {
    showLoader();
    
    // Find hotel details
    const response = await fetch('https://backend.bninewdelhi.com/api/gethotels');
    const hotels = await response.json();
    const hotel = hotels.find(h => h.hotel_id === parseInt(hotelId));
    if (!hotel) throw new Error('Hotel not found');

    // Fetch chapters data
    const chaptersResponse = await fetch('https://backend.bninewdelhi.com/api/chapters');
    if (!chaptersResponse.ok) throw new Error('Failed to fetch chapters');
    const chapters = await chaptersResponse.json();
    
    // Create a map of chapter_id to chapter_name for quick lookup
    const chapterMap = new Map(chapters.map(chapter => [chapter.chapter_id, chapter.chapter_name]));

    // Fetch all expenses
    const expensesResponse = await fetch(`https://backend.bninewdelhi.com/api/allExpenses`);
    if (!expensesResponse.ok) throw new Error('Failed to fetch expenses');
    const allExpenses = await expensesResponse.json();

    // Filter expenses for this hotel
    const hotelExpenses = allExpenses.filter(expense => expense.hotel_id === parseInt(hotelId));

    // Sort expenses by date in descending order (latest first)
    hotelExpenses.sort((a, b) => new Date(b.bill_date) - new Date(a.bill_date));

    // Create and show modal
    const modalHtml = `
      <div class="modal fade" id="hotelLedgerModal" tabindex="-1" aria-labelledby="hotelLedgerModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-xl">
          <div class="modal-content" style="border: none; border-radius: 15px; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
            <div class="modal-header" style="background: linear-gradient(135deg, #dc143c, #8b0000); border-radius: 15px 15px 0 0; padding: 1.5rem;">
              <h5 class="modal-title" id="hotelLedgerModalLabel" style="color: white; font-weight: 600; font-size: 1.5rem;">Hotel Ledger</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body" style="padding: 2rem;">
              <div class="hotel-info mb-4" style="background: linear-gradient(135deg, #fff5f5, #ffe5e5); padding: 1.5rem; border-radius: 10px; box-shadow: 0 2px 10px rgba(220,20,60,0.1);">
                <h4 class="hotel-name" style="color: #dc143c; font-weight: 600; margin-bottom: 0.5rem;">${hotel.hotel_name}</h4>
                <p class="hotel-address" style="color: #666; margin-bottom: 0.5rem;"><i class="fas fa-map-marker-alt me-2"></i>${hotel.hotel_address}</p>
                <p class="hotel-contact" style="color: #666;"><i class="fas fa-phone me-2"></i>${hotel.hotel_phone || 'N/A'} | <i class="fas fa-envelope me-2"></i>${hotel.hotel_email || 'N/A'}</p>
              </div>
              
              <div class="row mb-4">
                <div class="col-md-6">
                  <div class="card" style="border: none; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); transition: transform 0.2s;">
                    <div class="card-body" style="background: linear-gradient(135deg, #fff, #fff5f5);">
                      <h6 class="card-title" style="color: #dc143c; font-weight: 600;">Total Expenses</h6>
                      <p class="total-expenses" style="font-size: 1.5rem; font-weight: 600; color: #333; margin: 0;">
                        <span class="amount">${formatCurrency(hotelExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0))}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="card" style="border: none; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); transition: transform 0.2s;">
                    <div class="card-body" style="background: linear-gradient(135deg, #fff, #fff5f5);">
                      <h6 class="card-title" style="color: #dc143c; font-weight: 600;">Last Expense</h6>
                      <p class="last-expense" style="font-size: 1.5rem; font-weight: 600; color: #333; margin: 0;">
                        <span class="date">${hotelExpenses.length > 0 ? formatDate(hotelExpenses[0].bill_date) : 'No expenses'}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div id="noExpensesMessage" style="display: none;" class="alert alert-info" style="background: linear-gradient(135deg, #e3f2fd, #bbdefb); border: none; border-radius: 10px;">
                <i class="fas fa-info-circle me-2"></i> No expenses found for this hotel.
              </div>

              <div class="table-responsive">
                <table id="hotelLedgerTable" class="table table-hover" style="border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
                     <thead style="background: linear-gradient(135deg, #dc143c, #8b0000); color: white !important;">

      <tr>
        <th style="padding: 12px 16px; min-width: 120px; font-weight: 600; font-size: 14px; cursor: pointer;" onclick="sortHotelLedgerTable('bill_date')">
          Date <i class="fas fa-sort" style="color: #ffd700;"></i>
        </th>
        <th style="padding: 12px 16px; font-weight: 600; font-size: 14px; cursor: pointer;" onclick="sortHotelLedgerTable('expense_type')">
          Expense Type <i class="fas fa-sort" style="color: #ffd700;"></i>
        </th>
        <th style="padding: 12px 16px; font-weight: 600; font-size: 14px; cursor: pointer;" onclick="sortHotelLedgerTable('description')">
          Description <i class="fas fa-sort" style="color: #ffd700;"></i>
        </th>
        <th style="padding: 12px 16px; font-weight: 600; font-size: 14px; cursor: pointer;" onclick="sortHotelLedgerTable('amount')">
          Amount <i class="fas fa-sort" style="color: #ffd700;"></i>
        </th>
        <th style="padding: 12px 16px; font-weight: 600; font-size: 14px; cursor: pointer;" onclick="sortHotelLedgerTable('gst')">
          GST <i class="fas fa-sort" style="color: #ffd700;"></i>
        </th>
        <th style="padding: 12px 16px; font-weight: 600; font-size: 14px; cursor: pointer;" onclick="sortHotelLedgerTable('totalAmount')">
          Total Amount <i class="fas fa-sort" style="color: #ffd700;"></i>
        </th>
        <th style="padding: 12px 16px; font-weight: 600; font-size: 14px; cursor: pointer;" onclick="sortHotelLedgerTable('chapter')">
          Chapter <i class="fas fa-sort" style="color: #ffd700;"></i>
        </th>
        <th style="padding: 12px 16px; font-weight: 600; font-size: 14px; cursor: pointer;" onclick="sortHotelLedgerTable('payment_status')">
          Status <i class="fas fa-sort" style="color: #ffd700;"></i>
        </th>
        <th style="padding: 12px 16px; font-weight: 600; font-size: 14px;">
          Bill
        </th>
      </tr>
    </thead>

                  <tbody>
                    ${hotelExpenses.map(expense => `
                      <tr style="transition: background-color 0.2s;">
                        <td style="padding: 1rem;">${formatDate(expense.bill_date)}</td>
                        <td style="padding: 1rem;">${expense.expense_type}</td>
                        <td style="padding: 1rem;">${expense.description}</td>
                        <td style="padding: 1rem; font-weight: 500;">${formatCurrency(expense.amount)}</td>
                        <td style="padding: 1rem;">${expense.gst_percentage ? `${expense.gst_percentage}% (${formatCurrency(expense.gst_amount)})` : 'N/A'}</td>
                        <td style="padding: 1rem; font-weight: 600; color: #dc143c;">${formatCurrency(expense.total_amount || expense.amount)}</td>
                        <td style="padding: 1rem;">${chapterMap.get(expense.chapter_id) || 'N/A'}</td>
                        <td style="padding: 1rem;">
                          <span class="payment-status-badge payment-status-${expense.payment_status}" 
                                style="padding: 0.5rem 1rem; border-radius: 20px; font-size: 0.85rem; font-weight: 500;">
                            ${expense.payment_status.toUpperCase()}
                          </span>
                        </td>
                        <td style="padding: 1rem;">
                          <button class="btn btn-sm view-bill-btn" 
                                  onclick="window.open('${BILL_BASE_URL}/api/uploads/expenses/${expense.upload_bill}', '_blank')"
                                  style="background: linear-gradient(135deg, #dc143c, #8b0000); color: white; border: none; padding: 0.5rem 1rem; border-radius: 5px; transition: transform 0.2s;">
                            <i class="fas fa-file-invoice me-1"></i> View Bill
                          </button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
            <div class="modal-footer" style="background: #f8f9fa; border-radius: 0 0 15px 15px; padding: 1rem 2rem;">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" 
                      style="background: #6c757d; border: none; padding: 0.5rem 1.5rem; border-radius: 5px; transition: background-color 0.2s;">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remove existing modal if any
    const existingModal = document.getElementById('hotelLedgerModal');
    if (existingModal) {
      existingModal.remove();
    }

    // Add new modal to body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Show/hide table based on expenses
    if (hotelExpenses.length === 0) {
      document.getElementById('hotelLedgerTable').style.display = 'none';
      document.getElementById('noExpensesMessage').style.display = 'block';
    } else {
      document.getElementById('hotelLedgerTable').style.display = 'table';
      document.getElementById('noExpensesMessage').style.display = 'none';
    }

    // Add hover effects
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
      card.addEventListener('mouseover', () => {
        card.style.transform = 'translateY(-5px)';
      });
      card.addEventListener('mouseout', () => {
        card.style.transform = 'translateY(0)';
      });
    });

    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('hotelLedgerModal'));
    modal.show();

  } catch (error) {
    console.error('Error viewing hotel ledger:', error);
    Swal.fire('Error!', 'Failed to load hotel ledger', 'error');
  } finally {
    hideLoader();
  }
}

// Add click event listener for hotel names
document.addEventListener('click', function(event) {
  const hotelNameElement = event.target.closest('.hotel-name');
  if (hotelNameElement && hotelNameElement.dataset.hotelId) {
    viewHotelLedger(hotelNameElement.dataset.hotelId);
  }
});

// Add these functions at the end of the file
let currentHotelSortColumn = 'bill_date';
let currentHotelSortDirection = 'desc';

function sortHotelLedgerTable(column) {
  const table = document.getElementById('hotelLedgerTable');
  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  
  // Update sort direction
  if (currentHotelSortColumn === column) {
    currentHotelSortDirection = currentHotelSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    currentHotelSortColumn = column;
    currentHotelSortDirection = 'desc';
  }

  // Update sort icons
  const headers = table.querySelectorAll('th');
  headers.forEach(header => {
    const icon = header.querySelector('i');
    if (icon) {
      icon.className = 'fas fa-sort';
    }
  });

  const activeHeader = table.querySelector(`th[onclick="sortHotelLedgerTable('${column}')"]`);
  const activeIcon = activeHeader.querySelector('i');
  activeIcon.className = `fas fa-sort-${currentHotelSortDirection === 'asc' ? 'up' : 'down'}`;

  // Sort the rows
  rows.sort((a, b) => {
    let aValue = a.querySelector(`td:nth-child(${getColumnIndex(column)})`).textContent;
    let bValue = b.querySelector(`td:nth-child(${getColumnIndex(column)})`).textContent;

    // Handle numeric values
    if (column === 'amount' || column === 'totalAmount') {
      aValue = parseFloat(aValue.replace(/[^0-9.-]+/g, ''));
      bValue = parseFloat(bValue.replace(/[^0-9.-]+/g, ''));
    }
    // Handle date values
    else if (column === 'bill_date') {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }

    if (currentHotelSortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Reorder the rows
  rows.forEach(row => tbody.appendChild(row));
}

function getColumnIndex(column) {
  const columnMap = {
    'bill_date': 1,
    'expense_type': 2,
    'description': 3,
    'amount': 4,
    'gst': 5,
    'totalAmount': 6,
    'chapter': 7,
    'payment_status': 8
  };
  return columnMap[column];
}