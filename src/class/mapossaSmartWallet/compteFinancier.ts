import { logger } from "firebase-functions/v1";
import { ISystemData, userRef } from "../@interface";
import { query } from "../@type";
import MapossaError from "../mapossaError";
import Transaction from "./transaction";
//import Transaction from "./transaction";

/**
 * Représentation d'un compte financier selon Mapossa
 */
export default class CompteFinancier implements ISystemData {

    constructor() { }
    /**
     * Indique le nom de la collection qui contient
     * Les comptes financiers d'un utilisateur
     */
    public static readonly collectionName = "compteFinanciers";
    /**
     * Indique l'identifant du compte dans 
     * la collection
     */
    public id: string | undefined;
    /**
     * Représente le nom du compte financier
     */
    public nom: string | undefined;
    /**
     * Représente le solde du compte financier
     * Le solde d'un compte ne peut pas etre négatifs
     */
    public solde: number = 0;
    /**
     * Indique l'identifiant de l'oprérateur
     * de ce compte financier;
     */
    public idOperateur: string | undefined;
    /**
     * Représente la somme des transactions entrantes
     * de compte
     */
    public sommeEntree: number = 0;
    /**
     * Représente la somme des transactions sortantes
     * de ce compte
     */
    public sommeSortie: number = 0;
    //Les attributs systèmmes
    /**
     * Indique la date à la quelle a été crée le compte
     * Financier
     */
    public createDate: Date = new Date();
    /**
     * Indique la dernière date de mise à jour du compte
     * financier
     */
    public nomOperateur : string = "";
    public logoOperateur : string = "" ;
    public typeCompte : string = "";
    public updateDate: Date = new Date();
    public numero : string = "";
    public isAuto : boolean = false;
    /**
     * Représente le solde initial d'un compte financier
     */
    public soldeInitial: number = this.solde;
    // la méthode de normalisation
    /**
     * Cette fonction s'occupe de Changer un item de la collection
     * on un objet de type Compte
     * @param item object qui représente un compte proenant
     * directement de la collection
     * @returns un object Compte représentant du compte
     * venant de la collection
     */
    static normalize(item: any): CompteFinancier  {
        console.log("voici ce qui a été passé à normalise de compte financier")
        console.log(item)
        let compte = new CompteFinancier();

        if ("id" in item) compte.id = item.id;
        if ("nom" in item) compte.nom = item.nom;
        if ("solde" in item) compte.solde = item.solde;
        if ("idOperateur" in item) compte.idOperateur = item.idOperateur;
        if ("sommeEntree" in item) compte.sommeEntree = item.sommeEntree;
        if ("sommeSortie" in item) compte.sommeSortie = item.sommeSortie;
         if("soldeInitial" in item) compte.soldeInitial = item.soldeInitial;
        if ("nomOperateur" in item ) compte.nomOperateur = item.nomOperateur;
        if ("logoOperateur" in item ) compte.logoOperateur = item.logoOperateur ;
        if ("typeCompte" in item ) compte.typeCompte = item.typeCompte ;
        if ("numero" in item) compte.numero = item.numero ;
        if ("isAuto" in item) compte.isAuto = item.isAuto;
        

        return compte;
    }
    // /**
    //  * Cette fonction permet de convertir un grand nombre d'objet de la 
    //  * collection en Compte
    //  * @param compteItems un tableau d'object représentant les
    //  * comptes venant directement de la collection
    //  * @returns un tableau d'object convertit en type Coompte
    //  */
    // static bulkNormalise(compteItems: object[]): CompteFinancier[] {
    //     const comptes: CompteFinancier[] = [];

    //     return comptes;
    // }
    // les méthides de création de compte financiers
    /**
     * Cette fonction s'occupe de créer un compte financier à 
     * un utilisateur
     * @param idUser Indique l'identifiant de l'utilisateur dont on
     * souhaite créer le compte financier
     * @param compte un object qui représente le compte financier 
     * à créer
     * @returns un object qui représente le compte financier qui 
     * a été crée
     */
    static async create(idUser: string, compte: any) {
        
        return (await CompteFinancier.collection(idUser).add({...compte})).id;

    }
    /**
     * Cette fonction s'occupe de créer plusieurs comptes
     * financiers en une fois
     * @param idUser Indique l'identifiant de l'utilisateur dont on
     * souhaite créer les comptes financiers
     * @param comptes un tableau d'object représentant les 
     * comptes financiers à créer
     * @returns un tableau de d'object représentant les comptes
     * financiers qui ont été crées
     */
    static async bulkCreate(idUser: string, comptes: object[]) {
        const bulk = this.bulk(idUser);
        comptes.forEach((c) => { bulk.set(CompteFinancier.collection(idUser).doc(), c) })
        return await bulk.commit();
    }

