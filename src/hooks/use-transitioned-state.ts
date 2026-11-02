import { Dispatch, SetStateAction, startTransition, useCallback, useState } from "react"

export function useTransitionedState<T>(initialState: T | (() => T)): [T, Dispatch<SetStateAction<T>>] {
    const [state, setState] = useState(initialState)
    // stable identity, setters are often passed as ref callbacks
    const setTransitionedState = useCallback((value: SetStateAction<T>) => {
        startTransition(() => setState(value))
    }, [])

    return [state, setTransitionedState]
}
