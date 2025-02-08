function getDecodedToken() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
        // Split the token and get the payload part
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        return payload;
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
}

function getUserEmail() {
    const decoded = getDecodedToken();
    return decoded ? decoded.email : null;
}

function getUserLoginType() {
    const decoded = getDecodedToken();
    return decoded ? decoded.login_type : null;
}

// Add this new function to handle My Account navigation
function handleMyAccountClick() {
    const loginType = getUserLoginType();
    let redirectUrl = '/';

    switch(loginType) {
        case 'ro_admin':
            redirectUrl = '/s/settings';
            break;
        case 'member':
            redirectUrl = '/s/member-settings';
            break;
        case 'chapter':
            redirectUrl = '/s/chapter-settings';
            break;
        default:
            console.error('Unknown login type:', loginType);
            return;
    }

    window.location.href = redirectUrl;
}

// Add new function to fetch and match chapter data


// Update the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', () => {
    // Existing My Account link code
    const myAccountLink = document.querySelector('a[href="#"].side-menu__item');
    if (myAccountLink && myAccountLink.querySelector('.side-menu__label').textContent.trim() === 'My Account') {
        myAccountLink.addEventListener('click', (e) => {
            e.preventDefault();
            handleMyAccountClick();
        });
    }

    
});

// Add after getUserLoginType()

function setChapterAccessForAdmin(chapterData) {
    const loginType = getUserLoginType();
    
    // Allow both RO admin and chapter access
    if (loginType !== 'ro_admin' && loginType !== 'chapter') {
        console.error('Unauthorized access');
        return false;
    }

    // For RO admin, store additional access data
    if (loginType === 'ro_admin') {
        sessionStorage.setItem('admin_chapter_access', JSON.stringify({
            chapter_id: chapterData.chapter_id,
            chapter_email: chapterData.email_id,
            accessed_by: getUserEmail(),
            timestamp: new Date().getTime()
        }));
    }
    
    return true;
}

function getAdminChapterAccess() {
    const accessData = sessionStorage.getItem('admin_chapter_access');
    return accessData ? JSON.parse(accessData) : null;
}

// Add this function to handle chapter dashboard access
function handleChapterDashboardAccess() {
    const loginType = getUserLoginType();
    const adminAccess = getAdminChapterAccess();
    
    // For RO admin with specific chapter access
    if (loginType === 'ro_admin' && adminAccess) {
        return {
            chapter_id: adminAccess.chapter_id,
            chapter_email: adminAccess.chapter_email
        };
    }
    
    // For regular chapter login
    if (loginType === 'chapter') {
        return {
            chapter_email: getUserEmail()
        };
    }
    
    return null;
}

// Add after handleChapterDashboardAccess()

function setMemberAccessForAdmin(memberData) {
    const loginType = getUserLoginType();
    
    // Allow both RO admin and member access
    if (loginType !== 'ro_admin' && loginType !== 'member') {
        console.error('Unauthorized access');
        return false;
    }

    // For RO admin, store additional access data
    if (loginType === 'ro_admin') {
        sessionStorage.setItem('admin_member_access', JSON.stringify({
            member_id: memberData.member_id,
            member_email: memberData.email_id,
            accessed_by: getUserEmail(),
            timestamp: new Date().getTime()
        }));
    }
    
    return true;
}

function getAdminMemberAccess() {
    const accessData = sessionStorage.getItem('admin_member_access');
    return accessData ? JSON.parse(accessData) : null;
}

function handleMemberDashboardAccess() {
    const loginType = getUserLoginType();
    const adminAccess = getAdminMemberAccess();
    
    // For RO admin with specific member access
    if (loginType === 'ro_admin' && adminAccess) {
        return {
            member_id: adminAccess.member_id,
            member_email: adminAccess.member_email
        };
    }
    
    // For regular member login
    if (loginType === 'member') {
        return {
            member_email: getUserEmail()
        };
    }
    
    return null;
}
