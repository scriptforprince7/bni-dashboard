document.addEventListener("DOMContentLoaded", () => {
  populateRegionFilter(); // Populate region filter
  fetchMemberWiseKitty(); // Call fetchMemberWiseKitty when the document is loaded
});

function formatInIndianStyle(number) {
  return new Intl.NumberFormat('en-IN').format(number);
}

let allMembers = []; // Store all members globally
let filteredMembers = []; // Store filtered members after region/chapter filtering
let totalKittyAmount = 0;
let totalReceivedAmount = 0;

let selectedRegionId = null;
let selectedChapterId = null;

// Function to show loader
function showLoader() {
  document.getElementById('loader').style.display = 'flex';
}

// Function to hide loader
function hideLoader() {
  document.getElementById('loader').style.display = 'none';
}

async function fetchMemberWiseKitty() {
  try {
    console.log('🚀 Fetching member-wise kitty data...');

    const [orders, transactions, bankOrders, activeBill, members, credits, chapters] = await Promise.all([
      fetch('https://backend.bninewdelhi.com/api/allOrders').then(res => res.json()),
      fetch('https://backend.bninewdelhi.com/api/allTransactions').then(res => res.json()),
      fetch('https://backend.bninewdelhi.com/api/getbankOrder').then(res => res.json()),
      fetch('https://backend.bninewdelhi.com/api/getKittyPayments').then(res => res.json()),
      fetch('https://backend.bninewdelhi.com/api/members').then(res => res.json()),
      fetch('https://backend.bninewdelhi.com/api/getAllMemberCredit').then(res => res.json()),
      fetch('https://backend.bninewdelhi.com/api/chapters').then(res => res.json())
    ]);

    console.log('✅ Data fetched successfully');

    // Filter members based on selected filters
    const membersWithPending = bankOrders
      .filter(order => {
        if (selectedRegionId && selectedChapterId) {
          const chapter = chapters.find(ch => ch.chapter_id === order.chapter_id);
          return order.amount_to_pay > 0 && 
                 chapter && 
                 chapter.region_id === parseInt(selectedRegionId) && 
                 chapter.chapter_id === parseInt(selectedChapterId);
        }
        return order.amount_to_pay > 0;
      })
      .map(order => {
        const member = members.find(m => m.member_id === order.member_id);
        const memberCredit = credits.find(credit => credit.member_id === order.member_id);
        const chapter = chapters.find(ch => ch.chapter_id === order.chapter_id);
        
        console.log(`🏢 Found chapter for member:`, {
          memberId: order.member_id,
          chapterId: order.chapter_id,
          chapterName: chapter ? chapter.chapter_name : 'Unknown Chapter'
        });
        
        if (member) {
          // Find all orders for this member
          const memberOrders = orders.filter(o => 
            o.customer_id === order.member_id && 
            o.universal_link_id === 4
          );
          
          console.log(`🔍 Found orders for member ${member.member_first_name}:`, memberOrders);

          // Get all successful transactions for member's orders
          let totalPaid = 0;
          let lastPayment = null;
          let lastPaymentDate = null;

          memberOrders.forEach(memberOrder => {
            const orderTransactions = transactions.filter(trans => 
              trans.order_id === memberOrder.order_id && 
              trans.payment_status === 'SUCCESS'
            );

            orderTransactions.forEach(trans => {
              const paymentAmount = parseFloat(trans.payment_amount);
              totalPaid += paymentAmount;

              // Check for last payment
              const transactionDate = new Date(trans.payment_completion_time || trans.payment_time);
              if (!lastPaymentDate || transactionDate > lastPaymentDate) {
                lastPaymentDate = transactionDate;
                lastPayment = paymentAmount;
              }
            });
          });

          console.log(`💰 Payment summary for ${member.member_first_name}:`, {
            totalPaid: formatInIndianStyle(totalPaid),
            lastPayment: lastPayment ? formatInIndianStyle(lastPayment) : 'No payments',
            lastPaymentDate: lastPaymentDate ? lastPaymentDate.toLocaleDateString() : 'N/A'
          });

          return {
            memberId: member.member_id,
            memberName: `${member.member_first_name} ${member.member_last_name}`,
            chapterName: chapter ? chapter.chapter_name : 'Unknown Chapter',
            pendingAmount: order.amount_to_pay,
            creditAmount: memberCredit ? memberCredit.credit_amount : 0,
            totalPaid: totalPaid,
            lastPayment: lastPayment
          };
        }
        return null;
      })
      .filter(Boolean);

    console.log('👥 Filtered members count:', membersWithPending.length);

    // Populate the table
    const tableBody = document.getElementById('paymentsTableBody');
    if (tableBody) {
      const tableContent = membersWithPending
        .slice(0, 3)
        .map((member, index) => {
          const bankOrder = bankOrders.find(order => order.member_id === member.memberId);
          const latePaymentCount = bankOrder ? bankOrder.no_of_late_payment : 0;

          return `
            <tr>
              <td style="border: 1px solid lightgrey; text-align: center;"><strong>${index + 1}</strong></td>
              <td style="border: 1px solid lightgrey; text-align: center;"><strong>${member.chapterName}</strong></td>
              <td style="border: 1px solid lightgrey; text-align: center;"><strong>${member.memberName}</strong></td>
              <td style="border: 1px solid lightgrey; text-align: center;"><strong>₹ ${formatInIndianStyle(member.pendingAmount)}</strong></td>
              <td style="border: 1px solid lightgrey; text-align: center;"><strong>${member.lastPayment ? '₹ ' + formatInIndianStyle(member.lastPayment) : '-'}</strong></td>
              <td style="border: 1px solid lightgrey; text-align: center;"><strong>₹ ${formatInIndianStyle(member.totalPaid)}</strong></td>
              <td style="border: 1px solid lightgrey; text-align: center;"><strong>₹ ${formatInIndianStyle(member.creditAmount)}</strong></td>
              <td style="border: 1px solid lightgrey; text-align: center;"><strong>${latePaymentCount}</strong></td>
            </tr>
          `;
        }).join('');

      tableBody.innerHTML = tableContent;
      console.log('📊 Table populated with chapter names');
    }

    // Calculate total kitty amount from active bill
    const totalActiveBillAmount = activeBill.reduce((sum, bill) => {
      return sum + parseFloat(bill.total_bill_amount);
    }, 0);
    console.log('💰 Total Active Bill Amount:', formatInIndianStyle(totalActiveBillAmount));
    document.querySelector('#totalKittyDetails').textContent = `₹ ${formatInIndianStyle(Math.ceil(totalActiveBillAmount))}`;

    // Calculate total received amount
    let allReceived = 0;
    orders.forEach(order => {
      // Find successful transactions for meeting payments
      const orderTransactions = transactions.filter(trans => 
        trans.order_id === order.order_id && 
        trans.payment_status === 'SUCCESS' &&
        (order.payment_note === "meeting-payments" || order.payment_note === "meeting-payments-opening-only")
      );

      // Calculate amount after GST deduction
      orderTransactions.forEach(trans => {
        const amount = Math.ceil(parseFloat(trans.payment_amount) - ((parseFloat(trans.payment_amount)*18) / 118));
        console.log('💵 Transaction Amount after GST deduction:', formatInIndianStyle(amount));
        allReceived += amount;
      });
    });

    // Calculate total pending amount from bank orders
    let totalPendingAmount = 0;
    bankOrders.forEach(order => {
      if (order.amount_to_pay > 0) {
        totalPendingAmount += parseFloat(order.amount_to_pay);
      }
    });

    console.log('💰 Total Received Amount:', formatInIndianStyle(allReceived));
    console.log('💰 Total Pending Amount:', formatInIndianStyle(totalPendingAmount));
    
    document.querySelector('#total_V_amount').textContent = `₹ ${formatInIndianStyle(allReceived)}`;
    document.querySelector('#totalKittyDetails').textContent = `₹ ${formatInIndianStyle(totalPendingAmount)}`;

  } catch (error) {
    console.error('❌ Error fetching member-wise kitty data:', error);
  }
}

