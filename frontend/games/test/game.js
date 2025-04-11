document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const set = params.get("set");

    const getUsername = async () => {
        const res = await fetch(`${baseURL}/api/session-check`, {
            credentials: 'include'
        });

        if (!res.ok) throw new Error('Not logged in');

        const data = await res.json();
        return data.user.username;
    };

    const getUserProgress = async () => {
        try {
            const username = await getUsername();

            const res = await fetch(`${baseURL}/api/users/${username}`, {
                credentials: 'include'
            });

            if (!res.ok) throw new Error('Failed to get user data');

            const data = res.json().then((data => {
                const user = data.Set[0]
                const progress = user.Progress
                for (let i = 0; i < progress.length; i++) {
                    if (progress[i].LearningSetID === String(set)) {
                        return progress[0].cards
                    }
                }
            }))

            return data


        } catch (err) {
            console.error(err);
        }
    };


    const baseURL = window.location.hostname === "127.0.0.1"
        ? "http://127.0.0.1:5000"
        : "";

    const form_container = document.getElementsByClassName("form-container")[0]



    const start_button = document.getElementById("startExam")

    start_button.addEventListener("click", async () => {
        const known_cards = await getUserProgress(await getUsername())

        const result_container = document.getElementById("result-container")
        result_container.innerHTML = "";

        form_container.innerHTML = "";


        fetch(`${baseURL}/api/sets/${set}/cards`, {
            method: "GET",
            credentials: "include"
        })
            .then(res => res.json())
            .then(result => {

                let data = []

                if (known_cards) {
                    for (let i = 0; i < result.cards.length; i++) {
                        if (!known_cards.includes(result.cards[i].CardID)) {
                            data.push(result.cards[i])
                        }
                    }
                } else {
                    data = result.cards
                }


                for (let i = data.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [data[i], data[j]] = [data[j], data[i]];
                }

                let question_number = 0
                data.forEach((card) => {
                    const div = document.createElement("div")
                    div.className = "question";
                    div.innerHTML = `<label for="question${question_number}">${card.Term}</label>
                                 <input type="text" class="question-field" id="question${question_number}" name="Question">`;
                    question_number++;
                    form_container.appendChild(div)
                })

                const learned_cards = [];

                const result_field = document.createElement("p")

                const button = document.createElement("button")
                button.innerText = "Überprüfen"

                form_container.appendChild(button)

                button.addEventListener("click", () => {
                    let score = 0;
                    result_field.innerText = ""
                    const user_inputs = document.getElementsByClassName("question-field")
                    for (let i = 0; i < user_inputs.length; i++) {
                        if (user_inputs[i].value === data[i].Explanation) {
                            score++;
                            learned_cards.push(data[i].CardID)
                            user_inputs[i].style.backgroundColor = "green"
                        } else {
                            user_inputs[i].style.backgroundColor = "red"
                        }
                    }

                    result_field.innerText = score.toString();
                    result_container.appendChild(result_field)

                    fetch(`${baseURL}/api/sets/${set}/cards`, {
                        method: "PATCH",
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        credentials: "include",
                        body: JSON.stringify(learned_cards)
                    })
                })
            })
    });
})
