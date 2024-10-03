/* eslint-disable @typescript-eslint/no-unused-vars */
import type { PlayerId, DuskClient } from "dusk-games-sdk"
import tiledMap from "../public/assets/maps/NewMap.json";
//import tiledMap from "./maps/NewMap.json";
import { VillagerInfo, VillagerMethods } from "./game/objects/Villager";
import { PlayerInfo, PlayerMethods, PlayerTeam } from "./game/objects/Player";
import { PurchaseSensorInfo, PurchaseSensorMethods } from "./game/objects/PurchaseSensor";
import { WorldData, WorldMethods } from "./physics/World";
import { DecorationInfo, DecorationMethods } from "./game/objects/Decoration";
export interface GameState {
  playerIds: PlayerId[],
  playersList: PlayerInfo[],
  villagersList: VillagerInfo[],
  worldTiles: { [id: number]: string }
  purchaseSensors: { [id: number]: PurchaseSensorInfo },
  decorations: { [id: number]: DecorationInfo }
  world: WorldData,
  time: number
}

type GameActions = {
  firstSetup: () => void,
  updatePlayerIdsList: () => void,
  rankingUpdate: () => void,
  moveCharacter: (playerDirection: string) => void,
  updatePoints: () => void,
  endGame: () => void,
}

export const WinScore: number = 56;
export const TutorialPurchaseIndexLimit: number = 19;
export const PadsPurchaseMaxDistance: number = 400;
export const LevelUpValues: number[] = [0, 10, 22, 34, 48, 62];
export const PlayerMaxSpeed: number = 70;
export const VillagerCount: number = 3;
export const VillagerBloodStorage: number = 50;
export const VillagerDrainTime: number = 10;
export const VillagerCooldown: number = 30;
export const PurchaseSpeed: number = 5;
export const MapScale: number = 16;
export const TileSize: number = 16 * MapScale;

declare global {
  const Dusk: DuskClient<GameState, GameActions>
}

