// ==UserScript==
// @name         OrganiserV2
// @namespace    http://tampermonkey.net/
// @version      1.9
// @description  Floating UI with buttons that send different POST requests for gear sets or actions, with labels and grouping
// @author       Peekaboo
// @match        https://prisonstruggle.com/*
// @exclude      https://prisonstruggle.com/description*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      prisonstruggle.com
// @updateURL    https://raw.githubusercontent.com/ivan-kirov/prometheus/main/organizerV2.user.js
// @downloadURL  https://raw.githubusercontent.com/ivan-kirov/prometheus/main/organizerV2.user.js
// ==/UserScript==

(function () {
    'use strict';
    
    const STORAGE_KEY = 'equipmentLabels';    

    // Default labels fallback
    const defaultLabels = {
        five: 'PG Set',
        six: 'Santa Set',
        seven: 'Fighting',
        eight: 'Patriot Set',
        eleven: 'Patriot & Cupid Set',
        twelve: 'pat + ar',
        seventeen: 'grinch set',
        eighteen: 'g set + weapon',
        nineteen: 'pat + bow',
        twenty: 'santa'
    };

    let equipmentLabels = GM_getValue(STORAGE_KEY, null);
    if (!equipmentLabels) equipmentLabels = { ...defaultLabels };

    // ===== Styling for Floating UI =====
    const style = `
#floating-ui {
  position: fixed;
  top: 2vh;
  right: 2vw;
  max-width: 180px;
  min-width: 140px;
  max-height: 80vh;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.85);
  color: white;
  border: 1px solid #ccc;
  border-radius: 10px;
  padding: 12px 10px;
  z-index: 10000;
  font-family: Arial, sans-serif;
  font-size: 14px;
  box-sizing: border-box;
}

@media (max-width: 600px) {
  #floating-ui {
    top: auto;
    bottom: 20px;
    right: 10px;
    left: 10px;
    max-width: none;
    width: calc(100% - 20px);
    border-radius: 12px;
    font-size: 16px;
    max-height: 50vh;
  }
  #floating-ui button {
    font-size: 16px;
    padding: 10px;
  }
  #floating-ui h4 {
    font-size: 17px;
  }
}

#floating-ui h4 {
    margin: 10px 0 6px;
    padding-bottom: 4px;
    border-bottom: 1px solid #666;
    color: #FFD700;
    text-align: center;
}
#floating-ui button {
    display: block;
    margin: 6px auto;
    padding: 6px 10px;
    width: 100%;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 13px;
}

#fiveBtn {
    background: linear-gradient(90deg, #56ab2f, #a8e063) !important;
    color: black !important;
}
#sixBtn {
    background: linear-gradient(90deg, #134E5E, #71B280) !important;
    color: white !important;
}
#sevenBtn {
    background: linear-gradient(90deg, #FFD700, #FFC107) !important;
    color: black !important;
}
#eightBtn {
    background: linear-gradient(90deg, #FF512F, #DD2476) !important;
    color: white !important;
}
#elevenBtn {
    background: linear-gradient(90deg, #1D4350, #A43931) !important;
    color: white !important;
}
#twelveBtn {
    background: linear-gradient(90deg, #007991, #78ffd6) !important;
    color: black !important;
}
#seventeenBtn {
    background: linear-gradient(90deg, #4568DC, #B06AB3) !important;
    color: white !important;
}
#eighteenBtn {
    background: linear-gradient(90deg, #373B44, #4286f4) !important;
    color: white !important;
}
#nineteenBtn {
    background: linear-gradient(90deg, #FF6B6B, #556270) !important;
    color: white !important;
}
#twentyBtn {
    background: linear-gradient(90deg, #e53935, #b71c1c) !important;
    color: white !important;
}


#floating-ui button:hover { filter: brightness(1.1); }
.subsection { display: none; transition: all 0.3s ease-in-out; }
    `;
    GM_addStyle(style);
    initUI();
    hideLockedPrisonBusButtons();


    // ===== Create UI =====
    function initUI() {
        const existing = document.getElementById('floating-ui');
        if (existing) existing.remove(); // Prevent duplicates on re-init

        const container = document.createElement('div');
        container.id = 'floating-ui';
        const visibilityStorageKey = 'equipmentVisibility';

        // Load visibility settings or default all visible
        let visibilitySettings = GM_getValue(visibilityStorageKey, {});
        // Initialize defaults if empty
        Object.keys(equipmentLabels).forEach(key => {
            if (!(key in visibilitySettings)) visibilitySettings[key] = true;
        });

        // Create a visibility toggle section
        const visibilitySection = document.createElement('div');
        visibilitySection.style.marginTop = '10px';
        visibilitySection.innerHTML = `<h4>Show / Hide Buttons</h4>`;

        // Add a checkbox per equipment button
        Object.keys(equipmentLabels).forEach(key => {
            const id = `${key}Btn`;
            const checkboxId = `chk_${id}`;

            const label = document.createElement('label');
            label.style.display = 'block';
            label.style.cursor = 'pointer';
            label.htmlFor = checkboxId;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = checkboxId;
            checkbox.checked = visibilitySettings[key];
            checkbox.style.marginRight = '6px';

            checkbox.addEventListener('change', () => {
                visibilitySettings[key] = checkbox.checked;
                GM_setValue(visibilityStorageKey, visibilitySettings);
                const btn = document.getElementById(id);
                if (btn) btn.style.display = checkbox.checked ? 'block' : 'none';
            });

            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(equipmentLabels[key]));
            visibilitySection.appendChild(label);
        });

        // Apply visibility on buttons immediately
        Object.entries(visibilitySettings).forEach(([key, visible]) => {
            const btn = document.getElementById(`${key}Btn`);
            if (btn) btn.style.display = visible ? 'block' : 'none';
        });
        
        container.innerHTML = `
        <h4>Equipment</h4>
        <button id="fiveBtn"></button>
        <button id="sixBtn"></button>
        <button id="sevenBtn"></button>
        <button id="eightBtn"></button>
        <button id="elevenBtn"></button>
        <button id="twelveBtn"></button>
        <button id="seventeenBtn"></button>
        <button id="eighteenBtn"></button>
        <button id="nineteenBtn"></button>
        <button id="twentyBtn"></button>
        <h4>Actions</h4>
        <button id="UseBtn" style="background: #2196F3;">Use ▼</button>
        <div id="useSection" style="display: none;" class="subsection">
            <button id="healthBtn">Health Pill</button>
            <button id="mint5Btn">Mint x5</button>
            <button id="shardExpBtn">Shard Exp</button>
            <button id="shardTrainingBtn">Shard Training</button>
        </div>

        <button id="toggleBusBtn" style="background: #2196F3;">Prison Bus ▼</button>
        <div id="busSection" style="display: none;" class="subsection">
            <button id="PanamaBtn">Panama</button>
            <button id="AlcatrazBtn">Alcatraz</button>
            <button id="GuantanamoBayBtn">Guantanamo Bay</button>
            <button id="LongBayBtn">Long Bay</button>
            <button id="UtahBtn">Utah</button>
            <button id="DorchesterBtn">Dorchester</button>
            <button id="SanQuentinBtn">San Quentin</button>
            <button id="AtticaBtn">Attica</button>
            <button id="McNeilIslandBtn">McNeil Island</button>
            <button id="SingSingBtn">Sing Sing</button>
            <button id="DevilIslandBtn">Devil Island</button>
            <button id="RikerBtn">Riker</button>
        </div>
    `;

        container.appendChild(visibilitySection);
        document.body.appendChild(container);

        // Assign button labels
        for (const [key, label] of Object.entries(equipmentLabels)) {
            const btn = document.getElementById(`${key}Btn`);
            if (btn) btn.textContent = label;
        }

        // Add right-click event to edit labels inline
        Object.keys(equipmentLabels).forEach(key => {
            const btn = document.getElementById(`${key}Btn`);
            if (!btn) return;
            btn.addEventListener('contextmenu', e => {
                e.preventDefault();
                const newLabel = prompt(`Edit label for button "${equipmentLabels[key]}"`, equipmentLabels[key]);
                if (newLabel && newLabel.trim()) {
                    equipmentLabels[key] = newLabel.trim();
                    btn.textContent = equipmentLabels[key];
                    GM_setValue(STORAGE_KEY, equipmentLabels);
                    showToast(`Label for ${key} saved`);
                }
            });
        });

        // Re-bind toggles (ensure these don’t get bound multiple times if re-called)
        document.getElementById('UseBtn')?.addEventListener('click', () => {
            const section = document.getElementById('useSection');
            section.style.display = section.style.display === 'block' ? 'none' : 'block';
        });

        document.getElementById('toggleBusBtn')?.addEventListener('click', () => {
            const section = document.getElementById('busSection');
            section.style.display = section.style.display === 'block' ? 'none' : 'block';
        });
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.position = 'fixed';
        toast.style.bottom = '30px';
        toast.style.right = '30px';
        toast.style.background = '#333';
        toast.style.color = '#fff';
        toast.style.padding = '10px 16px';
        toast.style.borderRadius = '6px';
        toast.style.zIndex = '10001';
        toast.style.opacity = '0.9';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    // ===== Payload Definitions =====
    const payloads = {
        five: { rpfeature: '5', save1: '_0', save2: '_0', save3: '_0', save4: '_0', save5: '_0', save6: '_0', save7: '_0', save8: '_0', save9: '_0', save10: '_0' },
        six: { rpfeature: '6', save1: '_0', save2: '_0', save3: '_0', save4: '_0', save5: '_0', save6: '_0', save7: '_0', save8: '_0', save9: '_0', save10: '_0' },
        seven: { rpfeature: '7', save1: '_0', save2: '_0', save3: '_0', save4: '_0', save5: '_0', save6: '_0', save7: '_0', save8: '_0', save9: '_0', save10: '_0' },
        eight: { rpfeature: '8', save1: '_0', save2: '_0', save3: '_0', save4: '_0', save5: '_0', save6: '_0', save7: '_0', save8: '_0', save9: '_0', save10: '_0' },
        eleven: { rpfeature: '11', save1: '_0', save2: '_0', save3: '_0', save4: '_0', save5: '_0', save6: '_0', save7: '_0', save8: '_0', save9: '_0', save10: '_0' },
        twelve: { rpfeature: '12', save1: '_0', save2: '_0', save3: '_0', save4: '_0', save5: '_0', save6: '_0', save7: '_0', save8: '_0', save9: '_0', save10: '_0' },
        seventeen: { rpfeature: '17', save1: '_0', save2: '_0', save3: '_0', save4: '_0', save5: '_0', save6: '_0', save7: '_0', save8: '_0', save9: '_0', save10: '_0' },
        eighteen: { rpfeature: '18', save1: '_0', save2: '_0', save3: '_0', save4: '_0', save5: '_0', save6: '_0', save7: '_0', save8: '_0', save9: '_0', save10: '_0' },
        nineteen: { rpfeature: '19', save1: '_0', save2: '_0', save3: '_0', save4: '_0', save5: '_0', save6: '_0', save7: '_0', save8: '_0', save9: '_0', save10: '_0' },
        twenty: { rpfeature: '20', save1: '_0', save2: '_0', save3: '_0', save4: '_0', save5: '_0', save6: '_0', save7: '_0', save8: '_0', save9: '_0', save10: '_0' },
        health: { use: '76' },
        mint5: { activate: 'yes', itemcount: '1', id: '2026', useMax: 'Use+Max+%285+Mints%29' },
        shardExp: { buffBuy: 'shard_experience' },
        shardTraining: { buffBuy: 'shard_training' },
        panama: { go: '1' },
        alcatraz: { go: '2' },
        guantanamoBay: { go: '3' },
        longBay: { go: '4' },
        utah: { go: '5' },
        dorchester: { go: '6' },
        sanQuentin: { go: '7' },
        attica: { go: '8' },
        mcNeilIsland: { go: '9' },
        singSing: { go: '10' },
        devilIsland: { go: '11' },
        riker: { go: '12' },
    };


    function getPlayerLevel() {
        const levelElement = Array.from(document.querySelectorAll('strong'))
            .find(el => el.previousSibling?.textContent?.includes('Level:'));
        if (!levelElement) return null;
        const level = parseInt(levelElement.textContent.trim(), 10);
        return isNaN(level) ? null : level;
    }

    function hideLockedPrisonBusButtons() {
        const playerLevel = getPlayerLevel();
        if (playerLevel === null) {
            console.warn('Could not determine player level.');
            return;
        }
        const busRequirements = [
            { id: "PanamaBtn", level: 0 },
            { id: "AlcatrazBtn", level: 5 },
            { id: "GuantanamoBayBtn", level: 10 },
            { id: "LongBayBtn", level: 20 },
            { id: "UtahBtn", level: 35 },
            { id: "DorchesterBtn", level: 75 },
            { id: "SanQuentinBtn", level: 125 },
            { id: "AtticaBtn", level: 150 },
            { id: "McNeilIslandBtn", level: 175 },
            { id: "SingSingBtn", level: 200 },
            { id: "DevilIslandBtn", level: 275 },
            { id: "RikerBtn", level: 350 }
        ];

        busRequirements.forEach(({ id, level }) => {
            const btn = document.getElementById(id);
            if (btn && playerLevel < level) {
                btn.style.display = 'none';
            }
        });
    }


    // ===== POST Sender =====
    function sendPost(payload, label, url = 'https://prisonstruggle.com/inventory.php') {
        GM_xmlhttpRequest({
            method: 'POST',
            url: url,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            data: new URLSearchParams(payload).toString(),
            onload: () => showToast(`${label} action sent`)
        });
    }


    // Define all your button configs in one array
    const buttonsConfig = [
        // id, payload key, label, optional URL
        { id: 'fiveBtn', payloadKey: 'five', labelKey: 'five' },
        { id: 'sixBtn', payloadKey: 'six', labelKey: 'six' },
        { id: 'sevenBtn', payloadKey: 'seven', labelKey: 'seven' },
        { id: 'eightBtn', payloadKey: 'eight', labelKey: 'eight' },
        { id: 'elevenBtn', payloadKey: 'eleven', labelKey: 'eleven' },
        { id: 'twelveBtn', payloadKey: 'twelve', labelKey: 'twelve' },
        { id: 'seventeenBtn', payloadKey: 'seventeen', labelKey: 'seventeen' },
        { id: 'eighteenBtn', payloadKey: 'eighteen', labelKey: 'eighteen' },
        { id: 'nineteenBtn', payloadKey: 'nineteen', labelKey: 'nineteen' },
        { id: 'twentyBtn', payloadKey: 'twenty', labelKey: 'twenty' },
        { id: 'healthBtn', payloadKey: 'health', label: 'Health Pill' },

        { id: 'mint5Btn', payloadKey: 'mint5', label: 'Mint x5', url: 'https://prisonstruggle.com/plant_effect.php' },
        { id: 'shardExpBtn', payloadKey: 'shardExp', label: 'Shard Experience', url: 'https://prisonstruggle.com/wiseoldman.php?action=shards' },
        { id: 'shardTrainingBtn', payloadKey: 'shardTraining', label: 'Shard Training', url: 'https://prisonstruggle.com/wiseoldman.php?action=shards' },

        // Bus buttons share the same url, so just list them here
        { id: 'PanamaBtn', payloadKey: 'panama', label: 'Panama', url: 'https://prisonstruggle.com/bus.php' },
        { id: 'AlcatrazBtn', payloadKey: 'alcatraz', label: 'Alcatraz', url: 'https://prisonstruggle.com/bus.php' },
        { id: 'GuantanamoBayBtn', payloadKey: 'guantanamoBay', label: 'Guantanamo Bay', url: 'https://prisonstruggle.com/bus.php' },
        { id: 'LongBayBtn', payloadKey: 'longBay', label: 'Long Bay', url: 'https://prisonstruggle.com/bus.php' },
        { id: 'UtahBtn', payloadKey: 'utah', label: 'Utah', url: 'https://prisonstruggle.com/bus.php' },
        { id: 'DorchesterBtn', payloadKey: 'dorchester', label: 'Dorchester', url: 'https://prisonstruggle.com/bus.php' },
        { id: 'SanQuentinBtn', payloadKey: 'sanQuentin', label: 'San Quentin', url: 'https://prisonstruggle.com/bus.php' },
        { id: 'AtticaBtn', payloadKey: 'attica', label: 'Attica', url: 'https://prisonstruggle.com/bus.php' },
        { id: 'McNeilIslandBtn', payloadKey: 'mcNeilIsland', label: 'McNeil Island', url: 'https://prisonstruggle.com/bus.php' },
        { id: 'SingSingBtn', payloadKey: 'singSing', label: 'Sing Sing', url: 'https://prisonstruggle.com/bus.php' },
        { id: 'DevilIslandBtn', payloadKey: 'devilIsland', label: 'Devil Island', url: 'https://prisonstruggle.com/bus.php' },
        { id: 'RikerBtn', payloadKey: 'riker', label: 'Riker', url: 'https://prisonstruggle.com/bus.php' },
    ];

    // Attach event listeners dynamically
    buttonsConfig.forEach(({ id, payloadKey, labelKey, label, url }) => {
        const el = document.getElementById(id);
        if (!el) return; // skip if no element with this id

        el.addEventListener('click', () => {
            // Use label if provided, else look up from equipmentLabels by labelKey
            const labelText = label || equipmentLabels[labelKey];
            sendPost(payloads[payloadKey], labelText, url);
        });
    });
})();
