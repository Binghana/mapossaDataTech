import { ISystemData, userRef } from "../@interface";
import { hour , query } from "../@type";


/**
 * Représentation d'une habitude selon Mapossa
 */
export default class Habitude implements ISystemData {

    constructor() { }
    /**
     * Indique la collection dans la quelle sont stockés
     * les habitudes de l'utilisateur
     */
    public static readonly collectionName = "habitudes";
    /**
     * Indique l'identifant de l'habitude dans la collection 
     */
    public id: string | undefined;
    /**
     * Représente la date à la quelle l'habitude a été créee
     */
    public createDate: Date = new Date();
    /**
     * Représente la dernière date de mise à jour de l'habitude
     */
    public updateDate: Date = new Date();
    /**
     * Indique le nom de l'habitude
     */
    public nom : string | undefined ;
    /**
     * Indique l'heure de rappel de l'habitude 
     * par fréquence
     */
    public rappel : hour | undefined;
    /**
     * Représente la date début de l'habitude
     */
    public dateDebut : Date = new Date();
    /**
     * Indique l'identifiant de l'objectif de l'habitude
     */
    public idObjectif : string | undefined;
    /**
     * Indique si l'habitude a été effectué ou pas
     */
    public done : boolean = false;
    /**
     * Iniduqe la fréquence à la quelle l'habitude doit se 
     * repéter
     */
    public repetition : string | undefined;

    // la méthode de normalisation
    /**
     * Cette fonction s'occupe de Changer un item de la collection
     * on un objet de type Habitude
     * @param item object qui représente une habitude provenant
     * directement de la collection
     * @returns un object Habitude représentant l'habitude
     * venant de la collection
     */
    static normalize(item: any): Habitude {
        const habitude = new Habitude()
        
        if ("id" in item) habitude.id = item.id;
        if ("nom" in item) habitude.nom = item.nom;
        if ("rappel" in item) habitude.rappel = item.rappel;
        if ("done" in item) habitude.done = item.done;
        if ("idObjectif" in item) habitude.idObjectif = item.idObjectif;
        if ("dateDebut" in item) habitude.dateDebut = item.dateDebut;
        if ("repetition" in item) habitude.repetition = item.repetition;

        return habitude;
    };
    // /**
    //  * Cette fonction permet de convertir un grand nombre d'objet de la 
    //  * collection en Habitude
    //  * @param habitudeItems un tableau d'object représentant les
    //  * habitudes venant directement de la collection
    //  * @returns un tableau dont les objet sont converti en type Habitude
    //  */
    // static bulkNormalise(habitudeItems: object[]): Habitude[] {
    //     const habitudes: Habitude[] = [];

    //     return habitudes;
    // }
    // Les méthodes de créations des habitudes
    /**
     * Cette fonction s'occupe de creer une nouvelle habitude dans la collection
     * @param idUser Indique l'identifiant de l'uilisateur qui crée l'habitude
     * @param habitude object qui représente l'habitude que l'on souhaite créer
     * @returns un object qui représente l'habitude qui vient d'etre crée
     */
    static async create(idUser : string , habitude : Habitude) {
        return (await Habitude.collection(idUser).add(habitude)).id;
    }
    /**
     * Cette fonction s'occupe de creer un ensemble d'habitude dans la collection
     * @param idUser Indique l'identifiant de l'uilisateur qui crée les habitudes
     * @param habitudes tableau d'object qui représente les habitudes que l'on souhaite créer
     * @returns un tableau d'object qui représente les habitudes qui viennent d'etre crée
     */
    static async bulkCreate(idUser: string, habitudes: Habitude[]): Promise<any> {
        const bulk = this.bulk(idUser);
        habitudes.forEach((h)=> bulk.set(Habitude.collection(idUser).doc(), h))
        return await bulk.commit();
    }

