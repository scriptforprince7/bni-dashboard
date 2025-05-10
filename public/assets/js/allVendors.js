// Global variables
let allVendors = [];
let filteredVendors = [];
let entriesPerPage = 10;
let currentPage = 1;
let chapters = []; // Store chapters data globally

// Function to show the loader
function showLoader() {
  document.getElementById("loader").style.display = "flex";
}

// Function to hide the loader
function hideLoader() {
  document.getElementById("loader").style.display = "none";
}

// Function to update vendor statistics
const updateVendorStats = (vendors) => {
  const totalVendors = vendors.length;
  const activeVendors = vendors.filter(vendor => vendor.vendor_status === 'active').length;
  const inactiveVendors = vendors.filter(vendor => vendor.vendor_status === 'inactive').length;

  // Update the UI with counts
  const statsButtons = document.querySelectorAll('.btn-white.btn-wave');
  statsButtons[0].querySelector('b').textContent = totalVendors;
  statsButtons[1].querySelector('b').textContent = activeVendors;
  statsButtons[2].querySelector('b').textContent = inactiveVendors;
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

// Function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

// Function to view vendor ledger
const viewVendorLedger = async (vendorId) => {
  try {
    showLoader();
    
    // Find vendor details
    const vendor = allVendors.find(v => v.vendor_id === parseInt(vendorId));
    if (!vendor) throw new Error('Vendor not found');

    // Fetch vendor's expenses
    const response = await fetch(`https://backend.bninewdelhi.com/api/allExpenses`);
    if (!response.ok) throw new Error('Failed to fetch expenses');
    const allExpenses = await response.json();

    // Filter expenses for this vendor
    const vendorExpenses = allExpenses.filter(expense => expense.vendor_id === parseInt(vendorId));

    // Update modal with vendor information
    document.querySelector('.vendor-name').textContent = vendor.vendor_name;
    document.querySelector('.vendor-company').textContent = vendor.vendor_company_name;
    document.querySelector('.vendor-contact').textContent = `${vendor.phone_number} | ${vendor.email_id}`;

    // Calculate total expenses
    const totalAmount = vendorExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
    document.querySelector('.total-expenses .amount').textContent = formatCurrency(totalAmount);

    // Get last expense date
    const lastExpense = vendorExpenses.length > 0 
      ? formatDate(vendorExpenses[vendorExpenses.length - 1].bill_date)
      : 'No expenses';
    document.querySelector('.last-expense .date').textContent = lastExpense;

    // Populate expense history table
    const tableBody = document.querySelector('#vendorLedgerTable tbody');
    tableBody.innerHTML = '';

    if (vendorExpenses.length === 0) {
      document.getElementById('vendorLedgerTable').style.display = 'none';
      document.getElementById('noExpensesMessage').style.display = 'block';
    } else {
      document.getElementById('vendorLedgerTable').style.display = 'table';
      document.getElementById('noExpensesMessage').style.display = 'none';

      vendorExpenses.forEach(expense => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${formatDate(expense.bill_date)}</td>
          <td>${expense.expense_type}</td>
          <td>${expense.description}</td>
          <td>${formatCurrency(expense.amount)}</td>
          <td>${expense.withGST ? `${expense.gstPercentage}% (${formatCurrency(expense.gstAmount)})` : 'N/A'}</td>
          <td>${formatCurrency(expense.totalAmount || expense.amount)}</td>
          <td>
            <span class="payment-status-badge payment-status-${expense.payment_status}">
              ${expense.payment_status.toUpperCase()}
            </span>
          </td>
          <td>
            <button class="btn btn-sm btn-primary view-bill-btn" onclick="window.open('/uploads/${expense.bill_file}', '_blank')">
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

// Function to display vendors in the table
const displayVendors = (vendors) => {
  const tableBody = document.getElementById("expensesTableBody");
  tableBody.innerHTML = "";

  if (vendors.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td colspan="10" class="text-center">No vendors found</td>
    `;
    tableBody.appendChild(row);
    return;
  }

  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, vendors.length);
  const vendorsToDisplay = vendors.slice(startIndex, endIndex);

  vendorsToDisplay.forEach((vendor, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td style="border: 1px solid grey;">${startIndex + index + 1}</td>
      <td style="border: 1px solid grey;"><b>${vendor.vendor_name}</b></td>
      <td style="border: 1px solid grey;"><b>${vendor.vendor_company_name}</b></td>
      <td style="border: 1px solid grey;">
        <b>Phone: ${vendor.phone_number}</b><br>
        <small>Email: ${vendor.email_id}</small>
      </td>
      <td style="border: 1px solid grey;"><b>${vendor.vendor_company_address}</b></td>
      <td style="border: 1px solid grey;"><b>${vendor.vendor_company_gst}</b></td>
      <td style="border: 1px solid grey;"><b>${vendor.chapter_name || 'N/A'}</b></td>
      <td style="border: 1px solid grey;">
        <span class="badge bg-${vendor.vendor_status === 'active' ? 'success' : 'danger'}">
          ${vendor.vendor_status.toUpperCase()}
        </span>
      </td>
      <td style="border: 1px solid grey; text-align: center;">
        <button class="btn btn-sm btn-info view-ledger-btn" onclick="viewVendorLedger(${vendor.vendor_id})">
          <i class="ri-file-list-3-line me-1"></i>View Ledger
        </button>
      </td>
      <td style="border: 1px solid grey;">
        <button class="btn btn-sm btn-primary edit-vendor" data-vendor-id="${vendor.vendor_id}">
          <i class="ri-edit-line"></i>
        </button>
        <button class="btn btn-sm btn-danger delete-vendor" data-vendor-id="${vendor.vendor_id}">
          <i class="ri-delete-bin-line"></i>
        </button>
      </td>
    `;
    tableBody.appendChild(row);
  });

  // Update pagination info
  document.querySelector('.card-footer .mb-2').innerHTML = `
    Showing <b>${startIndex + 1}</b> to <b>${endIndex}</b> of <b>${vendors.length}</b> entries
  `;

  // Update pagination buttons
  updatePagination(vendors.length);
};

// Function to update pagination buttons
const updatePagination = (totalItems) => {
  const totalPages = Math.ceil(totalItems / entriesPerPage);
  const paginationContainer = document.querySelector('.pagination');
  paginationContainer.innerHTML = '';

  // Previous button
  paginationContainer.innerHTML += `
    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
      <a class="page-link" href="javascript:void(0)" onclick="changePage(${currentPage - 1})">Previous</a>
    </li>
  `;

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    paginationContainer.innerHTML += `
      <li class="page-item ${currentPage === i ? 'active' : ''}">
        <a class="page-link" href="javascript:void(0)" onclick="changePage(${i})">${i}</a>
      </li>
    `;
  }

  // Next button
  paginationContainer.innerHTML += `
    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
      <a class="page-link" href="javascript:void(0)" onclick="changePage(${currentPage + 1})">Next</a>
    </li>
  `;
};

// Function to change page
window.changePage = (page) => {
  const totalPages = Math.ceil(filteredVendors.length / entriesPerPage);
  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    displayVendors(filteredVendors);
  }
};

// Function to sort vendors
const sortVendors = (direction) => {
  filteredVendors.sort((a, b) => {
    const nameA = a.vendor_name.toLowerCase();
    const nameB = b.vendor_name.toLowerCase();
    return direction === 'ascending' 
      ? nameA.localeCompare(nameB) 
      : nameB.localeCompare(nameA);
  });
  displayVendors(filteredVendors);
};

// Function to delete vendor
const deleteVendor = async (vendorId) => {
  try {
    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      showLoader();
      const response = await fetch('http://localhost:5000/api/deleteVendor', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vendor_id: vendorId })
      });

      const data = await response.json();

      if (data.success) {
        await Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Vendor has been deleted successfully.',
          showConfirmButton: false,
          timer: 1500
        });
        // Refresh vendors list
        await fetchVendors();
      } else {
        throw new Error(data.message || 'Failed to delete vendor');
      }
    }
  } catch (error) {
    console.error('Error deleting vendor:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message || 'Failed to delete vendor. Please try again.'
    });
  } finally {
    hideLoader();
  }
};

