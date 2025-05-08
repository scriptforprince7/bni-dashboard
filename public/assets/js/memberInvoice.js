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
        const response = await fetch('http://backend.bninewdelhi.com/api/allOrders');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const allOrders = await response.json();
        console.log("All Orders:", allOrders);

        const order = allOrders.find(order => order.order_id === orderId);
        if (order) {
            // Fetch transactions first to get cf_payment_id
            const transactions = await fetchTransactionsForOrder(order.order_id);
            const transaction = transactions[0]; // Get the first transaction
            
            // Update displayOrderDetails to include transaction details
            displayOrderDetails(order, transaction);

            if (order.universal_link_id) {
                universalLinkName = await fetchUniversalLinkName(order.universal_link_id);
                displayTransactionDetails(order);
            }

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
        const response = await fetch('http://backend.bninewdelhi.com/api/members');
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
        const response = await fetch('http://backend.bninewdelhi.com/api/allTransactions');
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
        const response = await fetch('http://backend.bninewdelhi.com/api/universalLinks');
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

// Add new function to fetch training name
async function fetchTrainingName(trainingId) {
    try {
        const response = await fetch('http://backend.bninewdelhi.com/api/allTrainings');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const trainings = await response.json();
        const training = trainings.find(t => t.training_id === trainingId);
        return training ? training.training_name : 'Unknown Training';
    } catch (error) {
        console.error('Error fetching training name:', error);
        return 'Unknown Training';
    }
}

// Function to display transaction details in the table
async function displayTransactionDetails(order) {
    const transactions = await fetchTransactionsForOrder(orderId);
    const transactionTableBody = document.querySelector('.transaction-items tbody');
    transactionTableBody.innerHTML = '';

    if (transactions.length > 0) {
        const transaction = transactions[0];
        
        document.querySelector('.total-amount').textContent = `₹${transaction.payment_amount}`;
        document.querySelector('.payment-status').textContent = transaction.payment_status;
        document.querySelector('.payment-status').classList.add(transaction.payment_status === "SUCCESS" ? 'bg-success' : 'bg-danger');

        // Calculate base amount (order_amount - GST - One Time Registration Fee)
        const baseAmount = order.order_amount - (order.tax || 0) - (order.one_time_registration_fee || 0);

        // Get display name based on payment type
        let displayName = universalLinkName;
        if (universalLinkName === 'Training Payments' && order.training_id) {
            const trainingName = await fetchTrainingName(order.training_id);
            displayName = `${universalLinkName} - ${trainingName}`;
        } else if (universalLinkName === 'New Member Payment' && order.renewal_year) {
            displayName = `${universalLinkName} - ${order.renewal_year}`;
        } else if (universalLinkName === 'Renewal Payment' && order.renewal_year) {
            displayName = `${universalLinkName} - ${order.renewal_year}`;
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>1</td>
            <td class="payment-type"><b>${displayName}</b></td>
            <td>999511</td>
            <td>₹${baseAmount}</td>
            <td>₹${baseAmount}</td>
        `;
        transactionTableBody.appendChild(row);

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
                            <p class="mb-0 fw-medium fs-15">₹${baseAmount}</p>
                        </td>
                    </tr>
                    ${order.one_time_registration_fee && order.one_time_registration_fee !== 0 ? `
                    <tr>
                        <th scope="row">
                            <p class="mb-0">One Time Registration Fee :</p>
                        </th>
                        <td>
                            <p class="mb-0 fw-medium fs-15">₹${order.one_time_registration_fee}</p>
                        </td>
                    </tr>
                    ` : ''}
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
    `;
        transactionTableBody.appendChild(gstTaxRow);
    } else {
        console.error('No transactions found for this order');
    }
}


// Function to display order details
function displayOrderDetails(order, transaction) {
    document.querySelector('.invoice-id').textContent = order.order_id;
    document.querySelector('.date-issued').textContent = new Date(order.created_at).toLocaleString();
    
    // Set member name without GSTIN
    document.querySelector('.billing-to-name').textContent = order.member_name || "N/A";
    document.querySelector('.due-amount').textContent = `₹${order.order_amount}`;
    
    // Create billing to section with GSTIN at the end
    document.querySelector('.billing-to-email').textContent = order.customer_email || "N/A";
    document.querySelector('.billing-to-phone').textContent = order.customer_phone || "N/A";
    document.querySelector('.billing-to-gstin').textContent = `GSTIN: ${order.gstin || "N/A"}`;
    
    // Set the transaction ID (cf_payment_id) if available
    if (transaction && transaction.cf_payment_id) {
        document.querySelector('.due-date').textContent = transaction.cf_payment_id;
    } else {
        document.querySelector('.due-date').textContent = "N/A";
    }
}

// Call the function to fetch order details on page load
fetchAllOrders();

document.addEventListener('DOMContentLoaded', function() {
    const downloadBtn = document.getElementById('downloadInvoice');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            const element = document.querySelector('.card.custom-card');
            const orderId = document.querySelector('.invoice-id').textContent;
            
            const opt = {
                margin: 1,
                filename: `BNI-Invoice-${orderId}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            };

            // Generate and download PDF
            html2pdf().set(opt).from(element).save();
        });
    }
});
