// Global variables
let allVendors = [];
let filteredVendors = [];
let entriesPerPage = 10;
let currentPage = 1;

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

// Function to display vendors in the table
const displayVendors = (vendors) => {
  const tableBody = document.getElementById("expensesTableBody");
  tableBody.innerHTML = "";

  if (vendors.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td colspan="8" class="text-center">No vendors found</td>
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
      <td style="border: 1px solid grey;">
        <span class="badge bg-${vendor.vendor_status === 'active' ? 'success' : 'danger'}">
          ${vendor.vendor_status.toUpperCase()}
        </span>
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
    try {
      showLoader();
      const response = await fetch(`http://localhost:5000/api/vendor/${vendorId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await Swal.fire('Deleted!', 'Vendor has been deleted.', 'success');
        // Refresh vendors list
        await fetchVendors();
      } else {
        const error = await response.json();
        Swal.fire('Error!', error.message || 'Failed to delete vendor', 'error');
      }
    } catch (error) {
      console.error('Error deleting vendor:', error);
      Swal.fire('Error!', 'Failed to delete vendor', 'error');
    } finally {
      hideLoader();
    }
  }
};

// Function to fetch vendors
const fetchVendors = async () => {
  try {
    showLoader();
    const response = await fetch('http://localhost:5000/api/getAllVendors');
    if (!response.ok) throw new Error('Failed to fetch vendors');
    
    allVendors = await response.json();
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
  const result = await Swal.fire({
    title: 'Add New Vendor',
    html: `
      <form id="addVendorForm" class="text-start">
        <div class="mb-3">
          <label for="vendor_name" class="form-label">Vendor Name*</label>
          <input type="text" class="form-control" id="vendor_name" required>
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

      // Get form values
      const vendorData = {
        vendor_name: document.getElementById('vendor_name').value,
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

  if (result.isConfirmed) {
    try {
      showLoader();
      const response = await fetch('http://localhost:5000/api/addVendor', {
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

  // Delete button listener
  document.getElementById('expensesTableBody').addEventListener('click', (e) => {
    if (e.target.closest('.delete-vendor')) {
      const vendorId = e.target.closest('.delete-vendor').dataset.vendorId;
      deleteVendor(vendorId);
    }
  });

  // Add new vendor button listener
  document.getElementById('addNewExpenseBtn').addEventListener('click', addNewVendor);
});
