// ==UserScript==
// @name         Organiser
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Floating UI with quick buttons.
// @author       Peekaboo
// @match        https://prisonstruggle.com/*
// @exclude      https://prisonstruggle.com/description*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      prisonstruggle.com
// @updateURL    https://github.com/ivan-kirov/prometheus/raw/main/scripts/javascript/organiser.user.js
// @downloadURL  https://github.com/ivan-kirov/prometheus/raw/main/scripts/javascript/organiser.user.js
// ==/UserScript==

(function () {
    'use strict';

    // ===== Styling for Floating UI =====
    const style = `
#floating-ui {
    position: fixed;
    top: 20px;
    right: 20px;
    left: auto;
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
    font-size: 14px;
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

#santaBtn {
    background: #e53935 !important;
    color: white !important;
}
#patriotBtn {
    background: linear-gradient(90deg, #3b5998, #ff0000) !important;
    color: white !important;
}
#fightingBtn {
    background: #fbc02d !important;
    color: black !important;
}
#pgSetBtn {
    background: #2196f3 !important;
    color: white !important;
}
#patriotCupidBtn {
    background: linear-gradient(90deg, #e91e63, #2196f3) !important;
    color: white !important;
}

#floating-ui button:hover {
    filter: brightness(1.1);
}

#busSection {
    transition: all 0.3s ease-in-out;
}
`;


    GM_addStyle(style);

    // ===== Create UI =====
    const container = document.createElement('div');
    container.id = 'floating-ui';
    container.innerHTML = `
        <h4>Equipment</h4>
        <button id="pgSetBtn">PG Set</button>
        <button id="santaBtn">Santa Set</button>
        <button id="fightingBtn">Fighting</button>
        <button id="patriotBtn">Patriot Set</button>
        <button id="patriotCupidBtn">Patriot & Cupid Set</button>
        <h4>Bank</h4>
        <button id="withdraw2MBtn">Withdraw 2M</button>
        <button id="withdraw35MBtn">Withdraw 3.5M</button>
        <button id="toggleBusBtn" style="margin-bottom: 8px; background: #2196F3;">Prison Bus ▼</button>
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
</div>

    `;

    document.body.appendChild(container);
    document.getElementById('toggleBusBtn').addEventListener('click', () => {
        const section = document.getElementById('busSection');
        section.style.display = section.style.display === 'none' ? 'block' : 'none';
    });


    // ===== POST Payloads =====
    const payloads = {
        pg_set: { rpfeature: '11', save1: '_0', save2: '_0', save3: '_0', save4: '_0', save5: '_0', save6: '_0', save7: '_0', save8: '_0', save9: '_0', save10: '_0' },
        santa_set: { rpfeature: '5', save1: '_0', save2: '_0', save3: '_0', save4: '_0', save5: '_0', save6: '_0', save7: '_0', save8: '_0', save9: '_0', save10: '_0' },
        patriot_set: { rpfeature: '7', save1: '_0', save2: '_0', save3: '_0', save4: '_0', save5: '_0', save6: '_0', save7: '_0', save8: '_0', save9: '_0', save10: '_0' },
        patriot_cupid: { rpfeature: '8', save1: '_0', save2: '_0', save3: '_0', save4: '_0', save5: '_0', save6: '_0', save7: '_0', save8: '_0', save9: '_0', save10: '_0' },
        fighting: { rpfeature: '6', save1: '_0', save2: '_0', save3: '_0', save4: '_0', save5: '_0', save6: '_0', save7: '_0', save8: '_0', save9: '_0', save10: '_0' },
        withdraw_2m: { action: 'withdrawMoney', wamount: '2000000', withdraw: 'Withdraw' },
        withdraw_35m: { action: 'withdrawMoney', wamount: '3500000', withdraw: 'Withdraw' },
        panama: {go:'1'},
        alcatraz: {go:'2'},
        guantanamoBay: {go:'3'},
        longBay: {go:'4'},
        utah: {go:'5'},
        dorchester: {go:'6'},
        sanQuentin: {go:'7'},
        attica: {go:'8'},
        mcNeilIsland: {go:'9'},
        singSing: {go:'10'}
    };

    // ===== POST Function =====
    function sendPost(payload, label, url = 'https://prisonstruggle.com/inventory.php') {
        GM_xmlhttpRequest({
            method: 'POST',
            url: url,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            data: new URLSearchParams(payload).toString()
        });
    }

    // ===== Event Listeners =====
    document.getElementById('pgSetBtn').addEventListener('click', () => sendPost(payloads.pg_set, 'pg_set'));
    document.getElementById('santaBtn').addEventListener('click', () => sendPost(payloads.santa_set, 'Santa Set'));
    document.getElementById('patriotBtn').addEventListener('click', () => sendPost(payloads.patriot_set, 'Patriot Set'));
    document.getElementById('patriotCupidBtn').addEventListener('click', () => sendPost(payloads.patriot_cupid, 'Patriot & Cupid Set'));
    document.getElementById('fightingBtn').addEventListener('click', () => sendPost(payloads.fighting, 'Fighting'));

    document.getElementById('withdraw2MBtn').addEventListener('click', () =>
                                                              sendPost(payloads.withdraw_2m, 'Withdraw 2M', 'https://prisonstruggle.com/bank.php'));
    document.getElementById('withdraw35MBtn').addEventListener('click', () =>
                                                               sendPost(payloads.withdraw_35m, 'Withdraw 3.5M', 'https://prisonstruggle.com/bank.php'));
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
})();
