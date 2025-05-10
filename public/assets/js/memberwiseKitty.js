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

// Add pagination variables at the top
let currentPage = 1;
const entriesPerPage = 25;
let totalPages = 0;

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
    console.log('🚀 Starting fetchMemberWiseKitty with:', {
      selectedRegionId,
      selectedChapterId
    });

    const [orders, transactions, bankOrders, activeBill, members, credits, chapters] = await Promise.all([
      fetch('https://backend.bninewdelhi.com/api/allOrders').then(res => res.json()),
      fetch('https://backend.bninewdelhi.com/api/allTransactions').then(res => res.json()),
      fetch('https://backend.bninewdelhi.com/api/getbankOrder').then(res => res.json()),
      fetch('https://backend.bninewdelhi.com/api/getKittyPayments').then(res => res.json()),
      fetch('https://backend.bninewdelhi.com/api/members').then(res => res.json()),
      fetch('https://backend.bninewdelhi.com/api/getAllMemberCredit').then(res => res.json()),
      fetch('https://backend.bninewdelhi.com/api/chapters').then(res => res.json())
    ]);

    console.log('✅ All data fetched successfully');

    // Calculate total pending amount based on selected chapter
    let totalPendingAmount = 0;
    const relevantBankOrders = selectedChapterId 
      ? bankOrders.filter(order => order.chapter_id === parseInt(selectedChapterId))
      : bankOrders;

    console.log('📊 Calculating pending amount for:', {
      totalOrders: bankOrders.length,
      filteredOrders: relevantBankOrders.length,
      selectedChapter: selectedChapterId
    });

    relevantBankOrders.forEach(order => {
      if (order.amount_to_pay > 0) {
        totalPendingAmount += parseFloat(order.amount_to_pay);
      }
    });

    // Calculate total received amount based on selected chapter
    let allReceived = 0;

    // First get relevant members based on chapter
    const relevantMembers = selectedChapterId 
        ? bankOrders.filter(order => order.chapter_id === parseInt(selectedChapterId))
            .map(order => order.member_id)
        : bankOrders.map(order => order.member_id);

    console.log('🔍 Processing members:', relevantMembers);

    // Calculate total received for these members
    relevantMembers.forEach(memberId => {
        // Find all kitty payment orders for this member
        const memberOrders = orders.filter(o => 
            o.customer_id === memberId && 
            o.universal_link_id === 4
        );

        console.log(`📊 Found orders for member ${memberId}:`, memberOrders);

        // Process each order's transactions
        memberOrders.forEach(memberOrder => {
            const orderTransactions = transactions.filter(trans => 
                trans.order_id === memberOrder.order_id && 
                trans.payment_status === 'SUCCESS'
            );

            orderTransactions.forEach(trans => {
                const amount = parseFloat(trans.payment_amount);
                allReceived += amount;
                console.log(`💰 Adding transaction: ${formatInIndianStyle(amount)}`);
            });
        });
    });

    // Remove GST from total received amount and round off
    const totalReceivedWithoutGST = Math.round((allReceived / 118) * 100);

    console.log('📈 Final calculations:', {
      totalPending: formatInIndianStyle(totalPendingAmount),
      totalReceivedWithGST: formatInIndianStyle(allReceived),
      totalReceivedWithoutGST: formatInIndianStyle(totalReceivedWithoutGST),
      rawAmount: allReceived,
      calculation: `${allReceived} / 118 * 100 = ${totalReceivedWithoutGST}`
    });

    // Update UI with calculated totals (now showing rounded amount without GST)
    document.querySelector('#totalKittyDetails').textContent = `₹ ${formatInIndianStyle(totalPendingAmount)}`;
    document.querySelector('#total_V_amount').textContent = `₹ ${formatInIndianStyle(totalReceivedWithoutGST)}`;

    // Continue with existing member filtering and table population
    const filteredMembers = bankOrders
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

    // Calculate pagination
    totalPages = Math.ceil(filteredMembers.length / entriesPerPage);
    const start = (currentPage - 1) * entriesPerPage;
    const end = Math.min(start + entriesPerPage, filteredMembers.length);
    const paginatedMembers = filteredMembers.slice(start, end);

    // Update pagination info
    document.getElementById('startEntry').textContent = filteredMembers.length ? start + 1 : 0;
    document.getElementById('endEntry').textContent = end;
    document.getElementById('totalEntries').textContent = filteredMembers.length;

    // Populate the table
    const tableBody = document.getElementById('paymentsTableBody');
    if (tableBody) {
      const tableContent = paginatedMembers
        .map((member, index) => {
          const bankOrder = bankOrders.find(order => order.member_id === member.memberId);
          const latePaymentCount = bankOrder ? bankOrder.no_of_late_payment : 0;

          return `
            <tr>
              <td style="border: 1px solid lightgrey; text-align: center;"><strong>${start + index + 1}</strong></td>
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

      // Update pagination controls
      const paginationContainer = document.querySelector('.pagination');
      if (paginationContainer) {
        let paginationHTML = `
          <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="javascript:void(0);" onclick="changePage(${currentPage - 1})">Previous</a>
          </li>
        `;

        for (let i = 1; i <= totalPages; i++) {
          paginationHTML += `
            <li class="page-item ${currentPage === i ? 'active' : ''}">
              <a class="page-link" href="javascript:void(0);" onclick="changePage(${i})">${i}</a>
            </li>
          `;
        }

        paginationHTML += `
          <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="javascript:void(0);" onclick="changePage(${currentPage + 1})">Next</a>
          </li>
        `;

        paginationContainer.innerHTML = paginationHTML;
      }
    }

  } catch (error) {
    console.error('❌ Error in fetchMemberWiseKitty:', error);
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

// Function to handle page changes
function changePage(newPage) {
  if (newPage >= 1 && newPage <= totalPages) {
    currentPage = newPage;
    fetchMemberWiseKitty();
  }
}

// Add event listener for the reset filters button
document.getElementById('reset-filters-btn').addEventListener('click', () => {
  currentPage = 1; // Reset to first page
  selectedRegionId = null;
  selectedChapterId = null;
  document.querySelector('.region-button').textContent = 'Choose Region';
  document.querySelector('.chapter-button').textContent = 'Choose Chapter';
  fetchMemberWiseKitty();
});

