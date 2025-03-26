document.addEventListener("DOMContentLoaded", function (event) {
    const shuffle = []

    const gamestate = {
        selected_cards: [],
        time: "0.00s",
        matches: [],
        timerInterval: null,
        startTime: null,
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
            const self = this
            fetch("http://127.0.0.1:5000/sets/10/cards", {
                method: "GET",
                credentials: "include"
            })
            .then(res => res.json())
            .then(result => {
                result.cards.forEach(card => {
                    shuffle.push(card.Term)
                    shuffle.push(card.Explanation)
                    self.matches.push({"Term": card.Term, "Explanation": card.Explanation})
                });

                for (let i = shuffle.length - 1; i > 0; i--) {
                    let j = Math.floor(Math.random() * (i + 1));
                    let temp = shuffle[i];
                    shuffle[i] = shuffle[j];
                    shuffle[j] = temp;
                }

                const grid = document.getElementsByClassName("grid")[0];

                shuffle.forEach((card) => {
                    const div = document.createElement('div');

                    console.log(card)
                    div.className = 'grid-item';
                    div.textContent = card;

                    div.addEventListener("click", (button) => {
                        if (self.selected_cards.length < 2) {
                            div.style.backgroundColor = "green";
                            self.selected_cards.push(button.target)
                        }   if (self.selected_cards.length === 2) {
                                self.getmatches()
                            }
                    });

                    grid.appendChild(div);

                })
                self.startTimer();

            })
            .catch(err => {
                console.error("Game error:", err);
            });
        },
        getmatches() {
            console.log(document.getElementsByClassName("grid-item").length)
            this.matches.forEach((match) => {
                const [card1, card2] = this.selected_cards;
                console.log(card1.textContent)
                console.log(card2.textContent)

                const isMatch = (
                    (match.Term === card1.textContent && match.Explanation === card2.textContent) ||
                    (match.Term === card2.textContent && match.Explanation === card1.textContent)
                );

                if (isMatch) {
                    card1.style.visibility = "hidden";
                    card2.style.visibility = "hidden";
                    this.matches.splice(this.matches.indexOf(match), 1);
                } else {
                    card1.style.backgroundColor = "grey";
                    card2.style.backgroundColor = "grey";
                }

                this.selected_cards = [];
            });

            if (document.getElementsByClassName("grid-item").length === 0) {
                this.stopTimer();
                alert("You win. Time: " + this.time)
            }
        }
    }
    gamestate.setup();


})