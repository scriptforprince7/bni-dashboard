// Add this at the very top of the file
console.log("🚀 kittyPaymentsInvoice.js loaded - Meeting Payments (ID: 4)");

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
  
    // Set default date and time for invoice date issued
    const dateIssuedInput = document.getElementById("invoice-date-issued");
    if (dateIssuedInput) {
        const now = new Date();
        // Format date and time to YYYY-MM-DDThh:mm
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        dateIssuedInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
        console.log("📅 Set default invoice date:", dateIssuedInput.value);
    }
  
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
            // document.getElementById("rate").value = `₹ ${currentKittyBill.total_bill_amount}`;
            // document.getElementById("price").value = `₹ ${currentKittyBill.total_bill_amount}`;
            // document.getElementById("taxable-total-amount").value = `₹ ${currentKittyBill.total_bill_amount}`;
            
            // Calculate GST (18%)
            const gstAmount = (parseFloat(currentKittyBill.total_bill_amount) * 0.18).toFixed(2);
            const cgstAmount = (gstAmount / 2).toFixed(2);
            const sgstAmount = (gstAmount / 2).toFixed(2);
            
            // document.getElementById("cgst_amount").value = `₹ ${cgstAmount}`;
            // document.getElementById("sgst_amount").value = `₹ ${sgstAmount}`;
            
            // Calculate grand total
            // const grandTotal = (parseFloat(currentKittyBill.total_bill_amount) + parseFloat(gstAmount)).toFixed(2);
            // document.getElementById("grand_total").value = `₹ ${grandTotal}`;
            
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
  
      // Function to update member dropdown
      function updateMemberDropdown(chapterId, allMembers) {
          console.log("🔄 Starting updateMemberDropdown function");
          console.log("📊 Received params:", { chapterId, totalMembers: allMembers?.length });
  
          // Check if we're in "Other" mode
          const invitedByInput = document.getElementById('invited-by-input');
          if (invitedByInput) {
              console.log("📝 In 'Other' mode - skipping member dropdown update");
              return;
          }
  
          const memberDropdown = document.getElementById("company-name");
          if (!memberDropdown) {
              console.error("❌ Member dropdown not found!");
              return;
          }
  
          // Clear existing options
          memberDropdown.innerHTML = `<option selected>Select Member</option>`;
          
          // Filter members by chapter
          const filteredMembers = allMembers.filter(member => {
              console.log("🔍 Checking member:", {
                  memberId: member.member_id,
                  memberChapterId: member.chapter_id,
                  selectedChapterId: chapterId,
                  matches: member.chapter_id == chapterId
              });
              return member.chapter_id == chapterId;
          });

          // Sort members alphabetically by full name
          const sortedMembers = filteredMembers.sort((a, b) => {
              const nameA = `${a.member_first_name} ${a.member_last_name}`.toLowerCase();
              const nameB = `${b.member_first_name} ${b.member_last_name}`.toLowerCase();
              return nameA.localeCompare(nameB);
          });
  
          console.log("✅ Sorted Members:", {
              total: sortedMembers.length,
              members: sortedMembers.map(member => ({
                  id: member.member_id,
                  name: `${member.member_first_name} ${member.member_last_name}`,
                  chapterId: member.chapter_id
              }))
          });
  
          // Populate dropdown with sorted members
          sortedMembers.forEach(member => {
              const option = document.createElement("option");
              option.value = member.member_id;
              option.textContent = `${member.member_first_name} ${member.member_last_name}`;
              
              // Store member details in dataset
              option.dataset.firstName = member.member_first_name;
              option.dataset.lastName = member.member_last_name;
              option.dataset.address = member.member_company_address;
              option.dataset.companyName = member.member_company_name;
              option.dataset.phoneNumber = member.member_phone_number;
              option.dataset.gstNumber = member.member_gst_number;
              
              memberDropdown.appendChild(option);
              console.log("➕ Added member to dropdown:", {
                  id: member.member_id,
                  name: `${member.member_first_name} ${member.member_last_name}`
              });
          });
  
          // Add change event listener
          memberDropdown.addEventListener("change", async function() {
              const selectedOption = memberDropdown.options[memberDropdown.selectedIndex];
              const selectedMemberId = selectedOption.value;
              
              console.log("👤 Member selected:", {
                  memberId: selectedMemberId,
                  chapterId: chapterId
              });
  
              if (selectedOption.value !== "Select Member") {
                  // Update member details fields
                  document.getElementById("member_address").value = selectedOption.dataset.address || "";
                  document.getElementById("member_company_name").value = selectedOption.dataset.companyName || "";
                  document.getElementById("member_phone_number").value = selectedOption.dataset.phoneNumber || "";
                  document.getElementById("member_gst_number").value = selectedOption.dataset.gstNumber || "";
  
                  try {
                      console.log("🔄 Fetching bank order data...");
                      const response = await fetch('https://backend.bninewdelhi.com/api/getbankorder');
                      const bankOrders = await response.json();
                      
                      console.log("📦 Bank Orders received:", bankOrders);
  
                      // Find matching bank order
                      const matchingOrder = bankOrders.find(order => {
                          console.log("🔍 Checking order:", {
                              orderId: order.id,
                              orderMemberId: order.member_id,
                              orderChapterId: order.chapter_id,
                              matches: order.member_id == selectedMemberId && order.chapter_id == chapterId
                          });
                          return order.member_id == selectedMemberId && order.chapter_id == chapterId;
                      });
  
                      console.log("🎯 Matching order found:", matchingOrder);
                      
                      if (matchingOrder) {
                          const baseAmount = parseFloat(matchingOrder.amount_to_pay);
                          
                          // Update amount fields
                          document.getElementById("rate").value = `₹ ${baseAmount.toFixed(2)}`;
                          document.getElementById("price").value = `₹ ${baseAmount.toFixed(2)}`;
                          document.getElementById("taxable-total-amount").value = `₹ ${baseAmount.toFixed(2)}`;
                          
                          // Calculate and set CGST and SGST (9% each)
                          const cgstAmount = (baseAmount * 0.09).toFixed(2);
                          const sgstAmount = (baseAmount * 0.09).toFixed(2);
                          document.getElementById("cgst_amount").value = `₹ ${cgstAmount}`;
                          document.getElementById("sgst_amount").value = `₹ ${sgstAmount}`;
                          
                          // Always calculate grand total with taxes included
                          const grandTotal = (baseAmount + parseFloat(cgstAmount) + parseFloat(sgstAmount)).toFixed(2);
                          document.getElementById("grand_total").value = `₹ ${grandTotal}`;

                          // Add partial amount input handler here to ensure it's set up correctly
                          const partialAmountInput = document.getElementById("partial-amount");
                          const remainingBalanceElement = document.getElementById("remaining-balance");

                          // Remove any existing event listeners
                          const newPartialAmountInput = partialAmountInput.cloneNode(true);
                          partialAmountInput.parentNode.replaceChild(newPartialAmountInput, partialAmountInput);

                          // Add new event listener
                          newPartialAmountInput.addEventListener("input", function() {
                              const partialAmount = parseFloat(this.value) || 0;
                              // Use baseAmount (taxable amount) for remaining balance calculation
                              const remainingBalance = baseAmount - partialAmount;
                              remainingBalanceElement.value = `₹ ${remainingBalance.toFixed(2)}`;
                              
                              console.log('💰 Partial Payment Calculation:', {
                                  partialAmount,
                                  baseAmount,
                                  remainingBalance
                              });
                          });

                          console.log("💰 Updated amounts:", {
                              baseAmount,
                              cgstAmount,
                              sgstAmount,
                              grandTotal
                          });
                      }
                  } catch (error) {
                      console.error("❌ Error fetching bank order data:", error);
                      showToast('error', "Failed to fetch payment details");
                  }
              } else {
                  // Clear all fields
                  console.log("🧹 Clearing all fields - no member selected");
                  document.getElementById("member_address").value = "";
                  document.getElementById("member_company_name").value = "";
                  document.getElementById("member_phone_number").value = "";
                  document.getElementById("member_gst_number").value = "";
                  document.getElementById("rate").value = "";
                  document.getElementById("price").value = "";
                  document.getElementById("taxable-total-amount").value = "";
                  document.getElementById("cgst_amount").value = "";
                  document.getElementById("sgst_amount").value = "";
                  document.getElementById("grand_total").value = "";
              }
          });
  
          // Add this after the member selection change event listener
          // Handle partial payment calculations
          document.getElementById("partial-amount").addEventListener("input", function() {
              const grandTotalElement = document.getElementById("grand_total");
              const remainingBalanceElement = document.getElementById("remaining-balance");
              
              // Get grand total (remove ₹ symbol and commas)
              const grandTotal = parseFloat(grandTotalElement.value.replace(/[₹,\s]/g, '')) || 0;
              
              // Get the input value without any processing
              const inputValue = this.value;
              
              // Only process if there's an actual input
              if (inputValue) {
                  const partialAmount = parseFloat(inputValue);
                  
                  if (!isNaN(partialAmount)) {
                      // Calculate remaining balance (grand total - partial amount)
                      const remainingBalance = grandTotal - partialAmount;
                      remainingBalanceElement.value = `₹ ${remainingBalance.toFixed(2)}`;
                      
                      console.log('💰 Partial Payment:', {
                          grandTotal,
                          partialAmount,
                          remainingBalance
                      });
                  }
              } else {
                  // If input is empty, show full amount as remaining
                  remainingBalanceElement.value = `₹ ${grandTotal.toFixed(2)}`;
              }
          });

          // Add payment type change handler
          document.getElementsByName('paymentType').forEach(radio => {
              radio.addEventListener('change', function() {
                  const partialAmountInput = document.getElementById("partial-amount");
                  const remainingBalanceElement = document.getElementById("remaining-balance");
                  
                  // Reset values when switching payment types
                  if (this.value !== 'partial') {
                      partialAmountInput.value = '';
                      remainingBalanceElement.value = '';
                  } else {
                      // When switching to partial, initialize with empty values
                      partialAmountInput.value = '';
                      const grandTotal = parseFloat(document.getElementById("grand_total").value.replace(/[₹,\s]/g, '')) || 0;
                      remainingBalanceElement.value = formatCurrency(grandTotal);
                  }
              });
          });
  
          // Modify the GST checkbox handler
          document.getElementById("include-gst").addEventListener("change", function() {
            const partialAmountInput = document.getElementById("partial-amount");
            const remainingBalanceElement = document.getElementById("remaining-balance");
            const selectedPaymentType = document.querySelector('input[name="paymentType"]:checked')?.value;
            const baseAmount = parseFloat(document.getElementById("taxable-total-amount").value.replace(/[₹,\s]/g, '')) || 0;
            
            if (selectedPaymentType === "full") {
                // For full payment, only handle CGST and SGST
                if (this.checked) {
                    // Calculate GST (18% split into CGST and SGST)
                    const gstAmount = baseAmount * 0.18;
                    const cgstAmount = gstAmount / 2;
                    const sgstAmount = gstAmount / 2;
                    
                    // Update CGST and SGST fields
                    document.getElementById("cgst_amount").value = `₹ ${cgstAmount.toFixed(2)}`;
                    document.getElementById("sgst_amount").value = `₹ ${sgstAmount.toFixed(2)}`;
                    
                    // Update grand total
                    const grandTotal = baseAmount + gstAmount;
                    document.getElementById("grand_total").value = `₹ ${grandTotal.toFixed(2)}`;
                    
                    console.log('💰 Full Payment GST Calculation:', {
                        baseAmount,
                        gstAmount,
                        cgstAmount,
                        sgstAmount,
                        grandTotal
                    });
                } else {
                    // Reset GST fields when unchecked
                    document.getElementById("cgst_amount").value = "₹ 0.00";
                    document.getElementById("sgst_amount").value = "₹ 0.00";
                    document.getElementById("grand_total").value = `₹ ${baseAmount.toFixed(2)}`;
                }
            } else if (selectedPaymentType === "partial" && partialAmountInput.value) {
                // Existing partial payment logic
                const partialAmount = parseFloat(partialAmountInput.value) || 0;
                
                if (this.checked) {
                    // Calculate GST (18%) on partial amount and round to nearest whole number
                    const gstAmount = Math.round(partialAmount * 0.18);
                    // Add GST to remaining balance instead of subtracting
                    const remainingBalance = baseAmount - partialAmount + gstAmount;
                    remainingBalanceElement.value = `₹ ${remainingBalance.toFixed(2)}`;
                    
                    console.log('💰 Partial Payment GST Calculation:', {
                        partialAmount,
                        gstAmount,
                        baseAmount,
                        remainingBalance
                    });
                } else {
                    // If GST is unchecked, just subtract partial amount
                    const remainingBalance = baseAmount - partialAmount;
                    remainingBalanceElement.value = `₹ ${remainingBalance.toFixed(2)}`;
                    
                    console.log('💰 Partial Payment Calculation:', {
                        partialAmount,
                        baseAmount,
                        remainingBalance
                    });
                }
            }
          });
  
          console.log("✅ Member dropdown update complete");
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
  
      // Clear existing options and add default option
      companyDropdown.innerHTML = '<option value="">Select Company</option>';
  
      // Populate company dropdown - Only ADI CORPORATE TRAINING
      companies.forEach(company => {
        if (company.company_id === 1) {  // Only add ADI CORPORATE TRAINING
          const companyOption = document.createElement("option");
          companyOption.value = company.company_id;
          companyOption.textContent = company.company_name;
          companyOption.selected = true;  // Auto-select this option
          companyDropdown.appendChild(companyOption);
          
          // Auto-fill the fields
          companyAddress.value = company.company_address || "";
          companyMail.value = company.company_email || "";
          companyPhone.value = company.company_phone || "";
          companyGst.value = company.company_gst || "";
        }
      });
  
      // Keep the change event listener
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
            const memberBankOrder = bankOrderData.find(order => 
                order.member_id === selectedMemberId && 
                order.chapter_id === selectedChapterId
            );

            // Fetch member credits
            const creditResponse = await fetch(`https://backend.bninewdelhi.com/api/getAllMemberCredit`);
            const creditData = await creditResponse.json();
            const memberCredits = creditData.filter(credit => 
                credit.member_id === selectedMemberId && 
                credit.chapter_id === selectedChapterId && 
                credit.is_adjusted === false
            );

            // Calculate total credit amount
            const totalCreditAmount = memberCredits.reduce((sum, credit) => 
                sum + parseFloat(credit.credit_amount), 0
            );

            // Get current date
            const currentDateResponse = await fetch(`https://backend.bninewdelhi.com/api/getCurrentDate`);
            const currentDate = await currentDateResponse.json();

            // Update UI with kitty bill info
            if (memberBankOrder) {
                let amountToPay = parseFloat(memberBankOrder.amount_to_pay);
                const kittyDueDate = memberBankOrder.kitty_due_date;
                const numberOfLatePayments = memberBankOrder.no_of_late_payment;
                const kittyPenalty = parseFloat(memberBankOrder.kitty_penalty);
                const advancePayment = parseFloat(memberBankOrder.advance_pay) || 0;

                // Subtract advance payment if exists
                if (advancePayment > 0) {
                    amountToPay = Math.max(0, amountToPay - advancePayment);
                    console.log('💰 Amount after advance payment deduction:', {
                        originalAmount: memberBankOrder.amount_to_pay,
                        advancePayment,
                        finalAmount: amountToPay
                    });
                }

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
                this.dataset.advancePayment = advancePayment;
            }
          } catch (error) {
            console.error("Error fetching member data:", error);
            showToast('error', "Error fetching member data");
          }
        });
  
        // Modify the partial amount input handler
        document.getElementById("partial-amount").addEventListener("input", function() {
            const partialAmount = parseFloat(this.value) || 0;
            const remainingBalanceElement = document.getElementById("remaining-balance");
            
            // Get taxable amount (not grand total)
            const taxableAmount = parseFloat(document.getElementById("taxable-total-amount").value.replace(/[₹,\s]/g, '')) || 0;
            
            // Calculate remaining balance using taxable amount
            const remainingBalance = taxableAmount - partialAmount;
            remainingBalanceElement.value = `₹ ${remainingBalance.toFixed(2)}`;
            
            console.log('💰 Partial Payment Calculation:', {
                partialAmount,
                taxableAmount,
                remainingBalance
            });
        });

        // Modify the GST checkbox handler
        document.getElementById("include-gst").addEventListener("change", function() {
            const partialAmountInput = document.getElementById("partial-amount");
            const remainingBalanceElement = document.getElementById("remaining-balance");
            
            // Only recalculate if there's a partial amount entered
            if (partialAmountInput.value) {
                const partialAmount = parseFloat(partialAmountInput.value) || 0;
                const baseAmount = parseFloat(document.getElementById("taxable-total-amount").value.replace(/[₹,\s]/g, '')) || 0;
                
                if (this.checked) {
                    // Calculate GST (18%) on partial amount and round to nearest whole number
                    const gstAmount = Math.round(partialAmount * 0.18);
                    // Add GST to remaining balance instead of subtracting
                    const remainingBalance = baseAmount - partialAmount + gstAmount;
                    remainingBalanceElement.value = `₹ ${remainingBalance.toFixed(2)}`;
                    
                    console.log('💰 GST Toggle for Partial Payment:', {
                        partialAmount,
                        gstAmount,
                        baseAmount,
                        remainingBalance
                    });
                } else {
                    // If GST is unchecked, just subtract partial amount
                    const remainingBalance = baseAmount - partialAmount;
                    remainingBalanceElement.value = `₹ ${remainingBalance.toFixed(2)}`;
                    
                    console.log('💰 GST Toggle for Partial Payment:', {
                        partialAmount,
                        baseAmount,
                        remainingBalance
                    });
                }
            }
        });

        // Modify the payment type change handler
        document.getElementsByName('paymentType').forEach(radio => {
            radio.addEventListener('change', function() {
                const partialAmountInput = document.getElementById("partial-amount");
                const remainingBalanceElement = document.getElementById("remaining-balance");
                
                // Reset values when switching payment types
                if (this.value !== 'partial') {
                    partialAmountInput.value = '';
                    remainingBalanceElement.value = '';
                } else {
                    // When switching to partial, initialize with empty values
                    partialAmountInput.value = '';
                    const taxableAmount = parseFloat(document.getElementById("taxable-total-amount").value.replace(/[₹,\s]/g, '')) || 0;
                    remainingBalanceElement.value = formatCurrency(taxableAmount);
                }
            });
        });
      }
  
      // Add advance payment handling while keeping existing code
      document.querySelectorAll('input[name="paymentType"]').forEach(radio => {
          radio.addEventListener('change', function() {
              const partialAmountInput = document.getElementById("partial-amount");
              const advanceAmountInput = document.getElementById("advance-amount");
              const remainingBalanceElement = document.getElementById("remaining-balance");
              
              // Reset and hide/show fields based on payment type
              if (this.value === 'full') {
                  partialAmountInput.style.display = 'none';
                  advanceAmountInput.style.display = 'none';
                  document.getElementById("advance-amount-row").style.display = 'none';
                  document.getElementById("remaining-balance-row").style.display = 'none';
              } else if (this.value === 'partial') {
                  partialAmountInput.style.display = 'block';
                  advanceAmountInput.style.display = 'none';
                  document.getElementById("advance-amount-row").style.display = 'none';
                  document.getElementById("remaining-balance-row").style.display = 'table-row';
              } else if (this.value === 'advance') {
                  partialAmountInput.style.display = 'none';
                  document.getElementById("advance-amount-row").style.display = 'table-row';
                  document.getElementById("remaining-balance-row").style.display = 'none';
              }
          });
      });

      // Add advance amount input handler
      document.getElementById("advance-amount")?.addEventListener("input", function() {
          const advanceAmount = parseFloat(this.value) || 0;
          const grandTotal = parseFloat(document.getElementById("grand_total").value.replace(/[₹,\s]/g, '')) || 0;
          
          if (grandTotal === 0 || advanceAmount > grandTotal) {
              console.log('💰 Valid advance payment:', {
                  advanceAmount,
                  grandTotal,
                  withGST: advanceAmount * 1.18 // Always calculate with GST
              });
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
  
  let selectedRegionId = null;  // Global variables to store IDs
  let selectedChapterId = null;
  
  document.addEventListener('DOMContentLoaded', function() {
    const universalLinkId = new URLSearchParams(window.location.search).get("id");
    const submitButton = document.getElementById("submit_invoice");
    console.log("🔄 Initializing kitty payment handler with universal link ID:", universalLinkId);

    if (universalLinkId === "4" && submitButton) {
        console.log("✅ Found submit button for kitty payments (ID 4)");
        
        submitButton.addEventListener("click", async function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("🔘 Make Kitty Payment Invoice button clicked");
            
            try {
                // Get member details
                const memberSelect = document.getElementById("company-name");
                const selectedOption = memberSelect.options[memberSelect.selectedIndex];
                console.log("👤 Selected member value:", selectedOption?.value);

                if (!selectedOption || selectedOption.value === "Select Member") {
                    console.log("❌ No member selected");
                    showToast('warning', "Please select a member first");
                    return;
                }

                // Get payment method details
                const paymentDetails = getPaymentDetails();

                // Calculate total tax (CGST + SGST)
                const cgstAmount = parseFloat(document.getElementById("cgst_amount").value.replace('₹', '').trim()) || 0;
                const sgstAmount = parseFloat(document.getElementById("sgst_amount").value.replace('₹', '').trim()) || 0;
                const totalTax = cgstAmount + sgstAmount;
                console.log("💰 Tax details:", { cgst: cgstAmount, sgst: sgstAmount, total: totalTax });

                // Get kitty bill ID
                const kittyBillId = document.getElementById("kitty-bill-info").dataset.billId;
                console.log("📝 Kitty Bill ID:", kittyBillId);

                if (!kittyBillId) {
                    console.log("❌ Kitty bill ID not found");
                    showToast('warning', "Kitty bill ID not found");
                    return;
                }

                // Get invoice date and time
                const invoiceDateIssued = document.getElementById("invoice-date-issued").value;
                if (!invoiceDateIssued) {
                    showToast('warning', "Please select invoice date and time");
                    return;
                }

                // Check if GST is included
                const isGstIncluded = document.getElementById("include-gst").checked;

                // Build base invoice data
                const grandTotalElement = document.getElementById("grand_total");
                const grandTotal = grandTotalElement ? 
                    parseFloat(grandTotalElement.value.replace(/[₹,\s]/g, '')) : 0;

                let invoiceData = {
                    region_id: selectedRegionId,
                    chapter_id: selectedChapterId,
                    member_id: selectedOption.value,
                    member_first_name: selectedOption.dataset.firstName,
                    member_last_name: selectedOption.dataset.lastName,
                    member_mobilenumber: document.getElementById("member_phone_number").value,
                    member_company_name: document.getElementById("member_company_name").value,
                    member_gstin: document.getElementById("member_gst_number").value,
                    kitty_bill_id: kittyBillId,
                    order_amount: grandTotal,
                    tax_amount: isGstIncluded ? totalTax : 0,
                    created_at: invoiceDateIssued
                };

                // Add meeting payment specific data
                const selectedPaymentType = document.querySelector('input[name="paymentType"]:checked')?.value;
                const totalAmount = parseFloat(memberSelect.dataset.totalAmount || 0);
                const gstAmount = parseFloat(memberSelect.dataset.gstAmount || 0);
                const creditAmount = parseFloat(memberSelect.dataset.creditAmount || 0);
                const penaltyAmount = parseFloat(memberSelect.dataset.penaltyAmount || 0);
                const noOfLatePayment = parseInt(memberSelect.dataset.noOfLatePayment || 0);

                let amountToPay = totalAmount;
                let remainingBalanceWithGst = 0;
                let paymentType = "full";

                if (selectedPaymentType === "partial") {
                    const partialAmount = parseFloat(document.getElementById("partial-amount").value || 0);
                    const isGstIncluded = document.getElementById("include-gst").checked;
                    
                    // Calculate GST amount if included
                    const gstAmount = isGstIncluded ? (partialAmount * 0.18) : 0;
                    
                    // Get remaining balance from the input field
                    const remainingBalanceWithGst = parseFloat(
                        document.getElementById("remaining-balance").value.replace(/[₹,\s]/g, '')
                    ) || 0;
                    
                    // Order amount should always be the partial amount entered
                    const orderAmount = partialAmount;
                    
                    Object.assign(invoiceData, {
                        order_amount: orderAmount,
                        partial_amount: partialAmount,
                        payment_type: "partial",
                        payment_note: "meeting-payments-partial",
                        remaining_balance_with_gst: remainingBalanceWithGst,  
                        tax_amount: isGstIncluded ? gstAmount : 0,
                        created_at: invoiceDateIssued,
                        member_pending_balance: remainingBalanceWithGst
                    });

                    // Remove the second Object.assign that was overwriting these values
                    // and just add the remaining fields
                    Object.assign(invoiceData, {
                        penalty_amount: penaltyAmount,
                        no_of_late_payment: noOfLatePayment,
                        date_of_update: new Date().toISOString()
                    });
                } else if (selectedPaymentType === "advance") {
                    const advanceAmount = parseFloat(document.getElementById("advance-amount").value || 0);
                    const includeGst = document.getElementById("include-gst").checked;
                    
                    paymentType = "advance";
                    
                    const advanceWithGST = includeGst ? advanceAmount * 1.18 : advanceAmount;
                    const taxAmount = includeGst ? advanceAmount * 0.18 : 0;

                    Object.assign(invoiceData, {
                        order_amount: advanceWithGST,
                        payment_type: "advance",
                        payment_note: "meeting-payments-advance",
                        advance_amount: advanceAmount,
                        tax_amount: includeGst ? taxAmount : 0,
                        created_at: invoiceDateIssued
                    });
                }

                // Adjust for credits
                const finalAmount = Math.max(0, amountToPay - creditAmount);

                // Add detailed console logging of the complete invoice data
                console.log("📋 Complete Invoice Data to be sent:", {
                    ...invoiceData,
                    paymentDetails: getPaymentDetails(),
                    memberDetails: {
                        id: selectedOption.value,
                        name: `${selectedOption.dataset.firstName} ${selectedOption.dataset.lastName}`,
                        company: selectedOption.dataset.companyName,
                        address: selectedOption.dataset.address,
                        phone: selectedOption.dataset.phoneNumber,
                        gst: selectedOption.dataset.gstNumber
                    },
                    chapterDetails: {
                        regionId: selectedRegionId,
                        chapterId: selectedChapterId
                    },
                    paymentType: selectedPaymentType,
                    amounts: {
                        grandTotal,
                        totalTax,
                        baseAmount: amountToPay,
                        creditAmount,
                        penaltyAmount,
                        remainingBalance: remainingBalanceWithGst
                    }
                });

                // Show confirmation dialog
                console.log("🔔 Showing confirmation dialog");
                const confirmResult = await Swal.fire({
                    title: 'Confirm Kitty Payment',
                    html: `
                        <div style="text-align: left">
                            <p><strong>Member:</strong> ${selectedOption.dataset.firstName} ${selectedOption.dataset.lastName}</p>
                            <p><strong>Amount:</strong> ₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            <p><strong>Payment Type:</strong> ${paymentType}</p>
                            ><strong>Payment Method:</strong> <strong>Cash</strong></p>
                            <p><strong>Tax Amount:</strong> ₹${totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        </div>
                    `,
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Yes, Process Payment!',
                    cancelButtonText: 'Cancel',
                    confirmButtonColor: '#6259ca',
                    cancelButtonColor: '#7987a1',
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    reverseButtons: true
                });

                if (confirmResult.isDismissed || !confirmResult.isConfirmed) {
                    console.log("❌ User cancelled payment");
                    return;
                }

                // If confirmed, proceed with payment
                console.log("✅ Payment confirmed, processing...");
                showLoader();

                // Add advance payment handling before the API call
                if (selectedPaymentType === "advance") {
                    const advanceAmount = parseFloat(document.getElementById("advance-amount").value || 0);
                    const includeGst = document.getElementById("include-gst").checked;
                    const grandTotal = parseFloat(document.getElementById("grand_total").value.replace(/[₹,\s]/g, '')) || 0;

                    // Calculate amounts based on GST checkbox
                    const advanceWithGST = includeGst ? advanceAmount * 1.18 : advanceAmount;
                    const taxAmount = includeGst ? advanceAmount * 0.18 : 0;

                    if (grandTotal === 0) {
                        // Case 1: When grand total is zero
                        Object.assign(invoiceData, {
                            order_amount: advanceWithGST,
                            payment_type: "advance",
                            payment_note: "meeting-payments-advance",
                            advance_amount: advanceAmount,
                            tax_amount: includeGst ? taxAmount : undefined
                        });
                    } else if (advanceAmount > grandTotal) {
                        // Case 2: When advance is greater than grand total
                        Object.assign(invoiceData, {
                            order_amount: advanceWithGST,
                            payment_type: "advance",
                            payment_note: "meeting-payments-advance",
                            advance_amount: advanceAmount - grandTotal,
                            tax_amount: includeGst ? taxAmount : undefined
                        });
                    }

                    // Remove tax_amount if GST is not included
                    if (!includeGst) {
                        delete invoiceData.tax_amount;
                    }

                    console.log("💰 Advance Payment (Second Section):", {
                        amount: advanceAmount,
                        withGST: includeGst,
                        finalAmount: advanceWithGST,
                        taxAmount: taxAmount,
                        grandTotal: grandTotal,
                        paymentType: "advance"
                    });
                }

                // Keep existing console log
                console.log("🌐 Payment Data to be sent:", invoiceData);

                // Keep rest of the existing code (API call, success handling, etc.)

                showToast('success', "Check console for payment data");

                const response = await fetch('https://backend.bninewdelhi.com/api/addKittyPaymentManually', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(invoiceData)
                });

                const responseData = await response.json();
                console.log("📥 API Response:", responseData);

                if (response.ok) {
                    showToast('success', "Invoice created successfully!");
                    await Swal.fire({
                        icon: 'success',
                        title: 'Invoice Created Successfully!',
                        html: `
                            <div style="text-align: left;">
                                <p><strong>Member:</strong> ${selectedOption.dataset.firstName} ${selectedOption.dataset.lastName}</p>
                                <p><strong>Amount:</strong> ₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                <p><strong>Order ID:</strong> ${responseData.order_id}</p>
                            </div>
                        `,
                        timer: 3000,
                        showConfirmButton: true,
                        confirmButtonText: 'View Transactions'
                    });

                    window.location.href = '/t/all-transactions';
                } else {
                    throw new Error(responseData.message || 'Failed to create invoice');
                }
                
            } catch (error) {
                console.error("❌ Error:", error);
                showToast('error', error.message || "Error processing payment");
            }
        });
    } else {
        console.log("ℹ️ Not a kitty payment page or submit button not found");
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