    // Les méthodes de récupération des habitudes
    /**
     * Cette s'occupe de récupérer une habitude à partir de son identifiant
     * @param idUser Indique l'identifiant de l'uilisateur dont on veut récuperer l'habitude
     * @param idHabitude Indique l'identifiant de l'habitude que l'on souhaite
     * récuperer
     * @returns un object qui représente l'habitude que l'on a 
     * récupérer
     */
    static async getById(idUser : string,idHabitude : string) {
        return (await Habitude.collection(idUser).doc(idHabitude).get()).data();
    }
    /**
     * Cette fonction s'ocupe d'effectuer les requêtes de l'utilisateur
     * @param query un objet représentant la requête de l'utilisateur
     * @returns 
     */
    static async query(idUser: string, query: query) {
        const habitudes: Habitude[] = [];
        (await this.collection(idUser).where(query.attribut, query.operateur, query.valeur).get()).docs.forEach((d) => { habitudes.push(d.data()) })
        return habitudes;
    }
    /**
     * Cette s'occupe de récupérer toute les habitudes d'un utilisateur
     * @param idUser Indique l'identifiant de l'uilisateur dont on veut récuperer les habitudes
     * @returns un tableau d'object qui représente les habitude que l'on a
     * récupérer
     */
    static async getAllOfUser(idUser: string) {
        const habits : Habitude[] = [];
        (await Habitude.collection(idUser).get()).docs.forEach((d) => { habits.push(d.data())});
        return habits;
    }
    // Méthodes de mises à jour des habitudes
    /**
     * Cette fonction s'occupe de modifer une habitude d'un utilisateur
     * @param idUser Indique l'identifiant de l'uilisateur dont on veut modifier l'habitude
     * @param habitude object qui représente l'habitude à modifier
     * @returns object qui représente l'habitude qui a été modifiée
     */
    static async update(idUser : string, habitude : Habitude ) : Promise<any> {

        return Habitude.collection(idUser).doc(habitude.id as string).update(habitude)
    }
    /**
     * Cette fonction s'occupe de modifer un ensemble d'habitudes d'un utilisateur
     * @param idUser Indique l'identifiant de l'uilisateur dont on veut modifier les habitudes
     * @param habitudes tabeleau d'object qui représente les habitudes à modifier
     * @returns un tableau d'objects qui représente les habitudes qui ont été modifiée
     */
    static async bulkUpdate(idUser: string, habitudes : Habitude[]): Promise<any> {
        const bulk = this.bulk(idUser);
        habitudes.forEach((h)=> { bulk.update(Habitude.collection(idUser).doc(h.id as string), h) })
    }
    // /**
    //  * Cette fonction s'occupe de modifer toute les habitudes d'un utilisateur
    //  * @param idUser Indique l'identifiant de l'uilisateur dont on veut modifier l'habitude
    //  * @param champ object qui représente les champs à modifier
    //  * @returns tableau d'object qui représente les habitudes qui ont a été modifiée
    //  */
    // static updateAllOfUser(idUser: string, champ: object): Habitude[] {
    //     throw("Not Implemented");
    // }
    // les méthodes de suppression des habitudes 
    /**
     * Cette fonction s'occupe de supprimer une habitude d'un utilisateur
     * @param idUser Indique l'identifiant de l'utilisateur dont on souhaite
     * supprimer l'habitude
     * @param idHabitude Indique l'identifiant de l'habitude qui doit etre
     * supprimé
     * @returns un object représentant l'habitude qui a été supprimés
     */
    static async delete(idUser : string, idHabitude : string) : Promise<any> {
       return await Habitude.collection(idUser).doc(idHabitude).delete(); 
    }
    /**
     * Cette fonction s'occupe de supprimer un ensemble d'habitudes d'un utilisateur
     * @param idUser Indique l'identifiant de l'utilisateur dont on souhaite
     * supprimer les habitudes
     * @param idsHabitude un tableau qui contient les identifiants des habitudes 
     * qui doivent etre supprimées
     * @returns un tableau d'object représentant les habitudes qui ont été supprimés
     */
    static async bulkDelete(idUser: string, idsHabitude: string[]) {
        const bulk = this.bulk(idUser);
        idsHabitude.forEach((idh) => { bulk.delete(Habitude.collection(idUser).doc(idh)) })
        return  await bulk.commit();
    }
    /**
     * Cette fonction s'occupe de supprimer tutes les habitudes d'un utilisateur
     * @param idUser Indique l'identifiant de l'utilisateur dont on souhaite
     * supprimer l'habitude
     * @returns un tableau d'object représentant les habitudes qui ont été supprimés
     */
    static async deleteAllOfUser(idUser: string){
        return await Habitude.collection(idUser).firestore.recursiveDelete(Habitude.collection(idUser))
    }

    /**
     * Cette fonction s'occupe de récuperer la référence de la collection habitude
     * @param idUser Indique l'identifiant de l'utilisateyr
     * @returns 
     */
    private static collection (idUser : string) {
        return userRef(idUser).collection(Habitude.collectionName).withConverter(this.converter);
    }
    /**
     * Dis si l'object est une habitude ou pas
     * @param item Représente l'object dont on souhaite savoir si c'est une habitude ou pas
     * @returns 
     */
    static isHabitude(item : any): item is Habitude {
        return ( "rappel" in item && "done" in item);
    }  
    /**
     * Représente le convertisseur de données entre firestore et l'api
     */
    static converter: FirebaseFirestore.FirestoreDataConverter<Habitude> = {
        toFirestore: function (modelObject: Habitude): FirebaseFirestore.DocumentData {
            delete modelObject.id;
            return modelObject
        },
        fromFirestore: function (snapshot: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>): Habitude {
            const data = snapshot.data();
            const id = snapshot.id
            return Habitude.normalize({ id: id, ...data })
        }
    }
    /**
     * 
     * @returns un object qui permet de faire des opéations multiples
     */
    private static bulk(idUser: string) {
        return this.collection(idUser).firestore.batch();
    }
}