Dusk.initLogic({
  minPlayers: 2,
  maxPlayers: 4,
  reactive: false,
  setup: (allPlayerIds) => {

    console.log("FIRST SETUP, all players ID: " + JSON.stringify(allPlayerIds))

    const game = {
      playerIds: allPlayerIds,
      playersList: [],
      villagersList: [],
      worldTiles: {},
      purchaseSensors: {},
      decorations: {},
      world: { bodies: {} },
      time: 0
    }

    //Colisão do mapa
    tiledMap.layers.find(l => l.name == "Colliders").objects.forEach(obj => {

      const position = [
        (obj.x + obj.width / 2) * MapScale,
        (obj.y + obj.height / 2) * MapScale
      ];
      const size = [
        obj.width * MapScale,
        obj.height * MapScale
      ];


      if (game.worldTiles[obj.id] == undefined) {
        const col = WorldMethods.AddStaticBody(position, size, game.world);
        col.active = obj.visible;
        game.worldTiles[obj.id] = col.id;
      }

    });

    //Criando objetos de decoração
    tiledMap.layers.find(l => l.name == "Decoration").objects.forEach((deco: {
      gid: number,
      height: number,
      id: number,
      name: string,
      rotation: number,
      type: string,
      visible: boolean,
      width: number,
      properties: { name: string, type: string, value }[],
      x: number,
      y: number
    }) => {


      let gid: number = deco.gid; //isso é um numero com 32 bits, tenho q ignorar os 4 primeiros bits (ou o primeiro byte de uma lista de 8 bytes)

      function intFromBytes(x) {
        let val = 0;
        for (let i = 0; i < x.length; ++i) {
          val += x[i];
          if (i < x.length - 1) {
            val = val << 8;
          }
        }
        return val;
      }

      function getInt64Bytes(x) {
        const bytes = [];
        let i = 8;
        do {
          bytes[--i] = x & (255);
          x = x >> 8;
        } while (i)
        return bytes;
      }

      const gidBytes = getInt64Bytes(gid);
      for (let i = 0; i < 5; i++) {
        gidBytes[i] = 0x0;
      }

      gid = intFromBytes(gidBytes);

      const tileset = tiledMap.tilesets.find(t => t.name == "Decoration");
      const tile = tileset.tiles.find(t => t.id + tileset.firstgid == gid);

      if (!tile) {
        console.log("Não consegui encontrar o tile com gid " + gid + " no decoration de id " + deco.id);
        return;
      }

      const imageName = tile.image.replaceAll("../decoration/", "").replaceAll(".png", "");

      const bodyId: string[] = [];

      if (tile.objectgroup) {

        tile.objectgroup.objects.forEach(obj => {

          const body = WorldMethods.AddStaticBody(
            [
              (deco.x + obj.x + obj.width / 2) * MapScale,
              (deco.y - deco.height + obj.y + obj.height / 2) * MapScale
            ],
            [
              obj.width * MapScale,
              obj.height * MapScale
            ],
            game.world
          )

          bodyId.push(body.id)

        });
      }

      let height = 0;

      if (deco.properties) {
        const heightProp = deco.properties.find(prop => prop.name == "height");
        if (heightProp) {
          height = heightProp.value;
        }
      }

      let bloodPerMinute = 0;
      if (deco.properties) {
        const bloodPerMinuteProp = deco.properties.find(prop => prop.name == "bloodsPerMinute");
        if (bloodPerMinuteProp) {
          bloodPerMinute = bloodPerMinuteProp.value;
        }
      }

      let enabled = true;
      if (deco.properties) {
        const enabledProp = deco.properties.find(prop => prop.name == "enabled");
        if (enabledProp) {
          enabled = enabledProp.value;
        }
      }

      game.decorations[deco.id] = {
        id: deco.id,
        position: [(deco.x + deco.width / 2) * MapScale, deco.y * MapScale],
        sprite: imageName,
        visible: enabled,
        bodyId: bodyId[0],
        height: height,
        bloodPerMinute: bloodPerMinute,
      };

    });

    //Criando sensores de compra
    tiledMap.layers.find(l => l.name == "Purchase").objects.forEach((prch: {
      height: number,
      id: number,
      name: string,
      point: boolean,
      properties: { name: string, type: string, value }[],
      rotation: number,
      type: string,
      visible: boolean,
      width: number,
      x: number,
      y: number
    }) => {

      const enables: number[] = [];

      const count = prch.properties.find(p => p.name == "enable.count");

      if (count) {
        for (let i = 0; i < count.value; i++) {
          enables[i] = prch.properties.find(p => p.name == "enable[" + i + "]").value;
        }
      }

      let minLevel = 0;

      if (prch.properties) {
        const minLevelProp = prch.properties.find(prop => prop.name == "minLevel");
        if (minLevelProp) {
          minLevel = minLevelProp.value;
        }
      }

      let enabled = true;
      if (prch.properties) {
        const enabledProp = prch.properties.find(prop => prop.name == "enabled");
        if (enabledProp) {
          enabled = enabledProp.value;
        }
      }

      const info: PurchaseSensorInfo = {
        id: prch.id,
        position: [
          prch.x * MapScale,
          prch.y * MapScale
        ],
        cost: prch.properties.find(prop => prop.name == "cost").value,
        paid: 0,
        playerTeam: PlayerTeam[prch.type as string],
        score: prch.properties.find(prop => prop.name == "score").value,
        visible: enabled,
        enables: enables,
        minLevel: minLevel,
        playerOver: false,
        purchaseSpeed: 1
      }

      game.purchaseSensors[prch.id] = info;

    });

    //Criando os Villagers
    tiledMap.layers.find(l => l.name == "Villagers").objects.forEach((path: {
      height: number,
      id: number,
      name: string,
      polygon: { x: number, y: number }[],
      rotation: number,
      type: string,
      visible: boolean,
      width: number,
      x: number,
      y: number
    }, i) => {

      const position: number[] = [
        path.x * MapScale,
        path.y * MapScale
      ];

      const p: number[] = path.polygon.map(p => [
        p.x * MapScale,
        p.y * MapScale
      ]).flat();


      const data: VillagerInfo = {
        villagerID: "vil" + i,
        bloodCount: VillagerBloodStorage,
        cooldown: 0,
        position: position,
        origin: position,
        playersInRange: [],
        path: p,
        currentPathIndex: 0,
        moving: false,
        direction: 1,
        speed: 1
      }
      if (game.villagersList.find(v => v.villagerID == data.villagerID) === undefined) {
        game.villagersList.push(data);
      }

      //TODO: criar o Body

    });

    //Cria os players
    game.playerIds.forEach((curPlayerId) => {
      console.log("Setup, checando player " + curPlayerId);
      if (game.playersList.find(el => el.playerId === curPlayerId) === undefined) {
        console.log("Player não existe, criando ele");
        CreatePlayer(game, curPlayerId);
      }
    })

    return game
  },
  actions: {
    firstSetup: (_, { game, playerId }) => {
      console.log(game)
      console.log(playerId)
    },
    updatePlayerIdsList: (_, { game }) => {
      game.playersList.forEach((el) => {
        if (!game.playerIds.includes(el.playerId)) {
          game.playerIds.push(el.playerId)
        }
      })
    },
    rankingUpdate: (_) => {
      console.log("Update Ranking List")
    },
    moveCharacter: (playerDirection, { game, playerId }) => {

      const currentUserInfos = game.playersList.find((playerEl) => playerEl.playerId === playerId)

      if (!currentUserInfos) {
        console.log("Não achei o player ID " + playerId + " na lista de players: " + JSON.stringify(game.playersList.map(p => p.playerId)));
        return;
      }

      currentUserInfos!.playerMoving = true;

      let currentAxis: number[] = [0, 0];

      switch (playerDirection) {

        case "right":
          currentAxis = [1 * PlayerMaxSpeed, 0]
          currentUserInfos.xDirection = 1;
          break

        case "upright":
          currentAxis = [.7 * PlayerMaxSpeed, -.7 * PlayerMaxSpeed]
          currentUserInfos.xDirection = 1;
          break

        case "up":
          currentAxis = [0, -1 * PlayerMaxSpeed]
          break

        case "upleft":
          currentAxis = [-.7 * PlayerMaxSpeed, -.7 * PlayerMaxSpeed]
          currentUserInfos.xDirection = -1;
          break

        case "left":
          currentAxis = [-1 * PlayerMaxSpeed, 0];
          currentUserInfos.xDirection = -1;
          break

        case "downleft":
          currentAxis = [-.7 * PlayerMaxSpeed, .7 * PlayerMaxSpeed]
          currentUserInfos.xDirection = -1;
          break

        case "down":
          currentAxis = [0, 1 * PlayerMaxSpeed]
          break

        case "downright":
          currentAxis = [.7 * PlayerMaxSpeed, .7 * PlayerMaxSpeed]
          currentUserInfos.xDirection = 1;
          break

        default:
          currentAxis = [0, 0]
          currentUserInfos!.playerMoving = false;
          break;
      }

      currentUserInfos.axisSpeed = currentAxis;
    },
    updatePoints: (_) => {
      console.log("Updated points")
    },
    endGame: (_, { game }) => {
      CallEndGame(game)
    },
  },
  events: {
    playerJoined: (playerId, { game }) => {

      if (game.playersList.find(el => el.playerId === playerId) === undefined) {
        console.log("Player entered: " + playerId)

        CreatePlayer(game, playerId);
      }

    },
    playerLeft(playerId, { game }) {
      console.log("Player left")

      const specificElement = game.playersList.find((el) => el.playerId === playerId)
      const indexElement = game.playersList.indexOf(specificElement!)

      PlayerMethods.destroyServer(specificElement, game);

      game.playersList.splice(indexElement, 1)

      const idList: PlayerId[] = []

      game.playersList.forEach(el => {
        idList.push(el.playerId)
      })

      game.playerIds = idList
    },
  },
  update({ game }) {

    WorldMethods.WorldStep(game.world);

    for (let i = 0; i < game.playersList.length; i++) {
      PlayerMethods.serverUpdate(game, game.playersList[i]);
    }
    game.villagersList.forEach(villager => VillagerMethods.serverUpdate(game, villager));

    for (const key in game.purchaseSensors) {
      PurchaseSensorMethods.serverUpdate(game.purchaseSensors[key], game);
    }

    for (const key in game.decorations) {
      DecorationMethods.serverUpdate(game, game.decorations[key]);
    }

    game.time = Dusk.gameTime();

  },
  updatesPerSecond: 30,
},
)

