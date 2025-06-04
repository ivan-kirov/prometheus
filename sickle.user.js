// ==UserScript==
// @name         Sickle
// @namespace    http://tampermonkey.net/
// @version      1.5
// @description  Finds all plants and harvests them one by one. Uses a delay and cooldown every 30 clicks. Also works on mobile
// @match        https://prisonstruggle.com/fields.php
// @grant        none
// @author       Peekaboo
// @updateURL    https://raw.githubusercontent.com/ivan-kirov/prometheus/main/sickle.user.js
// @downloadURL  https://raw.githubusercontent.com/ivan-kirov/prometheus/main/sickle.user.js

// ==/UserScript==

(function () {
    'use strict';

    window.addEventListener('load', () => {
        const buttons = Array.from(document.querySelectorAll('a.button')).filter(btn =>
            btn.textContent.trim().toLowerCase() === 'harvest' &&
            btn.hasAttribute('onclick') &&
            btn.getAttribute('onclick').includes('update_garden')
        );

        console.log(`Found ${buttons.length} Harvest buttons.`);

        let i = 0;

        function clickNext() {
            if (i >= buttons.length) return;

            buttons[i].click();
            i++;

            // Check if we need to apply a cooldown
            if (i % 12 === 0) {
                console.log(`Cooldown after ${i} clicks... waiting 10 seconds`);
                setTimeout(clickNext, 7000); // 7 second cooldown
            } else {
                setTimeout(clickNext, 400); // Regular delay between clicks
            }
        }
        clickNext();

    });
})();
