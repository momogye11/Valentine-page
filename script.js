// PERSONNALISATION
const personName = "Fatou"; // Change le prénom ici
const gifUrl = "https://media.giphy.com/media/g5R9dok94mrIvplmZd/giphy.gif"; // GIF célébration
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

// YouTube Player API
let audioStarted = false;
let player;
const soundBtn = document.getElementById('sound-btn');

// Charge l'API YouTube
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// Callback quand l'API est prête
function onYouTubeIframeAPIReady() {
    player = new YT.Player('youtube-player', {
        height: '0',
        width: '0',
        videoId: '2Vv-BfVoq4g', // Perfect - Ed Sheeran
        playerVars: {
            'autoplay': 0,
            'controls': 0,
            'start': 20, // Démarre à 20 secondes
            'loop': 1,
            'playlist': '2Vv-BfVoq4g'
        },
        events: {
            'onReady': onPlayerReady
        }
    });
}

function onPlayerReady(event) {
    console.log('YouTube player prêt');
}

function startAudio() {
    if (audioStarted) return;
    audioStarted = true;

    if (player && player.playVideo) {
        player.setVolume(50);
        player.playVideo();
        console.log('Musique YouTube démarrée à 20 secondes');

        // Cache le bouton après démarrage
        if (soundBtn) {
            soundBtn.style.display = 'none';
        }
    }
}

// Bouton pour activer le son
if (soundBtn) {
    soundBtn.addEventListener('click', startAudio);
}

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

        // Grande marge de sécurité pour éviter d'être coincé
        const marginX = 80; // Marge horizontale
        const marginY = 80; // Marge verticale

        // Limite dans tout le cadre blanc (carte) avec marges
        newX = Math.max(marginX, Math.min(newX, cardRect.width - btnRect.width - marginX));
        newY = Math.max(marginY, Math.min(newY, cardRect.height - btnRect.height - marginY));

        // Si trop proche des bords, téléporte de l'autre côté
        if (newX < marginX + 20) {
            newX = cardRect.width - btnRect.width - marginX - 20;
        } else if (newX > cardRect.width - btnRect.width - marginX - 20) {
            newX = marginX + 20;
        }

        if (newY < marginY + 20) {
            newY = cardRect.height - btnRect.height - marginY - 20;
        } else if (newY > cardRect.height - btnRect.height - marginY - 20) {
            newY = marginY + 20;
        }

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

    // Grande marge pour éviter les bords
    const marginX = 80;
    const marginY = 80;

    // Déplace vers une position aléatoire avec marges de sécurité
    const newX = Math.random() * (cardRect.width - btnRect.width - marginX * 2) + marginX;
    const newY = Math.random() * (cardRect.height - btnRect.height - marginY * 2) + marginY;

    noBtn.style.left = `${newX}px`;
    noBtn.style.top = `${newY}px`;
});

// Click event for "No" button (affiche emoji triste)
noBtn.addEventListener('click', (e) => {
    e.preventDefault();

    // Affiche l'emoji triste
    questionText.textContent = '😢';
    questionText.style.fontSize = '120px';

    // Cache les boutons et le hint
    buttonsContainer.classList.add('hide');
    hintText.classList.add('hide');
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
