/**
 * Représentation des donnés numériques qui 
 * interagissent avec une collection
 */
import * as admin from "firebase-admin";

import MapossaError from "./mapossaError";
import Response from "./response";
import User from "./user";

const scrapingCredentials = {


    databaseURL: 'mapossadatatech.firebaseapp.com',
    storageBucket: 'mapossadatatech.appspot.com',
    //messagingSenderId: '462737693135',
    projectId: 'mapossadatatech',

};

admin.initializeApp();

const scrapingApp = admin.initializeApp(scrapingCredentials, "Mapossa Scraping")
/**
 * Représente notre base de données FireStore
 */

export const dataBase = admin.firestore();
dataBase.settings({ignoreUndefinedProperties : true});


export const auth = admin.auth();
export const scrapingMessaging = admin.messaging(scrapingApp)
/**
   * Cette fonction indique le chemin vers la patie concernant l'utilisateur
   * @param idUser Indique l'identifiant de l'utilisateur acturele
   */
export function userRef(idUser: string) {
    return dataBase.collection(User.collectionName).doc(idUser);
}
/**
 * Une représentation des des données du sytème
 */
export interface ISystemData {
    // /**
    //  * Indique le nom de la collection où est stockée la donnée
    //  */
    // readonly collectionName : string;
    /**
     * Indique l'identifiant de la donée
     */
    id?: string ;
    /**
     * Indique la date de création de la donnée
     */
    createDate: Date;
    /**
     * Indique la dernière date de mise à jour de la donnée
     */
    updateDate: Date;
    /**
     * Iterators
     */
    //[Symbol.iterator] (): any ;
    // /**
    //  * Cette fonction s'occupe de la récupération
    //  * de la donnée grâce à son identifiant
    //  */
    // getById(): IData;
    // /**
    //  * Cette fonction permet de récuperer des données
    //  * numérique grace aux identifiants de ces données
    //  */
    // getByIds(): IData[];
    // /**
    //  * Cette fonction permet de récuperer toutes les données
    //  * d'une collection
    //  */
    // getAll(): IData[];
    // /**
    //  * Cette fontion permet de créer une nouvelle donnée dans
    //  * sa collection
    //  */
    // create():IData;
    // /**
    //  * Cette fontion permet de créer un ensemble 
    //  *  donnée dans sa collection
    //  */
    // bulkCreate():IData[];
    // /**
    //  * Cette fontion permet de modifier une donnée dans
    //  * sa collection
    //  */
    // update(): IData;
    // /**
    //  * Cette fontion permet de modifier un ensemble donnée dans
    //  * sa collection
    //  */
    // bulkUpdate(): IData[];
    // /**
    //  * Cette fontion permet de suprimer une donnée de
    //  * sa collection
    //  */
    // delete(): IData;
    // /**
    //  * Cette fontion permet de suprimer un ensemble de donnée
    //  * de sa collection
    //  */
    // bulkDelete(): IData[];
    // /**
    //  * Cette fontion permet de suprimer toutes les données
    //  * d'une collection
    //  */
    // deleteAll(): IData[];
}


export function handleError(error : any, response : any) {
    console.log(error);
    
    if (error instanceof MapossaError) {
        response.status(401).send(new Response(error.message, true, error.data));
    } else {
        response.status(500).send(new Response("Une érreur s'est produite", true, JSON.stringify(error)));
    }
}