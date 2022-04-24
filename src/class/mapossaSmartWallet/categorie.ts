import { typeFinal  } from "../@type";
import { dataBase, ISystemData, userRef } from "../@interface";
/**
 * Représentation d'une catégorie selon Mapossa
 */
export default class Categorie implements ISystemData {

    constructor() { }

    /**
     * Indique le nom de la collection dans la quelle
     * sont stockés les catégories
     */
    public static readonly collectionName: string = "categories";

    
    /**
     * Indique l'identifiant de la catégorie dans la
     * collection catégorie
     */
    public id: string | undefined;
    /**
     * Indique le nom de la catégorie
     */
    public nom: string | undefined;
    /**
     * Indique le type final de la catégorie
     */
    public typeFinal: typeFinal |  undefined;
    /**
     * Indique si la catégorie est une catégorrie créer par
     * Mapossa ou par l'utilisateur
     * true pour créee par mapossa sinon
     */
    public isAuto: boolean = false;
    /**
     * Indique l'url de l'image du logo de la categorie
     */
    public logo: string | undefined;
    /**
     * Indique l'identifiant de la catégorie parent de 
     * cette catégorie
     * Lorsque non vide, confirme aussi que la catégorie 
     * est une sous-catégorie
     */
    public idParent: string | undefined;
    /**
     * Représente la somme des transactions qui sont 
     * associés à la catégorie
     */
    public montantCumule: number = 0;
    //Les attributs systèmes
    /**
     * Représente la date de création de la catégorie
     */
    public createDate: Date = new Date();
    /**
     * Représente la dernière date de modification
     * de la catégorie
     */
    public updateDate: Date = new Date();
    
    // la méthode de normalisation
    /**
     * Cette fonction s'occupe de Changer un item de la collection
     * on un objet de type catégorie
     * @param item object qui représente une catégorie provenant
     * directement de la collection
     * @returns un object Categorie représentant la catégorie
     * venant de la collection
     */
    static normalize(item: any): Categorie {
        const categorie = new this()

        if ("id" in item) categorie.id = item.id;
        if ("nom" in item) categorie.nom = item.nom;
        if ("typeFinal" in item) categorie.typeFinal = item.typeFinal;
        if ("isAuto" in item) categorie.isAuto = item.isAuto; else categorie.isAuto = true;
        if ("logo" in item) categorie.logo = item.logo;
        if ("idParent" in item) categorie.idParent = item.idParent;
        if ("montantCumule" in item) categorie.montantCumule = item.montantCumule;
        //if ("isDelete" in item) categorie.isDelete = item.isDelete ; else categorie.isDelete = false;  
        
        return {...categorie}
    }
    // /**
    //  * Cette fonction permet de convertir un grand nombre d'objet de la 
    //  * collection en catégorie
    //  * @param categorieItems un tableau d'object représentant les 
    //  * catégories venant directement de la collection
    //  * @returns un tableau d'object convertit en type catégorie
    //  */
    // static bulkNormalise(categorieItems: object[]): Categorie[] {
    //     const cats: Categorie[] = [];

    //     return cats;
    // }
    // les méthodes de création des catégories
    /**
     * Cette fontion permet de créer une catégorie personnelle
     * d'un utilisateur
     * @param idUser Indique l'identifiant de l'utilisateur dont on
     * souhaite créer la catégorie personnelle
     * @param categorie object qui représente la catégorie que l'on
     * souhaite créer
     * @returns un object qui représente la catégorie qui a été
     * crée
     */
    static async create(idUser: string, categorie: Categorie) { 

        return (await this.collection(idUser).add(categorie)).id;
    }
    /**
     * Cette fonctin permet de créer plusieurs catégories en
     * une fois
     * @param idUser Indique l'identifiant de l'utilisateur dont 
     * on souhaite créer les catégories
     * @param categories tableau d'object qui repprésente les
     * catégories que l'on souhaite créer
     * @returns un tableau d'object représentant les catégories 
     * qui viennen d'etre crées
     */
    static async bulkCreate(idUser: string, categories: any[]) {
        const bulk = this.bulk(idUser);
        categories.forEach((c)=>{ bulk.set(this.collection(idUser).doc(), c) })
        return await bulk.commit()
    }
    // Les méthodes de rcupération
    /**
     * Cette fontion s'occupe de récupére une catégorie
     * grâce à son identifiant
     * @param idUser Indique l'identifiant de l'utilisateur dont
     * on souhaite récupérer les catégories
     * @param idCategorie Indique l'identifiant de la catégorie que l'on 
     * souhaite récupérer
     * @returns un object représentant la categorie récupérée
     */
    static async getById(idUser: string, idCategorie: string) {
       let cat = (await this.collection(idUser).doc(idCategorie).get())
       if (! cat.exists) throw "La catégorie demandé n'existe pas";
       return cat.data();
     
    }
    /**
     * Cette fonction s'ocupe d'effectuer les requêtes de l'utilisateur
     * @param query un objet représentant la requête de l'utilisateur
     * @returns 
     */
    static query(idUser : string) {
        return this.collection(idUser)
    }
    /**
     * Cette fontion s'occupe de récupére toutes les catégorie
     * d'un utilisateur
     * @param idUser Indique l'identifiant de l'utilisateur dont
     * on souhaite récupérer les catégories
     * @returns un tableau d'object représentant les categories récupérées
     */
    static async getAllOfUser(idUser: string) {
        const cats: Categorie[] = [];
        (await this.collection(idUser).get()).docs.forEach((d) => { cats.push(d.data()) });
        return cats;
    }
    static async getAllOfType(idUser: string, type : string) {
        const cats: Categorie[] = [];
        (await this.collection(idUser).where("typeFinal" , "==", type) .get()).docs.forEach((d) => { cats.push(d.data()) });
        return cats;
    }
    // static async getAllOfUser(idUser: string) {
    //     const cats: Categorie[] = [];
    //     (await this.collection(idUser).get()).docs.forEach((d) => { cats.push(d.data()) });
    //     return cats;
    // }

