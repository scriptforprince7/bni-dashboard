// Show/hide loader functions
function showLoader() {
  document.getElementById('loader').style.display = 'flex';
}

function hideLoader() {
  document.getElementById('loader').style.display = 'none';
}

// Function to populate select options
function populateSelectOptions(selectId, data, valueKey, textKey, selectedValue) {
  const selectElement = document.getElementById(selectId);
  if (!selectElement) {
    console.warn(`Element with id '${selectId}' not found`);
    return;
  }
  
  // Clear existing options first
  selectElement.innerHTML = '';
  
  // Add default option
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Select';
  selectElement.appendChild(defaultOption);
  
  // Add data options
  if (Array.isArray(data)) {
    data.forEach(item => {
      if (item && typeof item === 'object') {
        const option = document.createElement('option');
        option.value = item[valueKey] || '';
        option.textContent = item[textKey] || '';
        if (item[valueKey] === selectedValue) {
          option.selected = true;
        }
        selectElement.appendChild(option);
      }
    });
  }
}


function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0'); // Add leading zero for months < 10
  const day = String(d.getDate()).padStart(2, '0'); // Add leading zero for days < 10
  return `${year}-${month}-${day}`;
}

// Add this function near the top with other utility functions
async function fetchAndPopulateCountries() {
  try {
    const response = await fetch('https://restcountries.com/v3.1/all');
    if (!response.ok) throw new Error('Failed to fetch countries.');

    const countries = await response.json();
    const selectElement = document.getElementById('country');

    selectElement.innerHTML = '<option value="">Select Country</option>';

    // Add India first
    const india = countries.find(country => country.cca2 === 'IN');
    if (india) {
      const indiaOption = document.createElement('option');
      indiaOption.value = india.cca2;
      indiaOption.textContent = india.name.common;
      selectElement.appendChild(indiaOption);
    }

    // Add other countries
    countries.forEach(country => {
      if (country.cca2 !== 'IN') { // Skip India since we already added it
        const option = document.createElement('option');
        option.value = country.cca2;
        option.textContent = country.name.common;
        selectElement.appendChild(option);
      }
    });

    // Set India as default
    selectElement.value = 'IN';
  } catch (error) {
    console.error('Error populating country dropdown:', error);
    alert('Failed to load country data. Please try again.');
  }
}

