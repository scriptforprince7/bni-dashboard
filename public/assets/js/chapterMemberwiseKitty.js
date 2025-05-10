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

    // Check login type
    const loginType = getUserLoginType();
    console.log('👤 User login type:', loginType);

    // Get the appropriate email based on login type
    let chapterEmail;
    let chapterId;

    if (loginType === 'ro_admin') {
      chapterEmail = localStorage.getItem('current_chapter_email');
      chapterId = localStorage.getItem('current_chapter_id');
      console.log('🔑 RO Admin accessing chapter:', {
        email: chapterEmail,
        id: chapterId
      });
    } else {
      chapterEmail = getUserEmail();
      console.log('👤 Chapter user email:', chapterEmail);
    }

    if (!chapterEmail && !chapterId) {
      console.error('❌ No chapter access details found');
      return;
    }

    const [orders, transactions, bankOrders, activeBill, members, credits, chapters] = await Promise.all([
      fetch('http://localhost:5000/api/allOrders').then(res => res.json()),
      fetch('http://localhost:5000/api/allTransactions').then(res => res.json()),
      fetch('http://localhost:5000/api/getbankOrder').then(res => res.json()),
      fetch('http://localhost:5000/api/getKittyPayments').then(res => res.json()),
      fetch('http://localhost:5000/api/members').then(res => res.json()),
      fetch('http://localhost:5000/api/getAllMemberCredit').then(res => res.json()),
      fetch('http://localhost:5000/api/chapters').then(res => res.json())
    ]);

    console.log('✅ Data fetched successfully');

    // Find chapter details based on login type
    let loggedInChapter;
    if (loginType === 'ro_admin') {
      loggedInChapter = chapters.find(ch => ch.chapter_id === parseInt(chapterId));
      console.log('🏢 RO Admin viewing chapter:', loggedInChapter);
    } else {
      loggedInChapter = chapters.find(ch =>
        ch.email_id === chapterEmail ||
        ch.vice_president_mail === chapterEmail ||
        ch.president_mail === chapterEmail ||
        ch.treasurer_mail === chapterEmail
      );
      console.log('🏢 Chapter details:', loggedInChapter);
    }

    if (!loggedInChapter) {
      console.error('❌ No matching chapter found');
      return;
    }

    // Filter members based on logged in chapter
    const membersWithPending = bankOrders
      .filter(order => {
        // Only show entries for logged in chapter
        return order.amount_to_pay > 0 && order.chapter_id === loggedInChapter.chapter_id;
      })
      .map(order => {
        const member = members.find(m => m.member_id === order.member_id);
        const memberCredit = credits.find(credit => credit.member_id === order.member_id);
        
        console.log(`🔍 Processing member for chapter ${loggedInChapter.chapter_name}:`, {
          memberId: order.member_id,
          memberName: member ? `${member.member_first_name} ${member.member_last_name}` : 'Unknown Member',
          chapterId: order.chapter_id
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

          console.log(`💰 Payment details for member ${member.member_first_name}:`, {
            totalPaid: formatInIndianStyle(totalPaid),
            lastPayment: lastPayment ? formatInIndianStyle(lastPayment) : 'No payments',
            pendingAmount: formatInIndianStyle(order.amount_to_pay)
          });

          return {
            memberId: member.member_id,
            memberName: `${member.member_first_name} ${member.member_last_name}`,
            chapterName: loggedInChapter.chapter_name,
            pendingAmount: order.amount_to_pay,
            creditAmount: memberCredit ? memberCredit.credit_amount : 0,
            totalPaid: totalPaid,
            lastPayment: lastPayment
          };
        }
        return null;
      })
      .filter(Boolean);

    console.log(`📊 Found ${membersWithPending.length} members with pending payments for chapter ${loggedInChapter.chapter_name}`);

    // Populate the table
    const tableBody = document.getElementById('paymentsTableBody');
    if (tableBody) {
      const tableContent = membersWithPending
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
      console.log('✅ Table populated with chapter-specific entries');
    }

    // Fetch write-off data
const writeoffResponse = await fetch(
"http://localhost:5000/api/getAllMemberWriteOff"
);
const writeoffData = await writeoffResponse.json();

let totalWriteoffAmount = 0;
writeoffData.forEach((writeoff) => {
if (parseInt(writeoff.chapter_id) === parseInt(chapterId)) {
  totalWriteoffAmount += parseFloat(writeoff.total_pending_amount || 0);
}
});

console.log("Total write-off amount calculated:", totalWriteoffAmount);

// Calculate total pending amount from bank orders
let totalPendingAmount = 0;
bankOrders.forEach(order => {
if (
  parseFloat(order.amount_to_pay || 0) > 0 &&
  parseInt(order.chapter_id) === parseInt(loggedInChapter.chapter_id)
) {
  totalPendingAmount += parseFloat(order.amount_to_pay);
}
});

// Subtract total write-off
// totalPendingAmount -= totalWriteoffAmount;

console.log('💰 Total Pending Amount for chapter:', {
chapterId: loggedInChapter.chapter_id,
chapterName: loggedInChapter.chapter_name,
totalPending: formatInIndianStyle(totalPendingAmount)
});

document.querySelector('#totalKittyDetails').textContent = `₹ ${formatInIndianStyle(totalPendingAmount)}`;

    



    // Calculate total received amount
    let allReceived = 0;
    orders.forEach(order => {
      // Find successful transactions for meeting payments
      const orderTransactions = transactions.filter(trans => 
        trans.order_id === order.order_id && 
        trans.payment_status === 'SUCCESS' &&
        (order.payment_note === "meeting-payments" || order.payment_note === "meeting-payments-opening-only") &&
        order.chapter_id === loggedInChapter.chapter_id // ✅ Add this condition
      );
      

      // Calculate amount after GST deduction
      orderTransactions.forEach(trans => {
        const amount = Math.ceil(parseFloat(trans.payment_amount) - ((parseFloat(trans.payment_amount)*18) / 118));
        console.log('💵 Transaction Amount after GST deduction:', formatInIndianStyle(amount));
        allReceived += amount;
      });
    });

    console.log('💰 Total Received Amount:', formatInIndianStyle(allReceived));
    
    document.querySelector('#total_V_amount').textContent = `₹ ${formatInIndianStyle(allReceived)}`;

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

    fetch('http://localhost:5000/api/regions')
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

    fetch('http://localhost:5000/api/chapters')
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

// Add this function to handle table export
function exportTableToCSV() {
  // Get table data
  const tableRows = document.querySelectorAll('#paymentsTableBody tr');
  
  // Define headers
  const headers = [
    'S.No.',
    'Chapter Name',
    'Member Name',
    'Pending Amount',
    'Last Payment',
    'Total Paid',
    'Credit Amount',
    'Late Payment Count'
  ];

  // Create CSV content
  let csvContent = headers.join(',') + '\n';

  // Add table data
  tableRows.forEach(row => {
    const columns = row.querySelectorAll('td');
    const rowData = Array.from(columns).map(column => {
      // Remove ₹ symbol and commas from amounts
      let data = column.textContent.trim();
      data = data.replace('₹', '').replace(/,/g, '');
      // Wrap in quotes to handle any commas in text
      return `"${data}"`;
    });
    csvContent += rowData.join(',') + '\n';
  });

  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  // Set download attributes
  link.setAttribute('href', url);
  link.setAttribute('download', `chapter_kitty_report_${new Date().toLocaleDateString()}.csv`);
  link.style.visibility = 'hidden';
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Add event listener for export button
document.addEventListener('DOMContentLoaded', function() {
  const exportBtn = document.getElementById('exportTableBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportTableToCSV);
  }
});

// Add sorting functionality
document.addEventListener('DOMContentLoaded', function() {
  const tableHeaders = document.querySelectorAll('.sortable');
  
  tableHeaders.forEach(header => {
    header.addEventListener('click', function() {
      // Remove active class from all headers
      tableHeaders.forEach(h => {
        h.classList.remove('asc', 'desc');
        h.querySelector('.sort-icon').className = 'ti ti-arrows-sort sort-icon';
      });

      // Toggle sort direction
      if (this.classList.contains('asc')) {
        this.classList.remove('asc');
        this.classList.add('desc');
        this.querySelector('.sort-icon').className = 'ti ti-sort-descending sort-icon';
      } else {
        this.classList.remove('desc');
        this.classList.add('asc');
        this.querySelector('.sort-icon').className = 'ti ti-sort-ascending sort-icon';
      }

      // Get the column index
      const columnIndex = Array.from(this.parentNode.children).indexOf(this);
      
      // Call sorting function
      sortTable(columnIndex, this.classList.contains('asc'));
    });
  });
});

// Function to sort table data
function sortTable(columnIndex, ascending) {
  const table = document.querySelector('table');
  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));

  // Sort the rows
  rows.sort((a, b) => {
    const aValue = a.children[columnIndex].textContent.trim();
    const bValue = b.children[columnIndex].textContent.trim();

    // Special handling for S.No. column
    if (columnIndex === 0) {
      const aNum = parseInt(aValue);
      const bNum = parseInt(bValue);
      return ascending ? aNum - bNum : bNum - aNum;
    }

    // Handle currency values (columns with ₹ symbol)
    if (aValue.includes('₹') || bValue.includes('₹')) {
      const aNum = parseFloat(aValue.replace(/[₹,\s]/g, ''));
      const bNum = parseFloat(bValue.replace(/[₹,\s]/g, ''));
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return ascending ? aNum - bNum : bNum - aNum;
      }
    }

    // Handle numeric values without currency symbol
    const aNum = parseFloat(aValue.replace(/[^0-9.-]+/g, ''));
    const bNum = parseFloat(bValue.replace(/[^0-9.-]+/g, ''));
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return ascending ? aNum - bNum : bNum - aNum;
    }

    // For text values (like names), sort alphabetically
    return ascending ? 
      aValue.localeCompare(bValue) : 
      bValue.localeCompare(aValue);
  });

  // Reorder the rows in the table
  rows.forEach(row => tbody.appendChild(row));

  // Update S.No. column after sorting
  rows.forEach((row, index) => {
    row.children[0].innerHTML = `<strong>${index + 1}</strong>`;
  });
}

// Add styles for sorting
const style = document.createElement('style');
style.textContent = `
  .sortable {
    cursor: pointer;
    position: relative;
    user-select: none;
    transition: background-color 0.2s;
  }

  .sortable:hover {
    background-color: #f8f9fa;
  }

  .sort-icon {
    margin-left: 5px;
    font-size: 14px;
    opacity: 0.5;
    transition: opacity 0.2s;
  }

  .sortable:hover .sort-icon {
    opacity: 1;
  }

  .sortable.asc .sort-icon {
    opacity: 1;
    color: #6259ca;
  }

  .sortable.desc .sort-icon {
    opacity: 1;
    color: #6259ca;
    transform: rotate(180deg);
  }
`;
document.head.appendChild(style);