    // les méthodes de mises à jours 
    /**
     * Cette fonction s'occupe de modifier une catégorie en particulier
     * @param idUser Indique l'identifiant de l'utilisateur dont 
     * on souhaite modifier la catégorie
     * @param categorie object qui représente la catégorie que l'on souhaite
     * modifier
     * @returns un object représentant la catégorie qui a été modifiée
     */
    static async update( idUser : string, categorie : Categorie) {

        return this.collection(idUser).doc(categorie.id as string).update(categorie);
    }
    /**
     * Cette fonction s'occupe de modifier des catégorie de l'utilisateurs
     * @param idUser Indique l'identifiant de l'utilisateur dont
     * on souhaite modifier les catégories
     * @param categories un tableau d'objects qui représente les catégorie que l'on souhaite
     * modifier
     * @returns tableau d'objects représentant les catégories qui ont été modifiée
     */
    static async bulkUpdate(idUser: string, categories: Categorie[]) {
        const bulk = this.bulk(idUser);
        categories.forEach((c)=> { bulk.update(this.collection(idUser).doc(c.id as string), c) })
        return await bulk.commit();
    }
    // /**
    //  * Cette fonction s'occupe de modifier toutes les catégorie de l'utilisateurs
    //  * @param idUser Indique l'identifiant de l'utilisateur dont
    //  * on souhaite modifier les catégories
    //  * @param champ un object qui représente les champ des catégories
    //  *  que l'on souhaite modifier
    //  * @returns tableau d'objects représentant les catégories qui ont été modifiée
    //  */
    // static updateAll(idUser: string, champ: object): Categorie[] {
    //     throw("Error : not Implemened");
    // }
    // Les méthodes de suppréssions des catégories
    /**
     * Cette fonction s'occupe de supprimer une catégorie en particulier 
     * d'un utilisateur
     * @param idUser Indique l'identifiant de l'utilisateur dont
     * on souhaite supprimer la catégorie
     * @param idCategorie Indique l'identifiant de la catégorie qui doit etre
     * supprimé
     * @returns un object qui représente la catégorie qui vient d'etre
     * supprimé
     */
    static async delete( idUser : string , idCategorie: string) {
        return await this.collection(idUser).doc(idCategorie).delete();
    }
    /**
     * Cette fonction s'occupe de supprimer des catégories
     * d'un utilisateur
     * @param idUser Indique l'identifiant de l'utilisateur dont
     * on souhaite supprimer la catégorie
     * @param idsCategorie un tableau contenant les identifiant des catégories
     * qui doivent etre supprimées
     * @returns un tableau d'objects qui représente les catégories qui viennent 
     * d'etre supprimées
     */
    static async bulkDelete(idUser: string, idsCategorie: string[]) {
        const bulk = this.bulk(idUser);
        idsCategorie.forEach((idc)=> { bulk.delete(this.collection(idUser).doc(idc))})
        return await bulk.commit();
    }
    /**
     * Cette fonction s'occupe de supprimer toutes les catégories
     * d'un utilisateur
     * @param idUser Indique l'identifiant de l'utilisateur dont
     * on souhaite supprimer la catégorie
     * @returns un tableau d'objects qui représente les catégories qui viennent
     * d'etre supprimées
     */
    static async deleteAll(idUser: string) {
        return this.collection(idUser).firestore.recursiveDelete(this.collection(idUser))
    }
    /**
     * Renvoi la référence de la collection Catégorie dans firestore
     * @param idUser 
     * @returns 
     */
    private static collection ( idUser: string) {
        return userRef(idUser).collection(this.collectionName).withConverter(this.converter);
    }
    /**
     * dit si un object est une catégorie
     * @param item L'object que l'on souhaite vérifier s'il s'agit d'une catégorie ou pas
     * @returns 
     */
    static isCategorie(item : any)  : item is Categorie {
        return (  "nom" in item && "typeFinal" in item && "logo" in item );
    }
    /**
     * Représente le convertisseur de données entre firestore et l'api
     */
    static converter: FirebaseFirestore.FirestoreDataConverter<Categorie> = {
        toFirestore: function (modelObject: Categorie): FirebaseFirestore.DocumentData {
            delete modelObject.id;
            return modelObject
        },
        fromFirestore: function (snapshot: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>): Categorie {
            const data = snapshot.data();
            const id = snapshot.id
            return Categorie.normalize({ id: id, ...data })
        }
    }
    /**
     * 
     * @returns un object qui permet de faire des opéations multiples
     */
    private static bulk(idUser: string) {
        return this.collection(idUser).firestore.batch();
    }

    public static getAllLogo() {

        return dataBase.collection(this.getLogoCategorieCollectionName()).get();
    }
    public static getLogoCategorieCollectionName() {
        return "logoCategories";
    }
    public static construct( nom : string , typeFinal : typeFinal  ,logo : any ,  ) {
        const categorie = new this()
        categorie.nom = nom;
        categorie.typeFinal = typeFinal;
        categorie.isAuto = true;
        categorie.logo = logo;

        return {...categorie}
    }
   
}