// Add these variables at the top of your code to store filter selections
let selectedGateway = null;
let selectedMonth = null;
let selectedPgStatus = null;
let selectedMethod = null;
let total_pending_expense = 0;
let total_paid_expense = 0;
let pendingAmount = 0;

// Function to populate Gateway filter dropdown
async function populateGatewayFilter() {
    try {
        const response = await fetch('https://bni-data-backend.onrender.com/api/paymentGateway');
        const gateways = await response.json();
        
        const gatewayFilter = document.getElementById('payment-gateway-filter');
        gatewayFilter.innerHTML = ''; // Clear existing options
        
        gateways.forEach(gateway => {
            const li = document.createElement('li');
            const gatewayName = getGatewayName(gateway.gateway_id);
            li.innerHTML = `
                <a class="dropdown-item" href="javascript:void(0);" data-gateway-name="${gatewayName}">
                    ${gatewayName}
                </a>
            `;
            gatewayFilter.appendChild(li);
        });
    } catch (error) {
        console.error('Error fetching payment gateways:', error);
    }
}

// Function to populate Month filter dropdown
function populateMonthFilter() {
    const months = [
            { number: '01', name: 'January' },
            { number: '02', name: 'February' },
        { number: '03', name: 'March' },
        { number: '04', name: 'April' },
        { number: '05', name: 'May' },
        { number: '06', name: 'June' },
        { number: '07', name: 'July' },
        { number: '08', name: 'August' },
        { number: '09', name: 'September' },
        { number: '10', name: 'October' },
        { number: '11', name: 'November' },
        { number: '12', name: 'December' }
    ];

    const monthFilter = document.getElementById('month-filter');
    monthFilter.innerHTML = ''; // Clear existing options

    months.forEach(month => {
        const li = document.createElement('li');
        li.innerHTML = `
            <a class="dropdown-item" href="javascript:void(0);" data-month-number="${month.number}">
                ${month.name}
            </a>
        `;
        monthFilter.appendChild(li);
    });

    // Add click event listener for month filter items
    monthFilter.addEventListener('click', function(e) {
        if (e.target.classList.contains('dropdown-item')) {
            selectedMonth = e.target.dataset.monthNumber;
            console.log('Selected Month:', selectedMonth); // Debug log
            
            // Update dropdown button text
            const dropdownButton = e.target.closest('.dropdown').querySelector('.dropdown-toggle');
            dropdownButton.textContent = e.target.textContent;
        }
    });
}

// Function to populate PG Status filter dropdown
function populatePgStatusFilter() {
    const statuses = ['SUCCESS', 'PENDING', 'NOT_ATTEMPTED'];
    const statusFilter = document.getElementById('payment-status-filter');
    statusFilter.innerHTML = ''; // Clear existing options

    statuses.forEach(status => {
        const li = document.createElement('li');
        li.innerHTML = `
            <a class="dropdown-item" href="javascript:void(0);" data-status="${status}">
                ${status}
            </a>
        `;
        statusFilter.appendChild(li);
    });
}

// Function to populate Payment Method filter dropdown
function populateMethodFilter() {
    const methods = ['upi', 'netbanking'];
    const methodFilter = document.getElementById('payment-method-filter');
    methodFilter.innerHTML = ''; // Clear existing options

    methods.forEach(method => {
        const li = document.createElement('li');
        li.innerHTML = `
            <a class="dropdown-item" href="javascript:void(0);" data-method="${method}">
                ${method.toUpperCase()}
            </a>
        `;
        methodFilter.appendChild(li);
    });
}

// Function to get gateway name from ID
function getGatewayName(gatewayId) {
    const gatewayMap = {
        '1': 'Cashfree',
        '2': 'Razorpay',
        '3': 'CCAvenue'
    };
    return gatewayMap[gatewayId] || 'N/A';
}

// Function to get PG Status badge class
function getPgStatusBadge(status) {
    switch(status) {
        case 'SUCCESS':
            return 'badge bg-success';
        case 'PENDING':
            return 'badge bg-warning';
        case 'NOT_ATTEMPTED':
            return 'badge bg-danger';
        default:
            return 'badge bg-danger';
    }
}

