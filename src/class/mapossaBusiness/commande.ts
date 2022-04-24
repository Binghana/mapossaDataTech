import { logger } from "firebase-functions/v1";
import { dataBase, ISystemData, userRef } from "../@interface";
import { etat, query } from "../@type";
import Client from "./client";
import IntentionEncaissement from "./intentionEncaissement";
import { Coupon } from "./offre";
import Produit from "./produit";

/**
 * Rerpésentation d'un produit commandé
 */
export type produitCommande = {
    produit: Produit,
    quantite: number
}

/**
 * Rerpésentation des différents étas possible d'une commande
 */
export type etatCommande = "Initié" | "Envoyé" | "Livré" | etat;
/**
 * Représentation d'une commande de produits émise par un vendeur
 */
export default class Commande implements ISystemData {

    constructor(poduits: produitCommande[], client: Client) {
        this.produits = poduits;
        this.client = client;
    };
    /**
     * Indique le nom de la collection dans laquelles sont stockées
     * Les commandes
     */
    static readonly collectionName: string = "commandes";
    /**
     * Indique l'identifiant de la commande
     */
    id?: string;
    /**
     * Indique la date de création de la commande
     */
    createDate: Date = new Date();
    /**
     * Indique la dernière date de mise à jour de la commande
     */
    updateDate: Date = new Date();
    /**
     * Indique les produits de la commandes
     */
    produits: produitCommande[] = [];
    /**
     * Indique le coupon dont bénéficie la commande
     */
    coupon?: Coupon;
    /**
     * Indique le montant de la commande
     */
    montant: number = 0;
    /**
     * Indique le montant final de la commande 
     * Est présent uniquement lorsque la commande bénéficie d'un coupon
     */
    montantFinal?: number;
    /**
     * Indique la descriotion de la commande
     */
    description?: string;
    /**
     * Représente le client à qui on va livrer la commande
     */
    client: Client;
    /**
     * Indique l'état de la commande actuel
     */
    etat: etatCommande = "Initié"
    /**
     * Cette fonction recalcule le montant de la commande ainsi
     * 
     */
    setUp() {
        this.montant = 0;
        this.produits.forEach((p) => { this.montant += p.produit.prix * p.quantite })
        this.applyCoupon();
    }
    /**
     * Cette fonction s'occupe d'apliquer le coupon à la commande
     */
    applyCoupon() {
        if (!this.coupon) throw new Error("Impossible d'applicquer le coupon car il es absent");
        if (this.coupon.offre.recompense.type == "Reduction fixe") {
            this.montantFinal = this.montant - (this.coupon.offre.recompense.valeur as number);
        } else if (this.coupon.offre.recompense.type == "Reduction %") {
            this.montantFinal = this.montant - this.montant * (this.coupon.offre.recompense.valeur as number) / 100;
        } else if (this.coupon.offre.recompense.type == "Cadeau") {
            this.montantFinal = this.montant;
            console.info("Le bénéficaire du coupon a un cadeau");
        }
        throw new Error("Le type de La récompense du coupon est incorrect veuillez le vérifier");
    }
    /**
    * Indique si l'object est une commande ou pas
    * @param item Object que l'on souhaite savoir si c'est une commande
    */
    static isCommande(item: any): item is Commande {
        return ("produits" in item && "montant" in item && "client" in item && "etat" in item);
    }
    /**
     * Cette fonction s'occupe de transformer un object représentant une commabde
     * venant de la base de données en une commande
     * @param item Représente l'object de la base de données que l'on souhaite
     * transformer en commande
     * @returns 
     */
    static normalize(item: any): Commande {
        if (!Commande.isCommande(item)) throw new Error("Impossible de normaliser l'object car il n'est pas la réprésentation d'une commande");
        const commande = new Commande(item.produits, item.client);

        if ("id" in item) commande.id = item.id;
        if ("description" in item) commande.description = item.description;
        if ("etat" in item) commande.etat = item.etat;
        if ("montant" in item) commande.montant = item.montant;

        if ("montantFinal" in item) commande.montantFinal = item.montantFinal;
        if ("coupon" in item) commande.coupon = item.coupon;

        return commande;
    }
    /**
     * Représente le convertisseur de données entre firestore et l'api
     */
    static converter: FirebaseFirestore.FirestoreDataConverter<Commande> = {
        toFirestore: function (modelObject: Commande): FirebaseFirestore.DocumentData {
            delete modelObject.id;
            return modelObject
        },
        fromFirestore: function (snapshot: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>): Commande {
            const data = snapshot.data();
            const id = snapshot.id;
            return Commande.normalize({ id: id, ...data });
        }
    }
    /**
     * Cette fonction envoi une commande au client , 
     * Crée l'intention d'encaissement lié
     * Attend la validation du client
     * Le tout dans une transaction
     * @param idVendeur 
     */
    async envoyer(idVendeur: string) {
        // On récuprére d'abord le chemin d'accès vers la commande
        const thisRef = Commande.collection(idVendeur).doc(this.id as string);
        //On crée alors l'intention d'encaissement
        const cashIntent = {
            "idAcheteur": this.client.id as string,
            "idVendeur": idVendeur,
            // le context de l'intention d'ecaissement est la commande
            "context": { ...this },
            // le montant de l'intention d'ecaissement est celui de la commande
            "montant": this?.montant
        }
        if (!IntentionEncaissement.isIE(cashIntent)) throw new Error("Ereur lors de la transaction : L'intention d'encaissement crée est invalide");
        // On enregistre l'intention d'encaissement
        logger.log("On enregistre l'intention d'encaissement")
        const intentRef = await IntentionEncaissement.create(cashIntent);
        
        try {
            // On lance la transaction de commande  
            await dataBase.collectionGroup(Commande.collectionName).firestore.runTransaction

                (async (withTransaction) => {
                    // 1. On récupère la commande 
                    logger.log("On récupère la commande avec la transaction")
                    const commande = await withTransaction.get(thisRef);
                    const cashI = await withTransaction.get(intentRef as FirebaseFirestore.DocumentReference<IntentionEncaissement>);
                    // On vérifie en effet que le document existe
                    logger.log("On vérifie en effet que le document existe")
                    if (!commande.exists)
                        throw new Error("Impossible d'envoyer La commande car elle n'existe pas");
                    // Le document existe on crée alors une intention d'encaissement du vendeur vers le client
                    logger.log("Le document existe on crée alors une intention d'encaissement du vendeur vers le client")
                    const commandeData = commande.data();
                    const cashIData = cashI.data();

                    // On l'envoi au client
                    logger.log("On l'envoi au client")
                    await IntentionEncaissement.send(IntentionEncaissement.normalize({ "id": cashI.id, ...cashIData }),withTransaction);
                    // On attend que le client valide l'intention d'encaissement
                    logger.log("On attend que le client valide l'intention d'encaissement")
                    const cancel = this.client.validate<IntentionEncaissement>(cashIntent)(async (snapshot) => {
                        // le client a éffectuer une action sur le document
                        if (snapshot.data()?.etat == "Validé") {
                            // Le client a validé l'intention d'encaissement
                            logger.log("Le client a validé l'IE");
                            //on sauvegarde la validation
                            await commandeData?.validate(idVendeur, withTransaction);
                            // et on termine la transaction
                            return Promise.resolve(commandeData);
                        }
                        return Promise.reject("Le client n'a pas validé l'inention d'encaissement");
                    });

                    setTimeout(() => {
                        // après 1 min on annule la transaction     
                        cancel();
                        return Promise.reject("Le temps d'attente a été dépassé");
                    }, 0.995 * 60 * 1000);

                });
        } catch (error) {
            logger.log("Une erreur est survenue pendant la trnsaction");
            logger.log(error);
        }
    }
    /**
     * Sauvegarde le fait que la commande a été validé
     * @param idVendeur Indique l'identifiant de celui qui a éméit la commande
     * @returns 
     */
    async validate(idVendeur: string, withTransaction?: FirebaseFirestore.Transaction) {
        this.etat == "Validé"
        if (withTransaction) Commande.update(idVendeur, this, withTransaction);
        return await Commande.update(idVendeur, this);
    }
    /**
     * Donne la référence de la collection sur firestore
     * @param idUSer Indique l'identifiant de l'utilisateur
     * @returns référence de la collection
     */
    private static collection(idUser: string) {
        return userRef(idUser).collection(this.collectionName).withConverter(this.converter);
    }
    /**
     * 
     * @param idVendeur Indique l'identifiant du vendeur émetteur de la commande
     * @returns 
     */
    private static bulk(idVendeur: string) {
        return this.collection(idVendeur).firestore.batch();
    }
    /**
     * Cette fonction s'occupe de créer une nouvelle commande
     * @param idVendeur Indique l'identifiant du vendeur émetteur de la commande
     * @param produit Object représentant le produit que l'on souhaite créer
     * @returns 
     */
    static async create(idVendeur: string, commande: Commande) {
        return await this.collection(idVendeur).doc().create(commande);
    }
    /**
     * Cette fonction s'occupe de créer un ensemble de commande
     * @param idVendeur Indique l'identifiant du vendeur du produit
     * @param commandes Tableau d'Object représentant les commandes que l'on souhaite créer
     * @returns
     */
    static async bulkCreate(idVendeur: string, commandes: Commande[]) {
        const bulk = this.bulk(idVendeur);
        commandes.forEach((c) => { bulk.create(this.collection(idVendeur).doc(), c) });
        return await bulk.commit();
    }
    /**
     * Cette fonction s'occupe de récuperer une commande à partir de son
     * identifiant
     * @param idVendeur Indique l'identifiant du vendeur
     * @param idProduit Indique l'identifiant de la commande que l'on souhaite
     * récupérer
     * @returns 
     */
    static async getById(idVendeur: string, idCommande: string) {
        return (await this.collection(idVendeur).doc(idCommande).get()).data();
    }
    /**
     * Cette fonction s'ocupe d'effectuer les requêtes de l'utilisateur
     * @param query un objet représentant la requête de l'utilisateur
     * @returns 
     */
    static async query(idVendeur: string, query: query) {
        const commandes: Commande[] = [];
        (await this.collection(idVendeur).where(query.attribut, query.operateur, query.valeur).get()).docs.forEach((c) => { commandes.push(c.data()) })
        return commandes;
    }
    /**
     * Cette fonction s'occupe de récupérer toutes les commandes d'un vendeurs
     * @param idVendeur Indique l'identifiant du vendeur
     * @returns 
     */
    static async getAll(idVendeur: string) {
        const commandes: Commande[] = [];
        (await this.collection(idVendeur).get()).docs.forEach((d) => { commandes.push(d.data()) });
        return commandes;
    }
    /**
     * Cette fonction s'occupe de modifier une commande
     * @param idVendeur Indique l'identifiant du vendeur
     * @param commande object représentant la commande que l'on souhaite modifier
     * @returns 
     */
    static async update(idVendeur: string, commande: Commande, withTransaction?: FirebaseFirestore.Transaction) {
        if (withTransaction) withTransaction.update(this.collection(idVendeur).doc(commande.id as string), commande);
        return await this.collection(idVendeur).doc(commande.id as string).update(commande);
    }
    /**
     * Cette fonction s'occupe de mettre à jour un certains nombres
     * de commande
     * @param idVendeur Indique l'identifiant du vendeur de la commande
     * @param commandes Tableau d'ojects représentant les commandes qui doivent 
     * etre mise à jour
     * @returns 
     */
    static async bulkUpdate(idVendeur: string, commandes: Commande[]) {
        const bulk = this.bulk(idVendeur);
        commandes.forEach((c) => { bulk.update(this.collection(idVendeur).doc(c.id as string), c /*{...p,"id" : null}) }*/) });
        return await bulk.commit();
    }
    /**
     * Cette fonction s'occupe de supprimer une commande d'un vendeur
     * @param idVendeur Indique l'identifiant du vendeur
     * @param idCommande Indique l'identifiant de la commnde que l'on
     * souhaite supprimer
     * @returns 
     */
    static async delete(idVendeur: string, idCommande: string) {
        return await this.collection(idVendeur).doc(idCommande).delete();
    }
    /**
     * Cette fonction s'occupe de supprimer certains nombre de commande d'un vendeur
     * @param idVendeur Indique l'identifiant du vendeur
     * @param idsProduit Tableau contenant les identifiant les commandes à supprimer
     * @returns 
     */
    static async bulkDelete(idVendeur: string, idsCommande: string[]) {
        const bulk = this.bulk(idVendeur);
        idsCommande.forEach((idc) => { bulk.delete(this.collection(idVendeur).doc(idc)) });
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