import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, onValue, runTransaction, push, serverTimestamp, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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
const houses = ['Gryffindor', 'Slytherin', 'Ravenclaw', 'Hufflepuff'];

// 1. Listen for Score Updates
houses.forEach(house => {
    const scoreRef = ref(db, 'scores/' + house);
    onValue(scoreRef, (snapshot) => {
        const data = snapshot.val();
        const scoreEl = document.getElementById(`score-${house.toLowerCase()}`);
        
        // Update text
        scoreEl.innerText = data || 0;
        
        // Trigger animation
        scoreEl.classList.remove('animate-pop');
        void scoreEl.offsetWidth; // Trigger reflow to restart animation
        scoreEl.classList.add('animate-pop');
    });
});

// 2. Listen for and Sync Members
houses.forEach(house => {
    const memberInput = document.getElementById(`members-${house.toLowerCase()}`);
    const memberRef = ref(db, 'members/' + house);
    
    // Read from DB
    onValue(memberRef, (snapshot) => {
        const data = snapshot.val();
        // Only update if the user isn't currently typing in this specific box
        if (document.activeElement !== memberInput) {
            memberInput.value = data || '';
        }
    });

    // Write to DB when user finishes typing (clicks away or hits enter)
    memberInput.addEventListener('change', (e) => {
        set(memberRef, e.target.value.trim());
    });
});

// 3. Listen for Ledger Updates
const ledgerRef = ref(db, 'ledger');
onValue(ledgerRef, (snapshot) => {
    const ledgerList = document.getElementById('ledger-list');
    ledgerList.innerHTML = ''; 
    
    const data = snapshot.val();
    if (data) {
        const entries = Object.values(data)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 15); // Show last 15 entries

        entries.forEach(entry => {
            const li = document.createElement('li');
            const date = new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            // Color code the house name in the ledger
            const houseColor = `var(--${entry.house.toLowerCase()}-main)`;
            
            li.innerHTML = `
                <span><strong style="color: ${houseColor}">${entry.house}</strong> (+${entry.points}): ${entry.reason}</span> 
                <span style="color: #666; font-size: 0.9em">${date}</span>
            `;
            ledgerList.appendChild(li);
        });
    }
});

// 4. Award Points Function
window.awardPoints = function(house, points) {
    const reasonInput = document.getElementById(`reason-${house.toLowerCase()}`);
    let reason = reasonInput.value.trim();
    
    if (!reason) {
        // Flash the input red if empty
        reasonInput.style.borderColor = 'red';
        setTimeout(() => reasonInput.style.borderColor = 'rgba(255,255,255,0.2)', 1000);
        return;
    }

    const scoreRef = ref(db, 'scores/' + house);
    runTransaction(scoreRef, (currentScore) => {
        return (currentScore || 0) + points;
    });

    push(ref(db, 'ledger'), {
        house: house,
        points: points,
        reason: reason,
        timestamp: serverTimestamp()
    });

    reasonInput.value = ''; // Clear input
}