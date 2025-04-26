document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const setId = parseInt(params.get("set"), 10);
    const baseURL = window.location.hostname === "127.0.0.1" ? "http://127.0.0.1:5000" : "";

    async function getUsername() {
        const res = await fetch(`${baseURL}/api/session-check`, { credentials: 'include' });
        if (!res.ok) throw new Error('Not logged in');
        const { user } = await res.json();
        return user.username;
    }

    async function getUserProgress() {
        const username = await getUsername();
        const res = await fetch(`${baseURL}/api/users/${username}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to get user data');
        const data = await res.json();
        const user = data.User[0] || {};
        const entry = (user.Progress || []).find(e => e.LearningSetID === setId);
        return (entry?.cards || []).map(id => parseInt(id, 10));
    }

    document.getElementById("startExam").addEventListener("click", async () => {
        try {
            const knownCards = await getUserProgress();
            const res = await fetch(`${baseURL}/api/sets/${setId}/cards`, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to load cards');
            let { cards } = await res.json();

            cards = cards.filter(card => !knownCards.includes(card.CardID));

            if (cards.length > 10) {
                cards = cards.sort(() => 0.5 - Math.random()).slice(0, 10);
            }

            for (let i = cards.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [cards[i], cards[j]] = [cards[j], cards[i]];
            }

            const form = document.querySelector(".form-container");
            form.innerHTML = "";

            cards.forEach((card, idx) => {
                const div = document.createElement("div");
                div.className = "question";
                div.innerHTML = `<label for="q${idx}">${card.Term}</label><input id="q${idx}" class="question-field" />`;
                form.appendChild(div);
            });

            const resultContainer = document.getElementById("result-container");
            const button = document.createElement("button");
            button.textContent = "Überprüfen";
            form.appendChild(button);

            button.addEventListener("click", async () => {
                let score = 0;
                const learnedNow = [];

                form.querySelectorAll(".question-field").forEach((input, i) => {
                    if (input.value === cards[i].Explanation) {
                        score++;
                        learnedNow.push(cards[i].CardID);
                        input.style.backgroundColor = "lightgreen";
                    } else {
                        input.style.backgroundColor = "lightcoral";
                    }
                });

                resultContainer.textContent = `Score: ${score}`;

                await fetch(`${baseURL}/api/sets/${setId}/cards`, {
                    method: "PATCH",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(learnedNow.map(n => parseInt(n, 10)))
                });
            });
        } catch (err) {
            console.error(err);
        }
    });
});
