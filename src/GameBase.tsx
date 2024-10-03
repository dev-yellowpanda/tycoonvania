/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useRef, useState } from 'react';
import { IRefPhaserGame, PhaserGame } from './game/PhaserGame';
import { GameState } from './logic';
import { Interpolator, PlayerId } from 'dusk-games-sdk';
import { PlayerData, PlayerTeam, PlayerMethods, PlayerInfo } from './game/objects/Player';
import { VillagerData, VillagerMethods } from './game/objects/Villager';
import { PurchaseSensorData, PurchaseSensorInfo, PurchaseSensorMethods } from './game/objects/PurchaseSensor';
import { DecorationData, DecorationInfo, DecorationMethods } from './game/objects/Decoration';
import { EventBus } from './game/EventBus';
import tiledMap from "../public/assets/maps/NewMap.json";
import { TutorialArrowInfo, TutorialArrowMethods } from './game/objects/TutorialArrow';
//import tiledMap from "./maps/NewMap.json";


//PROBLEMA: Aqui no gamebase não tem nenhum método q seja chamado no momento q o jogo reseta, a fim de limpar os elementos do Phaser

export type GameBaseProps = {
    game: GameState,
    yourPlayerId: PlayerId

    //Players
    ingamePlayersList: PlayerData[],
    setIngamePlayersList: (_infos: PlayerData[]) => void

    //Villagers
    ingameVillagersList: VillagerData[],
    setIngameVillagersList: (_infos: VillagerData[]) => void

    //Purchase Sensors
    ingamePurchaseSensors: { [id: number]: PurchaseSensorData },
    setIngamePurchaseSensors: (_infos: { [id: number]: PurchaseSensorData }) => void

    //Decorations
    ingameDecorations: { [id: number]: DecorationData }
    setIngameDecorations: (_infos: { [id: number]: DecorationData }) => void

    setRandomIdToForceRefresh: (_number: number) => void
    yourPlayerTeam: PlayerTeam
    setYourPlayerTeam: (_text: PlayerTeam) => void
    currentPlayerInterpolator: Interpolator<number | number[]> | undefined
    blockClientInputs: boolean
    setBlockClientInputs: (_bool: boolean) => void

    soundManager: Phaser.Sound.WebAudioSoundManager,
    setSoundManager: (_info: Phaser.Sound.WebAudioSoundManager) => void

    gameEnded: boolean
    tutorialArrow: TutorialArrowInfo
    setTutorialArrow: (_tutorialInfo: TutorialArrowInfo) => void

    tutorialRunning: boolean
    setTutorialRunning: (_boolean: boolean) => void
}

