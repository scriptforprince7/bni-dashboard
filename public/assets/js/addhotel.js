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
                date_of_publishing: document.getElementById("date_of_publishing").value || new Date().toISOString().split("T")[0], // Default to today
            };

            console.log("📤 Sending hotel data:", formData);

            try {
                const response = await fetch("https://backend.bninewdelhi.com/api/addHotel", {
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