    //Les méthodes de récupération des comptes fianciers
    /**
     * Cette fonction s'occupe de récupérer un compte 
     * d'un utilisateur grâce à son identifiant
     * @param idUser Indique l'identifiant de l'utilisateur dont on
     * souhaite récuperer le compte
     * @param idCompte représente l'identifiant du compte financier que
     * l'on souhaite récupérer
     * @returns un object représentant le compte financier
     * que l'on souhaitait recupérer
     */
    static async getById(idUser: string, idCompte: string) {
        return (await this.collection(idUser).doc(idCompte).get());  
    }
    /**
     * Cette fonction s'occupe de récupérer tous les comptes
     * Financiers d'un uilisateur
     * @param idUser Indique l'identifiant de l'utilisateur dont
     * on souhaite avoir tous les comptes
     * @returns un tableau d'object qui représente
     * les tous les comptes financiers de l'utilisateurs
     */
    static async getAllOfUser(idUser: string) {
        const comptes: CompteFinancier[] = [];
        (await CompteFinancier.collection(idUser).get()).docs.forEach((d) => { comptes.push(d.data()) });
        return comptes;
    };
    /**
     * Cette fonction s'ocupe d'effectuer les requêtes de l'utilisateur
     * @param query un objet représentant la requête de l'utilisateur
     * @returns 
     */
    static async query(idUser: string, query: query) {
        const comptes: CompteFinancier[] = [];
        (await this.collection(idUser).where(query.attribut, query.operateur, query.valeur).get()).docs.forEach((d) => { comptes.push(d.data()) })
        return comptes;
    }
    static async getByNom( idUser : string , nom : string) {
        return await this.collection(idUser).where("nom", "==", nom).get()
    }
    static async getByType( idUser : string , typeCompte : string) {
        return await this.collection(idUser).where("typeCompte", "==", typeCompte).get()
    }
    /**
     * Cette fonction s'occupe de modifer un compte financier
     * d'un utilisateur
     * @param idUser Indique l'identifiant de l'utilisateur dont on
     * souhaite modifier le compte financier
     * @param compte un object qui représente le compte financier
     * que l'on souhaite modifier
     * @returns un objct représentant le compte financiers modifié
     */
    static async update(idUser: string, compte: CompteFinancier | any) {
        

        return this.collection(idUser).doc(compte.id as string).update(compte);
    };
    /**
     * Cette fonction s'occupe de modifier certains comptes financiers
     * de l'utilisateur
     * @param idUser Indique l'identifiant de l'utilisateur dont on
     * souhaite modifier les comptes financiers
     * @param comptes tableau qui représentent les comptes qui doivent etre 
     * modifié
     * @returns un tableau d'object représentant les comptes qui
     * ont été modifiés
     */
    static async bulkUpdate(idUser: string, comptes: CompteFinancier[]): Promise<any> {
        const bulk = this.bulk(idUser);
        comptes.forEach((c) => { bulk.update(CompteFinancier.collection(idUser).doc(c.id as string), c) })
        return await bulk.commit();
    };
    // /**
    //  * Cette fonction s'occupe de modifier tous les comptes
    //  * de l'utilisateur
    //  * @param idUser Indique l'identifiant de l'utilisateur dont on
    //  * souhaite modifier tous les comptes financiers
    //  * @param champ un object qui représente les champs qui doivent
    //  * modifié dans tous les comptes de l'utilisateur 
    //  * @returns un tableau d'object représentant tous les 
    //  * comptes financiers qui ont été modifiés
    //  */
    // static updateAllOfUser(idUser: string, champ: object): CompteFinancier[] {
    //     throw ("Error not implemented");
    // };
    // les méthodes de suppression
    /**
     * Cette fonction s'occupe de supprimer un compte
     * financier d'un utilisateur
     * @param idUser Indique l'identifiant de l'utilisateur dont on
     * souhaite supprimer le compte financier
     * @param idCompte Indique l'identifiant du compte financier
     * que l'on souhaite supprimer
     * @returns un object qui représente le compte financier qui
     * vient d'etre supprimé
     */
    static async delete(idUser: string, idCompte: string): Promise<any> {
        return await CompteFinancier.collection(idUser).doc(idCompte).delete();
    };
    /**
     * Cette fonction s'occupe de supprimer toute les comptes
     * financiers d'un utilisateur
     * @param idUser 
     * @returns un tableau qui contient de objects représentant
     * tous les comptes financiers qui ont été supprimés
     */
    static async deleteAll(idUser: string): Promise<any> {
        return CompteFinancier.collection(idUser).firestore.recursiveDelete(CompteFinancier.collection(idUser));
    };
    /**
     * Cette fonction s'ooccupe de supprimer certains compte
     * Financiers d'un utilisateur
     * @param idUser 
     * @param idsComptes tableau qui contient les identifiants
     * des comptes que l'on souhaite supprimer
     * @returns un tableau d'objet représentant les comptes 
     * qui ont été supprimés
     */
    static async bulkDelete(idUser: string, idsComptes: string[]): Promise<any> {
        const bulk = this.bulk(idUser);
        idsComptes.forEach((idC) => { bulk.delete(CompteFinancier.collection(idUser).doc(idC)) })

        return await bulk.commit();
    }
    /**
     * S'occupe de doner la référence de lla collection des comptes financiers
     * @param idUser Inique l'identifiant de l'utilisateur
     * @returns 
     */
    public static collection(idUser: string) {
        return userRef(idUser).collection(CompteFinancier.collectionName).withConverter(this.converter);
    }
    /**
     * Dit si l'itel est un compte financier ou pas
     * @param item L'item dont on veut savoir si c'est un compte financier
     * @returns 
     */
    static isCompteFinancier(item: any): item is CompteFinancier {
        return ("solde" in item);
    }

