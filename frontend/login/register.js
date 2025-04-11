document.getElementById("registerForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const formData = new FormData(this)

    const baseURL = window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:5000"
    : ""

    try {
        const response = await fetch(`${baseURL}/api/register`, {
            method: "POST",
            body: formData,
            credentials: "include"
        })

        if (!response.ok) {
            throw new Error("Register Failed")
        }

        const result = await response.json();
        if (result.success) {
            window.location.href = '../overview/overview.html'
        }
    } catch (error) {
        console.log("Error: " + error)
    }
});