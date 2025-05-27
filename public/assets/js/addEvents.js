document.getElementById("submit-event").addEventListener("click", async () => {
    const event_name = document.getElementById("event_name").value.trim();
    const billing_company = document.getElementById("billing_company").value.trim();
    const event_venue = document.getElementById("event_venue").value.trim();
    const event_ticket_price = document.getElementById("event_ticket_price").value;
    const event_date = document.getElementById("event_date").value.trim();
    const event_status = document.getElementById("event_status").value.trim();
  
    // Validate required fields
    if (!event_name) {
      alert("Event name is required!");
      return;
    }
  
    const data = {
        event_name: event_name,
        billing_company: billing_company || null,
        event_venue: event_venue || null,
        event_ticket_price: event_ticket_price || null,
        event_date: event_date || null,
        event_status: event_status || null,
    };
  
    try {
      const response = await fetch("http://localhost:5000/api/events", {
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
        document.getElementById("event_name").value = "";
        document.getElementById("billing_company").value = "";
        document.getElementById("event_venue").value = "";
        document.getElementById("event_ticket_price").value = "";
        document.getElementById("event_date").value = "";
        document.getElementById("event_status").value = "";
        setTimeout(() => {
            window.location.href = '/e/manage-events';  // Redirect to the region page
        }, 1200);
      } else {
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: result.message || 'Failed to add event. Please try again.',
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
          console.error('Error adding event:', error);
    }
  });
  