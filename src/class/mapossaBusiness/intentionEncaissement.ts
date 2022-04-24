
import { dataBase, ISystemData, userRef } from "../@interface";
import { etat } from "../@type";

export default class IntentionEncaissement implements ISystemData {

    constructor(idAcheteur: string, idVendeur: string) {
        this.idAchteteur = idAcheteur;
        this.idVendeur = idVendeur;
    };
    /**
     * Indique le nom de la collection dans la quelle sont stockés les
     * Intentions d'encaissements
     */
    static readonly collectionName = "intentionsEncaissement";
    /**
     * Indique l'identifiant de l'inention d'encaissement
     */
    id: string | undefined;
    /**
     * Rerpésente la date de création de l'intention
     */
    createDate: Date = new Date();
    /**
     * Représente la dernière date de mise à jour de 
     * L'intention d'encaissement
     */
    updateDate: Date = new Date();
    /**
     * Indique l'identifiant de celui qui a fait l'achat
     */
    idAchteteur: string;
    /**
     * Indique l'identifiant de celui qui a fait la vente
     * Et donc qui fait l'encaissement
     */
    idVendeur: string;
    /**
     * Indique le montant à faire transaiter
     */
    montant: number = 0;
    /**
     * Indique le coupon lié à cete intention
     */
    coupon: any;
    /**
     * Indique l'état de l'intention d'encaissement
     */
    etat: etat = "En attente de validation";
    /**
     * Indique le context du paiement
     */
    context? : any
    /**
     * S'occupe de créer l'intenttion d'encaissement
     * @returns 
     */
    static async create(ie: IntentionEncaissement , transaction? : FirebaseFirestore.Transaction) {
        if (transaction) return transaction.create(IntentionEncaissement.collection(ie.idVendeur).doc() , ie);
        return await IntentionEncaissement.collection(ie.idVendeur).add(ie);
    }
    /**
     * S'occupe de sauvegarder les modifications apporté à l'intention
     * D'encaissemment
     */
    static async save(ie: IntentionEncaissement) {
        return await IntentionEncaissement.collection(ie.idVendeur).doc(ie.id as string).update(ie);
    }
    /**
     * Permet à un acheteru de validé l'intention dencaissement
     * @returns 
     */
    static async validate(ie: IntentionEncaissement) {
        ie.etat = "Validé";
        return await this.save(ie);
    }
    /**
     * Peremt d'envoyer l'intention d'encaissement à l'acheteur
     * @returns 
     */
    static async  send(ie: IntentionEncaissement,transaction? : FirebaseFirestore.Transaction) {
        if(! ie.id ) throw new Error("Impossible denvoyer L'intention d'ecaissement car il n'a pas d'identifiant");
        ie.etat = "Lancé";
        if (transaction) return transaction.create(IntentionEncaissement.collection(ie.idAchteteur).doc(ie.id as string), ie);
        return await IntentionEncaissement.collection(ie.idAchteteur).doc(ie.id as string).create(ie);
    }
    /**
     * Permet d'annuler l'intention d'encaissement
     */
    static async cancel(ie : IntentionEncaissement) {
        ie.etat = "Annulé";
        this.save(ie);
    }

    static async getMyPendingIE(idAcheteur: string) {
        const pendingIE : IntentionEncaissement[] = [];

        (await dataBase.collectionGroup(this.collectionName).withConverter(this.converter).where("idAcheteur" , "==" , idAcheteur).get()).docs.forEach((d) => { pendingIE.push(d.data()) });
        return pendingIE;
    }
    // /**
    //  * Suppimer cette intention d'encaissement de la collection;
    //  * @returns 
    //  */
    // async delete() {
    //     return await IntentionEncaissement.collection(this.idVendeur).doc(this.id as string).delete();
    // }
    // /**
    //  * Renvoi une inention d'encaissement d'identifiant donné
    //  * @param idIE Indique l'identifiant de L'Ie que l'on souhaite récupérer
    //  * @returns 
    //  */
    // static async getById(idIE: string) {
    //     return  dataBase.collectionGroup(this.collectionName).
    // }
    /**
    * Transafrome un item de la base de données en itention d'encaissement
    * @param item L'object que l'on souhaite transaformé en intention
    * d'encaissement
    * @returns
    */
    static normalize(item: any): IntentionEncaissement {
    
        if (!IntentionEncaissement.isIE(item)) throw new Error("L'item passé en paramètre n'est pas une itention d'encaissement il manque les attributs 'idVendeur' et 'idAcheteur' ");
        const ie = new IntentionEncaissement(item.idAchteteur, item.idVendeur);
        if ("id" in item) ie.id = item.id;
        if ("montant" in item) ie.montant = item.montant;
        if ("coupon" in item) ie.coupon = item.coupon;
        if ("etat" in item) ie.etat = item.etat;
        if ("context" in item) ie.context = item.context;
        
        return ie;
    }
    /**
     * Dit si un item est une intenttion d'encaissement
     * @param item Object que l'on souhaite savoir si c'est une iention d'encaissement ou pas
     * @returns item est une intention d'encaissement
     */
    static isIE(item: any): item is IntentionEncaissement {
        return ("idAcheteur" in item && "idVendeur" in item);
    }

    /**
     * Représente le convertisseur de données entre firestore et l'api
     */
    static converter: FirebaseFirestore.FirestoreDataConverter<IntentionEncaissement> = {
        toFirestore: function (modelObject: IntentionEncaissement): FirebaseFirestore.DocumentData {
            delete modelObject.id;
            return modelObject;
        },
        fromFirestore: function (snapshot: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>): IntentionEncaissement {
            const data = snapshot.data();
            const id = snapshot.id;
            return IntentionEncaissement.normalize({ id: id,...data});
        }
    }
    /**
     * Donne la référence de la collection cd'intention d'encaissement dans
     * la collection de firestore
     * @param idVendeur indique l'identifiant du vendeur
     * @returns 
     */
    static collection(idVendeur: string) {
        return userRef(idVendeur).collection(this.collectionName).withConverter(this.converter);
    }
    /**
     * Attend la validation d'un clientpor une Inetion d'encaissement
     * @param idClient Indique l'identifiant du client  qui doit valider l'intenction d'encaissement
     * @param IE L'intentiton d'encaissement à validé
     */
    static waitingValidation ( idClient : string , IE : IntentionEncaissement ) {
        return this.collection(idClient).doc(IE.id as string).onSnapshot
    }
    
}