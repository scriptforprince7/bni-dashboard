let apiUrl = "https://bni-data-backend.onrender.com/api/allExpenses"; // API for expenses
let allExpenses = []; // To store fetched expenses globally
let filteredExpenses = []; // To store filtered expenses based on search
let entriesPerPage = 10; // Number of entries to display per page
let currentPage = 1; // For pagination
let expenseTypes = []; // Store expense types mapping

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

// Fetch expenses with the applied filter
const fetchExpenses = async (sortDirection = 'asc') => {
  try {
    showLoader();

    const expenseTypesResponse = await fetch(
      "https://bni-data-backend.onrender.com/api/expenseType"
    );
    if (!expenseTypesResponse.ok)
      throw new Error("Failed to fetch expense types");
    expenseTypes = await expenseTypesResponse.json();

    const response = await fetch(`${apiUrl}`);
    if (!response.ok) throw new Error("Network response was not ok");

    allExpenses = await response.json();
    filteredExpenses = [...allExpenses];
    sortExpenses(sortDirection);
    displayExpenses(filteredExpenses.slice(0, entriesPerPage));

    // Update the expense totals
    updateExpenseTotals(allExpenses);
  } catch (error) {
    console.error("There was a problem fetching the data:", error);
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
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  displayExpenses(filteredExpenses.slice(startIndex, endIndex));
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
        const response = await fetch(`https://bni-data-backend.onrender.com/api/expenseType`, {
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
      }
    } else {
      Swal.fire('Canceled', 'No expense type entered. Expense not added.', 'info');
    }
  }
};

document.getElementById('addNewExpenseBtn').addEventListener('click', (event) => {
// Get the region_id from the button's data attribute
const region_name = event.target.getAttribute('data-region-id');
console.log("Region Name:", region_name); // Log the region name from button's data attribute
// Call AddExpense function with the region_name
AddExpenseType();
});
// Function to display expenses in the table
function displayExpenses(expenses) {
  const tableBody = document.getElementById("expensesTableBody");
  tableBody.innerHTML = "";

  expenses.forEach((expense, index) => {
    const row = document.createElement("tr");
    row.setAttribute("data-expense-id", expense.expense_id);
    row.classList.add("order-list");

    // expense_type ID से expense_name ढूंढें
    const expenseTypeObj = expenseTypes.find(
      (type) => type.expense_id === expense.expense_type
    );
    const expenseName = expenseTypeObj
      ? expenseTypeObj.expense_name
      : "Unknown";

    const billDate = new Date(expense.bill_date);
    const formattedBillDate = billDate.toLocaleDateString();

    row.innerHTML = `
            <td>${(currentPage - 1) * entriesPerPage + index + 1}</td>
            <td style="border: 1px solid grey;"><b>${expenseName}</b></td>
            <td style="border: 1px solid grey;"><b>${
              expense.submitted_by
            }</b></td>
            <td style="border: 1px solid grey;"><b>${
              expense.description
            }</b></td>
            <td style="border: 1px solid grey;"><b>₹ ${expense.amount}</b></td>
            <td style="border: 1px solid grey;">
                <span class="badge bg-${
                  expense.payment_status === "pending" ? "warning" : "success"
                }">${expense.payment_status}</span>
            </td>
            <td style="border: 1px solid grey;"><b>${formattedBillDate}</b></td>
            <td style="border: 1px solid grey">
<a href="/exp/edit-expense/?expense_id=${expense.expense_id}" 
   class="badge" 
   style="background-color: #10b981; color: #ffffff; text-shadow: 1px 1px 1px rgba(0,0,0,0.3); transition: all 0.3s ease; hover: {opacity: 0.9};">Edit Bill</a>                <span class="badge bg-danger delete-btn" style="cursor:pointer; color: #ffffff; text-shadow: 1px 1px 1px rgba(0,0,0,0.5); font-weight: bold;" data-expense-id="${
     expense.expense_id
   }">Delete</span>
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
        `https://bni-data-backend.onrender.com/api/expense/${expense_id}`,
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

// Initial fetch and sorting (default sort: ascending A-Z)
window.addEventListener("DOMContentLoaded", async () => {
  showLoader();
  await fetchExpenses("asc");
  // Set initial button text
  const button = document.getElementById("sortButton");
  button.textContent = "↑ (A-Z)";
  button.setAttribute("data-sort", "asc");
});