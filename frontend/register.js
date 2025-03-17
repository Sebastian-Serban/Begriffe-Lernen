document.getElementById("registerForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const formData = new FormData(this)

    try {
        const response = await fetch("http://127.0.0.1:5000/register", {method: "POST", body: formData})

        if (!response.ok) {
            throw new Error("Register Failed")
        }

        const result = await response.json();
    } catch (error) {
        console.log("Error: " + error)
    }
});