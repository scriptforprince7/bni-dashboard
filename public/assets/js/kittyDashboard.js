document.addEventListener("DOMContentLoaded", () => {
    fetchPayments(); // Call fetchPayments when the document is fully loaded
  });

  function showLoader() {
    document.getElementById('loader').style.display = 'flex';
  }
  
  // Function to hide the loader
  function hideLoader() {
    document.getElementById('loader').style.display = 'none';
  }
  
  async function fetchPayments() {
    try {
        showLoader();
      const [transactionsRes, ordersRes] = await Promise.all([
        fetch("https://bni-data-backend.onrender.com/api/allTransactions"),
        fetch("https://bni-data-backend.onrender.com/api/allOrders"),
      ]);
  
      const transactions = await transactionsRes.json();
      const orders = await ordersRes.json();
  
      // Filter orders with universal_link_id = 4
      const meetingOrders = orders.filter(order => order.universal_link_id === 4);
  
      // Map and merge data with transactions
      const payments = meetingOrders.map(order => {
        const relatedTransaction = transactions.find(
          txn => txn.order_id === order.order_id
        );
        return { ...order, ...relatedTransaction };
      });
  
      displayPayments(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
        hideLoader();
    }
  }
  
  
  function displayPayments(payments) {
    const tableBody = document.getElementById("paymentsTableBody");
    tableBody.innerHTML = payments
      .map((payment, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${new Date(payment.date).toLocaleDateString()}</td>
          <td>${payment.member_name || "N/A"}</td>
          <td>${payment.chapter || "N/A"}</td>
          <td>${payment.order_amount || 0}</td>
          <td>${payment.payment_method || "N/A"}</td>
          <td>${payment.order_id || "N/A"}</td>
          <td>${payment.cf_payment_id}</td>
          <td>${payment.pg_status || "N/A"}</td>
          <td>${payment.gateway || "N/A"}</td>
          <td>${payment.payment_type || "N/A"}</td>
          <td>${payment.settlement_status || "N/A"}</td>
          <td>${payment.transfer_utr || "N/A"}</td>
          <td>${payment.transfer_time || "N/A"}</td>
          <td>${payment.irn || "N/A"}</td>
          <td>${payment.qr_code || "N/A"}</td>
          <td>${payment.e_invoice_status || "N/A"}</td>
        </tr>
      `)
      .join("");
  }
  