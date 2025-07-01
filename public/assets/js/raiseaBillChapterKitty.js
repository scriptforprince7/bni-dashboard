function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

// const apiUrl = 'https://backend.bninewdelhi.com/api/members';
const chaptersApiUrl = 'https://backend.bninewdelhi.com/api/chapters'; 

let current_user;
let allCurrentUserPayments;
let total_kitty_raised = 0;

const fetchChapterId = async () => {
    try {
        showLoader();
        console.log('=== Starting fetchChapterId ===');
        
        // Get chapter email based on login type
        const loginType = getUserLoginType();
        console.log('Current login type:', loginType);
        
        let chapterEmail;
        if (loginType === 'ro_admin') {
            // Get and verify the stored data
            chapterEmail = localStorage.getItem('current_chapter_email');
            const chapterId = localStorage.getItem('current_chapter_id');
            
            console.log('RO Admin - Checking stored data:', {
                storedEmail: chapterEmail,
                storedId: chapterId,
                allLocalStorage: { ...localStorage }
            });
            
            if (!chapterEmail || !chapterId) {
                console.error('Missing required data in localStorage:', {
                    email: chapterEmail,
                    id: chapterId
                });
                return;
            }
        } else {
            chapterEmail = getUserEmail();
            console.log('Chapter user email from token:', chapterEmail);
        }

        console.log('Using chapter email:', chapterEmail);

        // Fetch chapter details
        const response = await fetch(chaptersApiUrl);
        if (!response.ok) throw new Error('Network response was not ok');
        const chapters = await response.json();
        current_user = chapters.find(chapter =>
            chapter.email_id === chapterEmail ||
            chapter.vice_president_mail === chapterEmail ||
            chapter.president_mail === chapterEmail ||
            chapter.treasurer_mail === chapterEmail
        );
        
        
        if (current_user) {
            console.log('Found chapter details:', {
                id: current_user.chapter_id,
                name: current_user.chapter_name,
                frequency: current_user.kitty_billing_frequency
            });
        } else {
            console.error('Chapter not found for email:', chapterEmail);
        }
        
    } catch (error) {
        console.error('Error in fetchChapterId:', error);
    } finally {
        hideLoader();
    }
}

fetchChapterId();

const fetchAllCurrentkittyPayments = async () => {
    const kittyPaymentsApiUrl = `https://backend.bninewdelhi.com/api/getAllKittyPayments`;
    try {
        showLoader();
        const response = await fetch(kittyPaymentsApiUrl);
        if (!response.ok) throw new Error('Network response was not ok');
        const payments = await response.json();
        // console.log('Kitty Payments:', payments);
        allCurrentUserPayments = payments.filter(payment => payment.chapter_id === current_user.chapter_id);
        console.log('All current user Kitty Payments:', allCurrentUserPayments);
        
        
    } catch (error) {
        console.error('Error fetching kitty payments:', error);
    } finally {
        hideLoader();
    }
};
// fetchAllCurrentkittyPayments();

// fetchChapterId().then(() => {
//     if (current_user && current_user.chapter_id) {
//         fetchKittyPayments(current_user.chapter_id);
//     } else {
//         console.error('Chapter ID not found for current user');
//     }
// });

const tableBody = document.querySelector('table tbody');

function formatDate(dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

const insertPaymentsIntoTable = () => {
    tableBody.innerHTML = ''; // Clear existing table rows

    if(allCurrentUserPayments === undefined ||allCurrentUserPayments.length === 0){
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="12"><b>No Bill Raised yet.</b></td>
        `;
        tableBody.appendChild(row);
    }
    else{
        allCurrentUserPayments.forEach((payment , index)=> {
            const row = document.createElement('tr');
            total_kitty_raised+=parseFloat(current_user.chapter_kitty_fees);
            
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="form-check-input bill-checkbox" 
                           data-bill-id="${payment.kitty_bill_id}"
                           ${payment.delete_status === 1 ? 'disabled' : ''}>
                </td>
                <td><b>${index + 1}</b></td>
                <td><b>${formatDate(payment.raised_on) || 'N/A'}</b></td>
                <td><b>${current_user.chapter_meeting_day || 'N/A'}</b></td>
                <td><b>${current_user.chapter_kitty_fees || 'N/A'}</b></td>
                <td><b>${payment.bill_type || 'N/A'}</b></td>
                <td><b>${payment.description || 'N/A'}</b></td>
                <td><b>${payment.total_weeks || 'N/A'}</b></td>
                <td><b>${payment.total_bill_amount || 'N/A'}</b></td>
                <td><b>${formatDate(payment.kitty_due_date) || 'N/A'}</b></td>
                <td><b>${payment.penalty_fee || 'N/A'}</b></td>
                <td><b style="color: ${payment.delete_status === 0 ? 'green' : 'red'};">
                ${payment.delete_status === 0 ? 'Active' : 'Inactive'}</b></td>
            `;
            tableBody.appendChild(row);
        });
    }
    const totalBill = document.getElementById('totalKittyRaised');
    // totalBill.innerHTML = `₹ ${total_kitty_raised}`;
    console.log("raised kitty value:",total_kitty_raised);
    // tableBody.style.fontWeight = 'bold';
    // row.style.fontWeight = 'bold';
};

