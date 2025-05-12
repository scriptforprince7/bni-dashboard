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
      <td style="border: 1px solid grey;"><b>${expense.submitted_by}</b></td>
      <td style="border: 1px solid grey;"><b>${expense.description}</b></td>
      <td style="border: 1px solid grey;"><b>₹ ${expense.amount}</b></td>
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
      case 'submitted_by':
        valueA = a.submitted_by.toLowerCase();
        valueB = b.submitted_by.toLowerCase();
        break;
      case 'description':
        valueA = a.description.toLowerCase();
        valueB = b.description.toLowerCase();
        break;
      case 'amount':
        valueA = parseFloat(a.amount);
        valueB = parseFloat(b.amount);
        break;
      case 'payment_status':
        valueA = a.payment_status.toLowerCase();
        valueB = b.payment_status.toLowerCase();
        break;
      case 'bill_date':
        valueA = new Date(a.bill_date);
        valueB = new Date(b.bill_date);
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