import { logger } from "firebase-functions/v1";
import { ISystemData, userRef } from "../@interface";
import { initialType, finalType, devise, flux, decision, typeOperateur, SMS, Operator, phoneNumber, hour } from "../@type";
import MapossaDataTech from "../mapossaDataTech";

import MapossaError from "../mapossaError";
import Categorie from "./categorie";
import CompteFinancier from "./compteFinancier";



/**
 * Représentation d'une transaction selon Mapossa
 */
export default class Transaction implements ISystemData {
    /**
     * "montant" in prototype && "typeFinal" in prototype && "idCompte" in prototype  && "flux" in prototype
     */
    constructor() {
        this.createDate = new Date()
    };

    /**
    * Représente le nom de la collection dans laquelle
    * est sont stocké les transactions
    */
    public static readonly collectionName = "transactions";
    /**
     * Indique l'identifiant de la transaction dans
     * la collection
     */
    public id?: string;
    /**
     * Représente la date de création de la transaction
     */
    public createDate: Date;
    /**
     * Représente la dernière date de mise à jour 
     * de la transaction
     */
    public updateDate: Date = new Date();
    /**
     * Indique le type initial de la transaction
     */
    public initialType?: initialType | null = null;
    /**
     * Indique le type Final de la transaction
     */
    public finalType?: finalType | null = null;
    /**
     * représente le flux de la transaction effectuée (Entrant || Sortant)
     */
    public flux?: flux | null = null;
    /**
     * représente le montant de la transaction
     */
    public amount?: number = -1;


    /**
     * représente les information supplémentaires que 
     * l'utilisateur souhaite noter sur sa transaction
     */
    public note?: string | null = null;
    /**
     * représente le lieu où la transaction a été éffectuée
     */
    public lieu?: string | null = null;
    /**
     * représente le moyen de création de la transaction
     * (True: la transaction a été scrappée ||
     * False: la transaction a été créée manuellement par l'utilisateur
     */
    public isAuto: boolean = false;
    /**
     * représente le tyoe de transactionqui a été éffectuée (Mobile || Espece || Bancaire)
     */
    public type?: typeOperateur | null = null;
    /**
     * représente la devise de la transaction effectuée (FCFA)
     */
    public devise?: devise = "F CFA";
    /**
     * Représente l'identifiant de la catégorie à laquelle est 
     * associé la Transaction
     */
    public idCategory?: string | null = null;
    /**
     * représente le nom de la catégorie associée à la transaction
     */
    public nameCategory?: string | null = null;
    /**
     * représente l'url du logo de la catégorie associée à la transaction
     */
    public imageCategory?: string | null = null

    /**
     * représente l'opérateur de la transaction qui a été scrappée
     */
    public operator?: Operator | null = null;
    /**
     * représente le centre de messageire de l'opérateur qui a énvoyé un SMS financier
     */
    public serviceCenter?: phoneNumber | null = null;
    /**
     * représente l'id du compte sur lequel est effectuée la transaction mère
     */
    public accountId?: string | null = null;

    /**
     * représente le nom du compte sur lequel est effectuée la transaction mère
     */
    public nameAccount?: string | null = null;

    /**
     * représente l'url le logo du compte sur lequel est effectuée la transaction mère
     * idReceiverAccount
     */
    public imageAccount?: string | null = null;
    /**
     * représente l'id du compte sur lequel est effectuée la transaction fille de revenu
     */
    public idReceiverAccount?: string | null = null;
    /**
     * représente le nom du compte sur lequel est effectuée la transaction fille de
        revenu
     */
    public nameReceiverAccount?: string | null = null;
    /**
     * représente l'url du logo du compte sur lequel est effectuée la transaction fille de
     * revenu
     */
    public imageReceiverAccount?: string | null = null;
    /**
     * représente la date à laquelle l'utilisateur a éffectué 
     * la transaction dans la vie réelle
     */
    public dateTransaction?: Date | null = null;

