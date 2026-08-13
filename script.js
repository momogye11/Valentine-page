const CONFIG = {
    recipient: "Morgane",
    sender: "Mohamed",
    dates: "du 14 au 16 août 2026",
    destination: "Lamantin Beach",
    musicFile: "Guy2Bezbar - Je pense à toi (Paroles).mp3",
    callNumber: "+221782957169",
    messageNumber: "0695052125"
};

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const intro = document.getElementById("intro");
const startButton = document.getElementById("startButton");
const conversation = document.getElementById("conversation");
const conversationScroll = document.getElementById("conversationScroll");
const messages = document.getElementById("messages");
const messageTemplate = document.getElementById("messageTemplate");
const revealTemplate = document.getElementById("revealTemplate");
const typingIndicator = document.getElementById("typingIndicator");
const presenceText = document.getElementById("presenceText");
const replyArea = document.getElementById("replyArea");
const replyPrompt = document.getElementById("replyPrompt");
const replyOptions = document.getElementById("replyOptions");
const textReplyForm = document.getElementById("textReplyForm");
const textReply = document.getElementById("textReply");
const confettiCanvas = document.getElementById("confettiCanvas");

const audio = new Audio(CONFIG.musicFile);
audio.loop = true;
audio.volume = 0.32;
audio.preload = "auto";

let interactionLocked = false;
let finalChoice = null;
let finalNote = "";
let activeConfettiFrame = null;

const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

function scrollToLatest() {
    requestAnimationFrame(() => {
        conversationScroll.scrollTo({
            top: conversationScroll.scrollHeight,
            behavior: prefersReducedMotion ? "auto" : "smooth"
        });
    });
}

