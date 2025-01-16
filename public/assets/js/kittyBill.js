function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}


(async function() {
    const regionFilter = document.getElementById('region-filter');
    const chapterFilter = document.getElementById('chapter-filter');
    const regionButton = document.querySelector('.region-button');
    const chapterButton = document.querySelector('.chapter-button');
    const chapterInfo = document.querySelector('.chapter-information');
    const totalMembersElement = document.querySelector('.total_members');

    let selectedRegion = null;
    let selectedChapter = null;
    let members = [];

    try {
        showLoader();

        // Fetch and populate regions
        const regions = await fetch('https://bni-data-backend.onrender.com/api/regions').then(res => res.json());
        regions.forEach(region => {
            const li = document.createElement('li');
            li.innerHTML = `<a class="dropdown-item" href="javascript:void(0);" data-id="${region.region_id}">${region.region_name}</a>`;
            regionFilter.appendChild(li);
        });

        // Fetch and populate chapters
        const chapters = await fetch('https://bni-data-backend.onrender.com/api/chapters').then(res => res.json());
        chapters.forEach(chapter => {
            const li = document.createElement('li');
            li.innerHTML = `<a class="dropdown-item" href="javascript:void(0);" data-id="${chapter.chapter_id}">${chapter.chapter_name}</a>`;
            chapterFilter.appendChild(li);
        });

        // Fetch all members data once (this will be used for filtering chapters based on region)
        members = await fetch('https://bni-data-backend.onrender.com/api/members').then(res => res.json());
        console.log("Fetched members data:", members);  // Log the members data to see the structure

    } catch (error) {
        console.error('Error fetching data:', error);
        alert('Failed to load data. Please try again later.');
    } finally {
        hideLoader();
    }

    // Handle region selection
    regionFilter.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            selectedRegion = e.target.dataset.id;
            const regionName = e.target.innerText;
            regionButton.innerHTML = `<i class="ti ti-sort-descending-2 me-1"></i> ${regionName}`;
            // Highlight the selected item in the dropdown
            const allRegionItems = regionFilter.querySelectorAll('a');
            allRegionItems.forEach(item => item.classList.remove('active'));
            e.target.classList.add('active');
            autofillFields();
        }
    });

    // Handle chapter selection
    chapterFilter.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            selectedChapter = e.target.dataset.id;
            const chapterName = e.target.innerText;
            chapterButton.innerHTML = `<i class="ti ti-sort-descending-2 me-1"></i> ${chapterName}`;
            // Highlight the selected item in the dropdown
            const allChapterItems = chapterFilter.querySelectorAll('a');
            allChapterItems.forEach(item => item.classList.remove('active'));
            e.target.classList.add('active');
            autofillFields();
        }
    });

    async function autofillFields() {
        if (selectedRegion && selectedChapter) {
            try {
                showLoader();  // Show loader before fetch
    
                // Fetch chapter details using chapter_id
                const chapter = await fetch(`https://bni-data-backend.onrender.com/api/getChapter/${selectedChapter}`)
                    .then(res => res.json());
                console.log("Fetched Chapter Details:", chapter);
    
                if (chapter) {
                    document.querySelector('.chapter_name').innerText = chapter.chapter_name || 'N/A';
                    document.querySelector('.chapter_day').innerText = chapter.chapter_meeting_day || 'N/A';
                    document.querySelector('.meeting_venue').innerText = chapter.meeting_hotel_name || 'N/A';
                    document.querySelector('.meeting_fee').innerText = chapter.chapter_kitty_fees || 'N/A';
                    document.querySelector('.visitor_fee').innerText = chapter.chapter_visitor_fees || 'N/A';
    
                    // Ensure that the value is one of the valid options
                    const validBillingFrequencies = ['weekly', 'monthly', 'quartely', 'half_yearly', 'yearly'];
                    const billingFrequency = validBillingFrequencies.includes(chapter.kitty_billing_frequency) ? chapter.kitty_billing_frequency : 'weekly';
                    document.querySelector('#kitty_billing_frequency').value = billingFrequency;
    
                    // Show chapter information
                    chapterInfo.style.display = 'block';
    
                    // Log selected chapter and filter members by chapter_id
                    console.log("Selected Chapter ID:", selectedChapter);
    
                    // Now, calculate total members in the selected chapter
                    const totalMembers = members.filter(member => member.chapter_id === parseInt(selectedChapter)).length;
                    console.log("Filtered Members for Chapter:", totalMembers);  // Log filtered members count
    
                    totalMembersElement.innerText = totalMembers || 'N/A';
                }
    
            } catch (error) {
                console.error('Error fetching chapter details:', error);
                alert('Failed to load chapter details.');
            } finally {
                hideLoader();  // Hide loader after data is loaded
            }
        }
    }

    document.querySelector('.add_bill').addEventListener('click', async (e) => {
        e.preventDefault();

        const chapter_id = selectedChapter;
        const date = document.querySelector('#region_name').value;
        const bill_type = document.querySelector('#kitty_billing_frequency').value;
        const description = document.querySelector('#contact_person').value;
        const total_weeks = parseInt(document.querySelector('.total_weeks').value) || 0;
        const total_bill_amount = parseFloat(document.querySelector('.total_bill_amount').value) || 0;

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
                    document.querySelector('form').reset();
                    selectedChapter = null;  // Reset selected chapter

                    window.location.href = '/k/kitty-management';
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
    const selectedDate = new Date(document.querySelector('#region_name').value);
    const billingFrequency = document.querySelector('#kitty_billing_frequency').value;
    const chapterMeetingDay = document.querySelector('.chapter_day').innerText.toLowerCase();
    const meetingFee = parseFloat(document.querySelector('.meeting_fee').innerText);

    if (!selectedDate || !billingFrequency || !chapterMeetingDay || isNaN(meetingFee)) {
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

    switch (billingFrequency) {
        case 'weekly':
            totalWeeks = 1;
            totalBillAmount = meetingFee;
            break;

        case 'monthly':
            const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
            const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
            totalWeeks = getMeetingDaysCount(monthStart, monthEnd, chapterMeetingDay);
            totalBillAmount = totalWeeks * meetingFee;
            break;

        case 'quartely':
            const quarterEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 3, 0);
            totalWeeks = getMeetingDaysCount(selectedDate, quarterEnd, chapterMeetingDay);
            totalBillAmount = totalWeeks * meetingFee;
            break;

        case 'half_yearly':
            const halfYearEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 6, 0);
            totalWeeks = getMeetingDaysCount(selectedDate, halfYearEnd, chapterMeetingDay);
            totalBillAmount = totalWeeks * meetingFee;
            break;

        case 'yearly':
            totalWeeks = 52;
            totalBillAmount = totalWeeks * meetingFee;
            break;

        default:
            alert("Invalid billing frequency.");
            return;
    }

    document.querySelector('.total_weeks').value = `${totalWeeks} weeks`;
    document.querySelector('.total_bill_amount').value = `${totalBillAmount.toFixed(2)}`;
}

