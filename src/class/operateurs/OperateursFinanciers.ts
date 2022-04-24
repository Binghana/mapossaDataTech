import { dataBase } from "../@interface";

export default class OperateursFinanciers {

    constructor ( nom : string) {
        this.nom = nom ;
    }
    static readonly collectionName = "operateursFinanciers";

    public nom : string ;

    static async getAll() {
        return dataBase.collection(this.collectionName).get();
    }

    static async getById( id : string) {

    }

    static async getByName ( name : string) {

    }
    public static getByType ( type : string) {
        return dataBase.collection(this.collectionName).where("type", "==", type).get();
    }
}