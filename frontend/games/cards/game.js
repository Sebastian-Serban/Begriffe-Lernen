document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const set = params.get("set");

    const data = await (await fetch(`http://127.0.0.1:5000/sets/${set}/cards`, {
        method: "GET",
        credentials: "include"
    })).json()

    const cards_container = document.getElementsByClassName("cards-wrapper")[0]

    console.log(data.cards)

    data.cards.forEach((card) => {
        const div = document.createElement('div');
        div.className = "flip-card"
        div.innerHTML = `<div class="flip-card-inner">
                            <div class="flip-card-front">
                                <p>${card.Term}</p>
                            </div>
                            <div class="flip-card-back">
                                <h1>${card.Explanation}</h1>
                            </div>
                        </div>`

        cards_container.appendChild(div)
    })

    const cards = document.querySelectorAll(".flip-card-inner");
    cards.forEach(card => {
        card.addEventListener("click", () => {
            card.classList.toggle("flipped");
        });
    });

    const card_list = document.getElementsByClassName("flip-card");
    let current_card = 0;

    card_list[current_card].style.display = "block";
    card_list[current_card].classList.add("next-show");

    document.getElementsByClassName("prev")[0].addEventListener("click", () => {
        if (current_card > 0) {
            const outgoing = card_list[current_card];
            const incoming = card_list[current_card - 1];

            outgoing.classList.remove("prev-show", "next-show");
            outgoing.classList.add("prev-hide");

            outgoing.addEventListener("animationend", () => {
                outgoing.style.display = "none";
                outgoing.classList.remove("prev-hide");
            }, {once: true});

            incoming.style.display = "block";
            incoming.classList.remove("next-hide");
            incoming.classList.add("prev-show");

            current_card--;
        }
    });

    document.getElementsByClassName("next")[0].addEventListener("click", () => {
        if (current_card < card_list.length - 1) {
            const outgoing = card_list[current_card];
            const incoming = card_list[current_card + 1];

            outgoing.classList.remove("prev-show", "next-show");
            outgoing.classList.add("next-hide");

            outgoing.addEventListener("animationend", () => {
                outgoing.style.display = "none";
                outgoing.classList.remove("next-hide");
            }, {once: true});

            incoming.style.display = "block";
            incoming.classList.remove("prev-hide");
            incoming.classList.add("next-show");

            current_card++;
        }
    });
});