// Initialize the page
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // First populate countries and set India as default
    await fetchAndPopulateCountries();
    document.getElementById('country').value = 'IN'; // Set India as default immediately

    const urlParams = new URLSearchParams(window.location.search);
    const memberId = urlParams.get('member_id');
    
    if (!memberId) {
      alert('No member ID provided!');
      return;
    }

    showLoader();
    // Fetch member data
    const memberResponse = await fetch(`https://backend.bninewdelhi.com/api/getMember/${memberId}`);
    if (!memberResponse.ok) throw new Error('Error fetching member data');

    const member = await memberResponse.json();
    console.log('📄 Fetched member data:', member);

    // If member has a different country, update it, otherwise keep India
    if (member.country && member.country !== 'IN') {
      document.getElementById('country').value = member.country;
    } else {
      document.getElementById('country').value = 'IN'; // Ensure India is selected
    }

    // Fetch and populate regions
    const regionResponse = await fetch('https://backend.bninewdelhi.com/api/regions'); // Adjust the endpoint accordingly
    if (!regionResponse.ok) throw new Error('Error fetching regions data');
    const regions = await regionResponse.json();
    populateSelectOptions('region_id', regions, 'region_id', 'region_name', member.region_id);

    // Fetch and populate chapters
    const chapterResponse = await fetch('https://backend.bninewdelhi.com/api/chapters'); // Adjust the endpoint accordingly
    if (!chapterResponse.ok) throw new Error('Error fetching chapters data');
    const chapters = await chapterResponse.json();
    populateSelectOptions('chapter_id', chapters, 'chapter_id', 'chapter_name', member.chapter_id);

    // Fetch all accolades
    const accoladesResponse = await fetch('https://backend.bninewdelhi.com/api/accolades');
    if (!accoladesResponse.ok) throw new Error('Error fetching accolades');
    
    const accolades = await accoladesResponse.json(); // This should return a list of accolades

    // Set image previews if they exist
    if (member.member_photo) {
      const memberPhotoPreview = document.getElementById('memberPhotoImage');
      memberPhotoPreview.src = `https://backend.bninewdelhi.com/api/uploads/memberLogos/${member.member_photo}`;
      document.getElementById('memberPhotoPreview').style.display = 'block';
    }

    if (member.member_company_logo) {
      const companyLogoPreview = document.getElementById('companyLogoImage');
      companyLogoPreview.src = `https://backend.bninewdelhi.com/api/uploads/memberCompanyLogos/${member.member_company_logo}`;
      document.getElementById('companyLogoPreview').style.display = 'block';
    }

    // Handle accolades properly
    const accoladesContainer = document.getElementById('accoladesContainer');
    accoladesContainer.innerHTML = ''; // Clear existing content

    // Add Select All checkbox
    const selectAllDiv = document.createElement('div');
    selectAllDiv.className = 'form-check';
    selectAllDiv.innerHTML = `
      <input type="checkbox" class="form-check-input" id="selectAllAccolades">
      <label class="form-check-label" for="selectAllAccolades">
        <strong>Select All Accolades</strong>
      </label>
    `;
    accoladesContainer.appendChild(selectAllDiv);

    // Convert member.accolades_id to array if it's null or string
    const memberAccolades = member.accolades_id 
      ? (Array.isArray(member.accolades_id) 
        ? member.accolades_id 
        : member.accolades_id.split(',').map(id => parseInt(id.trim())))
      : [];

    console.log('🏆 Member accolades:', memberAccolades);

    // Create checkboxes for each accolade
    accolades.forEach(accolade => {
      const div = document.createElement('div');
      div.className = 'form-check';
      div.innerHTML = `
        <input type="checkbox" 
               class="form-check-input accolade-checkbox" 
               id="accolade_${accolade.accolade_id}" 
               name="accolades_id" 
               value="${accolade.accolade_id}"
               ${memberAccolades.includes(accolade.accolade_id) ? 'checked' : ''}>
        <label class="form-check-label" for="accolade_${accolade.accolade_id}">
          ${accolade.accolade_name}
        </label>
      `;
      accoladesContainer.appendChild(div);
    });

    // Add Select All functionality
    const selectAllCheckbox = document.getElementById('selectAllAccolades');
    const accoladeCheckboxes = document.querySelectorAll('.accolade-checkbox');

    selectAllCheckbox.addEventListener('change', function() {
      accoladeCheckboxes.forEach(checkbox => {
        checkbox.checked = this.checked;
      });
    });

    // Update Select All when individual checkboxes change
    accoladeCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        selectAllCheckbox.checked = Array.from(accoladeCheckboxes)
          .every(cb => cb.checked);
      });
    });

    // Fetch and populate categories
    const categoryResponse = await fetch('https://backend.bninewdelhi.com/api/memberCategory');
    if (!categoryResponse.ok) throw new Error('Error fetching categories');
    
    const categories = await categoryResponse.json(); // This should return a list of categories

    // Populate the categories dropdown
    const defaultCategory = "Digital Marketing"; // Default category if no category is selected
    populateSelectOptions('category', categories, 'category_id', 'category_name', member.category_id || defaultCategory);

    // Set the default value of the membership select box to 2 (2 Year)
    const membershipSelect = document.getElementById('member_current_membership');
      
    // Set the selected membership value
    membershipSelect.value = member.member_current_membership || 2; // Default to 2 Year if no value is found

    // Populate other member fields
    document.getElementById('member_first_name').value = member.member_first_name || 'Not Found';
    document.getElementById('member_last_name').value = member.member_last_name || 'Not Found';
    document.getElementById('member_date_of_birth').value = formatDate(member.member_date_of_birth);
    document.getElementById('member_phone_number').value = member.member_phone_number || 'Not Found';
    document.getElementById('member_alternate_mobile_numberr').value = member.member_alternate_mobile_number || 'Not Found';
    document.getElementById('member_email_address').value = member.member_email_address || 'Not Found';
    document.getElementById('street_address_line_1').value = member.street_address_line_1 || 'Not Found';
    document.getElementById('street_address_line_2').value = member.street_address_line_2 || 'Not Found';
    document.getElementById('address_pincode').value = member.address_pincode || 'Not Found';
    document.getElementById('address_city').value = member.address_city || 'Not Found';
    document.getElementById('address_state').value = member.address_state || 'Not Found';
    document.getElementById('member_induction_date').value = member.member_induction_date ? member.member_induction_date.substring(0, 10) : 'Not Found';
    document.getElementById('member_renewal_date').value = member.member_renewal_date ? member.member_renewal_date.substring(0, 10) : 'Not Found';
    document.getElementById('member_gst_number').value = member.member_gst_number || 'Not Found';
    document.getElementById('member_company_name').value = member.member_company_name || 'Not Found';
    document.getElementById('member_company_address').value = member.member_company_address || 'Not Found';
    document.getElementById('member_company_state').value = member.member_company_state || 'Not Found';
    document.getElementById('member_company_city').value = member.member_company_city || 'Not Found';
    document.getElementById('member_company_pincode').value = member.member_company_pincode || 'Not Found';
    document.getElementById('member_photo').src = member.member_photo || 'Not Found';
    document.getElementById('member_status').value = member.member_status || 'Not Found';
    document.getElementById('member_website').value = member.member_website || 'Not Found';
    document.getElementById('member_company_logo').src = member.member_company_logo || 'Not Found';

    document.getElementById('member_facebook').value = member.member_facebook || 'Not Found';
    document.getElementById('member_instagram').value = member.member_instagram || 'Not Found';
    document.getElementById('member_linkedin').value = member.member_linkedin || 'Not Found';
    document.getElementById('member_youtube').value = member.member_youtube || 'Not Found';
    document.getElementById('member_sponsored_by').value = member.member_sponsored_by || 'Not Found';
    document.getElementById('date_of_publishing').value = formatDate(member.date_of_publishing);

    // Add this with other field populations
    document.getElementById('meeting_opening_balance').value = member.meeting_opening_balance || '0';

    // Add this block to handle category input
    const editCategoryInput = document.getElementById('editCategoryInput');
    if (editCategoryInput) {
      editCategoryInput.value = member.category_name || '';
      let selectedClassification = member.category_name || '';

      editCategoryInput.addEventListener('click', function() {
        Swal.fire({
          title: 'Update Classification',
          input: 'text',
          inputLabel: 'Enter new classification',
          inputValue: selectedClassification,
          inputPlaceholder: 'Classification name',
          showCancelButton: true,
          confirmButtonText: 'Update',
          preConfirm: (classification) => {
            if (!classification) {
              Swal.showValidationMessage('Please enter a classification name');
            }
            return classification;
          }
        }).then((result) => {
          if (result.isConfirmed && result.value) {
            selectedClassification = result.value;
            editCategoryInput.value = result.value;

            Swal.fire({
              icon: 'success',
              title: 'Updated!',
              text: `Classification has been updated to "${result.value}"`,
              timer: 1500,
              showConfirmButton: false
            });
          }
        });
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
    toastr.error('Failed to load member data');
  } finally {
    hideLoader();
  }
});

