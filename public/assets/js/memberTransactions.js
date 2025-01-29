// Function to show the loader
function showLoader() {
  document.getElementById('loader').style.display = 'flex'; // Show loader
}

// Function to hide the loader
function hideLoader() {
  document.getElementById('loader').style.display = 'none'; // Hide loader
}

function formatDate(dateStr) {
  // Create a new Date object from the string
  const date = new Date(dateStr);

  // Check if the date is valid
  if (isNaN(date.getTime())) {
    console.error('Error: incoming date is not valid');
    return 'Invalid Date';
  }

  // Format the date to 'DD/MM/YYYY'
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth() is 0-indexed
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

(async function generateLedger() {
  // Get email from decoded token instead of localStorage
  const email = getUserEmail(); // Using the function from tokenUtils.js

  if (!email) {
    alert('You are not logged in. Redirecting to login...');
    window.location.href = '/';
    return;
  }

  

// new changes --3rd logic
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
  console.log(userData.member_induction_date);

  const { meeting_opening_balance, meeting_payable_amount, chapter_id, member_id,member_email_address } = userData;

  const AllTimeRaisedKittyResponse = await fetch('https://bni-data-backend.onrender.com/api/getAllKittyPayments');
  const AllTimeRaisedKitty = await AllTimeRaisedKittyResponse.json();
  const allTimeRaisedKitty = AllTimeRaisedKitty.filter(kitty => kitty.chapter_id === chapter_id); 
  console.log("heree",allTimeRaisedKitty);

  if(allTimeRaisedKitty.length > 0){
    // Fetch chapter description and bill type using chapter_id
    const kittyPaymentsResponse = await fetch('https://bni-data-backend.onrender.com/api/getKittyPayments');
    const kittyPayments = await kittyPaymentsResponse.json();
    const allAvailableOrdersResponse = await fetch('https://bni-data-backend.onrender.com/api/allOrders');
    const allAvailableOrders = await allAvailableOrdersResponse.json();
    const allAvailableTransactionsResponse = await fetch('https://bni-data-backend.onrender.com/api/allTransactions');
    const allAvailableTransactions = await allAvailableTransactionsResponse.json();
    
    if(allTimeRaisedKitty.length === 1){
        // if founded kitty is matched with allactivekitty
        const matchFounded = kittyPayments.find(activekitty => activekitty.kitty_bill_id === allTimeRaisedKitty[0].kitty_bill_id);
        let currentBalance = parseFloat(meeting_opening_balance);
        let totalMeetingFeePaid = parseFloat(0);
      
        if(matchFounded){
          document.getElementById('total-kitty-amount').textContent = `${matchFounded.total_bill_amount}`;
      document.querySelector('.description').innerHTML = `${matchFounded.description}`;
      document.getElementById('billType').textContent = `${matchFounded.bill_type}`;
      document.getElementById('tot_weeks').textContent = `${matchFounded.total_weeks}`;
        }
        else{
          document.getElementById('total-kitty-amount').textContent = 'No Bill Raised.';
      document.querySelector('.description').innerHTML = '-';
      document.getElementById('billType').textContent = '-';
      document.getElementById('tot_weeks').textContent = '-';
        }
        const ledgerData = [
          {
            sNo: 1,
            date: formatDate(userData.member_induction_date), //date wtf
            description: 'Opening Balance',
            debit: meeting_opening_balance,
            credit: 0,
            balance: currentBalance, // Display opening balance here
            balanceColor: 'red', // Set balance color to red
          },
          
        ];

      console.log('here available kitty id is :',allTimeRaisedKitty[0]); 
      const itsCurrentOrder = allAvailableOrders.filter(order => order.kitty_bill_id === allTimeRaisedKitty[0].kitty_bill_id && order.customer_email=== member_email_address);
      
      if(matchFounded){
        // push active raised kitty in bill 
        currentBalance += parseFloat(meeting_payable_amount) + parseFloat(meeting_payable_amount * 0.18);
        ledgerData.push({
          sNo: 2,
          date: formatDate(allTimeRaisedKitty[0].raised_on),
          description: `
            <b>Meeting Payable Amount vs</b><br>
            <em>(bill for: ${allTimeRaisedKitty[0].bill_type})</em> - 
            <em>(${allTimeRaisedKitty[0].description})</em>
          `,
          debit: meeting_payable_amount + (meeting_payable_amount * 0.18),
          credit: 0,
          balance: currentBalance, // Show sum in Meeting Payable Amount row
          balanceColor: 'red', // Set balance color to red
        });
      } else{
        currentBalance += parseFloat(meeting_payable_amount) + parseFloat(meeting_payable_amount * 0.18);
        ledgerData.push({
          sNo: 2,
          date: formatDate(allTimeRaisedKitty[0].raised_on),
          description: `
            <b>Meeting Payable Amount vs</b><br>
            <em>(bill for: ${allTimeRaisedKitty[0].bill_type})</em> - 
            <em>(${allTimeRaisedKitty[0].description})</em>
          `,
          debit: meeting_payable_amount + (meeting_payable_amount * 0.18),
          credit: 0,
          balance: currentBalance, // Show sum in Meeting Payable Amount row
          balanceColor: 'red', // Set balance color to red
        });
      }
      
      if(itsCurrentOrder.length === 0){
        // alert('No Order found.');
      //   console.log('meeting_opening_balance:', meeting_opening_balance);
      // console.log('meeting_payable_amount:', meeting_payable_amount);
      // console.log('chapter_id:', chapter_id);
      // console.log('member_id:', member_id);
      // console.log("amount with gst:", meeting_payable_amount + (meeting_payable_amount * 0.18));
    //     // if founded kitty is matched with allactivekitty
    //   const matchFounded = kittyPayments.filter( activekit >= activekit.kitty_bill_id === allTimeRaisedKitty[0].kitty_bill_id);
      
    //   if(matchFounded){
    //     document.getElementById('total-kitty-amount').textContent = `${matchFounded.total_bill_amount}`;
    // document.querySelector('.description').innerHTML = `${matchFounded.description}`;
    // document.getElementById('billType').textContent = `${matchFounded.bill_type}`;
    // document.getElementById('tot_weeks').textContent = `${matchFounded.total_weeks}`;
    //   }
    //   else{
    //     document.getElementById('total-kitty-amount').textContent = 'No Bill Raised Ever.';
    // document.querySelector('.description').innerHTML = '-';
    // document.getElementById('billType').textContent = '-';
    // document.getElementById('tot_weeks').textContent = '-';
    //   }
      // if 1 kitty found in total then data is 

    // document.getElementById('total-kitty-amount').textContent = 'No Bill Raised Yet.';
    // document.querySelector('.description').innerHTML = '-';
    // document.getElementById('billType').textContent = '-';
    // document.getElementById('tot_weeks').textContent = '-';
    // const ledgerData = [
    //   {
    //     sNo: 1,
    //     date: formatDate(userData.member_induction_date),
    //     description: 'Opening Balance',
    //     debit: meeting_opening_balance,
    //     credit: 0,
    //     balance: meeting_opening_balance, // Display opening balance here
    //     balanceColor: 'red', // Set balance color to red
    //   },
      
    // ];
    // if(matchFounded){
    //   // push active raised kitty in bill
    //   ledgerData.push({
    //     sNo: 2,
    //     date: formatDate(allTimeRaisedKitty[0].payment_time),
    //     description: `
    //       <b>Meeting Payable Amount</b><br>
    //       <em>(bill for: ${allTimeRaisedKitty[0].bill_type})</em> - 
    //       <em>(${allTimeRaisedKitty[0].description})</em>
    //     `,
    //     debit: meeting_payable_amount + (meeting_payable_amount * 0.18),
    //     credit: 0,
    //     balance: currentBalance, // Show sum in Meeting Payable Amount row
    //     balanceColor: 'red', // Set balance color to red
    //   });
    // }
  //   const ledgerBody = document.getElementById('ledger-body');
  // ledgerBody.innerHTML = ''; // Clear existing rows
  // ledgerData.forEach(entry => {
  //   const row = document.createElement('tr');
    
  //   // For Opening Balance and Meeting Payable Amount, always show in red with a '-'
  //   const balanceColor = (entry.sNo === 1 || entry.sNo === 2) ? 'red' : (entry.balance >= 0 ? 'green' : 'red');
  //   const balanceSign = (entry.sNo === 1 || entry.sNo === 2) ? '-' : (entry.balance >= 0 ? '+' : '-');
  
  //   row.innerHTML = `
  //     <td>${entry.sNo}</td>
  //     <td><b>${entry.date}</b></td>
  //     <td><b>${entry.description}</b></td>
  //     <td><b style="color: ${entry.debit ? 'red' : 'inherit'}">${entry.debit ? parseFloat(entry.debit).toFixed(2) : '-'}</b></td>
  //     <td><b style="color: ${entry.credit ? 'green' : 'inherit'}">${entry.credit ? parseFloat(entry.credit).toFixed(2) : '-'}</b></td>
  //     <td>
  //       <b style="color: ${balanceColor}">
  //         ${balanceSign}${parseFloat(entry.balance).toFixed(2)}
  //       </b>
  //     </td>
  //   `;
    
  //   ledgerBody.appendChild(row);
  // });
  //   hideLoader(); // Hide loader
  //   return;


      }
      if(itsCurrentOrder.length > 0){
        console.log('itsCurrentOrder',itsCurrentOrder);
        let itsCurrentTransaction;
      itsCurrentOrder.forEach(order => {
        itsCurrentTransaction = allAvailableTransactions.filter(transaction => transaction.order_id === order.order_id && transaction.payment_status === 'SUCCESS');
        // console.log('itsCurrentTransaction for order', order.order_id, ':', itsCurrentTransaction);
      });
      // console.log('itsCurrentTransaction:', itsCurrentTransaction);

      // itsCurrentTransaction.forEach(transaction => {
      //   console.log('transaction.payment_status:', transaction.payment_status);
      // });
      // here i getting all the transactions for the current order id which is success and then i will calculate the total amount paid by the user. and is also check the opening balance and payable amount. from the user data. as this is first time payment or its a first user payment ever.
      // console.log('kitty_bill_id:', allTimeRaisedKitty[0].kitty_bill_id);
      console.log('meeting_opening_balance:', meeting_opening_balance);
      console.log('meeting_payable_amount:', meeting_payable_amount);
      console.log('chapter_id:', chapter_id);
      console.log('member_id:', member_id);
      console.log("amount with gst:", meeting_payable_amount + (meeting_payable_amount * 0.18));
      console.log('itsCurrentTransaction:', itsCurrentTransaction[0].payment_amount);

      // if success transaction founded then add new data  else no new field added
      // let ledgerData = [
      //       {
      //         sNo: 1,
      //         date: formatDate(userData.member_induction_date),
      //         description: 'Opening Balance',
      //         debit: meeting_opening_balance,
      //         credit: 0,
      //         balance: meeting_opening_balance, // Display opening balance here
      //         balanceColor: 'red', // Set balance color to red
      //       },
      //       {
      //         sNo: 2,
      //         date: formatDate(allTimeRaisedKitty[0].payment_time),
      //         description: `
      //           <b>Meeting Payable Amount</b><br>
      //           <em>(bill for: ${allTimeRaisedKitty[0].bill_type})</em> - 
      //           <em>(${allTimeRaisedKitty[0].description})</em>
      //         `,
      //         debit: meeting_payable_amount + (meeting_payable_amount * 0.18),
      //         credit: 0,
      //         balance: currentBalance, // Show sum in Meeting Payable Amount row
      //         balanceColor: 'red', // Set balance color to red
      //       }
      //     ];
        if(itsCurrentTransaction){ //add .length -->0
          // totalMeetingFeePaid += parseFloat(itsCurrentTransaction[0].payment_amount); // Sum the paid meeting fee
          // currentBalance -= parseFloat(itsCurrentTransaction.payment_amount || 0); // Subtract payment amount from current balance
          totalMeetingFeePaid += parseFloat(itsCurrentTransaction[0].payment_amount); 
          currentBalance -= parseFloat(itsCurrentTransaction[0].payment_amount);
          ledgerData.push({
            sNo: ledgerData.length + 1,
            date: formatDate(itsCurrentTransaction[0].payment_time),
            description: 'Meeting Fee Paid',
            debit: 0,
            credit: itsCurrentTransaction[0].payment_amount,
            balance: currentBalance,
          });
        }
      
    //   const ledgerBody = document.getElementById('ledger-body');
    // ledgerBody.innerHTML = ''; // Clear existing rows
    // ledgerData.forEach(entry => {
    //   const row = document.createElement('tr');
      
    //   // For Opening Balance and Meeting Payable Amount, always show in red with a '-'
    //   const balanceColor = (entry.sNo === 1 || entry.sNo === 2) ? 'red' : (entry.balance >= 0 ? 'green' : 'red');
    //   const balanceSign = (entry.sNo === 1 || entry.sNo === 2) ? '-' : (entry.balance >= 0 ? '+' : '-');
    
    //   row.innerHTML = `
    //     <td>${entry.sNo}</td>
    //     <td><b>${entry.date}</b></td>
    //     <td><b>${entry.description}</b></td>
    //     <td><b style="color: ${entry.debit ? 'red' : 'inherit'}">${entry.debit ? parseFloat(entry.debit).toFixed(2) : '-'}</b></td>
    //     <td><b style="color: ${entry.credit ? 'green' : 'inherit'}">${entry.credit ? parseFloat(entry.credit).toFixed(2) : '-'}</b></td>
    //     <td>
    //       <b style="color: ${balanceColor}">
    //         ${balanceSign}${parseFloat(entry.balance).toFixed(2)}
    //       </b>
    //     </td>
    //   `;
      
    //   ledgerBody.appendChild(row);
    // });
    //   hideLoader(); // Hide loader
    //   return;

      } 
      // document.getElementById('total-kitty-amount').textContent = (meeting_payable_amount + (meeting_payable_amount * 0.18)).toFixed(2);
        if (meeting_opening_balance === 0) {
          document.getElementById('success_kitty_amount').textContent = totalMeetingFeePaid.toFixed(2);
          document.getElementById('pending_payment_amount').textContent = currentBalance.toFixed(2);
        } else {
          if (currentBalance === 0) {
            document.getElementById('pending_payment_amount').textContent = currentBalance.toFixed(2);
          } else {
            document.getElementById('pending_payment_amount').innerHTML = `${currentBalance.toFixed(2)} <span style="color: green;">(inc. opening balance ${meeting_opening_balance.toFixed(2)})</span>`;
          }
          if (totalMeetingFeePaid === 0) {
            document.getElementById('success_kitty_amount').textContent = totalMeetingFeePaid.toFixed(2);
          } else {
            document.getElementById('success_kitty_amount').innerHTML = `${totalMeetingFeePaid.toFixed(2)} <span style="color: green;">(inc. opening balance ${meeting_opening_balance.toFixed(2)})</span>`;
          }
        }
        const ledgerBody = document.getElementById('ledger-body');
    ledgerBody.innerHTML = ''; // Clear existing rows
    ledgerData.forEach(entry => {
      const row = document.createElement('tr');
      
      // For Opening Balance and Meeting Payable Amount, always show in red with a '-' wtf
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

    if(allTimeRaisedKitty.length > 1){
      console.log('here available kitty ids are :',allTimeRaisedKitty); 
      const activeKittyPayments = allTimeRaisedKitty.map(kitty => {
        return kittyPayments.find(payment => payment.kitty_bill_id === kitty.kitty_bill_id);
      }).filter(payment => payment !== undefined);

      // here ui part adjusted
      // const matchFounded = kittyPayments.filter( activekit >= activekit.kitty_bill_id === allTimeRaisedKitty[0].kitty_bill_id);
      let currentBalance = parseFloat(meeting_opening_balance);
      let totalMeetingFeePaid = parseFloat(0);

        
      
      // op balance from member ledger data init here
      const ledgerData = [
        {
          sNo: 1,
          date: formatDate(userData.member_induction_date),
          description: 'Opening Balance',
          debit: meeting_opening_balance,
          credit: 0,
          balance: currentBalance, // Display opening balance here
          balanceColor: 'red', // Set balance color to red
        },
        
      ];
        if(activeKittyPayments.length !== 0 ){
          document.getElementById('total-kitty-amount').textContent = `${activeKittyPayments[0].total_bill_amount}`;
      document.querySelector('.description').innerHTML = `${activeKittyPayments[0].description}`;
      document.getElementById('billType').textContent = `${activeKittyPayments[0].bill_type}`;
      document.getElementById('tot_weeks').textContent = `${activeKittyPayments[0].total_weeks}`;
      console.log("runn 2",activeKittyPayments);
      // currentBalance+=meeting_payable_amount + (meeting_payable_amount * 0.18);
      // push walii line 
      // ledgerData.push({
      //   sNo: 2,
      //   date: new Date().toLocaleDateString(),
      //   description: `
      //     <b>Meeting Payable Amount</b><br>
      //     <em>(bill for: ${activeKittyPayments[0].bill_type})</em> - 
      //     <em>(${activeKittyPayments[0].description})</em>
      //   `,
      //   debit: meeting_payable_amount + (meeting_payable_amount * 0.18),
      //   credit: 0,
      //   balance: currentBalance, // Show sum in Meeting Payable Amount row
      //   balanceColor: 'red', // Set balance color to red
      // });
        }
        else{
          document.getElementById('total-kitty-amount').textContent = 'No Bill Raised Yet.';
      document.querySelector('.description').innerHTML = '-';
      document.getElementById('billType').textContent = '-';
      document.getElementById('tot_weeks').textContent = '-';
        }

        

      if(activeKittyPayments.length === 0){
        // alert('No Active Kitty Payments found.');
        let allKittyPaymentsExceptActive = allTimeRaisedKitty;
        allKittyPaymentsExceptActive.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        // sort and separated
        console.log("sorted allKittyPayment :", allKittyPaymentsExceptActive);
        // console.log("active kitty is :",activeKittyPayments); //wtf not available as active kitty is not here 
        let uniqueNO =0;
        

        // let currentBalance = meeting_opening_balance;
        // let totalMeetingFeePaid = 0;


        // for allkittyPaymentExceptActive [0]
        // console.log("first of sorted ..",allKittyPaymentsExceptActive[0]);
        console.log("first kitty id is in sort array:",allKittyPaymentsExceptActive[0].kitty_bill_id);
        const firstKittyAllOrders =allAvailableOrders.filter(order => order.kitty_bill_id === allKittyPaymentsExceptActive[0].kitty_bill_id && order.customer_email=== member_email_address);
        
        console.log('first raised all available Order:',firstKittyAllOrders);
        
        if(firstKittyAllOrders.length>0){
          let transactions;
          firstKittyAllOrders.forEach(order => {
            transactions = allAvailableTransactions.filter(transaction => transaction.order_id === order.order_id && transaction.payment_status === 'SUCCESS');
            // console.log('Transactions for order', order.order_id, ':', transactions);
          });


            if(transactions.length>0){
              uniqueNO = 1;
            }
            
            if(uniqueNO === 1){
              console.log("its kittyid is :",allKittyPaymentsExceptActive[0].kitty_bill_id);
              console.log('meeting_opening_balance:', meeting_opening_balance);
              console.log('meeting_payable_amount:', meeting_payable_amount);
              console.log('chapter_id:', chapter_id);
              console.log('member_id:', member_id);
              console.log("amount with gst:", meeting_payable_amount + (meeting_payable_amount * 0.18));
              console.log('itsCurrentTransaction:', transactions[0].payment_amount);
              // currentBalance -= parseFloat(transactions[0].payment_amount);
              // totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);
              // ledgerData.push({
              //   sNo: ledgerData.length + 1,
              //   date: formatDate(userData.member_induction_date),
              //   description: 'Opening Balance',
              //   debit: meeting_opening_balance,
              //   credit: 0,
              //   balance: currentBalance , // Display opening balance here
              //   balanceColor: 'red',
              // })
              currentBalance += parseFloat(allKittyPaymentsExceptActive[0].total_bill_amount) + parseFloat(parseFloat(allKittyPaymentsExceptActive[0].total_bill_amount) * 0.18);
              ledgerData.push({
                sNo: 2,
                date: formatDate(allKittyPaymentsExceptActive[0].raised_on),
                description: `
                  <b>Meeting Payable Amount vs</b><br>
                  <em>(bill for: ${allKittyPaymentsExceptActive[0].bill_type})</em> - 
                  <em>(${allKittyPaymentsExceptActive[0].description})</em>
                `,
                // debit: meeting_payable_amount + (meeting_payable_amount * 0.18),
                debit: parseFloat(allKittyPaymentsExceptActive[0].total_bill_amount) + parseFloat(parseFloat(allKittyPaymentsExceptActive[0].total_bill_amount) * 0.18),
                credit: 0,
                balance: currentBalance, // Show sum in Meeting Payable Amount row
                balanceColor: 'red', // Set balance color to red
              });

              currentBalance -= parseFloat(transactions[0].payment_amount);
              totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);

              // push transaction success in ledger 3
              ledgerData.push({
                sNo: ledgerData.length + 1,
                date: formatDate(transactions[0].payment_time),
                description: 'Meeting Fee Paid',
                debit: 0,
                credit: transactions[0].payment_amount,
                balance: currentBalance,
              });
              // console.log("payable amount :");
            }
            // transactions.forEach(transaction => {
            //   totalMeetingFeePaid += parseFloat(transaction.payment_amount || 0);
            //   currentBalance -= parseFloat(transaction.payment_amount || 0);
            // });
          
        }

        // for remaining kitty in array
        for (let index = 1; index < allKittyPaymentsExceptActive.length; index++) {
          const currentRemainingKitty = allKittyPaymentsExceptActive[index];
          console.log('hello',currentRemainingKitty);
          // if unique is 1 then fetch from new api  endpoint
          if(uniqueNO===1){
            console.log("its run. new api data fetch later")
            // const balancePaymentsResponse = await fetch('https://bni-data-backend.onrender.com/api/getPendingAmount', {
            //   method: 'POST',
            //   headers: {
            //     'Content-Type': 'application/json'
            //   },
            //   body: JSON.stringify({
            //     kitty_id: currentRemainingKitty.kitty_bill_id,
            //     member_id: member_id,
            //     chapter_id: chapter_id
            //   })
            // });
            const balancePaymentsResponse = await fetch(`https://bni-data-backend.onrender.com/api/getPendingAmount?kitty_id=${currentRemainingKitty.kitty_bill_id}&member_id=${member_id}&chapter_id=${chapter_id}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
              });
              const balancePayments = await balancePaymentsResponse.json();
              console.log("new data from db:",balancePayments);
            // const balancePayments = await balancePaymentsResponse.json();
            // console.log("new data from db:",balancePayments);

            const nextKittyAllOrders = allAvailableOrders.filter(order => order.kitty_bill_id === currentRemainingKitty.kitty_bill_id && order.customer_email=== member_email_address);
        
        console.log('Next kitty raised all available Order:',nextKittyAllOrders);
        
        if(nextKittyAllOrders.length>0){
          let transactions;
          nextKittyAllOrders.forEach(order => {
            transactions = allAvailableTransactions.filter(transaction => transaction.order_id === order.order_id && transaction.payment_status === 'SUCCESS');
        });
            // console.log('Transactions for order', order.order_id, ':', transactions);


            // here need to calll new api for new data
            if(transactions.length>0){
              console.log("its kittyid is :",currentRemainingKitty.kitty_bill_id);
              console.log('meeting_opening_balance:', meeting_opening_balance);
              console.log('meeting_payable_amount:', meeting_payable_amount);
              console.log('chapter_id:', chapter_id);
              console.log('member_id:', member_id);
              console.log("amount with gst:", meeting_payable_amount + (meeting_payable_amount * 0.18));
              console.log('itsCurrentTransaction:', transactions[0].payment_amount);
              // currentBalance -= parseFloat(transactions[0].payment_amount);
              // totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);
              // console.log("payable amount :");
              // ledgerData.push({
              //   sNo: ledgerData.length + 1,
              //   date: formatDate(userData.member_induction_date),
              //   description: 'Opening Balance',
              //   debit: meeting_opening_balance,
              //   credit: 0,
              //   balance: currentBalance, // Display opening balance here
              //   balanceColor: 'red',
              // })

              currentBalance += parseFloat(balancePayments.data?.[0]?.member_pending_balance) || 0; // new op/pending bal wtf linked
              ledgerData.push(
                {
                  sNo: ledgerData.length +1,
                  date: formatDate(balancePayments.data?.[0]?.date_of_update) || formatDate(userData.member_induction_date), //date from new api of last pending bal wtf //new data entry linked   ----- formatDate(10-12-1000) || 
                  description: 'Opening Balance',
                  debit: balancePayments.data?.[0]?.member_pending_balance || 10, // new bal api  wtf linked
                  credit: 0,
                  balance: currentBalance, // Display opening balance here
                  balanceColor: 'red', // Set balance color to red
                });
              currentBalance += parseFloat(currentRemainingKitty.total_bill_amount) + parseFloat(parseFloat(currentRemainingKitty.total_bill_amount) * 0.18);
              ledgerData.push({
                sNo: ledgerData.length +1,
                date: formatDate(currentRemainingKitty.raised_on),
                description: `
                  <b>Meeting Payable Amount vs</b><br>
                  <em>(bill for: ${currentRemainingKitty.bill_type})</em> - 
                  <em>(${currentRemainingKitty.description})</em>
                `,
                // debit: meeting_payable_amount + (meeting_payable_amount * 0.18),
                debit: parseFloat(currentRemainingKitty.total_bill_amount) + parseFloat(parseFloat(currentRemainingKitty.total_bill_amount) * 0.18),
                credit: 0,
                balance: currentBalance, // Show sum in Meeting Payable Amount row
                balanceColor: 'red', // Set balance color to red
              });

              currentBalance -= parseFloat(transactions[0].payment_amount);
              totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);

              // push transaction success in ledger 3
              ledgerData.push({
                sNo: ledgerData.length + 1,
                date: formatDate(transactions[0].payment_time),
                description: 'Meeting Fee Paid',
                debit: 0,
                credit: transactions[0].payment_amount,
                balance: currentBalance,
              }); 

              // currentBalance -= parseFloat(transactions[0].payment_amount);
              // totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);
              // ledgerData.push({
              //   sNo: ledgerData.length + 1,
              //   date: new Date(transactions.payment_time).toLocaleDateString(),
              //   description: 'Meeting Fee Paid',
              //   debit: 0,
              //   credit: transactions[0].payment_amount,
              //   balance: currentBalance,
              // });
              
            
            // transactions.forEach(transaction => {
            //   totalMeetingFeePaid += parseFloat(transaction.payment_amount || 0);
            //   currentBalance -= parseFloat(transaction.payment_amount || 0);
            // });
          // });
}
        }


          }

          // else from member take opening amount and then set unique no to 1
          else {
             const nextKittyAllOrders =allAvailableOrders.filter(order => order.kitty_bill_id === currentRemainingKitty.kitty_bill_id && order.customer_email=== member_email_address);
        
        console.log('Next kitty raised all available Order:',nextKittyAllOrders);
        
        if(nextKittyAllOrders.length>0){
          nextKittyAllOrders.forEach(order => {
            const transactions = allAvailableTransactions.filter(transaction => transaction.order_id === order.order_id && transaction.payment_status === 'SUCCESS');
            console.log('Transactions for order', order.order_id, ':', transactions);


            if(transactions.length>0){
              uniqueNO = 1;
            }
            if(uniqueNO === 1){
              console.log("its kittyid is :",currentRemainingKitty.kitty_bill_id);
              console.log('meeting_opening_balance:', meeting_opening_balance);
              console.log('meeting_payable_amount:', meeting_payable_amount);
              console.log('chapter_id:', chapter_id);
              console.log('member_id:', member_id);
              console.log("amount with gst:", meeting_payable_amount + (meeting_payable_amount * 0.18));
              console.log('itsCurrentTransaction:', transactions[0].payment_amount);
              // currentBalance -= parseFloat(transactions[0].payment_amount);
              // totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);
              // ledgerData.push({
              //   sNo: ledgerData.length + 1,
              //   date: formatDate(userData.member_induction_date),
              //   description: 'Opening Balance',
              //   debit: meeting_opening_balance,
              //   credit: 0,
              //   balance: meeting_opening_balance, // Display opening balance here
              //   balanceColor: 'red',
              // })
              currentBalance += parseFloat(currentRemainingKitty.total_bill_amount) + parseFloat(parseFloat(currentRemainingKitty.total_bill_amount) * 0.18);
              ledgerData.push({
                sNo: ledgerData.length +1,
                date: formatDate(currentRemainingKitty.raised_on),
                description: `
                  <b>Meeting Payable Amount vs</b><br>
                  <em>(bill for: ${currentRemainingKitty.bill_type})</em> - 
                  <em>(${currentRemainingKitty.description})</em>
                `,
                // debit: meeting_payable_amount + (meeting_payable_amount * 0.18),
                debit: parseFloat(currentRemainingKitty.total_bill_amount) + parseFloat(parseFloat(currentRemainingKitty.total_bill_amount) * 0.18),
                credit: 0,
                balance: currentBalance, // Show sum in Meeting Payable Amount row
                balanceColor: 'red', // Set balance color to red
              });


              currentBalance -= parseFloat(transactions[0].payment_amount);
              totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);
              ledgerData.push({
                sNo: ledgerData.length + 1,
                date: formatDate(transactions[0].payment_time),
                description: 'Meeting Fee Paid',
                debit: 0,
                credit: transactions[0].payment_amount,
                balance: currentBalance,
              });
              // console.log("payable amount :");
            }
            // transactions.forEach(transaction => {
            //   totalMeetingFeePaid += parseFloat(transaction.payment_amount || 0);
            //   currentBalance -= parseFloat(transaction.payment_amount || 0);
            // });
          });
        }
        }
      }

      } else{ //with active alsoo
        
        //now i will separate activekittypayment from the allTimeRaisedKitty and store all in allKittyPaymentsExceptActive and then i will sort the allKittyPaymentsExceptActive
        //  and for first allKittyPaymentsExceptActive[0] i will check its corresponding orders then for every order i will check its corresponding transactions and if transaction is success then here opening balance i use is member opening balance and for remaining allKittyPaymentsExceptActive i do same but after getting any success transaction i will fetch new pending/opening balance from new api endpoint  and used that in calculation and then finally i will do for activekittypayment as for its corresponding all orders then for its every order i will check its corresponding transactions and if transaction is success then here opening balance i use is from new api endpoint and do the rest of the calculation.
        const allKittyPaymentsExceptActive = allTimeRaisedKitty.filter(kitty => !activeKittyPayments.some(payment => payment.kitty_bill_id === kitty.kitty_bill_id));
        allKittyPaymentsExceptActive.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        // sort and separated
        console.log("sorted allKittyPayment :", allKittyPaymentsExceptActive);
        console.log("active kitty is in else active found case:",activeKittyPayments);
        let uniqueNO =0;
        // let currentBalance = meeting_opening_balance;
        // let totalMeetingFeePaid = 0;
        
// new one 
// for allkittyPaymentExceptActive [0]
        // console.log("first of sorted ..",allKittyPaymentsExceptActive[0]);
        console.log("first kitty id is in sort array:",allKittyPaymentsExceptActive[0].kitty_bill_id);
        const firstKittyAllOrders =allAvailableOrders.filter(order => order.kitty_bill_id === allKittyPaymentsExceptActive[0].kitty_bill_id && order.customer_email=== member_email_address);
        
        console.log('first raised all available Order:',firstKittyAllOrders);
        
        if(firstKittyAllOrders.length>0){
          let transactions;
          firstKittyAllOrders.forEach(order => {
            transactions = allAvailableTransactions.filter(transaction => transaction.order_id === order.order_id && transaction.payment_status === 'SUCCESS');
            // console.log('Transactions for order', order.order_id, ':', transactions);
          });


            if(transactions.length>0){
              uniqueNO = 1;
            }
            
            if(uniqueNO === 1){
              console.log("its kittyid is :",allKittyPaymentsExceptActive[0].kitty_bill_id);
              console.log('meeting_opening_balance:', meeting_opening_balance);
              console.log('meeting_payable_amount:', meeting_payable_amount);
              console.log('chapter_id:', chapter_id);
              console.log('member_id:', member_id);
              console.log("amount with gst:", meeting_payable_amount + (meeting_payable_amount * 0.18));
              console.log('itsCurrentTransaction:', transactions[0].payment_amount);
              // currentBalance -= parseFloat(transactions[0].payment_amount);
              // totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);
              // ledgerData.push({
              //   sNo: ledgerData.length + 1,
              //   date: formatDate(userData.member_induction_date),
              //   description: 'Opening Balance',
              //   debit: meeting_opening_balance,
              //   credit: 0,
              //   balance: currentBalance , // Display opening balance here
              //   balanceColor: 'red',
              // })
              currentBalance += parseFloat(allKittyPaymentsExceptActive[0].total_bill_amount) + parseFloat(parseFloat(allKittyPaymentsExceptActive[0].total_bill_amount) * 0.18);
              ledgerData.push({
                sNo: 2,
                date: formatDate(allKittyPaymentsExceptActive[0].raised_on),
                description: `
                  <b>Meeting Payable Amount vs</b><br>
                  <em>(bill for: ${allKittyPaymentsExceptActive[0].bill_type})</em> - 
                  <em>(${allKittyPaymentsExceptActive[0].description})</em>
                `,
                // debit: meeting_payable_amount + (meeting_payable_amount * 0.18),
                debit: parseFloat(allKittyPaymentsExceptActive[0].total_bill_amount) + parseFloat(parseFloat(allKittyPaymentsExceptActive[0].total_bill_amount) * 0.18),
                credit: 0,
                balance: currentBalance, // Show sum in Meeting Payable Amount row
                balanceColor: 'red', // Set balance color to red
              });

              currentBalance -= parseFloat(transactions[0].payment_amount);
              totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);

              // push transaction success in ledger 3
              ledgerData.push({
                sNo: ledgerData.length + 1,
                date: formatDate(transactions[0].payment_time),
                description: 'Meeting Fee Paid',
                debit: 0,
                credit: transactions[0].payment_amount,
                balance: currentBalance,
              });
              // console.log("payable amount :");
            }
            // transactions.forEach(transaction => {
            //   totalMeetingFeePaid += parseFloat(transaction.payment_amount || 0);
            //   currentBalance -= parseFloat(transaction.payment_amount || 0);
            // });
          
        }

        // for remaining kitty in array
        for (let index = 1; index < allKittyPaymentsExceptActive.length; index++) {
          const currentRemainingKitty = allKittyPaymentsExceptActive[index];
          console.log('hello',currentRemainingKitty);
          // if unique is 1 then fetch from new api  endpoint
          if(uniqueNO===1){
            console.log("its run. new api data fetch later");
            // const balancePaymentsResponse = await fetch('https://bni-data-backend.onrender.com/api/getPendingAmount', {
            //   method: 'POST',
            //   headers: {
            //     'Content-Type': 'application/json'
            //   },
            //   body: JSON.stringify({
            //     kitty_id: currentRemainingKitty.kitty_bill_id,
            //     member_id: member_id,
            //     chapter_id: chapter_id
            //   })
            // });
            const balancePaymentsResponse = await fetch(`https://bni-data-backend.onrender.com/api/getPendingAmount?kitty_id=${currentRemainingKitty.kitty_bill_id}&member_id=${member_id}&chapter_id=${chapter_id}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
              });
              const balancePayments = await balancePaymentsResponse.json();
              console.log("new data from db:",balancePayments);
            // const balancePayments = await balancePaymentsResponse.json();
            // console.log("new data from db:",balancePayments);

            const nextKittyAllOrders = allAvailableOrders.filter(order => order.kitty_bill_id === currentRemainingKitty.kitty_bill_id && order.customer_email=== member_email_address);
        
        console.log('Next kitty raised all available Order:',nextKittyAllOrders);
        
        if(nextKittyAllOrders.length>0){
          let transactions;
          nextKittyAllOrders.forEach(order => {
            transactions = allAvailableTransactions.filter(transaction => transaction.order_id === order.order_id && transaction.payment_status === 'SUCCESS');
        });
            // console.log('Transactions for order', order.order_id, ':', transactions);


            // here need to calll new api for new data
            if(transactions.length>0){
              console.log("its kittyid is :",currentRemainingKitty.kitty_bill_id);
              console.log('meeting_opening_balance:', meeting_opening_balance);
              console.log('meeting_payable_amount:', meeting_payable_amount);
              console.log('chapter_id:', chapter_id);
              console.log('member_id:', member_id);
              console.log("amount with gst:", meeting_payable_amount + (meeting_payable_amount * 0.18));
              console.log('itsCurrentTransaction:', transactions[0].payment_amount);
              // currentBalance -= parseFloat(transactions[0].payment_amount);
              // totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);
              // console.log("payable amount :");
              // ledgerData.push({
              //   sNo: ledgerData.length + 1,
              //   date: formatDate(userData.member_induction_date),
              //   description: 'Opening Balance',
              //   debit: meeting_opening_balance,
              //   credit: 0,
              //   balance: currentBalance, // Display opening balance here
              //   balanceColor: 'red',
              // })

                currentBalance += parseFloat(balancePayments.data?.[0]?.member_pending_balance) || 0; // new op/pending bal wtf link
              ledgerData.push(
                {
                  sNo: ledgerData.length +1,
                  date: formatDate(balancePayments.data?.[0]?.date_of_update) || 10-12-2000, //date from new api of last pending ---- formatDate(10-12-2025) ||    ----bal wtf link
                  description: 'Opening Balance',
                  debit: balancePayments.data?.[0]?.member_pending_balance || 10, // new bal api  wtf link
                  credit: 0,
                  balance: currentBalance, // Display opening balance here
                  balanceColor: 'red', // Set balance color to red
                });
              currentBalance += parseFloat(currentRemainingKitty.total_bill_amount) + parseFloat(parseFloat(currentRemainingKitty.total_bill_amount) * 0.18);
              ledgerData.push({
                sNo: ledgerData.length +1,
                date: formatDate(currentRemainingKitty.raised_on),
                description: `
                  <b>Meeting Payable Amount vs</b><br>
                  <em>(bill for: ${currentRemainingKitty.bill_type})</em> - 
                  <em>(${currentRemainingKitty.description})</em>
                `,
                // debit: meeting_payable_amount + (meeting_payable_amount * 0.18),
                debit: parseFloat(currentRemainingKitty.total_bill_amount) + parseFloat(parseFloat(currentRemainingKitty.total_bill_amount) * 0.18),
                credit: 0,
                balance: currentBalance, // Show sum in Meeting Payable Amount row
                balanceColor: 'red', // Set balance color to red
              });

              currentBalance -= parseFloat(transactions[0].payment_amount);
              totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);

              // push transaction success in ledger 3
              ledgerData.push({
                sNo: ledgerData.length + 1,
                date: formatDate(transactions[0].payment_time),
                description: 'Meeting Fee Paid',
                debit: 0,
                credit: transactions[0].payment_amount,
                balance: currentBalance,
              }); 

              // currentBalance -= parseFloat(transactions[0].payment_amount);
              // totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);
              // ledgerData.push({
              //   sNo: ledgerData.length + 1,
              //   date: new Date(transactions.payment_time).toLocaleDateString(),
              //   description: 'Meeting Fee Paid',
              //   debit: 0,
              //   credit: transactions[0].payment_amount,
              //   balance: currentBalance,
              // });
              
            
            // transactions.forEach(transaction => {
            //   totalMeetingFeePaid += parseFloat(transaction.payment_amount || 0);
            //   currentBalance -= parseFloat(transaction.payment_amount || 0);
            // });
          // });
}
        }


          }

          // else from member take opening amount and then set unique no to 1
          else {
             const nextKittyAllOrders =allAvailableOrders.filter(order => order.kitty_bill_id === currentRemainingKitty.kitty_bill_id && order.customer_email=== member_email_address);
        
        console.log('Next kitty raised all available Order:',nextKittyAllOrders);
        
        if(nextKittyAllOrders.length>0){
          nextKittyAllOrders.forEach(order => {
            const transactions = allAvailableTransactions.filter(transaction => transaction.order_id === order.order_id && transaction.payment_status === 'SUCCESS');
            console.log('Transactions for order', order.order_id, ':', transactions);


            if(transactions.length>0){
              uniqueNO = 1;
            }
            if(uniqueNO === 1){
              console.log("its kittyid is :",currentRemainingKitty.kitty_bill_id);
              console.log('meeting_opening_balance:', meeting_opening_balance);
              console.log('meeting_payable_amount:', meeting_payable_amount);
              console.log('chapter_id:', chapter_id);
              console.log('member_id:', member_id);
              console.log("amount with gst:", meeting_payable_amount + (meeting_payable_amount * 0.18));
              console.log('itsCurrentTransaction:', transactions[0].payment_amount);
              // currentBalance -= parseFloat(transactions[0].payment_amount);
              // totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);
              // ledgerData.push({
              //   sNo: ledgerData.length + 1,
              //   date: formatDate(userData.member_induction_date),
              //   description: 'Opening Balance',
              //   debit: meeting_opening_balance,
              //   credit: 0,
              //   balance: meeting_opening_balance, // Display opening balance here
              //   balanceColor: 'red',
              // })
              currentBalance += parseFloat(currentRemainingKitty.total_bill_amount) + parseFloat(parseFloat(currentRemainingKitty.total_bill_amount) * 0.18);
              ledgerData.push({
                sNo: ledgerData.length +1,
                date: formatDate(currentRemainingKitty.raised_on),
                description: `
                  <b>Meeting Payable Amount vs</b><br>
                  <em>(bill for: ${currentRemainingKitty.bill_type})</em> - 
                  <em>(${currentRemainingKitty.description})</em>
                `,
                // debit: meeting_payable_amount + (meeting_payable_amount * 0.18),
                debit: parseFloat(currentRemainingKitty.total_bill_amount) + parseFloat(parseFloat(currentRemainingKitty.total_bill_amount) * 0.18),
                credit: 0,
                balance: currentBalance, // Show sum in Meeting Payable Amount row
                balanceColor: 'red', // Set balance color to red
              });


              currentBalance -= parseFloat(transactions[0].payment_amount);
              totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);
              ledgerData.push({
                sNo: ledgerData.length + 1,
                date: formatDate(transactions[0].payment_time),
                description: 'Meeting Fee Paid',
                debit: 0,
                credit: transactions[0].payment_amount,
                balance: currentBalance,
              });
              // console.log("payable amount :");
            }
            // transactions.forEach(transaction => {
            //   totalMeetingFeePaid += parseFloat(transaction.payment_amount || 0);
            //   currentBalance -= parseFloat(transaction.payment_amount || 0);
            // });
          });
        }
        }
      }

        // for allkittyPaymentExceptActive [0]
        // console.log("first of sorted ..",allKittyPaymentsExceptActive[0]);
      //   console.log("first kitty id is in sort array:",allKittyPaymentsExceptActive[0].kitty_bill_id);
      //   const firstKittyAllOrders =allAvailableOrders.filter(order => order.kitty_bill_id === allKittyPaymentsExceptActive[0].kitty_bill_id && order.customer_email=== member_email_address);
        
      //   console.log('first raised all available Order:',firstKittyAllOrders);
        
      //   if(firstKittyAllOrders.length>0){
      //     firstKittyAllOrders.forEach(order => {
      //       const transactions = allAvailableTransactions.filter(transaction => transaction.order_id === order.order_id && transaction.payment_status === 'SUCCESS');
      //       console.log('Transactions for order', order.order_id, ':', transactions);


      //       if(transactions.length>0){
      //         uniqueNO = 1;
      //       }
      //       if(uniqueNO === 1){
      //         console.log("its kittyid is :",allKittyPaymentsExceptActive[0].kitty_bill_id);
      //         console.log("date here :",allKittyPaymentsExceptActive[0])
      //         console.log('meeting_opening_balance:', meeting_opening_balance);
      //         console.log('meeting_payable_amount:', meeting_payable_amount);
      //         console.log('chapter_id:', chapter_id);
      //         console.log('member_id:', member_id);
      //         console.log("amount with gst:", meeting_payable_amount + (meeting_payable_amount * 0.18));
      //         console.log('itsCurrentTransaction:', transactions[0].payment_amount);
      //         // currentBalance -= parseFloat(transactions[0].payment_amount);
      //         // totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);

      //         // ledgerData.push({
      //         //   sNo: ledgerData.length + 1,
      //         //   date: formatDate(userData.member_induction_date),
      //         //   description: 'Opening Balance anu',
      //         //   debit: meeting_opening_balance,
      //         //   credit: 0,
      //         //   balance: currentBalance, // Display opening balance here
      //         //   balanceColor: 'red',
      //         // })
      //         currentBalance += parseFloat(transactions[0].payment_amount);
      //         // totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);
              
      //         ledgerData.push({
      //           sNo: ledgerData.length + 1,
      //           date: formatDate(allKittyPaymentsExceptActive[0].raised_on),
      //           description: `
      //             <b>Meeting Payable Amount </b><br>
      //             <em>(bill for: ${allKittyPaymentsExceptActive[0].bill_type})</em> - 
      //             <em>(${allKittyPaymentsExceptActive[0].description})</em>
      //           `,
      //           debit: meeting_payable_amount + (meeting_payable_amount * 0.18),
      //           credit: 0,
      //           balance: currentBalance, // Show sum in Meeting Payable Amount row
      //           balanceColor: 'red', // Set balance color to red
      //         });
      //         currentBalance -= parseFloat(transactions[0].payment_amount);
      //         currentBalance= -currentBalance;
      //         totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);

      //         console.log("itttttttttttttt",currentBalance);
      //         ledgerData.push({
      //           sNo: ledgerData.length + 1,
      //           date: formatDate(transactions[0].payment_time),
      //           description: 'Meeting Fee Paid',
      //           debit: 0,
      //           credit: transactions[0].payment_amount,
      //           balance: currentBalance,
      //           // balanceColor:'green',
      //         });
      //         // console.log("payable amount :");
      //       }
      //       // transactions.forEach(transaction => {
      //       //   totalMeetingFeePaid += parseFloat(transaction.payment_amount || 0);
      //       //   currentBalance -= parseFloat(transaction.payment_amount || 0);
      //       // });
      //     });
      //   }

      //   // for remaining kitty in array
      //   for (let index = 1; index < allKittyPaymentsExceptActive.length; index++) {
      //     const currentRemainingKitty = allKittyPaymentsExceptActive[index];
      //     console.log('hello',currentRemainingKitty);
      //     // if unique is 1 then fetch from new api  endpoint
      //     if(uniqueNO===1){
      //       console.log("its run.")
      //       const nextKittyAllOrders = allAvailableOrders.filter(order => order.kitty_bill_id === currentRemainingKitty.kitty_bill_id && order.customer_email=== member_email_address);
        
      //   console.log('Next kitty raised all available Order:',nextKittyAllOrders);
        
      //   if(nextKittyAllOrders.length>0){
      //     nextKittyAllOrders.forEach(order => {
      //       const transactions = allAvailableTransactions.filter(transaction => transaction.order_id === order.order_id && transaction.payment_status === 'SUCCESS');
      //       console.log('Transactions for order', order.order_id, ':', transactions);

      //       // here need to calll new api for new data

      //       // currentBalance-= transactions[0].payment_amount;
            
      //         console.log("its kittyid is :",currentRemainingKitty.kitty_bill_id);

      //         console.log('meeting_opening_balance:', meeting_opening_balance);
      //         console.log("current remaining kittu details", currentRemainingKitty);
      //         console.log('meeting_payable_amount:', meeting_payable_amount);
      //         console.log('chapter_id:', chapter_id);
      //         console.log('member_id:', member_id);
      //         console.log("amount with gst:", meeting_payable_amount + (meeting_payable_amount * 0.18));
      //         console.log('itsCurrentTransaction:', transactions[0].payment_amount);
      //         // currentBalance -= parseFloat(transactions[0].payment_amount);
      //         // totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);
      //         // ledgerData.push({
      //         //   sNo: ledgerData.length + 1,
      //         //   date: new Date(transactions.payment_time).toLocaleDateString(),
      //         //   description: 'Meeting Fee Paid',
      //         //   debit: 0,
      //         //   credit: transactions[0].payment_amount,
      //         //   balance: currentBalance,
      //         // });
      //         currentBalance -= meeting_opening_balance;
      //         totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);

      //         ledgerData.push({
      //           sNo: ledgerData.length + 1,
      //           date: formatDate(userData.member_induction_date),
      //           description: 'Opening Balance',
      //           debit: meeting_opening_balance,
      //           credit: 0,
      //           balance: currentBalance, // Display opening balance here
      //           balanceColor: 'red',
      //         })
      //         currentBalance -= parseFloat(transactions[0].payment_amount);
      //         // totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);

              
      //         ledgerData.push({
      //           sNo: ledgerData.length + 1,
      //           date: formatDate(currentRemainingKitty.raised_on),
      //           description: `
      //             <b>Meeting Payable Amount vasu</b><br>
      //             <em>(bill for: ${currentRemainingKitty.bill_type})</em> - 
      //             <em>(${currentRemainingKitty.description})</em>
      //           `,
      //           debit: parseFloat(currentRemainingKitty.total_bill_amount) + parseFloat(currentRemainingKitty.total_bill_amount * 0.18),//with gst
      //           credit: 0,
      //           balance: currentBalance, // Show sum in Meeting Payable Amount row 
      //           balanceColor: 'red', // Set balance color to red
      //         });
      //         currentBalance += parseFloat(transactions[0].payment_amount);
      //         totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);

      //         ledgerData.push({
      //           sNo: ledgerData.length + 1,
      //           date: formatDate(transactions[0].payment_time),
      //           description: 'Meeting Fee Paid',
      //           debit: 0,
      //           credit: transactions[0].payment_amount,
      //           balance: currentBalance,
      //           balanceColor:'green',
      //         });
      //         // console.log("payable amount :");
            
      //       // transactions.forEach(transaction => {
      //       //   totalMeetingFeePaid += parseFloat(transaction.payment_amount || 0);
      //       //   currentBalance -= parseFloat(transaction.payment_amount || 0);
      //       // });
      //     });
      //   }


      //     }

      //     // else from member take opening amount and then set unique no to 1
      //     else {
      //        const nextKittyAllOrders =allAvailableOrders.filter(order => order.kitty_bill_id === currentRemainingKitty.kitty_bill_id && order.customer_email=== member_email_address);
        
      //   console.log('Next kitty raised all available Order:',nextKittyAllOrders);
        
      //   if(nextKittyAllOrders.length>0){
      //     nextKittyAllOrders.forEach(order => {
      //       const transactions = allAvailableTransactions.filter(transaction => transaction.order_id === order.order_id && transaction.payment_status === 'SUCCESS');
      //       console.log('Transactions for order', order.order_id, ':', transactions);


      //       if(transactions.length>0){
      //         uniqueNO = 1;
      //       }
      //       if(uniqueNO === 1){
      //         console.log("its kittyid is :",currentRemainingKitty.kitty_bill_id);
      //         console.log('meeting_opening_balance:', meeting_opening_balance);
      //         console.log('meeting_payable_amount:', meeting_payable_amount);
      //         console.log('chapter_id:', chapter_id);
      //         console.log('member_id:', member_id);
      //         console.log("amount with gst:", meeting_payable_amount + (meeting_payable_amount * 0.18));
      //         console.log('itsCurrentTransaction:', transactions[0].payment_amount);
      //         // currentBalance -= parseFloat(transactions[0].payment_amount);
      //         // totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);

      //         // ledgerBody.push({
      //         //   sNo: ledgerData.length + 1,
      //         //   date: formatDate(userData.member_induction_date),
      //         //   description: 'Opening Balance',
      //         //   debit: meeting_opening_balance,
      //         //   credit: 0,
      //         //   balance: currentBalance, // Display opening balance here
      //         //   balanceColor: 'red',
      //         // })
      //         // currentBalance -= parseFloat(transactions[0].payment_amount);
      //         // totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);

      //         // ledgerData.push({
      //         //   sNo: ledgerData.length + 1,
      //         //   date: formatDate(userData.member_induction_date),
      //         //   description: 'Opening Balance',
      //         //   debit: meeting_opening_balance,
      //         //   credit: 0,
      //         //   balance: currentBalance, // Display opening balance here
      //         //   balanceColor: 'red',
      //         // })

      //         currentBalance -= parseFloat(transactions[0].payment_amount);
      //         totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);

              
      //         ledgerData.push({
      //           sNo: ledgerData.length + 1,
      //           date: formatDate(transactions[0].raised_on),
      //           description: `
      //             <b>Meeting Payable Amount</b><br>
      //             <em>(bill for: ${transactions[0].bill_type})</em> - 
      //             <em>(${transactions[0].description})</em>
      //           `,
      //           debit: transactions[0].total_bill_amount + (transactions[0].total_bill_amount * 0.18),//with gst
      //           credit: 0,
      //           balance: currentBalance, // Show sum in Meeting Payable Amount row 
      //           balanceColor: 'red', // Set balance color to red
      //         });

      //         currentBalance -= parseFloat(transactions[0].payment_amount);
      //         totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);
      //         ledgerData.push({
      //           sNo: ledgerData.length + 1,
      //           date: new Date(transactions.payment_time).toLocaleDateString(),
      //           description: 'Meeting Fee Paid',
      //           debit: 0,
      //           credit: transactions[0].payment_amount,
      //           balance: currentBalance,
      //         });
      //         // console.log("payable amount :");
      //       }
            
      //       // transactions.forEach(transaction => {
      //       //   totalMeetingFeePaid += parseFloat(transaction.payment_amount || 0);
      //       //   currentBalance -= parseFloat(transaction.payment_amount || 0);
      //       // });
      //     });
      //   }
      //   }
      // }

      // for last active kitty  heeeeeeeerrreeeeeeee need new changes
      // // Fetch new pending/opening balance from new API endpoint
        // const newBalanceResponse = await fetch('https://bni-data-backend.onrender.com/api/getNewBalance');
        // const newBalanceData = await newBalanceResponse.json();
        // currentBalance = newBalanceData.new_balance;




        // if i means its not first transaction and need new api here for op bal wtf
        if(uniqueNO === 1){
            const balancePaymentsResponse = await fetch(`https://bni-data-backend.onrender.com/api/getPendingAmount?kitty_id=${activeKittyPayments[0].kitty_bill_id}&member_id=${member_id}&chapter_id=${chapter_id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            }
            });
            const balancePayments = await balancePaymentsResponse.json();
            console.log("new data from db:",balancePayments);



          console.log("its run. new api data fetch later for which need sort in all ")

          // currentBalance += parseFloat(balancePayments.data?.[0]?.member_pending_balance || 10); // new op/pending bal wtf link
          //     ledgerData.push(
          //       {
          //         sNo: ledgerData.length +1,
          //         date:formatDate(balancePayments.data?.[0]?.date_of_update) || formatDate(userData.member_induction_date), //date from new api of last pending bal wtf link ----- formatDate(10-12-1000) || 
          //         description: 'Opening Balance',
          //         debit: balancePayments.data?.[0]?.member_pending_balance || 10, // new bal api  wtf
          //         credit: 0,
          //         balance: currentBalance, // Display opening balance here
          //         balanceColor: 'red', // Set balance color to red
          //       });


                // needto fetch all pending balance then sep on basis of member and chap then sort remaing on basis of date of update entry latest date is on 0th index
                const pendingBalanceResponse = await fetch('https://bni-data-backend.onrender.com/api/memberPendingKittyOpeningBalance');
                const pendingBalances = await pendingBalanceResponse.json();

                // Filter and sort pending balances
                const filteredPendingBalances = pendingBalances
                  .filter(balance => balance.member_id === member_id && balance.chapter_id === chapter_id)
                  .sort((a, b) => new Date(b.date_of_update) - new Date(a.date_of_update));

                // Use the latest pending balance
                if (filteredPendingBalances.length > 0) {
                  const latestPendingBalance = filteredPendingBalances[0];
                  currentBalance += parseFloat(latestPendingBalance.member_pending_balance);
                  ledgerData.push({
                    sNo: ledgerData.length + 1,
                    date: formatDate(latestPendingBalance.date_of_update),
                    description: 'Opening Balance',
                    debit: latestPendingBalance.member_pending_balance,
                    credit: 0,
                    balance: currentBalance,
                    balanceColor: 'red',
                  });
                }





              currentBalance += parseFloat(activeKittyPayments[0].total_bill_amount) + parseFloat(parseFloat(activeKittyPayments[0].total_bill_amount) * 0.18);
              ledgerData.push({
                sNo: ledgerData.length +1,
                date: formatDate(activeKittyPayments[0].raised_on),
                description: `
                  <b>Meeting Payable Amount ui</b><br>
                  <em>(bill for: ${activeKittyPayments[0].bill_type})</em> - 
                  <em>(${activeKittyPayments[0].description})</em>
                `,
                // debit: meeting_payable_amount + (meeting_payable_amount * 0.18),
                debit:parseFloat(activeKittyPayments[0].total_bill_amount) + parseFloat(parseFloat(activeKittyPayments[0].total_bill_amount) * 0.18),
                credit: 0,
                balance: currentBalance, // Show sum in Meeting Payable Amount row
                balanceColor: 'red', // Set balance color to red
              });


            const nextKittyAllOrders = allAvailableOrders.filter(order => order.kitty_bill_id === activeKittyPayments[0].kitty_bill_id && order.customer_email=== member_email_address);
        
        console.log('last active Next kitty raised all available Order:',nextKittyAllOrders);
        
        if(nextKittyAllOrders.length>0){
          let transactions;
          nextKittyAllOrders.forEach(order => {
            transactions = allAvailableTransactions.filter(transaction => transaction.order_id === order.order_id && transaction.payment_status === 'SUCCESS');
        });
            // console.log('Transactions for order', order.order_id, ':', transactions);


            // here need to calll new api for new data
            if(transactions.length>0){
              console.log("active kitty is :",activeKittyPayments);
              console.log("its kittyid is :",activeKittyPayments[0].kitty_bill_id);
              console.log('meeting_opening_balance:', meeting_opening_balance);
              console.log('meeting_payable_amount:', meeting_payable_amount);
              console.log('chapter_id:', chapter_id);
              console.log('member_id:', member_id);
              console.log("amount with gst:", meeting_payable_amount + (meeting_payable_amount * 0.18));
              console.log('itsCurrentTransaction:', transactions[0].payment_amount);
              // currentBalance -= parseFloat(transactions[0].payment_amount);
              // totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);
              // console.log("payable amount :");
              // ledgerData.push({
              //   sNo: ledgerData.length + 1,
              //   date: formatDate(userData.member_induction_date),
              //   description: 'Opening Balance',
              //   debit: meeting_opening_balance,
              //   credit: 0,
              //   balance: currentBalance, // Display opening balance here
              //   balanceColor: 'red',
              // })

              // currentBalance += parseFloat(meeting_opening_balance); // new op/pending bal wtf
              // ledgerData.push(
              //   {
              //     sNo: ledgerData.length +1,
              //     date: formatDate(userData.member_induction_date), //date from new api of last pending bal wtf
              //     description: 'Opening Balance',
              //     debit: meeting_opening_balance, // new bal api  wtf
              //     credit: 0,
              //     balance: currentBalance, // Display opening balance here
              //     balanceColor: 'red', // Set balance color to red
              //   });
              // currentBalance += parseFloat(activeKittyPayments.total_bill_amount) + parseFloat(parseFloat(activeKittyPayments.total_bill_amount) * 0.18);
              // ledgerData.push({
              //   sNo: ledgerData.length +1,
              //   date: formatDate(activeKittyPayments.raised_on),
              //   description: `
              //     <b>Meeting Payable Amount vsm</b><br>
              //     <em>(bill for: ${activeKittyPayments.bill_type})</em> - 
              //     <em>(${activeKittyPayments.description})</em>
              //   `,
              //   // debit: meeting_payable_amount + (meeting_payable_amount * 0.18),
              //   debit:parseFloat(activeKittyPayments.total_bill_amount) + parseFloat(parseFloat(activeKittyPayments.total_bill_amount) * 0.18),
              //   credit: 0,
              //   balance: currentBalance, // Show sum in Meeting Payable Amount row
              //   balanceColor: 'red', // Set balance color to red
              // });

              currentBalance -= parseFloat(transactions[0].payment_amount);
              totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);

              // push transaction success in ledger 3
              ledgerData.push({
                sNo: ledgerData.length + 1,
                date: formatDate(transactions[0].payment_time),
                description: 'Meeting Fee Paid',
                debit: 0,
                credit: transactions[0].payment_amount,
                balance: currentBalance,
              }); 

              // currentBalance -= parseFloat(transactions[0].payment_amount);
              // totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);
              // ledgerData.push({
              //   sNo: ledgerData.length + 1,
              //   date: new Date(transactions.payment_time).toLocaleDateString(),
              //   description: 'Meeting Fee Paid',
              //   debit: 0,
              //   credit: transactions[0].payment_amount,
              //   balance: currentBalance,
              // });
              
            
            // transactions.forEach(transaction => {
            //   totalMeetingFeePaid += parseFloat(transaction.payment_amount || 0);
            //   currentBalance -= parseFloat(transaction.payment_amount || 0);
            // });
          // });
}



          //------------------------------------------------------ old
        //   const nextKittyAllOrders = allAvailableOrders.filter(order => order.kitty_bill_id === activeKittyPayments.kitty_bill_id && order.customer_email=== member_email_address);
        
        // console.log('Last kitty raised all available Order:',nextKittyAllOrders);
        
        // if(nextKittyAllOrders.length>0){
        //   nextKittyAllOrders.forEach(order => {
        //     const transactions = allAvailableTransactions.filter(transaction => transaction.order_id === order.order_id && transaction.payment_status === 'SUCCESS');
        //     console.log('Transactions for order', order.order_id, ':', transactions);

        //     // here need to calll new api for new data
        //     if(transactions.length>0){
        //       console.log("its kittyid is :",activeKittyPayments.kitty_bill_id);
        //       console.log('meeting_opening_balance:', meeting_opening_balance);
        //       console.log('meeting_payable_amount:', meeting_payable_amount);
        //       console.log('chapter_id:', chapter_id);
        //       console.log('member_id:', member_id);
        //       console.log("amount with gst:", meeting_payable_amount + (meeting_payable_amount * 0.18));
        //       console.log('itsCurrentTransaction:', transactions[0].payment_amount);

        //       // currentBalance -= parseFloat(transactions[0].payment_amount);
        //       // totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);

        //       // ledgerData.push({
        //       //   sNo: ledgerData.length + 1,
        //       //   date: formatDate(userData.member_induction_date),
        //       //   description: 'Opening Balance',
        //       //   debit: meeting_opening_balance,
        //       //   credit: 0,
        //       //   balance: currentBalance, // Display opening balance here
        //       //   balanceColor: 'red',
        //       // })

        //       currentBalance -= parseFloat(transactions[0].payment_amount);
        //       totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);

              
        //       ledgerData.push({
        //         sNo: ledgerData.length + 1,
        //         date: formatDate(transactions[0].raised_on),
        //         description: `
        //           <b>Meeting Payable Amount</b><br>
        //           <em>(bill for: ${transactions[0].bill_type})</em> - 
        //           <em>(${transactions[0].description})</em>
        //         `,
        //         debit: transactions[0].total_bill_amount + (transactions[0].total_bill_amount * 0.18),//with gst
        //         credit: 0,
        //         balance: currentBalance, // Show sum in Meeting Payable Amount row 
        //         balanceColor: 'red', // Set balance color to red
        //       });



        //       currentBalance -= parseFloat(transactions[0].payment_amount);
        //       totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);
        //       ledgerData.push({
        //         sNo: ledgerData.length + 1,
        //         date: formatDate(transactions.payment_time),
        //         description: 'Meeting Fee Paid',
        //         debit: 0,
        //         credit: transactions[0].payment_amount,
        //         balance: currentBalance,
        //       });
        //       // console.log("payable amount :");
            
        //     // transactions.forEach(transaction => {
        //     //   totalMeetingFeePaid += parseFloat(transaction.payment_amount || 0);
        //     //   currentBalance -= parseFloat(transaction.payment_amount || 0);
        //     // });
        // } });
        
        // }
        }

        }else{
          // its first transaction of user and need to mark uniqueNO==1 if any transaction found success
          const lastKittyAllOrders =allAvailableOrders.filter(order => order.kitty_bill_id === activeKittyPayments[0].kitty_bill_id && order.customer_email=== member_email_address);
        
          console.log('Next kitty raised all available Order:',lastKittyAllOrders);


          // op from member route
          // currentBalance += parseFloat(meeting_opening_balance); // new op/pending bal wtf
          //     ledgerData.push(
          //       {
          //         sNo: ledgerData.length +1,
          //         date: formatDate(userData.member_induction_date), //date from new api of last pending bal wtf
          //         description: 'Opening Balance',
          //         debit: meeting_opening_balance, // new bal api  wtf
          //         credit: 0,
          //         balance: currentBalance, // Display opening balance here
          //         balanceColor: 'red', // Set balance color to red
          //       });
              currentBalance += parseFloat(activeKittyPayments[0].total_bill_amount) + parseFloat(parseFloat(activeKittyPayments[0].total_bill_amount) * 0.18);
                ledgerData.push({
                  sNo: ledgerData.length +1,
                  date: formatDate(activeKittyPayments[0].raised_on),
                  description: `
                    <b>Meeting Payable Amount vs</b><br>
                    <em>(bill for: ${activeKittyPayments[0].bill_type})</em> - 
                    <em>(${activeKittyPayments[0].description})</em>
                  `,
                  // debit: meeting_payable_amount + (meeting_payable_amount * 0.18),
                  debit: parseFloat(activeKittyPayments[0].total_bill_amount) + parseFloat(parseFloat(activeKittyPayments[0].total_bill_amount) * 0.18),
                  credit: 0,
                  balance: currentBalance, // Show sum in Meeting Payable Amount row
                  balanceColor: 'red', // Set balance color to red
                });
          
          if(lastKittyAllOrders.length>0){
            lastKittyAllOrders.forEach(order => {
              const transactions = allAvailableTransactions.filter(transaction => transaction.order_id === order.order_id && transaction.payment_status === 'SUCCESS');
              console.log('Transactions for order', order.order_id, ':', transactions);
  
  
              if(transactions.length>0){
                uniqueNO = 1;
              }
              if(uniqueNO === 1){
                console.log("its kittyid is :",activeKittyPayments[0].kitty_bill_id);
                console.log('meeting_opening_balance:', meeting_opening_balance);
                console.log('meeting_payable_amount:', meeting_payable_amount);
                console.log('chapter_id:', chapter_id);
                console.log('member_id:', member_id);
                console.log("amount with gst:", meeting_payable_amount + (meeting_payable_amount * 0.18));
                console.log('itsCurrentTransaction:', transactions[0].payment_amount);
                // currentBalance -= parseFloat(transactions[0].payment_amount);
                // totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);
                // ledgerData.push({
                //   sNo: ledgerData.length + 1,
                //   date: formatDate(userData.member_induction_date),
                //   description: 'Opening Balance',
                //   debit: meeting_opening_balance,
                //   credit: 0,
                //   balance: meeting_opening_balance, // Display opening balance here
                //   balanceColor: 'red',
                // })
                // currentBalance += parseFloat(activeKittyPayments.total_bill_amount) + parseFloat(parseFloat(activeKittyPayments.total_bill_amount) * 0.18);
                // ledgerData.push({
                //   sNo: ledgerData.length +1,
                //   date: formatDate(activeKittyPayments.raised_on),
                //   description: `
                //     <b>Meeting Payable Amount vs</b><br>
                //     <em>(bill for: ${activeKittyPayments.bill_type})</em> - 
                //     <em>(${activeKittyPayments.description})</em>
                //   `,
                //   // debit: meeting_payable_amount + (meeting_payable_amount * 0.18),
                //   debit: parseFloat(activeKittyPayments.total_bill_amount) + parseFloat(parseFloat(activeKittyPayments.total_bill_amount) * 0.18),
                //   credit: 0,
                //   balance: currentBalance, // Show sum in Meeting Payable Amount row
                //   balanceColor: 'red', // Set balance color to red
                // });
  
  
                currentBalance -= parseFloat(transactions[0].payment_amount);
                totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);
                ledgerData.push({
                  sNo: ledgerData.length + 1,
                  date: formatDate(transactions[0].payment_time),
                  description: 'Meeting Fee Paid',
                  debit: 0,
                  credit: transactions[0].payment_amount,
                  balance: currentBalance,
                });
                // console.log("payable amount :");
              }
              // transactions.forEach(transaction => {
              //   totalMeetingFeePaid += parseFloat(transaction.payment_amount || 0);
              //   currentBalance -= parseFloat(transaction.payment_amount || 0);
              // });
            });
          }
          




          // -----------------------------------------------------old
        //   const lastKittyAllOrders =allAvailableOrders.filter(order => order.kitty_bill_id === activeKittyPayments.kitty_bill_id && order.customer_email=== member_email_address);
        
        // console.log('last kitty raised all available Order:',lastKittyAllOrders);
        
        // if(lastKittyAllOrders.length>0){
        //   lastKittyAllOrders.forEach(order => {
        //     const transactions = allAvailableTransactions.filter(transaction => transaction.order_id === order.order_id && transaction.payment_status === 'SUCCESS');
        //     console.log('Transactions for order', order.order_id, ':', transactions);


        //     if(transactions.length>0){
        //       uniqueNO = 1;
        //     }
        //     if( transactions.length>0 && uniqueNO === 1){
        //       console.log("its kittyid is :",activeKittyPayments.kitty_bill_id);
        //       console.log('meeting_opening_balance:', meeting_opening_balance);
        //       console.log('meeting_payable_amount:', meeting_payable_amount);
        //       console.log('chapter_id:', chapter_id);
        //       console.log('member_id:', member_id);
        //       console.log("amount with gst:", meeting_payable_amount + (meeting_payable_amount * 0.18));
        //       console.log('itsCurrentTransaction:', transactions[0].payment_amount);
        //       // currentBalance -= parseFloat(transactions[0].payment_amount);
        //       // totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);

        //       // currentBalance -= parseFloat(transactions[0].payment_amount);
        //       // totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);

        //       // ledgerData.push({
        //       //   sNo: ledgerData.length + 1,
        //       //   date: formatDate(userData.member_induction_date),
        //       //   description: 'Opening Balance ',
        //       //   debit: meeting_opening_balance,
        //       //   credit: 0,
        //       //   balance: currentBalance, // Display opening balance here
        //       //   balanceColor: 'red',
        //       // })

        //       currentBalance -= parseFloat(transactions[0].payment_amount);
        //       totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);

              
        //       ledgerData.push({
        //         sNo: ledgerData.length + 1,
        //         date: formatDate(transactions[0].raised_on),
        //         description: `
        //           <b>Meeting Payable Amount</b><br>
        //           <em>(bill for: ${transactions[0].bill_type})</em> - 
        //           <em>(${transactions[0].description})</em>
        //         `,
        //         debit: transactions[0].total_bill_amount + (transactions[0].total_bill_amount * 0.18),//with gst
        //         credit: 0,
        //         balance: currentBalance, // Show sum in Meeting Payable Amount row 
        //         balanceColor: 'red', // Set balance color to red
        //       });


        //       ledgerData.push({
        //         sNo: ledgerData.length + 1,
        //         date: new Date(transactions.payment_time).toLocaleDateString(),
        //         description: 'Meeting Fee Paid',
        //         debit: 0,
        //         credit: transactions[0].payment_amount,
        //         balance: currentBalance,
        //       });
        //       // console.log("payable amount :");
        //     } else if( transactions.length>0 && uniqueNO !==1){
        //       currentBalance -= parseFloat(transactions[0].payment_amount);
        //       totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);

        //       ledgerData.push({
        //         sNo: ledgerData.length + 1,
        //         date: formatDate(userData.member_induction_date),
        //         description: 'Opening Balance',
        //         debit: meeting_payable_amount + (meeting_payable_amount * 0.18),
        //         credit: 0,
        //         balance: currentBalance, // Display opening balance here
        //         balanceColor: 'red',
        //       })

        //       currentBalance -= parseFloat(transactions[0].payment_amount);
        //       totalMeetingFeePaid += parseFloat(transactions[0].payment_amount);

              
        //       ledgerData.push({
        //         sNo: ledgerData.length + 1,
        //         date: formatDate(transactions[0].raised_on),
        //         description: `
        //           <b>Meeting Payable Amount</b><br>
        //           <em>(bill for: ${transactions[0].bill_type})</em> - 
        //           <em>(${transactions[0].description})</em>
        //         `,
        //         debit: transactions[0].total_bill_amount + (transactions[0].total_bill_amount * 0.18),//with gst
        //         credit: 0,
        //         balance: currentBalance, // Show sum in Meeting Payable Amount row 
        //         balanceColor: 'red', // Set balance color to red
        //       });


        //       ledgerData.push({
        //         sNo: ledgerData.length + 1,
        //         date: new Date(transactions.payment_time).toLocaleDateString(),
        //         description: 'Meeting Fee Paid',
        //         debit: 0,
        //         credit: transactions[0].payment_amount,
        //         balance: currentBalance,
        //       });
        //     }
        //     // transactions.forEach(transaction => {
        //     //   totalMeetingFeePaid += parseFloat(transaction.payment_amount || 0);
        //     //   currentBalance -= parseFloat(transaction.payment_amount || 0);
        //     // });
        //   });
        // }


        }
       
// ------------------------
                                // for (const kitty of allKittyPaymentsExceptActive) {
                                //   const orders = allAvailableOrders.filter(order => order.kitty_bill_id === kitty.kitty_bill_id);
                                //   for (const order of orders) {
                                //     const transactions = allAvailableTransactions.filter(transaction => transaction.order_id === order.order_id && transaction.payment_status === 'SUCCESS');
                                //     for (const transaction of transactions) {
                                //       totalMeetingFeePaid += parseFloat(transaction.payment_amount || 0);
                                //       currentBalance -= parseFloat(transaction.payment_amount || 0);
                                //     }
                                //   }
                                // }

                          // // Fetch new pending/opening balance from new API endpoint
                          // const newBalanceResponse = await fetch('https://bni-data-backend.onrender.com/api/getNewBalance');
                          // const newBalanceData = await newBalanceResponse.json();
                          // currentBalance = newBalanceData.new_balance;

                          // Process activeKittyPayments
                          // for (const activeKitty of activeKittyPayments) {
                          //   const orders = allAvailableOrders.filter(order => order.kitty_bill_id === activeKitty.kitty_bill_id);
                          //   for (const order of orders) {
                          //     const transactions = allAvailableTransactions.filter(transaction => transaction.order_id === order.order_id && transaction.payment_status === 'SUCCESS');
                          //     for (const transaction of transactions) {
                          //       totalMeetingFeePaid += parseFloat(transaction.payment_amount || 0);
                          //       currentBalance -= parseFloat(transaction.payment_amount || 0);
                          //     }
                          //   }
                          // }

        // Display amounts in the spans
        document.getElementById('total-kitty-amount').textContent = (meeting_payable_amount + (meeting_payable_amount * 0.18)).toFixed(2);
        if (meeting_opening_balance === 0) {
          document.getElementById('success_kitty_amount').textContent = totalMeetingFeePaid.toFixed(2);
          document.getElementById('pending_payment_amount').textContent = currentBalance.toFixed(2);
        } else {
          if (currentBalance === 0) {
            document.getElementById('pending_payment_amount').textContent = currentBalance.toFixed(2);
          } else {
            document.getElementById('pending_payment_amount').innerHTML = `${currentBalance.toFixed(2)} <span style="color: green;">(inc. opening balance ${meeting_opening_balance.toFixed(2)})</span>`;
          }
          if (totalMeetingFeePaid === 0) {
            document.getElementById('success_kitty_amount').textContent = totalMeetingFeePaid.toFixed(2);
          } else {
            document.getElementById('success_kitty_amount').innerHTML = `${totalMeetingFeePaid.toFixed(2)} <span style="color: green;">(inc. opening balance ${meeting_opening_balance.toFixed(2)})</span>`;
          }
        }
        // document.getElementById('total-kitty-amount').textContent = (meeting_payable_amount + (meeting_payable_amount * 0.18));
        // if (meeting_opening_balance === 0) {
        //   document.getElementById('success_kitty_amount').textContent = totalMeetingFeePaid;
        //   document.getElementById('pending_payment_amount').textContent = currentBalance;
        // } else {
        //   if (currentBalance === 0) {
        //     document.getElementById('pending_payment_amount').textContent = currentBalance;
        //   } else {
        //     document.getElementById('pending_payment_amount').innerHTML = `${currentBalance} <span style="color: green;">(inc. opening balance ${meeting_opening_balance})</span>`;
        //   }
        //   if (totalMeetingFeePaid === 0) {
        //     document.getElementById('success_kitty_amount').textContent = totalMeetingFeePaid;
        //   } else {
        //     document.getElementById('success_kitty_amount').innerHTML = `${totalMeetingFeePaid} <span style="color: green;">(inc. opening balance ${meeting_opening_balance})</span>`;
        //   }
        // }
      }

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
  } else {
    // alert('No chapter payment details found for the logged-in user.');
    document.getElementById('total-kitty-amount').textContent = 'No Bill Raised Ever.';
    document.querySelector('.description').innerHTML = '-';
    document.getElementById('billType').textContent = '-';
    document.getElementById('tot_weeks').textContent = '-';
    let currentBalance= meeting_opening_balance;
    let totalMeetingFeePaid= 0;
    const ledgerData = [
      {
        sNo: 1,
        date: formatDate(userData.member_induction_date),//needwtf
        description: 'Opening Balance',
        debit: meeting_opening_balance,
        credit: 0,
        balance: meeting_opening_balance, // Display opening balance here
        balanceColor: 'red', // Set balance color to red
      },
      
    ];
    // document.getElementById('total-kitty-amount').textContent = (meeting_payable_amount + (meeting_payable_amount * 0.18)).toFixed(2);
        if (meeting_opening_balance === 0) {
          document.getElementById('success_kitty_amount').textContent = totalMeetingFeePaid.toFixed(2);
          document.getElementById('pending_payment_amount').textContent = currentBalance.toFixed(2);
        } else {
          if (currentBalance === 0) {
            document.getElementById('pending_payment_amount').textContent = currentBalance.toFixed(2);
          } else {
            document.getElementById('pending_payment_amount').innerHTML = `${currentBalance.toFixed(2)} <span style="color: green;">(inc. opening balance ${meeting_opening_balance.toFixed(2)})</span>`;
          }
          if (totalMeetingFeePaid === 0) {
            document.getElementById('success_kitty_amount').textContent = totalMeetingFeePaid.toFixed(2);
          } else {
            document.getElementById('success_kitty_amount').innerHTML = `${totalMeetingFeePaid.toFixed(2)} <span style="color: green;">(inc. opening balance ${meeting_opening_balance.toFixed(2)})</span>`;
          }
        }
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


  // 
  

} catch (error) {
  console.error('Error generating ledger:', error);
  alert('An error occurred while generating the ledger.');
} finally {
  hideLoader(); // Hide loader
}

})();