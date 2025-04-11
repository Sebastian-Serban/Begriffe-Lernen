document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const baseURL = window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:5000"
    : "";

    const formData = new FormData(this);

    try {
        const response = await fetch(`${baseURL}/api/login`, {
            method: "POST",
            body: formData,
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error("Submission failed")
        } else {
            const result = await response.json();
            if (result.success) {
                window.location.href = '../overview/overview.html'
            }
            console.log(result)
        }

    } catch (error) {
        console.error("Error:", error);
    }
})