// Function to populate region filter dropdown
function populateRegionFilter() {
  try {
    const regionFilter = document.getElementById('region-filter');
    if (!regionFilter) {
      console.error('Region filter element not found');
      return;
    }

    fetch('https://backend.bninewdelhi.com/api/regions')
      .then(res => res.json())
      .then(regions => {
        console.log('🌍 Fetched regions:', regions);
        regionFilter.innerHTML = '';
        regions.forEach(region => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.classList.add('dropdown-item');
          a.href = '#';
          a.textContent = region.region_name;
          a.dataset.id = region.region_id;
          a.addEventListener('click', handleRegionSelection);
          li.appendChild(a);
          regionFilter.appendChild(li);
        });
      });
  } catch (error) {
    console.error('❌ Error populating region filter:', error);
  }
}

// Function to populate chapter filter based on selected region
function populateChapterFilter(regionId) {
  try {
    const chapterFilter = document.getElementById('chapter-filter');
    if (!chapterFilter) {
      console.error('Chapter filter element not found');
      return;
    }

    fetch('https://backend.bninewdelhi.com/api/chapters')
      .then(res => res.json())
      .then(chapters => {
        console.log('🏢 Fetched all chapters:', chapters);
        
        // Filter chapters by selected region
        const filteredChapters = chapters.filter(chapter => chapter.region_id === parseInt(regionId));
        console.log('🔍 Chapters for region', regionId, ':', filteredChapters);

        chapterFilter.innerHTML = '';
        filteredChapters.forEach(chapter => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.classList.add('dropdown-item');
          a.href = '#';
          a.textContent = chapter.chapter_name;
          a.dataset.id = chapter.chapter_id;
          a.addEventListener('click', handleChapterSelection);
          li.appendChild(a);
          chapterFilter.appendChild(li);
        });
      });
  } catch (error) {
    console.error('❌ Error populating chapter filter:', error);
  }
}

