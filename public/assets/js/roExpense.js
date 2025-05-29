// let apiUrl = "http://localhost:5000/api/allExpenses"; // API for expenses
let allExpenses = []; // To store fetched expenses globally
let filteredExpenses = []; // To store filtered expenses based on search
let expenseTypes = []; // Store expense types mapping
let allChapters = []; // Store all chapters

// Define base URL at the top of your file
const BILL_BASE_URL = 'https://backend.bninewdelhi.com';

// Add sorting state tracking
let currentSortColumn = null;
let currentSortDirection = 'asc';

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
  
  // Update display with filtered expenses
  displayExpenses(filteredExpenses);
  
  // Update expense totals for filtered expenses
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
const fetchExpenses = async (sortDirection = 'asc') => {
  try {
    showLoader();
    
    // Get user email from token
    const userEmail = getUserEmail();
    console.log('Current user email:', userEmail);

    // First fetch chapters to get the user's chapter_id
    const chaptersResponse = await fetch("http://localhost:5000/api/chapters");
    const chapters = await chaptersResponse.json();
    console.log('All chapters:', chapters);
    
    // Store chapters globally
    allChapters = chapters;
    
    // Populate chapter filter dropdown
    await populateChapterFilter();

    // Find user's chapter based on email
    const userChapter = chapters.find(chapter =>
      chapter.email_id === userEmail ||
      chapter.vice_president_mail === userEmail ||
      chapter.president_mail === userEmail ||
      chapter.treasurer_mail === userEmail
    );
  
    console.log('Found user chapter:', userChapter);
    
    if (!userChapter && getUserLoginType() !== 'ro_admin') {
      console.log('No matching chapter found for user email');
      hideLoader();
      return;
    }

    // Fetch expense types for mapping
    const expenseTypesResponse = await fetch(
      "http://localhost:5000/api/expenseType"
    );
    if (!expenseTypesResponse.ok) {
      throw new Error("Failed to fetch expense types");
    }
    expenseTypes = await expenseTypesResponse.json();
    console.log('Expense types:', expenseTypes);

    // Fetch all expenses
    const response = await fetch("http://localhost:5000/api/allExpenses");
    if (!response.ok) throw new Error("Network response was not ok");

    const allExpensesData = await response.json();
    console.log('All expenses:', allExpensesData);

    // Filter expenses based on user type and chapter
    if (getUserLoginType() === 'ro_admin') {
      console.log('User is RO Admin - showing all expenses');
      allExpenses = allExpensesData;
    } else {
      console.log('Filtering expenses for chapter_id:', userChapter.chapter_id);
      allExpenses = allExpensesData.filter(expense => 
        expense.chapter_id === userChapter.chapter_id
      );
      console.log('Filtered expenses for chapter:', allExpenses);
    }

    // Replace chapter_id with chapter_name
    allExpenses.forEach(expense => {
      const matchedChapter = chapters.find(chapter => chapter.chapter_id === expense.chapter_id);
      if (matchedChapter) {
        expense.chapter_id = matchedChapter.chapter_name;
      }
    });

    filteredExpenses = [...allExpenses];
    console.log('Initial filtered expenses:', filteredExpenses);

    // Sort expenses
    sortExpenses(sortDirection);
    
    // Display all expenses
    displayExpenses(filteredExpenses);

    // Update the expense totals
    updateExpenseTotals(allExpenses);
    console.log('Updated expense totals');

  } catch (error) {
    console.error("Error in fetchExpenses:", error);
  } finally {
    hideLoader();
  }
};

