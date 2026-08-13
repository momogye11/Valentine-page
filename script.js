const CONFIG = {
    recipient: "Morgane",
    sender: "Mohamed",
    dates: "du 14 au 16 août 2026",
    destination: "Lamantin Beach",
    musicFile: "Guy2Bezbar - Je pense à toi (Paroles).mp3",
    whatsappNumber: ""
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
const soundControl = document.getElementById("soundControl");
const soundLabel = document.getElementById("soundLabel");

const audio = new Audio(CONFIG.musicFile);
audio.loop = true;
audio.volume = 0.28;
audio.preload = "metadata";

let isMusicPlaying = false;
let interactionLocked = false;
let finalChoice = null;
let finalNote = "";

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

async function toggleMusic() {
    if (isMusicPlaying) {
        audio.pause();
        isMusicPlaying = false;
    } else {
        try {
            await audio.play();
            isMusicPlaying = true;
        } catch {
            isMusicPlaying = false;
        }
    }

    soundControl.setAttribute("aria-pressed", String(isMusicPlaying));
    soundControl.setAttribute("aria-label", isMusicPlaying ? "Couper la musique" : "Activer la musique");
    soundLabel.textContent = isMusicPlaying ? "Couper la musique" : "Avec musique";
}

soundControl.addEventListener("click", toggleMusic);

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
    startButton.disabled = true;
    intro.classList.add("is-leaving");
    await wait(prefersReducedMotion ? 20 : 430);
    intro.hidden = true;
    conversation.hidden = false;
    conversationScroll.focus({ preventScroll: true });

    await say("Bon. Avant toute chose : le week-end du 14 août, tu comptais être raisonnable ?");
    ask("Réponds franchement", [
        {
            label: "Oui, pourquoi ?",
            action: async () => {
                await say("Alors il va falloir annuler cette ambition.");
                await askPackingQuestion();
            }
        },
        {
            label: "Pas du tout",
            action: async () => {
                await say("Parfait. On vient de gagner beaucoup de temps.");
                await askPackingQuestion();
            }
        },
        {
            label: "Ça dépend de toi",
            action: async () => {
                await say("Très bonne réponse. Beaucoup trop bonne, même.");
                await askPackingQuestion();
            }
        }
    ]);
}

async function askPackingQuestion() {
    await say("Question très sérieuse maintenant.");
    await say("Pour disparaître deux nuits au bord de l’eau, tu prends quoi en premier ?");
    ask("Un seul choix, pas de triche", [
        {
            label: "Un maillot",
            action: async () => {
                await say("Logique. Au moins, tu suis le décor.");
                await beginRevealLeadIn();
            }
        },
        {
            label: "Mon chargeur",
            action: async () => {
                await say("Le chargeur avant le maillot… j’aurais dû m’en douter.");
                await beginRevealLeadIn();
            }
        },
        {
            label: "Je veux savoir où",
            action: async () => {
                await say("Toujours l’interrogatoire avant l’aventure. D’accord.");
                await beginRevealLeadIn();
            }
        },
        {
            label: "Je ne disparais pas comme ça 😭",
            action: async () => {
                await say("Et tu as raison. Donc je vais arrêter de tourner autour du pot.");
                await beginRevealLeadIn();
            }
        }
    ]);
}

async function beginRevealLeadIn() {
    await say("Plus sérieusement…");
    await say("Je ne voulais pas juste te donner un objet qui finit dans un tiroir.");
    await say("Je voulais t’offrir une vraie pause. Rien à organiser, rien à gérer. Juste profiter.", { emphasis: true });
    await say("Oui, j’ai beaucoup trop réfléchi. Tu pourras te moquer après.");
    ask("Tu veux voir ?", [
        {
            label: "Montre-moi alors",
            primary: true,
            action: revealTrip
        },
        {
            label: "Je sens le piège",
            action: async () => {
                await say("Le seul piège, c’est que j’ai vraiment pensé à tout ça.");
                await revealTrip();
            }
        }
    ]);
}

async function revealTrip() {
    await say("Alors voilà, Morgane.", { emphasis: true });
    setLocked(true);
    await wait(prefersReducedMotion ? 40 : 450);
    messages.appendChild(revealTemplate.content.cloneNode(true));
    vibrate([50, 35, 80]);
    scrollToLatest();
    await wait(prefersReducedMotion ? 50 : 1000);
    await say("C’est réservé. Du 14 au 16 août. Deux nuits au Lamantin Beach.");
    await say("Pour la chambre, je préfère être clair avant que tu sortes ton regard d’inspectrice : la réservation actuelle est pour une chambre. Si tu préfères qu’on en ait deux, tu me le dis et je m’en occupe. Ton confort passe avant la surprise.");
    await say("Maintenant que le dossier est complet… est-ce que tu viens ?", { emphasis: true });
    askFinalChoice();
}

