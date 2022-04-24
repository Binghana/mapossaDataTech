
import { dataBase, ISystemData, userRef } from "../@interface";
import { cible, query, typeOffre } from "../@type";
import CarteDeFidelite from "./carteDeFidelite";
import Produit from "./produit";

export interface Coupon {
    offre : Offre
    idCommande : string
    emeteur? : string
    recepteur? : string
}
export interface Recompense {
    type : typeRecompense
    valeur : number | Produit
}
export type typeRecompense = Reduction | "Cadeau" ;
export type Reduction = "Reduction fixe" | "Reduction %";

export default class Offre implements ISystemData {

    constructor(){};
    /**
     * Indique le nom de la collection dans la quelle est contenues les 
     * offres
     */
    public static readonly collectionName = "offres";
    /**
     * Indique l'identifian de l'offre dans la collection
     */
    id?: string  ;
    /**
     * Représentation de la date à laquelle l'offre a été créee
     */
    createDate: Date = new Date();
    /**
     * Représentation de la dernière date de mise à jour de l'offre
     */
    updateDate: Date = new Date();
    /**
     * Indique le nom de l'offre
     */
    nom : string |undefined;
    /**
     * Indique le titre de l'offre
     */
    titre : string | undefined;
    /**
     * La desciption de l'offre
     */
    description : string| undefined;
    /**
     * Indique les urls des photos de l'offre
     */
    photos : string[] = [];
    /**
     * Indique la date à laquelle l'offre se termine
     */
    dateEcheance : Date | undefined;
    /**
     * Indique les cibles de l'offres
     */
    cible : cible = "Tout le monde";
    /**
     * Représente le type de l'offre
     */
    type : typeOffre = "Spontanné"; // offre commerciale
    /**
     * Représente la récompense de l'offre
     */
    recompense : Recompense = {"type" : "Reduction fixe" , valeur : 0}
    /**
    * Tableau contenant les identifiants des utilisateurs ayant souscrit à la carte de fidelité
    */
    subscribers?: string[];
    /**
     * Indique le nombre maximum de coupon pouvant dériver de cette récompense
     */
    
