

//import CarteDeFidelite from "./mapossaBusiness/carteDeFidelite";
//import Offre from "./mapossaBusiness/offre";
import { initialType } from "./@type";
import MapossaError from "./mapossaError";
import Categorie from "./mapossaSmartWallet/categorie";
//import Categorie from "./mapossaSmartWallet/categorie";
import CompteFinancier from "./mapossaSmartWallet/compteFinancier";
import Transaction from "./mapossaSmartWallet/transaction";
import User from "./user";
//import { createUserOnAdalo } from "../adalo/request";


/**
 * Cette clase représente toutes les actions à répercussions de 
 * Mapossa dataTech
 */
export default class MapossaDataTech {

    /**
     * 
     * @param idUser 
     * @param transaction 
     * @returns 
     */
    public static async creerTransaction(idUser: string, transaction: any) {
        // "montant" in prototype && "typeFinal" in prototype && "idCompte" in prototype  && "flux" in prototype
        if (!(Transaction.isTransaction(transaction))) throw new MapossaError("La transaction créer n'est pas valide car il manqque : un des 4 attributs accountId, finaltype,amount ou flux", transaction);
        console.log(idUser);
        console.log(transaction);
        const c = await CompteFinancier.getById(idUser, transaction.accountId as string);

        if (!c.exists) throw new Error("Le compte de la transaction que l'on souhaite créer n'existe ");

        const compte = c.data() as CompteFinancier;

        if (transaction.flux == "Sortant") {
            await compte.retirer(idUser, transaction.amount as number);
        } else if (transaction.flux == "Entrant") {
            await compte.deposer(idUser, transaction.amount as number);
        } else {
            throw new Error("La transaction que l'on souhaite créer a un flux invalide");
        }

        let currentTransaction : Transaction; 
        if (!(transaction instanceof Transaction)) {currentTransaction = Transaction.normalize(transaction)}
        else {
            currentTransaction = transaction;
        };
        await currentTransaction.create(idUser);

        const ids: {
            idMere: string,
            idFrais?: string
        } = { idMere: currentTransaction.id as string };

        if ( currentTransaction.fees && currentTransaction.fees > 0) ids.idFrais = await transaction.createFrais(idUser);

        return ids;

    }
    /**
     * 
     * @param idUser 
     * @param transaction 
     * @param idCompteDest 
     * @returns 
     */
    public static async creerTransactionVirement(idUser: string, transaction: any, idCompteDest: string) {

        if (!(Transaction.isTransaction(transaction))) throw new MapossaError("La transaction créer n'est pas valide ", transaction);
        if (!(transaction.finalType == "Virement")) throw new MapossaError("Le virement que l'on souhaite créer n'a pas comme type final virement");

        // console.log(idUser);
        // console.log(transaction);
        const c = await CompteFinancier.getById(idUser, transaction.accountId as string);
        if (!c.exists) throw new MapossaError("Le compte du virement que l'on souhaite créer n'existe pas ");

        const cDest = await CompteFinancier.getById(idUser, idCompteDest);
        if (!cDest.exists) throw new MapossaError("Le compte destinataire du virement n'existe pas ");

        const compte = c.data() as CompteFinancier;
        //const compteDest = cDest.data() as CompteFinancier;

        const ids: {
            idMere?: string,
            idFrais?: string,
            idFille?: string,
        } = {};


        if (transaction.flux == "Sortant") {
            compte.retirer(idUser, transaction.amount as number);
            let virement2 = Transaction.normalize(transaction);
            virement2.accountId = idCompteDest;
            virement2.flux = "Entrant";
            virement2.fees = 0;
            let idsV2 = await MapossaDataTech.creerTransaction(idUser, virement2);
            ids.idFille = idsV2.idMere;
        } else if (transaction.flux == "Entrant") {

            throw new MapossaError("Le flux d'un virement doit etre sortant pour le compte émetant le virement", { "fluxRecu": "Entrant", "idCompteConcerne": compte.id })
            //compte.deposer(idUser, transaction.montant);

        } else {
            throw new MapossaError("La transaction que l'on souhaite créer a un flux invalide", { "fluxRecu": transaction.flux });
        }

        if (!(transaction instanceof Transaction)) transaction = Transaction.normalize(transaction);
        await transaction.create(idUser);
        ids.idMere = transaction.id;

        if ("frais" in transaction && transaction.frais > 0) ids.idFrais = await transaction.createFrais(idUser);

        return ids;
    }
    /**
     * 
     * @param idUser 
     * @param compte 
     * @returns 
     */
    public static async creerCompteFinancier(idUser: string, compte: any) {

        if (!CompteFinancier.isCompteFinancier(compte)) throw new MapossaError("Le compte financier envoyé n'est pas valide");
        if ("numero" in compte) {
            const compteSN = await CompteFinancier.getWithNumber(idUser, compte.numero)
            if (!(compteSN.empty)) throw new MapossaError("Un compte financier avec ce numéro existe déjà", compteSN.docs);
        }

        compte = CompteFinancier.normalize(compte);

        compte.sommeEntree = 0;
        compte.sommeSortie = 0;
        compte.soldeInitial = compte.solde;

        let id = await CompteFinancier.create(idUser, compte)
        const ids: {
            idCompte: string,
            idTransactionInitialisation?: string
        } = {
            idCompte: id,
        }
        /**
         * On ne créee plus la transacton d'initialisation
         */
        // if (compte.solde > 0) {
        //     let transactionInit = new Transaction();

        //     transactionInit.idCompte = compte.id;
        //     transactionInit.typeInitial = "Initialisation";
        //     transactionInit.typeFinal = "Revenu";
        //     transactionInit.montant = compte.solde;
        //     transactionInit.flux = "Entrant";
        //     transactionInit.create(idUser);
        //     ids.idTransactionInitialisation = transactionInit.id;
        // }
        //CompteFinancier.create(id)
        return ids;
    }


