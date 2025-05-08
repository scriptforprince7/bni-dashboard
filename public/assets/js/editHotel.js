document.addEventListener("DOMContentLoaded", async function () {

    function showLoader() {
        document.getElementById('loader').style.display = 'flex';
    }
    
    // Function to hide the loader
    function hideLoader() {
        document.getElementById('loader').style.display = 'none';
    }
    const urlParams = new URLSearchParams(window.location.search);
    const hotelId = urlParams.get("id"); // Fetch hotel_id from URL
    if (!hotelId) {
        alert("No hotel selected for editing.");
        return;
    }

    try {
        showLoader();
        // Fetch all hotels
        const response = await fetch("http://backend.bninewdelhi.com/api/getHotels");
        const hotels = await response.json();

        // Find the selected hotel by ID
        const hotel = hotels.find(h => h.hotel_id == hotelId);
        if (!hotel) {
            alert("Hotel not found!");
            return;
        }

        // Populate the form fields
        document.getElementById("hotel_name").value = hotel.hotel_name;
        document.getElementById("hotel_address").value = hotel.hotel_address;
        document.getElementById("hotel_pincode").value = hotel.hotel_pincode;
        document.getElementById("hotel_bill_amount").value = hotel.hotel_bill_amount;
        document.getElementById("hotel_published_by").value = hotel.hotel_published_by;
        document.getElementById("hotel_phone").value = hotel.hotel_phone;
        document.getElementById("hotel_email").value = hotel.hotel_email;

        document.getElementById("bank_name").value = hotel.bank_name;
        document.getElementById("ifsc_code").value = hotel.ifsc_code;
        document.getElementById("account_no").value = hotel.account_no;
        document.getElementById("account_type").value = hotel.account_type;
        document.getElementById("hotel_gst").value = hotel.hotel_gst;
        document.getElementById("hotel_bank_proof").value = hotel.hotel_bank_proof;

        document.getElementById("date_of_publishing").value = hotel.date_of_publishing.split("T")[0]; // Format Date
        document.getElementById("hotel_status").value = hotel.is_active ? "Active" : "Inactive";
        document.getElementById("hotel_alternative_phone").value = hotel.hotel_alternative_phone;
        document.getElementById("beneficiary_name").value = hotel.beneficiary_name;
        document.getElementById("swift_code").value = hotel.swift_code;

    } catch (error) {
        console.error("Error fetching hotels:", error);
        alert("Error fetching hotel details. Please try again.");
    } finally {
        hideLoader();
    }

    // Form submission logic with SweetAlert confirmation
    document.getElementById("editHotelForm").addEventListener("submit", async function (e) {
        e.preventDefault(); // Prevent default form submission

        Swal.fire({
            title: "Are you sure?",
            text: "Do you really want to update this hotel?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, update it!"
        }).then(async (result) => {
            if (result.isConfirmed) {
                const updatedData = {
                    hotel_name: document.getElementById("hotel_name").value,
                    hotel_address: document.getElementById("hotel_address").value,
                    hotel_pincode: document.getElementById("hotel_pincode").value,
                    hotel_bill_amount: document.getElementById("hotel_bill_amount").value,
                    hotel_published_by: document.getElementById("hotel_published_by").value,
                    hotel_phone: document.getElementById("hotel_phone").value,
                    hotel_email: document.getElementById("hotel_email").value,
                    bank_name: document.getElementById("bank_name").value,
                    ifsc_code: document.getElementById("ifsc_code").value,
                    account_no: document.getElementById("account_no").value,
                    account_type: document.getElementById("account_type").value,
                    hotel_gst: document.getElementById("hotel_gst").value,
                    hotel_bank_proof: document.getElementById("hotel_bank_proof").value,
                    date_of_publishing: document.getElementById("date_of_publishing").value,
                    hotel_status: document.getElementById("hotel_status").value === "Active",
                    hotel_alternative_phone: document.getElementById("hotel_alternative_phone").value,
                    beneficiary_name: document.getElementById("beneficiary_name").value,
                    swift_code: document.getElementById("swift_code").value,
                };

                try {
                    const updateResponse = await fetch(`http://backend.bninewdelhi.com/api/updateHotel/${hotelId}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(updatedData)
                    });

                    const result = await updateResponse.json();
                    if (result.success) {
                        Swal.fire("Updated!", "Hotel updated successfully.", "success").then(() => {
                            window.location.href = "/h/manage-hotels"; // Redirect to the list page
                        });
                    } else {
                        Swal.fire("Error!", "Failed to update hotel. " + result.message, "error");
                    }
                } catch (error) {
                    console.error("Error updating hotel:", error);
                    Swal.fire("Error!", "An error occurred while updating the hotel.", "error");
                }
            }
        });
    });
});
