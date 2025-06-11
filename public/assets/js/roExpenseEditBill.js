// Function to show loader
function showLoader() {
  Swal.fire({
    title: 'Loading...',
    allowOutsideClick: false,
    showConfirmButton: false,
    willOpen: () => {
      Swal.showLoading();
    }
  });
}

// Function to hide loader
function hideLoader() {
  Swal.close();
}

// Function to fetch expense details
const fetchExpenseDetails = async (expenseId) => {
  try {
    showLoader();
    console.log('🔍 Fetching expense details for ID:', expenseId);

    // Fetch expense details
    const response = await fetch(`https://backend.bninewdelhi.com/api/expense/${expenseId}`);
    if (!response.ok) throw new Error("Failed to fetch expense details");
    
    const expenseData = await response.json();
    console.log('📦 Fetched expense data:', expenseData);

    // Fetch chapters
    const chaptersResponse = await fetch('https://backend.bninewdelhi.com/api/chapters');
    if (!chaptersResponse.ok) throw new Error("Failed to fetch chapters");
    const chapters = await chaptersResponse.json();
    
    // Populate chapter dropdown
    const chapterSelect = document.getElementById('chapter');
    chapterSelect.innerHTML = '<option value="">Select Chapter</option>';
    chapters.forEach(chapter => {
      const option = document.createElement('option');
      option.value = chapter.chapter_id;
      option.textContent = chapter.chapter_name;
      chapterSelect.appendChild(option);
    });
    
    // Select the matching chapter
    if (expenseData.chapter_id) {
      chapterSelect.value = expenseData.chapter_id;
      console.log('🏢 Selected chapter:', chapterSelect.options[chapterSelect.selectedIndex].text);
    }

    // Fetch expense types
    const expenseTypesResponse = await fetch('https://backend.bninewdelhi.com/api/expenseType');
    if (!expenseTypesResponse.ok) throw new Error("Failed to fetch expense types");
    const expenseTypes = await expenseTypesResponse.json();
    
    // Populate expense type dropdown
    const expenseTypeSelect = document.getElementById('expense_type');
    expenseTypeSelect.innerHTML = '<option value="">Select Expense Type</option>';
    expenseTypes.forEach(type => {
      const option = document.createElement('option');
      option.value = type.expense_id;
      option.textContent = type.expense_name;
      expenseTypeSelect.appendChild(option);
    });
    
    // Select the matching expense type
    if (expenseData.expense_type) {
      expenseTypeSelect.value = expenseData.expense_type;
      console.log('💰 Selected expense type:', expenseTypeSelect.options[expenseTypeSelect.selectedIndex].text);
    }

    // Add event listener for expense type change
    expenseTypeSelect.addEventListener('change', async function() {
      const selectedOption = this.options[this.selectedIndex];
      const hotelSection = document.getElementById('hotelSection');
      const hotelDetailsSection = document.getElementById('hotelDetailsSection');
      const vendorSection = document.getElementById('vendorSection');
      const vendorDetailsSection = document.getElementById('vendorDetailsSection');
      
      // Check if the selected expense type is "Meeting Hotel Expenses"
      if (selectedOption.textContent === 'Meeting Hotel Expenses') {
        console.log('Meeting Hotel Expenses selected - showing hotel section');
        hotelSection.style.display = 'block';
        hotelDetailsSection.style.display = 'none';
        vendorSection.style.display = 'none';
        vendorDetailsSection.style.display = 'none';
        
        // Clear vendor data
        if (window.companyNameDropdown) {
          window.companyNameDropdown.value = '';
        }
        document.getElementById('vendor_company_name').value = '';
        document.getElementById('vendor_company_address').value = '';
        document.getElementById('vendor_phone').value = '';
        document.getElementById('vendor_email').value = '';
        document.getElementById('vendor_company_gst').value = '';
        document.getElementById('vendor_bank_name').value = '';
        document.getElementById('vendor_account').value = '';
        document.getElementById('vendor_ifsc_code').value = '';
        document.getElementById('vendor_account_type').value = '';

        // Fetch and populate hotels
        try {
          const hotelsResponse = await fetch('https://backend.bninewdelhi.com/api/gethotels');
          const hotels = await hotelsResponse.json();
          console.log('🏨 Fetched hotels:', hotels);

          const hotelSelect = document.getElementById('hotel');
          hotelSelect.innerHTML = '<option value="">Select Hotel</option>';
          
          // Sort hotels by name
          hotels.sort((a, b) => a.hotel_name.localeCompare(b.hotel_name));
          
          hotels.forEach(hotel => {
            const option = document.createElement('option');
            option.value = hotel.hotel_id;
            option.textContent = hotel.hotel_name;
            hotelSelect.appendChild(option);
          });

          // Add event listener for hotel selection
          hotelSelect.addEventListener('change', function() {
            const selectedHotelId = this.value;
            if (selectedHotelId) {
              const selectedHotel = hotels.find(h => h.hotel_id == selectedHotelId);
              if (selectedHotel) {
                // Populate hotel details
                document.getElementById('bank_name').value = selectedHotel.bank_name || '';
                document.getElementById('ifsc_code').value = selectedHotel.ifsc_code || '';
                document.getElementById('account_no').value = selectedHotel.account_no || '';
                document.getElementById('account_type').value = selectedHotel.account_type || '';
                document.getElementById('hotel_gst').value = selectedHotel.hotel_gst || '';
                
                // Show hotel details section
                hotelDetailsSection.style.display = 'block';
                console.log('✅ Hotel details populated and section shown');
              }
            } else {
              hotelDetailsSection.style.display = 'none';
            }
          });
        } catch (error) {
          console.error('❌ Error fetching hotels:', error);
          Swal.fire('Error', 'Failed to fetch hotels', 'error');
        }
      } else {
        console.log('Different expense type selected - showing vendor section');
        hotelSection.style.display = 'none';
        hotelDetailsSection.style.display = 'none';
        vendorSection.style.display = 'block';
        
        // Clear hotel data
        document.getElementById('hotel').value = '';
        document.getElementById('bank_name').value = '';
        document.getElementById('ifsc_code').value = '';
        document.getElementById('account_no').value = '';
        document.getElementById('account_type').value = '';
        document.getElementById('hotel_gst').value = '';

        // Fetch and populate vendors
        try {
          const vendorsResponse = await fetch('https://backend.bninewdelhi.com/api/getallvendors');
          const vendors = await vendorsResponse.json();
          console.log('🏢 Fetched vendors:', vendors);

          const vendorSelect = document.getElementById('vendor');
          vendorSelect.innerHTML = '<option value="">Select Vendor</option>';
          
          // Sort vendors by name
          vendors.sort((a, b) => a.vendor_name.localeCompare(b.vendor_name));
          
          vendors.forEach(vendor => {
            const option = document.createElement('option');
            option.value = vendor.vendor_id;
            option.textContent = `${vendor.vendor_name} - ${vendor.vendor_company_name}`;
            vendorSelect.appendChild(option);
          });

          // Add event listener for vendor selection
          vendorSelect.addEventListener('change', function() {
            const selectedVendorId = this.value;
            if (selectedVendorId) {
              const selectedVendor = vendors.find(v => v.vendor_id == selectedVendorId);
              if (selectedVendor) {
                // Populate vendor details
                document.getElementById('vendor_company_name').value = selectedVendor.vendor_company_name || '';
                document.getElementById('vendor_company_address').value = selectedVendor.vendor_company_address || '';
                document.getElementById('vendor_phone').value = selectedVendor.phone_number || '';
                document.getElementById('vendor_email').value = selectedVendor.email_id || '';
                document.getElementById('vendor_company_gst').value = selectedVendor.vendor_company_gst || '';
                document.getElementById('vendor_bank_name').value = selectedVendor.vendor_bank_name || '';
                document.getElementById('vendor_account').value = selectedVendor.vendor_account || '';
                document.getElementById('vendor_ifsc_code').value = selectedVendor.vendor_ifsc_code || '';
                document.getElementById('vendor_account_type').value = selectedVendor.vendor_account_type || '';
                
                // Show vendor details section
                vendorDetailsSection.style.display = 'block';
                console.log('✅ Vendor details populated and section shown');
              }
            } else {
              vendorDetailsSection.style.display = 'none';
            }
          });
        } catch (error) {
          console.error('❌ Error fetching vendors:', error);
          Swal.fire('Error', 'Failed to fetch vendors', 'error');
        }
      }
    });

    // Populate other form fields
    document.getElementById('submitted_by').value = expenseData.submitted_by;
    document.getElementById('description').value = expenseData.description;
    document.getElementById('amount').value = expenseData.amount;
    document.getElementById('payment_status').value = expenseData.payment_status;
    document.getElementById('payment_mode').value = expenseData.mode_of_payment;
    document.getElementById('bill_date').value = expenseData.bill_date.split('T')[0];
    document.getElementById('bill_no').value = expenseData.bill_no;
    document.getElementById('transaction_no').value = expenseData.transaction_no;

    // Handle GST fields if present
    if (expenseData.gst_percentage) {
      console.log('💰 GST details found:', {
        percentage: expenseData.gst_percentage,
        amount: expenseData.gst_amount,
        total: expenseData.total_amount
      });
      
      document.getElementById('withGST').checked = true;
      document.getElementById('gstCalculationFields').style.display = 'block';
      document.getElementById('gstPercentage').value = expenseData.gst_percentage;
      document.getElementById('gstAmount').value = expenseData.gst_amount;
      document.getElementById('totalAmount').value = expenseData.total_amount;
    }

    // Check for vendor_id and fetch vendor details if present
    if (expenseData.vendor_id) {
      console.log('🏢 Vendor ID found:', expenseData.vendor_id);
      await handleVendorSelection(expenseData.vendor_id);
    }

    // Fetch all vendors
    const vendorsResponse = await fetch('https://backend.bninewdelhi.com/api/getallvendors');
    const vendors = await vendorsResponse.json();
    console.log('📦 Fetched vendors:', vendors);

    // Create dropdown for company name field
    const companyNameField = document.getElementById('vendor_company_name');
    const companyNameDropdown = document.createElement('select');
    companyNameDropdown.className = 'form-control';
    companyNameDropdown.id = 'vendor_company_dropdown';
    companyNameDropdown.innerHTML = '<option value="">Select Vendor</option>';
    
    // Create input field for company name
    const companyNameInput = document.createElement('input');
    companyNameInput.type = 'text';
    companyNameInput.className = 'form-control';
    companyNameInput.id = 'vendor_company_name';
    companyNameInput.readOnly = true;
    
    // Add both elements to the parent
    const parentDiv = companyNameField.parentNode;
    parentDiv.appendChild(companyNameDropdown);
    parentDiv.appendChild(companyNameInput);
    companyNameField.remove();
    
    // Make companyNameDropdown globally accessible
    window.companyNameDropdown = companyNameDropdown;
    
    console.log('✅ Created company name dropdown and input');

    // Populate dropdown with vendors
    vendors.forEach(vendor => {
      const option = document.createElement('option');
      option.value = vendor.vendor_id;
      option.textContent = `${vendor.vendor_name} - ${vendor.vendor_company_name}`;
      companyNameDropdown.appendChild(option);
    });

    // Add event listener for vendor selection
    companyNameDropdown.addEventListener('change', function() {
      const selectedVendorId = this.value;
      console.log('🔍 Selected vendor ID:', selectedVendorId);

      if (selectedVendorId) {
        const selectedVendor = vendors.find(v => v.vendor_id == selectedVendorId);
        console.log('📦 Selected vendor data:', selectedVendor);

        if (selectedVendor) {
          // Set company name in input field
          companyNameInput.value = selectedVendor.vendor_company_name || '';
          
          // Populate all vendor fields
          document.getElementById('vendor_company_address').value = selectedVendor.vendor_company_address || '';
          document.getElementById('vendor_phone').value = selectedVendor.phone_number || '';
          document.getElementById('vendor_email').value = selectedVendor.email_id || '';
          document.getElementById('vendor_company_gst').value = selectedVendor.vendor_company_gst || '';
          document.getElementById('vendor_bank_name').value = selectedVendor.vendor_bank_name || '';
          document.getElementById('vendor_account').value = selectedVendor.vendor_account || '';
          document.getElementById('vendor_ifsc_code').value = selectedVendor.vendor_ifsc_code || '';
          document.getElementById('vendor_account_type').value = selectedVendor.vendor_account_type || '';

          // Show vendor details section
          document.getElementById('vendorDetailsSection').style.display = 'block';
          console.log('✅ Vendor details populated and section shown');
        }
      } else {
        // Clear all fields if no vendor selected
        companyNameInput.value = '';
        document.getElementById('vendor_company_address').value = '';
        document.getElementById('vendor_phone').value = '';
        document.getElementById('vendor_email').value = '';
        document.getElementById('vendor_company_gst').value = '';
        document.getElementById('vendor_bank_name').value = '';
        document.getElementById('vendor_account').value = '';
        document.getElementById('vendor_ifsc_code').value = '';
        document.getElementById('vendor_account_type').value = '';

        // Hide vendor details section
        document.getElementById('vendorDetailsSection').style.display = 'none';
        console.log('❌ Vendor details cleared');
      }
    });

    // If there's an existing vendor, select it
    if (expenseData.vendor_id) {
      companyNameDropdown.value = expenseData.vendor_id;
      const selectedVendor = vendors.find(v => v.vendor_id == expenseData.vendor_id);
      if (selectedVendor) {
        companyNameInput.value = selectedVendor.vendor_company_name || '';
      }
      console.log('🏢 Selected existing vendor:', companyNameDropdown.options[companyNameDropdown.selectedIndex]?.text);
    }

    // Check for hotel_id and fetch hotel details if present
    if (expenseData.hotel_id) {
      console.log('🏨 Hotel ID found:', expenseData.hotel_id);
      await handleHotelSelection(expenseData.hotel_id);
    }

    hideLoader();
  } catch (error) {
    console.error('❌ Error fetching expense details:', error);
    hideLoader();
    Swal.fire('Error', 'Failed to fetch expense details', 'error');
  }
};