// Update the filter function to correctly handle gateway filtering
function filterTable() {
    console.log('Selected Gateway:', selectedGateway); // Debug log
    console.log('Selected Month:', selectedMonth); // Debug log for month
    
    const tableBody = document.getElementById('paymentsTableBody');
    const rows = tableBody.getElementsByTagName('tr');
    let hasVisibleRows = false;

    for (let row of rows) {
        const gatewayCell = row.cells[8];
        const dateCell = row.cells[1];
        const pgStatusCell = row.cells[7];
        const methodCell = row.cells[4];
        
        const gatewayText = gatewayCell.textContent.trim();
        
        // Extract and pad the month with leading zero if needed
        const dateParts = dateCell.textContent.trim().split('/');
        const monthFromDate = dateParts[1].padStart(2, '0');
        console.log('Table Month:', monthFromDate); // Debug log
        
        const pgStatus = pgStatusCell.textContent.trim();
        const method = methodCell.textContent.trim().toLowerCase();

        // Check all filters
        const matchesGateway = !selectedGateway || gatewayText === selectedGateway;
        const matchesMonth = !selectedMonth || monthFromDate === selectedMonth;
        const matchesPgStatus = !selectedPgStatus || pgStatus === selectedPgStatus;
        const matchesMethod = !selectedMethod || method === selectedMethod;

        if (matchesGateway && matchesMonth && matchesPgStatus && matchesMethod) {
            row.style.display = '';
            hasVisibleRows = true;
        } else {
            row.style.display = 'none';
        }
    }

    // Show/hide no results message
    const noResultsMsg = document.getElementById('no-results-message');
    if (!hasVisibleRows) {
        if (!noResultsMsg) {
            const msg = document.createElement('div');
            msg.id = 'no-results-message';
            msg.className = 'alert alert-info m-3';
            msg.textContent = 'No results found for applied filters';
            tableBody.parentElement.appendChild(msg);
        }
    } else if (noResultsMsg) {
        noResultsMsg.remove();
    }
}

// Update the gateway filter dropdown event listener
document.getElementById('payment-gateway-filter').addEventListener('click', function(e) {
    if (e.target.classList.contains('dropdown-item')) {
        selectedGateway = e.target.dataset.gatewayName;
        console.log('Selected Gateway Name:', selectedGateway); // Debug log
        
        // Update dropdown button text
        const dropdownButton = e.target.closest('.dropdown').querySelector('.dropdown-toggle');
        dropdownButton.textContent = selectedGateway;
    }
});

