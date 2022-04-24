import { logger } from "firebase-functions/v1";
import { ISystemData, userRef } from "../@interface";
import { typeFinal, typeInitial, numeroDeTelephone, devise, flux, decision , query, typeOperateur } from "../@type";
import MapossaDataTech from "../mapossaDataTech";
import MapossaError from "../mapossaError";



/**
 * Représentation d'une transaction selon Mapossa
 */
export default class Transaction implements ISystemData {
    /**
     * "montant" in prototype && "typeFinal" in prototype && "idCompte" in prototype  && "flux" in prototype
     */
    constructor() { };

    /**
    * Représente le nom de la collection dans laquelle
    * est sont stocké les transactions
    */
    public static readonly collectionName = "transactions";
    /**
     * Indique l'identifiant de la transaction dans
     * la collection
     */
    public id: string | undefined;
    /**
     * Représente la date de création de la transaction
     */
    public createDate: Date = new Date();
    /**
     * Représente la dernière date de mise à jour 
     * de la transaction
     */
    public updateDate: Date = new Date();
    /**
     * Indique le type initial de la transaction
     */
    public typeInitial: typeInitial | undefined;
    /**
     * Indique le type Final de la transaction
     */
    public typeFinal: typeFinal | undefined;
    /**
     * Indique le montant de la transaction
     */
    public montant: number = 0;
    /**
     * Indique le numéro de celui qui a reçu ou envoyé l'argent 
     * à l'utilisateur Mapossa
     */
    public numeroAssocie: numeroDeTelephone | undefined;
    /**
     * Représente l'identifiant de l'utilisateur l'utilisateur Mapossa
     * qui a participé à la transaction
     */
    public idUtilisateurAssocie: string | undefined;
    /**
     * Représente les notes ou informations supplémentaires
     * de la transaction
     */
    public note: string | undefined;
    /**
     * Représente le lieu où a été fait la transaction
     */
    public lieu: string | undefined;
    /**
     * Représente la devise de la t
     */
    public devise: devise = "F CFA";
    /**
     * Représente l'identifiant de la catégorie à laquelle est 
     * associé la Transaction
     */
    public idCategorie: string | undefined;
    /**
     * Indique le flux de la transaction
     */
    public flux: flux | undefined;
    /**
     * Indique l'identifiant du compte au quel est associé
     * la Transaction
     */
    public idCompte: string | undefined;
    /**
     * Représente la date à la quelle la transaction à été effectué
     */
    public dateTransaction: Date | undefined;
    /**
     * Indique la décision de l'utilisateur par rapport à sa transaction
     */
    public decision: decision = "";

    public frais : number = 0;

    public parent : string = "";

    public type? : typeOperateur ;