    maxCoupon : number  = Number.POSITIVE_INFINITY;
    /**
     * Cette fonction s'occupe de transformer un object en offre
     * @param item L'object que l'on veut transaformer en offre
     */
    static normalize(item : any) {
        const offre = new Offre();

        if("id" in item) offre.id = item.id;
        if("nom" in item) offre.nom = item.nom ;
        if("titre" in item ) offre.titre = item.titre;
        if("description" in item) offre.description = item.desciption;
        if("photos" in item) offre.photos = item.photos;
        if("dateEcheance" in item) offre.dateEcheance = item.dateEcheance;
        if("cible" in item) offre.cible = item.cible;
        if("type" in item ) offre.type = item.type;

        return offre;
    }
    /**
     * Cette fonction s'occupe de créer une offre de fidelité
     * @param idCDF Indique l'identifiant de la carte de fidelité
     * @param offre Un object qui représente l'offre que l'on souhaite
     * Créer
     * @returns 
     */
    static async create( idCDF : string ,offre : Offre) {
        return (await this.collection(idCDF).add(offre)).id;
    }
    /**
     * Cette fonction s'occupe de créer un certains nombre d'offres
     * à la fois
     * @param idCDF Indique l'identifiant de la carte de fidelité de 
     * L'offre
     * @param offres Tableau d'object contenant les offres que l'on souhaite créer
     * @returns 
     */
    static async bulkCreate ( idCDF : string, offres : object[]) {
        const bulk = this.bulk(idCDF);
        offres.forEach((o)=> { bulk.set(this.collection(idCDF).doc(), o) });
        return await bulk.commit();
    }
    /**
     * Cette fonction s'occupe de récuperer une offre à partir de son
     * identifiant
     * @param idCDF Indique l'identifiant de la carte de fidelité de
     * L'offre
     * @param idOffre Indique l'identifiant de l'offre que l'on souhaite 
     * récupérer
     * @returns 
     */
    static async getById( idCDF : string, idOffre : string) {
        return (await this.collection(idCDF).doc(idOffre).get()).data();
    }
    /**
     * Cette fonction s'ocupe d'effectuer les requêtes de l'utilisateur
     * @param query un objet représentant la requête de l'utilisateur
     * @returns 
     */
    static async query(idCDF : string,query: query) {
        const offres: Offre[] = [];
        (await this.collection(idCDF).where(query.attribut, query.operateur, query.valeur).get()).docs.forEach((d) => { offres.push(d.data()) })
        return offres;
    }
    /**
     * Cette fonction s'occupe de récupérer toutes les offres
     * d'une carte de fidelité
     * @param idCDF Indique l'identifiant de la carte de fidelité de
     * L'offre
     * @returns 
     */
    static async getAll( idCDF : string ) {
        const offres : Offre[] = [];
        (await this.collection(idCDF).get()).docs.forEach((d)=> { offres.push(d.data())});
        return offres;
    }
    /**
     * Cette fonction s'occupe de modifer une offre
     * @param idCDF Indique l'identifiant de la carte de fidelité de
     * L'offre
     * @param offre object représentant l'offre que l'on souhaite modifer
     * @returns 
     */
    static async update( idCDF : string , offre : Offre) {
        return await this.collection(idCDF).doc(offre.id as string).update(offre);
    }
    /**
     * Cette fonction s'occupe de mettre à jour un certains nombres
     * d'offre d'une carte de fidelité
     * @param idCDF Indique l'identifiant de la carte de fidelité de
     * L'offre
     * @param offres Tableau d'ojects représentant les offres qui doivent 
     * etre mise à jour
     * @returns 
     */
    static async bulkUpdate( idCDF : string, offres : Offre[]) {
        const bulk = this.bulk(idCDF);
        offres.forEach((o)=>  { bulk.update(this.collection(idCDF).doc(o.id as string), o)});
        return await bulk.commit();
    }
    /**
     * Cette fonction s'occupe de supprimer une offre d'une carte de fidelité
     * @param idCDF Indique l'identifiant de la carte de fidelité de
     * L'offre
     * @param idOffre Indique l'identifiant de l'offre que l'on
     * souhaite supprimer
     * @returns 
     */
    static async delete (idCDF : string, idOffre : string) {
        return await this.collection(idCDF).doc(idOffre).delete();
    }
    /**
     * Cette fonction s'occupe de supprimer certaines offres d'une carte de fidelités
     * @param idCDF Indique l'identifiant de la carte de fidelité de
     * L'offre
     * @param idsOffre Tableau contenant les identifiant des offres à 
     * supprimer
     * @returns 
     */
    static async bulkDelete ( idCDF : string , idsOffre : string[]) {
        const bulk = this.bulk(idCDF);
        idsOffre.forEach((ido)=> { bulk.delete(this.collection(idCDF).doc(ido)) });
        return await bulk.commit();
    }
    /**
     * Cette fonction s'occupe de supprimer toutes les offres 
     * d'une carte de fidelité
     * @param idCDF Indique l'identifiant de la carte de fidelité de
     * L'offre
     * @returns 
     */
    static async deleteAll ( idCDF : string) {
        return await this.collection(idCDF).firestore.recursiveDelete(this.collection(idCDF));
    }
    /**
     * Renvi la reférence de l'offre
     * @param idCDF Indique l'identifiant de la carte de fidelité
     * de l'offre
     * @returns 
     */
    private static collection (idCDF : string){
       return  dataBase.collection(CarteDeFidelite.collectionName).doc(idCDF).collection(this.collectionName).withConverter(this.converter)
    }
    /**
     * Cette fonction dit si l'object est une offre ou pas
     * @param item L'object que l'on souhaite vérifier si c'est une offre
     * @returns 
     */
    static isOffre(item : object) : item is Offre {
        return ( "cible" in item && "photos" in item );
    }
    /**
     * Cette fonction ajoute une offre d'une carte de fidelité parmi celle de l'utilisateur
     * @param idUser Indique l'identifian de l'utilisateur
     * @param idCDF Idique l'identifiant de la carte de fidelité
     * @param idOffre indique l'identifiant de l'offre
     * @returns 
     */
    static async activation ( idUser : string , idCDF : string , idOffre : string) {
        let offre = await this.getById(idCDF, idOffre) as Offre;
        offre.subscribers?.push(idUser);
        await Offre.update(idCDF, offre);
        delete offre.id;
        await userRef(idUser).collection(CarteDeFidelite.collectionName).doc(idCDF).collection(this.collectionName).withConverter(this.converter).doc(idOffre).set(offre);

    }
    /**
     * Cette fonction enlève une offre d'une carte de fidelité parmi celle de l'utilisateur
     * @param idUser Indique l'identifian de l'utilisateur
     * @param idCDF Idique l'identifiant de la carte de fidelité
     * @param idOffre indique l'identifiant de l'offre
     * @returns
     */
    static async desactivation(idUser: string, idCDF: string, idOffre: string) {
        return await userRef(idUser).collection(CarteDeFidelite.collectionName).doc(idCDF).collection(this.collectionName).withConverter(this.converter).doc(idOffre).delete();
    }
    /**
     * Représente le convertisseur de données entre firestore et l'api
     */
    static converter: FirebaseFirestore.FirestoreDataConverter<Offre> = {
        toFirestore: function (modelObject: Offre): FirebaseFirestore.DocumentData {
            delete modelObject.id;
            return modelObject
        },
        fromFirestore: function (snapshot: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>): Offre {
            const data = snapshot.data();
            const id = snapshot.id
            return Offre.normalize({ id: id, ...data })
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