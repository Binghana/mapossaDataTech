import { dataBase } from "../class/@interface";
import MapossaError from "../class/mapossaError"

export default class ClientError {

    static readonly collectionName = "clientErrors"

    static async saveClientError(ClientError: any) {

        if (!("user" in ClientError)) throw new MapossaError(MapossaError.ERROR_NO_USER);
        if (!("uid" in ClientError.user)) throw new MapossaError(MapossaError.ERROR_NO_USER_IDENTIFIER);

        await dataBase.collection(this.collectionName).doc(ClientError.user.uid).collection("ErreurRencontre").add(ClientError);

    }
}

export type IClientError = {
    
    user : {
        uid : string,

    },
    error : {
        message : string,
        sender : string,
        context : string,
        cause : string | string[],
        page : string
    },
    app : {
        name : string,
        version : string,

    }
    

}