const baseURL = window.location.hostname === "127.0.0.1" ? "http://127.0.0.1:5000" : "";
let currentSetId = null;

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const setId = params.get('setId');
    if (!setId) {
        window.location.href = 'publicsets.html';
        return;
    }

    try {
        const [setResponse, cardsResponse] = await Promise.all([
            fetch(`${baseURL}/api/sets/${setId}`, { credentials: 'include' }),
            fetch(`${baseURL}/api/sets/${setId}/cards`, { credentials: 'include' })
        ]);

        const [setData, cardsData] = await Promise.all([
            setResponse.json(),
            cardsResponse.json()
        ]);

        currentSetId = setId;
        document.getElementById('detail-title').textContent = setData.set.Title;
        document.getElementById('detail-description').textContent = setData.set.Description || '';

        const list = document.getElementById('card-list');
        list.innerHTML = (!cardsData.cards || cardsData.cards.length === 0)
            ? '<p class="no-results">Keine Karten in diesem Set</p>'
            : cardsData.cards.map(card => `
                <div class="card-item">
                    <strong>${card.Term}</strong><br>
                    ${card.Explanation}
                </div>
            `).join('');
    } catch (error) {
        console.error('Fehler beim Laden der Details:', error);
    }
});

function startGame(mode) {
    if (!currentSetId) return;
    const path = mode === "cards"
        ? `../games/cards/game.html?set=${currentSetId}`
        : mode === "match"
            ? `../games/match/game.html?set=${currentSetId}`
            : `../games/test/game.html?set=${currentSetId}`;
    window.location.href = path;
}