function askFinalChoice() {
    ask("Cette fois, c’est ta vraie réponse", [
        {
            label: "Oui, je suis partante 🤍",
            primary: true,
            action: async () => {
                finalChoice = "Oui, je suis partante pour le Lamantin Beach du 14 au 16 août 🤍";
                await say("Message reçu. Je vais essayer de rester calme environ huit secondes.");
                await say("Après ça, je t’envoie tout le programme.");
                showFinalPanel("C’est donc un oui.", "Le séjour est réservé. Il ne reste plus qu’à envoyer ta réponse à Mohamed.");
            }
        },
        {
            label: "Oui, mais deux chambres",
            action: async () => {
                finalChoice = "Oui, je suis partante, mais je préfère qu’on ait deux chambres.";
                await say("C’est noté. Deux chambres, aucune discussion. Je m’en occupe.");
                showFinalPanel("Partante, avec deux chambres.", "Ta limite est claire et elle sera respectée. Tu peux envoyer la réponse telle quelle.");
            }
        },
        {
            label: "J’ai besoin de détails",
            action: async () => {
                finalChoice = "J’ai besoin de quelques détails avant de répondre.";
                await say("Je savais que l’interrogatoire allait arriver.");
                await say("Et tu as raison : demande-moi tout ce que tu veux.");
                showTextReply();
            }
        },
        {
            label: "Je ne suis pas sûre",
            action: async () => {
                finalChoice = "Je ne suis pas encore sûre pour le séjour du 14 au 16 août.";
                await say("Aucun stress. C’est une vraie invitation, pas un piège avec chronomètre.");
                await say("Dis-moi simplement ce qu’il te faut pour décider.");
                showTextReply();
            }
        },
        {
            label: "Je ne pourrai pas",
            action: async () => {
                finalChoice = "Je ne pourrai pas venir au séjour du 14 au 16 août.";
                await say("D’accord, aucun souci. Merci de me l’avoir dit franchement.");
                await say("Et promis : zéro relance bizarre.");
                showFinalPanel("Réponse enregistrée sur cette page.", "Tu peux prévenir Mohamed en un geste, sans avoir à reformuler.");
            }
        }
    ]);
}

function showTextReply() {
    clearReplies();
    replyPrompt.textContent = "Ajoute ce que tu veux lui dire";
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
    await say("Bien reçu. Là, au moins, je sais exactement quoi te répondre.");
    showFinalPanel("À toi d’envoyer.", "Ta réponse et ta question sont prêtes pour Mohamed.");
});

function buildWhatsAppMessage() {
    const lines = [
        `Coucou ${CONFIG.sender}, j’ai terminé ton site 👀`,
        "",
        finalChoice || `Je te réponds pour le séjour ${CONFIG.dates} au ${CONFIG.destination}.`
    ];

    if (finalNote) {
        lines.push("", `Ce que je voulais ajouter : ${finalNote}`);
    }

    return lines.join("\n");
}

function showFinalPanel(title, copy) {
    clearReplies();
    replyArea.hidden = true;

    const panel = document.createElement("section");
    panel.className = "final-panel";
    panel.innerHTML = `
        <p class="final-panel__eyebrow">DERNIÈRE ÉTAPE</p>
        <h2></h2>
        <p class="final-panel__copy"></p>
        <button class="send-button" type="button">
            <span>Envoyer ma réponse à Mohamed</span>
            <span aria-hidden="true">→</span>
        </button>
        <p class="send-help">WhatsApp s’ouvrira avec le message déjà écrit. Rien ne part sans ton dernier clic.</p>
    `;
    panel.querySelector("h2").textContent = title;
    panel.querySelector(".final-panel__copy").textContent = copy;
    panel.querySelector(".send-button").addEventListener("click", () => {
        const encodedMessage = encodeURIComponent(buildWhatsAppMessage());
        const cleanNumber = CONFIG.whatsappNumber.replace(/\D/g, "");
        const base = cleanNumber
            ? `https://wa.me/${cleanNumber}`
            : "https://wa.me/";
        window.location.href = `${base}?text=${encodedMessage}`;
    });

    messages.appendChild(panel);
    presenceText.textContent = "attend ta réponse";
    scrollToLatest();
}

startButton.addEventListener("click", startConversation, { once: true });
