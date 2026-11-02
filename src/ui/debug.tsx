import { setDebugHitboxes, useStore } from "@lib/store"

export default function Debug() {
    const state = useStore(i => i.state)
    const parts = useStore(i => i.world.parts.length)
    const hitboxes = useStore(i => i.debug.hitboxes)

    return (
        <div className="text-black absolute z-50 text-left top-4 w-45 left-4 overflow-hidden flex flex-col gap-1 pointer-events-auto text-sm">
            <div>
                State: {state.toUpperCase()}
            </div>
            <div>
                World parts: {parts}
            </div>
            <label className="flex items-center gap-2">
                <input
                    type="checkbox"
                    checked={hitboxes}
                    onChange={e => setDebugHitboxes(e.currentTarget.checked)}
                />
                Hitboxes
            </label>
        </div>
    )
}
