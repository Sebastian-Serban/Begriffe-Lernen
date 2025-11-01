const baseURL = window.location.hostname === "127.0.0.1" ? "http://127.0.0.1:5000" : "";
let currentPublicSetId = null;
let searchTimeout = null;

window.onload = loadRandomPublicSets;

function loadRandomPublicSets() {
    Promise.all([
        fetch(`${baseURL}/api/allsets`, { credentials: "include" }).then(res => res.json()),
        fetch(`${baseURL}/api/session-check`, { credentials: "include" }).then(res => res.json())
    ]).then(([setsData, sessionData]) => {
        console.log("Sets Data:", setsData);
        if (!setsData.success || !sessionData.success) {
            document.getElementById("set-list").innerHTML = '<p class="no-results">Keine Lernsets gefunden</p>';
            return;
        }

        const allSets = setsData.sets;

        if (allSets.length > 0) {
            displaySearchResults([], allSets);
        } else {
            displaySearchResults([], []);
        }
    }).catch(err => {
        console.error(err);
        displaySearchResults([], []);
    });
}

function handleSearch() {
    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
        const term = document.getElementById("search-input").value.trim();

        if (term.length === 0) {
            loadRandomPublicSets();
            return;
        }

        if (term.length < 2) {
            displaySearchResults([], []);
            return;
        }

        const searchByName = fetch(`${baseURL}/api/sets/name/${encodeURIComponent(term)}`, { credentials: "include" });
        const searchByUser = fetch(`${baseURL}/api/users/${encodeURIComponent(term)}`, { credentials: "include" });

        Promise.all([searchByName, searchByUser])
            .then(responses => Promise.all(responses.map(r => r.json())))
            .then(([setsData, usersData]) => {
                let results = [];
                const users = usersData.success ? usersData.User : [];

                if (setsData.success) {
                    results = setsData.sets;
                }

                if (users.length > 0) {
                    Promise.all(users.map(user =>
                        fetch(`${baseURL}/api/users/${user.UserID}/sets`, { credentials: "include" })
                            .then(res => res.json())
                            .then(userSetsData => {
                                if (userSetsData.success) {
                                    return userSetsData.sets;
                                }
                                return [];
                            })
                    )).then(userSets => {
                        console.log("User Sets:", userSets);
                        const flatSets = userSets.flat();
                        displaySearchResults(users, [...results, ...flatSets]);
                    });
                } else {
                    displaySearchResults(users, results);
                }
            });
    }, 300);
}

function displaySearchResults(users, sets) {
    const usersList = document.getElementById('users-list');
    usersList.innerHTML = users.length === 0
        ? '<p class="no-results">Keine Benutzer gefunden</p>'
        : users.map(user => `
            <div class="user-card" onclick="window.location.href='public-user-profile.html?userId=${user.UserID}&username=${encodeURIComponent(user.Username)}'">
                <h3>${user.Username}</h3>
            </div>
        `).join('');

    const setsList = document.getElementById('set-list');
    setsList.innerHTML = sets.length === 0
        ? '<p class="no-results">Keine Lernsets gefunden</p>'
        : sets.map(set => {
            console.log("Set:", set);
            return `
                <div class="set-card" onclick="window.location.href='public-set-detail.html?setId=${set.LearningSetID}'">
                    <h3>${set.Title}</h3>
                    <p>${set.Description || ''}</p>
                    <small>von ${set.Username}</small>
                </div>
            `;
        }).join('');
}





async function showUserProfile(userId, username) {
    try {
        const response = await fetch(`${baseURL}/api/users/${userId}/sets`, {
            credentials: 'include'
        });
        const data = await response.json();

        document.getElementById('profile-username').textContent = `Profil von ${username}`;
        const setsList = document.getElementById('profile-sets-list');

        if (data.success && data.sets && data.sets.length > 0) {

            const setsWithUsername = data.sets.map(set => ({
                ...set,
                User: { Username: username }
            }));
            displaySearchResults([], setsWithUsername);
            setsList.innerHTML = setsWithUsername.map(set => `
                <div class="set-card" onclick="showSetDetail(${set.LearningSetID})">
                    <h3>${set.Title}</h3>
                    <p>${set.Description || ''}</p>
                    <small>von ${username}</small>
                </div>
            `).join('');
        } else {
            setsList.innerHTML = '<p class="no-results">Keine Lernsets vorhanden</p>';
        }

        showSection('user-profile-section');
    } catch (error) {
        console.error('Fehler beim Laden des Profils:', error);
    }
}


async function showSetDetail(setId) {
    try {
        const [setResponse, cardsResponse] = await Promise.all([
            fetch(`${baseURL}/api/sets/${setId}`, { credentials: 'include' }),
            fetch(`${baseURL}/api/sets/${setId}/cards`, { credentials: 'include' })
        ]);

        const [setData, cardsData] = await Promise.all([
            setResponse.json(),
            cardsResponse.json()
        ]);

        currentPublicSetId = setId;
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

        showSection('detail-section');
    } catch (error) {
        console.error('Fehler beim Laden der Details:', error);
    }
}

function showSection(id) {
    document.querySelectorAll('main > section, .search-results').forEach(s => s.classList.add('hidden'));
    if (id === 'detail-section' || id === 'user-profile-section') {
        document.getElementById(id).classList.remove('hidden');
    } else {
        document.querySelector('.search-results').classList.remove('hidden');
    }
}

function backToSearch() {
    showSection('search-results');
}

function startGame(mode) {
    if (!currentPublicSetId) return;
    const path = mode === "cards"
        ? `../games/cards/game.html?set=${currentPublicSetId}`
        : mode === "match"
            ? `../games/match/game.html?set=${currentPublicSetId}`
            : `../games/test/game.html?set=${currentPublicSetId}`;
    window.location.href = path;
}