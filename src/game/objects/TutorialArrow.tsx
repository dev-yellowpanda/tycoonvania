import { GameBaseProps } from "../../GameBase"
import { GameState, MapScale, TutorialPurchaseIndexLimit } from "../../logic"
import { VectorHelp } from "../../VectorHelp"
import { PlayerTeam } from "./Player"
import { PurchaseSensorInfo } from "./PurchaseSensor"

export type TutorialArrowInfo = {
    phaserScene: Phaser.Scene,
    playerObject: Phaser.GameObjects.Sprite | undefined,
    arrowSprite: Phaser.GameObjects.Sprite | undefined,
    showing: boolean,
    spriteTarget: Phaser.GameObjects.Sprite | undefined,
    positionTarget: number[],
    targetPoint: number,
    villagerID: number,
    purchaseID: number,
    internalTutorialStep: number,
    // purchaseSensorsIDsList: PurchaseSensorInfo[] | undefined,
    purchaseSensorsIDsList: number[] | undefined,
}

export type Vector2Temp = {
    x: number,
    y: number
}

export class TutorialArrowMethods {

    public static construct(
        phaserScene: Phaser.Scene,
        playerObject: Phaser.GameObjects.Sprite,
        playerTeam: PlayerTeam,
        gameState: GameState,
    ) {
        const tutArrow: TutorialArrowInfo = {
            phaserScene: phaserScene,
            playerObject: playerObject,
            arrowSprite: phaserScene.add.sprite(0, 0, "tutArrow"),
            showing: false,
            spriteTarget: undefined,
            positionTarget: [],
            targetPoint: 0,
            villagerID: -1,
            purchaseID: -1,
            internalTutorialStep: 0,
            purchaseSensorsIDsList: []
        }

        tutArrow.arrowSprite.setAlpha(0)
        tutArrow.arrowSprite.setAngle(tutArrow.targetPoint)
        tutArrow.arrowSprite.setPosition(tutArrow.playerObject.x, tutArrow.playerObject.y)
        tutArrow.arrowSprite.setScale(-0.8 * MapScale)
        tutArrow.arrowSprite.setOrigin(1.5, 0.5)

        const purshaseSensorsList: PurchaseSensorInfo[] = []

        Object.keys(gameState.purchaseSensors).map((el) => {

            if (gameState.purchaseSensors[el]["playerTeam"] === playerTeam) {
                purshaseSensorsList.push(gameState.purchaseSensors[el])
            }
        })

        const arraySorted = purshaseSensorsList.slice().sort((a, b) => a.cost - b.cost)
        // tutArrow.purchaseSensorsIDsList = arraySorted
        arraySorted.forEach((el)=> {
            tutArrow.purchaseSensorsIDsList.push(el.id)
        })

        return tutArrow
    }