document.addEventListener('DOMContentLoaded', async function () {
    console.log('=== Chapter Kitty Loading Process Started ===');
    
    // Function to show the loader
    function showLoader() {
        console.log('Showing loader...');
        document.getElementById('loader').style.display = 'flex';
    }

    // Function to hide the loader
    function hideLoader() {
        console.log('Hiding loader...');
        document.getElementById('loader').style.display = 'none';
    }

    try {
        showLoader();
        console.log('Initializing currency formatter...');
        const indianCurrencyFormatter = new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 2,
        });

        // Step 1: Get logged-in chapter email and type
        console.log('Step 1: Getting user login type...');
        const loginType = getUserLoginType();
        console.log('Detected login type:', loginType);
        
        let chapterEmail;
        let chapter_id;

        if (loginType === 'ro_admin') {
            console.log('RO Admin detected, fetching from localStorage...');
            chapterEmail = localStorage.getItem('current_chapter_email');
            chapter_id = localStorage.getItem('current_chapter_id');
            
            console.log('localStorage data found:', {
                email: chapterEmail,
                id: chapter_id
            });
            
            if (!chapterEmail || !chapter_id) {
                console.error('CRITICAL: Missing localStorage data for RO Admin');
                hideLoader();
                return;
            }
        } else {
            console.log('Regular chapter login detected, getting email from token...');
            chapterEmail = getUserEmail();
            
            // Get chapter_id from chapters API
            const chaptersResponse = await fetch('https://bni-data-backend.onrender.com/api/chapters');
            const chapters = await chaptersResponse.json();
            const chapter = chapters.find(ch => ch.email_id === chapterEmail);
            if (chapter) {
                chapter_id = chapter.chapter_id;
            }
        }

        // Fetch write-off data and calculate total
        console.log('Fetching write-off data for chapter:', chapter_id);
        const writeoffResponse = await fetch('https://bni-data-backend.onrender.com/api/getAllMemberWriteOff');
        const writeoffData = await writeoffResponse.json();
        
        // Calculate total write-off amount for this chapter
        let totalWriteoffAmount = 0;
        writeoffData.forEach(writeoff => {
            if (parseInt(writeoff.chapter_id) === parseInt(chapter_id)) {
                totalWriteoffAmount += parseFloat(writeoff.total_pending_amount);
            }
        });
        
        console.log('Total write-off amount calculated:', totalWriteoffAmount);
        
        // Update the write-off amount display
        document.querySelector('#total_expse_amount').textContent = 
            indianCurrencyFormatter.format(totalWriteoffAmount);

        // Step 2: Fetch chapter details
        console.log('Step 2: Fetching chapter details...');
        const chapterResponse = await fetch('https://bni-data-backend.onrender.com/api/chapters');
        const chaptersData = await chapterResponse.json();
        console.log('Chapters data received:', chaptersData.length, 'chapters');

        const loggedInChapter = chaptersData.find(chapter => chapter.email_id === chapterEmail);
        console.log('Found chapter:', loggedInChapter);

        if (!loggedInChapter) {
            console.error('ERROR: No chapter found for email:', chapterEmail);
            hideLoader();
            return;
        }

        const { chapter_id: chapterId, available_fund } = loggedInChapter;
        console.log('Chapter details extracted:', { chapter_id: chapterId, available_fund });
        console.log('Logged-in chapter ID:', chapterId);

        // Add calculation here
        console.log('📊 Starting member opening balance calculation');
        const membersResponse = await fetch('https://bni-data-backend.onrender.com/api/members');
        const allMembers = await membersResponse.json();
        const chapterMembersWithBalance = allMembers.filter(member => member.chapter_id === chapterId);
        // console.log('👥 Found members for chapter:', chapterMembersWithBalance.length);

        // chapterMembersWithBalance.forEach(member => {
        //     const balance = parseFloat(member.meeting_opening_balance) || 0;
        //     console.log(`💰 Member ${member.member_first_name}: Balance = ${balance}`);
        //     // pendingAmount += balance;
        // });
        const bankOrderResponse = await fetch('https://bni-data-backend.onrender.com/api/getbankOrder');
        const bankOrders = await bankOrderResponse.json();
        console.log('Bank Orders Data:', bankOrders);
        const filteredBankOrders = bankOrders.filter(order => order.chapter_id === chapterId);
        console.log('Filtered Bank Orders for Chapter ID:', chapterId, filteredBankOrders);
        let totalLatePayment = 0;
        filteredBankOrders.forEach(order => {
            totalLatePayment += parseFloat(order.no_of_late_payment);
            if(order.amount_to_pay >= 0){
            pendingAmount += parseFloat(order.amount_to_pay);
            }
            else{
            pendingAmount += 0;

            }
        });
        console.log('Total Late Payment:', totalLatePayment);
        console.log("--------------------------------",pendingAmount);
        document.getElementById('totalKittypendingamount').textContent = pendingAmount;

        // Process each entry in the filtered bank orders
        filteredBankOrders.forEach(order => {
            // Example processing: log each order's details
            console.log(`Order ID: ${order.order_id}, Amount: ${order.amount}, Status: ${order.status}`);
            // You can add more processing logic here as needed
        });
        

        // console.log('💎 Total Pending Amount:', pendingAmount);
        // document.querySelector('#totalKittyExpense').textContent = indianCurrencyFormatter.format(pendingAmount);

        // Continue with existing code
        const expenseResponse = await fetch('https://bni-data-backend.onrender.com/api/allExpenses');
        const expenses = await expenseResponse.json();
        console.log("expense", expenses);

        expenses.forEach(expense => {
            if (expense.chapter_id === chapterId) {
            if (expense.payment_status === 'pending') {
                total_pending_expense += parseFloat(expense.amount);
            } else if (expense.payment_status === 'paid') {
                total_paid_expense += parseFloat(expense.amount);
            }
            console.log();
            }
        });

        console.log("Total Pending Expense:", total_pending_expense);
        console.log("Total Paid Expense:", total_paid_expense);

        const creditResponse = await fetch('https://bni-data-backend.onrender.com/api/getAllMemberCredit');
        const memberCredits = await creditResponse.json();
        console.log('Member Credits Data:', memberCredits);
        const filteredMemberCredits = memberCredits.filter(credit => credit.chapter_id === chapterId);
        console.log('Filtered Member Credits for Chapter ID:', chapterId, filteredMemberCredits);
        let totalCreditAmount = 0;
        filteredMemberCredits.forEach(credit => {
            totalCreditAmount += parseFloat(credit.credit_amount);
        });
        console.log('Total Credit Amount:', totalCreditAmount);

        // const bankOrderResponse = await fetch('https://bni-data-backend.onrender.com/api/getbankOrder');
        // const bankOrders = await bankOrderResponse.json();
        // console.log('Bank Orders Data:', bankOrders);
        // const filteredBankOrders = bankOrders.filter(order => order.chapter_id === chapterId);
        // console.log('Filtered Bank Orders for Chapter ID:', chapterId, filteredBankOrders);
        // let totalLatePayment = 0;
        // filteredBankOrders.forEach(order => {
        //     totalLatePayment += parseFloat(order.no_of_late_payment);
        // });
        // console.log('Total Late Payment:', totalLatePayment);


        // Step 3: Fetch kitty payments using chapter_id
        const kittyResponse = await fetch('https://bni-data-backend.onrender.com/api/getKittyPayments');
        const kittyPayments = await kittyResponse.json();
        const chapterKittyPayment = kittyPayments.find(payment => payment.chapter_id === chapterId);

        // document.getElementById('totalKittyExpense').textContent = indianCurrencyFormatter.format(pendingAmount);
        if (!chapterKittyPayment) {
            console.error('Kitty payment not found for chapter ID:', chapterId);
            document.getElementById('totalKittyDetails').textContent = 'No Bill Raised for this Quarter';
            document.getElementById('totalKittyAmountReceived').textContent = 'N/A';
            
            document.querySelector('#total_available_amount').textContent = indianCurrencyFormatter.format(parseFloat(available_fund)- parseFloat(total_paid_expense));

            // document.getElementById('totalKittyExpense').textContent = 'N/A';
            document.querySelector('#total_expense_amount').textContent = indianCurrencyFormatter.format(total_paid_expense);
            document.querySelector('#total_pexpense_amount').textContent = indianCurrencyFormatter.format(total_pending_expense);
            console.log(indianCurrencyFormatter.format(total_paid_expense),indianCurrencyFormatter.format(available_fund));

            document.querySelector('#total_credit_amount').textContent = indianCurrencyFormatter.format(totalCreditAmount);
            document.querySelector('#no_of_late_payment').textContent = totalLatePayment;


            const tableBody = document.getElementById('paymentsTableBody');
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="11" style="text-align: center;"><b>No Bill Raised yet.</b></td>
            `;
            tableBody.appendChild(row);
            return;
        }

        const { total_bill_amount, bill_type, description, total_weeks, kitty_bill_id} = chapterKittyPayment;
        console.log('Kitty Payment Details:', { total_bill_amount, bill_type, description, total_weeks, kitty_bill_id });

        // Step 4: Fetch members count using chapter_id
        const memberCount = chapterMembersWithBalance.length;
        // console.log("chapter member",chapterMembersWithBalance);
        // add 18% gst on total_bill_amount
        const gst = total_bill_amount * 0.18;
        console.log('GST:', gst);
        let amountWithGst = parseFloat(total_bill_amount);
        console.log("========================================================",total_bill_amount);

        console.log('Number of members:', memberCount);
        if (memberCount===0) {
            console.error('Kitty payment not found for chapter ID:', chapterId);
            document.getElementById('totalKittyDetails').textContent = indianCurrencyFormatter.format(amountWithGst);
            document.getElementById('totalKittyAmountReceived').textContent = 'N/A';
            // document.getElementById('totalKittyExpense').textContent = 'N/A';
            document.querySelector('.member_count').textContent= memberCount;
            document.querySelector('.description').textContent= description;
            document.querySelector('.bill_type').textContent = bill_type;
            document.querySelector('.total_weeks').textContent= `${total_weeks}`;
            document.querySelector('#total_available_amount').textContent = indianCurrencyFormatter.format(parseFloat(available_fund)- parseFloat(total_paid_expense));
// expense

            document.querySelector('#total_expense_amount').textContent = indianCurrencyFormatter.format(total_paid_expense);
            document.querySelector('#total_pexpense_amount').textContent = indianCurrencyFormatter.format(total_pending_expense);
            document.querySelector('#total_credit_amount').textContent = indianCurrencyFormatter.format(totalCreditAmount);
            document.querySelector('#no_of_late_payment').textContent = totalLatePayment;



            const tableBody = document.getElementById('paymentsTableBody');
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="11" style="text-align: center;"><b>No Bill Transaction Found.</b></td>
            `;
            tableBody.appendChild(row);
            return;
        }
        


        // Step 5: Calculate total amount raised
        const totalAmountRaised = (parseFloat(amountWithGst) * memberCount);

        // Step 6: Fetch all orders for the chapter
        const ordersResponse = await fetch('https://bni-data-backend.onrender.com/api/allOrders');
        const allOrders = await ordersResponse.json();

        // Filter orders for the chapter with universal_link_id === 4
        const chapterOrders = allOrders.filter(order => 
            order.chapter_id === chapterId && 
            order.universal_link_id === 4 &&
            (order.kitty_bill_id === kitty_bill_id || order.kitty_bill_id === null) &&
            (order.payment_note === "meeting-payments" || order.payment_note === "meeting-payments-opening-only")
        );

        if (chapterOrders.length === 0) {
            console.error('No orders found for the chapter with universal_link_id 4.');
            console.error('Kitty payment not found for chapter ID:', chapterId);
            document.getElementById('totalKittyDetails').textContent = indianCurrencyFormatter.format(amountWithGst);
            document.getElementById('totalKittyAmountReceived').textContent = 'N/A';
            
            document.querySelector('.member_count').textContent= memberCount;
            document.querySelector('.description').textContent= description;
            document.querySelector('.bill_type').textContent = bill_type;
            document.querySelector('.total_weeks').textContent= `${total_weeks}`;
            document.querySelector('#total_available_amount').textContent = indianCurrencyFormatter.format(parseFloat(available_fund)- parseFloat(total_paid_expense));
            
            document.querySelector('#total_expense_amount').textContent = indianCurrencyFormatter.format(total_paid_expense);
            document.querySelector('#total_pexpense_amount').textContent = indianCurrencyFormatter.format(total_pending_expense);
            document.querySelector('#total_credit_amount').textContent = indianCurrencyFormatter.format(totalCreditAmount);
            document.querySelector('#no_of_late_payment').textContent = totalLatePayment;


            const tableBody = document.getElementById('paymentsTableBody');
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="11" style="text-align: center;"><b>No Bill Transaction Found.</b></td>
            `;
            tableBody.appendChild(row);
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

        // Update table with order data
        const tableBody = document.querySelector('#paymentsTableBody');
        tableBody.innerHTML = ''; // Clear the table body

        let serialNumber = 1; // Initialize counter for displayed rows
        let currentChapterMember;
        let ReceivedAmount = 0;
        let MiscellaneousAmount = 0;

        // const pendingBalanceResponse = await fetch('https://bni-data-backend.onrender.com/api/memberPendingKittyOpeningBalance');
        // const pendingBalances = await pendingBalanceResponse.json();


        chapterOrders.forEach(async (order) => {
            // Find matching transaction
            const transaction = allTransactions.find(tran => tran.order_id === order.order_id);
            
            // Skip this order if no transaction found
            if (!transaction) {
                return; // This will skip to the next iteration
            }

            // Format date
            const orderDate = order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN') : 'N/A';
            const transactionDate = new Date(transaction.payment_time).toLocaleDateString('en-IN', { timeZone: 'UTC' });
            console.log("=====================================r===", transactionDate);
            // find current member
            currentChapterMember = chapterMembersWithBalance.find(member => member.member_email_address === order.customer_email);
            console.log('Current Member:', currentChapterMember);
            console.log("current member id:",currentChapterMember.member_id);
            console.log("current chapter id:",currentChapterMember.chapter_id);

            // Filter and sort pending balances
            // const filteredPendingBalances = pendingBalances
            //   .filter(balance => balance.member_id === currentChapterMember.member_id && balance.chapter_id === currentChapterMember.chapter_id)
            //   .sort((a, b) => new Date(b.date_of_update) - new Date(a.date_of_update));
            
            //   console.log("filtererdPending data:",filteredPendingBalances);

            // Use the latest pending balance
            let payamount;
            if (transaction.length > 0) {
            //   const latestPendingBalance = filteredPendingBalances[0];
              payamount = Math.ceil(parseFloat(transaction.payment_amount) - (parseFloat(transaction.payment_amount) * 18) / 118); // Remove 18% GST and round up
              console.log("new data");
            } else{
                payamount =  Math.ceil(parseFloat(transaction.payment_amount) -  (parseFloat(transaction.payment_amount)*18)/118);
                console.log("old data");
            }
            
            console.log('payamount:', payamount);
            console.log('order.order_amount:', order.order_amount);
            console.log('chapterMembers.meeting_opening_balance:', currentChapterMember.meeting_opening_balance);
            const pgStatus = transaction.payment_status;
            if (pgStatus === 'SUCCESS') {
            ReceivedAmount += parseFloat(payamount);
            }
            else{
                MiscellaneousAmount += parseFloat(payamount);
            }
            
            
            // Format amount
            let formattedAmount = transaction.payment_amount ? 
                new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    maximumFractionDigits: 2
                }).format(payamount) : 'N/A';
            
            // Get payment details from transaction
            const paymentMethod = transaction.payment_method?.netbanking ? 'netbanking' : 'upi';
            const transactionId = transaction.cf_payment_id;
            

            const row = `
                <tr>
                    <td>${serialNumber}</td>
                    <td style="font-weight: 600">${transactionDate}</td>
                    <td style="font-weight: 600">${order.member_name || 'N/A'}</td>
                    <td><b>${transaction.payment_amount}</b><br><a href="/ck/chapter-kittyInvoice?order_id=${transaction.order_id}" class="fw-medium text-success">View</a></td>
                    <td style="font-weight: 600">${paymentMethod}</td>
                    <td style="font-weight: 500; font-style: italic">${order.order_id || 'N/A'}</td>
                    <td><b>${transactionId}</b></td>
                    <td><span class="${getPgStatusBadge(pgStatus)}">${pgStatus}</span></td>
                    <td><b>${getGatewayName(order.payment_gateway_id)}</b></td>
                    
                </tr>
            `;

            tableBody.insertAdjacentHTML('beforeend', row);
            serialNumber++; // Increment counter only for displayed rows
        });
        console.log('ReceivedAmount:', ReceivedAmount);
        const totalKittyAmountReceived = ReceivedAmount;
        const totalPendingMiscellaneousAmount = MiscellaneousAmount;

        // Step 7: Calculate total kitty amount pending
        // const totalKittyAmountPending = totalAmountRaised - totalKittyAmountReceived;
        // console.log('Total Kitty Amount Pending:', totalKittyAmountPending);

        // Step 8: Format values in Indian currency format
        const formattedBillAmount = indianCurrencyFormatter.format(amountWithGst);
        const formattedTotalRaised = indianCurrencyFormatter.format(totalAmountRaised);
        const formattedKittyReceived = indianCurrencyFormatter.format(totalKittyAmountReceived);
        // const formattedKittyPending = indianCurrencyFormatter.format(totalKittyAmountPending);
        const formattedMiscellaneousAmount = indianCurrencyFormatter.format(totalPendingMiscellaneousAmount);
        const formattedTotalPaidExpense = indianCurrencyFormatter.format(total_paid_expense);
        let availableAmount = parseFloat(available_fund) - parseFloat(total_paid_expense) +  parseFloat(ReceivedAmount);
        const formattedAvailableAmount = indianCurrencyFormatter.format(availableAmount);

        // Step 9: Update the UI with fetched values
        document.querySelector('.total_bill_amount').textContent = formattedBillAmount ;
        document.querySelector('.total_kitty_amount_received').textContent = formattedKittyReceived;
        // document.querySelector('.total_kitty_amount_pending').textContent = formattedKittyPending;
        document.querySelector('.bill_type').textContent = bill_type;
        document.querySelector('.description').textContent = description;
        document.querySelector('.total_weeks').textContent = total_weeks;
        document.querySelector('.member_count').textContent = memberCount;
        document.querySelector('.total_miscellaneous_amount').textContent = formattedMiscellaneousAmount;
        document.querySelector('#total_expense_amount').textContent = formattedTotalPaidExpense;
        document.querySelector('#total_pexpense_amount').textContent = indianCurrencyFormatter.format(total_pending_expense);
        document.querySelector('#total_available_amount').textContent = formattedAvailableAmount;
        document.querySelector('#total_credit_amount').textContent = indianCurrencyFormatter.format(totalCreditAmount);
        document.querySelector('#no_of_late_payment').textContent = totalLatePayment;


        // Populate all filter dropdowns
        await populateGatewayFilter();
        populateMonthFilter();
        populatePgStatusFilter();
        populateMethodFilter();

        // Add click event listener for PG Status filter
        document.getElementById('payment-status-filter').addEventListener('click', function(e) {
            if (e.target.classList.contains('dropdown-item')) {
                selectedPgStatus = e.target.dataset.status;
                
                // Update dropdown button text
                const dropdownButton = e.target.closest('.dropdown').querySelector('.dropdown-toggle');
                dropdownButton.textContent = selectedPgStatus;
            }
        });

        // Add click event listener for Method filter
        document.getElementById('payment-method-filter').addEventListener('click', function(e) {
            if (e.target.classList.contains('dropdown-item')) {
                selectedMethod = e.target.dataset.method;
                
                // Update dropdown button text
                const dropdownButton = e.target.closest('.dropdown').querySelector('.dropdown-toggle');
                dropdownButton.textContent = selectedMethod.toUpperCase();
            }
        });

        // Add click event listener for apply filter button
        document.getElementById('apply-filters-btn').addEventListener('click', function() {
            filterTable();
        });

        // Update reset filter button click handler
        document.getElementById('reset-filters-btn').addEventListener('click', function() {
            // Reset all filter variables
            selectedGateway = null;
            selectedMonth = null;
            selectedPgStatus = null;
            selectedMethod = null;
            
            // Reset all dropdown texts
            const gatewayDropdown = document.querySelector('[data-bs-toggle="dropdown"]');
            gatewayDropdown.innerHTML = '<i class="ti ti-sort-descending-2 me-1"></i> Gateway';
            
            const monthDropdown = document.getElementById('month-filter')
                .closest('.dropdown')
                .querySelector('.dropdown-toggle');
            monthDropdown.innerHTML = '<i class="ti ti-sort-descending-2 me-1"></i> Month';
            
            const statusDropdown = document.getElementById('payment-status-filter')
                .closest('.dropdown')
                .querySelector('.dropdown-toggle');
            statusDropdown.innerHTML = '<i class="ti ti-sort-descending-2 me-1"></i> PG Status';
            
            const methodDropdown = document.getElementById('payment-method-filter')
                .closest('.dropdown')
                .querySelector('.dropdown-toggle');
            methodDropdown.innerHTML = '<i class="ti ti-sort-descending-2 me-1"></i> Method';
            
            // Show all rows
            const tableBody = document.getElementById('paymentsTableBody');
            const rows = tableBody.getElementsByTagName('tr');
            for (let row of rows) {
                row.style.display = '';
            }

            // Remove any "no results" message
            const noResultsMsg = document.getElementById('no-results-message');
            if (noResultsMsg) {
                noResultsMsg.remove();
            }
        });

    } catch (error) {
        console.error('ERROR in Chapter Kitty:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            type: error.name
        });
    } finally {
        hideLoader();
        console.log('=== Chapter Kitty Loading Process Completed ===');
    }
});