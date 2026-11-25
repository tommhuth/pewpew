import { Ref, useImperativeHandle, useRef } from "react"
import { useGLTF } from "@react-three/drei"
import { ThreeElements } from "@react-three/fiber"
import { Mesh, SphereGeometry } from "three"
import { spacebitsMaterial, spacebitsMaterialPool } from "@components/entities/spacebits-material"
import { useMaterialSwap } from "@src/hooks/use-material-swap"
import rocketModel from "@assets/models/rocket.glb"
import { useGravity } from "@src/hooks/use-gravity"
import { Tuple3 } from "@src/types/global"
import { exhaustMaterial } from "./exhaust-material"

type RocketNodes = Record<"rocket", Mesh>

// mesh length, origin is roughly in the middle
export const rocketHeight = 2.4

// shared by every rocket
const exhaustGeometry = new SphereGeometry(1, 8, 8)

export type RocketModelRef = {
    flash: () => void
    // height above the placed position, starts at 0
    altitude: number
    // also hides the exhaust, it's a child
    hideRocket: () => void
    hideExhaust: () => void
}

type RocketModelProps = {
    ref?: Ref<RocketModelRef>
    dead?: boolean
    position?: Tuple3
} & Omit<ThreeElements["mesh"], "ref" | "position">

export default function RocketModel({ ref, dead = false, position = [0, 0, 0], ...rest }: RocketModelProps) {
    const [x, baseY, z] = position
    const { nodes } = useGLTF(rocketModel) as unknown as { nodes: RocketNodes }
    const rocketRef = useGravity<Mesh>(dead, 3)
    const flash = useMaterialSwap(rocketRef, spacebitsMaterialPool)
    const exhaustRef = useRef<Mesh>(null)

    useImperativeHandle(ref, () => ({
        get altitude() {
            return (rocketRef.current?.position.y ?? baseY) - baseY
        },
        set altitude(value: number) {
            if (rocketRef.current) {
                rocketRef.current.position.y = baseY + value
            }
        },
        flash,
        hideRocket() {
            if (rocketRef.current) {
                rocketRef.current.visible = false
            }
        },
        hideExhaust() {
            if (exhaustRef.current) {
                exhaustRef.current.visible = false
            }
        },
    }), [flash, baseY])

    return (
        <mesh
            ref={rocketRef}
            position={[x, baseY, z]}
            geometry={nodes.rocket.geometry}
            material={spacebitsMaterial}
            castShadow
            receiveShadow
            {...rest}
        >
            <mesh
                ref={exhaustRef}
                position-y={-rocketHeight * .75}
                scale={[.375, .625, .375]}
                geometry={exhaustGeometry}
                material={exhaustMaterial}
            />
        </mesh>
    )
}

useGLTF.preload(rocketModel)
