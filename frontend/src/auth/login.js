const baseURL = window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:5000"
    : "";

document.addEventListener("DOMContentLoaded", async () => {
    fetch(`${baseURL}/api/session-check`, {
            credentials: 'include'
        }).then((res) => {
            if (res.status === 200) {
                window.location.href = '../profile/overview.html'
            } else {
                res.json().then((data) => console.log(data))
            }
        }).catch((error) => {
            console.log(error)
        })
})


document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const formData = new FormData(this);

    try {
        const response = await fetch(`${baseURL}/api/login`, {
            method: "POST",
            body: formData,
            credentials: "include"
        }).catch((error) => {
            console.log(error)
        });

        if (!response.ok) {
            throw new Error("Submission failed")
        } else {
            const result = await response.json();
            if (result.success) {
                window.location.href = '../profile/overview.html'
            }
            console.log(result)
        }

    } catch (error) {
        console.error("Error:", error);
    }
})