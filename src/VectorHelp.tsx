//CUIDAD COM ESSES MÉTODOS

//SE POR ALGUM ACASO O DUSK RECLAMAR DE "Variables from parent scope may not be mutated",
//CRIE UMA CONST COM O MÉTODO, E USE A CONST NO LUGAR

//Tipo:

//const add = VectorHelp.vectorSum
//add(v1, v2);


const lerp = (a: number, b: number, alpha: number ) => {
    return a + alpha * ( b - a );
}


export const VectorHelp = {

    vectorSum: (v1: number[], v2: number[]) => {

        const v3: number[] = [];

        for(let i = 0; i < v1.length; i ++){
            v3[i] = v1[i] + v2[i];
        }

        return v3;
    },

    subtract: (v1: number[], v2: number[]) =>{

        const v3: number[] = [];

        for(let i = 0; i < v1.length; i ++){
            v3[i] = v1[i] - v2[i];
        }

        return v3;
    },

    magnitude: (vec: number[]) => {
        let len = 0;
        for(let i = 0; i < vec.length; i ++){
            len += vec[i]*vec[i];
        }
        len = Math.sqrt(len);
        return len;
    },

    normalize: (vec: number[]) => {

        return VectorHelp.scale(vec, 1/VectorHelp.magnitude(vec));

    },

    scale: (vec: number[], scale: number) => {
        const v3: number[] = [];

        for(let i = 0; i < vec.length; i ++){
            v3[i] = vec[i] * scale;
        }

        return v3;
    },

    distanceFrom: (v1: number[], v2: number[]) => {
        return VectorHelp.magnitude(VectorHelp.subtract(v1, v2));
    },

    copy: (from: number[], to: number[]) => {
        for(let i = 0; i < from.length; i ++){
            to[i] = from[i];
        }
    },

    lerp: (v1: number[], v2: number[], alpha: number) => {
        const output: number[] = [];

        for(let i = 0; i < v1.length; i ++){
            output[i] = lerp(v1[i], v2[i], alpha);
        }

        return output;
    }

}
