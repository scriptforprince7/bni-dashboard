// Global variables
let memberData = null;
let kittyBills = [];
let allOrders = [];
let allTransactions = [];
let currentBalance = 0;
let allTransactionItems = [];
let memberCredits = [];

// Utility functions
function showLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'flex';
    }
}

function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'none';
    }
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(amount);
}

// Authentication functions
function getUserLoginType() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.login_type;
    } catch (e) {
        return null;
    }
}

function getUserEmail() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return null;
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.email;
    } catch (e) {
        return null;
    }
}

// Initialize filters
function initializeFilters() {
    // Year filter
    const yearFilter = document.getElementById('yearFilter');
    if (!yearFilter) return;

    const currentYear = new Date().getFullYear();
    
    // Add years from 2020 to current year
    for (let year = 2020; year <= currentYear; year++) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.className = 'dropdown-item';
        a.href = '#';
        a.dataset.value = year;
        a.textContent = year;
        li.appendChild(a);
        yearFilter.appendChild(li);
    }

    // Month filter
    const monthFilter = document.getElementById('monthFilter');
    if (!monthFilter) return;

    const months = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' }
    ];

    months.forEach(month => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.className = 'dropdown-item';
        a.href = '#';
        a.dataset.value = month.value;
        a.textContent = month.label;
        li.appendChild(a);
        monthFilter.appendChild(li);
    });

    // Setup filter event listeners
    setupFilterEventListeners();
}

function setupFilterEventListeners() {
    // Year filter
    const yearFilterBtn = document.getElementById('yearFilterBtn');
    if (yearFilterBtn) {
        document.querySelectorAll('#yearFilter .dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                yearFilterBtn.textContent = `Year: ${item.textContent}`;
                applyFilters();
            });
        });
    }

    // Month filter
    const monthFilterBtn = document.getElementById('monthFilterBtn');
    if (monthFilterBtn) {
        document.querySelectorAll('#monthFilter .dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                monthFilterBtn.textContent = `Month: ${item.textContent}`;
                applyFilters();
            });
        });
    }

    // Reset filters
    const resetFiltersBtn = document.getElementById('resetFilters');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            if (yearFilterBtn) yearFilterBtn.textContent = 'Year';
            if (monthFilterBtn) monthFilterBtn.textContent = 'Month';
            applyFilters();
        });
    }
}

