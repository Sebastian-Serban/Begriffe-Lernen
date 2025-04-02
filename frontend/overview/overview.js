document.addEventListener("DOMContentLoaded", () => {
    loadSets();
});

function toggleDarkMode() {
    document.body.classList.toggle("dark");
}

function loadSets() {
    fetch("http://127.0.0.1:5000/sets", {
        credentials: "include"
    })
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById("set-list");
            const emptyMsg = document.getElementById("empty-message");
            list.innerHTML = "";

            if (!data.success || data.sets.length === 0) {
                emptyMsg.classList.remove("hidden");
                return;
            }

            emptyMsg.classList.add("hidden");

            data.sets.forEach(set => {
                const div = document.createElement("div");
                div.className = "set-item";
                div.innerHTML = `
          <h4>${set.Title}</h4>
          <p>${set.Description || "Keine Beschreibung"}</p>
          <button onclick="playMode(${set.LearningSetID}, 'cards')">Karteikarten</button>
          <button onclick="playMode(${set.LearningSetID}, 'match')">Matching</button>
          <button onclick="editSet(${set.LearningSetID}, '${set.Title}', '${set.Description || ""}')">Bearbeiten</button>
          <button onclick="deleteSet(${set.LearningSetID})">Löschen</button>
        `;
                list.appendChild(div);
            });
        });
}

function playMode(setId, mode) {
    const path = mode === "cards"
        ? "../games/cards/game.html?set=" + setId
        : "../games/match/game.html?set=" + setId;
    window.location.href = path;
}

function showCreateForm() {
    document.getElementById("modal").classList.remove("hidden");
    addCardInput();
}

function closeModal() {
    document.getElementById("modal").classList.add("hidden");
    document.getElementById("cards-container").innerHTML = "";
    document.getElementById("set-title").value = "";
    document.getElementById("set-description").value = "";
}

function addCardInput(term = "", explanation = "") {
    const container = document.getElementById("cards-container");
    const termInput = document.createElement("input");
    const defInput = document.createElement("input");
    termInput.placeholder = "Begriff";
    termInput.value = term;
    defInput.placeholder = "Definition";
    defInput.value = explanation;
    container.appendChild(termInput);
    container.appendChild(defInput);
}

function createSet() {
    const title = document.getElementById("set-title").value;
    const description = document.getElementById("set-description").value;
    const inputs = document.querySelectorAll("#cards-container input");

    if (!title.trim()) return alert("Titel darf nicht leer sein!");

    const cards = [];
    for (let i = 0; i < inputs.length; i += 2) {
        const term = inputs[i].value.trim();
        const explanation = inputs[i + 1]?.value.trim();
        if (term && explanation) {
            cards.push({ Term: term, Explanation: explanation });
        }
    }

    fetch("http://127.0.0.1:5000/sets", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Title: title, Description: description, Score: 0 })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.Set && data.Set.length > 0) {
                const setId = data.Set[0].LearningSetID;
                return fetch(`http://127.0.0.1:5000/sets/${setId}/cards`, {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(cards)
                });
            }
        })
        .then(() => {
            closeModal();
            loadSets();
        })
        .catch(() => alert("Fehler beim Erstellen"));
}

function deleteSet(setId) {
    if (!confirm("Set wirklich löschen?")) return;
    fetch(`http://127.0.0.1:5000/sets/${setId}`, {
        method: "DELETE",
        credentials: "include"
    })
        .then(res => res.json())
        .then(() => loadSets());
}

function editSet(id, currentTitle, currentDescription) {
    const newTitle = prompt("Neuer Titel:", currentTitle);
    if (newTitle === null) return;

    const newDesc = prompt("Neue Beschreibung:", currentDescription);
    if (newDesc === null) return;

    fetch(`http://127.0.0.1:5000/sets/${id}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Title: newTitle, Description: newDesc })
    })
        .then(() => loadSets());
}
