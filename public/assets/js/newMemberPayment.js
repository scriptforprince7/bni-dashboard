// Add this at the very top of the file
console.log("🚀 new member payment.js loaded - Meeting Payments (ID: 1)");
// At the very top of newMemberPayment.js
window.isNewMemberPayment = true;

// Add these global variables at the top of the file
let selectedRegionId = null;
let selectedChapterId = null;

// Declare fee variables in window scope to ensure they persist
window.oneTimeFee = 0;
window.oneYearFee = 0;
window.twoYearFee = 0;
window.fiveYearFee = 0;

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
    // Track the last selected membership duration (default to "1")
    let lastSelectedMembershipDuration = "1";

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
          const response = await fetch(`http://localhost:5000/api/get-gst-details/${gstNumber}`);
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
        "http://localhost:5000/api/universalLinks"
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
        "http://localhost:5000/api/regions"
      );
      const regions = await regionResponse.json();
  
      // Fetch chapters
      const chapterResponse = await fetch(
        "http://localhost:5000/api/chapters"
      );
      const chapters = await chapterResponse.json();
  
      // Fetch members
      const memberResponse = await fetch(
        "http://localhost:5000/api/members"
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
        selectedRegionId = regionId; // Store the selected region ID
  
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
            selectedChapterId = chapter.chapter_id; // Store the selected chapter ID
            console.log("🏢 Selected Chapter:", {
              name: chapter.chapter_name,
              id: selectedChapterId
            });
  
            // Find the region object for this chapter
            const regionForChapter = regions.find(r => r.region_id == chapter.region_id);
            if (regionForChapter) {
              setMembershipFeesFromRegion(regionForChapter);
              console.log('[setMembershipFeesFromRegion] called for region:', regionForChapter.region_name);
              // Update amounts with default 1 year membership
              updateAmountFieldsByMembership("1");
            } else {
              console.warn('No region found for chapter:', chapter.chapter_name);
            }
  
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
          const response = await fetch("http://localhost:5000/api/getKittyPayments");
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
  
          console.log("✅ Filtered Members:", {
              total: filteredMembers.length,
              members: filteredMembers.map(member => ({
                  id: member.member_id,
                  name: `${member.member_first_name} ${member.member_last_name}`,
                  chapterId: member.chapter_id
              }))
          });
  
          // Populate dropdown with filtered members
          filteredMembers.forEach(member => {
              const option = document.createElement("option");
              option.value = member.member_id;
              option.textContent = `${member.member_first_name} ${member.member_last_name}`;
              
              // Store member details in dataset
              option.dataset.firstName = member.member_first_name;
              option.dataset.lastName = member.member_last_name;
              option.dataset.address = member.street_address_line_1;
              option.dataset.companyName = member.member_company_name;
              option.dataset.phoneNumber = member.member_phone_number;
              option.dataset.gstNumber = member.member_gst_number;
              
              memberDropdown.appendChild(option);
              console.log("➕ Added member to dropdown:", {
                  id: member.member_id,
                  name: `${member.member_first_name} ${member.member_last_name}`
              });
          });
  
          // Add change event listener (cleaned up: only membership fee logic)
          memberDropdown.addEventListener("change", function() {
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
  
                  // Use membership fee logic for amount fields (default to 1 Yr)
                  updateAmountFieldsByMembership("1");
                  // Set membership dropdown to 1 Yr
                  const membershipDropdown = document.getElementById('membershipDuration');
                  if (membershipDropdown) membershipDropdown.value = "1";
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
                  const partialPaymentRow = document.getElementById('partial-payment-row');
                  const remainingBalanceRow = document.getElementById('remaining-balance-row');
                  
                  // Reset values when switching payment types
                  if (this.value !== 'partial') {
                      if (partialPaymentRow) partialPaymentRow.style.display = 'none';
                      if (remainingBalanceRow) remainingBalanceRow.style.display = 'none';
                      document.getElementById('partial-amount').value = '';
                      document.getElementById('remaining-balance').value = '';
                  } else {
                      // When switching to partial, show the fields
                      if (partialPaymentRow) partialPaymentRow.style.display = 'table-row';
                      if (remainingBalanceRow) remainingBalanceRow.style.display = 'table-row';
                  }
              });
          });
  
          // Add partial amount input handler
          document.getElementById('partial-amount')?.addEventListener('input', function() {
              const grandTotalElement = document.getElementById('grand_total');
              const remainingBalanceElement = document.getElementById('remaining-balance');
              
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
  
          // Add this after member selection event listener
          document.getElementById("include-gst").addEventListener("change", function() {
            const taxableAmount = parseFloat(document.getElementById("taxable-total-amount").value.replace(/[₹,\s]/g, '')) || 0;
            const cgstField = document.getElementById("cgst_amount");
            const sgstField = document.getElementById("sgst_amount");
            const grandTotalField = document.getElementById("grand_total");

            if (this.checked) {
              // Calculate GST (9% CGST + 9% SGST = 18% total)
              const cgstAmount = (taxableAmount * 0.09).toFixed(2);
              const sgstAmount = (taxableAmount * 0.09).toFixed(2);
              const grandTotal = (taxableAmount + (parseFloat(cgstAmount) * 2)).toFixed(2);

              // Update fields with GST
              cgstField.value = `₹ ${cgstAmount}`;
              sgstField.value = `₹ ${sgstAmount}`;
              grandTotalField.value = `₹ ${grandTotal}`;
            } else {
              // Reset GST fields
              cgstField.value = "-";
              sgstField.value = "-";
              grandTotalField.value = `₹ ${taxableAmount.toFixed(2)}`;
            }
          });
  
          console.log("✅ Member dropdown update complete");
      }
      // Show all chapters by default
      updateChapterDropdown(null, chapters);
  
      // Fetch company data
      const companyResponse = await fetch(
        "http://localhost:5000/api/company"
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
        "http://localhost:5000/api/universalLinks"
      );
      const universalLinks = await response.json();
  
      const selectedLink = universalLinks.find(
        link => link.id == universalLinkId
      );
  
      if (!selectedLink) return;
  
      // If ID is 3, fetch training data and populate the dropdown
      if (selectedLink.id == 3) {
        const trainingResponse = await fetch(
          "http://localhost:5000/api/allTrainings"
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
            const bankOrderResponse = await fetch(`http://localhost:5000/api/getbankOrder`);
            const bankOrderData = await bankOrderResponse.json();
            const memberBankOrder = bankOrderData.find(order => 
                order.member_id === selectedMemberId && 
                order.chapter_id === selectedChapterId
            );

            // Fetch member credits
            const creditResponse = await fetch(`http://localhost:5000/api/getAllMemberCredit`);
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
            const currentDateResponse = await fetch(`http://localhost:5000/api/getCurrentDate`);
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
  
        // Handle partial payment calculation
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

      // After region and chapter dropdowns are set up:
      const paymentTypeContainer = document.getElementById('payment-type-radio-container');
      if (paymentTypeContainer) {
        paymentTypeContainer.innerHTML = `
          <div class="form-group" style="margin-top: 15px;">
            <label style="font-weight: 500; margin-bottom: 8px;">Payment Type:</label>
            <div>
              <input type="radio" id="fullPaymentRadio" name="paymentType" value="full" checked>
              <label for="fullPaymentRadio" style="margin-right: 20px;">Full Payment</label>
              <input type="radio" id="partialPaymentRadio" name="paymentType" value="partial">
              <label for="partialPaymentRadio">Partial Payment</label>
            </div>
          </div>
        `;
      }

      // Add this after the membership dropdown container setup
      const membershipDropdownContainer = document.getElementById('membership-dropdown-container');
      if (membershipDropdownContainer) {
        membershipDropdownContainer.innerHTML = `
          <div class="form-group" style="margin-top: 15px; width: 40%;">
            <label for="membershipDuration" style="font-weight: 500; margin-bottom: 8px;">Select Membership:</label>
            <select id="membershipDuration" class="form-select">
              <option value="" disabled>Select Duration</option>
              <option value="1" selected>1 Yr</option>
              <option value="2">2 Yrs</option>
              <option value="5">5 Yrs</option>
            </select>
          </div>
        `;

        // Attach event listener immediately after creating the dropdown
        const membershipDropdown = document.getElementById('membershipDuration');
        if (membershipDropdown) {
          membershipDropdown.addEventListener('change', function() {
            console.log('📊 Membership duration changed to:', this.value);
            updateAmountFieldsByMembership(this.value);
          });
        }
      }

      // Only run this for id=1 (new member payment)
      if (urlParams.get('id') === '1') {
        const nameInput = document.getElementById('nm-name');
        const emailInput = document.getElementById('nm-email');
        const categoryInput = document.getElementById('nm-category');
        const dateInput = document.getElementById('nm-date');
        const mobileInput = document.getElementById('nm-mobile');
        const companyNameInput = document.getElementById('nm-company-name');
        const gstinInput = document.getElementById('nm-company-gstin');
        const companyAddressInput = document.getElementById('nm-company-address');

        // Fetch all visitors
        let visitors = [];
        try {
          const res = await fetch('http://localhost:5000/api/getallvisitors');
          visitors = await res.json();
        } catch (err) {
          console.error('Failed to fetch visitors:', err);
          visitors = [];
        }

        // Prepare datalist for autocomplete
        let datalist = document.getElementById('visitor-names-list');
        if (!datalist) {
          datalist = document.createElement('datalist');
          datalist.id = 'visitor-names-list';
          document.body.appendChild(datalist);
        }
        nameInput.setAttribute('list', 'visitor-names-list');

        // Populate datalist
        datalist.innerHTML = '';
        visitors.forEach(visitor => {
          const option = document.createElement('option');
          option.value = visitor.visitor_name;
          datalist.appendChild(option);
        });

        // Helper: Find visitor by name (case-insensitive)
        function findVisitorByName(name) {
          return visitors.find(v => v.visitor_name.trim().toLowerCase() === name.trim().toLowerCase());
        }

        // Helper: Set all amount fields to zero
        function setAllAmountFieldsToZero() {
          document.getElementById('rate').value = '₹ 0.00';
          document.getElementById('price').value = '₹ 0.00';
          document.getElementById('taxable-total-amount').value = '₹ 0.00';
          document.getElementById('cgst_amount').value = '₹ 0.00';
          document.getElementById('sgst_amount').value = '₹ 0.00';
          document.getElementById('grand_total').value = '₹ 0.00';
        }

        // Helper: Set amount fields with GST calculation
        function setAmountFieldsWithGST(amount) {
          const amt = parseFloat(amount) || 0;
          const cgst = +(amt * 0.09).toFixed(2);
          const sgst = +(amt * 0.09).toFixed(2);
          const grandTotal = +(amt + cgst + sgst).toFixed(2);

          document.getElementById('rate').value = `₹ ${amt.toLocaleString('en-IN', {minimumFractionDigits:2})}`;
          document.getElementById('price').value = `₹ ${amt.toLocaleString('en-IN', {minimumFractionDigits:2})}`;
          document.getElementById('taxable-total-amount').value = `₹ ${amt.toLocaleString('en-IN', {minimumFractionDigits:2})}`;
          document.getElementById('cgst_amount').value = `₹ ${cgst.toLocaleString('en-IN', {minimumFractionDigits:2})}`;
          document.getElementById('sgst_amount').value = `₹ ${sgst.toLocaleString('en-IN', {minimumFractionDigits:2})}`;
          document.getElementById('grand_total').value = `₹ ${grandTotal.toLocaleString('en-IN', {minimumFractionDigits:2})}`;
        }

        // On name input blur or change, auto-fill if match found
        async function handleVisitorSelection(selectedName) {
          const visitor = findVisitorByName(selectedName);

          if (visitor) {
            emailInput.value = visitor.visitor_email || '';
            categoryInput.value = visitor.visitor_category || '';
            dateInput.value = visitor.visited_date ? visitor.visited_date.split('T')[0] : '';
            mobileInput.value = visitor.visitor_phone || '';
            companyNameInput.value = visitor.visitor_company_name || '';
            gstinInput.value = visitor.visitor_gst || '';
            companyAddressInput.value = visitor.visitor_company_address || visitor.visitor_address || '';

            // Now, fetch membership pending and update amount fields if found
            try {
              const pendingRes = await fetch('http://localhost:5000/api/getMembershipPending');
              const pendingList = await pendingRes.json();
              // Find by visitor_id
              const pending = pendingList.find(p => String(p.visitor_id) === String(visitor.visitor_id));
              if (pending) {
                let totalAmt = parseFloat(pending.total_amount);
                let dueBal = parseFloat(pending.due_balance);

                // If both are NaN or zero, set all to zero
                if ((isNaN(totalAmt) || totalAmt === 0) && (isNaN(dueBal) || dueBal === 0)) {
                  setAllAmountFieldsToZero();
                } else if (!isNaN(dueBal) && dueBal > 0) {
                  setAmountFieldsWithGST(dueBal);
                } else if (!isNaN(totalAmt) && totalAmt > 0) {
                  setAmountFieldsWithGST(totalAmt);
                } else {
                  setAllAmountFieldsToZero();
                }
              } else {
                // Do NOT update amount fields if visitor not found in membership API
                console.log('Visitor not found in membership pending API');
              }
            } catch (err) {
              setAllAmountFieldsToZero();
              console.error('Error fetching membership pending:', err);
            }
          } else {
            // If not found, clear the rest (optional)
            emailInput.value = '';
            categoryInput.value = '';
            dateInput.value = '';
            mobileInput.value = '';
            companyNameInput.value = '';
            gstinInput.value = '';
            companyAddressInput.value = '';
          }
        }

        // Attach event listeners
        nameInput.addEventListener('change', function() {
          handleVisitorSelection(nameInput.value);
        });
        nameInput.addEventListener('blur', function() {
          handleVisitorSelection(nameInput.value);
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
  
  document.addEventListener('DOMContentLoaded', function() {
    const universalLinkId = new URLSearchParams(window.location.search).get("id");
    const submitButton = document.getElementById("submit_invoice");
    console.log("🔄 Initializing new member payment handler with universal link ID:", universalLinkId);

    if (universalLinkId === "1" && submitButton) {
      console.log("✅ Found submit button for new member payment (ID 1)");
        
        submitButton.addEventListener("click", async function(e) {
            e.preventDefault();
            e.stopPropagation();
        console.log("🔘 Make New Member Payment Invoice button clicked");
        console.log("Current oneTimeFee value:", window.oneTimeFee);

        try {
          // Use the stored IDs
          const region_id = selectedRegionId;
          const chapter_id = selectedChapterId;

          if (!region_id || !chapter_id) {
            showToast('error', "Please select both Region and Chapter");
                    return;
                }

          // Collect all form data
          const name = document.getElementById('nm-name').value.trim();
          const email = document.getElementById('nm-email').value.trim();
          const category = document.getElementById('nm-category').value.trim();
          const date = document.getElementById('nm-date').value.trim();
          const mobile = document.getElementById('nm-mobile').value.trim();
          const companyName = document.getElementById('nm-company-name').value.trim();
          const gstin = document.getElementById('nm-company-gstin').value.trim();
          const companyAddress = document.getElementById('nm-company-address').value.trim();

          // Membership fee details
          const oneTimeFee = window.oneTimeFee || 0;
          const oneYearFee = window.oneYearFee || 0;
          const twoYearFee = window.twoYearFee || 0;
          const fiveYearFee = window.fiveYearFee || 0;
          const membershipDuration = document.getElementById('membershipDuration')?.value || "1";
          let membershipFee = 0;
          let renewalYear = "1Year";
          if (membershipDuration === "1") {
            membershipFee = oneYearFee;
            renewalYear = "1Year";
          } else if (membershipDuration === "2") {
            membershipFee = twoYearFee;
            renewalYear = "2Year";
          } else if (membershipDuration === "5") {
            membershipFee = fiveYearFee;
            renewalYear = "5Year";
          }

          // Check if partial payment is selected
          const paymentType = document.querySelector('input[name="paymentType"]:checked')?.value;
          let order_amount = 0;
          let tax_amount = 0;

          if (paymentType === 'partial') {
            // Get partial amount
            const partialAmount = parseFloat(document.getElementById('partial-amount').value.replace(/[₹,\s]/g, '')) || 0;
            if (partialAmount <= 0) {
              showToast('error', "Please enter a valid partial amount");
                    return;
                }
            order_amount = partialAmount;
            // Calculate tax amount based on partial payment
            const taxableAmount = parseFloat(document.getElementById('taxable-total-amount').value.replace(/[₹,\s]/g, '')) || 0;
            const totalAmount = parseFloat(document.getElementById('grand_total').value.replace(/[₹,\s]/g, '')) || 0;
            const taxPercentage = (totalAmount - taxableAmount) / taxableAmount;
            tax_amount = order_amount * taxPercentage;
                    } else {
            // Use full amount
            order_amount = parseFloat(document.getElementById('grand_total').value.replace(/[₹,\s]/g, '')) || 0;
            tax_amount = parseFloat(document.getElementById('cgst_amount').value.replace(/[₹,\s]/g, '')) * 2 || 0;
          }

          // Calculate membership fee without GST
          const membershipFeeWithoutGST = order_amount - tax_amount;

          // Payment details (from your getPaymentDetails function)
          const paymentDetails = getPaymentDetails();

          // Build payload
          const payload = {
            payment_note: "New Member Payment",
            order_amount: order_amount,
            tax_amount: tax_amount,
            one_time_registration_fee: oneTimeFee,
            membership_fee: membershipFee,
            renewal_year: renewalYear,
            region_id: region_id,
            chapter_id: chapter_id,
            visitor_name: name,
            visitor_email: email,
            visitor_phone: mobile,
            visitor_company_name: companyName,
            visitor_company_address: companyAddress,
            visitor_address: companyAddress,
            visitor_gst: gstin,
            visitor_business: category,
            visitor_category: category,
            visited_date: date,
            company: companyName,
            payment_details: paymentDetails
          };

          console.log("Final payload with fees:", {
            one_time_registration_fee: payload.one_time_registration_fee,
            membership_fee: payload.membership_fee,
            renewal_year: payload.renewal_year
          });

          // Before showing the confirmation dialog, add detailed console logging
          console.log('🚀 ====== PAYMENT SUBMISSION DATA ======');
          console.log('📊 Region & Chapter:', {
              region_id: region_id,
              chapter_id: chapter_id,
              region_name: regionDropdownBtn?.textContent?.trim(),
              chapter_name: chapterDropdownBtn?.textContent?.trim()
          });

          console.log('👤 Visitor Details:', {
              name: name,
              email: email,
              category: category,
              date: date,
              mobile: mobile,
              companyName: companyName,
              gstin: gstin,
              companyAddress: companyAddress
          });

          console.log('💰 Fee Details:', {
              one_time_registration_fee: oneTimeFee,
              membership_fee: membershipFee,
              renewal_year: renewalYear,
              membership_duration: membershipDuration
          });

          console.log('💵 Payment Details:', {
              order_amount: order_amount,
              tax_amount: tax_amount,
              payment_type: paymentType,
              payment_details: paymentDetails
          });

          console.log('📦 Complete Payload:', payload);

          // Show confirmation dialog
          const confirmResult = await Swal.fire({
            title: 'Confirm New Member Payment',
            html: `
                <div style="text-align: left">
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Phone:</strong> ${mobile}</p>
                    <p><strong>Company:</strong> ${companyName}</p>
                    <p><strong>Region:</strong> ${regionDropdownBtn?.textContent?.trim() || 'Not selected'}</p>
                    <p><strong>Chapter:</strong> ${chapterDropdownBtn?.textContent?.trim() || 'Not selected'}</p>
                    <p><strong>Payment Type:</strong> ${paymentType === 'partial' ? 'Partial Payment' : 'Full Payment'}</p>
                    <p><strong>Amount:</strong> ₹${order_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p><strong>Tax Amount:</strong> ₹${tax_amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p><strong>Membership Duration:</strong> ${renewalYear}</p>
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

          // If confirmed, show success message
          showToast('success', "Check console for payment data!");

          // Commented out: API call
          
          const response = await fetch('http://localhost:5000/api/addNewMemberPaymentManually', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
                });

                const responseData = await response.json();
                console.log("📥 API Response:", responseData);

                if (response.ok) {
            showToast('success', "New member payment processed successfully!");
                    window.location.href = '/t/all-transactions';
                } else {
            throw new Error(responseData.message || 'Failed to process payment');
                }
          
                
            } catch (error) {
                console.error("❌ Error:", error);
          showToast('error', error.message || "Error preparing payment data");
            }
        });
    } else if (universalLinkId === "4" && submitButton) {
      // ... existing code for kitty payments ...
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
  // Store membership fees globally for use in calculation
  let oneTimeFee = 0, oneYearFee = 0, twoYearFee = 0, fiveYearFee = 0;

  // After you fetch regions/chapters and set up the dropdowns, set these values
  // For example, after selecting a chapter:
  function setMembershipFeesFromRegion(region) {
    console.log('🔍 Setting fees from region:', region);
    window.oneTimeFee = parseFloat(region.one_time_registration_fee) || 0;
    window.oneYearFee = parseFloat(region.one_year_fee) || 0;
    window.twoYearFee = parseFloat(region.two_year_fee) || 0;
    window.fiveYearFee = parseFloat(region.five_year_fee) || 0;
    console.log('[Membership Fees] oneTime:', window.oneTimeFee, '1yr:', window.oneYearFee, '2yr:', window.twoYearFee, '5yr:', window.fiveYearFee);
  }

  // ... inside your chapter selection logic, after you get the region object:
  setMembershipFeesFromRegion(matchedRegion); // matchedRegion is your selected region object

  // Utility to update all amount fields based on selected duration
  function updateAmountFieldsByMembership(duration) {
    let membershipFee = 0;
    if (duration === "1") {
        membershipFee = window.oneYearFee;
    } else if (duration === "2") {
        membershipFee = window.twoYearFee;
    } else if (duration === "5") {
        membershipFee = window.fiveYearFee;
    }
    const subtotal = window.oneTimeFee + membershipFee;
    const gst = +(subtotal * 0.18).toFixed(2);
    const grandTotal = +(subtotal + gst).toFixed(2);

    // Set the values in the form fields
    document.getElementById('rate').value = `₹ ${subtotal.toLocaleString('en-IN', {minimumFractionDigits:2})}`;
    document.getElementById('price').value = `₹ ${subtotal.toLocaleString('en-IN', {minimumFractionDigits:2})}`;
    document.getElementById('taxable-total-amount').value = `₹ ${subtotal.toLocaleString('en-IN', {minimumFractionDigits:2})}`;
    document.getElementById('cgst_amount').value = `₹ ${(gst/2).toLocaleString('en-IN', {minimumFractionDigits:2})}`;
    document.getElementById('sgst_amount').value = `₹ ${(gst/2).toLocaleString('en-IN', {minimumFractionDigits:2})}`;
    document.getElementById('grand_total').value = `₹ ${grandTotal.toLocaleString('en-IN', {minimumFractionDigits:2})}`;

    console.log('[Membership Calculation]', {
        duration,
        oneTimeFee: window.oneTimeFee,
        membershipFee,
        subtotal,
        gst,
        grandTotal
    });
  }

