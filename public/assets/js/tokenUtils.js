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
