import { ChangeEvent } from "react"

interface RangeInputProps {
    value: number
    formattedValue: string
    label: string
    onChange: (e: ChangeEvent<HTMLInputElement>) => void
    min: number
    max: number
    step: number
}

export function RangeInput({
    value, formattedValue, label, onChange, min, max, step
}: RangeInputProps) {
    return (
        <div className="flex flex-col gap-1">
            <label className="flex justify-between">
                <span className="opacity-50">{label}</span>
                {formattedValue}
            </label>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={onChange}
            />
        </div>
    )
}