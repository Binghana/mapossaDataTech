import * as functions from "firebase-functions";
import * as express from "express";
import { auth, handleError, scrapingMessaging } from "./class/@interface";

import Response from "./class/response";
import IntentionEncaissement from "./class/mapossaBusiness/intentionEncaissement";

import User from "./class/user";
import Transaction from "./class/mapossaSmartWallet/transaction";
import Categorie from "./class/mapossaSmartWallet/categorie";
import CompteFinancier from "./class/mapossaSmartWallet/compteFinancier";
import Habitude from "./class/mapossaSmartWallet/habitude";
import CarteDeFidelite from "./class/mapossaBusiness/carteDeFidelite";
import Offre from "./class/mapossaBusiness/offre";
import Produit from "./class/mapossaBusiness/produit";
import Commande from "./class/mapossaBusiness/commande";
import SMS from "./class/sms/SMS";
import MapossaDataTech from "./class/mapossaDataTech";
import OperateursFinanciers from "./class/operateurs/OperateursFinanciers";

import mapossaScrappingData from "./mapossaScrapping/metaData";
import ClientError from "./ErrorFromClient/ClientError";



/**
 * Représentation de l'api MapossaDataTech 
 * avec ses endpoints
 */
const mapossaDataTech = {
    users: express(),
    cartesDeFidelite: express(),
    sms: express(),
    operateurFinanciers: express(),
    logoCategories: express(),
    mapossaScrapping: express(),
    clientErrors: express(),
    scraping: express(),
};


/*************************** UTILISATEUR ****************************/
/**
 * Créer un nouvel utilisateur
 */
mapossaDataTech.users.post("/", async (request, response) => {
    try {
        const usr = await User.create(request.body);
        const userNotifToken = request.body.notificationToken;

        await Categorie.createCategorieAuto(usr.id)


        if (userNotifToken) {
            /**
         * data?: {
                [key: string]: string;
            };
            notification?: Notification;
            android?: AndroidConfig;
            webpush?: WebpushConfig;
            apns?: ApnsConfig;
            fcmOptions?: FcmOptions;
        */

            const message = {
                notification: {
                    "title": "Confirmez votre adresse email",
                    'body': "Nous vous avons envoyé un email de vérification. Consultez votre boite de réception et cliquez sur le lien pour confirmer votre adresse email."
                },
                token: userNotifToken
            }
            await scrapingMessaging.send(message)

        }


        response.status(201).send(new Response("Le compte utilisateur a été crée avec succès", false, usr));
    } catch (error) {
        handleError(error, response);
    }

});
/**
 * Récuperer un utilisateur grâce à son identifiant
 */
mapossaDataTech.users.get("/", async (request, response) => {
    try {
        if (("email" in request.query)) {
            const user = (await auth.getUserByEmail(request.query.email as string))
            const ruser = await User.getById(user.uid)
            response.send(new Response("Voici l'user id de l'utilisateur", false, ruser))
        }
        const users = await User.collection().get();
        response.send(new Response("Voici tous les utilisateurs", true, users.docs))

    } catch (error) {
        response.status(500).send(new Response("Une erreur est survenue lors de la récupération", true, error));
    }

});
/**
 * Ajouter l'idAdalo à l'utlisateur à partir de s on email
 */
mapossaDataTech.users.put("/", async (request, response) => {
    try {
        if (!("email" in request.body)) response.status(400).send(new Response("Il manque l'email de l'utilisateur dans le corps de la requête", true));
        const uid = (await auth.getUserByEmail(request.body.email)).uid;
        if (!("idAdalo" in request.body)) response.status(400).send(new Response("Il manque l'id Adalo dans le corps de la requête", true));
        const idAdalo = request.body.idAdalo;
        await User.update({ id: uid, idAdalo: idAdalo });
        response.send(new Response("l'id adalo a été inséré avec succès", false));

    } catch (error) {
        handleError(error, response)
    }

});
/**
 * Récuperer un utilisateur grâce à son identifiant
 */
mapossaDataTech.users.get("/:id", async (request, response) => {
    try {
        const res = await User.getById(request.params.id);
        if (!res.exists) response.send(new Response("L'identifiant de l'utilisateur entré n'existe pas veuillez vérifiez l'uid", true));
        response.send(new Response("Voici les informations de l'utilisateur", false, res.data()))
    } catch (error) {
        response.status(500).send(new Response("Une erreur est surveunue lors de la récupération", true, error));
    }

});
/**
 * Mettre à jour les informations d'un utilisateur
 */
mapossaDataTech.users.put("/:id", async (request, response) => {
    try {

        response.send(await User.update(User.normalize({ id: request.params.id, ...request.body })));
    } catch (error) {
        response.status(500).send(new Response("Une erreur est surveunue lors de la modification", true, error));
    }

});
/**
 * Supprimer un utilisateur
 */
mapossaDataTech.users.delete("/:id", async (request, response) => {
    try {
        response.send(await User.delete(request.params.id))
    } catch (error) {
        response.status(500).send(new Response("Une erreur est surveunue lors de la suppression de l'utilisateur", true, error));
    }

});
/*************************** FIN UTILISATEUR ****************************/

//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// DEBUT MAPOSSA SMARTWALLET ----------------------------------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

/*************************** TRANSACTION ****************************/
/**
 * Création de Transaction d'un utilisateur
 */
mapossaDataTech.users.post("/:idUser/" + Transaction.collectionName, async (request, response) => {

    const idUser = request.params.idUser;
    try {
        // Si le corps de la requête contient un tableau alors il s'agit de créer
        // plusieurs transactions à la fois
        if (("source" in request.query) && (request.query.source == "scraping")) {

            if (!("transactions" in request.body)) {
                return response.status(401).send(new Response("The 'transactions' attribute representing the scraped transactions to be saved is missing", true));
            }

            const result = await Transaction.bulkCreate(idUser, request.body.transactions);

            return response.status(200).send(new Response("The scraped transactions have been saved successfully", false, result));
        }

        if ("transactions" in request.body) {
            //  Création de plusieurs Transactions à la fois

            functions.logger.log("créons les transactions");
            await MapossaDataTech.bulkCreateTransactionAuto(request.params.idUser, request.body.transactions);

            return response.status(201).send(new Response("Les transactions ont été créees avec succès", false));
        } else {
            //  ll s'agit de créer une seule transaction 
            //  Création d'une Transaction d'un utilisateur
            if ("accountId" in request.body) {

                if ("idcomptedest" in request.headers) {
                    let ids = await MapossaDataTech.creerTransactionVirement(request.params.idUser, request.body, request.headers.idcomptedest as string)
                    return response.status(201).send(new Response("la transaction de virement a été crée avec succès", false, ids));

                } else {
                    let ids = await MapossaDataTech.creerTransaction(request.params.idUser, request.body)
                    return response.status(201).send(new Response("la transaction a été crée avec succès", false, ids));
                }

            } else {
                return response.status(403).send(new Response("Il manque le champ 'accountId' de la transaction", true));

            }
        }
    } catch (error) {
        return handleError(error, response)
    }
});
/**
 * Récupération d'une Transaction d'un utilisateur
 */
