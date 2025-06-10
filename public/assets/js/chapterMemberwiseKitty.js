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
      fetch('https://backend.bninewdelhi.com/api/allOrders').then(res => res.json()),
      fetch('https://backend.bninewdelhi.com/api/allTransactions').then(res => res.json()),
      fetch('https://backend.bninewdelhi.com/api/getbankOrder').then(res => res.json()),
      fetch('https://backend.bninewdelhi.com/api/getKittyPayments').then(res => res.json()),
      fetch('https://backend.bninewdelhi.com/api/members').then(res => res.json()),
      fetch('https://backend.bninewdelhi.com/api/getAllMemberCredit').then(res => res.json()),
      fetch('https://backend.bninewdelhi.com/api/chapters').then(res => res.json())
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
            chapterId: loggedInChapter.chapter_id,
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
          const today = new Date();
          // Find the kitty bill for this member's chapter
          const kittyBill = activeBill.find(bill => bill.chapter_id === member.chapterId);

          let latePaymentCount = 0;
          if (kittyBill) {
            const dueDate = new Date(kittyBill.kitty_due_date);
            console.log(`Member: ${member.memberName}, Chapter: ${member.chapterName}, Today's date: ${today.toISOString()}, Kitty Due Date: ${kittyBill.kitty_due_date}`);
            if (today > dueDate) {
              console.log(`⚠️ Late payment detected for ${member.memberName} (chapter ${member.chapterName}) - Due date has passed`);
              latePaymentCount = 1;
            } else {
              console.log(`✅ Payment on time for ${member.memberName} (chapter ${member.chapterName})`);
            }
          } else {
            console.log(`❓ No kitty bill found for chapter: ${member.chapterName} (chapter_id: ${member.chapterId})`);
          }

          // Check for meeting opening balance directly from members data
          const memberData = members.find(m => m.member_id === member.memberId);
          console.log(`🔍 Checking meeting opening balance for ${member.memberName}:`, {
            memberId: member.memberId,
            openingBalance: memberData ? memberData.meeting_opening_balance : 'No member data found'
          });
          
          if (memberData && parseFloat(memberData.meeting_opening_balance) > 0) {
            console.log(`⚠️ Meeting opening balance > 0 for ${member.memberName} - Setting latePaymentCount to 1`);
            latePaymentCount = 1;
          } else {
            console.log(`✅ Meeting opening balance check passed for ${member.memberName}`);
          }

          return `
            <tr>
              <td style="border: 1px solid lightgrey; text-align: center;"><strong>${index + 1}</strong></td>
              <td style="border: 1px solid lightgrey; text-align: center;"><strong>${member.chapterName}</strong></td>
              <td style="border: 1px solid lightgrey; text-align: center;"><strong>${member.memberName}</strong></td>
              <td style="border: 1px solid lightgrey; text-align: center;">
  <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
    <strong>₹ ${formatInIndianStyle(member.pendingAmount)}</strong>
    <span 
      onclick="sendReminder(${member.memberId}, event)" 
      style="
        color: #00b894;
        font-size: 0.8rem;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s ease;
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 4px;
      "
      onmouseover="this.style.color='#00a884';this.style.textDecoration='underline'"
      onmouseout="this.style.color='#00b894';this.style.textDecoration='none'"
    >
      <i class="ri-notification-3-line" style="font-size: 0.9rem;"></i>
      Remind
    </span>
  </div>
</td>
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
"https://backend.bninewdelhi.com/api/getAllMemberWriteOff"
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

// Add sorting state tracking
const sortState = {};

// Add sorting functionality
document.addEventListener('DOMContentLoaded', function() {
  const tableHeaders = document.querySelectorAll('.sortable');
  
  tableHeaders.forEach(header => {
    header.addEventListener('click', function() {
      // Get the column index
      const columnIndex = Array.from(this.parentNode.children).indexOf(this);
      
      // Toggle sort direction
      if (!sortState[columnIndex]) {
        sortState[columnIndex] = 'asc';
      } else {
        sortState[columnIndex] = sortState[columnIndex] === 'asc' ? 'desc' : 'asc';
      }

      // Remove active class from all headers
      tableHeaders.forEach(h => {
        h.classList.remove('asc', 'desc');
        h.querySelector('.sort-icon').className = 'ti ti-arrows-sort sort-icon';
      });

      // Add active class to current header
      this.classList.add(sortState[columnIndex]);
      this.querySelector('.sort-icon').className = 
        sortState[columnIndex] === 'asc' ? 
        'ti ti-sort-ascending sort-icon' : 
        'ti ti-sort-descending sort-icon';

      // Call sorting function with current direction
      sortTable(columnIndex, sortState[columnIndex] === 'asc');
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

async function sendReminder(memberId, event) {
  // Store the element reference at the start
  const reminderElement = event.currentTarget;
  
  try {
    // Show loading state
    const originalContent = reminderElement.innerHTML;
    reminderElement.innerHTML = '<i class="ri-loader-4-line animate-spin"></i> Sending...';
    reminderElement.style.pointerEvents = 'none'; // Disable clicking while sending

    // Call the API
    const response = await fetch('https://backend.bninewdelhi.com/api/sendKittyReminder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ member_id: memberId })
    });

    const data = await response.json();

    if (response.ok) {
      // Show success message
      Swal.fire({
        title: 'Reminder Sent!',
        text: 'Payment reminder has been sent successfully.',
        icon: 'success',
        confirmButtonColor: '#00b894',
        timer: 2000,
        showConfirmButton: false
      });
    } else {
      throw new Error(data.message || 'Failed to send reminder');
    }

  } catch (error) {
    console.error('Error sending reminder:', error);
    // Show error message
    Swal.fire({
      title: 'Error!',
      text: error.message || 'Failed to send reminder. Please try again.',
      icon: 'error',
      confirmButtonColor: '#00b894'
    });
  } finally {
    // Use the stored element reference instead of accessing event.currentTarget
    reminderElement.innerHTML = `
      <i class="ri-notification-3-line" style="font-size: 0.9rem;"></i>
      Remind
    `;
    reminderElement.style.pointerEvents = 'auto'; // Re-enable clicking
  }
}

// Add event listener for the send reminder to all button
document.addEventListener('DOMContentLoaded', function() {
  const sendReminderBtn = document.getElementById('send-reminder-btn');
  if (sendReminderBtn) {
    sendReminderBtn.addEventListener('click', async function() {
      try {
        // Get all member IDs from the table
        const tableRows = document.querySelectorAll('#paymentsTableBody tr');
        const memberIds = Array.from(tableRows).map(row => {
          // The member ID is stored in the onclick attribute of the remind button
          const remindButton = row.querySelector('[onclick^="sendReminder"]');
          if (remindButton) {
            const match = remindButton.getAttribute('onclick').match(/sendReminder\((\d+)/);
            return match ? parseInt(match[1]) : null;
          }
          return null;
        }).filter(id => id !== null);

        if (memberIds.length === 0) {
          Swal.fire({
            title: 'No Members Found',
            text: 'There are no members to send reminders to.',
            icon: 'warning',
            confirmButtonColor: '#dc3545'
          });
          return;
        }

        // Show confirmation dialog
        const result = await Swal.fire({
          title: 'Send Reminders to All?',
          text: `Are you sure you want to send reminders to ${memberIds.length} members?`,
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#dc3545',
          cancelButtonColor: '#6c757d',
          confirmButtonText: 'Yes, send reminders',
          cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
          // Show loading state
          const originalContent = this.innerHTML;
          this.innerHTML = '<i class="ti ti-loader-2 animate-spin me-1"></i>Sending...';
          this.disabled = true;

          // Call the API
          const response = await fetch('https://backend.bninewdelhi.com/api/sendKittyReminderToAll', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ member_ids: memberIds })
          });

          const data = await response.json();

          if (response.ok) {
            // Show success message with details
            const successfulReminders = data.results.filter(r => r.success);
            const failedReminders = data.results.filter(r => !r.success);
            
            // Group failed reminders by reason
            const failureReasons = failedReminders.reduce((acc, curr) => {
              const reason = curr.message || 'Unknown reason';
              acc[reason] = (acc[reason] || 0) + 1;
              return acc;
            }, {});
            // Create detailed failure message
            const failureDetails = Object.entries(failureReasons)
              .map(([reason, count]) => `<li>❌ ${count} failed: ${reason}</li>`)
              .join('');

            Swal.fire({
              title: 'Reminders Sent!',
              html: `
                <div style="text-align: left;">
                  <p>Processed ${memberIds.length} reminders:</p>
                  <ul style="list-style: none; padding-left: 0;">
                    <li>✅ ${successfulReminders.length} successful</li>
                    ${failureDetails}
                  </ul>
                </div>
              `,
              icon: 'success',
              confirmButtonColor: '#dc3545',
              width: '600px'
            });
          } else {
            throw new Error(data.message || 'Failed to send reminders');
          }
        }
      } catch (error) {
        console.error('Error sending reminders:', error);
        Swal.fire({
          title: 'Error!',
          text: error.message || 'Failed to send reminders. Please try again.',
          icon: 'error',
          confirmButtonColor: '#dc3545'
        });
      } finally {
        // Reset button state
        this.innerHTML = '<i class="ti ti-bell-ringing me-1"></i>Send Reminder to All';
        this.disabled = false;
      }
    });
  }
});
