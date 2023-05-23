const delay = (time) => new Promise((resolve) => { setTimeout(() => resolve(), time) });

const rateLimiter = (maxRequests, timeWindowMs) => {
    const queue = [];
    return async() => {
        const newTs = Date.now();

        // cleanup queue
        let deleteNum = 0;
        for (const i in queue) {
            if (queue[i] > newTs - timeWindowMs) {
                break;
            }
            deleteNum++;
        }
        queue.splice(0, deleteNum);

        //take top - maxRequests, add timeWindow
        if (queue.length < maxRequests) {
            queue.push(newTs);
            return;
        }

        const fromTs = queue[queue.length - maxRequests];
        const waitTime = (fromTs + timeWindowMs) - Date.now();
        queue.push(newTs + waitTime);

        if (waitTime > 0) {
            await delay(waitTime);
        }
    };
}

module.exports = {
    delay,
    rateLimiter
};