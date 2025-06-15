import { interpolate, useAnimatedStyle } from 'react-native-reanimated'

import { useMinimalShellMode } from '@/lib/context/header-transform'
import { HEADER_HEIGHT } from '@/lib/constants'
import { useAtomValue } from 'jotai'

// Keep these separated so that we only pay for useAnimatedStyle that gets used.

export function useMinimalShellHeaderTransform() {
    const headerHeight = useAtomValue(HEADER_HEIGHT)
    const { headerMode } = useMinimalShellMode()

    const headerTransform = useAnimatedStyle(() => {
        const headerModeValue = headerMode.get()
        return {
            pointerEvents: headerModeValue === 0 ? 'auto' : 'none',
            opacity: Math.pow(1 - headerModeValue, 2),
            transform: [
                {
                    translateY: interpolate(
                        headerModeValue,
                        [0, 1],
                        [0, -headerHeight],
                    ),
                },
            ],
        }
    })

    return headerTransform
}
