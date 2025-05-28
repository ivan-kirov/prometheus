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
// @updateURL    https://raw.githubusercontent.com/ivan-kirov/prometheus/main/bulk.user.js
// @downloadURL  https://raw.githubusercontent.com/ivan-kirov/prometheus/main/bulk.user.js
// ==/UserScript==


(function () {
    'use strict';

    const resetStorage = () => {
        localStorage.removeItem('ps_iteration_count');
        localStorage.removeItem('ps_next_run');
        localStorage.removeItem('ps_stage');
        alert('PrisonStruggle script storage cleared. Reloading page.');
        location.reload();
    };

    // Example: add a button to the page (just add once at script start)
    const btn = document.createElement('button');
    btn.textContent = 'Reset Script Storage';
    btn.style.position = 'fixed';
    btn.style.top = '10px';
    btn.style.right = '10px';
    btn.style.zIndex = 9999;
    btn.onclick = resetStorage;
    document.body.appendChild(btn);


    const log = console.log;
    const CLICK_DELAY = 2000; // 2 seconds delay for clicks

    const state = {
        get iteration() {
            return parseInt(localStorage.getItem('ps_iteration_count') || '0');
        },
        incrementIteration() {
            let count = this.iteration + 1;
            localStorage.setItem('ps_iteration_count', count.toString());
        },
        setNextRun(timestamp) {
            localStorage.setItem('ps_next_run', timestamp.toString());
        },
        getNextRun() {
            return parseInt(localStorage.getItem('ps_next_run') || '0');
        }
    };

    function getNext5MinTimestamp(targetSecond = 6) {
        const now = new Date();
        let next = new Date();
        next.setSeconds(0, 0);
        let minutes = Math.floor((now.getMinutes() + 5) / 5) * 5;
        if (minutes >= 60) {
            next.setHours(now.getHours() + 1);
            minutes = 0;
        }
        next.setMinutes(minutes);
        next.setSeconds(targetSecond);
        if (next <= now) next.setMinutes(next.getMinutes() + 5);
        return next.getTime();
    }

    function waitUntilNextRun() {
        const now = Date.now();
        const nextRun = state.getNextRun();
        const waitTime = nextRun - now;
        if (waitTime > 0) {
            log(`⏳ Waiting ${(waitTime / 1000).toFixed(2)}s until next execution.`);
            setTimeout(() => location.reload(), waitTime);
        } else {
            log('✅ Executing main loop now.');
            runMainLoop();
        }
    }

    function checkCaptcha() {
        const captchaDetected =
            document.querySelector('label.rc-anchor-checkbox-label') ||
            document.querySelector('iframe[title*="reCAPTCHA"]') ||
            document.querySelector('.g-recaptcha') ||
            document.querySelector('#recaptcha-anchor') ||
            document.body.innerText.includes("I'm not a robot");

        if (captchaDetected) {
            log("⚠️ CAPTCHA detected. Halting execution.");
            const verifyButton = document.querySelector('.recaptcha input[type="submit"][value="Verify!"]');
            if (verifyButton) setTimeout(() => verifyButton.click(), 3500);
            return true;
        }
        return false;
    }

    function postToPlantEffect(plantId) {
        fetch('/plant_effect.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                // Other headers like Origin, Referer, User-Agent are set automatically by browser
            },
            body: `id=${encodeURIComponent(plantId)}`,
            credentials: 'same-origin'  // ensures cookies are sent
        })
            .then(response => response.text())
            .then(text => {
                console.log('Plant effect response:', text);
                // Reload or update UI if needed
                location.reload();
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }



    async function performDelayedClick(callback) {
        await new Promise(r => setTimeout(r, CLICK_DELAY));
        if (!checkCaptcha()) {
            try {
                callback();
            } catch (e) {
                console.error("performDelayedClick callback error:", e);
            }
        }
    }


    async function runMainLoop() {
        if (checkCaptcha()) return;

        const stage = localStorage.getItem("ps_stage") || "start";
        const url = location.pathname;
        const iteration = state.iteration;

        switch (stage) {
            case "start":
                // Every 17 iterations: go to plant_effect.php and click "Start Now"
                if (iteration % 17 === 0) {
                    if (url !== "/plant_effect.php") {
                        log(`🌱 Iteration ${iteration}: Navigating to plant_effect.php`);
                        postToPlantEffect(2034);
                        return;
                    } else {
                        const startBtn = [...document.querySelectorAll('input[type="submit"][name="submit"]')]
                            .find(btn => btn.value === "Start Now");
                        if (startBtn) {
                            log(`🌱 Iteration ${iteration}: Clicking "Start Now" button`);
                            await new Promise(r => setTimeout(r, CLICK_DELAY));
                            startBtn.click();
                            // After clicking, stay on this page or you can optionally move on:
                            localStorage.setItem("ps_stage", "equip-santa");
                            location.href = "/inventory.php";
                            return;
                        } else {
                            log("❌ 'Start Now' button not found on plant_effect.php");
                        }
                    }
                }

                // Existing 20 iteration check for item usage on inventory.php
                if (iteration > 0 && iteration % 20 === 0) {
                    // Instead of clicking the link, send a POST request to use the item
                    log(`🧪 Iteration ${iteration}: Using item ID 14.`);

                    fetch('/plant_effect.php', {  // or correct URL for item usage if different
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: 'id=14',
                        credentials: 'same-origin'
                    })
                        .then(response => response.text())
                        .then(text => {
                            log('Item use response received, reloading...');
                            location.reload();  // or whatever reload/navigation you want
                        })
                        .catch(err => {
                            log('Error using item ID 14:', err);
                        });

                    return; // Stop here to wait for reload after using the item
                }


                localStorage.setItem("ps_stage", "equip-santa");
                await performDelayedClick(() => {
                    const btn = [...document.querySelectorAll('a.button')].find(a => a.textContent.includes("Santa"));
                    if (btn) btn.click();
                });
                break;

            case "equip-santa":
                localStorage.setItem("ps_stage", "do-crime");
                location.href = "/crime.php";
                break;

            case "do-crime":
                if (url !== "/crime.php") {
                    location.href = "/crime.php";
                } else {
                    localStorage.setItem("ps_stage", "after-crime");
                    await performDelayedClick(() => {
                        const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes("Use All Nerve"));
                        if (btn) btn.click();
                    });
                }
                break;

            case "after-crime":
                localStorage.setItem("ps_stage", "deposit");
                location.href = "https://prisonstruggle.com/bank.php?dep=1";
                break;

            case "deposit":
                localStorage.setItem("ps_stage", "equip-pg");
                location.href = "/inventory.php";
                break;

            case "equip-pg":
                if (url !== "/inventory.php") {
                    location.href = "/inventory.php";
                } else {
                    localStorage.setItem("ps_stage", "go-gym");
                    await performDelayedClick(() => {
                        const btn = [...document.querySelectorAll('a.button')].find(a => a.textContent.includes("PG"));
                        if (btn) btn.click();
                    });
                }
                break;

            case "go-gym":
                localStorage.setItem("ps_stage", "gym");
                location.href = "/pggym.php";
                break;

            case "gym":
                if (url === "/pggym.php") {
                    const trainBtn = [...document.querySelectorAll('input.button[type="submit"]')]
                        .find(btn => btn.value === "Train Strength");
                    if (trainBtn) {
                        setTimeout(() => {
                            if (trainBtn) {
                                trainBtn.click();
                                log("💪 Clicked 'Train Strength'");

                                localStorage.removeItem("ps_stage");
                                state.incrementIteration();

                                const nextRun = getNext5MinTimestamp();
                                state.setNextRun(nextRun);
                                log(`✅ Iteration #${state.iteration} complete. Next run at ${new Date(nextRun).toLocaleTimeString()}.`);
                            } else {
                                log("❌ 'Train Strength' button not found. Retrying...");
                                const nextRun = getNext5MinTimestamp();
                                state.setNextRun(nextRun);
                                setTimeout(() => location.reload(), 10000);
                            }
                        }, CLICK_DELAY);
                    }
                }
                break;
            default:
                localStorage.setItem("ps_stage", "start");
                location.href = "/inventory.php";
                break;
        }
    }

    waitUntilNextRun();
})();