function applyFilters() {
    const yearFilterBtn = document.getElementById('yearFilterBtn');
    const monthFilterBtn = document.getElementById('monthFilterBtn');
    if (!yearFilterBtn || !monthFilterBtn) return;

    const selectedYear = yearFilterBtn.textContent.split(': ')[1];
    const selectedMonth = monthFilterBtn.textContent.split(': ')[1];

    const filteredItems = allTransactionItems.filter(item => {
        const date = new Date(item.date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        if (selectedYear && selectedYear !== 'Year') {
            if (year !== parseInt(selectedYear)) return false;
        }
        if (selectedMonth && selectedMonth !== 'Month') {
            const monthIndex = months.findIndex(m => m.label === selectedMonth) + 1;
            if (month !== monthIndex) return false;
        }
        return true;
    });

    updateLedgerTable(filteredItems);
}

function updateLedgerTable(items) {
    const tbody = document.getElementById('ledger-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    items.forEach((item, index) => {
        const row = document.createElement('tr');
        // Determine color for debit, credit, and balance
        const debitColor = item.debit > 0 ? 'red' : '';
        const creditColor = item.credit > 0 ? 'green' : '';
        const balanceColor = item.runningBalance > 0 ? 'green' : (item.runningBalance < 0 ? 'red' : '');
        console.log('[LEDGER] Row', index + 1, 'type:', item.type, 'runningBalance:', item.runningBalance);
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><b>${formatDate(item.date)}</b></td>
            <td>${item.description}</td>
            <td><b>${formatCurrency(item.totalAmount)}</b></td>
            <td style="color:${debitColor}"><b>${item.debit ? formatCurrency(item.debit) : '-'}</b></td>
            <td style="color:${creditColor}"><b>${item.credit ? formatCurrency(item.credit) : '-'}</b></td>
            <td><b>${item.gst ? formatCurrency(item.gst) : '-'}</b></td>
            <td style="color:${balanceColor}"><b>${formatCurrency(item.runningBalance)}</b></td>
        `;
        tbody.appendChild(row);
    });

    // Update summary cards if they exist
    updateSummaryCards();
}

function updateSummaryCards() {
    // Calculate totals
    const totalKittyAmount = allTransactionItems
        .filter(item => item.type === 'kitty_bill')
        .reduce((sum, item) => sum + item.totalAmount, 0);

    const totalPaidAmount = allTransactionItems
        .filter(item => item.type === 'payment')
        .reduce((sum, item) => sum + Math.abs(item.totalAmount), 0);

    const totalGST = allTransactionItems
        .reduce((sum, item) => sum + Math.abs(item.gst), 0);

    const totalPenalties = allTransactionItems
        .filter(item => item.type === 'penalty')
        .reduce((sum, item) => sum + item.totalAmount, 0);

    const pendingAmount = totalKittyAmount - totalPaidAmount + totalPenalties;

    // Update the cards
    document.getElementById('total-kitty-amount').textContent = formatCurrency(totalKittyAmount);
    document.getElementById('success_kitty_amount').textContent = formatCurrency(totalPaidAmount);
    document.getElementById('pending_payment_amount').textContent = formatCurrency(pendingAmount);
    document.getElementById('total_credit_note_amount').textContent = formatCurrency(totalGST);
}

// Main initialization function
async function initializeMemberLedger() {
    try {
        showLoader();
        
        const loginType = getUserLoginType();
        console.log("Detected login type:", loginType);

        let memberId;
        let memberEmail;

        if (loginType === "ro_admin") {
            console.log("RO Admin detected, fetching from localStorage...");
            memberEmail = localStorage.getItem("current_member_email");
            memberId = parseInt(localStorage.getItem("current_member_id"));

            console.log("localStorage data found:", {
                email: memberEmail,
                id: memberId
            });

            if (!memberEmail || !memberId) {
                console.error("CRITICAL: Missing localStorage data for RO Admin");
                hideLoader();
                return;
            }

            // For RO admin, fetch member details from members API
            console.log('Fetching member details for RO admin...');
            const response = await fetch('https://backend.bninewdelhi.com/api/members');
            if (!response.ok) {
                throw new Error('Failed to fetch members list');
            }
            const members = await response.json();
            const member = members.find(m => m.member_id === memberId);
            
            if (!member) {
                console.error('Member not found in members list');
                toastr.error('Member not found');
                hideLoader();
                return;
            }
            
            memberData = member;
            console.log('Found member data:', memberData);

        } else {
            console.log("Regular member login detected, getting email from token...");
            memberEmail = getUserEmail();
            
            // Fetch member details to get member_id
            console.log('Fetching members data from API..');
            const response = await fetch('https://backend.bninewdelhi.com/api/members');
            if (!response.ok) {
                throw new Error('Failed to fetch member details');
            }
            const members = await response.json();
            console.log('Received members data:', members);
            console.log('Searching for member with email:', memberEmail);

            const member = members.find(m => m.member_email_address === memberEmail);
            if (member) {
                memberId = member.member_id;
                memberData = member;
                console.log('✅ Found matching member:', member);
                console.log('Retrieved member_id from API:', memberId);
            } else {
                console.error('❌ No member found matching email:', memberEmail);
                hideLoader();
                return;
            }
        }

        if (!memberId) {
            console.error("No member ID found from any source");
            hideLoader();
            return;
        }

        // Fetch kitty bills
        const kittyResponse = await fetch('https://backend.bninewdelhi.com/api/getAllKittyPayments');
        if (!kittyResponse.ok) {
            throw new Error('Failed to fetch kitty bills');
        }
        kittyBills = await kittyResponse.json();

        // Fetch all orders
        const ordersResponse = await fetch('https://backend.bninewdelhi.com/api/allOrders');
        if (!ordersResponse.ok) {
            throw new Error('Failed to fetch orders');
        }
        allOrders = await ordersResponse.json();

        // Fetch all transactions
        const transactionsResponse = await fetch('https://backend.bninewdelhi.com/api/allTransactions');
        if (!transactionsResponse.ok) {
            throw new Error('Failed to fetch transactions');
        }
        allTransactions = await transactionsResponse.json();

        // Fetch all member credits
        const creditsResponse = await fetch('https://backend.bninewdelhi.com/api/getAllMemberCredit');
        if (!creditsResponse.ok) {
            throw new Error('Failed to fetch member credits');
        }
        const allCredits = await creditsResponse.json();
        // Only credits for this member, this chapter, and is_adjusted true
        memberCredits = allCredits.filter(c => 
            c.member_id == memberId && 
            c.chapter_id == memberData.chapter_id && 
            c.is_adjusted === true
        );

        // Fetch chapters for prorated logic
        const chaptersResponse = await fetch('https://backend.bninewdelhi.com/api/chapters');
        if (!chaptersResponse.ok) {
            throw new Error('Failed to fetch chapters');
        }
        const allChapters = await chaptersResponse.json();
        window.allChaptersGlobal = allChapters;
        window.memberChapterGlobal = allChapters.find(ch => ch.chapter_id == memberData.chapter_id);
        const memberChapter = window.memberChapterGlobal;

        // Process and display transactions
        processTransactions();
        updateLedgerTable(allTransactionItems);
        initializeFilters();

        // After all data is fetched and processTransactions() is called
        // 1. Active Kitty Bill (sum of total_bill_amount for is_completed == false and chapter_id matches)
        const activeKittyBills = kittyBills.filter(bill => bill.is_completed === false && bill.chapter_id == memberData.chapter_id);
        const activeKittyAmount = activeKittyBills.reduce((sum, bill) => sum + parseFloat(bill.total_bill_amount), 0);
        document.getElementById('total-kitty-amount').textContent = formatCurrency(activeKittyAmount);

        // 2. Latest Bill Details (latest is_completed == false and chapter_id matches)
        if (activeKittyBills.length > 0) {
            // Get the latest by raised_on
            const latestBill = activeKittyBills.reduce((a, b) => new Date(a.raised_on) > new Date(b.raised_on) ? a : b);
            document.getElementById('billType').textContent = latestBill.bill_type;
            document.getElementById('tot_weeks').textContent = latestBill.total_weeks;
            document.querySelector('.description').textContent = latestBill.description;
            document.getElementById('due_date').textContent = formatDate(latestBill.kitty_due_date);
        }

        // 3. Total Paid Kitty Amount (sum of base amounts for all successful payments for this member)
        let paidBaseAmount = 0;
        allOrders.filter(order => order.universal_link_id === 4 && order.customer_id === memberData.member_id && order.payment_note === 'meeting-payments')
            .forEach(order => {
                const txn = allTransactions.find(t => t.order_id === order.order_id && t.payment_status === 'SUCCESS');
                if (txn) {
                    paidBaseAmount += parseFloat(order.order_amount) - parseFloat(order.tax);
                }
            });
        document.getElementById('success_kitty_amount').textContent = formatCurrency(paidBaseAmount);

        // 4. Pending Kitty Amount (last entry's running balance from the ledger)
        if (allTransactionItems.length > 0) {
            const lastBalance = allTransactionItems[allTransactionItems.length - 1].runningBalance;
            const pendingElem = document.getElementById('pending_payment_amount');
            let color = lastBalance < 0 ? 'red' : 'green';
            let html = `<span style='color:${color};'>${formatCurrency(lastBalance)}</span>`;
            if (lastBalance < 0) {
                // Build the Pay Now link with region_id, chapter_id, and member_id
                const regionId = memberData.region_id || '';
                const chapterId = memberData.chapter_id || '';
                const memberId = memberData.member_id || '';
                html += ` <a href='https://bninewdelhi.com/meeting-payment/4/2d4efe39-b134-4187-a5c0-4530125f5248/1?region_id=${regionId}&chapter_id=${chapterId}&member_id=${memberId}' target='_blank'><button id='pay-now-btn' class='btn btn-sm btn-danger' style='margin-left:8px;font-size:0.8em;padding:2px 8px;'>Pay Now</button></a>`;
            }
            pendingElem.innerHTML = html;
        }

        // 5. Total Credit Note Amount (sum of credit_amount for this member from getAllMemberCredit)
        const totalCreditAmount = (Array.isArray(memberCredits) ? memberCredits : []).reduce((sum, c) => sum + parseFloat(c.credit_amount), 0);
        document.getElementById('total_credit_note_amount').textContent = formatCurrency(totalCreditAmount);

        // Add popup for Total Paid Kitty Amount card
        document.getElementById('success_kitty_amount').style.cursor = 'pointer';
        document.getElementById('success_kitty_amount').onclick = function() {
            // Gather all paid bills for this member
            const paidBills = [];
            allOrders.filter(order => order.universal_link_id === 4 && order.customer_id === memberData.member_id && order.payment_note === 'meeting-payments')
                .forEach(order => {
                    const txn = allTransactions.find(t => t.order_id === order.order_id && t.payment_status === 'SUCCESS');
                    if (txn) {
                        const bill = kittyBills.find(b => b.kitty_bill_id === order.kitty_bill_id);
                        let modeOfPayment = '';
                        if (txn.payment_method) {
                            if (typeof txn.payment_method === 'string') {
                                try {
                                    const pm = JSON.parse(txn.payment_method);
                                    if (pm.upi) modeOfPayment = 'upi';
                                    else if (pm.netbanking) modeOfPayment = 'netbanking';
                                    else if (pm.card) modeOfPayment = 'card';
                                    else if (pm.cash) modeOfPayment = 'cash';
                                } catch (e) { modeOfPayment = txn.payment_group || ''; }
                            } else {
                                if (txn.payment_method.upi) modeOfPayment = 'upi';
                                else if (txn.payment_method.netbanking) modeOfPayment = 'netbanking';
                                else if (txn.payment_method.card) modeOfPayment = 'card';
                                else if (txn.payment_method.cash) modeOfPayment = 'cash';
                            }
                        } else if (txn.payment_group) {
                            modeOfPayment = txn.payment_group;
                        }
                        paidBills.push({
                            month: bill ? bill.description : '-',
                            billType: bill ? bill.bill_type : '-',
                            description: bill ? bill.description : '-',
                            totalWeeks: bill ? bill.total_weeks : '-',
                            billAmount: bill ? bill.total_bill_amount : '-',
                            paymentDate: txn.payment_completion_time ? formatDate(txn.payment_completion_time) : '-',
                            paidAmount: (parseFloat(order.order_amount) - parseFloat(order.tax)),
                            gst: parseFloat(order.tax),
                            paymentMode: modeOfPayment
                        });
                    }
                });
            if (paidBills.length === 0) {
                Swal.fire({
                    title: 'Paid Kitty Bills',
                    html: '<p>No paid bills found.</p>',
                    width: 600,
                    showCloseButton: true,
                    showConfirmButton: false
                });
                return;
            }
            let html = `<div style='overflow-x:auto;'><table style='width:100%;border-collapse:collapse;'>
                <thead><tr style='background:#f8f9fa;'>
                    <th style='padding:6px 8px;'>Month</th>
                    <th style='padding:6px 8px;'>Bill Type</th>
                    <th style='padding:6px 8px;'>Description</th>
                    <th style='padding:6px 8px;'>Weeks</th>
                    <th style='padding:6px 8px;'>Bill Amount</th>
                    <th style='padding:6px 8px;'>Payment Date</th>
                    <th style='padding:6px 8px;'>Paid Amount</th>
                    <th style='padding:6px 8px;'>GST</th>
                    <th style='padding:6px 8px;'>Payment Mode</th>
                </tr></thead><tbody>`;
            paidBills.forEach(bill => {
                html += `<tr style='background:#fff;'>
                    <td style='padding:6px 8px;'>${bill.month}</td>
                    <td style='padding:6px 8px;'>${bill.billType}</td>
                    <td style='padding:6px 8px;'>${bill.description}</td>
                    <td style='padding:6px 8px;'>${bill.totalWeeks}</td>
                    <td style='padding:6px 8px;'>${formatCurrency(bill.billAmount)}</td>
                    <td style='padding:6px 8px;'>${bill.paymentDate}</td>
                    <td style='padding:6px 8px;'>${formatCurrency(bill.paidAmount)}</td>
                    <td style='padding:6px 8px;'>${formatCurrency(bill.gst)}</td>
                    <td style='padding:6px 8px;'>${bill.paymentMode}</td>
                </tr>`;
            });
            html += '</tbody></table></div>';
            Swal.fire({
                title: 'Paid Kitty Bills',
                html,
                width: 1000,
                showCloseButton: true,
                showConfirmButton: false
            });
        };

        // Prorated logic: if member joined after bill raised_on, calculate prorated for current bill
        const activeKittyBillsProrate = kittyBills.filter(bill => bill.is_completed === false && bill.chapter_id == memberData.chapter_id);
        if (activeKittyBillsProrate.length > 0 && memberChapter) {
            const activeBill = activeKittyBillsProrate.reduce((a, b) => new Date(a.raised_on) > new Date(b.raised_on) ? a : b);
            const billStart = new Date(activeBill.raised_on);
            
            // Calculate bill end date based on bill type and description
            let billEnd;
            if (activeBill.bill_type === 'monthly') {
                const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                let year = billStart.getFullYear();
                let monthIdx = monthNames.findIndex(m => activeBill.description.toLowerCase().includes(m.toLowerCase()));
                if (monthIdx === -1) monthIdx = billStart.getMonth();
                billEnd = new Date(year, monthIdx + 1, 0);
            } else if (activeBill.bill_type === 'quartely') {
                const parts = activeBill.description.split('to');
                let year = billStart.getFullYear();
                if (parts.length === 2) {
                    let endMonth = parts[1].trim();
                    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                    let monthIdx = monthNames.findIndex(m => endMonth.toLowerCase().includes(m.toLowerCase()));
                    if (monthIdx === -1) monthIdx = billStart.getMonth() + 2;
                    billEnd = new Date(year, monthIdx + 1, 0);
                } else {
                    billEnd = new Date(billStart.getFullYear(), billStart.getMonth() + 3, 0);
                }
            } else if (activeBill.bill_type === 'annual') {
                const parts = activeBill.description.split('to');
                let year = billStart.getFullYear();
                if (parts.length === 2) {
                    let endMonth = parts[1].trim();
                    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                    let monthIdx = monthNames.findIndex(m => endMonth.toLowerCase().includes(m.toLowerCase()));
                    if (monthIdx === -1) monthIdx = billStart.getMonth() + 11;
                    if (monthIdx < billStart.getMonth()) year++;
                    billEnd = new Date(year, monthIdx + 1, 0);
                } else {
                    billEnd = new Date(billStart.getFullYear() + 1, billStart.getMonth(), 0);
                }
            } else {
                billEnd = new Date(activeBill.kitty_due_date);
            }

            const memberJoin = new Date(memberData.date_of_publishing);
            console.log('[PRORATE] Member Join:', memberJoin, 'Bill Start:', billStart, 'Bill End:', billEnd);
            
            if (memberJoin > billStart && memberJoin <= billEnd) {
                const meetingDay = memberChapter.chapter_meeting_day;
                const kittyFee = parseFloat(memberChapter.chapter_kitty_fees);
                console.log('[PRORATE] Meeting Day:', meetingDay, 'Kitty Fee:', kittyFee);

                // Get day of week (0-6, where 0 is Sunday)
                const dayMap = {
                    'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
                    'Thursday': 4, 'Friday': 5, 'Saturday': 6
                };
                const meetingDayNum = dayMap[meetingDay];

                // Count meetings from join date to bill end
                let meetingCount = 0;
                let currentDate = new Date(memberJoin);
                
                // Skip the first meeting day (date_of_publishing)
                // Move to next meeting day
                const daysUntilNext = (meetingDayNum - currentDate.getDay() + 7) % 7;
                if (daysUntilNext === 0) {
                    // If today is meeting day, move to next week
                    currentDate.setDate(currentDate.getDate() + 7);
                } else {
                    currentDate.setDate(currentDate.getDate() + daysUntilNext);
                }

                // Count remaining meetings
                while (currentDate <= billEnd) {
                    meetingCount++;
                    currentDate.setDate(currentDate.getDate() + 7);
                }

                console.log('[PRORATE] Meetings counted:', meetingCount);
                const proratedAmount = meetingCount * kittyFee;
                console.log('[PRORATE] Prorated Amount:', proratedAmount);

                // Add prorated entry
                const gstAmount = Math.round(proratedAmount * 0.18);
                const totalAmount = proratedAmount + gstAmount;
                allTransactionItems.push({
                    date: memberJoin,
                    type: 'kitty_bill',
                    description: `
                        <div>
                            <b>Prorated Kitty Bill - ${activeBill.bill_type} (${activeBill.description})</b>
                            <div style="font-style: italic; font-size: 0.95em; color: #666;">
                                <div>Period: ${formatDate(billStart)} to ${formatDate(billEnd)}</div>
                                <div>Meetings: ${meetingCount} × ₹${kittyFee} = ₹${proratedAmount}</div>
                            </div>
                        </div>
                    `,
                    debit: proratedAmount,
                    credit: 0,
                    gst: gstAmount,
                    totalAmount: totalAmount,
                    // runningBalance will be set later
                });
                console.log('[PRORATE] Prorated entry added:', allTransactionItems[allTransactionItems.length-1]);
            }
        }

    } catch (error) {
        console.error('Error initializing member ledger:', error);
        toastr.error(error.message || 'Failed to initialize member ledger');
    } finally {
        hideLoader();
    }
}

function processTransactions() {
    if (!memberData) {
        console.error('Member data not available');
        return;
    }

    // Get member's chapter ID
    const chapterId = memberData.chapter_id;
    let openingBalance = memberData.meeting_opening_balance || 0;
    if (openingBalance > 0) openingBalance = -Math.abs(openingBalance);
    console.log('[LEDGER] Opening balance used:', openingBalance);
    let runningBalance = openingBalance;
    let totalPaidKittyAmount = 0;
    let totalCreditNoteAmount = 0;
    let totalPendingAmount = 0;
    let latePaymentCount = 0;
    allTransactionItems = [];

    // Add opening balance entry
    const openingBalanceDate = new Date(memberData.date_of_publishing);
    allTransactionItems.push({
        date: openingBalanceDate,
        type: 'opening',
        description: '<b>Opening Balance</b>',
        amount: 0,
        debit: 0,
        credit: 0,
        gst: 0,
        totalAmount: 0,
        runningBalance: openingBalance
    });

    // Add credit entries (before bills/payments, so they sort by date)
    memberCredits.forEach(credit => {
        allTransactionItems.push({
            date: new Date(credit.credit_date),
            type: 'credit',
            description: '<i>Credit Adjustment</i>',
            debit: 0,
            credit: parseFloat(credit.credit_amount),
            gst: 0,
            totalAmount: parseFloat(credit.credit_amount),
            // runningBalance will be set later
        });
    });

    // === REMOVE PRORATED LOGIC BLOCK HERE ===
    // (Delete the block that adds a prorated entry before the bill loop)

    // Get all kitty bills for the member's chapter
    const chapterKittyBills = kittyBills.filter(bill => 
        bill.chapter_id === chapterId
    ).sort((a, b) => new Date(a.raised_on) - new Date(b.raised_on));

    chapterKittyBills.forEach(bill => {
        const billDate = new Date(bill.raised_on);
        const baseAmount = parseFloat(bill.total_bill_amount);
        const gstAmount = Math.round(baseAmount * 0.18);
        const totalAmount = baseAmount + gstAmount;
        // --- Calculate correct bill end date ---
        let billEnd;
        if (bill.bill_type === 'monthly') {
            // bill.description is like 'Apr' or 'May'
            const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            let year = billDate.getFullYear();
            let monthIdx = monthNames.findIndex(m => bill.description.toLowerCase().includes(m.toLowerCase()));
            if (monthIdx === -1) monthIdx = billDate.getMonth();
            billEnd = new Date(year, monthIdx + 1, 0); // last day of month
        } else if (bill.bill_type === 'quartely') {
            // bill.description is like 'Apr to Jun'
            const parts = bill.description.split('to');
            let year = billDate.getFullYear();
            if (parts.length === 2) {
                let endMonth = parts[1].trim();
                const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                let monthIdx = monthNames.findIndex(m => endMonth.toLowerCase().includes(m.toLowerCase()));
                if (monthIdx === -1) monthIdx = billDate.getMonth() + 2; // fallback
                billEnd = new Date(year, monthIdx + 1, 0);
            } else {
                billEnd = new Date(billDate.getFullYear(), billDate.getMonth() + 3, 0);
            }
        } else if (bill.bill_type === 'annual') {
            // bill.description is like 'Apr to Mar'
            const parts = bill.description.split('to');
            let year = billDate.getFullYear();
            if (parts.length === 2) {
                let endMonth = parts[1].trim();
                const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                let monthIdx = monthNames.findIndex(m => endMonth.toLowerCase().includes(m.toLowerCase()));
                if (monthIdx === -1) monthIdx = billDate.getMonth() + 11; // fallback
                // If end month is before start month, it's next year
                if (monthIdx < billDate.getMonth()) year++;
                billEnd = new Date(year, monthIdx + 1, 0);
            } else {
                billEnd = new Date(billDate.getFullYear() + 1, billDate.getMonth(), 0);
            }
        } else {
            billEnd = new Date(bill.kitty_due_date); // fallback
        }
        console.log('[PRORATE] Bill Start:', billDate, 'Bill End (calculated):', billEnd, 'Type:', bill.bill_type, 'Desc:', bill.description);
        const dueDate = billEnd;
        const monthName = billDate.toLocaleString('default', { month: 'long' });
        const memberJoin = new Date(memberData.date_of_publishing);
        // --- Only add full bill if member joined before or on bill start ---
        if (memberJoin <= billDate) {
            allTransactionItems.push({
                date: billDate,
                type: 'kitty_bill',
                description: `
                    <div>
                        <b>Meeting Payable Amount</b>
                        <div style="font-style: italic; font-size: 0.95em; color: #222;">
                            (bill for: ${bill.bill_type}) - (${bill.description})
                        </div>
                    </div>
                `,
                debit: baseAmount,
                credit: 0,
                gst: gstAmount,
                totalAmount: totalAmount,
                // runningBalance will be set later
            });
        } else if (memberJoin > billDate && memberJoin <= billEnd) {
            // Prorated logic
            let memberChapter = window.memberChapterGlobal;
            if (!memberChapter && window.allChaptersGlobal) {
                memberChapter = window.allChaptersGlobal.find(ch => ch.chapter_id == memberData.chapter_id);
                window.memberChapterGlobal = memberChapter;
            }
            if (!memberChapter) {
                console.error('[PRORATE] No chapter data found for chapter_id:', memberData.chapter_id);
                return;
            }
            const meetingDay = memberChapter.chapter_meeting_day;
            const kittyFee = parseFloat(memberChapter.chapter_kitty_fees);
            const dayMap = {
                'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
                'Thursday': 4, 'Friday': 5, 'Saturday': 6
            };
            const meetingDayNum = dayMap[meetingDay];
            let meetingCount = 0;
            let currentDate = new Date(memberJoin);
            const daysUntilNext = (meetingDayNum - currentDate.getDay() + 7) % 7;
            if (daysUntilNext === 0) {
                currentDate.setDate(currentDate.getDate() + 7);
            } else {
                currentDate.setDate(currentDate.getDate() + daysUntilNext);
            }
            while (currentDate <= billEnd) {
                meetingCount++;
                currentDate.setDate(currentDate.getDate() + 7);
            }
            const proratedAmount = meetingCount * kittyFee;
            const gstAmountProrated = Math.round(proratedAmount * 0.18);
            const totalAmountProrated = proratedAmount + gstAmountProrated;
            allTransactionItems.push({
                date: memberJoin,
                type: 'kitty_bill',
                description: `
                    <div>
                        <b>Prorated Kitty Bill - ${bill.bill_type} (${bill.description})</b>
                        <div style="font-style: italic; font-size: 0.95em; color: #666;">
                            <div>Period: ${formatDate(billDate)} to ${formatDate(billEnd)}</div>
                            <div>Meetings: ${meetingCount} × ₹${kittyFee} = ₹${proratedAmount}</div>
                        </div>
                    </div>
                `,
                debit: proratedAmount,
                credit: 0,
                gst: gstAmountProrated,
                totalAmount: totalAmountProrated,
                // runningBalance will be set later
            });
        }

        // 2. Find all orders for this bill and member
        const billOrders = allOrders.filter(order =>
            order.universal_link_id === 4 &&
            order.kitty_bill_id === bill.kitty_bill_id &&
            order.customer_id === memberData.member_id &&
            order.chapter_id === chapterId &&
            order.payment_note === 'meeting-payments'
        );

        // 3. Find all successful transactions for this bill
        const billTransactions = billOrders
            .map(order => allTransactions.find(t => t.order_id === order.order_id && t.payment_status === 'SUCCESS'))
            .filter(Boolean)
            .sort((a, b) => new Date(a.payment_completion_time) - new Date(b.payment_completion_time));

        // 4. Process all payments for this bill
        if (billTransactions.length > 0) {
            // Find the earliest payment for penalty check
            const earliestPayment = billTransactions[0];
            const paymentDate = new Date(earliestPayment.payment_completion_time);
            
            // Only add penalty if earliest payment is after due date
            if (paymentDate.getTime() > dueDate.getTime()) {
                const penaltyAmount = bill.penalty_fee || 0;
                if (penaltyAmount > 0) {
                    allTransactionItems.push({
                        date: paymentDate,
                        type: 'penalty',
                        description: `<div><img src="../../assets/images/late.jpg" alt="Late Payment" style="width: 20px; height: 20px; margin-right: 5px;" /><i>Late Payment Penalty for ${monthName}</i></div>`,
                        debit: penaltyAmount,
                        credit: 0,
                        gst: 0,
                        totalAmount: penaltyAmount,
                        // runningBalance will be set later
                    });
                    latePaymentCount++;
                }
            }

            // Add all payment entries (credits, add to balance)
            billTransactions.forEach(payment => {
                const paymentOrder = billOrders.find(order => order.order_id === payment.order_id);
                const paymentBaseAmount = parseFloat(paymentOrder.order_amount) - parseFloat(paymentOrder.tax);
                // Extract cf_payment_id and mode_of_payment
                let cfPaymentId = payment.cf_payment_id || payment.gateway_payment_id || '';
                let modeOfPayment = '';
                if (payment.payment_method) {
                    if (typeof payment.payment_method === 'string') {
                        try {
                            const pm = JSON.parse(payment.payment_method);
                            if (pm.upi) modeOfPayment = 'upi';
                            else if (pm.netbanking) modeOfPayment = 'netbanking';
                            else if (pm.card) modeOfPayment = 'card';
                            else if (pm.cash) modeOfPayment = 'cash';
                        } catch (e) { modeOfPayment = payment.payment_group || ''; }
                    } else {
                        if (payment.payment_method.upi) modeOfPayment = 'upi';
                        else if (payment.payment_method.netbanking) modeOfPayment = 'netbanking';
                        else if (payment.payment_method.card) modeOfPayment = 'card';
                        else if (payment.payment_method.cash) modeOfPayment = 'cash';
                    }
                } else if (payment.payment_group) {
                    modeOfPayment = payment.payment_group;
                }
                let paymentDetails = '';
                if (cfPaymentId || modeOfPayment) {
                    paymentDetails = `<div style='font-size:0.9em;color:#555;'>${cfPaymentId}${cfPaymentId && modeOfPayment ? ' | ' : ''}${modeOfPayment}</div>`;
                }
                allTransactionItems.push({
                    date: new Date(payment.payment_completion_time),
                    type: 'payment',
                    description: `<img src='../../assets/images/payment-success.jpg' style='height:16px;vertical-align:middle;margin-right:4px;'/> <b>Meeting Fee Paid </b> - ${monthName}${billTransactions.length > 1 ? ' (Partial)' : ''}${paymentDetails}`,
                    debit: 0,
                    credit: paymentBaseAmount,
                    gst: parseFloat(paymentOrder.tax),
                    totalAmount: parseFloat(paymentOrder.order_amount),
                    runningBalance: runningBalance + paymentBaseAmount
                });
                runningBalance += paymentBaseAmount;
            });
        } else {
            // No payment, if today > due date, add penalty
            const now = new Date();
            if (now.getTime() > dueDate.getTime() && bill.penalty_fee > 0) {
                const penaltyAmount = bill.penalty_fee;
                allTransactionItems.push({
                    date: dueDate,
                    type: 'penalty',
                    description: `<div><img src="../../assets/images/late.jpg" alt="Late Payment" style="width: 20px; height: 20px; margin-right: 5px;" /> <i>Late Payment Penalty for ${monthName}</i></div>`,
                    debit: penaltyAmount,
                    credit: 0,
                    gst: 0,
                    totalAmount: penaltyAmount,
                    // runningBalance will be set later
                });
                latePaymentCount++;
            }
        }
        // (Optional) Add credit/write-off entry if any (not implemented here)
    });

    // Sort all transactions by date
    allTransactionItems.sort((a, b) => new Date(a.date) - new Date(b.date));
    console.log('[PRORATE] allTransactionItems after sort:', allTransactionItems);

    // Update running balances after sorting using only debit and credit
    let currentBalance = openingBalance;
    allTransactionItems.forEach(item => {
        if (item.type === 'opening') {
            item.runningBalance = openingBalance;
        } else {
            currentBalance = currentBalance - (item.debit || 0) + (item.credit || 0);
            item.runningBalance = currentBalance;
        }
    });

    // Update summary cards
    updateSummaryCards();

    document.getElementById('no_of_late_payment').textContent = latePaymentCount;
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', initializeMemberLedger);

document.addEventListener('DOMContentLoaded', function() {
    const exportBtn = document.getElementById('export-ledger-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            Swal.fire({
                title: 'Export Ledger',
                text: 'Choose export format:',
                showCancelButton: true,
                showDenyButton: true,
                confirmButtonText: 'Excel',
                denyButtonText: 'PDF',
                cancelButtonText: 'Cancel',
                icon: 'info',
                customClass: { popup: 'kitty-breakdown-popup' }
            }).then((result) => {
                if (result.isConfirmed) {
                    exportLedgerToExcel();
                } else if (result.isDenied) {
                    exportLedgerToPDF();
                }
            });
        });
    }
});

function exportLedgerToExcel() {
    const tbody = document.getElementById('ledger-body');
    const visibleRows = Array.from(tbody.getElementsByTagName('tr'));
    
    // Prepare headers and data
    let excelData = [
        ['Member Ledger'],
        [`Generated on: ${new Date().toLocaleDateString('en-IN')}`],
        [''], // Empty row for spacing
        ['S.No.', 'Date', 'Description', 'Total Amount', 'Debit (Dr.)', 'Credit (Cr.)', 'GST', 'Balance']
    ];

    // Add data rows
    visibleRows.forEach(row => {
        const rowData = Array.from(row.cells).map(cell => {
            // Remove HTML tags and get clean text
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = cell.innerHTML;
            return tempDiv.textContent.trim();
        });
        excelData.push(rowData);
    });

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // Set column widths
    const colWidths = [10, 20, 60, 25, 25, 25, 20, 25];
    ws['!cols'] = colWidths.map(width => ({ width }));

    // Style the header row
    const headerRange = XLSX.utils.decode_range(ws['!ref']);
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
        const cell = XLSX.utils.encode_cell({ r: 3, c: C }); // Row 4 (0-based index)
        if (!ws[cell]) ws[cell] = { v: '' };
        ws[cell].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: "2980b9" } },
            alignment: { horizontal: "center" }
        };
    }

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ledger');

    // Save file
    const date = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Member_Ledger_${date}.xlsx`);
}

function exportLedgerToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    
    // Add title
    doc.setFontSize(16);
    doc.text('Member Ledger', 14, 20);
    
    // Add date
    doc.setFontSize(10);
    const today = new Date().toLocaleDateString('en-IN');
    doc.text(`Generated on: ${today}`, 14, 27);

    // Add summary section as a single row table
    const summary = getLedgerSummaryForExport();
    const summaryHeaders = [
        'No. of Late Payments',
        'Credit Given',
        'Total Paid Kitty Amount',
        'Pending Kitty Amount'
    ];
    const summaryValues = [
        summary.noOfLatePayments,
        formatCurrency(summary.creditGiven),
        formatCurrency(summary.totalPaidKittyAmount),
        formatCurrency(summary.pendingKittyAmount)
    ];
    doc.autoTable({
        head: [summaryHeaders],
        body: [summaryValues],
        startY: 32,
        theme: 'plain',
        styles: {
            fontSize: 11,
            cellPadding: 2.5,
            halign: 'center',
            valign: 'middle',
            fillColor: [240, 248, 255],
            textColor: [44, 62, 80],
            fontStyle: 'bold',
        },
        headStyles: {
            fillColor: [220, 230, 241],
            textColor: [41, 128, 185],
            fontSize: 12,
            fontStyle: 'bold',
        },
        margin: { left: 12, right: 12 },
        tableWidth: 'auto',
    });

    // Get table data
    const tbody = document.getElementById('ledger-body');
    const visibleRows = Array.from(tbody.getElementsByTagName('tr'));
    
    // Prepare headers and data
    const headers = [['S.No.', 'Date', 'Description', 'Total Amount', 'Debit (Dr.)', 'Credit (Cr.)', 'GST', 'Balance']];
    const tableData = visibleRows.map(row => {
        const cells = Array.from(row.cells);
        // Description: plain text, line breaks for bill details
        let desc = cells[2].textContent || '';
        // Try to split on (bill for: ...)
        const match = desc.match(/(Meeting Payable Amount)([\s\S]*?)(\(bill for: [^)]+\) - \([^)]+\))/);
        if (match) {
            desc = `${match[1]}\n${match[3]}`;
        }
        desc = desc.replace(/\n{2,}/g, '\n').trim();
        // All other columns: just use textContent, no extra formatting
        function cleanCell(val, isCurrency) {
            let text = val.textContent ? val.textContent.trim() : '';
            // Remove any leading/trailing whitespace
            text = text.replace(/^\s+|\s+$/g, '');
            // If it's a dash, keep as is
            if (text === '-') return text;
            // If currency, format as currency
            if (isCurrency && /^-?\d+[.,]?\d*$/.test(text.replace(/,/g, ''))) {
                return formatCurrency(Number(text.replace(/,/g, '')));
            }
            return text;
        }
        return [
            cleanCell(cells[0]),
            cleanCell(cells[1]),
            desc,
            cleanCell(cells[3], true),
            cleanCell(cells[4], true),
            cleanCell(cells[5], true),
            cleanCell(cells[6], true),
            cleanCell(cells[7], true)
        ];
    });

    // Adjusted column widths for best fit
    const colWidths = [16, 28, 90, 32, 32, 32, 28, 32];

    // Add the table using autoTable with improved styling
    doc.autoTable({
        head: headers,
        body: tableData,
        startY: doc.lastAutoTable.finalY + 8,
        theme: 'grid',
        styles: {
            fontSize: 10,
            cellPadding: 2.5,
            overflow: 'linebreak',
            wordWrap: 'normal',
            font: 'helvetica',
            valign: 'middle',
            minCellHeight: 10,
            lineColor: [220, 230, 241],
            lineWidth: 0.2,
        },
        headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontSize: 11,
            fontStyle: 'bold',
            halign: 'center',
            valign: 'middle',
        },
        columnStyles: {
            0: { cellWidth: colWidths[0], halign: 'center' }, // S.No.
            1: { cellWidth: colWidths[1], halign: 'center' }, // Date
            2: { cellWidth: colWidths[2], halign: 'left' }, // Description
            3: { cellWidth: colWidths[3], halign: 'right' }, // Total Amount
            4: { cellWidth: colWidths[4], halign: 'right' }, // Debit
            5: { cellWidth: colWidths[5], halign: 'right' }, // Credit
            6: { cellWidth: colWidths[6], halign: 'right' }, // GST
            7: { cellWidth: colWidths[7], halign: 'right' }  // Balance
        },
        alternateRowStyles: {
            fillColor: [245, 245, 245]
        },
        margin: { top: 8, left: 12, right: 12 },
        tableWidth: 'auto',
        didDrawPage: function(data) {
            // Add footer
            doc.setFontSize(8);
            doc.text(
                'Page ' + doc.internal.getNumberOfPages(),
                data.settings.margin.left,
                doc.internal.pageSize.height - 10
            );
        }
    });

    // Save the PDF
    const date = new Date().toISOString().split('T')[0];
    doc.save(`Member_Ledger_${date}.pdf`);
}

// Utility to get summary for export
function getLedgerSummaryForExport() {
    // Calculate summary values from allTransactionItems
    let noOfLatePayments = 0;
    let creditGiven = 0;
    let totalPaidKittyAmount = 0;
    let pendingKittyAmount = 0;

    allTransactionItems.forEach(item => {
        if (item.type === 'penalty') noOfLatePayments++;
        if (item.type === 'credit') creditGiven += item.credit || 0;
        if (item.type === 'payment') totalPaidKittyAmount += item.credit || 0;
    });
    // Pending = last running balance if negative, else 0
    if (allTransactionItems.length > 0) {
        const lastBalance = allTransactionItems[allTransactionItems.length - 1].runningBalance;
        pendingKittyAmount = lastBalance < 0 ? Math.abs(lastBalance) : 0;
    }
    return {
        noOfLatePayments,
        creditGiven,
        totalPaidKittyAmount,
        pendingKittyAmount
    };
}
