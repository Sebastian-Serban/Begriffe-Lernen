document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const setId = parseInt(params.get("set"), 10);
    const baseURL = window.location.hostname === "127.0.0.1" ? "http://127.0.0.1:5000" : "https://begriffe-lernen-backend.vercel.app";
    let currentCards = [];

    async function getUsername() {
        const res = await fetch(`${baseURL}/api/session-check`, { credentials: 'include' });
        if (!res.ok) throw new Error('Not logged in');
        const { user } = await res.json();
        return user.username;
    }

    async function getUserProgress() {
        try {
            const username = await getUsername();
            const res = await fetch(`${baseURL}/api/users/${username}`, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to get user data');
            const data = await res.json();
            const user = data.User[0] || {};
            const progress = user.Progress || [];
            const entry = progress.find(e => Number(e.LearningSetID) === setId);
            return entry ? entry.cards.map(id => Number(id)) : [];
        } catch (error) {
            console.error('Error in getUserProgress:', error);
            return [];
        }
    }

    document.getElementById("startExam").addEventListener("click", async () => {
        try {
            const knownCards = await getUserProgress();
            const res = await fetch(`${baseURL}/api/sets/${setId}/cards`, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to load cards');
            let { cards } = await res.json();

            cards = cards.filter(card => !knownCards.includes(Number(card.CardID)));
            currentCards = cards;

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
                div.innerHTML = `
                    <label for="q${idx}">${card.Term}</label>
                    <input id="q${idx}" class="question-field" />
                    <div class="solution" style="display: none; margin-top: 0.5rem; color: var(--primary);">
                        <strong>Richtige Antwort:</strong> ${card.Explanation}
                    </div>`;
                form.appendChild(div);
            });

            const resultContainer = document.getElementById("result-container");
            resultContainer.innerHTML = "";

            const buttonContainer = document.createElement("div");
            buttonContainer.className = "button-container";

            const checkButton = document.createElement("button");
            checkButton.textContent = "Überprüfen";
            checkButton.className = "check-button";

            const showSolutionsButton = document.createElement("button");
            showSolutionsButton.textContent = "Lösungen anzeigen";
            showSolutionsButton.className = "solution-button";
            showSolutionsButton.style.display = "none";

            buttonContainer.appendChild(checkButton);
            buttonContainer.appendChild(showSolutionsButton);
            form.appendChild(buttonContainer);

            let checked = false;

            checkButton.addEventListener("click", async () => {
                if (checked) return;
                checked = true;

                let score = 0;
                const learnedNow = [];
                const wrongAnswers = [];

                form.querySelectorAll(".question-field").forEach((input, i) => {
                    const userAnswer = input.value.trim().toLowerCase();
                    const correctAnswer = cards[i].Explanation.trim().toLowerCase();

                    if (userAnswer === correctAnswer) {
                        score++;
                        learnedNow.push(Number(cards[i].CardID));
                        input.style.backgroundColor = "#90EE90";
                    } else {
                        input.style.backgroundColor = "#FFB6C1";
                        wrongAnswers.push(i);
                    }
                    input.disabled = true;
                });

                resultContainer.innerHTML = `
                    <div class="result-box">
                        <h3>Prüfungsergebnis</h3>
                        <p>Richtige Antworten: ${score} von ${cards.length}</p>
                        <p>Quote: ${Math.round((score / cards.length) * 100)}%</p>
                    </div>`;

                if (wrongAnswers.length > 0) {
                    showSolutionsButton.style.display = "block";
                }

                await fetch(`${baseURL}/api/sets/${setId}/cards`, {
                    method: "PATCH",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        cards: learnedNow,
                        score: Math.round((score / cards.length) * 100)
                    })
                });
            });

            showSolutionsButton.addEventListener("click", () => {
                const solutions = form.querySelectorAll(".solution");
                const isShowing = solutions[0].style.display === "block";
                solutions.forEach(solution => {
                    solution.style.display = isShowing ? "none" : "block";
                });
                showSolutionsButton.textContent = isShowing ? "Lösungen anzeigen" : "Lösungen ausblenden";
            });

        } catch (err) {
            console.error(err);
            resultContainer.innerHTML = `
                <div class="error-message">
                    Es ist ein Fehler aufgetreten. Bitte versuche es später erneut.
                </div>`;
        }
    });
});