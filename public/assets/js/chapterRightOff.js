function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

const chaptersApiUrl = 'https://backend.bninewdelhi.com/api/chapters'; 
const memberApiUrl= 'https://backend.bninewdelhi.com/api/members';
let creditType;
document.addEventListener('DOMContentLoaded', async () => {
    const loginType = getUserLoginType();
    console.log('Current login type:', loginType);
    chapterEmail = getUserEmail();
    console.log('Chapter user email from token:', chapterEmail);
    const response = await fetch(chaptersApiUrl);
    if (!response.ok) throw new Error('Network response was not ok');
    const chapters = await response.json();
    current_User = chapters.find(
        (chapter) =>
          chapter.email_id === chapterEmail ||
          chapter.vice_president_mail === chapterEmail ||
          chapter.president_mail === chapterEmail ||
          chapter.treasurer_mail === chapterEmail
      );
    
    if (current_User) {
        console.log('Found chapter details:', {
            id: current_User.chapter_id,
            name: current_User.chapter_name,
            frequency: current_User.kitty_billing_frequency
        });
    } else {
        console.error('Chapter not found for email:', chapterEmail);
    }

    const MembersResponse = await fetch(memberApiUrl);
    if (!MembersResponse.ok) throw new Error('Network response was not ok');
    const Members = await MembersResponse.json();
    let MemberList = Members;
    const filteredMembers = MemberList.filter(member => member.chapter_id === current_User.chapter_id);

    const tableBody = document.getElementById('chaptersTableBody');
    if (filteredMembers.length > 0) {
        console.log('members Founded ...', filteredMembers.length);

        // Create table rows for each filtered member
        filteredMembers.forEach((member, index) => {
            const row = document.createElement('tr');

            // Checkbox cell
            const checkboxCell = document.createElement('td');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = member.member_id;
            checkbox.style.fontWeight = 'bold';
            checkboxCell.appendChild(checkbox);
            row.appendChild(checkboxCell);

            // Serial number cell
            const serialNumberCell = document.createElement('td');
            serialNumberCell.textContent = index + 1;
            serialNumberCell.style.fontWeight = 'bold';
            row.appendChild(serialNumberCell);

            // Other member details cells
            const nameCell = document.createElement('td');
            nameCell.style.fontWeight = 'bold';
            
            // Add image before the name
            const img = document.createElement('img');
            img.src = 'https://cdn-icons-png.flaticon.com/512/194/194828.png';
            img.alt = '';
            img.style.width = '30px';
            img.style.height = '30px';
            img.style.borderRadius = '50%';
            img.style.marginRight = '10px';
            
            nameCell.appendChild(img);
            nameCell.appendChild(document.createTextNode(member.member_first_name + ' ' + member.member_last_name));
            row.appendChild(nameCell);

            const phoneCell = document.createElement('td');
            phoneCell.textContent = member.member_phone_number;
            phoneCell.style.fontWeight = 'bold';
            row.appendChild(phoneCell);

            const statusCell = document.createElement('td');
            statusCell.textContent = member.member_status;
            statusCell.style.fontWeight = 'bold';
            row.appendChild(statusCell);

            // Late Payment cell
            const latePaymentCell = document.createElement('td');
            latePaymentCell.textContent = '-';
            latePaymentCell.style.fontWeight = 'bold';
            row.appendChild(latePaymentCell);

            // Late Payment cell
            const PendingPaymentCell = document.createElement('td');
            PendingPaymentCell.textContent = '-';
            PendingPaymentCell.style.fontWeight = 'bold';
            row.appendChild(PendingPaymentCell);

            // Append the row to the table body
            tableBody.appendChild(row);
        });
    } else {
        console.log('no member found');
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 6;
        cell.textContent = 'No members found';
        cell.style.fontWeight = 'bold';
        row.appendChild(cell);
        tableBody.appendChild(row);
    }
});

// Function to handle the "Give Credit +" button click
document.querySelector('.add_bill').addEventListener('click', async () => {
    const selectedMembers = Array.from(document.querySelectorAll('#chaptersTableBody input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);

    if (selectedMembers.length === 0) {
        alert('Please select at least one member.');
        return;
    }

    const creditAmount = document.querySelector('#total_bill_amount').value.trim();
    const creditDate = document.querySelector('#region_name').value.trim();

    if (!creditAmount || !creditDate) {
        alert('Please fill in all required fields.');
        return;
    }

    // Determine credit_type
    let creditType;
    const totalEntries = document.querySelectorAll('#chaptersTableBody input[type="checkbox"]').length;
    if (selectedMembers.length === totalEntries) {
        creditType = "allselected";
    } else if (selectedMembers.length === 1) {
        creditType = "single";
    } else {
        creditType = "particular";
    }

    const data = {
        member_id: selectedMembers,
        chapter_id: current_User.chapter_id,
        rightoff_date: creditDate,
        total_pending_amount: creditAmount,
    };

    console.log('Sending data:', data);

    try {
        showLoader();
        const response = await fetch('https://backend.bninewdelhi.com/api/addMemberWriteOff', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            const result = await response.json();
            alert('Member Write Off successfully!');
            console.log('Member Write Off successfully:', result);
        } else {
            const errorResult = await response.json();
            console.error('Error Write Off Member:', response.statusText);
            alert(`Error: ${errorResult.message}`);
        }
    } catch (error) {
        console.error('Fetch error:', error);
        alert('An error occurred. Please try again.');
    } finally {
        hideLoader();
    }
});