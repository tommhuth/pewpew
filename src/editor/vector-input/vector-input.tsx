import { Fragment, useRef } from "react"
import { Tuple3 } from "@src/types/global"
import { roundToNearest } from "../store"
import { PLACEMENT_PRECISION } from "../editor-const"

interface VectorInputProps {
    legend: string
    value: Tuple3
    onChange: (value: Tuple3) => void
}

// drag up/down on a value to change it
export function VectorInput({ legend, value, onChange }: VectorInputProps) {
    const translateRef = useRef<Tuple3 | null>(null)

    return (
        <fieldset className="flex flex-col gap-1">
            <legend className="opacity-50 mb-1">
                {legend}
            </legend>

            <div className="flex items-center">
                [
                {value.map((v, index) => (
                    <Fragment key={index}>
                        <input
                            className="w-[4.5em] text-right cursor-ns-resize bg-transparent"
                            type="number"
                            value={v.toFixed(2)}
                            readOnly
                            aria-label={["x", "y", "z"][index]}
                            onPointerDown={({ currentTarget }) => currentTarget.requestPointerLock()}
                            onPointerUp={() => {
                                document.exitPointerLock()
                                onChange(value.map(i => roundToNearest(i, PLACEMENT_PRECISION)) as Tuple3)
                            }}
                            onPointerMove={({ movementY }) => {
                                if (!document.pointerLockElement) {
                                    return
                                }

                                const updated: Tuple3 = [...value]

                                updated[index] -= movementY * .025
                                onChange(updated)
                            }}
                        />
                        {index < 2 ? "," : null}
                    </Fragment>
                ))}
                ]
                <button
                    aria-label="Click and move to translate along x-z plane"
                    className="ml-4 cursor-move"
                    onPointerDown={({ currentTarget }) => {
                        translateRef.current = [...value]
                        currentTarget.requestPointerLock()
                    }}
                    onPointerUp={() => {
                        document.exitPointerLock()
                        translateRef.current = null
                    }}
                    onPointerMove={({ movementX, movementY }) => {
                        const raw = translateRef.current

                        if (!document.pointerLockElement || !raw) {
                            return
                        }

                        // accumulate unsnapped so small moves add up, show it snapped
                        raw[0] -= movementX * .025
                        raw[2] -= movementY * .025

                        onChange([
                            roundToNearest(raw[0], PLACEMENT_PRECISION),
                            value[1],
                            roundToNearest(raw[2], PLACEMENT_PRECISION),
                        ])
                    }}
                >
                    <span className="block scale-200">&harr;</span>
                </button>
            </div>
        </fieldset>
    )
}
