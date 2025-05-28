// ==UserScript==
// @name         Ovivore
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Auto-refresh, detect Easter eggs, and track activity on PrisonStruggle.
// @author       Peekaboo
// @match        https://prisonstruggle.com/*
// @grant        none
// @updateURL    https://github.com/ivan-kirov/prometheus/raw/main/scripts/javascript/ovivore.user.js
// @downloadURL  https://github.com/ivan-kirov/prometheus/raw/main/scripts/javascript/ovivore.user.js
// ==/UserScript==

(function () {
    'use strict';

    let refreshInterval = null;
    let isPaused = false;
    let refreshLocked = false;
    let isManuallyPaused = false;

    let eggClickCount = 0;
    let lastEggClickTime = null;
    let captchaSubmitCount = 0;
    let lastCaptchaSubmitTime = null;

    function getRandomDelay(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function saveToStorage() {
        localStorage.setItem('eggClickCount', eggClickCount);
        localStorage.setItem('lastEggClickTime', lastEggClickTime ? lastEggClickTime.toString() : '');
        localStorage.setItem('isManuallyPaused', isManuallyPaused ? '1' : '0');
        localStorage.setItem('captchaSubmitCount', captchaSubmitCount.toString());
        localStorage.setItem('lastCaptchaSubmitTime', lastCaptchaSubmitTime ? lastCaptchaSubmitTime.toString() : '');
    }

    function loadFromStorage() {
        eggClickCount = parseInt(localStorage.getItem('eggClickCount') || '0', 10);
        lastEggClickTime = parseInt(localStorage.getItem('lastEggClickTime') || '0', 10);
        isManuallyPaused = localStorage.getItem('isManuallyPaused') === '1';
        captchaSubmitCount = parseInt(localStorage.getItem('captchaSubmitCount') || '0', 10);
        lastCaptchaSubmitTime = parseInt(localStorage.getItem('lastCaptchaSubmitTime') || '0', 10);
    }

    function updateEggCounterDisplay() {
        let container = document.getElementById('egg-counter');
        if (!container) {
            container = document.createElement('div');
            container.id = 'egg-counter';
            container.style.position = 'fixed';
            container.style.top = '10px';
            container.style.right = '10px';
            container.style.zIndex = '9999';
            container.style.padding = '10px 16px';
            container.style.backgroundColor = '#fff8e1';
            container.style.border = '2px solid #ffc107';
            container.style.borderRadius = '10px';
            container.style.color = '#333';
            container.style.fontSize = '14px';
            container.style.fontFamily = 'Arial, sans-serif';
            container.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.alignItems = 'flex-start';
            document.body.appendChild(container);
        }

        const since = (timestamp) => {
            if (!timestamp) return '—';
            const diff = Date.now() - timestamp;
            const m = Math.floor(diff / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            return `${m}m ${s}s`;
        };

        container.innerHTML = `
            <div>🥚 Eggs clicked: ${eggClickCount}</div>
            <div>🔐 CAPTCHAs submitted: ${captchaSubmitCount}</div>
            <div>⏱️ Last egg: ${since(lastEggClickTime)}</div>
            <div>📩 Last CAPTCHA: ${since(lastCaptchaSubmitTime)}</div>
            <button id="reset-egg-counter" style="margin-top: 5px; padding: 3px 8px; font-size: 12px; border: none; background-color: #ff9800; color: white; border-radius: 5px; cursor: pointer;">Reset Eggs</button>
            <button id="reset-captcha-counter" style="margin-top: 5px; padding: 3px 8px; font-size: 12px; border: none; background-color: #3f51b5; color: white; border-radius: 5px; cursor: pointer;">Reset CAPTCHAs</button>
            <button id="pause-toggle-btn" style="margin-top: 5px; padding: 3px 8px; font-size: 12px; border: none; background-color: ${isManuallyPaused ? '#4caf50' : '#f44336'}; color: white; border-radius: 5px; cursor: pointer;">${isManuallyPaused ? 'Resume' : 'Pause'}</button>
        `;

        document.getElementById('reset-egg-counter').onclick = () => {
            eggClickCount = 0;
            lastEggClickTime = null;
            saveToStorage();
            updateEggCounterDisplay();
        };

        document.getElementById('reset-captcha-counter').onclick = () => {
            captchaSubmitCount = 0;
            lastCaptchaSubmitTime = null;
            saveToStorage();
            updateEggCounterDisplay();
        };

        document.getElementById('pause-toggle-btn').onclick = () => {
            isManuallyPaused = !isManuallyPaused;
            if (isManuallyPaused) {
                pauseAutoRefresh('⏸️ Script is manually paused.');
            } else {
                removePausePopup();
                unlockTab();
                isPaused = false;
                startAutoRefresh();
            }
            saveToStorage();
            updateEggCounterDisplay();
        };
    }

    function showPausePopup(message) {
        if (document.getElementById('egg-popup')) return;
        const popup = document.createElement('div');
        popup.id = 'egg-popup';
        popup.textContent = message;
        popup.style.position = 'fixed';
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.zIndex = '10000';
        popup.style.backgroundColor = '#ffeb3b';
        popup.style.padding = '15px 25px';
        popup.style.border = '3px solid #f44336';
        popup.style.borderRadius = '12px';
        popup.style.fontSize = '18px';
        popup.style.fontWeight = 'bold';
        popup.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
        document.body.appendChild(popup);
    }

    function removePausePopup() {
        const popup = document.getElementById('egg-popup');
        if (popup) popup.remove();
    }

    function lockTab() {
        refreshLocked = true;
        window.onbeforeunload = () => "An egg was found! Are you sure you want to leave this page?";
    }

    function unlockTab() {
        refreshLocked = false;
        window.onbeforeunload = null;
    }

    function pauseAutoRefresh(reason = 'Paused') {
        isPaused = true;
        clearTimeout(refreshInterval);
        if (reason.includes('Egg')) {
            lockTab();
        } else {
            unlockTab();
        }
        showPausePopup(reason);
    }

    function startAutoRefresh() {
        if (isPaused) return;
        const delay = getRandomDelay(1000, 3000);
        refreshInterval = setTimeout(() => {
            location.reload();
        }, delay);
    }

    function lookForPauseConditions() {
        if (isManuallyPaused) {
            pauseAutoRefresh('⏸️ Script is manually paused.');
            return;
        }

        // Check for CAPTCHA
        const captchaDetected =
              document.querySelector('label.rc-anchor-checkbox-label') ||
              document.querySelector('iframe[title*="reCAPTCHA"]') ||
              document.querySelector('.g-recaptcha') ||
              document.querySelector('#recaptcha-anchor') ||
              document.body.innerText.includes("I'm not a robot");

        if (captchaDetected) {
            pauseAutoRefresh('⚠️ CAPTCHA detected. Please solve it to continue.');

            const verifyButton = document.querySelector('.recaptcha input[type="submit"][value="Verify!"]');
            if (verifyButton) {
                setTimeout(() => {
                    verifyButton.click();
                    captchaSubmitCount++;
                    lastCaptchaSubmitTime = Date.now();
                    saveToStorage();
                    updateEggCounterDisplay();
                }, 7000);
            }


            return;
        }


        const eggLink = document.querySelector('a.egg[href*="inventory.php"]');
        if (eggLink) {
            isPaused = true;
            lockTab();
            showPausePopup('🥚 Easter Egg found! Auto-clicking in 2–4 seconds...');
            const clickDelay = getRandomDelay(2000, 4000);
            setTimeout(() => {
                eggClickCount++;
                lastEggClickTime = Date.now();
                saveToStorage();
                updateEggCounterDisplay();
                localStorage.setItem('justCollectedEgg', '1');
                eggLink.click();
                removePausePopup();
                unlockTab();
            }, clickDelay);
            return;
        }

        startAutoRefresh();
    }

    window.addEventListener('load', () => {
        if (window.location.pathname === '/inventory.php' && localStorage.getItem('justCollectedEgg') === '1') {
            localStorage.removeItem('justCollectedEgg');
            const delay = getRandomDelay(2000, 3000);
            setTimeout(() => {
                window.location.href = '/showers.php';
            }, delay);
            return;
        }

        loadFromStorage();
        updateEggCounterDisplay();
        lookForPauseConditions();
    });

    // --- Hourly tab opener (every 60 minutes, only if not paused) ---
    const hourlyUrl = 'https://prisonstruggle.com/index.php?mug=10555';
    const hourlyKey = 'lastHourlyOpenTime';

   function openHourlyIfNeeded() {
       let lastTime = parseInt(localStorage.getItem(hourlyKey) || '0', 10);
       const now = Date.now();
       const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds

       // If the value is 0, it means the script has never opened the mugging page before
       if (lastTime === 0) {
           // Open the mugging page immediately if it's the first time
           localStorage.setItem(hourlyKey, now.toString());
           localStorage.setItem('returnAfterMug', window.location.href); // Save the current page URL to return to
           window.location.href = hourlyUrl; // Open the mugging page
           return; // Exit function after navigating
       }

       if (now - lastTime >= oneHour && !isManuallyPaused) {
           localStorage.setItem(hourlyKey, now.toString());
           localStorage.setItem('returnAfterMug', window.location.href);
           window.location.href = hourlyUrl;
       }
   }


    // --- After mugging, return automatically after 5s ---
    function checkIfReturningFromMug() {
        const returnUrl = localStorage.getItem('returnAfterMug');
        if (window.location.href.includes('mug=10555') && returnUrl) {
            setTimeout(() => {
                window.location.href = returnUrl;
                localStorage.removeItem('returnAfterMug');
            }, 5000); // 5 seconds
        }
    }

    // --- Set up checks ---
    setInterval(openHourlyIfNeeded, 30000); // check every 30 seconds
    checkIfReturningFromMug(); // run immediately in case we are on the mug page

})();