const urlParams = new URLSearchParams(window.location.search);
const memberId = urlParams.get('member_id');


// Function to collect form data and prepare it for the update
const collectMemberFormData = () => {
  const memberData = {
    member_first_name: document.querySelector("#member_first_name").value,
    member_last_name: document.querySelector("#member_last_name").value,
    member_date_of_birth: document.querySelector("#member_date_of_birth").value,
    member_phone_number: document.querySelector("#member_phone_number").value,
    member_alternate_mobile_number: document.querySelector("#member_alternate_mobile_numberr").value,
    member_email_address: document.querySelector("#member_email_address").value,
    street_address_line_1: document.querySelector("#street_address_line_1").value,
    street_address_line_2: document.querySelector("#street_address_line_2").value,
    address_pincode: document.querySelector("#address_pincode").value,
    address_city: document.querySelector("#address_city").value,
    address_state: document.querySelector("#address_state").value,
    region_id: document.querySelector("#region_id").value,
    chapter_id: document.querySelector("#chapter_id").value,
    accolades_id: Array.from(document.querySelectorAll('input[name="accolades_id"]:checked'))
      .map(checkbox => checkbox.value),
    category_name: document.querySelector("#editCategoryInput")?.value || '',
    member_current_membership: document.querySelector("#member_current_membership").value,
    member_renewal_date: document.querySelector("#member_renewal_date").value,
    member_gst_number: document.querySelector("#member_gst_number").value,
    member_company_name: document.querySelector("#member_company_name").value,
    member_company_address: document.querySelector("#member_company_address").value,
    member_company_state: document.querySelector("#member_company_state").value,
    member_company_city: document.querySelector("#member_company_city").value,
    member_company_pincode: document.querySelector("#member_company_pincode").value,
    member_photo: document.querySelector("#member_photo").src,
    member_website: document.querySelector("#member_website").value,
    member_facebook: document.querySelector("#member_facebook").value,
    member_instagram: document.querySelector("#member_instagram").value,
    member_linkedin: document.querySelector("#member_linkedin").value,
    member_youtube: document.querySelector("#member_youtube").value,
    member_sponsored_by: document.querySelector("#member_sponsored_by").value,
    date_of_publishing: document.querySelector("#date_of_publishing").value,
    member_status: document.querySelector("#member_status").value,
    country: document.querySelector("#country").value,
    meeting_opening_balance: document.querySelector("#meeting_opening_balance").value || 0
  };

  console.log('📦 Collected member data:', memberData);
  return memberData;
};

