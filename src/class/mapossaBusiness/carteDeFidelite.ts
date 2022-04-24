import { dataBase, ISystemData /*, userRef  */} from "../@interface";
import { query } from "../@type";

export default class CarteDeFidelite implements ISystemData {
    constructor() { }
    /**
     * Indique le nom de la collection contenant les cartes de fidelités
     */
    public static readonly collectionName: string = "cartesDeFidelite";
    /**
     * Indique l'identifiant de la carte de fidelité
     */
    id: string | undefined;
    /**
     * Représentation de la date à la quelle la carte a été crée
     */
    createDate: Date = new Date();
    /**
     * Représentation de la derniere date de mise à jour
     */
    updateDate: Date = new Date();
    /**
     * Indique le nom de la carte de fidelité
     */
    nom: string | undefined;
    /**
     * Indique l'identifiant de l'entreprise à qui appartient la
     * carte de fidelité
     */
    idEntreprise: string | undefined;
    /**
     * Représente le logo ou l'image de la carte de fidelité
     */
    logo: string | undefined;
    /**
     * Indique la description de la carte de fidelité
     */
    description: string | undefined;
    /**
     * Indique l'url vers la photo de couverture de la carte
     * defidelité
     */
    couverture: string | undefined;
    /**
     * Indique la catégorie de la carte de fidelité
     */
    categorie: string | undefined;
    /**
     * Tableau contenant les identifiants des utilisateurs ayant souscrit à la carte de fidelité
     */
    subscribers?: string[];
    /**
     * Indique le nombre maximale de coupon qui peuvent découler de cette carte
     * de Fidelité
     */
    
    maxCoupon: number = Number.POSITIVE_INFINITY;
    /**
     * Indique le nombre de coupon qui ont été consommé de
     * la carte de fidelité
     */
    couponConsomme: number = 0;

    static normalize(cdf: any) {
        const carte = new CarteDeFidelite();
        if ("id" in cdf) carte.id = cdf.id;
        if ("nom" in cdf) carte.nom = cdf.nom;
        if ("description" in cdf) carte.description = cdf.description;
        if ("logo" in cdf) carte.logo = cdf.logo;
        if ("idEntreprise" in cdf) carte.idEntreprise = cdf.idEntreprise;
        if ("couverture" in cdf) carte.couverture = cdf.couverture;
        if ("categorie" in cdf) carte.categorie = cdf.categorie;
        if ("maxCoupon" in cdf) carte.maxCoupon = cdf.maxCoupon;
        if ("couponConsomme" in cdf) carte.couponConsomme = cdf.couponConsomme;
        return carte;
    }