    // la méthode de normalisation
    /**
     * Cette fonction s'occupe de Changer un item de la collection
     * on un objet de type Transaction
     * @param transactionItem object qui représente une transaction provenant
     * directement de la collection
     * @returns un object Transaction représentant la transaction
     * venant de la collection
     */
    static normalize(transactionItem: any): Transaction {
        const transaction = new Transaction();



        if ("id" in transactionItem) transaction.id = transactionItem.id;
        if ("createDate" in transactionItem) transaction.createDate = transactionItem.createDate;
        if ("updateDate" in transactionItem) transaction.updateDate = transactionItem.updateDate;

        if ("typeInitial" in transactionItem) transaction.typeInitial = transactionItem.typeInitial;
        if ("typeFinal" in transactionItem) transaction.typeFinal = transactionItem.typeFinal;

        if ("montant" in transactionItem) transaction.montant = transactionItem.montant;
        if ("numeroAssocie" in transactionItem) transaction.numeroAssocie = transactionItem.numeroAssocie;
        if ("idUtilisateurAssocie" in transactionItem) transaction.idUtilisateurAssocie = transactionItem.idUtilisateurAssocie;
        if ("frais" in transactionItem) transaction.frais = transactionItem.frais;

        if ("note" in transactionItem) transaction.note = transactionItem.note;
        if ("devise" in transactionItem) transaction.devise = transactionItem.devise;
        if ("lieu" in transactionItem) transaction.lieu = transactionItem.lieu;
        if ("idCategorie" in transactionItem) transaction.idCategorie = transactionItem.idCategorie;
        if ("idCompte" in transactionItem) transaction.idCompte = transactionItem.idCompte;
        if ("flux" in transactionItem) transaction.flux = transactionItem.flux;
        if ("decision" in transactionItem) transaction.decision = transactionItem.decision;
        if ("dateTransaction" in transactionItem) transaction.dateTransaction = transactionItem.dateTransaction;

        if ("parent" in transactionItem) transaction.parent = transactionItem.parent;
        if ("type" in transactionItem) transaction.type = transactionItem.type;
        
        return transaction;
    }
    /**
     * Cette fonction permet de convertir un grand nombre d'objet de la 
     * collection en Transaction
     * @param transactionItems un tableau d'object représentant les
     * transactions venant directement de la collection
     * @returns un tableau dont les objet sont converti en type Transaction
     */
    static bulkNormalise(transactionItems: object[]): Transaction[] {
        const transactions: Transaction[] = [];
        transactionItems.forEach((transaction) => {
            transactions.push(Transaction.normalize(transaction));
        })
        return transactions;
    }
    // lecture de transaction
    /**
     * Cette fonction s'occupe de récuperer une transaction dans la collection
     * à partir de son identifiant passsé en parametre
     * @param idUser Indique l'identifiant de l'utilisateur dont on
     * souhaite récupérer la transaction
     * @param idTransaction représente l'identifiant de la transaction que l'on
     * souhaite récupérer
     * @returns un object représentant la transaction demandée
     */
    static async getById(idUser: string, idTransaction: string) {
        try {
            return (await this.collection(idUser).doc(idTransaction).get());
        } catch (error) {
            throw (error);
        }
    }
    /**
     * Cette fonction permet de récuperer toutes les transactions 
     * d'un utilisateur
     * @param idUser Représente l'identifiant de l'utilisateur dont
     * on souhaite récupérer toutes les transactions
     * @returns un tableau d'objects représentant toutes les transactions 
     * de l'utilisateur
     */
    static async getAllOfUser(idUser: string) {
        const transactions: Transaction[] = [];
        (await this.collection(idUser).get()).docs.forEach((d) => { transactions.push(d.data()) });
        return transactions
    }
    // /**
    //  * Cette fonction s'occupe de récuperer toutes les transactions 
    //  * 'un compte financier d'un utilisateur
    //  * @param idUser Représente l'identifiant de l'utilisateur dont on
    //  * souhaite recuperer les transactions
    //  * @param idCompte Rerpésente l'identifiant du compte financier de 
    //  * l'utilisateur
    //  * @returns un tableau d'object qui représente toutes les transactions 
    //  * du comptes dinanciers de l'utilisateurs
    //  */
    // static async getAllOfCompteOfUser(idUser: string, idCompte: string): Promise<Transaction[]> {
    //     const transactions: Transaction[] = [];
    //     (await this.collection(idUser).where("idCompte", "==", idCompte).get()).docs.forEach((d) => { transactions.push(d.data()) });
    //     return transactions

    // }
    // /**
    //  * Cette fonction s'occupe de récupérer toutes les transactions
    //  * d'une catégorie d'un utilisateur
    //  * @param idUser Représente l'identifiant de l'utilisateur dont on 
    //  * souhaite récupere les transactions
    //  * @param idCatrgotirie Représente l'identifiant de la catégorie dont
    //  * on souhaite récuperer les transactions
    //  * @returns un tableau d'object représentant toutes les transactions
    //  * de la catégorie de l'utilisateur
    //  */
    // static async getAllOfCategorieOfUser(idUser: string, idCategorie: string): Promise<Transaction[]> {
    //     const transactions: Transaction[] = [];
    //     (await Transaction.collection(idUser).where("idCategorie", "==", idCategorie).get()).docs.forEach((d) => { transactions.push(d.data()) });
    //     return transactions;

    // }
    /**
      * Cette fonction s'ocupe d'effectuer les requêtes de l'utilisateur
      * @param query un objet représentant la requête de l'utilisateur
      * @returns 
      */
    static async query(idUser: string, query: query) {
        const transactions: Transaction[] = [];
        (await this.collection(idUser).where(query.attribut, query.operateur, query.valeur).get()).docs.forEach((d) => { transactions.push(d.data()) })
        return transactions;
    }