    /**
     * représente l'heure à laquelle l'utilisateur 
     * a éffectué la transaction dans la vie réelle
     */
    public hour?: hour | null = null;
    /**
     * représente l'information supplémentaire donnée par l'utilisateur pour définir le type final
     * de la transaction ( (Depot[Moi meme || Quelqu'un d'autre]) || (Transfert[Entrant || Sortant || Vers un de
     * mes comptes]) )
     */
    public decision?: decision | null = null;
    /**
     * représente le montant des frais associés à la transaction
     * transactionID
     */
    public fees?: number | null = null;
    /**
     * représente le nom de l'expéditeur de la transaction
     */
    public senderName?: string | null = null;

    /**
     * Représente l'identifiant de la transaction mère de la fille
     */
    public idParent?: string | null = null;
    /**
     * représente le numéro de l'expéditeur de la transaction
     */
    public senderPhoneNumber?: phoneNumber | null = null;
    /**
     * représente le nom du récepteur de la transaction
     */
    public receiverName?: string | null = null;
    /**
     * représente le numéro du récepteur de la transaction
     */
    public receiverPhoneNumber?: phoneNumber | null = null;
    /**
     * représente le solde du compte associé à la transaction
     */
    public balance?: number | null = null;

    /**
     * Représente le numéro du compte financier qui cooncerne la transaction
     */
    public accountPhoneNumber?: phoneNumber | null = null;

    /**
     * détermine si le centre de messagerie de l'utilisateur est inconnu (True: le centre de
     * messagerie n'est pas connu || False: le centre de messagerie est connu)
     */
    public alert?: boolean | null = null;

    /**
     * détermine si l'algorithme n'a pas extrait le montant du SMS 
     * cet attribut est utilisé sur le tableau de bord de l'amélioration de l'algorithme
     */
    public amount_error?: boolean | null = null;
    /**
     * détermine si l'algorithme n'a pas extrait les frais du SMS 
     * //cet attribut est utilisé sur
     * le tableau de bord de l'amélioration de l'algorithme
     */
    public fees_error?: boolean | null = null;
    /**
     * détermine si l'algorithme n'a pas extrait la date du SMS 
     * cet attribut est utilisé sur le tableau de bord de l'amélioration de l'algorithme
     */
    public date_error?: boolean | null = null;

    /**
     * détermine si l'algorithme n'a pas extrait le solde du SMS 
     * cet attribut est utilisé sur le tableau de bord de l'amélioration de l'algorithme
     */
    public balance_error?: boolean | null = null;
    /**
     * détermine si le centre de messagerie de l'utilisateur est inconnu 
     * cet attribut est utilisé sur le tableau de bord de l'amélioration de l'algorithme
     */
    public verification_error?: boolean = false;
    /**
     * détermine si l'algorithme a eu un problème de verification 
     * cet attribut est utilisé sur le tableau de bord de l'amélioration de l'algorithme
     */
    public risk?: boolean = false;

    /**
     * détermine si l'algorithme a eu un problème de classification 
     * cet attribut est utilisé sur le tableau de bord de l'amélioration de l'algorithme
     */
    public error?: boolean = false;

    /**
     * détermine si l'algorithme a eu un problème d'extraction 
     * cet attribut est utilisé sur le tableau de bord de l'amélioration de l'algorithme 
     */
    public problem?: boolean = false;



    /**
     * Représente le sms d'ou à été découper la transaction
     * Cette atribut n'a de sens que pour les transactions scrapé ( isAuto = true )
     */
    public baseSMS?: SMS | null = null;
    /**
     * Représente l'id de la transaction auprès de l'opérateur
     */
    public transactionID?: string | null = null;


    // count 44 atributs
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

        if ("baseSMS" in transactionItem) transaction.baseSMS = transactionItem.baseSMS;
        if ("operator" in transactionItem) transaction.operator = transactionItem.operator;
        if ("serviceCenter" in transactionItem) transaction.serviceCenter = transactionItem.serviceCenter;

        if ("transactionID" in transactionItem) transaction.transactionID = transactionItem.transactionID;
        if ("isAuto" in transactionItem) transaction.isAuto = transactionItem.isAuto;

        if ("idParent" in transactionItem) transaction.idParent = transactionItem.idParent;

        if ("initialType" in transactionItem) transaction.initialType = transactionItem.initialType;
        if ("finalType" in transactionItem) transaction.finalType = transactionItem.finalType;

        if ("amount" in transactionItem) transaction.amount = transactionItem.amount;

