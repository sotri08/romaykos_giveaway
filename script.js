let client;
let participants = [];
let winners = [];
let giveawayStarted = false;
let currentWinnerIndex = 0;

// Elements
const loginBtn = document.getElementById("loginBtn");
const statusDiv = document.getElementById("status");
const keywordInput = document.getElementById("keyword");
const numWinnersInput = document.getElementById("numWinners");
const startBtn = document.getElementById("startBtn");
const nextWinnerBtn = document.getElementById("nextWinnerBtn");
const participantsList = document.getElementById("participantsList");
const winnersList = document.getElementById("winnersList");
const totalEntries = document.getElementById("totalEntries");
const copyOverlayBtn = document.getElementById("copyOverlayBtn");

// Overlay elements
const overlayParticipants = document.getElementById("overlayParticipants");
const overlayWinners = document.getElementById("overlayWinners");

let twitchUsername = "";
let oauthToken = "";

// Connect Twitch via OAuth implicit flow
loginBtn.addEventListener("click", () => {
  const clientId = "btqiji4z2k335xpgmy9roji6yyhqoo"; // Remplace par ton client ID Twitch
  const redirectUri = window.location.origin + window.location.pathname;
  const scope = "chat:read";
  const url = `https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  window.location = url;
});

// Check token from URL hash
window.addEventListener("load", () => {
  if (window.location.hash) {
    const params = new URLSearchParams(window.location.hash.substring(1));
    oauthToken = params.get("access_token");
    if (oauthToken) {
      fetch("https://api.twitch.tv/helix/users", {
        headers: {
          "Authorization": `Bearer ${oauthToken}`,
          "Client-Id": "076pnhzc4n17ee57wy4bylq8od7z8w"
        }
      })
      .then(res => res.json())
      .then(data => {
        twitchUsername = data.data[0].login;
        statusDiv.textContent = `Connecté à ${twitchUsername}`;
        initTwitchClient();
      });
    }
  }
});

function initTwitchClient() {
  client = new tmi.Client({
    identity: { username: twitchUsername, password: `oauth:${oauthToken}` },
    channels: [twitchUsername]
  });

  client.connect().then(() => {
    console.log("TMI.js connecté");
    client.on("message", (channel, tags, message) => {
      if (!giveawayStarted) return;
      const key = keywordInput.value.trim() || "!enter";
      if (message.trim().toLowerCase() === key.toLowerCase()) {
        if (!participants.includes(tags.username)) {
          participants.push(tags.username);
          updateParticipants();
        }
      }
    });
  }).catch(console.error);
}

// Start Giveaway
startBtn.addEventListener("click", () => {
  giveawayStarted = true;
  startBtn.disabled = true;
  nextWinnerBtn.disabled = false;
  alert("Giveaway lancé ! Plus personne ne peut rejoindre.");
});

// Next Winner
nextWinnerBtn.addEventListener("click", () => {
  if (participants.length === 0 || currentWinnerIndex >= numWinnersInput.value) {
    alert("Tous les gagnants ont été tirés !");
    nextWinnerBtn.disabled = true;
    return;
  }

  nextWinnerBtn.disabled = true;
  setTimeout(() => {
    const randomIndex = Math.floor(Math.random() * participants.length);
    const winner = participants.splice(randomIndex, 1)[0];
    winners.push(winner);
    updateParticipants();
    updateWinners();
    currentWinnerIndex++;
    nextWinnerBtn.disabled = currentWinnerIndex < numWinnersInput.value && participants.length > 0 ? false : true;
  }, 3000);
});

function updateParticipants() {
  participantsList.innerHTML = participants.map(p => `<li>${p}</li>`).join("");
  totalEntries.textContent = participants.length;
  if (overlayParticipants) overlayParticipants.innerHTML = participants.map(p => `<li>${p}</li>`).join("");
}

function updateWinners() {
  winnersList.innerHTML = winners.map(w => `<li>${w}</li>`).join("");
  if (overlayWinners) overlayWinners.innerHTML = winners.map(w => `<li>${w}</li>`).join("");
}

// Copy overlay link for OBS
copyOverlayBtn.addEventListener("click", () => {
  const url = window.location.origin + "/overlay.html";
  navigator.clipboard.writeText(url).then(() => alert("Lien overlay copié !"));
});

