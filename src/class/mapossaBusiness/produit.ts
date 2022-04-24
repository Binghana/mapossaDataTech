import { ISystemData, userRef } from "../@interface";
import { query } from "../@type";

export default class Produit implements ISystemData {

    constructor(nom: string, prix: number) {
        this.nom = nom;
        this.prix = prix;
    };
    /**
     * Indique le nom de la collection dans laquelle est contenu les produits
     */
    static readonly collectionName : string = "produits";
    /**
     * Indique l'identifiant du produit
     */
    id: string | undefined;
    /**
     * Indique la date de création du produit
     */
    createDate: Date = new Date();
    /**
     * Indique la dernière date de mise à jour du produit
     */
    updateDate: Date = new Date();
    /**
     * Indique le nom du prosuit
     */
    nom: string;
    /**
     * Indique le prix du produit
     */
    prix: number;
    /**
     * Indique la descriotion du produit
     */
    description: string | undefined;
    /**
     * Indique la ou les catégories du produit
     */
    categories: string[] = [];
    /**
     * Indique le code personnalisée du produit
     */
    code: string | undefined;

    /**
     * Indique si l'object est un produit ou pas
     * @param item Object que l'on souhaite savoir si c'est un produit ou pas
     */
    static isProduit(item: any): item is Produit {
        return ("prix" in item && "nom" in item);
    }
    /**
     * Cette fonction s'occupe de transformer un object représentant un type
     * venant de la base de données en un produit
     * @param item Représente l'object de la base de données que l'on souhaite
     * transformer en produit
     * @returns 
     */
    static normalize(item: any): Produit {
        if (!Produit.isProduit(item)) throw new Error("Impossible de normaliser l'object car il n'est pas la réprésentation d'un produit");
        const produit = new Produit(item.nom, item.prix);

        if ("id" in item) produit.id = item.id;
        if ("description" in item) produit.description = item.description;
        if ("categories" in item) produit.categories = item.categories;
        if ("code" in item) produit.code = item.code;

        return produit;
    }
    /**
     * Représente le convertisseur de données entre firestore et l'api
     */
    static converter: FirebaseFirestore.FirestoreDataConverter<Produit> = {
        toFirestore: function (modelObject: Produit): FirebaseFirestore.DocumentData {
            delete modelObject.id;
            return modelObject
        },
        fromFirestore: function (snapshot: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>): Produit {
            const data = snapshot.data();
            const id = snapshot.id
            return Produit.normalize({ id: id, ...data })
        }
    }
    /**
     * Donne la référence de la collection sur firestore
     * @param idVendeur Indique l'identifiant du vendeur du produit
     * @returns référence de la collection
     */
    private static collection(idVendeur: string) {
        return userRef(idVendeur).collection(this.collectionName).withConverter(this.converter);
    }
    /**
     * 
     * @param idVendeur Indique l'identifiant du vendeur du produit
     * @returns 
     */
    private static bulk(idVendeur: string) {
        return this.collection(idVendeur).firestore.batch();
    }
    /**
     * Cette fonction s'occupe de créer un nouveau produit
     * @param idVendeur Indique l'identifiant du vendeur du produit
     * @param produit Object représentant le produit que l'on souhaite créer
     * @returns 
     */
    static async create(idVendeur: string, produit: Produit) {
        return await this.collection(idVendeur).doc().create(produit);
    }
    /**
     * Cette fonction s'occupe de créer un ensemble de produit
     * @param idVendeur Indique l'identifiant du vendeur du produit
     * @param produits Tableau d'Object représentant les produits que l'on souhaite créer
     * @returns
     */
    static async bulkCreate(idVendeur: string, produits: Produit[]) {
        const bulk = this.bulk(idVendeur);
        produits.forEach((p) => { bulk.create(this.collection(idVendeur).doc(), p) });
        return await bulk.commit();
    }
    /**
     * Cette fonction s'occupe de récuperer une offre à partir de son
     * identifiant
     * @param idVendeur Indique l'identifiant du vendeur
     * @param idProduit Indique l'identifiant du produit que l'on souhaite
     * récupérer
     * @returns 
     */
    static async getById(idVendeur: string, idProduit: string) {
        return (await this.collection(idVendeur).doc(idProduit).get()).data();
    }
    /**
     * Cette fonction s'ocupe d'effectuer les requêtes de l'utilisateur
     * @param query un objet représentant la requête de l'utilisateur
     * @returns 
     */
    static async query(idVendeur: string, query: query) {
        const produits: Produit[] = [];
        (await this.collection(idVendeur).where(query.attribut, query.operateur, query.valeur).get()).docs.forEach((d) => { produits.push(d.data()) })
        return produits;
    }
    /**
     * Cette fonction s'occupe de récupérer tous les produits d'un vendeurs
     * @param idVendeur Indique l'identifiant du vendeur
     * @returns 
     */
    static async getAll(idVendeur: string) {
        const produis: Produit[] = [];
        (await this.collection(idVendeur).get()).docs.forEach((d) => { produis.push(d.data()) });
        return produis;
    }
    /**
     * Cette fonction s'occupe de modifer un produit
     * @param idVendeur Indique l'identifiant du vendeur
     * @param produit object représentant le produit que l'on souhaite modifer
     * @returns 
     */
    static async update(idVendeur: string, produit: Produit) {
        return await this.collection(idVendeur).doc(produit.id as string).update(produit);
    }
    /**
     * Cette fonction s'occupe de mettre à jour un certains nombres
     * d'offre d'une carte de fidelité
     * @param idVendeur Indique l'identifiant du vendeur du produit
     * @param produits Tableau d'ojects représentant les produits qui doivent 
     * etre mise à jour
     * @returns 
     */
    static async bulkUpdate(idVendeur: string, produits: Produit[]) {
        const bulk = this.bulk(idVendeur);
        produits.forEach((p) => { bulk.update(this.collection(idVendeur).doc(p.id as string), p /*{...p,"id" : null}) }*/) });
        return await bulk.commit();
    }
    /**
     * Cette fonction s'occupe de supprimer un produit d'un vendeur
     * @param idVendeur Indique l'identifiant du vendeur
     * @param idProduit Indique l'identifiant du produit que l'on
     * souhaite supprimer
     * @returns 
     */
    static async delete(idVendeur: string, idProduit: string) {
        return await this.collection(idVendeur).doc(idProduit).delete();
    }
    /**
     * Cette fonction s'occupe de supprimer certains produits d'un vendeur
     * @param idVendeur Indique l'identifiant du vendeur
     * @param idsProduit Tableau contenant les identifiant des produits à supprimer
     * @returns 
     */
    static async bulkDelete(idVendeur: string, idsProduit: string[]) {
        const bulk = this.bulk(idVendeur);
        idsProduit.forEach((idp) => { bulk.delete(this.collection(idVendeur).doc(idp)) });
        return await bulk.commit();
    }
    /**
     * Cette fonction s'occupe de supprimer tous les produits 
     * d'un vendeur
     * @param idVendeur Indique l'identifiant du vendeur
     * @returns 
     */
    static async deleteAll(idVendeur: string) {
        return await this.collection(idVendeur).firestore.recursiveDelete(this.collection(idVendeur));
    }

}