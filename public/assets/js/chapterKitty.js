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

        // Step 6: Fetch all orders for the chapter where universal_link_id = 4
        const ordersResponse = await fetch('https://bni-data-backend.onrender.com/api/allOrders');
        const allOrders = await ordersResponse.json();
        const chapterOrders = allOrders.filter(order => order.chapter_id === chapter_id && order.universal_link_id === 4);

        if (chapterOrders.length === 0) {
            console.error('No orders found for the chapter.');
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

        ordersWithTransactions.forEach((data, index) => {
            const {
                order_date,
                member_name,
                order_amount,
                payment_method,
                order_id,
                transaction_id,
                pg_status,
                gateway,
                payment_type,
                settlement_status,
                transfer_utr,
                transfer_time,
                irn,
                qr_code,
                einvoice_status
            } = data;

            const formattedDate = new Date(order_date).toLocaleDateString('en-IN');
            const formattedAmount = new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 2
            }).format(order_amount);

            const row = `
                <tr>
                    <td>${index + 1}</td>
                    <td>${formattedDate}</td>
                    <td>${member_name || 'N/A'}</td>
                    <td>${formattedAmount}</td>
                    <td>${payment_method || 'N/A'}</td>
                    <td>${order_id || 'N/A'}</td>
                    <td>${transaction_id || 'N/A'}</td>
                    <td>${pg_status || 'N/A'}</td>
                    <td>${gateway || 'N/A'}</td>
                    <td>${payment_type || 'N/A'}</td>
                    <td>${settlement_status || 'N/A'}</td>
                    <td>${transfer_utr || 'N/A'}</td>
                    <td>${transfer_time || 'N/A'}</td>
                    <td>${irn || 'N/A'}</td>
                    <td>${qr_code || 'N/A'}</td>
                    <td>${einvoice_status || 'N/A'}</td>
                </tr>
            `;

            tableBody.insertAdjacentHTML('beforeend', row);
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
