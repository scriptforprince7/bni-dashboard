document.addEventListener('DOMContentLoaded', async function () {
    try {
        // Step 1: Get logged-in chapter email from token
        const chapterEmail = getUserEmail();
        console.log('Logged-in chapter email:', chapterEmail);

        // Step 2: Fetch chapter details using chapter email
        const chapterResponse = await fetch('https://bni-data-backend.onrender.com/api/chapters');
        const chapters = await chapterResponse.json();
        const loggedInChapter = chapters.find(chapter => chapter.email_id === chapterEmail);

        if (!loggedInChapter) {
            console.error('Chapter not found for the logged-in email:', chapterEmail);
            return;
        }

        const { chapter_id } = loggedInChapter;
        console.log('Logged-in chapter ID:', chapter_id);

        // Step 3: Fetch kitty payments using chapter_id
        const kittyResponse = await fetch('https://bni-data-backend.onrender.com/api/getKittyPayments');
        const kittyPayments = await kittyResponse.json();
        const chapterKittyPayment = kittyPayments.find(payment => payment.chapter_id === chapter_id);

        if (!chapterKittyPayment) {
            console.error('Kitty payment not found for chapter ID:', chapter_id);
            document.getElementById('totalKittyAmountRaised').textContent = 'N/A';
            document.getElementById('totalKittyDetails').textContent = 'No Bill Raised for this Quarter';
            document.getElementById('totalKittyAmountReceived').textContent = 'N/A';
            document.getElementById('totalKittyExpense').textContent = 'N/A';
            const tableBody = document.getElementById('paymentsTableBody');
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="11" style="text-align: center;"><b>No Bill Raised yet.</b></td>
            `;
            tableBody.appendChild(row);
            return;
        }

        const { total_bill_amount, bill_type, description, total_weeks } = chapterKittyPayment;
        console.log('Kitty Payment Details:', { total_bill_amount, bill_type, description, total_weeks });

        // Step 4: Fetch members count using chapter_id
        const membersResponse = await fetch('https://bni-data-backend.onrender.com/api/members');
        const members = await membersResponse.json();
        const chapterMembers = members.filter(member => member.chapter_id === chapter_id);
        const memberCount = chapterMembers.length;

        console.log('Number of members:', memberCount);

        // Step 5: Calculate total amount raised
        const totalAmountRaised = parseFloat(total_bill_amount) * memberCount;

        // Step 6: Fetch all orders for the chapter
        const ordersResponse = await fetch('https://bni-data-backend.onrender.com/api/allOrders');
        const allOrders = await ordersResponse.json();

        // Filter orders for the chapter with universal_link_id === 4
        const chapterOrders = allOrders.filter(order => 
            order.chapter_id === chapter_id && 
            order.universal_link_id === 4
        );

        if (chapterOrders.length === 0) {
            console.error('No orders found for the chapter with universal_link_id 4.');
            return;
        }

        console.log('Fetched Orders:', chapterOrders);

        const transactionsResponse = await fetch('https://bni-data-backend.onrender.com/api/allTransactions');
        const allTransactions = await transactionsResponse.json();
        console.log('Fetched Transactions:', allTransactions);

        const ordersWithTransactions = chapterOrders.map(order => {
            const transaction = allTransactions.find(tran => tran.order_id === order.order_id);
            return {
                ...order,
                ...transaction // Add transaction fields to the order object
            };
        });

        console.log('Orders with Transactions:', ordersWithTransactions);

        const tableBody = document.querySelector('#paymentsTableBody');
        tableBody.innerHTML = ''; // Clear the table body

        let serialNumber = 1; // Initialize counter for displayed rows

        chapterOrders.forEach((order) => {
            // Find matching transaction
            const transaction = allTransactions.find(tran => tran.order_id === order.order_id);
            
            // Skip this order if no transaction found
            if (!transaction) {
                return; // This will skip to the next iteration
            }

            // Format date
            const orderDate = order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN') : 'N/A';
            
            // Format amount
            const formattedAmount = order.order_amount ? 
                new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 2
                }).format(order.order_amount) : 'N/A';

            // Get payment details from transaction
            const paymentMethod = transaction.payment_method?.netbanking ? 'netbanking' : 'upi';
            const transactionId = transaction.cf_payment_id;
            const pgStatus = transaction.payment_status;

            const row = `
                <tr>
                    <td>${serialNumber}</td>
                    <td>${orderDate}</td>
                    <td>${order.member_name || 'N/A'}</td>
                    <td><b>${formattedAmount}</b><br><a href="/ck/chapter-kittyInvoice?order_id=${
        transaction.order_id
      }" class="fw-medium text-success">View</a></td>
                    <td>${paymentMethod}</td>
                    <td>${order.order_id || 'N/A'}</td>
                    <td>${transactionId}</td>
                    <td>${pgStatus}</td>
                    <td>${order.payment_gateway_id || 'N/A'}</td>
                    <td>N/A</td>
                    <td>N/A</td>
                    <td>N/A</td>
                    <td>N/A</td>
                    <td>N/A</td>
                    <td>N/A</td>
                </tr>
            `;

            tableBody.insertAdjacentHTML('beforeend', row);
            serialNumber++; // Increment counter only for displayed rows
        });

        const totalKittyAmountReceived = chapterOrders.reduce((sum, order) => sum + parseFloat(order.order_amount), 0);
        console.log('Total Kitty Amount Received:', totalKittyAmountReceived);

        // Step 7: Calculate total kitty amount pending
        const totalKittyAmountPending = totalAmountRaised - totalKittyAmountReceived;
        console.log('Total Kitty Amount Pending:', totalKittyAmountPending);

        // Step 8: Format values in Indian currency format
        const indianCurrencyFormatter = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2,
        });

        const formattedBillAmount = indianCurrencyFormatter.format(total_bill_amount);
        const formattedTotalRaised = indianCurrencyFormatter.format(totalAmountRaised);
        const formattedKittyReceived = indianCurrencyFormatter.format(totalKittyAmountReceived);
        const formattedKittyPending = indianCurrencyFormatter.format(totalKittyAmountPending);

        // Step 9: Update the UI with fetched values
        document.querySelector('.total_bill_amount').textContent = formattedBillAmount;
        document.querySelector('.total_bill_amount_raised').textContent = formattedTotalRaised;
        document.querySelector('.total_kitty_amount_received').textContent = formattedKittyReceived;
        document.querySelector('.total_kitty_amount_pending').textContent = formattedKittyPending;
        document.querySelector('.bill_type').textContent = bill_type;
        document.querySelector('.description').textContent = description;
        document.querySelector('.total_weeks').textContent = total_weeks;
        document.querySelector('.member_count').textContent = memberCount;

    } catch (error) {
        console.error('Error fetching chapter kitty data:', error);
    }
});
