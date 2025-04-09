document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const set = params.get("set");

    const form_container = document.getElementsByClassName("form-container")[0]

    const start_button = document.getElementById("startExam")

    start_button.addEventListener("click", () => {
        const result_container = document.getElementById("result-container")
        result_container.innerHTML = "";

        form_container.innerHTML = "";
        fetch(`/api/sets/${set}/cards`, {
            method: "GET",
            credentials: "include"
        })
            .then(res => res.json())
            .then(result => {

                const data = result.cards

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
                            user_inputs[i].style.backgroundColor = "green"
                        } else {
                            user_inputs[i].style.backgroundColor = "red"
                        }
                    }

                    result_field.innerText = score.toString();
                    result_container.appendChild(result_field)

                })
            })
    });
})