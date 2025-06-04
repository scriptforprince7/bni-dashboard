// Data for the table
const paymentTypes = [
    {
      type: "Meeting Payments",
      link: "https://dashboard.bninewdelhi.com/meeting-payments",
      qr: "https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=https://dashboard.bninewdelhi.com/meeting-payments"
    },
    {
      type: "Training Payments",
      link: "https://dashboard.bninewdelhi.com/training-payments",
      qr: "https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=https://dashboard.bninewdelhi.com/training-payments"
    },
    {
      type: "Visitors Payment",
      link: "https://dashboard.bninewdelhi.com/visitors-payment",
      qr: "https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=https://dashboard.bninewdelhi.com/visitors-payment"
    },
    {
      type: "New Member Payment",
      link: "https://dashboard.bninewdelhi.com/new-member-payment",
      qr: "https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=https://dashboard.bninewdelhi.com/new-member-payment"
    }
  ];
  
  // Icons for each payment type (FontAwesome or SVG)
  const icons = [
    `<span style="color:#d01f2f;font-size:1.5rem;"><i class="fas fa-handshake"></i></span>`,
    `<span style="color:#007bff;font-size:1.5rem;"><i class="fas fa-chalkboard-teacher"></i></span>`,
    `<span style="color:#28a745;font-size:1.5rem;"><i class="fas fa-user-friends"></i></span>`,
    `<span style="color:#ff9800;font-size:1.5rem;"><i class="fas fa-user-plus"></i></span>`
  ];
  
  // Helper: Copy to clipboard
  function copyToClipboard(text, btn) {
    navigator.clipboard.writeText(text).then(() => {
      btn.innerHTML = `<i class="fas fa-check" style="color:green"></i> Copied!`;
      setTimeout(() => {
        btn.innerHTML = `<i class="fas fa-copy"></i> Copy Link`;
      }, 1200);
    });
  }
  
  // Helper: Share QR (Web Share API fallback)
  function shareQR(link, btn, qrUrl) {
    // Build the WhatsApp message
    const message = `Pay your BNI dues here: ${link}\nScan this QR to pay: ${qrUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }
  
  // Render the table
  function renderLinksTable() {
    const tbody = document.getElementById("expensesTableBody");
    tbody.innerHTML = ""; // Clear existing
  
    paymentTypes.forEach((item, idx) => {
      const tr = document.createElement("tr");
      tr.style.background = idx % 2 === 0 ? "#fff" : "#f8f9fa";
      tr.style.transition = "background 0.3s";
      tr.onmouseover = () => tr.style.background = "#e3e6f0";
      tr.onmouseout = () => tr.style.background = idx % 2 === 0 ? "#fff" : "#f8f9fa";
  
      // S.No.
      const tdSno = document.createElement("td");
      tdSno.style.fontWeight = "bold";
      tdSno.style.textAlign = "center";
      tdSno.style.borderRight = "2px solid #e0e0e0";
      tdSno.textContent = idx + 1;
  
      // Payment Type with icon
      const tdType = document.createElement("td");
      tdType.innerHTML = `${icons[idx]} <span style="margin-left:10px;font-weight:600;font-size:1.1rem;">${item.type}</span>`;
      tdType.style.borderRight = "2px solid #e0e0e0";
  
      // Copy to Clipboard Button
      const tdLink = document.createElement("td");
      tdLink.style.borderRight = "2px solid #e0e0e0";
      tdLink.style.textAlign = "center";
      tdLink.innerHTML = `
        <button class="btn btn-sm btn-outline-primary copy-btn" style="font-weight:600;letter-spacing:1px;display:inline-flex;align-items:center;gap:6px;">
          <i class="fas fa-copy"></i> Copy Link
        </button>
        <br>
        <span style="font-size:0.9rem;color:#888;word-break:break-all;">${item.link}</span>
      `;
  
      // QR Code
      const tdQR = document.createElement("td");
      tdQR.style.borderRight = "2px solid #e0e0e0";
      tdQR.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;">
          <img src="${item.qr.replace('size=90x90', 'size=80x80')}" alt="QR" style="border-radius:8px;border:2px solid #d01f2f;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:4px;width:75px;height:75px;">
          <span style="font-size:0.8rem;color:#555;">Scan to Pay</span>
        </div>
      `;
  
      // Share QR Button
      const tdShare = document.createElement("td");
      tdShare.style.textAlign = "center";
      tdShare.style.borderRight = "2px solid #e0e0e0";
      tdShare.innerHTML = `
        <button class="btn btn-sm btn-outline-success share-btn" style="font-weight:600;letter-spacing:1px;display:inline-flex;align-items:center;gap:6px;">
          <i class="fas fa-share-square"></i> Share QR
        </button>
      `;
  
      tr.appendChild(tdSno);
      tr.appendChild(tdType);
      tr.appendChild(tdLink);
      tr.appendChild(tdQR);
      tr.appendChild(tdShare);
  
      tbody.appendChild(tr);
  
      // Add event listeners after appending
      setTimeout(() => {
        // Copy to clipboard
        const copyBtn = tdLink.querySelector('.copy-btn');
        copyBtn.onclick = () => copyToClipboard(item.link, copyBtn);
  
        // Share QR (pass the QR image URL as well)
        const qrUrl = item.qr.replace('size=90x90', 'size=140x140');
        const shareBtn = tdShare.querySelector('.share-btn');
        shareBtn.onclick = () => shareQR(item.link, shareBtn, qrUrl);
      }, 0);
    });
  }
  
  // Main function to generate all dynamic links and render the table
  async function renderDynamicLinksTable() {
    // 1. Get chapter info
    const loginType = getUserLoginType();
    let chapter = null;
  
    if (loginType === 'chapter') {
      const email = getUserEmail();
      const res = await fetch('http://localhost:5000/api/chapters');
      const chapters = await res.json();
      chapter = chapters.find(chap => chap.email_id && chap.email_id.toLowerCase() === email.toLowerCase());
    } else if (loginType === 'ro_admin') {
      const current_chapter_id = localStorage.getItem('current_chapter_id');
      if (current_chapter_id) {
        const res = await fetch('http://localhost:5000/api/chapters');
        const chapters = await res.json();
        chapter = chapters.find(chap => String(chap.chapter_id) === String(current_chapter_id));
      }
    }
  
    if (!chapter) {
      // fallback: show static table
      renderLinksTable();
      return;
    }
  
    // 2. Get region info
    const regionId = chapter.region_id;
    const chapterId = chapter.chapter_id;
    const chapterName = chapter.chapter_name;
    const regionRes = await fetch('http://localhost:5000/api/regions');
    const regions = await regionRes.json();
    const region = regions.find(r => String(r.region_id) === String(regionId));
    const regionName = region ? region.region_name : 'Unknown';
  
    // 3. Prepare all dynamic links and QR codes
    const dynamicLinks = [
      {
        type: "Meeting Payments",
        link: `https://bninewdelhi.com/meeting-payment/${chapterId}/2d4efe39-b134-4187-a5c0-4530125f5248/${regionId}?region_id=${regionId}&chapter_id=${chapterId}`,
        qr: `https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(`https://bninewdelhi.com/meeting-payment/${chapterId}/2d4efe39-b134-4187-a5c0-4530125f5248/${regionId}?region_id=${regionId}&chapter_id=${chapterId}`)}`
      },
      {
        type: "Training Payments",
        link: `https://bninewdelhi.com/training-payments/${chapterId}/bdbe4592-738e-42b1-ad02-beea957a3f9d/${regionId}?region=${encodeURIComponent(regionName)}&chapter=${encodeURIComponent(chapterName)}`,
        qr: `https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(`https://bninewdelhi.com/training-payments/${chapterId}/bdbe4592-738e-42b1-ad02-beea957a3f9d/${regionId}?region=${encodeURIComponent(regionName)}&chapter=${encodeURIComponent(chapterName)}`)}`
      },
      {
        type: "Visitors Payment",
        link: `https://bninewdelhi.com/visitors-payment/${chapterId}/726f7bf6-fa74-4883-b1bb-15acaf64dfb1/${regionId}?type=refer&region=${encodeURIComponent(regionName)}&chapter=${encodeURIComponent(chapterName)}`,
        qr: `https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(`https://bninewdelhi.com/visitors-payment/${chapterId}/726f7bf6-fa74-4883-b1bb-15acaf64dfb1/${regionId}?type=refer&region=${encodeURIComponent(regionName)}&chapter=${encodeURIComponent(chapterName)}`)}`
      },
      {
        type: "New Member Payment",
        link: `https://bninewdelhi.com/new-member-payment/${chapterId}/8c32021b-2918-4282-9de4-56949626eff7/${regionId}?region=${encodeURIComponent(regionName)}&chapter=${encodeURIComponent(chapterName)}`,
        qr: `https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(`https://bninewdelhi.com/new-member-payment/${chapterId}/8c32021b-2918-4282-9de4-56949626eff7/${regionId}?region=${encodeURIComponent(regionName)}&chapter=${encodeURIComponent(chapterName)}`)}`
      }
    ];
  
    // 4. Render the table
    const tbody = document.getElementById("expensesTableBody");
    tbody.innerHTML = "";
  
    dynamicLinks.forEach((item, idx) => {
      const tr = document.createElement("tr");
      tr.style.background = idx % 2 === 0 ? "#fff" : "#f8f9fa";
      tr.style.transition = "background 0.3s";
      tr.onmouseover = () => tr.style.background = "#e3e6f0";
      tr.onmouseout = () => tr.style.background = idx % 2 === 0 ? "#fff" : "#f8f9fa";
  
      // S.No.
      const tdSno = document.createElement("td");
      tdSno.style.fontWeight = "bold";
      tdSno.style.textAlign = "center";
      tdSno.style.borderRight = "2px solid #e0e0e0";
      tdSno.textContent = idx + 1;
  
      // Payment Type with icon
      const tdType = document.createElement("td");
      tdType.innerHTML = `${icons[idx]} <span style="margin-left:10px;font-weight:600;font-size:1.1rem;">${item.type}</span>`;
      tdType.style.borderRight = "2px solid #e0e0e0";
  
      // Copy to Clipboard Button and Link (beautified)
      const tdLink = document.createElement("td");
      tdLink.style.borderRight = "2px solid #e0e0e0";
      tdLink.style.textAlign = "center";
      tdLink.style.width = "220px";
      tdLink.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;justify-content:center;">
          <button class="btn btn-sm btn-outline-primary copy-btn" style="font-weight:600;letter-spacing:1px;display:inline-flex;align-items:center;gap:6px;">
            <i class="fas fa-copy"></i>
          </button>
          <a href="${item.link}" target="_blank" 
             style="
               color:#1565c0;
               text-decoration:underline;
               font-weight:500;
               font-size:0.98rem;
               max-width:120px;
               overflow:hidden;
               text-overflow:ellipsis;
               white-space:nowrap;
               display:inline-block;
               vertical-align:middle;
             "
             title="${item.link}">
            ${item.link}
          </a>
        </div>
      `;
  
      // QR Code (smaller, centered, with subtle border)
      const tdQR = document.createElement("td");
      tdQR.style.borderRight = "2px solid #e0e0e0";
      tdQR.style.width = "110px";
      tdQR.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;">
          <img src="${item.qr.replace('size=90x90', 'size=80x80')}" alt="QR" style="border-radius:8px;border:2px solid #d01f2f;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:4px;width:75px;height:75px;">
          <span style="font-size:0.8rem;color:#555;">Scan to Pay</span>
        </div>
      `;
  
      // Share QR Button
      const tdShare = document.createElement("td");
      tdShare.style.textAlign = "center";
      tdShare.style.borderRight = "2px solid #e0e0e0";
      tdShare.innerHTML = `
        <button class="btn btn-sm btn-outline-success share-btn" style="font-weight:600;letter-spacing:1px;display:inline-flex;align-items:center;gap:6px;">
          <i class="fas fa-share-square"></i> Share QR
        </button>
      `;
  
      // Send By Email Button
      const tdEmail = document.createElement("td");
      
      tdLink.style.borderRight = "2px solid #e0e0e0";
      tdEmail.style.textAlign = "center";
      tdEmail.innerHTML = `
        <button class="btn btn-sm btn-outline-danger select-members-btn" style="font-weight:600;letter-spacing:1px;display:inline-flex;align-items:center;gap:6px;">
          <i class="fas fa-envelope"></i> Select Members
        </button>
      `;
  
      tr.appendChild(tdSno);
      tr.appendChild(tdType);
      tr.appendChild(tdLink);
      tr.appendChild(tdQR);
      tr.appendChild(tdShare);
      tr.appendChild(tdEmail);
  
      tbody.appendChild(tr);
  
      // Add event listeners after appending
      setTimeout(() => {
        // Copy to clipboard
        const copyBtn = tdLink.querySelector('.copy-btn');
        copyBtn.onclick = () => copyToClipboard(item.link, copyBtn);
  
        // Share QR (pass the QR image URL as well)
        const qrUrl = item.qr.replace('size=90x90', 'size=140x140');
        const shareBtn = tdShare.querySelector('.share-btn');
        shareBtn.onclick = () => shareQR(item.link, shareBtn, qrUrl);
  
        // Select Members (Send By Email)
        const selectBtn = tdEmail.querySelector('.select-members-btn');
        selectBtn.onclick = () => openMemberSelectModal(item, idx);
      }, 0);
    });
  
    // In your renderDynamicLinksTable, after you define dynamicLinks:
    window.dynamicLinks = dynamicLinks;
  }
  
  // Add FontAwesome for icons if not already present
  (function ensureFontAwesome() {
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const link = document.createElement('link');
      link.rel = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css";
      document.head.appendChild(link);
    }
  })();
  
  // On DOM ready, render the dynamic table
  document.addEventListener("DOMContentLoaded", renderDynamicLinksTable);
  
  async function getChapterInfo() {
    const loginType = getUserLoginType();
    let chapter = null;
  
    // 1. Get chapter object
    if (loginType === 'chapter') {
      const email = getUserEmail();
      const res = await fetch('http://localhost:5000/api/chapters');
      const chapters = await res.json();
      chapter = chapters.find(chap => chap.email_id && chap.email_id.toLowerCase() === email.toLowerCase());
    } else if (loginType === 'ro_admin') {
      const current_chapter_id = localStorage.getItem('current_chapter_id');
      if (current_chapter_id) {
        const res = await fetch('http://localhost:5000/api/chapters');
        const chapters = await res.json();
        chapter = chapters.find(chap => String(chap.chapter_id) === String(current_chapter_id));
      }
    }
  
    if (chapter) {
      // 2. Extract region_id
      const regionId = chapter.region_id;
  
      // 3. Fetch all regions
      const regionRes = await fetch('http://localhost:5000/api/regions');
      const regions = await regionRes.json();
  
      // 4. Find the region with matching region_id
      const region = regions.find(r => String(r.region_id) === String(regionId));
      const regionName = region ? region.region_name : 'Unknown';
  
      // 5. Build the dynamic link
      const uuid = 'bdbe4592-738e-42b1-ad02-beea957a3f9d'; // Example UUID
      const chapterName = chapter.chapter_name;
      const trainingLink = `https://bninewdelhi.com/training-payments/${chapter.chapter_id}/${uuid}/${regionId}?region=${encodeURIComponent(regionName)}&chapter=${encodeURIComponent(chapterName)}`;
  
      console.log('✅ Dynamic Training Payment Link:', trainingLink);
    } else {
      console.log('No chapter found for this user.');
    }
  }
  
  async function printMeetingPaymentLink() {
    const loginType = getUserLoginType();
    let chapter = null;
  
    // 1. Get chapter object
    if (loginType === 'chapter') {
      const email = getUserEmail();
      const res = await fetch('http://localhost:5000/api/chapters');
      const chapters = await res.json();
      chapter = chapters.find(chap => chap.email_id && chap.email_id.toLowerCase() === email.toLowerCase());
    } else if (loginType === 'ro_admin') {
      const current_chapter_id = localStorage.getItem('current_chapter_id');
      if (current_chapter_id) {
        const res = await fetch('http://localhost:5000/api/chapters');
        const chapters = await res.json();
        chapter = chapters.find(chap => String(chap.chapter_id) === String(current_chapter_id));
      }
    }
  
    if (chapter) {
      // 2. Extract region_id and chapter_id
      const regionId = chapter.region_id;
      const chapterId = chapter.chapter_id;
  
      // 3. Use a static or generated UUID for now
      const uuid = '2d4efe39-b134-4187-a5c0-4530125f5248'; // Example UUID
  
      // 4. Build the dynamic link (using only IDs)
      const meetingLink = `https://bninewdelhi.com/meeting-payment/${chapterId}/${uuid}/${regionId}?region_id=${regionId}&chapter_id=${chapterId}`;
  
      console.log('✅ Dynamic Meeting Payment Link:', meetingLink);
    } else {
      console.log('No chapter found for this user.');
    }
  }
  
  async function printVisitorPaymentLink() {
    const loginType = getUserLoginType();
    let chapter = null;
  
    // 1. Get chapter object
    if (loginType === 'chapter') {
      const email = getUserEmail();
      const res = await fetch('http://localhost:5000/api/chapters');
      const chapters = await res.json();
      chapter = chapters.find(chap => chap.email_id && chap.email_id.toLowerCase() === email.toLowerCase());
    } else if (loginType === 'ro_admin') {
      const current_chapter_id = localStorage.getItem('current_chapter_id');
      if (current_chapter_id) {
        const res = await fetch('http://localhost:5000/api/chapters');
        const chapters = await res.json();
        chapter = chapters.find(chap => String(chap.chapter_id) === String(current_chapter_id));
      }
    }
  
    if (chapter) {
      // 2. Extract region_id, chapter_id, chapter_name
      const regionId = chapter.region_id;
      const chapterId = chapter.chapter_id;
      const chapterName = chapter.chapter_name;
  
      // 3. Fetch all regions to get region name
      const regionRes = await fetch('http://localhost:5000/api/regions');
      const regions = await regionRes.json();
      const region = regions.find(r => String(r.region_id) === String(regionId));
      const regionName = region ? region.region_name : 'Unknown';
  
      // 4. Use a static or generated UUID for now
      const uuid = '726f7bf6-fa74-4883-b1bb-15acaf64dfb1'; // Example UUID
  
      // 5. Build the dynamic link
      const visitorLink = `https://bninewdelhi.com/visitors-payment/${chapterId}/${uuid}/${regionId}?type=refer&region=${encodeURIComponent(regionName)}&chapter=${encodeURIComponent(chapterName)}`;
  
      console.log('✅ Dynamic Visitor Payment Link:', visitorLink);
    } else {
      console.log('No chapter found for this user.');
    }
  }
  
  async function printNewMemberPaymentLink() {
    const loginType = getUserLoginType();
    let chapter = null;
  
    // 1. Get chapter object
    if (loginType === 'chapter') {
      const email = getUserEmail();
      const res = await fetch('http://localhost:5000/api/chapters');
      const chapters = await res.json();
      chapter = chapters.find(chap => chap.email_id && chap.email_id.toLowerCase() === email.toLowerCase());
    } else if (loginType === 'ro_admin') {
      const current_chapter_id = localStorage.getItem('current_chapter_id');
      if (current_chapter_id) {
        const res = await fetch('http://localhost:5000/api/chapters');
        const chapters = await res.json();
        chapter = chapters.find(chap => String(chap.chapter_id) === String(current_chapter_id));
      }
    }
  
    if (chapter) {
      // 2. Extract region_id, chapter_id, chapter_name
      const regionId = chapter.region_id;
      const chapterId = chapter.chapter_id;
      const chapterName = chapter.chapter_name;
  
      // 3. Fetch all regions to get region name
      const regionRes = await fetch('http://localhost:5000/api/regions');
      const regions = await regionRes.json();
      const region = regions.find(r => String(r.region_id) === String(regionId));
      const regionName = region ? region.region_name : 'Unknown';
  
      // 4. Use a static or generated UUID for now
      const uuid = '8c32021b-2918-4282-9de4-56949626eff7'; // Example UUID
  
      // 5. Build the dynamic link
      const newMemberLink = `https://bninewdelhi.com/new-member-payment/${chapterId}/${uuid}/${regionId}?region=${encodeURIComponent(regionName)}&chapter=${encodeURIComponent(chapterName)}`;
  
      console.log('✅ Dynamic New Member Payment Link:', newMemberLink);
    } else {
      console.log('No chapter found for this user.');
    }
  }
  
  async function openMemberSelectModal(paymentItem, idx) {
    // 1. Get current chapter_id (from localStorage or context)
    let chapterId = null;
    const loginType = getUserLoginType();
    let chapterName = "BNI Chapter";
    if (loginType === 'chapter') {
      const email = getUserEmail();
      const res = await fetch('http://localhost:5000/api/chapters');
      const chapters = await res.json();
      const chapter = chapters.find(chap => chap.email_id && chap.email_id.toLowerCase() === email.toLowerCase());
      chapterId = chapter ? chapter.chapter_id : null;
      chapterName = chapter ? chapter.chapter_name : chapterName;
    } else if (loginType === 'ro_admin') {
      chapterId = localStorage.getItem('current_chapter_id');
      // Fetch chapter name for ro_admin
      const res = await fetch('http://localhost:5000/api/chapters');
      const chapters = await res.json();
      const chapter = chapters.find(chap => String(chap.chapter_id) === String(chapterId));
      chapterName = chapter ? chapter.chapter_name : chapterName;
    }
  
    if (!chapterId) {
      Swal.fire('Error', 'No chapter found for this user.', 'error');
      return;
    }
  
    // 2. Fetch members for this chapter
    const membersRes = await fetch('http://localhost:5000/api/members');
    const allMembers = await membersRes.json();
    const members = allMembers.filter(m => String(m.chapter_id) === String(chapterId));
  
    // 3. Prepare member list HTML (with Select All)
    let memberListHtml = `
      <input type="text" id="memberSearchInput" class="swal2-input" placeholder="🔍 Search members..." style="margin-bottom:14px;border-radius:8px;border:1.5px solid #d01f2f;">
      <div style="margin-bottom:8px;">
        <input type="checkbox" id="selectAllMembers" style="accent-color:#d01f2f;width:18px;height:18px;vertical-align:middle;">
        <label for="selectAllMembers" style="font-weight:600;cursor:pointer;color:#d01f2f;font-size:1.08em;vertical-align:middle;margin-left:6px;">Select All</label>
      </div>
      <div id="memberCheckboxList" style="max-height:270px;overflow-y:auto;text-align:left;padding-right:4px;">
        ${members.map(m => `
          <div class="swal2-member-row" style="display:flex;align-items:center;gap:10px;padding:8px 0 8px 2px;border-radius:7px;transition:background 0.18s;">
            <input type="checkbox" id="member_${m.member_id}" value="${m.member_id}" style="accent-color:#d01f2f;width:18px;height:18px;">
            <label for="member_${m.member_id}" style="font-weight:600;cursor:pointer;flex:1;display:flex;align-items:center;gap:8px;">
              <i class="fas fa-user-circle" style="color:#d01f2f;font-size:1.2em;"></i>
              <span style="color:#d01f2f;font-size:1.08em;">${m.member_first_name} ${m.member_last_name}</span>
              <span style="color:#888;font-size:0.97em;margin-left:7px;">${m.member_email_address}</span>
            </label>
          </div>
        `).join('')}
      </div>
    `;
  
    // 4. Show SweetAlert2 modal
    Swal.fire({
      title: `<span style="color:#d01f2f;font-weight:700;font-size:1.45rem;letter-spacing:1px;display:flex;align-items:center;gap:10px;"><i class="fas fa-users"></i> Select Members</span>`,
      html: memberListHtml,
      showCancelButton: true,
      confirmButtonText: '<i class="fas fa-paper-plane"></i> Send',
      cancelButtonText: 'Cancel',
      customClass: {
        popup: 'swal2-member-modal'
      },
      width: 520,
      background: '#f9f9fb',
      showClass: {
        popup: 'animate__animated animate__fadeInDown'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp'
      },
      didOpen: () => {
        // Add search functionality
        const searchInput = document.getElementById('memberSearchInput');
        const checkboxList = document.getElementById('memberCheckboxList');
        searchInput.addEventListener('input', function() {
          const val = this.value.toLowerCase();
          checkboxList.querySelectorAll('.swal2-member-row').forEach(div => {
            const label = div.textContent.toLowerCase();
            div.style.display = label.includes(val) ? '' : 'none';
          });
        });
        // Add hover effect
        checkboxList.querySelectorAll('.swal2-member-row').forEach(div => {
          div.addEventListener('mouseenter', () => div.style.background = '#f3e9eb');
          div.addEventListener('mouseleave', () => div.style.background = '');
        });
  
        // --- Select All functionality ---
        const selectAll = document.getElementById('selectAllMembers');
        const memberCheckboxes = checkboxList.querySelectorAll('input[type="checkbox"]');
        selectAll.addEventListener('change', function() {
          memberCheckboxes.forEach(cb => { cb.checked = selectAll.checked; });
        });
        // If any individual checkbox is unchecked, uncheck "Select All"
        memberCheckboxes.forEach(cb => {
          cb.addEventListener('change', function() {
            if (!cb.checked) selectAll.checked = false;
            else if ([...memberCheckboxes].every(c => c.checked)) selectAll.checked = true;
          });
        });
      },
      preConfirm: async () => {
        // Collect selected member IDs
        const checked = Array.from(document.querySelectorAll('#memberCheckboxList input[type="checkbox"]:checked'))
          .map(cb => cb.value);
        if (checked.length === 0) {
          Swal.showValidationMessage('Please select at least one member.');
          return false;
        }
  
        // Prepare API payload
        const payload = {
          memberIds: checked,
          paymentLink: paymentItem.link,
          qrUrl: paymentItem.qr.replace('size=90x90', 'size=140x140'),
          paymentType: paymentItem.type,
          chapterName: chapterName
        };
  
        console.log("Sending payment links email payload:", payload);
  
        try {
          const response = await fetch('http://localhost:5000/api/send-payment-links', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });
  
          const result = await response.json();
          console.log("API response:", result);
  
          if (result.success) {
            Swal.fire({
              icon: 'success',
              title: 'Emails Sent!',
              text: result.message,
              timer: 2000,
              showConfirmButton: false
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'Failed to Send',
              text: result.message || 'Something went wrong.',
              timer: 2500,
              showConfirmButton: false
            });
          }
        } catch (err) {
          console.error("Error sending payment links email:", err);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to send emails. Please try again.',
            timer: 2500,
            showConfirmButton: false
          });
        }
  
        // Prevent modal from closing immediately
        return false;
      }
    });
  }
  
  // Helper to get all members for the current chapter
  async function fetchChapterMembers() {
    let chapterId = null;
    const loginType = getUserLoginType();
    if (loginType === 'chapter') {
      const email = getUserEmail();
      const res = await fetch('http://localhost:5000/api/chapters');
      const chapters = await res.json();
      const chapter = chapters.find(chap => chap.email_id && chap.email_id.toLowerCase() === email.toLowerCase());
      chapterId = chapter ? chapter.chapter_id : null;
    } else if (loginType === 'ro_admin') {
      chapterId = localStorage.getItem('current_chapter_id');
    }
    if (!chapterId) return [];
    const membersRes = await fetch('http://localhost:5000/api/members');
    const allMembers = await membersRes.json();
    return allMembers.filter(m => String(m.chapter_id) === String(chapterId));
  }
  
  // Attach this after DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    // Make dynamicLinks available globally for this handler
    window.dynamicLinks = window.dynamicLinks || [];
  
    // After you generate dynamicLinks in renderDynamicLinksTable, assign it globally:
    // window.dynamicLinks = dynamicLinks;
  
    const sendAllBtn = document.getElementById('sendAllLinksBtn');
    if (sendAllBtn) {
      sendAllBtn.onclick = async () => {
        // 1. Fetch all members for this chapter
        const members = await fetchChapterMembers();
        if (!members.length) {
          Swal.fire('No members found for this chapter!');
          return;
        }
  
        // 2. Prepare SweetAlert HTML (same as individual, but for all members)
        let memberListHtml = `
          <input type="text" id="memberSearchInput" class="swal2-input" placeholder="🔍 Search members..." style="margin-bottom:14px;border-radius:8px;border:1.5px solid #d01f2f;">
          <div style="margin-bottom:8px;">
            <input type="checkbox" id="selectAllMembers" style="accent-color:#d01f2f;width:18px;height:18px;vertical-align:middle;">
            <label for="selectAllMembers" style="font-weight:600;cursor:pointer;color:#d01f2f;font-size:1.08em;vertical-align:middle;margin-left:6px;">Select All</label>
          </div>
          <div id="memberCheckboxList" style="max-height:270px;overflow-y:auto;text-align:left;padding-right:4px;">
            ${members.map(m => `
              <div class="swal2-member-row" style="display:flex;align-items:center;gap:10px;padding:8px 0 8px 2px;border-radius:7px;transition:background 0.18s;">
                <input type="checkbox" id="member_${m.member_id}" value="${m.member_id}" style="accent-color:#d01f2f;width:18px;height:18px;">
                <label for="member_${m.member_id}" style="font-weight:600;cursor:pointer;flex:1;display:flex;align-items:center;gap:8px;">
                  <i class="fas fa-user-circle" style="color:#d01f2f;font-size:1.2em;"></i>
                  <span style="color:#d01f2f;font-size:1.08em;">${m.member_first_name} ${m.member_last_name}</span>
                  <span style="color:#888;font-size:0.97em;margin-left:7px;">${m.member_email_address}</span>
                </label>
              </div>
            `).join('')}
          </div>
        `;
  
        // 3. Show SweetAlert2 modal
        Swal.fire({
          title: `<span style="color:#d01f2f;font-weight:700;font-size:1.45rem;letter-spacing:1px;display:flex;align-items:center;gap:10px;"><i class="fas fa-users"></i> Select Members</span>`,
          html: memberListHtml,
          showCancelButton: true,
          confirmButtonText: '<i class="fas fa-paper-plane"></i> Send All',
          cancelButtonText: 'Cancel',
          customClass: {
            popup: 'swal2-member-modal'
          },
          width: 520,
          background: '#f9f9fb',
          showClass: {
            popup: 'animate__animated animate__fadeInDown'
          },
          hideClass: {
            popup: 'animate__animated animate__fadeOutUp'
          },
          didOpen: () => {
            // Add search functionality
            const searchInput = document.getElementById('memberSearchInput');
            const checkboxList = document.getElementById('memberCheckboxList');
            searchInput.addEventListener('input', function() {
              const val = this.value.toLowerCase();
              checkboxList.querySelectorAll('.swal2-member-row').forEach(div => {
                const label = div.textContent.toLowerCase();
                div.style.display = label.includes(val) ? '' : 'none';
              });
            });
            // Add hover effect
            checkboxList.querySelectorAll('.swal2-member-row').forEach(div => {
              div.addEventListener('mouseenter', () => div.style.background = '#f3e9eb');
              div.addEventListener('mouseleave', () => div.style.background = '');
            });
  
            // --- Select All functionality ---
            const selectAll = document.getElementById('selectAllMembers');
            const memberCheckboxes = checkboxList.querySelectorAll('input[type="checkbox"]');
            selectAll.addEventListener('change', function() {
              memberCheckboxes.forEach(cb => { cb.checked = selectAll.checked; });
            });
            memberCheckboxes.forEach(cb => {
              cb.addEventListener('change', function() {
                if (!cb.checked) selectAll.checked = false;
                else if ([...memberCheckboxes].every(c => c.checked)) selectAll.checked = true;
              });
            });
          },
          preConfirm: async () => {
            // Collect selected member IDs
            const checked = Array.from(document.querySelectorAll('#memberCheckboxList input[type="checkbox"]:checked'))
              .map(cb => cb.value);
            if (checked.length === 0) {
              Swal.showValidationMessage('Please select at least one member.');
              return false;
            }
  
            // Prepare all dynamic links and QR codes (reuse your dynamicLinks logic)
            const dynamicLinks = window.dynamicLinks || [];
            if (!dynamicLinks.length) {
              Swal.showValidationMessage('Dynamic links not found. Please refresh the page.');
              return false;
            }
  
            // Prepare payload: an array of {type, link, qr}
            const linksToSend = dynamicLinks.map(link => ({
              type: link.type,
              link: link.link,
              qr: link.qr.replace('size=90x90', 'size=140x140')
            }));
  
            // Get chapter name
            const chapterName = document.querySelector('.page-title')?.textContent?.trim() || "BNI Chapter";
  
            // Send to backend
            const payload = {
              memberIds: checked,
              allLinks: linksToSend,
              chapterName: chapterName
            };
  
            console.log("Sending all payment links payload:", payload);
  
            try {
              const response = await fetch('http://localhost:5000/api/send-all-payment-links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              const result = await response.json();
              if (result.success) {
                Swal.fire('Success', result.message, 'success');
              } else {
                Swal.fire('Error', result.message || 'Failed to send emails', 'error');
              }
            } catch (err) {
              Swal.fire('Error', 'Failed to send emails. Please try again.', 'error');
            }
  
            // Prevent modal from closing immediately
            return false;
          }
        });
      };
    }
  });
  
  getChapterInfo();
  printMeetingPaymentLink();
  printVisitorPaymentLink();
  printNewMemberPaymentLink();
  