// Function to populate chapter filter dropdown
const populateChapterFilter = (chapters) => {
  const chapterFilter = document.getElementById('chapterFilter');
  chapterFilter.innerHTML = '<option value="">All Chapters</option>';
  
  // Sort chapters alphabetically
  chapters.sort((a, b) => a.chapter_name.localeCompare(b.chapter_name));
  
  chapters.forEach(chapter => {
    const option = document.createElement('option');
    option.value = chapter.chapter_id;
    option.textContent = chapter.chapter_name;
    chapterFilter.appendChild(option);
  });
};

// Function to filter vendors by chapter
const filterVendorsByChapter = (chapterId) => {
  if (!chapterId) {
    // If no chapter selected, show all vendors
    filteredVendors = [...allVendors];
  } else {
    // Filter vendors by selected chapter
    filteredVendors = allVendors.filter(vendor => 
      vendor.chapter_id === parseInt(chapterId)
    );
  }
  
  currentPage = 1; // Reset to first page
  updateVendorStats(filteredVendors); // Update stats for filtered vendors
  displayVendors(filteredVendors);
};

// Function to fetch vendors
const fetchVendors = async () => {
  try {
    showLoader();
    
    // Fetch chapters first
    const chaptersResponse = await fetch('https://backend.bninewdelhi.com/api/chapters');
    chapters = await chaptersResponse.json();
    
    // Populate chapter filter dropdown
    populateChapterFilter(chapters);
    
    // Create a map of chapter_id to chapter_name for quick lookup
    const chapterMap = new Map(chapters.map(chapter => [chapter.chapter_id, chapter.chapter_name]));
    
    // Fetch vendors
    const response = await fetch('https://backend.bninewdelhi.com/api/getAllVendors');
    if (!response.ok) throw new Error('Failed to fetch vendors');
    
    const vendors = await response.json();
    
    // Add chapter_name to each vendor
    allVendors = vendors.map(vendor => ({
      ...vendor,
      chapter_name: vendor.chapter_id ? chapterMap.get(vendor.chapter_id) : 'N/A'
    }));
    
    filteredVendors = [...allVendors];
    
    // Update stats and display vendors
    updateVendorStats(allVendors);
    displayVendors(filteredVendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    Swal.fire('Error!', 'Failed to load vendors', 'error');
  } finally {
    hideLoader();
  }
};

// Function to add new vendor
const addNewVendor = async () => {
  try {
    // Fetch chapters for dropdown
    const chaptersResponse = await fetch('https://backend.bninewdelhi.com/api/chapters');
    const chapters = await chaptersResponse.json();
    
    // Sort chapters alphabetically
    chapters.sort((a, b) => a.chapter_name.localeCompare(b.chapter_name));
    
    // Create chapter options HTML
    const chapterOptions = chapters.map(chapter => 
      `<option value="${chapter.chapter_id}">${chapter.chapter_name}</option>`
    ).join('');

    const result = await Swal.fire({
      title: 'Add New Vendor',
      html: `
        <form id="addVendorForm" class="text-start">
          <div class="mb-3">
            <label for="vendor_name" class="form-label">Vendor Name*</label>
            <input type="text" class="form-control" id="vendor_name" required>
          </div>
          <div class="mb-3">
            <label for="chapter_id" class="form-label">Choose Chapter*</label>
            <select class="form-control" id="chapter_id" required>
              <option value="">Select Chapter</option>
              ${chapterOptions}
            </select>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <label for="phone_number" class="form-label">Phone Number*</label>
              <input type="tel" class="form-control" id="phone_number" pattern="[0-9]{10}" title="Please enter a valid 10-digit phone number" required>
            </div>
            <div class="col-md-6">
              <label for="email_id" class="form-label">Email*</label>
              <input type="email" class="form-control" id="email_id" required>
            </div>
          </div>
          <div class="mb-3">
            <label for="vendor_company_name" class="form-label">Company Name*</label>
            <input type="text" class="form-control" id="vendor_company_name" required>
          </div>
          <div class="mb-3">
            <label for="vendor_company_address" class="form-label">Company Address*</label>
            <textarea class="form-control" id="vendor_company_address" rows="2" required></textarea>
          </div>
          <div class="mb-3">
            <label for="vendor_company_gst" class="form-label">Company GST*</label>
            <input type="text" class="form-control" id="vendor_company_gst" pattern="^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$" title="Please enter a valid GST number" required>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <label for="vendor_bank_name" class="form-label">Bank Name*</label>
              <input type="text" class="form-control" id="vendor_bank_name" required>
            </div>
            <div class="col-md-6">
              <label for="vendor_account" class="form-label">Account Number*</label>
              <input type="text" class="form-control" id="vendor_account" pattern="[0-9]+" title="Please enter only numbers" required>
            </div>
          </div>
          <div class="row mb-3">
            <div class="col-md-6">
              <label for="vendor_ifsc_code" class="form-label">IFSC Code*</label>
              <input type="text" class="form-control" id="vendor_ifsc_code" pattern="^[A-Z]{4}0[A-Z0-9]{6}$" title="Please enter a valid IFSC code" required>
            </div>
            <div class="col-md-6">
              <label for="vendor_account_type" class="form-label">Account Type*</label>
              <select class="form-control" id="vendor_account_type" required>
                <option value="">Select Account Type</option>
                <option value="Savings">Savings</option>
                <option value="Current">Current</option>
              </select>
            </div>
          </div>
          <div class="mb-3">
            <label for="vendor_status" class="form-label">Status*</label>
            <select class="form-control" id="vendor_status" required>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <small class="text-muted">* Required fields</small>
        </form>
      `,
      showCancelButton: true,
      confirmButtonText: 'Add Vendor',
      cancelButtonText: 'Cancel',
      width: '800px',
      customClass: {
        container: 'add-vendor-popup'
      },
      didOpen: () => {
        // Add input masks and validation
        const gstInput = document.getElementById('vendor_company_gst');
        gstInput.addEventListener('input', function() {
          this.value = this.value.toUpperCase();
        });

        const ifscInput = document.getElementById('vendor_ifsc_code');
        ifscInput.addEventListener('input', function() {
          this.value = this.value.toUpperCase();
        });
      },
      preConfirm: () => {
        const form = document.getElementById('addVendorForm');
        if (!form.checkValidity()) {
          form.reportValidity();
          return false;
        }

        const chapterId = document.getElementById('chapter_id').value;
        if (!chapterId) {
          Swal.showValidationMessage('Please select a chapter');
          return false;
        }

        // Get form values
        const vendorData = {
          vendor_name: document.getElementById('vendor_name').value,
          chapter_id: parseInt(chapterId),
          phone_number: document.getElementById('phone_number').value,
          email_id: document.getElementById('email_id').value,
          vendor_company_name: document.getElementById('vendor_company_name').value,
          vendor_company_address: document.getElementById('vendor_company_address').value,
          vendor_company_gst: document.getElementById('vendor_company_gst').value,
          vendor_account: document.getElementById('vendor_account').value,
          vendor_bank_name: document.getElementById('vendor_bank_name').value,
          vendor_ifsc_code: document.getElementById('vendor_ifsc_code').value,
          vendor_account_type: document.getElementById('vendor_account_type').value,
          vendor_status: document.getElementById('vendor_status').value
        };

        // Validate GST format
        const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstPattern.test(vendorData.vendor_company_gst)) {
          Swal.showValidationMessage('Please enter a valid GST number');
          return false;
        }

        // Validate IFSC format
        const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        if (!ifscPattern.test(vendorData.vendor_ifsc_code)) {
          Swal.showValidationMessage('Please enter a valid IFSC code');
          return false;
        }

        // Validate phone number
        const phonePattern = /^[0-9]{10}$/;
        if (!phonePattern.test(vendorData.phone_number)) {
          Swal.showValidationMessage('Please enter a valid 10-digit phone number');
          return false;
        }

        // Validate email
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(vendorData.email_id)) {
          Swal.showValidationMessage('Please enter a valid email address');
          return false;
        }

        return vendorData;
      }
    });

    if (result.isConfirmed && result.value) {
      try {
        showLoader();
        const response = await fetch('https://backend.bninewdelhi.com/api/addVendor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(result.value)
        });

        if (response.ok) {
          const data = await response.json();
          await Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: data.message || 'Vendor added successfully',
            timer: 2000,
            showConfirmButton: false
          });
          // Refresh vendors list
          await fetchVendors();
        } else {
          const errorData = await response.json();
          Swal.fire('Error!', errorData.message || 'Failed to add vendor', 'error');
        }
      } catch (error) {
        console.error('Error adding vendor:', error);
        Swal.fire('Error!', 'Failed to add vendor. Please try again.', 'error');
      } finally {
        hideLoader();
      }
    }
  } catch (error) {
    console.error('Error in add vendor process:', error);
    Swal.fire('Error!', 'Failed to initialize add vendor form', 'error');
  }
};