// Add these preview functions at the top of the file
function previewMemberPhoto(input) {
    console.log('📸 Member photo selected');
    const preview = document.getElementById('memberPhotoImage');
    const previewContainer = document.getElementById('memberPhotoPreview');
    
    if (input.files && input.files[0]) {
        const file = input.files[0];
        console.log('📄 Member photo details:', {
            name: file.name,
            type: file.type,
            size: `${(file.size / 1024).toFixed(2)} KB`
        });

        const reader = new FileReader();
        reader.onload = function(e) {
            console.log('🖼️ Loading member photo preview');
            preview.src = e.target.result;
            previewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function removeMemberPhoto() {
    console.log('🗑️ Removing member photo');
    const input = document.getElementById('member_photo');
    const preview = document.getElementById('memberPhotoImage');
    const previewContainer = document.getElementById('memberPhotoPreview');
    
    input.value = '';
    preview.src = '';
    previewContainer.style.display = 'none';
}

function previewCompanyLogo(input) {
    console.log('🏢 Company logo selected');
    const preview = document.getElementById('companyLogoImage');
    const previewContainer = document.getElementById('companyLogoPreview');
    
    if (input.files && input.files[0]) {
        const file = input.files[0];
        console.log('📄 Company logo details:', {
            name: file.name,
            type: file.type,
            size: `${(file.size / 1024).toFixed(2)} KB`
        });

        const reader = new FileReader();
        reader.onload = function(e) {
            console.log('🖼️ Loading company logo preview');
            preview.src = e.target.result;
            previewContainer.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function removeCompanyLogo() {
    console.log('🗑️ Removing company logo');
    const input = document.getElementById('member_company_logo');
    const preview = document.getElementById('companyLogoImage');
    const previewContainer = document.getElementById('companyLogoPreview');
    
    input.value = '';
    preview.src = '';
    previewContainer.style.display = 'none';
}

// Update the updateMemberData function to handle file uploads
const updateMemberData = async () => {
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You are about to edit the member details!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, update it!',
        cancelButtonText: 'No, cancel!',
    });

    if (result.isConfirmed) {
        try {
            showLoader();
            
            // Create FormData object
            const formData = new FormData();
            
            // Add all form fields to FormData
            const memberData = collectMemberFormData();
            Object.keys(memberData).forEach(key => {
                formData.append(key, memberData[key]);
            });

            // Add files if they exist
            const memberPhotoInput = document.getElementById('member_photo');
            const companyLogoInput = document.getElementById('member_company_logo');

            if (memberPhotoInput.files[0]) {
                console.log('📸 Adding member photo to form data');
                formData.append('member_photo', memberPhotoInput.files[0]);
            }

            if (companyLogoInput.files[0]) {
                console.log('🏢 Adding company logo to form data');
                formData.append('member_company_logo', companyLogoInput.files[0]);
            }

            // Log form data for debugging
            console.log('📦 Form data being sent:');
            for (let [key, value] of formData.entries()) {
                if (value instanceof File) {
                    console.log(`${key}:`, value.name);
                } else {
                    console.log(`${key}:`, value);
                }
            }

            const response = await fetch(`https://backend.bninewdelhi.com/api/updateMember/${memberId}`, {
                method: 'PUT',
                body: formData // Don't set Content-Type header for FormData
            });

            const responseData = await response.json();
            if (response.ok) {
                console.log('✅ Member updated successfully:', responseData);
                Swal.fire('Updated!', 'The Member details have been updated.', 'success');
                setTimeout(() => {
                    window.location.href = '/m/manage-members';
                }, 1200);
            } else {
                console.error('❌ Failed to update member:', responseData);
                Swal.fire('Error!', `Failed to update member: ${responseData.message}`, 'error');
            }
        } catch (error) {
            console.error('❌ Error updating member:', error);
            Swal.fire('Error!', 'Failed to update member. Please try again.', 'error');
        } finally {
            hideLoader();
        }
    } else {
        console.log('Update canceled');
    }
};


document.getElementById("updateChapterBtn").addEventListener("click", updateMemberData);