export function GameBase(props: GameBaseProps) {

    const [focus, setFocus] = useState(document.hasFocus());

    const { currentPlayerInterpolator, game, yourPlayerId,
        ingamePlayersList, setIngamePlayersList,
        ingameVillagersList,
        ingamePurchaseSensors,
        ingameDecorations,
        setRandomIdToForceRefresh,
        setYourPlayerTeam,
        setSoundManager,
        gameEnded,
        tutorialArrow,
        setTutorialArrow,
        tutorialRunning
    } = props;

    const [playerListInitialized, setPlayerListInitialized] = useState<boolean>(false);

    const phaserRef = useRef<IRefPhaserGame | null>(null);
    const [phaserCurrentScene, setPhaserCurrentScene] = useState<Phaser.Scene | null>(null);

    const currentScene = (scene: Phaser.Scene) => {
        setPhaserCurrentScene(scene);
    }

    const onPhaserUpdate = () => {

        //let time = window.performance.now();
        //const timestamps = [];

        if (phaserCurrentScene) {
            if (playerListInitialized) //Se não inicializou ainda, ignora isso
                CheckPlayersList(phaserCurrentScene); //Criando de novo aqui

            EventBus.emit('scene-game-props', props);

            if (phaserCurrentScene.scene.isPaused("MainMenu")) return;
        }

        // timestamps.push({ name: "CheckPlayersList()", time: window.performance.now() - time, steps: []});
        // time = window.performance.now();

        for (let i = 0; i < game.playersList.length; i++) {
            const specificEl = ingamePlayersList.find((el) => el.playerInfo.playerId === game.playersList[i].playerId)
            PlayerMethods.update(specificEl, props);

            if(yourPlayerId && specificEl){
                if(yourPlayerId === specificEl.playerInfo.playerId){
                    if(tutorialRunning && tutorialArrow){
                        if (tutorialArrow.internalTutorialStep === 0 && specificEl.playerInfo.bloodCount >= 50) {
                            TutorialArrowMethods.NextStep(tutorialArrow, 1, props);
                        }
                    }
                }
            }
        }

        // timestamps.push({ name: "PlayerData Update", time: window.performance.now() - time, steps: []});
        // time = window.performance.now();

        for (let i = 0; i < game.villagersList.length; i++) {
            VillagerMethods.update(game, ingameVillagersList[i]);
        }

        TutorialArrowMethods.update(tutorialArrow, props)

        // timestamps.push({ name: "Villagers Update", time: window.performance.now() - time, steps: []});
        // time = window.performance.now();

        const vsteps = [];

        for (const key in game.purchaseSensors) {
            const st = PurchaseSensorMethods.update(ingamePurchaseSensors[key], props);
            st.forEach(s => {
                const vf = vsteps.find(v => v.name == s.name);
                if (vf) {
                    vf.time += s.time;
                }
                else {
                    vsteps.push(s);
                }
            });
        }

        // timestamps.push({ name: "Purchase Sensors Update", time: window.performance.now() - time, steps: vsteps});
        // time = window.performance.now();

        for (const key in game.decorations) {
            DecorationMethods.update(ingameDecorations[key]);
        }

        // timestamps.push({ name: "Decorations Update", time: window.performance.now() - time, steps: []});
        // time = window.performance.now();


        //console.log("Player " + yourPlayerId + "\n" +  timestamps.map(t => t.name + ": " + t.time + "\n" + t.steps.map(s => "\t" + s.name + ": " + s.time).join("\n")).join("\n"));
    }

    useEffect(() => {

        console.trace("Changing phaserCurrentScene");

        if (phaserCurrentScene) {

            const soundManager = new Phaser.Sound.WebAudioSoundManager(phaserCurrentScene.game);
            setSoundManager(soundManager)

            CheckPlayersList(phaserCurrentScene); //Criando o player aqui
            CheckVillagers(phaserCurrentScene);
            CheckSensors(phaserCurrentScene, soundManager);
            CheckDecorations(phaserCurrentScene);

            if (game.playersList.length <= 0) {
                clearAllCharacters()
            }
        }
    }, [phaserCurrentScene])

    useEffect(() => {

        if (gameEnded) {
            //ACABOU DE ACABAR O JOGO

            TutorialArrowMethods.Destroy(tutorialArrow, props)

            for (const key in ingamePurchaseSensors) {
                const purchase = ingamePurchaseSensors[key];
                const tiledObject: any = tiledMap.layers.find(l => l.name == "Purchase").objects.find(o => o.id == purchase.info.id);

                let enabled = true;
                if (tiledObject.properties) {
                    const enabledProp = tiledObject.properties.find(prop => prop.name == "enabled");
                    if (enabledProp) {
                        enabled = enabledProp.value;
                    }
                }

                PurchaseSensorMethods.reset(purchase, enabled);
            }

            for (const key in ingameDecorations) {
                const decoration = ingameDecorations[key];
                const tiledObject: any = tiledMap.layers.find(l => l.name == "Decoration").objects.find(o => o.id == decoration.info.id);

                let enabled = true;
                if (tiledObject.properties) {
                    const enabledProp = tiledObject.properties.find(prop => prop.name == "enabled");
                    if (enabledProp) {
                        enabled = enabledProp.value;
                    }
                }

                DecorationMethods.reset(decoration, enabled);
            }
        }

    }, [gameEnded])

    const CheckPlayersList = (phaserScene: Phaser.Scene) => {

        const newList: PlayerData[] = [];
        //Distinct
        for (let i = 0; i < ingamePlayersList.length; i++) {
            if (newList.find(l => l.playerInfo.playerId == ingamePlayersList[i].playerInfo.playerId) == undefined) {
                newList.push(ingamePlayersList[i]);
            }
        }

        // console.log(
        //      "ingamePlayersList: " + newList.map(d => d.playerInfo.playerId) + 
        //     "\ngame.playersList: " + game.playersList.map(p => p.playerId));

        for (let i = 0; i < game.playersList.length; i++) {
            const playerInfo: PlayerInfo = game.playersList[i];
            const playerData: PlayerData = newList.find(p => p.playerInfo.playerId == playerInfo.playerId);

            if (!playerData) { //Recebendo um player do server que não existe
                const player: PlayerData = PlayerMethods.construct(
                    props,
                    phaserScene,
                    playerInfo,
                    currentPlayerInterpolator,
                    playerInfo.playerId == yourPlayerId);

                newList.push(player);
                console.log("adicionando player " + player.playerInfo.playerId + " | " + newList.map(p => p.playerInfo.playerId));

                if (yourPlayerId === playerInfo.playerId) {
                    setYourPlayerTeam(player.playerInfo.playerTeam)
                    setTutorialArrow(TutorialArrowMethods.construct(phaserCurrentScene, player.playerSprite, player.playerInfo.playerTeam, game))
                }

                setRandomIdToForceRefresh(Math.random())
            }
        }

        for (let i = 0; i < newList.length; i++) {
            const playerData: PlayerData = newList[i];
            const playerInfo: PlayerInfo = game.playersList.find(p => p.playerId == playerData.playerInfo.playerId);

            if (!playerInfo) { //Existe um player local q não existe no server
                PlayerMethods.destroy(playerData);
                newList.splice(i, 1)
                console.log("new player count: " + newList.length);
                setRandomIdToForceRefresh(Math.random())
            }
        }

        setPlayerListInitialized(true);
        setIngamePlayersList(newList);

        setRandomIdToForceRefresh(Math.random())

    }

    const CheckVillagers = (phaserScene: Phaser.Scene) => {
        for (let i = 0; i < game.villagersList.length; i++) {
            if (ingameVillagersList[i] === undefined) {
                const villager: VillagerData = VillagerMethods.construct(game.villagersList[i], phaserScene);
                ingameVillagersList[i] = villager;
            }
        }
    }

    const CheckSensors = (phaserScene: Phaser.Scene, soundManager: Phaser.Sound.WebAudioSoundManager) => {
        for (const key in game.purchaseSensors) {
            const purchase: PurchaseSensorInfo = game.purchaseSensors[key];
            if (ingamePurchaseSensors[key] == undefined) {
                ingamePurchaseSensors[key] = PurchaseSensorMethods.construct(props, phaserScene, purchase, soundManager);
            }
        }
    }

    const CheckDecorations = (phaserScene: Phaser.Scene) => {
        for (const key in game.decorations) {
            const decoration: DecorationInfo = game.decorations[key];

            if (ingameDecorations[key] == undefined) {
                ingameDecorations[key] = DecorationMethods.construct(phaserScene, decoration);
            }
            else {
                DecorationMethods.resetInfo(ingameDecorations[key], decoration);
            }
        }

        for (const key in ingameDecorations) {
            if (game.decorations[key] === undefined) {
                DecorationMethods.destroy(ingameDecorations[key], game);
                Object.assign(ingameDecorations[key], undefined);
            }
        }
    }

    const clearAllCharacters = () => {
        ingamePlayersList.forEach((playerEl) => {
            PlayerMethods.destroy(playerEl);
        });
        setIngamePlayersList([])
        setRandomIdToForceRefresh(Math.random())
    }

    useEffect(() => {
        // helper functions to update the status
        const onFocus = () => setFocus(true);
        const onBlur = () => setFocus(false);

        // assign the listener
        // update the status on the event
        window.addEventListener("focus", onFocus);
        window.addEventListener("blur", onBlur);

        // remove the listener
        return () => {
            window.removeEventListener("focus", onFocus);
            window.removeEventListener("blur", onBlur);
        };
    }, []);

    useEffect(() => {
        //console.log(focus)
    }, [focus])

    if (!game) {
        return null
    }

    return (
        <div id="game-box">
            <PhaserGame ref={phaserRef} currentActiveScene={currentScene} onPhaserUpdate={onPhaserUpdate} />
        </div>
    )
}
