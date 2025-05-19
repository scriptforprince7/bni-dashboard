function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

const chaptersApiUrl = 'http://localhost:5000/api/chapters'; 
const memberApiUrl = 'http://localhost:5000/api/members';
const lateNOApiUrl = 'http://localhost:5000/api/getbankOrder';

let creditType;
let allMembers = []; // Store all members for search functionality

document.addEventListener('DOMContentLoaded', async () => {
    const loginType = getUserLoginType();
    console.log('Current login type:', loginType);
    
    let chapterEmail;
    let chapter_id;

    if (loginType === 'ro_admin') {
        console.log('RO Admin detected, fetching from localStorage...');
        chapterEmail = localStorage.getItem('current_chapter_email');
        chapter_id = localStorage.getItem('current_chapter_id');
        
        console.log('localStorage data found:', {
            email: chapterEmail,
            id: chapter_id
        });
        
        if (!chapterEmail || !chapter_id) {
            console.error('CRITICAL: Missing localStorage data for RO Admin');
            return;
        }
    } else {
        console.log('Regular chapter login detected, getting email from token...');
        chapterEmail = getUserEmail();
    }
    console.log('Chapter user email:', chapterEmail);

    const response = await fetch(chaptersApiUrl);
    if (!response.ok) throw new Error('Network response was not ok');
    const chapters = await response.json();
    
    if (loginType === 'ro_admin') {
        current_User = chapters.find(chapter => chapter.chapter_id === parseInt(chapter_id));
    } else {
        current_User = chapters.find(chapter =>
            chapter.email_id === chapterEmail ||
            chapter.vice_president_mail === chapterEmail ||
            chapter.president_mail === chapterEmail ||
            chapter.treasurer_mail === chapterEmail
        );
    }

    if (!current_User) {
        console.error('Chapter not found');
        return;
    }

    let memberLateData;

    try {
        const lateNOResponse = await fetch(lateNOApiUrl);
        if (!lateNOResponse.ok) throw new Error('Network response was not ok');
        memberLateData = await lateNOResponse.json();
        console.log('Member credit data fetched successfully:', memberLateData);
    } catch (error) {
        console.error('Error fetching member credit data:', error);
    }

    const MembersResponse = await fetch(memberApiUrl);
    if (!MembersResponse.ok) throw new Error('Network response was not ok');
    const Members = await MembersResponse.json();
    let MemberList = Members;
    const filteredMembers = MemberList.filter(member => member.chapter_id === current_User.chapter_id);
    allMembers = [...filteredMembers]; // Store filtered members for search

    // Add search functionality
    const searchInput = document.getElementById('memberSearch');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        const filtered = allMembers.filter(member => {
            const fullName = `${member.member_first_name} ${member.member_last_name}`.toLowerCase();
            return fullName.includes(searchTerm);
        });
        displayMembers(filtered, memberLateData);
    });

    displayMembers(filteredMembers, memberLateData);
});

// Function to display members in the table
function displayMembers(members, memberLateData) {
    const tableBody = document.getElementById('chaptersTableBody');
    tableBody.innerHTML = '';

    if (members.length > 0) {
        console.log('members Found ...', members.length);

        members.forEach((member, index) => {
            const row = document.createElement('tr');

            const latePaymentData = memberLateData.filter(lateData => lateData.member_id === member.member_id);
            console.log("=========================", latePaymentData[0]?.no_of_late_payment || 0);

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

            // Name cell with image
            const nameCell = document.createElement('td');
            nameCell.style.fontWeight = 'bold';
            
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

            const latePaymentCell = document.createElement('td');
            latePaymentCell.textContent = latePaymentData[0]?.no_of_late_payment || 0;
            latePaymentCell.style.fontWeight = 'bold';
            row.appendChild(latePaymentCell);

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
}

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
        credit_amount: creditAmount,
        credit_date: creditDate,
        credit_type: creditType,
        credit_note: document.querySelector('#credit_note').value.trim()
    };

    console.log('Sending data:', data);

    try {
        showLoader();
        const response = await fetch('http://localhost:5000/api/addMemberCredit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            const result = await response.json();
            Swal.fire({
                title: 'Success!',
                text: 'Credit added successfully!',
                icon: 'success',
                confirmButtonText: 'OK',
                timer: 3000,
                timerProgressBar: true,
                willClose: () => {
                    window.location.href = "/ck/chapter-creditManagement";
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = "/ck/chapter-creditManagement";
                }
            });
            console.log('Credit added successfully:', result);
        } else {
            const errorResult = await response.json();
            console.error('Error adding credit:', response.statusText);
            alert(`Error: ${errorResult.message}`);
        }
    } catch (error) {
        console.error('Fetch error:', error);
        alert('An error occurred. Please try again.');
    } finally {
        hideLoader();
    }
});