import { LOWEST_FRAMERATE } from "@lib/helpers/utils"

const queue = new Set<TimeoutWorkItem>()

export function timeout(handler: TimeoutWorkItem["handler"], duration: number) {
    let item: TimeoutWorkItem = {
        deadline: duration + time,
        handler,
    }

    queue.add(item)

    return () => {
        queue.delete(item)
    }
}

export function wait(ms: number) {
    return new Promise<void>(r => timeout(r, ms))
}

interface TimeoutWorkItem {
    deadline: number;
    handler: () => unknown;
}

let time = 0
let previousTime: null | number = null

function tick(currentTime: number) {
    if (previousTime === null) {
        previousTime = currentTime
    } else {
        time += Math.min(currentTime - previousTime, 1 / LOWEST_FRAMERATE * 1000)
        previousTime = currentTime
    }

    for (const item of queue) {
        if (item.deadline < time) {
            try {
                item.handler()
            } catch (e) {
                console.error(e)
            }

            queue.delete(item)
        }
    }

    requestAnimationFrame(tick)
}

requestAnimationFrame(tick)