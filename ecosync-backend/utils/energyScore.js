function computeRawScore(metrics) {
    const cpu = Math.max(0, Math.min(100, Number(metrics.cpu || 0)));
    const temp = metrics.temp == null ? null : Number(metrics.temp);
    const battery = metrics.battery == null ? null : Number(metrics.batteryPercent);

    let tempPenalty = 0;
    if(temp != null) {
        const over = Math.max(0, temp - 45);
        tempPenalty = over * 1.5;
    }

    const batteryPenalty = (battery != null && battery < 20) ? 20 : 0;

    let raw = cpu * 0.6 + tempPenalty * 0.25 + batteryPenalty * 0.15;
    raw = Math.max(0, Math.min(100, raw));
    return raw;
}

function applyEma(prevScore, rawScore, alpha = 0.3) {
    if(prevScore == null) return rawScore;
    return prevScore * (1 - alpha) + rawScore * alpha; 
}

module.exports = { computeRawScore, applyEma };