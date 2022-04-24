import { dataBase } from "../@interface";

export default class SMS {
    public static readonly collectionName = "sms";

    private constructor() { }

    static async bulkInsert(tableauSMS: []) {
        const bulk = this.bulk();
        tableauSMS.forEach((sms) => { bulk.create(this.collection().doc(), sms) });
        return await bulk.commit();
    }

    static async getAll() {
        const tableauSMS :SMS[] = [];
        (await this.collection().get()).docs.forEach((sms) => { tableauSMS.push(sms.data()) });
        return tableauSMS;
    }
    // static async getAll() {
    //     const tableauSMS: SMS[] = [];
    //     (await this.collection().get()).docs.forEach((sms) => { tableauSMS.push(sms.data()) });
    //     return tableauSMS;
    // }
    static async withoutModelBulkInsert(tableauSMS: []) {
        const bulk = this.bulk();
        tableauSMS.forEach((sms) => { bulk.create(this.collectionWithoutModel().doc(), sms) });
        return await bulk.commit();
    }

    static async withModelBulkInsert(tableauSMS: []) {
        const bulk = this.bulk();
        tableauSMS.forEach((sms) => { bulk.create(this.collectionWithModel().doc(), sms) });
        return await bulk.commit();
    }

    /**
     * Représente le convertisseur de données entre firestore et l'api
     */
    static converter: FirebaseFirestore.FirestoreDataConverter<SMS> = {
        toFirestore: function (modelObject: SMS): FirebaseFirestore.DocumentData {
            return {...modelObject}
        },
        fromFirestore: function (snapshot: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>): SMS {
            const data = snapshot.data();
            const id = snapshot.id
            return {id : id ,...data}
        }
    }
    /**
     * Donne la référence de la collection sur firestore
     * @param idVendeur Indique l'identifiant du vendeur du produit
     * @returns référence de la collection
     */
    private static collectionWithoutModel() {
        return dataBase.collection(this.collectionName + "SansModel").withConverter(this.converter);
    }
    /**
     * Donne la référence de la collection sur firestore
     * @param idVendeur Indique l'identifiant du vendeur du produit
     * @returns référence de la collection
     */
    private static collectionWithModel() {
        return dataBase.collection(this.collectionName + "AvecModel").withConverter(this.converter);
    }
    /**
     * Donne la référence de la collection sur firestore
     * @param idVendeur Indique l'identifiant du vendeur du produit
     * @returns référence de la collection
     */
    private static collection() {
        return dataBase.collection(this.collectionName).withConverter(this.converter);
    }
    /**
     * 
     * @param idVendeur Indique l'identifiant du vendeur du produit
     * @returns 
     */
    private static bulk() {
        return this.collection().firestore.batch();
    }
}