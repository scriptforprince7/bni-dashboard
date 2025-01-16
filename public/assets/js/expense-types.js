// Global variables
let filteredExpenseTypes = [];
let currentPage = 1;
const entriesPerPage = 10;

// Show/Hide loader functions
const showLoader = () => {
  document.getElementById("loader").style.display = "flex";
};

const hideLoader = () => {
  document.getElementById("loader").style.display = "none";
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

// Display expense types function
const displayExpenseTypes = (expenseTypes) => {
  const tbody = document.getElementById("expensesTableBody");
  tbody.innerHTML = "";

  expenseTypes.forEach((expense, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td style="border: 1px solid grey;">${index + 1}</td>
      <td style="border: 1px solid grey;"><b>${expense.expense_name}</b></td>
      <td style="border: 1px solid grey;">
        <span class="badge bg-${expense.expense_status === 'active' ? 'success' : 'warning'}">
          ${expense.expense_status}
        </span>
      </td>
      <td style="border: 1px solid grey;">
        <a href="/exp/edit-expense-type/?expense_id=${expense.expense_id}" 
           class="badge" 
           style="background-color: #10b981; color: #ffffff; margin-right: 5px;">
           Edit
        </a>
        <span class="badge bg-danger delete-btn" 
              style="cursor: pointer;" 
              onclick="deleteExpenseType(${expense.expense_id})">
          Delete
        </span>
      </td>
    `;
    tbody.appendChild(row);
  });
};

// Sort expense types
const sortExpenseTypes = (direction) => {
  filteredExpenseTypes.sort((a, b) => {
    if (direction === "asc") {
      return a.expense_name.toLowerCase().localeCompare(b.expense_name.toLowerCase());
    } else {
      return b.expense_name.toLowerCase().localeCompare(a.expense_name.toLowerCase());
    }
  });

  displayExpenseTypes(filteredExpenseTypes);
};

// Fetch expense types from API
const fetchExpenseTypes = async () => {
  try {
    showLoader();
    const response = await fetch('https://bni-data-backend.onrender.com/api/expenseType');
    if (!response.ok) {
      throw new Error('Failed to fetch expense types');
    }
    const data = await response.json();
    filteredExpenseTypes = data;
    displayExpenseTypes(data);
  } catch (error) {
    console.error('Error:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Failed to fetch expense types'
    });
  } finally {
    hideLoader();
  }
};

// Delete expense type function
const deleteExpenseType = (expenseId) => {
  Swal.fire({
    title: 'Are you sure?',
    text: "You won't be able to revert this!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!'
  }).then((result) => {
    if (result.isConfirmed) {
      // Add your delete API call here
      Swal.fire(
        'Deleted!',
        'Expense type has been deleted.',
        'success'
      ).then(() => {
        fetchExpenseTypes(); // Refresh the list
      });
    }
  });
};

// Event listener for sort button
document.getElementById("sortButton").addEventListener("click", function() {
  const currentSort = this.getAttribute("data-sort") || "asc";
  const newSort = currentSort === "asc" ? "desc" : "asc";
  this.setAttribute("data-sort", newSort);
  this.textContent = `${newSort === "asc" ? "A to Z" : "Z to A"}`;
  sortExpenseTypes(newSort);
});

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  fetchExpenseTypes();
});
