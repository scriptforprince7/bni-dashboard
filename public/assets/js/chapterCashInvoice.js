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

// Add this function at the top of your file
function getPaymentDetails() {
    const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked')?.id;
    const paymentNote = document.getElementById('payment-note')?.value || '';

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

document.addEventListener("DOMContentLoaded", async function() {
  const urlParams = new URLSearchParams(window.location.search);
  const universalLinkId = urlParams.get("id");

  if (!universalLinkId) return;

  // Add new condition for id=5
  if (universalLinkId === "5") {
    // Show SweetAlert with two options
    const result = await Swal.fire({
      title: 'Selet Visitor Type',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Invited By',
      cancelButtonText: 'Other',
      confirmButtonColor: '#6259ca',
      cancelButtonColor: '#7987a1',
      reverseButtons: true,
      allowOutsideClick: false,
      allowEscapeKey: false
    });

    // First update all "Billing To" labels to "Invited By"
    const allLabels = document.querySelectorAll('.dw-semibold.mb-2');
    allLabels.forEach(label => {
      if (label.textContent.trim() === 'Billing To :') {
        label.textContent = 'Invited By :';
      }
    });

    // Get the billing container and additional fields
    const billingToContainer = document.querySelector('.col-xl-4.col-lg-4.col-md-6.col-sm-6.ms-auto.mt-sm-0.mt-3');
    const additionalFields = [
      document.getElementById('member_address').closest('.col-xl-12'),
      document.getElementById('member_company_name').closest('.col-xl-12'),
      document.getElementById('member_phone_number').closest('.col-xl-12'),
      document.getElementById('member_gst_number').closest('.col-xl-12')
    ];

    if (!result.isConfirmed) {
      // User clicked "Other"
      const selectContainer = billingToContainer.querySelector('.col-xl-12');
      selectContainer.innerHTML = `
        <input 
          type="text" 
          class="form-control form-control-light" 
          id="invited-by-input" 
          placeholder="Enter name"
        >
      `;

      // Hide additional fields
      additionalFields.forEach(field => {
        if (field) {
          field.style.display = 'none';
        }
      });
      
      console.log("✅ Replaced dropdown with text input and hid additional fields");
    } else {
      // User clicked "Invited By"
      // Show additional fields
      additionalFields.forEach(field => {
        if (field) {
          field.style.display = 'block';
        }
      });
      
      console.log("✅ Kept dropdown and showed additional fields");
    }

    // Show visitor details section
    document.getElementById('visitor-details-section').style.display = 'block';

    // Handle GST checkbox
    document.getElementById('has-gst').addEventListener('change', function() {
      document.getElementById('gst-fields').style.display = this.checked ? 'block' : 'none';
    });

    // Handle Get GST Details button click
    document.getElementById('get-gst-details').addEventListener('click', async function() {
      const gstNumber = document.getElementById('company-gstin').value.trim();
      
      if (!gstNumber) {
        showToast('error', 'Please enter GST number');
        return;
      }

      try {
        showLoader();
        const response = await fetch(`https://backend.bninewdelhi.com/api/get-gst-details/${gstNumber}`);
        const data = await response.json();

        if (data.error) {
          showToast('error', data.error);
          return;
        }

        // Update company details with GST data
        document.getElementById('visitor-company-name').value = data.legalName || data.tradeName || '';
        document.getElementById('visitor-company-address').value = formatGSTAddress(data.address);
        
        showToast('success', 'GST details fetched successfully');
      } catch (error) {
        console.error('Error fetching GST details:', error);
        showToast('error', 'Failed to fetch GST details');
      } finally {
        hideLoader();
      }
    });

    // Helper function to format GST address
    function formatGSTAddress(address) {
      if (!address) return '';
      
      const parts = [
        address.bno,
        address.st,
        address.loc,
        address.dst,
        address.stcd,
        address.pin
      ].filter(Boolean);
      
      return parts.join(', ');
    }

    // Show visitor details section
    document.getElementById('visitor-details-section').style.display = 'block';

    // Add animation classes for smooth transitions
    const visitorSection = document.getElementById('visitor-details-section');
    visitorSection.classList.add('animate__animated', 'animate__fadeIn');

    console.log("User selected: Invited By");
  }

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

    // ===================== AUTO-SELECT REGION & CHAPTER FOR CHAPTER/RO_ADMIN =====================
    // Utility functions from tokenUtils.js
    function getUserLoginType() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return null;
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.login_type;
        } catch (e) {
            return null;
        }
    }

    function getUserEmail() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return null;
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.email;
        } catch (e) {
            return null;
        }
    }

    // Only declare these ONCE, right after fetching regions/chapters/members:
    let selectedRegionId = null;
    let selectedChapterId = null;
    let matchingChapter = null;
    let matchingRegion = null;
    let loginType = null;
    let userEmail = null;

    // 1. Get login type and user email
    loginType = getUserLoginType();
    userEmail = getUserEmail();

    console.log("Login type:", loginType);
    console.log("User email:", userEmail);

    if (loginType === 'chapter') {
        // Fetch all chapters and find the one with matching email_id, vice_president_mail, president_mail, or treasurer_mail
        matchingChapter = chapters.find(chap => 
            chap.email_id === userEmail || 
            chap.vice_president_mail === userEmail || 
            chap.president_mail === userEmail || 
            chap.treasurer_mail === userEmail
        );
        
        if (matchingChapter) {
            selectedChapterId = matchingChapter.chapter_id;
            selectedRegionId = matchingChapter.region_id;
            console.log("Found chapter for user:", matchingChapter);
            console.log("Matching email type:", 
                matchingChapter.email_id === userEmail ? "email_id" :
                matchingChapter.vice_president_mail === userEmail ? "vice_president_mail" :
                matchingChapter.president_mail === userEmail ? "president_mail" :
                "treasurer_mail"
            );

            // Find the region for this chapter
            matchingRegion = regions.find(region => region.region_id == selectedRegionId);
            if (matchingRegion) {
                console.log("Found region for chapter:", matchingRegion);
            }
        }
    } else if (loginType === 'ro_admin') {
        // Get current_chapter_id and current_chapter_email from localStorage
        const adminAccess = JSON.parse(localStorage.getItem('admin_chapter_access') || '{}');
        const currentChapterId = adminAccess.chapter_id;
        const currentChapterEmail = adminAccess.chapter_email;
        console.log("RO Admin current_chapter_id:", currentChapterId, "current_chapter_email:", currentChapterEmail);

        // Fetch all chapters and find the one with matching chapter_id
        matchingChapter = chapters.find(chap => chap.chapter_id == currentChapterId);
        if (matchingChapter) {
            selectedChapterId = matchingChapter.chapter_id;
            selectedRegionId = matchingChapter.region_id;
            console.log("Found chapter for RO admin:", matchingChapter);

            // Find the region for this chapter
            matchingRegion = regions.find(region => region.region_id == selectedRegionId);
            if (matchingRegion) {
                console.log("Found region for chapter:", matchingRegion);
            }
        }
    }

    // 2. If found, update and disable the dropdowns
    if (matchingRegion && matchingChapter) {
        // --- Region Dropdown ---
        regionDropdown.innerHTML = "";
        const regionItem = document.createElement("li");
        const regionLink = document.createElement("a");
        regionLink.className = "dropdown-item";
        regionLink.href = "javascript:void(0);";
        regionLink.textContent = matchingRegion.region_name;
        regionLink.dataset.regionId = matchingRegion.region_id;
        regionItem.appendChild(regionLink);
        regionDropdown.appendChild(regionItem);
        regionDropdownBtn.innerHTML = `<i class="ti ti-sort-descending-2 me-1"></i> ${matchingRegion.region_name}`;
        // Disable the region dropdown
        regionDropdownBtn.classList.add('disabled');
        regionDropdownBtn.style.pointerEvents = 'none';
        regionDropdownBtn.style.opacity = '0.6';

        // --- Chapter Dropdown ---
        chapterDropdown.innerHTML = "";
        const chapterItem = document.createElement("li");
        const chapterLink = document.createElement("a");
        chapterLink.className = "dropdown-item";
        chapterLink.href = "javascript:void(0);";
        chapterLink.textContent = matchingChapter.chapter_name;
        chapterLink.dataset.chapterId = matchingChapter.chapter_id;
        chapterItem.appendChild(chapterLink);
        chapterDropdown.appendChild(chapterItem);
        chapterDropdownBtn.innerHTML = `<i class="ti ti-sort-descending-2 me-1"></i> ${matchingChapter.chapter_name}`;
        // Disable the chapter dropdown
        chapterDropdownBtn.classList.add('disabled');
        chapterDropdownBtn.style.pointerEvents = 'none';
        chapterDropdownBtn.style.opacity = '0.6';

        // Set global variables if needed
        window.selectedRegionId = selectedRegionId;
        window.selectedChapterId = selectedChapterId;

        // Update amount fields for visitor payment (ID 5)
          if (universalLinkId === "5") {
            try {
              // Set particulars text for visitor payment
              const particularsField = document.getElementById('particulars');
              if (particularsField) {
                particularsField.value = "Visitors Payment";
                    particularsField.readOnly = true;
              }

              // Get visitor fees from the selected chapter
                const visitorFee = parseFloat(matchingChapter.chapter_visitor_fees) || 0;
              console.log("💰 Chapter Visitor Fee:", visitorFee);

              // Update Rate and Amount fields
              document.getElementById('rate').value = `₹ ${visitorFee.toFixed(2)}`;
              document.getElementById('price').value = `₹ ${visitorFee.toFixed(2)}`;
              document.getElementById('taxable-total-amount').value = `₹ ${visitorFee.toFixed(2)}`;

              // Hide CGST and SGST rows
              const cgstRow = document.querySelector('tr:has(#cgst_amount)');
              const sgstRow = document.querySelector('tr:has(#sgst_amount)');
              if (cgstRow) cgstRow.style.display = 'none';
              if (sgstRow) sgstRow.style.display = 'none';

              // Calculate GST (18%)
              const gstAmount = visitorFee * 0.18;

              // Add or update GST row
              let gstRow = document.getElementById('gst-18-row');
              const taxableRow = document.querySelector('tr:has(#taxable-total-amount)');
              const grandTotalRow = document.querySelector('tr:has(#grand_total)');

              if (grandTotalRow) {
                grandTotalRow.style.display = 'table-row';
              }

              if (!gstRow && taxableRow && grandTotalRow) {
                gstRow = document.createElement('tr');
                gstRow.id = 'gst-18-row';
                gstRow.innerHTML = `
                  <th scope="row">
                    <div class="fw-medium">Add GST (18%) :</div>
                  </th>
                  <td>
                    <input
                      type="text"
                      class="form-control form-control-light invoice-amount-input"
                      id="gst-18-amount"
                      value="₹ ${gstAmount.toFixed(2)}"
                      readonly
                    />
                  </td>
                `;
                grandTotalRow.parentNode.insertBefore(gstRow, grandTotalRow);
              } else if (gstRow) {
                document.getElementById('gst-18-amount').value = `₹ ${gstAmount.toFixed(2)}`;
              }

                // Calculate and update Grand Total
              const grandTotal = visitorFee + gstAmount;
              const grandTotalField = document.getElementById('grand_total');
              if (grandTotalField) {
                grandTotalField.value = `₹ ${grandTotal.toFixed(2)}`;
                    grandTotalField.style.display = 'block';
              }
            } catch (error) {
              console.error("❌ Error processing visitor fees:", error);
              showToast('error', 'Failed to process visitor fees');
            }
          }

        // Trigger any dependent logic (like member dropdown, rates, etc.)
        updateMemberDropdown(selectedChapterId, members);
    } else {
        // If no auto-selection, proceed with normal dropdown population
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
    }

    // Show all chapters by default if not auto-selected
    if (!matchingRegion || !matchingChapter) {
        updateChapterDropdown(null, chapters);
    }

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

    // Clear existing options and add only ADI CORPORATE TRAINING
    if (companyDropdown) {
        companyDropdown.innerHTML = ''; // Clear existing options
        
        // Add the fixed company option
      const companyOption = document.createElement("option");
        companyOption.value = "ADI CORPORATE TRAINING";
        companyOption.textContent = "ADI CORPORATE TRAINING";
      companyDropdown.appendChild(companyOption);

        // Set fixed company details
        if (companyAddress) companyAddress.value = "Dda Sfs Flat, Flat No 12, Pocket 1, Sector 19, Dwarka New Delhi, Delhi, 110075 India";
        if (companyMail) companyMail.value = "sunilk@bni-india.in";
        if (companyPhone) companyPhone.value = "9899789340";
        if (companyGst) companyGst.value = "07AHIPK0486D1ZH";

        // Make fields read-only
        if (companyAddress) companyAddress.readOnly = true;
        if (companyMail) companyMail.readOnly = true;
        if (companyPhone) companyPhone.readOnly = true;
        if (companyGst) companyGst.readOnly = true;
    }

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

    // GST Checkbox logic
    const includeGstCheckbox = document.getElementById('include-gst');
    const taxableAmountInput = document.getElementById('taxable-total-amount');
    const cgstInput = document.getElementById('cgst_amount');
    const sgstInput = document.getElementById('sgst_amount');
    const grandTotalInput = document.getElementById('grand_total');

    function updateGrandTotalWithGST() {
        const taxable = parseFloat(taxableAmountInput.value.replace(/[₹,\s]/g, '')) || 0;
        let cgst = 0, sgst = 0;

        if (includeGstCheckbox.checked) {
            // Calculate GST (18% of taxable), split into CGST/SGST
            const gst = +(taxable * 0.18).toFixed(2);
            cgst = +(gst / 2).toFixed(2);
            sgst = +(gst / 2).toFixed(2);
            cgstInput.value = `₹ ${cgst.toFixed(2)}`;
            sgstInput.value = `₹ ${sgst.toFixed(2)}`;
            grandTotalInput.value = `₹ ${(taxable + cgst + sgst).toFixed(2)}`;
        } else {
            // Remove GST
            cgstInput.value = "₹ 0.00";
            sgstInput.value = "₹ 0.00";
            grandTotalInput.value = `₹ ${taxable.toFixed(2)}`;
        }
    }

    // Attach listeners
    if (includeGstCheckbox) includeGstCheckbox.addEventListener('change', updateGrandTotalWithGST);
    if (taxableAmountInput) taxableAmountInput.addEventListener('input', updateGrandTotalWithGST);

    // Initial call to set correct value on page load
    updateGrandTotalWithGST();

    // Add submit handler for the invoice form
    const submitButton = document.getElementById('submit_invoice');
    if (submitButton) {
      submitButton.addEventListener('click', async function(e) {
        e.preventDefault();
        
        try {
          if(universalLinkId === "5"){
            return;
          }
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
            date_issued: document.getElementById("invoice-date-issued").value,
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

          // // Send to your API
          // const response = await fetch('your-api-endpoint', {
          //   method: 'POST',
          //   headers: {
          //     'Content-Type': 'application/json',
          //   },
          //   body: JSON.stringify(invoiceData)
          // });

          // if (!response.ok) {
          //   throw new Error('Failed to create invoice');
          // }

          // const result = await response.json();
          // console.log('✅ Invoice created successfully:', result);

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

    // Add this after your existing chapter selection code
    document.querySelector('.company_info').addEventListener('change', async function() {
      if (universalLinkId === "5") {
        try {
          const selectedChapterId = this.value;
          console.log("📍 Chapter Selection Changed - Selected ID:", selectedChapterId);
          
          if (!selectedChapterId) {
            console.log("❌ No chapter selected");
            return;
          }

          showLoader();
          
          // Fetch chapters data
          const response = await fetch('https://backend.bninewdelhi.com/api/chapters');
          const chapters = await response.json();
          console.log("📋 All Chapters Data:", chapters);
          
          // Find selected chapter
          const selectedChapter = chapters.find(chapter => chapter.id === parseInt(selectedChapterId));
          console.log("✅ Found Selected Chapter:", selectedChapter);
          
          if (!selectedChapter) {
            console.log("❌ Chapter not found in data");
            showToast('error', 'Chapter data not found');
            return;
          }

          // Get visitor fees
          const visitorFee = parseFloat(selectedChapter.chapter_visitor_fees) || 0;
          console.log("💰 Visitor Fee:", visitorFee);
          
          // Update Rate field
          const rateField = document.getElementById('rate');
          if (rateField) {
            rateField.value = visitorFee.toFixed(2);
            console.log("✅ Updated Rate:", rateField.value);
          }

          // Update Amount field
          const priceField = document.getElementById('price');
          if (priceField) {
            priceField.value = visitorFee.toFixed(2);
            console.log("✅ Updated Price:", priceField.value);
          }

          // Update Total Taxable Value
          const taxableField = document.getElementById('taxable-total-amount');
          if (taxableField) {
            taxableField.value = visitorFee.toFixed(2);
            console.log("✅ Updated Taxable Amount:", taxableField.value);
          }

          // Hide CGST and SGST rows
          const cgstRow = document.querySelector('tr:has(#cgst_amount)');
          const sgstRow = document.querySelector('tr:has(#sgst_amount)');
          
          if (cgstRow) {
            cgstRow.style.display = 'none';
            console.log("✅ Hidden CGST Row");
          }
          if (sgstRow) {
            sgstRow.style.display = 'none';
            console.log("✅ Hidden SGST Row");
          }

          // Calculate GST (18%)
          const gstAmount = visitorFee * 0.18;
          console.log("💰 Calculated GST Amount:", gstAmount);

          // Add or update GST row
          let gstRow = document.getElementById('gst-18-row');
          const taxableRow = document.querySelector('tr:has(#taxable-total-amount)');
          const grandTotalRow = document.querySelector('tr:has(#grand_total)');

          // Make sure grand total row is visible
          if (grandTotalRow) {
            grandTotalRow.style.display = 'table-row';
            console.log("✅ Ensured Grand Total row is visible");
          }

          if (!gstRow && taxableRow && grandTotalRow) {
            gstRow = document.createElement('tr');
            gstRow.id = 'gst-18-row';
            gstRow.innerHTML = `
              <th scope="row">
                <div class="fw-medium">Add GST (18%) :</div>
              </th>
              <td>
                <input
                  type="text"
                  class="form-control form-control-light invoice-amount-input"
                  id="gst-18-amount"
                  value="₹ ${gstAmount.toFixed(2)}"
                  readonly
                />
              </td>
            `;
            // Insert GST row before Grand Total
            grandTotalRow.parentNode.insertBefore(gstRow, grandTotalRow);
            console.log("✅ Added GST row before Grand Total");
          } else if (gstRow) {
            document.getElementById('gst-18-amount').value = `₹ ${gstAmount.toFixed(2)}`;
            console.log("✅ Updated GST Amount");
          }

          // Calculate and update Grand Total (Visitor Fee + GST)
          const grandTotal = visitorFee + gstAmount;
          const grandTotalField = document.getElementById('grand_total');
          if (grandTotalField) {
            grandTotalField.value = grandTotal.toFixed(2);
            grandTotalField.style.display = 'block'; // Make sure the input field is visible
            console.log("✅ Updated Grand Total:", grandTotal.toFixed(2));
          }

        } catch (error) {
          console.error("❌ Error in chapter selection handler:", error);
          showToast('error', 'Failed to process chapter selection');
        } finally {
          hideLoader();
        }
      }
    });
  } catch (error) {
    console.error("Error:", error);
    showToast('error', "An error occurred while loading data");
  } finally {
    hideLoader();
  }
});

// -------- send data to the backend --------



document.getElementById("submit_invoice").addEventListener("click", async function(e) {
    const universalLinkId = new URLSearchParams(window.location.search).get("id");

    // If it's visitor payment (ID 5), don't proceed with this handler
    if (universalLinkId === "5") {
        e.preventDefault(); // Prevent default form submission
        e.stopPropagation(); // Stop event propagation
        return;
    }

    showLoader();

    try {
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

// Separate handler for Visitor Payment (ID 5)
document.addEventListener('DOMContentLoaded', function() {
    const universalLinkId = new URLSearchParams(window.location.search).get("id");
    const submitButton = document.getElementById("submit_invoice");

    if (universalLinkId === "5" && submitButton) {
        submitButton.addEventListener("click", async function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("🔘 Make Invoice button clicked for ID 5");
            
            try {
                showLoader();
                
                // Check payment mode
                const invitedByInput = document.getElementById('invited-by-input');
                const isOtherMode = invitedByInput !== null;
                
                // Get basic invoice data first
                let invoiceData = {
                    universal_link_id: universalLinkId,
                    date_issued: document.getElementById("invoice-date-issued").value,
                    visitor_name: document.getElementById('visitor-name').value,
                    visitor_email: document.getElementById('visitor-email').value,
                    visitor_mobile: document.getElementById('visitor-mobile').value,
                    visitor_address: document.getElementById('visitor-address').value,
                    visitor_business_category: document.getElementById("visitor-category").value.trim(),
                    visitor_company: document.getElementById('visitor-company-name').value,
                    visitor_gstin: document.getElementById('company-gstin').value,
                    visitor_company_address: document.getElementById('visitor-company-address').value,
                    particulars: "Visitors Payment",
                    taxable_amount: document.getElementById('taxable-total-amount').value.replace('₹', '').trim(),
                    total_amount: document.getElementById('grand_total').value.replace('₹', '').trim(),
                    mode_of_payment: getPaymentDetails().mode_of_payment,
                    region_id: selectedRegionId,
                    chapter_id: selectedChapterId
                };

                // Handle GST based on checkbox state
                const includeGstCheckbox = document.getElementById('include-gst');
                if (includeGstCheckbox && includeGstCheckbox.checked) {
                    invoiceData.gst_amount = document.getElementById('gst-18-amount')?.value.replace('₹', '').trim() || '0';
                } else {
                    invoiceData.gst_amount = '0';
                    // Update total amount to be same as taxable amount when GST is not included
                    invoiceData.total_amount = invoiceData.taxable_amount;
                }

                // Add member details based on mode
                if (isOtherMode) {
                    // For "Other" case
                    if (!invitedByInput.value.trim()) {
                        showToast('warning', "Please enter the invited by name");
                        return;
                    }
                    invoiceData.member_name = invitedByInput.value.trim();
                    invoiceData.member_id = null;
                    invoiceData.member_company = null;
                    invoiceData.member_phone = null;
                    invoiceData.member_gstin = null;
                } else {
                    // For "Invited By" case
                    const memberSelect = document.getElementById('company-name');
                    if (!memberSelect || memberSelect.value === "Select Member") {
                        showToast('warning', "Please select a member");
                        return;
                    }
                    const selectedOption = memberSelect.options[memberSelect.selectedIndex];
                    invoiceData.member_id = selectedOption.value;
                    invoiceData.member_name = `${selectedOption.dataset.firstName} ${selectedOption.dataset.lastName}`;
                    invoiceData.member_company = selectedOption.dataset.companyName;
                    invoiceData.member_phone = selectedOption.dataset.phoneNumber;
                    invoiceData.member_gstin = selectedOption.dataset.gstNumber;
                }

                console.log("📤 Sending visitor payment data:", invoiceData);

                // Rest of your existing code (API call, success handling, etc.)
                const result = await Swal.fire({
                    title: 'Confirm Invoice Generation',
                    text: 'Are you sure you want to generate this invoice?',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Yes, generate it!',
                    cancelButtonText: 'No, cancel',
                    confirmButtonColor: '#6259ca',
                    cancelButtonColor: '#7987a1'
                });

                if (!result.isConfirmed) {
                    return;
                }

                const response = await fetch('https://backend.bninewdelhi.com/api/addVisitorPayment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(invoiceData)
                });

                const responseData = await response.json();
                console.log("📥 Backend Response:", responseData);

                if (response.ok) {
                    await Swal.fire({
                        icon: 'success',
                        title: 'Visitor Invoice Created Successfully!',
                        html: `
                            <div style="text-align: left;">
                                <p><strong>Visitor:</strong> ${invoiceData.visitor_name}</p>
                                <p><strong>Amount:</strong> ₹${invoiceData.total_amount}</p>
                                <p><strong>Order ID:</strong> ${responseData.data.order_id}</p>
                            </div>
                        `,
                        timer: 3000,
                        showConfirmButton: true,
                        confirmButtonText: 'View Transactions'
                    });

                    window.location.href = '/trans/manage-transactions';
                } else {
                    throw new Error(responseData.message || 'Failed to process visitor payment');
                }

            } catch (error) {
                console.error('❌ Error processing visitor payment:', error);
                showToast('error', error.message || 'Error processing visitor payment');
            } finally {
                hideLoader();
            }
        });
    }
});

// Update toast configuration to use style.background
window.showToast = function(type, message) {
    const toastConfig = {
        text: message,
        duration: 3000,
        gravity: "top",
        position: "right",
        style: {
            background: type === 'error' ? "#ff6b6b" : 
                       type === 'success' ? "#51cf66" : 
                       type === 'warning' ? "#fcc419" : "#4dabf7"
        },
        close: true,
        stopOnFocus: true
    };
    
    Toastify(toastConfig).showToast();
};

// Function to update member dropdown
function updateMemberDropdown(chapterId, allMembers) {
    // Check if we're in "Other" mode - if so, skip all dropdown handling
    const invitedByInput = document.getElementById('invited-by-input');
    if (invitedByInput) {
        console.log("📝 In 'Other' mode - skipping member dropdown update");
        return;
    }

    const memberDropdown = document.getElementById("company-name");
    if (!memberDropdown) {
        console.log("⚠️ Member dropdown not found - might be in 'Other' mode");
        return;
    }

    // Rest of your existing dropdown code
    memberDropdown.innerHTML = `<option selected>Select Member</option>`;
    const filteredMembers = allMembers.filter(member => member.chapter_id == chapterId);
    
    // Sort members alphabetically by first name
    filteredMembers.sort((a, b) => {
        const nameA = `${a.member_first_name} ${a.member_last_name}`.toLowerCase();
        const nameB = `${b.member_first_name} ${b.member_last_name}`.toLowerCase();
        return nameA.localeCompare(nameB);
    });
    
    console.log("👥 Available Members (Sorted):", filteredMembers.map(member => ({
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
        option.dataset.address = member.member_company_address || "";
        option.dataset.companyName = member.member_company_name;
        option.dataset.phoneNumber = member.member_phone_number;
        option.dataset.gstNumber = member.member_gst_number;
        
        memberDropdown.appendChild(option);
    });

    // Keep existing event listener code
    memberDropdown.addEventListener("change", function() {
        const selectedOption = memberDropdown.options[memberDropdown.selectedIndex];

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
            selectedChapterId = chapter.chapter_id;
            console.log("🏢 Selected Chapter:", {
                name: chapter.chapter_name,
                id: selectedChapterId
            });

            // Add visitor fees handling for id=5
            if (universalLinkId === "5") {
                console.log("🎯 Processing for Visitor Payment (ID 5)");
                try {
                    // Set particulars text for visitor payment
                    const particularsField = document.getElementById('particulars');
                    if (particularsField) {
                        particularsField.value = "Visitors Payment";
                        particularsField.readOnly = true; // Make it read-only
                        console.log("✅ Set particulars text for visitor payment");
                    }

                    // Get visitor fees from the selected chapter
                    const visitorFee = parseFloat(chapter.chapter_visitor_fees) || 0;
                    console.log("💰 Chapter Visitor Fee:", visitorFee);

                    // Update Rate and Amount fields
                    document.getElementById('rate').value = `₹ ${visitorFee.toFixed(2)}`;
                    document.getElementById('price').value = `₹ ${visitorFee.toFixed(2)}`;
                    document.getElementById('taxable-total-amount').value = `₹ ${visitorFee.toFixed(2)}`;
                    console.log("✅ Updated Rate and Amount fields");

                    // Hide CGST and SGST rows
                    const cgstRow = document.querySelector('tr:has(#cgst_amount)');
                    const sgstRow = document.querySelector('tr:has(#sgst_amount)');
                    if (cgstRow) cgstRow.style.display = 'none';
                    if (sgstRow) sgstRow.style.display = 'none';
                    console.log("✅ Hidden CGST and SGST rows");

                    // Calculate GST (18%)
                    const gstAmount = visitorFee * 0.18;
                    console.log("💰 GST Amount (18%):", gstAmount);

                    // Add or update GST row
                    let gstRow = document.getElementById('gst-18-row');
                    const taxableRow = document.querySelector('tr:has(#taxable-total-amount)');
                    const grandTotalRow = document.querySelector('tr:has(#grand_total)');

                    // Make sure grand total row is visible
                    if (grandTotalRow) {
                        grandTotalRow.style.display = 'table-row';
                        console.log("✅ Ensured Grand Total row is visible");
                    }

                    if (!gstRow && taxableRow && grandTotalRow) {
                        gstRow = document.createElement('tr');
                        gstRow.id = 'gst-18-row';
                        gstRow.innerHTML = `
                            <th scope="row">
                                <div class="fw-medium">Add GST (18%) :</div>
                            </th>
                            <td>
                                <input
                                    type="text"
                                    class="form-control form-control-light invoice-amount-input"
                                    id="gst-18-amount"
                                    value="₹ ${gstAmount.toFixed(2)}"
                                    readonly
                                />
                            </td>
                        `;
                        // Insert GST row before Grand Total
                        grandTotalRow.parentNode.insertBefore(gstRow, grandTotalRow);
                        console.log("✅ Added GST row before Grand Total");
                    } else if (gstRow) {
                        document.getElementById('gst-18-amount').value = `₹ ${gstAmount.toFixed(2)}`;
                        console.log("✅ Updated GST Amount");
                    }

                    // Calculate and update Grand Total (Visitor Fee + GST)
                    const grandTotal = visitorFee + gstAmount;
                    const grandTotalField = document.getElementById('grand_total');
                    if (grandTotalField) {
                        grandTotalField.value = `₹ ${grandTotal.toFixed(2)}`;
                        grandTotalField.style.display = 'block'; // Make sure the input field is visible
                        console.log("✅ Updated Grand Total:", grandTotal.toFixed(2));
                    } else {
                        console.error("❌ Grand Total field not found!");
                    }

                } catch (error) {
                    console.error("❌ Error processing visitor fees:", error);
                    showToast('error', 'Failed to process visitor fees');
                }
            }

            // Only show chapter selection message for meeting payments
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

// ===================== END AUTO-SELECT =====================