
function oscillate(min, max, delta = 1) {
    let current = min;
    let direction = 1;

    return () => {
        current += direction * delta;
        if (current >= max) {
            current = max;
            direction = -1;
        }
        else if (current <= min) {
            current = min;
            direction = 1;
        }

        return current;
    };

}

export default oscillate 