// Function to edit vendor
const editVendor = (vendorId) => {
  window.location.href = `/rexp/edit-vendor?id=${vendorId}`;
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Initial fetch
  fetchVendors();

  // Sort button listener
  document.getElementById('sortButton').addEventListener('click', function() {
    const currentSort = this.getAttribute('data-filter');
    const newSort = currentSort === 'ascending' ? 'descending' : 'ascending';
    this.setAttribute('data-filter', newSort);
    this.textContent = newSort === 'ascending' ? 'Ascending' : 'Descending';
    sortVendors(newSort);
  });

  // Chapter filter listener
  document.getElementById('chapterFilter').addEventListener('change', function() {
    filterVendorsByChapter(this.value);
  });

  // Delete and Edit button listeners
  document.getElementById('expensesTableBody').addEventListener('click', (e) => {
    if (e.target.closest('.delete-vendor')) {
      const vendorId = e.target.closest('.delete-vendor').dataset.vendorId;
      deleteVendor(vendorId);
    } else if (e.target.closest('.edit-vendor')) {
      const vendorId = e.target.closest('.edit-vendor').dataset.vendorId;
      editVendor(vendorId);
    }
  });

  // Add new vendor button listener
  document.getElementById('addNewExpenseBtn').addEventListener('click', addNewVendor);
});
