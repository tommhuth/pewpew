export default class Health {
    public value: number
    private callback: ((value: number) => void) | null = null
    private missed = false

    constructor(value: number) {
        this.value = value
    }

    // returns true if this hit killed it, already dead ones ignore further damage
    decrease(amount: number) {
        if (this.value === 0) {
            return false
        }

        this.value = Math.max(this.value - amount, 0)

        if (this.callback) {
            this.callback(this.value)
        } else {
            this.missed = true
        }

        return this.value === 0
    }

    // one listener, returns the unsubscribe so it can be returned straight from a useEffect
    // damage can land before the effect has run, so replay it once on subscribe if it did
    onChange(callback: (value: number) => void) {
        this.callback = callback

        if (this.missed) {
            this.missed = false
            callback(this.value)
        }

        return () => {
            if (this.callback === callback) {
                this.callback = null
            }
        }
    }
}
