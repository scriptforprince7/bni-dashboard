document.addEventListener("DOMContentLoaded", function () {
    const addHotelForm = document.getElementById("addHotelForm");

    if (addHotelForm) {
        addHotelForm.addEventListener("submit", async function (event) {
            event.preventDefault(); // Prevent page reload

            // Collect form data
            const formData = {
                hotel_name: document.getElementById("hotel_name").value.trim(),
                hotel_address: document.getElementById("hotel_address").value.trim(),
                hotel_bill_amount: document.getElementById("hotel_bill_amount").value.trim(),
                hotel_pincode: document.getElementById("hotel_pincode").value.trim(),
                hotel_status: document.getElementById("hotel_status").value === "Active" ? true : false, // Convert to boolean
                hotel_published_by: document.getElementById("hotel_published_by").value.trim(),
                hotel_email: document.getElementById("hotel_email").value.trim(),
                hotel_phone: document.getElementById("hotel_phone").value.trim(),
                // hotel_gst_cert: document.getElementById("hotel_gst_cert").value.trim(),
                hotel_bank_name: document.getElementById("hotel_bank_name").value.trim(),
                hotel_account_number: document.getElementById("hotel_account_number").value.trim(),
                hotel_ifsc_code: document.getElementById("hotel_ifsc_code").value.trim(),
                hotel_account_type: document.getElementById("hotel_account_type").value.trim(),
                hotel_gst: document.getElementById("hotel_gst").value.trim(),

                hotel_alternative_phone: document.getElementById("hotel_alternative_phone").value.trim(),
                beneficiary_name: document.getElementById("beneficiary_name").value.trim(),
                swift_code: document.getElementById("swift_code").value.trim(),
                date_of_publishing: document.getElementById("date_of_publishing").value || new Date().toISOString().split("T")[0], // Default to today
            };

            console.log("📤 Sending hotel data:", formData);

            try {
                const response = await fetch("http://backend.bninewdelhi.com/api/addHotel", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(formData),
                });

                const result = await response.json();
                console.log("✅ Response:", result);

                if (result.success) {
                    // Show SweetAlert
                    Swal.fire({
                        title: "Success!",
                        text: "Hotel added successfully!",
                        icon: "success",
                        confirmButtonText: "OK"
                    }).then(() => {
                        window.location.href = "/h/manage-hotels"; // Redirect after confirmation
                    });

                    addHotelForm.reset(); // Clear the form
                } else {
                    Swal.fire({
                        title: "Error!",
                        text: result.message,
                        icon: "error",
                        confirmButtonText: "OK"
                    });
                }
            } catch (error) {
                console.error("❌ Error adding hotel:", error);
                Swal.fire({
                    title: "Error!",
                    text: "An error occurred while adding the hotel. Please try again.",
                    icon: "error",
                    confirmButtonText: "OK"
                });
            }
        });
    }
});
