let currentSetId = null;
const API = "http://127.0.0.1:5000";

function showSection(id) {
    document.querySelectorAll("main > section").forEach(s => s.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
}

function loadSets() {
    fetch(`${API}/sets`, { credentials: "include" })
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById("set-list");
            list.innerHTML = "";
            if (!data.success || data.sets.length === 0) {
                document.getElementById("no-sets").classList.remove("hidden");
                return;
            }
            document.getElementById("no-sets").classList.add("hidden");
            data.sets.forEach(set => {
                const div = document.createElement("div");
                div.className = "set-card";
                div.innerHTML = `<h3>${set.Title}</h3><p>${set.Description || ""}</p>`;
                div.onclick = () => showSetDetail(set.LearningSetID, set.Title, set.Description);
                list.appendChild(div);
            });
        });
}

function showSetDetail(id, title, description) {
    currentSetId = id;
    document.getElementById("detail-title").textContent = title;
    document.getElementById("detail-description").textContent = description;
    fetch(`${API}/sets/${id}/cards`, { credentials: "include" })
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
        : `../games/match/game.html?set=${currentSetId}`;
    window.location.href = path;
}

function deleteCurrentSet() {
    if (!confirm("Wirklich löschen?")) return;
    fetch(`${API}/sets/${currentSetId}`, {
        method: "DELETE",
        credentials: "include"
    })
        .then(() => {
            backToOverview();
            loadSets();
        });
}

function backToOverview() {
    showSection("overview-section");
}

function startCreateFlow() {
    document.getElementById("new-set-title").value = "";
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
    const cardNodes = document.querySelectorAll(".card-field");
    const cards = Array.from(cardNodes).map(div => {
        const [term, expl] = div.querySelectorAll("input");
        return { Term: term.value, Explanation: expl.value };
    }).filter(c => c.Term && c.Explanation);

    fetch(`${API}/sets`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Title: title, Description: "", Score: 0 })
    })
        .then(res => res.json())
        .then(data => {
            const id = data.Set[0].LearningSetID;
            return fetch(`${API}/sets/${id}/cards`, {
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