    public static async modifierCompteFinancier(idUser: string, compte: any) {
        console.log("débutons la mise à jour du compte")
        if (!("solde" in compte)) throw new MapossaError("Le compte financier envoyé n'est pas valide", CompteFinancier);
        const oldDataCompteRef = await CompteFinancier.getById(idUser, compte.id as string);

        const newSolde = compte.solde;

        if (!oldDataCompteRef.exists) throw new MapossaError("Le compte que l'on souhaite modifier n'existe pas ");

        const oldDataCompte = oldDataCompteRef.data() as CompteFinancier;
        console.log("voici les data de l'ancien compte");
        console.log(oldDataCompte)
        console.log("voici le nouveau solde compte");
        console.log(newSolde);

        const diff = oldDataCompte.solde - newSolde;

        if (diff != 0) {
            console.log("La différence existe, créons la trnasactions d'ajustement")
            const ids: {
                idCompte: string,
                idTransactionAjustementSolde?: string
            } = {
                idCompte: compte.id as string,
            }
            // newDataCompte.solde = oldDataCompte.solde;
            // newDataCompte.sommeEntree = oldDataCompte.sommeEntree;
            // newDataCompte.sommeSortie = oldDataCompte.sommeSortie
            // newDataCompte.soldeInitial = oldDataCompte.soldeInitial;

            await CompteFinancier.update(idUser, { id: oldDataCompte.id, ...compte })

            if (diff > 0) {
                const transactionAjustementDeSolde = new Transaction();
                transactionAjustementDeSolde.amount = Math.abs(diff);
                transactionAjustementDeSolde.initialType = "Ajustement";
                transactionAjustementDeSolde.finalType = "Depense";
                transactionAjustementDeSolde.flux = "Sortant";
                transactionAjustementDeSolde.accountId = oldDataCompte.id;
                let id = await MapossaDataTech.creerTransaction(idUser, transactionAjustementDeSolde);
                ids.idTransactionAjustementSolde = id.idMere;

            } else {
                const transactionAjustementDeSolde = new Transaction();
                transactionAjustementDeSolde.amount = Math.abs(diff);
                transactionAjustementDeSolde.initialType = "Ajustement";
                transactionAjustementDeSolde.finalType = "Revenu";
                transactionAjustementDeSolde.flux = "Entrant";
                transactionAjustementDeSolde.accountId = oldDataCompte.id;
                let id = await MapossaDataTech.creerTransaction(idUser, transactionAjustementDeSolde);
                ids.idTransactionAjustementSolde = id.idMere;
            }

            return ids;
        } else {
            const newDatacompte = await CompteFinancier.update(idUser, { id: oldDataCompte.id, ...compte })

            return newDatacompte;
        }

    }

