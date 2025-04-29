const baseURL = window.location.hostname === "127.0.0.1" ? "http://127.0.0.1:5000" : "";
let currentPublicSetId = null;
let searchTimeout = null;

window.onload = loadRandomPublicSets;

function loadRandomPublicSets() {
    Promise.all([
        fetch(`${baseURL}/api/allsets`, { credentials: "include" }).then(res => res.json()),
        fetch(`${baseURL}/api/session-check`, { credentials: "include" }).then(res => res.json())
    ]).then(([setsData, sessionData]) => {
        if (!setsData.success || !sessionData.success) {
            document.getElementById("no-publicsets").classList.remove("hidden");
            return;
        }

        const allSets = setsData.sets;
        const currentUserEmail = sessionData.user.email;

        const publicSets = allSets.filter(set => set.User && set.User.Email !== currentUserEmail);

        if (publicSets.length > 0) {
            const randomSets = shuffleArray(publicSets).slice(0, 6);
            displayPublicSets(randomSets);
        } else {
            document.getElementById("no-publicsets").classList.remove("hidden");
        }
    }).catch(err => {
        console.error(err);
        document.getElementById("no-publicsets").classList.remove("hidden");
    });
}


function shuffleArray(array) {
    return array.sort(() => Math.random() - 0.5);
}

function searchPublicSets() {
    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
        const term = document.getElementById("search-input").value.trim();

        if (term.length === 0) {
            loadRandomPublicSets();
            return;
        }

        document.getElementById("public-set-list").innerHTML = "<p>🔎 Suche läuft...</p>";

        const searchByName = fetch(`${baseURL}/api/sets/name/${encodeURIComponent(term)}`, { credentials: "include" });
        const searchByUser = fetch(`${baseURL}/api/users/${encodeURIComponent(term)}`, { credentials: "include" });

        Promise.all([searchByName, searchByUser])
            .then(responses => Promise.all(responses.map(r => r.json())))
            .then(([setsData, usersData]) => {
                let results = [];

                if (setsData.success) {
                    results = setsData.sets.map(set => ({ ...set, Username: null }));
                }

                if (usersData.success && usersData.User.length > 0) {
                    const user = usersData.User[0];
                    fetch(`${baseURL}/api/users/${user.UserID}/sets`, { credentials: "include" })
                        .then(res => res.json())
                        .then(userSetsData => {
                            if (userSetsData.success) {
                                const userSets = userSetsData.sets.map(set => ({ ...set, Username: user.Username }));
                                results = results.concat(userSets);
                            }
                            displayPublicSets(results);
                        });
                } else {
                    displayPublicSets(results);
                }
            });
    }, 300);
}

function displayPublicSets(sets) {
    const list = document.getElementById("public-set-list");
    list.innerHTML = "";

    if (!sets || sets.length === 0) {
        document.getElementById("no-publicsets").classList.remove("hidden");
        return;
    }

    document.getElementById("no-publicsets").classList.add("hidden");

    sets.forEach(set => {
        const div = document.createElement("div");
        div.className = "set-card";
        div.innerHTML = `<h3>${set.Title}</h3><p>${set.Description || ""}</p><small>von ${set.Username || "Unbekannt"}</small>`;
        div.onclick = () => showPublicSetDetail(set.LearningSetID, set.Title, set.Description);
        list.appendChild(div);
    });
}

function showPublicSetDetail(id, title, description) {
    currentPublicSetId = id;
    document.getElementById("detail-title").textContent = title;
    document.getElementById("detail-description").textContent = description;
    fetch(`${baseURL}/api/sets/${id}/cards`, { credentials: "include" })
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById("card-list");
            list.innerHTML = "";
            if (!data.success || !data.cards) return;
            data.cards.forEach(card => {
                const item = document.createElement("div");
                item.className = "card-item";
                item.innerHTML = `<strong>${card.Term}</strong><br>${card.Explanation}`;
                list.appendChild(item);
            });
            showPublicSection("detail-section");
        });
}

function startPublicGame(mode) {
    if (!currentPublicSetId) return;
    const path = mode === "cards"
        ? `../games/cards/game.html?set=${currentPublicSetId}`
        : mode === "match"
            ? `../games/match/game.html?set=${currentPublicSetId}`
            : `../games/test/game.html?set=${currentPublicSetId}`;
    window.location.href = path;
}

function backToPublicOverview() {
    showPublicSection("publicsets-section");
}

function showPublicSection(id) {
    document.querySelectorAll("main > section").forEach(s => s.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
}
