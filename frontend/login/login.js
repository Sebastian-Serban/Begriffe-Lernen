document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const formData = new FormData(this);

    try {
        const response = await fetch("http://127.0.0.1:5000/login", {
            method: "POST",
            body: formData,
            credentials: "include"
        });

        if (!response.ok) throw new Error("Submission failed");

        const result = await response.json();
        console.log(result)
    } catch (error) {
        console.error("Error:", error);
    }
})