mapossaDataTech.users.get("/:idUser/" + Transaction.collectionName + "/:idTransaction", async (request, response) => {
    try {
        const transaction = await Transaction.getById(request.params.idUser, request.params.idTransaction);
        response.status(201).send(new Response("Voici la Transaction demandé", false, transaction.data()));
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/**
 * Récupération de plusieurs transactions d'un utilisateur
 */
mapossaDataTech.users.get("/:idUser/" + Transaction.collectionName, async (request, response) => {
    const idUser = request.params.idUser;
    try {
        // On regarde d'abord si on a la propriété "query" dans le header pour savoir
        // s'il s'agit de récuperer certaines transactions spécifiques
        if (("source" in request.query) && (request.query.source == "scraping-unknown")) {

            const all: any[] = (await Transaction.collection(idUser).get()).docs.map((el) => el.data());

            const allUnknow: any[] = all.filter((el) => (("alert" in el && el.alert == true) || el.typeInitial == "" || el.flux == "" || el.montant == null || ("frais" in el && el.frais == null)));

            return response.status(200).send(new Response("Here are the transactions unknown to the users", false, allUnknow))

        }
        let query: FirebaseFirestore.CollectionReference<Transaction> | FirebaseFirestore.Query<Transaction> = Transaction.collection(request.params.idUser);
        const queryParams = request.query;

        if (queryParams) {
            // si il ya des querry params

            for (const param in queryParams) {
                if (Object.prototype.hasOwnProperty.call(queryParams, param)) {
                    const value = queryParams[param];
                    console.log(query)
                    query = query.where(param, "==", value)
                    console.log(value)
                }
            }

        }

        const transactions = (await query.get()).docs;
        console.log(transactions)
        return response.status(201).send(new Response("Voici les transactions demandés", false, transactions.map((el) => el.data())))
    } catch (error) {
        return response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/**
 * Mise à jour de Transaction d'un utilisateur
 */
mapossaDataTech.users.put("/:idUser/" + Transaction.collectionName + "/:idTransaction", async (request, response) => {
    // il s'agit ici de mettre à jour une transaction d'un utilisateur
    try {
        //on vérifie bien que le corps de la requête est une transaction
        if (Transaction.isTransaction(request.body)) {
            // on met alors à jour la transaction
            const updatedTransaction = await MapossaDataTech.updateTransaction(request.params.idUser, request.body, request.params.idTransaction)
            response.status(200).send(new Response("La transaction a été mis à jour", false, updatedTransaction));
        } else {
            // il ne s'agit pas d'une transaction car il manque des attributs
            response.status(200).send(new Response("La transaction est invalide car il manque des attributs crucuax", true, {
                "obtenu": request.body,
                "attributsNecessaire": {
                    "amount": "Indique le montant de la tansaction",
                    "finalType": "Indique le type final de la transaction",
                    "accountId": "Indique l'indifiant du compte de la transaction",
                    "flux": "Indique s'il s'agit d'une transaction entrante ou sortante sur le compte",
                    "devise": "Indique la devise de la Transaction"
                },
                "conseil": "Vérifiez la transaction que vous souhaitez mettre à jour"
            }))
        }
    } catch (error) {
        handleError(error, response);
    }
});
/**
 * Mise à jour de plusieurs transactions à la fois
 */
mapossaDataTech.users.put("/:idUser/" + Transaction.collectionName, async (request, response) => {
    try {
        // on regarde si le corps de la requête est un tableau
        // pour savoir que l'on est entrain de vouloir modifier plusieurs
        // Transactions à la fois
        if (Array.isArray(request.body)) {
            // alors on modifie les transactions
            const updatedTransactions = await Transaction.bulkUpdate(request.params.idUser, request.body);
            response.status(201).send(new Response("Les transactions ont été bien modifiées", false, updatedTransactions));
        } else
        // alors on modifie toutes les transactions par les champs donées 
        {
            //const updatedTransactions = await Transaction.updateAll(request.params.idUser, request.body);
            response.status(200).send(new Response("La requête es invalide veuillez vérifier les paramètres", true, {}));
        }
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/**
 * Suppression de Transaction d'un utilisateur
 */
mapossaDataTech.users.delete("/:idUser/" + Transaction.collectionName + "/:idTransaction", async (request, response) => {
    try {
        // ici on supprime simplement la transaction dont on a l'identifiant
        const transactionDeleted = await MapossaDataTech.suprimeTransaction(request.params.idUser, request.params.idTransaction);
        response.status(200).send(new Response("La transaction a été supprimé avec succès", false, transactionDeleted));

    } catch (error) {
        handleError(error, response);
    }
});
/**
 * Supression de plusieurs Transactions d'un utilisateur
 */
mapossaDataTech.users.delete("/:idUser/" + Transaction.collectionName, async (request, response) => {
    try {

        // on regarde si dans le Header la requête on a "ids"
        // pour savoir que l'on est entrain de vouloir supprimer plusieurs
        // Transactions à la fois
        if ("ids" in request.headers) {
            // on vérifie que ids est effectivement un tableau 
            if (Array.isArray(request.headers.ids)) {
                // alors on supprime les transactions
                const deletedTransactions = await Transaction.bulkDelete(request.params.idUser, request.headers.ids);
                response.status(201).send(new Response("Les transactions ont été bien modifiées", false, deletedTransactions));
            } else {
                // il ya un problème : ids doit etre un tableau contenant les identifiant des transactions que 
                // l'on souhaite supprimer
                response.status(200).send(new Response("ids doit etre un tableau contenant les identifiant des transactions à supprimer", true, { "reçu": typeof request.headers.ids, "attendu": "Array of string" }));
            }
        } else
        // alors on soupprime toutes les transactions de l'utilisateurs 
        {
            const deletedTransactions = await Transaction.deleteAll(request.params.idUser);
            response.status(200).send(new Response("Toutes les transactions ont été supprimés avec succès", false, deletedTransactions));
        }
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/*************************** FIN TRANSACTION ****************************/
/**
 *
 */
/*************************** COMPTE FINANCIER ****************************/
/**
 * Création de Compte financier d'un utilisateur
 */
mapossaDataTech.users.post("/:idUser/" + CompteFinancier.collectionName, async (request, response) => {
    const idUser = request.params.idUser;
    try {
        // on regarde si le corps de la requête est un tableau pour savoir 
        // s'il faut créer plusieurs comptes ou pas
        if (("source" in request.query) && (request.query.source == "scraping")) {

            if (!("comptes" in request.body)) {
                return response.status(401).send(new Response("The 'comptes' attribute representing the scraped transactions to be saved is missing", true));
            }

            const result = await CompteFinancier.bulkCreate(idUser, request.body.comptes)

            return response.status(200).send(new Response("The scraped account have been saved successfully", false, result));
        }
        if ("comptes" in request.body) {
            // alors on doit créer pulsieurs comptes
            const comptesCreated = await CompteFinancier.bulkCreate(request.params.idUser, request.body);
            return response.status(201).send(new Response("Les comptes financiers ont été crées avec succès", false, comptesCreated))
        } else
        // il faut créer un seul compte
        {
            functions.logger.log("Commencons la créatoin du compte financiers");
            if (!("solde" in request.body)) response.status(400).send(new Response("Il manque le solde du compte dans le corps de la requête", true));

            let ids = await MapossaDataTech.creerCompteFinancier(request.params.idUser, request.body);

            return response.status(201).send(new Response("Le compte financier a été crée avec succès", false, ids))
        }

    }

    catch (error) {
        return handleError(error, response)
    }
});

/**
 * Récupération d'un certains nombre de Comptes d'un utilisateur
 */
mapossaDataTech.users.get("/:idUser/" + CompteFinancier.collectionName, async (request, response) => {
    const idUser = request.params.idUser;
    try {
        // On regarde d'abord si on a la propriété "query" dans le header pour savoir
        // s'il s'agit de récuperer certaines comptes spécifiques
        // On regarde d'abord si on a la propriété "query" dans le header pour savoir
        // s'il s'agit de récuperer certaines transactions spécifiques

        if (("source" in request.query) && (request.query.source == "scraping")) {


            const result = (await CompteFinancier.collection(idUser).where("isAuto", "==", true).get()).docs;

            return response.status(200).send(new Response("Here is the scraped account ", false, result));
        }
        let query: FirebaseFirestore.CollectionReference<CompteFinancier> | FirebaseFirestore.Query<CompteFinancier> = CompteFinancier.collection(request.params.idUser);
        const queryParams = request.query;

        if (queryParams) {
            // si il ya des querry params

            for (const param in queryParams) {
                if (Object.prototype.hasOwnProperty.call(queryParams, param)) {
                    const value = queryParams[param];
                    query = query.where(param, "==", value)
                    console.log(param)
                    console.log(value)
                }
            }

        }

        const comptes = (await query.get()).docs;

        return response.status(201).send(new Response("Voici les Comptes demandés", false, comptes.map((el) => el.data())));
    } catch (error) {
        return response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/**
 * Récupération d'un compte
 */
mapossaDataTech.users.get("/:idUser/" + CompteFinancier.collectionName + "/:idCompte", async (request, response) => {
    try {
        const compte = await CompteFinancier.getById(request.params.idUser, request.params.idCompte);
        response.status(201).send(new Response("Voici le compte demandé", false, compte.data()));
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/**
 * Mise à jour d'un Compte d'un utilisateur
 */
mapossaDataTech.users.put("/:idUser/" + CompteFinancier.collectionName + "/:idCompte", async (request, response) => {
    // il s'agit ici de mettre à jour un compte Financier d'un utilisateur
    try {
        //on vérifie bien que le corps de la requête est un compte financier
        if (CompteFinancier.isCompteFinancier(request.body)) {
            // on met alors à jour le compte
            const ids = await MapossaDataTech.modifierCompteFinancier(request.params.idUser, { ...request.body, id: request.params.idCompte });
            response.status(200).send(new Response("Le compte a été mis à jour", false, ids));
        } else {
            // il ne s'agit pas d'un compte financier car il manque des attributs
            response.status(200).send(new Response("Le compte financier est invalide car il manque des attributs crucuax", true, {
                "obtenu": request.body,
                "attributsNecessaire": {
                    "solde": "Indique le solde du compte"
                },
                "conseil": "Vérifiez le compte que vous souhaitez mettre à jour"
            }))
        }
    } catch (error) {
        handleError(error, response);
    }
});
/**
 * Mise à jours de plusieurs Comptes de l'utilisateur à la fois
 */
mapossaDataTech.users.put("/:idUser/" + CompteFinancier.collectionName, async (request, response) => {
    try {
        // on regarde si le corps de la requête est un tableau
        // pour savoir que l'on est entrain de vouloir modifier plusieurs
        // comptes à la fois
        if (Array.isArray(request.body)) {
            // alors on modifie les comptes
            const updatedComptes = await CompteFinancier.bulkUpdate(request.params.idUser, request.body);
            response.status(201).send(new Response("Les comptes ont été bien modifiées", false, updatedComptes));
        } else
        // alors on modifie tous les comptes par les champs donées 
        {
            //const updatedComptes = await Transaction.updateAll(request.params.idUser, request.body);
            response.status(200).send(new Response("La requête es invalide veuillez vérifier les paramètres", true, {}));
        }
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});

/**
 * Suppression d'un Compte d'un utilisateur
 */
mapossaDataTech.users.delete("/:idUser/" + CompteFinancier.collectionName + "/:idCompte", async (request, response) => {
    try {
        // ici on supprime simplement le compteFinancier dont on a l'identifiant
        const compteDeleted = await CompteFinancier.delete(request.params.idUser, request.params.idCompte);
        response.status(200).send(new Response("Le compte a été supprimé avec succès", false, compteDeleted));

    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/**
 * Supression d'un certains nombre de comptes financiers d'un utilisateur
 */
mapossaDataTech.users.delete("/:idUser/" + CompteFinancier.collectionName, async (request, response) => {
    try {

        // on regarde si dans le Header la requête on a "ids"
        // pour savoir que l'on est entrain de vouloir supprimer plusieurs
        // Comptes financiers à la fois
        if ("ids" in request.headers) {
            // on vérifie que ids est effectivement un tableau 
            if (Array.isArray(request.headers.ids)) {
                // alors on supprime les comptes
                const deletedComptes = await CompteFinancier.bulkDelete(request.params.idUser, request.headers.ids);
                response.status(201).send(new Response("Les comptes financiers ont été bien supprimées", false, deletedComptes));
            } else {
                // il ya un problème : ids doit etre un tableau contenant les identifiant des comptes que 
                // l'on souhaite supprimer
                response.status(200).send(new Response("ids doit etre un tableau contenant les identifiant des comptes à supprimer", true, { "reçu": typeof request.headers.ids, "attendu": "Array of string" }));
            }
        } else
        // alors on soupprime tous les comptes financiers de l'utilisateur
        // puisqu'il n'y a pas de spécification
        {
            const deletedComptes = await CompteFinancier.deleteAll(request.params.idUser);
            response.status(200).send(new Response("Toutes les comptes ont été supprimés avec succès", false, deletedComptes));
        }
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});

/*************************** FIN COMPTE FINANCIER ****************************/
/**
 *
 */
/*************************** CATEGORIE ****************************/
/**
 * Création d'une Categorie d'un utilisateur
 */
mapossaDataTech.users.post("/:idUser/" + Categorie.collectionName, async (request, response) => {

    try {
        // on regarde si le corps de la requête est un tableau pour savoir 
        // s'il faut créer plusieurs catégories ou pas
        if (Array.isArray(request.body)) {
            // alors on doit créer pulsieurs catégories
            const catégoriesCreated = await Categorie.bulkCreate(request.params.idUser, request.body);
            response.status(201).send(new Response("Les catégories ont été crées avec succès", false, catégoriesCreated))
        } else
        // il faut créer une seul catégorie
        {

            let id = await MapossaDataTech.createCategorie(request.params.idUser, request.body);
            response.status(201).send(new Response("La catégorie a été crée avec succès", false, { id: id }))
        }
    } catch (error) {
        handleError(error, response);
    }
});

/**
 * Récupération d'un certains nombre de Catégories d'un utilisateur
 */
mapossaDataTech.users.get("/:idUser/" + Categorie.collectionName, async (request, response) => {
    try {
        // On regarde d'abord si on a la propriété "query" dans le header pour savoir
        // s'il s'agit de récuperer certaines catégories spécifiques
        let query: FirebaseFirestore.CollectionReference<Categorie> | FirebaseFirestore.Query<Categorie> = Categorie.collection(request.params.idUser);
        const queryParams = request.query;

        if (queryParams) {
            // si il ya des querry params

            for (const param in queryParams) {
                if (Object.prototype.hasOwnProperty.call(queryParams, param)) {
                    const value = queryParams[param];
                    query = query.where(param, "==", value)
                    console.log(value)
                }
            }

        }

        const categories = (await query.get()).docs;

        response.status(201).send(new Response("Voici les Categories demandés", false, categories.map((el) => el.data())));

    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/**
 * Récupération d'une Catégorie en particulier
 */
mapossaDataTech.users.get("/:idUser/" + Categorie.collectionName + "/:idCategorie", async (request, response) => {
    try {
        const cat = await Categorie.getById(request.params.idUser, request.params.idCategorie);
        response.status(201).send(new Response("Voici la catégorie demandée", false, cat));
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/**
 * Mise à jour d'une catégorie
 */
mapossaDataTech.users.put("/:idUser/" + Categorie.collectionName + "/:idCategorie", async (request, response) => {
    // il s'agit ici de mettre à jour d'une catégorie d'un utilisateur
    try {
        //on vérifie bien que le corps de la requête est une catégorie
        if (Categorie.isCategorie(request.body)) {
            // on met alors à jour la catégorie
            const cat = Categorie.getById(request.params.idUser, request.params.idCategorie);

            if (!cat) response.status(200).send(new Response("La catégorie que vous souhaitez modifier n'existe", true));
            const categorieUpdated = await Categorie.update(request.params.idUser, request.body);
            response.status(200).send(new Response("La catégorie a été mise à jour", false, categorieUpdated));
        } else {
            // il ne s'agit pas d'une catégorie car il manque des attributs
            response.status(200).send(new Response("La catégorie est invalide car il manque des attributs crucuax", true, {
                "obtenu": request.body,
                "attributsNecessaire": {
                    "isAuto": "booléen qui indique si la catégorie est une catégorie crée par un utilisateur ou par mapossa",
                    "montantCumule": "nombre qui représente la somme des transactions liés a cette catégorie"
                },
                "conseil": "Vérifiez la catégorie que vous souhaitez mettre à jour"
            }))
        }
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/**
 * Mise à jours de plusieurs Catégories de l'utilisateur à la fois
 */
mapossaDataTech.users.put("/:idUser/" + Categorie.collectionName, async (request, response) => {
    try {
        // on regarde si le corps de la requête est un tableau
        // pour savoir que l'on est entrain de vouloir modifier plusieurs
        // catégories à la fois
        if (Array.isArray(request.body)) {
            // alors on modifie les catégories
            const updatedCategories = await Categorie.bulkUpdate(request.params.idUser, request.body);
            response.status(201).send(new Response("Les catégories ont été bien modifiées", false, updatedCategories));
        } else
        // alors on modifie toutes les catégories par les champs donées 
        {
            //const updatedCatégories = await Transaction.updateAll(request.params.idUser, request.body);
            response.status(200).send(new Response("La requête es invalide veuillez vérifier les paramètres", true, {}));
        }
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});

/**
 * Suppression d'une catégorie d'un utilisateur
 */
mapossaDataTech.users.delete("/:idUser/" + Categorie.collectionName + "/:idCategorie", async (request, response) => {
    try {
        // ici on supprime simplement la catégorie dont on a l'identifiant
        const categorieDeleted = await Categorie.delete(request.params.idUser, request.params.idCategorie);
        response.status(200).send(new Response("La catégorie a été supprimé avec succès", false, categorieDeleted));

    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/**
 * Supression d'un certains nombre de catégories d'un utilisateur
 */
mapossaDataTech.users.delete("/:idUser/" + Categorie.collectionName, async (request, response) => {
    try {

        // on regarde si dans le Header la requête on a "ids"
        // pour savoir que l'on est entrain de vouloir supprimer plusieurs
        // Catégories à la fois
        if ("ids" in request.headers) {
            // on vérifie que ids est effectivement un tableau 
            if (Array.isArray(request.headers.ids)) {
                // alors on supprime les catégories
                const deletedCat = await Categorie.bulkDelete(request.params.idUser, request.headers.ids);
                response.status(201).send(new Response("Les catégories ont été bien supprimées", false, deletedCat));
            } else {
                // il ya un problème : ids doit etre un tableau contenant les identifiant des catégories que 
                // l'on souhaite supprimer
                response.status(200).send(new Response("ids doit etre un tableau contenant les identifiant des catégories à supprimer", true, { "reçu": typeof request.headers.ids, "attendu": "Array of string" }));
            }
        } else
        // alors on soupprime toutes les catégories de l'utilisateur
        // puisqu'il n'y a pas de spécification
        {
            const deletedCategories = await Categorie.deleteAll(request.params.idUser);
            response.status(200).send(new Response("Toutes les categories ont été supprimés avec succès", false, deletedCategories));
        }
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});

/*************************** FIN CATEGORIE ****************************/
/**
 *
 */
/*************************** HABITUDE ****************************/
/**
 * Création d'une Habitude d'un utilisateur
 */
mapossaDataTech.users.post("/:idUser/" + Habitude.collectionName, async (request, response) => {

    try {
        // on regarde si le corps de la requête est un tableau pour savoir 
        // s'il faut créer plusieurs habitudes ou pas
        if (Array.isArray(request.body)) {
            // alors on doit créer pulsieurs habitudes
            const habitudesCreated = await Habitude.bulkCreate(request.params.idUser, request.body);
            response.status(201).send(new Response("Les habitudes ont été crées avec succès", false, habitudesCreated));
        } else
        // il faut créer une seul habitude
        {
            const habitudeCreated = await Habitude.create(request.params.idUser, request.body);
            response.status(201).send(new Response("L'habitude a été crée avec succès", false, { id: habitudeCreated }));
        }
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});

/**
 * Récupération d'un certains nombre d'habitudes d'un utilisateur
 */
mapossaDataTech.users.get("/:idUser/" + Habitude.collectionName, async (request, response) => {
    try {
        // On regarde d'abord si on a la propriété "query" dans le header pour savoir
        // s'il s'agit de récuperer certaines habitudes spécifiques
        if ("query" in request.headers) {
            const query = JSON.parse(request.headers.query as string)
            // il faut vérifier que "query" est bien un object de type query
            if ("valeur" in query && "operateur" in query && "attribut" in query) {
                // on récupère les habitudes conformément à la requête formulés
                const habitudesGot = await Habitude.query(request.params.idUser, query)
                response.status(200).send(new Response("Voici les catégories demandées", false, habitudesGot));
            } else {
                response.status(200).send(new Response("query doit etre un object représentant la requête des Habitudes à récupérer", true, {
                    "reçu": typeof request.headers.ids, "attendu": {
                        "attribut": "indique l'attributs",
                        "operateur": "L'opérateur à utiliser",
                        "valeur": "La valeur à checker"
                    }
                }));
            }
        } else
        // alors la requête on renvoi tous les Habitudes de l'utilisateurs
        // puisqu'il n'y a pas de spécifications
        {
            const allHabits = await Habitude.getAllOfUser(request.params.idUser);
            response.status(200).send(new Response("Voici toutes les habitudes de l'utilisateur", false, allHabits));
        }
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/**
 * Récupération d'une Habitude en particulier
 */
mapossaDataTech.users.get("/:idUser/" + Habitude.collectionName + "/:idHabitude", async (request, response) => {
    try {
        const habit = await Habitude.getById(request.params.idUser, request.params.idHabitude);
        response.status(201).send(new Response("Voici l'habitude demandée", false, habit));
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/**
 * Mise à jour d'une Habitude
 */
mapossaDataTech.users.put("/:idUser/" + Habitude.collectionName + "/:idHabitude", async (request, response) => {
    // il s'agit ici de mettre à jour une habitude d'un utilisateur
    try {
        //on vérifie bien que le corps de la requête est une habitude
        if (Habitude.isHabitude(request.body)) {
            // on met alors à jour l'habitude
            const habitudeUpdated = await Habitude.update(request.params.idUser, request.body);
            response.status(200).send(new Response("L'habitude a été mise à jour", false, habitudeUpdated));
        } else {
            // il ne s'agit pas d'une habitude car il manque des attributs
            response.status(200).send(new Response("L'habitude est invalide car il manque des attributs crucuax", true, {
                "obtenu": request.body,
                "attributsNecessaire": {
                    "rappel": "string qui indique si le moment auquel on doit rappeller l'habitude",
                    "done": "booléen qui dit si l'habitude a été accompli ou pas"
                },
                "conseil": "Vérifiez l'habitude que vous souhaitez mettre à jour"
            }))
        }
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/**
 * Mise à jours de plusieurs Habitudes de l'utilisateur à la fois
 */
mapossaDataTech.users.put("/:idUser/" + Habitude.collectionName, async (request, response) => {
    try {
        // on regarde si le corps de la requête est un tableau
        // pour savoir que l'on est entrain de vouloir modifier plusieurs
        // habitudes à la fois
        if (Array.isArray(request.body)) {
            // alors on modifie les habitudes
            const updatedHabits = await Habitude.bulkUpdate(request.params.idUser, request.body);
            response.status(201).send(new Response("Les catégories ont été bien modifiées", false, updatedHabits));
        } else
        // alors on modifie toutes les habitudes par les champs donées 
        {
            //const updatedHabits = await Transaction.updateAll(request.params.idUser, request.body);
            response.status(200).send(new Response("La requête es invalide veuillez vérifier les paramètres", true, {}));
        }
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});

/**
 * Suppression d'une Habitude d'un utilisateur
 */
mapossaDataTech.users.delete("/:idUser/" + Habitude.collectionName + "/:idHabitude", async (request, response) => {
    try {
        // ici on supprime simplement l'habitude dont on a l'identifiant
        const habitDeleted = await Habitude.delete(request.params.idUser, request.params.idHabitude);
        response.status(200).send(new Response("Le compte a été supprimé avec succès", false, habitDeleted));

    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/**
 * Supression d'un certains nombre d'habitudes d'un utilisateur
 */
mapossaDataTech.users.delete("/:idUser/" + Habitude.collectionName, async (request, response) => {
    try {

        // on regarde si dans le Header la requête on a "ids"
        // pour savoir que l'on est entrain de vouloir supprimer plusieurs
        // habitudes à la fois
        if ("ids" in request.headers) {
            // on vérifie que ids est effectivement un tableau 
            if (Array.isArray(request.headers.ids)) {
                // alors on supprime les habitudes
                const deletedHabits = await Habitude.bulkDelete(request.params.idUser, request.headers.ids);
                response.status(201).send(new Response("Les habitudes ont été bien supprimées", false, deletedHabits));
            } else {
                // il ya un problème : ids doit etre un tableau contenant les identifiant des habitudes que 
                // l'on souhaite supprimer
                response.status(200).send(new Response("ids doit etre un tableau contenant les identifiant des habitudes à supprimer", true, { "reçu": typeof request.headers.ids, "attendu": "Array of string" }));
            }
        } else
        // alors on soupprime toutes les habitudes de l'utilisateur
        // puisqu'il n'y a pas de spécification
        {
            const habitsDeleted = await Habitude.deleteAllOfUser(request.params.idUser);
            response.status(200).send(new Response("Toutes les habitudes ont été supprimées avec succès", false, habitsDeleted));
        }
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/*************************** FIN HABITUDE ****************************/

export const user = functions.https.onRequest(mapossaDataTech.users);
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// FIN MAPOSSA SMARTWALLET ----------------------------------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// DEBUT MAPOSSA BUSINESS ----------------------------------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

/*************************** CARTE DE FIDELITE  ****************************/
/**
 * Création d'une Carte de Fidelité d'un utilisateur
 */
mapossaDataTech.cartesDeFidelite.post("/", async (request, response) => {

    try {
        // on regarde si le corps de la requête est un tableau pour savoir 
        // s'il faut créer plusieurs cartes de fidelités ou pas
        if (Array.isArray(request.body)) {
            // alors on doit créer pulsieurs cartes de fidelité
            const cartesCreated = await CarteDeFidelite.bulkCreate(request.body);
            response.status(201).send(new Response("Les Cartes de fidelité ont été crés avec succès", false, cartesCreated));
        } else
        // il faut créer une seul carte de fidelité
        {
            const carteCreated = await CarteDeFidelite.create(request.body);
            response.status(201).send(new Response("La carte de fidelité a été créee avec succès", false, { id: carteCreated }));
        }
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});

/**
 * Récupération d'un certains nombre de Cartes de Fidelités d'un utilisateur
 */
mapossaDataTech.cartesDeFidelite.get("/", async (request, response) => {
    try {
        // On regarde d'abord si on a la propriété "query" dans le header pour savoir
        // s'il s'agit de récuperer certaines cartes de fidelité spécifiques
        if ("query" in request.headers) {
            const query = JSON.parse(request.headers.query as string);
            // il faut vérifier que "query" est bien un objet de type query
            if ("valeur" in query && "operateur" in query && "attribut" in query) {
                // on récupère les cartes de fidelités conformément à la requête formulé
                const CDFGot = await CarteDeFidelite.query(query);
                response.status(200).send(new Response("Voici les Cartes de fidelité demandées", false, CDFGot));
            } else {
                // Il ya problème : ids doit etre un un objet de type query
                response.status(200).send(new Response("query doit etre un object représentant la requête des cartes à récupérer", true, {
                    "reçu": typeof request.headers.ids, "attendu": {
                        "attribut": "indique l'attributs",
                        "operateur": "L'opérateur à utiliser",
                        "valeur": "La valeur à checker"
                    }
                }));
            }
        } else
        // on renvoi toutes les cartes de fidelités
        // puisqu'il n'y a pas de spécifications
        {
            const allCartes = await CarteDeFidelite.getAll();
            response.status(200).send(new Response("Voici toutes les cartes de fidelités", false, allCartes));
        }
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/**
 * Récupération d'une carte de fidelité en particulier
 */
mapossaDataTech.cartesDeFidelite.get("/:idCDF", async (request, response) => {
    try {
        const carteDeFidelite = await CarteDeFidelite.getById(request.params.idCDF);
        response.status(201).send(new Response("Voici la carte de fidelité demandée", false, carteDeFidelite));
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/**
 * Mise à jour d'une carte de fidelité
 */
mapossaDataTech.cartesDeFidelite.put("/:idCDF", async (request, response) => {
    // il s'agit ici de mettre à jour une carte de fidelité
    try {
        //on vérifie bien que le corps de la requête est un object représentant une carte de fidelité
        if (CarteDeFidelite.isCarteDeFidelite(request.body)) {
            // on met alors à jour la carte de fidelité
            const carteUpdated = await CarteDeFidelite.update(request.body);
            response.status(200).send(new Response("La carte de fidelité a été mise à jour", false, carteUpdated));
        } else {
            // il ne s'agit pas d'une carte de fidelité car il manque des attributs
            response.status(200).send(new Response("La carte de fidelité est invalide car il manque des attributs crucuax", true, {
                "obtenu": request.body,
                "attributsNecessaire": {
                    "logo": "string qui indique l'url vers l'image du logo",
                    "idEntreprise": "string qui représente l'identifiant de l'entreprise créant la carte de fidelité"
                },
                "conseil": "Vérifiez la carte de fidelité que vous souhaitez mettre à jour"
            }))
        }
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/**
 * Mise à jours de plusieurs Cartes de fidelité de l'utilisateur à la fois
 */
mapossaDataTech.cartesDeFidelite.put("/", async (request, response) => {
    try {
        // on regarde si le corps de la requête est un tableau
        // pour savoir que l'on est entrain de vouloir modifier plusieurs
        // cartes de fidelité à la fois
        if (Array.isArray(request.body)) {
            // alors on modifie les cartes de fidelité
            const updateCartes = await CarteDeFidelite.bulkUpdate(request.body);
            response.status(201).send(new Response("Les cartes de fidelité ont été bien modifiées", false, updateCartes));
        } else
        // Il ya problème le corps de la requête doit etre un tableau
        // contenant les cartes que l'on souhaite modifier
        {
            response.status(200).send(new Response("Le coprs de la requête doit etre un tableau contenant les cartes de fidelités que vous souhaitez modifier", true, {
                "obtenu": request.body,
                "attendu": "Tableau de carte de fidelité"
            }));
        }
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});

/**
 * Suppression d'une carte de fidelité d'un utilisateur
 */
mapossaDataTech.cartesDeFidelite.delete("/:idCDF", async (request, response) => {
    try {
        // ici on supprime simplement la carte de fidelité dont on a l'identifiant
        const cartesDeleted = await CarteDeFidelite.delete(request.params.idCDF);
        response.status(200).send(new Response("La carte de fidelité a été supprimée avec succès", false, cartesDeleted));

    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/**
 * Supression d'un certains nombre de cartes de fidelité d'un utilisateur
 */
mapossaDataTech.cartesDeFidelite.delete("/", async (request, response) => {
    try {

        // on regarde si dans le Header la requête on a "ids"
        // pour savoir que l'on est entrain de vouloir supprimer plusieurs
        // cartes de fidelité à la fois
        if ("ids" in request.headers) {
            // on vérifie que ids est effectivement un tableau 
            if (Array.isArray(request.headers.ids)) {
                // alors on supprime les cartes de fidelités
                const deletedCartes = await CarteDeFidelite.bulkDelete(request.headers.ids);
                response.status(201).send(new Response("Les cartes de fidelités ont été bien supprimées", false, deletedCartes));
            } else {
                // il ya un problème : ids doit etre un tableau contenant les identifiant des cartes que 
                // l'on souhaite supprimer
                response.status(200).send(new Response("ids doit etre un tableau contenant les identifiant des cartes de fidelité à supprimer", true, { "reçu": typeof request.headers.ids, "attendu": "Array of string" }));
            }
        } else
        // Il ya problème il manque les identifiant des cartes que l'on
        // souhaite supprimé
        {
            response.status(200).send(new Response("Il manque dans le header l'attribut 'ids'  qui doit contenir le tableau d'identifiant des cartes à supprimés", true, {
                "obtenu": "rien",
                "attendu": "ids"
            }));
        }
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});

/**
 * Abonnement d'un utilisateur à une cate de fidelité
 */
mapossaDataTech.users.post("/:idUser/" + CarteDeFidelite.collectionName + "/:idCDF", async (request, response) => {
    try {
        const abonSucced = await CarteDeFidelite.abonnement(request.params.idUser, request.params.idCDF);
        response.status(201).send(new Response("L'abonnement à la carte de fidelité a réussi", false, abonSucced));
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
})
/**
 * Désabonnement d'un utilisateur à une cate de fidelité
 */
mapossaDataTech.users.delete("/:idUser/" + CarteDeFidelite.collectionName + "/:idCDF", async (request, response) => {
    try {
        const desabonSucced = await CarteDeFidelite.desabonnement(request.params.idUser, request.params.idCDF);
        response.status(201).send(new Response("Le désabonnement à la carte de fidelité a réussi", false, desabonSucced));
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
})
/*************************** FIN CARTE DE FIDELITE ****************************/

/******************************* DEBUT OFFRE  ********************************/
/**
 * Création d'une offre d'une Carte de Fidelité
 */
mapossaDataTech.cartesDeFidelite.post("/:idCDF/" + Offre.collectionName, async (request, response) => {

    try {
        // on regarde si le corps de la requête est un tableau pour savoir 
        // s'il faut créer plusieurs offres de carte de fidelités ou pas
        if (Array.isArray(request.body)) {
            // alors on doit créer pulsieurs offres
            const offreCreated = await Offre.bulkCreate(request.params.idCDF, request.body);
            response.status(201).send(new Response("Les offres de la Carte de fidelité a été crée avec succès", false, offreCreated));
        } else
        // il faut créer une seule offre de carte de fidelité
        {
            const offreCreated = await Offre.create(request.params.idCDF, request.body);
            response.status(201).send(new Response("L'offre de la carte de fidelité a été créee avec succès", false, { id: offreCreated }));
        }
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});

/**
 * Récupération d'un certains nombre d'offre d'une Cartes de Fidelités d'un utilisateur
 */
mapossaDataTech.cartesDeFidelite.get("/:idCDF/" + Offre.collectionName, async (request, response) => {
    try {
        // On regarde d'abord si on a la propriété "query" dans le header pour savoir
        // s'il s'agit de récuperer certaines offres de cartes de fidelité spécifiques
        if ("query" in request.headers) {
            const query = JSON.parse(request.headers.query as string);
            // il faut vérifier que "query" est bien un objet de type query
            if ("valeur" in query && "operateur" in query && "attribut" in query) {
                // on récupère les offres des cartes de fidelités conformément à la requête
                const offresGot = await Offre.query(request.params.idCDF, query);
                response.status(200).send(new Response("Voici les offres de la carte de fidelité demandées", false, offresGot));
            } else {
                response.status(200).send(new Response("query doit etre un object représentant la requête des offres à récupérer", true, {
                    "reçu": typeof request.headers.ids, "attendu": {
                        "attribut": "indique l'attributs",
                        "operateur": "L'opérateur à utiliser",
                        "valeur": "La valeur à checker"
                    }
                }));
            }
        } else
        // on renvoi toutes les offres de la carte de fidelités
        // puisqu'il n'y a pas de spécifications
        {
            const allOOffres = await Offre.getAll(request.params.idCDF);
            response.status(200).send(new Response("Voici toutes les offres de la carte de fidelité ", false, allOOffres));
        }
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/**
 * Récupération d'une offre d'une carte de fidelité en particulier
 */
mapossaDataTech.cartesDeFidelite.get("/:idCDF/" + Offre.collectionName + "/:idOffre", async (request, response) => {
    try {
        const offre = await Offre.getById(request.params.idCDF, request.params.idOffre);
        response.status(201).send(new Response("Voici l'offre de la carte de fidelité demandée", false, offre));
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/**
 * Mise à jour d'une offre d'une carte de fidelité
 */
mapossaDataTech.cartesDeFidelite.put("/:idCDF/" + Offre.collectionName + "/:idOffre", async (request, response) => {
    // il s'agit ici de mettre à jour une offre d'une carte de fidelité
    try {
        //on vérifie bien que le corps de la requête est un object représentant une offre de carte de fidelité
        if (Offre.isOffre(request.body)) {
            // on met alors à jour l'offre de la carte de fidelité
            const offreUpdated = await Offre.update(request.params.idCDF, request.body);
            response.status(200).send(new Response("L'offre de la carte de fidelité a été mise à jour", false, offreUpdated));
        } else {
            // il ne s'agit pas d'une offre de carte de fidelité car il manque des attributs
            response.status(200).send(new Response("L'offre de la carte de fidelité est invalide car il manque des attributs crucuax", true, {
                "obtenu": request.body,
                "attributsNecessaire": {
                    "cible": "string qui indique la cible de l'offre",
                    "photos": "string[] qui représente les photos o les images de l'offre"
                },
                "conseil": "Vérifiez l'offre de la carte de fidelité que vous souhaitez mettre à jour"
            }))
        }
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/**
 * Mise à jours de plusieurs offres de Cartes de fidelité de l'utilisateur à la fois
 */
mapossaDataTech.cartesDeFidelite.put("/:idCDF/" + Offre.collectionName, async (request, response) => {
    try {
        // on regarde si le corps de la requête est un tableau
        // pour savoir que l'on est entrain de vouloir modifier plusieurs
        // offres de cartes de fidelité à la fois
        if (Array.isArray(request.body)) {
            // alors on modifie les cartes de fidelité
            const updateOffres = await Offre.bulkUpdate(request.params.idCDF, request.body);
            response.status(201).send(new Response("Les offres de la carte de fidelité ont été bien modifiées", false, updateOffres));
        } else
        // Il ya problème le corps de la requête doit etre un tableau
        // contenant les cartes que l'on souhaite modifier
        {
            response.status(200).send(new Response("Le coprs de la requête doit etre un tableau contenant les offres de la cartes de fidelités que vous souhaitez modifier", true, {
                "obtenu": request.body,
                "attendu": "Tableau d'offre d'une carte de fidelité"
            }));
        }
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});

/**
 * Suppression d'une offre d'une carte de fidelité d'un utilisateur
 */
mapossaDataTech.cartesDeFidelite.delete("/:idCDF/" + Offre.collectionName + "/:idOffre", async (request, response) => {
    try {
        // ici on supprime simplement l'offre de la carte de fidelité dont on a l'identifiant
        const offreDeleted = await Offre.delete(request.params.idCDF, request.params.idOffre);
        response.status(200).send(new Response("L'offre de la carte de fidelité a été supprimée avec succès", false, offreDeleted));

    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/**
 * Supression d'un certains nombre d'offre de cartes de fidelité d'un utilisateur
 */
mapossaDataTech.cartesDeFidelite.delete("/:idCDF/" + Offre.collectionName, async (request, response) => {
    try {

        // on regarde si dans le Header la requête on a "ids"
        // pour savoir que l'on est entrain de vouloir supprimer plusieurs
        // offres de la cartes de fidelité à la fois
        if ("ids" in request.headers) {
            // on vérifie que ids est effectivement un tableau 
            if (Array.isArray(request.headers.ids)) {
                // alors on supprime les offres des cartes de fidelités
                const deletedOffre = await Offre.bulkDelete(request.params.idCDF, request.headers.ids);
                response.status(201).send(new Response("Les offres de la carte de fidelités ont été bien supprimées", false, deletedOffre));
            } else {
                // il ya un problème : ids doit etre un tableau contenant les identifiant des offres de
                // la carte que  l'on souhaite supprimer
                response.status(200).send(new Response("ids doit etre un tableau contenant les identifiant des offres de la carte de fidelité à supprimer", true, { "reçu": typeof request.headers.ids, "attendu": "Array of string" }));
            }
        } else
        // Il ya problème il manque les identifiant des offres de la carte que l'on
        // souhaite supprimé
        {
            response.status(200).send(new Response("Il manque dans le header l'attribut 'ids'  qui doit contenir le tableau d'identifiant des offres de la carte à supprimer", true, {
                "obtenu": "rien",
                "attendu": "ids"
            }));
        }
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});

/**
 * Activation d'une offre d'une carte de fidelité d'un utilisateur
 */
mapossaDataTech.users.post("/:idUser/" + CarteDeFidelite.collectionName + "/:idCDF" + Offre.collectionName + "/:idOffre", async (request, response) => {
    try {
        const activSucced = await Offre.activation(request.params.idUser, request.params.idCDF, request.params.idOffre);
        response.status(201).send(new Response("L'activation de l'offre de la carte de fidelité a réussi", false, activSucced));
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
})
/**
 * Desactivation d'une offre d'une carte de fidelité d'un utilisateur
 */
mapossaDataTech.users.delete("/:idUser/" + CarteDeFidelite.collectionName + "/:idCDF" + Offre.collectionName + "/:idOffre", async (request, response) => {
    try {
        const desacSucced = await Offre.desactivation(request.params.idUser, request.params.idCDF, request.params.idOffre);
        response.status(201).send(new Response("La désactivation de l'offre de la carte de fidelité a réussi", false, desacSucced));
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
})
/********************************* FIN OFFRE ************************************/

export const cartesDeFidelite = functions.https.onRequest(mapossaDataTech.cartesDeFidelite);


/********************************* DEBUT INTENTION ENCAISSEMENT ************************************/
/**
 * Création d'une Intention d'encaissement d'un utilisateur
 */
mapossaDataTech.users.post("/:idUser/" + IntentionEncaissement.collectionName, async (request, response) => {

    try {
        // on crée simplement l'intention d'encaissement
        functions.logger.log("créeons liIE")
        const ie = await IntentionEncaissement.create(request.body)
        response.status(201).send(new Response("L'intention a été crée avec succès", false, ie))

    } catch (error) {
        functions.logger.log(error)
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});

/**
 * Récupération d'un certains nombre d'intention d'encaissement d'un utilisateur
 */
mapossaDataTech.users.get("/:idUser/" + IntentionEncaissement.collectionName, async (request, response) => {
    try {

        // alors la requête on renvoi tous les comptes de l'utilisateurs
        // puisqu'il n'y a pas de spécifications
        const pendingIE = await IntentionEncaissement.getMyPendingIE(request.params.idUser);
        response.status(200).send(new Response("Voici tous vos intentions d'encaissement en attentes", false, pendingIE));

    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/**
 * Mise à jour d'un Compte d'un utilisateur
 */
mapossaDataTech.users.put("/:idUser/" + IntentionEncaissement.collectionName + "/:idIE", async (request, response) => {
    // il s'agit ici de mettre à jour un compte Financier d'un utilisateur
    try {
        //on vérifie bien que le corps de la requête est un compte financier
        if (IntentionEncaissement.isIE(request.body)) {
            // on met alors à jour le compte

            let ieu: IntentionEncaissement | undefined;
            (await IntentionEncaissement.getMyPendingIE(request.params.idUser)).forEach((ie) => { if (ie.id == request.params.idIE) ieu = ie; });

            if (ieu == undefined) { response.status(200).send(new Response("Aucune intention d'encaissement avec cette identifiant n'a été trouvé", true, { "id": request.params.idIE })) }
            else {
                if (request.body.etat == "Annulé") {
                    const cie = await IntentionEncaissement.cancel(ieu);
                    response.status(200).send(new Response("L'intention a tété annulé avec succès", false, cie));
                } else if (request.body.etat == "Validé") {
                    const cie = IntentionEncaissement.validate(ieu);
                    response.status(200).send(new Response("L'intention a tété validé avec succès", false, cie));
                } else {
                    response.status(200).send(new Response("L'état de l'intention n'a pas changé", false, ieu));
                }
            }
        } else {
            // il ne s'agit pas d'un compte financier car il manque des attributs
            response.status(200).send(new Response("L'Intention d'encaissement' est invalide car il manque des attributs crucuax", true, {
                "obtenu": request.body,
                "attributsNecessaire": {
                    "idVendeur": "Indique l'identifiant de celui qui a vendu",
                    "idAcheteur": ""
                },
                "conseil": "Vérifiez l'IE que vous souhaitez mettre à jour"
            }))
        }
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});

/********************************* FIN INTENTION ENCAISSEMENT ************************************/


/*************************** PRODUIT ****************************/
/**
 * Création d'un produit d'un vendeur
 */
mapossaDataTech.users.post("/:idUser/" + Produit.collectionName, async (request, response) => {

    try {
        // on regarde si le corps de la requête est un tableau pour savoir 
        // s'il faut créer plusieurs produits ou pas
        if (Array.isArray(request.body)) {
            // alors on doit créer plusieurs produits
            const produitsCreated = await Produit.bulkCreate(request.params.idUser, request.body);
            response.status(201).send(new Response("Les produits ont été crées avec succès", false, produitsCreated));
        } else
        // il faut créer un seul produit
        {

            const produitCreated = await Produit.create(request.params.idUser, request.body);
            response.status(201).send(new Response("Le produit a été crée avec succès", false, produitCreated));
        }
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});

/**
 * Récupération d'un certains nombre de produit d'un vendeur
 */
mapossaDataTech.users.get("/:idUser/" + Produit.collectionName, async (request, response) => {
    try {
        // On regarde d'abord si on a la propriété "query" dans le header pour savoir
        // s'il s'agit de récuperer certaines produits spécifiques
        if ("query" in request.headers) {
            const query = JSON.parse(request.headers.query as string)
            // il faut vérifier que "query" est bien un object de type query
            if ("valeur" in query && "operateur" in query && "attribut" in query) {
                // on récupère les produits conformément à la requête formulés
                const produitsRequested = await Produit.query(request.params.idUser, query)
                response.status(200).send(new Response("Voici les produits demandées", false, produitsRequested));
            } else {
                response.status(200).send(new Response("query doit etre un object représentant la requête des produits à récupérer", true, {
                    "reçu": typeof request.headers.ids, "attendu": {
                        "attribut": "indique l'attributs",
                        "operateur": "L'opérateur à utiliser",
                        "valeur": "La valeur à checker"
                    }
                }));
            }
        } else
        // alors la requête on renvoi tous les produits de l'utilisateurs
        // puisqu'il n'y a pas de spécifications
        {
            const produits = await Produit.getAll(request.params.idUser);
            response.status(200).send(new Response("Voici tous les produits de l'utilisateur", false, produits));
        }
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/**
 * Récupération d'un produit en particulier
 */
mapossaDataTech.users.get("/:idUser/" + Produit.collectionName + "/:idProduit", async (request, response) => {
    try {
        const produit = await Produit.getById(request.params.idUser, request.params.idProduit);
        response.status(201).send(new Response("Voici le produit demandé", false, produit));
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/**
 * Mise à jour d'un produit
 */
mapossaDataTech.users.put("/:idUser/" + Produit.collectionName + "/:idProduit", async (request, response) => {
    // il s'agit ici de mettre à jour un produit d'un utilisateur
    try {
        //on vérifie bien que le corps de la requête est un produit
        if (Produit.isProduit(request.body)) {
            // on met alors à jour le produit
            const produit = await Produit.update(request.params.idUser, request.body);
            response.status(200).send(new Response("Le produit a été mise à jour", false, produit));
        } else {
            // il ne s'agit pas d'une habitude car il manque des attributs
            response.status(200).send(new Response("Le produit est invalide car il manque des attributs crucuax", true, {
                "obtenu": request.body,
                "attributsNecessaire": {
                    "prix": "number qui indique le prix du produit",
                    "nom": "string indique le nom du produit"
                },
                "conseil": "Vérifiez le produit que vous souhaitez mettre à jour"
            }))
        }
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/**
 * Mise à jours de plusieurs Produits d'un vendeur à la fois
 */
mapossaDataTech.users.put("/:idUser/" + Produit.collectionName, async (request, response) => {
    try {
        // on regarde si le corps de la requête est un tableau
        // pour savoir que l'on est entrain de vouloir modifier plusieurs
        // produits à la fois
        if (Array.isArray(request.body)) {
            // alors on modifie les produits
            const produits = await Produit.bulkUpdate(request.params.idUser, request.body);
            response.status(201).send(new Response("Les produits bien été bien modifiés", false, produits));
        } else
        // alors on modifie toutes les produits par les champs donées 
        {
            //const updatedHabits = await Transaction.updateAll(request.params.idUser, request.body);
            response.status(200).send(new Response("La requête es invalide veuillez vérifier les paramètres", true, {}));
        }
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});

/**
 * Suppression d'un produit d'un vendeur
 */
mapossaDataTech.users.delete("/:idUser/" + Produit.collectionName + "/:idProduit", async (request, response) => {
    try {
        // ici on supprime simplement le produit dont on a l'identifiant
        const produitDeleted = await Produit.delete(request.params.idUser, request.params.idProduit);
        response.status(200).send(new Response("Le Produit a été supprimé avec succès", false, produitDeleted));

    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/**
 * Supression d'un certains nombre de produits d'un vendeur
 */
mapossaDataTech.users.delete("/:idUser/" + Produit.collectionName, async (request, response) => {
    try {

        // on regarde si dans le Header la requête on a "ids"
        // pour savoir que l'on est entrain de vouloir supprimer plusieurs
        // produits à la fois
        if ("ids" in request.headers) {
            // on vérifie que ids est effectivement un tableau 
            if (Array.isArray(request.headers.ids)) {
                // alors on supprime les produits
                const produitsDeleted = await Produit.bulkDelete(request.params.idUser, request.headers.ids);
                response.status(201).send(new Response("Les produits ont été bien supprimées", false, produitsDeleted));
            } else {
                // il ya un problème : ids doit etre un tableau contenant les identifiant des produits que 
                // l'on souhaite supprimer
                response.status(200).send(new Response("ids doit etre un tableau contenant les identifiant des produits à supprimer", true, { "reçu": typeof request.headers.ids, "attendu": "Array of string" }));
            }
        } else
        // alors on soupprime tous les produits de l'utilisateur
        // puisqu'il n'y a pas de spécification
        {
            const produitsDeleted = await Produit.deleteAll(request.params.idUser);
            response.status(200).send(new Response("Tous les produits ont été supprimées avec succès", false, produitsDeleted));
        }
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/*************************** FIN PORDUIT ****************************/

/*************************** COMMANDE ****************************/
/**
 * Création d'une commande par un vendeur
 */
mapossaDataTech.users.post("/:idUser/" + Commande.collectionName, async (request, response) => {

    try {
        // on regarde si le corps de la requête est un tableau pour savoir 
        // s'il faut créer plusieurs commandes ou pas
        if (Array.isArray(request.body)) {
            // alors on doit créer plusieurs commande
            const commandes = await Commande.bulkCreate(request.params.idUser, request.body);
            response.status(201).send(new Response("Les commandes ont été crées avec succès", false, commandes));
        } else
        // il faut créer une seule commande
        {
            if (Commande.isCommande(request.body)) {
                const commande = await Commande.create(request.params.idUser, request.body);
                response.status(201).send(new Response("La commande a été crée avec succès", false, commande));
            } else {
                response.status(200).send(new Response("Le corps de la requête reçu nn'est pas une commande car il manque les attibuts cruxiaux", true, {
                    "obtenu": request.body,
                    "attributsAttendu": {
                        "produits": "Tableau de prosuit de la commande",
                        "montant": "Montant de la commande",
                        "client": "le client qui doit valider la commande",
                        "etat": "L'état actuel de la commande"
                    }
                }));
            }

        }
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});

/**
 * Récupération d'un certains nombre de commande par un vendeur
 */
mapossaDataTech.users.get("/:idUser/" + Commande.collectionName, async (request, response) => {
    try {
        // On regarde d'abord si on a la propriété "query" dans le header pour savoir
        // s'il s'agit de récuperer certaines produits spécifiques
        if ("query" in request.headers) {
            const query = JSON.parse(request.headers.query as string)
            // il faut vérifier que "query" est bien un object de type query
            if ("valeur" in query && "operateur" in query && "attribut" in query) {
                // on récupère les commandes conformément à la requête formulés
                const commandes = await Commande.query(request.params.idUser, query)
                response.status(200).send(new Response("Voici les commandes demandées", false, commandes));
            } else {
                response.status(200).send(new Response("query doit etre un object représentant la requête des commandes à récupérer", true, {
                    "reçu": typeof request.headers.ids, "attendu": {
                        "attribut": "indique l'attributs",
                        "operateur": "L'opérateur à utiliser",
                        "valeur": "La valeur à checker"
                    }
                }));
            }
        } else
        // alors la requête on renvoi tous les produits de l'utilisateurs
        // puisqu'il n'y a pas de spécifications
        {
            const commandes = await Commande.getAll(request.params.idUser);
            response.status(200).send(new Response("Voici toutes les commandes de l'utilisateur", false, commandes));
        }
    } catch (error) {
        functions.logger.log(error)
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/**
 * Récupération d'une commande particulière
 */
mapossaDataTech.users.get("/:idUser/" + Commande.collectionName + "/:idCommande", async (request, response) => {
    try {
        const commande = await Commande.getById(request.params.idUser, request.params.idCommande);
        response.status(201).send(new Response("Voici la commande demandée", false, commande));
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/**
 * Mise à jour d'une commande par un vendeur
 */
mapossaDataTech.users.put("/:idUser/" + Commande.collectionName + "/:idCommande", async (request, response) => {
    // il s'agit ici de mettre à jour une commande émise par un vendeur
    try {
        //on vérifie bien que le corps de la requête est une commande
        if (Commande.isCommande(request.body)) {
            // on met alors à jour la commande
            const commande = await Commande.update(request.params.idUser, request.body);
            response.status(200).send(new Response("La commande a été mise à jour", false, commande));
        } else {
            // il ne s'agit pas d'une commande car il manque des attributs
            response.status(200).send(new Response("La commande est invalide car il manque des attributs crucuax", true, {
                "obtenu": request.body,
                "attributsNecessaire": {
                    "produits": "Produit[] qui les produits de lla commande",
                    "montant": "number qui indique le prix du produit",
                    "client": "Le client qui doit valider la commande",
                    "etat": "Indique l'état actuel de la commande"
                },
                "conseil": "Vérifiez la commande que vous souhaitez mettre à jour"
            }))
        }
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/**
 * Mise à jours de plusieurs Commande par un vendeur
 */
mapossaDataTech.users.put("/:idUser/" + Commande.collectionName, async (request, response) => {
    try {
        // on regarde si le corps de la requête est un tableau
        // pour savoir que l'on est entrain de vouloir modifier plusieurs
        // commandes à la fois
        if (Array.isArray(request.body)) {
            // alors on modifie les commandes
            const commandes = await Commande.bulkUpdate(request.params.idUser, request.body);
            response.status(201).send(new Response("Les commandes bien été bien modifiés", false, commandes));
        } else
        // alors on modifie toutes les commandes par les champs donées 
        {
            //const updatedHabits = await Transaction.updateAll(request.params.idUser, request.body);
            response.status(200).send(new Response("La requête es invalide veuillez vérifier les paramètres", true, {}));
        }
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});

/**
 * Suppression d'une commande par un vendeur
 */
mapossaDataTech.users.delete("/:idUser/" + Commande.collectionName + "/:idCommande", async (request, response) => {
    try {
        // ici on supprime simplement la commande dont on a l'identifiant
        const commade = await Commande.delete(request.params.idUser, request.params.idProduit);
        response.status(200).send(new Response("La commande a été supprimée avec succès", false, commade));

    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/**
 * Supression d'un certains nombre de Commande par un vendeur
 */
mapossaDataTech.users.delete("/:idUser/" + Commande.collectionName, async (request, response) => {
    try {

        // on regarde si dans le Header la requête on a "ids"
        // pour savoir que l'on est entrain de vouloir supprimer plusieurs
        // commanddes à la fois
        if ("ids" in request.headers) {
            // on vérifie que ids est effectivement un tableau 
            if (Array.isArray(request.headers.ids)) {
                // alors on supprime les commandes
                const commandes = await Commande.bulkDelete(request.params.idUser, request.headers.ids);
                response.status(201).send(new Response("Les commandes ont été bien supprimées", false, commandes));
            } else {
                // il ya un problème : ids doit etre un tableau contenant les identifiant des comm andes que 
                // l'on souhaite supprimer
                response.status(200).send(new Response("ids doit etre un tableau contenant les identifiant des commmandes à supprimer", true, { "reçu": typeof request.headers.ids, "attendu": "Array of string" }));
            }
        } else
        // alors on soupprime toutes les commandes de l'utilisateur
        // puisqu'il n'y a pas de spécification
        {
            const commandes = await Commande.deleteAll(request.params.idUser);
            response.status(200).send(new Response("Toutes les commandes ont été supprimées avec succès", false, commandes));
        }
    } catch (error) {
        response.status(500).send(new Response("Une érreur s'est produite", true, error));
    }
});
/**
 * Envoi d'une commande à un client
 */
mapossaDataTech.users.patch("/:idUser/" + Commande.collectionName + "/:idCommande", async (request, response) => {
    try {
        // on récupére la commande à envoyer
        if (!Commande.isCommande(request.body)) {
            response.status(200).send(new Response("Le corps de la requête reçu nn'est pas une commande car il manque les attibuts cruxiaux", true, {
                "obtenu": request.body,
                "attributsAttendu": {
                    "produits": "Tableau de prosuit de la commande",
                    "montant": "Montant de la commande",
                    "client": "le client qui doit valider la commande",
                    "etat": "L'état actuel de la commande"
                }
            }));
        } else {
            const commande = Commande.normalize(request.body);
            await commande.envoyer(request.params.idUser);
            response.send(new Response("La commande a été validé avec succès", false, commande));
        }


    } catch (error) {
        functions.logger.log(error);
        response.send(new Response("Une erreur est survennue", true, error));
    }
})
/*************************** FIN COMMANDE ****************************/


/*************************** Début SMS ****************************/

mapossaDataTech.sms.post("/", async (request, response) => {
    try {
        if (!("data" in request.body)) throw "L'object envoyé doit contenir le champ data";
        if (!(Array.isArray(request.body.data))) throw "le champ data doit etre un tableau contenant les sms à envoyer";
        if ("hasModel" in request.headers) {
            if (request.headers.hasModel) {
                const res = await SMS.withModelBulkInsert(request.body.data);
                response.status(201).json(new Response("Les sms ont été enregistrés avec succès", false, res));

            } else {
                const res = await SMS.withoutModelBulkInsert(request.body.data);
                response.status(201).json(new Response("Les sms ont été enregistrés avec succès", false, res));

            }
        } else {
            const res = await SMS.bulkInsert(request.body.data);
            response.status(201).json(new Response("Les sms ont été enregistrés avec succès", false, res));

        }

    } catch (error) {
        response.status(500).json(new Response("Une érreur est survennue", true, error));
    }
})

mapossaDataTech.sms.get("/", async (request, response) => {
    try {
        response.status(200).json(new Response("Voici tous les sms", false, await SMS.getAll()))
    } catch (error) {
        response.status(500).json(new Response("Une érreur est survennue", true, error));
    }
})


export const sms = functions.https.onRequest(mapossaDataTech.sms)
/*************************** Fin SMS ****************************/


/*************************** Operateurs Financiers ****************************/

mapossaDataTech.operateurFinanciers.get("/", async (request, response) => {

    try {
        const queryParams = request.query;
        let ops
        if ("type" in queryParams) {
            ops = await OperateursFinanciers.getByType(queryParams.type as string)
        } else {
            ops = await OperateursFinanciers.getAll();
        }

        if (ops.empty) {
            response.status(200).send(new Response("Il n'y pas d'operateurs financiers enregistré pour le moment", false, []))
        } else {
            let res = ops.docs.map(function (op) {
                return { id: op.id, ...op.data() };
            })
            response.status(200).send(new Response("Voici tous les opératuers financiers", false, res))

        }

    } catch (error) {
        handleError(error, response);
    }

})

export const operateurFinanciers = functions.https.onRequest(mapossaDataTech.operateurFinanciers);

/*************************** Fin Operateurs Financiers ****************************/

/*************************** Operateurs Financiers ****************************/

mapossaDataTech.logoCategories.get("/", async (request, response) => {

    try {

        const logos = await MapossaDataTech.getAllLogoOfCategorie();
        if (logos.empty) response.status(200).send(new Response("Il n'ya aucun logo", false, []));
        else {
            let tabL = logos.docs.map((l) => l.data());
            response.status(200).send(new Response("Voici tous les logos des catégories", false, tabL))
        }

    } catch (error) {
        handleError(error, response);
    }

})

export const logoCategories = functions.https.onRequest(mapossaDataTech.logoCategories);


mapossaDataTech.mapossaScrapping.get("/", (request, response) => {
    try {
        response.status(201).send(new Response("Voici les informations actuelles sur mapossaScrapping", false, mapossaScrappingData))
    } catch (error) {
        handleError(error, response)
    }

})

export const mapossaScrapping = functions.https.onRequest(mapossaDataTech.mapossaScrapping);

mapossaDataTech.clientErrors.post("/", async (request, response) => {

    try {
        await ClientError.saveClientError(request.body);

        response.status(201).send(new Response("Nous avons bien reçu le problème", false))

    } catch (error) {
        handleError(error, response)
    }
})

export const clientErrors = functions.https.onRequest(mapossaDataTech.clientErrors)

mapossaDataTech.scraping.post("/", (request, response) => {

})



export const scraping = functions.https.onRequest(mapossaDataTech.scraping);