import { useFrame } from "@react-three/fiber"
import { useEffect, useLayoutEffect, useMemo, useRef } from "react"
import { damp } from "three/src/math/MathUtils.js"
import { damageEntity, setPlayerObject, State, useStore } from "@lib/store"
import {
    BULLET_SIZE,
    BULLET_SPEED,
    EDGE_MAX,
    EDGE_MIN,
    FIRE_FREQUENCY,
    PLAYER_SIZE,
    PLAYER_START,
    PLAYER_TERRAIN_BUFFER,
} from "@lib/const"
import { clamp, ndelta } from "@lib/helpers/utils"
import { spacebits } from "@components/world/spacebits-material"
import { useGLTF } from "@react-three/drei"
import { LineSegments, Mesh, Vector3 } from "three"
import playerModel from "@assets/models/player.glb"
import { useControls } from "@src/hooks/use-controls"
import { Owner } from "@src/types/bullet"
import { createBullet } from "@components/bullets"
import Hitbox from "@components/hitbox"
import { useCollisionDetection } from "@src/hooks/use-collision-detection"
import { CollisionType } from "@src/types/collision"
import { WorldPart } from "@src/types/world"
import { getWorldTerrainHeightAt } from "@lib/world/terrain"

const _sample = { x: 0, y: 0, z: 0 }

// highest terrain under the corners of the player box
function getTerrainHeight(parts: WorldPart[], position: Vector3) {
    let height = -Infinity

    for (let i = 0; i < 4; i++) {
        _sample.x = position.x + (i & 1 ? .5 : -.5) * PLAYER_SIZE[0]
        _sample.z = position.z + (i & 2 ? .5 : -.5) * PLAYER_SIZE[2]
        height = Math.max(height, getWorldTerrainHeightAt(parts, _sample))
    }

    return height
}

export default function Player() {
    const { nodes } = useGLTF(playerModel) as unknown as { nodes: { player: Mesh } }
    const object = useStore(i => i.player.object)
    const targetPosition = useStore(i => i.player.targetPosition)
    const nextShotAt = useRef(0)
    const debugRef = useRef<LineSegments>(null)
    const grid = useStore(i => i.world.grid)
    const client = useMemo(() => {
        return grid.createClient([...PLAYER_START], PLAYER_SIZE, { id: "player", type: CollisionType.PLAYER })
    }, [grid])

    useControls()

    useLayoutEffect(() => {
        if (!object) {
            return
        }

        object.position.set(...PLAYER_START)
        targetPosition.copy(object.position)
    }, [object, targetPosition])

    useEffect(() => {
        return () => grid.remove(client)
    }, [grid, client])

    useFrame((_, delta) => {
        const { player, state, world } = useStore.getState()

        if (!player.object || state !== State.READY) {
            return
        }

        const nd = ndelta(delta)
        const object = player.object
        const y = clamp(targetPosition.y, EDGE_MIN.y, EDGE_MAX.y)

        object.position.x = damp(object.position.x, targetPosition.x, 4, nd)
        object.position.z += player.speed * nd //* 0

        // never dip into the terrain
        const floor = getTerrainHeight(world.parts, object.position) + PLAYER_SIZE[1] / 2 + PLAYER_TERRAIN_BUFFER

        object.position.y = Math.max(damp(object.position.y, y, 5, nd), floor)
        object.rotation.z = (targetPosition.x - object.position.x) * -.25
        object.rotation.x = (targetPosition.y - object.position.y) * -.2

        player.position.copy(object.position)
        object.position.toArray(client.position)
        grid.updateClient(client)
        debugRef.current?.position.copy(object.position)
    })

    useCollisionDetection({
        client,
        active: () => useStore.getState().state === State.READY,
        building: (data) => damageEntity(data.id, 100),
        tree: (data) => damageEntity(data.id, 100),
        turret: (data) => damageEntity(data.id, 100),
        bullet: (data) => {
            if (data.bullet.owner === Owner.ENEMY) {
                console.log("boom")
            }
        }
    })

    // shoot
    useFrame(() => {
        const { player, state } = useStore.getState()

        if (!player.object || state !== State.READY || !player.keys.space || Date.now() < nextShotAt.current) {
            return
        }

        createBullet({
            position: [
                player.position.x,
                player.position.y - .1,
                // clear of the players own hitbox
                player.position.z + PLAYER_SIZE[2] / 2 + BULLET_SIZE / 2 + .1,
            ],
            owner: Owner.PLAYER,
            rotation: Math.PI * -.5,
            speed: BULLET_SPEED,
        })
        nextShotAt.current = Date.now() + FIRE_FREQUENCY
    })

    return (
        <>
            <group ref={setPlayerObject}>
                <mesh
                    castShadow
                    receiveShadow
                    geometry={nodes.player.geometry}
                    material={spacebits}
                    scale={.5}
                />
            </group>
            <Hitbox
                ref={debugRef}
                position={client.position}
                size={client.size}
            />
        </>
    )
}

useGLTF.preload(playerModel)
