/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { GameState, WinScore } from './logic';
import { Interpolator, PlayerId } from 'dusk-games-sdk';
import GameHUD from './GameHUD';
import { GameBase } from './GameBase';
import { PlayerTeam, PlayerData, PlayerInfo, PlayerMethods } from './game/objects/Player';
import { VillagerData } from './game/objects/Villager';
import { PurchaseSensorData } from './game/objects/PurchaseSensor';
import { DecorationData } from './game/objects/Decoration';
import { TutorialArrowInfo } from './game/objects/TutorialArrow';

function App() {
  const [randomIdToForceRefresh, setRandomIdToForceRefresh] = useState<number>(0) //RESPONSIBLE FOR THE HEADER TEXT UPDATE
  const [customGame, setCustomGame] = useState<GameState | null>(null)
  const [yourPlayerId, setYourPlayerId] = useState<PlayerId | undefined>()
  const [yourPlayerTeam, setYourPlayerTeam] = useState<PlayerTeam>(PlayerTeam.None)
  const [duskAlreadyStarted, setDuskAlreadyStarted] = useState<boolean>(false)
  const [rankingBoxRefferenced, setRankingBoxRefferenced] = useState<boolean>(false)
  const [progressBarRefferenced, setProgressBarRefferenced] = useState<boolean>(false)
  const [canStartGame, setCanStartGame] = useState<boolean>(false)
  const [gameEnded, setGameEnded] = useState<boolean>(false)
  const [blockClientInputs, setBlockClientInputs] = useState<boolean>(false)
  const [avoidAudio, setAvoidAudio] = useState<boolean>(false)
  const [ingamePlayersList, setIngamePlayersList] = useState<PlayerData[]>([])
  const [tutorialArrow, setTutorialArrow] = useState<TutorialArrowInfo>()
  const [ingameVillagersList, setIngameVillagersList] = useState<VillagerData[]>([])
  const [ingamePurchaseSensors, setIngamePurchaseSensors] = useState<{ [id: number]: PurchaseSensorData }>({})
  const [ingameDecorations, setIngameDecorations] = useState<{ [id: number]: DecorationData }>({})
  const [soundManager, setSoundManager] = useState<Phaser.Sound.WebAudioSoundManager | null>(null)

  const [userBlood, setUserBlood] = useState<number>(0)
  const [progressBar, setProgressBar] = useState<number>(0)

  const rankingPlayersBoxRef = useRef<HTMLDivElement | null>(null)
  const progressBarRef = useRef<HTMLDivElement | null>(null)

  const [gameStarted, setGameStarted] = useState<boolean>(false)

  const [tutorialRunning, setTutorialRunning] = useState<boolean>(false)
  // const [tutorialStep, setTutorialStep] = useState<number>(0)

  const refRankingPlayersBox = useCallback((node: HTMLDivElement) => {
    if (node !== null) {
      rankingPlayersBoxRef.current! = node
      setRankingBoxRefferenced(true)
      console.log(rankingBoxRefferenced)
    }
  }, [])

  const refProgressBar = useCallback((node: HTMLDivElement) => {
    if (node !== null) {
      progressBarRef.current! = node
      setProgressBarRefferenced(true)
      console.log(progressBarRefferenced)
    }
  }, [])

  const [currentPlayerInterpolator, setCurrentPlayerInterpolator] = useState<Interpolator<number | number[]>>()

  useEffect(() => {
    setCurrentPlayerInterpolator(Dusk.interpolator())
  }, [])

  useEffect(() => {

    if (!currentPlayerInterpolator) return

    Dusk.initClient({

      onChange: ({ game, action, yourPlayerId, futureGame }) => {
        if (game === undefined) return;

        if (futureGame) {

          const gameEl = game.playersList.find((el) => el.playerId === yourPlayerId)
          const futureGameEl = futureGame.playersList.find((el) => el.playerId === yourPlayerId)

          //CHECK FOR EVERY PLAYER EVEN IF ITS THE SAME PLAYER ID, IT WILL BE SOLVED ON MOVEMENT TICK INSIDE INGAME.TSX
          for (let i = 0; i < game.playersList.length; i++) {
            const allGameEl = game.playersList[i]
            const allFutureGameEl = futureGame.playersList[i]

            if (gameEl && allFutureGameEl) {

              const specificEl = ingamePlayersList.find((el) => el.playerInfo.playerId === allGameEl.playerId)

              specificEl?.onlineInterpolator?.update({
                game: allGameEl.playerPos,
                futureGame: allFutureGameEl.playerPos
              })
            }
          }

          if (gameEl && futureGameEl) {
            currentPlayerInterpolator.update({
              game: gameEl.playerPos,
              futureGame: futureGameEl.playerPos
            })
          }
        }

        for (const key in ingamePurchaseSensors) {
          if (ingamePurchaseSensors[key]) {
            ingamePurchaseSensors[key].info = game.purchaseSensors[key];
          }
        }

        for (let i = 0; i < game.villagersList.length; i++) {
          if (ingameVillagersList[i])
            ingameVillagersList[i].data = game.villagersList[i];
        }

        for (const key in ingameDecorations) {
          if (ingameDecorations[key]) {
            ingameDecorations[key].info = game.decorations[key];
          }
        }

        if (game.time === 0 || customGame === null) {
          setGameEnded(false)
          setCanStartGame(true)

          setRandomIdToForceRefresh(Math.random())
          UpdateRankingList(game.playersList.slice())

          setTutorialRunning(true)
        }

        setCustomGame(game)
        setYourPlayerId(yourPlayerId)

        if (!duskAlreadyStarted)
          setDuskAlreadyStarted(true)

        if (!game.playersList.some((playerEl) => playerEl.playerId === yourPlayerId)) return

        const currentPlayer: PlayerInfo = game.playersList.find((playerEl) => playerEl.playerId === yourPlayerId);

        if (currentPlayer.bloodCount !== userBlood) {
          setUserBlood(Math.max(0, Math.floor(currentPlayer.bloodCount)))
        }

        if (action && action.name === "firstSetup") {
          setGameEnded(false)
          setCanStartGame(true)

          setRandomIdToForceRefresh(Math.random())
          UpdateRankingList(game.playersList.slice())
        }

        if (action && action.name === "updatePoints") {
          UpdateRankingList(game.playersList.slice())
        }

        if (action && action.name === "updatePlayerIdsList") {
          // console.log("Update Players List")
          UpdateRankingList(game.playersList.slice())
        }

        if (action && action.name === "endGame") {
          console.log("End game")
          setGameEnded(true)

          //Limpa os objetos do Phaser
        }

        //FORCE TO RENDER AT LEAST ONE TIME RANKING WITH INFOS
        if (rankingPlayersBoxRef.current) {
          if (rankingPlayersBoxRef.current.innerHTML == "")
            UpdateRankingList(game.playersList.slice())
        }
      },

    })

  }, [currentPlayerInterpolator])


  useEffect(() => {

    if (!customGame) return;

    //Aqui é onde sincroniza o Info da rede com o Data
    for (let i = 0; i < customGame.playersList.length; i++) {

      const playerInfo = customGame.playersList[i];
      const playerData = ingamePlayersList.find(p => p.playerInfo.playerId == playerInfo.playerId);

      if (playerData) {

        if (playerData.playerInfo.rankingScore !== playerInfo.rankingScore) {
          UpdateRankingList(customGame.playersList.slice())
        }
        playerData.playerInfo = playerInfo;
        PlayerMethods.refresh(playerData, yourPlayerId == playerInfo.playerId)
      }
      else {
        //ingamePlayersList tá vindo vazio aqui
        console.log("Não consegui encontrar o player " + playerInfo.playerId + " na lista de ingame: " + JSON.stringify(ingamePlayersList.map(p => p.playerInfo.playerId)));
      }
    }


  }, [ingamePlayersList])

  useEffect(() => {
    ingamePlayersList.forEach(el => {
      if (yourPlayerId === el.playerInfo.playerId)
        setYourPlayerTeam(el.playerInfo.playerTeam)
    })
  }, [randomIdToForceRefresh])

  useEffect(() => {
    if (duskAlreadyStarted) {

      setGameStarted(true);

      Dusk.actions.firstSetup()

      if (customGame?.playerIds.length !== customGame?.playersList.length) {
        Dusk.actions.updatePlayerIdsList()
      }
    }

  }, [duskAlreadyStarted]);

  useEffect(() => {

    const percentOfBar: number = (100 * progressBar) / WinScore

    if (progressBarRef.current) {
      progressBarRef.current.style.width = `${percentOfBar}%`;
    }

  }, [progressBar])

  const UpdateRankingList = (rankingList: PlayerInfo[]) => {
    // console.log("Update ranking here")

    const rankingSorted = rankingList.slice().sort((a, b) => b.rankingScore - a.rankingScore)

    let rankingText = ""

    rankingSorted.forEach((el) => {

      if (el.playerId === yourPlayerId) {
        setProgressBar(el.rankingScore)
      }

      const currentTeam = el.playerTeam;
      const teamString = PlayerTeam[currentTeam];
      // console.log(teamString);
      rankingText += `<div class="ranking-player-line">
      <div class="ranking-team-gem ${teamString.toLowerCase()}"></div>
      <div class="ranking-name">${Dusk.getPlayerInfo(el.playerId).displayName}</div>
      <div class="ranking-score">${el.rankingScore}</div>
      </div>`
    })

    if (rankingPlayersBoxRef.current) {
      rankingPlayersBoxRef.current.innerHTML = rankingText
    }

  }

  if (!customGame) {
    // Dusk only shows your game after an onChange() so no need for loading screen
    return
  }

  return (
    <>
      {
        canStartGame ?
          <Fragment>
            <div className={`fade-box ${gameEnded ? "show" : ""}`} />
            <div id="game-cont">
              {/* <div className="template-game"></div> */}
              <div className="header">
                <div className="header-gem-name">
                  <div className="gem-container">
                    <div className={`player-gem ${yourPlayerTeam !== PlayerTeam.None ? `team-${yourPlayerTeam}` : ""}`}></div>
                    <div className="player-gem-silhouette"></div>
                  </div>
                  {
                    gameStarted ?
                      <div id="player-name-id">{yourPlayerId ? Dusk.getPlayerInfo(yourPlayerId).displayName : ""}</div>
                      : <></>
                  }
                </div>

                <div className="header-bat-progress">
                  <div className="progress-icon"></div>
                  <div className="progress-bar">
                    <div className="fill-bar-container">
                      <div id="fill-bar-id" ref={refProgressBar}></div>
                    </div>
                    <div className="background-fill-bar"></div>
                    <div id="counter-text-id">{progressBar}/{WinScore}</div>
                  </div>
                </div>

                <div className="header-blood-count">
                  <div id="blood-count-id">{userBlood}</div>
                  <div className="blood-icon"></div>
                </div>
              </div>
              <div className="ranking-list" ref={refRankingPlayersBox}></div>
              {/* <button className="map-button">
                <div className="icon"></div>
              </button> */}
            </div>
            <GameHUD game={customGame} blockClientInputs={blockClientInputs} />
            <GameBase
              currentPlayerInterpolator={currentPlayerInterpolator}
              game={customGame}
              yourPlayerId={yourPlayerId!}
              ingamePlayersList={ingamePlayersList}
              setIngamePlayersList={setIngamePlayersList}
              ingameVillagersList={ingameVillagersList}
              setIngameVillagersList={setIngameVillagersList}
              ingamePurchaseSensors={ingamePurchaseSensors}
              setIngamePurchaseSensors={setIngamePurchaseSensors}
              ingameDecorations={ingameDecorations}
              setIngameDecorations={setIngameDecorations}
              setRandomIdToForceRefresh={setRandomIdToForceRefresh}
              yourPlayerTeam={yourPlayerTeam}
              setYourPlayerTeam={setYourPlayerTeam}
              blockClientInputs={blockClientInputs}
              setBlockClientInputs={setBlockClientInputs}
              soundManager={soundManager}
              setSoundManager={setSoundManager}
              gameEnded={gameEnded}
              tutorialArrow={tutorialArrow}
              setTutorialArrow={setTutorialArrow}
              tutorialRunning={tutorialRunning}
              setTutorialRunning={setTutorialRunning}
              avoidAudio={avoidAudio}
              setAvoidAudio={setAvoidAudio}
            />
          </Fragment >
          :
          <></>
      }
    </>
  )
}

export default App
