// Function to show the loader
function showLoader() {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "flex";
}

// Function to hide the loader
function hideLoader() {
  const loader = document.getElementById("loader");
  if (loader) loader.style.display = "none";
}

// Function to format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
}

// Fallback toast function
function showToast(type, message) {
  if (window.toast && typeof window.toast[type] === 'function') {
    window.toast[type](message);
  } else {
    console.log(`${type}: ${message}`);
    // Fallback to alert for critical errors
    if (type === 'error') {
      alert(message);
    }
  }
}

document.addEventListener("DOMContentLoaded", async function() {
  const urlParams = new URLSearchParams(window.location.search);
  const universalLinkId = urlParams.get("id");

  if (!universalLinkId) return;

  try {
    showLoader();

    const responses = await fetch(
      "https://backend.bninewdelhi.com/api/universalLinks"
    );
    const data = await responses.json();
    console.log("Fetched data:", data);

    // Ensure both id values are strings for comparison
    const link = data.find(link => String(link.id) === String(universalLinkId)); // Use String() for strict comparison
    console.log("Link found:", link);

    if (link) {
      // If a matching link is found, update the page title with its name
      document.getElementById("universal-link-name").textContent =
        "Make invoice for " + link.universal_link_name;
    } else {
      // If no matching link is found
      document.getElementById("universal-link-name").textContent =
        "Universal Link not found";
    }
    // Fetch regions
    const regionResponse = await fetch(
      "https://backend.bninewdelhi.com/api/regions"
    );
    const regions = await regionResponse.json();

    // Fetch chapters
    const chapterResponse = await fetch(
      "https://backend.bninewdelhi.com/api/chapters"
    );
    const chapters = await chapterResponse.json();

    // Fetch members
    const memberResponse = await fetch(
      "https://backend.bninewdelhi.com/api/members"
    );
    const members = await memberResponse.json();

    const regionDropdown = document.getElementById("regionDropdown");
    const regionDropdownBtn = document.getElementById("regionDropdownBtn");
    const chapterDropdown = document.getElementById("chapterDropdown");
    const chapterDropdownBtn = document.getElementById("chapterDropdownBtn");
    const memberDropdown = document.getElementById("company-name");
    
    // Kitty bill info container
    const kittyBillInfo = document.getElementById("kitty-bill-info");
    const billStatus = document.getElementById("bill-status");
    const openingBalance = document.getElementById("opening-balance");
    const creditAmount = document.getElementById("credit-amount");
    
    // Chapter selection message
    const chapterSelectionMessage = document.getElementById("chapter-selection-message");
    
    // Initialize kitty bill related elements
    const kittyBillType = document.getElementById("kitty-bill-type");
    const noKittyBillMessage = document.getElementById("no-kitty-bill-message");
    const paymentTypeOptions = document.getElementById("payment-type-options");
    const kittyBillParticulars = document.getElementById("kitty-bill-particulars");

    // Hide all kitty bill related sections initially
    kittyBillType.style.display = "none";
    kittyBillInfo.style.display = "none";
    noKittyBillMessage.style.display = "none";
    paymentTypeOptions.style.display = "none";
    if (kittyBillParticulars) kittyBillParticulars.style.display = "none";

    // Only show chapter selection message for meeting payments
    if (universalLinkId === "4") {
      chapterSelectionMessage.style.display = "block";
    } else {
      chapterSelectionMessage.style.display = "none";
    }

    // Populate region dropdown
    regions.forEach(region => {
      const regionItem = document.createElement("li");
      const regionLink = document.createElement("a");
      regionLink.className = "dropdown-item";
      regionLink.href = "javascript:void(0);";
      regionLink.textContent = region.region_name;
      regionLink.dataset.regionId = region.region_id;

      // Handle region selection
      regionLink.addEventListener("click", function() {
        regionDropdownBtn.innerHTML = `<i class="ti ti-sort-descending-2 me-1"></i> ${region.region_name}`;
        selectedRegionId = region.region_id;  // Store the region ID
        console.log("🌍 Selected Region:", {
          name: region.region_name,
          id: selectedRegionId
        });
        updateChapterDropdown(selectedRegionId, chapters);
      });
      

      regionItem.appendChild(regionLink);
      regionDropdown.appendChild(regionItem);
    });

    // Add "All Regions" option
    const allRegionsItem = document.createElement("li");
    const allRegionsLink = document.createElement("a");
    allRegionsLink.className = "dropdown-item";
    allRegionsLink.href = "javascript:void(0);";
    allRegionsLink.textContent = "All Regions";

    allRegionsLink.addEventListener("click", function() {
      regionDropdownBtn.innerHTML = `<i class="ti ti-sort-descending-2 me-1"></i> Choose Region`;
      updateChapterDropdown(null, chapters);
    });

    allRegionsItem.appendChild(allRegionsLink);
    regionDropdown.prepend(allRegionsItem);

    // Function to update chapters dropdown
    function updateChapterDropdown(regionId, allChapters) {
      chapterDropdown.innerHTML = "";
      chapterDropdownBtn.innerHTML = `<i class="ti ti-sort-descending-2 me-1"></i> Choose Chapter`;

      const filteredChapters = regionId
        ? allChapters.filter(chap => chap.region_id == regionId)
        : allChapters;

      filteredChapters.forEach(chapter => {
        const chapterItem = document.createElement("li");
        const chapterLink = document.createElement("a");
        chapterLink.className = "dropdown-item";
        chapterLink.href = "javascript:void(0);";
        chapterLink.textContent = chapter.chapter_name;
        chapterLink.dataset.chapterId = chapter.chapter_id;

        // Handle chapter selection
        chapterLink.addEventListener("click", async function() {
          chapterDropdownBtn.innerHTML = `<i class="ti ti-sort-descending-2 me-1"></i> ${chapter.chapter_name}`;
          selectedChapterId = chapter.chapter_id;  // Store the chapter ID
          console.log("🏢 Selected Chapter:", {
            name: chapter.chapter_name,
            id: selectedChapterId
          });
          
          // Only show kitty bill related sections for meeting payments
          if (universalLinkId === "4") {
            // Hide chapter selection message
            chapterSelectionMessage.style.display = "none";
            
            // Show payment type options
            paymentTypeOptions.style.display = "block";
            
            // Fetch kitty bill data for the selected chapter
            await fetchKittyBillData(selectedChapterId);
          }
          
          updateMemberDropdown(selectedChapterId, members);
        });
        

        chapterItem.appendChild(chapterLink);
        chapterDropdown.appendChild(chapterItem);
      });
    }

    // Function to fetch kitty bill data
    async function fetchKittyBillData(chapterId) {
      try {
        showLoader();
        const response = await fetch("https://backend.bninewdelhi.com/api/getKittyPayments");
        const kittyBills = await response.json();
        
        // Find the current kitty bill for the selected chapter
        const currentKittyBill = kittyBills.find(bill => 
          bill.chapter_id == chapterId && 
          bill.delete_status == 0
        );
        
        // Get elements
        const kittyBillType = document.getElementById("kitty-bill-type");
        const kittyBillInfo = document.getElementById("kitty-bill-info");
        const kittyBillParticulars = document.getElementById("kitty-bill-particulars");
        const noKittyBillMessage = document.getElementById("no-kitty-bill-message");
        
        if (currentKittyBill) {
          // Display kitty bill type at the top
          kittyBillType.style.display = "block";
          kittyBillType.dataset.billId = currentKittyBill.kitty_bill_id;
          
          // Display detailed kitty bill info at the top
          kittyBillInfo.style.display = "block";
          kittyBillInfo.dataset.billId = currentKittyBill.kitty_bill_id;
          
          // Display simplified kitty bill info in particulars
          if (kittyBillParticulars) {
            kittyBillParticulars.style.display = "block";
          }
          
          // Hide no kitty bill message
          noKittyBillMessage.style.display = "none";
          
          // Format dates
          const paymentDate = new Date(currentKittyBill.payment_date).toLocaleDateString();
          const dueDate = new Date(currentKittyBill.kitty_due_date).toLocaleDateString();
          const raisedDate = new Date(currentKittyBill.raised_on).toLocaleDateString();
          
          // Update bill status
          const today = new Date();
          const dueDateObj = new Date(currentKittyBill.kitty_due_date);
          let statusText = "Active";
          let statusClass = "text-success";
          
          if (today > dueDateObj) {
            statusText = "Overdue";
            statusClass = "text-danger";
          }
          
          // Update bill type at the top
          document.getElementById("bill-type").textContent = currentKittyBill.bill_type || "Regular";
          
          // Update detailed bill info at the top
          document.getElementById("bill-description").textContent = currentKittyBill.description || "No description available";
          document.getElementById("bill-amount").textContent = formatCurrency(currentKittyBill.total_bill_amount);
          document.getElementById("bill-due-date").textContent = dueDate;
          document.getElementById("bill-penalty").textContent = formatCurrency(currentKittyBill.penalty_fee);
          document.getElementById("bill-status").innerHTML = `<span class="${statusClass}">${statusText}</span>`;
          
          // Update simplified bill info in particulars
          if (kittyBillParticulars) {
            document.getElementById("particulars-bill-type").textContent = currentKittyBill.bill_type || "Regular";
            document.getElementById("particulars-bill-description").textContent = currentKittyBill.description || "No description available";
          }
          
          // Set the bill amount as the default value for the invoice
          document.getElementById("rate").value = `₹ ${currentKittyBill.total_bill_amount}`;
          document.getElementById("price").value = `₹ ${currentKittyBill.total_bill_amount}`;
          document.getElementById("taxable-total-amount").value = `₹ ${currentKittyBill.total_bill_amount}`;
          
          // Calculate GST (18%)
          const gstAmount = (parseFloat(currentKittyBill.total_bill_amount) * 0.18).toFixed(2);
          const cgstAmount = (gstAmount / 2).toFixed(2);
          const sgstAmount = (gstAmount / 2).toFixed(2);
          
          document.getElementById("cgst_amount").value = `₹ ${cgstAmount}`;
          document.getElementById("sgst_amount").value = `₹ ${sgstAmount}`;
          
          // Calculate grand total
          const grandTotal = (parseFloat(currentKittyBill.total_bill_amount) + parseFloat(gstAmount)).toFixed(2);
          document.getElementById("grand_total").value = `₹ ${grandTotal}`;
          
          console.log("💰 Kitty Bill Details:", currentKittyBill);
        } else {
          // No kitty bill found
          kittyBillType.style.display = "none";
          kittyBillInfo.style.display = "none";
          if (kittyBillParticulars) kittyBillParticulars.style.display = "none";
          noKittyBillMessage.style.display = "block";
          showToast('info', "No kitty bill found for this chapter");
        }
      } catch (error) {
        console.error("Error fetching kitty bill data:", error);
        showToast('error', "Error fetching kitty bill data");
      } finally {
        hideLoader();
      }
    }

    // Function to update members dropdown
    function updateMemberDropdown(chapterId, allMembers) {
      const memberDropdown = document.getElementById("company-name");
      memberDropdown.innerHTML = `<option selected>Select Member</option>`;

      const filteredMembers = allMembers.filter(member => member.chapter_id == chapterId);
      
      console.log("👥 Available Members:", filteredMembers.map(member => ({
        id: member.member_id,
        name: `${member.member_first_name} ${member.member_last_name}`,
        company: member.member_company_name
      })));

      filteredMembers.forEach(member => {
        const option = document.createElement("option");
        option.value = member.member_id;
        option.textContent = `${member.member_first_name} ${member.member_last_name}`;
        // Store full details in dataset
        option.dataset.firstName = member.member_first_name;
        option.dataset.lastName = member.member_last_name;
        option.dataset.address = member.street_address_line_1;
        option.dataset.companyName = member.member_company_name;
        option.dataset.phoneNumber = member.member_phone_number;
        option.dataset.gstNumber = member.member_gst_number;
        
        memberDropdown.appendChild(option);
      });

      // Add event listener for dropdown selection
      memberDropdown.addEventListener("change", function() {
        const selectedOption =
          memberDropdown.options[memberDropdown.selectedIndex];

        if (selectedOption.value !== "Select Member") {
          document.getElementById("member_address").value =
            selectedOption.dataset.address || "";
          document.getElementById("member_company_name").value =
            selectedOption.dataset.companyName || "";
          document.getElementById("member_phone_number").value =
            selectedOption.dataset.phoneNumber || "";
          document.getElementById("member_gst_number").value =
            selectedOption.dataset.gstNumber || "";
        } else {
          // Clear fields if no member is selected
          document.getElementById("member_address").value = "";
          document.getElementById("member_company_name").value = "";
          document.getElementById("member_phone_number").value = "";
          document.getElementById("member_gst_number").value = "";
        }
      });
    }
    // Show all chapters by default
    updateChapterDropdown(null, chapters);

    // Fetch company data
    const companyResponse = await fetch(
      "https://backend.bninewdelhi.com/api/company"
    );
    const companies = await companyResponse.json();

    const companyDropdown = document.querySelector(".company_info");
    const companyAddress = document.getElementById("company-address");
    const companyMail = document.getElementById("company-mail");
    const companyPhone = document.getElementById("company-phone");
    const companyGst = document.getElementById("company-gst");

    // Populate company dropdown
    companies.forEach(company => {
      const companyOption = document.createElement("option");
      companyOption.value = company.company_id; // Assuming there's a company_id field
      companyOption.textContent = company.company_name; // Assuming there's a company_name field
      companyDropdown.appendChild(companyOption);
    });

    // Event listener to update fields on company selection
    companyDropdown.addEventListener("change", function() {
      const selectedCompany = companies.find(c => c.company_id == this.value);
      if (selectedCompany) {
        companyAddress.value = selectedCompany.company_address || "";
        companyMail.value = selectedCompany.company_email || "";
        companyPhone.value = selectedCompany.company_phone || "";
        companyGst.value = selectedCompany.company_gst || "";
      } else {
        // Clear fields if no company is selected
        companyAddress.value = "";
        companyMail.value = "";
        companyPhone.value = "";
        companyGst.value = "";
      }
    });
    // Fetch universal link data
    const response = await fetch(
      "https://backend.bninewdelhi.com/api/universalLinks"
    );
    const universalLinks = await response.json();

    const selectedLink = universalLinks.find(
      link => link.id == universalLinkId
    );

    if (!selectedLink) return;

    // If ID is 3, fetch training data and populate the dropdown
    if (selectedLink.id == 3) {
      const trainingResponse = await fetch(
        "https://backend.bninewdelhi.com/api/allTrainings"
      );
      const trainings = await trainingResponse.json();
      console.log("📋 Available Trainings:", trainings);

      const particularsField = document.getElementById("particulars");

      if (particularsField) {
        const selectElement = document.createElement("select");
        selectElement.className = "form-control form-control-light";
        selectElement.name = "particulars";
        selectElement.id = "particulars";

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Select Training";
        defaultOption.selected = true;
        defaultOption.disabled = true;
        selectElement.appendChild(defaultOption);

        trainings.forEach(training => {
          const option = document.createElement("option");
          // Store both training_id and price as JSON in value
          option.value = JSON.stringify({
            id: training.training_id,
            price: training.training_price
          });
          option.textContent = training.training_name;
          selectElement.appendChild(option);
        });

        particularsField.parentNode.replaceChild(
          selectElement,
          particularsField
        );

        selectElement.addEventListener("change", function() {
          const selectedData = JSON.parse(this.value);
          const selectedTraining = trainings.find(t => t.training_id === selectedData.id);
          const selectedTrainingPrice = parseFloat(selectedData.price) || 0;

          console.log("📚 Selected Training Details:", {
            trainingId: selectedData.id,
            name: selectedTraining.training_name,
            price: selectedTrainingPrice,
            fullDetails: selectedTraining
          });

          document.getElementById("rate").value = `₹ ${selectedTrainingPrice.toFixed(2)}`;
          document.getElementById("price").value = `₹ ${selectedTrainingPrice.toFixed(2)}`;
          document.getElementById("taxable-total-amount").value = `₹ ${selectedTrainingPrice.toFixed(2)}`;

          const totalTax = selectedTrainingPrice * 0.18; // 18% GST
          const cgstAmount = totalTax / 2;
          const sgstAmount = totalTax / 2;

          document.getElementById("cgst_amount").value = `₹ ${cgstAmount.toFixed(2)}`;
          document.getElementById("sgst_amount").value = `₹ ${sgstAmount.toFixed(2)}`;

          const grandTotal = selectedTrainingPrice + totalTax;
          document.getElementById("grand_total").value = `₹ ${grandTotal.toFixed(2)}`;

          console.log("💰 Training Price Calculations:", {
            trainingId: selectedData.id,
            basePrice: selectedTrainingPrice,
            totalTax: totalTax,
            cgst: cgstAmount,
            sgst: sgstAmount,
            grandTotal: grandTotal
          });
        });
      }
    }

    // Meeting Payment Specific Logic (universal_link_id = 4)
    if (universalLinkId === "4") {
      // Show kitty bill info section
      document.getElementById("kitty-bill-info").style.display = "none";
      
      // Show payment type options
      document.getElementById("payment-type-options").style.display = "block";

      // Handle member selection for meeting payments
      document.getElementById("company-name").addEventListener("change", async function() {
        const selectedMemberId = this.value;
        if (selectedMemberId === "Select Member") return;

        try {
          // Fetch member's kitty data
          const bankOrderResponse = await fetch(`https://backend.bninewdelhi.com/api/getbankOrder`);
          const bankOrderData = await bankOrderResponse.json();
          const memberBankOrder = bankOrderData.find(order => order.member_id === selectedMemberId);

          // Fetch member credits
          const creditResponse = await fetch(`https://backend.bninewdelhi.com/api/getAllMemberCredit`);
          const creditData = await creditResponse.json();
          const memberCredits = creditData.filter(credit => 
            credit.member_id === selectedMemberId && 
            credit.chapter_id === selectedChapterId && 
            credit.is_adjusted === false
          );

          // Calculate total credit amount
          const totalCreditAmount = memberCredits.reduce((sum, credit) => sum + parseFloat(credit.credit_amount), 0);

          // Get current date
          const currentDateResponse = await fetch(`https://backend.bninewdelhi.com/api/getCurrentDate`);
          const currentDate = await currentDateResponse.json();

          // Update UI with kitty bill info
          if (memberBankOrder) {
            const amountToPay = parseFloat(memberBankOrder.amount_to_pay);
            const kittyDueDate = memberBankOrder.kitty_due_date;
            const numberOfLatePayments = memberBankOrder.no_of_late_payment;
            const kittyPenalty = parseFloat(memberBankOrder.kitty_penalty);

            let totalAmount = amountToPay;
            let noOfLatePayment = numberOfLatePayments;
            let penaltyAmount = 0;

            // Apply penalty if due date has passed
            if (kittyDueDate && new Date(kittyDueDate) < new Date(currentDate.currentDate)) {
              totalAmount += kittyPenalty;
              noOfLatePayment += 1;
            } else {
              penaltyAmount = kittyPenalty;
            }

            // Calculate GST
            const gstAmount = (totalAmount * 0.18).toFixed(2);
            const grandTotal = parseFloat(totalAmount) + parseFloat(gstAmount);

            // Update form fields
            document.getElementById("rate").value = `₹ ${totalAmount.toFixed(2)}`;
            document.getElementById("price").value = `₹ ${totalAmount.toFixed(2)}`;
            document.getElementById("taxable-total-amount").value = `₹ ${totalAmount.toFixed(2)}`;
            document.getElementById("cgst_amount").value = `₹ ${(gstAmount/2).toFixed(2)}`;
            document.getElementById("sgst_amount").value = `₹ ${(gstAmount/2).toFixed(2)}`;
            document.getElementById("grand_total").value = `₹ ${grandTotal.toFixed(2)}`;
            document.getElementById("credit-amount").textContent = `₹ ${totalCreditAmount.toFixed(2)}`;
            document.getElementById("opening-balance").textContent = `₹ ${memberBankOrder.opening_balance || "0.00"}`;

            // Store values for later use
            this.dataset.totalAmount = totalAmount;
            this.dataset.gstAmount = gstAmount;
            this.dataset.penaltyAmount = penaltyAmount;
            this.dataset.noOfLatePayment = noOfLatePayment;
            this.dataset.creditAmount = totalCreditAmount;
          }
        } catch (error) {
          console.error("Error fetching member data:", error);
          showToast('error', "Error fetching member data");
        }
      });

      // Handle partial payment calculation
      document.getElementById("partial-amount").addEventListener("input", function() {
        const memberSelect = document.getElementById("company-name");
        const totalAmount = parseFloat(memberSelect.dataset.totalAmount || 0);
        const partialAmount = parseFloat(this.value || 0);

        if (partialAmount > totalAmount) {
          this.value = totalAmount;
          showToast('warning', "Partial amount cannot exceed total amount");
          return;
        }

        const remainingBalance = totalAmount - partialAmount;
        document.getElementById("remaining-balance").value = formatCurrency(remainingBalance);
      });
    }

    // Handle payment method changes
    const paymentMethods = document.getElementsByName('paymentMethod');
    const upiFields = document.getElementById('upiFields');
    const bankFields = document.getElementById('bankFields');
    const chequeFields = document.getElementById('chequeFields');

    paymentMethods.forEach(method => {
      method.addEventListener('change', function() {
        // Hide all payment fields first
        upiFields.style.display = 'none';
        bankFields.style.display = 'none';
        chequeFields.style.display = 'none';

        // Show relevant fields based on selection
        if (this.id === 'upiOption') {
          upiFields.style.display = 'block';
        } else if (this.id === 'bankOption') {
          bankFields.style.display = 'block';
        } else if (this.id === 'chequeOption') {
          chequeFields.style.display = 'block';
        }

        console.log('💳 Payment Method Changed:', this.id);
      });
    });

    // Function to get payment details
    function getPaymentDetails() {
      const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked').id;
      const paymentNote = document.getElementById('payment-note').value;
      let paymentData = {
        mode_of_payment: {}
      };

      switch(selectedMethod) {
        case 'cashOption':
          paymentData.mode_of_payment = {
            cash: {
              payment_note: paymentNote
            }
          };
          break;

        case 'upiOption':
          paymentData.mode_of_payment = {
            upi: {
              upi_id: document.getElementById('upiId').value,
              reference_number: document.getElementById('upiNumber').value,
              payment_note: paymentNote
            }
          };
          break;

        case 'bankOption':
          const transferType = document.querySelector('input[name="bankTransferType"]:checked')?.id;
          paymentData.mode_of_payment = {
            bank_transfer: {
              transfer_type: transferType === 'rtgsOption' ? 'RTGS' : 
                           transferType === 'neftOption' ? 'NEFT' : 
                           transferType === 'impsOption' ? 'IMPS' : '',
              transfer_utr: document.getElementById('transferUTR').value,
              transfer_id: document.getElementById('transferId').value,
              payment_note: paymentNote
            }
          };
          break;

        case 'chequeOption':
          paymentData.mode_of_payment = {
            cheque: {
              cheque_number: document.getElementById('chequeNo').value,
              ifsc_code: document.getElementById('ifscCode').value,
              payment_note: paymentNote
            }
          };
          break;
      }

      console.log('💳 Payment Details:', paymentData);
      return paymentData;
    }

    // Add submit handler for the invoice form
    const submitButton = document.getElementById('submit_invoice');
    if (submitButton) {
      submitButton.addEventListener('click', async function(e) {
        e.preventDefault();
        
        try {
          showLoader();
          
          // Get all form data
          const formData = new FormData();
          
          // Add form fields manually
          formData.append('member_id', document.getElementById('company-name').value);
          formData.append('company_id', document.querySelector('.company_info').value);
          formData.append('date_issued', document.getElementById('invoice-date-issued').value);
          formData.append('particulars', document.getElementById('particulars').value);
          formData.append('rate', document.getElementById('rate').value);
          formData.append('price', document.getElementById('price').value);
          formData.append('taxable_total_amount', document.getElementById('taxable-total-amount').value);
          formData.append('cgst_amount', document.getElementById('cgst_amount').value);
          formData.append('sgst_amount', document.getElementById('sgst_amount').value);
          formData.append('grand_total', document.getElementById('grand_total').value);
          
          // Get payment details
          const paymentData = getPaymentDetails();
          
          // Combine form data with payment data
          const invoiceData = {
            // Add your existing invoice data here
            member_id: formData.get('member_id'),
            company_id: formData.get('company_id'),
            date_issued: formData.get('date_issued'),
            particulars: formData.get('particulars'),
            rate: formData.get('rate'),
            price: formData.get('price'),
            taxable_total_amount: formData.get('taxable_total_amount'),
            cgst_amount: formData.get('cgst_amount'),
            sgst_amount: formData.get('sgst_amount'),
            grand_total: formData.get('grand_total'),
            
            // Add the payment data
            ...paymentData
          };

          console.log('📤 Submitting invoice with data:', invoiceData);

          // Send to your API
          const response = await fetch('your-api-endpoint', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(invoiceData)
          });

          if (!response.ok) {
            throw new Error('Failed to create invoice');
          }

          const result = await response.json();
          console.log('✅ Invoice created successfully:', result);

          // Show success message
          Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Invoice created successfully',
            showConfirmButton: false,
            timer: 1500
          });

          // Redirect or refresh as needed
          setTimeout(() => {
            window.location.href = '/your-redirect-path';
          }, 1500);

        } catch (error) {
          console.error('❌ Error creating invoice:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to create invoice. Please try again.'
          });
        } finally {
          hideLoader();
        }
      });
    }
  } catch (error) {
    console.error("Error:", error);
    showToast('error', "An error occurred while loading data");
  } finally {
    hideLoader();
  }
});

