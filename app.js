import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, runTransaction, push, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCqWIikxKIHUCd830b0IWSBQxkUnbvZ4qI",
  authDomain: "hogwarts-87894.firebaseapp.com",
  projectId: "hogwarts-87894",
  storageBucket: "hogwarts-87894.firebasestorage.app",
  messagingSenderId: "493078785017",
  appId: "1:493078785017:web:8ab7d71fe2b3bb1f866b28",
  measurementId: "G-D7NFSKE07L"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Listen for Score Updates in Real-Time
const houses = ['Gryffindor', 'Slytherin', 'Ravenclaw', 'Hufflepuff'];

houses.forEach(house => {
    const scoreRef = ref(db, 'scores/' + house);
    onValue(scoreRef, (snapshot) => {
        const data = snapshot.val();
        document.getElementById(`score-${house.toLowerCase()}`).innerText = data || 0;
    });
});

// Listen for Ledger Updates
const ledgerRef = ref(db, 'ledger');
onValue(ledgerRef, (snapshot) => {
    const ledgerList = document.getElementById('ledger-list');
    ledgerList.innerHTML = ''; // Clear current list
    
    const data = snapshot.val();
    if (data) {
        // Convert object to array, sort by newest first, take last 20
        const entries = Object.values(data)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 20);

        entries.forEach(entry => {
            const li = document.createElement('li');
            const date = new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            li.innerHTML = `<span><strong>${entry.house}</strong> (+${entry.points}): ${entry.reason}</span> <span>${date}</span>`;
            ledgerList.appendChild(li);
        });
    }
});

// Award Points Function (Attached to window so inline HTML onclick works)
window.awardPoints = function(house, points) {
    const reasonInput = document.getElementById(`reason-${house.toLowerCase()}`);
    let reason = reasonInput.value.trim();
    
    if (!reason) {
        alert("Please enter a reason before awarding points!");
        return;
    }

    // 1. Update the score securely using a transaction
    const scoreRef = ref(db, 'scores/' + house);
    runTransaction(scoreRef, (currentScore) => {
        return (currentScore || 0) + points;
    });

    // 2. Add entry to the ledger
    push(ref(db, 'ledger'), {
        house: house,
        points: points,
        reason: reason,
        timestamp: serverTimestamp()
    });

    // Clear the input
    reasonInput.value = '';
}