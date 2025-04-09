document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const formData = new FormData(this);

    try {
        const response = await fetch("api/login", {
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