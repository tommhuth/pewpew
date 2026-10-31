declare module "*.glb" {
    const src: string
    export default src
}
// file system access api, chromium only, not in lib.dom yet
interface Window {
    showDirectoryPicker(options?: {
        id?: string
        mode?: "read" | "readwrite"
    }): Promise<FileSystemDirectoryHandle>
}
