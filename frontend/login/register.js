document.getElementById("registerForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const formData = new FormData(this)

    try {
        const response = await fetch("/api/register", {
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