const orderId = new URLSearchParams(window.location.search).get('order_id'); // Get order_id from query params
let universalLinkName = 'Unknown'; // Default value for universal link name
// Function to show the loader
function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

// Function to hide the loader
function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

// Fetch all orders and display details
async function fetchAllOrders() {
    showLoader();
    try {
        const response = await fetch('https://bni-data-backend.onrender.com/api/allOrders');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const allOrders = await response.json();
        console.log("All Orders:", allOrders); // Log all orders

        const order = allOrders.find(order => order.order_id === orderId); // Find the specific order
        if (order) {
            displayOrderDetails(order);
            await fetchTransactionsForOrder(order.order_id); // Fetch transactions for this order

            if (order.universal_link_id) {
                universalLinkName = await fetchUniversalLinkName(order.universal_link_id); // Fetch and store the name
                displayTransactionDetails(order); // Pass the order object to displayTransactionDetails
            }

            // Fetch member address based on customer_id
            if (order.customer_id) {
                await fetchMemberAddress(order.customer_id);
            }
        } else {
            console.error('Order not found');
        }
    } catch (error) {
        console.error('Error fetching order details:', error);
    }
}

// Function to fetch and display member address
async function fetchMemberAddress(customerId) {
    showLoader();
    try {
        const response = await fetch('https://bni-data-backend.onrender.com/api/members');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const members = await response.json();
        const member = members.find(member => member.member_id === customerId);

        if (member) {
            document.querySelector('.billing-to-address').textContent = member.street_address_line_1 || "N/A"; // Display address
        } else {
            console.error('Member not found');
        }
    } catch (error) {
        console.error('Error fetching member address:', error);
    }
}

// Function to fetch transactions for a specific order
async function fetchTransactionsForOrder(orderId) {
    showLoader();
    try {
        const response = await fetch('https://bni-data-backend.onrender.com/api/allTransactions');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const allTransactions = await response.json();
        console.log("All Transactions:", allTransactions); // Log all transactions
        return allTransactions.filter(transaction => transaction.order_id === orderId); // Return filtered transactions
    } catch (error) {
        console.error('Error fetching transaction details:', error);
        return [];
    } finally {
        hideLoader();
    }
}

// Function to fetch the universal link name
async function fetchUniversalLinkName(universalLinkId) {
    showLoader();
    try {
        const response = await fetch('https://bni-data-backend.onrender.com/api/universalLinks');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const universalLinks = await response.json();
        const link = universalLinks.find(link => link.id === universalLinkId);

        if (link) {
            return link.universal_link_name;
        } else {
            console.error('Universal link not found');
            return 'Unknown';
        }
    } catch (error) {
        console.error('Error fetching universal link name:', error);
        return 'Unknown';
    } finally {
        hideLoader();
    }
}

// Function to display transaction details in the table
async function displayTransactionDetails(order) {
    const transactions = await fetchTransactionsForOrder(orderId); // Fetch relevant transactions
    const transactionTableBody = document.querySelector('.transaction-items tbody');
    transactionTableBody.innerHTML = ''; // Clear existing rows

    // Assuming that you want to display only the first transaction (you may adjust as needed)
    if (transactions.length > 0) {
        const transaction = transactions[0]; // Get the first transaction
        
        // Display payment mode, total amount, and status
        // document.querySelector('.payment-mode').textContent = transaction.payment_method[transaction.payment_group].channel; // Display payment method
        document.querySelector('.total-amount').textContent = `₹${transaction.payment_amount}`; // Display payment amount
        document.querySelector('.payment-status').textContent = transaction.payment_status; // Display payment status
        document.querySelector('.payment-status').classList.add(transaction.payment_status === "SUCCESS" ? 'bg-success' : 'bg-danger'); // Conditional styling for status

        // Create a new row for transaction details in the table
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>1</td> <!-- Serial number -->
            <td class="payment-type"><b>${universalLinkName}</b></td> <!-- Display fetched universal link name -->
            <td>${transaction.cf_payment_id}</td> <!-- Display cf_payment_id as Transaction ID -->
            <td>1</td> <!-- Quantity -->
            <td>₹${order.membership_fee}</td> <!-- Price per unit -->
            <td>₹${order.membership_fee}</td> <!-- Total -->
        `;
        transactionTableBody.appendChild(row);

        // Create a new row for GST and tax calculations (as before)
        const gstTaxRow = document.createElement('tr');
        gstTaxRow.innerHTML = `
        <td colspan="3"></td>
        <td colspan="2">
            <table class="table table-sm text-nowrap mb-0 table-borderless">
                <tbody>
                    <tr>
                        <th scope="row">
                            <p class="mb-0">Sub Total :</p>
                        </th>
                        <td>
                            <p class="mb-0 fw-medium fs-15">₹${order.membership_fee}</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <p class="mb-0">One Time Registration Fee :</p>
                        </th>
                        <td>
                            <p class="mb-0 fw-medium fs-15">₹${order.one_time_registration_fee || 0}</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <p class="mb-0">GST <span class="text-success">(18%)</span> :</p>
                        </th>
                        <td>
                            <p class="mb-0 fw-medium fs-15">₹${order.tax || 0}</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">
                            <p class="mb-0 fs-14">Total :</p>
                        </th>
                        <td>
                            <p class="mb-0 fw-medium fs-16 text-success">₹${order.order_amount}</p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </td>
    `; // Your existing GST and tax calculations
        transactionTableBody.appendChild(gstTaxRow); // Append the GST and tax row to the transaction table
    } else {
        console.error('No transactions found for this order');
    }
}


// Function to display order details
function displayOrderDetails(order) {
    // Update HTML elements with order details
    document.querySelector('.invoice-id').textContent = order.order_id; // Update invoice ID
    document.querySelector('.date-issued').textContent = new Date(order.created_at).toLocaleString(); // Date Issued
    document.querySelector('.billing-to-name').textContent = order.member_name || "N/A"; // Billing Name
    document.querySelector('.due-amount').textContent = `₹${order.order_amount}`; // Due Amount
    document.querySelector('.billing-to-email').textContent = order.customer_email || "N/A"; // Billing Email
    document.querySelector('.billing-to-phone').textContent = order.customer_phone || "N/A"; // Billing Phone
}

// Call the function to fetch order details on page load
fetchAllOrders();
