// Function to show the loader
function showLoader() {
  document.getElementById("loader").style.display = "flex";
}

function hideLoader() {
  document.getElementById("loader").style.display = "none";
}

// Function to format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

// Function to calculate GST
function calculateGST() {
  const amount = parseFloat(document.getElementById('amount').value) || 0;
  const gstPercentage = parseFloat(document.getElementById('gstPercentage').value) || 0;
  const isIGST = document.getElementById('isIGST').checked;
  
  const gstAmount = (amount * gstPercentage) / 100;
  let cgstAmount, sgstAmount, igstAmount;

  if (isIGST) {
    // For IGST, set CGST and SGST to 0 and put full GST amount in IGST
    cgstAmount = 0;
    sgstAmount = 0;
    igstAmount = gstAmount;
  } else {
    // For regular GST, split equally between CGST and SGST
    cgstAmount = gstAmount / 2;
    sgstAmount = gstAmount / 2;
    igstAmount = 0;
  }

  const totalAmount = amount + gstAmount;

  document.getElementById('gstAmount').value = gstAmount.toFixed(2);
  document.getElementById('cgstAmount').value = cgstAmount.toFixed(2);
  document.getElementById('sgstAmount').value = sgstAmount.toFixed(2);
  document.getElementById('igstAmount').value = igstAmount.toFixed(2);
  document.getElementById('totalAmount').value = totalAmount.toFixed(2);
}

// Function to handle GST checkbox change
function handleGSTChange() {
  const withGST = document.getElementById('withGST').checked;
  const gstFields = document.getElementById('gstCalculationFields');
  
  if (withGST) {
    gstFields.style.display = 'block';
    calculateGST();
  } else {
    gstFields.style.display = 'none';
    // Reset GST related fields
    document.getElementById('gstAmount').value = '';
    document.getElementById('cgstAmount').value = '';
    document.getElementById('sgstAmount').value = '';
    document.getElementById('igstAmount').value = '';
    document.getElementById('totalAmount').value = document.getElementById('amount').value || '';
    document.getElementById('isIGST').checked = false;
  }
}

// Function to handle IGST checkbox change
function handleIGSTChange() {
  calculateGST();
}

// Function to initialize the page
async function initializePage() {
  try {
    showLoader();
    console.log("=== Chapter Add Payment Page Initialization Started ===");

    // Get login type and chapter details
    const loginType = getUserLoginType();
    console.log("Detected login type:", loginType);

    let chapterEmail;
    let chapterId;

    if (loginType === "ro_admin") {
      console.log("RO Admin detected, fetching from localStorage...");
      chapterEmail = localStorage.getItem("current_chapter_email");
      chapterId = parseInt(localStorage.getItem("current_chapter_id"));

      if (!chapterEmail || !chapterId) {
        console.error("CRITICAL: Missing localStorage data for RO Admin");
        hideLoader();
        return;
      }
    } else {
      console.log("Regular chapter login detected, getting email from token...");
      chapterEmail = getUserEmail();
    }

    // Fetch chapters
    const chaptersResponse = await fetch("https://backend.bninewdelhi.com/api/chapters");
    const chapters = await chaptersResponse.json();
    console.log("Chapters data received:", chapters.length, "chapters");

    // Find logged in chapter
    let loggedInChapter;
    if (loginType === "ro_admin") {
      loggedInChapter = chapters.find(chapter => chapter.chapter_id === chapterId);
    } else {
      loggedInChapter = chapters.find(chapter =>
        chapter.email_id === chapterEmail ||
        chapter.vice_president_mail === chapterEmail ||
        chapter.president_mail === chapterEmail ||
        chapter.treasurer_mail === chapterEmail
      );
      if (loggedInChapter) {
        chapterId = loggedInChapter.chapter_id;
      }
    }

    // Populate chapter dropdown
    const chapterSelect = document.getElementById('chapter');
    chapters.forEach(chapter => {
      const option = document.createElement('option');
      option.value = chapter.chapter_id;
      option.textContent = chapter.chapter_name;
      chapterSelect.appendChild(option);
    });

    // If logged in chapter found, select and disable the dropdown
    if (loggedInChapter) {
      chapterSelect.value = loggedInChapter.chapter_id;
      if (loginType !== "ro_admin") {
        chapterSelect.disabled = true;
        // Add grey background color for disabled state
        chapterSelect.style.backgroundColor = '#e9ecef';
        chapterSelect.style.cursor = 'not-allowed';
      }
    }

    // Add event listeners
    document.getElementById('withGST').addEventListener('change', handleGSTChange);
    document.getElementById('isIGST').addEventListener('change', handleIGSTChange);
    document.getElementById('amount').addEventListener('input', calculateGST);
    document.getElementById('gstPercentage').addEventListener('change', calculateGST);

    console.log("=== Chapter Add Payment Page Initialization Completed ===");

  } catch (error) {
    console.error("Error initializing page:", error);
    alert("An error occurred while initializing the page.");
  } finally {
    hideLoader();
  }
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePage);

