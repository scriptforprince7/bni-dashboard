document.addEventListener('click', async function(event) {
    if (event.target.closest('.generate-qr-btn')) {
      const button = event.target.closest('.generate-qr-btn');
      const training_id = urlParams.get('training_id')
      console.log("training id", training_id);
  
      // Get the closest table row to the button
      const transactionRow = button.closest('tr');
      
      // Retrieve the cf_payment_id from the corresponding table cell
      const cfPaymentIdCell = transactionRow.querySelector('.custom_id b em');
      const cfPaymentId = cfPaymentIdCell ? cfPaymentIdCell.textContent : null; // Get the cf_payment_id
      console.log('CF Payment ID:', cfPaymentId); // Debug log
  
      if (cfPaymentId) {
        // Create and show a loader next to the button
        const loaderDiv = document.createElement('div');
        loaderDiv.className = 'loader'; // Add a class for styling the loader
        button.parentNode.insertBefore(loaderDiv, button.nextSibling); // Insert loader after the button
        
        // Hide the "Generate QR" button
        button.style.display = 'none';
  
        // Wait for 3 seconds (simulate loading)
        setTimeout(() => {
          // Generate QR Code as a data URL using cf_payment_id
          const qrCodeImage = https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(cfPaymentId)}&size=100x100;
          
          console.log("QR Code Image:", qrCodeImage);
  
          // Create an image element for the QR code
          const qrcodeDiv = document.createElement('div');
          qrcodeDiv.className = 'qrcode'; // Add a class for styling
          qrcodeDiv.innerHTML = <img src="${qrCodeImage}" alt="QR Code" width="100" height="100">;
          
          // Insert QR code after the button
          button.parentNode.insertBefore(qrcodeDiv, loaderDiv.nextSibling); 
  
          // Remove the loader
          loaderDiv.remove();
  
          // Fetch the transaction data to get the orderId
          fetch('https://bni-data-backend.onrender.com/api/allTransactions')
              .then(response => response.json())
              .then(transactions => {
                  // Find the transaction with the matching cf_payment_id
                  const transaction = transactions.find(tx => tx.cf_payment_id === cfPaymentId);
                  if (transaction) {
                      const orderId = transaction.order_id; // Get the order_id
  
                      // Send both orderId and cf_payment_id to the backend
                      fetch('http://localhost:5000/api/send-qr-code', {
                          method: 'POST',
                          headers: {
                              'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({ orderId, cfPaymentId }), // Send both values
                      })
                      .then(response => response.json())
                      .then(data => {
                          console.log(data.message); // Handle success message
                      })
                      .catch(error => {
                          console.error("Error sending data to backend:", error); // Handle error
                      });
                  } else {
                      console.error("Transaction not found for cf_payment_id:", cfPaymentId);
                  }
              })
              .catch(error => {
                  console.error("Error fetching transactions:", error); // Handle error
              });
  
        }, 3000); // 3 seconds delay
      } else {
        console.error('CF Payment ID not found');
        toastr.error('CF Payment ID not found');
      }
    }
  });