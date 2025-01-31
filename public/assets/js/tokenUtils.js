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
