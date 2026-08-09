/**
 * Yksi paikka, jossa DOM-tunnisteet esiintyvät. Jos HTML muuttuu, vain tämä
 * tiedosto tarvitsee päivittää.
 */

const byId = id => document.getElementById(id);

export const el = {
    board: byId("board"),
    next: byId("next"),

    score: byId("score"),
    lines: byId("lines"),
    level: byId("level"),

    startScreen: byId("startScreen"),
    pauseScreen: byId("pauseScreen"),
    overScreen: byId("overScreen"),
    finalScore: byId("finalScore"),
    sensorErr: byId("sensorErr"),

    startBtn: byId("startBtn"),
    againBtn: byId("againBtn"),
    restartBtn: byId("restartBtn"),
    resumeBtn: byId("resumeBtn"),
    pauseBtn: byId("pauseBtn"),
    settingsBtn: byId("settingsBtn"),

    modeTap: byId("modeTap"),
    modeTwist: byId("modeTwist"),
    labSide: byId("labSide"),
    dotSide: byId("dotSide"),
    invertTap: byId("invertTap"),

    sliders: {
        side: { input: byId("sensSide"), value: byId("valSide") },
        drop: { input: byId("sensDrop"), value: byId("valDrop") },
        rot: { input: byId("sensRot"), value: byId("valRot") }
    },

    zones: {
        top: byId("zTop"),
        bottom: byId("zBottom"),
        left: byId("zLeft"),
        right: byId("zRight")
    },
    tapCore: byId("tapCore"),

    meterFill: byId("meterFill"),
    meterRot: byId("meterRot"),
    rotFill: byId("rotFill"),

    ticks: {
        side: byId("tickSide"),
        drop: byId("tickDrop"),
        rot: byId("tickRot"),
        twist: byId("tickTwist")
    }
};
