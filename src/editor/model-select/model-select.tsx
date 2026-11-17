import { modelGroups, ModelType } from "@components/model"
import { EntityType } from "@src/types/entity"

interface ModelSelectProps {
    value: ModelType | EntityType
    onChange: (value: ModelType | EntityType) => void
}

export function ModelSelect({ value, onChange }: ModelSelectProps) {
    let values = Object.values(modelGroups).flatMap((i) => i)
    const step = (direction: 1 | -1) => {
        const index = values.indexOf(value)
        const newValue = values[(index + direction + values.length) % values.length]

        onChange(newValue)
    }

    return (
        <fieldset className="relative -mt-3">
            <legend className="sr-only">Model picker</legend>

            <div className="absolute right-0 top-0 bottom-0 flex z-1">
                <button
                    className="p-2 cursor-pointer"
                    onClick={() => step(-1)}
                >
                    &lt;
                </button>
                <button className="p-2 cursor-pointer"
                    onClick={() => step(1)}
                >
                    &gt;
                </button>
            </div>

            <div className="group/top relative text-[.7rem] ">
                <div aria-hidden className="px-3 py-2 -mx-3 bg-[#666] group-hover/top:invisible">
                    {value || "Model picker"}
                </div>
                <ul
                    onWheel={e => e.stopPropagation()}
                    className="hidden text-white  group-hover/top:block absolute  bottom-0 -left-3 -right-3"
                >
                    {Object.entries(modelGroups).map(([label, types]) => {
                        return (
                            <li
                                key={label}
                                className="relative group/inner border-b-[#444] border-b"
                            >
                                <div className="px-3 py-2  bg-[rgba(0,0,0,.75)] cursor-pointer group-hover/inner:bg-[#222] group-has-checked/inner:bg-blue-900">
                                    {label}
                                </div>
                                <ul
                                    onWheel={e => e.stopPropagation()}
                                    className="absolute max-h-80 overflow-scroll bg-[rgba(0,0,0,.75)] min-w-48 left-full ml-0 top-[50%] translate-y-[-50%] hidden group-hover/inner:block"
                                >
                                    {types.map(i => {
                                        return (
                                            <li
                                                key={i}
                                                className="border-b-[#444] border-b"
                                            >
                                                <label className="hover:bg-[#222] has-checked:bg-blue-700 px-3 py-2 has-checked:text-white cursor-pointer flex items-center content-center gap-2">
                                                    <input
                                                        className="sr-only"
                                                        type="radio"
                                                        value={i}
                                                        name="m"
                                                        checked={i === value}
                                                        onChange={({ currentTarget }) => {
                                                            onChange(currentTarget.value as ModelSelectProps["value"])
                                                        }}
                                                    />
                                                    {i}
                                                </label>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </fieldset>
    )
}