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
            
          // Fetch bank order data for meeting/kitty payments
          if (universalLinkId === "4") {
            fetchBankOrderData(selectedOption.value, selectedChapterId);
          }
        } else {
          // Clear fields if no member is selected
          document.getElementById("member_address").value = "";
          document.getElementById("member_company_name").value = "";
          document.getElementById("member_phone_number").value = "";
          document.getElementById("member_gst_number").value = "";
          
          // Clear payment fields
          document.getElementById("rate").value = "-";
          document.getElementById("price").value = "-";
          document.getElementById("taxable-total-amount").value = "-";
          document.getElementById("cgst_amount").value = "-";
          document.getElementById("sgst_amount").value = "-";
          document.getElementById("grand_total").value = "-";
        }
      });
    }

    // Function to fetch bank order data
    async function fetchBankOrderData(memberId, chapterId) {
      try {
        showLoader();
        const response = await fetch("https://backend.bninewdelhi.com/api/getBankOrder");
        const bankOrders = await response.json();
        
        // Find the bank order for the selected member and chapter
        const bankOrder = bankOrders.find(order => 
          order.member_id == memberId && 
          order.chapter_id == chapterId
        );
        
        if (bankOrder) {
          console.log("💰 Bank Order Data:", bankOrder);
          
          // Store bank order data in the member select element for later use
          const memberSelect = document.getElementById("company-name");
          memberSelect.dataset.bankOrderId = bankOrder.bank_order_id;
          memberSelect.dataset.amountToPay = bankOrder.amount_to_pay;
          memberSelect.dataset.kittyDueDate = bankOrder.kitty_due_date;
          memberSelect.dataset.noOfLatePayment = bankOrder.no_of_late_payment;
          memberSelect.dataset.kittyPenalty = bankOrder.kitty_penalty;
          
          // Calculate amounts
          const amountToPay = parseFloat(bankOrder.amount_to_pay) || 0;
          const gstAmount = amountToPay * 0.18; // 18% GST
          const cgstAmount = gstAmount / 2; // 9% CGST
          const sgstAmount = gstAmount / 2; // 9% SGST
          const grandTotal = amountToPay + gstAmount;
          
          // Store calculated amounts
          memberSelect.dataset.totalAmount = amountToPay;
          memberSelect.dataset.gstAmount = gstAmount;
          memberSelect.dataset.cgstAmount = cgstAmount;
          memberSelect.dataset.sgstAmount = sgstAmount;
          memberSelect.dataset.grandTotal = grandTotal;
          
          // Update form fields
          document.getElementById("rate").value = formatCurrency(amountToPay);
          document.getElementById("price").value = formatCurrency(amountToPay);
          document.getElementById("taxable-total-amount").value = formatCurrency(amountToPay);
          document.getElementById("cgst_amount").value = formatCurrency(cgstAmount);
          document.getElementById("sgst_amount").value = formatCurrency(sgstAmount);
          document.getElementById("grand_total").value = formatCurrency(grandTotal);
          
          // Update particulars field with kitty payment description
          document.getElementById("particulars").value = "Kitty Payment";
          
          // Show payment type options if not already visible
          document.getElementById("payment-type-options").style.display = "block";
          
          // Check if member has zero pending balance
          const hasZeroBalance = amountToPay === 0;
          
          // Update payment type options based on balance
          const fullPaymentOption = document.getElementById("fullPaymentOption");
          const partialPaymentOption = document.getElementById("partialPaymentOption");
          const advancePaymentOption = document.getElementById("advancePaymentOption");
          
          if (hasZeroBalance) {
            // If zero balance, disable full and partial payment options
            if (fullPaymentOption) fullPaymentOption.disabled = true;
            if (partialPaymentOption) partialPaymentOption.disabled = true;
            if (advancePaymentOption) advancePaymentOption.checked = true;
            
            // Show advance payment fields
            if (document.getElementById("advance-amount-row")) {
              document.getElementById("advance-amount-row").style.display = "table-row";
            }
            
            // Add a note about advance payment
            const paymentTypeOptions = document.getElementById("payment-type-options");
            let advanceNote = document.getElementById("advance-payment-note");
            
            if (!advanceNote) {
              advanceNote = document.createElement("div");
              advanceNote.id = "advance-payment-note";
              advanceNote.className = "alert alert-info mt-2";
              advanceNote.innerHTML = "<strong>Note:</strong> You have no pending balance. You can make an advance payment by entering your desired amount.";
              paymentTypeOptions.appendChild(advanceNote);
            } else {
              advanceNote.style.display = "block";
            }
          } else {
            // If has balance, enable all payment options
            if (fullPaymentOption) fullPaymentOption.disabled = false;
            if (partialPaymentOption) partialPaymentOption.disabled = false;
            if (advancePaymentOption) advancePaymentOption.disabled = false;
            
            // Hide advance payment note if exists
            const advanceNote = document.getElementById("advance-payment-note");
            if (advanceNote) {
              advanceNote.style.display = "none";
            }
          }
          
          // Show kitty bill info if available
          if (bankOrder.kitty_due_date) {
            document.getElementById("kitty-bill-info").style.display = "block";
            document.getElementById("bill-description").textContent = "Kitty Payment";
            document.getElementById("bill-amount").textContent = formatCurrency(amountToPay);
            document.getElementById("bill-due-date").textContent = new Date(bankOrder.kitty_due_date).toLocaleDateString();
            document.getElementById("bill-penalty").textContent = formatCurrency(bankOrder.kitty_penalty || 0);
            
            // Check if due date has passed
            const today = new Date();
            const dueDate = new Date(bankOrder.kitty_due_date);
            if (today > dueDate) {
              document.getElementById("bill-status").textContent = "Overdue";
              document.getElementById("bill-status").classList.add("text-danger");
            } else {
              document.getElementById("bill-status").textContent = "Active";
              document.getElementById("bill-status").classList.add("text-success");
            }
          }
        } else {
          console.log("No bank order found for this member and chapter");
          showToast('warning', "No payment information found for this member");
          
          // Clear payment fields
          document.getElementById("rate").value = "-";
          document.getElementById("price").value = "-";
          document.getElementById("taxable-total-amount").value = "-";
          document.getElementById("cgst_amount").value = "-";
          document.getElementById("sgst_amount").value = "-";
          document.getElementById("grand_total").value = "-";
          
          // Enable advance payment for members with no bank order
          const advancePaymentOption = document.getElementById("advancePaymentOption");
          if (advancePaymentOption) {
            advancePaymentOption.checked = true;
            advancePaymentOption.disabled = false;
          }
          
          // Show advance payment fields
          if (document.getElementById("advance-amount-row")) {
            document.getElementById("advance-amount-row").style.display = "table-row";
          }
          
          // Add a note about advance payment
          const paymentTypeOptions = document.getElementById("payment-type-options");
          let advanceNote = document.getElementById("advance-payment-note");
          
          if (!advanceNote) {
            advanceNote = document.createElement("div");
            advanceNote.id = "advance-payment-note";
            advanceNote.className = "alert alert-info mt-2";
            advanceNote.innerHTML = "<strong>Note:</strong> You can make an advance payment by entering your desired amount.";
            paymentTypeOptions.appendChild(advanceNote);
          } else {
            advanceNote.style.display = "block";
          }
        }
      } catch (error) {
        console.error("Error fetching bank order data:", error);
        showToast('error', "Error fetching payment information");
      } finally {
        hideLoader();
      }
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

    // Submit handler
    document.getElementById('invoice-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      
      // Get selected member
      const memberSelect = document.getElementById("company-name");
      const selectedMember = memberSelect.options[memberSelect.selectedIndex];
      
      if (!selectedMember || !selectedMember.value) {
        showToast('warning', "Please select a member");
        return;
      }
      
      // Get payment method details
      const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
      const paymentData = getPaymentDetails(paymentMethod);
      
      // Construct invoice data
      const invoiceData = {
        member_id: selectedMember.value,
        member_name: selectedMember.text,
        member_address: selectedMember.dataset.address,
        member_company: selectedMember.dataset.company,
        member_phone: selectedMember.dataset.phone,
        member_gst: selectedMember.dataset.gst,
        payment_method: paymentMethod,
        ...paymentData,
        rate: document.getElementById("rate").value,
        price: document.getElementById("price").value,
        taxable_total_amount: document.getElementById("taxable-total-amount").value,
        cgst_amount: document.getElementById("cgst_amount").value,
        sgst_amount: document.getElementById("sgst_amount").value,
        grand_total: document.getElementById("grand_total").value,
        universal_link_id: universalLinkId
      };
      
      // Handle specific cases for meeting or kitty payment
      if (universalLinkId === "4") {
        const bankOrderId = memberSelect.dataset.bankOrderId;
        const kittyDueDate = memberSelect.dataset.kittyDueDate;
        const totalAmount = parseFloat(memberSelect.dataset.totalAmount || 0);
        const paymentType = document.querySelector('input[name="paymentType"]:checked').value;
        
        // Add bank order related fields
        invoiceData.bank_order_id = bankOrderId;
        invoiceData.kitty_due_date = kittyDueDate;
        
        if (paymentType === 'full') {
          invoiceData.member_pending_balance = 0;
          invoiceData.total_amount_paid = totalAmount;
          invoiceData.payment_note = "Full payment made";
        } else if (paymentType === 'partial') {
          const partialAmount = parseFloat(document.getElementById("partial-amount").value || 0);
          const remainingBalance = totalAmount - partialAmount;
          invoiceData.member_pending_balance = remainingBalance;
          invoiceData.total_amount_paid = partialAmount;
          invoiceData.payment_note = `Partial payment of ${formatCurrency(partialAmount)} made. Remaining balance: ${formatCurrency(remainingBalance)}`;
        } else if (paymentType === 'advance') {
          const advanceAmount = parseFloat(document.getElementById("advance-amount").value || 0);
          
          if (totalAmount > 0) {
            // If member has a balance, add it to the advance amount
            invoiceData.member_pending_balance = totalAmount;
            invoiceData.total_amount_paid = advanceAmount;
            invoiceData.payment_note = `Advance payment of ${formatCurrency(advanceAmount)} made. Pending balance: ${formatCurrency(totalAmount)}`;
          } else {
            // If member has zero balance, just record the advance amount
            invoiceData.member_pending_balance = 0;
            invoiceData.total_amount_paid = advanceAmount;
            invoiceData.payment_note = `Advance payment of ${formatCurrency(advanceAmount)} made`;
          }
        }
      }
      
      try {
        showLoader();
        
        const response = await fetch('https://backend.bninewdelhi.com/api/add-invoice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(invoiceData)
        });
        
        const result = await response.json();
        
        if (result.success) {
          Swal.fire({
            title: 'Success!',
            text: 'Invoice generated successfully',
            icon: 'success',
            confirmButtonText: 'OK'
          }).then((result) => {
            if (result.isConfirmed) {
              window.location.href = '/transactions';
            }
          });
        } else {
          throw new Error(result.message || 'Failed to generate invoice');
        }
      } catch (error) {
        console.error('Error:', error);
        Swal.fire({
          title: 'Error!',
          text: error.message || 'Failed to generate invoice',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      } finally {
        hideLoader();
      }
    });

    // Payment type handling (Full, Partial, Advance)
    const paymentTypes = document.getElementsByName('paymentType');
    const partialPaymentRow = document.getElementById('partial-payment-row');
    const remainingBalanceRow = document.getElementById('remaining-balance-row');
    const advanceAmountRow = document.getElementById('advance-amount-row');
    const partialAmountInput = document.getElementById('partial-amount');
    const advanceAmountInput = document.getElementById('advance-amount');

    // Add event listener for advance amount input
    if (advanceAmountInput) {
      advanceAmountInput.addEventListener('input', function() {
        const advanceAmount = parseFloat(this.value || 0);
        
        // Calculate GST for advance payment
        const gstAmount = advanceAmount * 0.18; // 18% GST
        const cgstAmount = gstAmount / 2; // 9% CGST
        const sgstAmount = gstAmount / 2; // 9% SGST
        const grandTotal = advanceAmount + gstAmount;
        
        // Update form fields with calculated amounts
        document.getElementById("rate").value = formatCurrency(advanceAmount);
        document.getElementById("price").value = formatCurrency(advanceAmount);
        document.getElementById("taxable-total-amount").value = formatCurrency(advanceAmount);
        document.getElementById("cgst_amount").value = formatCurrency(cgstAmount);
        document.getElementById("sgst_amount").value = formatCurrency(sgstAmount);
        document.getElementById("grand_total").value = formatCurrency(grandTotal);
        
        // Store calculated amounts in the member select element for later use
        const memberSelect = document.getElementById("company-name");
        memberSelect.dataset.totalAmount = advanceAmount;
        memberSelect.dataset.gstAmount = gstAmount;
        memberSelect.dataset.cgstAmount = cgstAmount;
        memberSelect.dataset.sgstAmount = sgstAmount;
        memberSelect.dataset.grandTotal = grandTotal;
      });
    }

    // Add event listener for partial amount input
    if (partialAmountInput) {
      partialAmountInput.addEventListener('input', function() {
        const memberSelect = document.getElementById("company-name");
        const totalAmount = parseFloat(memberSelect.dataset.totalAmount || 0);
        const partialAmount = parseFloat(this.value || 0);
        
        // Ensure partial amount doesn't exceed total amount
        if (partialAmount > totalAmount) {
          this.value = totalAmount;
          showToast('warning', "Partial amount cannot exceed total amount");
        }
        
        // Calculate and display remaining balance
        const remainingBalance = totalAmount - parseFloat(this.value || 0);
        document.getElementById("remaining-balance").value = formatCurrency(remainingBalance);
      });
    }

    if (paymentTypes.length > 0) {
      paymentTypes.forEach(type => {
        type.addEventListener('change', function() {
          // Hide all payment type sections first
          if (partialPaymentRow) partialPaymentRow.style.display = 'none';
          if (remainingBalanceRow) remainingBalanceRow.style.display = 'none';
          if (advanceAmountRow) advanceAmountRow.style.display = 'none';

          // Show relevant section based on selection
          if (this.id === 'partialPaymentOption') {
            if (partialPaymentRow) partialPaymentRow.style.display = 'table-row';
            if (remainingBalanceRow) remainingBalanceRow.style.display = 'table-row';
            
            // Set default partial amount to half of the total amount
            const memberSelect = document.getElementById("company-name");
            const totalAmount = parseFloat(memberSelect.dataset.totalAmount || 0);
            const defaultPartialAmount = Math.floor(totalAmount / 2);
            document.getElementById("partial-amount").value = defaultPartialAmount;
            
            // Calculate and display remaining balance
            const remainingBalance = totalAmount - defaultPartialAmount;
            document.getElementById("remaining-balance").value = formatCurrency(remainingBalance);
          } else if (this.id === 'advancePaymentOption') {
            if (advanceAmountRow) advanceAmountRow.style.display = 'table-row';
            
            // Set default advance amount based on whether member has a balance
            const memberSelect = document.getElementById("company-name");
            const totalAmount = parseFloat(memberSelect.dataset.totalAmount || 0);
            
            if (totalAmount > 0) {
              // If member has a balance, set default to the total amount
              document.getElementById("advance-amount").value = totalAmount;
            } else {
              // If member has zero balance, set a default amount or leave empty
              document.getElementById("advance-amount").value = "";
            }
          }
        });
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