fetchAllCurrentkittyPayments().then(insertPaymentsIntoTable);
const updateTableWithPayments = async () => {
    await fetchAllCurrentkittyPayments();
    // insertPaymentsIntoTable();
    await autofillFields();
};

// updateTableWithPayments();

const fetchKittyPayments = async () => {
    const kittyPaymentsApiUrl = `https://backend.bninewdelhi.com/api/getKittyPayments`;
    try {
        const response = await fetch(kittyPaymentsApiUrl);
        if (!response.ok) throw new Error('Network response was not ok');
        const payments = await response.json();
        const filteredPayments = payments.find(payment => payment.chapter_id === current_user.chapter_id);
        console.log('Filtered Kitty Payments:', filteredPayments);
        if (filteredPayments) {
            // Do some work here
            console.log('Filtered payments are not empty:', filteredPayments);
            // Example: Insert filtered payments into the table
            
            // Add disabled property to the elements with specified ids
            const billingFrequencyElement = document.getElementById('kitty_billing_frequency');
            const contactPersonElement = document.getElementById('contact_person');
            const totalWeeksElement = document.getElementById('total_weeks');
            const totalBillAmountElement = document.getElementById('total_bill_amount');
            const btnSubmit = document.getElementById('btn_text');
            const dateInput = document.getElementById('region_name');
            
            if (billingFrequencyElement) billingFrequencyElement.disabled = true;
            if (contactPersonElement) contactPersonElement.disabled = true;
            if (totalWeeksElement) totalWeeksElement.disabled = true;
            if (totalBillAmountElement) totalBillAmountElement.disabled = true;
            if (btnSubmit) {
                btnSubmit.disabled = true;
                 btnSubmit.textContent = 'Bill already raised';
                }
            if (dateInput) dateInput.disabled = true;

        } else {
            console.log('No filtered payments found for the current user.');
        }
    } catch (error) {
        console.error('Error fetching kitty payments:', error);
    }
    
        
        
};

// fetchKittyPayments();



// const autofillFields = async () => {
        
//             try {
//             showLoader();  // Show loader before fetch
            
//             const frequency = document.getElementById('kitty_billing_frequency');
//             frequency.value = await current_user.kitty_billing_frequency;
//             frequency.disabled = true;
//             // console.log('Frequency vasu:', current_user.kitty_billing_frequency);
            
//             } catch {
//             console.error('vasu Error fetching chapter details:');
//             // alert(' vasu Failed to load chapter details.');
//             } finally {
//             hideLoader();  // Hide loader after data is loaded
//             }
        
// }

const autofillFields = async () => {
    try {
        showLoader();  // Show loader before fetch

        // Ensure current_user is defined before accessing its properties
        if (current_user && current_user.kitty_billing_frequency) {
            const frequency = document.getElementById('kitty_billing_frequency');
            frequency.value = current_user.kitty_billing_frequency;
            frequency.disabled = true;
        } else {
            // If current_user or its properties are not available, log a specific error
            console.error('current_user or kitty_billing_frequency is not available');
        }

    } catch (error) {
        console.error('vasu Error in autofillFields:', error);
    } finally {
        hideLoader();  // Hide loader after data is loaded
    }
};

// autofillFields();


// Global variables to store calculated values
let calculatedTotalWeeks = 0;
let calculatedTotalBillAmount = 0;

