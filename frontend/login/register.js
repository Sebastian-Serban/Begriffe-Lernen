const baseURL = window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:5000"
    : ""

document.addEventListener("DOMContentLoaded", async () => {
    fetch(`${baseURL}/api/session-check`, {
            credentials: 'include'
        }).then((res) => {
            if (res.status === 200) {
                window.location.href = './overview/overview.html'
            } else {
                res.json().then((data) => console.log(data))
            }
        }).catch((error) => {
            console.log(error)
        })
})

document.getElementById("registerForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const formData = new FormData(this)

    try {
        const response = await fetch(`${baseURL}/api/register`, {
            method: "POST",
            body: formData,
            credentials: "include"
        }).catch((error) => {
            console.log(error)
        });

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