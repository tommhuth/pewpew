import { memo, useEffect, useEffectEvent, useMemo, useRef } from "react"
import TreeModel, { TreeModelRef } from "./tree-model"
import Hitbox from "@components/hitbox"
import { createParticles, CreateParticlesParams } from "@components/effects/particle/particle-mesh"
import { createLeaves } from "@components/effects/leaf/leaf-mesh"
import { removeEntities, useStore } from "@lib/store"
import { useCollisionDetection } from "@src/hooks/use-collision-detection"
import { Owner } from "@src/types/bullet"
import { EntityType, TreeEntity } from "@src/types/entity"
import { Tuple3 } from "@src/types/global"

const trunkSize: Tuple3 = [.28, 1.03, .28]
const crownSize: Tuple3 = [1.25, 1.5, 1.25]
export const crownColor = "#63c7a1"

function Tree({
    id,
    variant,
    health,
    rotation,
    position: [x, y, z],
}: TreeEntity) {
    const grid = useStore(i => i.world.grid)
    const treeModelRef = useRef<TreeModelRef>(null)
    const { trunk, crown, damagedBy } = useMemo(() => {
        return {
            damagedBy: new Set<string>(),
            trunk: grid.createClient(
                [x, y + trunkSize[1] / 2, z],
                trunkSize,
                { id, type: EntityType.TREE }
            ),
            crown: grid.createClient(
                [x, y + trunkSize[1] + crownSize[1] / 2, z],
                crownSize,
                { id, type: EntityType.TREE }
            )
        }
    }, [grid, id, x, y, z])

    // player collision only, bullets pass through
    useCollisionDetection({
        client: trunk,
        autoRemove: false,
    })

    useCollisionDetection({
        client: crown,
        autoRemove: false,
        bullet: ({ bullet, point, normal }) => {
            if (damagedBy.has(bullet.id)) {
                return
            }

            damagedBy.add(bullet.id)
            treeModelRef.current?.hit(normal)
            createParticles({
                position: point,
                offset: [[-.1, .1], [-.1, .1], [0, 0]],
                normal,
                speed: [2, 8],
                spread: [[-.5, .5], [-.5, .5]],
                count: [1, 2],
                radius: [.05, .15],
                stagger: [0, 0],
                color: crownColor,
            })
            createLeaves({
                position: point,
                size: [.2, .2, 0],
                velocity: [-normal[0] * 6, .1, -normal[2] * 6],
                count: [4, 7],
            })

            if (bullet.owner === Owner.PLAYER) {
                health.decrease(15)
            }
        },
    })

    const handleDead = useEffectEvent(() => {
        let sharedProps = {
            normal: [0, .5, 1],
            position: crown.position,
            delay: 0,
            color: crownColor,
        } satisfies Partial<CreateParticlesParams>

        createParticles({
            offset: [[-.5, .5], [-1, 1], [-.5, .5]],
            speed: [3, 8],
            spread: [[-0, 0], [-1, 1]],
            count: [8, 15],
            radius: [.085, .2],
            ...sharedProps
        })
        createParticles({
            offset: [[-.25, .25], [-.51, .51], [-.25, .25]],
            speed: [6, 10],
            spread: [[-1, 1], [-.5, .5]],
            count: [5, 9],
            radius: [.15, .3],
            ...sharedProps
        })
        createLeaves({
            position: crown.position,
            size: crown.size,
            velocity: [0, .5, 0],
            count: [15, 20],
        })
        removeEntities([id])
    })

    useEffect(() => health.onChange(value => {
        if (value === 0) {
            setTimeout(() => handleDead(), 180)
        }
    }), [health])

    useEffect(() => {
        return () => grid.remove(trunk)
    }, [grid, trunk])

    useEffect(() => {
        return () => grid.remove(crown)
    }, [grid, crown])

    return (
        <>
            <TreeModel
                ref={treeModelRef}
                variant={variant}
                position={[x, y, z]}
                rotation-y={rotation}
            />
            <Hitbox
                position={trunk.position}
                size={trunk.size}
            />
            <Hitbox
                position={crown.position}
                size={crown.size}
            />
        </>
    )
}

export default memo(Tree)