// Function to handle vendor selection
async function handleVendorSelection(vendorId) {
  try {
    console.log('🔍 Fetching vendor details for ID:', vendorId);
    const response = await fetch('https://backend.bninewdelhi.com/api/getallvendors');
    if (!response.ok) throw new Error('Failed to fetch vendors');
    
    const vendors = await response.json();
    const vendorData = vendors.find(vendor => vendor.vendor_id == vendorId);
    
    if (!vendorData) {
      throw new Error('Vendor not found');
    }

    console.log('🏢 Fetched vendor data:', vendorData);

    // Populate vendor details
    document.getElementById('vendor_company_name').value = vendorData.vendor_company_name || '';
    document.getElementById('vendor_company_address').value = vendorData.vendor_company_address || '';
    document.getElementById('vendor_phone').value = vendorData.phone_number || '';
    document.getElementById('vendor_email').value = vendorData.email_id || '';
    document.getElementById('vendor_company_gst').value = vendorData.vendor_company_gst || '';
    document.getElementById('vendor_bank_name').value = vendorData.vendor_bank_name || '';
    document.getElementById('vendor_account').value = vendorData.vendor_account || '';
    document.getElementById('vendor_ifsc_code').value = vendorData.vendor_ifsc_code || '';
    document.getElementById('vendor_account_type').value = vendorData.vendor_account_type || '';

    // Show vendor details section
    document.getElementById('vendorDetailsSection').style.display = 'block';
    console.log('✅ Vendor details populated and section shown');
  } catch (error) {
    console.error('❌ Error handling vendor selection:', error);
    Swal.fire('Error', 'Failed to fetch vendor details', 'error');
  }
}

