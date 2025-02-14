function showLoader() {
    document.getElementById('loader').style.display = 'flex';
}

function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

const chaptersApiUrl = 'https://bni-data-backend.onrender.com/api/chapters'; 
const memberApiUrl= 'https://bni-data-backend.onrender.com/api/members';
let creditType;
document.addEventListener('DOMContentLoaded', async () => {
    console.log('=== Chapter Give Credit Loading Process Started ===');
    try {
        // Step 1: Get logged-in chapter email based on login type
        const loginType = getUserLoginType();
        console.log('Current login type:', loginType);
        
        let chapterEmail;
        if (loginType === 'ro_admin') {
            console.log('RO Admin detected, checking localStorage...');
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
            console.log('RO Admin data verified successfully');
        } else {
            console.log('Regular chapter login detected');
            chapterEmail = getUserEmail();
            console.log('Chapter user email from token:', chapterEmail);
        }

        // Step 2: Fetch writeoff data
        console.log('Fetching existing writeoff data...');
        const writeoffResponse = await fetch('https://bni-data-backend.onrender.com/api/getAllMemberWriteOff');
        const writeoffData = await writeoffResponse.json();
        console.log('Writeoff data received:', writeoffData);

        if (!Array.isArray(writeoffData)) {
            console.error('Writeoff data is not an array:', writeoffData);
            throw new Error('Invalid writeoff data format');
        }

        // Step 3: Continue with existing flow
        console.log('Fetching chapters data...');
        const response = await fetch(chaptersApiUrl);
        if (!response.ok) throw new Error('Network response was not ok');
        const chapters = await response.json();
        current_User = chapters.find(chapter => chapter.email_id === chapterEmail);
        
        if (!current_User) {
            console.error('Chapter not found for email:', chapterEmail);
            return;
        }
        console.log('Current chapter:', current_User);

        // Step 4: Fetch members
        console.log('Fetching members data...');
        const MembersResponse = await fetch(memberApiUrl);
        if (!MembersResponse.ok) throw new Error('Network response was not ok');
        const Members = await MembersResponse.json();
        const filteredMembers = Members.filter(member => member.chapter_id === current_User.chapter_id);
        console.log('Filtered members:', filteredMembers.length);

        const tableBody = document.getElementById('chaptersTableBody');
        if (filteredMembers.length > 0) {
            console.log('Creating table rows...');
            tableBody.innerHTML = ''; // Clear existing content

            // Check if all members are written off
            const allMembersWrittenOff = filteredMembers.every(member => 
                writeoffData.some(wo => 
                    parseInt(wo.member_id) === parseInt(member.member_id) && 
                    parseInt(wo.chapter_id) === parseInt(current_User.chapter_id)
                )
            );

            // Auto-check "Select All" if all members are written off
            const selectAllCheckbox = document.getElementById('selectAllCheckbox');
            if (allMembersWrittenOff) {
                console.log('All members written off, checking select all');
                selectAllCheckbox.checked = true;
                selectAllCheckbox.disabled = true;
            }

            filteredMembers.forEach((member, index) => {
                // Check if member is written off
                const isWrittenOff = writeoffData.some(wo => 
                    parseInt(wo.member_id) === parseInt(member.member_id) && 
                    parseInt(wo.chapter_id) === parseInt(current_User.chapter_id)
                );
                console.log(`Member ${member.member_first_name} writeoff status:`, isWrittenOff);

                const row = document.createElement('tr');
                
                // Checkbox cell
                const checkboxCell = document.createElement('td');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = member.member_id;
                checkbox.style.fontWeight = 'bold';
                
                if (isWrittenOff) {
                    checkbox.checked = true;
                    checkbox.disabled = true;
                    row.style.backgroundColor = '#e8f5e9'; // Light green background
                }
                
                checkboxCell.appendChild(checkbox);
                row.appendChild(checkboxCell);

                // Serial number cell
                const serialNumberCell = document.createElement('td');
                serialNumberCell.textContent = index + 1;
                serialNumberCell.style.fontWeight = 'bold';
                row.appendChild(serialNumberCell);

                // Name cell
                const nameCell = document.createElement('td');
                nameCell.style.fontWeight = 'bold';
                nameCell.style.textAlign = 'left';
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

                // Phone cell
                const phoneCell = document.createElement('td');
                phoneCell.textContent = member.member_phone_number;
                phoneCell.style.fontWeight = 'bold';
                row.appendChild(phoneCell);

                // Status cell
                const statusCell = document.createElement('td');
                statusCell.textContent = member.member_status;
                statusCell.style.fontWeight = 'bold';
                row.appendChild(statusCell);

                // Late Payment cell - always showing dash
                const latePaymentCell = document.createElement('td');
                latePaymentCell.textContent = '-';
                latePaymentCell.style.fontWeight = 'bold';
                row.appendChild(latePaymentCell);

                tableBody.appendChild(row);
            });

            // If all members are written off, show message
            if (allMembersWrittenOff) {
                console.log('All members are already written off');
            }
        } else {
            console.log('No members found');
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; font-weight: bold;">
                        No members found
                    </td>
                </tr>
            `;
        }

        // Add click handler for Rightoff Member button
        document.querySelector('.add_bill').addEventListener('click', async () => {
            console.log('=== Member Rightoff Process Started ===');
            
            try {
                // Check if all checkboxes are disabled (all members written off)
                const allCheckboxes = document.querySelectorAll('#chaptersTableBody input[type="checkbox"]');
                const allDisabled = Array.from(allCheckboxes).every(checkbox => checkbox.disabled);

                if (allDisabled) {
                    Swal.fire({
                        icon: 'info',
                        title: 'Already Written Off',
                        text: 'All members have already been written off.',
                        confirmButtonColor: '#dc3545'
                    });
                    return;
                }

                // Get selected members that aren't already written off
                const selectedMembers = Array.from(
                    document.querySelectorAll('#chaptersTableBody input[type="checkbox"]:checked:not([disabled])')
                ).map(checkbox => checkbox.value);
                
                console.log('Selected member IDs:', selectedMembers);

                if (selectedMembers.length === 0) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'No Members Selected',
                        text: 'Please select at least one member to write off.',
                        confirmButtonColor: '#dc3545'
                    });
                    return;
                }

                // Get rightoff date
                const rightoffDate = document.querySelector('#region_name').value.trim();
                console.log('Rightoff date:', rightoffDate);

                if (!rightoffDate) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Date Required',
                        text: 'Please select a write-off date before proceeding.',
                        confirmButtonColor: '#dc3545'
                    });
                    return;
                }

                // Prepare data for API
                const data = {
                    member_id: selectedMembers,
                    chapter_id: current_User.chapter_id,
                    rightoff_date: rightoffDate,
                    total_pending_amount: 500 // Default amount as requested
                };

                console.log('Sending data to API:', data);

                showLoader();
                const response = await fetch('https://bni-data-backend.onrender.com/api/addMemberWriteOff', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });

                const result = await response.json();
                console.log('API Response:', result);

                if (response.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: `Successfully wrote off ${selectedMembers.length} member${selectedMembers.length > 1 ? 's' : ''}!`,
                        confirmButtonColor: '#28a745'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            location.reload(); // Reload page after confirmation
                        }
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Failed to write off members. Please try again.',
                        confirmButtonColor: '#dc3545'
                    });
                }

            } catch (error) {
                console.error('Error in rightoff process:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'An unexpected error occurred. Please try again.',
                    confirmButtonColor: '#dc3545'
                });
            } finally {
                hideLoader();
                console.log('=== Member Rightoff Process Completed ===');
            }
        });

    } catch (error) {
        console.error('ERROR in Chapter Give Credit:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            type: error.name
        });
    }
    console.log('=== Chapter Give Credit Loading Process Completed ===');
});

// Add select all checkbox functionality
document.getElementById('selectAllCheckbox')?.addEventListener('change', function() {
    console.log('Select all checkbox clicked:', this.checked);
    const checkboxes = document.querySelectorAll('#chaptersTableBody input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.checked = this.checked;
    });
});