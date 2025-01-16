document.getElementById("submit-accolade").addEventListener("click", async () => {
  const accoladeName = document.getElementById("accolade_name").value.trim();
  const accoladePrice = document.getElementById("accolade_price").value.trim();
  const accoladePublishedBy = document.getElementById("accolade_published").value.trim();
  const accoladePublishedDate = document.getElementById("accolade_published_date").value;
  const stockAvailable = document.getElementById("stock_available").value.trim();
  const accoladeAvailability = document.getElementById("accolade_availability").value;
  const accoladeStatus = document.getElementById("accolade_status").value;

  const itemType = document.getElementById("item_type").value; // Single selected value
  const accoladeType = document.getElementById("accolade_type").value; // Single selected value
  const termCondition = document.getElementById("ec").value || null;

  // Validate required fields
  if (!accoladeName) {
    alert("Accolade name is required!");
    return;
  }

  // Convert dropdown values into arrays or strings (if multiple selections are supported)
  const data = {
    accolade_name: accoladeName,
    accolade_published_by: accoladePublishedBy || null,
    accolade_publish_date: accoladePublishedDate || null,
    accolade_availability: accoladeAvailability || null,
    accolade_price: accoladePrice || null,
    accolade_status: accoladeStatus || null,
    stock_available: stockAvailable || null,
    item_type: [itemType], // Convert to an array for consistency
    accolade_type: [accoladeType], // Convert to an array for consistency
    eligibilty_and_condition: termCondition,
  };

  try {
    const response = await fetch("https://bni-data-backend.onrender.com/api/accolades", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok) {
      Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: result.message,
          confirmButtonText: 'OK',
      });
      // Optionally, clear the form fields
      document.getElementById("accolade_name").value = "";
      document.getElementById("accolade_price").value = "";
      document.getElementById("accolade_published").value = "";
      document.getElementById("accolade_published_date").value = "";
      document.getElementById("stock_available").value = "";
      document.getElementById("accolade_availability").value = "";
      document.getElementById("accolade_status").value = "";
      setTimeout(() => {
          window.location.href = "/acc/manage-accolades";  // Redirect to the region page
      }, 1200);
    } else {
      Swal.fire({
          icon: "error",
          title: "Error!",
          text: result.message || "Failed to add accolade. Please try again.",
          confirmButtonText: "Retry",
      });
    }
  } catch (error) {
      Swal.fire({
          icon: "error",
          title: "Error!",
          text: "An unexpected error occurred. Please try again.",
          confirmButtonText: "Retry",
      });
      console.error("Error adding accolade:", error);
  }
});