    public static async suprimeTransaction(idUser: string, idTransaction: string) {

        let transaction = (await Transaction.getById(idUser, idTransaction)) as Transaction;

        const trransactionsFilles = await transaction.getAllOf(idUser);
        if (!trransactionsFilles.empty) {
            const promises: Promise<any>[] = [];
            trransactionsFilles.docs.forEach((t) => {
                if (t.exists) {
                    promises.push(MapossaDataTech.suprimeTransaction(idUser, t.id))
                }
            })
            await Promise.all(promises);
        }


        let refCompte = await CompteFinancier.getById(idUser, transaction.accountId as string);
        if (!refCompte.exists) throw new MapossaError("Le compte de la transaction que l'on souhaite supprimer n'existe pas ", { "idCompteRecu": transaction.accountId });
        let compte = refCompte.data() as CompteFinancier;

        if (transaction.flux = "Entrant") {
            compte.sommeEntree -= transaction.amount as number;
            compte.updateSolde(idUser);
        } else if (transaction.flux = "Sortant") {
            compte.sommeEntree -= transaction.amount as number;
            compte.updateSolde(idUser);
        } else {
            throw new MapossaError("Le flux de la transaction que l'on souhaite supprimer n'est pas valide", { "fluxRecu": transaction.flux });
        }
        await Transaction.delete(idUser, idTransaction);
    }

    public static async updateTransaction(idUser: string, bodyTransacion: any, idTransaction: string) {

        console.log(bodyTransacion);
        
        const transaction = (await Transaction.getById(idUser, idTransaction) )as Transaction ;

       

        let currentTransaction: Transaction;

        if (!(bodyTransacion instanceof Transaction)) {
            currentTransaction = Transaction.normalize(bodyTransacion);
        } else {
            currentTransaction = bodyTransacion;
        }

        let refCompte = await CompteFinancier.getById(idUser, transaction.accountId as string);
        if (!refCompte.exists) throw new MapossaError("Le compte de la transaction que l'on souhaite modifier n'existe pas", { "idCompteRecu": transaction.accountId });
        let compte = refCompte.data() as CompteFinancier;

        if (currentTransaction.isAuto) {

            switch (currentTransaction.initialType) {
                case "Depôt":
                    switch (currentTransaction.decision) {
                        case "Moi même":
                            currentTransaction.finalType == "Virement";
                            break;

                        case "Quelqu'un d'autre":
                            currentTransaction.finalType == "Revenu";
                            break;
                    }
                    break;
                case "Retrait":
                    switch (currentTransaction.decision) {
                        case "Moi même":
                            currentTransaction.finalType == "Virement";
                            break;

                        case "Quelqu'un d'autre":
                            currentTransaction.finalType == "Depense";
                            break;
                    }
                    break;
                case "Transfert":
                    switch (currentTransaction.decision) {
                        case "Entrant":
                            currentTransaction.finalType == "Revenu";
                            break;
                        case "Sortant":
                            currentTransaction.finalType == "Depense";
                            break;
                        case "Vers un de mes comptes":
                            currentTransaction.finalType == "Virement";
                            break;
                    }
                    break;
            }
            if (currentTransaction.finalType == "Virement") {
                await currentTransaction.createVirement(idUser);
            }
            if ( currentTransaction.fees &&  currentTransaction.fees as number > 0){
                await currentTransaction.createFrais(idUser);
            }
            
            await Transaction.update(idUser, currentTransaction , idTransaction);

        } else {
            console.log("On comence à regarder si la transacion est un virement entrant")
            if (!(transaction.finalType == "Virement" && transaction.flux == "Entrant" && (!("idParent" in transaction) || transaction.idParent == ""))) {

                console.log("Bon ce n'est pas un virement entrant");

                const trransactionsFilles = await transaction.getAllOf(idUser);
                console.log(trransactionsFilles);

                if (!trransactionsFilles.empty) {
                    const promises: Promise<any>[] = [];
                    trransactionsFilles.docs.forEach((t) => {
                        console.log("checkons la transaction i");
                        console.log(t.data());
                        if (t.exists) {
                            if (t.data().finalType == "Virement" && t.data().flux == "Entrant") {
                                let nt = t.data();
                                nt.amount = transaction.amount;
                                promises.push(MapossaDataTech.updateTransaction(idUser, nt, t.id))

                            } else if (t.data().finalType == "Depense" && t.data().fees == 0) {
                                console.log("On est sur que c'est un frais financier");
                                let frais = t.data();
                                console.log(frais.amount);
                                console.log(currentTransaction.fees);
                                if (frais.amount != currentTransaction.fees) {
                                    frais.amount = currentTransaction.fees as number;
                                    promises.push(MapossaDataTech.updateTransaction(idUser, frais, frais.id as string));
                                }

                            }
                        }
                    })
                    await Promise.all(promises);
                }
            }

            const amounCurrentT = currentTransaction.amount as number;

            const diff = transaction.amount as number - amounCurrentT;
            // diminution

            if (transaction.flux = "Entrant") {
                compte.sommeEntree += diff;
                compte.updateSolde(idUser);
            } else if (transaction.flux = "Sortant") {
                compte.sommeEntree += diff;
                compte.updateSolde(idUser);
            } else {
                throw new MapossaError("Le flux de la transaction que l'on souhaite modifer n'est pas valide", { "fluxRecu": transaction.flux });
            }
            //augmentation

            currentTransaction.id = transaction.id;
            await Transaction.update(idUser, currentTransaction , idTransaction);
        }


    }
    /*-------------------------------------------------------------------------------------------------------------------------*/

