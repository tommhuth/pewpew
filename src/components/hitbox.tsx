import { Ref } from "react"
import { EdgesGeometry, LineBasicMaterial, LineSegments } from "three"
import { useStore } from "@lib/store"
import { box } from "@lib/const"
import { Tuple3 } from "@src/types/global"

// collision box outline, toggled from the debug panel
// never rotated, collisions are axis aligned
const geometry = new EdgesGeometry(box)
const material = new LineBasicMaterial({ color: "#0f0" })

interface HitboxProps {
    ref?: Ref<LineSegments>
    position: Tuple3
    size: Tuple3
}

export default function Hitbox({ ref, position, size }: HitboxProps) {
    const hitboxes = useStore(i => i.debug.hitboxes)

    if (!hitboxes) {
        return null
    }

    return (
        <lineSegments
            ref={ref}
            geometry={geometry}
            material={material}
            position={position}
            scale={size}
        />
    )
}