function calculateBilling() {
    console.log( current_user);
    const selectedDate = new Date(document.querySelector('#region_name').value);
    console.log('selectedDate:', selectedDate);
    const billingFrequency = document.querySelector('#kitty_billing_frequency').value;
    console.log('billingFrequency:', billingFrequency);
    const chapterDescription = document.getElementById('contact_person');
    const meetingFee = parseFloat(current_user.chapter_kitty_fees);

    if (!selectedDate || !billingFrequency  || isNaN(meetingFee)) {
        alert("Please select all required fields.");
        return;
    }

    let totalWeeks = 0;
    let totalBillAmount = 0;

    const getMeetingDaysCount = (startDate, endDate, meetingDay) => {
        let count = 0;
        const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(meetingDay);
        console.log('Counting from:', startDate, 'to:', endDate, 'for day:', meetingDay, 'index:', dayIndex);

        for (let d = new Date(startDate); d <= endDate; d = new Date(d.getTime() + 24*60*60*1000)) {
            console.log('Checking date:', d, 'day:', d.getDay(), 'is meeting day:', d.getDay() === dayIndex);
            if (d.getDay() === dayIndex) count++;
        }
        return count;
    };

    switch (current_user.kitty_billing_frequency) {
        case 'weekly':
            totalWeeks = 1;
            totalBillAmount = meetingFee;
            const weekStart = new Date(selectedDate);
            const weekEnd = new Date(selectedDate);
            weekEnd.setDate(weekStart.getDate() + 6);
            chapterDescription.value = `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
            console.log('totalWeeks1');
            break;

        case 'monthly':
            const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
            const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
            totalWeeks = getMeetingDaysCount(monthStart, monthEnd, current_user.chapter_meeting_day.toLowerCase());
            totalBillAmount = totalWeeks * meetingFee;
            chapterDescription.value = `${monthStart.toLocaleString('default', { month: 'short' })}`;

            console.log('totalWeeks2');
            break;

        case 'quartely':
            const quarterStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
            const quarterEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 3, 0);
            quarterEnd.setHours(23, 59, 59, 999); // Ensure last day is included
            // chapterDescription.value = `${quarterStart.toLocaleString('default', { month: 'short' })} to  ${quarterEnd.toLocaleString('default', { month: 'short' })}`;
            const quarterStartMonth = quarterStart.getMonth();
            const quarterEndMonth = quarterEnd.getMonth();
            const quarterStartMonthName = quarterStart.toLocaleString('default', { month: 'short' });
            const quarterEndMonthName = quarterEnd.toLocaleString('default', { month: 'short' });

            if (quarterStartMonth === 0 || quarterStartMonth === 1 || quarterStartMonth === 2) {
                chapterDescription.value = 'Jan to Mar';
            } else if (quarterStartMonth === 3 || quarterStartMonth === 4 || quarterStartMonth === 5) {
                chapterDescription.value = 'Apr to Jun';
            } else if (quarterStartMonth === 6 || quarterStartMonth === 7 || quarterStartMonth === 8) {
                chapterDescription.value = 'Jul to Sep';
            } else if (quarterStartMonth === 9 || quarterStartMonth === 10 || quarterStartMonth === 11) {
                chapterDescription.value = 'Oct to Dec';
            } else {
                // chapterDescription.value = `${quarterStartMonthName} to ${quarterEndMonthName}`;
            }
            totalWeeks = getMeetingDaysCount(selectedDate, quarterEnd, current_user.chapter_meeting_day.toLowerCase());
            totalBillAmount = totalWeeks * meetingFee;
            console.log('totalWeeks3');
            break;

        case 'half_yearly':
            const halfYearEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 6, 0);
            totalWeeks = getMeetingDaysCount(selectedDate, halfYearEnd, current_user.chapter_meeting_day.toLowerCase());
            totalBillAmount = totalWeeks * meetingFee;
            chapterDescription.value = `${selectedDate.toLocaleString('default', { month: 'short' })} to ${halfYearEnd.toLocaleString('default', { month: 'short' })}`;
            console.log('totalWeeks4');
            break;

        case 'yearly':
            const currentYearMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
            const lastYearMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 0);
            totalWeeks = 52;
            totalBillAmount = totalWeeks * meetingFee;
            chapterDescription.value = `${currentYearMonth.toLocaleString('default', { month: 'short' })} to ${lastYearMonth.toLocaleString('default', { month: 'short' })}`;
            console.log(currentYearMonth.getFullYear() + "to" + lastYearMonth.getMonth());
            console.log('totalWeeks5');
            break;

        default:
            alert("Invalid billing frequency.");
            return;
    }

    // Store calculated values in global variables
    calculatedTotalWeeks = totalWeeks;
    calculatedTotalBillAmount = totalBillAmount;
    
    document.getElementById('total_weeks').value = `${totalWeeks} weeks`;
    document.getElementById('total_bill_amount').value = `${totalBillAmount.toFixed(2)}`;
}


const dateElement = document.querySelector('#region_name');
dateElement.addEventListener('change', calculateBilling);


// Refresh JavaScript on document load
document.addEventListener('DOMContentLoaded', async () => {
    // await fetchChapterId();  // Ensure chapter data is fetched first
    // await fetchAllCurrentkittyPayments();  // Fetch all payments after the chapter data is ready
    // insertPaymentsIntoTable();  // Insert payments into table after data is fetched
    // await autofillFields();  // Autofil fields with chapter details
    // // await calculateBilling();  // Calculate billing based on selected date
    // updateTableWithPayments();  // Update the table with payments
    // fetchKittyPayments();  // Fetch the kitty payments if needed

    await fetchChapterId();
    await fetchAllCurrentkittyPayments();
    insertPaymentsIntoTable();
    await autofillFields();
    await calculateBilling();
    updateTableWithPayments();
    fetchKittyPayments();
});

// Add event listeners for checkboxes and make bill inactive button
document.addEventListener('DOMContentLoaded', () => {
    // Select all checkbox functionality
    const selectAllCheckbox = document.getElementById('selectAllBills');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.bill-checkbox:not(:disabled)');
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
        });
    }

    // Make bill inactive button functionality
    const makeBillInactiveBtn = document.getElementById('makeBillInactive');
    if (makeBillInactiveBtn) {
        makeBillInactiveBtn.addEventListener('click', async () => {
            const selectedBills = document.querySelectorAll('.bill-checkbox:checked');
            
            if (selectedBills.length === 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'No Selection',
                    text: 'Please select at least one bill to make inactive.'
                });
                return;
            }

            try {
                showLoader();
                const updatePromises = Array.from(selectedBills).map(async (checkbox) => {
                    const billId = checkbox.dataset.billId;
                    const response = await fetch(`https://backend.bninewdelhi.com/api/updateKittyBillStatus/${billId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error(`Failed to update bill ${billId}`);
                    }
                    
                    return response.json();
                });

                await Promise.all(updatePromises);

                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Selected bills have been made inactive successfully.'
                }).then(() => {
                    // Refresh the page instead of just updating the table
                    window.location.reload();
                });

            } catch (error) {
                console.error('Error updating bills:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to update bills. Please try again.'
                });
            } finally {
                hideLoader();
            }
        });
    }
});

