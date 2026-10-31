import { toStoredMap, useEditorStore } from "./store"

// assets/maps, picked on first save and reused until the page reloads
let directory: FileSystemDirectoryHandle | null = null

async function writeJson(folder: string, name: string, data: unknown) {
    if (!directory) {
        directory = await window.showDirectoryPicker({ id: "pewpew-maps", mode: "readwrite" })
    }

    try {
        // no create, so picking the wrong folder fails instead of making new ones
        const dir = await directory.getDirectoryHandle(folder)
        const file = await dir.getFileHandle(`${name}.json`, { create: true })
        const writable = await file.createWritable()

        await writable.write(JSON.stringify(data, null, 4) + "\n")
        await writable.close()
    } catch (e) {
        directory = null
        throw e
    }
}

// syncs every map in the store to assets/maps/map/<name>.json
export async function save() {
    const { maps } = useEditorStore.getState()

    try {
        for (const [name, map] of Object.entries(maps)) {
            await writeJson("map", name, toStoredMap(map))
        }
    } catch (e) {
        console.error(e)
        alert("Save failed, pick the assets/maps folder")
    }
}