    // création de transaction
    /**
     * Cette fonction permet de créer une nouvelle transaction 
     * dans la collection des transactions
     * @param idUser Indique l'identifiant de l'utilisateur dont on 
     * souhaite créer la transaction
     * @param transaction un object qui représente la transaction que l'on souhaite
     * creer
     * @returns un object représentant la transaction qui a été crée
     */
    static async create(idUser: string, transaction: Transaction) {
        try {
            logger.log("Créons la transaction " + transaction.toString());
            return (await this.collection(idUser).add(transaction)).id
        } catch (error) {
            logger.log("Une ereur est survenue lors de la création de la transaction")
            logger.log(error);
            throw (error)
        }
    }
    /**
     * Cette fonction permet de créer un ensembles de requpetes
     * en une fois
     * @param idUser représente l'identifiant de l'tilisateur dont on
     * souhaite créer les transactions
     * @param transactions Représente un tableau d'objects qui
     * représente les transactions que l'on souhaite créer
     * @returns un tableau d'object représentant toutes les transactions
     * qui ont été crées
     */
    static async bulkCreate(idUser: string, transactions: Transaction[]): Promise<any[]> {

        try {
            const bulk = this.bulk(idUser);
            transactions.forEach((transaction) => { bulk.set(Transaction.collection(idUser).doc(), transaction); logger.log(bulk) })
            return await bulk.commit();
        } catch (error) {
            throw (error)
        }
    }

    // mise à jour de transaction
    /**
     * Cette fonction permet demodifier une transaction
     * @param idUser Indique l'identifiant de l'utilisateur dont on
     * souhaite modifier la transactions
     * @param transaction Un object qui représente la transaction 
     * que l'on souhaite modifier
     * @returns un object représentant la transaction qui a été modifiée
     */
    static async update(idUser: string, transaction: Transaction): Promise<Transaction> {
    
    
        await Transaction.collection(idUser).doc(transaction.id as string).update({...transaction});
        return Transaction.normalize(transaction)
    }
    /**
     * Cette fonctions permet de modifier un certains nombre de transactions
     * en une fois
     * @param idUser Indique l'identifiant de l'utilisateur dont on
     * souhaite modifier les transactions
     * @param transactions Tableau d'object qui représente les transactions que 
     * l'on souhaite modifier
     * @returns un tableau d'objects représentant les transactions modifiés
     */
    static async bulkUpdate(idUser: string, transactions: Transaction[]): Promise<any> {
        const bulk = this.bulk(idUser);
        transactions.forEach((t) => { bulk.update(Transaction.collection(idUser).doc(t.id as string), t) })
        return await bulk.commit();
    }
    // /**
    //  * Cette fonctio permet de modifier toutes les transactions
    //  * d'un utilisateur
    //  * @param idUser Représente l'identifiant de l'utilisateurs dont on souhaite modifier
    //  * Ses transactions
    //  * @param champAUpdate Représente les champs qui doivent etre modifiés ainsi que
    //  * les valeurs de rmeplacement
    //  * @returns Un tableau d'object repréentant les transactions qui ont été
    //  * modifié
    //  */
    // static updateAll(idUser: string, champAUpdate: {}): Transaction[] {
    //     //const transactions: Transaction[] = []
    //     throw ("Not implemented : Senseless for now")
    //     //return transactions;
    // }

