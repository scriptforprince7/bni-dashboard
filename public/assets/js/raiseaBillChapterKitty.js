function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

// const apiUrl = 'https://bni-data-backend.onrender.com/api/members';
const chaptersApiUrl = 'https://bni-data-backend.onrender.com/api/chapters'; 

let current_user ;
let allCurrentUserPayments;

const chapterEmail = getUserEmail(); 
console.log('chapterEmail:', chapterEmail);

const fetchChapterId = async () => {
// async function fetchChapterId() {
    try {
        showLoader();
      const response = await fetch(chaptersApiUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      const chapters = await response.json();
    current_user = chapters.find(chapter => chapter.email_id === chapterEmail);
    if (current_user) {
      console.log('chapter id:', current_user.chapter_id);
      console.log('chapter frequency:', current_user.kitty_billing_frequency);
    } else {
      console.error('Chapter not found for the logged-in email:', chapterEmail);
    }
  console.log(current_user.chapter_id);
  
    //   console.log(`chapter_id:${usedEmail.chapter_id}`);
  
    } catch (error) {
      console.error('Error fetching chapters:', error);
      
    } finally {
      hideLoader();
    }
  }

fetchChapterId();

const fetchAllCurrentkittyPayments = async () => {
    const kittyPaymentsApiUrl = `https://bni-data-backend.onrender.com/api/getAllKittyPayments`;
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

const insertPaymentsIntoTable = () => {
    tableBody.innerHTML = ''; // Clear existing table rows

    
    if(allCurrentUserPayments === undefined ||allCurrentUserPayments.length === 0){
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="11"><b>No Bill Raised yet.</b></td>
        `;
        tableBody.appendChild(row);
    }
    else{
        allCurrentUserPayments.forEach((payment , index)=> {
            const row = document.createElement('tr');
            
    
            // const dateCell = document.createElement('td');
            // dateCell.textContent = payment.date;
            // row.appendChild(dateCell);
    
            // const amountCell = document.createElement('td');
            // amountCell.textContent = payment.amount;
            // row.appendChild(amountCell);
    
            // const descriptionCell = document.createElement('td');
            // descriptionCell.textContent = payment.description;
            // row.appendChild(descriptionCell);
            row.innerHTML = `
                <td><b>${index+1}</b></td>
                <td><b>${payment.payment_date}</b></td>
                <td><b>${current_user.chapter_meeting_day}</b></td>
                <td><b>${current_user.chapter_kitty_fees}</b></td>
                <td><b>${payment.bill_type}</b></td>
                <td><b>${payment.description}</b></td>
                <td><b>${payment.total_weeks}</b></td>
                <td><b>${payment.total_bill_amount}</b></td>
                <td><b>${payment.raised_on}</b></td>
                <td><b style="color: ${payment.delete_status === 0 ? 'green' : 'red'};">
                ${payment.delete_status === 0 ? 'Active' : 'Inactive'}</b></td>
                <td><b>${payment.date}</b></td>
            `;
            
    
            tableBody.appendChild(row);
        });
    }
    // tableBody.style.fontWeight = 'bold';
    // row.style.fontWeight = 'bold';
};

fetchAllCurrentkittyPayments().then(insertPaymentsIntoTable);
const updateTableWithPayments = async () => {
    await fetchAllCurrentkittyPayments();
    insertPaymentsIntoTable();
    await autofillFields();
};

// updateTableWithPayments();

const fetchKittyPayments = async () => {
    const kittyPaymentsApiUrl = `https://bni-data-backend.onrender.com/api/getKittyPayments`;
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
                 btnSubmit.textContent = 'Bill already raised for current Quarter';
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


// 
(async function() {
    document.querySelector('.add_bill').addEventListener('click', async (e) => {
        e.preventDefault();

        const chapter_id = current_user.chapter_id;
        const date = document.querySelector('#region_name').value;
        const bill_type = document.querySelector('#kitty_billing_frequency').value;
        const description = document.querySelector('#contact_person').value;
        const total_weeks = parseInt(document.querySelector('.total_weeks').value) || 0;
        const total_bill_amount = parseFloat(document.querySelector('.total_bill_amount').value) || 0;

        console.log({ chapter_id, date, bill_type, description, total_weeks, total_bill_amount });
        if (!chapter_id || !date || !bill_type || !description || total_weeks <= 0 || total_bill_amount <= 0) {
            alert("Please fill all fields correctly.");
            return;
        }

        try {
            showLoader();

            const response = await fetch('https://bni-data-backend.onrender.com/api/addKittyPayment', {
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
                    // document.querySelector('form').reset();
                    // selectedChapter = null;  // Reset selected chapter

                    window.location.href = '/ck/chapter-raiseBill';
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: result.message || 'Failed to add bill.',
                    confirmButtonText: 'OK'
                });
            }            
        } catch (error) {
            console.error('Error adding bill:', error);
            alert('Something went wrong. Please try again.');
        } finally {
            hideLoader();
        }
    });
})();


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

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
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
            // const quarterEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 3, 0);
            
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
                chapterDescription.value = `${quarterStartMonthName} to ${quarterEndMonthName}`;
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
            console.log(currentYearMonth.getFullYear() + " to " + lastYearMonth.getMonth());
            console.log('totalWeeks5');
            break;

        default:
            alert("Invalid billing frequency.");
            return;
    }

    document.getElementById('total_weeks').value = `${totalWeeks} weeks`;
    document.getElementById('total_bill_amount').value = `${totalBillAmount.toFixed(2)}`;
}


const dateElement = document.querySelector('#region_name');
dateElement.addEventListener('change', calculateBilling);


// Refresh JavaScript on document load
document.addEventListener('DOMContentLoaded', async () => {
    await fetchChapterId();  // Ensure chapter data is fetched first
    await fetchAllCurrentkittyPayments();  // Fetch all payments after the chapter data is ready
    insertPaymentsIntoTable();  // Insert payments into table after data is fetched
    await autofillFields();  // Autofil fields with chapter details
    // await calculateBilling();  // Calculate billing based on selected date
    updateTableWithPayments();  // Update the table with payments
    fetchKittyPayments();  // Fetch the kitty payments if needed

});
