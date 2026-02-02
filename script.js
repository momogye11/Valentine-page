// PERSONNALISATION
const personName = "Fatou Gueye"; // Change le prénom ici
const gifUrl = "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcDV5dGE5ZzJ6OHg5MnZ6dGE5ZzJ6OHg5MnZ6dGE5ZzJ6OHg5MnZ6dGEwaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/g5R9dok94mrIvplmZd/giphy.gif";
// Change l'URL du gif ici (trouve ton gif sur giphy.com ou tenor.com)

// Elements
const questionText = document.getElementById('questionText');
const yesBtn = document.getElementById('yesBtn');
const noBtn = document.getElementById('noBtn');
const buttonsContainer = document.getElementById('buttonsContainer');
const hintText = document.getElementById('hintText');
const successGif = document.getElementById('successGif');
const gifImage = document.getElementById('gifImage');
const card = document.querySelector('.card');

// Set initial text and gif
questionText.textContent = `${personName} veux-tu être ma Valentine ?`;
gifImage.src = gifUrl;

// Button "No" fleeing behavior
let isNoBtnActive = true;

function moveNoButton(mouseX, mouseY) {
    if (!isNoBtnActive) return;

    const btnRect = noBtn.getBoundingClientRect();
    const btnCenterX = btnRect.left + btnRect.width / 2;
    const btnCenterY = btnRect.top + btnRect.height / 2;

    const distance = Math.sqrt(
        Math.pow(mouseX - btnCenterX, 2) +
        Math.pow(mouseY - btnCenterY, 2)
    );

    const threshold = 120; // Distance seuil en pixels - détection normale

    if (distance < threshold) {
        // Mettre le bouton en mode "fleeing" (position absolute)
        noBtn.classList.add('fleeing');

        // Calcule une direction opposée à la souris
        const directionX = btnCenterX - mouseX;
        const directionY = btnCenterY - mouseY;
        const moveDistance = 100; // Distance de déplacement à chaque fuite

        // Normalise la direction
        const length = Math.sqrt(directionX * directionX + directionY * directionY);
        const normalizedX = directionX / length;
        const normalizedY = directionY / length;

        // Nouvelle position en s'éloignant de la souris
        let newX = btnRect.left - buttonsContainer.getBoundingClientRect().left + (normalizedX * moveDistance);
        let newY = btnRect.top - buttonsContainer.getBoundingClientRect().top + (normalizedY * moveDistance);

        // Limite dans la zone des boutons
        const containerRect = buttonsContainer.getBoundingClientRect();
        newX = Math.max(0, Math.min(newX, containerRect.width - btnRect.width));
        newY = Math.max(-50, Math.min(newY, 50));

        noBtn.style.left = `${newX}px`;
        noBtn.style.top = `${newY}px`;
    }
}

// Mouse move event for desktop
document.addEventListener('mousemove', (e) => {
    moveNoButton(e.clientX, e.clientY);
});

// Touch event for mobile
noBtn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!isNoBtnActive) return;

    noBtn.classList.add('fleeing');

    const containerRect = buttonsContainer.getBoundingClientRect();
    const btnRect = noBtn.getBoundingClientRect();
    const maxX = containerRect.width - btnRect.width;

    // Déplace vers une position aléatoire mais pas trop loin
    const currentX = btnRect.left - containerRect.left;
    const randomOffset = (Math.random() - 0.5) * 150; // Déplacement modéré
    const newX = Math.max(0, Math.min(currentX + randomOffset, maxX));
    const newY = (Math.random() - 0.5) * 60; // Petit mouvement vertical

    noBtn.style.left = `${newX}px`;
    noBtn.style.top = `${newY}px`;
});

// Click event for "No" button (just in case they catch it)
noBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!isNoBtnActive) return;

    noBtn.classList.add('fleeing');

    const containerRect = buttonsContainer.getBoundingClientRect();
    const btnRect = noBtn.getBoundingClientRect();
    const maxX = containerRect.width - btnRect.width;

    const currentX = btnRect.left - containerRect.left;
    const randomOffset = (Math.random() - 0.5) * 150;
    const newX = Math.max(0, Math.min(currentX + randomOffset, maxX));
    const newY = (Math.random() - 0.5) * 60;

    noBtn.style.left = `${newX}px`;
    noBtn.style.top = `${newY}px`;
});

// Click event for "Yes" button
yesBtn.addEventListener('click', () => {
    isNoBtnActive = false;

    // Change text
    questionText.textContent = 'OUAIS ! 🎉';

    // Hide buttons and hint
    buttonsContainer.classList.add('hide');
    hintText.classList.add('hide');

    // Show gif
    successGif.classList.add('show');
});
