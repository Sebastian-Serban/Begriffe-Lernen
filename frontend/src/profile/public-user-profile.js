const baseURL = window.location.hostname === "127.0.0.1" ? "http://127.0.0.1:5000" : "";
let allSets = [];

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('userId');
    const username = params.get('username');

    if (!userId || !username) {
        window.location.href = 'publicsets.html';
        return;
    }

    document.getElementById('profile-username').textContent = `Profil von ${decodeURIComponent(username)}`;

    try {
        const response = await fetch(`${baseURL}/api/users/${userId}/sets`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.success && data.sets) {
            allSets = data.sets;
            displaySets(allSets);
        }
    } catch (error) {
        console.error('Fehler beim Laden der Sets:', error);
    }
});

function displaySets(sets) {
    const setsList = document.getElementById('set-list');
    setsList.innerHTML = sets.length === 0
        ? '<p class="no-results">Keine Lernsets vorhanden</p>'
        : sets.map(set => `
            <div class="set-card" onclick="window.location.href='public-set-detail.html?setId=${set.LearningSetID}'">
                <h3>${set.Title}</h3>
                <p>${set.Description || ''}</p>
            </div>
        `).join('');
}

function filterSets() {
    const term = document.getElementById('search-input').value.toLowerCase();
    const filtered = allSets.filter(set =>
        set.Title.toLowerCase().includes(term) ||
        (set.Description && set.Description.toLowerCase().includes(term))
    );
    displaySets(filtered);
}