import { memo, useEffect, useEffectEvent, useMemo, useRef, useState } from "react"
import TreeModel from "./tree-model"
import Hitbox from "@components/hitbox"
import { createParticles } from "@components/explosions/particle-mesh"
import { removeEntities, useStore } from "@lib/store"
import { useCollisionDetection } from "@src/hooks/use-collision-detection"
import { Owner } from "@src/types/bullet"
import { EntityType, TreeEntity } from "@src/types/entity"
import { Tuple3 } from "@src/types/global"

// same boxes for every variant, square so rotation doesnt matter
// trunks are ~.19 wide, crowns start around 1.03 and top out at ~2.89
const trunkSize: Tuple3 = [.28, 1.03, .28]
const crownSize: Tuple3 = [1.25, 1.5, 1.25]
// mid step of the crown swatch (col 1, row 2) in the spacebits texture
const crownColor = "#008854"

function Tree({
    id,
    variant,
    health,
    position: [x, y, z],
    rotation,
}: TreeEntity) {
    const grid = useStore(i => i.world.grid)
    const [dead, setDead] = useState(false)
    const ref = useRef(null)
    // both share the entity id, so the player hitting either one damages the tree
    const trunk = useMemo(() => {
        return grid.createClient(
            [x, y + trunkSize[1] / 2, z],
            trunkSize,
            { id, type: EntityType.TREE }
        )
    }, [grid, id, x, y, z])
    const crown = useMemo(() => {
        return grid.createClient(
            [x, y + trunkSize[1] + crownSize[1] / 2, z],
            crownSize,
            { id, type: EntityType.TREE }
        )
    }, [grid, id, x, y, z])

    // player collision only, bullets pass through
    useCollisionDetection({
        client: trunk,
        autoRemove: false,
    })

    useCollisionDetection({
        client: crown,
        autoRemove: false,
        bullet: ({ bullet }) => {
            ref.current?.hit()
            createParticles({
                position: [
                    bullet.line.position.x,
                    bullet.line.position.y,
                    crown.position[2] + crown.size[2] * .3
                ],
                spread: [[0, 0], [0, 0]],
                offset: [[-.1, .1], [-.1, .1], [0, 0]],
                normal: [0, 0, 1],
                speed: [4, 12],
                count: [1, 2],
                radius: [.05, .15],
                stagger: [0, 0],
                color: crownColor,
            })

            if (bullet.owner === Owner.PLAYER && health.decrease(8)) {
                setDead(true)
            }
        },
    })

    const handleDead = useEffectEvent(() => {
        createParticles({
            position: crown.position,
            offset: [[-.5, .5], [-1, 1], [-.5, .5]],
            speed: [2.5, 10],
            normal: [0, 1, 1],
            spread: [[-1, 1], [-1, 1]],
            count: [8, 15],
            radius: [.085, .2],
            color: crownColor,
        })
        createParticles({
            position: crown.position,
            offset: [[-.25, .25], [-.51, .51], [-.25, .25]],
            speed: [1, 10],
            normal: [0, 1, 0],
            spread: [[-.51, .51], [-.5, .5]],
            count: [5, 9],
            radius: [.15, .3],
            color: crownColor,
        })

        setTimeout(() => removeEntities([id]), 150)
    })

    useEffect(() => health.onChange(value => {
        if (value === 0) {
            handleDead()
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
                ref={ref}
                variant={variant}
                position={[x, y, z]}
            //rotation-y={rotation}
            />
            <Hitbox position={trunk.position} size={trunk.size} />
            <Hitbox position={crown.position} size={crown.size} />
        </>
    )
}

export default memo(Tree)