// Remove old IIFE event listener for .add_bill if present
// Add new event listener that always recalculates before submission and uses the global variable
const addBillButton = document.querySelector('.add_bill');
if (addBillButton) {
    addBillButton.addEventListener('click', async (e) => {
        e.preventDefault();
        // Always recalculate before submission
        calculateBilling();

        const chapter_id = current_user.chapter_id;
        const date = document.querySelector('#region_name').value;
        const bill_type = document.querySelector('#kitty_billing_frequency').value;
        const description = document.querySelector('#contact_person').value;
        // Use the stored calculated values instead of reading from form fields
        const total_weeks = calculatedTotalWeeks;
        const total_bill_amount = calculatedTotalBillAmount;
        const due_date = document.querySelector('#due_date').value;
        const penalty_amount = parseFloat(document.querySelector('#penalty_amount').value) || 0; // Get penalty amount

        // Log the values being submitted
        console.log('Submitting bill with weeks:', total_weeks, 'Field value:', document.getElementById('total_weeks').value);

        // Validation for penalty amount
        if (isNaN(penalty_amount) || penalty_amount <= 0) {
            alert("Please enter a valid penalty amount.");
            return;
        }
        

        console.log({ chapter_id, date, bill_type, description, total_weeks, total_bill_amount, due_date, penalty_amount });
        if (!chapter_id || !date || !bill_type || !description || total_weeks <= 0 || total_bill_amount <= 0 || !due_date) {
            alert("Please fill all fields correctly.");
            return;
        }
        if (new Date(due_date) <= new Date(date)) {
            alert("Due date must be greater than the bill date.");
            return;
        }

        // API call commented out for debugging
        console.log('=== BILL DATA TO BE SENT ===');
        console.log('Chapter ID:', chapter_id);
        console.log('Date:', date);
        console.log('Bill Type:', bill_type);
        console.log('Description:', description);
        console.log('Total Weeks:', total_weeks);
        console.log('Total Bill Amount:', total_bill_amount);
        console.log('Due Date:', due_date);
        console.log('Penalty Amount:', penalty_amount);
        console.log('=== END BILL DATA ===');

        try {
            showLoader();

            const response = await fetch('https://backend.bninewdelhi.com/api/addKittyPayment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    chapter_id,
                    date,
                    bill_type,
                    description,
                    total_weeks,
                    total_bill_amount,
                    due_date,
                    penalty_amount, // Include penalty amount in the request
                }),
            });

            const result = await response.json();

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: result.message || 'Bill added successfully.',
                    confirmButtonText: 'OK'
                }).then(() => {
                    window.location.href = '/ck/chapter-raiseBill';
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: result.message || 'Failed to add bill',
                    confirmButtonText: 'ok'
                });
            }            
        } catch (error) {
            console.error('Error adding bill:', error);
            alert('Something went wrong. Please try again.');
        } finally {
            hideLoader();
        }
    });
}



