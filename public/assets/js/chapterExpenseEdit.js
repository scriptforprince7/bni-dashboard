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
    const vendorSelect = document.getElementById('vendor');
    vendorSelect.innerHTML = '<option value="">Select Vendor</option>';
    vendors.forEach(vendor => {
      const option = document.createElement('option');
      option.value = vendor.vendor_id;
      option.textContent = vendor.vendor_name + ' - ' + vendor.vendor_company_name;
      vendorSelect.appendChild(option);
    });
    if (expenseData.vendor_id) {
      vendorSelect.value = expenseData.vendor_id;
      console.log('🏢 Selected vendor:', vendorSelect.options[vendorSelect.selectedIndex]?.text);
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
    document.getElementById('vendor_name').value = vendorData.vendor_name || '';
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

    // Explicitly set chapter and vendor IDs (in case select fields are repopulated)
    const chapterSelect = document.getElementById('chapter');
    if (chapterSelect && chapterSelect.value) {
      formData.set('chapter', chapterSelect.value);
      console.log('🟢 Chapter ID:', chapterSelect.value);
    }

    const vendorSelect = document.getElementById('vendor');
    if (vendorSelect && vendorSelect.value) {
      formData.set('vendor', vendorSelect.value);
      console.log('🟢 Vendor ID:', vendorSelect.value);
    }

    // Add GST fields if applicable
    if (document.getElementById('withGST').checked) {
      formData.set('withGST', true);
      formData.set('gst_percentage', document.getElementById('gstPercentage').value);
      formData.set('gst_amount', document.getElementById('gstAmount').value);
      formData.set('total_amount', document.getElementById('totalAmount').value);
      console.log('🟢 GST included:', {
        gst_percentage: document.getElementById('gstPercentage').value,
        gst_amount: document.getElementById('gstAmount').value,
        total_amount: document.getElementById('totalAmount').value
      });
    } else {
      formData.set('withGST', false);
      console.log('🟡 GST not included');
    }

    // If vendor_id is present, append all vendor fields to formData
    const vendorId = document.getElementById('vendor')?.value;
    if (vendorId) {
      formData.set('vendor_id', vendorId);
      formData.set('vendor_name', document.getElementById('vendor_name')?.value || '');
      formData.set('vendor_company_name', document.getElementById('vendor_company_name')?.value || '');
      formData.set('vendor_company_address', document.getElementById('vendor_company_address')?.value || '');
      formData.set('vendor_company_gst', document.getElementById('vendor_company_gst')?.value || '');
      formData.set('vendor_account', document.getElementById('vendor_account')?.value || '');
      formData.set('vendor_bank_name', document.getElementById('vendor_bank_name')?.value || '');
      formData.set('vendor_ifsc_code', document.getElementById('vendor_ifsc_code')?.value || '');
      formData.set('vendor_account_type', document.getElementById('vendor_account_type')?.value || '');
      formData.set('phone_number', document.getElementById('vendor_phone')?.value || '');
      formData.set('email_id', document.getElementById('vendor_email')?.value || '');
      console.log('🟢 Sending vendor update fields with expense:', {
        vendor_id: vendorId,
        vendor_name: document.getElementById('vendor_name')?.value,
        vendor_company_name: document.getElementById('vendor_company_name')?.value,
        // ...etc
      });
    }

    // Log all form data for debugging
    for (let [key, value] of formData.entries()) {
      console.log(`📦 FormData: ${key} = ${value}`);
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
      window.location.href = '/exp/manage-expenses';
        });

    } catch (error) {
    console.error('❌ Error updating expense:', error);
    Swal.fire('Error', 'Failed to update expense', 'error');
    } finally {
      hideLoader();
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
});