export const CallEndGame = (game: GameState) => {

  const arraySorted = game.playersList.slice().sort((a, b) => b.rankingScore - a.rankingScore)

  if (arraySorted.length == 2) {
    Dusk.gameOver({
      players: {
        [arraySorted[0].playerId]: arraySorted[0].rankingScore,
        [arraySorted[1].playerId]: arraySorted[1].rankingScore,
      }
    })
  }
  else if (arraySorted.length == 3) {
    Dusk.gameOver({
      players: {
        [arraySorted[0].playerId]: arraySorted[0].rankingScore,
        [arraySorted[1].playerId]: arraySorted[1].rankingScore,
        [arraySorted[2].playerId]: arraySorted[2].rankingScore,
      }
    })
  }
  else if (arraySorted.length == 4) {
    Dusk.gameOver({
      players: {
        [arraySorted[0].playerId]: arraySorted[0].rankingScore,
        [arraySorted[1].playerId]: arraySorted[1].rankingScore,
        [arraySorted[2].playerId]: arraySorted[2].rankingScore,
        [arraySorted[3].playerId]: arraySorted[3].rankingScore,
      }
    })
  }
}

const SetPlayerTeam = (playersList: PlayerInfo[]) => {

  let teamColor: PlayerTeam = PlayerTeam.None;

  if (!playersList.find((el) => el.playerTeam === PlayerTeam.Red)) {
    teamColor = PlayerTeam.Red
  }
  else if (!playersList.find((el) => el.playerTeam === PlayerTeam.Blue)) {
    teamColor = PlayerTeam.Blue
  }
  else if (!playersList.find((el) => el.playerTeam === PlayerTeam.Green)) {
    teamColor = PlayerTeam.Green
  }
  else if (!playersList.find((el) => el.playerTeam === PlayerTeam.Yellow)) {
    teamColor = PlayerTeam.Yellow
  }

  return teamColor
}

const CreatePlayer = (game, playerId) => {
  const curPlayerTeam: PlayerTeam = SetPlayerTeam(game.playersList)

  const spawn = tiledMap.layers.find(l => l.name == "Players").objects.find(obj => obj.name == PlayerTeam[curPlayerTeam]);

  const position = [
    spawn.x * MapScale - TileSize / 2,
    spawn.y * MapScale - TileSize / 2
  ];

  const body = WorldMethods.AddDynamicBody(position, [500, 100], game.world);

  const newPlayer: PlayerInfo = {
    playerId: playerId,
    playerTeam: curPlayerTeam,
    bloodCount: 0,
    rankingScore: 0,
    playerMoving: false,
    xDirection: 1,
    axisSpeed: [0, 0],
    playerPos: position,
    bodyId: body.id,
    purchased: []
  }

  game.playersList.push(newPlayer)
}