    public static async creerCarteDeFidelite(carteDeFidelite: any) {
        // on vérifie si la carte de fidelité a les informations minimale d'une carte de fidelité
        /*  if ( ! CarteDeFidelite.isCarteDeFidelite(carteDeFidelite)) throw new MapossaError("La carte de fidelité envoyé n'est pas valide \nil manque soit l'id de l'entreprise, soit le logo");
  
      
          // on crée la carte de fielité
          let idCarte  = await CarteDeFidelite.create(carteDeFidelite);
          // on créee un offre de départ 
          let coupon = new Offre();
          throw new MapossaError("Error not Implemented", { description: "On vient de la carte de fidelité ainsi que le coupon mais la suite n'as pas été implementée"});
          //
      }
      public static async creerOffre(idCarteDeFidelite : string , offre : any ) {
          // On vérifie que l'offre est ne offre alude
  
          if (! Offre.isOffre(offre)) throw new MapossaError("L'offre que l'on souhaite créer n'est ps une offre valide car il manque soit ")
      */
    }

    public static async deleteCategorie(idUser: string, idCategorie: string) {
        /*
        // on récupère la catégorie
        let categorie  = await Categorie.getById( idUser , idCategorie);

        // on récupère les catégories filles
        */
    }
    public static async createCategorie(idUser: string, categorie: any) {

        // on vrifie si l'utiilsateur est premium
        //



        // sinon on vérifie qu'il n'a pas de catégories personnel
        const cats = await Categorie.getAllOfUser(idUser);
        let userAlreadyHasPersonnalCat = false;
        console.log("Voivci toutes les cagtégories de l'utilisateurs")
        console.log(cats)
        cats.forEach((c) => {
            if (!c.isAuto) userAlreadyHasPersonnalCat = true;
        })
        console.log("Voyons si l'utilisateur a déja une categorie auto")
        console.log(userAlreadyHasPersonnalCat)
        if (userAlreadyHasPersonnalCat) {
            if (!User.isPremium(idUser)) throw new MapossaError("Il faut passer premium pour ajouter une autre catégorie personnel");
        }
        if (!Categorie.isCategorie(categorie)) throw new MapossaError("La catégorie que l'on souhaite créer n'est pas valide ", categorie)
        categorie = Categorie.normalize(categorie);
        return await Categorie.create(idUser, categorie);
        // si il a déjçà une caégorie personelle alors on lui retounbe le fait qu'il doit passer premium

        //sinon on créee la catégorie

    }
    public static getAllLogoOfCategorie() {
        return Categorie.getAllLogo();
    }

    public static async bulkCreateTransactionAuto(idUser: string, transactions: Array<Transaction>) {

        if (transactions.length < 1) throw new MapossaError("Il faut au moins une transactions");

        const transactionPaiement = [];
        const autres = []
        for (const transaction of transactions) {
            console.log(transaction)
            if ("initialType" in transaction && transaction.initialType == "Paiement" as initialType && transaction.accountId) {
                transactionPaiement.push(MapossaDataTech.creerTransaction(idUser, transaction))
            } else {
                autres.push(transaction)
            }
        }

        /**Sauvegarde des transactions */
        await Transaction.bulkCreate(idUser, autres)
        /** Enegistement des transactions */
        await Promise.all(transactionPaiement);

    }

}
//QueryString.ParsedQs
export function setUpQuery( queryParams : any , query :FirebaseFirestore.Query<any> ) {
    for (const param in queryParams) {
        if (Object.prototype.hasOwnProperty.call(queryParams, param)) {
            const value = queryParams[param];
            console.log(query)
            switch (value) {
                case "isNotEmpty":
                    query = query.where(param, "!=", "")
                    break;
                case "":
                    query = query.where(param, "==", null)
                    break;
                default:
                    query = query.where(param, "==", value)
                    break;
            }
            console.log(value)
        }
    }
}