function vibrate(pattern = 35) {
    if (!prefersReducedMotion && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}

function launchConfetti(options = {}) {
    if (prefersReducedMotion || !confettiCanvas) return;

    const context = confettiCanvas.getContext("2d");
    if (!context) return;

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    confettiCanvas.width = width * pixelRatio;
    confettiCanvas.height = height * pixelRatio;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const colors = ["#f4dfba", "#df8064", "#ffffff", "#7fc4b3", "#f0b84c", "#e89ab0"];
    const amount = options.amount || 150;
    if (activeConfettiFrame !== null) {
        cancelAnimationFrame(activeConfettiFrame);
    }

    const particles = Array.from({ length: amount }, () => ({
        x: width * (0.1 + Math.random() * 0.8),
        y: -20 - Math.random() * height * 0.32,
        vx: (Math.random() - 0.5) * 270,
        vy: 150 + Math.random() * 280,
        gravity: 130 + Math.random() * 150,
        size: 5 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 10,
        wave: Math.random() * Math.PI * 2
    }));

    const startedAt = performance.now();
    const duration = options.duration || 3200;
    let previousFrame = startedAt;

    function draw(now) {
        const delta = Math.min((now - previousFrame) / 1000, 0.034);
        previousFrame = now;
        context.clearRect(0, 0, width, height);

        particles.forEach((particle) => {
            particle.vy += particle.gravity * delta;
            particle.vx *= Math.pow(0.62, delta);
            particle.x += (particle.vx + Math.sin(particle.wave) * 28) * delta;
            particle.y += particle.vy * delta;
            particle.wave += 4.2 * delta;
            particle.rotation += particle.spin * delta;

            context.save();
            context.translate(particle.x, particle.y);
            context.rotate(particle.rotation);
            context.fillStyle = particle.color;
            context.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
            context.restore();
        });

        if (now - startedAt < duration) {
            activeConfettiFrame = requestAnimationFrame(draw);
        } else {
            context.clearRect(0, 0, width, height);
            activeConfettiFrame = null;
        }
    }

    activeConfettiFrame = requestAnimationFrame(draw);
}

function startMusic() {
    if (!audio.paused) return;
    audio.play().catch(() => {
        // La plupart des navigateurs bloquent le son avant le premier geste.
        // Le clic d’entrée ci-dessous relance alors la lecture immédiatement.
    });
}

// Tente l’autoplay dès l’ouverture, puis garantit le démarrage au premier geste
// si le navigateur exige une interaction utilisateur.
startMusic();
document.addEventListener("pointerdown", startMusic, { once: true, capture: true });
document.addEventListener("keydown", startMusic, { once: true, capture: true });

function setLocked(locked) {
    interactionLocked = locked;
    replyArea.classList.toggle("is-waiting", locked);
    Array.from(replyOptions.children).forEach((button) => {
        button.disabled = locked;
    });
}

async function showTyping(duration = 720) {
    presenceText.textContent = "écrit…";
    typingIndicator.hidden = false;
    scrollToLatest();
    await wait(prefersReducedMotion ? 80 : duration);
    typingIndicator.hidden = true;
    presenceText.textContent = "en ligne";
}

function addMessage(author, text, options = {}) {
    const fragment = messageTemplate.content.cloneNode(true);
    const article = fragment.querySelector(".message");
    const authorLabel = fragment.querySelector(".message__author");
    const bubble = fragment.querySelector(".message__bubble");

    const isRecipient = author === "morgane";
    article.classList.toggle("message--morgane", isRecipient);
    article.classList.toggle("message--emphasis", Boolean(options.emphasis));
    authorLabel.textContent = isRecipient ? CONFIG.recipient : CONFIG.sender;
    bubble.textContent = text;
    messages.appendChild(fragment);
    scrollToLatest();
}

async function say(text, options = {}) {
    setLocked(true);
    await showTyping(options.delay ?? Math.min(1150, 480 + text.length * 12));
    addMessage("mohamed", text, options);
    await wait(prefersReducedMotion ? 30 : 180);
    setLocked(false);
}

function clearReplies() {
    replyOptions.replaceChildren();
    textReplyForm.hidden = true;
}

function ask(prompt, choices) {
    clearReplies();
    replyPrompt.textContent = prompt;

    choices.forEach((choice, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `reply-button${choice.primary ? " reply-button--primary" : ""}`;
        button.textContent = choice.label;
        button.addEventListener("click", async () => {
            if (interactionLocked) return;
            setLocked(true);
            addMessage("morgane", choice.label);
            clearReplies();
            vibrate(index === 0 ? 45 : 25);
            await wait(prefersReducedMotion ? 40 : 260);
            await choice.action();
        }, { once: true });
        replyOptions.appendChild(button);
    });

    setLocked(false);
    scrollToLatest();
    requestAnimationFrame(() => replyOptions.querySelector("button")?.focus({ preventScroll: true }));
}

async function startConversation() {
    startMusic();
    startButton.disabled = true;
    intro.classList.add("is-leaving");
    await wait(prefersReducedMotion ? 20 : 430);
    intro.hidden = true;
    conversation.hidden = false;
    conversationScroll.focus({ preventScroll: true });

    await say("Morgane… j’ai une petite question 👀");
    await say("Le week-end du 14 août, t’avais prévu d’être sage ? 😂");
    ask("Allez, réponds franchement 😌", [
        {
            label: "Oui… pourquoi ? 🤨",
            action: async () => {
                await say("Ah 😭 Bon… il va peut-être falloir revoir le programme 😂");
                await askPackingQuestion();
            }
        },
        {
            label: "Pas du tout 😌",
            action: async () => {
                await say("Parfait 😂 On va très bien s’entendre.");
                await askPackingQuestion();
            }
        },
        {
            label: "Ça dépend de toi 👀",
            action: async () => {
                await say("Ça dépend de moi ? Très mauvaise idée… j’adore 😂");
                await askPackingQuestion();
            }
        }
    ]);
}

async function askPackingQuestion() {
    await say("Bon, deuxième question 😌");
    await say("Si je t’embarque deux nuits au bord de la mer, tu mets quoi en premier dans ta valise ? 🌊");
    ask("Un seul choix hein, pas de triche 😂", [
        {
            label: "Mon maillot direct 😂",
            action: async () => {
                await say("Je vois que madame est déjà prête 😭🌊");
                await beginRevealLeadIn();
            }
        },
        {
            label: "Mon chargeur évidemment 😭",
            action: async () => {
                await say("Même en escapade, la batterie passe avant tout 😭😂");
                await beginRevealLeadIn();
            }
        },
        {
            label: "D’abord tu m’expliques 🤨",
            action: async () => {
                await say("Ah voilà… le mode inspectrice est activé 😂");
                await beginRevealLeadIn();
            }
        },
        {
            label: "Qui a dit que je venais ? 😂",
            action: async () => {
                await say("Personne… pour l’instant 😌 Laisse-moi finir 😂");
                await beginRevealLeadIn();
            }
        }
    ]);
}

async function beginRevealLeadIn() {
    await say("Bon, en vrai… j’avais envie de te faire une surprise 🤍");
    await say("Pas un cadeau qui finit au fond d’un tiroir 😭");
    await say("Plutôt une vraie pause : tu viens, tu poses tes affaires et tu profites 🌴☀️", { emphasis: true });
    await say("Et oui… j’ai vraiment tout organisé 😂");
    ask("Tu veux voir ? 👀", [
        {
            label: "Oui, montre-moi 😭",
            primary: true,
            action: revealTrip
        },
        {
            label: "J’ai peur de toi là 😂",
            action: async () => {
                await say("Tu peux 😂 Mais promis, la surprise vaut le coup 👀");
                await revealTrip();
            }
        }
    ]);
}

async function revealTrip() {
    await say("Ok… regarde bien 👀", { emphasis: true });
    setLocked(true);
    await wait(prefersReducedMotion ? 40 : 450);
    messages.appendChild(revealTemplate.content.cloneNode(true));
    launchConfetti();
    vibrate([50, 35, 80]);
    scrollToLatest();
    await wait(prefersReducedMotion ? 50 : 1000);
    await say("Surpriseee 🥳🎉");
    await say("Du 14 au 16 août : deux nuits au Lamantin Beach 🌊☀️");
    await say("Et oui, c’est déjà réservé 😌");
    await say("Deux nuits, deux chambres… oui madame, j’ai vraiment pensé à tout 😂🤍");
    await say("Bon… tu viens avec moi ou je dois sortir mes meilleurs arguments ? 😂", { emphasis: true });
    askFinalChoice();
}

function askFinalChoice() {
    ask("Alors madame ? 👀", [
        {
            label: "Oui, je viens 😭🤍",
            primary: true,
            action: async () => {
                finalChoice = "Oui, je viens au Lamantin Beach du 14 au 16 août 😭🤍";
                await say("Attends… c’est vraiment oui là ? 😭😂");
                await say("Ok, je reste calme… enfin j’essaie 🥳");
                await say("Je t’envoie tout le programme 🤍");
                launchConfetti({ amount: 90, duration: 2400 });
                showFinalPanel(
                    "Bon bah… c’est oui 😭🤍",
                    "Appelle-moi directement avant que tu changes d’avis 😂📞",
                    "call"
                );
            }
        },
        {
            label: "Je veux les détails 👀",
            action: async () => {
                finalChoice = "J’ai besoin de quelques détails avant de répondre.";
                await say("Je savais que le mode FBI allait revenir 😂🕵🏽‍♀️");
                await say("Vas-y, pose-moi toutes tes questions 👀");
                showTextReply();
            }
        },
        {
            label: "Laisse-moi réfléchir 🤍",
            action: async () => {
                finalChoice = "Je ne suis pas encore sûre pour le séjour du 14 au 16 août.";
                await say("Ça marche, prends ton temps 🤍");
                await say("Dis-moi juste ce qui te fait hésiter. Zéro pression.");
                showTextReply();
            }
        },
        {
            label: "Je ne peux pas 😕",
            action: async () => {
                finalChoice = "Je ne pourrai pas venir au séjour du 14 au 16 août.";
                await say("Ok, je comprends 🤍");
                await say("Merci de me le dire franchement. Promis, pas de procès 😂");
                showFinalPanel("C’est noté 🤍", "Tu peux m’envoyer ta réponse sans avoir à tout réécrire.");
            }
        }
    ]);
}

function showTextReply() {
    clearReplies();
    replyPrompt.textContent = "Écris-moi ce que tu veux savoir 👇";
    textReplyForm.hidden = false;
    textReply.value = "";
    textReply.focus();
    setLocked(false);
    scrollToLatest();
}

textReplyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const value = textReply.value.trim();
    if (!value || interactionLocked) return;

    finalNote = value;
    setLocked(true);
    addMessage("morgane", value);
    textReplyForm.hidden = true;
    await say("Parfait, j’ai compris 👀 Envoie-moi ça et je te réponds.");
    showFinalPanel("À toi d’envoyer 😌", "Ta réponse est prête pour Mohamed.");
});

