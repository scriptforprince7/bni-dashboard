// let apiUrl = "http://localhost:5000/api/allExpenses"; // API for expenses
let allExpenses = []; // To store fetched expenses globally
let filteredExpenses = []; // To store filtered expenses based on search
let expenseTypes = []; // Store expense types mapping

// Define base URL at the top of your file
const BILL_BASE_URL = 'https://backend.bninewdelhi.com';

// Sorting state for each column
const sortState = {};

// Helper to get value for sorting
function getSortValue(expense, column) {
  switch (column) {
    case 'expense_type': {
      const expenseTypeObj = expenseTypes.find(type => type.expense_id === expense.expense_type);
      return expenseTypeObj ? expenseTypeObj.expense_name : '';
    }
    case 'submitted_by':
      return expense.submitted_by || '';
    case 'description':
      return expense.description || '';
    case 'amount':
      return parseFloat(expense.amount) || 0;
    case 'payment_status':
      return expense.payment_status || '';
    case 'bill_date':
      return expense.bill_date || '';
    default:
      return '';
  }
}

// Add event listeners to sortable headers
function setupColumnSorting() {
  document.querySelectorAll('.sortable').forEach(header => {
    header.style.cursor = 'pointer';
    header.addEventListener('click', function () {
      const column = header.getAttribute('data-column');
      if (!column) return;
      // Toggle sort direction
      sortState[column] = sortState[column] === 'asc' ? 'desc' : 'asc';
      // Sort filteredExpenses
      filteredExpenses.sort((a, b) => {
        const valA = getSortValue(a, column);
        const valB = getSortValue(b, column);
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortState[column] === 'asc' ? valA - valB : valB - valA;
        } else {
          return sortState[column] === 'asc'
            ? String(valA).localeCompare(String(valB))
            : String(valB).localeCompare(String(valA));
        }
      });
      // Update table
      displayExpenses(filteredExpenses);
      // Optionally update icon (not required, but can be added)
    });
  });
}

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
    
    // Get user context
    const userEmail = getUserEmail();
    const userType = getUserLoginType();
    const currentChapterId = localStorage.getItem('current_chapter_id');
    const currentChapterEmail = localStorage.getItem('current_chapter_email');
    
    console.log('👤 User Context:', {
      userEmail,
      userType,
      currentChapterId,
      currentChapterEmail
    });

    // Fetch all expenses first
    const response = await fetch("http://localhost:5000/api/allExpenses");
    if (!response.ok) throw new Error("Network response was not ok");
    const allExpensesData = await response.json();
    console.log('📊 All expenses before filtering:', allExpensesData);

    // Filter expenses based on user type and chapter
    if (userType === 'ro_admin' && currentChapterId) {
      console.log('🔍 RO Admin filtering for chapter_id:', currentChapterId);
      
      // Convert currentChapterId to string for comparison
      const targetChapterId = String(currentChapterId);
      
      allExpenses = allExpensesData.filter(expense => {
        const expenseChapterId = String(expense.chapter_id);
        const matches = expenseChapterId === targetChapterId;
        console.log(`Checking expense ${expense.expense_id}:`, {
          expenseChapterId,
          targetChapterId,
          matches
        });
        return matches;
      });
      
      console.log('✅ Filtered expenses for RO Admin:', allExpenses);
    } else if (userType !== 'ro_admin') {
      // For chapter users, fetch their chapter details
      const chaptersResponse = await fetch("http://localhost:5000/api/chapters");
      const chapters = await chaptersResponse.json();
      const userChapter = chapters.find(chapter =>
        chapter.email_id === userEmail ||
        chapter.vice_president_mail === userEmail ||
        chapter.president_mail === userEmail ||
        chapter.treasurer_mail === userEmail
      );
    
      console.log('Found user chapter:', userChapter);
      
      console.log('🏢 Chapter user filtering:', {
        userEmail,
        chapterId: userChapter?.chapter_id
      });
      
      allExpenses = allExpensesData.filter(expense => 
        expense.chapter_id === userChapter?.chapter_id
      );
    } else {
      console.log('⚠️ No specific chapter selected for RO Admin');
      allExpenses = [];
    }

    // Fetch expense types for mapping
    const expenseTypesResponse = await fetch(
      "http://localhost:5000/api/expenseType"
    );
    if (!expenseTypesResponse.ok) {
      throw new Error("Failed to fetch expense types");
    }
    expenseTypes = await expenseTypesResponse.json();
    console.log('💰 Expense types loaded:', expenseTypes.length);

    filteredExpenses = [...allExpenses];
    console.log('📋 Final filtered expenses:', {
      total: filteredExpenses.length,
      expenses: filteredExpenses
    });

    // Sort and display expenses
    sortExpenses(sortDirection);
    displayExpenses(filteredExpenses);
    updateExpenseTotals(allExpenses);
    setupColumnSorting();

  } catch (error) {
    console.error("❌ Error in fetchExpenses:", error);
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

document.getElementById('addNewExpenseBtn').addEventListener('click', (event) => {
  console.log("Button clicked");
// Get the region_id from the button's data attribute
const region_name = event.target.getAttribute('data-region-id');
console.log("Region Name:", region_name); // Log the region name from button's data attribute
// Call AddExpense function with the region_name
AddExpenseType();
});

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
    const expenseName = expenseTypeObj
      ? expenseTypeObj.expense_name
      : "Unknown";

    const billDate = new Date(expense.bill_date);
    const formattedBillDate = billDate.toLocaleDateString();

    // Get just the filename from upload_bill (remove any path if present)
    const filename = expense.upload_bill ? expense.upload_bill.split('/').pop() : null;
    
    // Construct the bill URL
    const billUrl = filename ? `${BILL_BASE_URL}/api/uploads/expenses/${filename}` : '#';
    
    // Get receipt filename and construct receipt URL
    const receiptFilename = expense.upload_receipt ? expense.upload_receipt.split('/').pop() : null;
    const receiptUrl = receiptFilename ? `${BILL_BASE_URL}/api/uploads/expenses/${receiptFilename}` : '#';

    console.log('Creating row for expense:', {
      id: expense.expense_id,
      type: expenseName,
      submittedBy: expense.submitted_by,
      amount: expense.amount,
      status: expense.payment_status,
      date: formattedBillDate,
      billUrl: billUrl,
      receiptUrl: receiptUrl,
      modeOfPayment: expense.mode_of_payment
    });

    row.innerHTML = `
      <td>${index + 1}</td>
      <td style="border: 1px solid grey;"><b>${expenseName}</b></td>
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
        <a href="/exp/edit-expense/?expense_id=${expense.expense_id}" class="badge" style="background-color: #10b981; color: #ffffff; text-shadow: 1px 1px 1px rgba(0,0,0,0.3); transition: all 0.3s ease; hover: {opacity: 0.9};">Edit Bill</a>
        <span class="badge bg-danger delete-btn" style="cursor:pointer; color: #ffffff; text-shadow: 1px 1px 1px rgba(0,0,0,0.5); font-weight: bold;" data-expense-id="${expense.expense_id}">Delete</span>
      </td>
    `;
    tableBody.appendChild(row);
  });
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
document.addEventListener("DOMContentLoaded", async function () {
  console.log('Page loaded - fetching expenses');
  console.log('User login type:', getUserLoginType());
  console.log('User email:', getUserEmail());
  
  showLoader();
  await fetchExpenses("asc");
  
  // Set initial button text
  const button = document.getElementById("sortButton");
  button.textContent = "↑ (A-Z)";
  button.setAttribute("data-sort", "asc");

  // First get the login type and email from token
  const loginType = getUserLoginType();
  const userEmail = getUserEmail();
  
  console.log('Current user details:', {
    loginType: loginType,
    email: userEmail
  });

  // Function to handle hotel selection
  const handleHotelSelection = async (hotelId) => {
    try {
      const hotels = await fetchHotels();
      const selectedHotel = hotels.find(hotel => hotel.hotel_id === parseInt(hotelId));
      
      if (selectedHotel) {
        // Populate hotel details fields
        document.getElementById('bank_name').value = selectedHotel.bank_name || 'N/A';
        document.getElementById('ifsc_code').value = selectedHotel.ifsc_code || 'N/A';
        document.getElementById('account_no').value = selectedHotel.account_no || 'N/A';
        document.getElementById('account_type').value = selectedHotel.account_type || 'N/A';
        document.getElementById('hotel_gst').value = selectedHotel.hotel_gst || 'N/A';
        
        // Show hotel details section
        document.getElementById('hotelDetailsSection').style.display = 'flex';
      }
    } catch (error) {
      console.error('Error handling hotel selection:', error);
      Swal.fire('Error!', 'Failed to load hotel details', 'error');
    }
  };

  // Function to fetch hotels
  const fetchHotels = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/getHotels');
      if (!response.ok) throw new Error('Failed to fetch hotels');
      return await response.json();
    } catch (error) {
      console.error('Error fetching hotels:', error);
      throw error;
    }
  };

  // Function to populate hotel dropdown
  const populateHotelDropdown = async () => {
    try {
      const hotels = await fetchHotels();
      const hotelDropdown = document.getElementById('hotel');
      
      // Clear existing options except the first one
      hotelDropdown.innerHTML = '<option value="">Select Hotel</option>';
      
      // Sort hotels by name
      hotels.sort((a, b) => a.hotel_name.localeCompare(b.hotel_name));
      
      // Add hotel options
      hotels.forEach(hotel => {
        const option = document.createElement('option');
        option.value = hotel.hotel_id;
        option.textContent = hotel.hotel_name;
        hotelDropdown.appendChild(option);
      });
    } catch (error) {
      console.error('Error populating hotel dropdown:', error);
      Swal.fire('Error!', 'Failed to load hotels', 'error');
    }
  };

  // Handle expense type change
  document.getElementById('expense_type').addEventListener('change', async function() {
    const expenseTypeSelect = document.getElementById('expense_type');
    const selectedOption = expenseTypeSelect.options[expenseTypeSelect.selectedIndex];
    const hotelSection = document.getElementById('hotelSection');
    const hotelDetailsSection = document.getElementById('hotelDetailsSection');
    
    // Check if the selected expense type is "Meeting Hotel Expenses"
    if (selectedOption.textContent === 'Meeting Hotel Expenses') {
      await populateHotelDropdown();
      hotelSection.style.display = 'block';
    } else {
      hotelSection.style.display = 'none';
      hotelDetailsSection.style.display = 'none';
    }
  });

  // Handle hotel selection change
  document.getElementById('hotel').addEventListener('change', function() {
    const selectedHotelId = this.value;
    if (selectedHotelId) {
      handleHotelSelection(selectedHotelId);
    } else {
      document.getElementById('hotelDetailsSection').style.display = 'none';
    }
  });

  setupColumnSorting();
});