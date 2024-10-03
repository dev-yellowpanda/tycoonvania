import { VectorHelp } from "../VectorHelp";
import { BodyData } from "./Body"

export type WorldData = {
    bodies: { [id: string]: BodyData | undefined }
}

export class WorldMethods{
    //ADD AREA
    public static AddDynamicBody(position: number[], size: number[], world: WorldData){

        const body: BodyData = {
            position: position,
            velocity: [0, 0],
            sensor: false,
            static: false,
            size: size,
            id: WorldMethods.generateID(),
            active: true
        }

        world.bodies[body.id] = body;

        return body;
    }

    //ADD AREA
    public static AddStaticBody(position: number[], size: number[], world: WorldData){

        const body: BodyData = {
            position: position,
            velocity: [0, 0],
            sensor: false,
            static: true,
            size: size,
            id: WorldMethods.generateID(),
            active: true
        }

        world.bodies[body.id] = body;
        return body;
    }

    //ADD AREA
    public static AddSensorBody(position: number[], size: number[], world: WorldData){

        const body: BodyData = {
            position: position,
            velocity: [0, 0],
            sensor: true,
            static: true,
            size: size,
            id: WorldMethods.generateID(),
            active: true
        }

        world.bodies[body.id] = body;
        return body;
    }

    //REMOVE AREA ON SERVER ON ANY SITUATION
    public static RemoveBody(id: string, world: WorldData){
       Object.assign(world.bodies[id], undefined);

    }

    //AUTO GENERATE IDs FOR REFFERENCE
    static generateID(){
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

        let otp = "";
        for(let i = 0; i < 7; i ++){
            otp += chars[Math.floor(Math.random() * chars.length)];
        }

        return otp;
    }

    //IS CALLED ON EVERY UPDATE TO CHECK INTERSECTIONS AND COLISIONS
    public static WorldStep(world: WorldData){

        //Usando método Sweep and Prune

        const bodyList: string[] = [...Object.keys(world.bodies)].filter(k => world.bodies[k] && world.bodies[k].active);
        WorldMethods.stableSort(bodyList, (a, b) => (world.bodies[a].position[0] - world.bodies[a].size[0]/2) - (world.bodies[b].position[0] - world.bodies[b].size[0]/2));

        const skipped: {b1: string, b2: string}[] = [];

        for(let i = 0; i < bodyList.length; i ++){

            const b1: BodyData = world.bodies[bodyList[i]];

            if(b1.sensor) continue; //Ignora todas as colisões de sensores

            const add = VectorHelp.vectorSum;
            world.bodies[b1.id].position = add(world.bodies[b1.id].position, world.bodies[b1.id].velocity);

            for(let j = i + 1; j < bodyList.length; j ++){
                const b2: BodyData = world.bodies[bodyList[j]];

                if(b2.position[0] - b2.size[0]/2 > b1.position[0] + b1.size[0]/2) break; //Não precisa continuar checando, nao vair colidir com mais nenhum pra cá

                 if(b1.static){
                    if(!b2.static){
                        skipped.push({ //Por causa da ordenação, isso pode skipar verificações onde b1 é estático e b2 é dinamico, adiciona eles na ordem inversa pra serem verificados depois
                            b1: b2.id,
                            b2: b1.id
                        });
                    }
                    continue; //Ignora colisões ativas de objetos estáticos
                }

                if(WorldMethods.intersects(b1, b2)){
                    const result = WorldMethods.collision(world, b1.id, b2.id);
                    if(result){
                        world.bodies[b1.id].position = result[0];
                        world.bodies[b2.id].position = result[1];
                    }
                }
            }

        }

        for(let i = 0; i < skipped.length; i ++){
            if(WorldMethods.intersects(world.bodies[skipped[i].b1], world.bodies[skipped[i].b2])){
                const result = WorldMethods.collision(world, skipped[i].b1, skipped[i].b2);
                    if(result){
                        world.bodies[skipped[i].b1].position = result[0];
                        world.bodies[skipped[i].b2].position = result[1];
                    }
            }
        }

    }

    //INTERSECT CALC
    public static intersects(b1: BodyData, b2: BodyData){

        if(b1.position[1] + b1.size[1]/2 < b2.position[1] - b2.size[1]/2) return false;
        if(b1.position[1] - b1.size[1]/2 > b2.position[1] + b2.size[1]/2) return false;

        if(b1.position[0] + b1.size[0]/2 < b2.position[0] - b2.size[0]/2) return false;
        if(b1.position[0] - b1.size[0]/2 > b2.position[0] + b2.size[0]/2) return false;

        return true;
    }

