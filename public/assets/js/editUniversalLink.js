// Function to show the loader
function showLoader() {
    document.getElementById("loader").style.display = "flex";
  }
  
  // Function to hide the loader
  function hideLoader() {
    document.getElementById("loader").style.display = "none";
  }


document.addEventListener('DOMContentLoaded', async function () {
    // Get the universal link ID from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const universalLinkId = urlParams.get('id');

    if (!universalLinkId) {
        alert('No universal link ID provided!');
        return;
    }

    try {
        showLoader();
        // Fetch the universal link details
        const response = await fetch(`https://bni-data-backend.onrender.com/api/getUniversalLink/${universalLinkId}`);
        if (!response.ok) throw new Error('Error fetching universal link details');
        
        const universalLink = await response.json();

        const gatewayResponse = await fetch('https://bni-data-backend.onrender.com/api/paymentGateway');
        if (!gatewayResponse.ok) throw new Error('Error fetching payment gateways');
        const paymentGateways = await gatewayResponse.json();

        // Populate the form fields
        document.getElementById('link_name').value = universalLink.universal_link_name || '';
        document.getElementById('link_ulid').value = universalLink.ulid || '';
        document.getElementById('link_slug').value = universalLink.link_slug || '';

         // Configure status dropdown
         const statusDropdown = document.getElementById('link_status');
         statusDropdown.innerHTML = `
             <option value="active" ${universalLink.status === 'active' ? 'selected' : ''}>Active</option>
             <option value="inactive" ${universalLink.status === 'inactive' ? 'selected' : ''}>Inactive</option>
         `;

        // Populate payment gateway dropdown
        const paymentGatewaySelect = document.getElementById('link_payment_gateway');
        paymentGateways.forEach(gateway => {
            const option = document.createElement('option');
            option.value = gateway.gateway_id;
            option.textContent = gateway.gateway_name; // Assuming `name` exists in the payment gateway data
            if (gateway.gateway_id === universalLink.payment_gateway) {
                option.selected = true; // Auto-select the current payment gateway
            }
            paymentGatewaySelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error fetching universal link:', error);
        alert('Failed to fetch universal link details. Please try again.');
    } finally {
        hideLoader();
    }
});

const urlParams = new URLSearchParams(window.location.search);
const universalLinkId = urlParams.get('id');

// Function to collect form data and prepare it for the update
const collectFormData = () => {
    const linkData = {
        link_name: document.querySelector("#link_name").value,
        link_ulid: document.querySelector("#link_ulid").value,
        link_slug: document.querySelector("#link_slug").value,
        link_status: document.querySelector("#link_status").value,
        link_payment_gateway: document.querySelector("#link_payment_gateway").value,
    };

    return linkData;
};

// Function to send the updated data to the backend after confirmation
const updateLinkData = async () => {
    // Ask for confirmation using SweetAlert
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You are about to edit the universal link details!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, update it!',
        cancelButtonText: 'No, cancel!',
    });

    if (result.isConfirmed) {
        const linkData = collectFormData();
        console.log(linkData); // Verify the data before sending it

        try {
            showLoader(); // Show the loader when sending data
            const response = await fetch(`https://bni-data-backend.onrender.com/api/updateUniversalLink/${universalLinkId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(linkData),
            });

            if (response.ok) {
                const updatedRegion = await response.json();
                console.log('Universal Link updated successfully:', updatedRegion);
                Swal.fire('Updated!', 'The Universal Link details have been updated.', 'success');
                setTimeout(() => {
                    window.location.href = '/u/manage-universal-links';  // Redirect to the region page
                }, 1200);
            } else {
                const errorResponse = await response.json();
                console.error('Failed to update universal link:', errorResponse);
                Swal.fire('Error!', `Failed to update universal link: ${errorResponse.message}`, 'error');
            }
        } catch (error) {
            console.error('Error updating universal link:', error);
            Swal.fire('Error!', 'Failed to update universal link. Please try again.', 'error');
        } finally {
            hideLoader(); // Hide the loader once the request is complete
        }
    } else {
        console.log('Update canceled');
    }
};

document.getElementById("updateRegionBtn").addEventListener("click", updateLinkData);