// Sort expenses based on the selected filter
const sortExpenses = (filter) => {
  console.log("=== Sort Debug Start ===");
  console.log("Sort direction:", filter);

  const expenseNameMap = new Map(
    expenseTypes.map(type => {
      console.log(`Mapping expense_id ${type.expense_id} to name ${type.expense_name}`);
      return [type.expense_id, type.expense_name];
    })
  );

  filteredExpenses.sort((a, b) => {
    const expenseNameA = expenseNameMap.get(a.expense_type) || '';
    const expenseNameB = expenseNameMap.get(b.expense_type) || '';
    
    if (filter === "asc") {
      return expenseNameA.toLowerCase().localeCompare(expenseNameB.toLowerCase());
    } else {
      return expenseNameB.toLowerCase().localeCompare(expenseNameA.toLowerCase());
    }
  });

  // Update the display after sorting
  displayExpenses(filteredExpenses);
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
        const response = await fetch(`http://localhost:5000/api/expenseType`, {
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
function displayExpenses(expenses) {
  console.log('Displaying expenses:', expenses);
  const tableBody = document.getElementById("expensesTableBody");
  tableBody.innerHTML = "";

  if (expenses.length === 0) {
    console.log('No expenses to display');
    const row = document.createElement("tr");
    row.innerHTML = `
      <td colspan="11" class="text-center">No expenses found</td>
    `;
    tableBody.appendChild(row);
    return;
  }

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

    // Get just the filename from upload_bill (remove any path if present)
    const filename = expense.upload_bill ? expense.upload_bill.split('/').pop() : null;
    
    // Construct the bill URL
    const billUrl = filename ? `${BILL_BASE_URL}/api/uploads/expenses/${filename}` : '#';
    
    // Get receipt filename and construct receipt URL
    const receiptFilename = expense.upload_receipt ? expense.upload_receipt.split('/').pop() : null;
    const receiptUrl = receiptFilename ? `${BILL_BASE_URL}/api/uploads/expenses/${receiptFilename}` : '#';
    
    console.log('Document Details:', {
      originalUploadBill: expense.upload_bill,
      extractedBillFilename: filename,
      constructedBillUrl: billUrl,
      originalUploadReceipt: expense.upload_receipt,
      extractedReceiptFilename: receiptFilename,
      constructedReceiptUrl: receiptUrl
    });

    row.innerHTML = `
      <td>${index + 1}</td>
      <td style="border: 1px solid grey;"><b>${expenseName}</b></td>
      <td style="border: 1px solid grey;"><b>${expense.chapter_id}</b></td>
      
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
                  data-gst-amount="${expense.gst_amount}"
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
        <a href="/rexp/edit-expense/?expense_id=${expense.expense_id}" class="badge" style="background-color: #10b981; color: #ffffff; text-shadow: 1px 1px 1px rgba(0,0,0,0.3); transition: all 0.3s ease; hover: {opacity: 0.9};">Edit Bill</a>
        <span class="badge bg-danger delete-btn" style="cursor:pointer; color: #ffffff; text-shadow: 1px 1px 1px rgba(0,0,0,0.5); font-weight: bold;" data-expense-id="${expense.expense_id}">Delete</span>
      </td>
    `;
    tableBody.appendChild(row);
  });

  // Update total expenses count
  document.getElementById('totalExpensesCount').textContent = expenses.length;
}

// Event listener for Delete button
document
  .getElementById("expensesTableBody")
  .addEventListener("click", (event) => {
    if (event.target.classList.contains("delete-btn")) {
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
        `http://localhost:5000/api/expense/${expense_id}`,
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
  await fetchExpenses("asc");
  
  // Set initial button text
  const button = document.getElementById("sortButton");
  button.textContent = "↑ (A-Z)";
  button.setAttribute("data-sort", "asc");
});

// Function to handle column sorting
const sortByColumn = (columnName) => {
  console.log(`Sorting by column: ${columnName}`);
  
  // Toggle sort direction if clicking the same column
  if (currentSortColumn === columnName) {
    currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    currentSortColumn = columnName;
    currentSortDirection = 'asc';
  }

  // Update sort icons
  updateSortIcons(columnName);

  // Sort the expenses
  filteredExpenses.sort((a, b) => {
    let valueA, valueB;

    switch (columnName) {
      case 'expense_type':
        const expenseNameA = expenseTypes.find(type => type.expense_id === a.expense_type)?.expense_name || '';
        const expenseNameB = expenseTypes.find(type => type.expense_id === b.expense_type)?.expense_name || '';
        valueA = expenseNameA.toLowerCase();
        valueB = expenseNameB.toLowerCase();
        break;
      case 'chapter_id':
        valueA = a.chapter_id.toLowerCase();
        valueB = b.chapter_id.toLowerCase();
        break;
      case 'description':
        valueA = a.description.toLowerCase();
        valueB = b.description.toLowerCase();
        break;
      case 'amount':
        valueA = parseFloat(a.amount);
        valueB = parseFloat(b.amount);
        break;
      case 'gst_amount':
        valueA = parseFloat(a.gst_amount || 0);
        valueB = parseFloat(b.gst_amount || 0);
        break;
      case 'total_amount':
        valueA = parseFloat(a.total_amount || 0);
        valueB = parseFloat(b.total_amount || 0);
        break;
      case 'tds_details':
        // Sort TDS details based on section and process status
        valueA = a.tds_process ? (a.tds_section_list || 'NA') : 'No TDS';
        valueB = b.tds_process ? (b.tds_section_list || 'NA') : 'No TDS';
        break;
      case 'ro_verification':
        // Sort RO verification based on status
        valueA = a.verification ? 'Approved' : (a.ro_comment ? 'Rejected' : 'Pending');
        valueB = b.verification ? 'Approved' : (b.ro_comment ? 'Rejected' : 'Pending');
        break;
      case 'final_payable':
        valueA = parseFloat(a.final_amount || a.total_amount || 0);
        valueB = parseFloat(b.final_amount || b.total_amount || 0);
        break;
      case 'payment_status':
        valueA = a.payment_status.toLowerCase();
        valueB = b.payment_status.toLowerCase();
        break;
      case 'bill_date':
        valueA = new Date(a.bill_date);
        valueB = new Date(b.bill_date);
        break;
      case 'mode_of_payment':
        valueA = (a.mode_of_payment || 'N/A').toLowerCase();
        valueB = (b.mode_of_payment || 'N/A').toLowerCase();
        break;
      default:
        return 0;
    }

    if (currentSortDirection === 'asc') {
      return valueA > valueB ? 1 : -1;
    } else {
      return valueA < valueB ? 1 : -1;
    }
  });

  // Update the display
  displayExpenses(filteredExpenses);
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
      // Handle "No TDS" case
      const requestData = {
        expense_id: expenseId,
        tds_percentage: "0",
        tds_amount: "0",
        tds_process: true,
        ca_comment: "No TDS Applicable",
        final_amount: button.getAttribute('data-amount'),
        tds_section_list: "NA",
        tds_type: "NA"
      };

      try {
        const response = await fetch('http://localhost:5000/api/tdsUpdateexpense', {
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
      
      
      const response = await fetch('http://localhost:5000/api/tdsUpdateexpense', {
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
        fetch('http://localhost:5000/api/tdsUpdateexpense', {
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
      const response = await fetch('http://localhost:5000/api/tdsUpdateexpense', {
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
    // Get the table data
    const table = document.querySelector('.table');
    const rows = table.querySelectorAll('tbody tr');
    
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Add headers
    const headers = [
      "S.No.",
      "Expense Type",
      "Chapter Name",
      "Description",
      "Amount",
      "GST Amount",
      "Total Amount",
      "TDS Details",
      "RO Verification",
      "Final Payable Amount",
      "Payment Status",
      "Bill Date",
      "Mode of Payment",
      "Bill Link",
      "Receipt Link"
    ];
    csvContent += headers.join(",") + "\n";
    
    // Add rows
    rows.forEach((row, index) => {
      const cells = row.querySelectorAll('td');
      const rowData = [];
      
      cells.forEach((cell, cellIndex) => {
        // Skip the last cell (Actions column)
        if (cellIndex < cells.length - 1) {
          let cellText = cell.textContent.trim();
          
          // Handle special cases
          if (cellIndex === 13) { // Bill Link column
            const billLink = cell.querySelector('a')?.href || 'No bill uploaded';
            cellText = billLink;
          } else if (cellIndex === 14) { // Receipt Link column
            const receiptLink = cell.querySelector('a')?.href || 'No receipt uploaded';
            cellText = receiptLink;
          }
          
          // Clean the text and handle commas
          cellText = cellText.replace(/,/g, ';').replace(/\n/g, ' ');
          rowData.push(`"${cellText}"`);
        }
      });
      
      csvContent += rowData.join(",") + "\n";
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `expenses_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    
    // Show loading state
    Swal.fire({
      title: 'Exporting Data',
      html: 'Please wait while we prepare your export...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    
    // Trigger download after a short delay
    setTimeout(() => {
      link.click();
      document.body.removeChild(link);
      
      // Show success message
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
  if (event.target && event.target.tagName === 'TD' && event.target.cellIndex === 2) {
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
    const chaptersResponse = await fetch("http://localhost:5000/api/chapters");
    const chapters = await chaptersResponse.json();
    const chapter = chapters.find(ch => ch.chapter_name === chapterName);
    if (!chapter) {
      Swal.fire('Error', 'Chapter not found', 'error');
      return;
    }
    const chapterId = chapter.chapter_id;

    // Fetch all orders, transactions, expenses, and other payments for this chapter
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
      if (row.cells[2]) {
        row.cells[2].classList.add('chapter-name-cell');
      }
    });
  }
};
