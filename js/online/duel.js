// ============================================================
// DUELO DETERMINISTA (prototipo online)
// Simulación de combate por turnos basada en stats reales de los
// Pokémon. Con la MISMA semilla y los MISMOS equipos, el resultado
// es idéntico en cualquier cliente (base del lockstep online).
// ============================================================
(function (root) {
    function mulberry32(a) {
        a = a >>> 0;
        return function () {
            a |= 0; a = (a + 0x6D2B79F5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    function toNum(x, d) { const n = Number(x); return isFinite(n) ? n : d; }
    function baseStats(d) {
        const hp = toNum(d.hp, 700);
        const power = Math.max(toNum(d.ataque, 30), toNum(d.spAttack, 30));
        const def = toNum(d.defense, 100);
        const spd = toNum(d.attackSpeed, 0.7) || 0.7;
        return { hp, atk: power, def, spd };
    }
    function runDuel(seed, teamA, teamB) {
        const rng = mulberry32((seed >>> 0) || 1);
        const mk = (d, side) => {
            const s = baseStats(d || {});
            return { name: (d && d.nombre) || '?', side, max: s.hp, hp: s.hp, atk: s.atk, def: s.def, spd: s.spd };
        };
        const units = [].concat((teamA || []).map(d => mk(d, 0)), (teamB || []).map(d => mk(d, 1)));
        if (!teamA || !teamA.length || !teamB || !teamB.length) {
            return { winner: (teamA && teamA.length) ? 0 : 1, round: 0, aAlive: (teamA || []).length, bAlive: (teamB || []).length, log: [] };
        }
        const alive = side => units.filter(u => u.side === side && u.hp > 0);
        let round = 0;
        const log = [];
        while (alive(0).length > 0 && alive(1).length > 0 && round < 60) {
            round++;
            const order = units.filter(u => u.hp > 0)
                .sort((a, b) => (b.spd - a.spd) || (a.side - b.side) || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
            for (const u of order) {
                if (u.hp <= 0) continue;
                const enemies = units.filter(x => x.side !== u.side && x.hp > 0);
                if (!enemies.length) break;
                const target = enemies[Math.floor(rng() * enemies.length)];
                const crit = rng() < 0.2;
                let dmg = Math.max(10, u.atk * 1.6 - target.def * 0.15) * (crit ? 1.5 : 1);
                dmg = Math.round(dmg);
                target.hp -= dmg;
                if (target.hp <= 0) log.push(`(${round}) ${target.name} cae`);
            }
        }
        const a = alive(0).length, b = alive(1).length;
        let winner;
        if (a > 0 && b === 0) winner = 0;
        else if (b > 0 && a === 0) winner = 1;
        else {
            // Tope de rondas: decide quién conserva más % de vida total
            const frac = side => { const us = units.filter(u => u.side === side); const tot = us.reduce((s, u) => s + u.max, 0) || 1; const cur = us.reduce((s, u) => s + Math.max(0, u.hp), 0); return cur / tot; };
            winner = frac(0) >= frac(1) ? 0 : 1;
        }
        return { winner, round, aAlive: a, bAlive: b, log: log.slice(-8) };
    }
    const api = { mulberry32, runDuel };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    root.Duel = api;
})(typeof window !== 'undefined' ? window : globalThis);
