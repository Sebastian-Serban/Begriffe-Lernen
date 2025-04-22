const baseURL = window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:5000"
    : "";

document.addEventListener("DOMContentLoaded", async () => {
    fetch(`${baseURL}/api/session-check`, {
        credentials: 'include'
    }).then((res) => {
        if (res.status === 200) {
            window.location.href = '../profile/overview.html';
        } else {
            res.json().then((data) => console.log(data));
        }
    }).catch((error) => {
        console.log(error);
    });
});

function showPopup(message) {
    const popup = document.createElement("div");
    popup.className = "popup-message";
    popup.innerText = message;
    document.body.appendChild(popup);

    setTimeout(() => {
        popup.remove();
    }, 4000);
}

document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const formData = new FormData(this);

    try {
        const response = await fetch(`${baseURL}/api/login`, {
            method: "POST",
            body: formData,
            credentials: "include"
        });

        if (!response.ok) {
            if (response.status === 401) {
                showPopup("Login fehlgeschlagen – überprüfe deine Eingaben.");
            } else {
                showPopup("Login fehlgeschlagen.");
            }
            return;
        }

        const result = await response.json();
        if (result.success) {
            window.location.href = '../profile/overview.html';
        }
    } catch (error) {
        showPopup("Ein Fehler ist aufgetreten.");
        console.error("Error:", error);
    }
});
