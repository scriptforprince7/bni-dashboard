// Function to show the loader
function showLoader() {
    document.getElementById("loader").style.display = "flex";
  }
  
  // Function to hide the loader
  function hideLoader() {
    document.getElementById("loader").style.display = "none";
  }
  
  document.addEventListener("DOMContentLoaded", async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const universalLinkId = urlParams.get("id");
  
    if (!universalLinkId) return;
  
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
          chapterLink.addEventListener("click", function() {
            chapterDropdownBtn.innerHTML = `<i class="ti ti-sort-descending-2 me-1"></i> ${chapter.chapter_name}`;
            selectedChapterId = chapter.chapter_id;  // Store the chapter ID
            console.log("🏢 Selected Chapter:", {
              name: chapter.chapter_name,
              id: selectedChapterId
            });
            updateMemberDropdown(selectedChapterId, members);
          });
          
  
          chapterItem.appendChild(chapterLink);
          chapterDropdown.appendChild(chapterItem);
        });
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
        "http://localhost:5000/api/company"
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
      document.getElementById('invoiceForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
          showLoader();
          
          // Get all form data
          const formData = new FormData(this);
          
          // Get payment details
          const paymentData = getPaymentDetails();
          
          // Combine form data with payment data
          const invoiceData = {
            // Add your existing invoice data here
            member_id: formData.get('member_id'),
            company_id: formData.get('company_id'),
            // ... other invoice fields ...
            
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
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      hideLoader();
    }
  });
  
  // -------- send data to the backend --------
  
  let selectedRegionId = null;  // Global variables to store IDs
  let selectedChapterId = null;
  
  document.getElementById("submit_invoice").addEventListener("click", async function() {
      showLoader();
  
      // Get member details from selected option
      const memberSelect = document.getElementById("company-name");
      const selectedOption = memberSelect.options[memberSelect.selectedIndex];
  
      // Ensure a member is selected
      if (!selectedOption || selectedOption.value === "Select Member") {
          Swal.fire({
              icon: 'warning',
              title: 'Member Required',
              text: 'Please select a member first'
          });
          hideLoader();
          return;
      }
  
      // Get member name from the dataset (which was set when populating the dropdown)
      const memberFirstName = selectedOption.dataset.firstName;
      const memberLastName = selectedOption.dataset.lastName;
  
      console.log("👤 Selected Member Details:", {
          id: selectedOption.value,
          first_name: memberFirstName,
          last_name: memberLastName,
          full_name: `${memberFirstName} ${memberLastName}`,
          company: selectedOption.dataset.companyName
      });
  
      // Get payment method and details
      const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked').id;
      const paymentNote = document.getElementById('payment-note').value;
      
      // Build mode_of_payment object
      let mode_of_payment = {};
      switch(selectedMethod) {
          case 'cashOption':
              mode_of_payment = {
                  cash: { payment_note: paymentNote }
              };
              break;
          case 'upiOption':
              mode_of_payment = {
                  upi: {
                      upi_id: document.getElementById('upiId').value,
                      reference_number: document.getElementById('upiNumber').value,
                      payment_note: paymentNote
                  }
              };
              break;
          case 'bankOption':
              const transferType = document.querySelector('input[name="bankTransferType"]:checked')?.id;
              mode_of_payment = {
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
              mode_of_payment = {
                  cheque: {
                      cheque_number: document.getElementById('chequeNo').value,
                      ifsc_code: document.getElementById('ifscCode').value,
                      payment_note: paymentNote
                  }
              };
              break;
      }
  
      // Build invoice data
      const invoiceData = {
          region_id: selectedRegionId,
          chapter_id: selectedChapterId,
          universal_link_id: new URLSearchParams(window.location.search).get("id"),
          date_issued: document.getElementById("invoice-date-issued").value,
          training_id: JSON.parse(document.getElementById("particulars").value).id,
          member_id: selectedOption.value,
          member_first_name: memberFirstName,
          member_last_name: memberLastName,
          member_address: document.getElementById("member_address").value,
          member_company_name: document.getElementById("member_company_name").value,
          member_phone_number: document.getElementById("member_phone_number").value,
          member_gst_number: document.getElementById("member_gst_number").value,
          particulars: document.getElementById("particulars").options[document.getElementById("particulars").selectedIndex].textContent,
          rate: document.getElementById("rate").value,
          amount: document.getElementById("price").value,
          taxable_total_amount: document.getElementById("taxable-total-amount").value,
          cgst_amount: document.getElementById("cgst_amount").value,
          sgst_amount: document.getElementById("sgst_amount").value,
          grand_total: document.getElementById("grand_total").value,
          mode_of_payment: mode_of_payment
      };
  
      console.log("📝 Invoice Submission:", {
          member: {
              id: invoiceData.member_id,
              name: `${memberFirstName} ${memberLastName}`,
              company: invoiceData.member_company_name
          },
          amount: invoiceData.grand_total,
          payment: mode_of_payment
      });
  
      try {
          const response = await fetch("http://localhost:5000/api/add-invoice", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(invoiceData)
          });
  
          const result = await response.json();
          console.log("✅ Server Response:", result);
  
          if (response.ok) {
              // Clear form fields
              document.getElementById("company-name").value = "Select Member";
              document.getElementById("member_address").value = "";
              document.getElementById("member_company_name").value = "";
              document.getElementById("member_phone_number").value = "";
              document.getElementById("member_gst_number").value = "";
              document.getElementById("particulars").value = "";
              document.getElementById("rate").value = "";
              document.getElementById("price").value = "";
              document.getElementById("taxable-total-amount").value = "";
              document.getElementById("cgst_amount").value = "";
              document.getElementById("sgst_amount").value = "";
              document.getElementById("grand_total").value = "";
              document.getElementById("payment-note").value = "";
  
              // Show success message with invoice details
              await Swal.fire({
                  icon: 'success',
                  title: 'Invoice Created Successfully!',
                  html: `
                      <div style="text-align: left;">
                          <p><strong>Member:</strong> ${memberFirstName} ${memberLastName}</p>
                          <p><strong>Amount:</strong> ${invoiceData.grand_total}</p>
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
          console.error("❌ Error:", error);
          Swal.fire({
              icon: 'error',
              title: 'Error Creating Invoice',
              text: error.message,
              confirmButtonText: 'Try Again'
          });
      } finally {
          hideLoader();
      }
  });