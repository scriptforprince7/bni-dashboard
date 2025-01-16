document.getElementById("submit-event").addEventListener("click", async () => {
    const training_name = document.getElementById("training_name").value.trim();
    const billing_company = document.getElementById("billing_company").value.trim();
    const training_venue = document.getElementById("training_venue").value.trim();
    const training_ticket_price = document.getElementById("training_ticket_price").value;
    const training_date = document.getElementById("training_date").value.trim();
    const training_note = document.getElementById("training_note").value.trim();
    const training_published_by = document.getElementById("training_published_by").value.trim();
    const training_status = document.getElementById("training_status").value.trim();
  
    // Validate required fields
    if (!training_name) {
      alert("Training name is required!");
      return;
    }
  
    const data = {
        training_name: training_name,
        billing_company: billing_company || null,
        training_venue: training_venue || null,
        training_ticket_price: training_ticket_price || null,
        training_date: training_date || null,
        training_note: training_note || null,
        training_published_by: training_published_by || null,
        training_status: training_status || null,
    };
  
    try {
      const response = await fetch("https://bni-data-backend.onrender.com/api/training", {
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
        document.getElementById("training_name").value = "";
        document.getElementById("billing_company").value = "";
        document.getElementById("training_venue").value = "";
        document.getElementById("training_ticket_price").value = "";
        document.getElementById("training_date").value = "";
        document.getElementById("training_note").value = "";
        document.getElementById("training_published_by").value = "";
        document.getElementById("training_status").value = "";
        setTimeout(() => {
            window.location.href = '/tr/manage-trainings';  // Redirect to the region page
        }, 1200);
      } else {
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: result.message || 'Failed to add training. Please try again.',
            confirmButtonText: 'Retry',
          });
      }
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'An unexpected error occurred. Please try again.',
            confirmButtonText: 'Retry',
          });
          console.error('Error adding training:', error);
    }
  });
  