document.addEventListener("DOMContentLoaded", function () {
    const button = document.getElementById("sendButton"); // Replace "sendButton" with the ID of your button
  
    button.addEventListener("click", function () {
      console.log('hi')
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


$(document).ready(function(){
	$(window).bind('scroll', function() {
		var navHeight = $('.main-header').height();
		if ($(window).scrollTop() > navHeight) {
			$('.nav-bar').addClass('fixed');
			$('.nav-1').addClass('toleft');
		 }
		else {
			$('.nav-bar').removeClass('fixed');
			$('.nav-1').removeClass('toleft');
		 }
	});
});
  