// -------- send data to the backend --------

let selectedRegionId = null;  // Global variables to store IDs
let selectedChapterId = null;

document.getElementById("submit_invoice").addEventListener("click", async function() {
    showLoader();

    try {
        const universalLinkId = new URLSearchParams(window.location.search).get("id");
        const memberSelect = document.getElementById("company-name");
        const selectedOption = memberSelect.options[memberSelect.selectedIndex];

        if (!selectedOption || selectedOption.value === "Select Member") {
            showToast('warning', "Please select a member first");
            return;
        }

        // Get payment method details
        const paymentDetails = getPaymentDetails();

        // Build invoice data
        let invoiceData = {
            region_id: selectedRegionId,
            chapter_id: selectedChapterId,
            universal_link_id: universalLinkId,
            date_issued: document.getElementById("invoice-date-issued").value,
            member_id: selectedOption.value,
            member_first_name: selectedOption.dataset.firstName,
            member_last_name: selectedOption.dataset.lastName,
            member_address: document.getElementById("member_address").value,
            member_company_name: document.getElementById("member_company_name").value,
            member_phone_number: document.getElementById("member_phone_number").value,
            member_gst_number: document.getElementById("member_gst_number").value,
            mode_of_payment: paymentDetails.mode_of_payment
        };

        // Add meeting payment specific data if universal_link_id is 4
        if (universalLinkId === "4") {
            // Get selected payment type
            const selectedPaymentType = document.querySelector('input[name="paymentType"]:checked').value;
            const totalAmount = parseFloat(memberSelect.dataset.totalAmount || 0);
            const gstAmount = parseFloat(memberSelect.dataset.gstAmount || 0);
            const creditAmount = parseFloat(memberSelect.dataset.creditAmount || 0);
            const penaltyAmount = parseFloat(memberSelect.dataset.penaltyAmount || 0);
            const noOfLatePayment = parseInt(memberSelect.dataset.noOfLatePayment || 0);

            let amountToPay = totalAmount;
            let memberPendingBalance = 0;
            let paymentType = "full";

            if (selectedPaymentType === "partial") {
                amountToPay = parseFloat(document.getElementById("partial-amount").value || 0);
                memberPendingBalance = totalAmount - amountToPay;
                paymentType = "partial";
            } else if (selectedPaymentType === "advance") {
                amountToPay = parseFloat(document.getElementById("advance-amount").value || 0);
                paymentType = "advance";
                
                // Add advance payment specific data
                invoiceData.advance_payment = {
                    amount: amountToPay
                };
            }

            // Adjust for credits
            const finalAmount = Math.max(0, amountToPay - creditAmount);

            Object.assign(invoiceData, {
                kitty_bill_id: document.getElementById("kitty-bill-info").dataset.billId || "",
                member_pending_balance: memberPendingBalance,
                total_amount_paid: finalAmount,
                tax: gstAmount,
                penalty_amount: penaltyAmount,
                no_of_late_payment: noOfLatePayment,
                date_of_update: new Date().toISOString(),
                payment_type: paymentType,
                payment_note: paymentType === "partial" ? "meeting-payments-partial" : 
                             paymentType === "advance" ? "meeting-payments-advance" : 
                             "meeting-payments"
            });
        }

        // Send to backend
        const response = await fetch("backend.bninewdelhi.com/api/add-invoice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(invoiceData)
        });

        const result = await response.json();

        if (response.ok) {
            showToast('success', "Invoice created successfully!");
            // Show success message
            await Swal.fire({
                icon: 'success',
                title: 'Invoice Created Successfully!',
                html: `
                    <div style="text-align: left;">
                        <p><strong>Member:</strong> ${invoiceData.member_first_name} ${invoiceData.member_last_name}</p>
                        <p><strong>Amount:</strong> ₹${invoiceData.total_amount_paid}</p>
                        <p><strong>Order ID:</strong> ${result.order_id}</p>
                    </div>
                `,
                timer: 3000,
                showConfirmButton: true,
                confirmButtonText: 'View Transactions'
            });

            // Redirect to transactions page
            window.location.href = '/t/all-transactions';
        } else {
            throw new Error(result.message || 'Failed to create invoice');
        }
    } catch (error) {
        console.error("Error:", error);
        showToast('error', error.message || "Error creating invoice");
    } finally {
        hideLoader();
    }
});