    //THE COLISION CALC ITSELF
    public static collision(world: WorldData, body1: string, body2: string){
        //Garanto que b1 é dinamico

        const b1 = world.bodies[body1]
        const b2 = world.bodies[body2];

        if(b2.sensor) return; //Ignora colisões com sensores

        const yUp = Math.abs((b1.position[1] + b1.size[1]/2) - (b2.position[1] - b2.size[1]/2));
        const yDown = Math.abs((b1.position[1] - b1.size[1]/2) - (b2.position[1] + b2.size[1]/2));
        const xRight = Math.abs((b1.position[0] + b1.size[0]/2) - (b2.position[0] - b2.size[0]/2));
        const xLeft = Math.abs((b1.position[0] - b1.size[0]/2) - (b2.position[0] + b2.size[0]/2));

        //Checa qual a direção menor
        if(yUp < yDown && yUp < xRight && yUp < xLeft){
            //Snapa pra baixo
            if(b2.static){
                
                return [ //Não muta, só retorna a mudança
                    [
                        b1.position[0],
                        b2.position[1] - b2.size[1]/2 - b1.size[1]/2,
                    ],
                    b2.position
                ];
            }
            else{

                return [ //Não muta, só retorna a mudança
                    [
                        b1.position[0],
                        b2.position[1] - b2.size[1]/2 - b1.size[1]/2 - yUp/2,
                    ],
                    [
                        b2.position[0],
                        b2.position[1] + yUp/2
                    ]
                ];
            }
        }
        if(yDown < yUp && yDown < xRight && yDown < xLeft){
            //Snapa pra cima
            if(b2.static){

                return [ //Não muta, só retorna a mudança
                    [
                        b1.position[0],
                        b2.position[1] + b2.size[1]/2 + b1.size[1]/2,
                    ],
                    b2.position
                ];
            }
            else{

                return [ //Não muta, só retorna a mudança
                    [
                        b1.position[0],
                        b2.position[1] + b2.size[1]/2 + b1.size[1]/2 + yDown/2,
                    ],
                    [
                        b2.position[0],
                        b2.position[1] - yDown/2
                    ]
                ];
            }
        }
        if(xRight < xLeft && xRight < yUp && xRight < yDown){
            //Snapa pra esquerda
            if(b2.static){

                return [ //Não muta, só retorna a mudança
                    [
                        b2.position[0] - b2.size[0]/2 - b1.size[0]/2,
                        b1.position[1],
                    ],
                    b2.position
                ];

            }
            else{

                return [ //Não muta, só retorna a mudança
                    [
                        b2.position[0] - b2.size[0]/2 - b1.size[0]/2 - xRight/2,
                        b1.position[1]
                    ],
                    [
                        b2.position[0] + xRight/2,
                        b2.position[1]
                    ]
                ];
            }
        }
        if(xLeft < xRight && xLeft < yUp && xLeft < yDown){
            //Snapa pra direita
            if(b2.static){

                return [ //Não muta, só retorna a mudança
                    [
                        b2.position[0] + b2.size[0]/2 + b1.size[0]/2,
                        b1.position[1],
                    ],
                    b2.position
                ];
            }
            else{

                return [ //Não muta, só retorna a mudança
                    [
                        b2.position[0] + b2.size[0]/2 + b1.size[0]/2 + xLeft/2,
                        b1.position[1]
                    ],
                    [
                        b2.position[0] - xLeft/2,
                        b2.position[1]
                    ]
                ];
            }            
        }
    }

    public static stableSort(arr, cmp) {
        cmp = cmp ? cmp : (a, b) => {
          if (a < b) return -1;
          if (a > b) return 1;
          return 0;
        };
        const stabilizedThis = arr.map((el, index) => [el, index]);
        const stableCmp = (a, b) => {
          const order = cmp(a[0], b[0]);
          if (order != 0) return order;
          return a[1] - b[1];
        }
        stabilizedThis.sort(stableCmp);
        for (let i=0; i<arr.length; i++) {
            arr[i] = stabilizedThis[i][0];
        }
        return arr;
      }
}

