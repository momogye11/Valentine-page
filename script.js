// PERSONNALISATION
const personName = "Fatou"; // Change le prénom ici
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

// Le lecteur Apple Music est maintenant toujours visible en bas à droite

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
        // Déplacer le bouton dans .card pour qu'il soit relatif à la carte entière
        if (noBtn.parentElement !== card) {
            noBtn.classList.add('fleeing');
            card.appendChild(noBtn);
        }

        // Calcule une direction opposée à la souris
        const directionX = btnCenterX - mouseX;
        const directionY = btnCenterY - mouseY;
        const moveDistance = 100; // Distance de déplacement à chaque fuite

        // Normalise la direction
        const length = Math.sqrt(directionX * directionX + directionY * directionY);
        const normalizedX = directionX / length;
        const normalizedY = directionY / length;

        // Calcule position relative à la carte
        const cardRect = card.getBoundingClientRect();
        const currentX = btnRect.left - cardRect.left;
        const currentY = btnRect.top - cardRect.top;

        // Nouvelle position en s'éloignant de la souris
        let newX = currentX + (normalizedX * moveDistance);
        let newY = currentY + (normalizedY * moveDistance);

        // Limite dans tout le cadre blanc (carte)
        newX = Math.max(20, Math.min(newX, cardRect.width - btnRect.width - 20));
        newY = Math.max(20, Math.min(newY, cardRect.height - btnRect.height - 20));

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

    // Déplacer le bouton dans .card pour qu'il soit relatif à la carte entière
    if (noBtn.parentElement !== card) {
        noBtn.classList.add('fleeing');
        card.appendChild(noBtn);
    }

    const cardRect = card.getBoundingClientRect();
    const btnRect = noBtn.getBoundingClientRect();

    // Déplace vers une position aléatoire partout dans le cadre blanc
    const newX = Math.random() * (cardRect.width - btnRect.width - 40) + 20;
    const newY = Math.random() * (cardRect.height - btnRect.height - 40) + 20;

    noBtn.style.left = `${newX}px`;
    noBtn.style.top = `${newY}px`;
});

// Click event for "No" button (just in case they catch it)
noBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!isNoBtnActive) return;

    // Déplacer le bouton dans .card pour qu'il soit relatif à la carte entière
    if (noBtn.parentElement !== card) {
        noBtn.classList.add('fleeing');
        card.appendChild(noBtn);
    }

    const cardRect = card.getBoundingClientRect();
    const btnRect = noBtn.getBoundingClientRect();

    // Déplace vers une position aléatoire partout dans le cadre blanc
    const newX = Math.random() * (cardRect.width - btnRect.width - 40) + 20;
    const newY = Math.random() * (cardRect.height - btnRect.height - 40) + 20;

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
