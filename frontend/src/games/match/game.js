document.addEventListener("DOMContentLoaded", function (event) {
    const shuffle = [];
    const grid_cards = [];
    const baseURL = window.location.hostname === "127.0.0.1" ? "http://127.0.0.1:5000" : "";
    const gamestate = {
        selected_cards: [],
        time: "0.00s",
        matches: [],
        timerInterval: null,
        startTime: null,
        isAnimating: false,

        startTimer() {
            this.startTime = Date.now();
            const timerDisplay = document.getElementById("timer");
            this.timerInterval = setInterval(() => {
                const elapsed = (Date.now() - this.startTime) / 1000;
                this.time = elapsed.toFixed(2) + "s";
                if (timerDisplay) {
                    timerDisplay.textContent = "Zeit: " + this.time;
                }
            }, 100);
        },

        stopTimer() {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        },

        setup() {
            const self = this;
            const params = new URLSearchParams(window.location.search);
            const set = params.get("set");

            fetch(`${baseURL}/api/sets/${set}/cards`, {
                method: "GET",
                credentials: "include"
            })
            .then(res => res.json())
            .then(result => {
                let availableCards = result.cards.slice();
                let cardCount = 6;
                let columns = 4;

                if (window.innerWidth <= 1024 && window.innerWidth > 768) {
                    cardCount = 6;
                    columns = 3;
                } else if (window.innerWidth <= 768) {
                    cardCount = 4;
                    columns = 2;
                }

                while (availableCards.length > cardCount) {
                    availableCards.splice(Math.floor(Math.random() * availableCards.length), 1);
                }

                const grid = document.getElementsByClassName("grid")[0];
                while (grid.firstChild) grid.removeChild(grid.firstChild);
                shuffle.length = 0;
                grid_cards.length = 0;
                self.matches.length = 0;
                self.selected_cards.length = 0;

                availableCards.forEach(card => {
                    shuffle.push(card.Term);
                    shuffle.push(card.Explanation);
                    self.matches.push({ Term: card.Term, Explanation: card.Explanation });
                });

                while (shuffle.length < cardCount * 2) {
                    shuffle.push("");
                }

                for (let i = shuffle.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffle[i], shuffle[j]] = [shuffle[j], shuffle[i]];
                }

                const totalItems = shuffle.length;
                const rows = Math.ceil(totalItems / columns);
                grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
                grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

                shuffle.forEach((cardText) => {
                    const div = document.createElement('div');
                    if (!cardText) {
                        div.style.visibility = "hidden";
                    }
                    div.textContent = cardText;
                    div.className = 'grid-item';

                    div.addEventListener("click", (event) => {
                        if (self.isAnimating) return;
                        if (self.selected_cards.length < 2) {
                            div.style.animation = "selectOnce 0.2s ease forwards";
                            self.selected_cards.push(event.target);
                        }
                        if (self.selected_cards.length === 2) {
                            self.isAnimating = true;
                            self.getmatches();
                        }
                    });

                    grid_cards.push(div);
                    grid.appendChild(div);
                });

                self.startTimer();
            })
            .catch(err => {
                console.error(err);
            });
        },

        getmatches() {
            const [card1, card2] = this.selected_cards;
            if (!card1 || !card2) return;
            const match = this.matches.find((m) =>
                [card1.textContent, card2.textContent].includes(m.Term) &&
                [card1.textContent, card2.textContent].includes(m.Explanation) &&
                card1.textContent !== card2.textContent
            );

            if (match) {
                card1.style.animation = "correctAnswer 0.2s ease forwards";
                card2.style.animation = "correctAnswer 0.2s ease forwards";
                setTimeout(() => {
                    card1.style.visibility = "hidden";
                    card2.style.visibility = "hidden";
                    this.matches.splice(this.matches.indexOf(match), 1);
                    this.selected_cards = [];
                    this.isAnimating = false;
                    if (this.matches.length === 0) {
                        this.stopTimer();
                        alert("You win. Time: " + this.time);
                        this.time = "0.00s";
                        shuffle.length = 0;
                        grid_cards.length = 0;
                        this.matches.length = 0;
                        this.selected_cards.length = 0;
                    }
                }, 200);
            } else {
                card1.style.animation = "deselectOnce 0.2s ease forwards";
                card2.style.animation = "deselectOnce 0.2s ease forwards";
                setTimeout(() => {
                    card1.style.animation = "";
                    card2.style.animation = "";
                    this.selected_cards = [];
                    this.isAnimating = false;
                }, 200);
            }
        }
    };

    gamestate.setup();

    /*
    document.getElementById("start").addEventListener("click", () => {
        shuffle.length = 0;
        grid_cards.length = 0;
        gamestate.matches.length = 0;
        gamestate.selected_cards.length = 0;
        gamestate.setup();
    });
    */
});