    /**
     * Cette focntion s'occupe de créer une nouvelle carte de fidelité
     * @param carteDeFidelite Object qui représente la carte de fidelité que l'on souhaite
     * créer
     */
    static async create(carteDeFidelite: any) {
        return (await this.collection().add(carteDeFidelite)).id;
    }
    /**
     * Cette fonction s'occupe de créer un ensemble de cartes de fidelités
     * @param carteDeFidelites tableau d'object représentant les cartes de
     * fidelités que l'on souhaite créer
     * @returns 
     */
    static async bulkCreate(carteDeFidelites: object[]) {
        const bulk = this.bulk();
        carteDeFidelites.forEach((c) => { bulk.set(this.collection().doc(), c) });
        return await bulk.commit();
    }
    /**
     * Cette fonction récupére une carte de fidelité en particulier
     * grâce à son identifiant
     * @param idCDF Indique l'identifiant de la carte de fidelité
     * que l'on souhaite récupérer
     * @returns 
     */
    static async getById(idCDF: string) {
        return (await this.collection().doc(idCDF).get());
    }
    /**
     * Cette fonction s'ocupe d'effectuer les requêtes de l'utilisateur
     * @param query un objet représentant la requête de l'utilisateur
     * @returns 
     */
    static async query(query : query) {
        const cartes : CarteDeFidelite[] = [];
        (await this.collection().where(query.attribut, query.operateur, query.valeur).get()).docs.forEach((d) => { cartes.push(d.data())})
        return cartes;
    }
    /**
     * Cette fonction s'occupe de renvoyer toutes les cartes de fidelité existantes
     * @returns 
     */
    static async getAll() {
        const cartes : CarteDeFidelite[] = [];
       (await this.collection().get()).docs.forEach((d)=> {cartes.push(d.data())})
        return cartes;
    }
    /**
     * Cette foncion s'occupe de modifier une carte de fodelité
     * @param carteDeFidelite Object qui représente la carte de fidelité que l'on 
     * souhaite modifier
     * @returns 
     */
    static async update(carteDeFidelite: CarteDeFidelite) {
        return this.collection().doc(carteDeFidelite.id as string).update(carteDeFidelite)
    }
    /**
     * Cette fonction permet de modifier un grand nombre de
     * cartes de fidelités
     * @param cdfs Tableau qui représente les cartes de fidelités
     * que l'on souhaite modifier
     * @returns 
     */
    static async bulkUpdate(cdfs: CarteDeFidelite[]) {
        const bulk = this.bulk();
        cdfs.forEach((cdf) => { bulk.update(this.collection().doc(cdf.id as string), cdf) });
        return bulk.commit();
    }
    /**
     * Cette fonction permet de supprimer une carte de fidelité
     * à partir de son identifiant
     * @param idCDF indique l'identifian de la carte de fidelité que 
     * l'on souhaite supprimer
     * @returns 
     */
    static async delete(idCDF: string) {
        return await this.collection().doc(idCDF).delete();
    }
    static async bulkDelete(idsCDF: string[]) {
        const bulk = this.bulk();
        idsCDF.forEach((idcdf) => { bulk.delete(this.collection().doc(idcdf)) });
        return bulk.commit();
    }
    /**
     * Donne la référence de la collection carte de fidelité dans
     * la collection de firestore
     * @returns 
     */
    private static collection() {
        return dataBase.collection(this.collectionName).withConverter(this.converter);
    }
    /**
     * 
     * @returns un object qui permet de faire des opéations multiples
     */
    private static bulk() {
        return this.collection().firestore.batch();
    }
    /**
     * Cette fonction dit si un object est une carte de fidelité ou pas
     * @param item l'object dont on souhaite savoir s'il s'agit d'une
     * carte de fidelité ou pas
     * @returns 
     */
    static isCarteDeFidelite(item: any): item is CarteDeFidelite {
        return ("idEntreprise" in item && "logo" in item);
    }
    /**
     * Cette fonction s'occupe d'abonner un utilisateur à une carte de 
     * Fidelité
     * @param idUser Indique l'identifiant de l'utilisateur qui souhaite 
     * s'abooner à la cate de fidelité
     * @param idCDF Indique l'identifiant de la carte de fidelité à la quelle
     *  l'utilisateur souhaite s'aboner
     * @returns 
     */
    static async abonnement(idUser: string, idCDF: string) {
        /*let cdf = await this.getById(idCDF) as CarteDeFidelite;
        delete cdf.id;
        return await userRef(idUser).collection(this.collectionName).withConverter(this.converter).doc(idCDF).set(cdf);
        */
    }
    /**
     * Cette fonction s'occupe de desabonner un utilisateur à une carte de
     * Fidelité
     * @param idUser Indique l'identifiant de l'utilisateur qui souhaite
     * se desabonner à la cate de fidelité
     * @param idCDF Indique l'identifiant de la carte de fidelité à la quelle
     *  l'utilisateur souhaite se desabonner
     * @returns
     */
    static async desabonnement(idUser: string, idCDF: string) {
        //return await userRef(idUser).collection(this.collectionName).doc(idCDF).delete();
    }
    /**
     * Représente le convertisseur de données entre firestore et l'api
     */
    static converter: FirebaseFirestore.FirestoreDataConverter<CarteDeFidelite> = {
        toFirestore: function (modelObject: CarteDeFidelite): FirebaseFirestore.DocumentData {
            delete modelObject.id;
            return {...modelObject}
        },
        fromFirestore: function (snapshot: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>): CarteDeFidelite {
            const data = snapshot.data();
            const id = snapshot.id
            return CarteDeFidelite.normalize({ id: id, ...data })
        }
    }
}