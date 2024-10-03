/* eslint-disable @typescript-eslint/no-unused-vars */
// import { Stage } from "@pixi/react"
import { GameState } from "./logic"
import { useEffect, useRef, useState } from "react"
// import Ingame from "./Ingame"
import nipplejs, { EventData, JoystickManager, JoystickOutputData } from "nipplejs"

type GameHUDProps = {
    game: GameState,
    blockClientInputs: boolean
}

let _lastDirection: string = "none"

const GameHUD = ({ game, blockClientInputs }: GameHUDProps) => {

    const [customJoystick, setCustomJoystick] = useState<JoystickManager>()
    const [joystickElement, setJoystickElement] = useState<HTMLElement>()
    const gameIdContRef = useRef<HTMLDivElement>(null)
    const [joystickDirection, setJoystickDirection] = useState<string>("none")

    // const forceEndGame = () => {
    //     console.log("Force End Game")
    //     Dusk.actions.endGame()
    // }

    useEffect(() => {
        if (!game) return

        if (customJoystick === undefined && joystickElement === undefined) {
            const joystickElementTemp: HTMLElement = document.querySelector<HTMLElement>("#joystick-zone")!
            setJoystickElement(joystickElementTemp)

            const joystick = nipplejs.create({
                zone: joystickElementTemp,
                size: joystickElementTemp.clientWidth,
                color: "rgba(255,255,255,0.7)",
                mode: "static",
                position: { left: "50%", bottom: "50%" }
            })

            joystick.on("start", () => {
                setJoystickDirection("none")
            })

            joystick.on("move", (_eventData: EventData, output: JoystickOutputData) => {

                if (output !== undefined && output.direction !== undefined && output.direction.angle !== undefined) {
                    if (joystickDirection !== output.direction.angle) {


                        const angles: { angle: number, name: string }[] = [
                            { angle: 22.5, name: "right" },
                            { angle: 67.5, name: "upright" },
                            { angle: 112.5, name: "up" },
                            { angle: 157.5, name: "upleft" },
                            { angle: 202.5, name: "left" },
                            { angle: 247.5, name: "downleft" },
                            { angle: 292.5, name: "down" },
                            { angle: 337.5, name: "downright" }
                        ]

                        let direction = "right";

                        for (let i = 0; i < angles.length; i++) {
                            if (output.angle.degree < angles[i].angle) {
                                direction = angles[i].name
                                break;
                            }
                        }

                        setJoystickDirection(direction)
                    }
                }
            })

            joystick.on("end", () => {
                setJoystickDirection("none")
            })

            setCustomJoystick(joystick)
        }

    }, [game])

    useEffect(() => {
        if (blockClientInputs){
            Dusk.actions.moveCharacter("none")
            return
        }
        
        if (_lastDirection !== joystickDirection) {
            _lastDirection = joystickDirection

            Dusk.actions.moveCharacter(joystickDirection)
        }

    }, [joystickDirection])

    return (
        <div id="game-ui" ref={gameIdContRef}>
            <div id="joystick-zone"></div>
            {/* <div id="endgame-button" onClick={() => forceEndGame()}></div> */}
        </div>
    )
}

export default GameHUD