// Update region selection handler
function handleRegionSelection(event) {
  selectedRegionId = event.target.dataset.id;
  console.log('🎯 Selected region:', selectedRegionId);
  
  // Update region button text
  const regionButton = document.querySelector('.region-button');
  regionButton.textContent = event.target.textContent;
  
  // Reset chapter selection
  selectedChapterId = null;
  const chapterButton = document.querySelector('.chapter-button');
  chapterButton.textContent = 'Choose Chapter';
  
  // Populate chapter filter with chapters from selected region
  populateChapterFilter(selectedRegionId);
}

// Add chapter selection handler
function handleChapterSelection(event) {
  selectedChapterId = event.target.dataset.id;
  console.log('🎯 Selected chapter:', selectedChapterId);
  
  // Update chapter button text
  const chapterButton = document.querySelector('.chapter-button');
  chapterButton.textContent = event.target.textContent;
  
  // Now that we have both region and chapter, filter the table
  if (selectedRegionId && selectedChapterId) {
    console.log('🔍 Filtering table with:', {
      regionId: selectedRegionId,
      chapterId: selectedChapterId
    });
    fetchMemberWiseKitty();
  }
}

// Add reset filters functionality
document.getElementById('reset-filters-btn').addEventListener('click', () => {
  console.log('🔄 Resetting filters');
  selectedRegionId = null;
  selectedChapterId = null;
  
  // Reset button texts
  document.querySelector('.region-button').textContent = 'Choose Region';
  document.querySelector('.chapter-button').textContent = 'Choose Chapter';
  
  // Refresh table without filters
  fetchMemberWiseKitty();
});