    public static update(self: TutorialArrowInfo, game: GameBaseProps) {
        if (!self || !game.tutorialRunning) return

        self.arrowSprite.setPosition(self.playerObject.x, self.playerObject.y)

        if (self.spriteTarget === undefined && game.tutorialRunning && self.internalTutorialStep === 0) {

            const randomIndex = Math.floor(Math.random() * game.ingameVillagersList.length)

            if (game.ingameVillagersList[randomIndex].data.bloodCount > 0) {
                self.villagerID = randomIndex
                self.spriteTarget = game.ingameVillagersList[randomIndex].sprite
                self.showing = true
            }
        }

        if (self.spriteTarget !== undefined) {

            if (game.tutorialRunning && self.internalTutorialStep === 0) {
                if (game.ingameVillagersList[self.villagerID].data.bloodCount <= 0) {
                    self.spriteTarget = undefined
                    self.villagerID = -1

                    return
                }
            }

            if(game.tutorialRunning && self.internalTutorialStep === 1) {
                // console.log(game.ingamePurchaseSensors[self.purchaseSensorsIDsList[self.purchaseID]])
                
                if(!game.ingamePurchaseSensors[self.purchaseSensorsIDsList[self.purchaseID]].info.visible)
                    TutorialArrowMethods.NextPurchaseSensor(self, game.ingamePurchaseSensors[self.purchaseSensorsIDsList[self.purchaseID]].info, game)
            }

            if (self.internalTutorialStep === 0) {
                self.targetPoint = Phaser.Math.Angle.BetweenPoints(self.playerObject, self.spriteTarget)
            }
            else {
                const vetor2Position: Vector2Temp = { x: self.positionTarget[0], y: self.positionTarget[1] }
                self.targetPoint = Phaser.Math.Angle.BetweenPoints(self.playerObject, vetor2Position)
            }

            const playerPoint: number[] = [self.playerObject.x, self.playerObject.y]
            const targetPoint: number[] = [self.internalTutorialStep === 0 ? self.spriteTarget.x : self.positionTarget[0], self.internalTutorialStep === 0 ? self.spriteTarget.y : self.positionTarget[1]]

            const distance = VectorHelp.distanceFrom(playerPoint, targetPoint);

            if (self.showing) {
                if (distance > 2200) {
                    if (self.arrowSprite.alpha !== 1)
                        self.arrowSprite.setAlpha(1)
                }
                else if (distance > 2000) {
                    if (self.arrowSprite.alpha !== 0.85)
                        self.arrowSprite.setAlpha(0.85)
                }
                else if (distance > 1800) {
                    if (self.arrowSprite.alpha !== 0.7)
                        self.arrowSprite.setAlpha(0.7)
                }
                else if (distance > 1600) {
                    if (self.arrowSprite.alpha !== 0.6)
                        self.arrowSprite.setAlpha(0.6)
                }
                else if (distance > 1400) {
                    if (self.arrowSprite.alpha !== 0.5)
                        self.arrowSprite.setAlpha(0.5)
                }
                else if (distance > 1200) {
                    if (self.arrowSprite.alpha !== 0.4)
                        self.arrowSprite.setAlpha(0.4)
                }
                else if (distance > 1000) {
                    if (self.arrowSprite.alpha !== 0.3)
                        self.arrowSprite.setAlpha(0.3)
                }
                else if (distance > 800) {
                    if (self.arrowSprite.alpha !== 0.23)
                        self.arrowSprite.setAlpha(0.23)
                }
                else if (distance > 600) {
                    if (self.arrowSprite.alpha !== 0.15)
                        self.arrowSprite.setAlpha(0.15)
                }
                else {
                    if (self.arrowSprite.alpha !== 0)
                        self.arrowSprite.setAlpha(0)
                }
            }
        }

        if (self.showing)
            self.arrowSprite.setAngle(Phaser.Math.RadToDeg(self.targetPoint))
    }

    public static NextStep(self: TutorialArrowInfo, newStep: number, game: GameBaseProps) {
        if (!self) return
        if (self.internalTutorialStep === newStep) return
        self.internalTutorialStep = newStep

        if (self.internalTutorialStep === 1) {
            self.purchaseID = 0

            // console.log(game.ingamePurchaseSensors[self.purchaseSensorsIDsList[self.purchaseID]])

            if (game.ingamePurchaseSensors[self.purchaseSensorsIDsList[self.purchaseID]].info.visible) {
                self.positionTarget = game.ingamePurchaseSensors[self.purchaseSensorsIDsList[self.purchaseID]].info.position
            }
            else {
                TutorialArrowMethods.NextPurchaseSensor(self, game.ingamePurchaseSensors[self.purchaseSensorsIDsList[self.purchaseID]].info, game)
            }
        }
        else {
            self.spriteTarget === undefined
            self.showing = false
        }
    }

    public static NextPurchaseSensor(self: TutorialArrowInfo, purchased: PurchaseSensorInfo, game: GameBaseProps) {
        if (!self) return

        console.log(purchased)
        console.log(game.ingamePurchaseSensors[self.purchaseSensorsIDsList[self.purchaseID]].info.id)

        if (purchased) {

            if (purchased.id === game.ingamePurchaseSensors[self.purchaseSensorsIDsList[self.purchaseID]].info.id) {
                self.purchaseID++;

                if (self.purchaseID >= TutorialPurchaseIndexLimit) {
                    TutorialArrowMethods.DismissTutorial(self, game)
                    return
                }

                if (game.ingamePurchaseSensors[self.purchaseSensorsIDsList[self.purchaseID]].info.visible) {
                    self.positionTarget = game.ingamePurchaseSensors[self.purchaseSensorsIDsList[self.purchaseID]].info.position
                }
                else {
                    TutorialArrowMethods.NextPurchaseSensor(self, game.ingamePurchaseSensors[self.purchaseSensorsIDsList[self.purchaseID]].info, game)
                }
            }
        }
    }

    public static ChangeAimTarget(self: TutorialArrowInfo, newAim: Phaser.GameObjects.Sprite) {
        if (!self) return

        self.spriteTarget = newAim
    }

    public static DismissTutorial(self: TutorialArrowInfo, game: GameBaseProps) {
        if (!self) return

        self.showing = false
        self.arrowSprite.setAlpha(0)
        game.setTutorialRunning(false)
    }

    public static Destroy(self: TutorialArrowInfo, game: GameBaseProps) {
        if (!self) return
        game.setTutorialArrow(undefined)
        self.arrowSprite!.destroy()
    }
}