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
        const response = await fetch("https://backend.bninewdelhi.com/api/getHotels");
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
        document.getElementById("date_of_publishing").value = hotel.date_of_publishing.split("T")[0]; // Format Date
        document.getElementById("hotel_status").value = hotel.is_active ? "Active" : "Inactive";

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
                    date_of_publishing: document.getElementById("date_of_publishing").value,
                    hotel_status: document.getElementById("hotel_status").value === "Active"
                };

                try {
                    const updateResponse = await fetch(`https://backend.bninewdelhi.com/api/updateHotel/${hotelId}`, {
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
