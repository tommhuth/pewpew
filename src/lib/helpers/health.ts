export default class Health {
    public value: number
    private callback: ((value: number) => void) | null = null

    constructor(value: number) {
        this.value = value
    }

    // returns true if this hit killed it, already dead ones ignore further damage
    decrease(amount: number) {
        if (this.value === 0) {
            return false
        }

        this.value = Math.max(this.value - amount, 0)
        this.callback?.(this.value)

        return this.value === 0
    }

    // one listener, returns the unsubscribe so it can be returned straight from a useEffect
    // fires right away with the current value, damage can land before the effect has run
    onChange(callback: (value: number) => void) {
        this.callback = callback

        callback(this.value)

        return () => {
            if (this.callback === callback) {
                this.callback = null
            }
        }
    }
}
