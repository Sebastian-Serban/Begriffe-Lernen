let currentSetId = null;
let allSets = [];
const baseURL = window.location.hostname === "127.0.0.1"
  ? "http://127.0.0.1:5000"
  : "";

function showSection(id) {
    document.querySelectorAll("main > section").forEach(s => s.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
}

function loadSets() {
    fetch(`${baseURL}/api/sets`, { credentials: "include" })
        .then(res => res.json())
        .then(data => {
            allSets = data.sets || [];
            displaySets(allSets);
            loadSessionUser();
        });
}


function displaySets(sets) {
    const list = document.getElementById("set-list");
    list.innerHTML = "";
    if (!sets || sets.length === 0) {
        document.getElementById("no-sets").classList.remove("hidden");
        return;
    }
    document.getElementById("no-sets").classList.add("hidden");
    sets.forEach(set => {
        const div = document.createElement("div");
        div.className = "set-card";
        div.innerHTML = `<h3>${set.Title}</h3><p>${set.Description || ""}</p>`;
        div.onclick = () => showSetDetail(set.LearningSetID, set.Title, set.Description);
        list.appendChild(div);
    });
}

function filterSets() {
    const term = document.getElementById("search-input").value.toLowerCase();
    const filtered = allSets.filter(s => s.Title.toLowerCase().includes(term));
    displaySets(filtered);
}

function toggleAccountMenu() {
    document.getElementById("account-menu").classList.toggle("hidden");
}

function loadSessionUser() {
    fetch(`${baseURL}/api/session-check`, { credentials: "include" })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                document.getElementById("account-user").textContent = data.user.username;
            }
        });
}

function logout() {
    fetch(`${baseURL}/api/logout`, { method: "POST", credentials: "include" })
        .then(() => window.location.href = "../index.html");
}

function showSetDetail(id, title, description) {
    currentSetId = id;
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
            showSection("detail-section");
        });
}

function startGame(mode) {
    if (!currentSetId) return;
    const path = mode === "cards"
        ? `../games/cards/game.html?set=${currentSetId}`
        : mode === "match"
            ? `../games/match/game.html?set=${currentSetId}`
            : `../games/test/game.html?set=${currentSetId}`;
    window.location.href = path;
}

function deleteCurrentSet() {
    if (!confirm("Wirklich löschen?")) return;
    fetch(`${baseURL}/api/sets/${currentSetId}`, {
        method: "DELETE",
        credentials: "include"
    })
        .then(() => {
            backToOverview();
            loadSets();
        });
}

function editCurrentSet() {
    fetch(`${baseURL}/api/sets/${currentSetId}/cards`, { credentials: "include" })
        .then(res => res.json())
        .then(data => {
            document.getElementById("new-set-title").value = document.getElementById("detail-title").textContent;
            document.getElementById("new-set-description").value = document.getElementById("detail-description").textContent;
            document.getElementById("card-inputs").innerHTML = "";
            if (data.success && data.cards) {
                data.cards.forEach(card => addCardField(card.Term, card.Explanation));
            }
            showSection("create-section");
            document.getElementById("create-step-1").classList.add("hidden");
            document.getElementById("create-step-2").classList.remove("hidden");
        });
}

function backToOverview() {
    showSection("overview-section");
}

function startCreateFlow() {
    currentSetId = null;
    document.getElementById("new-set-title").value = "";
    document.getElementById("new-set-description").value = "";
    document.getElementById("card-inputs").innerHTML = "";
    showSection("create-section");
    document.getElementById("create-step-1").classList.remove("hidden");
    document.getElementById("create-step-2").classList.add("hidden");
}

function nextCreateStep() {
    const title = document.getElementById("new-set-title").value.trim();
    if (!title) return alert("Titel angeben");
    document.getElementById("create-step-1").classList.add("hidden");
    document.getElementById("create-step-2").classList.remove("hidden");
    addCardField();
}

function addCardField(term = "", explanation = "") {
    const wrapper = document.createElement("div");
    wrapper.className = "card-field";
    wrapper.innerHTML = `
    <input type="text" placeholder="Begriff" value="${term}">
    <input type="text" placeholder="Definition" value="${explanation}">
  `;
    document.getElementById("card-inputs").appendChild(wrapper);
}

function saveNewSet() {
    const title = document.getElementById("new-set-title").value;
    const description = document.getElementById("new-set-description").value;
    const cardNodes = document.querySelectorAll(".card-field");
    const cards = Array.from(cardNodes).map(div => {
        const [term, expl] = div.querySelectorAll("input");
        return { Term: term.value, Explanation: expl.value };
    }).filter(c => c.Term && c.Explanation);

    const method = currentSetId ? "POST" : "POST";
    const url = currentSetId ? `${baseURL}/api/sets/${currentSetId}` : `${baseURL}/api/sets`;
    const body = JSON.stringify({ Title: title, Description: description, Score: 0 });

    fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body
    })
        .then(res => res.json())
        .then(data => {
            const id = currentSetId || data.Set[0].LearningSetID;
            return fetch(`${baseURL}/api/sets/${id}/cards`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(cards)
            });
        })
        .then(() => {
            cancelCreate();
            loadSets();
        });
}

function cancelCreate() {
    showSection("overview-section");
}

window.onload = loadSets;
