import config from "@lib/config"
import Debug from "./debug"

export default function Ui() {
    return (
        <>
            {config.debug && <Debug />}
        </>
    )
}