    /**
     * Représente le convertisseur de données entre firestore et l'api
     */
    static converter: FirebaseFirestore.FirestoreDataConverter<CompteFinancier> = {
        toFirestore: function (modelObject: CompteFinancier): FirebaseFirestore.DocumentData {
            delete modelObject.id;
            return modelObject
        },
        fromFirestore: function (snapshot: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>): CompteFinancier {
            const data = snapshot.data();
            const id = snapshot.id
            return CompteFinancier.normalize({ id: id, ...data })
        }
    }
    /**
     * 
     * @returns un object qui permet de faire des opéations multiples
     */
    private static bulk(idUser: string) {
        return this.collection(idUser).firestore.batch();
    }

    public async addTransaction(idUser: string, transaction: any) {
        logger.log("Débutons");

        if (transaction.flux == "Entrant" && (transaction.typeInitial == "Depôt" || transaction.typeFinal == "Revenu")) {
            logger.log("Il s'agit d'un revenu sur le compte");
            this.deposer(idUser,transaction.montant);
        } else if (transaction.flux == "Sortant" && (transaction.typeInitial == "Retrait" || transaction.typeInitial == "Transfert" || transaction.typeFinal == "Depense")) {
            logger.log("Il s'agit d'une dépense sur le compte")
            this.retirer(idUser,transaction.montant);
        } else {
            logger.log("Le cas donné pour l'enregistrement de la transaction est inconnue " + transaction.toString());
            throw "Le cas donné pour l'enregistrement de la transaction est inconnue " + transaction.toString();

        }
        return await CompteFinancier.update(idUser, { ...this });
    }
    public async retirer(idUser : string,montant: number) {
        if (this.solde < montant) throw new MapossaError("Impossible de retirer de l'argent dans ce compte car le solde est insufissant")
        this.sommeSortie += montant;
        await this.updateSolde(idUser);

    }
    public async deposer(idUser : string,montant: number) {
        this.sommeEntree += montant;
        await this.updateSolde(idUser);
    }
    public async virer(transact: Transaction, idUser: string, idCompteDesti: string) {
        logger.log("On récupère le compte dest");
        const refCompteDest = await CompteFinancier.getById(idUser, idCompteDesti);
        logger.log(refCompteDest);
        if (!refCompteDest.exists) {
            logger.log("Impossible d'effectuer le virement car le compte destinataire n'existe pas")
            throw new MapossaError("Impossible d'effectuer le virement car le compte destinataire n'existe pas")
        }
        logger.log("On récupère les data du compte");
        const compteDest = refCompteDest.data() as CompteFinancier;
        logger.log("On récupère le montant de la transaction");
        let montant : number = transact.amount as number;
        logger.log("On retire dans le compte");
        this.retirer(idUser, montant);
        logger.log("On dépose dans le compte");
        compteDest.deposer(idUser,montant);
        logger.log("On crée la transaction fille");
        let t = new Transaction();
        t.amount = montant;
        t.flux = "Entrant";
        t.dateTransaction = new Date();
        t.accountId = compteDest.id;
        t.initialType = transact.initialType;
        t.idCategory = transact.idCategory;
        t.idParent = transact.id as string;
        logger.log("On set les attributs de la transactions");
        
        let idT = await Transaction.create(idUser, t);
        logger.log("Voilà l'id de la transaction fille : " + idT);
        return idT;
        
    }
    public async updateSolde(idUser : string) {
        this.solde = this.soldeInitial + this.sommeEntree - this.sommeSortie;
        await this.update(idUser)
    }
    public async update (idUSer : string) {
    
        return await CompteFinancier.update(idUSer, { ...this });
    }
    public async create(idUser : string) {
        this.id = await CompteFinancier.create(idUser, {...this})
    }
    public static async getWithNumber ( idUser : string , number : string) {
        return await this.collection(idUser).where("numero", "==", number).get()
        
    }
}