function buildTextMessage() {
    const lines = [
        `Coucou ${CONFIG.sender} 👀`,
        "",
        finalChoice || `Je te réponds pour le séjour ${CONFIG.dates} au ${CONFIG.destination}.`
    ];

    if (finalNote) {
        lines.push("", `Ce que je voulais ajouter : ${finalNote}`);
    }

    return lines.join("\n");
}

function showFinalPanel(title, copy, action = "message") {
    clearReplies();
    replyArea.hidden = true;
    const isCall = action === "call";

    const panel = document.createElement("section");
    panel.className = "final-panel";
    panel.dataset.action = action;
    panel.innerHTML = `
        <p class="final-panel__eyebrow">DERNIÈRE ÉTAPE</p>
        <h2></h2>
        <p class="final-panel__copy"></p>
        <button class="send-button" type="button">
            <span></span>
            <span aria-hidden="true">→</span>
        </button>
        <p class="send-help"></p>
    `;
    panel.querySelector("h2").textContent = title;
    panel.querySelector(".final-panel__copy").textContent = copy;
    panel.querySelector(".send-button span:first-child").textContent = isCall
        ? "Appelle-moi maintenant 📞"
        : "Envoyer mon message 💬";
    panel.querySelector(".send-help").textContent = isCall
        ? "Ton téléphone ouvrira l’appel. Rien ne démarre sans ta confirmation."
        : "L’app Messages s’ouvrira avec le texte déjà écrit. Rien ne part sans ton dernier clic.";
    panel.querySelector(".send-button").addEventListener("click", () => {
        if (isCall) {
            const callDigits = CONFIG.callNumber.replace(/\D/g, "");
            const cleanCallNumber = CONFIG.callNumber.trim().startsWith("+")
                ? `+${callDigits}`
                : callDigits;
            window.location.href = `tel:${cleanCallNumber}`;
            return;
        }

        const cleanMessageNumber = CONFIG.messageNumber.replace(/\D/g, "");
        const encodedMessage = encodeURIComponent(buildTextMessage());
        window.location.href = `sms:${cleanMessageNumber}?body=${encodedMessage}`;
    });

    messages.appendChild(panel);
    presenceText.textContent = "attend ta réponse";
    scrollToLatest();
}

startButton.addEventListener("click", startConversation, { once: true });
