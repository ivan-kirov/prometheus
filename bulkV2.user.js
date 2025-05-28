// ==UserScript==
// @name         Bulk
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Auto perform actions on PrisonStruggle every 5 minutes at 6 seconds
// @grant        none
// @author       Peekaboo
// @match        https://prisonstruggle.com/*
// @exclude      https://prisonstruggle.com/description*
// @connect      prisonstruggle.com
// @updateURL    https://raw.githubusercontent.com/ivan-kirov/prometheus/main/bulkV2.user.js
// @downloadURL  https://raw.githubusercontent.com/ivan-kirov/prometheus/main/bulkV2.user.js
// ==/UserScript==

(function () {
    'use strict';

    const base = 'https://prisonstruggle.com';
    const countKey = 'ps_script_count';

    function wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function checkCaptcha() {
        const hasCaptcha =
            document.querySelector('label.rc-anchor-checkbox-label') ||
            document.querySelector('iframe[title*="reCAPTCHA"]') ||
            document.querySelector('.g-recaptcha') ||
            document.querySelector('#recaptcha-anchor') ||
            document.body.innerText.includes("I'm not a robot");

        if (hasCaptcha) {
            console.warn('⚠️ CAPTCHA detected. Script paused.');
            const verifyButton = document.querySelector('.recaptcha input[type="submit"][value="Verify!"]');
            if (verifyButton) {
                console.log('⏳ Clicking "Verify!" button in 3.5s...');
                setTimeout(() => {
                    verifyButton.click();
                    console.log('✅ Clicked "Verify!" button');
                }, 3500);
            }
            throw new Error('CAPTCHA detected');
        }
    }

    async function equipSet(setName, nextStep) {
        await checkCaptcha();
        console.log(`🎽 Equipping set: ${setName}`);
        localStorage.setItem('equipSet', setName);
        if (nextStep) localStorage.setItem('ps_step', nextStep);
        window.location.href = `${base}/inventory.php`;
    }


    async function commitCrime() {
        await checkCaptcha();
        if (window.location.pathname !== '/crime.php') {
            window.location.href = `${base}/crime.php`;
            return;
        }

        console.log('💥 Committing crime...');
        await wait(1000);
        const crimeButton = [...document.querySelectorAll('button')].find(btn =>
            btn.textContent.includes('Use All Nerve')
        );
        if (crimeButton) {
            crimeButton.click();
            console.log('✅ Crime committed');
        } else {
            console.error('❌ Crime button not found');
        }
    }

    async function depositBank() {
        await checkCaptcha();
        console.log('🏦 Depositing money...');
        localStorage.setItem('ps_step', 'deposit_done');  // set step BEFORE redirecting
        window.location.href = `${base}/bank.php?dep=1`;
    }

    async function trainStrength() {
        await checkCaptcha();
        if (window.location.pathname !== '/pggym.php') {
            window.location.href = `${base}/pggym.php`;
            return;
        }

        await wait(1000);
        const trainBtn = [...document.querySelectorAll('input.button[type="submit"]')]
            .find(btn => btn.value?.toLowerCase().includes('train strength'))
        if (trainBtn) {
            trainBtn.click();
            console.log("💪 Trained Strength");
        } else {
            console.error("❌ 'Train Strength' button not found");
        }
    }

    async function processEquipFromStorage() {
        const name = localStorage.getItem('equipSet');
        if (name && window.location.pathname === '/inventory.php') {
            console.log(`🎽 Clicking set: ${name}`);
            await wait(1000);
            const btn = [...document.querySelectorAll('a.button')]
                .find(a => a.textContent.includes(name));
            if (btn) {
                btn.click();
                console.log(`✅ Equipped set ${name}`);
            } else {
                console.error(`❌ Set ${name} not found`);
            }
            localStorage.removeItem('equipSet');

            // Wait 2s then redirect to the next expected step page based on ps_step
            await wait(2000);

            const step = localStorage.getItem('ps_step');
            if (step === 'crime_done') {
                window.location.href = `${base}/crime.php`;
            } else if (step === 'equip_pg') {
                window.location.href = `${base}/pggym.php`;
            } else if (step === 'deposit_done') {
                window.location.href = `${base}/bank.php?dep=1`;
            } else {
                // fallback: reload current page or homepage
                window.location.href = base;
            }
        }
    }


    if (window.location.pathname === '/inventory.php') {
        (async () => await processEquipFromStorage())();
        return;
    }



    async function sequenceRouter() {
        const lastStep = localStorage.getItem('ps_step') || 'equip_santa';

        try {
            switch (lastStep) {
                case 'equip_santa':
                    await checkCaptcha();
                    if (window.location.pathname === '/crime.php') {
                        localStorage.setItem('ps_step', 'crime_done');
                        await commitCrime();
                        setTimeout(() => location.reload(), 2000);
                    } else {
                        await equipSet('Santa', 'crime_done');
                    }
                    break;


                case 'crime_done':
                    localStorage.setItem('ps_step', 'deposit_done');
                    await depositBank();
                    break;

                case 'deposit_done':
                    localStorage.setItem('ps_step', 'equip_pg');
                    await equipSet('PG');
                    break;

                case 'equip_pg':
                    if (window.location.pathname === '/pggym.php') {
                        localStorage.setItem('ps_step', 'done');
                        await trainStrength();
                        setTimeout(() => location.reload(), 5000);
                    } else {
                        await equipSet('PG');
                    }
                    break;

                case 'done':
                default:
                    console.log('✅ All actions complete. Resetting step.');
                    localStorage.setItem('ps_step', 'equip_santa');
                    const count = parseInt(localStorage.getItem(countKey) || '0');
                    localStorage.setItem(countKey, (count + 1).toString());
                    setTimeout(() => location.reload(), 60000);
                    break;
            }

        } catch (err) {
            console.error(`🚨 Script halted: ${err.message}`);
            alert('⚠️ CAPTCHA or error detected. Please resolve and reload.');
        }
    }

    // Entry point
    if (window.location.pathname !== '/inventory.php') {
        sequenceRouter();
    }

})();