    // supression de transaction 
    /**
     * Cette fonction permet de supprimer une transaction
     * @param idUser Indique l'identifiant de l'utilisateur dont on
     * souhaite supprimer la transaction
     * @param idTransaction Repésente l'identifiant de la transaction
     * qui veut etre supprimée
     * @returns Un object représentant la transaction qui vient
     * d'etre supprimée
     */
    static async delete(idUser: string, idTransaction: string): Promise<any> {
        return await Transaction.collection(idUser).doc(idTransaction).delete();
    }
    /**
     * Cette fonction permet de supprimer un certians nombre de Transaction
     * @param idUser Indique l'identifiant de l'utilisateur dont on
     * souhaite supprimer les transactions
     * @param idsTransactions Tabeau qui contient les indentifiant des 
     * trnasactions à supprimés
     * @returns Un tableau qui représente toutes les transactions qui viennent
     * d'etre supprimées
     */
    static async bulkDelete(idUser: string, idsTransactions: string[]): Promise<any> {
        const bulk = this.bulk(idUser);
        idsTransactions.forEach((idTransaction) => { bulk.delete(Transaction.collection(idUser).doc(idTransaction)) })
        return await bulk.commit();
    }
    /**
     * Cette fonction permet de supprimer toutes les transactions
     * d'un utilisateur
     * @param idUser Représente l'identifiant de l'utilisateur dont on souhaite supprimer
     * toutes les transaction
     * @returns Un tableau d'object qui représentes toutes les transactions 
     * qui ont été supprimées
     */
    static async deleteAll(idUser: string): Promise<any> {
        return await Transaction.collection(idUser).firestore.recursiveDelete(Transaction.collection(idUser));
    }
    /**
     * Cette fonction s'occupe de dire si l'objet est une transaction ou pas
     * @param prototype un object que l'on souhaite vérifier si c'est une transaction
     * @returns true si le prototype est une transaction et false sinon
     */
    static isTransaction(prototype: object): prototype is Transaction {

        return ("montant" in prototype && "typeFinal" in prototype && "idCompte" in prototype  && "flux" in prototype);
    }
    /**
     * Cette fonction s'occuppe de donner la référence de la collection 
     * Transaction sur firestore
     * @param idUser Indique l'identifiant de l'utilisateur actuelle
     * @returns 
     */
    private static collection(idUser: string) {
        return userRef(idUser).collection(Transaction.collectionName).withConverter(this.converter);
    }
    /**
     * Représente le convertisseur de données entre firestore et l'api
     */
    static converter: FirebaseFirestore.FirestoreDataConverter<Transaction> = {
        toFirestore: function (modelObject: Transaction): FirebaseFirestore.DocumentData {
            delete modelObject.id;
            return {...modelObject}
        },
        fromFirestore: function (snapshot: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>): Transaction {
            const data = snapshot.data();
            const id = snapshot.id
            return Transaction.normalize({ id: id, ...data })
        }
    }
    /**
     * 
     * @returns un object qui permet de faire des opéations multiples
     */
    private static bulk(idUser: string) {
        return this.collection(idUser).firestore.batch();
    }

    public toString() : string {
        return "\nid : " + this.id +
            "\nmontant : " + this.montant +
            "\ntypeInitial : " + this.typeInitial + 
            "\ntypeFinal : " + this.typeFinal +
            "\nflux : " + this.flux  +
            "\nidCompte : " + this.idCompte + 
            "\nidCategorie : " + this.idCategorie ;         
    }
    public async createFrais(idUser : string){
        if (this.frais <=0) throw new Error("Impossible de créer la transaction de frais car le montant des frais est nulll ou négatif")
        let f = new Transaction();
        f.typeFinal = "Depense";
        f.montant = this.frais;
        f.flux = "Sortant";
        f.idCompte = this.idCompte
        f.dateTransaction = new Date();
        f.idCategorie = "FraisFinancier";
        f.parent = this.id as string;
        f.frais = 0;
        let ids = await MapossaDataTech.creerTransaction(idUser,f);
        return ids.idMere;
        
        
    }
    public async create(idUser : string) {
        this.id = await Transaction.create   (idUser, {...this});

    }
    public static getAllOf(idUser: string , idTransaction : string) {
        return this.collection(idUser).where("parent","==", idTransaction).get();
    }

    public getAllOf(idUser : string){
        if ( !("id" in this )) throw new MapossaError("La transaction dont on essaye de récupérer les transactions fille n'a pas d'identifiant", this);
        return Transaction.getAllOf(idUser, this.id as string);
    }
    // public static initCompte ( compteFinancier : any ) {
    //     if(!(CompteFinancier.isCompteFinancier(compteFinancier))) throw new Error("Impossible de créer la transaction d'initialisation \ncar l'object passé n'est pas un compte financier valide");
    //     let transactionInit = new Transaction();
    //     transactionInit.montant = compteFinancier.solde;
    //     transactionInit.idCompte = compteFinancier.id;
    //     transactionInit.typeInitial = "Initialisation";
    //     transactionInit.typeFinal= "Revenu";
    //     return transactionInit;
    // }

}