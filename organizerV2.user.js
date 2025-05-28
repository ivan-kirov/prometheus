// ==UserScript==
// @name         OrganiserV2
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Floating UI with buttons that send different POST requests for gear sets or actions, with labels and grouping
// @author       Peekaboo
// @match        https://prisonstruggle.com/*
// @exclude      https://prisonstruggle.com/description*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      prisonstruggle.com
// @updateURL    https://github.com/ivan-kirov/prometheus/raw/main/scripts/javascript/organiserV2.user.js
// @downloadURL  https://github.com/ivan-kirov/prometheus/raw/main/scripts/javascript/organiserV2.user.js
// ==/UserScript==

(function () {
    'use strict';

    // ===== Styling for Floating UI =====
    const style = `
#floating-ui {
    position: fixed;
    top: 20px;
    right: 20px;
    max-width: 180px;
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

    // ===== Create UI =====
    const container = document.createElement('div');
    container.id = 'floating-ui';
    container.innerHTML = `
        <h4>Equipment</h4>
        <button id="fiveBtn">str str</button>
        <button id="sixBtn">str + grinch</button>
        <button id="sevenBtn">gold PG</button>
        <button id="eightBtn">pat + weapon</button>
        <button id="elevenBtn">pat + grinch</button>
        <button id="twelveBtn">pat + ar</button>
        <button id="seventeenBtn">grinch set</button>
        <button id="eighteenBtn">g set + weap</button>
        <button id="nineteenBtn">pat + bow</button>
        <button id="twentyBtn">santa</button>

        <h4>Actions</h4>
        <button id="toggleTrainingBtn" style="background: #2196F3;">Training ▼</button>
        <div id="trainingSection" style="display: none;"; class="subsection">
            <button id="mint5Btn">Mint x5</button>
            <button id="shardExpBtn">Shard Exp</button>
        </div>

        <button id="toggleBusBtn" style="background: #2196F3;">Prison Bus ▼</button>
        <div id="busSection" style="display: none;"; class="subsection">
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
            <button id="ReikerBtn">Reiker</button>
        </div>
    `;
    document.body.appendChild(container);

    // ===== Toggle Sections =====
    document.getElementById('toggleTrainingBtn').addEventListener('click', () => {
        const section = document.getElementById('trainingSection');
        section.style.display = section.style.display === 'block' ? 'none' : 'block';
    });
    document.getElementById('toggleBusBtn').addEventListener('click', () => {
        const section = document.getElementById('busSection');
        section.style.display = section.style.display === 'block' ? 'none' : 'block';
    });

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
        mint5: { activate: 'yes', itemcount: '1', id: '2026', useMax: 'Use+Max+%285+Mints%29' },
        shardExp: { buffBuy: 'shard_training' },
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
        devilIsland: {go: '11'},
        riker: {go: '12'},
    };

    // ===== POST Sender =====
    function sendPost(payload, label, url = 'https://prisonstruggle.com/inventory.php') {
        GM_xmlhttpRequest({
            method: 'POST',
            url: url,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            data: new URLSearchParams(payload).toString()
        });
    }

    // ===== Event Listeners =====
    document.getElementById('fiveBtn').addEventListener('click', () => sendPost(payloads.five, 'str str'));
    document.getElementById('sixBtn').addEventListener('click', () => sendPost(payloads.six, 'str + grinch'));
    document.getElementById('sevenBtn').addEventListener('click', () => sendPost(payloads.seven, 'gold PG'));
    document.getElementById('eightBtn').addEventListener('click', () => sendPost(payloads.eight, 'pat + weapon'));
    document.getElementById('elevenBtn').addEventListener('click', () => sendPost(payloads.eleven, 'pat + grinch'));
    document.getElementById('twelveBtn').addEventListener('click', () => sendPost(payloads.twelve, 'pat + ar'));
    document.getElementById('seventeenBtn').addEventListener('click', () => sendPost(payloads.seventeen, 'grinch set'));
    document.getElementById('eighteenBtn').addEventListener('click', () => sendPost(payloads.eighteen, 'g set + weapon'));
    document.getElementById('nineteenBtn').addEventListener('click', () => sendPost(payloads.nineteen, 'pat + bow'));
    document.getElementById('twentyBtn').addEventListener('click', () => sendPost(payloads.twenty, 'santa'));

    document.getElementById('mint5Btn').addEventListener('click', () =>
        sendPost(payloads.mint5, 'Mint x5', 'https://prisonstruggle.com/plant_effect.php'));
    document.getElementById('shardExpBtn').addEventListener('click', () =>
        sendPost(payloads.shardExp, 'Shard Exp', 'https://prisonstruggle.com/wiseoldman.php?action=shards'));

    document.getElementById('PanamaBtn').addEventListener('click', () =>
        sendPost(payloads.panama, 'Panama', 'https://prisonstruggle.com/bus.php'));
    document.getElementById('AlcatrazBtn').addEventListener('click', () =>
        sendPost(payloads.alcatraz, 'Alcatraz', 'https://prisonstruggle.com/bus.php'));
    document.getElementById('GuantanamoBayBtn').addEventListener('click', () =>
        sendPost(payloads.guantanamoBay, 'Guantanamo Bay', 'https://prisonstruggle.com/bus.php'));
    document.getElementById('LongBayBtn').addEventListener('click', () =>
        sendPost(payloads.longBay, 'Long Bay', 'https://prisonstruggle.com/bus.php'));
    document.getElementById('UtahBtn').addEventListener('click', () =>
        sendPost(payloads.utah, 'Utah', 'https://prisonstruggle.com/bus.php'));
    document.getElementById('DorchesterBtn').addEventListener('click', () =>
        sendPost(payloads.dorchester, 'Dorchester', 'https://prisonstruggle.com/bus.php'));
    document.getElementById('SanQuentinBtn').addEventListener('click', () =>
        sendPost(payloads.sanQuentin, 'San Quentin', 'https://prisonstruggle.com/bus.php'));
    document.getElementById('AtticaBtn').addEventListener('click', () =>
        sendPost(payloads.attica, 'Attica', 'https://prisonstruggle.com/bus.php'));
    document.getElementById('McNeilIslandBtn').addEventListener('click', () =>
        sendPost(payloads.mcNeilIsland, 'McNeil Island', 'https://prisonstruggle.com/bus.php'));
    document.getElementById('SingSingBtn').addEventListener('click', () =>
        sendPost(payloads.singSing, 'Sing Sing', 'https://prisonstruggle.com/bus.php'));
     document.getElementById('DevilIslandBtn').addEventListener('click', () =>
        sendPost(payloads.devilIsland, 'Devil Island', 'https://prisonstruggle.com/bus.php'));
     document.getElementById('RikerBtn').addEventListener('click', () =>
        sendPost(payloads.riker, 'Riker', 'https://prisonstruggle.com/bus.php'));
})();