// Function to handle GST checkbox change
function handleGSTCheckboxChange() {
  const gstCalculationFields = document.getElementById('gstCalculationFields');
  const withGST = document.getElementById('withGST').checked;

  if (withGST) {
    gstCalculationFields.style.display = 'block';
    calculateGST();
    console.log('✅ GST calculation fields shown');
  } else {
    gstCalculationFields.style.display = 'none';
    document.getElementById('gstAmount').value = '';
    document.getElementById('totalAmount').value = document.getElementById('amount').value;
    console.log('❌ GST calculation fields hidden');
  }
}

// Function to calculate GST
function calculateGST() {
  const amount = parseFloat(document.getElementById('amount').value) || 0;
  const gstPercentage = parseFloat(document.getElementById('gstPercentage').value) || 18;
  
  const gstAmount = (amount * gstPercentage) / 100;
  const totalAmount = amount + gstAmount;

  document.getElementById('gstAmount').value = gstAmount.toFixed(2);
  document.getElementById('totalAmount').value = totalAmount.toFixed(2);

  console.log('💰 GST Calculation:', {
    amount,
    gstPercentage,
    gstAmount,
    totalAmount
  });
}

// Function to handle form submission
async function handleUpdateExpense(event) {
  event.preventDefault();

  try {
    showLoader();
    const form = document.getElementById('editExpenseForm');
    const formData = new FormData(form);
    const expenseId = new URLSearchParams(window.location.search).get('expense_id');

    // Get the selected expense type
    const expenseTypeSelect = document.getElementById('expense_type');
    const selectedExpenseType = expenseTypeSelect.options[expenseTypeSelect.selectedIndex].textContent;

    // Handle vendor_id and hotel_id based on expense type
    if (selectedExpenseType === 'Meeting Hotel Expenses') {
      // For hotel expenses, send hotel_id and set vendor_id to null
      const selectedHotelId = document.getElementById('hotel').value;
      if (selectedHotelId) {
        formData.set('hotel_id', selectedHotelId);
        formData.set('vendor_id', 'null'); // Set vendor_id to null
        formData.set('vendor', 'null'); // Also set vendor to null
        console.log('📤 Sending hotel_id:', selectedHotelId);
        console.log('📤 Setting vendor_id and vendor to null');
      }
    } else {
      // For other expenses, send vendor_id and set hotel_id to null
      // const selectedVendorId = document.getElementById('vendor').value;
      const selectedVendorId = window.companyNameDropdown.value;
      if (selectedVendorId) {
        formData.set('vendor_id', selectedVendorId);
        formData.set('vendor',selectedVendorId);
        formData.set('hotel_id', 'null'); // Set hotel_id to null
        console.log('📤 Sending vendor_id:', selectedVendorId);
        console.log('📤 Setting hotel_id to null');
      }
    }

    // Log all form data for debugging
    console.log('📦 Form Data being sent:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    // API call to update expense
    console.log('🚀 Sending PUT request to update expense:', expenseId);
    const response = await fetch(`https://backend.bninewdelhi.com/api/expense/${expenseId}`, {
      method: 'PUT',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to update expense:', errorText);
      throw new Error('Failed to update expense');
    }

    const result = await response.json();
    console.log('✅ Update response:', result);

    Swal.fire({
      title: 'Success!',
      text: 'Expense updated successfully',
      icon: 'success'
    }).then(() => {
      window.location.href = '/rexp/view-expenses';
    });  

  } catch (error) {
    console.error('❌ Error updating expense:', error);
    Swal.fire('Error', 'Failed to update expense', 'error');
  } finally {
    hideLoader();
  }
}

// Function to handle hotel selection
async function handleHotelSelection(hotelId) {
  try {
    console.log('🔍 Fetching hotel details for ID:', hotelId);
    const response = await fetch('https://backend.bninewdelhi.com/api/gethotels');
    if (!response.ok) throw new Error('Failed to fetch hotels');
    
    const hotels = await response.json();
    const hotelData = hotels.find(hotel => hotel.hotel_id == hotelId);
    
    if (!hotelData) {
      throw new Error('Hotel not found');
    }

    console.log('🏨 Fetched hotel data:', hotelData);

    // Show hotel section
    document.getElementById('hotelSection').style.display = 'block';

    // Populate hotel dropdown
    const hotelSelect = document.getElementById('hotel');
    hotelSelect.innerHTML = '<option value="">Select Hotel</option>';
    hotels.forEach(hotel => {
      const option = document.createElement('option');
      option.value = hotel.hotel_id;
      option.textContent = hotel.hotel_name;
      hotelSelect.appendChild(option);
    });

    // Select the matching hotel
    if (hotelId) {
      hotelSelect.value = hotelId;
      console.log('🏨 Selected hotel:', hotelSelect.options[hotelSelect.selectedIndex].text);
    }

    // Show hotel details section and populate fields
    document.getElementById('hotelDetailsSection').style.display = 'block';
    
    // Populate hotel details fields
    document.getElementById('bank_name').value = hotelData.bank_name || '';
    document.getElementById('ifsc_code').value = hotelData.ifsc_code || '';
    document.getElementById('account_no').value = hotelData.account_no || '';
    document.getElementById('account_type').value = hotelData.account_type || '';
    document.getElementById('hotel_gst').value = hotelData.hotel_gst || '';

    console.log('✅ Hotel details populated and section shown');
  } catch (error) {
    console.error('❌ Error handling hotel selection:', error);
    Swal.fire('Error', 'Failed to fetch hotel details', 'error');
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Page loaded');
  
  // Get expense ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const expenseId = urlParams.get('expense_id');
  
  if (!expenseId) {
    console.error('❌ No expense ID found in URL');
    Swal.fire('Error', 'No expense ID provided', 'error');
    return;
  }

  // Fetch and populate expense details
  await fetchExpenseDetails(expenseId);

  // Add event listeners
  document.getElementById('withGST').addEventListener('change', handleGSTCheckboxChange);
  document.getElementById('amount').addEventListener('input', calculateGST);
  document.getElementById('gstPercentage').addEventListener('change', calculateGST);
  document.getElementById('editExpenseForm').addEventListener('submit', handleUpdateExpense);

  // Add event listener for hotel selection
  document.getElementById('hotel').addEventListener('change', async function() {
    const selectedHotelId = this.value;
    if (selectedHotelId) {
      await handleHotelSelection(selectedHotelId);
    } else {
      // Clear hotel details if no hotel is selected
      document.getElementById('hotelDetailsSection').style.display = 'none';
      document.getElementById('bank_name').value = '';
      document.getElementById('ifsc_code').value = '';
      document.getElementById('account_no').value = '';
      document.getElementById('account_type').value = '';
      document.getElementById('hotel_gst').value = '';
    }
  });
});
