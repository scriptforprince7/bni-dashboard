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
      "https://bni-data-backend.onrender.com/api/universalLinks"
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
      "https://bni-data-backend.onrender.com/api/regions"
    );
    const regions = await regionResponse.json();

    // Fetch chapters
    const chapterResponse = await fetch(
      "https://bni-data-backend.onrender.com/api/chapters"
    );
    const chapters = await chapterResponse.json();

    // Fetch members
    const memberResponse = await fetch(
      "https://bni-data-backend.onrender.com/api/members"
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
      memberDropdown.innerHTML = `<option selected>Select Member</option>`;

      const filteredMembers = allMembers.filter(
        member => member.chapter_id == chapterId
      );

      filteredMembers.forEach(member => {
        const fullName = `${member.member_first_name} ${member.member_last_name}`.trim();
        const memberOption = document.createElement("option");
        memberOption.value = member.member_id; // Store member_id as value
        memberOption.textContent = fullName;
        memberOption.dataset.address = member.street_address_line_1; // Use correct address field
        memberOption.dataset.companyName = member.member_company_name;
        memberOption.dataset.phoneNumber = member.member_phone_number;
        memberOption.dataset.gstNumber = member.member_gst_number;

        memberDropdown.appendChild(memberOption);
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
      "https://bni-data-backend.onrender.com/api/company"
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
      "https://bni-data-backend.onrender.com/api/universalLinks"
    );
    const universalLinks = await response.json();

    const selectedLink = universalLinks.find(
      link => link.id == universalLinkId
    );

    if (!selectedLink) return;

    // If ID is 3, fetch training data and populate the dropdown
    if (selectedLink.id == 3) {
      const trainingResponse = await fetch(
        "https://bni-data-backend.onrender.com/api/allTrainings"
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
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    hideLoader();
  }
});

// -------- send data to the backend --------

let selectedRegionId = null;  // Global variables to store IDs
let selectedChapterId = null;

document
  .getElementById("submit_invoice")
  .addEventListener("click", async function() {
    showLoader();

    const universalLinkId = new URLSearchParams(window.location.search).get("id");
    const trainingDropdown = document.getElementById("particulars");

    console.log("🔍 Pre-submission Check:", {
      selectedRegionId,
      selectedChapterId,
      universalLinkId
    });

    if (!selectedRegionId || !selectedChapterId) {
      console.warn("⚠️ Missing required selections:", {
        regionId: selectedRegionId,
        chapterId: selectedChapterId
      });
      alert("Please select all required fields.");
      hideLoader();
      return;
    }

    // Collecting form data
    const invoiceData = {
      region_id: selectedRegionId,
      chapter_id: selectedChapterId,
      universal_link_id: universalLinkId,
      date_issued: document.getElementById("invoice-date-issued").value,
      training_id: JSON.parse(document.getElementById("particulars").value).id,
      hsn_sac: "999511",
      rate: document.getElementById("rate").value,
      amount: document.getElementById("price").value,
      taxable_total_amount: document.getElementById("taxable-total-amount").value,
      cgst_amount: document.getElementById("cgst_amount").value,
      sgst_amount: document.getElementById("sgst_amount").value,
      grand_total: document.getElementById("grand_total").value,
      member_id: document.getElementById("company-name").value,
      member_address: document.getElementById("member_address").value,
      member_company_name: document.getElementById("member_company_name").value,
      member_phone_number: document.getElementById("member_phone_number").value,
      member_gst_number: document.getElementById("member_gst_number").value,
      particulars: document.getElementById("particulars").options[document.getElementById("particulars").selectedIndex].textContent
    };

    console.log("📝 Final Invoice Data:", {
      ...invoiceData,
      regionIdType: typeof selectedRegionId,
      chapterIdType: typeof selectedChapterId
    });

    try {
      console.log("🚀 Sending request to backend...");
      const response = await fetch("http://localhost:5000/api/add-invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(invoiceData)
      });

      const result = await response.json();
      console.log("✅ Backend Response:", result);

      if (response.ok) {
        alert("Invoice submitted successfully!");
        window.location.reload();
      } else {
        console.error("❌ Backend Error:", result);
        alert("Error submitting invoice: " + result.message);
      }
    } catch (error) {
      console.error("❌ Fetch Error:", error);
      alert("Failed to submit invoice. Please try again.");
    } finally {
      hideLoader();
    }
  });
