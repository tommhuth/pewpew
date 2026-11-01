import { useStore } from "@lib/store"
import { EntityType } from "@src/types/entity"
import Building from "./building"
import Turret from "./turret/turret"
import Tree from "./tree/tree"

export default function Entities() {
    const entities = useStore(i => i.world.entities)

    return entities.map(entity => {
        switch (entity.type) {
            case EntityType.BUILDING:
                return <Building key={entity.id} {...entity} />
            case EntityType.TURRET:
                return <Turret key={entity.id} {...entity} />
            case EntityType.TREE:
                return <Tree key={entity.id} {...entity} />
        }
    })
}