// Attach event listeners
const billingFrequencyElement = document.querySelector('#kitty_billing_frequency');
billingFrequencyElement.addEventListener('change', calculateBilling);

const dateElement = document.querySelector('#region_name');
dateElement.addEventListener('change', calculateBilling);

// Calculate and display dynamic descriptions based on the selected date and billing frequency
function updateDescriptionField() {
    const dateInput = document.querySelector('#region_name');
    const descriptionField = document.querySelector('#contact_person');
    const billingFrequencySelect = document.querySelector('#kitty_billing_frequency');

    dateInput.addEventListener('change', updateDescription);
    billingFrequencySelect.addEventListener('change', updateDescription);

    function updateDescription() {
        const selectedDate = new Date(dateInput.value);
        if (isNaN(selectedDate)) {
            descriptionField.value = '';
            return;
        }

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const billingFrequency = billingFrequencySelect.value;
        let description = '';

        switch (billingFrequency) {
            case 'weekly':
                const weekStart = new Date(selectedDate);
                const weekEnd = new Date(selectedDate);
                weekEnd.setDate(weekStart.getDate() + 6);
                description = `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
                break;

            case 'monthly':
                description = monthNames[selectedDate.getMonth()];
                break;

            case 'quartely':
                const quarterStartMonth = Math.floor(selectedDate.getMonth() / 3) * 3;
                const quarterEndMonth = quarterStartMonth + 2;
                description = `${monthNames[quarterStartMonth]} - ${monthNames[quarterEndMonth]}`;
                break;

            case 'half_yearly':
                const halfYearStartMonth = selectedDate.getMonth();
                const halfYearEndMonth = (halfYearStartMonth + 5) % 12;
                description = `${monthNames[halfYearStartMonth]} - ${monthNames[halfYearEndMonth]}`;
                break;

            case 'yearly':
                description = 'January - December';
                break;

            default:
                description = '';
        }

        descriptionField.value = description;
    }
}

updateDescriptionField();