        if ("accountId" in transactionItem) transaction.accountId = transactionItem.accountId;
        if ("accountPhoneNumber" in transactionItem) transaction.accountPhoneNumber = transactionItem.accountPhoneNumber;
        if ("nameAccount" in transactionItem) transaction.nameAccount = transactionItem.nameAccount;
        if ("imageAccount" in transactionItem) transaction.imageAccount = transactionItem.imageAccount;

        if ("idReceiverAccount" in transactionItem) transaction.idReceiverAccount = transactionItem.idReceiverAccount;
        if ("nameReceiverAccount" in transactionItem) transaction.nameReceiverAccount = transactionItem.nameReceiverAccount;
        if ("imageReceiverAccount" in transactionItem) transaction.imageReceiverAccount = transactionItem.imageReceiverAccount;

        if ("senderName" in transactionItem) transaction.senderName = transactionItem.senderName;
        if ("senderPhoneNumber" in transactionItem) transaction.senderPhoneNumber = transactionItem.senderPhoneNumber;
        if ("receiverName" in transactionItem) transaction.receiverName = transactionItem.receiverName;


        if ("accountPhoneNumber" in transactionItem) transaction.accountPhoneNumber = transactionItem.accountPhoneNumber;

        if ("alert" in transactionItem) transaction.alert = transactionItem.alert;

        if ("amount_error" in transactionItem) transaction.amount_error = transactionItem.amount_error;
        if ("fees_error" in transactionItem) transaction.fees_error = transactionItem.fees_error;
        if ("date_error" in transactionItem) transaction.date_error = transactionItem.date_error;
        if ("balance_error" in transactionItem) transaction.balance_error = transactionItem.balance_error;

        if ("verification_error" in transactionItem) transaction.verification_error = transactionItem.verification_error;
        if ("risk" in transactionItem) transaction.risk = transactionItem.risk;
        if ("error" in transactionItem) transaction.error = transactionItem.error;
        if ("problem" in transactionItem) transaction.problem = transactionItem.problem;

        if ("hour" in transactionItem) transaction.hour = transactionItem.hour;
        if ("fees" in transactionItem) transaction.fees = transactionItem.fees;

        if ("note" in transactionItem) transaction.note = transactionItem.note;
        if ("devise" in transactionItem) transaction.devise = transactionItem.devise;
        if ("lieu" in transactionItem) transaction.lieu = transactionItem.lieu;

        if ("idCategory" in transactionItem) transaction.idCategory = transactionItem.idCategory;
        if ("nameCategory" in transactionItem) transaction.nameCategory = transactionItem.nameCategory;
        if ("nameReceiveimageCategoryrAccount" in transactionItem) transaction.imageCategory = transactionItem.imageCategory;
        if ("imageReceiverAccount" in transactionItem) transaction.imageReceiverAccount = transactionItem.imageReceiverAccount;

