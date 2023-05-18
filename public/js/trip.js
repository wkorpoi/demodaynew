document.addEventListener("DOMContentLoaded", function () {
    const button = document.getElementById("sendButton"); // Replace "sendButton" with the ID of your button
  
    button.addEventListener("click", function () {
      fetch("/api/test", {
        method: "GET",
      })
        .then((response) => {
          if (response.ok) {
            console.log("Message sent!");
          } else {
            console.error("Error sending message:", response.statusText);
          }
        })
        .catch((error) => console.error("Error sending message:", error));
    });
  });
  