// Add form submission logic
document.addEventListener('DOMContentLoaded', function() {
  const addPaymentForm = document.getElementById('addPaymentForm');
  if (addPaymentForm) {
    addPaymentForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      try {
        showLoader();
        
        // Validate required fields
        const requiredFields = {
          'payment_add_by': 'Payment Add By',
          'payment_description': 'Payment Description',
          'chapter': 'Chapter',
          'amount': 'Amount',
          'payment_date': 'Payment Date',
          'payment_mode': 'Payment Mode'
        };

        for (const [field, label] of Object.entries(requiredFields)) {
          const value = document.getElementById(field)?.value;
          if (!value || value.trim() === '') {
            Swal.fire('Error', `${label} is required`, 'error');
            hideLoader();
            return;
          }
        }

        // Gather GST and other fields
        const withGST = document.getElementById('withGST').checked;
        const isIGST = document.getElementById('isIGST').checked;
        const gstPercentage = document.getElementById('gstPercentage')?.value || '0';
        const gstAmount = document.getElementById('gstAmount')?.value || '0';
        const cgstAmount = document.getElementById('cgstAmount')?.value || '0';
        const sgstAmount = document.getElementById('sgstAmount')?.value || '0';
        const igstAmount = document.getElementById('igstAmount')?.value || '0';
        const totalAmount = withGST ? document.getElementById('totalAmount').value : document.getElementById('amount').value;
        
        // Create FormData object
        const formData = new FormData();
        
        // Add all form fields
        formData.append('payment_add_by', document.getElementById('payment_add_by').value);
        formData.append('payment_description', document.getElementById('payment_description').value);
        formData.append('chapter_id', document.getElementById('chapter').value);
        formData.append('amount', document.getElementById('amount').value);
        formData.append('payment_date', document.getElementById('payment_date').value);
        formData.append('payment_mode', document.getElementById('payment_mode').value);
        formData.append('is_gst', withGST);
        formData.append('gst_percentage', gstPercentage);
        formData.append('gst_amount', gstAmount);
        formData.append('cgst', cgstAmount);
        formData.append('sgst', sgstAmount);
        formData.append('igst', igstAmount);
        formData.append('total_amount', totalAmount);
        formData.append('is_igst', isIGST);

        // Add file if present
        const paymentImg = document.getElementById('upload_payment_photo').files[0];
        if (paymentImg) {
          formData.append('payment_img', paymentImg);
        }

        console.log('Form data being sent:', Object.fromEntries(formData));

        // Send to backend
        const response = await fetch('http://localhost:5000/api/addChapterPayment', {
          method: 'POST',
          body: formData // Do not set Content-Type header, browser will set it automatically with boundary
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to add payment');
        }

        const result = await response.json();
        if (result.success) {
          Swal.fire('Success', 'Payment added successfully!', 'success');
          addPaymentForm.reset();
          document.getElementById('gstCalculationFields').style.display = 'none';
        } else {
          Swal.fire('Error', result.message || 'Failed to add payment', 'error');
        }
      } catch (err) {
        console.error('Error submitting form:', err);
        Swal.fire('Error', err.message || 'An error occurred while submitting the form.', 'error');
      } finally {
        hideLoader();
      }
    });
  } else {
    console.error('Payment form not found in the DOM');
  }
});