        if ("flux" in transactionItem) transaction.flux = transactionItem.flux;
        if ("decision" in transactionItem) transaction.decision = transactionItem.decision;
        if ("dateTransaction" in transactionItem) transaction.dateTransaction = transactionItem.dateTransaction;


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
        let t = (await this.collection(idUser).doc(idTransaction).get())
        if (!t.exists) throw new MapossaError("La Transaction demandé n'existe pas");
        return t.data();

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
    static async query(idUser: string, attribut: string, valeur: string) {
        const transactions: Transaction[] = [];
        (await this.collection(idUser).where(attribut, "==", valeur).get()).docs.forEach((d) => { transactions.push(d.data()) })
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
    static async update(idUser: string, transaction: Transaction , idTransaction : string) {


       return await Transaction.collection(idUser).doc(idTransaction).update({ ...transaction });
        
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

        return ("amount" in prototype && "finalType" in prototype && "accountId" in prototype && "flux" in prototype);
    }
    /**
     * Cette fonction s'occuppe de donner la référence de la collection 
     * Transaction sur firestore
     * @param idUser Indique l'identifiant de l'utilisateur actuelle
     * @returns 
     */
    public static collection(idUser: string) {
        return userRef(idUser).collection(Transaction.collectionName).withConverter(this.converter);
    }
    /**
     * Représente le convertisseur de données entre firestore et l'api
     */
    static converter: FirebaseFirestore.FirestoreDataConverter<Transaction> = {
        toFirestore: function (modelObject: Transaction): FirebaseFirestore.DocumentData {
            delete modelObject.id;
            return { ...modelObject }
        },
        fromFirestore: function (snapshot: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>): Transaction {
            const data = snapshot.data();
            const id = snapshot.id
            return Transaction.normalize({ id: id, ...data });
        }
    }
    /**
     * 
     * @returns un object qui permet de faire des opéations multiples
     */
    private static bulk(idUser: string) {
        return this.collection(idUser).firestore.batch();
    }

    // public toString(): string {
    //     return "\nid : " + this.id +
    //         "\nmontant : " + this.amount +
    //         "\ntypeInitial : " + this.in +
    //         "\ntypeFinal : " + this.typeFinal +
    //         "\nflux : " + this.flux +
    //         "\nidCompte : " + this.idCompte +
    //         "\nidCategorie : " + this.idCategorie;
    // }
    public async createFrais(idUser: string) {
        if (this.fees && this.fees <= 0) throw new Error("Impossible de créer la transaction de frais car le montant des frais est absent ou nul")
        let f = new Transaction();
        f.finalType = "Depense";
        f.amount = this.fees as number;
        f.flux = "Sortant";
        f.accountId = this.accountId
        f.dateTransaction = this.dateTransaction;
        f.idCategory = "FraisFinancier";
        f.idParent = this.id as string;
        f.fees = undefined;
        let ids = await MapossaDataTech.creerTransaction(idUser, f);
        this.fees = undefined;
        return ids.idMere;


    }
    public async createVirement(idUser: string) {

        if (this.finalType != "Virement") throw new MapossaError("Impossible de créer le virement car la transaction n'a pas pour type final virement");

        if (!this.idReceiverAccount) {
            throw new MapossaError("Impossible de créer la transaction fille de virement car \nil manque l'identifiant du compte de la transactin fille")
        }
        const refCompteFille = await CompteFinancier.getById(idUser, this.idReceiverAccount);
        if (!refCompteFille.exists) throw new MapossaError("Impossible de trouver le compte financier de la transaction fille de virement ", { idCompte: refCompteFille.id });

        let virement = Transaction.normalize(this);

        virement.idReceiverAccount = this.accountId;
        virement.idParent = this.id;
        virement.isAuto = false;
        virement.id = undefined;
        virement.fees = undefined;

        return await MapossaDataTech.creerTransaction(idUser, virement);

    }
    public async create(idUser: string) {
        this.id = await Transaction.create(idUser, { ...this });

    }
    public static getAllOf(idUser: string, idTransaction: string) {
        return this.collection(idUser).where("parent", "==", idTransaction).get();
    }

    public getAllOf(idUser: string) {
        if (!("id" in this)) throw new MapossaError("La transaction dont on essaye de récupérer les transactions fille n'a pas d'identifiant", this);
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
    /**
     * Cateorise une transactiion suivant l'identifiant de la catégorie
     * Cout : 2-3 Lecture ; 0-2 Update
     * @param idUser Représente l'identifiant de l'utilisateur dont on souhaite mettre à jour la transaction
     * @param idCategorie Représente l'identiiant de la catégorie à associer
     */
    async categorise(idUser: string, idCategorie: string) {
        const oldTransaction = (await Transaction.getById(idUser, this.id as string)) as Transaction;
        const categorie = (await Categorie.getById(idUser, idCategorie)) as Categorie;

        if (oldTransaction.idCategory) {
            console.log("La transaction a déjà une catégorie")
            if (oldTransaction.idCategory != categorie.id) {
                console.log("La catégorie est différente de la catégorie actuelle, il s'agit d'une modification de categorie")
                const oldCategorie = (await Categorie.getById(idUser, oldTransaction.idCategory)) as Categorie;

                this.idCategory = categorie.id;

                oldCategorie.montantCumule -= this.amount as number;
                categorie.montantCumule += this.amount  as number;
                
                await Categorie.bulkUpdate(idUser, [oldCategorie, categorie])     

            }
        } else {
            this.idCategory = categorie.id;
            categorie.montantCumule += this.amount as number;
            await categorie.update(idUser);
        }

    }
}