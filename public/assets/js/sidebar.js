async function fetchUniversalLinks() {
    try {
        const response = await fetch('https://bni-data-backend.onrender.com/api/universalLinks');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const links = await response.json();
        console.log('Fetched Links:', links); // Log the fetched links
        renderUniversalLinks(links);
    } catch (error) {
        console.error("Error fetching universal links:", error);
    }
}

function renderUniversalLinks(links) {
    // Select the slide menu for Transactions
    const slideMenu = document.querySelector('.fetch'); // This selects the <ul> under Transactions

    // Clear existing dynamic links to avoid duplicates on re-fetch
    const existingLinks = slideMenu.querySelectorAll('li.slide:not(:first-child)');
    existingLinks.forEach(link => link.remove()); // Remove all links except the first

    // Append the fetched links
    links.forEach(link => {
        const listItem = document.createElement('li');
        listItem.className = 'slide';
        listItem.innerHTML = `
        <a href="/t/manage-transactions?ulid=${link.ulid}" class="side-menu__item">${link.universal_link_name}</a>

        `;
        slideMenu.appendChild(listItem);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    fetchUniversalLinks();
});