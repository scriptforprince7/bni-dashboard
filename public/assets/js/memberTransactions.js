// Function to show the loader
function showLoader() {
  document.getElementById('loader').style.display = 'flex'; // Show loader
}

// Function to hide the loader
function hideLoader() {
  document.getElementById('loader').style.display = 'none'; // Hide loader
}

(async function generateLedger() {
  // Get email from decoded token instead of localStorage
  const email = getUserEmail(); // Using the function from tokenUtils.js

  // if (!email) {
  //   alert('You are not logged in. Redirecting to login...');
  //   window.location.href = '/';
  //   return;
  // }

  try {
    showLoader(); // Show loader

    // Fetch member data
    const memberResponse = await fetch('https://bni-data-backend.onrender.com/api/members');
    const members = await memberResponse.json();

    // Filter data for logged-in user
    const userData = members.find(member => member.member_email_address === email);

    if (!userData) {
      alert('No data found for the logged-in user.');
      return;
    }
    console.log(userData.member_id);
    console.log(userData.chapter_id);
    console.log(userData);

    const { meeting_opening_balance, meeting_payable_amount, chapter_id } = userData;

    // Fetch chapter description and bill type using chapter_id
    const kittyPaymentsResponse = await fetch('https://bni-data-backend.onrender.com/api/getKittyPayments');
    const kittyPayments = await kittyPaymentsResponse.json();

    // Find the chapter payment details for the logged-in user's chapter
    const chapterPayment = kittyPayments.find(payment => payment.chapter_id === chapter_id);
    // console.log(chapterPayment.kitty_bill_id);
    if(!chapterPayment) {
      // alert('No chapter payment details found for the logged-in user.');
      document.getElementById('total-kitty-amount').textContent = 'No Bill Raised Yet.';
      document.querySelector('.description').innerHTML = '-';
      document.getElementById('billType').textContent = '-';
      document.getElementById('tot_weeks').textContent = '-';
      const ledgerData = [
        {
          sNo: 1,
          date: new Date().toLocaleDateString(),
          description: 'Opening Balance',
          debit: meeting_opening_balance,
          credit: 0,
          balance: meeting_opening_balance, // Display opening balance here
          balanceColor: 'red', // Set balance color to red
        },
        
      ];
      const ledgerBody = document.getElementById('ledger-body');
    ledgerBody.innerHTML = ''; // Clear existing rows
    ledgerData.forEach(entry => {
      const row = document.createElement('tr');
      
      // For Opening Balance and Meeting Payable Amount, always show in red with a '-'
      const balanceColor = (entry.sNo === 1 || entry.sNo === 2) ? 'red' : (entry.balance >= 0 ? 'green' : 'red');
      const balanceSign = (entry.sNo === 1 || entry.sNo === 2) ? '-' : (entry.balance >= 0 ? '+' : '-');
    
      row.innerHTML = `
        <td>${entry.sNo}</td>
        <td><b>${entry.date}</b></td>
        <td><b>${entry.description}</b></td>
        <td><b style="color: ${entry.debit ? 'red' : 'inherit'}">${entry.debit ? parseFloat(entry.debit).toFixed(2) : '-'}</b></td>
        <td><b style="color: ${entry.credit ? 'green' : 'inherit'}">${entry.credit ? parseFloat(entry.credit).toFixed(2) : '-'}</b></td>
        <td>
          <b style="color: ${balanceColor}">
            ${balanceSign}${parseFloat(entry.balance).toFixed(2)}
          </b>
        </td>
      `;
      
      ledgerBody.appendChild(row);
    });
      hideLoader(); // Hide loader
      return;
    }

    const chapterDescription = chapterPayment
      ? `${chapterPayment.description}`
      : 'No description available';
      console.log(chapterDescription);

    // Fetch orders and transactions
    const [ordersResponse, transactionsResponse] = await Promise.all([
      fetch('https://bni-data-backend.onrender.com/api/allOrders'),
      fetch('https://bni-data-backend.onrender.com/api/allTransactions'),
    ]);

    const orders = await ordersResponse.json();
    const transactions = await transactionsResponse.json();

    // Filter orders where universal_link_id = 4 and customer_email matches
    const filteredOrders = orders.filter(order =>
      order.universal_link_id === 4 && order.customer_email === email && order.kitty_bill_id === chapterPayment.kitty_bill_id
    );
 let filteredTransactions = [];
    // Filter transactions based on matching order_id and payment_status = "SUCCESS"
    if(filteredOrders.length !== 0) {
       filteredTransactions = transactions.filter(transaction =>
        filteredOrders.map(order => order.order_id).includes(transaction.order_id) && transaction.payment_status === 'SUCCESS'
      );
      console.log(filteredTransactions);
    } else {
     filteredTransactions = [];
    }
    // const filteredTransactions = transactions.filter(transaction =>
    //   transaction.payment_status === 'SUCCESS' &&
    //   filteredOrders.some(order => order.order_id === transaction.order_id)
    // );

    // Prepare ledger data
    let currentBalance = meeting_opening_balance + meeting_payable_amount + (meeting_payable_amount * 0.18); // Initial balance
    let totalMeetingFeePaid = 0; // Track total meeting fee paid

    const ledgerData = [
      {
        sNo: 1,
        date: new Date().toLocaleDateString(),
        description: 'Opening Balance',
        debit: meeting_opening_balance,
        credit: 0,
        balance: meeting_opening_balance, // Display opening balance here
        balanceColor: 'red', // Set balance color to red
      },
      {
        sNo: 2,
        date: new Date().toLocaleDateString(),
        description: `
          <b>Meeting Payable Amount</b><br>
          <em>(bill for: ${chapterPayment.bill_type})</em> - 
          <em>(${chapterPayment.description})</em>
        `,
        debit: meeting_payable_amount + (meeting_payable_amount * 0.18),
        credit: 0,
        balance: currentBalance, // Show sum in Meeting Payable Amount row
        balanceColor: 'red', // Set balance color to red
      },
    ];
    
    

    // Add filtered transaction details to the ledger (ignore orders, only show transactions)
    filteredTransactions.forEach(transaction => {
      totalMeetingFeePaid += parseFloat(transaction.payment_amount || 0); // Sum the paid meeting fee
      currentBalance -= parseFloat(transaction.payment_amount || 0); // Subtract payment amount from current balance
      ledgerData.push({
        sNo: ledgerData.length + 1,
        date: new Date(transaction.payment_time).toLocaleDateString(),
        description: 'Meeting Fee Paid',
        debit: 0,
        credit: transaction.payment_amount,
        balance: currentBalance,
      });
    });

    // Display amounts in the spans
    document.getElementById('total-kitty-amount').textContent = ( meeting_payable_amount + (meeting_payable_amount * 0.18) ).toFixed(2);
    if(meeting_opening_balance === 0) {
      document.getElementById('success_kitty_amount').textContent = totalMeetingFeePaid.toFixed(2);
    document.getElementById('pending_payment_amount').textContent = (currentBalance).toFixed(2);
    } else {
      // document.getElementById('success_kitty_amount').textContent = totalMeetingFeePaid.toFixed(2) + ' (including opening balance)';
    // document.getElementById('pending_payment_amount').textContent = (currentBalance).toFixed(2) + ' (including opening balance)';
    if(currentBalance === 0){
      document.getElementById('pending_payment_amount').textContent = (currentBalance).toFixed(2);
    } else {
      document.getElementById('pending_payment_amount').innerHTML = `${currentBalance.toFixed(2)} <span style="color: green;">(inc. opening balance ${meeting_opening_balance.toFixed(2)})</span>`;
    }
    if(totalMeetingFeePaid === 0){
      document.getElementById('success_kitty_amount').textContent = totalMeetingFeePaid.toFixed(2);

    } else {
      document.getElementById('success_kitty_amount').innerHTML = `${totalMeetingFeePaid.toFixed(2)} <span style="color: green;">(inc. opening balance ${meeting_opening_balance.toFixed(2)})</span>`;
    }

    }

    if(chapterPayment){
      document.querySelector('.description').innerHTML = chapterDescription;
    document.getElementById('billType').textContent = chapterPayment.bill_type;
    document.getElementById('tot_weeks').textContent = chapterPayment.total_weeks;
    } else {
      document.querySelector('.description').innerHTML = 'No description available';
      document.getElementById('billType').textContent = 'No bill type available';
      document.getElementById('tot_weeks').textContent = 'No total weeks available';
    }


    // console.log(chapterPayment.bill_type);
    // console.log(chapterPayment.total_weeks);

     // Save pending_payment_amount to local storage
     localStorage.setItem('pendingPaymentAmount', currentBalance.toFixed(2));


    // Populate table rows
    const ledgerBody = document.getElementById('ledger-body');
    ledgerBody.innerHTML = ''; // Clear existing rows
    ledgerData.forEach(entry => {
      const row = document.createElement('tr');
      
      // For Opening Balance and Meeting Payable Amount, always show in red with a '-'
      const balanceColor = (entry.sNo === 1 || entry.sNo === 2) ? 'red' : (entry.balance >= 0 ? 'green' : 'red');
      const balanceSign = (entry.sNo === 1 || entry.sNo === 2) ? '-' : (entry.balance >= 0 ? '+' : '-');
    
      row.innerHTML = `
        <td>${entry.sNo}</td>
        <td><b>${entry.date}</b></td>
        <td><b>${entry.description}</b></td>
        <td><b style="color: ${entry.debit ? 'red' : 'inherit'}">${entry.debit ? parseFloat(entry.debit).toFixed(2) : '-'}</b></td>
        <td><b style="color: ${entry.credit ? 'green' : 'inherit'}">${entry.credit ? parseFloat(entry.credit).toFixed(2) : '-'}</b></td>
        <td>
          <b style="color: ${balanceColor}">
            ${balanceSign}${parseFloat(entry.balance).toFixed(2)}
          </b>
        </td>
      `;
      
      ledgerBody.appendChild(row);
    });
    
    
    
               
  } catch (error) {
    console.error('Error generating ledger:', error);
    alert('An error occurred while generating the ledger.');
  } finally {
    hideLoader(); // Hide loader
  }
})();


